---
courseCode: "INTLPOL 268"
school: "Stanford"
schoolFull: "Stanford University"
title: "Hack Lab: Introduction to Cybersecurity"
description: "Where technical security meets the law and policy that govern it: web attacks and network security alongside the ECPA, CFAA, and DMCA; cyberattack anatomy, corporate intrusion, ransomware, the dark web, cryptography, cyber conflict, malware, and government hacking."
term: "Autumn 2021"
discipline: "Cybersecurity Policy"
status: "live"
heroIcon: "Gavel"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Cybersecurity Law, Policy, and Institutions"
    authors: "Jeff Kosseff"
    url: "https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3547103"
    free: true
    note: "A free, widely used casebook covering the CFAA, ECPA, and data-breach law that this course centers on."
  - title: "@War: The Rise of the Military-Internet Complex"
    authors: "Shane Harris"
    url: "https://www.hmhbooks.com/shop/books/at-war/9780544570283"
    free: false
    note: "Narrative background on nation-state cyber conflict, for the geopolitics units."
links:
  - title: "Original INTLPOL 268 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/INTLPOL268"
    type: "notes"
    note: "The source this compilation links into — 18 lectures blending technical and legal material."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford Hack Lab / INTLPOL 268"
    url: "https://cyber.fsi.stanford.edu"
    type: "course"
    note: "Stanford's cyber policy center — context for the course's policy framing."
  - title: "Computer Fraud and Abuse Act (18 U.S.C. § 1030)"
    url: "https://www.law.cornell.edu/uscode/text/18/1030"
    type: "reference"
    note: "The primary statute the course returns to again and again — read the text alongside the case law."
units:
  - title: "Technical Foundations"
    icon: "Terminal"
    summary: "The hands-on security grounding the policy discussions build on: how web requests and single sign-on work, the three families of web attack (do-what-you-want, run-code-in-another-browser, inject-commands), and how the internet's layers actually move a packet."
    lectures:
      - title: "Course Intro & Offensive Security"
        date: "2021-09-20"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-09-20-intro.md"
        keyIdeas:
          - "Hack Lab pairs offensive-security practice with the legal and policy frameworks that regulate it."
      - title: "Web Requests & Attacks"
        date: "2021-09-27"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-09-27-web-requests-attacks.md"
        keyIdeas:
          - "GET/POST, cookies, and single sign-on are the machinery every web attack manipulates."
          - "Three attack families: make the app do what you want, run code in another user's browser (XSS), inject commands the app runs directly."
      - title: "Network Security"
        date: "2021-10-11"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-10-11-network-security.md"
        keyIdeas:
          - "The internet's layers — physical/link, internet, transport, application — each carry their own trust assumptions."
          - "Glue protocols hold the layers together and are frequent attack surfaces."
  - title: "The Law of Computer Access"
    icon: "Scales"
    summary: "The statutes that decide what's legal: the Electronic Communications Privacy Act and its Wiretap, Pen Register, and Stored Communications components; and the Computer Fraud and Abuse Act, traced through the cases (Morris, Nosal, Van Buren) that define 'unauthorized access' — with the DMCA and its impact on security research."
    lectures:
      - title: "Legal Intro & the ECPA"
        date: "2021-09-22"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-09-22-legal-intro-ecpa.md"
        keyIdeas:
          - "The Fourth Amendment plus Congress's response frame electronic privacy in the US."
          - "ECPA splits into the Wiretap Act, the Pen Register Statute, and the Stored Communications Act — each with different protections."
      - title: "ECPA for Private Actors"
        date: "2021-09-29"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-09-29-private-ecpa.md"
        keyIdeas:
          - "ECPA liability reaches private actors, not just the government."
          - "Separate laws govern cookies and consent."
      - title: "The Computer Fraud and Abuse Act"
        date: "2021-10-06"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-10-06-cfaa.md"
        keyIdeas:
          - "The CFAA turns on 'unauthorized access' — a phrase courts have struggled to define."
          - "Key cases: the Morris Worm, US v. Nosal I and II, Facebook v. Power Ventures, hiQ v. LinkedIn."
          - "Van Buren (2021) narrowed 'exceeds authorized access' with the 'gates-up-or-down' framing."
      - title: "CFAA, DMCA & Security Research"
        date: "2021-10-13"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-10-13-cfaa-dmca-security-research.md"
        keyIdeas:
          - "Van Buren reshaped the legal risk landscape for security researchers."
          - "The DMCA's anti-circumvention sections can criminalize research the CFAA wouldn't reach."
      - title: "Data Security & Breach Notification Laws"
        date: "2021-10-20"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-10-20-data-security-laws.md"
        keyIdeas:
          - "State breach-notification and data-security laws (California, NY DFS) set the baseline obligations."
          - "Federal enforcement comes via the SEC and the FTC's Fair Information Practice Principles."
          - "Breach litigation increasingly arrives as class actions."
  - title: "Attacks, Actors & Ransomware"
    icon: "Skull"
    summary: "How intrusions actually happen and who runs them: classifying cyber actors and nation-state operations, the Cyber Kill Chain, corporate intrusion via privilege escalation and hash-cracking (EternalBlue), and the ransomware boom — its prosecutions, its victims' liability, and its state-affiliated crews."
    lectures:
      - title: "Anatomy of a Cyberattack"
        date: "2021-10-04"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-10-04-cyberattacks.md"
        keyIdeas:
          - "Cyber actors range from criminals to nation-states, each with distinct motivations and control structures."
          - "The Cyber Kill Chain models the stages of an intrusion."
      - title: "Corporate Intrusion"
        date: "2021-10-25"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-10-25-corporate-intrusion.md"
        keyIdeas:
          - "Privilege escalation moves an attacker up computer privilege levels toward full control."
          - "Password hashes are the target; cracking them is how credentials fall."
          - "EternalBlue is the case study in how a single exploit enables mass intrusion."
      - title: "Ransomware & Foreign Hackers"
        date: "2021-10-27"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-10-27-ransomware-foreign-hackers.md"
        keyIdeas:
          - "The ransomware boom is prosecuted through the CFAA and adjacent statutes."
          - "Victims face liability questions — including whether paying a ransom is itself lawful."
          - "State-affiliated crews (Russia, North Korea's Lazarus, China's APT groups) blur crime and statecraft."
  - title: "Cryptography, Conflict & Malware"
    icon: "LockKey"
    summary: "The technical and geopolitical frontier: cryptography's primitives and the decades of US encryption law, nation-state cyber conflict and the agencies that wage it, the dark web and Tor, the malware taxonomy from rootkits to Stuxnet, government hacking tools, and where all of it is heading."
    lectures:
      - title: "Cryptography"
        date: "2021-11-01"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-11-01-cryptography.md"
        keyIdeas:
          - "Modern cryptography rests on defined key primitives and building blocks with precise security goals."
          - "Encryption's uses span confidentiality, integrity, and authentication."
      - title: "Cyber Conflict"
        date: "2021-11-03"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-11-03-cyber-conflict.md"
        keyIdeas:
          - "Nation-state hacking has motivations, retaliation options, and threat-reduction strategies of its own."
          - "US cyber agencies (CISA) and reports like the Cyberspace Solarium Commission shape doctrine."
      - title: "The Dark Web & Cryptocurrencies"
        date: "2021-11-08"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-11-08-dark-web-cryptocurrencies.md"
        keyIdeas:
          - "Onion routing (Tor) layers encryption so no single relay knows both source and destination."
          - ".onion services host content reachable only through the Tor network."
      - title: "Malware"
        date: "2021-11-15"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-11-15-malware.md"
        keyIdeas:
          - "Malware evolved from simple viruses to modern rootkits (TDL4), self-propagating worms (Stuxnet), and ransomware (Cryptolocker)."
          - "Each class has a distinct propagation and persistence strategy."
      - title: "Government Hacking"
        date: "2021-11-17"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/INTLPOL268/2021-11-17-government-hacking.md"
        keyIdeas:
          - "State hacking ranges from keystroke loggers to remote device exploitation."
          - "Cases like EncroChat, Operation Trojan Shield (Anom), and NSO Group show the reach and controversy of these tools."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Cybersecurity isn't only a technical problem — it's a legal and geopolitical one.
Stanford's Hack Lab is unusual in teaching both halves together: you learn how
web attacks and network intrusions actually work, and in the same breath how the
ECPA, CFAA, and DMCA decide whether that work is lawful. It's the rare course
that puts an exploit and a Ninth Circuit opinion on the same syllabus.

This compilation covers the eighteen lectures published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/INTLPOL268),
organized into four units. Summaries are original writing; the notes are
canonical and every lecture links to them.

> **A note on intent.** The technical material here is compiled for understanding
> and defense, and the course itself is built around the law that governs
> computer access. Test only systems you own or are explicitly authorized to
> assess.
