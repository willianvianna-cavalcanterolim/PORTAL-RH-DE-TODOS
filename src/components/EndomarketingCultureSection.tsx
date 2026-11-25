import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  ChevronRight,
  ExternalLink,
  HardHat,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import {
  CODIGO_CONDUTA_PDF_PATH,
  ENDOMARKETING_PDF_PATH,
  RH_SIGNUP_GUIDE_PATH,
} from '../data/seedData';
import { ImageProcessor } from './ImageProcessor';

const GROWTH_TRACK = [
  {
    step: 1,
    role: 'Servente',
    summary: 'Auxilia as frentes de trabalho e aprende as rotinas e normas de segurança da obra.',
    criteria: 'Base para todos: adaptação, frequência e postura segura nos primeiros meses.',
  },
  {
    step: 2,
    role: 'Oficial',
    summary:
      'Executa diretamente sua especialidade (pedreiro, carpinteiro, eletricista etc.) com autonomia.',
    criteria: '3 ou mais avaliações consistentes no Prêmio Capacete de Ouro CR (segurança + qualidade).',
  },
  {
    step: 3,
    role: 'Encarregado de Frente',
    summary: 'Lidera uma pequena equipe/frente e organiza as tarefas do dia a dia em campo.',
    criteria: 'Boas notas em equipe e comportamento + indicação do encarregado + vaga disponível.',
  },
  {
    step: 4,
    role: 'Mestre de Obras',
    summary: 'Coordena múltiplas frentes e encarregados; reporta diretamente à engenharia.',
    criteria: 'Histórico consistente na Trilha de Crescimento + validação da engenharia responsável.',
  },
];

const CALENDAR_MONTHS = [
  {
    month: 'Julho',
    office: 'Lançamento do plano + Dia do Amigo (20/07)',
    site: 'Lançamento do mural + Dia do Amigo (20/07)',
  },
  {
    month: 'Agosto',
    office: 'Dia dos Pais (09/08) + Dia do Corretor de Imóveis (27/08)',
    site: 'Dia dos Pais (09/08) + início do DDS turbinado',
  },
  {
    month: 'Setembro',
    office: 'Setembro Amarelo + Dia do Cliente (15/09)',
    site: 'Setembro Amarelo + SIPAT',
  },
  {
    month: 'Outubro',
    office: 'Outubro Rosa + Dia das Crianças + Dia do Eng. Civil',
    site: 'Dia do Eng. Civil (25/10) + Dia do Trabalhador da Construção Civil (26/10)',
  },
  {
    month: 'Novembro',
    office: 'Novembro Azul + Consciência Negra (20/11)',
    site: 'Novembro Azul + Consciência Negra (20/11)',
  },
  {
    month: 'Dezembro',
    office: 'Dia do Engenheiro/Arquiteto (11/12) + Confraternização',
    site: 'Dia do Pedreiro (13/12) + Confraternização de fim de ano',
  },
];

export const EndomarketingCultureSection: React.FC = () => {
  const [front, setFront] = useState<'obra' | 'escritorio'>('obra');
  const [selectedStep, setSelectedStep] = useState(0);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(5); // Dezembro ativo
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <section
      id="endomarketing"
      className="py-16 sm:py-20 bg-[#11382B] text-white border-b border-[#C5A467]/35"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        {/* Cabeçalho + Alternador Frente Escritório / Obra */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#D8BC83] font-semibold mb-2">
              Plano de Endomarketing · 2º Semestre 2026
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-white">
              Cultura, Capacete de Ouro &amp; Guia de RH
            </h2>
            <p className="text-sm text-white/80 mt-2 max-w-2xl">
              Duas frentes, um só propósito: ações estruturadas para Escritório (~20 pessoas) e Canteiro de Obras (~200 colaboradores).
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-[#0B241B] border border-[#C5A467]/40 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setFront('obra')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                front === 'obra'
                  ? 'bg-[#C5A467] text-[#11382B]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Frente Obra (~200)</span>
            </button>
            <button
              type="button"
              onClick={() => setFront('escritorio')}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                front === 'escritorio'
                  ? 'bg-[#C5A467] text-[#11382B]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Frente Escritório (~20)</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Dinâmico por Frente */}
        {front === 'obra' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Prêmio Capacete de Ouro CR */}
            <div className="lg:col-span-5 p-6 sm:p-7 rounded-xl bg-[#0B241B] border border-[#C5A467]/50 space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest text-[#D8BC83] font-semibold">
                  Destaque Mensal de Canteiro
                </p>
                <HardHat className="w-5 h-5 text-[#C5A467]" />
              </div>
              <h3 className="font-serif text-2xl font-semibold text-white">
                Prêmio Capacete de Ouro CR
              </h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Avaliação mensal pelos encarregados, com anúncio no DDS no 1º dia útil do mês, foto no mural da obra, prioridade no refeitório/vestiário e premiação trimestral.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { title: 'Segurança', desc: 'Uso correto de EPIs e zelo pelas normas.' },
                  { title: 'Comportamento', desc: 'Pontualidade, assiduidade e disciplina.' },
                  { title: 'Equipe', desc: 'Bom relacionamento e proatividade.' },
                  { title: 'Qualidade', desc: 'Entrega do serviço com capricho.' },
                ].map((c) => (
                  <div
                    key={c.title}
                    className="p-3 rounded-lg bg-[#11382B] border border-white/10"
                  >
                    <p className="text-xs font-semibold text-[#D8BC83]">{c.title}</p>
                    <p className="text-[11px] text-white/75 mt-1">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trilha de Crescimento CR Interativa */}
            <div className="lg:col-span-7 p-6 sm:p-7 rounded-xl bg-[#0B241B] border border-white/15 space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#D8BC83] font-semibold">
                    Plano de Carreira em Obra
                  </p>
                  <h3 className="font-serif text-2xl font-semibold text-white">
                    Trilha de Crescimento CR
                  </h3>
                </div>
                <Sparkles className="w-5 h-5 text-[#C5A467] shrink-0" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {GROWTH_TRACK.map((item, idx) => {
                  const active = selectedStep === idx;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedStep(idx)}
                      className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#C5A467] text-[#11382B] border-[#D8BC83]'
                          : 'bg-[#11382B] text-white border-white/15 hover:border-[#C5A467]/60'
                      }`}
                    >
                      <span
                        className={`text-[11px] font-mono font-semibold ${
                          active ? 'text-[#11382B]' : 'text-[#D8BC83]'
                        }`}
                      >
                        Etapa 0{item.step}
                      </span>
                      <p className="text-xs font-semibold mt-1 truncate">{item.role}</p>
                    </button>
                  );
                })}
              </div>

              <div className="p-5 rounded-xl bg-[#11382B] border border-[#C5A467]/40 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#D8BC83]">
                  <ChevronRight className="w-4 h-4" />
                  <span>{GROWTH_TRACK[selectedStep].role}</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  {GROWTH_TRACK[selectedStep].summary}
                </p>
                <p className="text-xs text-white/70 pt-1">
                  Critério objetivo: {GROWTH_TRACK[selectedStep].criteria}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-white/80">
                <div className="p-3 rounded-lg bg-[#11382B]/80 border border-white/10">
                  <span className="font-semibold text-[#D8BC83]">DDS Turbinado:</span> semanal, com escuta ativa.
                </div>
                <div className="p-3 rounded-lg bg-[#11382B]/80 border border-white/10">
                  <span className="font-semibold text-[#D8BC83]">Indique um Colega:</span> bônus após 90 dias.
                </div>
                <div className="p-3 rounded-lg bg-[#11382B]/80 border border-white/10">
                  <span className="font-semibold text-[#D8BC83]">Tempo de Casa:</span> marcos de 1, 3 e 5 anos.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              {
                num: '01',
                title: 'Reconhecimento',
                desc: 'Destaque do Mês por pares, aniversariantes com cartão assinado e marcos de casa.',
              },
              {
                num: '02',
                title: 'Bem-estar',
                desc: 'Pausas conscientes, flexibilidade pontual e atenção à saúde mental e física.',
              },
              {
                num: '03',
                title: 'Cultura & Integração',
                desc: 'Boas-vindas estruturadas, almoços rotativos bimestrais e confraternizações.',
              },
              {
                num: '04',
                title: 'Comunicação & Escuta',
                desc: 'Café com a Diretoria mensal (30 min), pesquisa de clima trimestral e caixa de sugestões.',
              },
              {
                num: '05',
                title: 'Desenvolvimento',
                desc: 'Troca de conhecimento interna, Academia C&R e incentivo à capacitação técnica.',
              },
            ].map((pilar) => (
              <div
                key={pilar.num}
                className="p-5 rounded-xl bg-[#0B241B] border border-[#C5A467]/40 space-y-2"
              >
                <span className="text-xs font-mono font-semibold text-[#D8BC83]">
                  {pilar.num}
                </span>
                <h3 className="font-serif text-xl font-semibold text-white">
                  {pilar.title}
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">{pilar.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Faixa Inferior: Calendário Interativo Jul-Dez + Guia de Cadastro RH + PDFs Oficiais */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#C5A467]/25">
          {/* Calendário Consolidado */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#D8BC83] font-semibold">
              <Calendar className="w-4 h-4" />
              <span>Calendário Consolidado (Julho a Dezembro)</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CALENDAR_MONTHS.map((m, idx) => (
                <button
                  key={m.month}
                  type="button"
                  onClick={() => setSelectedMonthIdx(idx)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    selectedMonthIdx === idx
                      ? 'bg-[#C5A467] text-[#11382B]'
                      : 'bg-[#0B241B] text-white/80 border border-white/15 hover:border-[#C5A467]'
                  }`}
                >
                  {m.month}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-xl bg-[#0B241B] border border-white/15">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#D8BC83] font-semibold mb-1">
                  Escritório · {CALENDAR_MONTHS[selectedMonthIdx].month}
                </p>
                <p className="text-sm text-white/90">
                  {CALENDAR_MONTHS[selectedMonthIdx].office}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#D8BC83] font-semibold mb-1">
                  Obra · {CALENDAR_MONTHS[selectedMonthIdx].month}
                </p>
                <p className="text-sm text-white/90">
                  {CALENDAR_MONTHS[selectedMonthIdx].site}
                </p>
              </div>
            </div>
          </div>

          {/* Guia Visual Passo a Passo Cadastro RH + PDFs Originais */}
          <div className="lg:col-span-5 p-5 rounded-xl bg-[#0B241B] border border-[#C5A467]/45 flex flex-col justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={() => setShowSignupModal(true)}
                className="w-20 h-20 shrink-0 cursor-pointer block"
                aria-label="Ampliar guia passo a passo de cadastro no RH"
              >
                <ImageProcessor
                  src={RH_SIGNUP_GUIDE_PATH}
                  alt="Passo a passo para cadastro no sistema de RH"
                  aspectRatio="1:1"
                  fitMode="contain-framed"
                  variant="modal"
                  roundedClassName="rounded-lg"
                />
              </button>
              <div className="min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-[#D8BC83] font-semibold">
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Onboarding &amp; Indique um Colega</span>
                </div>
                <h3 className="font-serif text-lg font-semibold text-white leading-snug">
                  Cadastro no Sistema de RH — Passo a Passo
                </h3>
                <p className="text-xs text-white/75">
                  Consulte o guia em 6 passos ou abra os documentos originais em PDF.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSignupModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#C5A467] text-[#11382B] text-xs font-semibold hover:bg-[#D8BC83] cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Ver Guia Completo</span>
              </button>
              <a
                href={ENDOMARKETING_PDF_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#C5A467]/60 text-xs text-[#D8BC83] hover:bg-white/10"
              >
                <span>PDF Endomarketing</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={CODIGO_CONDUTA_PDF_PATH}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#C5A467]/60 text-xs text-[#D8BC83] hover:bg-white/10"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>PDF Código Ética</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Ampliação do Guia Passo a Passo de Cadastro RH */}
      {showSignupModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Guia passo a passo para cadastro no sistema de RH"
        >
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#1C2421] dark:text-white">
                Guia Oficial: Cadastro de Currículo no Sistema de RH
              </h3>
              <button
                type="button"
                onClick={() => setShowSignupModal(false)}
                className="w-9 h-9 rounded-lg border border-[#1C2421]/20 dark:border-white/20 flex items-center justify-center text-[#1C2421] dark:text-white cursor-pointer"
                aria-label="Fechar guia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ImageProcessor
              src={RH_SIGNUP_GUIDE_PATH}
              alt="Passo a passo cadastro no sistema de RH"
              aspectRatio="16:9"
              fitMode="contain-framed"
              variant="modal"
              roundedClassName="rounded-lg"
              enableZoom
            />
          </div>
        </div>
      )}
    </section>
  );
};
