import { LayoutDashboard, User, Clock, Calendar, CreditCard, Monitor, Truck, Package } from 'lucide-react';

const getEmployeeNavItems = (role) => {
  const items = [
    { path: '/employee', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/employee/profile', label: 'My Profile', icon: User },
    { path: '/employee/attendance', label: 'Attendance', icon: Clock },
    { path: '/employee/leaves', label: 'Leaves', icon: Calendar },
    { path: '/employee/salary', label: 'Salary & EPF/ETF', icon: CreditCard },
  ];

  if (role === 'cashier') {
    items.push({ path: '/pos', label: 'POS Terminal', icon: Monitor });
    items.push({ path: '/employee/stock', label: 'Stock View', icon: Package });
  }

  if (role === 'deliveryGuy') {
    items.push({ path: '/delivery', label: 'Deliveries', icon: Truck });
  }

  return items;
};

export default getEmployeeNavItems;
