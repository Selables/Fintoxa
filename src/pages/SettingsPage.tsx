import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTheme, setTheme, getCurrency, setCurrency, CURRENCIES, getMonthlyBudget, setMonthlyBudget, formatAmount, exportData, importData, clearAllData } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { Moon, User, Info, Coins, Wallet, KeyRound, Database, Download, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [isDark, setIsDark] = useState(getTheme() === 'dark');
  const [selectedCurrency, setSelectedCurrency] = useState(getCurrency());
  const budget = user ? getMonthlyBudget(user.id) : { amount: 0, enabled: false };
  const [budgetEnabled, setBudgetEnabled] = useState(budget.enabled);
  const [budgetAmount, setBudgetAmount] = useState(budget.amount.toString());

  const [displayName, setDisplayName] = useState(user?.displayName || user?.username || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const toggleTheme = (checked: boolean) => {
    setIsDark(checked);
    setTheme(checked ? 'dark' : 'light');
  };

  const handleCurrencyChange = (code: string) => {
    const currency = CURRENCIES.find(c => c.code === code);
    if (currency) {
      setSelectedCurrency(currency);
      setCurrency(currency);
      toast.success(`Currency set to ${currency.name} (${currency.symbol})`);
    }
  };

  const handleBudgetToggle = (checked: boolean) => {
    setBudgetEnabled(checked);
    if (user) {
      setMonthlyBudget(user.id, { amount: parseFloat(budgetAmount) || 0, enabled: checked });
    }
    if (!checked) toast.info('Monthly budget disabled');
  };

  const handleBudgetSave = () => {
    const amt = parseFloat(budgetAmount);
    if (isNaN(amt) || amt < 0) {
      toast.error('Enter a valid budget amount');
      return;
    }
    if (user) {
      setMonthlyBudget(user.id, { amount: amt, enabled: budgetEnabled });
      toast.success(`Monthly budget set to ${formatAmount(amt)}`);
    }
  };

  const handleProfileUpdate = async () => {
    const updates: { displayName?: string; newPassword?: string } = {};
    if (displayName.trim() && displayName !== user?.displayName) {
      updates.displayName = displayName.trim();
    }
    if (newPassword) {
      if (newPassword.length < 4) {
        toast.error('Password must be at least 4 characters');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
      updates.newPassword = newPassword;
    }
    if (!updates.displayName && !updates.newPassword) {
      toast.info('No changes to save');
      return;
    }
    const result = await updateProfile(updates);
    if (result.success) {
      toast.success('Profile updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your preferences</p>
      </div>

      {/* Profile */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <User className="w-4 h-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1"><KeyRound className="w-3.5 h-3.5" /> New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Leave blank to keep current" />
          </div>
          {newPassword && (
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm password" />
            </div>
          )}
          <Button onClick={handleProfileUpdate}>Update Profile</Button>
          <div className="pt-2 border-t border-border space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username</span>
              <span className="font-medium">{user?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member since</span>
              <span className="font-medium">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Coins className="w-4 h-4" /> Currency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label className="font-medium">Preferred Currency</Label>
            <Select value={selectedCurrency.code} onValueChange={handleCurrencyChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} — {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This will update currency symbols across the app</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Wallet className="w-4 h-4" /> Monthly Budget
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Monthly Budget</Label>
              <p className="text-sm text-muted-foreground">Set a spending limit for each month</p>
            </div>
            <Switch checked={budgetEnabled} onCheckedChange={handleBudgetToggle} />
          </div>
          {budgetEnabled && (
            <div className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label>Budget Amount ({selectedCurrency.symbol})</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={budgetAmount}
                  onChange={e => setBudgetAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <Button onClick={handleBudgetSave}>Save</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Moon className="w-4 h-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Dark Mode</Label>
              <p className="text-sm text-muted-foreground">Toggle dark theme</p>
            </div>
            <Switch checked={isDark} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-destructive/20">
        <CardHeader className="pb-3 text-destructive">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Database className="w-4 h-4" /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              className="flex-1 gap-2"
              onClick={() => {
                const data = exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `fintoxa_backup_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                toast.success('Backup file generated');
              }}
            >
              <Download className="w-4 h-4" /> Backup Data
            </Button>
            
            <div className="flex-1 relative">
              <input
                type="file"
                accept=".json"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (re) => {
                    const content = re.target?.result as string;
                    if (importData(content)) {
                      toast.success('Data restored successfully! Refreshing...');
                      setTimeout(() => window.location.reload(), 1500);
                    } else {
                      toast.error('Invalid backup file');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
              <Button variant="outline" className="w-full gap-2">
                <Upload className="w-4 h-4" /> Restore Data
              </Button>
            </div>
          </div>
          
          <div className="pt-2 border-t border-border">
            <Button 
              variant="destructive" 
              className="w-full gap-2"
              onClick={() => {
                if (window.confirm('Are you absolutely sure? This will delete all your expenses, funds, and settings. This cannot be undone.')) {
                  clearAllData();
                  toast.success('All data cleared. Redirecting...');
                  setTimeout(() => window.location.href = '/', 1500);
                }
              }}
            >
              <Trash2 className="w-4 h-4" /> Clear All Data
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2 font-medium">
              Warning: Clearing data will remove everything except your current session theme.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Info className="w-4 h-4" /> About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fintoxa is a browser-based expense tracker. All data is stored locally in your browser.
            No servers, no accounts needed — just pure financial clarity.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
