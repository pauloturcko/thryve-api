import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class MakeTransactionsBankAccountRequired1793654026743 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("transactions", "bank_account_id", new TableColumn({
            name: "bank_account_id",
            type: "int",
            isNullable: false
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.changeColumn("transactions", "bank_account_id", new TableColumn({
            name: "bank_account_id",
            type: "int",
            isNullable: true
        }));
    }

}
