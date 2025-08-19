FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY backend/package*.json ./backend/
COPY backend/ ./backend/

# Install backend dependencies
RUN cd backend && npm ci --only=production

# Expose port
EXPOSE 5000

# Start the application
CMD ["cd", "backend", "&&", "npm", "start"]
