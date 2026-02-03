/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "listRule": "",
    "viewRule": ""
  }, collection)

  // remove field
  collection.fields.removeById("_clone_bRUj")

  // remove field
  collection.fields.removeById("_clone_46FL")

  // remove field
  collection.fields.removeById("_clone_5SST")

  // remove field
  collection.fields.removeById("_clone_qpRP")

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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_bRUj",
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
    "id": "_clone_46FL",
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
    "id": "_clone_5SST",
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
    "id": "_clone_qpRP",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // remove field
  collection.fields.removeById("_clone_QFKA")

  // remove field
  collection.fields.removeById("_clone_VMDd")

  // remove field
  collection.fields.removeById("_clone_EgeX")

  // remove field
  collection.fields.removeById("_clone_vdyQ")

  return app.save(collection)
})
