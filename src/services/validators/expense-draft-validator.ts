import {z} from "zod";
import {ExpenseKindEnum} from "../../db/enum/expense-kind-enum";
import {dateValidator, idValidator} from "./common-validator";
import {amountValidator} from "./transaction-validator";

const optionalId = idValidator.nullable().optional();

// Tudo além da frase é opcional: o rascunho guarda o que deu para entender e a revisão completa o resto.
export const createExpenseDraftValidator = z.object({
    transcript: z
        .string()
        .trim()
        .min(1, "Informe o que foi dito")
        .max(500),

    description: z
        .string()
        .trim()
        .min(1)
        .max(150)
        .nullable()
        .optional(),

    amount: amountValidator
        .nullable()
        .optional(),

    date: dateValidator
        .nullable()
        .optional(),

    expenseKind: z
        .enum(ExpenseKindEnum)
        .nullable()
        .optional(),

    categoryId: optionalId,
    bankAccountId: optionalId,
    paymentMethodId: optionalId,
    cardId: optionalId,
});

export const expenseDraftIdValidator = z.object({
    id: idValidator,
});

export const confirmExpenseDraftValidator = z.object({
    draftId: idValidator,
});
