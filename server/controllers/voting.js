const {
  getPluginService,
  parseParams,
  throwError,
} = require('../utils/functions');

const utils = require("@strapi/utils");
const { sanitize } = utils;

module.exports = {
  getService(name = 'voting') {
    return getPluginService(name)
  },
  getContentTypes(ctx) {
    ctx.body = this.getService()
      .fetchContentTypes();
  },
  getContentTypesFields(ctx) {
    const { model } = ctx.params
    ctx.body = this.getService()
      .fetchContentTypesFields(model)
  },
  sanitizeData (data, id, ctx) {
    const schema = strapi.getModel(id);
    const { auth } = ctx.state;
    return sanitize.contentAPI.output(data, schema, { auth });
  },
  async getCollection(ctx) {
    const { id } = ctx.params;
  
    console.log('ID:', id);
    console.log('Schema:', schema);
    console.log('Auth:', auth);
  
    const entries = await this.getService().getCollection(id)
  
    console.log('Entries before sanitization:', entries);
  
    ctx.body = await this.sanitizeData(entries, id, ctx)
  
    console.log('Response:', ctx.body);
  },
  async vote(ctx) {
    const { request, params = {}, state = {} } = ctx;
    const { relation } = parseParams(params);
    const { user } = state;
    const { body = {} } = request;
    const { fingerprint } = ctx.req

    console.log('[CONTROLLERS] Strapi-Voting: vote', relation)
    try {
      const entity = await this.getService().vote(relation, body, user, fingerprint);
      if (entity) {
        return entity;
      }
    } catch (e) {
      throwError(ctx, e);
    }
  }
}