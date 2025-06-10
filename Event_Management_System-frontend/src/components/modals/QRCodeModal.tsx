import { Modal, Spin } from "antd";
import { Event } from "@/types/api.types";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  visible: boolean;
  onClose: () => void;
  event: Event | null;
}

const QRCodeModal = ({ visible, onClose, event }: QRCodeModalProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (event && event.registrations?.[0]?.qr_code && visible) {
      setLoading(true);
      QRCode.toDataURL(
        event.registrations[0].qr_code,
        {
          width: 256,
          margin: 2,
          errorCorrectionLevel: "H",
        },
        (err, url) => {
          setLoading(false);
          if (err) {
            console.error("Failed to generate QR code:", err);
            return;
          }
          setQrCodeUrl(url);
        }
      );
    }
  }, [event, visible]);

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
          {loading ? (
            <Spin tip="Đang tạo mã QR..." />
          ) : qrCodeUrl ? (
            <img
              src={qrCodeUrl}
              alt={`QR Code for ${event.title}`}
              className="w-48 h-48 sm:w-64 sm:h-64 border rounded-lg"
            />
          ) : (
            <p className="text-red-500">Không thể tạo mã QR.</p>
          )}
          <p className="text-sm text-gray-600 mt-4 text-center">
            Sử dụng mã này để điểm danh khi tham gia sự kiện.
          </p>
        </div>
      )}
    </Modal>
  );
};

export default QRCodeModal;