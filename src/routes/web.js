const express = require('express');
const router = express.Router();

// Import từ các controller chuyên biệt
const { register, login } = require('../controllers/authController');
const { getClubs, createClub } = require('../controllers/clubController');
const { getEvents, createEvent, registerForEvent, submitFeedback } = require('../controllers/eventController');
const { createNotification } = require('../controllers/notificationController');
const { getUsers } = require('../controllers/userController');

const { auth, authorize } = require('../middleware/auth');

router.post('/auth/register', register);
router.post('/auth/login', login);

router.get('/clubs', auth, getClubs);
router.post('/clubs', auth, authorize("admin"), createClub);

router.get('/events', auth, getEvents);
router.post('/events', auth, authorize("admin"), createEvent);
router.post('/events/:id/register', auth, registerForEvent);
router.post('/events/:id/feedback', auth, submitFeedback);

router.post('/notifications', auth, authorize("admin"), createNotification);

router.get('/users', auth, authorize("admin"), getUsers);

module.exports = router;
