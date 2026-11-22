import { MigrationInterface, QueryRunner } from "typeorm";

// A integração com o Pluggy foi removida. Quem já rodou as migrations de criação fica com as tabelas
// sobrando; em banco novo elas nunca existiram, por isso o IF EXISTS.
export class DropOpenFinanceTables1795400000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "pluggy_webhook_events"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "open_finance_items"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Os dados apagados não voltam; as tabelas só existiam para a integração removida.
    }

}
