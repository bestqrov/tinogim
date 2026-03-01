# Domain Redirect Configuration for ArwaEduc
# 
# Target Domain: https://arwaeduc.enovazoneacadimeca.com
# Purpose: Redirect all traffic from temporary Coolify domains to main domain

## Coolify Configuration Steps:

### 1. Add Domain in Coolify Dashboard:
- Main Domain: arwaeduc.enovazoneacadimeca.com  
- Enable SSL Certificate (Let's Encrypt)
- Enable HTTPS Redirect

### 2. DNS Configuration Required:
```
Type: A Record
Name: arwaeduc  
Value: [Your Coolify Server IP]
TTL: 300

Type: CNAME  
Name: www.arwaeduc
Value: arwaeduc.enovazoneacadimeca.com
TTL: 300
```

### 3. Environment Variables to Set in Coolify:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=mongodb://admin:your_password@mongo:27017/arwaeduc?authSource=admin
JWT_SECRET=your_super_secure_jwt_secret_change_this
FRONTEND_URL=https://arwaeduc.enovazoneacadimeca.com
APP_URL=https://arwaeduc.enovazoneacadimeca.com
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=7d
```

### 4. Application Features:
- ✅ Automatic redirect from temporary domains  
- ✅ API endpoints accessible on main domain
- ✅ Health checks on /health endpoint
- ✅ CORS configured for main domain
- ✅ SSL/HTTPS enforced

### 5. Testing URLs After Deployment:
- Health Check: https://arwaeduc.enovazoneacadimeca.com/health
- API Base: https://arwaeduc.enovazoneacadimeca.com/api  
- Auth Login: https://arwaeduc.enovazoneacadimeca.com/api/auth/login
- Root (redirects): https://arwaeduc.enovazoneacadimeca.com/

### 6. Security Notes:
- Change JWT_SECRET to a strong 32+ character string
- Use environment-specific MongoDB passwords  
- Enable rate limiting in production
- Monitor logs for unauthorized access attempts