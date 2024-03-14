const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

module.exports = ({ strapi }) => ({
  async mergeWithFrame(entryId, photoFieldName, collectionName) {
    try {
      // Check if the image already exists
      const existingImagePath = this.getExistingImagePath(entryId, collectionName);
      if (existingImagePath) {
        return existingImagePath;
      }

      // Fetch the entry by ID
      const entry = await strapi.query(collectionName).findOne({ id: entryId });
      if (!entry) {
        throw new Error('Entry not found');
      }

      // Retrieve photo path from the entry
      const photoPath = entry[photoFieldName];
      if (!photoPath) {
        throw new Error('Photo path not found in the entry');
      }

      // Load premade photo frame from embed_templates
      const framePath = path.join(strapi.config.paths.public, 'embed_templates', `${collectionName}.png`);
      if (!fs.existsSync(framePath)) {
        throw new Error('Premade frame photo not found');
      }
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');
      const frame = await loadImage(framePath);
      ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);

      // Load entry photo and merge with frame
      const entryPhoto = await loadImage(photoPath);
      ctx.drawImage(entryPhoto, 0, 0, canvas.width / 2, canvas.height);

      // Save the merged image
      const mergedImagePath = path.join(strapi.config.paths.public, 'embeds', collectionName, `${entryId}.png`);
      const mergedImageBuffer = canvas.toBuffer();
      fs.writeFileSync(mergedImagePath, mergedImageBuffer);

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
    const imagePath = path.join(strapi.config.paths.public, 'embeds', collectionName, `${entryId}.png`);
    if (fs.existsSync(imagePath)) {
      return `${strapi.config.server.url}/public/embeds/${collectionName}/${entryId}.png`;
    }
    return null;
  },
});