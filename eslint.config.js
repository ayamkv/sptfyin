import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	js.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		ignores: ['build/', '.svelte-kit/', 'dist/', 'pocketbase/', '.beads/', '.wrangler/']
	},
	{
		// Relax rules for the existing codebase - these can be tightened incrementally
		rules: {
			// Allow unused vars if prefixed with underscore, or for common patterns
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			// Empty blocks are sometimes intentional (try/catch with no handling needed)
			'no-empty': 'warn',
			// Allow escape characters that are technically unnecessary
			'no-useless-escape': 'warn'
		}
	},
	{
		// Svelte-specific rule relaxations
		files: ['**/*.svelte'],
		rules: {
			// {@html} is used intentionally in this codebase for trusted content
			'svelte/no-at-html-tags': 'warn',
			// Each blocks don't always need keys (Svelte 5 handles this better)
			'svelte/require-each-key': 'warn',
			// SvelteSet/SvelteMap warnings - existing code uses native Set/Map
			'svelte/prefer-svelte-reactivity': 'warn',
			// Unused vars in Svelte components (event handlers, etc.)
			'no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_|^event$|^e$|^err$|^error$|^data$',
					varsIgnorePattern: '^_|^\\$\\$'
				}
			]
		}
	}
];
