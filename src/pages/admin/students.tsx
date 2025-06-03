import { Table, Button, Space, Popconfirm, message } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useState } from "react";
import { withAdminAuth } from "@/components/auth/withAdminAuth";
import AdminHeader from "@/components/layout/headers/AdminHeader";

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  createdAt: string;
}

const StudentManagement = () => {
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      // TODO: Implement API call to delete student
      // await deleteStudent(id);
      message.success("Xóa tài khoản sinh viên thành công");
      setStudents(students.filter((student) => student.id !== id));
    } catch (error) {
      message.error("Có lỗi xảy ra khi xóa tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Họ và tên",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Mã sinh viên",
      dataIndex: "studentId",
      key: "studentId",
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: Student) => (
        <Space size="middle">
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa tài khoản này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Có"
            cancelText="Không"
          >
            <Button danger icon={<DeleteOutlined />} loading={loading}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h1 className="text-2xl font-bold mb-6">
            Quản lý tài khoản sinh viên
          </h1>
          <Table
            columns={columns}
            dataSource={students}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Tổng số ${total} tài khoản`,
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default withAdminAuth(StudentManagement);
