import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  TextField,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { apiClient } from "../contexts/AuthContext";
import axios from "axios";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [departments, setDepartments] = useState([]);
  const [allRequests, setAllRequests] = useState([]);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [addDeptLoading, setAddDeptLoading] = useState(false);
  const [pageError, setPageError] = useState("");

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
    setLoadingRequests(true);
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

  useEffect(() => {
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

export default AdminDashboard;
