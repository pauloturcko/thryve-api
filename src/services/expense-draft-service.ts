import { ExpenseDraft } from "../db/models/expense-draft";
import { Transaction } from "../db/models/transaction";
import { CategoryTypeEnum } from "../db/enum/category-type-enum";
import { BankAccountRepository } from "../db/repository/bank-account-repository";
import { CardsRepository } from "../db/repository/cards-repository";
import { CategoryRepository } from "../db/repository/category-repository";
import { ExpenseDraftRepository } from "../db/repository/expense-draft-repository";
import { UserPaymentPreferencesRepository } from "../db/repository/user-payment-preferences-repository";
import { BusinessRuleError, ForbiddenError, NotFoundError, ErrorCode } from "../errors";
import { TransactionService } from "./transaction-service";
import {
    confirmExpenseDraftValidator,
    createExpenseDraftValidator,
    expenseDraftIdValidator,
} from "./validators/expense-draft-validator";

// O que o app (e a extração da frase) precisa conhecer para ligar "cartão do C6" ou "mercado" a um id.
export type ExpenseDraftContext = {
    cards: {id: number, name: string, lastFourDigits: string, cardType: number}[],
    bankAccounts: {id: number, name: string, accountType: number}[],
    categories: {id: number, name: string, icon: string, color: string}[],
    paymentMethods: {id: number, name: string, slug: string, requiresCard: boolean}[],
};

export class ExpenseDraftService {
    private expenseDraftRepository = new ExpenseDraftRepository();
    private transactionService = new TransactionService();
    private bankAccountRepository = new BankAccountRepository();
    private cardsRepository = new CardsRepository();
    private categoryRepository = new CategoryRepository();
    private userPaymentPreferencesRepository = new UserPaymentPreferencesRepository();

    async loadContext(userId: number): Promise<ExpenseDraftContext> {
        const [cards, bankAccounts, categories, preferences] = await Promise.all([
            this.cardsRepository.loadAll(userId),
            this.bankAccountRepository.loadAll(userId),
            this.categoryRepository.loadAll(userId),
            this.userPaymentPreferencesRepository.loadByUserId(userId),
        ]);

        return {
            cards: cards.map(({id, name, lastFourDigits, cardType}) => ({id, name, lastFourDigits, cardType})),
            bankAccounts: bankAccounts.map(({id, name, accountType}) => ({id, name, accountType})),
            categories: categories
                .filter((category) => category.type === CategoryTypeEnum.expense)
                .map(({id, name, icon, color}) => ({id, name, icon, color})),
            paymentMethods: preferences
                .filter((preference) => preference.isActive)
                .map(({paymentMethod: {id, name, slug, requiresCard}}) => ({id, name, slug, requiresCard})),
        };
    }

    async create(userId: number, data: unknown): Promise<ExpenseDraft> {
        const parsed = createExpenseDraftValidator.parse(data);

        // Só confere se o que veio é do usuário; combinações (ex.: cartão de débito no crédito) ficam para a confirmação.
        if (parsed.categoryId) await this.ensureOwnedExpenseCategory(userId, parsed.categoryId);
        if (parsed.bankAccountId) await this.ensureOwnedAccount(userId, parsed.bankAccountId);
        if (parsed.cardId) await this.ensureOwnedCard(userId, parsed.cardId);
        if (parsed.paymentMethodId) await this.ensureActivePaymentMethod(userId, parsed.paymentMethodId);

        return await this.expenseDraftRepository.create({userId, ...parsed});
    }

    async loadAll(userId: number): Promise<ExpenseDraft[]> {
        return await this.expenseDraftRepository.loadAll(userId);
    }

    // Vira gasto com as mesmas regras de POST /expenses/register. O que não vier no corpo é completado
    // com o que o rascunho já tem, então quem revisa só precisa mandar o que faltou ou mudou.
    async confirm(userId: number, data: unknown): Promise<Transaction[]> {
        const {draftId} = confirmExpenseDraftValidator.parse(data);
        const draft = await this.loadOwnedDraft(userId, draftId);

        const payload = {...this.draftDefaults(draft), ...(data as object)};

        return await this.transactionService.createExpense(userId, payload, async (manager) => {
            await new ExpenseDraftRepository(manager).delete(draft.id);
        });
    }

    async delete(userId: number, data: unknown): Promise<void> {
        const {id} = expenseDraftIdValidator.parse(data);

        await this.loadOwnedDraft(userId, id);
        await this.expenseDraftRepository.delete(id);
    }

    private draftDefaults(draft: ExpenseDraft) {
        const defaults = {
            description: draft.description,
            amount: draft.amount,
            date: draft.date,
            expenseKind: draft.expenseKind,
            categoryId: draft.categoryId,
            bankAccountId: draft.bankAccountId,
            paymentMethodId: draft.paymentMethodId,
            cardId: draft.cardId,
        };

        // Campo vazio no rascunho não entra: assim a validação do gasto acusa o que ainda falta.
        return Object.fromEntries(Object.entries(defaults).filter(([, value]) => value !== null));
    }

    private async loadOwnedDraft(userId: number, id: number): Promise<ExpenseDraft> {
        const draft = await this.expenseDraftRepository.loadById(id);
        if (!draft) throw new NotFoundError(ErrorCode.expenseDraftNotFound, "Expense draft does not exist!");
        if (draft.userId !== userId) throw new ForbiddenError();

        return draft;
    }

    private async ensureOwnedExpenseCategory(userId: number, id: number): Promise<void> {
        const category = await this.categoryRepository.loadById(id);
        if (!category) throw new NotFoundError(ErrorCode.categoryNotFound, "Category does not exist!");
        if (category.userId !== userId) throw new ForbiddenError();
        if (category.type !== CategoryTypeEnum.expense) {
            throw new BusinessRuleError(ErrorCode.categoryMustBeExpense, "A categoria precisa ser de gasto.");
        }
    }

    private async ensureOwnedAccount(userId: number, id: number): Promise<void> {
        const account = await this.bankAccountRepository.loadById(id);
        if (!account) throw new NotFoundError(ErrorCode.bankAccountNotFound, "Bank account does not exist!");
        if (account.userId !== userId) throw new ForbiddenError();
    }

    private async ensureOwnedCard(userId: number, id: number): Promise<void> {
        const card = await this.cardsRepository.loadById(id);
        if (!card) throw new NotFoundError(ErrorCode.cardNotFound, "Card does not exist!");
        if (card.userId !== userId) throw new ForbiddenError();
    }

    private async ensureActivePaymentMethod(userId: number, id: number): Promise<void> {
        const preference = await this.userPaymentPreferencesRepository.findByUserAndMethod(userId, id);
        if (!preference) throw new NotFoundError(ErrorCode.paymentMethodNotFound, "Payment method not found");
        if (!preference.isActive) {
            throw new BusinessRuleError(ErrorCode.paymentMethodDisabled, "Essa forma de pagamento está desativada nas suas configurações.");
        }
    }
}
