require('dotenv').config();
const { ObjectId } = require('mongodb');
const { connection } = require('../config/database');

// Tạo thông báo mới
const createNotification = async (req, res) => {
    try {
        const { event_id, title, message, type, recipients } = req.body;

        if (!event_id || !title || !message || !type) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu event_id, title, message hoặc type'
            });
        }

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(event_id);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id không hợp lệ'
            });
        }

        const db = await connection();
        const notificationsCollection = db.collection('notifications');

        const now = new Date();
        const newNotification = {
            event_id: eventObjectId,
            title,
            message,
            type,
            recipients: Array.isArray(recipients) ? recipients : [],
            sent_at: now,
            sent: true
        };

        await notificationsCollection.insertOne(newNotification);

        const notificationResponse = {
            title: newNotification.title,
            message: newNotification.message,
            type: newNotification.type,
            sent_at: newNotification.sent_at.toISOString(),
            sent: newNotification.sent
        };

        return res.status(201).json({
            success: true,
            message: 'Tạo thông báo thành công',
            data: {
                notification: notificationResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi createNotification:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Lấy danh sách thông báo
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { event_id, type } = req.query;

        if (page < 1 || limit < 1) {
            return res.status(400).json({
                success: false,
                message: 'Tham số page và limit phải là số nguyên dương'
            });
        }
        const skip = (page - 1) * limit;

        const db = await connection();
        const notificationsCollection = db.collection('notifications');

        let filter = {};
        if (event_id) {
            try {
                filter.event_id = new ObjectId(event_id);
            } catch (err) {
                return res.status(400).json({
                    success: false,
                    message: 'event_id không hợp lệ'
                });
            }
        }
        if (type) {
            filter.type = type;
        }

        const total = await notificationsCollection.countDocuments(filter);
        const pages = Math.ceil(total / limit);

        const notifications = await notificationsCollection
            .find(filter)
            .sort({ sent_at: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const notificationsResponse = notifications.map(notif => ({
            _id: notif._id.toString(),
            event_id: notif.event_id.toString(),
            title: notif.title,
            message: notif.message,
            type: notif.type,
            recipients: notif.recipients || [],
            sent_at: notif.sent_at.toISOString(),
            sent: notif.sent
        }));

        return res.status(200).json({
            success: true,
            data: {
                notifications: notificationsResponse,
                pagination: {
                    page,
                    pages,
                    total
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getNotifications:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Gửi thông báo cho người đăng ký sự kiện
const sendEventNotification = async (req, res) => {
    try {
        const { event_id, title, message, type } = req.body;

        if (!event_id || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu event_id, title hoặc message'
            });
        }

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(event_id);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id không hợp lệ'
            });
        }

        const db = await connection();
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');
        const notificationsCollection = db.collection('notifications');
        const usersCollection = db.collection('users');

        // Kiểm tra sự kiện tồn tại
        const event = await eventsCollection.findOne({ _id: eventObjectId });
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        // Lấy danh sách người đăng ký
        const registrations = await registrationsCollection
            .find({ event_id: eventObjectId })
            .toArray();

        if (registrations.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không có người đăng ký nào cho sự kiện này'
            });
        }

        // Lấy thông tin người dùng
        const userIds = registrations.map(r => r.user_id);
        const users = await usersCollection
            .find({ _id: { $in: userIds } })
            .toArray();

        const recipients = users.map(user => ({
            user_id: user._id.toString(),
            email: user.email,
            full_name: user.full_name
        }));

        const now = new Date();
        const newNotification = {
            event_id: eventObjectId,
            title,
            message,
            type: type || 'event_update',
            recipients,
            sent_at: now,
            sent: true
        };

        await notificationsCollection.insertOne(newNotification);

        return res.status(200).json({
            success: true,
            message: `Đã gửi thông báo cho ${recipients.length} người đăng ký`,
            data: {
                notification: {
                    title: newNotification.title,
                    message: newNotification.message,
                    type: newNotification.type,
                    total_recipients: recipients.length,
                    sent_at: newNotification.sent_at.toISOString()
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi sendEventNotification:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Lấy thông báo của user hiện tại
const getMyNotifications = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const db = await connection();
        const notificationsCollection = db.collection('notifications');
        const registrationsCollection = db.collection('registrations');

        // Lấy các sự kiện mà user đã đăng ký
        const userRegistrations = await registrationsCollection
            .find({ user_id: user._id })
            .toArray();

        const eventIds = userRegistrations.map(r => r.event_id);

        if (eventIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    notifications: [],
                    pagination: {
                        page,
                        pages: 0,
                        total: 0
                    }
                }
            });
        }

        const total = await notificationsCollection.countDocuments({
            event_id: { $in: eventIds }
        });
        const pages = Math.ceil(total / limit);

        const notifications = await notificationsCollection
            .find({ event_id: { $in: eventIds } })
            .sort({ sent_at: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const notificationsResponse = notifications.map(notif => ({
            _id: notif._id.toString(),
            event_id: notif.event_id.toString(),
            title: notif.title,
            message: notif.message,
            type: notif.type,
            sent_at: notif.sent_at.toISOString()
        }));

        return res.status(200).json({
            success: true,
            data: {
                notifications: notificationsResponse,
                pagination: {
                    page,
                    pages,
                    total
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getMyNotifications:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Xóa thông báo
const deleteNotification = async (req, res) => {
    try {
        const { id: notificationIdParam } = req.params;

        let notificationObjectId;
        try {
            notificationObjectId = new ObjectId(notificationIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'notification_id không hợp lệ'
            });
        }

        const db = await connection();
        const notificationsCollection = db.collection('notifications');

        const notification = await notificationsCollection.findOne({ _id: notificationObjectId });
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Thông báo không tồn tại'
            });
        }

        await notificationsCollection.deleteOne({ _id: notificationObjectId });

        return res.status(200).json({
            success: true,
            message: 'Xóa thông báo thành công'
        });
    } catch (err) {
        console.error('❌ Lỗi khi deleteNotification:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Gửi thông báo nhắc nhở trước sự kiện
const sendEventReminder = async (req, res) => {
    try {
        const { hours_before } = req.body; // Số giờ trước sự kiện để gửi nhắc nhở
        const hoursBefore = parseInt(hours_before) || 24; // Mặc định 24 giờ

        const db = await connection();
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');
        const notificationsCollection = db.collection('notifications');
        const usersCollection = db.collection('users');

        // Tìm các sự kiện sắp diễn ra trong khoảng thời gian chỉ định
        const now = new Date();
        const reminderTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);

        const upcomingEvents = await eventsCollection.find({
            start_time: {
                $gte: now,
                $lte: reminderTime
            },
            status: 'approved'
        }).toArray();

        if (upcomingEvents.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Không có sự kiện nào cần gửi nhắc nhở',
                data: { events_reminded: 0 }
            });
        }

        let totalReminders = 0;

        for (const event of upcomingEvents) {
            // Kiểm tra xem đã gửi nhắc nhở chưa
            const existingReminder = await notificationsCollection.findOne({
                event_id: event._id,
                type: 'reminder'
            });

            if (existingReminder) {
                continue; // Đã gửi nhắc nhở rồi, bỏ qua
            }

            // Lấy danh sách người đăng ký
            const registrations = await registrationsCollection
                .find({ event_id: event._id })
                .toArray();

            if (registrations.length === 0) {
                continue; // Không có ai đăng ký
            }

            // Lấy thông tin người dùng
            const userIds = registrations.map(r => r.user_id);
            const users = await usersCollection
                .find({ _id: { $in: userIds } })
                .toArray();

            const recipients = users.map(user => ({
                user_id: user._id.toString(),
                email: user.email,
                full_name: user.full_name
            }));

            // Tạo thông báo nhắc nhở
            const reminderNotification = {
                event_id: event._id,
                title: `Nhắc nhở: Sự kiện "${event.title}" sắp diễn ra`,
                message: `Sự kiện "${event.title}" sẽ diễn ra vào ${event.start_time.toLocaleString('vi-VN')} tại ${event.location}. Đừng quên tham gia nhé!`,
                type: 'reminder',
                recipients,
                sent_at: now,
                sent: true
            };

            await notificationsCollection.insertOne(reminderNotification);
            totalReminders++;
        }

        return res.status(200).json({
            success: true,
            message: `Đã gửi nhắc nhở cho ${totalReminders} sự kiện`,
            data: {
                events_reminded: totalReminders,
                total_upcoming_events: upcomingEvents.length
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi sendEventReminder:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    sendEventNotification,
    getMyNotifications,
    deleteNotification,
    sendEventReminder
}; 