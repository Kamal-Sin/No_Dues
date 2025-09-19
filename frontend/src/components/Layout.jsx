import React from "react";
import { useNavigate, Link as RouterLink, Outlet } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Alert,
} from "@mui/material";
import { Dashboard, Logout, Login } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

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
                startIcon={<Dashboard />}
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
                startIcon={<Logout />}
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
                startIcon={<Login />}
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

export default Layout;
