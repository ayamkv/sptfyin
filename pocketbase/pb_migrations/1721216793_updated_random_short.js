/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  collection.indexes = [
    "CREATE UNIQUE INDEX `idx_IUTYfz6` ON `random_short` (`id_url`)"
  ]

  return dao.saveCollection(collection)
}, (db) => {
  const dao = new Dao(db)
  const collection = dao.findCollectionByNameOrId("ocypvwxnoapmygg")

  collection.indexes = []

  return dao.saveCollection(collection)
})
