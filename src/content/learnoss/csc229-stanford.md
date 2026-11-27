---
courseCode: "CS 229"
school: "Stanford"
schoolFull: "Stanford University"
title: "Machine Learning"
description: "The foundations of machine learning: supervised learning, logistic regression and generalized linear models, generative learning and naive Bayes, kernel methods and support vector machines, deep learning and its optimization, and model selection."
term: "Autumn 2021"
discipline: "Computer Science"
status: "live"
heroIcon: "Brain"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — these lectures are handwritten and linked here as scanned PDFs, never reproduced. All credit to the original author."
books:
  - title: "CS229 official lecture notes"
    authors: "Andrew Ng & Tengyu Ma (Stanford)"
    url: "https://cs229.stanford.edu/main_notes.pdf"
    free: true
    note: "The canonical, free CS229 course notes — the definitive written companion to every topic here."
  - title: "The Elements of Statistical Learning"
    authors: "Hastie, Tibshirani & Friedman"
    url: "https://hastie.su.domains/ElemStatLearn/"
    free: true
    note: "The free classic on statistical learning — deeper theory behind GLMs, kernels, and model selection."
links:
  - title: "Original CS 229 notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS229"
    type: "notes"
    note: "The source this compilation links into. These lectures are handwritten scans (PDF), one per lecture."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 229 course site"
    url: "https://cs229.stanford.edu"
    type: "course"
    note: "Andrew Ng's course — one of the most-used free ML resources in the world, with full notes and problem sets."
  - title: "CS229 lectures on YouTube"
    url: "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU"
    type: "video"
    note: "Andrew Ng's full lecture videos — pair with these notes for the complete course."
units:
  - title: "Supervised Learning Foundations"
    icon: "ChartScatter"
    summary: "The setup and the workhorse models: the supervised learning framework, logistic regression, and generalized linear models that unify regression and classification. Handwritten lecture scans — open each PDF from the source links."
    lectures:
      - title: "Introduction"
        date: "2021-09-21"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-09-21-intro.pdf"
      - title: "Supervised Learning Setup"
        date: "2021-09-23"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-09-23-supervised-learning-setup.pdf"
      - title: "Logistic Regression"
        date: "2021-09-28"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-09-28-logistic-regression.pdf"
      - title: "Generalized Linear Models"
        date: "2021-09-30"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-09-30-generalized-linear-models.pdf"
  - title: "Generative Models & Kernels"
    icon: "ChartPieSlice"
    summary: "A different modeling philosophy — model how the data is generated — plus the kernel trick and support vector machines. Handwritten lecture scans."
    lectures:
      - title: "Generative Learning Algorithms"
        date: "2021-10-05"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-10-05-generative-learning-algorithms.pdf"
      - title: "Naive Bayes"
        date: "2021-10-07"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-10-07-naive-bayes.pdf"
      - title: "Kernel Methods & SVM"
        date: "2021-10-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-10-12-kernel-methods-svm.pdf"
  - title: "Deep Learning & Model Selection"
    icon: "Brain"
    summary: "Neural networks, the optimization that trains them, and the discipline of choosing models that generalize. Handwritten lecture scans."
    lectures:
      - title: "Deep Learning"
        date: "2021-10-14"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-10-14-deep-learning.pdf"
      - title: "Deep Learning Optimization"
        date: "2021-10-19"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-10-19-deep-learning-optimization.pdf"
      - title: "Model Selection"
        date: "2021-10-21"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS229/2021-10-21-model-selection.pdf"
lastUpdated: 2026-07-30
visible: true
---

## Why this course

CS 229 is arguably the most influential machine learning course ever taught —
Andrew Ng's lectures introduced a generation to the field. It builds ML from its
statistical foundations: supervised learning, the generalized linear model family,
generative approaches, kernels and SVMs, and neural networks, always with the
math that explains *why* the methods work.

These lectures in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS229)
are **handwritten scans** (one PDF per lecture), so this compilation is a
structured index into them; each entry links straight to the original PDF. The
official CS229 notes and lecture videos below are free and definitive — this
index maps one student's path through them.
