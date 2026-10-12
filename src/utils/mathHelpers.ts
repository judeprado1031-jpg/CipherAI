/**
 * Mathematical & Financial Calculation Utilities for Cipher's Sandbox & Visualizers
 */

// Normal Cumulative Distribution Function approximation for Black-Scholes
export function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  let prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (x > 0) prob = 1 - prob;
  return prob;
}

// 1. Net Present Value (NPV)
export function calculateNPV(initialOutlay: number, cashFlows: number[], discountRatePct: number): number {
  const r = discountRatePct / 100;
  let npv = -initialOutlay;
  cashFlows.forEach((cf, idx) => {
    npv += cf / Math.pow(1 + r, idx + 1);
  });
  return npv;
}

// 2. Internal Rate of Return (IRR) via Secant/Bisection method
export function calculateIRR(initialOutlay: number, cashFlows: number[]): number | null {
  const flows = [-initialOutlay, ...cashFlows];
  let rate = 0.1; // initial guess 10%
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dNpv = 0;
    for (let t = 0; t < flows.length; t++) {
      const discount = Math.pow(1 + rate, t);
      npv += flows[t] / discount;
      if (t > 0) {
        dNpv -= (t * flows[t]) / Math.pow(1 + rate, t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100;
    }

    if (Math.abs(dNpv) < 1e-12) {
      break;
    }

    const newRate = rate - npv / dNpv;
    if (newRate <= -0.999 || isNaN(newRate)) {
      break;
    }
    rate = newRate;
  }

  // Fallback bisection search between -50% and 200%
  let low = -0.5;
  let high = 2.0;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    let npvMid = 0;
    for (let t = 0; t < flows.length; t++) {
      npvMid += flows[t] / Math.pow(1 + mid, t);
    }
    if (Math.abs(npvMid) < tolerance) {
      return mid * 100;
    }
    let npvLow = 0;
    for (let t = 0; t < flows.length; t++) {
      npvLow += flows[t] / Math.pow(1 + low, t);
    }
    if (npvMid * npvLow < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return rate * 100;
}

// 3. Loan Amortization
export interface AmortizationRow {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export function calculateAmortization(
  principal: number,
  annualRatePct: number,
  years: number,
  frequency: 'monthly' | 'annual' = 'monthly'
) {
  const periodsPerYear = frequency === 'monthly' ? 12 : 1;
  const totalPeriods = years * periodsPerYear;
  const periodicRate = annualRatePct / 100 / periodsPerYear;

  const payment =
    periodicRate === 0
      ? principal / totalPeriods
      : (principal * (periodicRate * Math.pow(1 + periodicRate, totalPeriods))) /
        (Math.pow(1 + periodicRate, totalPeriods) - 1);

  let balance = principal;
  let totalInterest = 0;
  const schedule: AmortizationRow[] = [];

  for (let i = 1; i <= totalPeriods; i++) {
    const interest = balance * periodicRate;
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;

    if (i <= 60 || i === totalPeriods || i % periodsPerYear === 0) {
      schedule.push({
        period: i,
        payment,
        principal: principalPaid,
        interest,
        remainingBalance: balance,
      });
    }
  }

  return {
    periodicPayment: payment,
    totalPayment: payment * totalPeriods,
    totalInterest,
    schedule,
  };
}

// 4. Break-Even Analysis
export function calculateBreakEven(
  fixedCosts: number,
  variableCostPerUnit: number,
  sellingPricePerUnit: number,
  targetProfit: number = 0
) {
  const unitContributionMargin = sellingPricePerUnit - variableCostPerUnit;
  const contributionMarginRatio =
    sellingPricePerUnit > 0 ? unitContributionMargin / sellingPricePerUnit : 0;

  const breakEvenUnits =
    unitContributionMargin > 0 ? fixedCosts / unitContributionMargin : 0;
  const breakEvenRevenue =
    contributionMarginRatio > 0 ? fixedCosts / contributionMarginRatio : 0;

  const targetUnits =
    unitContributionMargin > 0
      ? (fixedCosts + targetProfit) / unitContributionMargin
      : 0;
  const targetRevenue =
    contributionMarginRatio > 0
      ? (fixedCosts + targetProfit) / contributionMarginRatio
      : 0;

  return {
    unitContributionMargin,
    contributionMarginRatio: contributionMarginRatio * 100,
    breakEvenUnits,
    breakEvenRevenue,
    targetUnits,
    targetRevenue,
  };
}

// 5. WACC (Weighted Average Cost of Capital)
export function calculateWACC(
  equityValue: number,
  debtValue: number,
  costOfEquityPct: number,
  costOfDebtPct: number,
  taxRatePct: number
) {
  const totalValue = equityValue + debtValue;
  if (totalValue === 0) {
    return {
      wacc: 0,
      weightEquity: 0,
      weightDebt: 0,
      afterTaxCostOfDebt: 0,
    };
  }

  const weightEquity = equityValue / totalValue;
  const weightDebt = debtValue / totalValue;
  const afterTaxCostOfDebt = (costOfDebtPct / 100) * (1 - taxRatePct / 100);

  const wacc =
    weightEquity * (costOfEquityPct / 100) + weightDebt * afterTaxCostOfDebt;

  return {
    wacc: wacc * 100,
    weightEquity: weightEquity * 100,
    weightDebt: weightDebt * 100,
    afterTaxCostOfDebt: afterTaxCostOfDebt * 100,
  };
}

// 6. Black-Scholes Option Valuation
export function calculateBlackScholes(
  stockPrice: number,
  strikePrice: number,
  timeToExpiryYears: number,
  riskFreeRatePct: number,
  volatilityPct: number
) {
  const S = stockPrice;
  const K = strikePrice;
  const T = timeToExpiryYears;
  const r = riskFreeRatePct / 100;
  const sigma = volatilityPct / 100;

  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { callPrice: 0, putPrice: 0, d1: 0, d2: 0, deltaCall: 0, deltaPut: 0 };
  }

  const d1 =
    (Math.log(S / K) + (r + (sigma * sigma) / 2) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  const Nd1 = normalCDF(d1);
  const Nd2 = normalCDF(d2);
  const N_neg_d1 = normalCDF(-d1);
  const N_neg_d2 = normalCDF(-d2);

  const discount = Math.exp(-r * T);
  const callPrice = S * Nd1 - K * discount * Nd2;
  const putPrice = K * discount * N_neg_d2 - S * N_neg_d1;

  return {
    callPrice: Math.max(0, callPrice),
    putPrice: Math.max(0, putPrice),
    d1,
    d2,
    deltaCall: Nd1,
    deltaPut: Nd1 - 1,
  };
}

// Format numbers nicely
export function formatCurrency(amount: number, currency: string = '$'): string {
  return `${currency}${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
