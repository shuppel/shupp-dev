# Shupp.Dev - Professional Portfolio & Blog

A professional portfolio and blog website built with Astro, featuring a playful FollowingBear SVG animation that follows cursor movements.

## Features

- Responsive design for all devices
- Interactive FollowingBear SVG animation
- Professional portfolio showcase
- Blog with category filtering
- Modern UI with clean design

## Project Structure

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── FollowingBear.astro     # Interactive bear SVG animation
│   │   ├── Header/
│   │   │   └── Navigation.astro    # Site navigation
│   │   └── Footer/
│   │       └── Footer.astro        # Site footer
│   ├── layouts/
│   │   └── Layout.astro            # Main layout template
│   └── pages/
│       ├── index.astro             # Homepage
│       ├── about.astro             # About page
│       ├── portfolio.astro         # Portfolio page
│       ├── blog.astro              # Blog listing page
│       └── blog/
│           └── ai-in-product-management.astro  # Sample blog post
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
- CSS - Custom styling with modern CSS features
- JavaScript - For interactive elements like the FollowingBear

## Getting Started

1. Clone this repository
2. Install dependencies with `npm install`
3. Start the development server with `npm run dev`
4. Navigate to `localhost:4321` in your browser

## Customization

- Update personal information in the website content
- Replace placeholder images with your own project images
- Add your own blog posts in the `src/pages/blog/` directory
- Modify colors and styling in the CSS variables in `src/layouts/Layout.astro`

## Deployment

This site can be deployed on any static hosting service like Netlify, Vercel, or GitHub Pages.

## License

MIT