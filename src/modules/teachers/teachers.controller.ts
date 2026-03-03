import { Request, Response } from 'express';
import * as teachersService from './teachers.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createTeacher = async (req: Request, res: Response) => {
    try {
        const teacher = await teachersService.createTeacher(req.body);
        sendSuccess(res, teacher, 'Teacher created successfully', 201);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to create teacher', 400);
    }
};

export const getAllTeachers = async (req: Request, res: Response) => {
    try {
        const teachers = await teachersService.getAllTeachers();
        sendSuccess(res, teachers, 'Teachers retrieved successfully');
    } catch (error: any) {
        sendError(res, error.message, 'Failed to retrieve teachers');
    }
};

export const updateTeacher = async (req: Request, res: Response) => {
    try {
        const teacher = await teachersService.updateTeacher(req.params.id, req.body);
        sendSuccess(res, teacher, 'Teacher updated successfully');
    } catch (error: any) {
        sendError(res, error.message, 'Failed to update teacher', 400);
    }
};

export const deleteTeacher = async (req: Request, res: Response) => {
    try {
        await teachersService.deleteTeacher(req.params.id);
        sendSuccess(res, null, 'Teacher deleted successfully');
    } catch (error: any) {
        sendError(res, error.message, 'Failed to delete teacher', 400);
    }
};

export const getTeacherById = async (req: Request, res: Response) => {
    try {
        const teacher = await teachersService.getTeacherById(req.params.id);
        if (!teacher) {
            return sendError(res, 'Teacher not found', 'Teacher not found', 404);
        }
        return sendSuccess(res, teacher, 'Teacher retrieved successfully');
    } catch (error: any) {
        return sendError(res, error.message, 'Failed to retrieve teacher');
    }
};
// ===== TEACHER LOGIN SYSTEM =====

export const teacherLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await teachersService.teacherLogin(email, password);
        sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
        sendError(res, error.message, 'Login failed', 401);
    }
};

export const setTeacherPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { password } = req.body;
        const teacher = await teachersService.setTeacherPassword(id, password);
        sendSuccess(res, teacher, 'Teacher login enabled successfully');
    } catch (error: any) {
        sendError(res, error.message, 'Failed to set teacher password', 400);
    }
};

export const disableTeacherLogin = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const teacher = await teachersService.disableTeacherLogin(id);
        sendSuccess(res, teacher, 'Teacher login disabled successfully');
    } catch (error: any) {
        sendError(res, error.message, 'Failed to disable teacher login', 400);
    }
};

export const getTeacherMe = async (req: AuthRequest, res: Response) => {
    try {
        const teacherId = req.user?.id;
        if (!teacherId) return sendError(res, 'Unauthorized', 'Unauthorized', 401);
        const teacher = await teachersService.getTeacherProfile(teacherId);
        if (!teacher) return sendError(res, 'Teacher not found', 'Teacher not found', 404);
        return sendSuccess(res, teacher, 'Profile retrieved');
    } catch (error: any) {
        return sendError(res, error.message, 'Failed to retrieve profile');
    }
};

export const getLoginEnabledCount = async (_req: Request, res: Response) => {
    try {
        const count = await teachersService.getLoginEnabledCount();
        sendSuccess(res, { count, max: 20 }, 'Login enabled count retrieved');
    } catch (error: any) {
        sendError(res, error.message, 'Failed to retrieve count');
    }
};