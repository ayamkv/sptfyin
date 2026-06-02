export const NOISE_TYPES = ['value', 'fbm', 'ridged', 'turbulence'];
export const RENDER_BACKENDS = ['webgl2', 'webgpu'];
export const DITHER_PATTERNS = [
	'bayer2',
	'bayer4',
	'bayer8',
	'clusteredDot',
	'blueNoise',
	'whiteNoise'
];
export const DITHER_COLOR_MODES = ['source', 'custom'];
export const BLEND_MODES = [
	'normal',
	'add',
	'screen',
	'multiply',
	'overlay',
	'softLight',
	'linearDodge',
	'difference',
	'invert'
];

export function createDonoShaderConfig() {
	return {
		simplexNoise: {
			visible: true,
			type: 1,
			colorA: [0.439, 0.439, 0.439],
			colorB: [0, 0, 0],
			scale: -0.9,
			detail: 4,
			contrast: 4.29,
			balance: -0.07,
			seed: 3,
			speed: 3.43,
			blendMode: 0
		},
		linearGradient: {
			visible: true,
			colorA: [0.4, 0.82, 0.59],
			colorB: [0, 0, 0],
			opacity: 1.45,
			start: [0.02, 1],
			end: [0.8, 0.67],
			angle: 37,
			offsetX: -0.19,
			blendMode: 1
		},
		cursorTrail: {
			visible: true,
			colorA: [0.031, 1, 0.498],
			colorB: [0.2, 0.71, 0.58],
			radius: 0.2,
			length: 2,
			intensity: 1.25,
			sampleCount: 20,
			smoothing: 0.22,
			taper: 0.61,
			softness: 0.08,
			glowEnabled: true,
			glowRadius: 0.55,
			glowIntensity: 0.75,
			renderScale: 1,
			blendMode: 2
		},
		pixelate: {
			visible: true,
			scale: 75,
			gap: 0,
			roundness: 0,
			blendMode: 0
		},
		clickRipple: {
			visible: true,
			colorA: [0.031, 1, 0.498],
			colorB: [0.424, 0.906, 0.639],
			intensity: 1.5,
			duration: 1.01,
			maxRadius: 2.46,
			centerSize: 0.28,
			softness: 0.3,
			radialPower: 1.25,
			fade: 1,
			blendMode: 8
		},
		dither: {
			visible: true,
			pattern: 1,
			pixelSize: 1,
			threshold: 0.5,
			spread: 1,
			colorMode: 0,
			colorA: [0.106, 0.098, 0.122],
			colorB: [0.424, 0.906, 0.639],
			blendMode: 0
		},
		duotone: {
			visible: true,
			colorA: [0.106, 0.098, 0.122],
			colorB: [0.424, 0.906, 0.639],
			blend: 0.5,
			blendMode: 0
		}
	};
}

export function cloneDonoShaderConfig(config = createDonoShaderConfig()) {
	return structuredClone(config);
}
