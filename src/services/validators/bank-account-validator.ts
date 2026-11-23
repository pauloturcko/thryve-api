import {z} from "zod";
import {AccountTypeEnum} from "../../db/enum/account-type-enum";
import {dateValidator, idValidator, nameValidator, moneyValidator} from "./common-validator";
import {todayInTimeZone} from "../../utils/date";

const balanceValidator = moneyValidator("Saldo inválido")
    .transform((value) => value.toFixed(2));

export const createBankAccountValidator = z.object({
    name: nameValidator,

    accountType: z.enum(AccountTypeEnum),

    balance: balanceValidator.default("0.00"),

    // Data em que o saldo vale: o front manda a data local de quem cadastra. Sem ela, hoje no horário de Brasília.
    balanceDate: dateValidator.default(() => todayInTimeZone()),
});

export const updateBankAccountValidator = createBankAccountValidator
    // Mudar a data depois mudaria quais lançamentos já estão no saldo; o saldo teria que ser recalculado.
    .omit({balanceDate: true})
    .partial()
    .extend({
        id: idValidator,
        // Sem isso o .partial() mantém o .default("0.00") e zera o saldo em todo update que não manda balance.
        balance: balanceValidator.optional(),
    });

export const deleteBankAccountValidator = z.object({
    id: idValidator,
});
