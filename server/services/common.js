const { isNil, get, isNumber, parseInt } = require('lodash');
const {
  getRelatedGroups,
  buildConfigQueryProp
} = require('./utils/functions');

const PluginError = require('./../utils/error');

module.exports = ({ strapi }) => ({
  async getPluginStore() {
    return strapi.store({ type: 'plugin', name: 'voting' });
  },
  async getConfig(prop, defaultValue, useLocal = false) {
    const queryProp = buildConfigQueryProp(prop);
    const pluginStore = await this.getPluginStore();
    const config = await pluginStore.get({ key: 'config' });
    let result;
    if (config && !useLocal) {
      result = queryProp ? get(config, queryProp, defaultValue) : config;
    } else {
      result = this.getLocalConfig(queryProp, defaultValue);
    }
    return isNil(result) ? defaultValue : result;
  },
  getLocalConfig(prop, defaultValue) {
    const queryProp = buildConfigQueryProp(prop);
    const result = strapi.config.get(`plugin.voting${ queryProp ? '.' + queryProp : ''}`);
    return isNil(result) ? defaultValue : result;
  },
  async parseRelationString(relation) {
    const [ uid, relatedStringId ] = getRelatedGroups(relation);
    const parsedRelatedId = parseInt(relatedStringId);
    const relatedId = isNumber(parsedRelatedId) ? parsedRelatedId : relatedStringId;
    const enabledCollections = await this.getConfig('enabledCollections', []);
    if (!enabledCollections.includes(uid)) {
      throw new PluginError(403, `Action not allowed for collection '${uid}'. Use one of: ${ enabledCollections.join(', ') }`);
    }
    return [ uid, relatedId ];
  }
});