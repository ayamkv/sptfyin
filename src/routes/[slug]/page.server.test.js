import { beforeEach, describe, expect, it, vi } from 'vitest';
import { load } from './+page.server.js';

function createRouteContext({ viewListGetList, analyticsCreate, randomShortUpdate } = {}) {
	const viewListGetListMock = viewListGetList || vi.fn(async () => ({ items: [] }));
	const analyticsCreateMock = analyticsCreate || vi.fn(async () => ({}));
	const randomShortUpdateMock = randomShortUpdate || vi.fn(async () => ({}));

	const locals = {
		pb: {
			collection: vi.fn((name) => {
				if (name === 'viewList') {
					return {
						getList: viewListGetListMock
					};
				}

				if (name === 'analytics') {
					return {
						create: analyticsCreateMock
					};
				}

				if (name === 'random_short') {
					return {
						update: randomShortUpdateMock
					};
				}

				throw new Error(`Unexpected collection ${name}`);
			})
		}
	};

	return {
		locals,
		viewListGetList: viewListGetListMock,
		analyticsCreate: analyticsCreateMock,
		randomShortUpdate: randomShortUpdateMock
	};
}

function createRequest(userAgent = 'Mozilla/5.0') {
	return new Request('https://sptfy.in/test-slug', {
		headers: {
			'user-agent': userAgent,
			'CF-IPCountry': 'ID',
			'x-forwarded-for': '127.0.0.1'
		}
	});
}

describe('GET /[slug] load', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('uses locals.pb and redirects for a valid non-bot request', async () => {
		const context = createRouteContext({
			viewListGetList: vi.fn(async () => ({
				items: [
					{
						id: 'rec_1',
						from: 'https://open.spotify.com/track/123',
						utm_view: 10
					}
				]
			}))
		});

		await expect(
			load({
				params: { slug: 'hello' },
				request: createRequest('Mozilla/5.0'),
				locals: context.locals
			})
		).rejects.toMatchObject({
			status: 301,
			location: 'https://open.spotify.com/track/123'
		});

		expect(context.viewListGetList).toHaveBeenCalledWith(1, 1, {
			filter: "id_url='hello'"
		});

		expect(context.analyticsCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				author: 'rec_1',
				utm_country: 'ID',
				utm_userAgent: 'Mozilla/5.0',
				url_id: 'rec_1'
			})
		);

		expect(context.randomShortUpdate).toHaveBeenCalledWith('rec_1', {
			'utm_view+': 1
		});
	});

	it('skips analytics and count updates for bots', async () => {
		const context = createRouteContext({
			viewListGetList: vi.fn(async () => ({
				items: [
					{
						id: 'rec_2',
						from: 'https://open.spotify.com/album/abc',
						utm_view: 22
					}
				]
			}))
		});

		await expect(
			load({
				params: { slug: 'bot-path' },
				request: createRequest('Googlebot/2.1'),
				locals: context.locals
			})
		).rejects.toMatchObject({
			status: 301,
			location: 'https://open.spotify.com/album/abc'
		});

		expect(context.analyticsCreate).not.toHaveBeenCalled();
		expect(context.randomShortUpdate).not.toHaveBeenCalled();
	});

	it('returns 404 when slug is missing', async () => {
		const context = createRouteContext({
			viewListGetList: vi.fn(async () => ({ items: [] }))
		});

		await expect(
			load({
				params: { slug: 'missing' },
				request: createRequest('Mozilla/5.0'),
				locals: context.locals
			})
		).rejects.toMatchObject({
			status: 404
		});
	});

	it('does not leak redirect target across requests', async () => {
		const context = createRouteContext({
			viewListGetList: vi
				.fn()
				.mockResolvedValueOnce({
					items: [{ id: 'rec_a', from: 'https://open.spotify.com/track/aaa', utm_view: 1 }]
				})
				.mockResolvedValueOnce({
					items: [{ id: 'rec_b', from: 'https://open.spotify.com/track/bbb', utm_view: 2 }]
				})
		});

		await expect(
			load({
				params: { slug: 'first' },
				request: createRequest('Mozilla/5.0'),
				locals: context.locals
			})
		).rejects.toMatchObject({
			status: 301,
			location: 'https://open.spotify.com/track/aaa'
		});

		await expect(
			load({
				params: { slug: 'second' },
				request: createRequest('Mozilla/5.0'),
				locals: context.locals
			})
		).rejects.toMatchObject({
			status: 301,
			location: 'https://open.spotify.com/track/bbb'
		});
	});
});
