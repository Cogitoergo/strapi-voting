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

      // Load images
      const frameImage = sharp(framePath);
      const entryImage = sharp(photoPath);

      // Merge images
      const mergedImage = await sharp({
        create: {
          width: 1200, // Adjust the width and height according to your requirements
          height: 630,
          channels: 4, // RGBA
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
        }
      })
      .composite([
        { input: await frameImage.toBuffer(), gravity: 'northwest' },
        { input: await entryImage.resize({ width: 600 }).toBuffer(), gravity: 'northwest' }
      ])
      .toFormat('png')
      .toFile(path.join(strapi.config.paths.public, 'embeds', collectionName, `${entryId}.png`));

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