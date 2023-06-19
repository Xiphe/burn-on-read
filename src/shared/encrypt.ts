import { KMS } from 'aws-sdk';
import { ok } from 'node:assert';

const kms = new KMS();

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

  const result = await kms
    .encrypt({
      KeyId: SERVER_ENCRYPTION_KEY!,
      Plaintext: data,
    })
    .promise();

  if (!result.CiphertextBlob) {
    throw new Error('Failed to encrypt data');
  }

  return result.CiphertextBlob.toString('base64');
}

export async function decrypt(data: string) {
  if (ARC_ENV === 'testing') {
    return Buffer.from(data.replace(/ \(encrypted\)$/, ''), 'base64');
  }

  const result = await kms
    .decrypt({ CiphertextBlob: Buffer.from(data, 'base64') })
    .promise();

  if (!result.Plaintext) {
    throw new Error('Failed to decode data');
  }

  return result.Plaintext.toString('base64');
}
