export type ThemePreference = 'system' | 'light' | 'dark';

export type PortalSection =
  | 'inicio'
  | 'comunicados'
  | 'endomarketing'
  | 'academia'
  | 'documentos'
  | 'ranking'
  | 'admin';

export type AnnouncementCategory =
  | 'Comunicado Oficial'
  | 'Obras & Projetos'
  | 'Cultura & Pessoas'
  | 'Segurança & ESG';

export type DocumentFormat = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'txt' | 'image';

export type BadgeIconKey = 'medal' | 'crown' | 'shield' | 'award' | 'star' | 'hardhat';

export const BLUEPRINT_LIMITS = {
  TITLE_MAX: 160,
  DOC_TITLE_MAX: 180,
  SUMMARY_MAX: 400,
  CONTENT_MAX: 20000,
  DOC_CONTENT_MAX: 150000,
  IMAGE_DATAURL_MAX: 295000,
  AVATAR_DATAURL_MAX: 245000,
  DEPARTMENT_MAX: 80,
  ROLE_MAX: 80,
  NAME_MAX: 120,
} as const;

export const BOOTSTRAPPED_ADMIN_EMAIL = 'willian.vianna@cavalcanterolim.com.br';

export interface CollaboratorPublic {
  uid: string;
  displayName: string;
  photoURL: string;
  department: string;
  roleTitle: string;
  points: number;
  badges: string[];
  completedModulesCount: number;
  readAnnouncementsCount: number;
  readDocumentsCount: number;
  levelTitle: string;
  isActive: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface UserPrivate {
  uid: string;
  email: string;
  phone?: string;
  fcmToken?: string;
  pushEnabled: boolean;
  encryptedPayload?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Announcement {
  id: string;
  title: string;
  category: AnnouncementCategory;
  summary: string;
  content: string;
  imageUrl: string;
  authorName: string;
  authorUid: string;
  pointsReward: number;
  featured: boolean;
  status: 'published' | 'draft';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface TrainingQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  track: string;
  durationMinutes: number;
  pointsReward: number;
  coverUrl: string;
  summary: string;
  lessons: string[];
  quizQuestion: string;
  quizOptions: string[];
  correctOptionIndex: number;
  badgeAwarded: string;
  status: 'published' | 'draft';
  authorUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface CorporateDocument {
  id: string;
  title: string;
  docCode: string;
  sourceFormat: DocumentFormat;
  category: string;
  authorName: string;
  authorUid: string;
  isEncrypted: boolean;
  extractedContent?: string;
  encryptedEnvelope?: string;
  imageDataUrl?: string;
  pointsReward: number;
  status: 'published' | 'draft';
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BirthdayEntry {
  id: string;
  name: string;
  roleTitle: string;
  department: string;
  branch?: string;
  day: number;
  month: number;
  avatarUrl: string;
  active: boolean;
  authorUid: string;
  createdAt?: unknown;
}

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  criteria: string;
  iconKey: BadgeIconKey;
  accentHex: string;
  active: boolean;
  authorUid: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface ActivityCompletion {
  id: string;
  userId: string;
  userName: string;
  targetType: 'announcement' | 'training' | 'document' | 'checkin';
  targetId: string;
  targetTitle: string;
  pointsEarned: number;
  createdAt?: unknown;
}

export interface AuditLog {
  id: string;
  actorUid: string;
  actorName: string;
  action: string;
  resource: string;
  severity: 'info' | 'warning' | 'critical';
  integrityHash: string;
  details: string;
  createdAt?: unknown;
}

export interface CriticalAlert {
  id: string;
  title: string;
  message: string;
  severity: 'warning' | 'critical';
  triggeredByUid: string;
  resolved: boolean;
  dispatchedChannels: string[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PortalBrandSettings {
  logoDataUrl?: string;
  heroImageUrl?: string;
  heroHeadline: string;
  heroSubheadline: string;
  updatedByUid: string;
  updatedAt?: unknown;
}

export function computeLevelTitle(points: number): string {
  if (points >= 600) return 'Sócio Honorário';
  if (points >= 350) return 'Arquiteto Sênior';
  if (points >= 180) return 'Especialista Signature';
  if (points >= 60) return 'Membro Ativo';
  return 'Iniciante C&R';
}
