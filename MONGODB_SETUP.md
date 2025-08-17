# 🗄️ MongoDB Atlas Setup Guide

## Step-by-Step Instructions

### 1. Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free"
3. Fill in your details and create account

### 2. Create Free Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select cloud provider (any is fine)
4. Choose region (closest to you)
5. Click "Create"

### 3. Set Up Database User

1. Go to "Database Access" (left sidebar)
2. Click "Add New Database User"
3. **Username**: `noDuesUser` (or any name)
4. **Password**: Create a strong password (save it!)
5. **Database User Privileges**: "Read and write to any database"
6. Click "Add User"

### 4. Allow Network Access

1. Go to "Network Access" (left sidebar)
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 5. Get Connection String

1. Go to "Database" (left sidebar)
2. Click "Connect"
3. Choose "Connect your application"
4. Copy the connection string

### 6. Update Connection String

Replace the connection string with your details:

```
mongodb+srv://noDuesUser:yourpassword@cluster.mongodb.net/noDuesApp?retryWrites=true&w=majority
```

### 7. Use in Deployment

Add this as your `MONGODB_URI` environment variable in your deployment platform.

## 🔒 Security Notes

- Keep your database password secure
- Never commit passwords to Git
- Use environment variables for sensitive data
- The free tier is perfect for development and small projects

## 📊 Free Tier Limits

- 512MB storage
- Shared RAM
- Perfect for development and small applications
- Can upgrade later if needed
