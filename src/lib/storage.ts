// Local storage utilities for Fintoxa

export interface User {
  id: string;
  username: string;
  displayName?: string;
  passwordHash: string;
  role: 'user' | 'admin';
  approved: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Fund {
  id: string;
  userId: string;
  amount: number;
  source: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string;
  content: string;
  updatedAt: string;
}

export const DEFAULT_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Education',
  'Gift',
  'Travel',
  'Other',
] as const;

export type Category = string;

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
];

const KEYS = {
  users: 'fintoxa_users',
  expenses: 'fintoxa_expenses',
  funds: 'fintoxa_funds',
  diary: 'fintoxa_diary',
  currentUser: 'fintoxa_current_user',
  theme: 'fintoxa_theme',
  currency: 'fintoxa_currency',
  monthlyBudget: 'fintoxa_monthly_budget',
  customCategories: 'fintoxa_custom_categories',
  adminSettings: 'fintoxa_admin_settings',
};

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'fintoxa_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Users
export function getUsers(): User[] {
  return getItem<User[]>(KEYS.users, []);
}

export function saveUsers(users: User[]) {
  setItem(KEYS.users, users);
}

export function getUserById(id: string): User | undefined {
  return getUsers().find(u => u.id === id);
}

// Current user session
export function getCurrentUser(): User | null {
  return getItem<User | null>(KEYS.currentUser, null);
}

export function setCurrentUser(user: User | null) {
  setItem(KEYS.currentUser, user);
}

// Custom Categories
export function getCustomCategories(): string[] {
  return getItem<string[]>(KEYS.customCategories, []);
}

export function saveCustomCategories(cats: string[]) {
  setItem(KEYS.customCategories, cats);
}

export function getAllCategories(): string[] {
  return [...DEFAULT_CATEGORIES, ...getCustomCategories()];
}

export function addCustomCategory(name: string): boolean {
  const all = getAllCategories();
  if (all.some(c => c.toLowerCase() === name.toLowerCase())) return false;
  const custom = getCustomCategories();
  custom.push(name);
  saveCustomCategories(custom);
  return true;
}

export function removeCustomCategory(name: string) {
  const custom = getCustomCategories().filter(c => c !== name);
  saveCustomCategories(custom);
}

// Expenses
export function getExpenses(): Expense[] {
  return getItem<Expense[]>(KEYS.expenses, []);
}

export function saveExpenses(expenses: Expense[]) {
  setItem(KEYS.expenses, expenses);
}

export function getExpensesByUser(userId: string): Expense[] {
  return getExpenses().filter(e => e.userId === userId);
}

export function addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Expense {
  const newExpense: Expense = {
    ...expense,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const expenses = getExpenses();
  expenses.push(newExpense);
  saveExpenses(expenses);
  return newExpense;
}

export function deleteExpense(id: string) {
  const expenses = getExpenses().filter(e => e.id !== id);
  saveExpenses(expenses);
}

export function updateExpense(id: string, updates: Partial<Expense>) {
  const expenses = getExpenses().map(e => e.id === id ? { ...e, ...updates } : e);
  saveExpenses(expenses);
}

// Funds
export function getFunds(): Fund[] {
  return getItem<Fund[]>(KEYS.funds, []);
}

export function saveFunds(funds: Fund[]) {
  setItem(KEYS.funds, funds);
}

export function getFundsByUser(userId: string): Fund[] {
  return getFunds().filter(f => f.userId === userId);
}

export function addFund(fund: Omit<Fund, 'id' | 'createdAt'>): Fund {
  const newFund: Fund = {
    ...fund,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const funds = getFunds();
  funds.push(newFund);
  saveFunds(funds);
  return newFund;
}

export function deleteFund(id: string) {
  const funds = getFunds().filter(f => f.id !== id);
  saveFunds(funds);
}

// Diary
export function getDiaryEntries(userId: string): DiaryEntry[] {
  return getItem<DiaryEntry[]>(KEYS.diary, []).filter(d => d.userId === userId);
}

export function saveDiaryEntry(entry: Omit<DiaryEntry, 'id' | 'updatedAt'>): DiaryEntry {
  const all = getItem<DiaryEntry[]>(KEYS.diary, []);
  const existing = all.findIndex(d => d.userId === entry.userId && d.date === entry.date);
  if (existing >= 0) {
    all[existing] = { ...all[existing], content: entry.content, updatedAt: new Date().toISOString() };
    setItem(KEYS.diary, all);
    return all[existing];
  }
  const newEntry: DiaryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    updatedAt: new Date().toISOString(),
  };
  all.push(newEntry);
  setItem(KEYS.diary, all);
  return newEntry;
}

export function deleteDiaryEntry(userId: string, date: string) {
  const all = getItem<DiaryEntry[]>(KEYS.diary, []).filter(d => !(d.userId === userId && d.date === date));
  setItem(KEYS.diary, all);
}

// Theme
export function getTheme(): 'light' | 'dark' {
  return getItem<'light' | 'dark'>(KEYS.theme, 'light');
}

export function setTheme(theme: 'light' | 'dark') {
  setItem(KEYS.theme, theme);
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Currency
export function getCurrency(): CurrencyOption {
  return getItem<CurrencyOption>(KEYS.currency, CURRENCIES[0]);
}

export function setCurrency(currency: CurrencyOption) {
  setItem(KEYS.currency, currency);
}

export function formatAmount(amount: number): string {
  const currency = getCurrency();
  return `${currency.symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Monthly Budget
export interface MonthlyBudget {
  amount: number;
  enabled: boolean;
}

export function getMonthlyBudget(userId: string): MonthlyBudget {
  return getItem<MonthlyBudget>(`${KEYS.monthlyBudget}_${userId}`, { amount: 0, enabled: false });
}

export function setMonthlyBudget(userId: string, budget: MonthlyBudget) {
  setItem(`${KEYS.monthlyBudget}_${userId}`, budget);
}

// Admin Settings
export interface AdminSettings {
  approvalRequired: boolean;
}

export function getAdminSettings(): AdminSettings {
  return getItem<AdminSettings>(KEYS.adminSettings, { approvalRequired: true });
}

export function saveAdminSettings(settings: AdminSettings) {
  setItem(KEYS.adminSettings, settings);
}

// Initialize default admin
export async function initializeApp() {
  const users = getUsers();
  if (users.length === 0) {
    const adminHash = await hashPassword('admin123');
    const admin: User = {
      id: crypto.randomUUID(),
      username: 'admin',
      displayName: 'Admin',
      passwordHash: adminHash,
      role: 'admin',
      approved: true,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };
    saveUsers([admin]);
  }
  const theme = getTheme();
  setTheme(theme);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function exportData(): string {
  const data: Record<string, unknown> = {};
  Object.values(KEYS).forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        data[key] = JSON.parse(val);
      } catch {
        data[key] = val;
      }
    }
  });
  
  // Also get user-specific budgets
  const users = getUsers();
  users.forEach(u => {
    const budgetKey = `${KEYS.monthlyBudget}_${u.id}`;
    const budget = localStorage.getItem(budgetKey);
    if (budget) data[budgetKey] = JSON.parse(budget);
  });
  
  return JSON.stringify(data, null, 2);
}

export function importData(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    if (typeof data !== 'object' || data === null) return false;
    
    Object.entries(data).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
    return true;
  } catch {
    return false;
  }
}

export function clearAllData() {
  const preservedKeys = [KEYS.currentUser, KEYS.theme]; // Maybe keep session? No, clear everything but maybe theme.
  const allKeys = Object.values(KEYS);
  
  // Clear main keys
  allKeys.forEach(key => {
    if (key !== KEYS.theme) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear user budgets
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(KEYS.monthlyBudget)) {
      localStorage.removeItem(key);
    }
  }
}
