import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Save, DollarSign, Percent, Calendar } from 'lucide-react';

interface Package {
    [key: string]: any;
    id?: string;
    name: string;
    minInvestment: number;
    interestRate: number;
    duration: number;
    description?: string;
}

interface InvestmentPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => Promise<void>;
    loading: boolean;
    initialData?: Package | null;
    schema?: any;
}

export function InvestmentPackageModal({ isOpen, onClose, onSubmit, loading, initialData, schema }: InvestmentPackageModalProps) {
    const [formData, setFormData] = useState<Package>({
        name: '',
        minInvestment: 5000,
        interestRate: 5,
        duration: 12,
        description: '',
    });

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                name: '',
                minInvestment: 5000,
                interestRate: 5,
                duration: 12,
                description: '',
            });
        }
    }, [initialData, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-bold text-gray-900">
                        {initialData ? 'Edit Package' : 'Create Investment Package'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
                        <Input
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Gold Standard Growth"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Min Investment ($)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    type="number"
                                    required
                                    min="0"
                                    className="pl-9"
                                    value={formData.minInvestment}
                                    onChange={(e) => setFormData({ ...formData, minInvestment: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                            <div className="relative">
                                <Percent className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <Input
                                    type="number"
                                    required
                                    step="0.1"
                                    className="pl-9"
                                    value={formData.interestRate}
                                    onChange={(e) => setFormData({ ...formData, interestRate: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Months)</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <Input
                                type="number"
                                required
                                min="1"
                                className="pl-9"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 p-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Describe the investment strategy..."
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
                                    onChange={(e) => setFormData({ ...formData, [col.key]: Number(e.target.value) })}
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

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={loading}>
                            {loading ? 'Saving...' : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Package
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
