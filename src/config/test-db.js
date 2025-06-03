const { connection, getClient } = require("./database.js");

(async () => {
    try {
        const db = await connection();

        const collections = await db.listCollections().toArray();
        console.log("» Các collection trong database:", collections.map(col => col.name));

        await getClient().close();
        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi kết nối tới MongoDB:", err);
        process.exit(1);
    }
})();
