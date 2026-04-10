import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { createPatientAccount } from '../../services/doctorApi';

interface AssociatePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function AssociatePatientModal({ isOpen, onClose, onCreated }: AssociatePatientModalProps) {
  const [form, setForm] = useState({
    nomeCompleto: '',
    email: '',
    senha: '',
    telefone: '',
    semanasGestacao: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setForm({
        nomeCompleto: '',
        email: '',
        senha: '',
        telefone: '',
        semanasGestacao: '',
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await createPatientAccount({
        nomeCompleto: form.nomeCompleto.trim(),
        email: form.email.trim(),
        senha: form.senha,
        telefone: form.telefone.trim() || undefined,
        semanasGestacao: form.semanasGestacao ? Number(form.semanasGestacao) : undefined,
      });
      setSuccess('Paciente cadastrado com sucesso. A conta já pode ser usada para login.');
      onCreated?.();
      setForm({
        nomeCompleto: '',
        email: '',
        senha: '',
        telefone: '',
        semanasGestacao: '',
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Não foi possível cadastrar a paciente.');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cadastrar paciente" maxWidth="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <div>
          <label htmlFor="patient-name" className="mb-1 block text-sm font-medium text-slate-700">
            Nome completo
          </label>
          <input
            id="patient-name"
            value={form.nomeCompleto}
            onChange={(e) => updateField('nomeCompleto', e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="patient-email" className="mb-1 block text-sm font-medium text-slate-700">
              E-mail de login
            </label>
            <input
              id="patient-email"
              type="email"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={inputClass}
              required
            />
          </div>

          <div>
            <label htmlFor="patient-password" className="mb-1 block text-sm font-medium text-slate-700">
              Senha inicial
            </label>
            <input
              id="patient-password"
              type="password"
              value={form.senha}
              onChange={(e) => updateField('senha', e.target.value)}
              className={inputClass}
              minLength={6}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="patient-phone" className="mb-1 block text-sm font-medium text-slate-700">
              Telefone
            </label>
            <input
              id="patient-phone"
              value={form.telefone}
              onChange={(e) => updateField('telefone', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="patient-weeks" className="mb-1 block text-sm font-medium text-slate-700">
              Semanas de gestação
            </label>
            <input
              id="patient-weeks"
              type="number"
              min={0}
              max={45}
              value={form.semanasGestacao}
              onChange={(e) => updateField('semanasGestacao', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Fechar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? <Spinner size="sm" /> : null}
            {loading ? 'Cadastrando…' : 'Criar conta da paciente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
