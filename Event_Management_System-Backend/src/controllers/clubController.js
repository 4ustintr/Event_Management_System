require("dotenv").config();
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongodb");
const { connection } = require("../config/database");

// Tạo CLB mới
const createClub = async (req, res) => {
  try {
    const { club_name, email, password, description } = req.body;

    if (!club_name || !email || !password || !description) {
      return res.status(400).json({
        success: false,
        message: "Thiếu club_name, email, password hoặc description",
      });
    }

    const db = await connection();
    const clubsCollection = db.collection("clubs");

    const existingClub = await clubsCollection.findOne({ email });
    if (existingClub) {
      return res.status(409).json({
        success: false,
        message: "Email của CLB đã được sử dụng",
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const now = new Date();
    const newClub = {
      _id: new ObjectId(),
      club_name,
      email,
      password: hashedPassword,
      description,
      members: [],
      created_at: now,
      updated_at: now,
    };

    await clubsCollection.insertOne(newClub);

    const clubResponse = {
      _id: newClub._id.toString(),
      club_name: newClub.club_name,
      email: newClub.email,
      description: newClub.description,
      members: [],
      created_at: newClub.created_at.toISOString(),
      updated_at: newClub.updated_at.toISOString(),
    };

    return res.status(201).json({
      success: true,
      message: "Tạo CLB thành công",
      data: {
        club: clubResponse,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi createClub:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Lấy danh sách CLB
const getClubs = async (req, res) => {
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
    const clubsCollection = db.collection("clubs");

    const total = await clubsCollection.countDocuments({});
    const pages = Math.ceil(total / limit);

    const cursor = clubsCollection
      .find({}, { projection: { password: 0 } })
      .skip(skip)
      .limit(limit);

    const clubsArray = await cursor.toArray();

    const clubs = clubsArray.map((clubDoc) => ({
      _id: clubDoc._id,
      club_name: clubDoc.club_name,
      email: clubDoc.email,
      description: clubDoc.description,
      members: Array.isArray(clubDoc.members)
        ? clubDoc.members.map((m) => ({
            user_id: m.user_id,
            full_name: m.full_name,
            role_in_club: m.role_in_club,
          }))
        : [],
      created_at: clubDoc.created_at ? clubDoc.created_at.toISOString() : null,
      updated_at: clubDoc.updated_at ? clubDoc.updated_at.toISOString() : null,
    }));

    return res.status(200).json({
      success: true,
      data: {
        clubs,
        pagination: {
          page,
          pages,
          total,
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi getClubs:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Lấy thông tin chi tiết CLB
const getClubById = async (req, res) => {
  try {
    const { id: clubIdParam } = req.params;

    const db = await connection();
    const clubsCollection = db.collection("clubs");
    const eventsCollection = db.collection("events");

    const clubDoc = await clubsCollection.findOne(
      { _id: clubIdParam },
      { projection: { password: 0 } }
    );

    if (!clubDoc) {
      return res.status(404).json({
        success: false,
        message: "CLB không tồn tại",
      });
    }

    // Lấy danh sách sự kiện của CLB
    const events = await eventsCollection
      .find({ "club.club_id": clubIdParam })
      .toArray();

    const clubResponse = {
      _id: clubDoc._id,
      club_name: clubDoc.club_name,
      email: clubDoc.email,
      description: clubDoc.description,
      members: Array.isArray(clubDoc.members)
        ? clubDoc.members.map((m) => ({
            user_id: m.user_id,
            full_name: m.full_name,
            role_in_club: m.role_in_club,
          }))
        : [],
      events: events.map((e) => ({
        _id: e._id.toString(),
        title: e.title,
        status: e.status,
        start_time: e.start_time.toISOString(),
        end_time: e.end_time.toISOString(),
      })),
      statistics: {
        total_members: clubDoc.members ? clubDoc.members.length : 0,
        total_events: events.length,
        active_events: events.filter((e) => e.status === "approved").length,
      },
      created_at: clubDoc.created_at ? clubDoc.created_at.toISOString() : null,
      updated_at: clubDoc.updated_at ? clubDoc.updated_at.toISOString() : null,
    };

    return res.status(200).json({
      success: true,
      data: { club: clubResponse },
    });
  } catch (err) {
    console.error("❌ Lỗi khi getClubById:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Cập nhật thông tin CLB
const updateClub = async (req, res) => {
  try {
    const { id: clubIdParam } = req.params;
    const updateData = req.body;

    const db = await connection();
    const clubsCollection = db.collection("clubs");

    const clubDoc = await clubsCollection.findOne({ _id: clubIdParam });
    if (!clubDoc) {
      return res.status(404).json({
        success: false,
        message: "CLB không tồn tại",
      });
    }

    // Kiểm tra email trùng lặp nếu có thay đổi email
    if (updateData.email && updateData.email !== clubDoc.email) {
      const existingClub = await clubsCollection.findOne({
        email: updateData.email,
        _id: { $ne: clubIdParam },
      });
      if (existingClub) {
        return res.status(409).json({
          success: false,
          message: "Email đã được sử dụng bởi CLB khác",
        });
      }
    }

    const now = new Date();
    const updateFields = {
      ...updateData,
      updated_at: now,
    };

    // Không cho phép cập nhật password qua API này
    delete updateFields.password;

    await clubsCollection.updateOne(
      { _id: clubIdParam },
      { $set: updateFields }
    );

    const updatedClub = await clubsCollection.findOne(
      { _id: clubIdParam },
      { projection: { password: 0 } }
    );

    const clubResponse = {
      _id: updatedClub._id,
      club_name: updatedClub.club_name,
      email: updatedClub.email,
      description: updatedClub.description,
      members: Array.isArray(updatedClub.members)
        ? updatedClub.members.map((m) => ({
            user_id: m.user_id,
            full_name: m.full_name,
            role_in_club: m.role_in_club,
          }))
        : [],
      updated_at: updatedClub.updated_at.toISOString(),
    };

    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin CLB thành công",
      data: { club: clubResponse },
    });
  } catch (err) {
    console.error("❌ Lỗi khi updateClub:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Xóa CLB
const deleteClub = async (req, res) => {
  try {
    const { id: clubIdParam } = req.params;

    const db = await connection();
    const clubsCollection = db.collection("clubs");
    const eventsCollection = db.collection("events");

    const clubDoc = await clubsCollection.findOne({ _id: clubIdParam });
    if (!clubDoc) {
      return res.status(404).json({
        success: false,
        message: "CLB không tồn tại",
      });
    }

    // Xóa các sự kiện liên quan
    await Promise.all([
      clubsCollection.deleteOne({ _id: clubIdParam }),
      eventsCollection.deleteMany({ "club.club_id": clubIdParam }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Xóa CLB thành công",
    });
  } catch (err) {
    console.error("❌ Lỗi khi deleteClub:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Thêm thành viên vào CLB
const addClubMember = async (req, res) => {
  try {
    const { club_id, user_id, role_in_club } = req.body;

    if (!club_id || !user_id || !role_in_club) {
      return res.status(400).json({
        success: false,
        message: "Thiếu club_id, user_id hoặc role_in_club",
      });
    }

    const db = await connection();
    const clubsCollection = db.collection("clubs");
    const usersCollection = db.collection("users");

    // Kiểm tra CLB tồn tại
    const club = await clubsCollection.findOne({ _id: club_id });
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "CLB không tồn tại",
      });
    }

    // Kiểm tra user tồn tại
    let userObjectId;
    try {
      userObjectId = new ObjectId(user_id);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "user_id không hợp lệ",
      });
    }

    const user = await usersCollection.findOne({ _id: userObjectId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    // Kiểm tra đã là thành viên chưa
    const existingMember = club.members.find((m) => m.user_id === user_id);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "Người dùng đã là thành viên của CLB",
      });
    }

    const newMember = {
      user_id: user_id,
      full_name: user.full_name,
      role_in_club: role_in_club,
    };

    await clubsCollection.updateOne(
      { _id: club_id },
      {
        $push: { members: newMember },
        $set: { updated_at: new Date() },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Thêm thành viên CLB thành công",
      data: { member: newMember },
    });
  } catch (err) {
    console.error("❌ Lỗi khi addClubMember:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Xóa thành viên khỏi CLB
const removeClubMember = async (req, res) => {
  try {
    const { club_id, user_id } = req.body;

    if (!club_id || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu club_id hoặc user_id",
      });
    }

    const db = await connection();
    const clubsCollection = db.collection("clubs");

    const club = await clubsCollection.findOne({ _id: club_id });
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "CLB không tồn tại",
      });
    }

    const existingMember = club.members.find((m) => m.user_id === user_id);
    if (!existingMember) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không phải thành viên của CLB",
      });
    }

    await clubsCollection.updateOne(
      { _id: club_id },
      {
        $pull: { members: { user_id: user_id } },
        $set: { updated_at: new Date() },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Xóa thành viên CLB thành công",
    });
  } catch (err) {
    console.error("❌ Lỗi khi removeClubMember:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Cập nhật vai trò thành viên trong CLB
const updateMemberRole = async (req, res) => {
  try {
    const { club_id, user_id, role_in_club } = req.body;

    if (!club_id || !user_id || !role_in_club) {
      return res.status(400).json({
        success: false,
        message: "Thiếu club_id, user_id hoặc role_in_club",
      });
    }

    const db = await connection();
    const clubsCollection = db.collection("clubs");

    const club = await clubsCollection.findOne({ _id: club_id });
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "CLB không tồn tại",
      });
    }

    const existingMember = club.members.find((m) => m.user_id === user_id);
    if (!existingMember) {
      return res.status(404).json({
        success: false,
        message: "Người dùng không phải thành viên của CLB",
      });
    }

    await clubsCollection.updateOne(
      { _id: club_id, "members.user_id": user_id },
      {
        $set: {
          "members.$.role_in_club": role_in_club,
          updated_at: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Cập nhật vai trò thành viên thành công",
      data: {
        user_id,
        role_in_club,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi updateMemberRole:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

// Lấy danh sách sự kiện của CLB
const getClubEvents = async (req, res) => {
  try {
    const { id: clubIdParam } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const db = await connection();
    const clubsCollection = db.collection("clubs");
    const eventsCollection = db.collection("events");

    // Convert clubIdParam to ObjectId for club lookup
    let clubObjectId;
    try {
      clubObjectId = new ObjectId(clubIdParam);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "club_id không hợp lệ",
      });
    }

    // Kiểm tra CLB tồn tại
    const club = await clubsCollection.findOne({ _id: clubObjectId });
    if (!club) {
      return res.status(404).json({
        success: false,
        message: "CLB không tồn tại",
      });
    }

    const total = await eventsCollection.countDocuments({
      "club.club_id": clubIdParam,
    });
    const pages = Math.ceil(total / limit);

    const events = await eventsCollection
      .find({ "club.club_id": clubIdParam })
      .skip(skip)
      .limit(limit)
      .toArray();

    const eventsResponse = events.map((event) => ({
      _id: event._id.toString(),
      title: event.title,
      description: event.description,
      start_time: event.start_time.toISOString(),
      end_time: event.end_time.toISOString(),
      location: event.location,
      max_participants: event.max_participants,
      category: event.category,
      status: event.status,
      created_at: event.created_at.toISOString(),
      updated_at: event.updated_at.toISOString(),
    }));

    return res.status(200).json({
      success: true,
      data: {
        club_name: club.club_name,
        events: eventsResponse,
        pagination: {
          page,
          pages,
          total,
        },
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi getClubEvents:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

module.exports = {
  createClub,
  getClubs,
  getClubById,
  updateClub,
  deleteClub,
  addClubMember,
  removeClubMember,
  updateMemberRole,
  getClubEvents,
};
