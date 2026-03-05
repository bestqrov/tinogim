import { Router } from 'express';
import { create, getAll, getById, update, remove, getAnalytics, enableLogin, disableLogin, enableParentLogin, disableParentLogin } from './students.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { roleMiddleware } from '../../middlewares/role.middleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware('ADMIN', 'SECRETARY'));

router.get('/analytics', getAnalytics);
router.post('/', create);
router.get('/', getAll);
router.get('/:id', getById);
router.put('/:id', update);
router.delete('/:id', remove);
router.post('/:id/enable-login', enableLogin);
router.post('/:id/disable-login', disableLogin);
router.post('/:id/enable-parent-login', enableParentLogin);
router.post('/:id/disable-parent-login', disableParentLogin);

export default router;
