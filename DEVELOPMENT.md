# Development Guide

A personal portfolio site built with SvelteKit (Svelte 5, runes mode), styled
with UnoCSS, packaged with Bun, and deployed on Vercel. It wears a terminal/CLI
aesthetic — headings read like shell commands (`whoami`, `ls ./projects`,
`cat ./contact`) — and ships an in-browser terminal that navigates the site.

A core principle: the routed, styled pages are the substrate and always work
without JavaScript; the terminal is progressive enhancement layered on top and is
never load-bearing. Both render from a single content source so they can't drift.

## Prerequisites

- **Bun** — used as the toolchain (install, dev, build, check). It is the package
  manager (`bun.lock` is committed). Bun is **not** the production runtime.
- **Node.js** — only relevant via Vercel at deploy time. The local machine runs
  Node 26, which `@sveltejs/adapter-vercel` does **not** accept as a default
  runtime (Vercel supports Node 20 / 22 / 24). For that reason the runtime is
  pinned to `nodejs22.x` in `vite.config.ts`, so builds don't depend on the local
  Node version. Note `.npmrc` sets `engine-strict=true`.

## Getting started

Install dependencies:

```bash
bun install
```

Start the dev server:

```bash
bun run dev
```

Serves at <http://localhost:5173/> and hot-reloads on save.

Type-check and run Svelte checks:

```bash
bun run check
```

`bun run check:watch` runs the checks continuously in a separate terminal.

Build for production:

```bash
bun run build
```

With `@sveltejs/adapter-vercel`, the build artifacts are written to
`.vercel/output/` (not `build/` — that generic entry in `.gitignore` is unused
by this adapter). Production builds run on Vercel; `build` is mainly for verifying
the build locally before pushing.

Preview the production build locally:

```bash
bun run preview
```

> The exact scripts are `dev → vite dev`, `build → vite build`,
> `preview → vite preview`, `check → svelte-kit sync && svelte-check --tsconfig
> ./tsconfig.json`, and `prepare → svelte-kit sync || echo ''`. The
> `check:watch` variant runs `svelte-kit sync && svelte-check --tsconfig
> ./tsconfig.json --watch` (full type sync, then watch mode).

## Project structure

```text
.
├── .gitignore           # ignores node_modules, build outputs, env files, Vite timestamps
├── .npmrc               # engine-strict=true
├── bun.lock             # Bun lockfile (Bun is the package manager)
├── package.json         # type: module; dev/build/preview/check scripts
├── tsconfig.json        # extends .svelte-kit/tsconfig.json; strict, moduleResolution: bundler
├── uno.config.ts        # UnoCSS presets, term-* colors, shortcuts
├── vite.config.ts       # SvelteKit + UnoCSS wiring, runes mode, Vercel adapter pin
├── README.md            # high-level overview
├── static/              # static assets served as-is
└── src/
    ├── app.html         # root HTML; sets data-theme + data-mode (pre-paint)
    ├── app.css          # theme tokens: CSS variables per [data-theme]
    ├── app.d.ts         # SvelteKit ambient types + the *.md module declaration
    ├── posts/           # blog posts as markdown (*.md) with frontmatter
    ├── lib/
    │   ├── site.ts      # SINGLE SOURCE OF TRUTH: site info, siteUrl, nav tree (+ isDir)
    │   ├── content.ts   # section/post/project content + render* (styled pages AND terminal)
    │   ├── posts.ts     # blog content layer: loads/sorts posts; reading time
    │   ├── banners.ts   # ASCII-art (figlet) font for terminal headings
    │   ├── theme.ts     # theme registry (10) + apply/persist helpers
    │   ├── mode.ts      # view mode (terminal | gui) + persistence
    │   ├── terminal.ts  # pure terminal command engine (reads site.ts/theme.ts)
    │   ├── terminal.test.ts  # bun test suite for the engine
    │   ├── components/
    │   │   ├── Terminal.svelte       # the terminal UI (full-screen in terminal mode)
    │   │   ├── ThemeSwitcher.svelte  # theme <select> shown in the gui footer
    │   │   └── Seo.svelte            # per-page canonical/OG/Twitter/JSON-LD head
    │   ├── index.ts     # $lib barrel
    │   └── assets/      # favicon.svg, etc.
    └── routes/
        ├── +layout.svelte    # shell; mounts Terminal + ThemeSwitcher; head links
        ├── +layout.ts        # prerender = true (whole site is static)
        ├── +error.svelte     # custom terminal-styled error page (404, etc.)
        ├── +page.svelte      # / (about — cat ./about.txt)
        ├── projects/+page.svelte         # /projects — project listing (dir)
        ├── projects/[slug]/+page.svelte  # /projects/<slug> — a project (load in +page.ts)
        ├── blog/+page.svelte             # /blog — post listing (load in +page.ts)
        ├── blog/[slug]/+page.svelte      # /blog/<slug> — a single post (load in +page.ts)
        ├── blog/rss.xml/+server.ts       # prerendered RSS feed
        ├── contact/+page.svelte          # /contact (cat ./contact.txt)
        ├── impressum/+page.svelte        # /impressum — legal notice (German §5 DDG)
        ├── sitemap.xml/+server.ts        # prerendered sitemap (nav + legal + posts + projects)
        └── robots.txt/+server.ts         # prerendered robots.txt → sitemap
```

The **Impressum** (legally required in Germany) is a `legal` node in `site.ts`,
kept out of the top nav but linked in the footer and reachable in the terminal
(`cat impressum`). The terminal banner shows a "Last login" / © line using the
build date (injected via Vite `define` as `__BUILD_DATE__`), and `tree` renders a
real nested tree with a "← you are here" marker for the current directory.

Not shown (generated, gitignored): **`.svelte-kit/`** holds types and config
produced by `svelte-kit sync`. It's safe to delete and regenerates on
`bun run dev` / `bun run check`; run `svelte-kit sync` manually to refresh types
after adding a route without starting the dev server. **`.vercel/`** holds the
production build output (see Deployment).

## Architecture & key concepts

### File-based routing + Svelte 5 runes

Routes map 1:1 to files under `src/routes/`. The four routes are all top-level
`+page.svelte` files (no nested route groups or dynamic segments yet):

- `/` → `src/routes/+page.svelte`
- `/projects` → `src/routes/projects/+page.svelte`
- `/blog` → `src/routes/blog/+page.svelte`
- `/contact` → `src/routes/contact/+page.svelte`

Svelte 5 **runes mode is forced on** for project code in `vite.config.ts`
(`compilerOptions.runes` returns `true` for everything except `node_modules`).
Use runes (`$props()`, `$state()`, etc.); legacy Svelte 4 syntax will fail.

There is **no `svelte.config.js`** in this project. With the current SvelteKit /
`sv` CLI, the adapter and compiler options live inside `vite.config.ts` instead —
a `svelte.config.js` is not picked up.

### Single source of truth: `src/lib/site.ts`

`src/lib/site.ts` is the one place that describes the site's structure. It
exports:

```ts
export interface SiteNode {
  slug: string;            // terminal path segment, e.g. `cd about`
  path: string;            // route to navigate to
  title: string;           // nav label
  blurb: string;           // one-liner for sitemap / terminal `ls -l`
  children?: SiteNode[];   // for future nesting (e.g. blog posts)
}

export const site = {
  name: 'Felix Schick',
  tagline: 'Software developer',
  email: 'felix_schick@genua.de',
  social: { github: 'qunnlin', linkedin: 'felixschick' }
};

export const nav: SiteNode[] = [
  { slug: 'about',    path: '/',         title: 'about',    blurb: 'who I am and what I do' },
  { slug: 'projects', path: '/projects', title: 'projects', blurb: 'things I have built' },
  { slug: 'blog',     path: '/blog',     title: 'blog',     blurb: 'occasional writing' },
  { slug: 'contact',  path: '/contact',  title: 'contact',  blurb: 'how to reach me' }
];

export function resolve(slug: string): SiteNode | undefined {
  return nav.find((n) => n.slug === slug);
}
```

Why it exists: the nav bar and the in-browser terminal both read the same tree —
`ls` lists these nodes, `cd about` runs `goto(node.path)`, `tree` prints the whole
thing — so there's no second source to keep in sync. The `resolve()` signature
(`(slug: string) => SiteNode | undefined`) is relied on by the terminal's `cd`;
nested routes (e.g. resolving a path like `about/projects`) would be the natural
place to extend it rather than changing its shape ad hoc.

### In-browser terminal — "the terminal IS the website"

There are two **view modes** (`src/lib/mode.ts`), persisted in `localStorage`:

- **`gui`** (default) — the styled pages. The terminal is opt-in via the launcher
  button or the `/` key.
- **`terminal`** — the whole screen is the terminal. It renders the current
  route's content as ASCII text (a figlet heading from `banners.ts` plus the
  body), and `cd <section>` both navigates the real route **and** prints that
  section inline, without leaving the terminal. `/` (or the launcher) opens it,
  `gui` / Esc close.

`ls`/`cd`/`cat` follow a real filesystem metaphor driven by `SiteNode.isDir`:
**`blog/` and `projects/` are directories** (collections — posts and project
entries); **about and contact are files** (`about.txt`, `contact.txt`). Files are
read with `cat`, directories listed/entered with `ls`/`cd`; `cd`-ing a file (or
`cat`-ing a directory) gives a friendly shell-style error. The component derives
the current working directory from the route — a *file* route resolves to its
parent dir (`/contact` → `/`; `/blog/<post>` → `/blog`) — and passes that
directory's contents to the pure engine via `TermContext.entries`, so `ls`, `pwd`,
and the prompt reflect the actual directory. `gui`, `exit`, and `quit` all leave
terminal mode for the styled view, which also has a **theme switcher** in its
footer (`ThemeSwitcher.svelte`) sharing the terminal's `applyTheme` + persistence.

How the modes coexist without breaking SEO / no-JS:

- The styled pages **always** render (SSR'd) inside a `.gui-content` wrapper. In
  terminal mode, CSS (`html[data-mode='terminal'] .gui-content { display:none }`)
  hides them — but they're still in the DOM, and **no-JS visitors never get
  `data-mode`**, so they always see the styled pages. An inline script in
  `app.html` sets `data-mode` before paint to avoid a flash.
- `Terminal.svelte` is **client-only** (gated on `onMount`), so SSR output is the
  styled pages — good for crawlers and the no-JS fallback.

The split that keeps it testable:

- **`src/lib/terminal.ts`** — a **pure** command engine. `runCommand(input, ctx)`
  returns `{ lines, action? }` (`action` = `navigate` / `theme` / `mode` / `clear`).
  Reads `nav` from `site.ts` so `ls`/`cd`/`tree` can't drift from the routes.
  **No DOM, no Vite-only imports** (so it runs under `bun` for unit tests).
- **`src/lib/content.ts`** — `renderSection(slug)` / `renderPost(slug)` turn the
  shared content into terminal lines. It's the **single source** the styled pages
  also import (`aboutParagraphs`, `projects`), so the two views never disagree.
- **`src/lib/components/Terminal.svelte`** — the UI: keys (Enter, ↑/↓ history,
  Tab completion, `/`-to-open / Esc-to-close), performs actions, and renders the current route's
  content on navigation. Mounted once in `+layout.svelte`.

Still **progressive enhancement**: the routed styled pages are the substrate; the
terminal is a client layer on top.

### Theming

Theme tokens are CSS variables defined per `[data-theme]` in `src/app.css`. The
active theme is selected by the `data-theme` attribute on the root `<html>`
element in `src/app.html` (default `dark`). Ten themes currently exist:

- **dark** (default — clean neutral dark) and **light**
- **gruvbox**, **dracula**, **nord**, **tokyo-night**, **catppuccin-mocha**,
  **rose-pine**, **solarized-dark**, **solarized-light**

(Light themes darken the green/yellow roles so the prompt and ASCII headings stay
legible.) Switch via the terminal `theme` command or the gui `ThemeSwitcher`.

The variables are: `--term-bg`, `--term-fg`, `--term-dim`, `--term-accent`,
`--term-green`, `--term-yellow`, `--term-red`, `--term-blue` (plus `--font-mono`).
UnoCSS maps these to `term-*` color utilities (see below), so switching
`data-theme` reskins the entire site — exactly how the terminal `theme <name>`
command works.

The `--font-mono` stack falls back through system monospace fonts; no web font
is loaded from a CDN, so the site has no external font dependency. To use a
specific web font (e.g. JetBrains Mono from Google Fonts), add an `@import` and
update `--font-mono` in `src/app.css`.

### UnoCSS conventions

Configured in `uno.config.ts`:

- **Presets**: `presetUno()` (Tailwind-compatible utilities) and
  `presetIcons({ scale: 1.2 })`.
- **Transformers**: `transformerDirectives()` (enables `@apply` inside `<style>`).
- **`term-*` colors**: `theme.colors.term` maps each color to a CSS variable, so
  `text-term-green` → `var(--term-green)`, `bg-term-bg` → `var(--term-bg)`,
  `border-term-dim/20` → `var(--term-dim)` at 20% opacity, etc.
- **Shortcuts**:
  - `term-link` → `text-term-accent underline-offset-4 hover:underline`
  - `term-prompt` → `before:content-['$_'] before:text-term-green`

  These are reused across pages and the footer; renaming them breaks those usages.

Two ordering / import requirements:

- In `vite.config.ts`, **`UnoCSS()` must come before `sveltekit()`** in the
  `plugins` array.
- The layout imports `'virtual:uno.css'` (then `'../app.css'`) at the top of its
  `<script>`. UnoCSS won't generate styles without that virtual import.

## How-to recipes

### Site metadata & CV

Name, tagline, email, social handles, and `siteUrl` live in the `site` object in
`src/lib/site.ts` — the single place they're defined; the header, footer, contact
page, and SEO all import from `$lib/site`. Avoid hard-coding these into components.

The **CV** is the `cv` object in `src/lib/content.ts` (work / education / skills) —
it renders as a "git log of my career" on the about page **and** in the terminal
(`cv` / `resume`, or the about screen) from that one source.

### Add a new page / route

1. Create the route file, e.g. `src/routes/resume/+page.svelte`. Use Svelte 5
   runes and the existing terminal-style heading pattern:

   ```svelte
   <svelte:head>
     <title>resume — Felix Schick</title>
     <meta name="description" content="Felix Schick's resume." />
   </svelte:head>

   <section class="space-y-6">
     <h1 class="text-2xl font-bold"><span class="text-term-green">$</span> cat ./resume.txt</h1>
     <!-- content -->
   </section>
   ```

   Use `$ cat ./<name>.txt` for a single-page (file) section, or `$ ls ./<name>`
   for a directory section — match the heading to its `isDir`.

2. Register it in the `nav` array in `src/lib/site.ts` so it shows up in the nav
   and the terminal. Set `isDir` — `false` for a single page (opened with `cat`),
   `true` for a directory of sub-pages (`ls`/`cd`):

   ```ts
   { slug: 'resume', path: '/resume', title: 'resume', blurb: 'work history', isDir: false }
   ```

   The layout's nav loop and active-route highlighting (exact `pathname` match)
   pick it up automatically.

### Add a project

`projects/` is a directory: each project is its own entry at `/projects/<slug>`
(GUI) and `cat <slug>` (terminal). Add an entry to the `projects` array in
`src/lib/content.ts` (the shared source for the listing, the detail page, and the
terminal):

```ts
export const projects: Project[] = [
  // ...existing
  {
    slug: 'my-thing',
    name: 'my-thing',
    desc: 'Short one-line summary for the listing.',
    year: '2026',
    tech: ['SvelteKit', 'TypeScript'],
    repo: 'https://github.com/qunnlin/my-thing',
    demo: 'https://my-thing.dev',   // optional
    body: ['A longer paragraph or two about what it does and why.']   // optional
  }
];
```

That's all — the `/projects/<slug>` page prerenders automatically (its `entries`
come from `getProjectSlugs()`), the listing links to it, and the terminal renders
it via `renderProject()`. The about copy lives in the same file
(`aboutParagraphs`); to change what a section shows in the terminal, edit its case
in `renderSection()`.

### Add a terminal command

Add an entry to the `COMMANDS` array in `src/lib/terminal.ts`. A command is
`{ name, desc, run(args, ctx) }`, where `run` returns `{ lines, action? }`:

```ts
{
  name: 'hello',
  desc: 'say hi',
  run: (args) => ({ lines: [{ text: `hi ${args[0] ?? 'there'}`, tone: 'green' }] })
}
```

`help` lists it automatically. To trigger navigation or a theme change, return an
`action` (`{ type: 'navigate', path }` / `{ type: 'theme', name }` / `{ type: 'clear' }`)
— the component performs the side effect. Keep `run` pure so the engine stays
testable.

### Add a new theme

1. In `src/app.css`, add a new `[data-theme]` block defining all the `--term-*`
   variables:

   ```css
   [data-theme='nord'] {
     --term-bg: #2e3440;
     --term-fg: #d8dee9;
     --term-dim: #4c566a;
     --term-accent: #88c0d0;
     --term-green: #a3be8c;
     --term-yellow: #ebcb8b;
     --term-red: #bf616a;
     --term-blue: #81a1c1;
   }
   ```

2. Register the name in the `themes` array in `src/lib/theme.ts`. That's all it
   takes — the terminal's `theme` command **and** the gui `ThemeSwitcher` both
   iterate `themes`, so the new theme appears in both automatically (and the
   choice persists in `localStorage`). The default theme is set on `<html>` in
   `src/app.html` (and `DEFAULT_THEME` in `theme.ts`). Because the `term-*`
   utilities already point at these variables in `uno.config.ts`, no UnoCSS change
   is needed unless a brand-new color key is introduced.

   Light themes: darken `--term-green`/`--term-yellow` (and check `--term-accent`)
   so prompts and headings stay legible on a light background — see the `light`
   theme for reference.

### Add an icon

Icons come from `presetIcons()`, but icon sets are on-demand and must be
installed. Install the relevant Iconify JSON set, e.g.:

```bash
bun add -d @iconify-json/lucide
```

Then use the icon as a class (per `presetIcons` conventions), e.g.
`<span class="i-lucide-github"></span>`.

### Replace the favicon

The favicon is `src/lib/assets/favicon.svg`, imported in
`src/routes/+layout.svelte` and set via `<link rel="icon">` in `<svelte:head>`.
Replace the file (SVG keeps it crisp at any size); if its name or format changes,
update the import in the layout. (`robots.txt`, `sitemap.xml`, and the
RSS feed are generated by prerendered `+server.ts` endpoints, not static files.)

### Add a blog post

The blog uses **mdsvex**: a post is just a markdown file in `src/posts/`. Create
`src/posts/my-post.md` with frontmatter:

```md
---
title: My post title
date: '2026-07-01'
description: One line shown in the listing and as the meta description.
tags: ['svelte', 'web'] # optional
published: true
---

Write the post in **markdown**. Code blocks, lists, and links all work.
```

The filename (minus `.md`) becomes the slug, so this is served at
`/blog/my-post`. `import.meta.glob` in `src/lib/posts.ts` discovers it
automatically — no list to update. Posts are sorted newest-first by `date`,
`published: false` keeps a draft out of the listing, optional `tags` show on the
listing/post/terminal, and reading time is computed from the word count. Both
`/blog` and each `/blog/[slug]` prerender to static HTML; code blocks are
syntax-highlighted via the Prism token CSS in `src/routes/blog/[slug]/+page.svelte`.

## Conventions

- **Svelte 5 runes only.** Runes are force-enabled; Svelte 4 component syntax
  will fail.
- **Config lives in `vite.config.ts`.** There is no `svelte.config.js` — adapter
  and compiler options are configured there.
- **Prefer UnoCSS utilities** for layout and styling. Drop into a scoped
  `<style>` block only for bespoke effects that utilities can't express.
- **Comment philosophy**: explain *why* and any non-obvious mechanics. Don't
  narrate obvious markup.

## Quality checks

Run before committing:

```bash
bun run check
```

This runs `svelte-kit sync` (regenerates `.svelte-kit` types) and then
`svelte-check --tsconfig ./tsconfig.json` (TypeScript + Svelte diagnostics). It
should pass cleanly. A production `bun run build` is the other good gate to make
sure the Vercel build will succeed.

### Tests

The terminal command engine has a committed unit suite (`src/lib/terminal.test.ts`):

```bash
bun run test   # bun test src
```

The engine is pure (no DOM, no `import.meta.glob`), so it tests fast outside Vite.
Keeping it that way means not importing `posts.ts`/`content.ts` into `terminal.ts`.

## Deployment

Deployed on **Vercel** via `@sveltejs/adapter-vercel`. The runtime is pinned to
`nodejs22.x` in `vite.config.ts` so builds don't depend on the local Node
version (local Node 26 is unsupported as a default runtime; Vercel supports Node
20 / 22 / 24).

Importing the repo on vercel.com auto-detects SvelteKit and `adapter-vercel` — no
build command, output directory, or environment variables need configuring. Each
push redeploys, with per-branch preview URLs. Custom domains are added under the
project's **Domains** tab.

`siteUrl` in `src/lib/site.ts` is the canonical origin used for canonical/OpenGraph
URLs, the `sitemap.xml`, and the RSS feed; it defaults to a placeholder domain and
should match the deployed domain.

Self-hosting is also possible by swapping `adapter-vercel` for `svelte-adapter-bun`
(which runs the build as a Bun server); Vercel is the configured target.

## Troubleshooting

- **Build fails with "Unsupported Node.js version" (or similar) on Vercel** — the
  runtime must be pinned. Confirm `adapter({ runtime: 'nodejs22.x' })` is set in
  `vite.config.ts`. Local Node 26 is not an accepted default runtime.
- **Stale Vite / SvelteKit cache or odd type errors** — remove the generated
  caches and restart:

  ```bash
  rm -rf .svelte-kit node_modules/.vite
  bun run dev
  ```

- **UnoCSS classes not applying** — check that `UnoCSS()` comes **before**
  `sveltekit()` in the `plugins` array in `vite.config.ts`, and that
  `import 'virtual:uno.css';` is present (it lives at the top of
  `src/routes/+layout.svelte`).

## Features

- Routed, prerendered pages: about, projects (+ per-project detail), blog (+ posts),
  contact, impressum.
- In-browser terminal: a command layer over `src/lib/site.ts` — `ls`, `cd`, `cat`,
  `tree`, `theme`, `crt`, `cv`, `whoami`, etc.
- Markdown blog via mdsvex with reading time, tags, and an RSS feed.
- Ten themes with a live switcher; CRT effect toggle (reduced-motion-aware); custom
  error page; syntax-highlighted code.
- SEO: canonical + OpenGraph/Twitter, JSON-LD (Person/WebSite/BlogPosting),
  prerendered `sitemap.xml` and `robots.txt`.
- Unit-tested command engine (`bun test`).

Possible follow-ups: an OpenGraph share image, and per-project demo links.
