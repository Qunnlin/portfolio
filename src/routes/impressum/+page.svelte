<!--
	Impressum — legal notice required in Germany (§5 DDG). Content comes from the
	shared `impressum` object in $lib/content (the terminal renders the same).
-->
<script lang="ts">
	import { impressum } from '$lib/content';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="Impressum — {impressum.name}" description="Legal notice (Impressum) for {impressum.name}." />

<section class="space-y-4">
	<h1 class="text-2xl font-bold"><span class="text-term-green">$</span> cat ./impressum.txt</h1>
	<p class="text-term-dim text-sm">Angaben gemäß § 5 DDG</p>
	<address class="not-italic space-y-1 text-term-fg">
		<p>{impressum.name}</p>
	</address>
	<p>
		<span class="text-term-dim">E-Mail: </span>
		<a href="mailto:{impressum.email}" class="term-link">{impressum.email}</a>
	</p>
</section>
