// Tax Utility Module for US Federal and State Tax Calculations

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface StateInfo {
  name: string;
  abbreviation: string;
  incomeTaxRate: number | 'varies';
  capitalGainsTaxRate?: number;
  hasLocalTax?: boolean;
  notes?: string;
}

// 2024 Federal Tax Brackets
export const FEDERAL_TAX_BRACKETS = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ],
  marriedFilingJointly: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 }
  ],
  marriedFilingSeparately: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 }
  ],
  headOfHousehold: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 }
  ]
};

// State Income Tax Rates (2024)
export const STATE_TAX_INFO: Record<string, StateInfo> = {
  AL: { name: 'Alabama', abbreviation: 'AL', incomeTaxRate: 0.05, notes: 'Flat rate' },
  AK: { name: 'Alaska', abbreviation: 'AK', incomeTaxRate: 0, notes: 'No state income tax' },
  AZ: { name: 'Arizona', abbreviation: 'AZ', incomeTaxRate: 0.025, notes: 'Flat rate' },
  AR: { name: 'Arkansas', abbreviation: 'AR', incomeTaxRate: 0.059, notes: 'Top marginal rate' },
  CA: { name: 'California', abbreviation: 'CA', incomeTaxRate: 0.133, notes: 'Top marginal rate', capitalGainsTaxRate: 0.133 },
  CO: { name: 'Colorado', abbreviation: 'CO', incomeTaxRate: 0.044, notes: 'Flat rate' },
  CT: { name: 'Connecticut', abbreviation: 'CT', incomeTaxRate: 0.0699, notes: 'Top marginal rate' },
  DE: { name: 'Delaware', abbreviation: 'DE', incomeTaxRate: 0.066, notes: 'Top marginal rate' },
  FL: { name: 'Florida', abbreviation: 'FL', incomeTaxRate: 0, notes: 'No state income tax' },
  GA: { name: 'Georgia', abbreviation: 'GA', incomeTaxRate: 0.0549, notes: 'Flat rate' },
  HI: { name: 'Hawaii', abbreviation: 'HI', incomeTaxRate: 0.11, notes: 'Top marginal rate' },
  ID: { name: 'Idaho', abbreviation: 'ID', incomeTaxRate: 0.058, notes: 'Flat rate' },
  IL: { name: 'Illinois', abbreviation: 'IL', incomeTaxRate: 0.0495, notes: 'Flat rate' },
  IN: { name: 'Indiana', abbreviation: 'IN', incomeTaxRate: 0.0315, notes: 'Flat rate' },
  IA: { name: 'Iowa', abbreviation: 'IA', incomeTaxRate: 0.06, notes: 'Flat rate' },
  KS: { name: 'Kansas', abbreviation: 'KS', incomeTaxRate: 0.057, notes: 'Top marginal rate' },
  KY: { name: 'Kentucky', abbreviation: 'KY', incomeTaxRate: 0.04, notes: 'Flat rate' },
  LA: { name: 'Louisiana', abbreviation: 'LA', incomeTaxRate: 0.0425, notes: 'Top marginal rate' },
  ME: { name: 'Maine', abbreviation: 'ME', incomeTaxRate: 0.0715, notes: 'Top marginal rate' },
  MD: { name: 'Maryland', abbreviation: 'MD', incomeTaxRate: 0.0575, notes: 'Top marginal rate', hasLocalTax: true },
  MA: { name: 'Massachusetts', abbreviation: 'MA', incomeTaxRate: 0.05, notes: 'Flat rate', capitalGainsTaxRate: 0.05 },
  MI: { name: 'Michigan', abbreviation: 'MI', incomeTaxRate: 0.0425, notes: 'Flat rate' },
  MN: { name: 'Minnesota', abbreviation: 'MN', incomeTaxRate: 0.0985, notes: 'Top marginal rate' },
  MS: { name: 'Mississippi', abbreviation: 'MS', incomeTaxRate: 0.05, notes: 'Flat rate' },
  MO: { name: 'Missouri', abbreviation: 'MO', incomeTaxRate: 0.048, notes: 'Top marginal rate' },
  MT: { name: 'Montana', abbreviation: 'MT', incomeTaxRate: 0.0675, notes: 'Top marginal rate' },
  NE: { name: 'Nebraska', abbreviation: 'NE', incomeTaxRate: 0.0664, notes: 'Top marginal rate' },
  NV: { name: 'Nevada', abbreviation: 'NV', incomeTaxRate: 0, notes: 'No state income tax' },
  NH: { name: 'New Hampshire', abbreviation: 'NH', incomeTaxRate: 0, notes: 'No earned income tax (only dividends/interest)' },
  NJ: { name: 'New Jersey', abbreviation: 'NJ', incomeTaxRate: 0.1075, notes: 'Top marginal rate' },
  NM: { name: 'New Mexico', abbreviation: 'NM', incomeTaxRate: 0.059, notes: 'Top marginal rate' },
  NY: { name: 'New York', abbreviation: 'NY', incomeTaxRate: 0.109, notes: 'Top marginal rate', hasLocalTax: true },
  NC: { name: 'North Carolina', abbreviation: 'NC', incomeTaxRate: 0.0475, notes: 'Flat rate' },
  ND: { name: 'North Dakota', abbreviation: 'ND', incomeTaxRate: 0.0275, notes: 'Top marginal rate' },
  OH: { name: 'Ohio', abbreviation: 'OH', incomeTaxRate: 0.0398, notes: 'Top marginal rate', hasLocalTax: true },
  OK: { name: 'Oklahoma', abbreviation: 'OK', incomeTaxRate: 0.0475, notes: 'Top marginal rate' },
  OR: { name: 'Oregon', abbreviation: 'OR', incomeTaxRate: 0.099, notes: 'Top marginal rate' },
  PA: { name: 'Pennsylvania', abbreviation: 'PA', incomeTaxRate: 0.0307, notes: 'Flat rate', hasLocalTax: true },
  RI: { name: 'Rhode Island', abbreviation: 'RI', incomeTaxRate: 0.0599, notes: 'Top marginal rate' },
  SC: { name: 'South Carolina', abbreviation: 'SC', incomeTaxRate: 0.064, notes: 'Top marginal rate' },
  SD: { name: 'South Dakota', abbreviation: 'SD', incomeTaxRate: 0, notes: 'No state income tax' },
  TN: { name: 'Tennessee', abbreviation: 'TN', incomeTaxRate: 0, notes: 'No state income tax' },
  TX: { name: 'Texas', abbreviation: 'TX', incomeTaxRate: 0, notes: 'No state income tax' },
  UT: { name: 'Utah', abbreviation: 'UT', incomeTaxRate: 0.0465, notes: 'Flat rate' },
  VT: { name: 'Vermont', abbreviation: 'VT', incomeTaxRate: 0.0875, notes: 'Top marginal rate' },
  VA: { name: 'Virginia', abbreviation: 'VA', incomeTaxRate: 0.0575, notes: 'Top marginal rate' },
  WA: { name: 'Washington', abbreviation: 'WA', incomeTaxRate: 0, notes: 'No state income tax', capitalGainsTaxRate: 0.07 },
  WV: { name: 'West Virginia', abbreviation: 'WV', incomeTaxRate: 0.0512, notes: 'Top marginal rate' },
  WI: { name: 'Wisconsin', abbreviation: 'WI', incomeTaxRate: 0.0765, notes: 'Top marginal rate' },
  WY: { name: 'Wyoming', abbreviation: 'WY', incomeTaxRate: 0, notes: 'No state income tax' },
  DC: { name: 'Washington D.C.', abbreviation: 'DC', incomeTaxRate: 0.1075, notes: 'Top marginal rate' }
};

// Capital Gains Tax Brackets (2024)
export const CAPITAL_GAINS_BRACKETS = {
  single: {
    longTerm: [
      { min: 0, max: 47025, rate: 0 },
      { min: 47025, max: 518900, rate: 0.15 },
      { min: 518900, max: Infinity, rate: 0.20 }
    ]
  },
  marriedFilingJointly: {
    longTerm: [
      { min: 0, max: 94050, rate: 0 },
      { min: 94050, max: 583750, rate: 0.15 },
      { min: 583750, max: Infinity, rate: 0.20 }
    ]
  },
  marriedFilingSeparately: {
    longTerm: [
      { min: 0, max: 47025, rate: 0 },
      { min: 47025, max: 291850, rate: 0.15 },
      { min: 291850, max: Infinity, rate: 0.20 }
    ]
  },
  headOfHousehold: {
    longTerm: [
      { min: 0, max: 63000, rate: 0 },
      { min: 63000, max: 551350, rate: 0.15 },
      { min: 551350, max: Infinity, rate: 0.20 }
    ]
  }
};

// Net Investment Income Tax (NIIT)
export const NIIT_THRESHOLDS = {
  single: 200000,
  marriedFilingJointly: 250000,
  marriedFilingSeparately: 125000,
  headOfHousehold: 200000,
  rate: 0.038 // 3.8%
};

export type FilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately' | 'headOfHousehold';

/**
 * Calculate federal marginal tax rate based on income and filing status
 */
export function calculateFederalTaxRate(income: number, filingStatus: FilingStatus): number {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  
  for (const bracket of brackets) {
    if (income >= bracket.min && income < bracket.max) {
      return bracket.rate;
    }
  }
  
  return 0.37; // Maximum rate
}

/**
 * Calculate effective federal tax rate (total tax / income)
 */
export function calculateEffectiveFederalTaxRate(income: number, filingStatus: FilingStatus): number {
  const brackets = FEDERAL_TAX_BRACKETS[filingStatus];
  let totalTax = 0;
  
  for (const bracket of brackets) {
    if (income > bracket.min) {
      const taxableInThisBracket = Math.min(income - bracket.min, bracket.max - bracket.min);
      totalTax += taxableInThisBracket * bracket.rate;
    }
  }
  
  return income > 0 ? totalTax / income : 0;
}

/**
 * Get state income tax rate
 */
export function getStateTaxRate(state: string): number {
  const stateInfo = STATE_TAX_INFO[state];
  if (!stateInfo) return 0;
  
  if (typeof stateInfo.incomeTaxRate === 'number') {
    return stateInfo.incomeTaxRate;
  }
  
  return 0; // For 'varies' states, default to 0
}

/**
 * Calculate capital gains tax rate based on income and filing status
 */
export function calculateCapitalGainsRate(income: number, filingStatus: FilingStatus, isLongTerm = true): number {
  if (!isLongTerm) {
    // Short-term capital gains are taxed as ordinary income
    return calculateFederalTaxRate(income, filingStatus);
  }
  
  const brackets = CAPITAL_GAINS_BRACKETS[filingStatus].longTerm;
  
  for (const bracket of brackets) {
    if (income >= bracket.min && income < bracket.max) {
      // Add NIIT if applicable
      const niitThreshold = NIIT_THRESHOLDS[filingStatus];
      if (income > niitThreshold) {
        return bracket.rate + NIIT_THRESHOLDS.rate;
      }
      return bracket.rate;
    }
  }
  
  return 0.20; // Maximum long-term rate
}

/**
 * Calculate depreciation recapture rate (Section 1250)
 */
export function getDepreciationRecaptureRate(): number {
  return 0.25; // Fixed at 25% for real estate
}

/**
 * Get all states sorted alphabetically
 */
export function getAllStates(): { value: string; label: string; taxRate: number; notes?: string }[] {
  return Object.entries(STATE_TAX_INFO)
    .map(([abbr, info]) => ({
      value: abbr,
      label: `${info.name} (${abbr})`,
      taxRate: typeof info.incomeTaxRate === 'number' ? info.incomeTaxRate : 0,
      notes: info.notes
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Get tax summary for a given income, state, and filing status
 */
export function getTaxSummary(income: number, state: string, filingStatus: FilingStatus) {
  const federalMarginalRate = calculateFederalTaxRate(income, filingStatus);
  const federalEffectiveRate = calculateEffectiveFederalTaxRate(income, filingStatus);
  const stateTaxRate = getStateTaxRate(state);
  const capitalGainsRate = calculateCapitalGainsRate(income, filingStatus);
  const depreciationRecaptureRate = getDepreciationRecaptureRate();
  
  return {
    federalMarginalRate,
    federalEffectiveRate,
    stateTaxRate,
    capitalGainsRate,
    depreciationRecaptureRate,
    combinedRate: federalMarginalRate + stateTaxRate,
    stateInfo: STATE_TAX_INFO[state]
  };
}