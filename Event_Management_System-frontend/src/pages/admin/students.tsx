import { useEffect, useState } from "react";
import { Table, Button, message, Popconfirm, Space, Input, Spin } from "antd";
import { SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { userService } from "@/api/services/user.service";
import { User } from "@/types/api.types";


const { Search } = Input;

const StudentManagement = () => {
  const router = useRouter();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (userRole !== "admin") {
      router.replace("/");
      return;
    }

    fetchStudents();
  }, [userRole, router]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await userService.getUsers({ role: "student" });
      if (response.success) {
        setStudents(response.data.users);
      } else {
        message.error("Không thể tải danh sách sinh viên");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      message.error("Có lỗi xảy ra khi tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (studentId: string) => {
    try {
      const response = await userService.deleteUser(studentId);
      if (response.success) {
        message.success("Xóa sinh viên thành công");
        fetchStudents();
      } else {
        message.error(response.message || "Không thể xóa sinh viên");
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      message.error("Có lỗi xảy ra khi xóa sinh viên");
    }
  };

  const columns = [
    {
      title: "MSSV",
      dataIndex: "student_id",
      key: "student_id",
    },
    {
      title: "Họ và tên",
      dataIndex: "full_name",
      key: "full_name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: unknown, record: User) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa sinh viên này?"
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

  const filteredStudents = students.filter(
    (student: any) =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải danh sách sinh viên..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <main className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-6">
            Quản lý tài khoản sinh viên
          </h1>
          <div className="flex justify-between items-center mb-8">
            <Button onClick={() => router.push("/admin")}>Quay lại</Button>
          </div>
          <Search
            placeholder="Tìm kiếm sinh viên..."
            allowClear
            enterButton={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <Table
            columns={columns}
            dataSource={filteredStudents}
            rowKey="_id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} sinh viên`,
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default StudentManagement;
