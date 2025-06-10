# Hệ Thống Quản Lý Sự Kiện

## Tổng Quan

Hệ Thống Quản Lý Sự Kiện là một ứng dụng web toàn diện được thiết kế để hỗ trợ việc quản lý các sự kiện trong môi trường giáo dục. Hệ thống cung cấp các giao diện khác nhau cho sinh viên, câu lạc bộ và quản trị viên, cho phép họ tương tác với các sự kiện theo nhiều cách.

## Tính Năng

### Dành Cho Sinh Viên
- Duyệt và tìm kiếm các sự kiện sắp diễn ra
- Đăng ký tham gia sự kiện
- Xem các sự kiện đã đăng ký
- Truy cập mã QR để điểm danh tham gia
- Đánh giá và gửi phản hồi cho sự kiện đã tham gia
- Quản lý thông tin cá nhân

### Dành Cho Câu Lạc Bộ
- Tạo và quản lý sự kiện
- Theo dõi đăng ký và điểm danh sự kiện
- Gửi thông báo đến người tham gia
- Tạo báo cáo sự kiện
- Cập nhật thông tin sự kiện
- Điểm danh bằng quét mã QR

### Dành Cho Quản Trị Viên
- Phê duyệt hoặc từ chối yêu cầu tổ chức sự kiện
- Quản lý tài khoản sinh viên và câu lạc bộ
- Giám sát tất cả sự kiện trong hệ thống
- Tạo báo cáo quản trị

## Công Nghệ Sử Dụng

### Frontend
- **Framework**: Next.js, React
- **UI/CSS**: Tailwind CSS, Ant Design
- **UI Components**: Form, Table, Modal, Card, Button, v.v.
- **State Management**: Context API, React Hooks

### Backend
- **API**: RESTful API với Express.js
- **Máy chủ**: Node.js
- **Cơ sở dữ liệu**: MongoDB
- **Xác thực**: JWT (JSON Web Tokens)
- **Bảo mật**: bcrypt để mã hóa mật khẩu

### Công Nghệ Khác
- **Quản lý phiên bản**: Git, GitHub
- **Xác thực**: Hệ thống xác thực đa cấp
- **Thông báo**: Socket.io cho thông báo thời gian thực
- **Quản lý QR Code**: qrcode.js