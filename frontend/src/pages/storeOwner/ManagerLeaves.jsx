import { useState, useEffect } from 'react';
import { Calendar, Check, X, Clock } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { toast } from 'react-toastify';
import managerNavItems from './managerNavItems';
import API from '../../services/api';



const statusColors = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

const ManagerLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchLeaves(); }, []);

  const fetchLeaves = async () => {
    try {
      const { data } = await API.get('/hr/leaves/store');
      setLeaves(data);
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/hr/leaves/${id}/approve`);
      toast.success('Leave approved');
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to approve');
    }
  };

  const handleReject = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await API.put(`/hr/leaves/${id}/reject`, { reason });
      toast.success('Leave rejected');
      fetchLeaves();
    } catch (err) {
      toast.error('Failed to reject');
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter((l) => l.status === filter);

  if (loading) {
    return (
      <DashboardLayout navItems={managerNavItems} title="Manager Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={managerNavItems} title="Manager Dashboard">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-dark-navy mb-2">📅 Leave Management</h1>
            <p className="text-muted-text text-sm">{leaves.filter((l) => l.status === 'pending').length} pending requests</p>
          </div>
          <button onClick={() => {
            const rows = [['Employee', 'Role', 'Type', 'Start', 'End', 'Days', 'Status', 'Reason'].join(','), ...leaves.map(l => [l.employeeId?.name, l.employeeId?.role, l.type, new Date(l.startDate).toLocaleDateString(), new Date(l.endDate).toLocaleDateString(), l.totalDays, l.status, `"${l.reason || ''}"`].join(','))].join('\n');
            const blob = new Blob([rows], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leave_report.csv'; a.click();
            toast.success('Report downloaded');
          }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">📥 Export CSV</button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-card-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-amber-600">{leaves.filter(l => l.status === 'pending').length}</p>
            <p className="text-xs text-muted-text">Pending</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-emerald-600">{leaves.filter(l => l.status === 'approved').length}</p>
            <p className="text-xs text-muted-text">Approved</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-red-500">{leaves.filter(l => l.status === 'rejected').length}</p>
            <p className="text-xs text-muted-text">Rejected</p>
          </div>
          <div className="bg-white rounded-2xl border border-card-border p-4 shadow-sm text-center">
            <p className="text-2xl font-bold text-dark-navy">{leaves.filter(l => l.status === 'approved').reduce((s, l) => s + (l.totalDays || 0), 0)}</p>
            <p className="text-xs text-muted-text">Total Days Used</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'approved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                filter === s ? 'bg-primary-green text-white' : 'bg-gray-100 text-muted-text hover:bg-gray-200'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)} ({s === 'all' ? leaves.length : leaves.filter(l => l.status === s).length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-card-border p-12 text-center text-muted-text">
            <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
            <p>No leave requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((leave) => (
              <div key={leave._id} className="bg-white rounded-2xl border border-card-border p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {leave.employeeId?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-dark-navy text-sm">{leave.employeeId?.name}</h3>
                      <p className="text-xs text-muted-text">{leave.employeeId?.role} • {leave.type} leave</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[leave.status]}`}>
                      {leave.status}
                    </span>
                    {leave.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(leave._id)} className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                          <Check size={16} />
                        </button>
                        <button onClick={() => handleReject(leave._id)} className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-text">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(leave.startDate).toLocaleDateString()} — {new Date(leave.endDate).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {leave.totalDays} day{leave.totalDays > 1 ? 's' : ''}</span>
                </div>
                {leave.reason && <p className="text-xs text-muted-text mt-2 bg-gray-50 rounded-lg p-2">{leave.reason}</p>}
                {leave.rejectionReason && <p className="text-xs text-red-500 mt-2 bg-red-50 rounded-lg p-2">Rejected: {leave.rejectionReason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManagerLeaves;
