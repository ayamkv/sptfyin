<script>
	import { ABOUT_SECTION_COMPONENTS } from '$lib/about/section-components';

	/** @type {import('./$types').PageProps} */
	let { data } = $props();

	const Section = $derived(ABOUT_SECTION_COMPONENTS[data.section]);
</script>

<div class="container">
	<div class="prose prose-gray mx-0 py-8 dark:prose-invert">
		{#if Section}
			<Section />
		{/if}
	</div>
</div>
