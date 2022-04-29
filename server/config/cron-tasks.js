module.exports = {
	registerCronTasks: ({ strapi }) => {
		strapi.cron.add({
			'*/1 * * * *': async ({ strapi }) => {
        try {
          console.log('[VOTING CRON] Trying to clean votes..')
          await strapi.db.query('plugin::voting.votelog').updateMany({
            publicationState: 'live',
            data: {
              publishedAt: null
            }
          });
          console.log('[VOTING CRON] Votes cleared..')
        } catch (e) {
          console.log('[VOTING CRON] Error', e)
        }
			},
		}, {
      timezone: 'Europe/Vilnius'
    });
	},
};