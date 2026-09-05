// ============================================================================
// AppShell Layout — Sidebar nav + role-based menu
// ============================================================================

import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Shield,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';

const navItems = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'support_agent'] },
    ],
  },
  {
    section: 'Provider Ops',
    items: [
      { label: 'Applications', path: '/providers/applications', icon: Users, roles: ['admin', 'support_agent'] },
      { label: 'Verification', path: '/providers/verification', icon: Shield, roles: ['admin'] },
      { label: 'Quality', path: '/providers/quality', icon: Users, roles: ['admin', 'support_agent'] },
    ],
  },
  {
    section: 'Marketplace Ops',
    items: [
      { label: 'Bookings', path: '/marketplace/bookings', icon: Calendar, roles: ['admin', 'support_agent'] },
      { label: 'Live Status', path: '/marketplace/live', icon: Calendar, roles: ['admin', 'support_agent'] },
      { label: 'Catalogue', path: '/marketplace/catalogue', icon: Settings, roles: ['admin'] },
      { label: 'Coverage', path: '/marketplace/coverage', icon: Settings, roles: ['admin'] },
    ],
  },
  {
    section: 'Finance',
    items: [
      { label: 'Payments & Payouts', path: '/finance', icon: CreditCard, roles: ['admin'] },
    ],
  },
  {
    section: 'Trust & Safety',
    items: [
      { label: 'Incidents', path: '/trust/incidents', icon: Shield, roles: ['admin', 'support_agent'] },
      { label: 'Fraud Flags', path: '/trust/fraud', icon: Shield, roles: ['admin'] },
      { label: 'Support', path: '/trust/support', icon: Users, roles: ['admin', 'support_agent'] },
    ],
  },
  {
    section: 'Admin',
    items: [
      { label: 'Roles & Permissions', path: '/admin/roles', icon: Settings, roles: ['admin'] },
      { label: 'Audit Log', path: '/admin/audit', icon: Settings, roles: ['admin'] },
    ],
  },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const userRole = user?.role || 'support_agent';

  const filteredNav = navItems.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(userRole)),
  })).filter((section) => section.items.length > 0);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-16'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-gray-900">Carezoa Admin</h1>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {filteredNav.map((section) => (
            <div key={section.section}>
              {sidebarOpen && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  {section.section}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {sidebarOpen && (
                <>
                  <p className="text-sm font-medium text-gray-900">{user?.phone}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
