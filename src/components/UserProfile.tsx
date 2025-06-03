import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { memo } from "react";

const UserProfile = memo(() => (
  <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-full">
    <Avatar icon={<UserOutlined />} className="bg-blue-500" />
    <span className="text-blue-700 font-medium">Sinh viên</span>
  </div>
));

UserProfile.displayName = "UserProfile";

export default UserProfile;
