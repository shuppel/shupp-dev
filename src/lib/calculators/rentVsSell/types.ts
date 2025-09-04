export interface RentVsSellParams {
  // Property Details
  propertyValue: number;
  remainingMortgageBalance: number;
  monthlyMortgagePayment: number;
  mortgageInterestRate: number;
  yearsRemainingOnMortgage: number;
  originalPurchasePrice: number; // for capital gains calculation
  purchaseDate: Date; // for determining holding period
  
  // Rental Income Projections
  expectedMonthlyRent: number;
  annualRentIncreaseRate: number;
  vacancyRate: number; // percentage (e.g., 5 for 5%)
  
  // Property Operating Expenses
  propertyTaxAnnual: number;
  homeownersInsuranceAnnual: number;
  hoaFeesMonthly: number;
  annualMaintenancePercent: number; // % of property value for repairs/maintenance
  propertyManagementPercent: number; // % of rent (0 if self-managing)
  
  // Transaction Costs
  sellingCostPercent: number; // agent commissions, closing costs, etc.
  
  // Tax Parameters
  marginalTaxRate: number; // for rental income and deductions
  capitalGainsRate: number; // 0%, 15%, or 20% based on income
  depreciationRecaptureRate: number; // typically 25%
  stateIncomeTaxRate: number; // additional state taxes
  
  // Market Assumptions
  propertyAppreciationRate: number; // annual %
  investmentReturnRate: number; // if proceeds are invested
  inflationRate: number;
  
  // Analysis Parameters
  yearsToAnalyze: number;
  
  // User Profile (from onboarding)
  currentHomeowner?: boolean;
  isInvestmentProperty?: boolean; // affects capital gains exemption
  landlordExperience?: 'none' | 'some' | 'experienced';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  primaryGoal?: 'cash-flow' | 'appreciation' | 'passive-income' | 'liquidity';
}

export interface RentVsSellResult {
  // Selling Option Analysis
  grossSaleProceeds: number;
  sellingCosts: number;
  mortgagePayoff: number;
  capitalGains: number;
  capitalGainsTax: number;
  depreciationRecapture: number;
  netProceedsFromSale: number;
  projectedInvestmentValue: number; // after analysis period
  
  // Rental Option Analysis
  totalGrossRentalIncome: number;
  totalVacancyLoss: number;
  totalOperatingExpenses: number;
  totalMortgagePayments: number;
  totalCashFlow: number;
  totalTaxBenefit: number;
  propertyValueAtEnd: number;
  remainingMortgageAtEnd: number;
  equityAtEnd: number;
  
  // Net Worth Comparison
  sellingNetWorth: number; // investment value at end
  rentingNetWorth: number; // equity + accumulated cash flow
  financialAdvantage: number; // positive = renting better
  advantagePercentage: number;
  
  // Key Financial Metrics
  averageAnnualCashFlow: number;
  cashOnCashReturn: number; // annual cash flow / current equity
  capRate: number; // NOI / property value
  totalReturnRate: number; // including appreciation
  internalRateOfReturn: number;
  
  // Break-even Analysis
  breakEvenMonth: number | null;
  crossoverNetWorth: number | null; // net worth at break-even
  
  // Tax Analysis
  totalDepreciationDeduction: number;
  totalInterestDeduction: number;
  totalPropertyTaxDeduction: number;
  effectiveTaxRate: number;
  
  // Risk Metrics
  worstCaseScenario: number; // with higher vacancy, lower appreciation
  bestCaseScenario: number; // with optimal conditions
  probabilityOfPositiveCashFlow: number;
  
  // Monthly/Yearly Data
  monthlyData: MonthlyRentVsSellComparison[];
  yearlyData: YearlyRentVsSellSummary[];
}

export interface MonthlyRentVsSellComparison {
  month: number;
  year: number;
  
  // Rental Scenario
  grossRentalIncome: number;
  vacancyLoss: number;
  effectiveRentalIncome: number;
  
  // Operating Expenses
  propertyTax: number;
  insurance: number;
  hoaFees: number;
  maintenance: number;
  propertyManagement: number;
  totalOperatingExpenses: number;
  
  // Financing
  mortgagePayment: number;
  mortgagePrincipal: number;
  mortgageInterest: number;
  mortgageBalance: number;
  
  // Cash Flow
  netOperatingIncome: number; // before financing
  cashFlow: number; // after mortgage payment
  cumulativeCashFlow: number;
  
  // Property Value
  propertyValue: number;
  equity: number;
  
  // Tax Impact
  monthlyTaxBenefit: number;
  afterTaxCashFlow: number;
  
  // Selling Scenario
  investmentValue: number;
  investmentGrowth: number;
  
  // Comparison
  rentingTotalWealth: number; // equity + cash reserves
  sellingTotalWealth: number; // investment value
  wealthDifference: number; // renting - selling
}

export interface YearlyRentVsSellSummary {
  year: number;
  
  // Annual Income & Expenses
  annualGrossRent: number;
  annualVacancyLoss: number;
  annualOperatingExpenses: number;
  annualMortgagePayments: number;
  annualCashFlow: number;
  
  // Tax Summary
  depreciationDeduction: number;
  totalTaxDeductions: number;
  taxSavings: number;
  afterTaxCashFlow: number;
  
  // Returns
  cashOnCashReturn: number;
  totalReturn: number; // including appreciation
  
  // End of Year Values
  propertyValue: number;
  mortgageBalance: number;
  equity: number;
  cumulativeCashFlow: number;
  totalWealthRenting: number;
  totalWealthSelling: number;
}

// Calculation helper types
export interface TaxCalculation {
  ordinaryIncome: number;
  taxableIncome: number;
  federalTax: number;
  stateTax: number;
  totalTax: number;
  effectiveRate: number;
}

export interface DepreciationSchedule {
  year: number;
  depreciableBasis: number;
  annualDepreciation: number;
  accumulatedDepreciation: number;
  adjustedBasis: number;
}

// Onboarding data specific to rent vs sell
export interface RentVsSellOnboardingData {
  propertyType: 'single-family' | 'condo' | 'townhouse' | 'multi-family';
  yearsOwned: number;
  originalPurchasePrice: number;
  currentMortgageBalance: number;
  hasBeenRented: boolean;
  monthsRented?: number;
  currentMonthlyRent?: number;
  propertyCondition: 'excellent' | 'good' | 'fair' | 'needs-work';
  landlordExperience: 'none' | 'some' | 'experienced';
  timeAvailability: 'minimal' | 'some' | 'plenty';
  primaryGoal: 'cash-flow' | 'appreciation' | 'passive-income' | 'liquidity';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  planToMoveDistance?: 'local' | 'nearby' | 'far';
}