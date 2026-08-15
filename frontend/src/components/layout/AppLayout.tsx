import { useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarRange,
  MessageSquare,
  Users,
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
  Bell,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { useAuth } from '@/store/AuthContext';
import { useTheme } from '@/store/ThemeContext';

const NAV = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/plan', label: 'My Study Plan', icon: CalendarRange, end: false },
  { to: '/app/tutor', label: 'AI Tutor', icon: MessageSquare, end: false },
  { to: '/app/groups', label: 'Study Groups', icon: Users, end: false },
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
    <div className="flex h-full flex-col justify-between py-6">
      {/* Top Section */}
      <div>
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-6 h-12 mb-6`}>
          {collapsed ? (
            <Logo size="sm" to="/app" className="animate-float" />
          ) : (
            <div className="flex items-center gap-2">
              <Logo to="/app" className="animate-float" />
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              aria-label="Collapse sidebar"
              className="hidden rounded-xl p-2 text-[var(--nova-text-secondary)] transition-colors duration-200 hover:bg-slate-100 dark:hover:bg-white/5 lg:block"
            >
              <PanelLeftClose size={18} />
            </button>
          )}
        </div>

        <nav className="space-y-1.5 px-4">
          <span
            className={`block px-3 text-[9px] font-bold tracking-widest text-[var(--nova-text-muted)] uppercase mb-2 ${collapsed ? 'text-center' : ''}`}
          >
            {collapsed ? '—' : 'Main Menu'}
          </span>
          {NAV.map((item) => (
            <SidebarLink key={item.to} {...item} collapsed={collapsed} onClick={() => setMobileOpen(false)} />
          ))}

          <div className="my-5 border-t border-[var(--nova-border)] dark:border-[#1E293B] mx-2" />

          <span
            className={`block px-3 text-[9px] font-bold tracking-widest text-[var(--nova-text-muted)] uppercase mb-2 ${collapsed ? 'text-center' : ''}`}
          >
            {collapsed ? '—' : 'Account'}
          </span>
          {SECONDARY_NAV.map((item) => (
            <SidebarLink
              key={item.to}
              {...item}
              collapsed={collapsed}
              end={false}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="space-y-4 px-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-[var(--nova-text-secondary)] transition hover:bg-slate-100 dark:hover:bg-white/5 ${collapsed ? 'justify-center' : ''}`}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>

        {/* User Card */}
        <div
          className={`rounded-2xl border border-[var(--nova-border)] bg-slate-50 dark:border-[#1E293B] dark:bg-[#172033]/50 p-3 shadow-sm ${collapsed ? 'flex justify-center' : ''}`}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="absolute -inset-[1.5px] rounded-full bg-[var(--nova-primary)] dark:bg-[#3B82F6] opacity-75 blur-[0.5px]" />
              <div
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white border border-white dark:border-[#111827]"
                style={{ backgroundColor: 'var(--nova-primary)' }}
              >
                {initials}
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[var(--nova-primary)] border border-white dark:border-[#111827] animate-pulse" />
            </div>

            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[var(--nova-text)] dark:text-[#F8FAFC]">{user?.name}</p>
                <p className="truncate text-[10px] text-[var(--nova-text-secondary)] dark:text-[#CBD5E1]">
                  {user?.email}
                </p>
              </div>
            )}

            {!collapsed && (
              <button
                onClick={handleLogout}
                aria-label="Log out"
                className="rounded-lg p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-[var(--nova-primary)] dark:hover:text-[#3B82F6]"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-[var(--nova-bg)] text-[var(--nova-text-secondary)] dark:bg-[#0B1220] dark:text-[#CBD5E1] transition-colors duration-300">
      {/* Decorative background radial glows */}
      <div className="absolute top-0 right-0 h-[450px] w-[450px] bg-gradient-radial from-[var(--nova-primary)]/4 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-[20%] h-[550px] w-[550px] bg-gradient-radial from-[var(--nova-primary)]/4 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Desktop Sidebar */}
      <aside
        className={`fixed inset-y-4 left-4 z-30 hidden rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] shadow-sm dark:border-[#1E293B] dark:bg-[#111827] transition-all duration-300 lg:block ${
          collapsed ? 'w-[80px]' : 'w-68'
        }`}
      >
        {SidebarContent}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="absolute -right-3 top-22 flex h-6 w-6 items-center justify-center rounded-full border border-[var(--nova-border)] bg-[var(--nova-surface)] text-slate-500 shadow-soft hover:bg-slate-50 dark:border-[#1E293B] dark:bg-[#111827]"
          >
            <PanelLeft size={12} />
          </button>
        )}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-y-4 left-4 w-68 rounded-3xl border border-[var(--nova-border)] bg-[var(--nova-surface)] shadow-card dark:border-[#1E293B] dark:bg-[#111827] backdrop-blur-2xl"
            >
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Content Area Wrapper */}
      <div
        className={`transition-all duration-300 ${collapsed ? 'lg:pl-[112px]' : 'lg:pl-[312px]'} pr-0 lg:pr-6 pt-4 pb-6`}
      >
        {/* Desktop/Laptop Header Bar */}
        <header className="hidden lg:flex h-16 items-center justify-between border border-[var(--nova-border)] bg-white/92 rounded-3xl px-6 mb-6 shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:border-[#1E293B] dark:bg-[#111827]/92 backdrop-blur-md">
          <span className="text-[10px] font-bold tracking-widest text-[var(--nova-text-secondary)] dark:text-[#94A3B8] uppercase">
            Cadence Learning Hub
          </span>

          <div className="flex items-center gap-4">
            {/* Search Action */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-[#F1F5F9] text-[var(--nova-text-secondary)] border border-transparent dark:bg-white/5 dark:text-[#CBD5E1] dark:hover:text-white"
            >
              <Search size={15} />
            </motion.button>
            {/* Notifications Action */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 hover:bg-[#F1F5F9] text-[var(--nova-text-secondary)] border border-transparent dark:bg-white/5 dark:text-[#CBD5E1] dark:hover:text-white"
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--nova-primary)] border border-white dark:border-[#111827]" />
            </motion.button>

            <div className="h-px w-4 bg-[var(--nova-border)] dark:bg-white/10" />

            {/* Quick Profile avatar view */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white border border-[var(--nova-border)] shadow-soft"
              style={{ backgroundColor: 'var(--nova-primary)' }}
            >
              {initials}
            </div>
          </div>
        </header>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--nova-border)] bg-[var(--nova-bg)] px-4 dark:border-white/5 dark:bg-[#0B1220] lg:hidden mb-4">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-xl p-2 text-[var(--nova-text)] dark:text-[#CBD5E1] hover:bg-slate-100 dark:hover:bg-white/5"
          >
            <Menu size={20} />
          </button>
          <Logo size="sm" to="/app" />
          <div className="w-9" />
        </header>

        {/* Content Container */}
        <main className="min-h-[calc(100vh-8rem)]">
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
        `group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-xs font-bold transition-all duration-300 border ${
          collapsed ? 'justify-center' : ''
        } ${
          isActive
            ? 'bg-[var(--nova-primary-soft)] text-[var(--nova-primary)] dark:bg-[rgba(59,130,246,0.12)] dark:text-[#3B82F6] border-transparent shadow-sm'
            : 'text-[var(--nova-text-secondary)] dark:text-[#CBD5E1] border-transparent hover:bg-slate-50 dark:hover:bg-white/5 hover:text-[var(--nova-text)]'
        }`
      }
      title={collapsed ? label : undefined}
    >
      {({ isActive }) => (
        <>
          {/* Active indicator bar on the left */}
          {isActive && !collapsed && (
            <motion.div
              layoutId="sidebar-active-indicator"
              className="absolute left-0 top-1/3 h-1/3 w-[3.5px] rounded-r bg-[var(--nova-primary)] dark:bg-[#3B82F6]"
            />
          )}
          {/* Hover translation and scale */}
          <Icon
            size={16}
            className={`shrink-0 transition-transform duration-300 group-hover:scale-110 text-[#64748B] dark:text-[#64748B] group-hover:text-[var(--nova-text)] dark:group-hover:text-white ${
              isActive ? '!text-[var(--nova-primary)] dark:!text-[#3B82F6]' : ''
            } ${!collapsed && 'group-hover:translate-x-0.5'}`}
          />
          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  );
}

export { X };
