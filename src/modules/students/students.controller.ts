import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getStudentAnalytics,
} from './students.service';
import { sendSuccess, sendError } from '../../utils/response';
import prisma from '../../config/database';

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            name, surname, phone, email, cin, address, birthDate,
            birthPlace, fatherName, motherName, schoolLevel, currentSchool, subjects, photo,
            parentName, parentPhone, parentRelation
        } = req.body;

        // Validate required fields
        if (!name || !surname) {
            sendError(res, 'Name and surname are required', 'Validation error', 400);
            return;
        }

        const studentData: any = { name, surname };
        if (phone) studentData.phone = phone;
        if (email) studentData.email = email;
        if (cin) studentData.cin = cin;
        if (address) studentData.address = address;
        if (birthDate) studentData.birthDate = new Date(birthDate);
        if (birthPlace) studentData.birthPlace = birthPlace;
        if (fatherName) studentData.fatherName = fatherName;
        if (motherName) studentData.motherName = motherName;
        if (schoolLevel) studentData.schoolLevel = schoolLevel;
        if (currentSchool) studentData.currentSchool = currentSchool;
        if (subjects) studentData.subjects = subjects;
        if (photo) studentData.photo = photo;
        if (req.body.inscriptionFee) studentData.inscriptionFee = req.body.inscriptionFee;
        if (req.body.amountPaid) studentData.amountPaid = req.body.amountPaid;
        if (parentName) studentData.parentName = parentName;
        if (parentPhone) studentData.parentPhone = parentPhone;
        if (parentRelation) studentData.parentRelation = parentRelation;

        const student = await createStudent(studentData);

        sendSuccess(res, student, 'Student created successfully', 201);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to create student', 400);
    }
};

export const getAll = async (req: Request, res: Response): Promise<void> => {
    try {
        const students = await getAllStudents();
        sendSuccess(res, students, 'Students retrieved successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to retrieve students', 500);
    }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const student = await getStudentById(id);
        sendSuccess(res, student, 'Student retrieved successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to retrieve student', 404);
    }
};

export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const {
            name, surname, phone, email, cin, address, birthDate,
            birthPlace, fatherName, motherName, schoolLevel, currentSchool, subjects, photo,
            parentName, parentPhone, parentRelation
        } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (surname) updateData.surname = surname;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (cin !== undefined) updateData.cin = cin;
        if (address !== undefined) updateData.address = address;
        if (birthDate) updateData.birthDate = new Date(birthDate);
        if (birthPlace !== undefined) updateData.birthPlace = birthPlace;
        if (fatherName !== undefined) updateData.fatherName = fatherName;
        if (motherName !== undefined) updateData.motherName = motherName;
        if (schoolLevel !== undefined) updateData.schoolLevel = schoolLevel;
        if (currentSchool !== undefined) updateData.currentSchool = currentSchool;
        if (subjects !== undefined) updateData.subjects = subjects;
        if (photo !== undefined) updateData.photo = photo;
        if (parentName !== undefined) updateData.parentName = parentName;
        if (parentPhone !== undefined) updateData.parentPhone = parentPhone;
        if (parentRelation !== undefined) updateData.parentRelation = parentRelation;

        const student = await updateStudent(id, updateData);

        sendSuccess(res, student, 'Student updated successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to update student', 400);
    }
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const result = await deleteStudent(id);
        sendSuccess(res, result, 'Student deleted successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to delete student', 404);
    }
};

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
    try {
        const analytics = await getStudentAnalytics();
        sendSuccess(res, analytics, 'Analytics retrieved successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to retrieve analytics', 500);
    }
};

// POST /api/students/:id/enable-login — admin creates portal credentials for student
export const enableLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        if (!username || !password) {
            sendError(res, 'Username and password are required', 'Validation error', 400);
            return;
        }

        // Check username not taken by another student
        const existing = await prisma.student.findFirst({
            where: { username: username.toLowerCase(), NOT: { id } },
        });
        if (existing) {
            sendError(res, 'Ce nom d\'utilisateur est déjà pris.', 'Conflict', 400);
            return;
        }

        const hashed = await bcrypt.hash(password, 10);
        const student = await prisma.student.update({
            where: { id },
            data: { username: username.toLowerCase(), password: hashed, loginEnabled: true },
            select: { id: true, name: true, surname: true, username: true, loginEnabled: true },
        });

        sendSuccess(res, student, 'Accès portail activé avec succès', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to enable student login', 500);
    }
};

// POST /api/students/:id/disable-login — revoke portal access
export const disableLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.student.update({
            where: { id },
            data: { loginEnabled: false },
        });
        sendSuccess(res, null, 'Accès portail désactivé', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed', 500);
    }
};

// POST /api/students/:id/enable-parent-login — admin creates parent portal credentials
export const enableParentLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { username, password } = req.body;

        if (!username || !password) {
            sendError(res, 'Username and password are required', 'Validation error', 400);
            return;
        }

        // Check username not taken by another parent
        const existing = await prisma.student.findFirst({
            where: { parentUsername: username.toLowerCase(), NOT: { id } },
        });
        if (existing) {
            sendError(res, 'Ce nom d\'utilisateur parent est déjà pris.', 'Conflict', 400);
            return;
        }

        const hashed = await bcrypt.hash(password, 10);
        const student = await prisma.student.update({
            where: { id },
            data: { parentUsername: username.toLowerCase(), parentPassword: hashed, parentLoginEnabled: true },
            select: { id: true, name: true, surname: true, parentUsername: true, parentLoginEnabled: true, parentName: true, parentRelation: true },
        });

        sendSuccess(res, student, 'Accès portail parent activé avec succès', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to enable parent login', 500);
    }
};

// POST /api/students/:id/disable-parent-login — revoke parent portal access
export const disableParentLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await prisma.student.update({
            where: { id },
            data: { parentLoginEnabled: false },
        });
        sendSuccess(res, null, 'Accès portail parent désactivé', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed', 500);
    }
};
