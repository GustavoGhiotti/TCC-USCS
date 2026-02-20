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
          <h2 className="text-2xl font-semibold text-slate-800">Medicamentos</h2>
          <p className="text-sm text-slate-600">Gerenciar prescrições e tratamentos</p>
        </div>
      </div>

      <div className="grid gap-6">
        {medicamentosAtivos.length > 0 && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Ativos</h3>
            <div className="grid gap-3">
              {medicamentosAtivos.map((med) => (
                <div
                  key={med.id}
                  className="p-4 bg-white border-l-4 border-green-600 rounded shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800">{med.nome}</h4>
                      <p className="mt-1 text-sm text-slate-600">
                        Dosagem: <span className="font-medium">{med.dosagem}</span>
                      </p>
                      <p className="text-sm text-slate-600">
                        Frequência: <span className="font-medium">{med.frequencia}</span>
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Desde {med.dataInicio}
                      </p>
                    </div>
                    <Button
                      onClick={() => toggleMedicamento(med.id)}
                      className="text-xs bg-red-600 hover:bg-red-700"
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
            <h3 className="mb-4 text-lg font-semibold text-slate-800">Inativos</h3>
            <div className="grid gap-3">
              {medicamentosInativos.map((med) => (
                <div
                  key={med.id}
                  className="p-4 border-l-4 rounded shadow bg-slate-50 opacity-60 border-slate-400"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-600">{med.nome}</h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Dosagem: {med.dosagem}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        Até {med.dataFim || 'Data não definida'}
                      </p>
                    </div>
                    <Button
                      onClick={() => toggleMedicamento(med.id)}
                      className="text-xs bg-green-600 hover:bg-green-700"
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
          <div className="p-8 text-center bg-white rounded shadow">
            <p className="text-slate-500">Nenhum medicamento registrado.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}