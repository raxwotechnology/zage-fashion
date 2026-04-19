import { useState, useEffect } from 'react';
import { Trash2, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminUsers, updateUserRole, toggleUserStatus, deleteUser } from '../../services/api';
import { toast } from 'react-toastify';
import navItems from './adminNavItems';

const roleColors = {
  customer: 'bg-sky-100 text-sky-700',
  manager: 'bg-amber-100 text-amber-700',
  admin: 'bg-violet-100 text-violet-700',
  cashier: 'bg-teal-100 text-teal-700',
  deliveryGuy: 'bg-blue-100 text-blue-700',
  stockEmployee: 'bg-orange-100 text-orange-700',
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const { data } = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleToggleStatus = async (userId, userName, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} "${userName}"?`)) return;
    try {
      const { data } = await toggleUserStatus(userId);
      toast.success(data.message || `User ${action}d`);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} user`);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Permanently delete this user? This cannot be undone.')) return;
    try {
      await deleteUser(userId);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const filtered = users.filter((u) => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive !== false : u.isActive === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = users.filter((u) => u.isActive !== false).length;
  const inactiveCount = users.filter((u) => u.isActive === false).length;

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Admin Panel">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">User Management</h1>
            <p className="text-muted-text text-sm mt-1">
              {users.length} total · <span className="text-emerald-600">{activeCount} active</span> · <span className="text-red-500">{inactiveCount} deactivated</span>
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
            <option value="cashier">Cashier</option>
            <option value="deliveryGuy">Delivery</option>
            <option value="stockEmployee">Stock Employee</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Deactivated</option>
          </select>
        </div>

        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-muted-text">User</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Email</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Phone</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Role</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Joined</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.map((user) => (
                  <tr key={user._id} className={`hover:bg-gray-50 transition-colors ${user.isActive === false ? 'opacity-60' : ''}`}>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.isActive === false ? 'bg-gray-400' : 'bg-gradient-to-br from-emerald-400 to-teal-500'}`}>
                          {user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <span className="font-medium text-dark-navy">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-muted-text">{user.email}</td>
                    <td className="px-6 py-3.5 text-muted-text">{user.phone || '—'}</td>
                    <td className="px-6 py-3.5">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 appearance-none cursor-pointer ${roleColors[user.role] || 'bg-gray-100 text-gray-700'} focus:outline-none focus:ring-2 focus:ring-primary-green`}
                      >
                        <option value="customer">Customer</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="cashier">Cashier</option>
                        <option value="deliveryGuy">Delivery Guy</option>
                        <option value="stockEmployee">Stock Employee</option>
                      </select>
                    </td>
                    <td className="px-6 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(user._id, user.name, user.isActive !== false)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                          user.isActive !== false
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                        title={user.isActive !== false ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {user.isActive !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        {user.isActive !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5 text-muted-text">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        title="Delete user permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-text text-sm">No users found</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
