import { Layout } from "antd";
import {
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined,
} from "@ant-design/icons";
import Link from "next/link";

const { Footer: AntFooter } = Layout;

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="container px-4 md:px-8 mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div>
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-2">
              Student Events
            </div>
            <p className="text-gray-500 max-w-xs text-sm">
              Nền tảng quản lý sự kiện dành cho sinh viên và câu lạc bộ.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="font-semibold text-gray-700 mb-2">Liên kết</div>
            <ul className="space-y-1">
              <li>
                <a
                  href="/events"
                  className="text-gray-500 hover:text-blue-600 transition"
                >
                  Sự kiện
                </a>
              </li>
              <li>
                <a
                  href="/about"
                  className="text-gray-500 hover:text-blue-600 transition"
                >
                  Giới thiệu
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  className="text-gray-500 hover:text-blue-600 transition"
                >
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <div className="font-semibold text-gray-700 mb-2">Hỗ trợ</div>
            <ul className="space-y-1">
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition"
                >
                  FAQ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition"
                >
                  Điều khoản sử dụng
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-blue-600 transition"
                >
                  Chính sách bảo mật
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Copyright */}
          <div>
            <div className="font-semibold text-gray-700 mb-2">Kết nối</div>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition text-xl"
              >
                <FacebookOutlined />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-pink-500 transition text-xl"
              >
                <InstagramOutlined />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition text-xl"
              >
                <TwitterOutlined />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-700 transition text-xl"
              >
                <LinkedinOutlined />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-xs text-gray-400 mt-8 pt-4 border-t border-gray-100">
          © 2024 Student Events. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
