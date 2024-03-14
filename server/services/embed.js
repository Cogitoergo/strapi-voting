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

      const entryTitle = entry.name || entry.title || 'Vardenis Pavardenis'

      // Retrieve photo path from the entry
      const photoPath = 'public' + entry[photoFieldName].url;
      if (!photoPath) {
        throw new Error('Photo path not found in the entry');
      }

      console.log('[mergeWithFrame] found photo path:', photoPath);

      // Load premade photo frame from embed_templates
      const framePath = path.join(strapi.config.server.dirs.public, 'embed_templates', `${collectionName}.png`);
      if (!fs.existsSync(framePath)) {
        throw new Error('Premade frame photo not found');
      }

      console.log('[mergeWithFrame] got frame path:', framePath);

      // Read and manipulate images with Jimp
      const frameImage = await Jimp.read(framePath);
      const entryImage = await Jimp.read(photoPath);

      console.log('[mergeWithFrame] reading images successful');

      // Resize entry image if needed
      const resizedPhoto = entryImage.cover(600, 630, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_TOP);

      // Composite entry image onto frame
      frameImage.composite(resizedPhoto, 0, 0);

      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      const maxWidth = 600; // Width of the right side
      const lineHeight = Jimp.measureTextHeight(font, entryTitle, maxWidth);
      const textX = frameImage.bitmap.width - maxWidth; // Right side
      const textY = (frameImage.bitmap.height - lineHeight) / 2; // Center vertically
      frameImage.print(font, textX, textY, {
        text: entryTitle,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      }, maxWidth);

      // Save the merged image
      const mergedImagePath = path.join(strapi.config.server.dirs.public, 'embeds', collectionName, `${entryId}.png`);
      await frameImage.writeAsync(mergedImagePath);

      // Construct absolute URL to the merged image
      const publicUrl = `${strapi.config.server.url}/embeds/${collectionName}/${entryId}.png`;

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
      console.log('PATH EXISTS', imagePath)
      return `${strapi.config.server.url}/embeds/${collectionName}/${entryId}.png`;
    }
    return null;
  },
});