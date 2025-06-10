import { useState, useEffect } from "react";
import {
  List,
  Card,
  Button,
  message,
  Input,
  Select,
  DatePicker,
  Form,
  Rate,
  Spin,
  Tag,
  Row,
  Col,
  Descriptions,
} from "antd";
import { eventService } from "@/api/services/event.service";
import { Event } from "@/types/api.types";
import {
  SearchOutlined,
  QrcodeOutlined,
  StarOutlined,
} from "@ant-design/icons";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import EventReminder from "../../components/EventReminder";
import EventFeedback from "../../components/EventFeedback";
import QRCodeModal from "@/components/modals/QRCodeModal";

const { Option } = Select;
const { RangePicker } = DatePicker;

const RegisteredEventsPage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchRegisteredEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getMyEventHistory();
      console.log("API Response:", response);
      if (response.success) {
        const mappedEvents = response.data.history.map((item: any) => ({
          ...item.event,
          registrations: [
            {
              registered_at: item.registered_at,
              checked_in: item.checked_in,
              checked_in_at: item.checked_in_at,
              qr_code: item.qr_code,
            },
          ],
        }));
        console.log("Mapped Events:", mappedEvents);
        setEvents(mappedEvents);
        setFilteredEvents(mappedEvents);
      } else {
        messageApi.open({
          type: "error",
          content: "Không thể tải danh sách sự kiện đã đăng ký",
        });
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      messageApi.open({
        type: "error",
        content: "Đã xảy ra lỗi khi tải danh sách sự kiện đã đăng ký",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để xem sự kiện đã đăng ký");
      router.push("/login");
      return;
    }

    if (userRole !== "student") {
      message.error("Chỉ sinh viên mới có thể xem sự kiện đã đăng ký");
      router.push("/events");
      return;
    }

    fetchRegisteredEvents();
  }, [isAuthenticated, userRole, router, refreshKey]);

  const showQRCode = (event: Event) => {
    setSelectedEvent(event);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };

  const handleFeedback = (event: Event) => {
    setSelectedEvent(event);
    setIsFeedbackModalVisible(true);
  };

  const handleFeedbackSubmit = async (feedbackData: {
    rating: number;
    comment: string;
  }) => {
    const eventId = selectedEvent?._id;
    if (!eventId) {
      message.error("Không tìm thấy thông tin sự kiện");
      return;
    }
    try {
      const response = await eventService.submitFeedback(eventId, feedbackData);
      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Cảm ơn bạn đã gửi đánh giá!",
        });
        setIsFeedbackModalVisible(false);
        setRefreshKey((prev) => prev + 1);
      } else {
        messageApi.open({
          type: "error",
          content: "Không thể gửi đánh giá",
        });
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Đã xảy ra lỗi khi gửi đánh giá",
      });
    }
  };

  const getEventRating = (eventId: string | undefined) => {
    if (!eventId) return 0;
    const event = events.find((e) => e._id === eventId);
    if (event && (event as any).average_rating) {
      return (event as any).average_rating;
    }
    const eventRatings = ratings.filter((r) => r.eventId === eventId);
    if (eventRatings.length === 0) return 0;
    const averageRating =
      eventRatings.reduce((acc, curr) => acc + curr.rating, 0) /
      eventRatings.length;
    return averageRating;
  };

  const handleCancelRegistration = async (eventId: string) => {
    try {
      const response = await eventService.cancelEventRegistration(eventId);
      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Đã hủy đăng ký sự kiện thành công",
        });
        fetchRegisteredEvents();
      } else {
        messageApi.open({
          type: "error",
          content: "Không thể hủy đăng ký sự kiện",
        });
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Đã xảy ra lỗi khi hủy đăng ký sự kiện",
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
          categoryFilter === "all" || event.category === categoryFilter;
        const matchesStatus =
          statusFilter === "all" || event.status === statusFilter;

        let matchesDate = true;
        if (dateRange && dateRange[0] && dateRange[1]) {
          const eventDate = dayjs(event.start_time);
          matchesDate =
            eventDate.isAfter(dateRange[0]) && eventDate.isBefore(dateRange[1]);
        }

        return matchesSearch && matchesCategory && matchesStatus && matchesDate;
      });

      if (filtered.length === 0) {
        message.info("Không tìm thấy sự kiện nào phù hợp với bộ lọc");
      }
      setFilteredEvents(filtered);
    } catch (error) {
      message.error("Đã xảy ra lỗi khi lọc sự kiện");
    }
  };

  useEffect(() => {
    handleFilter();
  }, [searchTerm, categoryFilter, statusFilter, dateRange]);

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const isPastEvent = (eventDate: string) => {
    return dayjs(eventDate).isBefore(dayjs());
  };

  if (loading || !isAuthenticated || userRole !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải sự kiện đã đăng ký..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EventReminder />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Lịch Sử Sự Kiện Đã Đăng Ký
        </h1>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <Input
              placeholder="Tìm kiếm sự kiện..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/3"
              size="large"
            />
            <Select
              defaultValue="all"
              onChange={(value) => setCategoryFilter(value)}
              className="w-full md:w-1/4"
              size="large"
            >
              <Option value="all">Tất cả thể loại</Option>
              <Option value="Học thuật">Học thuật</Option>
              <Option value="Thể thao">Thể thao</Option>
              <Option value="Kỹ năng">Kỹ năng</Option>
              <Option value="Kinh doanh">Kinh doanh</Option>
              <Option value="Văn hóa">Văn hóa</Option>
              <Option value="Khác">Khác</Option>
            </Select>
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              onChange={(dates) => setDateRange(dates)}
              disabledDate={disabledDate}
              className="w-full md:w-1/3"
              placeholder={["Từ ngày", "Đến ngày"]}
              size="large"
            />
          </div>
        </div>

        <List
          grid={{ gutter: 24, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={filteredEvents}
          renderItem={(event) => (
            <List.Item>
              <Card
                hoverable
                cover={
                  <img
                    alt={event.title}
                    src={event.banner_url}
                    className="h-48 object-cover"
                  />
                }
                title={
                  <div className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {event.title}
                  </div>
                }
                className="shadow-sm hover:shadow-md transition-shadow duration-300 h-full"
              >
                <div className="flex flex-col h-full">
                  <div className="flex-grow space-y-3">
                    <p className="text-sm text-gray-600">
                      <strong>Thời gian bắt đầu:</strong>{" "}
                      {dayjs(event.start_time).format("DD/MM/YYYY HH:mm")}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Thời gian kết thúc:</strong>{" "}
                      {dayjs(event.end_time).format("DD/MM/YYYY HH:mm")}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Địa điểm:</strong> {event.location}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Thể loại:</strong> {event.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Ngày đăng ký:</strong>{" "}
                      {dayjs(event.registrations?.[0]?.registered_at).format(
                        "DD/MM/YYYY HH:mm"
                      )}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <Button
                      onClick={() => showQRCode(event)}
                      icon={<QrcodeOutlined />}
                      className="mr-2"
                    >
                      QR Code
                    </Button>
                    <Button
                      onClick={() => handleFeedback(event)}
                      icon={<StarOutlined />}
                      disabled={!isPastEvent(event.end_time)}
                    >
                      Đánh giá
                    </Button>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />

        <QRCodeModal
          visible={isModalVisible}
          onClose={handleModalClose}
          event={selectedEvent}
        />

        {selectedEvent && (
          <EventFeedback
            eventId={selectedEvent._id}
            isVisible={isFeedbackModalVisible}
            onClose={() => setIsFeedbackModalVisible(false)}
            onRatingAdded={handleFeedbackSubmit}
          />
        )}
      </div>
    </div>
  );
};

export default RegisteredEventsPage;
