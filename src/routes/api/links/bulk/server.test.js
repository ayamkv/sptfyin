import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DELETE } from './+server.js';

function createRequest(body, shouldThrow = false) {
	return {
		json: async () => {
			if (shouldThrow) {
				throw new Error('invalid json');
			}

			return body;
		}
	};
}

function createLocals({ userId = 'user-1', records = {} } = {}) {
	const store = new Map(Object.entries(records));

	return {
		user: userId ? { id: userId } : null,
		pb: {
			collection: vi.fn(() => ({
				getOne: vi.fn(async (id) => {
					if (!store.has(id)) {
						const err = new Error('Not found');
						err.status = 404;
						throw err;
					}

					return store.get(id);
				}),
				delete: vi.fn(async (id) => {
					if (id === 'delete-fails') {
						throw new Error('delete failed');
					}

					store.delete(id);
				})
			}))
		}
	};
}

describe('DELETE /api/links/bulk', () => {
	let consoleErrorSpy;

	beforeEach(() => {
		consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
	});

	afterEach(() => {
		consoleErrorSpy.mockRestore();
	});

	it('rejects unauthenticated requests', async () => {
		await expect(
			DELETE({ locals: createLocals({ userId: null }), request: createRequest({ ids: [] }) })
		).rejects.toMatchObject({ status: 401 });
	});

	it('rejects invalid JSON payloads', async () => {
		await expect(
			DELETE({ locals: createLocals(), request: createRequest(null, true) })
		).rejects.toMatchObject({
			status: 400,
			body: { message: 'Invalid JSON body' }
		});
	});

	it('rejects missing or empty ids arrays', async () => {
		await expect(
			DELETE({ locals: createLocals(), request: createRequest({}) })
		).rejects.toMatchObject({
			status: 400
		});

		await expect(
			DELETE({ locals: createLocals(), request: createRequest({ ids: [] }) })
		).rejects.toMatchObject({
			status: 400
		});
	});

	it('rejects requests above free-tier delete limit', async () => {
		await expect(
			DELETE({
				locals: createLocals(),
				request: createRequest({ ids: ['1', '2', '3', '4', '5', '6'] })
			})
		).rejects.toMatchObject({ status: 400 });
	});

	it('deduplicates and deletes only owned links', async () => {
		const locals = createLocals({
			records: {
				a: { id: 'a', user: 'user-1' },
				b: { id: 'b', user: 'user-2' }
			}
		});

		const response = await DELETE({
			locals,
			request: createRequest({ ids: ['a', 'a', 'b', 'missing'] })
		});

		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(payload.deleted).toEqual(['a']);
		expect(payload.failed).toEqual([
			{ id: 'b', reason: 'Not authorized' },
			{ id: 'missing', reason: 'Not found' }
		]);
	});

	it('reports partial failures when delete throws', async () => {
		const locals = createLocals({
			records: {
				'delete-fails': { id: 'delete-fails', user: 'user-1' },
				ok: { id: 'ok', user: 'user-1' }
			}
		});

		const response = await DELETE({
			locals,
			request: createRequest({ ids: ['delete-fails', 'ok'] })
		});

		expect(response.status).toBe(200);

		const payload = await response.json();
		expect(payload.deleted).toEqual(['ok']);
		expect(payload.failed).toEqual([{ id: 'delete-fails', reason: 'delete failed' }]);
	});
});
