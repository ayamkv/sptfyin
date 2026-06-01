import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, searchForWorkspaceRoot } from 'vite';
// import mkcert from'vite-plugin-mkcert'

export default defineConfig({
	server: {
		allowedHosts: ['jf'],
		fs: {
			allow: [searchForWorkspaceRoot(process.cwd())]
		}
	},
	plugins: [sveltekit()]
});
