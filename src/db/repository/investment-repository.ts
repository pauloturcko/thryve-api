import { EntityManager, FindOptionsWhere, Repository } from "typeorm";
import { Investment } from "../models/investment";
import { appDataSource } from "../config/data-source";
import { CreateInvestmentDto, UpdateInvestmentDto } from "../DTO/investment-dto";
import { InvestmentStatusEnum } from "../enum/investment-status-enum";

type UniqueInvestment = {
    userId: number,
    slug: string,
}

type InvestmentFilters = {
    status?: InvestmentStatusEnum,
    bankAccountId?: number,
}

export class InvestmentRepository {
    private repository: Repository<Investment>

    constructor(manager: EntityManager = appDataSource.manager) {
        this.repository = manager.getRepository(Investment)
    }

    async create(data: CreateInvestmentDto): Promise<Investment> {
        return await this.repository.save(data)
    }

    async findByUnique({userId, slug}: UniqueInvestment): Promise<Investment | null> {
        return await this.repository.findOne({where: {userId, slug}})
    }

    async loadAll(userId: number, filters: InvestmentFilters = {}): Promise<Investment[]> {
        const where: FindOptionsWhere<Investment> = {userId};
        if (filters.status !== undefined) where.status = filters.status;
        if (filters.bankAccountId !== undefined) where.bankAccountId = filters.bankAccountId;

        return await this.repository.find({
            where,
            relations: {bankAccount: true, movements: true},
            order: {status: "ASC", name: "ASC"},
        })
    }

    async loadById(id: number): Promise<Investment | null> {
        return await this.repository.findOne({where: {id}})
    }

    async existsWhere(where: FindOptionsWhere<Investment>): Promise<boolean> {
        return await this.repository.exists({where})
    }

    async update(data: UpdateInvestmentDto): Promise<Investment> {
        return await this.repository.save({...data})
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }
}
