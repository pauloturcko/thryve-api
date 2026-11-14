import { InvestmentMovementTypeEnum } from "../enum/investment-movement-type-enum";
import { InvestmentStatusEnum } from "../enum/investment-status-enum";
import { IndexTypeEnum } from "../enum/index-type-enum";

export interface CreateInvestmentDto {
    userId: number;
    bankAccountId: number;
    name: string;
    slug: string;
    indexType: IndexTypeEnum;
    indexPercentage: string;
    spreadRate: string;
    maturityDate: string | null;
    status: InvestmentStatusEnum;
    notes: string | null;
}

export type UpdateInvestmentDto = Partial<CreateInvestmentDto> & {
    id: number;
}

export interface CreateInvestmentMovementDto {
    userId: number;
    investmentId: number;
    type: InvestmentMovementTypeEnum;
    amount: string;
    date: string;
    notes: string | null;
}

export type UpdateInvestmentMovementDto = Partial<CreateInvestmentMovementDto> & {
    id: number;
}

export interface InvestmentSummaryDto {
    startDate: string | null;
    initialAmount: string;
    investedAmount: string;
    yieldAmount: string;
    yieldPercentage: string | null;
    currentAmount: string;
    monthYield: string;
}

export interface InvestmentProjectionDto {
    estimatedAmount: string;
    estimatedYield: string;
    currentAnnualRate: string | null;
    ratesUpdatedUntil: string | null;
}
