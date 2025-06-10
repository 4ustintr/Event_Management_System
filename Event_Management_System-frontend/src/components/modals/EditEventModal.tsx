import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Space,
  Upload,
  DatePicker,
  message,
} from "antd";
import { Event } from "@/types/api.types";
import { UploadOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import type { RcFile } from "antd/es/upload";
import { useState } from "react";
import dayjs from "dayjs";

interface EditEventModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  events: Event[];
  loading?: boolean;
}

const EditEventModal = ({
  visible,
  onClose,
  onSubmit,
  events,
  loading = false,
}: EditEventModalProps) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    setSelectedEvent(null);
    onClose();
  };

  const handleEventSelect = (eventId: string) => {
    const event = events.find((e) => e._id === eventId);
    if (event) {
      setSelectedEvent(event);
      form.setFieldsValue({
        title: event.title,
        description: event.description,
        location: event.location,
        max_participants: event.max_participants,
        start_time: event.start_time ? dayjs(event.start_time) : null,
        end_time: event.end_time ? dayjs(event.end_time) : null,
      });
      if (event.banner_url) {
        setFileList([
          {
            uid: "-1",
            name: "banner.png",
            status: "done",
            url: event.banner_url,
          },
        ]);
      }
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("Bạn chỉ có thể tải lên file ảnh!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Ảnh phải nhỏ hơn 2MB!");
    }
    return isImage && isLt2M;
  };

  const handleSubmit = async (values: any) => {
    const formData = new FormData();
    if (fileList.length > 0 && fileList[0].originFileObj) {
      formData.append("file", fileList[0].originFileObj);
    }
    formData.append("eventId", values.eventId);
    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("location", values.location);
    formData.append("max_participants", values.max_participants);
    formData.append("start_time", values.start_time.toISOString());
    formData.append("end_time", values.end_time.toISOString());

    onSubmit(formData);
  };

  return (
    <Modal
      title="Chỉnh Sửa Sự Kiện"
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="eventId"
          label="Chọn Sự Kiện"
          rules={[{ required: true, message: "Vui lòng chọn sự kiện" }]}
        >
          <Select placeholder="Chọn sự kiện" onChange={handleEventSelect}>
            {events.map((event) => (
              <Select.Option key={event._id} value={event._id}>
                {event.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="Tên Sự Kiện"
          rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
        >
          <Input placeholder="Nhập tên sự kiện" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô Tả"
          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
        >
          <Input.TextArea placeholder="Nhập mô tả sự kiện" rows={4} />
        </Form.Item>

        <Form.Item
          name="location"
          label="Địa Điểm"
          rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
        >
          <Input placeholder="Nhập địa điểm tổ chức" />
        </Form.Item>

        <Form.Item
          name="max_participants"
          label="Số Lượng Người Tham Gia Tối Đa"
          rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
        >
          <Input type="number" min={1} />
        </Form.Item>

        <Form.Item
          name="start_time"
          label="Thời Gian Bắt Đầu"
          rules={[
            { required: true, message: "Vui lòng chọn thời gian bắt đầu" },
          ]}
        >
          <DatePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
        </Form.Item>

        <Form.Item
          name="end_time"
          label="Thời Gian Kết Thúc"
          rules={[
            { required: true, message: "Vui lòng chọn thời gian kết thúc" },
          ]}
        >
          <DatePicker showTime format="DD/MM/YYYY HH:mm" className="w-full" />
        </Form.Item>

        <Form.Item label="Banner Sự Kiện" name="banner">
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
          <Space className="w-full sm:w-auto justify-end">
            <Button type="primary" htmlType="submit" loading={loading}>
              Cập Nhật
            </Button>
            <Button onClick={handleClose}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditEventModal;
