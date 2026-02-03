/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // update collection data
  unmarshal({
    "name": "analytics"
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "ocypvwxnoapmygg",
    "hidden": false,
    "id": "relation3425783630",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_relation",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // update collection data
  unmarshal({
    "name": "testA"
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "ocypvwxnoapmygg",
    "hidden": false,
    "id": "relation3425783630",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_relation",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
