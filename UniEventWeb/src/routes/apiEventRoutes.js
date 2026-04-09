const express = require('express');
const { getUniversityEvents, syncUniversityEvents } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getUniversityEvents);
router.post('/sync', syncUniversityEvents);

module.exports = router;
