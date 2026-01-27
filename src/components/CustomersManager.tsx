import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { Plus, Search, Trash2, Edit2 } from 'lucide-react';
import { CustomerFormModal } from './forms/CustomerFormModal';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';

interface Customer {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'suspended' | 'churned';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  initialInvestment?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export function CustomersManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [tierFilter, setTierFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const firebase = useFirebaseForm<Customer>({ collectionName: 'customers' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await firebase.fetchAll();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingCustomer?.id) {
        await firebase.update(editingCustomer.id, formData);
        setCustomers(customers.map((c) => (c.id === editingCustomer.id ? { ...c, ...formData } : c)));
      } else {
        const newCustomer = await firebase.create(formData);
        setCustomers([...customers, newCustomer]);
      }
      setEditingCustomer(null);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await firebase.remove(id);
        setCustomers(customers.filter((c) => c.id !== id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleNewCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = customer.status === statusFilter;
    const matchesTier = tierFilter === 'all' || customer.tier === tierFilter;
    return matchesSearch && matchesStatus && matchesTier;
  });

  const tierColors = {
    bronze: 'bg-orange-100 text-orange-800',
    silver: 'bg-gray-100 text-gray-800',
    gold: 'bg-yellow-100 text-yellow-800',
    platinum: 'bg-blue-100 text-blue-800',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalInvested = customers.reduce((sum, c) => sum + (c.initialInvestment || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">Manage customer accounts and portfolios</p>
        </div>
        <Button variant="primary" size="lg" onClick={handleNewCustomer}>
          <Plus className="w-5 h-5 mr-2" />
          New Customer
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent>
            <p className="text-gray-600 text-sm font-medium">Total Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{customers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-600 text-sm font-medium">Total Invested</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {formatCurrency(totalInvested)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-600 text-sm font-medium">Active Customers</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {customers.filter((c) => c.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-gray-600 text-sm font-medium">Avg. Portfolio</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {customers.length > 0 ? formatCurrency(totalInvested / customers.length) : '$0'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 md:col-span-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'suspended', label: 'Suspended' },
                { value: 'churned', label: 'Churned' },
              ]}
            />
            <Select
              label="Tier"
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Tiers' },
                { value: 'bronze', label: 'Bronze' },
                { value: 'silver', label: 'Silver' },
                { value: 'gold', label: 'Gold' },
                { value: 'platinum', label: 'Platinum' },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Grid */}
      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No customers found. Create your first customer!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-all">
              <CardContent>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {customer.firstName} {customer.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{customer.company || '-'}</p>
                  </div>
                  <Badge className={tierColors[customer.tier]}>
                    {customer.tier.charAt(0).toUpperCase() + customer.tier.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm font-semibold text-gray-900">{customer.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Investment</p>
                    <p className="text-lg font-bold text-green-600">
                      {formatCurrency(customer.initialInvestment || 0)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => customer.id && handleDelete(customer.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        onSubmit={handleSubmit}
        loading={firebase.loading}
        initialData={editingCustomer}
      />
    </div>
  );
}
