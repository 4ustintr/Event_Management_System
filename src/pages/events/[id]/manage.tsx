import { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Tag,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  QrcodeOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "../../../contexts/AuthContext";
import {
  mockEvents,
  mockRegisteredEvents,
  mockNotifications,
} from "../../../data/mockData";
import dayjs from "dayjs";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const EventManagePage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { userRole, isAuthenticated } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isQrScannerVisible, setIsQrScannerVisible] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [updateForm] = Form.useForm();

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

    // Tìm sự kiện theo ID
    const foundEvent = mockEvents.find((e) => e.id === id);
    if (foundEvent) {
      setEvent(foundEvent);
      form.setFieldsValue({
        ...foundEvent,
        timeRange: [dayjs(foundEvent.start_time), dayjs(foundEvent.end_time)],
      });
    } else {
      message.error("Không tìm thấy sự kiện");
      router.push("/events/manage");
    }
  }, [id, isAuthenticated, userRole, router, form]);

  const handleEdit = async (values: any) => {
    try {
      const updatedEvent = {
        ...event,
        ...values,
        start_time: values.timeRange[0].toISOString(),
        end_time: values.timeRange[1].toISOString(),
      };

      // Cập nhật sự kiện trong mockEvents
      const eventIndex = mockEvents.findIndex((e) => e.id === id);
      if (eventIndex !== -1) {
        mockEvents[eventIndex] = updatedEvent;
        setEvent(updatedEvent);
        message.success("Cập nhật sự kiện thành công!");
        setIsEditModalVisible(false);
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi cập nhật sự kiện");
    }
  };

  const handleDelete = () => {
    try {
      // Xóa sự kiện khỏi mockEvents
      const eventIndex = mockEvents.findIndex((e) => e.id === id);
      if (eventIndex !== -1) {
        mockEvents.splice(eventIndex, 1);
        message.success("Xóa sự kiện thành công!");
        router.push("/events/manage");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa sự kiện");
    }
  };

  const handleQrScan = (data: string | null) => {
    if (data) {
      try {
        const eventData = JSON.parse(data);
        if (eventData.id === id) {
          // Update attendance status
          const registrationIndex = mockRegisteredEvents.findIndex(
            (reg) =>
              reg.id === id && reg.registration_id === eventData.registration_id
          );

          if (registrationIndex !== -1) {
            mockRegisteredEvents[registrationIndex].attendance_status =
              "Đã tham gia";
            message.success("Điểm danh thành công!");
            setScannedData(data);
          } else {
            message.error("Không tìm thấy thông tin đăng ký");
          }
        } else {
          message.error("QR code không thuộc sự kiện này");
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

  const handleSendUpdate = async (values: any) => {
    try {
      // Lấy danh sách người đăng ký
      const registeredParticipants = mockRegisteredEvents.filter(
        (reg) => reg.id === id
      );

      // Thêm thông báo mới
      const newNotification = {
        id: `notif${mockNotifications.length + 1}`,
        eventId: id as string,
        title: values.title,
        content: values.content,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      mockNotifications.unshift(newNotification);

      message.success(
        `Đã gửi thông báo cập nhật đến ${registeredParticipants.length} người tham gia`
      );
      setIsUpdateModalVisible(false);
      updateForm.resetFields();
    } catch (error) {
      message.error("Có lỗi xảy ra khi gửi thông báo");
    }
  };

  const getAttendanceStats = () => {
    const registrations = mockRegisteredEvents.filter((reg) => reg.id === id);
    const totalRegistered = registrations.length;
    const totalAttended = registrations.filter(
      (reg) => reg.attendance_status === "Đã tham gia"
    ).length;
    const attendanceRate =
      totalRegistered > 0 ? (totalAttended / totalRegistered) * 100 : 0;

    return {
      totalRegistered,
      totalAttended,
      attendanceRate,
    };
  };

  const columns = [
    {
      title: "Họ và tên",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registration_date",
      key: "registration_date",
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: "Trạng thái điểm danh",
      dataIndex: "attendance_status",
      key: "attendance_status",
      render: (status: string) => (
        <Tag color={status === "Đã tham gia" ? "green" : "orange"}>
          {status}
        </Tag>
      ),
    },
  ];

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Quản Lý Sự Kiện: {event.title}
          </h1>
          <Space>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => setIsEditModalVisible(true)}
            >
              Sửa sự kiện
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => setIsDeleteModalVisible(true)}
            >
              Xóa sự kiện
            </Button>
          </Space>
        </div>

        <Row gutter={[24, 24]} className="mb-8">
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Tổng số đăng ký"
                value={getAttendanceStats().totalRegistered}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Số người tham gia"
                value={getAttendanceStats().totalAttended}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Tỷ lệ tham gia"
                value={getAttendanceStats().attendanceRate}
                precision={1}
                suffix="%"
              />
            </Card>
          </Col>
        </Row>

        <Card className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Danh sách đăng ký</h2>
            <Space>
              <Button
                type="primary"
                icon={<NotificationOutlined />}
                onClick={() => setIsUpdateModalVisible(true)}
              >
                Gửi thông báo
              </Button>
              <Button
                type="primary"
                icon={<QrcodeOutlined />}
                onClick={() => setIsQrScannerVisible(true)}
              >
                Điểm danh bằng QR
              </Button>
            </Space>
          </div>
          <Table
            columns={columns}
            dataSource={mockRegisteredEvents.filter((reg) => reg.id === id)}
            rowKey="id"
          />
        </Card>

        <Card>
          <h2 className="text-xl font-semibold mb-4">Thông tin sự kiện</h2>
          <div className="space-y-4">
            <p>
              <strong>Thời gian:</strong>{" "}
              {new Date(event.start_time).toLocaleString()} -{" "}
              {new Date(event.end_time).toLocaleString()}
            </p>
            <p>
              <strong>Địa điểm:</strong> {event.location}
            </p>
            <p>
              <strong>Thể loại:</strong> {event.category}
            </p>
            <p className="">
              <strong>Mô tả: </strong> {event.description}
            </p>
            <p>
              <strong>Số lượng đã đăng ký:</strong> {event.registered_count}/
              {event.max_participants}
            </p>
            <p>
              <strong>Trạng thái:</strong>{" "}
              <Tag color={event.status === "Sắp diễn ra" ? "blue" : "green"}>
                {event.status}
              </Tag>
            </p>
          </div>
        </Card>

        {/* Modal Sửa sự kiện */}
        <Modal
          title="Sửa sự kiện"
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleEdit}
            className="space-y-4"
          >
            <Form.Item
              name="title"
              label="Tên sự kiện"
              rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="timeRange"
              label="Thời gian"
              rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
            >
              <RangePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                size="large"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="location"
              label="Địa điểm"
              rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
            >
              <Input size="large" />
            </Form.Item>

            <Form.Item
              name="max_participants"
              label="Số lượng người tham gia tối đa"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số lượng người tham gia",
                },
                { type: "number", min: 1, message: "Số lượng phải lớn hơn 0" },
              ]}
            >
              <InputNumber size="large" className="w-full" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Thể loại"
              rules={[{ required: true, message: "Vui lòng chọn thể loại" }]}
            >
              <Select size="large">
                <Select.Option value="Học thuật">Học thuật</Select.Option>
                <Select.Option value="Thể thao">Thể thao</Select.Option>
                <Select.Option value="Kỹ năng">Kỹ năng</Select.Option>
                <Select.Option value="Kinh doanh">Kinh doanh</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large">
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </Modal>

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
          <p>Bạn có chắc chắn muốn xóa sự kiện này không?</p>
          <p className="text-red-500">
            Lưu ý: Hành động này không thể hoàn tác.
          </p>
        </Modal>

        {/* QR Scanner Modal */}
        <Modal
          title="Quét QR Code Điểm Danh"
          open={isQrScannerVisible}
          onCancel={() => setIsQrScannerVisible(false)}
          footer={null}
          width={500}
        >
          <div className="text-center p-8">
            <QrcodeOutlined className="text-7xl text-gray-400 mb-6" />
            <p className="text-xl mb-3 text-gray-800">
              Quét mã QR của người tham gia để điểm danh
            </p>
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center mb-4">
              {/* QR Scanner component would go here */}
              <p className="text-gray-500">QR Scanner Component</p>
            </div>
            {scannedData && (
              <div className="mt-4 p-4 bg-green-50 rounded">
                <p className="text-green-800">Đã quét thành công!</p>
              </div>
            )}
          </div>
        </Modal>

        {/* Modal Gửi thông báo */}
        <Modal
          title="Gửi thông báo cập nhật"
          open={isUpdateModalVisible}
          onCancel={() => setIsUpdateModalVisible(false)}
          footer={null}
          width={600}
        >
          <Form
            form={updateForm}
            layout="vertical"
            onFinish={handleSendUpdate}
            className="px-4"
          >
            <Form.Item
              name="title"
              label="Tiêu đề thông báo"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="content"
              label="Nội dung thông báo"
              rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
            >
              <TextArea rows={4} size="large" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                size="large"
              >
                Gửi thông báo
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default EventManagePage;
