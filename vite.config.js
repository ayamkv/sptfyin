import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
// import mkcert from'vite-plugin-mkcert'

export default defineConfig({
	optimizeDeps: {
		exclude: ['@mori2003/jsimgui']
	},
	resolve: {
		alias: {
			'./loader-freetype-extensions.js': fileURLToPath(
				new URL(
					'./node_modules/@mori2003/jsimgui/build/loader-extensions-freetype.js',
					import.meta.url
				)
			)
		}
	},
	server: {
		allowedHosts: ['jf'],
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd())]
		}
	},
	plugins: [sveltekit()]
});
