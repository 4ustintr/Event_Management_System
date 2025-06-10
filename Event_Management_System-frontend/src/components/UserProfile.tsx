import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { memo } from "react";
import { useAuth } from "@/contexts/AuthContext";

const UserProfile = memo(() => {
  const { userRole } = useAuth();

  const getRoleStyles = () => {
    switch (userRole) {
      case "admin":
        return {
          container: "bg-purple-50",
          avatar: "bg-purple-500",
          text: "text-purple-700",
          label: "Quản trị viên",
        };
      case "club":
        return {
          container: "bg-blue-50",
          avatar: "bg-blue-500",
          text: "text-blue-700",
          label: "CLB",
        };
      default:
        return {
          container: "bg-green-50",
          avatar: "bg-green-500",
          text: "text-green-700",
          label: "Sinh viên",
        };
    }
  };

  const styles = getRoleStyles();

  return (
    <div
      className={`flex items-center gap-3 ${styles.container} px-4 py-2 rounded-full`}
    >
      <Avatar icon={<UserOutlined />} className={styles.avatar} />
      <span className={`${styles.text} font-medium`}>{styles.label}</span>
    </div>
  );
});

UserProfile.displayName = "UserProfile";

export default UserProfile;
