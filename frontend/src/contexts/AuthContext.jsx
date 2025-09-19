import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import axios from "axios";

// Helper function to safely get base URL
const getApiBaseURL = () => {
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL
  ) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback for production
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://no-dues-backend.onrender.com/api';
  }
  
  return "http://localhost:5000/api";
};

const baseURL = getApiBaseURL();
const apiClient = axios.create({
  baseURL: baseURL,
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("noDuesToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error accessing token from localStorage:", error.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 errors (session expiration)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(
        new CustomEvent("auth-error-401", {
          detail: {
            message:
              error.response.data?.message ||
              "Session expired or invalid. Please login again.",
          },
        })
      );
    }
    return Promise.reject(error);
  }
);

// Auth Context
const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const logout = useCallback(() => {
    localStorage.removeItem("noDuesUser");
    localStorage.removeItem("noDuesToken");
    setUser(null);
  }, []);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("noDuesUser");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error.message);
      logout(); // Clear corrupted storage
    }
    setLoading(false);
  }, [logout]);

  useEffect(() => {
    const handleAuthError = (event) => {
      setAuthError(
        event.detail?.message || "Your session has expired. Please login again."
      );
      logout();
    };
    window.addEventListener("auth-error-401", handleAuthError);
    return () => {
      window.removeEventListener("auth-error-401", handleAuthError);
    };
  }, [logout]);

  const login = (userData) => {
    localStorage.setItem("noDuesUser", JSON.stringify(userData.user));
    localStorage.setItem("noDuesToken", userData.token);
    setUser(userData.user);
  };

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
      authError,
      setAuthError,
    }),
    [user, login, logout, loading, authError, setAuthError]
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { apiClient };
