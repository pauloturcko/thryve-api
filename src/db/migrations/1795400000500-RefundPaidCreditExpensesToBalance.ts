import { MigrationInterface, QueryRunner } from "typeorm";

const CREDIT_EXPENSES_COUNTED = `
    SELECT t.bank_account_id, SUM(t.amount) AS total
    FROM transactions t
    JOIN bank_account a ON a.id = t.bank_account_id
    WHERE t.type = 1
      AND t.payment_method_id = 5
      AND t.status = 1
      AND t.date >= a.created_at::date
    GROUP BY t.bank_account_id
`;

export class RefundPaidCreditExpensesToBalance1795400000500 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE bank_account b SET balance = b.balance + s.total
            FROM (${CREDIT_EXPENSES_COUNTED}) s
            WHERE b.id = s.bank_account_id
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE bank_account b SET balance = b.balance - s.total
            FROM (${CREDIT_EXPENSES_COUNTED}) s
            WHERE b.id = s.bank_account_id
        `);
    }

}
