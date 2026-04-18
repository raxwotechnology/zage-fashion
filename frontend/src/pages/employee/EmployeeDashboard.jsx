import { useState, useEffect } from 'react';
import { LayoutDashboard, User, Clock, Calendar, CreditCard, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import useAuthStore from '../../store/authStore';
import getEmployeeNavItems from './employeeNav';
import API from '../../services/api';
import { toast } from 'react-toastify';

const EmployeeDashboard = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ attendanceCount: 0, leaveBalance: 14, lastSalary: null, todayCheckedIn: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const now = new Date();
        const [attendanceRes, leavesRes, salaryRes] = await Promise.allSettled([
          API.get('/hr/attendance', { params: { month: now.getMonth() + 1, year: now.getFullYear() } }),
          API.get('/hr/leaves'),
          API.get(`/payroll/history/me`),
        ]);

        const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data : [];
        const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value.data : [];
        const salary = salaryRes.status === 'fulfilled' ? salaryRes.value.data : [];

        const today = new Date().toDateString();
        const todayRecord = attendance.find(a => new Date(a.date).toDateString() === today);
        const approvedLeaves = leaves.filter(l => l.status === 'approved');
        const usedDays = approvedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0);

        setStats({
          attendanceCount: attendance.length,
          leaveBalance: Math.max(0, 14 - usedDays),
          usedLeaves: usedDays,
          pendingLeaves: leaves.filter(l => l.status === 'pending').length,
          lastSalary: salary.length > 0 ? salary[0] : null,
          todayCheckedIn: !!todayRecord,
          todayCheckedOut: !!(todayRecord?.checkOut),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleCheckIn = async () => {
    try {
      await API.post('/hr/attendance/check-in');
      toast.success('Checked in successfully! ✅');
      setStats(s => ({ ...s, todayCheckedIn: true }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await API.post('/hr/attendance/check-out');
      toast.success('Checked out! Have a good day 👋');
      setStats(s => ({ ...s, todayCheckedOut: true }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    }
  };

  const roleLabel = user?.role === 'deliveryGuy' ? 'Delivery Rider' : user?.role === 'cashier' ? 'Cashier' : user?.role === 'stockEmployee' ? 'Stock Employee' : user?.role;

  if (loading) {
    return (
      <DashboardLayout navItems={getEmployeeNavItems(user?.role)} title="Employee Portal">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={getEmployeeNavItems(user?.role)} title="Employee Portal">
      <div className="space-y-6">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
              <p className="text-emerald-100 mt-1">{roleLabel} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold backdrop-blur-sm">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>

          {/* Quick Check-in/out */}
          <div className="mt-4 flex gap-3">
            {!stats.todayCheckedIn ? (
              <button onClick={handleCheckIn} className="bg-white text-emerald-600 font-semibold px-6 py-2.5 rounded-xl hover:bg-emerald-50 transition-colors shadow-md flex items-center gap-2">
                <Clock size={16} /> Check In
              </button>
            ) : !stats.todayCheckedOut ? (
              <button onClick={handleCheckOut} className="bg-white/20 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-white/30 transition-colors backdrop-blur-sm flex items-center gap-2 border border-white/30">
                <CheckCircle size={16} /> Check Out
              </button>
            ) : (
              <span className="bg-white/20 text-white px-4 py-2.5 rounded-xl backdrop-blur-sm flex items-center gap-2 border border-white/30">
                <CheckCircle size={16} /> Shift Complete ✅
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-card-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-text font-medium uppercase tracking-wide">This Month</span>
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center"><Clock size={16} className="text-blue-600" /></div>
            </div>
            <p className="text-2xl font-bold text-dark-navy">{stats.attendanceCount}</p>
            <p className="text-xs text-muted-text">Days Worked</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-card-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-text font-medium uppercase tracking-wide">Leave Balance</span>
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center"><Calendar size={16} className="text-amber-600" /></div>
            </div>
            <p className="text-2xl font-bold text-dark-navy">{stats.leaveBalance}</p>
            <p className="text-xs text-muted-text">Days remaining ({stats.usedLeaves || 0} used)</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-card-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-text font-medium uppercase tracking-wide">Pending</span>
              <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center"><AlertCircle size={16} className="text-orange-600" /></div>
            </div>
            <p className="text-2xl font-bold text-dark-navy">{stats.pendingLeaves || 0}</p>
            <p className="text-xs text-muted-text">Leave requests</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-card-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-text font-medium uppercase tracking-wide">Last Salary</span>
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center"><TrendingUp size={16} className="text-emerald-600" /></div>
            </div>
            <p className="text-2xl font-bold text-dark-navy">
              {stats.lastSalary ? `Rs. ${stats.lastSalary.netSalary?.toLocaleString()}` : '—'}
            </p>
            <p className="text-xs text-muted-text">
              {stats.lastSalary ? `${stats.lastSalary.month}/${stats.lastSalary.year}` : 'No records yet'}
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'My Profile', desc: 'View personal details', path: '/employee/profile', icon: '👤', color: 'bg-violet-50 hover:bg-violet-100' },
            { label: 'Attendance', desc: 'Check-in & history', path: '/employee/attendance', icon: '⏰', color: 'bg-blue-50 hover:bg-blue-100' },
            { label: 'Leave Requests', desc: 'Apply & track leaves', path: '/employee/leaves', icon: '📅', color: 'bg-amber-50 hover:bg-amber-100' },
            { label: 'Salary & EPF/ETF', desc: 'View pay & contributions', path: '/employee/salary', icon: '💰', color: 'bg-emerald-50 hover:bg-emerald-100' },
          ].map((item) => (
            <a key={item.path} href={item.path} className={`${item.color} rounded-2xl p-5 border border-card-border transition-colors block`}>
              <span className="text-2xl">{item.icon}</span>
              <h3 className="font-semibold text-dark-navy mt-2">{item.label}</h3>
              <p className="text-xs text-muted-text mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
