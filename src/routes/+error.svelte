<!--
	Custom error page (e.g. 404). Styled to match the terminal aesthetic. Reads the
	status + message from $app/state. Shown in gui mode / on direct hits and to
	crawlers; in terminal mode the overlay covers it.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { site } from '$lib/site';

	const statusText = $derived(
		page.status === 404 ? 'Not Found' : page.status >= 500 ? 'Server Error' : 'Error'
	);
	const message = $derived(page.error?.message ?? 'Something went wrong.');
</script>

<svelte:head>
	<title>{page.status} {statusText} — {site.name}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<section class="space-y-4">
	<h1 class="text-2xl font-bold">
		<span class="text-term-green">$</span> cat ./{page.status}
	</h1>
	<p class="text-term-red">{page.status} — {statusText}</p>
	<p class="text-term-dim">{message}</p>
	<p><a href="/" class="term-link">cd ~ &nbsp;# back home</a></p>
</section>
