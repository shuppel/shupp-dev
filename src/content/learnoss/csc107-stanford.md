---
courseCode: "CS 107"
school: "Stanford"
schoolFull: "Stanford University"
title: "Computer Organization and Systems"
description: "How programs really run on hardware: integer and character representations, bitwise operations, C pointers and arrays, the stack and heap, generics and function pointers, x86-64 assembly, heap management, and program optimization."
term: "Autumn 2020"
discipline: "Computer Science"
status: "live"
heroIcon: "Binary"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — these lectures are handwritten and linked here as scanned PDFs, never reproduced. All credit to the original author."
books:
  - title: "Computer Systems: A Programmer's Perspective (CS:APP) — resources"
    authors: "Randal E. Bryant & David R. O'Hallaron"
    url: "https://csapp.cs.cmu.edu/"
    free: false
    note: "The textbook CS 107-style courses are built on — data representation, machine code, and optimization. Site hosts free labs and slides."
  - title: "Dive Into Systems"
    authors: "Suzanne J. Matthews, Tia Newhall & Kevin C. Webb"
    url: "https://diveintosystems.org/"
    free: true
    note: "A free, modern systems textbook covering C, assembly, memory, and the storage hierarchy — a strong companion here."
links:
  - title: "Original CS 107 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS107"
    type: "notes"
    note: "The source this compilation links into. These lectures are handwritten scans (PDF), one per lecture."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 107 course site"
    url: "https://web.stanford.edu/class/cs107/"
    type: "course"
    note: "Public lecture materials and assignments."
  - title: "Compiler Explorer"
    url: "https://godbolt.org"
    type: "tool"
    note: "See your C compile to x86-64 assembly live — indispensable for the assembly lectures."
units:
  - title: "Data Representation & C"
    icon: "Binary"
    summary: "How bits become numbers, characters, and strings, and how C exposes memory directly through pointers and arrays. Handwritten lecture scans — open each PDF from the source links."
    lectures:
      - title: "Integer Representations"
        date: "2020-09-18"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-09-18-integer-representations.pdf"
      - title: "Bitwise Operations"
        date: "2020-09-21"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-09-21-bitwise-operations.pdf"
      - title: "C Chars & Strings"
        date: "2020-09-25"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-09-25-c-chars-strings.pdf"
      - title: "More C Strings"
        date: "2020-09-28"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-09-28-more-c-strings.pdf"
      - title: "Pointers & Arrays"
        date: "2020-10-02"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-02-pointers-arrays.pdf"
  - title: "Memory & Generics"
    icon: "Stack"
    summary: "The runtime memory model — stack versus heap — and the C idioms for generic code: void pointers and function pointers. Handwritten lecture scans."
    lectures:
      - title: "Stack & Heap"
        date: "2020-10-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-05-stack-heap.pdf"
      - title: "C Generics"
        date: "2020-10-09"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-09-c-generics.pdf"
      - title: "Function Pointers"
        date: "2020-10-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-12-function-pointers.pdf"
  - title: "Assembly"
    icon: "Cpu"
    summary: "Down to the metal: x86-64 assembly — arithmetic and logic, control flow, and the function-call/return convention with the stack. Handwritten lecture scans."
    lectures:
      - title: "Assembly"
        date: "2020-10-16"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-16-assembly.pdf"
      - title: "Assembly: Arithmetic & Logic"
        date: "2020-10-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-19-assembly-arithmetic-logic.pdf"
      - title: "Assembly: Control Flow"
        date: "2020-10-23"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-23-assembly-control-flow.pdf"
      - title: "Assembly: Function Calls, Return, Stack"
        date: "2020-10-26"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-26-assembly-function-calls-return-stack.pdf"
  - title: "Heap Management & Optimization"
    icon: "Gauge"
    summary: "Implementing a heap allocator, and making code fast: how the compiler and the programmer optimize programs. Handwritten lecture scans."
    lectures:
      - title: "Heap Management"
        date: "2020-10-30"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-10-30-heap-management.pdf"
      - title: "Program Optimization"
        date: "2020-11-09"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS107/2020-11-09-program-optimization.pdf"
lastUpdated: 2026-07-30
visible: true
---

## Why this course

CS 107 is the course that demystifies the machine. After it, a pointer is not
scary, assembly is readable, and you know what your C actually does to memory.
It's the bridge between programming and the operating-systems and architecture
courses that follow — and the reason the [CS 111 compilation](/learnoss/csc111-stanford)
feels concrete instead of abstract.

These lectures in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS107)
are **handwritten scans** (one PDF per lecture), so this compilation is a
structured index: the units and lecture titles map the course, and each entry
links straight to the original PDF. The free *Dive Into Systems* text below
covers the same material in readable prose.
