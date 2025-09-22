<script>
	/**
	 * @typedef {Object} Props
	 * @property {number} [scale] - 0.6–1.2
	 * @property {number} [baseFrequency] - 0.7–1.2 subtle grain
	 * @property {number} [numOctaves] - 1–3
	 */

	/** @type {Props} */
	let { scale = 1, baseFrequency = 0.9, numOctaves = 2 } = $props();
</script>

<svg class="bg-noise" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
	<filter id="noise-filter">
		<feTurbulence type="fractalNoise" {baseFrequency} {numOctaves} seed="3" stitchTiles="stitch" />
		<feColorMatrix type="saturate" values="0" />
	</filter>
	<rect width="100%" height="100%" filter="url(#noise-filter)" transform="scale({scale})" />
</svg>

<style>
	:global(.bg-noise) {
		/* opacity and blend are controlled in app.css */
	}
</style>
