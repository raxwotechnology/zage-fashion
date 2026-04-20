import ManagerEmployees from '../storeOwner/ManagerEmployees';
import adminNavItems from './adminNavItems';

const AdminEmployees = () => {
  return <ManagerEmployees navItems={adminNavItems} title="Admin Panel" />;
};

export default AdminEmployees;
