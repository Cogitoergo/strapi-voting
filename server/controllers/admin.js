module.exports = {
  async config(ctx) {
    ctx.body = await strapi
      .plugin('strapi-voting')
      .service('admin')
      .config();
  },
  async settingsConfig(ctx) {
    ctx.body = await strapi
      .plugin('strapi-voting')
      .service('admin')
      .config(true);
  },
  async settingsUpdateConfig(ctx) {
    const { request: { body } } = ctx;
    ctx.body = await strapi
      .plugin('strapi-voting')
      .service('admin')
      .updateConfig(body)
  },
  async settingsRestoreConfig(ctx) {
    ctx.body = await strapi
      .plugin('strapi-voting')
      .service('admin')
      .restoreConfig()
  },
  async settingsRestart(ctx) {
    ctx.body = await strapi
      .plugin('strapi-voting')
      .service('admin')
      .restart()
  }
}