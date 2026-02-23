import { useEffect, useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { getRelatos, createRelato } from '../services/apiMock';
import { RelatoDiario } from '../types/domain';

interface RelatoExtended extends RelatoDiario {
  ocorrencias?: string;
  sinaisVitais?: {
    pressao?: string;
    batimentos?: string | number;
    oxigenacao?: number;
    outros?: string;
  };
}

export function Relatos() {
  const { user } = useAuth();
  const [relatos, setRelatos] = useState<RelatoExtended[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    humor: 'normal',
    sintomas: [] as string[],
    pressaoArterial: '',
    batimentosCardiacos: '',
    ocorrencias: '',
  });

  const sintomasDisponiveis = [
    'enjôo',
    'fadiga',
    'dor nas costas',
    'inchaço',
    'insônia',
    'dor de cabeça',
    'edema',
    'contrações',
  ];

  useEffect(() => {
    async function loadRelatos() {
      if (!user) return;
      const data = await getRelatos(user.id);
      setRelatos(data as RelatoExtended[]);
    }
    loadRelatos();
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const relatoData = {
        id: '',
        gestanteId: user.id,
        data: formData.data,
        descricao: formData.descricao,
        humor: formData.humor as 'feliz' | 'normal' | 'triste' | 'ansioso',
        sintomas: formData.sintomas,
        sinaisVitais: {
          pressao: formData.pressaoArterial,
          batimentos: formData.batimentosCardiacos
        },
        ocorrencias: formData.ocorrencias
      };

      const novoRelato = await createRelato(relatoData as unknown as RelatoDiario);

      setRelatos([novoRelato as unknown as RelatoExtended, ...relatos]);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        descricao: '',
        humor: 'normal',
        sintomas: [],
        pressaoArterial: '',
        batimentosCardiacos: '',
        ocorrencias: '',
      });
      setShowForm(false);
    } finally {
      setLoading(false);
    }
  }

  function toggleSintoma(sintoma: string) {
    setFormData((prev) => ({
      ...prev,
      sintomas: prev.sintomas.includes(sintoma)
        ? prev.sintomas.filter((s) => s !== sintoma)
        : [...prev.sintomas, sintoma],
    }));
  }

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-stone-800">Relatos Diários</h2>
          <p className="text-stone-500">Registre como você está se sentindo</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancelar' : '+ Novo Relato'}
        </Button>
      </div>

      {showForm && (
        <div className="p-8 mb-8 bg-white border shadow-sm rounded-2xl border-rose-100">
          <h3 className="mb-6 text-xl font-bold text-rose-600">Novo Relato</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-stone-700">
                  Data
                </label>
                <Input
                  type="date"
                  value={formData.data}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, data: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-stone-700">
                  Como você está se sentindo?
                </label>
                <select
                  value={formData.humor}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, humor: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-white border rounded-xl border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="feliz">😊 Feliz</option>
                  <option value="normal">😐 Normal</option>
                  <option value="triste">😢 Triste</option>
                  <option value="ansioso">😰 Ansioso</option>
                </select>
              </div>
            </div>

            <div className="p-6 border rounded-xl bg-rose-50/30 border-rose-100">
              <h4 className="mb-4 text-sm font-bold text-rose-700">Sinais Vitais (Opcional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2 text-xs font-bold tracking-wide uppercase text-stone-600">
                    Pressão Arterial (ex: 120/80)
                  </label>
                  <Input
                    value={formData.pressaoArterial}
                    onChange={(e) => setFormData(prev => ({ ...prev, pressaoArterial: e.target.value }))}
                    placeholder="120/80"
                  />
                </div>
                <div>
                  <label className="block mb-2 text-xs font-bold tracking-wide uppercase text-stone-600">
                    Batimentos Cardíacos (BPM)
                  </label>
                  <Input
                    type="number"
                    value={formData.batimentosCardiacos}
                    onChange={(e) => setFormData(prev => ({ ...prev, batimentosCardiacos: e.target.value }))}
                    placeholder="80"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-stone-700">
                Descrição
              </label>
              <textarea
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Descreva como você se sente hoje..."
                className="w-full h-24 px-4 py-3 border resize-none rounded-xl border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-stone-700">
                Ocorrências Relevantes (quedas, mal-estar súbito, etc.)
              </label>
              <Input
                value={formData.ocorrencias}
                onChange={(e) => setFormData(prev => ({ ...prev, ocorrencias: e.target.value }))}
                placeholder="Houve algo fora do comum?"
              />
            </div>

            <div>
              <label className="block mb-3 text-sm font-medium text-stone-700">
                Sintomas (selecione os que está sentindo)
              </label>
              <div className="flex flex-wrap gap-3">
                {sintomasDisponiveis.map((sintoma) => (
                  <label key={sintoma} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all ${
                    formData.sintomas.includes(sintoma) 
                      ? 'bg-rose-100 border-rose-300 text-rose-700 font-medium' 
                      : 'bg-white border-stone-200 text-stone-600 hover:border-rose-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.sintomas.includes(sintoma)}
                      onChange={() => toggleSintoma(sintoma)}
                      className="hidden"
                    />
                    <span className="text-sm">{sintoma}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Relato'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-500 hover:bg-slate-600"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {relatos.length === 0 ? (
          <div className="p-12 text-center bg-white border border-dashed shadow-sm rounded-2xl border-stone-300">
            <p className="text-stone-500">Nenhum relato registrado ainda.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4">
              Criar Primeiro Relato
            </Button>
          </div>
        ) : (
          relatos.map((relato) => (
            <div key={relato.id} className="p-6 transition-shadow bg-white border shadow-sm rounded-2xl border-stone-100 hover:shadow-md">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-lg font-bold text-stone-800">{relato.data}</p>
                  <p className="text-sm capitalize text-stone-500">Humor: {relato.humor}</p>
                </div>
              </div>
              <p className="mb-4 leading-relaxed text-stone-700">{relato.descricao}</p>
              {relato.sintomas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {relato.sintomas.map((sintoma) => (
                    <span
                      key={sintoma}
                      className="px-3 py-1 text-xs font-medium border rounded-full text-amber-700 bg-amber-50 border-amber-100"
                    >
                      {sintoma}
                    </span>
                  ))}
                </div>
              )}
              {(relato.sinaisVitais?.pressao || relato.sinaisVitais?.batimentos) && (
                <div className="inline-block p-3 mt-4 text-xs text-stone-600 bg-stone-50 rounded-xl">
                  <strong>Sinais Vitais: </strong>
                  {relato.sinaisVitais.pressao && `PA: ${relato.sinaisVitais.pressao} `}
                  {relato.sinaisVitais.batimentos && `| BPM: ${relato.sinaisVitais.batimentos}`}
                </div>
              )}
              {relato.ocorrencias && typeof relato.ocorrencias === 'string' && !relato.ocorrencias.toLowerCase().includes('nenhuma') && (
                <p className="p-2 mt-3 text-sm border rounded-lg text-rose-600 bg-rose-50 border-rose-100"><strong>⚠️ Ocorrência:</strong> {relato.ocorrencias}</p>
              )}
            </div>
          ))
        )}
      </div>
    </MainLayout>
  );
}