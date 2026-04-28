/**
 * Listing page: Support flow — local assistant, then human queue, then live Firestore chat.
 */
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { initCardifyAuthPersistence } from "./cardify-auth-persistence.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  orderBy,
  limit,
  query,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const L = (en, fr) => (localStorage.getItem("cardifyLanguage") === "fr" ? fr : en);

function getBotReply(text) {
  const t = (text || "").toLowerCase();
  const isFr = localStorage.getItem("cardifyLanguage") === "fr";
  if (t.length < 2) {
    return isFr
      ? "Demandez-moi le numéro de commande, le paiement ou la livraison — je peux aider, ou parlez à un humain."
      : "Ask about your order, payment, or delivery — I can help, or use “Talk to a support agent” below.";
  }
  if (/hello|hi |hey|bonjour|salut|coucou/.test(t)) {
    return isFr ? "Salut. Je suis l’assistant Cardify. Comment je peux vous aider ?" : "Hi — I’m the Cardify assistant. How can I help?";
  }
  if (/(order|commande|achat|cart|panier)/.test(t)) {
    return isFr
      ? "Les commandes passées connecté apparaissent dans Compte. Invité = pas lié au compte."
      : "Orders you place while signed in show under Account. Guest checkouts are not linked.";
  }
  if (/(refund|rembours|money back|argent|wave|orange|card|pay)/.test(t)) {
    return isFr
      ? "Paiement : Wave, Orange Money ou carte. Problème après paiement ? Un agent peut vérifier — cliquez « parler à un humain »."
      : "We use Wave, Orange Money, and cards. If something’s wrong with a charge, use “Talk to a support agent” below.";
  }
  if (/(deliver|livr|code|gift|gif)/.test(t)) {
    return isFr
      ? "Les codes sont envoyés quand l’équipe confirme. Statut = « en attente » sur Commandes dans Compte."
      : "Codes are sent after the shop confirms your order. Check status under Account → My orders.";
  }
  if (/(human|agent|person|personne|employé|humain)/.test(t)) {
    return isFr
      ? "Utilisez le bouton « parler à un membre de l’équipe » pour faire la file auprès d’un vrai membre de l’équipe."
      : "Use “Talk to a support agent” to queue for a real team member — they can take over from me.";
  }
  return isFr
    ? "Je suis un assistant automatique (pas d’IA cloud). Si vous voulez l’équipe, cliquez « parler à un membre de l’équipe »."
    : "I’m an automated on-page helper. For a real person, use “Talk to a support agent” and we’ll get you in the queue.";
}

const LS_TICKET = "cardifyActiveSupportTicketId";

const cfg = window.__CARDIFY_FIREBASE_CONFIG__;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

if (cfg) {
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const auth = getAuth(app);
  const cardifyAuthReady = initCardifyAuthPersistence(auth).catch((e) => {
    console.warn("auth persistence", e);
  });
  const db = getFirestore(app);
  let userRef = null;
  let supportOverlay = null;
  let unsubTicket = null;
  let unsubChat = null;

  function clearTicketListeners() {
    if (unsubTicket) {
      unsubTicket();
      unsubTicket = null;
    }
    if (unsubChat) {
      unsubChat();
      unsubChat = null;
    }
  }

  function removeOverlay() {
    clearTicketListeners();
    if (supportOverlay) {
      supportOverlay.remove();
      supportOverlay = null;
    }
  }

  function appendBotLine(author, text, root) {
    const log = root?.querySelector("#cardifySupBotLog");
    if (!log) return;
    const p = document.createElement("p");
    p.className = "cardify-supp-line";
    p.innerHTML = `<span class="cardify-supp-author">${esc(author)}</span> <span class="cardify-supp-bubble">${esc(
      text
    ).replace(/\n/g, "<br>")}</span>`;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  function appendUserLine(author, text) {
    const el = document.getElementById("cardifyUserChatLog");
    if (!el) return;
    const p = document.createElement("p");
    p.className = "cardify-chat-line";
    p.innerHTML = `<span class="cardify-supp-author">${esc(author)}</span> <span class="cardify-supp-bubble chat">${esc(
      text
    ).replace(/\n/g, "<br>")}</span>`;
    el.appendChild(p);
    el.scrollTop = el.scrollHeight;
  }

  async function sendUserMessage(tid, text) {
    if (!userRef) return;
    await addDoc(collection(db, "supportTickets", tid, "chatMessages"), {
      text,
      from: "user",
      senderId: userRef.uid,
      createdAt: serverTimestamp()
    });
  }

  async function mountLiveChat(overlay, root, ticketId) {
    const chatMount = document.createElement("div");
    chatMount.className = "cardify-supp-stage";
    chatMount.id = "cardifyLiveChatMount";
    chatMount.innerHTML = `<p class="cardify-supp-waiting">${L(
      "An agent is connected. Messages appear below.",
      "Un membre de l’équipe est connecté. Vos messages ci-dessous."
    )}</p>
<div class="cardify-user-chatlog" id="cardifyUserChatLog"></div>
<div class="cardify-chat-composer">
  <input type="text" id="cardifyChatInput" class="admin-user-search" placeholder="${L("Type a message…", "Votre message…")}" maxlength="2000" />
  <button type="button" class="primary-btn" id="cardifyChatSend">${L("Send", "Envoyer")}</button>
</div>`;
    root.appendChild(chatMount);
    const cq = query(
      collection(db, "supportTickets", ticketId, "chatMessages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    if (unsubChat) unsubChat();
    unsubChat = onSnapshot(cq, (snap) => {
      const el = document.getElementById("cardifyUserChatLog");
      if (!el) return;
      if (snap.empty) {
        el.innerHTML = "";
        return;
      }
      el.innerHTML = "";
      snap.forEach((d) => {
        const m = d.data();
        const who = m.from === "admin" ? (L("Support", "Assistance")) : (L("You", "Vous"));
        const when = m.createdAt?.toDate
          ? m.createdAt.toDate().toLocaleTimeString()
          : "";
        const line = document.createElement("p");
        line.className = "cardify-chat-line";
        line.innerHTML = `<span class="cardify-supp-time">${esc(when)}</span> <span class="cardify-supp-author">${esc(
          who
        )}</span> <span class="cardify-supp-bubble chat">${esc(m.text || "").replace(/\n/g, "<br>")}</span>`;
        el.appendChild(line);
      });
      el.scrollTop = el.scrollHeight;
    });

    const send = () => {
      const input = document.getElementById("cardifyChatInput");
      const t = (input?.value || "").trim();
      if (!t) return;
      input.value = "";
      sendUserMessage(ticketId, t);
    };
    document.getElementById("cardifyChatSend")?.addEventListener("click", send);
    document.getElementById("cardifyChatInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") send();
    });
  }

  function watchTicketStage(overlay, root, ticketId) {
    if (unsubTicket) unsubTicket();
    unsubTicket = onSnapshot(
      doc(db, "supportTickets", ticketId),
      (d) => {
        if (!d.exists()) return;
        const s = d.data();
        if (s.status === "active") {
          try {
            localStorage.setItem(LS_TICKET, ticketId);
          } catch {
            /* ignore */
          }
          if (!document.getElementById("cardifyLiveChatMount")) {
            const waitEl = document.getElementById("cardifyQueueWait");
            if (waitEl) waitEl.remove();
            mountLiveChat(overlay, root, ticketId);
          }
        }
      },
      (e) => console.warn("ticket", e)
    );
  }

  async function queueForHuman(overlay, root) {
    if (!userRef) {
      window.location.href = "./index.html";
      return;
    }
    const wait = document.getElementById("cardifyQueueWait");
    if (wait) wait.classList.remove("hidden");
    await new Promise((r) => setTimeout(r, 2200));
    const p = userRef;
    const udoc = await getDoc(doc(db, "users", p.uid));
    const udata = udoc.exists() ? udoc.data() : {};
    const umsg = (document.getElementById("cardifyAgentNote")?.value || "").trim();
    const body = umsg
      ? umsg
      : L(
          "I want to talk to a support team member. (Request from the product page.)",
          "Je voudrais parler à l’équipe. (Demande depuis la page produit.)"
        );
    const ref = await addDoc(collection(db, "supportTickets"), {
      userId: p.uid,
      userEmail: typeof udata.email === "string" ? udata.email : p.email || "",
      username: typeof udata.username === "string" ? udata.username : "",
      message: body,
      status: "queued",
      wantsAgent: true,
      source: "listing",
      createdAt: serverTimestamp()
    });
    if (wait) {
      wait.innerHTML = `<p class="cardify-supp-waiting">${L(
        "Request sent. When an agent accepts, you can chat here — you can also close this and keep browsing; we use your account to reconnect.",
        "Demande envoyée. Quand un membre d’équipe accepte, le chat s’ouvre ici. Vous pouvez aussi fermer et revenir : votre compte permet de revenir en live."
      )}</p><p class="admin-orders-hint">${L(
        "We’ll notify the team. A member should join in a few minutes in busy periods.",
        "L’équipe est avertie. Sous charge, cela peut prendre quelques minutes."
      )}</p>`;
    }
    watchTicketStage(overlay, root, ref.id);
  }

  function openFlow() {
    if (!userRef) {
      alert(
        L("Please sign in (top of the home page) to get support and live chat.", "Veuillez vous connecter pour l’assistance et le chat.")
      );
      window.location.href = "./index.html";
      return;
    }
    removeOverlay();
    const bg = L("Cardify assistant (automated, not a cloud model)", "Assistant Cardify (automatique, sans cloud)");
    const agentBtn = L("Talk to a support team member", "Parler à un membre de l’équipe");
    const wait = L("Please wait a few seconds — a team member will be with you shortly. When someone accepts, you can chat right here.","Patientez — un membre de l’équipe vous rejoint. Quand c’est prêt, le chat s’ouvre ici." );
    supportOverlay = document.createElement("div");
    supportOverlay.className = "cardify-supp-overlay";
    supportOverlay.innerHTML = `<div class="cardify-supp-dialog" role="dialog" aria-modal="true" aria-labelledby="cardifySupH">
  <div class="cardify-supp-head">
    <h2 id="cardifySupH">${L("Support", "Assistance")}</h2>
    <button type="button" class="modal-admin__close" id="cardifySupClose" aria-label="Close">&times;</button>
  </div>
  <p class="admin-orders-hint">${L(
    "Try the quick assistant first. A human can take over for account or payment issues.",
    "D’abord l’assistant rapide. L’équipe peut reprendre pour compte ou paiement."
  )}</p>
  <div class="cardify-supp-body" id="cardifySupBody">
    <p class="admin-orders-hint">${esc(bg)}</p>
    <div class="cardify-supp-log" id="cardifySupBotLog"></div>
    <div class="cardify-bot-composer">
      <input type="text" class="admin-user-search" id="cardifyBotInput" maxlength="500" placeholder="${L("Ask a question…", "Posez une question…")}" />
      <button type="button" class="primary-btn" id="cardifyBotSend">${L("Send", "Envoyer")}</button>
    </div>
    <button type="button" class="btn-admin-ghost" id="cardifyToHuman" style="width:100%;margin-top:12px">${esc(agentBtn)}</button>
    <p class="admin-orders-hint" id="cardifyToHumanNote">${L(
      "Optional: describe your issue (shown to the team if you go human):",
      "Optionnel : décrivez le problème (sera partagé avec l’équipe) :"
    )}</p>
    <textarea class="admin-textarea-admin" id="cardifyAgentNote" rows="2" maxlength="2000" placeholder=""></textarea>
    <div class="cardify-supp-waiting hidden" id="cardifyQueueWait"><p class="admin-orders-hint">${esc(wait)}</p></div>
  </div>
</div>`;
    document.body.appendChild(supportOverlay);
    const root = supportOverlay.querySelector("#cardifySupBody");
    appendBotLine("Bot", L("How can I help? I’m not a cloud AI, but I try common answers. Or talk to a human.", "Comment aider ? Pas d’IA internet, seulement l’aide de base, ou l’équipe."), root);

    supportOverlay.querySelector("#cardifySupClose")?.addEventListener("click", () => {
      if (document.getElementById("cardifyLiveChatMount") && userRef) {
        /* keep session + listener if chat active; only hide overlay? User might want to minimize — keep simple: close removes overlay, chat unsub — user reopens to reconnect via LS */
        clearTicketListeners();
        supportOverlay.remove();
        supportOverlay = null;
        return;
      }
      removeOverlay();
    });
    const botSend = () => {
      const v = (document.getElementById("cardifyBotInput")?.value || "").trim();
      if (!v) return;
      document.getElementById("cardifyBotInput").value = "";
      appendBotLine("You", v, root);
      setTimeout(
        () => appendBotLine("Bot", getBotReply(v), root),
        500 + Math.min(500, v.length * 2)
      );
    };
    document.getElementById("cardifyBotSend")?.addEventListener("click", botSend);
    document.getElementById("cardifyBotInput")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") botSend();
    });
    document.getElementById("cardifyToHuman")?.addEventListener("click", () => queueForHuman(supportOverlay, root));
  }

  void cardifyAuthReady.then(() => {
  onAuthStateChanged(auth, (u) => {
    userRef = u;
    const btn = document.getElementById("listingSupportBtn");
    if (btn) {
      btn.disabled = false;
      if (!u) {
        btn.title = L("Sign in to get support", "Connectez-vous pour l’assistance");
      } else {
        btn.title = "";
      }
    }
    /* Resume if ticket active */
    if (u) {
      let tid;
      try {
        tid = localStorage.getItem(LS_TICKET);
      } catch {
        tid = null;
      }
      if (tid) {
        getDoc(doc(db, "supportTickets", tid)).then((d) => {
          if (d.exists() && d.data().userId === u.uid && d.data().status === "active") {
            if (!document.getElementById("cardifySessChat")) {
              const dock = document.createElement("div");
              dock.className = "cardify-sess-dock";
              dock.id = "cardifySessChat";
              dock.innerHTML = `<div class="cardify-sess-head"><strong>${L("Support chat", "Chat assistance")}</strong> <button type="button" class="text-link-btn" id="cardifySessExpand">${L("Open", "Ouvrir")}</button> <button type="button" class="text-link-btn" id="cardifySessDismiss">×</button></div>
<div class="cardify-sess-body hidden" id="cardifySessBody">
  <p class="admin-orders-hint" style="font-size:0.8rem">${L("An agent is connected. Type below.","Vous parlez à l’équipe. Écrivez ci-dessous.")}</p>
  <div class="cardify-user-chatlog" id="cardifySessUserChatLog"></div>
  <div class="cardify-chat-composer" style="margin-top:6px">
    <input type="text" class="admin-user-search" id="cardifySessIn" placeholder="${L("Type…", "Texte…")}" maxlength="2000" />
    <button type="button" class="primary-btn" id="cardifySessSend" style="width:auto;padding:10px 16px">OK</button>
  </div>
</div>`;
              document.body.appendChild(dock);
              const el = document.getElementById("cardifySessUserChatLog");
              const sub = onSnapshot(
                query(
                  collection(db, "supportTickets", tid, "chatMessages"),
                  orderBy("createdAt", "asc"),
                  limit(200)
                ),
                (snap) => {
                  if (!el) return;
                  el.innerHTML = "";
                  if (snap.empty) return;
                  snap.forEach((d) => {
                    const m = d.data();
                    const who = m.from === "admin" ? L("Support", "Assistance") : L("You", "Vous");
                    const p = document.createElement("p");
                    p.className = "cardify-chat-line";
                    p.innerHTML = `<span class="cardify-supp-author">${esc(who)}</span> <span class="cardify-supp-bubble chat">${esc(
                      m.text || ""
                    )}</span>`;
                    el.appendChild(p);
                  });
                  el.scrollTop = el.scrollHeight;
                }
              );
              document.getElementById("cardifySessExpand")?.addEventListener("click", () => {
                document.getElementById("cardifySessBody")?.classList.toggle("hidden");
              });
              document.getElementById("cardifySessSend")?.addEventListener("click", async () => {
                const i = document.getElementById("cardifySessIn");
                const t = (i?.value || "").trim();
                if (!t) return;
                if (i) i.value = "";
                await addDoc(collection(db, "supportTickets", tid, "chatMessages"), {
                  text: t,
                  from: "user",
                  senderId: u.uid,
                  createdAt: serverTimestamp()
                });
              });
              const sessUnsub = sub;
              document.getElementById("cardifySessDismiss")?.addEventListener("click", () => {
                if (typeof sessUnsub === "function") sessUnsub();
                try {
                  localStorage.removeItem(LS_TICKET);
                } catch {
                  /* ignore */
                }
                dock.remove();
              });
            }
          } else {
            try {
              localStorage.removeItem(LS_TICKET);
            } catch {
              /* ignore */
            }
          }
        });
      }
    }
  });
  });

  document.getElementById("listingSupportBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    openFlow();
  });
}
