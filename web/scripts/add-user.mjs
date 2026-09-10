/**
 * Creates or resets an admin user straight from the CLI. This is the way back
 * in if you're ever locked out of /admin.
 *
 *   npm run user:add -- "you@example.com" "a-long-password" admin
 *
 * Re-running with an existing email resets that user's password, re-activates
 * them, and applies the role.
 */
import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import { users } from "../src/db/schema.ts";

const scryptAsync = promisify(scrypt);

const [email, password, role = "admin"] = process.argv.slice(2);

if (!email || !password) {
  console.error('Usage: npm run user:add -- "email@example.com" "password" [admin|editor]');
  process.exit(1);
}
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}
if (!["admin", "editor"].includes(role)) {
  console.error(`Role must be "admin" or "editor" (got "${role}").`);
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const key = await scryptAsync(password, salt, 64);
const passwordHash = `${salt}:${key.toString("hex")}`;
const normalized = email.trim().toLowerCase();

const [existing] = await db.select().from(users).where(eq(users.email, normalized)).limit(1);

if (existing) {
  await db.update(users)
    .set({ passwordHash, role, active: true, updatedAt: new Date() })
    .where(eq(users.id, existing.id));
  console.log(`reset password for ${normalized} (role: ${role}, re-activated)`);
} else {
  await db.insert(users).values({ email: normalized, name: "", passwordHash, role, active: true });
  console.log(`created ${normalized} (role: ${role})`);
}
process.exit(0);
