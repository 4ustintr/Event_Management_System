import { Card, Row, Col, Statistic } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import AdminHeader from "@/components/layout/headers/AdminHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const AdminDashboard = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || userRole !== "admin") {
      router.replace("/login");
    }
  }, [isAuthenticated, userRole, router]);

  if (!isAuthenticated || userRole !== "admin") {
    return null;
  }

  const managementCards = [
    {
      title: "Quản lý sinh viên",
      icon: <UserOutlined style={{ fontSize: "24px" }} />,
      path: "/admin/students",
      color: "#1890ff",
      count: 0,
    },
    {
      title: "Quản lý câu lạc bộ",
      icon: <TeamOutlined style={{ fontSize: "24px" }} />,
      path: "/admin/clubs",
      color: "#52c41a",
      count: 0,
    },
    {
      title: "Quản lý sự kiện",
      icon: <CalendarOutlined style={{ fontSize: "24px" }} />,
      path: "/admin/events",
      color: "#722ed1",
      count: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Tổng Quan Hệ Thống</h1>
        <Row gutter={[16, 16]}>
          {managementCards.map((card) => (
            <Col xs={24} sm={12} md={8} key={card.path}>
              <Card
                hoverable
                onClick={() => router.push(card.path)}
                className="h-full"
              >
                <Statistic
                  title={card.title}
                  value={card.count}
                  prefix={card.icon}
                  valueStyle={{ color: card.color }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default AdminDashboard;
