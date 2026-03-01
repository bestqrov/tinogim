# Use Ubuntu-based Node.js for better Prisma compatibility
FROM node:20-bullseye-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Set environment variables for Prisma
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-1.1.x"
ENV NODE_ENV=production

# Install all dependencies first (including dev dependencies needed for build)
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the TypeScript application BEFORE removing dev dependencies
RUN npm run build:backend

# Now safely remove development dependencies to reduce image size
RUN npm prune --production && npm cache clean --force

# Remove frontend node_modules to save space (not needed for backend-only)
RUN rm -rf /app/frontend/node_modules || true

# Remove source TypeScript files to save space
RUN rm -rf /app/src /app/tsconfig.json || true

# Expose the port the app runs on
EXPOSE 3000

# Run as root for now to avoid user creation issues
# Can add non-root user later if needed for security
CMD ["npm", "start"]