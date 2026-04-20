import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminProducts, getCategories, getStores, createProduct, updateProduct, deleteProduct } from '../../services/api';
import { toast } from 'react-toastify';
import navItems from './adminNavItems';

const emptyForm = {
  name: '', categoryId: '', description: '', price: '', mrp: '', discount: '', unit: 'kg',
  stock: '', images: '', isFeatured: false, isOnSale: false, allowKokoOnline: true, allowKokoPos: true, status: 'active', storeId: '',
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [prodRes, catRes, storesRes] = await Promise.all([getAdminProducts(), getCategories(), getStores()]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
      setStores(storesRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load products';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || '',
      categoryId: product.categoryId?._id || '',
      description: product.description || '',
      price: product.price || '',
      mrp: product.mrp || '',
      discount: product.discount || '',
      unit: product.unit || 'kg',
      stock: product.stock || 0,
      images: (product.images || []).join(', '),
      isFeatured: !!product.isFeatured,
      isOnSale: !!product.isOnSale,
      allowKokoOnline: product.allowKokoOnline !== false,
      allowKokoPos: product.allowKokoPos !== false,
      status: product.status || 'active',
      storeId: product.storeId?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp) || Number(form.price),
        discount: Number(form.discount) || 0,
        stock: Number(form.stock),
        images: form.images ? form.images.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };
      if (!payload.storeId) {
        toast.error('Store is required');
        return;
      }
      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const filtered = products.filter((p) => p.name?.toLowerCase().includes(search.toLowerCase()));

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
        {error && <div className="mb-4 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">{error}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">Products</h1>
            <p className="text-muted-text text-sm mt-1">{products.length} total products</p>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-primary-green text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600">
            <Plus size={18} /> Add Product
          </button>
        </div>

        <div className="relative mb-6">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-80 border border-card-border rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
          />
        </div>

        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Product</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Store</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Price</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Stock</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.map((product) => (
                  <tr key={product._id}>
                    <td className="px-6 py-3.5">
                      <div className="font-medium text-dark-navy">{product.name}</div>
                      <div className="text-xs text-muted-text">{product.categoryId?.name || '-'}</div>
                    </td>
                    <td className="px-6 py-3.5 text-muted-text">{product.storeId?.name || '-'}</td>
                    <td className="px-6 py-3.5">Rs. {Number(product.price || 0).toFixed(2)}</td>
                    <td className="px-6 py-3.5">{product.stock}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{product.status}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-card-border flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
                <h2 className="text-lg font-bold text-dark-navy">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark-navy mb-1">Product Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-navy mb-1">Category *</label>
                    <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm">
                      <option value="">Select category</option>
                      {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-navy mb-1">Store *</label>
                    <select required value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm">
                      <option value="">Select store</option>
                      {stores.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-navy mb-1">Price *</label>
                    <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-navy mb-1">Stock *</label>
                    <input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-dark-navy mb-1">Description</label>
                    <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm resize-none" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="flex-1 bg-primary-green text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50">
                    {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-card-border py-2.5 rounded-xl font-semibold text-muted-text hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminProducts;
