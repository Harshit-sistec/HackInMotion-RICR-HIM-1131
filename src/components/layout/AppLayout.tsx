import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  MessageSquare,
  ClipboardList,
  LineChart,
  Trophy,
  User as UserIcon,
  Settings as SettingsIcon,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/plan', label: 'My Study Plan', icon: CalendarRange, end: false },
  { to: '/app/tutor', label: 'AI Tutor', icon: MessageSquare, end: false },
  { to: '/app/assessments', label: 'Assessments', icon: ClipboardList, end: false },
  { to: '/app/progress', label: 'Progress', icon: LineChart, end: false },
  { to: '/app/achievements', label: 'Achievements', icon: Trophy, end: false },
];

const SECONDARY_NAV = [
  { to: '/app/profile', label: 'Profile', icon: UserIcon },
  { to: '/app/settings', label: 'Settings', icon: SettingsIcon },
];

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.name ?? 'U')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 h-16`}>
        {collapsed ? <Logo size="sm" to="/app" /> : <Logo to="/app" />}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="hidden rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 lg:block dark:hover:bg-ink-800"
          >
            <PanelLeftClose size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
        ))}
        <div className="my-3 border-t border-ink-200 dark:border-ink-800" />
        {SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.to} {...item} collapsed={collapsed} end={false} onClick={() => setMobileOpen(false)} />
        ))}
      </nav>

      <div className="px-3 pb-3">
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 ${collapsed ? 'justify-center' : ''}`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          {!collapsed && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
        </button>
      </div>

      <div className={`border-t border-ink-200 p-3 dark:border-ink-800 ${collapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: user?.avatarColor ?? '#3763E8' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900 dark:text-ink-50">{user?.name}</p>
              <p className="truncate text-xs text-ink-400 dark:text-ink-500">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              aria-label="Log out"
              className="rounded-lg p-2 text-ink-400 transition hover:bg-error-50 hover:text-error-600 dark:hover:bg-error-700/20"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-ink-950">
      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-ink-200 bg-white transition-all duration-300 dark:border-ink-800 dark:bg-ink-900 lg:block ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {SidebarContent}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-500 shadow-soft dark:border-ink-700 dark:bg-ink-800"
          >
            <PanelLeft size={14} />
          </button>
        )}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-900">
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'}`}>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-200 bg-white/80 px-4 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 text-ink-600 dark:text-ink-300"
          >
            <Menu size={20} />
          </button>
          <Logo size="sm" to="/app" />
          <div className="w-9" />
        </header>

        <main className="min-h-[calc(100vh-4rem)] lg:min-h-screen">
          <div key={location.pathname} className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  label,
  icon: Icon,
  end,
  collapsed,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end: boolean;
  collapsed: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200'
            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'
        }`
      }
      title={collapsed ? label : undefined}
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export { X };
