/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update field
  collection.fields.addAt(1, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "uc5eiwqv",
    "name": "from",
    "onlyDomains": [
      "spotify.com",
      "open.spotify.com"
    ],
    "presentable": false,
    "required": true,
    "system": false,
    "type": "url"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update field
  collection.fields.addAt(1, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "uc5eiwqv",
    "name": "from",
    "onlyDomains": [
      "spotify.com",
      "open.spotify.com",
      "spotify.link"
    ],
    "presentable": false,
    "required": true,
    "system": false,
    "type": "url"
  }))

  return app.save(collection)
})
