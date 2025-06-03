require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = `mongodb+srv://austin:2005@btl-event.9jybh2j.mongodb.net/?retryWrites=true&w=majority&appName=btl-event`;

const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10
});

let _db = null;
async function connection() {
    if (_db) return _db;
    await client.connect();
    _db = client.db('mongo_databse');
    console.log('✅ Connected to MongoDB');
    return _db;
}

function getClient() {
    return client;
}

module.exports = { connection, getClient };
