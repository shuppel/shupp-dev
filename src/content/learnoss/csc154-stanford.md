---
courseCode: "CS 154"
school: "Stanford"
schoolFull: "Stanford University"
title: "Introduction to the Theory of Computer Science"
description: "The mathematics of what computers can and cannot do: finite automata, the pumping lemma and Myhill–Nerode theorem, streaming algorithms, and Turing machines."
term: "Autumn 2021"
discipline: "Computer Science"
status: "in-progress"
heroIcon: "Graph"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — these lectures are handwritten and linked here as scanned PDFs, never reproduced. All credit to the original author."
books:
  - title: "Models of Computation"
    authors: "Jeff Erickson"
    url: "https://jeffe.cs.illinois.edu/teaching/algorithms/#models"
    free: true
    note: "Free chapters on automata, regular languages, and Turing machines — a rigorous, readable companion."
  - title: "Introduction to the Theory of Computation"
    authors: "Michael Sipser"
    url: "https://math.mit.edu/~sipser/book.html"
    free: false
    note: "The standard theory-of-computation textbook this course follows."
links:
  - title: "Original CS 154 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS154"
    type: "notes"
    note: "The source this compilation links into. These lectures are handwritten scans (PDF)."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 154 course site"
    url: "https://web.stanford.edu/class/cs154/"
    type: "course"
    note: "Public lecture materials for the theory of computation."
units:
  - title: "Automata & Computability"
    icon: "Graph"
    summary: "The published lectures span the course's core: finite automata, the pumping lemma and Myhill–Nerode characterization of regular languages, streaming algorithms, and Turing machines. Handwritten lecture scans — open each PDF from the source links."
    lectures:
      - title: "Finite Automata"
        date: "2021-09-28"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS154/2021-09-28-finite-automata.pdf"
      - title: "Pumping Lemma & Myhill–Nerode"
        date: "2021-10-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS154/2021-10-05-pumping-myhill-nerode.pdf"
      - title: "Streaming Algorithms & Turing Machines"
        date: "2021-10-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS154/2021-10-12-streaming-algorithms-turing-machines.pdf"
lastUpdated: 2026-07-30
visible: true
---

## Why this course

CS 154 asks the deepest questions in the field: not how to compute something, but
whether it can be computed at all, and how efficiently. Finite automata, regular
languages, and Turing machines are the tools for answering them — the theory that
tells you when to stop looking for an algorithm because none exists.

The lectures in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS154)
are **handwritten scans** covering the opening weeks of the course — hence the
**in-progress** status. This compilation is a structured index into those PDFs;
each entry links straight to the original. The free Erickson chapters below
cover the same material in prose.
