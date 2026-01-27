import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { X } from 'lucide-react';
import { DynamicColumn } from '@/hooks/useSchema';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  initialData?: any;
  dynamicColumns?: DynamicColumn[];
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialData,
  dynamicColumns = []
}: CustomerFormModalProps) {
  const [formData, setFormData] = useState(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      tier: 'bronze',
      status: 'active',
      initialInvestment: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name required';
    if (!formData.email.trim()) newErrors.email = 'Email required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Invalid email';
    if (formData.initialInvestment && isNaN(parseFloat(formData.initialInvestment)))
      newErrors.initialInvestment = 'Must be a number';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit({
        ...formData,
        initialInvestment: formData.initialInvestment ? parseFloat(formData.initialInvestment) : 0,
      });
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        tier: 'bronze',
        status: 'active',
        initialInvestment: '',
      });
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md max-h-96 overflow-y-auto">
        <CardHeader className="flex justify-between items-center">
          <CardTitle>{initialData ? 'Edit Customer' : 'New Customer'}</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Investment
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.initialInvestment}
                onChange={(e) =>
                  setFormData({ ...formData, initialInvestment: e.target.value })
                }
                className={errors.initialInvestment ? 'border-red-500' : ''}
              />
              {errors.initialInvestment && (
                <p className="text-red-500 text-xs mt-1">{errors.initialInvestment}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tier
                </label>
                <Select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  options={[
                    { value: 'bronze', label: 'Bronze' },
                    { value: 'silver', label: 'Silver' },
                    { value: 'gold', label: 'Gold' },
                    { value: 'platinum', label: 'Platinum' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                    { value: 'suspended', label: 'Suspended' },
                    { value: 'churned', label: 'Churned' },
                  ]}
                />
              </div>
            </div>

            {/* Dynamic Fields */}
            {dynamicColumns.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Custom Fields</h3>
                <div className="grid grid-cols-1 gap-4">
                  {dynamicColumns.map((col) => (
                    <div key={col.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {col.label}
                      </label>
                      <Input
                        type={col.type === 'phone' ? 'tel' : col.type}
                        value={formData[col.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                {loading ? 'Saving...' : 'Save Customer'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
