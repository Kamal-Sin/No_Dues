import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log("ProtectedRoute:", {
    user,
    loading,
    allowedRoles,
    pathname: location.pathname,
  });

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "calc(100vh - 64px)",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    console.log("No user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log("User role not allowed, redirecting");
    if (user.role === "student")
      return <Navigate to="/student/dashboard" replace />;
    if (user.role === "staff")
      return <Navigate to="/staff/dashboard" replace />;
    if (user.role === "admin")
      return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  console.log("Rendering protected content");
  return children;
};

export default ProtectedRoute;
