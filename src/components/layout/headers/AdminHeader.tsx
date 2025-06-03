import { Avatar, Button } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const AdminHeader = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const menuItems = [
    {
      key: "/admin",
      label: "Quản Lý Hệ Thống",
    },
    {
      key: "/admin/students",
      label: "Quản Lý Sinh Viên",
    },
    {
      key: "/admin/clubs",
      label: "Quản Lý Câu Lạc Bộ",
    },
    {
      key: "/admin/events",
      label: "Quản Lý Sự Kiện",
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
            <Link href="/admin">Quản Trị Hệ Thống</Link>
          </div>

          <div className="flex items-center gap-8">
            <nav className="flex items-center gap-6">
              {menuItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.key}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    router.pathname === item.key
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-purple-50 px-4 py-2 rounded-full">
                <Avatar icon={<UserOutlined />} className="bg-purple-500" />
                <span className="text-purple-700 font-medium">
                  Quản trị viên
                </span>
              </div>
              <Button
                type="text"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-500"
              >
                Đăng Xuất
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
