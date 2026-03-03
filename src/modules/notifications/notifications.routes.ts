import { Router } from 'express';
import { getAll, create, remove } from './notifications.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();
router.use(authMiddleware);
router.use(roleMiddleware('ADMIN', 'SECRETARY', 'SUPER_ADMIN'));

router.get('/', getAll);
router.post('/', create);
router.delete('/:id', remove);

export default router;
