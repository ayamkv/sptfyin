/// <reference path="../pb_data/types.d.ts" />

const guestAccessRule =
	'(@request.auth.id != "" && user.id = @request.auth.id) || (guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash)';

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('ocypvwxnoapmygg');
		const guestOwnerHashField = collection.fields.getByName('guest_owner_hash');

		guestOwnerHashField.hidden = false;

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
		const guestOwnerHashField = collection.fields.getByName('guest_owner_hash');

		guestOwnerHashField.hidden = true;

		unmarshal(
			{
				listRule:
					'@request.auth.id != "" && user = @request.auth.id || guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash',
				viewRule:
					'@request.auth.id != "" && user = @request.auth.id || guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash',
				deleteRule:
					'@request.auth.id != "" && user = @request.auth.id || guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash'
			},
			collection
		);

		return app.save(collection);
	}
);
