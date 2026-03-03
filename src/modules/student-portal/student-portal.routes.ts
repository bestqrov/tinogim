import { Router } from 'express';
import { getMyPortal } from './student-portal.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/me', getMyPortal);

export default router;
