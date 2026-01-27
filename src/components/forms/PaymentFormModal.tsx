import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { X } from 'lucide-react';

interface PaymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  initialData?: any;
}

export function PaymentFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialData,
}: PaymentFormModalProps) {
  const [formData, setFormData] = useState(
    initialData || {
      customerId: '',
      amount: '',
      type: 'deposit',
      description: '',
      status: 'pending',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.customerId.trim()) newErrors.customerId = 'Customer ID required';
    if (!formData.amount || isNaN(parseFloat(formData.amount)))
      newErrors.amount = 'Valid amount required';
    if (parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        ...formData,
        amount: parseFloat(formData.amount),
      });
      setFormData({
        customerId: '',
        amount: '',
        type: 'deposit',
        description: '',
        status: 'pending',
      });
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{initialData ? 'Edit Payment' : 'New Payment'}</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer ID
              </label>
              <Input
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className={errors.customerId ? 'border-red-500' : ''}
              />
              {errors.customerId && (
                <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className={errors.amount ? 'border-red-500' : ''}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <Select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                options={[
                  { value: 'deposit', label: 'Deposit' },
                  { value: 'withdrawal', label: 'Withdrawal' },
                  { value: 'interest', label: 'Interest' },
                  { value: 'fee', label: 'Fee' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'pending', label: 'Pending' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'failed', label: 'Failed' },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Payment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
