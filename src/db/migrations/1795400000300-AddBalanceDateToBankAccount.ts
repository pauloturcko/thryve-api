import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

// Data em que o saldo informado no cadastro da conta vale. Lançamentos dessa data em diante mexem no saldo;
// os anteriores já estão nele. Antes a regra usava created_at, que o Postgres grava em UTC: uma conta
// cadastrada depois das 21h de Brasília ficava com a data do dia seguinte, e os lançamentos do próprio dia
// deixavam de contar no saldo.
// Contas existentes: a data do cadastro convertida para o horário de Brasília.
export class AddBalanceDateToBankAccount1795400000300 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn("bank_account", new TableColumn({
            name: "balance_date",
            type: "date",
            isNullable: true,
        }));
        await queryRunner.query(`
            UPDATE bank_account
            SET balance_date = (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
        `);
        await queryRunner.query(`ALTER TABLE bank_account ALTER COLUMN balance_date SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumn("bank_account", "balance_date");
    }

}
