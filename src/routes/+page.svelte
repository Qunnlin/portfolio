<!--
	Home page — also serves as the About page (the site root, `/`).
-->
<script lang="ts">
	// `aboutParagraphs` is the same about copy the terminal renders (single source
	// in $lib/content); `site` holds shared metadata.
	import { site, siteUrl } from '$lib/site';
	import { aboutParagraphs, cv, skillMeter, entryHash, entryRefs } from '$lib/content';
	import Seo from '$lib/components/Seo.svelte';

	// CV rendered as a git log — same data the terminal renders.
	const logs = [
		{ branch: 'career', entries: cv.work },
		{ branch: 'education', entries: cv.education }
	];

	const jsonLd = [
		{
			'@context': 'https://schema.org',
			'@type': 'Person',
			name: site.name,
			jobTitle: site.tagline,
			url: `${siteUrl}/`,
			email: `mailto:${site.email}`,
			sameAs: [
				`https://github.com/${site.social.github}`,
				`https://linkedin.com/in/${site.social.linkedin}`
			]
		},
		{ '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: `${siteUrl}/` }
	];
</script>

<Seo title="{site.name} — {site.tagline}" {jsonLd} />

<section class="space-y-5">
	<h1 class="text-2xl font-bold text-term-fg">
		<span class="text-term-green">$</span> cat ./about.txt
	</h1>
	{#each aboutParagraphs as para, i (i)}
		<p class="leading-relaxed {i === 0 ? 'text-term-fg' : 'text-term-dim'}">{para}</p>
	{/each}

	<!-- CV as a git log --graph: continuous left line + commit nodes -->
	<div class="space-y-7 pt-2">
		{#each logs as section (section.branch)}
			<div>
				<p class="text-term-green text-sm font-bold">$ git log ~/{section.branch}</p>
				<div class="mt-3">
					{#each section.entries as e, i (entryHash(e))}
						<div class="flex gap-3">
							<!-- graph column: commit node + connecting line down to the next.
						     Uses color-mix for the line (UnoCSS drops /opacity on var colors). -->
							<div class="flex shrink-0 flex-col items-center" aria-hidden="true">
								<span class="mt-[5px] h-2.5 w-2.5 shrink-0 rounded-full bg-term-green"></span>
								{#if i < section.entries.length - 1}
									<span
										class="my-1 w-[2px] flex-1"
										style="background: color-mix(in srgb, var(--term-green) 60%, transparent)"
									></span>
								{/if}
							</div>
							<!-- commit -->
							<div class="min-w-0 flex-1 pb-6">
								<p class="text-sm">
									<span class="text-term-yellow">commit {entryHash(e)}</span><span
										class="text-term-accent">{entryRefs(e, i === 0, section.branch)}</span
									>
								</p>
								<p class="text-term-dim text-xs">Author: {site.name} &lt;{site.email}&gt;</p>
								<p class="text-term-dim text-xs">Date:&nbsp;&nbsp; {e.period}</p>
								<p class="mt-2 text-term-fg">{e.role} · {e.org}</p>
								{#if e.bullets?.length}
									<ul class="mt-1 space-y-0.5 text-term-dim text-sm">
										{#each e.bullets as b (b)}
											<li>• {b}</li>
										{/each}
									</ul>
								{/if}
								{#if e.tech?.length}
									<p class="mt-1 text-term-green text-xs">[ {e.tech.join('  ')} ]</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}

		<div>
			<p class="text-term-green text-sm font-bold">$ skills --proficiency</p>
			<ul class="mt-2 space-y-1">
				{#each cv.skills as s (s.name)}
					{@const m = skillMeter(s.level)}
					<li class="flex items-center gap-3 text-sm">
						<span class="w-40 shrink-0 text-term-fg">{s.name}</span>
						<span aria-hidden="true"
							><span class="text-term-green">{m.filled}</span><span class="text-term-dim">{m.empty}</span></span
						>
						<span class="text-term-dim text-xs">{m.label}</span>
					</li>
				{/each}
			</ul>
		</div>

		<div>
			<p class="text-term-green text-sm font-bold">$ cat ~/languages</p>
			<p class="mt-1 text-term-fg text-sm">{cv.languages.join(' · ')}</p>
		</div>

		<div>
			<p class="text-term-green text-sm font-bold">$ cat ~/publications</p>
			<ul class="mt-1 space-y-1 text-sm">
				{#each cv.publications as p (p.title)}
					<li>
						{#if p.url}
							<a href={p.url} target="_blank" rel="noopener noreferrer" class="term-link">{p.title}</a>
						{:else}
							<span class="text-term-fg">{p.title}</span>
						{/if}
						<span class="text-term-dim"> · {p.venue}</span>
					</li>
				{/each}
			</ul>
		</div>
	</div>

	<p class="text-term-dim leading-relaxed">
		Prefer the terminal? Press <code class="text-term-accent">/</code> for terminal mode.
	</p>
</section>
