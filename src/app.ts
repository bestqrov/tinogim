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

const app: Application = express();

// ================= MIDDLEWARE =================
app.use(cors());
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

app.use('/api', apiRouter);

// ================= FRONTEND STATIC =================
// Frontend static files serving with error handling
const frontendPath = path.join(__dirname, '..', 'frontend', 'dist');

// Serve static files if they exist
app.use(express.static(frontendPath));

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

    // Try to serve frontend index.html
    const indexPath = path.join(frontendPath, 'index.html');
    
    // Check if frontend build exists
    try {
        if (require('fs').existsSync(indexPath)) {
            return res.sendFile(indexPath);
        } else {
            // Frontend not built - redirect to main domain or show API info
            const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL;
            
            // If accessing root and frontend URL is configured, redirect
            if (req.path === '/' && frontendUrl && frontendUrl !== req.get('host')) {
                return res.redirect(302, frontendUrl);
            }
            
            // Otherwise serve API-only response
            return res.json({
                success: true,
                message: 'ArwaEduc API Server is running',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    api: '/api',
                    auth: '/api/auth/login'
                },
                redirect: frontendUrl || null,
                note: 'Frontend not available - API only mode'
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: 'Server configuration error',
            message: 'Unable to serve frontend files'
        });
    }
});

// ================= ERROR HANDLING =================
app.use(errorMiddleware);

export default app;
