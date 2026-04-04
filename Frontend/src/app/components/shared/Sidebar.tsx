import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  LayoutDashboard,
  MapPinned,
  MapPin,
  ClipboardList,
  User,
  LogOut,
  Map,
  Users,
  Car,
  Menu,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../ui/utils';
import { mockRequests } from '../../data/mockData';

interface SidebarProps {
  role: 'employee' | 'driver';
  children: ReactNode;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

const employeeNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/employee/dashboard' },
  { icon: MapPinned, label: 'Pickup Service', path: '/employee/pickup' },
  { icon: MapPin, label: 'Dropoff Service', path: '/employee/dropoff' },
  { icon: ClipboardList, label: 'My Requests', path: '/employee/requests' },
  { icon: User, label: 'Profile', path: '/employee/profile' },
];

const driverNavItems: NavItem[] = [
  { icon: Map, label: "Today's Route", path: '/driver/route' },
  { icon: Users, label: 'Passengers', path: '/driver/passengers' },
  { icon: Car, label: 'Vehicle Info', path: '/driver/vehicle' },
  { icon: User, label: 'Profile', path: '/driver/profile' },
];

export const Sidebar: React.FC<SidebarProps> = ({ role, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Check if user has approved pickup request for ad-hoc availability
  const hasApprovedPickup = mockRequests.some(
    r => r.type === 'pickup' && r.status === 'approved'
  );

  const employeeNavItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/employee/dashboard' },
    { icon: MapPinned, label: 'Pickup Service', path: '/employee/pickup' },
    { icon: MapPin, label: 'Dropoff Service', path: '/employee/dropoff' },
    ...(hasApprovedPickup ? [{ icon: Zap, label: 'Ad-hoc Service', path: '/employee/adhoc', badge: 'NEW' }] : []),
    { icon: ClipboardList, label: 'My Requests', path: '/employee/requests' },
    { icon: User, label: 'Profile', path: '/employee/profile' },
  ];

  const driverNavItems: NavItem[] = [
    { icon: Map, label: "Today's Route", path: '/driver/route' },
    { icon: Users, label: 'Passengers', path: '/driver/passengers' },
    { icon: Car, label: 'Vehicle Info', path: '/driver/vehicle' },
    { icon: User, label: 'Profile', path: '/driver/profile' },
  ];

  const navItems = role === 'employee' ? employeeNavItems : driverNavItems;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 rounded-lg p-2">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900">TranspoRT</h2>
            <p className="text-xs text-gray-500 capitalize">{role} Portal</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 mx-4 mt-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 rounded-full w-10 h-10 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user?.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-600 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)}>
              <div
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium flex-1">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-semibold",
                    isActive ? "bg-white text-blue-600" : "bg-blue-100 text-blue-600"
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 rounded-lg p-2">
              <Car className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold text-lg text-gray-900">TranspoRT</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="md:hidden fixed top-16 left-0 bottom-0 w-64 bg-white z-50 flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};