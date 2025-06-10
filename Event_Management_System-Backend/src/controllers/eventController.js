require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const { ObjectId } = require("mongodb");
const { connection } = require("../config/database");

// Lấy danh sách sự kiện
const getEvents = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    if (page < 1 || limit < 1) {
      return res.status(400).json({
        success: false,
        message: "Tham số page và limit phải là số nguyên dương",
      });
    }
    const skip = (page - 1) * limit;

    const db = await connection();
    const eventsCollection = db.collection("events");
    const registrationsCollection = db.collection("registrations");
    const feedbacksCollection = db.collection("feedbacks");
    const notificationsCollection = db.collection("notifications");

    const totalItems = await eventsCollection.countDocuments({});
    const totalPages = Math.ceil(totalItems / limit);

    const eventsCursor = eventsCollection.find({}).skip(skip).limit(limit);

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
          registered_at: r.registered_at.toISOString(),
        }));

        const fbs = await feedbacksCollection
          .find({ event_id: eventId })
          .toArray();

        const feedbacks = fbs.map((f) => ({
          user_id: f.user_id.toString(),
          rating: f.rating,
          comment: f.comment,
          created_at: f.created_at.toISOString(),
        }));

        const notifs = await notificationsCollection
          .find({ event_id: eventId })
          .toArray();

        const notifications = notifs.map((n) => ({
          title: n.title,
          message: n.message,
          type: n.type,
          sent_at: n.sent_at.toISOString(),
          sent: n.sent,
        }));

        return {
          _id: eventDoc._id.toString(),
          club: {
            club_id: eventDoc.club.club_id,
            club_name: eventDoc.club.club_name,
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
          updated_at: eventDoc.updated_at.toISOString(),
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
          totalItems,
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi getEvents:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
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
        message: "event_id không hợp lệ",
      });
    }

    const db = await connection();
    const eventsCollection = db.collection("events");
    const registrationsCollection = db.collection("registrations");
    const feedbacksCollection = db.collection("feedbacks");

    const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
    if (!eventDoc) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại",
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
      registrations: registrations.map((r) => ({
        user_id: r.user_id.toString(),
        full_name: r.full_name,
        registered_at: r.registered_at.toISOString(),
        checked_in: r.checked_in || false,
        checked_in_at: r.checked_in_at ? r.checked_in_at.toISOString() : null,
        qr_code: r.qr_code, 
      })),
      feedbacks: feedbacks.map((f) => ({
        user_id: f.user_id.toString(),
        rating: f.rating,
        comment: f.comment,
        created_at: f.created_at.toISOString(),
      })),
      statistics: {
        total_registered: registrations.length,
        total_checked_in: registrations.filter((r) => r.checked_in).length,
        average_rating:
          feedbacks.length > 0
            ? (
                feedbacks.reduce((sum, f) => sum + f.rating, 0) /
                feedbacks.length
              ).toFixed(1)
            : null,
      },
    };

    return res.status(200).json({
      success: true,
      data: { event: eventResponse },
    });
  } catch (err) {
    console.error("❌ Lỗi khi getEventDetails:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

const createEvent = async (req, res) => {
  try {
    // 1. BỎ `banner_url` ra khỏi destructuring của req.body
    const {
      club_id,
      title,
      description,
      start_time,
      end_time,
      location,
      max_participants,
      category,
    } = req.body;

    // 2. LẤY `banner_url` từ req.file do middleware multer-storage-cloudinary cung cấp
    //    Nếu không có file nào được tải lên, gán chuỗi rỗng.
    const banner_url = req.file ? req.file.path : "";

    // Phần validation các trường khác giữ nguyên
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
      console.log("Request body bị thiếu:", req.body);
      return res.status(400).json({
        success: false,
        message: "Thiếu một hoặc nhiều trường bắt buộc",
      });
    }

    // Phần validation về ngày tháng, số lượng người tham gia giữ nguyên...
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "start_time hoặc end_time không phải ISODate hợp lệ",
      });
    }
    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "end_time phải sau start_time",
      });
    }

    const maxPart = Number(max_participants);
    if (isNaN(maxPart) || !Number.isInteger(maxPart) || maxPart < 1) {
      return res.status(400).json({
        success: false,
        message: "max_participants phải là số nguyên dương",
      });
    }
    
    // Phần kết nối DB và kiểm tra club_id giữ nguyên...
    const db = await connection();
    const clubsCollection = db.collection("clubs");
    const eventsCollection = db.collection("events");

    let clubObjectId;
    try {
      clubObjectId = new ObjectId(club_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "club_id không hợp lệ",
      });
    }

    const clubDoc = await clubsCollection.findOne({ _id: clubObjectId });
    if (!clubDoc) {
      return res.status(404).json({
        success: false,
        message: "Club không tồn tại",
      });
    }
    
    // Phần tạo object newEvent giữ nguyên,
    // biến `banner_url` giờ đã là URL từ Cloudinary
    const now = new Date();
    const newEvent = {
      club: {
        club_id,
        club_name: clubDoc.club_name,
      },
      title,
      description,
      start_time: startDate,
      end_time: endDate,
      location,
      max_participants: maxPart,
      banner_url: banner_url, // <-- Dòng này giờ sẽ dùng URL từ Cloudinary
      category,
      status: "draft",
      registrations: [],
      feedbacks: [],
      notifications: [],
      created_at: now,
      updated_at: now,
    };

    // Phần insert vào DB và trả về response cho client giữ nguyên...
    const result = await eventsCollection.insertOne(newEvent);
    const eventDoc = { _id: result.insertedId, ...newEvent, };
    const eventResponse = {
      _id: eventDoc._id.toString(),
      club: {
        club_id: eventDoc.club.club_id,
        club_name: eventDoc.club.club_name,
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
      updated_at: eventDoc.updated_at.toISOString(),
    };

    return res.status(201).json({
      success: true,
      message: "Tạo sự kiện thành công",
      data: {
        event: eventResponse,
      },
    });

  } catch (err) {
    console.error("❌ Lỗi khi createEvent:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Cập nhật sự kiện
const updateEvent = async (req, res) => {
  try {
    const { id: eventIdParam } = req.params;
    const updateData = req.body;

    // <<<--- KIỂM TRA NẾU CÓ FILE BANNER MỚI ĐƯỢC GỬI LÊN
    // Nếu có, middleware uploader sẽ xử lý và lưu thông tin vào req.file
    if (req.file) {
      // Gán URL mới từ Cloudinary vào đối tượng dữ liệu cần cập nhật
      updateData.banner_url = req.file.path;
    }

    let eventObjectId;
    try {
      eventObjectId = new ObjectId(eventIdParam);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "event_id không hợp lệ",
      });
    }

    const db = await connection();
    const eventsCollection = db.collection("events");

    const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
    if (!eventDoc) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại",
      });
    }

    // Validate ngày tháng nếu có (giữ nguyên)
    if (updateData.start_time || updateData.end_time) {
      const startDate = updateData.start_time
        ? new Date(updateData.start_time)
        : eventDoc.start_time;
      const endDate = updateData.end_time
        ? new Date(updateData.end_time)
        : eventDoc.end_time;

      if (endDate < startDate) {
        return res.status(400).json({
          success: false,
          message: "Thời gian kết thúc phải sau thời gian bắt đầu",
        });
      }
    }

    const now = new Date();
    const updateFields = {
      ...updateData,
      updated_at: now,
    };

    // Chuyển đổi ngày tháng (giữ nguyên)
    if (updateData.start_time)
      updateFields.start_time = new Date(updateData.start_time);
    if (updateData.end_time)
      updateFields.end_time = new Date(updateData.end_time);

    await eventsCollection.updateOne(
      { _id: eventObjectId },
      { $set: updateFields }
    );

    const updatedEvent = await eventsCollection.findOne({ _id: eventObjectId });

    return res.status(200).json({
      success: true,
      message: "Cập nhật sự kiện thành công",
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
          updated_at: updatedEvent.updated_at.toISOString(),
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi updateEvent:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
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
        message: "event_id không hợp lệ",
      });
    }

    const db = await connection();
    const eventsCollection = db.collection("events");
    const registrationsCollection = db.collection("registrations");
    const feedbacksCollection = db.collection("feedbacks");
    const notificationsCollection = db.collection("notifications");

    const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
    if (!eventDoc) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại",
      });
    }

    // Xóa các dữ liệu liên quan
    await Promise.all([
      eventsCollection.deleteOne({ _id: eventObjectId }),
      registrationsCollection.deleteMany({ event_id: eventObjectId }),
      feedbacksCollection.deleteMany({ event_id: eventObjectId }),
      notificationsCollection.deleteMany({ event_id: eventObjectId }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Xóa sự kiện thành công",
    });
  } catch (err) {
    console.error("❌ Lỗi khi deleteEvent:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Quản lý trạng thái sự kiện (duyệt/từ chối)
const approveEvent = async (req, res) => {
  try {
    const { id: eventIdParam } = req.params;
    const { status, reason } = req.body; // 'approved', 'rejected', 'draft'

    if (!["approved", "rejected", "draft"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    let eventObjectId;
    try {
      eventObjectId = new ObjectId(eventIdParam);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "event_id không hợp lệ",
      });
    }

    const db = await connection();
    const eventsCollection = db.collection("events");

    const eventDoc = await eventsCollection.findOne({ _id: eventObjectId });
    if (!eventDoc) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại",
      });
    }

    const now = new Date();
    await eventsCollection.updateOne(
      { _id: eventObjectId },
      {
        $set: {
          status,
          approval_reason: reason || "",
          approval_date: now,
          updated_at: now,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: `Sự kiện đã được ${
        status === "approved"
          ? "duyệt"
          : status === "rejected"
          ? "từ chối"
          : "chuyển về nháp"
      }`,
      data: {
        status,
        approval_date: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi approveEvent:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
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
        message: "event_id không hợp lệ",
      });
    }

    const db = await connection();
    const eventsCollection = db.collection("events");
    const registrationsCollection = db.collection("registrations");

    const eventExists = await eventsCollection.findOne({ _id: eventObjectId });
    if (!eventExists) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại",
      });
    }

    const existing = await registrationsCollection.findOne({
      event_id: eventObjectId,
      user_id: user._id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã đăng ký sự kiện này rồi",
      });
    }

    const qr_code = uuidv4();
    const qr_code_image = await QRCode.toDataURL(qr_code);
    const now = new Date();

    const newRegistration = {
      event_id: eventObjectId,
      user_id: user._id,
      full_name: user.full_name || "",
      qr_code,
      registered_at: now,
    };

    await registrationsCollection.insertOne(newRegistration);

    const registrationResponse = {
      user_id: user._id.toString(),
      full_name: user.full_name || "",
      qr_code,
      registered_at: now.toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Đăng ký thành công",
      data: {
        registration: registrationResponse,
        qr_code_image,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi registerForEvent:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
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
        message: "Thiếu mã QR",
      });
    }

    const db = await connection();
    const registrationsCollection = db.collection("registrations");

    const registration = await registrationsCollection.findOne({ qr_code });
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Mã QR không hợp lệ",
      });
    }

    if (registration.checked_in) {
      return res.status(400).json({
        success: false,
        message: "Đã điểm danh trước đó",
      });
    }

    const now = new Date();
    await registrationsCollection.updateOne(
      { _id: registration._id },
      {
        $set: {
          checked_in: true,
          checked_in_at: now,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Điểm danh thành công",
      data: {
        user_name: registration.full_name,
        checked_in_at: now.toISOString(),
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi checkinEvent:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
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
        message: "Thiếu trường rating",
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
        message: "Trường rating phải là số nguyên từ 1 đến 5",
      });
    }

    let eventObjectId;
    try {
      eventObjectId = new ObjectId(eventIdParam);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "event_id (trong URL) không hợp lệ",
      });
    }

    const db = await connection();
    const eventsCollection = db.collection("events");
    const feedbacksCollection = db.collection("feedbacks");

    const eventExists = await eventsCollection.findOne({ _id: eventObjectId });
    if (!eventExists) {
      return res.status(404).json({
        success: false,
        message: "Sự kiện không tồn tại",
      });
    }

    const now = new Date();
    const newFeedback = {
      event_id: eventObjectId,
      user_id: user._id,
      rating: parsedRating,
      comment: comment || "",
      created_at: now,
    };

    await feedbacksCollection.insertOne(newFeedback);

    const feedbackResponse = {
      user_id: user._id.toString(),
      rating: newFeedback.rating,
      comment: newFeedback.comment,
      created_at: newFeedback.created_at.toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Gửi đánh giá thành công",
      data: {
        feedback: feedbackResponse,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi submitFeedback:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
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
    const registrationsCollection = db.collection("registrations");
    const eventsCollection = db.collection("events");

    // Find all registrations for this user
    const registrations = await registrationsCollection
      .find({ user_id: user._id })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await registrationsCollection.countDocuments({
      user_id: user._id,
    });

    // Get event details for each registration, ensuring category is included
    const history = await Promise.all(
      registrations.map(async (registration) => {
        const event = await eventsCollection.findOne(
          { _id: new ObjectId(registration.event_id) },
          {
            projection: {
              title: 1,
              start_time: 1,
              end_time: 1,
              location: 1,
              club: 1,
              category: 1,
              status: 1,
              banner_url: 1,
              max_participants: 1,
              registrations: 1,
              statistics: 1,
            },
          } // Explicitly include category
        );

        return {
          registration_id: registration._id,
          event: event,
          registered_at: registration.registered_at,
          checked_in: registration.checked_in || false,
          checked_in_at: registration.checked_in_at || null,
          qr_code: registration.qr_code,
        };
      })
    );

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Error in getMyEventHistory:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Lấy tất cả feedback (chỉ admin)
const getAllFeedbacks = async (req, res) => {
  try {
    const db = await connection();
    const feedbacksCollection = db.collection("feedbacks");
    const eventsCollection = db.collection("events");
    const usersCollection = db.collection("users");

    const feedbacks = await feedbacksCollection.find({}).toArray();

    // Lấy thông tin chi tiết cho mỗi feedback
    const detailedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        const event = await eventsCollection.findOne({
          _id: new ObjectId(feedback.event_id),
        });
        const user = await usersCollection.findOne({
          _id: new ObjectId(feedback.user_id),
        });

        return {
          _id: feedback._id.toString(),
          event_id: feedback.event_id.toString(),
          user_id: feedback.user_id.toString(),
          rating: feedback.rating,
          comment: feedback.comment,
          created_at: feedback.created_at.toISOString(),
          event: {
            title: event?.title || "Sự kiện không tồn tại",
            category: event?.category || "Không xác định",
          },
          user: {
            full_name: user?.full_name || "Người dùng không tồn tại",
            email: user?.email || "Không có email",
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        feedbacks: detailedFeedbacks,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi getAllFeedbacks:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Xóa feedback (chỉ admin)
const deleteFeedback = async (req, res) => {
  try {
    const { id: feedbackId } = req.params;

    let feedbackObjectId;
    try {
      feedbackObjectId = new ObjectId(feedbackId);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "feedback_id không hợp lệ",
      });
    }

    const db = await connection();
    const feedbacksCollection = db.collection("feedbacks");

    const result = await feedbacksCollection.deleteOne({
      _id: feedbackObjectId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đánh giá",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Xóa đánh giá thành công",
    });
  } catch (err) {
    console.error("❌ Lỗi khi deleteFeedback:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
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
  getMyEventHistory,
  getAllFeedbacks,
  deleteFeedback,
};