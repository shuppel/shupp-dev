import React, { useState, useCallback } from 'react';
import { calculateRentVsBuy } from '../../../lib/calculators/rentVsBuy/calculator';
import type { RentVsBuyParams, CalculationResult } from '../../../lib/calculators/rentVsBuy/types';
import OnboardingFlow, { type OnboardingData } from './OnboardingFlow';
import InputForm from './InputForm';
import ResultsDisplay from './ResultsDisplay';
import FinancialInsights from './FinancialInsights';
import './Calculator.css';

export default function Calculator() {
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  const handleFormSubmit = useCallback((data: RentVsBuyParams) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Merge onboarding data with form data if available
      const mergedData: RentVsBuyParams = {
        ...data,
        filingStatus: onboardingData?.filingStatus || undefined,
        currentHomeowner: onboardingData?.currentHomeowner || undefined,
        sellingCurrentHome: onboardingData?.sellingCurrentHome || undefined,
        marketOutlook: onboardingData?.marketOutlook || undefined,
        investmentConfidence: onboardingData?.investmentConfidence || undefined,
      };
      
      // Perform calculation with validated data and financial info
      const calculationResults = calculateRentVsBuy(mergedData, {
        annualIncome: onboardingData?.annualIncome || 0,
        monthlyDebts: onboardingData?.monthlyDebts || 0,
        currentSavings: onboardingData?.currentSavings || 0,
      });
      setResults(calculationResults);
    } catch (error) {
      console.error('Calculation error:', error);
      setError('An error occurred during calculation. Please check your inputs and try again.');
    } finally {
      setIsCalculating(false);
    }
  }, [onboardingData]);
  
  const handleOnboardingComplete = useCallback((data: OnboardingData) => {
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
      <OnboardingFlow 
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  return (
    <div className={`rvb-calculator ${isFullscreen ? 'fullscreen' : ''}`}>
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
              <h2>Financial Details</h2>
            </div>
            
            <InputForm 
              onSubmit={handleFormSubmit}
              isCalculating={isCalculating}
              onboardingData={onboardingData}
            />
          </div>
        
          <div className="results-panel">
            <div className="panel-header">
              <h2>Results</h2>
            </div>
            
            {results ? (
              <ResultsDisplay results={results} />
            ) : (
              <div className="empty-state">
                <p>Fill out the form and submit to see your personalized rent vs buy analysis</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Financial Insights Section */}
        {results && (
          <FinancialInsights 
            results={results}
            monthlyPayment={results.monthlyData[0]?.buyingCost || 0}
            loanAmount={results.monthlyData[0]?.homeValue * 0.8 || 0} // Rough estimate
          />
        )}
        
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}