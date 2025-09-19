import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";

// Import contexts and components
import { AuthProvider } from "./contexts/AuthContext";
import { SnackbarProvider } from "./contexts/SnackbarContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./components/RegisterPage";
import StudentDashboard from "./components/StudentDashboard";
import StaffDashboard from "./components/StaffDashboard";
import AdminDashboard from "./components/AdminDashboard";
import NotFoundPage from "./components/NotFoundPage";
import Layout from "./components/Layout";

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