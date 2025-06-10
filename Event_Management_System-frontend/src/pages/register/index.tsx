import { Form, Input, Button, Card, message, Select, Typography } from "antd";
import { UserOutlined, LockOutlined, PhoneOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useState } from "react";
import { authService } from "@/api/services/auth.service";

const { Option } = Select;
const { Title, Text } = Typography;

const RegisterPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const onFinish = async (values: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    role: string;
  }) => {
    const { email, role, password, full_name, phone } = values;

    // Kiểm tra email của CLB phải có đuôi .clb
    if (role === "club" && !email.endsWith("@club.clb")) {
      messageApi.open({
        type: "error",
        content: "Email của CLB phải có đuôi @club.clb!",
      });
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        email,
        password,
        full_name,
        phone,
        roles: [{ role_name: role as "student" | "club" | "admin" }], // Changed to match User interface
      });

      messageApi.open({
        type: "success",
        content: "Đăng ký thành công! Vui lòng đăng nhập.",
      });
      router.push("/login");
    } catch (error: any) {
      console.error("Registration failed:", error);
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card
          className="shadow-xl border-0 rounded-lg overflow-hidden"
          styles={{ body: { padding: "2rem" } }}
        >
          <div className="text-center mb-8">
            <Title level={2} className="text-2xl font-bold text-gray-800 mb-2">
              Tạo Tài Khoản Mới
            </Title>
            <Text className="text-gray-600">
              Đăng ký để tham gia các sự kiện
            </Text>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="role"
              rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
            >
              <Select placeholder="Chọn vai trò" className="rounded-lg">
                <Option value="student">Sinh viên</Option>
                <Option value="club">Câu lạc bộ</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="full_name"
              rules={[{ required: true, message: "Vui lòng nhập họ tên!" }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Họ tên"
                className="rounded-lg"
              />
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
              name="phone"
              rules={[
                { required: true, message: "Vui lòng nhập số điện thoại!" },
                {
                  pattern: /^[0-9]{10}$/,
                  message: "Số điện thoại không hợp lệ!",
                },
              ]}
            >
              <Input
                prefix={<PhoneOutlined className="text-gray-400" />}
                placeholder="Số điện thoại"
                className="rounded-lg"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
              ]}
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
                loading={loading}
              >
                Đăng Ký
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Text className="text-gray-600">
              Đã có tài khoản?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Đăng nhập ngay
              </a>
            </Text>
          </div>

          <div className="mt-4 text-center">
            <Text type="secondary" className="text-sm">
              Lưu ý: Quản trị viên không thể đăng ký tài khoản mới.
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
