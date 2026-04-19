import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, Trash2, X, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getFinancialDashboard, getAdditionalIncomes, addAdditionalIncome, deleteAdditionalIncome } from '../../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/exportUtils';
import navItems from './adminNavItems';

const INCOME_SOURCES = ['Interest', 'Rent Income', 'Commission', 'Refund', 'Insurance Claim', 'Asset Sale', 'Sponsorship', 'Other'];
const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16', '#a855f7', '#64748b', '#e11d48', '#0ea5e9', '#d946ef'];

const AdminFinancials = () => {
  const [dashboard, setDashboard] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [incomeForm, setIncomeForm] = useState({ title: '', source: 'Other', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [dashRes, incRes] = await Promise.all([getFinancialDashboard(), getAdditionalIncomes()]);
      setDashboard(dashRes.data);
      setIncomes(incRes.data);
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddIncome = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addAdditionalIncome({ ...incomeForm, amount: Number(incomeForm.amount) });
      toast.success('Income added');
      setShowIncomeModal(false);
      setIncomeForm({ title: '', source: 'Other', amount: '', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add income');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await deleteAdditionalIncome(id);
      toast.success('Income deleted');
      fetchData();
    } catch (err) { toast.error('Failed to delete'); }
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
            <button onClick={() => {
              const monthlyExportCols = [
                { label: 'Month', accessor: 'month' },
                { label: 'Revenue (Rs.)', accessor: (r) => r.revenue?.toLocaleString() },
                { label: 'Expenses (Rs.)', accessor: (r) => r.expenses?.toLocaleString() },
                { label: 'Profit (Rs.)', accessor: (r) => r.profit?.toLocaleString() },
              ];
              exportToPDF(d.monthlyData || [], monthlyExportCols, 'Financial Report');
            }} className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">📄 PDF</button>
            <button onClick={() => {
              const monthlyExportCols = [
                { label: 'Month', accessor: 'month' },
                { label: 'Revenue (Rs.)', accessor: (r) => r.revenue?.toLocaleString() },
                { label: 'Expenses (Rs.)', accessor: (r) => r.expenses?.toLocaleString() },
                { label: 'Profit (Rs.)', accessor: (r) => r.profit?.toLocaleString() },
              ];
              exportToExcel(d.monthlyData || [], monthlyExportCols, 'financial-report');
            }} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">📊 Excel</button>
            <button onClick={() => {
              const incomeCols = [
                { label: 'Title', accessor: 'title' },
                { label: 'Source', accessor: 'source' },
                { label: 'Amount (Rs.)', accessor: (r) => r.amount?.toLocaleString() },
                { label: 'Date', accessor: (r) => new Date(r.date).toLocaleDateString() },
              ];
              exportToCSV(incomes, incomeCols, 'additional-income');
            }} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">📋 Income CSV</button>
            <button onClick={() => setShowIncomeModal(true)} className="flex items-center gap-2 bg-primary-green hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold transition-all text-sm">
              <Plus size={18} /> Add Income
            </button>
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

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Trend */}
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm">
            <h2 className="font-semibold text-dark-navy mb-4">📈 Monthly Trend (12 months)</h2>
            {d.monthlyData && (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={d.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
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
        {d.monthlyData && (
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm mb-8">
            <h2 className="font-semibold text-dark-navy mb-4">📉 Profit Trend</h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={d.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => `Rs. ${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Net Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Additional Income Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
            <h2 className="font-semibold text-dark-navy">💵 Additional Income Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Title</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Source</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Amount</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-text">Date</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-text">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {incomes.map(inc => (
                  <tr key={inc._id} className="hover:bg-gray-50">
                    <td className="px-6 py-3.5 font-medium text-dark-navy">{inc.title}</td>
                    <td className="px-6 py-3.5"><span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{inc.source}</span></td>
                    <td className="px-6 py-3.5 font-semibold text-emerald-600">Rs. {inc.amount?.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-muted-text">{new Date(inc.date).toLocaleDateString()}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button onClick={() => handleDeleteIncome(inc._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {incomes.length === 0 && <div className="text-center py-8 text-muted-text text-sm">No additional income records</div>}
          </div>
        </div>
      </div>

      {/* Add Income Modal */}
      {showIncomeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setShowIncomeModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-card-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-dark-navy">Add Additional Income</h2>
              <button onClick={() => setShowIncomeModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddIncome} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-navy mb-1">Title *</label>
                <input required value={incomeForm.title} onChange={(e) => setIncomeForm({...incomeForm, title: e.target.value})}
                  className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Source</label>
                  <select value={incomeForm.source} onChange={(e) => setIncomeForm({...incomeForm, source: e.target.value})}
                    className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green">
                    {INCOME_SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-navy mb-1">Amount (Rs.) *</label>
                  <input type="number" required min="0" value={incomeForm.amount} onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                    className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-navy mb-1">Date</label>
                <input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                  className="w-full border border-card-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="flex-1 bg-primary-green text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-50 text-sm">{saving ? 'Adding...' : 'Add Income'}</button>
                <button type="button" onClick={() => setShowIncomeModal(false)} className="flex-1 border border-card-border py-2.5 rounded-xl text-muted-text hover:bg-gray-50 text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminFinancials;
