/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update
  collection.schema.addField(new SchemaField({
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
      "pattern": "^\\[a-zA-Z0-9]$"
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "pn0snlxg",
    "name": "id_url",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 4,
      "max": 80,
      "pattern": "^[a-zA-Z0-9]$"
    }
  }))

  return dao.saveCollection(collection)
})
