# Use the official Node.js runtime as the base image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Install frontend dependencies 
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci

# Build the frontend
RUN npm run build

# Go back to app root
WORKDIR /app

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript application (backend only for now)
RUN npm run build:backend || npm run build

# Remove development dependencies and clean cache
RUN npm prune --production && npm cache clean --force

# Remove frontend node_modules to save space (not needed for backend-only)
RUN rm -rf /app/frontend/node_modules || true

# Back to app root
WORKDIR /app

# Expose the port the app runs on
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

# Define the command to run the application
CMD ["npm", "start"]