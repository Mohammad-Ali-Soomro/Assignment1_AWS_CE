class EventModel {
  static normalize(rawEvent) {
    const venue = rawEvent?._embedded?.venues?.[0];
    const chosenImage = EventModel.pickBestImage(rawEvent?.images || []);

    return {
      id: rawEvent?.id || null,
      title: rawEvent?.name || 'Untitled Event',
      date: rawEvent?.dates?.start?.localDate || rawEvent?.dates?.start?.dateTime || 'TBA',
      venue: venue?.name || 'Venue TBA',
      description: rawEvent?.info || rawEvent?.pleaseNote || 'No description available.',
      imageUrl: chosenImage?.url || null,
      sourceUrl: rawEvent?.url || null
    };
  }

  static pickBestImage(images) {
    if (!Array.isArray(images) || images.length === 0) {
      return null;
    }

    return [...images].sort((a, b) => {
      const scoreA = (a.width || 0) * (a.height || 0);
      const scoreB = (b.width || 0) * (b.height || 0);
      return scoreB - scoreA;
    })[0];
  }
}

module.exports = EventModel;
