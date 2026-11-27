---
courseCode: "CS 224U"
school: "Stanford"
schoolFull: "Stanford University"
title: "Natural Language Understanding"
description: "Making machines understand language: distributed word representations and vector-space models, similarity and reweighting, dimensionality reduction, and supervised sentiment analysis from tokenization through neural classifiers."
term: "Spring 2021"
discipline: "Computer Science"
status: "in-progress"
heroIcon: "ChatText"
source:
  author: "Aditya Saligrama"
  authorUrl: "https://saligrama.io"
  repoUrl: "https://github.com/saligrama/notes"
  siteUrl: "https://saligrama.io/notes"
  license: "No open license — notes are linked and summarized here, never copied. All credit to the original author."
books:
  - title: "Speech and Language Processing (3rd ed. draft)"
    authors: "Dan Jurafsky & James H. Martin"
    url: "https://web.stanford.edu/~jurafsky/slp3/"
    free: true
    note: "The free standard NLP textbook — vector semantics, classification, and neural methods chapters map onto this course."
  - title: "CS224U course code repository"
    authors: "Christopher Potts"
    url: "https://github.com/cgpotts/cs224u"
    free: true
    note: "The official, open course code — notebooks for every method covered."
links:
  - title: "Original CS 224U notes (GitHub)"
    url: "https://github.com/saligrama/notes/tree/main/CS224U"
    type: "notes"
    note: "The source this compilation links into. The published notes cover the opening lectures."
  - title: "Rendered notes at saligrama.io"
    url: "https://saligrama.io/notes"
    type: "notes"
    note: "The author's preferred reading experience."
  - title: "Stanford CS 224U course site"
    url: "https://web.stanford.edu/class/cs224u/"
    type: "course"
    note: "Public course materials, slides, and the full code repo."
units:
  - title: "Vector-Space Models"
    icon: "VectorThree"
    summary: "The distributional hypothesis made computational: representing word meaning as vectors of co-occurrence counts, comparing them (Euclidean vs cosine), reweighting raw counts (PMI, TF-IDF) so frequent words don't dominate, and compressing with dimensionality reduction."
    lectures:
      - title: "Course Overview"
        date: "2021-03-29"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS224U/2021-03-29-course-overview.md"
        keyIdeas:
          - "NLU spans vector-space models, sentiment, contextual representations, grounded generation, relation extraction, and inference."
          - "The field is powerful and heavily used in industry, but far from solved — big breakthroughs remain."
      - title: "Vector-Space Models"
        date: "2021-03-31"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS224U/2021-03-31-vector-space-models.md"
        keyIdeas:
          - "Meaning is modeled as co-occurrence: word×word, word×document, or word×discourse-context matrices."
          - "Cosine similarity compares direction rather than magnitude, so it's robust to frequency differences."
          - "Reweighting (observed/expected, PMI, positive PMI, TF-IDF) suppresses uninformative high-frequency terms before dimensionality reduction."
  - title: "Supervised Sentiment Analysis"
    icon: "Smiley"
    summary: "A concrete end-to-end task: sentiment classification. Tokenization choices (sentiment-aware beats naïve whitespace), feature representations from n-grams up, hyperparameter search, and moving from linear classifiers to RNNs."
    lectures:
      - title: "Supervised Sentiment Analysis"
        date: "2021-04-12"
        sourceUrl: "https://github.com/saligrama/notes/blob/main/CS224U/2021-04-12-sentiment.md"
        keyIdeas:
          - "Tokenization matters: a sentiment-aware tokenizer that keeps emoticons and negation outperforms plain whitespace splitting."
          - "Features range from bag-of-words n-grams to learned representations; hyperparameter search tunes the pipeline."
          - "RNN classifiers move beyond fixed features to model word order and context."
lastUpdated: 2026-07-30
visible: true
---

## Why this course

Natural language understanding is where machine learning meets meaning. CS 224U
starts from the oldest idea in computational semantics — that a word is known by
the company it keeps — and builds it into vector-space models, then turns to a
concrete supervised task, sentiment analysis, to ground the methods in practice.

This compilation covers the lecture notes published in
[Aditya Saligrama's notes repo](https://github.com/saligrama/notes/tree/main/CS224U),
which span the opening lectures of the course — hence the **in-progress** status.
Summaries are original writing; the notes are canonical and every lecture links
to them. The [course code repo](https://github.com/cgpotts/cs224u) is fully open
if you want to run every method yourself.
