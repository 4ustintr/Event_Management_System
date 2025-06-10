import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  DatePicker,
  InputNumber,
  Upload,
  message,
  Card,
  Select,
} from "antd";
import {
  UploadOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import type { RangePickerProps } from "antd/es/date-picker";
import dayjs from "dayjs";
import { eventService } from "@/api/services/event.service";
import { User, Club } from "@/types/api.types";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CreateEventPage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated, user } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  // Type guard to check if the user object is a Club
  const isClubUser = (user: User | Club | null): user is Club => {
    return userRole === "club" && user !== null && "club_name" in user;
  };

  useEffect(() => {
    console.log("useEffect in CreateEventPage triggered.");
    console.log("isAuthenticated:", isAuthenticated);
    console.log("userRole:", userRole);
    console.log("user object on mount:", user);

    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để tạo sự kiện");
      router.push("/login");
      return;
    }

    if (userRole !== "club") {
      message.error("Chỉ CLB mới có thể tạo sự kiện");
      router.push("/");
      return;
    }

    // Log user information when component mounts
    console.log("Current user:", user);
    console.log("User role:", userRole);
  }, [isAuthenticated, userRole, router, user]);

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const handleSubmit = async (values: any) => {
    console.log("--- handleSubmit function called ---");
    console.log("Form submitted with values:", values);
    setSubmitting(true);
    try {
      const startTime = values.timeRange[0];
      const endTime = values.timeRange[1];

      console.log("User data:", user);

      let actualClubId: string | undefined;
      let actualClubName: string | undefined;
      let actualUserEmail: string | undefined;

      if (userRole === "club") {
        // If user is a club, the user object itself is the club data
        const clubUser = user as Club; // Cast user to Club type
        if (!clubUser?._id || !clubUser?.club_name) {
          message.error("Thông tin CLB không hợp lệ hoặc thiếu.");
          return;
        }
        actualClubId = clubUser._id;
        actualClubName = clubUser.club_name;
        actualUserEmail = clubUser.email;
      } else {
        // This case should ideally be prevented by useEffect, but for type safety
        message.error("Chỉ CLB mới có thể tạo sự kiện.");
        return;
      }

      // Log user information before creating event
      console.log("Creating event for club:", {
        clubId: actualClubId,
        clubName: actualClubName,
        userEmail: actualUserEmail,
      });

      const token = localStorage.getItem("token");
      console.log("Current token:", token);

      const eventData = {
        club_id: actualClubId as string,
        title: values.title,
        description: values.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        location: values.location,
        max_participants: values.max_participants,
        category: values.category,
        status: "active",
        banner_url:
          imageUrl || "https://via.placeholder.com/800x400?text=Event+Banner",
      };

      console.log("Creating event with data:", eventData);
      console.log(
        "Request URL:",
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:2301/api"
        }/events`
      );
      console.log("Request headers:", {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      });

      const response = await eventService.createEvent(eventData);
      console.log("Event creation response:", response);

      message.success("Sự kiện đã được tạo thành công!");
      router.push("/events/manage");
    } catch (error: any) {
      console.error("Failed to create event:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      console.error("Error headers:", error.response?.headers);
      message.error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo sự kiện."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUpload = (info: any) => {
    if (info.file.status === "done") {
      // In a real application, this would be the URL returned from the server
      setImageUrl("https://via.placeholder.com/800x400?text=Event+Banner");
      message.success("Tải lên ảnh thành công");
    } else if (info.file.status === "error") {
      message.error("Có lỗi xảy ra khi tải lên ảnh");
    }
  };

  if (!isAuthenticated || userRole !== "club") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            className="mr-4"
          >
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Tạo Sự Kiện Mới</h1>
        </div>

        <Card className="shadow-sm">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-6"
            onFinishFailed={(errorInfo) => {
              console.log("Form validation failed:", errorInfo);
            }}
          >
            <Form.Item
              name="title"
              label="Tên sự kiện"
              rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
            >
              <Input size="large" placeholder="Nhập tên sự kiện" />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <TextArea
                rows={4}
                placeholder="Mô tả chi tiết về sự kiện..."
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="timeRange"
              label="Thời gian"
              rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
            >
              <RangePicker
                showTime
                format="DD/MM/YYYY HH:mm"
                disabledDate={disabledDate}
                size="large"
                className="w-full"
              />
            </Form.Item>

            <Form.Item
              name="location"
              label="Địa điểm"
              rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
            >
              <Input size="large" placeholder="Nhập địa điểm tổ chức" />
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
              <InputNumber
                size="large"
                className="w-full"
                placeholder="Nhập số lượng người tham gia tối đa"
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="Thể loại"
              rules={[{ required: true, message: "Vui lòng chọn thể loại" }]}
            >
              <Select size="large" placeholder="Chọn thể loại sự kiện">
                <Select.Option value="Học thuật">Học thuật</Select.Option>
                <Select.Option value="Thể thao">Thể thao</Select.Option>
                <Select.Option value="Kỹ năng">Kỹ năng</Select.Option>
                <Select.Option value="Kinh doanh">Kinh doanh</Select.Option>
                <Select.Option value="Văn hóa">Văn hóa</Select.Option>
                <Select.Option value="Khác">Khác</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="banner" label="Banner/Poster sự kiện">
              <div>
                <Upload
                  name="banner"
                  listType="picture"
                  maxCount={1}
                  beforeUpload={() => false}
                  onChange={handleImageUpload}
                >
                  <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                </Upload>
                {imageUrl && (
                  <p className="text-sm text-gray-500 mt-2">
                    Ảnh đã được chọn.
                  </p>
                )}
              </div>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={submitting}
                className="w-full"
              >
                Tạo Sự Kiện
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateEventPage;
