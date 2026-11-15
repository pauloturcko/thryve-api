import { BankAccount } from "../../db/models/bank-account";
import { Cards } from "../../db/models/cards";
import { Category } from "../../db/models/category";
import { InvestmentMovement } from "../../db/models/investment-movement";
import { Transaction } from "../../db/models/transaction";
import { CurrencyEnum } from "../../db/enum/currency-enum";
import { ExpenseKindEnum } from "../../db/enum/expense-kind-enum";
import { InvestmentMovementTypeEnum } from "../../db/enum/investment-movement-type-enum";
import { ReportSectionEnum } from "../../db/enum/report-section-enum";
import { TransactionStatusEnum } from "../../db/enum/transaction-status-enum";
import { InvestmentResponse } from "../investment-service";
import { ReportConfig } from "../validators/report-validator";

export type Cents = number;

export type ReportGroup = {
    label: string;
    color: string | null;
    amount: Cents;
    count: number;
    share: number;
};

export type MonthlyTotals = {
    month: string;
    incomes: Cents;
    expenses: Cents;
};

export type IncomesData = {
    items: Transaction[];
    total: Cents;
    received: Cents;
    pending: Cents;
    byCategory: ReportGroup[];
    byAccount: ReportGroup[];
};

export type ExpensesData = {
    items: Transaction[];
    total: Cents;
    paid: Cents;
    pending: Cents;
    fixed: Cents;
    variable: Cents;
    byCategory: ReportGroup[];
    byPaymentMethod: ReportGroup[];
    byCard: ReportGroup[];
    byAccount: ReportGroup[];
};

export type InvestmentsData = {
    items: InvestmentResponse[];
    movements: (InvestmentMovement & {investmentName: string})[];
    contributions: Cents;
    withdrawals: Cents;
    yields: Cents;
    invested: Cents;
    current: Cents;
    estimated: Cents;
};

export type ReportData = {
    title: string;
    ownerName: string;
    generatedAt: Date;
    timezone: string;
    currency: string;
    startDate: string;
    endDate: string;
    sections: ReportSectionEnum[];
    includeTransactions: boolean;
    filterLabels: {accounts: string[], cards: string[], categories: string[]};
    incomes: IncomesData | null;
    expenses: ExpensesData | null;
    investments: InvestmentsData | null;
    monthly: MonthlyTotals[];
};

export const CURRENCY_CODES: Record<CurrencyEnum, string> = {
    [CurrencyEnum.brl]: "BRL",
    [CurrencyEnum.usd]: "USD",
    [CurrencyEnum.aud]: "AUD",
    [CurrencyEnum.nzd]: "NZD",
    [CurrencyEnum.eur]: "EUR",
    [CurrencyEnum.gbp]: "GBP",
};

export const toCents = (amount: string | number) => Math.round(Number(amount) * 100);

const sumCents = <T>(items: T[], amountOf: (item: T) => string | number) =>
    items.reduce((total, item) => total + toCents(amountOf(item)), 0);

const groupBy = <T>(
    items: T[],
    keyOf: (item: T) => {label: string, color?: string | null} | null,
    amountOf: (item: T) => string,
): ReportGroup[] => {
    const groups = new Map<string, ReportGroup>();

    for (const item of items) {
        const key = keyOf(item);
        if (!key) continue;
        const group = groups.get(key.label) ?? {label: key.label, color: key.color ?? null, amount: 0, count: 0, share: 0};
        group.amount += toCents(amountOf(item));
        group.count += 1;
        groups.set(key.label, group);
    }

    const total = [...groups.values()].reduce((sum, group) => sum + group.amount, 0);

    return [...groups.values()]
        .map((group) => ({...group, share: total > 0 ? group.amount / total : 0}))
        .sort((a, b) => b.amount - a.amount);
};

const isSettled = (transaction: Transaction) => transaction.status === TransactionStatusEnum.paid;

export const buildIncomes = (items: Transaction[]): IncomesData => ({
    items,
    total: sumCents(items, (item) => item.amount),
    received: sumCents(items.filter(isSettled), (item) => item.amount),
    pending: sumCents(items.filter((item) => !isSettled(item)), (item) => item.amount),
    byCategory: groupBy(items, (item) => ({label: item.category.name, color: item.category.color}), (item) => item.amount),
    byAccount: groupBy(items, (item) => item.bankAccount ? {label: item.bankAccount.name} : null, (item) => item.amount),
});

export const buildExpenses = (items: Transaction[]): ExpensesData => ({
    items,
    total: sumCents(items, (item) => item.amount),
    paid: sumCents(items.filter(isSettled), (item) => item.amount),
    pending: sumCents(items.filter((item) => !isSettled(item)), (item) => item.amount),
    fixed: sumCents(items.filter((item) => item.expenseKind === ExpenseKindEnum.fixed), (item) => item.amount),
    variable: sumCents(items.filter((item) => item.expenseKind !== ExpenseKindEnum.fixed), (item) => item.amount),
    byCategory: groupBy(items, (item) => ({label: item.category.name, color: item.category.color}), (item) => item.amount),
    byPaymentMethod: groupBy(items, (item) => item.paymentMethod ? {label: item.paymentMethod.name} : null, (item) => item.amount),
    byCard: groupBy(items, (item) => item.card ? {label: `${item.card.name} •••• ${item.card.lastFourDigits}`} : null, (item) => item.amount),
    byAccount: groupBy(items, (item) => item.bankAccount ? {label: item.bankAccount.name} : null, (item) => item.amount),
});

export const buildInvestments = (
    items: InvestmentResponse[],
    periodMovements: InvestmentMovement[],
): InvestmentsData => {
    const names = new Map(items.map((investment) => [investment.id, investment.name]));
    const movements = periodMovements
        .filter((movement) => names.has(movement.investmentId))
        .map((movement) => ({...movement, investmentName: names.get(movement.investmentId)!}));
    const ofType = (type: InvestmentMovementTypeEnum) => movements.filter((movement) => movement.type === type);

    return {
        items,
        movements,
        contributions: sumCents(ofType(InvestmentMovementTypeEnum.contribution), (movement) => movement.amount),
        withdrawals: sumCents(ofType(InvestmentMovementTypeEnum.withdrawal), (movement) => movement.amount),
        yields: sumCents(ofType(InvestmentMovementTypeEnum.yield), (movement) => movement.amount),
        invested: sumCents(items, (investment) => investment.investedAmount),
        current: sumCents(items, (investment) => investment.currentAmount),
        estimated: sumCents(items, (investment) => investment.estimatedAmount),
    };
};

export const buildMonthly = (
    startDate: string,
    endDate: string,
    incomes: Transaction[],
    expenses: Transaction[],
): MonthlyTotals[] => {
    const months: MonthlyTotals[] = [];
    const [startYear, startMonth] = startDate.split("-").map(Number);
    const last = endDate.slice(0, 7);

    for (let offset = 0; ; offset++) {
        const date = new Date(startYear, startMonth - 1 + offset, 1);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (month > last) break;
        months.push({
            month,
            incomes: sumCents(incomes.filter((item) => item.date.startsWith(month)), (item) => item.amount),
            expenses: sumCents(expenses.filter((item) => item.date.startsWith(month)), (item) => item.amount),
        });
    }

    return months;
};

export const buildFilterLabels = (
    config: Pick<ReportConfig, "bankAccountIds" | "cardIds" | "categoryIds">,
    accounts: BankAccount[],
    cards: Cards[],
    categories: Category[],
) => ({
    accounts: accounts.filter((account) => config.bankAccountIds.includes(account.id)).map((account) => account.name),
    cards: cards.filter((card) => config.cardIds.includes(card.id)).map((card) => `${card.name} •••• ${card.lastFourDigits}`),
    categories: categories.filter((category) => config.categoryIds.includes(category.id)).map((category) => category.name),
});
