/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "sb6qndzg",
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
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  // remove
  collection.schema.removeField("sb6qndzg")

  return dao.saveCollection(collection)
})
