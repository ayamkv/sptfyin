/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT   \n  id,\n  id_url,\n  \"from\",\n  utm_view\nFROM random_short"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_gQBI")

  // remove field
  collection.fields.removeById("_clone_A8Zy")

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_ujkM",
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
    "id": "_clone_EIf9",
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
    "id": "_clone_oUf2",
    "max": null,
    "min": 0,
    "name": "utm_view",
    "onlyInt": true,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT   \n  id,\n  id_url,\n  \"from\"\nFROM random_short"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_gQBI",
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
    "id": "_clone_A8Zy",
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

  // remove field
  collection.fields.removeById("_clone_ujkM")

  // remove field
  collection.fields.removeById("_clone_EIf9")

  // remove field
  collection.fields.removeById("_clone_oUf2")

  return app.save(collection)
})
