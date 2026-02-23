import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { getMedicamentos } from '../services/apiMock';
import { Medicamento } from '../types/domain';

export function Medicamentos() {
  const { user } = useAuth();
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);

  useEffect(() => {
    async function loadMedicamentos() {
      if (!user) return;
      const data = await getMedicamentos(user.id);
      setMedicamentos(data);
    }
    loadMedicamentos();
  }, [user]);

  function toggleMedicamento(id: string) {
    setMedicamentos((prev) =>
      prev.map((med) => (med.id === id ? { ...med, ativo: !med.ativo } : med))
    );
  }

  const medicamentosAtivos = medicamentos.filter((m) => m.ativo);
  const medicamentosInativos = medicamentos.filter((m) => !m.ativo);

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Medicamentos</h2>
          <p className="text-stone-500">Gerenciar prescrições e tratamentos</p>
        </div>
      </div>

      <div className="grid gap-6">
        {medicamentosAtivos.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-bold text-teal-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span> Em Uso
            </h3>
            <div className="grid gap-3">
              {medicamentosAtivos.map((med) => (
                <div
                  key={med.id}
                  className="p-5 bg-white border border-teal-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-stone-800">{med.nome}</h4>
                      <p className="mt-1 text-sm text-stone-600">
                        <span className="font-semibold text-teal-600">{med.dosagem}</span> • {med.frequencia}
                      </p>
                      <p className="mt-2 text-xs text-stone-400">
                        Desde {med.dataInicio}
                      </p>
                    </div>
                    <Button
                      onClick={() => toggleMedicamento(med.id)}
                      className="text-xs bg-white text-rose-500 border border-rose-200 hover:bg-rose-50"
                    >
                      Desativar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {medicamentosInativos.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-bold text-stone-500 flex items-center gap-2 mt-6">
              <span className="w-2 h-2 rounded-full bg-stone-300"></span> Histórico
            </h3>
            <div className="grid gap-3">
              {medicamentosInativos.map((med) => (
                <div
                  key={med.id}
                  className="p-4 border border-stone-100 rounded-2xl bg-stone-50 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-stone-600">{med.nome}</h4>
                      <p className="mt-1 text-sm text-stone-500">
                        Dosagem: {med.dosagem}
                      </p>
                      <p className="mt-2 text-xs text-stone-400">
                        Até {med.dataFim || 'Data não definida'}
                      </p>
                    </div>
                    <Button
                      onClick={() => toggleMedicamento(med.id)}
                      className="text-xs bg-white text-teal-600 border border-teal-200 hover:bg-teal-50"
                    >
                      Reativar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {medicamentos.length === 0 && (
          <div className="p-12 text-center bg-white rounded-2xl shadow-sm border border-dashed border-stone-300">
            <p className="text-stone-500">Nenhum medicamento registrado.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}