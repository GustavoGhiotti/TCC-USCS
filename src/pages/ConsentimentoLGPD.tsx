import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { acceptConsentimentoMock } from '../lib/auth';

// ─── Item de bullet com ícone ─────────────────────────────────────────────────
function BulletItem({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

// ─── Página de consentimento ──────────────────────────────────────────────────
export function ConsentimentoLGPD() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  async function handleAceitar() {
    if (!user || !checked) return;
    setSaving(true);
    try {
      await acceptConsentimentoMock(user.id);
      const updatedUser = {
        ...user,
        consentimentoAceito: true,
        consentimentoAceitoEm: new Date().toISOString(),
      };
      setUser(updatedUser);
      navigate(user.role === 'medico' ? '/doctor' : '/gestante/dashboard', {
        replace: true,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleSair() {
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900">GestaCare</span>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-card border border-slate-100 p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">
              Termo de Consentimento
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Conforme a Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018)
            </p>
          </div>

          <p className="text-sm text-slate-600 mb-5 leading-relaxed">
            Para usar o GestaCare, precisamos que você entenda e consinta com o
            tratamento dos seus dados pessoais de saúde:
          </p>

          {/* Bullets de informação */}
          <div className="space-y-4 mb-6">
            <BulletItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              }
              title="Dados coletados"
              desc="Relatos diários de saúde, medicamentos prescritos e informações clínicas relacionadas à gestação."
            />
            <BulletItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              }
              title="Finalidade"
              desc="Acompanhamento gestacional e suporte ao atendimento clínico. Os dados são usados exclusivamente para os fins do aplicativo."
            />
            <BulletItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              }
              title="Quem acessa"
              desc="Somente o profissional de saúde responsável pelo seu acompanhamento. Nenhum dado é compartilhado com terceiros sem autorização."
            />
            <BulletItem
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              }
              title="Seus direitos"
              desc="Você pode revogar este consentimento, solicitar correção ou exclusão dos seus dados a qualquer momento pelo suporte do aplicativo."
            />
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer mb-6 group">
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-brand-600 cursor-pointer"
              aria-label="Li e aceito os termos de uso e a política de privacidade"
            />
            <span className="text-sm text-slate-700 select-none leading-relaxed">
              Li e aceito os termos de uso e a política de privacidade do
              GestaCare, conforme a LGPD.
            </span>
          </label>

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!checked || saving}
              onClick={handleAceitar}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-brand-600 rounded-xl hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving && <Spinner size="sm" />}
              {saving ? 'Processando…' : 'Aceitar e continuar'}
            </button>
            <button
              type="button"
              onClick={handleSair}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          GestaCare · Projeto acadêmico TCC USCS · Dados protegidos por LGPD
        </p>
      </div>
    </div>
  );
}

export default ConsentimentoLGPD;
