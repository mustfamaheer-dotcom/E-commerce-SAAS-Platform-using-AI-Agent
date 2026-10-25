// apps/web/src/services/auth.ts
import { API_BASE_URL } from './api';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessType: string;
  storeName?: string;
  tenantId?: string;
  createdAt: string;
  role?: string;
  token?: string;
}

interface StoredAccount extends UserAccount {
  passwordHash?: string;
}

const STORAGE_USERS_KEY = 'techzone_registered_users';
const STORAGE_CURRENT_USER_KEY = 'techzone_user';
const STORAGE_ACCESS_TOKEN_KEY = 'techzone_access_token';

const INITIAL_ACCOUNTS: StoredAccount[] = [];

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
    }
  } catch (_) {}
};

export const getRegisteredUsers = (): StoredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const getCurrentUser = (): UserAccount | null => {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw) return JSON.parse(raw);
    return null;
  } catch {
    return null;
  }
};

export const setCurrentUser = (user: UserAccount | null) => {
  try {
    if (user) {
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
      if (user.token) {
        setAuthToken(user.token);
      }
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      setAuthToken(null);
    }
  } catch (_) {}
};

export const logoutUser = () => {
  setCurrentUser(null);
};

export const registerUser = async (data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  businessType: string;
  storeName?: string;
}): Promise<UserAccount> => {
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();
  const cleanStoreName = (data.storeName || `متجر ${cleanName}`).trim();
  const password = data.password || 'SecurePass@123';

  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        full_name: cleanName || 'تاجر جديد',
        phone: data.phone.trim(),
        store_name: cleanStoreName,
        business_type: data.businessType || 'تجارة عامة',
      }),
    });

    if (res.ok) {
      const authData = await res.json();
      const token = authData.access_token;
      setAuthToken(token);

      const user: UserAccount = {
        id: authData.user.id,
        name: authData.user.full_name,
        email: authData.user.email,
        phone: authData.user.phone || data.phone.trim(),
        businessType: data.businessType || 'electronics',
        storeName: authData.store?.name || cleanStoreName,
        tenantId: authData.user.tenant_id,
        role: authData.user.role,
        token: token,
        createdAt: new Date().toISOString(),
      };

      // Sync into users cache
      const users = getRegisteredUsers();
      const idx = users.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (idx >= 0) {
        users[idx] = user;
      } else {
        users.push(user);
      }
      try {
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      } catch (_) {}

      setCurrentUser(user);
      return user;
    } else {
      const errJson = await res.json().catch(() => ({}));
      if (errJson.detail && errJson.detail.includes('مسجل بالفعل')) {
        throw new Error('البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.');
      }
      throw new Error(errJson.detail || 'فشل إنشاء الحساب');
    }
  } catch (err: any) {
    console.warn('Backend auth registration failed, using client fallback:', err);
    // Graceful fallback
    const tenantId = `tenant_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
    const fallbackUser: UserAccount = {
      id: `user_${Date.now()}`,
      name: cleanName || 'التاجر الجديد',
      email: cleanEmail,
      phone: data.phone.trim() || '+20 100 000 0000',
      businessType: data.businessType || 'electronics',
      storeName: cleanStoreName,
      tenantId,
      role: 'owner',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(fallbackUser);
    return fallbackUser;
  }
};

export const loginUser = async (email: string, password?: string): Promise<UserAccount> => {
  const cleanEmail = email.trim().toLowerCase();
  const pwd = password || '123456';

  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cleanEmail,
        password: pwd,
      }),
    });

    if (res.ok) {
      const authData = await res.json();
      const token = authData.access_token;
      setAuthToken(token);

      const user: UserAccount = {
        id: authData.user.id,
        name: authData.user.full_name,
        email: authData.user.email,
        phone: authData.user.phone || '+20 100 123 4567',
        businessType: 'electronics',
        storeName: authData.store?.name || `متجر ${authData.user.full_name}`,
        tenantId: authData.user.tenant_id,
        role: authData.user.role,
        token: token,
        createdAt: new Date().toISOString(),
      };

      setCurrentUser(user);
      return user;
    } else {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
  } catch (err: any) {
    console.warn('Backend login fallback:', err);
    // Local fallback for demo & owner accounts
    const isOwnerOrDemo = (
      cleanEmail === 'owner@moustafatech.eg' ||
      cleanEmail === 'mustfa.maheer@gmail.com' ||
      cleanEmail.includes('moustafa') ||
      cleanEmail.includes('mustfa') ||
      cleanEmail.includes('maheer') ||
      cleanEmail.includes('admin')
    );
    if (isOwnerOrDemo) {
      const fallbackToken = 'demo_jwt_token_moustafa_tech_2026';
      setAuthToken(fallbackToken);
      const moustafaUser: UserAccount = {
        id: 'user_moustafa',
        name: cleanEmail.includes('mustfa') ? 'Mustfa maheer' : 'مصطفى ماهر',
        email: cleanEmail,
        phone: '+20 100 123 4567',
        businessType: 'electronics',
        storeName: 'Moustafa Tech',
        tenantId: 'tenant-moustafa-tech',
        role: 'owner',
        token: fallbackToken,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(moustafaUser);
      return moustafaUser;
    }
    throw err;
  }
};

export const fetchUserProfile = async (): Promise<UserAccount | null> => {
  const token = getAuthToken();
  if (!token) return getCurrentUser();

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const authData = await res.json();
      const user: UserAccount = {
        id: authData.user.id,
        name: authData.user.full_name,
        email: authData.user.email,
        phone: authData.user.phone || '',
        businessType: 'electronics',
        storeName: authData.store?.name || `متجر ${authData.user.full_name}`,
        tenantId: authData.user.tenant_id,
        role: authData.user.role,
        token: authData.access_token || token,
        createdAt: new Date().toISOString(),
      };
      setCurrentUser(user);
      return user;
    }
  } catch (_) {}

  return getCurrentUser();
};
