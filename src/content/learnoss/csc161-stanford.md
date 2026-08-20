---
courseCode: "CS 161"
school: "Stanford"
schoolFull: "Stanford University"
title: "Design and Analysis of Algorithms"
description: "The algorithmic toolkit and how to reason about it: asymptotic analysis, divide and conquer, randomized algorithms, sorting bounds, hashing, dynamic programming, and greedy algorithms — with correctness proofs, not just code."
term: "Winter 2022"
discipline: "Computer Science"
status: "live"
heroIcon: "ChartLineUp"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Algorithms"
    authors: "Jeff Erickson"
    url: "https://jeffe.cs.illinois.edu/teaching/algorithms/"
    free: true
    note: "A beloved free algorithms textbook — recursion, dynamic programming, and graphs done with real rigor and wit."
  - title: "Introduction to Algorithms (CLRS)"
    authors: "Cormen, Leiserson, Rivest & Stein"
    url: "https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/"
    free: false
    note: "The comprehensive reference that mirrors this course's structure section for section."
links:
  - title: "Original CS 161 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS161"
    type: "notes"
    note: "The source this compilation links into. Later graph lectures are handwritten PDFs in the repo."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 161 course site"
    url: "https://stanford-cs161.github.io/winter2022/"
    type: "course"
    note: "Public lecture notes and problem sets."
  - title: "VisuAlgo"
    url: "https://visualgo.net"
    type: "tool"
    note: "Animated visualizations of sorting, hashing, graphs, and dynamic programming — great for building intuition."
units:
  - title: "Foundations: Divide & Conquer, Asymptotics"
    icon: "Function"
    summary: "The starting toolkit: worst-case and asymptotic analysis (Big-O, Ω, Θ), and divide-and-conquer as a design pattern — from Karatsuba's fast integer multiplication to merge sort to linear-time selection."
    lectures:
      - title: "Introduction & Karatsuba Multiplication"
        date: "2022-01-03"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-01-03-intro.md"
        keyIdeas:
          - "Divide and conquer splits a problem, solves the pieces recursively, and combines the results."
          - "Karatsuba multiplies n-digit integers with three recursive multiplications instead of four, beating the grade-school O(n²)."
      - title: "Worst-Case & Asymptotic Analysis"
        date: "2022-01-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-01-05-worst-asymptotic-analysis.md"
        keyIdeas:
          - "Worst-case analysis gives guarantees that hold for every input."
          - "Big-O is an upper bound, Ω a lower bound, Θ a tight bound — each has a precise definition you prove against."
          - "Insertion sort is O(n²); merge sort is O(n log n) via divide and conquer."
      - title: "The k-Select Problem"
        date: "2022-01-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-01-12-median-selection.md"
        keyIdeas:
          - "Finding the k-th smallest element is O(n log n) trivially by sorting."
          - "Median-of-medians selection achieves O(n) — a clever divide-and-conquer that guarantees a good pivot."
  - title: "Randomization & Sorting Bounds"
    icon: "DiceFive"
    summary: "What randomness buys and what it can't beat: randomized quicksort's expected performance, the Ω(n log n) lower bound that all comparison sorts obey, and the linear-time non-comparison sorts (counting, radix) that sidestep it."
    lectures:
      - title: "Randomized Algorithms & Quicksort"
        date: "2022-01-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-01-19-randomized-algs-quicksort.md"
        keyIdeas:
          - "Randomized algorithms make coin flips, so we analyze expected running time over the randomness."
          - "Randomized quicksort achieves O(n log n) expected time by picking pivots at random, avoiding worst-case inputs."
      - title: "Sorting Lower Bounds"
        date: "2022-01-24"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-01-24-sorting-lower-bounds.md"
        keyIdeas:
          - "Any comparison-based sort needs Ω(n log n) comparisons — proved via the decision-tree argument."
          - "Counting sort and radix sort break the bound by not comparing elements, achieving O(n) under assumptions on the keys."
  - title: "Hashing"
    icon: "Hash"
    summary: "From direct addressing to hash tables: what a good hash function needs, why random hash families give provable guarantees, and how collisions are handled."
    lectures:
      - title: "Hashing"
        date: "2022-01-31"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-01-31-hashing.md"
        keyIdeas:
          - "Direct addressing is O(1) but wastes space; hashing maps a large key universe into a small table."
          - "A random hash function spreads keys uniformly; hash families give expected-O(1) operations provably."
          - "Collision handling and load factor determine real-world performance."
  - title: "Dynamic Programming"
    icon: "Table"
    summary: "Solving problems by remembering subproblems: the memoization-vs-bottom-up framing on Fibonacci, shortest paths via Bellman-Ford and Floyd-Warshall, and the classic applications — longest common subsequence and knapsack."
    lectures:
      - title: "Dynamic Programming"
        date: "2022-02-14"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-02-14-dynamic-programming.md"
        keyIdeas:
          - "DP applies when subproblems overlap and have optimal substructure — Fibonacci makes the memoization win obvious."
          - "Top-down (memoized recursion) and bottom-up (fill a table) are two implementations of the same idea."
          - "Bellman-Ford handles negative edges where Dijkstra can't; Floyd-Warshall solves all-pairs shortest paths."
      - title: "Applications of Dynamic Programming"
        date: "2022-02-16"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-02-16-dp-applications.md"
        keyIdeas:
          - "Longest common subsequence fills a 2D table comparing prefixes — the template for edit-distance-style problems."
          - "Knapsack comes in unbounded and 0/1 flavors, each with its own recurrence."
          - "The DP recipe: define the subproblem, write the recurrence, order the evaluation, read off the answer."
  - title: "Greedy Algorithms"
    icon: "Path"
    summary: "When taking the locally best choice yields a globally optimal answer — and how to prove it. The cautionary case (greedy fails on unbounded knapsack) versus the success (activity selection), with the exchange-argument proof technique."
    lectures:
      - title: "Greedy Algorithms"
        date: "2022-02-23"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS161/2022-02-23-greedy-algorithms.md"
        keyIdeas:
          - "Greedy works only when a local optimum is provably part of a global optimum — not always."
          - "The standard proof is an exchange argument: show the greedy choice can replace part of any optimal solution."
          - "Activity selection is the canonical greedy success; unbounded knapsack is the canonical greedy failure."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Algorithms is where computer science becomes a way of thinking: not just knowing
that quicksort is fast, but proving it; not just using a hash table, but
understanding the randomness that makes it reliable. CS 161 pairs the standard
toolkit — divide and conquer, randomization, dynamic programming, greedy — with
the analysis and correctness proofs that tell you *why* each one works.

This compilation covers the markdown lectures published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS161),
organized into five units. The course's graph-algorithms lectures (BFS/DFS,
strongly connected components, Dijkstra, minimum spanning trees) are handwritten
PDFs in the repo — linked from the source above rather than summarized here.
Summaries are original writing; the notes are canonical and every lecture links
to them.
