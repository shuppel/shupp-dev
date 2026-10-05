---
courseCode: "CS 255"
school: "Stanford"
schoolFull: "Stanford University"
title: "Introduction to Cryptography"
description: "The building blocks of secure communication: stream ciphers and pseudorandom functions, message integrity and collision resistance, authenticated encryption, key management and exchange, public-key encryption and digital signatures, certificates, identification and zero-knowledge protocols, and quantum cryptography."
term: "Winter 2022"
discipline: "Computer Science"
status: "live"
heroIcon: "Key"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — these lectures are handwritten and linked here as scanned PDFs, never reproduced. All credit to the original author."
books:
  - title: "A Graduate Course in Applied Cryptography"
    authors: "Dan Boneh & Victor Shoup"
    url: "https://toc.cryptobook.us/"
    free: true
    note: "The free, definitive text by the CS 255 instructor — every topic in this course, rigorously."
  - title: "Crypto 101"
    authors: "Laurens Van Houtven"
    url: "https://www.crypto101.io/"
    free: true
    note: "A free, approachable introduction — good for building intuition before the formal treatment."
links:
  - title: "Original CS 255 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS255"
    type: "notes"
    note: "The source this compilation links into. These lectures are handwritten scans (PDF), one per lecture."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 255 course site"
    url: "https://crypto.stanford.edu/~dabo/cs255/"
    type: "course"
    note: "Dan Boneh's course — public lecture materials and the free applied-cryptography textbook."
units:
  - title: "Symmetric Cryptography"
    icon: "LockKey"
    summary: "Secret-key primitives: stream ciphers, pseudorandom functions, message authentication codes and data integrity, collision resistance, and authenticated encryption that combines confidentiality with integrity. Handwritten lecture scans — open each PDF from the source links."
    lectures:
      - title: "Introduction"
        date: "2022-01-03"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-03-intro.pdf"
      - title: "Stream Ciphers"
        date: "2022-01-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-05-stream-ciphers.pdf"
      - title: "Stream Ciphers, continued"
        date: "2022-01-10"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-10-stream-ciphers.pdf"
      - title: "Pseudorandom Functions"
        date: "2022-01-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-12-pseudorandom-functions.pdf"
      - title: "Data Integrity & MACs"
        date: "2022-01-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-19-data-integrity-macs.pdf"
      - title: "Collision Resistance"
        date: "2022-01-24"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-24-collision-resistance.pdf"
      - title: "Authenticated Encryption"
        date: "2022-01-26"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-26-authenticated-encryption.pdf"
  - title: "Key Management & Public-Key Cryptography"
    icon: "Key"
    summary: "Moving from shared secrets to public keys: key management, the mathematics of key exchange, public-key encryption schemes, digital signatures, and the certificate infrastructure that binds keys to identities. Handwritten lecture scans."
    lectures:
      - title: "Key Management"
        date: "2022-01-31"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-01-31-key-management.pdf"
      - title: "Key Exchange Math"
        date: "2022-02-02"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-02-02-key-exchange-math.pdf"
      - title: "Public-Key Encryption"
        date: "2022-02-07"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-02-07-public-key-encryption.pdf"
      - title: "PKE Schemes"
        date: "2022-02-09"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-02-09-pke-schemes.pdf"
      - title: "Digital Signatures"
        date: "2022-02-14"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-02-14-digital-signatures.pdf"
      - title: "Certificates"
        date: "2022-02-16"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-02-16-certificates.pdf"
  - title: "Protocols & the Quantum Frontier"
    icon: "Atom"
    summary: "Interactive cryptography and what comes next: identification protocols, key-exchange protocols, zero-knowledge proofs, and quantum cryptography. Handwritten lecture scans."
    lectures:
      - title: "Identification Protocols"
        date: "2022-02-23"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-02-23-id-protocols.pdf"
      - title: "Key Exchange Protocols"
        date: "2022-02-28"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-02-28-key-exchange-protocols.pdf"
      - title: "Zero-Knowledge Protocols"
        date: "2022-03-02"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-03-02-zero-knowledge-protocols.pdf"
      - title: "Quantum Cryptography"
        date: "2022-03-07"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS255/2022-03-07-quantum-cryptography.pdf"
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Cryptography is the science of adversarial trust — how to communicate securely
when someone is trying to listen, tamper, or impersonate. CS 255 builds it from
the ground up: symmetric primitives, the leap to public-key cryptography,
signatures and certificates, and the interactive protocols (zero-knowledge, key
exchange) that power everything from TLS to blockchains. It's the direct
prerequisite intuition for the [CS 251 compilation](/learnoss/csc251-stanford).

These lectures in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS255)
are **handwritten scans** (one PDF per lecture), so this compilation is a
structured index into them; each entry links straight to the original PDF. Dan
Boneh's free *Graduate Course in Applied Cryptography* below is the definitive
written companion.
