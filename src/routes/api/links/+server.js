import { json, error } from '@sveltejs/kit';
import { generateRandomURL } from '$lib/pocketbase';
const pocketBaseURL = import.meta.env.VITE_POCKETBASE_URL;

export async function GET({ locals, url, fetch }) {
  if (!locals.user) throw error(401);
  const page = Number(url.searchParams.get('page') || 1);
  const perPage = Math.min(Number(url.searchParams.get('perPage') || 20), 50);

  // Read via viewList to avoid superuser requirement
  const qs = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort: '-created',
    filter: `user='${locals.user.id}'`
  });
  const resp = await fetch(`${pocketBaseURL}/api/collections/viewList/records?${qs.toString()}`);
  if (!resp.ok) throw error(resp.status, 'failed to fetch');
  const data = await resp.json();
  return json({
    items: data.items || [],
    page: data.page,
    perPage: data.perPage,
    totalPages: data.totalPages,
    totalItems: data.totalItems
  });
}

export async function POST({ locals, request }) {
  const body = await request.json();
  const { from, slug, subdomain, turnstileToken } = body || {};
  if (!from) throw error(400, 'from is required');

  const id_url = slug || (await generateRandomURL());

  const data = {
    from,
    id_url,
    subdomain: subdomain || 'sptfy.in',
    enable: true
  };

  if (locals.user) data.user = locals.user.id;

  try {
    const record = await locals.pb
      .collection('random_short')
      .create(data, {
        headers: turnstileToken ? { 'X-Turnstile-Token': turnstileToken } : undefined
      });
    return json(record, { status: 201 });
  } catch (e) {
    const code = e?.response?.data?.id_url?.code;
    if (code === 'validation_not_unique') throw error(409, 'slug taken');
    throw error(400, 'create failed');
  }
}


