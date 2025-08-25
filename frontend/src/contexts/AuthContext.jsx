import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Box, CircularProgress } from "@mui/material";
import axios from "axios";

// Helper function to safely get base URL
const getApiBaseURL = () => {
  console.log('Environment check:', {
    process: typeof process,
    env: process.env,
    REACT_APP_API_URL: process.env?.REACT_APP_API_URL,
    hostname: window.location.hostname
  });
  
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_URL
  ) {
    console.log('Using environment variable:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback for production
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    console.log('Production detected, but no REACT_APP_API_URL found');
    console.log('Using Railway fallback URL');
    // Temporary explicit fallback for deployed site
    return 'https://nodues-production.up.railway.app/api';
  }
  
  console.log('Using localhost fallback');
  return "http://localhost:5000/api";
};

const baseURL = getApiBaseURL();
const apiClient = axios.create({
  baseURL: baseURL,
});

// Log the final API base URL
console.log('Final API Base URL:', baseURL);
console.log('API Client baseURL:', apiClient.defaults.baseURL);

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("noDuesToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error(
        "Error accessing token from localStorage for API request",
        error
      );
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
      console.warn(
        "API request returned 401 Unauthorized. Dispatching auth-error-401 event."
      );
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
  const [authError, setAuthError] = useState(""); // For global auth errors like session expiry

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
      console.error("Failed to parse user from localStorage", error);
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
    setAuthError("");
  };

  const value = useMemo(
    () => ({ user, login, logout, loading, authError, setAuthError }),
    [user, login, logout, loading, authError]
  );

  if (loading && !user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);
export { apiClient };
