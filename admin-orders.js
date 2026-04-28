import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { initCardifyAuthPersistence } from "./cardify-auth-persistence.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  where,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  deleteField,
  documentId
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
const CARDIFY_ADMIN_EMAILS = new Set(["ndoyesami2@gmail.com".toLowerCase()]);

const T = {
  en: {
    back: "← Back to shop",
    title: "Admin",
    pleaseWait: "Checking sign-in…",
    signOut: "Sign out",
    denied: "This account is not in the admin list. Update isCardifyAdmin in firestore.rules and CARDIFY_ADMIN_EMAILS in admin-orders.js.",
    listIntro: "Customer orders (signed-in checkouts) and everyone who registered on the shop—admin accounts are not listed under Shop accounts.",
    pendingTitle: "Orders to confirm",
    pendingSub:
      "Only orders with confirmed payment, placed while signed in to the shop (linked to a user). Unpaid, pending, or guest checkouts are not shown here.",
    noPending: "No pending shop orders, or no signed-in orders yet.",
    usersTitle: "Shop accounts",
    usersSub:
      "People who created an account on the main website (the shop), not the admin sign-in. Your admin user is hidden from this list.",
    confirm: "Confirm",
    noUsers: "No user profiles in Firestore yet.",
    noShopUsers: "No shop customers to show. If only the admin has a profile, they are hidden from this list.",
    name: "Name",
    phone: "Phone",
    method: "Payment",
    total: "Total",
    orderOn: "Created",
    statusPending: "Pending",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    ban: "Ban",
    unban: "Unban",
    alert: "Alert",
    info: "See info",
    alertTitle: "Send message to user",
    alertBody: "Message (shown in the center of the user’s screen when they use the shop)",
    sendAlert: "Send",
    close: "Close",
    infoTitle: "User details",
    username: "Username",
    fullName: "Full name",
    email: "Email",
    language: "Language",
    uid: "User ID",
    banned: "Banned",
    orderHistory: "Order history (Firestore)",
    supportBtn: "Support",
    supportTitle: "Customer support",
    supportHint: "Messages sent from the account page (Support). Newest first.",
    supportEmpty: "No support messages yet.",
    supportLoadError: "Could not load support requests.",
    searchPlaceholder: "Search by name, email, or user id…",
    searchLabel: "Search accounts",
    searchNoMatch: "No accounts match your search.",
    supportListHint: "Open or queued: accept to chat. Active: open chat. New requests show a red alert on the Support button.",
    supportAccept: "Accept & chat",
    supportOpenChat: "Open chat",
    supportChatTitle: "Support chat",
    supportTypeReply: "Type a reply…",
    supportSend: "Send",
    updateModeTitle: "Update mode (maintenance screen)",
    updateModeHint: "When on, the shop and sign-in pages show a full-screen “under update” message. Turn off to restore the site. Visitors can use the passcode to browse.",
    updateModeOn: "Update mode is on",
    updateModeOff: "Update mode is off",
    updateModeError: "Could not save. Check you are the admin and Firestore rules for config are deployed.",
    activityTitle: "Activity feed (shop hub)",
    activityHint:
      "New posts appear on the home page activity section. The main file is the card (image, PDF, or other). You must be signed in as admin; Storage and Firestore rules must allow your email.",
    activityListTitle: "Current posts",
    activityListEmpty: "No posts yet. Publish one above — it will show on the home page after a few seconds.",
    actTitle: "Title",
    actDescription: "Description (shown in detail view)",
    actMainFile: "Main file (image or any file for the card)",
    actExtra: "Optional files (links in the detail view)",
    actPublish: "Publish to activity feed",
    actPublishing: "Publishing…",
    actDelete: "Delete",
    actPublished: "Published. It will appear on the home page activity section shortly.",
    actErrorGeneric: "Could not publish. Check you are the admin, Storage rules (activityFeed), and Firestore rules, then try again.",
    actMissingFields: "Add a title, a description, and a main file (the card image or file).",
    actErrStorage: "Storage upload failed. Sign in as the admin, deploy storage.rules, and try again.",
    actErrPermission: "Permission denied. Deploy firestore.rules and use the admin account (same email as in rules).",
    actProMain: "main file (card)",
    actProExtra: "extra file",
    actProSave: "saving post to database",
    broadcastTitle: "Send notification message",
    broadcastHint: "Send a message to every shop user. It appears on their notifications page.",
    broadcastLabel: "Message",
    broadcastSend: "Send message",
    broadcastSending: "Sending…",
    broadcastSent: "Message sent to {count} users.",
    broadcastEmpty: "Write a message first.",
    broadcastError: "Could not send message. Check Firestore rules and try again.",
    broadcastRecipients: "Choose recipients",
    broadcastSelectAll: "Select all",
    broadcastNoUsers: "No shop users available.",
    broadcastNoRecipients: "Select at least one user."
  },
  fr: {
    back: "← Retour à la boutique",
    title: "Administration",
    pleaseWait: "Vérification de la session…",
    signOut: "Se déconnecter",
    denied: "Ce compte n'est pas dans la liste d'emails admin.",
    listIntro: "Commandes des clients inscrits, comptes boutique, alertes. Les comptes admin n’apparaissent pas ci-dessous.",
    pendingTitle: "Commandes à confirmer",
    pendingSub:
      "Uniquement les commandes au paiement confirmé, passées en étant connecté (liées à un compte). Paiement non finalisé ou invité : non affiché.",
    noPending: "Aucune commande en attente par un client inscrit pour l’instant.",
    usersTitle: "Comptes de la boutique",
    usersSub:
      "Inscriptions sur le site principal, pas l’espace admin. L’e-mail admin n’y est pas listé.",
    confirm: "Confirmer",
    noUsers: "Aucun profil utilisateur dans Firestore pour le moment.",
    noShopUsers: "Aucun compte client à afficher. Le compte admin est masqué ici.",
    name: "Nom",
    phone: "Téléphone",
    method: "Paiement",
    total: "Total",
    orderOn: "Créée",
    statusPending: "En attente",
    statusConfirmed: "Confirmée",
    statusCancelled: "Annulée",
    ban: "Bannir",
    unban: "Débannir",
    alert: "Alerter",
    info: "Détails",
    alertTitle: "Envoyer un message à l’utilisateur",
    alertBody: "Message (affiché au centre de l’écran sur la boutique)",
    sendAlert: "Envoyer",
    close: "Fermer",
    infoTitle: "Détails de l’utilisateur",
    username: "Identifiant",
    fullName: "Nom complet",
    email: "E-mail",
    language: "Langue",
    uid: "ID utilisateur",
    banned: "Banni",
    orderHistory: "Historique (Firestore)",
    supportBtn: "Support",
    supportTitle: "Assistance client",
    supportHint: "Messages envoyés depuis la page Compte (Assistance). Plus récents en premier.",
    supportEmpty: "Aucun message pour l’instant.",
    supportLoadError: "Impossible de charger les demandes d’assistance.",
    searchPlaceholder: "Rechercher par nom, e-mail ou id…",
    searchLabel: "Recherche",
    searchNoMatch: "Aucun compte ne correspond.",
    supportListHint: "File : accepter pour discuter. Actif : ouvrir le chat. Nouvelles demandes = point rouge sur Support.",
    supportAccept: "Accepter et discuter",
    supportOpenChat: "Ouvrir le chat",
    supportChatTitle: "Chat support",
    supportTypeReply: "Votre réponse…",
    supportSend: "Envoyer",
    updateModeTitle: "Mode mise à jour (écran de maintenance)",
    updateModeHint: "Lorsque c’est actif, la boutique et la connexion affichent un écran de mise à jour. Désactiver pour revenir à la normale. Les visiteurs peuvent utiliser le code pour accéder au site.",
    updateModeOn: "Le mode mise à jour est actif",
    updateModeOff: "Le mode mise à jour est désactivé",
    updateModeError: "Enregistrement impossible. Vérifiez l’e-mail admin et le déploiement des règles Firestore (config).",
    activityTitle: "Fil d’activité (hub boutique)",
    activityHint:
      "Les publications apparaissent sur l’accueil. Le fichier principal sert de carte (image, PDF, etc.). Connexion admin requise — règles Storage (activityFeed) et Firestore actives.",
    activityListTitle: "Publications actuelles",
    activityListEmpty: "Aucune publication. Publiez ci-dessus — cela s’affichera sur l’accueil sous peu.",
    actTitle: "Titre",
    actDescription: "Description (vue détail)",
    actMainFile: "Fichier principal (image ou autre pour la carte)",
    actExtra: "Fichiers optionnels (liens en vue détail)",
    actPublish: "Publier sur l’activité",
    actPublishing: "Publication…",
    actDelete: "Supprimer",
    actPublished: "Publié. Cela s’affichera sur l’accueil (fil d’activité) sous peu.",
    actErrorGeneric: "Publication impossible. Vérifiez l’e-mail admin, les règles Storage (activityFeed) et Firestore, puis réessayez.",
    actMissingFields: "Ajoutez un titre, une description et un fichier principal (image ou fichier pour la carte).",
    actErrStorage: "Échec d’envoi vers Storage. Connectez-vous en admin, déployez storage.rules, réessayez.",
    actErrPermission: "Permission refusée. Déployez firestore.rules et utilisez le compte admin (e-mail des règles).",
    actProMain: "fichier principal (carte)",
    actProExtra: "fichier supplémentaire",
    actProSave: "enregistrement de la publication",
    broadcastTitle: "Envoyer une notification",
    broadcastHint: "Envoyer un message à tous les utilisateurs de la boutique. Il apparaît dans leurs notifications.",
    broadcastLabel: "Message",
    broadcastSend: "Envoyer le message",
    broadcastSending: "Envoi…",
    broadcastSent: "Message envoyé à {count} utilisateurs.",
    broadcastEmpty: "Écrivez un message d'abord.",
    broadcastError: "Impossible d’envoyer le message. Vérifiez les règles Firestore.",
    broadcastRecipients: "Choisir les destinataires",
    broadcastSelectAll: "Tout sélectionner",
    broadcastNoUsers: "Aucun utilisateur boutique disponible.",
    broadcastNoRecipients: "Sélectionnez au moins un utilisateur."
  }
};

function lang() {
  return localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
}

function tr(key) {
  const L = T[lang()] || T.en;
  return L[key] || T.en[key] || key;
}

function formatFcfa(value) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/\s/g, ""));
  if (!Number.isFinite(n)) return "— FCFA";
  return `${n.toLocaleString()} FCFA`;
}

function isAdminUser(user) {
  const em = (user && user.email ? user.email : "").toLowerCase();
  return em.length > 0 && CARDIFY_ADMIN_EMAILS.has(em);
}

function isPaymentConfirmed(d) {
  if (!d) return false;
  if (d.paid === true) return true;
  const s = String(d.status ?? "")
    .trim()
    .toLowerCase();
  return s === "paid";
}

function isPendingOrder(d) {
  const f = d.fulfillmentStatus;
  if (f === "confirmed" || f === "cancelled") return false;
  return true;
}

/** Only orders from the main shop where the buyer was signed in (userId on the order). */
function isOrderFromShopUser(d) {
  return typeof d.userId === "string" && d.userId.length > 10;
}

/**
 * Shop accounts list: show everyone except (1) the currently signed-in admin’s own row and
 * (2) any document whose email matches the admin list. Do not require `email` on the doc:
 * missing email still counts as a shop customer; otherwise profiles without email are hidden.
 */
function userMatchesSearch(row, q) {
  if (!q) return true;
  const d = row.data;
  const uid = String(row.id).toLowerCase();
  const email = (d.email && String(d.email).toLowerCase()) || "";
  const un = (d.username && String(d.username).toLowerCase()) || "";
  const fn = (d.fullName && String(d.fullName).toLowerCase()) || "";
  return uid.includes(q) || email.includes(q) || un.includes(q) || fn.includes(q);
}

function isShopAccountRowVisible(row, currentUser) {
  const myUid = currentUser && currentUser.uid ? currentUser.uid : "";
  if (myUid && row.id === myUid) return false;
  const raw = row.data && row.data.email;
  const em = typeof raw === "string" && raw.trim() ? raw.trim().toLowerCase() : "";
  if (em && CARDIFY_ADMIN_EMAILS.has(em)) return false;
  return true;
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const cfg = window.__CARDIFY_FIREBASE_CONFIG__;
if (!cfg) {
  const root = document.getElementById("adminRoot");
  if (root) root.innerHTML = "<p>Missing Firebase config.</p>";
} else {
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const auth = getAuth(app);
  const cardifyAuthReady = initCardifyAuthPersistence(auth).catch((e) => {
    console.warn("auth persistence", e);
  });
  const db = getFirestore(app);
  let unsubOrders = null;
  let unsubUsers = null;
  let unsubSiteConfig = null;
  let unsubSupportTickets = null;
  let unsubSupportQueue = null;
  let unsubAdminChat = null;
  let unsubActivityFeed = null;
  let activityPublishInFlight = false;
  let allShopUserRows = [];
  let allShopCurrentUser = null;
  const storage = getStorage(app);

  function safeFileSegment(name) {
    const base = String(name || "")
      .replace(/.*[/\\]/, "")
      .trim() || "file";
    const s = base.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120);
    return s || "file";
  }

  async function deleteAllUnderStorageRef(sRef) {
    let res;
    try {
      res = await listAll(sRef);
    } catch {
      return;
    }
    for (const it of res.items) {
      try {
        await deleteObject(it);
      } catch (e) {
        console.warn("storage delete", e);
      }
    }
    for (const p of res.prefixes) {
      await deleteAllUnderStorageRef(p);
    }
  }

  function wireActivityFeedAdmin() {
    const form = document.getElementById("adminActivityForm");
    const msg = document.getElementById("adminActivityFormMsg");
    const listEl = document.getElementById("adminActivityList");
    const mainInput = document.getElementById("adminActMainFile");
    const mainDrop = document.getElementById("adminActMainDrop");
    const mainPreview = document.getElementById("adminActMainPreview");
    const mainEmpty = document.getElementById("adminActMainEmpty");
    if (!form || !listEl) return;

    if (unsubActivityFeed) {
      unsubActivityFeed();
      unsubActivityFeed = null;
    }
    const aq = query(collection(db, "activityFeed"), orderBy("createdAt", "desc"), limit(30));
    unsubActivityFeed = onSnapshot(
      aq,
      (snap) => {
        const emptyP = document.getElementById("adminActListEmpty");
        if (emptyP) emptyP.textContent = snap.empty ? tr("activityListEmpty") : "";
        if (snap.empty) {
          listEl.innerHTML = "";
          return;
        }
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, data: d.data() }));
        listEl.innerHTML = rows
          .map(({ id, data: d }) => {
            const title = d.title != null ? esc(String(d.title)) : "—";
            const timg =
              d.imageUrl && d.mainMime && String(d.mainMime).startsWith("image/")
                ? `<img class="admin-act-list-thumb" src="${esc(d.imageUrl)}" alt="" />`
                : `<div class="admin-act-list-fallback" aria-hidden="true">FILE</div>`;
            return `<li class="admin-act-row" data-act-id="${esc(id)}">
  <div class="admin-act-row-inner">
    ${timg}
    <div class="admin-act-row-txt"><strong>${title}</strong></div>
  </div>
  <button type="button" class="btn-admin-warn" data-activity-del="${esc(id)}" style="color:#b91c1c;border-color:#fecaca">${esc(
              tr("actDelete")
            )}</button>
</li>`;
          })
          .join("");

        listEl.querySelectorAll("[data-activity-del]").forEach((btn) => {
          btn.addEventListener("click", async () => {
            const pid = btn.getAttribute("data-activity-del");
            if (!pid) return;
            if (!window.confirm("Delete this activity post? This cannot be undone.")) return;
            btn.disabled = true;
            const oldText = btn.textContent;
            btn.textContent = "Deleting…";
            try {
              await deleteDoc(doc(db, "activityFeed", pid));
              const m = document.getElementById("adminActivityFormMsg");
              if (m) {
                m.textContent = "Post deleted.";
                m.className = "form-message success";
              }
            } catch (e) {
              console.warn("activity delete", e);
              const m = document.getElementById("adminActivityFormMsg");
              if (m) {
                const code = (e && e.code) || "unknown";
                m.textContent = `Impossible to delete (${code}). Deploy firestore.rules and make sure you are signed in as the admin email.`;
                m.className = "form-message error";
              } else {
                window.alert((e && e.message) || String(e));
              }
            }
            btn.disabled = false;
            btn.textContent = oldText;
          });
        });
      },
      (e) => {
        console.warn("admin activity list", e);
        const code = (e && e.code) || "unknown";
        if (listEl) {
          listEl.innerHTML = `<li class="admin-orders-hint" style="color:#b91c1c">Could not load feed (${esc(String(code))}). If this says failed-precondition, add the Firestore index for this query. Otherwise check rules.</li>`;
        }
        const emptyP = document.getElementById("adminActListEmpty");
        if (emptyP) emptyP.textContent = "";
      }
    );

    if (form.dataset.cardifyActWired) {
      return;
    }
    form.dataset.cardifyActWired = "1";
    let selectedMainFile = null;

    function renderSelectedMain(file) {
      if (!mainPreview || !mainEmpty) return;
      if (!file) {
        mainPreview.innerHTML = "";
        mainEmpty.hidden = false;
        if (mainDrop) mainDrop.classList.remove("admin-dropzone--has-file");
        return;
      }
      mainEmpty.hidden = true;
      if (mainDrop) mainDrop.classList.add("admin-dropzone--has-file");
      const name = esc(file.name || "image");
      const sizeKb = Math.max(1, Math.round((file.size || 0) / 1024));
      if (file.type && file.type.startsWith("image/")) {
        const previewUrl = URL.createObjectURL(file);
        mainPreview.innerHTML = `<div class="admin-main-preview__inner">
  <img class="admin-main-preview__img" src="${previewUrl}" alt="" />
  <p class="admin-main-preview__name">${name}</p>
  <p class="admin-main-preview__meta">${sizeKb.toLocaleString()} KB</p>
</div>`;
        return;
      }
      mainPreview.innerHTML = `<div class="admin-main-preview__nimg">
  <span class="admin-main-preview__ico" aria-hidden="true">FILE</span>
  <p class="admin-main-preview__name">${name}</p>
  <p class="admin-main-preview__meta">${sizeKb.toLocaleString()} KB</p>
</div>`;
    }

    function setSelectedMainFile(file) {
      if (!file) return;
      selectedMainFile = file;
      if (mainInput && typeof DataTransfer !== "undefined") {
        try {
          const dt = new DataTransfer();
          dt.items.add(file);
          mainInput.files = dt.files;
        } catch {
          /* Some browsers do not allow assigning input.files. */
        }
      }
      renderSelectedMain(file);
    }

    mainInput?.addEventListener("change", () => {
      setSelectedMainFile(mainInput.files?.[0]);
    });
    mainDrop?.addEventListener("click", () => mainInput?.click());
    mainDrop?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        mainInput?.click();
      }
    });
    ["dragenter", "dragover"].forEach((type) => {
      mainDrop?.addEventListener(type, (e) => {
        e.preventDefault();
        mainDrop.classList.add("admin-dropzone--over");
      });
    });
    ["dragleave", "drop"].forEach((type) => {
      mainDrop?.addEventListener(type, () => {
        mainDrop.classList.remove("admin-dropzone--over");
      });
    });
    mainDrop?.addEventListener("drop", (e) => {
      e.preventDefault();
      const file = [...(e.dataTransfer?.files || [])].find((f) => f.type && f.type.startsWith("image/"));
      if (!file) {
        if (msg) {
          msg.textContent = "Drop an image file.";
          msg.className = "form-message error";
        }
        return;
      }
      setSelectedMainFile(file);
    });

    async function publishToActivityFeed() {
      if (msg) {
        msg.textContent = "";
        msg.className = "form-message";
      }
      /* Do not await getIdToken() or cardifyAuthReady here: either can hang forever in some
       * browsers, leaving the button stuck on “Publishing…”. The Storage SDK already uses
       * the current Auth session. */
      if (activityPublishInFlight) return;
      const u = auth.currentUser;
      if (!u) {
        if (msg) {
          msg.textContent = "Sign in again, then try Publish.";
          msg.className = "form-message error";
        }
        return;
      }
      const title = (document.getElementById("adminActTitle")?.value || "").trim();
      const body = (document.getElementById("adminActBody")?.value || "").trim();
      const mainF = selectedMainFile || mainInput?.files?.[0];
      if (!title || !body || !mainF) {
        if (msg) {
          msg.textContent = tr("actMissingFields");
          msg.className = "form-message error";
        }
        return;
      }
      const pub = document.getElementById("adminActPublish");
      const postId = doc(collection(db, "activityFeed")).id;
      const mainSeg = safeFileSegment(mainF.name);
      const mainDisplay = (() => {
        const raw = String(mainF.name || "")
          .replace(/.*[/\\]/, "")
          .trim();
        if (raw.length) return raw.slice(0, 499);
        return mainSeg;
      })();
      const mainPath = `activityFeed/${postId}/main/${mainSeg}`;
      const progressWrap = document.getElementById("adminActProgressWrap");
      const progressFill = document.getElementById("adminActProgressFill");
      const progressText = document.getElementById("adminActProgressText");
      const progressBar = document.getElementById("adminActProgressBar");

      function setActivityBar(pct, line) {
        if (progressWrap) {
          progressWrap.hidden = false;
          progressWrap.removeAttribute("hidden");
        }
        const c = Math.max(0, Math.min(100, pct));
        if (Number.isNaN(c)) return;
        if (progressFill) {
          progressFill.style.width = `${c}%`;
        }
        if (progressBar) {
          progressBar.setAttribute("aria-valuenow", String(Math.round(c)));
        }
        if (progressText) {
          const tail = line != null && String(line) !== "" ? ` — ${line}` : "";
          progressText.textContent = `${Math.round(c)}%${tail}`;
        }
      }
      function hideActivityBar() {
        if (progressWrap) {
          progressWrap.hidden = true;
        }
        if (progressFill) {
          progressFill.style.width = "0%";
        }
        if (progressBar) {
          progressBar.setAttribute("aria-valuenow", "0");
        }
        if (progressText) {
          progressText.textContent = "0%";
        }
      }

      function shortFileName(f) {
        const n = (f && f.name && String(f.name)) || "file";
        return n.length > 48 ? `${n.slice(0, 45)}…` : n;
      }

      function readImageFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(reader.error || new Error("Could not read image."));
          reader.onload = () => resolve(String(reader.result || ""));
          reader.readAsDataURL(file);
        });
      }

      function loadImage(dataUrl) {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("Could not load image preview."));
          img.src = dataUrl;
        });
      }

      async function createInlineActivityImage(file) {
        setActivityBar(10, `Reading image — ${shortFileName(file)}`);
        const source = await readImageFileAsDataUrl(file);
        setActivityBar(30, `Preparing image — ${shortFileName(file)}`);
        const img = await loadImage(source);
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
        const width = Math.max(1, Math.round((img.width || 1) * scale));
        const height = Math.max(1, Math.round((img.height || 1) * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Could not prepare image.");
        ctx.drawImage(img, 0, 0, width, height);
        setActivityBar(55, `Compressing image — ${shortFileName(file)}`);
        let quality = 0.82;
        let out = canvas.toDataURL("image/jpeg", quality);
        while (out.length > 850000 && quality > 0.35) {
          quality -= 0.08;
          out = canvas.toDataURL("image/jpeg", quality);
        }
        if (out.length > 900000) {
          throw new Error("Image is too large. Try a smaller image.");
        }
        return out;
      }

      activityPublishInFlight = true;
      if (pub) {
        pub.disabled = true;
        pub.textContent = tr("actPublishing");
      }

      try {
        if (msg) {
          msg.textContent = "";
          msg.className = "form-message";
        }
        setActivityBar(0, `${tr("actProMain")} — ${shortFileName(mainF)}`);
        const imageUrl = await createInlineActivityImage(mainF);
        const docPayload = {
          title: title.slice(0, 200),
          description: body.slice(0, 20000),
          imageUrl,
          imageStoragePath: mainPath,
          mainMime: "image/jpeg",
          mainFileName: mainDisplay,
          clickCount: 0,
          likeCount: 0,
          createdAt: serverTimestamp()
        };
        setActivityBar(80, tr("actProSave"));
        if (msg) {
          msg.className = "form-message";
        }
        await setDoc(doc(db, "activityFeed", postId), docPayload);
        setActivityBar(100, tr("actProSave"));
        if (form && typeof form.reset === "function") {
          form.reset();
        }
        selectedMainFile = null;
        renderSelectedMain(null);
        if (msg) {
          msg.textContent = tr("actPublished");
          msg.className = "form-message success";
        }
      } catch (e) {
        const code = e && e.code;
        console.warn("activity publish", e);
        let hint = tr("actErrorGeneric");
        if (String(code).startsWith("storage/")) {
          hint = tr("actErrStorage");
        } else if (code === "permission-denied" || String(code) === "permission-denied") {
          hint = tr("actErrPermission");
        }
        if (msg) {
          msg.textContent = `${hint} ${code ? `(${code})` : ""}`.trim();
          msg.className = "form-message error";
        }
      } finally {
        activityPublishInFlight = false;
        if (pub) {
          pub.disabled = false;
          pub.textContent = tr("actPublish");
        }
        hideActivityBar();
      }
    }

    form.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void publishToActivityFeed();
    });
  }

  function wireUpdateModeAdmin() {
    const toggle = document.getElementById("adminUpdateModeToggle");
    if (!toggle) return;
    const label = document.getElementById("adminUpdateModeLabel");
    const msg = document.getElementById("adminUpdateModeMsg");
    const siteRef = doc(db, "config", "site");
    const applyUi = (on) => {
      if (label) {
        label.textContent = on ? tr("updateModeOn") : tr("updateModeOff");
      }
      try {
        toggle.checked = !!on;
      } catch (e) {
        /* */
      }
      if (msg) {
        msg.textContent = "";
        msg.classList.remove("error", "success");
      }
    };
    if (unsubSiteConfig) {
      unsubSiteConfig();
      unsubSiteConfig = null;
    }
    unsubSiteConfig = onSnapshot(
      siteRef,
      (snap) => {
        const on = snap.exists() && snap.data().updateMode === true;
        applyUi(on);
      },
      () => {
        applyUi(false);
      }
    );
    if (toggle.dataset.cardifyUpdateWired) {
      return;
    }
    toggle.dataset.cardifyUpdateWired = "1";
    toggle.addEventListener("change", async () => {
      const u = auth.currentUser;
      if (!u) return;
      const want = toggle.checked;
      try {
        await setDoc(
          siteRef,
          { updateMode: want, updatedAt: serverTimestamp() },
          { merge: true }
        );
        if (msg) {
          msg.textContent = want ? tr("updateModeOn") : tr("updateModeOff");
          msg.classList.remove("error");
          msg.classList.add("success");
        }
      } catch (e) {
        console.warn("updateMode", e);
        if (msg) {
          msg.textContent = tr("updateModeError") + (e && e.code ? ` (${e.code})` : "");
          msg.classList.add("error");
        }
        try {
          toggle.checked = !want;
        } catch (e2) {
          /* */
        }
      }
    });
  }

  function setMsg(el, text, kind = "") {
    if (!el) return;
    el.textContent = text;
    el.classList.remove("error", "success");
    if (kind) el.classList.add(kind);
  }

  function showPanel(which) {
    const wait = document.getElementById("adminPleaseWait");
    const denied = document.getElementById("adminDenied");
    const listw = document.getElementById("adminListWrap");
    [wait, denied, listw].forEach((e) => e && e.classList.add("hidden"));
    if (which === "denied") denied?.classList.remove("hidden");
    if (which === "list") listw?.classList.remove("hidden");
  }

  function copyStatic() {
    document.getElementById("adminBack").textContent = tr("back");
    document.getElementById("adminTitle").textContent = tr("title");
    const wait = document.getElementById("adminPleaseWait");
    if (wait) wait.textContent = tr("pleaseWait");
    document.getElementById("adminListIntro").textContent = tr("listIntro");
    const pt = document.getElementById("adminPendingTitle");
    if (pt) pt.textContent = tr("pendingTitle");
    const ps = document.getElementById("adminPendingSub");
    if (ps) ps.textContent = tr("pendingSub");
    document.getElementById("adminUsersTitle").textContent = tr("usersTitle");
    document.getElementById("adminUsersSub").textContent = tr("usersSub");
    const sBtn = document.getElementById("adminSupportBtn");
    if (sBtn) sBtn.textContent = tr("supportBtn");
    const sInp = document.getElementById("adminUserSearch");
    if (sInp) {
      sInp.placeholder = tr("searchPlaceholder");
      sInp.setAttribute("aria-label", tr("searchLabel"));
    }
    const sLab = document.getElementById("adminUserSearchLabel");
    if (sLab) sLab.textContent = tr("searchLabel");
    const dtxt = document.getElementById("adminDeniedText");
    if (dtxt) dtxt.textContent = tr("denied");
    document.getElementById("adminSignOutBtn1").textContent = tr("signOut");
    document.getElementById("adminSignOutBtn2").textContent = tr("signOut");
    const umt = document.getElementById("adminUpdateModeCardTitle");
    if (umt) umt.textContent = tr("updateModeTitle");
    const umh = document.getElementById("adminUpdateModeCardHint");
    if (umh) umh.textContent = tr("updateModeHint");
    const at = document.getElementById("adminActivityCardTitle");
    if (at) at.textContent = tr("activityTitle");
    const ah = document.getElementById("adminActivityCardHint");
    if (ah) ah.textContent = tr("activityHint");
    const alt = document.getElementById("adminActListTitle");
    if (alt) alt.textContent = tr("activityListTitle");
    const aempty = document.getElementById("adminActListEmpty");
    if (aempty) aempty.textContent = tr("activityListEmpty");
    document.getElementById("adminActTitleLabel") && (document.getElementById("adminActTitleLabel").textContent = tr("actTitle"));
    document.getElementById("adminActBodyLabel") && (document.getElementById("adminActBodyLabel").textContent = tr("actDescription"));
    document.getElementById("adminActMainLabel") && (document.getElementById("adminActMainLabel").textContent = tr("actMainFile"));
    document.getElementById("adminActExtraLabel") && (document.getElementById("adminActExtraLabel").textContent = tr("actExtra"));
    const apb = document.getElementById("adminActPublish");
    if (apb) apb.textContent = tr("actPublish");
    const bt = document.getElementById("adminBroadcastTitle");
    if (bt) bt.textContent = tr("broadcastTitle");
    const bh = document.getElementById("adminBroadcastHint");
    if (bh) bh.textContent = tr("broadcastHint");
    const bl = document.getElementById("adminBroadcastLabel");
    if (bl) bl.textContent = tr("broadcastLabel");
    const brl = document.getElementById("adminBroadcastRecipientsLabel");
    if (brl) brl.textContent = tr("broadcastRecipients");
    const bsa = document.getElementById("adminBroadcastSelectAllText");
    if (bsa) bsa.textContent = tr("broadcastSelectAll");
    const bs = document.getElementById("adminBroadcastSend");
    if (bs) bs.textContent = tr("broadcastSend");
  }

  copyStatic();

  let usersToolbarWired = false;
  function wireUsersToolbar() {
    if (usersToolbarWired) return;
    usersToolbarWired = true;
    document.getElementById("adminUserSearch")?.addEventListener("input", () => {
      if (allShopUserRows.length) renderUserList();
    });
    document.getElementById("adminSupportBtn")?.addEventListener("click", openSupportModal);
    document.getElementById("adminBroadcastSend")?.addEventListener("click", sendBroadcastAlert);
    document.getElementById("adminBroadcastSelectAll")?.addEventListener("change", (e) => {
      document.querySelectorAll("#adminBroadcastRecipients input[type=checkbox]").forEach((box) => {
        box.checked = e.target.checked;
      });
    });
  }
  wireUsersToolbar();

  function closeModal() {
    if (unsubAdminChat) {
      unsubAdminChat();
      unsubAdminChat = null;
    }
    if (unsubSupportTickets) {
      unsubSupportTickets();
      unsubSupportTickets = null;
    }
    const m = document.getElementById("adminModalRoot");
    if (m) {
      m.classList.add("hidden");
      m.classList.remove("modal-admin");
      m.setAttribute("aria-hidden", "true");
      m.innerHTML = "";
    }
  }

  function openModal(html) {
    if (unsubAdminChat) {
      unsubAdminChat();
      unsubAdminChat = null;
    }
    if (unsubSupportTickets) {
      unsubSupportTickets();
      unsubSupportTickets = null;
    }
    const m = document.getElementById("adminModalRoot");
    if (!m) return;
    m.classList.remove("hidden");
    m.classList.add("modal-admin");
    m.removeAttribute("aria-hidden");
    m.innerHTML = html;
    m.querySelectorAll("[data-admin-close]").forEach((b) => b.addEventListener("click", closeModal));
  }

  function openAdminChatForTicket(ticketId) {
    const title = tr("supportChatTitle");
    openModal(`<div class="modal-admin__panel admin-support-panel-wide" id="adminChatRoot">
  <div class="modal-admin__head">
    <h2 class="modal-admin__title">${esc(title)}</h2>
    <button type="button" class="modal-admin__close" data-admin-close>&times;</button>
  </div>
  <p class="admin-orders-hint" style="font-size:0.8rem">Ticket <code>${esc(ticketId)}</code></p>
  <div class="chat-modal-log" id="adminChatLog" aria-live="polite">…</div>
  <div class="cardify-chat-composer">
    <input type="text" id="adminChatInput" class="admin-user-search" style="flex:1;min-width:200px" maxlength="2000" placeholder="${esc(tr("supportTypeReply"))}" />
    <button type="button" class="primary-btn" id="adminChatSend" style="width:auto;padding:10px 16px" data-ticket-id="${esc(ticketId)}">${esc(tr("supportSend"))}</button>
  </div>
</div>`);
    const mq = query(
      collection(db, "supportTickets", ticketId, "chatMessages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    if (unsubAdminChat) unsubAdminChat();
    const renderLog = (snap) => {
      const log = document.getElementById("adminChatLog");
      if (!log) return;
      if (snap.empty) {
        log.innerHTML = `<p class="admin-orders-hint">${esc(tr("supportEmpty"))}</p>`;
        return;
      }
      const lines = [];
      snap.forEach((d) => {
        const m = d.data();
        const t = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : "";
        const from = m.from === "admin" ? "Admin" : "User";
        lines.push(
          `<p class="cardify-chat-line"><span class="cardify-supp-time" style="font-size:0.72rem;color:var(--muted)">${esc(t)}</span> <strong>${esc(
            from
          )}</strong> ${esc(m.text || "—")}</p>`
        );
      });
      log.innerHTML = lines.join("");
      log.scrollTop = log.scrollHeight;
    };
    unsubAdminChat = onSnapshot(
      mq,
      renderLog,
      (e) => {
        const log = document.getElementById("adminChatLog");
        if (log) log.textContent = String(e?.code || e);
      }
    );
    const doSend = async () => {
      const input = document.getElementById("adminChatInput");
      const t = (input?.value || "").trim();
      if (!t) return;
      if (input) input.value = "";
      const u = auth.currentUser;
      if (!u) return;
      try {
        await addDoc(collection(db, "supportTickets", ticketId, "chatMessages"), {
          text: t,
          from: "admin",
          senderId: u.uid,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn(e);
      }
    };
    document.getElementById("adminChatSend")?.addEventListener("click", doSend);
    document.getElementById("adminChatInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") doSend();
    });
  }

  async function acceptAndChat(ticketId) {
    const u = auth.currentUser;
    if (!u) return;
    try {
      const ref = doc(db, "supportTickets", ticketId);
      const snap0 = await getDoc(ref);
      if (!snap0.exists()) return;
      await updateDoc(ref, { status: "active", acceptedBy: u.uid, acceptedAt: serverTimestamp() });
      try {
        await addDoc(collection(db, "supportTickets", ticketId, "chatMessages"), {
          text:
            lang() === "fr"
              ? "L’équipe est en ligne. Vous pouvez échanger ici."
              : "A team member joined this chat — you are connected with the customer.",
          from: "admin",
          senderId: u.uid,
          createdAt: serverTimestamp()
        });
      } catch {
        /* non-fatal */
      }
      openAdminChatForTicket(ticketId);
    } catch (e) {
      console.warn(e);
      window.alert("Could not accept this ticket. Check rules and that you are the only admin in session.");
    }
  }

  function openSupportModal() {
    openModal(`<div class="modal-admin__panel admin-support-panel-wide" id="adminSupportRoot">
  <div class="modal-admin__head">
    <h2 class="modal-admin__title" id="adminSupTitle">${esc(tr("supportTitle"))}</h2>
    <button type="button" class="modal-admin__close" data-admin-close>&times;</button>
  </div>
  <p class="account-card-hint">${esc(tr("supportListHint"))}</p>
  <ul class="admin-support-list" id="adminSupportListMount" aria-live="polite" style="list-style:none">
    <li class="admin-orders-hint" style="list-style:none">…</li>
  </ul>
</div>`);
    const sq = query(
      collection(db, "supportTickets"),
      orderBy("createdAt", "desc"),
      limit(100)
    );
    unsubSupportTickets = onSnapshot(
      sq,
      (snap) => {
        const ul = document.getElementById("adminSupportListMount");
        if (!ul) {
          if (unsubSupportTickets) {
            unsubSupportTickets();
            unsubSupportTickets = null;
          }
          return;
        }
        if (snap.empty) {
          ul.innerHTML = `<li class="admin-orders-hint">${esc(tr("supportEmpty"))}</li>`;
          return;
        }
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, data: d.data() }));
        ul.innerHTML = list
          .map(({ id, data: d }) => {
            const when = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : "—";
            const em = d.userEmail != null ? esc(d.userEmail) : "—";
            const un = d.username != null ? esc(d.username) : "—";
            const msg = d.message != null ? esc(d.message) : "—";
            const st = d.status != null ? esc(String(d.status)) : "—";
            const isPending = d.status === "queued" || d.status === "open" || d.status == null;
            const isActive = d.status === "active";
            const canAccept = isPending;
            return `<li class="admin-support-item" data-supp-id="${id}">
  <p class="admin-support-item-meta">${esc(tr("orderOn"))}: ${esc(when)} · ${esc(
              tr("email")
            )}: ${em} · @${un} · <code>${esc(d.userId || "—")}</code> · <em>status: ${st}</em></p>
  <p class="admin-support-item-msg">${msg}</p>
  <div class="admin-support-item--actions">
    ${
      canAccept
        ? `<button type="button" class="primary-btn btn-admin-accept-green" data-admin-accept-ticket="${id}">${esc(tr("supportAccept"))}</button>`
        : ""
    }
    ${
      isActive
        ? `<button type="button" class="btn-admin-ghost" data-admin-open-chat="${id}">${esc(tr("supportOpenChat"))}</button>`
        : ""
    }
  </div>
</li>`;
          })
          .join("");

        ul.querySelectorAll("[data-admin-accept-ticket]").forEach((b) => {
          b.addEventListener("click", () => {
            const tid = b.getAttribute("data-admin-accept-ticket");
            if (tid) acceptAndChat(tid);
          });
        });
        ul.querySelectorAll("[data-admin-open-chat]").forEach((b) => {
          b.addEventListener("click", () => {
            const tid = b.getAttribute("data-admin-open-chat");
            if (tid) openAdminChatForTicket(tid);
          });
        });
      },
      (e) => {
        const ul = document.getElementById("adminSupportListMount");
        if (ul) {
          ul.innerHTML = `<li class="admin-orders-hint" style="color:#b91c1c">${esc(
            tr("supportLoadError")
          )} (${esc(e.code || String(e))})</li>`;
        }
        console.warn("supportTickets snap", e);
      }
    );
  }

  function renderPending(orders) {
    const mount = document.getElementById("adminPendingMount");
    if (!mount) return;
    const pending = orders.filter(
      (o) =>
        isPaymentConfirmed(o.data) && isPendingOrder(o.data) && isOrderFromShopUser(o.data)
    );
    if (pending.length === 0) {
      mount.innerHTML = `<p class="admin-orders-hint">${tr("noPending")}</p>`;
      return;
    }
    mount.innerHTML = pending
      .map((row) => {
        const d = row.data;
        const id = row.id;
        const lines = (d.items || [])
          .map((it) => {
            const t = esc(it.title || "—");
            const q = it.quantity != null ? it.quantity : 1;
            return `<li style="font-size:0.9rem">${t} × ${q} · ${formatFcfa(it.fcfa)}</li>`;
          })
          .join("");
        const when = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : "";
        const ph = d.phone ? `+221 ${esc(d.phone)}` : "—";
        const name = d.fullName ? esc(d.fullName) : "—";
        return `<div class="admin-order-block admin-card-block" data-pending-id="${id}">
  <p class="admin-order-head">
    <span class="fulfill-badge fulfill-badge--pending">${tr("statusPending")}</span>
    <span>${tr("orderOn")}: ${when || "—"}</span>
  </p>
  <p class="admin-order-line"><strong>${tr("phone")}:</strong> <code>${ph}</code> · <strong>${tr("name")}:</strong> ${name}</p>
  <p class="admin-order-line"><strong>${tr("method")}:</strong> ${esc(d.method || "—")} · <strong>${tr("total")}:</strong> ${formatFcfa(
          d.amountFcfa
        )}</p>
  <ul class="account-order-items">${lines || "<li>—</li>"}</ul>
  <button type="button" class="primary-btn btn-admin-confirm admin-confirm-btn" data-confirm-order="${id}">${tr("confirm")}</button>
</div>`;
      })
      .join("");

    mount.querySelectorAll("[data-confirm-order]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const oid = btn.getAttribute("data-confirm-order");
        btn.disabled = true;
        try {
          await updateDoc(doc(db, "orders", oid), {
            fulfillmentStatus: "confirmed",
            confirmedAt: serverTimestamp()
          });
        } catch (e) {
          console.warn(e);
        }
        btn.disabled = false;
      });
    });
  }

  async function sendBroadcastAlert() {
    const btn = document.getElementById("adminBroadcastSend");
    const msg = document.getElementById("adminBroadcastMsg");
    const input = document.getElementById("adminBroadcastText");
    const text = (input?.value || "").trim();
    if (msg) {
      msg.textContent = "";
      msg.classList.remove("error", "success");
    }
    if (!text) {
      if (msg) {
        msg.textContent = tr("broadcastEmpty");
        msg.classList.add("error");
      }
      return;
    }
    const selectedUserIds = Array.from(
      document.querySelectorAll("#adminBroadcastRecipients input[type=checkbox]:checked")
    ).map((box) => box.value);
    if (selectedUserIds.length === 0) {
      if (msg) {
        msg.textContent = tr("broadcastNoRecipients");
        msg.classList.add("error");
      }
      return;
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = tr("broadcastSending");
    }
    try {
      const writes = [];
      selectedUserIds.forEach((userId) => {
        writes.push(
          addDoc(collection(db, "alerts"), {
            userId,
            message: text,
            read: false,
            broadcast: true,
            createdAt: serverTimestamp()
          })
        );
      });
      await Promise.all(writes);
      if (input) input.value = "";
      if (msg) {
        msg.textContent = tr("broadcastSent").replace("{count}", String(writes.length));
        msg.classList.add("success");
      }
    } catch (e) {
      console.warn("broadcast alert", e);
      if (msg) {
        msg.textContent = tr("broadcastError");
        msg.classList.add("error");
      }
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = tr("broadcastSend");
    }
  }

  function renderBroadcastRecipients() {
    const mount = document.getElementById("adminBroadcastRecipients");
    const allToggle = document.getElementById("adminBroadcastSelectAll");
    if (!mount) return;
    const currentUser = allShopCurrentUser;
    const visible = allShopUserRows.filter((row) => isShopAccountRowVisible(row, currentUser));
    if (allToggle) allToggle.checked = false;
    if (visible.length === 0) {
      mount.innerHTML = `<p class="admin-orders-hint">${tr("broadcastNoUsers")}</p>`;
      return;
    }
    mount.innerHTML = visible
      .map((row) => {
        const d = row.data || {};
        const uid = esc(row.id);
        const name = esc(d.username || d.fullName || d.email || row.id);
        const email = esc(d.email || "—");
        return `<label class="admin-broadcast-recipient">
  <input type="checkbox" value="${uid}" />
  <span><strong>${name}</strong><small>${email}</small></span>
</label>`;
      })
      .join("");
  }

  function renderUserList() {
    const mount = document.getElementById("adminUsersMount");
    if (!mount) return;
    const currentUser = allShopCurrentUser;
    const currentUid = currentUser ? currentUser.uid : "";
    const q = (document.getElementById("adminUserSearch")?.value || "").trim().toLowerCase();
    const visible = allShopUserRows.filter((row) => isShopAccountRowVisible(row, currentUser));
    if (visible.length === 0) {
      mount.innerHTML = `<p class="admin-orders-hint">${tr("noShopUsers")}</p>`;
      return;
    }
    const shopOnly = visible.filter((row) => userMatchesSearch(row, q));
    if (shopOnly.length === 0) {
      mount.innerHTML = `<p class="admin-orders-hint">${tr("searchNoMatch")}</p>`;
      return;
    }
    mount.innerHTML = shopOnly
      .map((row) => {
        const d = row.data;
        const uid = row.id;
        const isSelf = uid === currentUid;
        const em = d.email != null ? esc(d.email) : "—";
        const un = d.username != null ? esc(d.username) : "—";
        const banned = d.banned === true;
        const tag = banned ? ` <span class="badge-banned">${tr("banned")}</span>` : "";
        return `<div class="admin-user-row" data-uid="${uid}">
  <div class="admin-user-meta">
    <strong>${un}</strong> · <span style="color:var(--muted)">${em}</span>${tag}
  </div>
  <div class="admin-user-actions">
    <button type="button" class="btn-admin-ghost" data-user-info="${uid}">${tr("info")}</button>
    <button type="button" class="btn-admin-warn" data-user-alert="${uid}">${tr("alert")}</button>
    ${
      isSelf
        ? '<span class="admin-orders-hint" style="font-size:0.75rem">—</span>'
        : banned
          ? `<button type="button" class="btn-admin-ghost" data-user-unban="${uid}">${tr("unban")}</button>`
          : `<button type="button" class="btn-admin-ghost" style="color:#dc2626" data-user-ban="${uid}">${tr("ban")}</button>`
    }
  </div>
</div>`;
      })
      .join("");

    mount.querySelectorAll("[data-user-ban]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const u = btn.getAttribute("data-user-ban");
        if (!window.confirm("Ban this user? They will be signed out and cannot sign in until you unban.")) return;
        try {
          await updateDoc(doc(db, "users", u), { banned: true, bannedAt: serverTimestamp() });
        } catch (e) {
          console.warn(e);
        }
      });
    });
    mount.querySelectorAll("[data-user-unban]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const u = btn.getAttribute("data-user-unban");
        try {
          await updateDoc(doc(db, "users", u), { banned: false, bannedAt: deleteField() });
        } catch (e) {
          console.warn(e);
        }
      });
    });
    mount.querySelectorAll("[data-user-alert]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const u = btn.getAttribute("data-user-alert");
        openModal(`
<div class="modal-admin__panel">
  <div class="modal-admin__head">
    <h2 class="modal-admin__title" id="admAlTitle">${tr("alertTitle")}</h2>
    <button type="button" class="modal-admin__close" data-admin-close>&times;</button>
  </div>
  <p class="account-card-hint">${tr("alertBody")}</p>
  <textarea id="adminAlertText" class="admin-textarea-admin" maxlength="5000" rows="5"></textarea>
  <button type="button" class="primary-btn" id="adminAlertSend" data-user-send="${u}">${tr("sendAlert")}</button>
</div>`);
        const send = document.getElementById("adminAlertSend");
        send.addEventListener("click", async () => {
          const t = (document.getElementById("adminAlertText")?.value || "").trim();
          if (!t) return;
          send.disabled = true;
          try {
            await addDoc(collection(db, "alerts"), {
              userId: u,
              message: t,
              read: false,
              createdAt: serverTimestamp()
            });
            closeModal();
          } catch (e) {
            console.warn(e);
            alert("Could not send (check Firestore rules and deploy).");
          }
          send.disabled = false;
        });
      });
    });
    mount.querySelectorAll("[data-user-info]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const u = btn.getAttribute("data-user-info");
        showUserInfo(u);
      });
    });
  }

  function renderUserRows(docs, currentUser) {
    allShopUserRows = docs;
    allShopCurrentUser = currentUser;
    renderBroadcastRecipients();
    renderUserList();
  }

  async function showUserInfo(userId) {
    openModal(`<p class="admin-orders-hint">Loading…</p>`);
    const title = tr("infoTitle");
    try {
      const us = await getDoc(doc(db, "users", userId));
      if (!us.exists()) {
        openModal(
          `<div class="modal-admin__panel"><h2 class="modal-admin__title">User</h2><p>Not found.</p><button class="primary-btn" data-admin-close>Close</button></div>`
        );
        return;
      }
      const d = us.data();
      const q1 = query(collection(db, "orders"), where("userId", "==", userId), limit(40));
      const s1 = await getDocs(q1);
      const rawPhone = d.senegalPhone ? String(d.senegalPhone).replace(/\D/g, "") : "";
      const q2 =
        rawPhone.length === 9
          ? query(collection(db, "orders"), where("phone", "==", rawPhone), limit(40))
          : null;
      const s2 = q2 ? await getDocs(q2) : null;
      const merged = new Map();
      s1.forEach((x) => merged.set(x.id, { id: x.id, data: x.data() }));
      if (s2) s2.forEach((x) => merged.set(x.id, { id: x.id, data: x.data() }));
      const olist = [...merged.values()].filter((o) => isPaymentConfirmed(o.data));
      olist.sort((a, b) => {
        const ta = a.data.createdAt?.toMillis ? a.data.createdAt.toMillis() : 0;
        const tb = b.data.createdAt?.toMillis ? b.data.createdAt.toMillis() : 0;
        return tb - ta;
      });
      const orderBlocks = olist
        .map((o) => {
          const od = o.data;
          const when = od.createdAt?.toDate ? od.createdAt.toDate().toLocaleString() : "";
          const st = esc(od.fulfillmentStatus || "—");
          return `<div class="order-mini">
  <div><strong>${tr("orderOn")}</strong> ${when} · <strong>Status</strong> ${st}</div>
  <div>${tr("phone")} +221 ${esc(od.phone || "—")} · ${tr("method")} ${esc(od.method || "—")} · ${tr("total")} ${formatFcfa(od.amountFcfa)}</div>
</div>`;
        })
        .join("");

      openModal(`<div class="modal-admin__panel admin-info-modal">
  <div class="modal-admin__head">
    <h2 class="modal-admin__title">${title}</h2>
    <button type="button" class="modal-admin__close" data-admin-close>&times;</button>
  </div>
  <div class="admin-info-row"><strong>${tr("uid")}:</strong> <code>${esc(userId)}</code></div>
  <div class="admin-info-row"><strong>${tr("username")}:</strong> ${esc(d.username)}</div>
  <div class="admin-info-row"><strong>${tr("fullName")}:</strong> ${esc(d.fullName)}</div>
  <div class="admin-info-row"><strong>${tr("email")}:</strong> ${esc(d.email)}</div>
  <div class="admin-info-row"><strong>${tr("phone")} (profile):</strong> +221 ${esc(d.senegalPhone || "—")}</div>
  <div class="admin-info-row"><strong>${tr("language")}:</strong> ${esc(d.language || "—")}</div>
  <div class="admin-info-row"><strong>${tr("banned")}:</strong> ${d.banned === true ? "yes" : "no"}</div>
  <h3>${tr("orderHistory")}</h3>
  ${orderBlocks || `<p class="admin-orders-hint">—</p>`}
  <button type="button" class="primary-btn" style="margin-top:10px" data-admin-close>${tr("close")}</button>
</div>`);
    } catch (e) {
      console.warn(e);
      openModal(
        `<div class="modal-admin__panel"><h2 class="modal-admin__title">Error</h2><p>Could not load. Deploy indexes if needed.</p><button class="primary-btn" data-admin-close>Close</button></div>`
      );
    }
  }

  function teardown() {
    if (unsubAdminChat) {
      unsubAdminChat();
      unsubAdminChat = null;
    }
    if (unsubSupportQueue) {
      unsubSupportQueue();
      unsubSupportQueue = null;
    }
    if (unsubSupportTickets) {
      unsubSupportTickets();
      unsubSupportTickets = null;
    }
    if (unsubOrders) {
      unsubOrders();
      unsubOrders = null;
    }
    if (unsubUsers) {
      unsubUsers();
      unsubUsers = null;
    }
    if (unsubSiteConfig) {
      unsubSiteConfig();
      unsubSiteConfig = null;
    }
    if (unsubActivityFeed) {
      unsubActivityFeed();
      unsubActivityFeed = null;
    }
  }

  /** All user profiles: order by document id so we do not exclude documents missing `createdAt`. */
  const USERS_PAGE_SIZE = 2000;

  function subscribeDashboard(currentUser) {
    teardown();
    const oq = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(200));
    unsubOrders = onSnapshot(
      oq,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, data: d.data() }));
        renderPending(rows);
      },
      (e) => console.warn("orders snap", e)
    );
    const uq = query(
      collection(db, "users"),
      orderBy(documentId()),
      limit(USERS_PAGE_SIZE)
    );
    unsubUsers = onSnapshot(
      uq,
      (snap) => {
        const rows = [];
        snap.forEach((d) => rows.push({ id: d.id, data: d.data() }));
        rows.sort((a, b) => {
          const ca = a.data.createdAt?.toMillis ? a.data.createdAt.toMillis() : 0;
          const cb = b.data.createdAt?.toMillis ? b.data.createdAt.toMillis() : 0;
          if (cb !== ca) return cb - ca;
          return (a.data.email || "").localeCompare(b.data.email || "");
        });
        renderUserRows(rows, currentUser);
      },
      (e) => {
        console.warn("users snap", e);
        const mount = document.getElementById("adminUsersMount");
        if (!mount) return;
        const code = e && (e.code || e.message) ? String(e.code || e.message) : "unknown";
        mount.innerHTML = `<p class="admin-orders-hint" style="color:#b91c1c">Could not load user list (${esc(code)}). Check Firestore rules, indexes, and deploy.</p>`;
      }
    );
    if (unsubSupportQueue) {
      unsubSupportQueue();
      unsubSupportQueue = null;
    }
    const bq = query(
      collection(db, "supportTickets"),
      where("status", "in", ["queued", "open"])
    );
    unsubSupportQueue = onSnapshot(
      bq,
      (snap) => {
        const badge = document.getElementById("adminSupportBadge");
        if (!badge) return;
        const n = snap.size;
        if (n > 0) badge.classList.remove("hidden");
        else badge.classList.add("hidden");
      },
      (e) => {
        const badge = document.getElementById("adminSupportBadge");
        if (badge) badge.classList.add("hidden");
        console.warn("support queue badge", e);
      }
    );
    wireUpdateModeAdmin();
    wireActivityFeedAdmin();
  }

  function doSignOut() {
    teardown();
    signOut(auth).catch(() => {});
  }

  document.getElementById("adminSignOutBtn1")?.addEventListener("click", doSignOut);
  document.getElementById("adminSignOutBtn2")?.addEventListener("click", doSignOut);

  void cardifyAuthReady.then(() => {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      /* No session: admin UI is only used after sign-in on the main site (index.html?admin=1). */
      window.location.replace("./index.html?admin=1");
      return;
    }
    if (isAdminUser(user)) {
      showPanel("list");
      subscribeDashboard(user);
    } else {
      teardown();
      showPanel("denied");
    }
  });
  });
}

