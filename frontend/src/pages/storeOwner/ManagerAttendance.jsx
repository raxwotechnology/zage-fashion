import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import { getAttendanceReport, getEmployees } from '../../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-toastify';
import managerNavItems from './managerNavItems';



const now = new Date();

const ManagerAttendance = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  useEffect(() => { fetchData(); }, [month, year]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attRes, empRes] = await Promise.all([
        getAttendanceReport({ month, year }),
        getEmployees(),
      ]);
      setRecords(attRes.data);
      setEmployees(empRes.data);
    } catch (err) { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  // Group by employee
  const byEmployee = {};
  records.forEach(r => {
    const id = r.employeeId?._id || r.employeeId;
    const name = r.employeeId?.name || 'Unknown';
    if (!byEmployee[id]) byEmployee[id] = { name, role: r.employeeId?.role || '', present: 0, absent: 0, leave: 0, late: 0, totalHours: 0, overtime: 0 };
    if (r.status === 'present') { byEmployee[id].present++; byEmployee[id].totalHours += r.hoursWorked || 0; byEmployee[id].overtime += r.overtime || 0; }
    else if (r.status === 'leave') byEmployee[id].leave++;
    else if (r.status === 'absent') byEmployee[id].absent++;
    if (r.checkIn) { const h = new Date(r.checkIn).getHours(); if (h >= 9) byEmployee[id].late++; }
  });

  const summaryData = Object.entries(byEmployee).map(([id, d]) => ({ ...d, id }));

  // Chart data
  const chartData = summaryData.map(e => ({ name: e.name.split(' ')[0], present: e.present, leave: e.leave, absent: e.absent }));

  const exportCSV = () => {
    const rows = [['Employee', 'Role', 'Present', 'Leave', 'Absent', 'Late', 'Hours', 'Overtime'].join(','), ...summaryData.map(e => [e.name, e.role, e.present, e.leave, e.absent, e.late, e.totalHours.toFixed(1), e.overtime.toFixed(1)].join(','))].join('\n');
    const blob = new Blob([rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `attendance_${month}_${year}.csv`; a.click();
    toast.success('Report downloaded');
  };

  if (loading) return <DashboardLayout navItems={managerNavItems} title="Manager Dashboard"><div className="flex items-center justify-center h-64"><div className="w-10 h-10 border-4 border-primary-green border-t-transparent rounded-full animate-spin" /></div></DashboardLayout>;

  return (
    <DashboardLayout navItems={managerNavItems} title="Manager Dashboard">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-2xl font-bold text-dark-navy">📋 Attendance Report</h1><p className="text-muted-text text-sm mt-1">{records.length} records for {month}/{year}</p></div>
          <button onClick={exportCSV} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2"><Download size={16} /> Export CSV</button>
        </div>

        {/* Month/Year Selector */}
        <div className="flex gap-3 mb-6">
          <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border border-card-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green">
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('en', { month: 'long' })}</option>)}
          </select>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-24 border border-card-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-green" />
        </div>

        {/* Attendance Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-card-border p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-dark-navy mb-4">📊 Attendance Overview</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip /><Bar dataKey="present" fill="#10b981" name="Present" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leave" fill="#f59e0b" name="Leave" radius={[4, 4, 0, 0]} />
                <Bar dataKey="absent" fill="#ef4444" name="Absent" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Summary Table */}
        <div className="bg-white rounded-2xl border border-card-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-muted-text">Employee</th>
                <th className="text-center px-3 py-3 font-medium text-muted-text">Role</th>
                <th className="text-center px-3 py-3 font-medium text-emerald-600">Present</th>
                <th className="text-center px-3 py-3 font-medium text-amber-600">Leave</th>
                <th className="text-center px-3 py-3 font-medium text-red-500">Absent</th>
                <th className="text-center px-3 py-3 font-medium text-orange-500">Late</th>
                <th className="text-center px-3 py-3 font-medium text-blue-600">Hours</th>
                <th className="text-center px-3 py-3 font-medium text-purple-600">Overtime</th>
              </tr></thead>
              <tbody className="divide-y divide-card-border">
                {summaryData.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-text">No attendance records found</td></tr>
                ) : summaryData.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-dark-navy">{e.name}</td>
                    <td className="px-3 py-3 text-center"><span className="text-xs bg-gray-100 px-2 py-1 rounded-lg">{e.role}</span></td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-600">{e.present}</td>
                    <td className="px-3 py-3 text-center font-bold text-amber-600">{e.leave}</td>
                    <td className="px-3 py-3 text-center font-bold text-red-500">{e.absent}</td>
                    <td className="px-3 py-3 text-center font-bold text-orange-500">{e.late}</td>
                    <td className="px-3 py-3 text-center font-bold text-blue-600">{e.totalHours.toFixed(1)}h</td>
                    <td className="px-3 py-3 text-center font-bold text-purple-600">{e.overtime.toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerAttendance;
