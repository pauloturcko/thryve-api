import { randomUUID } from "crypto";
import { appDataSource } from "../db/config/data-source";
import { BankAccount } from "../db/models/bank-account";
import { Transaction } from "../db/models/transaction";
import { CreateTransactionDto } from "../db/DTO/transaction-dto";
import { PaymentMethods } from "../db/models/payment-methods";
import { CardTypeEnum } from "../db/enum/card-type-enum";
import { CategoryTypeEnum } from "../db/enum/category-type-enum";
import { PaymentMethodEnum } from "../db/enum/payment-method-enum";
import { TransactionStatusEnum } from "../db/enum/transaction-status-enum";
import { TransactionTypeEnum } from "../db/enum/transaction-type-enum";
import { BankAccountRepository } from "../db/repository/bank-account-repository";
import { CardsRepository } from "../db/repository/cards-repository";
import { CategoryRepository } from "../db/repository/category-repository";
import { TransactionRepository } from "../db/repository/transaction-repository";
import { UserPaymentPreferencesRepository } from "../db/repository/user-payment-preferences-repository";
import { BusinessRuleError, ForbiddenError, GenericError, NotFoundError, ErrorCode } from "../errors";
import {
    createExpenseValidator,
    createIncomeValidator,
    deleteTransactionValidator,
    listExpensesValidator,
    listIncomesValidator,
    updateExpenseValidator,
    updateIncomeValidator,
} from "./validators/transaction-validator";

const toDateString = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

const monthRange = (month: string) => {
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(year, monthNumber, 0).getDate();

    return {startDate: `${month}-01`, endDate: `${month}-${String(lastDay).padStart(2, "0")}`};
};

const addMonths = (date: string, months: number) => {
    const [year, month, day] = date.split("-").map(Number);
    const target = new Date(year, month - 1 + months, 1);
    const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

    return toDateString(new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay)));
};

const splitAmount = (amount: string, installments: number) => {
    const totalCents = Math.round(Number(amount) * 100);
    const installmentCents = Math.floor(totalCents / installments);
    const lastInstallmentCents = totalCents - installmentCents * (installments - 1);

    return Array.from({length: installments}, (_, index) =>
        ((index === installments - 1 ? lastInstallmentCents : installmentCents) / 100).toFixed(2)
    );
};

const countsInBalance = (transaction: Pick<Transaction, "status" | "date">, account: BankAccount) =>
    transaction.status === TransactionStatusEnum.paid && transaction.date >= toDateString(account.createdAt);

const balanceEffect = (transaction: Pick<Transaction, "type" | "amount">) =>
    transaction.type === TransactionTypeEnum.income ? Number(transaction.amount) : -Number(transaction.amount);

export class TransactionService {
    private transactionRepository = new TransactionRepository();
    private bankAccountRepository = new BankAccountRepository();
    private categoryRepository = new CategoryRepository();
    private cardsRepository = new CardsRepository();
    private userPaymentPreferencesRepository = new UserPaymentPreferencesRepository();

    async createIncome(userId: number, data: unknown): Promise<Transaction> {
        const parsed = createIncomeValidator.parse(data);

        await this.ensureUserHasAccount(userId);
        const account = await this.loadOwnedAccount(userId, parsed.bankAccountId);
        await this.ensureOwnedCategory(userId, parsed.categoryId, CategoryTypeEnum.income);
        if (parsed.linkedTransactionId) {
            await this.loadOwnedTransactionOfType(userId, parsed.linkedTransactionId, TransactionTypeEnum.expense);
        }

        return await appDataSource.transaction(async (manager) => {
            const transactionRepository = new TransactionRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            const transaction = await transactionRepository.create({
                userId,
                type: TransactionTypeEnum.income,
                incomeKind: parsed.incomeKind,
                amount: parsed.amount,
                date: parsed.date,
                status: parsed.status,
                categoryId: parsed.categoryId,
                bankAccountId: parsed.bankAccountId,
                source: parsed.source ?? null,
                notes: parsed.notes ?? null,
                linkedTransactionId: parsed.linkedTransactionId ?? null,
            });

            if (countsInBalance(transaction, account)) {
                await bankAccountRepository.adjustBalance(account.id, balanceEffect(transaction));
            }

            return transaction;
        });
    }

    async loadIncomes(userId: number, query: unknown): Promise<Transaction[]> {
        const {month, ...filters} = listIncomesValidator.parse(query);

        return await this.transactionRepository.loadByType(userId, TransactionTypeEnum.income, {
            ...filters,
            ...(month ? monthRange(month) : {}),
        });
    }

    async updateIncome(userId: number, data: unknown): Promise<Transaction> {
        const parsed = updateIncomeValidator.parse(data);

        const current = await this.loadOwnedTransactionOfType(userId, parsed.id, TransactionTypeEnum.income);
        const next: Transaction = {...current, ...parsed};

        if (parsed.categoryId !== undefined) {
            await this.ensureOwnedCategory(userId, parsed.categoryId, CategoryTypeEnum.income);
        }
        if (parsed.linkedTransactionId) {
            await this.loadOwnedTransactionOfType(userId, parsed.linkedTransactionId, TransactionTypeEnum.expense);
        }

        await this.saveChange(userId, current, next, (repository) => repository.update(parsed));

        return next;
    }

    async deleteIncome(userId: number, data: unknown): Promise<void> {
        const {id} = deleteTransactionValidator.parse(data);

        const current = await this.loadOwnedTransactionOfType(userId, id, TransactionTypeEnum.income);

        await this.saveChange(userId, current, null, (repository) => repository.delete(id));
    }

    async createExpense(userId: number, data: unknown): Promise<Transaction[]> {
        const parsed = createExpenseValidator.parse(data);

        await this.ensureUserHasAccount(userId);
        const account = await this.loadOwnedAccount(userId, parsed.bankAccountId);
        await this.ensureOwnedCategory(userId, parsed.categoryId, CategoryTypeEnum.expense);
        const paymentMethod = await this.ensureValidPayment(userId, parsed.paymentMethodId, parsed.cardId ?? null);
        if (parsed.installments) this.ensureInstallmentsAllowed(paymentMethod);

        const installments = parsed.installments ?? 1;
        const amounts = splitAmount(parsed.amount, installments);
        const installmentGroupId = installments > 1 ? randomUUID() : null;

        const rows: CreateTransactionDto[] = amounts.map((amount, index) => ({
            userId,
            type: TransactionTypeEnum.expense,
            expenseKind: parsed.expenseKind,
            description: parsed.description,
            amount,
            date: addMonths(parsed.date, index),
            dueDate: parsed.dueDate ? addMonths(parsed.dueDate, index) : null,
            status: index === 0 ? parsed.status : TransactionStatusEnum.pending,
            categoryId: parsed.categoryId,
            bankAccountId: parsed.bankAccountId,
            paymentMethodId: parsed.paymentMethodId,
            cardId: parsed.cardId ?? null,
            notes: parsed.notes ?? null,
            installmentGroupId,
            installmentNumber: installmentGroupId ? index + 1 : null,
            installmentTotal: installmentGroupId ? installments : null,
        }));

        return await appDataSource.transaction(async (manager) => {
            const transactionRepository = new TransactionRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            const transactions = await transactionRepository.createMany(rows);

            for (const transaction of transactions) {
                if (countsInBalance(transaction, account)) {
                    await bankAccountRepository.adjustBalance(account.id, balanceEffect(transaction));
                }
            }

            return transactions;
        });
    }

    async loadExpenses(userId: number, query: unknown): Promise<Transaction[]> {
        const {month, ...filters} = listExpensesValidator.parse(query);

        return await this.transactionRepository.loadByType(userId, TransactionTypeEnum.expense, {
            ...filters,
            ...(month ? monthRange(month) : {}),
        });
    }

    async updateExpense(userId: number, data: unknown): Promise<Transaction> {
        const parsed = updateExpenseValidator.parse(data);

        const current = await this.loadOwnedTransactionOfType(userId, parsed.id, TransactionTypeEnum.expense);
        const next: Transaction = {...current, ...parsed};

        if (parsed.categoryId !== undefined) {
            await this.ensureOwnedCategory(userId, parsed.categoryId, CategoryTypeEnum.expense);
        }
        if ((parsed.paymentMethodId !== undefined || parsed.cardId !== undefined) && next.paymentMethodId) {
            const paymentMethod = await this.ensureValidPayment(userId, next.paymentMethodId, next.cardId);
            if (next.installmentTotal) this.ensureInstallmentsAllowed(paymentMethod);
        }

        await this.saveChange(userId, current, next, (repository) => repository.update(parsed));

        return next;
    }

    async deleteExpense(userId: number, data: unknown): Promise<void> {
        const {id} = deleteTransactionValidator.parse(data);

        const current = await this.loadOwnedTransactionOfType(userId, id, TransactionTypeEnum.expense);
        if (await this.transactionRepository.hasLinkedTransactions(id)) {
            throw new GenericError(ErrorCode.expenseHasRefunds, "Este gasto tem reembolsos vinculados. Exclua os reembolsos antes.");
        }

        await this.saveChange(userId, current, null, (repository) => repository.delete(id));
    }

    private async saveChange(
        userId: number,
        current: Transaction,
        next: Transaction | null,
        persist: (repository: TransactionRepository) => Promise<unknown>,
    ): Promise<void> {
        const oldAccount = await this.loadOwnedAccount(userId, current.bankAccountId);
        const newAccount = next ? await this.loadOwnedAccount(userId, next.bankAccountId) : null;

        await appDataSource.transaction(async (manager) => {
            const transactionRepository = new TransactionRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            if (countsInBalance(current, oldAccount)) {
                await bankAccountRepository.adjustBalance(oldAccount.id, -balanceEffect(current));
            }
            if (next && newAccount && countsInBalance(next, newAccount)) {
                await bankAccountRepository.adjustBalance(newAccount.id, balanceEffect(next));
            }

            await persist(transactionRepository);
        });
    }

    private async ensureUserHasAccount(userId: number): Promise<void> {
        const accounts = await this.bankAccountRepository.loadAll(userId);
        if (accounts.length === 0) {
            throw new BusinessRuleError(ErrorCode.bankAccountRequired, "Cadastre uma conta bancária antes de lançar receitas ou gastos.");
        }
    }

    private async ensureValidPayment(userId: number, paymentMethodId: number, cardId: number | null): Promise<PaymentMethods> {
        const preference = await this.userPaymentPreferencesRepository.findByUserAndMethod(userId, paymentMethodId);
        if (!preference) throw new NotFoundError(ErrorCode.paymentMethodNotFound, "Payment method not found");
        if (!preference.isActive) {
            throw new BusinessRuleError(ErrorCode.paymentMethodDisabled, "Essa forma de pagamento está desativada nas suas configurações.");
        }

        const {paymentMethod} = preference;
        if (paymentMethod.requiresCard && !cardId) {
            throw new BusinessRuleError(ErrorCode.cardRequired, "Informe o cartão para pagamentos no crédito ou no débito.");
        }
        if (cardId) {
            const card = await this.cardsRepository.loadById(cardId);
            if (!card) throw new NotFoundError(ErrorCode.cardNotFound, "Card does not exist!");
            if (card.userId !== userId) throw new ForbiddenError();

            if (paymentMethod.id === PaymentMethodEnum.creditCard && card.cardType === CardTypeEnum.debit) {
                throw new BusinessRuleError(ErrorCode.cardDebitOnly, "Esse cartão é só de débito e não pode ser usado no crédito.");
            }
            if (paymentMethod.id === PaymentMethodEnum.debitCard && card.cardType === CardTypeEnum.credit) {
                throw new BusinessRuleError(ErrorCode.cardCreditOnly, "Esse cartão é só de crédito e não pode ser usado no débito.");
            }
        }

        return paymentMethod;
    }

    private ensureInstallmentsAllowed(paymentMethod: PaymentMethods): void {
        if (paymentMethod.id !== PaymentMethodEnum.creditCard) {
            throw new BusinessRuleError(ErrorCode.installmentsRequireCredit, "Só é possível parcelar no cartão de crédito.");
        }
    }

    private async loadOwnedTransactionOfType(userId: number, id: number, type: TransactionTypeEnum): Promise<Transaction> {
        const transaction = await this.transactionRepository.loadById(id);
        if (!transaction || transaction.type !== type) {
            throw type === TransactionTypeEnum.income
                ? new NotFoundError(ErrorCode.incomeNotFound, "Income does not exist!")
                : new NotFoundError(ErrorCode.expenseNotFound, "Expense does not exist!");
        }
        if (transaction.userId !== userId) throw new ForbiddenError();

        return transaction;
    }

    private async loadOwnedAccount(userId: number, id: number): Promise<BankAccount> {
        const account = await this.bankAccountRepository.loadById(id);
        if (!account) throw new NotFoundError(ErrorCode.bankAccountNotFound, "Bank account does not exist!");
        if (account.userId !== userId) throw new ForbiddenError();

        return account;
    }

    private async ensureOwnedCategory(userId: number, id: number, type: CategoryTypeEnum): Promise<void> {
        const category = await this.categoryRepository.loadById(id);
        if (!category) throw new NotFoundError(ErrorCode.categoryNotFound, "Category does not exist!");
        if (category.userId !== userId) throw new ForbiddenError();
        if (category.type !== type) {
            throw type === CategoryTypeEnum.income
                ? new BusinessRuleError(ErrorCode.categoryMustBeIncome, "A categoria precisa ser de receita.")
                : new BusinessRuleError(ErrorCode.categoryMustBeExpense, "A categoria precisa ser de gasto.");
        }
    }
}
