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
import { mockEvents } from "../../data/mockData";

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const CreateEventPage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
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
  }, [isAuthenticated, userRole, router]);

  const disabledDate: RangePickerProps["disabledDate"] = (current) => {
    return current && current < dayjs().startOf("day");
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const now = dayjs();
      const startTime = values.timeRange[0];
      const endTime = values.timeRange[1];

      // Xác định trạng thái ban đầu
      let status = "Sắp diễn ra"; // Mặc định là sắp diễn ra khi tạo mới

      // In a real application, this would be an API call
      const eventData = {
        id: `event${mockEvents.length + 1}`,
        ...values,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        banner_url:
          imageUrl || "https://via.placeholder.com/800x400?text=Event+Banner",
        status: status,
        registered_count: 0,
      };

      // Add new event to mockEvents
      mockEvents.push(eventData);

      console.log("Event data:", eventData);
      message.success("Sự kiện đã được tạo thành công!");
      router.push("/events/manage");
    } catch (error) {
      message.error("Có lỗi xảy ra khi tạo sự kiện");
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

            <Form.Item
              name="banner"
              label="Banner/Poster sự kiện"
              rules={[{ required: true, message: "Vui lòng tải lên banner" }]}
            >
              <Upload
                name="banner"
                listType="picture"
                maxCount={1}
                onChange={handleImageUpload}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Tải lên banner</Button>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SaveOutlined />}
                loading={submitting}
                block
              >
                Tạo sự kiện
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateEventPage;
