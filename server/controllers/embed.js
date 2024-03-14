const {
  getPluginService
} = require('../utils/functions');
const fs = require('fs');
module.exports = {
  getService(name = 'voting') {
    return getPluginService(name)
  },
  async findEmbed(ctx) {
    try {
      console.log('[FIND EMBED] CONTROLLER')
      const embedService = this.getService('embed');
      const { collectionName, entryId } = ctx.params;
      // Generate the merged embed photo using the photoMerge service
      const imagePath = await embedService.mergeWithFrame(entryId, 'photo', collectionName);
      // Redirect to the generated image URL
      // Read the image file
      const imageStream = fs.createReadStream(imagePath);
      // Set the appropriate content type
      ctx.response.set('Content-Type', 'image/png');
      // Pipe the image stream to the response
      ctx.response.body = imageStream;
    } catch (error) {
      // Handle errors
      console.error('Error generating or serving image:', error);
      ctx.response.status = 500;
      ctx.response.body = { error: 'Internal server error' };
    }
  },
};