import { ReportFilters } from "../models/report";

export interface CreateReportDto {
    userId: number;
    title: string;
    startDate: string;
    endDate: string;
    filters: ReportFilters;
    fileName: string;
    fileSize: number;
    file: Buffer;
}

export interface ReportSummaryDto {
    id: number;
    title: string;
    startDate: string;
    endDate: string;
    filters: ReportFilters;
    fileName: string;
    fileSize: number;
    createdAt: Date;
}
