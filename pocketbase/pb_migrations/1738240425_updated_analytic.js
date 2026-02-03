/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1485150664")

  // update collection data
  unmarshal({
    "name": "analytics"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1485150664")

  // update collection data
  unmarshal({
    "name": "analytic"
  }, collection)

  return app.save(collection)
})
