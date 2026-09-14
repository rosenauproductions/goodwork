/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
    "deleteRule": null,
    "fields": [
      {
        "hidden": false,
        "id": "name",
        "name": "name",
        "required": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "familyType",
        "name": "familyType",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "activeJobs",
        "name": "activeJobs",
        "type": "number"
      },
      {
        "hidden": false,
        "id": "totalRaised",
        "name": "totalRaised",
        "type": "number"
      },
      {
        "hidden": false,
        "id": "nextStep",
        "name": "nextStep",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "contact",
        "name": "contact",
        "type": "text"
      },
      {
        "hidden": false,
        "id": "status",
        "name": "status",
        "type": "text"
      }
    ],
    "id": "pbc_3641796565",
    "indexes": [],
    "listRule": null,
    "name": "families",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3641796565");

  return app.delete(collection);
})
