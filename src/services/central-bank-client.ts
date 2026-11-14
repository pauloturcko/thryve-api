import { IndexTypeEnum } from "../db/enum/index-type-enum";

const SERIES_CODES: Partial<Record<IndexTypeEnum, number>> = {
    [IndexTypeEnum.selic]: 11,
    [IndexTypeEnum.cdi]: 12,
    [IndexTypeEnum.ipca]: 433,
};

const REQUEST_TIMEOUT_MS = 15000;

type SgsRow = {data: string, valor: string};

export type SeriesPoint = {date: string, rate: string};

const toSgsDate = (date: string) => date.split("-").reverse().join("/");
const fromSgsDate = (date: string) => date.split("/").reverse().join("-");

export const fetchSeries = async (indexType: IndexTypeEnum, startDate: string, endDate: string): Promise<SeriesPoint[]> => {
    const code = SERIES_CODES[indexType];
    if (!code) return [];

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados`
        + `?formato=json&dataInicial=${toSgsDate(startDate)}&dataFinal=${toSgsDate(endDate)}`;
    const response = await fetch(url, {signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)});

    if (response.status === 404) return [];
    if (!response.ok) throw new Error(`SGS ${code} respondeu ${response.status}`);

    const rows = await response.json() as SgsRow[];

    return rows.map((row) => ({date: fromSgsDate(row.data), rate: row.valor}));
};
