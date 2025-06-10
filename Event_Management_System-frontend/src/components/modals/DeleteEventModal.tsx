import { Modal } from "antd";
import { Event } from "@/types/api.types";

interface DeleteEventModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  event: Event | null;
}

const DeleteEventModal = ({
  visible,
  onClose,
  onConfirm,
  event,
}: DeleteEventModalProps) => {
  return (
    <Modal
      title="Xác nhận xóa sự kiện"
      open={visible}
      onOk={onConfirm}
      onCancel={onClose}
      okText="Xóa"
      cancelText="Hủy"
      okButtonProps={{ danger: true }}
      className="max-w-[90vw] sm:max-w-md"
    >
      <p>Bạn có chắc chắn muốn xóa sự kiện "{event?.title}" không?</p>
      <p className="text-red-500 font-semibold">
        Hành động này không thể hoàn tác!
      </p>
    </Modal>
  );
};

export default DeleteEventModal;
