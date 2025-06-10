import { useState } from "react";
import { Modal, Form, Input, Rate, Button, message } from "antd";

const { TextArea } = Input;

interface EventFeedbackProps {
  eventId?: string;
  isVisible: boolean;
  onClose: () => void;
  onRatingAdded: (feedbackData: {
    rating: number;
    comment: string;
  }) => Promise<void>;
}

const EventFeedback = ({
  eventId,
  isVisible,
  onClose,
  onRatingAdded,
}: EventFeedbackProps) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: any) => {
    if (!eventId) return;
    setSubmitting(true);
    try {
      await onRatingAdded(values);
      message.success("Cảm ơn bạn đã gửi đánh giá!");
      form.resetFields();
      onClose();
    } catch (error) {
      message.error("Có lỗi xảy ra khi gửi đánh giá");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Đánh giá sự kiện"
      open={isVisible}
      onCancel={onClose}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="rating"
          label="Đánh giá của bạn"
          rules={[{ required: true, message: "Vui lòng chọn số sao đánh giá" }]}
        >
          <Rate allowHalf />
        </Form.Item>

        <Form.Item
          name="comment"
          label="Nhận xét của bạn"
          rules={[{ required: true, message: "Vui lòng nhập nhận xét" }]}
        >
          <TextArea
            rows={4}
            placeholder="Chia sẻ trải nghiệm của bạn về sự kiện này..."
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting} block>
            Gửi đánh giá
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EventFeedback;
