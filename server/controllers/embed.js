module.exports = {
  getService(name = 'voting') {
    return getPluginService(name)
  },
  async findEmbed(ctx) {
    try {
      console.log('[FIND EMBED] CONTROLLER')
      const mergeWithFrame = this.getService('embed');
      const { collectionName, entryId } = ctx.params;
      // Generate the merged embed photo using the photoMerge service
      const imageUrl = await mergeWithFrame(entryId, 'photo', collectionName);
      // Redirect to the generated image URL
      ctx.redirect(imageUrl);
    } catch (error) {
      // Handle errors
      console.error('Error generating or serving image:', error);
      ctx.response.status = 500;
      ctx.response.body = { error: 'Internal server error' };
    }
  },
};