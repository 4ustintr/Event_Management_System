import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { GuestHeader, StudentHeader, ClubHeader, AdminHeader } from "./headers";
import Footer from "./Footer";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { userRole } = useAuth();

  const renderHeader = () => {
    switch (userRole) {
      case "student":
        return <StudentHeader />;
      case "club":
        return <ClubHeader />;
      case "admin":
        return <AdminHeader />;
      default:
        return <GuestHeader />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {renderHeader()}
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
