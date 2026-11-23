import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm";

export class CreateExpenseDrafts1795400000200 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "expense_drafts",
            columns: [
                {name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment"},
                {name: "user_id", type: "int"},
                {name: "transcript", type: "text"},
                {name: "description", type: "varchar", isNullable: true},
                {name: "amount", type: "numeric", precision: 12, scale: 2, isNullable: true},
                {name: "date", type: "date", isNullable: true},
                {name: "expense_kind", type: "int", isNullable: true},
                {name: "category_id", type: "int", isNullable: true},
                {name: "bank_account_id", type: "int", isNullable: true},
                {name: "payment_method_id", type: "int", isNullable: true},
                {name: "card_id", type: "int", isNullable: true},
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
                // Rascunho não segura exclusão: apagar a categoria, a conta ou o cartão só limpa o campo.
                new TableForeignKey({
                    columnNames: ["category_id"],
                    referencedTableName: "category",
                    referencedColumnNames: ["id"],
                    onDelete: "SET NULL",
                }),
                new TableForeignKey({
                    columnNames: ["bank_account_id"],
                    referencedTableName: "bank_account",
                    referencedColumnNames: ["id"],
                    onDelete: "SET NULL",
                }),
                new TableForeignKey({
                    columnNames: ["payment_method_id"],
                    referencedTableName: "payment_methods",
                    referencedColumnNames: ["id"],
                    onDelete: "SET NULL",
                }),
                new TableForeignKey({
                    columnNames: ["card_id"],
                    referencedTableName: "cards",
                    referencedColumnNames: ["id"],
                    onDelete: "SET NULL",
                }),
            ],
            indices: [
                new TableIndex({name: "IDX_expense_drafts_user_created", columnNames: ["user_id", "created_at"]}),
            ],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("expense_drafts");
    }

}
