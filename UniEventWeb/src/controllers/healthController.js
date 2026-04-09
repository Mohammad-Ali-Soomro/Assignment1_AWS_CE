function healthCheck(_req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'unievent',
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  healthCheck
};
