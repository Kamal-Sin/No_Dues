import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material";
import { PostAdd } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { apiClient } from "../contexts/AuthContext";
import axios from "axios";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");

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

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name} (Student)
      </Typography>
      <Button
        variant="contained"
        startIcon={<PostAdd />}
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

export default StudentDashboard;
