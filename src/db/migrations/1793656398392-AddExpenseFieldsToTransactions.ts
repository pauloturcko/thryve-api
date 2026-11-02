import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddExpenseFieldsToTransactions1793656398392 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumns("transactions", [
            new TableColumn({
                name: "expense_kind",
                type: "int",
                isNullable: true
            }),
            new TableColumn({
                name: "description",
                type: "varchar",
                isNullable: true
            }),
            new TableColumn({
                name: "due_date",
                type: "date",
                isNullable: true
            }),
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns("transactions", ["expense_kind", "description", "due_date"]);
    }

}
