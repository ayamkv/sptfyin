<script>
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { ArrowLeft, RotateCcw } from 'lucide-svelte';
	import DonoWebglShader from '$lib/components/shaders/dono-webgl-shader.svelte';
	import ImguiShaderControls from '$lib/components/shaders/imgui-shader-controls.svelte';
	import { createDonoShaderConfig } from '$lib/components/shaders/dono-shader-config.js';

	let shaderConfig = $state(createDonoShaderConfig());
	let shaderBackend = $state('webgl2');
	let backendSupport = $state({
		webgl2: true,
		webgpu: false
	});
	let shaderStats = $state({
		backend: 'webgl2',
		fps: 0,
		frameTime: 0,
		width: 0,
		height: 0,
		trailSamples: 0,
		renderScale: 1
	});
	let backendStats = $state({
		webgl2: null,
		webgpu: null
	});

	onMount(() => {
		backendSupport.webgpu = !!navigator.gpu;
	});

	function resetControls() {
		const next = createDonoShaderConfig();

		for (const key of Object.keys(next)) shaderConfig[key] = next[key];
	}

	function updateShaderStats(next) {
		const stats = { ...next, backend: shaderBackend };

		Object.assign(shaderStats, stats);
		backendStats[shaderBackend] = stats;
	}

	function updateShaderBackend(next) {
		shaderBackend = next === 'webgpu' && backendSupport.webgpu ? 'webgpu' : 'webgl2';
	}

	function fallbackShaderBackend() {
		shaderBackend = 'webgl2';
	}
</script>

<svelte:head>
	<title>shader lab ~ sptfy.in</title>
	<meta name="description" content="Local WebGL2 shader experiments for sptfy.in." />
</svelte:head>

<div
	class="relative h-dvh w-full overflow-hidden bg-[var(--rd-bg)] text-[var(--rd-ink)] md:h-full md:min-h-0 md:overflow-y-auto md:px-8 md:pb-14 md:pt-5"
>
	<div
		class="rd-squircle border-3 absolute left-3.5 top-[0.6875rem] h-[calc(100dvh-7rem)] w-[calc(100%-1.8125rem)] overflow-y-auto rounded-2xl border-[var(--rd-line)] bg-[var(--rd-shell)] px-3 pb-8 pt-3 md:static md:h-auto md:min-h-full md:w-auto md:overflow-visible md:rounded-none md:border-0 md:bg-transparent md:p-0"
	>
		<div class="mx-auto flex min-h-full w-full max-w-7xl flex-col gap-6">
			<header class="flex items-center justify-between gap-3">
				<a
					href={resolve('/')}
					aria-label="back home"
					class="rd-squircle rd-shadow-inset inline-flex items-center rounded-2xl border border-[var(--rd-line)] bg-[var(--rd-panel)] px-4 py-2 text-sm font-semibold text-[var(--rd-ink)] no-underline hover:text-[var(--rd-mint)]"
				>
					<ArrowLeft class="size-4" aria-hidden="true" />
				</a>

				<button
					type="button"
					class="rd-squircle rd-shadow-lift inline-flex rotate-[-2deg] items-center gap-2 rounded-full bg-[var(--rd-yellow)] px-3 py-1.5 text-sm font-semibold text-[#161517] transition-transform hover:rotate-0"
					onclick={resetControls}
				>
					<RotateCcw class="size-4" aria-hidden="true" />
					reset pipeline
				</button>
			</header>

			<section class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
				<div
					class="rd-squircle rd-shadow-panel overflow-hidden rounded-[2rem] border border-[var(--rd-line)] bg-[var(--rd-panel)]"
				>
					<div
						class="rd-shadow-inset border-b border-[var(--rd-line)] bg-[rgba(16,17,17,0.24)] px-5 py-5 md:px-7"
					>
						<p class="text-sm font-semibold text-[var(--rd-mint)]">local shader lab</p>
						<h1
							class="font-jak-display text-4xl font-black leading-none tracking-[-0.08em] text-white md:text-6xl"
						>
							dono banner, component pipeline
						</h1>
						<p class="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--rd-muted)]">
							The preview is still one local WebGL2 shader, but its controls are split into
							shader-style components: noise, gradient, cursor trail, pixelate, click ripple,
							dither, and duotone.
						</p>
					</div>

					<div class="grid gap-7 px-4 py-6 md:px-7 md:py-8">
						<div
							class="relative mx-auto h-32 w-full max-w-[38rem] overflow-hidden rounded-[9px] bg-[#1b191f] text-white shadow-[inset_0px_5px_4px_0px_rgba(21,19,27,0.46)]"
						>
							{#key shaderBackend}
								<DonoWebglShader
									backend={shaderBackend}
									config={shaderConfig}
									onBackendFallback={fallbackShaderBackend}
									onStats={updateShaderStats}
								/>
							{/key}
							<div
								class="pointer-events-none absolute right-0 top-0 h-full w-1/2 rounded-[9px]"
								style="background-image: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(27, 25, 31, 1) 75%);"
							></div>
							<div
								class="pointer-events-none absolute right-0 top-0 h-full w-1/2 rounded-[9px] opacity-90 mix-blend-color-dodge"
								style="background-image: radial-gradient(92% 145% at 84% -9%, rgba(95, 237, 156, 0.98) 0%, rgba(78, 184, 125, 0.74) 17%, rgba(61, 131, 94, 0.5) 33%, rgba(44, 78, 62, 0.24) 49%, rgba(27, 25, 31, 0) 70%);"
							></div>
							<div
								class="pointer-events-none absolute right-0 top-0 h-full w-1/2 rounded-[9px] opacity-95 mix-blend-color-dodge"
								style="background-image: radial-gradient(90% 140% at 84% -9%, rgba(24, 241, 227, 0.92) 0%, rgba(25, 187, 178, 0.68) 17%, rgba(25, 133, 129, 0.45) 33%, rgba(26, 79, 80, 0.22) 49%, rgba(27, 25, 31, 0) 70%);"
							></div>
							<div
								class="pointer-events-none absolute bottom-0 left-0 h-full w-2/3 rounded-[9px] opacity-70 mix-blend-color-dodge"
								style="background-image: radial-gradient(80% 85% at 0% 100%, rgba(89, 255, 155, 0.24) 0%, rgba(61, 131, 94, 0.14) 34%, rgba(27, 25, 31, 0) 72%);"
							></div>
							<div
								class="pointer-events-none absolute inset-0 rounded-[9px] shadow-[inset_0px_5px_4px_0px_rgba(21,19,27,0.46)]"
							></div>
							<div
								class="pointer-events-none absolute right-8 top-[27px] w-[8.95rem] text-right text-white no-underline"
							>
								<p class="mb-[4px] text-[13px] font-light leading-[1.115] tracking-[-0.54px]">
									°⋆.࿔*:･&nbsp;&nbsp;&nbsp;&nbsp; ദ്ദി ^-⩊-^≼
								</p>
								<h2 class="whitespace-nowrap text-[20px] font-normal leading-[1] tracking-[-1.6px]">
									<span class="block">sptfy.in&nbsp;&nbsp;is&nbsp;&nbsp;entirely</span>
									<span class="block">user funded</span>
								</h2>
								<p class="mt-[6px] text-[13px] font-medium italic leading-[0.885] text-[#ffd050]">
									consider supporting?
								</p>
							</div>
						</div>

						<div
							class="grid gap-3 rounded-2xl border border-[var(--rd-line)] bg-[rgba(16,17,17,0.24)] p-4 text-sm text-[var(--rd-muted)]"
						>
							<p>
								Use the ImGui panel to hide/show each shader component and tune its controls. Dither
								supports Bayer 2/4/8, clustered dot, blue noise, and white noise.
							</p>
							<p>
								Noise supports value, fbm, ridged, and turbulence modes. This is the first step
								toward replacing the current shaders.com-style package with a local editor. Click
								the preview to spawn the transparent-center radial ripple.
							</p>
						</div>
					</div>
				</div>

				<aside
					class="rd-squircle rd-shadow-panel overflow-hidden rounded-[2rem] border border-[var(--rd-line)] bg-[var(--rd-panel)] p-3"
				>
					<ImguiShaderControls
						backend={shaderBackend}
						{backendStats}
						{backendSupport}
						config={shaderConfig}
						onBackendChange={updateShaderBackend}
						stats={shaderStats}
					/>
				</aside>
			</section>
		</div>
	</div>
</div>
