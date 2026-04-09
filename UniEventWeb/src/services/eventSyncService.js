const { downloadImageAsBuffer } = require('../utils/httpDownload');

class EventSyncService {
  constructor({ ticketmasterService, s3Service }) {
    this.ticketmasterService = ticketmasterService;
    this.s3Service = s3Service;
  }

  async syncUniversityEvents({ uploadImages = true } = {}) {
    const events = await this.ticketmasterService.fetchEvents();

    const transformedEvents = [];
    const uploadErrors = [];

    for (const event of events) {
      let s3ImageUrl = null;
      let s3ImageKey = null;

      if (uploadImages && event.imageUrl) {
        try {
          const downloaded = await downloadImageAsBuffer(event.imageUrl);
          const uploaded = await this.s3Service.uploadImageBuffer({
            buffer: downloaded.data,
            contentType: downloaded.contentType,
            title: event.title,
            eventDate: event.date
          });
          s3ImageUrl = uploaded.url;
          s3ImageKey = uploaded.key;
        } catch (error) {
          uploadErrors.push({
            eventId: event.id,
            title: event.title,
            message: error.message
          });
        }
      }

      transformedEvents.push({
        ...event,
        s3ImageUrl,
        s3ImageKey,
        displayImageUrl: s3ImageUrl || event.imageUrl
      });
    }

    return {
      syncedAt: new Date().toISOString(),
      total: transformedEvents.length,
      uploadFailures: uploadErrors.length,
      uploadErrors,
      events: transformedEvents
    };
  }
}

module.exports = EventSyncService;
