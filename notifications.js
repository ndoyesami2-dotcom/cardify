import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { initCardifyAuthPersistence } from "./cardify-auth-persistence.js";
import {
  getFirestore,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const cfg = window.__CARDIFY_FIREBASE_CONFIG__;
const mount = document.getElementById("notificationsMount");
const lang = localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
const T = {
  en: {
    title: "Notifications",
    hint: "Messages from Cardify appear here.",
    back: "← Back to shop",
    empty: "No notifications yet.",
    signIn: "Sign in to view notifications.",
    markRead: "Mark as read",
    read: "Read"
  },
  fr: {
    title: "Notifications",
    hint: "Les messages de Cardify apparaissent ici.",
    back: "← Retour à la boutique",
    empty: "Aucune notification pour le moment.",
    signIn: "Connectez-vous pour voir les notifications.",
    markRead: "Marquer comme lu",
    read: "Lu"
  }
};

function tr(key) {
  return (T[lang] && T[lang][key]) || T.en[key] || key;
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

document.documentElement.lang = lang;
document.title = `${tr("title")} — Cardify`;
document.getElementById("notificationsTitle").textContent = tr("title");
document.getElementById("notificationsHint").textContent = tr("hint");
document.getElementById("notificationsBack").textContent = tr("back");

if (!cfg) {
  if (mount) mount.innerHTML = `<p class="account-empty">${tr("empty")}</p>`;
} else {
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const ready = initCardifyAuthPersistence(auth).catch((e) => console.warn("auth persistence", e));

  void ready.then(() => {
    onAuthStateChanged(auth, (user) => {
      if (!mount) return;
      if (!user) {
        mount.innerHTML = `<p class="account-empty">${tr("signIn")}</p>`;
        return;
      }
      const q = query(
        collection(db, "alerts"),
        where("userId", "==", user.uid),
        limit(50)
      );
      onSnapshot(
        q,
        (snap) => {
          if (snap.empty) {
            mount.innerHTML = `<p class="account-empty">${tr("empty")}</p>`;
            return;
          }
          const docs = [];
          snap.forEach((d) => docs.push(d));
          docs.sort((a, b) => {
            const at = a.data()?.createdAt?.toMillis ? a.data().createdAt.toMillis() : 0;
            const bt = b.data()?.createdAt?.toMillis ? b.data().createdAt.toMillis() : 0;
            return bt - at;
          });
          const rows = [];
          docs.forEach((d) => {
            const data = d.data() || {};
            const when = data.createdAt?.toDate ? data.createdAt.toDate().toLocaleString() : "";
            rows.push(`<article class="account-row notification-row ${data.read ? "is-read" : ""}">
  <div class="account-row-text">
    <span class="account-row-title">${esc(data.message || "")} <span class="notification-source">- Cardify</span></span>
    <span class="account-row-meta">${esc(when)}${data.read ? " · " + esc(tr("read")) : ""}</span>
  </div>
  ${
    data.read
      ? ""
      : `<button type="button" class="text-link-btn" data-alert-read="${esc(d.id)}">${esc(tr("markRead"))}</button>`
  }
</article>`);
          });
          mount.innerHTML = rows.join("");
          mount.querySelectorAll("[data-alert-read]").forEach((btn) => {
            btn.addEventListener("click", async () => {
              btn.disabled = true;
              try {
                await updateDoc(doc(db, "alerts", btn.getAttribute("data-alert-read")), { read: true });
              } catch (e) {
                console.warn("mark alert read", e);
                btn.disabled = false;
              }
            });
          });
        },
        (e) => {
          console.warn("notifications", e);
          mount.innerHTML = `<p class="account-empty">${esc((e && e.code) || tr("empty"))}</p>`;
        }
      );
    });
  });
}
