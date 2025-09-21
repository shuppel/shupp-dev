import React, { useState } from 'react';
import './OnboardingFlow.css';

export interface OnboardingData {
  // Basic Profile
  filingStatus: 'single' | 'married' | null;
  currentHomeowner: boolean | null;
  sellingCurrentHome: boolean | null;
  
  // Financial Details
  annualIncome: number;
  monthlyDebts: number;
  currentSavings: number;
  creditScore: 'excellent' | 'good' | 'fair' | 'poor' | null;
  
  // Market & Investment
  marketOutlook: 'hot' | 'stable' | 'cooling' | null;
  investmentConfidence: 'conservative' | 'moderate' | 'aggressive' | null;
  timeHorizon: 'short' | 'medium' | 'long' | null;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => void;
  onSkip?: () => void;
}

const CATEGORIES = [
  {
    id: 'profile',
     title: 'Personal Profile',
     subtitle: 'Basic information about you',
     icon: 'Person',
    sections: [
      { id: 'filing', title: 'Filing Status', description: 'Tax filing information' },
      { id: 'ownership', title: 'Current Situation', description: 'Homeowner status' }
    ]
  },
  {
    id: 'financial',
     title: 'Financial Details',
     subtitle: 'Your financial situation',
     icon: 'Money',
    sections: [
      { id: 'income', title: 'Income & Debts', description: 'Monthly cash flow' },
      { id: 'credit', title: 'Credit & Savings', description: 'Financial health' }
    ]
  },
  {
    id: 'market',
     title: 'Market & Goals',
     subtitle: 'Expectations and outlook',
     icon: 'Chart',
    sections: [
      { id: 'outlook', title: 'Market Outlook', description: 'Housing market view' },
      { id: 'investment', title: 'Investment Style', description: 'Risk and timeline' }
    ]
  }
];

export default function OnboardingFlowV2({ onComplete, onSkip }: OnboardingFlowProps): React.JSX.Element {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
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

  const currentCategory = CATEGORIES[activeCategory];
  const currentSection = currentCategory.sections[activeSection];
  const totalSections = CATEGORIES.reduce((sum, cat) => sum + cat.sections.length, 0);
  const completedSections = CATEGORIES.slice(0, activeCategory).reduce((sum, cat) => sum + cat.sections.length, 0) + activeSection;
  const progressPercentage = ((completedSections + 1) / totalSections) * 100;

  const canProceed = (): boolean => {
    const cat = currentCategory.id;
    const sec = currentSection.id;

    if (cat === 'profile') {
      if (sec === 'filing') return data.filingStatus !== null;
      if (sec === 'ownership') return data.currentHomeowner !== null;
    } else if (cat === 'financial') {
      if (sec === 'income') return data.annualIncome > 0 && data.monthlyDebts >= 0;
      if (sec === 'credit') return data.creditScore !== null && data.currentSavings >= 0;
    } else if (cat === 'market') {
      if (sec === 'outlook') return data.marketOutlook !== null;
      if (sec === 'investment') return data.investmentConfidence !== null && data.timeHorizon !== null;
    }
    return false;
  };

  const handleNext = (): void => {
    if (activeSection < currentCategory.sections.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveSection(prev => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else if (activeCategory < CATEGORIES.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveCategory(prev => prev + 1);
        setActiveSection(0);
        setIsAnimating(false);
      }, 300);
    } else {
      onComplete(data);
    }
  };

  const handleBack = (): void => {
    if (activeSection > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveSection(prev => prev - 1);
        setIsAnimating(false);
      }, 300);
    } else if (activeCategory > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setActiveCategory(prev => prev - 1);
        setActiveSection(CATEGORIES[activeCategory - 1].sections.length - 1);
        setIsAnimating(false);
      }, 300);
    }
  };

  const renderSectionContent = () => {
    const cat = currentCategory.id;
    const sec = currentSection.id;

    if (cat === 'profile' && sec === 'filing') {
      return (
        <div className="section-content">
          <div className="input-group">
            <label className="input-label">What's your tax filing status?</label>
            <div className="button-group vertical">
              <button
                className={`option-button ${data.filingStatus === 'single' ? 'selected' : ''}`}
                onClick={() => updateData('filingStatus', 'single')}
              >
                 <span className="option-icon">Person</span>
                <span className="option-text">
                  <strong>Single</strong>
                  <small>$14,600 standard deduction</small>
                </span>
              </button>
              <button
                className={`option-button ${data.filingStatus === 'married' ? 'selected' : ''}`}
                onClick={() => updateData('filingStatus', 'married')}
              >
                 <span className="option-icon">People</span>
                <span className="option-text">
                  <strong>Married Filing Jointly</strong>
                  <small>$29,200 standard deduction</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'profile' && sec === 'ownership') {
      return (
        <div className="section-content">
          <div className="input-group">
            <label className="input-label">Do you currently own a home?</label>
            <div className="button-group vertical">
              <button
                className={`option-button ${data.currentHomeowner === true ? 'selected' : ''}`}
                onClick={() => updateData('currentHomeowner', true)}
              >
                 <span className="option-icon">Home</span>
                <span className="option-text">
                  <strong>Yes, I'm a homeowner</strong>
                  <small>May have equity to leverage</small>
                </span>
              </button>
              <button
                className={`option-button ${data.currentHomeowner === false ? 'selected' : ''}`}
                onClick={() => updateData('currentHomeowner', false)}
              >
                 <span className="option-icon">Building</span>
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
                   <span className="option-icon">Money</span>
                  <span className="option-text">
                    <strong>Yes</strong>
                    <small>Proceeds for down payment</small>
                  </span>
                </button>
                <button
                  className={`option-button ${data.sellingCurrentHome === false ? 'selected' : ''}`}
                  onClick={() => updateData('sellingCurrentHome', false)}
                >
                   <span className="option-icon">Key</span>
                  <span className="option-text">
                    <strong>No</strong>
                    <small>Keep as investment</small>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (cat === 'financial' && sec === 'income') {
      return (
        <div className="section-content">
          <div className="input-group">
            <label className="input-label">Annual household income</label>
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
            <small className="input-hint">This helps determine what you can afford</small>
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
            <small className="input-hint">Car loans, student loans, credit cards, etc.</small>
          </div>
        </div>
      );
    }

    if (cat === 'financial' && sec === 'credit') {
      return (
        <div className="section-content">
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
            <label className="input-label">Credit score range</label>
            <div className="button-group vertical compact">
              {[
                { id: 'excellent', label: 'Excellent (740+)', rate: 'Best rates' },
                { id: 'good', label: 'Good (670-739)', rate: 'Competitive rates' },
                { id: 'fair', label: 'Fair (580-669)', rate: 'Higher rates' },
                { id: 'poor', label: 'Poor (Below 580)', rate: 'Limited options' }
              ].map(score => (
                <button
                  key={score.id}
                  className={`option-button compact ${data.creditScore === score.id ? 'selected' : ''}`}
                  onClick={() => updateData('creditScore', score.id as 'excellent' | 'good' | 'fair' | 'poor')}
                >
                  <span className="option-text">
                    <strong>{score.label}</strong>
                    <small>{score.rate}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'market' && sec === 'outlook') {
      return (
        <div className="section-content">
          <div className="input-group">
            <label className="input-label">How do you view the housing market?</label>
            <div className="button-group">
               {[
                 { id: 'hot', icon: 'Hot', label: 'Hot Market', desc: 'Prices rising fast' },
                 { id: 'stable', icon: 'Balance', label: 'Stable', desc: 'Normal appreciation' },
                 { id: 'cooling', icon: 'Cool', label: 'Cooling', desc: 'Prices may decline' }
               ].map(market => (
                <button
                  key={market.id}
                  className={`option-button ${data.marketOutlook === market.id ? 'selected' : ''}`}
                  onClick={() => updateData('marketOutlook', market.id as 'hot' | 'stable' | 'cooling')}
                >
                  <span className="option-icon">{market.icon}</span>
                  <span className="option-text">
                    <strong>{market.label}</strong>
                    <small>{market.desc}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (cat === 'market' && sec === 'investment') {
      return (
        <div className="section-content">
          <div className="input-group">
            <label className="input-label">Investment style if you rent</label>
            <div className="button-group">
               {[
                 { id: 'conservative', icon: 'Shield', label: 'Conservative', returns: '4-5% returns' },
                 { id: 'moderate', icon: 'Chart', label: 'Moderate', returns: '7-8% returns' },
                 { id: 'aggressive', icon: 'Rocket', label: 'Aggressive', returns: '10%+ returns' }
               ].map(style => (
                <button
                  key={style.id}
                  className={`option-button compact ${data.investmentConfidence === style.id ? 'selected' : ''}`}
                  onClick={() => updateData('investmentConfidence', style.id as 'conservative' | 'moderate' | 'aggressive')}
                >
                  <span className="option-icon">{style.icon}</span>
                  <span className="option-text">
                    <strong>{style.label}</strong>
                    <small>{style.returns}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">How long will you stay?</label>
            <div className="button-group">
               {[
                 { id: 'short', icon: 'Timer', label: '1-3 years', desc: 'Short term' },
                 { id: 'medium', icon: 'Clock', label: '4-7 years', desc: 'Medium term' },
                 { id: 'long', icon: 'Calendar', label: '8+ years', desc: 'Long term' }
               ].map(time => (
                <button
                  key={time.id}
                  className={`option-button compact ${data.timeHorizon === time.id ? 'selected' : ''}`}
                  onClick={() => updateData('timeHorizon', time.id as 'short' | 'medium' | 'long')}
                >
                  <span className="option-icon">{time.icon}</span>
                  <span className="option-text">
                    <strong>{time.label}</strong>
                    <small>{time.desc}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="onboarding-container v2">
      <div className="onboarding-wrapper">
        {/* Progress Bar */}
        <div className="progress-section">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          {/* Category Indicators */}
          <div className="category-indicators">
            {CATEGORIES.map((category, index) => (
              <div 
                key={category.id}
                className={`category-indicator ${
                  index === activeCategory ? 'active' : 
                  index < activeCategory ? 'completed' : ''
                }`}
                onClick={() => {
                  if (index < activeCategory || (index === activeCategory && activeSection > 0)) {
                    setActiveCategory(index);
                    setActiveSection(0);
                  }
                }}
              >
                <div className="category-icon">{category.icon}</div>
                <span className="category-label">{category.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className={`onboarding-content ${isAnimating ? 'animating' : ''}`}>
          <div className="content-header">
            <div className="breadcrumb">
              <span className="breadcrumb-category">{currentCategory.title}</span>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-section">{currentSection.title}</span>
            </div>
            <p className="section-description">{currentSection.description}</p>
          </div>

          <div className="section-wrapper">
            {renderSectionContent()}
          </div>

          {/* Section dots */}
          <div className="section-dots">
            {currentCategory.sections.map((_, index) => (
              <div 
                key={index}
                className={`section-dot ${index === activeSection ? 'active' : index < activeSection ? 'completed' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="onboarding-actions">
          <button
            className="action-button secondary"
            onClick={activeCategory === 0 && activeSection === 0 ? onSkip : handleBack}
          >
            {activeCategory === 0 && activeSection === 0 ? 'Skip for now' : 'Back'}
          </button>
          
          <button
            className="action-button primary"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {activeCategory === CATEGORIES.length - 1 && activeSection === currentCategory.sections.length - 1 
              ? 'Start Analysis' 
              : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}