import { appDataSource } from "../db/config/data-source";
import { BankAccount } from "../db/models/bank-account";
import { Investment } from "../db/models/investment";
import { InvestmentMovement } from "../db/models/investment-movement";
import { InvestmentProjectionDto, InvestmentSummaryDto } from "../db/DTO/investment-dto";
import { IndexTypeEnum } from "../db/enum/index-type-enum";
import { InvestmentMovementTypeEnum } from "../db/enum/investment-movement-type-enum";
import { InvestmentStatusEnum } from "../db/enum/investment-status-enum";
import { BankAccountRepository } from "../db/repository/bank-account-repository";
import { InvestmentMovementRepository } from "../db/repository/investment-movement-repository";
import { InvestmentRepository } from "../db/repository/investment-repository";
import { IndexRateRepository } from "../db/repository/index-rate-repository";
import { BusinessRuleError, ErrorCode, ForbiddenError, GenericError, NotFoundError } from "../errors";
import { addDays, monthRange, toDateString } from "../utils/date";
import { IndexRateService } from "./index-rate-service";
import { projectInvestment, RateTables } from "./investment-projection";
import { slugify } from "../utils/slugify";
import {
    createInvestmentMovementValidator,
    createInvestmentValidator,
    deleteInvestmentMovementValidator,
    deleteInvestmentValidator,
    listInvestmentMovementsValidator,
    listInvestmentsValidator,
    updateInvestmentMovementValidator,
    updateInvestmentValidator,
    updateInvestmentValueValidator,
} from "./validators/investment-validator";

type MovementValues = Pick<InvestmentMovement, "type" | "amount" | "date">;

export type InvestmentResponse = Omit<Investment, "movements"> & InvestmentSummaryDto & InvestmentProjectionDto;

type RateConfig = Pick<Investment, "indexType" | "indexPercentage" | "spreadRate">;

const toCents = (amount: string) => Math.round(Number(amount) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);

const balanceEffect = ({type, amount}: Pick<MovementValues, "type" | "amount">) => {
    if (type === InvestmentMovementTypeEnum.contribution) return -Number(amount);
    if (type === InvestmentMovementTypeEnum.withdrawal) return Number(amount);
    return 0;
};

const investmentEffectInCents = ({type, amount}: Pick<MovementValues, "type" | "amount">) =>
    type === InvestmentMovementTypeEnum.withdrawal ? -toCents(amount) : toCents(amount);

const countsInBalance = (movement: MovementValues, account: BankAccount) =>
    balanceEffect(movement) !== 0 && movement.date >= toDateString(account.createdAt);

const currentAmountInCents = (movements: MovementValues[]) =>
    movements.reduce((total, movement) => total + investmentEffectInCents(movement), 0);

const summarize = (movements: MovementValues[], month: string): InvestmentSummaryDto => {
    const {startDate, endDate} = monthRange(month);
    const ordered = [...movements].sort((a, b) => a.date.localeCompare(b.date));
    const sumOf = (type: InvestmentMovementTypeEnum, from = "", to = "9999-12-31") => ordered
        .filter((movement) => movement.type === type && movement.date >= from && movement.date <= to)
        .reduce((total, movement) => total + toCents(movement.amount), 0);

    const contributions = sumOf(InvestmentMovementTypeEnum.contribution);
    const withdrawals = sumOf(InvestmentMovementTypeEnum.withdrawal);
    const yields = sumOf(InvestmentMovementTypeEnum.yield);
    const firstContribution = ordered.find((movement) => movement.type === InvestmentMovementTypeEnum.contribution);

    return {
        startDate: ordered[0]?.date ?? null,
        initialAmount: firstContribution?.amount ?? "0.00",
        investedAmount: fromCents(contributions - withdrawals),
        yieldAmount: fromCents(yields),
        yieldPercentage: contributions > 0 ? (yields / contributions * 100).toFixed(2) : null,
        currentAmount: fromCents(contributions - withdrawals + yields),
        monthYield: fromCents(sumOf(InvestmentMovementTypeEnum.yield, startDate, endDate)),
    };
};

const toResponse = (investment: Investment, movements: MovementValues[], month: string, rates: RateTables): InvestmentResponse => {
    const {movements: _movements, ...fields} = investment;
    const config = {
        indexType: investment.indexType,
        indexPercentage: Number(investment.indexPercentage),
        spreadRate: Number(investment.spreadRate),
    };

    return {...fields, ...summarize(movements, month), ...projectInvestment(config, movements, rates, toDateString(new Date()))};
};

const normalizeRateConfig = (config: RateConfig): RateConfig => {
    if (config.indexType === IndexTypeEnum.none) return {...config, indexPercentage: "100.00", spreadRate: "0.0000"};
    if (config.indexType === IndexTypeEnum.prefixed) {
        if (Number(config.spreadRate) <= 0) {
            throw new BusinessRuleError(ErrorCode.prefixedRateRequired, "Informe a taxa ao ano do investimento pré-fixado.");
        }
        return {...config, indexPercentage: "100.00"};
    }

    return config;
};

const toMap = (rows: {date: string, rate: string}[], key = (date: string) => date) =>
    new Map(rows.map((row) => [key(row.date), Number(row.rate)]));

const currentMonth = () => toDateString(new Date()).slice(0, 7);

export class InvestmentService {
    private investmentRepository = new InvestmentRepository();
    private movementRepository = new InvestmentMovementRepository();
    private bankAccountRepository = new BankAccountRepository();
    private indexRateRepository = new IndexRateRepository();
    private indexRateService = new IndexRateService();

    async create(userId: number, data: unknown): Promise<InvestmentResponse> {
        const parsed = createInvestmentValidator.parse(data);
        const rateConfig = normalizeRateConfig(parsed);
        const account = await this.loadOwnedAccount(userId, parsed.bankAccountId);
        const slug = slugify(parsed.name);

        await this.ensureUniqueName(userId, slug);

        const {investment, initialContribution} = await appDataSource.transaction(async (manager) => {
            const investmentRepository = new InvestmentRepository(manager);
            const movementRepository = new InvestmentMovementRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            const investment = await investmentRepository.create({
                userId,
                bankAccountId: parsed.bankAccountId,
                name: parsed.name,
                slug,
                ...rateConfig,
                maturityDate: parsed.maturityDate ?? null,
                status: InvestmentStatusEnum.active,
                notes: parsed.notes ?? null,
            });

            const initialContribution = await movementRepository.create({
                userId,
                investmentId: investment.id,
                type: InvestmentMovementTypeEnum.contribution,
                amount: parsed.initialAmount,
                date: parsed.date,
                notes: null,
            });

            if (countsInBalance(initialContribution, account)) {
                await bankAccountRepository.adjustBalance(account.id, balanceEffect(initialContribution));
            }

            return {investment, initialContribution};
        });

        const rates = await this.loadRates([investment], [initialContribution]);
        return toResponse(investment, [initialContribution], currentMonth(), rates);
    }

    async loadAll(userId: number, query: unknown): Promise<InvestmentResponse[]> {
        const {month, ...filters} = listInvestmentsValidator.parse(query);
        const investments = await this.investmentRepository.loadAll(userId, filters);
        const rates = await this.loadRates(investments, investments.flatMap((investment) => investment.movements));

        return investments.map((investment) => toResponse(investment, investment.movements, month ?? currentMonth(), rates));
    }

    async update(userId: number, data: unknown): Promise<InvestmentResponse> {
        const parsed = updateInvestmentValidator.parse(data);
        const current = await this.loadOwnedInvestment(userId, parsed.id);

        const slug = slugify(parsed.name ?? current.name);
        await this.ensureUniqueName(userId, slug, current.id);

        const rateConfig = normalizeRateConfig({...current, ...parsed});
        const next: Investment = {...current, ...parsed, ...rateConfig, slug};
        const movements = await this.movementRepository.loadByInvestment(current.id);
        const accountChanged = next.bankAccountId !== current.bankAccountId;
        const oldAccount = accountChanged ? await this.loadOwnedAccount(userId, current.bankAccountId) : null;
        const newAccount = accountChanged ? await this.loadOwnedAccount(userId, next.bankAccountId) : null;

        await appDataSource.transaction(async (manager) => {
            const investmentRepository = new InvestmentRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            if (oldAccount && newAccount) {
                for (const movement of movements) {
                    if (countsInBalance(movement, oldAccount)) {
                        await bankAccountRepository.adjustBalance(oldAccount.id, -balanceEffect(movement));
                    }
                    if (countsInBalance(movement, newAccount)) {
                        await bankAccountRepository.adjustBalance(newAccount.id, balanceEffect(movement));
                    }
                }
            }

            await investmentRepository.update({...parsed, ...rateConfig, slug});
        });

        const rates = await this.loadRates([next], movements);
        return toResponse(next, movements, currentMonth(), rates);
    }

    async delete(userId: number, data: unknown): Promise<void> {
        const {id} = deleteInvestmentValidator.parse(data);
        const investment = await this.loadOwnedInvestment(userId, id);
        const account = await this.loadOwnedAccount(userId, investment.bankAccountId);
        const movements = await this.movementRepository.loadByInvestment(id);

        await appDataSource.transaction(async (manager) => {
            const investmentRepository = new InvestmentRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            for (const movement of movements) {
                if (countsInBalance(movement, account)) {
                    await bankAccountRepository.adjustBalance(account.id, -balanceEffect(movement));
                }
            }

            await investmentRepository.delete(id);
        });
    }

    async updateValue(userId: number, data: unknown): Promise<InvestmentMovement> {
        const parsed = updateInvestmentValueValidator.parse(data);
        const investment = await this.loadOwnedInvestment(userId, parsed.investmentId);
        const movements = await this.movementRepository.loadByInvestment(investment.id);

        const difference = toCents(parsed.currentAmount) - currentAmountInCents(movements);
        if (difference === 0) {
            throw new BusinessRuleError(ErrorCode.investmentValueUnchanged, "O valor informado é igual ao valor atual do investimento.");
        }

        return await this.movementRepository.create({
            userId,
            investmentId: investment.id,
            type: InvestmentMovementTypeEnum.yield,
            amount: fromCents(difference),
            date: parsed.date,
            notes: parsed.notes ?? null,
        });
    }

    async createMovement(userId: number, data: unknown): Promise<InvestmentMovement> {
        const parsed = createInvestmentMovementValidator.parse(data);
        const investment = await this.loadOwnedInvestment(userId, parsed.investmentId);
        const account = await this.loadOwnedAccount(userId, investment.bankAccountId);
        const movements = await this.movementRepository.loadByInvestment(investment.id);

        this.ensureNonNegativeBalance([...movements, parsed]);

        return await appDataSource.transaction(async (manager) => {
            const movementRepository = new InvestmentMovementRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            const movement = await movementRepository.create({
                userId,
                investmentId: investment.id,
                type: parsed.type,
                amount: parsed.amount,
                date: parsed.date,
                notes: parsed.notes ?? null,
            });

            if (countsInBalance(movement, account)) {
                await bankAccountRepository.adjustBalance(account.id, balanceEffect(movement));
            }

            return movement;
        });
    }

    async loadMovements(userId: number, query: unknown): Promise<InvestmentMovement[]> {
        const {month, ...filters} = listInvestmentMovementsValidator.parse(query);
        if (filters.investmentId !== undefined) await this.loadOwnedInvestment(userId, filters.investmentId);

        return await this.movementRepository.loadAll(userId, {
            ...filters,
            ...(month ? monthRange(month) : {}),
        });
    }

    async updateMovement(userId: number, data: unknown): Promise<InvestmentMovement> {
        const parsed = updateInvestmentMovementValidator.parse(data);
        const current = await this.loadOwnedMovement(userId, parsed.id);
        const next: InvestmentMovement = {...current, ...parsed};

        if (next.type !== InvestmentMovementTypeEnum.yield && Number(next.amount) < 0) {
            throw new BusinessRuleError(ErrorCode.investmentMovementAmountNotPositive, "Aporte e resgate precisam ser maiores que zero.");
        }

        const investment = await this.loadOwnedInvestment(userId, current.investmentId);
        const account = await this.loadOwnedAccount(userId, investment.bankAccountId);
        const movements = await this.movementRepository.loadByInvestment(investment.id);

        this.ensureNonNegativeBalance(movements.map((movement) => movement.id === current.id ? next : movement));

        await appDataSource.transaction(async (manager) => {
            const movementRepository = new InvestmentMovementRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            if (countsInBalance(current, account)) {
                await bankAccountRepository.adjustBalance(account.id, -balanceEffect(current));
            }
            if (countsInBalance(next, account)) {
                await bankAccountRepository.adjustBalance(account.id, balanceEffect(next));
            }

            await movementRepository.update(parsed);
        });

        return next;
    }

    async deleteMovement(userId: number, data: unknown): Promise<void> {
        const {id} = deleteInvestmentMovementValidator.parse(data);
        const current = await this.loadOwnedMovement(userId, id);
        const investment = await this.loadOwnedInvestment(userId, current.investmentId);
        const account = await this.loadOwnedAccount(userId, investment.bankAccountId);
        const movements = await this.movementRepository.loadByInvestment(investment.id);

        this.ensureNonNegativeBalance(movements.filter((movement) => movement.id !== id));

        await appDataSource.transaction(async (manager) => {
            const movementRepository = new InvestmentMovementRepository(manager);
            const bankAccountRepository = new BankAccountRepository(manager);

            if (countsInBalance(current, account)) {
                await bankAccountRepository.adjustBalance(account.id, -balanceEffect(current));
            }

            await movementRepository.delete(id);
        });
    }

    private async loadRates(investments: RateConfig[], movements: MovementValues[]): Promise<RateTables> {
        const empty: RateTables = {businessDays: [], selic: new Map(), cdi: new Map(), ipca: new Map()};
        const needsRates = investments.some((investment) => investment.indexType !== IndexTypeEnum.none);
        if (!needsRates || movements.length === 0) return empty;

        const today = toDateString(new Date());
        const firstDate = movements.reduce((earliest, movement) => (movement.date < earliest ? movement.date : earliest), today);
        await this.indexRateService.ensureSynced(firstDate);

        const [selic, cdi, ipca] = await Promise.all([
            this.indexRateRepository.loadBetween(IndexTypeEnum.selic, firstDate, today),
            this.indexRateRepository.loadBetween(IndexTypeEnum.cdi, firstDate, today),
            this.indexRateRepository.loadBetween(IndexTypeEnum.ipca, `${addDays(firstDate, -366).slice(0, 7)}-01`, today),
        ]);

        return {
            businessDays: selic.map((row) => row.date),
            selic: toMap(selic),
            cdi: toMap(cdi),
            ipca: toMap(ipca, (date) => date.slice(0, 7)),
        };
    }

    private ensureNonNegativeBalance(movements: MovementValues[]): void {
        if (currentAmountInCents(movements) < 0) {
            throw new BusinessRuleError(ErrorCode.investmentNegativeBalance, "Com esse lançamento o investimento ficaria com valor negativo.");
        }
    }

    private async loadOwnedInvestment(userId: number, id: number): Promise<Investment> {
        const investment = await this.investmentRepository.loadById(id);
        if (!investment) throw new NotFoundError(ErrorCode.investmentNotFound, "Investment does not exist!");
        if (investment.userId !== userId) throw new ForbiddenError();

        return investment;
    }

    private async loadOwnedMovement(userId: number, id: number): Promise<InvestmentMovement> {
        const movement = await this.movementRepository.loadById(id);
        if (!movement) throw new NotFoundError(ErrorCode.investmentMovementNotFound, "Investment movement does not exist!");
        if (movement.userId !== userId) throw new ForbiddenError();

        return movement;
    }

    private async loadOwnedAccount(userId: number, id: number): Promise<BankAccount> {
        const account = await this.bankAccountRepository.loadById(id);
        if (!account) throw new NotFoundError(ErrorCode.bankAccountNotFound, "Bank account does not exist!");
        if (account.userId !== userId) throw new ForbiddenError();

        return account;
    }

    private async ensureUniqueName(userId: number, slug: string, currentId?: number): Promise<void> {
        const existing = await this.investmentRepository.findByUnique({userId, slug});
        if (existing && existing.id !== currentId) {
            throw new GenericError(ErrorCode.investmentAlreadyExists, "This investment already exists!");
        }
    }
}
