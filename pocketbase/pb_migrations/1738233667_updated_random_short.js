/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool3938641544",
    "name": "enable_analytics",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "bool3938641544",
    "name": "analytics",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
