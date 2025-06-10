import { Menu, Button } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import Link from "next/link";
import { useState, memo } from "react";
import MobileDrawer from "../../MobileDrawer";

const GuestHeader = () => {
  const router = useRouter();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  const menuItems = [
    {
      key: "/events",
      label: "Sự Kiện",
    },
    {
      key: "/about",
      label: "Giới Thiệu",
    },
    {
      key: "/contact",
      label: "Liên Hệ",
    },
  ];

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
              <Button
                type="primary"
                onClick={() => router.push("/login")}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Đăng Nhập
              </Button>
              <Button
                onClick={() => router.push("/register")}
                className="border-blue-500 text-blue-500 hover:bg-blue-50"
              >
                Đăng Ký
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
        onLogout={() => {}}
      />
    </header>
  );
};

export default memo(GuestHeader);
