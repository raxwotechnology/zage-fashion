import { useState, useEffect } from 'react';
import { LayoutDashboard, Package, ShoppingBag, Filter, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getStoreOrders, updateOrderStatus } from '../../services/api';
import { toast } from 'react-toastify';

const navItems = [
  { path: '/store-owner', label: 'Overview', icon: LayoutDashboard },
  { path: '/store-owner/products', label: 'Products', icon: Package },
  { path: '/store-owner/orders', label: 'Orders', icon: ShoppingBag },
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

const statusFlow = ['pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const StoreOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    try {
      const { data } = await getStoreOrders();
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
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.orderStatus === filter);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Store Dashboard">
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
            <h1 className="text-2xl font-bold text-dark-navy">Orders</h1>
            <p className="text-muted-text text-sm mt-1">{orders.length} total orders</p>
          </div>
        </div>

        {/* Filter Tabs */}
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
              {status === 'all' ? 'All' : status.replace(/_/g, ' ')}
              {status !== 'all' && ` (${orders.filter((o) => o.orderStatus === status).length})`}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-card-border p-12 text-center text-muted-text text-sm">
              No orders found for this filter
            </div>
          )}

          {filtered.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden transition-shadow hover:shadow-md">
              {/* Order Header */}
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-mono text-xs text-muted-text">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="font-semibold text-dark-navy">{order.userId?.name || 'N/A'}</p>
                    <p className="text-xs text-muted-text">{order.userId?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-dark-navy">${order.totalAmount?.toFixed(2)}</p>
                    <p className="text-xs text-muted-text">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusColors[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {order.orderStatus?.replace(/_/g, ' ')}
                  </span>
                  <ChevronDown size={18} className={`text-muted-text transition-transform ${expandedId === order._id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === order._id && (
                <div className="px-6 pb-5 border-t border-card-border pt-4">
                  {/* Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-dark-navy mb-2">Items</h4>
                    <div className="space-y-2">
                      {order.items?.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <img src={item.image || 'https://via.placeholder.com/35'} alt="" className="w-9 h-9 rounded-lg object-cover" />
                            <span>{item.name} × {item.quantity}</span>
                          </div>
                          <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  {order.deliveryAddress && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-dark-navy mb-1">Delivery Address</h4>
                      <p className="text-sm text-muted-text">
                        {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} {order.deliveryAddress.zipCode}
                      </p>
                    </div>
                  )}

                  {/* Update Status */}
                  <div className="flex items-center gap-3 pt-2">
                    <label className="text-sm font-medium text-dark-navy">Update Status:</label>
                    <select
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                      className="border border-card-border rounded-xl py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green"
                    >
                      {statusFlow.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default StoreOrders;
