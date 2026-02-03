/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4we4hyprsjvbgfy")

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "dnmjqrdr",
    "name": "from",
    "type": "url",
    "required": false,
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

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "kc8khscb",
    "name": "id_url",
    "type": "text",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "min": 4,
      "max": 80,
      "pattern": ""
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4we4hyprsjvbgfy")

  // update
  collection.schema.addField(new SchemaField({
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
  }))

  // update
  collection.schema.addField(new SchemaField({
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
  }))

  return dao.saveCollection(collection)
})
