const app = require('./app');
const env = require('./config/env');
const { startOptionalEventScheduler } = require('./services/schedulerService');

app.listen(env.port, () => {
  console.log(`UniEvent server running on port ${env.port}`);

  startOptionalEventScheduler({
    logger: console,
    onTick: () => app.locals.eventSyncService.syncUniversityEvents({ uploadImages: true })
  });
});
