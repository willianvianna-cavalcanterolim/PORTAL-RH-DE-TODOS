/**
 * Motor de Criptografia de Ponta a Ponta (E2EE) & Integridade Criptográfica
 * Utiliza Web Crypto API nativa (AES-GCM 256 bits + PBKDF2 SHA-256).
 * Todos os dados sensíveis são cifrados no navegador antes da persistência no Firestore.
 */

export interface EncryptedEnvelope {
  alg: 'AES-GCM-256';
  kdf: 'PBKDF2-SHA256';
  iterations: number;
  iv: string;
  salt: string;
  ciphertext: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(passphrase: string, salt: Uint8Array, iterations: number): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSensitiveText(plaintext: string, passphrase: string): Promise<string> {
  if (!passphrase || passphrase.trim().length < 4) {
    throw new Error('A chave criptográfica deve possuir ao menos 4 caracteres.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = 100_000;
  const key = await deriveAesKey(passphrase.trim(), salt, iterations);

  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoded
  );

  const envelope: EncryptedEnvelope = {
    alg: 'AES-GCM-256',
    kdf: 'PBKDF2-SHA256',
    iterations,
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer)),
  };

  return JSON.stringify(envelope);
}

export async function decryptSensitiveText(envelopeJson: string, passphrase: string): Promise<string> {
  if (!passphrase || passphrase.trim().length < 4) {
    throw new Error('Informe a chave criptográfica para decifrar.');
  }

  let envelope: EncryptedEnvelope;
  try {
    envelope = JSON.parse(envelopeJson) as EncryptedEnvelope;
  } catch {
    throw new Error('Envelope criptográfico inválido.');
  }

  if (envelope.alg !== 'AES-GCM-256' || !envelope.iv || !envelope.salt || !envelope.ciphertext) {
    throw new Error('Formato de criptografia não suportado.');
  }

  const salt = base64ToBytes(envelope.salt);
  const iv = base64ToBytes(envelope.iv);
  const ciphertext = base64ToBytes(envelope.ciphertext);
  const key = await deriveAesKey(passphrase.trim(), salt, envelope.iterations || 100_000);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );
    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    throw new Error('Chave criptográfica incorreta ou dados adulterados.');
  }
}

export async function computeSha256Hash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
