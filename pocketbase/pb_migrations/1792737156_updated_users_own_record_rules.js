/// <reference path="../pb_data/types.d.ts" />

// Users can only list/view their own record. Username availability is answered
// by the /api/sptfyin/username-available route instead of a public list query.
const ownRecordRule = 'id = @request.auth.id';

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('_pb_users_auth_');

		unmarshal(
			{
				listRule: ownRecordRule,
				viewRule: ownRecordRule
			},
			collection
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('_pb_users_auth_');

		unmarshal(
			{
				listRule: '',
				viewRule: ''
			},
			collection
		);

		return app.save(collection);
	}
);
