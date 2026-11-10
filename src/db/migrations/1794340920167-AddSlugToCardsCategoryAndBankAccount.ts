import { MigrationInterface, QueryRunner, TableColumn, TableUnique } from "typeorm";
import { slugify } from "../../utils/slugify";

type SlugTable = {
    table: string;
    scope: string[];
    uniqueName: string;
};

const slugTables: SlugTable[] = [
    {table: "cards", scope: ["user_id", "last_four_digits"], uniqueName: "UQ_cards_user_slug_last_four_digits"},
    {table: "category", scope: ["user_id"], uniqueName: "UQ_category_user_slug"},
    {table: "bank_account", scope: ["user_id", "account_type"], uniqueName: "UQ_bank_account_user_slug_account_type"},
];

const withColumn = (scope: string[], column: string) => [scope[0], column, ...scope.slice(1)];

const sameColumns = (a: string[], b: string[]) => a.length === b.length && a.every((column) => b.includes(column));

export class AddSlugToCardsCategoryAndBankAccount1794340920167 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const {table, scope, uniqueName} of slugTables) {
            await queryRunner.addColumn(table, new TableColumn({name: "slug", type: "varchar", isNullable: true}));

            const columns = ["id", "name", ...scope].map((column) => `"${column}"`).join(", ");
            const rows: Record<string, unknown>[] = await queryRunner.query(`SELECT ${columns} FROM "${table}" ORDER BY "id"`);

            const usedSlugs = new Set<string>();
            for (const row of rows) {
                const scopeKey = scope.map((column) => String(row[column])).join("|");
                const baseSlug = slugify(String(row.name)) || String(row.id);
                const slug = usedSlugs.has(`${scopeKey}|${baseSlug}`) ? `${baseSlug}-${row.id}` : baseSlug;

                usedSlugs.add(`${scopeKey}|${slug}`);
                await queryRunner.query(`UPDATE "${table}" SET "slug" = $1 WHERE "id" = $2`, [slug, row.id]);
            }

            await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "slug" SET NOT NULL`);

            const currentTable = await queryRunner.getTable(table);
            const nameUnique = currentTable?.uniques.find((unique) =>
                sameColumns(unique.columnNames, withColumn(scope, "name")));
            if (nameUnique) await queryRunner.dropUniqueConstraint(table, nameUnique);

            await queryRunner.createUniqueConstraint(table, new TableUnique({
                name: uniqueName,
                columnNames: withColumn(scope, "slug"),
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const {table, scope, uniqueName} of [...slugTables].reverse()) {
            const nameColumns = withColumn(scope, "name");

            await queryRunner.dropUniqueConstraint(table, uniqueName);
            await queryRunner.createUniqueConstraint(table, new TableUnique({
                name: queryRunner.connection.namingStrategy.uniqueConstraintName(table, nameColumns),
                columnNames: nameColumns,
            }));
            await queryRunner.dropColumn(table, "slug");
        }
    }

}
