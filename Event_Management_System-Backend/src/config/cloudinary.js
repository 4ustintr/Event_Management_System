// Event_Management_System-Backend/src/config/cloudinary.js

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

// Cấu hình Cloudinary với các biến môi trường
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình CloudinaryStorage engine cho Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'event_banners', // Tên thư mục trên Cloudinary để lưu ảnh
    allowed_formats: ['jpg', 'png', 'jpeg'], // Chỉ cho phép các định dạng ảnh này
    transformation: [{ width: 1200, height: 400, crop: 'limit' }], // Tùy chọn transform ảnh
  },
});

// Khởi tạo Multer với storage engine đã cấu hình
const uploader = multer({ storage: storage });

module.exports = uploader;