/// <reference path="../pb_data/types.d.ts" />

// Username availability for the register form. The users collection is not
// publicly listable, so this answers only "is this username taken?".
// Format rules mirror validateUsernameFormat in src/lib/auth-validation.js.

routerAdd('GET', '/api/sptfyin/username-available/{username}', (e) => {
	const username = String(e.request.pathValue('username') || '')
		.trim()
		.toLowerCase();

	if (username.length < 3 || username.length > 40 || !/^[a-z0-9_][a-z0-9_.-]*$/.test(username)) {
		return e.json(400, { message: 'Invalid username format.' });
	}

	// COLLATE NOCASE matches the unique index on users.username.
	const matches = arrayOf(new DynamicModel({ id: '' }));
	$app
		.db()
		.newQuery('SELECT id FROM users WHERE username = {:username} COLLATE NOCASE LIMIT 1')
		.bind({ username })
		.all(matches);

	return e.json(200, { available: matches.length === 0 });
});
