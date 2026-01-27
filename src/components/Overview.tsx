import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import {
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { useDataStore } from '@/hooks/useDataStore';
import { useNavigate } from 'react-router-dom';

// Real-time metric component
function MetricCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  iconColor = 'blue',
  onClick
}: {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: any;
  iconColor?: string;
  onClick?: () => void;
}) {
  const iconColors = {
    blue: 'bg-blue-500/10 text-blue-600',
    green: 'bg-green-500/10 text-green-600',
    purple: 'bg-purple-500/10 text-purple-600',
    orange: 'bg-orange-500/10 text-orange-600',
    red: 'bg-red-500/10 text-red-600',
    gold: 'bg-yellow-500/10 text-yellow-600'
  };

  const changeColors = {
    positive: 'text-green-600 bg-green-500/10',
    negative: 'text-red-600 bg-red-500/10',
    neutral: 'text-gray-600 bg-gray-500/10'
  };

  const ChangeIcon = changeType === 'positive' ? ArrowUpRight :
                   changeType === 'negative' ? ArrowDownRight :
                   ArrowUpRight;

  return (
    <Card
      className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-50 opacity-100 group-hover:opacity-95 transition-opacity" />
      
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-400 to-gold-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <CardContent className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-xl ${iconColors[iconColor as keyof typeof iconColors]}`}>
            <Icon className="w-6 h-6" />
          </div>
          
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${changeColors[changeType]}`}>
              <ChangeIcon className="w-3 h-3" />
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <p className="text-gray-500 text-sm font-medium tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 font-sans">{value}</p>
        </div>
        
        {/* Hover indicator */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Zap className="w-4 h-4 text-gold-500" />
        </div>
      </CardContent>
    </Card>
  );
}

// Activity item component
function ActivityItem({
  type,
  title,
  description,
  time,
  status = 'completed'
}: {
  type: 'lead' | 'customer' | 'payment' | 'ticket';
  title: string;
  description: string;
  time: string;
  status?: 'completed' | 'pending' | 'failed';
}) {
  const icons = {
    lead: Target,
    customer: Users,
    payment: DollarSign,
    ticket: Activity
  };

  const iconColors = {
    lead: 'bg-blue-500/10 text-blue-600',
    customer: 'bg-green-500/10 text-green-600',
    payment: 'bg-purple-500/10 text-purple-600',
    ticket: 'bg-orange-500/10 text-orange-600'
  };

  const statusColors = {
    completed: 'text-green-600',
    pending: 'text-yellow-600',
    failed: 'text-red-600'
  };

  const Icon = icons[type];

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors group">
      <div className={`p-2 rounded-lg ${iconColors[type]}`}>
        <Icon className="w-4 h-4" />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate group-hover:text-gold-600 transition-colors">
          {title}
        </p>
        <p className="text-sm text-gray-500 truncate">{description}</p>
      </div>
      
      <div className="flex items-center gap-2 shrink-0">
        <Clock className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-500">{time}</span>
        <span className={`text-xs ${statusColors[status]}`}>
          {status === 'completed' ? '✓' : status === 'pending' ? '⏳' : '✗'}
        </span>
      </div>
    </div>
  );
}

// Quick action button
function QuickActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'primary'
}: {
  icon: any;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success';
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-gold-500 to-gold-600 text-white hover:from-gold-600 hover:to-gold-700',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    success: 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
  };

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-md group ${variants[variant]}`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" />
        <span>{label}</span>
      </div>
      <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export function Overview() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    activeCustomers: 0,
    pipelineValue: 0,
    conversionRate: 0,
    leadsChange: 0,
    customersChange: 0,
    pipelineChange: 0,
    conversionChange: 0
  });

  const dataStore = useDataStore<any>({ collectionName: 'leads' });
  const customersStore = useDataStore<any>({ collectionName: 'customers' });

  // Load real metrics
  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const leads = await dataStore.fetchAll();
        const customers = await customersStore.fetchAll();
        
        // Calculate metrics
        const totalLeads = leads.length;
        const activeCustomers = customers.filter((c: any) => c.status === 'active').length;
        const pipelineValue = leads.reduce((sum: number, lead: any) => sum + (lead.estimatedValue || 0), 0);
        const convertedLeads = leads.filter((l: any) => l.status === 'converted').length;
        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        // Calculate changes (mock data for demo)
        const leadsChange = Math.floor(Math.random() * 30) - 5; // -5% to +25%
        const customersChange = Math.floor(Math.random() * 20) - 2; // -2% to +18%
        const pipelineChange = Math.floor(Math.random() * 40) - 10; // -10% to +30%
        const conversionChange = Math.floor(Math.random() * 15) - 7; // -7% to +8%

        setMetrics({
          totalLeads,
          activeCustomers,
          pipelineValue,
          conversionRate: Math.round(conversionRate * 10) / 10,
          leadsChange,
          customersChange,
          pipelineChange,
          conversionChange
        });
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMetrics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-500 border-t-gold-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            GoldBackBond Agency
          </h1>
          <p className="text-gray-600 mt-2 text-lg">
            Premium CRM & Investment Management Platform
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-green-700">Live Data</span>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">Just now</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads.toLocaleString()}
          change={metrics.leadsChange}
          changeType={metrics.leadsChange >= 0 ? 'positive' : 'negative'}
          icon={BarChart3}
          iconColor="gold"
          onClick={() => navigate('/dashboard/leads')}
        />

        <MetricCard
          title="Active Investors"
          value={metrics.activeCustomers.toLocaleString()}
          change={metrics.customersChange}
          changeType={metrics.customersChange >= 0 ? 'positive' : 'negative'}
          icon={Users}
          iconColor="green"
          onClick={() => navigate('/dashboard/customers')}
        />

        <MetricCard
          title="Portfolio Value"
          value={`$${(metrics.pipelineValue / 1000000).toFixed(1)}M`}
          change={metrics.pipelineChange}
          changeType={metrics.pipelineChange >= 0 ? 'positive' : 'negative'}
          icon={DollarSign}
          iconColor="purple"
          onClick={() => navigate('/dashboard/treasury')}
        />

        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change={metrics.conversionChange}
          changeType={metrics.conversionChange >= 0 ? 'positive' : 'negative'}
          icon={TrendingUp}
          iconColor="blue"
          onClick={() => navigate('/dashboard/analytics')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Feed */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/analytics')}
                className="text-gold-600 hover:text-gold-700 hover:bg-gold-50"
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              <ActivityItem
                type="lead"
                title="New High-Value Lead Created"
                description="Sarah Johnson - $50K investment interest"
                time="2m ago"
                status="completed"
              />
              <ActivityItem
                type="customer"
                title="Customer Onboarding Completed"
                description="Michael Chen - Portfolio activated"
                time="15m ago"
                status="completed"
              />
              <ActivityItem
                type="payment"
                title="Payment Received"
                description="$10,000 deposit from Enterprise Corp"
                time="1h ago"
                status="completed"
              />
              <ActivityItem
                type="ticket"
                title="Support Ticket Resolved"
                description="Investment withdrawal inquiry"
                time="3h ago"
                status="completed"
              />
              <ActivityItem
                type="lead"
                title="Lead Status Updated"
                description="Robert Smith moved to Qualified"
                time="5h ago"
                status="pending"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton
                icon={Target}
                label="Create New Lead"
                onClick={() => navigate('/dashboard/leads')}
                variant="primary"
              />
              <QuickActionButton
                icon={Users}
                label="Add Investor"
                onClick={() => navigate('/dashboard/customers')}
                variant="secondary"
              />
              <QuickActionButton
                icon={DollarSign}
                label="Record Payment"
                onClick={() => navigate('/dashboard/payments')}
                variant="secondary"
              />
              <QuickActionButton
                icon={Activity}
                label="Create Workflow"
                onClick={() => navigate('/dashboard/workflows')}
                variant="secondary"
              />
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card className="bg-gradient-to-br from-gold-50 to-yellow-50 border-gold-200">
            <CardHeader>
              <CardTitle className="text-gold-900">Today's Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gold-700">New Leads</span>
                <span className="text-lg font-bold text-gold-900">+12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gold-700">Conversions</span>
                <span className="text-lg font-bold text-gold-900">+3</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gold-700">Revenue</span>
                <span className="text-lg font-bold text-gold-900">+$45K</span>
              </div>
              <div className="pt-3 border-t border-gold-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gold-700">Active Deals</span>
                  <Badge variant="success" className="bg-gold-500 text-white">
                    8 Pending
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Insights Banner */}
      <Card className="bg-gradient-to-r from-gold-500 via-yellow-500 to-gold-600 border-0 shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">GoldBackBond Advantage</h3>
                <p className="text-white/90 text-sm mt-1">
                  3:1 leverage on staked tokens • 9% APR rewards • Enterprise-grade security
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              className="bg-white text-gold-600 hover:bg-gray-100"
              onClick={() => navigate('/dashboard/packages')}
            >
              View Investment Packages
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
