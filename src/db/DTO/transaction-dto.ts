import { ExpenseKindEnum } from "../enum/expense-kind-enum";
import { IncomeKindEnum } from "../enum/income-kind-enum";
import { TransactionStatusEnum } from "../enum/transaction-status-enum";
import { TransactionTypeEnum } from "../enum/transaction-type-enum";

export interface CreateTransactionDto {
    userId: number;
    type: TransactionTypeEnum;
    incomeKind?: IncomeKindEnum | null;
    expenseKind?: ExpenseKindEnum | null;
    description?: string | null;
    dueDate?: string | null;
    amount: string;
    date: string;
    status: TransactionStatusEnum;
    categoryId: number;
    bankAccountId: number;
    paymentMethodId?: number | null;
    cardId?: number | null;
    source?: string | null;
    notes?: string | null;
    linkedTransactionId?: number | null;
    installmentGroupId?: string | null;
    installmentNumber?: number | null;
    installmentTotal?: number | null;
}

export type UpdateTransactionDto = Partial<CreateTransactionDto> & {
    id: number;
}
