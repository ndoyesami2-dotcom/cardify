import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut as authSignOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { initCardifyAuthPersistence } from "./cardify-auth-persistence.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const CARDIFY_PHONE_STORAGE_KEY = "cardifySenegalPhone";

/** Preset Q&A for the account support panel (per language). */
const SUPPORT_FAQS = {
  en: [
    {
      q: "When will I receive my order?",
      a: "After your payment is confirmed, the shop processes your order. You can follow the status in My orders. You will be notified when it is complete."
    },
    {
      q: "What payment methods can I use?",
      a: "We accept card payments, Wave, and Orange Money where available. Choose the method you prefer at checkout and follow the instructions on screen."
    },
    {
      q: "Can I cancel an order?",
      a: "If the order is still waiting for confirmation, you can cancel it from My orders. If it is already confirmed, write to us using the form below and we will help you."
    },
    {
      q: "I don’t see my order in My orders",
      a: "Orders placed while you are signed in show up there automatically. If you paid as a guest, make sure the phone in your account matches the one used at checkout. If something still looks wrong, message us below."
    },
    {
      q: "What if my payment failed or was charged twice?",
      a: "Check your bank or mobile-money app for the real status. If you were charged but the order did not go through, use the message form below with your order details and we will look into it with you."
    },
    {
      q: "How do I change the phone number on my account?",
      a: "On this page, under Phone, enter your Senegal mobile in the correct format and tap Save. This number is used for Wave and Orange Money and helps match guest orders to your account."
    },
    {
      q: "What is the wishlist for?",
      a: "You can save products you like from the shop. They stay on your account so you can open them later. The wishlist does not reserve stock or place an order by itself."
    },
    {
      q: "Is my payment information stored on Cardify?",
      a: "You sign in securely with your account. Payment is handled according to the method you choose at checkout. If you have a specific security concern, describe it in a message below and we will help."
    },
    {
      q: "How fast will you reply to my message?",
      a: "The team reads support messages as soon as possible. Reply time depends on volume and opening hours. For urgent order issues, include your order date and phone number in the message below."
    }
  ],
  fr: [
    {
      q: "Quand vais-je recevoir ma commande ?",
      a: "Après confirmation du paiement, le magasin traite votre commande. Suivez le statut dans Mes commandes. Vous serez informé quand ce sera terminé."
    },
    {
      q: "Quels moyens de paiement sont acceptés ?",
      a: "Nous acceptons la carte, Wave et Orange Money selon les options proposées. Choisissez le mode à la caisse et suivez les instructions à l’écran."
    },
    {
      q: "Puis-je annuler une commande ?",
      a: "Tant qu’elle est en attente de confirmation, vous pouvez l’annuler depuis Mes commandes. Si elle est déjà confirmée, écrivez-nous via le formulaire ci-dessous."
    },
    {
      q: "Je ne vois pas ma commande dans Mes commandes",
      a: "Les commandes passées connecté apparaissent automatiquement. Si vous avez payé en invité, vérifiez que le téléphone du compte est le même qu’au paiement. Sinon, contactez-nous ci-dessous."
    },
    {
      q: "Que faire si le paiement a échoué ou a été débité deux fois ?",
      a: "Vérifiez le statut dans votre appli bancaire ou mobile money. Si vous avez été débité sans commande valide, écrivez-nous ci-dessous avec le détail et nous verrons cela avec vous."
    },
    {
      q: "Comment modifier le numéro sur mon compte ?",
      a: "Sur cette page, section Téléphone, saisissez votre mobile sénégalais au bon format puis Enregistrer. Ce numéro sert pour Wave et Orange Money et pour rapprocher les commandes invité de votre compte."
    },
    {
      q: "À quoi sert la liste d’envies ?",
      a: "Vous y enregistrez des produits depuis la boutique pour les retrouver plus tard. La liste ne réserve pas de stock et ne crée pas de commande toute seule."
    },
    {
      q: "Mes infos de paiement sont-elles stockées sur Cardify ?",
      a: "Vous vous connectez en toute sécurité. Le paiement suit le mode choisi à la caisse. Pour une question de sécurité précise, décrivez-la dans un message ci-dessous et nous vous répondrons."
    },
    {
      q: "Dans quel délai recevrai-je une réponse ?",
      a: "L’équipe traite les messages dès que possible. Le délai dépend de l’activité et des horaires. En cas d’urgence liée à une commande, indiquez la date et votre numéro dans le message."
    }
  ]
};

const T = {
  en: {
    back: "← Back to shop",
    title: "Account",
    wishlist: "Wishlist",
    wishlistHint: "Items you save from product pages appear here.",
    history: "Purchase history",
    historyHint: "Completed card payments are listed here.",
    phone: "Phone",
    phoneHint: "Senegal mobile used for Wave and Orange Money checkout.",
    phoneLabel: "Change number",
    savePhone: "Save phone",
    logout: "Log out",
    emptyWishlist: "Your wishlist is empty.",
    emptyHistory: "No purchases yet.",
    openProduct: "View",
    remove: "Remove",
    orderOn: "Order",
    activeOrders: "My orders",
    activeOrdersHint:
      "Recent orders and status. You can cancel while the order is still waiting for the shop to confirm it.",
    activeOrdersEmpty: "No orders in Firestore yet, or you checked out as a guest. Sign in before paying to link orders to this account.",
    activeOrdersError: "Could not load orders. Check the connection, indexes, and Firestore rules for the orders collection.",
    statusPending: "Pending confirmation",
    statusConfirmed: "Confirmed",
    statusCancelled: "Cancelled",
    fullName: "Name",
    cancelOrder: "Cancel order",
    cancelOrderConfirm: "Cancel this order? The shop will no longer process it.",
    cancelError: "Could not cancel. It may already be confirmed.",
    method: "Payment",
    total: "Total",
    loadOrders: "Loading…",
    invalidPhone: "Invalid Senegal mobile (9 digits, e.g. 77 123 45 67 or +221 …).",
    phoneSaved: "Phone number saved.",
    phoneSaveError: "Could not save. Check your connection and Firestore rules.",
    signedOut: "Signed out.",
    support: "Support",
    supportHint: "First tap a common question. After the answer appears, you can message the team.",
    supportFaqKicker: "Common questions",
    supportChatLabel: "Reply",
    supportChatPlaceholder: "Select a question above to see the answer here.",
    supportComposeHint: "Or message the team directly",
    supportMessageLabel: "Your message",
    supportSend: "Send to shop",
    supportEmpty: "Please type a message first.",
    supportOk: "Message sent. The shop will see it shortly.",
    supportError: "Could not send. Check the connection and Firestore rules (supportTickets)."
  },
  fr: {
    back: "← Retour à la boutique",
    title: "Compte",
    wishlist: "Liste d'envies",
    wishlistHint: "Les articles enregistrés depuis les fiches produit apparaissent ici.",
    history: "Historique d'achats",
    historyHint: "Les paiements par carte terminés sont listés ici.",
    phone: "Téléphone",
    phoneHint: "Mobile Sénégal utilisé pour Wave et Orange Money.",
    phoneLabel: "Modifier le numéro",
    savePhone: "Enregistrer",
    logout: "Se déconnecter",
    emptyWishlist: "Votre liste d'envies est vide.",
    emptyHistory: "Aucun achat pour le moment.",
    openProduct: "Voir",
    remove: "Retirer",
    orderOn: "Commande",
    activeOrders: "Mes commandes",
    activeOrdersHint:
      "Commandes récentes et statut. Vous pouvez annuler tant que le magasin n'a pas confirmé la commande.",
    activeOrdersEmpty:
      "Aucune commande dans Firestore, ou commande en tant qu'invité. Connectez-vous avant le paiement pour lier la commande à ce compte.",
    activeOrdersError: "Chargement des commandes impossible. Vérifiez la connexion, les index et les règles Firestore.",
    statusPending: "En attente de confirmation",
    statusConfirmed: "Confirmée",
    statusCancelled: "Annulée",
    fullName: "Nom",
    cancelOrder: "Annuler la commande",
    cancelOrderConfirm: "Annuler cette commande ? Elle ne sera plus traitée.",
    cancelError: "Annulation impossible. Peut-être déjà confirmée.",
    method: "Paiement",
    total: "Total",
    loadOrders: "Chargement…",
    invalidPhone: "Numéro mobile sénégalais invalide (9 chiffres).",
    phoneSaved: "Numéro enregistré.",
    phoneSaveError: "Enregistrement impossible. Vérifiez la connexion et les règles Firestore.",
    signedOut: "Déconnecté.",
    support: "Assistance",
    supportHint: "Touchez d’abord une question. Une fois la réponse affichée, vous pourrez écrire à l’équipe.",
    supportFaqKicker: "Questions fréquentes",
    supportChatLabel: "Réponse",
    supportChatPlaceholder: "Choisissez une question ci-dessus pour afficher la réponse ici.",
    supportComposeHint: "Ou écrivez directement à l’équipe",
    supportMessageLabel: "Votre message",
    supportSend: "Envoyer",
    supportEmpty: "Saisissez d’abord un message.",
    supportOk: "Message envoyé. L’équipe le verra bientôt.",
    supportError: "Envoi impossible. Vérifiez la connexion et les règles Firestore (supportTickets)."
  }
};

function lang() {
  return localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
}

function t(key) {
  const L = T[lang()] || T.en;
  return L[key] || T.en[key] || key;
}

function normalizeSenegalMobile(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("221") && d.length >= 12) d = d.slice(3);
  if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 9 && /^[37]\d{8}$/.test(d)) return d;
  return null;
}

function formatFcfa(value) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
  if (!Number.isFinite(n)) return "— FCFA";
  return `${n.toLocaleString()} FCFA`;
}

function assetPath(rel) {
  if (!rel) return "";
  const clean = String(rel).replace(/^\.?\//, "");
  return "./" + clean.split("/").map((seg) => encodeURIComponent(seg)).join("/");
}

function openListingPayload(item) {
  const payload = {
    platform: item.platform,
    region: item.region,
    amount: item.amount,
    fcfa: item.fcfa,
    pairId: item.pairId,
    title: item.title,
    image: item.image || ""
  };
  try {
    sessionStorage.setItem("cardifyListingView", JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  window.location.href = "./listing-details.html?d=" + encodeURIComponent(JSON.stringify(payload));
}

function applyCopy() {
  document.getElementById("accountBackShop").textContent = t("back");
  document.getElementById("accountPageTitle").textContent = t("title");
  const aoH = document.getElementById("activeOrdersHeading");
  if (aoH) aoH.textContent = t("activeOrders");
  const aoX = document.getElementById("activeOrdersHint");
  if (aoX) aoX.textContent = t("activeOrdersHint");
  const ld = document.getElementById("activeOrdersLoading");
  if (ld) ld.textContent = t("loadOrders");
  document.getElementById("wishlistHeading").textContent = t("wishlist");
  document.getElementById("wishlistHint").textContent = t("wishlistHint");
  document.getElementById("historyHeading").textContent = t("history");
  document.getElementById("historyHint").textContent = t("historyHint");
  document.getElementById("phoneHeading").textContent = t("phone");
  document.getElementById("phoneHint").textContent = t("phoneHint");
  document.getElementById("phoneInputLabel").textContent = t("phoneLabel");
  document.getElementById("phoneSaveBtn").textContent = t("savePhone");
  const sh = document.getElementById("supportHeading");
  if (sh) sh.textContent = t("support");
  const sh2 = document.getElementById("supportHint");
  if (sh2) sh2.textContent = t("supportHint");
  const fk = document.getElementById("supportFaqKicker");
  if (fk) fk.textContent = t("supportFaqKicker");
  const scl = document.getElementById("supportChatLabel");
  if (scl) scl.textContent = t("supportChatLabel");
  const ph = document.getElementById("supportChatPlaceholder");
  if (ph) ph.textContent = t("supportChatPlaceholder");
  const sch = document.getElementById("supportComposeHint");
  if (sch) sch.textContent = t("supportComposeHint");
  const sl = document.getElementById("supportMessageLabel");
  if (sl) sl.textContent = t("supportMessageLabel");
  const sbtn = document.getElementById("supportSendBtn");
  if (sbtn) sbtn.textContent = t("supportSend");
  const sFab = document.getElementById("accountSupportFab");
  if (sFab) sFab.textContent = t("support");
  document.getElementById("logoutBtn").textContent = t("logout");
}

function renderWishlist() {
  const mount = document.getElementById("wishlistMount");
  if (!mount || !window.CardifyUserData) return;
  const list = window.CardifyUserData.getWishlist();
  if (list.length === 0) {
    mount.innerHTML = `<p class="account-empty">${t("emptyWishlist")}</p>`;
    return;
  }
  mount.innerHTML = list
    .map((item) => {
      const title = String(item.title || "").replace(/</g, "&lt;");
      return `
      <div class="account-row" data-wish-id="${item.id}">
        <div class="account-row-text">
          <span class="account-row-title">${title}</span>
          <span class="account-row-meta">${formatFcfa(item.fcfa)}</span>
        </div>
        <div class="account-row-actions">
          <button type="button" class="text-link-btn" data-open-wish="${item.id}">${t("openProduct")}</button>
          <button type="button" class="text-link-btn text-link-btn--danger" data-remove-wish="${item.id}">${t("remove")}</button>
        </div>
      </div>`;
    })
    .join("");

  mount.querySelectorAll("[data-open-wish]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-open-wish");
      const item = list.find((x) => x.id === id);
      if (item) openListingPayload(item);
    });
  });
  mount.querySelectorAll("[data-remove-wish]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.CardifyUserData.removeWishlistById(btn.getAttribute("data-remove-wish"));
      renderWishlist();
    });
  });
}

function renderHistory() {
  const mount = document.getElementById("historyMount");
  if (!mount || !window.CardifyUserData) return;
  const orders = window.CardifyUserData.getPurchaseHistory();
  if (orders.length === 0) {
    mount.innerHTML = `<p class="account-empty">${t("emptyHistory")}</p>`;
    return;
  }
  mount.innerHTML = orders
    .map((order) => {
      const when = order.at ? new Date(order.at).toLocaleString() : "";
      const lines = (order.items || [])
        .map((it) => {
          const tit = String(it.title || "—").replace(/</g, "&lt;");
          return `<li>${tit} · ${formatFcfa(it.fcfa)}</li>`;
        })
        .join("");
      const total = formatFcfa(order.amountFcfa);
      return `
      <div class="account-order-block">
        <p class="account-order-head"><strong>${t("orderOn")}</strong> ${when} · ${total}</p>
        <ul class="account-order-items">${lines}</ul>
      </div>`;
    })
    .join("");
}

function setPhoneMsg(text, type = "") {
  const el = document.getElementById("phoneMessage");
  if (!el) return;
  el.textContent = text;
  el.classList.remove("error", "success");
  if (type) el.classList.add(type);
}

const cfg = window.__CARDIFY_FIREBASE_CONFIG__;
if (!cfg) {
  document.body.innerHTML = "<p>Missing Firebase config.</p>";
} else {
  const app = initializeApp(cfg);
  const auth = getAuth(app);
  const cardifyAuthReady = initCardifyAuthPersistence(auth).catch((e) => {
    console.warn("auth persistence", e);
  });
  const db = getFirestore(app);

  let supportFaqSeq = 0;
  let supportPanelComposeUnlocked = false;

  function getSupportFaqList() {
    return SUPPORT_FAQS[lang()] || SUPPORT_FAQS.en;
  }

  function setSupportFaqButtonsDisabled(dis) {
    document.querySelectorAll("#supportFaqList [data-faq-idx]").forEach((btn) => {
      btn.disabled = dis;
    });
  }

  function renderAccountSupportFaqList() {
    const list = document.getElementById("supportFaqList");
    if (!list) return;
    list.innerHTML = "";
    getSupportFaqList().forEach((item, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "account-support-faq-btn";
      b.setAttribute("data-faq-idx", String(idx));
      b.setAttribute("role", "listitem");
      b.textContent = item.q;
      list.appendChild(b);
    });
  }

  function resetAccountSupportState() {
    supportFaqSeq += 1;
    supportPanelComposeUnlocked = false;
    const chat = document.getElementById("supportChat");
    const comp = document.getElementById("supportCompose");
    const ta = document.getElementById("supportMessage");
    const sBtn = document.getElementById("supportSendBtn");
    if (chat) {
      chat.innerHTML = `<p class="account-support-chat-placeholder" id="supportChatPlaceholder">${t("supportChatPlaceholder")}</p>`;
    }
    if (comp) {
      comp.classList.add("hidden");
      comp.setAttribute("aria-hidden", "true");
    }
    if (ta) {
      ta.value = "";
      ta.disabled = true;
    }
    if (sBtn) sBtn.disabled = true;
    const mEl = document.getElementById("supportFormMessage");
    if (mEl) {
      mEl.textContent = "";
      mEl.className = "form-message";
    }
    renderAccountSupportFaqList();
    setSupportFaqButtonsDisabled(false);
  }

  function runSupportFaqFromIndex(idx) {
    const items = getSupportFaqList();
    const item = items[idx];
    if (!item) return;
    const seq = ++supportFaqSeq;
    const chat = document.getElementById("supportChat");
    if (!chat) return;
    setSupportFaqButtonsDisabled(true);
    const loading = t("loadOrders");
    chat.innerHTML = `<div class="account-support-loading" aria-label="${loading}"><span class="account-support-dot"></span><span class="account-support-dot"></span><span class="account-support-dot"></span></div>`;

    setTimeout(() => {
      if (seq !== supportFaqSeq) return;
      const p = document.createElement("p");
      p.className = "account-support-answer";
      p.setAttribute("aria-atomic", "true");
      chat.innerHTML = "";
      chat.appendChild(p);
      let ch = 0;
      const full = item.a;
      const typeNext = () => {
        if (seq !== supportFaqSeq) return;
        if (ch < full.length) {
          p.textContent += full[ch];
          ch += 1;
          setTimeout(typeNext, 16);
        } else {
          setSupportFaqButtonsDisabled(false);
          if (!supportPanelComposeUnlocked) {
            supportPanelComposeUnlocked = true;
            const cmp = document.getElementById("supportCompose");
            if (cmp) {
              cmp.classList.remove("hidden");
              cmp.setAttribute("aria-hidden", "false");
            }
            const tarea = document.getElementById("supportMessage");
            if (tarea) tarea.disabled = false;
            const send = document.getElementById("supportSendBtn");
            if (send) send.disabled = false;
            requestAnimationFrame(() => tarea?.focus());
          }
        }
      };
      typeNext();
    }, 900);
  }

  let activeOrdersUnsubs = [];

  function teardownActiveOrders() {
    activeOrdersUnsubs.forEach((u) => u());
    activeOrdersUnsubs = [];
  }

  function docTimeMs(data) {
    const c = data.createdAt;
    if (c && typeof c.toMillis === "function") return c.toMillis();
    return 0;
  }

  function mergeOrderMaps(m1, m2) {
    const out = new Map();
    m1.forEach((v, k) => out.set(k, v));
    m2.forEach((v, k) => out.set(k, v));
    return [...out.values()].sort((a, b) => docTimeMs(b.data) - docTimeMs(a.data));
  }

  /** Firestore can return phone-matches shared with other accounts; only show this user's rows. */
  function isActiveOrderForCurrentUser(d, currentUser, digits) {
    if (!d || !currentUser) return false;
    const otherUid = d.userId;
    if (otherUid != null && String(otherUid) !== "") {
      return otherUid === currentUser.uid;
    }
    return !!(digits && d.phone === digits);
  }

  function fulfillmentLabel(fs) {
    if (fs === "confirmed") return t("statusConfirmed");
    if (fs === "cancelled") return t("statusCancelled");
    return t("statusPending");
  }

  function fulfillClass(fs) {
    if (fs === "confirmed") return "fulfill-badge fulfill-badge--confirmed";
    if (fs === "cancelled") return "fulfill-badge fulfill-badge--cancelled";
    return "fulfill-badge fulfill-badge--pending";
  }

  function renderActiveOrderList(orders) {
    const mount = document.getElementById("activeOrdersMount");
    if (!mount) return;
    if (orders.length === 0) {
      mount.innerHTML = `<p class="account-empty">${t("activeOrdersEmpty")}</p>`;
      return;
    }
    mount.innerHTML = orders
      .map((row) => {
        const d = row.data;
        const id = row.id;
        const fs = d.fulfillmentStatus || "pending";
        const lines = (d.items || [])
          .map((it) => {
            const tit = String(it.title || "—").replace(/</g, "&lt;");
            const q = it.quantity != null ? it.quantity : 1;
            return `<li>${tit} × ${q} · ${formatFcfa(it.fcfa)}</li>`;
          })
          .join("");
        const when = d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString() : "";
        const canCancel = fs === "pending" || d.fulfillmentStatus == null;
        const phoneShow = d.phone ? `+221 ${d.phone}` : "—";
        const nameShow = d.fullName ? String(d.fullName).replace(/</g, "&lt;") : "—";
        return `
      <div class="account-active-order" data-order-id="${id}">
        <div class="account-active-head">
          <span class="${fulfillClass(fs)}">${fulfillmentLabel(fs)}</span>
          <span>${when ? `${t("orderOn")} ${when}` : ""}</span>
        </div>
        <p class="account-active-meta">${t("phone")}: ${phoneShow} · ${t("fullName")}: ${nameShow} · ${t("method")}: ${String(
          d.method || "—"
        )}</p>
        <p class="account-order-head" style="margin:6px 0 4px"><strong>${t("total")}</strong> ${formatFcfa(
          d.amountFcfa
        )}</p>
        <ul class="account-order-items">${lines}</ul>
        ${
          canCancel
            ? `<button type="button" class="text-link-btn text-link-btn--danger" data-cancel-order="${id}">${t(
                "cancelOrder"
              )}</button>`
            : ""
        }
      </div>`;
      })
      .join("");

    mount.querySelectorAll("[data-cancel-order]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        if (!window.confirm(t("cancelOrderConfirm"))) return;
        const oid = btn.getAttribute("data-cancel-order");
        try {
          await updateDoc(doc(db, "orders", oid), {
            fulfillmentStatus: "cancelled",
            cancelledAt: serverTimestamp()
          });
        } catch {
          alert(t("cancelError"));
        }
      });
    });
  }

  function setupActiveOrders(user, phoneDigits) {
    teardownActiveOrders();
    const mount = document.getElementById("activeOrdersMount");
    if (!mount || !user) return;
    const ordersRef = collection(db, "orders");
    const hasPhone = phoneDigits && phoneDigits.length === 9;
    const q1 = query(
      ordersRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc"),
      limit(40)
    );
    const q2 = hasPhone
      ? query(ordersRef, where("phone", "==", phoneDigits), orderBy("createdAt", "desc"), limit(40))
      : null;

    let m1 = new Map();
    let m2 = new Map();

    const runMerge = () => {
      const merged = mergeOrderMaps(m1, m2);
      const forUser = merged.filter(
        (row) => isActiveOrderForCurrentUser(row.data, user, phoneDigits) && (row.data.paid === true || row.data.status === "paid")
      );
      renderActiveOrderList(forUser);
    };

    const u1 = onSnapshot(
      q1,
      (snap) => {
        m1 = new Map();
        snap.forEach((d) => m1.set(d.id, { id: d.id, data: d.data() }));
        runMerge();
      },
      (err) => {
        console.warn("orders (userId) query failed:", err);
        // Fallback: same filter without orderBy to avoid a missing composite index, sort client-side.
        getDocs(query(ordersRef, where("userId", "==", user.uid), limit(40)))
          .then((s) => {
            const rows = [];
            s.forEach((d) => rows.push({ id: d.id, data: d.data() }));
            rows.sort((a, b) => docTimeMs(b.data) - docTimeMs(a.data));
            m1 = new Map(rows.map((o) => [o.id, o]));
            runMerge();
          })
          .catch((e) => {
            console.warn("orders fallback failed:", e);
            if (mount) mount.innerHTML = `<p class="account-empty">${t("activeOrdersError")}</p>`;
          });
      }
    );
    activeOrdersUnsubs.push(u1);

    if (q2) {
      const u2 = onSnapshot(
        q2,
        (snap) => {
          m2 = new Map();
          snap.forEach((d) => m2.set(d.id, { id: d.id, data: d.data() }));
          runMerge();
        },
        (err) => {
          console.warn("orders (phone) query failed — showing userId orders only:", err);
          m2 = new Map();
          runMerge();
        }
      );
      activeOrdersUnsubs.push(u2);
    } else {
      m2 = new Map();
    }
  }

  applyCopy();
  renderAccountSupportFaqList();

  let accountActionsWired = false;

  void cardifyAuthReady.then(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      teardownActiveOrders();
      window.location.replace("./index.html");
      return;
    }

    try {
      const udoc = await getDoc(doc(db, "users", user.uid));
      if (udoc.exists() && udoc.data() && udoc.data().banned === true) {
        await authSignOut(auth);
        window.location.replace("./index.html?banned=1");
        return;
      }
    } catch {
      /* ignore */
    }

    const phoneEl = document.getElementById("phoneDisplay");
    const phoneInput = document.getElementById("phoneInput");

    let digits = normalizeSenegalMobile(localStorage.getItem(CARDIFY_PHONE_STORAGE_KEY) || "");
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const ud = snap.data();
        if (ud && typeof ud.senegalPhone === "string") {
          const fromDb = normalizeSenegalMobile(ud.senegalPhone);
          if (fromDb) digits = fromDb;
        }
      }
    } catch {
      /* ignore */
    }

    if (phoneEl) phoneEl.textContent = digits ? `+221 ${digits}` : "—";
    if (phoneInput && digits) phoneInput.value = `+221 ${digits}`;

    if (!accountActionsWired) {
      accountActionsWired = true;
      document.getElementById("phoneSaveBtn")?.addEventListener("click", async () => {
        setPhoneMsg("");
        const normalized = normalizeSenegalMobile(
          document.getElementById("phoneInput")?.value || ""
        );
        if (!normalized) {
          setPhoneMsg(t("invalidPhone"), "error");
          return;
        }
        const u = auth.currentUser;
        if (!u) return;
        try {
          await updateDoc(doc(db, "users", u.uid), { senegalPhone: normalized });
          localStorage.setItem(CARDIFY_PHONE_STORAGE_KEY, normalized);
          const disp = document.getElementById("phoneDisplay");
          if (disp) disp.textContent = `+221 ${normalized}`;
          setPhoneMsg(t("phoneSaved"), "success");
        } catch {
          setPhoneMsg(t("phoneSaveError"), "error");
        }
      });

      document.getElementById("supportSendBtn")?.addEventListener("click", async () => {
        const sendBtn0 = document.getElementById("supportSendBtn");
        if (sendBtn0?.disabled) return;
        const mEl = document.getElementById("supportFormMessage");
        if (mEl) {
          mEl.textContent = "";
          mEl.className = "form-message";
        }
        const text = (document.getElementById("supportMessage")?.value || "").trim();
        if (!text) {
          if (mEl) {
            mEl.textContent = t("supportEmpty");
            mEl.className = "form-message error";
          }
          return;
        }
        const u = auth.currentUser;
        if (!u) return;
        const sBtn = document.getElementById("supportSendBtn");
        if (sBtn) sBtn.disabled = true;
        try {
          const udoc = await getDoc(doc(db, "users", u.uid));
          const udata = udoc.exists() ? udoc.data() : {};
          await addDoc(collection(db, "supportTickets"), {
            userId: u.uid,
            message: text,
            userEmail: typeof udata.email === "string" ? udata.email : u.email || "",
            username: typeof udata.username === "string" ? udata.username : "",
            status: "queued",
            wantsAgent: true,
            source: "account",
            createdAt: serverTimestamp()
          });
          if (mEl) {
            mEl.textContent = t("supportOk");
            mEl.className = "form-message success";
          }
          const ta = document.getElementById("supportMessage");
          if (ta) ta.value = "";
        } catch (e) {
          console.warn(e);
          if (mEl) {
            mEl.textContent = t("supportError");
            mEl.className = "form-message error";
          }
        }
        if (sBtn) sBtn.disabled = false;
      });

      document.getElementById("supportFaqList")?.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-faq-idx]");
        if (!btn || btn.disabled) return;
        const n = parseInt(btn.getAttribute("data-faq-idx") || "-1", 10);
        if (n < 0) return;
        runSupportFaqFromIndex(n);
      });

      function setAccountSupportOpen(open) {
        const panel = document.getElementById("accountSupportPanel");
        const backdrop = document.getElementById("accountSupportBackdrop");
        const fab = document.getElementById("accountSupportFab");
        if (!panel || !backdrop || !fab) return;
        if (open) {
          panel.classList.remove("hidden");
          backdrop.classList.remove("hidden");
          backdrop.setAttribute("aria-hidden", "false");
          fab.setAttribute("aria-expanded", "true");
          document.body.style.overflow = "hidden";
          resetAccountSupportState();
          requestAnimationFrame(() => {
            document.querySelector("#supportFaqList [data-faq-idx]")?.focus();
          });
        } else {
          supportFaqSeq += 1;
          panel.classList.add("hidden");
          backdrop.classList.add("hidden");
          backdrop.setAttribute("aria-hidden", "true");
          fab.setAttribute("aria-expanded", "false");
          document.body.style.overflow = "";
          requestAnimationFrame(() => fab.focus());
        }
      }

      document.getElementById("accountSupportFab")?.addEventListener("click", () => {
        const panel = document.getElementById("accountSupportPanel");
        if (!panel) return;
        const willOpen = panel.classList.contains("hidden");
        setAccountSupportOpen(willOpen);
      });
      document.getElementById("accountSupportClose")?.addEventListener("click", () => {
        setAccountSupportOpen(false);
      });
      document.getElementById("accountSupportBackdrop")?.addEventListener("click", () => {
        setAccountSupportOpen(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        const panel = document.getElementById("accountSupportPanel");
        if (panel && !panel.classList.contains("hidden")) {
          e.preventDefault();
          setAccountSupportOpen(false);
        }
      });

      document.getElementById("logoutBtn")?.addEventListener("click", async () => {
        try {
          await authSignOut(auth);
        } catch {
          /* ignore */
        }
        window.location.href = "./index.html";
      });
    }

    renderWishlist();
    renderHistory();
    setupActiveOrders(user, digits);
  });
  });
}
