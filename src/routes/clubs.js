const express = require('express');
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
    getClubEvents
} = require('../controllers/clubController');
const { auth, authorize } = require('../middleware/auth');

// Club management routes
router.post('/', auth, authorize("admin"), createClub);
router.get('/', auth, getClubs);
router.get('/:id', auth, getClubById);
router.put('/:id', auth, authorize("admin"), updateClub);
router.delete('/:id', auth, authorize("admin"), deleteClub);

// Member management
router.post('/members', auth, authorize("admin"), addClubMember);
router.delete('/members', auth, authorize("admin"), removeClubMember);
router.put('/members/role', auth, authorize("admin"), updateMemberRole);

// Club events
router.get('/:id/events', auth, getClubEvents);

module.exports = router; 