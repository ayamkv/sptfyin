<script>
	import {
		Shader,
		LinearGradient,
		SimplexNoise,
		CursorTrail,
		Pixelate,
		Dither,
		Duotone
	} from 'shaders/svelte';
</script>

<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
	<Shader
		class="absolute left-1/2 top-1/2 h-full w-full origin-center -translate-x-1/2 -translate-y-1/2 scale-[1.34]"
		style="pointer-events: none;"
	>
		<SimplexNoise colorA="#707070" scale={-0.9} contrast={2.7} speed={0.6} />
		<LinearGradient
			colorA="#66d196"
			colorB="#000000"
			angle={0}
			blendMode="linearDodge"
			start={{ x: 0.02, y: 1 }}
			end={{ x: 0.8, y: 0.67 }}
			transform={{ offsetX: -0.4 }}
		/>
		<CursorTrail radius={0.5} colorA="#08ff7f" colorB="#33b594" />
		<Pixelate scale={75} length={0.2} />
		<Dither pattern="bayer4" colorMode="source" pixelSize={1} transform={{ scale: 0.9 }} />
		<Duotone colorA="#1B191F" colorB="#6CE7A3" />
	</Shader>
</div>
