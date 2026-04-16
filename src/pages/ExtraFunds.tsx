import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addFund, getFundsByUser, deleteFund, formatAmount, getCurrency } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { HandCoins, PlusCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const SOURCES = ['Salary', 'Freelance', 'Gift', 'Investment', 'Bonus', 'Refund', 'Other'];

export default function ExtraFunds() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [refreshKey, setRefreshKey] = useState(0);

  const funds = useMemo(() => {
    if (!user) return [];
    return getFundsByUser(user.id).sort((a, b) => b.date.localeCompare(a.date));
  }, [user, refreshKey]);

  const total = funds.reduce((s, f) => s + f.amount, 0);
  const currency = getCurrency();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !source) {
      toast.error('Please fill in amount and source');
      return;
    }
    addFund({
      userId: user!.id,
      amount: parseFloat(amount),
      source,
      description,
      date,
    });
    toast.success('Fund added!');
    setAmount('');
    setDescription('');
    setSource('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setRefreshKey(k => k + 1);
  };

  const handleDelete = (id: string) => {
    deleteFund(id);
    setRefreshKey(k => k + 1);
    toast.success('Fund entry deleted');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <HandCoins className="w-6 h-6 text-chart-green" /> My Wallet
        </h1>
        <p className="text-muted-foreground text-sm">Track money you receive from any source in your wallet</p>
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-accent" /> Add to Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount ({currency.symbol})</Label>
                <Input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger><SelectValue placeholder="Where did the money come from?" /></SelectTrigger>
                <SelectContent>
                  {SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Additional details..." />
            </div>
            <Button type="submit" variant="fintoxa" className="w-full">Add to Wallet</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{funds.length} wallet entr{funds.length === 1 ? 'y' : 'ies'} recorded</p>
        <p className="font-heading font-bold text-lg">
          Total: <span className="text-chart-green">{formatAmount(total)}</span>
        </p>
      </div>

      <Card className="shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {funds.length > 0 ? funds.map(f => (
              <TableRow key={f.id}>
                <TableCell className="text-sm">{format(parseISO(f.date), 'MMM dd, yyyy')}</TableCell>
                <TableCell><span className="text-xs bg-muted px-2 py-1 rounded-full">{f.source}</span></TableCell>
                <TableCell className="font-medium">{f.description || '—'}</TableCell>
                <TableCell className="text-right font-heading font-semibold text-chart-green">+{formatAmount(f.amount)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(f.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No wallet entries recorded yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
