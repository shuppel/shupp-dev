---
courseCode: "CS 251"
school: "Stanford"
schoolFull: "Stanford University"
title: "Blockchain and Cryptocurrency Technologies"
description: "Where cryptography, distributed systems, and economics meet: Bitcoin mechanics and script, wallets and key management, the fundamentals of consensus, Sybil resistance and Nakamoto consensus, Ethereum's world computer, and Solidity smart contracts."
term: "Autumn 2022"
discipline: "Computer Science"
status: "live"
heroIcon: "Coins"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Bitcoin and Cryptocurrency Technologies"
    authors: "Narayanan, Bonneau, Felten, Miller & Goldfeder"
    url: "https://bitcoinbook.cs.princeton.edu/"
    free: true
    note: "The free Princeton textbook — the standard rigorous introduction to how Bitcoin actually works."
  - title: "Mastering Ethereum"
    authors: "Andreas M. Antonopoulos & Gavin Wood"
    url: "https://github.com/ethereumbook/ethereumbook"
    free: true
    note: "Open-source book covering the EVM, accounts, gas, and smart contracts — pairs with the Ethereum and Solidity units."
links:
  - title: "Original CS 251 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS251"
    type: "notes"
    note: "The source this compilation links into."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 251 course site"
    url: "https://cs251.stanford.edu"
    type: "course"
    note: "Dan Boneh's course — public lecture slides and materials."
  - title: "evm.codes — EVM opcode reference"
    url: "https://evm.codes"
    type: "reference"
    note: "Interactive reference for every EVM opcode and its gas cost, referenced in the Ethereum unit."
units:
  - title: "Bitcoin Mechanics"
    icon: "CurrencyBtc"
    summary: "What a blockchain is (a public, append-only, safe, live data structure) and how Bitcoin realizes it: the consensus layer, block headers and the UTXO model, transaction validation, the stack-based Bitcoin Script, transaction types (P2PKH, P2SH, multisig), and segregated witness."
    lectures:
      - title: "Introduction: What Is a Blockchain?"
        date: "2022-09-26"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS251/2022-09-26-intro.md"
        keyIdeas:
          - "The consensus layer is a public append-only structure with persistence, safety, liveness, and open participation."
          - "Consensus is hard because of network delays, partitions, crashes, and malicious participants."
          - "A blockchain computer runs decentralized applications whose code and state live on chain."
      - title: "Bitcoin Mechanics"
        date: "2022-09-28"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS251/2022-09-28-bitcoin-mechanics.md"
        keyIdeas:
          - "Miners collect transactions in a mempool; every ~10 minutes a 'random' miner's block wins and earns the coinbase reward."
          - "Bitcoin tracks unspent transaction outputs (UTXOs); a transaction is valid if ScriptSig|ScriptPK returns true and inputs cover outputs."
          - "Bitcoin Script is a non-Turing-complete stack machine; P2PKH, P2SH, and multisig are built from its opcodes; SegWit fixes signature malleability."
      - title: "Bitcoin Scripts & Wallets"
        date: "2022-10-03"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS251/2022-10-03-bitcoin-scripts-and-wallets.md"
        keyIdeas:
          - "Wallets generate and store secret keys, post and verify transactions, and show balances — lose the key, lose the funds."
          - "Wallet types trade convenience for security: cloud, software, hardware, paper, brain."
          - "Hardware wallets back up via a 24-word seed from which all keys are recomputed."
  - title: "Consensus"
    icon: "UsersThree"
    summary: "The theory under the coin: the Byzantine Generals problem and its generalization, adversary and network models (synchronous, asynchronous, partial synchrony), state-machine replication, and the Streamlet family of protocols built up from insecure to secure."
    lectures:
      - title: "Fundamentals of Consensus"
        date: "2022-10-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS251/2022-10-05-consensus.md"
        keyIdeas:
          - "The Byzantine Generals problem: loyal generals must agree on one action despite traitors, including a possibly-traitorous commander."
          - "Adversaries range from crash to omission to Byzantine faults; networks range from synchronous to partially synchronous (GST)."
          - "State-machine replication makes it multi-shot; Streamlet shows how adding notarization and a three-block finalization rule turns an insecure protocol into a secure one."
      - title: "Consensus on the Internet"
        date: "2022-10-10"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS251/2022-10-10-internet-consensus.md"
        keyIdeas:
          - "Open participation invites Sybil attacks — one node faking many identities — so protocols need Sybil resistance."
          - "Proof-of-work, proof-of-stake, and proof-of-space/time are the three main resistance mechanisms."
          - "Nakamoto consensus (mine on the longest chain, confirm k-deep) is secure against a Byzantine adversary with β < 1/2 under synchrony."
  - title: "Ethereum & Smart Contracts"
    icon: "CurrencyEth"
    summary: "From programmable money to a world computer: why Bitcoin's model can't maintain rich state, Ethereum as a state-transition system, the EVM's accounts and gas economics (including EIP-1559 and fee burning), and writing contracts in Solidity — with the visibility, storage, and security gotchas."
    lectures:
      - title: "Ethereum"
        date: "2022-10-17"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS251/2022-10-17-ethereum.md"
        keyIdeas:
          - "Bitcoin can't enforce global rules on assets (e.g. rate limits); Ethereum's transactions execute whole programs instead of UTXO swaps."
          - "The EVM is a stack machine with jumps (so loops), owned vs contract accounts, and persistent vs volatile memory; every instruction costs gas."
          - "EIP-1559 sets a per-block baseFee that adjusts with congestion and is burned — aligning incentives and making ETH deflationary under load."
      - title: "Solidity"
        date: "2022-10-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS251/2022-10-19-solidity.md"
        keyIdeas:
          - "Solidity compiles to EVM bytecode; everything is a contract, interfaces are degenerate contracts, and inheritance composes them."
          - "Function visibility (external/public/private/internal) and mutability (view/pure) control access and gas cost; tx.origin ≠ msg.sender in a call chain."
          - "Contract storage lives in the public S[] array — contracts cannot keep secrets."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Blockchains are a genuinely interdisciplinary systems topic: cryptography for
the signatures and hashes, distributed systems for the consensus, and economics
for the incentives that keep everyone honest. CS 251 covers all three, building
from Bitcoin's spare UTXO model up through the consensus theory that secures it
and on to Ethereum's programmable world computer.

This compilation covers the seven lectures published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS251),
organized into three units. Summaries are original writing; the notes are
canonical and every lecture links to them. The cryptographic background the
course assumes is developed in the [CS 255 compilation](/learnoss/csc255-stanford).
