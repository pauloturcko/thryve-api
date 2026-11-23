import { EntityManager, Repository } from "typeorm";
import { ExpenseDraft } from "../models/expense-draft";
import { appDataSource } from "../config/data-source";
import { CreateExpenseDraftDto } from "../DTO/expense-draft-dto";

export class ExpenseDraftRepository {
    private repository: Repository<ExpenseDraft>

    constructor(manager: EntityManager = appDataSource.manager) {
        this.repository = manager.getRepository(ExpenseDraft)
    }

    async create(data: CreateExpenseDraftDto): Promise<ExpenseDraft> {
        return await this.repository.save(this.repository.create(data))
    }

    async loadAll(userId: number): Promise<ExpenseDraft[]> {
        return await this.repository.find({where: {userId}, order: {createdAt: "DESC", id: "DESC"}})
    }

    async loadById(id: number): Promise<ExpenseDraft | null> {
        return await this.repository.findOne({where: {id}})
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }
}
