import { Form, Input, Button, Card, message, Typography, Select } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Link from "next/link";

const { Title, Text } = Typography;
const { Option } = Select;

const LoginPage = () => {
  const router = useRouter();
  const { login, userRole, isAuthenticated } = useAuth();
  const { returnUrl } = router.query;
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (isAuthenticated) {
      handleRedirect();
    }
  }, [isAuthenticated, userRole]);

  const handleRedirect = () => {
    if (userRole === "student") {
      router.replace(returnUrl?.toString() || "/events");
    } else if (userRole === "club") {
      router.replace("/dashboard/club");
    } else if (userRole === "admin") {
      router.replace("/admin");
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const success = await login(values.email, values.password);
      if (success) {
        messageApi.open({
          type: "success",
          content: "Đăng nhập thành công!",
        });
        handleRedirect();
      }
    } catch (error: any) {
      messageApi.open({
        type: "error",
        content: error.response?.data?.message || "Đăng nhập thất bại",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {contextHolder}
      <Card className="max-w-md w-full space-y-8">
        <div>
          <Title level={2} className="text-center">
            Đăng nhập
          </Title>
          <Text className="text-center block text-gray-600 mb-4">
            Đăng nhập vào hệ thống quản lý sự kiện
          </Text>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              size="large"
              loading={loading}
            >
              Đăng nhập
            </Button>
          </Form.Item>

          <div className="text-center">
            <Text>
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-blue-600 hover:text-blue-800"
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
