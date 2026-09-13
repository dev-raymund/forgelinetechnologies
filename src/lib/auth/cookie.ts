/**
 * The session cookie's name, and nothing else.
 *
 * Separate from session.ts because middleware runs on the edge and cannot
 * import a module marked "server-only" — importing the whole session module
 * there would pull node:crypto and the database driver into the edge bundle.
 */
export const SESSION_COOKIE = "forgeline_session";
