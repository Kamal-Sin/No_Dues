import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Link,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  ArrowBack,
} from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { apiClient } from "../contexts/AuthContext";

const LoginPage = () => {
  const { login, user, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      const redirectTo =
        user.role === "student"
          ? "/student/dashboard"
          : user.role === "staff"
          ? "/staff/dashboard"
          : user.role === "admin"
          ? "/admin/dashboard"
          : "/";
      navigate(redirectTo, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    setAuthError("");
  }, [setAuthError, email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError("");
    setAuthError("");
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      login(response.data);
      const userRole = response.data.user.role;
      const defaultRedirect =
        userRole === "student"
          ? "/student/dashboard"
          : userRole === "staff"
          ? "/staff/dashboard"
          : userRole === "admin"
          ? "/admin/dashboard"
          : "/";
      navigate(defaultRedirect, { replace: true });
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      if (err.response?.status === 401) {
        setFormError(errMsg);
      } else {
        setFormError("An unexpected error occurred during login.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        {/* Back to Home */}
        <Box sx={{ mb: 3 }}>
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBack />}
            sx={{
              color: "#666",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": {
                color: "#ff6b35",
              },
            }}
          >
            Back to Home
          </Button>
        </Box>

        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 3,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: "bold",
                fontFamily: "serif",
                color: "#333",
                mb: 1,
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" sx={{ color: "#666" }}>
              Sign in to your No-Dues account
            </Typography>
          </Box>

          {/* Error Messages */}
          {authError && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {authError}
            </Alert>
          )}
          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "#666" }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#666" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: "#ff6b35",
                py: 1.5,
                fontSize: "1.1rem",
                fontWeight: 600,
                textTransform: "none",
                borderRadius: 2,
                mb: 3,
                "&:hover": {
                  bgcolor: "#e55a2b",
                },
                "&:disabled": {
                  bgcolor: "#ccc",
                },
              }}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: "#666" }}>
              OR
            </Typography>
          </Divider>

          {/* Register Link */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" sx={{ color: "#666", mb: 1 }}>
              Don't have an account?
            </Typography>
            <Link
              component={RouterLink}
              to="/register"
              sx={{
                color: "#ff6b35",
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Create Account
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
