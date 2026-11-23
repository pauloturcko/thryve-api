import { Between, EntityManager, FindOptionsWhere, In, Repository } from "typeorm";
import { Transaction } from "../models/transaction";
import { appDataSource } from "../config/data-source";
import { CreateTransactionDto, UpdateTransactionDto } from "../DTO/transaction-dto";
import { TransactionTypeEnum } from "../enum/transaction-type-enum";
import { TransactionStatusEnum } from "../enum/transaction-status-enum";
import { IncomeKindEnum } from "../enum/income-kind-enum";
import { ExpenseKindEnum } from "../enum/expense-kind-enum";
import { PaymentMethodEnum } from "../enum/payment-method-enum";

type TransactionFilters = {
    startDate?: string,
    endDate?: string,
    status?: TransactionStatusEnum,
    incomeKind?: IncomeKindEnum,
    expenseKind?: ExpenseKindEnum,
    categoryId?: number,
    paymentMethodId?: number,
    bankAccountIds?: number[],
    cardIds?: number[],
    categoryIds?: number[],
}

export class TransactionRepository {
    private repository: Repository<Transaction>

    constructor(manager: EntityManager = appDataSource.manager) {
        this.repository = manager.getRepository(Transaction)
    }

    async create(data: CreateTransactionDto) {
        return await this.repository.save(data)
    }

    async createMany(data: CreateTransactionDto[]) {
        return await this.repository.save(data)
    }

    async loadAll(userId: number): Promise<Transaction[]> {
        return await this.repository.find({where: {userId}})
    }

    async loadByType(userId: number, type: TransactionTypeEnum, filters: TransactionFilters): Promise<Transaction[]> {
        const where: FindOptionsWhere<Transaction> = {userId, type};
        if (filters.startDate && filters.endDate) where.date = Between(filters.startDate, filters.endDate);
        if (filters.status !== undefined) where.status = filters.status;
        if (filters.incomeKind !== undefined) where.incomeKind = filters.incomeKind;
        if (filters.expenseKind !== undefined) where.expenseKind = filters.expenseKind;
        if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
        if (filters.paymentMethodId !== undefined) where.paymentMethodId = filters.paymentMethodId;
        if (filters.bankAccountIds?.length) where.bankAccountId = In(filters.bankAccountIds);
        if (filters.cardIds?.length) where.cardId = In(filters.cardIds);
        if (filters.categoryIds?.length) where.categoryId = In(filters.categoryIds);

        return await this.repository.find({
            where,
            relations: {bankAccount: true, category: true, paymentMethod: true, card: true},
            order: {date: "DESC", id: "DESC"},
        })
    }

    async loadById(id: number): Promise<Transaction | null> {
        return await this.repository.findOne({where: {id}})
    }

    async hasLinkedTransactions(id: number): Promise<boolean> {
        return await this.repository.exists({where: {linkedTransactionId: id}})
    }

    async sumPendingCreditByCard(userId: number, excludeTransactionId?: number): Promise<Map<number, number>> {
        const query = this.repository
            .createQueryBuilder("transaction")
            .select("transaction.card_id", "cardId")
            .addSelect("COALESCE(SUM(ROUND(transaction.amount * 100)), 0)", "cents")
            .where("transaction.user_id = :userId", {userId})
            .andWhere("transaction.type = :type", {type: TransactionTypeEnum.expense})
            .andWhere("transaction.payment_method_id = :credit", {credit: PaymentMethodEnum.creditCard})
            .andWhere("transaction.status = :pending", {pending: TransactionStatusEnum.pending})
            .andWhere("transaction.card_id IS NOT NULL")
            .groupBy("transaction.card_id");
        if (excludeTransactionId !== undefined) query.andWhere("transaction.id <> :excludeTransactionId", {excludeTransactionId});

        const rows = await query.getRawMany<{cardId: number, cents: string}>();
        return new Map(rows.map((row) => [Number(row.cardId), Number(row.cents)]));
    }

    async existsWhere(where: FindOptionsWhere<Transaction>): Promise<boolean> {
        return await this.repository.exists({where})
    }

    async update(data: UpdateTransactionDto) {
        return await this.repository.save({...data})
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }
}
