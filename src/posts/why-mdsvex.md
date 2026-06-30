---
title: A blog that's just markdown files
date: '2026-06-29'
description: How the blog works.
tags: ['mdsvex', 'blog']
published: false
---

Every post on this site is a plain markdown file in `src/posts/`. mdsvex compiles
each one into a Svelte component at build time, and Vite's `import.meta.glob`
discovers them automatically — there's no list of posts to maintain by hand.

## Frontmatter

Each file starts with a small YAML block:

```yaml
---
title: A blog that's just markdown files
date: '2026-06-29'
description: ...
published: true
---
```

Set `published: false` to hide a draft from the listing.

## Code blocks work too

```ts
function greet(name: string) {
	return `hello, ${name}`;
}
```

That's the whole system. Writing a post is writing a file.
