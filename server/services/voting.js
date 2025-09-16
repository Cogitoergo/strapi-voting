'use strict';

const { getPluginService } = require('../utils/functions');
const { checkForExistingId } = require('./utils/functions')
const { REGEX } = require('../utils/constants');
const PluginError = require('./../utils/error');
const { verifyRecaptcha } = require('./../utils/verifyRecaptcha');
const crypto = require('crypto');

module.exports = ({ strapi }) => ({
  pluginService (name = 'common') {
    return getPluginService(name)
  },
  
  fetchContentTypes() {
    const contentTypes = strapi.contentTypes
    const keys = Object.keys(contentTypes);
    let collectionTypes = [];
    let singleTypes = [];

    keys.forEach((name) => {
      if (name.includes('api::')) {
        const object = {
          uid: contentTypes[name].uid,
          kind: contentTypes[name].kind,
          globalId: contentTypes[name].globalId,
          attributes: contentTypes[name].attributes,
        };
        contentTypes[name].kind === 'collectionType'
          ? collectionTypes.push(object)
          : singleTypes.push(object);
      }
    });

    return { collectionTypes, singleTypes } || null;
  },

  // Send email confirmation
  async sendConfirmationEmail (email, collectionName, entryId, projectName = '') {
    // Check if params provided
    if (!email || !collectionName || !entryId) {
      throw new PluginError(400, 'Email, collectionName and entryId are required.');
    };
    console.log(`[SERVICES]-[sendConfirmationEmail] Sending email confirmation to <${email}> for entry <${entryId}> in collection <${collectionName}>`);
    // Generate confirmation token
    const confirmationToken = crypto.randomBytes(20).toString('hex');
    // Update entry with the generated token
    await strapi.entityService.update(collectionName, entryId, {
      data: { confirmationToken }
    });
    // Prepare confirmation url and project name
    const confirmationUrl = `https://api.lrytas.lt/balsavimai/voting/email-confirmation/${collectionName}/${confirmationToken}`
    // Send confirmation email
    try {
      await strapi
      .plugin('email')
      .service('email')
      .send({
        template_id: 'd-73f06f7ca1af4f348413a922416a77c8',
        personalizations: [
          {
            from: `Lrytas.lt <pagalba@lrytas.lt>`,
            replyTo: 'pagalba@lrytas.lt',
            subject: 'Registracijos patvirtinimas',
            to: [
              {
                email: email
              }
            ],
            dynamic_template_data: {
              url: confirmationUrl,
              title: projectName
            }
          }
        ],
        to: email,
        from: `Lrytas.lt <pagalba@lrytas.lt>`,
        replyTo: 'pagalba@lrytas.lt',
        subject: 'Registracijos patvirtinimas'
      });
      console.log(`[SERVICES]-[sendConfirmationEmail] Sending email confirmation to <${email}> for entry <${entryId}> in collection <${collectionName}> was SUCCESSFUL!`);
    } catch (e) {
      console.log(`[SERVICES]-[sendConfirmationEmail] Sending email confirmation to <${email}> for entry <${entryId}> in collection <${collectionName}> FAILED`);
      console.log(e.message)
    }
  },

  async confirmEmail (confirmationToken, collectionName) {
    // Check if params provided
    if (!confirmationToken || !collectionName) {
      throw new PluginError(400, 'Confirmation token and collectionName are required.');
    };
    console.log(`[SERVICES]-[confirmEmail] Confirming email with token <${confirmationToken}> in collection <${collectionName}>`);
    const entry = await strapi.db.query(collectionName).findOne({
      where: { confirmationToken }
    })
    if (!entry) {
      throw new PluginError(400, 'Failed to confirm, entry not found', entry);
    }
    console.log(`[SERVICES]-[confirmEmail] Updating confirmed entry ID: <${entry.id}> in collection <${collectionName}>`);
    const updatedEntry = await strapi.entityService.update(collectionName, entry.id, {
      data: { emailConfirmed: true }
    });
    if (!updatedEntry) {
      throw new PluginError(400, 'Failed to confirm, updating entry failed', updatedEntry);
    }
    console.log(`[SERVICES]-[confirmEmail] Email for entry ID: <${entry.id}> in collection <${collectionName}> confirmed successfuly!`);
    return updatedEntry
  },

  async getCollection(contentType) {
    const entries = await strapi.entityService.findMany(contentType, { populate: '*' })
    return entries
  },

  async createVotelog (payload) {
    try {
      let date = new Date()
      date.setDate(date.getDate()+1);
      date.setHours(0);
      date.setMinutes(0);
      date.setSeconds(0);
      const votelog = await strapi.entityService.create('plugin::voting.votelog', {
        data: {
          ...payload,
          publishedAt: new Date(),
          expiresAt: date
        },
      });
      if (votelog) {
        return votelog
      }
    } catch (e) {
      throw new PluginError(400, e.message);
    }
  },

  async findUser (iphash) {
    console.log('[VOTING] Looking for user with iphash:', iphash)
    try {
      const user = await strapi.entityService.findMany('plugin::voting.vote', {
        filters: { iphash },
        populate: ['votes']
      });
      if (user) {
        console.log('[VOTING] User found..', user)
        return user[0]
      }
    } catch (e) {
      throw new PluginError(400, e.message);
    }
  },

  async updateUser (votes, id) {
    try {
      const finalVote = await strapi.entityService.update('plugin::voting.vote', id, {
        data: {
          votes
        },
      });
      if (finalVote) {
        return finalVote
      }
    } catch (e) {
      throw new PluginError(400, e.message);
    }
  },

  async createNewUser (ip, iphash) {
    try {
      const newUser = await strapi.entityService.create('plugin::voting.vote', {
        data: {
          ip: ip,
          iphash: iphash,
          votes: []
        },
      });
      if (newUser) {
        return newUser
      }
    } catch (e) {
      throw new PluginError(400, e.message);
    }
  },

  async doVoting (uid, id, votes) {
    try {
      const entryUpdated = await strapi.entityService.update(uid, id, {
        data: {
          votes
        }
      });
      if (entryUpdated) {
        return entryUpdated
      }
    } catch (e) {
      throw new PluginError(400, e.message);
    }
  },

  // Helper function to check if user has voted for any item in this group within time limit
  async checkGroupVoteRestriction(iphash, group) {
    if (!group) {
      return false; // No group restriction if group is not provided
    }

    try {
      // Get current date
      const now = new Date();
      
      // Find all vote logs for this user and group that haven't expired
      // Note: we're checking ANY item in the group, not a specific relation
      const voteLogs = await strapi.entityService.findMany('plugin::voting.votelog', {
        filters: {
          iphash: iphash,
          group: group,
          expiresAt: {
            $gt: now // Only get votes that haven't expired
          }
        }
      });

      // If we found any valid votes for this group, user has already voted
      return voteLogs && voteLogs.length > 0;
    } catch (e) {
      console.error('[VOTING] Error checking group vote restriction:', e.message);
      return false;
    }
  },

  // Updated helper to check existing votes with group support
  checkForExistingIdWithGroup(votes, relation, group) {
    if (!votes || votes.length === 0) return false;
    
    // If no group is specified, use the original logic
    if (!group) {
      return checkForExistingId(votes, relation);
    }
    
    // With group, we need to check the votelog entries for group match
    // This will be handled by checkGroupVoteRestriction instead
    return false;
  },

  async vote(relation, data, user = null, fingerprint = {}) {
    const config = await this.pluginService().getConfig('googleRecaptcha');
    const [ uid, relatedId ] = await this.pluginService().parseRelationString(relation);
    
    // Parse data (only for recaptcha token now, not for group)
    const dataJson = JSON.parse(data)
    
    // Google Recaptcha
    const recaptchaEnabled = config[uid] || false
    if (recaptchaEnabled) {
      if (!dataJson.recaptchaToken) {
        throw new PluginError(400, `Google Recaptcha enabled for the collection but no user captcha token present.`);
      }
      const recaptchaResponse = await verifyRecaptcha(dataJson.recaptchaToken)
      if (!recaptchaResponse || !recaptchaResponse.success) {
        throw new PluginError(400, `Google Recaptcha verification failed.`);
      }
    }
    
    // Fingerprinting
    const ip = fingerprint.components.geoip.ip
    const country = fingerprint.components.geoip.country
    const userAgent = fingerprint.components.useragent.string
    
    if (!ip || !country || !userAgent) {
      throw new PluginError(400, `There has been an error parsing userAgent/IP strings. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`);
    } else {
      if (country !== 'LT' && country !== 'ADMIN') {
        throw new PluginError(400, `Voting is only possible from within Lithuania. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`);
      }
      
      const hash = fingerprint.hash
      const iphash = ip.split(',')[0] + hash
      
      // Check for correct collection relation string in req
      const singleRelationFulfilled = relation && REGEX.relatedUid.test(relation);
      if (!singleRelationFulfilled) {
        throw new PluginError(400, `Field "related" got incorrect format, use format like "api::<collection name>.<content type name>:<entity id>"`);
      }
      
      // Find related entity by relation string - NOW INCLUDING GROUP FIELD
      const relatedEntity = await strapi.entityService.findOne(uid, relatedId, { 
        fields: ['votes', 'group'] // Fetch group from the item itself
      });
      if (!relatedEntity) {
        throw new PluginError(400, `Relation for field "related" does not exist. Check your payload please.`);
      }
      
      // Get group from the entity, not from user data
      const group = relatedEntity.group || null;
      
      // Check group vote restriction if item has a group
      if (group) {
        const hasVotedInGroup = await this.checkGroupVoteRestriction(iphash, group);
        if (hasVotedInGroup) {
          throw new PluginError(403, `You have already voted for an item in group "${group}" within the time limit`);
        }
      }
      
      // If relation correct and entity found...
      if (singleRelationFulfilled && relatedEntity) {
        try {
          // Try to find user
          const votingUser = await this.findUser(iphash)
          
          if (votingUser) {
            // If no group is specified on the item, check for any previous vote on this specific item
            if (!group) {
              const votedBefore = checkForExistingId(votingUser.votes, relation)
              if (votedBefore) {
                throw new PluginError(403, `Already voted for ${relation}`);
              }
            }
            // If group is specified, the group check was already done above
            
            const votes = await relatedEntity.votes + 1
            const voted = await this.doVoting(uid, relatedEntity.id, votes)
            
            if (voted) {
              const payload = {
                ip: ip,
                iphash: iphash,
                related: relation,
                group: group, // Group from the item
                country,
                userAgent,
                user: votingUser.id,
                voteId: String(relatedId),
                votedAt: new Date()
              }
              
              const voteLog = await this.createVotelog(payload)
              if (voteLog) {
                const updatedVotes = votingUser.votes && votingUser.votes.length > 0 ? [...votingUser.votes, voteLog.id] : [voteLog.id]
                const updatedUser = await this.updateUser(updatedVotes, votingUser.id)
                if (updatedUser && voted) {
                  console.log('[VOTING] Voting finished successfuly' + (group ? ` for item in group: ${group}` : ' for ungrouped item'))
                  return voted
                } else {
                  console.log('[VOTING] Voting did not successfuly finished, error updating user')
                }
              } else {
                console.log('[VOTING] VoteLog creation failed, aborting..')
              }
            } else {
              console.log('[VOTING] Voting failed, aborting..')
            }
            return { test: 'test' }
          } else {
            // Create new user
            console.log('[VOTING] User not found, creating one..')
            const votingUserNew = await this.createNewUser(ip, iphash)
            
            if (votingUserNew) {
              console.log('[VOTING] New user created:', votingUserNew)
              const votes = await relatedEntity.votes + 1
              const voted = await this.doVoting(uid, relatedEntity.id, votes)
              
              if (voted) {
                const payload = {
                  ip: ip,
                  country,
                  userAgent,
                  iphash: iphash,
                  related: relation,
                  group: group, // Group from the item
                  user: votingUserNew.id,
                  voteId: String(relatedId),
                  votedAt: new Date()
                }
                
                const voteLog = await this.createVotelog(payload)
                if (voteLog) {
                  const updatedVotes = votingUserNew.votes && votingUserNew.votes.length > 0 ? [...votingUserNew.votes, voteLog.id] : [voteLog.id]
                  const updatedUser = await this.updateUser(updatedVotes, votingUserNew.id)
                  if (updatedUser && voted) {
                    console.log('[VOTING] Voting finished successfuly' + (group ? ` for item in group: ${group}` : ' for ungrouped item'))
                    return voted
                  } else {
                    console.log('[VOTING] Voting did not successfuly finished, error updating user')
                  }
                } else {
                  console.log('[VOTING] VoteLog creation failed, aborting..')
                }
              } else {
                console.log('[VOTING] Voting failed, aborting..')
              }
            } else {
              console.log('[VOTING] New user creation failed, aborting..')
            }
          }
        } catch (e) {
          throw new PluginError(400, e.message);
        }
      }
      throw new PluginError(400, 'No content received');
    }
  }
});