import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { X } from 'lucide-react';

interface WorkflowFormData {
  [key: string]: any;
  name: string;
  description: string;
  status: 'active' | 'inactive';
}

interface WorkflowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkflowFormData) => Promise<void>;
  initialData?: WorkflowFormData;
  isLoading?: boolean;
  schema?: any;
}

export function WorkflowFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  schema,
}: WorkflowFormModalProps) {
  const [formData, setFormData] = useState<WorkflowFormData>({
    name: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', description: '', status: 'active' });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    setFormData({ name: '', description: '', status: 'active' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>{initialData ? 'Edit Workflow' : 'Create Workflow'}</CardTitle>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Workflow Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Auto-score leads"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="What does this workflow do?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'active' | 'inactive',
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Dynamic Fields */}
            {schema?.columns?.map((col: any) => (
              <div key={col.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {col.label}
                </label>
                {col.type === 'date' ? (
                  <input
                    type="date"
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : col.type === 'number' ? (
                  <input
                    type="number"
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    value={formData[col.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>
            ))}

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Workflow'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
