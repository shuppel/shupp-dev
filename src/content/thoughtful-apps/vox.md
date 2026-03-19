---
title: "Vox"
oneLiner: "Voice and text AI agent layer for TACo apps — talk to your tools via phone call or SMS"
status: "concept"
category: "AI / Communication"
problem: "Interacting with apps requires screens, keyboards, and active attention. When you're driving, cooking, walking, or just don't want another screen session, you lose access to the tools you've built. There's no bridge between the digital app experience and the analog world of voice and text conversation."
features:
  - name: "Call-In Agent"
    what: "Dial a dedicated phone number to speak with an AI agent that has full context of your TACo app data — Nurture relationships, Agape volunteer matches, FriendLy reminders, and more"
    why: "Voice is the most natural interface. Hands-free access means your apps work for you even when you can't touch a screen"
  - name: "SMS / Text Interface"
    what: "Text the same number to interact via conversational SMS. Ask questions, get updates, trigger actions, and receive proactive nudges from any TACo app"
    why: "Not every moment calls for a phone call — quick text exchanges let you stay connected to your data with zero friction"
  - name: "Cross-App Context"
    what: "The agent understands which TACo app you're referencing based on conversational context and can seamlessly switch between them mid-call or mid-thread"
    why: "You shouldn't have to call separate numbers or use different keywords for each app — one agent, one number, all your tools"
  - name: "Proactive Outreach"
    what: "The agent can call or text you with timely nudges — a Nurture reminder to check in on a friend, a FriendLy birthday alert, an Agape volunteer opportunity match"
    why: "The best assistant doesn't wait to be asked. Proactive outreach turns passive apps into active companions"
  - name: "Voice Authentication & Persona"
    what: "Recognizes your voice for seamless auth and adapts its conversational style to your preferences — casual, professional, brief, or detailed"
    why: "Security without friction, and a personality that feels like yours"
userJourney:
  - "User signs up for Vox and links their existing TACo app accounts"
  - "User receives a dedicated phone number (or uses a shared toll-free number with account PIN)"
  - "User calls the number while driving and says 'How's my relationship health looking this week?'"
  - "Vox agent pulls data from Nurture, summarizes strata changes, and suggests calling a neglected close friend"
  - "User says 'Text me their number' — receives an SMS with the contact and a suggested conversation starter"
  - "Later, user texts the Vox number: 'Any volunteer opportunities this weekend?' — gets Agape matches via SMS"
  - "Vox proactively calls the user Friday evening: 'Hey, just a reminder — Sarah's birthday is tomorrow. Want me to draft a message?'"
technicalArchitecture:
  frontend: "No traditional UI — the interface IS voice and SMS. Minimal web dashboard for account linking, preferences, and call/text history"
  backend: "Node.js with Fastify or Express handling Twilio webhooks, orchestrating AI agent responses via Claude API"
  data: "PostgreSQL for user accounts, conversation history, and app linking. Redis for session state during active calls"
  apis:
    - "Twilio Voice API for inbound/outbound calls"
    - "Twilio Messaging API for SMS"
    - "Twilio Studio for complex call flows"
    - "Claude API (Anthropic) for conversational AI and tool use"
    - "TACo app APIs for cross-app data access"
    - "Deepgram or Twilio Speech-to-Text for transcription"
    - "ElevenLabs or Twilio TTS for natural voice synthesis"
  hosting: "Railway or Fly.io for low-latency webhook handling, with Cloudflare Workers for edge routing"
moonshotFeatures:
  - "Real-time voice cloning — choose the voice your agent speaks in"
  - "Multi-party calls — add the agent to a call with a friend for real-time translation or mediation coaching"
  - "Ambient listening mode — agent passively listens during a meeting and sends you a summary after"
  - "WhatsApp, Telegram, and Signal integration alongside SMS"
  - "Emotion detection in voice to adjust tone and urgency of responses"
  - "Offline voice recording that syncs and processes when connectivity returns"
marketResearch:
  similarTo: ["Bland AI", "Retell AI", "Air AI", "Twilio Voice + OpenAI integrations"]
  differentBecause: "Not a generic voice bot platform — Vox is purpose-built to be the conversational layer across an ecosystem of thoughtful apps, with deep context about the user's relationships, goals, and habits"
  targetUsers: "Existing TACo app users who want hands-free, screen-free access to their tools — especially people who are frequently on-the-go, prefer voice interaction, or want proactive AI companionship"
openQuestions:
  - "How to handle latency for real-time voice conversations with AI (STT -> LLM -> TTS pipeline)?"
  - "Per-minute Twilio + AI costs — what's the pricing model that makes this sustainable?"
  - "Privacy implications of storing voice recordings and conversation transcripts?"
  - "How to gracefully handle when the agent doesn't have enough context and needs to escalate to the app UI?"
  - "Should Vox be a standalone app or a feature built into each TACo app individually?"
  - "How to manage consent for proactive outbound calls without feeling intrusive?"
resources:
  - title: "Twilio Voice API"
    url: "https://www.twilio.com/docs/voice"
  - title: "Twilio Programmable Messaging"
    url: "https://www.twilio.com/docs/messaging"
  - title: "Claude Tool Use (Anthropic)"
    url: "https://docs.anthropic.com/en/docs/build-with-claude/tool-use"
  - title: "Deepgram Speech-to-Text"
    url: "https://deepgram.com/product/speech-to-text"
  - title: "ElevenLabs Voice AI"
    url: "https://elevenlabs.io/"
  - title: "Bland AI (voice agent platform)"
    url: "https://www.bland.ai/"
lastUpdated: 2026-03-19
feasibility: 3
excitement: 5
seriousness: 4
voteCount: 0
---

# Vox

Your TACo apps, but you just... talk to them.

Vox is the idea that every thoughtful app in the TACo ecosystem shouldn't be trapped behind a screen. It's a shared AI agent — reachable by phone call or text message — that knows about your Nurture relationships, your Agape volunteering, your FriendLy calendar, and everything else you've built.

## The Core Insight

The best interface is no interface. When you're driving and wonder "have I been neglecting my college friends?", you shouldn't have to pull over and open an app. You should just... ask. Out loud. And get an answer that actually knows your life.

## Why Voice + Text, Not Just a Chatbot

A chatbot lives inside yet another app. Vox lives where you already are — your phone's native dialer and messaging app. No downloads, no logins, no new UI to learn. It's the difference between "open the app, navigate to the right screen, tap the right buttons" and "hey Vox, what's up with my relationships this week?"

## The Agent, Not the App

Vox isn't really an app at all. It's the agent that sits across all your apps. It has the context of your entire TACo ecosystem and can:

- **Answer questions** spanning multiple apps in a single conversation
- **Take actions** on your behalf (send a message, schedule a reminder, sign up for volunteering)
- **Proactively reach out** when something needs your attention
- **Adapt its style** to how you like to communicate

## What Makes This Different

Most voice AI products are building generic platforms. Vox is opinionated — it's built specifically for the thoughtful app ecosystem, which means it understands relationships, community service, personal growth, and intentional living. It's not a customer service bot. It's more like a thoughtful friend who happens to have perfect memory.
