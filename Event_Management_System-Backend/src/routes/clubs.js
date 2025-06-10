const express = require("express");
const router = express.Router();
const {
  createClub,
  getClubs,
  getClubById,
  updateClub,
  deleteClub,
  addClubMember,
  removeClubMember,
  updateMemberRole,
  getClubEvents,
} = require("../controllers/clubController");
const { auth, authorize } = require("../middleware/auth");

// Club management routes
router.post("/", auth, createClub);
router.get("/", auth, getClubs);
router.get("/:id", auth, getClubById);
router.put("/:id", auth, updateClub);
router.delete("/:id", auth, deleteClub);

// Member management
router.post("/members", auth, addClubMember);
router.delete("/members", auth, removeClubMember);
router.put("/members/role", auth, updateMemberRole);

// Club events
router.get("/:id/events", auth, getClubEvents);

module.exports = router;
