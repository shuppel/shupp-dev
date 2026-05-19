---
title: "Resumes as Nodes vs. Narrative Chronology"
description: "The tension between organizing professional identity as a knowledge graph versus the traditional reverse-chronological resume format."
stage: "protostar"
formed: 2025-12-22
lastObserved: 2025-12-22
constellation: "product-philosophy"
connections: ["local-first-principles"]
relatedProjects: ["portfolio-website"]
---

## The Fundamental Mismatch

A resume is a **compressed narrative** optimized for a specific reader: the hiring manager who spends 6-10 seconds scanning it. It's reverse-chronological because the question being answered is: *"What have you done lately?"*

But that's not how professional identity actually works.

Your skills, expertise, and capabilities exist as a **graph of interconnected nodes**—not a timeline. When someone asks "Do you know React?" they don't care *when* you learned it. They care about:
- **Depth**: How well do you know it?
- **Context**: What have you built with it?
- **Connections**: What related skills cluster around it?
- **Recency**: Are you still using it, or was it 5 years ago?

## The Traditional Resume: Optimized for Scanning

The reverse-chronological format exists because:

1. **Recency bias**: Assumes your latest role = your current capabilities
2. **Pattern matching**: Recruiters look for keywords in job titles
3. **Linear storytelling**: "Here's where I've been" is easier to skim than "Here's what I know"
4. **Risk mitigation**: Employment gaps are visible and explainable

This works *okay* for traditional career paths:
- Engineer → Senior Engineer → Staff Engineer
- Consultant → Senior Consultant → Principal

But it breaks down for:
- **Portfolio careers**: Multiple simultaneous roles
- **Self-taught technologists**: Skills acquired outside employment
- **Domain shifters**: People who change industries
- **Builders**: People with side projects, open source contributions, personal tools

## The Node-Based Resume: Optimized for Capability

What if a resume was a **knowledge graph** instead?

### Structure

```
Skills (nodes)
├─ React
│  ├─ Proficiency: Advanced
│  ├─ Last used: 2025-12
│  ├─ Projects: [Portfolio Website, Humans Only FM, FxSankey]
│  └─ Related: [TypeScript, Astro, Component Architecture]
├─ Federal Consulting
│  ├─ Context: 8 years
│  ├─ Domains: [Healthcare, TSA, NIH]
│  └─ Related: [Agile, Stakeholder Management, Compliance]
└─ Technical Writing
   ├─ Evidence: [Blog posts, Documentation, RFCs]
   └─ Related: [Communication, Teaching, UX Writing]
```

### What This Enables

- **Weighted relevance**: "Show me all product management experience, weighted by recency"
- **Skill clustering**: "What capabilities surround my cloud infrastructure knowledge?"
- **Gap analysis**: "What skills do I need for [target role]?"
- **Evidence chains**: "Prove you know X" → Show projects/posts/commits
- **Dynamic filtering**: Generate different resumes for different roles

## The Problem: Hiring Managers Don't Think in Graphs

Here's the rub: **The audience determines the format.**

Hiring managers expect:
- A PDF they can skim in 10 seconds
- Job titles, company names, date ranges
- Bullet points of "responsibilities" and "achievements"
- A linear story they can pattern-match against their mental model

Even if you *could* build an interactive knowledge graph of your professional identity (and I have—it's literally this website), the person on the other end is likely looking at a printed PDF in a stack of 50 others.

## The Hybrid Approach: This Website

My solution is to maintain **both representations**:

### 1. Traditional Resume (`/resume`)
- Reverse-chronological
- PDF downloadable
- Keyword-optimized for ATS (Applicant Tracking Systems)
- Standard format for gatekeepers

### 2. Node-Based Portfolio (`/portfolio`, `/blog`, `/garden`)
- Projects as nodes
- Skills as tags/technologies
- Blog posts as evidence of thinking
- Garden notes as evolving expertise
- Bidirectional links between concepts

### 3. Dynamic Context

The traditional resume is **generated from** the node-based content system. Changes to projects, experience, or skills propagate to the resume automatically.

But the resume format itself remains optimized for scanning, not exploration.

## What Would a Node-Based Hiring Process Look Like?

Imagine if job applications worked like this:

1. **Company posts required capabilities** (not "5 years experience in X")
   - "Must: Build accessible React components"
   - "Must: Debug distributed systems"
   - "Nice: Experience with healthcare compliance"

2. **Candidate submits a capability graph**
   - Each node has evidence (repos, posts, projects, references)
   - Weighting based on recency and depth
   - Auto-scored against requirements

3. **Interview focuses on delta**
   - "We see you have React + TypeScript, but not Next.js. How quickly can you learn it?"
   - "Your graph shows no healthcare, but strong technical writing. Here's the context—how would you approach it?"

4. **Hiring decision based on:**
   - Capability match %
   - Learning velocity (how fast they acquire new nodes)
   - Graph density (how interconnected their skills are)
   - Evidence quality (side projects > job titles)

## The Cultural Shift Required

This would require hiring managers to:
- **Stop optimizing for pedigree** (company names, universities)
- **Start optimizing for capability** (what can they actually do?)
- **Accept non-linear careers** (gaps, pivots, portfolio work)
- **Trust evidence over credentials** (show, don't tell)

But we're moving this direction already:
- GitHub profiles matter more than CS degrees for developers
- Design portfolios matter more than job titles for designers
- Published writing matters more than MBA for product managers

## Connection to Local-First

This connects to [[local-first-principles]] because a node-based professional identity should be:

- **Owned by the individual**: Your graph lives in markdown files you control
- **Portable**: Export to JSON, PDF, LinkedIn, whatever format needed
- **Version controlled**: Track how your skills evolve over time
- **Composable**: Generate different views (resume, portfolio, skill matrix) from the same data

## Open Questions

- How do we verify nodes? (Anyone can claim "Advanced React")
- What's the UI for exploring someone's capability graph?
- Can this be gamed? (Keyword stuffing, but for nodes)
- How do we weight self-assessment vs. peer validation?
- Should "soft skills" be nodes too? How do you evidence "stakeholder management"?

## This Note's Evolution

Right now this is a **protostar**—a developing idea with some structure. As I:
- Iterate on my own portfolio architecture
- Talk to hiring managers about what they actually need
- See where AI-assisted hiring goes (scary but inevitable)
- Build tools to visualize capability graphs

...this note will evolve toward something more actionable.

## Resources to Explore

- [ ] Research: How do platforms like LinkedIn represent professional identity?
- [ ] Experiment: Build a skill graph visualizer for my own data
- [ ] Interview: Talk to 5 hiring managers about what they *actually* look for
- [ ] Connect: Explore ontologies for skills (ESCO, O*NET, IEEE, etc.)
- [ ] Prototype: Auto-generate resume from content collections
