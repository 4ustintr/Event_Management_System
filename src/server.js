require('dotenv').config();
const express = require('express');
const apiRoutes = require('./routes/web');
const connection = require('./config/database');

const app = express();
const port = process.env.PORT || 3001;
const hostname = process.env.HOST_NAME || '0.0.0.0';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

connection.connection()
  .then(() => {
    console.log('Đã kết nối đến database thành công');
  })
  .catch(err => {
    console.error('Lỗi kết nối database:', err);
  });

app.listen(port, hostname, () => {
  console.log(`Server API chạy tại http://0.0.0.0:${port}`);
});
