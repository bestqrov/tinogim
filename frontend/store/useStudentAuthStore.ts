// store/useStudentAuthStore.ts
import { create } from 'zustand';

interface StudentUser {
    id: string;
    name: string;
    email: string | null;
    username?: string | null;
    role: 'STUDENT';
}

type StudentAuthState = {
    student: StudentUser | null;
    studentToken: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    getMe: () => Promise<void>;
};

let _studentToken: string | null = null;

export const getStudentToken = () => _studentToken;
export const setStudentToken = (t: string | null) => {
    _studentToken = t;
    if (typeof window !== 'undefined') {
        if (t) localStorage.setItem('studentToken', t);
        else localStorage.removeItem('studentToken');
    }
};

if (typeof window !== 'undefined') {
    _studentToken = localStorage.getItem('studentToken');
}

export const useStudentAuthStore = create<StudentAuthState>((set) => ({
    student: null,
    studentToken: _studentToken,
    loading: !!_studentToken,

    login: async (username: string, password: string) => {
        try {
            set({ loading: true });
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${base}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

            const { token, user } = data.data || data;
            if (user?.role !== 'STUDENT') throw new Error('Ce portail est réservé aux élèves.');

            setStudentToken(token);
            set({ student: { ...user, role: 'STUDENT' }, studentToken: token, loading: false });
            return { success: true };
        } catch (err: any) {
            set({ loading: false });
            return { success: false, message: err.message };
        }
    },

    logout: () => {
        setStudentToken(null);
        set({ student: null, studentToken: null });
        if (typeof window !== 'undefined') window.location.href = '/student/login';
    },

    getMe: async () => {
        try {
            if (!_studentToken) return;
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
            const res = await fetch(`${base}/api/auth/me`, {
                headers: { Authorization: `Bearer ${_studentToken}` },
            });
            if (!res.ok) { setStudentToken(null); set({ student: null, studentToken: null, loading: false }); return; }
            const data = await res.json();
            const user = data.data?.user || data.user;
            set({ student: { ...user, role: 'STUDENT' }, loading: false });
        } catch {
            set({ loading: false });
        }
    },
}));
