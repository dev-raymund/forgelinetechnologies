/**
 * Creates or updates an admin account.
 *
 *   ADMIN_EMAIL=you@example.com npm run admin:create
 *
 * No password in this file, in the repository, or in the arguments. Supply
 * ADMIN_PASSWORD or let the script generate one and print it once — argv is
 * visible to every process on the machine and lands in shell history, which is
 * a poor place for a credential that opens the dashboard.
 *
 * Re-running for an existing address resets that account's password rather
 * than failing, which is the recovery path when someone is locked out.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db/index.ts";
import { users } from "../src/db/schema.ts";
import { hashPassword } from "../src/lib/auth/password.ts";

const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const name = (process.env.ADMIN_NAME ?? "").trim();
const role = (process.env.ADMIN_ROLE ?? "admin").trim();

if (!email || !email.includes("@")) {
  console.error("ADMIN_EMAIL is required, e.g.\n  ADMIN_EMAIL=you@example.com npm run admin:create");
  process.exit(1);
}
if (role !== "admin" && role !== "editor") {
  console.error(`ADMIN_ROLE must be "admin" or "editor", got "${role}"`);
  process.exit(1);
}

const supplied = process.env.ADMIN_PASSWORD;
if (supplied && supplied.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}
// base64url of 18 bytes — 24 characters, no ambiguity about shell quoting.
const password = supplied ?? randomBytes(18).toString("base64url");

const db = getDb();
const passwordHash = await hashPassword(password);
const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);

if (existing) {
  await db
    .update(users)
    .set({ passwordHash, role, active: true, updatedAt: new Date(), ...(name ? { name } : {}) })
    .where(eq(users.id, existing.id));
  console.log(`\n  Updated ${email} (id ${existing.id}) — role ${role}, active.`);
} else {
  const [created] = await db
    .insert(users)
    .values({ email, name: name || email.split("@")[0]!, passwordHash, role, active: true })
    .returning({ id: users.id });
  console.log(`\n  Created ${email} (id ${created!.id}) — role ${role}.`);
}

if (supplied) {
  console.log("  Password: the value you supplied in ADMIN_PASSWORD.\n");
} else {
  console.log(`  Password: ${password}`);
  console.log("  Shown once and not stored anywhere. Save it now.\n");
}
