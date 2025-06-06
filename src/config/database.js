require('dotenv').config();
const { MongoClient } = require('mongodb');

// Kiểm tra xem biến môi trường đã được định nghĩa
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;

if (!uri) {
    console.error('❌ MONGODB_URI không được định nghĩa trong biến môi trường');
    console.error('Vui lòng tạo file .env với thông tin MONGODB_URI');
    process.exit(1);
}

const client = new MongoClient(uri, {
    maxPoolSize: 10
});

let _db = null;
async function connection() {
    if (_db) return _db;
    try {
        await client.connect();
        _db = client.db(dbName);
        console.log('✅ Connected to MongoDB:', dbName);
        return _db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        throw error;
    }
}

function getClient() {
    return client;
}

module.exports = { connection, getClient };
