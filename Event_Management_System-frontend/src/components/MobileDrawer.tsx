import { Drawer, Button, Avatar } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { memo } from "react";
import { useRouter } from "next/router";
import UserProfile from "./UserProfile";
import { useAuth } from "@/contexts/AuthContext";

interface MobileDrawerProps {
  visible: boolean;
  onClose: () => void;
  menuItems: Array<{ key: string; label: string }>;
  onLogout: () => void;
}

const MobileDrawer = memo(
  ({ visible, onClose, menuItems, onLogout }: MobileDrawerProps) => {
    const router = useRouter();
    const { isAuthenticated, userRole } = useAuth();

    const renderUserSection = () => {
      if (!isAuthenticated) {
        return (
          <div className="flex flex-col gap-2 mt-4">
            <Button
              type="primary"
              onClick={() => {
                router.push("/login");
                onClose();
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Đăng Nhập
            </Button>
            <Button
              onClick={() => {
                router.push("/register");
                onClose();
              }}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Đăng Ký
            </Button>
          </div>
        );
      }

      return (
        <>
          <UserProfile />
          <Button
            icon={<LogoutOutlined />}
            onClick={onLogout}
            className="btn-danger mt-4"
          >
            Đăng Xuất
          </Button>
        </>
      );
    };

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
          {renderUserSection()}
        </div>
      </Drawer>
    );
  }
);

MobileDrawer.displayName = "MobileDrawer";

export default MobileDrawer;
