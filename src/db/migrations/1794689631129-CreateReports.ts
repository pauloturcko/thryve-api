import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateReports1794689631129 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "reports",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "user_id", type: "int"},
                {name: "title", type: "varchar"},
                {name: "start_date", type: "date"},
                {name: "end_date", type: "date"},
                {name: "filters", type: "jsonb"},
                {name: "file_name", type: "varchar"},
                {name: "file_size", type: "int"},
                {name: "file", type: "bytea"},
                {name: "created_at", type: "timestamp", default: "now()"},
            ],
            foreignKeys: [
                new TableForeignKey({
                    columnNames: ["user_id"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                }),
            ],
            indices: [
                new TableIndex({name: "IDX_reports_user_created", columnNames: ["user_id", "created_at"]}),
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("reports");
    }

}
