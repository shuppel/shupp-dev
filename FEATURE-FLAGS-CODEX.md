# Feature Flags Codex - Standard Code Practice

## Overview
Feature flags are a critical part of our development workflow, enabling controlled rollouts, A/B testing, and safe deployment of new features. This document defines our standard practices for implementing and managing feature flags that all code (human and AI-generated) must follow.

## Core Principles

1. **Progressive Disclosure**: Features should be toggleable without code changes
2. **Type Safety**: All feature flags must be strongly typed in TypeScript
3. **Environment Aware**: Flags can be overridden via environment variables
4. **Centralized Management**: All flags defined in a single source of truth
5. **Clean Removal**: Feature flags should be temporary and removed when stable

## Implementation Standards

### 1. Central Configuration
All feature flags MUST be defined in `/src/config/features.ts`:

```typescript
// src/config/features.ts
export const features = {
  // Feature flag naming convention: camelCase, descriptive
  enableNewCalculator: import.meta.env.ENABLE_NEW_CALCULATOR === 'true' || false,
  showBetaFeatures: import.meta.env.SHOW_BETA_FEATURES === 'true' || false,
  useOptimizedImages: import.meta.env.USE_OPTIMIZED_IMAGES === 'true' || true, // default true
} as const;

// Type-safe feature flag checker
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature];
}
```

### 2. Naming Conventions

Feature flags should follow these naming patterns:
- `enable[Feature]` - For enabling/disabling features
- `show[Feature]` - For UI visibility toggles
- `use[Feature]` - For switching between implementations
- `allow[Feature]` - For permission-based features
- `is[Feature]Enabled` - For checking feature state

Environment variables should be SCREAMING_SNAKE_CASE:
- `ENABLE_NEW_CALCULATOR`
- `SHOW_BETA_FEATURES`
- `USE_OPTIMIZED_IMAGES`

### 3. Usage in Components

#### React/TSX Components
```typescript
import { isFeatureEnabled } from '@/config/features';

export function MyComponent() {
  if (!isFeatureEnabled('enableNewCalculator')) {
    return <LegacyCalculator />;
  }
  
  return <NewCalculator />;
}
```

#### Astro Components
```astro
---
import { isFeatureEnabled } from '@/config/features';
const showBeta = isFeatureEnabled('showBetaFeatures');
---

{showBeta && (
  <div class="beta-feature">
    <!-- Beta content -->
  </div>
)}
```

### 4. Feature Flag Categories

#### Development Flags
Temporary flags for in-development features:
```typescript
enableExperimentalApi: process.env.NODE_ENV === 'development' || false,
debugMode: import.meta.env.DEBUG === 'true' || false,
```

#### Release Flags
For gradual rollouts:
```typescript
enableNewOnboarding: import.meta.env.ENABLE_NEW_ONBOARDING === 'true' || false,
useV2Algorithm: import.meta.env.USE_V2_ALGORITHM === 'true' || false,
```

#### Ops Flags
For operational control:
```typescript
enableMaintenanceMode: import.meta.env.MAINTENANCE_MODE === 'true' || false,
rateLimitingEnabled: import.meta.env.RATE_LIMITING === 'true' || true,
```

#### Permission Flags
For feature access control:
```typescript
allowPremiumFeatures: import.meta.env.ALLOW_PREMIUM === 'true' || false,
enableAdminTools: import.meta.env.ENABLE_ADMIN === 'true' || false,
```

### 5. Environment Configuration

#### Development (.env.development)
```env
ENABLE_TLDRAW=true
SHOW_BETA_FEATURES=true
DEBUG_MODE=true
```

#### Production (.env.production)
```env
ENABLE_TLDRAW=false
SHOW_BETA_FEATURES=false
DEBUG_MODE=false
```

### 6. Testing with Feature Flags

```typescript
// In tests
describe('Calculator', () => {
  beforeEach(() => {
    // Mock feature flags
    vi.mock('@/config/features', () => ({
      isFeatureEnabled: (flag: string) => flag === 'enableNewCalculator'
    }));
  });
  
  it('should use new calculator when flag is enabled', () => {
    // Test implementation
  });
});
```

### 7. Documentation Requirements

Every feature flag MUST include:
```typescript
export const features = {
  /**
   * Enables the new calculator with advanced tax calculations
   * @deprecated Remove after 2025-02-01 when fully rolled out
   * @jira PROJ-1234
   */
  enableNewCalculator: import.meta.env.ENABLE_NEW_CALCULATOR === 'true' || false,
} as const;
```

### 8. Cleanup Process

Feature flags should be removed when:
1. Feature is fully rolled out and stable (typically 2-4 weeks)
2. Feature is deprecated and removed
3. A/B test is complete and winner is chosen

Mark flags for removal with `@deprecated` comment including removal date.

### 9. Anti-Patterns to Avoid

❌ **Don't hardcode flag checks:**
```typescript
// BAD
if (import.meta.env.ENABLE_FEATURE === 'true') { }
```

❌ **Don't create inline flags:**
```typescript
// BAD
const SHOW_FEATURE = true;
```

❌ **Don't nest feature flags:**
```typescript
// BAD
if (isFeatureEnabled('feature1') && isFeatureEnabled('feature2')) { }
```

❌ **Don't use magic strings:**
```typescript
// BAD
if (features['enableNewCalculator']) { }
```

### 10. Best Practices Checklist

When implementing a new feature flag:

- [ ] Add to `/src/config/features.ts`
- [ ] Add corresponding environment variable to `.env.example`
- [ ] Document the flag with JSDoc comments
- [ ] Include deprecation date if temporary
- [ ] Add to CLAUDE.xml if it affects architecture
- [ ] Use type-safe `isFeatureEnabled()` function
- [ ] Test both enabled and disabled states
- [ ] Plan for flag removal

## Examples in Current Codebase

### Example 1: TLDraw Integration
```typescript
// src/config/features.ts
enableTLDraw: import.meta.env.ENABLE_TLDRAW === 'true' || false,

// Usage in component
{isFeatureEnabled('enableTLDraw') && <TLDrawEmbed />}
```

### Example 2: Calculator Version Toggle
```typescript
// When adding a new calculator version
export const features = {
  useV2RentCalculator: import.meta.env.USE_V2_RENT_CALC === 'true' || false,
};

// In the calculator component
const Calculator = isFeatureEnabled('useV2RentCalculator') 
  ? CalculatorV2 
  : CalculatorV1;
```

## Integration with CI/CD

Feature flags should be validated in CI:
```yaml
# In CI pipeline
- name: Validate Feature Flags
  run: |
    npm run typecheck
    npm run lint
```

## Monitoring and Analytics

Track feature flag usage:
```typescript
// When feature is accessed
if (isFeatureEnabled('newFeature')) {
  // Track analytics event
  trackEvent('feature_flag_used', { flag: 'newFeature' });
}
```

## For AI/LLM Code Generation

When generating code that implements new features:

1. **Always check** if a feature should be behind a flag
2. **Add the flag** to `/src/config/features.ts` first
3. **Use the type-safe** `isFeatureEnabled()` function
4. **Document** the flag's purpose and removal date
5. **Test both states** of the flag
6. **Never hardcode** feature availability

### Template for New Features
```typescript
// 1. Add to features.ts
export const features = {
  /**
   * [Description of what this enables]
   * @deprecated Remove after [date] when fully rolled out
   */
  enableYourFeature: import.meta.env.ENABLE_YOUR_FEATURE === 'true' || false,
};

// 2. Use in component
import { isFeatureEnabled } from '@/config/features';

if (isFeatureEnabled('enableYourFeature')) {
  // New feature code
} else {
  // Fallback or legacy code
}
```

## Questions for Implementation

Before implementing any feature, ask:
1. Should this be behind a feature flag?
2. Is this a permanent or temporary flag?
3. What's the rollback strategy?
4. When should this flag be removed?
5. How will we measure success?

---

**Remember**: Feature flags are not permanent. They are a deployment and risk management strategy. Plan for their removal from day one.