import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Store, Tag, ShoppingBag, ChevronDown, Monitor } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAdminOrders, updateOrderStatus } from '../../services/api';
import { toast } from 'react-toastify';

const navItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/cashier-login', label: 'POS Terminal', icon: Monitor },
];

const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  packed: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-cyan-100 text-cyan-700',
  out_for_delivery: 'bg-teal-100 text-teal-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
};

const paymentColors = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-600',
};

const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    try {
      const { data } = await getAdminOrders();
      setOrders(data);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, { orderStatus: newStatus });
      toast.success('Status updated');
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.orderStatus === filter);

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
          <h1 className="text-2xl font-bold text-dark-navy">All Orders</h1>
          <p className="text-muted-text text-sm mt-1">{orders.length} total platform orders</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', ...statusFlow].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === status
                  ? 'bg-primary-green text-white shadow-lg shadow-emerald-200'
                  : 'bg-white border border-card-border text-muted-text hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? `All (${orders.length})` : `${status.replace(/_/g, ' ')} (${orders.filter((o) => o.orderStatus === status).length})`}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Order</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Customer</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Store</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Total</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Payment</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}>
                    <td className="px-6 py-3.5 font-mono text-xs">#{order._id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-dark-navy">{order.userId?.name || 'N/A'}</p>
                      <p className="text-xs text-muted-text">{order.userId?.email}</p>
                    </td>
                    <td className="px-6 py-3.5 text-muted-text">{order.storeId?.name || 'N/A'}</td>
                    <td className="px-6 py-3.5 font-semibold">${order.totalAmount?.toFixed(2)}</td>
                    <td className="px-6 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${paymentColors[order.paymentStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <select
                        value={order.orderStatus}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 appearance-none cursor-pointer ${statusColors[order.orderStatus]} focus:outline-none focus:ring-2 focus:ring-primary-green`}
                      >
                        {statusFlow.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-3.5 text-muted-text">{new Date(order.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-text text-sm">No orders found</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOrders;
