<!--
	Blog index (route: /blog). Lists published posts newest-first.
	Posts come from src/posts/*.md via $lib/posts; see +page.ts for the load.
-->
<!-- RSS-reader / inbox style listing: unread ● marker, meta line, then subject + excerpt. -->
<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Seo
	title="blog — Felix Schick"
	description="Writing by Felix Schick on web development, the things I build, and how this site is put together."
/>

<section class="space-y-6">
	<h1 class="text-2xl font-bold"><span class="text-term-green">$</span> ls ./blog</h1>

	{#if data.posts.length === 0}
		<p class="text-term-dim">No posts yet.</p>
	{:else}
		<ol class="space-y-5">
			{#each data.posts as post, i (post.slug)}
				<li class="flex gap-3">
					<span class="shrink-0 text-term-dim text-sm tabular-nums">{i + 1}</span>
					<div class="min-w-0">
						<p class="flex flex-wrap items-center gap-x-2 text-xs text-term-dim">
							<span class="text-term-green">●</span>
							<time datetime={post.date}>{post.date}</time>
							<span>~{post.readingMinutes}m</span>
							{#if post.tags?.length}
								<span class="flex flex-wrap gap-x-2">
									{#each post.tags as tag (tag)}<span class="text-term-accent">#{tag}</span>{/each}
								</span>
							{/if}
						</p>
						<a href="/blog/{post.slug}" class="term-link font-bold">{post.title}</a>
						<p class="text-term-dim text-sm">{post.description}</p>
					</div>
				</li>
			{/each}
		</ol>
		<p class="text-term-dim text-sm">
			rss → <a href="/blog/rss.xml" class="term-link">/blog/rss.xml</a>
		</p>
	{/if}
</section>
