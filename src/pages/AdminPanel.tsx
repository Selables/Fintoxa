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

      {/* Admin Quick View */}
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
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-heading">Manage Users</CardTitle>
          <Badge variant="outline" className="text-xs">{users.length} total</Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Expenses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{u.displayName || u.username}</span>
                        <span className="text-xs text-muted-foreground">@{u.username}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">{u.role}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={isActive(u) ? 'default' : 'outline'} className={isActive(u) ? 'bg-chart-green/20 text-chart-green border-chart-green/30' : ''}>
                        {isActive(u) ? 'Active' : 'Inactive'}
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
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 border-chart-orange/30 text-chart-orange hover:bg-chart-orange/10" 
                            onClick={() => handleRevoke(u.id)}
                            title="Deactivate account"
                          >
                            Revoke
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="h-8" 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this user?')) {
                                const updated = users.filter(user => user.id !== u.id);
                                saveUsers(updated);
                                setRefreshKey(k => k + 1);
                                toast.success('User deleted');
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
