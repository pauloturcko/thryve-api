import { Between, EntityManager, FindOptionsWhere, Repository } from "typeorm";
import { InvestmentMovement } from "../models/investment-movement";
import { appDataSource } from "../config/data-source";
import { CreateInvestmentMovementDto, UpdateInvestmentMovementDto } from "../DTO/investment-dto";
import { InvestmentMovementTypeEnum } from "../enum/investment-movement-type-enum";

type InvestmentMovementFilters = {
    investmentId?: number,
    type?: InvestmentMovementTypeEnum,
    startDate?: string,
    endDate?: string,
}

export class InvestmentMovementRepository {
    private repository: Repository<InvestmentMovement>

    constructor(manager: EntityManager = appDataSource.manager) {
        this.repository = manager.getRepository(InvestmentMovement)
    }

    async create(data: CreateInvestmentMovementDto): Promise<InvestmentMovement> {
        return await this.repository.save(data)
    }

    async loadAll(userId: number, filters: InvestmentMovementFilters = {}): Promise<InvestmentMovement[]> {
        const where: FindOptionsWhere<InvestmentMovement> = {userId};
        if (filters.investmentId !== undefined) where.investmentId = filters.investmentId;
        if (filters.type !== undefined) where.type = filters.type;
        if (filters.startDate && filters.endDate) where.date = Between(filters.startDate, filters.endDate);

        return await this.repository.find({
            where,
            order: {date: "DESC", id: "DESC"},
        })
    }

    async loadByInvestment(investmentId: number): Promise<InvestmentMovement[]> {
        return await this.repository.find({where: {investmentId}, order: {date: "ASC", id: "ASC"}})
    }

    async loadById(id: number): Promise<InvestmentMovement | null> {
        return await this.repository.findOne({where: {id}})
    }

    async update(data: UpdateInvestmentMovementDto): Promise<InvestmentMovement> {
        return await this.repository.save({...data})
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }
}
