import {z} from "zod";
import {slugify} from "../../utils/slugify";

export const idValidator = z.number().int().positive();

export const nameValidator = z
    .string()
    .trim()
    .overwrite((value) => value.replace(/\s+/g, " "))
    .min(3)
    .refine((value) => slugify(value).length > 0, "O nome precisa ter letras ou números");

// Aceita formato BR (8.000,00) e US (8,000.00), com ou sem separador de milhar e casas decimais.
const moneyRegex = /^-?(\d{1,3}(\.\d{3})*(,\d{1,2})?|\d{1,3}(,\d{3})*(\.\d{1,2})?|\d+([.,]\d{1,2})?)$/;

// Decimal tem no máximo 2 dígitos, então só o último separador seguido de 1-2 dígitos é decimal;
// qualquer outro é de milhar ("8.000" e "8,000" são oito mil, não oito).
const parseMoney = (value: string) => {
    const decimal = value.match(/[.,](\d{1,2})$/);
    const integerPart = (decimal ? value.slice(0, decimal.index) : value).replace(/[.,]/g, "");

    return Number(decimal ? `${integerPart}.${decimal[1]}` : integerPart);
};

export const moneyValidator = (message: string) => z
    .coerce
    .string()
    .regex(moneyRegex, message)
    .transform(parseMoney)
    // limit e balance são numeric(12,2): acima disso o Postgres rejeita o insert e a API devolveria 500.
    .refine((value) => Math.abs(value) < 1e10, "O valor máximo é 9.999.999.999,99");
