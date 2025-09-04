import React, { useState, useRef, useEffect } from 'react';

interface LiquidSliderProps {
  id?: string;
  name?: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  tooltip?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export default function LiquidSlider({
  id,
  name,
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  tooltip,
  error,
  disabled = false,
  className = ''
}: LiquidSliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const sliderRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const percentage = ((localValue - min) / (max - min)) * 100;

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(event.target.value);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleTrackClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || disabled) return;

    const rect = trackRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const newValue = Math.round((percentage * (max - min) + min) / step) * step;
    const clampedValue = Math.max(min, Math.min(max, newValue));
    
    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  const handleMouseDown = () => {
    if (!disabled) setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchend', handleMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging]);

  return (
    <div className={`liquid-slider ${error ? 'has-error' : ''} ${className}`}>
      <div className="slider-header">
        <label htmlFor={id || name}>
          {label}
          {tooltip && <span className="tooltip" title={tooltip}>?</span>}
        </label>
        <div className="slider-value">
          <span className="value-text">{localValue}</span>
          {suffix && <span className="value-suffix">{suffix}</span>}
        </div>
      </div>

      <div className="slider-container" ref={sliderRef}>
        <div 
          className="slider-track" 
          ref={trackRef}
          onClick={handleTrackClick}
        >
          <div 
            className="slider-fill" 
            style={{ width: `${percentage}%` }}
          />
          <div 
            className={`slider-thumb ${isDragging ? 'dragging' : ''}`}
            style={{ left: `${percentage}%` }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
          >
            <div className="thumb-inner" />
          </div>
        </div>

        <input
          type="range"
          id={id || name}
          name={name}
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={handleSliderChange}
          disabled={disabled}
          className="slider-input"
          aria-label={label}
        />
      </div>

      <div className="slider-bounds">
        <span className="bound-min">{min}</span>
        <span className="bound-max">{max}{suffix && ` ${suffix}`}</span>
      </div>

      {error && <span className="error-message">{error}</span>}
    </div>
  );
}