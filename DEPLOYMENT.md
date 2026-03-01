# 🚀 ArwaEduc Deployment Guide

## Pre-Deployment Checklist

### ✅ Required Actions Before Deployment

1. **Environment Variables Setup**
   ```bash
   # Copy and configure production environment
   cp .env.production.example .env.production
   # Edit .env.production with your production values
   ```

2. **Security Configuration**
   - Generate a strong JWT secret (minimum 32 characters)
   - Set up secure MongoDB connection string
   - Configure CORS origins for production

3. **Database Setup**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   # Run database migrations
   npm run prisma:migrate
   ```

## 🐳 Docker Deployment (Recommended)

### Quick Start
```bash
# Build and run with docker-compose
docker-compose build
docker-compose up -d
```

### Manual Docker Build
```bash
# Backend
docker build -t arwa-educ-backend .
docker run -p 3000:3000 --env-file .env.production arwa-educ-backend

# Frontend
cd frontend
docker build -t arwa-educ-frontend .
docker run -p 3001:3001 arwa-educ-frontend
```

## ☁️ Cloud Platform Deployment

### Vercel (Frontend Only)
```bash
cd frontend
npx vercel --prod
```

### Railway.app
1. Connect your GitHub repository
2. Add environment variables in Railway dashboard
3. Deploy automatically on git push

### Heroku
```bash
# Install Heroku CLI and login
heroku create arwa-educ-app
heroku config:set DATABASE_URL="your-mongodb-url"
heroku config:set JWT_SECRET="your-jwt-secret"
git push heroku main
```

### AWS / DigitalOcean / VPS
1. Set up Ubuntu server
2. Install Docker and Docker Compose
3. Clone repository and run:
```bash
docker-compose up -d
```

## 🔐 Production Environment Variables

### Required Variables
```env
DATABASE_URL="mongodb+srv://..."
JWT_SECRET="strong-32-char-secret"
NODE_ENV="production"
PORT=3000
FRONTEND_URL="https://yourdomain.com"
```

### Frontend Environment
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
```

## 🌐 Domain & SSL Setup

### Nginx Configuration Example
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### SSL with Certbot
```bash
sudo certbot --nginx -d yourdomain.com
```

## 📊 Monitoring Setup

### PM2 (Node.js Process Manager)
```bash
npm install -g pm2
pm2 start dist/server.js --name "arwa-educ"
pm2 startup
pm2 save
```

### Health Check Endpoints
- Backend: `GET /health`
- API Status: `GET /api/auth/status`

## 🔧 Troubleshooting

### Common Issues
1. **Database Connection Fails**
   - Check DATABASE_URL format
   - Verify network security groups/firewall

2. **JWT Authentication Issues**
   - Ensure JWT_SECRET matches between deployments
   - Check token expiration settings

3. **CORS Errors**
   - Configure allowedOrigins in app.ts
   - Set proper FRONTEND_URL

### Logs
```bash
# Docker logs
docker-compose logs -f app

# PM2 logs
pm2 logs arwa-educ
```

## 🔐 Security Best Practices

1. **Use HTTPS in production**
2. **Set secure JWT secrets**
3. **Configure proper CORS**
4. **Use environment variables for secrets**
5. **Regular security updates**
6. **Database access restrictions**

## 📈 Performance Optimization

1. **Enable gzip compression**
2. **Use CDN for static assets**
3. **Database connection pooling**
4. **Redis for session storage** (optional)
5. **Load balancing** for high traffic

## 🚀 Quick Production Commands

```bash
# Full production build and deploy
npm run production:setup
npm run deploy:docker

# Health check
curl https://yourdomain.com/health

# View logs
docker-compose logs -f
```

## 📞 Support

For deployment issues:
1. Check the logs first
2. Verify environment variables
3. Ensure database connectivity
4. Check port availability