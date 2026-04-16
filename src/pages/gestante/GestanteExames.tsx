import { useEffect, useMemo, useState } from 'react';
import { GestanteLayout } from '../../components/layout/GestanteLayout';
import { Badge } from '../../components/ui/Badge';
import { Card, CardBody } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { formatDate } from '../../lib/utils';
import {
  fetchMyExams,
  formatExamSize,
  getExamDownloadUrl,
  type ExamUploadInput,
  type MedicalExam,
  uploadMyExam,
} from '../../services/examsService';

const EXAM_TYPES = [
  'Ultrassom obstetrico',
  'Hemograma',
  'Glicemia',
  'Urina',
  'Sorologia',
  'Cardiotocografia',
  'Outro exame',
];

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <Card>
      <CardBody className="py-16 text-center">
        <svg className="mx-auto mb-4 h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v4.125c0 .621-.504 1.125-1.125 1.125H5.625A1.125 1.125 0 014.5 18.375V14.25m3.75-3 3.75-3.75m0 0 3.75 3.75M12 7.5v8.25" />
        </svg>
        <h2 className="text-base font-semibold text-slate-800">Nenhum exame enviado ainda</h2>
        <p className="mt-2 text-sm text-slate-500">
          Envie PDFs de exames para que seu medico consiga revisar esse material no acompanhamento.
        </p>
        <button
          type="button"
          onClick={onUpload}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
        >
          Enviar primeiro exame
        </button>
      </CardBody>
    </Card>
  );
}

function ExamCard({ exam }: { exam: MedicalExam }) {
  return (
    <Card hoverable>
      <CardBody className="pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{exam.titulo}</h3>
              {exam.tipoExame && <Badge variant="info">{exam.tipoExame}</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {exam.dataExame ? `Data do exame: ${formatDate(exam.dataExame)}` : 'Data do exame nao informada'}
            </p>
          </div>
          <Badge variant="neutral">{formatExamSize(exam.tamanhoBytes)}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Arquivo</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{exam.nomeArquivo}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Enviado em</p>
            <p className="mt-2 text-sm font-medium text-slate-800">{formatDate(exam.enviadoEm)}</p>
          </div>
        </div>

        {exam.observacoes && (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observacoes</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{exam.observacoes}</p>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <a
            href={getExamDownloadUrl(exam.id)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
          >
            Abrir PDF
          </a>
        </div>
      </CardBody>
    </Card>
  );
}

function UploadExamForm({
  onCancel,
  onSaved,
}: {
  onCancel: () => void;
  onSaved: (exam: MedicalExam) => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [tipoExame, setTipoExame] = useState(EXAM_TYPES[0]);
  const [dataExame, setDataExame] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError('Selecione um arquivo PDF para enviar.');
      return;
    }
    if (file.type !== 'application/pdf') {
      setError('Envie apenas arquivos PDF.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload: ExamUploadInput = {
        titulo: titulo.trim() || file.name.replace(/\.pdf$/i, ''),
        tipoExame: tipoExame || undefined,
        dataExame: dataExame || undefined,
        observacoes: observacoes.trim() || undefined,
        nomeArquivo: file.name,
        mimeType: file.type,
        conteudoBase64: await fileToDataUrl(file),
      };
      const saved = await uploadMyExam(payload);
      onSaved(saved);
    } catch {
      setError('Nao foi possivel enviar o exame. Tente novamente.');
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="exam-title" className="mb-1.5 block text-sm font-medium text-slate-700">Titulo do exame</label>
          <input
            id="exam-title"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            placeholder="Ex.: Ultrassom morfologico"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
          />
        </div>
        <div>
          <label htmlFor="exam-type" className="mb-1.5 block text-sm font-medium text-slate-700">Tipo</label>
          <select
            id="exam-type"
            value={tipoExame}
            onChange={(event) => setTipoExame(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
          >
            {EXAM_TYPES.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <label htmlFor="exam-date" className="mb-1.5 block text-sm font-medium text-slate-700">Data do exame</label>
          <input
            id="exam-date"
            type="date"
            value={dataExame}
            onChange={(event) => setDataExame(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
          />
        </div>
        <div>
          <label htmlFor="exam-file" className="mb-1.5 block text-sm font-medium text-slate-700">Arquivo PDF</label>
          <input
            id="exam-file"
            type="file"
            accept="application/pdf"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700"
          />
          <p className="mt-1 text-xs text-slate-400">Formato aceito: PDF. Tamanho maximo: 10 MB.</p>
        </div>
      </div>

      <div>
        <label htmlFor="exam-notes" className="mb-1.5 block text-sm font-medium text-slate-700">Observacoes</label>
        <textarea
          id="exam-notes"
          rows={4}
          value={observacoes}
          onChange={(event) => setObservacoes(event.target.value)}
          placeholder="Opcional: contextualize o exame para o medico."
          className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Enviando...' : 'Enviar exame'}
        </button>
      </div>
    </form>
  );
}

export function GestanteExames() {
  const [exams, setExams] = useState<MedicalExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  function loadExams() {
    setLoading(true);
    setError(null);
    fetchMyExams()
      .then(setExams)
      .catch(() => setError('Nao foi possivel carregar seus exames. Tente novamente.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadExams();
  }, []);

  const orderedExams = useMemo(
    () => [...exams].sort((a, b) => new Date(b.enviadoEm).getTime() - new Date(a.enviadoEm).getTime()),
    [exams],
  );

  return (
    <GestanteLayout>
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold text-slate-900">Exames</h1>
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Enviar PDF
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Meus exames</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Envie exames em PDF para que seu medico consiga revisar esse material no acompanhamento.
          </p>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          PDFs anexados aqui ficam disponiveis para consulta da equipe medica. Prefira titulos claros e, se necessario, adicione observacoes curtas.
        </div>

        {loading ? (
          <PageSpinner label="Carregando exames..." />
        ) : error ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : orderedExams.length === 0 ? (
          <EmptyState onUpload={() => setShowUploadModal(true)} />
        ) : (
          <div className="grid gap-4">
            {orderedExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Enviar exame em PDF"
        maxWidth="max-w-2xl"
      >
        <UploadExamForm
          onCancel={() => setShowUploadModal(false)}
          onSaved={(exam) => {
            setExams((current) => [exam, ...current]);
            setShowUploadModal(false);
          }}
        />
      </Modal>
    </GestanteLayout>
  );
}
