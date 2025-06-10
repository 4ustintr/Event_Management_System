import { List, Card, Badge, Tag, Space } from "antd";
import { memo } from "react";
import { Notification } from "@/types/api.types";
import dayjs from "dayjs";

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = memo(
  ({ notification, onMarkAsRead }: NotificationItemProps) => {
    return (
      <List.Item>
        <Card
          className="w-full hover:shadow-md transition-shadow duration-300"
          onClick={() => onMarkAsRead(notification.id)}
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
              <Space className="">
              {notification.event_id && (
                <Tag color="blue">Sự kiện: {notification.title}</Tag>
              )}
              {notification.type && (
                <Tag color="geekblue">Loại: {notification.type}</Tag>
              )}
              </Space>
            </div>
          </div>
        </Card>
      </List.Item>
    );
  }
);

NotificationItem.displayName = "NotificationItem";

export default NotificationItem;
