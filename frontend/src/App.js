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
  Paper,
  Divider,
  Link,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PostAddIcon from "@mui/icons-material/PostAdd";
import ArrowBack from "@mui/icons-material/ArrowBack";
import axios from "axios";

// Import contexts and components
import { AuthProvider, useAuth, apiClient } from "./contexts/AuthContext";
import { SnackbarProvider, useSnackbar } from "./contexts/SnackbarContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

// --- Page Components ---

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
                  ds.department === user?.department?.id ||
                  ds.department?._id === user?.department?._id ||
                  ds.department === user?.department?._id) &&
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
                  ds.department === user?.department?.id ||
                  ds.department?._id === user?.department?._id ||
                  ds.department === user?.department?._id) &&
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
  const { user, logout, authError } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getDashboardPath = () => {
    if (!user) return "/";
    switch (user.role) {
      case "student":
        return "/student/dashboard";
      case "staff":
        return "/staff/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <AppBar 
        position="static" 
        elevation={1}
        sx={{ 
          bgcolor: "white", 
          color: "black",
          borderBottom: "1px solid #e0e0e0"
        }}
      >
        <Toolbar>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: "bold",
              fontFamily: "serif"
            }}
          >
            <RouterLink
              to={getDashboardPath()}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              No-Dues
            </RouterLink>
          </Typography>
          {user ? (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to={getDashboardPath()}
                startIcon={<DashboardIcon />}
                sx={{ 
                  textTransform: "none",
                  fontWeight: 500,
                  mr: 1
                }}
              >
                Dashboard
              </Button>
              <Button
                variant="outlined"
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{ 
                  textTransform: "none",
                  fontWeight: 500,
                  borderColor: "#ff6b35",
                  color: "#ff6b35",
                  "&:hover": {
                    borderColor: "#e55a2b",
                    bgcolor: "rgba(255,107,53,0.1)"
                  }
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                component={RouterLink}
                to="/login"
                startIcon={<LoginIcon />}
                sx={{ 
                  textTransform: "none",
                  fontWeight: 500,
                  mr: 1
                }}
              >
                Login
              </Button>
              <Button 
                variant="contained"
                component={RouterLink} 
                to="/register"
                sx={{ 
                  bgcolor: "#ff6b35",
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#e55a2b"
                  }
                }}
              >
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
          )
        }
        <Outlet />
      </Container>
      <Box
        component="footer"
        sx={{ 
          bgcolor: "white", 
          py: 3, 
          px: 2, 
          mt: "auto",
          borderTop: "1px solid #e0e0e0"
        }}
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
      primary: { main: "#ff6b35" }, // Orange theme
      secondary: { main: "#1976d2" }, // Blue accent
      error: { main: "#d32f2f" },
      warning: { main: "#ed6c02" },
      info: { main: "#0288d1" },
      success: { main: "#2e7d32" },
      background: {
        default: "#f5f5f5",
        paper: "#ffffff",
      },
    },
    typography: { 
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 700,
      },
      h2: {
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 700,
      },
      h3: {
        fontFamily: '"Georgia", "Times New Roman", serif',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SnackbarProvider>
            <Routes>
              {/* Landing page - no layout wrapper */}
              <Route path="/" element={<LandingPage />} />
              
              {/* App routes with layout wrapper */}
              <Route element={<Layout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

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
