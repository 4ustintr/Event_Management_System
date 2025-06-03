import { Drawer, List } from "antd";
import { memo } from "react";
import NotificationItem from "./layout/NotificationItem";
import { mockNotifications } from "@/data/mockData";

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

const NotificationDrawer = memo(
  ({ visible, onClose, onMarkAsRead }: NotificationDrawerProps) => (
    <Drawer
      title="Thông báo"
      placement="right"
      onClose={onClose}
      open={visible}
      width={400}
    >
      <List
        dataSource={mockNotifications}
        renderItem={(notification) => (
          <NotificationItem
            notification={notification}
            onMarkAsRead={onMarkAsRead}
          />
        )}
      />
    </Drawer>
  )
);

NotificationDrawer.displayName = "NotificationDrawer";

export default NotificationDrawer;
