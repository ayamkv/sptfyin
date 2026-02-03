/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4we4hyprsjvbgfy")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "vv0na8dn",
    "name": "view",
    "type": "number",
    "required": false,
    "presentable": false,
    "unique": false,
    "options": {
      "min": null,
      "max": null,
      "noDecimal": true
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4we4hyprsjvbgfy")

  // remove
  collection.schema.removeField("vv0na8dn")

  return dao.saveCollection(collection)
})
