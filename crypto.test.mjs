import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { seal, unseal } from './crypto.mjs';

test('encrypted artifact decrypts exactly and rejects tampering', () => {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const plaintext = Buffer.from('course result and exact receipt');
  const envelope = seal(plaintext, publicKey);
  assert.deepEqual(unseal(envelope, privateKey), plaintext);
  assert.ok(!JSON.stringify(envelope).includes(plaintext.toString()));
  const bytes = Buffer.from(envelope.data, 'base64'); bytes[0] ^= 1;
  assert.throws(() => unseal({ ...envelope, data: bytes.toString('base64') }, privateKey));
});
