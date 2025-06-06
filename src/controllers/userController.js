require('dotenv').config();
const { ObjectId } = require('mongodb');
const { connection } = require('../config/database');

// Lấy danh sách người dùng
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: 'Tham số page và limit phải là số nguyên dương'
            });
        }
        const skip = (page - 1) * limit;

        const db = await connection();
        const usersCollection = db.collection('users');

        const total = await usersCollection.countDocuments({});
        const pages = Math.ceil(total / limit);

        const cursor = usersCollection
            .find({}, { projection: { password: 0 } })
            .skip(skip)
            .limit(limit);

        const usersArray = await cursor.toArray();

        const users = usersArray.map(userDoc => ({
            _id: userDoc._id.toString(),
            email: userDoc.email,
            full_name: userDoc.full_name || '',
            phone: userDoc.phone || '',
            roles: Array.isArray(userDoc.roles)
                ? userDoc.roles.map(r => ({
                    role_id: r.role_id?.toString ? r.role_id.toString() : r.role_id,
                    role_name: r.role_name,
                    description: r.description
                }))
                : [],
            clubs: Array.isArray(userDoc.clubs)
                ? userDoc.clubs.map(c => ({
                    club_id: c.club_id?.toString ? c.club_id.toString() : c.club_id,
                    club_name: c.club_name,
                    role_in_club: c.role_in_club
                }))
                : [],
            created_at: userDoc.created_at
                ? userDoc.created_at.toISOString()
                : null,
            updated_at: userDoc.updated_at
                ? userDoc.updated_at.toISOString()
                : null
        }));

        return res.status(200).json({
            success: true,
            data: {
                users,
                pagination: {
                    page,
                    pages,
                    total
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getUsers:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Lấy thông tin chi tiết một user
const getUserById = async (req, res) => {
    try {
        const { id: userIdParam } = req.params;

        let userObjectId;
        try {
            userObjectId = new ObjectId(userIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'user_id không hợp lệ'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');

        const userDoc = await usersCollection.findOne(
            { _id: userObjectId },
            { projection: { password: 0 } }
        );

        if (!userDoc) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const userResponse = {
            _id: userDoc._id.toString(),
            email: userDoc.email,
            full_name: userDoc.full_name || '',
            phone: userDoc.phone || '',
            roles: Array.isArray(userDoc.roles)
                ? userDoc.roles.map(r => ({
                    role_id: r.role_id?.toString ? r.role_id.toString() : r.role_id,
                    role_name: r.role_name,
                    description: r.description
                }))
                : [],
            clubs: Array.isArray(userDoc.clubs)
                ? userDoc.clubs.map(c => ({
                    club_id: c.club_id?.toString ? c.club_id.toString() : c.club_id,
                    club_name: c.club_name,
                    role_in_club: c.role_in_club
                }))
                : [],
            created_at: userDoc.created_at ? userDoc.created_at.toISOString() : null,
            updated_at: userDoc.updated_at ? userDoc.updated_at.toISOString() : null
        };

        return res.status(200).json({
            success: true,
            data: { user: userResponse }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getUserById:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Cập nhật thông tin user
const updateUser = async (req, res) => {
    try {
        const { id: userIdParam } = req.params;
        const updateData = req.body;

        let userObjectId;
        try {
            userObjectId = new ObjectId(userIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'user_id không hợp lệ'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');

        const userDoc = await usersCollection.findOne({ _id: userObjectId });
        if (!userDoc) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Kiểm tra email trùng lặp nếu có thay đổi email
        if (updateData.email && updateData.email !== userDoc.email) {
            const existingUser = await usersCollection.findOne({
                email: updateData.email,
                _id: { $ne: userObjectId }
            });
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: 'Email đã được sử dụng bởi người dùng khác'
                });
            }
        }

        const now = new Date();
        const updateFields = {
            ...updateData,
            updated_at: now
        };

        // Không cho phép cập nhật password qua API này
        delete updateFields.password;

        await usersCollection.updateOne(
            { _id: userObjectId },
            { $set: updateFields }
        );

        const updatedUser = await usersCollection.findOne(
            { _id: userObjectId },
            { projection: { password: 0 } }
        );

        const userResponse = {
            _id: updatedUser._id.toString(),
            email: updatedUser.email,
            full_name: updatedUser.full_name || '',
            phone: updatedUser.phone || '',
            roles: Array.isArray(updatedUser.roles)
                ? updatedUser.roles.map(r => ({
                    role_id: r.role_id?.toString ? r.role_id.toString() : r.role_id,
                    role_name: r.role_name,
                    description: r.description
                }))
                : [],
            clubs: Array.isArray(updatedUser.clubs)
                ? updatedUser.clubs.map(c => ({
                    club_id: c.club_id?.toString ? c.club_id.toString() : c.club_id,
                    club_name: c.club_name,
                    role_in_club: c.role_in_club
                }))
                : [],
            updated_at: updatedUser.updated_at.toISOString()
        };

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin người dùng thành công',
            data: { user: userResponse }
        });
    } catch (err) {
        console.error('❌ Lỗi khi updateUser:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Xóa user
const deleteUser = async (req, res) => {
    try {
        const { id: userIdParam } = req.params;

        let userObjectId;
        try {
            userObjectId = new ObjectId(userIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'user_id không hợp lệ'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');
        const registrationsCollection = db.collection('registrations');
        const feedbacksCollection = db.collection('feedbacks');

        const userDoc = await usersCollection.findOne({ _id: userObjectId });
        if (!userDoc) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Xóa các dữ liệu liên quan
        await Promise.all([
            usersCollection.deleteOne({ _id: userObjectId }),
            registrationsCollection.deleteMany({ user_id: userObjectId }),
            feedbacksCollection.deleteMany({ user_id: userObjectId })
        ]);

        return res.status(200).json({
            success: true,
            message: 'Xóa người dùng thành công'
        });
    } catch (err) {
        console.error('❌ Lỗi khi deleteUser:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Cập nhật vai trò của user
const updateUserRole = async (req, res) => {
    try {
        const { id: userIdParam } = req.params;
        const { role_name, description } = req.body;

        if (!role_name) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu role_name'
            });
        }

        let userObjectId;
        try {
            userObjectId = new ObjectId(userIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'user_id không hợp lệ'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');

        const userDoc = await usersCollection.findOne({ _id: userObjectId });
        if (!userDoc) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        const newRole = {
            role_id: require('uuid').v4(),
            role_name,
            description: description || `Vai trò ${role_name}`
        };

        const now = new Date();
        await usersCollection.updateOne(
            { _id: userObjectId },
            {
                $set: {
                    roles: [newRole], // Thay thế role cũ
                    updated_at: now
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Cập nhật vai trò thành công',
            data: {
                role: newRole,
                updated_at: now.toISOString()
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi updateUserRole:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Lấy thông tin profile của user hiện tại
const getMyProfile = async (req, res) => {
    try {
        const user = req.user;

        const db = await connection();
        const usersCollection = db.collection('users');
        const registrationsCollection = db.collection('registrations');

        // Lấy thông tin user chi tiết
        const userDoc = await usersCollection.findOne(
            { _id: user._id },
            { projection: { password: 0 } }
        );

        if (!userDoc) {
            return res.status(404).json({
                success: false,
                message: 'Người dùng không tồn tại'
            });
        }

        // Lấy thống kê tham gia sự kiện
        const totalRegistrations = await registrationsCollection.countDocuments({ user_id: user._id });
        const totalAttended = await registrationsCollection.countDocuments({
            user_id: user._id,
            checked_in: true
        });

        const userResponse = {
            _id: userDoc._id.toString(),
            email: userDoc.email,
            full_name: userDoc.full_name || '',
            phone: userDoc.phone || '',
            roles: Array.isArray(userDoc.roles)
                ? userDoc.roles.map(r => ({
                    role_id: r.role_id?.toString ? r.role_id.toString() : r.role_id,
                    role_name: r.role_name,
                    description: r.description
                }))
                : [],
            clubs: Array.isArray(userDoc.clubs)
                ? userDoc.clubs.map(c => ({
                    club_id: c.club_id?.toString ? c.club_id.toString() : c.club_id,
                    club_name: c.club_name,
                    role_in_club: c.role_in_club
                }))
                : [],
            statistics: {
                total_events_registered: totalRegistrations,
                total_events_attended: totalAttended,
                attendance_rate: totalRegistrations > 0
                    ? ((totalAttended / totalRegistrations) * 100).toFixed(2) + '%'
                    : '0%'
            },
            created_at: userDoc.created_at ? userDoc.created_at.toISOString() : null,
            updated_at: userDoc.updated_at ? userDoc.updated_at.toISOString() : null
        };

        return res.status(200).json({
            success: true,
            data: { user: userResponse }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getMyProfile:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserRole,
    getMyProfile
}; 