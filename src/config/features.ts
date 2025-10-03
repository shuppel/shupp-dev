// Feature flags configuration
export const features = {
  // Enable/disable TLDraw mockup embeds
  // When false, mockup sections are completely hidden
  // Can be overridden by ENABLE_TLDRAW environment variable
  enableTLDraw: import.meta.env.ENABLE_TLDRAW === 'true' || false,
  
  // Enable fullscreen mode for calculators on larger viewports
  // When false, fullscreen button is hidden on mobile/tablet
  enableCalculatorFullscreen: {
    mobile: false,      // < 768px
    tablet: true,       // 768px - 1024px  
    desktop: true       // > 1024px
  },
  
  // Responsive design breakpoints (in pixels)
  breakpoints: {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  }
} as const;

// Type-safe feature flag checker
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  const value = features[feature];
  if (typeof value === 'boolean') {
    return value;
  }
  // For complex feature objects, return true if they exist
  return value !== undefined && value !== null;
}

// Check if fullscreen is enabled for current viewport
export function isFullscreenEnabledForViewport(width: number): boolean {
  const config = features.enableCalculatorFullscreen;
  const breakpoints = features.breakpoints;
  
  if (width < breakpoints.mobile) {
    return config.mobile;
  } else if (width < breakpoints.tablet) {
    return config.tablet;
  } else {
    return config.desktop;
  }
}