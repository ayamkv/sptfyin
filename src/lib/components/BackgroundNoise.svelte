<script>
  export let scale = 1;            // 0.6–1.2
  export let baseFrequency = 0.9;  // 0.7–1.2 subtle grain
  export let numOctaves = 2;       // 1–3
</script>

<svg class="bg-noise" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
  <filter id="noise-filter">
    <feTurbulence
      type="fractalNoise"
      baseFrequency={baseFrequency}
      numOctaves={numOctaves}
      seed="3"
      stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
  </filter>
  <rect width="100%" height="100%" filter="url(#noise-filter)" transform="scale({scale})" />
</svg>

<style>
  :global(.bg-noise) {
    /* opacity and blend are controlled in app.css */
  }
</style>