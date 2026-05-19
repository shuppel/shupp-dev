---
title: "Ethical AI Development"
description: "Exploring data rights, consent, and responsible AI practices in an era of models trained on scraped content."
stage: "nebula"
formed: 2025-12-21
lastObserved: 2025-12-21
constellation: "ai-ethics"
connections: ["local-first-principles"]
---

## The Core Problem

LLMs are trained on vast amounts of data scraped from the internet, often without explicit consent from content creators. This raises fundamental questions:

- Who owns the output of a model trained on stolen data?
- How do we compensate creators whose work trains these models?
- Can we build AI systems that respect intellectual property?

## Building on Stolen Knowledge

We are building on stolen knowledge. LLMs themselves are inherently "thieves" of ideas. The foundation is questionable.

This isn't just a philosophical concern—it's a practical one:

- **Legal risk**: Ongoing lawsuits against OpenAI, Stability AI, others
- **Moral hazard**: Normalizing theft of creative work
- **Quality degradation**: Training on AI-generated content creates feedback loops
- **Creator exploitation**: Value extraction without compensation

## Possible Solutions

### 1. Data Contributor Platforms

**Create a platform where contributors make money off their data being sold in packages.**

Think of this:
- Tokenizing contribution value to every dividend
- Users validate other contributors (like blockchain consensus mechanisms)
- Proof-of-custody for data and data rights
- Contributors opt-in and get compensated

### 2. Ethically Sourced LLMs

**Build models using only:**
- Public domain content
- Explicitly licensed training data
- Open-source datasets with clear licenses
- Content from creators who opted in

Yes, it might perform worse. But there are zero legal issues downstream.

### 3. Local-First AI

Combine with [[local-first-principles]]:
- Models run on user devices (quantized, smaller models)
- User data never leaves their machine for training
- Fine-tuning happens locally with user's own data
- Federated learning without centralized data collection

## Open Questions

- How do we verify training data provenance?
- What does "fair use" mean for training data?
- Can we create sustainable economics for data contributors?
- Should we regulate pre-training data like we regulate other intellectual property?

## Connection to Thoughtful App Co

If [Thoughtful App Co](/thoughtful-app-co) uses AI features, they must:

1. Be transparent about what models we use
2. Prefer ethically sourced or local models
3. Never use user data for training without explicit opt-in
4. Compensate data contributors when possible
5. Offer non-AI alternatives for all features

## This is a Work in Progress

This note is a **nebula**—a cloud of potential ideas that need structure. As I learn more about:

- Data rights legislation (EU AI Act, etc.)
- Emerging ethical AI frameworks
- Practical implementations of consent-based training
- Economics of data marketplaces

...this note will evolve toward a more coherent framework.

## Resources to Explore

- [ ] Research EU AI Act provisions on training data
- [ ] Investigate consent.ai and similar platforms
- [ ] Study federated learning implementations
- [ ] Connect with creators affected by AI training
- [ ] Explore differential privacy techniques
