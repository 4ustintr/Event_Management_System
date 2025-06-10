import { Modal, Form, Input, Select, Button, Space } from "antd";
import { Event } from "@/types/api.types";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  events: Event[];
  loading?: boolean;
}

const NotificationModal = ({
  visible,
  onClose,
  onSubmit,
  events,
  loading = false,
}: NotificationModalProps) => {
  const [form] = Form.useForm();

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="Gửi Thông Báo"
      open={visible}
      onCancel={handleClose}
      footer={null}
      className="max-w-[90vw] sm:max-w-md"
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="eventId"
          label="Chọn Sự Kiện"
          rules={[{ required: true, message: "Vui lòng chọn sự kiện" }]}
        >
          <Select placeholder="Chọn sự kiện">
            {events.map((event) => (
              <Select.Option key={event._id} value={event._id}>
                {event.title}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="title"
          label="Tiêu Đề"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề" }]}
        >
          <Input placeholder="Nhập tiêu đề thông báo" />
        </Form.Item>

        <Form.Item
          name="message"
          label="Nội Dung"
          rules={[{ required: true, message: "Vui lòng nhập nội dung" }]}
        >
          <Input.TextArea placeholder="Nhập nội dung thông báo" rows={4} />
        </Form.Item>

        <Form.Item name="type" label="Loại Thông Báo" initialValue="update">
          <Select>
            <Select.Option value="update">Cập Nhật</Select.Option>
            <Select.Option value="announcement">Thông Báo</Select.Option>
            <Select.Option value="reminder">Nhắc Nhở</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Space className="w-full sm:w-auto justify-end">
            <Button type="primary" htmlType="submit" loading={loading}>
              Gửi Thông Báo
            </Button>
            <Button onClick={handleClose}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NotificationModal;
