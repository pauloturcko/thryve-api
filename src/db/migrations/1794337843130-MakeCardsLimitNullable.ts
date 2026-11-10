import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCardsLimitNullable1794337843130 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "limit" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "limit" DROP NOT NULL`);
        await queryRunner.query(`UPDATE "cards" SET "limit" = NULL WHERE "card_type" = 2`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "cards" SET "limit" = 0 WHERE "limit" IS NULL`);
        await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "limit" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "limit" SET DEFAULT 0`);
    }

}
