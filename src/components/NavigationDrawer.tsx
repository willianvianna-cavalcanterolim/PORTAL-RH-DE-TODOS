import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Award,
  Bell,
  BellOff,
  BookOpen,
  FileText,
  Home,
  Lock,
  LogOut,
  Megaphone,
  Monitor,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';
import type { CollaboratorPublic, PortalSection, ThemePreference } from '../types/portal';
import type { PortalAccessMode } from './TopBar';
import { MonogramLogo } from './MonogramLogo';
import { ImageProcessor } from './ImageProcessor';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeSection: PortalSection;
  onNavigate: (section: PortalSection) => void;
  collaborator: CollaboratorPublic | null;
  isAdmin: boolean;
  portalMode: PortalAccessMode;
  onChangePortalMode: (mode: PortalAccessMode) => void;
  themePreference: ThemePreference;
  onThemeChange: (pref: ThemePreference) => void;
  pushEnabled: boolean;
  onTogglePush: () => void;
  onOpenPrivateVault: () => void;
  onSignOut: () => void;
  customLogoUrl?: string;
}

const MODULES: Array<{ id: PortalSection; label: string; icon: React.FC<{ className?: string }> }> = [
  { id: 'inicio', label: 'Página Inicial & Destaques', icon: Home },
  { id: 'comunicados', label: 'Comunicados Oficiais', icon: Megaphone },
  { id: 'endomarketing', label: 'Endomarketing & Cultura CR', icon: Sparkles },
  { id: 'academia', label: 'Academia & Código de Ética', icon: BookOpen },
  { id: 'documentos', label: 'Acervo Editorial & Manuais', icon: FileText },
  { id: 'ranking', label: 'Top 5, Badges & Aniversários', icon: Award },
];

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeSection,
  onNavigate,
  collaborator,
  isAdmin,
  portalMode,
  onChangePortalMode,
  themePreference,
  onThemeChange,
  pushEnabled,
  onTogglePush,
  onOpenPrivateVault,
  onSignOut,
  customLogoUrl,
}) => {
  const handleSelect = (section: PortalSection) => {
    onNavigate(section);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-[#11382B] text-white border-l border-[#C5A467]/35 flex flex-col justify-between overflow-y-auto"
            aria-label="Gaveta lateral de navegação"
          >
            <div>
              <div className="px-6 py-5 border-b border-[#C5A467]/25 flex items-center justify-between">
                <MonogramLogo customLogoUrl={customLogoUrl} onDarkSurface />
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-lg border border-white/15 flex items-center justify-center text-white/80 hover:text-[#D8BC83] hover:border-[#C5A467] transition-colors cursor-pointer"
                  aria-label="Fechar menu lateral"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {collaborator && (
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 shrink-0">
                      <ImageProcessor
                        src={collaborator.photoURL}
                        alt={collaborator.displayName}
                        aspectRatio="1:1"
                        fitMode="cover"
                        variant="avatar"
                        roundedClassName="rounded-xl"
                        fallbackText={collaborator.displayName.slice(0, 2).toUpperCase()}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-xl font-semibold text-white truncate">
                        {collaborator.displayName}
                      </p>
                      <p className="text-xs text-[#D8BC83] truncate">
                        {collaborator.roleTitle} · {collaborator.department}
                      </p>
                      <p className="text-[11px] text-white/70 mt-1">
                        {isAdmin
                          ? 'Gestor Autorizado · Alternância de Modo'
                          : 'Colaborador · Visualização e Interação'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-white/60">Pontuação Atual</p>
                      <p className="text-2xl font-mono font-medium text-[#D8BC83] tabular-nums">
                        {collaborator.points} pts
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Nível &amp; Badges</p>
                      <p className="text-sm font-medium text-white truncate">
                        {collaborator.levelTitle} · {collaborator.badges.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="p-4 space-y-1">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const active = activeSection === mod.id;
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => handleSelect(mod.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#0B241B] text-[#D8BC83] border border-[#C5A467]/50'
                          : 'text-white/85 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-[#C5A467] shrink-0" />
                      <span className="truncate">{mod.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="px-6 py-4 border-t border-white/10 space-y-4">
                <div>
                  <p className="text-xs text-white/60 mb-2">Aparência do Portal</p>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0B241B] rounded-lg border border-white/10">
                    {(
                      [
                        { id: 'system', label: 'Sistema', icon: Monitor },
                        { id: 'light', label: 'Claro', icon: Sun },
                        { id: 'dark', label: 'Escuro', icon: Moon },
                      ] as const
                    ).map((opt) => {
                      const OptIcon = opt.icon;
                      const selected = themePreference === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => onThemeChange(opt.id)}
                          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#C5A467] text-[#11382B]'
                              : 'text-white/75 hover:text-white'
                          }`}
                        >
                          <OptIcon className="w-3.5 h-3.5" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-sm text-white/90">
                    {pushEnabled ? (
                      <Bell className="w-4 h-4 text-[#C5A467]" />
                    ) : (
                      <BellOff className="w-4 h-4 text-white/50" />
                    )}
                    <span>Alertas Push (FCM)</span>
                  </div>
                  <button
                    type="button"
                    onClick={onTogglePush}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      pushEnabled
                        ? 'border-[#C5A467] bg-[#C5A467]/15 text-[#D8BC83]'
                        : 'border-white/20 text-white/70 hover:text-white'
                    }`}
                  >
                    {pushEnabled ? 'Ativo' : 'Ativar'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPrivateVault();
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-white/15 bg-[#0B241B] text-xs font-medium text-white/90 hover:border-[#C5A467] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-[#C5A467]" />
                    Meu Perfil, Histórico &amp; Cofre E2EE
                  </span>
                  <span className="text-[#D8BC83]">Abrir</span>
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-[#C5A467]/25 space-y-3 bg-[#0B241B]">
              {isAdmin ? (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-wider text-white/60 font-semibold">
                    Opções de Modo de Acesso
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#11382B] border border-[#C5A467]/40">
                    <button
                      type="button"
                      onClick={() => {
                        onChangePortalMode('colaborador');
                        onClose();
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        portalMode === 'colaborador'
                          ? 'bg-[#C5A467] text-[#11382B]'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Colaborador</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onChangePortalMode('gestor');
                        onClose();
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                        portalMode === 'gestor'
                          ? 'bg-[#C5A467] text-[#11382B]'
                          : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Gestor</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-white/65 leading-relaxed">
                  Modo Colaborador ativo · Inserção, correção e exclusão restritas a gestores.
                </p>
              )}

              <button
                type="button"
                onClick={onSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 text-white/80 hover:text-white hover:border-white/40 transition-colors text-xs font-medium cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Encerrar Sessão
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
