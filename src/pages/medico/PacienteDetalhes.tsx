import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Button } from '../../components/ui/Button';
import { getGestanteById, getRelatosGestante, getMedicamentosGestante, getProntuarios, createProntuario, createMedicamento, Prontuario, getResumosIA, createOrientacao } from '../../services/apiMock';
import { User, RelatoDiario, Medicamento } from '../../types/domain';
import { Input } from '../../components/ui/Input';

export function PacienteDetalhes() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gestante, setGestante] = useState<User | null>(null);
  const [relatos, setRelatos] = useState<RelatoDiario[]>([]);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [prontuarios, setProntuarios] = useState<Prontuario[]>([]);
  const [resumoIA, setResumoIA] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'relatos' | 'medicamentos' | 'analise' | 'prontuario'>('analise');

  // Estados para formulários
  const [showNewProntuario, setShowNewProntuario] = useState(false);
  const [newProntuario, setNewProntuario] = useState({ descricao: '', medicamentos: '', acoes: '' });
  const [showNewMedicamento, setShowNewMedicamento] = useState(false);
  const [newMedicamento, setNewMedicamento] = useState({ nome: '', dosagem: '', frequencia: '' });
  const [novaOrientacao, setNovaOrientacao] = useState('');
  const [enviandoOrientacao, setEnviarOrientacao] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      const gestanteData = await getGestanteById(id);
      const relatosData = await getRelatosGestante(id);
      const medicamentosData = await getMedicamentosGestante(id);
      const prontuariosData = await getProntuarios(id);
      const resumoData = await getResumosIA(id);

      setGestante(gestanteData);
      setRelatos(relatosData);
      setMedicamentos(medicamentosData);
      setProntuarios(prontuariosData);
      setResumoIA(resumoData);
      setLoading(false);
    }

    loadData();
  }, [id]);

  async function handleCreateProntuario(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const prontuario = await createProntuario({
      gestanteId: id,
      data: new Date().toISOString().split('T')[0],
      descricao: newProntuario.descricao,
      medicamentosPrescritos: newProntuario.medicamentos.split(',').map(s => s.trim()).filter(Boolean),
      acoesRealizadas: newProntuario.acoes,
      medicoId: 'med-1' // Mock ID
    });
    setProntuarios([prontuario, ...prontuarios]);
    setNewProntuario({ descricao: '', medicamentos: '', acoes: '' });
    setShowNewProntuario(false);
  }

  async function handleCreateMedicamento(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    const medicamento = await createMedicamento({
      id: '', // Mock will generate
      gestanteId: id,
      nome: newMedicamento.nome,
      dosagem: newMedicamento.dosagem,
      frequencia: newMedicamento.frequencia,
      ativo: true,
      dataPrescricao: new Date().toISOString().split('T')[0]
    });
    setMedicamentos([...medicamentos, medicamento]);
    setNewMedicamento({ nome: '', dosagem: '', frequencia: '' });
    setShowNewMedicamento(false);
    alert('Medicamento incluído! A paciente receberá um alerta.');
  }

  async function handleEnviarOrientacao() {
    if (!id || !novaOrientacao.trim()) return;
    setEnviarOrientacao(true);
    await createOrientacao({
      gestanteId: id,
      medicoId: 'med-1',
      data: new Date().toISOString().split('T')[0],
      texto: novaOrientacao
    });
    setNovaOrientacao('');
    setEnviarOrientacao(false);
    alert('Orientação enviada para a paciente!');
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="py-12 text-center">
          <p className="text-slate-600">Carregando dados da paciente...</p>
        </div>
      </MainLayout>
    );
  }

  if (!gestante) {
    return (
      <MainLayout>
        <div className="p-6 rounded bg-red-50">
          <p className="text-red-800">Paciente não encontrada.</p>
          <Button onClick={() => navigate('/medico/dashboard')} className="mt-4">
            Voltar
          </Button>
        </div>
      </MainLayout>
    );
  }

  const medicamentosAtivos = medicamentos.filter((m) => m.ativo);

  // Função para contar sintomas
  const getSintomasMaisFrequentes = () => {
    const sintomosMap: Record<string, number> = {};
    
    relatos.forEach((relato) => {
      relato.sintomas.forEach((sintoma) => {
        sintomosMap[sintoma] = (sintomosMap[sintoma] || 0) + 1;
      });
    });

    return Object.entries(sintomosMap)
      .map(([sintoma, count]) => ({ sintoma, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const sintomasMaisFrequentes = getSintomasMaisFrequentes();

  return (
    <MainLayout>
      <div className="mb-6">
        <Button onClick={() => navigate('/medico/dashboard')} className="mb-4">
          ← Voltar
        </Button>
        
        <div className="p-8 bg-white rounded-3xl shadow-sm border border-rose-50">
          <h2 className="mb-2 text-3xl font-bold text-stone-800">
            {gestante.nomeCompleto}
          </h2>
          <div className="grid grid-cols-2 gap-4 mt-4 md:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-stone-400 font-bold tracking-wider">Email</p>
              <p className="text-sm font-medium text-stone-700">{gestante.email}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-stone-400 font-bold tracking-wider">Semanas</p>
              <p className="text-sm font-medium text-stone-700">{gestante.semanasGestacao || '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-stone-400 font-bold tracking-wider">Total Relatos</p>
              <p className="text-sm font-medium text-stone-700">{relatos.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-stone-400 font-bold tracking-wider">Medicamentos</p>
              <p className="text-sm font-medium text-stone-700">{medicamentosAtivos.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-rose-50 overflow-hidden">
        <div className="flex border-b border-rose-100 bg-rose-50/30">
          <button
            onClick={() => setActiveTab('analise')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'analise'
                ? 'border-b-2 border-rose-500 text-rose-600 bg-white'
                : 'text-stone-500 hover:text-rose-600 hover:bg-white/50'
            }`}
          >
             Análise
          </button>
          <button
            onClick={() => setActiveTab('relatos')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'relatos'
                ? 'border-b-2 border-rose-500 text-rose-600 bg-white'
                : 'text-stone-500 hover:text-rose-600 hover:bg-white/50'
            }`}
          >
             Relatos ({relatos.length})
          </button>
          <button
            onClick={() => setActiveTab('medicamentos')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'medicamentos'
                ? 'border-b-2 border-rose-500 text-rose-600 bg-white'
                : 'text-stone-500 hover:text-rose-600 hover:bg-white/50'
            }`}
          >
             Medicamentos ({medicamentosAtivos.length})
          </button>
          <button
            onClick={() => setActiveTab('prontuario')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeTab === 'prontuario'
                ? 'border-b-2 border-rose-500 text-rose-600 bg-white'
                : 'text-stone-500 hover:text-rose-600 hover:bg-white/50'
            }`}
          >
             Prontuário
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'relatos' && (
            <div className="space-y-4">
              {relatos.length === 0 ? (
                <p className="text-slate-500">Nenhum relato registrado.</p>
              ) : (
                relatos.map((relato) => (
                  <div key={relato.id} className="p-4 border rounded-lg border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-slate-800">{relato.data}</h4>
                      <span className="text-lg">
                        {relato.humor === 'feliz' && '😊'}
                        {relato.humor === 'normal' && '😐'}
                        {relato.humor === 'triste' && '😢'}
                        {relato.humor === 'ansioso' && '😰'}
                      </span>
                    </div>
                    <p className="mb-3 text-slate-700">{relato.descricao}</p>
                    {/* @ts-ignore - sinaisVitais added to mock but not in domain type yet */}
                    {relato.sinaisVitais && (
                      <div className="p-2 mb-3 text-sm rounded bg-slate-50">
                        <p className="font-semibold text-slate-700">Sinais Vitais:</p>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          {/* @ts-ignore */}
                          <p>BPM: {relato.sinaisVitais.batimentos}</p>
                          {/* @ts-ignore */}
                          <p>O2: {relato.sinaisVitais.oxigenacao}%</p>
                          {/* @ts-ignore */}
                          <p>{relato.sinaisVitais.outros}</p>
                        </div>
                      </div>
                    )}
                    {relato.sintomas.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {relato.sintomas.map((sintoma) => (
                          <span
                            key={sintoma}
                            className="px-3 py-1 text-xs text-yellow-800 bg-yellow-100 rounded"
                          >
                            {sintoma}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'medicamentos' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setShowNewMedicamento(!showNewMedicamento)}>
                  {showNewMedicamento ? 'Cancelar' : '+ Incluir Medicamento'}
                </Button>
              </div>

              {showNewMedicamento && (
                <form onSubmit={handleCreateMedicamento} className="p-4 border rounded-lg bg-slate-50">
                  <h4 className="mb-3 font-semibold text-slate-800">Novo Medicamento</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Input
                      placeholder="Nome do Medicamento"
                      value={newMedicamento.nome}
                      onChange={e => setNewMedicamento({...newMedicamento, nome: e.target.value})}
                      required
                    />
                    <Input
                      placeholder="Dosagem"
                      value={newMedicamento.dosagem}
                      onChange={e => setNewMedicamento({...newMedicamento, dosagem: e.target.value})}
                      required
                    />
                    <Input
                      placeholder="Frequência"
                      value={newMedicamento.frequencia}
                      onChange={e => setNewMedicamento({...newMedicamento, frequencia: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full mt-3">Salvar e Alertar Paciente</Button>
                </form>
              )}

              {medicamentosAtivos.length === 0 ? (
                <p className="text-slate-500">Nenhum medicamento ativo.</p>
              ) : (
                medicamentosAtivos.map((med) => (
                  <div key={med.id} className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h4 className="font-semibold text-slate-800">{med.nome}</h4>
                    <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <p className="text-slate-600">Dosagem</p>
                        <p className="font-medium text-slate-800">{med.dosagem}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Frequência</p>
                        <p className="font-medium text-slate-800">{med.frequencia}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'analise' && (
            <div className="space-y-4">
              <div className="p-6 border border-indigo-200 rounded-lg bg-indigo-50">
                <h3 className="mb-3 text-lg font-bold text-indigo-900">🤖 Análise Inteligente (IA)</h3>
                <div className="prose-sm prose text-indigo-800 whitespace-pre-line">{resumoIA}</div>
              </div>

              {/* Área de Comunicação Direta */}
              <div className="p-4 border border-teal-200 rounded-lg bg-teal-50">
                <h4 className="mb-2 font-semibold text-teal-900">Enviar Orientação à Paciente</h4>
                <p className="mb-3 text-xs text-teal-700">Esta mensagem aparecerá diretamente na área da gestante.</p>
                <div className="flex gap-2">
                  <Input 
                    value={novaOrientacao}
                    onChange={e => setNovaOrientacao(e.target.value)}
                    placeholder="Digite uma orientação rápida..." 
                  />
                  <Button onClick={handleEnviarOrientacao} disabled={enviandoOrientacao}>
                    {enviandoOrientacao ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </div>

              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h4 className="mb-2 font-semibold text-slate-800">Resumo da Análise</h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li>✓ Total de relatos: <strong>{relatos.length}</strong></li>
                  <li>✓ Medicamentos prescritos: <strong>{medicamentosAtivos.length}</strong></li>
                  <li>✓ Último registro: <strong>{relatos[0]?.data || 'Sem relatos'}</strong></li>
                  <li>✓ Semanas de gestação: <strong>{gestante.semanasGestacao || '—'}</strong></li>
                </ul>
              </div>

              {sintomasMaisFrequentes.length > 0 && (
                <div className="p-4 border rounded-lg bg-amber-50 border-amber-200">
                  <h4 className="mb-3 font-semibold text-slate-800">Sintomas Mais Frequentes</h4>
                  <div className="flex flex-wrap gap-2">
                    {sintomasMaisFrequentes.map((item) => (
                      <div key={item.sintoma} className="px-3 py-1 text-sm rounded bg-amber-100 text-amber-800">
                        <span className="font-semibold">{item.sintoma}</span>
                        <span className="ml-2 text-xs">({item.count}x)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prontuario' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button onClick={() => setShowNewProntuario(!showNewProntuario)}>
                  {showNewProntuario ? 'Cancelar' : '+ Novo Atendimento'}
                </Button>
              </div>

              {showNewProntuario && (
                <form onSubmit={handleCreateProntuario} className="p-6 border rounded-lg shadow-sm bg-slate-50">
                  <h4 className="mb-4 font-semibold text-slate-800">Registro de Atendimento</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Descrição do Ocorrido</label>
                      <textarea
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={newProntuario.descricao}
                        onChange={e => setNewProntuario({...newProntuario, descricao: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Medicamentos Prescritos (separar por vírgula)</label>
                      <Input
                        value={newProntuario.medicamentos}
                        onChange={e => setNewProntuario({...newProntuario, medicamentos: e.target.value})}
                        placeholder="Ex: Paracetamol, Vitamina D"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium text-slate-700">Ações Realizadas</label>
                      <textarea
                        className="w-full p-2 border rounded"
                        rows={3}
                        value={newProntuario.acoes}
                        onChange={e => setNewProntuario({...newProntuario, acoes: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">Salvar Prontuário</Button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {prontuarios.map(p => (
                  <div key={p.id} className="p-4 bg-white border rounded-lg shadow-sm">
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-slate-800">{p.data}</span>
                      <span className="text-xs text-slate-500">ID: {p.id}</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold">Ocorrido:</span> {p.descricao}</p>
                      {p.medicamentosPrescritos.length > 0 && (
                        <p><span className="font-semibold">Prescrições:</span> {p.medicamentosPrescritos.join(', ')}</p>
                      )}
                      <p><span className="font-semibold">Ações:</span> {p.acoesRealizadas}</p>
                    </div>
                  </div>
                ))}
                {prontuarios.length === 0 && !showNewProntuario && (
                  <p className="text-center text-slate-500">Nenhum registro de prontuário.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}