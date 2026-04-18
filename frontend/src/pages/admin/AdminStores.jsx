import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Store, Tag, ShoppingBag, ToggleLeft, ToggleRight, ExternalLink, Monitor, Ticket, BarChart3 } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminStores, toggleStoreStatus } from '../../services/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

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

const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    try {
      const { data } = await getAdminStores();
      setStores(data);
    } catch (err) {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStores(); }, []);

  const handleToggle = async (storeId) => {
    try {
      await toggleStoreStatus(storeId);
      toast.success('Store status updated');
      fetchStores();
    } catch (err) {
      toast.error('Failed to update store');
    }
  };

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-dark-navy">Store Management</h1>
          <p className="text-muted-text text-sm mt-1">{stores.length} registered stores</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stores.map((store) => (
            <div key={store._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${store.isActive ? 'border-card-border' : 'border-red-200 opacity-75'}`}>
              {/* Banner */}
              <div className="h-28 bg-gradient-to-br from-emerald-400 to-teal-500 relative">
                {store.bannerImage && (
                  <img src={store.bannerImage} alt="" className="w-full h-full object-cover" />
                )}
                <div className="absolute top-3 right-3">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full ${store.isActive ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {store.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  {store.logo ? (
                    <img src={store.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <Store size={18} className="text-primary-green" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-dark-navy">{store.name}</h3>
                    <p className="text-xs text-muted-text">{store.city || 'No city'}</p>
                  </div>
                </div>

                <div className="text-xs text-muted-text space-y-1 mb-4">
                  <p><span className="font-medium text-dark-navy">Manager:</span> {store.managerId?.name || store.ownerId?.name || 'N/A'}</p>
                  <p><span className="font-medium text-dark-navy">Email:</span> {store.managerId?.email || store.ownerId?.email || 'N/A'}</p>
                  <p><span className="font-medium text-dark-navy">Phone:</span> {store.phone || '—'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggle(store._id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center ${
                      store.isActive
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {store.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    {store.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link
                    to={`/store/${store._id}`}
                    className="p-2 rounded-xl border border-card-border hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink size={14} className="text-muted-text" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="bg-white rounded-2xl border border-card-border p-12 text-center text-muted-text text-sm">
            No stores registered yet
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminStores;
