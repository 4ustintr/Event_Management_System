import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  Button,
  Card,
  message,
  Spin,
  Tag,
  Row,
  Col,
  Descriptions,
  Modal,
  Form,
  Input,
  Rate,
  Upload,
} from "antd";
import { eventService } from "@/api/services/event.service";
import { Event } from "@/types/api.types";
import { useAuth } from "../../contexts/AuthContext";
import dayjs from "dayjs";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  UserOutlined,
  EditOutlined,
  SendOutlined,
  CheckCircleOutlined,
  StarOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import NotificationModal from "@/components/modals/NotificationModal";
import type { UploadFile } from "antd/es/upload/interface";
import type { RcFile } from "antd/es/upload";

const { TextArea } = Input;

const EventDetailPage = () => {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { userRole, isAuthenticated, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [myRegistration, setMyRegistration] = useState<any | null>(null);

  const [isNotificationModalVisible, setIsNotificationModalVisible] =
    useState(false);
  const [isFeedbackModalVisible, setIsFeedbackModalVisible] = useState(false);
  const [feedbackForm] = Form.useForm();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchEventDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await eventService.getEventDetails(id);

      if (response && response.event) {
        setEvent(response.event);

        
        if (user?._id && response.event.registrations) {
          const registration = response.event.registrations.find(
            (reg: any) => reg.user_id === user._id
          );
          // Nếu tìm thấy thông tin đăng ký của user
          if (registration) {
            setIsRegistered(true);
            setMyRegistration(registration); // Lưu lại toàn bộ thông tin đăng ký
          }
        }
      } else {
        console.error("Debug - Invalid event data:", response);
        messageApi.open({
          type: "error",
          content: "Không thể tải thông tin sự kiện",
        });
        router.replace("/events");
      }
    } catch (error) {
      console.error("Debug - Error fetching event details:", error);
      messageApi.open({
        type: "error",
        content: "Đã xảy ra lỗi khi tải thông tin sự kiện",
      });
      router.replace("/events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log("Debug - Component mounted");
      console.log("Debug - isAuthenticated:", isAuthenticated);
      console.log("Debug - id:", id);
      console.log("Debug - user:", user);
      console.log("Debug - userRole:", userRole);
      console.log("Debug - event:", event);
      console.log("Debug - Render check:", {
        userRole,
        eventClubId: event?.club?.club_id,
        userClubId: (user as any)?.club_id,
        condition:
          userRole === "club" &&
          event?.club?.club_id === (user as any)?.club_id,
      });
      fetchEventDetails();
    }
  }, [id, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải chi tiết sự kiện..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Không tìm thấy thông tin sự kiện
          </h2>
          <Button type="primary" onClick={() => router.push("/events")}>
            Quay lại danh sách sự kiện
          </Button>
        </div>
      </div>
    );
  }

  const handleRegister = async () => {
    if (!isAuthenticated) {
      messageApi.open({
        type: "warning",
        content: "Vui lòng đăng nhập để đăng ký sự kiện",
      });
      router.push({
        pathname: "/login",
        query: { returnUrl: `/events/${id}` },
      });
      return;
    }

    if (userRole !== "student") {
      messageApi.open({
        type: "error",
        content: "Chỉ sinh viên mới có thể đăng ký sự kiện",
      });
      return;
    }

    try {
      if (!id) {
        messageApi.open({
          type: "error",
          content: "Không tìm thấy thông tin sự kiện",
        });
        return;
      }
      const response = await eventService.registerForEvent(id);
      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Đăng ký thành công!",
        });
        fetchEventDetails();
      } else {
        messageApi.open({
          type: "error",
          content: response.message || "Đăng ký sự kiện thất bại",
        });
      }
    } catch (error: any) {
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Đăng ký sự kiện thất bại",
      });
    }
  };

  const handleCheckIn = async () => {
  // Bắt đầu gỡ lỗi
  console.log("1. Hàm 'handleCheckIn' đã được gọi.");

  if (!myRegistration || !myRegistration.qr_code) {
      console.error("2. LỖI: Không tìm thấy 'myRegistration' hoặc 'qr_code'.", myRegistration);
      messageApi.open({
        type: "error",
        content: "Lỗi: Không có thông tin đăng ký để check-in.",
      });
      return;
  }

  console.log("3. Đã tìm thấy thông tin đăng ký. Đang tiến hành check-in với QR Code:", myRegistration.qr_code);

  try {
    console.log("4. Đang gọi API check-in...");
    const response = await eventService.checkinEvent(myRegistration.qr_code);
    console.log("5. Đã nhận được phản hồi từ API:", response);

    if (response.success) {
      console.log("6. THÀNH CÔNG: Backend báo check-in thành công.");
      messageApi.open({
        type: "success",
        content: "Check-in thành công!",
      });
      fetchEventDetails(); // Tải lại dữ liệu để cập nhật giao diện
    } else {
      console.error("7. THẤT BẠI: Backend báo lỗi.", response.message);
      messageApi.open({
        type: "error",
        content: response.message || "Check-in thất bại.",
      });
    }
  } catch (error: any) {
    console.error("8. LỖI NGOẠI LỆ: Có lỗi nghiêm trọng xảy ra khi gọi API.", error);
    messageApi.open({
      type: "error",
      content: error.response?.data?.message || "Lỗi nghiêm trọng khi check-in.",
    });
  }
};

  const handleSubmitFeedback = async (values: any) => {
    try {
      const response = await eventService.submitFeedback(id, {
        rating: values.rating,
        comment: values.comment,
      });
      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Gửi đánh giá thành công!",
        });
        setHasSubmittedFeedback(true);
        setIsFeedbackModalVisible(false);
        feedbackForm.resetFields();
        fetchEventDetails();
      } else {
        messageApi.open({
          type: "error",
          content: response.message || "Gửi đánh giá thất bại",
        });
      }
    } catch (error: any) {
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Gửi đánh giá thất bại",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "green";
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

  const handleSendNotification = async (values: any) => {
    try {
      const response = await eventService.sendNotification(id, {
        title: values.title,
        message: values.message,
        type: values.type,
      });

      if (response.success) {
        messageApi.open({
          type: "success",
          content: response.message || "Gửi thông báo thành công",
        });
        setIsNotificationModalVisible(false);
        fetchEventDetails();
      } else {
        messageApi.open({
          type: "error",
          content: response.message || "Không thể gửi thông báo",
        });
      }
    } catch (error: any) {
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Đã xảy ra lỗi khi gửi thông báo",
      });
    }
  };




  const handleEditSubmit = async (values: any) => {
    if (!id) {
      messageApi.open({
        type: "error",
        content: "Không tìm thấy ID sự kiện để cập nhật.",
      });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();

      // Đưa dữ liệu text vào FormData
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('location', values.location);
      formData.append('max_participants', values.max_participants);
      formData.append('start_time', new Date(values.start_time).toISOString());
      formData.append('end_time', new Date(values.end_time).toISOString());

      // Nếu người dùng chọn file mới, thêm vào formData
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('banner', fileList[0].originFileObj as RcFile);
      }

      // Gọi thẳng API update với FormData
      const response = await eventService.updateEvent(id, formData);

      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Cập nhật sự kiện thành công!",
        });
        setIsEditModalVisible(false);
        fetchEventDetails(); // Tải lại chi tiết sự kiện
      } else {
        messageApi.open({
          type: "error",
          content: response.message || "Không thể cập nhật sự kiện",
        });
      }
    } catch (error: any) {
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Không thể cập nhật sự kiện",
      });
    } finally {
      setUploading(false);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      messageApi.open({
        type: "error",
        content: "Bạn chỉ có thể tải lên file ảnh!",
      });
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Ảnh phải nhỏ hơn 2MB!");
    }
    return isImage && isLt2M;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Event Banner */}
      <div className="relative h-96 w-full">
        <img
          src={
            event?.banner_url ||
            "https://via.placeholder.com/1200x400?text=Event+Banner"
          }
          alt={event?.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              "https://via.placeholder.com/1200x400?text=Event+Banner";
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white text-center px-4">
            {event?.title}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{event?.title}</h1>
          {userRole === "club" &&
            event?.club?.club_id === (user as any)?.club_id && (
              <div className="flex gap-4">
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => setIsNotificationModalVisible(true)}
                >
                  Gửi thông báo
                </Button>
              </div>
            )}
        </div>

        <Row gutter={[24, 24]}>
          {/* Event Time and Registration */}
          <Col xs={24} md={16}>
            <Card className="mb-8">
              <div className="space-y-4">
                <div className="flex items-center">
                  <CalendarOutlined className="text-xl mr-2" />
                  <div>
                    <p className="text-lg">
                      <strong>Thời gian:</strong>{" "}
                      {dayjs(event.start_time).format("HH:mm DD/MM/YYYY")} -{" "}
                      {dayjs(event.end_time).format("HH:mm DD/MM/YYYY")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <EnvironmentOutlined className="text-xl mr-2" />
                  <div>
                    <p className="text-lg">
                      <strong>Địa điểm:</strong> {event.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <TeamOutlined className="text-xl mr-2" />
                  <div>
                    <p className="text-lg">
                      <strong>Số lượng đã đăng ký:</strong>{" "}
                      {event.registrations?.length || 0}/
                      {event.max_participants}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Tag color={getStatusColor(event.status)}>
                    {getStatusText(event.status)}
                  </Tag>
                </div>
              </div>
            </Card>

            {/* Event Information */}
            <Card title="Thông tin sự kiện" className="mb-8">
              <div className="prose max-w-none">
                <p className="text-lg">{event.description}</p>
                <div className="mt-4">
                  <h3 className="text-xl font-semibold mb-2">Thể loại</h3>
                  <p>{event.category}</p>
                </div>
              </div>
            </Card>
          </Col>

          {/* Registration and Organizer Info */}
          <Col xs={24} md={8}>
            <Card className="mb-8">
              <div className="space-y-6">
                {userRole === "student" && (
                  <>
                    <Button
                      type="primary"
                      size="large"
                      block
                      onClick={handleRegister}
                      disabled={
                        isRegistered ||
                        (event.registrations?.length ?? 0) >=
                        event.max_participants ||
                        (event.status !== "active" &&
                          event.status !== "approved")
                      }
                    >
                      {isRegistered
                        ? "Đã đăng ký"
                        : (event.registrations?.length ?? 0) >=
                          event.max_participants
                          ? "Đã hết chỗ"
                          : event.status === "draft"
                            ? "Chờ duyệt"
                            : event.status === "cancelled"
                              ? "Đã hủy"
                              : event.status === "completed"
                                ? "Đã kết thúc"
                                : "Đăng ký tham gia"}
                    </Button>

                    {isRegistered && !myRegistration?.checked_in && (event?.status === 'active' || event?.status === 'approved') && (
                      <Button
                        type="primary"
                        size="large"
                        block
                        icon={<CheckCircleOutlined />}
                        onClick={handleCheckIn}
                      >
                        Check-in
                      </Button>
                    )}

                    {isRegistered && isCheckedIn && !hasSubmittedFeedback && (
                      <Button
                        type="primary"
                        size="large"
                        block
                        icon={<StarOutlined />}
                        onClick={() => setIsFeedbackModalVisible(true)}
                      >
                        Đánh giá sự kiện
                      </Button>
                    )}
                  </>
                )}

                {!isAuthenticated && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-600 mb-2">
                      Để đăng ký tham gia sự kiện, vui lòng đăng nhập
                    </p>
                    <Button
                      type="primary"
                      onClick={() =>
                        router.push({
                          pathname: "/login",
                          query: { returnUrl: `/events/${id}` },
                        })
                      }
                    >
                      Đăng nhập
                    </Button>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Thông tin tổ chức
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                      <UserOutlined className="text-2xl" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold">
                        {event.club?.club_name || "N/A"}
                      </h4>
                      <p className="text-gray-600">CLB</p>
                    </div>
                  </div>
                </div>

                {event.statistics && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-4">Thống kê</h3>
                    <div className="space-y-2">
                      <p>
                        <strong>Tổng số đăng ký:</strong>{" "}
                        {event.statistics.total_registered}
                      </p>
                      <p>
                        <strong>Đã check-in:</strong>{" "}
                        {event.statistics.total_checked_in}
                      </p>
                      {event.statistics.average_rating && (
                        <p>
                          <strong>Đánh giá trung bình:</strong>{" "}
                          {event.statistics.average_rating}/5
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>

        <NotificationModal
          visible={isNotificationModalVisible}
          onClose={() => setIsNotificationModalVisible(false)}
          onSubmit={handleSendNotification}
          events={event ? [event] : []}
        />

        {/* Feedback Modal */}
        <Modal
          title="Đánh giá sự kiện"
          open={isFeedbackModalVisible}
          onCancel={() => setIsFeedbackModalVisible(false)}
          footer={null}
        >
          <Form
            form={feedbackForm}
            onFinish={handleSubmitFeedback}
            layout="vertical"
          >
            <Form.Item
              name="rating"
              label="Đánh giá"
              rules={[{ required: true, message: "Vui lòng chọn số sao" }]}
            >
              <Rate />
            </Form.Item>
            <Form.Item
              name="comment"
              label="Nhận xét"
              rules={[{ required: true, message: "Vui lòng nhập nhận xét" }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
                Gửi đánh giá
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Chỉnh sửa sự kiện"
          open={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          footer={null}
          width={800}
        >
          <Form form={editForm} onFinish={handleEditSubmit} layout="vertical">
            <Form.Item
              name="title"
              label="Tên sự kiện"
              rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="location"
              label="Địa điểm"
              rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="max_participants"
              label="Số lượng người tham gia tối đa"
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <Input type="number" min={1} />
            </Form.Item>

            <Form.Item
              name="start_time"
              label="Thời gian bắt đầu"
              rules={[
                { required: true, message: "Vui lòng chọn thời gian bắt đầu" },
              ]}
            >
              <Input type="datetime-local" />
            </Form.Item>

            <Form.Item
              name="end_time"
              label="Thời gian kết thúc"
              rules={[
                { required: true, message: "Vui lòng chọn thời gian kết thúc" },
              ]}
            >
              <Input type="datetime-local" />
            </Form.Item>

            <Form.Item label="Banner sự kiện" name="banner">
              <Upload
                listType="picture"
                maxCount={1}
                beforeUpload={beforeUpload}
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
              >
                <Button icon={<UploadOutlined />}>Tải ảnh lên</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={uploading}
              >
                Cập nhật
              </Button>
            </Form.Item>
          </Form>
        </Modal>

        {/* Display Notifications */}
        {event?.notifications && event.notifications.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Thông báo</h2>
            <div className="space-y-4">
              {event.notifications.map((notification, index) => (
                <Card key={index} className="bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{notification.title}</h3>
                      <p className="text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(notification.sent_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {notification.type}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;
