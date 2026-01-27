import { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Plus, Edit2, Settings } from 'lucide-react';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';
import { useSchema, DynamicColumn } from '@/hooks/useSchema';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { WorkflowFormModal } from './forms/WorkflowFormModal';

interface Workflow {
  id?: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any; // Index signature for dynamic fields
}

export function WorkflowsManager() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ...existing code...

  // Dynamic Column State
  const [showColumnCreator, setShowColumnCreator] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DynamicColumn['type']>('text');

  const firebase = useFirebaseForm<Workflow>({ collectionName: 'workflows' });
  const schema = useSchema({ collectionName: 'workflows' });

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Loading timeout')), 10000)
      );
      const data = await Promise.race([firebase.fetchAll(), timeoutPromise]) as Workflow[];
      setWorkflows(data);
    } catch (error) {
      console.error('Failed to load workflows:', error);
      setWorkflows([]); // Show empty state instead of error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (workflow: Workflow) => {
    setEditingId(workflow.id || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmitForm = async (formData: Omit<Workflow, 'id'>) => {
    try {
      setIsSubmitting(true);
      if (editingId) {
        await firebase.update(editingId, formData);
        setWorkflows(
          workflows.map((w) =>
            w.id === editingId ? { ...w, ...formData } : w
          )
        );
      } else {
        const newWorkflow = await firebase.create(formData);
        setWorkflows([...workflows, newWorkflow as Workflow]);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this workflow?')) {
      try {
        await firebase.remove(id);
        setWorkflows(workflows.filter((w) => w.id !== id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  const editingWorkflow = editingId
    ? workflows.find((w) => w.id === editingId)
    : undefined;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-600">Loading workflows...</p>
      </div>
    );
  }

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
    const reserved = ['id', 'name', 'description', 'status', 'createdAt', 'updatedAt'];
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
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-2">Manage automated workflows and processes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowColumnCreator(!showColumnCreator)}>
            <Settings className="w-4 h-4 mr-2" />
            {showColumnCreator ? 'Cancel' : 'Customize Columns'}
          </Button>
          <Button variant="primary" size="lg" onClick={handleOpenCreate}>
            <Plus className="w-5 h-5 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Column Creator UI */}
      {showColumnCreator && (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-4 flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Column Name</label>
              <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="e.g. Category, Tags..." />
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

      <div className="space-y-4">
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <p className="text-center text-gray-500">No workflows created yet</p>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card key={workflow.id} className="hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                      <Badge variant={statusColor(workflow.status)}>
                        {workflow.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{workflow.description}</p>
                    {/* Dynamic Fields */}
                    <div className="mt-2 flex gap-4 text-sm text-gray-600">
                      {schema.columns.map(col => (
                        <span key={col.id}>• {col.label}: {workflow[col.key] || '-'}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenEdit(workflow)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => workflow.id && handleDelete(workflow.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <WorkflowFormModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmitForm}
        initialData={editingWorkflow}
        isLoading={isSubmitting}
        schema={schema}
      />
    </div>
  );
}
