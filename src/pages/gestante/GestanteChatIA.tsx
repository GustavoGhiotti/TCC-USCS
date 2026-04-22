import { GestanteChatBox } from '../../components/gestante/GestanteChatBox';
import { GestanteLayout } from '../../components/layout/GestanteLayout';

const QUICK_EXAMPLES = [
  'Estou com dor de cabeca e visao embacada. O que observar agora?',
  'Posso usar repelente diariamente na gestacao?',
  'Senti menos movimentos do bebe hoje. Quando devo procurar atendimento?',
];

export function GestanteChatIA() {
  return (
    <GestanteLayout>
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/90 px-6 py-3 backdrop-blur">
        <h1 className="text-base font-semibold text-slate-900">Assistente IA</h1>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Converse com a assistente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Use este espaco para tirar duvidas rapidas de gestacao com orientacao objetiva.
          </p>
        </div>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className="h-[76vh] min-h-[560px]">
            <GestanteChatBox className="h-full" />
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Como perguntar melhor</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-600">
                <li>Descreva o sintoma principal e ha quanto tempo comecou.</li>
                <li>Informe contexto: semanas de gestacao e intensidade.</li>
                <li>Pergunte de forma direta: o que observar e quando procurar atendimento.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-semibold text-amber-900">Quando priorizar atendimento presencial</p>
              <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-800">
                <li>Sangramento, perda de liquido, falta de ar importante ou desmaio.</li>
                <li>Dor intensa, convulsao, febre persistente ou mal-estar importante.</li>
                <li>Qualquer orientacao previa do medico para ir a unidade de saude.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Exemplos de perguntas úteis</p>
              <div className="mt-2 space-y-2">
                {QUICK_EXAMPLES.map((question) => (
                  <p key={question} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                    {question}
                  </p>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </GestanteLayout>
  );
}
