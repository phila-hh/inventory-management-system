import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Users as UsersIcon, Shield, User } from 'lucide-react';
import { usersService } from '../services/users.service';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

function UserCard({ user, onEdit, onDelete, currentUserId }) {
  const isCurrentUser = user._id === currentUserId;
  
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            user.role === 'admin' ? 'bg-amber-100' : 'bg-slate-100'
          }`}>
            {user.role === 'admin' ? (
              <Shield className="w-6 h-6 text-amber-600" />
            ) : (
              <User className="w-6 h-6 text-slate-600" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900">{user.name}</h3>
            <p className="text-sm text-slate-500">@{user.username}</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
          user.role === 'admin' 
            ? 'bg-amber-100 text-amber-800' 
            : 'bg-slate-100 text-slate-800'
        }`}>
          {user.role}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-200">
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          user.isActive 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-rose-100 text-rose-800'
        }`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
        {!isCurrentUser && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(user)}
              className="text-emerald-600 hover:bg-emerald-50 p-2 rounded"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(user._id)}
              className="text-rose-600 hover:bg-rose-50 p-2 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        {isCurrentUser && (
          <span className="text-xs text-slate-400">You</span>
        )}
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState(user ? {
    name: user.name,
    username: user.username,
    role: user.role,
    isActive: user.isActive,
    password: '',
  } : {
    name: '',
    username: '',
    role: 'staff',
    isActive: true,
    password: '',
  });

  // Keep form in sync when `user` prop changes (handles mount/update ordering)
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        role: user.role || 'staff',
        isActive: typeof user.isActive === 'boolean' ? user.isActive : true,
        password: '',
      });
    } else {
      setFormData({
        name: '',
        username: '',
        role: 'staff',
        isActive: true,
        password: '',
      });
    }
  }, [user]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = { ...formData };
    if (!data.password) delete data.password;
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          {user ? 'Edit User' : 'Add New User'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required
              disabled={!!user}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {user ? 'New Password (leave blank to keep current)' : 'Password'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              required={!user}
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
              Active
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              {user ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Users() {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersService.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => usersService.create(data),
    onSuccess: () => {
      toast.success('User created successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to create user', { duration: 4000 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => usersService.update(id, data),
    onSuccess: () => {
      toast.success('User updated successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowModal(false);
      setEditingUser(null);
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to update user', { duration: 4000 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => usersService.delete(id),
    onSuccess: () => {
      toast.success('User deleted successfully', { duration: 3000 });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to delete user', { duration: 4000 }),
  });

  const handleSave = (data) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser._id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Users</h1>
          <p className="text-slate-600 mt-1">Manage system users</p>
        </div>
        <button
          onClick={handleAdd}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-500">Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-500">No users found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <UserCard
              key={user._id}
              user={user}
              currentUserId={currentUser?._id}
              onEdit={handleEdit}
              onDelete={(id) => {
                if (confirm('Are you sure you want to delete this user?')) {
                  deleteMutation.mutate(id);
                }
              }}
            />
          ))}
        </div>
      )}

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
