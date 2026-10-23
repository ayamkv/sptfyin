import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server.js';

function createRequest(body) {
	return {
		json: async () => body
	};
}

function createLocals(sendImpl) {
	return { pb: { send: vi.fn(sendImpl) } };
}

function createPocketBaseError(status) {
	const error = new Error(`status ${status}`);
	error.status = status;
	return error;
}

describe('POST /api/auth/validate', () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('rejects unsupported fields', async () => {
		const response = await POST({
			locals: { pb: {} },
			request: createRequest({ field: 'email', value: 'a@example.com' })
		});

		expect(response.status).toBe(400);
		await expect(response.json()).resolves.toMatchObject({ valid: false });
	});

	it('validates username format before checking PocketBase', async () => {
		const locals = createLocals(async () => ({ available: true }));
		const response = await POST({
			locals,
			request: createRequest({ field: 'username', value: 'x' })
		});

		expect(response.status).toBe(200);
		expect(locals.pb.send).not.toHaveBeenCalled();
		await expect(response.json()).resolves.toMatchObject({ valid: false, available: false });
	});

	it('returns available when the availability route says so', async () => {
		const locals = createLocals(async () => ({ available: true }));
		const response = await POST({
			locals,
			request: createRequest({ field: 'username', value: 'NewUser' })
		});

		expect(response.status).toBe(200);
		expect(locals.pb.send).toHaveBeenCalledWith('/api/sptfyin/username-available/newuser', {
			method: 'GET'
		});
		await expect(response.json()).resolves.toMatchObject({
			valid: true,
			available: true,
			value: 'newuser'
		});
	});

	it('returns unavailable when a username exists', async () => {
		const response = await POST({
			locals: createLocals(async () => ({ available: false })),
			request: createRequest({ field: 'username', value: 'taken' })
		});

		expect(response.status).toBe(200);
		await expect(response.json()).resolves.toMatchObject({ valid: false, available: false });
	});

	it('never reports available when the availability route is missing', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = await POST({
			locals: createLocals(async () => {
				throw createPocketBaseError(404);
			}),
			request: createRequest({ field: 'username', value: 'newuser' })
		});

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({ valid: false, available: false });
	});

	it('returns 503 when PocketBase fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const response = await POST({
			locals: createLocals(async () => {
				throw createPocketBaseError(500);
			}),
			request: createRequest({ field: 'username', value: 'newuser' })
		});

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({
			available: false,
			message: 'Could not check username.'
		});
	});

	it('returns 503 when the availability answer is malformed', async () => {
		const response = await POST({
			locals: createLocals(async () => ({})),
			request: createRequest({ field: 'username', value: 'newuser' })
		});

		expect(response.status).toBe(503);
		await expect(response.json()).resolves.toMatchObject({ available: false });
	});
});
