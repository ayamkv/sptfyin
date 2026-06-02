<script>
	import { onMount } from 'svelte';
	import {
		BLEND_MODES,
		DITHER_COLOR_MODES,
		DITHER_PATTERNS,
		NOISE_TYPES,
		RENDER_BACKENDS
	} from './dono-shader-config.js';

	let {
		backend = 'webgl2',
		backendStats,
		backendSupport = { webgl2: true, webgpu: false },
		config,
		onBackendChange,
		stats
	} = $props();

	let canvas = $state();
	let status = $state('loading local jsimgui...');

	function comboItems(items) {
		return `${items.join('\0')}\0\0`;
	}

	function checkbox(ImGui, label, target, key) {
		const value = [!!target[key]];
		if (ImGui.Checkbox(label, value)) target[key] = value[0];
	}

	function slider(ImGui, label, target, key, min, max, format = '%.2f') {
		const value = [Number.isFinite(target[key]) ? target[key] : min];
		if (ImGui.SliderFloat(label, value, min, max, format)) target[key] = value[0];
	}

	function intSlider(ImGui, label, target, key, min, max) {
		const value = [Math.round(Number.isFinite(target[key]) ? target[key] : min)];
		if (ImGui.SliderInt(label, value, min, max)) target[key] = value[0];
	}

	function combo(ImGui, label, target, key, items) {
		const value = [Math.round(Number.isFinite(target[key]) ? target[key] : 0)];
		if (ImGui.Combo(label, value, comboItems(items))) target[key] = value[0];
	}

	function blendCombo(ImGui, target) {
		combo(ImGui, 'blend mode', target, 'blendMode', BLEND_MODES);
	}

	function drawBackendControls(ImGui) {
		const value = [Math.max(0, RENDER_BACKENDS.indexOf(backend))];

		ImGui.Text('renderer backend');
		if (ImGui.Combo('backend', value, comboItems(RENDER_BACKENDS))) {
			onBackendChange?.(RENDER_BACKENDS[value[0]]);
		}
		ImGui.TextDisabled(
			backendSupport.webgpu ? 'webgpu available' : 'webgpu unavailable; using webgl2'
		);
		ImGui.Separator();
	}

	function color(ImGui, label, target, key) {
		const source = Array.isArray(target[key]) ? target[key] : [1, 1, 1];
		const value = [source[0], source[1], source[2]];

		if (ImGui.ColorEdit3(label, value)) {
			if (!Array.isArray(target[key])) target[key] = [value[0], value[1], value[2]];
			target[key][0] = value[0];
			target[key][1] = value[1];
			target[key][2] = value[2];
		}
	}

	function vec2(ImGui, label, target, key, min = -1, max = 1) {
		const source = Array.isArray(target[key]) ? target[key] : [0, 0];
		const value = [source[0], source[1]];

		if (ImGui.SliderFloat2(label, value, min, max, '%.2f')) {
			if (!Array.isArray(target[key])) target[key] = [value[0], value[1]];
			target[key][0] = value[0];
			target[key][1] = value[1];
		}
	}

	function section(ImGui, title, component, drawControls) {
		if (!component) return;

		ImGui.PushID(title);
		const open = ImGui.CollapsingHeader(title);
		checkbox(ImGui, 'visible', component, 'visible');

		if (open) {
			drawControls();
			ImGui.Separator();
		}

		ImGui.PopID();
	}

	function configJson() {
		return JSON.stringify(
			config,
			(_key, value) => {
				if (typeof value === 'number') return Number(value.toFixed(4));
				return value;
			},
			2
		);
	}

	function drawExport(ImGui, ImVec2, ImGuiInputTextFlags) {
		if (!config || !ImVec2 || !ImGuiInputTextFlags) return;

		if (!ImGui.CollapsingHeader('JSON export')) return;

		const json = configJson();
		if (ImGui.Button('copy JSON')) ImGui.SetClipboardText(json);
		ImGui.InputTextMultiline(
			'##config-json',
			[json],
			json.length + 1,
			new ImVec2(-1, 180),
			ImGuiInputTextFlags.ReadOnly
		);
		ImGui.Separator();
	}

	function drawStats(ImGui) {
		if (!stats) return;

		ImGui.Text(`backend: ${stats.backend ?? backend}`);
		ImGui.Text(`fps: ${(stats.fps ?? 0).toFixed(1)}`);
		ImGui.Text(`frame: ${(stats.frameTime ?? 0).toFixed(2)} ms`);
		ImGui.Text(`canvas: ${Math.round(stats.width ?? 0)} x ${Math.round(stats.height ?? 0)}`);
		ImGui.Text(`trail samples: ${Math.round(stats.trailSamples ?? 0)}`);
		ImGui.Text(`render scale: ${(stats.renderScale ?? 1).toFixed(2)}x`);
		ImGui.Text(
			`compare: gl2 ${formatBackendFps(backendStats?.webgl2)} / gpu ${formatBackendFps(backendStats?.webgpu)}`
		);
		ImGui.Separator();
	}

	function formatBackendFps(next) {
		return next ? `${(next.fps ?? 0).toFixed(1)}fps` : '--';
	}

	function drawControls(ImGui, ImVec2, ImGuiInputTextFlags) {
		if (!config) return;

		ImGui.Text('shader components');
		ImGui.TextDisabled('toggle and tune each layer');
		ImGui.Separator();
		drawBackendControls(ImGui);
		drawStats(ImGui);
		drawExport(ImGui, ImVec2, ImGuiInputTextFlags);

		section(ImGui, 'SimplexNoise', config.simplexNoise, () => {
			combo(ImGui, 'noise type', config.simplexNoise, 'type', NOISE_TYPES);
			blendCombo(ImGui, config.simplexNoise);
			color(ImGui, 'color A', config.simplexNoise, 'colorA');
			color(ImGui, 'color B', config.simplexNoise, 'colorB');
			slider(ImGui, 'scale', config.simplexNoise, 'scale', -2, 5);
			slider(ImGui, 'detail', config.simplexNoise, 'detail', 1, 8, '%.0f');
			slider(ImGui, 'speed', config.simplexNoise, 'speed', 0, 5);
			slider(ImGui, 'contrast', config.simplexNoise, 'contrast', -2, 5);
			slider(ImGui, 'balance', config.simplexNoise, 'balance', -1, 1);
			slider(ImGui, 'seed', config.simplexNoise, 'seed', 0, 100, '%.0f');
		});

		section(ImGui, 'LinearGradient', config.linearGradient, () => {
			blendCombo(ImGui, config.linearGradient);
			color(ImGui, 'color A', config.linearGradient, 'colorA');
			color(ImGui, 'color B', config.linearGradient, 'colorB');
			slider(ImGui, 'opacity', config.linearGradient, 'opacity', 0, 2);
			vec2(ImGui, 'start', config.linearGradient, 'start', -1, 1.5);
			vec2(ImGui, 'end', config.linearGradient, 'end', -1, 1.5);
			slider(ImGui, 'angle', config.linearGradient, 'angle', 0, 360, '%.0f');
			slider(ImGui, 'offset X', config.linearGradient, 'offsetX', -1, 1);
		});

		section(ImGui, 'CursorTrail', config.cursorTrail, () => {
			blendCombo(ImGui, config.cursorTrail);
			color(ImGui, 'color A', config.cursorTrail, 'colorA');
			color(ImGui, 'color B', config.cursorTrail, 'colorB');
			slider(ImGui, 'radius', config.cursorTrail, 'radius', 0.02, 2);
			slider(ImGui, 'length', config.cursorTrail, 'length', 0.1, 2);
			slider(ImGui, 'intensity', config.cursorTrail, 'intensity', 0, 3);
			intSlider(ImGui, 'quality samples', config.cursorTrail, 'sampleCount', 2, 64);
			slider(ImGui, 'smoothing', config.cursorTrail, 'smoothing', 0.02, 1);
			slider(ImGui, 'taper', config.cursorTrail, 'taper', 0, 1);
			slider(ImGui, 'softness', config.cursorTrail, 'softness', 0, 0.4);
			checkbox(ImGui, 'glow enabled', config.cursorTrail, 'glowEnabled');
			slider(ImGui, 'glow radius', config.cursorTrail, 'glowRadius', 0, 2);
			slider(ImGui, 'glow intensity', config.cursorTrail, 'glowIntensity', 0, 3);
			slider(ImGui, 'render scale', config.cursorTrail, 'renderScale', 0.25, 2);
		});

		section(ImGui, 'Pixelate', config.pixelate, () => {
			blendCombo(ImGui, config.pixelate);
			slider(ImGui, 'scale', config.pixelate, 'scale', 1, 200, '%.0f');
			slider(ImGui, 'gap', config.pixelate, 'gap', 0, 0.95);
			slider(ImGui, 'roundness', config.pixelate, 'roundness', 0, 1);
		});

		section(ImGui, 'ClickRipple', config.clickRipple, () => {
			blendCombo(ImGui, config.clickRipple);
			color(ImGui, 'ring color', config.clickRipple, 'colorA');
			color(ImGui, 'edge color', config.clickRipple, 'colorB');
			slider(ImGui, 'intensity', config.clickRipple, 'intensity', 0, 3);
			slider(ImGui, 'duration', config.clickRipple, 'duration', 0.1, 3);
			slider(ImGui, 'max radius', config.clickRipple, 'maxRadius', 0.2, 4);
			slider(ImGui, 'transparent center', config.clickRipple, 'centerSize', 0, 0.95);
			slider(ImGui, 'edge softness', config.clickRipple, 'softness', 0.01, 0.5);
			slider(ImGui, 'radial power', config.clickRipple, 'radialPower', 0.2, 4);
			slider(ImGui, 'fade', config.clickRipple, 'fade', 0, 1);
		});

		section(ImGui, 'Dither', config.dither, () => {
			blendCombo(ImGui, config.dither);
			combo(ImGui, 'pattern', config.dither, 'pattern', DITHER_PATTERNS);
			combo(ImGui, 'color mode', config.dither, 'colorMode', DITHER_COLOR_MODES);
			intSlider(ImGui, 'pixel size', config.dither, 'pixelSize', 1, 20);
			slider(ImGui, 'threshold', config.dither, 'threshold', 0, 1);
			slider(ImGui, 'spread', config.dither, 'spread', 0, 1);
			color(ImGui, 'custom dark', config.dither, 'colorA');
			color(ImGui, 'custom light', config.dither, 'colorB');
		});

		section(ImGui, 'Duotone', config.duotone, () => {
			blendCombo(ImGui, config.duotone);
			color(ImGui, 'color A', config.duotone, 'colorA');
			color(ImGui, 'color B', config.duotone, 'colorB');
			slider(ImGui, 'blend', config.duotone, 'blend', 0, 1);
		});
	}

	onMount(() => {
		if (!canvas) return;

		let frame = 0;
		let cancelled = false;
		let ImGui;
		let ImGuiImplWeb;
		let ImVec2;
		let ImGuiCond;
		let ImGuiWindowFlags;
		let ImGuiInputTextFlags;

		function resizeCanvas() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
			const height = Math.max(1, Math.round(canvas.clientHeight * dpr));

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
			}
		}

		function render() {
			try {
				resizeCanvas();
				ImGuiImplWeb.BeginRender();

				const width = Math.max(1, canvas.clientWidth);
				const height = Math.max(1, canvas.clientHeight);
				const flags =
					ImGuiWindowFlags.NoTitleBar |
					ImGuiWindowFlags.NoMove |
					ImGuiWindowFlags.NoResize |
					ImGuiWindowFlags.NoCollapse |
					ImGuiWindowFlags.NoSavedSettings;

				ImGui.SetNextWindowPos(new ImVec2(0, 0), ImGuiCond.Always);
				ImGui.SetNextWindowSize(new ImVec2(width, height), ImGuiCond.Always);

				if (ImGui.Begin('shader controls', null, flags)) {
					drawControls(ImGui, ImVec2, ImGuiInputTextFlags);
				}

				ImGui.End();
				ImGuiImplWeb.EndRender();

				frame = requestAnimationFrame(render);
			} catch (error) {
				console.error('[ImguiShaderControls] Could not render jsimgui', error);
				status = 'Could not render jsimgui';
			}
		}

		async function start() {
			try {
				const module = await import('@mori2003/jsimgui');
				if (cancelled) return;

				ImGui = module.ImGui;
				ImGuiImplWeb = module.ImGuiImplWeb;
				ImVec2 = module.ImVec2;
				ImGuiCond = module.ImGuiCond;
				ImGuiWindowFlags = module.ImGuiWindowFlags;
				ImGuiInputTextFlags = module.ImGuiInputTextFlags;

				await ImGuiImplWeb.Init({ canvas, backend: 'webgl2' });
				if (cancelled) return;

				status = 'ready';
				frame = requestAnimationFrame(render);
			} catch (error) {
				console.error('[ImguiShaderControls] Could not initialize jsimgui', error);
				status = 'Could not initialize jsimgui';
			}
		}

		start();

		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
			ImGuiImplWeb?.Shutdown?.();
		};
	});
</script>

<div class="imgui-controls" data-status={status}>
	<canvas bind:this={canvas} aria-label="Shader controls"></canvas>
	{#if status !== 'ready'}
		<div class="imgui-status">
			<p>{status}</p>
			<p class="hint">jsimgui is installed locally through @mori2003/jsimgui.</p>
		</div>
	{/if}
</div>

<style>
	.imgui-controls {
		position: relative;
		height: clamp(36rem, calc(100dvh - 8rem), 52rem);
		min-height: 36rem;
		overflow: hidden;
		border-radius: 1.5rem;
		background: #111115;
	}

	.imgui-controls canvas {
		display: block;
		height: 100%;
		min-height: 36rem;
		width: 100%;
		background: #111115;
	}

	.imgui-status {
		position: absolute;
		inset: 0;
		z-index: 1;
		display: grid;
		place-content: center;
		gap: 0.5rem;
		padding: 1.25rem;
		text-align: center;
		font-size: 0.8125rem;
		color: var(--rd-muted);
	}

	.hint {
		max-width: 16rem;
		font-size: 0.6875rem;
		line-height: 1.35;
	}
</style>
