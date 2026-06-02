<script>
	import { onMount } from 'svelte';
	import { createDonoShaderConfig } from './dono-shader-config.js';

	let {
		backend = 'webgl2',
		class: className = '',
		interactive = true,
		config = createDonoShaderConfig(),
		onBackendFallback,
		onStats
	} = $props();

	let canvas = $state();
	let status = $state('loading');

	const trailLimit = 64;
	const rippleLimit = 8;
	const fallbackConfig = createDonoShaderConfig();

	const vertexSource = `#version 300 es
		in vec2 a_position;
		out vec2 v_uv;

		void main() {
			v_uv = a_position * 0.5 + 0.5;
			gl_Position = vec4(a_position, 0.0, 1.0);
		}
	`;

	const fragmentSource = `#version 300 es
		precision highp float;

		#define TRAIL_COUNT 64
		#define RIPPLE_COUNT 8

		uniform vec2 u_resolution;
		uniform float u_time;

		uniform int u_noiseVisible;
		uniform int u_noiseType;
		uniform vec3 u_noiseColorA;
		uniform vec3 u_noiseColorB;
		uniform float u_noiseScale;
		uniform float u_noiseDetail;
		uniform float u_noiseContrast;
		uniform float u_noiseBalance;
		uniform float u_noiseSeed;
		uniform float u_noiseSpeed;
		uniform int u_noiseBlendMode;

		uniform int u_gradientVisible;
		uniform vec3 u_gradientColorA;
		uniform vec3 u_gradientColorB;
		uniform float u_gradientOpacity;
		uniform vec2 u_gradientStart;
		uniform vec2 u_gradientEnd;
		uniform float u_gradientAngle;
		uniform float u_gradientOffsetX;
		uniform int u_gradientBlendMode;

		uniform int u_trailVisible;
		uniform vec3 u_trailColorA;
		uniform vec3 u_trailColorB;
		uniform float u_trailRadius;
		uniform float u_trailTaper;
		uniform float u_trailSoftness;
		uniform float u_trailIntensity;
		uniform float u_trailGlowEnabled;
		uniform float u_trailGlowRadius;
		uniform float u_trailGlowIntensity;
		uniform int u_trailBlendMode;
		uniform vec2 u_trail[TRAIL_COUNT];
		uniform int u_trailCount;

		uniform int u_pixelVisible;
		uniform float u_pixelScale;
		uniform float u_pixelGap;
		uniform float u_pixelRoundness;
		uniform int u_pixelBlendMode;

		uniform int u_ditherVisible;
		uniform int u_ditherPattern;
		uniform float u_ditherPixelSize;
		uniform float u_ditherThreshold;
		uniform float u_ditherSpread;
		uniform int u_ditherColorMode;
		uniform vec3 u_ditherColorA;
		uniform vec3 u_ditherColorB;
		uniform int u_ditherBlendMode;

		uniform int u_duotoneVisible;
		uniform vec3 u_duotoneColorA;
		uniform vec3 u_duotoneColorB;
		uniform float u_duotoneBlend;
		uniform int u_duotoneBlendMode;

		uniform int u_rippleVisible;
		uniform vec3 u_rippleColorA;
		uniform vec3 u_rippleColorB;
		uniform float u_rippleIntensity;
		uniform float u_rippleMaxRadius;
		uniform float u_rippleCenterSize;
		uniform float u_rippleSoftness;
		uniform float u_rippleRadialPower;
		uniform float u_rippleFade;
		uniform int u_rippleBlendMode;
		uniform vec2 u_ripple[RIPPLE_COUNT];
		uniform float u_rippleAge[RIPPLE_COUNT];
		uniform int u_rippleCount;

		in vec2 v_uv;
		out vec4 outColor;

		float hash(vec2 p) {
			p = fract(p * vec2(123.34, 456.21));
			p += dot(p, p + 45.32);
			return fract(p.x * p.y);
		}

		float valueNoise(vec2 p) {
			vec2 i = floor(p);
			vec2 f = fract(p);
			vec2 u = f * f * (3.0 - 2.0 * f);

			return mix(
				mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
				mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
				u.y
			);
		}

		float fbm(vec2 p) {
			float value = 0.0;
			float amplitude = 0.5;
			mat2 rotate = mat2(0.8, -0.6, 0.6, 0.8);
			int detail = int(clamp(floor(u_noiseDetail + 0.5), 1.0, 8.0));

			for (int i = 0; i < 8; i++) {
				if (i >= detail) break;
				value += amplitude * valueNoise(p);
				p = rotate * p * 2.05 + 12.4;
				amplitude *= 0.5;
			}

			return value;
		}

		float noiseByType(vec2 p) {
			float n = valueNoise(p);

			if (u_noiseType == 1) {
				n = fbm(p);
			} else if (u_noiseType == 2) {
				n = 1.0 - abs(fbm(p) * 2.0 - 1.0);
			} else if (u_noiseType == 3) {
				n = abs(fbm(p) * 2.0 - 1.0);
			}

			return n;
		}

		float bayerSeed(int x, int y) {
			return float(y * 3 + x * 2 - x * y * 4);
		}

		float bayer2(vec2 pixel) {
			int x = int(mod(pixel.x, 2.0));
			int y = int(mod(pixel.y, 2.0));

			return bayerSeed(x, y) / 4.0;
		}

		float bayer4(vec2 pixel) {
			int x = int(mod(pixel.x, 4.0));
			int y = int(mod(pixel.y, 4.0));
			float low = bayerSeed(x % 2, y % 2);
			float high = bayerSeed(x / 2, y / 2);

			return (low * 4.0 + high) / 16.0;
		}

		float bayer8(vec2 pixel) {
			int x = int(mod(pixel.x, 8.0));
			int y = int(mod(pixel.y, 8.0));
			float a = bayerSeed(x % 2, y % 2);
			float b = bayerSeed((x / 2) % 2, (y / 2) % 2);
			float c = bayerSeed(x / 4, y / 4);

			return (a * 16.0 + b * 4.0 + c) / 64.0;
		}

		float clusteredDot(vec2 pixel) {
			int x = int(mod(pixel.x, 4.0));
			int y = int(mod(pixel.y, 4.0));
			int index = x + y * 4;

			if (index == 0) return 0.75;
			if (index == 1) return 0.3125;
			if (index == 2) return 0.375;
			if (index == 3) return 0.8125;
			if (index == 4) return 0.25;
			if (index == 5) return 0.0;
			if (index == 6) return 0.0625;
			if (index == 7) return 0.4375;
			if (index == 8) return 0.6875;
			if (index == 9) return 0.1875;
			if (index == 10) return 0.125;
			if (index == 11) return 0.5;
			if (index == 12) return 0.9375;
			if (index == 13) return 0.625;
			if (index == 14) return 0.5625;
			return 0.875;
		}

		float ditherValue(vec2 pixel) {
			if (u_ditherPattern == 0) return bayer2(pixel);
			if (u_ditherPattern == 1) return bayer4(pixel);
			if (u_ditherPattern == 2) return bayer8(pixel);
			if (u_ditherPattern == 3) return clusteredDot(pixel);
			if (u_ditherPattern == 4) {
				return fract(52.9829189 * fract(pixel.x * 0.06711056 + pixel.y * 0.00583715));
			}

			return hash(pixel);
		}

		vec2 rotateAround(vec2 point, vec2 center, float angle) {
			float c = cos(angle);
			float s = sin(angle);
			vec2 p = point - center;

			return center + vec2(p.x * c - p.y * s, p.x * s + p.y * c);
		}

		vec3 screenBlend(vec3 base, vec3 add) {
			return min(base + add, vec3(1.0));
		}

		vec3 blendColor(vec3 base, vec3 layer, int mode) {
			if (mode == 1 || mode == 6) return min(base + layer, vec3(1.0));
			if (mode == 2) return 1.0 - (1.0 - base) * (1.0 - layer);
			if (mode == 3) return base * layer;
			if (mode == 4) {
				return mix(2.0 * base * layer, 1.0 - 2.0 * (1.0 - base) * (1.0 - layer), step(vec3(0.5), base));
			}
			if (mode == 5) {
				return (1.0 - 2.0 * layer) * base * base + 2.0 * layer * base;
			}
			if (mode == 7) return abs(base - layer);
			if (mode == 8) return 1.0 - base;

			return layer;
		}

		vec3 applyBlend(vec3 base, vec3 layer, int mode, float amount) {
			return mix(base, blendColor(base, layer, mode), clamp(amount, 0.0, 1.0));
		}

		float segmentDistance(vec2 p, vec2 a, vec2 b) {
			vec2 pa = p - a;
			vec2 ba = b - a;
			float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);

			return length(pa - ba * h);
		}

		void main() {
			vec2 aspect = vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0);
			float longest = max(u_resolution.x, u_resolution.y);
			vec2 uv = v_uv;
			vec2 pixelUv = uv;
			float pixelMask = 1.0;

			if (u_pixelVisible == 1) {
				float cell = max(longest / max(u_pixelScale, 1.0), 1.0);
				pixelUv = (floor(uv * u_resolution / cell) + 0.5) * cell / u_resolution;

				vec2 localUv = fract(uv * u_resolution / cell) - 0.5;
				float halfSize = max(0.001, 0.5 - u_pixelGap * 0.5);
				float cornerRadius = u_pixelRoundness * halfSize;
				vec2 rounded = max(abs(localUv) - halfSize + cornerRadius, 0.0);
				pixelMask = step(length(rounded) - cornerRadius, 0.0);
			}

			vec2 corrected = vec2(pixelUv.x * aspect.x, pixelUv.y);
			vec3 base = vec3(0.02);

			if (u_noiseVisible == 1) {
				float t = u_time * u_noiseSpeed;
				float n = noiseByType(corrected * exp(u_noiseScale) * 4.2 + u_noiseSeed + vec2(t * 0.08, -t * 0.05));
				n = clamp((n - 0.5) * (u_noiseContrast + 1.0) + 0.5 + u_noiseBalance * 0.5, 0.0, 1.0);
				base = applyBlend(base, mix(u_noiseColorB, u_noiseColorA, n), u_noiseBlendMode, 1.0);
			}

			if (u_gradientVisible == 1) {
				vec2 gradientStart = u_gradientStart + vec2(u_gradientOffsetX, 0.0);
				vec2 gradientEnd = u_gradientEnd + vec2(u_gradientOffsetX, 0.0);
				vec2 midpoint = (gradientStart + gradientEnd) * 0.5;
				vec2 gradientUv = rotateAround(pixelUv, midpoint, -radians(u_gradientAngle));
				vec2 gradientVector = gradientEnd - gradientStart;
				float gradientT = clamp(dot(gradientUv - gradientStart, gradientVector) / max(dot(gradientVector, gradientVector), 0.0001), 0.0, 1.0);
				vec3 gradient = mix(u_gradientColorA, u_gradientColorB, gradientT);
				base = applyBlend(base, gradient * (1.0 - gradientT), u_gradientBlendMode, u_gradientOpacity);
			}

			if (u_trailVisible == 1) {
				vec3 trailCore = vec3(0.0);
				vec3 trailGlow = vec3(0.0);
				float coreMask = 0.0;
				float glowMask = 0.0;
				int segmentCount = max(u_trailCount - 1, 0);

				for (int i = 0; i < TRAIL_COUNT - 1; i++) {
					if (i >= segmentCount) break;

					float age = float(i) / max(float(segmentCount), 1.0);
					vec2 a = u_trail[i] * aspect;
					vec2 b = u_trail[i + 1] * aspect;
					vec2 p = pixelUv * aspect;
					float width = max(u_trailRadius * 0.11 * mix(1.0, 1.0 - age, u_trailTaper), 0.001);
					float dist = segmentDistance(p, a, b);
					float core = smoothstep(width + u_trailSoftness, width, dist) * (1.0 - age);
					float glowWidth = width * (1.0 + u_trailGlowRadius * 4.0);
					float glow = smoothstep(glowWidth, width, dist) * (1.0 - age) * u_trailGlowEnabled;

					coreMask = max(coreMask, core);
					glowMask = max(glowMask, glow);
					trailCore += mix(u_trailColorA, u_trailColorB, age) * core;
					trailGlow += mix(u_trailColorA, u_trailColorB, age) * glow;
				}

				vec3 trail = trailCore * u_trailIntensity + trailGlow * u_trailGlowIntensity;
				float amount = clamp(coreMask * u_trailIntensity + glowMask * u_trailGlowIntensity, 0.0, 1.0);
				base = applyBlend(base, trail, u_trailBlendMode, amount);
			}

			if (u_rippleVisible == 1) {
				vec3 rippleLayer = vec3(0.0);
				float rippleMask = 0.0;

				for (int i = 0; i < RIPPLE_COUNT; i++) {
					if (i >= u_rippleCount) break;

					float age = clamp(u_rippleAge[i], 0.0, 1.0);
					vec2 center = u_ripple[i] * aspect;
					float radius = max(u_rippleMaxRadius * age, 0.0001);
					float radial = length(pixelUv * aspect - center) / radius;
					float centerFade = smoothstep(u_rippleCenterSize, u_rippleCenterSize + u_rippleSoftness, radial);
					float edgeFade = 1.0 - smoothstep(1.0 - u_rippleSoftness, 1.0, radial);
					float lifeFade = mix(1.0, 1.0 - age, u_rippleFade);
					float mask = centerFade * edgeFade * lifeFade;
					vec3 color = mix(u_rippleColorA, u_rippleColorB, pow(clamp(radial, 0.0, 1.0), u_rippleRadialPower));

					rippleMask = max(rippleMask, mask);
					rippleLayer += color * mask;
				}

				base = applyBlend(base, rippleLayer, u_rippleBlendMode, clamp(rippleMask * u_rippleIntensity, 0.0, 1.0));
			}

			if (u_ditherVisible == 1) {
				float luminance = dot(base, vec3(0.299, 0.587, 0.114));
				vec2 ditherPixel = floor(gl_FragCoord.xy / max(u_ditherPixelSize, 1.0));
				float threshold = 0.5 + (ditherValue(ditherPixel) - 0.5) * u_ditherSpread;
				float dithered = step(threshold, luminance + u_ditherThreshold - 0.5);

				vec3 ditherLayer = u_ditherColorMode == 1
					? mix(u_ditherColorA, u_ditherColorB, dithered)
					: mix(base * 0.32, min(base * 1.3, vec3(1.0)), dithered);

				base = applyBlend(base, ditherLayer, u_ditherBlendMode, 1.0);
			}

			if (u_duotoneVisible == 1) {
				float luminance = dot(base, vec3(0.299, 0.587, 0.114));
				float tone = smoothstep(u_duotoneBlend - 0.5, u_duotoneBlend + 0.5, luminance);
				base = applyBlend(base, mix(u_duotoneColorA, u_duotoneColorB, tone), u_duotoneBlendMode, 1.0);
			}

			base = applyBlend(base, vec3(0.106, 0.098, 0.122), u_pixelBlendMode, 1.0 - pixelMask);
			outColor = vec4(base, 1.0);
		}
	`;

	const webgpuSource = /* wgsl */ `
		struct VertexOut {
			@builtin(position) position: vec4f,
			@location(0) uv: vec2f,
		}

		struct Uniforms {
			data: array<vec4f, 128>,
		}

		@group(0) @binding(0) var<uniform> uniforms: Uniforms;

		fn readUniform(index: u32) -> vec4f {
			return uniforms.data[index];
		}

		@vertex fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
			var out: VertexOut;
			let positions = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
			let position = positions[vertexIndex];

			out.position = vec4f(position, 0.0, 1.0);
			out.uv = position * 0.5 + vec2f(0.5);

			return out;
		}

		fn hash(pIn: vec2f) -> f32 {
			var p = fract(pIn * vec2f(123.34, 456.21));
			p = p + dot(p, p + vec2f(45.32));

			return fract(p.x * p.y);
		}

		fn valueNoise(p: vec2f) -> f32 {
			let i = floor(p);
			let f = fract(p);
			let eased = f * f * (vec2f(3.0) - 2.0 * f);

			return mix(
				mix(hash(i + vec2f(0.0, 0.0)), hash(i + vec2f(1.0, 0.0)), eased.x),
				mix(hash(i + vec2f(0.0, 1.0)), hash(i + vec2f(1.0, 1.0)), eased.x),
				eased.y
			);
		}

		fn fbm(pIn: vec2f) -> f32 {
			var p = pIn;
			var value = 0.0;
			var amplitude = 0.5;
			let detail = i32(clamp(floor(readUniform(1u).w + 0.5), 1.0, 8.0));

			for (var i = 0; i < 8; i = i + 1) {
				if (i >= detail) { break; }
				value = value + amplitude * valueNoise(p);
				p = vec2f(p.x * 0.8 - p.y * 0.6, p.x * 0.6 + p.y * 0.8) * 2.05 + vec2f(12.4);
				amplitude = amplitude * 0.5;
			}

			return value;
		}

		fn noiseByType(p: vec2f) -> f32 {
			let noiseType = i32(round(readUniform(1u).y));
			var n = valueNoise(p);

			if (noiseType == 1) {
				n = fbm(p);
			} else if (noiseType == 2) {
				n = 1.0 - abs(fbm(p) * 2.0 - 1.0);
			} else if (noiseType == 3) {
				n = abs(fbm(p) * 2.0 - 1.0);
			}

			return n;
		}

		fn bayerSeed(x: i32, y: i32) -> f32 {
			return f32(y * 3 + x * 2 - x * y * 4);
		}

		fn bayer2(pixel: vec2f) -> f32 {
			let x = i32(pixel.x) % 2;
			let y = i32(pixel.y) % 2;

			return bayerSeed(x, y) / 4.0;
		}

		fn bayer4(pixel: vec2f) -> f32 {
			let x = i32(pixel.x) % 4;
			let y = i32(pixel.y) % 4;
			let low = bayerSeed(x % 2, y % 2);
			let high = bayerSeed(x / 2, y / 2);

			return (low * 4.0 + high) / 16.0;
		}

		fn bayer8(pixel: vec2f) -> f32 {
			let x = i32(pixel.x) % 8;
			let y = i32(pixel.y) % 8;
			let a = bayerSeed(x % 2, y % 2);
			let b = bayerSeed((x / 2) % 2, (y / 2) % 2);
			let c = bayerSeed(x / 4, y / 4);

			return (a * 16.0 + b * 4.0 + c) / 64.0;
		}

		fn clusteredDot(pixel: vec2f) -> f32 {
			let x = i32(pixel.x) % 4;
			let y = i32(pixel.y) % 4;
			let index = x + y * 4;

			if (index == 0) { return 0.75; }
			if (index == 1) { return 0.3125; }
			if (index == 2) { return 0.375; }
			if (index == 3) { return 0.8125; }
			if (index == 4) { return 0.25; }
			if (index == 5) { return 0.0; }
			if (index == 6) { return 0.0625; }
			if (index == 7) { return 0.4375; }
			if (index == 8) { return 0.6875; }
			if (index == 9) { return 0.1875; }
			if (index == 10) { return 0.125; }
			if (index == 11) { return 0.5; }
			if (index == 12) { return 0.9375; }
			if (index == 13) { return 0.625; }
			if (index == 14) { return 0.5625; }

			return 0.875;
		}

		fn ditherValue(pixel: vec2f) -> f32 {
			let pattern = i32(round(readUniform(15u).y));

			if (pattern == 0) { return bayer2(pixel); }
			if (pattern == 1) { return bayer4(pixel); }
			if (pattern == 2) { return bayer8(pixel); }
			if (pattern == 3) { return clusteredDot(pixel); }
			if (pattern == 4) {
				return fract(52.9829189 * fract(pixel.x * 0.06711056 + pixel.y * 0.00583715));
			}

			return hash(pixel);
		}

		fn rotateAround(point: vec2f, center: vec2f, angle: f32) -> vec2f {
			let c = cos(angle);
			let s = sin(angle);
			let p = point - center;

			return center + vec2f(p.x * c - p.y * s, p.x * s + p.y * c);
		}

		fn blendColor(base: vec3f, layer: vec3f, modeValue: f32) -> vec3f {
			let mode = i32(round(modeValue));

			if (mode == 1 || mode == 6) { return min(base + layer, vec3f(1.0)); }
			if (mode == 2) { return vec3f(1.0) - (vec3f(1.0) - base) * (vec3f(1.0) - layer); }
			if (mode == 3) { return base * layer; }
			if (mode == 4) {
				return select(
					2.0 * base * layer,
					vec3f(1.0) - 2.0 * (vec3f(1.0) - base) * (vec3f(1.0) - layer),
					base >= vec3f(0.5)
				);
			}
			if (mode == 5) { return (vec3f(1.0) - 2.0 * layer) * base * base + 2.0 * layer * base; }
			if (mode == 7) { return abs(base - layer); }
			if (mode == 8) { return vec3f(1.0) - base; }

			return layer;
		}

		fn applyBlend(base: vec3f, layer: vec3f, modeValue: f32, amount: f32) -> vec3f {
			return mix(base, blendColor(base, layer, modeValue), clamp(amount, 0.0, 1.0));
		}

		fn segmentDistance(p: vec2f, a: vec2f, b: vec2f) -> f32 {
			let pa = p - a;
			let ba = b - a;
			let h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);

			return length(pa - ba * h);
		}

		@fragment fn fragmentMain(input: VertexOut) -> @location(0) vec4f {
			let resolution = readUniform(0u).xy;
			let time = readUniform(0u).z;
			let aspect = vec2f(resolution.x / max(resolution.y, 1.0), 1.0);
			let longest = max(resolution.x, resolution.y);
			let uv = input.uv;
			var pixelUv = uv;
			var pixelMask = 1.0;

			let pixel = readUniform(14u);
			if (pixel.x == 1.0) {
				let cell = max(longest / max(pixel.y, 1.0), 1.0);
				pixelUv = (floor(uv * resolution / vec2f(cell)) + vec2f(0.5)) * cell / resolution;

				let localUv = fract(uv * resolution / vec2f(cell)) - vec2f(0.5);
				let halfSize = max(0.001, 0.5 - pixel.z * 0.5);
				let cornerRadius = pixel.w * halfSize;
				let rounded = max(abs(localUv) - vec2f(halfSize - cornerRadius), vec2f(0.0));
				pixelMask = select(0.0, 1.0, length(rounded) - cornerRadius <= 0.0);
			}

			let corrected = vec2f(pixelUv.x * aspect.x, pixelUv.y);
			var base = vec3f(0.02);

			let noise = readUniform(1u);
			if (noise.x == 1.0) {
				let noiseMeta = readUniform(4u);
				let t = time * noiseMeta.w;
				var n = noiseByType(corrected * exp(noise.z) * 4.2 + noiseMeta.z + vec2f(t * 0.08, -t * 0.05));
				n = clamp((n - 0.5) * (noiseMeta.x + 1.0) + 0.5 + noiseMeta.y * 0.5, 0.0, 1.0);
				base = applyBlend(base, mix(readUniform(3u).rgb, readUniform(2u).rgb, n), readUniform(27u).x, 1.0);
			}

			let gradient = readUniform(5u);
			if (gradient.x == 1.0) {
				let gradientPoints = readUniform(8u);
				let gradientStart = gradientPoints.xy + vec2f(gradient.w, 0.0);
				let gradientEnd = gradientPoints.zw + vec2f(gradient.w, 0.0);
				let midpoint = (gradientStart + gradientEnd) * 0.5;
				let gradientUv = rotateAround(pixelUv, midpoint, -gradient.z * 0.01745329252);
				let gradientVector = gradientEnd - gradientStart;
				let gradientT = clamp(dot(gradientUv - gradientStart, gradientVector) / max(dot(gradientVector, gradientVector), 0.0001), 0.0, 1.0);
				let gradientColor = mix(readUniform(6u).rgb, readUniform(7u).rgb, gradientT);
				base = applyBlend(base, gradientColor * (1.0 - gradientT), readUniform(27u).y, gradient.y);
			}

			let trail = readUniform(9u);
			if (trail.x == 1.0) {
				var trailCore = vec3f(0.0);
				var trailGlow = vec3f(0.0);
				var coreMask = 0.0;
				var glowMask = 0.0;
				let trailCount = u32(round(readUniform(13u).y));
				var segmentCount = 0u;

				if (trailCount > 0u) {
					segmentCount = trailCount - 1u;
				}

				for (var i: u32 = 0u; i < 63u; i = i + 1u) {
					if (i >= segmentCount) { break; }

					let age = f32(i) / max(f32(segmentCount), 1.0);
					let a = readUniform(32u + i).xy * aspect;
					let b = readUniform(32u + i + 1u).xy * aspect;
					let p = pixelUv * aspect;
					let width = max(trail.y * 0.11 * mix(1.0, 1.0 - age, trail.z), 0.001);
					let dist = segmentDistance(p, a, b);
					let core = smoothstep(width + trail.w, width, dist) * (1.0 - age);
					let glowWidth = width * (1.0 + readUniform(12u).z * 4.0);
					let glow = smoothstep(glowWidth, width, dist) * (1.0 - age) * readUniform(12u).y;

					coreMask = max(coreMask, core);
					glowMask = max(glowMask, glow);
					trailCore = trailCore + mix(readUniform(10u).rgb, readUniform(11u).rgb, age) * core;
					trailGlow = trailGlow + mix(readUniform(10u).rgb, readUniform(11u).rgb, age) * glow;
				}

				let trailColor = trailCore * readUniform(12u).x + trailGlow * readUniform(12u).w;
				let amount = clamp(coreMask * readUniform(12u).x + glowMask * readUniform(12u).w, 0.0, 1.0);
				base = applyBlend(base, trailColor, readUniform(13u).x, amount);
			}

			let ripple = readUniform(22u);
			if (ripple.x == 1.0) {
				var rippleLayer = vec3f(0.0);
				var rippleMask = 0.0;
				let rippleCount = u32(round(readUniform(26u).x));

				for (var i: u32 = 0u; i < 8u; i = i + 1u) {
					if (i >= rippleCount) { break; }

					let rippleData = readUniform(96u + i);
					let age = clamp(rippleData.z, 0.0, 1.0);
					let center = rippleData.xy * aspect;
					let radius = max(ripple.z * age, 0.0001);
					let radial = length(pixelUv * aspect - center) / radius;
					let centerFade = smoothstep(ripple.w, ripple.w + readUniform(23u).x, radial);
					let edgeFade = 1.0 - smoothstep(1.0 - readUniform(23u).x, 1.0, radial);
					let lifeFade = mix(1.0, 1.0 - age, readUniform(23u).z);
					let mask = centerFade * edgeFade * lifeFade;
					let color = mix(readUniform(24u).rgb, readUniform(25u).rgb, pow(clamp(radial, 0.0, 1.0), readUniform(23u).y));

					rippleMask = max(rippleMask, mask);
					rippleLayer = rippleLayer + color * mask;
				}

				base = applyBlend(base, rippleLayer, readUniform(23u).w, clamp(rippleMask * ripple.y, 0.0, 1.0));
			}

			let dither = readUniform(15u);
			if (dither.x == 1.0) {
				let ditherMeta = readUniform(16u);
				let luminance = dot(base, vec3f(0.299, 0.587, 0.114));
				let ditherPixel = floor(input.position.xy / vec2f(max(dither.z, 1.0)));
				let threshold = 0.5 + (ditherValue(ditherPixel) - 0.5) * ditherMeta.x;
				let dithered = select(0.0, 1.0, luminance + dither.w - 0.5 >= threshold);
				let ditherLayer = select(
					mix(base * 0.32, min(base * 1.3, vec3f(1.0)), dithered),
					mix(readUniform(17u).rgb, readUniform(18u).rgb, dithered),
					ditherMeta.y == 1.0
				);

				base = applyBlend(base, ditherLayer, ditherMeta.z, 1.0);
			}

			let duotone = readUniform(19u);
			if (duotone.x == 1.0) {
				let luminance = dot(base, vec3f(0.299, 0.587, 0.114));
				let tone = smoothstep(duotone.y - 0.5, duotone.y + 0.5, luminance);
				base = applyBlend(base, mix(readUniform(20u).rgb, readUniform(21u).rgb, tone), duotone.z, 1.0);
			}

			base = applyBlend(base, vec3f(0.106, 0.098, 0.122), readUniform(27u).z, 1.0 - pixelMask);

			return vec4f(base, 1.0);
		}
	`;

	function compileShader(gl, type, source) {
		const shader = gl.createShader(type);
		gl.shaderSource(shader, source);
		gl.compileShader(shader);

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			const log = gl.getShaderInfoLog(shader);
			gl.deleteShader(shader);
			throw new Error(log || 'Shader compile failed');
		}

		return shader;
	}

	function createProgram(gl) {
		const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
		const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
		const program = gl.createProgram();

		gl.attachShader(program, vertexShader);
		gl.attachShader(program, fragmentShader);
		gl.linkProgram(program);
		gl.deleteShader(vertexShader);
		gl.deleteShader(fragmentShader);

		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const log = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(log || 'Shader program link failed');
		}

		return program;
	}

	function number(value, fallback) {
		return Number.isFinite(value) ? value : fallback;
	}

	function componentConfig(name) {
		return config?.[name] ?? fallbackConfig[name];
	}

	function colorValue(value, fallback) {
		return Array.isArray(value) ? value : fallback;
	}

	function uniform1f(gl, location, value, fallback = 0) {
		if (location !== null) gl.uniform1f(location, number(value, fallback));
	}

	function uniform1i(gl, location, value) {
		if (location !== null) gl.uniform1i(location, value);
	}

	function uniform2f(gl, location, value, fallback) {
		if (location === null) return;
		const next = Array.isArray(value) ? value : fallback;

		gl.uniform2f(location, number(next?.[0], fallback[0]), number(next?.[1], fallback[1]));
	}

	function uniform3f(gl, location, value, fallback) {
		if (location === null) return;
		const next = colorValue(value, fallback);

		gl.uniform3f(
			location,
			number(next?.[0], fallback[0]),
			number(next?.[1], fallback[1]),
			number(next?.[2], fallback[2])
		);
	}

	function writeVec4(target, index, x = 0, y = 0, z = 0, w = 0) {
		const offset = index * 4;

		target[offset] = number(x, 0);
		target[offset + 1] = number(y, 0);
		target[offset + 2] = number(z, 0);
		target[offset + 3] = number(w, 0);
	}

	function formatWgslMessage(message) {
		const line = message.lineNum ? `:${message.lineNum}:${message.linePos ?? 0}` : '';

		return `${message.type ?? 'message'}${line} ${message.message}`;
	}

	async function validateShaderModule(shaderModule) {
		if (!shaderModule.getCompilationInfo) return;

		const compilationInfo = await shaderModule.getCompilationInfo();
		const errors = compilationInfo.messages.filter((message) => message.type === 'error');

		if (errors.length) throw new Error(errors.map(formatWgslMessage).join('\n'));
	}

	function startWebgpuRenderer() {
		let frame = 0;
		let resizeObserver;
		let lastTime = performance.now();
		let lastStatsTime = lastTime;
		let frameCount = 0;
		let frameTimeTotal = 0;
		let hasPointer = false;
		let configured = false;
		let stopped = false;
		let device;
		const pointer = { x: 0.5, y: 0.5 };
		const trail = [];
		const ripples = [];

		async function start() {
			try {
				if (!navigator.gpu) throw new Error('WebGPU unavailable');

				const adapter = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
				if (!adapter) throw new Error('WebGPU adapter unavailable');

				device = await adapter.requestDevice();
				if (stopped) {
					device.destroy?.();
					return;
				}

				const context = canvas.getContext('webgpu');
				if (!context) throw new Error('WebGPU canvas context unavailable');

				const format = navigator.gpu.getPreferredCanvasFormat();
				const uniformData = new Float32Array(128 * 4);
				const uniformBuffer = device.createBuffer({
					size: uniformData.byteLength,
					usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
				});
				device.pushErrorScope('validation');
				const shaderModule = device.createShaderModule({ code: webgpuSource });
				const shaderError = await device.popErrorScope();

				if (shaderError) throw new Error(shaderError.message);
				await validateShaderModule(shaderModule);

				device.pushErrorScope('validation');
				let pipeline;
				let pipelineError;
				try {
					pipeline = await device.createRenderPipelineAsync({
						layout: 'auto',
						vertex: { module: shaderModule, entryPoint: 'vertexMain' },
						fragment: {
							module: shaderModule,
							entryPoint: 'fragmentMain',
							targets: [{ format }]
						},
						primitive: { topology: 'triangle-list' }
					});
				} catch (error) {
					pipelineError = await device.popErrorScope();
					throw new Error(
						pipelineError?.message ?? error?.message ?? 'WebGPU pipeline creation failed'
					);
				}
				pipelineError = await device.popErrorScope();

				if (pipelineError) throw new Error(pipelineError.message);

				const bindGroup = device.createBindGroup({
					layout: pipeline.getBindGroupLayout(0),
					entries: [{ binding: 0, resource: { buffer: uniformBuffer } }]
				});

				function configure() {
					const cursorTrail = componentConfig('cursorTrail');
					const renderScale = Math.max(0.25, Math.min(number(cursorTrail.renderScale, 1), 2));
					const dpr = Math.min(window.devicePixelRatio || 1, 2) * renderScale;
					const rect = canvas.getBoundingClientRect();
					const width = Math.max(1, Math.round(rect.width * dpr));
					const height = Math.max(1, Math.round(rect.height * dpr));

					if (!configured || canvas.width !== width || canvas.height !== height) {
						canvas.width = width;
						canvas.height = height;
						context.configure({ device, format, alphaMode: 'opaque' });
						configured = true;
					}
				}

				function eventPoint(event) {
					const rect = canvas.getBoundingClientRect();
					if (!rect.width || !rect.height) return null;

					return {
						x: (event.clientX - rect.left) / rect.width,
						y: 1 - (event.clientY - rect.top) / rect.height
					};
				}

				function addTrailPoint(event) {
					if (!interactive) return;

					const point = eventPoint(event);
					if (!point) return;

					pointer.x = point.x;
					pointer.y = point.y;
					hasPointer = true;

					if (!trail.length) {
						for (let i = 0; i < trailLimit; i++) trail.push({ x: pointer.x, y: pointer.y });
					}
				}

				function addRipple(event) {
					if (!interactive) return;
					const clickRipple = componentConfig('clickRipple');
					if (!clickRipple.visible) return;

					const point = eventPoint(event);
					if (!point) return;

					ripples.unshift({ x: point.x, y: point.y, age: 0 });
					ripples.length = Math.min(ripples.length, rippleLimit);
				}

				function syncTrail(cursorTrail) {
					if (!hasPointer) return;

					while (trail.length < trailLimit) trail.push({ x: pointer.x, y: pointer.y });

					const smoothing = Math.max(0.02, Math.min(number(cursorTrail.smoothing, 0.22), 1));
					const length = Math.max(0.1, number(cursorTrail.length, 0.55));
					const follow = Math.min(smoothing * (1 + length), 1);

					trail[0].x += (pointer.x - trail[0].x) * follow;
					trail[0].y += (pointer.y - trail[0].y) * follow;

					for (let index = 1; index < trail.length; index++) {
						const previous = trail[index - 1];
						const point = trail[index];
						const drag = Math.min(smoothing * (1.5 - Math.min(index / trailLimit, 1) * 0.65), 1);

						point.x += (previous.x - point.x) * drag;
						point.y += (previous.y - point.y) * drag;
					}
				}

				function syncRipples(delta) {
					const clickRipple = componentConfig('clickRipple');
					const duration = Math.max(0.1, number(clickRipple.duration, 0.85));

					for (const ripple of ripples) ripple.age += delta / duration;
					while (ripples.length && ripples[ripples.length - 1].age > 1) ripples.pop();
				}

				function writeConfig(now, cursorTrail) {
					const simplexNoise = componentConfig('simplexNoise');
					const linearGradient = componentConfig('linearGradient');
					const pixelate = componentConfig('pixelate');
					const dither = componentConfig('dither');
					const duotone = componentConfig('duotone');
					const clickRipple = componentConfig('clickRipple');
					const trailCount = Math.max(
						0,
						Math.min(Math.round(number(cursorTrail.sampleCount, 32)), trail.length, trailLimit)
					);

					uniformData.fill(0);
					writeVec4(uniformData, 0, canvas.width, canvas.height, now / 1000, 0);
					writeVec4(
						uniformData,
						1,
						simplexNoise.visible ? 1 : 0,
						simplexNoise.type,
						simplexNoise.scale,
						simplexNoise.detail
					);
					writeVec4(
						uniformData,
						2,
						...colorValue(simplexNoise.colorA, fallbackConfig.simplexNoise.colorA)
					);
					writeVec4(
						uniformData,
						3,
						...colorValue(simplexNoise.colorB, fallbackConfig.simplexNoise.colorB)
					);
					writeVec4(
						uniformData,
						4,
						simplexNoise.contrast,
						simplexNoise.balance,
						simplexNoise.seed,
						simplexNoise.speed
					);
					writeVec4(
						uniformData,
						5,
						linearGradient.visible ? 1 : 0,
						linearGradient.opacity,
						linearGradient.angle,
						linearGradient.offsetX
					);
					writeVec4(
						uniformData,
						6,
						...colorValue(linearGradient.colorA, fallbackConfig.linearGradient.colorA)
					);
					writeVec4(
						uniformData,
						7,
						...colorValue(linearGradient.colorB, fallbackConfig.linearGradient.colorB)
					);
					writeVec4(
						uniformData,
						8,
						...(Array.isArray(linearGradient.start)
							? linearGradient.start
							: fallbackConfig.linearGradient.start),
						...(Array.isArray(linearGradient.end)
							? linearGradient.end
							: fallbackConfig.linearGradient.end)
					);
					writeVec4(
						uniformData,
						9,
						cursorTrail.visible ? 1 : 0,
						cursorTrail.radius,
						cursorTrail.taper,
						cursorTrail.softness
					);
					writeVec4(
						uniformData,
						10,
						...colorValue(cursorTrail.colorA, fallbackConfig.cursorTrail.colorA)
					);
					writeVec4(
						uniformData,
						11,
						...colorValue(cursorTrail.colorB, fallbackConfig.cursorTrail.colorB)
					);
					writeVec4(
						uniformData,
						12,
						cursorTrail.intensity,
						cursorTrail.glowEnabled ? 1 : 0,
						cursorTrail.glowRadius,
						cursorTrail.glowIntensity
					);
					writeVec4(uniformData, 13, cursorTrail.blendMode, trailCount, 0, 0);
					writeVec4(
						uniformData,
						14,
						pixelate.visible ? 1 : 0,
						pixelate.scale,
						pixelate.gap,
						pixelate.roundness
					);
					writeVec4(
						uniformData,
						15,
						dither.visible ? 1 : 0,
						dither.pattern,
						dither.pixelSize,
						dither.threshold
					);
					writeVec4(uniformData, 16, dither.spread, dither.colorMode, dither.blendMode, 0);
					writeVec4(uniformData, 17, ...colorValue(dither.colorA, fallbackConfig.dither.colorA));
					writeVec4(uniformData, 18, ...colorValue(dither.colorB, fallbackConfig.dither.colorB));
					writeVec4(uniformData, 19, duotone.visible ? 1 : 0, duotone.blend, duotone.blendMode, 0);
					writeVec4(uniformData, 20, ...colorValue(duotone.colorA, fallbackConfig.duotone.colorA));
					writeVec4(uniformData, 21, ...colorValue(duotone.colorB, fallbackConfig.duotone.colorB));
					writeVec4(
						uniformData,
						22,
						clickRipple.visible ? 1 : 0,
						clickRipple.intensity,
						clickRipple.maxRadius,
						clickRipple.centerSize
					);
					writeVec4(
						uniformData,
						23,
						clickRipple.softness,
						clickRipple.radialPower,
						clickRipple.fade,
						clickRipple.blendMode
					);
					writeVec4(
						uniformData,
						24,
						...colorValue(clickRipple.colorA, fallbackConfig.clickRipple.colorA)
					);
					writeVec4(
						uniformData,
						25,
						...colorValue(clickRipple.colorB, fallbackConfig.clickRipple.colorB)
					);
					writeVec4(uniformData, 26, ripples.length, 0, 0, 0);
					writeVec4(
						uniformData,
						27,
						simplexNoise.blendMode,
						linearGradient.blendMode,
						pixelate.blendMode,
						0
					);

					trail.slice(0, trailCount).forEach((point, index) => {
						writeVec4(uniformData, 32 + index, point.x, point.y, 0, 0);
					});
					ripples.forEach((ripple, index) => {
						writeVec4(uniformData, 96 + index, ripple.x, ripple.y, ripple.age, 0);
					});

					return trailCount;
				}

				function render(now) {
					if (stopped) return;

					const cursorTrail = componentConfig('cursorTrail');
					const delta = Math.min((now - lastTime) / 1000, 0.05);
					lastTime = now;
					frameCount += 1;
					frameTimeTotal += delta * 1000;

					configure();
					syncTrail(cursorTrail);
					syncRipples(delta);
					const trailCount = writeConfig(now, cursorTrail);

					if (onStats && now - lastStatsTime >= 250) {
						onStats({
							fps: frameCount / ((now - lastStatsTime) / 1000),
							frameTime: frameTimeTotal / frameCount,
							width: canvas.width,
							height: canvas.height,
							trailSamples: Math.max(2, trailCount),
							renderScale: Math.max(0.25, Math.min(number(cursorTrail.renderScale, 1), 2))
						});
						frameCount = 0;
						frameTimeTotal = 0;
						lastStatsTime = now;
					}

					device.queue.writeBuffer(uniformBuffer, 0, uniformData);

					const encoder = device.createCommandEncoder();
					const pass = encoder.beginRenderPass({
						colorAttachments: [
							{
								view: context.getCurrentTexture().createView(),
								clearValue: { r: 0.02, g: 0.02, b: 0.02, a: 1 },
								loadOp: 'clear',
								storeOp: 'store'
							}
						]
					});

					pass.setPipeline(pipeline);
					pass.setBindGroup(0, bindGroup);
					pass.draw(3);
					pass.end();
					device.queue.submit([encoder.finish()]);

					frame = requestAnimationFrame(render);
				}

				resizeObserver = new ResizeObserver(configure);
				resizeObserver.observe(canvas);
				canvas.addEventListener('pointermove', addTrailPoint, { passive: true });
				canvas.addEventListener('pointerdown', addRipple, { passive: true });
				configure();
				status = 'ready';
				frame = requestAnimationFrame(render);

				return () => {
					canvas?.removeEventListener('pointermove', addTrailPoint);
					canvas?.removeEventListener('pointerdown', addRipple);
				};
			} catch (error) {
				console.error('[DonoWebglShader] Could not initialize WebGPU', error);
				status = 'WebGPU unavailable';
				device?.destroy?.();
				device = undefined;
				onBackendFallback?.();
			}
		}

		let removeListeners;
		start().then((cleanup) => {
			removeListeners = cleanup;
		});

		return () => {
			stopped = true;
			cancelAnimationFrame(frame);
			resizeObserver?.disconnect();
			removeListeners?.();
			device?.destroy?.();
		};
	}

	onMount(() => {
		if (!canvas) return;
		if (backend === 'webgpu') return startWebgpuRenderer();

		const gl = canvas.getContext('webgl2', {
			alpha: true,
			antialias: true,
			depth: false,
			stencil: false,
			powerPreference: 'high-performance'
		});

		if (!gl) {
			status = 'WebGL2 unavailable';
			return;
		}

		let program;
		let frame = 0;
		let resizeObserver;
		let lastTime = performance.now();
		let lastStatsTime = lastTime;
		let frameCount = 0;
		let frameTimeTotal = 0;
		let hasPointer = false;
		const pointer = { x: 0.5, y: 0.5 };
		const trail = [];
		const ripples = [];

		try {
			program = createProgram(gl);
		} catch (error) {
			console.error('[DonoWebglShader] Could not create shader', error);
			status = 'Shader compile failed';
			return;
		}

		const positionBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW
		);

		const positionLocation = gl.getAttribLocation(program, 'a_position');
		const uniforms = {
			resolution: gl.getUniformLocation(program, 'u_resolution'),
			time: gl.getUniformLocation(program, 'u_time'),
			noiseVisible: gl.getUniformLocation(program, 'u_noiseVisible'),
			noiseType: gl.getUniformLocation(program, 'u_noiseType'),
			noiseColorA: gl.getUniformLocation(program, 'u_noiseColorA'),
			noiseColorB: gl.getUniformLocation(program, 'u_noiseColorB'),
			noiseScale: gl.getUniformLocation(program, 'u_noiseScale'),
			noiseDetail: gl.getUniformLocation(program, 'u_noiseDetail'),
			noiseContrast: gl.getUniformLocation(program, 'u_noiseContrast'),
			noiseBalance: gl.getUniformLocation(program, 'u_noiseBalance'),
			noiseSeed: gl.getUniformLocation(program, 'u_noiseSeed'),
			noiseSpeed: gl.getUniformLocation(program, 'u_noiseSpeed'),
			noiseBlendMode: gl.getUniformLocation(program, 'u_noiseBlendMode'),
			gradientVisible: gl.getUniformLocation(program, 'u_gradientVisible'),
			gradientColorA: gl.getUniformLocation(program, 'u_gradientColorA'),
			gradientColorB: gl.getUniformLocation(program, 'u_gradientColorB'),
			gradientOpacity: gl.getUniformLocation(program, 'u_gradientOpacity'),
			gradientStart: gl.getUniformLocation(program, 'u_gradientStart'),
			gradientEnd: gl.getUniformLocation(program, 'u_gradientEnd'),
			gradientAngle: gl.getUniformLocation(program, 'u_gradientAngle'),
			gradientOffsetX: gl.getUniformLocation(program, 'u_gradientOffsetX'),
			gradientBlendMode: gl.getUniformLocation(program, 'u_gradientBlendMode'),
			trailVisible: gl.getUniformLocation(program, 'u_trailVisible'),
			trailColorA: gl.getUniformLocation(program, 'u_trailColorA'),
			trailColorB: gl.getUniformLocation(program, 'u_trailColorB'),
			trailRadius: gl.getUniformLocation(program, 'u_trailRadius'),
			trailTaper: gl.getUniformLocation(program, 'u_trailTaper'),
			trailSoftness: gl.getUniformLocation(program, 'u_trailSoftness'),
			trailIntensity: gl.getUniformLocation(program, 'u_trailIntensity'),
			trailGlowEnabled: gl.getUniformLocation(program, 'u_trailGlowEnabled'),
			trailGlowRadius: gl.getUniformLocation(program, 'u_trailGlowRadius'),
			trailGlowIntensity: gl.getUniformLocation(program, 'u_trailGlowIntensity'),
			trailBlendMode: gl.getUniformLocation(program, 'u_trailBlendMode'),
			trail: gl.getUniformLocation(program, 'u_trail'),
			trailCount: gl.getUniformLocation(program, 'u_trailCount'),
			pixelVisible: gl.getUniformLocation(program, 'u_pixelVisible'),
			pixelScale: gl.getUniformLocation(program, 'u_pixelScale'),
			pixelGap: gl.getUniformLocation(program, 'u_pixelGap'),
			pixelRoundness: gl.getUniformLocation(program, 'u_pixelRoundness'),
			pixelBlendMode: gl.getUniformLocation(program, 'u_pixelBlendMode'),
			ditherVisible: gl.getUniformLocation(program, 'u_ditherVisible'),
			ditherPattern: gl.getUniformLocation(program, 'u_ditherPattern'),
			ditherPixelSize: gl.getUniformLocation(program, 'u_ditherPixelSize'),
			ditherThreshold: gl.getUniformLocation(program, 'u_ditherThreshold'),
			ditherSpread: gl.getUniformLocation(program, 'u_ditherSpread'),
			ditherColorMode: gl.getUniformLocation(program, 'u_ditherColorMode'),
			ditherColorA: gl.getUniformLocation(program, 'u_ditherColorA'),
			ditherColorB: gl.getUniformLocation(program, 'u_ditherColorB'),
			ditherBlendMode: gl.getUniformLocation(program, 'u_ditherBlendMode'),
			duotoneVisible: gl.getUniformLocation(program, 'u_duotoneVisible'),
			duotoneColorA: gl.getUniformLocation(program, 'u_duotoneColorA'),
			duotoneColorB: gl.getUniformLocation(program, 'u_duotoneColorB'),
			duotoneBlend: gl.getUniformLocation(program, 'u_duotoneBlend'),
			duotoneBlendMode: gl.getUniformLocation(program, 'u_duotoneBlendMode'),
			rippleVisible: gl.getUniformLocation(program, 'u_rippleVisible'),
			rippleColorA: gl.getUniformLocation(program, 'u_rippleColorA'),
			rippleColorB: gl.getUniformLocation(program, 'u_rippleColorB'),
			rippleIntensity: gl.getUniformLocation(program, 'u_rippleIntensity'),
			rippleMaxRadius: gl.getUniformLocation(program, 'u_rippleMaxRadius'),
			rippleCenterSize: gl.getUniformLocation(program, 'u_rippleCenterSize'),
			rippleSoftness: gl.getUniformLocation(program, 'u_rippleSoftness'),
			rippleRadialPower: gl.getUniformLocation(program, 'u_rippleRadialPower'),
			rippleFade: gl.getUniformLocation(program, 'u_rippleFade'),
			rippleBlendMode: gl.getUniformLocation(program, 'u_rippleBlendMode'),
			ripple: gl.getUniformLocation(program, 'u_ripple'),
			rippleAge: gl.getUniformLocation(program, 'u_rippleAge'),
			rippleCount: gl.getUniformLocation(program, 'u_rippleCount')
		};

		function resize() {
			const cursorTrail = componentConfig('cursorTrail');
			const renderScale = Math.max(0.25, Math.min(number(cursorTrail.renderScale, 1), 2));
			const dpr = Math.min(window.devicePixelRatio || 1, 2) * renderScale;
			const rect = canvas.getBoundingClientRect();
			const width = Math.max(1, Math.round(rect.width * dpr));
			const height = Math.max(1, Math.round(rect.height * dpr));

			if (canvas.width !== width || canvas.height !== height) {
				canvas.width = width;
				canvas.height = height;
				gl.viewport(0, 0, width, height);
			}
		}

		function addTrailPoint(event) {
			if (!interactive) return;

			const point = eventPoint(event);
			if (!point) return;

			pointer.x = point.x;
			pointer.y = point.y;
			hasPointer = true;

			if (!trail.length) {
				for (let i = 0; i < trailLimit; i++) trail.push({ x: pointer.x, y: pointer.y });
			}
		}

		function eventPoint(event) {
			const rect = canvas.getBoundingClientRect();
			if (!rect.width || !rect.height) return null;

			return {
				x: (event.clientX - rect.left) / rect.width,
				y: 1 - (event.clientY - rect.top) / rect.height
			};
		}

		function addRipple(event) {
			if (!interactive) return;
			const clickRipple = componentConfig('clickRipple');
			if (!clickRipple.visible) return;

			const point = eventPoint(event);
			if (!point) return;

			ripples.unshift({ x: point.x, y: point.y, age: 0 });
			ripples.length = Math.min(ripples.length, rippleLimit);
		}

		function syncRipples(delta) {
			const clickRipple = componentConfig('clickRipple');
			const duration = Math.max(0.1, number(clickRipple.duration, 0.85));

			for (const ripple of ripples) ripple.age += delta / duration;
			while (ripples.length && ripples[ripples.length - 1].age > 1) ripples.pop();
		}

		function syncTrail(cursorTrail) {
			if (!hasPointer) return;

			while (trail.length < trailLimit) trail.push({ x: pointer.x, y: pointer.y });

			const smoothing = Math.max(0.02, Math.min(number(cursorTrail.smoothing, 0.22), 1));
			const length = Math.max(0.1, number(cursorTrail.length, 0.55));
			const follow = Math.min(smoothing * (1 + length), 1);

			trail[0].x += (pointer.x - trail[0].x) * follow;
			trail[0].y += (pointer.y - trail[0].y) * follow;

			for (let index = 1; index < trail.length; index++) {
				const previous = trail[index - 1];
				const point = trail[index];
				const drag = Math.min(smoothing * (1.5 - Math.min(index / trailLimit, 1) * 0.65), 1);

				point.x += (previous.x - point.x) * drag;
				point.y += (previous.y - point.y) * drag;
			}
		}

		function applyUniforms() {
			const simplexNoise = componentConfig('simplexNoise');
			const linearGradient = componentConfig('linearGradient');
			const cursorTrail = componentConfig('cursorTrail');
			const pixelate = componentConfig('pixelate');
			const dither = componentConfig('dither');
			const duotone = componentConfig('duotone');
			const clickRipple = componentConfig('clickRipple');

			uniform1i(gl, uniforms.noiseVisible, simplexNoise.visible ? 1 : 0);
			uniform1i(gl, uniforms.noiseType, Math.round(number(simplexNoise.type, 1)));
			uniform3f(gl, uniforms.noiseColorA, simplexNoise.colorA, fallbackConfig.simplexNoise.colorA);
			uniform3f(gl, uniforms.noiseColorB, simplexNoise.colorB, fallbackConfig.simplexNoise.colorB);
			uniform1f(gl, uniforms.noiseScale, simplexNoise.scale, -0.9);
			uniform1f(gl, uniforms.noiseDetail, simplexNoise.detail, 5);
			uniform1f(gl, uniforms.noiseContrast, simplexNoise.contrast, 2.7);
			uniform1f(gl, uniforms.noiseBalance, simplexNoise.balance, 0);
			uniform1f(gl, uniforms.noiseSeed, simplexNoise.seed, 0);
			uniform1f(gl, uniforms.noiseSpeed, simplexNoise.speed, 0.6);
			uniform1i(gl, uniforms.noiseBlendMode, Math.round(number(simplexNoise.blendMode, 0)));

			uniform1i(gl, uniforms.gradientVisible, linearGradient.visible ? 1 : 0);
			uniform3f(
				gl,
				uniforms.gradientColorA,
				linearGradient.colorA,
				fallbackConfig.linearGradient.colorA
			);
			uniform3f(
				gl,
				uniforms.gradientColorB,
				linearGradient.colorB,
				fallbackConfig.linearGradient.colorB
			);
			uniform1f(gl, uniforms.gradientOpacity, linearGradient.opacity, 0.85);
			uniform2f(
				gl,
				uniforms.gradientStart,
				linearGradient.start,
				fallbackConfig.linearGradient.start
			);
			uniform2f(gl, uniforms.gradientEnd, linearGradient.end, fallbackConfig.linearGradient.end);
			uniform1f(gl, uniforms.gradientAngle, linearGradient.angle, 0);
			uniform1f(gl, uniforms.gradientOffsetX, linearGradient.offsetX, -0.4);
			uniform1i(gl, uniforms.gradientBlendMode, Math.round(number(linearGradient.blendMode, 1)));

			uniform1i(gl, uniforms.trailVisible, cursorTrail.visible ? 1 : 0);
			uniform3f(gl, uniforms.trailColorA, cursorTrail.colorA, fallbackConfig.cursorTrail.colorA);
			uniform3f(gl, uniforms.trailColorB, cursorTrail.colorB, fallbackConfig.cursorTrail.colorB);
			uniform1f(gl, uniforms.trailRadius, cursorTrail.radius, 0.5);
			uniform1f(gl, uniforms.trailTaper, cursorTrail.taper, 0.78);
			uniform1f(gl, uniforms.trailSoftness, cursorTrail.softness, 0.08);
			uniform1f(gl, uniforms.trailIntensity, cursorTrail.intensity, 1.25);
			uniform1f(gl, uniforms.trailGlowEnabled, cursorTrail.glowEnabled ? 1 : 0, 1);
			uniform1f(gl, uniforms.trailGlowRadius, cursorTrail.glowRadius, 0.55);
			uniform1f(gl, uniforms.trailGlowIntensity, cursorTrail.glowIntensity, 0.75);
			uniform1i(gl, uniforms.trailBlendMode, Math.round(number(cursorTrail.blendMode, 2)));

			uniform1i(gl, uniforms.pixelVisible, pixelate.visible ? 1 : 0);
			uniform1f(gl, uniforms.pixelScale, pixelate.scale, 75);
			uniform1f(gl, uniforms.pixelGap, pixelate.gap, 0);
			uniform1f(gl, uniforms.pixelRoundness, pixelate.roundness, 0);
			uniform1i(gl, uniforms.pixelBlendMode, Math.round(number(pixelate.blendMode, 0)));

			uniform1i(gl, uniforms.ditherVisible, dither.visible ? 1 : 0);
			uniform1i(gl, uniforms.ditherPattern, Math.round(number(dither.pattern, 1)));
			uniform1f(gl, uniforms.ditherPixelSize, dither.pixelSize, 1);
			uniform1f(gl, uniforms.ditherThreshold, dither.threshold, 0.5);
			uniform1f(gl, uniforms.ditherSpread, dither.spread, 1);
			uniform1i(gl, uniforms.ditherColorMode, Math.round(number(dither.colorMode, 0)));
			uniform3f(gl, uniforms.ditherColorA, dither.colorA, fallbackConfig.dither.colorA);
			uniform3f(gl, uniforms.ditherColorB, dither.colorB, fallbackConfig.dither.colorB);
			uniform1i(gl, uniforms.ditherBlendMode, Math.round(number(dither.blendMode, 0)));

			uniform1i(gl, uniforms.duotoneVisible, duotone.visible ? 1 : 0);
			uniform3f(gl, uniforms.duotoneColorA, duotone.colorA, fallbackConfig.duotone.colorA);
			uniform3f(gl, uniforms.duotoneColorB, duotone.colorB, fallbackConfig.duotone.colorB);
			uniform1f(gl, uniforms.duotoneBlend, duotone.blend, 0.5);
			uniform1i(gl, uniforms.duotoneBlendMode, Math.round(number(duotone.blendMode, 0)));

			uniform1i(gl, uniforms.rippleVisible, clickRipple.visible ? 1 : 0);
			uniform3f(gl, uniforms.rippleColorA, clickRipple.colorA, fallbackConfig.clickRipple.colorA);
			uniform3f(gl, uniforms.rippleColorB, clickRipple.colorB, fallbackConfig.clickRipple.colorB);
			uniform1f(gl, uniforms.rippleIntensity, clickRipple.intensity, 1);
			uniform1f(gl, uniforms.rippleMaxRadius, clickRipple.maxRadius, 1.65);
			uniform1f(gl, uniforms.rippleCenterSize, clickRipple.centerSize, 0.28);
			uniform1f(gl, uniforms.rippleSoftness, clickRipple.softness, 0.14);
			uniform1f(gl, uniforms.rippleRadialPower, clickRipple.radialPower, 1.25);
			uniform1f(gl, uniforms.rippleFade, clickRipple.fade, 0.65);
			uniform1i(gl, uniforms.rippleBlendMode, Math.round(number(clickRipple.blendMode, 2)));
		}

		function render(now) {
			const cursorTrail = componentConfig('cursorTrail');
			const delta = Math.min((now - lastTime) / 1000, 0.05);
			lastTime = now;
			frameCount += 1;
			frameTimeTotal += delta * 1000;

			if (onStats && now - lastStatsTime >= 250) {
				onStats({
					fps: frameCount / ((now - lastStatsTime) / 1000),
					frameTime: frameTimeTotal / frameCount,
					width: canvas.width,
					height: canvas.height,
					trailSamples: Math.max(
						2,
						Math.min(Math.round(number(cursorTrail.sampleCount, 32)), trailLimit)
					),
					renderScale: Math.max(0.25, Math.min(number(cursorTrail.renderScale, 1), 2))
				});
				frameCount = 0;
				frameTimeTotal = 0;
				lastStatsTime = now;
			}

			resize();
			syncTrail(cursorTrail);
			syncRipples(delta);

			const trailPoints = new Float32Array(trailLimit * 2);
			const trailCount = Math.max(
				0,
				Math.min(Math.round(number(cursorTrail.sampleCount, 32)), trail.length, trailLimit)
			);

			trail.slice(0, trailCount).forEach((point, index) => {
				trailPoints[index * 2] = point.x;
				trailPoints[index * 2 + 1] = point.y;
			});

			const ripplePoints = new Float32Array(rippleLimit * 2);
			const rippleAges = new Float32Array(rippleLimit);
			ripples.forEach((ripple, index) => {
				ripplePoints[index * 2] = ripple.x;
				ripplePoints[index * 2 + 1] = ripple.y;
				rippleAges[index] = ripple.age;
			});

			gl.useProgram(program);
			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.enableVertexAttribArray(positionLocation);
			gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

			uniform2f(gl, uniforms.resolution, [canvas.width, canvas.height], [1, 1]);
			uniform1f(gl, uniforms.time, now / 1000, 0);
			applyUniforms();
			if (uniforms.trail !== null) gl.uniform2fv(uniforms.trail, trailPoints);
			uniform1i(gl, uniforms.trailCount, trailCount);
			if (uniforms.ripple !== null) gl.uniform2fv(uniforms.ripple, ripplePoints);
			if (uniforms.rippleAge !== null) gl.uniform1fv(uniforms.rippleAge, rippleAges);
			uniform1i(gl, uniforms.rippleCount, ripples.length);

			gl.drawArrays(gl.TRIANGLES, 0, 6);
			frame = requestAnimationFrame(render);
		}

		resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(canvas);
		canvas.addEventListener('pointermove', addTrailPoint, { passive: true });
		canvas.addEventListener('pointerdown', addRipple, { passive: true });
		status = 'ready';
		frame = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(frame);
			resizeObserver?.disconnect();
			canvas?.removeEventListener('pointermove', addTrailPoint);
			canvas?.removeEventListener('pointerdown', addRipple);
			gl.deleteBuffer(positionBuffer);
			gl.deleteProgram(program);
		};
	});
</script>

<div
	class="dono-webgl-shader {className}"
	data-status={status}
	style:pointer-events={interactive ? 'auto' : 'none'}
>
	<canvas bind:this={canvas} aria-hidden="true"></canvas>
	{#if status !== 'ready' && status !== 'loading'}
		<div class="fallback" aria-hidden="true"></div>
	{/if}
</div>

<style>
	.dono-webgl-shader {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}

	.dono-webgl-shader canvas,
	.fallback {
		position: absolute;
		inset: 0;
		height: 100%;
		width: 100%;
	}

	.dono-webgl-shader canvas {
		display: block;
		transform: scale(1.34);
		transform-origin: center;
	}

	.fallback {
		background:
			radial-gradient(90% 140% at 84% -9%, rgba(24, 241, 227, 0.86), rgba(27, 25, 31, 0) 68%),
			linear-gradient(112deg, #6ce7a3 0%, #1b191f 68%);
		filter: saturate(1.25) contrast(1.2);
	}
</style>
