<!--
	Theme switcher for gui mode. Lives in the layout footer (inside .gui-content),
	so it only shows in the styled view. A <select> stays tidy as the theme list
	grows. Shares applyTheme/persistence with the terminal's `theme` command.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { themes, applyTheme, getStoredTheme, isTheme, DEFAULT_THEME, type Theme } from '$lib/theme';

	let current = $state<Theme>(DEFAULT_THEME);

	onMount(() => {
		const read = () => {
			const t = document.documentElement.dataset.theme;
			if (t && isTheme(t)) current = t;
			else current = getStoredTheme() ?? DEFAULT_THEME;
		};
		read();
		// Keep the select in sync if the theme is changed elsewhere (the terminal's
		// `theme` command mutates <html data-theme> directly).
		const observer = new MutationObserver(read);
		observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
		return () => observer.disconnect();
	});

	function onChange(event: Event) {
		const value = (event.currentTarget as HTMLSelectElement).value;
		if (isTheme(value)) {
			applyTheme(value);
			current = value;
		}
	}
</script>

<label class="switcher">
	<span class="text-term-dim">theme:</span>
	<select value={current} onchange={onChange} aria-label="Color theme">
		{#each themes as theme (theme)}
			<option value={theme}>{theme}</option>
		{/each}
	</select>
</label>

<style>
	.switcher {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.75rem;
	}
	select {
		font: inherit;
		font-size: 0.75rem;
		color: var(--term-fg);
		background: color-mix(in srgb, var(--term-dim) 12%, transparent);
		border: 1px solid color-mix(in srgb, var(--term-dim) 40%, transparent);
		border-radius: 4px;
		padding: 0.1rem 0.4rem;
		cursor: pointer;
	}
	select:hover {
		border-color: var(--term-green);
	}
</style>
