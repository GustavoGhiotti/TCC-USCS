import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function Sidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const gestanteLinks = [
    { path: '/gestante/dashboard', label: 'Dashboard' },
    { path: '/gestante/relatos', label: 'Relatos'},
    { path: '/gestante/resumos', label: 'Resumos IA' },
    { path: '/gestante/medicamentos', label: 'Medicamentos'},
    { path: '/gestante/consultas', label: 'Consultas' },
  ];

  const medicoLinks = [
    { path: '/medico/dashboard', label: 'Dashboard'},
    { path: '/medico/alertas', label: 'Alertas'},
    { path: '/medico/relatorios', label: 'Relatórios'},
  ];

  const links = user?.role === 'gestante' ? gestanteLinks : medicoLinks;

  return (
    <aside className="flex flex-col w-64 bg-white border-r border-rose-100 shadow-sm">
      <div className="p-8 border-b border-rose-50">
        <h2 className="text-xl font-bold text-rose-600 flex items-center gap-2">🌸 GestCare</h2>
        <p className="mt-1 text-xs font-medium uppercase tracking-wider text-stone-400">{user?.role}</p>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-3">
          {links.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`w-full text-left px-5 py-3.5 rounded-xl transition-all duration-200 font-medium ${
                isActive(link.path)
                  ? 'bg-rose-100 text-rose-700 shadow-sm'
                  : 'text-stone-500 hover:bg-rose-50 hover:text-rose-600'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="p-6 text-xs border-t border-rose-50 text-stone-400 text-center">
        <p>Versão 0.3</p>
        <p className="mt-2">TCC - 2026</p>
      </div>
    </aside>
  );
}