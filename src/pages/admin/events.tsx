import { Table, Button, Space, Tag, message } from "antd";
import { DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import { withAdminAuth } from "@/components/auth/withAdminAuth";
import AdminHeader from "@/components/layout/headers/AdminHeader";
interface Event {
  id: string;
  title: string;
  organizer: string;
  startDate: string;
  endDate: string;
  location: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  participantCount: number;
}

const EventManagement = () => {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      // TODO: Implement API call to delete event
      // await deleteEvent(id);
      message.success("Xóa sự kiện thành công");
      setEvents(events.filter((event) => event.id !== id));
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Event["status"]) => {
    const colors = {
      upcoming: "blue",
      ongoing: "green",
      completed: "gray",
      cancelled: "red",
    };
    return colors[status];
  };

  const getStatusText = (status: Event["status"]) => {
    const texts = {
      upcoming: "Sắp diễn ra",
      ongoing: "Đang diễn ra",
      completed: "Đã kết thúc",
      cancelled: "Đã hủy",
    };
    return texts[status];
  };

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Tổ chức bởi",
      dataIndex: "organizer",
      key: "organizer",
    },
    {
      title: "Thời gian",
      key: "time",
      render: (record: Event) => (
        <div>
          <div>Từ: {new Date(record.startDate).toLocaleString("vi-VN")}</div>
          <div>Đến: {new Date(record.endDate).toLocaleString("vi-VN")}</div>
        </div>
      ),
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: Event["status"]) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Số người tham gia",
      dataIndex: "participantCount",
      key: "participantCount",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: Event) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => {
              /* TODO: Implement view event details */
            }}
          >
            Xem
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            loading={loading}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-6">Quản lý sự kiện</h1>
          <Table
            columns={columns}
            dataSource={events}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} sự kiện`,
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(EventManagement);
