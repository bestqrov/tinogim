import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/bcrypt';
import { generateToken } from '../../utils/jwt';

export interface CreateTeacherData {
    name: string;
    email?: string;
    phone?: string;
    cin?: string;
    dob?: Date | string;
    gender?: string;
    picture?: string;
    status?: string;
    socialMedia?: any;
    hourlyRate?: number;
    paymentType?: string;
    commission?: number;
    specialties?: string[];
    levels?: string[];
}

export const createTeacher = async (data: CreateTeacherData) => {
    return await prisma.teacher.create({
        data
    });
};

export const getAllTeachers = async () => {
    return await prisma.teacher.findMany({
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { groups: true }
            }
        }
    });
};

export const updateTeacher = async (id: string, data: Partial<CreateTeacherData>) => {
    return await prisma.teacher.update({
        where: { id },
        data
    });
};

export const deleteTeacher = async (id: string) => {
    return await prisma.teacher.delete({
        where: { id }
    });
};

export const getTeacherById = async (id: string) => {
    return await prisma.teacher.findUnique({
        where: { id },
        include: {
            groups: {
                include: {
                    students: {
                        select: {
                            id: true,
                            name: true,
                            surname: true,
                            phone: true,
                            email: true,
                            schoolLevel: true,
                            attendances: {
                                orderBy: { date: 'desc' },
                                take: 10
                            }
                        }
                    },
                    _count: { select: { students: true } }
                }
            },
            _count: { select: { groups: true } }
        }
    });
};

export const calculateMonthlyTeacherExpenses = async () => {
    // Get all teachers with their groups
    const teachers = await prisma.teacher.findMany({
        include: {
            groups: {
                include: {
                    students: true,
                    _count: {
                        select: { students: true }
                    }
                }
            }
        }
    });

    let totalExpenses = 0;

    for (const teacher of teachers) {
        let teacherExpense = 0;

        if (teacher.paymentType === 'FIXED') {
            // Fixed salary - pay the hourlyRate as monthly salary
            teacherExpense = teacher.hourlyRate || 0;
        } else if (teacher.paymentType === 'HOURLY') {
            // Hourly rate - estimate based on groups
            // Assume each group has 8 hours per month (2 hours/week * 4 weeks)
            const totalHours = teacher.groups.length * 8;
            teacherExpense = totalHours * (teacher.hourlyRate || 0);
        } else if (teacher.paymentType === 'PERCENTAGE') {
            // Percentage based - calculate from student count
            // This is an estimate - actual would need inscription amounts
            const totalStudents = teacher.groups.reduce((sum, group) => sum + group._count.students, 0);
            // Estimate: 500 MAD per student * commission percentage
            const estimatedRevenue = totalStudents * 500;
            teacherExpense = estimatedRevenue * ((teacher.commission || 0) / 100);
        }

        totalExpenses += teacherExpense;
    }

    return {
        totalTeacherExpenses: totalExpenses,
        teacherCount: teachers.length
    };
};

// ===== TEACHER LOGIN SYSTEM =====

const MAX_TEACHER_ACCOUNTS = 20;

export const setTeacherPassword = async (id: string, plainPassword: string) => {
    // Count currently enabled accounts excluding this teacher
    const enabledCount = await prisma.teacher.count({
        where: { loginEnabled: true, id: { not: id } }
    });
    if (enabledCount >= MAX_TEACHER_ACCOUNTS) {
        throw new Error(`Maximum ${MAX_TEACHER_ACCOUNTS} teacher login accounts allowed. Please disable another account first.`);
    }
    if (!plainPassword || plainPassword.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
    }
    const hashedPassword = await hashPassword(plainPassword);
    return await prisma.teacher.update({
        where: { id },
        data: { password: hashedPassword, loginEnabled: true },
        select: { id: true, name: true, email: true, loginEnabled: true }
    });
};

export const disableTeacherLogin = async (id: string) => {
    return await prisma.teacher.update({
        where: { id },
        data: { loginEnabled: false, password: null },
        select: { id: true, name: true, email: true, loginEnabled: true }
    });
};

export const teacherLogin = async (email: string, password: string) => {
    if (!email || !password) throw new Error('Email and password are required.');
    const teacher = await prisma.teacher.findFirst({
        where: { email, loginEnabled: true }
    });
    if (!teacher || !teacher.password) {
        throw new Error('Invalid email or password.');
    }
    const valid = await comparePassword(password, teacher.password);
    if (!valid) throw new Error('Invalid email or password.');
    const token = generateToken({
        id: teacher.id,
        email: teacher.email!,
        role: 'TEACHER',
        name: teacher.name
    });
    return {
        token,
        teacher: {
            id: teacher.id,
            email: teacher.email,
            name: teacher.name,
            role: 'TEACHER',
            picture: teacher.picture
        }
    };
};

export const getTeacherProfile = async (id: string) => {
    return await prisma.teacher.findUnique({
        where: { id },
        include: {
            groups: {
                include: {
                    students: {
                        select: {
                            id: true,
                            name: true,
                            surname: true,
                            phone: true,
                            email: true,
                            schoolLevel: true,
                            attendances: {
                                orderBy: { date: 'desc' },
                                take: 10
                            }
                        }
                    },
                    _count: { select: { students: true } }
                }
            },
            _count: { select: { groups: true } }
        }
    });
};

export const getLoginEnabledCount = async () => {
    return await prisma.teacher.count({ where: { loginEnabled: true } });
};
