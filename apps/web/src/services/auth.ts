// apps/web/src/services/auth.ts
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessType: string;
  storeName?: string;
  tenantId?: string;
  createdAt: string;
}

interface StoredAccount extends UserAccount {
  passwordHash?: string;
}

const STORAGE_USERS_KEY = 'techzone_registered_users';
const STORAGE_CURRENT_USER_KEY = 'techzone_user';

const INITIAL_ACCOUNTS: StoredAccount[] = [
  {
    id: 'user_moustafa',
    name: 'مصطفى ماهر',
    email: 'owner@moustafatech.eg',
    phone: '+20 100 123 4567',
    businessType: 'electronics',
    storeName: 'Moustafa Tech',
    tenantId: 'tenant-moustafa-tech',
    createdAt: new Date().toISOString(),
  },
];

export const getRegisteredUsers = (): StoredAccount[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ACCOUNTS;
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
    } else {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
    }
  } catch (_) {}
};

export const registerUser = async (data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  businessType: string;
  storeName?: string;
}): Promise<UserAccount> => {
  const users = getRegisteredUsers();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();
  const cleanStoreName = (data.storeName || `متجر ${cleanName}`).trim();

  // 1. Create dedicated isolated store in PostgreSQL database
  let tenantId = `tenant_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
  try {
    const res = await fetch('http://127.0.0.1:8001/api/v1/stores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: cleanStoreName,
        category: data.businessType || 'تجارة عامة وإلكترونيات',
        currency: 'EGP',
        owner_name: cleanName,
        owner_email: cleanEmail,
        phone: data.phone.trim(),
        theme_mode: 'dark',
      }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.store?.id) {
        tenantId = json.store.id;
      }
    }
  } catch (err) {
    console.warn('Backend store registration fallback:', err);
  }

  // 2. Check if existing user account in localStorage
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    existing.name = cleanName || existing.name;
    existing.phone = data.phone.trim() || existing.phone;
    existing.businessType = data.businessType || existing.businessType;
    existing.storeName = cleanStoreName || existing.storeName;
    existing.tenantId = tenantId || existing.tenantId;
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (_) {}
    setCurrentUser(existing);
    return existing;
  }

  const newUser: StoredAccount = {
    id: `user_${Date.now()}`,
    name: cleanName || 'التاجر الجديد',
    email: cleanEmail,
    phone: data.phone.trim() || '+20 100 000 0000',
    businessType: data.businessType || 'electronics',
    storeName: cleanStoreName,
    tenantId,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (_) {}

  setCurrentUser(newUser);
  return newUser;
};

export const loginUser = async (email: string, password?: string): Promise<UserAccount> => {
  const users = getRegisteredUsers();
  const cleanEmail = email.trim().toLowerCase();

  // If Moustafa Maher demo account
  if (cleanEmail === 'owner@moustafatech.eg' || cleanEmail.includes('moustafa')) {
    const moustafaUser: StoredAccount = {
      id: 'user_moustafa',
      name: 'مصطفى ماهر',
      email: 'owner@moustafatech.eg',
      phone: '+20 100 123 4567',
      businessType: 'electronics',
      storeName: 'Moustafa Tech',
      tenantId: 'tenant-moustafa-tech',
      createdAt: new Date().toISOString(),
    };
    setCurrentUser(moustafaUser);
    return moustafaUser;
  }

  const match = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (match) {
    // If missing tenantId, fetch from backend
    if (!match.tenantId) {
      try {
        const res = await fetch(`http://127.0.0.1:8001/api/v1/stores?owner_email=${cleanEmail}`);
        if (res.ok) {
          const stores = await res.json();
          if (Array.isArray(stores) && stores.length > 0) {
            match.tenantId = stores[0].id;
            match.storeName = stores[0].name;
          }
        }
      } catch (_) {}
    }
    setCurrentUser(match);
    return match;
  }

  // Derive respectful name if registering through login directly
  const prefix = cleanEmail.split('@')[0] || 'التاجر';
  const prettyName =
    prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[._-]/g, ' ');

  // Fetch or create store for this email
  let tenantId = `tenant_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}`;
  let storeName = `متجر ${prettyName}`;
  try {
    const res = await fetch(`http://127.0.0.1:8001/api/v1/stores?owner_email=${cleanEmail}`);
    if (res.ok) {
      const stores = await res.json();
      if (Array.isArray(stores) && stores.length > 0) {
        tenantId = stores[0].id;
        storeName = stores[0].name;
      } else {
        // Auto-provision store for newly logged in merchant
        const createRes = await fetch('http://127.0.0.1:8001/api/v1/stores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: storeName,
            category: 'تجارة عامة',
            currency: 'EGP',
            owner_name: prettyName,
            owner_email: cleanEmail,
          }),
        });
        if (createRes.ok) {
          const json = await createRes.json();
          if (json.store?.id) {
            tenantId = json.store.id;
            storeName = json.store.name;
          }
        }
      }
    }
  } catch (_) {}

  const fallbackUser: StoredAccount = {
    id: `user_${Date.now()}`,
    name: prettyName,
    email: cleanEmail,
    phone: '+20 100 123 4567',
    businessType: 'electronics',
    storeName,
    tenantId,
    createdAt: new Date().toISOString(),
  };

  users.push(fallbackUser);
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (_) {}

  setCurrentUser(fallbackUser);
  return fallbackUser;
};
