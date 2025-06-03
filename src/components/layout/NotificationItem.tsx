import { List, Card, Badge, Tag } from "antd";
import { memo, useMemo } from "react";
import { mockEvents } from "@/data/mockData";
import dayjs from "dayjs";

interface NotificationItemProps {
  notification: {
    id: string;
    eventId: string;
    title: string;
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  onMarkAsRead: (id: string) => void;
}

const NotificationItem = memo(
  ({ notification, onMarkAsRead }: NotificationItemProps) => {
    const event = useMemo(
      () => mockEvents.find((e) => e.id === notification.eventId),
      [notification.eventId]
    );

    return (
      <List.Item>
        <Card
          className="w-full hover:shadow-md transition-shadow duration-300"
          onClick={() => onMarkAsRead(notification.id)}
        >
          <div className="flex items-start gap-4">
            <Badge dot={!notification.isRead} color="blue" />
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {notification.title}
                </h3>
                <span className="text-sm text-gray-500">
                  {dayjs(notification.createdAt).format("DD/MM/YYYY HH:mm")}
                </span>
              </div>
              <p className="text-gray-600 mb-2">{notification.content}</p>
              <Tag color="blue">{event?.title || "Sự kiện không xác định"}</Tag>
            </div>
          </div>
        </Card>
      </List.Item>
    );
  }
);

NotificationItem.displayName = "NotificationItem";

export default NotificationItem;
