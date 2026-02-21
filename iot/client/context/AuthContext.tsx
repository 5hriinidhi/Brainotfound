/**
 * Auth Context — manages user session via JWT token stored in localStorage.
 * Provides login, register, logout, and auto-restore from stored token.
 * Wraps axios to auto-attach Authorization header.
 */
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '@/lib/api';

// ── Types ────────────────────────────────────────────────────────────────────
interface User {
    id: string;
    username: string;
    totalXP: number;
    bestScore: number;
    eloRating: number;
}

interface AuthState {
    user: User | null;
    token: string | null;
    loading: boolean;
    error: string | null;
    login: (username: string) => Promise<void>;
    register: (username: string) => Promise<void>;
    logout: () => void;
    clearError: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'iot-arena-token';
const USER_KEY = 'iot-arena-user';

// ── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Restore session from localStorage on mount
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem(TOKEN_KEY);
            const storedUser = localStorage.getItem(USER_KEY);
            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
            }
        } catch {
            // Invalid stored data — clear it
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
        } finally {
            setLoading(false);
        }
    }, []);

    const persistSession = useCallback((t: string, u: User) => {
        setToken(t);
        setUser(u);
        localStorage.setItem(TOKEN_KEY, t);
        localStorage.setItem(USER_KEY, JSON.stringify(u));
        api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
    }, []);

    const register = useCallback(async (username: string) => {
        setError(null);
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/register', { username });
            persistSession(data.token, data.user);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, [persistSession]);

    const login = useCallback(async (username: string) => {
        setError(null);
        setLoading(true);
        try {
            const { data } = await api.post('/api/auth/login', { username });
            persistSession(data.token, data.user);
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, [persistSession]);

    const logout = useCallback(() => {
        setToken(null);
        setUser(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        delete api.defaults.headers.common['Authorization'];
    }, []);

    const clearError = useCallback(() => setError(null), []);

    return (
        <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, clearError }}>
            {children}
        </AuthContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
