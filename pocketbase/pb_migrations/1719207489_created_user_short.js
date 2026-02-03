/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "4we4hyprsjvbgfy",
    "created": "2024-06-24 05:38:09.091Z",
    "updated": "2024-06-24 05:38:09.091Z",
    "name": "user_short",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "dnmjqrdr",
        "name": "from",
        "type": "url",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "exceptDomains": null,
          "onlyDomains": null
        }
      },
      {
        "system": false,
        "id": "kc8khscb",
        "name": "id_url",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "wvhzkgln",
        "name": "enable",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": "",
    "createRule": "",
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("4we4hyprsjvbgfy");

  return dao.deleteCollection(collection);
})
