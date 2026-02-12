---
title: "BrainGate"
oneLiner: "Browser extension that locks your tabs every few minutes and makes you solve brain teasers to earn your scroll time back"
status: "concept"
category: "Digital Wellness"
problem: "People lose hours to mindless scrolling every day — not because they want to, but because apps are engineered to eliminate friction. Screen time limits don't work because you just tap through the warning. What if the friction was actually good for you? What if every 5-10 minutes of scrolling, you had to prove your brain was still engaged by solving a quick puzzle before the page unlocked again?"
features:
  - name: "Browser Extension Core"
    what: "Cross-browser extension (Chrome, Firefox, Edge, Firefox for Android) that monitors time spent on configured sites and overlays a full-page puzzle after a set interval. The page content blurs behind the puzzle — no scrolling, no clicking through. Solve it or close the tab. Works on desktop and mobile browsers that support extensions."
    why: "Browser extensions bypass the entire OS permission nightmare. No fighting Apple's Screen Time API or Google's accessibility service restrictions. FoxFilter proved the model works across Chrome, Firefox, Edge, and Firefox for Android — same extension codebase, multiple stores. The browser is where the doomscrolling happens anyway."
  - name: "Site-Level Rules"
    what: "Configure different intervals and puzzle types per domain. twitter.com locks every 5 minutes with word puzzles. reddit.com locks every 10 with logic problems. youtube.com locks every 7 with pattern recognition. Whitelist sites that shouldn't be gated (work tools, banking, docs)."
    why: "Not all sites are equal time sinks. A user might want aggressive gating on social media but lighter touch on news sites. Per-domain rules give users real control over their own friction design."
  - name: "Puzzle Library"
    what: "Rotating collection of brain teasers — spatial reasoning, word puzzles, math problems, logic gates, pattern recognition, memory challenges. Difficulty adapts to the user over time so puzzles stay challenging but not frustrating."
    why: "If it's the same puzzle every time, muscle memory takes over and you lose the cognitive benefit. Variety and adaptive difficulty keep your brain actually working."
  - name: "Difficulty Escalation"
    what: "The longer your total session on a gated site, the harder the puzzles get. First unlock might be a quick pattern match. By the fourth unlock in a row, you're doing multi-step logic problems. Eventually the puzzles take longer than the scrolling was worth."
    why: "This is the real anti-doomscroll mechanic. The cost of continued scrolling increases over time, naturally encouraging you to close the tab when the effort exceeds the reward."
  - name: "Cognitive Dashboard"
    what: "Extension popup and dedicated dashboard page tracking puzzle performance over time — reaction speed, accuracy, categories you're strong/weak in. Shows your browsing time alongside your cognitive exercise, reframing the relationship with your browser."
    why: "Turns a guilt-inducing screen time report into something with a silver lining. Yes you scrolled for 2 hours, but you also did 12 spatial reasoning puzzles and your pattern matching speed improved 15%."
  - name: "Social Challenges & Leaderboards"
    what: "Challenge friends to puzzle duels. Leaderboards for puzzle streaks and solve times. Share your stats. Turn the anti-scroll mechanic into its own competitive social layer."
    why: "If the puzzle-solving becomes genuinely fun and competitive, users will actually keep the extension installed instead of disabling it after three days like every other screen time tool."
  - name: "Anti-Bypass Protection (Premium)"
    what: "Password-protected settings so users can't just change intervals or disable the extension in a moment of weakness. Optional accountability partner mode where someone else holds the password. This is the premium feature that justifies the subscription — the same model FoxFilter uses."
    why: "FoxFilter's entire paid tier is built around preventing circumvention. The free version filters content; the paid version makes the filtering stick. Same principle here: free BrainGate gates your browsing, paid BrainGate makes the gate uncheatable."
userJourney:
  - "User installs BrainGate from Chrome Web Store, Firefox Add-ons, or Edge Add-ons"
  - "Extension popup walks through setup: pick sites to gate (suggestions: social media, news, video), set intervals per site"
  - "User opens twitter.com and starts scrolling normally"
  - "After 7 minutes, the page blurs and a spatial reasoning puzzle overlays the screen"
  - "User solves the puzzle in 15 seconds — page unblurs and timer resets"
  - "After another 7 minutes, a harder word puzzle appears (difficulty escalated because this is their second consecutive unlock)"
  - "User decides the puzzle isn't worth it and closes the tab — mission accomplished"
  - "Later, checks the cognitive dashboard and sees they solved 8 puzzles today with improving accuracy"
  - "Upgrades to premium to password-protect settings so they can't weaken their own rules at 11pm"
technicalArchitecture:
  frontend: "WebExtension API (cross-browser compatible manifest v3) — single codebase targeting Chrome, Firefox, Edge, and Firefox for Android. React or Preact for the popup UI and dashboard page. Puzzle rendering in Canvas or pure DOM."
  backend: "Lightweight API for leaderboards, social features, account sync, and premium puzzle content delivery. Supabase or Firebase for real-time social features and auth."
  data: "Extension local storage (chrome.storage.local) for puzzle history, solve times, site rules, and offline puzzles. Server-side sync for premium users to share settings across browsers/devices."
  apis:
    - "WebExtension tabs/webNavigation API for site monitoring and time tracking"
    - "WebExtension content scripts for puzzle overlay injection"
    - "Stripe for premium subscriptions"
    - "Custom puzzle generation engine with adaptive difficulty algorithm"
    - "OAuth for social features and cross-browser account sync"
  hosting: "Serverless (Cloudflare Workers or AWS Lambda) — puzzle serving and leaderboard updates are lightweight and bursty. Static dashboard hosted on CDN."
moonshotFeatures:
  - "Puzzle content marketplace where users create and share custom puzzle packs — community-driven content that scales without developer effort"
  - "Progressive training mode that specifically targets cognitive skills the user is weakest in, turning screen time into genuine brain training"
  - "Employer/school wellness programs — organizations deploy BrainGate as a managed extension with anonymized aggregate cognitive metrics"
  - "Parental mode with age-appropriate puzzles — teach kids that screen time comes with cognitive cost"
  - "Integration with focus tools like Forest or Habitica — solve a puzzle AND your tree keeps growing / character levels up"
  - "Accessibility puzzle modes — audio puzzles, haptic puzzles, puzzles designed for different cognitive and physical abilities"
  - "Native companion apps for iOS and Android that extend gating beyond the browser to native apps, for users who want full-device coverage"
  - "API for third-party puzzle providers — let educational platforms (Brilliant, Khan Academy) supply puzzles, creating a distribution channel for learning content"
marketResearch:
  similarTo: ["BlockSite (5M+ Chrome users)", "FoxFilter (~10K users)", "Cold Turkey", "Forest App", "Lumosity"]
  differentBecause: "BlockSite blocks sites entirely — useful but blunt. FoxFilter filters content but doesn't manage screen time. Lumosity is voluntary and separate from browsing habits. BrainGate is unique because the friction itself is the feature — it doesn't block you, it makes you earn continued access through cognitive exercise. The difficulty escalation creates natural stopping points that pure blockers can't achieve. And unlike native app approaches, the browser extension model works today across Chrome, Firefox, Edge, and Firefox for Android without fighting OS restrictions."
  targetUsers: "Anyone who's tried and failed to reduce screen time. Students, knowledge workers, parents worried about their kids' browsing habits, and anyone who'd rather their idle scrolling time at least exercise their brain. The browser extension model specifically captures desktop users who do most of their doomscrolling at work or at home on laptops."
openQuestions:
  - "Manifest v3 restrictions on content script injection — can we reliably overlay puzzles on all sites including SPAs?"
  - "What's the right puzzle difficulty curve so users don't just uninstall after day one?"
  - "How to prevent users from just opening an incognito window to bypass the extension?"
  - "Is there clinical evidence that brief cognitive exercises during screen breaks provide measurable benefit?"
  - "Should the free tier have a site limit (like BlockSite's 6-site free limit) or unlimited sites with limited puzzle variety?"
  - "Chrome mobile doesn't support extensions — is Firefox for Android enough for mobile coverage, or do we eventually need native apps?"
resources:
  - title: "WebExtension API Documentation (MDN)"
    url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions"
  - title: "Chrome Manifest V3 Migration Guide"
    url: "https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3"
  - title: "FoxFilter — Browser Extension Monetization Case Study"
    url: "https://www.foxfilter.com/subscribe"
  - title: "BlockSite — 5M User Extension Competitor"
    url: "https://blocksite.co/"
  - title: "Lumosity's Cognitive Training Research"
    url: "https://www.lumosity.com/en/research/"
  - title: "Digital Wellness and Friction Design"
    url: "https://www.nngroup.com/articles/friction/"
lastUpdated: 2025-02-12
feasibility: 4
excitement: 5
seriousness: 4
voteCount: 0
---

Everyone has the same experience. You open your browser to check one thing and 45 minutes later you're deep in a Reddit thread about whether hot dogs are sandwiches. You didn't choose that. The infinite scroll chose it for you by removing every possible point of friction between you and the next piece of content.

Every screen time solution I've tried attacks this problem the wrong way. They show you a number — "you've spent 3 hours on Twitter today" — and hope shame does the work. Or they put up a soft warning you can dismiss in one tap. BlockSite has 5 million users and what it does is just... block the site entirely. That's useful but blunt. You either have full access or no access, and the moment you override it, you're right back to zero friction.

BrainGate flips the script. Instead of blocking you, it makes you pay a cognitive toll. Every 5-10 minutes on a gated site, the page blurs and you have to solve a real puzzle to get back in. Not a "tap to continue" button. An actual spatial reasoning problem, or a word puzzle, or a logic sequence.

## Why a Browser Extension Changes Everything

The original idea was a native app, but that's fighting a losing battle against Apple and Google's platform restrictions. iOS Screen Time API is locked down. Android accessibility services keep getting restricted. You end up spending all your engineering effort on permission hacks instead of building the actual product.

A browser extension sidesteps all of that. The WebExtension API gives you everything you need: content script injection to overlay puzzles, tabs API to monitor which sites are active, local storage for settings and puzzle history. One codebase covers Chrome, Firefox, Edge, and Firefox for Android. You publish to three extension stores and you're live.

FoxFilter proved this model works — they've been running the same content-filtering extension across Chrome, Firefox, and Edge for over a decade. Their reach is small (~10K users) because content filtering is a solved problem with bigger players. But the distribution model is sound. BlockSite proved the scale is there — 5 million Chrome users paying up to $10.99/month for site blocking. BrainGate sits in the gap between them: not just blocking (BlockSite) and not just filtering (FoxFilter), but gating access behind something that's actually good for you.

## The Monetization Model

The key insight is the difficulty escalation. The first puzzle after opening a gated site is quick and easy — a pattern match, a simple math problem. But each consecutive unlock gets harder. By the third or fourth one, you're spending 30-60 seconds on a multi-step logic problem. At some point, your brain does the math: "Is 5 more minutes of scrolling worth a 45-second logic puzzle?" And for the first time, the answer might actually be no.

FoxFilter showed the monetization path for this exact type of extension. Their model: **the core feature is free, the anti-bypass protection is paid**. Free FoxFilter filters content. Paid FoxFilter ($12.99-$99.99/year) password-protects the settings so you (or your kids) can't just turn it off.

BrainGate follows the same structure but with more premium surface area:

**Free tier:** Unlimited site gating, basic puzzle library (50+ puzzles), difficulty escalation, simple stats. This needs to be genuinely useful on its own — the free tier is your growth engine.

**Premium ($4.99/month or $39.99/year):** Anti-bypass password protection (the FoxFilter play), accountability partner mode, full puzzle library (500+), adaptive difficulty AI, detailed cognitive dashboard with trend analysis, cross-browser sync, social challenges and leaderboards.

**Team/Family ($9.99/month):** Everything in premium plus shared family dashboard, parental controls with age-appropriate puzzles, managed deployment for up to 10 browsers.

The pricing sits between FoxFilter's $12.99/year (too cheap for what BrainGate offers) and BlockSite's $10.99/month (BrainGate offers more cognitive value than pure blocking). The $4.99/month sweet spot is accessible enough for students and compelling enough for knowledge workers who'd otherwise waste hours.

The beautiful part is that even when users keep scrolling, they're not wasting their time completely. They just did 8 brain teasers. The cognitive dashboard tracks this over time and reframes the whole relationship with browsing. Instead of a screen time report that makes you feel guilty, you get a report that says "yeah, you browsed for 2 hours, but you also improved your spatial reasoning score by 12% this week."

The social layer is what keeps people from uninstalling after the first annoying lock. When your friend shares their puzzle streak and you see they solved 15 in a row with an average time of 8 seconds, suddenly the puzzle-solving itself becomes the game. The doomscrolling becomes the side quest.
