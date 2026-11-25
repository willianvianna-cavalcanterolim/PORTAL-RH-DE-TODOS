import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Lock,
  Megaphone,
  Menu,
  Search,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { MonogramLogo } from './MonogramLogo';
import type {
  Announcement,
  CorporateDocument,
  PortalSection,
  TrainingModule,
} from '../types/portal';

export type PortalAccessMode = 'gestor' | 'colaborador';

interface TopBarProps {
  activeSection: PortalSection;
  onNavigate: (section: PortalSection) => void;
  onOpenDrawer: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  portalMode: PortalAccessMode;
  onChangePortalMode: (mode: PortalAccessMode) => void;
  customLogoUrl?: string;
  announcements: Announcement[];
  documents: CorporateDocument[];
  trainings: TrainingModule[];
  onSelectAnnouncement: (item: Announcement) => void;
  onSelectDocument: (item: CorporateDocument) => void;
  onSelectTraining: (item: TrainingModule) => void;
}

type SearchResultItem =
  | {
      kind: 'announcement';
      id: string;
      title: string;
      meta: string;
      item: Announcement;
    }
  | {
      kind: 'document';
      id: string;
      title: string;
      meta: string;
      item: CorporateDocument;
    }
  | {
      kind: 'training';
      id: string;
      title: string;
      meta: string;
      item: TrainingModule;
    };

const NAV_LINKS: Array<{ id: PortalSection; label: string }> = [
  { id: 'inicio', label: 'Início' },
  { id: 'comunicados', label: 'Comunicados' },
  { id: 'endomarketing', label: 'Cultura' },
  { id: 'academia', label: 'Academia' },
  { id: 'ranking', label: 'Ranking' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeSection,
  onNavigate,
  onOpenDrawer,
  isAuthenticated,
  isAdmin,
  portalMode,
  onChangePortalMode,
  customLogoUrl,
  announcements,
  documents,
  trainings,
  onSelectAnnouncement,
  onSelectDocument,
  onSelectTraining,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const modeMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const results = useMemo<SearchResultItem[]>(() => {
    if (!isAuthenticated) return [];
    const q = searchQuery.trim().toLowerCase();
    const list: SearchResultItem[] = [];

    for (const ann of announcements) {
      const hay = `${ann.title} ${ann.category} ${ann.summary} ${ann.content}`.toLowerCase();
      if (!q || hay.includes(q)) {
        list.push({
          kind: 'announcement',
          id: `ann_${ann.id}`,
          title: ann.title,
          meta: `Comunicado · ${ann.category} · +${ann.pointsReward} pts`,
          item: ann,
        });
      }
    }

    for (const docItem of documents) {
      const hay = `${docItem.title} ${docItem.docCode} ${docItem.category} ${
        docItem.extractedContent || ''
      }`.toLowerCase();
      if (!q || hay.includes(q)) {
        list.push({
          kind: 'document',
          id: `doc_${docItem.id}`,
          title: docItem.title,
          meta: `Documento · ${docItem.docCode} · ${docItem.category}`,
          item: docItem,
        });
      }
    }

    for (const tr of trainings) {
      const hay = `${tr.title} ${tr.track} ${tr.summary} ${tr.badgeAwarded}`.toLowerCase();
      if (!q || hay.includes(q)) {
        list.push({
          kind: 'training',
          id: `tr_${tr.id}`,
          title: tr.title,
          meta: `Treinamento · ${tr.track} · +${tr.pointsReward} pts`,
          item: tr,
        });
      }
    }

    return q ? list.slice(0, 9) : list.slice(0, 6);
  }, [isAuthenticated, searchQuery, announcements, documents, trainings]);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [searchQuery]);

  // Atalho Cmd/Ctrl + K para foco rápido na busca global (apenas autenticado)
  useEffect(() => {
    if (!isAuthenticated) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (window.innerWidth < 768) {
          setMobileSearchOpen(true);
          window.setTimeout(() => mobileInputRef.current?.focus(), 40);
        } else {
          setSearchOpen(true);
          desktopInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isAuthenticated]);

  // Fechar dropdowns ao clicar fora ou pressionar Escape
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setModeMenuOpen(false);
      } else if (modeMenuRef.current && !modeMenuRef.current.contains(e.target as Node)) {
        setModeMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModeMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleSelectResult = (res: SearchResultItem) => {
    if (res.kind === 'announcement') {
      onSelectAnnouncement(res.item);
    } else if (res.kind === 'document') {
      onSelectDocument(res.item);
    } else {
      onSelectTraining(res.item);
    }
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setMobileSearchOpen(false);
      (e.currentTarget as HTMLInputElement).blur();
      return;
    }
    if (e.key === 'ArrowDown' && results.length > 0) {
      e.preventDefault();
      setSearchOpen(true);
      setHighlightedIdx((prev) => (prev + 1) % results.length);
      return;
    }
    if (e.key === 'ArrowUp' && results.length > 0) {
      e.preventDefault();
      setSearchOpen(true);
      setHighlightedIdx((prev) => (prev - 1 + results.length) % results.length);
      return;
    }
    if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      const target = results[highlightedIdx] || results[0];
      if (target) handleSelectResult(target);
    }
  };

  const renderResultIcon = (kind: SearchResultItem['kind']) => {
    if (kind === 'announcement') return <Megaphone className="w-4 h-4 text-[#C5A467] shrink-0" />;
    if (kind === 'document') return <FileText className="w-4 h-4 text-[#C5A467] shrink-0" />;
    return <BookOpen className="w-4 h-4 text-[#C5A467] shrink-0" />;
  };

  return (
    <header
      ref={containerRef}
      className="sticky top-0 z-40 w-full bg-[#11382B]/95 backdrop-blur-md border-b border-[#C5A467]/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-3 lg:gap-5">
        <button
          type="button"
          onClick={() => isAuthenticated && onNavigate('inicio')}
          className={`focus-visible:outline-2 focus-visible:outline-[#C5A467] rounded-lg shrink-0 ${
            isAuthenticated ? 'cursor-pointer' : 'cursor-default'
          }`}
          aria-label="Portal Cavalcante & Rolim"
        >
          <MonogramLogo customLogoUrl={customLogoUrl} onDarkSurface />
        </button>

        {isAuthenticated ? (
          <>
            <nav
              className="hidden xl:flex items-center gap-5 text-sm font-medium"
              aria-label="Navegação principal"
            >
              {NAV_LINKS.map((item) => {
                const active = portalMode === 'colaborador' && activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`relative py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active ? 'text-[#D8BC83]' : 'text-white/85 hover:text-[#D8BC83]'
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute left-0 right-0 -bottom-0.5 h-px bg-[#C5A467]" />
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Busca Global Desktop / Tablet */}
              <div className="relative hidden md:block w-48 lg:w-60">
                <Search className="w-3.5 h-3.5 text-[#C5A467] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={desktopInputRef}
                  type="search"
                  value={searchQuery}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Buscar no portal..."
                  aria-label="Busca global no portal"
                  className="w-full pl-8.5 pr-8 py-1.5 rounded-lg bg-[#0B241B] border border-[#C5A467]/45 text-xs text-white placeholder:text-white/55 focus:outline-none focus:border-[#D8BC83] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      desktopInputRef.current?.focus();
                    }}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {searchOpen && (
                  <div
                    role="listbox"
                    aria-label="Resultados da busca global"
                    className="absolute right-0 mt-2 w-88 sm:w-96 max-h-96 overflow-y-auto rounded-xl bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467] shadow-2xl divide-y divide-[#1C2421]/10 dark:divide-white/10"
                  >
                    <div className="px-4 py-2.5 bg-[#11382B] text-[11px] font-semibold uppercase tracking-wider text-[#D8BC83] flex items-center justify-between">
                      <span>
                        {searchQuery.trim()
                          ? `Resultados (${results.length})`
                          : 'Acesso Rápido no Portal'}
                      </span>
                      <span className="font-mono text-white/60">Ctrl+K</span>
                    </div>

                    {results.length === 0 ? (
                      <div className="p-5 text-center text-xs text-[#1C2421]/70 dark:text-white/70">
                        Nenhum comunicado, documento ou treinamento encontrado para &ldquo;
                        {searchQuery}&rdquo;.
                      </div>
                    ) : (
                      results.map((res, idx) => {
                        const active = idx === highlightedIdx;
                        return (
                          <button
                            key={res.id}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setHighlightedIdx(idx)}
                            onClick={() => handleSelectResult(res)}
                            className={`w-full text-left px-4 py-3 flex items-start justify-between gap-3 transition-colors cursor-pointer ${
                              active
                                ? 'bg-[#11382B]/8 dark:bg-[#0B241B]'
                                : 'hover:bg-white dark:hover:bg-[#0B241B]/60'
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#11382B] border border-[#C5A467]/50 flex items-center justify-center shrink-0 mt-0.5">
                                {renderResultIcon(res.kind)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-[#11382B] dark:text-[#D8BC83] truncate">
                                  {res.meta}
                                </p>
                                <p className="text-xs font-semibold text-[#1C2421] dark:text-white line-clamp-1 mt-0.5">
                                  {res.title}
                                </p>
                              </div>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-[#C5A467] shrink-0 mt-1" />
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Botão Busca Mobile */}
              <button
                type="button"
                onClick={() => {
                  setMobileSearchOpen((prev) => !prev);
                  window.setTimeout(() => mobileInputRef.current?.focus(), 40);
                }}
                className="md:hidden w-9 h-9 rounded-lg border border-[#C5A467]/50 bg-[#0B241B] text-[#D8BC83] flex items-center justify-center cursor-pointer"
                aria-label="Abrir busca global"
              >
                {mobileSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              </button>

              {/* Seletor Profissional de Modo (Gestor <-> Colaborador) */}
              {isAdmin ? (
                <div ref={modeMenuRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setModeMenuOpen((prev) => !prev)}
                    aria-haspopup="menu"
                    aria-expanded={modeMenuOpen}
                    aria-label="Opções de modo de acesso: alternar entre Modo Gestor e Modo Colaborador"
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      portalMode === 'gestor'
                        ? 'bg-[#C5A467] text-[#11382B] border-[#D8BC83] hover:bg-[#D8BC83]'
                        : 'bg-[#0B241B] text-[#D8BC83] border-[#C5A467]/60 hover:border-[#C5A467]'
                    }`}
                  >
                    {portalMode === 'gestor' ? (
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="hidden sm:inline">
                      {portalMode === 'gestor' ? 'Modo Gestor' : 'Modo Colaborador'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        modeMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {modeMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Alternar modo de visualização e operação"
                      className="absolute right-0 mt-2 w-76 rounded-xl bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467] shadow-2xl overflow-hidden"
                    >
                      <div className="px-4 py-2.5 bg-[#11382B] border-b border-[#C5A467]/30">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#D8BC83]">
                          Opções de Acesso
                        </p>
                      </div>

                      <div className="p-1.5 space-y-1">
                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={portalMode === 'gestor'}
                          onClick={() => {
                            onChangePortalMode('gestor');
                            setModeMenuOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${
                            portalMode === 'gestor'
                              ? 'bg-[#11382B] text-white'
                              : 'hover:bg-white dark:hover:bg-[#0B241B] text-[#1C2421] dark:text-white'
                          }`}
                        >
                          <ShieldCheck
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              portalMode === 'gestor' ? 'text-[#D8BC83]' : 'text-[#C5A467]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold">Modo Gestor (Admin)</span>
                              {portalMode === 'gestor' && (
                                <Check className="w-3.5 h-3.5 text-[#D8BC83] shrink-0" />
                              )}
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 leading-snug ${
                                portalMode === 'gestor'
                                  ? 'text-white/80'
                                  : 'text-[#1C2421]/65 dark:text-white/65'
                              }`}
                            >
                              Inserir, corrigir e excluir informações, documentos, cursos e acessos.
                            </p>
                          </div>
                        </button>

                        <button
                          type="button"
                          role="menuitemradio"
                          aria-checked={portalMode === 'colaborador'}
                          onClick={() => {
                            onChangePortalMode('colaborador');
                            setModeMenuOpen(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${
                            portalMode === 'colaborador'
                              ? 'bg-[#11382B] text-white'
                              : 'hover:bg-white dark:hover:bg-[#0B241B] text-[#1C2421] dark:text-white'
                          }`}
                        >
                          <UserCheck
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              portalMode === 'colaborador' ? 'text-[#D8BC83]' : 'text-[#C5A467]'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold">Modo Colaborador</span>
                              {portalMode === 'colaborador' && (
                                <Check className="w-3.5 h-3.5 text-[#D8BC83] shrink-0" />
                              )}
                            </div>
                            <p
                              className={`text-[11px] mt-0.5 leading-snug ${
                                portalMode === 'colaborador'
                                  ? 'text-white/80'
                                  : 'text-[#1C2421]/65 dark:text-white/65'
                              }`}
                            >
                              Visualizar comunicados, concluir cursos e interagir no portal.
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  title="Acesso padrão de colaborador autenticado (visualização e interação)"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/15 bg-[#0B241B] text-xs font-medium text-white/80 whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#C5A467]" />
                  <span>Modo Colaborador</span>
                </div>
              )}

              <button
                type="button"
                onClick={onOpenDrawer}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#C5A467]/60 bg-[#0B241B] text-[#D8BC83] hover:bg-[#C5A467] hover:text-[#11382B] transition-colors text-xs font-semibold tracking-wide whitespace-nowrap shrink-0 cursor-pointer"
                aria-label="Abrir gaveta de navegação e perfil"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-[#D8BC83]">
            <Lock className="w-3.5 h-3.5 text-[#C5A467]" />
            <span>Acesso Restrito Corporativo</span>
          </div>
        )}
      </div>

      {/* Painel de Busca Mobile (somente autenticado) */}
      {isAuthenticated && mobileSearchOpen && (
        <div className="md:hidden px-4 pb-4 pt-1 bg-[#11382B] border-t border-[#C5A467]/25 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#C5A467] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={mobileInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Pesquisar comunicados, docs e cursos..."
              aria-label="Busca global mobile"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0B241B] border border-[#C5A467]/50 text-xs text-white placeholder:text-white/55 focus:outline-none focus:border-[#D8BC83]"
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-lg bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467]/50 divide-y divide-[#1C2421]/10 dark:divide-white/10">
            {results.length === 0 ? (
              <p className="p-4 text-xs text-center text-[#1C2421]/70 dark:text-white/70">
                Nenhum resultado encontrado.
              </p>
            ) : (
              results.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectResult(res)}
                  className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-white dark:hover:bg-[#0B241B]/60 cursor-pointer"
                >
                  {renderResultIcon(res.kind)}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-[#11382B] dark:text-[#D8BC83] truncate">
                      {res.meta}
                    </p>
                    <p className="text-xs font-semibold text-[#1C2421] dark:text-white truncate">
                      {res.title}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
};
