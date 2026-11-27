import { ExpenseKindEnum } from "../enum/expense-kind-enum";

export interface CreateExpenseDraftDto {
    userId: number;
    transcript: string;
    description?: string | null;
    amount?: string | null;
    date?: string | null;
    expenseKind?: ExpenseKindEnum | null;
    categoryId?: number | null;
    bankAccountId?: number | null;
    paymentMethodId?: number | null;
    cardId?: number | null;
}
