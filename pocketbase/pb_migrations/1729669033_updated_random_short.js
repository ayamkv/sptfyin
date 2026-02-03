/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "uc5eiwqv",
    "name": "from",
    "type": "url",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "exceptDomains": null,
      "onlyDomains": [
        "spotify.com",
        "open.spotify.com",
        "sptfy.in"
      ]
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "uc5eiwqv",
    "name": "from",
    "type": "url",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "exceptDomains": null,
      "onlyDomains": [
        "spotify.com",
        "open.spotify.com"
      ]
    }
  }))

  return dao.saveCollection(collection)
})
