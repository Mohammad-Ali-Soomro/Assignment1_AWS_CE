const env = require('../config/env');

let timerReference;

function startOptionalEventScheduler({ logger, onTick }) {
  if (!env.scheduler.enabled) {
    return;
  }

  const intervalMs = env.scheduler.intervalMinutes * 60 * 1000;

  logger.info(`Event scheduler enabled. Interval: ${env.scheduler.intervalMinutes} minute(s).`);

  const run = async () => {
    try {
      await onTick();
      logger.info('Background event sync completed successfully.');
    } catch (error) {
      logger.error('Background event sync failed:', error.message);
    }
  };

  run();
  timerReference = setInterval(run, intervalMs);
}

function stopScheduler() {
  if (timerReference) {
    clearInterval(timerReference);
    timerReference = undefined;
  }
}

module.exports = {
  startOptionalEventScheduler,
  stopScheduler
};
