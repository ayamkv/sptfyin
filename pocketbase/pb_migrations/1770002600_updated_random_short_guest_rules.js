/// <reference path="../pb_data/types.d.ts" />

const guestAccessRule =
	'(@request.auth.id != "" && user.id = @request.auth.id) || (guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash)';

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('ocypvwxnoapmygg');

		unmarshal(
			{
				listRule: guestAccessRule,
				viewRule: guestAccessRule,
				deleteRule: guestAccessRule
			},
			collection
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('ocypvwxnoapmygg');

		unmarshal(
			{
				listRule: '@request.auth.id != "" && user = @request.auth.id',
				viewRule: '@request.auth.id != "" && user = @request.auth.id',
				deleteRule: '@request.auth.id != "" && user = @request.auth.id'
			},
			collection
		);

		return app.save(collection);
	}
);
