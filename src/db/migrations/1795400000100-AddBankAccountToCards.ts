import { MigrationInterface, QueryRunner, TableColumn, TableForeignKey, TableIndex } from "typeorm";

export class AddBankAccountToCards1795400000100 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("cards", new TableColumn({
            name: "bank_account_id",
            type: "int",
            isNullable: true,
        }));
        await queryRunner.createForeignKey("cards", new TableForeignKey({
            name: "FK_cards_bank_account",
            columnNames: ["bank_account_id"],
            referencedTableName: "bank_account",
            referencedColumnNames: ["id"],
            onDelete: "SET NULL",
        }));
        await queryRunner.createIndex("cards", new TableIndex({
            name: "IDX_cards_bank_account",
            columnNames: ["bank_account_id"],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropIndex("cards", "IDX_cards_bank_account");
        await queryRunner.dropForeignKey("cards", "FK_cards_bank_account");
        await queryRunner.dropColumn("cards", "bank_account_id");
    }

}
