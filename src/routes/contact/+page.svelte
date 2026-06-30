<!--
	Contact page. Every name/email/social handle here is read from the shared
	`site` object in $lib/site rather than hard-coded, so contact details live
	in exactly one place and stay consistent across the site.
-->
<script lang="ts">
	import { site } from '$lib/site';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title="contact — Felix Schick" description="How to reach Felix Schick." />

<section class="space-y-6">
	<h1 class="text-2xl font-bold"><span class="text-term-green">$</span> cat ./contact.txt</h1>
	<ul class="space-y-2 text-term-fg">
		<li>
			<span class="text-term-dim w-24 inline-block">email</span>
			<a href="mailto:{site.email}" class="term-link">{site.email}</a>
		</li>
		<li>
			<span class="text-term-dim w-24 inline-block">github</span>
			<a href="https://github.com/{site.social.github}" target="_blank" rel="noopener noreferrer" class="term-link">
				github.com/{site.social.github}
			</a>
		</li>
		<li>
			<span class="text-term-dim w-24 inline-block">linkedin</span>
			<a href="https://linkedin.com/in/{site.social.linkedin}" target="_blank" rel="noopener noreferrer" class="term-link">
				linkedin.com/in/{site.social.linkedin}
			</a>
		</li>
	</ul>
</section>
