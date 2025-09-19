import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useSnackbar } from "../contexts/SnackbarContext";
import { apiClient } from "../contexts/AuthContext";

const StaffDashboard = () => {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentAction, setCurrentAction] = useState("");
  const [actionComment, setActionComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await apiClient.get("/requests");
      setRequests(response.data || []);
    } catch (err) {
      setPageError(
        err.response?.data?.message || "Failed to fetch requests."
      );
      showSnackbar(
        err.response?.data?.message || "Failed to fetch requests.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

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
      fetchRequests();
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
      {!loading && requests.length === 0 && (
        <Typography>No requests found for your department.</Typography>
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
              Student: {req.student?.name || "N/A"} (
              {req.student?.email || "N/A"})
            </Typography>
            <Typography>
              Submitted: {new Date(req.createdAt).toLocaleDateString()}
            </Typography>
            {req.departmentsStatus?.find(
              (ds) => {
                const myDeptId = user?.department?.id || user?.department?._id;
                const deptId = ds.department?._id || ds.department;
                return myDeptId?.toString() === deptId?.toString() && ds.status === "pending";
              }
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
              (ds) => {
                const myDeptId = user?.department?.id || user?.department?._id;
                const deptId = ds.department?._id || ds.department;
                return myDeptId?.toString() === deptId?.toString() && ds.status !== "pending";
              }
            ) && (
              <Typography sx={{ mt: 1, fontStyle: "italic" }}>
                Status for your department:{" "}
                {
                  req.departmentsStatus.find(
                    (ds) => {
                      const myDeptId = user?.department?.id || user?.department?._id;
                      const deptId = ds.department?._id || ds.department;
                      return myDeptId?.toString() === deptId?.toString();
                    }
                  )?.status
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

export default StaffDashboard;
