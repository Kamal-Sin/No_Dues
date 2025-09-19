import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Link,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useSnackbar } from "../contexts/SnackbarContext";
import { apiClient } from "../contexts/AuthContext";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [departmentName, setDepartmentName] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if (role === "staff") {
      const fetchDepts = async () => {
        try {
          const response = await apiClient.get("/departments");
          setDepartments(response.data || []);
        } catch (err) {
          showSnackbar(
            "Could not load departments. Please enter department name manually.",
            "warning"
          );
        }
      };
      fetchDepts();
    }
  }, [role, showSnackbar]);

  const validateForm = () => {
    if (!name.trim()) {
      setFormError("Full name is required.");
      return false;
    }
    if (!email.trim()) {
      setFormError("Email is required.");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError("Email is invalid.");
      return false;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setFormError("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
      return false;
    }
    if (role === "staff" && !departmentName.trim()) {
      setFormError("Department name is required for staff.");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = { name, email, password, role };
      if (role === "staff") payload.departmentName = departmentName;
      await apiClient.post("/auth/register", payload);
      showSnackbar("Registration successful! Please login.", "success");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || "Registration failed.");
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
              Create Account
            </Typography>
            <Typography variant="body1" sx={{ color: "#666" }}>
              Join the No-Dues digital management system
            </Typography>
          </Box>

          {/* Error Messages */}
          {formError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {formError}
            </Alert>
          )}

          {/* Registration Form */}
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={!!(formError && formError.toLowerCase().includes("name"))}
              helperText={
                formError && formError.toLowerCase().includes("name")
                  ? formError
                  : ""
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!(formError && formError.toLowerCase().includes("email"))}
              helperText={
                formError && formError.toLowerCase().includes("email")
                  ? formError
                  : "e.g., user@example.com"
              }
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={
                !!(formError && formError.toLowerCase().includes("password"))
              }
              helperText={
                formError && formError.toLowerCase().includes("password")
                  ? formError
                  : "Min. 8 characters with uppercase, lowercase, and number"
              }
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel id="role-select-label">Role</InputLabel>
              <Select
                labelId="role-select-label"
                id="role"
                value={role}
                label="Role"
                onChange={(e) => {
                  setRole(e.target.value);
                  setDepartmentName(""); /* Reset dept on role change */
                }}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            {role === "staff" && (
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="department-select-label">Department</InputLabel>
                <Select
                  labelId="department-select-label"
                  value={departmentName}
                  label="Department"
                  onChange={(e) => setDepartmentName(e.target.value)}
                  error={
                    !!(
                      formError &&
                      formError.toLowerCase().includes("department")
                    )
                  }
                >
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <MenuItem key={dept._id} value={dept.name}>
                        {dept.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No departments available
                    </MenuItem>
                  )}
                </Select>
                {formError &&
                  formError.toLowerCase().includes("department") && (
                    <Typography color="error" variant="caption">
                      {formError}
                    </Typography>
                  )}
                {departments.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Please contact admin to add departments first.
                  </Typography>
                )}
              </FormControl>
            )}
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
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: "#666" }}>
              OR
            </Typography>
          </Divider>

          {/* Login Link */}
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body1" sx={{ color: "#666", mb: 1 }}>
              Already have an account?
            </Typography>
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: "#ff6b35",
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Sign In
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
