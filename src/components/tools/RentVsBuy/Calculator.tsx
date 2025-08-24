import React, { useState, useCallback } from 'react';
import { calculateRentVsBuy } from '../../../lib/calculators/rentVsBuy/calculator';
import type { RentVsBuyParams, CalculationResult } from '../../../lib/calculators/rentVsBuy/types';
import UserProfile, { type UserProfileData } from './UserProfile';
import InputForm from './InputForm';
import ResultsDisplay from './ResultsDisplay';
import FinancialInsights from './FinancialInsights';
import './Calculator.css';

export default function Calculator() {
  const [results, setResults] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    filingStatus: null,
    currentHomeowner: null,
    sellingCurrentHome: null,
    marketOutlook: null,
    investmentConfidence: null,
  });

  const handleFormSubmit = useCallback((data: RentVsBuyParams) => {
    setIsCalculating(true);
    setError(null);
    
    try {
      // Merge user profile data with form data
      const mergedData: RentVsBuyParams = {
        ...data,
        filingStatus: userProfile.filingStatus || undefined,
        currentHomeowner: userProfile.currentHomeowner || undefined,
        sellingCurrentHome: userProfile.sellingCurrentHome || undefined,
        marketOutlook: userProfile.marketOutlook || undefined,
        investmentConfidence: userProfile.investmentConfidence || undefined,
      };
      
      // Perform calculation with validated data
      const calculationResults = calculateRentVsBuy(mergedData);
      setResults(calculationResults);
    } catch (error) {
      console.error('Calculation error:', error);
      setError('An error occurred during calculation. Please check your inputs and try again.');
    } finally {
      setIsCalculating(false);
    }
  }, [userProfile]);

  return (
    <div className="rvb-calculator">
      {/* User Profile Section */}
      <UserProfile 
        profile={userProfile}
        onChange={setUserProfile}
      />
      
      <div className="calculator-layout">
        <div className="input-panel">
          <div className="panel-header">
            <h2>Financial Details</h2>
          </div>
          
          <InputForm 
            onSubmit={handleFormSubmit}
            isCalculating={isCalculating}
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
  );
}