import adapter from '@sveltejs/adapter-auto';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  extensions: ['.svelte', '.svx', '.md'],
  preprocess: [
    mdsvex({
      extensions: ['.svx', '.md']
    })
  ],
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter(),
		csrf: {
            checkOrigin: false
		},
		alias: {
			"@/*": "./path/to/lib/*",
		  },
	}
};

export default config;
