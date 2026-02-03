/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "ocypvwxnoapmygg",
    "created": "2024-06-24 05:37:46.686Z",
    "updated": "2024-06-24 05:37:46.686Z",
    "name": "random_short",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "uc5eiwqv",
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
        "id": "pn0snlxg",
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
        "id": "rdod4hzy",
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
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg");

  return dao.deleteCollection(collection);
})
