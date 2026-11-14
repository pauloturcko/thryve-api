import { Between, Repository } from "typeorm";
import { IndexRate } from "../models/index-rate";
import { appDataSource } from "../config/data-source";
import { IndexTypeEnum } from "../enum/index-type-enum";

type IndexRateRow = {
    indexType: IndexTypeEnum,
    date: string,
    rate: string,
}

export class IndexRateRepository {
    private repository: Repository<IndexRate>

    constructor() {
        this.repository = appDataSource.getRepository(IndexRate)
    }

    async saveMany(rows: IndexRateRow[]): Promise<void> {
        if (rows.length === 0) return;

        await this.repository.upsert(rows, {conflictPaths: ["indexType", "date"], skipUpdateIfNoValuesChanged: true})
    }

    async loadBetween(indexType: IndexTypeEnum, startDate: string, endDate: string): Promise<IndexRate[]> {
        return await this.repository.find({
            where: {indexType, date: Between(startDate, endDate)},
            order: {date: "ASC"},
        })
    }

    async loadLatest(indexType: IndexTypeEnum, limit = 1): Promise<IndexRate[]> {
        return await this.repository.find({where: {indexType}, order: {date: "DESC"}, take: limit})
    }

    async loadDateBounds(indexType: IndexTypeEnum): Promise<{first: string | null, last: string | null}> {
        const result = await this.repository
            .createQueryBuilder("rate")
            .select("MIN(rate.date)::text", "first")
            .addSelect("MAX(rate.date)::text", "last")
            .where("rate.index_type = :indexType", {indexType})
            .getRawOne<{first: string | null, last: string | null}>();

        return {first: result?.first ?? null, last: result?.last ?? null};
    }
}
