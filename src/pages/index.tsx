import { Button } from "antd";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-blue-600">
          Nền Tảng Quản Lý Sự Kiện
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Kết nối sinh viên với các sự kiện thú vị và bổ ích. Đăng ký tham gia
          ngay hôm nay!
        </p>
        <div className="space-x-4"></div>
      </div>
    </div>
  );
}
