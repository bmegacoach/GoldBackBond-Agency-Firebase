import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { Zap, Settings, Plus } from 'lucide-react';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';
import { useSchema, DynamicColumn } from '@/hooks/useSchema';
import { Input } from './ui/Input';

interface Content {
  id?: string;
  title: string;
  type: 'email' | 'social' | 'blog' | 'landing-page' | 'brochure';
  status: 'draft' | 'review' | 'published' | 'archived';
  createdAt?: string;
  views?: number;
  clicks?: number;
  [key: string]: any; // Index signature for dynamic fields
}

export function ContentManager() {
  const [content, setContent] = useState<Content[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerator, setShowGenerator] = useState(false);
  // ...existing code...

  // Dynamic Column State
  const [showColumnCreator, setShowColumnCreator] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DynamicColumn['type']>('text');

  const firebase = useFirebaseForm<Content>({ collectionName: 'content' });
  const schema = useSchema({ collectionName: 'content' });

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await firebase.fetchAll();
      setContent(data);
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }

  const filteredContent = content.filter((item) => {
    const matchesType = typeFilter === 'all' || item.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const typeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800';
      case 'social':
        return 'bg-purple-100 text-purple-800';
      case 'blog':
        return 'bg-green-100 text-green-800';
      case 'landing-page':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'review':
        return 'warning';
      case 'draft':
        return 'default';
      case 'archived':
        return 'error';
      default:
        return 'default';
    }
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
    const reserved = ['id', 'title', 'type', 'status', 'createdAt', 'views', 'clicks'];
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
          <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-gray-600 mt-2">
            Create and manage AI-generated marketing content
            <Badge variant="warning" className="ml-2">Demo Mode (Local Storage)</Badge>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowColumnCreator(!showColumnCreator)}>
            <Settings className="w-4 h-4 mr-2" />
            {showColumnCreator ? 'Cancel' : 'Customize Columns'}
          </Button>
          <Button variant="primary" size="lg" onClick={() => setShowGenerator(true)}>
            <Zap className="w-5 h-5 mr-2" />
            Generate Content
          </Button>
        </div>
      </div>

      {/* Column Creator UI */}
      {showColumnCreator && (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="py-4 flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Column Name</label>
              <Input value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="e.g. Campaign, Tags..." />
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

      {/* AI Content Generator Modal */}
      {showGenerator && (
        <Card className="border-primary-300 bg-primary-50">
          <CardHeader>
            <CardTitle>AI Content Generator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Content Type"
              options={[
                { value: 'email', label: 'Email' },
                { value: 'social', label: 'Social Media' },
                { value: 'blog', label: 'Blog Post' },
                { value: 'landing-page', label: 'Landing Page' },
                { value: 'brochure', label: 'Brochure' },
              ]}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Prompt
              </label>
              <textarea
                placeholder="Describe what you want the AI to generate..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={4}
              />
            </div>
            <Select
              label="Target Audience"
              options={[
                { value: 'leads', label: 'Leads' },
                { value: 'customers', label: 'Customers' },
                { value: 'all', label: 'All' },
              ]}
            />
            {/* Dynamic Fields */}
            {schema.columns.map(col => (
              <div key={col.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {col.label}
                </label>
                {col.type === 'date' ? (
                  <input
                    type="date"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : col.type === 'number' ? (
                  <input
                    type="number"
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
              </div>
            ))}
            
            <div className="flex gap-2">
              <Button variant="primary" className="flex-1">
                Generate Content
              </Button>
              <Button variant="outline" onClick={() => setShowGenerator(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Types' },
                { value: 'email', label: 'Email' },
                { value: 'social', label: 'Social' },
                { value: 'blog', label: 'Blog' },
                { value: 'landing-page', label: 'Landing Page' },
              ]}
            />
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'draft', label: 'Draft' },
                { value: 'review', label: 'Review' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <Button variant="secondary">Advanced Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <CardTitle>Content Library ({filteredContent.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredContent.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Badge className={typeColor(item.type)}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                    <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Created: {item.createdAt}</span>
                    <span>•</span>
                    <span>{item.views} views</span>
                    <span>•</span>
                    <span>{item.clicks} clicks</span>
                    {/* Dynamic Fields */}
                    {schema.columns.map(col => (
                      <span key={col.id}>• {col.label}: {item[col.key] || '-'}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={statusColor(item.status)}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                  <Button variant="secondary" size="sm">
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Total Views</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {content.reduce((sum, c) => sum + (c.views || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Total Clicks</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {content.reduce((sum, c) => sum + (c.clicks || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm font-medium">Click-Through Rate</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {(
                (content.reduce((sum, c) => sum + (c.clicks || 0), 0) /
                  (content.reduce((sum, c) => sum + (c.views || 0), 0) || 1)) *
                100
              ).toFixed(1)}
              %
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
