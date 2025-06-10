const express = require("express");
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
  getMyEventHistory,
  getAllFeedbacks,
  deleteFeedback,
} = require("../controllers/eventController");
const {
  sendEventNotification,
} = require("../controllers/notificationController");
const { auth, authorize } = require("../middleware/auth");
const uploader = require("../config/cloudinary");

// Event management routes
router.get("/", getEvents);
router.post("/", auth, uploader.single("banner"), createEvent);
router.get("/my-history", auth, getMyEventHistory);
router.get("/:id", getEventDetails);
router.put("/:id", auth, uploader.single("banner"), updateEvent);
router.delete("/:id", auth, deleteEvent);

// Event approval
router.post("/:id/approve", auth, approveEvent);

// Event participation
router.post("/:id/register", auth, registerForEvent);
router.post("/checkin", auth, checkinEvent);
router.post("/:id/feedback", auth, submitFeedback);

// Event notification
router.post("/:id/notifications", auth, sendEventNotification);

// Feedback management routes - must be before /:id routes to avoid conflicts
router.get("/feedbacks/all", auth, getAllFeedbacks);
router.delete("/feedbacks/:id", auth, deleteFeedback);

module.exports = router;
