/**
 * Generates an ADMIN_PASSWORD_HASH for .env
 *   npm run hash -- "your-password"
 *
 * Wrapped in main() rather than using top-level await: this package is CJS,
 * so tsx cannot transform a top-level await here.
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: npm run hash -- "your-password"');
    process.exit(1);
  }
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, 64);
  console.log(`\nADMIN_PASSWORD_HASH="${salt}:${key.toString("hex")}"\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
