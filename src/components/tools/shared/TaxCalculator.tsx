import React, { useState, useEffect } from 'react';
import { 
  calculateFederalTaxRate, 
  getStateTaxRate, 
  calculateCapitalGainsRate,
  getAllStates,
  getTaxSummary,
  type FilingStatus
} from '../../../lib/calculators/taxUtility';

interface TaxCalculatorProps {
  onTaxRatesCalculated: (rates: {
    federalTaxRate: number;
    stateTaxRate: number;
    capitalGainsRate: number;
  }) => void;
  initialIncome?: number;
  initialState?: string;
  initialFilingStatus?: FilingStatus;
}

export default function TaxCalculator({ 
  onTaxRatesCalculated, 
  initialIncome = 100000,
  initialState = 'CA',
  initialFilingStatus = 'single'
}: TaxCalculatorProps) {
  const [income, setIncome] = useState(initialIncome);
  const [state, setState] = useState(initialState);
  const [filingStatus, setFilingStatus] = useState<FilingStatus>(initialFilingStatus);
  const [showDetails, setShowDetails] = useState(false);
  
  const states = getAllStates();
  
  useEffect(() => {
    const taxSummary = getTaxSummary(income, state, filingStatus);
    onTaxRatesCalculated({
      federalTaxRate: taxSummary.federalMarginalRate * 100,
      stateTaxRate: taxSummary.stateTaxRate * 100,
      capitalGainsRate: taxSummary.capitalGainsRate * 100
    });
  }, [income, state, filingStatus, onTaxRatesCalculated]);
  
  const taxSummary = getTaxSummary(income, state, filingStatus);
  
  return (
    <div className="tax-calculator">
      <div className="tax-calculator-header">
        <h3>Smart Tax Calculator</h3>
        <button 
          type="button"
          className="toggle-details"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>
      
      <div className="tax-inputs-grid">
        <div className="form-group">
          <label htmlFor="income">
            Annual Income
            <span className="tooltip" title="Your total annual income for tax calculation">?</span>
          </label>
          <div className="input-wrapper">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="income"
              value={income}
              onChange={(e) => setIncome(Number(e.target.value))}
              min="0"
              step="1000"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="filingStatus">
            Filing Status
            <span className="tooltip" title="Your tax filing status">?</span>
          </label>
          <select
            id="filingStatus"
            value={filingStatus}
            onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
          >
            <option value="single">Single</option>
            <option value="marriedFilingJointly">Married Filing Jointly</option>
            <option value="marriedFilingSeparately">Married Filing Separately</option>
            <option value="headOfHousehold">Head of Household</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="state">
            State
            <span className="tooltip" title="Your state of residence for tax purposes">?</span>
          </label>
          <select
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            {states.map(s => (
              <option key={s.value} value={s.value}>
                {s.label} - {(s.taxRate * 100).toFixed(1)}%
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="calculated-rates">
        <div className="rate-display">
          <span className="rate-label">Federal Tax Rate:</span>
          <span className="rate-value">{(taxSummary.federalMarginalRate * 100).toFixed(1)}%</span>
        </div>
        <div className="rate-display">
          <span className="rate-label">State Tax Rate:</span>
          <span className="rate-value">{(taxSummary.stateTaxRate * 100).toFixed(1)}%</span>
        </div>
        <div className="rate-display">
          <span className="rate-label">Capital Gains Rate:</span>
          <span className="rate-value">{(taxSummary.capitalGainsRate * 100).toFixed(1)}%</span>
        </div>
      </div>
      
      {showDetails && (
        <div className="tax-details">
          <h4>Tax Calculation Details</h4>
          <div className="detail-item">
            <span className="detail-label">Effective Federal Rate:</span>
            <span className="detail-value">{(taxSummary.federalEffectiveRate * 100).toFixed(2)}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Combined Rate:</span>
            <span className="detail-value">{(taxSummary.combinedRate * 100).toFixed(1)}%</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Depreciation Recapture:</span>
            <span className="detail-value">{(taxSummary.depreciationRecaptureRate * 100).toFixed(0)}%</span>
          </div>
          {taxSummary.stateInfo?.notes && (
            <div className="detail-note">
              <strong>Note:</strong> {taxSummary.stateInfo.notes}
            </div>
          )}
          {taxSummary.capitalGainsRate > 0.20 && (
            <div className="detail-note">
              <strong>NIIT Applied:</strong> Your income exceeds the threshold for Net Investment Income Tax (3.8%)
            </div>
          )}
        </div>
      )}
    </div>
  );
}