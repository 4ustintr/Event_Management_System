const express = require('express');
const router = express.Router();
const {
    getEvents,
    getEventDetails,
    createEvent,
    updateEvent,
    deleteEvent,
    approveEvent,
    registerForEvent,
    checkinEvent,
    submitFeedback,
    getMyEventHistory
} = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');

// Event management routes
router.get('/', auth, getEvents);
router.post('/', auth, authorize("admin"), createEvent);
router.get('/my-history', auth, getMyEventHistory);
router.get('/:id', auth, getEventDetails);
router.put('/:id', auth, authorize("admin"), updateEvent);
router.delete('/:id', auth, authorize("admin"), deleteEvent);

// Event approval
router.post('/:id/approve', auth, authorize("admin"), approveEvent);

// Event participation
router.post('/:id/register', auth, registerForEvent);
router.post('/checkin', auth, checkinEvent);
router.post('/:id/feedback', auth, submitFeedback);

module.exports = router; 