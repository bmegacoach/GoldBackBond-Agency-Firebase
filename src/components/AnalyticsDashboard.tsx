import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Select } from './ui/Select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const leadTrendData = [
  { month: 'Jan', leads: 45, conversions: 12 },
  { month: 'Feb', leads: 52, conversions: 15 },
  { month: 'Mar', leads: 48, conversions: 14 },
  { month: 'Apr', leads: 61, conversions: 18 },
  { month: 'May', leads: 55, conversions: 16 },
  { month: 'Jun', leads: 67, conversions: 20 },
];

const revenueTrendData = [
  { month: 'Jan', revenue: 125000 },
  { month: 'Feb', revenue: 145000 },
  { month: 'Mar', revenue: 138000 },
  { month: 'Apr', revenue: 162000 },
  { month: 'May', revenue: 155000 },
  { month: 'Jun', revenue: 185000 },
];

const sourceData = [
  { name: 'Website', value: 35, fill: '#f4b633' },
  { name: 'Referral', value: 28, fill: '#0ea5e9' },
  { name: 'Import', value: 22, fill: '#10b981' },
  { name: 'Cold Call', value: 15, fill: '#f59e0b' },
];

const statusData = [
  { status: 'New', count: 45 },
  { status: 'Contacted', count: 38 },
  { status: 'Qualified', count: 52 },
  { status: 'Converted', count: 28 },
  { status: 'Lost', count: 12 },
];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30days');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Business intelligence and reporting</p>
        </div>
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          options={[
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: '90days', label: 'Last 90 Days' },
            { value: 'year', label: 'This Year' },
            { value: 'all', label: 'All Time' },
          ]}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">New Leads</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">45</p>
            <p className="text-sm text-green-600 mt-1">↑ 12% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">22%</p>
            <p className="text-sm text-green-600 mt-1">↑ 2.5% improvement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Avg Deal Size</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(75000)}</p>
            <p className="text-sm text-red-600 mt-1">↓ 5% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Pipeline Value</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(2100000)}</p>
            <p className="text-sm text-green-600 mt-1">↑ 8% growth</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={leadTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#f4b633"
                  name="Leads"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="conversions"
                  stroke="#0ea5e9"
                  name="Conversions"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  name="Revenue"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Source */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Source Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Lead Status */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#f4b633" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Lead Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">2.3 hours</p>
            <p className="text-sm text-gray-600 mt-2">Average time to first contact</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Retention Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">89%</p>
            <p className="text-sm text-green-600 mt-2">↑ 3% improvement YoY</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Customer Lifetime Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(285000)}</p>
            <p className="text-sm text-gray-600 mt-2">Across all customer tiers</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
