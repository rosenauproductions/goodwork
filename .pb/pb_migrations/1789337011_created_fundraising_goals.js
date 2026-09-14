/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "hidden": false,
        "id": "label",
        "name": "label",
        "required": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "raised",
        "name": "raised",
        "type": "number"
      },
      {
        "hidden": false,
        "id": "target",
        "name": "target",
        "type": "number"
      },
      {
        "hidden": false,
        "id": "status",
        "name": "status",
        "type": "text"
      }
    ],
    "id": "pbc_3341279618",
    "indexes": [],
    "listRule": null,
    "name": "fundraising_goals",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3341279618");

  return app.delete(collection);
})
