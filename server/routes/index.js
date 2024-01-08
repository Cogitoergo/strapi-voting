module.exports = [
  // Get available collections
  {
    method: "GET",
    path: "/content-types",
    handler: "voting.getContentTypes",
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/email-confirmation/:collectionName/:confirmationToken",
    handler: "voting.confirmEmail",
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: "GET",
    path: "/content-types-fields/:model",
    handler: "voting.getContentTypesFields",
    config: {
      auth: false,
      policies: [],
    },
  },
  // Get collection with items
  {
    method: "GET",
    path: "/:id",
    handler: "voting.getCollection",
    config: {
      auth: false,
      policies: [],
    },
  },
  // Vote
  {
    method: "POST",
    path: "/:relation/vote",
    handler: "voting.vote",
    config: {
      auth: false,
      policies: [],
    },
  },
  // Settings
  {
    method: 'GET',
    path: '/settings/config',
    handler: 'admin.settingsConfig',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'PUT',
    path: '/settings/config',
    handler: 'admin.settingsUpdateConfig',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'DELETE',
    path: '/settings/config',
    handler: 'admin.settingsRestoreConfig',
    config: {
      auth: false,
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/settings/restart',
    handler: 'admin.settingsRestart',
    config: {
      auth: false,
      policies: [],
    },
  }
];
