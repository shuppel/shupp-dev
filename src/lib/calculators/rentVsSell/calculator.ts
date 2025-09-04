import Decimal from 'decimal.js';
import type { 
  RentVsSellParams, 
  RentVsSellResult, 
  MonthlyRentVsSellComparison,
  YearlyRentVsSellSummary,
  DepreciationSchedule 
} from './types';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate monthly mortgage payment breakdown
 */
function calculateMortgagePayment(
  balance: Decimal,
  annualRate: Decimal,
  payment: Decimal
): { principal: Decimal; interest: Decimal; newBalance: Decimal } {
  const monthlyRate = annualRate.div(12).div(100);
  const interest = balance.mul(monthlyRate);
  const principal = payment.minus(interest);
  const newBalance = balance.minus(principal);
  
  return {
    principal: principal.greaterThan(balance) ? balance : principal,
    interest,
    newBalance: newBalance.lessThan(0) ? new Decimal(0) : newBalance
  };
}

/**
 * Calculate depreciation schedule for rental property
 * Residential rental property is depreciated over 27.5 years
 */
function calculateDepreciationSchedule(
  originalPrice: number,
  landValuePercent = 20 // typically 20% of purchase price is land
): DepreciationSchedule[] {
  const depreciableBasis = originalPrice * (1 - landValuePercent / 100);
  const annualDepreciation = depreciableBasis / 27.5;
  const schedule: DepreciationSchedule[] = [];
  
  for (let year = 1; year <= 27.5; year++) {
    const depreciation = year <= 27 ? annualDepreciation : depreciableBasis % annualDepreciation;
    schedule.push({
      year,
      depreciableBasis,
      annualDepreciation: depreciation,
      accumulatedDepreciation: annualDepreciation * Math.min(year, 27.5),
      adjustedBasis: originalPrice - (annualDepreciation * Math.min(year, 27.5))
    });
  }
  
  return schedule;
}

/**
 * Calculate capital gains tax
 */
function calculateCapitalGainsTax(
  salePrice: number,
  adjustedBasis: number,
  params: RentVsSellParams,
  accumulatedDepreciation: number
): { capitalGains: number; capitalGainsTax: number; depreciationRecapture: number } {
  const totalGain = salePrice - adjustedBasis;
  
  // Depreciation recapture is taxed at 25% (or ordinary income rate if lower)
  const depreciationRecapture = Math.min(accumulatedDepreciation, totalGain);
  const depreciationRecaptureTax = depreciationRecapture * Math.min(params.depreciationRecaptureRate / 100, params.marginalTaxRate / 100);
  
  // Remaining gain is capital gain
  const capitalGains = totalGain - depreciationRecapture;
  
  // Check if property qualifies for primary residence exemption
  let capitalGainsTax = 0;
  if (params.isInvestmentProperty || capitalGains <= 0) {
    capitalGainsTax = Math.max(0, capitalGains * (params.capitalGainsRate / 100));
  } else {
    // Primary residence exemption: $250k single, $500k married
    const exemption = params.currentHomeowner ? 250000 : 0; // Simplified - would need filing status
    const taxableGain = Math.max(0, capitalGains - exemption);
    capitalGainsTax = taxableGain * (params.capitalGainsRate / 100);
  }
  
  // Add state taxes
  const stateTax = totalGain * (params.stateIncomeTaxRate / 100);
  
  return {
    capitalGains,
    capitalGainsTax: capitalGainsTax + stateTax,
    depreciationRecapture: depreciationRecaptureTax
  };
}

/**
 * Calculate tax benefit from rental property deductions
 */
function calculateMonthlyTaxBenefit(
  mortgageInterest: number,
  propertyTax: number,
  insurance: number,
  maintenance: number,
  managementFees: number,
  hoaFees: number,
  monthlyDepreciation: number,
  marginalTaxRate: number,
  stateRate: number
): number {
  const totalDeductions = 
    mortgageInterest + 
    propertyTax + 
    insurance + 
    maintenance + 
    managementFees + 
    hoaFees + 
    monthlyDepreciation;
  
  const federalTaxBenefit = totalDeductions * (marginalTaxRate / 100);
  const stateTaxBenefit = totalDeductions * (stateRate / 100);
  
  return federalTaxBenefit + stateTaxBenefit;
}

/**
 * Main calculator function
 */
export function calculateRentVsSell(params: RentVsSellParams): RentVsSellResult {
  const monthlyData: MonthlyRentVsSellComparison[] = [];
  const yearlyData: YearlyRentVsSellSummary[] = [];
  
  // Convert to Decimal for precision
  const d = {
    propertyValue: new Decimal(params.propertyValue),
    mortgageBalance: new Decimal(params.remainingMortgageBalance),
    monthlyPayment: new Decimal(params.monthlyMortgagePayment),
    mortgageRate: new Decimal(params.mortgageInterestRate),
    monthlyRent: new Decimal(params.expectedMonthlyRent),
    originalPrice: new Decimal(params.originalPurchasePrice),
  };
  
  // Calculate selling option
  const sellingCosts = d.propertyValue.mul(params.sellingCostPercent / 100).toNumber();
  const netBeforeTax = params.propertyValue - params.remainingMortgageBalance - sellingCosts;
  
  // Calculate depreciation if property was rented
  const yearsOwned = (Date.now() - params.purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  const depreciationSchedule = calculateDepreciationSchedule(params.originalPurchasePrice);
  const accumulatedDepreciation = params.isInvestmentProperty 
    ? depreciationSchedule.slice(0, Math.floor(yearsOwned)).reduce((sum, year) => sum + year.annualDepreciation, 0)
    : 0;
  
  const { capitalGains, capitalGainsTax, depreciationRecapture } = calculateCapitalGainsTax(
    params.propertyValue,
    params.originalPurchasePrice - accumulatedDepreciation,
    params,
    accumulatedDepreciation
  );
  
  const netProceedsFromSale = netBeforeTax - capitalGainsTax - depreciationRecapture;
  
  // Initialize tracking variables
  let mortgageBalance = d.mortgageBalance;
  let investmentValue = new Decimal(netProceedsFromSale);
  let cumulativeCashFlow = new Decimal(0);
  let totalGrossRent = new Decimal(0);
  let totalVacancy = new Decimal(0);
  let totalExpenses = new Decimal(0);
  let totalMortgagePayments = new Decimal(0);
  let totalTaxBenefit = new Decimal(0);
  let breakEvenMonth: number | null = null;
  
  // Monthly calculations
  const monthsToAnalyze = params.yearsToAnalyze * 12;
  const monthlyAppreciationRate = new Decimal(params.propertyAppreciationRate / 100 / 12).plus(1);
  const monthlyRentIncreaseRate = new Decimal(params.annualRentIncreaseRate / 100 / 12).plus(1);
  const monthlyInvestmentReturn = new Decimal(params.investmentReturnRate / 100 / 12);
  const annualDepreciation = params.isInvestmentProperty ? params.originalPurchasePrice * 0.8 / 27.5 : 0;
  const monthlyDepreciation = annualDepreciation / 12;
  
  // Yearly tracking for summaries
  let yearlyGrossRent = new Decimal(0);
  let yearlyVacancy = new Decimal(0);
  let yearlyExpenses = new Decimal(0);
  let yearlyMortgage = new Decimal(0);
  let yearlyTaxBenefit = new Decimal(0);
  let yearlyCashFlow = new Decimal(0);
  
  for (let month = 1; month <= monthsToAnalyze; month++) {
    const year = Math.ceil(month / 12);
    
    // Property value with appreciation
    const propertyValue = d.propertyValue.mul(monthlyAppreciationRate.pow(month - 1));
    
    // Rental income with increases and vacancy
    const grossRent = d.monthlyRent.mul(monthlyRentIncreaseRate.pow(month - 1));
    const vacancyLoss = grossRent.mul(params.vacancyRate / 100);
    const effectiveRent = grossRent.minus(vacancyLoss);
    
    // Operating expenses (increase with inflation)
    const inflationFactor = new Decimal(1 + params.inflationRate / 100 / 12).pow(month - 1);
    const propertyTax = new Decimal(params.propertyTaxAnnual / 12).mul(inflationFactor);
    const insurance = new Decimal(params.homeownersInsuranceAnnual / 12).mul(inflationFactor);
    const hoaFees = new Decimal(params.hoaFeesMonthly).mul(inflationFactor);
    const maintenance = propertyValue.mul(params.annualMaintenancePercent / 100 / 12);
    const managementFees = effectiveRent.mul(params.propertyManagementPercent / 100);
    
    const totalOperatingExpenses = propertyTax
      .plus(insurance)
      .plus(hoaFees)
      .plus(maintenance)
      .plus(managementFees);
    
    // Net operating income (before mortgage)
    const noi = effectiveRent.minus(totalOperatingExpenses);
    
    // Mortgage payment breakdown
    let mortgagePrincipal = new Decimal(0);
    let mortgageInterest = new Decimal(0);
    
    if (mortgageBalance.greaterThan(0) && month <= params.yearsRemainingOnMortgage * 12) {
      const payment = calculateMortgagePayment(mortgageBalance, d.mortgageRate, d.monthlyPayment);
      mortgagePrincipal = payment.principal;
      mortgageInterest = payment.interest;
      mortgageBalance = payment.newBalance;
    }
    
    // Cash flow
    const cashFlow = noi.minus(d.monthlyPayment);
    
    // Tax benefit
    const monthlyTaxBenefit = calculateMonthlyTaxBenefit(
      mortgageInterest.toNumber(),
      propertyTax.toNumber(),
      insurance.toNumber(),
      maintenance.toNumber(),
      managementFees.toNumber(),
      hoaFees.toNumber(),
      monthlyDepreciation,
      params.marginalTaxRate,
      params.stateIncomeTaxRate
    );
    
    const afterTaxCashFlow = cashFlow.plus(monthlyTaxBenefit);
    cumulativeCashFlow = cumulativeCashFlow.plus(afterTaxCashFlow);
    
    // Update totals
    totalGrossRent = totalGrossRent.plus(grossRent);
    totalVacancy = totalVacancy.plus(vacancyLoss);
    totalExpenses = totalExpenses.plus(totalOperatingExpenses);
    totalMortgagePayments = totalMortgagePayments.plus(d.monthlyPayment);
    totalTaxBenefit = totalTaxBenefit.plus(monthlyTaxBenefit);
    
    // Investment growth for selling scenario
    investmentValue = investmentValue.mul(new Decimal(1).plus(monthlyInvestmentReturn));
    
    // Calculate equity
    const equity = propertyValue.minus(mortgageBalance);
    
    // Net worth comparison
    const rentingWealth = equity.plus(cumulativeCashFlow).toNumber();
    const sellingWealth = investmentValue.toNumber();
    
    // Check for break-even
    if (breakEvenMonth === null && rentingWealth >= sellingWealth) {
      breakEvenMonth = month;
    }
    
    // Track yearly data
    yearlyGrossRent = yearlyGrossRent.plus(grossRent);
    yearlyVacancy = yearlyVacancy.plus(vacancyLoss);
    yearlyExpenses = yearlyExpenses.plus(totalOperatingExpenses);
    yearlyMortgage = yearlyMortgage.plus(d.monthlyPayment);
    yearlyTaxBenefit = yearlyTaxBenefit.plus(monthlyTaxBenefit);
    yearlyCashFlow = yearlyCashFlow.plus(afterTaxCashFlow);
    
    // Store monthly data
    monthlyData.push({
      month,
      year,
      grossRentalIncome: grossRent.toNumber(),
      vacancyLoss: vacancyLoss.toNumber(),
      effectiveRentalIncome: effectiveRent.toNumber(),
      propertyTax: propertyTax.toNumber(),
      insurance: insurance.toNumber(),
      hoaFees: hoaFees.toNumber(),
      maintenance: maintenance.toNumber(),
      propertyManagement: managementFees.toNumber(),
      totalOperatingExpenses: totalOperatingExpenses.toNumber(),
      mortgagePayment: d.monthlyPayment.toNumber(),
      mortgagePrincipal: mortgagePrincipal.toNumber(),
      mortgageInterest: mortgageInterest.toNumber(),
      mortgageBalance: mortgageBalance.toNumber(),
      netOperatingIncome: noi.toNumber(),
      cashFlow: cashFlow.toNumber(),
      cumulativeCashFlow: cumulativeCashFlow.toNumber(),
      propertyValue: propertyValue.toNumber(),
      equity: equity.toNumber(),
      monthlyTaxBenefit: monthlyTaxBenefit,
      afterTaxCashFlow: afterTaxCashFlow.toNumber(),
      investmentValue: investmentValue.toNumber(),
      investmentGrowth: investmentValue.minus(netProceedsFromSale).toNumber(),
      rentingTotalWealth: rentingWealth,
      sellingTotalWealth: sellingWealth,
      wealthDifference: rentingWealth - sellingWealth
    });
    
    // Store yearly summary
    if (month % 12 === 0) {
      const yearEnd = monthlyData[month - 1];
      const currentEquity = new Decimal(yearEnd.equity);
      const cashOnCashReturn = currentEquity.greaterThan(0) 
        ? yearlyCashFlow.div(currentEquity).mul(100).toNumber() 
        : 0;
      
      yearlyData.push({
        year: year,
        annualGrossRent: yearlyGrossRent.toNumber(),
        annualVacancyLoss: yearlyVacancy.toNumber(),
        annualOperatingExpenses: yearlyExpenses.toNumber(),
        annualMortgagePayments: yearlyMortgage.toNumber(),
        annualCashFlow: yearlyCashFlow.toNumber(),
        depreciationDeduction: annualDepreciation,
        totalTaxDeductions: yearlyExpenses.plus(yearlyMortgage).plus(annualDepreciation).toNumber(),
        taxSavings: yearlyTaxBenefit.toNumber(),
        afterTaxCashFlow: yearlyCashFlow.toNumber(),
        cashOnCashReturn,
        totalReturn: cashOnCashReturn + params.propertyAppreciationRate,
        propertyValue: yearEnd.propertyValue,
        mortgageBalance: yearEnd.mortgageBalance,
        equity: yearEnd.equity,
        cumulativeCashFlow: yearEnd.cumulativeCashFlow,
        totalWealthRenting: yearEnd.rentingTotalWealth,
        totalWealthSelling: yearEnd.sellingTotalWealth
      });
      
      // Reset yearly trackers
      yearlyGrossRent = new Decimal(0);
      yearlyVacancy = new Decimal(0);
      yearlyExpenses = new Decimal(0);
      yearlyMortgage = new Decimal(0);
      yearlyTaxBenefit = new Decimal(0);
      yearlyCashFlow = new Decimal(0);
    }
  }
  
  // Calculate final metrics
  const finalMonth = monthlyData[monthlyData.length - 1];
  const averageAnnualCashFlow = cumulativeCashFlow.div(params.yearsToAnalyze).toNumber();
  const currentEquity = finalMonth.equity;
  const cashOnCashReturn = currentEquity > 0 ? (averageAnnualCashFlow / currentEquity) * 100 : 0;
  
  // Calculate cap rate (NOI / Property Value)
  const annualNOI = monthlyData.slice(-12).reduce((sum, month) => sum + month.netOperatingIncome, 0);
  const capRate = (annualNOI / finalMonth.propertyValue) * 100;
  
  // Calculate IRR (simplified - would need more complex calculation)
  const totalReturn = ((finalMonth.rentingTotalWealth - netProceedsFromSale) / netProceedsFromSale) / params.yearsToAnalyze * 100;
  
  return {
    // Selling option
    grossSaleProceeds: params.propertyValue,
    sellingCosts,
    mortgagePayoff: params.remainingMortgageBalance,
    capitalGains,
    capitalGainsTax,
    depreciationRecapture,
    netProceedsFromSale,
    projectedInvestmentValue: finalMonth.investmentValue,
    
    // Rental option
    totalGrossRentalIncome: totalGrossRent.toNumber(),
    totalVacancyLoss: totalVacancy.toNumber(),
    totalOperatingExpenses: totalExpenses.toNumber(),
    totalMortgagePayments: totalMortgagePayments.toNumber(),
    totalCashFlow: cumulativeCashFlow.toNumber(),
    totalTaxBenefit: totalTaxBenefit.toNumber(),
    propertyValueAtEnd: finalMonth.propertyValue,
    remainingMortgageAtEnd: finalMonth.mortgageBalance,
    equityAtEnd: finalMonth.equity,
    
    // Comparison
    sellingNetWorth: finalMonth.sellingTotalWealth,
    rentingNetWorth: finalMonth.rentingTotalWealth,
    financialAdvantage: finalMonth.wealthDifference,
    advantagePercentage: ((finalMonth.rentingTotalWealth / finalMonth.sellingTotalWealth) - 1) * 100,
    
    // Metrics
    averageAnnualCashFlow,
    cashOnCashReturn,
    capRate,
    totalReturnRate: totalReturn,
    internalRateOfReturn: totalReturn, // Simplified
    
    // Break-even
    breakEvenMonth,
    crossoverNetWorth: breakEvenMonth ? monthlyData[breakEvenMonth - 1].rentingTotalWealth : null,
    
    // Tax analysis
    totalDepreciationDeduction: annualDepreciation * params.yearsToAnalyze,
    totalInterestDeduction: monthlyData.reduce((sum, month) => sum + month.mortgageInterest, 0),
    totalPropertyTaxDeduction: monthlyData.reduce((sum, month) => sum + month.propertyTax, 0),
    effectiveTaxRate: (totalTaxBenefit.toNumber() / totalGrossRent.toNumber()) * 100,
    
    // Risk metrics (simplified)
    worstCaseScenario: finalMonth.rentingTotalWealth * 0.8, // 20% haircut
    bestCaseScenario: finalMonth.rentingTotalWealth * 1.2, // 20% upside
    probabilityOfPositiveCashFlow: monthlyData.filter(m => m.cashFlow > 0).length / monthlyData.length * 100,
    
    // Data
    monthlyData,
    yearlyData
  };
}