import { Router } from 'express';
import * as teachersController from './teachers.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';

const router = Router();

// ===== PUBLIC ROUTES =====
router.post('/login', teachersController.teacherLogin);

// ===== AUTH REQUIRED ROUTES =====
router.get('/me', authMiddleware, teachersController.getTeacherMe);
router.get('/login-count', authMiddleware, teachersController.getLoginEnabledCount);

// ===== TEACHER CRUD (admin) =====
router.post('/', authMiddleware, teachersController.createTeacher);
router.get('/', authMiddleware, teachersController.getAllTeachers);

// ===== PASSWORD MANAGEMENT (admin) =====
router.post('/:id/set-password', authMiddleware, teachersController.setTeacherPassword);
router.post('/:id/disable-login', authMiddleware, teachersController.disableTeacherLogin);

// ===== TEACHER BY ID =====
router.get('/:id', authMiddleware, teachersController.getTeacherById);
router.put('/:id', authMiddleware, teachersController.updateTeacher);
router.delete('/:id', authMiddleware, teachersController.deleteTeacher);

export default router;
