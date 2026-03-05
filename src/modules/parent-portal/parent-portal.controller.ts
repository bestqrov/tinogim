import { Request, Response } from 'express';
import prisma from '../../config/database';

// GET /api/parent/portal/me — full child profile for logged-in parent
export const getMyChildPortal = async (req: Request, res: Response) => {
    try {
        // The JWT contains the student id (the parent logs in via the student record)
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

        // Fetch notifications (targetAll)
        const notifications = await prisma.notification.findMany({
            where: { OR: [{ targetAll: true }, { studentIds: { has: studentId } }] },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        // Strip sensitive fields before sending
        const { password, username, parentPassword, parentUsername, ...safeStudent } = student as any;

        return res.json({
            success: true,
            data: { student: safeStudent, notifications },
        });
    } catch (error: any) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
