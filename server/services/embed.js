const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

module.exports = ({ strapi }) => ({
  async mergeWithFrame(entryId, photoFieldName, collectionName) {
    console.log('[mergeWithFrame] Service', entryId, photoFieldName, collectionName)
    try {
      // Check if the image already exists
      const existingImagePath = this.getExistingImagePath(entryId, collectionName);
      if (existingImagePath) {
        return existingImagePath;
      }

      // Fetch the entry by ID
      const entry = await strapi.query(collectionName).findOne({
        where: {
          id: entryId
        },
        populate: {
          photo: true
        }
      });
      if (!entry) {
        throw new Error('Entry not found');
      }

      console.log('[mergeWithFrame] found entry:', entry)

      // Retrieve photo path from the entry
      const photoPath = 'public' + entry[photoFieldName].url;
      if (!photoPath) {
        throw new Error('Photo path not found in the entry');
      }

      console.log('[mergeWithFrame] found photo path:', photoPath)

      // Load premade photo frame from embed_templates
      const framePath = path.join(strapi.config.server.dirs.public, 'embed_templates', `${collectionName}.png`);
      if (!fs.existsSync(framePath)) {
        throw new Error('Premade frame photo not found');
      }

      console.log('[mergeWithFrame] got frame path:', framePath)

      // Read and manipulate images with Jimp
      const frameImage = await Jimp.read(framePath);
      const entryImage = await Jimp.read(photoPath);

      // Resize entry image if needed
      if (entryImage.bitmap.width !== frameImage.bitmap.width / 2 || entryImage.bitmap.height !== frameImage.bitmap.height) {
        entryImage.resize(frameImage.bitmap.width / 2, frameImage.bitmap.height);
      }

      // Composite entry image onto frame
      frameImage.composite(entryImage, 0, 0);

      // Save the merged image
      const mergedImagePath = path.join(strapi.config.server.dirs.public, 'embeds', collectionName, `${entryId}.png`);
      await frameImage.writeAsync(mergedImagePath);

      // Construct absolute URL to the merged image
      const publicUrl = `${strapi.config.server.url}/public/embeds/${collectionName}/${entryId}.png`;

      return publicUrl;
    } catch (error) {
      // Handle errors
      console.error(error);
      throw new Error('Failed to merge photo with frame');
    }
  },

  getExistingImagePath(entryId, collectionName) {
    const imagePath = path.join(strapi.config.server.dirs.public, 'embeds', collectionName, `${entryId}.png`);
    if (fs.existsSync(imagePath)) {
      return `${strapi.config.server.url}/public/embeds/${collectionName}/${entryId}.png`;
    }
    return null;
  },
});