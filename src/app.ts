import express, { Application } from 'express';
import cors from 'cors';
import path from 'path';
import { errorMiddleware } from './middlewares/error.middleware';

// Import routes
import authRoutes from './auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import studentsRoutes from './modules/students/students.routes';
import inscriptionsRoutes from './modules/inscriptions/inscriptions.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import settingsRoutes from './modules/settings/settings.routes';
import formationsRoutes from './modules/formations/formations.routes';
import documentsRoutes from './modules/documents/documents.routes';
import pricingRoutes from './modules/pricing/pricing.routes';
import groupsRoutes from './modules/groups/groups.routes';
import teachersRoutes from './modules/teachers/teachers.routes';
import transactionsRoutes from './modules/transactions/transactions.routes';
import studentPortalRoutes from './modules/student-portal/student-portal.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';

const app: Application = express();

// ================= MIDDLEWARE =================
app.use(cors({
    origin: [
        'https://arwaeduc.enovazoneacadimeca.com',
        'http://localhost:3001', // For development
        'http://localhost:3000'  // For development
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ================= HEALTH CHECK =================
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// ================= API ROUTES =================
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/students', studentsRoutes);
apiRouter.use('/inscriptions', inscriptionsRoutes);
apiRouter.use('/payments', paymentsRoutes);
apiRouter.use('/attendance', attendanceRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/formations', formationsRoutes);
apiRouter.use('/documents', documentsRoutes);
apiRouter.use('/pricing', pricingRoutes);
apiRouter.use('/groups', groupsRoutes);
apiRouter.use('/teachers', teachersRoutes);
apiRouter.use('/transactions', transactionsRoutes);
apiRouter.use('/student/portal', studentPortalRoutes);
apiRouter.use('/notifications', notificationsRoutes);

app.use('/api', apiRouter);

// ================= FRONTEND STATIC =================
// Frontend static files serving - prioritize Next.js over public
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');
const absoluteFrontendPath = path.resolve(frontendPath);

console.log('🔧 Frontend serving configuration:');
console.log('   - __dirname:', __dirname);
console.log('   - frontendPath:', frontendPath);
console.log('   - absoluteFrontendPath:', absoluteFrontendPath);
console.log('   - Exists:', require('fs').existsSync(absoluteFrontendPath));

app.use(express.static(absoluteFrontendPath, {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            // Never cache HTML — always fetch fresh so chunk URLs stay current
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (filePath.includes('/_next/static/')) {
            // Content-hashed chunks can be cached forever
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
    }
}));

// Serve static files from public directory (excluding index.html to prevent conflicts)
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath, { 
    index: false  // Don't serve index.html from public directory
}));

// Catch-all route for frontend with fallback
app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            error: 'API endpoint not found',
            message: `Route ${req.path} not found`
        });
    }

    // Try to serve frontend index.html first
    const frontendIndex = path.join(absoluteFrontendPath, 'index.html');
    
    console.log(`🔍 Serving request for: ${req.path}`);
    console.log(`   - Looking for: ${frontendIndex}`);
    console.log(`   - File exists: ${require('fs').existsSync(frontendIndex)}`);
    
    // Check if frontend build exists
    try {
        if (require('fs').existsSync(frontendIndex)) {
            console.log('✅ Serving React frontend');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            return res.sendFile(frontendIndex);
        } else {
            // List available files in frontend directory for debugging
            try {
                const files = require('fs').readdirSync(absoluteFrontendPath);
                console.log(`📁 Files in frontend dist: ${files.join(', ')}`);
            } catch (e) {
                console.log(`❌ Cannot read frontend directory: ${e instanceof Error ? e.message : String(e)}`);
            }
            
            // Fallback to simple login page only for development
            const publicIndex = path.join(publicPath, 'index.html');
            if (require('fs').existsSync(publicIndex)) {
                console.log('⚠️  Serving fallback public index.html');
                return res.sendFile(publicIndex);
            } else {
                // Last fallback - API-only response
                console.log('❌ Frontend not available - serving API info');
                const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL;
                
                return res.json({
                    success: true,
                    message: 'ArwaEduc API Server is running',
                    version: '1.0.0',
                    debug: {
                        frontendPath: absoluteFrontendPath,
                        frontendIndex: frontendIndex,
                        frontendExists: require('fs').existsSync(frontendIndex),
                        publicPath: publicPath
                    },
                    endpoints: {
                        health: '/health',
                        api: '/api',
                        auth: '/api/auth/login'
                    },
                    redirect: frontendUrl || null,
                    note: 'Frontend not available - API only mode'
                });
            }
        }
    } catch (error) {
        console.log(`💥 Error serving frontend: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
            success: false,
            error: 'Server configuration error',
            message: 'Unable to serve frontend files',
            debug: error instanceof Error ? error.message : String(error)
        });
    }
});

// ================= ERROR HANDLING =================
app.use(errorMiddleware);

export default app;
