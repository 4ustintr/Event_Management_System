import type { AppProps } from "next/app";
import { ConfigProvider, Spin } from "antd";
import viVN from "antd/locale/vi_VN";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import EventReminder from "@/components/EventReminder";
import Layout from "@/components/layout/Layout";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import "../styles/globals.css";

function AppContent({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const isAdminPage = router.pathname.startsWith("/admin");
  const isStudentPage = router.pathname.startsWith("/dashboard/student");
  const isClubPage = router.pathname.startsWith("/dashboard/club");
  const isLoginPage = router.pathname === "/login";

  useEffect(() => {
    if (!isLoading) {
      // Kiểm tra quyền truy cập cho các trang được bảo vệ
      if (!isLoginPage) {
        if (isAdminPage && (!isAuthenticated || userRole !== "admin")) {
          router.replace("/login");
        } else if (
          isStudentPage &&
          (!isAuthenticated || userRole !== "student")
        ) {
          router.replace("/login");
        } else if (isClubPage && (!isAuthenticated || userRole !== "club")) {
          router.replace("/login");
        }
      } else if (isLoginPage && isAuthenticated) {
        // Nếu đã đăng nhập và đang ở trang login, chuyển hướng về trang tương ứng
        if (userRole === "admin") {
          router.replace("/admin");
        } else if (userRole === "student") {
          router.replace("/events");
        } else if (userRole === "club") {
          router.replace("/dashboard/club");
        }
      }
    }
  }, [isAuthenticated, userRole, router.pathname, isLoading]);

  // Hiển thị loading spinner trong khi kiểm tra trạng thái đăng nhập
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Không sử dụng Layout cho trang admin
  if (isAdminPage) {
    return <Component {...pageProps} />;
  }

  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default function App(props: AppProps) {
  return (
    <ConfigProvider locale={viVN}>
      <AuthProvider>
        <AppContent {...props} />
      </AuthProvider>
    </ConfigProvider>
  );
}
