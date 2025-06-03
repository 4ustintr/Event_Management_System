import { Drawer, Button, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { memo } from "react";
import { useRouter } from "next/router";
import UserProfile from "./UserProfile";

interface MobileDrawerProps {
  visible: boolean;
  onClose: () => void;
  menuItems: Array<{ key: string; label: string }>;
  onLogout: () => void;
}

const MobileDrawer = memo(
  ({ visible, onClose, menuItems, onLogout }: MobileDrawerProps) => {
    const router = useRouter();

    return (
      <Drawer
        title="Menu"
        placement="right"
        onClose={onClose}
        open={visible}
        className="md:hidden"
      >
        <div className="flex flex-col gap-4">
          {menuItems.map((item) => (
            <Button
              key={item.key}
              type={router.pathname === item.key ? "primary" : "text"}
              onClick={() => {
                router.push(item.key);
                onClose();
              }}
              className="text-left"
            >
              {item.label}
            </Button>
          ))}
          <UserProfile />
          <Button
            icon={<LogoutOutlined />}
            onClick={onLogout}
            className="btn-danger mt-4"
          >
            Đăng Xuất
          </Button>
        </div>
      </Drawer>
    );
  }
);

MobileDrawer.displayName = "MobileDrawer";

export default MobileDrawer;
