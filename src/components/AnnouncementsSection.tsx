import React, { useState } from 'react';
import { CheckCircle2, ArrowUpRight, X } from 'lucide-react';
import type { Announcement, AnnouncementCategory } from '../types/portal';
import { ImageProcessor } from './ImageProcessor';

interface AnnouncementsSectionProps {
  announcements: Announcement[];
  completedIds: Set<string>;
  selectedAnnouncement: Announcement | null;
  onSelectAnnouncement: (item: Announcement | null) => void;
  onConfirmRead: (item: Announcement) => Promise<void>;
  isAuthenticated: boolean;
}

const CATEGORIES: Array<'Todos' | AnnouncementCategory> = [
  'Todos',
  'Comunicado Oficial',
  'Obras & Projetos',
  'Cultura & Pessoas',
  'Segurança & ESG',
];

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({
  announcements,
  completedIds,
  selectedAnnouncement,
  onSelectAnnouncement,
  onConfirmRead,
  isAuthenticated,
}) => {
  const [filter, setFilter] = useState<'Todos' | AnnouncementCategory>('Todos');
  const [confirming, setConfirming] = useState(false);

  const visible =
    filter === 'Todos'
      ? announcements
      : announcements.filter((a) => a.category === filter);

  const handleConfirm = async (ann: Announcement) => {
    setConfirming(true);
    try {
      await onConfirmRead(ann);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <section
      id="comunicados"
      className="py-16 sm:py-20 bg-[#F8F7F4] dark:bg-[#0B1410] border-b border-[#1C2421]/10 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Cabeçalho Editorial da Seção */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-2">
              Comunicação Institucional
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2421] dark:text-white">
              Comunicados &amp; Endomarketing
            </h2>
          </div>

          {/* Controles interativos de filtro */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 rounded-lg">
            {CATEGORIES.map((cat) => {
              const active = filter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilter(cat)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#11382B] text-[#D8BC83]'
                      : 'text-[#1C2421]/75 dark:text-white/75 hover:text-[#11382B] dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grade de Comunicados com Padronização 16:9 e Filete Dourado */}
        {visible.length === 0 ? (
          <div className="py-14 text-center bg-white dark:bg-[#11241C] border border-[#C5A467]/30 rounded-xl">
            <p className="text-sm text-[#1C2421]/70 dark:text-white/70">
              {isAuthenticated
                ? 'Nenhum comunicado encontrado nesta categoria.'
                : 'Entre com sua conta Google corporativa para visualizar os comunicados oficiais em tempo real.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visible.map((ann) => {
              const isRead = completedIds.has(ann.id);
              return (
                <article
                  key={ann.id}
                  onClick={() => onSelectAnnouncement(ann)}
                  className="group bg-white dark:bg-[#11241C] border border-[#1C2421]/10 dark:border-white/10 rounded-xl overflow-hidden hover:border-[#C5A467]/80 transition-colors cursor-pointer flex flex-col"
                >
                  {/* Imagem padronizada via Canvas 16:9 com filete dourado (#C5A467) */}
                  <div className="p-2 pb-0">
                    <ImageProcessor
                      src={ann.imageUrl}
                      alt={ann.title}
                      aspectRatio="16:9"
                      variant="card"
                      roundedClassName="rounded-lg"
                      imgClassName="transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-[#1C2421]/60 dark:text-white/60 mb-2.5">
                        <span className="font-medium text-[#11382B] dark:text-[#D8BC83]">
                          {ann.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">+{ann.pointsReward} pts</span>
                        {isRead && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#11382B] dark:text-[#D8BC83] font-medium">
                              Lido
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="font-serif text-xl font-semibold text-[#1C2421] dark:text-white leading-snug mb-2.5 group-hover:text-[#11382B] dark:group-hover:text-[#D8BC83] transition-colors">
                        {ann.title}
                      </h3>

                      <p className="text-sm text-[#1C2421]/75 dark:text-white/75 leading-relaxed line-clamp-3">
                        {ann.summary}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#1C2421]/10 dark:border-white/10 flex items-center justify-between text-xs font-medium text-[#11382B] dark:text-[#D8BC83]">
                      <span className="truncate">{ann.authorName}</span>
                      <span className="inline-flex items-center gap-1 shrink-0">
                        Ler comunicado <ArrowUpRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Leitura Editorial do Comunicado */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ann-modal-title"
        >
          <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467]/60 rounded-xl shadow-2xl">
            <div className="border-b border-[#C5A467]/50 relative bg-[#0B241B]">
              <ImageProcessor
                src={selectedAnnouncement.imageUrl}
                alt={selectedAnnouncement.title}
                aspectRatio="16:9"
                variant="modal"
                roundedClassName="rounded-none"
                goldBorder={false}
                enableZoom
              />
              <button
                type="button"
                onClick={() => onSelectAnnouncement(null)}
                className="absolute top-4 right-4 z-30 w-10 h-10 rounded-lg bg-[#11382B]/90 text-white border border-[#C5A467] flex items-center justify-center hover:bg-[#0B241B] cursor-pointer"
                aria-label="Fechar comunicado"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#1C2421]/65 dark:text-white/65 mb-3">
                <span className="font-semibold text-[#11382B] dark:text-[#D8BC83]">
                  {selectedAnnouncement.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{selectedAnnouncement.authorName}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Recompensa: +{selectedAnnouncement.pointsReward} pts
                </span>
              </div>

              <h3
                id="ann-modal-title"
                className="font-serif text-3xl font-semibold text-[#1C2421] dark:text-white mb-6"
              >
                {selectedAnnouncement.title}
              </h3>

              <div className="max-w-prose space-y-4 text-[15px] text-[#1C2421]/85 dark:text-white/85 leading-[1.75] whitespace-pre-line">
                {selectedAnnouncement.content}
              </div>

              <div className="mt-8 pt-6 border-t border-[#1C2421]/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                {completedIds.has(selectedAnnouncement.id) ? (
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-[#11382B] dark:text-[#D8BC83]">
                    <CheckCircle2 className="w-4 h-4 text-[#C5A467]" />
                    <span>Leitura confirmada e pontuação creditada</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={confirming || !isAuthenticated}
                    onClick={() => handleConfirm(selectedAnnouncement)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] disabled:opacity-50 transition-colors text-sm font-semibold cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C5A467]" />
                    <span>
                      {confirming
                        ? 'Registrando...'
                        : `Confirmar Leitura (+${selectedAnnouncement.pointsReward} pts)`}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onSelectAnnouncement(null)}
                  className="px-4 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 text-sm text-[#1C2421] dark:text-white hover:border-[#C5A467] cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
