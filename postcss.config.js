import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/**
 * Strip @layer wrappers from node_modules CSS (e.g. layerchart v2)
 * to avoid Tailwind v3 "@layer components without @tailwind components" error.
 */
function stripLayerForNodeModules() {
	return {
		postcssPlugin: 'strip-layer-node-modules',
		Once(root, { result }) {
			const file = result.opts?.from || '';
			if (!file.includes('node_modules')) return;
			root.walkAtRules('layer', (atRule) => {
				atRule.replaceWith(atRule.nodes);
			});
		}
	};
}
stripLayerForNodeModules.postcss = true;

export default {
	plugins: [stripLayerForNodeModules, tailwindcss, autoprefixer]
};
