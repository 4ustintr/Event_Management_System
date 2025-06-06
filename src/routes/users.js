const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserRole,
    getMyProfile
} = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

// User management routes
router.get('/', auth, authorize("admin"), getUsers);
router.get('/profile', auth, getMyProfile);
router.get('/:id', auth, authorize("admin"), getUserById);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, authorize("admin"), deleteUser);
router.put('/:id/role', auth, authorize("admin"), updateUserRole);

module.exports = router; 