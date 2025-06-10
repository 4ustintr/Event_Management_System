import { Modal } from "antd";
import { Event } from "@/types/api.types";

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event | null;
}

const QRCodeModal = ({ visible, onClose, event }: QRCodeModalProps) => {
  return (
    <Modal
      title="Mã QR Sự Kiện"
      open={visible}
      onCancel={onClose}
      footer={null}
      className="max-w-[90vw] sm:max-w-md"
    >
      {event && (
        <div className="flex flex-col items-center">
          <p className="text-lg font-semibold mb-4">{event.title}</p>
          <img
            src={event.registrations?.[0]?.qr_code}
            alt="QR Code"
            className="w-48 h-48 border rounded-lg"
          />
          <p className="text-sm text-gray-600 mt-2">
            Sử dụng mã này để điểm danh tại sự kiện.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default QRCodeModal;
