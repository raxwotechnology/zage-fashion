import { useState, useEffect, useMemo } from 'react';
import { FileDown } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import {
  getAdminOrders, getAdminProducts, getAdminUsers, getCustomerReturns, getExpenses, getAdditionalIncomes,
} from '../../services/api';
import { toast } from 'react-toastify';
import navItems from './adminNavItems';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';

const AdminReports = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [returnsData, setReturnsData] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [returnStatusFilter, setReturnStatusFilter] = useState('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
  const [incomeSourceFilter, setIncomeSourceFilter] = useState('all');

  useEffect(() => {
    const fetch = async () => {
      try { const { data } = await getAdminOrders(); setOrders(data); }
      catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    };
    const fetchAll = async () => {
      try {
        const [u, p, o, r, e, i] = await Promise.all([
          getAdminUsers(),
          getAdminProducts(),
          getAdminOrders(),
          getCustomerReturns({}),
          getExpenses({}),
          getAdditionalIncomes({}),
        ]);
        setUsers(u.data || []);
        setProducts(p.data || []);
        setOrders(o.data || []);
        setReturnsData(r.data || []);
        setExpenses(e.data || []);
        setIncomes(i.data || []);
      } catch {
        toast.error('Failed to load report datasets');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filteredUsers = useMemo(
    () => (roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter)),
    [users, roleFilter]
  );
  const filteredProducts = useMemo(
    () => (categoryFilter === 'all' ? products : products.filter((p) => (p.categoryId?.name || 'Uncategorized') === categoryFilter)),
    [products, categoryFilter]
  );
  const filteredOrders = useMemo(
    () => (orderStatusFilter === 'all' ? orders : orders.filter((o) => o.orderStatus === orderStatusFilter)),
    [orders, orderStatusFilter]
  );
  const filteredReturns = useMemo(
    () => (returnStatusFilter === 'all' ? returnsData : returnsData.filter((r) => r.status === returnStatusFilter)),
    [returnsData, returnStatusFilter]
  );
  const filteredExpenses = useMemo(
    () => (expenseCategoryFilter === 'all' ? expenses : expenses.filter((e) => e.category === expenseCategoryFilter)),
    [expenses, expenseCategoryFilter]
  );
  const filteredIncomes = useMemo(
    () => (incomeSourceFilter === 'all' ? incomes : incomes.filter((i) => i.source === incomeSourceFilter)),
    [incomes, incomeSourceFilter]
  );

  const categories = [...new Set(products.map((p) => p.categoryId?.name || 'Uncategorized'))];
  const orderStatuses = [...new Set(orders.map((o) => o.orderStatus))];
  const returnStatuses = [...new Set(returnsData.map((r) => r.status))];
  const expenseCategories = [...new Set(expenses.map((e) => e.category))];
  const incomeSources = [...new Set(incomes.map((i) => i.source))];

  const exportCurrent = (type) => {
    const cfg = {
      users: {
        rows: filteredUsers,
        cols: [
          { label: 'Name', accessor: 'name' }, { label: 'Email', accessor: 'email' }, { label: 'Role', accessor: 'role' },
          { label: 'Phone', accessor: 'phone' }, { label: 'Active', accessor: (r) => (r.isActive ? 'Yes' : 'No') },
        ],
        title: 'Users Report',
      },
      products: {
        rows: filteredProducts,
        cols: [
          { label: 'Name', accessor: 'name' }, { label: 'Category', accessor: (r) => r.categoryId?.name || 'Uncategorized' },
          { label: 'Price', accessor: (r) => Number(r.price || 0).toFixed(2) }, { label: 'Stock', accessor: 'stock' },
          { label: 'Status', accessor: 'status' },
        ],
        title: 'Products Report',
      },
      orders: {
        rows: filteredOrders,
        cols: [
          { label: 'Order ID', accessor: (r) => String(r._id).slice(-8).toUpperCase() }, { label: 'Customer', accessor: (r) => r.userId?.name || 'N/A' },
          { label: 'Status', accessor: 'orderStatus' }, { label: 'Payment', accessor: 'paymentStatus' }, { label: 'Amount', accessor: (r) => Number(r.totalAmount || 0).toFixed(2) },
        ],
        title: 'Orders Report',
      },
      returns: {
        rows: filteredReturns,
        cols: [
          { label: 'RMA', accessor: 'holdBillNo' }, { label: 'Order', accessor: (r) => String(r.orderId?._id || r.orderId).slice(-8).toUpperCase() },
          { label: 'Customer', accessor: (r) => r.customerId?.name || 'N/A' }, { label: 'Status', accessor: 'status' },
        ],
        title: 'Returns Report',
      },
      expenses: {
        rows: filteredExpenses,
        cols: [
          { label: 'Title', accessor: 'title' }, { label: 'Category', accessor: 'category' },
          { label: 'Amount', accessor: (r) => Number(r.amount || 0).toFixed(2) }, { label: 'Status', accessor: 'status' },
        ],
        title: 'Expenses Report',
      },
      incomes: {
        rows: filteredIncomes,
        cols: [
          { label: 'Title', accessor: 'title' }, { label: 'Source', accessor: 'source' },
          { label: 'Amount', accessor: (r) => Number(r.amount || 0).toFixed(2) }, { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
        ],
        title: 'Incomes Report',
      },
    }[activeTab];
    if (!cfg) return;
    if (type === 'csv') exportToCSV(cfg.rows, cfg.cols, cfg.title.toLowerCase().replace(/\s+/g, '-'));
    if (type === 'excel') exportToExcel(cfg.rows, cfg.cols, cfg.title.toLowerCase().replace(/\s+/g, '-'));
    if (type === 'pdf') exportToPDF(cfg.rows, cfg.cols, cfg.title);
  };

  if (loading) return <DashboardLayout navItems={navItems} title="Admin Panel"><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <div>
        <div className="flex items-center justify-between mb-6 gap-3">
          <div><h1 className="text-2xl font-bold text-dark-navy">📊 Categorized Reports</h1><p className="text-muted-text text-sm mt-1">Filter by category/role and export as PDF or Excel</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportCurrent('csv')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200">CSV</button>
            <button onClick={() => exportCurrent('excel')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Excel</button>
            <button onClick={() => exportCurrent('pdf')} className="px-3 py-2 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"><FileDown size={14} />PDF</button>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap mb-5">
          {[
            ['users', 'Users/Employees'],
            ['products', 'Products'],
            ['orders', 'Orders'],
            ['returns', 'Returns'],
            ['expenses', 'Expenses'],
            ['incomes', 'Incomes'],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${activeTab === id ? 'bg-primary-green text-white' : 'bg-white border border-card-border text-muted-text hover:bg-gray-50'}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
          {activeTab === 'users' && (
            <>
              <div className="mb-3">
                <label className="text-xs text-muted-text mr-2">Role</label>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-sm">
                  {['all', 'customer', 'cashier', 'manager', 'deliveryGuy', 'stockEmployee', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-text">Total: {filteredUsers.length}</p>
            </>
          )}
          {activeTab === 'products' && (
            <>
              <div className="mb-3">
                <label className="text-xs text-muted-text mr-2">Category</label>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-sm">
                  <option value="all">all</option>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-text">Total: {filteredProducts.length}</p>
            </>
          )}
          {activeTab === 'orders' && (
            <>
              <div className="mb-3">
                <label className="text-xs text-muted-text mr-2">Status</label>
                <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-sm">
                  <option value="all">all</option>
                  {orderStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-text">Total: {filteredOrders.length}</p>
            </>
          )}
          {activeTab === 'returns' && (
            <>
              <div className="mb-3">
                <label className="text-xs text-muted-text mr-2">Status</label>
                <select value={returnStatusFilter} onChange={(e) => setReturnStatusFilter(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-sm">
                  <option value="all">all</option>
                  {returnStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-text">Total: {filteredReturns.length}</p>
            </>
          )}
          {activeTab === 'expenses' && (
            <>
              <div className="mb-3">
                <label className="text-xs text-muted-text mr-2">Category</label>
                <select value={expenseCategoryFilter} onChange={(e) => setExpenseCategoryFilter(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-sm">
                  <option value="all">all</option>
                  {expenseCategories.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-text">Total: {filteredExpenses.length}</p>
            </>
          )}
          {activeTab === 'incomes' && (
            <>
              <div className="mb-3">
                <label className="text-xs text-muted-text mr-2">Source</label>
                <select value={incomeSourceFilter} onChange={(e) => setIncomeSourceFilter(e.target.value)} className="border border-card-border rounded-lg px-3 py-2 text-sm">
                  <option value="all">all</option>
                  {incomeSources.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <p className="text-sm text-muted-text">Total: {filteredIncomes.length}</p>
            </>
          )}
          <div className="mt-4 text-xs text-muted-text">
            Use the export buttons (CSV / Excel / PDF) to download the currently filtered report.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminReports;
