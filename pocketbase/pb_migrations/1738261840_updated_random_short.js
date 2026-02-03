/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update field
  collection.fields.addAt(5, new Field({
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
      "track",
      "sptfy.in"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update field
  collection.fields.addAt(5, new Field({
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
})
