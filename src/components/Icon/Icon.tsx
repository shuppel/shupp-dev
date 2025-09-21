import React, { useEffect, useRef, useState } from 'react';
import * as Phosphor from '@phosphor-icons/react';
import type { IconWeight } from '@phosphor-icons/react';
import './Icon.css';

interface IconProps {
  name: keyof typeof Phosphor;
  size?: number;
  color?: string;
  weight?: IconWeight;
  className?: string;
  liquid?: boolean;
  animate?: boolean;
  inkEffect?: 'light' | 'medium' | 'heavy';
  style?: React.CSSProperties;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  weight = 'regular',
  className = '',
  liquid = false,
  animate = false,
  inkEffect = 'medium',
  style = {}
}) => {
  const IconComponent = Phosphor[name] as React.ComponentType<any>;
  const [isHovered, setIsHovered] = useState(false);
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (liquid && animate && iconRef.current) {
      // Add subtle animation on mount
      iconRef.current.classList.add('icon-liquid-intro');
      setTimeout(() => {
        iconRef.current?.classList.remove('icon-liquid-intro');
      }, 1000);
    }
  }, [liquid, animate]);

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in Phosphor icons`);
    return null;
  }

  const iconClasses = [
    'phosphor-icon',
    liquid ? `icon-liquid icon-liquid-${inkEffect}` : '',
    animate ? 'icon-animate' : '',
    isHovered ? 'icon-hovered' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={iconRef}
      className={iconClasses}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ display: 'inline-flex', alignItems: 'center', ...style }}
    >
      <IconComponent
        size={size}
        color={color}
        weight={weight}
      />
    </div>
  );
};

// Liquid SVG Filter Component
export const LiquidSVGFilters: React.FC = () => {
  return (
    <svg style={{ position: 'absolute', width: 0, height: 0 }}>
      <defs>
        {/* Light Ink Effect */}
        <filter id="liquid-filter-light">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.02"
            numOctaves="3"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="2"
          />
          <feGaussianBlur stdDeviation="0.5" />
        </filter>

        {/* Medium Ink Effect */}
        <filter id="liquid-filter-medium">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.015"
            numOctaves="2"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="3"
          />
          <feGaussianBlur stdDeviation="0.3" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="1 1" />
          </feComponentTransfer>
        </filter>

        {/* Heavy Ink Effect */}
        <filter id="liquid-filter-heavy">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.03"
            numOctaves="4"
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="5"
          />
          <feGaussianBlur stdDeviation="0.8" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="1 1" />
          </feComponentTransfer>
        </filter>

        {/* Animated Liquid Effect */}
        <filter id="liquid-filter-animated">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.01"
            numOctaves="2"
            result="turbulence"
          >
            <animate
              attributeName="baseFrequency"
              from="0.01"
              to="0.02"
              dur="3s"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="4"
          >
            <animate
              attributeName="scale"
              from="3"
              to="5"
              dur="2s"
              repeatCount="indefinite"
            />
          </feDisplacementMap>
        </filter>

        {/* Ink Spread Effect */}
        <filter id="ink-spread">
          <feMorphology operator="dilate" radius="1" />
          <feGaussianBlur stdDeviation="1.5" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.2 0.5 0.8 0.9 1" />
          </feComponentTransfer>
          <feComposite operator="over" in="SourceGraphic" />
        </filter>
      </defs>
    </svg>
  );
};