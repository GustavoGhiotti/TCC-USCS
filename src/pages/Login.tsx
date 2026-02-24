import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { login } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUser } = useAuth();

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErro(null);
    setLoading(true);

    try {
      const user = await login(email, senha);
      setUser(user);

      if (user.role === 'gestante') {
        navigate('/gestante/dashboard');
      } else {
        navigate('/medico/dashboard');
      }
    } catch {
      setErro('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-sky-600 to-sky-800">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">🏥</h1>
          <h2 className="mt-2 text-2xl font-bold text-slate-800">
            Sistema de Monitoramento
          </h2>
          <p className="mt-1 text-slate-600">Saúde da Gestante</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              E-mail
            </label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-slate-700">
              Senha
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          {erro && (
            <div className="px-4 py-3 text-sm text-red-800 border border-red-200 rounded bg-red-50">
              {erro}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-xs text-center text-slate-500">
          Sistema de Monitoramento de Gestantes - TCC 2026
        </p>
      </div>
    </div>
  );
}

export default Login;
