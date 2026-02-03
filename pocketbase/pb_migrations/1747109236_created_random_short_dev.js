/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "",
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": true,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "exceptDomains": null,
        "hidden": false,
        "id": "url3105530224",
        "name": "from",
        "onlyDomains": [
          "spotify.com",
          "open.spotify.com"
        ],
        "presentable": false,
        "required": true,
        "system": false,
        "type": "url"
      },
      {
        "autogeneratePattern": "",
        "hidden": false,
        "id": "text1792191988",
        "max": 80,
        "min": 4,
        "name": "id_url",
        "pattern": "",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "bool4087400498",
        "name": "enable",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "number1210418345",
        "max": null,
        "min": 0,
        "name": "utm_view",
        "onlyInt": true,
        "presentable": true,
        "required": false,
        "system": false,
        "type": "number"
      },
      {
        "hidden": true,
        "id": "bool932999944",
        "name": "enable_analytics",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "select3252000302",
        "maxSelect": 1,
        "name": "subdomain",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "artist",
          "playlist",
          "play",
          "podcast",
          "album",
          "track",
          "sptfy.in",
          "profile"
        ]
      },
      {
        "cascadeDelete": false,
        "collectionId": "_pb_users_auth_",
        "hidden": false,
        "id": "relation2375276105",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": true,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_3514353527",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_USR7SS55oZ` ON `random_short_dev` (`id_url`)"
    ],
    "listRule": null,
    "name": "random_short_dev",
    "system": false,
    "type": "base",
    "updateRule": "",
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3514353527");

  return app.delete(collection);
})
