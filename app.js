import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { initCardifyAuthPersistence } from "./cardify-auth-persistence.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBffpkUGb2z8J1o2xp8IsnFDDt1X0yxdPI",
  authDomain: "cardify-4ee15.firebaseapp.com",
  projectId: "cardify-4ee15",
  storageBucket: "cardify-4ee15.firebasestorage.app",
  messagingSenderId: "544742568264",
  appId: "1:544742568264:web:45d25efdee5bd4dbf7c37d",
  measurementId: "G-940GHMF49K"
};

const app = initializeApp(firebaseConfig);
try {
  getAnalytics(app);
} catch (e) {
  console.warn("analytics unavailable", e);
}
const auth = getAuth(app);
const cardifyAuthReady = initCardifyAuthPersistence(auth).catch((e) => {
  console.warn("auth persistence", e);
});
const db = getFirestore(app);

const CARDIFY_PHONE_STORAGE_KEY = "cardifySenegalPhone";

/** Must match firestore.rules isCardifyAdmin() and admin-orders.js CARDIFY_ADMIN_EMAILS */
const CARDIFY_ADMIN_EMAIL = "ndoyesami2@gmail.com";

function normalizeSenegalMobile(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.startsWith("221") && d.length >= 12) d = d.slice(3);
  if (d.length === 10 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 9 && /^[37]\d{8}$/.test(d)) return d;
  return null;
}

const dictionary = {
  en: {
    htmlLang: "en",
    docTitle: "Cardify",
    signInMain: "Sign In",
    wordBuy: "Buy",
    wordReceive: "Receive",
    wordSpend: "Spend",
    wordBuyLoop: "Buy",
    heroFixed: "with Cardify",
    heroTagline: "and play like a real gamer",
    langMenuEn: "English",
    langMenuFr: "French",
    langToggleAria: "Choose language",
    closeAria: "Close",
    tabSignIn: "Sign In",
    tabCreate: "Create Account",
    signInTitle: "Sign In",
    signInKicker: "Welcome back",
    labelSignInEmail: "Email",
    labelSignInPassword: "Password",
    signInSubmitBtn: "Sign In",
    createTitle: "How should we call you?",
    createKicker: "Create account",
    createContactTitle: "Can we please get your contact?",
    createPasswordKicker: "Secure your account",
    createPasswordTitle: "Create your password",
    createTermsKicker: "Before you can start",
    createTermsTitle: "Please accept our terms and conditions",
    createNextBtn: "Next",
    authSideTitle: "Buy cards faster.",
    authSideText: "Sign in or create your account with a clean purple and black Cardify experience.",
    labelUsername: "Username",
    labelFullName: "Full Name",
    labelCreatePhone: "Senegal mobile (9 digits)",
    labelCreateEmail: "Email",
    labelCreatePassword: "Password",
    labelConfirmPassword: "Confirm Password",
    createSubmitBtn: "Create",
    themeDark: "Dark mode",
    themeLight: "Light mode",
    overflowAria: "More options",
    acceptTermsPart1: "By clicking this box you accept the ",
    acceptTermsLinkText: "terms and conditions of Cardify",
    acceptTermsRequired: "Please accept the terms and conditions to create an account.",
    termsFooterLink: "Terms and conditions",
    termsFooterTosLink: "Terms of Service",
    brandsMarqueeHeading: "Gift cards we sell",
    indexSearchPlaceholder: "Check out our cards",
    indexSearchAria: "Search cards",
    indexSearchEmpty: "No cards found.",
    indexAddToCart: "Add to cart",
    indexSignInToCart: "Sign in or create an account to add cards to your cart.",
    adminEntrySignInHint: "Sign in with the shop administrator account to open the admin dashboard.",
    adminEntryWrongAccount: "This account is not the administrator. Sign out, then sign in with the admin account."
  },
  fr: {
    htmlLang: "fr",
    docTitle: "Cardify",
    signInMain: "Se connecter",
    wordBuy: "Acheter",
    wordReceive: "Recevoir",
    wordSpend: "Depenser",
    wordBuyLoop: "Acheter",
    heroFixed: "avec Cardify",
    heroTagline: "et jouez comme un vrai gamer",
    langMenuEn: "Anglais",
    langMenuFr: "Français",
    langToggleAria: "Choisir la langue",
    closeAria: "Fermer",
    tabSignIn: "Se connecter",
    tabCreate: "Créer un compte",
    signInTitle: "Se connecter",
    signInKicker: "Bon retour",
    labelSignInEmail: "E-mail",
    labelSignInPassword: "Mot de passe",
    signInSubmitBtn: "Se connecter",
    createTitle: "Comment devons-nous vous appeler ?",
    createKicker: "Créer un compte",
    createContactTitle: "Pouvez-vous nous donner votre contact ?",
    createPasswordKicker: "Sécurisez votre compte",
    createPasswordTitle: "Créez votre mot de passe",
    createTermsKicker: "Avant de commencer",
    createTermsTitle: "Veuillez accepter nos conditions générales",
    createNextBtn: "Suivant",
    authSideTitle: "Achetez vos cartes plus vite.",
    authSideText: "Connectez-vous ou créez votre compte avec une expérience Cardify violette et noire.",
    labelUsername: "Nom d'utilisateur",
    labelFullName: "Nom complet",
    labelCreatePhone: "Mobile Sénégal (9 chiffres)",
    labelCreateEmail: "E-mail",
    labelCreatePassword: "Mot de passe",
    labelConfirmPassword: "Confirmer le mot de passe",
    createSubmitBtn: "Créer",
    themeDark: "Mode sombre",
    themeLight: "Mode clair",
    overflowAria: "Plus d'options",
    acceptTermsPart1: "En cochant cette case, vous acceptez les ",
    acceptTermsLinkText: "conditions générales de Cardify",
    acceptTermsRequired: "Veuillez accepter les conditions générales pour créer un compte.",
    termsFooterLink: "Conditions générales",
    termsFooterTosLink: "Conditions d’utilisation",
    brandsMarqueeHeading: "Cartes cadeaux que nous vendons",
    indexSearchPlaceholder: "Découvrez nos cartes",
    indexSearchAria: "Rechercher des cartes",
    indexSearchEmpty: "Aucune carte trouvée.",
    indexAddToCart: "Ajouter au panier",
    indexSignInToCart: "Connectez-vous ou créez un compte pour ajouter des cartes au panier.",
    adminEntrySignInHint: "Connectez-vous avec le compte administrateur de la boutique pour accéder à l’espace d’administration.",
    adminEntryWrongAccount: "Ce compte n'est pas l'administrateur. Déconnectez-vous, puis connectez le compte admin."
  }
};

const idsToTranslate = [
  "openAuthBtn",
  "wordBuy",
  "wordReceive",
  "wordSpend",
  "wordBuyLoop",
  "heroFixed",
  "heroTagline",
  "langMenuEn",
  "langMenuFr",
  "tabSignIn",
  "tabCreate",
  "signInKicker",
  "signInTitle",
  "labelSignInEmail",
  "labelSignInPassword",
  "signInSubmitBtn",
  "createTitle",
  "createKicker",
  "createContactTitle",
  "createPasswordKicker",
  "createPasswordTitle",
  "createTermsKicker",
  "createTermsTitle",
  "authSideTitle",
  "authSideText",
  "labelUsername",
  "labelFullName",
  "labelCreatePhone",
  "labelCreateEmail",
  "labelCreatePassword",
  "labelConfirmPassword",
  "createSubmitBtn",
  "brandsMarqueeHeading"
];

const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");
const langOptions = document.querySelectorAll(".lang-option");

const authModalBackdrop = document.getElementById("authModalBackdrop");
const openAuthBtn = document.getElementById("openAuthBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const tabSignIn = document.getElementById("tabSignIn");
const tabCreate = document.getElementById("tabCreate");
const signInForm = document.getElementById("signInForm");
const createForm = document.getElementById("createForm");
const signInMessage = document.getElementById("signInMessage");
const createMessage = document.getElementById("createMessage");
const indexCardSearch = document.getElementById("indexCardSearch");
const indexSearchResults = document.getElementById("indexSearchResults");
const indexListingCount = document.getElementById("indexListingCount");

const signInEmail = document.getElementById("signInEmail");
const signInPassword = document.getElementById("signInPassword");

const username = document.getElementById("username");
const fullName = document.getElementById("fullName");
const createEmail = document.getElementById("createEmail");
const createPassword = document.getElementById("createPassword");
const confirmPassword = document.getElementById("confirmPassword");
const createPhone = document.getElementById("createPhone");
const createSteps = Array.from(document.querySelectorAll("[data-create-step]"));
const createHelloName = document.getElementById("createHelloName");

let currentLang = "en";
let currentCreateStep = 0;

function showCreateStep(step) {
  currentCreateStep = Math.max(0, Math.min(step, createSteps.length - 1));
  createSteps.forEach((section, i) => {
    section.classList.toggle("hidden", i !== currentCreateStep);
  });
  if (createHelloName) {
    createHelloName.textContent = fullName?.value.trim() || username?.value.trim() || "there";
  }
  setMessage(createMessage, "");
}

function validateCreateStep(step) {
  const section = createSteps[step];
  if (!section) return true;
  const fields = Array.from(section.querySelectorAll("input[required]"));
  for (const field of fields) {
    if (!field.reportValidity()) return false;
  }
  if (step === 1 && !normalizeSenegalMobile(createPhone?.value || "")) {
    createPhone?.setCustomValidity(
      currentLang === "fr" ? "Numéro mobile sénégalais invalide." : "Invalid Senegal mobile number."
    );
    createPhone?.reportValidity();
    createPhone?.setCustomValidity("");
    return false;
  }
  if (step === 2 && createPassword.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity(currentLang === "fr" ? "Les mots de passe ne correspondent pas." : "Passwords do not match.");
    confirmPassword.reportValidity();
    confirmPassword.setCustomValidity("");
    return false;
  }
  return true;
}

function formatFcfa(value) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
  if (!Number.isFinite(n)) return "— FCFA";
  return `${n.toLocaleString()} FCFA`;
}

function assetPath(rel) {
  if (!rel) return "";
  const s = String(rel).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const clean = s.replace(/^\.?\//, "");
  return "./" + clean.split("/").map((seg) => encodeURIComponent(seg)).join("/");
}

function searchableListingText(item) {
  const platformLabel = typeof window.CardifyPlatformLabel === "function" ? window.CardifyPlatformLabel(item.platform) : "";
  return [item.title, item.amount, item.platform, platformLabel, item.region].join(" ").toLowerCase();
}

function renderIndexSearchResults() {
  if (!indexCardSearch || !indexSearchResults) return;
  const q = indexCardSearch.value.trim().toLowerCase();
  const all = Array.isArray(window.CardifyListings) ? window.CardifyListings : [];
  if (!q) {
    indexSearchResults.classList.add("hidden");
    indexSearchResults.innerHTML = "";
    return;
  }
  const visible = all.filter((item) => searchableListingText(item).includes(q)).slice(0, 6);
  if (!visible.length) {
    indexSearchResults.innerHTML = `<p class="index-search-empty">${dictionary[currentLang].indexSearchEmpty}</p>`;
  } else {
    indexSearchResults.innerHTML = visible
      .map((item, i) => {
        const thumb = item.image
          ? `<img src="${assetPath(item.image)}" alt="" loading="lazy" decoding="async" />`
          : `<span>${String(item.title || "Card").charAt(0)}</span>`;
        return `<article class="index-search-card"><div class="index-search-thumb">${thumb}</div><div class="index-search-copy"><strong>${item.title}</strong><span>${item.amount || ""} · ${formatFcfa(item.fcfa)}</span></div><button type="button" class="index-search-add" data-index-search-add="${i}">${dictionary[currentLang].indexAddToCart}</button></article>`;
      })
      .join("");
    indexSearchResults.querySelectorAll("[data-index-search-add]").forEach((btn) => {
      btn.addEventListener("click", () => {
        try {
          sessionStorage.setItem("cardifyAuthMessage", dictionary[currentLang].indexSignInToCart);
        } catch {}
        window.location.href = "./auth.html";
      });
    });
  }
  indexSearchResults.classList.remove("hidden");
}

function syncIndexListingCount() {
  if (!indexListingCount) return;
  const all = Array.isArray(window.CardifyListings) ? window.CardifyListings : [];
  indexListingCount.textContent = String(all.length);
  if (!all.length) {
    setTimeout(() => {
      const retryListings = Array.isArray(window.CardifyListings) ? window.CardifyListings : [];
      if (retryListings.length) indexListingCount.textContent = String(retryListings.length);
    }, 250);
  }
}

function getAuthErrorMessage(errorCode) {
  const messages = {
    en: {
      "auth/configuration-not-found":
        "Firebase Auth is not configured. In Firebase Console > Authentication > Sign-in method, enable Email/Password and add localhost in Authorized domains.",
      "auth/email-already-in-use": "This email is already used by another account.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Password should be at least 6 characters.",
      "auth/invalid-credential": "Wrong email or password.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Wrong email or password."
    },
    fr: {
      "auth/configuration-not-found":
        "Firebase Auth n'est pas configure. Dans Firebase Console > Authentication > Sign-in method, active Email/Password et ajoute localhost dans Authorized domains.",
      "auth/email-already-in-use": "Cet e-mail est deja utilise par un autre compte.",
      "auth/invalid-email": "Veuillez entrer une adresse e-mail valide.",
      "auth/weak-password": "Le mot de passe doit contenir au moins 6 caracteres.",
      "auth/invalid-credential": "E-mail ou mot de passe incorrect.",
      "auth/user-not-found": "Aucun compte trouve avec cet e-mail.",
      "auth/wrong-password": "E-mail ou mot de passe incorrect."
    }
  };
  return messages[currentLang][errorCode] || errorCode;
}

function setMessage(el, text, type = "") {
  el.textContent = text;
  el.classList.remove("error", "success");
  if (type) {
    el.classList.add(type);
  }
}

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("cardifyLanguage", lang);
  const t = dictionary[lang];
  document.documentElement.lang = t.htmlLang;
  document.title = t.docTitle || "Cardify";

  idsToTranslate.forEach((id) => {
    const element = document.getElementById(id);
    if (element && t[id]) {
      element.textContent = t[id];
    }
  });

  const langToggleEl = document.getElementById("langToggle");
  if (langToggleEl && t.langToggleAria) {
    langToggleEl.setAttribute("aria-label", t.langToggleAria);
  }
  const langToggleFlag = langToggleEl?.querySelector(".lang-toggle-flag");
  if (langToggleFlag) {
    langToggleFlag.src = lang === "fr" ? "./france.png" : "./USA.png";
  }
  const closeBtn = document.getElementById("closeModalBtn");
  if (closeBtn && t.closeAria) {
    closeBtn.setAttribute("aria-label", t.closeAria);
  }
  const overflowBtn = document.getElementById("overflowMenuBtn");
  if (overflowBtn && t.overflowAria) {
    overflowBtn.setAttribute("aria-label", t.overflowAria);
  }
  syncThemeMenuLabel();
  const part1 = document.getElementById("acceptTermsPart1");
  const termsA = document.getElementById("acceptTermsLink");
  if (part1) part1.textContent = t.acceptTermsPart1;
  if (termsA) {
    termsA.textContent = t.acceptTermsLinkText;
    termsA.href = `./terms.html?lang=${lang}`;
  }
  const footerTerms = document.getElementById("siteFooterTermsLink");
  if (footerTerms && t.termsFooterLink) {
    footerTerms.textContent = t.termsFooterLink;
    footerTerms.href = `./terms.html?lang=${lang}`;
  }
  const footerTos = document.getElementById("siteFooterTosLink");
  if (footerTos && t.termsFooterTosLink) {
    footerTos.textContent = t.termsFooterTosLink;
    footerTos.href = `./terms.html?lang=${lang}`;
  }
  const indexSearchLabel = document.getElementById("indexSearchLabel");
  if (indexCardSearch) {
    indexCardSearch.placeholder = t.indexSearchPlaceholder;
    indexCardSearch.setAttribute("aria-label", t.indexSearchAria);
  }
  if (indexSearchLabel) indexSearchLabel.textContent = t.indexSearchAria;
  document.querySelectorAll(".create-next-btn").forEach((btn) => {
    btn.textContent = t.createNextBtn || "Next";
  });
  renderIndexSearchResults();
  syncIndexListingCount();
  try {
    const authMessage = sessionStorage.getItem("cardifyAuthMessage");
    if (authMessage && document.body.classList.contains("auth-page") && signInMessage) {
      setMessage(signInMessage, authMessage, "");
      sessionStorage.removeItem("cardifyAuthMessage");
    }
  } catch {}
}

function isDarkTheme() {
  try {
    return localStorage.getItem("cardifyTheme") !== "light";
  } catch {
    return true;
  }
}

function setDarkTheme(on) {
  try {
    if (on) localStorage.removeItem("cardifyTheme");
    else localStorage.setItem("cardifyTheme", "light");
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle("cardify-dark", !!on);
  syncThemeMenuLabel();
}

function syncThemeMenuLabel() {
  const btn = document.getElementById("themeToggleBtn");
  if (!btn) return;
  const t = dictionary[currentLang];
  btn.textContent = isDarkTheme() ? t.themeLight : t.themeDark;
}

function openModal() {
  authModalBackdrop.classList.remove("hidden");
}

function closeModal() {
  if (document.body.classList.contains("auth-page")) {
    window.location.href = "./index.html";
    return;
  }
  authModalBackdrop.classList.add("hidden");
  setMessage(signInMessage, "");
  setMessage(createMessage, "");
}

function showSignIn() {
  signInForm.classList.remove("hidden");
  createForm.classList.add("hidden");
  tabSignIn.classList.add("active");
  tabCreate.classList.remove("active");
  setMessage(signInMessage, "");
  setMessage(createMessage, "");
}

function showCreate() {
  createForm.classList.remove("hidden");
  signInForm.classList.add("hidden");
  tabCreate.classList.add("active");
  tabSignIn.classList.remove("active");
  showCreateStep(0);
  setMessage(signInMessage, "");
  setMessage(createMessage, "");
}

langToggle.addEventListener("click", () => {
  langMenu.classList.toggle("hidden");
});

langOptions.forEach((button) => {
  button.addEventListener("click", () => {
    const selected = button.dataset.lang;
    applyLanguage(selected);
    langMenu.classList.add("hidden");
  });
});

const overflowMenuBtn = document.getElementById("overflowMenuBtn");
const overflowMenuPanel = document.getElementById("overflowMenuPanel");
const themeToggleBtn = document.getElementById("themeToggleBtn");

overflowMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const willOpen = overflowMenuPanel?.classList.contains("hidden");
  overflowMenuPanel?.classList.toggle("hidden");
  overflowMenuBtn?.setAttribute("aria-expanded", willOpen ? "true" : "false");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest("#languageSwitcher")) {
    langMenu.classList.add("hidden");
  }
  if (!event.target.closest("#overflowMenuRoot")) {
    overflowMenuPanel?.classList.add("hidden");
    overflowMenuBtn?.setAttribute("aria-expanded", "false");
  }
});

themeToggleBtn?.addEventListener("click", () => {
  setDarkTheme(!isDarkTheme());
  overflowMenuPanel?.classList.add("hidden");
  overflowMenuBtn?.setAttribute("aria-expanded", "false");
});

openAuthBtn?.addEventListener("click", () => {
  window.location.href = "./auth.html";
});

indexCardSearch?.addEventListener("input", renderIndexSearchResults);
indexCardSearch?.addEventListener("focus", renderIndexSearchResults);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".index-search-wrap")) {
    indexSearchResults?.classList.add("hidden");
  }
});

closeModalBtn.addEventListener("click", closeModal);
authModalBackdrop.addEventListener("click", (event) => {
  if (event.target === authModalBackdrop) {
    closeModal();
  }
});

tabSignIn.addEventListener("click", showSignIn);
tabCreate.addEventListener("click", showCreate);

document.querySelectorAll("[data-create-next]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!validateCreateStep(currentCreateStep)) return;
    showCreateStep(Number(button.dataset.createNext || currentCreateStep + 1));
  });
});

createForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateCreateStep(currentCreateStep)) return;
  await cardifyAuthReady;
  setMessage(createMessage, "");

  const acceptTerms = document.getElementById("acceptTerms");
  if (!acceptTerms?.checked) {
    setMessage(
      createMessage,
      dictionary[currentLang].acceptTermsRequired || "Please accept the terms and conditions.",
      "error"
    );
    return;
  }

  const senegalPhone = normalizeSenegalMobile(createPhone?.value || "");
  if (!senegalPhone) {
    setMessage(
      createMessage,
      currentLang === "fr"
        ? "Numéro mobile sénégalais invalide (9 chiffres, ex. 77 123 45 67 ou +221 …)."
        : "Invalid Senegal mobile number (9 digits, e.g. 77 123 45 67 or +221 …).",
      "error"
    );
    return;
  }

  if (createPassword.value !== confirmPassword.value) {
    setMessage(
      createMessage,
      currentLang === "fr" ? "Les mots de passe ne correspondent pas." : "Passwords do not match.",
      "error"
    );
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      createEmail.value.trim(),
      createPassword.value
    );

    await updateProfile(userCredential.user, {
      displayName: fullName.value.trim()
    });

    const emailLower = createEmail.value.trim().toLowerCase();
    const full = fullName.value.trim();

    await setDoc(doc(db, "users", userCredential.user.uid), {
      username: username.value.trim(),
      fullName: full,
      email: emailLower,
      language: currentLang,
      senegalPhone,
      termsAccepted: true,
      termsAcceptedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    /* Checkbox = acceptance: one row in `termsAndConditions` with legal name + email (not payments). */
    try {
      await addDoc(collection(db, "termsAndConditions"), {
        userId: userCredential.user.uid,
        fullName: full,
        email: emailLower,
        acceptedTerms: true,
        language: currentLang,
        createdAt: serverTimestamp()
      });
    } catch (termsErr) {
      console.warn("termsAndConditions write failed (deploy firestore.rules):", termsErr);
    }

    try {
      localStorage.setItem(CARDIFY_PHONE_STORAGE_KEY, senegalPhone);
      localStorage.setItem("cardifyEmail", emailLower);
      localStorage.setItem("cardifyFullName", full);
    } catch {
      /* ignore */
    }

    setMessage(
      createMessage,
      currentLang === "fr" ? "Compte cree. Redirection..." : "Account created. Redirecting...",
      "success"
    );

    setTimeout(() => {
      localStorage.setItem("cardifyLanguage", currentLang);
      sessionStorage.setItem("showWelcome", "1");
      window.location.href = "./home.html";
    }, 800);
  } catch (error) {
    setMessage(createMessage, getAuthErrorMessage(error.code), "error");
  }
});

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await cardifyAuthReady;
  setMessage(signInMessage, "");

  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      signInEmail.value.trim(),
      signInPassword.value
    );

    const userRef = doc(db, "users", userCredential.user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      setMessage(
        signInMessage,
        currentLang === "fr"
          ? "Compte introuvable. Veuillez creer un compte."
          : "Account record not found. Please create an account first.",
        "error"
      );
      return;
    }

    const ud = userDoc.data();
    if (ud && ud.banned === true) {
      await signOut(auth);
      setMessage(
        signInMessage,
        currentLang === "fr"
          ? "Ce compte est suspendu. Un administrateur doit le réactiver."
          : "This account is suspended. An admin must reinstate it before you can sign in.",
        "error"
      );
      return;
    }
    if (ud && typeof ud.senegalPhone === "string" && /^[37]\d{8}$/.test(ud.senegalPhone)) {
      try {
        localStorage.setItem(CARDIFY_PHONE_STORAGE_KEY, ud.senegalPhone);
      } catch {
        /* ignore */
      }
    }
    if (ud && typeof ud.fullName === "string" && ud.fullName.trim().length) {
      try {
        localStorage.setItem("cardifyFullName", ud.fullName.trim().slice(0, 200));
      } catch {
        /* ignore */
      }
    }

    const signedInEmail = (userCredential.user.email || "").toLowerCase();
    try {
      localStorage.setItem("cardifyEmail", signedInEmail);
    } catch {
      /* ignore */
    }
    const toAdmin = signedInEmail === CARDIFY_ADMIN_EMAIL.toLowerCase();
    setMessage(
      signInMessage,
      toAdmin
        ? currentLang === "fr"
          ? "Connexion admin. Redirection…"
          : "Signed in. Redirecting to admin…"
        : currentLang === "fr"
          ? "Connexion reussie. Redirection..."
          : "Sign in successful. Redirecting...",
      "success"
    );

    setTimeout(() => {
      localStorage.setItem("cardifyLanguage", currentLang);
      if (toAdmin) {
        window.location.href = "./admin-orders.html";
      } else {
        sessionStorage.setItem("showWelcome", "1");
        window.location.href = "./home.html";
      }
    }, 700);
  } catch (error) {
    setMessage(signInMessage, getAuthErrorMessage(error.code), "error");
  }
});

applyLanguage(localStorage.getItem("cardifyLanguage") || "en");

const entryParams0 = new URLSearchParams(window.location.search);
if (entryParams0.get("banned") === "1") {
  const lang0 = localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
  setMessage(
    signInMessage,
    lang0 === "fr"
      ? "Compte suspendu. Seul un administrateur peut le réactiver."
      : "This account is suspended. Only an admin can reinstate it.",
    "error"
  );
} else {
  void cardifyAuthReady.then(() => {
    if (new URLSearchParams(window.location.search).get("admin") === "1") {
      const unsub = onAuthStateChanged(auth, (user) => {
        unsub();
        if (user && (user.email || "").toLowerCase() === CARDIFY_ADMIN_EMAIL.toLowerCase()) {
          window.location.replace("./admin-orders.html");
          return;
        }
        openModal();
        showSignIn();
        const t = dictionary[currentLang] || dictionary.en;
        if (user) {
          setMessage(signInMessage, t.adminEntryWrongAccount, "error");
        } else {
          setMessage(signInMessage, t.adminEntrySignInHint, "");
        }
      });
    }
  });
}
