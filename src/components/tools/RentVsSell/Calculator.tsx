import React, { useState, useCallback } from 'react';
import { calculateRentVsSell } from '../../../lib/calculators/rentVsSell/calculator';
import type { RentVsSellParams, RentVsSellResult, RentVsSellOnboardingData } from '../../../lib/calculators/rentVsSell/types';
import { validateRentVsSellParamsWithWarnings } from '../../../lib/calculators/rentVsSell/validation';
import type { ValidationError } from '../../../lib/calculators/rentVsSell/validation';
import OnboardingFlowOld from './OnboardingFlowOld';
import InputForm from './InputForm';
import ResultsDisplay from './ResultsDisplay';
import FinancialInsights from './FinancialInsights';
import ValidationWarnings from '../shared/ValidationWarnings';
import './Calculator.css';

export default function Calculator(): React.JSX.Element {
  const [results, setResults] = useState<RentVsSellResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ValidationError[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [onboardingData, setOnboardingData] = useState<RentVsSellOnboardingData | null>(null);

  const handleFormSubmit = useCallback((data: RentVsSellParams) => {
    setIsCalculating(true);
    setError(null);
    setWarnings([]);
    
    try {
      // Ensure purchase date is properly set
      const calculationData = {
        ...data,
        purchaseDate: data.purchaseDate instanceof Date ? data.purchaseDate : new Date(data.purchaseDate),
      };
      
      // Get validation warnings (not blocking errors)
      const validationResult = validateRentVsSellParamsWithWarnings(calculationData);
      setWarnings(validationResult.warnings);
      
      // Perform calculation
      const calculationResults = calculateRentVsSell(calculationData);
      setResults(calculationResults);
    } catch (error) {
      console.error('Calculation error:', error);
      setError('An error occurred during calculation. Please check your inputs and try again.');
    } finally {
      setIsCalculating(false);
    }
  }, []);
  
  const handleOnboardingComplete = useCallback((data: RentVsSellOnboardingData) => {
    setOnboardingData(data);
    setShowOnboarding(false);
  }, []);
  
  const handleOnboardingSkip = useCallback(() => {
    setShowOnboarding(false);
  }, []);
  
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Show onboarding flow if not completed
  if (showOnboarding) {
    return (
      <OnboardingFlowOld 
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  return (
    <div className={`rvs-calculator ${isFullscreen ? 'fullscreen' : ''}`}>
      <div className="calculator-container">
        {/* Fullscreen Toggle Button */}
        <button 
          className="expand-button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            {isFullscreen ? (
              <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
            ) : (
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
            )}
          </svg>
        </button>

        <div className="calculator-layout">
          <div className="input-panel">
            <div className="panel-header">
              <h2>Property & Financial Details</h2>
            </div>
            
            <InputForm 
              onSubmit={handleFormSubmit}
              isCalculating={isCalculating}
              onboardingData={onboardingData}
            />
          </div>
        
          <div className="results-panel">
            <div className="panel-header">
              <h2>Analysis Results</h2>
            </div>
            
            {results ? (
              <>
                {warnings.length > 0 && <ValidationWarnings warnings={warnings} />}
                <ResultsDisplay results={results} />
              </>
            ) : (
              <div className="empty-state">
                <p>Complete the form to see whether you should rent or sell your property</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Financial Insights Section */}
        {results && (
          <FinancialInsights results={results} />
        )}
        
        {error !== null && (
          <div className="error-banner">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}