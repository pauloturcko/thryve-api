import { InvestmentProjectionDto } from "../db/DTO/investment-dto";
import { IndexTypeEnum } from "../db/enum/index-type-enum";
import { InvestmentMovementTypeEnum } from "../db/enum/investment-movement-type-enum";
import { InvestmentMovement } from "../db/models/investment-movement";

type MovementValues = Pick<InvestmentMovement, "type" | "amount" | "date">;

export type ProjectionConfig = {
    indexType: IndexTypeEnum,
    indexPercentage: number,
    spreadRate: number,
};

export type RateTables = {
    businessDays: string[],
    selic: Map<string, number>,
    cdi: Map<string, number>,
    ipca: Map<string, number>,
};

type Flow = {date: string, cents: number};

const toCents = (amount: string) => Math.round(Number(amount) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);

const signedCents = (movement: MovementValues) =>
    movement.type === InvestmentMovementTypeEnum.withdrawal ? -toCents(movement.amount) : toCents(movement.amount);

const isWeekday = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const weekDay = new Date(year, month - 1, day).getDay();

    return weekDay !== 0 && weekDay !== 6;
};

const nextDay = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    const next = new Date(year, month - 1, day + 1);

    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
};

const lastDayOfMonth = (month: string) => {
    const [year, monthNumber] = month.split("-").map(Number);

    return `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0")}`;
};

const businessDaysBetween = (calendar: string[], start: string, end: string) => {
    const known = calendar.filter((date) => date >= start && date < end);
    const lastKnown = calendar[calendar.length - 1];

    let cursor = lastKnown && lastKnown >= start ? nextDay(lastKnown) : start;
    while (cursor < end) {
        if (isWeekday(cursor)) known.push(cursor);
        cursor = nextDay(cursor);
    }

    return known;
};

const businessDaysInMonth = (calendar: string[], month: string) => {
    const lastDay = lastDayOfMonth(month);
    const lastKnown = calendar[calendar.length - 1];
    if (lastKnown && lastKnown >= lastDay) return calendar.filter((date) => date.startsWith(month)).length;

    let count = 0;
    for (let cursor = `${month}-01`; cursor <= lastDay; cursor = nextDay(cursor)) {
        if (isWeekday(cursor)) count++;
    }

    return count;
};

const latestKey = (rates: Map<string, number>) => [...rates.keys()].sort().pop() ?? null;

const rateOn = (rates: Map<string, number>, sortedKeys: string[], key: string) => {
    if (rates.has(key)) return rates.get(key)!;

    let found: number | undefined;
    for (const candidate of sortedKeys) {
        if (candidate > key) break;
        found = rates.get(candidate);
    }

    return found ?? (sortedKeys.length > 0 ? rates.get(sortedKeys[0])! : 0);
};

const dailyFactors = (config: ProjectionConfig, rates: RateTables, days: string[]) => {
    const spreadFactor = (1 + config.spreadRate / 100) ** (1 / 252);
    const share = config.indexPercentage / 100;

    if (config.indexType === IndexTypeEnum.prefixed) return days.map(() => spreadFactor);

    if (config.indexType === IndexTypeEnum.ipca) {
        const months = [...rates.ipca.keys()].sort();
        const daysInMonth = new Map<string, number>();

        return days.map((day) => {
            const month = day.slice(0, 7);
            if (!daysInMonth.has(month)) daysInMonth.set(month, businessDaysInMonth(rates.businessDays, month));
            const monthlyRate = rateOn(rates.ipca, months, month);

            return (1 + monthlyRate / 100 * share) ** (1 / daysInMonth.get(month)!) * spreadFactor;
        });
    }

    const series = config.indexType === IndexTypeEnum.selic ? rates.selic : rates.cdi;
    const keys = [...series.keys()].sort();

    return days.map((day) => (1 + rateOn(series, keys, day) / 100 * share) * spreadFactor);
};

const annualRate = (config: ProjectionConfig, rates: RateTables): string | null => {
    const share = config.indexPercentage / 100;
    const spread = 1 + config.spreadRate / 100;

    if (config.indexType === IndexTypeEnum.none) return null;
    if (config.indexType === IndexTypeEnum.prefixed) return config.spreadRate.toFixed(2);

    if (config.indexType === IndexTypeEnum.ipca) {
        const lastMonths = [...rates.ipca.keys()].sort().slice(-12);
        if (lastMonths.length === 0) return null;
        const accumulated = lastMonths.reduce((factor, month) => factor * (1 + rates.ipca.get(month)! / 100 * share), 1);
        const yearly = accumulated ** (12 / lastMonths.length);

        return ((yearly * spread - 1) * 100).toFixed(2);
    }

    const series = config.indexType === IndexTypeEnum.selic ? rates.selic : rates.cdi;
    const lastDay = latestKey(series);
    if (!lastDay) return null;

    return (((1 + series.get(lastDay)! / 100 * share) ** 252 * spread - 1) * 100).toFixed(2);
};

const ratesUpdatedUntil = (config: ProjectionConfig, rates: RateTables) => {
    if (config.indexType === IndexTypeEnum.selic) return latestKey(rates.selic);
    if (config.indexType === IndexTypeEnum.cdi) return latestKey(rates.cdi);
    if (config.indexType === IndexTypeEnum.ipca) return latestKey(rates.ipca);

    return null;
};

const flowsSinceLastConfirmation = (movements: MovementValues[]): Flow[] => {
    const lastConfirmation = movements
        .filter((movement) => movement.type === InvestmentMovementTypeEnum.yield)
        .reduce<string | null>((latest, movement) => (!latest || movement.date > latest ? movement.date : latest), null);

    if (!lastConfirmation) {
        return movements.map((movement) => ({date: movement.date, cents: signedCents(movement)}));
    }

    const confirmed = movements
        .filter((movement) => movement.date <= lastConfirmation)
        .reduce((total, movement) => total + signedCents(movement), 0);
    const later = movements
        .filter((movement) => movement.date > lastConfirmation)
        .map((movement) => ({date: movement.date, cents: signedCents(movement)}));

    return [{date: lastConfirmation, cents: confirmed}, ...later];
};

export const projectInvestment = (
    config: ProjectionConfig,
    movements: MovementValues[],
    rates: RateTables,
    today: string,
): InvestmentProjectionDto => {
    const confirmedCents = movements.reduce((total, movement) => total + signedCents(movement), 0);
    const flows = flowsSinceLastConfirmation(movements);

    if (config.indexType === IndexTypeEnum.none || flows.length === 0) {
        return {
            estimatedAmount: fromCents(confirmedCents),
            estimatedYield: "0.00",
            currentAnnualRate: null,
            ratesUpdatedUntil: null,
        };
    }

    const firstFlow = flows.reduce((earliest, flow) => (flow.date < earliest ? flow.date : earliest), flows[0].date);
    const days = businessDaysBetween(rates.businessDays, firstFlow, today);
    const factors = dailyFactors(config, rates, days);

    const suffix = new Array<number>(factors.length + 1).fill(1);
    for (let index = factors.length - 1; index >= 0; index--) suffix[index] = suffix[index + 1] * factors[index];

    const estimatedCents = Math.round(flows.reduce((total, flow) => {
        const start = days.findIndex((day) => day >= flow.date);
        return total + flow.cents * (start === -1 ? 1 : suffix[start]);
    }, 0));

    return {
        estimatedAmount: fromCents(estimatedCents),
        estimatedYield: fromCents(estimatedCents - confirmedCents),
        currentAnnualRate: annualRate(config, rates),
        ratesUpdatedUntil: ratesUpdatedUntil(config, rates),
    };
};
