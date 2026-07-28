import type {
  Investment,
  InvestmentType,
  IndexType,
  InvestmentLiquidity,
} from "@/types";

/**
 * Investment estimation helpers (Fase 15).
 *
 * All values produced here are ESTIMATES built on top of the reference rates
 * below — not financial advice. The UI surfaces a visible disclaimer.
 */

/** Reference market rates (% a.a.) — update manually as COPOM/IPCA change. */
export const REFERENCE_RATES = {
  selic: 10.5, // % ao ano — atualizar conforme COPOM
  ipca: 4.5, // % ao ano — estimativa anual
  cdi: 10.4, // % ao ano — próximo à Selic
} as const;

/** Presentation metadata per investment type. */
export const INVESTMENT_TYPE_META: Record<
  InvestmentType,
  { label: string; short: string; color: string; defaultIndex: IndexType; tip?: string }
> = {
  tesouro_selic: {
    label: "Tesouro Selic",
    short: "T. Selic",
    color: "var(--brand-purple)",
    defaultIndex: "selic",
    tip: "Ideal para reserva de emergência. Liquidez diária. Rende próximo à Selic.",
  },
  tesouro_ipca: {
    label: "Tesouro IPCA+",
    short: "T. IPCA+",
    color: "var(--brand-purple-deep)",
    defaultIndex: "ipca",
    tip: "Protege da inflação. Ideal para longo prazo. Pode perder valor se resgatado antes do vencimento.",
  },
  tesouro_prefixado: {
    label: "Tesouro Prefixado",
    short: "T. Pré",
    color: "var(--brand-purple-light)",
    defaultIndex: "prefixado",
    tip: "Taxa garantida na compra. Bom quando a Selic está alta. Evite resgatar antes do vencimento.",
  },
  cdb: {
    label: "CDB",
    short: "CDB",
    color: "var(--success)",
    defaultIndex: "cdi",
    tip: "Liquidez diária (na maioria). Rende % do CDI. Boa alternativa para reserva.",
  },
  lci_lca: {
    label: "LCI / LCA",
    short: "LCI/LCA",
    color: "var(--cyan-dark)",
    defaultIndex: "cdi",
    tip: "Isentas de IR. Costumam ter carência. Rendem % do CDI.",
  },
  fii: {
    label: "Fundo Imobiliário",
    short: "FII",
    color: "var(--info)",
    defaultIndex: "nenhum",
    tip: "Renda passiva via dividendos mensais. Preço oscila na bolsa.",
  },
  acao: {
    label: "Ação",
    short: "Ação",
    color: "var(--cat-financeiro)",
    defaultIndex: "nenhum",
    tip: "Renda variável. Maior potencial e maior risco. Pense no longo prazo.",
  },
  crypto: {
    label: "Cripto",
    short: "Cripto",
    color: "var(--prio-alta)",
    defaultIndex: "nenhum",
    tip: "Altíssima volatilidade. Invista apenas o que pode oscilar bastante.",
  },
  poupanca: {
    label: "Poupança",
    short: "Poupança",
    color: "var(--cat-pessoal)",
    defaultIndex: "nenhum",
    tip: "Simples e líquida, mas rende pouco. Considere o Tesouro Selic no lugar.",
  },
  outro: {
    label: "Outro",
    short: "Outro",
    color: "var(--text-secondary)",
    defaultIndex: "nenhum",
  },
};

export const INDEX_META: Record<IndexType, { label: string }> = {
  selic: { label: "Selic" },
  ipca: { label: "IPCA+" },
  cdi: { label: "CDI" },
  prefixado: { label: "Prefixado" },
  nenhum: { label: "Sem indexador" },
};

export const LIQUIDITY_META: Record<InvestmentLiquidity, { label: string }> = {
  diaria: { label: "Diária" },
  no_vencimento: { label: "No vencimento" },
  carencia: { label: "Carência" },
};

/** Effective annual rate (% a.a.) for an investment, from its index + rate. */
export function effectiveAnnualRate(index: IndexType, rate: number): number {
  switch (index) {
    case "selic":
      return REFERENCE_RATES.selic + rate;
    case "ipca":
      return REFERENCE_RATES.ipca + rate;
    case "cdi":
      // rate is stored as "% of CDI" (ex: 110 → 110% do CDI)
      return (REFERENCE_RATES.cdi * rate) / 100;
    case "prefixado":
      return rate; // rate já é a taxa total
    default:
      return rate;
  }
}

/**
 * Estimated current value of an investment via compound interest.
 * Uses the contributions individually when available for precision, otherwise
 * falls back to the total invested amount aged from the purchase date.
 */
export function calculateCurrentValue(
  investment: Pick<
    Investment,
    "investedAmount" | "purchaseDate" | "index" | "rate"
  >,
  contributions?: { amount: number; date: string }[],
): number {
  const annualRate = effectiveAnnualRate(investment.index, investment.rate);
  const today = new Date();

  const yearsSince = (dateStr: string): number => {
    const start = new Date(dateStr);
    if (Number.isNaN(start.getTime())) return 0;
    return Math.max(0, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
  };

  const grow = (principal: number, years: number): number =>
    principal * Math.pow(1 + annualRate / 100, years);

  let value: number;
  if (contributions && contributions.length > 0) {
    // Precise: age each contribution from its own date.
    value = contributions.reduce((sum, c) => sum + grow(c.amount, yearsSince(c.date)), 0);
  } else {
    // Simplified: treat the whole amount as invested on the purchase date.
    value = grow(investment.investedAmount, yearsSince(investment.purchaseDate));
  }

  return Math.round(value * 100) / 100;
}

/** Future value with monthly contributions (compound). */
export function projectFutureValue(
  currentValue: number,
  monthlyContribution: number,
  annualRate: number,
  years: number,
): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;

  if (monthlyRate === 0) {
    return Math.round((currentValue + monthlyContribution * months) * 100) / 100;
  }

  const fv =
    currentValue * Math.pow(1 + monthlyRate, months) +
    (monthlyContribution * (Math.pow(1 + monthlyRate, months) - 1)) / monthlyRate;

  return Math.round(fv * 100) / 100;
}

/** Estimated monthly passive income (4% rule, annual). */
export function estimateMonthlyPassiveIncome(totalPatrimony: number): number {
  return Math.round(((totalPatrimony * 0.04) / 12) * 100) / 100;
}

/**
 * Months needed until the projected balance first reaches `target`, given a
 * starting value, monthly contribution and annual rate. Returns null if it
 * never reaches the target within `maxYears`.
 */
export function monthsToReach(
  currentValue: number,
  monthlyContribution: number,
  annualRate: number,
  target: number,
  maxYears = 60,
): number | null {
  if (currentValue >= target) return 0;
  const monthlyRate = annualRate / 100 / 12;
  let value = currentValue;
  const maxMonths = maxYears * 12;
  for (let m = 1; m <= maxMonths; m++) {
    value = value * (1 + monthlyRate) + monthlyContribution;
    if (value >= target) return m;
  }
  return null;
}
