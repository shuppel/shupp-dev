# Shupp.Dev - Professional Portfolio & Blog

A professional portfolio and blog website built with Astro, featuring a content management system for dynamic content and a modern, responsive design.

## Features

- Responsive design for all devices
- Content Management System (CMS) using Astro Content Collections
- Professional portfolio showcase
- Dynamic blog with category filtering
- Interactive roadmap page
- Modern UI with clean design

## Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BentoGrid.astro
│   │   ├── CredentialBadge.astro
│   │   ├── CredentialsGrid.astro
│   │   ├── RelatedBlogPosts.astro
│   │   ├── RelatedProjects.astro
│   │   ├── StackedCards.astro
│   │   ├── Header/
│   │   │   └── Navigation.astro    # Site navigation
│   │   └── Footer/
│   │       └── Footer.astro        # Site footer
│   ├── content/                    # Content Collections (CMS)
│   │   ├── authors/                # Author profiles
│   │   ├── blog/                   # Blog posts
│   │   ├── credentials/            # Certifications and credentials
│   │   ├── projects/               # Portfolio projects
│   │   ├── roadmap/                # Roadmap items
│   │   └── config.ts               # Content schema definitions
│   ├── layouts/
│   │   └── Layout.astro            # Main layout template
│   └── pages/
│       ├── index.astro             # Homepage
│       ├── about.astro             # About page
│       ├── portfolio.astro         # Portfolio page
│       ├── blog.astro              # Blog listing page
│       ├── blog-bento.astro        # Alternative blog layout
│       ├── roadmap.astro           # Roadmap/future plans
│       └── blog/
│           └── [slug].astro        # Dynamic blog post page
└── package.json
```

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |

## Technologies

- [Astro](https://astro.build) - The web framework for content-driven websites
- [Astro Content Collections](https://docs.astro.build/en/guides/content-collections/) - For content management
- CSS - Custom styling with modern CSS features
- JavaScript - For interactive elements

## Content Management System (CMS)

This site uses Astro Content Collections as a headless CMS for managing content. Here's how to use it:

### Content Types

The site supports the following content types:

1. **Blog Posts** (`/src/content/blog/`)
   - Markdown files for blog posts with frontmatter for metadata
   - Supported fields include title, description, publication date, categories, tags, etc.

2. **Projects** (`/src/content/projects/`)
   - Showcase your professional projects
   - Include details like technologies used, project dates, and links

3. **Author Profiles** (`/src/content/authors/`)
   - Store information about content authors (bio, social links, etc.)
   - Used across the site for attribution and about pages

4. **Roadmap Items** (`/src/content/roadmap/`)
   - Define future plans and track progress
   - Items can be marked as current, upcoming, or future
   - Basic items vs. phase items for different sections

5. **Principles** (`/src/content/principles/`)
   - Core guiding principles for development
   - Displayed on the roadmap page

6. **Credentials** (`/src/content/credentials/`)
   - Store professional certifications and credentials
   - Display badges and certifications on relevant pages

### Content Relationships

The CMS implements content relationships to create a cohesive information architecture:

- Roadmap items can be connected to phases via the `relatedRoadmapItems` field
- Blog posts can be connected to projects via the `relatedProjects` field
- Projects can link to related blog posts via the `relatedBlogPosts` field

These relationships allow for dynamic generation of related content sections throughout the site.

### Adding New Content

To add new content, create a Markdown file in the appropriate directory with the required frontmatter fields. Examples:

#### Blog Post Example:

```md
---
title: My New Blog Post
description: A brief description of the post
pubDate: 2025-05-15
updatedDate: 2025-05-16
author: Erikk Shupp
categories: [Technology, Web Development]
tags: [Astro, CMS]
featured: true
relatedProjects: [portfolio-website]  # Optional related project slugs
---

Your blog post content goes here, written in Markdown format.
```

#### Project Example:

```md
---
title: My Portfolio Project
description: A brief description of the project
projectDate: 2025-04-01
completed: true
technologies: [Astro, CSS, JavaScript]
featured: true
projectUrl: https://example.com
githubUrl: https://github.com/username/project
relatedBlogPosts: [my-blog-post-slug]  # Optional related blog post slugs
---

Detailed description of the project goes here. This can include challenges, solutions, and outcomes.
```

#### Basic Roadmap Item Example:

```md
---
title: New Feature
description: Detailed description of the planned feature
phase: upcoming  # current, upcoming, or future
status: next     # now, next, later, or exploring
order: 3
features:
  - Feature point one
  - Feature point two
  - Feature point three
completedItems:
  - Already completed sub-item
---

Additional details about the roadmap item can go here.
```

#### Roadmap Phase Example:

```md
---
title: Phase 1: Feature Name
description: Detailed description of this development phase
phase: current  # current, upcoming, or future
status: now     # now, next, later, or exploring
order: 1
timeframe: Q2 2025
goals:
  - Goal one
  - Goal two
  - Goal three
relatedRoadmapItems:
  - feature-item-slug  # Connects to specific roadmap items
---

Details about this phase and its significance in the development roadmap.
```

#### Author Profile Example:

```md
---
name: Full Name
title: Professional Title
email: email@example.com
location: City, State
shortBio: Brief tagline or description
longBio: |
  Detailed biography with multiple paragraphs.

  This can span multiple lines and paragraphs.
socialLinks:
  github: https://github.com/username
  linkedin: https://linkedin.com/in/username
  twitter: https://twitter.com/username
skills:
  - Skill One
  - Skill Two
interests:
  - Interest One
  - Interest Two
---
```

### Schema Validation

All content uses Zod schema validation defined in `/src/content/config.ts` to ensure data integrity. Refer to this file for the complete schema of each content type.

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Navigate to `localhost:4321` in your browser

## Customization

- Update author information in the `/src/content/authors/` directory
- Add your own projects in the `/src/content/projects/` directory
- Add blog posts in the `/src/content/blog/` directory
- Update your roadmap in the `/src/content/roadmap/` directory
- Modify colors and styling in the CSS variables in `src/layouts/Layout.astro`

## Deployment

This site can be deployed on any static hosting service like Netlify, Vercel, or GitHub Pages. The site includes a `netlify.toml` file for easy deployment on Netlify.

## License

MIT