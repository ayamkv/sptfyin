/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update collection data
  unmarshal({
    "createRule": null
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update collection data
  unmarshal({
    "createRule": ""
  }, collection)

  return app.save(collection)
})
