import React, { useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Download,
  FileUp,
  Image as ImageIcon,
  Lock,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AnnouncementCategory,
  BOOTSTRAPPED_ADMIN_EMAIL,
  type ActivityCompletion,
  type Announcement,
  type AuditLog,
  type BadgeDefinition,
  type BadgeIconKey,
  type BirthdayEntry,
  type CollaboratorPublic,
  type CorporateDocument,
  type CriticalAlert,
  type PortalBrandSettings,
  type TrainingModule,
} from '../types/portal';
import { TRAINING_IMAGE_PATH } from '../data/seedData';
import {
  standardizeMediaImage,
  type MediaFramingMode,
  type StandardizedMediaResult,
} from '../utils/mediaEngine';
import { ImageProcessor } from './ImageProcessor';
import { importUniversalDocument, type ExtractedDocumentResult } from '../utils/documentEngine';
import { encryptSensitiveText } from '../utils/cryptoEngine';
import { exportRowsToCsv } from '../utils/csvExport';
import {
  awardCustomBadgeToCollaborator,
  deleteAnnouncement,
  deleteBadgeDefinition,
  deleteBirthdayEntry,
  deleteCorporateDocument,
  deleteTrainingModule,
  dispatchCriticalAlert,
  grantAdminAccess,
  publishAnnouncement,
  publishBirthdayEntry,
  publishCorporateDocument,
  publishTrainingModule,
  resolveCriticalAlert,
  revokeAdminAccess,
  saveBadgeDefinition,
  updateAnnouncement,
  updateBirthdayEntry,
  updateBrandSettings,
  updateCorporateDocument,
  updateTrainingModule,
  type AdminDirectoryEntry,
} from '../services/firestoreService';
import { BadgeIcon } from './BadgeIcon';

interface AdminPanelProps {
  currentUser: User;
  isBootstrappedAdmin: boolean;
  collaborators: CollaboratorPublic[];
  announcements: Announcement[];
  trainings: TrainingModule[];
  documents: CorporateDocument[];
  birthdays: BirthdayEntry[];
  adminRecords: AdminDirectoryEntry[];
  auditLogs: AuditLog[];
  alerts: CriticalAlert[];
  brandSettings: PortalBrandSettings | null;
  badgeDefinitions: BadgeDefinition[];
  allActivities: ActivityCompletion[];
  onSyncOfficialContent: () => Promise<void>;
  onNotify: (msg: string) => void;
}

type AdminTab =
  | 'monitoramento'
  | 'gamificacao'
  | 'midia'
  | 'academia'
  | 'importador'
  | 'auditoria';

const CHART_COLORS = ['#11382B', '#C5A467', '#1E5A46', '#D8BC83', '#2E7D63'];

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  isBootstrappedAdmin,
  collaborators,
  announcements,
  trainings,
  documents,
  birthdays,
  adminRecords,
  auditLogs,
  alerts,
  brandSettings,
  badgeDefinitions,
  allActivities,
  onSyncOfficialContent,
  onNotify,
}) => {
  const [tab, setTab] = useState<AdminTab>('monitoramento');
  const [syncingOfficial, setSyncingOfficial] = useState(false);

  // Estado: Publicar / Corrigir Comunicado com Padronizador 16:9
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [existingAnnImageUrl, setExistingAnnImageUrl] = useState('');
  const [annTitle, setAnnTitle] = useState('');
  const [annCategory, setAnnCategory] = useState<AnnouncementCategory>('Comunicado Oficial');
  const [annSummary, setAnnSummary] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPoints, setAnnPoints] = useState(25);
  const [annStatus, setAnnStatus] = useState<'published' | 'draft'>('published');
  const [annMedia, setAnnMedia] = useState<StandardizedMediaResult | null>(null);
  const [annSourceFile, setAnnSourceFile] = useState<File | null>(null);
  const [annFramingMode, setAnnFramingMode] = useState<MediaFramingMode>('auto');
  const [publishingAnn, setPublishingAnn] = useState(false);

  // Estado: Inserir / Corrigir Aniversariante com Padronizador 1:1
  const [editingBdayId, setEditingBdayId] = useState<string | null>(null);
  const [existingBdayAvatarUrl, setExistingBdayAvatarUrl] = useState('');
  const [bdayName, setBdayName] = useState('');
  const [bdayRole, setBdayRole] = useState('');
  const [bdayDept, setBdayDept] = useState('Engenharia');
  const [bdayBranch, setBdayBranch] = useState('Matriz C&R');
  const [bdayDay, setBdayDay] = useState(15);
  const [bdayMonth, setBdayMonth] = useState(12);
  const [bdayAvatar, setBdayAvatar] = useState<StandardizedMediaResult | null>(null);

  // Estado: Academia & Treinamentos (Inserir / Corrigir / Excluir)
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [trTitle, setTrTitle] = useState('');
  const [trTrack, setTrTrack] = useState('Cultura & Ética');
  const [trDuration, setTrDuration] = useState(20);
  const [trPoints, setTrPoints] = useState(60);
  const [trBadge, setTrBadge] = useState('Capacete de Ouro CR');
  const [trSummary, setTrSummary] = useState('');
  const [trLessonsText, setTrLessonsText] = useState(
    'Princípios Signature Spaces na prática\nProtocolos de qualidade e segurança operacional'
  );
  const [trQuizQuestion, setTrQuizQuestion] = useState('');
  const [trQuizOpt0, setTrQuizOpt0] = useState('');
  const [trQuizOpt1, setTrQuizOpt1] = useState('');
  const [trQuizOpt2, setTrQuizOpt2] = useState('');
  const [trCorrectIdx, setTrCorrectIdx] = useState(0);
  const [trCoverUrl, setTrCoverUrl] = useState(TRAINING_IMAGE_PATH);
  const [trCoverFile, setTrCoverFile] = useState<File | null>(null);
  const [trCoverFraming, setTrCoverFraming] = useState<MediaFramingMode>('auto');
  const [trCoverMeta, setTrCoverMeta] = useState<StandardizedMediaResult | null>(null);
  const [trStatus, setTrStatus] = useState<'published' | 'draft'>('published');
  const [savingTraining, setSavingTraining] = useState(false);

  // Estado: Identidade Visual (Logotipo & Hero)
  const [heroHeadline, setHeroHeadline] = useState(
    brandSettings?.heroHeadline || 'Arquitetura que atravessa gerações'
  );
  const [heroSubheadline, setHeroSubheadline] = useState(
    brandSettings?.heroSubheadline ||
      'Portal oficial de pessoas, cultura construtiva, governança e excelência Signature Spaces da Cavalcante & Rolim Empreendimentos.'
  );
  const [logoPreview, setLogoPreview] = useState<string | undefined>(brandSettings?.logoDataUrl);
  const [heroPreview, setHeroPreview] = useState<string | undefined>(brandSettings?.heroImageUrl);
  const [heroSourceFile, setHeroSourceFile] = useState<File | null>(null);
  const [heroFramingMode, setHeroFramingMode] = useState<MediaFramingMode>('auto');
  const [heroMeta, setHeroMeta] = useState<StandardizedMediaResult | null>(null);

  // Estado: Importador Universal & Correção de Documentos
  const [parsedDoc, setParsedDoc] = useState<ExtractedDocumentResult | null>(null);
  const [docCode, setDocCode] = useState('CR-DOC-2026-01');
  const [docCategory, setDocCategory] = useState('Governança & RH');
  const [docPoints, setDocPoints] = useState(40);
  const [encryptDoc, setEncryptDoc] = useState(false);
  const [docPassphrase, setDocPassphrase] = useState('');
  const [importingDoc, setImportingDoc] = useState(false);

  const [editingDocItem, setEditingDocItem] = useState<CorporateDocument | null>(null);
  const [editDocTitle, setEditDocTitle] = useState('');
  const [editDocCode, setEditDocCode] = useState('');
  const [editDocCategory, setEditDocCategory] = useState('');
  const [editDocPoints, setEditDocPoints] = useState(40);
  const [editDocStatus, setEditDocStatus] = useState<'published' | 'draft'>('published');
  const [editDocContent, setEditDocContent] = useState('');
  const [savingDocEdit, setSavingDocEdit] = useState(false);

  // Estado: Alerta Crítico Manual & Filtros de Auditoria & Gestão de Acessos
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState<'all' | 'info' | 'warning' | 'critical'>('all');
  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);

  // Estado: Badges Customizáveis & Premiação
  const [editingBadgeId, setEditingBadgeId] = useState<string | undefined>(undefined);
  const [badgeTitle, setBadgeTitle] = useState('');
  const [badgeDesc, setBadgeDesc] = useState('');
  const [badgeCriteria, setBadgeCriteria] = useState('');
  const [badgeIcon, setBadgeIcon] = useState<BadgeIconKey>('medal');
  const [badgeAccent, setBadgeAccent] = useState('#C5A467');
  const [savingBadge, setSavingBadge] = useState(false);

  const [awardTargetUid, setAwardTargetUid] = useState('');
  const [awardBadgeTitle, setAwardBadgeTitle] = useState('');
  const [awardBonusPoints, setAwardBonusPoints] = useState(50);
  const [awardingBadge, setAwardingBadge] = useState(false);

  const adminUidSet = useMemo(() => new Set(adminRecords.map((a) => a.uid)), [adminRecords]);
  const unresolvedAlertsCount = alerts.filter((a) => !a.resolved).length;
  const totalPointsPool = collaborators.reduce((acc, c) => acc + c.points, 0);

  // Dados dinâmicos para gráficos Recharts
  const activityEngagementData = useMemo(() => {
    const counts = {
      announcement: 0,
      training: 0,
      document: 0,
      checkin: 0,
    };
    if (allActivities.length > 0) {
      for (const act of allActivities) {
        counts[act.targetType] = (counts[act.targetType] || 0) + 1;
      }
    } else {
      for (const c of collaborators) {
        counts.announcement += c.readAnnouncementsCount;
        counts.training += c.completedModulesCount;
        counts.document += c.readDocumentsCount;
      }
    }
    return [
      { name: 'Comunicados', total: counts.announcement },
      { name: 'Academia', total: counts.training },
      { name: 'Acervo Docs', total: counts.document },
      { name: 'Check-ins', total: counts.checkin },
    ];
  }, [allActivities, collaborators]);

  const departmentPointsData = useMemo(() => {
    const byDept = new Map<string, number>();
    for (const c of collaborators) {
      const dept = c.department || 'Geral';
      byDept.set(dept, (byDept.get(dept) || 0) + c.points);
    }
    const result = Array.from(byDept.entries())
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
    return result.length > 0
      ? result
      : [{ name: 'Aguardando engajamento', value: 1 }];
  }, [collaborators]);

  const filteredAuditLogs = useMemo(() => {
    const term = auditSearch.trim().toLowerCase();
    return auditLogs.filter((log) => {
      if (auditSeverity !== 'all' && log.severity !== auditSeverity) return false;
      if (!term) return true;
      return (
        log.actorName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        log.resource.toLowerCase().includes(term)
      );
    });
  }, [auditLogs, auditSearch, auditSeverity]);

  const handleSyncOfficial = async () => {
    setSyncingOfficial(true);
    try {
      await onSyncOfficialContent();
    } finally {
      setSyncingOfficial(false);
    }
  };

  const processAnnouncementMedia = async (file: File, mode: MediaFramingMode) => {
    try {
      const result = await standardizeMediaImage(file, 'banner-16-9', mode);
      setAnnMedia(result);
      setAnnFramingMode(mode);
      const framingDesc =
        result.appliedFraming === 'contain-framed'
          ? 'enquadramento integral C&R (sem cortes)'
          : 'preenchimento panorâmico 16:9';
      onNotify(
        `Imagem ${result.originalWidth}×${result.originalHeight}px adaptada (${framingDesc} · redução de ${result.compressionRatio}%).`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao padronizar imagem.');
    }
  };

  const handleStandardizeAnnImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnnSourceFile(file);
    await processAnnouncementMedia(file, 'auto');
  };

  const resetAnnouncementForm = () => {
    setEditingAnnId(null);
    setExistingAnnImageUrl('');
    setAnnTitle('');
    setAnnCategory('Comunicado Oficial');
    setAnnSummary('');
    setAnnContent('');
    setAnnPoints(25);
    setAnnStatus('published');
    setAnnMedia(null);
    setAnnSourceFile(null);
    setAnnFramingMode('auto');
  };

  const handleStartEditAnnouncement = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setExistingAnnImageUrl(ann.imageUrl);
    setAnnTitle(ann.title);
    setAnnCategory(ann.category);
    setAnnSummary(ann.summary);
    setAnnContent(ann.content);
    setAnnPoints(ann.pointsReward);
    setAnnStatus(ann.status);
    setAnnMedia(null);
    setAnnSourceFile(null);
    setAnnFramingMode('auto');
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImageUrl = annMedia?.dataUrl || existingAnnImageUrl;
    if (!finalImageUrl) {
      onNotify('Envie uma imagem para padronização automática 16:9 antes de publicar.');
      return;
    }
    setPublishingAnn(true);
    try {
      if (editingAnnId) {
        await updateAnnouncement(editingAnnId, currentUser, {
          title: annTitle,
          category: annCategory,
          summary: annSummary,
          content: annContent,
          imageUrl: finalImageUrl,
          pointsReward: annPoints,
          status: annStatus,
        });
        onNotify('Comunicado corrigido e atualizado com sucesso.');
      } else {
        await publishAnnouncement(currentUser, {
          title: annTitle,
          category: annCategory,
          summary: annSummary,
          content: annContent,
          imageUrl: finalImageUrl,
          authorName: currentUser.displayName || 'Diretoria C&R',
          pointsReward: annPoints,
          featured: true,
          status: annStatus,
        });
        onNotify('Comunicado publicado e padronizado com sucesso.');
      }
      resetAnnouncementForm();
    } finally {
      setPublishingAnn(false);
    }
  };

  const handleStandardizeBdayAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await standardizeMediaImage(file, 'avatar-1-1');
    setBdayAvatar(result);
    onNotify(`Retrato 1:1 padronizado (${result.width}×${result.height}px).`);
  };

  const resetBirthdayForm = () => {
    setEditingBdayId(null);
    setExistingBdayAvatarUrl('');
    setBdayName('');
    setBdayRole('');
    setBdayDept('Engenharia');
    setBdayBranch('Matriz C&R');
    setBdayDay(15);
    setBdayMonth(12);
    setBdayAvatar(null);
  };

  const handleStartEditBirthday = (b: BirthdayEntry) => {
    setEditingBdayId(b.id);
    setExistingBdayAvatarUrl(b.avatarUrl || '');
    setBdayName(b.name);
    setBdayRole(b.roleTitle);
    setBdayDept(b.department);
    setBdayBranch(b.branch || 'Matriz C&R');
    setBdayDay(b.day);
    setBdayMonth(b.month);
    setBdayAvatar(null);
  };

  const handlePublishBirthday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBdayId) {
      await updateBirthdayEntry(editingBdayId, currentUser, {
        name: bdayName,
        roleTitle: bdayRole,
        department: bdayDept,
        branch: bdayBranch,
        day: bdayDay,
        month: bdayMonth,
        avatarUrl: bdayAvatar?.dataUrl ?? existingBdayAvatarUrl,
        active: true,
      });
      onNotify('Cadastro do aniversariante atualizado.');
    } else {
      await publishBirthdayEntry(currentUser, {
        name: bdayName,
        roleTitle: bdayRole,
        department: bdayDept,
        branch: bdayBranch,
        day: bdayDay,
        month: bdayMonth,
        avatarUrl: bdayAvatar?.dataUrl || '',
        active: true,
      });
      onNotify('Aniversariante adicionado ao mural.');
    }
    resetBirthdayForm();
  };

  const resetTrainingForm = () => {
    setEditingTrainingId(null);
    setTrTitle('');
    setTrTrack('Cultura & Ética');
    setTrDuration(20);
    setTrPoints(60);
    setTrBadge('Capacete de Ouro CR');
    setTrSummary('');
    setTrLessonsText(
      'Princípios Signature Spaces na prática\nProtocolos de qualidade e segurança operacional'
    );
    setTrQuizQuestion('');
    setTrQuizOpt0('');
    setTrQuizOpt1('');
    setTrQuizOpt2('');
    setTrCorrectIdx(0);
    setTrCoverUrl(TRAINING_IMAGE_PATH);
    setTrCoverFile(null);
    setTrCoverFraming('auto');
    setTrCoverMeta(null);
    setTrStatus('published');
  };

  const handleStartEditTraining = (tr: TrainingModule) => {
    setEditingTrainingId(tr.id);
    setTrTitle(tr.title);
    setTrTrack(tr.track);
    setTrDuration(tr.durationMinutes);
    setTrPoints(tr.pointsReward);
    setTrBadge(tr.badgeAwarded);
    setTrSummary(tr.summary);
    setTrLessonsText(tr.lessons.join('\n'));
    setTrQuizQuestion(tr.quizQuestion);
    setTrQuizOpt0(tr.quizOptions[0] || '');
    setTrQuizOpt1(tr.quizOptions[1] || '');
    setTrQuizOpt2(tr.quizOptions[2] || '');
    setTrCorrectIdx(tr.correctOptionIndex);
    setTrCoverUrl(tr.coverUrl || TRAINING_IMAGE_PATH);
    setTrCoverFile(null);
    setTrCoverFraming('auto');
    setTrCoverMeta(null);
    setTrStatus(tr.status);
  };

  const processTrainingCover = async (file: File, mode: MediaFramingMode) => {
    try {
      const res = await standardizeMediaImage(file, 'banner-16-9', mode);
      setTrCoverUrl(res.dataUrl);
      setTrCoverFraming(mode);
      setTrCoverMeta(res);
      const framingDesc =
        res.appliedFraming === 'contain-framed'
          ? 'enquadramento integral (sem cortes)'
          : 'preenchimento 16:9';
      onNotify(
        `Capa do treinamento (${res.originalWidth}×${res.originalHeight}px) adaptada via ${framingDesc}.`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao adaptar capa do treinamento.');
    }
  };

  const handleTrainingCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTrCoverFile(file);
    await processTrainingCover(file, 'auto');
  };

  const handleSaveTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    const lessons = trLessonsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const quizOptions = [trQuizOpt0.trim(), trQuizOpt1.trim(), trQuizOpt2.trim()].filter(
      Boolean
    );
    if (quizOptions.length < 2) {
      onNotify('Informe pelo menos 2 alternativas para a questão de avaliação.');
      return;
    }
    const safeCorrectIdx = Math.min(trCorrectIdx, quizOptions.length - 1);
    setSavingTraining(true);
    try {
      const payload = {
        title: trTitle,
        track: trTrack,
        durationMinutes: trDuration,
        pointsReward: trPoints,
        coverUrl: trCoverUrl || TRAINING_IMAGE_PATH,
        summary: trSummary,
        lessons: lessons.length > 0 ? lessons : [trSummary],
        quizQuestion: trQuizQuestion,
        quizOptions,
        correctOptionIndex: safeCorrectIdx,
        badgeAwarded: trBadge,
        status: trStatus,
      };
      if (editingTrainingId) {
        await updateTrainingModule(editingTrainingId, currentUser, payload);
        onNotify('Módulo da Academia corrigido e atualizado.');
      } else {
        await publishTrainingModule(currentUser, payload);
        onNotify('Novo módulo publicado na Academia C&R.');
      }
      resetTrainingForm();
    } finally {
      setSavingTraining(false);
    }
  };

  const handleStartEditDocument = (docItem: CorporateDocument) => {
    setEditingDocItem(docItem);
    setEditDocTitle(docItem.title);
    setEditDocCode(docItem.docCode);
    setEditDocCategory(docItem.category);
    setEditDocPoints(docItem.pointsReward);
    setEditDocStatus(docItem.status);
    setEditDocContent(docItem.extractedContent || '');
  };

  const handleSaveDocumentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDocItem) return;
    setSavingDocEdit(true);
    try {
      await updateCorporateDocument(editingDocItem.id, currentUser, {
        title: editDocTitle,
        docCode: editDocCode,
        category: editDocCategory,
        pointsReward: editDocPoints,
        status: editDocStatus,
        ...(editingDocItem.isEncrypted ? {} : { extractedContent: editDocContent }),
      });
      onNotify('Documento do acervo corrigido e atualizado.');
      setEditingDocItem(null);
    } finally {
      setSavingDocEdit(false);
    }
  };

  const handleToggleAdminRole = async (collab: CollaboratorPublic, currentlyAdmin: boolean) => {
    setUpdatingRoleUid(collab.uid);
    try {
      if (currentlyAdmin) {
        await revokeAdminAccess(currentUser, collab.uid);
        onNotify(`${collab.displayName} alterado para Modo Colaborador.`);
      } else {
        await grantAdminAccess(currentUser, collab);
        onNotify(`${collab.displayName} promovido para Modo Gestor autorizado.`);
      }
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Erro ao atualizar perfil de acesso.'
      );
    } finally {
      setUpdatingRoleUid(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await standardizeMediaImage(file, 'logo-1-1', 'auto');
    setLogoPreview(res.dataUrl);
    onNotify(
      `Logotipo 1:1 adaptado integralmente (${res.originalWidth}×${res.originalHeight}px → ${res.width}×${res.height}px).`
    );
  };

  const processHeroMedia = async (file: File, mode: MediaFramingMode) => {
    const res = await standardizeMediaImage(file, 'banner-16-9', mode);
    setHeroPreview(res.dataUrl);
    setHeroFramingMode(mode);
    setHeroMeta(res);
    onNotify(
      `Banner Hero (${res.originalWidth}×${res.originalHeight}px) adaptado em 16:9 (${res.appliedFraming === 'contain-framed' ? 'moldura integral' : 'preenchimento'}).`
    );
  };

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroSourceFile(file);
    await processHeroMedia(file, 'auto');
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateBrandSettings(currentUser, {
      logoDataUrl: logoPreview,
      heroImageUrl: heroPreview,
      heroHeadline,
      heroSubheadline,
    });
    onNotify('Identidade visual e Hero atualizados no Firestore.');
  };

  const handleUniversalDocSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingDoc(true);
    try {
      const result = await importUniversalDocument(file);
      setParsedDoc(result);
      onNotify(
        `Arquivo "${file.name}" extraído (${result.unitLabel} · ${result.wordCount} palavras).`
      );
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao importar arquivo.');
    } finally {
      setImportingDoc(false);
    }
  };

  const handlePublishDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedDoc) return;

    setImportingDoc(true);
    try {
      let encryptedEnvelope: string | undefined;
      let extractedContent: string | undefined = parsedDoc.extractedContent;

      if (encryptDoc) {
        encryptedEnvelope = await encryptSensitiveText(
          parsedDoc.extractedContent,
          docPassphrase
        );
        extractedContent = undefined;
      }

      await publishCorporateDocument(currentUser, {
        title: parsedDoc.title,
        docCode,
        sourceFormat: parsedDoc.sourceFormat,
        category: docCategory,
        authorName: currentUser.displayName || 'Diretoria C&R',
        isEncrypted: encryptDoc,
        extractedContent,
        encryptedEnvelope,
        imageDataUrl: parsedDoc.imageDataUrl,
        pointsReward: docPoints,
        status: 'published',
      });

      setParsedDoc(null);
      setDocPassphrase('');
      setEncryptDoc(false);
      onNotify('Documento publicado no Template Editorial Cavalcante & Rolim.');
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Erro ao publicar documento.');
    } finally {
      setImportingDoc(false);
    }
  };

  const handleSaveCustomBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeTitle.trim() || !badgeDesc.trim() || !badgeCriteria.trim()) return;
    setSavingBadge(true);
    try {
      await saveBadgeDefinition(currentUser, {
        id: editingBadgeId,
        title: badgeTitle,
        description: badgeDesc,
        criteria: badgeCriteria,
        iconKey: badgeIcon,
        accentHex: badgeAccent,
        active: true,
      });
      setEditingBadgeId(undefined);
      setBadgeTitle('');
      setBadgeDesc('');
      setBadgeCriteria('');
      setBadgeIcon('medal');
      setBadgeAccent('#C5A467');
      onNotify('Badge dourada customizável salva no catálogo.');
    } finally {
      setSavingBadge(false);
    }
  };

  const handleStartEditBadge = (b: BadgeDefinition) => {
    setEditingBadgeId(b.id);
    setBadgeTitle(b.title);
    setBadgeDesc(b.description);
    setBadgeCriteria(b.criteria);
    setBadgeIcon(b.iconKey);
    setBadgeAccent(b.accentHex || '#C5A467');
  };

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCollab = collaborators.find((c) => c.uid === awardTargetUid);
    if (!targetCollab || !awardBadgeTitle) return;
    setAwardingBadge(true);
    try {
      await awardCustomBadgeToCollaborator(
        currentUser,
        targetCollab,
        awardBadgeTitle,
        awardBonusPoints
      );
      onNotify(
        `Badge "${awardBadgeTitle}" (+${awardBonusPoints} pts) concedida a ${targetCollab.displayName}.`
      );
      setAwardTargetUid('');
      setAwardBadgeTitle('');
    } finally {
      setAwardingBadge(false);
    }
  };

  const handleExportPerformanceCsv = () => {
    exportRowsToCsv(
      `Desempenho_Colaboradores_CR_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'UID',
        'Colaborador',
        'Departamento',
        'Cargo',
        'Nível',
        'Pontos',
        'Selos',
        'Módulos Concluídos',
        'Comunicados Lidos',
        'Documentos Lidos',
      ],
      collaborators.map((c) => [
        c.uid,
        c.displayName,
        c.department,
        c.roleTitle,
        c.levelTitle,
        c.points,
        c.badges.join(' | '),
        c.completedModulesCount,
        c.readAnnouncementsCount,
        c.readDocumentsCount,
      ])
    );
    onNotify('Relatório de desempenho exportado em CSV.');
  };

  const handleExportActivitiesCsv = () => {
    exportRowsToCsv(
      `Atividades_Colaboradores_CR_${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID Registro', 'Colaborador', 'UID', 'Tipo de Ação', 'Título da Atividade', 'Pontos Obtidos'],
      allActivities.map((act) => [
        act.id,
        act.userName,
        act.userId,
        act.targetType.toUpperCase(),
        act.targetTitle,
        act.pointsEarned,
      ])
    );
    onNotify('Histórico detalhado de atividades exportado em CSV.');
  };

  const handleExportAuditCsv = () => {
    exportRowsToCsv(
      `Auditoria_Seguranca_CR_${new Date().toISOString().slice(0, 10)}.csv`,
      ['ID', 'Ator', 'Ação', 'Recurso', 'Severidade', 'Hash SHA-256', 'Detalhes'],
      filteredAuditLogs.map((l) => [
        l.id,
        l.actorName,
        l.action,
        l.resource,
        l.severity,
        l.integrityHash,
        l.details,
      ])
    );
    onNotify('Log de auditoria exportado em CSV.');
  };

  const handleSendCriticalAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim()) return;
    await dispatchCriticalAlert({
      title: alertTitle,
      message: alertMessage,
      severity: 'critical',
      triggeredByUid: currentUser.uid,
      channels: ['push', 'painel-admin', 'email-diretoria'],
    });
    setAlertTitle('');
    setAlertMessage('');
    onNotify('Alerta crítico disparado via Push e registrado no painel.');
  };

  return (
    <section
      id="admin"
      className="py-16 bg-[#F8F7F4] dark:bg-[#0B1410] border-b border-[#1C2421]/10 dark:border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-8">
        {/* Cabeçalho do Modo Gestor */}
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 pb-6 border-b border-[#C5A467]/40">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#11382B] dark:text-[#D8BC83] font-semibold mb-1.5">
              Governança &amp; Controle Executivo
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C2421] dark:text-white">
              Modo Gestor — Painel Administrativo
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncOfficial}
              disabled={syncingOfficial}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#C5A467] bg-white dark:bg-[#11241C] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] hover:bg-[#11382B] hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingOfficial ? 'animate-spin' : ''}`} />
              <span>Sincronizar Materiais Oficiais C&amp;R</span>
            </button>

            <div className="flex flex-wrap gap-1.5 p-1 bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 rounded-lg">
              {(
                [
                  { id: 'monitoramento', label: 'Monitoramento & Gráficos' },
                  { id: 'midia', label: 'Comunicados & Mídia' },
                  { id: 'academia', label: 'Academia & Cursos' },
                  { id: 'importador', label: 'Documentos & Acervo' },
                  { id: 'gamificacao', label: 'Badges & Premiação' },
                  { id: 'auditoria', label: `Acessos & Auditoria (${unresolvedAlertsCount})` },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    tab === t.id
                      ? 'bg-[#11382B] text-[#D8BC83]'
                      : 'text-[#1C2421]/75 dark:text-white/75 hover:text-[#11382B] dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ABA 1: MONITORAMENTO, GRÁFICOS RECHARTS & RELATÓRIOS CSV */}
        {tab === 'monitoramento' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-xs text-[#1C2421]/60 dark:text-white/60">
                  Colaboradores Ativos
                </p>
                <p className="text-3xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {collaborators.length}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-xs text-[#1C2421]/60 dark:text-white/60">
                  Pontuação Acumulada
                </p>
                <p className="text-3xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {totalPointsPool}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-xs text-[#1C2421]/60 dark:text-white/60">
                  Atividades Registradas
                </p>
                <p className="text-3xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {allActivities.length}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/10 dark:border-white/10">
                <p className="text-xs text-[#1C2421]/60 dark:text-white/60">
                  Eventos de Auditoria
                </p>
                <p className="text-3xl font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums mt-1">
                  {auditLogs.length}
                </p>
              </div>
            </div>

            {/* Gráficos de Engajamento com Recharts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#11382B] dark:text-[#D8BC83] font-semibold">
                      Métricas de Participação
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-[#1C2421] dark:text-white">
                      Engajamento por Categoria de Ação
                    </h3>
                  </div>
                  <BarChart3 className="w-5 h-5 text-[#C5A467]" />
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={activityEngagementData}
                      margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#C5A467" strokeOpacity={0.25} />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#88918D' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#88918D' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#11382B',
                          border: '1px solid #C5A467',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="total" name="Conclusões" radius={[6, 6, 0, 0]}>
                        {activityEngagementData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={idx % 2 === 0 ? '#11382B' : '#C5A467'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-[#11382B] dark:text-[#D8BC83] font-semibold">
                      Distribuição Corporativa
                    </p>
                    <h3 className="font-serif text-xl font-semibold text-[#1C2421] dark:text-white">
                      Pontuação Acumulada por Área
                    </h3>
                  </div>
                  <Award className="w-5 h-5 text-[#C5A467]" />
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentPointsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={88}
                        paddingAngle={3}
                      >
                        {departmentPointsData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={CHART_COLORS[idx % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#11382B',
                          border: '1px solid #C5A467',
                          borderRadius: '8px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {departmentPointsData.map((entry, idx) => (
                    <span
                      key={entry.name}
                      className="inline-flex items-center gap-1.5 text-xs text-[#1C2421]/80 dark:text-white/80"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-xs"
                        style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                      />
                      <span>
                        {entry.name} ({entry.value})
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                Desempenho Detalhado de Colaboradores
              </h3>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleExportActivitiesCsv}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#C5A467] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] hover:bg-[#11382B] hover:text-white transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Atividades (CSV)</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportPerformanceCsv}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-xs font-semibold cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#C5A467]" />
                  <span>Exportar Desempenho (CSV)</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#11382B] text-[#D8BC83] text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Colaborador</th>
                    <th className="px-4 py-3 font-semibold">Departamento</th>
                    <th className="px-4 py-3 font-semibold text-right">Comunicados</th>
                    <th className="px-4 py-3 font-semibold text-right">Treinos</th>
                    <th className="px-4 py-3 font-semibold text-right">Docs</th>
                    <th className="px-4 py-3 font-semibold text-right">Selos</th>
                    <th className="px-4 py-3 font-semibold text-right">Pontos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1C2421]/10 dark:divide-white/10">
                  {collaborators.map((c) => (
                    <tr key={c.uid}>
                      <td className="px-4 py-3 font-medium text-[#1C2421] dark:text-white">
                        {c.displayName}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#1C2421]/70 dark:text-white/70">
                        {c.department} · {c.roleTitle}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {c.readAnnouncementsCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {c.completedModulesCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {c.readDocumentsCount}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums">
                        {c.badges.length}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-[#11382B] dark:text-[#D8BC83] tabular-nums">
                        {c.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ABA 2: BADGES DOURADAS CUSTOMIZÁVEIS & PREMIAÇÃO DIRETA */}
        {tab === 'gamificacao' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSaveCustomBadge}
              className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                  {editingBadgeId ? 'Editar Badge Dourada' : 'Nova Badge Customizável'}
                </h3>
                {editingBadgeId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBadgeId(undefined);
                      setBadgeTitle('');
                      setBadgeDesc('');
                      setBadgeCriteria('');
                    }}
                    className="text-xs text-[#11382B] dark:text-[#D8BC83] underline cursor-pointer"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <input
                type="text"
                value={badgeTitle}
                onChange={(e) => setBadgeTitle(e.target.value)}
                required
                placeholder="Nome da badge (ex: Capacete de Ouro CR)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
              />

              <textarea
                rows={2}
                value={badgeDesc}
                onChange={(e) => setBadgeDesc(e.target.value)}
                required
                placeholder="Descrição da conquista..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
              />

              <input
                type="text"
                value={badgeCriteria}
                onChange={(e) => setBadgeCriteria(e.target.value)}
                required
                placeholder="Critério de obtenção (ex: Concluir 3 DDS turbinados)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#1C2421]/65 dark:text-white/65 mb-1">
                    Ícone Dourado
                  </label>
                  <select
                    value={badgeIcon}
                    onChange={(e) => setBadgeIcon(e.target.value as BadgeIconKey)}
                    className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                  >
                    <option value="hardhat">Capacete de Obra</option>
                    <option value="crown">Coroa Signature</option>
                    <option value="shield">Escudo Ética</option>
                    <option value="medal">Medalha Clássica</option>
                    <option value="award">Selo Excelência</option>
                    <option value="star">Estrela Destaque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#1C2421]/65 dark:text-white/65 mb-1">
                    Tom Metálico
                  </label>
                  <select
                    value={badgeAccent}
                    onChange={(e) => setBadgeAccent(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                  >
                    <option value="#C5A467">Ouro Metálico (#C5A467)</option>
                    <option value="#D8BC83">Ouro Champanhe (#D8BC83)</option>
                    <option value="#E6C98C">Ouro Brilhante (#E6C98C)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingBadge}
                className="w-full py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-xs font-semibold cursor-pointer"
              >
                {savingBadge ? 'Salvando...' : 'Salvar Badge no Catálogo'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-6">
              {/* Conceder Badge Diretamente ao Colaborador */}
              <form
                onSubmit={handleAwardBadge}
                className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#C5A467]/60 space-y-4"
              >
                <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                  Conceder Badge Dourada a Colaborador (Top 5 / Destaque)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select
                    value={awardTargetUid}
                    onChange={(e) => setAwardTargetUid(e.target.value)}
                    required
                    className="px-3 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                  >
                    <option value="">Selecionar colaborador...</option>
                    {collaborators.map((c) => (
                      <option key={c.uid} value={c.uid}>
                        {c.displayName} ({c.points} pts)
                      </option>
                    ))}
                  </select>
                  <select
                    value={awardBadgeTitle}
                    onChange={(e) => setAwardBadgeTitle(e.target.value)}
                    required
                    className="px-3 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                  >
                    <option value="">Selecionar badge dourada...</option>
                    {badgeDefinitions.map((b) => (
                      <option key={b.id} value={b.title}>
                        {b.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0}
                    max={500}
                    value={awardBonusPoints}
                    onChange={(e) => setAwardBonusPoints(Number(e.target.value))}
                    className="px-3 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs font-mono tabular-nums"
                    placeholder="Bônus pts"
                  />
                </div>
                <button
                  type="submit"
                  disabled={awardingBadge || !awardTargetUid || !awardBadgeTitle}
                  className="px-4 py-2.5 rounded-lg bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83] disabled:opacity-50 text-xs font-semibold cursor-pointer"
                >
                  {awardingBadge ? 'Concedendo...' : 'Conceder Badge & Atualizar Ranking'}
                </button>
              </form>

              {/* Lista de Badges Cadastradas */}
              <div className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-3">
                <h3 className="font-serif text-xl font-semibold text-[#1C2421] dark:text-white">
                  Catálogo Ativo de Badges ({badgeDefinitions.length})
                </h3>
                <div className="divide-y divide-[#1C2421]/10 dark:divide-white/10">
                  {badgeDefinitions.map((b) => (
                    <div
                      key={b.id}
                      className="py-3 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-[#11382B] border border-[#C5A467] flex items-center justify-center text-[#D8BC83] shrink-0">
                          <BadgeIcon iconKey={b.iconKey} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#1C2421] dark:text-white truncate">
                            {b.title}
                          </p>
                          <p className="text-xs text-[#1C2421]/65 dark:text-white/65 truncate">
                            {b.criteria}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditBadge(b)}
                          className="text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] hover:underline cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteBadgeDefinition(b.id, currentUser)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          aria-label={`Excluir ${b.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ABA 3: PADRONIZAÇÃO AUTOMÁTICA DE MÍDIA & IDENTIDADE */}
        {tab === 'midia' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form
              onSubmit={handlePublishAnnouncement}
              className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                  {editingAnnId
                    ? 'Corrigir Comunicado Oficial'
                    : 'Publicar Comunicado (Padronizador 16:9)'}
                </h3>
                {editingAnnId && (
                  <button
                    type="button"
                    onClick={resetAnnouncementForm}
                    className="text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] underline cursor-pointer"
                  >
                    Cancelar edição
                  </button>
                )}
              </div>

              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                required
                placeholder="Título do comunicado"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
              />

              <div className="grid grid-cols-3 gap-3">
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as AnnouncementCategory)}
                  className="px-3 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                >
                  <option value="Comunicado Oficial">Comunicado Oficial</option>
                  <option value="Obras & Projetos">Obras &amp; Projetos</option>
                  <option value="Cultura & Pessoas">Cultura &amp; Pessoas</option>
                  <option value="Segurança & ESG">Segurança &amp; ESG</option>
                </select>
                <select
                  value={annStatus}
                  onChange={(e) => setAnnStatus(e.target.value as 'published' | 'draft')}
                  className="px-3 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Rascunho</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  value={annPoints}
                  onChange={(e) => setAnnPoints(Number(e.target.value))}
                  placeholder="Pontos"
                  className="px-3 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm font-mono tabular-nums"
                />
              </div>

              <input
                type="text"
                value={annSummary}
                onChange={(e) => setAnnSummary(e.target.value)}
                required
                placeholder="Resumo executivo (exibido no cartão)"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
              />

              <textarea
                rows={4}
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                required
                placeholder="Texto completo do comunicado..."
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
              />

              <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#C5A467] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] cursor-pointer hover:bg-[#F8F7F4] dark:hover:bg-white/5">
                <ImageIcon className="w-4 h-4 text-[#C5A467]" />
                <span>
                  {editingAnnId
                    ? 'Substituir Imagem (Adaptação Automática ao Portal)'
                    : 'Enviar Imagem (Leitura & Enquadramento Automático)'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStandardizeAnnImage}
                  className="hidden"
                />
              </label>

              {(annMedia || existingAnnImageUrl) && (
                <div className="space-y-2.5">
                  <ImageProcessor
                    src={annMedia ? annMedia.dataUrl : existingAnnImageUrl}
                    alt="Prévia adaptada do comunicado"
                    aspectRatio="16:9"
                    fitMode={annSourceFile ? annFramingMode : 'auto'}
                    variant="card"
                    roundedClassName="rounded-xl"
                  />

                  {annSourceFile && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                      <span className="text-[11px] font-medium text-[#1C2421]/70 dark:text-white/70">
                        Modo de enquadramento:
                      </span>
                      <div className="inline-flex rounded-lg border border-[#C5A467]/40 bg-[#F8F7F4] dark:bg-[#0B1410] p-0.5">
                        {(
                          [
                            { id: 'auto', label: 'Automático' },
                            { id: 'contain-framed', label: 'Inteira (Sem Cortes)' },
                            { id: 'cover', label: 'Preencher 16:9' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => processAnnouncementMedia(annSourceFile, opt.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                              annFramingMode === opt.id
                                ? 'bg-[#11382B] text-[#D8BC83]'
                                : 'text-[#1C2421]/70 dark:text-white/70 hover:text-[#11382B] dark:hover:text-white'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {annMedia && (
                    <p className="text-xs text-[#11382B] dark:text-[#D8BC83] font-mono tabular-nums">
                      Original: {annMedia.originalWidth}×{annMedia.originalHeight}px (
                      {annMedia.detectedOrientation === 'portrait'
                        ? 'Vertical'
                        : annMedia.detectedOrientation === 'square'
                        ? 'Quadrada'
                        : 'Paisagem'}
                      ) → Portal: {annMedia.width}×{annMedia.height}px ·{' '}
                      {annMedia.appliedFraming === 'contain-framed'
                        ? 'Moldura integral sem cortes'
                        : 'Preenchimento 16:9'}{' '}
                      · Compressão {annMedia.compressionRatio}%
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={publishingAnn}
                className="w-full py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-xs font-semibold cursor-pointer"
              >
                {publishingAnn
                  ? 'Salvando...'
                  : editingAnnId
                  ? 'Salvar Correções do Comunicado'
                  : 'Publicar Comunicado Oficial'}
              </button>

              {announcements.length > 0 && (
                <div className="pt-4 border-t border-[#1C2421]/10 dark:border-white/10 space-y-2">
                  <p className="text-xs font-semibold text-[#1C2421]/70 dark:text-white/70">
                    Comunicados Cadastrados ({announcements.length})
                  </p>
                  <div className="max-h-60 overflow-y-auto divide-y divide-[#1C2421]/8 dark:divide-white/8">
                    {announcements.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-2 text-xs py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{a.title}</p>
                          <p className="text-[11px] text-[#1C2421]/55 dark:text-white/55">
                            {a.category} · {a.status === 'draft' ? 'Rascunho' : 'Publicado'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditAnnouncement(a)}
                            className="text-[#11382B] dark:text-[#D8BC83] hover:opacity-75 cursor-pointer"
                            aria-label={`Corrigir ${a.title}`}
                            title="Corrigir comunicado"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteAnnouncement(a.id, currentUser)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            aria-label={`Excluir ${a.title}`}
                            title="Excluir comunicado"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            <div className="space-y-8">
              <form
                onSubmit={handleSaveBranding}
                className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4"
              >
                <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                  Logotipo C&amp;R &amp; Hero Principal
                </h3>

                <input
                  type="text"
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                  placeholder="Título do Hero"
                />

                <textarea
                  rows={2}
                  value={heroSubheadline}
                  onChange={(e) => setHeroSubheadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                  placeholder="Subtítulo institucional"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#C5A467] text-xs font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#C5A467]" />
                    <span>Substituir Logo (1:1)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#C5A467] text-xs font-medium cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#C5A467]" />
                    <span>Substituir Hero (16:9)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {(logoPreview || heroPreview) && (
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-lg bg-[#F8F7F4] dark:bg-[#0B1410] border border-[#C5A467]/30">
                    {logoPreview && (
                      <div className="sm:col-span-3 flex items-center gap-2">
                        <div className="w-12 h-12 shrink-0">
                          <ImageProcessor
                            src={logoPreview}
                            alt="Prévia do logotipo"
                            aspectRatio="1:1"
                            variant="logo"
                            roundedClassName="rounded-lg"
                            fallbackText="CR"
                          />
                        </div>
                        <span className="text-[11px] text-[#1C2421]/70 dark:text-white/70">
                          Logo 1:1
                        </span>
                      </div>
                    )}
                    {heroPreview && (
                      <div className={logoPreview ? 'sm:col-span-9 space-y-1.5' : 'sm:col-span-12 space-y-1.5'}>
                        <ImageProcessor
                          src={heroPreview}
                          alt="Prévia do banner Hero principal"
                          aspectRatio="16:9"
                          fitMode={heroSourceFile ? heroFramingMode : 'auto'}
                          variant="card"
                          roundedClassName="rounded-lg"
                        />
                        {heroSourceFile && heroMeta && (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] font-mono text-[#11382B] dark:text-[#D8BC83]">
                              {heroMeta.originalWidth}×{heroMeta.originalHeight}px ·{' '}
                              {heroMeta.appliedFraming === 'contain-framed' ? 'Integral' : '16:9'}
                            </span>
                            <div className="inline-flex rounded-md border border-[#C5A467]/40 bg-white dark:bg-[#11241C] p-0.5">
                              {(['auto', 'contain-framed', 'cover'] as const).map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  onClick={() => processHeroMedia(heroSourceFile, m)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                                    heroFramingMode === m
                                      ? 'bg-[#11382B] text-[#D8BC83]'
                                      : 'text-[#1C2421]/70 dark:text-white/70'
                                  }`}
                                >
                                  {m === 'auto' ? 'Auto' : m === 'contain-framed' ? 'Inteira' : '16:9'}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#C5A467] text-[#11382B] hover:bg-[#D8BC83] text-xs font-semibold cursor-pointer"
                >
                  Salvar Identidade Visual
                </button>
              </form>

              <form
                onSubmit={handlePublishBirthday}
                className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                    {editingBdayId
                      ? 'Corrigir Aniversariante'
                      : 'Cadastrar Aniversariante (Retrato 1:1)'}
                  </h3>
                  {editingBdayId && (
                    <button
                      type="button"
                      onClick={resetBirthdayForm}
                      className="text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={bdayName}
                    onChange={(e) => setBdayName(e.target.value)}
                    required
                    placeholder="Nome completo"
                    className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                  />
                  <input
                    type="text"
                    value={bdayRole}
                    onChange={(e) => setBdayRole(e.target.value)}
                    required
                    placeholder="Cargo"
                    className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={bdayDept}
                    onChange={(e) => setBdayDept(e.target.value)}
                    required
                    placeholder="Área"
                    className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                  />
                  <select
                    value={bdayBranch}
                    onChange={(e) => setBdayBranch(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                  >
                    <option value="Matriz C&R">Matriz C&amp;R</option>
                    <option value="Manta Design SPE">Manta Design SPE</option>
                    <option value="Watal Patacho SPE">Watal Patacho SPE</option>
                  </select>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={bdayDay}
                    onChange={(e) => setBdayDay(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm font-mono"
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={bdayMonth}
                    onChange={(e) => setBdayMonth(Number(e.target.value))}
                    className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm font-mono"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {(bdayAvatar?.dataUrl || existingBdayAvatarUrl) && (
                    <div className="w-12 h-12 shrink-0">
                      <ImageProcessor
                        src={bdayAvatar?.dataUrl || existingBdayAvatarUrl}
                        alt={bdayName || 'Prévia do retrato 1:1'}
                        aspectRatio="1:1"
                        fitMode="cover"
                        variant="avatar"
                        roundedClassName="rounded-lg"
                      />
                    </div>
                  )}
                  <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[#C5A467] text-xs font-medium cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-[#C5A467]" />
                    <span>
                      {bdayAvatar
                        ? 'Retrato 1:1 Padronizado ✓'
                        : 'Retrato Opcional (1:1) ou Iniciais Douradas'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStandardizeBdayAvatar}
                      className="hidden"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] text-xs font-semibold cursor-pointer"
                >
                  {editingBdayId ? 'Salvar Correções do Aniversariante' : 'Adicionar Aniversariante'}
                </button>

                {birthdays.length > 0 && (
                  <div className="pt-4 border-t border-[#1C2421]/10 dark:border-white/10 space-y-2">
                    <p className="text-xs font-semibold text-[#1C2421]/70 dark:text-white/70">
                      Mural de Aniversariantes ({birthdays.length})
                    </p>
                    <div className="max-h-48 overflow-y-auto divide-y divide-[#1C2421]/8 dark:divide-white/8">
                      {birthdays.map((b) => (
                        <div
                          key={b.id}
                          className="py-2 flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="truncate">
                            <strong>
                              {String(b.day).padStart(2, '0')}/{String(b.month).padStart(2, '0')}
                            </strong>{' '}
                            · {b.name} ({b.branch || b.department})
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditBirthday(b)}
                              className="text-[#11382B] dark:text-[#D8BC83] hover:opacity-75 cursor-pointer"
                              aria-label={`Corrigir ${b.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteBirthdayEntry(b.id, currentUser)}
                              className="text-red-600 hover:text-red-800 cursor-pointer"
                              aria-label={`Excluir ${b.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ABA NOVA: ACADEMIA C&R — INSERIR, CORRIGIR & EXCLUIR CURSOS */}
        {tab === 'academia' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleSaveTraining}
              className="lg:col-span-6 p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#C5A467]" />
                  <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                    {editingTrainingId ? 'Corrigir Treinamento' : 'Novo Módulo da Academia'}
                  </h3>
                </div>
                {editingTrainingId && (
                  <button
                    type="button"
                    onClick={resetTrainingForm}
                    className="text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] underline cursor-pointer"
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <input
                type="text"
                required
                value={trTitle}
                onChange={(e) => setTrTitle(e.target.value)}
                placeholder="Título do treinamento"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={trTrack}
                  onChange={(e) => setTrTrack(e.target.value)}
                  placeholder="Trilha"
                  className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                />
                <input
                  type="number"
                  min={1}
                  max={600}
                  value={trDuration}
                  onChange={(e) => setTrDuration(Number(e.target.value))}
                  placeholder="Minutos"
                  className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs font-mono"
                />
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={trPoints}
                  onChange={(e) => setTrPoints(Number(e.target.value))}
                  placeholder="Pontos"
                  className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs font-mono"
                />
                <select
                  value={trStatus}
                  onChange={(e) => setTrStatus(e.target.value as 'published' | 'draft')}
                  className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                >
                  <option value="published">Publicado</option>
                  <option value="draft">Rascunho</option>
                </select>
              </div>

              <input
                type="text"
                required
                value={trBadge}
                onChange={(e) => setTrBadge(e.target.value)}
                placeholder="Selo / Badge desbloqueada ao concluir"
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
              />

              <textarea
                rows={2}
                required
                value={trSummary}
                onChange={(e) => setTrSummary(e.target.value)}
                placeholder="Resumo do treinamento..."
                className="w-full px-3.5 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
              />

              <div>
                <label className="block text-[11px] font-medium text-[#1C2421]/70 dark:text-white/70 mb-1">
                  Tópicos das Aulas (um por linha)
                </label>
                <textarea
                  rows={3}
                  value={trLessonsText}
                  onChange={(e) => setTrLessonsText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                />
              </div>

              <div className="p-4 rounded-lg bg-[#F8F7F4] dark:bg-[#0B1410] border border-[#C5A467]/40 space-y-2.5">
                <p className="text-xs font-semibold text-[#11382B] dark:text-[#D8BC83]">
                  Questão de Avaliação Final
                </p>
                <input
                  type="text"
                  required
                  value={trQuizQuestion}
                  onChange={(e) => setTrQuizQuestion(e.target.value)}
                  placeholder="Enunciado da pergunta..."
                  className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                />
                <input
                  type="text"
                  required
                  value={trQuizOpt0}
                  onChange={(e) => setTrQuizOpt0(e.target.value)}
                  placeholder="Alternativa 1"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                />
                <input
                  type="text"
                  required
                  value={trQuizOpt1}
                  onChange={(e) => setTrQuizOpt1(e.target.value)}
                  placeholder="Alternativa 2"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                />
                <input
                  type="text"
                  value={trQuizOpt2}
                  onChange={(e) => setTrQuizOpt2(e.target.value)}
                  placeholder="Alternativa 3 (opcional)"
                  className="w-full px-3 py-1.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                />
                <select
                  value={trCorrectIdx}
                  onChange={(e) => setTrCorrectIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                >
                  <option value={0}>Resposta correta: Alternativa 1</option>
                  <option value={1}>Resposta correta: Alternativa 2</option>
                  <option value={2}>Resposta correta: Alternativa 3</option>
                </select>
              </div>

              <label className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-[#C5A467] text-xs font-medium cursor-pointer">
                <ImageIcon className="w-4 h-4 text-[#C5A467]" />
                <span>Personalizar Capa do Curso (Adaptação Automática)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTrainingCoverUpload}
                  className="hidden"
                />
              </label>

              {trCoverUrl && (
                <div className="space-y-2">
                  <ImageProcessor
                    src={trCoverUrl}
                    alt="Prévia da capa do treinamento"
                    aspectRatio="16:9"
                    fitMode={trCoverFile ? trCoverFraming : 'auto'}
                    variant="card"
                    roundedClassName="rounded-xl"
                  />
                  {trCoverFile && trCoverMeta && (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-[#11382B] dark:text-[#D8BC83]">
                        {trCoverMeta.originalWidth}×{trCoverMeta.originalHeight}px ·{' '}
                        {trCoverMeta.appliedFraming === 'contain-framed'
                          ? 'Moldura sem cortes'
                          : 'Preenchimento 16:9'}
                      </span>
                      <div className="inline-flex rounded-lg border border-[#C5A467]/40 bg-[#F8F7F4] dark:bg-[#0B1410] p-0.5">
                        {(
                          [
                            { id: 'auto', label: 'Automático' },
                            { id: 'contain-framed', label: 'Inteira (Sem Cortes)' },
                            { id: 'cover', label: 'Preencher 16:9' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => processTrainingCover(trCoverFile, opt.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer ${
                              trCoverFraming === opt.id
                                ? 'bg-[#11382B] text-[#D8BC83]'
                                : 'text-[#1C2421]/70 dark:text-white/70'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={savingTraining}
                className="w-full py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] text-xs font-semibold cursor-pointer"
              >
                {savingTraining
                  ? 'Salvando...'
                  : editingTrainingId
                  ? 'Salvar Correções do Treinamento'
                  : 'Publicar Módulo na Academia'}
              </button>
            </form>

            <div className="lg:col-span-6 p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                Módulos da Academia C&amp;R ({trainings.length})
              </h3>
              <div className="divide-y divide-[#1C2421]/10 dark:divide-white/10 max-h-[680px] overflow-y-auto">
                {trainings.map((tr) => (
                  <div
                    key={tr.id}
                    className="py-3.5 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-semibold text-sm text-[#1C2421] dark:text-white">
                        {tr.title}
                      </p>
                      <p className="text-[#11382B] dark:text-[#D8BC83]">
                        {tr.track} · {tr.durationMinutes} min · +{tr.pointsReward} pts · Selo:{' '}
                        {tr.badgeAwarded}
                      </p>
                      <p className="text-[#1C2421]/65 dark:text-white/65 line-clamp-2">
                        {tr.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditTraining(tr)}
                        className="text-[#11382B] dark:text-[#D8BC83] hover:opacity-75 cursor-pointer"
                        aria-label={`Corrigir ${tr.title}`}
                        title="Corrigir treinamento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTrainingModule(tr.id, currentUser)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        aria-label={`Excluir ${tr.title}`}
                        title="Excluir treinamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 4: IMPORTADOR UNIVERSAL DE DOCUMENTOS */}
        {tab === 'importador' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form
              onSubmit={handlePublishDocument}
              className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-5"
            >
              <div>
                <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white mb-1">
                  Motor de Importação Universal
                </h3>
                <p className="text-xs text-[#1C2421]/70 dark:text-white/70">
                  Aceita .pdf, .docx, .xlsx, .pptx, .txt e imagens — extrai conteúdo real e renderiza no Template Editorial Cavalcante &amp; Rolim.
                </p>
              </div>

              <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-xl border border-dashed border-[#C5A467] bg-[#F8F7F4] dark:bg-[#0B1410] cursor-pointer hover:border-[#11382B] transition-colors">
                <FileUp className="w-6 h-6 text-[#C5A467]" />
                <span className="text-xs font-semibold text-[#11382B] dark:text-[#D8BC83]">
                  {importingDoc
                    ? 'Processando arquivo...'
                    : 'Selecionar Arquivo (.pdf, .docx, .xlsx, .pptx, .txt, imagem)'}
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.xls,.pptx,.txt,.md,.csv,image/*"
                  onChange={handleUniversalDocSelect}
                  className="hidden"
                />
              </label>

              {parsedDoc && (
                <div className="p-4 rounded-lg bg-[#F8F7F4] dark:bg-[#0B1410] border border-[#C5A467]/50 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#11382B] dark:text-[#D8BC83]">
                      {parsedDoc.title}
                    </span>
                    <span className="font-mono text-[#1C2421]/70 dark:text-white/70">
                      {parsedDoc.sourceFormat.toUpperCase()} · {parsedDoc.unitLabel}
                    </span>
                  </div>
                  <pre className="text-xs max-h-40 overflow-y-auto whitespace-pre-wrap text-[#1C2421]/80 dark:text-white/80 font-sans">
                    {parsedDoc.extractedContent.slice(0, 900)}
                  </pre>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={docCode}
                  onChange={(e) => setDocCode(e.target.value)}
                  required
                  placeholder="Código (ex: CR-RH-02)"
                  className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs font-mono"
                />
                <input
                  type="text"
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  required
                  placeholder="Categoria"
                  className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                />
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={docPoints}
                  onChange={(e) => setDocPoints(Number(e.target.value))}
                  className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs font-mono"
                />
              </div>

              <div className="p-4 rounded-lg border border-[#1C2421]/12 dark:border-white/15 space-y-3">
                <label className="flex items-center gap-2.5 text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={encryptDoc}
                    onChange={(e) => setEncryptDoc(e.target.checked)}
                    className="accent-[#11382B]"
                  />
                  <Lock className="w-3.5 h-3.5 text-[#C5A467]" />
                  <span>Aplicar Criptografia Ponta a Ponta (AES-GCM-256) antes de gravar</span>
                </label>

                {encryptDoc && (
                  <input
                    type="password"
                    value={docPassphrase}
                    onChange={(e) => setDocPassphrase(e.target.value)}
                    required
                    placeholder="Chave criptográfica para liberação de leitura"
                    className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-xs"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={!parsedDoc || importingDoc}
                className="w-full py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] hover:bg-[#0B241B] disabled:opacity-50 text-xs font-semibold cursor-pointer"
              >
                Publicar no Acervo Editorial C&amp;R
              </button>
            </form>

            <div className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4">
              <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                Documentos no Acervo ({documents.length})
              </h3>

              {editingDocItem && (
                <form
                  onSubmit={handleSaveDocumentEdit}
                  className="p-4 rounded-xl bg-[#F8F7F4] dark:bg-[#0B1410] border border-[#C5A467] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#11382B] dark:text-[#D8BC83]">
                      Corrigindo: {editingDocItem.docCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingDocItem(null)}
                      className="text-xs underline cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={editDocTitle}
                    onChange={(e) => setEditDocTitle(e.target.value)}
                    placeholder="Título do documento"
                    className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      required
                      value={editDocCode}
                      onChange={(e) => setEditDocCode(e.target.value)}
                      className="px-2.5 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs font-mono"
                    />
                    <input
                      type="text"
                      required
                      value={editDocCategory}
                      onChange={(e) => setEditDocCategory(e.target.value)}
                      className="px-2.5 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                    />
                    <input
                      type="number"
                      min={0}
                      max={1000}
                      value={editDocPoints}
                      onChange={(e) => setEditDocPoints(Number(e.target.value))}
                      className="px-2.5 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs font-mono"
                    />
                    <select
                      value={editDocStatus}
                      onChange={(e) => setEditDocStatus(e.target.value as 'published' | 'draft')}
                      className="px-2.5 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                    >
                      <option value="published">Publicado</option>
                      <option value="draft">Rascunho</option>
                    </select>
                  </div>
                  {!editingDocItem.isEncrypted && (
                    <textarea
                      rows={4}
                      value={editDocContent}
                      onChange={(e) => setEditDocContent(e.target.value)}
                      placeholder="Conteúdo textual do documento editorial..."
                      className="w-full px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                    />
                  )}
                  <button
                    type="submit"
                    disabled={savingDocEdit}
                    className="w-full py-2 rounded-lg bg-[#11382B] text-white border border-[#C5A467] text-xs font-semibold cursor-pointer"
                  >
                    {savingDocEdit ? 'Salvando...' : 'Salvar Correções do Documento'}
                  </button>
                </form>
              )}

              <div className="divide-y divide-[#1C2421]/10 dark:divide-white/10">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="py-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[#1C2421] dark:text-white truncate">
                        {d.title}
                      </p>
                      <p className="text-[#1C2421]/60 dark:text-white/60 font-mono">
                        {d.docCode} · {d.sourceFormat.toUpperCase()}
                        {d.isEncrypted ? ' · E2EE' : ''}
                        {d.status === 'draft' ? ' · RASCUNHO' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditDocument(d)}
                        className="text-[#11382B] dark:text-[#D8BC83] hover:opacity-75 cursor-pointer"
                        aria-label={`Corrigir ${d.title}`}
                        title="Corrigir documento"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteCorporateDocument(d.id, currentUser)}
                        className="text-red-600 hover:text-red-800 cursor-pointer"
                        aria-label={`Remover ${d.title}`}
                        title="Excluir documento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ABA 5: GESTÃO DE ACESSOS (GESTOR / COLABORADOR), AUDITORIA & ALERTAS */}
        {tab === 'auditoria' && (
          <div className="space-y-8">
            <div className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#C5A467]/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#11382B] dark:text-[#D8BC83]">
                  <Users className="w-5 h-5 text-[#C5A467]" />
                  <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                    Gestão de Acessos — Modo Gestor vs Modo Colaborador
                  </h3>
                </div>
                <span className="text-xs text-[#1C2421]/65 dark:text-white/65">
                  Colaboradores só visualizam e interagem; gestores inserem, corrigem e excluem.
                </span>
              </div>

              {!isBootstrappedAdmin ? (
                <p className="p-4 rounded-lg bg-[#F8F7F4] dark:bg-[#0B1410] border border-[#1C2421]/10 dark:border-white/10 text-xs text-[#1C2421]/75 dark:text-white/75">
                  A promoção ou revogação de permissões de Modo Gestor e os logs globais de auditoria são gerenciados exclusivamente pela Diretoria Master ({BOOTSTRAPPED_ADMIN_EMAIL}).
                </p>
              ) : (
                <div className="overflow-x-auto border border-[#1C2421]/10 dark:border-white/10 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#11382B] text-[#D8BC83] uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Colaborador</th>
                        <th className="px-4 py-3 font-semibold">Área / Cargo</th>
                        <th className="px-4 py-3 font-semibold">Nível de Acesso Atual</th>
                        <th className="px-4 py-3 font-semibold text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1C2421]/10 dark:divide-white/10">
                      {collaborators.map((c) => {
                        const isSelfMaster = c.uid === currentUser.uid;
                        const isSecondaryAdmin = adminUidSet.has(c.uid);
                        return (
                          <tr key={c.uid}>
                            <td className="px-4 py-3 font-medium text-[#1C2421] dark:text-white">
                              {c.displayName}
                            </td>
                            <td className="px-4 py-3 text-[#1C2421]/70 dark:text-white/70">
                              {c.department} · {c.roleTitle}
                            </td>
                            <td className="px-4 py-3">
                              {isSelfMaster ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-[#11382B] dark:text-[#D8BC83]">
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A467]" />
                                  Gestor Master
                                </span>
                              ) : isSecondaryAdmin ? (
                                <span className="inline-flex items-center gap-1.5 font-semibold text-[#11382B] dark:text-[#D8BC83]">
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#C5A467]" />
                                  Modo Gestor Autorizado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[#1C2421]/75 dark:text-white/75">
                                  <UserCheck className="w-3.5 h-3.5 text-[#C5A467]" />
                                  Modo Colaborador
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {isSelfMaster ? (
                                <span className="text-[11px] text-[#1C2421]/50 dark:text-white/50">
                                  Protegido
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={updatingRoleUid === c.uid}
                                  onClick={() => handleToggleAdminRole(c, isSecondaryAdmin)}
                                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                                    isSecondaryAdmin
                                      ? 'border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30'
                                      : 'bg-[#11382B] text-[#D8BC83] border border-[#C5A467] hover:bg-[#0B241B]'
                                  }`}
                                >
                                  {updatingRoleUid === c.uid
                                    ? 'Atualizando...'
                                    : isSecondaryAdmin
                                    ? 'Restringir a Colaborador'
                                    : 'Liberar Modo Gestor'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <form
                onSubmit={handleSendCriticalAlert}
                className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#C5A467]/60 space-y-4"
              >
                <div className="flex items-center gap-2 text-[#11382B] dark:text-[#D8BC83]">
                  <AlertTriangle className="w-5 h-5 text-[#C5A467]" />
                  <h3 className="font-serif text-2xl font-semibold">
                    Disparar Alerta Crítico (Push &amp; Painel)
                  </h3>
                </div>
                <input
                  type="text"
                  value={alertTitle}
                  onChange={(e) => setAlertTitle(e.target.value)}
                  required
                  placeholder="Título do alerta operacional ou de segurança"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                />
                <textarea
                  rows={3}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  required
                  placeholder="Descrição da ocorrência crítica..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-[#F8F7F4] dark:bg-[#0B1410] text-sm"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-lg bg-[#11382B] text-white border border-[#C5A467] text-xs font-semibold cursor-pointer"
                  >
                    Emitir Alerta via Push
                  </button>
                  <a
                    href={`mailto:${currentUser.email || ''}?subject=${encodeURIComponent(
                      `[Alerta Crítico C&R] ${alertTitle || 'Ocorrência de Segurança'}`
                    )}&body=${encodeURIComponent(alertMessage)}`}
                    className="px-4 py-2.5 rounded-lg border border-[#C5A467] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83]"
                  >
                    Encaminhar via E-mail
                  </a>
                </div>
              </form>

              <div className="p-6 rounded-xl bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 space-y-4">
                <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                  Alertas Críticos Registrados ({alerts.length})
                </h3>
                {alerts.length === 0 ? (
                  <p className="text-xs text-[#1C2421]/65 dark:text-white/65">
                    Nenhum alerta crítico pendente.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {alerts.map((al) => (
                      <div
                        key={al.id}
                        className="p-3.5 rounded-lg border border-[#1C2421]/12 dark:border-white/15 flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[#1C2421] dark:text-white">
                            {al.title}
                          </p>
                          <p className="text-xs text-[#1C2421]/75 dark:text-white/75 mt-1">
                            {al.message}
                          </p>
                        </div>
                        {al.resolved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#11382B] dark:text-[#D8BC83] shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolvido
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => resolveCriticalAlert(al.id, currentUser)}
                            className="px-3 py-1 rounded-md bg-[#C5A467] text-[#11382B] text-xs font-semibold shrink-0 cursor-pointer"
                          >
                            Resolver
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#C5A467]" />
                  <h3 className="font-serif text-2xl font-semibold text-[#1C2421] dark:text-white">
                    Logs Imutáveis de Auditoria em Tempo Real ({filteredAuditLogs.length})
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-[#1C2421]/50 dark:text-white/50 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Filtrar ação ou usuário..."
                      className="pl-8 pr-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                    />
                  </div>
                  <select
                    value={auditSeverity}
                    onChange={(e) =>
                      setAuditSeverity(e.target.value as 'all' | 'info' | 'warning' | 'critical')
                    }
                    className="px-3 py-2 rounded-lg border border-[#1C2421]/20 dark:border-white/20 bg-white dark:bg-[#11241C] text-xs"
                  >
                    <option value="all">Todas Severidades</option>
                    <option value="info">INFO</option>
                    <option value="warning">WARNING</option>
                    <option value="critical">CRITICAL</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExportAuditCsv}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#C5A467] text-xs font-semibold text-[#11382B] dark:text-[#D8BC83] cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Auditoria CSV</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto bg-white dark:bg-[#11241C] border border-[#1C2421]/12 dark:border-white/10 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#11382B] text-[#D8BC83] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Ator</th>
                      <th className="px-4 py-3 font-semibold">Ação</th>
                      <th className="px-4 py-3 font-semibold">Severidade</th>
                      <th className="px-4 py-3 font-semibold">Detalhes</th>
                      <th className="px-4 py-3 font-semibold">Hash SHA-256</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1C2421]/10 dark:divide-white/10">
                    {filteredAuditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-4 py-3 font-medium text-[#1C2421] dark:text-white whitespace-nowrap">
                          {log.actorName}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#11382B] dark:text-[#D8BC83] whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              log.severity === 'critical'
                                ? 'text-red-700 dark:text-red-400'
                                : log.severity === 'warning'
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-[#11382B] dark:text-[#D8BC83]'
                            }`}
                          >
                            {log.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#1C2421]/80 dark:text-white/80">
                          {log.details}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[#1C2421]/60 dark:text-white/60">
                          {log.integrityHash.slice(0, 16)}…
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
