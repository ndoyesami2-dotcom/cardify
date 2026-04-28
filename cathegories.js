/* global CardifyListings, CardifyCart */
const listings = window.CardifyListings || [];
const { addToCart } = window.CardifyCart || {};
const categoryGrid = document.getElementById("categoryGrid");
const categorySearch = document.getElementById("categorySearch");
const params = new URLSearchParams(window.location.search);
const requestedGroup = params.get("group") === "gift" ? "gift" : "game";
let currentLang = localStorage.getItem("cardifyLang") || "en";
let activeCategoryPlatform = "";

const dictionary = {
  en: {
    categoriesTitle: "Categories",
    categoriesBack: "Back to dashboard",
    categorySearchLabel: "Search categories",
    searchPlaceholder: "Search categories or cards",
    allCategories: "All categories",
    noListings: "No listings found.",
    addToCart: "Add to cart",
    accountUsd: "Only for accounts in USD",
    accountEur: "Only for accounts in EUR",
    worldwide: "Worldwide"
  },
  fr: {
    categoriesTitle: "Catégories",
    categoriesBack: "Retour au tableau de bord",
    categorySearchLabel: "Rechercher des catégories",
    searchPlaceholder: "Rechercher catégories ou cartes",
    allCategories: "Toutes les catégories",
    noListings: "Aucune annonce trouvée.",
    addToCart: "Ajouter au panier",
    accountUsd: "Uniquement pour les comptes en USD",
    accountEur: "Uniquement pour les comptes en EUR",
    worldwide: "Mondial"
  }
};

const groupPlatforms = {
  game: ["playstation", "xbox", "epicgames", "roblox", "nintendo", "freefire", "pubg"],
  gift: ["apple", "googleplay"]
};

const platformEmojis = {
  playstation: "🎮",
  xbox: "🎮",
  roblox: "💎",
  epic: "🎮",
  nintendo: "🎮",
  apple: "Apple",
  googleplay: "▶",
  freefire: "🔥",
  pubg: "🌍"
};

function assetPath(rel) {
  if (!rel) return "";
  const s = String(rel).trim();
  if (/^https?:\/\//i.test(s)) return s;
  const clean = s.replace(/^\.?\//, "");
  return "./" + clean.split("/").map((seg) => encodeURIComponent(seg)).join("/");
}

function formatFcfa(value) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
  if (!Number.isFinite(n)) return "— FCFA";
  return `${n.toLocaleString()} FCFA`;
}

function platformLabel(platform) {
  return typeof window.CardifyPlatformLabel === "function" ? window.CardifyPlatformLabel(platform) : platform;
}

function categoryImageForItem(item) {
  if (item.platform === "pubg") return "https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/578080/header.jpg";
  if (item.platform === "freefire") return "https://wallpapers.com/images/hd/garena-free-fire-thiva-poster-1p4xl0hyj5mck53m.jpg";
  const resolved =
    typeof window.CardifyResolveListingImage === "function"
      ? window.CardifyResolveListingImage(item.platform, item.region, item.amount)
      : "";
  return item.image || resolved || "";
}

function listingCountryLabel(item) {
  const L = dictionary[currentLang];
  if (item.platform === "pubg" || item.platform === "freefire") {
    return `<span class="listing-country-globe">🌍</span><span>${L.worldwide}</span>`;
  }
  const amt = String(item.amount || "");
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

function renderCategoryGrid() {
  const q = (categorySearch?.value || "").trim().toLowerCase();
  const platforms = groupPlatforms[requestedGroup];
  const groups = new Map();
  listings.forEach((item) => {
    if (!item || !platforms.includes(item.platform) || groups.has(item.platform)) return;
    const label = platformLabel(item.platform) || item.platform;
    if (q && !activeCategoryPlatform && !`${label} ${item.platform} ${item.title}`.toLowerCase().includes(q)) return;
    groups.set(item.platform, item);
  });
  const categories = Array.from(groups.entries());
  if (!categories.length) {
    categoryGrid.innerHTML = `<p class="account-empty">${dictionary[currentLang].noListings}</p>`;
    return;
  }
  categoryGrid.classList.add("listing-grid--categories");
  categoryGrid.classList.remove("listing-grid--products");
  categoryGrid.innerHTML = categories
    .map(([platform, item]) => {
      const label = platformLabel(platform) || item.title || platform;
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
  categoryGrid.querySelectorAll(".category-card").forEach((card) => {
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
  const q = (categorySearch?.value || "").trim().toLowerCase();
  const visible = listings.filter((item) => {
    if (item.platform !== activeCategoryPlatform) return false;
    if (!q) return true;
    const title = String(item.title || "").toLowerCase();
    const plat = String(platformLabel(item.platform) || item.platform || "").toLowerCase();
    const amt = String(item.amount || "").toLowerCase();
    return title.includes(q) || plat.includes(q) || amt.includes(q);
  });
  categoryGrid.classList.remove("listing-grid--categories");
  categoryGrid.classList.add("listing-grid--products");
  categoryGrid.innerHTML =
    `<button type="button" class="category-back-btn" id="categoryBackBtn">← ${dictionary[currentLang].allCategories}</button>` +
    visible
      .map((item) => {
        const thumbInner = item.image
          ? `<img class="listing-thumb-img" src="${assetPath(item.image)}" alt="" />`
          : `<span class="gift-emoji">${platformEmojis[item.platform] || "🎮"}</span>`;
        return `<article class="listing-card" data-listing-id="${item.pairId || ""}-${item.platform}-${item.region}" style="cursor:pointer"><div class="gift-thumb thumb-${item.platform}"><div class="gift-thumb-media">${thumbInner}</div></div><h4 class="listing-title">${item.title}</h4><p class="listing-country">${listingCountryLabel(item)}</p>${listingRobuxLineHtml(item)}<p class="listing-price">${formatFcfa(item.fcfa)}</p><button type="button" class="add-to-cart-btn" data-add="1">+ ${dictionary[currentLang].addToCart}</button></article>`;
      })
      .join("");
  document.getElementById("categoryBackBtn")?.addEventListener("click", () => {
    activeCategoryPlatform = "";
    renderCategoryGrid();
  });
  categoryGrid.querySelectorAll(".listing-card").forEach((card, i) => {
    const item = visible[i];
    card.addEventListener("click", (e) => {
      if (e.target.closest(".add-to-cart-btn")) return;
      openListingDetails(item);
    });
  });
  categoryGrid.querySelectorAll(".add-to-cart-btn").forEach((btn, i) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (typeof addToCart !== "function") return;
      const item = visible[i];
      addToCart({
        title: item.title,
        fcfa: item.fcfa,
        platform: item.platform,
        region: item.region,
        amount: item.amount,
        pairId: item.pairId
      });
      const text = btn.textContent;
      btn.textContent = "✓";
      setTimeout(() => {
        btn.textContent = text;
      }, 1200);
    });
  });
}

function applyTranslations() {
  const L = dictionary[currentLang] || dictionary.en;
  document.title = `Cardify — ${L.categoriesTitle}`;
  document.getElementById("categoriesTitle").textContent = L.categoriesTitle;
  document.getElementById("categoriesBack").textContent = `← ${L.categoriesBack}`;
  document.getElementById("categorySearchLabel").textContent = L.categorySearchLabel;
  categorySearch.placeholder = L.searchPlaceholder;
}

categorySearch?.addEventListener("input", () => {
  if (activeCategoryPlatform) renderListings();
  else renderCategoryGrid();
});

applyTranslations();
renderCategoryGrid();
