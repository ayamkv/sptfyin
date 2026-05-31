/// <reference path="../pb_data/types.d.ts" />

const guestAccessRule =
	'(@request.auth.id != "" && user.id = @request.auth.id) || (user = "" && guest_owner_hash != "" && guest_owner_hash = @request.headers.x_sptfyin_guest_hash)';

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('ocypvwxnoapmygg');

		collection.fields.addAt(
			9,
			new BoolField({
				hidden: false,
				id: 'guestactive001',
				name: 'guest_active',
				presentable: false,
				required: false,
				system: false
			})
		);

		unmarshal(
			{
				listRule: guestAccessRule,
				viewRule: guestAccessRule,
				deleteRule: guestAccessRule
			},
			collection
		);

		collection.indexes = collection.indexes.filter(
			(index) => !index.includes('idx_random_short_guest_active')
		);
		collection.indexes.push(
			'CREATE INDEX `idx_random_short_guest_active` ON `random_short` (`guest_owner_hash`, `guest_active`, `created`)'
		);

		app.save(collection);

		app.db()
			.newQuery(
				'UPDATE `random_short` SET `guest_active` = 0 WHERE `guest_owner_hash` != ""'
			)
			.execute();

		app.db()
			.newQuery(
				'UPDATE `random_short` SET `guest_active` = 1 WHERE `id` IN (SELECT `id` FROM (SELECT `id`, ROW_NUMBER() OVER (PARTITION BY `guest_owner_hash` ORDER BY `created` DESC, `id` DESC) AS `guest_rank` FROM `random_short` WHERE `guest_owner_hash` != "" AND COALESCE(`user`, "") = "") WHERE `guest_rank` <= 3)'
			)
			.execute();
	},
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

		collection.fields.removeById('guestactive001');
		collection.indexes = collection.indexes.filter(
			(index) => !index.includes('idx_random_short_guest_active')
		);

		return app.save(collection);
	}
);
