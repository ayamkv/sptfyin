/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1485150664")

  // remove field
  collection.fields.removeById("relation1792191988")

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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1485150664")

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "ocypvwxnoapmygg",
    "hidden": false,
    "id": "relation1792191988",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_url",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "ocypvwxnoapmygg",
    "hidden": false,
    "id": "relation3105530224",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "from",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
