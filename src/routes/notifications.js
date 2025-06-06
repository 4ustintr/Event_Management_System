const express = require('express');
const router = express.Router();
const {
    createNotification,
    getNotifications,
    sendEventNotification,
    getMyNotifications,
    deleteNotification,
    sendEventReminder
} = require('../controllers/notificationController');
const { auth, authorize } = require('../middleware/auth');

// Notification management routes
router.post('/', auth, authorize("admin"), createNotification);
router.get('/', auth, authorize("admin"), getNotifications);
router.delete('/:id', auth, authorize("admin"), deleteNotification);

// Send notifications
router.post('/send-event', auth, authorize("admin"), sendEventNotification);
router.post('/reminder', auth, authorize("admin"), sendEventReminder);

// User notifications
router.get('/my-notifications', auth, getMyNotifications);

module.exports = router; 