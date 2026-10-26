---
courseCode: "CS 111"
school: "Stanford"
schoolFull: "Stanford University"
title: "Operating Systems Principles"
description: "How an OS shares one machine among many programs: threads and scheduling, locks and deadlock, virtual memory, file systems, crash recovery, flash storage, protection, and virtual machines."
term: "Spring 2021"
discipline: "Computer Science"
status: "live"
heroIcon: "Cpu"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Operating Systems: Three Easy Pieces (OSTEP)"
    authors: "Remzi H. Arpaci-Dusseau & Andrea C. Arpaci-Dusseau"
    url: "https://pages.cs.wisc.edu/~remzi/OSTEP/"
    free: true
    note: "The best free OS textbook, organized around the same three pillars as CS 111: virtualization, concurrency, persistence."
  - title: "xv6: a simple, Unix-like teaching operating system"
    authors: "Russ Cox, Frans Kaashoek & Robert Morris (MIT)"
    url: "https://pdos.csail.mit.edu/6.1810/2024/xv6/book-riscv-rev4.pdf"
    free: true
    note: "A complete, readable kernel in ~10k lines of C. Read it alongside the virtual memory and file system units."
  - title: "The Little Book of Semaphores"
    authors: "Allen B. Downey"
    url: "https://greenteapress.com/wp/semaphores/"
    free: true
    note: "Free book of concurrency puzzles — perfect practice for the synchronization unit."
  - title: "Operating Systems: Principles and Practice"
    authors: "Thomas Anderson & Michael Dahlin"
    url: "https://ospp.cs.washington.edu/"
    free: false
    note: "The recommended text for Stanford CS 111. Not free, but the classic companion if you want one printed book."
links:
  - title: "Original CS 111 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS111"
    type: "notes"
    note: "The source this course compilation links into — 21 lectures of concise notes."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience: search, math rendering, syntax highlighting."
  - title: "Stanford CS 111 course site"
    url: "https://web.stanford.edu/class/cs111/"
    type: "course"
    note: "The current offering — lecture schedule, assignments, and public course materials."
  - title: "MIT 6.1810: Operating System Engineering"
    url: "https://pdos.csail.mit.edu/6.1810/"
    type: "course"
    note: "MIT's open OS course built on xv6 — labs you can actually do at home for free."
  - title: "OSDev Wiki"
    url: "https://wiki.osdev.org"
    type: "reference"
    note: "Community encyclopedia for people building real operating systems."
  - title: "Linux Kernel documentation"
    url: "https://docs.kernel.org"
    type: "reference"
    note: "See how the concepts in this course look in a production kernel."
units:
  - title: "Threads, Processes & Dispatching"
    icon: "Cpu"
    summary: "The OS's first magic trick: making a fixed number of cores look like an unlimited supply of sequential execution streams. Covers what a thread's execution state is, how processes package threads together, and the context-switch machinery that swaps threads on and off cores."
    diagram: "thread-lifecycle"
    lectures:
      - title: "Threads & Dispatching"
        date: "2021-03-31"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-03-31-threads-dispatching.md"
        keyIdeas:
          - "A thread is a sequential execution stream; a process bundles one or more threads with their execution state (memory, open files, registers, stack)."
          - "Virtualization means one thing can stand in for another indistinguishably — threads virtualize cores."
          - "Threads live in three states — running, ready, blocked — and only the dispatcher moves them between cores."
          - "A context switch saves registers and the stack pointer into the process control block (PCB), then loads the next thread's."
          - "The dispatcher physically starts/stops threads; the scheduler makes the priority decisions."
          - "Unix creates processes with fork()/exec(); Windows with a single CreateProcess call."
  - title: "Concurrency & Synchronization"
    icon: "LockKey"
    summary: "Once threads share state, execution becomes nondeterministic: interleavings you never imagined will happen in production. This unit builds the vocabulary — races, atomic operations, critical sections — then the tools: locks, condition variables, monitors, and how locks are actually implemented on multicore hardware, ending with the four conditions of deadlock."
    lectures:
      - title: "Concurrency"
        date: "2021-04-02"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-02-concurrency.md"
        keyIdeas:
          - "Independent threads are deterministic and reproducible; cooperating threads (shared state) are neither."
          - "A race is when the result depends on which thread finishes last."
          - "Atomic operations run to completion without interruption — the building block for every other guarantee."
          - "Correct systems need both safety (bad things never happen) and liveness (good things eventually happen)."
      - title: "Synchronization"
        date: "2021-04-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-05-synchronization.md"
        keyIdeas:
          - "The 'too much milk' problem shows why ad-hoc flag protocols fail: checking and setting a note aren't atomic together."
          - "A critical section is code only one thread may execute at a time; a mutex enforces it."
          - "A lock has two operations — acquire (wait until free, then take it) and release (free it, wake a waiter)."
      - title: "Shared Memory, Condition Variables & Locks"
        date: "2021-04-07"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-07-shared-memory-condition-variables-locks.md"
        keyIdeas:
          - "Stack locals are private; globals and anything reachable through shared pointers are shared — the programmer decides."
          - "Condition variables let a thread atomically release a lock and block until notified; the condition may still be false on wakeup, so re-check in a loop."
          - "The monitor pattern: one lock per shared data structure, several condition variables, lock on every method entry."
      - title: "Lock Implementation & Deadlock"
        date: "2021-04-09"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-09-lock-impl-deadlocking.md"
        keyIdeas:
          - "Spin locks are built from an atomic swap (read-modify-write) instruction; queue-based locks block waiters instead of burning CPU."
          - "Deadlock requires all four: limited access, no preemption, multiple independent requests (hold-and-wait), and circular waiting."
          - "The practical prevention: impose a global order on lock acquisition to break circularity."
  - title: "Scheduling"
    icon: "Timer"
    summary: "Which thread runs next, and for how long? From FIFO through round-robin to shortest-remaining-processing-time and the priority-decay schedulers real Unix systems use, plus the multicore wrinkles: per-core queues, work stealing, core affinity, and gang scheduling."
    lectures:
      - title: "Single-Core Scheduling"
        date: "2021-04-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-12-scheduling.md"
        keyIdeas:
          - "Goals: minimize response time to a useful result while keeping resources busy and context switches few."
          - "FIFO is simple but lets one thread monopolize a core; round-robin fixes that with time slices (~4ms in Linux)."
          - "SRPT gives the highest priority to the least needy thread — great utilization, but it requires predicting the future."
          - "Real schedulers approximate SRPT with priority queues that decay with recent CPU usage (e.g. 4.4 BSD); Linux 'nice' biases it."
      - title: "Multiprocessor Scheduling"
        date: "2021-04-14"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-14-multiprocessing.md"
        keyIdeas:
          - "A single shared ready queue becomes a contention point — real systems use per-core queues plus work stealing."
          - "Work conservation: no core sits idle while a thread waits somewhere else."
          - "Core affinity keeps a thread near its warm caches; gang scheduling runs a process's threads simultaneously (Linux doesn't)."
  - title: "Linking & Memory Allocation"
    icon: "Package"
    summary: "How a program becomes a process: the linker combines object files, resolves symbols, and fixes addresses; then at runtime the heap allocator manages the unpredictable — free lists, slabs, fragmentation, reference counting, and garbage collection."
    lectures:
      - title: "Linking"
        date: "2021-04-16"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-16-linking.md"
        keyIdeas:
          - "The assembler guesses addresses (everything at 0) and leaves notes; the linker computes the real layout and patches every reference."
          - "Object files carry code/data sections, a symbol table, and unresolved references."
          - "Dynamic linking defers symbol resolution to load time: a jump table maps calls like printf into shared libraries via mmap."
      - title: "Dynamic Storage Management"
        date: "2021-04-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-19-storage-management.md"
        keyIdeas:
          - "Stack freeing is predictable (LIFO); heap freeing is not — so the heap fragments into allocated areas and holes."
          - "Free-list strategies: best fit, first fit, bit maps for fixed-size chunks, and slab allocators with per-size pools."
          - "Reference counting frees at zero pointers but leaks cycles; garbage collection (mark & copy) trades 10–20% runtime and pauses for safety."
  - title: "Virtual Memory"
    icon: "Memory"
    summary: "Every process believes it has a private memory starting at address zero. This unit walks the evolution — load-time relocation, base & bound, segmentation, paging — then demand paging: page faults, page replacement policies, the clock algorithm, and thrashing."
    diagram: "address-translation"
    lectures:
      - title: "Virtual Memory Goals"
        date: "2021-04-21"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-21-virtual-memory.md"
        keyIdeas:
          - "Four goals: multitasking, transparency, isolation, and efficiency."
          - "Load-time relocation (patch every pointer at load) fails on fragmentation, no isolation, and immovable processes."
      - title: "Dynamic Address Translation"
        date: "2021-04-23"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-23-dynamic-address-translation.md"
        keyIdeas:
          - "The MMU translates virtual to physical addresses on every access; the kernel/user PS bit decides who may change it."
          - "Base & bound gives each process a private contiguous region — cheap, but fragmented, unshareable, and stack growth is limited."
          - "Traps are how the OS regains control: save IP and PS bit, branch into kernel code, return with state restored."
      - title: "Segmentation & Paging"
        date: "2021-04-26"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-26-segmentation-paging.md"
        keyIdeas:
          - "Segmentation: variable-length regions (code/data/stack) with per-segment base, bound, and write bits — shareable but fragmenting."
          - "Paging: fixed-size pages (4KB) indexed through a page table — no external fragmentation, but tables get large."
      - title: "Demand Paging"
        date: "2021-04-30"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-04-30-demand-paging.md"
        keyIdeas:
          - "Locality makes it work: keep the active fraction in DRAM, the rest in the backing store; disk is ~100x cheaper, DRAM ~100,000x faster."
          - "A page fault traps to the OS, which fetches the page, sets the present bit, and restarts the instruction (idempotence matters)."
          - "Replacement: LRU is approximated by the clock (second-chance) algorithm using per-page referenced/dirty bits."
          - "Thrashing: when memory is overcommitted, every fault evicts an active page and the system runs at disk speed."
  - title: "Storage Devices"
    icon: "HardDrives"
    summary: "The physics under the file system. Spinning disks: seeks, rotational latency, transfer rates, device registers, interrupts, and DMA. Then flash: erase units, wear-out, the flash translation layer, garbage collection and write amplification — and the open question of nonvolatile memory."
    diagram: "storage-hierarchy"
    lectures:
      - title: "Disks"
        date: "2021-05-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-05-disks.md"
        keyIdeas:
          - "A disk I/O = seek (2–10ms) + rotational latency (~4ms) + transfer (100–150 MB/s) — mechanical delays dominate."
          - "Devices expose registers in physical memory; the OS starts an operation, and an interrupt (or DMA completion) signals readiness."
          - "DMA lets the device move data to/from memory directly instead of the CPU feeding it word by word."
      - title: "Flash Memory"
        date: "2021-05-24"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-24-flash-memory.md"
        keyIdeas:
          - "Flash reads pages but erases whole 256KB units, and each unit survives only ~1k–100k erases (wear-out)."
          - "The flash translation layer (FTL) mimics a disk by virtualizing block numbers so writes go to fresh pages."
          - "Garbage collection causes write amplification: cost ≈ (1+U)/(1−U) at utilization U — segregate hot and cold data."
          - "The trim command exists because the FTL can't otherwise know a block was deleted."
  - title: "File Systems"
    icon: "TreeStructure"
    summary: "Durable named bytes. Inodes and allocation schemes from contiguous extents to linked files (FAT) to the multi-level index of BSD Unix; block caches, free-space bitmaps, block-size trade-offs; and directories as files that map names to i-numbers, with hard and symbolic links."
    lectures:
      - title: "File Systems & Allocation"
        date: "2021-05-07"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-07-file-systems.md"
        keyIdeas:
          - "A file is a named collection of bytes stored durably; the inode is the OS's metadata about it."
          - "Most files are small, but large files hold most bytes and get most I/O — designs must serve both."
          - "Contiguous allocation: fast but fragments and can't grow. Linked files: grow easily but random access is terrible."
      - title: "Real-World FS Structures"
        date: "2021-05-10"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-10-realworld-fs-structures.md"
        keyIdeas:
          - "FAT moves the linked list into a table — random access improves and the table doubles as the free list."
          - "BSD's multi-level index: 12 direct pointers, then indirect and doubly-indirect blocks — small files fast, big files possible."
          - "Block caches absorb most I/O; delayed writes are fast but can lose data in a crash."
          - "Free-space bitmaps give locality; file systems even lie about fullness (~90% shown as 100%) to preserve it."
      - title: "Directories"
        date: "2021-05-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-12-directories.md"
        keyIdeas:
          - "A directory is just a file mapping names to i-numbers; the root is i-number 2."
          - "Looking up /a/b/c alternates inode reads and directory-block reads all the way down."
          - "Hard links are extra directory entries (refcounted in the inode); symlinks are files whose contents are a path."
  - title: "Crash Recovery"
    icon: "ClockCounterClockwise"
    summary: "Crashes can happen between any two writes, and multi-block operations leave the disk inconsistent. Three answers, in increasing elegance: scan-and-repair (fsck), carefully ordered writes, and write-ahead logging — the journaling approach used by ext4, NTFS, and APFS."
    diagram: "journaling-flow"
    lectures:
      - title: "Crash Recovery & Journaling"
        date: "2021-05-14"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-14-crash-recovery.md"
        keyIdeas:
          - "Adding one block to a file touches multiple disk blocks (bitmap + inode) — a crash in between leaves inconsistency."
          - "fsck repairs on reboot but is slow (hours for a full disk), lossy, and can even leak data between files."
          - "Ordered writes maintain invariants (initialize before pointing, nullify before reuse) at the cost of cache performance."
          - "Write-ahead logging records the operation before doing it; replaying the log after a crash restores full integrity fast."
          - "fsync forces a file's data to disk — the primitive applications use to control durability."
  - title: "Protection & Security"
    icon: "ShieldCheck"
    summary: "Preventing accidental and intentional misuse: authenticating principals (passwords, keys, 2FA), authorizing operations via the access matrix — sliced by column into ACLs or by row into capabilities — and enforcing it all from a small security kernel."
    lectures:
      - title: "Protection"
        date: "2021-05-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-19-protection.md"
        keyIdeas:
          - "Three layers: authentication (who are you), authorization (who may do what), enforcement."
          - "Password databases store one-way transforms, never cleartext; 2FA adds a physical factor."
          - "Unix ACLs are the 9 rwx bits for owner/group/all; capabilities attach rights to principals and live on in page tables and share links."
          - "Rights amplification (kernel calls, setuid) lets a callee temporarily exceed the caller's privilege."
  - title: "Virtual Machines"
    icon: "StackSimple"
    summary: "The course's closing move: virtualize the whole computer. Hypervisors run guest OSes in user mode, trapping and simulating privileged instructions; shadow and nested page tables translate guest-physical to machine-physical; and the same idea, made lightweight, becomes containers."
    lectures:
      - title: "Virtual Machines"
        date: "2021-05-28"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS111/2021-05-28-virtual-machines.md"
        keyIdeas:
          - "A VM is a 'process' that thinks it's a computer; the hypervisor implements the illusion for each guest OS."
          - "Trap-and-simulate: most instructions run natively; privileged ones trap into the hypervisor."
          - "Guest virtual → guest physical → machine physical needs hypervisor page maps (Intel VT-x) or shadow page tables."
          - "Modern overhead: under 5% CPU-bound, ~30% I/O-bound; VMware's founding insight resurrected a 1960s idea."
          - "Containers are lightweight VMs sharing one kernel — virtualization facilities without whole-OS duplication."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Operating systems is where software stops being abstract. Every language runtime,
database, and web server you'll ever use is built on the ideas in this course:
threads and the schedulers that juggle them, virtual memory and the page tables
behind every pointer dereference, file systems and the crash-recovery machinery
that keeps your data alive.

This LearnOSS compilation is built on the openly published lecture notes that
[Aditya Saligrama](https://saligrama.io) took in Stanford's **CS 111: Operating
Systems Principles** (Spring 2021) — 21 lectures, compressed and organized here
into ten study units. The summaries and key ideas on this page are original
writing; the notes themselves remain the canonical source, and every lecture
links straight to them.

## How to use this resource

1. **Follow the units in order.** The course builds deliberately: concurrency
   before scheduling, address translation before demand paging, file systems
   before crash recovery.
2. **Read the linked note for each lecture.** The key ideas here tell you what
   to look for; the original notes carry the details, code snippets, and
   diagrams.
3. **Pair each unit with OSTEP.** The free textbook below maps almost
   one-to-one onto these units — when a summary feels too compressed, OSTEP has
   the fifty-page version.
4. **Test yourself against the diagrams.** Before expanding a unit's visual,
   try to draw the thread lifecycle, the address-translation path, or the
   journaling sequence from memory.

Everything referenced on this page is free to read, with one clearly marked
exception in the book list. That's the point of LearnOSS: a world-class OS
education is already on the open web — it just needed compiling.
