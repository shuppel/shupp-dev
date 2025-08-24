export interface RentVsBuyParams {
  // Basic inputs
  monthlyRent: number;
  homePrice: number;
  downPaymentPercent: number;
  mortgageRate: number;
  mortgageTerm: 15 | 30;
  plannedYears: number;
  
  // Tax inputs
  marginalTaxRate: number;
  propertyTaxRate: number;
  standardDeduction: number;
  
  // Ownership costs
  maintenanceRate: number;
  homeownersInsurance: number;
  hoaFees: number;
  closingCostPercent: number;
  sellingCostPercent: number;
  
  // Rental costs
  rentersInsurance: number;
  securityDepositMonths: number;
  
  // Economic assumptions
  homeAppreciationRate: number;
  rentInflationRate: number;
  investmentReturnRate: number;
}

export interface CalculationResult {
  totalBuyingCost: number;
  totalRentingCost: number;
  netAdvantage: number; // Positive = buying is better
  breakEvenMonth: number | null;
  homeEquity: number;
  investmentValue: number;
  totalTaxBenefit: number;
  monthlyData: MonthlyComparison[];
}

export interface MonthlyComparison {
  month: number;
  buyingCost: number;
  rentingCost: number;
  buyingCumulative: number;
  rentingCumulative: number;
  homeValue: number;
  mortgageBalance: number;
  homeEquity: number;
  investmentValue: number;
}

export interface AmortizationMonth {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}