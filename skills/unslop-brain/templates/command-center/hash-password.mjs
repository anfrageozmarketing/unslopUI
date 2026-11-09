// Usage: node hash-password.mjs <name>
// Reads the password from the CC_PASSWORD env var or, if unset, from the first line of stdin.
// Prints "name=salt.hash" for CC_USERS. Do not type the password as a command-line argument.
import crypto from 'node:crypto';
import readline from 'node:readline';

const name = process.argv[2];
if (!name || !/^[A-Za-z0-9_.-]+$/.test(name)) {
  console.error('Usage: node hash-password.mjs <name>   (letters, digits, _ . -)');
  process.exit(1);
}
async function password() {
  if (process.env.CC_PASSWORD) return process.env.CC_PASSWORD;
  const rl = readline.createInterface({ input: process.stdin });
  for await (const line of rl) { rl.close(); return line; }
  return '';
}
const pw = await password();
if (pw.length < 12) { console.error('Password must have at least 12 characters.'); process.exit(1); }
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(pw, salt, 32);
console.log(`${name}=${salt.toString('hex')}.${hash.toString('hex')}`);
