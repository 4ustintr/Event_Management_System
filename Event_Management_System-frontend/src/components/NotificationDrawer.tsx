import { Drawer, List, Spin } from "antd";
import { memo, useEffect, useState } from "react";
import NotificationItem from "./modals/NotificationItem";
import { notificationService } from "@/api/services/notification.service";
import { Notification } from "@/types/api.types";

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationDrawer = memo(
  ({ visible, onClose, onMarkAsRead }: NotificationDrawerProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const response =
          await notificationService.getAllNotificationsForStudents();
        setNotifications(response.notifications || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      if (visible) {
        fetchNotifications();
      }
    }, [visible]);

    return (
      <Drawer
        title="Thông báo"
        placement="right"
        onClose={onClose}
        open={visible}
        width={400}
      >
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spin size="large" />
          </div>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <NotificationItem
                notification={notification}
                onMarkAsRead={onMarkAsRead}
              />
            )}
          />
        )}
      </Drawer>
    );
  }
);

NotificationDrawer.displayName = "NotificationDrawer";

export default NotificationDrawer;
