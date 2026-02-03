/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2589167811")

  // update collection data
  unmarshal({
    "viewQuery": "SELECT   \n  id,\n  subdomain,\n  id_url,\n  \"from\",\n  user,\n  utm_view,\n  created\n  \nFROM random_short"
  }, collection)

  // remove field
  collection.fields.removeById("_clone_c9hS")

  // remove field
  collection.fields.removeById("_clone_AOVu")

  // remove field
  collection.fields.removeById("_clone_89Oq")

  // remove field
  collection.fields.removeById("_clone_pElV")

  // remove field
  collection.fields.removeById("_clone_5JH1")

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "_clone_WXku",
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
      "sptfy.in",
      "profile"
    ]
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_qRjP",
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
    "id": "_clone_5MEn",
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
    "cascadeDelete": false,
    "collectionId": "_pb_users_auth_",
    "hidden": false,
    "id": "_clone_vckS",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "user",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(5, new Field({
    "hidden": false,
    "id": "_clone_onk8",
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
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "_clone_AtdV",
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
    "viewQuery": "SELECT   \n  id,\n  subdomain,\n  id_url,\n  \"from\",\n  utm_view,\n  created\n  \nFROM random_short"
  }, collection)

  // add field
  collection.fields.addAt(1, new Field({
    "hidden": false,
    "id": "_clone_c9hS",
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
      "sptfy.in",
      "profile"
    ]
  }))

  // add field
  collection.fields.addAt(2, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "_clone_AOVu",
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
    "id": "_clone_89Oq",
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
    "id": "_clone_pElV",
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
    "id": "_clone_5JH1",
    "name": "created",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // remove field
  collection.fields.removeById("_clone_WXku")

  // remove field
  collection.fields.removeById("_clone_qRjP")

  // remove field
  collection.fields.removeById("_clone_5MEn")

  // remove field
  collection.fields.removeById("_clone_vckS")

  // remove field
  collection.fields.removeById("_clone_onk8")

  // remove field
  collection.fields.removeById("_clone_AtdV")

  return app.save(collection)
})
