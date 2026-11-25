import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  History,
  Lock,
  Save,
  ShieldCheck,
  Unlock,
  User as UserIcon,
  X,
} from 'lucide-react';
import type {
  ActivityCompletion,
  BadgeDefinition,
  CollaboratorPublic,
  UserPrivate,
} from '../types/portal';
import { decryptSensitiveText, encryptSensitiveText } from '../utils/cryptoEngine';
import {
  savePrivateEncryptedPayload,
  updateCollaboratorProfile,
} from '../services/firestoreService';
import { standardizeMediaImage } from '../utils/mediaEngine';
import { BadgeIcon } from './BadgeIcon';
import { ImageProcessor } from './ImageProcessor';

interface PrivateVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  collaborator: CollaboratorPublic;
  privateProfile: UserPrivate;
  activities: ActivityCompletion[];
  badgeDefinitions: BadgeDefinition[];
  onNotify: (msg: string) => void;
}

const TARGET_LABELS: Record<ActivityCompletion['targetType'], string> = {
  announcement: 'Leitura de Comunicado',
  training: 'Conclusão na Academia',
  document: 'Leitura no Acervo Editorial',
  checkin: 'Presença Diária C&R',
};

export const PrivateVaultModal: React.FC<PrivateVaultModalProps> = ({
  isOpen,
  onClose,
  collaborator,
  privateProfile,
  activities,
  badgeDefinitions,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'conquistas' | 'perfil' | 'cofre'>('conquistas');

  const [displayName, setDisplayName] = useState(collaborator.displayName);
  const [department, setDepartment] = useState(collaborator.department);
  const [roleTitle, setRoleTitle] = useState(collaborator.roleTitle);
  const [photoURL, setPhotoURL] = useState(collaborator.photoURL);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passphrase, setPassphrase] = useState('');
  const [vaultText, setVaultText] = useState('');
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);
  const [vaultBusy, setVaultBusy] = useState(false);

  const unlockedBadges = useMemo(() => {
    const owned = new Set(collaborator.badges);
    return badgeDefinitions.filter((b) => owned.has(b.title) || owned.has(b.id));
  }, [collaborator.badges, badgeDefinitions]);

  if (!isOpen) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await standardizeMediaImage(file, 'avatar-1-1');
      setPhotoURL(result.dataUrl);
      onNotify(
        `Avatar padronizado em 1:1 (${result.width}×${result.height}px, economia de ${result.compressionRatio}%).`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao padronizar avatar.');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateCollaboratorProfile(collaborator.uid, {
        displayName,
        department,
        roleTitle,
        photoURL,
      });
      onNotify('Perfil corporativo atualizado com sucesso.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEncryptSave = async () => {
    if (!vaultText.trim()) {
      setVaultStatus('Digite as anotações ou dados sensíveis antes de cifrar.');
      return;
    }
    setVaultBusy(true);
    setVaultStatus(null);
    try {
      const envelope = await encryptSensitiveText(vaultText, passphrase);
      await savePrivateEncryptedPayload(collaborator.uid, envelope);
      setVaultStatus(
        'Dados cifrados em AES-GCM-256 no navegador e salvos com segurança no cofre privado.'
      );
    } catch (err) {
      setVaultStatus(err instanceof Error ? err.message : 'Erro na criptografia.');
    } finally {
      setVaultBusy(false);
    }
  };

  const handleDecryptRead = async () => {
    if (!privateProfile.encryptedPayload) {
      setVaultStatus('Nenhum registro criptografado salvo neste cofre ainda.');
      return;
    }
    setVaultBusy(true);
    setVaultStatus(null);
    try {
      const plain = await decryptSensitiveText(privateProfile.encryptedPayload, passphrase);
      setVaultText(plain);
      setVaultStatus('Cofre decifrado localmente com sucesso.');
    } catch (err) {
      setVaultStatus(err instanceof Error ? err.message : 'Falha ao decifrar.');
    } finally {
      setVaultBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
    >
      <div className="max-w-3xl w-full max-h-[90vh] overflow-y-auto bg-[#F8F7F4] dark:bg-[#11241C] border border-[#C5A467] rounded-xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-start justify-between border-b border-[#1C2421]/10 dark:border-white/10 pb-4 gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold">
              {collaborator.levelTitle} · {collaborator.points} pts
            </p>
            <h3
              id="vault-modal-title"
              className="font-serif text-2xl sm:text-3xl font-semibold text-[#1C2421] dark:text-white"
            >
              {collaborator.displayName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-[#1C2421]/20 dark:border-white/20 flex items-center justify-center text-[#1C2421] dark:text-white hover:border-[#C5A467] cursor-pointer shrink-0"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navegação do Perfil */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-white dark:bg-[#0B1410] border border-[#1C2421]/12 dark:border-white/10 rounded-lg">
          {(
            [
              { id: 'conquistas', label: 'Histórico de Conquistas', icon: History },
              { id: 'perfil', label: 'Identidade & Avatar 1:1', icon: UserIcon },
              { id: 'cofre', label: 'Cofre Pessoal (E2EE)', icon: Lock },
            ] as const
          ).map((t) => {
            const TabIcon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-[#11382B] text-[#D8BC83]'
                    : 'text-[#1C2421]/75 dark:text-white/75 hover:text-[#11382B] dark:hover:text-white'
                }`}
              >
                <TabIcon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Aba 1: Histórico de Conquistas Individuais */}
        {activeTab === 'conquistas' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-xl bg-white dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">Pontos Totais</p>
                <p className="text-2xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {collaborator.points}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">Comunicados</p>
                <p className="text-2xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {collaborator.readAnnouncementsCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">Academia C&amp;R</p>
                <p className="text-2xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {collaborator.completedModulesCount}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">Documentos</p>
                <p className="text-2xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {collaborator.readDocumentsCount}
                </p>
              </div>
            </div>

            {/* Selos Dourados Desbloqueados */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#11382B] dark:text-[#D8BC83]">
                <Award className="w-4 h-4 text-[#C5A467]" />
                <span>Badges Douradas Conquistadas ({collaborator.badges.length})</span>
              </div>

              {collaborator.badges.length === 0 ? (
                <p className="text-xs text-[#1C2421]/65 dark:text-white/65">
                  Você ainda não desbloqueou badges douradas. Conclua o módulo do Código de Conduta ou leia 3 comunicados oficiais.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(unlockedBadges.length > 0
                    ? unlockedBadges
                    : collaborator.badges.map((title) => ({
                        id: title,
                        title,
                        description: 'Conquista registrada no Portal C&R.',
                        iconKey: 'medal' as const,
                        accentHex: '#C5A467',
                      }))
                  ).map((b) => (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-xl bg-[#11382B] text-white border border-[#C5A467] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#C5A467] text-[#11382B] flex items-center justify-center shrink-0">
                        <BadgeIcon iconKey={b.iconKey} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif text-base font-semibold text-[#D8BC83] truncate">
                          {b.title}
                        </p>
                        <p className="text-[11px] text-white/80 line-clamp-2">
                          {b.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Linha do Tempo de Atividades Concluídas */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider font-semibold text-[#11382B] dark:text-[#D8BC83]">
                  Registro Cronológico de Atividades ({activities.length})
                </p>
              </div>
              {activities.length === 0 ? (
                <p className="text-xs text-[#1C2421]/65 dark:text-white/65">
                  Nenhuma atividade registrada até o momento.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-lg bg-white dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-[#C5A467] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#1C2421] dark:text-white truncate">
                            {act.targetTitle}
                          </p>
                          <p className="text-[11px] text-[#1C2421]/60 dark:text-white/60">
                            {TARGET_LABELS[act.targetType]}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums shrink-0">
                        +{act.pointsEarned} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aba 2: Perfil Público Corporativo + Padronizador de Avatar 1:1 */}
        {activeTab === 'perfil' && (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#11382B] dark:text-[#D8BC83]">
              <UserIcon className="w-4 h-4 text-[#C5A467]" />
              <span>Identidade no Portal &amp; Avatar Padronizado (1:1)</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-16 h-16 shrink-0">
                <ImageProcessor
                  src={photoURL}
                  alt={displayName}
                  aspectRatio="1:1"
                  fitMode="cover"
                  variant="avatar"
                  roundedClassName="rounded-xl"
                  fallbackText={displayName.slice(0, 2).toUpperCase()}
                />
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C5A467] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] hover:bg-[#11382B] hover:text-white transition-colors cursor-pointer w-fit">
                <span>Enviar Foto (Padronização 1:1)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[#1C2421]/70 dark:text-white/70 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2421]/70 dark:text-white/70 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-[#1C2421]/70 dark:text-white/70 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-xs font-semibold cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#C5A467]" />
              <span>{savingProfile ? 'Salvando...' : 'Salvar Dados do Perfil'}</span>
            </button>
          </form>
        )}

        {/* Aba 3: Cofre E2EE (AES-GCM-256) */}
        {activeTab === 'cofre' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#11382B] dark:text-[#D8BC83]">
                <ShieldCheck className="w-4 h-4 text-[#C5A467]" />
                <span>Cofre Pessoal de Dados Sensíveis (AES-GCM-256)</span>
              </div>
              <span className="text-xs text-[#1C2421]/60 dark:text-white/60">
                {privateProfile.email}
              </span>
            </div>

            <p className="text-xs text-[#1C2421]/75 dark:text-white/75 leading-relaxed">
              Seus documentos pessoais, contatos de emergência ou anotações confidenciais são cifrados exclusivamente no seu navegador antes da gravação no Firestore.
            </p>

            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Sua chave criptográfica pessoal (mínimo 4 caracteres)"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white"
            />

            <textarea
              rows={4}
              value={vaultText}
              onChange={(e) => setVaultText(e.target.value)}
              placeholder="Dados sensíveis ou observações confidenciais de RH..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#0B1410] text-sm text-[#1C2421] dark:text-white"
            />

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={vaultBusy}
                onClick={handleEncryptSave}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83] text-xs font-semibold cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Cifrar e Salvar no Firestore</span>
              </button>
              <button
                type="button"
                disabled={vaultBusy}
                onClick={handleDecryptRead}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#C5A467] text-[#11382B] dark:text-[#D8BC83] hover:bg-[#11382B] hover:text-white text-xs font-semibold cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Decifrar Cofre Salvo</span>
              </button>
            </div>

            {vaultStatus && (
              <p className="text-xs font-medium text-[#11382B] dark:text-[#D8BC83]">
                {vaultStatus}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
