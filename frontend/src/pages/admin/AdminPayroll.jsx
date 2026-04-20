import ManagerPayroll from '../storeOwner/ManagerPayroll';
import adminNavItems from './adminNavItems';

const AdminPayroll = () => {
  return <ManagerPayroll navItems={adminNavItems} title="Admin Panel" />;
};

export default AdminPayroll;
