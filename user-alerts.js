import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { initCardifyAuthPersistence } from "./cardify-auth-persistence.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const cfg = window.__CARDIFY_FIREBASE_CONFIG__;
if (!cfg) {
  /* skip */
} else {
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const auth = getAuth(app);
  const cardifyAuthReady = initCardifyAuthPersistence(auth).catch((e) => {
    console.warn("auth persistence", e);
  });
  const db = getFirestore(app);

  let unsubAlerts = null;
  let currentShownId = null;

  function el(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text != null) n.textContent = text;
    return n;
  }

  function removeOverlay() {
    const o = document.getElementById("cardifyUserAlertOverlay");
    if (o) o.remove();
  }

  function showAlertModal(alertId, message) {
    if (currentShownId === alertId) return;
    currentShownId = alertId;
    removeOverlay();
    const lang = localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
    const title =
      lang === "fr" ? "Message de Cardify" : "Message from Cardify";
    const ok = lang === "fr" ? "J’ai compris" : "OK";
    const backdrop = el("div", "user-alert-overlay");
    backdrop.id = "cardifyUserAlertOverlay";
    const panel = el("div", "user-alert-dialog");
    panel.setAttribute("role", "alertdialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", title);
    const h2 = el("h2", "user-alert-title", title);
    const p = el("p", "user-alert-body", message);
    const btn = el("button", "primary-btn user-alert-ok", ok);
    btn.type = "button";
    panel.append(h2, p, btn);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    const dismiss = () => {
      currentShownId = null;
      removeOverlay();
    };
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      try {
        await updateDoc(doc(db, "alerts", alertId), { read: true });
      } catch {
        /* still close UI */
      }
      dismiss();
      btn.disabled = false;
    });
  }

  function ensureAlertListener(user) {
    if (unsubAlerts) {
      unsubAlerts();
      unsubAlerts = null;
    }
    if (!user) {
      currentShownId = null;
      removeOverlay();
      return;
    }
    const q = query(
      collection(db, "alerts"),
      where("userId", "==", user.uid),
      where("read", "==", false),
      orderBy("createdAt", "desc"),
      limit(3)
    );
    unsubAlerts = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          if (!document.getElementById("cardifyUserAlertOverlay")) {
            currentShownId = null;
          }
          return;
        }
        const first = snap.docs[0];
        const m = (first.data().message || "").trim();
        if (m) showAlertModal(first.id, m);
      },
      (err) => {
        console.warn("alerts listen:", err);
      }
    );
  }

  void cardifyAuthReady.then(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      ensureAlertListener(null);
      return;
    }
    try {
      const udoc = await getDoc(doc(db, "users", user.uid));
      if (udoc.exists() && udoc.data() && udoc.data().banned === true) {
        await signOut(auth);
        window.location.replace("./index.html?banned=1");
        return;
      }
    } catch {
      /* ignore */
    }
    ensureAlertListener(user);
  });
  });
}
