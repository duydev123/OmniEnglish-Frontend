import React, { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { useUserStore, initialUser } from "../../stores/user/useUserStore";
import { useToast } from "./Toast";

export const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem("token");
  const { user, setUser } = useUserStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(token || user?.token || user?.id);
  const isBlocked =
    user?.status?.toLowerCase() === "suspended" ||
    user?.status?.toLowerCase() === "blocked" ||
    user?.status?.toLowerCase() === "inactive";

  useEffect(() => {
    if (isAuthenticated && isBlocked) {
      localStorage.removeItem("token");
      setUser(initialUser);
      showToast("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!", "error");
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isBlocked, setUser, showToast, navigate]);

  if (!isAuthenticated || isBlocked) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const AdminRoute: React.FC = () => {
  const token = localStorage.getItem("token");
  const { user, setUser } = useUserStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(token || user?.token || user?.id);
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isBlocked =
    user?.status?.toLowerCase() === "suspended" ||
    user?.status?.toLowerCase() === "blocked" ||
    user?.status?.toLowerCase() === "inactive";

  useEffect(() => {
    if (isAuthenticated && isBlocked) {
      localStorage.removeItem("token");
      setUser(initialUser);
      showToast("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Quản trị viên!", "error");
      navigate("/login", { replace: true });
    } else if (isAuthenticated && !isAdmin) {
      showToast("Bạn không có quyền truy cập trang Admin!", "error");
    }
  }, [isAuthenticated, isBlocked, isAdmin, setUser, showToast, navigate]);

  if (!isAuthenticated || isBlocked) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute: React.FC = () => {
  const token = localStorage.getItem("token");
  const { user } = useUserStore();
  const isAuthenticated = Boolean(token || user?.token || user?.id);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
