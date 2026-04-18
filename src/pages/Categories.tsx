import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getExpensesByUser, getAllCategories, addCustomCategory, removeCustomCategory, getCustomCategories, formatAmount } from '@/lib/storage';
import { getCategoryMeta } from '@/lib/categoryMeta';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { PlusCircle, Trash2 } from 'lucide-react';

export default function Categories() {
  const { user } = useAuth();
  const [newCat, setNewCat] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const customCats = useMemo(() => getCustomCategories(), [refreshKey]);

  const data = useMemo(() => {
    if (!user) return [];
    const expenses = getExpensesByUser(user.id);
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    const categories = getAllCategories();
    return categories.map((cat) => {
      const catTotal = expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0);
      const count = expenses.filter(e => e.category === cat).length;
      return {
        name: cat,
        amount: catTotal,
        count,
        pct: total > 0 ? (catTotal / total) * 100 : 0,
        meta: getCategoryMeta(cat),
        isCustom: customCats.includes(cat),
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [user, refreshKey]);

  const handleAdd = () => {
    const name = newCat.trim();
    if (!name) { toast.error('Enter a category name'); return; }
    if (addCustomCategory(name)) {
      toast.success(`Category "${name}" added`);
      setNewCat('');
      setRefreshKey(k => k + 1);
    } else {
      toast.error('Category already exists');
    }
  };

  const handleRemove = (name: string) => {
    removeCustomCategory(name);
    toast.success(`Category "${name}" removed`);
    setRefreshKey(k => k + 1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Categories</h1>
        <p className="text-muted-foreground text-sm">Spending breakdown by category</p>
      </div>

      {/* Add Category */}
      <Card className="shadow-card bg-primary/[0.03] border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-sm font-medium">Add Custom Category</label>
              <Input
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                placeholder="e.g. Subscriptions"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <Button onClick={handleAdd}>
              <PlusCircle className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(cat => (
          <Card key={cat.name} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${cat.meta.softBg} flex items-center justify-center`}>
                  <cat.meta.icon className={`w-5 h-5 ${cat.meta.accent}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">{cat.count} transaction(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-heading font-bold">{formatAmount(cat.amount)}</p>
                  {cat.isCustom && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(cat.name)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
              <Progress value={cat.pct} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">{cat.pct.toFixed(1)}% of total</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
