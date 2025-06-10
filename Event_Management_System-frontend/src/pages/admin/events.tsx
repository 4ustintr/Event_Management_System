import { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Popconfirm,
  Space,
  Input,
  Spin,
  Tag,
} from "antd";
import {
  SearchOutlined,
  DeleteOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { eventService } from "@/api/services/event.service";
import dayjs from "dayjs";
import { Event } from "@/types/api.types";

const { Search } = Input;

const EventManagement = () => {
  const router = useRouter();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userRole !== "admin") {
      router.replace("/");
      return;
    }

    fetchEvents();
  }, [userRole, router]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventService.getEvents();
      if (response.success) {
        setEvents(response.data.events);
      } else {
        message.error("Không thể tải danh sách sự kiện");
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      message.error("Có lỗi xảy ra khi tải danh sách sự kiện");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await eventService.deleteEvent(id);
      if (response.success) {
        message.success("Xóa sự kiện thành công");
        fetchEvents();
      } else {
        message.error(response.message || "Không thể xóa sự kiện");
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Đã xảy ra lỗi khi xóa sự kiện"
      );
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await eventService.approveEvent(id);
      if (response.success) {
        message.success("Duyệt sự kiện thành công");
        fetchEvents();
      } else {
        message.error(response.message || "Không thể duyệt sự kiện");
      }
    } catch (error: any) {
      message.error(
        error.response?.data?.message || "Đã xảy ra lỗi khi duyệt sự kiện"
      );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "green";
      case "draft":
        return "orange";
      case "completed":
        return "blue";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved":
        return "Đang diễn ra";
      case "draft":
        return "Chờ duyệt";
      case "completed":
        return "Đã kết thúc";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "CLB tổ chức",
      dataIndex: ["club", "club_name"],
      key: "club_name",
    },
    {
      title: "Thời gian",
      dataIndex: "start_time",
      key: "start_time",
      render: (startTime: string, record: Event) => (
        <span>
          {dayjs(startTime).format("HH:mm DD/MM/YYYY")} -{" "}
          {dayjs(record.end_time).format("HH:mm DD/MM/YYYY")}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: Event) => {
        const eventId = record._id;
        if (!eventId) return null;

        return (
          <Space size="middle">
            {record.status === "draft" && (
              <Popconfirm
                title="Bạn có chắc chắn muốn duyệt sự kiện này?"
                onConfirm={() => handleApprove(eventId)}
                okText="Có"
                cancelText="Không"
              >
                <Button type="primary" icon={<CheckOutlined />}>
                  Duyệt
                </Button>
              </Popconfirm>
            )}
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa sự kiện này?"
              onConfirm={() => handleDelete(eventId)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="primary" danger icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const filteredEvents = events.filter(
    (event: any) =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.club?.club_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải danh sách sự kiện..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý sự kiện</h1>
          <Button onClick={() => router.push("/admin")}>Quay lại</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <Search
            placeholder="Tìm kiếm sự kiện..."
            allowClear
            enterButton={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <Table
            columns={columns}
            dataSource={filteredEvents}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} sự kiện`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EventManagement;
