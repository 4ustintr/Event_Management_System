import { Menu, Avatar, Button, Drawer } from "antd";
import { UserOutlined, LogoutOutlined, MenuOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

const ClubHeader = () => {
  const router = useRouter();
  const { logout } = useAuth();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const menuItems = [
    {
      key: "/events/create",
      label: "Tạo Sự Kiện",
    },
    {
      key: "/events/manage",
      label: "Quản Lý Sự Kiện",
    },
    {
      key: "/dashboard/club",
      label: "Trang CLB",
    },
  ];

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const showDrawer = () => {
    setIsDrawerVisible(true);
  };

  const closeDrawer = () => {
    setIsDrawerVisible(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-100">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="flex justify-between items-center h-16">
          <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-500 transition-all duration-300">
            Nền Tảng Sự Kiện
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
              <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full">
                <Avatar icon={<UserOutlined />} className="bg-blue-500" />
                <span className="text-blue-700 font-medium">CLB</span>
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
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={showDrawer}
            className="md:hidden"
          />
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={closeDrawer}
        open={isDrawerVisible}
        className="md:hidden"
      >
        <div className="flex flex-col gap-4">
          {menuItems.map((item) => (
            <Button
              key={item.key}
              type={router.pathname === item.key ? "primary" : "text"}
              onClick={() => {
                router.push(item.key);
                closeDrawer();
              }}
              className="text-left"
            >
              {item.label}
            </Button>
          ))}
          <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full mt-4">
            <Avatar icon={<UserOutlined />} className="bg-blue-500" />
            <span className="text-blue-700 font-medium">CLB</span>
          </div>
          <Button
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="btn-danger mt-4"
          >
            Đăng Xuất
          </Button>
        </div>
      </Drawer>
    </header>
  );
};

export default ClubHeader;
