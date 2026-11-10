import { AccountTypeEnum } from "../enum/account-type-enum";

export interface CreateBankAccountDto {
    userId: number;
    name: string;
    slug: string;
    accountType: AccountTypeEnum;
    balance: string
}

export type UpdateBankAccountDto  = Partial<CreateBankAccountDto> &{
    id: number,
}