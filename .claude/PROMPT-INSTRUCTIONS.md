# Project-Specific Instructions for AI Assistants

## Project Context
This is an Astro-based portfolio and tools website that integrates React components for interactive tools. The project uses Astro as the main framework with React for dynamic components.

## Critical Development Guidelines

### 1. Astro + React Integration

**IMPORTANT**: This project uses Astro's specific patterns for integrating React components. DO NOT use vanilla React mounting approaches.

#### ✅ CORRECT Approach:
```astro
---
// Import React components in Astro frontmatter
import MyComponent from './MyComponent.tsx';
---

<!-- Use Astro's client directives -->
<MyComponent client:load />
```

#### ❌ INCORRECT Approach:
```javascript
// DO NOT use dynamic imports in browser scripts
await import('./Component.tsx');

// DO NOT manually mount React components
ReactDOM.createRoot(container).render(...);
```

### 2. React Component Requirements

- **Always import React**: Even with React 17+, explicitly import React in all TSX files:
  ```tsx
  import React from 'react';  // Required for Vite/Astro processing
  ```

- **Return type annotations**: Use explicit return types for components:
  ```tsx
  export default function MyComponent(): React.JSX.Element {
    return <div>...</div>;
  }
  ```

### 3. File Organization

- `/src/pages/` - Astro pages (`.astro` files)
- `/src/components/` - Mixed Astro and React components
  - `.astro` files for static/layout components
  - `.tsx` files for interactive React components
- `/src/layouts/` - Astro layout components
- `/src/content/` - Content collections (Markdown/MDX)

### 4. Adding New Interactive Tools

When adding new calculator or interactive tools:

1. Create the React component in `/src/components/tools/ToolName/`
2. Create an Astro wrapper in `/src/components/tools/ToolName.astro`
3. Import and use the React component with client directives
4. Add content entry in `/src/content/tools/`
5. The tool page will automatically load via the dynamic route

Example structure:
```
src/components/tools/
├── NewTool.astro          # Astro wrapper
└── NewTool/
    ├── Calculator.tsx      # Main React component
    ├── InputForm.tsx       # Sub-components
    └── styles.css          # Tool-specific styles
```

### 5. Framework Integration Checklist

Before implementing React components in this Astro project:

- [ ] Is the component imported in Astro frontmatter (between `---`)?
- [ ] Are you using Astro's client directives (`client:load`, `client:idle`, etc.)?
- [ ] Does every TSX file have `import React from 'react';` at the top?
- [ ] Are you avoiding dynamic imports of TSX files in browser scripts?
- [ ] Is the component pure React without manual DOM mounting?

### 6. Debugging Integration Issues

If you encounter React/Astro integration errors:

1. **Check error location**: Is it during build or in the browser?
2. **Verify imports**: Ensure React is imported in all TSX files
3. **Test minimal component**: Create a simple test component to isolate the issue
4. **Check client directives**: Ensure components use proper hydration directives
5. **Review Vite output**: Look for transformation errors in the terminal

### 7. Common Pitfalls to Avoid

- **Don't** use `document.getElementById` to mount React components
- **Don't** dynamically import TSX files in client-side scripts
- **Don't** mix Astro and React rendering logic
- **Don't** forget React imports even if they seem unnecessary
- **Don't** use React hooks in Astro components

### 8. Best Practices

- Keep React components focused on interactivity
- Use Astro components for static content and layouts
- Leverage Astro's built-in optimizations (partial hydration)
- Use TypeScript for better type safety
- Test components in isolation before integration

### 9. Performance Considerations

- Use `client:idle` for below-the-fold components
- Use `client:visible` for components that may not be viewed
- Use `client:load` only for immediately interactive components
- Consider `client:only="react"` for components that don't need SSR

### 10. Project-Specific Patterns

- All tool components should follow the existing Calculator pattern
- Use the shared components in `/src/components/tools/shared/`
- Follow the existing CSS variable system for theming
- Maintain consistency with existing TypeScript types

## Summary

When working on this project, always remember:
1. **Astro handles the integration** - don't fight the framework
2. **React components are guests** - they live within Astro's rules
3. **Build-time vs runtime** - imports happen at build, not in the browser
4. **Explicit is better** - always import React, always use types