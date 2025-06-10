import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  List,
  Tag,
  message,
  Spin,
} from "antd";
import {
  SearchOutlined,
  CalendarOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { eventService } from "@/api/services/event.service";
import { useRouter } from "next/router";
import dayjs from "dayjs";
import { Event } from "@/types/api.types";

const { Search } = Input;
const { Option } = Select;

const EventsPage = () => {
  const { userRole, user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const fetchEvents = async () => {
    try {
      setLoading(true);
      let response;

      if (userRole === "club" && user?._id) {
        // Nếu là club, lấy sự kiện của club đó
        response = await eventService.getClubEvents(user._id);
      } else {
        // Nếu là student hoặc chưa đăng nhập, lấy tất cả sự kiện
        response = await eventService.getEvents();
      }

      console.log("API Response:", response);

      if (response && response.success && Array.isArray(response.data.events)) {
        setEvents(response.data.events);
      } else {
        console.error("Invalid response format:", response);
        message.error("Không thể tải danh sách sự kiện");
        setEvents([]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      message.error("Có lỗi xảy ra khi tải danh sách sự kiện");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userRole, user?._id]);

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || event.category === selectedCategory;
    const matchesStatus = !selectedStatus || event.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải danh sách sự kiện..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {userRole === "club" ? "Quản lý sự kiện" : "Danh sách sự kiện"}
          </h1>
          {userRole === "club" && (
            <Button
              type="primary"
              onClick={() => router.push("/events/create")}
            >
              Tạo sự kiện mới
            </Button>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Search
                placeholder="Tìm kiếm sự kiện..."
                allowClear
                enterButton={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                placeholder="Lọc theo thể loại"
                style={{ width: "100%" }}
                allowClear
                value={selectedCategory}
                onChange={setSelectedCategory}
              >
                <Option value="academic">Học thuật</Option>
                <Option value="sports">Thể thao</Option>
                <Option value="cultural">Văn hóa</Option>
                <Option value="social">Xã hội</Option>
              </Select>
            </Col>
            <Col xs={24} md={8}>
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: "100%" }}
                allowClear
                value={selectedStatus}
                onChange={setSelectedStatus}
              >
                <Option value="active">Đang diễn ra</Option>
                <Option value="draft">Bản nháp</Option>
                <Option value="completed">Đã kết thúc</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
            </Col>
          </Row>
        </div>

        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 2,
            lg: 3,
            xl: 3,
            xxl: 4,
          }}
          dataSource={filteredEvents}
          renderItem={(event) => (
            <List.Item>
              <Card
                hoverable
                className="h-full"
                onClick={() => router.push(`/events/${event._id}`)}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {event.title}
                    </h3>
                    <Tag color={getStatusColor(event.status)}>
                      {getStatusText(event.status)}
                    </Tag>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-500">
                      <CalendarOutlined className="mr-2" />
                      <span>
                        {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <TeamOutlined className="mr-2" />
                      <span>
                        {event.registrations?.length || 0}/
                        {event.max_participants} người tham gia
                      </span>
                    </div>
                    {userRole !== "club" && (
                      <div className="text-gray-500">
                        CLB: {event.club?.club_name || "N/A"}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default EventsPage;
