import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RentVsBuySchema, defaultParams } from '../../../lib/calculators/rentVsBuy/validation';
import type { RentVsBuyParams } from '../../../lib/calculators/rentVsBuy/types';
import type { OnboardingData } from './OnboardingFlow';
import LiquidSlider from '../shared/LiquidSlider';

interface InputFormProps {
  onSubmit: (data: RentVsBuyParams) => void;
  isCalculating?: boolean;
  onboardingData?: OnboardingData | null;
}

interface InputFieldProps {
  label: string;
  name: keyof RentVsBuyParams;
  register: any;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  tooltip?: string;
  type?: 'number' | 'select';
  options?: Array<{value: number, label: string}>;
}

const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  register,
  error,
  min = 0,
  max,
  step = 1,
  prefix,
  suffix,
  tooltip,
  type = 'number',
  options
}) => (
  <div className={`input-field ${error ? 'has-error' : ''}`}>
    <label htmlFor={name}>
      {label}
      {tooltip && <span className="tooltip" title={tooltip}>?</span>}
    </label>
    <div className="input-wrapper">
      {prefix && <span className="prefix">{prefix}</span>}
      {type === 'select' ? (
        <select
          id={name}
          {...register(name, { valueAsNumber: true })}
        >
          {options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={name}
          type="number"
          {...register(name, { valueAsNumber: true })}
          min={min}
          max={max}
          step={step}
        />
      )}
      {suffix && <span className="suffix">{suffix}</span>}
    </div>
    {error && <span className="error-message">{error}</span>}
  </div>
);

export default function InputForm({ onSubmit, isCalculating = false, onboardingData }: InputFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RentVsBuyParams>({
    resolver: zodResolver(RentVsBuySchema),
    defaultValues: defaultParams,
  });

  // Auto-populate economic assumptions based on onboarding data
  React.useEffect(() => {
    if (onboardingData) {
      // Map market outlook to home appreciation rate
      if (onboardingData.marketOutlook) {
        const appreciationRates = {
          'hot': 6,        // 6% for hot market
          'stable': 3.5,   // 3.5% for stable market  
          'cooling': 2,    // 2% for cooling market
          'uncertain': 3   // 3% for uncertain
        };
        setValue('homeAppreciationRate', appreciationRates[onboardingData.marketOutlook] || 3.5);
      }

      // Map investment confidence to expected returns
      if (onboardingData.investmentConfidence) {
        const returnRates = {
          'conservative': 4.5,  // 4.5% for conservative
          'moderate': 7,        // 7% for moderate
          'aggressive': 9.5     // 9.5% for aggressive
        };
        setValue('investmentReturnRate', returnRates[onboardingData.investmentConfidence] || 7);
      }

      // Set rent inflation based on market conditions
      if (onboardingData.marketOutlook) {
        const rentInflationRates = {
          'hot': 4.5,      // Higher rent inflation in hot markets
          'stable': 3,     // Normal inflation
          'cooling': 2,    // Lower inflation in cooling markets
          'uncertain': 3.5 // Slightly higher due to uncertainty
        };
        setValue('rentInflationRate', rentInflationRates[onboardingData.marketOutlook] || 3);
      }
    }
  }, [onboardingData, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="input-form">
      <div className="form-section">
        <h3>Basic Information</h3>
        
        <InputField
          label="Monthly Rent"
          name="monthlyRent"
          register={register}
          error={errors.monthlyRent?.message}
          prefix="$"
          min={100}
          max={50000}
          step={50}
        />
        
        <InputField
          label="Home Price"
          name="homePrice"
          register={register}
          error={errors.homePrice?.message}
          prefix="$"
          min={50000}
          max={10000000}
          step={5000}
        />
        
        <InputField
          label="Down Payment"
          name="downPaymentPercent"
          register={register}
          error={errors.downPaymentPercent?.message}
          suffix="%"
          min={0}
          max={100}
          step={1}
        />
        
        <InputField
          label="Mortgage Rate"
          name="mortgageRate"
          register={register}
          error={errors.mortgageRate?.message}
          suffix="%"
          min={0}
          max={15}
          step={0.1}
        />
        
        <InputField
          label="Mortgage Term"
          name="mortgageTerm"
          register={register}
          error={errors.mortgageTerm?.message}
          type="select"
          options={[
            { value: 15, label: '15 years' },
            { value: 30, label: '30 years' }
          ]}
        />
        
        <LiquidSlider
          label="Years to Stay"
          name="plannedYears"
          value={watch('plannedYears') || 5}
          onChange={(value) => setValue('plannedYears', value)}
          error={errors.plannedYears?.message}
          suffix="years"
          min={1}
          max={30}
          step={1}
          tooltip="How long do you plan to live in the home?"
        />
      </div>

      <div className="form-section">
        <h3>Tax Information</h3>
        
        <InputField
          label="Marginal Tax Rate"
          name="marginalTaxRate"
          register={register}
          error={errors.marginalTaxRate?.message}
          suffix="%"
          min={0}
          max={50}
          step={1}
          tooltip="Your combined federal and state tax rate"
        />
        
        <InputField
          label="Property Tax Rate"
          name="propertyTaxRate"
          register={register}
          error={errors.propertyTaxRate?.message}
          suffix="%"
          min={0}
          max={5}
          step={0.1}
          tooltip="Annual property tax as % of home value"
        />
        
        <InputField
          label="Standard Deduction"
          name="standardDeduction"
          register={register}
          error={errors.standardDeduction?.message}
          prefix="$"
          min={0}
          max={50000}
          step={100}
          tooltip="2024: $14,600 single, $29,200 married"
        />
      </div>

      <div className="form-section">
        <h3>Ownership Costs</h3>
        
        <InputField
          label="Maintenance Rate"
          name="maintenanceRate"
          register={register}
          error={errors.maintenanceRate?.message}
          suffix="% /year"
          min={0}
          max={5}
          step={0.1}
          tooltip="Annual maintenance as % of home value"
        />
        
        <InputField
          label="Homeowners Insurance"
          name="homeownersInsurance"
          register={register}
          error={errors.homeownersInsurance?.message}
          prefix="$"
          suffix="/month"
          min={0}
          max={5000}
          step={10}
        />
        
        <InputField
          label="HOA Fees"
          name="hoaFees"
          register={register}
          error={errors.hoaFees?.message}
          prefix="$"
          suffix="/month"
          min={0}
          max={2000}
          step={10}
        />
        
        <InputField
          label="Closing Costs"
          name="closingCostPercent"
          register={register}
          error={errors.closingCostPercent?.message}
          suffix="%"
          min={0}
          max={10}
          step={0.5}
          tooltip="One-time cost as % of home price"
        />
        
        <InputField
          label="Selling Costs"
          name="sellingCostPercent"
          register={register}
          error={errors.sellingCostPercent?.message}
          suffix="%"
          min={0}
          max={10}
          step={0.5}
          tooltip="Realtor fees and other selling costs"
        />
      </div>

      <div className="form-section">
        <h3>Rental Costs</h3>
        
        <InputField
          label="Renters Insurance"
          name="rentersInsurance"
          register={register}
          error={errors.rentersInsurance?.message}
          prefix="$"
          suffix="/month"
          min={0}
          max={200}
          step={5}
        />
        
        <InputField
          label="Security Deposit"
          name="securityDepositMonths"
          register={register}
          error={errors.securityDepositMonths?.message}
          suffix="months"
          min={0}
          max={3}
          step={0.5}
        />
      </div>

      {!onboardingData && (
        <div className="form-section">
          <h3>Economic Assumptions</h3>
          
          <InputField
            label="Home Appreciation"
            name="homeAppreciationRate"
            register={register}
            error={errors.homeAppreciationRate?.message}
            suffix="% /year"
            min={-10}
            max={20}
            step={0.5}
          />
          
          <InputField
            label="Rent Inflation"
            name="rentInflationRate"
            register={register}
            error={errors.rentInflationRate?.message}
            suffix="% /year"
            min={-5}
            max={15}
            step={0.5}
          />
          
          <InputField
            label="Investment Return"
            name="investmentReturnRate"
            register={register}
            error={errors.investmentReturnRate?.message}
            suffix="% /year"
            min={-10}
            max={30}
            step={0.5}
            tooltip="Expected return if you invested instead"
          />
        </div>
      )}
      
      {onboardingData && (
        <div className="form-section economic-summary">
          <h3>Economic Assumptions</h3>
          <p className="summary-note">Based on your profile:</p>
          <div className="assumption-display">
            <div className="assumption-item">
              <span className="label">Market Outlook:</span>
              <span className="value">{onboardingData.marketOutlook}</span>
            </div>
            <div className="assumption-item">
              <span className="label">Investment Style:</span>
              <span className="value">{onboardingData.investmentConfidence}</span>
            </div>
            <div className="assumption-item">
              <span className="label">Auto-calculated rates applied</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="form-actions">
        <button 
          type="submit" 
          className="calculate-button"
          disabled={isCalculating}
          aria-describedby={isCalculating ? 'calculation-status' : undefined}
        >
          <span role="img" aria-hidden="true">
            {isCalculating ? '⏳' : '🧮'}
          </span>
          {isCalculating ? 'Calculating Your Results...' : 'Calculate Rent vs Buy'}
        </button>
        {isCalculating && (
          <div id="calculation-status" className="calculation-status" role="status" aria-live="polite">
            Analyzing your financial scenario...
          </div>
        )}
      </div>
    </form>
  );
}