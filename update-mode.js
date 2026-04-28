/**
 * Full-site maintenance overlay when config/site.updateMode is true.
 * Excluded on admin-orders.html (no script include there).
 * Pass "Ironm@n3" to unlock for this browser until update mode is turned off.
 */
import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const BYPASS_KEY = "cardify_update_bypass_v1";
const UNLOCK = "Ironm@n3";
const IG_HREF = "https://www.instagram.com/giftcardshopsn/";
const TT_HREF = "https://www.tiktok.com/@cardifysngiftcard";
const FIVE_MIN = 5 * 60 * 1000;
const STEP_PCT = 1;

const UM = {
  en: {
    title: "The website is having an update",
    sub: "The website is going to reopen in a little while. Please be patient.",
    adminOnly: "This is only for admins",
    passPlaceholder: "Access password",
    passLabel: "Access password",
    unlock: "Unlock",
    progress: (n) => `Progress: ${n}%`,
    langGroup: "Language",
    roleTitle: "Site update"
  },
  fr: {
    title: "Le site est en cours de mise à jour",
    sub: "Le site va rouvrir dans un court instant. Merci de patienter.",
    adminOnly: "Réservé aux administrateurs uniquement",
    passPlaceholder: "Mot de passe d'accès",
    passLabel: "Mot de passe d'accès",
    unlock: "Déverrouiller",
    progress: (n) => `Progression : ${n}%`,
    langGroup: "Langue",
    roleTitle: "Mise à jour du site"
  }
};

let progressTimer = null;
let currentOverlay = null;
let lastProgressP = 0;

function getUpdateModeLang() {
  try {
    return localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
  } catch (e) {
    return "en";
  }
}

function setUpdateModeLang(lang) {
  const l = lang === "fr" ? "fr" : "en";
  try {
    localStorage.setItem("cardifyLanguage", l);
  } catch (e) {
    /* */
  }
  return l;
}

function t() {
  return UM[getUpdateModeLang()];
}

function clearProgressTimer() {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function applyUpdateModeI18n(o) {
  const L = t();
  const h1 = o.querySelector("#cardifyUpdateTitle");
  const sub = o.querySelector("#cardifyUpdateSub");
  const admin = o.querySelector("#cardifyUpdateAdminHint");
  const pass = o.querySelector("#cardifyUpdatePass");
  const passLbl = o.querySelector("#cardifyUpdatePassLabel");
  const btn = o.querySelector("#cardifyUpdateUnlockBtn");
  const ptxt = o.querySelector("#cardifyUpdateProgressText");
  const gLabel = o.querySelector("#cardifyUpdateLangGroupLabel");
  const enB = o.querySelector("#cardifyUpdateLangEn");
  const frB = o.querySelector("#cardifyUpdateLangFr");
  if (h1) h1.textContent = L.title;
  if (sub) sub.textContent = L.sub;
  if (admin) admin.textContent = L.adminOnly;
  if (pass) pass.placeholder = L.passPlaceholder;
  if (passLbl) passLbl.textContent = L.passLabel;
  if (btn) btn.textContent = L.unlock;
  if (ptxt) ptxt.textContent = L.progress(lastProgressP);
  if (gLabel) gLabel.textContent = L.langGroup;
  o.setAttribute("aria-label", L.roleTitle);
  const la = getUpdateModeLang();
  if (enB) {
    enB.setAttribute("aria-pressed", la === "en" ? "true" : "false");
    enB.classList.toggle("is-active", la === "en");
  }
  if (frB) {
    frB.setAttribute("aria-pressed", la === "fr" ? "true" : "false");
    frB.classList.toggle("is-active", la === "fr");
  }
  const trk = o.querySelector("[data-update-progress]");
  if (trk) {
    trk.setAttribute("aria-label", L.progress(lastProgressP));
  }
  try {
    document.documentElement.setAttribute("lang", la);
  } catch (e) {
    /* */
  }
}

function setProgressUi(barFill, textEl) {
  lastProgressP = 0;
  const update = () => {
    if (barFill) {
      barFill.style.width = `${lastProgressP}%`;
      const track = barFill.parentElement;
      if (track) {
        track.setAttribute("aria-valuenow", String(lastProgressP));
        track.setAttribute("aria-label", t().progress(lastProgressP));
      }
    }
    if (textEl) textEl.textContent = t().progress(lastProgressP);
  };
  clearProgressTimer();
  update();
  progressTimer = setInterval(() => {
    lastProgressP = Math.min(100, lastProgressP + STEP_PCT);
    update();
  }, FIVE_MIN);
}

function buildOverlay() {
  const el = document.createElement("div");
  el.id = "cardifyUpdateModeOverlay";
  el.className = "cardify-update-mode";
  el.setAttribute("role", "alertdialog");
  el.setAttribute("aria-modal", "true");
  el.innerHTML = `
  <div class="cardify-update-mode__inner">
    <div class="cardify-update-mode__lang" role="group" aria-labelledby="cardifyUpdateLangGroupLabel">
      <span id="cardifyUpdateLangGroupLabel" class="cardify-update-mode__lang-label"></span>
      <div class="cardify-update-mode__lang-btns">
        <button type="button" class="cardify-update-mode__lang-btn is-active" id="cardifyUpdateLangEn" aria-pressed="true" lang="en">EN</button>
        <button type="button" class="cardify-update-mode__lang-btn" id="cardifyUpdateLangFr" aria-pressed="false" lang="fr">FR</button>
      </div>
    </div>
    <header class="cardify-update-mode__header">
      <h1 class="cardify-update-mode__title" id="cardifyUpdateTitle"></h1>
      <p class="cardify-update-mode__sub" id="cardifyUpdateSub"></p>
    </header>
    <div class="cardify-update-mode__bar-wrap">
      <p class="cardify-update-mode__bar-label" id="cardifyUpdateProgressText"></p>
      <div class="cardify-update-mode__bar-track" data-update-progress role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-label="">
        <div class="cardify-update-mode__bar-fill" id="cardifyUpdateBar"></div>
      </div>
    </div>
    <form class="cardify-update-mode__unlock" id="cardifyUpdateUnlockForm" autocomplete="off" onsubmit="return false">
      <p class="cardify-update-mode__admin-hint" id="cardifyUpdateAdminHint" role="note"></p>
      <div class="cardify-update-mode__top">
        <label for="cardifyUpdatePass" class="cardify-update-mode__visually-hidden" id="cardifyUpdatePassLabel">Access password</label>
        <input type="password" id="cardifyUpdatePass" class="cardify-update-mode__input" placeholder="" maxlength="200" />
        <button type="button" class="cardify-update-mode__btn" id="cardifyUpdateUnlockBtn">Unlock</button>
      </div>
    </form>
    <footer class="cardify-update-mode__social">
      <a class="cardify-update-mode__social-link" href="${IG_HREF}" target="_blank" rel="noopener noreferrer" title="Instagram">
        <span class="cardify-update-mode__ico" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg></span>
        <span>Instagram</span>
      </a>
      <a class="cardify-update-mode__social-link" href="${TT_HREF}" target="_blank" rel="noopener noreferrer" title="TikTok">
        <span class="cardify-update-mode__ico" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg></span>
        <span>TikTok</span>
      </a>
    </footer>
  </div>`;
  return el;
}

function showOverlay() {
  if (document.getElementById("cardifyUpdateModeOverlay")) return;
  const o = buildOverlay();
  currentOverlay = o;
  document.body.appendChild(o);
  const bar = o.querySelector("#cardifyUpdateBar");
  const txt = o.querySelector("#cardifyUpdateProgressText");
  setProgressUi(bar, txt);
  applyUpdateModeI18n(o);
  o.querySelector("#cardifyUpdateLangEn")?.addEventListener("click", () => {
    setUpdateModeLang("en");
    applyUpdateModeI18n(o);
  });
  o.querySelector("#cardifyUpdateLangFr")?.addEventListener("click", () => {
    setUpdateModeLang("fr");
    applyUpdateModeI18n(o);
  });
  const inp = o.querySelector("#cardifyUpdatePass");
  const btn = o.querySelector("#cardifyUpdateUnlockBtn");
  const tryUnlock = () => {
    if (!inp) return;
    if (inp.value === UNLOCK) {
      try {
        localStorage.setItem(BYPASS_KEY, "1");
      } catch (e) {
        /* */
      }
      clearProgressTimer();
      o.remove();
      currentOverlay = null;
      document.body.classList.remove("cardify--update-locked");
    } else {
      if (inp) {
        inp.value = "";
        inp.focus();
      }
    }
  };
  btn?.addEventListener("click", tryUnlock);
  inp?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      tryUnlock();
    }
  });
}

function hideAndClearBypass() {
  clearProgressTimer();
  if (currentOverlay) {
    try {
      currentOverlay.remove();
    } catch (e) {
      /* */
    }
    currentOverlay = null;
  } else {
    const el = document.getElementById("cardifyUpdateModeOverlay");
    if (el) el.remove();
  }
  try {
    localStorage.removeItem(BYPASS_KEY);
  } catch (e) {
    /* */
  }
  document.body.classList.remove("cardify--update-locked");
}

function isBypassed() {
  try {
    return localStorage.getItem(BYPASS_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function start() {
  const cfg = getCfg();
  if (!cfg) return;
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const db = getFirestore(app);
  const ref = doc(db, "config", "site");
  onSnapshot(
    ref,
    (snap) => {
      const on = snap.exists() && snap.data().updateMode === true;
      if (!on) {
        hideAndClearBypass();
        document.body.classList.remove("cardify--update-locked");
        return;
      }
      if (isBypassed()) {
        clearProgressTimer();
        const el = document.getElementById("cardifyUpdateModeOverlay");
        if (el) el.remove();
        currentOverlay = null;
        document.body.classList.remove("cardify--update-locked");
        return;
      }
      document.body.classList.add("cardify--update-locked");
      showOverlay();
    },
    (e) => {
      console.warn("update-mode listener", e);
    }
  );
}

function getCfg() {
  return window.__CARDIFY_FIREBASE_CONFIG__ || null;
}

start();
