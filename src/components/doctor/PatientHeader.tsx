import { useNavigate } from 'react-router-dom';
import { type Patient } from '../../types/doctor';
import { AlertBadge } from './AlertBadge';
import { formatDate } from '../../lib/utils';

interface PatientHeaderProps {
  patient: Patient;
}

export function PatientHeader({ patient }: PatientHeaderProps) {
  const navigate = useNavigate();

  const ig = patient.gestationalWeeks != null
    ? `${patient.gestationalWeeks}s${patient.gestationalDays != null ? ` ${patient.gestationalDays}d` : ''}`
    : '-';

  return (
    <div className="border-b border-slate-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <button
          type="button"
          onClick={() => navigate('/doctor')}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-800"
          aria-label="Voltar para lista de pacientes"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Pacientes
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700"
              aria-hidden="true"
            >
              {patient.name.charAt(0)}
            </div>

            <div className="min-w-0">
              <h1 className="text-xl font-semibold leading-tight text-slate-900">{patient.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span>{patient.age} anos</span>
                {ig !== '-' && (
                  <>
                    <span aria-hidden="true">-</span>
                    <span>IG: {ig}</span>
                  </>
                )}
                {patient.dueDate && (
                  <>
                    <span aria-hidden="true">-</span>
                    <span>DPP: {formatDate(patient.dueDate, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </>
                )}
                {patient.bloodType && (
                  <>
                    <span aria-hidden="true">-</span>
                    <span>Tipo sang.: {patient.bloodType}</span>
                  </>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                <span>CPF: {patient.cpf}</span>
                {patient.phone && (
                  <>
                    <span aria-hidden="true">-</span>
                    <span>{patient.phone}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="lg:flex-shrink-0">
            <AlertBadge level={patient.alertLevel} />
          </div>
        </div>

        {patient.alertFlags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" role="list" aria-label="Flags de atencao">
            {patient.alertFlags.map((flag, i) => (
              <div
                key={i}
                role="listitem"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200"
              >
                <svg className="h-3 w-3 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {flag}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
