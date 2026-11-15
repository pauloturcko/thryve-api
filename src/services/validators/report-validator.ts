import {z} from "zod";
import {ReportSectionEnum} from "../../db/enum/report-section-enum";
import {ValidationIssueCode} from "../../errors";
import {dateValidator, idValidator} from "./common-validator";

// Um relatório cobre no máximo 5 anos: acima disso o PDF passa de centenas de páginas e a geração fica lenta.
const MAX_PERIOD_DAYS = 5 * 366;

const idListValidator = z
    .array(idValidator)
    .max(100)
    .default([])
    .transform((ids) => [...new Set(ids)]);

const isValidTimezone = (timezone: string) => {
    try {
        new Intl.DateTimeFormat("pt-BR", {timeZone: timezone});
        return true;
    } catch {
        return false;
    }
};

const daysBetween = (start: string, end: string) =>
    (Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86400000;

export const reportConfigValidator = z.object({
    title: z
        .string()
        .trim()
        .max(120)
        .nullable()
        .optional(),

    startDate: dateValidator,

    endDate: dateValidator,

    sections: z
        .array(z.enum(ReportSectionEnum))
        .min(1, "Escolha pelo menos uma seção")
        .transform((sections) => [...new Set(sections)].sort()),

    bankAccountIds: idListValidator,

    cardIds: idListValidator,

    categoryIds: idListValidator,

    // Sem as tabelas de lançamentos o relatório fica só com totais e gráficos.
    includeTransactions: z.boolean().default(true),

    // Fuso de quem pediu, para a data de emissão no cabeçalho: o servidor roda em UTC.
    timezone: z
        .string()
        .refine(isValidTimezone, {message: "Fuso horário inválido", params: {code: ValidationIssueCode.invalidTimezone}})
        .default("America/Sao_Paulo"),
}).superRefine((value, context) => {
    if (value.endDate < value.startDate) {
        context.addIssue({
            code: "custom",
            path: ["endDate"],
            message: "A data final precisa ser igual ou posterior à inicial",
            params: {code: ValidationIssueCode.invalidPeriod},
        });
    } else if (daysBetween(value.startDate, value.endDate) > MAX_PERIOD_DAYS) {
        context.addIssue({
            code: "custom",
            path: ["endDate"],
            message: "O período máximo de um relatório é de 5 anos",
            params: {code: ValidationIssueCode.invalidPeriod},
        });
    }
});

export type ReportConfig = z.infer<typeof reportConfigValidator>;

export const reportIdValidator = z.object({
    id: z.coerce.number().pipe(idValidator),
});
