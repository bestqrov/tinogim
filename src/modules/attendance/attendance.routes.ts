import { Router } from 'express';
import { create, getByStudent, bulkCreate, getByGroup } from './attendance.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Read attendance by group or student: accessible by ADMIN, SUPER_ADMIN, SECRETARY, and TEACHER
router.get('/group/:id', roleMiddleware('ADMIN', 'SUPER_ADMIN', 'SECRETARY', 'TEACHER'), getByGroup);
router.get('/student/:id', roleMiddleware('ADMIN', 'SUPER_ADMIN', 'SECRETARY', 'TEACHER'), getByStudent);

// Write attendance: accessible by ADMIN, SUPER_ADMIN, SECRETARY, and TEACHER
router.post('/', roleMiddleware('ADMIN', 'SUPER_ADMIN', 'SECRETARY', 'TEACHER'), create);
router.post('/bulk', roleMiddleware('ADMIN', 'SUPER_ADMIN', 'SECRETARY', 'TEACHER'), bulkCreate);

export default router;
