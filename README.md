# No-Dues Digital Management System

A modern digital management system for handling no-dues certificates in educational institutions with role-based access control.

## Features

- **Role-based Access**: Student, Staff, and Admin roles
- **Digital Processing**: Streamlined no-dues workflow
- **Secure Authentication**: JWT-based authentication
- **PDF Generation**: Automatic certificate generation
- **Modern UI**: Material-UI responsive design

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, JWT
- **Frontend**: React, Material-UI, Axios
- **Security**: Helmet, Rate Limiting, bcrypt

## Quick Start

### Backend

```bash
npm install
# Create .env file with MONGODB_URI, JWT_SECRET
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/requests/my` - Get user requests
- `POST /api/requests` - Create request
- `GET /api/requests/:id/pdf` - Download certificate

## User Roles

- **Student**: Submit requests, view status, download certificates
- **Staff**: Review and approve requests
- **Admin**: Manage departments and system

## Production Deployment

```bash
# Build for production
./build.sh

# Start production server
npm start
```
