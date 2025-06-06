const express = require('express');
const router = express.Router();
const {
    getEventStatistics,
    getUserParticipationStats,
    generateReport
} = require('../controllers/statisticsController');
const { auth, authorize } = require('../middleware/auth');

// Statistics routes
router.get('/events', auth, authorize("admin"), getEventStatistics);
router.get('/users', auth, authorize("admin"), getUserParticipationStats);
router.get('/report', auth, authorize("admin"), generateReport);

module.exports = router; 