import { Repository } from "typeorm";
import { OpenFinanceItem } from "../models/open-finance-item";
import { appDataSource } from "../config/data-source";
import { SaveOpenFinanceItemDto } from "../DTO/open-finance-item-dto";

export class OpenFinanceItemRepository {
    private repository: Repository<OpenFinanceItem>

    constructor() {
        this.repository = appDataSource.getRepository(OpenFinanceItem)
    }

    async save(data: SaveOpenFinanceItemDto): Promise<OpenFinanceItem> {
        await this.repository.upsert(data, {conflictPaths: ["itemId"]})

        return (await this.repository.findOne({where: {itemId: data.itemId}}))!
    }

    async loadAll(userId: number): Promise<OpenFinanceItem[]> {
        return await this.repository.find({where: {userId}, order: {createdAt: "DESC"}})
    }

    async findByItemId(itemId: string): Promise<OpenFinanceItem | null> {
        return await this.repository.findOne({where: {itemId}})
    }

    async deleteByItemId(itemId: string): Promise<void> {
        await this.repository.delete({itemId})
    }
}
