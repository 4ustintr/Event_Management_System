import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { mockUsers } from "../data/mockData";

type UserRole = "student" | "club" | "admin" | null;

interface User {
  fullName?: string;
  studentId?: string;
  phone?: string;
  email?: string;
  role: UserRole;
}

interface AuthContextType {
  userRole: UserRole;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  user: User | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize auth state from localStorage
    const savedRole = localStorage.getItem("userRole");
    const savedUser = localStorage.getItem("user");

    if (savedRole && savedUser) {
      setUserRole(savedRole as UserRole);
      setUser(JSON.parse(savedUser));
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const mockUser = mockUsers.find(
      (u) => u.email === email && u.password === password
    );

    if (mockUser) {
      const userData = {
        fullName: mockUser.full_name,
        studentId: mockUser.user_id,
        phone: mockUser.phone,
        email: mockUser.email,
        role: mockUser.role as UserRole,
      };
      setUserRole(mockUser.role as UserRole);
      setUser(userData);
      // Lưu vào localStorage
      localStorage.setItem("userRole", mockUser.role);
      localStorage.setItem("user", JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUserRole(null);
    setUser(null);
    // Xóa khỏi localStorage
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        userRole,
        isAuthenticated: userRole !== null,
        login,
        logout,
        user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
