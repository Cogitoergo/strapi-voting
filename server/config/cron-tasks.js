module.exports = {
	registerCronTasks: ({ strapi }) => {
		strapi.cron.add({
			'0 0 0 * * *': async ({ strapi }) => {
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
      scheduled: true,
      timezone: "Europe/Vilnius"
    });
	},
};