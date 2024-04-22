import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';
import { ok } from 'node:assert';

const kms = new KMSClient();

const ARC_ENV = process.env.ARC_ENV;
ok(ARC_ENV, 'Missing ARC_ENV');

const SERVER_ENCRYPTION_KEY = process.env.SERVER_ENCRYPTION_KEY;

ok(
  ARC_ENV === 'testing' || SERVER_ENCRYPTION_KEY,
  'Missing SERVER_ENCRYPTION_KEY',
);

export async function encrypt(data: Buffer) {
  if (ARC_ENV === 'testing') {
    return data.toString('base64') + ' (encrypted)';
  }

  const command = new EncryptCommand({
    KeyId: SERVER_ENCRYPTION_KEY!,
    Plaintext: Uint8Array.from(data),
  });
  const response = await kms.send(command);

  if (!response.CiphertextBlob) {
    throw new Error('Failed to encrypt data');
  }

  return Buffer.from(response.CiphertextBlob).toString('base64');
}

export async function decrypt(data: string) {
  if (ARC_ENV === 'testing') {
    return Buffer.from(data.replace(/ \(encrypted\)$/, ''), 'base64');
  }

  const command = new DecryptCommand({
    CiphertextBlob: Uint8Array.from(Buffer.from(data, 'base64')),
  });

  const response = await kms.send(command);

  if (!response.Plaintext) {
    throw new Error('Failed to decode data');
  }

  return Buffer.from(response.Plaintext).toString('base64');
}
