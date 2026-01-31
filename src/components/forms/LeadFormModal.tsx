import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { X, User, Mail, Building2, Phone, Target, AlertTriangle, Zap, Database, DollarSign, Calendar, Layers } from 'lucide-react';
import { DynamicColumn } from '@/hooks/useSchema';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  initialData?: any;
  error?: string | null;
  dynamicColumns?: DynamicColumn[];
}

export function LeadFormModal({ isOpen, onClose, onSubmit, loading, initialData, error, dynamicColumns = [] }: LeadFormModalProps) {
  const [formData, setFormData] = useState<any>(
    initialData || {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      phone: '',
      status: 'new',
      priority: 'medium',
      source: 'website',
      stage: 1,
      estimatedValue: 0,
      closeDate: '',
    }
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName?.trim()) newErrors.firstName = 'First name required';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Last name required';
    if (!formData.email?.trim()) newErrors.email = 'Email required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || ''))
      newErrors.email = 'Invalid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        stage: Number(formData.stage) || 1,
        estimatedValue: Number(formData.estimatedValue) || 0,
      });
      // Reset form handled by useEffect on open
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(
        initialData || {
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          phone: '',
          status: 'new',
          priority: 'medium',
          source: 'website',
          stage: 1,
          estimatedValue: 0,
          closeDate: '',
        }
      );
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-8 border-b border-primary-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-900">
                {initialData ? 'Edit Lead' : 'Add New Lead'}
              </h2>
              <p className="text-primary-600 text-sm mt-1">
                {initialData ? 'Update lead information' : 'Create a new lead in your pipeline'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl hover:bg-primary-50 flex items-center justify-center transition-smooth group"
          >
            <X className="w-5 h-5 text-primary-400 group-hover:text-primary-600" />
          </button>
        </div>

        {/* Form */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-danger-50 border-2 border-danger-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-danger-700 font-semibold">Error saving lead</p>
                  <p className="text-danger-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900">Personal Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700">First Name *</label>
                  <Input
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="John"
                    className={errors.firstName ? 'border-danger-300 focus:border-danger-500' : ''}
                  />
                  {errors.firstName && <span className="text-xs text-danger-600">{errors.firstName}</span>}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700">Last Name *</label>
                  <Input
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Doe"
                    className={errors.lastName ? 'border-danger-300 focus:border-danger-500' : ''}
                  />
                  {errors.lastName && <span className="text-xs text-danger-600">{errors.lastName}</span>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-primary-700">Email Address *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 w-5 h-5 text-primary-400" />
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@company.com"
                    className={`pl-12 ${errors.email ? 'border-danger-300 focus:border-danger-500' : ''}`}
                  />
                </div>
                {errors.email && <span className="text-xs text-danger-600">{errors.email}</span>}
              </div>
            </div>

            {/* Pipeline Information */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900">Pipeline Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700 text-sm">Pipeline Stage</label>
                  <div className="relative">
                    <Layers className="absolute left-3 top-3 w-4 h-4 text-primary-400 z-10" />
                    <Select
                      className="pl-9"
                      value={formData.stage || 1}
                      onChange={(e) => setFormData({ ...formData, stage: Number(e.target.value) })}
                      options={[
                        { value: 1, label: '1. Identification' },
                        { value: 2, label: '2. Contact' },
                        { value: 3, label: '3. Needs Analysis' },
                        { value: 4, label: '4. Presentation' },
                        { value: 5, label: '5. Objection Handling' },
                        { value: 6, label: '6. Proposal' },
                        { value: 7, label: '7. Commitment' },
                        { value: 8, label: '8. Signature' },
                        { value: 9, label: '9. Onboarding' },
                      ]}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700 text-sm">Est. Value (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-primary-400" />
                    <Input
                      type="number"
                      className="pl-9"
                      value={formData.estimatedValue || 0}
                      onChange={(e) => setFormData({ ...formData, estimatedValue: parseFloat(e.target.value) })}
                      placeholder="50000"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700 text-sm">Target Close</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-primary-400" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={formData.closeDate || ''}
                      onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-primary-900">Additional Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700">Company</label>
                  <Input
                    value={formData.company || ''}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 w-5 h-5 text-primary-400" />
                    <Input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="pl-12"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700">Status</label>
                  <Select
                    value={formData.status || 'new'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'new', label: 'New' },
                      { value: 'contacted', label: 'Contacted' },
                      { value: 'qualified', label: 'Qualified' },
                      { value: 'converted', label: 'Converted' },
                      { value: 'lost', label: 'Lost' },
                    ]}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-primary-700">Priority</label>
                  <Select
                    value={formData.priority || 'medium'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    options={[
                      { value: 'high', label: 'High' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'low', label: 'Low' },
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Fields */}
            {dynamicColumns.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Database className="w-4 h-4 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-primary-900">Custom Fields</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dynamicColumns.map((col) => (
                    <div key={col.id} className="space-y-2">
                      <label className="block text-sm font-semibold text-primary-700">{col.label}</label>
                      {col.type === 'select' && col.options ? (
                        <Select
                          value={formData[col.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                          options={col.options.map((opt: string) => ({ value: opt, label: opt }))}
                        />
                      ) : (
                        <Input
                          type={col.type === 'phone' ? 'tel' : col.type}
                          value={formData[col.key] || ''}
                          onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-8 border-t border-primary-100">
              <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="px-6">
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="px-8 min-w-[140px]">
                {loading ? (
                  <span className="flex items-center justify-center gap-2 w-full">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 w-full">
                    <Zap className="w-4 h-4" />
                    <span>{initialData ? 'Update Lead' : 'Create Lead'}</span>
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
