# 🚀 Deployment Guide

This guide will help you deploy your No-Dues application to various platforms.

## 📋 Prerequisites

1. **MongoDB Database**: You'll need a MongoDB database (local or cloud)
2. **GitHub Repository**: Your code should be on GitHub (✅ Already done!)
3. **Environment Variables**: Prepare your environment variables

## 🔧 Environment Variables

Create a `.env` file in the root directory with:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

## 🌐 Deployment Options

### Option 1: Render (Recommended - Free)

**Step 1: Set up MongoDB**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get your connection string

**Step 2: Deploy to Render**
1. Go to [Render](https://render.com)
2. Sign up/Login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository: `Kamal-Sin/No_Dues`
5. Configure the service:
   - **Name**: `no-dues-app`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free

**Step 3: Set Environment Variables**
In Render dashboard, go to Environment → Add Environment Variables:
- `NODE_ENV`: `production`
- `MONGODB_URI`: `your_mongodb_atlas_connection_string`
- `JWT_SECRET`: `your_secure_secret_key`
- `PORT`: `10000`

**Step 4: Deploy**
Click "Create Web Service" and wait for deployment.

### Option 2: Railway (Free Tier)

**Step 1: Deploy to Railway**
1. Go to [Railway](https://railway.app)
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository: `Kamal-Sin/No_Dues`
5. Railway will auto-detect it's a Node.js app

**Step 2: Set Environment Variables**
In Railway dashboard:
- `NODE_ENV`: `production`
- `MONGODB_URI`: `your_mongodb_connection_string`
- `JWT_SECRET`: `your_secure_secret_key`

**Step 3: Deploy**
Railway will automatically deploy your app.

### Option 3: Heroku (Paid)

**Step 1: Install Heroku CLI**
```bash
npm install -g heroku
```

**Step 2: Login and Deploy**
```bash
heroku login
heroku create your-app-name
git push heroku main
```

**Step 3: Set Environment Variables**
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_connection_string
heroku config:set JWT_SECRET=your_secure_secret_key
```

### Option 4: Vercel (Frontend Only)

**Step 1: Deploy Frontend**
1. Go to [Vercel](https://vercel.com)
2. Import your GitHub repository
3. Configure build settings:
   - **Framework Preset**: Create React App
   - **Build Command**: `cd frontend && npm run build`
   - **Output Directory**: `frontend/build`

**Step 2: Set Environment Variables**
- `REACT_APP_API_URL`: `your_backend_api_url`

## 🔄 Update Frontend API URL

After deploying your backend, update the frontend API URL:

1. **For Render**: `https://your-app-name.onrender.com/api`
2. **For Railway**: `https://your-app-name.railway.app/api`
3. **For Heroku**: `https://your-app-name.herokuapp.com/api`

Create `frontend/.env.production`:
```env
REACT_APP_API_URL=https://your-deployed-backend-url/api
```

## 📊 MongoDB Setup

### MongoDB Atlas (Recommended)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Replace `<password>` with your database password

### Local MongoDB
If using local MongoDB, make sure it's accessible from your deployment platform.

## 🚀 Post-Deployment

### 1. Test Your Application
- Visit your deployed URL
- Test user registration/login
- Test no-dues request creation
- Test admin functions

### 2. Monitor Logs
- Check deployment platform logs for errors
- Monitor MongoDB connection
- Check API endpoints

### 3. Set up Custom Domain (Optional)
- Configure custom domain in your deployment platform
- Update DNS settings
- Update environment variables if needed

## 🔧 Troubleshooting

### Common Issues:

1. **MongoDB Connection Error**
   - Check connection string
   - Ensure IP whitelist includes deployment platform
   - Verify database credentials

2. **Build Failures**
   - Check build logs
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

3. **Environment Variables**
   - Double-check all environment variables are set
   - Ensure no typos in variable names
   - Restart deployment after adding variables

4. **CORS Issues**
   - Update CORS settings in server.js
   - Add your frontend domain to allowed origins

## 📞 Support

If you encounter issues:
1. Check deployment platform logs
2. Verify environment variables
3. Test locally first
4. Check MongoDB connection
5. Review error messages in browser console

## 🎉 Success!

Once deployed, your No-Dues application will be accessible worldwide!
