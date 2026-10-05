---
courseCode: "CS 155"
school: "Stanford"
schoolFull: "Stanford University"
title: "Computer and Network Security"
description: "How systems get compromised and how to defend them: control-hijacking attacks and defenses, secure-system principles, isolation and sandboxing, vulnerability finding, the web security model and its attacks, processor side channels, and network protocol security."
term: "Spring 2022"
discipline: "Computer Science"
status: "live"
heroIcon: "ShieldWarning"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Computer Systems Security (MIT 6.858) lecture notes & videos"
    authors: "Nickolai Zeldovich, James Mickens et al. (MIT OCW)"
    url: "https://css.csail.mit.edu/6.858/"
    free: true
    note: "MIT's systems security course, fully open — a free companion covering much of the same ground."
  - title: "The Web Application Hacker's Handbook"
    authors: "Dafydd Stuttard & Marcus Pinto"
    url: "https://www.wiley.com/en-us/The+Web+Application+Hacker%27s+Handbook%2C+2nd+Edition-p-9781118026472"
    free: false
    note: "The deep reference for the web-security units — same-origin policy, XSS, CSRF, SQL injection."
links:
  - title: "Original CS 155 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS155"
    type: "notes"
    note: "The source this compilation links into."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 155 course site"
    url: "https://cs155.stanford.edu"
    type: "course"
    note: "Public lecture slides and projects, including the classic control-hijacking and web-security assignments."
  - title: "OWASP Top Ten"
    url: "https://owasp.org/www-project-top-ten/"
    type: "reference"
    note: "The industry-standard catalog of web application risks — maps directly onto the web-attacks unit."
  - title: "PortSwigger Web Security Academy"
    url: "https://portswigger.net/web-security"
    type: "tool"
    note: "Free, hands-on labs for XSS, CSRF, SQLi, and more."
units:
  - title: "The Threat Landscape"
    icon: "Crosshair"
    summary: "What motivates attackers and how modern intrusions unfold: the Cyber Kill Chain, case studies (Log4Shell, SolarWinds, typosquatting), and the marketplace that prices vulnerabilities through bug bounties and exploit brokers."
    lectures:
      - title: "Overview & the Vulnerability Marketplace"
        date: "2022-03-28"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-03-28-intro.md"
        keyIdeas:
          - "The Cyber Kill Chain frames an attack as ordered stages — reconnaissance through actions on objectives."
          - "Recent landmark incidents: Log4Shell (2021), the SolarWinds Orion supply-chain compromise (2020), and typosquatting."
          - "Vulnerabilities have a market: bug bounties pay for disclosure, exploit brokers pay much more for silence."
  - title: "Control Hijacking: Attack & Defense"
    icon: "Bug"
    summary: "The canonical memory-corruption arc: stack and heap buffer overflows, integer overflows, format-string and use-after-free bugs — then the escalating defenses (DEP, ASLR, StackGuard, shadow stacks, control-flow integrity) and the attacks that route around them, like return-oriented programming."
    lectures:
      - title: "Basic Control Hijacking Attacks"
        date: "2022-03-30"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-03-30-control-hijacking.md"
        keyIdeas:
          - "A stack buffer overflow overwrites the saved return address to redirect execution — the foundational memory-corruption exploit."
          - "The unsafe libc functions (gets, strcpy, sprintf) are recurring culprits; fuzzing is how overflows get found at scale."
          - "The family extends past the stack: heap vtable corruption, integer overflows, format-string bugs, and use-after-free."
      - title: "Control Hijacking Defenses"
        date: "2022-04-04"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-04-04-control-hijacking-defenses.md"
        keyIdeas:
          - "DEP marks memory non-executable, so attackers pivot to Return-Oriented Programming — chaining existing code 'gadgets'."
          - "ASLR randomizes memory layout to make gadget addresses unpredictable."
          - "StackGuard canaries, shadow stacks, and Control-Flow Integrity constrain where execution is allowed to go."
  - title: "Building & Breaking Secure Systems"
    icon: "Lock"
    summary: "The defensive design principles — least privilege, privilege separation, defense in depth, open design — realized in Unix access control and Chrome's architecture; the isolation mechanisms (chroot, seccomp-bpf, VMs) that confine untrusted code; and the fuzzing, dynamic, and static analysis used to find bugs before attackers do."
    lectures:
      - title: "Principles of Secure Systems"
        date: "2022-04-06"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-04-06-security-principles.md"
        keyIdeas:
          - "Vulnerabilities are inevitable, so defense in depth layers independent protections."
          - "Least privilege and privilege separation shrink the blast radius of any single compromise."
          - "Access is expressed as subjects, policies, and ACLs — Chrome's multi-process design is a real-world case study."
      - title: "Isolation & Sandboxing"
        date: "2022-04-11"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-04-11-isolation-sandboxing.md"
        keyIdeas:
          - "Confinement ranges from chroot jails (weak) to system-call interposition (seccomp-bpf) to full VMs."
          - "The hypervisor is a security boundary whose assumption is that guests can't escape — covert channels challenge that."
          - "Each mechanism trades isolation strength against performance and compatibility."
      - title: "Finding Vulnerabilities"
        date: "2022-04-13"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-04-13-vuln-finding.md"
        keyIdeas:
          - "Fuzzing (AFL and friends) mutates inputs to trigger crashes; coverage guidance makes it far more effective."
          - "Dynamic analysis observes running code; static analysis (dataflow) reasons about all paths but yields false positives."
          - "Manual review remains essential — and writing secure software is cheaper than finding the bugs later."
  - title: "Web Security"
    icon: "Globe"
    summary: "The security model that governs the web — HTTP, cookies, and the same-origin policy — and the attacks that exploit it: CSRF, SQL injection, and cross-site scripting (reflected and stored), plus the session-management and authentication practices that resist them, and phishing."
    lectures:
      - title: "The Web Security Model"
        date: "2022-04-18"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-04-18-web-security.md"
        keyIdeas:
          - "HTTP is stateless; cookies bolt on session state — and become a prime attack target."
          - "The Same-Origin Policy is the web's core boundary, and it applies differently to JavaScript and to cookies."
          - "Domain relaxation and the mechanics of external resource loading shape what 'origin' really means."
      - title: "Web Attacks"
        date: "2022-04-20"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-04-20-web-attacks.md"
        keyIdeas:
          - "CSRF abuses a victim's ambient cookies; defenses are referer checks, secret tokens, and SameSite cookies."
          - "SQL injection is prevented by parameterized queries, never string concatenation."
          - "XSS (reflected and stored) injects script into other users' pages; output encoding and CSP are the defenses."
      - title: "Authentication & Session Management"
        date: "2022-04-25"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-04-25-web-defenses.md"
        keyIdeas:
          - "Modern session management replaced HTTP auth: login issues a token, logout must truly invalidate it."
          - "Authenticating each request correctly is subtler than it looks — session fixation and hijacking lurk here."
          - "Phishing defeats strong crypto by attacking the human — a recurring theme in real breaches."
  - title: "Hardware & Network Security"
    icon: "Circuitry"
    summary: "Security below and between machines: trusted execution with Intel SGX and its limits, the Spectre speculative-execution side channel, and the layered internet protocols whose original design assumed a trusted network."
    lectures:
      - title: "Processor Security"
        date: "2022-05-04"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-05-04-processor-security.md"
        keyIdeas:
          - "SGX enclaves aim to protect code from a compromised OS, with remote attestation — but have their own weaknesses."
          - "Spectre exploits speculative execution to leak data across boundaries via cache timing."
          - "Variant 1 (conditional branch) and Variant 2 (indirect branch) show the attack is a class, not a single bug."
      - title: "Internet Protocol Security"
        date: "2022-05-09"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS155/2022-05-09-internet-protocol-security.md"
        keyIdeas:
          - "The OSI layering model and packet encapsulation frame where each protocol's trust assumptions live."
          - "Core internet protocols were designed for a trusted network, leaving spoofing and interception open."
          - "Security has been retrofitted layer by layer rather than designed in."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Security is the discipline of thinking like an adversary about your own systems.
CS 155 builds that instinct across the whole stack: memory-corruption exploits
and the arms race of defenses, the principles that make systems defensible, the
web's security model and the attacks that define modern breaches, and the
hardware and network layers underneath.

This compilation covers the eleven lectures published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS155),
organized into five units. Summaries are original writing; the notes are
canonical and every lecture links to them.

> **A note on intent.** This material is compiled for defensive understanding —
> knowing how attacks work is how you build systems that resist them. Test only
> systems you own or are explicitly authorized to assess.
