import { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Spin, message } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { userService } from "@/api/services/user.service";
import { eventService } from "@/api/services/event.service";
import { clubService } from "@/api/services/club.service";
import { feedbackService } from "@/api/services/feedback.service";
import AdminHeader from "@/components/layout/headers/AdminHeader";

const AdminDashboard = () => {
  const router = useRouter();
  const { userRole, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClubs: 0,
    totalEvents: 0,
    totalFeedbacks: 0,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      message.error("Vui lòng đăng nhập để truy cập trang admin");
      router.replace("/login");
      return;
    }

    if (userRole !== "admin") {
      message.error("Bạn không có quyền truy cập trang admin");
      router.replace("/");
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const [studentsRes, clubsRes, eventsRes, feedbacksRes] =
          await Promise.all([
            userService.getUsers({ role: "student" }),
            clubService.getClubs(),
            eventService.getEvents(),
            feedbackService.getAllFeedbacks(),
          ]);

        setStats({
          totalStudents: studentsRes.data?.users?.length || 0,
          totalClubs: clubsRes.data?.clubs?.length || 0,
          totalEvents: eventsRes.data?.events?.length || 0,
          totalFeedbacks: feedbacksRes.data?.feedbacks?.length || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        message.error("Không thể tải thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userRole, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" tip="Đang tải thống kê..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AdminHeader />
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Bảng điều khiển Admin
          </h1>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Tổng số sinh viên"
                  value={stats.totalStudents}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Tổng số CLB"
                  value={stats.totalClubs}
                  prefix={<TeamOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Tổng số sự kiện"
                  value={stats.totalEvents}
                  prefix={<CalendarOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card>
                <Statistic
                  title="Tổng số đánh giá"
                  value={stats.totalFeedbacks}
                  prefix={<StarOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card
              hoverable
              className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white border-blue-100"
              onClick={() => router.push("/admin/students")}
            >
              <h2 className="text-xl font-semibold mb-2 text-blue-700">
                Quản lý sinh viên
              </h2>
              <p className="text-gray-600">
                Xem và quản lý tài khoản sinh viên
              </p>
            </Card>

            <Card
              hoverable
              className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white border-purple-100"
              onClick={() => router.push("/admin/clubs")}
            >
              <h2 className="text-xl font-semibold mb-2 text-purple-700">
                Quản lý CLB
              </h2>
              <p className="text-gray-600">Xem và quản lý tài khoản CLB</p>
            </Card>

            <Card
              hoverable
              className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-green-50 to-white border-green-100"
              onClick={() => router.push("/admin/events")}
            >
              <h2 className="text-xl font-semibold mb-2 text-green-700">
                Quản lý sự kiện
              </h2>
              <p className="text-gray-600">Duyệt và quản lý sự kiện</p>
            </Card>

            <Card
              hoverable
              className="text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-gradient-to-br from-yellow-50 to-white border-yellow-100"
              onClick={() => router.push("/admin/feedbacks")}
            >
              <h2 className="text-xl font-semibold mb-2 text-yellow-700">
                Quản lý đánh giá
              </h2>
              <p className="text-gray-600">Xem và quản lý đánh giá sự kiện</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
