import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { getExpensesByUser, formatAmount, getFundsByUser, getMonthlyBudget } from '@/lib/storage';
import { getCategoryMeta } from '@/lib/categoryMeta';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { TrendingUp, Receipt, ArrowUpRight, AlertTriangle, Wallet, PlusCircle, Sparkles, RefreshCw, Target, PiggyBank, CalendarDays, Flame } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  BarChart, Bar,
} from 'recharts';
import { format, startOfWeek, startOfMonth, startOfYear, isAfter, subDays, parseISO, isWithinInterval, isToday, isYesterday } from 'date-fns';

const PIE_COLORS = [
  'hsl(217, 63%, 53%)', 'hsl(122, 39%, 49%)', 'hsl(27, 87%, 62%)',
  'hsl(4, 79%, 63%)', 'hsl(41, 62%, 53%)', 'hsl(280, 50%, 55%)',
  'hsl(170, 50%, 40%)', 'hsl(340, 60%, 55%)', 'hsl(60, 60%, 45%)', 'hsl(200, 50%, 50%)',
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(new Date());
  const [refreshTick, setRefreshTick] = useState(0);
  const expenses = useMemo(() => user ? getExpensesByUser(user.id) : [], [user, refreshTick]);
  const funds = useMemo(() => user ? getFundsByUser(user.id) : [], [user, refreshTick]);
  const budget = useMemo(() => user ? getMonthlyBudget(user.id) : { amount: 0, enabled: false }, [user]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const today = now;
  const todayStr = format(today, 'yyyy-MM-dd');
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);
  const yearStart = startOfYear(today);
  const previousWeekStart = subDays(weekStart, 7);
  const previousMonthStart = startOfMonth(subDays(monthStart, 1));

  const stats = useMemo(() => {
    const todayTotal = expenses.filter(e => e.date === todayStr).reduce((s, e) => s + e.amount, 0);
    const weekTotal = expenses.filter(e => isAfter(parseISO(e.date), weekStart) || e.date === format(weekStart, 'yyyy-MM-dd')).reduce((s, e) => s + e.amount, 0);
    const monthTotal = expenses.filter(e => isAfter(parseISO(e.date), monthStart) || e.date === format(monthStart, 'yyyy-MM-dd')).reduce((s, e) => s + e.amount, 0);
    const yearTotal = expenses.filter(e => isAfter(parseISO(e.date), yearStart) || e.date === format(yearStart, 'yyyy-MM-dd')).reduce((s, e) => s + e.amount, 0);
    return { todayTotal, weekTotal, monthTotal, yearTotal, totalTx: expenses.length };
  }, [expenses, todayStr, weekStart, monthStart, yearStart]);

  const myWalletBalance = useMemo(
    () => funds.reduce((sum, fund) => sum + fund.amount, 0) - stats.monthTotal,
    [funds, stats.monthTotal],
  );
  const totalFunds = useMemo(
    () => funds.reduce((sum, fund) => sum + fund.amount, 0),
    [funds],
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  const lineData = useMemo(() => {
    const last30 = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(today, 29 - i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const total = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0);
      return { date: format(d, 'MMM dd'), amount: total };
    });
    return last30;
  }, [expenses, today]);

  const weeklyBarData = useMemo(() => {
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const ws = startOfWeek(subDays(today, (3 - i) * 7), { weekStartsOn: 1 });
      const we = subDays(startOfWeek(subDays(today, (2 - i) * 7), { weekStartsOn: 1 }), 0);
      const total = expenses
        .filter(e => {
          const d = parseISO(e.date);
          return (isAfter(d, ws) || format(d, 'yyyy-MM-dd') === format(ws, 'yyyy-MM-dd')) &&
            (!isAfter(d, we) || i === 3);
        })
        .reduce((s, e) => s + e.amount, 0);
      return { week: `Week ${i + 1}`, amount: total };
    });
    return last4Weeks;
  }, [expenses, today]);

  const recentExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  }, [expenses]);

  const weekCurrent = expenses
    .filter(e => isWithinInterval(parseISO(e.date), { start: weekStart, end: today }))
    .reduce((sum, e) => sum + e.amount, 0);
  const weekPrevious = expenses
    .filter(e => isWithinInterval(parseISO(e.date), { start: previousWeekStart, end: subDays(weekStart, 1) }))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthCurrent = expenses
    .filter(e => isWithinInterval(parseISO(e.date), { start: monthStart, end: today }))
    .reduce((sum, e) => sum + e.amount, 0);
  const monthPrevious = expenses
    .filter(e => isWithinInterval(parseISO(e.date), { start: previousMonthStart, end: subDays(monthStart, 1) }))
    .reduce((sum, e) => sum + e.amount, 0);
  const weekChangePercent = weekPrevious > 0 ? ((weekCurrent - weekPrevious) / weekPrevious) * 100 : 0;
  const monthChangePercent = monthPrevious > 0 ? ((monthCurrent - monthPrevious) / monthPrevious) * 100 : 0;

  const budgetPercent = budget.enabled && budget.amount > 0
    ? Math.min((stats.monthTotal / budget.amount) * 100, 100)
    : 0;
  const rawBudgetPercent = budget.enabled && budget.amount > 0
    ? (stats.monthTotal / budget.amount) * 100
    : 0;
  const isNearBudget = budget.enabled && budget.amount > 0 && rawBudgetPercent >= 80 && rawBudgetPercent <= 100;
  const isOverBudget = budget.enabled && budget.amount > 0 && stats.monthTotal > budget.amount;
  const overAmount = isOverBudget ? stats.monthTotal - budget.amount : 0;
  const topCategory = categoryData[0];

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, [now]);

  const netBalanceClass = myWalletBalance < 0 ? 'text-[#fca5a5]' : 'text-[#4CD964]';

  const kpis = [
    {
      label: `${format(now, 'MMMM').toUpperCase()} SPENDING`,
      value: stats.monthTotal,
      icon: TrendingUp,
      color: 'text-gold',
      description: `${stats.totalTx} transaction${stats.totalTx === 1 ? '' : 's'}`,
      tone: 'bg-gradient-to-br from-[#0C2623] to-[#1a4d46] border-[#2E5E58]',
      forceTone: true,
    },
    {
      label: 'TODAY',
      value: stats.todayTotal,
      icon: CalendarDays,
      color: 'text-[#58b4ff]',
      description: `${expenses.filter(expense => expense.date === todayStr).length} transactions today`,
      tone: 'bg-gradient-to-br from-[#0C2623] to-[#1a4d46] border-[#2a6b61]',
      forceTone: true,
    },
    {
      label: 'MY WALLET',
      value: totalFunds,
      icon: Wallet,
      color: 'text-white',
      description: 'Salary, Business, Investment & more',
      tone: 'bg-gradient-to-br from-[#0C2623] to-[#1a4d46] border-[#2a6b61]',
      forceTone: true,
    },
    {
      label: 'NET BALANCE',
      value: myWalletBalance,
      icon: PiggyBank,
      color: myWalletBalance < 0 ? 'text-[#ff4d4d]' : 'text-[#4CD964]',
      description: 'Funds minus expenses',
      tone: myWalletBalance < 0 ? 'bg-gradient-to-br from-[#3d0a0a] to-[#5a1a1a] border-[#8b0000]' : 'bg-gradient-to-br from-[#0C2623] to-[#1a4d46] border-[#2a6b61]',
      forceTone: true,
    },
    {
      label: 'TOP CATEGORY',
      value: topCategory?.value ?? 0,
      icon: Flame,
      color: 'text-[#f97316]',
      description: topCategory ? `Highest spend this month: ${topCategory.name}` : 'Highest spend this month',
      tone: 'bg-gradient-to-br from-[#0C2623] to-[#1a4d46] border-[#2a6b61]',
      forceTone: true,
    },
    {
      label: 'BUDGET USED',
      value: budget.enabled && budget.amount > 0 ? Number(budgetPercent.toFixed(0)) : 0,
      icon: AlertTriangle,
      color: isOverBudget ? 'text-destructive' : isNearBudget ? 'text-gold' : 'text-chart-green',
      description: budget.enabled && budget.amount > 0 ? `${formatAmount(budget.amount - stats.monthTotal)} remaining` : 'No budget set',
      tone: 'bg-gradient-to-br from-[#0C2623] to-[#1a4d46] border-[#2a6b61]',
      forceTone: true,
      suffix: '%',
      isPercent: true,
    },
  ];

  const insights = useMemo(() => {
    const next: string[] = [];
    const foodThisWeek = expenses
      .filter(e => e.category === 'Food & Dining' && isWithinInterval(parseISO(e.date), { start: weekStart, end: today }))
      .reduce((sum, e) => sum + e.amount, 0);
    const foodLastWeek = expenses
      .filter(e => e.category === 'Food & Dining' && isWithinInterval(parseISO(e.date), { start: previousWeekStart, end: subDays(weekStart, 1) }))
      .reduce((sum, e) => sum + e.amount, 0);
    const transportThisWeek = expenses
      .filter(e => e.category === 'Transport' && isWithinInterval(parseISO(e.date), { start: weekStart, end: today }))
      .reduce((sum, e) => sum + e.amount, 0);
    const transportLastWeek = expenses
      .filter(e => e.category === 'Transport' && isWithinInterval(parseISO(e.date), { start: previousWeekStart, end: subDays(weekStart, 1) }))
      .reduce((sum, e) => sum + e.amount, 0);

    if (foodLastWeek > 0 && foodThisWeek > foodLastWeek) {
      const pct = ((foodThisWeek - foodLastWeek) / foodLastWeek) * 100;
      next.push(`You spent ${pct.toFixed(0)}% more on food this week.`);
    }
    if (transportLastWeek > 0 && transportThisWeek > transportLastWeek) {
      next.push('Your transport cost increased compared to last week.');
    }
    if (topCategory) {
      next.push(`Highest spending category: ${topCategory.name} (${formatAmount(topCategory.value)}).`);
    }
    if (weekCurrent > 0 && stats.todayTotal > weekCurrent * 0.5) {
      next.push('Unusual spending detected today compared to your weekly trend.');
    }
    return next.slice(0, 4);
  }, [expenses, previousWeekStart, weekStart, today, topCategory, weekCurrent, stats.todayTotal]);

  const formatRecentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{greeting}, {user?.displayName || user?.username} 👋</h1>
          <p className="text-muted-foreground text-sm">{format(now, 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button
            variant="fintoxa"
            onClick={() => { setNow(new Date()); setRefreshTick(prev => prev + 1); }}
            className="w-full md:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => navigate('/add')} variant="fintoxa" className="w-full md:w-auto px-4">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map(kpi => (
          <Card
            key={kpi.label}
            className={`shadow-card hover:shadow-card-hover transition-shadow border ${kpi.forceTone ? kpi.tone : 'border-border dark:border-[#1A3F3A] bg-card dark:' + kpi.tone}`}
          >
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-wide text-muted-foreground">{kpi.label}</p>
                  <p className={`text-2xl font-heading font-bold mt-1 ${kpi.color}`}>
                    {kpi.isPercent
                      ? `${kpi.value}${kpi.suffix ?? ''}`
                      : (kpi.isCurrency === false ? kpi.value : formatAmount(kpi.value))}
                  </p>
                  {kpi.label === 'TOP CATEGORY' && topCategory ? (
                    <div className="mt-1">
                      <p className="text-sm font-semibold text-foreground">{topCategory.name}</p>
                      <p className="text-xs text-muted-foreground">Highest spend this month</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">{kpi.description}</p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-xl bg-black/15 flex items-center justify-center border border-[#1E4D47]">
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {budget.enabled && budget.amount > 0 && (
        <Card className={`shadow-card border ${isOverBudget ? 'border-destructive/50' : isNearBudget ? 'border-gold/50' : 'border-[#10231d]/10 dark:border-[#10231d]/30'} bg-white/60 dark:bg-[#10231d]/40 backdrop-blur-md text-foreground dark:text-white`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              {isOverBudget ? (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              ) : isNearBudget ? (
                <AlertTriangle className="w-5 h-5 text-gold" />
              ) : (
                <Wallet className="w-5 h-5 text-chart-green" />
              )}
              <h3 className="font-heading font-semibold">Monthly Budget</h3>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground font-medium">
                {formatAmount(stats.monthTotal)} of {formatAmount(budget.amount)}
              </span>
              <span className={`font-bold ${isOverBudget ? 'text-destructive' : isNearBudget ? 'text-[#b8860b] dark:text-gold' : 'text-[#2e7d32] dark:text-chart-green'}`}>
                {budgetPercent.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={budgetPercent}
              className={`h-3 ${isOverBudget ? '[&>div]:bg-destructive' : isNearBudget ? '[&>div]:bg-gold' : '[&>div]:bg-chart-green'}`}
            />
            {isOverBudget && (
              <p className="text-sm text-destructive mt-2 font-medium">
                ⚠️ You've exceeded your budget by {formatAmount(overAmount)}!
              </p>
            )}
            {isNearBudget && !isOverBudget && (
              <p className="text-sm text-gold mt-2 font-medium">
                You are close to your monthly budget limit.
              </p>
            )}
            {!isOverBudget && (
              <p className="text-sm text-muted-foreground mt-2">
                {formatAmount(budget.amount - stats.monthTotal)} remaining this month
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-heading">Daily Spending — {format(now, 'MMMM yyyy')}</CardTitle>
              <p className="text-xs text-muted-foreground">Expense trend over this month</p>
            </div>
            <div className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground">
              {format(monthStart, 'MMM d')}–{format(today, 'd')}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--chart-blue))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground" 
                    interval="preserveStartEnd" 
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    axisLine={false}
                    tickLine={false}
                    className="text-muted-foreground" 
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#172525', border: '1px solid #2a6b61', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value: number) => [formatAmount(value), 'Amount']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--chart-blue))" 
                    strokeWidth={2.5} 
                    dot={false} 
                    fillOpacity={1} 
                    fill="url(#colorAmount)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-card dark:bg-[#172525] border border-border dark:border-[#1A3F3A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Category Breakdown</CardTitle>
            <p className="text-xs text-muted-foreground">{format(now, 'MMMM yyyy')} distribution</p>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={categoryData} 
                      innerRadius={60} 
                      outerRadius={80} 
                      paddingAngle={5} 
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatAmount(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  No expenses yet
                </div>
              )}
            </div>
            <div className="space-y-2 mt-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {categoryData.map((c, i) => {
                const total = categoryData.reduce((acc, curr) => acc + curr.value, 0);
                const percent = total > 0 ? (c.value / total) * 100 : 0;
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card bg-card dark:bg-[#10231d] border border-border dark:border-[#1A3F3A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Weekly Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">Spending per week</p>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBarData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => [formatAmount(value), 'Spent']} />
                  <Bar dataKey="amount" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card bg-card dark:bg-[#10231d] border border-border dark:border-[#1A3F3A]">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-heading">Recent Transactions</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Latest expense entries</p>
              </div>
              <Link to="/reports" className="text-sm text-accent hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentExpenses.length > 0 ? (
              <div className="space-y-3">
                {recentExpenses.map(e => {
                  const meta = getCategoryMeta(e.category);
                  const Icon = meta.icon;
                  return (
                    <div key={e.id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0 hover:bg-black/5 rounded px-2 -mx-2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.softBg} border ${meta.accent.replace('text-', 'border-')}/10`}>
                          <Icon className={`w-4 h-4 ${meta.accent}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{e.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${meta.softBg} ${meta.accent}`}>
                              {e.category}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-medium">· {formatRecentDate(e.date)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="font-heading font-semibold text-destructive">
                        -{formatAmount(e.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-52 flex items-center justify-center text-muted-foreground text-sm">
                No transactions yet. Start by adding an expense!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card bg-card dark:bg-[#10231d] border border-border dark:border-[#1A3F3A]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-heading flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" /> Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length > 0 ? (
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <p key={index} className="text-sm text-muted-foreground">- {insight}</p>
              ))}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-muted/70 p-3">
                  <p className="text-xs text-muted-foreground">Weekly comparison</p>
                  <p className={`font-semibold ${weekChangePercent > 0 ? 'text-destructive' : 'text-chart-green'}`}>
                    {weekChangePercent >= 0 ? '+' : ''}{weekChangePercent.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg bg-muted/70 p-3">
                  <p className="text-xs text-muted-foreground">Monthly comparison</p>
                  <p className={`font-semibold ${monthChangePercent > 0 ? 'text-destructive' : 'text-chart-green'}`}>
                    {monthChangePercent >= 0 ? '+' : ''}{monthChangePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add a few transactions and I will generate smart insights for you.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
