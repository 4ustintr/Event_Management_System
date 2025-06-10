import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  List,
  Tag,
  Space,
  message,
  Spin,
} from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  NotificationOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { eventService } from "@/api/services/event.service";
import dayjs from "dayjs";

const ClubDashboard = () => {
  const router = useRouter();
  const { userRole, isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (!isAuthenticated) {
      messageApi.open({
        type: "error",
        content: "Vui lòng đăng nhập để truy cập trang này",
      });
      router.push("/login");
      return;
    }

    if (userRole !== "club") {
      messageApi.open({
        type: "error",
        content: "Bạn không có quyền truy cập trang này",
      });
      router.push("/");
      return;
    }

    fetchClubEvents();
  }, [isAuthenticated, userRole, router]);

  const fetchClubEvents = async () => {
    try {
      setLoading(true);
      if (!user) {
        messageApi.open({
          type: "error",
          content: "Không tìm thấy thông tin club",
        });
        return;
      }

      const clubId = user._id;
      const response = await eventService.getClubEvents(clubId);

      if (response && response.success && Array.isArray(response.data.events)) {
        setEvents(response.data.events);
      } else {
        messageApi.open({
          type: "error",
          content: "Không thể tải danh sách sự kiện",
        });
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      messageApi.open({
        type: "error",
        content: "Có lỗi xảy ra khi tải danh sách sự kiện",
      });
      setEvents([]);
    } finally {
      setLoading(false);
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

  const upcomingEvents = events.filter(
    (event) => event.status === "approved" || event.status === "active"
  );

  const pastEvents = events.filter((event) => {
    const endTime = dayjs(event.end_time);
    return endTime.isBefore(dayjs()) || event.status === "completed";
  });

  if (!isAuthenticated || userRole !== "club") {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải dữ liệu..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {contextHolder}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bảng Điều Khiển CLB
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Sự Kiện Đang Diễn Ra"
                    value={upcomingEvents.length}
                    prefix={<CalendarOutlined />}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Sự Kiện Đã Kết Thúc"
                    value={pastEvents.length}
                    prefix={<CalendarOutlined />}
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

          <Card
            title="Thao Tác Nhanh"
            className="shadow-sm hover:shadow-md transition-shadow duration-300"
          >
            <Space direction="vertical" className="w-full">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                onClick={() => router.push("/events/create")}
              >
                Tạo Sự Kiện Mới
              </Button>
              <Button
                icon={<TeamOutlined />}
                block
                onClick={() => router.push("/events/manage")}
              >
                Quản Lý Sự Kiện
              </Button>
            </Space>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card
            title="Sự Kiện Đang Diễn Ra"
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
                      <Tag color={getStatusColor(event.status)}>
                        {getStatusText(event.status)}
                      </Tag>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <Button
                        size="small"
                        onClick={() => router.push(`/events/${event._id}`)}
                      >
                        Chi tiết
                      </Button>
                      <Button
                        size="small"
                        onClick={() => router.push(`/events/manage`)}
                      >
                        Quản lý
                      </Button>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="Sự Kiện Đã Kết Thúc"
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
                      <Tag color={getStatusColor(event.status)}>
                        {getStatusText(event.status)}
                      </Tag>
                    </div>
                    <p className="text-gray-600 mt-1">
                      {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")}
                    </p>
                    <p className="text-gray-600 mt-1">
                      Số người tham gia: {event.registrations?.length || 0}/
                      {event.max_participants}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <Button
                        size="small"
                        onClick={() => router.push(`/events/${event._id}`)}
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClubDashboard;
