---
courseCode: "CS 110L"
school: "Stanford"
schoolFull: "Stanford University"
title: "Safety in Systems Programming"
description: "Why C and C++ keep producing security holes, and how Rust's ownership model turns those bugs into compile errors: memory safety, borrowing, error handling as types, traits, generics, and safe multiprocessing."
term: "Spring 2021"
discipline: "Computer Science"
status: "live"
heroIcon: "ShieldCheck"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "The Rust Programming Language (\"The Book\")"
    authors: "Steve Klabnik & Carol Nichols"
    url: "https://doc.rust-lang.org/book/"
    free: true
    note: "The official, free Rust book — the ownership and borrowing chapters map directly onto this course's core."
  - title: "The Rustonomicon"
    authors: "The Rust Project"
    url: "https://doc.rust-lang.org/nomicon/"
    free: true
    note: "The dark arts of unsafe Rust — read it after the ownership unit to understand what the compiler is protecting you from."
  - title: "Rust by Example"
    authors: "The Rust Project"
    url: "https://doc.rust-lang.org/rust-by-example/"
    free: true
    note: "Runnable examples for every concept in this course — enums, Result, traits, generics."
links:
  - title: "Original CS 110L notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS110L"
    type: "notes"
    note: "The source this compilation links into."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "CS 110L course site"
    url: "https://reberhardt.com/cs110l/"
    type: "course"
    note: "Ryan Eberhardt's course site — full lecture materials, exercises, and the mini-GDB and web server projects, all public."
  - title: "Rust Playground"
    url: "https://play.rust-lang.org"
    type: "tool"
    note: "Run every code idea from these notes in the browser, no install needed."
  - title: "Compiler Explorer"
    url: "https://godbolt.org"
    type: "tool"
    note: "See what the compiler actually does with your Rust and C — useful for the static-analysis discussions."
units:
  - title: "Why Systems Programming Is Dangerous"
    icon: "Warning"
    summary: "The case for the course: subtle C bugs like a signed length passed to strncpy become remote-code-execution holes, and the existing toolbox — sanitizers, fuzzers, static analyzers — can shrink but never close the gap. Rust's bet is that a little extra information in the code makes static analysis tractable."
    lectures:
      - title: "Course Overview: Why Rust?"
        date: "2021-03-30"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-03-30-course-overview.md"
        keyIdeas:
          - "Buffer overflows and use-after-free in C/C++ create massive security holes, up to remote code execution."
          - "A bounds check can pass and still overflow: a signed bytesToCopy of −1 becomes huge when cast to unsigned for strncpy."
          - "Runtime checking is slow, dynamic analysis only sees behavior your inputs trigger, and general static analysis hits the halting problem — Rust's approach is to make static analysis tractable."
      - title: "Fixing C: Dynamic & Static Analysis"
        date: "2021-04-01"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-04-01-fixing-c.md"
        keyIdeas:
          - "Valgrind instruments any binary but can't see stack allocation; LLVM sanitizers (ASan, LeakSan, MSan, UBSan, TSan) instrument source and see more."
          - "Coverage-guided fuzzers (AFL, libfuzzer) mutate inputs and keep the ones that change control flow — powerful, but never a proof of bug-freedom."
          - "Static analysis ranges from linting (clang-tidy) to dataflow analysis, which drowns in false positives and struggles across files."
  - title: "Ownership & Borrowing"
    icon: "HandGrabbing"
    summary: "Rust's core move: every value has exactly one owner, ownership can move or be borrowed, and the value is dropped when its owner leaves scope — all enforced at compile time. This is what lets small pieces of code be verified in isolation."
    lectures:
      - title: "Intro to Rust: Memory Ownership"
        date: "2021-04-06"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-04-06-intro-rust.md"
        keyIdeas:
          - "Good code has pre/post conditions you can reason about in isolation — C compilers can't verify memory-related conditions, Rust's can."
          - "Three ownership rules: every value has one owner, only one owner at a time, and the value drops when the owner goes out of scope."
          - "Assignment moves ownership; borrowing (&) lends access temporarily while the owner keeps the cleanup responsibility."
      - title: "Ownership Mechanics: Drop, Copy & References"
        date: "2021-04-08"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-04-08-ownership.md"
        keyIdeas:
          - "The Drop trait is Rust's destructor; stack-only types get Copy instead, and no type can have both."
          - "Everything is immutable by default — mut is an explicit opt-in, the reverse of C's const."
          - "The borrow rule that prevents data races: unlimited immutable references, or exactly one mutable reference — never both."
  - title: "Abstractions That Keep You Safe"
    icon: "PuzzlePiece"
    summary: "Errors as values instead of exceptions: enums with data, Result and Option, the ? operator, and panics for the unrecoverable. Then traits for shared behavior without inheritance, and generics that cost nothing at runtime."
    lectures:
      - title: "Error Handling"
        date: "2021-04-13"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-04-13-error-handling.md"
        keyIdeas:
          - "C's errno pattern makes errors easy to miss; exceptions make failure modes hard to reason about — any function can throw anything, anytime."
          - "Rust enums carry data, and match must cover every variant — so Result<T, E> makes errors impossible to ignore at the signature level."
          - "The ? operator collapses propagation boilerplate; unwrap/expect convert an Err into a deliberate panic; Option does the same job for null."
      - title: "Traits"
        date: "2021-04-22"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-04-22-traits.md"
        keyIdeas:
          - "Traits inject shared behavior into any type — including standard-library ones — without a superclass, and without inheriting data."
          - "Default method bodies give code reuse; explicit impls give per-type overrides."
          - "The standard traits (Copy, Clone, Drop, Display, Debug, Eq) cover most of what you'd reach for, and #[derive] writes many of them for you."
      - title: "Generics"
        date: "2021-04-27"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-04-27-generics.md"
        keyIdeas:
          - "Generics factor out types with zero runtime cost — the compiler monomorphizes a separate function per concrete type."
          - "Trait bounds (T: PartialOrd) constrain what a generic function may do with its type parameter."
          - "Generic data structures like LinkedList<T> combine with trait-bound impls (T: Display) for conditional functionality."
  - title: "Multiprocessing Without Footguns"
    icon: "TreeStructure"
    summary: "fork() and execvp() are powerful and easy to misuse: nested forks, zombie children, leaked file descriptors. Rust's Command API packages the common cases — output capture, status codes, spawning, pipes — behind an interface that's hard to hold wrong."
    lectures:
      - title: "Multiprocessing"
        date: "2021-04-29"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS110L/2021-04-29-multiprocessing.md"
        keyIdeas:
          - "Classic fork() hazards: accidentally nested forks, children running unintended code, and zombies when waitpid is never called."
          - "The higher-level pattern (like Python's subprocess) survives in Rust as Command: build args, then .output(), .status(), or .spawn()."
          - "Pipes leak file descriptors in C; Rust's Stdio::piped() ties their lifetime to the child — and pre_exec is explicitly unsafe."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

CS 110L is the ideal companion to an operating systems course: it asks why the
systems software we depend on keeps shipping memory-corruption vulnerabilities,
and what a language can do about it. The answer walks through the whole C/C++
hardening toolbox — sanitizers, fuzzers, static analysis — before arriving at
Rust's ownership model, which moves the checking to compile time.

This compilation covers the eight lectures published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS110L),
organized into four units. Summaries and key ideas are original writing; the
notes are canonical and every lecture links to them. The
[course site](https://reberhardt.com/cs110l/) is fully public too — including
the mini-GDB and web-server projects — so you can do the whole course for free.
