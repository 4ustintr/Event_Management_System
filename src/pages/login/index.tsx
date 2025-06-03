import { Form, Input, Button, Card, message, Typography, Select } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import Link from "next/link";

const { Title, Text } = Typography;
const { Option } = Select;

const LoginPage = () => {
  const router = useRouter();
  const { login, userRole, isAuthenticated } = useAuth();
  const { returnUrl } = router.query;

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === "student") {
        router.replace(returnUrl?.toString() || "/events");
      } else if (userRole === "club") {
        router.replace("/dashboard/club");
      } else if (userRole === "admin") {
        router.replace("/admin");
      }
    }
  }, [userRole, router, returnUrl, isAuthenticated]);

  const onFinish = async (values: any) => {
    try {
      // Kiểm tra email phù hợp với role được chọn
      if (values.role === "club" && !values.email.endsWith("@club.clb")) {
        message.error("Email của CLB phải có đuôi @club.clb!");
        return;
      }
      if (
        values.role === "admin" &&
        !values.email.endsWith("@university.com")
      ) {
        message.error("Email của admin phải có đuôi @university.com!");
        return;
      }

      const success = await login(values.email, values.password);

      if (success) {
        message.success("Đăng nhập thành công!");
        // Chuyển hướng dựa trên vai trò
        if (userRole === "student") {
          router.replace(returnUrl?.toString() || "/events");
        } else if (userRole === "club") {
          router.replace("/dashboard/club");
        } else if (userRole === "admin") {
          router.replace("/admin");
        }
      } else {
        message.error("Email hoặc mật khẩu không đúng!");
      }
    } catch (error) {
      message.error("Đăng nhập thất bại. Vui lòng thử lại!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-8">
          <Title level={2} className="text-2xl font-bold text-gray-800 mb-2">
            Đăng Nhập
          </Title>
          <Text className="text-gray-600">
            Đăng nhập để tham gia các sự kiện
          </Text>
        </div>

        <Form name="login" onFinish={onFinish} layout="vertical" size="large">
          <Form.Item
            name="role"
            rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
          >
            <Select placeholder="Chọn vai trò">
              <Option value="student">Sinh viên</Option>
              <Option value="club">Câu lạc bộ</Option>
              <Option value="admin">Quản trị viên</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Email"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Mật khẩu"
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full h-12 text-lg rounded-lg bg-blue-600 hover:bg-blue-700"
            >
              Đăng Nhập
            </Button>
          </Form.Item>

          <div className="text-center">
            <Text className="text-gray-600">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đăng ký ngay
              </Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage;
