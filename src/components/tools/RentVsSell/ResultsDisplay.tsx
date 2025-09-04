import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { RentVsSellResult } from '../../../lib/calculators/rentVsSell/types';
import './ResultsDisplay.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ResultsDisplayProps {
  results: RentVsSellResult;
}

export default function ResultsDisplay({ results }: ResultsDisplayProps) {
  const [activeView, setActiveView] = useState<'summary' | 'details' | 'chart'>('summary');
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const recommendation = results.financialAdvantage > 0 ? 'rent' : 'sell';
  const advantageAmount = Math.abs(results.financialAdvantage);

  // Prepare chart data
  const chartLabels = results.yearlyData.map(year => `Year ${year.year}`);
  const rentingWealth = results.yearlyData.map(year => year.totalWealthRenting);
  const sellingWealth = results.yearlyData.map(year => year.totalWealthSelling);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Keep & Rent',
        data: rentingWealth,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Sell Now',
        data: sellingWealth,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Net Worth Comparison Over Time',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  return (
    <div className="rvs-results">
      <div className="results-tabs">
        <button
          className={`results-tab ${activeView === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveView('summary')}
        >
          Summary
        </button>
        <button
          className={`results-tab ${activeView === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveView('chart')}
        >
          Chart
        </button>
        <button
          className={`results-tab ${activeView === 'details' ? 'active' : ''}`}
          onClick={() => setActiveView('details')}
        >
          Details
        </button>
      </div>

      {activeView === 'summary' && (
        <div className="summary-view">
          <div className={`recommendation-card ${recommendation}`}>
            <h3>Recommendation: {recommendation === 'rent' ? 'Keep & Rent' : 'Sell Now'}</h3>
            <div className="advantage-amount">
              {formatCurrency(advantageAmount)}
            </div>
            <p className="advantage-text">
              {recommendation === 'rent' 
                ? 'Additional wealth by keeping and renting'
                : 'Additional wealth by selling now'}
            </p>
            <div className="advantage-percent">
              {formatPercent(results.advantagePercentage)} better
            </div>
          </div>

          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Selling Option</h4>
              <div className="metric-value">{formatCurrency(results.netProceedsFromSale)}</div>
              <div className="metric-label">Net Proceeds</div>
              <div className="metric-detail">
                After {formatCurrency(results.sellingCosts)} in selling costs
                and {formatCurrency(results.capitalGainsTax + results.depreciationRecapture)} in taxes
              </div>
              <div className="metric-future">
                <div className="future-value">{formatCurrency(results.projectedInvestmentValue)}</div>
                <div className="future-label">Investment value in {results.yearlyData.length} years</div>
              </div>
            </div>

            <div className="metric-card">
              <h4>Rental Option</h4>
              <div className="metric-value">{formatCurrency(results.totalCashFlow)}</div>
              <div className="metric-label">Total Cash Flow</div>
              <div className="metric-detail">
                {formatCurrency(results.averageAnnualCashFlow)}/year average
              </div>
              <div className="metric-future">
                <div className="future-value">{formatCurrency(results.rentingNetWorth)}</div>
                <div className="future-label">Total wealth in {results.yearlyData.length} years</div>
              </div>
            </div>
          </div>

          <div className="key-metrics">
            <h4>Key Financial Metrics</h4>
            <div className="metrics-list">
              <div className="metric-item">
                <span className="metric-name">Cash-on-Cash Return:</span>
                <span className="metric-value">{results.cashOnCashReturn.toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Cap Rate:</span>
                <span className="metric-value">{results.capRate.toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Total Return (with appreciation):</span>
                <span className="metric-value">{results.totalReturnRate.toFixed(1)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Positive Cash Flow Months:</span>
                <span className="metric-value">{results.probabilityOfPositiveCashFlow.toFixed(0)}%</span>
              </div>
              {results.breakEvenMonth && (
                <div className="metric-item highlight">
                  <span className="metric-name">Break-even Point:</span>
                  <span className="metric-value">
                    {Math.floor(results.breakEvenMonth / 12)} years {results.breakEvenMonth % 12} months
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeView === 'chart' && (
        <div className="chart-view">
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
          
          <div className="chart-insights">
            <h4>Chart Insights</h4>
            <ul>
              {results.breakEvenMonth && (
                <li>
                  The lines cross at {Math.floor(results.breakEvenMonth / 12)} years, 
                  where renting becomes more profitable than selling
                </li>
              )}
              <li>
                Property appreciation and rental income compound over time, 
                creating {formatPercent((results.propertyValueAtEnd / results.grossSaleProceeds - 1) * 100)} growth
              </li>
              <li>
                Tax benefits from depreciation save {formatCurrency(results.totalTaxBenefit)} over the analysis period
              </li>
            </ul>
          </div>
        </div>
      )}

      {activeView === 'details' && (
        <div className="details-view">
          <div className="details-section">
            <h4>Selling Analysis</h4>
            <table className="details-table">
              <tbody>
                <tr>
                  <td>Sale Price</td>
                  <td>{formatCurrency(results.grossSaleProceeds)}</td>
                </tr>
                <tr>
                  <td>Mortgage Payoff</td>
                  <td>-{formatCurrency(results.mortgagePayoff)}</td>
                </tr>
                <tr>
                  <td>Selling Costs</td>
                  <td>-{formatCurrency(results.sellingCosts)}</td>
                </tr>
                <tr>
                  <td>Capital Gains Tax</td>
                  <td>-{formatCurrency(results.capitalGainsTax)}</td>
                </tr>
                <tr>
                  <td>Depreciation Recapture</td>
                  <td>-{formatCurrency(results.depreciationRecapture)}</td>
                </tr>
                <tr className="total-row">
                  <td>Net Proceeds</td>
                  <td>{formatCurrency(results.netProceedsFromSale)}</td>
                </tr>
                <tr>
                  <td>Investment Growth</td>
                  <td>+{formatCurrency(results.projectedInvestmentValue - results.netProceedsFromSale)}</td>
                </tr>
                <tr className="total-row">
                  <td>Final Wealth (Selling)</td>
                  <td>{formatCurrency(results.sellingNetWorth)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="details-section">
            <h4>Rental Analysis</h4>
            <table className="details-table">
              <tbody>
                <tr>
                  <td>Total Rental Income</td>
                  <td>{formatCurrency(results.totalGrossRentalIncome)}</td>
                </tr>
                <tr>
                  <td>Vacancy Loss</td>
                  <td>-{formatCurrency(results.totalVacancyLoss)}</td>
                </tr>
                <tr>
                  <td>Operating Expenses</td>
                  <td>-{formatCurrency(results.totalOperatingExpenses)}</td>
                </tr>
                <tr>
                  <td>Mortgage Payments</td>
                  <td>-{formatCurrency(results.totalMortgagePayments)}</td>
                </tr>
                <tr>
                  <td>Tax Benefits</td>
                  <td>+{formatCurrency(results.totalTaxBenefit)}</td>
                </tr>
                <tr className="total-row">
                  <td>Net Cash Flow</td>
                  <td>{formatCurrency(results.totalCashFlow)}</td>
                </tr>
                <tr>
                  <td>Property Value</td>
                  <td>{formatCurrency(results.propertyValueAtEnd)}</td>
                </tr>
                <tr>
                  <td>Remaining Mortgage</td>
                  <td>-{formatCurrency(results.remainingMortgageAtEnd)}</td>
                </tr>
                <tr className="total-row">
                  <td>Final Wealth (Renting)</td>
                  <td>{formatCurrency(results.rentingNetWorth)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="details-section">
            <h4>Tax Benefits Breakdown</h4>
            <table className="details-table">
              <tbody>
                <tr>
                  <td>Depreciation Deductions</td>
                  <td>{formatCurrency(results.totalDepreciationDeduction)}</td>
                </tr>
                <tr>
                  <td>Interest Deductions</td>
                  <td>{formatCurrency(results.totalInterestDeduction)}</td>
                </tr>
                <tr>
                  <td>Property Tax Deductions</td>
                  <td>{formatCurrency(results.totalPropertyTaxDeduction)}</td>
                </tr>
                <tr className="total-row">
                  <td>Total Tax Savings</td>
                  <td>{formatCurrency(results.totalTaxBenefit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}