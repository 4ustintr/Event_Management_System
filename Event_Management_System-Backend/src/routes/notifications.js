const express = require("express");
const router = express.Router();
const {
  createNotification,
  getNotifications,
  sendEventNotification,
  getMyNotifications,
  deleteNotification,
  sendEventReminder,
  getAllNotificationsForStudents,
} = require("../controllers/notificationController");
const { auth, authorize } = require("../middleware/auth");

// Notification management routes
router.post("/", auth, createNotification);
router.get("/", auth, getNotifications);
router.delete("/:id", auth, deleteNotification);

// Send notifications
router.post("/send-event", auth, sendEventNotification);
router.post("/reminder", auth, sendEventReminder);

// User notifications
router.get("/my-notifications", auth, getMyNotifications);
router.get("/student-notifications", auth, getAllNotificationsForStudents);

module.exports = router;
