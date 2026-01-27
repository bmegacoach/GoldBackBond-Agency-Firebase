import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Plus, Edit2, Settings } from 'lucide-react';
import { TicketFormModal } from './forms/TicketFormModal';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';
import { useSchema, DynamicColumn } from '@/hooks/useSchema';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

interface Ticket {
  id?: string;
  subject: string;
  description: string;
  customerId: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  status: 'open' | 'in-progress' | 'waiting' | 'resolved' | 'closed';
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any; // Index signature for dynamic fields
}

export function TicketsManager() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [statusFilter, setStatusFilter] = useState('open');
  // ...existing code...

  // Dynamic Column State
  const [showColumnCreator, setShowColumnCreator] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DynamicColumn['type']>('text');

  const firebase = useFirebaseForm<Ticket>({ collectionName: 'tickets' });
  const schema = useSchema({ collectionName: 'tickets' });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await firebase.fetchAll();
      setTickets(data);
    } catch (error) {
      console.error('Failed to load tickets:', error);
    }
  };

  const handleSubmit = async (formData: any) => {
    try {
      if (editingTicket?.id) {
        await firebase.update(editingTicket.id, formData);
        setTickets(tickets.map((t) => (t.id === editingTicket.id ? { ...t, ...formData } : t)));
      } else {
        const newTicket = await firebase.create(formData);
        setTickets([...tickets, newTicket]);
      }
      setEditingTicket(null);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await firebase.remove(id);
        setTickets(tickets.filter((t) => t.id !== id));
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleEdit = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsModalOpen(true);
  };

  const handleNewTicket = () => {
    setEditingTicket(null);
    setIsModalOpen(true);
  };

  const filteredTickets = tickets.filter((t) => t.status === statusFilter);

  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const statusCounts = {
    open: tickets.filter((t) => t.status === 'open').length,
    'in-progress': tickets.filter((t) => t.status === 'in-progress').length,
    waiting: tickets.filter((t) => t.status === 'waiting').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
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
    const reserved = ['id', 'subject', 'description', 'customerId', 'priority', 'category', 'status', 'createdAt', 'updatedAt'];
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
          <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-2">Manage and track customer support requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowColumnCreator(!showColumnCreator)}>
            <Settings className="w-4 h-4 mr-2" />
            {showColumnCreator ? 'Cancel' : 'Customize Columns'}
          </Button>
          <Button variant="primary" size="lg" onClick={handleNewTicket}>
            <Plus className="w-5 h-5 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* Column Creator UI */}
      {showColumnCreator && (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-4 flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Column Name</label>
              <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="e.g. Department, Tags..." />
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

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <p className="text-gray-600 text-sm font-medium capitalize">{status}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {['open', 'in-progress', 'waiting', 'resolved', 'closed'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 font-medium capitalize border-b-2 transition-colors ${
              statusFilter === status
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No tickets in this status. Create one now!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Subject</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900 max-w-xs truncate">
                          {ticket.subject}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{ticket.customerId}</td>
                      <td className="py-3 px-4">
                        <Badge className={priorityColors[ticket.priority]}>
                          {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-700 capitalize">{ticket.category}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-sm capitalize">
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => handleEdit(ticket)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => ticket.id && handleDelete(ticket.id)}
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

      <TicketFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTicket(null);
        }}
        onSubmit={handleSubmit}
        loading={firebase.loading}
        initialData={editingTicket}
        schema={schema}
      />
    </div>
  );
}