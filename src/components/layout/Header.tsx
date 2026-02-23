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
      <div className="flex items-center justify-between max-w-6xl px-6 py-4 mx-auto">
        <div>
          <h1 className="text-lg font-semibold text-stone-700">
            Olá, tenha um ótimo dia ☀️
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-stone-700">{user?.nomeCompleto}</p>
            <p className="text-xs text-rose-500 font-medium capitalize">{user?.role}</p>
          </div>
          <Button
            onClick={handleLogout}
            className="text-sm bg-red-600 hover:bg-red-700"
          >
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}