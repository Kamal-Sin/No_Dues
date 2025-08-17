// Filename: App.js
// Description: Main application component with routing, MUI theme, and backend integration.
// Includes final touches: improved validation, error handling, and session expiration.

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import {
    ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Button, Container, Box,
    CircularProgress, Alert, TextField, Select, MenuItem, FormControl, InputLabel, Dialog,
    DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PostAddIcon from '@mui/icons-material/PostAdd';
import ListAltIcon from '@mui/icons-material/ListAlt';
import CloseIcon from '@mui/icons-material/Close'; // For Snackbar
import IconButton from '@mui/material/IconButton'; // For Snackbar
import axios from 'axios';

// --- 1. API Service (Axios setup) ---

// Helper function to safely get base URL
const getApiBaseURL = () => {
  // Check if process and process.env are defined (typical in Node.js or CRA build/dev environments)
  // and if REACT_APP_API_URL is specifically set.
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // Fallback if process.env.REACT_APP_API_URL is not available or process is not defined
  return 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: getApiBaseURL(),
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const storedUser = localStorage.getItem('noDuesUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user && user.token) {
          config.headers['Authorization'] = `Bearer ${user.token}`;
        }
      }
    } catch (error) {
        console.error("Error accessing token from localStorage for API request", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling 401 errors (session expiration)
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Don't dispatch event if it's the login page itself causing 401 (e.g. bad credentials)
      // or if it's a specific path we want to ignore for global logout.
      // For now, any 401 will trigger this.
      console.warn("API request returned 401 Unauthorized. Dispatching auth-error-401 event.");
      window.dispatchEvent(new CustomEvent('auth-error-401', { detail: { message: error.response.data?.message || "Session expired or invalid. Please login again." } }));
    }
    return Promise.reject(error);
  }
);


// --- 2. Auth Context ---
const AuthContext = React.createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(''); // For global auth errors like session expiry

  // const navigateRef = useNavigate(); // Using ref pattern if navigate is needed outside React component tree directly
                                    // Or better, handle navigation in useEffect based on user state change

  const logout = useCallback(() => {
    localStorage.removeItem('noDuesUser');
    setUser(null);
    // Navigation to login will be handled by ProtectedRoute or explicit navigation after logout call
  }, []);


  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('noDuesUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        // Optional: Verify token with backend here /api/auth/me to ensure it's still valid
        // For now, assume if it's in localStorage, it's good until an API call fails with 401
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      logout(); // Clear corrupted storage
    }
    setLoading(false);
  }, [logout]);

  // Listener for 401 auth errors from apiClient
  useEffect(() => {
    const handleAuthError = (event) => {
      console.log("AuthContext: Caught auth-error-401 event.");
      setAuthError(event.detail?.message || "Your session has expired. Please login again.");
      logout();
      // Navigation to /login will happen due to user becoming null & ProtectedRoute logic
    };
    window.addEventListener('auth-error-401', handleAuthError);
    return () => {
      window.removeEventListener('auth-error-401', handleAuthError);
    };
  }, [logout]); // `logout` is stable due to useCallback

  const login = (userData) => {
    localStorage.setItem('noDuesUser', JSON.stringify(userData));
    setUser(userData);
    setAuthError(''); // Clear any previous auth errors on successful login
  };


  const value = useMemo(() => ({ user, login, logout, loading, authError, setAuthError }), [user, login, logout, loading, authError]);

  if (loading && !user) { // Show loader only if still loading and no user yet (prevents flash on refresh if user exists)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);

// --- Snackbar Context (Optional, for global notifications) ---
const SnackbarContext = React.createContext(null);

export const SnackbarProvider = ({ children }) => {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('info'); // 'success', 'error', 'warning', 'info'

    const showSnackbar = useCallback((message, severity = 'info') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    }, []);

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

    const value = useMemo(() => ({ showSnackbar }), [showSnackbar]);

    return (
        <SnackbarContext.Provider value={value}>
            {children}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </SnackbarContext.Provider>
    );
};
export const useSnackbar = () => React.useContext(SnackbarContext);


// --- 3. Protected Route Component ---
const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// --- 4. Page Components ---

// LoginPage.js
const LoginPage = () => {
  const { login, user, authError, setAuthError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [formError, setFormError] = React.useState(''); // Specific to login form
  const [loading, setLoading] = React.useState(false);

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (user) { // If user is already logged in, redirect
        const redirectTo = user.role === 'student' ? "/student/dashboard" :
                           user.role === 'staff'   ? "/staff/dashboard"   :
                           user.role === 'admin'  ? "/admin/dashboard"   : "/";
        navigate(redirectTo, { replace: true });
    }
  }, [user, navigate]);

  // Clear authError when component mounts or email/password changes, so it doesn't persist from other pages
  useEffect(() => {
    setAuthError('');
  }, [setAuthError, email, password]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError('');
    setAuthError(''); // Clear global auth error before new attempt
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      login(response.data);
      // Navigate to intended page or role-based dashboard
      const userRole = response.data.user.role;
      const defaultRedirect = userRole === 'student' ? "/student/dashboard" :
                              userRole === 'staff'   ? "/staff/dashboard"   :
                              userRole === 'admin'  ? "/admin/dashboard"   : "/";
      navigate(from === "/login" || from === "/" || from === "/register" ? defaultRedirect : from, { replace: true });

    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      if (err.response?.status === 401) { // Specific handling for login 401
          setFormError(errMsg); // Show error on login form
      } else {
          setFormError('An unexpected error occurred during login.'); // Generic error for other issues
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign In</Typography>
        {authError && <Alert severity="warning" sx={{ width: '100%', mt: 2 }}>{authError}</Alert>}
        {formError && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{formError}</Alert>}
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} error={!!formError} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={!!formError} />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
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
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('student');
  const [departmentName, setDepartmentName] = React.useState('');
  const [formError, setFormError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [departments, setDepartments] = React.useState([]);

  useEffect(() => {
    if (role === 'staff') {
      const fetchDepts = async () => {
        try {
          const response = await apiClient.get('/departments');
          setDepartments(response.data || []);
        } catch (err) {
          console.error("Failed to fetch departments for staff registration", err);
          showSnackbar("Could not load departments. Please enter department name manually.", "warning");
        }
      };
      fetchDepts();
    }
  }, [role, showSnackbar]);

  const validateForm = () => {
    if (!name.trim()) { setFormError("Full name is required."); return false; }
    if (!email.trim()) { setFormError("Email is required."); return false; }
    if (!/\S+@\S+\.\S+/.test(email)) { setFormError("Email is invalid."); return false; }
    if (password.length < 6) { setFormError("Password must be at least 6 characters."); return false; }
    if (role === 'staff' && !departmentName.trim()) { setFormError("Department name is required for staff."); return false; }
    setFormError('');
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload = { name, email, password, role };
      if (role === 'staff') payload.departmentName = departmentName;
      await apiClient.post('/auth/register', payload);
      showSnackbar('Registration successful! Please login.', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">Sign Up</Typography>
        {formError && <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{formError}</Alert>}
        <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
          <TextField margin="normal" required fullWidth id="name" label="Full Name" name="name" value={name} onChange={e => setName(e.target.value)} error={!!(formError && formError.toLowerCase().includes('name'))} helperText={ (formError && formError.toLowerCase().includes('name')) ? formError : ""} />
          <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} error={!!(formError && formError.toLowerCase().includes('email'))} helperText={ (formError && formError.toLowerCase().includes('email')) ? formError : "e.g., user@example.com"} />
          <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} error={!!(formError && formError.toLowerCase().includes('password'))} helperText={ (formError && formError.toLowerCase().includes('password')) ? formError : "Min. 6 characters"} />
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="role-select-label">Role</InputLabel>
            <Select labelId="role-select-label" id="role" value={role} label="Role" onChange={e => { setRole(e.target.value); setDepartmentName(''); /* Reset dept on role change */ }}>
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="staff">Staff</MenuItem>
            </Select>
          </FormControl>
          {role === 'staff' && (
            departments.length > 0 ? (
                 <FormControl fullWidth margin="normal" required>
                    <InputLabel id="department-select-label">Department</InputLabel>
                    <Select labelId="department-select-label" value={departmentName} label="Department" onChange={e => setDepartmentName(e.target.value)} error={!!(formError && formError.toLowerCase().includes('department'))}>
                        {departments.map(dept => (
                            <MenuItem key={dept._id} value={dept.name}>{dept.name}</MenuItem>
                        ))}
                    </Select>
                     { (formError && formError.toLowerCase().includes('department')) && <Typography color="error" variant="caption">{formError}</Typography>}
                </FormControl>
            ) : (
                 <TextField margin="normal" required={role === 'staff'} fullWidth name="departmentName" label="Department Name (Enter Exact Name)" id="departmentName" value={departmentName} onChange={e => setDepartmentName(e.target.value)} error={!!(formError && formError.toLowerCase().includes('department'))} helperText={ (formError && formError.toLowerCase().includes('department')) ? formError : "If your department is not listed, enter its official name."} />
            )
          )}
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Sign Up'}
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
  const [pageError, setPageError] = React.useState('');

  const fetchMyRequests = useCallback(async () => {
    setLoading(true); setPageError('');
    try {
      const response = await apiClient.get('/requests/my');
      setRequests(response.data || []);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to fetch your requests.');
      showSnackbar(err.response?.data?.message || 'Failed to fetch requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  const createNewRequest = async () => {
    setLoading(true); setPageError('');
    try {
      await apiClient.post('/requests');
      showSnackbar('New no-dues request submitted successfully!', 'success');
      fetchMyRequests();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit new request.';
      setPageError(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (requestId) => {
    const pdfUrl = `${apiClient.defaults.baseURL}/requests/${requestId}/pdf`;
    window.open(pdfUrl, '_blank');
  };

  React.useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Welcome, {user?.name} (Student)</Typography>
      <Button variant="contained" startIcon={<PostAddIcon />} onClick={createNewRequest} sx={{mb: 2}} disabled={loading}>
        Submit New No-Dues Request
      </Button>
      {pageError && <Alert severity="error" sx={{mb:2}}>{pageError}</Alert>}
      {loading && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress /></Box>}
      {!loading && requests.length === 0 && <Typography>No requests found.</Typography>}
      {!loading && requests.map(req => (
        <Box key={req._id} sx={{ border: '1px solid #e0e0e0', p: 2, mb: 2, borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6">Request ID: {req._id}</Typography>
          <Typography>Status: <span style={{fontWeight:'bold', color: req.overallStatus === 'approved' ? 'green' : (req.overallStatus === 'rejected' ? 'red' : 'orange')}}>{req.overallStatus}</span></Typography>
          <Typography>Submitted: {new Date(req.createdAt).toLocaleDateString()}</Typography>
          <Typography variant="subtitle1" sx={{mt:1, fontWeight:'medium'}}>Department Statuses:</Typography>
          {req.departmentsStatus?.map(ds => (
             <Typography key={ds.department?._id || ds.department} sx={{ml:2}}>{ds.department?.name || 'Unknown Dept'}: {ds.status} {ds.comment ? <span style={{fontStyle:'italic', color:'gray'}}>{`(${ds.comment})`}</span> : ''}</Typography>
          ))}
          {req.overallStatus === 'approved' && (
            <Button variant="contained" color="success" onClick={() => downloadPdf(req._id)} sx={{mt:2}}>Download PDF</Button>
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
  const [pageError, setPageError] = React.useState('');
  const [selectedRequest, setSelectedRequest] = React.useState(null);
  const [actionComment, setActionComment] = React.useState('');
  const [currentAction, setCurrentAction] = React.useState(''); // 'approved' or 'rejected'
  const [actionLoading, setActionLoading] = React.useState(false);


  const fetchPendingRequests = useCallback(async () => {
    setLoading(true); setPageError('');
    try {
      const response = await apiClient.get('/requests');
      setPendingRequests(response.data || []);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to fetch pending requests.');
      showSnackbar(err.response?.data?.message || 'Failed to fetch requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  React.useEffect(() => {
    if (user?.role === 'staff') {
        fetchPendingRequests();
    }
  }, [user, fetchPendingRequests]);

  const handleOpenModal = (request, actionType) => {
    setSelectedRequest(request);
    setCurrentAction(actionType);
    setActionComment(request.departmentsStatus?.find(ds => ds.department?._id === user?.department?.id)?.comment || ''); // Pre-fill comment if exists
  };

  const handleCloseModal = () => {
    setSelectedRequest(null); setActionComment(''); setCurrentAction('');
  };

  const handleActionSubmit = async () => {
    if (!selectedRequest || !currentAction) return;
    if (currentAction === 'rejected' && !actionComment.trim()) {
        showSnackbar('Comment is required for rejection.', 'warning');
        return;
    }
    setActionLoading(true);
    try {
      await apiClient.put(`/requests/${selectedRequest._id}/action`, {
        status: currentAction,
        comment: actionComment,
      });
      showSnackbar(`Request ${selectedRequest._id} has been ${currentAction}.`, 'success');
      fetchPendingRequests();
    } catch (err) {
      showSnackbar(err.response?.data?.message || `Failed to ${currentAction} request.`, 'error');
    } finally {
      setActionLoading(false);
      handleCloseModal();
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Staff Dashboard</Typography>
      <Typography variant="h6" gutterBottom>Department: {user?.department?.name || 'N/A'}</Typography>
      {pageError && <Alert severity="error" sx={{mb:2}}>{pageError}</Alert>}
      {loading && <Box sx={{display: 'flex', justifyContent: 'center', my: 3}}><CircularProgress /></Box>}
      {!loading && pendingRequests.length === 0 && <Typography>No pending requests for your department.</Typography>}
      {!loading && pendingRequests.map(req => (
        <Box key={req._id} sx={{ border: '1px solid #e0e0e0', p: 2, mb: 2, borderRadius: 2, boxShadow: 1 }}>
          <Typography variant="h6">Request ID: {req._id}</Typography>
          <Typography>Student: {req.student?.name || 'N/A'} ({req.student?.email || 'N/A'})</Typography>
          <Typography>Submitted: {new Date(req.createdAt).toLocaleDateString()}</Typography>
          {req.departmentsStatus?.find(ds => (ds.department?._id === user?.department?.id || ds.department === user?.department?.id) && ds.status === 'pending') && (
            <Box sx={{mt:1}}>
                <Button variant="contained" color="success" onClick={() => handleOpenModal(req, 'approved')} sx={{mr:1, mt:1}} disabled={actionLoading}>Approve</Button>
                <Button variant="contained" color="error" onClick={() => handleOpenModal(req, 'rejected')} sx={{mt:1}} disabled={actionLoading}>Reject</Button>
            </Box>
          )}
           {req.departmentsStatus?.find(ds => (ds.department?._id === user?.department?.id || ds.department === user?.department?.id) && ds.status !== 'pending') && (
            <Typography sx={{mt:1, fontStyle:'italic'}}>Status for your department: {req.departmentsStatus.find(ds => ds.department?._id === user?.department?.id).status}</Typography>
           )}
        </Box>
      ))}

      <Dialog open={!!selectedRequest} onClose={handleCloseModal} fullWidth maxWidth="sm">
        <DialogTitle>{currentAction === 'approved' ? 'Approve' : 'Reject'} Request: {selectedRequest?._id}</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{mb:1}}>
            Student: {selectedRequest?.student?.name}
          </DialogContentText>
          <DialogContentText sx={{mb:2}}>
            To {currentAction} this request, please provide a comment if necessary (required for rejection).
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
            required={currentAction === 'rejected'}
            helperText={currentAction === 'rejected' && !actionComment.trim() ? "Comment is mandatory for rejection." : ""}
            error={currentAction === 'rejected' && !actionComment.trim()}
          />
        </DialogContent>
        <DialogActions sx={{p:2}}>
          <Button onClick={handleCloseModal} disabled={actionLoading}>Cancel</Button>
          <Button onClick={handleActionSubmit} variant="contained" color={currentAction === 'approved' ? 'success' : 'error'} disabled={actionLoading}>
            {actionLoading ? <CircularProgress size={22} color="inherit"/> : `Submit ${currentAction}`}
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
  const [newDepartmentName, setNewDepartmentName] = React.useState('');
  const [loadingDepartments, setLoadingDepartments] = React.useState(false);
  const [loadingRequests, setLoadingRequests] = React.useState(false);
  const [addDeptLoading, setAddDeptLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState('');


  const fetchDepartments = useCallback(async () => {
    setLoadingDepartments(true); setPageError('');
    try {
      const response = await apiClient.get('/departments');
      setDepartments(response.data || []);
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to fetch departments.');
    } finally {
      setLoadingDepartments(false);
    }
  }, []);

  const fetchAllRequests = useCallback(async () => {
    setLoadingRequests(true); // Keep pageError from department fetch if it occurred
    try {
      const response = await apiClient.get('/requests/all');
      setAllRequests(response.data || []);
    } catch (err) {
      setPageError(prev => prev ? `${prev}\n${err.response?.data?.message || 'Failed to fetch all requests.'}` : (err.response?.data?.message || 'Failed to fetch all requests.'));
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
    setAddDeptLoading(true); setPageError('');
    try {
      await apiClient.post('/departments', { name: newDepartmentName });
      showSnackbar(`Department "${newDepartmentName}" added successfully.`, 'success');
      setNewDepartmentName('');
      fetchDepartments();
    } catch (err) {
      setPageError(err.response?.data?.message || 'Failed to add department.');
      showSnackbar(err.response?.data?.message || 'Failed to add department.', 'error');
    } finally {
      setAddDeptLoading(false);
    }
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography variant="h6" gutterBottom>Welcome, {user?.name}</Typography>

      {pageError && <Alert severity="error" sx={{my:2}}>{pageError.split('\n').map((item, key) => <React.Fragment key={key}>{item}<br/></React.Fragment>)}</Alert>}

      <Box component="form" onSubmit={handleAddDepartment} sx={{ my: 3, p:2, border: '1px solid #ccc', borderRadius: 2, boxShadow:1 }}>
        <Typography variant="h6">Add New Department</Typography>
        <TextField
          label="Department Name"
          value={newDepartmentName}
          onChange={(e) => setNewDepartmentName(e.target.value)}
          required
          sx={{mr:1, my:1}}
          size="small"
        />
        <Button type="submit" variant="contained" disabled={addDeptLoading}>
            {addDeptLoading ? <CircularProgress size={20}/> : "Add Department"}
        </Button>
      </Box>

      <Box sx={{my:3, p:2, border: '1px solid #ccc', borderRadius: 2, boxShadow:1}}>
        <Typography variant="h6" sx={{mb:1}}>Manage Departments</Typography>
        {loadingDepartments && <CircularProgress size={24} />}
        {!loadingDepartments && departments.length === 0 && <Typography>No departments found.</Typography>}
        {!loadingDepartments && departments.map(dept => <Typography key={dept._id}>{dept.name} (Created by: {dept.createdBy?.name || 'N/A'})</Typography>)}
      </Box>

      <Box sx={{my:3, p:2, border: '1px solid #ccc', borderRadius: 2, boxShadow:1}}>
        <Typography variant="h6" sx={{mb:1}}>All No-Dues Requests</Typography>
        {loadingRequests && <CircularProgress size={24} />}
        {!loadingRequests && allRequests.length === 0 && <Typography>No requests found in the system.</Typography>}
        {!loadingRequests && allRequests.map(req => (
            <Box key={req._id} sx={{ borderBottom: '1px solid #eee', py: 1, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Box>
                    <Typography>ID: {req._id}</Typography>
                    <Typography>Student: {req.student?.name || 'N/A'}, Status: <span style={{fontWeight:'bold'}}>{req.overallStatus}</span></Typography>
                </Box>
                {req.overallStatus === 'approved' && (
                    <Button size="small" variant="outlined" onClick={() => window.open(`${apiClient.defaults.baseURL}/requests/${req._id}/pdf`, '_blank')}>View PDF</Button>
                )}
            </Box>
        ))}
      </Box>
    </Container>
  );
};

// NotFoundPage.js
const NotFoundPage = () => (
  <Container sx={{ textAlign: 'center', mt: 10 }}>
    <Typography variant="h3" gutterBottom>404 - Page Not Found</Typography>
    <Typography>The page you are looking for does not exist.</Typography>
    <Button component={RouterLink} to="/" variant="contained" sx={{ mt: 3 }}>Go to Homepage</Button>
  </Container>
);

// --- 5. Layout Component (with Navbar) ---
const Layout = () => {
  const { user, logout, authError } = useAuth(); // Get authError to display globally if needed
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case 'student': return "/student/dashboard";
      case 'staff': return "/staff/dashboard";
      case 'admin': return "/admin/dashboard";
      default: return "/login";
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to={getDashboardPath()} style={{ textDecoration: 'none', color: 'inherit' }}>
              No-Dues App
            </RouterLink>
          </Typography>
          {user ? (
            <>
              <Button color="inherit" component={RouterLink} to={getDashboardPath()} startIcon={<DashboardIcon />}>
                Dashboard
              </Button>
              <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                Logout ({user.name})
              </Button>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login" startIcon={<LoginIcon />}>Login</Button>
              <Button color="inherit" component={RouterLink} to="/register">Register</Button>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {authError && !user && <Alert severity="error" sx={{mb: 2}}>{authError}</Alert> /* Show global auth error if user is logged out due to it */}
        <Outlet />
      </Container>
      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 3, px:2, mt: 'auto' }} >
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} XYZ University No-Dues System
        </Typography>
      </Box>
    </Box>
  );
};


// --- Main App Component ---
function App() {
  const theme = createTheme({
    palette: {
      primary: { main: '#1976d2' }, // MUI default blue
      secondary: { main: '#9c27b0' }, // MUI default purple
      error: { main: '#d32f2f' }, // MUI default red
      warning: { main: '#ed6c02' }, // MUI default orange
      info: { main: '#0288d1' }, // MUI default light blue
      success: { main: '#2e7d32' }, // MUI default green
    },
    typography: { fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif' }
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider> {/* AuthProvider now uses useNavigate, so it's fine inside Router */}
          <SnackbarProvider> {/* SnackbarProvider wraps routes that might use it */}
            <Routes>
                <Route element={<Layout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={ <Navigate to="/login" replace /> } />

                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                    <Route path="student/dashboard" element={<StudentDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
                    <Route path="staff/dashboard" element={<StaffDashboard />} />
                </Route>

                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="admin/dashboard" element={<AdminDashboard />} />
                </Route>

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

/*
Key changes in this "Final Touches" version:
1.  **API Client (apiClient)**:
    * Response interceptor added to detect 401 errors. On 401, it dispatches a custom 'auth-error-401' event.
    * BaseURL now uses a helper function `getApiBaseURL()` to safely access `process.env.REACT_APP_API_URL`
      and provide a fallback, preventing "process is not defined" errors.
2.  **Auth Context (AuthProvider)**:
    * Listens for the 'auth-error-401' event. When caught, it calls `logout()` and sets an `authError` message.
    * `logout` is memoized with `useCallback`.
    * `authError` can be displayed on the login page or globally.
3.  **Snackbar Context (SnackbarProvider & useSnackbar)**:
    * A simple global notification system using MUI Snackbar for success/error/info messages.
    * Components can call `showSnackbar('Message', 'severity')`.
4.  **Input Validation**:
    * `RegisterPage`: Added basic frontend validation for name, email format, password length, and department for staff. Displays errors using `Alert` or `helperText`.
    * Other forms: Basic `required` attributes and some conditional error display.
5.  **Error Handling**:
    * Components use `try...catch` for API calls and display errors using `Alert` for page-level/form errors or `showSnackbar` for more general notifications.
    * `LoginPage` now distinguishes between general auth errors (like session expiry from `authError`) and form-specific login errors.
6.  **UX Refinements**:
    * Loading states are more consistently handled with `CircularProgress`.
    * Staff dashboard modal pre-fills comment if editing an existing action (though our flow is new action each time).
    * Admin dashboard has separate loading states for departments and requests.
    * Improved visual feedback for actions.
7.  **Code Structure**:
    * `useCallback` used for functions passed to effects or context to prevent unnecessary re-renders/re-executions.
    * Clearer separation of page-specific errors (`pageError`, `formError`) and global auth errors (`authError`).

Remember to:
- Create `.env` file with `REACT_APP_API_URL`.
- Install dependencies: `npm install react-router-dom @mui/material @emotion/react @emotion/styled @mui/icons-material axios`
- Run backend and frontend servers.
*/
Okay, understood! We'll use Material-UI (MUI) for styling the React frontend instead of Tailwind CSS. MUI is a great choice for building robust and well-designed user interfaces.

Let's move on to Step 6: Frontend Setup.

I'll create a React application structure that includes:

Basic pages: Login/Register, Student Dashboard, Staff Dashboard, and Admin Dashboard.
Routing using react-router-dom.
A simple AuthContext to manage user authentication state and role.
Protected route components to handle role-based access to different pages.
Basic UI elements using MUI components.
This will provide a solid starting point for building out the user interface and connecting it to the backend APIs we've developed.

Here's the initial setup for the React frontend:
No-Dues App: React Frontend - Final Touches (MUI)
5 Jun, 03:57

Open

This React application setup includes:

App.js:

Sets up the MUI ThemeProvider and CssBaseline for consistent styling.
Wraps the application in an AuthProvider.
Defines the main routing structure using react-router-dom.
Uses a Layout component to provide a consistent navigation bar and footer.
AuthContext.js (Embedded in App.js for this example):

Provides user state, login, and logout functions.
Persists user data to localStorage to keep the user logged in across sessions.
Includes a loading state to handle initial user data retrieval from localStorage.
ProtectedRoute.js (Embedded):

A component that checks if a user is logged in and if their role is among the allowedRoles.
Redirects unauthorized users to the login page or a relevant dashboard.
Uses <Outlet /> to render child routes if authorized.
Page Components (Simplified & Embedded):

LoginPage.js: Basic login form with mock API call.
RegisterPage.js: Basic registration form with mock API call.
StudentDashboard.js: Placeholder for student-specific content, including submitting a new request and viewing existing ones. Mock data and functions are used.
StaffDashboard.js: Placeholder for staff to view and act on pending requests for their department. Mock data and functions.
AdminDashboard.js: Placeholder for admin to manage departments and view all requests. Mock data and functions.
NotFoundPage.js: A simple 404 page.
Layout.js (Embedded):

A component that includes an MUI AppBar for navigation.
Displays different navigation links based on the user's authentication status and role.
Includes a basic footer.
Renders the main page content via <Outlet />.
Axios API Service (api.js - commented out, embedded concept):

A commented-out example of how you might set up an Axios instance (apiClient) for making HTTP requests to your backend.
Includes an interceptor to automatically add the JWT token to the headers of outgoing requests.
To make this fully functional and well-structured, you would typically:

Split each component, context, and page into its own file within a structured src directory (e.g., src/components, src/pages, src/contexts, src/services, src/hooks).
Install the necessary dependencies: react-router-dom, @mui/material, @emotion/react, @emotion/styled, @mui/icons-material, and axios.
Replace mock API calls and data with actual calls to your backend using the apiClient.
Implement more robust error handling and loading states.
Use MUI's rich component library (like Select for roles/departments, Dialog for modals, DataGrid for tables, etc.) to build out the UI more thoroughly.
Define REACT_APP_API_URL in a .env file at the root of your React project (e.g., REACT_APP_API_URL=http://localhost:5000/api).
This provides the basic skeleton for your React frontend with MUI.