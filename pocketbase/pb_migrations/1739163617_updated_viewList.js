/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT   \n  id,\n  subdomain,\n  id_url,\n  \"from\",\n  utm_view,\n  created\n  \nFROM random_short"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_QFKA")

  // remove field
  collection.fields.removeById("_clone_VMDd")

  // remove field
  collection.fields.removeById("_clone_EgeX")

  // remove field
  collection.fields.removeById("_clone_vdyQ")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "_clone_Iznw",
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

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_Arlr",
    "max": 80,
    "min": 4,
    "name": "id_url",
    "pattern": "",
    "presentable": true,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "_clone_Mf9s",
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

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "_clone_4Hee",
    "max": null,
    "min": 0,
    "name": "utm_view",
    "onlyInt": true,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "_clone_vTlL",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT   \n  id,\n  id_url,\n  \"from\",\n  utm_view,\n  created\n  \nFROM random_short"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_QFKA",
    "max": 80,
    "min": 4,
    "name": "id_url",
    "pattern": "",
    "presentable": true,
    "primaryKey": false,
    "required": true,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "exceptDomains": null,
    "hidden": false,
    "id": "_clone_VMDd",
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

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "_clone_EgeX",
    "max": null,
    "min": 0,
    "name": "utm_view",
    "onlyInt": true,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "_clone_vdyQ",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // remove field
  collection.fields.removeById("_clone_Iznw")

  // remove field
  collection.fields.removeById("_clone_Arlr")

  // remove field
  collection.fields.removeById("_clone_Mf9s")

  // remove field
  collection.fields.removeById("_clone_4Hee")

  // remove field
  collection.fields.removeById("_clone_vTlL")

  return app.save(collection)
})
