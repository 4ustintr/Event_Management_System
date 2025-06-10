require("dotenv").config();
const express = require("express");
const connection = require("./config/database");

// Import các routes chuyên biệt
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const clubRoutes = require("./routes/clubs");
const eventRoutes = require("./routes/events");
const notificationRoutes = require("./routes/notifications");
const statisticsRoutes = require("./routes/statistics");

const app = express();
const port = process.env.PORT || 2301;
const hostname = process.env.HOST_NAME || "0.0.0.0";

// CORS configuration
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sử dụng các routes chuyên biệt
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statistics", statisticsRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Event Management System API đang hoạt động",
    timestamp: new Date().toISOString(),
  });
});

connection
  .connection()
  .then(() => {
    console.log("Đã kết nối đến database thành công");
  })
  .catch((err) => {
    console.error("Lỗi kết nối database:", err);
  });

app.listen(port, hostname, () => {
  console.log(`Server API chạy tại http://0.0.0.0:${port}`);
  console.log(`Tài liệu API: xem file API_Testing_Guide.md`);
});
