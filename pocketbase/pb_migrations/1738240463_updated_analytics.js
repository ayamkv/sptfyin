/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1485150664")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": true,
    "collectionId": "ocypvwxnoapmygg",
    "hidden": false,
    "id": "relation3105530224",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_collection",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1485150664")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "ocypvwxnoapmygg",
    "hidden": false,
    "id": "relation3105530224",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_collection",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
