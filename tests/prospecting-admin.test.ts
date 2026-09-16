import assert from "node:assert/strict";
import test from "node:test";
import { roleHas } from "../src/lib/auth/capabilities.ts";
import { rerunAuditForUser, requestAuditForUser } from "../src/lib/prospecting/admin.ts";

const publicResolver = async () => [{ address: "93.184.216.34", family: 4 as const }];
const admin = async () => ({ ok: true as const, user: { id: 4, email: "admin@example.com" } });

test("prospecting capability is limited to administrators", () => {
  assert.equal(roleHas("admin", "prospecting.manage"), true);
  assert.equal(roleHas("editor", "prospecting.manage"), false);
  assert.equal(roleHas("unknown", "prospecting.manage"), false);
});

test("an unauthenticated request returns the existing session error and starts nothing", async () => {
  const calls: string[] = [];
  const result = await requestAuditForUser(new FormData(), {
    authorize: async () => ({ ok: false as const, error: "Your session has expired. Sign in again." }),
    createAuditRequest: async () => {
      calls.push("create");
      return { id: 1 };
    },
    startAudit: () => {
      calls.push("start");
    },
    saveFailure: async () => calls.push("failure"),
    resolveHost: publicResolver,
  });

  assert.deepEqual(result, { status: "error", message: "Your session has expired. Sign in again." });
  assert.deepEqual(calls, []);
});

test("invalid URLs return a field error before a queued row is created", async () => {
  const calls: string[] = [];
  const form = new FormData();
  form.set("url", "http://127.0.0.1/private");
  const result = await requestAuditForUser(form, {
    authorize: admin,
    createAuditRequest: async () => {
      calls.push("create");
      return { id: 1 };
    },
    startAudit: () => {
      calls.push("start");
    },
    saveFailure: async () => calls.push("failure"),
    resolveHost: publicResolver,
  });

  assert.equal(result.status, "error");
  assert.equal(result.field, "url");
  assert.deepEqual(calls, []);
});

test("a valid request creates a queued audit and starts the job in process", async () => {
  const calls: string[] = [];
  const form = new FormData();
  form.set("url", "https://example.com/#contact");
  const result = await requestAuditForUser(form, {
    authorize: admin,
    createAuditRequest: async (input) => {
      calls.push(`create:${input.requestedUrl}`);
      return { id: 42 };
    },
    startAudit: (input) => {
      calls.push(`start:${input.auditId}:${input.requestedUrl}`);
    },
    saveFailure: async () => calls.push("failure"),
    resolveHost: publicResolver,
  });

  assert.deepEqual(result, { status: "queued", id: 42, redirectTo: "/admin/prospecting/audits/42" });
  assert.deepEqual(calls, ["create:https://example.com/", "start:42:https://example.com/"]);
});

test("a scheduling failure marks the new row failed rather than leaving it queued", async () => {
  const calls: string[] = [];
  const form = new FormData();
  form.set("url", "https://example.com/");
  const result = await requestAuditForUser(form, {
    authorize: admin,
    createAuditRequest: async () => ({ id: 7 }),
    startAudit: () => {
      throw new Error("after() was called outside a request scope");
    },
    saveFailure: async (id, detail) => calls.push(`failure:${id}:${detail}`),
    resolveHost: publicResolver,
  });

  assert.deepEqual(result, { status: "error", message: "The audit could not be started. Try again." });
  assert.deepEqual(calls, ["failure:7:after() was called outside a request scope"]);
});

test("re-running a stuck audit fails the old row and starts a fresh one for the same URL", async () => {
  const calls: string[] = [];
  const result = await rerunAuditForUser(8, {
    authorize: admin,
    loadAudit: async (id) => ({ id, requestedUrl: "https://example.com/", status: "running" as const, prospectId: 31 }),
    saveFailure: async (id, detail) => calls.push(`failure:${id}:${detail}`),
    createAuditRequest: async (input) => {
      calls.push(`create:${input.requestedUrl}:${input.requestedBy}:${input.prospectId}`);
      return { id: 11 };
    },
    startAudit: (input) => {
      calls.push(`start:${input.auditId}`);
    },
    resolveHost: publicResolver,
  });

  assert.deepEqual(result, { status: "queued", id: 11, redirectTo: "/admin/prospecting/audits/11" });
  // The replacement inherits prospect 31: an orphaned re-run would never show
  // up in that prospect's audit history and the drain would discard its result.
  assert.deepEqual(calls, [
    "failure:8:Superseded by a re-run.",
    "create:https://example.com/:4:31",
    "start:11",
  ]);
});

test("a re-run of an audit that belongs to no prospect stays unattached", async () => {
  const seen: (number | null | undefined)[] = [];
  await rerunAuditForUser(8, {
    authorize: admin,
    loadAudit: async (id) => ({ id, requestedUrl: "https://example.com/", status: "running" as const, prospectId: null }),
    saveFailure: async () => undefined,
    createAuditRequest: async (input) => {
      seen.push(input.prospectId);
      return { id: 11 };
    },
    startAudit: () => undefined,
    resolveHost: publicResolver,
  });

  assert.deepEqual(seen, [null]);
});

test("a manually requested audit is created with no prospect attached", async () => {
  const seen: (number | null | undefined)[] = [];
  const form = new FormData();
  form.set("url", "https://example.com/");
  await requestAuditForUser(form, {
    authorize: admin,
    createAuditRequest: async (input) => {
      seen.push(input.prospectId);
      return { id: 42 };
    },
    startAudit: () => undefined,
    saveFailure: async () => undefined,
    resolveHost: publicResolver,
  });

  assert.deepEqual(seen, [null]);
});

test("re-running refuses an audit that already reached a terminal state", async () => {
  const calls: string[] = [];
  for (const status of ["completed", "partial", "failed"] as const) {
    const result = await rerunAuditForUser(8, {
      authorize: admin,
      loadAudit: async (id) => ({ id, requestedUrl: "https://example.com/", status, prospectId: null }),
      saveFailure: async () => calls.push("failure"),
      createAuditRequest: async () => {
        calls.push("create");
        return { id: 11 };
      },
      startAudit: () => {
      calls.push("start");
    },
      resolveHost: publicResolver,
    });
    assert.deepEqual(result, {
      status: "error",
      message: "This audit has already finished. Request a new audit instead.",
    });
  }
  assert.deepEqual(calls, []);
});

test("re-running refuses an unknown audit and an unauthorised caller", async () => {
  const missing = await rerunAuditForUser(8, {
    authorize: admin,
    loadAudit: async () => null,
    saveFailure: async () => undefined,
    createAuditRequest: async () => ({ id: 11 }),
    startAudit: () => undefined,
    resolveHost: publicResolver,
  });
  assert.deepEqual(missing, { status: "error", message: "That audit no longer exists." });

  const calls: string[] = [];
  const denied = await rerunAuditForUser(8, {
    authorize: async () => ({ ok: false as const, error: "Your session has expired. Sign in again." }),
    loadAudit: async () => {
      calls.push("load");
      return { id: 8, requestedUrl: "https://example.com/", status: "running" as const, prospectId: null };
    },
    saveFailure: async () => undefined,
    createAuditRequest: async () => ({ id: 11 }),
    startAudit: () => undefined,
    resolveHost: publicResolver,
  });
  assert.deepEqual(denied, { status: "error", message: "Your session has expired. Sign in again." });
  assert.deepEqual(calls, []);
});

test("re-running revalidates the stored URL before it starts a new job", async () => {
  const calls: string[] = [];
  const result = await rerunAuditForUser(8, {
    authorize: admin,
    loadAudit: async (id) => ({ id, requestedUrl: "https://example.com/", status: "queued" as const, prospectId: null }),
    saveFailure: async () => calls.push("failure"),
    createAuditRequest: async () => {
      calls.push("create");
      return { id: 11 };
    },
    startAudit: () => {
      calls.push("start");
    },
    // The host now resolves to a private address, so the re-run must not run.
    resolveHost: async () => [{ address: "127.0.0.1", family: 4 as const }],
  });

  assert.deepEqual(result, {
    status: "error",
    message: "That URL is no longer a safe public address to audit.",
  });
  assert.deepEqual(calls, []);
});
