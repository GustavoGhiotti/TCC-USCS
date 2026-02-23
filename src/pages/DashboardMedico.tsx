import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useNavigate } from 'react-router-dom';
import { getAllGestantes, getRelatosGestante } from '../services/apiMock';
import { User } from '../types/domain';
import { Button } from '../components/ui/Button';

interface GestanteComRelatos extends User {
  totalRelatos: number;
  ultimoRelato?: string;
  statusRisco: 'verde' | 'amarelo' | 'vermelho';
  dadosExames?: { pressaoArterial: string; circunferenciaAbdominal: string };
}

export function DashboardMedico() {
  const [gestantes, setGestantes] = useState<GestanteComRelatos[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      const todasGestantes = await getAllGestantes();
      const gestantesComRelatos = await Promise.all(
        todasGestantes.map(async (gestante) => {
          const relatos = await getRelatosGestante(gestante.id);
          
          // Simular status de risco baseado em sintomas
          let statusRisco: 'verde' | 'amarelo' | 'vermelho' = 'verde';
          if (relatos.length > 0) {
            const ultimoRelato = relatos[0];
            const sintomasGraves = ['contrações', 'sangramento', 'pressão alta'];
            const temSintomaGrave = ultimoRelato.sintomas.some(s => 
              sintomasGraves.includes(s.toLowerCase())
            );
            
            if (temSintomaGrave) {
              statusRisco = 'vermelho';
            } else if (ultimoRelato.sintomas.length > 3) {
              statusRisco = 'amarelo';
            }
          }

          return {
            ...gestante,
            totalRelatos: relatos.length,
            ultimoRelato: relatos[0]?.data || 'Sem relatos',
            statusRisco,
            // @ts-ignore - dadosExames added to mock
            dadosExames: gestante.dadosExames
          };
        })
      );

      setGestantes(gestantesComRelatos);
      setLoading(false);
    }

    loadData();
  }, []);

  const getSemaforoIcon = (status: string) => {
    switch (status) {
      case 'verde':
        return '🟢';
      case 'amarelo':
        return '🟡';
      case 'vermelho':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const getSemaforoColor = (status: string) => {
    switch (status) {
      case 'verde':
        return 'bg-teal-50 border-teal-200';
      case 'amarelo':
        return 'bg-amber-50 border-amber-200';
      case 'vermelho':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-stone-50 border-stone-200';
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <p className="text-slate-600">Carregando dados...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="mb-2 text-3xl font-bold text-stone-800">
            Dashboard Médico
          </h2>
          <p className="text-stone-500">
            Acompanhe suas pacientes gestantes
          </p>
        </div>
        <Button onClick={() => alert('Funcionalidade de associar novo paciente')}>
          + Associar Novo Paciente
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
        <div className="p-6 bg-white border shadow-sm border-rose-100 rounded-2xl">
          <h3 className="text-sm font-bold tracking-wider uppercase text-stone-400">
            Total de Pacientes
          </h3>
          <p className="mt-2 text-4xl font-bold text-stone-800">{gestantes.length}</p>
        </div>

        <div className="p-6 bg-white border border-teal-100 shadow-sm rounded-2xl">
          <h3 className="text-sm font-bold tracking-wider text-teal-600 uppercase">
            Status Normal
          </h3>
          <p className="mt-2 text-4xl font-bold text-teal-700">
            {gestantes.filter((g) => g.statusRisco === 'verde').length}
          </p>
        </div>

        <div className="p-6 bg-white border shadow-sm border-rose-200 rounded-2xl">
          <h3 className="text-sm font-bold tracking-wider uppercase text-rose-600">
            Necessitam Atenção
          </h3>
          <p className="mt-2 text-4xl font-bold text-rose-700">
            {gestantes.filter((g) => g.statusRisco !== 'verde').length}
          </p>
        </div>
      </div>

      <div className="overflow-hidden bg-white border shadow-sm rounded-3xl border-rose-50">
        <div className="px-8 py-6 border-b border-rose-50 bg-rose-50/30">
          <h3 className="text-lg font-bold text-stone-800">
             Minhas Pacientes
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b border-rose-50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-stone-400">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-stone-400">
                  Paciente
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-stone-400">
                  Semanas
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-stone-400">
                  Dados Recentes
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-stone-400">
                  Relatos
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-stone-400">
                  Último Relato
                </th>
                <th className="px-6 py-4 text-xs font-bold tracking-wider text-left uppercase text-stone-400">
                  Ação
                </th>
              </tr>
            </thead>
            <tbody>
              {gestantes.map((gestante) => (
                <tr key={gestante.id} className={`border-b hover:bg-rose-50/30 transition-colors ${getSemaforoColor(gestante.statusRisco)}`}>
                  <td className="px-6 py-4 text-center">
                    <span className="text-2xl">
                      {getSemaforoIcon(gestante.statusRisco)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-stone-700">
                      {gestante.nomeCompleto}
                    </div>
                    <div className="text-sm text-stone-400">{gestante.email}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-stone-600">
                    {gestante.semanasGestacao || '—'}
                  </td>
                  <td className="px-6 py-4 text-xs text-stone-600">
                    {gestante.dadosExames ? (
                      <>
                        <p>PA: {gestante.dadosExames.pressaoArterial}</p>
                        <p>Circ: {gestante.dadosExames.circunferenciaAbdominal}</p>
                      </>
                    ) : (
                      <span className="text-stone-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-sm font-bold rounded-full text-rose-600 bg-rose-100">
                      {gestante.totalRelatos}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-stone-500">
                    {gestante.ultimoRelato}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/medico/paciente/${gestante.id}`)}
                      className="text-sm font-bold text-rose-500 hover:text-rose-700 hover:underline"
                    >
                      Ver Detalhes →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {gestantes.length === 0 && (
          <div className="px-6 py-8 text-center">
            <p className="text-slate-500">Nenhuma paciente registrada.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}