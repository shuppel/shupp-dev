# Rent vs Buy Calculator - Implementation Guide

## Quick Start Implementation

### Step 1: Create the Tool Component Structure

```typescript
// src/components/tools/RentVsBuy.astro
---
// This component will be dynamically loaded on the tool page
---

<div id="rent-vs-buy-calculator" class="tool-container">
  <div class="calculator-wrapper">
    <!-- React component will mount here -->
  </div>
</div>

<script>
  // Dynamic import of React component
  import { mount } from './RentVsBuy/mount';
  mount();
</script>

<style>
  .tool-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
</style>
```

### Step 2: Create Basic Types

```typescript
// src/lib/calculators/rentVsBuy/types.ts
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
  
  // Costs
  maintenanceRate: number;
  homeownersInsurance: number;
  hoaFees: number;
  closingCostPercent: number;
  
  // Assumptions
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
  monthlyData: MonthlyComparison[];
}

export interface MonthlyComparison {
  month: number;
  buyingCost: number;
  rentingCost: number;
  buyingCumulative: number;
  rentingCumulative: number;
  homeEquity: number;
  investmentValue: number;
}
```

### Step 3: Create Validation Schema

```typescript
// src/lib/calculators/rentVsBuy/validation.ts
import { z } from 'zod';

export const RentVsBuySchema = z.object({
  monthlyRent: z.number().min(100).max(50000),
  homePrice: z.number().min(50000).max(10000000),
  downPaymentPercent: z.number().min(0).max(100),
  mortgageRate: z.number().min(0).max(15),
  mortgageTerm: z.union([z.literal(15), z.literal(30)]),
  plannedYears: z.number().min(1).max(30),
  marginalTaxRate: z.number().min(0).max(50),
  propertyTaxRate: z.number().min(0).max(5),
  standardDeduction: z.number().min(0).max(50000),
  maintenanceRate: z.number().min(0).max(5),
  homeownersInsurance: z.number().min(0).max(5000),
  hoaFees: z.number().min(0).max(2000),
  closingCostPercent: z.number().min(0).max(10),
  homeAppreciationRate: z.number().min(-10).max(20),
  rentInflationRate: z.number().min(-5).max(15),
  investmentReturnRate: z.number().min(-10).max(30),
});

export const defaultParams: z.infer<typeof RentVsBuySchema> = {
  monthlyRent: 2500,
  homePrice: 500000,
  downPaymentPercent: 20,
  mortgageRate: 7.0,
  mortgageTerm: 30,
  plannedYears: 7,
  marginalTaxRate: 28,
  propertyTaxRate: 1.2,
  standardDeduction: 14600,
  maintenanceRate: 1.0,
  homeownersInsurance: 150,
  hoaFees: 0,
  closingCostPercent: 3,
  homeAppreciationRate: 3.0,
  rentInflationRate: 2.5,
  investmentReturnRate: 7.0,
};
```

### Step 4: Simple Calculator Implementation

```typescript
// src/lib/calculators/rentVsBuy/calculator.ts
import Decimal from 'decimal.js';
import type { RentVsBuyParams, CalculationResult } from './types';

export function calculateRentVsBuy(params: RentVsBuyParams): CalculationResult {
  const months = params.plannedYears * 12;
  const monthlyData = [];
  
  // Calculate loan amount
  const downPayment = params.homePrice * (params.downPaymentPercent / 100);
  const loanAmount = params.homePrice - downPayment;
  
  // Calculate monthly mortgage payment
  const monthlyRate = params.mortgageRate / 100 / 12;
  const numPayments = params.mortgageTerm * 12;
  const monthlyPrincipalInterest = 
    loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  // Initialize cumulative costs
  let buyingCumulative = downPayment + (params.homePrice * params.closingCostPercent / 100);
  let rentingCumulative = params.monthlyRent; // First month + deposit
  let investmentBalance = buyingCumulative; // What you'd have if you rented
  
  let loanBalance = loanAmount;
  let breakEvenMonth = null;
  
  // Calculate month by month
  for (let month = 1; month <= months; month++) {
    // Current home value
    const monthlyAppreciation = Math.pow(1 + params.homeAppreciationRate / 100, 1/12);
    const homeValue = params.homePrice * Math.pow(monthlyAppreciation, month);
    
    // Current rent
    const monthlyRentInflation = Math.pow(1 + params.rentInflationRate / 100, 1/12);
    const currentRent = params.monthlyRent * Math.pow(monthlyRentInflation, month - 1);
    
    // Monthly buying costs
    const propertyTax = homeValue * (params.propertyTaxRate / 100 / 12);
    const maintenance = homeValue * (params.maintenanceRate / 100 / 12);
    const monthlyBuyingCost = monthlyPrincipalInterest + propertyTax + 
      params.homeownersInsurance + maintenance + params.hoaFees;
    
    // Tax benefit (simplified)
    const yearlyMortgageInterest = loanBalance * params.mortgageRate / 100;
    const yearlyPropertyTax = homeValue * params.propertyTaxRate / 100;
    const yearlyDeductions = yearlyMortgageInterest + Math.min(yearlyPropertyTax, 10000);
    const taxBenefit = Math.max(0, (yearlyDeductions - params.standardDeduction) * 
      params.marginalTaxRate / 100) / 12;
    
    const netBuyingCost = monthlyBuyingCost - taxBenefit;
    buyingCumulative += netBuyingCost;
    
    // Monthly renting costs
    rentingCumulative += currentRent;
    
    // Update loan balance (simplified - assumes all of P&I goes to principal)
    const monthlyPrincipal = monthlyPrincipalInterest * 0.3; // Simplified
    loanBalance = Math.max(0, loanBalance - monthlyPrincipal);
    
    // Calculate equity
    const homeEquity = homeValue - loanBalance;
    
    // Update investment balance
    const monthlyInvestmentReturn = params.investmentReturnRate / 100 / 12;
    investmentBalance = investmentBalance * (1 + monthlyInvestmentReturn);
    
    // If renting is cheaper, invest the difference
    if (currentRent < netBuyingCost) {
      investmentBalance += (netBuyingCost - currentRent);
    }
    
    // Check for break-even
    if (breakEvenMonth === null && buyingCumulative <= rentingCumulative) {
      breakEvenMonth = month;
    }
    
    monthlyData.push({
      month,
      buyingCost: netBuyingCost,
      rentingCost: currentRent,
      buyingCumulative,
      rentingCumulative,
      homeEquity,
      investmentValue: investmentBalance,
    });
  }
  
  // Final calculations
  const finalHomeValue = params.homePrice * 
    Math.pow(1 + params.homeAppreciationRate / 100, params.plannedYears);
  const sellingCosts = finalHomeValue * 0.06; // 6% selling costs
  const finalEquity = finalHomeValue - loanBalance - sellingCosts;
  
  return {
    totalBuyingCost: buyingCumulative,
    totalRentingCost: rentingCumulative,
    netAdvantage: (finalEquity - buyingCumulative) - (investmentBalance - rentingCumulative),
    breakEvenMonth,
    homeEquity: finalEquity,
    investmentValue: investmentBalance,
    monthlyData,
  };
}
```

### Step 5: Create React Components

```tsx
// src/components/tools/RentVsBuy/Calculator.tsx
import React, { useState } from 'react';
import { calculateRentVsBuy } from '@/lib/calculators/rentVsBuy/calculator';
import { defaultParams } from '@/lib/calculators/rentVsBuy/validation';
import type { RentVsBuyParams, CalculationResult } from '@/lib/calculators/rentVsBuy/types';
import InputForm from './InputForm';
import ResultsDisplay from './ResultsDisplay';

export default function Calculator() {
  const [params, setParams] = useState<RentVsBuyParams>(defaultParams);
  const [results, setResults] = useState<CalculationResult | null>(null);

  const handleCalculate = (newParams: RentVsBuyParams) => {
    setParams(newParams);
    const calculationResults = calculateRentVsBuy(newParams);
    setResults(calculationResults);
  };

  return (
    <div className="calculator">
      <div className="calculator-grid">
        <div className="input-section">
          <h2>Input Parameters</h2>
          <InputForm 
            params={params} 
            onCalculate={handleCalculate} 
          />
        </div>
        
        {results && (
          <div className="results-section">
            <h2>Results</h2>
            <ResultsDisplay results={results} />
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 6: Mount the Component

```typescript
// src/components/tools/RentVsBuy/mount.ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import Calculator from './Calculator';

export function mount() {
  const container = document.querySelector('.calculator-wrapper');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(Calculator));
  }
}
```

### Step 7: Update Tool Mounting System

```typescript
// src/pages/tools/[slug].astro
// Add to the script section:

// Tool component loader
document.addEventListener('DOMContentLoaded', async () => {
  const toolMount = document.getElementById('tool-mount');
  const componentName = toolMount?.dataset.component;
  
  if (componentName === 'RentVsBuy') {
    const { mount } = await import('@/components/tools/RentVsBuy/mount');
    mount();
  }
});
```

## Next Steps

1. **Enhance the Calculator** - Add more sophisticated calculations
2. **Add Visualizations** - Implement Chart.js for graphs
3. **Improve UI** - Create a better form layout with sections
4. **Add Features** - Sensitivity analysis, save/share functionality
5. **Testing** - Add unit tests for calculations
6. **Documentation** - Add tooltips and explanations

## Dependencies to Install

```bash
npm install decimal.js zod @types/react @types/react-dom
npm install -D @types/node
```

## File Structure Summary

```
src/
├── components/
│   └── tools/
│       ├── RentVsBuy.astro
│       └── RentVsBuy/
│           ├── Calculator.tsx
│           ├── InputForm.tsx
│           ├── ResultsDisplay.tsx
│           ├── ComparisonChart.tsx
│           └── mount.ts
├── lib/
│   └── calculators/
│       └── rentVsBuy/
│           ├── calculator.ts
│           ├── types.ts
│           └── validation.ts
└── content/
    └── tools/
        └── rent-vs-buy.md (already created)