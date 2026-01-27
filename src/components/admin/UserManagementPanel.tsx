import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { X, Plus, Trash2, User, Mail, Shield } from 'lucide-react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase/config';
import { useAuth } from '@/lib/firebase/auth-context';

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  role: string;
  department: string;
  createdAt: any;
  lastLogin?: any;
  isActive: boolean;
}

const ROLES = [
  { id: 'admin', name: 'Admin', description: 'Full system access', color: 'danger' },
  { id: 'sales_manager', name: 'Sales Manager', description: 'Team management & oversight', color: 'accent' },
  { id: 'sales_rep', name: 'Sales Rep', description: 'Lead & customer management', color: 'info' },
  { id: 'marketing_manager', name: 'Marketing Manager', description: 'Campaign management', color: 'warning' },
  { id: 'support_agent', name: 'Support Agent', description: 'Ticket management', color: 'success' },
  { id: 'finance', name: 'Finance', description: 'Payment & audit oversight', color: 'secondary' },
];

const DEPARTMENTS = ['Sales', 'Marketing', 'Support', 'Finance', 'Operations', 'Management'];

export function UserManagementPanel() {
  const { user: _authUser } = useAuth(); // Currently not used, but available for future role-based filtering
  const [users, setUsers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    password: '',
    role: 'sales_rep',
    department: 'Sales',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as TeamMember[];
      setUsers(usersData);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Create user in Firebase Auth
      const authResult = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Add user to Firestore
      await setDoc(doc(db, 'users', authResult.user.uid), {
        email: formData.email,
        displayName: formData.displayName,
        role: formData.role,
        department: formData.department,
        createdAt: new Date(),
        isActive: true,
      });

      setSuccess(`User ${formData.displayName} added successfully!`);
      setFormData({
        email: '',
        displayName: '',
        password: '',
        role: 'sales_rep',
        department: 'Sales',
      });
      setIsAddingUser(false);
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add user');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await deleteDoc(doc(db, 'users', userId));
      setSuccess('User deleted successfully');
      loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading users...</div>
        </CardContent>
      </Card>
    );
  }

  const activeUsers = users.filter(u => u.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-primary-900">User Management</h2>
          <p className="text-primary-600 text-sm mt-1">Role-based access control & team administration</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsAddingUser(!isAddingUser)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </Button>
      </div>

      {/* Add User Form */}
      {isAddingUser && (
        <Card className="border-2 border-accent-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add New Team Member</span>
              <button onClick={() => setIsAddingUser(false)}>
                <X className="w-5 h-5" />
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Full Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Password *
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full p-2.5 border border-primary-200 rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
                  >
                    {ROLES.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-primary-700 block mb-2">
                    Department *
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2.5 border border-primary-200 rounded-lg focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
                  >
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-success-50 border border-success-200 rounded-lg text-success-700 text-sm">
                  {success}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit" variant="primary">Add User</Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsAddingUser(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Total Users
            </p>
            <p className="text-4xl font-bold text-primary-900 mt-2">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-primary-600 text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Active Users
            </p>
            <p className="text-4xl font-bold text-success-600 mt-2">{activeUsers}</p>
          </CardContent>
        </Card>
        {ROLES.map(role => (
          <Card key={role.id}>
            <CardContent className="p-6">
              <p className="text-primary-600 text-sm font-semibold">{role.name}</p>
              <p className="text-4xl font-bold text-primary-900 mt-2">
                {users.filter(u => u.role === role.id).length}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Department</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-primary-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const roleInfo = ROLES.find(r => r.id === user.role);
                  return (
                    <tr key={user.id} className="border-b border-primary-100 hover:bg-primary-50">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-primary-900">{user.displayName}</div>
                      </td>
                      <td className="py-4 px-4 text-primary-700 flex items-center gap-2">
                        <Mail className="w-3 h-3 text-primary-400" />
                        {user.email}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={roleInfo?.color as any}>{roleInfo?.name}</Badge>
                      </td>
                      <td className="py-4 px-4 text-primary-700">{user.department}</td>
                      <td className="py-4 px-4">
                        <Badge variant={user.isActive ? 'success' : 'error'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRemoveUser(user.id)}
                            className="p-1 hover:bg-danger-100 rounded text-danger-600 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Role Permissions Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROLES.map(role => (
              <div key={role.id} className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <h4 className="font-semibold text-primary-900 mb-1">{role.name}</h4>
                <p className="text-primary-600 text-sm">{role.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
