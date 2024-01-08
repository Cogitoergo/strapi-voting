'use strict';

const { registerCronTasks } = require('./config/cron-tasks');

module.exports = ({ strapi }) => {
	registerCronTasks({ strapi });
	strapi.db.lifecycles.subscribe({
    models: ['api::svietimo-kodas-registracija.svietimo-kodas-registracija'],
    async afterCreate(event) {
			const { result } = event;
			console.log('BEFORE CREATE SVIETIMO KODAS', result);
			await strapi.service('plugin::voting.voting').sendConfirmationEmail(result.email, 'api::svietimo-kodas-registracija.svietimo-kodas-registracija', result.id, 'Švietimo Kodas 2024');
    },
  });
};
