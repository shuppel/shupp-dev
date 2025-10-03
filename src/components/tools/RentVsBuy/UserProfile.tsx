import React from 'react';
import './UserProfile.css';

export interface UserProfileData {
  filingStatus: 'single' | 'married' | null;
  currentHomeowner: boolean | null;
  sellingCurrentHome: boolean | null;
  marketOutlook: 'hot' | 'stable' | 'cooling' | null;
  investmentConfidence: 'conservative' | 'moderate' | 'aggressive' | null;
}

interface UserProfileProps {
  profile: UserProfileData;
  onChange: (profile: UserProfileData) => void;
}

interface ProfileCardProps {
  title: string;
  description: string;
  options: {
    id: string;
    label: string;
    icon: string;
    description?: string;
  }[];
  selected: string | null;
  onSelect: (value: string) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ title, description, options, selected, onSelect }) => {
  return (
    <div className="profile-card">
      <h4 className="profile-card-title">{title}</h4>
      <p className="profile-card-description">{description}</p>
      <div className="profile-options">
        {options.map(option => (
          <button
            key={option.id}
            className={`profile-option ${selected === option.id ? 'selected' : ''}`}
            onClick={() => onSelect(option.id)}
            aria-pressed={selected === option.id}
          >
            <span className="option-icon" role="img" aria-label={option.label}>
              {option.icon}
            </span>
            <span className="option-label">{option.label}</span>
            {option.description !== null && option.description !== undefined && (
              <span className="option-description">{option.description}</span>
            )}
            <div className="option-checkmark">
              {selected === option.id && '✓'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default function UserProfile({ profile, onChange }: UserProfileProps): React.JSX.Element {
  const updateProfile = <K extends keyof UserProfileData>(key: K, value: UserProfileData[K]): void => {
    onChange({
      ...profile,
      [key]: value
    });
  };

  return (
    <div className="user-profile-section">
      <div className="profile-header">
        <h3>Tell Us About Your Situation</h3>
        <p>Help us personalize your analysis by selecting the options that best describe you</p>
      </div>
      
      <div className="profile-cards-grid">
        <ProfileCard
          title="Filing Status"
          description="Your tax filing status affects deductions"
           options={[
             { id: 'single', label: 'Single', icon: 'Person', description: '$14,600 standard deduction' },
             { id: 'married', label: 'Married', icon: 'People', description: '$29,200 standard deduction' }
           ]}
          selected={profile.filingStatus}
          onSelect={(value) => updateProfile('filingStatus', value as 'single' | 'married')}
        />

        <ProfileCard
          title="Current Housing"
          description="Do you currently own a home?"
           options={[
             { id: 'yes', label: 'Homeowner', icon: 'Home', description: 'I own my current home' },
             { id: 'no', label: 'Renter', icon: 'Building', description: 'I currently rent' }
           ]}
          selected={profile.currentHomeowner === null ? null : profile.currentHomeowner ? 'yes' : 'no'}
          onSelect={(value) => updateProfile('currentHomeowner', value === 'yes')}
        />

          {profile.currentHomeowner === true && (
          <ProfileCard
            title="Selling Plans"
            description="Will you sell your current home?"
             options={[
               { id: 'yes', label: 'Selling', icon: 'Money', description: 'Proceeds for down payment' },
               { id: 'no', label: 'Keeping', icon: 'Key', description: 'Investment property' }
             ]}
            selected={profile.sellingCurrentHome === null ? null : profile.sellingCurrentHome ? 'yes' : 'no'}
            onSelect={(value) => updateProfile('sellingCurrentHome', value === 'yes')}
          />
        )}

        <ProfileCard
          title="Market Outlook"
          description="Your view on the housing market"
           options={[
             { id: 'hot', label: 'Hot Market', icon: 'Hot', description: 'Prices rising fast' },
             { id: 'stable', label: 'Stable', icon: 'Balance', description: 'Normal appreciation' },
             { id: 'cooling', label: 'Cooling', icon: 'Cool', description: 'Prices may decline' }
           ]}
          selected={profile.marketOutlook}
          onSelect={(value) => updateProfile('marketOutlook', value as 'hot' | 'stable' | 'cooling')}
        />

        <ProfileCard
          title="Investment Style"
          description="If you rent, how would you invest?"
           options={[
             { id: 'conservative', label: 'Conservative', icon: 'Shield', description: '4-5% returns' },
             { id: 'moderate', label: 'Moderate', icon: 'Chart', description: '7-8% returns' },
             { id: 'aggressive', label: 'Aggressive', icon: 'Rocket', description: '10%+ returns' }
           ]}
          selected={profile.investmentConfidence}
          onSelect={(value) => updateProfile('investmentConfidence', value as 'conservative' | 'moderate' | 'aggressive')}
        />
      </div>

      <div className="profile-insights">
        <h4>How This Affects Your Analysis</h4>
        <ul className="insights-list">
          {profile.filingStatus && (
            <li>
               <span className="insight-icon">List</span>
              Your {profile.filingStatus === 'married' ? 'married' : 'single'} filing status affects tax deductions
            </li>
          )}
          {profile.currentHomeowner !== null && (
            <li>
               <span className="insight-icon">Home</span>
              {profile.currentHomeowner 
                ? 'As a current homeowner, you may have equity to leverage'
                : 'First-time buyer programs may be available to you'}
            </li>
          )}
          {profile.marketOutlook && (
            <li>
               <span className="insight-icon">Trend</span>
              {profile.marketOutlook === 'hot' && 'Hot markets favor buying sooner to lock in prices'}
              {profile.marketOutlook === 'stable' && 'Stable markets provide predictable appreciation'}
              {profile.marketOutlook === 'cooling' && 'Cooling markets may offer better buying opportunities later'}
            </li>
          )}
          {profile.investmentConfidence && (
            <li>
               <span className="insight-icon">Briefcase</span>
              Your {profile.investmentConfidence} investment approach impacts opportunity cost calculations
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}