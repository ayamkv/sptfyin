/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update collection data
  unmarshal({
    "updateRule": "@request.body.utm_view != null && \n(@request.body.id_url = id_url || @request.body.id_url = \"\") &&\n(@request.body.from = from || @request.body.from = \"\") &&\n(@request.body.subdomain = subdomain || @request.body.subdomain = \"\") &&\n(@request.body.enable = enable || @request.body.enable = \"\") "
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "sb6qndzg",
    "max": null,
    "min": 0,
    "name": "utm_view",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update collection data
  unmarshal({
    "updateRule": null
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "sb6qndzg",
    "max": null,
    "min": null,
    "name": "utm_view",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
})
