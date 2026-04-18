import { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { getExpensesByUser, deleteExpense, getAllCategories, formatAmount } from '@/lib/storage';
import { getCategoryMeta } from '@/lib/categoryMeta';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Search, Receipt, Wallet, TrendingUp, PieChart as PieChartIcon, RefreshCw } from 'lucide-react';
import { format, parseISO, startOfWeek, subDays, isWithinInterval, startOfMonth, startOfYear, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, LineChart, Line, CartesianGrid, XAxis, YAxis, BarChart, Bar } from 'recharts';

const PIE_COLORS = [
  'hsl(217, 63%, 53%)',
  'hsl(122, 39%, 49%)',
  'hsl(27, 87%, 62%)',
  'hsl(4, 79%, 63%)',
  'hsl(41, 62%, 53%)',
];

export default function Reports() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');

  const categories = useMemo(() => getAllCategories(), []);

  const expenses = useMemo(() => {
    if (!user) return [];
    let data = getExpensesByUser(user.id);
    if (search) data = data.filter(e => e.description.toLowerCase().includes(search.toLowerCase()));
    if (catFilter !== 'all') data = data.filter(e => e.category === catFilter);
    if (dateFrom) data = data.filter(e => e.date >= dateFrom);
    return data.sort((a, b) => b.date.localeCompare(a.date));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, search, catFilter, dateFrom, refreshKey]);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const previousWeekStart = subDays(currentWeekStart, 7);
  const previousWeekEnd = subDays(currentWeekStart, 1);
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = startOfMonth(subDays(currentMonthStart, 1));
  const previousMonthEnd = subDays(currentMonthStart, 1);
  const currentYearStart = startOfYear(now);
  const previousYearStart = startOfYear(subDays(currentYearStart, 1));
  const previousYearEnd = subDays(currentYearStart, 1);

  const filteredByPeriod = useMemo(() => {
    let start: Date;
    let end = now;
    if (period === 'week') start = currentWeekStart;
    else if (period === 'month') start = currentMonthStart;
    else start = currentYearStart;
    
    return expenses.filter(expense => isWithinInterval(parseISO(expense.date), { start, end }));
  }, [expenses, period, currentWeekStart, currentMonthStart, currentYearStart, now]);

  const categoryChartData = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredByPeriod.forEach(expense => grouped.set(expense.category, (grouped.get(expense.category) || 0) + expense.amount));
    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredByPeriod]);

  const trendData = useMemo(() => {
    return Array.from({ length: 8 }, (_, index) => {
      const day = subDays(new Date(), 7 - index);
      const key = format(day, 'yyyy-MM-dd');
      const amount = expenses
        .filter(expense => expense.date === key)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return { label: format(day, 'EEE'), amount };
    });
  }, [expenses]);

  const weeklyBarData = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => {
      const weekStart = startOfWeek(subDays(new Date(), (5 - index) * 7), { weekStartsOn: 1 });
      const weekEnd = subDays(startOfWeek(subDays(new Date(), (4 - index) * 7), { weekStartsOn: 1 }), 1);
      const amount = expenses
        .filter(expense => isWithinInterval(parseISO(expense.date), { start: weekStart, end: weekEnd }))
        .reduce((sum, expense) => sum + expense.amount, 0);
      return { label: format(weekStart, 'MMM dd'), amount };
    });
  }, [expenses]);

  const thisPeriodTotal = useMemo(() => {
    let start: Date;
    let end = now;
    if (period === 'week') start = currentWeekStart;
    else if (period === 'month') start = currentMonthStart;
    else start = currentYearStart;
    return expenses
      .filter(expense => isWithinInterval(parseISO(expense.date), { start, end }))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, period, currentWeekStart, currentMonthStart, currentYearStart, now]);

  const previousPeriodTotal = useMemo(() => {
    let start: Date;
    let end: Date;
    if (period === 'week') {
      start = previousWeekStart;
      end = previousWeekEnd;
    } else if (period === 'month') {
      start = previousMonthStart;
      end = previousMonthEnd;
    } else {
      start = previousYearStart;
      end = previousYearEnd;
    }
    return expenses
      .filter(expense => isWithinInterval(parseISO(expense.date), { start, end }))
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses, period, previousWeekStart, previousWeekEnd, previousMonthStart, previousMonthEnd, previousYearStart, previousYearEnd]);

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setRefreshKey(k => k + 1);
    toast.success('Expense deleted');
  };

  const formatRecentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Reports</h1>
        <p className="text-muted-foreground text-sm">View and filter your expenses</p>
      </div>

      <Card className="shadow-card bg-card dark:bg-[#143C37] border border-border dark:border-[#1A3F3A]">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            <div className="relative lg:col-span-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <div className="lg:col-span-2">
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
            <div className="lg:col-span-2">
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="mm/dd/yyyy" />
            </div>
            <div className="lg:col-span-5 flex flex-wrap lg:flex-nowrap items-center justify-end gap-2 min-w-0">
              <div className="inline-flex rounded-full bg-[#10231d] p-1 shrink-0">
                {(['week', 'month', 'year'] as const).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPeriod(key)}
                    className={`px-4 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      period === key ? 'bg-[#0e3f3a] text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {key === 'week' ? 'Week' : key === 'month' ? 'Month' : 'Year'}
                  </button>
                ))}
              </div>
              <Button
                variant="fintoxa"
                size="sm"
                onClick={() => setRefreshKey(k => k + 1)}
                className="px-3"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="shadow-card bg-card dark:bg-[#1e3a35] border border-border dark:border-[#1A3F3A]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Total Spent</p>
              <p className="text-xl font-heading font-bold text-gold">{formatAmount(total)}</p>
            </div>
            <Receipt className="w-5 h-5 text-gold" />
          </CardContent>
        </Card>
        <Card className="shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-xl font-heading font-bold text-[#58b4ff]">{expenses.length}</p>
            </div>
            <Wallet className="w-5 h-5 text-[#58b4ff]" />
          </CardContent>
        </Card>
        <Card className="shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'}
              </p>
              <p className="text-xl font-heading font-bold text-chart-green">{formatAmount(thisPeriodTotal)}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-chart-green" />
          </CardContent>
        </Card>
        <Card className="shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                vs last {period === 'week' ? 'week' : period === 'month' ? 'month' : 'year'}
              </p>
              <p className={`text-xl font-heading font-bold ${thisPeriodTotal > previousPeriodTotal ? 'text-destructive' : 'text-[#4CD964]'}`}>
                {previousPeriodTotal === 0 ? '0%' : `${(((thisPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100).toFixed(0)}%`}
              </p>
            </div>
            <PieChartIcon className="w-5 h-5 text-accent" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A] xl:col-span-2">
          <CardContent className="p-4">
            <h3 className="font-heading font-semibold mb-1">Daily Spending</h3>
            <p className="text-xs text-muted-foreground mb-3">Expense trend over this {period}</p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-blue))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#172525', border: '1px solid #2a6b61', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatAmount(value)}
                  />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--chart-blue))" strokeWidth={2.5} dot={false} fillOpacity={1} fill="url(#colorTrend)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <CardContent className="p-4">
            <h3 className="font-heading font-semibold mb-1">Category Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-3">
              {period === 'week' ? 'Weekly' : period === 'month' ? 'Monthly' : 'Yearly'} distribution
            </p>
            <div className="h-48">
              {categoryChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={categoryChartData} 
                      dataKey="value" 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      stroke="none"
                    >
                      {categoryChartData.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data</div>
              )}
            </div>
            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {categoryChartData.map((c, i) => {
                const totalVal = categoryChartData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = totalVal > 0 ? (c.value / totalVal) * 100 : 0;
                return (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground font-medium truncate max-w-[80px]">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-muted-foreground font-bold">{percent.toFixed(0)}%</span>
                      <span className="font-bold">{formatAmount(c.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-card overflow-hidden bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div>
              <h3 className="font-heading font-semibold">Transactions History</h3>
              <p className="text-xs text-muted-foreground mt-1">Detailed list of your spending</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="pl-6 w-32">Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-16 pr-6" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length > 0 ? expenses.map(e => {
                  const meta = getCategoryMeta(e.category);
                  const Icon = meta.icon;
                  return (
                    <TableRow key={e.id} className="hover:bg-black/5 border-border/30">
                      <TableCell className="pl-6 text-sm font-medium text-muted-foreground">{formatRecentDate(e.date)}</TableCell>
                      <TableCell className="font-medium text-foreground">{e.description}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.softBg} ${meta.accent} border-current/10`}>
                          <Icon className="w-3 h-3" />
                          {e.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-heading font-bold text-destructive">-{formatAmount(e.amount)}</TableCell>
                      <TableCell className="pr-6">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground bg-black/5">
                      No expenses found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="font-heading font-semibold text-lg">Weekly Comparison</h3>
              <p className="text-xs text-muted-foreground">Spending trends over the last 6 weeks</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBarData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#172525', border: '1px solid #2a6b61', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => formatAmount(value as number)} 
                  />
                  <Bar dataKey="amount" fill="#F2C96D" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
