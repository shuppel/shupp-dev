import Decimal from 'decimal.js';
import type { RentVsBuyParams, CalculationResult, MonthlyComparison, AmortizationMonth } from './types';

// Configure Decimal.js for financial precision
Decimal.set({ precision: 10, rounding: Decimal.ROUND_HALF_UP });

/**
 * Calculate monthly mortgage payment using standard amortization formula
 */
function calculateMonthlyPayment(
  principal: Decimal,
  annualRate: Decimal,
  years: number
): Decimal {
  if (annualRate.equals(0)) {
    return principal.div(years * 12);
  }
  
  const monthlyRate = annualRate.div(12).div(100);
  const numPayments = years * 12;
  
  const numerator = monthlyRate.mul(
    monthlyRate.plus(1).pow(numPayments)
  );
  const denominator = monthlyRate.plus(1).pow(numPayments).minus(1);
  
  return principal.mul(numerator.div(denominator));
}

/**
 * Generate amortization schedule for the loan
 */
function generateAmortizationSchedule(
  loanAmount: Decimal,
  annualRate: Decimal,
  years: number
): AmortizationMonth[] {
  const schedule: AmortizationMonth[] = [];
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualRate, years);
  const monthlyRate = annualRate.div(12).div(100);
  
  let balance = loanAmount;
  
  for (let month = 1; month <= years * 12; month++) {
    const interest = balance.mul(monthlyRate);
    const principal = monthlyPayment.minus(interest);
    balance = balance.minus(principal);
    
    // Ensure balance doesn't go negative due to rounding
    if (balance.lessThan(0)) {
      balance = new Decimal(0);
    }
    
    schedule.push({
      month,
      payment: monthlyPayment.toNumber(),
      principal: principal.toNumber(),
      interest: interest.toNumber(),
      balance: balance.toNumber(),
    });
    
    if (balance.equals(0)) break;
  }
  
  return schedule;
}

/**
 * Calculate tax benefit from mortgage interest and property tax deductions
 */
function calculateTaxBenefit(
  yearlyMortgageInterest: Decimal,
  yearlyPropertyTax: Decimal,
  standardDeduction: Decimal,
  marginalTaxRate: Decimal
): Decimal {
  // Apply SALT cap of $10,000
  const saltCap = new Decimal(10000);
  const cappedPropertyTax = Decimal.min(yearlyPropertyTax, saltCap);
  
  // Total itemized deductions
  const totalItemized = yearlyMortgageInterest.plus(cappedPropertyTax);
  
  // Tax benefit is the amount above standard deduction times marginal rate
  const deductionBenefit = Decimal.max(
    0,
    totalItemized.minus(standardDeduction)
  );
  
  return deductionBenefit.mul(marginalTaxRate.div(100));
}

/**
 * Main calculator function
 */
export function calculateRentVsBuy(
  params: RentVsBuyParams, 
  financialInfo?: { annualIncome: number; monthlyDebts: number; currentSavings: number }
): CalculationResult {
  const months = params.plannedYears * 12;
  const monthlyData: MonthlyComparison[] = [];
  
  // Adjust parameters based on user profile
  let adjustedParams = { ...params };
  
  // Adjust standard deduction based on filing status
  if (params.filingStatus === 'married') {
    adjustedParams.standardDeduction = Math.max(29200, params.standardDeduction);
  } else if (params.filingStatus === 'single') {
    adjustedParams.standardDeduction = Math.min(14600, params.standardDeduction);
  }
  
  // Adjust appreciation rate based on market outlook
  if (params.marketOutlook === 'hot') {
    adjustedParams.homeAppreciationRate = Math.max(5, params.homeAppreciationRate);
  } else if (params.marketOutlook === 'cooling') {
    adjustedParams.homeAppreciationRate = Math.min(1, params.homeAppreciationRate);
  }
  
  // Adjust investment return based on confidence
  if (params.investmentConfidence === 'conservative') {
    adjustedParams.investmentReturnRate = Math.min(5, params.investmentReturnRate);
  } else if (params.investmentConfidence === 'aggressive') {
    adjustedParams.investmentReturnRate = Math.max(10, params.investmentReturnRate);
  }
  
  // Convert to Decimal for precision
  const d = {
    homePrice: new Decimal(adjustedParams.homePrice),
    downPaymentPercent: new Decimal(adjustedParams.downPaymentPercent),
    monthlyRent: new Decimal(adjustedParams.monthlyRent),
    mortgageRate: new Decimal(adjustedParams.mortgageRate),
    propertyTaxRate: new Decimal(adjustedParams.propertyTaxRate),
    maintenanceRate: new Decimal(adjustedParams.maintenanceRate),
    homeownersInsurance: new Decimal(adjustedParams.homeownersInsurance),
    hoaFees: new Decimal(adjustedParams.hoaFees),
    closingCostPercent: new Decimal(adjustedParams.closingCostPercent),
    sellingCostPercent: new Decimal(adjustedParams.sellingCostPercent),
    rentersInsurance: new Decimal(adjustedParams.rentersInsurance),
    securityDepositMonths: new Decimal(adjustedParams.securityDepositMonths),
    homeAppreciationRate: new Decimal(adjustedParams.homeAppreciationRate),
    rentInflationRate: new Decimal(adjustedParams.rentInflationRate),
    investmentReturnRate: new Decimal(adjustedParams.investmentReturnRate),
    marginalTaxRate: new Decimal(adjustedParams.marginalTaxRate),
    standardDeduction: new Decimal(adjustedParams.standardDeduction),
  };
  
  // Calculate initial values
  const downPayment = d.homePrice.mul(d.downPaymentPercent.div(100));
  const loanAmount = d.homePrice.minus(downPayment);
  const closingCosts = d.homePrice.mul(d.closingCostPercent.div(100));
  
  // Generate amortization schedule
  const amortization = generateAmortizationSchedule(
    loanAmount,
    d.mortgageRate,
    params.mortgageTerm
  );
  
  // Initialize tracking variables
  let buyingCumulative = downPayment.plus(closingCosts).toNumber();
  let rentingCumulative = d.monthlyRent.mul(d.securityDepositMonths).toNumber();
  let investmentBalance = buyingCumulative; // What you'd have if you rented instead
  let breakEvenMonth: number | null = null;
  let totalTaxBenefit = 0;
  let totalInterestPaid = 0;
  
  // Monthly rates
  const monthlyAppreciationRate = d.homeAppreciationRate.div(100).div(12).plus(1);
  const monthlyRentInflationRate = d.rentInflationRate.div(100).div(12).plus(1);
  const monthlyInvestmentReturn = d.investmentReturnRate.div(100).div(12);
  
  // Calculate month by month
  for (let month = 1; month <= months; month++) {
    const amortMonth = amortization[Math.min(month - 1, amortization.length - 1)];
    
    // Track total interest
    totalInterestPaid += amortMonth.interest;
    
    // Current values
    const homeValue = d.homePrice.mul(monthlyAppreciationRate.pow(month));
    const currentRent = d.monthlyRent.mul(monthlyRentInflationRate.pow(month - 1));
    
    // Monthly buying costs
    const propertyTax = homeValue.mul(d.propertyTaxRate.div(100).div(12));
    const maintenance = homeValue.mul(d.maintenanceRate.div(100).div(12));
    const monthlyBuyingCost = new Decimal(amortMonth.payment)
      .plus(propertyTax)
      .plus(d.homeownersInsurance)
      .plus(maintenance)
      .plus(d.hoaFees);
    
    // Calculate monthly tax benefit
    const yearlyInterest = new Decimal(amortMonth.interest).mul(12);
    const yearlyPropertyTax = propertyTax.mul(12);
    const yearlyTaxBenefit = calculateTaxBenefit(
      yearlyInterest,
      yearlyPropertyTax,
      d.standardDeduction,
      d.marginalTaxRate
    );
    const monthlyTaxBenefit = yearlyTaxBenefit.div(12);
    totalTaxBenefit += monthlyTaxBenefit.toNumber();
    
    const netBuyingCost = monthlyBuyingCost.minus(monthlyTaxBenefit).toNumber();
    buyingCumulative += netBuyingCost;
    
    // Monthly renting costs
    const monthlyRentingCost = currentRent.plus(d.rentersInsurance).toNumber();
    rentingCumulative += monthlyRentingCost;
    
    // Update investment balance
    investmentBalance = investmentBalance * (1 + monthlyInvestmentReturn.toNumber());
    
    // If renting is cheaper, invest the difference
    const costDifference = netBuyingCost - monthlyRentingCost;
    if (costDifference > 0) {
      investmentBalance += costDifference;
    }
    
    // Calculate equity
    const mortgageBalance = amortMonth.balance;
    const homeEquity = homeValue.toNumber() - mortgageBalance;
    
    // Check for break-even
    if (breakEvenMonth === null && buyingCumulative <= rentingCumulative) {
      breakEvenMonth = month;
    }
    
    monthlyData.push({
      month,
      buyingCost: netBuyingCost,
      rentingCost: monthlyRentingCost,
      buyingCumulative,
      rentingCumulative,
      homeValue: homeValue.toNumber(),
      mortgageBalance,
      homeEquity,
      investmentValue: investmentBalance,
    });
  }
  
  // Calculate final values
  const finalMonth = monthlyData[monthlyData.length - 1];
  const sellingCosts = finalMonth.homeValue * (params.sellingCostPercent / 100);
  const netHomeEquity = finalMonth.homeEquity - sellingCosts;
  
  // Net advantage: (home equity - total buying cost) vs (investment value - total renting cost)
  const buyingNetWealth = netHomeEquity - buyingCumulative;
  const rentingNetWealth = investmentBalance - rentingCumulative;
  const netAdvantage = buyingNetWealth - rentingNetWealth;
  
  // Calculate monthly payment and ratios
  const monthlyPayment = amortization[0].payment;
  const monthlyIncome = financialInfo?.annualIncome 
    ? financialInfo.annualIncome / 12 
    : params.homePrice / 4 / 12; // Fallback estimate: home price = 4x annual income
  const totalMonthlyDebt = (financialInfo?.monthlyDebts || 0) + monthlyPayment;
  const monthlyPaymentRatio = (totalMonthlyDebt / monthlyIncome) * 100;
  
  // Calculate effective interest rate after tax benefits
  const nominalTotalInterest = totalInterestPaid;
  const effectiveTotalInterest = totalInterestPaid - totalTaxBenefit;
  const effectiveRate = params.mortgageRate * (effectiveTotalInterest / nominalTotalInterest);
  
  // Determine financial health score
  let financialHealthScore: CalculationResult['financialHealthScore'];
  if (monthlyPaymentRatio > 35) {
    financialHealthScore = 'house-poor';
  } else if (monthlyPaymentRatio > 28) {
    financialHealthScore = 'stretched';
  } else if (monthlyPaymentRatio > 20) {
    financialHealthScore = 'comfortable';
  } else if (monthlyPaymentRatio > 15) {
    financialHealthScore = 'golden-zone';
  } else {
    financialHealthScore = 'great-deal';
  }
  
  return {
    totalBuyingCost: buyingCumulative,
    totalRentingCost: rentingCumulative,
    netAdvantage,
    breakEvenMonth,
    homeEquity: netHomeEquity,
    investmentValue: investmentBalance,
    totalTaxBenefit,
    monthlyData,
    totalInterestPaid,
    effectiveRate,
    financialHealthScore,
    monthlyPaymentRatio,
  };
}