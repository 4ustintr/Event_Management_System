import { useState, useEffect } from "react";
import { List, Card, Badge, message, Tag } from "antd";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import { mockNotifications, mockEvents } from "../../data/mockData";
import dayjs from "dayjs";

const NotificationsPage = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(mockNotifications);

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để xem thông báo");
      router.push("/login");
      return;
    }

    if (userRole !== "student") {
      message.error("Chỉ sinh viên mới có thể xem thông báo");
      router.push("/");
      return;
    }
  }, [isAuthenticated, userRole, router]);

  const getEventTitle = (eventId: string) => {
    const event = mockEvents.find((e) => e.id === eventId);
    return event ? event.title : "Sự kiện không xác định";
  };

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
                  // Mark as read when clicked
                  const updatedNotifications = notifications.map((n) =>
                    n.id === notification.id ? { ...n, isRead: true } : n
                  );
                  setNotifications(updatedNotifications);
                }}
              >
                <div className="flex items-start gap-4">
                  <Badge dot={!notification.isRead} color="blue" />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {notification.title}
                      </h3>
                      <span className="text-sm text-gray-500">
                        {dayjs(notification.createdAt).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{notification.content}</p>
                    <Tag color="blue">
                      {getEventTitle(notification.eventId)}
                    </Tag>
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
