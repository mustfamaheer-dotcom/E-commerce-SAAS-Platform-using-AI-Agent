// apps/web/src/services/auth.ts
export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessType: string;
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
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user_techzone',
    name: 'تاجر تيك زون',
    email: 'merchant@techzone.eg',
    phone: '+20 102 987 6543',
    businessType: 'electronics',
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

export const registerUser = (data: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  businessType: string;
}): UserAccount => {
  const users = getRegisteredUsers();
  const cleanEmail = data.email.trim().toLowerCase();
  const cleanName = data.name.trim();

  // Check if existing
  const existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    // Update name and info
    existing.name = cleanName || existing.name;
    existing.phone = data.phone.trim() || existing.phone;
    existing.businessType = data.businessType || existing.businessType;
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (_) {}
    setCurrentUser(existing);
    return existing;
  }

  const newUser: StoredAccount = {
    id: `user_${Date.now()}`,
    name: cleanName || 'تاجر تيك زون',
    email: cleanEmail,
    phone: data.phone.trim() || '+20 100 000 0000',
    businessType: data.businessType || 'electronics',
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (_) {}

  setCurrentUser(newUser);
  return newUser;
};

export const loginUser = (email: string, password?: string): UserAccount => {
  const users = getRegisteredUsers();
  const cleanEmail = email.trim().toLowerCase();

  const match = users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (match) {
    setCurrentUser(match);
    return match;
  }

  // Derive respectful name if registering through login directly
  const prefix = cleanEmail.split('@')[0] || 'التاجر';
  const prettyName =
    prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/[._-]/g, ' ');

  const fallbackUser: StoredAccount = {
    id: `user_${Date.now()}`,
    name: prettyName,
    email: cleanEmail,
    phone: '+20 100 123 4567',
    businessType: 'electronics',
    createdAt: new Date().toISOString(),
  };

  users.push(fallbackUser);
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (_) {}

  setCurrentUser(fallbackUser);
  return fallbackUser;
};
