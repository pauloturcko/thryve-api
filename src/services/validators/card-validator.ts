import {z} from "zod";
import {CardTypeEnum} from "../../db/enum/card-type-enum";
import {CardFlagEnum} from "../../db/enum/card-flag-enum";
import {idValidator, nameValidator, moneyValidator} from "./common-validator";
import {ValidationIssueCode} from "../../errors";

export const cardHasCredit = (cardType: CardTypeEnum) => cardType !== CardTypeEnum.debit;

export const limitRequiredMessage = "Informe o limite do cartão";

const cardFieldsValidator = z.object({
    name: nameValidator,

    cardType: z.enum(CardTypeEnum),

    cardFlag: z
        .coerce
        .string()
        .regex(/^(visa|mastercard|elo|1|2|3)$/i, "Flag de cartão inválida")
        .transform((value) => {
            const lower = value.toLowerCase();
            if (lower === "visa" || lower === "1") return CardFlagEnum.visa;
            if (lower === "mastercard" || lower === "2") return CardFlagEnum.mastercard;
            if (lower === "elo" || lower === "3") return CardFlagEnum.elo;
            return Number(value) as CardFlagEnum;
        }),

    limit: moneyValidator("Limite inválido")
        .refine((value) => value >= 100, {
            message: "O limite deve ser no mínimo 100,00",
            params: {code: ValidationIssueCode.cardLimitTooLow},
        })
        .transform((value) => value.toFixed(2))
        .nullable()
        .optional(),

    expiresIn: z
        .string()
        .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Formato deve ser MM/YY")
        .transform((value) => {
            const [month, year] = value.split("/");
            const fullYear = Number(`20${year}`);
            return new Date(fullYear, Number(month) - 1, 1);
        })
        .refine((date) => {
            const now = new Date();
            const currentMonthStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                1
            );
            return date >= currentMonthStart;
        }, {message: "Cartão inválido", params: {code: ValidationIssueCode.cardExpired}}),

    lastFourDigits: z
        .string()
        .regex(/^\d{4}$/, "Cartão inválido"),
});

export const createCardValidator = cardFieldsValidator
    .superRefine((card, ctx) => {
        if (cardHasCredit(card.cardType) && card.limit == null) {
            ctx.addIssue({
                code: "custom",
                path: ["limit"],
                message: limitRequiredMessage,
                params: {code: ValidationIssueCode.cardLimitRequired},
            });
        }
    })
    .transform((card) => ({
        ...card,
        limit: cardHasCredit(card.cardType) ? card.limit ?? null : null,
    }));

export const updateCardValidator = cardFieldsValidator
    .partial()
    .extend({
        id: idValidator,
    });

export const deleteCardValidator = z.object({
    id: idValidator,
});
