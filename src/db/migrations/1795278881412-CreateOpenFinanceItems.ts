import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateOpenFinanceItems1795278881412 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "open_finance_items",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "user_id", type: "int"},
                {name: "item_id", type: "uuid"},
                {name: "connector_name", type: "varchar"},
                {name: "connector_image_url", type: "varchar", isNullable: true},
                {name: "status", type: "varchar"},
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
            indices: [
                new TableIndex({name: "UQ_open_finance_items_item_id", columnNames: ["item_id"], isUnique: true}),
                new TableIndex({name: "IDX_open_finance_items_user", columnNames: ["user_id"]}),
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("open_finance_items");
    }

}
