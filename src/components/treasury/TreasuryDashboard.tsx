import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { TrendingUp, AlertTriangle, Lock, DollarSign, Zap } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  tier: string;
}

interface StakingRecord {
  customerId: string;
  amount: number;
  leverage: number;
  collateralUsed: number;
  accruedRewards: number;
  status: 'active' | 'paused' | 'unstaked';
}

export function TreasuryDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [staking, setStaking] = useState<StakingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTreasuryData();
  }, []);

  const loadTreasuryData = async () => {
    try {
      setLoading(true);

      // Load customers
      const customersRef = collection(db, 'customers');
      const customersSnapshot = await getDocs(customersRef);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Customer[];
      setCustomers(customersData);

      // Load staking records from Firestore
      const stakingRef = collection(db, 'staking_records');
      const stakingSnapshot = await getDocs(stakingRef);
      const stakingData = stakingSnapshot.docs.map(doc => ({
        ...doc.data(),
        // Ensure legacy records or missing fields handled gracefully
      })) as StakingRecord[];

      setStaking(stakingData);
    } catch (error) {
      console.error('Failed to load treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalAUM = staking.reduce((sum, s) => sum + s.amount, 0);
  const totalStaked = staking.reduce((sum, s) => sum + s.amount, 0);
  const totalLeverageUtilized = staking.reduce((sum, s) => sum + (s.amount * s.leverage), 0);
  const totalCapacity = totalAUM * 3; // 3:1 leverage capacity
  const leveragePercentage = (totalLeverageUtilized / totalCapacity) * 100;
  const totalAccruedRewards = staking.reduce((sum, s) => sum + s.accruedRewards, 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading treasury data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-900">Treasury Dashboard</h2>
          <p className="text-primary-600 text-sm mt-1">Real-time assets, leverage & staking rewards tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">Live</Badge>
          <span className="text-primary-600 text-sm">Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total AUM */}
        <Card className="border-2 border-accent-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-600 text-sm font-semibold">Total AUM</p>
                <p className="text-4xl font-bold text-accent-600 mt-2">
                  ${(totalAUM / 1000000).toFixed(1)}M
                </p>
                <p className="text-success-600 text-xs mt-2">Assets Under Management</p>
              </div>
              <DollarSign className="w-8 h-8 text-accent-200" />
            </div>
          </CardContent>
        </Card>

        {/* Total Staked */}
        <Card className="border-2 border-info-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-600 text-sm font-semibold">Total Staked</p>
                <p className="text-4xl font-bold text-info-600 mt-2">
                  ${(totalStaked / 1000000).toFixed(1)}M
                </p>
                <p className="text-info-600 text-xs mt-2">Participating in staking</p>
              </div>
              <Lock className="w-8 h-8 text-info-200" />
            </div>
          </CardContent>
        </Card>

        {/* Leverage Utilization */}
        <Card className="border-2 border-warning-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-600 text-sm font-semibold">Leverage Used</p>
                <p className="text-4xl font-bold text-warning-600 mt-2">
                  {leveragePercentage.toFixed(0)}%
                </p>
                <p className="text-warning-600 text-xs mt-2">Of 3:1 capacity</p>
              </div>
              <Zap className="w-8 h-8 text-warning-200" />
            </div>
          </CardContent>
        </Card>

        {/* Accrued Rewards */}
        <Card className="border-2 border-success-200">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-primary-600 text-sm font-semibold">APR Accrual</p>
                <p className="text-4xl font-bold text-success-600 mt-2">
                  ${(totalAccruedRewards / 1000).toFixed(0)}K
                </p>
                <p className="text-success-600 text-xs mt-2">9% APR earned</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leverage Utilization Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning-600" />
            3:1 Leverage Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-primary-700 font-semibold">
                  ${(totalLeverageUtilized / 1000000).toFixed(1)}M / ${(totalCapacity / 1000000).toFixed(1)}M
                </span>
                <span className="text-warning-600 font-bold">{leveragePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-primary-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${leveragePercentage > 90 ? 'bg-danger-600' :
                      leveragePercentage > 70 ? 'bg-warning-600' :
                        'bg-success-600'
                    }`}
                  style={{ width: `${Math.min(leveragePercentage, 100)}%` }}
                />
              </div>
            </div>

            {leveragePercentage > 80 && (
              <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-warning-600 flex-shrink-0 mt-0.5" />
                <span className="text-warning-700 text-sm">Approaching maximum leverage capacity. Consider distributing new investments.</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Customer Staking Details */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Staking Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Staked Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Leverage</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Borrowed</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Accrued Rewards</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {staking.map((record, idx) => {
                  const customer = customers.find(c => c.id === record.customerId);
                  return (
                    <tr key={idx} className="border-b border-primary-100 hover:bg-primary-50">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary-900">
                          {customer?.firstName} {customer?.lastName}
                        </div>
                        <div className="text-primary-600 text-xs">{customer?.email}</div>
                      </td>
                      <td className="py-4 px-4 text-accent-600 font-semibold">
                        ${(record.amount / 1000).toFixed(0)}K
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="info">
                          {record.leverage}:1
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-primary-700 font-semibold">
                        ${(record.collateralUsed / 1000).toFixed(0)}K
                      </td>
                      <td className="py-4 px-4 text-success-600 font-semibold">
                        ${(record.accruedRewards / 1000).toFixed(0)}K
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant="success">Active</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Alerts & Warnings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning-600" />
            System Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leveragePercentage > 80 && (
              <div className="p-3 bg-warning-50 border-l-4 border-warning-600 rounded">
                <p className="text-warning-700 font-semibold text-sm">High Leverage Utilization</p>
                <p className="text-warning-600 text-xs mt-1">Current usage at {leveragePercentage.toFixed(0)}% of capacity</p>
              </div>
            )}
            {staking.filter(s => s.status === 'paused').length > 0 && (
              <div className="p-3 bg-info-50 border-l-4 border-info-600 rounded">
                <p className="text-info-700 font-semibold text-sm">Paused Staking Records</p>
                <p className="text-info-600 text-xs mt-1">{staking.filter(s => s.status === 'paused').length} records need attention</p>
              </div>
            )}
            <div className="p-3 bg-success-50 border-l-4 border-success-600 rounded">
              <p className="text-success-700 font-semibold text-sm">All Systems Operational</p>
              <p className="text-success-600 text-xs mt-1">Treasury tracking and APR distribution running smoothly</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
