/* global CardifyListings, CardifyCart */
const listings = window.CardifyListings;
const { getCart, setCart, addToCart, cartSelectedTotal, cartItemCount } = window.CardifyCart;
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
const dictionary = {
  en: {
    docTitle: "Cardify — Shop",
    welcomeText: "Welcome to Cardify",
    deviceTitle: "Device / platform",
    countryTitle: "Country",
    chipPs: "PlayStation",
    chipXbox: "Xbox",
    chipRoblox: "Roblox",
    chipEpic: "Epic Games",
    chipNintendo: "Nintendo",
    chipApple: "Apple",
    chipGooglePlay: "Google Play",
    chipFreeFire: "Free Fire",
    chipPUBG: "PUBG",
    chipUs: "United States",
    chipFr: "France",
    accountUsd: "Only for accounts in USD",
    accountEur: "Only for accounts in EUR",
    worldwide: "Worldwide",
    homeMainTitle: "Cardify Dashboard",
    cartDrawerTitle: "Cart",
    cartTotalLabel: "Total (selected)",
    addToCart: "Add to cart",
    allCategories: "All categories",
    noListings: "No listings found.",
    gameCards: "Game cards",
    giftCards: "Gift card",
    gameCardsList: "PlayStation, Xbox, Epic Games, Roblox, Nintendo eShop, Free Fire, PUBG",
    giftCardsList: "Apple, Google Play",
    emptyCart: "Your cart is empty.",
    checkout: "Checkout",
    langToggleAria: "Choose language",
    cartAria: "Cart",
    accountAria: "Account",
    searchPlaceholder: "Search gift cards, platforms, amounts…",
    searchAria: "Search gift cards",
    activityFeedBtn: "Blog",
    shopActivityHeading: "Blog",
    filters: "Filters",
    closeFilters: "Close filters",
    navHome: "Home",
    navCart: "Cart",
    navNotifications: "Notification",
    navBlog: "Blog",
    navSettings: "Settings",
    helloUser: "Hello {name} 👋",
    dashboardQuestion: "What are we doing today",
    profileFallback: "User",
    profileEmailFallback: "Open account",
    homeLanguageMenuLabel: "Language",
    homeSupportMenuItem: "Support",
    themeDark: "Dark mode",
    themeLight: "Light mode",
    settingsKicker: "Cardify settings",
    settingsTitle: "Settings",
    settingsThemeTitle: "Website theme",
    settingsThemeCopy: "Choose how Cardify should look on this device.",
    settingsDarkTitle: "Dark purple",
    settingsDarkCopy: "Matte black with purple glass.",
    settingsLightTitle: "Light",
    settingsLightCopy: "Clean bright mode.",
    settingsClose: "Close settings",
    securePaymentTitle: "Secured payment",
    securePaymentCopy: "Your transactions are 100% secured.",
    fastDeliveryTitle: "Fast delivery",
    fastDeliveryCopy: "Your code is going to be sent in less than 1 hour. If it takes longer, you can wait for the code or get a refund in the notification tab.",
    overflowAria: "More options",
    siteFooterTermsLink: "Terms and conditions",
    siteFooterTosLink: "Terms of Service"
  },
  fr: {
    docTitle: "Cardify — Boutique",
    welcomeText: "Bienvenue sur Cardify",
    deviceTitle: "Appareil / plateforme",
    countryTitle: "Pays",
    chipPs: "PlayStation",
    chipXbox: "Xbox",
    chipRoblox: "Roblox",
    chipEpic: "Epic Games",
    chipNintendo: "Nintendo",
    chipApple: "Apple",
    chipGooglePlay: "Google Play",
    chipFreeFire: "Free Fire",
    chipPUBG: "PUBG",
    chipUs: "États-Unis",
    chipFr: "France",
    accountUsd: "Uniquement pour les comptes en USD",
    accountEur: "Uniquement pour les comptes en EUR",
    worldwide: "Mondial",
    homeMainTitle: "Tableau de bord Cardify",
    cartDrawerTitle: "Panier",
    cartTotalLabel: "Total (sélection)",
    addToCart: "Ajouter au panier",
    allCategories: "Toutes les catégories",
    noListings: "Aucune annonce trouvée.",
    gameCards: "Cartes de jeux",
    giftCards: "Cartes cadeaux",
    gameCardsList: "PlayStation, Xbox, Epic Games, Roblox, Nintendo eShop, Free Fire, PUBG",
    giftCardsList: "Apple, Google Play",
    emptyCart: "Votre panier est vide.",
    checkout: "Payer",
    langToggleAria: "Choisir la langue",
    cartAria: "Panier",
    accountAria: "Compte",
    searchPlaceholder: "Rechercher cartes, plateformes, montants…",
    searchAria: "Rechercher des cartes cadeaux",
    activityFeedBtn: "Blog",
    shopActivityHeading: "Blog",
    filters: "Filtres",
    closeFilters: "Fermer les filtres",
    navHome: "Accueil",
    navCart: "Panier",
    navNotifications: "Notification",
    navBlog: "Blog",
    navSettings: "Paramètres",
    helloUser: "Bonjour {name} 👋",
    dashboardQuestion: "Qu'est-ce qu'on fait aujourd'hui",
    profileFallback: "Utilisateur",
    profileEmailFallback: "Ouvrir le compte",
    homeLanguageMenuLabel: "Langue",
    homeSupportMenuItem: "Assistance",
    themeDark: "Mode sombre",
    themeLight: "Mode clair",
    settingsKicker: "Paramètres Cardify",
    settingsTitle: "Paramètres",
    settingsThemeTitle: "Thème du site",
    settingsThemeCopy: "Choisissez l'apparence de Cardify sur cet appareil.",
    settingsDarkTitle: "Violet sombre",
    settingsDarkCopy: "Noir mat avec verre violet.",
    settingsLightTitle: "Clair",
    settingsLightCopy: "Mode clair épuré.",
    settingsClose: "Fermer les paramètres",
    securePaymentTitle: "Paiement sécurisé",
    securePaymentCopy: "Vos transactions sont 100% sécurisées.",
    fastDeliveryTitle: "Livraison rapide",
    fastDeliveryCopy: "Votre code sera envoyé en moins d'une heure. Si cela prend plus de temps, vous pourrez attendre le code ou obtenir un remboursement dans l'onglet notification.",
    overflowAria: "Plus d'options",
    siteFooterTermsLink: "Conditions générales",
    siteFooterTosLink: "Conditions d’utilisation",
    shopActivityHeading: "Blog"
  }
};
const idsToTranslate = [
  "welcomeText",
  "cartTotalLabel",
  "deviceTitle",
  "countryTitle",
  "chipPs",
  "chipXbox",
  "chipRoblox",
  "chipEpic",
  "chipNintendo",
  "chipApple",
  "chipGooglePlay",
  "chipFreeFire",
  "chipPUBG",
  "homeMainTitle",
  "cartDrawerTitle",
  "homeLangMenuEn",
  "homeLangMenuFr",
  "activityFeedBtn",
  "homeLanguageMenuLabel",
  "homeTopLanguageLabel",
  "homeSupportMenuItem",
  "dashboardQuestion",
  "settingsKicker",
  "settingsTitle",
  "settingsThemeTitle",
  "settingsThemeCopy",
  "settingsDarkTitle",
  "settingsDarkCopy",
  "settingsLightTitle",
  "settingsLightCopy",
  "securePaymentTitle",
  "securePaymentCopy",
  "fastDeliveryTitle",
  "fastDeliveryCopy",
  "siteFooterTermsLink",
  "siteFooterTosLink",
  "shopActivityHeading"
];
function applyRegionChipAria() {
  const t = dictionary[currentLang];
  document.getElementById("filterRegionUs")?.setAttribute("aria-label", t.chipUs);
  document.getElementById("filterRegionFr")?.setAttribute("aria-label", t.chipFr);
}
const platformEmojis = {
  playstation: "🎮",
  apple: "🍎",
  xbox: "🎮",
  nintendo: "🎮",
  roblox: "💸",
  epicgames: "🎮",
  googleplay: "📱",
  freefire: "🔥",
  pubg: "🎯"
};
const langToggle = document.getElementById("langToggle");
const langMenu = document.getElementById("langMenu");
const langOptions = document.querySelectorAll(".lang-option");
const welcomeOverlay = document.getElementById("welcomeOverlay");
const listingGrid = document.getElementById("listingGrid");
const cartDrawer = document.getElementById("cartDrawer");
const cartBackdrop = document.getElementById("cartBackdrop");
const cartOpenBtn = document.getElementById("cartOpenBtn");
const cartCloseBtn = document.getElementById("cartCloseBtn");
const cartLines = document.getElementById("cartLines");
const cartTotalValue = document.getElementById("cartTotalValue");
const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
const listingSearch = document.getElementById("listingSearch");
const overflowMenuBtn = document.getElementById("overflowMenuBtn");
const overflowMenuPanel = document.getElementById("overflowMenuPanel");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const settingsPanel = document.getElementById("settingsPanel");
const settingsOpenBtn = document.getElementById("filterSettingsBtn");
const settingsCloseBtn = document.getElementById("settingsCloseBtn");
const settingsDarkBtn = document.getElementById("settingsDarkBtn");
const settingsLightBtn = document.getElementById("settingsLightBtn");
const filtersOpenBtn = document.getElementById("filtersOpenBtn");
const filtersCloseBtn = document.getElementById("filtersCloseBtn");
const filterDrawerBackdrop = document.getElementById("filterDrawerBackdrop");
const filterProfileName = document.getElementById("filterProfileName");
const filterProfileEmail = document.getElementById("filterProfileEmail");
let currentLang = localStorage.getItem("cardifyLanguage") || "en";
let activeCategoryPlatform = "";
try {
  localStorage.removeItem("cardifyVisualMode");
} catch {}
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
  } catch {}
  document.documentElement.classList.toggle("cardify-dark", !!on);
  syncThemeMenuLabel();
}
function syncThemeMenuLabel() {
  const L = dictionary[currentLang];
  if (themeToggleBtn) themeToggleBtn.textContent = isDarkTheme() ? L.themeLight : L.themeDark;
  syncSettingsThemeState();
}
function syncSettingsThemeState() {
  const dark = isDarkTheme();
  settingsDarkBtn?.classList.toggle("active", dark);
  settingsLightBtn?.classList.toggle("active", !dark);
  settingsDarkBtn?.setAttribute("aria-pressed", dark ? "true" : "false");
  settingsLightBtn?.setAttribute("aria-pressed", dark ? "false" : "true");
}
function setSettingsPanel(open) {
  settingsPanel?.classList.toggle("hidden", !open);
  settingsBackdrop?.classList.toggle("hidden", !open);
  settingsPanel?.setAttribute("aria-hidden", open ? "false" : "true");
  settingsOpenBtn?.setAttribute("aria-expanded", open ? "true" : "false");
  if (open) syncSettingsThemeState();
}
function setFilterDrawer(open) {
  document.body.classList.toggle("filter-drawer-open", !!open);
  filterDrawerBackdrop?.classList.toggle("hidden", !open);
  filtersOpenBtn?.setAttribute("aria-expanded", open ? "true" : "false");
}
function syncFilterProfile() {
  const L = dictionary[currentLang];
  let name = "";
  let email = "";
  try {
    name = (localStorage.getItem("cardifyFullName") || localStorage.getItem("cardifyUsername") || "").trim();
    email = (localStorage.getItem("cardifyEmail") || "").trim();
  } catch {}
  if (filterProfileName) filterProfileName.textContent = name || L.profileFallback;
  if (filterProfileEmail) filterProfileEmail.textContent = email || L.profileEmailFallback;
  const displayName = name || L.profileFallback;
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const greeting = document.getElementById("dashboardGreeting");
  if (greeting) greeting.textContent = L.helloUser.replace("{name}", firstName);
}
function mountRightFilterPanel() {
  if (document.getElementById("rightFilterPanel")) return;
  const title = document.getElementById("deviceTitle");
  const chips = document.getElementById("platformChips");
  const countryTitle = document.getElementById("countryTitle");
  const countryChips = document.getElementById("countryChips");
  if (!filtersOpenBtn || !title || !chips) return;
  const panel = document.createElement("aside");
  panel.className = "right-filter-panel";
  panel.id = "rightFilterPanel";
  panel.setAttribute("aria-label", "Device and platform filters");
  panel.append(title, chips);
  if (countryTitle && countryChips) panel.append(countryTitle, countryChips);
  filtersOpenBtn.insertAdjacentElement("afterend", panel);
}
function selectedFilters(group) {
  return Array.from(document.querySelectorAll(`.filter-chip.active[data-filter-group="${group}"]`)).map(
    (b) => b.dataset.value
  );
}
function listingCountryLabel(item) {
  if (item.platform === "freefire" || item.platform === "pubg") {
    return `<span aria-hidden="true">🌐</span><span>${dictionary[currentLang].worldwide}</span>`;
  }
  const amt = String(item.amount || "");
  const L = dictionary[currentLang];
  const isFr = amt.includes("€") || item.region === "fr";
  const label = isFr ? L.accountEur : L.accountUsd;
  const flagFile = isFr ? "france.png" : "USA.png";
  const flag = `<img class="listing-country-flag-img" src="${assetPath(flagFile)}" alt="" width="22" height="16" decoding="async" />`;
  return `${flag}<span>${label}</span>`;
}
function listingRobuxLineHtml(item) {
  const fn = window.CardifyRobloxRobuxLine;
  if (typeof fn !== "function") return "";
  const line = fn(item.platform, item.amount, currentLang);
  return line ? `<p class="listing-robux">${line}</p>` : "";
}
function categoryImageForItem(item) {
  if (item.platform === "pubg") {
    return "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/578080/header.jpg";
  }
  if (item.platform === "freefire") {
    return "https://wallpapers.com/images/hd/garena-free-fire-thiva-poster-1p4xl0hyj5mck53m.jpg";
  }
  const resolved =
    typeof window.CardifyResolveListingImage === "function"
      ? window.CardifyResolveListingImage(item.platform, item.region, item.amount)
      : "";
  return item.image || resolved || "";
}
function renderCategoryGrid(items, q, platLabel) {
  const groups = new Map();
  items.forEach((item) => {
    if (!item || !item.platform || groups.has(item.platform)) return;
    const label = platLabel(item.platform) || item.platform;
    if (q && ![label, item.platform, item.title].join(" ").toLowerCase().includes(q)) return;
    groups.set(item.platform, item);
  });
  const categories = Array.from(groups.entries());
  if (!categories.length) {
    listingGrid.innerHTML = `<p class="account-empty">${dictionary[currentLang].noListings}</p>`;
    return;
  }
  listingGrid.innerHTML = categories
    .map(([platform, item]) => {
      const label = platLabel(platform) || item.title || platform;
      const image = categoryImageForItem(item);
      const media = image
        ? `<img class="category-card-img" src="${assetPath(image)}" alt="" loading="lazy" decoding="async" />`
        : `<span class="gift-emoji">${platformEmojis[platform] || "🎮"}</span>`;
      return `<article class="category-card" data-category-platform="${platform}" role="button" tabindex="0" aria-label="${label}">
  <div class="category-card-media">${media}</div>
  <h3 class="category-card-title">${label}</h3>
</article>`;
    })
    .join("");
  listingGrid.querySelectorAll(".category-card").forEach((card) => {
    const open = (event) => {
      if (event.type === "keydown" && event.key !== "Enter" && event.key !== " ") return;
      if (event.type === "keydown") event.preventDefault();
      activeCategoryPlatform = card.getAttribute("data-category-platform") || "";
      renderListings();
    };
    card.addEventListener("click", open);
    card.addEventListener("keydown", open);
  });
}
function renderListings() {
  if (!listingGrid) return;
  const q = (listingSearch?.value || "").trim().toLowerCase();
  const L = dictionary[currentLang];
  const groupImages = {
    game: [
      "playstation-network-15-etats-unis.png",
      "XBOX-USA-Cover-600x600.png",
      "https://upload.wikimedia.org/wikipedia/commons/8/8b/Logo_Garena.png"
    ],
    gift: ["apple-7-united-states.png", "googlepay.jpg"]
  };
  const boxes = [
    { key: "game", title: L.gameCards, list: L.gameCardsList },
    { key: "gift", title: L.giftCards, list: L.giftCardsList }
  ].filter((box) => !q || `${box.title} ${box.list}`.toLowerCase().includes(q));
  listingGrid.classList.add("listing-grid--home-groups");
  listingGrid.classList.remove("listing-grid--products", "listing-grid--categories");
  listingGrid.innerHTML = boxes
    .map(
      (box) => `<a class="home-group-card home-group-card--${box.key}" href="./cathegories.html?group=${box.key}">
  <span class="home-group-art" aria-hidden="true">
    ${groupImages[box.key].map((src) => `<img src="${assetPath(src)}" alt="" loading="lazy" decoding="async" />`).join("")}
  </span>
  <h3>${box.title}</h3>
  <p>${box.list}</p>
</a>`
    )
    .join("");
}
function flashAdded(btn) {
  const t = btn.textContent;
  btn.textContent = "✓";
  setTimeout(() => {
    btn.textContent = t;
  }, 1200);
}
function openListingDetails(item) {
  const payload = {
    platform: item.platform,
    region: item.region,
    amount: item.amount,
    fcfa: item.fcfa,
    pairId: item.pairId,
    title: item.title,
    image: item.image || ""
  };
  const json = JSON.stringify(payload);
  try {
    sessionStorage.setItem("cardifyListingView", json);
  } catch {}
  window.location.href = "./listing-details.html?d=" + encodeURIComponent(json);
}
function syncCartBadge() {
  if (cartOpenBtn) cartOpenBtn.dataset.count = String(cartItemCount());
}
function renderCartDrawer() {
  const cart = getCart();
  const L = dictionary[currentLang];
  if (!cartLines) return;
  if (cart.length === 0) cartLines.innerHTML = `<p class="cart-empty">${L.emptyCart}</p>`;
  else {
    cartLines.innerHTML = cart
      .map(
        (line) =>
          `<div class="cart-line"><label><input type="checkbox" data-cart-id="${line.id}" ${line.selected ? "checked" : ""} /><span class="cart-line-title">${line.title}</span><span class="cart-line-price">${formatFcfa(line.fcfa)}</span></label></div>`
      )
      .join("");
    cartLines.querySelectorAll("input[type=checkbox]").forEach((input) => {
      input.addEventListener("change", () => {
        const id = input.dataset.cartId;
        setCart(getCart().map((l) => (l.id === id ? { ...l, selected: input.checked } : l)));
        cartTotalValue.textContent = formatFcfa(cartSelectedTotal());
        if (cartCheckoutBtn) cartCheckoutBtn.disabled = cartSelectedTotal() === 0;
      });
    });
  }
  cartTotalValue.textContent = formatFcfa(cartSelectedTotal());
  if (cartCheckoutBtn) {
    cartCheckoutBtn.textContent = L.checkout;
    cartCheckoutBtn.disabled = cartSelectedTotal() === 0;
  }
}
function openCart() {
  renderCartDrawer();
  cartDrawer.classList.remove("hidden");
  cartBackdrop.classList.remove("hidden");
  cartDrawer.setAttribute("aria-hidden", "false");
}
function closeCart() {
  cartDrawer.classList.add("hidden");
  cartBackdrop.classList.add("hidden");
  cartDrawer.setAttribute("aria-hidden", "true");
}
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("cardifyLanguage", lang);
  document.documentElement.lang = lang;
  const t = dictionary[lang];
  document.title = t.docTitle || "Cardify";
  idsToTranslate.forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = t[id];
  });
  if (langToggle) {
    const img = langToggle.querySelector(".lang-toggle-flag");
    if (img) img.src = lang === "fr" ? "./france.png" : "./USA.png";
    langToggle.setAttribute("aria-label", t.langToggleAria);
  }
  const topLangFlag = document.getElementById("homeTopLangFlag");
  if (topLangFlag) topLangFlag.src = lang === "fr" ? "./france.png" : "./USA.png";
  if (overflowMenuBtn) overflowMenuBtn.setAttribute("aria-label", t.langToggleAria);
  cartOpenBtn?.setAttribute("aria-label", t.cartAria);
  document.getElementById("accountBtn")?.setAttribute("aria-label", t.accountAria);
  syncThemeMenuLabel();
  applyRegionChipAria();
  const searchLab = document.getElementById("searchLabel");
  if (searchLab) searchLab.textContent = t.searchAria;
  if (listingSearch) listingSearch.placeholder = t.searchPlaceholder;
  if (filtersOpenBtn) filtersOpenBtn.textContent = t.filters;
  filtersCloseBtn?.setAttribute("aria-label", t.closeFilters);
  settingsCloseBtn?.setAttribute("aria-label", t.settingsClose);
  const navLabels = [
    ["home", t.navHome],
    ["cart", t.navCart],
    ["notifications", t.navNotifications],
    ["blog", t.navBlog],
    ["settings", t.navSettings]
  ];
  document.querySelectorAll(".filter-nav-item").forEach((item, i) => {
    const label = item.querySelector("span:last-child");
    if (label && navLabels[i]) label.textContent = navLabels[i][1];
  });
  document.getElementById("siteFooterTermsLink")?.setAttribute("href", "./terms.html?lang=" + lang);
  document.getElementById("siteFooterTosLink")?.setAttribute("href", "./terms.html?lang=" + lang);
  syncFilterProfile();
  renderListings();
  renderCartDrawer();
}
langToggle?.addEventListener("click", () => langMenu.classList.toggle("hidden"));
document.addEventListener("click", (event) => {
  if (!event.target.closest("#languageSwitcher")) langMenu.classList.add("hidden");
  if (!event.target.closest("#overflowMenuRoot")) {
    overflowMenuPanel?.classList.add("hidden");
    overflowMenuBtn?.setAttribute("aria-expanded", "false");
  }
});
overflowMenuBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const o = overflowMenuPanel?.classList.contains("hidden");
  overflowMenuPanel?.classList.toggle("hidden");
  overflowMenuBtn?.setAttribute("aria-expanded", o ? "true" : "false");
});
themeToggleBtn?.addEventListener("click", () => {
  setDarkTheme(!isDarkTheme());
  overflowMenuPanel?.classList.add("hidden");
  overflowMenuBtn?.setAttribute("aria-expanded", "false");
});
document.getElementById("accountBtn")?.addEventListener("click", () => {
  window.location.href = "./account.html";
});
filtersOpenBtn?.addEventListener("click", () => {
  setFilterDrawer(!document.body.classList.contains("filter-drawer-open"));
});
filtersCloseBtn?.addEventListener("click", () => setFilterDrawer(false));
filterDrawerBackdrop?.addEventListener("click", () => setFilterDrawer(false));
settingsOpenBtn?.addEventListener("click", () => {
  setFilterDrawer(false);
  setSettingsPanel(true);
});
settingsCloseBtn?.addEventListener("click", () => setSettingsPanel(false));
settingsBackdrop?.addEventListener("click", () => setSettingsPanel(false));
settingsDarkBtn?.addEventListener("click", () => setDarkTheme(true));
settingsLightBtn?.addEventListener("click", () => setDarkTheme(false));
document.getElementById("filterCartBtn")?.addEventListener("click", () => {
  setFilterDrawer(false);
  openCart();
});
document.getElementById("filterNotificationsBtn")?.addEventListener("click", () => {
  window.location.href = "./notifications.html";
});
document.getElementById("filterProfileBtn")?.addEventListener("click", () => {
  window.location.href = "./account.html";
});
langOptions.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang);
    langMenu.classList.add("hidden");
  });
});
document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    activeCategoryPlatform = "";
    chip.classList.toggle("active");
    renderListings();
  });
});
listingSearch?.addEventListener("input", renderListings);
cartOpenBtn?.addEventListener("click", openCart);
cartCloseBtn?.addEventListener("click", closeCart);
cartBackdrop?.addEventListener("click", closeCart);
cartCheckoutBtn?.addEventListener("click", () => {
  if (cartSelectedTotal() === 0) return;
  closeCart();
  window.location.href = "./checkout.html";
});
document.getElementById("activityFeedBtn")?.addEventListener("click", (e) => {
  e.preventDefault();
  const sec = document.getElementById("shopActivitySection");
  if (sec) {
    sec.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  try {
    history.replaceState(null, "", "#shopActivitySection");
  } catch (err) {
    /* e.g. file:// */
  }
});
if (location.hash === "#shopActivitySection") {
  requestAnimationFrame(() => {
    document.getElementById("shopActivitySection")?.scrollIntoView({ block: "start" });
  });
}
mountRightFilterPanel();
applyLanguage(currentLang);
syncCartBadge();
if (welcomeOverlay && sessionStorage.getItem("showWelcome") === "1") {
  welcomeOverlay.classList.remove("hidden");
  setTimeout(() => welcomeOverlay.classList.add("fade-out"), 1400);
  setTimeout(() => {
    welcomeOverlay.classList.add("hidden");
    welcomeOverlay.classList.remove("fade-out");
    sessionStorage.removeItem("showWelcome");
  }, 2300);
}
