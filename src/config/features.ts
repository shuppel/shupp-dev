// Feature flags configuration
export const features = {
  // Enable/disable TLDraw mockup embeds
  // When false, mockup sections are completely hidden
  // Can be overridden by ENABLE_TLDRAW environment variable
  enableTLDraw: import.meta.env.ENABLE_TLDRAW === 'true' || false,
  
  // Other feature flags can be added here
} as const;

// Type-safe feature flag checker
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature];
}