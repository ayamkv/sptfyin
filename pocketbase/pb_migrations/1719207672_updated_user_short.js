/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4we4hyprsjvbgfy")

  collection.createRule = "user = @request.auth.id"
  collection.updateRule = "user = @request.auth.id"
  collection.deleteRule = "user = @request.auth.id"

  // add
  collection.schema.addField(new SchemaField({
    "system": false,
    "id": "b21wtohm",
    "name": "user",
    "type": "relation",
    "required": true,
    "presentable": false,
    "unique": false,
    "options": {
      "collectionId": "_pb_users_auth_",
      "cascadeDelete": false,
      "minSelect": null,
      "maxSelect": 1,
      "displayFields": null
    }
  }))

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("4we4hyprsjvbgfy")

  collection.createRule = ""
  collection.updateRule = null
  collection.deleteRule = null

  // remove
  collection.schema.removeField("b21wtohm")

  return dao.saveCollection(collection)
})
