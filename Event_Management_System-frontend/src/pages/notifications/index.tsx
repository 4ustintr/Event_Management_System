import { useState, useEffect } from "react";
import { List, Card, Badge, message, Tag, Spin } from "antd";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { notificationService } from "@/api/services/notification.service";
import { Notification } from "@/types/api.types";
import dayjs from "dayjs";

const NotificationsPage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchMyNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getMyNotifications();
      setNotifications(data.notifications || []);
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "Không thể tải danh sách thông báo.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      messageApi.open({
        type: "error",
        content: "Vui lòng đăng nhập để xem thông báo",
      });
      router.push("/login");
      return;
    }

    if (userRole !== "student") {
      messageApi.open({
        type: "error",
        content: "Chỉ sinh viên mới có thể xem thông báo",
      });
      router.push("/");
      return;
    }
    fetchMyNotifications();
  }, [isAuthenticated, userRole, router]);

  if (loading || !isAuthenticated || userRole !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải thông báo..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thông Báo</h1>

        <List
          dataSource={notifications}
          renderItem={(notification) => (
            <List.Item>
              <Card
                className="w-full hover:shadow-md transition-shadow duration-300"
                onClick={() => {
                  const updatedNotifications = notifications.map((n) =>
                    n.id === notification.id ? { ...n, read: true } : n
                  );
                  setNotifications(updatedNotifications);
                }}
              >
                <div className="flex items-start gap-4">
                  <Badge dot={!notification.read} color="blue" />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {dayjs(notification.sent_at).format("DD/MM/YYYY HH:mm")}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{notification.message}</p>
                    {notification.event_id && (
                      <Tag color="blue">Sự kiện: {notification.event_id}</Tag>
                    )}
                    {notification.type && (
                      <Tag color="geekblue">Loại: {notification.type}</Tag>
                    )}
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>
    </div>
  );
};

export default NotificationsPage;
