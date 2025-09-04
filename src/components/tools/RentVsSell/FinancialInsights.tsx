import React from 'react';
import type { RentVsSellResult } from '../../../lib/calculators/rentVsSell/types';
import './FinancialInsights.css';

interface FinancialInsightsProps {
  results: RentVsSellResult;
}

export default function FinancialInsights({ results }: FinancialInsightsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const recommendation = results.financialAdvantage > 0 ? 'rent' : 'sell';
  
  // Calculate key insights
  const monthlyAvgCashFlow = results.averageAnnualCashFlow / 12;
  const isPositiveCashFlow = monthlyAvgCashFlow > 0;
  const yearsToDoubleEquity = results.propertyValueAtEnd > 0 
    ? Math.log(2) / Math.log(1 + (results.totalReturnRate / 100))
    : 0;

  return (
    <div className="financial-insights">
      <h3>Financial Analysis & Insights</h3>
      
      <div className="insights-grid">
        <div className="insight-card">
          <div className="insight-icon">💡</div>
          <h4>Key Recommendation</h4>
          <p>
            Based on your inputs, <strong>{recommendation === 'rent' ? 'keeping and renting' : 'selling now'}</strong> your 
            property would result in {formatCurrency(Math.abs(results.financialAdvantage))} more wealth 
            over {results.yearlyData.length} years.
          </p>
        </div>

        <div className="insight-card">
          <div className="insight-icon">💰</div>
          <h4>Cash Flow Analysis</h4>
          <p>
            {isPositiveCashFlow ? (
              <>Your rental would generate an average of <strong>{formatCurrency(monthlyAvgCashFlow)}/month</strong> in positive cash flow.</>
            ) : (
              <>You would need to contribute <strong>{formatCurrency(Math.abs(monthlyAvgCashFlow))}/month</strong> to cover expenses.</>
            )}
          </p>
          <div className="cash-flow-indicator">
            <span className={`indicator ${isPositiveCashFlow ? 'positive' : 'negative'}`}>
              {isPositiveCashFlow ? '↑' : '↓'} {formatCurrency(results.totalCashFlow)} total
            </span>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">📊</div>
          <h4>Tax Benefits</h4>
          <p>
            As a landlord, you would save <strong>{formatCurrency(results.totalTaxBenefit)}</strong> in taxes
            through deductions for depreciation, mortgage interest, and operating expenses.
          </p>
          <div className="tax-breakdown">
            <div className="tax-item">
              <span>Effective Tax Rate:</span>
              <span>{results.effectiveTaxRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="insight-card">
          <div className="insight-icon">📈</div>
          <h4>Return on Investment</h4>
          <p>
            Your rental property would generate a <strong>{results.cashOnCashReturn.toFixed(1)}%</strong> cash-on-cash return
            and a total return of <strong>{results.totalReturnRate.toFixed(1)}%</strong> including appreciation.
          </p>
          {yearsToDoubleEquity > 0 && (
            <div className="roi-metric">
              Equity doubles in ~{Math.round(yearsToDoubleEquity)} years
            </div>
          )}
        </div>
      </div>

      <div className="risk-analysis">
        <h4>Risk Considerations</h4>
        <div className="risk-grid">
          <div className="risk-item">
            <h5>Liquidity Risk</h5>
            <div className="risk-level low">Low</div>
            <p>Selling provides immediate liquidity. Renting ties up capital but builds long-term wealth.</p>
          </div>
          
          <div className="risk-item">
            <h5>Management Burden</h5>
            <div className="risk-level medium">Medium</div>
            <p>Being a landlord requires time and effort, even with property management.</p>
          </div>
          
          <div className="risk-item">
            <h5>Market Risk</h5>
            <div className="risk-level low">Low</div>
            <p>Real estate typically provides stable returns but can be affected by local market conditions.</p>
          </div>
        </div>
      </div>

      <div className="scenario-analysis">
        <h4>What-If Scenarios</h4>
        <div className="scenarios">
          <div className="scenario">
            <span className="scenario-label">Best Case ({formatCurrency(results.bestCaseScenario)})</span>
            <p>Lower vacancy, higher appreciation</p>
          </div>
          <div className="scenario">
            <span className="scenario-label">Expected ({formatCurrency(results.rentingNetWorth)})</span>
            <p>Based on your assumptions</p>
          </div>
          <div className="scenario">
            <span className="scenario-label">Worst Case ({formatCurrency(results.worstCaseScenario)})</span>
            <p>Higher vacancy, maintenance issues</p>
          </div>
        </div>
      </div>

      <div className="next-steps">
        <h4>Recommended Next Steps</h4>
        {recommendation === 'rent' ? (
          <ol>
            <li>Research comparable rental rates in your area to validate assumptions</li>
            <li>Interview property management companies if not self-managing</li>
            <li>Review landlord insurance options and costs</li>
            <li>Consult with a tax professional about rental property deductions</li>
            <li>Create a reserve fund for maintenance and vacancies</li>
          </ol>
        ) : (
          <ol>
            <li>Get a comparative market analysis (CMA) from a real estate agent</li>
            <li>Research investment options for the sale proceeds</li>
            <li>Consult with a tax professional about capital gains implications</li>
            <li>Consider timing of sale for optimal tax treatment</li>
            <li>Review and compare selling costs from different agents</li>
          </ol>
        )}
      </div>
    </div>
  );
}