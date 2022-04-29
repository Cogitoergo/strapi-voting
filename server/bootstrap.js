'use strict';

const { registerCronTasks } = require('./config/cron-tasks');
const { fingerprint } = require('./middlewares');

module.exports = ({ strapi }) => {
	fingerprint();
	registerCronTasks({ strapi });
};
