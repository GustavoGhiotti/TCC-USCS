import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { getRelatos, getMedicamentos } from '../services/apiMock';
import { RelatoDiario, Medicamento } from '../types/domain';
import { getOrientacoes, Orientacao } from '../services/apiMock';
import { useNavigate } from 'react-router-dom';

export function DashboardGestante() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [relatos, setRelatos] = useState<RelatoDiario[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [orientacoes, setOrientacoes] = useState<Orientacao[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const [relatosData, medicamentosData, orientacoesData] = await Promise.all([
        getRelatos(user.id),
        getMedicamentos(user.id),
        getOrientacoes(user.id),
      ]);
      setRelatos(relatosData);
      setMedicamentos(medicamentosData);
      setOrientacoes(orientacoesData);
    }
    loadData();
  }, [user]);

  const medicamentosAtivos = medicamentos.filter((m) => m.ativo);

  return (
    <MainLayout>
      <div className="mb-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-slate-800">
              Bem-vinda, {user?.nomeCompleto}! 
            </h2>
            <p className="text-slate-600">
              Acompanhe sua saúde e bem-estar durante a gestação
            </p>
          </div>
          <button
            onClick={() => navigate('/gestante/relatos')}
            className="px-8 py-4 text-lg font-bold text-white transition-all transform rounded-lg shadow-lg bg-sky-600 hover:bg-sky-700 hover:-translate-y-1"
          >
            📝 Novo Relato
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="p-6 bg-white border-l-4 border-blue-600 rounded-lg shadow">
          <h3 className="text-sm font-semibold uppercase text-slate-600">
            Relatos Registrados
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-800">{relatos.length}</p>
          <button
            onClick={() => navigate('/gestante/relatos')}
            className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            Ver relatos →
          </button>
        </div>

        <div className="p-6 bg-white border-l-4 border-green-600 rounded-lg shadow">
          <h3 className="text-sm font-semibold uppercase text-slate-600">
            Medicamentos Ativos
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {medicamentosAtivos.length}
          </p>
          <button
            onClick={() => navigate('/gestante/medicamentos')}
            className="mt-3 text-xs font-medium text-green-600 hover:text-green-800"
          >
            Gerenciar →
          </button>
        </div>

        <div className="p-6 bg-white border-l-4 border-purple-600 rounded-lg shadow">
          <h3 className="text-sm font-semibold uppercase text-slate-600">
            Análises da IA
          </h3>
          <p className="mt-2 text-3xl font-bold text-slate-800">
            {relatos.length > 0 ? '✓' : '—'}
          </p>
          <button
            onClick={() => navigate('/gestante/resumos')}
            className="mt-3 text-xs font-medium text-purple-600 hover:text-purple-800"
          >
            Ver análises →
          </button>
        </div>
      </div>

      {orientacoes.length > 0 && (
        <div className="p-6 mb-8 border border-teal-200 rounded-lg shadow-sm bg-teal-50">
          <h3 className="mb-3 text-lg font-bold text-teal-900">💬 Orientações do Médico</h3>
          <div className="space-y-3">
            {orientacoes.slice(0, 2).map(orientacao => (
              <div key={orientacao.id} className="p-3 bg-white border border-teal-100 rounded">
                <div className="flex justify-between mb-1 text-xs text-teal-600">
                  <span className="font-semibold">Dr. Responsável</span>
                  <span>{orientacao.data}</span>
                </div>
                <p className="text-teal-800">{orientacao.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
             Últimos Relatos
          </h3>
          {relatos.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum relato registrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {relatos.slice(0, 3).map((relato) => (
                <div
                  key={relato.id}
                  className="p-3 border rounded bg-slate-50 border-slate-200"
                >
                  <p className="text-sm font-medium text-slate-800">
                    {relato.data}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {relato.descricao.substring(0, 60)}...
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/gestante/relatos')}
            className="w-full px-4 py-2 mt-4 text-sm font-medium text-white rounded bg-sky-600 hover:bg-sky-700"
          >
            + Novo Relato
          </button>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
             Medicamentos Atuais
          </h3>
          {medicamentosAtivos.length === 0 ? (
            <p className="text-sm text-slate-500">
              Nenhum medicamento ativo.
            </p>
          ) : (
            <div className="space-y-3">
              {medicamentosAtivos.slice(0, 3).map((med) => (
                <div
                  key={med.id}
                  className="p-3 border border-green-200 rounded bg-green-50"
                >
                  <p className="text-sm font-medium text-slate-800">
                    {med.nome}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {med.dosagem} - {med.frequencia}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}