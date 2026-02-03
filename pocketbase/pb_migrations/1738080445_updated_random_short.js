/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update collection data
  unmarshal({
    "updateRule": "@request.body.utm_view != null "
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("ocypvwxnoapmygg")

  // update collection data
  unmarshal({
    "updateRule": "@request.body.utm_view != null && \n(@request.body.id_url = id_url || @request.body.id_url = \"\") &&\n(@request.body.from = from || @request.body.from = \"\") &&\n(@request.body.subdomain = subdomain || @request.body.subdomain = \"\") &&\n(@request.body.enable = enable || @request.body.enable = \"\") "
  }, collection)

  return app.save(collection)
})
