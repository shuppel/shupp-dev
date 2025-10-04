import React from 'react';
import type { CalculationResult } from '../../../lib/calculators/rentVsBuy/types';
import './FinancialInsights.css';

interface FinancialInsightsProps {
  results: CalculationResult;
  monthlyPayment: number;
  loanAmount: number;
}

export default function FinancialInsights({ results, monthlyPayment, loanAmount }: FinancialInsightsProps): React.JSX.Element {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (rate: number): string => {
    return `${rate.toFixed(2)}%`;
  };

  // Financial health recommendations based on score
  const getHealthRecommendation = (): { title: string; description: string; advice: string; color: string; bgColor: string } => {
    const score = results.financialHealthScore;
    
    const recommendations = {
      'house-poor': {
         title: 'House Poor Risk',
        description: 'This home would consume too much of your income',
        advice: 'Consider a less expensive home or larger down payment',
        color: '#ff6b6b',
        bgColor: 'rgba(255, 107, 107, 0.1)'
      },
      'stretched': {
         title: 'Financially Stretched',
        description: 'You can afford it, but it will be tight',
        advice: 'Build an emergency fund before buying',
        color: '#ffa726',
        bgColor: 'rgba(255, 167, 38, 0.1)'
      },
      'comfortable': {
         title: 'Comfortable Range',
        description: 'This fits well within your budget',
        advice: 'You have room for maintenance and emergencies',
        color: '#66bb6a',
        bgColor: 'rgba(102, 187, 106, 0.1)'
      },
      'golden-zone': {
         title: 'Golden Zone',
        description: 'Excellent balance of home and financial flexibility',
        advice: 'This leaves plenty of room for savings and lifestyle',
        color: '#42a5f5',
        bgColor: 'rgba(66, 165, 245, 0.1)'
      },
      'great-deal': {
         title: 'Outstanding Deal',
        description: 'This home is well below your means',
        advice: 'Consider if this meets your long-term needs',
        color: '#ab47bc',
        bgColor: 'rgba(171, 71, 188, 0.1)'
      }
    };

    return recommendations[score] || recommendations['comfortable'];
  };

  const healthRec = getHealthRecommendation();
  const principalPaid = loanAmount - results.monthlyData[results.monthlyData.length - 1].mortgageBalance;
  const interestRate = results.effectiveRate;

  return (
    <div className="financial-insights">
      {/* Interest Analysis Hero Section */}
      <div className="insight-hero interest-analysis" onClick={() => console.log('Interest analysis clicked')}>
        <div className="hero-content">
          <div className="hero-header">
            <h2>Interest Analysis</h2>
            <div className="hero-badge">
              <span className="rate-badge">{formatPercent(interestRate)} effective rate</span>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat-item negative">
              <span className="stat-label">Total Interest Paid</span>
              <span className="stat-value">{formatCurrency(results.totalInterestPaid)}</span>
            </div>
            <div className="stat-item positive">
              <span className="stat-label">Principal Paid</span>
              <span className="stat-value">{formatCurrency(principalPaid)}</span>
            </div>
            <div className="stat-item positive">
              <span className="stat-label">Tax Savings</span>
              <span className="stat-value">{formatCurrency(results.totalTaxBenefit)}</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="interest-bar">
              <div
                className="principal-portion"
                style={{ width: `${(principalPaid / (principalPaid + results.totalInterestPaid)) * 100}%` }}
              >
                <span className="bar-label">Principal</span>
              </div>
              <div
                className="interest-portion"
                style={{ width: `${(results.totalInterestPaid / (principalPaid + results.totalInterestPaid)) * 100}%` }}
              >
                <span className="bar-label">Interest</span>
              </div>
            </div>
          </div>

          <div className="hero-insight">
            <p>
              Over {Math.floor(results.monthlyData.length / 12)} years, you'll pay {formatCurrency(results.totalInterestPaid)} in interest.
              After tax deductions, your effective rate is {formatPercent(interestRate)} instead of the nominal rate.
            </p>
          </div>
        </div>
      </div>

      {/* Financial Health Recommendation Hero Section */}
      <div
        className="insight-hero health-recommendation"
        style={{
          borderColor: healthRec.color,
          backgroundColor: healthRec.bgColor
        }}
        onClick={() => console.log('Health recommendation clicked')}
      >
        <div className="hero-content">
          <div className="hero-header">
            <h2 style={{ color: healthRec.color }}>{healthRec.title}</h2>
            <div className="hero-ratio">
              <span className="ratio-label">Payment Ratio</span>
              <span className="ratio-value" style={{ color: healthRec.color }}>
                {formatPercent(results.monthlyPaymentRatio)}
              </span>
            </div>
          </div>

          <p className="hero-description">{healthRec.description}</p>

          <div className="hero-metrics">
            <div className="metric-item">
              <div className="metric-info">
                <span className="metric-label">Monthly Payment</span>
                <span className="metric-value">{formatCurrency(monthlyPayment)}</span>
              </div>
            </div>

            <div className="metric-item">
              <div className="metric-info">
                <span className="metric-label">Typical Income Needed</span>
                <span className="metric-value">{formatCurrency(monthlyPayment * 3.5)}/mo</span>
              </div>
            </div>
          </div>

          <div className="hero-advice" style={{ borderLeftColor: healthRec.color }}>
            <strong>Recommendation:</strong> {healthRec.advice}
          </div>
        </div>
      </div>

      {/* Monthly Payment Breakdown Hero Section */}
      <div className="insight-hero payment-breakdown" onClick={() => console.log('Payment breakdown clicked')}>
        <div className="hero-content">
          <div className="hero-header">
            <h2>Where Your Payment Goes</h2>
          </div>

          <div className="hero-components">
            {[
               { label: 'Principal & Interest', value: monthlyPayment, icon: 'Bank' },
               { label: 'Property Tax', value: results.monthlyData[0].homeValue * 0.012 / 12, icon: 'Building' },
               { label: 'Insurance', value: 150, icon: 'Shield' },
               { label: 'Maintenance', value: results.monthlyData[0].homeValue * 0.01 / 12, icon: 'Wrench' }
            ].map((component, index) => (
              <div key={index} className="component-item">
                <span className="component-icon">{component.icon}</span>
                <div className="component-info">
                  <span className="component-label">{component.label}</span>
                  <span className="component-value">{formatCurrency(component.value)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="hero-total">
            <span className="total-label">Total Monthly Cost</span>
            <span className="total-value">{formatCurrency(results.monthlyData[0].buyingCost)}</span>
          </div>
        </div>
      </div>

      {/* Smart Tips Hero Section */}
      <div className="insight-hero smart-tips" onClick={() => console.log('Smart tips clicked')}>
        <div className="hero-content">
          <div className="hero-header">
            <h2>Smart Money Tips</h2>
          </div>

          <div className="hero-tips">
            {results.totalInterestPaid > loanAmount * 0.8 && (
              <div className="tip-item">
                 <span className="tip-icon">Trend</span>
                <p>Consider making extra principal payments to save {formatCurrency(results.totalInterestPaid * 0.25)} in interest</p>
              </div>
            )}
            {results.financialHealthScore === 'golden-zone' && (
              <div className="tip-item">
                 <span className="tip-icon">Target</span>
                <p>You're in the sweet spot - consider investing the difference in index funds</p>
              </div>
            )}
            {results.breakEvenMonth !== null && results.breakEvenMonth > 60 && (
              <div className="tip-item">
                 <span className="tip-icon">Clock</span>
                <p>It takes {Math.floor(results.breakEvenMonth / 12)} years to break even - ensure you'll stay that long</p>
              </div>
            )}
            {monthlyPayment > 0 && (
              <div className="tip-item">
                 <span className="tip-icon">Money</span>
                <p>A 15-year mortgage would save you approximately {formatCurrency(results.totalInterestPaid * 0.4)} in interest</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}