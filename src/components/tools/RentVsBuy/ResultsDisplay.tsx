import React, { useState } from 'react';
import type { CalculationResult } from '../../../lib/calculators/rentVsBuy/types';
import ComparisonChart from './ComparisonChart';
import './ResultsDisplay.css';
import './ComparisonChart.css';

interface ResultsDisplayProps {
  results: CalculationResult;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps): React.JSX.Element {
  const [chartType, setChartType] = useState<'cumulative' | 'monthly' | 'wealth'>('cumulative');
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatBreakEven = (months: number | null): string => {
    if (months === null || months === 0) return 'Never';
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    
    if (years === 0) {
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    } else if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? 's' : ''}`;
    } else {
      return `${years} year${years !== 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    }
  };

  const isBuyingBetter = results.netAdvantage > 0;
  const savingsAmount = Math.abs(results.netAdvantage);

  return (
    <div className="results-display">
      {/* Main Recommendation */}
      <div className="recommendation-card">
        <div className="recommendation-header">
          <h3>Financial Recommendation</h3>
          <div 
            className={`recommendation-badge ${isBuyingBetter ? 'buy' : 'rent'}`}
            role="status"
            aria-live="polite"
          >
            <span role="img" aria-label={isBuyingBetter ? 'House' : 'Key'}>
              {isBuyingBetter ? '🏠' : '🗝️'}
            </span>
            {isBuyingBetter ? 'Buy' : 'Rent'}
          </div>
        </div>
        <p className="recommendation-text">
          <strong>{isBuyingBetter ? 'Buying' : 'Renting'}</strong> provides better financial outcomes 
          by <strong>{formatCurrency(savingsAmount)}</strong> over your {Math.floor(results.monthlyData.length / 12)}-year analysis period.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">💰 Total Cost (Buying)</div>
          <div className="metric-value">{formatCurrency(results.totalBuyingCost)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">🏠 Total Cost (Renting)</div>
          <div className="metric-value">{formatCurrency(results.totalRentingCost)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">⚡ Break-even Point</div>
          <div className="metric-value">{formatBreakEven(results.breakEvenMonth)}</div>
        </div>
        
        <div className="metric-card">
          <div className="metric-label">📊 Tax Benefits</div>
          <div className="metric-value">{formatCurrency(results.totalTaxBenefit)}</div>
        </div>
      </div>

      {/* Wealth Comparison */}
      <div className="wealth-comparison">
        <h4>End-of-Period Wealth</h4>
        <div className="wealth-grid">
          <div className="wealth-card buying">
            <div className="wealth-label">If You Buy</div>
            <div className="wealth-value">{formatCurrency(results.homeEquity)}</div>
            <div className="wealth-description">Net home equity after selling</div>
          </div>
          
          <div className="wealth-card renting">
            <div className="wealth-label">If You Rent</div>
            <div className="wealth-value">{formatCurrency(results.investmentValue)}</div>
            <div className="wealth-description">Investment account balance</div>
          </div>
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="charts-section">
        <div className="chart-type-selector">
          <button 
            className={`chart-type-btn ${chartType === 'cumulative' ? 'active' : ''}`}
            onClick={() => setChartType('cumulative')}
          >
            📊 Cumulative Costs
          </button>
          <button 
            className={`chart-type-btn ${chartType === 'monthly' ? 'active' : ''}`}
            onClick={() => setChartType('monthly')}
          >
            📈 Monthly Costs
          </button>
          <button 
            className={`chart-type-btn ${chartType === 'wealth' ? 'active' : ''}`}
            onClick={() => setChartType('wealth')}
          >
            💰 Wealth Growth
          </button>
        </div>
        <ComparisonChart results={results} chartType={chartType} />
      </div>

      {/* Monthly Breakdown (first few months as example) */}
      <div className="monthly-preview">
        <h4>Monthly Cost Preview</h4>
        <div className="cost-comparison">
          {results.monthlyData.slice(0, 3).map((month) => (
            <div key={month.month} className="month-row">
              <div className="month-label">Month {month.month}</div>
              <div className="month-costs">
                <div className="cost-item">
                  <span>Buying:</span>
                  <span>{formatCurrency(month.buyingCost)}</span>
                </div>
                <div className="cost-item">
                  <span>Renting:</span>
                  <span>{formatCurrency(month.rentingCost)}</span>
                </div>
              </div>
            </div>
          ))}
          {results.monthlyData.length > 3 && (
            <div className="more-data">
              <span>... and {results.monthlyData.length - 3} more months</span>
            </div>
          )}
        </div>
      </div>

      {/* Assumptions & Disclaimers */}
      <div className="disclaimers">
        <h4>Important Assumptions</h4>
        <ul>
          <li>All calculations are in today's dollars</li>
          <li>Tax benefits assume you itemize deductions</li>
          <li>Investment returns are assumed to compound monthly</li>
          <li>Home selling costs are deducted from final equity</li>
          <li>Results are estimates for comparison purposes only</li>
        </ul>
      </div>
    </div>
  );
}