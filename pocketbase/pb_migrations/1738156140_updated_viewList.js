/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT   \n  id,\n  id_url,\n  \"from\"\nFROM random_short"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_ubY2")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_oPGu",
    "max": 80,
    "min": 4,
    "name": "id_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "_clone_QUtN",
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
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT \n  id,  \n  id_url \nFROM random_short"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_ubY2",
    "max": 80,
    "min": 4,
    "name": "id_url",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("_clone_oPGu")

  // remove field
  collection.fields.removeById("_clone_QUtN")

  return app.save(collection)
})
