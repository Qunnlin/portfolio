# Portfolio

A personal portfolio that's also an **in-browser terminal** — type commands to
get around (`cd projects`, `ls`, `cat`, `theme dracula`), or use the styled pages.
Built terminal-first, but everything is a real, prerendered, SEO-friendly site.

## Highlights

- **Two modes from one source.** Every page renders both as a styled page **and**
  as terminal text. A `/` keypress (or the launcher button) opens the full-screen
  terminal; `gui` / Esc switch back.
- **About / CV** as a `git log --graph` (commits, refs, a connector graph).
- **Projects** as a package-manager-style list; **blog** as an RSS/feed-reader inbox.
- **Themes** — 10 of them (dark, light, gruvbox, dracula, nord, tokyo-night,
  catppuccin-mocha, rosé-pine, solarized dark/light), switchable live and persisted.
- **CRT toggle** (`crt`), reduced-motion-aware.
- **Markdown blog** via mdsvex, with reading time, tags, and a real RSS feed.
- **SEO** — canonical/OpenGraph/Twitter + JSON-LD, a prerendered `sitemap.xml` and
  `robots.txt`. The whole site prerenders to static HTML.

## Stack

[SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, runes) · [Bun](https://bun.sh)
(toolchain) · [UnoCSS](https://unocss.dev) · [mdsvex](https://mdsvex.pngwn.io) ·
deployed on Vercel ([adapter-vercel](https://svelte.dev/docs/kit/adapter-vercel),
runtime `nodejs22.x`).

## Develop

```bash
bun install
bun run dev        # http://localhost:5173
bun run check      # type + svelte checks
bun run test       # unit tests for the terminal engine
bun run build      # production build (what Vercel runs)
bun run preview    # preview the production build
```

## Content

Content lives in a few files — no CMS:

- `src/lib/site.ts` — name, tagline, nav, social, and `siteUrl` (canonical origin
  for SEO / sitemap / RSS).
- `src/lib/content.ts` — about copy, the CV (`cv`), and the projects.
- `src/posts/*.md` — blog posts (a markdown file dropped in is picked up automatically).
- `src/app.css` — theme tokens; a new theme is a `[data-theme]` block registered in `theme.ts`.

See [`DEVELOPMENT.md`](./DEVELOPMENT.md) for the architecture and how-to recipes.

## Deploy

Push to GitHub, then import the repo on [vercel.com](https://vercel.com) — SvelteKit
is auto-detected, no config needed. Every push redeploys with per-branch previews.
