/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('ocypvwxnoapmygg');

		unmarshal(
			{
				listRule:
					'(@request.auth.id != "" && user.id = @request.auth.id) || (guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash)',
				viewRule:
					'(@request.auth.id != "" && user.id = @request.auth.id) || (guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash)',
				deleteRule:
					'(@request.auth.id != "" && user.id = @request.auth.id) || (guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash)'
			},
			collection
		);

		collection.fields.addAt(
			8,
			new Field({
				autogeneratePattern: '',
				hidden: false,
				id: 'guestownerhash1',
				max: 64,
				min: 0,
				name: 'guest_owner_hash',
				pattern: '^[a-f0-9]{64}$',
				presentable: false,
				primaryKey: false,
				required: false,
				system: false,
				type: 'text'
			})
		);

		collection.indexes = [
			'CREATE UNIQUE INDEX `idx_IUTYfz6` ON `random_short` (`id_url`)',
			'CREATE INDEX `idx_random_short_guest_owner_hash` ON `random_short` (`guest_owner_hash`)'
		];

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

		collection.fields.removeById('guestownerhash1');
		collection.indexes = ['CREATE UNIQUE INDEX `idx_IUTYfz6` ON `random_short` (`id_url`)'];

		return app.save(collection);
	}
);
