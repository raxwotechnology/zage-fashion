import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronRight, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';

const DashboardLayout = ({ children, navItems, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex bg-gray-50 relative">
      {/* Mobile Sidebar Toggle */}
      <button
        className="lg:hidden fixed top-20 left-4 z-50 bg-rose-600 text-white w-11 h-11 rounded-xl shadow-xl flex items-center justify-center hover:bg-fuchsia-700 transition-all"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle dashboard menu"
      >
        {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen lg:h-[calc(100vh-140px)] w-72 bg-white border-r border-card-border transform transition-transform duration-300 ease-out flex flex-col ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Dashboard Header */}
        <div className="p-6 border-b border-card-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-fuchsia-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-rose-200">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="font-semibold text-dark-navy text-sm">{user?.name}</h3>
              <p className="text-xs text-muted-text capitalize">{user?.role === 'manager' ? 'Manager' : user?.role === 'deliveryGuy' ? 'Delivery' : user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-widest text-muted-text font-semibold px-3 mb-3">{title}</p>
          {navItems.map((item) => {
            const isRoot = item.path === '/admin' || item.path === '/manager' || item.path === '/employee';
            const isActive = isRoot
              ? location.pathname === item.path
              : location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                preventScrollReset
                onClick={() => { setSidebarOpen(false); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-rose-50 text-rose-600 shadow-sm'
                    : 'text-muted-text hover:bg-rose-50/50 hover:text-dark-navy'
                }`}
              >
                <item.icon size={18} className={isActive ? 'text-rose-600' : 'text-gray-400 group-hover:text-dark-navy'} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} className="text-rose-600" />}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-card-border bg-white">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all w-full"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto pt-20 lg:pt-8">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
