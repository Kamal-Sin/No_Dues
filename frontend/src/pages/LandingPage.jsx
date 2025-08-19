import React from "react";
import { 
  Box, 
  Typography, 
  Container, 
  Button, 
  AppBar, 
  Toolbar,
  Grid,
  Paper,
  Chip
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { 
  PlayArrow as PlayIcon,
  Email as EmailIcon,
  Fingerprint as FingerprintIcon
} from "@mui/icons-material";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/register");
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0} 
        sx={{ 
          bgcolor: "transparent", 
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
            No-Dues
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button 
              color="inherit" 
              onClick={handleLogin}
              sx={{ 
                textTransform: "none",
                fontWeight: 500
              }}
            >
              Login
            </Button>
            <Button 
              variant="contained" 
              onClick={handleGetStarted}
              sx={{ 
                bgcolor: "#ff6b35",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "#e55a2b"
                }
              }}
            >
              Get Started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

                    {/* Background Animation */}
       <Box sx={{ 
         position: "absolute",
         top: 0,
         right: 0,
         width: "100%",
         height: "100%",
         overflow: "hidden",
         zIndex: 0,
         opacity: 0.1,
         pointerEvents: "none"
       }}>
         {/* Main Circle */}
         <Box sx={{
           position: "absolute",
           top: "20%",
           right: "10%",
           width: 400,
           height: 400,
           borderRadius: "50%",
           background: "linear-gradient(135deg, #ff6b35 0%, #ff8a65 100%)",
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           boxShadow: "0 20px 60px rgba(255, 107, 53, 0.3)",
           animation: "float 6s ease-in-out infinite"
         }}>
           <Typography sx={{ 
             color: "white", 
             fontSize: 120, 
             fontWeight: "bold",
             textAlign: "center"
           }}>
             📋
           </Typography>
         </Box>

         {/* Floating Elements */}
         <Box sx={{
           position: "absolute",
           top: "15%",
           right: "25%",
           width: 80,
           height: 80,
           borderRadius: "50%",
           bgcolor: "rgba(76, 175, 80, 0.9)",
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           animation: "float 4s ease-in-out infinite",
           animationDelay: "1s"
         }}>
           <Typography sx={{ color: "white", fontSize: 32 }}>✓</Typography>
         </Box>

         <Box sx={{
           position: "absolute",
           bottom: "30%",
           right: "15%",
           width: 60,
           height: 60,
           borderRadius: "50%",
           bgcolor: "rgba(33, 150, 243, 0.9)",
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           animation: "float 5s ease-in-out infinite",
           animationDelay: "2s"
         }}>
           <Typography sx={{ color: "white", fontSize: 24 }}>⚡</Typography>
         </Box>

         <Box sx={{
           position: "absolute",
           top: "50%",
           right: "35%",
           width: 50,
           height: 50,
           borderRadius: "50%",
           bgcolor: "rgba(255, 193, 7, 0.9)",
           display: "flex",
           alignItems: "center",
           justifyContent: "center",
           animation: "float 4.5s ease-in-out infinite",
           animationDelay: "0.5s"
         }}>
           <Typography sx={{ color: "white", fontSize: 20 }}>🔒</Typography>
         </Box>

         {/* Connecting Lines */}
         <Box sx={{
           position: "absolute",
           top: "40%",
           right: "20%",
           width: 300,
           height: 300,
           border: "2px dashed rgba(255, 107, 53, 0.3)",
           borderRadius: "50%",
           animation: "rotate 20s linear infinite"
         }} />

         <Box sx={{
           position: "absolute",
           top: "40%",
           right: "20%",
           width: 400,
           height: 400,
           border: "1px dashed rgba(76, 175, 80, 0.2)",
           borderRadius: "50%",
           animation: "rotate 30s linear infinite reverse"
         }} />

         {/* Decorative Dots */}
         {[...Array(12)].map((_, index) => (
           <Box
             key={index}
             sx={{
               position: "absolute",
               width: 12,
               height: 12,
               borderRadius: "50%",
               bgcolor: "rgba(255, 107, 53, 0.6)",
               top: `${20 + 60 * Math.cos(index * Math.PI / 6)}%`,
               right: `${10 + 40 * Math.sin(index * Math.PI / 6)}%`,
               animation: "pulse 2s ease-in-out infinite",
               animationDelay: `${index * 0.2}s`
             }}
           />
         ))}
       </Box>

       {/* CSS Animations */}
       <style>
         {`
           @keyframes float {
             0%, 100% { transform: translateY(0px); }
             50% { transform: translateY(-20px); }
           }
           @keyframes rotate {
             from { transform: rotate(0deg); }
             to { transform: rotate(360deg); }
           }
           @keyframes pulse {
             0%, 100% { opacity: 0.6; transform: scale(1); }
             50% { opacity: 1; transform: scale(1.2); }
           }
         `}
       </style>

       {/* Main Content */}
       <Container maxWidth="lg" sx={{ mt: 8, position: "relative", zIndex: 1 }}>
         <Box sx={{ 
           textAlign: "left",
           maxWidth: 600,
           pl: 4
         }}>
           <Box sx={{ mb: 6 }}>
             <Typography 
               variant="h1" 
               component="h1"
               sx={{ 
                 fontWeight: "bold",
                 fontFamily: "serif",
                 lineHeight: 1.1,
                 mb: 4,
                 fontSize: { xs: "2.5rem", md: "4rem" }
               }}
             >
               Get your{" "}
               <Box component="span" sx={{ 
                 borderBottom: "4px solid #ff6b35",
                 pb: 0.5
               }}>
                 no dues
               </Box>
               <br />
               <Box component="span" sx={{ fontStyle: "italic" }}>
                 online
               </Box>
             </Typography>
           </Box>

           <Box sx={{ display: "flex", flexDirection: "column", gap: 3, mb: 6 }}>
             <Box sx={{ display: "flex", alignItems: "center" }}>
               <Box
                 sx={{
                   width: 40,
                   height: 40,
                   borderRadius: "50%",
                   bgcolor: "#ff6b35",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   mr: 2,
                   flexShrink: 0
                 }}
               >
                 <Typography sx={{ color: "white", fontWeight: "bold" }}>
                   ✓
                 </Typography>
               </Box>
               <Typography variant="h6" sx={{ color: "#666", fontWeight: 400 }}>
                 Streamline your no-dues process with automated workflows and digital approvals
               </Typography>
             </Box>

             <Box sx={{ display: "flex", alignItems: "center" }}>
               <Box
                 sx={{
                   width: 40,
                   height: 40,
                   borderRadius: "50%",
                   bgcolor: "#4caf50",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   mr: 2,
                   flexShrink: 0
                 }}
               >
                 <Typography sx={{ color: "white", fontWeight: "bold" }}>
                   ✓
                 </Typography>
               </Box>
               <Typography variant="h6" sx={{ color: "#666", fontWeight: 400 }}>
                 Real-time tracking and instant notifications for all stakeholders
               </Typography>
             </Box>

             <Box sx={{ display: "flex", alignItems: "center" }}>
               <Box
                 sx={{
                   width: 40,
                   height: 40,
                   borderRadius: "50%",
                   bgcolor: "#2196f3",
                   display: "flex",
                   alignItems: "center",
                   justifyContent: "center",
                   mr: 2,
                   flexShrink: 0
                 }}
               >
                 <Typography sx={{ color: "white", fontWeight: "bold" }}>
                   ✓
                 </Typography>
               </Box>
               <Typography variant="h6" sx={{ color: "#666", fontWeight: 400 }}>
                 Secure, paperless system with digital signatures and audit trails
               </Typography>
             </Box>
           </Box>

           <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
             <Button
               variant="contained"
               size="large"
               onClick={handleGetStarted}
               sx={{
                 bgcolor: "#ff6b35",
                 textTransform: "none",
                 fontWeight: 600,
                 px: 5,
                 py: 2,
                 fontSize: "1.2rem",
                 borderRadius: 2,
                 boxShadow: "0 8px 25px rgba(255, 107, 53, 0.3)",
                 "&:hover": {
                   bgcolor: "#e55a2b",
                   transform: "translateY(-2px)",
                   boxShadow: "0 12px 35px rgba(255, 107, 53, 0.4)"
                 },
                 transition: "all 0.3s ease"
               }}
             >
               Start Your No-Dues Journey
             </Button>
           </Box>
                  </Box>
       </Container>
     </Box>
   );
 };

export default LandingPage;
