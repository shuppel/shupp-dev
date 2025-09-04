import { useState } from 'react';
import './OnboardingFlow.css';

export interface OnboardingData {
  // Step 1: Basic Profile
  filingStatus: 'single' | 'married' | null;
  currentHomeowner: boolean | null;
  sellingCurrentHome: boolean | null;
  
  // Step 2: Financial Situation
  annualIncome: number;
  monthlyDebts: number;
  currentSavings: number;
  creditScore: 'excellent' | 'good' | 'fair' | 'poor' | null;
  
  // Step 3: Market & Goals
  marketOutlook: 'hot' | 'stable' | 'cooling' | null;
  investmentConfidence: 'conservative' | 'moderate' | 'aggressive' | null;
  timeHorizon: 'short' | 'medium' | 'long' | null;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

const STEPS = [
  {
    id: 'profile',
    title: 'Tell us about yourself',
    subtitle: 'This helps us personalize your analysis'
  },
  {
    id: 'financial',
    title: 'Your financial situation',
    subtitle: 'We need this to provide accurate recommendations'
  },
  {
    id: 'goals',
    title: 'Your market outlook & goals',
    subtitle: 'Help us understand your expectations'
  }
];

export default function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps): React.JSX.Element {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    filingStatus: null,
    currentHomeowner: null,
    sellingCurrentHome: null,
    annualIncome: 0,
    monthlyDebts: 0,
    currentSavings: 0,
    creditScore: null,
    marketOutlook: null,
    investmentConfidence: null,
    timeHorizon: null,
  });

  const updateData = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]): void => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0:
        return data.filingStatus !== null && data.currentHomeowner !== null;
      case 1:
        return data.annualIncome > 0 && data.creditScore !== null;
      case 2:
        return data.marketOutlook !== null && data.investmentConfidence !== null;
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
      onComplete(data);
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="step-content">
            <div className="input-group">
              <label className="input-label">What's your tax filing status?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.filingStatus === 'single' ? 'selected' : ''}`}
                  onClick={() => updateData('filingStatus', 'single')}
                >
                  <span className="option-icon">👤</span>
                  <span className="option-text">
                    <strong>Single</strong>
                    <small>$14,600 standard deduction</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.filingStatus === 'married' ? 'selected' : ''}`}
                  onClick={() => updateData('filingStatus', 'married')}
                >
                  <span className="option-icon">👥</span>
                  <span className="option-text">
                    <strong>Married Filing Jointly</strong>
                    <small>$29,200 standard deduction</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Do you currently own a home?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.currentHomeowner === true ? 'selected' : ''}`}
                  onClick={() => updateData('currentHomeowner', true)}
                >
                  <span className="option-icon">🏠</span>
                  <span className="option-text">
                    <strong>Yes, I'm a homeowner</strong>
                    <small>May have equity to leverage</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.currentHomeowner === false ? 'selected' : ''}`}
                  onClick={() => updateData('currentHomeowner', false)}
                >
                  <span className="option-icon">🏢</span>
                  <span className="option-text">
                    <strong>No, I rent</strong>
                    <small>First-time buyer programs available</small>
                  </span>
                </button>
              </div>
            </div>

            {data.currentHomeowner === true && (
              <div className="input-group fade-in">
                <label className="input-label">Will you sell your current home?</label>
                <div className="button-group">
                  <button
                    className={`option-button ${data.sellingCurrentHome === true ? 'selected' : ''}`}
                    onClick={() => updateData('sellingCurrentHome', true)}
                  >
                    <span className="option-icon">💰</span>
                    <span className="option-text">
                      <strong>Yes, selling</strong>
                      <small>Proceeds for down payment</small>
                    </span>
                  </button>
                  <button
                    className={`option-button ${data.sellingCurrentHome === false ? 'selected' : ''}`}
                    onClick={() => updateData('sellingCurrentHome', false)}
                  >
                    <span className="option-icon">🔑</span>
                    <span className="option-text">
                      <strong>No, keeping it</strong>
                      <small>Investment property</small>
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="step-content">
            <div className="input-group">
              <label className="input-label">What's your annual household income?</label>
              <div className="currency-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  className="financial-input"
                  placeholder="0"
                  value={data.annualIncome || ''}
                  onChange={(e) => updateData('annualIncome', parseInt(e.target.value) || 0)}
                />
                <span className="input-suffix">per year</span>
              </div>
              <small className="input-hint">This helps us determine what you can comfortably afford</small>
            </div>

            <div className="input-group">
              <label className="input-label">Monthly debt payments (excluding rent)</label>
              <div className="currency-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  className="financial-input"
                  placeholder="0"
                  value={data.monthlyDebts || ''}
                  onChange={(e) => updateData('monthlyDebts', parseInt(e.target.value) || 0)}
                />
                <span className="input-suffix">per month</span>
              </div>
              <small className="input-hint">Include car loans, student loans, credit cards, etc.</small>
            </div>

            <div className="input-group">
              <label className="input-label">Current savings for down payment</label>
              <div className="currency-input">
                <span className="currency-symbol">$</span>
                <input
                  type="number"
                  className="financial-input"
                  placeholder="0"
                  value={data.currentSavings || ''}
                  onChange={(e) => updateData('currentSavings', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">What's your credit score range?</label>
              <div className="button-group vertical">
                {[
                  { id: 'excellent', label: 'Excellent', range: '740+', rate: 'Best rates available' },
                  { id: 'good', label: 'Good', range: '670-739', rate: 'Competitive rates' },
                  { id: 'fair', label: 'Fair', range: '580-669', rate: 'Higher rates' },
                  { id: 'poor', label: 'Poor', range: 'Below 580', rate: 'Limited options' }
                ].map(score => (
                  <button
                    key={score.id}
                    className={`option-button ${data.creditScore === score.id ? 'selected' : ''}`}
                    onClick={() => updateData('creditScore', score.id as 'excellent' | 'good' | 'fair' | 'poor')}
                  >
                    <span className="option-text">
                      <strong>{score.label} ({score.range})</strong>
                      <small>{score.rate}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="step-content">
            <div className="input-group">
              <label className="input-label">How do you view the current housing market?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.marketOutlook === 'hot' ? 'selected' : ''}`}
                  onClick={() => updateData('marketOutlook', 'hot')}
                >
                  <span className="option-icon">🔥</span>
                  <span className="option-text">
                    <strong>Hot Market</strong>
                    <small>Prices rising fast</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.marketOutlook === 'stable' ? 'selected' : ''}`}
                  onClick={() => updateData('marketOutlook', 'stable')}
                >
                  <span className="option-icon">⚖️</span>
                  <span className="option-text">
                    <strong>Stable</strong>
                    <small>Normal appreciation</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.marketOutlook === 'cooling' ? 'selected' : ''}`}
                  onClick={() => updateData('marketOutlook', 'cooling')}
                >
                  <span className="option-icon">❄️</span>
                  <span className="option-text">
                    <strong>Cooling</strong>
                    <small>Prices may decline</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">If you rent, how would you invest the difference?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.investmentConfidence === 'conservative' ? 'selected' : ''}`}
                  onClick={() => updateData('investmentConfidence', 'conservative')}
                >
                  <span className="option-icon">🛡️</span>
                  <span className="option-text">
                    <strong>Conservative</strong>
                    <small>4-5% returns</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.investmentConfidence === 'moderate' ? 'selected' : ''}`}
                  onClick={() => updateData('investmentConfidence', 'moderate')}
                >
                  <span className="option-icon">📊</span>
                  <span className="option-text">
                    <strong>Moderate</strong>
                    <small>7-8% returns</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.investmentConfidence === 'aggressive' ? 'selected' : ''}`}
                  onClick={() => updateData('investmentConfidence', 'aggressive')}
                >
                  <span className="option-icon">🚀</span>
                  <span className="option-text">
                    <strong>Aggressive</strong>
                    <small>10%+ returns</small>
                  </span>
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">How long do you plan to stay in this home?</label>
              <div className="button-group">
                <button
                  className={`option-button ${data.timeHorizon === 'short' ? 'selected' : ''}`}
                  onClick={() => updateData('timeHorizon', 'short')}
                >
                  <span className="option-icon">⏱️</span>
                  <span className="option-text">
                    <strong>1-3 years</strong>
                    <small>Short term</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.timeHorizon === 'medium' ? 'selected' : ''}`}
                  onClick={() => updateData('timeHorizon', 'medium')}
                >
                  <span className="option-icon">⏰</span>
                  <span className="option-text">
                    <strong>4-7 years</strong>
                    <small>Medium term</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.timeHorizon === 'long' ? 'selected' : ''}`}
                  onClick={() => updateData('timeHorizon', 'long')}
                >
                  <span className="option-icon">📅</span>
                  <span className="option-text">
                    <strong>8+ years</strong>
                    <small>Long term</small>
                  </span>
                </button>
              </div>
            </div>
          </div>
        );
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
            disabled={!canProceed()}
          >
            {currentStep === STEPS.length - 1 ? 'Start Analysis' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}