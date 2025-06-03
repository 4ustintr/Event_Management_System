import { Menu, Button } from "antd";
import { useRouter } from "next/router";
import Link from "next/link";

const GuestHeader = () => {
  const router = useRouter();

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
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-2 py-4">
        <div className="flex justify-between items-center">
          <Link
            href="/"
            className=" text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent hover:from-blue-700 hover:to-blue-500 transition-all duration-300"
          >
            Nền Tảng Sự Kiện
          </Link>

          <div className="flex items-center gap-8">
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
        </div>
      </div>
    </header>
  );
};

export default GuestHeader;
