import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ref, get, set, update, runTransaction } from 'firebase/database';
import { db } from '../firebase';

export interface AuthUser {
  uid: string;
  username: string;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName?: string) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USERNAME = 'admin';
const DEFAULT_PASSWORD = '2003';
const SESSION_KEY = 'selftalk_user';

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.uid && parsed?.username) setUser(parsed);
      }
    } catch {}
    setLoading(false);
  }, []);

  const ensureAdmin = async () => {
    const adminRef = ref(db, 'users/admin');
    const snap = await get(adminRef);
    if (snap.exists() && snap.val()?.passwordHash) return;

    const salt = randomSalt();
    const passwordHash = await hashPassword(DEFAULT_PASSWORD, salt);
    await set(adminRef, {
      username: DEFAULT_USERNAME,
      displayName: 'Admin',
      passwordHash,
      salt,
      createdAt: Date.now(),
    });
  };

  const login = async (username: string, password: string) => {
    setError(null);
    const uname = username.trim().toLowerCase();
    if (!uname || !password) {
      setError('Vui lòng nhập đầy đủ');
      throw new Error('empty');
    }

    try {
      if (uname === DEFAULT_USERNAME) await ensureAdmin();

      const snap = await get(ref(db, `users/${uname}`));
      if (!snap.exists()) {
        setError('Tài khoản không tồn tại');
        throw new Error('not-found');
      }

      const data = snap.val();
      const hashed = await hashPassword(password, data.salt || '');
      if (hashed !== data.passwordHash) {
        setError('Sai mật khẩu');
        throw new Error('wrong-password');
      }

      const authUser: AuthUser = {
        uid: uname,
        username: data.username || uname,
        displayName: data.displayName || uname,
      };
      setUser(authUser);
      localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
    } catch (err: any) {
      if (!['not-found', 'wrong-password', 'empty'].includes(err.message)) {
        setError(err.message || 'Đăng nhập thất bại');
      }
      throw err;
    }
  };

  const register = async (username: string, password: string, displayName?: string) => {
    setError(null);
    const uname = username.trim().toLowerCase();
    if (!uname || uname.length < 3) {
      setError('Tên tài khoản ít nhất 3 ký tự');
      throw new Error('invalid');
    }
    if (!/^[a-z0-9_]+$/.test(uname)) {
      setError('Chỉ dùng chữ thường, số và _');
      throw new Error('invalid');
    }
    if (!password || password.length < 4) {
      setError('Mật khẩu ít nhất 4 ký tự');
      throw new Error('invalid');
    }
    if (uname === 'admin') {
      setError('Không thể đăng ký tên admin');
      throw new Error('invalid');
    }

    const userRef = ref(db, `users/${uname}`);
    const snap = await get(userRef);
    if (snap.exists()) {
      setError('Tài khoản đã tồn tại');
      throw new Error('exists');
    }

    const salt = randomSalt();
    const passwordHash = await hashPassword(password, salt);
    await set(userRef, {
      username: uname,
      displayName: displayName?.trim() || uname,
      passwordHash,
      salt,
      createdAt: Date.now(),
    });

    const authUser: AuthUser = {
      uid: uname,
      username: uname,
      displayName: displayName?.trim() || uname,
    };
    setUser(authUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(authUser));
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!user) throw new Error('not-logged-in');
    setError(null);
    if (!newPassword || newPassword.length < 4) {
      setError('Mật khẩu mới ít nhất 4 ký tự');
      throw new Error('invalid');
    }

    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);
    if (!snap.exists()) throw new Error('not-found');

    const data = snap.val();
    const oldHash = await hashPassword(oldPassword, data.salt || '');
    if (oldHash !== data.passwordHash) {
      setError('Mật khẩu cũ không đúng');
      throw new Error('wrong-password');
    }

    const salt = randomSalt();
    const passwordHash = await hashPassword(newPassword, salt);
    await update(userRef, { passwordHash, salt });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, changePassword, logout, error, clearError: () => setError(null) }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
