import { Between, EntityManager, FindOptionsWhere, Repository } from "typeorm";
import { Transaction } from "../models/transaction";
import { appDataSource } from "../config/data-source";
import { CreateTransactionDto, UpdateTransactionDto } from "../DTO/transaction-dto";
import { TransactionTypeEnum } from "../enum/transaction-type-enum";
import { TransactionStatusEnum } from "../enum/transaction-status-enum";
import { IncomeKindEnum } from "../enum/income-kind-enum";
import { ExpenseKindEnum } from "../enum/expense-kind-enum";

type TransactionFilters = {
    startDate?: string,
    endDate?: string,
    status?: TransactionStatusEnum,
    incomeKind?: IncomeKindEnum,
    expenseKind?: ExpenseKindEnum,
    categoryId?: number,
    paymentMethodId?: number,
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
        // Cada filtro só entra no where se veio preenchido: no TypeORM, um campo undefined no where vira "sem filtro".
        const where: FindOptionsWhere<Transaction> = {userId, type};
        if (filters.startDate && filters.endDate) where.date = Between(filters.startDate, filters.endDate);
        if (filters.status !== undefined) where.status = filters.status;
        if (filters.incomeKind !== undefined) where.incomeKind = filters.incomeKind;
        if (filters.expenseKind !== undefined) where.expenseKind = filters.expenseKind;
        if (filters.categoryId !== undefined) where.categoryId = filters.categoryId;
        if (filters.paymentMethodId !== undefined) where.paymentMethodId = filters.paymentMethodId;

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
