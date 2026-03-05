// store/useParentAuthStore.ts
import { create } from 'zustand';

interface ParentUser {
    id: string;
    name: string;
    childName?: string;
    parentUsername?: string | null;
    role: 'PARENT';
}

type ParentAuthState = {
    parent: ParentUser | null;
    parentToken: string | null;
    loading: boolean;
    login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
    logout: () => void;
    getMe: () => Promise<void>;
};

let _parentToken: string | null = null;

export const getParentToken = () => _parentToken;
export const setParentToken = (t: string | null) => {
    _parentToken = t;
    if (typeof window !== 'undefined') {
        if (t) localStorage.setItem('parentToken', t);
        else localStorage.removeItem('parentToken');
    }
};

if (typeof window !== 'undefined') {
    _parentToken = localStorage.getItem('parentToken');
}

export const useParentAuthStore = create<ParentAuthState>((set) => ({
    parent: null,
    parentToken: _parentToken,
    loading: !!_parentToken,

    login: async (username: string, password: string) => {
        try {
            set({ loading: true });
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${base}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: username, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

            const { token, user } = data.data || data;
            if (user?.role !== 'PARENT') throw new Error('Ce portail est réservé aux parents.');

            setParentToken(token);
            set({ parent: { ...user, role: 'PARENT' }, parentToken: token, loading: false });
            return { success: true };
        } catch (err: any) {
            set({ loading: false });
            return { success: false, message: err.message };
        }
    },

    logout: () => {
        setParentToken(null);
        set({ parent: null, parentToken: null });
        if (typeof window !== 'undefined') window.location.href = '/parent/login';
    },

    getMe: async () => {
        try {
            if (!_parentToken) return;
            const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const res = await fetch(`${base}/auth/me`, {
                headers: { Authorization: `Bearer ${_parentToken}` },
            });
            if (!res.ok) { setParentToken(null); set({ parent: null, parentToken: null, loading: false }); return; }
            const data = await res.json();
            const user = data.data?.user || data.user;
            set({ parent: { ...user, role: 'PARENT' }, loading: false });
        } catch {
            set({ loading: false });
        }
    },
}));
