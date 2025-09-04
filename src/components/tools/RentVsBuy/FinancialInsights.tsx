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
        title: '⚠️ House Poor Risk',
        description: 'This home would consume too much of your income',
        advice: 'Consider a less expensive home or larger down payment',
        color: '#ff6b6b',
        bgColor: 'rgba(255, 107, 107, 0.1)'
      },
      'stretched': {
        title: '😰 Financially Stretched',
        description: 'You can afford it, but it will be tight',
        advice: 'Build an emergency fund before buying',
        color: '#ffa726',
        bgColor: 'rgba(255, 167, 38, 0.1)'
      },
      'comfortable': {
        title: '👍 Comfortable Range',
        description: 'This fits well within your budget',
        advice: 'You have room for maintenance and emergencies',
        color: '#66bb6a',
        bgColor: 'rgba(102, 187, 106, 0.1)'
      },
      'golden-zone': {
        title: '🌟 Golden Zone',
        description: 'Excellent balance of home and financial flexibility',
        advice: 'This leaves plenty of room for savings and lifestyle',
        color: '#42a5f5',
        bgColor: 'rgba(66, 165, 245, 0.1)'
      },
      'great-deal': {
        title: '🎯 Outstanding Deal',
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
      {/* Interest Analysis Card */}
      <div className="insight-card interest-analysis">
        <div className="insight-header">
          <h3>💰 Interest Analysis</h3>
          <span className="rate-badge">{formatPercent(interestRate)} effective rate</span>
        </div>
        
        <div className="interest-breakdown">
          <div className="interest-item">
            <span className="interest-label">Total Interest Paid</span>
            <span className="interest-value negative">{formatCurrency(results.totalInterestPaid)}</span>
          </div>
          <div className="interest-item">
            <span className="interest-label">Principal Paid</span>
            <span className="interest-value positive">{formatCurrency(principalPaid)}</span>
          </div>
          <div className="interest-item">
            <span className="interest-label">Tax Savings on Interest</span>
            <span className="interest-value positive">{formatCurrency(results.totalTaxBenefit)}</span>
          </div>
        </div>

        <div className="interest-chart">
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

        <div className="interest-insight">
          <p>
            Over {Math.floor(results.monthlyData.length / 12)} years, you'll pay {formatCurrency(results.totalInterestPaid)} in interest. 
            After tax deductions, your effective rate is {formatPercent(interestRate)} instead of the nominal rate.
          </p>
        </div>
      </div>

      {/* Financial Health Recommendation */}
      <div 
        className="insight-card health-recommendation"
        style={{ 
          borderColor: healthRec.color,
          backgroundColor: healthRec.bgColor
        }}
      >
        <div className="health-header">
          <h3 style={{ color: healthRec.color }}>{healthRec.title}</h3>
          <div className="payment-ratio">
            <span className="ratio-label">Payment Ratio</span>
            <span className="ratio-value" style={{ color: healthRec.color }}>
              {formatPercent(results.monthlyPaymentRatio)}
            </span>
          </div>
        </div>

        <p className="health-description">{healthRec.description}</p>
        
        <div className="health-details">
          <div className="health-metric">
            <span className="metric-icon">🏠</span>
            <div className="metric-info">
              <span className="metric-label">Monthly Payment</span>
              <span className="metric-value">{formatCurrency(monthlyPayment)}</span>
            </div>
          </div>
          
          <div className="health-metric">
            <span className="metric-icon">💵</span>
            <div className="metric-info">
              <span className="metric-label">Typical Income Needed</span>
              <span className="metric-value">{formatCurrency(monthlyPayment * 3.5)}/mo</span>
            </div>
          </div>
        </div>

        <div className="health-advice" style={{ borderLeftColor: healthRec.color }}>
          <strong>Recommendation:</strong> {healthRec.advice}
        </div>
      </div>

      {/* Monthly Payment Breakdown */}
      <div className="insight-card payment-breakdown">
        <h3>📊 Where Your Payment Goes</h3>
        
        <div className="payment-components">
          {[
            { label: 'Principal & Interest', value: monthlyPayment, icon: '🏦' },
            { label: 'Property Tax', value: results.monthlyData[0].homeValue * 0.012 / 12, icon: '🏛️' },
            { label: 'Insurance', value: 150, icon: '🛡️' },
            { label: 'Maintenance', value: results.monthlyData[0].homeValue * 0.01 / 12, icon: '🔧' }
          ].map((component, index) => (
            <div key={index} className="payment-component">
              <span className="component-icon">{component.icon}</span>
              <span className="component-label">{component.label}</span>
              <span className="component-value">{formatCurrency(component.value)}</span>
            </div>
          ))}
        </div>

        <div className="total-payment">
          <span>Total Monthly Cost</span>
          <span className="total-value">{formatCurrency(results.monthlyData[0].buyingCost)}</span>
        </div>
      </div>

      {/* Smart Tips */}
      <div className="insight-card smart-tips">
        <h3>💡 Smart Money Tips</h3>
        <ul className="tips-list">
          {results.totalInterestPaid > loanAmount * 0.8 && (
            <li>
              <span className="tip-icon">📈</span>
              Consider making extra principal payments to save {formatCurrency(results.totalInterestPaid * 0.25)} in interest
            </li>
          )}
          {results.financialHealthScore === 'golden-zone' && (
            <li>
              <span className="tip-icon">🎯</span>
              You're in the sweet spot - consider investing the difference in index funds
            </li>
          )}
          {results.breakEvenMonth !== null && results.breakEvenMonth > 60 && (
            <li>
              <span className="tip-icon">⏰</span>
              It takes {Math.floor(results.breakEvenMonth / 12)} years to break even - ensure you'll stay that long
            </li>
          )}
          {monthlyPayment > 0 && (
            <li>
              <span className="tip-icon">💰</span>
              A 15-year mortgage would save you approximately {formatCurrency(results.totalInterestPaid * 0.4)} in interest
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}