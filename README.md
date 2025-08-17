# No-Dues Application

A comprehensive No-Dues management system for universities with role-based access control, built with Node.js, Express, MongoDB, and React.

## 🚀 Features

- **User Authentication & Authorization**: Secure login/logout with JWT tokens
- **Role-Based Access Control**: Different interfaces for Students, Department Heads, and Admins
- **No-Dues Request Management**: Submit, track, and approve no-dues requests
- **Department Management**: Manage departments and their heads
- **PDF Generation**: Generate no-dues certificates
- **Modern UI**: Built with Material-UI components

## 🛠️ Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation

### Frontend

- **React** - UI library
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client

## 📁 Project Structure

```
No Dues/
├── backend/             # Backend application
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication & role middleware
│   ├── models/          # MongoDB schemas
│   └── routes/          # API routes
├── frontend/            # React application
│   ├── src/            # React source code
│   ├── public/         # Static files
│   └── package.json    # Frontend dependencies
├── server.js            # Main server file
├── package.json         # Backend dependencies
├── railway.json         # Railway deployment config
├── README.md            # Project documentation
├── DEPLOYMENT.md        # Deployment guide
└── MONGODB_SETUP.md     # MongoDB setup guide
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Kamal-Sin/No_Dues.git
   cd No_Dues
   ```

2. **Install backend dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Environment Setup**
   Create a `.env` file in the root directory:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/noDuesApp
   JWT_SECRET=your_jwt_secret_here
   ```

5. **Start the application**

   **Backend (Terminal 1):**

   ```bash
   npm run dev
   ```

   **Frontend (Terminal 2):**

   ```bash
   cd frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📋 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Departments

- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department

### No-Dues Requests

- `GET /api/requests` - Get all requests
- `POST /api/requests` - Create request
- `PUT /api/requests/:id` - Update request
- `GET /api/requests/:id/certificate` - Generate certificate

## 👥 User Roles

1. **Student**: Can submit and track no-dues requests
2. **Department Head**: Can approve/reject requests for their department
3. **Admin**: Full access to manage departments, users, and requests

## 🔧 Development

### Running in Development Mode

```bash
# Backend with auto-reload
npm run dev

# Frontend with hot reload
cd frontend && npm start
```

### Building for Production

```bash
# Build frontend
cd frontend && npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.
