import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Space,
  message,
  Tag,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Spin,
  List,
  Descriptions,
  Popconfirm,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TeamOutlined,
  CalendarOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { eventService } from "@/api/services/event.service";
import { notificationService } from "@/api/services/notification.service";
import { Event } from "@/types/api.types";
import dayjs from "dayjs";
import DeleteEventModal from "@/components/modals/DeleteEventModal";
import NotificationModal from "@/components/modals/NotificationModal";
import EditEventModal from "@/components/modals/EditEventModal";

const { RangePicker } = DatePicker;
const { Search } = Input;
const { Option } = Select;

const EventManagePage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const handleEventClick = (event: Event) => {
    router.push(`/events/${event._id}`);
  };

  const fetchClubEvents = async () => {
    try {
      setLoading(true);
      if (!user) {
        message.error("Không tìm thấy thông tin club");
        return;
      }

      // For club users, the user object itself is the club data
      const clubId = user._id;
      console.log("Fetching events for club:", clubId);
      const response = await eventService.getClubEvents(clubId);
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
    if (!isAuthenticated) {
      messageApi.open({
        type: "error",
        content: "Vui lòng đăng nhập để quản lý sự kiện",
      });
      router.push("/login");
      return;
    }

    if (userRole !== "club") {
      messageApi.open({
        type: "error",
        content: "Chỉ CLB mới có thể quản lý sự kiện",
      });
      router.push("/");
      return;
    }

    fetchClubEvents();
  }, [isAuthenticated, userRole, router, user]);

  const handleDelete = async () => {
    if (!selectedEvent?._id) {
      messageApi.open({
        type: "error",
        content: "Không tìm thấy thông tin sự kiện",
      });
      return;
    }
    try {
      // <<<--- BƯỚC 1: GỬI THÔNG BÁO TRƯỚC
      // Gửi thông báo rằng sự kiện sắp bị xóa, lúc này sự kiện vẫn còn trong DB
      await notificationService.sendEventNotification(selectedEvent._id, {
        title: "Sự kiện đã bị xóa",
        message: `Sự kiện "${selectedEvent.title}" đã bị xóa bởi CLB.`,
        type: "announcement",
      });

      // <<<--- BƯỚC 2: SAU KHI GỬI THÔNG BÁO THÀNH CÔNG, TIẾN HÀNH XÓA SỰ KIỆN
      await eventService.deleteEvent(selectedEvent._id);

      messageApi.open({
        type: "success",
        content: "Sự kiện đã được xóa thành công!",
      });
      setIsDeleteModalVisible(false);
      setSelectedEvent(null);
      fetchClubEvents(); // Tải lại danh sách sự kiện
    } catch (error: any) {
      console.error("Failed to delete event:", error);
      messageApi.open({
        type: "error",
        content:
          error.response?.data?.message || "Có lỗi xảy ra khi xóa sự kiện.",
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleSendNotification = async (values: any) => {
    try {
      const response = await eventService.sendNotification(values.eventId, {
        title: values.title,
        message: values.message,
        type: values.type,
      });

      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Thông báo đã được gửi thành công!",
        });
        setIsNotificationModalVisible(false);
        fetchClubEvents();
      } else {
        messageApi.open({
          type: "error",
          content: "Không thể gửi thông báo",
        });
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Đã xảy ra lỗi khi gửi thông báo",
      });
    }
  };

  const handleFilter = () => {
    try {
      const filtered = events.filter((event) => {
        const matchesSearch = event.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          !selectedCategory || event.category === selectedCategory;
        const matchesStatus =
          !selectedStatus || event.status === selectedStatus;
        const matchesDate =
          !dateRange ||
          (dayjs(event.start_time).isAfter(dateRange[0]) &&
            dayjs(event.end_time).isBefore(dateRange[1]));
        return matchesSearch && matchesCategory && matchesStatus && matchesDate;
      });
      setFilteredEvents(filtered);
      if (filtered.length === 0) {
        message.info("Không tìm thấy sự kiện nào phù hợp với bộ lọc");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi lọc sự kiện");
    }
  };

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
        return "Bản nháp";
      case "completed":
        return "Đã kết thúc";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const handleEditSubmit = async (formData: FormData) => {
    try {
      setEditLoading(true);
      const eventId = formData.get("eventId") as string;

      const response = await eventService.updateEvent(eventId, formData);

      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Cập nhật sự kiện thành công!",
        });
        setIsEditModalVisible(false);
        fetchClubEvents();
      } else {
        messageApi.open({
          type: "error",
          content: response.message || "Không thể cập nhật sự kiện",
        });
      }
    } catch (error: any) {
      messageApi.open({
        type: "error",
        content:
          error.response?.data?.message || "Không thể cập nhật sự kiện",
      });
    } finally {
      setEditLoading(false);
    }
  };

  if (loading || !isAuthenticated || userRole !== "club") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải danh sách sự kiện..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Quản Lý Sự Kiện
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              type="primary"
              size="large"
              icon={<EditOutlined />}
              onClick={() => setIsEditModalVisible(true)}
              className="flex-1 sm:flex-none sm:w-[180px]"
            >
              Chỉnh sửa sự kiện
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<NotificationOutlined />}
              onClick={() => setIsNotificationModalVisible(true)}
              className="flex-1 sm:flex-none sm:w-[180px]"
            >
              Gửi Thông Báo
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => router.push("/events/create")}
              className="flex-1 sm:flex-none sm:w-[180px]"
            >
              Tạo Sự Kiện Mới
            </Button>
          </div>
        </div>

        <Card className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Search
                placeholder="Tìm kiếm sự kiện..."
                allowClear
                enterButton={<SearchOutlined />}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="col-span-1">
              <Select
                placeholder="Lọc theo thể loại"
                style={{ width: "100%" }}
                allowClear
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                <Option value="academic">Học thuật</Option>
                <Option value="sports">Thể thao</Option>
                <Option value="cultural">Văn hóa</Option>
                <Option value="social">Xã hội</Option>
              </Select>
            </div>
            <div className="col-span-1">
              <Select
                placeholder="Lọc theo trạng thái"
                style={{ width: "100%" }}
                allowClear
                value={selectedStatus}
                onChange={handleStatusChange}
              >
                <Option value="active">Đang diễn ra</Option>
                <Option value="draft">Bản nháp</Option>
                <Option value="completed">Đã kết thúc</Option>
                <Option value="cancelled">Đã hủy</Option>
              </Select>
            </div>
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <RangePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                onChange={handleDateRangeChange}
                className="w-full"
                size="large"
              />
            </div>
          </div>
        </Card>

        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 2,
            lg: 2,
            xl: 3,
            xxl: 3,
          }}
          dataSource={filteredEvents.length > 0 ? filteredEvents : events}
          renderItem={(event) => (
            <List.Item>
              <Card
                hoverable
                className="h-full"
                onClick={() => router.push(`/events/${event._id}`)}
                actions={[
                  <Button
                    key="edit"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/events/${event._id}?edit=1`);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Chi tiết sự kiện
                  </Button>,
                  <Button
                    key="delete"
                    icon={<DeleteOutlined />}
                    danger
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(event);
                      setIsDeleteModalVisible(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    Xóa
                  </Button>,
                ]}
              >
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {event.title}
                    </h3>
                    <Tag color={getStatusColor(event.status)}>
                      {getStatusText(event.status)}
                    </Tag>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-500">
                      <CalendarOutlined className="mr-2" />
                      <span className="text-sm sm:text-base">
                        {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <TeamOutlined className="mr-2" />
                      <span className="text-sm sm:text-base">
                        {event.registrations?.length || 0}/
                        {event.max_participants} người tham gia
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />

        <EditEventModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSubmit={handleEditSubmit}
          events={events}
          loading={editLoading}
        />

        <DeleteEventModal
          visible={isDeleteModalVisible}
          onClose={() => setIsDeleteModalVisible(false)}
          onConfirm={handleDelete}
          event={selectedEvent}
        />

        <NotificationModal
          visible={isNotificationModalVisible}
          onClose={() => setIsNotificationModalVisible(false)}
          onSubmit={handleSendNotification}
          events={events}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default EventManagePage;