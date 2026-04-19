import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminOrders } from '../../services/api';
import useCurrencyStore from '../../store/currencyStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import navItems from './adminNavItems';

const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#3b82f6', packed: '#6366f1', shipped: '#06b6d4', out_for_delivery: '#0ea5e9', delivered: '#10b981', cancelled: '#ef4444' };

const AdminReports = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { convertPrice, formatPrice } = useCurrencyStore();

  useEffect(() => {
    const fetch = async () => {
      try { const { data } = await getAdminOrders(); setOrders(data); }
      catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const active = orders.filter(o => o.orderStatus !== 'cancelled');
  const todayRev = active.filter(o => new Date(o.createdAt) >= today).reduce((s, o) => s + (o.totalAmount || 0), 0);
  const weekRev = active.filter(o => new Date(o.createdAt) >= weekStart).reduce((s, o) => s + (o.totalAmount || 0), 0);
  const monthRev = active.filter(o => new Date(o.createdAt) >= monthStart).reduce((s, o) => s + (o.totalAmount || 0), 0);
  const totalRev = active.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const avgOrder = active.length ? totalRev / active.length : 0;

  // Daily sales (14 days)
  const dailySales = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const dayOrders = active.filter(o => { const od = new Date(o.createdAt); return od.toDateString() === d.toDateString(); });
    dailySales.push({ date: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), revenue: dayOrders.reduce((s, o) => s + (o.totalAmount || 0), 0), orders: dayOrders.length });
  }

  // Status distribution
  const statusDist = Object.entries(orders.reduce((a, o) => { a[o.orderStatus] = (a[o.orderStatus] || 0) + 1; return a; }, {})).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value, fill: STATUS_COLORS[name] || '#666' }));

  // Top products
  const prodMap = {};
  active.forEach(o => o.items?.forEach(i => { const k = i.name || 'Unknown'; if (!prodMap[k]) prodMap[k] = { name: k, revenue: 0, qty: 0 }; prodMap[k].revenue += (i.price || 0) * (i.quantity || 1); prodMap[k].qty += i.quantity || 1; }));
  const topProducts = Object.values(prodMap).sort((a, b) => b.revenue - a.revenue).slice(0, 8);

  const exportCSV = () => {
    const rows = [['Order ID', 'Customer', 'Date', 'Amount', 'Status'].join(','), ...orders.map(o => [o._id.slice(-8), o.userId?.name || 'N/A', new Date(o.createdAt).toLocaleDateString(), o.totalAmount?.toFixed(2), o.orderStatus].join(','))].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'sales_report.csv'; a.click();
    toast.success('Report downloaded');
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Admin Panel"><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-dark-navy">📊 Reports & Analytics</h1><p className="text-muted-text text-sm mt-1">Sales, profit & performance</p></div>
          <button onClick={exportCSV} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors shadow-md">📥 Export CSV</button>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Today', value: todayRev, grad: 'from-emerald-400 to-teal-500' },
            { label: 'This Week', value: weekRev, grad: 'from-blue-400 to-indigo-500' },
            { label: 'This Month', value: monthRev, grad: 'from-amber-400 to-orange-500' },
            { label: 'All Time', value: totalRev, grad: 'from-violet-400 to-purple-500' },
            { label: 'Avg Order', value: avgOrder, grad: 'from-rose-400 to-pink-500' },
          ].map(c => (
            <div key={c.label} className="bg-white rounded-2xl border border-card-border p-4 shadow-sm">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} flex items-center justify-center mb-2`}><DollarSign size={16} className="text-white" /></div>
              <p className="text-xl font-bold text-dark-navy">{formatPrice(convertPrice(c.value))}</p>
              <p className="text-xs text-muted-text">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4">📈 Sales Trend (14 Days)</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatPrice(convertPrice(v))} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4">🥧 Order Status</h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={statusDist} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusDist.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        {topProducts.length > 0 && (
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4">🏆 Top Selling Products</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => formatPrice(convertPrice(v))} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 6, 6, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
