/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "mfnzxw3f",
    "name": "utm_source",
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

  // update
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "sb6qndzg",
    "name": "utm_view",
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
  collection.schema.removeField("mfnzxw3f")

  // update
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
})
