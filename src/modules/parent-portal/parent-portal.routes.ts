import { Router } from 'express';
import { getMyChildPortal } from './parent-portal.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/me', getMyChildPortal);

export default router;
