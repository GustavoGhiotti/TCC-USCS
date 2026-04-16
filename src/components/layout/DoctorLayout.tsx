import { type ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { getDoctorProfile } from '../../services/doctorProfileService';

function IconGrid({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  );
}

function IconChart({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  );
}

function IconLogout({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function IconChevronRight({ className }: { className?: string }) {
  return (
    <svg className={cn('w-4 h-4', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={cn('w-5 h-5', className)} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
  );
}

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  end?: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon, label, end, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          isActive ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-700/60 hover:text-white',
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

function AccountShortcut({ compact = false, onClick }: { compact?: boolean; onClick: () => void }) {
  const { user } = useAuth();

  if (!user) return null;

  const profile = getDoctorProfile(user);
  const summary = [profile.specialty, profile.institution].filter(Boolean).join(' · ') || 'Perfil profissional';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/30',
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
      )}
    >
      <div className={cn(
        'flex flex-shrink-0 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700',
        compact ? 'h-8 w-8 text-sm' : 'h-9 w-9 text-sm',
      )}>
        {user.nomeCompleto?.charAt(0) ?? 'M'}
      </div>
      <div className={cn('min-w-0', compact ? 'hidden sm:block' : 'block')}>
        <p className="truncate text-sm font-semibold text-slate-900">{user.nomeCompleto}</p>
        <p className="truncate text-xs text-slate-500">{summary}</p>
      </div>
      <IconChevronRight className="flex-shrink-0 text-slate-400" />
    </button>
  );
}

interface SidebarProps {
  onNavigate?: () => void;
}

function DoctorSidebar({ onNavigate }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav aria-label="Navegacao do medico" className="flex h-full w-64 flex-col bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-brand-600">
            <svg className="h-4.5 w-4.5 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-white">GestaCare</p>
            <p className="mt-0.5 text-xs text-slate-400">Perfil medico</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        <NavItem to="/doctor" end icon={<IconGrid />} label="Dashboard" onClick={onNavigate} />
        <NavItem to="/doctor/alerts" icon={<IconBell />} label="Alertas" onClick={onNavigate} />
        <NavItem to="/doctor/reports" icon={<IconChart />} label="Relatorios" onClick={onNavigate} />
        <NavItem to="/doctor/indicators" icon={<IconBarChart />} label="Indicadores" onClick={onNavigate} />
      </div>

      <div className="border-t border-slate-800 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white"
        >
          <IconLogout />
          Sair
        </button>
      </div>
    </nav>
  );
}

interface DoctorLayoutProps {
  children: ReactNode;
}

export function DoctorLayout({ children }: DoctorLayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <aside className="hidden h-screen w-64 shrink-0 sticky top-0 lg:block">
        <DoctorSidebar />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 lg:h-16 lg:px-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
                aria-label="Abrir menu"
              >
                <IconMenu />
              </button>
              <span className="text-sm font-semibold text-slate-800 lg:hidden">GestaCare</span>
            </div>

            <AccountShortcut compact onClick={() => navigate('/doctor/profile')} />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin" id="main-content">
          {children}
        </main>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            onClick={() => setIsMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar menu"
          />
          <div className="absolute inset-y-0 left-0 w-64">
            <DoctorSidebar onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
