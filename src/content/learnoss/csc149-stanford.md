---
courseCode: "CS 149"
school: "Stanford"
schoolFull: "Stanford University"
title: "Parallel Computing"
description: "Writing programs that scale across cores, vector lanes, GPUs, and clusters: SIMD and multithreading, parallel programming models, work distribution, locality and contention, CUDA, Spark, and cache coherence."
term: "Autumn 2022"
discipline: "Computer Science"
status: "live"
heroIcon: "Lightning"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Is Parallel Programming Hard, And, If So, What Can You Do About It?"
    authors: "Paul E. McKenney"
    url: "https://mirrors.edge.kernel.org/pub/linux/kernel/people/paulmck/perfbook/perfbook.html"
    free: true
    note: "The free 'perfbook' from a Linux-kernel RCU maintainer — deep on synchronization, memory ordering, and real-world scaling."
  - title: "Programming Massively Parallel Processors"
    authors: "David Kirk & Wen-mei Hwu"
    url: "https://www.sciencedirect.com/book/9780323912310/programming-massively-parallel-processors"
    free: false
    note: "The standard CUDA/GPU-computing text if you want to go deeper than the GPU unit here."
links:
  - title: "Original CS 149 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS149"
    type: "notes"
    note: "The source this compilation links into."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 149 course site"
    url: "https://gfxcourses.stanford.edu/cs149"
    type: "course"
    note: "Full lecture slides and assignments are public — one of the best free parallel computing resources anywhere."
  - title: "ISPC: Intel SPMD Program Compiler"
    url: "https://ispc.github.io"
    type: "tool"
    note: "The SPMD compiler used throughout the course to make SIMD programmable."
  - title: "CUDA C++ Programming Guide"
    url: "https://docs.nvidia.com/cuda/cuda-c-programming-guide/"
    type: "reference"
    note: "NVIDIA's canonical reference for everything in the GPU unit."
units:
  - title: "Why Parallelism, and What Hardware Gives You"
    icon: "Cpu"
    summary: "The free lunch ended: instruction-level parallelism plateaued, so performance now comes from explicit parallelism. Modern chips stack three mechanisms — multiple cores, SIMD vector lanes, and hardware multithreading to hide memory stalls — and understanding them is prerequisite to using them."
    lectures:
      - title: "Introduction: Why Parallelism?"
        date: "2022-09-27"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-09-27-intro.md"
        keyIdeas:
          - "The course's three themes: writing programs that scale, understanding parallel hardware, and thinking about efficiency."
          - "For decades, ILP and clock speed let sequential software get faster for free — that era is over."
          - "Scaling now means the software must expose the parallelism explicitly."
      - title: "A Modern Multi-Core Processor"
        date: "2022-09-29"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-09-29-modern-multicore-processors.md"
        keyIdeas:
          - "Three multipliers on one chip: multiple cores, SIMD lanes within a core, and hardware threads per core."
          - "Memory is the real enemy: caches, prefetching, and multithreading all exist to hide load/store latency."
          - "Latency vs bandwidth is the key distinction — multithreading trades single-thread latency for throughput by keeping the core busy during stalls."
  - title: "Parallel Programming Models"
    icon: "GitFork"
    summary: "The abstractions you write against: SPMD 'gangs' in ISPC that compile to SIMD, shared address space, message passing, and data parallelism — and the four-step discipline of decomposing, assigning, orchestrating, and mapping a parallel program."
    lectures:
      - title: "Parallel Abstractions: ISPC"
        date: "2022-10-04"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-04-parallel-abstractions.md"
        keyIdeas:
          - "An ISPC call spawns a 'gang' of program instances that run the function body concurrently — SPMD as an abstraction."
          - "The gang compiles down to the hardware's SIMD width at compile time; no threads are spawned."
          - "uniform is an optimization hint marking values shared across the gang."
      - title: "Models of Parallel Programming"
        date: "2022-10-06"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-06-parallel-models.md"
        keyIdeas:
          - "Three canonical models: shared address space, message passing, and data parallelism (map over collections)."
          - "Creating a parallel program is four decisions: decompose the problem, partition/assign the work, orchestrate the threads, map them to hardware."
  - title: "Performance: Distribution, Locality & Contention"
    icon: "ChartLineUp"
    summary: "Where scalable programs are won or lost: balancing work via static, semi-static, or dynamic assignment; fork-join parallelism and Cilk-style work stealing; minimizing the communication-to-computation ratio; and recognizing inherent versus artifactual communication."
    lectures:
      - title: "Work Distribution & Scheduling"
        date: "2022-10-11"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-11-work-distribution-and-scheduling.md"
        keyIdeas:
          - "Assignment strategies trade overhead for balance: static (free, brittle), semi-static, dynamic (task queues)."
          - "Fork-join (Cilk Plus) expresses recursive parallelism like parallel quicksort naturally."
          - "Work-stealing schedulers let idle workers take from busy workers' queues — balance without central coordination."
      - title: "Locality, Communication & Contention"
        date: "2022-10-13"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-13-locality-communication-and-contention.md"
        keyIdeas:
          - "Communication-to-computation ratio bounds scaling; synchronous sends block, asynchronous sends overlap."
          - "Inherent communication is demanded by the algorithm; artifactual communication comes from implementation choices like block size and layout."
          - "Contention — many processors hitting one resource — serializes 'parallel' programs."
  - title: "GPUs & Data-Parallel Thinking"
    icon: "GraphicsCard"
    summary: "The GPU as a throughput machine: CUDA's thread-block hierarchy and memory model, streaming multiprocessors, and how a kernel launch maps onto hardware. Then the data-parallel vocabulary — map, fold, scan, segmented scan, gather/scatter — that turns irregular problems into parallel ones."
    lectures:
      - title: "GPU Architecture & CUDA"
        date: "2022-10-18"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-18-gpu-architecture-and-cuda.md"
        keyIdeas:
          - "GPUs evolved from rendering pipelines into general throughput processors."
          - "CUDA exposes a hierarchy — threads, blocks, grids — with per-block shared memory and device-global memory."
          - "Streaming multiprocessors schedule warps across sub-cores; syncthreads coordinates within a block."
      - title: "Data-Parallel Architecture"
        date: "2022-10-20"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-20-data-parallel-architecture.md"
        keyIdeas:
          - "A small vocabulary — map, fold, scan, segmented scan, gather/scatter — expresses a huge range of parallel algorithms."
          - "Scan is the surprising workhorse: prefix sums parallelize things that look inherently sequential."
  - title: "Clusters & Coherence"
    icon: "Network"
    summary: "Scaling past one machine and back down to one cache line: MapReduce and Spark's resilient distributed datasets for warehouse-scale computing, then the cache-coherence problem and snooping protocols that make shared memory work at all."
    lectures:
      - title: "Spark: Distributed Computing on a Cluster"
        date: "2022-10-25"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-25-spark.md"
        keyIdeas:
          - "MapReduce made warehouse-scale computing programmable but forces every stage through disk."
          - "Spark's RDDs keep data in memory and record lineage, so lost partitions are recomputed rather than replicated."
          - "The RDD constraints (coarse-grained, deterministic transformations) are exactly what makes fault tolerance cheap."
      - title: "Cache Coherence"
        date: "2022-10-27"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS149/2022-10-27-cache-coherence.md"
        keyIdeas:
          - "With per-core caches, the same address can hold different values — coherence defines the invariants that stop that."
          - "Snooping protocols broadcast writes so caches invalidate or update their copies."
          - "Coherence traffic is invisible in source code but very visible in performance — false sharing is the classic trap."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Every performance story of the last twenty years is a parallelism story: more
cores, wider vectors, GPUs, clusters. CS 149 teaches the full stack of it —
what the hardware actually provides, the programming models that abstract it,
and the performance discipline (balance, locality, contention) that separates
programs that scale from programs that merely run on many cores.

This compilation covers the ten lectures published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS149),
organized into five units. Summaries are original writing; the notes are
canonical and every lecture links to them. The
[official course site](https://gfxcourses.stanford.edu/cs149) publishes full
slides and assignments, making this one of the most learnable-for-free systems
courses on the web.
