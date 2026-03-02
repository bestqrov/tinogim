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

# Build backend first
RUN npm run build:backend

# Build frontend with explicit verification
RUN echo "🔨 Starting frontend build..." && \
    cd frontend && \
    npm ci --include=dev && \
    npm run build && \
    echo "✅ Frontend build completed" && \
    echo "📁 Frontend working directory contents:" && \
    ls -la && \
    echo "📁 Checking for dist directory:" && \
    ls -la dist/ || echo "dist not found, checking .next:" && \
    ls -la .next/ || echo "Neither dist nor .next found" && \
    echo "📄 Frontend index.html check:" && \
    (ls -la dist/index.html || ls -la .next/index.html || echo "No index.html found")

# Verify the complete application build
RUN echo "🔍 Verifying final build structure:" && \
    ls -la /app/ && \
    echo "Frontend dist:" && \
    ls -la /app/frontend/dist/

# Now safely remove development dependencies to reduce image size
RUN npm prune --production && npm cache clean --force

# Debug: List contents to verify frontend build
RUN echo "📁 Frontend directory contents:" && ls -la /app/frontend/ || echo "No frontend directory"
RUN echo "📁 Frontend dist contents:" && ls -la /app/frontend/dist/ || echo "No frontend/dist directory"
RUN echo "📁 App directory contents:" && ls -la /app/

# Remove frontend source files but keep dist - be more specific to avoid accidents
RUN rm -rf /app/frontend/src || true
RUN rm -rf /app/frontend/app || true 
RUN rm -rf /app/frontend/components || true
RUN rm -rf /app/frontend/hooks || true
RUN rm -rf /app/frontend/lib || true
RUN rm -rf /app/frontend/store || true
RUN rm -rf /app/frontend/types || true
RUN rm -rf /app/frontend/utils || true
RUN rm -rf /app/frontend/node_modules || true
RUN rm -rf /app/frontend/.next || true

# Final verification after cleanup
RUN echo "📁 After cleanup - Frontend dist:" && ls -la /app/frontend/dist/ || echo "Frontend dist not found after cleanup"

# Expose the port the app runs on
EXPOSE 3000

# Run as root for now to avoid user creation issues
# Can add non-root user later if needed for security
CMD ["npm", "start"]