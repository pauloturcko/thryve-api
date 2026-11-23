import { Cards } from "../db/models/cards";

export type CardLimitSummary = {
    usedLimit: string | null;
    availableLimit: string | null;
};

const fromCents = (cents: number) => (cents / 100).toFixed(2);

export const summarizeLimit = (card: Pick<Cards, "limit">, usedCents: number): CardLimitSummary => {
    if (card.limit == null) return {usedLimit: null, availableLimit: null};

    return {
        usedLimit: fromCents(usedCents),
        availableLimit: fromCents(Math.round(Number(card.limit) * 100) - usedCents),
    };
};
