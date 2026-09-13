import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * Password hashing.
 *
 * scrypt from Node's standard library rather than a dependency. It is memory-
 * hard, it is what the schema has always documented, and it removes a package
 * from the trust boundary of the one thing in this application that must not
 * be got wrong.
 *
 * Stored as "salt:key", both hex. The salt is per-password, so two people with
 * the same password do not share a hash.
 *
 * No "server-only" marker, unlike the rest of lib/auth: the setup script runs
 * this outside Next to create the first account, and it must produce byte-for-
 * byte the same format the application verifies. Importing node:crypto already
 * makes a client bundle impossible, which is what the marker would be for.
 */

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const key = await scrypt(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

/**
 * Always compares in constant time, and always does the full scrypt work even
 * when the stored hash is malformed — an early return on a bad record would
 * make "this account exists but is broken" measurably faster than a real
 * mismatch.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, keyHex] = stored.split(":");
  const saltOk = Boolean(saltHex) && /^[0-9a-f]+$/i.test(saltHex ?? "");
  const keyOk = Boolean(keyHex) && /^[0-9a-f]+$/i.test(keyHex ?? "");

  const salt = saltOk ? Buffer.from(saltHex!, "hex") : randomBytes(SALT_LENGTH);
  const expected =
    keyOk && Buffer.from(keyHex!, "hex").length === KEY_LENGTH
      ? Buffer.from(keyHex!, "hex")
      : randomBytes(KEY_LENGTH);

  const actual = await scrypt(password, salt, KEY_LENGTH);
  const match = timingSafeEqual(actual, expected);
  return saltOk && keyOk && match;
}

/**
 * Burns the same work as a real verification against nothing.
 *
 * Called when no account matches the submitted email, so a request for an
 * address that does not exist costs the same as one that does. Without it the
 * response time alone enumerates accounts.
 */
export async function fakeVerify(password: string): Promise<void> {
  await scrypt(password, randomBytes(SALT_LENGTH), KEY_LENGTH);
}
