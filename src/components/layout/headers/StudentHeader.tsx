import { Menu, Button, Badge } from "antd";
import { LogoutOutlined, MenuOutlined, BellOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo, memo, useEffect } from "react";
import { mockNotifications } from "@/data/mockData";
import UserProfile from "../../UserProfile";
import NotificationDrawer from "../../NotificationDrawer";
import MobileDrawer from "../../MobileDrawer";

const StudentHeader = () => {
  const router = useRouter();
  const { logout, userRole } = useAuth();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [isNotificationDrawerVisible, setIsNotificationDrawerVisible] =
    useState(false);

  useEffect(() => {
    if (userRole !== "student") {
      router.push("/login");
    }
  }, [userRole, router]);

  const unreadNotifications = useMemo(
    () => mockNotifications.filter((n) => !n.isRead).length,
    [mockNotifications]
  );

  const menuItems = useMemo(
    () => [
      {
        key: "/events",
        label: "Sự Kiện",
      },
      {
        key: "/events/registered",
        label: "Sự Kiện Đã Đăng Ký",
      },
      {
        key: "/dashboard/student",
        label: "Trang Cá Nhân",
      },
    ],
    []
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const handleMarkAsRead = (notificationId: string) => {
    const updatedNotifications = mockNotifications.map((n) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    mockNotifications.splice(
      0,
      mockNotifications.length,
      ...updatedNotifications
    );
  };

  if (userRole !== "student") {
    return null;
  }

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
              <Badge count={unreadNotifications} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined />}
                  onClick={() => setIsNotificationDrawerVisible(true)}
                  className="text-gray-600 hover:text-blue-600"
                />
              </Badge>
              <UserProfile />
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
          <div className="flex items-center gap-2 md:hidden">
            <Badge count={unreadNotifications} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => setIsNotificationDrawerVisible(true)}
                className="text-gray-600"
              />
            </Badge>
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

      <NotificationDrawer
        visible={isNotificationDrawerVisible}
        onClose={() => setIsNotificationDrawerVisible(false)}
        onMarkAsRead={handleMarkAsRead}
      />
    </header>
  );
};

export default memo(StudentHeader);
