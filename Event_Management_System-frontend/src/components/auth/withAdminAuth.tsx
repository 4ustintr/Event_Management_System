import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Spin } from "antd";

export const withAdminAuth = (WrappedComponent: React.ComponentType) => {
  return function WithAdminAuthComponent(props: any) {
    const router = useRouter();
    const { userRole, isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.replace(`/login?returnUrl=${router.pathname}`);
          return;
        }

        if (userRole !== "admin") {
          router.replace("/login");
          return;
        }
      }
    }, [isAuthenticated, userRole, router, isLoading]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Spin size="large" />
        </div>
      );
    }

    if (!isAuthenticated || userRole !== "admin") {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
};
