/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // add field
  collection.fields.addAt(3, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_301011765",
    "hidden": false,
    "id": "relation3938641544",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "analytics",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // remove field
  collection.fields.removeById("relation3938641544")

  return app.save(collection)
})
