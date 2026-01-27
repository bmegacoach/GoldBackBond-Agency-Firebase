import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Plus, Download, Trash2, Edit2 } from 'lucide-react';
import { PaymentFormModal } from './forms/PaymentFormModal';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';

interface Payment {
  id?: string;
  customerId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'interest' | 'fee';
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export function PaymentsManager() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const firebase = useFirebaseForm<Payment>({ collectionName: 'payments' });

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-2">Manage transactions and financial tracking</p>
        </div>
        <Button variant="primary" size="lg" onClick={handleNewPayment}>
          <Plus className="w-5 h-5 mr-2" />
          New Payment
        </Button>
      </div>

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
                            <Trash2 className="w-4 h-4 text-red-600" />
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
      />
    </div>
  );
}
