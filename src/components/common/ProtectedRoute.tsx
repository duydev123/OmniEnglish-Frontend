import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUserStore } from "../../stores/user/useUserStore";

export const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem("token");
  const { user } = useUserStore();

  // If there is no token in localStorage and no authenticated user in store, redirect to /login
  const isAuthenticated = Boolean(token || user?.token || user?.id);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute: React.FC = () => {
  const token = localStorage.getItem("token");
  const { user } = useUserStore();
  const isAuthenticated = Boolean(token || user?.token || user?.id);

  // If user is already logged in, redirect them away from /login to home /
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
