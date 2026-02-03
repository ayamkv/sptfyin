/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "json1111784733",
    "maxSize": 0,
    "name": "rawData",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_301011765")

  // remove field
  collection.fields.removeById("json1111784733")

  return app.save(collection)
})
