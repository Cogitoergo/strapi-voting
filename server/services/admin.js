'use strict';

const { isNil, get } = require('lodash');
const {
  buildConfigQueryProp,
} = require('./utils/functions');
const { REGEX } = require('../utils/constants')

module.exports = ({ strapi }) => ({
  async getPluginStore() {
    return strapi.store({ type: 'plugin', name: 'voting' });
  },

  getLocalConfig(prop, defaultValue) {
    const queryProp = buildConfigQueryProp(prop);
    const result = strapi.config.get(`plugin.voting${ queryProp ? '.' + queryProp : ''}`);
    return isNil(result) ? { data: defaultValue } : result;
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

  async config(viaSettingsPage = false) {
    const pluginStore = await this.getPluginStore()
    const config = await pluginStore.get({ key: 'config' });
    const additionalConfiguration = {
      regex: Object.keys(REGEX).reduce((prev, curr) => ({
          ...prev,
          [curr]: REGEX[curr].toString(),
      }), {}),
    };

    if (config) {
      return {
        ...config,
        ...additionalConfiguration
      };
    }

    const entryLabel = this.getLocalConfig('entryLabel');
    const result = {
      entryLabel,
      ...additionalConfiguration,
    };

    if (viaSettingsPage) {
      const enabledCollections = this.getLocalConfig('enabledCollections');
      return {
        ...result,
        enabledCollections
      };
    }

    return result;
  },

  async updateConfig(body) {
    const pluginStore = await this.getPluginStore();
    await pluginStore.set({ key: 'config', value: body });
    return this.config();
  },

  async restoreConfig() {
    const pluginStore = await this.getPluginStore();
    await pluginStore.delete({key: 'config'});
    return this.config();
  },

  async restart() {
    setImmediate(() => strapi.reload());
  },
});