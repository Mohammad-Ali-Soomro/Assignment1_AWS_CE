const axios = require('axios');
const EventModel = require('../models/eventModel');

class TicketmasterService {
  constructor(config) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: 15000
    });
  }

  async fetchEvents(options = {}) {
    const response = await this.http.get('/events.json', {
      params: {
        apikey: this.config.apiKey,
        countryCode: options.countryCode || this.config.countryCode,
        classificationName: options.classificationName || this.config.classificationName,
        size: options.size || this.config.size,
        sort: options.sort || 'date,asc'
      }
    });

    const rawEvents = response.data?._embedded?.events || [];
    return rawEvents.map((event) => EventModel.normalize(event));
  }
}

module.exports = TicketmasterService;
