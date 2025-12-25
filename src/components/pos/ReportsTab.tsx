import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ReportType = 'daily' | 'weekly' | 'monthly';

interface ChartData {
  label: string;
  value: number;
}

interface Stats {
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  revenueGrowth: number;
  transactionGrowth: number;
  avgOrderGrowth: number;
}

export function ReportsTab() {
  const [activeReport, setActiveReport] = useState<ReportType>('daily');
  const [dailyData, setDailyData] = useState<ChartData[]>([]);
  const [weeklyData, setWeeklyData] = useState<ChartData[]>([]);
  const [monthlyData, setMonthlyData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    transactionGrowth: 0,
    avgOrderGrowth: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchDailyData(),
        fetchWeeklyData(),
        fetchMonthlyData(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load reports');
    }
    setLoading(false);
  };

  const fetchDailyData = async () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1);

    const dailySales: ChartData[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      const { data } = await supabase
        .from('bills')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`);

      const total = data?.reduce((sum, bill) => sum + Number(bill.total), 0) || 0;
      dailySales.push({ label: days[i], value: total });
    }

    setDailyData(dailySales);
  };

  const fetchWeeklyData = async () => {
    const weeklySales: ChartData[] = [];
    const today = new Date();

    for (let i = 3; i >= 0; i--) {
      const endDate = new Date(today);
      endDate.setDate(today.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 7);

      const { data } = await supabase
        .from('bills')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());

      const total = data?.reduce((sum, bill) => sum + Number(bill.total), 0) || 0;
      weeklySales.push({ label: `Week ${4 - i}`, value: total });
    }

    setWeeklyData(weeklySales);
  };

  const fetchMonthlyData = async () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySales: ChartData[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

      const { data } = await supabase
        .from('bills')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', month.toISOString())
        .lt('created_at', nextMonth.toISOString());

      const total = data?.reduce((sum, bill) => sum + Number(bill.total), 0) || 0;
      monthlySales.push({ label: months[month.getMonth()], value: total });
    }

    setMonthlyData(monthlySales);
  };

  const fetchStats = async () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(today.getDate() - 60);

    const { data: currentPeriod } = await supabase
      .from('bills')
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { data: previousPeriod } = await supabase
      .from('bills')
      .select('total')
      .eq('status', 'completed')
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const currentRevenue = currentPeriod?.reduce((sum, bill) => sum + Number(bill.total), 0) || 0;
    const currentTransactions = currentPeriod?.length || 0;
    const currentAvgOrder = currentTransactions > 0 ? currentRevenue / currentTransactions : 0;

    const previousRevenue = previousPeriod?.reduce((sum, bill) => sum + Number(bill.total), 0) || 0;
    const previousTransactions = previousPeriod?.length || 0;
    const previousAvgOrder = previousTransactions > 0 ? previousRevenue / previousTransactions : 0;

    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
    const transactionGrowth = previousTransactions > 0
      ? ((currentTransactions - previousTransactions) / previousTransactions) * 100
      : 0;
    const avgOrderGrowth = previousAvgOrder > 0
      ? ((currentAvgOrder - previousAvgOrder) / previousAvgOrder) * 100
      : 0;

    setStats({
      totalRevenue: currentRevenue,
      totalTransactions: currentTransactions,
      averageOrderValue: currentAvgOrder,
      revenueGrowth,
      transactionGrowth,
      avgOrderGrowth,
    });
  };

  const reportData = {
    daily: dailyData,
    weekly: weeklyData,
    monthly: monthlyData,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-card rounded-lg border border-border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground uppercase">
              {activeReport === 'daily' && 'Daily Sales'}
              {activeReport === 'weekly' && 'Weekly Comparison'}
              {activeReport === 'monthly' && 'Monthly Trend'}
            </h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData[activeReport]}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (activeReport === 'monthly') {
                      return `${(value / 1000000).toFixed(1)}M`;
                    }
                    return `${(value / 1000).toFixed(0)}k`;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Sales']}
                />
                <Bar
                  dataKey="value"
                  fill={
                    activeReport === 'daily' ? 'hsl(var(--chart-2))' :
                      activeReport === 'weekly' ? 'hsl(var(--chart-1))' :
                        'hsl(var(--chart-4))'
                  }
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground uppercase">Total Revenue</p>
            <p className={cn(
              "text-3xl font-bold",
              stats.revenueGrowth >= 0 ? "text-success" : "text-destructive"
            )}>
              {stats.revenueGrowth >= 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Rs. {stats.totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground uppercase">Total Transactions</p>
            <p className={cn(
              "text-3xl font-bold",
              stats.transactionGrowth >= 0 ? "text-info" : "text-destructive"
            )}>
              {stats.transactionGrowth >= 0 ? '+' : ''}{stats.transactionGrowth.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {stats.totalTransactions} transactions
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground uppercase">Average Order Value</p>
            <p className={cn(
              "text-3xl font-bold",
              stats.avgOrderGrowth >= 0 ? "text-warning" : "text-destructive"
            )}>
              {stats.avgOrderGrowth >= 0 ? '+' : ''}{stats.avgOrderGrowth.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Rs. {stats.averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-foreground uppercase mb-4">Weekly Comparison</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Sales']}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-foreground uppercase mb-4">Monthly Trend</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Sales']}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {(['daily', 'weekly', 'monthly'] as ReportType[]).map((type) => (
          <Button
            key={type}
            variant={activeReport === type ? 'default' : 'outline'}
            onClick={() => setActiveReport(type)}
            className={cn(
              activeReport === type && 'bg-primary text-primary-foreground'
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} Report
          </Button>
        ))}
      </div>
    </div>
  );
}
