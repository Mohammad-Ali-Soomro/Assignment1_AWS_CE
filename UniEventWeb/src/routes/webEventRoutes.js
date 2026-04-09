const express = require('express');
const { renderUniversityEvents } = require('../controllers/eventController');

const router = express.Router();

router.get('/', renderUniversityEvents);

module.exports = router;
