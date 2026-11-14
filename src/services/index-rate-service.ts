import { IndexTypeEnum } from "../db/enum/index-type-enum";
import { IndexRateRepository } from "../db/repository/index-rate-repository";
import { addDays, toDateString } from "../utils/date";
import { fetchSeries } from "./central-bank-client";

export const SYNCED_INDEXES = [IndexTypeEnum.selic, IndexTypeEnum.cdi, IndexTypeEnum.ipca];

const MAX_HISTORY_DAYS = 3650;
const MIN_HISTORY_DAYS = 400;
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

const lastSyncAt = new Map<IndexTypeEnum, number>();
const backfilledFrom = new Map<IndexTypeEnum, string>();

const annualFromDaily = (dailyRate: number) => ((1 + dailyRate / 100) ** 252 - 1) * 100;

export type CurrentIndexes = {
    selic: {date: string, dailyRate: string, annualRate: string} | null,
    cdi: {date: string, dailyRate: string, annualRate: string} | null,
    ipca: {month: string, monthlyRate: string, last12MonthsRate: string | null} | null,
};

export class IndexRateService {
    private indexRateRepository = new IndexRateRepository();

    async ensureSynced(startDate: string): Promise<void> {
        await Promise.all(SYNCED_INDEXES.map(async (indexType) => {
            try {
                await this.syncIndex(indexType, startDate);
            } catch (error) {
                console.error(`Falha ao sincronizar o índice ${IndexTypeEnum[indexType]} com o Banco Central`, error);
            }
        }));
    }

    async loadCurrent(): Promise<CurrentIndexes> {
        await this.ensureSynced(toDateString(new Date()));

        const [selic] = await this.indexRateRepository.loadLatest(IndexTypeEnum.selic);
        const [cdi] = await this.indexRateRepository.loadLatest(IndexTypeEnum.cdi);
        const ipca = await this.indexRateRepository.loadLatest(IndexTypeEnum.ipca, 12);

        const daily = (rate: typeof selic) => rate
            ? {date: rate.date, dailyRate: rate.rate, annualRate: annualFromDaily(Number(rate.rate)).toFixed(2)}
            : null;

        return {
            selic: daily(selic),
            cdi: daily(cdi),
            ipca: ipca.length > 0
                ? {
                    month: ipca[0].date.slice(0, 7),
                    monthlyRate: ipca[0].rate,
                    last12MonthsRate: ipca.length === 12
                        ? ((ipca.reduce((factor, month) => factor * (1 + Number(month.rate) / 100), 1) - 1) * 100).toFixed(2)
                        : null,
                }
                : null,
        };
    }

    private async syncIndex(indexType: IndexTypeEnum, startDate: string): Promise<void> {
        const today = toDateString(new Date());
        const oldestAllowed = addDays(today, -MAX_HISTORY_DAYS);
        const minimumHistory = addDays(today, -MIN_HISTORY_DAYS);
        const requested = startDate < minimumHistory ? startDate : minimumHistory;
        const from = requested < oldestAllowed ? oldestAllowed : requested;
        const {first, last} = await this.indexRateRepository.loadDateBounds(indexType);

        const alreadyRequested = (backfilledFrom.get(indexType) ?? first ?? from) <= from;
        if (first && from < first && !alreadyRequested) {
            await this.indexRateRepository.saveMany(await this.fetch(indexType, from, addDays(first, -1)));
            backfilledFrom.set(indexType, from);
        }

        const recentlySynced = Date.now() - (lastSyncAt.get(indexType) ?? 0) < SYNC_INTERVAL_MS;
        if (last && recentlySynced) return;

        await this.indexRateRepository.saveMany(await this.fetch(indexType, last ?? from, today));
        lastSyncAt.set(indexType, Date.now());
    }

    private async fetch(indexType: IndexTypeEnum, startDate: string, endDate: string) {
        const start = indexType === IndexTypeEnum.ipca ? `${startDate.slice(0, 7)}-01` : startDate;
        const points = await fetchSeries(indexType, start, endDate);

        return points.map((point) => ({indexType, date: point.date, rate: point.rate}));
    }
}
