import React, { useState } from 'react';
import type { RentVsSellOnboardingData } from '../../../lib/calculators/rentVsSell/types';
import './OnboardingFlow.css';

interface OnboardingFlowProps {
  onComplete: (data: RentVsSellOnboardingData) => void;
  onSkip: () => void;
}

const STEPS = [
  {
    id: 'property',
    title: 'Tell us about your property',
    subtitle: 'This helps us personalize your analysis'
  },
  {
    id: 'readiness',
    title: 'Your landlord readiness',
    subtitle: 'Let\'s assess if renting is right for you'
  },
  {
    id: 'goals',
    title: 'Financial goals & market outlook',
    subtitle: 'Help us understand your expectations'
  }
];

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [data, setData] = useState<Partial<RentVsSellOnboardingData>>({
    propertyType: 'single-family',
    yearsOwned: 5,
    propertyCondition: 'good',
    hasBeenRented: false,
    landlordExperience: 'none',
    timeAvailability: 'some',
    primaryGoal: 'appreciation',
    riskTolerance: 'moderate',
    planToMoveDistance: 'local',
  });

  const updateData = <K extends keyof RentVsSellOnboardingData>(key: K, value: RentVsSellOnboardingData[K]): void => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return data.propertyType !== undefined && data.yearsOwned !== undefined && data.propertyCondition !== undefined;
      case 1:
        return data.landlordExperience !== undefined && data.timeAvailability !== undefined;
      case 2:
        return data.primaryGoal !== undefined && data.riskTolerance !== undefined;
      default:
        return false;
    }
  };

  const handleNext = (): void => {
    if (currentStep < STEPS.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete(data as RentVsSellOnboardingData);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const getRenterReadinessScore = (): { score: number; factors: { positive: boolean; text: string }[]; readinessLevel: string; readinessColor: string } => {
    let score = 0;
    const factors: { positive: boolean; text: string }[] = [];
    
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
    if (data.hasBeenRented === true) {
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
    
    return { score, factors, readinessLevel, readinessColor };
  };

  const renderStep = (): React.JSX.Element => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <div className="input-group">
              <label className="input-label">What type of property do you own?</label>
              <div className="button-group">
                 {[
                   { value: 'single-family', icon: 'Home', label: 'Single Family' },
                   { value: 'condo', icon: 'Building', label: 'Condo' },
                   { value: 'townhouse', icon: 'Townhouse', label: 'Townhouse' },
                   { value: 'multi-family', icon: 'Buildings', label: 'Multi-Family' }
                 ].map(option => (
                  <button
                    key={option.value}
                    className={`option-button ${data.propertyType === option.value ? 'selected' : ''}`}
                    onClick={() => updateData('propertyType', option.value as 'single-family' | 'condo' | 'townhouse' | 'multi-family')}
                  >
                    <span className="option-icon">{option.icon}</span>
                    <span className="option-text">
                      <strong>{option.label}</strong>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">How's the condition of your property?</label>
              <div className="button-group vertical">
                {[
                  { value: 'excellent', label: 'Excellent', desc: 'Move-in ready, recently updated' },
                  { value: 'good', label: 'Good', desc: 'Well-maintained, minor updates needed' },
                  { value: 'fair', label: 'Fair', desc: 'Functional, some repairs needed' },
                  { value: 'needs-work', label: 'Needs Work', desc: 'Significant repairs required' }
                ].map(option => (
                  <button
                    key={option.value}
                    className={`option-button ${data.propertyCondition === option.value ? 'selected' : ''}`}
                    onClick={() => updateData('propertyCondition', option.value as 'excellent' | 'good' | 'fair' | 'needs-work')}
                  >
                    <span className="option-text">
                      <strong>{option.label}</strong>
                      <small>{option.desc}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">How long have you owned this property?</label>
              <div className="slider-group">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={data.yearsOwned ?? 5}
                  onChange={(e) => updateData('yearsOwned', Number(e.target.value))}
                  className="styled-range"
                />
                <div className="range-value-display">
                  <span className="value-text">{data.yearsOwned}</span>
                  <span className="value-suffix">years</span>
                </div>
              </div>
              <p className="input-hint">
                {data.yearsOwned !== undefined && data.yearsOwned < 2 && "Short-term capital gains tax may apply if you sell"}
                {data.yearsOwned !== undefined && data.yearsOwned >= 2 && data.yearsOwned < 5 && "You may qualify for partial capital gains exemption"}
                {data.yearsOwned !== undefined && data.yearsOwned >= 5 && "You likely qualify for capital gains exemption if this is your primary residence"}
              </p>
            </div>

            <div className="input-group">
              <label className="input-label">Has this property been rented before?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.hasBeenRented === true ? 'selected' : ''}`}
                  onClick={() => updateData('hasBeenRented', true)}
                >
                   <span className="option-icon">Yes</span>
                  <span className="option-text">
                    <strong>Yes</strong>
                    <small>Has rental history</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.hasBeenRented === false ? 'selected' : ''}`}
                  onClick={() => updateData('hasBeenRented', false)}
                >
                   <span className="option-icon">No</span>
                  <span className="option-text">
                    <strong>No</strong>
                    <small>Never rented</small>
                  </span>
                </button>
              </div>
            </div>

            {data.hasBeenRented === true && (
              <div className="input-group fade-in">
                <label className="input-label">Current monthly rent (if rented)</label>
                <div className="currency-input">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    className="financial-input"
                    placeholder="0"
                    value={data.currentMonthlyRent ?? ''}
                    onChange={(e) => updateData('currentMonthlyRent', parseInt(e.target.value) ?? 0)}
                  />
                  <span className="input-suffix">per month</span>
                </div>
              </div>
            )}

            {data.originalPurchasePrice === undefined && (
              <div className="input-group">
                <label className="input-label">Original purchase price (optional)</label>
                <div className="currency-input">
                  <span className="currency-symbol">$</span>
                  <input
                    type="number"
                    className="financial-input"
                    placeholder="0"
                    value={data.originalPurchasePrice ?? ''}
                    onChange={(e) => updateData('originalPurchasePrice', parseInt(e.target.value) ?? 0)}
                  />
                </div>
                <small className="input-hint">Helps us calculate your potential capital gains</small>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <div className="input-group">
              <label className="input-label">What's your landlord experience?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.landlordExperience === 'none' ? 'selected' : ''}`}
                  onClick={() => updateData('landlordExperience', 'none')}
                >
                   <span className="option-icon">New</span>
                  <span className="option-text">
                    <strong>No Experience</strong>
                    <small>First time landlord</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.landlordExperience === 'some' ? 'selected' : ''}`}
                  onClick={() => updateData('landlordExperience', 'some')}
                >
                   <span className="option-icon">Book</span>
                  <span className="option-text">
                    <strong>Some Experience</strong>
                    <small>1-3 years</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.landlordExperience === 'experienced' ? 'selected' : ''}`}
                  onClick={() => updateData('landlordExperience', 'experienced')}
                >
                   <span className="option-icon">Graduation</span>
                  <span className="option-text">
                    <strong>Very Experienced</strong>
                    <small>3+ years</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">How much time can you dedicate to property management?</label>
              <div className="button-group vertical">
                {[
                  { 
                    value: 'minimal', 
                    label: 'Minimal Time', 
                    desc: 'Less than 5 hours per month',
                     icon: 'Timer',
                    warning: 'Consider hiring property management'
                  },
                  { 
                    value: 'some', 
                    label: 'Some Time', 
                    desc: '5-15 hours per month',
                     icon: 'Clock',
                    warning: 'Good for 1-2 properties'
                  },
                  { 
                    value: 'plenty', 
                    label: 'Plenty of Time', 
                    desc: '15+ hours per month',
                     icon: 'Time',
                    warning: 'Ready for hands-on management'
                  }
                ].map(option => (
                  <button
                    key={option.value}
                    className={`option-button ${data.timeAvailability === option.value ? 'selected' : ''}`}
                    onClick={() => updateData('timeAvailability', option.value as 'plenty' | 'some' | 'minimal')}
                  >
                    <span className="option-icon">{option.icon}</span>
                    <span className="option-text">
                      <strong>{option.label}</strong>
                      <small>{option.desc}</small>
                      {data.timeAvailability === option.value && (
                        <small className="option-note">{option.warning}</small>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Landlord Readiness Assessment */}
            {data.timeAvailability && data.landlordExperience && (
              <div className="readiness-assessment fade-in">
                <h3>Your Landlord Readiness Score</h3>
                {(() => {
                  const { score, factors, readinessLevel, readinessColor } = getRenterReadinessScore();
                  return (
                    <div className="readiness-result">
                      <div className="readiness-meter">
                        <div 
                          className="readiness-bar" 
                          style={{ 
                            width: `${score}%`, 
                            backgroundColor: readinessColor 
                          }} 
                        />
                        <span className="readiness-label">{readinessLevel} ({score}/100)</span>
                      </div>
                      <div className="readiness-factors">
                        {factors.map((factor, index) => (
                          <div key={index} className={`factor ${factor.positive ? 'positive' : 'negative'}`}>
                             <span className="factor-icon">{factor.positive ? 'Check' : 'Warning'}</span>
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
                })()}
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="input-group">
              <label className="input-label">What's your primary financial goal?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.primaryGoal === 'cash-flow' ? 'selected' : ''}`}
                  onClick={() => updateData('primaryGoal', 'cash-flow')}
                >
                   <span className="option-icon">Money</span>
                  <span className="option-text">
                    <strong>Cash Flow</strong>
                    <small>Monthly income</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.primaryGoal === 'appreciation' ? 'selected' : ''}`}
                  onClick={() => updateData('primaryGoal', 'appreciation')}
                >
                   <span className="option-icon">Trend</span>
                  <span className="option-text">
                    <strong>Appreciation</strong>
                    <small>Long-term growth</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.primaryGoal === 'liquidity' ? 'selected' : ''}`}
                  onClick={() => updateData('primaryGoal', 'liquidity')}
                >
                   <span className="option-icon">Cash</span>
                  <span className="option-text">
                    <strong>Liquidity</strong>
                    <small>Access to cash</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">What's your risk tolerance?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.riskTolerance === 'conservative' ? 'selected' : ''}`}
                  onClick={() => updateData('riskTolerance', 'conservative')}
                >
                   <span className="option-icon">Shield</span>
                  <span className="option-text">
                    <strong>Conservative</strong>
                    <small>Low risk preferred</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.riskTolerance === 'moderate' ? 'selected' : ''}`}
                  onClick={() => updateData('riskTolerance', 'moderate')}
                >
                   <span className="option-icon">Balance</span>
                  <span className="option-text">
                    <strong>Moderate</strong>
                    <small>Balanced approach</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.riskTolerance === 'aggressive' ? 'selected' : ''}`}
                  onClick={() => updateData('riskTolerance', 'aggressive')}
                >
                   <span className="option-icon">Rocket</span>
                  <span className="option-text">
                    <strong>Aggressive</strong>
                    <small>Higher risk/reward</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Where are you planning to move?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.planToMoveDistance === 'local' ? 'selected' : ''}`}
                  onClick={() => updateData('planToMoveDistance', 'local')}
                >
                   <span className="option-icon">Town</span>
                  <span className="option-text">
                    <strong>Staying Local</strong>
                    <small>Same city/area</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.planToMoveDistance === 'nearby' ? 'selected' : ''}`}
                  onClick={() => updateData('planToMoveDistance', 'nearby')}
                >
                   <span className="option-icon">Car</span>
                  <span className="option-text">
                    <strong>Nearby</strong>
                    <small>Within 2 hours</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.planToMoveDistance === 'far' ? 'selected' : ''}`}
                  onClick={() => updateData('planToMoveDistance', 'far')}
                >
                   <span className="option-icon">Plane</span>
                  <span className="option-text">
                    <strong>Far Away</strong>
                    <small>Different state/region</small>
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return <div />;
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-wrapper">
        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className="step-indicators">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`step-indicator ${
                  index === currentStep ? 'active' : 
                  index < currentStep ? 'completed' : ''
                }`}
              >
                <div className="step-number">
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className="step-label">{step.id}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`onboarding-content ${isAnimating ? 'animating' : ''}`}>
          <div className="step-header">
            <h2>{STEPS[currentStep].title}</h2>
            <p>{STEPS[currentStep].subtitle}</p>
          </div>

          {renderStep()}
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          <button
            className="action-button secondary"
            onClick={currentStep === 0 ? onSkip : handleBack}
          >
            {currentStep === 0 ? 'Skip for now' : 'Back'}
          </button>
          
          <button
            className="action-button primary"
            onClick={handleNext}
            disabled={canProceed() === false}
          >
            {currentStep === STEPS.length - 1 ? 'Start Analysis' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}