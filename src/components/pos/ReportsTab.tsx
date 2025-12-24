import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { dailySalesData, weeklySalesData, monthlySalesData } from '@/data/mockData';
import { cn } from '@/lib/utils';

type ReportType = 'daily' | 'weekly' | 'monthly';

export function ReportsTab() {
  const [activeReport, setActiveReport] = useState<ReportType>('daily');

  const reportData = {
    daily: dailySalesData,
    weekly: weeklySalesData,
    monthly: monthlySalesData,
  };

  const calculateStats = (data: typeof dailySalesData) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const average = total / data.length;
    const highest = Math.max(...data.map(d => d.value));
    return { total, average, highest };
  };

  const stats = calculateStats(reportData[activeReport]);

  return (
    <div className="p-6 bg-background min-h-full">
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Chart Cards */}
        <div className="col-span-2 bg-card rounded-lg border border-border p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-foreground uppercase">
              {activeReport === 'daily' && 'Daily Sales'}
              {activeReport === 'weekly' && 'Weekly Sales'}
              {activeReport === 'monthly' && 'Monthly Sales'}
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
                <Bar 
                  dataKey="value" 
                  fill="hsl(var(--chart-2))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="space-y-4">
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground uppercase">Total Revenue</p>
            <p className="text-3xl font-bold text-success">
              {((stats.total / 1000000) * 100).toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              Rs. {stats.total.toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground uppercase">Total Transactions</p>
            <p className="text-3xl font-bold text-info">200.8%</p>
            <p className="text-sm text-muted-foreground">Growth from last period</p>
          </div>
          <div className="bg-card rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground uppercase">Average Order Value</p>
            <p className="text-3xl font-bold text-warning">288.3%</p>
            <p className="text-sm text-muted-foreground">
              Rs. {stats.average.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="font-semibold text-foreground uppercase mb-4">Weekly Comparison</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
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
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
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
