/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "bool1542800728",
    "name": "field",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1543120290")

  // remove field
  collection.fields.removeById("bool1542800728")

  return app.save(collection)
})
