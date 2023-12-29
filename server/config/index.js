'use strict';

module.exports = {
  default: {
    enabledCollections: [],
    entryLabel: {
      '*': ['Votes', 'votes', 'Vote', 'vote', 'Balsai', 'blsai', 'Balsu', 'balsu']
    },
    votingPeriods: {},
    googleRecaptcha: {
      '*': false
    },
    sendEmailConfirmation: {
      '*': false
    }
  },
  validator() {},
};
