import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import {
  db,
  handleFirestoreError,
  OperationType,
  triggerLocalPushNotification,
} from '../firebase/config';
import { computeSha256Hash } from '../utils/cryptoEngine';
import {
  BLUEPRINT_LIMITS,
  BOOTSTRAPPED_ADMIN_EMAIL,
  computeLevelTitle,
  type ActivityCompletion,
  type Announcement,
  type AuditLog,
  type BadgeDefinition,
  type BirthdayEntry,
  type CollaboratorPublic,
  type CorporateDocument,
  type CriticalAlert,
  type PortalBrandSettings,
  type TrainingModule,
  type UserPrivate,
} from '../types/portal';
import {
  INITIAL_ANNOUNCEMENTS,
  INITIAL_BADGE_DEFINITIONS,
  INITIAL_BIRTHDAYS,
  INITIAL_BRAND_SETTINGS,
  INITIAL_DOCUMENTS,
  INITIAL_TRAININGS,
  clampText,
} from '../data/seedData';

function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 110);
  return cleaned.length > 0 ? cleaned : `id_${Date.now()}`;
}

export async function recordAuditLog(params: {
  actorUid: string;
  actorName: string;
  action: string;
  resource: string;
  severity: 'info' | 'warning' | 'critical';
  details: string;
}): Promise<void> {
  const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `audit_logs/${logId}`;
  try {
    const integrityHash = await computeSha256Hash(
      `${params.actorUid}|${params.action}|${params.resource}|${params.severity}|${Date.now()}`
    );
    await setDoc(doc(db, 'audit_logs', logId), {
      actorUid: sanitizeId(params.actorUid),
      actorName: clampText(params.actorName, BLUEPRINT_LIMITS.NAME_MAX),
      action: clampText(params.action, 120),
      resource: clampText(params.resource, 160),
      severity: params.severity,
      integrityHash: integrityHash.slice(0, 64),
      details: clampText(params.details, 500),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function dispatchCriticalAlert(params: {
  title: string;
  message: string;
  severity: 'warning' | 'critical';
  triggeredByUid: string;
  channels?: string[];
}): Promise<void> {
  const alertId = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const path = `alerts/${alertId}`;
  try {
    const dispatchedChannels = params.channels ?? ['push', 'painel-admin', 'email-alerta'];
    await setDoc(doc(db, 'alerts', alertId), {
      title: clampText(params.title, 160),
      message: clampText(params.message, 600),
      severity: params.severity,
      triggeredByUid: sanitizeId(params.triggeredByUid),
      resolved: false,
      dispatchedChannels: dispatchedChannels.slice(0, 5),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    triggerLocalPushNotification(`Alerta C&R: ${params.title}`, params.message);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function resolveCriticalAlert(alertId: string, adminUser: User): Promise<void> {
  const path = `alerts/${alertId}`;
  try {
    await updateDoc(doc(db, 'alerts', alertId), {
      resolved: true,
      updatedAt: serverTimestamp(),
    });
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || adminUser.email || 'Administrador',
      action: 'RESOLVE_CRITICAL_ALERT',
      resource: path,
      severity: 'info',
      details: `Alerta ${alertId} marcado como resolvido.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function checkIsAdminUser(user: User): Promise<boolean> {
  if (user.email === BOOTSTRAPPED_ADMIN_EMAIL && user.emailVerified) {
    return true;
  }
  try {
    const snap = await getDoc(doc(db, 'admins', user.uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function ensureUserProfiles(user: User): Promise<{
  collaborator: CollaboratorPublic;
  privateProfile: UserPrivate;
  isAdmin: boolean;
}> {
  const collabPath = `collaborators/${user.uid}`;
  const privPath = `users_private/${user.uid}`;
  let collaborator: CollaboratorPublic;
  let privateProfile: UserPrivate;

  try {
    const collabRef = doc(db, 'collaborators', user.uid);
    const collabSnap = await getDoc(collabRef);

    if (!collabSnap.exists()) {
      const initialCollab: CollaboratorPublic = {
        uid: user.uid,
        displayName: clampText(user.displayName || 'Colaborador C&R', BLUEPRINT_LIMITS.NAME_MAX),
        photoURL: clampText(user.photoURL || '', BLUEPRINT_LIMITS.AVATAR_DATAURL_MAX),
        department: 'Engenharia & Escritório',
        roleTitle:
          user.email === BOOTSTRAPPED_ADMIN_EMAIL ? 'Diretor & Administrador' : 'Colaborador C&R',
        points: 0,
        badges: [],
        completedModulesCount: 0,
        readAnnouncementsCount: 0,
        readDocumentsCount: 0,
        levelTitle: computeLevelTitle(0),
        isActive: true,
      };
      await setDoc(collabRef, {
        ...initialCollab,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      collaborator = initialCollab;
    } else {
      collaborator = collabSnap.data() as CollaboratorPublic;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, collabPath);
  }

  try {
    const privRef = doc(db, 'users_private', user.uid);
    const privSnap = await getDoc(privRef);
    if (!privSnap.exists()) {
      const initialPriv: UserPrivate = {
        uid: user.uid,
        email: clampText(user.email || 'colaborador@cavalcanterolim.com.br', 200),
        phone: '',
        fcmToken: '',
        pushEnabled: false,
        encryptedPayload: '',
      };
      await setDoc(privRef, {
        ...initialPriv,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      privateProfile = initialPriv;
    } else {
      privateProfile = privSnap.data() as UserPrivate;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privPath);
  }

  const isAdmin = await checkIsAdminUser(user);

  const authMethod =
    user.providerData?.[0]?.providerId === 'password' ? 'E-mail e Senha' : 'Google OAuth';

  await recordAuditLog({
    actorUid: user.uid,
    actorName: collaborator.displayName,
    action: 'SESSION_AUTHENTICATED',
    resource: `collaborators/${user.uid}`,
    severity: 'info',
    details: `Sessão autenticada via ${authMethod} (${isAdmin ? 'Perfil Gestor' : 'Perfil Colaborador'}).`,
  });

  return { collaborator, privateProfile, isAdmin };
}

/**
 * Garante que todos os materiais oficiais da Cavalcante & Rolim (Logo oficial, 9 aniversariantes reais,
 * Plano de Endomarketing 2026, Código de Conduta MANU-RH-V001 e Badges Douradas) existam no Firestore,
 * sem sobrescrever edições manuais pré-existentes.
 */
export async function seedInitialInstitutionalContent(adminUser: User): Promise<number> {
  try {
    let createdCount = 0;
    const batch = writeBatch(db);

    const brandSnap = await getDoc(doc(db, 'portal_settings', 'brand'));
    if (!brandSnap.exists() || !brandSnap.data()?.logoDataUrl) {
      batch.set(doc(db, 'portal_settings', 'brand'), {
        ...INITIAL_BRAND_SETTINGS,
        updatedByUid: adminUser.uid,
        updatedAt: serverTimestamp(),
      });
      createdCount += 1;
    }

    const existingAnn = await getDocs(
      query(collection(db, 'announcements'), limit(50))
    );
    const annIds = new Set(existingAnn.docs.map((d) => d.id));
    for (const ann of INITIAL_ANNOUNCEMENTS) {
      if (!annIds.has(ann.id)) {
        batch.set(doc(db, 'announcements', ann.id), {
          title: ann.title,
          category: ann.category,
          summary: ann.summary,
          content: ann.content,
          imageUrl: ann.imageUrl,
          authorName: ann.authorName,
          authorUid: adminUser.uid,
          pointsReward: ann.pointsReward,
          featured: ann.featured,
          status: ann.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        createdCount += 1;
      }
    }

    const existingTr = await getDocs(query(collection(db, 'trainings'), limit(50)));
    const trIds = new Set(existingTr.docs.map((d) => d.id));
    for (const tr of INITIAL_TRAININGS) {
      if (!trIds.has(tr.id)) {
        batch.set(doc(db, 'trainings', tr.id), {
          title: tr.title,
          track: tr.track,
          durationMinutes: tr.durationMinutes,
          pointsReward: tr.pointsReward,
          coverUrl: tr.coverUrl,
          summary: tr.summary,
          lessons: tr.lessons,
          quizQuestion: tr.quizQuestion,
          quizOptions: tr.quizOptions,
          correctOptionIndex: tr.correctOptionIndex,
          badgeAwarded: tr.badgeAwarded,
          status: tr.status,
          authorUid: adminUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        createdCount += 1;
      }
    }

    const existingDocs = await getDocs(query(collection(db, 'documents'), limit(50)));
    const docIds = new Set(existingDocs.docs.map((d) => d.id));
    for (const docItem of INITIAL_DOCUMENTS) {
      if (!docIds.has(docItem.id)) {
        batch.set(doc(db, 'documents', docItem.id), {
          title: docItem.title,
          docCode: docItem.docCode,
          sourceFormat: docItem.sourceFormat,
          category: docItem.category,
          authorName: docItem.authorName,
          authorUid: adminUser.uid,
          isEncrypted: docItem.isEncrypted,
          extractedContent: docItem.extractedContent,
          pointsReward: docItem.pointsReward,
          status: docItem.status,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        createdCount += 1;
      }
    }

    const existingBdays = await getDocs(query(collection(db, 'birthdays'), limit(50)));
    const bdayIds = new Set(existingBdays.docs.map((d) => d.id));
    for (const bday of INITIAL_BIRTHDAYS) {
      if (!bdayIds.has(bday.id)) {
        batch.set(doc(db, 'birthdays', bday.id), {
          name: bday.name,
          roleTitle: bday.roleTitle,
          department: bday.department,
          branch: bday.branch,
          day: bday.day,
          month: bday.month,
          avatarUrl: bday.avatarUrl,
          active: bday.active,
          authorUid: adminUser.uid,
          createdAt: serverTimestamp(),
        });
        createdCount += 1;
      }
    }

    const existingBadges = await getDocs(query(collection(db, 'badge_definitions'), limit(50)));
    const badgeIds = new Set(existingBadges.docs.map((d) => d.id));
    for (const badge of INITIAL_BADGE_DEFINITIONS) {
      if (!badgeIds.has(badge.id)) {
        batch.set(doc(db, 'badge_definitions', badge.id), {
          title: badge.title,
          description: badge.description,
          criteria: badge.criteria,
          iconKey: badge.iconKey,
          accentHex: badge.accentHex,
          active: badge.active,
          authorUid: adminUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        createdCount += 1;
      }
    }

    if (createdCount > 0) {
      await batch.commit();
      await recordAuditLog({
        actorUid: adminUser.uid,
        actorName: adminUser.displayName || 'Administrador',
        action: 'SYNC_OFFICIAL_CONTENT',
        resource: 'firestore/institutional_sync',
        severity: 'info',
        details: `${createdCount} itens oficiais da Cavalcante & Rolim sincronizados no Firestore.`,
      });
    }

    return createdCount;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'initial_seed');
  }
}

export async function updateCollaboratorProfile(
  uid: string,
  updates: { displayName: string; department: string; roleTitle: string; photoURL: string }
): Promise<void> {
  const path = `collaborators/${uid}`;
  try {
    await updateDoc(doc(db, 'collaborators', uid), {
      displayName: clampText(updates.displayName, BLUEPRINT_LIMITS.NAME_MAX),
      department: clampText(updates.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
      roleTitle: clampText(updates.roleTitle, BLUEPRINT_LIMITS.ROLE_MAX),
      photoURL: clampText(updates.photoURL, BLUEPRINT_LIMITS.AVATAR_DATAURL_MAX),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function awardCustomBadgeToCollaborator(
  adminUser: User,
  collaborator: CollaboratorPublic,
  badgeTitle: string,
  bonusPoints = 50
): Promise<void> {
  const path = `collaborators/${collaborator.uid}`;
  try {
    const badges = collaborator.badges.includes(badgeTitle)
      ? collaborator.badges
      : [...collaborator.badges, badgeTitle].slice(0, 25);
    const newPoints = collaborator.points + Math.max(0, bonusPoints);

    await updateDoc(doc(db, 'collaborators', collaborator.uid), {
      badges,
      points: newPoints,
      levelTitle: computeLevelTitle(newPoints),
      updatedAt: serverTimestamp(),
    });

    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'AWARD_CUSTOM_BADGE',
      resource: path,
      severity: 'info',
      details: `Badge dourada "${badgeTitle}" (+${bonusPoints} pts) concedida a ${collaborator.displayName}.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function saveBadgeDefinition(
  adminUser: User,
  badge: Omit<BadgeDefinition, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<string> {
  const id = badge.id ? sanitizeId(badge.id) : `badge_${Date.now()}`;
  const path = `badge_definitions/${id}`;
  try {
    const existing = await getDoc(doc(db, 'badge_definitions', id));
    if (existing.exists()) {
      await updateDoc(doc(db, 'badge_definitions', id), {
        title: clampText(badge.title, 80),
        description: clampText(badge.description, 240),
        criteria: clampText(badge.criteria, 200),
        iconKey: badge.iconKey,
        accentHex: clampText(badge.accentHex, 20),
        active: badge.active,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'badge_definitions', id), {
        title: clampText(badge.title, 80),
        description: clampText(badge.description, 240),
        criteria: clampText(badge.criteria, 200),
        iconKey: badge.iconKey,
        accentHex: clampText(badge.accentHex, 20),
        active: badge.active,
        authorUid: adminUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'SAVE_BADGE_DEFINITION',
      resource: path,
      severity: 'info',
      details: `Badge dourada "${badge.title}" customizada no catálogo.`,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteBadgeDefinition(id: string, adminUser: User): Promise<void> {
  const path = `badge_definitions/${id}`;
  try {
    await deleteDoc(doc(db, 'badge_definitions', id));
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'DELETE_BADGE_DEFINITION',
      resource: path,
      severity: 'warning',
      details: `Badge customizada ${id} removida.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updatePrivatePushSettings(
  uid: string,
  pushEnabled: boolean,
  fcmToken: string | null
): Promise<void> {
  const path = `users_private/${uid}`;
  try {
    await updateDoc(doc(db, 'users_private', uid), {
      pushEnabled,
      fcmToken: clampText(fcmToken || '', 512),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function savePrivateEncryptedPayload(uid: string, encryptedPayload: string): Promise<void> {
  const path = `users_private/${uid}`;
  try {
    await updateDoc(doc(db, 'users_private', uid), {
      encryptedPayload: clampText(encryptedPayload, 20000),
      updatedAt: serverTimestamp(),
    });
    await recordAuditLog({
      actorUid: uid,
      actorName: 'Colaborador E2EE',
      action: 'E2EE_VAULT_UPDATED',
      resource: path,
      severity: 'info',
      details: 'Cofre pessoal cifrado com AES-GCM-256 atualizado no cliente.',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function awardGamificationAction(params: {
  collaborator: CollaboratorPublic;
  targetType: 'announcement' | 'training' | 'document' | 'checkin';
  targetId: string;
  targetTitle: string;
  pointsEarned: number;
  badgeToUnlock?: string;
}): Promise<{ awarded: boolean; newPoints: number; unlockedBadge: string | null }> {
  const cleanTargetId = sanitizeId(params.targetId);
  const activityId = sanitizeId(`${params.collaborator.uid}_${params.targetType}_${cleanTargetId}`);
  const actRef = doc(db, 'activities', activityId);

  try {
    const existingAct = await getDoc(actRef);
    if (existingAct.exists()) {
      return { awarded: false, newPoints: params.collaborator.points, unlockedBadge: null };
    }

    const newPoints = params.collaborator.points + params.pointsEarned;
    const readAnnouncementsCount =
      params.collaborator.readAnnouncementsCount + (params.targetType === 'announcement' ? 1 : 0);
    const completedModulesCount =
      params.collaborator.completedModulesCount + (params.targetType === 'training' ? 1 : 0);
    const readDocumentsCount =
      params.collaborator.readDocumentsCount + (params.targetType === 'document' ? 1 : 0);

    const updatedBadges = [...params.collaborator.badges];
    let unlockedBadge: string | null = null;

    const tryAddBadge = (badgeName: string) => {
      if (!updatedBadges.includes(badgeName) && updatedBadges.length < 25) {
        updatedBadges.push(badgeName);
        unlockedBadge = badgeName;
      }
    };

    if (params.badgeToUnlock) {
      tryAddBadge(params.badgeToUnlock);
    }
    if (newPoints >= 100 || params.targetType === 'checkin') {
      tryAddBadge('Embaixador C&R');
    }
    if (readAnnouncementsCount + readDocumentsCount >= 3) {
      tryAddBadge('Leitor Assíduo');
    }
    if (newPoints >= 300) {
      tryAddBadge('Excelência Operacional');
    }

    const batch = writeBatch(db);
    batch.set(actRef, {
      userId: params.collaborator.uid,
      userName: clampText(params.collaborator.displayName, BLUEPRINT_LIMITS.NAME_MAX),
      targetType: params.targetType,
      targetId: cleanTargetId,
      targetTitle: clampText(params.targetTitle, 180),
      pointsEarned: params.pointsEarned,
      createdAt: serverTimestamp(),
    });

    batch.update(doc(db, 'collaborators', params.collaborator.uid), {
      points: newPoints,
      badges: updatedBadges,
      completedModulesCount,
      readAnnouncementsCount,
      readDocumentsCount,
      levelTitle: computeLevelTitle(newPoints),
      updatedAt: serverTimestamp(),
    });

    await batch.commit();

    return { awarded: true, newPoints, unlockedBadge };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `activities/${activityId}`);
  }
}

export async function publishAnnouncement(
  adminUser: User,
  payload: Omit<Announcement, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = `ann_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `announcements/${id}`;
  try {
    await setDoc(doc(db, 'announcements', id), {
      title: clampText(payload.title, BLUEPRINT_LIMITS.TITLE_MAX),
      category: payload.category,
      summary: clampText(payload.summary, BLUEPRINT_LIMITS.SUMMARY_MAX),
      content: clampText(payload.content, BLUEPRINT_LIMITS.CONTENT_MAX),
      imageUrl: clampText(payload.imageUrl, BLUEPRINT_LIMITS.IMAGE_DATAURL_MAX),
      authorName: clampText(payload.authorName, BLUEPRINT_LIMITS.NAME_MAX),
      authorUid: adminUser.uid,
      pointsReward: Math.max(0, Math.min(1000, Math.round(payload.pointsReward))),
      featured: Boolean(payload.featured),
      status: payload.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'PUBLISH_ANNOUNCEMENT',
      resource: path,
      severity: 'info',
      details: `Comunicado "${payload.title}" publicado com imagem padronizada.`,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateAnnouncement(
  id: string,
  adminUser: User,
  updates: Partial<Omit<Announcement, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const path = `announcements/${id}`;
  try {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.title !== undefined) payload.title = clampText(updates.title, BLUEPRINT_LIMITS.TITLE_MAX);
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.summary !== undefined) payload.summary = clampText(updates.summary, BLUEPRINT_LIMITS.SUMMARY_MAX);
    if (updates.content !== undefined) payload.content = clampText(updates.content, BLUEPRINT_LIMITS.CONTENT_MAX);
    if (updates.imageUrl !== undefined) payload.imageUrl = clampText(updates.imageUrl, BLUEPRINT_LIMITS.IMAGE_DATAURL_MAX);
    if (updates.pointsReward !== undefined) payload.pointsReward = Math.max(0, Math.min(1000, Math.round(updates.pointsReward)));
    if (updates.featured !== undefined) payload.featured = Boolean(updates.featured);
    if (updates.status !== undefined) payload.status = updates.status;

    await updateDoc(doc(db, 'announcements', id), payload);
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'UPDATE_ANNOUNCEMENT',
      resource: path,
      severity: 'info',
      details: `Comunicado "${updates.title || id}" atualizado pelo gestor.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteAnnouncement(id: string, adminUser: User): Promise<void> {
  const path = `announcements/${id}`;
  try {
    await deleteDoc(doc(db, 'announcements', id));
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'DELETE_ANNOUNCEMENT',
      resource: path,
      severity: 'warning',
      details: `Comunicado ${id} removido pelo administrador.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function publishCorporateDocument(
  adminUser: User,
  payload: Omit<CorporateDocument, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `documents/${id}`;
  try {
    const docData: Record<string, unknown> = {
      title: clampText(payload.title, BLUEPRINT_LIMITS.DOC_TITLE_MAX),
      docCode: clampText(payload.docCode, 40),
      sourceFormat: payload.sourceFormat,
      category: clampText(payload.category, 80),
      authorName: clampText(payload.authorName, BLUEPRINT_LIMITS.NAME_MAX),
      authorUid: adminUser.uid,
      isEncrypted: Boolean(payload.isEncrypted),
      pointsReward: Math.max(0, Math.min(1000, Math.round(payload.pointsReward))),
      status: payload.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (payload.extractedContent !== undefined) {
      docData.extractedContent = clampText(payload.extractedContent, BLUEPRINT_LIMITS.DOC_CONTENT_MAX);
    }
    if (payload.encryptedEnvelope !== undefined) {
      docData.encryptedEnvelope = clampText(payload.encryptedEnvelope, 180000);
    }
    if (payload.imageDataUrl !== undefined) {
      docData.imageDataUrl = clampText(payload.imageDataUrl, BLUEPRINT_LIMITS.IMAGE_DATAURL_MAX);
    }

    await setDoc(doc(db, 'documents', id), docData);

    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: payload.isEncrypted ? 'PUBLISH_E2EE_DOCUMENT' : 'PUBLISH_EDITORIAL_DOCUMENT',
      resource: path,
      severity: payload.isEncrypted ? 'warning' : 'info',
      details: `Documento "${payload.title}" (${payload.sourceFormat.toUpperCase()}) importado no Template Editorial.`,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateCorporateDocument(
  id: string,
  adminUser: User,
  updates: {
    title?: string;
    docCode?: string;
    category?: string;
    pointsReward?: number;
    extractedContent?: string;
    status?: 'published' | 'draft';
  }
): Promise<void> {
  const path = `documents/${id}`;
  try {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.title !== undefined) payload.title = clampText(updates.title, BLUEPRINT_LIMITS.DOC_TITLE_MAX);
    if (updates.docCode !== undefined) payload.docCode = clampText(updates.docCode, 40);
    if (updates.category !== undefined) payload.category = clampText(updates.category, 80);
    if (updates.pointsReward !== undefined) payload.pointsReward = Math.max(0, Math.min(1000, Math.round(updates.pointsReward)));
    if (updates.extractedContent !== undefined) payload.extractedContent = clampText(updates.extractedContent, BLUEPRINT_LIMITS.DOC_CONTENT_MAX);
    if (updates.status !== undefined) payload.status = updates.status;

    await updateDoc(doc(db, 'documents', id), payload);
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'UPDATE_DOCUMENT',
      resource: path,
      severity: 'info',
      details: `Documento "${updates.title || id}" atualizado no acervo.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCorporateDocument(id: string, adminUser: User): Promise<void> {
  const path = `documents/${id}`;
  try {
    await deleteDoc(doc(db, 'documents', id));
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'DELETE_DOCUMENT',
      resource: path,
      severity: 'warning',
      details: `Documento ${id} removido do acervo.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function publishBirthdayEntry(
  adminUser: User,
  payload: Omit<BirthdayEntry, 'id' | 'authorUid' | 'createdAt'>
): Promise<string> {
  const id = `bday_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `birthdays/${id}`;
  try {
    await setDoc(doc(db, 'birthdays', id), {
      name: clampText(payload.name, BLUEPRINT_LIMITS.NAME_MAX),
      roleTitle: clampText(payload.roleTitle, BLUEPRINT_LIMITS.ROLE_MAX),
      department: clampText(payload.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX),
      branch: clampText(payload.branch || 'Matriz C&R', 120),
      day: Math.max(1, Math.min(31, Math.round(payload.day))),
      month: Math.max(1, Math.min(12, Math.round(payload.month))),
      avatarUrl: clampText(payload.avatarUrl, BLUEPRINT_LIMITS.AVATAR_DATAURL_MAX),
      active: true,
      authorUid: adminUser.uid,
      createdAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateBirthdayEntry(
  id: string,
  adminUser: User,
  updates: Partial<Omit<BirthdayEntry, 'id' | 'authorUid' | 'createdAt'>>
): Promise<void> {
  const path = `birthdays/${id}`;
  try {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = clampText(updates.name, BLUEPRINT_LIMITS.NAME_MAX);
    if (updates.roleTitle !== undefined) payload.roleTitle = clampText(updates.roleTitle, BLUEPRINT_LIMITS.ROLE_MAX);
    if (updates.department !== undefined) payload.department = clampText(updates.department, BLUEPRINT_LIMITS.DEPARTMENT_MAX);
    if (updates.branch !== undefined) payload.branch = clampText(updates.branch, 120);
    if (updates.day !== undefined) payload.day = Math.max(1, Math.min(31, Math.round(updates.day)));
    if (updates.month !== undefined) payload.month = Math.max(1, Math.min(12, Math.round(updates.month)));
    if (updates.avatarUrl !== undefined) payload.avatarUrl = clampText(updates.avatarUrl, BLUEPRINT_LIMITS.AVATAR_DATAURL_MAX);
    if (updates.active !== undefined) payload.active = Boolean(updates.active);

    await updateDoc(doc(db, 'birthdays', id), payload);
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'UPDATE_BIRTHDAY',
      resource: path,
      severity: 'info',
      details: `Aniversariante "${updates.name || id}" atualizado.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteBirthdayEntry(id: string, adminUser: User): Promise<void> {
  const path = `birthdays/${id}`;
  try {
    await deleteDoc(doc(db, 'birthdays', id));
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'DELETE_BIRTHDAY',
      resource: path,
      severity: 'warning',
      details: `Registro de aniversariante ${id} removido.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function publishTrainingModule(
  adminUser: User,
  payload: Omit<TrainingModule, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const path = `trainings/${id}`;
  try {
    await setDoc(doc(db, 'trainings', id), {
      title: clampText(payload.title, BLUEPRINT_LIMITS.TITLE_MAX),
      track: clampText(payload.track, 80),
      durationMinutes: Math.max(1, Math.min(600, Math.round(payload.durationMinutes))),
      pointsReward: Math.max(0, Math.min(2000, Math.round(payload.pointsReward))),
      coverUrl: clampText(payload.coverUrl, BLUEPRINT_LIMITS.IMAGE_DATAURL_MAX),
      summary: clampText(payload.summary, 500),
      lessons: payload.lessons.slice(0, 20),
      quizQuestion: clampText(payload.quizQuestion, 300),
      quizOptions: payload.quizOptions.slice(0, 6),
      correctOptionIndex: payload.correctOptionIndex,
      badgeAwarded: clampText(payload.badgeAwarded, 80),
      status: payload.status,
      authorUid: adminUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'PUBLISH_TRAINING',
      resource: path,
      severity: 'info',
      details: `Treinamento "${payload.title}" criado na Academia C&R.`,
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateTrainingModule(
  id: string,
  adminUser: User,
  updates: Partial<Omit<TrainingModule, 'id' | 'authorUid' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  const path = `trainings/${id}`;
  try {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (updates.title !== undefined) payload.title = clampText(updates.title, BLUEPRINT_LIMITS.TITLE_MAX);
    if (updates.track !== undefined) payload.track = clampText(updates.track, 80);
    if (updates.durationMinutes !== undefined) payload.durationMinutes = Math.max(1, Math.min(600, Math.round(updates.durationMinutes)));
    if (updates.pointsReward !== undefined) payload.pointsReward = Math.max(0, Math.min(2000, Math.round(updates.pointsReward)));
    if (updates.coverUrl !== undefined) payload.coverUrl = clampText(updates.coverUrl, BLUEPRINT_LIMITS.IMAGE_DATAURL_MAX);
    if (updates.summary !== undefined) payload.summary = clampText(updates.summary, 500);
    if (updates.lessons !== undefined) payload.lessons = updates.lessons.slice(0, 20);
    if (updates.quizQuestion !== undefined) payload.quizQuestion = clampText(updates.quizQuestion, 300);
    if (updates.quizOptions !== undefined) payload.quizOptions = updates.quizOptions.slice(0, 6);
    if (updates.correctOptionIndex !== undefined) payload.correctOptionIndex = updates.correctOptionIndex;
    if (updates.badgeAwarded !== undefined) payload.badgeAwarded = clampText(updates.badgeAwarded, 80);
    if (updates.status !== undefined) payload.status = updates.status;

    await updateDoc(doc(db, 'trainings', id), payload);
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'UPDATE_TRAINING',
      resource: path,
      severity: 'info',
      details: `Treinamento "${updates.title || id}" atualizado na Academia C&R.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteTrainingModule(id: string, adminUser: User): Promise<void> {
  const path = `trainings/${id}`;
  try {
    await deleteDoc(doc(db, 'trainings', id));
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'DELETE_TRAINING',
      resource: path,
      severity: 'warning',
      details: `Módulo de treinamento ${id} removido da Academia C&R.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function grantAdminAccess(
  adminUser: User,
  collaborator: CollaboratorPublic
): Promise<void> {
  const path = `admins/${collaborator.uid}`;
  try {
    const privSnap = await getDoc(doc(db, 'users_private', collaborator.uid));
    const email = privSnap.exists()
      ? (privSnap.data() as UserPrivate).email
      : `${collaborator.uid}@cavalcanterolim.com.br`;

    await setDoc(doc(db, 'admins', collaborator.uid), {
      uid: collaborator.uid,
      email: clampText(email, 200),
      grantedBy: adminUser.uid,
      createdAt: serverTimestamp(),
    });

    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'GRANT_GESTOR_ROLE',
      resource: path,
      severity: 'warning',
      details: `Acesso ao Modo Gestor concedido para ${collaborator.displayName} (${email}).`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function revokeAdminAccess(adminUser: User, targetUid: string): Promise<void> {
  const path = `admins/${targetUid}`;
  try {
    await deleteDoc(doc(db, 'admins', targetUid));
    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'REVOKE_GESTOR_ROLE',
      resource: path,
      severity: 'warning',
      details: `Acesso ao Modo Gestor revogado para UID ${targetUid}.`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateBrandSettings(
  adminUser: User,
  settings: Omit<PortalBrandSettings, 'updatedByUid' | 'updatedAt'>
): Promise<void> {
  const path = 'portal_settings/brand';
  try {
    const payload: Record<string, unknown> = {
      heroHeadline: clampText(settings.heroHeadline, 140),
      heroSubheadline: clampText(settings.heroSubheadline, 280),
      updatedByUid: adminUser.uid,
      updatedAt: serverTimestamp(),
    };
    if (settings.logoDataUrl !== undefined) {
      payload.logoDataUrl = clampText(settings.logoDataUrl, BLUEPRINT_LIMITS.AVATAR_DATAURL_MAX);
    }
    if (settings.heroImageUrl !== undefined) {
      payload.heroImageUrl = clampText(settings.heroImageUrl, BLUEPRINT_LIMITS.IMAGE_DATAURL_MAX);
    }
    await setDoc(doc(db, 'portal_settings', 'brand'), payload);

    await recordAuditLog({
      actorUid: adminUser.uid,
      actorName: adminUser.displayName || 'Administrador',
      action: 'UPDATE_BRAND_IDENTITY',
      resource: path,
      severity: 'info',
      details: 'Identidade visual / logotipo / banner principal atualizados.',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS (ONLY CALLED WHEN AUTH IS READY & SIGNED IN)
// ============================================================================

export function subscribePortalBrand(cb: (settings: PortalBrandSettings | null) => void): () => void {
  const path = 'portal_settings/brand';
  return onSnapshot(
    doc(db, 'portal_settings', 'brand'),
    (snap) => {
      cb(snap.exists() ? (snap.data() as PortalBrandSettings) : null);
    },
    (error) => handleFirestoreError(error, OperationType.GET, path)
  );
}

function getTimestampMillis(ts: unknown): number {
  if (!ts || typeof ts !== 'object') return 0;
  const maybe = ts as { toMillis?: () => number; seconds?: number };
  if (typeof maybe.toMillis === 'function') return maybe.toMillis();
  if (typeof maybe.seconds === 'number') return maybe.seconds * 1000;
  return 0;
}

export function subscribeAnnouncements(
  canSeeDrafts: boolean,
  cb: (items: Announcement[]) => void
): () => void {
  const path = 'announcements';
  const q = canSeeDrafts
    ? query(collection(db, path), orderBy('createdAt', 'desc'), limit(50))
    : query(collection(db, path), where('status', '==', 'published'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, 'id'>) }));
      list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      cb(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeTrainings(
  canSeeDrafts: boolean,
  cb: (items: TrainingModule[]) => void
): () => void {
  const path = 'trainings';
  const q = canSeeDrafts
    ? query(collection(db, path), orderBy('createdAt', 'desc'), limit(40))
    : query(collection(db, path), where('status', '==', 'published'), limit(40));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TrainingModule, 'id'>) }));
      list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      cb(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeDocuments(
  canSeeDrafts: boolean,
  cb: (items: CorporateDocument[]) => void
): () => void {
  const path = 'documents';
  const q = canSeeDrafts
    ? query(collection(db, path), orderBy('createdAt', 'desc'), limit(50))
    : query(collection(db, path), where('status', '==', 'published'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CorporateDocument, 'id'>),
      }));
      list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      cb(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeBirthdays(cb: (items: BirthdayEntry[]) => void): () => void {
  const path = 'birthdays';
  const q = query(collection(db, path), where('active', '==', true), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BirthdayEntry, 'id'>) }));
      list.sort((a, b) => a.day - b.day);
      cb(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeBadgeDefinitions(
  canSeeInactive: boolean,
  cb: (items: BadgeDefinition[]) => void
): () => void {
  const path = 'badge_definitions';
  const q = canSeeInactive
    ? query(collection(db, path), limit(40))
    : query(collection(db, path), where('active', '==', true), limit(40));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BadgeDefinition, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeCollaboratorsLeaderboard(
  cb: (items: CollaboratorPublic[]) => void
): () => void {
  const path = 'collaborators';
  const q = query(collection(db, path), where('isActive', '==', true), limit(100));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as CollaboratorPublic);
      list.sort((a, b) => b.points - a.points);
      cb(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeUserActivities(
  uid: string,
  cb: (items: ActivityCompletion[]) => void
): () => void {
  const path = 'activities';
  const q = query(collection(db, path), where('userId', '==', uid), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ActivityCompletion, 'id'>),
      }));
      list.sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
      cb(list);
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAllActivitiesForAdmin(
  cb: (items: ActivityCompletion[]) => void
): () => void {
  const path = 'activities';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(250));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ActivityCompletion, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAdminAuditLogs(cb: (items: AuditLog[]) => void): () => void {
  const path = 'audit_logs';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(150));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AuditLog, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export function subscribeAdminAlerts(cb: (items: CriticalAlert[]) => void): () => void {
  const path = 'alerts';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CriticalAlert, 'id'>) })));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}

export interface AdminDirectoryEntry {
  uid: string;
  email: string;
  grantedBy: string;
}

export function subscribeAdminRecords(cb: (items: AdminDirectoryEntry[]) => void): () => void {
  const path = 'admins';
  const q = query(collection(db, path), limit(50));
  return onSnapshot(
    q,
    (snap) => {
      cb(snap.docs.map((d) => d.data() as AdminDirectoryEntry));
    },
    (error) => handleFirestoreError(error, OperationType.LIST, path)
  );
}
