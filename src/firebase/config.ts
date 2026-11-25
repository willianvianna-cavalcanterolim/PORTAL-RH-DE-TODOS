import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage, type MessagePayload } from 'firebase/messaging';
import firebaseConfig from '../../firebase-applet-config.json';

/**
 * Arquitetura Firebase — Cavalcante & Rolim | Signature Spaces
 * Inicializa Auth (Google Sign-In), Firestore Enterprise Edition (databaseId explícito)
 * e Firebase Cloud Messaging (FCM) para notificações push corporativas.
 */
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Verifique sua configuração do Firebase: cliente offline.');
      return false;
    }
    return true;
  }
}

void testConnection();

export interface PushInitResult {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  token: string | null;
}

export async function initializePushNotifications(
  onForegroundMessage?: (payload: MessagePayload) => void
): Promise<PushInitResult> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'unsupported', token: null };
  }

  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    return { supported: true, permission, token: null };
  }

  try {
    const fcmSupported = await isSupported();
    if (!fcmSupported) {
      return { supported: true, permission, token: null };
    }

    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js').catch(() => null);
    }

    const messaging = getMessaging(app);
    if (onForegroundMessage) {
      onMessage(messaging, onForegroundMessage);
    }

    let token: string | null = null;
    try {
      const registration =
        'serviceWorker' in navigator ? await navigator.serviceWorker.ready : undefined;
      token = await getToken(messaging, {
        serviceWorkerRegistration: registration,
      });
    } catch {
      // VAPID key or SW registration may be restricted inside sandboxed iframes;
      // local Notification API remains active for real-time desktop alerts.
      token = null;
    }

    return { supported: true, permission, token };
  } catch {
    return { supported: true, permission, token: null };
  }
}

export function triggerLocalPushNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    new Notification(title, { body, tag: 'cr-portal-alert' });
  } catch {
    // Ignored when browser blocks direct Notification constructor in favor of SW
  }
}
