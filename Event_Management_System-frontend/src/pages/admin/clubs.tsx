import { useEffect, useState } from "react";
import { Table, Button, message, Popconfirm, Space, Input, Spin } from "antd";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { clubService } from "@/api/services/club.service";
import { Club } from "@/types/api.types";


const { Search } = Input;

const ClubManagement = () => {
  const router = useRouter();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clubs, setClubs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userRole !== "admin") {
      router.replace("/");
      return;
    }

    fetchClubs();
  }, [userRole, router]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await clubService.getClubs();
      if (response.success) {
        setClubs(response.data.clubs);
      } else {
        message.error("Không thể tải danh sách CLB");
      }
    } catch (error) {
      console.error("Error fetching clubs:", error);
      message.error("Có lỗi xảy ra khi tải danh sách CLB");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clubId: string) => {
    try {
      const response = await clubService.deleteClub(clubId);
      if (response.success) {
        message.success("Xóa CLB thành công");
        fetchClubs();
      } else {
        message.error(response.message || "Không thể xóa CLB");
      }
    } catch (error) {
      console.error("Error deleting club:", error);
      message.error("Có lỗi xảy ra khi xóa CLB");
    }
  };

  const columns = [
    {
      title: "Tên CLB",
      dataIndex: "club_name",
      key: "club_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: Club) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa CLB này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredClubs = clubs.filter(
    (club: any) =>
      club.club_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      club.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải danh sách CLB..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản lý CLB</h1>
          <Button onClick={() => router.push("/admin")}>Quay lại</Button>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <Search
            placeholder="Tìm kiếm CLB..."
            allowClear
            enterButton={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <Table
            columns={columns}
            dataSource={filteredClubs}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} CLB`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ClubManagement;
