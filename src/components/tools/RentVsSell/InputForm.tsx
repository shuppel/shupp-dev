import React, { useState, useEffect } from 'react';
import type { RentVsSellParams, RentVsSellOnboardingData } from '../../../lib/calculators/rentVsSell/types';
import { validateRentVsSellParams, getDefaultParams } from '../../../lib/calculators/rentVsSell/validation';
import TaxCalculator from '../shared/TaxCalculator';
import LiquidSlider from '../shared/LiquidSlider';

interface InputFormProps {
  onSubmit: (data: RentVsSellParams) => void;
  isCalculating: boolean;
  onboardingData: RentVsSellOnboardingData | null;
}

export default function InputForm({ onSubmit, isCalculating, onboardingData }: InputFormProps) {
  const defaults = getDefaultParams();
  const [formData, setFormData] = useState<Partial<RentVsSellParams>>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<string>('property');

  // Apply onboarding data to form
  useEffect(() => {
    if (onboardingData) {
      setFormData(prev => ({
        ...prev,
        landlordExperience: onboardingData.landlordExperience,
        riskTolerance: onboardingData.riskTolerance,
        primaryGoal: onboardingData.primaryGoal,
        propertyCondition: onboardingData.propertyCondition,
        yearsOwned: onboardingData.yearsOwned,
        originalPurchasePrice: onboardingData.originalPurchasePrice || prev.originalPurchasePrice,
        hasBeenRented: onboardingData.hasBeenRented,
        expectedMonthlyRent: onboardingData.currentMonthlyRent || prev.expectedMonthlyRent,
        purchaseDate: new Date(Date.now() - onboardingData.yearsOwned * 365 * 24 * 60 * 60 * 1000),
      }));
    }
  }, [onboardingData]);

  const handleInputChange = (field: keyof RentVsSellParams, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateRentVsSellParams(formData);
    if (validationErrors.length > 0) {
      const errorMap = validationErrors.reduce((acc, err) => ({
        ...acc,
        [err.field]: err.message
      }), {});
      setErrors(errorMap);
      // Focus on first section with error
      const firstErrorField = validationErrors[0].field;
      if (firstErrorField.startsWith('property') || firstErrorField.startsWith('remaining')) {
        setActiveSection('property');
      } else if (firstErrorField.startsWith('expected') || firstErrorField.startsWith('vacancy')) {
        setActiveSection('rental');
      }
      return;
    }

    onSubmit(formData as RentVsSellParams);
  };

  const sections = [
    { id: 'property', label: 'Property Details', icon: '🏠' },
    { id: 'rental', label: 'Rental Income', icon: '💰' },
    { id: 'expenses', label: 'Expenses', icon: '📋' },
    { id: 'taxes', label: 'Tax Info', icon: '📊' },
    { id: 'market', label: 'Market Assumptions', icon: '📈' },
  ];

  return (
    <form onSubmit={handleSubmit} className="rvs-input-form">
      <div className="form-tabs">
        {sections.map(section => (
          <button
            key={section.id}
            type="button"
            className={`form-tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            <span className="tab-icon">{section.icon}</span>
            <span className="tab-label">{section.label}</span>
          </button>
        ))}
      </div>

      <div className="form-content">
        {activeSection === 'property' && (
          <div className="form-section">
            <h3>Property Details</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="propertyValue">
                  Current Property Value
                  <span className="tooltip" title="Current market value of your property">?</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="propertyValue"
                    value={formData.propertyValue || ''}
                    onChange={(e) => handleInputChange('propertyValue', Number(e.target.value))}
                    className={errors.propertyValue ? 'error' : ''}
                  />
                </div>
                {errors.propertyValue && <span className="error-message">{errors.propertyValue}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="originalPurchasePrice">
                  Original Purchase Price
                  <span className="tooltip" title="What you paid for the property">?</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="originalPurchasePrice"
                    value={formData.originalPurchasePrice || ''}
                    onChange={(e) => handleInputChange('originalPurchasePrice', Number(e.target.value))}
                    className={errors.originalPurchasePrice ? 'error' : ''}
                  />
                </div>
                {errors.originalPurchasePrice && <span className="error-message">{errors.originalPurchasePrice}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="remainingMortgageBalance">
                  Remaining Mortgage Balance
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="remainingMortgageBalance"
                    value={formData.remainingMortgageBalance || ''}
                    onChange={(e) => handleInputChange('remainingMortgageBalance', Number(e.target.value))}
                    className={errors.remainingMortgageBalance ? 'error' : ''}
                  />
                </div>
                {errors.remainingMortgageBalance && <span className="error-message">{errors.remainingMortgageBalance}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="monthlyMortgagePayment">
                  Monthly Mortgage Payment
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="monthlyMortgagePayment"
                    value={formData.monthlyMortgagePayment || ''}
                    onChange={(e) => handleInputChange('monthlyMortgagePayment', Number(e.target.value))}
                    className={errors.monthlyMortgagePayment ? 'error' : ''}
                  />
                </div>
                {errors.monthlyMortgagePayment && <span className="error-message">{errors.monthlyMortgagePayment}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mortgageInterestRate">
                  Mortgage Interest Rate
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="mortgageInterestRate"
                    value={formData.mortgageInterestRate || ''}
                    onChange={(e) => handleInputChange('mortgageInterestRate', Number(e.target.value))}
                    step="0.1"
                    className={errors.mortgageInterestRate ? 'error' : ''}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>

              <div className="form-group">
                <LiquidSlider
                  id="yearsRemainingOnMortgage"
                  name="yearsRemainingOnMortgage"
                  label="Years Remaining on Mortgage"
                  value={formData.yearsRemainingOnMortgage || 15}
                  onChange={(value) => handleInputChange('yearsRemainingOnMortgage', value)}
                  error={errors.yearsRemainingOnMortgage}
                  suffix="years"
                  min={0}
                  max={30}
                  step={1}
                  tooltip="How many years are left on your current mortgage?"
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'rental' && (
          <div className="form-section">
            <h3>Rental Income Projections</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expectedMonthlyRent">
                  Expected Monthly Rent
                  <span className="tooltip" title="Research comparable rentals in your area">?</span>
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="expectedMonthlyRent"
                    value={formData.expectedMonthlyRent || ''}
                    onChange={(e) => handleInputChange('expectedMonthlyRent', Number(e.target.value))}
                    className={errors.expectedMonthlyRent ? 'error' : ''}
                  />
                </div>
                {errors.expectedMonthlyRent && <span className="error-message">{errors.expectedMonthlyRent}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="vacancyRate">
                  Vacancy Rate
                  <span className="tooltip" title="Typical vacancy is 5-10% annually">?</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="vacancyRate"
                    value={formData.vacancyRate || ''}
                    onChange={(e) => handleInputChange('vacancyRate', Number(e.target.value))}
                    step="0.5"
                    className={errors.vacancyRate ? 'error' : ''}
                  />
                  <span className="input-suffix">%</span>
                </div>
                {errors.vacancyRate && <span className="error-message">{errors.vacancyRate}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="annualRentIncreaseRate">
                  Annual Rent Increase
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="annualRentIncreaseRate"
                    value={formData.annualRentIncreaseRate || ''}
                    onChange={(e) => handleInputChange('annualRentIncreaseRate', Number(e.target.value))}
                    step="0.5"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="propertyManagementPercent">
                  Property Management Fee
                  <span className="tooltip" title="0% if self-managing, typically 8-10% if hiring">?</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="propertyManagementPercent"
                    value={formData.propertyManagementPercent || ''}
                    onChange={(e) => handleInputChange('propertyManagementPercent', Number(e.target.value))}
                    step="0.5"
                    className={errors.propertyManagementPercent ? 'error' : ''}
                  />
                  <span className="input-suffix">%</span>
                </div>
                {errors.propertyManagementPercent && <span className="error-message">{errors.propertyManagementPercent}</span>}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'expenses' && (
          <div className="form-section">
            <h3>Property Expenses</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="propertyTaxAnnual">
                  Annual Property Tax
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="propertyTaxAnnual"
                    value={formData.propertyTaxAnnual || ''}
                    onChange={(e) => handleInputChange('propertyTaxAnnual', Number(e.target.value))}
                    className={errors.propertyTaxAnnual ? 'error' : ''}
                  />
                </div>
                {errors.propertyTaxAnnual && <span className="error-message">{errors.propertyTaxAnnual}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="homeownersInsuranceAnnual">
                  Annual Insurance
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="homeownersInsuranceAnnual"
                    value={formData.homeownersInsuranceAnnual || ''}
                    onChange={(e) => handleInputChange('homeownersInsuranceAnnual', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hoaFeesMonthly">
                  Monthly HOA Fees
                </label>
                <div className="input-wrapper">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    id="hoaFeesMonthly"
                    value={formData.hoaFeesMonthly || ''}
                    onChange={(e) => handleInputChange('hoaFeesMonthly', Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="annualMaintenancePercent">
                  Annual Maintenance
                  <span className="tooltip" title="Typically 1% of property value annually">?</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="annualMaintenancePercent"
                    value={formData.annualMaintenancePercent || ''}
                    onChange={(e) => handleInputChange('annualMaintenancePercent', Number(e.target.value))}
                    step="0.25"
                    className={errors.annualMaintenancePercent ? 'error' : ''}
                  />
                  <span className="input-suffix">%</span>
                </div>
                {errors.annualMaintenancePercent && <span className="error-message">{errors.annualMaintenancePercent}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sellingCostPercent">
                  Selling Costs
                  <span className="tooltip" title="Agent fees, closing costs, repairs (typically 6-10%)">?</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="sellingCostPercent"
                    value={formData.sellingCostPercent || ''}
                    onChange={(e) => handleInputChange('sellingCostPercent', Number(e.target.value))}
                    step="0.5"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'taxes' && (
          <div className="form-section">
            <h3>Tax Information</h3>
            
            <TaxCalculator
              onTaxRatesCalculated={(rates) => {
                handleInputChange('marginalTaxRate', rates.federalTaxRate);
                handleInputChange('stateIncomeTaxRate', rates.stateTaxRate);
                handleInputChange('capitalGainsRate', rates.capitalGainsRate);
              }}
              initialIncome={100000}
              initialState="CA"
              initialFilingStatus="single"
            />
            
            <div className="form-row" style={{ marginTop: '2rem' }}>
              <div className="form-group">
                <label htmlFor="isInvestmentProperty">
                  Property Type
                  <span className="tooltip" title="Affects capital gains exemption">?</span>
                </label>
                <select
                  id="isInvestmentProperty"
                  value={formData.isInvestmentProperty ? 'investment' : 'primary'}
                  onChange={(e) => handleInputChange('isInvestmentProperty', e.target.value === 'investment')}
                >
                  <option value="primary">Primary Residence</option>
                  <option value="investment">Investment Property</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="depreciationRecaptureRate">
                  Depreciation Recapture Rate
                  <span className="tooltip" title="Fixed at 25% for real estate">?</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="depreciationRecaptureRate"
                    value={formData.depreciationRecaptureRate || 25}
                    onChange={(e) => handleInputChange('depreciationRecaptureRate', Number(e.target.value))}
                    readOnly
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'market' && (
          <div className="form-section">
            <h3>Market Assumptions</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="propertyAppreciationRate">
                  Property Appreciation
                  <span className="tooltip" title="Historical average is 3-4% annually">?</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="propertyAppreciationRate"
                    value={formData.propertyAppreciationRate || ''}
                    onChange={(e) => handleInputChange('propertyAppreciationRate', Number(e.target.value))}
                    step="0.5"
                    className={errors.propertyAppreciationRate ? 'error' : ''}
                  />
                  <span className="input-suffix">%</span>
                </div>
                {errors.propertyAppreciationRate && <span className="error-message">{errors.propertyAppreciationRate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="investmentReturnRate">
                  Investment Return
                  <span className="tooltip" title="Expected return if you invest the sale proceeds">?</span>
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="investmentReturnRate"
                    value={formData.investmentReturnRate || ''}
                    onChange={(e) => handleInputChange('investmentReturnRate', Number(e.target.value))}
                    step="0.5"
                    className={errors.investmentReturnRate ? 'error' : ''}
                  />
                  <span className="input-suffix">%</span>
                </div>
                {errors.investmentReturnRate && <span className="error-message">{errors.investmentReturnRate}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="inflationRate">
                  Inflation Rate
                </label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    id="inflationRate"
                    value={formData.inflationRate || ''}
                    onChange={(e) => handleInputChange('inflationRate', Number(e.target.value))}
                    step="0.5"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>

              <div className="form-group">
                <LiquidSlider
                  id="yearsToAnalyze"
                  name="yearsToAnalyze"
                  label="Years to Analyze"
                  value={formData.yearsToAnalyze || 5}
                  onChange={(value) => handleInputChange('yearsToAnalyze', value)}
                  error={errors.yearsToAnalyze}
                  suffix="years"
                  min={1}
                  max={30}
                  step={1}
                  tooltip="How long to project into the future"
                />
                {errors.yearsToAnalyze && <span className="error-message">{errors.yearsToAnalyze}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="form-footer">
        <button 
          type="submit" 
          className="submit-button"
          disabled={isCalculating}
        >
          {isCalculating ? 'Calculating...' : 'Calculate Results'}
        </button>
      </div>
    </form>
  );
}