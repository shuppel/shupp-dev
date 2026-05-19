---
title: "Brain Gate"
oneLiner: "Browser extension that blocks distractions with progressive friction and puzzle challenges"
status: "prototyping"
category: "Productivity"
githubUrl: "https://github.com/shuppel/brain-gate"
problem: "Absolute site blocking leads to workarounds and resentment. People need friction that encourages reflection, not locks they eventually remove. Impulsive browsing habits are hard to break without creating space for mindful choices."
mainMockup: ""
features:
  - name: "Progressive Friction"
    what: "Creates increasing resistance to distraction access, not absolute blocks"
    why: "Encourages self-awareness and intentional decisions instead of rebellion"
  - name: "Puzzle Challenges"
    what: "Arithmetic and trivia questions to solve before accessing blocked sites"
    why: "Engages prefrontal cortex, creates pause between impulse and action"
  - name: "Three Blocking Categories"
    what: "Pornography (max friction), Social Media (short bursts), Entertainment (episode-based)"
    why: "Different content requires different approaches to access control"
  - name: "Timed Access Windows"
    what: "Unlock sites for 5-60 minutes with mandatory breaks between sessions"
    why: "Prevents binge behavior while allowing intentional use"
  - name: "TACo Integration"
    what: "Cloud sync, premium features, and subscription management via TACo account"
    why: "Unified ecosystem with other TACo productivity tools"
  - name: "Deletion Code System"
    what: "50-character code required to change settings or uninstall"
    why: "Maximum friction for changing core protection - must be manually typed"
userJourney:
  - "User installs extension and completes onboarding"
  - "Selects categories to block and difficulty level"
  - "Tries to access blocked site"
  - "Puzzle challenge appears - must solve to unlock"
  - "Gets limited time access window"
  - "Break timer prevents immediate re-access"
  - "Usage stats help identify patterns"
technicalArchitecture:
  frontend: "TypeScript browser extension with custom UI"
  backend: "TACo API for sync, Cloudflare Workers for deletion codes"
  data: "Browser localStorage (local-first), optional TACo cloud sync"
  apis:
    - "TACo Auth API for account connection"
    - "TACo Sync API for settings sync"
    - "Stripe for subscriptions"
  hosting: "Chrome Web Store, Firefox Add-ons, TACo servers"
moonshotFeatures:
  - "AI-generated personalized trivia based on learning goals"
  - "Biometric integration (heart rate, focus level)"
  - "Network-level blocking for mobile devices"
  - "Family/accountability partner features"
  - "Integration with therapy/recovery apps"
marketResearch:
  similarTo: ["Cold Turkey", "Freedom", "BlockSite", "LeechBlock"]
  differentBecause: "Progressive friction instead of absolute blocking; educational puzzles; TACo ecosystem integration"
  targetUsers: "People seeking recovery from porn addiction, social media overuse, or building better digital habits"
openQuestions:
  - "How to balance friction with accessibility needs?"
  - "Should puzzles be customizable (e.g., language learning)?"
  - "Mobile browser support feasibility?"
resources:
  - title: "Research on Psychological Reactance"
    url: "https://en.wikipedia.org/wiki/Reactance_(psychology)"
  - title: "Friction Design in Behavior Change"
    url: "https://behavioralscientist.org/friction/"
lastUpdated: 2026-02-27
feasibility: 4
excitement: 5
seriousness: 5
voteCount: 0
---

# Brain Gate

Block distractions with progressive friction. Solve puzzles for mindful access instead of impulsive browsing.

## The Problem

Traditional site blockers fail because they treat users as adversaries. Absolute blocks lead to:
- Finding workarounds (VPNs, other browsers, mobile)
- Resentment and rebellion
- No development of genuine self-control

## The Solution

Brain Gate creates **friction, not walls**. Instead of blocking sites completely, it requires you to solve puzzles before accessing them. This:
- Creates a pause between impulse and action
- Engages your decision-making brain (prefrontal cortex)
- Makes you consciously choose whether you really want to proceed
- Turns distraction time into learning opportunities

## How It Works

1. **Choose what to block**: Pornography (maximum friction), Social Media (short bursts), Entertainment (episode-based)
2. **Set your difficulty**: Easy, Medium, Hard, or Impossible
3. **Try to access a blocked site**: Puzzle challenge appears
4. **Solve puzzles**: Arithmetic + trivia questions
5. **Get limited access**: 5-60 minutes depending on category
6. **Take a break**: Mandatory cool-down before next unlock

## Pricing

- **$3/month** or **$28/year** standalone
- **FREE** with TACo Club or Lifetime membership

## Status

Currently in **Alpha** testing. Available for Chrome and Firefox.

[Download from TACo →](https://app.thoughtfulapp.co/braingate)
