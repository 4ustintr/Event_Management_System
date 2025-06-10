import { Avatar, Button, Menu } from "antd";
import { UserOutlined, LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState, memo } from "react";
import MobileDrawer from "../../MobileDrawer";

const AdminHeader = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const menuItems = [
    {
      key: "/admin",
      label: "Trang chủ",
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="flex justify-between items-center h-16">
          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-500 transition-all duration-300">
            <div>Quản Trị Hệ Thống</div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Menu
              mode="horizontal"
              selectedKeys={[router.pathname]}
              onClick={({ key }) => router.push(key)}
              className="border-0 min-w-[300px]"
              items={menuItems}
              style={{
                fontSize: "1rem",
                fontWeight: 500,
              }}
            />

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-full">
                <Avatar icon={<UserOutlined />} className="bg-purple-500" />
                <span className="text-purple-700 font-medium">
                  Quản trị viên
                </span>
              </div>
              <Button
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="btn-danger"
              >
                Đăng Xuất
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setIsDrawerVisible(true)}
            />
          </div>
        </div>
      </div>

      <MobileDrawer
        visible={isDrawerVisible}
        onClose={() => setIsDrawerVisible(false)}
        menuItems={menuItems}
        onLogout={handleLogout}
      />
    </header>
  );
};

export default memo(AdminHeader);
