# Deployment Setup Guide

## Frontend (Vercel) Configuration

### Environment Variables to Set in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following variable:

```
REACT_APP_API_URL=https://your-railway-backend-url.railway.app/api
```

Replace `your-railway-backend-url` with your actual Railway backend URL.

## Backend (Railway) Configuration

### Environment Variables to Set in Railway:

1. Go to your Railway project dashboard
2. Navigate to Variables tab
3. Add the following variables:

```
FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
JWT_SECRET=your-secret-jwt-key
MONGODB_URI=your-mongodb-connection-string
```

Replace:

- `your-vercel-frontend-url` with your actual Vercel frontend URL
- `your-secret-jwt-key` with a secure random string
- `your-mongodb-connection-string` with your MongoDB connection string

## Troubleshooting Login Issues

If you're getting "An unexpected error occurred during login" error:

1. **Check Console Logs**: Open browser developer tools and check the console for API Base URL logs
2. **Verify Environment Variables**: Ensure REACT_APP_API_URL is set correctly in Vercel
3. **Check CORS**: Ensure your Railway backend URL is accessible and CORS is configured properly
4. **Test Backend Health**: Visit `https://your-railway-backend-url.railway.app/ping` to ensure backend is running

## Common Issues:

1. **CORS Error**: Backend not allowing frontend domain
2. **Network Error**: Frontend can't reach backend URL
3. **Environment Variable Not Set**: REACT_APP_API_URL missing in Vercel
4. **Backend Down**: Railway service not running or crashed
