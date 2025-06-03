const express = require('express');
const router = express.Router();
const {
    register, login, getClubs, createClub,
    getEvents, createEvent, registerForEvent, submitFeedback,
    createNotification, getUsers
} = require('../controllers/homeController');

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
