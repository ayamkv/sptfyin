/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // remove field
  collection.fields.removeById("qt0voahb")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "qt0voahb",
    "max": 0,
    "min": 0,
    "name": "utm_userAgent",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
