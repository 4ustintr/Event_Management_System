import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Tag,
  Button,
  Form,
  Input,
  Modal,
  message,
} from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { mockEvents } from "../../data/mockData";
import {
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from "@ant-design/icons";

const StudentDashboard = () => {
  const { userRole, user } = useAuth();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (userRole !== "student") {
      router.push("/login");
    }
  }, [userRole, router]);

  const upcomingEvents = mockEvents.filter(
    (event) => new Date(event.start_time) > new Date()
  );

  const pastEvents = mockEvents.filter(
    (event) => new Date(event.start_time) <= new Date()
  );

  const handleEditProfile = () => {
    form.setFieldsValue({
      fullName: user?.fullName,
      studentId: user?.studentId,
      phone: user?.phone,
    });
    setIsEditModalVisible(true);
  };

  const handleSaveProfile = async (values: any) => {
    try {
      // TODO: Call API to update user profile
      message.success("Cập nhật thông tin thành công!");
      setIsEditModalVisible(false);
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật thông tin!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Bảng Điều Khiển Sinh Viên
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Thông tin cá nhân */}
          <Card
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
            title={
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Thông Tin Cá Nhân</span>
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  onClick={handleEditProfile}
                />
              </div>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <UserOutlined className="text-gray-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-500">Họ và tên</p>
                  <p className="font-medium">
                    {user?.fullName || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <IdcardOutlined className="text-gray-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-500">Mã sinh viên</p>
                  <p className="font-medium">
                    {user?.studentId || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PhoneOutlined className="text-gray-400 text-xl" />
                <div>
                  <p className="text-sm text-gray-500">Số điện thoại</p>
                  <p className="font-medium">
                    {user?.phone || "Chưa cập nhật"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Thống kê */}
          <div className="lg:col-span-2 space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Sự Kiện Sắp Tới"
                    value={upcomingEvents.length}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Sự Kiện Đã Tham Gia"
                    value={pastEvents.length}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Tổng Số Sự Kiện"
                    value={mockEvents.length}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card
            title="Sự Kiện Sắp Tới"
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <List
              dataSource={upcomingEvents}
              renderItem={(event) => (
                <List.Item>
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">
                        {event.title}
                      </h3>
                      <Tag color="blue">Sắp diễn ra</Tag>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {new Date(event.start_time).toLocaleString()}
                    </p>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="Sự Kiện Đã Tham Gia"
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <List
              dataSource={pastEvents}
              renderItem={(event) => (
                <List.Item>
                  <div className="w-full">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">
                        {event.title}
                      </h3>
                      <Tag color="green">Đã hoàn thành</Tag>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {new Date(event.start_time).toLocaleString()}
                    </p>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </div>
      </div>

      <Modal
        title="Chỉnh Sửa Thông Tin Cá Nhân"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProfile}
          className="px-4"
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input size="large" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="studentId"
            label="Mã sinh viên"
            rules={[{ required: true, message: "Vui lòng nhập mã sinh viên" }]}
          >
            <Input size="large" prefix={<IdcardOutlined />} />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại" },
              { pattern: /^[0-9]{10}$/, message: "Số điện thoại không hợp lệ" },
            ]}
          >
            <Input size="large" prefix={<PhoneOutlined />} />
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2">
              <Button
                type="default"
                onClick={() => setIsEditModalVisible(false)}
                className="flex-1"
                size="large"
              >
                Hủy
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="flex-1"
                size="large"
              >
                Lưu thay đổi
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentDashboard;
