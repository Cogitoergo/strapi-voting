const PluginError = require('./error');

module.exports = {
  throwError: (ctx, e) => {
    if (e instanceof PluginError){
      return ctx.throw(e.status, e.message);
    }
    throw e;
  },
  getPluginService(name) {
    return strapi
      .plugin('strapi-voting')
      .service(name);
  },
  parseParams: params => Object.keys(params).reduce((prev, curr) => {
    const value = params[curr];
    const parsedValue = Number(value);
    return {
     ...prev,
     [curr]: isNaN(parsedValue) ? value : parsedValue
   };
  }, {})
}