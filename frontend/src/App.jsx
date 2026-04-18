import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import StoreList from './pages/StoreList';
import StoreDetail from './pages/StoreDetail';
import Deals from './pages/Deals';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrdersPage from './pages/OrdersPage';
import Profile from './pages/customer/Profile';
import CustomerLoyalty from './pages/customer/CustomerLoyalty';
import StoreOverview from './pages/storeOwner/StoreOverview';
import StoreProducts from './pages/storeOwner/StoreProducts';
import StoreOrders from './pages/storeOwner/StoreOrders';
import ManagerEmployees from './pages/storeOwner/ManagerEmployees';
import ManagerAttendance from './pages/storeOwner/ManagerAttendance';
import ManagerLeaves from './pages/storeOwner/ManagerLeaves';
import ManagerPayroll from './pages/storeOwner/ManagerPayroll';
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStores from './pages/admin/AdminStores';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminVouchers from './pages/admin/AdminVouchers';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import CashierLogin from './pages/cashier/CashierLogin';
import POSScreen from './pages/cashier/POSScreen';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeAttendance from './pages/employee/EmployeeAttendance';
import EmployeeLeaves from './pages/employee/EmployeeLeaves';
import EmployeeSalary from './pages/employee/EmployeeSalary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AppLayout = ({ children }) => {
  const location = useLocation();
  const isPOS = location.pathname === '/pos' || location.pathname === '/cashier-login';
  if (isPOS) return <>{children}</>;
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/stores" element={<StoreList />} />
          <Route path="/store/:id" element={<StoreDetail />} />
          <Route path="/deals" element={<Deals />} />

          {/* Customer */}
          <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
          <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/order-confirmation/:id" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/loyalty" element={<ProtectedRoute><CustomerLoyalty /></ProtectedRoute>} />

          {/* Manager */}
          <Route path="/manager" element={<ProtectedRoute roles={['manager']}><StoreOverview /></ProtectedRoute>} />
          <Route path="/manager/products" element={<ProtectedRoute roles={['manager']}><StoreProducts /></ProtectedRoute>} />
          <Route path="/manager/orders" element={<ProtectedRoute roles={['manager']}><StoreOrders /></ProtectedRoute>} />
          <Route path="/manager/employees" element={<ProtectedRoute roles={['manager']}><ManagerEmployees /></ProtectedRoute>} />
          <Route path="/manager/attendance" element={<ProtectedRoute roles={['manager']}><ManagerAttendance /></ProtectedRoute>} />
          <Route path="/manager/leaves" element={<ProtectedRoute roles={['manager']}><ManagerLeaves /></ProtectedRoute>} />
          <Route path="/manager/payroll" element={<ProtectedRoute roles={['manager']}><ManagerPayroll /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminOverview /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/stores" element={<ProtectedRoute roles={['admin']}><AdminStores /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
          <Route path="/admin/vouchers" element={<ProtectedRoute roles={['admin']}><AdminVouchers /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute roles={['admin']}><AdminSettings /></ProtectedRoute>} />

          {/* Cashier */}
          <Route path="/cashier-login" element={<CashierLogin />} />
          <Route path="/pos" element={<ProtectedRoute roles={['cashier', 'manager']}><POSScreen /></ProtectedRoute>} />

          {/* Delivery */}
          <Route path="/delivery" element={<ProtectedRoute roles={['deliveryGuy']}><DeliveryDashboard /></ProtectedRoute>} />

          {/* Employee Self-Service */}
          <Route path="/employee" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeDashboard /></ProtectedRoute>} />
          <Route path="/employee/profile" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeProfile /></ProtectedRoute>} />
          <Route path="/employee/attendance" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeAttendance /></ProtectedRoute>} />
          <Route path="/employee/leaves" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeLeaves /></ProtectedRoute>} />
          <Route path="/employee/salary" element={<ProtectedRoute roles={['cashier', 'deliveryGuy', 'stockEmployee']}><EmployeeSalary /></ProtectedRoute>} />
        </Routes>
      </AppLayout>
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </Router>
  );
}

export default App;
