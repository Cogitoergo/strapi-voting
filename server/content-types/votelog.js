/**
 * Votes Collection Type
 */
 module.exports = {
  info: {
    tableName: 'plugin-voting-votelogs',
    singularName: 'votelog',
    pluralName: 'votelogs',
    displayName: 'Voting logs',
    description: 'Voting logs content type',
    kind: 'collectionType',
  },
  options: {
    draftAndPublish: true,
  },
  pluginOptions: {
    'content-manager': {
      visible: true
    },
    'content-type-builder': {
      visible: true
    }
  },
  attributes: {
    ip: {
      type: 'string',
      configurable: true
    },
    iphash: {
      type: 'string',
      configurable: true
    },
    related: {
      type: 'string',
      configurable: true
    },
    voteId: {
      type: 'string',
      configurable: true
    },
    votedAt: {
      type: 'datetime',
      configurable: true
    },
    expiresAt: {
      type: 'datetime',
      configurable: true
    },
    user: {
      type: 'relation',
      target: 'plugin::voting.vote',
      relation: 'manyToOne'
    }
  },
};