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

    throw new Error('Invalid email or password');
};
