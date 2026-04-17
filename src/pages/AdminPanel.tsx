import { useMemo, useState } from 'react';
import { getUsers, saveUsers, getExpenses, getAdminSettings, saveAdminSettings, type User } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Users, Activity, ShieldCheck, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInDays, parseISO } from 'date-fns';
import { Navigate } from 'react-router-dom';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const users = useMemo(() => getUsers(), [refreshKey]);
  const allExpenses = useMemo(() => getExpenses(), [refreshKey]);
  const adminSettings = useMemo(() => getAdminSettings(), [refreshKey]);

  if (!isAdmin) return <Navigate to="/" replace />;

  const nonAdminUsers = users.filter(u => u.role !== 'admin');
  const pendingUsers = nonAdminUsers.filter(u => !u.approved);
  const approvedUsers = users.filter(u => u.approved);

  const isActive = (u: User) => {
    if (!u.lastLogin) return false;
    return differenceInDays(new Date(), parseISO(u.lastLogin)) < 7;
  };

  const handleRevoke = (userId: string) => {
    const updated = users.map(u => u.id === userId ? { ...u, approved: false } : u);
    saveUsers(updated);
    setRefreshKey(k => k + 1);
    toast.success('User access revoked');
  };

  const toggleApprovalRequired = (checked: boolean) => {
    saveAdminSettings({ ...adminSettings, approvalRequired: checked });
    setRefreshKey(k => k + 1);
    toast.success(checked ? 'User approval required' : 'Users can now sign in without approval');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-gold" /> Admin Panel
        </h1>
        <p className="text-muted-foreground text-sm">Manage users and activity</p>
      </div>

      {/* Admin Settings */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Admin Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Require User Approval</Label>
              <p className="text-sm text-muted-foreground">When enabled, new users must be approved before they can log in</p>
            </div>
            <Switch checked={adminSettings.approvalRequired} onCheckedChange={toggleApprovalRequired} />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Users className="w-5 h-5 text-chart-blue" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-xl font-heading font-bold">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Activity className="w-5 h-5 text-chart-green" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <p className="text-xl font-heading font-bold">{users.filter(isActive).length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <X className="w-5 h-5 text-chart-orange" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-xl font-heading font-bold">{pendingUsers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals removed: Admins should not approve new users here. */}

      {/* All Users */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Approved</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Expenses</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.displayName || u.username}</TableCell>
                  <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{u.role}</Badge></TableCell>
                  <TableCell>
                    <Badge variant={isActive(u) ? 'default' : 'outline'} className={isActive(u) ? 'bg-chart-green text-primary-foreground' : ''}>
                      {isActive(u) ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.approved ? 'default' : 'outline'} className={u.approved ? '' : 'border-chart-orange text-chart-orange'}>
                      {u.approved ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell className="text-right font-heading font-semibold">
                    {allExpenses.filter(e => e.userId === u.id).length}
                  </TableCell>
                  <TableCell className="text-right">
                    {u.role !== 'admin' && (
                      u.approved ? (
                        <Button size="sm" variant="outline" onClick={() => handleRevoke(u.id)}>Revoke</Button>
                      ) : (
                        <span className="text-sm text-muted-foreground">Pending</span>
                      )
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
