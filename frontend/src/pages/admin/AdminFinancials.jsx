import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getFinancialDashboard } from '../../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import navItems from './adminNavItems';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7', '#64748b', '#e11d48', '#0ea5e9', '#d946ef'];

const AdminFinancials = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly'); // daily | monthly | yearly
  const [range, setRange] = useState({ startDate: '', endDate: '' });

  const fetchData = async () => {
    try {
      const params = {
        period,
        ...(range.startDate ? { startDate: range.startDate } : {}),
        ...(range.endDate ? { endDate: range.endDate } : {}),
      };
      const { data } = await getFinancialDashboard(params);
      setDashboard(data);
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period, range.startDate, range.endDate]);

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} title="Admin Panel">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const d = dashboard || {};
  const profitPositive = (d.netProfit || 0) >= 0;

  // Prepare pie chart data from expense categories
  const pieData = d.expenseByCategory
    ? Object.entries(d.expenseByCategory).map(([name, value], i) => ({ name, value, fill: PIE_COLORS[i % PIE_COLORS.length] }))
    : [];

  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy">📊 Financial Overview</h1>
            <p className="text-muted-text text-sm mt-1">Revenue, expenses, and net profit</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="border border-card-border rounded-xl py-2.5 px-3 text-sm bg-white">
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input type="date" value={range.startDate} onChange={(e) => setRange((r) => ({ ...r, startDate: e.target.value }))} className="border border-card-border rounded-xl py-2.5 px-3 text-sm bg-white" />
            <input type="date" value={range.endDate} onChange={(e) => setRange((r) => ({ ...r, endDate: e.target.value }))} className="border border-card-border rounded-xl py-2.5 px-3 text-sm bg-white" />
            <button onClick={() => {
              const monthlyExportCols = [
                { label: 'Month', accessor: 'month' },
                { label: 'Revenue (Rs.)', accessor: (r) => r.revenue?.toLocaleString() },
                { label: 'Expenses (Rs.)', accessor: (r) => r.expenses?.toLocaleString() },
                { label: 'Profit (Rs.)', accessor: (r) => r.profit?.toLocaleString() },
              ];
              exportToPDF(d.series || d.monthlyData || [], monthlyExportCols, 'Financial Report');
            }} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">📄 PDF</button>
            <button onClick={() => {
              const monthlyExportCols = [
                { label: 'Month', accessor: 'month' },
                { label: 'Revenue (Rs.)', accessor: (r) => r.revenue?.toLocaleString() },
                { label: 'Expenses (Rs.)', accessor: (r) => r.expenses?.toLocaleString() },
                { label: 'Profit (Rs.)', accessor: (r) => r.profit?.toLocaleString() },
              ];
              exportToExcel(d.series || d.monthlyData || [], monthlyExportCols, 'financial-report');
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">📊 Excel</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center"><ArrowUpRight size={16} className="text-white" /></div>
            </div>
            <p className="text-2xl font-bold text-dark-navy">Rs. {(d.totalRevenue || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-text mt-1">Total Revenue</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center"><ArrowDownRight size={16} className="text-white" /></div>
            </div>
            <p className="text-2xl font-bold text-dark-navy">Rs. {(d.totalExpenses || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-text mt-1">Total Expenses</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center"><DollarSign size={16} className="text-white" /></div>
            </div>
            <p className="text-2xl font-bold text-dark-navy">Rs. {(d.totalAdditionalIncome || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-text mt-1">Other Income</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${profitPositive ? 'from-emerald-500 to-teal-600' : 'from-red-500 to-rose-600'} flex items-center justify-center`}>
                {profitPositive ? <TrendingUp size={16} className="text-white" /> : <TrendingDown size={16} className="text-white" />}
              </div>
            </div>
            <p className={`text-2xl font-bold ${profitPositive ? 'text-emerald-600' : 'text-red-600'}`}>Rs. {Math.abs(d.netProfit || 0).toLocaleString()}</p>
            <p className="text-xs text-muted-text mt-1">Net {profitPositive ? 'Profit' : 'Loss'}</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <p className="text-xs text-muted-text">Pending Bills</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">Rs. {(d.pendingExpenses || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <p className="text-xs text-muted-text">Items Sold</p>
            <p className="text-2xl font-bold text-dark-navy mt-1">{(d.totalItemsSold || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <p className="text-xs text-muted-text">POS Revenue</p>
            <p className="text-2xl font-bold text-dark-navy mt-1">Rs. {(d.posRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
            <p className="text-xs text-muted-text">Online Revenue</p>
            <p className="text-2xl font-bold text-dark-navy mt-1">Rs. {(d.onlineRevenue || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4">📈 Trend</h2>
            {(d.series || d.monthlyData) && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={d.series || d.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#3b82f6" name="Profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4">🥧 Expense Breakdown</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={95} paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-text text-sm">No expense data</div>
            )}
          </div>
        </div>

        {/* Profit/Loss Trend Line */}
        {(d.series || d.monthlyData) && (
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm mb-8">
            <h2 className="font-semibold text-dark-navy mb-4">📉 Profit Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d.series || d.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default AdminFinancials;
