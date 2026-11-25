/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Arquitetura do Portal Oficial de RH & Endomarketing — Cavalcante & Rolim | Signature Spaces
 * -----------------------------------------------------------------------------------------
 * Camadas principais:
 * 1. Autenticação & Controle de Acesso: Login/Senha (`signInWithEmailAndPassword`), Cadastro com
 *    Verificação Obrigatória (`sendEmailVerification`) e Google SSO (`signInWithPopup`) + Regras
 *    Firestore Zero-Trust + Separação estrita entre Modo Colaborador e Modo Gestor (Admin).
 * 2. Motor de Padronização de Mídia (`src/utils/mediaEngine.ts`): Recorte inteligente (16:9 e 1:1)
 *    e compressão automática via HTML5 Canvas.
 * 3. Importador Universal (`src/utils/documentEngine.ts`): Extração client-side de .pdf, .docx,
 *    .xlsx, .pptx, .txt e imagens renderizadas no Template Editorial Padrão C&R.
 * 4. Endomarketing & Cultura (`src/components/EndomarketingCultureSection.tsx`): Plano 2º Semestre
 *    2026 (Escritório vs Obra), Prêmio Capacete de Ouro CR, Trilha de Crescimento e Guia RH.
 * 5. Gamificação, Top 5 & Admin Analytics: Pontuação por leitura/treinamento, badges douradas
 *    customizáveis, gráficos Recharts, histórico individual de conquistas e exportação CSV.
 */

import { useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  initializePushNotifications,
  triggerLocalPushNotification,
} from './firebase/config';
import {
  awardGamificationAction,
  ensureUserProfiles,
  recordAuditLog,
  seedInitialInstitutionalContent,
  subscribeAdminAlerts,
  subscribeAdminAuditLogs,
  subscribeAdminRecords,
  subscribeAllActivitiesForAdmin,
  subscribeAnnouncements,
  subscribeBadgeDefinitions,
  subscribeBirthdays,
  subscribeCollaboratorsLeaderboard,
  subscribeDocuments,
  subscribePortalBrand,
  subscribeTrainings,
  subscribeUserActivities,
  updatePrivatePushSettings,
  type AdminDirectoryEntry,
} from './services/firestoreService';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  type ActivityCompletion,
  type Announcement,
  type AuditLog,
  type BadgeDefinition,
  type BirthdayEntry,
  type CollaboratorPublic,
  type CorporateDocument,
  type CriticalAlert,
  type PortalBrandSettings,
  type PortalSection,
  type ThemePreference,
  type TrainingModule,
  type UserPrivate,
} from './types/portal';
import {
  INITIAL_BADGE_DEFINITIONS,
} from './data/seedData';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TopBar, type PortalAccessMode } from './components/TopBar';
import { NavigationDrawer } from './components/NavigationDrawer';
import { CorporateAuthGate } from './components/CorporateAuthGate';
import { HeroSection } from './components/HeroSection';
import { AnnouncementsSection } from './components/AnnouncementsSection';
import { EndomarketingCultureSection } from './components/EndomarketingCultureSection';
import { AcademySection } from './components/AcademySection';
import { EditorialDocumentViewer } from './components/EditorialDocumentViewer';
import { GamificationSection } from './components/GamificationSection';
import { AdminPanel } from './components/AdminPanel';
import { PrivateVaultModal } from './components/PrivateVaultModal';
import { MonogramLogo } from './components/MonogramLogo';

function mapFirebaseAuthError(err: unknown): string {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-mail ou senha inválidos. Verifique suas credenciais corporativas.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já possui cadastro. Utilize Login e Senha ou recupere sua senha.';
    case 'auth/weak-password':
      return 'A senha deve conter pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Informe um endereço de e-mail válido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas consecutivas. Aguarde alguns instantes antes de tentar novamente.';
    case 'auth/popup-closed-by-user':
      return 'A janela de login Google foi fechada antes da conclusão.';
    case 'auth/operation-not-allowed':
      return 'O método E-mail/Senha ainda não foi ativado no Firebase Console (Authentication → Sign-in method → E-mail/Senha). Ative-o no painel do projeto ou entre com Google SSO.';
    default:
      return err instanceof Error ? err.message : 'Não foi possível concluir a autenticação.';
  }
}

function PortalShell() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [portalMode, setPortalMode] = useState<PortalAccessMode>('colaborador');

  const [collaborator, setCollaborator] = useState<CollaboratorPublic | null>(null);
  const [privateProfile, setPrivateProfile] = useState<UserPrivate | null>(null);
  const [brandSettings, setBrandSettings] = useState<PortalBrandSettings | null>(null);

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [trainings, setTrainings] = useState<TrainingModule[]>([]);
  const [documents, setDocuments] = useState<CorporateDocument[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayEntry[]>([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState<BadgeDefinition[]>([]);
  const [leaderboard, setLeaderboard] = useState<CollaboratorPublic[]>([]);
  const [activities, setActivities] = useState<ActivityCompletion[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityCompletion[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [adminRecords, setAdminRecords] = useState<AdminDirectoryEntry[]>([]);

  const [activeSection, setActiveSection] = useState<PortalSection>('inicio');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<CorporateDocument | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<TrainingModule | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [themePreference, setThemePreference] = useState<ThemePreference>('system');

  const isVerifiedSession = Boolean(user && user.emailVerified);
  const isBootstrappedAdmin = Boolean(
    user && user.email === BOOTSTRAPPED_ADMIN_EMAIL && user.emailVerified
  );

  const notify = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  // Suporte automático a temas claro e escuro baseado na preferência do sistema operacional
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const shouldBeDark =
        themePreference === 'dark' ||
        (themePreference === 'system' && mediaQuery.matches);
      document.documentElement.classList.toggle('dark', shouldBeDark);
    };

    applyTheme();
    mediaQuery.addEventListener('change', applyTheme);
    return () => mediaQuery.removeEventListener('change', applyTheme);
  }, [themePreference]);

  const clearProtectedPortalState = () => {
    setCollaborator(null);
    setPrivateProfile(null);
    setIsAdmin(false);
    setPortalMode('colaborador');
    setActiveSection('inicio');
    setBrandSettings(null);
    setAnnouncements([]);
    setTrainings([]);
    setDocuments([]);
    setBirthdays([]);
    setBadgeDefinitions([]);
    setLeaderboard([]);
    setActivities([]);
    setAllActivities([]);
    setAuditLogs([]);
    setAlerts([]);
    setAdminRecords([]);
  };

  const syncVerifiedSession = async (firebaseUser: User) => {
    const profiles = await ensureUserProfiles(firebaseUser);
    setCollaborator(profiles.collaborator);
    setPrivateProfile(profiles.privateProfile);
    setIsAdmin(profiles.isAdmin);
    if (!profiles.isAdmin) {
      setPortalMode('colaborador');
    }

    if (profiles.isAdmin) {
      await seedInitialInstitutionalContent(firebaseUser);
    }
  };

  // Monitoramento de Autenticação (somente usuários verificados acessam dados corporativos)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser || !firebaseUser.emailVerified) {
        clearProtectedPortalState();
        setAuthReady(true);
        return;
      }

      try {
        await syncVerifiedSession(firebaseUser);
      } catch (err) {
        notify(
          err instanceof Error
            ? err.message
            : 'Erro ao sincronizar perfil corporativo.'
        );
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  // Assinaturas Firestore em Tempo Real (exclusivo para sessão autenticada e verificada)
  useEffect(() => {
    if (!authReady || !user || !user.emailVerified) return;

    const canListMasterData = user.email === BOOTSTRAPPED_ADMIN_EMAIL && user.emailVerified;
    const unsubs: Array<() => void> = [
      subscribePortalBrand(setBrandSettings),
      subscribeAnnouncements(canListMasterData, setAnnouncements),
      subscribeTrainings(canListMasterData, setTrainings),
      subscribeDocuments(canListMasterData, setDocuments),
      subscribeBirthdays(setBirthdays),
      subscribeBadgeDefinitions(canListMasterData, setBadgeDefinitions),
      subscribeCollaboratorsLeaderboard((list) => {
        setLeaderboard(list);
        const self = list.find((item) => item.uid === user.uid);
        if (self) setCollaborator(self);
      }),
      subscribeUserActivities(user.uid, setActivities),
    ];

    if (canListMasterData) {
      unsubs.push(subscribeAllActivitiesForAdmin(setAllActivities));
      unsubs.push(subscribeAdminAuditLogs(setAuditLogs));
      unsubs.push(subscribeAdminAlerts(setAlerts));
      unsubs.push(subscribeAdminRecords(setAdminRecords));
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authReady, user]);

  const displayBadges = useMemo<BadgeDefinition[]>(() => {
    if (badgeDefinitions.length > 0) return badgeDefinitions;
    return INITIAL_BADGE_DEFINITIONS.map((b) => ({ ...b, authorUid: 'cr-institutional' }));
  }, [badgeDefinitions]);

  const completedAnnouncementIds = useMemo(
    () =>
      new Set(
        activities
          .filter((a) => a.targetType === 'announcement')
          .map((a) => a.targetId)
      ),
    [activities]
  );

  const completedTrainingIds = useMemo(
    () =>
      new Set(
        activities.filter((a) => a.targetType === 'training').map((a) => a.targetId)
      ),
    [activities]
  );

  const completedDocumentIds = useMemo(
    () =>
      new Set(
        activities.filter((a) => a.targetType === 'document').map((a) => a.targetId)
      ),
    [activities]
  );

  const todayCheckInId = `checkin_${new Date().toISOString().slice(0, 10)}`;
  const hasCheckedInToday = useMemo(
    () =>
      activities.some(
        (a) => a.targetType === 'checkin' && a.targetId === todayCheckInId
      ),
    [activities, todayCheckInId]
  );

  const handleEmailSignIn = async (email: string, password: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        notify('Confirme o link enviado ao seu e-mail para liberar o acesso ao portal.');
      } else {
        notify('Acesso corporativo liberado no Modo Colaborador.');
      }
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err));
    }
  };

  const handleEmailSignUp = async (name: string, email: string, password: string) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await sendEmailVerification(cred.user);
      notify('Conta criada! Verifique sua caixa de entrada para ativar o acesso.');
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err));
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      notify('Autenticação corporativa via Google realizada com sucesso.');
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err));
    }
  };

  const handleReloadVerification = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const refreshedUser = auth.currentUser;
    if (!refreshedUser.emailVerified) {
      throw new Error('Seu e-mail ainda não consta como confirmado. Verifique sua caixa de entrada.');
    }
    setUser({ ...refreshedUser } as User);
    await syncVerifiedSession(refreshedUser);
    notify('E-mail confirmado! Bem-vindo ao Portal Cavalcante & Rolim.');
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
    } catch (err) {
      throw new Error(mapFirebaseAuthError(err));
    }
  };

  const handleSignOut = async () => {
    setDrawerOpen(false);
    await signOut(auth);
    clearProtectedPortalState();
    notify('Sessão encerrada com segurança.');
  };

  const handleChangePortalMode = (mode: PortalAccessMode) => {
    if (mode === 'gestor' && !isAdmin) {
      if (user) {
        void recordAuditLog({
          actorUid: user.uid,
          actorName: user.displayName || 'Usuário',
          action: 'UNAUTHORIZED_ADMIN_ATTEMPT',
          resource: 'admin_panel',
          severity: 'critical',
          details: 'Tentativa de acesso ao Modo Gestor sem privilégio administrativo.',
        });
      }
      notify('Acesso restrito exclusivamente a gestores autorizados.');
      return;
    }

    setPortalMode(mode);
    if (mode === 'gestor') {
      setActiveSection('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      notify('Modo Gestor ativado: inserir, corrigir e excluir liberados.');
    } else {
      setActiveSection('inicio');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      notify('Modo Colaborador ativado: visualização e interação no portal.');
    }
  };

  const handleNavigate = (section: PortalSection) => {
    if (!isVerifiedSession) return;

    if (section === 'admin') {
      handleChangePortalMode('gestor');
      return;
    }

    if (portalMode === 'gestor') {
      setPortalMode('colaborador');
    }

    setActiveSection(section);
    window.setTimeout(() => {
      const targetEl = document.getElementById(section);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 40);
  };

  const handleDailyCheckIn = async () => {
    if (!collaborator) return;
    const res = await awardGamificationAction({
      collaborator,
      targetType: 'checkin',
      targetId: todayCheckInId,
      targetTitle: 'Presença Diária no Portal C&R',
      pointsEarned: 15,
    });
    if (res.awarded) {
      notify(
        `Presença diária registrada! +15 pts${
          res.unlockedBadge ? ` · Selo desbloqueado: ${res.unlockedBadge}` : ''
        }`
      );
    }
  };

  const handleConfirmAnnouncementRead = async (ann: Announcement) => {
    if (!collaborator) return;
    const res = await awardGamificationAction({
      collaborator,
      targetType: 'announcement',
      targetId: ann.id,
      targetTitle: ann.title,
      pointsEarned: ann.pointsReward,
    });
    if (res.awarded) {
      notify(
        `Comunicado confirmado! +${ann.pointsReward} pts${
          res.unlockedBadge ? ` · Novo selo: ${res.unlockedBadge}` : ''
        }`
      );
    }
  };

  const handleCompleteTraining = async (mod: TrainingModule) => {
    if (!collaborator) return;
    const res = await awardGamificationAction({
      collaborator,
      targetType: 'training',
      targetId: mod.id,
      targetTitle: mod.title,
      pointsEarned: mod.pointsReward,
      badgeToUnlock: mod.badgeAwarded,
    });
    if (res.awarded) {
      notify(
        `Treinamento concluído! +${mod.pointsReward} pts · Selo "${mod.badgeAwarded}"`
      );
    }
  };

  const handleConfirmDocumentRead = async (docItem: CorporateDocument) => {
    if (!collaborator) return;
    const res = await awardGamificationAction({
      collaborator,
      targetType: 'document',
      targetId: docItem.id,
      targetTitle: docItem.title,
      pointsEarned: docItem.pointsReward,
    });
    if (res.awarded) {
      notify(`Ciência registrada! +${docItem.pointsReward} pts.`);
    }
  };

  const handleSyncOfficialContent = async () => {
    if (!user || !isAdmin) return;
    const count = await seedInitialInstitutionalContent(user);
    if (count > 0) {
      notify(`${count} materiais oficiais da Cavalcante & Rolim sincronizados no Firestore.`);
    } else {
      notify('Todos os materiais oficiais da Cavalcante & Rolim já estão sincronizados.');
    }
  };

  const handleTogglePush = async () => {
    if (!user || !privateProfile) return;
    if (!privateProfile.pushEnabled) {
      const pushRes = await initializePushNotifications((payload) => {
        const title = payload.notification?.title || 'Cavalcante & Rolim';
        const body = payload.notification?.body || 'Novo comunicado corporativo.';
        notify(`${title}: ${body}`);
      });

      if (pushRes.permission === 'granted') {
        await updatePrivatePushSettings(user.uid, true, pushRes.token);
        setPrivateProfile((prev) =>
          prev ? { ...prev, pushEnabled: true, fcmToken: pushRes.token || '' } : prev
        );
        triggerLocalPushNotification(
          'Cavalcante & Rolim | Signature Spaces',
          'Notificações push corporativas ativadas.'
        );
        notify('Notificações push (FCM) ativadas para este navegador.');
      } else {
        notify('Permissão de notificações não concedida pelo navegador.');
      }
    } else {
      await updatePrivatePushSettings(user.uid, false, '');
      setPrivateProfile((prev) =>
        prev ? { ...prev, pushEnabled: false, fcmToken: '' } : prev
      );
      notify('Notificações push desativadas.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F7F4] text-[#1C2421] dark:bg-[#0B1410] dark:text-[#F4F3EE]">
      <TopBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        onOpenDrawer={() => setDrawerOpen(true)}
        isAuthenticated={isVerifiedSession}
        isAdmin={isAdmin}
        portalMode={portalMode}
        onChangePortalMode={handleChangePortalMode}
        customLogoUrl={brandSettings?.logoDataUrl}
        announcements={announcements}
        documents={documents}
        trainings={trainings}
        onSelectAnnouncement={(ann) => {
          setSelectedAnnouncement(ann);
          handleNavigate('comunicados');
        }}
        onSelectDocument={(docItem) => {
          setSelectedDocument(docItem);
          handleNavigate('documentos');
        }}
        onSelectTraining={(mod) => {
          setSelectedTraining(mod);
          handleNavigate('academia');
        }}
      />

      {isVerifiedSession && (
        <NavigationDrawer
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          activeSection={activeSection}
          onNavigate={handleNavigate}
          collaborator={collaborator}
          isAdmin={isAdmin}
          portalMode={portalMode}
          onChangePortalMode={handleChangePortalMode}
          themePreference={themePreference}
          onThemeChange={setThemePreference}
          pushEnabled={Boolean(privateProfile?.pushEnabled)}
          onTogglePush={handleTogglePush}
          onOpenPrivateVault={() => setVaultOpen(true)}
          onSignOut={handleSignOut}
          customLogoUrl={brandSettings?.logoDataUrl}
        />
      )}

      <main className="flex-1">
        {!authReady ? (
          <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4 bg-[#11382B] text-white">
            <MonogramLogo onDarkSurface />
            <p className="text-xs uppercase tracking-widest text-[#D8BC83]">
              Validando credenciais corporativas...
            </p>
          </div>
        ) : !isVerifiedSession ? (
          <CorporateAuthGate
            unverifiedUser={user && !user.emailVerified ? user : null}
            onEmailSignIn={handleEmailSignIn}
            onEmailSignUp={handleEmailSignUp}
            onPasswordReset={handlePasswordReset}
            onGoogleSignIn={handleGoogleSignIn}
            onReloadVerification={handleReloadVerification}
            onResendVerification={handleResendVerification}
            onSignOut={handleSignOut}
            customLogoUrl={brandSettings?.logoDataUrl}
          />
        ) : portalMode === 'gestor' && isAdmin && user ? (
          <AdminPanel
            currentUser={user}
            isBootstrappedAdmin={isBootstrappedAdmin}
            collaborators={leaderboard}
            announcements={announcements}
            trainings={trainings}
            documents={documents}
            birthdays={birthdays}
            adminRecords={adminRecords}
            auditLogs={auditLogs}
            alerts={alerts}
            brandSettings={brandSettings}
            badgeDefinitions={displayBadges}
            allActivities={allActivities}
            onSyncOfficialContent={handleSyncOfficialContent}
            onNotify={notify}
          />
        ) : (
          <>
            <div id="inicio">
              <HeroSection
                brandSettings={brandSettings}
                collaborator={collaborator}
                isAuthenticated={isVerifiedSession}
                hasCheckedInToday={hasCheckedInToday}
                featuredAnnouncements={announcements.filter((a) => a.featured)}
                onSignIn={handleGoogleSignIn}
                onDailyCheckIn={handleDailyCheckIn}
                onNavigate={handleNavigate}
                onOpenAnnouncement={(ann) => {
                  setSelectedAnnouncement(ann);
                  handleNavigate('comunicados');
                }}
              />
            </div>

            <AnnouncementsSection
              announcements={announcements}
              completedIds={completedAnnouncementIds}
              selectedAnnouncement={selectedAnnouncement}
              onSelectAnnouncement={setSelectedAnnouncement}
              onConfirmRead={handleConfirmAnnouncementRead}
              isAuthenticated={isVerifiedSession}
            />

            <EndomarketingCultureSection />

            <AcademySection
              trainings={trainings}
              completedIds={completedTrainingIds}
              externalModule={selectedTraining}
              onClearExternalModule={() => setSelectedTraining(null)}
              onCompleteTraining={handleCompleteTraining}
              isAuthenticated={isVerifiedSession}
            />

            <EditorialDocumentViewer
              documents={documents}
              completedIds={completedDocumentIds}
              selectedDocument={selectedDocument}
              onSelectDocument={setSelectedDocument}
              onConfirmDocumentRead={handleConfirmDocumentRead}
              isAuthenticated={isVerifiedSession}
              customLogoUrl={brandSettings?.logoDataUrl}
            />

            <GamificationSection
              collaborator={collaborator}
              leaderboard={leaderboard}
              birthdays={birthdays}
              badgeDefinitions={displayBadges}
              activities={activities}
              isAuthenticated={isVerifiedSession}
              onOpenHistory={collaborator ? () => setVaultOpen(true) : undefined}
            />
          </>
        )}
      </main>

      <footer className="bg-[#11382B] text-white border-t border-[#C5A467]/40 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <MonogramLogo customLogoUrl={brandSettings?.logoDataUrl} onDarkSurface />
          <div className="text-xs text-white/75 space-y-1">
            <p className="text-[#D8BC83] font-medium">
              Cavalcante &amp; Rolim Empreendimentos — Signature Spaces
            </p>
            <p>
              Portal Oficial de RH &amp; Endomarketing · Criptografia E2EE &amp; Auditoria Ativa
            </p>
          </div>
        </div>
      </footer>

      {collaborator && privateProfile && isVerifiedSession && (
        <PrivateVaultModal
          isOpen={vaultOpen}
          onClose={() => setVaultOpen(false)}
          collaborator={collaborator}
          privateProfile={privateProfile}
          activities={activities}
          badgeDefinitions={displayBadges}
          onNotify={notify}
        />
      )}

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm px-5 py-3.5 rounded-xl bg-[#11382B] text-white border border-[#C5A467] shadow-xl text-xs font-medium leading-relaxed"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PortalShell />
    </ErrorBoundary>
  );
}
