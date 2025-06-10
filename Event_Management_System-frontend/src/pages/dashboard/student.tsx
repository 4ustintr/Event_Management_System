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
  Spin,
  Space,
} from "antd";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { dashboardService } from "@/api/services/dashboard.service";
import {
  EditOutlined,
  UserOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined,
  TeamOutlined,
  StarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { User, Club } from "@/types/api.types";
import { eventService } from "@/api/services/event.service";

const StudentDashboard = () => {
  const { userRole, user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để truy cập trang này");
      router.push("/login");
      return;
    }

    if (userRole !== "student") {
      message.error("Bạn không có quyền truy cập trang này");
      router.push("/");
      return;
    }

    fetchDashboardData();
    fetchMyEventHistory();
  }, [isAuthenticated, userRole, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, eventsRes] = await Promise.all([
        dashboardService.getStatistics(),
        dashboardService.getUpcomingEvents(),
      ]);

      if (statsRes.success && eventsRes.success) {
        setDashboardData({
          statistics: statsRes.data,
          upcomingEvents: eventsRes.data.events,
        });
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      message.error("Không thể tải dữ liệu dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEventHistory = async () => {
    try {
      setLoading(true);
      const response = await eventService.getMyEventHistory();
      console.log("Event history response:", response);
      if (response && response.success) {
        // Map the history data to include event details
        const mappedEvents = response.data.history.map((item: any) => ({
          ...item.event,
          is_checked_in: item.checked_in,
          checked_in_at: item.checked_in_at,
          registration_id: item.registration_id,
          registered_at: item.registered_at,
          qr_code: item.qr_code,
        }));
        console.log("Mapped events:", mappedEvents);
        setEvents(mappedEvents);
      } else {
        message.error("Không thể tải lịch sử sự kiện");
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching event history:", error);
      message.error("Có lỗi xảy ra khi tải lịch sử sự kiện");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    if (userRole !== "student") return;
    const studentUser = user as User;
    form.setFieldsValue({
      full_name: studentUser?.full_name,
      phone: studentUser?.phone,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "green";
      case "draft":
        return "orange";
      case "completed":
        return "blue";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
      case "approved":
        return "Đang diễn ra";
      case "draft":
        return "Chờ duyệt";
      case "completed":
        return "Đã kết thúc";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const upcomingEvents = events.filter((event) => {
    const startTime = dayjs(event.start_time);
    return startTime.isAfter(dayjs());
  });

  const pastEvents = events.filter((event) => {
    const endTime = dayjs(event.end_time);
    return endTime.isBefore(dayjs());
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

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
                    {userRole === "student"
                      ? (user as User)?.full_name
                      : (user as Club)?.club_name || "Chưa cập nhật"}
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
                    title="Sự Kiện Sắp Tham Gia"
                    value={upcomingEvents.length}
                    prefix={<CalendarOutlined />}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Sự Kiện Đã Tham Gia"
                    value={pastEvents.length}
                    prefix={<CheckCircleOutlined />}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Tổng Số Sự Kiện"
                    value={events.length}
                    prefix={<TeamOutlined />}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
            </Row>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card
            title="Sự Kiện Sắp Tham Gia"
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Chưa có sự kiện sắp tham gia
              </div>
            ) : (
              <List
                dataSource={upcomingEvents}
                renderItem={(event) => (
                  <List.Item>
                    <div className="w-full">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">
                          {event.title}
                        </h3>
                        <Tag color={getStatusColor(event.status)}>
                          {getStatusText(event.status)}
                        </Tag>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")}
                      </p>
                      <p className="text-gray-600 mt-1">
                        Địa điểm: {event.location}
                      </p>
                      <div className="flex gap-4 mt-2">
                        <Button
                          size="small"
                          onClick={() => router.push(`/events/${event._id}`)}
                        >
                          Chi tiết
                        </Button>
                        {!event.is_checked_in && (
                          <Button
                            size="small"
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => router.push(`/events/${event._id}`)}
                          >
                            Check-in
                          </Button>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card
            title="Sự Kiện Đã Tham Gia"
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            {pastEvents.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Chưa có sự kiện đã tham gia
              </div>
            ) : (
              <List
                dataSource={pastEvents}
                renderItem={(event) => (
                  <List.Item>
                    <div className="w-full">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium text-gray-800">
                          {event.title}
                        </h3>
                        <Tag color={getStatusColor(event.status)}>
                          {getStatusText(event.status)}
                        </Tag>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")}
                      </p>
                      <p className="text-gray-600 mt-1">
                        Địa điểm: {event.location}
                      </p>
                      <div className="flex gap-4 mt-2">
                        <Button
                          size="small"
                          onClick={() => router.push(`/events/${event._id}`)}
                        >
                          Chi tiết
                        </Button>
                        {event.is_checked_in && !event.has_feedback && (
                          <Button
                            size="small"
                            type="primary"
                            icon={<StarOutlined />}
                            onClick={() => router.push(`/events/${event._id}`)}
                          >
                            Đánh giá
                          </Button>
                        )}
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
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
            name="full_name"
            label="Họ và tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input size="large" prefix={<UserOutlined />} />
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
          <Form.Item
            className=""
            name="password"
            label="Mật khẩu"
            rules={[
              { required: false, message: "Vui lòng nhập mật khẩu mớimới" },
            ]}
          >
            <Input size="large" prefix={<UserOutlined />}></Input>
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
