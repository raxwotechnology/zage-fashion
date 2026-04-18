import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMyOrders } from '../services/api';
import useAuthStore from '../store/authStore';
import useCurrencyStore from '../store/currencyStore';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { convertPrice, formatPrice } = useCurrencyStore();

  useEffect(() => {
    if (user) {
      const fetchOrders = async () => {
        try {
          const { data } = await getMyOrders();
          setOrders(data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }
  }, [user]);

  const statusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'packed': return 'bg-indigo-100 text-indigo-700';
      case 'shipped': return 'bg-purple-100 text-purple-700';
      case 'out_for_delivery': return 'bg-orange-100 text-orange-700';
      case 'delivered': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!user) {
    return (
      <div className="base-container py-20 text-center">
        <Package size={48} className="text-muted-text mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-dark-navy mb-2 mt-0">Sign in to view orders</h2>
        <Link to="/login" className="text-primary-green font-semibold hover:underline">Sign In</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="base-container py-8">
        <h1 className="text-2xl font-bold text-dark-navy mt-0 mb-6">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-card-border rounded-2xl p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-5 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded w-1/6" />
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="base-container py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-24 h-24 bg-emerald-50 rounded-full mx-auto mb-6 flex items-center justify-center">
            <ShoppingBag size={40} className="text-primary-green" />
          </div>
          <h2 className="text-2xl font-bold text-dark-navy mb-2 mt-0">No orders yet</h2>
          <p className="text-muted-text mb-6">Looks like you haven't placed any orders.</p>
          <Link to="/shop" className="bg-primary-green text-white font-semibold py-3 px-8 rounded-full hover:bg-emerald-600 transition-all inline-block shadow-lg shadow-emerald-200">
            Start Shopping
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="base-container py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-dark-navy mt-0 mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order, i) => (
          <motion.div
            key={order._id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Link to={`/order-confirmation/${order._id}`} className="block bg-white border border-card-border rounded-2xl p-5 hover:shadow-lg hover:border-primary-green transition-all group">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package size={20} className="text-primary-green" />
                  </div>
                  <div>
                    <p className="font-bold text-dark-navy m-0 text-sm">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-muted-text m-0">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' · '}{order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${statusColor(order.orderStatus)}`}>
                    {order.orderStatus.replace('_', ' ')}
                  </span>
                  <span className="font-bold text-dark-navy">{formatPrice(convertPrice(order.totalAmount))}</span>
                  <ChevronRight size={18} className="text-muted-text group-hover:text-primary-green transition-colors" />
                </div>
              </div>

              {/* Item previews */}
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {order.items.slice(0, 4).map((item, j) => (
                  <img key={j} src={item.image || 'https://via.placeholder.com/50'} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ))}
                {order.items.length > 4 && (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-muted-text font-medium">
                    +{order.items.length - 4}
                  </div>
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default OrdersPage;
