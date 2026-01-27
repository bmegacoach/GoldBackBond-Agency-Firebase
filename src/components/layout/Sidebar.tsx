import { BarChart3, LayoutGrid, Users, Package, CreditCard, Ticket, TrendingUp, Workflow, Target, TrendingDown, Settings, FileSignature, User as UserIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid, path: '', group: 'main' },
  { id: 'leads', label: 'Leads', icon: BarChart3, path: 'leads', group: 'main' },
  { id: 'customers', label: 'Customers', icon: Users, path: 'customers', group: 'main' },
  { id: 'packages', label: 'Packages', icon: Package, path: 'packages', group: 'main' },

  { id: 'pipeline', label: 'Pipeline', icon: Workflow, path: 'pipeline', group: 'sales' },
  { id: 'lead-scoring', label: 'AI Scoring', icon: Target, path: 'lead-scoring', group: 'sales' },
  { id: 'treasury', label: 'Treasury', icon: TrendingDown, path: 'treasury', group: 'sales' },

  { id: 'contracts', label: 'Contracts', icon: FileSignature, path: 'contracts', group: 'operations' },
  { id: 'onboarding', label: 'Onboarding', icon: UserIcon, path: 'onboarding', group: 'operations' },
  { id: 'payments', label: 'Payments', icon: CreditCard, path: 'payments', group: 'operations' },
  { id: 'tickets', label: 'Support', icon: Ticket, path: 'tickets', group: 'operations' },

  { id: 'analytics', label: 'Analytics', icon: TrendingUp, path: 'analytics', group: 'reporting' },
  { id: 'admin', label: 'Admin', icon: Settings, path: 'admin/users', group: 'admin' },
];

interface SidebarProps {
  isOpen?: boolean;
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const groups = {
    main: navItems.filter(item => item.group === 'main'),
    sales: navItems.filter(item => item.group === 'sales'),
    operations: navItems.filter(item => item.group === 'operations'),
    reporting: navItems.filter(item => item.group === 'reporting'),
    admin: navItems.filter(item => item.group === 'admin'),
  };

  const renderGroup = (items: typeof navItems, label: string) => (
    <div className="space-y-1 mb-6">
      {isOpen && (
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 opacity-80">
          {label}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.id}
            to={item.path}
            end={item.path === ''}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 mx-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${isActive
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-900/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {isOpen && <span className="font-medium text-sm tracking-wide">{item.label}</span>}
                {isActive && (
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <aside
      className={`
        bg-slate-900 border-r border-slate-800 
        transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
        overflow-y-auto overflow-x-hidden
        h-screen sticky top-0
        ${isOpen ? 'w-72' : 'w-20'}
        shadow-2xl
      `}
    >
      {/* Brand Area */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50 mb-4 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20">
          <span className="font-bold text-white text-lg">G</span>
        </div>
        {isOpen && (
          <div className="ml-3 animate-fade-in">
            <h1 className="font-heading font-bold text-white text-lg leading-tight">GoldBackBond</h1>
            <p className="text-xs text-slate-400">Premium Investment Platform</p>
          </div>
        )}
      </div>

      <nav className="py-2 pb-10">
        {renderGroup(groups.main, 'Dashboard')}
        {renderGroup(groups.sales, 'Sales & Finance')}
        {renderGroup(groups.operations, 'Operations')}
        {renderGroup(groups.reporting, 'Insights')}

        <div className="mx-4 mt-8 pt-6 border-t border-slate-800">
          {renderGroup(groups.admin, 'System')}
        </div>
      </nav>
    </aside>
  );
}
