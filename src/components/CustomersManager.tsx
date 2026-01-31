import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { Plus, Search, Trash2, Edit2, Settings, Download, Upload, X } from 'lucide-react';
import { CustomerFormModal } from './forms/CustomerFormModal';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';
import { useAuth } from '@/lib/firebase/auth-context';
import { useSchema, DynamicColumn } from '@/hooks/useSchema';
import { CSVService, CSVColumn } from '@/utils/CSVService';

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
  [key: string]: any;
}

export function CustomersManager() {
  const { isPaid } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [tierFilter, setTierFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Column State
  const [showColumnCreator, setShowColumnCreator] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DynamicColumn['type']>('text');

  // CSV Import/Export State
  const [isImporting, setIsImporting] = useState(false);

  const firebase = useFirebaseForm<Customer>({ collectionName: 'customers' });
  const schema = useSchema({ collectionName: 'customers' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await firebase.fetchAll();
      setCustomers(data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      setError(null);
      if (editingCustomer?.id) {
        await firebase.update(editingCustomer.id, formData);
        setCustomers(customers.map((c) => (c.id === editingCustomer.id ? { ...c, ...formData } : c)));
      } else {
        const newCustomer = await firebase.create(formData);
        setCustomers([...customers, newCustomer]);
      }
      setEditingCustomer(null);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Form submission failed:', err);
      setError('Failed to save customer');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await firebase.remove(id);
        setCustomers(customers.filter((c) => c.id !== id));
      } catch (err) {
        console.error('Delete failed:', err);
        setError('Failed to delete customer');
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

  // Schema management with validation
  const handleAddColumn = () => {
    if (!newColName.trim()) return;

    // Check for duplicates
    const exists = schema.columns.some(col => col.label.toLowerCase() === newColName.trim().toLowerCase());
    if (exists) {
      setError('A column with this name already exists');
      return;
    }

    // Check for reserved field names
    const reserved = ['id', 'firstName', 'lastName', 'email', 'phone', 'company', 'status', 'tier', 'initialInvestment', 'createdAt', 'updatedAt'];
    if (reserved.includes(newColName.trim())) {
      setError('This field name is reserved');
      return;
    }

    schema.addColumn({
      label: newColName,
      type: newColType,
    });
    setNewColName('');
    setShowColumnCreator(false);
    setError(null);
  };

  const handleRemoveColumn = (id: string) => {
    if (window.confirm('Remove this column?')) {
      schema.removeColumn(id);
    }
  };

  const getExportColumns = (): CSVColumn[] => {
    const baseCols: CSVColumn[] = [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'status', label: 'Status' },
      { key: 'tier', label: 'Tier' },
      { key: 'initialInvestment', label: 'Initial Investment' },
    ];

    const dynamicCols = schema.columns.map(col => ({
      key: col.key,
      label: col.label,
      isDynamic: true
    }));

    return [...baseCols, ...dynamicCols];
  };

  const handleExport = () => {
    CSVService.exportData(filteredCustomers, getExportColumns(), `customers_export_${Date.now()}`);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      const importedData = await CSVService.importData(file, getExportColumns());

      let successCount = 0;
      for (const item of importedData) {
        try {
          if (!item.firstName || !item.lastName || !item.email) continue;

          const newCustomerData: any = {
            ...item,
            status: item.status || 'active',
            tier: item.tier || 'bronze',
            initialInvestment: Number(item.initialInvestment) || 0,
          };

          await firebase.create(newCustomerData);
          successCount++;
        } catch (err) {
          console.error('Failed to import customer:', item, err);
        }
      }

      alert(`Successfully imported ${successCount} customers.`);
      const updated = await firebase.fetchAll();
      setCustomers(updated);
    } catch (err: any) {
      setError('Failed to import CSV file. Error: ' + err.message);
    } finally {
      setIsImporting(false);
      if (event.target) event.target.value = '';
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const firstName = customer.firstName || '';
    const lastName = customer.lastName || '';
    const email = customer.email || '';

    const matchesSearch =
      firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-2">
            Manage customer accounts and portfolios
            {!isPaid && (
              <Badge variant="warning" className="ml-2">Demo Mode (Local Storage)</Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="file"
            id="csv-import-customers"
            className="hidden"
            accept=".csv"
            onChange={handleImport}
          />
          <Button variant="outline" onClick={() => document.getElementById('csv-import-customers')?.click()} disabled={isImporting}>
            <Upload className="w-4 h-4 mr-2" />
            {isImporting ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowColumnCreator(!showColumnCreator)}>
            <Settings className="w-4 h-4 mr-2" />
            {showColumnCreator ? 'Cancel' : 'Customize Columns'}
          </Button>
          <Button variant="primary" size="lg" onClick={handleNewCustomer}>
            <Plus className="w-5 h-5 mr-2" />
            New Customer
          </Button>
        </div>
      </div>

      {error && (
        <Badge variant="error" className="w-full text-center py-2">
          {error}
        </Badge>
      )}

      {/* Column Creator & Existing Dynamic Columns List */}
      {(showColumnCreator || schema.columns.length > 0) && (
        <div className="space-y-4">
          {showColumnCreator && (
            <Card className="bg-gray-50 border-dashed">
              <CardContent className="py-4 flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-1 block">Column Name</label>
                  <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="e.g. Birthday, Region..." />
                </div>
                <div className="w-48">
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <Select
                    options={[
                      { label: 'Text', value: 'text' },
                      { label: 'Number', value: 'number' },
                      { label: 'Date', value: 'date' },
                      { label: 'Email', value: 'email' },
                      { label: 'Phone', value: 'phone' },
                    ]}
                    value={newColType}
                    onChange={(e) => setNewColType(e.target.value as any)}
                  />
                </div>
                <Button onClick={handleAddColumn} disabled={!newColName}>
                  <Plus className="w-4 h-4 mr-2" /> Add Field
                </Button>
              </CardContent>
            </Card>
          )}

          {schema.columns.length > 0 && showColumnCreator && (
            <div className="flex flex-wrap gap-2">
              {schema.columns.map(col => (
                <Badge key={col.id} variant="default" className="pl-3 pr-1 py-1 flex items-center gap-2">
                  {col.label}
                  <button
                    onClick={() => handleRemoveColumn(col.id)}
                    className="hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

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
                  <Badge className={tierColors[customer.tier as keyof typeof tierColors]}>
                    {customer.tier?.charAt(0).toUpperCase() + customer.tier?.slice(1)}
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

                  {/* Dynamic Fields Display */}
                  {schema.columns.map(col => (
                    customer[col.key] && (
                      <div key={col.id}>
                        <p className="text-xs text-gray-600">{col.label}</p>
                        <p className="text-sm font-semibold text-gray-900">{customer[col.key]}</p>
                      </div>
                    )
                  ))}
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
        dynamicColumns={schema.columns}
      />
    </div>
  );
}
