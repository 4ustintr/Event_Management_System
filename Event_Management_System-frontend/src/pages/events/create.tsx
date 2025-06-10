// src/pages/events/create.tsx
import { useState } from "react";
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
  Typography,
  Row,
  Col,
} from "antd";
import { UploadOutlined, SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import type { UploadFile, UploadProps } from "antd"; // Import UploadFile và UploadProps
import type { RcFile } from "antd/es/upload"; // Import RcFile cho kiểu file
import { eventService } from "@/api/services/event.service";

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Title } = Typography;
const { Option } = Select;

const CreateEventPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // State để lưu trữ file banner được người dùng chọn
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Hàm xử lý khi submit form
  const handleSubmit = async (values: any) => {
    // Kiểm tra xem đã có file banner được chọn chưa
    if (fileList.length === 0) {
      messageApi.open({
        type: "error",
        content: "Vui lòng tải lên banner cho sự kiện!",
      });
      return;
    }

    setSubmitting(true);
    
    // Tạo một đối tượng FormData để chứa dữ liệu
    const formData = new FormData();

    // Thêm các trường dữ liệu từ form vào FormData
    // Đảm bảo user và user._id tồn tại
    if (user?._id) {
        formData.append("club_id", user._id);
    } else {
        messageApi.open({
          type: "error",
          content: "Không tìm thấy thông tin CLB. Vui lòng đăng nhập lại.",
        });
        setSubmitting(false);
        return;
    }
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("start_time", values.timeRange[0].toISOString());
    formData.append("end_time", values.timeRange[1].toISOString());
    formData.append("location", values.location);
    formData.append("max_participants", values.max_participants.toString());
    formData.append("category", values.category);

    // Thêm file ảnh vào FormData
    // originFileObj là file gốc mà người dùng đã chọn
    if (fileList[0]?.originFileObj) {
       const file = fileList[0].originFileObj as RcFile;
  formData.append("banner", file);
  
  // Debug file chi tiết
  console.log("File được gửi:", {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified
  });
} else {
  console.error("Không tìm thấy file trong fileList");
  message.error("Lỗi: Không tìm thấy file banner!");
  setSubmitting(false);
  return;
}

    console.log("FormData entries:");
  for (let [key, value] of formData.entries()) {
    if (value instanceof File) {
      console.log(`${key}:`, {
        name: value.name,
        size: value.size,
        type: value.type
      });
    } else {
      console.log(`${key}:`, value);
    }
  }
    
    try {
      // Gọi service với FormData
      const response = await eventService.createEvent(formData);

    console.log("Create event response:", response);
    console.log("Banner URL in response:", response.data?.banner_url);

      message.success(response.message || "Sự kiện đã được tạo thành công!");
      router.push("/events/manage"); // Chuyển hướng đến trang quản lý sự kiện
    } catch (error: any) {
      console.error("Lỗi khi tạo sự kiện:", error);
      messageApi.open({
        type: "error",
        content:
          error.response?.data?.message || "Có lỗi xảy ra khi tạo sự kiện.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình cho component Upload
  const uploadProps: UploadProps = {
    // Dùng onChange để cập nhật danh sách file, đây là cách làm chuẩn
    onChange: (info) => {
      // Giới hạn chỉ lấy file cuối cùng người dùng chọn
      let newFileList = info.fileList.slice(-1);
      setFileList(newFileList);
    },
    // Giữ lại beforeUpload để kiểm tra file và ngăn upload tự động
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        messageApi.open({
          type: "error",
          content: 'Bạn chỉ có thể upload file JPG/PNG!',
        });
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        messageApi.open({
          type: "error",
          content: 'Kích thước ảnh phải nhỏ hơn 5MB!',
        });
      }
      // return false là BẮT BUỘC
      return isJpgOrPng && isLt5M ? false : Upload.LIST_IGNORE;
    },
    fileList, // Lấy giá trị từ state để component được kiểm soát
    maxCount: 1,
    listType: "picture-card",
  };


  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <Button
        type="text"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.back()}
        className="mb-4"
      >
        Quay lại
      </Button>
      <Title level={2} className="text-center mb-6">Tạo sự kiện mới</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              name="title"
              label="Tên sự kiện"
              rules={[{ required: true, message: "Vui lòng nhập tên sự kiện!" }]}
            >
              <Input placeholder="Ví dụ: Workshop Lập trình Web" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="category"
              label="Thể loại sự kiện"
              rules={[{ required: true, message: "Vui lòng chọn thể loại!" }]}
            >
              <Select placeholder="Chọn thể loại">
                <Option value="Học thuật">Học thuật</Option>
                <Option value="Thể thao">Thể thao</Option>
                <Option value="Tình nguyện">Tình nguyện</Option>
                <Option value="Văn hóa - Nghệ thuật">Văn hóa - Nghệ thuật</Option>
                <Option value="Khác">Khác</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Mô tả chi tiết"
          rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
        >
          <TextArea rows={5} placeholder="Nhập mô tả chi tiết về sự kiện của bạn..." />
        </Form.Item>

        <Form.Item label="Banner" required>
          <Upload {...uploadProps}>
            {fileList.length < 1 && <div><UploadOutlined /> Tải lên</div>}
          </Upload>
        </Form.Item>

        <Row gutter={24}>
            <Col xs={24} md={12}>
                <Form.Item
                  name="timeRange"
                  label="Thời gian diễn ra"
                  rules={[{ required: true, message: "Vui lòng chọn thời gian!" }]}
                >
                  <RangePicker
                    showTime={{ format: "HH:mm" }}
                    format="DD-MM-YYYY HH:mm"
                    className="w-full"
                  />
                </Form.Item>
            </Col>
            <Col xs={24} md={12}>
                <Form.Item
                  name="location"
                  label="Địa điểm"
                  rules={[{ required: true, message: "Vui lòng nhập địa điểm!" }]}
                >
                  <Input placeholder="Ví dụ: Hội trường A, cơ sở 1" />
                </Form.Item>
            </Col>
        </Row>
        
        <Form.Item
          name="max_participants"
          label="Số lượng người tham gia tối đa"
          rules={[{ required: true, message: "Vui lòng nhập số lượng!" }]}
        >
          <InputNumber min={1} className="w-full" placeholder="Nhập số lượng, ví dụ: 100" />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SaveOutlined />}
            className="w-full h-12 text-lg"
          >
            {submitting ? "Đang tạo..." : "Tạo sự kiện"}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

// Bọc component với HOC để yêu cầu đăng nhập với vai trò CLB
export default CreateEventPage;
