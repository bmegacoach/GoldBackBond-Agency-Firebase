import { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { Search, Plus, Filter, Trash2, Edit2, Settings } from 'lucide-react';
import { LeadFormModal } from './forms/LeadFormModal';
import { useDataStore } from '@/hooks/useDataStore';
import { useSchema, DynamicColumn } from '@/hooks/useSchema';
import { useAuth } from '@/lib/firebase/auth-context';

interface Lead {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  priority: 'high' | 'medium' | 'low';
  source: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any; // Allow dynamic fields
}

export function LeadsManager() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Column State
  const [showColumnCreator, setShowColumnCreator] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DynamicColumn['type']>('text');

  // Use new hooks
  const dataStore = useDataStore<Lead>({ collectionName: 'leads' });
  const schema = useSchema({ collectionName: 'leads' });
  const { user: _user } = useAuth();

  // Load leads with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    const loadLeads = async () => {
      try {
        setIsLoading(true);
        await dataStore.fetchAll();
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to load leads:', error);
          setIsLoading(false);
        }
      }
    };

    loadLeads();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Use data from the store instead of local state
  const leads = dataStore.data || [];

  const handleSubmit = async (formData: any) => {
    try {
      setFormError(null);

      if (editingLead?.id) {
        // Check for optimistic locking
        const current = await dataStore.fetchById(editingLead.id);
        if (current?.updatedAt !== editingLead.updatedAt) {
          throw new Error('Data has been modified by another user. Please refresh and try again.');
        }
        
        await dataStore.update(editingLead.id, formData);
      } else {
        await dataStore.create(formData);
      }
      
      setEditingLead(null);
      setIsModalOpen(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save lead';
      setFormError(errorMsg);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead? This action cannot be undone.')) {
      try {
        await dataStore.remove(id);
      } catch (error) {
        console.error('Delete failed:', error);
        setFormError('Failed to delete lead. Please try again.');
      }
    }
  };

  // Schema management with validation
  const handleAddColumn = () => {
    if (!newColName.trim()) {
      setFormError('Column name is required');
      return;
    }
    
    // Check for duplicates
    const exists = schema.columns.some(col => col.label.toLowerCase() === newColName.trim().toLowerCase());
    if (exists) {
      setFormError('A column with this name already exists');
      return;
    }
    
    // Check for reserved field names
    const reserved = ['id', 'firstName', 'lastName', 'email', 'phone', 'company', 'status', 'priority', 'source', 'createdAt', 'updatedAt'];
    if (reserved.includes(newColName.trim())) {
      setFormError('This field name is reserved and cannot be used');
      return;
    }
    
    schema.addColumn({
      label: newColName,
      type: newColType,
    });
    setNewColName('');
    setShowColumnCreator(false);
    setFormError(null);
  };

  const handleRemoveColumn = (id: string) => {
    if (window.confirm('Remove this column? Data will remain but column will be hidden.')) {
      schema.removeColumn(id);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setIsModalOpen(true);
  };

  const handleNewLead = () => {
    setEditingLead(null);
    setIsModalOpen(true);
  };

  // Memoized filtered leads with proper null checks and trimming
  const filteredLeads = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    
    return leads.filter((lead) => {
      // Safe field access with defaults
      const firstName = lead.firstName || '';
      const lastName = lead.lastName || '';
      const email = lead.email || '';
      const company = lead.company || '';
      
      const matchesSearch = !term ||
        firstName.toLowerCase().includes(term) ||
        lastName.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term) ||
        company.toLowerCase().includes(term);
        
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [leads, searchTerm, statusFilter, priorityFilter]);

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'converted': return 'success';
      case 'lost': return 'error';
      case 'qualified': return 'info';
      default: return 'default';
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads Manager</h1>
          <p className="text-gray-600 mt-2">
            Manage and track your sales pipeline
            <Badge variant="warning" className="ml-2">Demo Mode (Local Storage)</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowColumnCreator(!showColumnCreator)}>
            <Settings className="w-4 h-4 mr-2" />
            {showColumnCreator ? 'Cancel' : 'Customize Columns'}
          </Button>
          <Button variant="primary" size="lg" onClick={handleNewLead}>
            <Plus className="w-5 h-5 mr-2" />
            New Lead
          </Button>
        </div>
      </div>

      {/* Column Creator UI */}
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

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'new', label: 'New' },
                { value: 'contacted', label: 'Contacted' },
                { value: 'qualified', label: 'Qualified' },
                { value: 'converted', label: 'Converted' },
                { value: 'lost', label: 'Lost' },
              ]}
            />
            <Select
              label="Priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Priorities' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
            <Button variant="outline" className="mt-6">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{formError}</p>
        </div>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Leads ({filteredLeads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No leads found. Create your first lead!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Name</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Company</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Source</th>

                    {/* Dynamic Columns Headers */}
                    {schema.columns.map(col => (
                      <th key={col.id} className="text-left py-3 px-4 font-semibold text-gray-700 whitespace-nowrap group">
                        <div className="flex items-center gap-1">
                          {col.label}
                          {showColumnCreator && (
                            <button onClick={() => handleRemoveColumn(col.id)} className="text-gray-400 hover:text-red-500">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}

                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">
                          {lead.firstName} {lead.lastName}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{lead.email}</td>
                      <td className="py-3 px-4 text-gray-700">{lead.company || '-'}</td>
                      <td className="py-3 px-4">
                        <Badge variant={statusBadgeVariant(lead.status)}>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-medium capitalize ${priorityColor(lead.priority)}`}
                        >
                          {lead.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{lead.source}</td>

                      {/* Dynamic Columns Cells */}
                      {schema.columns.map(col => (
                        <td key={col.id} className="py-3 px-4 text-gray-700">
                          {lead[col.key] || '-'}
                        </td>
                      ))}

                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEdit(lead)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => lead.id && handleDelete(lead.id)}
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

      <LeadFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLead(null);
          setFormError(null);
        }}
        onSubmit={handleSubmit}
        loading={dataStore.loading}
        initialData={editingLead}
        error={formError}
        dynamicColumns={schema.columns} // Pass dynamic columns to form
      />
    </div>
  );
}

