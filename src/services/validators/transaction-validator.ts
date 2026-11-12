import {z} from "zod";
import {ExpenseKindEnum} from "../../db/enum/expense-kind-enum";
import {IncomeKindEnum} from "../../db/enum/income-kind-enum";
import {TransactionStatusEnum} from "../../db/enum/transaction-status-enum";
import {dateValidator, idValidator, moneyValidator} from "./common-validator";
import {ValidationIssueCode} from "../../errors";

const amountValidator = moneyValidator("Valor inválido")
    .refine((value) => value > 0, {
        message: "O valor deve ser maior que zero",
        params: {code: ValidationIssueCode.amountNotPositive},
    })
    .transform((value) => value.toFixed(2));

export const createIncomeValidator = z.object({
    incomeKind: z.enum(IncomeKindEnum),

    amount: amountValidator,

    date: dateValidator,

    status: z
        .enum(TransactionStatusEnum)
        .default(TransactionStatusEnum.pending),

    categoryId: idValidator,

    bankAccountId: idValidator,

    source: z
        .string()
        .trim()
        .max(100)
        .nullable()
        .optional(),

    notes: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),

    linkedTransactionId: idValidator
        .nullable()
        .optional(),
});

export const updateIncomeValidator = createIncomeValidator
    .partial()
    .extend({
        id: idValidator,
        status: z.enum(TransactionStatusEnum).optional(),
    });

export const deleteTransactionValidator = z.object({
    id: idValidator,
});

export const listIncomesValidator = z.object({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido, use AAAA-MM")
        .optional(),

    status: z.coerce
        .number()
        .pipe(z.enum(TransactionStatusEnum))
        .optional(),

    incomeKind: z.coerce
        .number()
        .pipe(z.enum(IncomeKindEnum))
        .optional(),

    categoryId: z.coerce
        .number()
        .int()
        .positive()
        .optional(),
});

export const createExpenseValidator = z.object({
    expenseKind: z.enum(ExpenseKindEnum),

    categoryId: idValidator,

    description: z
        .string()
        .trim()
        .min(1, "Informe a descrição do gasto")
        .max(150),

    paymentMethodId: idValidator,

    bankAccountId: idValidator,

    cardId: idValidator
        .nullable()
        .optional(),

    amount: amountValidator,

    date: dateValidator,

    dueDate: dateValidator
        .nullable()
        .optional(),

    status: z
        .enum(TransactionStatusEnum)
        .default(TransactionStatusEnum.pending),

    installments: z
        .number()
        .int()
        .min(2, "Parcelado precisa de pelo menos 2 parcelas")
        .max(48, "O máximo é 48 parcelas")
        .optional(),

    notes: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),
});

export const updateExpenseValidator = createExpenseValidator
    .omit({installments: true})
    .partial()
    .extend({
        id: idValidator,
        status: z.enum(TransactionStatusEnum).optional(),
    });

export const listExpensesValidator = z.object({
    month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mês inválido, use AAAA-MM")
        .optional(),

    status: z.coerce
        .number()
        .pipe(z.enum(TransactionStatusEnum))
        .optional(),

    expenseKind: z.coerce
        .number()
        .pipe(z.enum(ExpenseKindEnum))
        .optional(),

    categoryId: z.coerce
        .number()
        .int()
        .positive()
        .optional(),

    paymentMethodId: z.coerce
        .number()
        .int()
        .positive()
        .optional(),
});
