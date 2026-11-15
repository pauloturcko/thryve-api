import { IndexTypeEnum } from "../../db/enum/index-type-enum";
import { InvestmentMovementTypeEnum } from "../../db/enum/investment-movement-type-enum";
import { InvestmentStatusEnum } from "../../db/enum/investment-status-enum";
import { ReportSectionEnum } from "../../db/enum/report-section-enum";
import { TransactionStatusEnum } from "../../db/enum/transaction-status-enum";
import { Transaction } from "../../db/models/transaction";
import { InvestmentResponse } from "../investment-service";
import { BRAND_URL, brandFontCss, logoSvg } from "./report-brand";
import { Cents, ExpensesData, IncomesData, InvestmentsData, MonthlyTotals, ReportData, ReportGroup, toCents } from "./report-data";

const escape = (value: string | number | null | undefined) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

const COLORS = {
    ink: "#0B0D10",
    text: "#3D444D",
    muted: "#5F6978",
    line: "#D5DAE1",
    soft: "#EEF1F5",
    paper: "#F8FAFC",
    income: "#00A63E",
    expense: "#F0101E",
    neutral: "#3D444D",
};

type Formatters = {
    money: (cents: Cents) => string;
    signedMoney: (cents: Cents) => string;
    date: (isoDate: string) => string;
    month: (month: string) => string;
    percent: (ratio: number) => string;
};

const buildFormatters = (currency: string): Formatters => {
    const moneyFormat = new Intl.NumberFormat("pt-BR", {style: "currency", currency});
    const monthFormat = new Intl.DateTimeFormat("pt-BR", {month: "short", year: "2-digit"});
    const percentFormat = new Intl.NumberFormat("pt-BR", {style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1});

    return {
        money: (cents) => moneyFormat.format(cents / 100),
        signedMoney: (cents) => `${cents < 0 ? "−" : "+"} ${moneyFormat.format(Math.abs(cents) / 100)}`,
        date: (isoDate) => isoDate.split("-").reverse().join("/"),
        month: (month) => {
            const [year, monthNumber] = month.split("-").map(Number);
            return monthFormat.format(new Date(year, monthNumber - 1, 1)).replace(".", "");
        },
        percent: (ratio) => percentFormat.format(ratio),
    };
};

const rateFormat = new Intl.NumberFormat("pt-BR", {maximumFractionDigits: 4});

export const describeIndex = (investment: Pick<InvestmentResponse, "indexType" | "indexPercentage" | "spreadRate">) => {
    const percentage = Number(investment.indexPercentage);
    const spread = Number(investment.spreadRate);
    const spreadText = spread === 0 ? "" : ` ${spread < 0 ? "−" : "+"} ${rateFormat.format(Math.abs(spread))}%`;
    const indexName = {[IndexTypeEnum.selic]: "Selic", [IndexTypeEnum.cdi]: "CDI", [IndexTypeEnum.ipca]: "IPCA"};

    switch (investment.indexType) {
        case IndexTypeEnum.prefixed:
            return `Pré ${rateFormat.format(spread)}% a.a.`;
        case IndexTypeEnum.none:
            return "Sem indexador";
        default: {
            const name = indexName[investment.indexType];
            return percentage === 100 ? `${name}${spreadText}` : `${rateFormat.format(percentage)}% do ${name}${spreadText}`;
        }
    }
};

const MOVEMENT_LABELS: Record<InvestmentMovementTypeEnum, string> = {
    [InvestmentMovementTypeEnum.contribution]: "Aporte",
    [InvestmentMovementTypeEnum.withdrawal]: "Resgate",
    [InvestmentMovementTypeEnum.yield]: "Rendimento",
};

const SECTION_TITLES: Record<ReportSectionEnum, string> = {
    [ReportSectionEnum.summary]: "Visão geral",
    [ReportSectionEnum.incomes]: "Rendas",
    [ReportSectionEnum.expenses]: "Gastos",
    [ReportSectionEnum.investments]: "Investimentos",
};

const kpi = (label: string, value: string, detail = "", tone: "income" | "expense" | "neutral" = "neutral") => `
    <div class="kpi">
        <span class="kpi-label">${escape(label)}</span>
        <strong class="kpi-value tone-${tone}">${escape(value)}</strong>
        ${detail ? `<span class="kpi-detail">${escape(detail)}</span>` : ""}
    </div>`;

const kpiGrid = (cards: string[]) => {
    const columns = cards.length <= 4 ? cards.length : 3;
    return `<div class="kpis" style="grid-template-columns:repeat(${columns}, minmax(0, 1fr))">${cards.join("")}</div>`;
};

const groupChart = (title: string, groups: ReportGroup[], format: Formatters, fallbackColor: string) => {
    if (groups.length === 0) return "";

    const rows = groups.map((group) => `
        <div class="bar-row">
            <span class="bar-label">${escape(group.label)}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${Math.max(group.share * 100, 1).toFixed(1)}%;background:${/^#[0-9a-f]{6}$/i.test(group.color ?? "") ? group.color : fallbackColor}"></span></span>
            <span class="bar-value">${escape(format.money(group.amount))}</span>
            <span class="bar-share">${escape(format.percent(group.share))}</span>
        </div>`).join("");

    return `<div class="chart avoid-break"><h3>${escape(title)}</h3>${rows}</div>`;
};

const monthlyChart = (months: MonthlyTotals[], format: Formatters, showIncomes: boolean, showExpenses: boolean) => {
    if (months.length < 2) return "";

    const peak = Math.max(1, ...months.flatMap((month) => [showIncomes ? month.incomes : 0, showExpenses ? month.expenses : 0]));
    const column = (value: Cents, color: string) =>
        `<span class="col" style="height:${Math.max((value / peak) * 100, value > 0 ? 1.5 : 0).toFixed(1)}%;background:${color}"></span>`;
    const columns = months.map((month) => `
        <div class="month">
            <div class="cols">
                ${showIncomes ? column(month.incomes, COLORS.income) : ""}
                ${showExpenses ? column(month.expenses, COLORS.expense) : ""}
            </div>
            <span class="month-label">${escape(format.month(month.month))}</span>
        </div>`).join("");
    const legend = [
        showIncomes ? `<span><i style="background:${COLORS.income}"></i>Rendas</span>` : "",
        showExpenses ? `<span><i style="background:${COLORS.expense}"></i>Gastos</span>` : "",
    ].join("");

    return `
        <div class="chart avoid-break">
            <h3>Evolução mensal</h3>
            <div class="legend">${legend}</div>
            <div class="months">${columns}</div>
            <p class="axis-note">Maior valor do período: ${escape(format.money(peak))}</p>
        </div>`;
};

const transactionStatus = (transaction: Transaction, settled: string, pending: string) =>
    transaction.status === TransactionStatusEnum.paid
        ? `<span class="pill">${settled}</span>`
        : `<span class="pill pill-pending">${pending}</span>`;

const installment = (transaction: Transaction) =>
    transaction.installmentTotal ? ` <span class="muted">(${transaction.installmentNumber}/${transaction.installmentTotal})</span>` : "";

const table = (headers: {label: string, align?: "right"}[], rows: string[], emptyMessage: string) => {
    if (rows.length === 0) return `<p class="empty">${escape(emptyMessage)}</p>`;

    const head = headers.map((header) => `<th class="${header.align === "right" ? "num" : ""}">${escape(header.label)}</th>`).join("");
    return `<table><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table>`;
};

const summarySection = (data: ReportData, format: Formatters) => {
    const cards: string[] = [];
    const {incomes, expenses, investments} = data;

    if (incomes) cards.push(kpi("Rendas", format.money(incomes.total), `${format.money(incomes.received)} recebido`, "income"));
    if (expenses) cards.push(kpi("Gastos", format.money(expenses.total), `${format.money(expenses.paid)} pago`, "expense"));
    if (incomes && expenses) {
        const net = incomes.total - expenses.total;
        const savingsRate = incomes.total > 0 ? ` · ${format.percent(net / incomes.total)} das rendas` : "";
        cards.push(kpi("Saldo do período", format.signedMoney(net), `Rendas − gastos${savingsRate}`, net < 0 ? "expense" : "income"));
    }
    if (investments) {
        cards.push(kpi("Aporte líquido", format.money(investments.contributions - investments.withdrawals), "Aportes − resgates no período"));
        cards.push(kpi("Patrimônio estimado", format.money(investments.estimated), `${format.money(investments.invested)} investido`));
    }

    return `
        ${kpiGrid(cards)}
        ${monthlyChart(data.monthly, format, !!incomes, !!expenses)}`;
};

const incomesSection = (incomes: IncomesData, data: ReportData, format: Formatters) => {
    const rows = incomes.items.map((item) => `
        <tr>
            <td class="nowrap">${escape(format.date(item.date))}</td>
            <td>${escape(item.source || item.description || "—")}${item.notes ? `<span class="note">${escape(item.notes)}</span>` : ""}</td>
            <td>${escape(item.category.name)}</td>
            <td>${escape(item.bankAccount?.name ?? "—")}</td>
            <td>${transactionStatus(item, "Recebido", "A receber")}</td>
            <td class="num">${escape(format.money(toCents(item.amount)))}</td>
        </tr>`);

    return `
        ${kpiGrid([
            kpi("Total de rendas", format.money(incomes.total), `${incomes.items.length} lançamento(s)`, "income"),
            kpi("Recebido", format.money(incomes.received)),
            kpi("A receber", format.money(incomes.pending)),
        ])}
        <div class="charts">
            ${groupChart("Por categoria", incomes.byCategory, format, COLORS.income)}
            ${groupChart("Por conta", incomes.byAccount, format, COLORS.neutral)}
        </div>
        ${data.includeTransactions ? `<h3>Lançamentos</h3>${table(
            [{label: "Data"}, {label: "Descrição"}, {label: "Categoria"}, {label: "Conta"}, {label: "Status"}, {label: "Valor", align: "right"}],
            rows,
            "Nenhuma renda no período com esses filtros.",
        )}` : ""}`;
};

const expensesSection = (expenses: ExpensesData, data: ReportData, format: Formatters) => {
    const rows = expenses.items.map((item) => `
        <tr>
            <td class="nowrap">${escape(format.date(item.date))}</td>
            <td>${escape(item.description || "—")}${installment(item)}${item.notes ? `<span class="note">${escape(item.notes)}</span>` : ""}</td>
            <td>${escape(item.category.name)}</td>
            <td>${escape(item.card ? `${item.card.name} •••• ${item.card.lastFourDigits}` : item.paymentMethod?.name ?? "—")}</td>
            <td>${transactionStatus(item, "Pago", "A pagar")}</td>
            <td class="num">${escape(format.money(toCents(item.amount)))}</td>
        </tr>`);

    return `
        ${kpiGrid([
            kpi("Total de gastos", format.money(expenses.total), `${expenses.items.length} lançamento(s)`, "expense"),
            kpi("Pago", format.money(expenses.paid)),
            kpi("A pagar", format.money(expenses.pending)),
            kpi("Gastos fixos", format.money(expenses.fixed), `${format.money(expenses.variable)} variáveis`),
        ])}
        <div class="charts">
            ${groupChart("Por categoria", expenses.byCategory, format, COLORS.expense)}
            ${groupChart("Por forma de pagamento", expenses.byPaymentMethod, format, COLORS.neutral)}
            ${groupChart("Por cartão", expenses.byCard, format, COLORS.neutral)}
            ${groupChart("Por conta", expenses.byAccount, format, COLORS.neutral)}
        </div>
        ${data.includeTransactions ? `<h3>Lançamentos</h3>${table(
            [{label: "Data"}, {label: "Descrição"}, {label: "Categoria"}, {label: "Pagamento"}, {label: "Status"}, {label: "Valor", align: "right"}],
            rows,
            "Nenhum gasto no período com esses filtros.",
        )}` : ""}`;
};

const investmentsSection = (investments: InvestmentsData, data: ReportData, format: Formatters) => {
    const rows = investments.items.map((item) => {
        const yieldCents = toCents(item.estimatedAmount) - toCents(item.investedAmount);
        const status = item.status === InvestmentStatusEnum.redeemed ? ` <span class="pill">Resgatado</span>` : "";

        return `
        <tr>
            <td>${escape(item.name)}${status}<span class="note">${escape(item.bankAccount?.name ?? "")}</span></td>
            <td>${escape(describeIndex(item))}${item.currentAnnualRate ? `<span class="note">${escape(item.currentAnnualRate.replace(".", ","))}% a.a. hoje</span>` : ""}</td>
            <td class="num">${escape(format.money(toCents(item.investedAmount)))}</td>
            <td class="num">${escape(format.money(toCents(item.currentAmount)))}</td>
            <td class="num">${escape(format.money(toCents(item.estimatedAmount)))}</td>
            <td class="num tone-${yieldCents < 0 ? "expense" : "income"}">${escape(format.signedMoney(yieldCents))}</td>
        </tr>`;
    });
    const movementRows = investments.movements.map((movement) => `
        <tr>
            <td class="nowrap">${escape(format.date(movement.date))}</td>
            <td>${escape(movement.investmentName)}</td>
            <td>${escape(MOVEMENT_LABELS[movement.type])}</td>
            <td class="num">${escape(movement.type === InvestmentMovementTypeEnum.yield ? format.signedMoney(toCents(movement.amount)) : format.money(toCents(movement.amount)))}</td>
        </tr>`);
    const ratesUntil = investments.items
        .map((item) => item.ratesUpdatedUntil)
        .filter((date): date is string => !!date)
        .sort()
        .pop();

    return `
        ${kpiGrid([
            kpi("Patrimônio estimado", format.money(investments.estimated), `${format.money(investments.current)} confirmado`),
            kpi("Total investido", format.money(investments.invested), `${investments.items.length} aplicação(ões)`),
            kpi("Aportes no período", format.money(investments.contributions), `${format.money(investments.withdrawals)} resgatado`),
            kpi("Rendimentos no período", format.signedMoney(investments.yields), "Valores confirmados", investments.yields < 0 ? "expense" : "income"),
        ])}
        <h3>Aplicações</h3>
        ${table(
            [{label: "Investimento"}, {label: "Rentabilidade"}, {label: "Investido", align: "right"}, {label: "Confirmado", align: "right"}, {label: "Estimado hoje", align: "right"}, {label: "Rendimento", align: "right"}],
            rows,
            "Nenhum investimento com esses filtros.",
        )}
        ${data.includeTransactions ? `<h3>Movimentações no período</h3>${table(
            [{label: "Data"}, {label: "Investimento"}, {label: "Tipo"}, {label: "Valor", align: "right"}],
            movementRows,
            "Nenhuma movimentação de investimento no período.",
        )}` : ""}
        <p class="footnote">Valores estimados são brutos (sem IR, IOF e taxa de custódia), calculados com as taxas oficiais do Banco Central${ratesUntil ? ` publicadas até ${escape(ratesUntil.length === 7 ? format.month(ratesUntil) : format.date(ratesUntil))}` : ""}. "Confirmado" é o último valor informado no Thryve.</p>`;
};

const section = (index: number, title: string, body: string) => `
    <section class="${index > 0 ? "section" : "section first"}">
        <h2><span class="section-index">${String(index + 1).padStart(2, "0")}</span>${escape(title)}</h2>
        ${body}
    </section>`;

const formatGeneratedAt = (data: ReportData) =>
    new Intl.DateTimeFormat("pt-BR", {dateStyle: "short", timeStyle: "short", timeZone: data.timezone}).format(data.generatedAt);

const filtersLine = (data: ReportData) => {
    const parts = [
        data.filterLabels.accounts.length ? `Contas: ${data.filterLabels.accounts.join(", ")}` : "",
        data.filterLabels.cards.length ? `Cartões: ${data.filterLabels.cards.join(", ")}` : "",
        data.filterLabels.categories.length ? `Categorias: ${data.filterLabels.categories.join(", ")}` : "",
    ].filter(Boolean);

    return parts.length ? parts.join(" · ") : "Todos os lançamentos";
};

export const renderReportHtml = (data: ReportData): string => {
    const format = buildFormatters(data.currency);
    const bodies: Record<ReportSectionEnum, () => string> = {
        [ReportSectionEnum.summary]: () => summarySection(data, format),
        [ReportSectionEnum.incomes]: () => incomesSection(data.incomes!, data, format),
        [ReportSectionEnum.expenses]: () => expensesSection(data.expenses!, data, format),
        [ReportSectionEnum.investments]: () => investmentsSection(data.investments!, data, format),
    };
    const sections = data.sections.map((sectionType, index) => section(index, SECTION_TITLES[sectionType], bodies[sectionType]())).join("");

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>${escape(data.title)}</title>
<style>
${brandFontCss()}
@page { size: A4; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Manrope", system-ui, sans-serif; font-size: 9.5pt; line-height: 1.45; color: ${COLORS.text}; }
h1, h2, h3, .kpi-value { font-family: "Bricolage Grotesque", "Manrope", sans-serif; color: ${COLORS.ink}; letter-spacing: -0.01em; }
.cover { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; padding-bottom: 18px; border-bottom: 2px solid ${COLORS.ink}; }
.kicker { font-size: 7.5pt; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: ${COLORS.muted}; }
h1 { font-size: 20pt; font-weight: 700; line-height: 1.15; margin-top: 4px; }
.meta { display: grid; grid-template-columns: repeat(3, auto); gap: 6px 28px; margin-top: 14px; }
.meta div { display: flex; flex-direction: column; }
.meta span { font-size: 7.5pt; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.08em; }
.meta strong { font-size: 9.5pt; color: ${COLORS.ink}; font-weight: 600; }
.filters { margin-top: 10px; font-size: 8.5pt; color: ${COLORS.muted}; }
.section { margin-top: 26px; }
.section.first { margin-top: 22px; }
h2 { font-size: 14pt; font-weight: 700; display: flex; align-items: baseline; gap: 10px; padding-bottom: 8px; margin-bottom: 14px; border-bottom: 1px solid ${COLORS.line}; break-after: avoid; }
.section-index { font-family: "Manrope", sans-serif; font-size: 8pt; font-weight: 700; color: ${COLORS.muted}; letter-spacing: 0.1em; }
h3 { font-size: 10.5pt; font-weight: 600; margin: 16px 0 8px; break-after: avoid; }
.kpis { display: grid; gap: 10px; break-inside: avoid; }
.kpi { min-width: 0; border: 1px solid ${COLORS.line}; border-radius: 10px; padding: 10px 12px; background: ${COLORS.paper}; display: flex; flex-direction: column; gap: 2px; }
.kpi-label { font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: ${COLORS.muted}; }
.kpi-value { font-size: 12.5pt; font-weight: 700; white-space: nowrap; }
.kpi-detail { font-size: 8pt; color: ${COLORS.muted}; }
.tone-income { color: ${COLORS.income}; }
.tone-expense { color: ${COLORS.expense}; }
.charts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 6px 24px; }
.chart h3 { margin-top: 14px; }
.avoid-break { break-inside: avoid; }
.bar-row { display: grid; grid-template-columns: 30% minmax(0, 1fr) auto 46px; align-items: center; gap: 8px; padding: 3px 0; font-size: 8.5pt; }
.bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${COLORS.ink}; }
.bar-track { height: 7px; border-radius: 99px; background: ${COLORS.soft}; overflow: hidden; }
.bar-fill { display: block; height: 100%; border-radius: 99px; }
.bar-value { font-variant-numeric: tabular-nums; color: ${COLORS.ink}; font-weight: 600; }
.bar-share { text-align: right; color: ${COLORS.muted}; font-variant-numeric: tabular-nums; }
.legend { display: flex; gap: 14px; font-size: 8pt; color: ${COLORS.muted}; margin-bottom: 6px; }
.legend i { display: inline-block; width: 8px; height: 8px; border-radius: 2px; margin-right: 5px; vertical-align: middle; }
.months { display: flex; align-items: flex-end; gap: 6px; height: 130px; padding-top: 4px; border-bottom: 1px solid ${COLORS.line}; }
.month { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
.cols { flex: 1; width: 100%; display: flex; align-items: flex-end; justify-content: center; gap: 2px; }
.col { width: 38%; max-width: 16px; border-radius: 3px 3px 0 0; }
.month-label { font-size: 7pt; color: ${COLORS.muted}; padding-top: 4px; white-space: nowrap; }
.axis-note { font-size: 7.5pt; color: ${COLORS.muted}; margin-top: 4px; }
table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
thead { display: table-header-group; }
th { text-align: left; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${COLORS.muted}; padding: 6px 8px; border-bottom: 1px solid ${COLORS.ink}; }
td { padding: 6px 8px; border-bottom: 1px solid ${COLORS.line}; vertical-align: top; color: ${COLORS.ink}; }
tr { break-inside: avoid; }
tbody tr:nth-child(even) td { background: ${COLORS.paper}; }
.num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.nowrap { white-space: nowrap; }
.note { display: block; font-size: 7.5pt; color: ${COLORS.muted}; }
.muted { color: ${COLORS.muted}; }
.pill { display: inline-block; font-size: 7pt; font-weight: 600; padding: 1px 7px; border-radius: 99px; background: ${COLORS.soft}; color: ${COLORS.text}; white-space: nowrap; }
.pill-pending { background: #FFF1E6; color: #B54708; }
.empty { padding: 14px; border: 1px dashed ${COLORS.line}; border-radius: 8px; color: ${COLORS.muted}; text-align: center; }
.footnote { margin-top: 10px; font-size: 7.5pt; color: ${COLORS.muted}; }
.closing { margin-top: 40px; padding-top: 28px; border-top: 1px solid ${COLORS.line}; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; break-inside: avoid; }
.closing .watermark { opacity: 0.12; }
.closing p { font-size: 8pt; color: ${COLORS.muted}; max-width: 420px; }
</style>
</head>
<body>
    <header class="cover">
        <div>
            <span class="kicker">Relatório financeiro</span>
            <h1>${escape(data.title)}</h1>
            <div class="meta">
                <div><span>Cliente</span><strong>${escape(data.ownerName)}</strong></div>
                <div><span>Período</span><strong>${escape(format.date(data.startDate))} a ${escape(format.date(data.endDate))}</strong></div>
                <div><span>Emitido em</span><strong>${escape(formatGeneratedAt(data))}</strong></div>
            </div>
            <p class="filters">${escape(filtersLine(data))}</p>
        </div>
        ${logoSvg(30, COLORS.ink)}
    </header>
    ${sections}
    <footer class="closing">
        <div class="watermark">${logoSvg(54, COLORS.ink)}</div>
        <p>Relatório gerado pela Thryve em ${escape(formatGeneratedAt(data))} para ${escape(data.ownerName)}. As informações refletem os lançamentos cadastrados na plataforma até essa data.</p>
        <p>${escape(BRAND_URL)}</p>
    </footer>
</body>
</html>`;
};

// Rodapé de todas as páginas. O Chromium renderiza esse trecho isolado: só estilo inline, e fonte com tamanho explícito.
export const renderFooterTemplate = (data: ReportData) => `
    <div style="width:100%;padding:0 14mm;font-family:Helvetica,Arial,sans-serif;font-size:7pt;color:${COLORS.muted};display:flex;align-items:center;justify-content:space-between;gap:12px;">
        <span style="display:flex;align-items:center;gap:8px;">${logoSvg(9, COLORS.muted)}<span>${escape(data.ownerName)} · ${escape(data.title)}</span></span>
        <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
    </div>`;
