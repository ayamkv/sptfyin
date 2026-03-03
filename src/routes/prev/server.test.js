import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { envState } = vi.hoisted(() => ({
	envState: {
		SCREENSHOTMACHINE_API_KEY: 'test-key'
	}
}));

vi.mock('$env/dynamic/private', () => ({
	env: envState
}));

import { GET } from './+server.js';

describe('GET /prev', () => {
	beforeEach(() => {
		envState.SCREENSHOTMACHINE_API_KEY = 'test-key';
		global.fetch = vi.fn();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns 503 when provider key is missing', async () => {
		envState.SCREENSHOTMACHINE_API_KEY = '';

		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(503);
		expect(body.error).toContain('SCREENSHOTMACHINE_API_KEY');
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it('forwards image response when provider succeeds', async () => {
		global.fetch.mockResolvedValueOnce(
			new Response(new Blob(['jpeg-bytes']), {
				status: 200,
				headers: {
					'Content-Type': 'image/jpeg'
				}
			})
		);

		const response = await GET();
		const body = await response.blob();

		expect(response.status).toBe(200);
		expect(response.headers.get('Content-Type')).toBe('image/jpeg');
		expect(body.size).toBeGreaterThan(0);
		expect(global.fetch).toHaveBeenCalledOnce();
		expect(global.fetch.mock.calls[0][0]).toContain('key=test-key');
	});

	it('returns 500 when provider returns non-ok status', async () => {
		global.fetch.mockResolvedValueOnce(
			new Response('upstream error', {
				status: 429
			})
		);

		const response = await GET();
		const body = await response.json();

		expect(response.status).toBe(500);
		expect(body.error).toContain('Preview provider request failed (429)');
	});
});
