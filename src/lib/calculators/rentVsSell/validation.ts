import type { RentVsSellParams } from './types';

export interface ValidationError {
  field: string;
  message: string;
  severity?: 'error' | 'warning';
}

export interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateRentVsSellParams(params: Partial<RentVsSellParams>): ValidationError[] {
  const result = validateRentVsSellParamsWithWarnings(params);
  // Only return actual errors, not warnings
  return result.errors;
}

export function validateRentVsSellParamsWithWarnings(params: Partial<RentVsSellParams>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Property Details
  if (!params.propertyValue || params.propertyValue <= 0) {
    errors.push({ field: 'propertyValue', message: 'Property value must be greater than 0' });
  }
  
  if (params.propertyValue && params.propertyValue > 10000000) {
    warnings.push({ field: 'propertyValue', message: 'Property value seems unusually high', severity: 'warning' });
  }

  if (params.remainingMortgageBalance === undefined || params.remainingMortgageBalance < 0) {
    errors.push({ field: 'remainingMortgageBalance', message: 'Mortgage balance cannot be negative' });
  }

  if (params.remainingMortgageBalance && params.propertyValue && 
      params.remainingMortgageBalance > params.propertyValue) {
    errors.push({ field: 'remainingMortgageBalance', message: 'Mortgage balance cannot exceed property value' });
  }

  if (!params.monthlyMortgagePayment || params.monthlyMortgagePayment < 0) {
    errors.push({ field: 'monthlyMortgagePayment', message: 'Monthly payment cannot be negative' });
  }

  if (!params.originalPurchasePrice || params.originalPurchasePrice <= 0) {
    errors.push({ field: 'originalPurchasePrice', message: 'Original purchase price must be greater than 0' });
  }

  // Rental Income
  if (!params.expectedMonthlyRent || params.expectedMonthlyRent <= 0) {
    errors.push({ field: 'expectedMonthlyRent', message: 'Expected rent must be greater than 0' });
  }

  if (params.expectedMonthlyRent && params.propertyValue) {
    const rentToValueRatio = (params.expectedMonthlyRent * 12) / params.propertyValue;
    if (rentToValueRatio < 0.004) { // Less than 0.4% monthly
      warnings.push({ field: 'expectedMonthlyRent', message: 'Rent seems low compared to property value', severity: 'warning' });
    }
    if (rentToValueRatio > 0.02) { // More than 2% monthly
      warnings.push({ field: 'expectedMonthlyRent', message: 'Rent seems high compared to property value', severity: 'warning' });
    }
  }

  if (params.vacancyRate !== undefined && (params.vacancyRate < 0 || params.vacancyRate > 50)) {
    errors.push({ field: 'vacancyRate', message: 'Vacancy rate must be between 0% and 50%' });
  }

  // Expenses
  if (!params.propertyTaxAnnual || params.propertyTaxAnnual < 0) {
    errors.push({ field: 'propertyTaxAnnual', message: 'Property tax cannot be negative' });
  }

  if (params.propertyTaxAnnual && params.propertyValue) {
    const taxRate = params.propertyTaxAnnual / params.propertyValue;
    if (taxRate > 0.05) { // More than 5%
      warnings.push({ field: 'propertyTaxAnnual', message: 'Property tax seems unusually high', severity: 'warning' });
    }
  }

  if (params.propertyManagementPercent !== undefined && 
      (params.propertyManagementPercent < 0 || params.propertyManagementPercent > 20)) {
    errors.push({ field: 'propertyManagementPercent', message: 'Management fee must be between 0% and 20%' });
  }

  if (params.annualMaintenancePercent !== undefined && 
      (params.annualMaintenancePercent < 0 || params.annualMaintenancePercent > 5)) {
    errors.push({ field: 'annualMaintenancePercent', message: 'Maintenance percentage must be between 0% and 5%' });
  }

  // Tax Rates
  if (params.marginalTaxRate !== undefined && 
      (params.marginalTaxRate < 0 || params.marginalTaxRate > 50)) {
    errors.push({ field: 'marginalTaxRate', message: 'Tax rate must be between 0% and 50%' });
  }

  if (params.capitalGainsRate !== undefined && 
      (params.capitalGainsRate < 0 || params.capitalGainsRate > 30)) {
    errors.push({ field: 'capitalGainsRate', message: 'Capital gains rate must be between 0% and 30%' });
  }

  // Market Assumptions
  if (params.propertyAppreciationRate !== undefined && 
      (params.propertyAppreciationRate < -10 || params.propertyAppreciationRate > 20)) {
    errors.push({ field: 'propertyAppreciationRate', message: 'Appreciation rate must be between -10% and 20%' });
  }

  if (params.investmentReturnRate !== undefined && 
      (params.investmentReturnRate < -20 || params.investmentReturnRate > 30)) {
    errors.push({ field: 'investmentReturnRate', message: 'Investment return must be between -20% and 30%' });
  }

  // Analysis Period
  if (!params.yearsToAnalyze || params.yearsToAnalyze < 1 || params.yearsToAnalyze > 30) {
    errors.push({ field: 'yearsToAnalyze', message: 'Analysis period must be between 1 and 30 years' });
  }

  return { errors, warnings };
}

export function getDefaultParams(): RentVsSellParams {
  return {
    // Property Details
    propertyValue: 400000,
    remainingMortgageBalance: 280000,
    monthlyMortgagePayment: 1800,
    mortgageInterestRate: 4.5,
    yearsRemainingOnMortgage: 23,
    originalPurchasePrice: 350000,
    purchaseDate: new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000), // 7 years ago
    
    // Rental Income
    expectedMonthlyRent: 2400,
    annualRentIncreaseRate: 3,
    vacancyRate: 5,
    
    // Expenses
    propertyTaxAnnual: 4800,
    homeownersInsuranceAnnual: 1200,
    hoaFeesMonthly: 100,
    annualMaintenancePercent: 1,
    propertyManagementPercent: 8,
    
    // Transaction Costs
    sellingCostPercent: 7,
    
    // Tax Parameters
    marginalTaxRate: 24,
    capitalGainsRate: 15,
    depreciationRecaptureRate: 25,
    stateIncomeTaxRate: 5,
    
    // Market Assumptions
    propertyAppreciationRate: 3,
    investmentReturnRate: 7,
    inflationRate: 2.5,
    
    // Analysis
    yearsToAnalyze: 10,
    
    // User Profile
    currentHomeowner: true,
    isInvestmentProperty: false,
    landlordExperience: 'none',
    riskTolerance: 'moderate',
    primaryGoal: 'appreciation'
  };
}

export function sanitizeParams(params: Partial<RentVsSellParams>): RentVsSellParams {
  const defaults = getDefaultParams();
  
  return {
    ...defaults,
    ...params,
    // Ensure numeric values are actually numbers
    propertyValue: Number(params.propertyValue) || defaults.propertyValue,
    remainingMortgageBalance: Number(params.remainingMortgageBalance) || defaults.remainingMortgageBalance,
    monthlyMortgagePayment: Number(params.monthlyMortgagePayment) || defaults.monthlyMortgagePayment,
    mortgageInterestRate: Number(params.mortgageInterestRate) || defaults.mortgageInterestRate,
    yearsRemainingOnMortgage: Number(params.yearsRemainingOnMortgage) || defaults.yearsRemainingOnMortgage,
    originalPurchasePrice: Number(params.originalPurchasePrice) || defaults.originalPurchasePrice,
    expectedMonthlyRent: Number(params.expectedMonthlyRent) || defaults.expectedMonthlyRent,
    annualRentIncreaseRate: Number(params.annualRentIncreaseRate) || defaults.annualRentIncreaseRate,
    vacancyRate: Number(params.vacancyRate) || defaults.vacancyRate,
    propertyTaxAnnual: Number(params.propertyTaxAnnual) || defaults.propertyTaxAnnual,
    homeownersInsuranceAnnual: Number(params.homeownersInsuranceAnnual) || defaults.homeownersInsuranceAnnual,
    hoaFeesMonthly: Number(params.hoaFeesMonthly) || defaults.hoaFeesMonthly,
    annualMaintenancePercent: Number(params.annualMaintenancePercent) || defaults.annualMaintenancePercent,
    propertyManagementPercent: Number(params.propertyManagementPercent) || defaults.propertyManagementPercent,
    sellingCostPercent: Number(params.sellingCostPercent) || defaults.sellingCostPercent,
    marginalTaxRate: Number(params.marginalTaxRate) || defaults.marginalTaxRate,
    capitalGainsRate: Number(params.capitalGainsRate) || defaults.capitalGainsRate,
    depreciationRecaptureRate: Number(params.depreciationRecaptureRate) || defaults.depreciationRecaptureRate,
    stateIncomeTaxRate: Number(params.stateIncomeTaxRate) || defaults.stateIncomeTaxRate,
    propertyAppreciationRate: Number(params.propertyAppreciationRate) || defaults.propertyAppreciationRate,
    investmentReturnRate: Number(params.investmentReturnRate) || defaults.investmentReturnRate,
    inflationRate: Number(params.inflationRate) || defaults.inflationRate,
    yearsToAnalyze: Number(params.yearsToAnalyze) || defaults.yearsToAnalyze,
    // Ensure date is a Date object
    purchaseDate: params.purchaseDate instanceof Date ? params.purchaseDate : new Date(params.purchaseDate || defaults.purchaseDate),
  };
}