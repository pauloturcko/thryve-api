import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex, TableUnique } from "typeorm";

export class CreateInvestments1794684835263 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "investments",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "user_id", type: "int"},
                {name: "bank_account_id", type: "int"},
                {name: "name", type: "varchar"},
                {name: "slug", type: "varchar"},
                {name: "index_type", type: "int"},
                {name: "index_percentage", type: "numeric", precision: 7, scale: 2, default: 100},
                {name: "spread_rate", type: "numeric", precision: 7, scale: 4, default: 0},
                {name: "maturity_date", type: "date", isNullable: true},
                {name: "status", type: "int", default: 0},
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
                new TableForeignKey({
                    columnNames: ["bank_account_id"],
                    referencedTableName: "bank_account",
                    referencedColumnNames: ["id"],
                    onDelete: "RESTRICT",
                }),
            ],
            uniques: [
                new TableUnique({name: "UQ_investments_user_slug", columnNames: ["user_id", "slug"]}),
            ],
            indices: [
                new TableIndex({name: "IDX_investments_bank_account", columnNames: ["bank_account_id"]}),
            ],
        }));

        await queryRunner.createTable(new Table({
            name: "investment_movements",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "user_id", type: "int"},
                {name: "investment_id", type: "int"},
                {name: "type", type: "int"},
                {name: "amount", type: "numeric", precision: 12, scale: 2},
                {name: "date", type: "date"},
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
                new TableForeignKey({
                    columnNames: ["investment_id"],
                    referencedTableName: "investments",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE",
                }),
            ],
            indices: [
                new TableIndex({name: "IDX_investment_movements_user_date", columnNames: ["user_id", "date"]}),
                new TableIndex({name: "IDX_investment_movements_investment_date", columnNames: ["investment_id", "date"]}),
            ],
        }));

        await queryRunner.createTable(new Table({
            name: "index_rates",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "index_type", type: "int"},
                {name: "date", type: "date"},
                {name: "rate", type: "numeric", precision: 10, scale: 6},
            ],
            uniques: [
                new TableUnique({name: "UQ_index_rates_index_date", columnNames: ["index_type", "date"]}),
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("index_rates");
        await queryRunner.dropTable("investment_movements");
        await queryRunner.dropTable("investments");
    }

}
