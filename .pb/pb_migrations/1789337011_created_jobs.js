/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "hidden": false,
        "id": "title",
        "name": "title",
        "required": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "category",
        "name": "category",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "requestor",
        "name": "requestor",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "volunteer",
        "name": "volunteer",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "status",
        "name": "status",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "risk",
        "name": "risk",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "date",
        "name": "date",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "amount",
        "name": "amount",
        "type": "number"
      },
      {
        "hidden": false,
        "id": "notes",
        "name": "notes",
        "type": "text"
      }
    ],
    "id": "pbc_2409499253",
    "indexes": [],
    "listRule": null,
    "name": "jobs",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2409499253");

  return app.delete(collection);
})
