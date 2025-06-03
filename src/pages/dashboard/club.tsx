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
} from "antd";
import {
  CalendarOutlined,
  TeamOutlined,
  NotificationOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { mockEvents, mockRegisteredEvents } from "../../data/mockData";
import dayjs from "dayjs";

const ClubDashboard = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để truy cập trang này");
      router.push("/login");
      return;
    }

    if (userRole !== "club") {
      message.error("Bạn không có quyền truy cập trang này");
      router.push("/");
      return;
    }

    // Filter events for this club (in real app, this would be based on club ID)
    const clubEvents = mockEvents.filter(
      (event) => event.status === "Đã duyệt"
    );

    // Lọc sự kiện sắp diễn ra (dựa vào trạng thái)
    setUpcomingEvents(
      clubEvents.filter((event) => {
        return event.status === "Sắp diễn ra";
      })
    );

    // Lọc sự kiện đã diễn ra (dựa vào trạng thái)
    setPastEvents(
      clubEvents.filter((event) => {
        return event.status === "Đã đóng";
      })
    );
  }, [isAuthenticated, userRole, router]);

  const getEventAttendance = (eventId: string) => {
    return mockRegisteredEvents.filter(
      (reg) => reg.id === eventId && reg.attendance_status === "Đã tham gia"
    ).length;
  };

  const handleCloseEvent = (eventId: string) => {
    const event = mockEvents.find((e) => e.id === eventId);
    if (event) {
      event.status = "Đã đóng";
      // Cập nhật lại danh sách sự kiện
      const clubEvents = mockEvents.filter((e) => e.status === "Đã duyệt");
      setUpcomingEvents(clubEvents.filter((e) => e.status === "Sắp diễn ra"));
      setPastEvents(clubEvents.filter((e) => e.status === "Đã đóng"));
      message.success("Đã đóng sự kiện thành công!");
    }
  };

  if (!isAuthenticated || userRole !== "club") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
                    title="Sự Kiện Sắp Tới"
                    value={upcomingEvents.length}
                    prefix={<CalendarOutlined />}
                    className="text-gray-800"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <Statistic
                    title="Sự Kiện Đã Tổ Chức"
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
                    value={mockEvents.length}
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
                    <div className="flex gap-4 mt-2">
                      <Button
                        size="small"
                        onClick={() =>
                          router.push(`/events/${event.id}/manage`)
                        }
                      >
                        Quản lý
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          router.push(`/events/${event.id}/attendance`)
                        }
                      >
                        Điểm danh
                      </Button>
                      <Button
                        size="small"
                        danger
                        onClick={() => handleCloseEvent(event.id)}
                      >
                        Đóng sự kiện
                      </Button>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>

          <Card
            title="Sự Kiện Đã Tổ Chức"
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
                    <p className="text-gray-600 mt-1">
                      Số người tham gia: {getEventAttendance(event.id)}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <Button
                        size="small"
                        onClick={() =>
                          router.push(`/events/${event.id}/report`)
                        }
                      >
                        Xem báo cáo
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
