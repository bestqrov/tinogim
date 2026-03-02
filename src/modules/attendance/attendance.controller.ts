import { Request, Response } from 'express';
import {
    createAttendance,
    getAttendanceByStudent,
    upsertBulkAttendance,
    getAttendanceByGroup,
} from './attendance.service';
import { sendSuccess, sendError } from '../../utils/response';

export const create = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, date, status } = req.body;

        // Validate required fields
        if (!studentId || !date || !status) {
            sendError(
                res,
                'StudentId, date, and status are required',
                'Validation error',
                400
            );
            return;
        }

        if (!['present', 'absent'].includes(status)) {
            sendError(
                res,
                'Invalid status',
                'Status must be "present" or "absent"',
                400
            );
            return;
        }

        const attendance = await createAttendance({
            studentId,
            date: new Date(date),
            status,
        });

        sendSuccess(res, attendance, 'Attendance created successfully', 201);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to create attendance', 400);
    }
};

export const getByStudent = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { id } = req.params;
        const attendances = await getAttendanceByStudent(id);
        sendSuccess(res, attendances, 'Attendance retrieved successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to retrieve attendance', 404);
    }
};

export const bulkCreate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { records } = req.body;
        if (!Array.isArray(records) || records.length === 0) {
            sendError(res, 'records array is required', 'Validation error', 400);
            return;
        }
        const date = new Date(records[0].date);
        const processed = records.map((r: any) => ({ studentId: r.studentId, date, status: r.status }));
        const result = await upsertBulkAttendance(processed);
        sendSuccess(res, result, 'Attendance saved successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to save attendance', 400);
    }
};

export const getByGroup = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { date } = req.query;
        const result = await getAttendanceByGroup(id, date as string | undefined);
        sendSuccess(res, result, 'Group attendance retrieved successfully', 200);
    } catch (error: any) {
        sendError(res, error.message, 'Failed to retrieve group attendance', 404);
    }
};
