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
            <h2 className="mb-1 text-3xl font-bold text-stone-800">
              Bem-vinda, <span className="text-rose-600">{user?.nomeCompleto}</span>! 
            </h2>
            <p className="text-stone-500 text-lg">
              Acompanhe sua saúde e bem-estar durante a gestação
            </p>
          </div>
          <button
            onClick={() => navigate('/gestante/relatos')}
            className="px-8 py-4 text-lg font-bold text-white transition-all transform rounded-2xl shadow-lg bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 hover:-translate-y-1 hover:shadow-rose-200"
          >
            📝 Novo Relato
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-rose-50">
          <h3 className="text-sm font-semibold uppercase text-stone-400 tracking-wider">
            Relatos Registrados
          </h3>
          <p className="mt-2 text-4xl font-bold text-rose-600">{relatos.length}</p>
          <button
            onClick={() => navigate('/gestante/relatos')}
            className="mt-4 text-sm font-medium text-rose-500 hover:text-rose-700 flex items-center gap-1"
          >
            Ver relatos →
          </button>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-rose-50">
          <h3 className="text-sm font-semibold uppercase text-stone-400 tracking-wider">
            Medicamentos Ativos
          </h3>
          <p className="mt-2 text-4xl font-bold text-teal-600">
            {medicamentosAtivos.length}
          </p>
          <button
            onClick={() => navigate('/gestante/medicamentos')}
            className="mt-4 text-sm font-medium text-teal-500 hover:text-teal-700 flex items-center gap-1"
          >
            Gerenciar →
          </button>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-rose-50">
          <h3 className="text-sm font-semibold uppercase text-stone-400 tracking-wider">
            Análises da IA
          </h3>
          <p className="mt-2 text-4xl font-bold text-purple-600">
            {relatos.length > 0 ? '✓' : '—'}
          </p>
          <button
            onClick={() => navigate('/gestante/resumos')}
            className="mt-4 text-sm font-medium text-purple-500 hover:text-purple-700 flex items-center gap-1"
          >
            Ver análises →
          </button>
        </div>
      </div>

      {orientacoes.length > 0 && (
        <div className="p-6 mb-8 border border-teal-100 rounded-2xl shadow-sm bg-teal-50/50">
          <h3 className="mb-3 text-lg font-bold text-teal-900">💬 Orientações do Médico</h3>
          <div className="space-y-3">
            {orientacoes.slice(0, 2).map(orientacao => (
              <div key={orientacao.id} className="p-4 bg-white border border-teal-100 rounded-xl shadow-sm">
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
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-rose-50">
          <h3 className="mb-6 text-lg font-bold text-stone-800">
             Últimos Relatos
          </h3>
          {relatos.length === 0 ? (
            <p className="text-sm text-stone-500 italic">
              Nenhum relato registrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {relatos.slice(0, 3).map((relato) => (
                <div
                  key={relato.id}
                  className="p-4 border border-rose-100 rounded-xl bg-rose-50/30 hover:bg-rose-50 transition-colors"
                >
                  <p className="text-sm font-bold text-stone-700">
                    {relato.data}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {relato.descricao.substring(0, 60)}...
                  </p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => navigate('/gestante/relatos')}
            className="w-full px-4 py-3 mt-6 text-sm font-bold text-rose-600 rounded-xl bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            + Novo Relato
          </button>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-rose-50">
          <h3 className="mb-6 text-lg font-bold text-stone-800">
             Medicamentos Atuais
          </h3>
          {medicamentosAtivos.length === 0 ? (
            <p className="text-sm text-stone-500 italic">
              Nenhum medicamento ativo.
            </p>
          ) : (
            <div className="space-y-3">
              {medicamentosAtivos.slice(0, 3).map((med) => (
                <div
                  key={med.id}
                  className="p-4 border border-teal-100 rounded-xl bg-teal-50/30"
                >
                  <p className="text-sm font-bold text-stone-700">
                    {med.nome}
                  </p>
                  <p className="mt-1 text-sm text-teal-600">
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