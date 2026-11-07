import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { seal } from './crypto.mjs';

const files = {};
for (const name of await readdir('output').catch(error => { if (error.code === 'ENOENT') return []; throw error; })) {
  if (!['transcript.jsonl', 'result.json', 'skill.json'].includes(name)) throw new Error('Unexpected output file');
  files[name] = (await readFile(`output/${name}`)).toString('base64');
}
if (!Object.keys(files).length) { console.log('No worker output to encrypt.'); process.exit(0); }
const publicKey = await readFile('result-public-key.pem', 'utf8');
const envelope = seal(Buffer.from(JSON.stringify({ files })), publicKey);
await mkdir('sealed-output', { recursive: true });
await writeFile('sealed-output/result.encrypted.json', JSON.stringify(envelope));
console.log('Encrypted worker output for the local key holder.');
