import {z} from "zod";
import {InvestmentMovementTypeEnum} from "../../db/enum/investment-movement-type-enum";
import {InvestmentStatusEnum} from "../../db/enum/investment-status-enum";
import {IndexTypeEnum} from "../../db/enum/index-type-enum";
import {ValidationIssueCode} from "../../errors";
import {dateValidator, idValidator, moneyValidator, nameValidator} from "./common-validator";

const monthValidator = z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido, use AAAA-MM");

const positiveAmountValidator = moneyValidator("Valor inválido")
    .refine((value) => value > 0, {
        message: "O valor deve ser maior que zero",
        params: {code: ValidationIssueCode.amountNotPositive},
    })
    .transform((value) => value.toFixed(2));

const currentAmountValidator = moneyValidator("Valor inválido")
    .refine((value) => value >= 0, {
        message: "O valor não pode ser negativo",
        params: {code: ValidationIssueCode.amountNegative},
    })
    .transform((value) => value.toFixed(2));

const signedAmountValidator = moneyValidator("Valor inválido")
    .refine((value) => value !== 0, {
        message: "O valor não pode ser zero",
        params: {code: ValidationIssueCode.amountZero},
    })
    .transform((value) => value.toFixed(2));

const rateValidator = (decimals: number) => z
    .coerce
    .string()
    .trim()
    .regex(new RegExp(`^-?\\d{1,4}([.,]\\d{1,${decimals}})?$`), "Taxa inválida")
    .transform((value) => Number(value.replace(",", ".")));

const percentageValidator = rateValidator(2)
    .refine((value) => value > 0 && value <= 1000, {
        message: "O percentual do índice deve ser maior que zero e até 1000",
        params: {code: ValidationIssueCode.rateOutOfRange},
    })
    .transform((value) => value.toFixed(2));

const spreadRateValidator = rateValidator(4)
    .refine((value) => value > -100 && value <= 100, {
        message: "A taxa deve estar entre -100 e 100",
        params: {code: ValidationIssueCode.rateOutOfRange},
    })
    .transform((value) => value.toFixed(4));

const notesValidator = z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional();

export const createInvestmentValidator = z.object({
    bankAccountId: idValidator,

    name: nameValidator,

    indexType: z.enum(IndexTypeEnum),

    indexPercentage: percentageValidator.default("100.00"),

    spreadRate: spreadRateValidator.default("0.0000"),

    initialAmount: positiveAmountValidator,

    date: dateValidator,

    maturityDate: dateValidator
        .nullable()
        .optional(),

    notes: notesValidator,
});

export const updateInvestmentValidator = createInvestmentValidator
    .omit({initialAmount: true, date: true})
    .partial()
    .extend({
        id: idValidator,
        status: z.enum(InvestmentStatusEnum).optional(),
        indexPercentage: percentageValidator.optional(),
        spreadRate: spreadRateValidator.optional(),
    });

export const deleteInvestmentValidator = z.object({
    id: idValidator,
});

export const listInvestmentsValidator = z.object({
    month: monthValidator.optional(),

    status: z.coerce
        .number()
        .pipe(z.enum(InvestmentStatusEnum))
        .optional(),

    bankAccountId: z.coerce
        .number()
        .int()
        .positive()
        .optional(),
});

export const updateInvestmentValueValidator = z.object({
    investmentId: idValidator,

    currentAmount: currentAmountValidator,

    date: dateValidator,

    notes: notesValidator,
});

const movementFieldsValidator = z.object({
    investmentId: idValidator,

    type: z.enum(InvestmentMovementTypeEnum),

    amount: signedAmountValidator,

    date: dateValidator,

    notes: notesValidator,
});

const ensureSignMatchesType = (
    value: {type?: InvestmentMovementTypeEnum, amount?: string},
    context: z.RefinementCtx,
) => {
    if (value.type === InvestmentMovementTypeEnum.yield || value.amount === undefined) return;
    if (Number(value.amount) < 0) {
        context.addIssue({
            code: "custom",
            path: ["amount"],
            message: "Aporte e resgate precisam ser maiores que zero",
            params: {code: ValidationIssueCode.amountNotPositive},
        });
    }
};

export const createInvestmentMovementValidator = movementFieldsValidator
    .superRefine(ensureSignMatchesType);

export const updateInvestmentMovementValidator = movementFieldsValidator
    .omit({investmentId: true})
    .partial()
    .extend({
        id: idValidator,
    })
    .superRefine(ensureSignMatchesType);

export const deleteInvestmentMovementValidator = z.object({
    id: idValidator,
});

export const listInvestmentMovementsValidator = z.object({
    investmentId: z.coerce
        .number()
        .int()
        .positive()
        .optional(),

    type: z.coerce
        .number()
        .pipe(z.enum(InvestmentMovementTypeEnum))
        .optional(),

    month: monthValidator.optional(),
});
