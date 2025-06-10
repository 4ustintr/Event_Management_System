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
router.get('/', auth, getUsers);
router.get('/profile', auth, getMyProfile);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, updateUser);
router.delete('/:id', auth, deleteUser);
router.put('/:id/role', auth, updateUserRole);

module.exports = router; 