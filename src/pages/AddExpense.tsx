import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { addExpense, getAllCategories, getCurrency, formatAmount } from '@/lib/storage';
import { getCategoryMeta } from '@/lib/categoryMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { PlusCircle, Zap } from 'lucide-react';

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

export default function AddExpense() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const currency = getCurrency();
  const categories = useMemo(() => getAllCategories(), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !category || !description) {
      toast.error('Please fill in all fields');
      return;
    }
    addExpense({
      userId: user!.id,
      amount: parseFloat(amount),
      category,
      description,
      date,
    });
    toast.success('Expense added!');
    setAmount('');
    setDescription('');
    setCategory('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const handleQuickAdd = (amt: number) => {
    if (!category) {
      toast.error('Select a category first');
      return;
    }
    addExpense({
      userId: user!.id,
      amount: amt,
      category,
      description: category,
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    toast.success(`${formatAmount(amt)} expense added!`);
  };

  const handleCustomQuickAdd = () => {
    const parsed = parseFloat(quickAmount);
    if (!quickAmount || Number.isNaN(parsed) || parsed <= 0) {
      toast.error('Enter a valid quick amount');
      return;
    }
    handleQuickAdd(parsed);
    setQuickAmount('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Add Expense</h1>
        <p className="text-muted-foreground text-sm">Record a new transaction</p>
      </div>

      <Card className="shadow-card bg-primary/[0.03] border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Zap className="w-4 h-4 text-gold" /> Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category first" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => {
                  const meta = getCategoryMeta(c);
                  const Icon = meta.icon;
                  return (
                    <SelectItem key={c} value={c}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${meta.accent}`} />
                        {c}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map(amt => (
              <Button key={amt} variant="fintoxa" onClick={() => handleQuickAdd(amt)} className="flex-1 min-w-[60px]">
                {currency.symbol}{amt}
              </Button>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={quickAmount}
              onChange={e => setQuickAmount(e.target.value)}
              placeholder="Enter any quick amount"
            />
            <Button type="button" variant="fintoxa" onClick={handleCustomQuickAdd}>
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-primary/[0.03] border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-accent" /> Detailed Entry
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
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Choose category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => {
                    const meta = getCategoryMeta(c);
                    const Icon = meta.icon;
                    return (
                      <SelectItem key={c} value={c}>
                        <span className="inline-flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${meta.accent}`} />
                          {c}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What did you spend on?" />
            </div>
            <Button type="submit" variant="fintoxa" className="w-full">Add Expense</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
