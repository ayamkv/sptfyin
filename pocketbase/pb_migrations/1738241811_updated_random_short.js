/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // remove field
  collection.fields.removeById("oanazfod")

  // add field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "select3252000302",
    "maxSelect": 1,
    "name": "subdomain",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "artist",
      "playlist",
      "play",
      "podcast",
      "album",
      "track"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // add field
  collection.fields.addAt(5, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "oanazfod",
    "max": 0,
    "min": 0,
    "name": "subdomain",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("select3252000302")

  return app.save(collection)
})
