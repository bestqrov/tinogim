import { Request, Response } from 'express';
import prisma from '../../config/database';

// GET /api/student/portal/me — full profile for the logged-in student
export const getMyPortal = async (req: Request, res: Response) => {
    try {
        const studentId = (req as any).user?.id;
        if (!studentId) return res.status(401).json({ success: false, error: 'Unauthorized' });

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                groups: {
                    include: {
                        teacher: { select: { id: true, name: true, specialties: true } },
                        formation: true,
                    },
                },
                attendances: { orderBy: { date: 'desc' }, take: 60 },
                payments: { orderBy: { date: 'desc' } },
                inscriptions: { orderBy: { date: 'desc' } },
            },
        });

        if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

        // Fetch notifications for this student
        const notifications = await prisma.notification.findMany({
            where: {
                OR: [
                    { targetAll: true },
                    { studentIds: { has: studentId } },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Strip password before sending
        const { password: _p, ...safeStudent } = student as any;

        return res.json({ success: true, data: { student: safeStudent, notifications } });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
