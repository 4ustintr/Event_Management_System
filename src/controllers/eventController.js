require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { ObjectId } = require('mongodb');
const { connection } = require('../config/database');

// Lấy danh sách sự kiện
const getEvents = async (req, res) => {
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
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');
        const feedbacksCollection = db.collection('feedbacks');
        const notificationsCollection = db.collection('notifications');

        const totalItems = await eventsCollection.countDocuments({});
        const totalPages = Math.ceil(totalItems / limit);

        const eventsCursor = eventsCollection
            .find({})
            .skip(skip)
            .limit(limit);

        const eventsArray = await eventsCursor.toArray();

        const events = await Promise.all(
            eventsArray.map(async (eventDoc) => {
                const eventId = eventDoc._id;

                const regs = await registrationsCollection
                    .find({ event_id: eventId })
                    .toArray();

                const registrations = regs.map((r) => ({
                    user_id: r.user_id.toString(),
                    full_name: r.full_name,
                    qr_code: r.qr_code,
                    registered_at: r.registered_at.toISOString()
                }));

                const fbs = await feedbacksCollection
                    .find({ event_id: eventId })
                    .toArray();

                const feedbacks = fbs.map((f) => ({
                    user_id: f.user_id.toString(),
                    rating: f.rating,
                    comment: f.comment,
                    created_at: f.created_at.toISOString()
                }));

                const notifs = await notificationsCollection
                    .find({ event_id: eventId })
                    .toArray();

                const notifications = notifs.map((n) => ({
                    title: n.title,
                    message: n.message,
                    type: n.type,
                    sent_at: n.sent_at.toISOString(),
                    sent: n.sent
                }));

                return {
                    _id: eventDoc._id.toString(),
                    club: {
                        club_id: eventDoc.club.club_id,
                        club_name: eventDoc.club.club_name
                    },
                    title: eventDoc.title,
                    description: eventDoc.description,
                    start_time: eventDoc.start_time.toISOString(),
                    end_time: eventDoc.end_time.toISOString(),
                    location: eventDoc.location,
                    max_participants: eventDoc.max_participants,
                    banner_url: eventDoc.banner_url,
                    category: eventDoc.category,
                    status: eventDoc.status,
                    registrations,
                    feedbacks,
                    notifications,
                    created_at: eventDoc.created_at.toISOString(),
                    updated_at: eventDoc.updated_at.toISOString()
                };
            })
        );

        return res.status(200).json({
            success: true,
            data: {
                events,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getEvents:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Xem chi tiết sự kiện
const getEventDetails = async (req, res) => {
    try {
        const { id: eventIdParam } = req.params;

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(eventIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id không hợp lệ'
            });
        }

        const db = await connection();
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');
        const feedbacksCollection = db.collection('feedbacks');

        const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
        if (!eventDoc) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        // Lấy danh sách đăng ký
        const registrations = await registrationsCollection
            .find({ event_id: eventObjectId })
            .toArray();

        // Lấy feedback
        const feedbacks = await feedbacksCollection
            .find({ event_id: eventObjectId })
            .toArray();

        const eventResponse = {
            _id: eventDoc._id.toString(),
            club: eventDoc.club,
            title: eventDoc.title,
            description: eventDoc.description,
            start_time: eventDoc.start_time.toISOString(),
            end_time: eventDoc.end_time.toISOString(),
            location: eventDoc.location,
            max_participants: eventDoc.max_participants,
            banner_url: eventDoc.banner_url,
            category: eventDoc.category,
            status: eventDoc.status,
            registrations: registrations.map(r => ({
                user_id: r.user_id.toString(),
                full_name: r.full_name,
                registered_at: r.registered_at.toISOString(),
                checked_in: r.checked_in || false,
                checked_in_at: r.checked_in_at ? r.checked_in_at.toISOString() : null
            })),
            feedbacks: feedbacks.map(f => ({
                user_id: f.user_id.toString(),
                rating: f.rating,
                comment: f.comment,
                created_at: f.created_at.toISOString()
            })),
            statistics: {
                total_registered: registrations.length,
                total_checked_in: registrations.filter(r => r.checked_in).length,
                average_rating: feedbacks.length > 0
                    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                    : null
            }
        };

        return res.status(200).json({
            success: true,
            data: { event: eventResponse }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getEventDetails:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Tạo sự kiện mới
const createEvent = async (req, res) => {
    try {
        const {
            club_id,
            title,
            description,
            start_time,
            end_time,
            location,
            max_participants,
            banner_url,
            category
        } = req.body;

        if (
            !club_id ||
            !title ||
            !description ||
            !start_time ||
            !end_time ||
            !location ||
            max_participants === undefined ||
            max_participants === null ||
            !category
        ) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu một hoặc nhiều trường bắt buộc'
            });
        }

        const startDate = new Date(start_time);
        const endDate = new Date(end_time);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'start_time hoặc end_time không phải ISODate hợp lệ'
            });
        }
        if (endDate < startDate) {
            return res.status(400).json({
                success: false,
                message: 'end_time phải sau start_time'
            });
        }

        const maxPart = Number(max_participants);
        if (
            isNaN(maxPart) ||
            !Number.isInteger(maxPart) ||
            maxPart < 1
        ) {
            return res.status(400).json({
                success: false,
                message: 'max_participants phải là số nguyên dương'
            });
        }

        const db = await connection();
        const clubsCollection = db.collection('clubs');
        const eventsCollection = db.collection('events');

        const clubDoc = await clubsCollection.findOne({ _id: club_id });
        if (!clubDoc) {
            return res.status(404).json({
                success: false,
                message: 'Club không tồn tại'
            });
        }

        const now = new Date();
        const newEvent = {
            club: {
                club_id,
                club_name: clubDoc.club_name
            },
            title,
            description,
            start_time: startDate,
            end_time: endDate,
            location,
            max_participants: maxPart,
            banner_url: banner_url || '',
            category,
            status: 'draft',
            registrations: [],
            feedbacks: [],
            notifications: [],
            created_at: now,
            updated_at: now
        };

        const result = await eventsCollection.insertOne(newEvent);

        const eventDoc = {
            _id: result.insertedId,
            ...newEvent
        };
        const eventResponse = {
            _id: eventDoc._id.toString(),
            club: {
                club_id: eventDoc.club.club_id,
                club_name: eventDoc.club.club_name
            },
            title: eventDoc.title,
            description: eventDoc.description,
            start_time: eventDoc.start_time.toISOString(),
            end_time: eventDoc.end_time.toISOString(),
            location: eventDoc.location,
            max_participants: eventDoc.max_participants,
            banner_url: eventDoc.banner_url,
            category: eventDoc.category,
            status: eventDoc.status,
            registrations: [],
            feedbacks: [],
            notifications: [],
            created_at: eventDoc.created_at.toISOString(),
            updated_at: eventDoc.updated_at.toISOString()
        };

        return res.status(201).json({
            success: true,
            message: 'Tạo sự kiện thành công',
            data: {
                event: eventResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi createEvent:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Cập nhật sự kiện
const updateEvent = async (req, res) => {
    try {
        const { id: eventIdParam } = req.params;
        const updateData = req.body;

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(eventIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id không hợp lệ'
            });
        }

        const db = await connection();
        const eventsCollection = db.collection('events');

        const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
        if (!eventDoc) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        // Validate ngày tháng nếu có
        if (updateData.start_time || updateData.end_time) {
            const startDate = updateData.start_time ? new Date(updateData.start_time) : eventDoc.start_time;
            const endDate = updateData.end_time ? new Date(updateData.end_time) : eventDoc.end_time;

            if (endDate < startDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
                });
            }
        }

        const now = new Date();
        const updateFields = {
            ...updateData,
            updated_at: now
        };

        // Chuyển đổi ngày tháng
        if (updateData.start_time) updateFields.start_time = new Date(updateData.start_time);
        if (updateData.end_time) updateFields.end_time = new Date(updateData.end_time);

        await eventsCollection.updateOne(
            { _id: eventObjectId },
            { $set: updateFields }
        );

        const updatedEvent = await eventsCollection.findOne({ _id: eventObjectId });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật sự kiện thành công',
            data: {
                event: {
                    _id: updatedEvent._id.toString(),
                    club: updatedEvent.club,
                    title: updatedEvent.title,
                    description: updatedEvent.description,
                    start_time: updatedEvent.start_time.toISOString(),
                    end_time: updatedEvent.end_time.toISOString(),
                    location: updatedEvent.location,
                    max_participants: updatedEvent.max_participants,
                    banner_url: updatedEvent.banner_url,
                    category: updatedEvent.category,
                    status: updatedEvent.status,
                    updated_at: updatedEvent.updated_at.toISOString()
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi updateEvent:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Xóa sự kiện
const deleteEvent = async (req, res) => {
    try {
        const { id: eventIdParam } = req.params;

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(eventIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id không hợp lệ'
            });
        }

        const db = await connection();
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');
        const feedbacksCollection = db.collection('feedbacks');
        const notificationsCollection = db.collection('notifications');

        const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
        if (!eventDoc) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        // Xóa các dữ liệu liên quan
        await Promise.all([
            eventsCollection.deleteOne({ _id: eventObjectId }),
            registrationsCollection.deleteMany({ event_id: eventObjectId }),
            feedbacksCollection.deleteMany({ event_id: eventObjectId }),
            notificationsCollection.deleteMany({ event_id: eventObjectId })
        ]);

        return res.status(200).json({
            success: true,
            message: 'Xóa sự kiện thành công'
        });
    } catch (err) {
        console.error('❌ Lỗi khi deleteEvent:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Quản lý trạng thái sự kiện (duyệt/từ chối)
const approveEvent = async (req, res) => {
    try {
        const { id: eventIdParam } = req.params;
        const { status, reason } = req.body; // 'approved', 'rejected', 'draft'

        if (!['approved', 'rejected', 'draft'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ'
            });
        }

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(eventIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id không hợp lệ'
            });
        }

        const db = await connection();
        const eventsCollection = db.collection('events');

        const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
        if (!eventDoc) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        const now = new Date();
        await eventsCollection.updateOne(
            { _id: eventObjectId },
            {
                $set: {
                    status,
                    approval_reason: reason || '',
                    approval_date: now,
                    updated_at: now
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: `Sự kiện đã được ${status === 'approved' ? 'duyệt' : status === 'rejected' ? 'từ chối' : 'chuyển về nháp'}`,
            data: {
                status,
                approval_date: now.toISOString()
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi approveEvent:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Đăng ký tham gia sự kiện
const registerForEvent = async (req, res) => {
    try {
        const { id: eventIdParam } = req.params;
        const user = req.user;

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(eventIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id không hợp lệ'
            });
        }

        const db = await connection();
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');

        const eventExists = await eventsCollection.findOne({ _id: eventObjectId });
        if (!eventExists) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        const existing = await registrationsCollection.findOne({
            event_id: eventObjectId,
            user_id: user._id
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Bạn đã đăng ký sự kiện này rồi'
            });
        }

        const qr_code = uuidv4();
        const qr_code_image = await QRCode.toDataURL(qr_code);
        const now = new Date();

        const newRegistration = {
            event_id: eventObjectId,
            user_id: user._id,
            full_name: user.full_name || '',
            qr_code,
            registered_at: now
        };

        await registrationsCollection.insertOne(newRegistration);

        const registrationResponse = {
            user_id: user._id.toString(),
            full_name: user.full_name || '',
            qr_code,
            registered_at: now.toISOString()
        };

        return res.status(200).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                registration: registrationResponse,
                qr_code_image
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi registerForEvent:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Điểm danh bằng QR code
const checkinEvent = async (req, res) => {
    try {
        const { qr_code } = req.body;

        if (!qr_code) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu mã QR'
            });
        }

        const db = await connection();
        const registrationsCollection = db.collection('registrations');

        const registration = await registrationsCollection.findOne({ qr_code });
        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Mã QR không hợp lệ'
            });
        }

        if (registration.checked_in) {
            return res.status(400).json({
                success: false,
                message: 'Đã điểm danh trước đó'
            });
        }

        const now = new Date();
        await registrationsCollection.updateOne(
            { _id: registration._id },
            {
                $set: {
                    checked_in: true,
                    checked_in_at: now
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Điểm danh thành công',
            data: {
                user_name: registration.full_name,
                checked_in_at: now.toISOString()
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi checkinEvent:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Gửi feedback về sự kiện
const submitFeedback = async (req, res) => {
    try {
        const { id: eventIdParam } = req.params;
        const { rating, comment } = req.body;
        const user = req.user;

        if (rating === undefined || rating === null) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu trường rating'
            });
        }
        const parsedRating = Number(rating);
        if (
            isNaN(parsedRating) ||
            !Number.isInteger(parsedRating) ||
            parsedRating < 1 ||
            parsedRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: 'Trường rating phải là số nguyên từ 1 đến 5'
            });
        }

        let eventObjectId;
        try {
            eventObjectId = new ObjectId(eventIdParam);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'event_id (trong URL) không hợp lệ'
            });
        }

        const db = await connection();
        const eventsCollection = db.collection('events');
        const feedbacksCollection = db.collection('feedbacks');

        const eventExists = await eventsCollection.findOne({ _id: eventObjectId });
        if (!eventExists) {
            return res.status(404).json({
                success: false,
                message: 'Sự kiện không tồn tại'
            });
        }

        const now = new Date();
        const newFeedback = {
            event_id: eventObjectId,
            user_id: user._id,
            rating: parsedRating,
            comment: comment || '',
            created_at: now
        };

        await feedbacksCollection.insertOne(newFeedback);

        const feedbackResponse = {
            user_id: user._id.toString(),
            rating: newFeedback.rating,
            comment: newFeedback.comment,
            created_at: newFeedback.created_at.toISOString()
        };

        return res.status(200).json({
            success: true,
            message: 'Gửi đánh giá thành công',
            data: {
                feedback: feedbackResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi submitFeedback:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Lấy lịch sử tham gia sự kiện của sinh viên
const getMyEventHistory = async (req, res) => {
    try {
        const user = req.user;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const db = await connection();
        const registrationsCollection = db.collection('registrations');
        const eventsCollection = db.collection('events');

        // Lấy danh sách đăng ký của user
        const registrations = await registrationsCollection
            .find({ user_id: user._id })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await registrationsCollection.countDocuments({ user_id: user._id });
        const pages = Math.ceil(total / limit);

        // Lấy thông tin chi tiết sự kiện
        const eventIds = registrations.map(r => r.event_id);
        const events = await eventsCollection
            .find({ _id: { $in: eventIds } })
            .toArray();

        const eventMap = events.reduce((map, event) => {
            map[event._id.toString()] = event;
            return map;
        }, {});

        const history = registrations.map(reg => {
            const event = eventMap[reg.event_id.toString()];
            return {
                registration_id: reg._id.toString(),
                event: event ? {
                    _id: event._id.toString(),
                    title: event.title,
                    start_time: event.start_time.toISOString(),
                    end_time: event.end_time.toISOString(),
                    location: event.location,
                    club: event.club
                } : null,
                registered_at: reg.registered_at.toISOString(),
                checked_in: reg.checked_in || false,
                checked_in_at: reg.checked_in_at ? reg.checked_in_at.toISOString() : null,
                qr_code: reg.qr_code
            };
        });

        return res.status(200).json({
            success: true,
            data: {
                history,
                pagination: {
                    page,
                    pages,
                    total
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getMyEventHistory:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

module.exports = {
    getEvents,
    getEventDetails,
    createEvent,
    updateEvent,
    deleteEvent,
    approveEvent,
    registerForEvent,
    checkinEvent,
    submitFeedback,
    getMyEventHistory
}; 