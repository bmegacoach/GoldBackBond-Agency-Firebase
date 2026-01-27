import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useDataStore } from '@/hooks/useDataStore';
import { InvestmentPackageModal } from './forms/InvestmentPackageModal';

interface Package {
  id?: string;
  name: string;
  minInvestment: number;
  interestRate: number;
  duration: number;
  description?: string;
  allocation?: Record<string, number>;
  features?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export function InvestmentPackages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  // Use hybrid data store
  const dataStore = useDataStore<Package>({ collectionName: 'packages' });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await dataStore.fetchAll();
      setPackages(data);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  }

  const handleCreate = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      await dataStore.remove(id);
      loadPackages();
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingPackage?.id) {
        await dataStore.update(editingPackage.id, data);
      } else {
        await dataStore.create(data);
      }
      await loadPackages();
      setIsModalOpen(false);
    } catch (e) {
      alert('Failed to save package');
      console.error(e);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getRiskColor = (rate: number) => {
    if (rate <= 5) return 'bg-green-50 border-green-200';
    if (rate <= 6) return 'bg-blue-50 border-blue-200';
    if (rate <= 7) return 'bg-yellow-50 border-yellow-200';
    return 'bg-orange-50 border-orange-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Investment Packages</h1>
          <p className="text-gray-600 mt-2">
            Browse and manage investment offerings
            <Badge variant="warning" className="ml-2">Demo Mode</Badge>
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={handleCreate}>
          <Plus className="w-5 h-5 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No investment packages found. Create one to get started.</p>
          </div>
        )}

        {packages.map((pkg) => (
          <Card key={pkg.id} className={`border-2 ${getRiskColor(pkg.interestRate)}`}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{pkg.name}</CardTitle>
                <Badge variant="info">{pkg.interestRate}% APY</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">{pkg.description || 'No description provided.'}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Key Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded p-3 shadow-sm">
                  <p className="text-xs text-gray-600 font-medium">Min Investment</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(pkg.minInvestment)}
                  </p>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <p className="text-xs text-gray-600 font-medium">Term Length</p>
                  <p className="text-lg font-bold text-gray-900">{pkg.duration} months</p>
                </div>
                <div className="bg-white rounded p-3 shadow-sm">
                  <p className="text-xs text-gray-600 font-medium">Return Type</p>
                  <p className="text-lg font-bold text-primary-600">Fixed</p>
                </div>
              </div>

              {/* Allocation - Only show if data exists */}
              {pkg.allocation && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Asset Allocation</h4>
                  <div className="space-y-2">
                    {Object.entries(pkg.allocation).map(([asset, percentage]) => (
                      <div key={asset}>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm text-gray-700">{asset}</span>
                          <span className="text-sm font-semibold text-gray-900">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-gray-200">
                <Button variant="outline" className="flex-1" onClick={() => handleEdit(pkg)}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="danger" className="flex-1" onClick={() => pkg.id && handleDelete(pkg.id)}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <InvestmentPackageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={dataStore.loading}
        initialData={editingPackage}
      />
    </div>
  );
}
