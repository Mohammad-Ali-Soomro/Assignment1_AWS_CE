const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const required = ['TICKETMASTER_API_KEY', 'AWS_REGION', 'S3_BUCKET_NAME'];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  ticketmaster: {
    apiKey: process.env.TICKETMASTER_API_KEY,
    baseUrl: process.env.TICKETMASTER_BASE_URL || 'https://app.ticketmaster.com/discovery/v2',
    countryCode: process.env.TICKETMASTER_COUNTRY_CODE || 'US',
    classificationName: process.env.TICKETMASTER_CLASSIFICATION_NAME || 'Music',
    size: Number(process.env.TICKETMASTER_SIZE || 20)
  },
  aws: {
    region: process.env.AWS_REGION,
    s3BucketName: process.env.S3_BUCKET_NAME,
    eventsPrefix: process.env.S3_EVENTS_PREFIX || 'unievent/events',
    signedUrlExpiresSeconds: Number(process.env.S3_SIGNED_URL_EXPIRES_SECONDS || 900)
  },
  scheduler: {
    enabled: process.env.ENABLE_EVENT_SYNC_SCHEDULER === 'true',
    intervalMinutes: Number(process.env.EVENT_SYNC_INTERVAL_MINUTES || 30)
  }
};
