/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_1543120290",
    "hidden": false,
    "id": "relation1792191988",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "id_urlTest",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // update field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": true,
    "collectionId": "pbc_1543120290",
    "hidden": false,
    "id": "relation1792191988",
    "maxSelect": 999,
    "minSelect": 0,
    "name": "id_urlTest",
    "presentable": true,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
