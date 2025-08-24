# Rent vs Buy Calculator - Architecture Document

## Overview
An open-source financial calculator tool that helps users determine whether renting or buying a home is the better financial decision based on their specific circumstances.

## Tech Stack

### Core Framework
- **Astro 5.x** - Static site generator with islands architecture
- **TypeScript** - Type safety across the application
- **React** - For interactive calculator components

### State Management
- **Nanostores** - Lightweight state management that works well with Astro's architecture
- **@nanostores/react** - React bindings for component integration

### Financial Calculations
- **decimal.js** - Precise decimal arithmetic for financial calculations
- **Simple helper functions** - Custom implementations for mortgage calculations, NPV, etc.

### Data Visualization
- **Chart.js** or **Recharts** - For interactive charts showing cost comparisons
- **CSS Grid/Flexbox** - For responsive layouts

### Validation
- **Zod** - Runtime validation for form inputs and API parameters

### Deployment
- **Netlify** - Static hosting with serverless functions
- **Netlify Functions** - For API endpoints (optional)

## Architecture

### Component Structure
```
src/
├── components/
│   └── tools/
│       ├── RentVsBuy/
│       │   ├── Calculator.tsx          # Main calculator component
│       │   ├── InputForm.tsx          # Input form with validation
│       │   ├── ResultsDisplay.tsx     # Results visualization
│       │   ├── ComparisonChart.tsx    # Chart component
│       │   └── BreakdownTable.tsx     # Detailed breakdown
│       └── RentVsBuy.astro            # Wrapper component
├── lib/
│   └── calculators/
│       └── rentVsBuy/
│           ├── calculator.ts          # Core calculation logic
│           ├── types.ts               # TypeScript interfaces
│           ├── validation.ts          # Zod schemas
│           └── helpers.ts             # Utility functions
└── stores/
    └── rentVsBuy.ts                   # Nanostores for state
```

### Data Flow
1. User inputs parameters through the form
2. Validation via Zod schemas
3. State updates in Nanostores
4. Calculations performed using decimal.js
5. Results displayed in real-time
6. Charts update automatically

## Core Features

### Input Parameters

#### Basic Inputs
- Monthly rent
- Home price
- Down payment percentage
- Mortgage rate & term
- Planned years to stay

#### Tax Considerations
- Marginal tax rate
- Property tax rate
- Standard vs itemized deductions
- State/local tax (SALT) cap

#### Ownership Costs
- Maintenance rate
- Homeowners insurance
- HOA fees
- Closing costs
- Selling costs

#### Economic Assumptions
- Home appreciation rate
- Rent inflation rate
- Investment return rate

### Calculations

#### Monthly Mortgage Payment
```typescript
function calculateMonthlyPayment(
  principal: Decimal,
  annualRate: Decimal,
  years: number
): Decimal {
  const monthlyRate = annualRate.div(12).div(100);
  const numPayments = years * 12;
  
  if (annualRate.equals(0)) {
    return principal.div(numPayments);
  }
  
  const factor = monthlyRate.mul(
    monthlyRate.plus(1).pow(numPayments)
  ).div(
    monthlyRate.plus(1).pow(numPayments).minus(1)
  );
  
  return principal.mul(factor);
}
```

#### Tax Benefits
- Compare itemized deductions (mortgage interest + property tax) vs standard deduction
- Apply SALT cap limitations
- Calculate net tax benefit

#### Opportunity Cost
- Track investment value of down payment
- Add monthly cost differentials when renting is cheaper
- Compound at expected investment return rate

#### Break-Even Analysis
- Find month where cumulative buying costs ≤ cumulative renting costs
- Include opportunity costs in comparison

### Output Metrics

#### Summary Results
- Net advantage (positive = buying better)
- Break-even point in years/months
- Total tax benefit
- Final home equity vs investment value

#### Visualizations
1. **Cumulative Cost Chart** - Line chart comparing total costs over time
2. **Equity vs Investment Chart** - Shows wealth accumulation paths
3. **Monthly Cost Breakdown** - Stacked bar chart of cost components
4. **Sensitivity Analysis** - How changes affect the outcome

## Implementation Plan

### Phase 1: Core Calculator
1. Set up component structure in tools directory
2. Implement basic calculation engine with decimal.js
3. Create input form with Zod validation
4. Display basic results

### Phase 2: Visualizations
1. Add Chart.js/Recharts integration
2. Create comparison charts
3. Add detailed breakdown tables
4. Implement responsive design

### Phase 3: Advanced Features
1. Sensitivity analysis sliders
2. Save/share functionality
3. PDF export of results
4. Comparison scenarios

### Phase 4: Polish
1. Add tooltips and help text
2. Improve mobile experience
3. Add print styles
4. Performance optimization

## State Management

```typescript
// stores/rentVsBuy.ts
import { atom, computed } from 'nanostores';
import type { RentVsBuyParams, CalculationResult } from '@/lib/calculators/rentVsBuy/types';

export const $params = atom<RentVsBuyParams>({
  monthlyRent: 2500,
  homePrice: 500000,
  downPaymentPercent: 20,
  mortgageRate: 7.0,
  mortgageTerm: 30,
  // ... other defaults
});

export const $results = computed($params, (params) => {
  return calculateRentVsBuy(params);
});

export const $chartData = computed($results, (results) => {
  return formatChartData(results);
});
```

## API Design (Optional)

If we want to add API endpoints using Netlify Functions:

```typescript
// netlify/functions/calculate-rent-vs-buy.ts
export async function handler(event: HandlerEvent) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const params = JSON.parse(event.body);
    const validated = RentVsBuySchema.parse(params);
    const results = calculateRentVsBuy(validated);
    
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid parameters' }),
    };
  }
}
```

## Testing Strategy

1. **Unit Tests** - Test calculation functions with known inputs/outputs
2. **Validation Tests** - Ensure Zod schemas work correctly
3. **Integration Tests** - Test full calculation flow
4. **Visual Tests** - Ensure charts render correctly

## Performance Considerations

1. **Lazy Load Charts** - Only load visualization libraries when needed
2. **Memoize Calculations** - Cache results for same inputs
3. **Web Workers** - Move heavy calculations off main thread (if needed)
4. **Progressive Enhancement** - Basic functionality works without JavaScript

## Accessibility

1. **Form Labels** - Clear, descriptive labels for all inputs
2. **ARIA Labels** - For interactive charts and controls
3. **Keyboard Navigation** - Full keyboard support
4. **Screen Reader Support** - Alternative text for visualizations
5. **Color Contrast** - WCAG AAA compliance

## Security

1. **Input Validation** - Strict validation of all user inputs
2. **No Server State** - All calculations client-side
3. **Content Security Policy** - Restrict external resources
4. **HTTPS Only** - Enforce secure connections

## Future Enhancements

1. **Multiple Scenarios** - Compare different properties
2. **Monte Carlo Simulation** - Account for uncertainty
3. **Regional Data** - Pre-fill based on location
4. **Historical Analysis** - Use past data for projections
5. **Mobile App** - Progressive Web App capabilities

## Documentation

1. **User Guide** - How to use the calculator
2. **Methodology** - Explain calculations and assumptions
3. **API Documentation** - If APIs are implemented
4. **Contributing Guide** - For open source contributions