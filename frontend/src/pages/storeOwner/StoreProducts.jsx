import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Plus, Edit2, Trash2, X, Search, Eye, EyeOff, Users, Calendar, CreditCard, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getMyStoreProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import { toast } from 'react-toastify';

const navItems = [
  { path: '/manager', label: 'Overview', icon: LayoutDashboard },
  { path: '/manager/products', label: 'Products', icon: Package },
  { path: '/manager/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/manager/employees', label: 'Employees', icon: Users },
  { path: '/manager/attendance', label: 'Attendance', icon: Clock },
  { path: '/manager/leaves', label: 'Leaves', icon: Calendar },
  { path: '/manager/payroll', label: 'Payroll', icon: CreditCard },
  { path: '/pos', label: 'POS Terminal', icon: LayoutDashboard },
];

const emptyForm = {
  name: '', categoryId: '', description: '', price: '', mrp: '', discount: '', unit: 'kg',
  stock: '', images: '', isFeatured: false, isOnSale: false, status: 'active',
};

const StoreProducts = () => {
  const [products, setProducts] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([getMyStoreProducts(), getCategories()]);
      setProducts(prodRes.data.products);
      setStoreInfo(prodRes.data.store);
      setCategories(catRes.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name,
      categoryId: product.categoryId?._id || '',
      description: product.description || '',
      price: product.price,
      mrp: product.mrp || '',
      discount: product.discount || '',
      unit: product.unit || 'kg',
      stock: product.stock,
      images: (product.images || []).join(', '),
      isFeatured: product.isFeatured || false,
      isOnSale: product.isOnSale || false,
      status: product.status || 'active',
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
        storeId: storeInfo?._id,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        toast.success('Product updated');
      } else {
        await createProduct(payload);
        toast.success('Product created');
      }
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Manager Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} title="Store Dashboard">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">Products</h1>
            <p className="text-muted-text text-sm mt-1">{products.length} products in your store</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary-green text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition-all text-sm"
          >
            <Plus size={18} /> Add Product
          </button>
        </div>

        {/* Low Stock Alerts */}
        {products.filter(p => p.stock <= 10).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <h3 className="font-semibold text-amber-800 text-sm mb-2 flex items-center gap-2">
              ⚠️ Low Stock Alerts ({products.filter(p => p.stock <= 10).length} items)
            </h3>
            <div className="flex flex-wrap gap-2">
              {products.filter(p => p.stock <= 10).map(p => (
                <button key={p._id} onClick={() => openEdit(p)}
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    p.stock === 0 ? 'bg-red-100 border-red-200 text-red-700 hover:bg-red-200' :
                    p.stock <= 5 ? 'bg-orange-100 border-orange-200 text-orange-700 hover:bg-orange-200' :
                    'bg-amber-100 border-amber-200 text-amber-700 hover:bg-amber-200'
                  }`}>
                  {p.stock === 0 ? '🔴' : p.stock <= 5 ? '🟠' : '🟡'} {p.name} — {p.stock} left
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
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

        {/* Products Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Product</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Category</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Price</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Stock</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/40'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-dark-navy">{product.name}</p>
                          <p className="text-xs text-muted-text">{product.unit}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-muted-text">{product.categoryId?.name || '—'}</td>
                    <td className="px-6 py-3.5">
                      <span className="font-semibold">{useCurrencyStore.getState().getProductPrice(product)}</span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-muted-text line-through ml-1">${product.mrp?.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`font-semibold ${product.stock <= 5 ? 'text-red-500' : 'text-dark-navy'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${product.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(product)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(product._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-text text-sm">No products found</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-dark-navy">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-dark-navy mb-1">Product Name *</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Category *</label>
                  <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Unit</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green">
                    {['kg', 'g', 'L', 'ml', 'pcs', 'pack', 'dozen', 'bunch'].map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Price *</label>
                  <input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">MRP</label>
                  <input type="number" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Stock *</label>
                  <input type="number" required value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Discount %</label>
                  <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-dark-navy mb-1">Description</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green resize-none" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-dark-navy mb-1">Image URLs <span className="text-muted-text font-normal">(comma separated)</span></label>
                  <input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} className="w-4 h-4 rounded text-primary-green focus:ring-primary-green" />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={form.isOnSale} onChange={(e) => setForm({ ...form, isOnSale: e.target.checked })} className="w-4 h-4 rounded text-primary-green focus:ring-primary-green" />
                    On Sale
                  </label>
                </div>
                {editingId && (
                  <div>
                    <label className="block text-sm font-medium text-dark-navy mb-1">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green">
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-primary-green text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-600 transition-all disabled:opacity-50 text-sm">
                  {saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border border-card-border py-2.5 rounded-xl font-semibold text-muted-text hover:bg-gray-50 transition-all text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default StoreProducts;
