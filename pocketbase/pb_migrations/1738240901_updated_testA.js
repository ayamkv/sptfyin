/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // remove field
  collection.fields.removeById("relation1792191988")

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
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_1543120290",
    "hidden": false,
    "id": "relation1792191988",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_relation",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(4, new Field({
    "cascadeDelete": false,
    "collectionId": "ocypvwxnoapmygg",
    "hidden": false,
    "id": "relation3425783630",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_relationN",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
