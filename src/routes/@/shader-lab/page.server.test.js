import { afterEach, describe, expect, it, vi } from 'vitest';

const environment = vi.hoisted(() => ({ dev: true }));

vi.mock('$app/environment', () => ({
	get dev() {
		return environment.dev;
	}
}));

const { load } = await import('./+page.server.js');

describe('GET /@/shader-lab load', () => {
	afterEach(() => {
		environment.dev = true;
	});

	it('is not found outside dev', () => {
		environment.dev = false;

		expect(() => load()).toThrow(expect.objectContaining({ status: 404 }));
	});

	it('loads in dev', () => {
		expect(load()).toBeUndefined();
	});
});
