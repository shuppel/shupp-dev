---
title: "Supabase Select SF: Product Philosophy, LLMs, and Building at Y Combinator"
description: "Notes and insights from Supabase Select at Y Combinator, featuring the Figma CEO's product philosophy, Guillermo Rauch's comprehensive vision, and the future of multi-modal applications."
pubDate: 2025-10-03
author: "E L Shupp"
categories: ["Product Management", "Startup", "Technology"]
tags: ["Supabase", "Y Combinator", "Product Design", "LLMs", "Local-First", "Multi-Modal", "Vercel"]
readTime: "12 min read"
featuredImage: "supabase-select-2025"
featured: true
relatedProjects: ["thoughtful-app-co"]
---

*As I write this under a super moon, the weather in DC finally mimicking the cool Bay Area weather...*

## First Takes: Returning to San Francisco

I hadn't been to SF since 2017, for my uncle's wedding. There's an energy there I hadn't experienced before. I understand why people gravitate to that place, I can see why Tom Blomfield said this is the place to do it. The question is: where do people start getting eaten alive by it? There's a bit too much apperceptive self back-patting and big energy around solving menial problems for billions. It's odd. I liked the European founders and small company guys—we talked all things philosophy.

### Y Combinator: First Impressions

Y Combinator is pretty cool—it's the SF crowd, the for-profit side, a bit of another side of the tech coin from the local-first crowd in Berlin. Both sides of that coin are more exciting than the IT crowd in DC (ooph). It's tough to do the for-pay fixed firm development as opposed to the exciting commercial outfit. 

The less palpable energy was the ego from moderately aged developers. Even if they had exited, some seemed a bit wrapped up in the nuance of the founder build. The 9-9-6 lock-in tech bro mentality (9am to 9pm, 6 days a week)—if you want to get through life quickly, I guess that's one way to do it.

## The Talks: Product Philosophy from the Giants

### Figma CEO: Building for the Long Game

The Figma CEO's talk stood out. When asked about PRDs, his response was nuanced—be intentional about customer requirements while maintaining velocity: prototype → validate → get user feedback. 

I didn't ask this question out loud, but I thought it: Even though he said "don't do my model," I think this is exactly the model being chosen—build quality, build great, ship once and then iterate. Figma took 3 years to develop their core engine. Linear took 1.5 years. The message: solid foundations matter.

Key insights from Figma:
- "Design is now going to be the differentiator as far as craft because of designer founders"
- Think about primitives and data models, not just augmenting LLM coding without thinking about fundamentals
- Local-first architecture with CRDTs, sync engines, and game state management
- Developer-Designer LLMs creating iterative loops where roles blur

When I asked about their local-first approach: *"I went to local-first talks and many speakers discussed what Figma does with game state, sync engines, and CRDTs in a collaborative way. Does Figma's product vision lean on these principles? What focuses have you chosen through the local-first lens?"*

The answer emphasized thinking about primitives and the data model from day one.

### Guillermo Rauch (Vercel): The Full Stack Vision

Guillermo Rauch's talk was comprehensive, covering everything from platform philosophy to founder mentalities. His insights spanned multiple domains:

**On Building Products:**
- Open source as a core strategy ("Open source good")
- DX (Developer Experience) as both UI and workflow—"not a one-time, one-shot thing"
- Day Zero: The product thinking before you code
- Day One: Customer capture without feature bloat
- Day Two: Amazon-inspired urgency at any scale

**On Founder Mentalities:**
- **The Trinity**: Intelligence, Grindset (Grit), Integrity
- **"Ship fast, high quality, simplified"**—all three, no compromises
- **"The founder having the fear of God"**—healthy paranoia
- **"You have to think that the product is going to break"**—live the reality
- **"You think you can achieve a level of disbelief"**—push beyond reasonable limits

**On Technical Architecture:**
- Event-driven design: "things that happen"
- Pixels and Tokens—"The amount of tokens flowing through your platform"
- Progressive Disclosure of Complexity
- The Duckling Syndrome—first impressions stick (it's an investment)
- Workflow/Orchestration with durable workflow engines
- Building for resumable interruptions

**On Product Evolution:**
The Borges reference (Argentinian author obsessed with English) connecting to: "Products evolve through mapping and reducing. Mapping and reducing."

"When you launch a bunch of things, you need to make sure they land. That they are excellent."

## The People: Founders and Philosophers

Met two Belgian founders who brought European perspectives on privacy and market dynamics. Unlike the typical pitch deck conversations, we talked philosophy. There was also time with my uncle—grounding in a room full of world-changing ambitions.

The mix was fascinating:
- Small company founders thinking big but staying grounded
- Exited founders still wrapped up in founder identity
- International perspectives challenging Silicon Valley orthodoxy
- The contrast between Berlin's local-first crowd and SF's for-profit focus

## The Ideas: Soft Pitching Thoughtful Apps and Market Feedback

I soft pitched several ideas from Thoughtful Apps and got some interesting feedback from the crowd. The response was overwhelmingly positive, but the insights were even more valuable.

### The Open Source Monetization Question

One recurring theme was figuring out how to incentivize open source—someone brought up the Postgres story for dev tools as a model. The funny thing is we could open source the free version of our apps, but things on Android/Apple platforms could be harder due to store restrictions and distribution challenges.

### Technical Implementation Insights

The feedback on implementation was particularly useful:
- **Being connected**: Implementing some form of host sync
- **Monetization stages**: These technical decisions (open source vs. proprietary, sync capabilities) are what set the monetization stages

### The Multi-Modal Vision That Resonated

My core thesis got surprising traction:

**Core Concept:** Treat your phone as your server. Use wearables (bands, pendants, earrings) like Whoop to maintain connection without screen addiction.

"Trade digital experiences for the real thing, use other means of haptic, visual and audio modals to change previous user interactions."

**Multi-Modal Design Principles:**
- Create new user experiences—flip the script on phone interaction
- Physical over digital—quarterly mailed reports instead of app checking
- Omnichannel thinking—beyond the single application instance

**Interaction Modalities:**
- **Sound as emotional trigger**—tie audio to user reactions
- **Voice as catalyst**—"The essence of human thought, the quickest avenue for uncurated thought"
- **Calibrated annoyance**—users set their tolerance "up to a little annoyed"

**Technical Architecture:**
- Subprocesses and tokens first, less on pixels
- Phone as server and config, wearables as the application
- Minimal visual, settings-first design
- Direct-to-computer interactions over typed input

**Core Product Principles:**
1. **Principles Remain as Features are Hidden**—custom configs maintain purpose
2. **Sync with Devices**—smart wearable utilization
3. **First Law Optimization UI**—direct-to-computer interactions
4. **Self Privacy**—users control their own preferences

### The Ideas-First Approach

To me it seems like such a crazy thought experiment: have a good way to augment LLM coding and incur some interest in developers by getting them to build around ideas (not just dev tools). The feedback confirmed this approach resonates—developers are hungry for meaningful problems to solve, not just another framework or library.

## The Venture Studio Discovery

The term "venture studio" was unfamiliar to me before this event. The concept—systematically building multiple companies with shared resources and expertise—was fascinating. It's different from accelerators or incubators; it's about being a co-founder at scale. 

This model addresses something I'd been thinking about: how to build around ideas rather than just tools. Getting developers excited about concepts, not just developer tools, requires this kind of structured yet flexible approach. The venture studio model suddenly made more sense in this context—it's about systematically building multiple products while solving common challenges once.

## Implementation Ideas

### The CLI-Simple App Approach

Start with minimalist functionality, then layer complexity:
- QR code animations to convey secret keys
- Reports via browser with quarterly physical mail follow-ups
- Settings-first design assuming power users

### Direct-to-Computer Interactions

Examples that bypass traditional UI:
- Voice transcription → LLM transformation → Action
- Camera/timeline/audio bundling for context
- Local phone data as primary input source

"The phone is the server, not the interaction junction. The phone should only be configured at the server level."

## Reflections Under the Super Moon

Writing this from DC, where the weather finally matches that Bay Area coolness, I'm processing the contrast. The SF energy is real—intoxicating and potentially consuming. The question isn't whether to embrace it, but how to take what's valuable without losing yourself in the "solving menial problems for billions" trap.

The convergence of trends became clear:
1. **Primitive-focused development**—build from data models up, not features down
2. **LLMs restructuring teams**—the designer/developer divide is dissolving
3. **Local-first as table stakes**—collaborative experiences require it
4. **Multi-modal future**—screens becoming one option among many

The positive feedback on my ideas was validating, but more importantly, it confirmed that building around concepts rather than tools is a viable path. The venture studio model, the multi-modal vision, the idea that phones should be servers not screens—these aren't just technical decisions but philosophical ones.

Maybe that's why I gravitated toward the European founders and the philosophy discussions. In a world of 9-9-6 and exit strategies, sometimes the best insights come from stepping back and asking: what are we actually building, and why?

---

**Next Steps:** Implementing these principles in the Thoughtful Apps ecosystem, exploring the venture studio model for idea-driven development, and continuing to reduce screen time while maintaining deep user engagement.