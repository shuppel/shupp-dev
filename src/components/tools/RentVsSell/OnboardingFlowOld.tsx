import React, { useState } from 'react';
import type { RentVsSellOnboardingData } from '../../../lib/calculators/rentVsSell/types';
import LiquidSlider from '../shared/LiquidSlider';
import './OnboardingFlow.css';

interface OnboardingFlowProps {
  onComplete: (data: RentVsSellOnboardingData) => void;
  onSkip: () => void;
}

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<RentVsSellOnboardingData>>({
    propertyType: 'single-family',
    yearsOwned: 5,
    propertyCondition: 'good',
    landlordExperience: 'none',
    timeAvailability: 'some',
    primaryGoal: 'appreciation',
    riskTolerance: 'moderate',
  });

  const totalSteps = 8;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(data as RentVsSellOnboardingData);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateData = (field: keyof RentVsSellOnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const getRenterReadinessScore = () => {
    let score = 0;
    const factors = [];
    
    // Time availability
    if (data.timeAvailability === 'plenty') {
      score += 30;
      factors.push({ positive: true, text: 'Plenty of time for management' });
    } else if (data.timeAvailability === 'some') {
      score += 20;
      factors.push({ positive: true, text: 'Adequate time availability' });
    } else {
      score += 5;
      factors.push({ positive: false, text: 'Limited time - consider property management' });
    }
    
    // Experience
    if (data.landlordExperience === 'experienced') {
      score += 25;
      factors.push({ positive: true, text: 'Experienced landlord' });
    } else if (data.landlordExperience === 'some') {
      score += 15;
      factors.push({ positive: true, text: 'Some landlord experience' });
    } else {
      score += 5;
      factors.push({ positive: false, text: 'No landlord experience - expect learning curve' });
    }
    
    // Property condition
    if (data.propertyCondition === 'excellent') {
      score += 20;
      factors.push({ positive: true, text: 'Property in excellent condition' });
    } else if (data.propertyCondition === 'good') {
      score += 15;
      factors.push({ positive: true, text: 'Property in good condition' });
    } else if (data.propertyCondition === 'fair') {
      score += 10;
      factors.push({ positive: false, text: 'Property may need some repairs' });
    } else {
      score += 0;
      factors.push({ positive: false, text: 'Property needs significant work' });
    }
    
    // Risk tolerance
    if (data.riskTolerance === 'aggressive' || data.riskTolerance === 'moderate') {
      score += 15;
      factors.push({ positive: true, text: 'Comfortable with rental risks' });
    } else {
      score += 5;
      factors.push({ positive: false, text: 'Conservative approach may find rentals stressful' });
    }
    
    // Has been rented
    if (data.hasBeenRented) {
      score += 10;
      factors.push({ positive: true, text: 'Property has rental history' });
    }
    
    const readinessLevel = 
      score >= 80 ? 'Excellent' :
      score >= 60 ? 'Good' :
      score >= 40 ? 'Fair' :
      'Needs Preparation';
      
    const readinessColor = 
      score >= 80 ? '#acc196' :
      score >= 60 ? '#7994a0' :
      score >= 40 ? '#f39c12' :
      '#e74c3c';
    
    return (
      <div className="readiness-result">
        <div className="readiness-meter">
          <div className="readiness-bar" style={{ 
            width: `${score}%`, 
            backgroundColor: readinessColor 
          }} />
          <span className="readiness-label">{readinessLevel} ({score}/100)</span>
        </div>
        <div className="readiness-factors">
          {factors.map((factor, index) => (
            <div key={index} className={`factor ${factor.positive ? 'positive' : 'negative'}`}>
              <span className="factor-icon">{factor.positive ? '✅' : '⚠️'}</span>
              <span className="factor-text">{factor.text}</span>
            </div>
          ))}
        </div>
        {score < 60 && (
          <div className="readiness-recommendation">
            <strong>Recommendation:</strong> Consider selling or working with a property management company to handle day-to-day operations.
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="onboarding-page">
      <div className="rvs-onboarding">
      <div className="onboarding-header">
        <h2>Let's Get Your Property Details</h2>
        <p>This will help us provide more accurate recommendations</p>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </div>

      <div className="onboarding-content">
        {step === 1 && (
          <div className="step-content">
            <h3>What type of property do you own?</h3>
            <div className="option-grid">
              {['single-family', 'condo', 'townhouse', 'multi-family'].map(type => (
                <button
                  key={type}
                  className={`option-button ${data.propertyType === type ? 'selected' : ''}`}
                  onClick={() => updateData('propertyType', type)}
                >
                  <div className="option-icon">
                    {type === 'single-family' && '🏠'}
                    {type === 'condo' && '🏢'}
                    {type === 'townhouse' && '🏘️'}
                    {type === 'multi-family' && '🏗️'}
                  </div>
                  <div className="option-label">
                    {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="step-content">
            <h3>How long have you owned this property?</h3>
            <div className="input-group">
              <LiquidSlider
                min={0}
                max={30}
                value={data.yearsOwned || 5}
                onChange={(value) => updateData('yearsOwned', value)}
                label="Years Owned"
                suffix="years"
              />
            </div>
            <p className="helper-text">
              {data.yearsOwned! < 2 && "Short-term capital gains tax may apply if you sell"}
              {data.yearsOwned! >= 2 && data.yearsOwned! < 5 && "You may qualify for partial capital gains exemption"}
              {data.yearsOwned! >= 5 && "You likely qualify for capital gains exemption if this is your primary residence"}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="step-content">
            <h3>Has this property been rented before?</h3>
            <div className="option-grid two-column">
              <button
                className={`option-button ${data.hasBeenRented === true ? 'selected' : ''}`}
                onClick={() => updateData('hasBeenRented', true)}
              >
                <div className="option-icon">✅</div>
                <div className="option-label">Yes, it's been rented</div>
              </button>
              <button
                className={`option-button ${data.hasBeenRented === false ? 'selected' : ''}`}
                onClick={() => updateData('hasBeenRented', false)}
              >
                <div className="option-icon">❌</div>
                <div className="option-label">No, never rented</div>
              </button>
            </div>
            {data.hasBeenRented && (
              <div className="follow-up">
                <label>Current monthly rent (if applicable):</label>
                <div className="liquid-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    placeholder="0"
                    value={data.currentMonthlyRent || ''}
                    onChange={(e) => updateData('currentMonthlyRent', Number(e.target.value))}
                    className="liquid-input"
                  />
                  <span className="input-suffix">/month</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="step-content">
            <h3>What's the current condition of your property?</h3>
            <div className="option-grid">
              {[
                { value: 'excellent', label: 'Excellent', desc: 'Move-in ready, updated' },
                { value: 'good', label: 'Good', desc: 'Well-maintained, minor updates needed' },
                { value: 'fair', label: 'Fair', desc: 'Functional, some repairs needed' },
                { value: 'needs-work', label: 'Needs Work', desc: 'Significant repairs required' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`option-button vertical ${data.propertyCondition === option.value ? 'selected' : ''}`}
                  onClick={() => updateData('propertyCondition', option.value as any)}
                >
                  <div className="option-label">{option.label}</div>
                  <div className="option-desc">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="step-content">
            <h3>What's your experience as a landlord?</h3>
            <div className="option-grid">
              {[
                { value: 'none', label: 'No Experience', icon: '🆕' },
                { value: 'some', label: 'Some Experience', icon: '📚' },
                { value: 'experienced', label: 'Very Experienced', icon: '🎓' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`option-button ${data.landlordExperience === option.value ? 'selected' : ''}`}
                  onClick={() => updateData('landlordExperience', option.value as any)}
                >
                  <div className="option-icon">{option.icon}</div>
                  <div className="option-label">{option.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="step-content">
            <h3>What's your primary financial goal?</h3>
            <div className="option-grid two-column">
              {[
                { value: 'cash-flow', label: 'Monthly Cash Flow', desc: 'Generate regular income' },
                { value: 'appreciation', label: 'Long-term Growth', desc: 'Build wealth over time' },
                { value: 'passive-income', label: 'Passive Income', desc: 'Minimal involvement' },
                { value: 'liquidity', label: 'Access to Cash', desc: 'Need funds soon' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`option-button vertical ${data.primaryGoal === option.value ? 'selected' : ''}`}
                  onClick={() => updateData('primaryGoal', option.value as any)}
                >
                  <div className="option-label">{option.label}</div>
                  <div className="option-desc">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="step-content">
            <h3>What's your risk tolerance?</h3>
            <div className="option-grid">
              {[
                { value: 'conservative', label: 'Conservative', desc: 'Prefer stability and lower risk' },
                { value: 'moderate', label: 'Moderate', desc: 'Balance risk and reward' },
                { value: 'aggressive', label: 'Aggressive', desc: 'Comfortable with higher risk' }
              ].map(option => (
                <button
                  key={option.value}
                  className={`option-button vertical ${data.riskTolerance === option.value ? 'selected' : ''}`}
                  onClick={() => updateData('riskTolerance', option.value as any)}
                >
                  <div className="option-label">{option.label}</div>
                  <div className="option-desc">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="step-content">
            <h3>How much time can you dedicate to being a landlord?</h3>
            <p className="step-description">
              Being a landlord requires time for tenant screening, maintenance, emergencies, and management tasks.
            </p>
            <div className="option-grid">
              {[
                { 
                  value: 'minimal', 
                  label: 'Minimal Time', 
                  desc: 'Less than 5 hours per month',
                  icon: '⏱️',
                  warning: 'Consider property management services'
                },
                { 
                  value: 'some', 
                  label: 'Some Time', 
                  desc: '5-15 hours per month',
                  icon: '⏰',
                  warning: 'Good for 1-2 properties'
                },
                { 
                  value: 'plenty', 
                  label: 'Plenty of Time', 
                  desc: '15+ hours per month',
                  icon: '🕐',
                  warning: 'Ready for hands-on management'
                }
              ].map(option => (
                <button
                  key={option.value}
                  className={`option-button vertical ${data.timeAvailability === option.value ? 'selected' : ''}`}
                  onClick={() => updateData('timeAvailability', option.value as any)}
                >
                  <div className="option-icon">{option.icon}</div>
                  <div className="option-label">{option.label}</div>
                  <div className="option-desc">{option.desc}</div>
                  {data.timeAvailability === option.value && (
                    <div className="option-warning">{option.warning}</div>
                  )}
                </button>
              ))}
            </div>
            
            {/* Renter Readiness Score */}
            {data.timeAvailability && (
              <div className="readiness-score">
                <h4>Your Renter Readiness Assessment:</h4>
                {getRenterReadinessScore()}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="onboarding-footer">
        <button className="skip-button" onClick={onSkip}>
          Skip Setup
        </button>
        <div className="nav-buttons">
          {step > 1 && (
            <button className="back-button" onClick={handleBack}>
              Back
            </button>
          )}
          <button className="next-button" onClick={handleNext}>
            {step === totalSteps ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}