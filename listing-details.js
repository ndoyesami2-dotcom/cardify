(function () {
  "use strict";

  const STR = {
    en: {
      docTitle: "Listing — Cardify",
      back: "← Back to shop",
      price: "Price",
      cardValue: "Card value",
      delivery:
        "Delivery by email — can take a couple of minutes and up to about an hour",
      stock: "In stock",
      addCart: "Add to cart",
      added: "Added ✓",
      regionLabel: "Product country / region",
      us: "United States",
      fr: "France",
      notFound: "Listing not found",
      noEquiv: "No equivalent listing for {country} for this product.",
      countryHint:
        "This item is only useable for account created in that country/region.",
      playstation:
        "This item is only usable on this device or account (PlayStation / PSN).",
      apple: "This item is only usable on Apple ID / App Store in this region.",
      xbox: "This item is only usable on Xbox / Microsoft account in this region.",
      nintendo: "This item is only usable on Nintendo eShop in this region.",
      roblox: "This item is only usable on Roblox in this region.",
      epicgames:
        "This item is only usable on Epic Games (Fortnite, Rocket League, store) in this region.",
      googleplay:
        "This item is only for Google Play balance on a Google account in this country/region (Android apps, games, media).",
      freefire: "Garena Free Fire in-game / top-up for accounts in the selected store region. Use the code in the Garena/Free Fire client on your device in this country.",
      pubg: "PUBG / PUBG Mobile in-game (UC) top-up for accounts in the selected store country/region, per publisher rules.",
      platformFallback: "This item is tied to the selected platform.",
      similarHeading: "Other amounts (same country)",
      similarHint: "Same platform and store region — tap to open.",
      wishlistBtn: "Add to wishlist",
      wishlistAdded: "Saved to wishlist",
      wishlistDup: "Already in wishlist",
      variant30: "This denomination is supplied as 3 × $10 / 3 × €10 face value (same total).",
      variant20usd: "This denomination is supplied as 2 × $10 face value (same total).",
      variant20eur: "This denomination is supplied as 2 × €10 face value (same total).",
      payWithLocal: "Pay with",
      reviewsHeading: "Reviews",
      reviewsHint: "Share what you think about this product.",
      reviewLabel: "Write a review",
      reviewPlaceholder: "Write your review...",
      reviewSubmit: "Post review",
      reviewEmpty: "No reviews yet. Be the first to review this product.",
      reviewFallbackUser: "User",
      themeDark: "Dark mode",
      themeLight: "Light mode",
      overflowAria: "More options"
    },
    fr: {
      docTitle: "Annonce — Cardify",
      back: "← Retour à la boutique",
      price: "Prix",
      cardValue: "Valeur de la carte",
      delivery:
        "Livraison par e-mail — quelques minutes à environ une heure en général",
      stock: "En stock",
      addCart: "Ajouter au panier",
      added: "Ajouté ✓",
      regionLabel: "Pays / région du produit",
      us: "États-Unis",
      fr: "France",
      notFound: "Annonce introuvable",
      noEquiv: "Pas d’équivalent pour {country} pour ce produit.",
      countryHint:
        "Cet article n’est utilisable que pour un compte créé dans ce pays / cette région.",
      playstation:
        "Utilisable uniquement sur ce compte ou appareil PlayStation / PSN.",
      apple: "Utilisable uniquement sur un Apple ID / App Store de cette région.",
      xbox: "Utilisable uniquement sur un compte Xbox / Microsoft de cette région.",
      nintendo: "Utilisable uniquement sur le Nintendo eShop de cette région.",
      roblox: "Utilisable uniquement sur Roblox dans cette région.",
      epicgames:
        "Utilisable uniquement sur Epic Games (Fortnite, Rocket League, boutique) dans cette région.",
      googleplay:
        "Utilisable uniquement pour le solde Google Play d’un compte Google dans ce pays (applis, jeux, contenus).",
      freefire: "Garena Free Fire, recharge / code pour la région du store sélectionnée, à activer sur votre compte (mobile) dans ce pays.",
      pubg: "PUBG / PUBG Mobile (UC) — recharge pour compte de la région / pays de la boutique indiqué, selon les règles de l’éditeur.",
      platformFallback: "Cet article est lié à la plateforme sélectionnée.",
      similarHeading: "Autres montants (même pays)",
      similarHint: "Même plateforme et région — touchez pour ouvrir.",
      wishlistBtn: "Ajouter à la liste d'envies",
      wishlistAdded: "Enregistré dans la liste d'envies",
      wishlistDup: "Déjà dans la liste d'envies",
      variant30:
        "Ce montant est fourni en 3 × 10 $ ou 3 × 10 € de valeur faciale (total équivalent).",
      variant20usd: "Ce montant est fourni en 2 × 10 $ de valeur faciale (total équivalent).",
      variant20eur: "Ce montant est fourni en 2 × 10 € de valeur faciale (total équivalent).",
      payWithLocal: "Payer avec",
      reviewsHeading: "Avis",
      reviewsHint: "Partagez ce que vous pensez de ce produit.",
      reviewLabel: "Écrire un avis",
      reviewPlaceholder: "Écrivez votre avis...",
      reviewSubmit: "Publier l'avis",
      reviewEmpty: "Aucun avis pour le moment. Soyez le premier à donner votre avis.",
      reviewFallbackUser: "Utilisateur",
      themeDark: "Mode sombre",
      themeLight: "Mode clair",
      overflowAria: "Plus d'options"
    }
  };

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

  const platformNames = {
    playstation: "PlayStation",
    apple: "Apple (iTunes / App Store)",
    xbox: "Xbox",
    nintendo: "Nintendo eShop",
    roblox: "Roblox",
    epicgames: "Epic Games",
    googleplay: "Google Play",
    freefire: "Garena Free Fire",
    pubg: "PUBG"
  };

  const platformLogoSources = {
    playstation: "https://upload.wikimedia.org/wikipedia/commons/0/00/PlayStation_logo.svg",
    apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    xbox: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg",
    nintendo: "https://upload.wikimedia.org/wikipedia/commons/0/0d/Nintendo.svg",
    roblox: "https://upload.wikimedia.org/wikipedia/commons/3/3a/Roblox_player_icon_black.svg",
    epicgames: "https://upload.wikimedia.org/wikipedia/commons/3/31/Epic_Games_logo.svg",
    googleplay: "https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg",
    freefire: "https://upload.wikimedia.org/wikipedia/commons/8/8b/Logo_Garena.png",
    pubg: "https://upload.wikimedia.org/wikipedia/commons/4/43/PUBG_Mobile_simple_logo_black.png"
  };

  function lang() {
    const v = localStorage.getItem("cardifyLanguage");
    return v === "fr" ? "fr" : "en";
  }

  function t(key) {
    const L = STR[lang()] || STR.en;
    return L[key] || STR.en[key] || key;
  }

  function assetPath(rel) {
    if (!rel) return "";
    const s = String(rel).trim();
    if (/^https?:\/\//i.test(s)) return s;
    const clean = s.replace(/^\.?\//, "");
    return "./" + clean.split("/").map((seg) => encodeURIComponent(seg)).join("/");
  }

  function countryFlagImgHtml(isFrance) {
    const file = isFrance ? "france.png" : "USA.png";
    return (
      '<img class="listing-country-flag-img" src="' +
      assetPath(file) +
      '" alt="" width="22" height="16" decoding="async" />'
    );
  }

  function formatFcfa(value) {
    const n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
    if (!Number.isFinite(n)) return "— FCFA";
    return n.toLocaleString() + " FCFA";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function searchableListingText(item) {
    return [item.title, item.amount, item.platform, platformNames[item.platform], item.region].join(" ").toLowerCase();
  }

  function renderDetailSearch() {
    const input = document.getElementById("detailListingSearch");
    const results = document.getElementById("detailSearchResults");
    if (!input || !results) return;
    const q = input.value.trim().toLowerCase();
    if (!q) {
      results.classList.add("hidden");
      results.innerHTML = "";
      return;
    }
    const matches = (Array.isArray(window.CardifyListings) ? window.CardifyListings : [])
      .filter(function (item) {
        return searchableListingText(item).includes(q);
      })
      .slice(0, 6);
    if (!matches.length) {
      results.innerHTML = '<p class="index-search-empty">No cards found.</p>';
    } else {
      results.innerHTML = "";
      matches.forEach(function (item) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "detail-search-card";
        btn.innerHTML =
          '<span class="detail-search-card-title">' +
          escapeHtml(item.title || "") +
          '</span><span class="detail-search-card-meta">' +
          escapeHtml((item.amount || "") + " · " + formatFcfa(item.fcfa)) +
          "</span>";
        btn.addEventListener("click", function () {
          goToListing(item);
        });
        results.appendChild(btn);
      });
    }
    results.classList.remove("hidden");
  }

  function findCounterpartSafe(pairId, targetRegion, currentPlatform) {
    const fn = window.CardifyFindCounterpart;
    if (typeof fn !== "function") return null;
    return fn(pairId, targetRegion, currentPlatform);
  }

  function addToCartSafe(item) {
    const cart = window.CardifyCart;
    if (!cart || typeof cart.addToCart !== "function") return false;
    cart.addToCart(item);
    return true;
  }

  function reviewStorageKey() {
    if (!current) return "";
    return [
      "cardifyReviews",
      current.platform || "product",
      current.region || "region",
      String(current.amount || "amount").replace(/\s+/g, "_")
    ].join(":");
  }

  function currentReviewerName() {
    try {
      const name = (
        localStorage.getItem("cardifyFullName") ||
        localStorage.getItem("cardifyUsername") ||
        localStorage.getItem("cardifyEmail") ||
        ""
      ).trim();
      return name || t("reviewFallbackUser");
    } catch (e) {
      return t("reviewFallbackUser");
    }
  }

  function loadReviews() {
    const key = reviewStorageKey();
    if (!key) return [];
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveReviews(reviews) {
    const key = reviewStorageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify(reviews.slice(0, 50)));
    } catch (e) {
      /* ignore */
    }
  }

  function renderReviews() {
    const list = document.getElementById("listingReviewList");
    if (!list) return;
    if (!current) {
      list.innerHTML = "";
      return;
    }
    const reviews = loadReviews();
    if (!reviews.length) {
      list.innerHTML = '<p class="listing-review-empty">' + escapeHtml(t("reviewEmpty")) + "</p>";
      return;
    }
    list.innerHTML = reviews
      .map(function (review) {
        return (
          '<article class="listing-review-row"><div class="listing-review-avatar" aria-hidden="true">' +
          escapeHtml(String(review.user || t("reviewFallbackUser")).charAt(0).toUpperCase() || "U") +
          '</div><div class="listing-review-body"><strong>' +
          escapeHtml(review.user || t("reviewFallbackUser")) +
          '</strong><p>' +
          escapeHtml(review.comment || "") +
          "</p></div></article>"
        );
      })
      .join("");
  }

  function coalesceFcfa(raw) {
    if (typeof raw === "number" && Number.isFinite(raw)) return raw;
    const s = String(raw ?? "")
      .replace(/[\s\u00a0]/g, "")
      .replace(/\u202f/g, "")
      .replace(/,/g, "");
    const n = Number(s);
    return Number.isFinite(n) ? n : NaN;
  }

  function normalizeListing(parsed) {
    if (!parsed || !parsed.platform) return null;
    var fcfa = coalesceFcfa(parsed.fcfa);
    const cat = Array.isArray(window.CardifyListings) ? window.CardifyListings : null;
    if (cat) {
      const wantPid = parsed.pairId == null || parsed.pairId === "" ? null : parsed.pairId;
      var hit = cat.find(function (x) {
        return (
          x.pairId === wantPid &&
          x.platform === parsed.platform &&
          x.region === parsed.region &&
          String(x.amount) === String(parsed.amount)
        );
      });
      if (!hit) {
        hit = cat.find(function (x) {
          return (
            x.platform === parsed.platform &&
            x.region === parsed.region &&
            String(x.amount) === String(parsed.amount)
          );
        });
      }
      if (hit && Number.isFinite(hit.fcfa)) {
        fcfa = hit.fcfa;
      } else if (
        (Number.isNaN(fcfa) || !Number.isFinite(fcfa)) &&
        typeof window.CardifyFcfaForAmount === "function"
      ) {
        fcfa = window.CardifyFcfaForAmount(parsed.platform, parsed.region, parsed.amount);
      } else if (
        (Number.isNaN(fcfa) || !Number.isFinite(fcfa)) &&
        typeof window.CardifyFcfaFromFace === "function" &&
        typeof window.CardifyParseFaceValue === "function"
      ) {
        const face = window.CardifyParseFaceValue(parsed.amount);
        if (Number.isFinite(face)) fcfa = window.CardifyFcfaFromFace(parsed.platform, face);
      }
    }
    if (!Number.isFinite(fcfa)) return null;
    const imgFn = window.CardifyResolveListingImage;
    const resolved =
      typeof imgFn === "function" ? imgFn(parsed.platform, parsed.region, parsed.amount) : "";
    /* Prefer catalog resolver so e.g. all PlayStation FR / Xbox FR listings always use the France pack art, not a stale ?d= payload. */
    const image = (resolved && String(resolved).trim()) || (parsed.image && String(parsed.image).trim()) || "";
    var pid =
      hit && hit.pairId != null && hit.pairId !== ""
        ? hit.pairId
        : parsed.pairId == null || parsed.pairId === ""
          ? null
          : parsed.pairId;
    var ttl = (parsed.title && String(parsed.title).trim()) || (hit && hit.title) || "";
    return {
      platform: parsed.platform,
      region: parsed.region,
      amount: parsed.amount,
      fcfa,
      pairId: pid,
      title: ttl,
      image: image || ""
    };
  }

  function loadListingFromNavigation() {
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d");
    if (d) {
      try {
        const n = normalizeListing(JSON.parse(decodeURIComponent(d)));
        if (n) return n;
      } catch {
        /* fall through */
      }
    }
    const raw = sessionStorage.getItem("cardifyListingView");
    if (raw) {
      try {
        const n = normalizeListing(JSON.parse(raw));
        if (n) return n;
      } catch {
        /* fall through */
      }
    }
    const listingData = params.get("listing");
    if (listingData) {
      try {
        return normalizeListing(JSON.parse(decodeURIComponent(listingData)));
      } catch {
        return null;
      }
    }
    return null;
  }

  function platformRestriction(platform) {
    const k =
      platform === "playstation" ||
      platform === "apple" ||
      platform === "xbox" ||
      platform === "nintendo" ||
      platform === "roblox" ||
      platform === "epicgames" ||
      platform === "googleplay" ||
      platform === "freefire" ||
      platform === "pubg"
        ? platform
        : null;
    return k ? t(k) : t("platformFallback");
  }

  let current = null;

  function isDarkTheme() {
    try {
      return localStorage.getItem("cardifyTheme") !== "light";
    } catch (e) {
      return true;
    }
  }

  function setDarkTheme(on) {
    try {
      if (on) localStorage.removeItem("cardifyTheme");
      else localStorage.setItem("cardifyTheme", "light");
    } catch (e) {
      /* ignore */
    }
    document.documentElement.classList.toggle("cardify-dark", !!on);
    syncThemeMenuLabel();
  }

  function syncThemeMenuLabel() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;
    btn.textContent = isDarkTheme() ? t("themeLight") : t("themeDark");
  }

  function wireThemeOverflow() {
    const overflowMenuBtn = document.getElementById("overflowMenuBtn");
    const overflowMenuPanel = document.getElementById("overflowMenuPanel");
    const themeToggleBtn = document.getElementById("themeToggleBtn");
    if (overflowMenuBtn) overflowMenuBtn.setAttribute("aria-label", t("overflowAria"));
    syncThemeMenuLabel();
    overflowMenuBtn?.addEventListener("click", function (e) {
      e.stopPropagation();
      const willOpen = overflowMenuPanel?.classList.contains("hidden");
      overflowMenuPanel?.classList.toggle("hidden");
      overflowMenuBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    });
    document.addEventListener("click", function (event) {
      if (!event.target.closest("#overflowMenuRoot")) {
        overflowMenuPanel?.classList.add("hidden");
        overflowMenuBtn?.setAttribute("aria-expanded", "false");
      }
    });
    themeToggleBtn?.addEventListener("click", function () {
      setDarkTheme(!isDarkTheme());
      overflowMenuPanel?.classList.add("hidden");
      overflowMenuBtn?.setAttribute("aria-expanded", "false");
    });
  }

  function applyStaticLabels() {
    document.title = t("docTitle");
    const back = document.getElementById("backShop");
    if (back) back.textContent = t("back");
    const pk = document.getElementById("asidePriceLabel");
    if (pk) pk.textContent = t("price");
    const ak = document.getElementById("asideAmountLabel");
    if (ak) ak.textContent = t("cardValue");
    const del = document.getElementById("asideDelivery");
    if (del) del.textContent = t("delivery");
    const st = document.getElementById("asideStock");
    if (st) st.textContent = t("stock");
    const addBtn = document.getElementById("addCartDetail");
    if (addBtn) addBtn.textContent = t("addCart");
    const wlBtn = document.getElementById("wishlistDetail");
    if (wlBtn) wlBtn.textContent = t("wishlistBtn");
    const simH = document.getElementById("similarHeading");
    if (simH) simH.textContent = t("similarHeading");
    const simHint = document.getElementById("similarHint");
    if (simHint) simHint.textContent = t("similarHint");
    const payH = document.getElementById("listingLocalPayHeading");
    if (payH) payH.textContent = t("payWithLocal");
    const reviewsHeading = document.getElementById("listingReviewsHeading");
    if (reviewsHeading) reviewsHeading.textContent = t("reviewsHeading");
    const reviewsHint = document.getElementById("listingReviewsHint");
    if (reviewsHint) reviewsHint.textContent = t("reviewsHint");
    const reviewLabel = document.getElementById("listingReviewLabel");
    if (reviewLabel) reviewLabel.textContent = t("reviewLabel");
    const reviewInput = document.getElementById("listingReviewInput");
    if (reviewInput) reviewInput.placeholder = t("reviewPlaceholder");
    const reviewSubmit = document.getElementById("listingReviewSubmit");
    if (reviewSubmit) reviewSubmit.textContent = t("reviewSubmit");
  }

  function imageForListingRow(l) {
    const imgFn = window.CardifyResolveListingImage;
    const resolved =
      typeof imgFn === "function" ? imgFn(l.platform, l.region, l.amount) : "";
    return (
      (resolved && String(resolved).trim()) ||
      (l.image && String(l.image).trim()) ||
      ""
    );
  }

  function goToListing(listing) {
    const payload = {
      platform: listing.platform,
      region: listing.region,
      amount: listing.amount,
      fcfa: listing.fcfa,
      pairId: listing.pairId,
      title: listing.title,
      image: listing.image || ""
    };
    try {
      sessionStorage.setItem("cardifyListingView", JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
    window.location.href = "./listing-details.html?d=" + encodeURIComponent(JSON.stringify(payload));
  }

  function renderSimilar() {
    const section = document.getElementById("similarSection");
    const grid = document.getElementById("similarGrid");
    if (!section || !grid) return;
    if (!current) {
      section.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }
    const all = window.CardifyListings;
    if (!Array.isArray(all)) {
      section.classList.add("hidden");
      return;
    }
    const similar = all.filter(function (l) {
      return (
        l.platform === current.platform &&
        l.region === current.region &&
        l.amount !== current.amount
      );
    });
    if (similar.length === 0) {
      section.classList.add("hidden");
      grid.innerHTML = "";
      return;
    }
    section.classList.remove("hidden");
    similar.sort(function (a, b) {
      return a.fcfa - b.fcfa;
    });
    grid.innerHTML = "";
    similar.forEach(function (l) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "similar-card";
      const thumb = document.createElement("div");
      thumb.className = "similar-card-thumb";
      const imgSrc = imageForListingRow(l);
      if (imgSrc) {
        const im = document.createElement("img");
        im.className = "similar-card-thumb-img";
        im.src = assetPath(imgSrc);
        im.alt = "";
        im.loading = "lazy";
        im.decoding = "async";
        thumb.appendChild(im);
      } else {
        const sp = document.createElement("span");
        sp.className = "similar-card-emoji";
        sp.textContent = platformEmojis[l.platform] || "🎮";
        thumb.appendChild(sp);
      }
      const ttl = document.createElement("div");
      ttl.className = "similar-card-title";
      ttl.textContent = (l.title && String(l.title).trim()) || l.amount || "";
      const amt = document.createElement("div");
      amt.className = "similar-card-amount";
      amt.textContent = l.amount;
      const pr = document.createElement("div");
      pr.className = "similar-card-price";
      pr.textContent = formatFcfa(l.fcfa);
      btn.appendChild(thumb);
      btn.appendChild(ttl);
      btn.appendChild(amt);
      btn.appendChild(pr);
      btn.addEventListener("click", function () {
        goToListing(l);
      });
      grid.appendChild(btn);
    });
  }

  function renderRegionSwitch() {
    const wrap = document.getElementById("regionSwitch");
    if (!wrap || !current) return;

    const other = current.region === "us" ? "fr" : "us";
    const counterpart = findCounterpartSafe(current.pairId, other, current.platform);
    const otherName = other === "us" ? t("us") : t("fr");

    let note = "";
    if (!counterpart && current.pairId) {
      note = `<p class="region-switch-note">${t("noEquiv").replace("{country}", otherName)}</p>`;
    }

    const srcUs = assetPath("USA.png");
    const srcFr = assetPath("france.png");
    wrap.innerHTML = `
    <p class="region-switch-label">${t("regionLabel")}</p>
    <div class="region-switch-btns">
      <button type="button" class="region-pill ${current.region === "us" ? "active" : ""}" data-region="us" aria-label="${t("us")}"><img class="region-pill-flag" src="${srcUs}" alt="" width="26" height="26" decoding="async" /></button>
      <button type="button" class="region-pill ${current.region === "fr" ? "active" : ""}" data-region="fr" aria-label="${t("fr")}"><img class="region-pill-flag" src="${srcFr}" alt="" width="26" height="26" decoding="async" /></button>
    </div>
    ${note}
  `;

    wrap.querySelectorAll(".region-pill").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const r = btn.getAttribute("data-region");
        if (r === current.region) return;
        const next = findCounterpartSafe(current.pairId, r, current.platform);
        if (next) {
          current = next;
          try {
            sessionStorage.setItem("cardifyListingView", JSON.stringify(current));
          } catch {
            /* ignore */
          }
          paint();
        }
      });
    });
  }

  function paint() {
    applyStaticLabels();

    const titleEl = document.getElementById("listingTitle");
    const priceEl = document.getElementById("priceAmount");
    const faceEl = document.getElementById("listingFaceAmount");
    const imgEl = document.getElementById("listingImage");

    if (!current) {
      if (titleEl) titleEl.textContent = t("notFound");
      if (priceEl) priceEl.textContent = "—";
      if (faceEl) faceEl.textContent = "—";
      const cSub0 = document.getElementById("listingCountrySub");
      const rSub0 = document.getElementById("listingRobuxSub");
      if (cSub0) {
        cSub0.innerHTML = "";
        cSub0.classList.add("hidden");
      }
      if (rSub0) {
        rSub0.textContent = "";
        rSub0.classList.add("hidden");
      }
      const varNote0 = document.getElementById("listingVariantNote");
      if (varNote0) {
        varNote0.textContent = "";
        varNote0.classList.add("hidden");
      }
      const wrap = document.getElementById("regionSwitch");
      if (wrap) wrap.innerHTML = "";
      const simSec = document.getElementById("similarSection");
      if (simSec) simSec.classList.add("hidden");
      renderReviews();
      return;
    }

    const fcfa = typeof current.fcfa === "number" ? current.fcfa : Number(current.fcfa) || 0;

    if (titleEl) titleEl.textContent = current.title || "";
    if (priceEl) priceEl.textContent = formatFcfa(fcfa);
    if (faceEl) faceEl.textContent = current.amount || "—";

    const amtStr = String(current.amount || "");
    const cSub = document.getElementById("listingCountrySub");
    const rSub = document.getElementById("listingRobuxSub");
    if (cSub) {
      var cname = "";
      if (amtStr.indexOf("€") >= 0) cname = t("fr");
      else if (amtStr.indexOf("$") >= 0) cname = t("us");
      else cname = current.region === "fr" ? t("fr") : t("us");
      var isFrCountry = cname === t("fr");
      cSub.innerHTML = cname ? countryFlagImgHtml(isFrCountry) + "<span>" + cname + "</span>" : "";
      cSub.classList.toggle("hidden", !cname);
    }
    if (rSub) {
      var rx =
        typeof window.CardifyRobloxRobuxLine === "function"
          ? window.CardifyRobloxRobuxLine(current.platform, current.amount, lang())
          : "";
      rSub.textContent = rx;
      rSub.classList.toggle("hidden", !rx);
    }

    const varNote = document.getElementById("listingVariantNote");
    if (varNote) {
      const a = String(current.amount || "").trim();
      const r = current.region;
      const p = current.platform;
      let vn = "";
      if (a === "$30" || a === "€30") vn = t("variant30");
      else if (a === "$20" && r === "us" && (p === "playstation" || p === "xbox")) vn = t("variant20usd");
      else if (a === "€20" && r === "fr" && (p === "playstation" || p === "xbox")) vn = t("variant20eur");
      varNote.textContent = vn;
      varNote.classList.toggle("hidden", !vn);
    }

    if (imgEl) {
      if (current.image) {
        /* Slot + panel set bounds; keep inline style simple (no min() — some UAs drop the whole declaration). */
        imgEl.innerHTML =
          '<img class="listing-detail-img" src="' +
          assetPath(current.image) +
          '" alt="" decoding="async" ' +
          'style="max-width:100%;max-height:100%;width:auto;height:auto;object-fit:contain;display:block" />';
      } else {
        imgEl.innerHTML =
          '<span class="listing-hero-emoji">' + (platformEmojis[current.platform] || "🎮") + "</span>";
      }
    }

    const platformBoxTitle = document.getElementById("platformBoxTitle");
    const platformBoxHint = document.getElementById("platformBoxHint");
    if (platformBoxTitle) {
      const name = platformNames[current.platform] || current.platform || "—";
      const logo = platformLogoSources[current.platform];
      platformBoxTitle.innerHTML = logo
        ? '<img class="platform-box-logo" src="' + logo + '" alt="" decoding="async" loading="lazy" /><span>' + escapeHtml(name) + "</span>"
        : escapeHtml(name);
    }
    if (platformBoxHint) {
      platformBoxHint.textContent = platformRestriction(current.platform);
    }

    renderRegionSwitch();
    renderSimilar();
    renderReviews();
  }

  function wireActions() {
    document.getElementById("addCartDetail")?.addEventListener("click", function () {
      if (!current) return;
      const ok = addToCartSafe({
        title: current.title,
        fcfa: typeof current.fcfa === "number" ? current.fcfa : Number(current.fcfa) || 0,
        platform: current.platform,
        region: current.region,
        amount: current.amount,
        pairId: current.pairId,
        image: current.image || ""
      });
      const btn = document.getElementById("addCartDetail");
      if (!btn) return;
      const orig = t("addCart");
      btn.textContent = ok ? t("added") : "Cart error";
      setTimeout(function () {
        btn.textContent = orig;
      }, 1400);
    });

    document.getElementById("backShop")?.addEventListener("click", function () {
      window.location.href = "./home.html";
    });

    document.getElementById("wishlistDetail")?.addEventListener("click", function () {
      if (!current) return;
      const ud = window.CardifyUserData;
      if (!ud || typeof ud.addWishlistItem !== "function") return;
      const ok = ud.addWishlistItem({
        title: current.title,
        fcfa: typeof current.fcfa === "number" ? current.fcfa : Number(current.fcfa) || 0,
        platform: current.platform,
        region: current.region,
        amount: current.amount,
        pairId: current.pairId,
        image: current.image || ""
      });
      const btn = document.getElementById("wishlistDetail");
      if (!btn) return;
      const orig = t("wishlistBtn");
      btn.textContent = ok ? t("wishlistAdded") : t("wishlistDup");
      setTimeout(function () {
        btn.textContent = orig;
      }, 1600);
    });

    document.getElementById("listingReviewForm")?.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!current) return;
      const input = document.getElementById("listingReviewInput");
      const comment = String(input?.value || "").trim();
      if (!comment) return;
      const reviews = loadReviews();
      reviews.unshift({
        user: currentReviewerName(),
        comment: comment,
        createdAt: Date.now()
      });
      saveReviews(reviews);
      if (input) input.value = "";
      renderReviews();
    });
  }

  window.addEventListener("DOMContentLoaded", function () {
    applyStaticLabels();
    wireThemeOverflow();
    document.getElementById("detailListingSearch")?.addEventListener("input", renderDetailSearch);
    document.addEventListener("click", function (event) {
      if (!event.target.closest(".detail-search-wrap")) {
        document.getElementById("detailSearchResults")?.classList.add("hidden");
      }
    });
    current = loadListingFromNavigation();
    wireActions();
    paint();
  });
})();
