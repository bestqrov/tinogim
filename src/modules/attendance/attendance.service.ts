import prisma from '../../config/database';

interface CreateAttendanceData {
    studentId: string;
    date: Date;
    status: string;
}

export const createAttendance = async (data: CreateAttendanceData) => {
    const { studentId, date, status } = data;

    // Validate status
    if (!['present', 'absent'].includes(status)) {
        throw new Error('Status must be either "present" or "absent"');
    }

    // Check if student exists
    const student = await prisma.student.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new Error('Student not found');
    }

    const attendance = await prisma.attendance.create({
        data: {
            studentId,
            date,
            status,
        },
        include: {
            student: true,
        },
    });

    return attendance;
};

export const getAttendanceByStudent = async (studentId: string) => {
    // Check if student exists
    const student = await prisma.student.findUnique({
        where: { id: studentId },
    });

    if (!student) {
        throw new Error('Student not found');
    }

    const attendances = await prisma.attendance.findMany({
        where: { studentId },
        include: {
            student: true,
        },
        orderBy: {
            date: 'desc',
        },
    });

    return attendances;
};

export const upsertBulkAttendance = async (records: { studentId: string; date: Date; status: string }[]) => {
    const results = [];
    for (const record of records) {
        const existing = await prisma.attendance.findFirst({
            where: { studentId: record.studentId, date: record.date }
        });
        if (existing) {
            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: { status: record.status }
            });
            results.push(updated);
        } else {
            const created = await prisma.attendance.create({
                data: { studentId: record.studentId, date: record.date, status: record.status }
            });
            results.push(created);
        }
    }
    return results;
};

export const getAttendanceByGroup = async (groupId: string, date?: string) => {
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: { students: { select: { id: true, name: true, surname: true } } }
    });
    if (!group) throw new Error('Group not found');
    const dateFilter = date ? new Date(date) : undefined;
    const attendances = await prisma.attendance.findMany({
        where: {
            studentId: { in: (group.students as any[]).map((s: any) => s.id) },
            ...(dateFilter ? { date: dateFilter } : {})
        },
        include: { student: { select: { id: true, name: true, surname: true } } },
        orderBy: { date: 'desc' }
    });
    return { group, attendances };
};
