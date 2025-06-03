import { useState, useEffect } from "react";
import {
  List,
  Card,
  Button,
  message,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Rate,
} from "antd";
import { mockRegisteredEvents, mockRatings } from "../../data/mockData";
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

const { Option } = Select;
const { RangePicker } = DatePicker;

const RegisteredEventsPage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [events, setEvents] = useState(mockRegisteredEvents);
  const [ratings, setRatings] = useState(mockRatings);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [isAuthenticated, userRole, router]);

  const showQRCode = (event: any) => {
    setSelectedEvent(event);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedEvent(null);
  };

  const handleFormSubmit = (values: any) => {
    message.success("Đã gửi thông tin đăng ký!");
    handleModalClose();
    // Logic để lưu thông tin đăng ký sẽ được thêm sau khi có backend
  };

  const handleFeedback = (event: any) => {
    setSelectedEvent(event);
    setIsFeedbackModalVisible(true);
  };

  const getEventRating = (eventId: string) => {
    const eventRatings = ratings.filter((r) => r.eventId === eventId);
    if (eventRatings.length === 0) return 0;
    const averageRating =
      eventRatings.reduce((acc, curr) => acc + curr.rating, 0) /
      eventRatings.length;
    return averageRating;
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || event.category === categoryFilter;

    let matchesDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const eventDate = dayjs(event.start_time);
      matchesDate =
        eventDate.isAfter(dateRange[0]) && eventDate.isBefore(dateRange[1]);
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const isPastEvent = (eventDate: string) => {
    return dayjs(eventDate).isBefore(dayjs());
  };

  if (!isAuthenticated || userRole !== "student") {
    return null;
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
                      <strong>Thời gian:</strong>{" "}
                      {new Date(event.start_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Địa điểm:</strong> {event.location}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Thể loại:</strong> {event.category}
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Ngày đăng ký:</strong>{" "}
                      {new Date(event.registration_date).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        <strong>Trạng thái:</strong>
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.registration_status === "Đã đăng ký"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {event.registration_status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        <strong>Tham gia:</strong>
                      </p>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.attendance_status === "Đã tham gia"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.attendance_status}
                      </span>
                    </div>
                    {isPastEvent(event.start_time) && (
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">
                          <strong>Đánh giá:</strong>
                        </p>
                        <Rate
                          disabled
                          defaultValue={getEventRating(event.id)}
                          allowHalf
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {isPastEvent(event.start_time) && (
                      <Button
                        type="primary"
                        className="flex-1"
                        onClick={() => handleFeedback(event)}
                        icon={<StarOutlined />}
                        size="large"
                      >
                        Đánh giá
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>

      <Modal
        title="QR Code Đăng Ký"
        open={isModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width={500}
      >
        {selectedEvent && (
          <div className="text-center p-8">
            <QrcodeOutlined className="text-7xl text-gray-400 mb-6" />
            <p className="text-xl mb-3 text-gray-800">Mã QR của bạn</p>
            <p className="text-base text-gray-500 mb-6">
              Vui lòng xuất trình mã QR này khi tham gia sự kiện
            </p>
            <img
              src={selectedEvent.qr_code}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-6"
            />
            <p className="text-sm text-gray-500">
              Sự kiện: {selectedEvent.title}
            </p>
          </div>
        )}
      </Modal>

      {selectedEvent && (
        <EventFeedback
          eventId={selectedEvent.id}
          isVisible={isFeedbackModalVisible}
          onClose={() => {
            setIsFeedbackModalVisible(false);
            setSelectedEvent(null);
          }}
          onRatingAdded={() => {
            setRatings([...mockRatings]);
          }}
        />
      )}
    </div>
  );
};

export default RegisteredEventsPage;
