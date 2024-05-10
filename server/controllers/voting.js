const {
  getPluginService,
  parseParams,
  throwError,
} = require('../utils/functions');

const utils = require("@strapi/utils");
const { sanitize } = utils;

module.exports = {
  getService(name = 'voting') {
    return getPluginService(name)
  },
  getContentTypes(ctx) {
    ctx.body = this.getService()
      .fetchContentTypes();
  },
  getContentTypesFields(ctx) {
    const { model } = ctx.params
    ctx.body = this.getService()
      .fetchContentTypesFields(model)
  },
  sanitizeData (data, id, ctx) {
    const schema = strapi.getModel(id);
    const { auth } = ctx.state;
    return sanitize.contentAPI.output(data, schema, { auth });
  },
  async getCollection(ctx) {
    const { id } = ctx.params;
  
    console.log('ID:', id);
  
    const entries = await this.getService().getCollection(id)
  
    console.log('Entries before sanitization:', entries);
  
    ctx.body = await this.sanitizeData(entries, id, ctx)
  
    console.log('Response:', ctx.body);
  },
  async vote(ctx) {
    const { request, params = {}, state = {} } = ctx;
    const { relation } = parseParams(params);
    const { user } = state;
    const { body = {} } = request;
    const { fingerprint } = ctx.req

    console.log('[CONTROLLERS] Strapi-Voting: vote', relation)
    try {
      const entity = await this.getService().vote(relation, body, user, fingerprint);
      if (entity) {
        return entity;
      }
    } catch (e) {
      throwError(ctx, e);
    }
  },
  async confirmEmail (ctx) {
    const { confirmationToken, collectionName } = ctx.params
    try {
      const confirmedEntry = await this.getService().confirmEmail(confirmationToken, collectionName)
      if (confirmedEntry) {
        if (collectionName === 'api::svietimo-kodas-registracija.svietimo-kodas-registracija') {
          ctx.redirect('https://projektas.lrytas.lt/svietimo-kodas-2024/registracija/patvirtinimas');
        } else {
          ctx.redirect('https://projektas.lrytas.lt/svietimo-kodas-2024/registracija/el-pasto-patvirtinimas');
        }
      }
    } catch (e) { 
      throwError(ctx, e);
    }
  },
  async makePhotos () {
    const maker = async (templateImagePath, name, profileImagePath, outputPath) => {
      try {
          // Load the template image
          const templateImage = await loadImage(templateImagePath);
  
          console.log(templateImage)
  
          // Load the profile image
          const profileImage = await loadImage(profileImagePath);
  
          console.log(profileImage)
  
          // Create a canvas based on the template image dimensions
          const canvas = createCanvas(templateImage.width, templateImage.height);
          const ctx = canvas.getContext('2d');
  
          // Draw the template image onto the canvas
          ctx.drawImage(templateImage, 0, 0);
  
          // Draw the profile picture as a circle
          const radius = 75; // Radius of the circle
          const centerX = (canvas.width / 2) - 75; // X-coordinate of the center of the circle
          const centerY = 210; // Y-coordinate of the center of the circle
  
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX + radius, centerY + radius, radius, 0, Math.PI * 2, true);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(profileImage, centerX, centerY, radius * 2, radius * 2);
          ctx.restore();
  
          ctx.font = '52px Arial';
          ctx.fillStyle = '#000';
          ctx.textAlign = 'left';
          // Calculate the text width with the specified font
          const textWidth = ctx.measureText(name).width;
          // Calculate the x-coordinate for horizontally centering the text
          // const textX = (canvas.width - textWidth) / 2;
          const textX = (canvas.width / 2) - (textWidth / 2)
          // Render the text at the calculated x-coordinate
          ctx.fillText(name, textX, 440);
  
          ctx.font = '22px Arial';
          ctx.fillStyle = '#2267FF';
          ctx.textAlign = 'left';
          // Calculate the text width with the specified font
          const textWidthOccupation = ctx.measureText(occupation).width;
          // Calculate the x-coordinate for horizontally centering the text
          // const textX = (canvas.width - textWidth) / 2;
          const textXOccupation = (canvas.width / 2) - (textWidthOccupation / 2)
          // Render the text at the calculated x-coordinate
          ctx.fillText(occupation, textXOccupation, 475);
  
          // Convert canvas to a buffer
          const buffer = canvas.toBuffer();
  
          // Save the modified image to the output path
          await sharp(buffer).toFile(outputPath);
  
          console.log('Image processing complete!');
      } catch (error) {
          console.error('Error processing image:', error);
      }
    }
    const templateImagePath = 'template.png';
    const name = 'Daiva Žalgevičienė';
    const occupation = 'Slaugos administratorė, Šilutės PSPC';
    const profileImagePath = 'profile.jpg';
    const outputPath = `output/${name}.jpg`;
    maker(templateImagePath, name, profileImagePath, outputPath);
  }
}