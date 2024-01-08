'use strict';

const { registerCronTasks } = require('./config/cron-tasks');

module.exports = ({ strapi }) => {
	registerCronTasks({ strapi });
	strapi.db.lifecycles.subscribe({
    models: ['api::svietimo-kodas-registracija.svietimo-kodas-registracija'],
    async afterCreate(event) {
			const { result, params } = event;
			console.log('BEFORE CREATE SVIETIMO KODAS', result, params);
			strapi.service('plugin::voting.voting').sendConfirmationEmail(result.email);
    },
  });
};
