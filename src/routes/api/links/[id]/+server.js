import { json, error } from '@sveltejs/kit';

export async function PATCH({ locals, params, request }) {
  if (!locals.user) throw error(401);
  const id = params.id;
  const { from, id_url } = await request.json();

  let record;
  try {
    record = await locals.pb.collection('random_short').getOne(id);
  } catch {
    throw error(404, 'not found');
  }

  if (record.user !== locals.user.id) throw error(403);

  const update = {};
  if (from) update.from = from;
  if (id_url) update.id_url = id_url;

  try {
    const updated = await locals.pb.collection('random_short').update(id, update);
    return json(updated);
  } catch (e) {
    const code = e?.response?.data?.id_url?.code;
    if (code === 'validation_not_unique') throw error(409, 'slug taken');
    throw error(400, 'update failed');
  }
}


