const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const webpConverter = require('webp-converter');
webpConverter.grant_permission();

module.exports = ({ strapi }) => ({
  async mergeWithFrame(entryId, photoFieldName, collectionName, titleFieldName) {
    console.log('[mergeWithFrame] Service', entryId, photoFieldName, collectionName, titleFieldName)
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
        populate: [photoFieldName]
      });

      if (!entry) {
        throw new Error('Entry not found');
      }

      console.log('[mergeWithFrame] found entry:', entry)

      const entryTitle = entry[titleFieldName] || entry.name || entry.title

      // Retrieve photo path from the entry
      const photoPath = entry[photoFieldName] ? 'public' + entry[photoFieldName].url : null;
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

      console.log('[mergeWithFrame] reading images successful');

      // Convert WebP image to PNG format
      const photoExtension = path.extname(photoPath).toLowerCase();
      let photoPathConverted;
      if (photoExtension === '.webp') {
        const outputDir = path.join(strapi.config.server.dirs.public, 'temp');
        photoPathConverted = path.join(outputDir, `${entryId}.png`);
        await webpConverter.dwebp(photoPath, photoPathConverted, "-o", logging="-v");
      } else {
        photoPathConverted = photoPath;
      }

      // Check if the converted file exists
      if (!fs.existsSync(photoPathConverted)) {
        throw new Error(`Converted file does not exist ${photoPathConverted}`);
      }

      // Load the photo
      const entryImage = await Jimp.read(photoPathConverted);

      // Resize entry image if needed
      const resizedPhoto = entryImage.cover(600, 630, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_TOP);

      // Composite entry image onto frame
      frameImage.composite(resizedPhoto, 0, 0);

      // Split the title into two lines if it contains two words
      const titleParts = entryTitle.split(' ');
      const firstLine = titleParts[0];
      const secondLine = titleParts.slice(1).join(' ');

      const fontPath = path.join(strapi.config.server.dirs.public, 'fonts', 'FrankRuhlLibre-Regular.fnt');
      const font = await Jimp.loadFont(fontPath);

      // Add text on the right side
      const maxWidth = 600; // Width of the right side
      const lineHeight = Jimp.measureTextHeight(font, entryTitle, maxWidth);
      const textX = frameImage.bitmap.width - maxWidth; // Right side
      const textY = (frameImage.bitmap.height - lineHeight) / 2 - 35; // Adjust vertical alignment by subtracting 5 pixels

      // Print each part of the title on a separate line with the custom font
      frameImage.print(font, textX, textY, {
        text: firstLine,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      }, maxWidth);

      // Reduce the gap between lines by 15%
      const lineHeightAdjusted = lineHeight * 0.85;
      frameImage.print(font, textX, textY + lineHeightAdjusted, { // Offset by the adjusted line height for the second line
        text: secondLine,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
      }, maxWidth);

      // Save the merged image
      const mergedImagePath = path.join(strapi.config.server.dirs.public, 'embeds', collectionName, `${entryId}.png`);
      await frameImage.writeAsync(mergedImagePath);

      // Construct absolute URL to the merged image
      // const publicUrl = `${strapi.config.server.url}/embeds/${collectionName}/${entryId}.png`;

      return mergedImagePath;
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
      return imagePath;
    }
    return null;
  },
});