import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-rose-100 sticky top-0 z-10">
      <div className="flex items-center justify-between max-w-6xl px-4 py-3 sm:px-6 sm:py-4 mx-auto gap-3">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg font-semibold text-stone-700 truncate">Ola, tenha um otimo dia</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-stone-700 truncate max-w-[180px]">{user?.nomeCompleto}</p>
            <p className="text-xs text-rose-500 font-medium capitalize">{user?.role}</p>
          </div>
          <Button onClick={handleLogout} className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 px-3 py-2">
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
