import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { X } from 'lucide-react';

interface TicketFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  initialData?: any;
  schema?: any;
}

export function TicketFormModal({
  isOpen,
  onClose,
  onSubmit,
  loading,
  initialData,
  schema,
}: TicketFormModalProps) {
  const [formData, setFormData] = useState(
    initialData || {
      subject: '',
      description: '',
      customerId: '',
      priority: 'medium',
      category: 'general',
      status: 'open',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.subject.trim()) newErrors.subject = 'Subject required';
    if (!formData.description.trim()) newErrors.description = 'Description required';
    if (!formData.customerId.trim()) newErrors.customerId = 'Customer ID required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
      setFormData({
        subject: '',
        description: '',
        customerId: '',
        priority: 'medium',
        category: 'general',
        status: 'open',
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
          <CardTitle>{initialData ? 'Edit Ticket' : 'New Support Ticket'}</CardTitle>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className={errors.subject ? 'border-red-500' : ''}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.description ? 'border-red-500' : ''
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <Select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  options={[
                    { value: 'general', label: 'General' },
                    { value: 'billing', label: 'Billing' },
                    { value: 'technical', label: 'Technical' },
                    { value: 'feature-request', label: 'Feature Request' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'in-progress', label: 'In Progress' },
                  { value: 'waiting', label: 'Waiting' },
                  { value: 'resolved', label: 'Resolved' },
                  { value: 'closed', label: 'Closed' },
                ]}
              />
            </div>

            {/* Dynamic Fields */}
            {schema?.columns?.map((col: any) => (
              <div key={col.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {col.label}
                </label>
                {col.type === 'date' ? (
                  <Input
                    type="date"
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                  />
                ) : col.type === 'number' ? (
                  <Input
                    type="number"
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                  />
                )}
              </div>
            ))}

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
                {loading ? 'Saving...' : 'Save Ticket'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
