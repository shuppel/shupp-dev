---
title: "Shupp: Medium-Light Handwritten Font"
description: "A handwritten display font created from personal handwriting, featuring whimsical character and authentic character design"
projectDate: 2025-12-18
completed: true
technologies: ["Typography", "Font Design", "Adobe Illustrator", "FontForge", "OTF"]
featured: true
image: "/images/projects/shupp_specimen.png"
githubUrl: "https://github.com/Thoughtful-App-Co/fonts"
---

## Overview

Shupp is a handwritten display font born from my literal handwriting—a project that consumed approximately 40 hours of initial design work plus 16 hours of retooling and republishing. This font captures that specific energy: slightly aloof, whimsical, daydreaming yet staying busy. It's the aesthetic of quick jotting, capturing thoughts as they strike you.

## The Process

The creation of Shupp was an intentional analog-to-digital journey:

- **Hand Design**: Started with graph and lined paper, hand-written with a Sharpie 1pt ball point pen to capture authentic letterforms
- **Documentation**: Used a phone and ring light to photograph each character
- **Digitization**: Traced and expanded in Adobe Illustrator across 96 artboards with detailed edits to ensure consistency and refinement
- **Font Compilation**: Used FontForge to assemble the final typeface—and yes, I used Claude to help debug SVG issues when FontForge got finicky
- **Publishing**: Published on DaFont and dogfooded across shupp.dev and Thoughtful App

The collaborative element with AI in the SVG workflow proved invaluable without compromising the handcrafted essence of the project.

## Design Philosophy

Shupp embodies a particular creative moment—that feeling when you're jotting down a thought quickly, when the idea strikes. It's a bit entropic, reflecting the natural variation in handwriting, yet refined enough for professional use. The medium-light weight keeps it readable while maintaining its whimsical character.

## Current Usage

The font is used throughout shupp.dev and Thoughtful App for:

- **H1 and H2 headings**: Main page titles and section headers
- **Site logo**: The "shupp.dev" wordmark in the navigation
- **Brand Identity**: Establishing a distinctive, personal visual voice

## Technical Details

- **Format**: OpenType (.otf)
- **Weight**: Medium-Light
- **Character Coverage**: 96 artboards of meticulously designed characters
- **License**: Open source
- **Repository**: Available on GitHub under the Thoughtful App Co. organization

## Installation

The font can be loaded via CSS `@font-face`:

```css
@font-face {
  font-family: 'Shupp';
  src: url('/fonts/Shupp.otf') format('opentype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

## What's Next

Ahtan is the next font project in development, inspired by my son's first words. It will be a bubbly, beautiful, and slightly mischievous print font designed for posters—a completely different energy from Shupp's introspective character.
