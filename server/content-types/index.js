'use strict';
const VoteCT = require('./vote')
const VotelogCT = require('./votelog')
module.exports = {
  'vote': {
    schema: VoteCT
  },
  'votelog': {
    schema: VotelogCT
  },
};
