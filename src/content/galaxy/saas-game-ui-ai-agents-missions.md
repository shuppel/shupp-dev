---
title: "SaaS Game UI: turning AI agent work into a playable system"
description: "A JRPG-inspired design system for AI agents, with missions, equipment, evidence, and three interactive browser studies."
stage: "star"
formed: 2026-09-23
lastObserved: 2026-09-23
pubDate: 2026-09-23
author: "Erikk Shupp"
ogImage: "/saas-game-ui/social/saas-game-ui-share-v1.png"
ogImageAlt: "SaaS Game UI: a JRPG-inspired interface for agents, missions, tools, and team coordination."
constellation: "design-systems"
connections: ["better-user-experiences"]
relatedProjects: ["saas-game-ui"]
visible: true
---

When software agents do work, the interface has to show more than a stream of messages. People need to understand what the agent is doing, what it can do, what is still open, and what evidence supports a result.

**SaaS Game UI** explores a different way to arrange that work: borrow the useful structure of a role-playing game. Give people a world they can move through, agents they can equip, missions with clear outcomes, and records they can inspect.

[Explore the SaaS Game UI system](/design/saas-game-ui).

## Game structure for real work

The inspiration came from pet and mission games. An assistant could have distinct strengths. A tool could be something you equip for a task. A recurring job could be a mission with a status and a reward for finishing it.

The game language is useful when it makes the work easier to understand. A map can show where the next action lives. A mission board can make assigned work visible. An inventory can connect a tool to the agent expected to use it. A handoff can carry evidence forward so someone else can review the result.

The interface should still feel like software that helps get things done. The game layer gives familiar actions a place and a sequence; it does not make the evidence or review optional.

## Three interactive studies

The design system currently has three browser demos, each exploring a different part of the model.

### Fieldwork: equip an agent for a task

[Fieldwork](/design/saas-game-ui/fieldwork) lets you move through a coding workspace, gather context, equip an agent, target a task, and verify a proposed patch. The flow makes the path from “what should change?” to “what did the agent propose?” visible.

### Creature Works: make missions feel like a world

[Creature Works](/design/saas-game-ui/creature-works) is set in Fernhaven, a town for dinosaur assistants. You can move between places, hatch creatures with distinct traits, visit the store for tools, equip a companion, and assign missions from a board.

The town gives each part of the job a location. Choosing equipment happens at the store; choosing work happens at the mission board. The idea is to let an operator move through the system and make decisions where they belong instead of keeping inventory, missions, and character details permanently stacked in one sidebar.

### Relay Guild: keep coordination legible

[Relay Guild](/design/saas-game-ui/relay-guild) explores the team side: assemble a party, queue tasks, hand evidence between agents, and deliver a reviewed brief. The party is a way to make assignments and handoffs easier to follow.

Across the studies, the recurring question is how an interface can show the relationship between an actor, a task, a tool, and the result.

## Serious records beneath the playful surface

The point is not to hide work inside a game. Mission status, proposed changes, checks, and evidence need to remain legible. The playfulness should help someone orient themselves and choose a useful next action; it should not make a result feel trustworthy without showing why.

These are interaction prototypes rather than live agent services. They use authored outputs and local browser state. Checks run in the browser, and Creature Works uses a simulated clock and local saves. That boundary lets the demos explore how the work could be organized before connecting a model runtime, repository, or scheduling service.

[Explore all three studies](/design/saas-game-ui), or open [Fieldwork](/design/saas-game-ui/fieldwork), [Creature Works](/design/saas-game-ui/creature-works), and [Relay Guild](/design/saas-game-ui/relay-guild).

[Share this article on X](https://twitter.com/intent/tweet?text=What%20if%20AI%20agent%20work%20felt%20like%20a%20game%20world%3F%20SaaS%20Game%20UI%20turns%20tools%20into%20equipment%2C%20tasks%20into%20missions%2C%20and%20handoffs%20into%20something%20you%20can%20follow.&url=https%3A%2F%2Fshupp.dev%2Fgalaxy%2Fsaas-game-ui-ai-agents-missions%2F)
