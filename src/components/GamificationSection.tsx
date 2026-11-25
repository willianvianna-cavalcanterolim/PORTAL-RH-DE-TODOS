import React, { useMemo, useState } from 'react';
import { Award, Cake, CheckCircle2, History, Trophy } from 'lucide-react';
import type {
  ActivityCompletion,
  BadgeDefinition,
  BirthdayEntry,
  CollaboratorPublic,
} from '../types/portal';
import { BadgeIcon } from './BadgeIcon';
import { ImageProcessor } from './ImageProcessor';

interface GamificationSectionProps {
  collaborator: CollaboratorPublic | null;
  leaderboard: CollaboratorPublic[];
  birthdays: BirthdayEntry[];
  badgeDefinitions: BadgeDefinition[];
  activities: ActivityCompletion[];
  isAuthenticated: boolean;
  onOpenHistory?: () => void;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

const ACTIVITY_TYPE_LABEL: Record<ActivityCompletion['targetType'], string> = {
  announcement: 'Comunicado',
  training: 'Academia',
  document: 'Documento',
  checkin: 'Presença Diária',
};

export const GamificationSection: React.FC<GamificationSectionProps> = ({
  collaborator,
  leaderboard,
  birthdays,
  badgeDefinitions,
  activities,
  isAuthenticated,
  onOpenHistory,
}) => {
  const [branchFilter, setBranchFilter] = useState<string>('Todas');

  const earnedSet = useMemo(
    () => new Set(collaborator?.badges || []),
    [collaborator?.badges]
  );

  const badgeLookup = useMemo(() => {
    const map = new Map<string, BadgeDefinition>();
    for (const def of badgeDefinitions) {
      map.set(def.title, def);
      map.set(def.id, def);
    }
    return map;
  }, [badgeDefinitions]);

  const topFive = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);
  const remainingRanking = useMemo(() => leaderboard.slice(5), [leaderboard]);

  const availableBranches = useMemo(() => {
    const set = new Set<string>();
    birthdays.forEach((b) => {
      if (b.branch) set.add(b.branch);
    });
    return ['Todas', ...Array.from(set)];
  }, [birthdays]);

  const filteredBirthdays = useMemo(() => {
    if (branchFilter === 'Todas') return birthdays;
    return birthdays.filter((b) => (b.branch || 'Matriz C&R') === branchFilter);
  }, [birthdays, branchFilter]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  return (
    <section
      id="ranking"
      className="py-16 sm:py-20 bg-white dark:bg-[#0E1B16] border-b border-[#1C2421]/10 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-16">
        {/* Bloco 1: Top 5 Leaderboard com Badges Douradas Customizáveis */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-2">
                Leaderboard Oficial · Top 5
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2421] dark:text-white">
                Destaques de Engajamento C&amp;R
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#11382B] dark:text-[#D8BC83]">
              <Trophy className="w-4 h-4 text-[#C5A467]" />
              <span>Ranking atualizado em tempo real</span>
            </div>
          </div>

          {topFive.length === 0 ? (
            <div className="p-10 text-center bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467]/35 rounded-xl">
              <p className="text-sm text-[#1C2421]/70 dark:text-white/70">
                {isAuthenticated
                  ? 'Os cinco primeiros colaboradores aparecerão aqui conforme concluírem comunicados e treinamentos.'
                  : 'Entre com sua conta Google no topo do portal para visualizar o Top 5 e conquistar posições.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {topFive.map((member, index) => {
                const isFirst = index === 0;
                const isSelf = collaborator?.uid === member.uid;
                return (
                  <div
                    key={member.uid}
                    className={`p-5 rounded-xl border flex flex-col justify-between transition-colors ${
                      isFirst
                        ? 'bg-[#11382B] text-white border-[#C5A467] shadow-lg'
                        : isSelf
                        ? 'bg-[#C5A467]/12 dark:bg-[#11241C] text-[#1C2421] dark:text-white border-[#C5A467]'
                        : 'bg-[#F8F7F4] dark:bg-[#11241C] text-[#1C2421] dark:text-white border-[#1C2421]/12 dark:border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`font-mono text-sm font-semibold tabular-nums ${
                            isFirst ? 'text-[#D8BC83]' : 'text-[#C5A467]'
                          }`}
                        >
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                        <span
                          className={`font-mono text-sm font-semibold tabular-nums ${
                            isFirst
                              ? 'text-[#D8BC83]'
                              : 'text-[#11382B] dark:text-[#D8BC83]'
                          }`}
                        >
                          {member.points} pts
                        </span>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 shrink-0">
                          <ImageProcessor
                            src={member.photoURL}
                            alt={member.displayName}
                            aspectRatio="1:1"
                            fitMode="cover"
                            variant="avatar"
                            roundedClassName="rounded-xl"
                            fallbackText={getInitials(member.displayName)}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-lg font-semibold leading-snug truncate">
                            {member.displayName}
                          </p>
                          <p
                            className={`text-xs truncate ${
                              isFirst
                                ? 'text-white/75'
                                : 'text-[#1C2421]/65 dark:text-white/65'
                            }`}
                          >
                            {member.department}
                          </p>
                        </div>
                      </div>

                      <p
                        className={`text-xs font-medium mb-3 ${
                          isFirst
                            ? 'text-[#D8BC83]'
                            : 'text-[#11382B] dark:text-[#D8BC83]'
                        }`}
                      >
                        {member.levelTitle}
                      </p>
                    </div>

                    {/* Badges Douradas Customizáveis do Colaborador */}
                    <div
                      className={`pt-3 border-t ${
                        isFirst
                          ? 'border-white/15'
                          : 'border-[#1C2421]/10 dark:border-white/10'
                      }`}
                    >
                      {member.badges.length === 0 ? (
                        <p
                          className={`text-[11px] ${
                            isFirst
                              ? 'text-white/60'
                              : 'text-[#1C2421]/50 dark:text-white/50'
                          }`}
                        >
                          Em busca da 1ª badge
                        </p>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {member.badges.slice(0, 4).map((badgeKey) => {
                            const def = badgeLookup.get(badgeKey);
                            return (
                              <span
                                key={badgeKey}
                                title={def ? `${def.title} — ${def.description}` : badgeKey}
                                className="w-7 h-7 rounded-lg flex items-center justify-center border border-[#C5A467] bg-[#11382B] text-[#D8BC83]"
                                style={
                                  def?.accentHex
                                    ? {
                                        borderColor: def.accentHex,
                                        color: def.accentHex,
                                      }
                                    : undefined
                                }
                              >
                                <BadgeIcon
                                  iconKey={def?.iconKey || 'medal'}
                                  className="w-3.5 h-3.5"
                                />
                              </span>
                            );
                          })}
                          {member.badges.length > 4 && (
                            <span className="text-[11px] font-mono text-[#D8BC83] tabular-nums ml-1">
                              +{member.badges.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {remainingRanking.length > 0 && (
            <div className="mt-6 bg-[#F8F7F4] dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#11382B] text-[#D8BC83] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-14">Pos.</th>
                    <th className="px-4 py-3 font-semibold">Colaborador</th>
                    <th className="px-4 py-3 font-semibold hidden sm:table-cell">Nível</th>
                    <th className="px-4 py-3 font-semibold text-right">Badges</th>
                    <th className="px-4 py-3 font-semibold text-right">Pontos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2421]/10 dark:divide-white/10">
                  {remainingRanking.map((member, idx) => (
                    <tr key={member.uid}>
                      <td className="px-4 py-3 font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                        {String(idx + 6).padStart(2, '0')}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1C2421] dark:text-white">
                        {member.displayName}
                        {collaborator?.uid === member.uid ? ' (Você)' : ''}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-[#1C2421]/70 dark:text-white/70">
                        {member.levelTitle}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-xs">
                        {member.badges.length}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                        {member.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bloco 2: Catálogo de Badges Douradas Customizáveis */}
        <div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-2">
                Reconhecimento Signature Spaces
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2421] dark:text-white">
                Selos Dourados de Conquista
              </h3>
            </div>
            {collaborator && (
              <p className="text-sm font-medium text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                {earnedSet.size} de {badgeDefinitions.length} selos conquistados ·{' '}
                {collaborator.points} pts totais
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {badgeDefinitions.map((badge) => {
              const unlocked = earnedSet.has(badge.title) || earnedSet.has(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`p-5 rounded-xl border transition-colors ${
                    unlocked
                      ? 'bg-[#11382B] text-white border-[#C5A467]'
                      : 'bg-[#F8F7F4] dark:bg-[#11241C] text-[#1C2421] dark:text-white border-[#1C2421]/12 dark:border-white/10 opacity-85'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                        unlocked
                          ? 'bg-[#C5A467] text-[#11382B] border-[#D8BC83]'
                          : 'bg-white dark:bg-[#0B1410] text-[#C5A467] border-[#C5A467]/40'
                      }`}
                    >
                      <BadgeIcon iconKey={badge.iconKey} className="w-5 h-5" />
                    </div>
                    {unlocked && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D8BC83]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Conquistado
                      </span>
                    )}
                  </div>
                  <h4 className="font-serif text-xl font-semibold mb-1.5">
                    {badge.title}
                  </h4>
                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      unlocked
                        ? 'text-white/80'
                        : 'text-[#1C2421]/70 dark:text-white/70'
                    }`}
                  >
                    {badge.description}
                  </p>
                  <p
                    className={`text-[11px] font-medium ${
                      unlocked
                        ? 'text-[#D8BC83]'
                        : 'text-[#1C2421]/60 dark:text-white/60'
                    }`}
                  >
                    Critério: {badge.criteria}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bloco 3: Histórico Individual de Conquistas & Aniversariantes por Unidade */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Histórico Individual */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-1">
                  Trajetória Pessoal
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2421] dark:text-white">
                  Histórico de Conquistas
                </h3>
              </div>
              <History className="w-6 h-6 text-[#C5A467]" />
            </div>

            {!collaborator ? (
              <div className="p-6 rounded-xl bg-[#F8F7F4] dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10">
                <p className="text-sm text-[#1C2421]/70 dark:text-white/70">
                  Autentique-se para acompanhar seu histórico completo de leituras, cursos concluídos e selos conquistados.
                </p>
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467]/45 space-y-4">
                <div className="grid grid-cols-3 gap-3 pb-4 border-b border-[#1C2421]/10 dark:border-white/10 text-center">
                  <div>
                    <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">Comunicados</p>
                    <p className="text-xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                      {collaborator.readAnnouncementsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">Treinamentos</p>
                    <p className="text-xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                      {collaborator.completedModulesCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">Documentos</p>
                    <p className="text-xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                      {collaborator.readDocumentsCount}
                    </p>
                  </div>
                </div>

                {activities.length === 0 ? (
                  <p className="text-xs text-[#1C2421]/70 dark:text-white/70">
                    Nenhuma atividade pontuada registrada ainda. Confirme a leitura de comunicados ou faça check-in diário.
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {activities.slice(0, 6).map((act) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-lg bg-white dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#11382B] dark:text-[#D8BC83]">
                            {ACTIVITY_TYPE_LABEL[act.targetType]}
                          </p>
                          <p className="text-xs font-medium text-[#1C2421] dark:text-white truncate">
                            {act.targetTitle}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#C5A467] tabular-nums shrink-0">
                          +{act.pointsEarned} pts
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {onOpenHistory && (
                  <button
                    type="button"
                    onClick={onOpenHistory}
                    className="w-full py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-xs font-semibold cursor-pointer"
                  >
                    Abrir Perfil &amp; Histórico Completo
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Aniversariantes do Mês com Filtro por SPE / Unidade */}
          <div className="lg:col-span-7 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-1">
                  Celebrações C&amp;R · Matriz, Manta &amp; Watal
                </p>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2421] dark:text-white">
                  Aniversariantes do Mês
                </h3>
              </div>
              <Cake className="w-6 h-6 text-[#C5A467]" />
            </div>

            {availableBranches.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {availableBranches.map((branch) => (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => setBranchFilter(branch)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      branchFilter === branch
                        ? 'bg-[#11382B] text-[#D8BC83] border border-[#C5A467]'
                        : 'bg-[#F8F7F4] dark:bg-[#11241C] text-[#1C2421]/75 dark:text-white/75 border border-[#1C2421]/12 dark:border-white/12 hover:border-[#C5A467]'
                    }`}
                  >
                    {branch}
                  </button>
                ))}
              </div>
            )}

            {filteredBirthdays.length === 0 ? (
              <div className="p-8 text-center bg-[#F8F7F4] dark:bg-[#11241C] border border-[#1C2421]/10 dark:border-white/10 rounded-xl">
                <p className="text-sm text-[#1C2421]/70 dark:text-white/70">
                  {isAuthenticated
                    ? 'Nenhum aniversariante cadastrado nesta unidade.'
                    : 'Entre com sua conta Google para visualizar os aniversariantes sincronizados.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredBirthdays.map((bday) => (
                  <div
                    key={bday.id}
                    className="p-4 rounded-xl bg-[#F8F7F4] dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 flex items-center gap-3.5"
                  >
                    <div className="w-13 h-13 shrink-0">
                      <ImageProcessor
                        src={bday.avatarUrl}
                        alt={bday.name}
                        aspectRatio="1:1"
                        fitMode="cover"
                        variant="avatar"
                        roundedClassName="rounded-xl"
                        fallbackText={getInitials(bday.name)}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-lg font-semibold text-[#1C2421] dark:text-white truncate">
                        {bday.name}
                      </p>
                      <p className="text-xs text-[#1C2421]/70 dark:text-white/70 truncate">
                        {bday.roleTitle} · {bday.branch || bday.department}
                      </p>
                      <p className="text-xs font-medium text-[#11382B] dark:text-[#D8BC83] mt-1 tabular-nums">
                        {String(bday.day).padStart(2, '0')} de{' '}
                        {MONTH_NAMES[Math.max(0, Math.min(11, bday.month - 1))]}
                      </p>
                    </div>
                    <Award className="w-4 h-4 text-[#C5A467] shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
