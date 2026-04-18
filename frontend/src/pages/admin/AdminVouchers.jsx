import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Store, Tag, ShoppingBag, Monitor, Settings, BarChart3, Ticket, Plus, Edit2, Trash2, X, Search, Copy, Check } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import API from '../../services/api';
import { toast } from 'react-toastify';

const navItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/vouchers', label: 'Vouchers', icon: Ticket },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: LayoutDashboard },
  { path: '/cashier-login', label: 'POS Terminal', icon: Monitor },
];

const emptyForm = { code: '', type: 'percentage', value: '', minOrderAmount: '', maxDiscountAmount: '', maxUses: '', description: '', expiresAt: '', source: 'admin' };

const AdminVouchers = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => { fetchVouchers(); }, []);

  const fetchVouchers = async () => {
    try {
      const { data } = await API.get('/loyalty/vouchers');
      setVouchers(data);
    } catch (err) {
      toast.error('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };

  const openEdit = (v) => {
    setEditing(v._id);
    setForm({ code: v.code, type: v.type, value: v.value, minOrderAmount: v.minOrderAmount || '', maxDiscountAmount: v.maxDiscountAmount || '', maxUses: v.maxUses || '', description: v.description || '', expiresAt: v.expiresAt ? v.expiresAt.split('T')[0] : '', source: v.source || 'admin' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, code: form.code.toUpperCase(), value: Number(form.value), minOrderAmount: Number(form.minOrderAmount) || 0, maxDiscountAmount: Number(form.maxDiscountAmount) || undefined, maxUses: Number(form.maxUses) || 9999 };
      if (editing) {
        await API.put(`/loyalty/vouchers/${editing}`, payload);
        toast.success('Voucher updated');
      } else {
        await API.post('/loyalty/vouchers', payload);
        toast.success('Voucher created');
      }
      setShowModal(false);
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save voucher');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this voucher?')) return;
    try {
      await API.delete(`/loyalty/vouchers/${id}`);
      toast.success('Voucher deleted');
      fetchVouchers();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = vouchers.filter(v => v.code?.toLowerCase().includes(search.toLowerCase()) || v.description?.toLowerCase().includes(search.toLowerCase()));

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">🎟️ Voucher Management</h1>
            <p className="text-muted-text text-sm mt-1">{vouchers.length} vouchers</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-green text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all text-sm">
            <Plus size={18} /> Create Voucher
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input placeholder="Search vouchers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-96 border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
        </div>

        <div className="grid gap-4">
          {filtered.map((v) => (
            <div key={v._id} className="bg-white rounded-2xl border border-card-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                    <Ticket size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-dark-navy text-lg tracking-wider">{v.code}</span>
                      <button onClick={() => copyCode(v.code, v._id)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        {copiedId === v._id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-muted-text" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-text mt-0.5">{v.description || 'No description'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(v._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-emerald-50 rounded-xl p-2.5 text-center">
                  <p className="text-muted-text">Discount</p>
                  <p className="font-bold text-emerald-700 text-sm">{v.type === 'percentage' ? `${v.value}%` : `Rs. ${v.value}`}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                  <p className="text-muted-text">Min Order</p>
                  <p className="font-bold text-blue-700 text-sm">Rs. {v.minOrderAmount || 0}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-2.5 text-center">
                  <p className="text-muted-text">Used</p>
                  <p className="font-bold text-amber-700 text-sm">{v.usedCount || 0} / {v.maxUses || '∞'}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-2.5 text-center">
                  <p className="text-muted-text">Expires</p>
                  <p className="font-bold text-purple-700 text-sm">{v.expiresAt ? new Date(v.expiresAt).toLocaleDateString() : 'Never'}</p>
                </div>
                <div className={`rounded-xl p-2.5 text-center ${v.isActive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className="text-muted-text">Status</p>
                  <p className={`font-bold text-sm ${v.isActive ? 'text-emerald-700' : 'text-red-700'}`}>{v.isActive ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-card-border p-12 text-center text-muted-text">
              <Ticket size={40} className="mx-auto mb-3 text-gray-300" />
              <p>No vouchers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-dark-navy">{editing ? 'Edit Voucher' : 'Create Voucher'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-navy mb-1">Voucher Code *</label>
                <input required value={form.code} onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="e.g. SAVE20" className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green font-mono tracking-wider" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Discount Type</label>
                  <select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green">
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (Rs.)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Value *</label>
                  <input type="number" required value={form.value} onChange={(e) => setForm({...form, value: e.target.value})} placeholder={form.type === 'percentage' ? 'e.g. 10' : 'e.g. 500'} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Min Order (Rs.)</label>
                  <input type="number" value={form.minOrderAmount} onChange={(e) => setForm({...form, minOrderAmount: e.target.value})} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={(e) => setForm({...form, maxUses: e.target.value})} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-navy mb-1">Expiry Date</label>
                <input type="date" value={form.expiresAt} onChange={(e) => setForm({...form, expiresAt: e.target.value})} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-navy mb-1">Description</label>
                <input value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="e.g. 10% off for new users" className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-primary-green text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition-all text-sm">{editing ? 'Update' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-card-border py-2.5 rounded-xl font-semibold text-muted-text hover:bg-gray-50 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminVouchers;
