import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Store, Tag, ShoppingBag, TrendingUp, DollarSign, Package, Clock, CheckCircle, Monitor } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminStats } from '../../services/api';
import { Link } from 'react-router-dom';

const navItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/cashier-login', label: 'POS Terminal', icon: Monitor },
];

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await getAdminStats();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Admin Panel">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const cards = [
    { label: 'Total Users', value: stats?.users || 0, icon: Users, gradient: 'from-violet-400 to-purple-500', shadow: 'shadow-violet-200' },
    { label: 'Total Stores', value: stats?.stores || 0, icon: Store, gradient: 'from-blue-400 to-indigo-500', shadow: 'shadow-blue-200' },
    { label: 'Total Products', value: stats?.products || 0, icon: Package, gradient: 'from-emerald-400 to-teal-500', shadow: 'shadow-emerald-200' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, gradient: 'from-amber-400 to-orange-500', shadow: 'shadow-amber-200' },
    { label: 'Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, gradient: 'from-rose-400 to-pink-500', shadow: 'shadow-rose-200' },
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock, gradient: 'from-cyan-400 to-sky-500', shadow: 'shadow-cyan-200' },
  ];

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-dark-navy">Admin Dashboard</h1>
          <p className="text-muted-text text-sm mt-1">Platform overview and key metrics</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl border border-card-border p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow} group-hover:scale-110 transition-transform`}>
                  <card.icon size={22} className="text-white" />
                </div>
                <TrendingUp size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-3xl font-bold text-dark-navy">{card.value}</p>
              <p className="text-sm text-muted-text mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Manage Users', path: '/admin/users', icon: Users, color: 'text-violet-500 bg-violet-50 hover:bg-violet-100' },
            { label: 'Manage Stores', path: '/admin/stores', icon: Store, color: 'text-blue-500 bg-blue-50 hover:bg-blue-100' },
            { label: 'Manage Categories', path: '/admin/categories', icon: Tag, color: 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' },
            { label: 'View Orders', path: '/admin/orders', icon: ShoppingBag, color: 'text-amber-500 bg-amber-50 hover:bg-amber-100' },
            { label: 'POS Terminal', path: '/cashier-login', icon: Monitor, color: 'text-teal-500 bg-teal-50 hover:bg-teal-100' },
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 p-4 rounded-2xl font-medium text-sm transition-all ${link.color}`}
            >
              <link.icon size={20} />
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;
