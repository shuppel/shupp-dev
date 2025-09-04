import React from 'react';
import type { ValidationError } from '../../../lib/calculators/rentVsSell/validation';

interface ValidationWarningsProps {
  warnings: ValidationError[];
}

export default function ValidationWarnings({ warnings }: ValidationWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="validation-warnings">
      <div className="warnings-header">
        <span className="warning-icon">⚠️</span>
        <h4>Analysis Insights</h4>
      </div>
      <div className="warnings-content">
        {warnings.map((warning, index) => (
          <div key={index} className="warning-item">
            <span className="warning-bullet">•</span>
            <span className="warning-text">{warning.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}