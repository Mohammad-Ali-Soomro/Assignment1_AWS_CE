const axios = require('axios');

async function downloadImageAsBuffer(url) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 15000
  });

  return {
    contentType: response.headers['content-type'] || 'application/octet-stream',
    data: Buffer.from(response.data)
  };
}

module.exports = {
  downloadImageAsBuffer
};
