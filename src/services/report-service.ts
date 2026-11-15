import { ReportSummaryDto } from "../db/DTO/report-dto";
import { CurrencyEnum } from "../db/enum/currency-enum";
import { ReportSectionEnum } from "../db/enum/report-section-enum";
import { TransactionTypeEnum } from "../db/enum/transaction-type-enum";
import { Report } from "../db/models/report";
import { BankAccountRepository } from "../db/repository/bank-account-repository";
import { CardsRepository } from "../db/repository/cards-repository";
import { CategoryRepository } from "../db/repository/category-repository";
import { InvestmentMovementRepository } from "../db/repository/investment-movement-repository";
import { ReportRepository } from "../db/repository/report-repository";
import { TransactionRepository } from "../db/repository/transaction-repository";
import { UserSystemPreferencesRepository } from "../db/repository/user-system-preferences-repository";
import { UsersRepository } from "../db/repository/users-repository";
import { AppError, ErrorCode, ForbiddenError, NotFoundError } from "../errors";
import { InvestmentService } from "./investment-service";
import { renderPdf } from "./reports/pdf-renderer";
import {
    buildExpenses,
    buildFilterLabels,
    buildIncomes,
    buildInvestments,
    buildMonthly,
    CURRENCY_CODES,
    ReportData,
} from "./reports/report-data";
import { renderFooterTemplate, renderReportHtml } from "./reports/report-template";
import { ReportConfig, reportConfigValidator, reportIdValidator } from "./validators/report-validator";

const DATA_SECTIONS = [ReportSectionEnum.incomes, ReportSectionEnum.expenses, ReportSectionEnum.investments];

const lastDayOfMonth = (date: string) => {
    const [year, month] = date.split("-").map(Number);
    return `${date.slice(0, 7)}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;
};

const formatDate = (date: string) => date.split("-").reverse().join("/");

const monthName = (date: string, withYear: boolean) => {
    const [year, month] = date.split("-").map(Number);
    const label = new Intl.DateTimeFormat("pt-BR", withYear ? {month: "long", year: "numeric"} : {month: "long"})
        .format(new Date(year, month - 1, 1));
    return label.charAt(0).toUpperCase() + label.slice(1);
};

// Meses fechados viram nome ("Novembro de 2026", "Setembro a Novembro de 2026", "Ano de 2026"); senão as duas datas.
const defaultTitle = ({startDate, endDate}: Pick<ReportConfig, "startDate" | "endDate">) => {
    const closedMonths = startDate.endsWith("-01") && endDate === lastDayOfMonth(endDate);
    if (!closedMonths) return `${formatDate(startDate)} a ${formatDate(endDate)}`;
    if (startDate.endsWith("-01-01") && endDate === `${startDate.slice(0, 4)}-12-31`) return `Ano de ${startDate.slice(0, 4)}`;
    if (startDate.slice(0, 7) === endDate.slice(0, 7)) return monthName(startDate, true);

    const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
    return `${monthName(startDate, !sameYear)} a ${monthName(endDate, true)}`;
};

export class ReportService {
    private reportRepository = new ReportRepository();
    private usersRepository = new UsersRepository();
    private preferencesRepository = new UserSystemPreferencesRepository();
    private bankAccountRepository = new BankAccountRepository();
    private cardsRepository = new CardsRepository();
    private categoryRepository = new CategoryRepository();
    private transactionRepository = new TransactionRepository();
    private movementRepository = new InvestmentMovementRepository();
    private investmentService = new InvestmentService();

    // Gera o PDF sem salvar: é o que a tela de relatórios mostra enquanto o usuário mexe nos filtros.
    async preview(userId: number, data: unknown): Promise<Buffer> {
        const config = reportConfigValidator.parse(data);

        return await this.render(await this.buildData(userId, config));
    }

    async generate(userId: number, data: unknown): Promise<ReportSummaryDto> {
        const config = reportConfigValidator.parse(data);
        const reportData = await this.buildData(userId, config);
        const file = await this.render(reportData);

        return await this.reportRepository.create({
            userId,
            title: reportData.title,
            startDate: config.startDate,
            endDate: config.endDate,
            filters: {
                sections: config.sections,
                bankAccountIds: config.bankAccountIds,
                cardIds: config.cardIds,
                categoryIds: config.categoryIds,
                includeTransactions: config.includeTransactions,
            },
            fileName: `thryve-relatorio-${config.startDate}-a-${config.endDate}.pdf`,
            fileSize: file.length,
            file,
        });
    }

    async loadAll(userId: number): Promise<ReportSummaryDto[]> {
        return await this.reportRepository.loadAll(userId);
    }

    async download(userId: number, params: unknown): Promise<{fileName: string, file: Buffer}> {
        const {id} = reportIdValidator.parse(params);
        const report = await this.loadOwnedReport(userId, id);
        const file = await this.reportRepository.loadFile(id);
        if (!file) throw new NotFoundError(ErrorCode.reportNotFound, "Report does not exist!");

        return {fileName: report.fileName, file};
    }

    async delete(userId: number, data: unknown): Promise<void> {
        const {id} = reportIdValidator.parse(data);
        await this.loadOwnedReport(userId, id);

        await this.reportRepository.delete(id);
    }

    private async render(data: ReportData): Promise<Buffer> {
        try {
            return await renderPdf(renderReportHtml(data), {footerTemplate: renderFooterTemplate(data)});
        } catch (error) {
            console.error("Falha ao gerar o PDF do relatório", error);
            throw new AppError(ErrorCode.reportGenerationFailed, "Não foi possível gerar o PDF do relatório.");
        }
    }

    private async buildData(userId: number, config: ReportConfig): Promise<ReportData> {
        const [user, preferences, accounts, cards, categories] = await Promise.all([
            this.usersRepository.loadById(userId),
            this.preferencesRepository.loadByUserId(userId),
            this.bankAccountRepository.loadAll(userId),
            this.cardsRepository.loadAll(userId),
            this.categoryRepository.loadAll(userId),
        ]);

        this.ensureOwned(config.bankAccountIds, accounts, ErrorCode.bankAccountNotFound);
        this.ensureOwned(config.cardIds, cards, ErrorCode.cardNotFound);
        this.ensureOwned(config.categoryIds, categories, ErrorCode.categoryNotFound);

        // Só a visão geral marcada vale como "tudo": ela resume as outras seções escolhidas, ou todas se estiver sozinha.
        const chosen = config.sections.filter((section) => DATA_SECTIONS.includes(section));
        const dataSections = chosen.length > 0 ? chosen : DATA_SECTIONS;
        const wants = (section: ReportSectionEnum) => dataSections.includes(section);

        const period = {startDate: config.startDate, endDate: config.endDate};
        const [incomes, expenses, investments, movements] = await Promise.all([
            // Cartão não se aplica a renda: o filtro de cartões só restringe os gastos.
            wants(ReportSectionEnum.incomes)
                ? this.transactionRepository.loadByType(userId, TransactionTypeEnum.income, {
                    ...period,
                    bankAccountIds: config.bankAccountIds,
                    categoryIds: config.categoryIds,
                })
                : null,
            wants(ReportSectionEnum.expenses)
                ? this.transactionRepository.loadByType(userId, TransactionTypeEnum.expense, {
                    ...period,
                    bankAccountIds: config.bankAccountIds,
                    cardIds: config.cardIds,
                    categoryIds: config.categoryIds,
                })
                : null,
            wants(ReportSectionEnum.investments) ? this.investmentService.loadAll(userId, {}) : null,
            wants(ReportSectionEnum.investments) ? this.movementRepository.loadAll(userId, period) : null,
        ]);

        const filteredInvestments = investments?.filter((investment) =>
            config.bankAccountIds.length === 0 || config.bankAccountIds.includes(investment.bankAccountId));
        // Ordem cronológica no PDF; o repositório devolve do mais recente para o mais antigo, como as telas.
        const chronological = <T extends {date: string, id: number}>(items: T[]) =>
            [...items].sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id);

        return {
            title: config.title || defaultTitle(config),
            ownerName: user?.name ?? "",
            generatedAt: new Date(),
            timezone: config.timezone,
            currency: CURRENCY_CODES[(preferences?.currency ?? CurrencyEnum.brl) as CurrencyEnum] ?? "BRL",
            startDate: config.startDate,
            endDate: config.endDate,
            sections: config.sections,
            includeTransactions: config.includeTransactions,
            filterLabels: buildFilterLabels(config, accounts, cards, categories),
            incomes: incomes ? buildIncomes(chronological(incomes)) : null,
            expenses: expenses ? buildExpenses(chronological(expenses)) : null,
            investments: filteredInvestments && movements
                ? buildInvestments(filteredInvestments, chronological(movements))
                : null,
            monthly: buildMonthly(config.startDate, config.endDate, incomes ?? [], expenses ?? []),
        };
    }

    // Filtro com id de outro usuário (ou inexistente) é recusado em vez de ignorado: ignorar geraria um
    // relatório "filtrado" que na verdade traz tudo.
    private ensureOwned(ids: number[], owned: {id: number}[], code: ErrorCode): void {
        const ownedIds = new Set(owned.map((item) => item.id));
        if (ids.some((id) => !ownedIds.has(id))) {
            throw new NotFoundError(code, "Filter references an item that does not exist!");
        }
    }

    private async loadOwnedReport(userId: number, id: number): Promise<Report> {
        const report = await this.reportRepository.loadById(id);
        if (!report) throw new NotFoundError(ErrorCode.reportNotFound, "Report does not exist!");
        if (report.userId !== userId) throw new ForbiddenError();

        return report;
    }
}
