const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");
const { connection } = require("../config/database");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const db = await connection();
    const usersCollection = db.collection("users");
    const clubsCollection = db.collection("clubs");

    const userId = decoded.id;
    const isClub = decoded.isClub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    let user;
    if (isClub) {
      user = await clubsCollection.findOne({ _id: new ObjectId(userId) });
    } else {
      user = await usersCollection.findOne({ _id: new ObjectId(userId) });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    req.isClub = isClub;
    next();
  } catch (err) {
    console.error("❌ Lỗi trong middleware auth:", err);
    return res.status(500).json({
      success: false,
      message: "Server internal error",
    });
  }
};

const authorize = (requiredRole) => {
  return (req, res, next) => {
    try {
      const roles = Array.isArray(req.user.roles) ? req.user.roles : [];

      const has = roles.some((r) => r.role_name === requiredRole);
      if (!has) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: no permission",
        });
      }
      next();
    } catch (err) {
      console.error("❌ Lỗi trong middleware authorize:", err);
      return res.status(500).json({
        success: false,
        message: "Server internal error",
      });
    }
  };
};

module.exports = {
  auth,
  authorize,
};
