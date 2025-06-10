import { useEffect, useState } from "react";
import { Table, Card, Button, message, Popconfirm, Rate, Spin } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { feedbackService } from "@/api/services/feedback.service";
import dayjs from "dayjs";

const FeedbackManagementPage = () => {
  const router = useRouter();
  const { userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (userRole !== "admin") {
      router.replace("/");
      return;
    }

    fetchFeedbacks();
  }, [userRole, router]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getAllFeedbacks();
      if (response.success) {
        setFeedbacks(response.data.feedbacks);
      } else {
        messageApi.open({
          type: "error",
          content: "Không thể tải danh sách đánh giá",
        });
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      messageApi.open({
        type: "error",
        content: "Đã xảy ra lỗi khi tải danh sách đánh giá",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    try {
      const response = await feedbackService.deleteFeedback(feedbackId);
      if (response.success) {
        messageApi.open({
          type: "success",
          content: "Xóa đánh giá thành công",
        });
        fetchFeedbacks();
      } else {
        messageApi.open({
          type: "error",
          content: "Không thể xóa đánh giá",
        });
      }
    } catch (error) {
      console.error("Error deleting feedback:", error);
      messageApi.open({
        type: "error",
        content: "Đã xảy ra lỗi khi xóa đánh giá",
      });
    }
  };

  const columns = [
    {
      title: "Sự kiện",
      dataIndex: ["event", "title"],
      key: "event",
    },
    {
      title: "Người đánh giá",
      dataIndex: ["user", "full_name"],
      key: "user",
    },
    {
      title: "Đánh giá",
      dataIndex: "rating",
      key: "rating",
      render: (rating: number) => <Rate disabled defaultValue={rating} />,
    },
    {
      title: "Nhận xét",
      dataIndex: "comment",
      key: "comment",
      ellipsis: true,
    },
    {
      title: "Thời gian",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: any) => (
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa đánh giá này?"
          onConfirm={() => handleDeleteFeedback(record._id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            className="hover:text-red-600"
          />
        </Popconfirm>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải danh sách đánh giá..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {contextHolder}
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Quản lý đánh giá
            </h1>
            <Button onClick={() => router.push("/admin")}>Quay lại</Button>
          </div>

          <Card>
            <Table
              columns={columns}
              dataSource={feedbacks}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng số ${total} đánh giá`,
              }}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedbackManagementPage;
