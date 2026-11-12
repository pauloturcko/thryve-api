import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableUnique } from "typeorm";

export class CreateGoals1794518168853 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "goals",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "user_id", type: "int"},
                {name: "name", type: "varchar"},
                {name: "slug", type: "varchar"},
                {name: "target_amount", type: "numeric", precision: 12, scale: 2, isNullable: true},
                {name: "saved_amount", type: "numeric", precision: 12, scale: 2, default: 0},
                {name: "priority", type: "int"},
                {name: "status", type: "int", default: 0},
                {name: "deadline", type: "date", isNullable: true},
                {name: "completed_at", type: "date", isNullable: true},
                {name: "notes", type: "text", isNullable: true},
                {name: "created_at", type: "timestamp", default: "now()"},
                {name: "updated_at", type: "timestamp", default: "now()"},
            ],
            foreignKeys: [
                new TableForeignKey({
                    columnNames: ["user_id"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                }),
            ],
            uniques: [
                new TableUnique({name: "UQ_goals_user_slug", columnNames: ["user_id", "slug"]}),
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("goals");
    }

}
