import React from 'react';
import { ArrowRight, Award, BookOpen, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { HERO_BANNER_PATH } from '../data/seedData';
import { ImageProcessor } from './ImageProcessor';
import type {
  Announcement,
  CollaboratorPublic,
  PortalBrandSettings,
  PortalSection,
} from '../types/portal';

interface HeroSectionProps {
  brandSettings: PortalBrandSettings | null;
  collaborator: CollaboratorPublic | null;
  isAuthenticated: boolean;
  hasCheckedInToday: boolean;
  featuredAnnouncements: Announcement[];
  onSignIn: () => void;
  onDailyCheckIn: () => void;
  onNavigate: (section: PortalSection) => void;
  onOpenAnnouncement: (ann: Announcement) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  brandSettings,
  collaborator,
  isAuthenticated,
  hasCheckedInToday,
  featuredAnnouncements,
  onSignIn,
  onDailyCheckIn,
  onNavigate,
  onOpenAnnouncement,
}) => {
  const heroImage = brandSettings?.heroImageUrl || HERO_BANNER_PATH;
  const headline =
    brandSettings?.heroHeadline || 'Arquitetura que atravessa gerações';
  const subheadline =
    brandSettings?.heroSubheadline ||
    'Portal oficial de pessoas, cultura construtiva, governança e excelência Signature Spaces da Cavalcante & Rolim Empreendimentos.';

  const firstName = collaborator?.displayName?.split(' ')[0] || 'Visitante';

  return (
    <section className="relative w-full min-h-[85vh] flex flex-col justify-between overflow-hidden bg-[#11382B]">
      {/* Fotografia Arquitetônica em Tela Cheia processada em 16:9 via Canvas */}
      <ImageProcessor
        src={heroImage}
        alt="Empreendimento residencial de alto padrão Cavalcante & Rolim em construção ao entardecer"
        aspectRatio="16:9"
        fitMode="cover"
        variant="hero"
        fillContainer
        goldBorder={false}
        roundedClassName="rounded-none"
        containerClassName="absolute inset-0"
      />

      {/* Máscara Gradiente Institucional Verde Esmeralda (#11382B a >= 65% de opacidade) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(125deg, rgba(17,56,43,0.92) 0%, rgba(17,56,43,0.74) 48%, rgba(11,36,27,0.68) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Conteúdo Principal do Hero */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 pt-16 pb-10 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          <p className="text-xs tracking-widest uppercase text-[#D8BC83] font-medium mb-4">
            Cavalcante &amp; Rolim · Signature Spaces
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.08] tracking-tight mb-5">
            {isAuthenticated
              ? `Bem-vindo(a), ${firstName}. ${headline}`
              : headline}
          </h1>

          <p className="text-base sm:text-lg text-white/88 leading-relaxed max-w-2xl mb-8">
            {subheadline}
          </p>

          {/* Ações Principais do Hero */}
          <div className="flex flex-wrap items-center gap-4">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={onDailyCheckIn}
                  disabled={hasCheckedInToday}
                  className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                    hasCheckedInToday
                      ? 'bg-[#0B241B]/90 text-[#D8BC83] border border-[#C5A467]/50 cursor-default'
                      : 'bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83]'
                  }`}
                >
                  {hasCheckedInToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#C5A467]" />
                      <span>Presença Diária Confirmada (+15 pts)</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Registrar Presença Diária (+15 pts)</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('comunicados')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-[#C5A467]/60 text-white hover:bg-white/10 transition-colors text-sm font-medium cursor-pointer"
                >
                  <span>Explorar Comunicados</span>
                  <ArrowRight className="w-4 h-4 text-[#D8BC83]" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onSignIn}
                className="inline-flex items-center gap-3 px-6 py-3.5 rounded-lg bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83] transition-colors text-sm font-semibold cursor-pointer"
              >
                <span>Acessar Portal com Conta Google Corporativa</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Faixa Inferior: Acesso Rápido aos Destaques do Dia */}
      <div className="relative z-10 w-full border-t border-[#C5A467]/30 bg-[#0B241B]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() =>
              featuredAnnouncements[0]
                ? onOpenAnnouncement(featuredAnnouncements[0])
                : onNavigate('comunicados')
            }
            className="text-left group flex items-start gap-3.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg border border-[#C5A467]/50 bg-[#11382B] flex items-center justify-center shrink-0 mt-0.5">
              <Award className="w-4 h-4 text-[#D8BC83]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#D8BC83] tracking-wide uppercase">
                Destaque de Engenharia
              </p>
              <p className="text-sm font-medium text-white group-hover:text-[#D8BC83] transition-colors truncate">
                {featuredAnnouncements[0]?.title ||
                  'Acompanhamento de Obras Signature Spaces'}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('academia')}
            className="text-left group flex items-start gap-3.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg border border-[#C5A467]/50 bg-[#11382B] flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-[#D8BC83]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#D8BC83] tracking-wide uppercase">
                Academia C&amp;R
              </p>
              <p className="text-sm font-medium text-white group-hover:text-[#D8BC83] transition-colors truncate">
                Trilhas de Acabamento Nobre &amp; Segurança NR-18
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('documentos')}
            className="text-left group flex items-start gap-3.5 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg border border-[#C5A467]/50 bg-[#11382B] flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-4 h-4 text-[#D8BC83]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-[#D8BC83] tracking-wide uppercase">
                Acervo Editorial
              </p>
              <p className="text-sm font-medium text-white group-hover:text-[#D8BC83] transition-colors truncate">
                Manuais, Normas &amp; Relatórios Padronizados
              </p>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
