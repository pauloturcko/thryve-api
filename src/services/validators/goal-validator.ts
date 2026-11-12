import {z} from "zod";
import {GoalPriorityEnum} from "../../db/enum/goal-priority-enum";
import {GoalStatusEnum} from "../../db/enum/goal-status-enum";
import {ValidationIssueCode} from "../../errors";
import {dateValidator, idValidator, moneyValidator, nameValidator} from "./common-validator";

const targetAmountValidator = moneyValidator("Valor inválido")
    .refine((value) => value > 0, {
        message: "O valor deve ser maior que zero",
        params: {code: ValidationIssueCode.amountNotPositive},
    })
    .transform((value) => value.toFixed(2));

const savedAmountValidator = moneyValidator("Valor inválido")
    .refine((value) => value >= 0, {
        message: "O valor guardado não pode ser negativo",
        params: {code: ValidationIssueCode.amountNegative},
    })
    .transform((value) => value.toFixed(2));

const goalFieldsValidator = z.object({
    name: nameValidator,

    targetAmount: targetAmountValidator
        .nullable()
        .optional(),

    savedAmount: savedAmountValidator.default("0.00"),

    priority: z.enum(GoalPriorityEnum),

    status: z
        .enum(GoalStatusEnum)
        .default(GoalStatusEnum.pending),

    deadline: dateValidator
        .nullable()
        .optional(),

    notes: z
        .string()
        .trim()
        .max(500)
        .nullable()
        .optional(),
});

export const createGoalValidator = goalFieldsValidator;

export const updateGoalValidator = goalFieldsValidator
    .partial()
    .extend({
        id: idValidator,
        savedAmount: savedAmountValidator.optional(),
        status: z.enum(GoalStatusEnum).optional(),
    });

export const deleteGoalValidator = z.object({
    id: idValidator,
});

export const listGoalsValidator = z.object({
    status: z.coerce
        .number()
        .pipe(z.enum(GoalStatusEnum))
        .optional(),

    priority: z.coerce
        .number()
        .pipe(z.enum(GoalPriorityEnum))
        .optional(),
});
