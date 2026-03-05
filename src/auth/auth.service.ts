import prisma from '../config/database';
import { comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';

interface LoginData {
    email: string;
    password: string;
}

export const loginUser = async (data: LoginData) => {
    const { email, password } = data;

    // Try User table first (ADMIN, SECRETARY, SUPER_ADMIN)
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
    });

    if (user) {
        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
        });
        return {
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role },
        };
    }

    // Fall back to Teacher table (loginEnabled accounts only)
    const teacher = await prisma.teacher.findFirst({
        where: { email: email.toLowerCase(), loginEnabled: true },
    });

    if (teacher && teacher.password) {
        const isPasswordValid = await comparePassword(password, teacher.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const token = generateToken({
            id: teacher.id,
            email: teacher.email!,
            role: 'TEACHER',
            name: teacher.name,
        });
        return {
            token,
            user: { id: teacher.id, email: teacher.email, name: teacher.name, role: 'TEACHER' },
        };
    }

    // Fall back to Student table (loginEnabled accounts only)
    const student = await prisma.student.findFirst({
        where: {
            OR: [
                { email: email.toLowerCase() },
                { username: email.toLowerCase() },
            ],
            loginEnabled: true,
        },
    });

    if (student && student.password) {
        const isPasswordValid = await comparePassword(password, student.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const token = generateToken({
            id: student.id,
            email: student.email || student.username || '',
            role: 'STUDENT',
            name: `${student.name} ${student.surname}`,
        });
        return {
            token,
            user: {
                id: student.id,
                email: student.email,
                username: student.username,
                name: `${student.name} ${student.surname}`,
                role: 'STUDENT',
            },
        };
    }

    // Fall back to Parent login (parentLoginEnabled accounts only, by parentUsername or parentEmail)
    const parentStudent = await prisma.student.findFirst({
        where: {
            parentLoginEnabled: true,
            OR: [
                { parentUsername: email.toLowerCase() },
                { parentEmail: email.toLowerCase() },
            ],
        },
    });

    if (parentStudent && parentStudent.parentPassword) {
        const isPasswordValid = await comparePassword(password, parentStudent.parentPassword);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        const token = generateToken({
            id: parentStudent.id,
            email: parentStudent.email || parentStudent.parentUsername || '',
            role: 'PARENT',
            name: parentStudent.parentName || `Parent de ${parentStudent.name} ${parentStudent.surname}`,
        });
        return {
            token,
            user: {
                id: parentStudent.id,
                parentUsername: parentStudent.parentUsername,
                name: parentStudent.parentName || `Parent de ${parentStudent.name} ${parentStudent.surname}`,
                childName: `${parentStudent.name} ${parentStudent.surname}`,
                role: 'PARENT',
            },
        };
    }

    throw new Error('Invalid email or password');
};
