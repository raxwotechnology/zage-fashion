import { LayoutDashboard, Users, Store, Tag, ShoppingBag, Monitor, Ticket, BarChart3, DollarSign, Wallet, Package, Gift } from 'lucide-react';

const adminNavItems = [
  { path: '/admin', label: 'Overview', icon: LayoutDashboard },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/stores', label: 'Stores', icon: Store },
  { path: '/admin/categories', label: 'Categories', icon: Tag },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/vouchers', label: 'Vouchers', icon: Ticket },
  { path: '/admin/promotions', label: 'Promotions', icon: Gift },
  { path: '/admin/expenses', label: 'Expenses', icon: Wallet },
  { path: '/admin/financials', label: 'Financials', icon: DollarSign },
  { path: '/admin/inventory', label: 'Inventory', icon: Package },
  { path: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { path: '/admin/settings', label: 'Settings', icon: LayoutDashboard },
  { path: '/cashier-login', label: 'POS Terminal', icon: Monitor },
];

export default adminNavItems;
