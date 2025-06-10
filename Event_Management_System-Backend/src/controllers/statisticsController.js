require('dotenv').config();
const { ObjectId } = require('mongodb');
const { connection } = require('../config/database');

// Thống kê sự kiện theo thời gian, thể loại
const getEventStatistics = async (req, res) => {
    try {
        const { start_date, end_date, category } = req.query;

        const db = await connection();
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');

        let dateFilter = {};
        if (start_date) {
            dateFilter.start_time = { $gte: new Date(start_date) };
        }
        if (end_date) {
            dateFilter.end_time = { $lte: new Date(end_date) };
        }

        let categoryFilter = {};
        if (category) {
            categoryFilter.category = category;
        }

        const filter = { ...dateFilter, ...categoryFilter };

        // Thống kê tổng quan
        const totalEvents = await eventsCollection.countDocuments(filter);
        const eventsByStatus = await eventsCollection.aggregate([
            { $match: filter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]).toArray();

        const eventsByCategory = await eventsCollection.aggregate([
            { $match: filter },
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]).toArray();

        // Thống kê đăng ký
        const events = await eventsCollection.find(filter).toArray();
        const eventIds = events.map(e => e._id);

        const totalRegistrations = await registrationsCollection.countDocuments({
            event_id: { $in: eventIds }
        });

        const totalCheckedIn = await registrationsCollection.countDocuments({
            event_id: { $in: eventIds },
            checked_in: true
        });

        return res.status(200).json({
            success: true,
            data: {
                overview: {
                    total_events: totalEvents,
                    total_registrations: totalRegistrations,
                    total_checked_in: totalCheckedIn,
                    attendance_rate: totalRegistrations > 0
                        ? ((totalCheckedIn / totalRegistrations) * 100).toFixed(2) + '%'
                        : '0%'
                },
                by_status: eventsByStatus.reduce((obj, item) => {
                    obj[item._id] = item.count;
                    return obj;
                }, {}),
                by_category: eventsByCategory.reduce((obj, item) => {
                    obj[item._id] = item.count;
                    return obj;
                }, {})
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getEventStatistics:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Thống kê tỷ lệ tham gia của sinh viên
const getUserParticipationStats = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const db = await connection();
        const usersCollection = db.collection('users');
        const registrationsCollection = db.collection('registrations');
        const eventsCollection = db.collection('events');

        let dateFilter = {};
        if (start_date || end_date) {
            dateFilter = {};
            if (start_date) dateFilter.$gte = new Date(start_date);
            if (end_date) dateFilter.$lte = new Date(end_date);
        }

        // Lấy sự kiện trong khoảng thời gian
        const eventFilter = Object.keys(dateFilter).length > 0
            ? { start_time: dateFilter }
            : {};

        const events = await eventsCollection.find(eventFilter).toArray();
        const eventIds = events.map(e => e._id);

        // Thống kê người dùng
        const totalUsers = await usersCollection.countDocuments({});

        const userStats = await registrationsCollection.aggregate([
            { $match: { event_id: { $in: eventIds } } },
            {
                $group: {
                    _id: '$user_id',
                    total_registered: { $sum: 1 },
                    total_attended: {
                        $sum: { $cond: [{ $eq: ['$checked_in', true] }, 1, 0] }
                    }
                }
            }
        ]).toArray();

        const activeUsers = userStats.length;
        const avgEventsPerUser = activeUsers > 0
            ? (userStats.reduce((sum, user) => sum + user.total_registered, 0) / activeUsers).toFixed(2)
            : 0;

        const avgAttendanceRate = activeUsers > 0
            ? (userStats.reduce((sum, user) => {
                return sum + (user.total_attended / user.total_registered);
            }, 0) / activeUsers * 100).toFixed(2) + '%'
            : '0%';

        return res.status(200).json({
            success: true,
            data: {
                total_users: totalUsers,
                active_users: activeUsers,
                participation_rate: ((activeUsers / totalUsers) * 100).toFixed(2) + '%',
                avg_events_per_user: avgEventsPerUser,
                avg_attendance_rate: avgAttendanceRate,
                user_details: userStats.map(user => ({
                    user_id: user._id.toString(),
                    total_registered: user.total_registered,
                    total_attended: user.total_attended,
                    attendance_rate: ((user.total_attended / user.total_registered) * 100).toFixed(2) + '%'
                }))
            }
        });
    } catch (err) {
        console.error('❌ Lỗi khi getUserParticipationStats:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

// Xuất báo cáo hoạt động tổng hợp
const generateReport = async (req, res) => {
    try {
        const { start_date, end_date, type } = req.query; // type: 'events', 'users', 'clubs', 'all'

        const db = await connection();
        const eventsCollection = db.collection('events');
        const registrationsCollection = db.collection('registrations');
        const usersCollection = db.collection('users');
        const clubsCollection = db.collection('clubs');

        let dateFilter = {};
        if (start_date) dateFilter.$gte = new Date(start_date);
        if (end_date) dateFilter.$lte = new Date(end_date);

        const report = {
            period: {
                start_date: start_date || 'Không giới hạn',
                end_date: end_date || 'Không giới hạn'
            },
            generated_at: new Date().toISOString()
        };

        if (type === 'events' || type === 'all' || !type) {
            const eventFilter = Object.keys(dateFilter).length > 0
                ? { start_time: dateFilter }
                : {};

            const events = await eventsCollection.find(eventFilter).toArray();
            const eventIds = events.map(e => e._id);

            const registrations = await registrationsCollection
                .find({ event_id: { $in: eventIds } })
                .toArray();

            report.events = {
                total_events: events.length,
                events_by_status: events.reduce((acc, event) => {
                    acc[event.status] = (acc[event.status] || 0) + 1;
                    return acc;
                }, {}),
                events_by_category: events.reduce((acc, event) => {
                    acc[event.category] = (acc[event.category] || 0) + 1;
                    return acc;
                }, {}),
                total_registrations: registrations.length,
                total_attended: registrations.filter(r => r.checked_in).length
            };
        }

        if (type === 'users' || type === 'all' || !type) {
            const totalUsers = await usersCollection.countDocuments({});
            const activeUsers = await registrationsCollection.distinct('user_id');

            report.users = {
                total_users: totalUsers,
                active_users: activeUsers.length,
                participation_rate: ((activeUsers.length / totalUsers) * 100).toFixed(2) + '%'
            };
        }

        if (type === 'clubs' || type === 'all' || !type) {
            const clubs = await clubsCollection.find({}).toArray();
            const clubEvents = await eventsCollection.aggregate([
                { $group: { _id: '$club.club_id', event_count: { $sum: 1 } } }
            ]).toArray();

            report.clubs = {
                total_clubs: clubs.length,
                clubs_activity: clubEvents.map(ce => ({
                    club_id: ce._id,
                    event_count: ce.event_count
                }))
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Tạo báo cáo thành công',
            data: { report }
        });
    } catch (err) {
        console.error('❌ Lỗi khi generateReport:', err);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server nội bộ'
        });
    }
};

module.exports = {
    getEventStatistics,
    getUserParticipationStats,
    generateReport
}; 