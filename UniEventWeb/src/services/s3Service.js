const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

class S3Service {
  constructor(config) {
    this.config = config;
    this.client = new S3Client({
      region: config.region
    });
  }

  buildObjectKey({ eventDate, title, extension }) {
    const safeTitle = (title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const hash = crypto.randomBytes(6).toString('hex');
    const datePart = String(eventDate || 'undated').replace(/[^0-9-]/g, '');

    return `${this.config.eventsPrefix}/${datePart}/${safeTitle}-${hash}${extension}`;
  }

  getExtensionFromContentType(contentType) {
    const normalized = String(contentType || '').toLowerCase();

    if (normalized.includes('jpeg') || normalized.includes('jpg')) return '.jpg';
    if (normalized.includes('png')) return '.png';
    if (normalized.includes('webp')) return '.webp';
    if (normalized.includes('gif')) return '.gif';

    return '.bin';
  }

  async uploadImageBuffer({ buffer, contentType, title, eventDate }) {
    const extension = this.getExtensionFromContentType(contentType);
    const key = this.buildObjectKey({ eventDate, title, extension });

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.s3BucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType
      })
    );

    return {
      bucket: this.config.s3BucketName,
      key,
      url: `https://${this.config.s3BucketName}.s3.${this.config.region}.amazonaws.com/${key}`
    };
  }

  async generateReadSignedUrl({ key, expiresInSeconds }) {
    const command = new GetObjectCommand({
      Bucket: this.config.s3BucketName,
      Key: key
    });

    return getSignedUrl(this.client, command, {
      expiresIn: Number(expiresInSeconds || this.config.signedUrlExpiresSeconds || 900)
    });
  }
}

module.exports = S3Service;
