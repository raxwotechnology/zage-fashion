import { LayoutDashboard, Package, ShoppingBag, Users, Clock, Calendar, Target, BarChart3, Warehouse } from 'lucide-react';

const managerNavItems = [
  { path: '/manager', label: 'Overview', icon: LayoutDashboard },
  { path: '/manager/products', label: 'Products', icon: Package },
  { path: '/manager/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/manager/inventory', label: 'Inventory', icon: Warehouse },
  { path: '/manager/employees', label: 'Employees', icon: Users },
  { path: '/manager/attendance', label: 'Attendance', icon: Clock },
  { path: '/manager/leaves', label: 'Leaves', icon: Calendar },
  { path: '/manager/targets', label: 'Targets', icon: Target },
  { path: '/manager/performance', label: 'Performance', icon: BarChart3 },
  { path: '/pos', label: 'POS Terminal', icon: LayoutDashboard },
];

export default managerNavItems;
