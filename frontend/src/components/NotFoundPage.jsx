import React from "react";
import { Container, Typography, Button } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

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

export default NotFoundPage;
