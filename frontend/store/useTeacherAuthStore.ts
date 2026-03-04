// store/useTeacherAuthStore.ts
import { create } from 'zustand';

interface TeacherUser {
    id: string;
    name: string;
    email: string | null;
    role: 'TEACHER';
    picture?: string | null;
}

type TeacherAuthState = {
    teacher: TeacherUser | null;
    teacherToken: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    getMe: () => Promise<void>;
};

let _teacherToken: string | null = null;

export const getTeacherToken = () => _teacherToken;
export const setTeacherToken = (t: string | null) => {
    _teacherToken = t;
    if (typeof window !== 'undefined') {
        if (t) localStorage.setItem('teacherToken', t);
        else localStorage.removeItem('teacherToken');
    }
};
export const clearTeacherToken = () => {
    _teacherToken = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('teacherToken');
    }
};

// Initialize from localStorage
if (typeof window !== 'undefined') {
    _teacherToken = localStorage.getItem('teacherToken');
}

export const useTeacherAuthStore = create<TeacherAuthState>((set) => ({
    teacher: null,
    teacherToken: _teacherToken,
    loading: !!_teacherToken,

    login: async (email: string, password: string) => {
        try {
            set({ loading: true });
            const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${baseURL}/teachers/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || data.message || 'Login failed');
            }
            const token = data.data?.token;
            const teacher = data.data?.teacher;
            setTeacherToken(token);
            set({ teacher, teacherToken: token, loading: false });
            return { success: true };
        } catch (err: any) {
            set({ loading: false });
            return { success: false, message: err.message || 'Network error' };
        }
    },

    logout: () => {
        clearTeacherToken();
        set({ teacher: null, teacherToken: null });
        if (typeof window !== 'undefined') {
            window.location.href = `${window.location.origin}/login`;
        }
    },

    getMe: async () => {
        try {
            set({ loading: true });
            const token = getTeacherToken();
            if (!token) {
                set({ loading: false, teacher: null });
                return;
            }
            const { default: api } = await import('../lib/api');
            const res = await api.get('/teachers/me', {
                headers: { Authorization: `Bearer ${token}` },
            });
            set({ teacher: res.data.data, teacherToken: token, loading: false });
        } catch {
            clearTeacherToken();
            set({ teacher: null, teacherToken: null, loading: false });
        }
    },
}));
