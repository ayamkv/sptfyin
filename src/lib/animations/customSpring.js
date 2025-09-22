export const scaleWithEase = (node, { delay = 0, duration = 600 }) => ({
	delay,
	duration,
	css: (t) => {
		// Define the easing stops (input, output pairs)
		const stops = [
			[0.0, 0], // 0%
			[0.016, 0.027], // 1.6%
			[0.035, 0.113], // 3.5%
			[0.109, 0.617], // 10.9%
			[0.146, 0.819], // 14.6%
			[0.185, 0.958], // 18.5%
			[0.206, 1.004], // 20.6%
			[0.229, 1.035], // 22.9%
			[0.256, 1.052], // 25.6%
			[0.288, 1.055], // 28.8%
			[0.422, 1.01], // 42.2%
			[0.512, 0.998], // 51.2%
			[1.0, 1] // 100%
		];

		// Find the current segment
		let i = 0;
		while (i < stops.length - 1 && t > stops[i + 1][0]) {
			i++;
		}

		// Get neighboring stops
		const [x0, y0] = stops[i];
		const [x1, y1] = stops[i + 1] || stops[i];

		// Calculate interpolation within the segment
		const progress = (t - x0) / (x1 - x0);
		const eased = y0 + (y1 - y0) * progress;

		// Return the scaled transform
		return `transform: scale(${eased})`;
	}
});

// Export WithEase as an alias for scaleWithEase
export const WithEase = scaleWithEase;
