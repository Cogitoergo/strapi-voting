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
    const [uid, relatedId] = await this.pluginService().parseRelationString(relation);
  
    // Parse incoming data
    const dataJson = JSON.parse(data);
  
    // Google Recaptcha check
    const recaptchaEnabled = config[uid] || false;
    if (recaptchaEnabled) {
      if (!dataJson.recaptchaToken) {
        throw new PluginError(400, `Google Recaptcha enabled for the collection but no user captcha token present.`);
      }
      const recaptchaResponse = await verifyRecaptcha(dataJson.recaptchaToken);
      if (!recaptchaResponse || !recaptchaResponse.success) {
        throw new PluginError(400, `Google Recaptcha verification failed.`);
      }
    }
  
    // Fingerprinting
    const ip = fingerprint.components.geoip.ip;
    const country = fingerprint.components.geoip.country;
    const userAgent = fingerprint.components.useragent.string;
  
    if (!ip || !country || !userAgent) {
      throw new PluginError(
        400,
        `There has been an error parsing userAgent/IP strings. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`
      );
    }
  
    if (country !== 'LT' && country !== 'ADMIN') {
      throw new PluginError(400, `Voting is only possible from within Lithuania. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`);
    }
  
    const hash = fingerprint.hash;
    const iphash = ip.split(',')[0] + hash;
  
    // Check if relation string format is valid
    const singleRelationFulfilled = relation && REGEX.relatedUid.test(relation);
    if (!singleRelationFulfilled) {
      throw new PluginError(400, `Field "related" got incorrect format, use format like "api::<collection name>.<content type name>:<entity id>"`);
    }
  
    // Dynamically check if 'group' field exists on content type
    const contentTypeSchema = strapi.contentType(uid);
    const hasGroupField = Object.prototype.hasOwnProperty.call(contentTypeSchema.attributes, 'group');
  
    const fieldsToSelect = ['votes'];
    if (hasGroupField) fieldsToSelect.push('group');
  
    // Fetch related entity with safe field selection
    const relatedEntity = await strapi.entityService.findOne(uid, relatedId, {
      fields: fieldsToSelect,
    });
  
    if (!relatedEntity) {
      throw new PluginError(400, `Relation for field "related" does not exist. Check your payload please.`);
    }
  
    const group = hasGroupField ? relatedEntity.group : null;
  
    try {
      // Use Knex transaction via strapi.db.connection
      const result = await strapi.db.connection.transaction(async (trx) => {
        console.log(`[VOTING] Starting vote transaction for iphash: ${iphash}, relation: ${relation}`);
  
        // 1. Check if user has already voted for this specific item (with lock)
        const existingVoteLog = await trx('plugin_voting_votelogs')
          .where({ 
            iphash, 
            voteId: String(relatedId)
          })
          .forUpdate()
          .first();
  
        if (existingVoteLog) {
          console.log(`[VOTING] User ${iphash} already voted for ${relation}`);
          throw new PluginError(403, `Already voted for ${relation}`);
        }
  
        // 2. Check group vote restriction if applicable (with lock)
        if (hasGroupField && group) {
          const now = new Date();
          const existingGroupVote = await trx('plugin_voting_votelogs')
            .where({ 
              iphash, 
              group 
            })
            .where('expiresAt', '>', now)
            .forUpdate()
            .first();
  
          if (existingGroupVote) {
            console.log(`[VOTING] User ${iphash} already voted in group "${group}"`);
            throw new PluginError(403, `You have already voted for an item in group "${group}" within the time limit`);
          }
        }
  
        // 3. Find or create user (with lock)
        let votingUser = await trx('plugin_voting_votes')
          .where({ iphash })
          .forUpdate()
          .first();
  
        let userId;
        if (!votingUser) {
          console.log(`[VOTING] Creating new user for iphash: ${iphash}`);
          const newUserResult = await trx('plugin_voting_votes')
            .insert({
              ip,
              iphash,
              votes: JSON.stringify([])
            });
          
          userId = newUserResult[0];
          votingUser = { id: userId, votes: [] };
        } else {
          userId = votingUser.id;
          // Parse votes if stored as JSON string
          if (typeof votingUser.votes === 'string') {
            votingUser.votes = JSON.parse(votingUser.votes);
          }
          if (!Array.isArray(votingUser.votes)) {
            votingUser.votes = [];
          }
        }
  
        // 4. Create votelog entry FIRST (this is our atomic lock)
        let date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
  
        const voteLogData = {
          ip,
          iphash,
          related: relation,
          group,
          country,
          userAgent,
          voteId: String(relatedId),
          votedAt: new Date(),
          publishedAt: new Date(),
          expiresAt: date,
          user: userId
        };
  
        const voteLogResult = await trx('plugin_voting_votelogs')
          .insert(voteLogData);
  
        const voteLogId = voteLogResult[0];
        console.log(`[VOTING] Created votelog ID: ${voteLogId}`);
  
        // 5. Increment vote count on the related entity
        const newVoteCount = (relatedEntity.votes || 0) + 1;
        
        await trx(strapi.db.metadata.get(uid).tableName)
          .where({ id: relatedId })
          .update({ votes: newVoteCount });
  
        console.log(`[VOTING] Incremented votes to ${newVoteCount} for ${relation}`);
  
        // 6. Update user's votes array
        const updatedVotes = [...votingUser.votes, voteLogId];
        
        await trx('plugin_voting_votes')
          .where({ id: userId })
          .update({ votes: JSON.stringify(updatedVotes) });
  
        console.log(`[VOTING] Updated user ${userId} votes array`);
  
        // Return the updated entity
        return {
          id: relatedEntity.id,
          votes: newVoteCount
        };
      });
  
      console.log(`[VOTING] Voting finished successfully${group ? ` for item in group: ${group}` : ' for ungrouped item'}`);
      return result;
  
    } catch (e) {
      console.error(`[VOTING] Error during vote transaction:`, e.message);
      
      // Re-throw PluginErrors as-is
      if (e instanceof PluginError) {
        throw e;
      }
      
      // Handle duplicate key errors (in case of race conditions)
      if (e.code === 'ER_DUP_ENTRY' || e.code === '23505') {
        throw new PluginError(403, `Already voted for ${relation}`);
      }
      
      throw new PluginError(400, e.message);
    }
  }
  // async vote(relation, data, user = null, fingerprint = {}) {
  //   const config = await this.pluginService().getConfig('googleRecaptcha');
  //   const [uid, relatedId] = await this.pluginService().parseRelationString(relation);
  
  //   // Parse incoming data
  //   const dataJson = JSON.parse(data);
  
  //   // Google Recaptcha check
  //   const recaptchaEnabled = config[uid] || false;
  //   if (recaptchaEnabled) {
  //     if (!dataJson.recaptchaToken) {
  //       throw new PluginError(400, `Google Recaptcha enabled for the collection but no user captcha token present.`);
  //     }
  //     const recaptchaResponse = await verifyRecaptcha(dataJson.recaptchaToken);
  //     if (!recaptchaResponse || !recaptchaResponse.success) {
  //       throw new PluginError(400, `Google Recaptcha verification failed.`);
  //     }
  //   }
  
  //   // Fingerprinting
  //   const ip = fingerprint.components.geoip.ip;
  //   const country = fingerprint.components.geoip.country;
  //   const userAgent = fingerprint.components.useragent.string;
  
  //   if (!ip || !country || !userAgent) {
  //     throw new PluginError(
  //       400,
  //       `There has been an error parsing userAgent/IP strings. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`
  //     );
  //   }
  
  //   if (country !== 'LT' && country !== 'ADMIN') {
  //     throw new PluginError(400, `Voting is only possible from within Lithuania. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`);
  //   }
  
  //   const hash = fingerprint.hash;
  //   const iphash = ip.split(',')[0] + hash;
  
  //   // Check if relation string format is valid
  //   const singleRelationFulfilled = relation && REGEX.relatedUid.test(relation);
  //   if (!singleRelationFulfilled) {
  //     throw new PluginError(400, `Field "related" got incorrect format, use format like "api::<collection name>.<content type name>:<entity id>"`);
  //   }
  
  //   // Dynamically check if 'group' field exists on content type
  //   const contentTypeSchema = strapi.contentType(uid);
  //   const hasGroupField = Object.prototype.hasOwnProperty.call(contentTypeSchema.attributes, 'group');
  
  //   const fieldsToSelect = ['votes'];
  //   if (hasGroupField) fieldsToSelect.push('group');
  
  //   // Fetch related entity with safe field selection
  //   const relatedEntity = await strapi.entityService.findOne(uid, relatedId, {
  //     fields: fieldsToSelect,
  //   });
  
  //   if (!relatedEntity) {
  //     throw new PluginError(400, `Relation for field "related" does not exist. Check your payload please.`);
  //   }
  
  //   const group = hasGroupField ? relatedEntity.group : null;
  
  //   try {
  //     // Use Strapi v4 transaction
  //     const result = await strapi.db.transaction(async ({ trx }) => {
  //       console.log(`[VOTING] Starting vote transaction for iphash: ${iphash}, relation: ${relation}`);
  
  //       // 1. Check if user has already voted for this specific item (with lock)
  //       const existingVoteLog = await strapi.db.connection('plugin_voting_votelogs')
  //         .where({ 
  //           iphash, 
  //           voteId: String(relatedId)
  //         })
  //         .transacting(trx)
  //         .forUpdate()
  //         .first();
  
  //       if (existingVoteLog) {
  //         console.log(`[VOTING] User ${iphash} already voted for ${relation}`);
  //         throw new PluginError(403, `Already voted for ${relation}`);
  //       }
  
  //       // 2. Check group vote restriction if applicable (with lock)
  //       if (hasGroupField && group) {
  //         const now = new Date();
  //         const existingGroupVote = await strapi.db.connection('plugin_voting_votelogs')
  //           .where({ 
  //             iphash, 
  //             group 
  //           })
  //           .where('expiresAt', '>', now)
  //           .transacting(trx)
  //           .forUpdate()
  //           .first();
  
  //         if (existingGroupVote) {
  //           console.log(`[VOTING] User ${iphash} already voted in group "${group}"`);
  //           throw new PluginError(403, `You have already voted for an item in group "${group}" within the time limit`);
  //         }
  //       }
  
  //       // 3. Find or create user (with lock)
  //       let votingUser = await strapi.db.connection('plugin_voting_votes')
  //         .where({ iphash })
  //         .transacting(trx)
  //         .forUpdate()
  //         .first();
  
  //       let userId;
  //       if (!votingUser) {
  //         console.log(`[VOTING] Creating new user for iphash: ${iphash}`);
  //         const newUserResult = await strapi.db.connection('plugin_voting_votes')
  //           .insert({
  //             ip,
  //             iphash,
  //             votes: JSON.stringify([])
  //           })
  //           .transacting(trx);
          
  //         userId = newUserResult[0];
  //         votingUser = { id: userId, votes: [] };
  //       } else {
  //         userId = votingUser.id;
  //         // Parse votes if stored as JSON string
  //         if (typeof votingUser.votes === 'string') {
  //           votingUser.votes = JSON.parse(votingUser.votes);
  //         }
  //         if (!Array.isArray(votingUser.votes)) {
  //           votingUser.votes = [];
  //         }
  //       }
  
  //       // 4. Create votelog entry FIRST (this is our atomic lock)
  //       let date = new Date();
  //       date.setDate(date.getDate() + 1);
  //       date.setHours(0, 0, 0, 0);
  
  //       const voteLogData = {
  //         ip,
  //         iphash,
  //         related: relation,
  //         group,
  //         country,
  //         userAgent,
  //         voteId: String(relatedId),
  //         votedAt: new Date(),
  //         publishedAt: new Date(),
  //         expiresAt: date,
  //         user: userId
  //       };
  
  //       const voteLogResult = await strapi.db.connection('plugin_voting_votelogs')
  //         .insert(voteLogData)
  //         .transacting(trx);
  
  //       const voteLogId = voteLogResult[0];
  //       console.log(`[VOTING] Created votelog ID: ${voteLogId}`);
  
  //       // 5. Increment vote count on the related entity
  //       const newVoteCount = (relatedEntity.votes || 0) + 1;
        
  //       await strapi.db.connection(strapi.db.metadata.get(uid).tableName)
  //         .where({ id: relatedId })
  //         .update({ votes: newVoteCount })
  //         .transacting(trx);
  
  //       console.log(`[VOTING] Incremented votes to ${newVoteCount} for ${relation}`);
  
  //       // 6. Update user's votes array
  //       const updatedVotes = [...votingUser.votes, voteLogId];
        
  //       await strapi.db.connection('plugin_voting_votes')
  //         .where({ id: userId })
  //         .update({ votes: JSON.stringify(updatedVotes) })
  //         .transacting(trx);
  
  //       console.log(`[VOTING] Updated user ${userId} votes array`);
  
  //       // Return the updated entity
  //       return {
  //         id: relatedEntity.id,
  //         votes: newVoteCount
  //       };
  //     });
  
  //     console.log(`[VOTING] Voting finished successfully${group ? ` for item in group: ${group}` : ' for ungrouped item'}`);
  //     return result;
  
  //   } catch (e) {
  //     console.error(`[VOTING] Error during vote transaction:`, e.message);
      
  //     // Re-throw PluginErrors as-is
  //     if (e instanceof PluginError) {
  //       throw e;
  //     }
      
  //     // Handle duplicate key errors (in case of race conditions)
  //     if (e.code === 'ER_DUP_ENTRY' || e.code === '23505') {
  //       throw new PluginError(403, `Already voted for ${relation}`);
  //     }
      
  //     throw new PluginError(400, e.message);
  //   }
  // },
  // async vote (relation, data, user = null, fingerprint = {}) {
  //   const config = await this.pluginService().getConfig('googleRecaptcha');
  //   const [uid, relatedId] = await this.pluginService().parseRelationString(relation);
  
  //   // Parse incoming data
  //   const dataJson = JSON.parse(data);
  
  //   // Google Recaptcha check
  //   const recaptchaEnabled = config[uid] || false;
  //   if (recaptchaEnabled) {
  //     if (!dataJson.recaptchaToken) {
  //       throw new PluginError(400, `Google Recaptcha enabled for the collection but no user captcha token present.`);
  //     }
  //     const recaptchaResponse = await verifyRecaptcha(dataJson.recaptchaToken);
  //     if (!recaptchaResponse || !recaptchaResponse.success) {
  //       throw new PluginError(400, `Google Recaptcha verification failed.`);
  //     }
  //   }
  
  //   // Fingerprinting
  //   const ip = fingerprint.components.geoip.ip;
  //   const country = fingerprint.components.geoip.country;
  //   const userAgent = fingerprint.components.useragent.string;
  
  //   if (!ip || !country || !userAgent) {
  //     throw new PluginError(
  //       400,
  //       `There has been an error parsing userAgent/IP strings. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`
  //     );
  //   } else {
  //     if (country !== 'LT' && country !== 'ADMIN') {
  //       throw new PluginError(400, `Voting is only possible from within Lithuania. IP: ${ip}, Country: ${country}, userAgent: ${userAgent}`);
  //     }
  
  //     const hash = fingerprint.hash;
  //     const iphash = ip.split(',')[0] + hash;
  
  //     // Check if relation string format is valid
  //     const singleRelationFulfilled = relation && REGEX.relatedUid.test(relation);
  //     if (!singleRelationFulfilled) {
  //       throw new PluginError(400, `Field "related" got incorrect format, use format like "api::<collection name>.<content type name>:<entity id>"`);
  //     }
  
  //     // Dynamically check if 'group' field exists on content type
  //     const contentTypeSchema = strapi.contentType(uid);
  //     const hasGroupField = Object.prototype.hasOwnProperty.call(contentTypeSchema.attributes, 'group');
  
  //     const fieldsToSelect = ['votes'];
  //     if (hasGroupField) fieldsToSelect.push('group');
  
  //     // Fetch related entity with safe field selection
  //     const relatedEntity = await strapi.entityService.findOne(uid, relatedId, {
  //       fields: fieldsToSelect,
  //     });
  
  //     if (!relatedEntity) {
  //       throw new PluginError(400, `Relation for field "related" does not exist. Check your payload please.`);
  //     }
  
  //     const group = hasGroupField ? relatedEntity.group : null;
  
  //     // Check group vote restriction if applicable
  //     if (hasGroupField && group) {
  //       const hasVotedInGroup = await this.checkGroupVoteRestriction(iphash, group);
  //       if (hasVotedInGroup) {
  //         throw new PluginError(403, `You have already voted for an item in group "${group}" within the time limit`);
  //       }
  //     }
  
  //     try {
  //       // Try to find the user by iphash
  //       const votingUser = await this.findUser(iphash);
  
  //       const votes = relatedEntity.votes + 1;
  //       const voted = await this.doVoting(uid, relatedEntity.id, votes);
  
  //       if (!voted) {
  //         console.log('[VOTING] Voting failed, aborting..');
  //         return;
  //       }
  
  //       const payload = {
  //         ip,
  //         iphash,
  //         related: relation,
  //         group,
  //         country,
  //         userAgent,
  //         voteId: String(relatedId),
  //         votedAt: new Date()
  //       };
  
  //       if (votingUser) {
  //         payload.user = votingUser.id;
  
  //         if (!group) {
  //           const votedBefore = checkForExistingId(votingUser.votes, relation);
  //           if (votedBefore) {
  //             throw new PluginError(403, `Already voted for ${relation}`);
  //           }
  //         }
  
  //         const voteLog = await this.createVotelog(payload);
  //         if (!voteLog) {
  //           console.log('[VOTING] VoteLog creation failed, aborting..');
  //           return;
  //         }
  
  //         const updatedVotes = votingUser.votes && votingUser.votes.length > 0 ? [...votingUser.votes, voteLog.id] : [voteLog.id];
  //         const updatedUser = await this.updateUser(updatedVotes, votingUser.id);
  
  //         if (updatedUser) {
  //           console.log('[VOTING] Voting finished successfully' + (group ? ` for item in group: ${group}` : ' for ungrouped item'));
  //           return voted;
  //         } else {
  //           console.log('[VOTING] Error updating user with new vote');
  //         }
  //       } else {
  //         // User not found, create new
  //         const newUser = await this.createNewUser(ip, iphash);
  //         if (!newUser) {
  //           console.log('[VOTING] New user creation failed, aborting..');
  //           return;
  //         }
  
  //         payload.user = newUser.id;
  
  //         const voteLog = await this.createVotelog(payload);
  //         if (!voteLog) {
  //           console.log('[VOTING] VoteLog creation failed for new user, aborting..');
  //           return;
  //         }
  
  //         const updatedVotes = [voteLog.id];
  //         const updatedUser = await this.updateUser(updatedVotes, newUser.id);
  
  //         if (updatedUser) {
  //           console.log('[VOTING] Voting finished successfully' + (group ? ` for item in group: ${group}` : ' for ungrouped item'));
  //           return voted;
  //         } else {
  //           console.log('[VOTING] Error updating new user with vote');
  //         }
  //       }
  //     } catch (e) {
  //       throw new PluginError(400, e.message);
  //     }
  //   }
  
  //   throw new PluginError(400, 'No content received');
  // }
});