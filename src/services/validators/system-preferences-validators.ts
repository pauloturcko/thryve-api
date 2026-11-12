import z from "zod";
import { ThemeEnum } from "../../db/enum/theme-enum";
import { LanguagesEnum } from "../../db/enum/languages-enum";
import { CurrencyEnum } from "../../db/enum/currency-enum";
import { ValidationIssueCode } from "../../errors";

export const updateSystemPreferencesValidator = z.object({
    theme: z.enum(ThemeEnum).optional(),
    language: z.enum(LanguagesEnum).optional(),
    currency: z.enum(CurrencyEnum).optional(),
}).refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
        message: "Informe ao menos uma preferência: theme, language ou currency",
        params: {code: ValidationIssueCode.preferencesEmpty},
    }
)