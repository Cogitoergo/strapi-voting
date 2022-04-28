/**
 * Votes Collection Type
 */
 module.exports = {
  info: {
    tableName: 'plugin-voting-votes',
    singularName: 'vote',
    pluralName: 'votes',
    displayName: 'Votes',
    description: 'Voting content type',
    kind: 'collectionType',
  },
  options: {
    draftAndPublish: false,
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
      configurable: false
    },
    iphash: {
      type: 'string',
      configurable: false
    },
    votes: {
      type: 'relation',
      relation: 'oneToMany',
      target: 'plugin::strapi-voting.votelog',
      configurable: false
    }
  },
};