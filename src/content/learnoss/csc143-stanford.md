---
courseCode: "CS 143"
school: "Stanford"
schoolFull: "Stanford University"
title: "Compilers"
description: "How a program becomes machine code: lexical analysis with regular expressions and finite automata, context-free grammars and parsing, abstract syntax trees, and semantic analysis with type checking — built around the COOL teaching language."
term: "Spring 2022"
discipline: "Computer Science"
status: "live"
heroIcon: "BracketsCurly"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Crafting Interpreters"
    authors: "Robert Nystrom"
    url: "https://craftinginterpreters.com/"
    free: true
    note: "The best free way to internalize this material: build two complete interpreters, with every line explained."
  - title: "Compilers: Principles, Techniques, and Tools (the Dragon Book)"
    authors: "Aho, Lam, Sethi & Ullman"
    url: "https://suif.stanford.edu/dragonbook/"
    free: false
    note: "The classic reference for the theory half — automata, grammars, parsing algorithms."
links:
  - title: "Original CS 143 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS143"
    type: "notes"
    note: "The source this compilation links into."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 143 course site"
    url: "https://web.stanford.edu/class/cs143/"
    type: "course"
    note: "The current offering — the COOL compiler project (lexer → parser → type checker → codegen) is public."
  - title: "Compiler Explorer"
    url: "https://godbolt.org"
    type: "tool"
    note: "Watch real compilers translate your code — the fastest way to build intuition for code generation."
units:
  - title: "What a Compiler Is"
    icon: "Stack"
    summary: "The pipeline — lexing, parsing, semantic analysis, optimization, code generation — and why intermediate representations descend from source-level abstraction toward the machine. Plus the economics of language design: why there are so many languages and why popular ones ossify."
    lectures:
      - title: "Introduction: Compiler Structure"
        date: "2022-03-29"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-03-29-intro.md"
        keyIdeas:
          - "Interpreters run programs (Python, Ruby); compilers translate them (C, Rust); JITs like Java and JavaScript do both."
          - "Five phases: lexical analysis → parsing → semantic analysis → optimization → code generation."
          - "Compilers translate through successively lower intermediate representations — each level exposes details (registers, memory layout) while obscuring meaning (classes, loops)."
      - title: "Language Design & the COOL Language"
        date: "2022-03-31"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-03-31-language-design-cool.md"
        keyIdeas:
          - "Languages are adopted to fill a void, and programmer training is the dominant cost — so popular languages are rarely replaced and become ossified."
          - "Abstraction is the through-line: via compilers, functions, modules, and classes."
          - "COOL (Classroom Object Oriented Language) packs abstraction, static typing, inheritance, and memory management into something implementable in a quarter — dispatch works through vtables."
  - title: "Lexical Analysis"
    icon: "TextT"
    summary: "Turning a character stream into tokens: token classes, lexemes, and the regular-expression-to-finite-automaton pipeline that makes lexer generators possible. Includes the classic 'crimes' — FORTRAN's insignificant whitespace and PL/I's unreserved keywords."
    lectures:
      - title: "Lexical Analysis"
        date: "2022-04-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-04-05-lexical-analysis.md"
        keyIdeas:
          - "A token class (identifier, integer, keyword…) corresponds to a set of strings; the lexer returns token–lexeme pairs for the parser."
          - "Lookahead is needed even in simple cases: 'i' vs 'if', '=' vs '=='."
          - "Cautionary tales: FORTRAN ignores whitespace (VAR1 = VA R1), and PL/I keywords aren't reserved — IF ELSE THEN THEN = ELSE is valid."
      - title: "Implementing a Lexer"
        date: "2022-04-07"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-04-07-lexical-analysis-implementation.md"
        keyIdeas:
          - "The pipeline: write token specs as regular expressions, resolve ambiguities (maximal munch, priority order), handle errors with a lowest-priority catch-all."
          - "Regular expressions compile to finite automata; DFAs implement recognition as a simple table lookup per character."
  - title: "Parsing & Syntax-Directed Translation"
    icon: "TreeStructure"
    summary: "Context-free grammars describe nested structure that regular expressions can't; derivations build parse trees, ambiguity has to be designed away, and semantic actions hung on grammar rules construct the abstract syntax tree. Then predictive top-down parsing: LL(1), recursive descent, and left factoring."
    lectures:
      - title: "Parsing & Context-Free Grammars"
        date: "2022-04-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-04-12-parsing.md"
        keyIdeas:
          - "The parser takes the lexer's token stream and produces the program's tree structure."
          - "CFGs generate languages regular expressions can't — matched nesting like balanced parentheses."
          - "A grammar is ambiguous when a string has multiple parse trees; precedence and associativity conventions resolve it."
      - title: "Error Handling & Abstract Syntax Trees"
        date: "2022-04-14"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-04-14-syntax-directed-translation.md"
        keyIdeas:
          - "Syntax-error strategies in increasing ambition: panic mode, error productions, local/global correction — modern compilers mostly panic and resynchronize."
          - "The AST strips the parse tree's derivation noise down to the structure later phases need."
          - "Semantic actions attached to grammar productions compute attributes — the line calculator pattern — and dependency graphs order the evaluation."
      - title: "Top-Down Parsing"
        date: "2022-04-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-04-19-top-down-parsing.md"
        keyIdeas:
          - "Predictive parsers choose a production from the next k tokens without backtracking."
          - "LL(1) table-driven parsing and hand-written recursive descent are the two practical styles."
          - "Left factoring rewrites grammars so alternatives don't share prefixes, making them predictively parseable."
  - title: "Semantic Analysis & Type Checking"
    icon: "CheckSquare"
    summary: "The last line of defense before code generation: scope rules and type checking. In COOL: every class is a type, subclasses can stand in for ancestors, and a well-typed program can't hit runtime type errors."
    lectures:
      - title: "Semantic Analysis & Types"
        date: "2022-04-26"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS143/2022-04-26-semantic-analysis.md"
        keyIdeas:
          - "Semantic analysis catches what parsing can't: scope violations and type inconsistencies."
          - "In COOL, x : A can hold a B iff A is an ancestor of B — subtype substitutability."
          - "Type safety means well-typed programs cannot produce runtime type errors; checking verifies declared types, inference derives them."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Compilers is the course where theory earns its keep: regular expressions and
automata become your lexer, context-free grammars become your parser, and type
theory becomes the thing standing between your users and runtime crashes.
Even if you never build a compiler professionally, this is where you learn how
the tools you use every day actually understand your code.

This compilation covers the eight lectures published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS143)
— the front half of the compiler (through semantic analysis), matching the
first three parts of the classic COOL compiler project. Summaries are original
writing; the notes are canonical and every lecture links to them. Pair with
*Crafting Interpreters* (free) to build the back half.
