import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Modal,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { mockEvents } from "../../data/mockData";
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const EventManagePage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để quản lý sự kiện");
      router.push("/login");
      return;
    }

    if (userRole !== "club") {
      message.error("Chỉ CLB mới có thể quản lý sự kiện");
      router.push("/");
      return;
    }

    // Lọc sự kiện của CLB hiện tại
    const clubEvents = mockEvents.filter(
      (event) => event.status === "Đã duyệt"
    );
    setEvents(clubEvents);
  }, [isAuthenticated, userRole, router]);

  const handleDelete = () => {
    if (selectedEvent) {
      try {
        const eventIndex = mockEvents.findIndex(
          (e) => e.id === selectedEvent.id
        );
        if (eventIndex !== -1) {
          mockEvents.splice(eventIndex, 1);
          setEvents(events.filter((e) => e.id !== selectedEvent.id));
          message.success("Xóa sự kiện thành công!");
          setIsDeleteModalVisible(false);
        }
      } catch (error) {
        message.error("Có lỗi xảy ra khi xóa sự kiện");
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesCategory =
      !selectedCategory || event.category === selectedCategory;
    const matchesDate =
      !dateRange ||
      (dayjs(event.start_time).isAfter(dateRange[0]) &&
        dayjs(event.end_time).isBefore(dateRange[1]));
    return matchesSearch && matchesCategory && matchesDate;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Sự Kiện</h1>
          <Button
            type="primary"
            size="large"
            onClick={() => router.push("/events/create")}
          >
            Tạo Sự Kiện Mới
          </Button>
        </div>

        <Card className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Tìm kiếm sự kiện..."
              prefix={<SearchOutlined />}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
              size="large"
            />
            <Select
              placeholder="Lọc theo thể loại"
              onChange={handleCategoryChange}
              allowClear
              className="w-full"
              size="large"
            >
              <Select.Option value="Học thuật">Học thuật</Select.Option>
              <Select.Option value="Thể thao">Thể thao</Select.Option>
              <Select.Option value="Kỹ năng">Kỹ năng</Select.Option>
              <Select.Option value="Kinh doanh">Kinh doanh</Select.Option>
              <Select.Option value="Ngoại ngữ">Ngoại ngữ</Select.Option>
              <Select.Option value="Văn hóa">Văn hóa</Select.Option>
              <Select.Option value="Khác">Khác</Select.Option>
            </Select>
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              onChange={handleDateRangeChange}
              className="w-full"
              size="large"
            />
          </div>
        </Card>

        <Row gutter={[24, 24]}>
          {filteredEvents.map((event) => (
            <Col xs={24} sm={12} lg={8} key={event.id}>
              <Card
                hoverable
                className="h-full transition-all duration-300 hover:shadow-lg"
                cover={
                  <div className="relative h-48 overflow-hidden">
                    <img
                      alt={event.title}
                      src={
                        event.banner_url ||
                        "https://via.placeholder.com/400x200?text=Event+Banner"
                      }
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4">
                      <Tag
                        color={
                          event.status === "Sắp diễn ra" ? "blue" : "green"
                        }
                      >
                        {event.status}
                      </Tag>
                    </div>
                  </div>
                }
                actions={[
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => router.push(`/events/${event.id}/manage`)}
                  >
                    Chi tiết sự kiện
                  </Button>,
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setSelectedEvent(event);
                      setIsDeleteModalVisible(true);
                    }}
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                    {event.title}
                  </h3>
                  <div className="space-y-2">
                    <p className="flex items-center text-gray-600">
                      <CalendarOutlined className="mr-2" />
                      {new Date(event.start_time).toLocaleString()}
                    </p>
                    <p className="flex items-center text-gray-600">
                      <EnvironmentOutlined className="mr-2" />
                      {event.location}
                    </p>
                    <p className="flex items-center text-gray-600">
                      <TeamOutlined className="mr-2" />
                      {event.registered_count}/{event.max_participants} người
                      đăng ký
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag color="blue">{event.category}</Tag>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Modal Xóa sự kiện */}
      <Modal
        title="Xác nhận xóa sự kiện"
        open={isDeleteModalVisible}
        onOk={handleDelete}
        onCancel={() => setIsDeleteModalVisible(false)}
        okText="Xóa"
        cancelText="Hủy"
        okButtonProps={{ danger: true }}
      >
        <p>Bạn có chắc chắn muốn xóa sự kiện "{selectedEvent?.title}" không?</p>
        <p className="text-red-500">Lưu ý: Hành động này không thể hoàn tác.</p>
      </Modal>
    </div>
  );
};

export default EventManagePage;
