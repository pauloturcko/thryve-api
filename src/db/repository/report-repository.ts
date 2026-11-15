import { Repository } from "typeorm";
import { Report } from "../models/report";
import { appDataSource } from "../config/data-source";
import { CreateReportDto, ReportSummaryDto } from "../DTO/report-dto";

const toSummary = ({id, title, startDate, endDate, filters, fileName, fileSize, createdAt}: Report): ReportSummaryDto =>
    ({id, title, startDate, endDate, filters, fileName, fileSize, createdAt});

export class ReportRepository {
    private repository: Repository<Report>

    constructor() {
        this.repository = appDataSource.getRepository(Report)
    }

    async create(data: CreateReportDto): Promise<ReportSummaryDto> {
        return toSummary(await this.repository.save(data))
    }

    async loadAll(userId: number): Promise<ReportSummaryDto[]> {
        const reports = await this.repository.find({where: {userId}, order: {createdAt: "DESC", id: "DESC"}})

        return reports.map(toSummary)
    }

    async loadById(id: number): Promise<Report | null> {
        return await this.repository.findOne({where: {id}})
    }

    async loadFile(id: number): Promise<Buffer | null> {
        const report = await this.repository
            .createQueryBuilder("report")
            .select("report.id")
            .addSelect("report.file")
            .where("report.id = :id", {id})
            .getOne()

        return report?.file ?? null
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete({id})
    }
}
