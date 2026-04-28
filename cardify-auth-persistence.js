import { setPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/**
 * Session-scoped auth: each browser tab keeps its own sign-in (not shared with other tabs).
 * Sign-in still survives a refresh in the same tab. Closing the tab ends the session.
 */
export function initCardifyAuthPersistence(auth) {
  return setPersistence(auth, browserSessionPersistence);
}
