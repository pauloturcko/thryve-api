import {z} from "zod";
import {AccountTypeEnum} from "../../db/enum/account-type-enum";
import {idValidator, nameValidator, moneyValidator} from "./common-validator";

const balanceValidator = moneyValidator("Saldo inválido")
    .transform((value) => value.toFixed(2));

export const createBankAccountValidator = z.object({
    name: nameValidator,

    accountType: z.enum(AccountTypeEnum),

    balance: balanceValidator.default("0.00"),
});

export const updateBankAccountValidator = createBankAccountValidator
    .partial()
    .extend({
        id: idValidator,
        // Sem isso o .partial() mantém o .default("0.00") e zera o saldo em todo update que não manda balance.
        balance: balanceValidator.optional(),
    });

export const deleteBankAccountValidator = z.object({
    id: idValidator,
});
