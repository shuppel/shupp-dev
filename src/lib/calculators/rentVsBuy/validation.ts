import { z } from 'zod';

export const RentVsBuySchema = z.object({
  // Basic inputs
  monthlyRent: z.number()
    .min(100, 'Monthly rent must be at least $100')
    .max(50000, 'Monthly rent must be less than $50,000'),
  homePrice: z.number()
    .min(50000, 'Home price must be at least $50,000')
    .max(10000000, 'Home price must be less than $10,000,000'),
  downPaymentPercent: z.number()
    .min(0, 'Down payment cannot be negative')
    .max(100, 'Down payment cannot exceed 100%'),
  mortgageRate: z.number()
    .min(0, 'Mortgage rate cannot be negative')
    .max(15, 'Mortgage rate must be less than 15%'),
  mortgageTerm: z.union([z.literal(15), z.literal(30)]),
  plannedYears: z.number()
    .min(1, 'Must plan to stay at least 1 year')
    .max(30, 'Cannot plan beyond 30 years'),
  
  // Tax inputs
  marginalTaxRate: z.number()
    .min(0, 'Tax rate cannot be negative')
    .max(50, 'Tax rate must be less than 50%'),
  propertyTaxRate: z.number()
    .min(0, 'Property tax rate cannot be negative')
    .max(5, 'Property tax rate must be less than 5%'),
  standardDeduction: z.number()
    .min(0, 'Standard deduction cannot be negative')
    .max(50000, 'Standard deduction must be less than $50,000'),
  
  // Ownership costs
  maintenanceRate: z.number()
    .min(0, 'Maintenance rate cannot be negative')
    .max(5, 'Maintenance rate must be less than 5%'),
  homeownersInsurance: z.number()
    .min(0, 'Insurance cannot be negative')
    .max(5000, 'Insurance must be less than $5,000/month'),
  hoaFees: z.number()
    .min(0, 'HOA fees cannot be negative')
    .max(2000, 'HOA fees must be less than $2,000/month'),
  closingCostPercent: z.number()
    .min(0, 'Closing costs cannot be negative')
    .max(10, 'Closing costs must be less than 10%'),
  sellingCostPercent: z.number()
    .min(0, 'Selling costs cannot be negative')
    .max(10, 'Selling costs must be less than 10%'),
  
  // Rental costs
  rentersInsurance: z.number()
    .min(0, 'Renters insurance cannot be negative')
    .max(200, 'Renters insurance must be less than $200/month'),
  securityDepositMonths: z.number()
    .min(0, 'Security deposit cannot be negative')
    .max(3, 'Security deposit must be less than 3 months'),
  
  // Economic assumptions
  homeAppreciationRate: z.number()
    .min(-10, 'Home appreciation cannot be less than -10%')
    .max(20, 'Home appreciation must be less than 20%'),
  rentInflationRate: z.number()
    .min(-5, 'Rent inflation cannot be less than -5%')
    .max(15, 'Rent inflation must be less than 15%'),
  investmentReturnRate: z.number()
    .min(-10, 'Investment return cannot be less than -10%')
    .max(30, 'Investment return must be less than 30%'),
});

export type ValidatedParams = z.infer<typeof RentVsBuySchema>;

export const defaultParams: ValidatedParams = {
  // Basic inputs
  monthlyRent: 2500,
  homePrice: 500000,
  downPaymentPercent: 20,
  mortgageRate: 7.0,
  mortgageTerm: 30,
  plannedYears: 7,
  
  // Tax inputs
  marginalTaxRate: 28,
  propertyTaxRate: 1.2,
  standardDeduction: 14600, // 2024 single filer
  
  // Ownership costs
  maintenanceRate: 1.0,
  homeownersInsurance: 150,
  hoaFees: 0,
  closingCostPercent: 3,
  sellingCostPercent: 6,
  
  // Rental costs
  rentersInsurance: 20,
  securityDepositMonths: 1,
  
  // Economic assumptions
  homeAppreciationRate: 3.0,
  rentInflationRate: 2.5,
  investmentReturnRate: 7.0,
};