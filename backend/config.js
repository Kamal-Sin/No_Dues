// Production Configuration
module.exports = {
  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  // Server Configuration
  server: {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'production'
  },

  // CORS Configuration
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      'https://no-dues-frontend-biws.vercel.app' // Your actual Vercel URL
    ].filter(Boolean),
    credentials: true,
    optionsSuccessStatus: 200
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    authMax: 10 // limit each IP to 10 auth requests per windowMs
  }
};
