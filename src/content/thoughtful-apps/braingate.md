---
title: "BrainGate"
oneLiner: "Locks your apps every few minutes and makes you solve brain teasers to earn your scroll time back"
status: "concept"
category: "Digital Wellness"
problem: "People lose hours to mindless scrolling every day — not because they want to, but because apps are engineered to eliminate friction. Screen time limits don't work because you just tap through the warning. What if the friction was actually good for you? What if every 5-10 minutes of scrolling, you had to prove your brain was still engaged by solving a quick puzzle before the app unlocked again?"
features:
  - name: "App Locking Engine"
    what: "Configurable timer that locks selected apps after a set interval (5, 10, 15 minutes). When the timer fires, the app freezes behind a puzzle overlay. No dismiss button, no skip option — you solve it or you're done scrolling."
    why: "Screen time warnings are ignorable. A locked screen you have to earn your way past creates real friction. The key is the friction is beneficial rather than just annoying."
  - name: "Puzzle Library"
    what: "Rotating collection of brain teasers — spatial reasoning, word puzzles, math problems, logic gates, pattern recognition, memory challenges. Difficulty adapts to the user over time so puzzles stay challenging but not frustrating."
    why: "If it's the same puzzle every time, muscle memory takes over and you lose the cognitive benefit. Variety and adaptive difficulty keep your brain actually working."
  - name: "Difficulty Escalation"
    what: "The longer your total session, the harder the puzzles get. First unlock might be a quick pattern match. By the fourth unlock in a row, you're doing multi-step logic problems. Eventually the puzzles take longer than the scrolling was worth."
    why: "This is the real anti-doomscroll mechanic. The cost of continued scrolling increases over time, naturally encouraging you to put the phone down when the effort exceeds the reward."
  - name: "Cognitive Dashboard"
    what: "Tracks your puzzle performance over time — reaction speed, accuracy, categories you're strong/weak in. Shows your screen time alongside your cognitive exercise, reframing the relationship with your phone."
    why: "Turns a guilt-inducing screen time report into something with a silver lining. Yes you scrolled for 2 hours, but you also did 12 spatial reasoning puzzles and your pattern matching speed improved 15%."
  - name: "Custom App Rules"
    what: "Different intervals and puzzle types per app. Maybe Instagram locks every 5 minutes with visual puzzles. Maybe Twitter locks every 10 with word problems. Exempt apps you actually need (maps, calls, banking)."
    why: "Not all apps are equal time sinks. Users should control which apps get gated and how aggressively."
  - name: "Social Challenges"
    what: "Challenge friends to puzzle duels. Leaderboards for puzzle streaks. Share your solve times. Turn the anti-scroll mechanic into its own social layer."
    why: "If the puzzle-solving becomes genuinely fun and competitive, users will actually keep the app installed instead of disabling it after three days like every other screen time tool."
userJourney:
  - "User installs BrainGate and selects which apps to gate (social media, news, games, etc.)"
  - "Sets their preferred interval — every 5, 10, or 15 minutes of active app use"
  - "Opens Instagram and starts scrolling normally"
  - "After 7 minutes, the screen locks with a spatial reasoning puzzle overlaid on the frozen app"
  - "User solves the puzzle in 15 seconds — app unlocks and timer resets"
  - "After another 7 minutes, a harder word puzzle appears (difficulty escalated because this is their second consecutive unlock)"
  - "User decides the puzzle wasn't worth it and puts the phone down — mission accomplished"
  - "Later, checks the cognitive dashboard and sees they solved 8 puzzles today with improving accuracy"
technicalArchitecture:
  frontend: "Native iOS (Swift) and Android (Kotlin) — must be native to hook into accessibility services and app usage APIs. No web wrapper can lock other apps."
  backend: "Lightweight API for puzzle delivery, leaderboards, and sync. Firebase or Supabase for real-time social features."
  data: "Local SQLite for puzzle history, solve times, and app usage tracking. Server-side for social features and puzzle content delivery."
  apis:
    - "iOS Screen Time API / Android UsageStatsManager for app monitoring"
    - "iOS Managed App Configuration / Android Accessibility Services for app locking"
    - "Push notifications for social challenges"
    - "Custom puzzle generation engine with adaptive difficulty algorithm"
  hosting: "Serverless (AWS Lambda or Cloudflare Workers) — puzzle serving is lightweight and bursty"
moonshotFeatures:
  - "EEG integration — use a consumer brain-computer interface to verify actual cognitive engagement, not just pattern tapping"
  - "Employer/school wellness programs — organizations offer BrainGate as a productivity tool with anonymized aggregate cognitive metrics"
  - "Puzzle content marketplace where users create and share custom puzzle packs"
  - "Progressive training mode that specifically targets cognitive skills the user is weakest in, turning screen time into genuine brain training"
  - "Integration with focus apps like Forest — solve a puzzle AND your tree keeps growing"
  - "Parental mode with age-appropriate puzzles — teach kids that screen time comes with cognitive cost"
  - "Accessibility puzzle modes — audio puzzles, haptic puzzles, puzzles designed for different cognitive and physical abilities"
marketResearch:
  similarTo: ["Screen Time (iOS)", "Digital Wellbeing (Android)", "Forest App", "Lumosity", "Opal"]
  differentBecause: "Screen time tools use shame and weak warnings. Lumosity is voluntary and separate from your phone habits. BrainGate directly links the act of scrolling to cognitive exercise — you can't bypass it, and the friction itself is beneficial. The difficulty escalation makes extended scrolling genuinely cost more effort over time, creating natural stopping points."
  targetUsers: "Anyone who's tried and failed to reduce screen time. Students, knowledge workers, parents worried about their kids' phone habits, and anyone who'd rather their idle scrolling time at least exercise their brain."
openQuestions:
  - "Can you reliably lock third-party apps on iOS without jailbreaking? Screen Time API has limitations."
  - "Android accessibility services are powerful but Google keeps restricting them — how to stay within Play Store policy?"
  - "What's the right puzzle difficulty curve so users don't just rage-uninstall after day one?"
  - "How to prevent users from just switching to un-gated apps instead of solving puzzles?"
  - "Is there clinical evidence that brief cognitive exercises during screen breaks provide real benefit?"
  - "Monetization: premium puzzle packs, or does that conflict with the wellness mission?"
resources:
  - title: "Apple Screen Time API Documentation"
    url: "https://developer.apple.com/documentation/screentime"
  - title: "Lumosity's Cognitive Training Research"
    url: "https://www.lumosity.com/en/research/"
  - title: "Digital Wellness and Friction Design"
    url: "https://www.nngroup.com/articles/friction/"
lastUpdated: 2025-02-10
feasibility: 3
excitement: 5
seriousness: 4
voteCount: 0
---

Everyone has the same experience. You open your phone to check one notification and 45 minutes later you're watching a stranger reorganize their pantry. You didn't choose that. The app chose it for you by removing every possible point of friction between you and the next piece of content.

Every screen time solution I've tried attacks this problem the wrong way. They show you a number — "you've spent 3 hours on Instagram today" — and hope shame does the work. Or they put up a soft warning you can dismiss in one tap. It's like putting a speed bump made of paper on a highway. You don't even notice it.

BrainGate flips the script. Instead of trying to block you (which never works because you're the one who set the limit and you're the one who can override it), it makes you pay a cognitive toll. Every 5-10 minutes, the app freezes and you have to solve a real puzzle to get back in. Not a "tap to continue" button. An actual spatial reasoning problem, or a word puzzle, or a logic sequence.

The key insight is the difficulty escalation. The first puzzle after opening an app is quick and easy — a pattern match, a simple math problem. But each consecutive unlock gets harder. By the third or fourth one, you're spending 30-60 seconds on a multi-step logic problem. At some point, your brain does the math: "Is 5 more minutes of scrolling worth a 45-second logic puzzle?" And for the first time, the answer might actually be no.

The beautiful part is that even when you do keep scrolling, you're not wasting your time completely. You just did 8 brain teasers. Your pattern recognition got a little faster. Your working memory got a small workout. The cognitive dashboard tracks this over time, and it reframes the whole relationship with your phone. Instead of a screen time report that makes you feel guilty, you get a report that says "yeah, you scrolled for 2 hours, but you also improved your spatial reasoning score by 12% this week."

The social layer is what keeps people from uninstalling it after the first annoying lock. When your friend texts you their puzzle streak and you see they solved 15 in a row with an average time of 8 seconds, suddenly the puzzle-solving itself becomes the game. The doomscrolling becomes the side quest.

The biggest technical challenge is app locking on iOS — Apple is protective about letting apps control other apps, and Screen Time API access is limited. Android is more permissive through accessibility services but Google keeps tightening those policies. This might need to work as a device management profile or a companion app that integrates at the OS level rather than fighting against it. It's solvable, but it's the hardest part.
