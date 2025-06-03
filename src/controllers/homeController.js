require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { ObjectId } = require('mongodb');
const { connection } = require('../config/database');

const register = async (req, res) => {
    try {
        const { email, password, full_name, phone } = req.body;

        if (!email || !password || !full_name) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu email, password hoặc full_name'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');

        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được đăng ký trước đó'
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const now = new Date();
        const newUser = {
            email,
            password: hashedPassword,
            full_name,
            phone: phone || '',
            roles: [
                {
                    role_id: uuidv4(),
                    role_name: 'student',
                    description: 'Sinh viên'
                }
            ],
            clubs: [],
            created_at: now,
            updated_at: now
        };

        const result = await usersCollection.insertOne(newUser);

        const userResponse = {
            _id: result.insertedId.toString(),
            email: newUser.email,
            full_name: newUser.full_name,
            phone: newUser.phone,
            roles: newUser.roles.map(r => ({
                role_id: r.role_id,
                role_name: r.role_name,
                description: r.description
            })),
            clubs: [],
            created_at: newUser.created_at.toISOString(),
            updated_at: newUser.updated_at.toISOString()
        };

        return res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            data: {
                user: userResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi register:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu email hoặc password'
            });
        }

        const db = await connection();
        const usersCollection = db.collection('users');

        const userDoc = await usersCollection.findOne({ email });
        if (!userDoc) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        const isMatch = await bcrypt.compare(password, userDoc.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email hoặc mật khẩu không chính xác'
            });
        }

        const payload = { id: userDoc._id.toString() };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '7d'
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
            created_at: userDoc.created_at ? userDoc.created_at.toISOString() : null,
            updated_at: userDoc.updated_at ? userDoc.updated_at.toISOString() : null
        };

        return res.status(200).json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: userResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi login:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

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

        const clubDoc = await clubsCollection.findOne({ club_id: club_id });
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

const createClub = async (req, res) => {
    try {
        const { club_name, email, password, description } = req.body;

        if (!club_name || !email || !password || !description) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu club_name, email, password hoặc description'
            });
        }

        const db = await connection();
        const clubsCollection = db.collection('clubs');

        const existingClub = await clubsCollection.findOne({ email });
        if (existingClub) {
            return res.status(409).json({
                success: false,
                message: 'Email của CLB đã được sử dụng'
            });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        s
        const now = new Date();
        const newClub = {
            _id: uuidv4(),
            club_name,
            email,
            password: hashedPassword,
            description,
            members: [],
            created_at: now,
            updated_at: now
        };

        await clubsCollection.insertOne(newClub);

        const clubResponse = {
            _id: newClub._id,
            club_name: newClub.club_name,
            email: newClub.email,
            description: newClub.description,
            members: [],
            created_at: newClub.created_at.toISOString(),
            updated_at: newClub.updated_at.toISOString()
        };

        return res.status(201).json({
            success: true,
            message: 'Tạo CLB thành công',
            data: {
                club: clubResponse
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi createClub:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

const getClubs = async (req, res) => {
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
        const clubsCollection = db.collection('clubs');

        const total = await clubsCollection.countDocuments({});
        const pages = Math.ceil(total / limit);

        const cursor = clubsCollection
            .find({}, { projection: { _id: 1, club_name: 1, email: 1, password: 1, description: 1, members: 1, created_at: 1, updated_at: 1 } })
            .skip(skip)
            .limit(limit);

        const clubsArray = await cursor.toArray();

        const clubs = clubsArray.map(clubDoc => ({
            _id: clubDoc._id, // UUID
            club_name: clubDoc.club_name,
            email: clubDoc.email,
            password: clubDoc.password,
            description: clubDoc.description,
            members: Array.isArray(clubDoc.members)
                ? clubDoc.members.map(m => ({
                    user_id: m.user_id,
                    full_name: m.full_name,
                    role_in_club: m.role_in_club
                }))
                : [],
            created_at: clubDoc.created_at ? clubDoc.created_at.toISOString() : null,
            updated_at: clubDoc.updated_at ? clubDoc.updated_at.toISOString() : null
        }));

        return res.status(200).json({
            success: true,
            data: {
                clubs,
                pagination: {
                    page,
                    pages,
                    total
                }
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getClubs:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

module.exports = {
    register, login, getUsers, createNotification, submitFeedback,
    registerForEvent, createEvent, getEvents, createClub, getClubs
};
