import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Plus, Download, Edit2, Settings } from 'lucide-react';
import { PaymentFormModal } from './forms/PaymentFormModal';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';
import { useSchema, DynamicColumn } from '@/hooks/useSchema';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface Payment {
  id?: string;
  customerId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'interest' | 'fee';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any; // Index signature for dynamic fields
}

export function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  // ...existing code...

  // Dynamic Column State
  const [showColumnCreator, setShowColumnCreator] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DynamicColumn['type']>('text');

  const firebase = useFirebaseForm<Payment>({ collectionName: 'payments' });
  const schema = useSchema({ collectionName: 'payments' });

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const data = await firebase.fetchAll();
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingPayment?.id) {
        await firebase.update(editingPayment.id, formData);
        setPayments(payments.map((p) => (p.id === editingPayment.id ? { ...p, ...formData } : p)));
      } else {
        const newPayment = await firebase.create(formData);
        setPayments([...payments, newPayment]);
      }
      setEditingPayment(null);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await firebase.remove(id);
        setPayments(payments.filter((p) => p.id !== id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleEdit = (payment: Payment) => {
    setEditingPayment(payment);
    setIsModalOpen(true);
  };

  const handleNewPayment = () => {
    setEditingPayment(null);
    setIsModalOpen(true);
  };

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = payments
    .filter((p) => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Schema management with validation
  const handleAddColumn = () => {
    if (!newColName.trim()) {
      // ...existing code...
      return;
    }
    
    // Check for duplicates
    const exists = schema.columns.some(col => col.label.toLowerCase() === newColName.trim().toLowerCase());
    if (exists) {
      // ...existing code...
      return;
    }
    
    // Check for reserved field names
    const reserved = ['id', 'customerId', 'amount', 'type', 'status', 'description', 'createdAt', 'updatedAt'];
    if (reserved.includes(newColName.trim())) {
      // ...existing code...
      return;
    }
    
    schema.addColumn({
      label: newColName,
      type: newColType,
    });
    setNewColName('');
    setShowColumnCreator(false);
    // ...existing code...
  };

  // ...existing code...

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">Manage transactions and financial tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowColumnCreator(!showColumnCreator)}>
            <Settings className="w-4 h-4 mr-2" />
            {showColumnCreator ? 'Cancel' : 'Customize Columns'}
          </Button>
          <Button variant="primary" size="lg" onClick={handleNewPayment}>
            <Plus className="w-5 h-5 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Column Creator UI */}
      {showColumnCreator && (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-4 flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Column Name</label>
              <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="e.g. Reference, Category..." />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Pending</p>
            <p className="text-3xl font-bold text-yellow-600 mt-2">{formatCurrency(pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Total Transactions</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Transactions ({payments.length})</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No payments yet. Create your first payment!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Description</th>
                    {/* Dynamic Column Headers */}
                    {schema.columns.map(col => (
                      <th key={col.id} className="text-left py-3 px-4 font-semibold text-gray-700">
                        {col.label}
                        <button
                          // ...existing code...
                          className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          title="Remove column"
                        >
                          ×
                        </button>
                      </th>
                    ))}
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-700">{payment.customerId}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize px-2 py-1 bg-gray-100 rounded text-sm">
                          {payment.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusBadgeVariant(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">{payment.description || '-'}</td>
                      {/* Dynamic Column Data */}
                      {schema.columns.map(col => (
                        <td key={col.id} className="py-3 px-4 text-gray-600 text-sm">
                          {payment[col.key] || '-'}
                        </td>
                      ))}
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleEdit(payment)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => payment.id && handleDelete(payment.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPayment(null);
        }}
        onSubmit={handleSubmit}
        loading={firebase.loading}
        initialData={editingPayment}
        schema={schema}
      />
    </div>
  );
}
