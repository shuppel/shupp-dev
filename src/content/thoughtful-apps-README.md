# Thoughtful App Co. Content Guide

This directory contains all the app concepts for the Thoughtful App Co. section of the website.

## Creating a New App Concept

1. Create a new `.md` file in this directory with a descriptive slug (e.g., `local-first-notes.md`)
2. Use the following frontmatter template:

```yaml
---
title: "App Name"
oneLiner: "Catchy description in <15 words"
status: "concept" # Options: concept, exploring, prototyping, shelved
category: "Category Name" # e.g., Productivity, Social, Finance, etc.
problem: "2-3 sentences describing the problem this app solves"
mainMockup: "https://www.tldraw.com/s/your-mockup-id" # Optional TLDraw embed URL
features:
  - name: "Feature Name"
    what: "Description of what this feature does"
    why: "Why this feature provides value to users"
    mockup: "https://www.tldraw.com/s/feature-mockup" # Optional
  - name: "Another Feature"
    what: "Description"
    why: "Value proposition"
userJourney:
  - "Step 1: User discovers [trigger]"
  - "Step 2: Opens app and [action]"
  - "Step 3: [Core interaction]"
  - "Step 4: [Value delivered]"
  - "Step 5: [Retention hook]"
technicalArchitecture:
  frontend: "Framework choice + why"
  backend: "Services needed"
  data: "Storage approach"
  apis:
    - "API 1"
    - "API 2"
  hosting: "Platform reasoning"
moonshotFeatures:
  - "Wild feature 1"
  - "Wild feature 2"
  - "Wild feature 3"
marketResearch:
  similarTo: ["App 1", "App 2"]
  differentBecause: "Key differentiation"
  targetUsers: "Specific persona"
openQuestions:
  - "Question 1?"
  - "Question 2?"
  - "Question 3?"
resources: # Optional
  - title: "Resource Title"
    url: "https://example.com"
lastUpdated: 2025-01-15 # YYYY-MM-DD format
feasibility: 4 # 1-5 stars
excitement: 5 # 1-5 stars
voteCount: 0 # Will be updated dynamically
---

# App Name

Optional markdown content for additional details.
```

## Status Definitions

- **🔵 Concept**: Just an idea, not actively being worked on
- **🟡 Exploring**: Researching feasibility and technical approach
- **🟢 Prototyping**: Actively building a proof of concept
- **⚫ Shelved**: No longer pursuing (but keeping for reference)

## Creating TLDraw Mockups

1. Go to [tldraw.com](https://www.tldraw.com)
2. Create your mockup
3. Click Share → Get Link
4. Use the share URL in the `mainMockup` or feature `mockup` fields

## Engagement Features

Each app page includes:
- **Voting**: Users can vote once per app (stored in localStorage, will upgrade to Lyket)
- **Comments**: GitHub-based discussions via Giscus
- **Email Capture**: "Notify me if built" feature
- **Price Sensitivity**: Users can indicate willingness to pay

## Configuration

To enable Giscus comments:
1. Update `src/components/GiscusComments.astro` with your GitHub repo details
2. Follow the [Giscus setup guide](https://giscus.app/)

To enable Lyket voting:
1. Sign up at [lyket.dev](https://lyket.dev)
2. Update the API key in `src/components/LyketVote.astro`

## Best Practices

1. **Be Specific**: Clearly define the problem and target audience
2. **Think Feasibility**: Be realistic about technical requirements
3. **User-Focused**: Always explain the "why" behind features
4. **Visual Mockups**: Include TLDraw mockups to make ideas tangible
5. **Open Questions**: Document unknowns and challenges
6. **Market Research**: Show you understand the competitive landscape