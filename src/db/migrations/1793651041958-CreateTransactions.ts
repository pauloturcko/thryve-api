import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateTransactions1793651041958 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "transactions",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "user_id",
                    type: "int",
                    isNullable: false
                },
                {
                    name: "type",
                    type: "int",
                    isNullable: false
                },
                {
                    name: "income_kind",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "amount",
                    type: "numeric",
                    precision: 12,
                    scale: 2,
                    isNullable: false
                },
                {
                    name: "date",
                    type: "date",
                    isNullable: false
                },
                {
                    name: "status",
                    type: "int",
                    isNullable: false,
                    default: 0
                },
                {
                    name: "category_id",
                    type: "int",
                    isNullable: false
                },
                {
                    name: "bank_account_id",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "payment_method_id",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "card_id",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "source",
                    type: "varchar",
                    isNullable: true
                },
                {
                    name: "notes",
                    type: "text",
                    isNullable: true
                },
                {
                    name: "linked_transaction_id",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "installment_group_id",
                    type: "uuid",
                    isNullable: true
                },
                {
                    name: "installment_number",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "installment_total",
                    type: "int",
                    isNullable: true
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()"
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()"
                },
            ],
            foreignKeys: [
                new TableForeignKey({
                    columnNames: ["user_id"],
                    referencedTableName: "users",
                    referencedColumnNames: ["id"],
                    onDelete: "CASCADE"
                }),
                new TableForeignKey({
                    columnNames: ["category_id"],
                    referencedTableName: "category",
                    referencedColumnNames: ["id"],
                    onDelete: "RESTRICT"
                }),
                new TableForeignKey({
                    columnNames: ["bank_account_id"],
                    referencedTableName: "bank_account",
                    referencedColumnNames: ["id"],
                    onDelete: "RESTRICT"
                }),
                new TableForeignKey({
                    columnNames: ["payment_method_id"],
                    referencedTableName: "payment_methods",
                    referencedColumnNames: ["id"],
                    onDelete: "RESTRICT"
                }),
                new TableForeignKey({
                    columnNames: ["card_id"],
                    referencedTableName: "cards",
                    referencedColumnNames: ["id"],
                    onDelete: "RESTRICT"
                }),
                new TableForeignKey({
                    columnNames: ["linked_transaction_id"],
                    referencedTableName: "transactions",
                    referencedColumnNames: ["id"],
                    onDelete: "RESTRICT"
                }),
            ]
        }));

        await queryRunner.createIndex("transactions", new TableIndex({
            name: "IDX_transactions_user_date",
            columnNames: ["user_id", "date"]
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("transactions");
    }

}
