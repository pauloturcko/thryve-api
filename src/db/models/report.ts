import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Users } from "./users";
import { ReportSectionEnum } from "../enum/report-section-enum";

export type ReportFilters = {
    sections: ReportSectionEnum[];
    bankAccountIds: number[];
    cardIds: number[];
    categoryIds: number[];
    includeTransactions: boolean;
};

@Entity("reports")
@Index("IDX_reports_user_created", ["userId", "createdAt"])
export class Report {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({name: "user_id", type: "int"})
    userId: number;

    @Column({type: "varchar"})
    title: string;

    @Column({name: "start_date", type: "date"})
    startDate: string;

    @Column({name: "end_date", type: "date"})
    endDate: string;

    @Column({type: "jsonb"})
    filters: ReportFilters;

    @Column({name: "file_name", type: "varchar"})
    fileName: string;

    @Column({name: "file_size", type: "int"})
    fileSize: number;

    @Column({type: "bytea", select: false})
    file: Buffer;

    @CreateDateColumn({name: "created_at", type: "timestamp"})
    createdAt: Date;

    @ManyToOne(() => Users, {onDelete: "CASCADE"})
    @JoinColumn({name: "user_id"})
    owner: Users;
}
