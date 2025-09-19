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
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        setFormError("Unable to connect to the server. Please check your internet connection.");
      } else {
        setFormError("An unexpected error occurred during login.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f5f5",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            borderRadius: 2,
            bgcolor: "white",
            border: "1px solid #e0e0e0",
          }}
        >
          {/* Back to Home Link */}
          <Box sx={{ mb: 3, textAlign: "left" }}>
            <Link
              component={RouterLink}
              to="/"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                textDecoration: "none",
                color: "text.secondary",
                "&:hover": {
                  color: "#ff6b35",
                },
              }}
            >
              <ArrowBack sx={{ mr: 1, fontSize: 20 }} />
              Back to Home
            </Link>
          </Box>

          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: "bold",
                fontFamily: "serif",
                color: "#333",
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to your No-Dues account
            </Typography>
          </Box>

          {/* Error Messages */}
          {(formError || authError) && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError || authError}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
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
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                bgcolor: "#ff6b35",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "#e55a2b",
                },
              }}
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </Box>

          {/* Divider */}
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              OR
            </Typography>
          </Divider>

          {/* Demo Accounts Info */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Demo Accounts Available:
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Student: student@demo.com / password123
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Staff: staff@demo.com / password123
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Admin: admin@demo.com / password123
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
