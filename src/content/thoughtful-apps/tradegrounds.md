---
title: "Tradegrounds"
oneLiner: "Decentralized local-first marketplace connecting logistics, owners, and customers — the anti-Amazon, anti-UPS, anti-DoorDash platform for working class entrepreneurs"
status: "concept"
category: "Local Commerce"
problem: "Big tech platforms extract enormous value from local economies. Amazon crushes small retailers with scale, UPS monopolizes logistics pricing, DoorDash takes 30% from restaurants, and Uber exploits gig workers into precarity. Working class entrepreneurs can't compete because they lack the tools, templates, and infrastructure that corporations have built over decades. Meanwhile, community marketplaces like farmers markets have zero digital infrastructure — organizers use spreadsheets and group texts, vendors have no unified presence, and customers have no way to discover what's available before showing up."
features:
  - name: "Local Marketplace Hub"
    what: "Template-driven storefronts for small businesses with inventory, pricing, and order management built in. Businesses pick a template (food vendor, craftsperson, produce farmer, service provider) and get a working operation out of the box."
    why: "Working class entrepreneurs shouldn't need to hire a developer or learn Shopify to sell their goods. Templates lower the barrier from 'learn everything' to 'fill in the blanks.'"
  - name: "Contracts & Payments"
    what: "Formal trade agreements between parties — vendors and marketplaces, businesses and delivery providers, wholesale buyers and sellers. Integrated payments with clear terms, milestones, and dispute resolution."
    why: "Handshake deals fall apart at scale. Small businesses need the same contractual infrastructure that corporations use, without the legal overhead."
  - name: "Community Markets"
    what: "Tools for event organizers running farmers markets, flea markets, craft fairs, and pop-up events. Centralized vendor management, scheduling, booth assignments, and a public-facing marketplace page so customers know who's attending."
    why: "Community market organizers are doing heroic coordination work with terrible tools. Give them a real platform and the entire community benefits — vendors get more visibility, customers get better information."
  - name: "Delivery & Logistics Network"
    what: "Peer-to-peer delivery agreements between local businesses and logistics providers. Route optimization, delivery scheduling, proof of delivery, and fair pricing set by the providers themselves."
    why: "Local delivery shouldn't require DoorDash taking a third of the revenue. Connect local drivers directly with local businesses and let them set their own terms."
  - name: "Scaled Pricing Model"
    what: "Unreal Engine-style revenue sharing — free for businesses under a revenue threshold, subscription or percentage-based above it. Users choose the model that works for them. Large-scale operations pay proportionally more."
    why: "The farmer selling $500/week at a Saturday market shouldn't pay the same as a multi-location operation doing $50K/month. Pricing should scale with success, not gatekeep entry."
  - name: "Operations Templates"
    what: "Pre-built operational playbooks for common business types — inventory workflows, pricing strategies, seasonal planning, tax prep checklists, delivery logistics. Not just storefronts but actual business operations support."
    why: "The gap between a person with a skill and a person running a business is operational knowledge. Templates bridge that gap without requiring an MBA."
userJourney:
  - "Business owner signs up and selects a business template (food vendor, craftsperson, produce farmer, service provider, etc.)"
  - "Customizes their storefront with products, pricing, and availability"
  - "Joins existing community marketplaces or creates trade agreements with other local businesses"
  - "Sets up delivery logistics — either self-delivery or contracts with local delivery providers"
  - "Community organizer creates a marketplace event page, invites vendors, manages booth assignments"
  - "Customers browse the local marketplace, discover vendors, place orders or plan market visits"
  - "Contracts and payments flow through the platform with clear terms and automatic settlement"
  - "As business grows, pricing scales accordingly — small stays free, larger operations contribute back"
technicalArchitecture:
  frontend: "React Native + Next.js progressive web app — mobile-first for vendors in the field, desktop dashboard for operations management"
  backend: "Local-first architecture with CRDTs for offline sync — vendors at outdoor markets with spotty wifi need the app to work regardless. Event sourcing for audit trails on contracts and payments"
  data: "SQLite for local-first storage syncing to PostgreSQL. CockroachDB for distributed multi-region data when scaling across communities"
  apis:
    - "Stripe Connect for marketplace payments and vendor payouts"
    - "DocuSign or custom contract signing for trade agreements"
    - "MapBox for delivery route optimization and logistics"
    - "Twilio for vendor-customer communication"
    - "CalDAV for market event scheduling integration"
  hosting: "Edge-deployed on Cloudflare Workers with self-hostable option — communities should be able to run their own instance if they want true independence"
moonshotFeatures:
  - "Federated marketplace network — like email, your local Tradegrounds instance connects to others, enabling cross-community trade without centralization"
  - "Cooperative ownership model where active vendors and delivery providers gain governance rights over the platform"
  - "Community investment pools allowing neighbors to collectively fund local business expansion"
  - "AI-powered demand forecasting helping small vendors plan inventory based on local event calendars and seasonal patterns"
  - "Integration with local government permitting and licensing systems to reduce bureaucratic friction"
  - "Cross-community wholesale trade routes — a baker in one town can source flour from a mill in another through the network"
  - "Reputation portability — a vendor's track record follows them across any Tradegrounds marketplace they participate in"
marketResearch:
  similarTo: ["Shopify", "Etsy", "Square", "DoorDash", "Fairphone's cooperative model"]
  differentBecause: "Local-first and decentralized rather than extractive. Pricing scales with success instead of gatekeeping entry. Provides operational templates, not just storefronts. Treats community marketplaces as first-class citizens. Logistics are peer-to-peer with fair terms, not platform-exploited gig work. Self-hostable for communities that want true independence."
  targetUsers: "Small business owners, farmers market vendors, community event organizers, local delivery drivers, working class entrepreneurs who have skills and products but lack operational infrastructure"
openQuestions:
  - "How to bootstrap the network effect in a local-first model without VC-funded growth hacking?"
  - "What's the right revenue threshold for the Unreal Engine-style pricing tiers?"
  - "How to handle liability and insurance for peer-to-peer delivery contracts?"
  - "What legal framework works best for the contracts portion across different jurisdictions?"
  - "How to maintain quality standards and trust across a decentralized marketplace network?"
  - "Should the federation protocol be ActivityPub-based or something custom?"
  - "How to prevent large players from gaming the scaled pricing model?"
resources:
  - title: "Unreal Engine Licensing Model"
    url: "https://www.unrealengine.com/en-US/license"
  - title: "CRDTs and Local-First Software"
    url: "https://www.inkandswitch.com/local-first/"
  - title: "Platform Cooperativism Consortium"
    url: "https://platform.coop/"
  - title: "Fairphone's Cooperative Business Model"
    url: "https://www.fairphone.com/en/story/"
lastUpdated: 2025-02-10
feasibility: 3
excitement: 5
seriousness: 5
voteCount: 0
---

Tradegrounds started as frustration with watching the same story repeat everywhere. A friend runs a small hot sauce business out of their kitchen. They're talented, their product is genuinely good, and they have loyal customers at three different farmers markets. But the moment they try to scale beyond Saturday mornings — get into local stores, offer delivery, maybe take online orders — they hit a wall of infrastructure they can't afford and complexity they weren't trained for.

Meanwhile, the farmers market organizer is juggling 40 vendor applications in a Google Form, sending booth assignments via text message, and praying the weather holds because there's no way to notify customers what's happening. The customers themselves just... show up and hope their favorite vendor is there.

This is the gap Tradegrounds lives in. Not replacing Amazon — that's a losing game. Instead, building the infrastructure layer that lets local economies actually function like economies. Templates so the hot sauce maker can run a real operation. Contracts so the delivery driver and the bakery have clear terms. Marketplace tools so the community organizer isn't doing heroic coordination with spreadsheets.

The pricing model is key. Unreal Engine proved that you can build a sustainable business by being genuinely free for small operators and only taking a cut when someone reaches real scale. A vendor doing $200/week at a Saturday market pays nothing. A multi-location operation doing $50K/month? They can afford to contribute back to the platform that helped them get there. The user can choose between a flat subscription or a percentage — whatever fits their business model.

The contracts piece is what makes this more than just another marketplace. When a bakery agrees to supply a coffee shop with pastries three times a week, that should be a real agreement with clear terms, delivery expectations, and automatic payment on fulfillment. When a community market hires local drivers to offer delivery from the market to customers' homes, those delivery agreements should be transparent and fair — not DoorDash-style black boxes where nobody knows what the driver actually gets paid.

The local-first architecture matters philosophically and practically. Philosophically, because communities shouldn't depend on a central server they don't control. Practically, because a vendor at an outdoor market with one bar of signal needs their inventory and POS to keep working. The data syncs when connectivity returns. If a community wants to self-host their own instance, they can — and it still connects to the wider network through federation.

This is fundamentally about giving working class people the same operational infrastructure that corporations have, without the extraction. The hot sauce maker, the farmers market organizer, the local delivery driver — they're all doing real work that their communities need. They just need better tools.
