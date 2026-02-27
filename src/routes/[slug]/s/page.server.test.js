import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server.js';

function createContext({ viewListGetList, analyticsGetList } = {}) {
	const viewListGetListMock = viewListGetList || vi.fn(async () => ({ items: [] }));
	const analyticsGetListMock = analyticsGetList || vi.fn(async () => ({ items: [] }));
	const filterMock = vi.fn(
		(expression, params) => `FILTER:${expression}:${JSON.stringify(params ?? {})}`
	);

	const locals = {
		pb: {
			filter: filterMock,
			collection: vi.fn((name) => {
				if (name === 'viewList') {
					return {
						getList: viewListGetListMock
					};
				}

				if (name === 'analytics') {
					return {
						getList: analyticsGetListMock
					};
				}

				throw new Error(`Unexpected collection ${name}`);
			})
		}
	};

	return {
		locals,
		filter: filterMock,
		viewListGetList: viewListGetListMock,
		analyticsGetList: analyticsGetListMock
	};
}

describe('GET /[slug]/s load', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('loads slug stats and analytics from locals.pb', async () => {
		const context = createContext({
			viewListGetList: vi.fn(async () => ({
				items: [{ id: 'url_1', from: 'https://open.spotify.com/track/abc', utm_view: 99 }]
			})),
			analyticsGetList: vi.fn(async () => ({
				items: [{ id: 'a1' }, { id: 'a2' }]
			}))
		});

		const result = await load({
			params: { slug: 'stats-slug' },
			locals: context.locals,
			url: new URL('http://127.0.0.1/stats-slug/s')
		});

		expect(context.viewListGetList).toHaveBeenCalledWith(1, 1, {
			filter: 'FILTER:id_url = {:slug}:{"slug":"stats-slug"}'
		});

		expect(context.analyticsGetList).toHaveBeenCalledWith(1, 30, {
			filter: 'FILTER:author = {:recordId}:{"recordId":"url_1"}',
			sort: '-created'
		});

		expect(context.filter).toHaveBeenNthCalledWith(1, 'id_url = {:slug}', {
			slug: 'stats-slug'
		});
		expect(context.filter).toHaveBeenNthCalledWith(2, 'author = {:recordId}', {
			recordId: 'url_1'
		});

		expect(result).toEqual({
			utmView: 99,
			from: 'https://open.spotify.com/track/abc',
			analytics: [{ id: 'a1' }, { id: 'a2' }]
		});
	});

	it('returns 404 when the slug does not exist', async () => {
		const context = createContext({
			viewListGetList: vi.fn(async () => ({ items: [] }))
		});

		await expect(
			load({
				params: { slug: 'missing' },
				locals: context.locals,
				url: new URL('http://127.0.0.1/missing/s')
			})
		).rejects.toMatchObject({
			status: 404
		});
	});

	it('returns 500 on unexpected PocketBase errors', async () => {
		const context = createContext({
			viewListGetList: vi.fn(async () => ({
				items: [{ id: 'url_2', from: 'https://open.spotify.com/album/xyz', utm_view: 2 }]
			})),
			analyticsGetList: vi.fn(async () => {
				const err = new Error('db failed');
				err.status = 503;
				throw err;
			})
		});

		await expect(
			load({
				params: { slug: 'failure' },
				locals: context.locals,
				url: new URL('http://127.0.0.1/failure/s')
			})
		).rejects.toMatchObject({
			status: 500
		});
	});
});
