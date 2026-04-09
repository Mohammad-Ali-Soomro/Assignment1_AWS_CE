async function renderUniversityEvents(req, res, next) {
  try {
    const result = await req.app.locals.eventSyncService.syncUniversityEvents({ uploadImages: true });
    const s3Service = req.app.locals.eventSyncService.s3Service;

    const eventsWithSignedUrls = await Promise.all(
      result.events.map(async (event) => {
        if (!event.s3ImageKey) {
          return {
            ...event,
            signedImageUrl: null
          };
        }

        try {
          const signedImageUrl = await s3Service.generateReadSignedUrl({ key: event.s3ImageKey });
          return {
            ...event,
            signedImageUrl
          };
        } catch (_error) {
          return {
            ...event,
            signedImageUrl: null
          };
        }
      })
    );

    res.status(200).render('events', {
      title: 'University Events',
      events: eventsWithSignedUrls,
      summary: {
        syncedAt: result.syncedAt,
        total: result.total,
        uploadFailures: result.uploadFailures
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getUniversityEvents(req, res, next) {
  try {
    const result = await req.app.locals.eventSyncService.syncUniversityEvents({ uploadImages: true });
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function syncUniversityEvents(req, res, next) {
  try {
    const result = await req.app.locals.eventSyncService.syncUniversityEvents({ uploadImages: true });
    res.status(200).json({
      message: 'Event sync completed.',
      ...result
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  renderUniversityEvents,
  getUniversityEvents,
  syncUniversityEvents
};
