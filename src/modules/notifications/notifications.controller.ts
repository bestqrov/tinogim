import { Request, Response } from 'express';
import prisma from '../../config/database';

// GET /api/notifications — admin/secretary fetch all
export const getAll = async (req: Request, res: Response) => {
    try {
        const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
        return res.json({ success: true, data: notifications });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/notifications — create
export const create = async (req: Request, res: Response) => {
    try {
        const { title, message, type = 'INFO', targetAll = true, studentIds = [] } = req.body;
        const createdBy = (req as any).user?.name || 'Admin';
        const notification = await prisma.notification.create({
            data: { title, message, type, targetAll, studentIds, createdBy },
        });
        return res.status(201).json({ success: true, data: notification });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
};

// DELETE /api/notifications/:id
export const remove = async (req: Request, res: Response) => {
    try {
        await prisma.notification.delete({ where: { id: req.params.id } });
        return res.json({ success: true });
    } catch (err: any) {
        return res.status(500).json({ success: false, error: err.message });
    }
};
