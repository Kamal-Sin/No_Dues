import React, { useState, useEffect, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  Link as RouterLink,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PostAddIcon from "@mui/icons-material/PostAdd";
import axios from "axios";

// Import contexts and components
import { AuthProvider, useAuth, apiClient } from "./contexts/AuthContext";
import { SnackbarProvider, useSnackbar } from "./contexts/SnackbarContext";
import ProtectedRoute from "./routes/ProtectedRoute";

// --- Page Components ---

// --- 4. Page Components ---

// LoginPage.js
const LoginPage = () => {
  const { login, user, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [formError, setFormError] = React.useState(""); // Specific to login form
  const [loading, setLoading] = React.useState(false);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) {
      // If user is already logged in, redirect
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

  // Clear authError when component mounts or email/password changes, so it doesn't persist from other pages
  useEffect(() => {
    setAuthError("");
  }, [setAuthError, email, password]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError("");
    setAuthError(""); // Clear global auth error before new attempt
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      login(response.data);
      // Navigate to intended page or role-based dashboard
      const userRole = response.data.user.role;
      const defaultRedirect =
        userRole === "student"
          ? "/student/dashboard"
          : userRole === "staff"
          ? "/staff/dashboard"
          : userRole === "admin"
          ? "/admin/dashboard"
          : "/";
      navigate(
        from === "/login" || from === "/" || from === "/register"
          ? defaultRedirect
          : from,
        { replace: true }
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        "Login failed. Please check your credentials.";
      if (err.response?.status === 401) {
        // Specific handling for login 401
        setFormError(errMsg); // Show error on login form
      } else {
        setFormError("An unexpected error occurred during login."); // Generic error for other issues
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Sign In
        </Typography>
        {authError && (
          <Alert severity="warning" sx={{ width: "100%", mt: 2 }}>
            {authError}
          </Alert>
        )}
        {formError && (
          <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
            {formError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!formError}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!formError}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Sign In"}
          </Button>
          <RouterLink to="/register" variant="body2">
            {"Don't have an account? Sign Up"}
          </RouterLink>
        </Box>
      </Box>
    </Container>
  );
};

// RegisterPage.js
const RegisterPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState("student");
  const [departmentName, setDepartmentName] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [departments, setDepartments] = React.useState([]);

  useEffect(() => {
    if (role === "staff") {
      const fetchDepts = async () => {
        try {
          const response = await apiClient.get("/departments");
          setDepartments(response.data || []);
        } catch (err) {
          console.error(
            "Failed to fetch departments for staff registration",
            err
          );
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
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters.");
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
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5">
          Sign Up
        </Typography>
        {formError && (
          <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
            {formError}
          </Alert>
        )}
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
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
                : "Min. 6 characters"
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
          {role === "staff" &&
            (departments.length > 0 ? (
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
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
                {formError &&
                  formError.toLowerCase().includes("department") && (
                    <Typography color="error" variant="caption">
                      {formError}
                    </Typography>
                  )}
              </FormControl>
            ) : (
              <TextField
                margin="normal"
                required={role === "staff"}
                fullWidth
                name="departmentName"
                label="Department Name (Enter Exact Name)"
                id="departmentName"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                error={
                  !!(
                    formError && formError.toLowerCase().includes("department")
                  )
                }
                helperText={
                  formError && formError.toLowerCase().includes("department")
                    ? formError
                    : "If your department is not listed, enter its official name."
                }
              />
            ))}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Sign Up"}
          </Button>
          <RouterLink to="/login" variant="body2">
            {"Already have an account? Sign In"}
          </RouterLink>
        </Box>
      </Box>
    </Container>
  );
};

// StudentDashboard.js
const StudentDashboard = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [requests, setRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState("");

  const fetchMyRequests = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await apiClient.get("/requests/my");
      setRequests(response.data || []);
    } catch (err) {
      setPageError(
        err.response?.data?.message || "Failed to fetch your requests."
      );
      showSnackbar(
        err.response?.data?.message || "Failed to fetch requests.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const downloadPdf = async (requestId) => {
    try {
      const token = localStorage.getItem("noDuesToken");
      const response = await axios.get(
        `${apiClient.defaults.baseURL}/requests/${requestId}/pdf`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NoDuesCertificate_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showSnackbar(
        "Failed to download PDF: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  const createNewRequest = async () => {
    setLoading(true);
    setPageError("");
    try {
      await apiClient.post("/requests");
      showSnackbar("New no-dues request submitted successfully!", "success");
      fetchMyRequests();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to submit new request.";
      setPageError(errorMsg);
      showSnackbar(errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name} (Student)
      </Typography>
      <Button
        variant="contained"
        startIcon={<PostAddIcon />}
        onClick={createNewRequest}
        sx={{ mb: 2 }}
        disabled={loading}
      >
        Submit New No-Dues Request
      </Button>
      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pageError}
        </Alert>
      )}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && requests.length === 0 && (
        <Typography>No requests found.</Typography>
      )}
      {!loading &&
        requests.map((req) => (
          <Box
            key={req._id}
            sx={{
              border: "1px solid #e0e0e0",
              p: 2,
              mb: 2,
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography variant="h6">Request ID: {req._id}</Typography>
            <Typography>
              Status:{" "}
              <span
                style={{
                  fontWeight: "bold",
                  color:
                    req.overallStatus === "approved"
                      ? "green"
                      : req.overallStatus === "rejected"
                      ? "red"
                      : "orange",
                }}
              >
                {req.overallStatus}
              </span>
            </Typography>
            <Typography>
              Submitted: {new Date(req.createdAt).toLocaleDateString()}
            </Typography>
            <Typography
              variant="subtitle1"
              sx={{ mt: 1, fontWeight: "medium" }}
            >
              Department Statuses:
            </Typography>
            {req.departmentsStatus?.map((ds) => (
              <Typography key={ds.department._id} sx={{ ml: 2 }}>
                {ds.department.name}:{" "}
                <span
                  style={{
                    color:
                      ds.status === "approved"
                        ? "green"
                        : ds.status === "rejected"
                        ? "red"
                        : "orange",
                  }}
                >
                  {ds.status}
                </span>
                {ds.comment && (
                  <span style={{ fontStyle: "italic" }}> - {ds.comment}</span>
                )}
              </Typography>
            ))}
            {req.overallStatus === "approved" && (
              <Button
                variant="outlined"
                onClick={() => downloadPdf(req._id)}
                sx={{ mt: 1 }}
              >
                Download PDF Certificate
              </Button>
            )}
          </Box>
        ))}
    </Container>
  );
};

// StaffDashboard.js
const StaffDashboard = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [pendingRequests, setPendingRequests] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState("");
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [currentAction, setCurrentAction] = React.useState("");
  const [actionComment, setActionComment] = React.useState("");
  const [actionLoading, setActionLoading] = React.useState(false);

  const fetchPendingRequests = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await apiClient.get("/requests");
      setPendingRequests(response.data || []);
    } catch (err) {
      setPageError(
        err.response?.data?.message || "Failed to fetch pending requests."
      );
      showSnackbar(
        err.response?.data?.message || "Failed to fetch requests.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  React.useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleOpenModal = (request, action) => {
    setSelectedRequest(request);
    setCurrentAction(action);
    setActionComment("");
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setActionComment("");
    setCurrentAction("");
  };

  const handleActionSubmit = async () => {
    if (!selectedRequest || !currentAction) return;
    if (currentAction === "rejected" && !actionComment.trim()) {
      showSnackbar("Comment is required for rejection.", "warning");
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.put(`/requests/${selectedRequest._id}/action`, {
        status: currentAction,
        comment: actionComment,
      });
      showSnackbar(
        `Request ${selectedRequest._id} has been ${currentAction}.`,
        "success"
      );
      fetchPendingRequests();
    } catch (err) {
      showSnackbar(
        err.response?.data?.message || `Failed to ${currentAction} request.`,
        "error"
      );
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Staff Dashboard
      </Typography>
      <Typography variant="h6" gutterBottom>
        Department: {user?.department?.name || "N/A"}
      </Typography>
      {pageError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {pageError}
        </Alert>
      )}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && pendingRequests.length === 0 && (
        <Typography>No pending requests for your department.</Typography>
      )}
      {!loading &&
        pendingRequests.map((req) => (
          <Box
            key={req._id}
            sx={{
              border: "1px solid #e0e0e0",
              p: 2,
              mb: 2,
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            <Typography variant="h6">Request ID: {req._id}</Typography>
            <Typography>
              Student: {req.student?.name || "N/A"} (
              {req.student?.email || "N/A"})
            </Typography>
            <Typography>
              Submitted: {new Date(req.createdAt).toLocaleDateString()}
            </Typography>
            {req.departmentsStatus?.find(
              (ds) =>
                (ds.department?._id === user?.department?.id ||
                  ds.department === user?.department?.id) &&
                ds.status === "pending"
            ) && (
              <Box sx={{ mt: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleOpenModal(req, "approved")}
                  sx={{ mr: 1, mt: 1 }}
                  disabled={actionLoading}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleOpenModal(req, "rejected")}
                  sx={{ mt: 1 }}
                  disabled={actionLoading}
                >
                  Reject
                </Button>
              </Box>
            )}
            {req.departmentsStatus?.find(
              (ds) =>
                (ds.department?._id === user?.department?.id ||
                  ds.department === user?.department?.id) &&
                ds.status !== "pending"
            ) && (
              <Typography sx={{ mt: 1, fontStyle: "italic" }}>
                Status for your department:{" "}
                {
                  req.departmentsStatus.find(
                    (ds) => ds.department?._id === user?.department?.id
                  ).status
                }
              </Typography>
            )}
          </Box>
        ))}

      <Dialog
        open={!!selectedRequest}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {currentAction === "approved" ? "Approve" : "Reject"} Request:{" "}
          {selectedRequest?._id}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 1 }}>
            Student: {selectedRequest?.student?.name}
          </DialogContentText>
          <DialogContentText sx={{ mb: 2 }}>
            To {currentAction} this request, please provide a comment if
            necessary (required for rejection).
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            label="Comment"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
            required={currentAction === "rejected"}
            helperText={
              currentAction === "rejected" && !actionComment.trim()
                ? "Comment is mandatory for rejection."
                : ""
            }
            error={currentAction === "rejected" && !actionComment.trim()}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseModal} disabled={actionLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleActionSubmit}
            variant="contained"
            color={currentAction === "approved" ? "success" : "error"}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              `Submit ${currentAction}`
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

// AdminDashboard.js
const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [departments, setDepartments] = React.useState([]);
  const [allRequests, setAllRequests] = React.useState([]);
  const [newDepartmentName, setNewDepartmentName] = React.useState("");
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingRequests, setLoadingRequests] = React.useState(false);
  const [addDeptLoading, setAddDeptLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState("");

  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true);
    setPageError("");
    try {
      const response = await apiClient.get("/departments");
      setDepartments(response.data || []);
    } catch (err) {
      setPageError(
        err.response?.data?.message || "Failed to fetch departments."
      );
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const fetchAllRequests = useCallback(async () => {
    setLoadingRequests(true); // Keep pageError from department fetch if it occurred
    try {
      const response = await apiClient.get("/requests/all");
      setAllRequests(response.data || []);
    } catch (err) {
      setPageError((prev) =>
        prev
          ? `${prev}\n${
              err.response?.data?.message || "Failed to fetch all requests."
            }`
          : err.response?.data?.message || "Failed to fetch all requests."
      );
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDepartments();
    fetchAllRequests();
  }, [fetchDepartments, fetchAllRequests]);

  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!newDepartmentName.trim()) {
      showSnackbar("Department name cannot be empty.", "warning");
      return;
    }
    setAddDeptLoading(true);
    setPageError("");
    try {
      await apiClient.post("/departments", { name: newDepartmentName });
      showSnackbar(
        `Department "${newDepartmentName}" added successfully.`,
        "success"
      );
      setNewDepartmentName("");
      fetchDepartments();
    } catch (err) {
      setPageError(err.response?.data?.message || "Failed to add department.");
      showSnackbar(
        err.response?.data?.message || "Failed to add department.",
        "error"
      );
    } finally {
      setAddDeptLoading(false);
    }
  };

  const downloadPdfAdmin = async (requestId) => {
    try {
      const token = localStorage.getItem("noDuesToken");
      const response = await axios.get(
        `${apiClient.defaults.baseURL}/requests/${requestId}/pdf`,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `NoDuesCertificate_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showSnackbar(
        "Failed to download PDF: " +
          (err.response?.data?.message || err.message),
        "error"
      );
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Typography variant="h6" gutterBottom>
        Welcome, {user?.name}
      </Typography>

      {pageError && (
        <Alert severity="error" sx={{ my: 2 }}>
          {pageError.split("\n").map((item, key) => (
            <React.Fragment key={key}>
              {item}
              <br />
            </React.Fragment>
          ))}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleAddDepartment}
        sx={{
          my: 3,
          p: 2,
          border: "1px solid #ccc",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6">Add New Department</Typography>
        <TextField
          label="Department Name"
          value={newDepartmentName}
          onChange={(e) => setNewDepartmentName(e.target.value)}
          required
          sx={{ mr: 1, my: 1 }}
          size="small"
        />
        <Button type="submit" variant="contained" disabled={addDeptLoading}>
          {addDeptLoading ? <CircularProgress size={20} /> : "Add Department"}
        </Button>
      </Box>

      <Box
        sx={{
          my: 3,
          p: 2,
          border: "1px solid #ccc",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          Manage Departments
        </Typography>
        {loadingDepartments && <CircularProgress size={24} />}
        {!loadingDepartments && departments.length === 0 && (
          <Typography>No departments found.</Typography>
        )}
        {!loadingDepartments &&
          departments.map((dept) => (
            <Typography key={dept._id}>
              {dept.name} (Created by: {dept.createdBy?.name || "N/A"})
            </Typography>
          ))}
      </Box>

      <Box
        sx={{
          my: 3,
          p: 2,
          border: "1px solid #ccc",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="h6" sx={{ mb: 1 }}>
          All No-Dues Requests
        </Typography>
        {loadingRequests && <CircularProgress size={24} />}
        {!loadingRequests && allRequests.length === 0 && (
          <Typography>No requests found in the system.</Typography>
        )}
        {!loadingRequests &&
          allRequests.map((req) => (
            <Box
              key={req._id}
              sx={{
                borderBottom: "1px solid #eee",
                py: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography>ID: {req._id}</Typography>
                <Typography>
                  Student: {req.student?.name || "N/A"}, Status:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {req.overallStatus}
                  </span>
                </Typography>
              </Box>
              {req.overallStatus === "approved" && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => downloadPdfAdmin(req._id)}
                >
                  View PDF
                </Button>
              )}
            </Box>
          ))}
      </Box>
    </Container>
  );
};

// NotFoundPage.js
const NotFoundPage = () => (
  <Container sx={{ textAlign: "center", mt: 10 }}>
    <Typography variant="h3" gutterBottom>
      404 - Page Not Found
    </Typography>
    <Typography>The page you are looking for does not exist.</Typography>
    <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 3 }}>
      Go to Homepage
    </Button>
  </Container>
);

// --- 5. Layout Component (with Navbar) ---
const Layout = () => {
  const { user, logout, authError } = useAuth(); // Get authError to display globally if needed
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "student":
        return "/student/dashboard";
      case "staff":
        return "/staff/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/login";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink
              to={getDashboardPath()}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              No-Dues App
            </RouterLink>
          </Typography>
          {user ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to={getDashboardPath()}
                startIcon={<DashboardIcon />}
              >
                Dashboard
              </Button>
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
              >
                Logout ({user.name})
              </Button>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                startIcon={<LoginIcon />}
              >
                Login
              </Button>
              <Button color="inherit" component={RouterLink} to="/register">
                Register
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {
          authError && !user && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {authError}
            </Alert>
          ) /* Show global auth error if user is logged out due to it */
        }
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{ bgcolor: "background.paper", py: 3, px: 2, mt: "auto" }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} Graphic Era University No-Dues System
        </Typography>
      </Box>
    </Box>
  );
};

// --- Main App Component ---
function App() {
  const theme = createTheme({
    palette: {
      primary: { main: "#1976d2" }, // MUI default blue
      secondary: { main: "#9c27b0" }, // MUI default purple
      error: { main: "#d32f2f" }, // MUI default red
      warning: { main: "#ed6c02" }, // MUI default orange
      info: { main: "#0288d1" }, // MUI default light blue
      success: { main: "#2e7d32" }, // MUI default green
    },
    typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SnackbarProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* Student Routes */}
                <Route
                  path="student/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["student"]}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Staff Routes */}
                <Route
                  path="staff/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["staff"]}>
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="admin/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </SnackbarProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
