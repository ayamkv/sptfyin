import { json, error } from '@sveltejs/kit';

const MAX_BULK_DELETE = 5; // Free tier limit

export async function DELETE({ locals, request }) {
	if (!locals.user) throw error(401, 'Authentication required');

	const body = await request.json();
	const { ids } = body;

	if (!ids || !Array.isArray(ids) || ids.length === 0) {
		throw error(400, 'ids array is required');
	}

	if (ids.length > MAX_BULK_DELETE) {
		throw error(400, `Cannot delete more than ${MAX_BULK_DELETE} links at once (free tier limit)`);
	}

	const results = {
		deleted: [],
		failed: []
	};

	for (const id of ids) {
		try {
			// Verify ownership
			const record = await locals.pb.collection('random_short').getOne(id);

			if (record.user !== locals.user.id) {
				results.failed.push({ id, reason: 'Not authorized' });
				continue;
			}

			// Delete the record
			await locals.pb.collection('random_short').delete(id);
			results.deleted.push(id);
		} catch (e) {
			console.error(`[API Bulk Delete] Failed to delete ${id}:`, e);
			results.failed.push({ id, reason: e?.message || 'Delete failed' });
		}
	}

	return json(results);
}
