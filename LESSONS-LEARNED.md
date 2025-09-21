# Lessons Learned

## Astro + React Integration Issues (September 20, 2025)

### Problem: "@vitejs/plugin-react can't detect preamble" Error

**Issue Description:**
React components were failing to load with the error "@vitejs/plugin-react can't detect preamble. Something is wrong." when trying to dynamically import them in the browser.

**Root Cause:**
The code was attempting to use runtime dynamic imports (`await import()`) in browser scripts to load TSX files directly. This bypasses Vite's build pipeline, preventing the React plugin from transforming JSX/TypeScript code.

**Wrong Approach:**
```javascript
// In browser script - DOESN'T WORK
document.addEventListener('DOMContentLoaded', async () => {
  const { mount } = await import('./RentVsBuy/mount');
  mount();
});
```

**Correct Approach:**
```astro
---
// Import at build time in Astro frontmatter
import Calculator from './RentVsBuy/Calculator.tsx';
---

<!-- Use Astro's client directives for hydration -->
<Calculator client:load />
```

### Key Learnings

1. **Framework-Specific Patterns Matter**: Astro has its own way of handling React components that differs from vanilla React apps. Always use Astro's patterns when working within an Astro project.

2. **Build-Time vs Runtime Imports**: 
   - Build-time imports (in Astro frontmatter) get processed by Vite and its plugins
   - Runtime imports (in browser scripts) bypass the build pipeline and fail with TSX/JSX files

3. **Client Directives are Essential**: Use Astro's client directives (`client:load`, `client:idle`, `client:visible`) to control component hydration instead of manual mounting.

4. **React Import Requirements**: Even with React 17+ automatic JSX transform, when using certain Vite configurations, you may need to explicitly import React in TSX files.

## General Astro Development Principles

### 1. Component Integration
- Always import framework components (React, Vue, Svelte) in the Astro frontmatter section
- Use appropriate client directives for hydration
- Don't try to manually mount components with framework-specific code

### 2. File Structure
- `.astro` files are for Astro components and pages
- `.tsx`/`.jsx` files are for React components
- Keep framework components pure - let Astro handle the integration

### 3. Debugging Approach
When encountering framework integration issues:
1. Check if components are being imported correctly in Astro frontmatter
2. Verify client directives are being used
3. Ensure React (or other framework) imports are present in component files
4. Look for runtime vs build-time import mismatches
5. Check that the astro.config.mjs has the correct integrations configured

### 4. Testing Strategy
Always create a minimal test component when debugging integration issues:
```tsx
// TestComponent.tsx
import React from 'react';

export default function TestComponent() {
  return <div>If you see this, React is working!</div>;
}
```

```astro
---
// TestPage.astro
import TestComponent from './TestComponent.tsx';
---

<TestComponent client:load />
```

This helps isolate whether the issue is with the integration setup or the specific component code.

### Phosphor Icon Component Fix (September 20, 2025)

**Problem:** Phosphor icons were not rendering in Astro components despite being properly imported and configured.

**Root Cause:** The Icon component was using a complex hybrid approach of server-side rendering with client-side React mounting, which was unreliable and prone to timing issues.

**Wrong Approach:**
```astro
---
// Server-side rendering with data attributes
---

<div class="phosphor-icon-wrapper" data-icon="Brain">
  <span class="icon-placeholder"></span>
</div>

<script>
// Complex client-side mounting logic
document.addEventListener('DOMContentLoaded', () => {
  // Mount React components manually
  const wrappers = document.querySelectorAll('.phosphor-icon-wrapper');
  wrappers.forEach(wrapper => {
    const root = ReactDOM.createRoot(wrapper);
    root.render(React.createElement(Icon, props));
  });
});
</script>
```

**Correct Approach:**
```astro
---
'client:load'; // Make it a proper client component

import { Icon } from './Icon';
---

<Icon name="Brain" size={20} weight="duotone" />
```

**Key Learnings:**

1. **Simple is Better**: Don't over-engineer component integration. Use Astro's built-in client directives instead of manual mounting.

2. **Client Components for React**: When a component needs to render React components, make it a client component with `'client:load'` rather than trying to mix server and client rendering.

3. **Avoid Complex Mounting Logic**: Astro handles component hydration automatically. Manual DOM manipulation and React mounting is error-prone and unnecessary.

4. **Framework Integration Patterns**: Each framework integration (React, Vue, etc.) has its own best practices in Astro. Follow them consistently.

## Future Considerations

- When adding new tools or components, always follow Astro's integration patterns
- Document any framework-specific requirements in component files
- Consider creating a component template that follows best practices
- Regularly update dependencies but test framework integrations after updates