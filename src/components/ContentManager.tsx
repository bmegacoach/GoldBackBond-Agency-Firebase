import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { Zap } from 'lucide-react';
import { useFirebaseForm } from '@/hooks/useFirebaseForm';

interface Content {
  id?: string;
  title: string;
  type: 'email' | 'social' | 'blog' | 'landing-page' | 'brochure';
  status: 'draft' | 'review' | 'published' | 'archived';
  createdAt?: string;
  views?: number;
  clicks?: number;
}

export function ContentManager() {
  const [content, setContent] = useState<Content[]>([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showGenerator, setShowGenerator] = useState(false);
  const firebase = useFirebaseForm<Content>({ collectionName: 'content' });

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Manager</h1>
          <p className="text-gray-600 mt-2">Create and manage AI-generated marketing content</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setShowGenerator(true)}>
          <Zap className="w-5 h-5 mr-2" />
          Generate Content
        </Button>
      </div>

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
