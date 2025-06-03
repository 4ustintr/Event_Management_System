import { useState } from "react";
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
  Space,
} from "antd";
import { mockEvents, mockRegisteredEvents } from "../../data/mockData";
import { SearchOutlined, QrcodeOutlined } from "@ant-design/icons";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

const { Option } = Select;
const { RangePicker } = DatePicker;

const EventsPage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [events, setEvents] = useState(mockEvents);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [isRegistrationModalVisible, setIsRegistrationModalVisible] =
    useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [form] = Form.useForm();
  const [showQrScanner, setShowQrScanner] = useState(false);

  const handleRegister = (event: any) => {
    if (!isAuthenticated) {
      message.warning("Vui lòng đăng nhập để đăng ký sự kiện");
      router.push({
        pathname: "/login",
        query: { returnUrl: `/events/${event.id}` },
      });
      return;
    }

    if (userRole !== "student") {
      message.error("Chỉ sinh viên mới có thể đăng ký sự kiện");
      return;
    }

    setSelectedEvent(event);
    setIsRegistrationModalVisible(true);
  };

  const handleRegistrationSuccess = () => {
    // Cập nhật số lượng người đăng ký
    const updatedEvents = events.map((event) => {
      if (event.id === selectedEvent.id) {
        return {
          ...event,
          registered_count: event.registered_count + 1,
        };
      }
      return event;
    });
    setEvents(updatedEvents);

    // Thêm vào danh sách sự kiện đã đăng ký
    const newRegistration = {
      ...selectedEvent,
      registration_date: new Date().toISOString(),
      registration_status: "Đã đăng ký",
      attendance_status: "Chưa tham gia",
      qr_code: `https://via.placeholder.com/200x200?text=QR+Code+${selectedEvent.id}`,
    };
    mockRegisteredEvents.push(newRegistration);

    setIsRegistrationModalVisible(false);
    message.success("Đăng ký tham gia sự kiện thành công!");
    router.push("/events/registered");
  };

  const handleQrScan = (data: string | null) => {
    if (data) {
      try {
        const eventData = JSON.parse(data);
        if (eventData.id) {
          const event = events.find((e) => e.id === eventData.id);
          if (event) {
            setSelectedEvent(event);
            setIsRegistrationModalVisible(true);
            setShowQrScanner(false);
          }
        }
      } catch (error) {
        message.error("QR code không hợp lệ");
      }
    }
  };

  const handleQrError = (error: any) => {
    message.error("Lỗi khi quét QR code");
    console.error(error);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">
            Sự Kiện Sắp Diễn Ra
          </h1>
          <Space>
            {userRole === "student" && (
              <Link href="/events/registered">
                <Button type="primary" size="large">
                  Xem Sự Kiện Đã Đăng Ký
                </Button>
              </Link>
            )}
          </Space>
        </div>

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
            </Select>
            <RangePicker
              onChange={(dates) => setDateRange(dates)}
              disabledDate={disabledDate}
              className="w-full md:w-1/3"
              placeholder={["Từ ngày", "Đến ngày"]}
              size="large"
            />
          </div>
        </div>

        <List
          grid={{
            gutter: 24,
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
                onClick={() => {
                  if (!isAuthenticated) {
                    message.warning(
                      "Vui lòng đăng nhập để xem chi tiết sự kiện"
                    );
                    router.replace({
                      pathname: "/login",
                      query: { returnUrl: `/events/${event.id}` },
                    });
                    return;
                  }
                  router.replace(`/events/${event.id}`);
                }}
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
                      <strong>Số lượng đã đăng ký:</strong>{" "}
                      {event.registered_count}/{event.max_participants}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button
                      type="primary"
                      className="w-full"
                      onClick={() => handleRegister(event)}
                      disabled={
                        event.registered_count >= event.max_participants
                      }
                      size="large"
                    >
                      {event.registered_count >= event.max_participants
                        ? "Đã hết chỗ"
                        : "Đăng Ký"}
                    </Button>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>

      <Modal
        title="Đăng ký tham gia sự kiện"
        open={isRegistrationModalVisible}
        onCancel={() => setIsRegistrationModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedEvent && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRegistrationSuccess}
            className="px-4"
          >
            <Form.Item
              name="fullName"
              label="Họ và tên"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="studentId"
              label="Mã sinh viên"
              rules={[
                { required: true, message: "Vui lòng nhập mã sinh viên" },
              ]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Số điện thoại không hợp lệ",
                },
              ]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                size="large"
              >
                Xác nhận đăng ký
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title="Quét QR Code"
        open={showQrScanner}
        onCancel={() => setShowQrScanner(false)}
        footer={null}
        width={500}
      >
        <div className="text-center p-8">
          <QrcodeOutlined className="text-7xl text-gray-400 mb-6" />
          <p className="text-xl mb-3 text-gray-800">
            Mã QR sẽ được cung cấp bởi ban tổ chức sự kiện
          </p>
          <p className="text-base text-gray-500">
            Vui lòng liên hệ với ban tổ chức để nhận mã QR và hoàn tất đăng ký
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default EventsPage;
