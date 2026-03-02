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
# Force installation of dev dependencies even in production
RUN npm ci --include=dev

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build the complete application (backend + frontend)
RUN npm run build:full

# Now safely remove development dependencies to reduce image size
RUN npm prune --production && npm cache clean --force

# Remove frontend source files but keep dist
RUN rm -rf /app/frontend/src /app/frontend/app /app/frontend/components /app/frontend/node_modules || true

# Expose the port the app runs on
EXPOSE 3000

# Run as root for now to avoid user creation issues
# Can add non-root user later if needed for security
CMD ["npm", "start"]