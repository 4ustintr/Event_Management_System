require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { connection } = require("../config/database");

const register = async (req, res) => {
  try {
    const { email, password, full_name, phone, roles } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: "Thiếu email, password hoặc full_name",
      });
    }

    // Validate và normalize roles
    if (
      !roles ||
      !Array.isArray(roles) ||
      roles.length === 0 ||
      !roles[0] ||
      typeof roles[0].role_name !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu hoặc sai định dạng thông tin vai trò (roles). Vui lòng cung cấp một mảng các đối tượng có thuộc tính 'role_name' hợp lệ.",
      });
    }

    // roleArray will now always be an array of objects with a string role_name
    const roleArray = roles;

    // Map Vietnamese to English role names
    const roleMapping = {
      "sinh viên": "student",
      sinh_vien: "student",
      student: "student",
      "câu lạc bộ": "club",
      cau_lac_bo: "club",
      club: "club",
      clb: "club",
      "quản trị viên": "admin",
      quan_tri_vien: "admin",
      admin: "admin",
    };

    const normalizedRole = roleMapping[roleArray[0].role_name.toLowerCase()]; // Corrected: Access role_name
    if (!normalizedRole) {
      return res.status(400).json({
        success: false,
        message: `Vai trò không hợp lệ. Các vai trò được hỗ trợ: student/sinh viên, club/câu lạc bộ, admin/quản trị viên`,
      });
    }

    // Validate club email format
    if (normalizedRole === "club" && !email.endsWith("@club.clb")) {
      return res.status(400).json({
        success: false,
        message: "Email của CLB phải có đuôi @club.clb",
      });
    }

    const db = await connection();
    const usersCollection = db.collection("users");

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create role object based on normalized role
    let roleObject;
    if (normalizedRole === "student") {
      roleObject = {
        role_id: uuidv4(),
        role_name: "student",
        description: "Sinh viên",
      };
    } else if (normalizedRole === "club") {
      roleObject = {
        role_id: uuidv4(),
        role_name: "club",
        description: "Câu lạc bộ",
      };
    } else if (normalizedRole === "admin") {
      roleObject = {
        role_id: uuidv4(),
        role_name: "admin",
        description: "Quản trị viên",
      };
    }

    const now = new Date();

    if (normalizedRole === "club") {
      const clubsCollection = db.collection("clubs");

      const existingClub = await clubsCollection.findOne({ email });
      if (existingClub) {
        return res.status(409).json({
          success: false,
          message: "Email CLB đã được đăng ký trước đó",
        });
      }

      const newClub = {
        club_name: full_name, // User's full_name becomes club_name
        name: full_name, // Add 'name' field to match the unique index
        email,
        password: hashedPassword, // Store hashed password for club
        description: "", // Default, can be updated later
        phone: phone || "",
        address: "", // Default, can be updated later
        established_date: now,
        members: [], // Initially empty, members will be added later
        created_at: now,
        updated_at: now,
      };

      console.log("📝 Registering new club:", {
        email,
        club_name: full_name,
      });
      const result = await clubsCollection.insertOne(newClub);
      console.log("✅ Club registered with ID:", result.insertedId.toString());

      // Prepare response for a club login
      const payload = { id: result.insertedId.toString(), isClub: true }; // Add isClub flag
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const clubResponse = {
        _id: result.insertedId.toString(),
        club_name: newClub.club_name,
        email: newClub.email,
        phone: newClub.phone,
        description: newClub.description,
        address: newClub.address,
        established_date: newClub.established_date.toISOString(),
        members: newClub.members,
        // Manually add a "club" role for consistency with frontend expectations
        roles: [
          {
            role_id: roleObject.role_id, // Reuse the generated role_id
            role_name: "club",
            description: "Câu lạc bộ",
          },
        ],
        created_at: newClub.created_at.toISOString(),
        updated_at: newClub.updated_at.toISOString(),
      };

      return res.status(201).json({
        success: true,
        message: "Đăng ký CLB thành công",
        data: {
          token,
          user: clubResponse, // Return club data as 'user' for frontend consistency
        },
      });
    } else {
      // Handle student and admin roles (existing logic)
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email đã được đăng ký trước đó",
        });
      }

      const newUser = {
        email,
        password: hashedPassword,
        full_name,
        phone: phone || "",
        roles: [roleObject],
        created_at: now,
        updated_at: now,
      };

      console.log("📝 Creating new user:", {
        email,
        role: normalizedRole,
        full_name,
      });
      const result = await usersCollection.insertOne(newUser);
      console.log("✅ User created with ID:", result.insertedId.toString());

      const payload = { id: result.insertedId.toString() };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      const userResponse = {
        _id: result.insertedId.toString(),
        email: newUser.email,
        full_name: newUser.full_name,
        phone: newUser.phone,
        roles: newUser.roles.map((r) => ({
          role_id: r.role_id,
          role_name: r.role_name,
          description: r.description,
        })),
        created_at: newUser.created_at.toISOString(),
        updated_at: newUser.updated_at.toISOString(),
      };

      return res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          token,
          user: userResponse,
        },
      });
    }
  } catch (err) {
    console.error("❌ Lỗi khi register:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Thiếu email hoặc password",
      });
    }

    const db = await connection();
    const usersCollection = db.collection("users");
    const clubsCollection = db.collection("clubs");

    let userDoc = await usersCollection.findOne({ email });
    let isClub = false;

    // If not found in users, try to find in clubs collection
    if (!userDoc) {
      userDoc = await clubsCollection.findOne({ email });
      if (userDoc) {
        isClub = true;
      }
    }

    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const isMatch = await bcrypt.compare(password, userDoc.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email hoặc mật khẩu không chính xác",
      });
    }

    const payload = { id: userDoc._id.toString(), isClub: isClub };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    let userResponse;
    if (isClub) {
      userResponse = {
        _id: userDoc._id.toString(),
        club_name: userDoc.club_name || "",
        email: userDoc.email,
        phone: userDoc.phone || "",
        description: userDoc.description || "",
        address: userDoc.address || "",
        established_date: userDoc.established_date
          ? userDoc.established_date.toISOString()
          : null,
        members: Array.isArray(userDoc.members)
          ? userDoc.members.map((m) => ({
              user_id: m.user_id?.toString ? m.user_id.toString() : m.user_id,
              full_name: m.full_name,
              role_in_club: m.role_in_club,
            }))
          : [],
        roles: [
          {
            role_id: "club-role-id", // Placeholder, actual role_id can be fetched or set during registration
            role_name: "club",
            description: "Câu lạc bộ",
          },
        ],
        created_at: userDoc.created_at
          ? userDoc.created_at.toISOString()
          : null,
        updated_at: userDoc.updated_at
          ? userDoc.updated_at.toISOString()
          : null,
      };
    } else {
      userResponse = {
        _id: userDoc._id.toString(),
        email: userDoc.email,
        full_name: userDoc.full_name || "",
        phone: userDoc.phone || "",
        roles: Array.isArray(userDoc.roles)
          ? userDoc.roles.map((r) => ({
              role_id: r.role_id?.toString ? r.role_id.toString() : r.role_id,
              role_name: r.role_name,
              description: r.description,
            }))
          : [],
        created_at: userDoc.created_at
          ? userDoc.created_at.toISOString()
          : null,
        updated_at: userDoc.updated_at
          ? userDoc.updated_at.toISOString()
          : null,
      };
    }

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: {
        token,
        user: userResponse,
      },
    });
  } catch (err) {
    console.error("❌ Lỗi khi login:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

const logout = async (req, res) => {
  try {
    // For JWT, logout typically happens client-side by removing the token.
    // The backend just needs to confirm the request is received.
    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (err) {
    console.error("❌ Lỗi khi logout:", err);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
};
