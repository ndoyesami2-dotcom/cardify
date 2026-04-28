/** @typedef {{ platform: string, region: "us" | "fr", amount: string, fcfa: number, pairId: string | null, title: string, image: string }} Listing */

/** @type {Listing[]} */
var CardifyListings = [];

/** EUR (France) — main + combo variant amounts (same grid for all € platforms). */
var EUR_FCFA = {
  10: 7200,
  15: 10800,
  20: 14400,
  25: 18000,
  30: 21600,
  40: 28800,
  50: 36000,
  60: 43200,
  75: 54000,
  100: 72000
};

var EUR_KEYS = [10, 15, 20, 25, 30, 40, 50, 60, 75, 100];

function interpolateEuro(n) {
  var d = Math.round(Number(n));
  if (!isFinite(d) || d < 1) return 0;
  if (Object.prototype.hasOwnProperty.call(EUR_FCFA, d)) return EUR_FCFA[d];
  var keys = EUR_KEYS;
  var t = EUR_FCFA;
  if (d < keys[0]) return Math.round((t[keys[0]] / keys[0]) * d);
  if (d > keys[keys.length - 1]) {
    var a = keys[keys.length - 2];
    var b = keys[keys.length - 1];
    return Math.round(t[b] + ((d - b) / Math.max(1, b - a)) * (t[b] - t[a]));
  }
  var lo = keys[0];
  var hi = keys[keys.length - 1];
  for (var i = 0; i < keys.length - 1; i++) {
    if (d >= keys[i] && d <= keys[i + 1]) {
      lo = keys[i];
      hi = keys[i + 1];
      break;
    }
  }
  if (lo === hi) return t[lo];
  return Math.round(t[lo] + ((d - lo) / (hi - lo)) * (t[hi] - t[lo]));
}

function parseFaceValueFromAmount(amountStr) {
  var m = String(amountStr).match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return NaN;
  return Math.round(Number(String(m[1]).replace(",", ".")));
}

/** Decimal face value (e.g. 0.99) — for PUBG tiers. */
function parseAmountNumber(amountStr) {
  var m = String(amountStr || "").match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return NaN;
  return parseFloat(String(m[1]).replace(",", "."));
}

/** Linear FCFA between known (face → price) knots for USD gaps (e.g. $40, $60). */
function interpUsdMap(d, keys, map) {
  var n = Math.round(Number(d));
  if (!isFinite(n) || n < 1) return 0;
  keys = keys.slice().sort(function (a, b) {
    return a - b;
  });
  if (Object.prototype.hasOwnProperty.call(map, n)) return map[n];
  if (n <= keys[0]) return Math.round((map[keys[0]] / keys[0]) * Math.max(1, n));
  if (n >= keys[keys.length - 1]) {
    var a = keys[keys.length - 2];
    var b = keys[keys.length - 1];
    return Math.round(map[b] + ((n - b) / Math.max(1, b - a)) * (map[b] - map[a]));
  }
  var lo = keys[0];
  var hi = keys[keys.length - 1];
  for (var i = 0; i < keys.length - 1; i++) {
    if (n >= keys[i] && n <= keys[i + 1]) {
      lo = keys[i];
      hi = keys[i + 1];
      break;
    }
  }
  if (lo === hi) return map[lo];
  return Math.round(map[lo] + ((n - lo) / (hi - lo)) * (map[hi] - map[lo]));
}

function usdStandard(d) {
  switch (d) {
    case 10:
      return 7200;
    case 15:
      return 10500;
    case 25:
      return 15500;
    case 50:
      return 29500;
    case 100:
      return 57000;
    default:
      return 0;
  }
}

function usdPlatformFcfa(platform, d) {
  var st = usdStandard(d);
  switch (platform) {
    case "playstation":
      if (d === 20) return 14400;
      if (d === 30) return 21600;
      if (d === 75) return 45000;
      if (st) return st;
      return interpUsdMap(d, [10, 20, 30, 50, 75, 100], {
        10: 7200,
        20: 14400,
        30: 21600,
        50: 29500,
        75: 45000,
        100: 57000
      });
    case "apple":
    case "xbox":
      if (d === 30) return 21000;
      if (d === 20) return 14400;
      if (st) return st;
      return interpUsdMap(d, [10, 15, 20, 25, 30, 50, 100], {
        10: 7200,
        15: 10500,
        20: 14400,
        25: 15500,
        30: 21000,
        50: 29500,
        100: 57000
      });
    case "nintendo":
      if (d === 20) return 13800;
      if (d === 30) return 21600;
      if (d === 35) return 22500;
      if (d === 10 || d === 25 || d === 50 || d === 100) return st;
      return interpUsdMap(d, [10, 20, 25, 30, 35, 50, 100], {
        10: 7200,
        20: 13800,
        25: 15500,
        30: 21600,
        35: 22500,
        50: 29500,
        100: 57000
      });
    case "roblox":
      if (d === 30) return 21600;
      if (d === 10 || d === 25 || d === 50 || d === 100) return st;
      if (d === 15) return 10500;
      if (d === 20) return 14400;
      return interpUsdMap(d, [10, 25, 30, 50, 100], {
        10: 7200,
        25: 15500,
        30: 21600,
        50: 29500,
        100: 57000
      });
    case "epicgames":
    case "googleplay":
      if (d === 30) return 21600;
      if (d === 75) return 45000;
      if (d === 20) return 13800;
      if (st) return st;
      return interpUsdMap(d, [10, 20, 25, 30, 50, 75, 100], {
        10: 7200,
        20: 13800,
        25: 15500,
        30: 21600,
        50: 29500,
        75: 45000,
        100: 57000
      });
    default:
      return 0;
  }
}

function fcfaForFreeFireOrPubg(platform, amountStr) {
  var n = parseAmountNumber(amountStr);
  if (!isFinite(n) || n <= 0) return 0;
  if (platform === "freefire") {
    if (n === 1) return 720;
    if (n === 2) return 1440;
    if (n === 5) return 3600;
    if (n === 10) return 7200;
    if (n === 20) return 14400;
    return 0;
  }
  if (platform === "pubg") {
    if (Math.abs(n - 0.99) < 0.01) return 720;
    if (n === 5) return 3600;
    if (n === 9) return 6480;
    if (n === 24) return 17280;
    if (n === 48) return 34560;
    if (n === 99) return 71280;
    return 0;
  }
  return 0;
}

function fcfaForAmount(platform, region, amountStr) {
  if (platform === "freefire" || platform === "pubg") {
    return fcfaForFreeFireOrPubg(platform, amountStr);
  }
  var s = String(amountStr || "").trim();
  var face = parseFaceValueFromAmount(amountStr);
  if (!isFinite(face) || face < 1) return 0;
  if (s.indexOf("€") >= 0) return interpolateEuro(face);
  return usdPlatformFcfa(platform, face);
}

function fcfaFromFaceTable(platform, face) {
  if (face === undefined && typeof platform === "number") {
    return interpolateEuro(platform);
  }
  if (platform === "freefire") {
    var ff = Math.round(Number(face));
    if (ff === 1) return 720;
    if (ff === 2) return 1440;
    if (ff === 5) return 3600;
    if (ff === 10) return 7200;
    if (ff === 20) return 14400;
    return 0;
  }
  if (platform === "pubg") {
    var p = Number(face);
    if (Math.abs(p - 0.99) < 0.01) return 720;
    if (p === 5) return 3600;
    if (p === 9) return 6480;
    if (p === 24) return 17280;
    if (p === 48) return 34560;
    if (p === 99) return 71280;
    return 0;
  }
  return usdPlatformFcfa(platform, Math.round(Number(face)));
}

function fcfaForListingExport(platform, region, amountStr) {
  return fcfaForAmount(platform, region, amountStr);
}

function resolveListingImage(platform, region, amount) {
  var head = String(amount)
    .trim()
    .split(/[\s(]/)[0];
  switch (platform) {
    case "apple":
      return region === "fr" ? "apple france.jpg" : "apple-7-united-states.png";
    case "nintendo":
      if (region === "fr") {
        if (head === "€10" || head === "€15") return "nintendo 15.jpg";
        if (head === "€25" || head === "€30") return "nintend 25.jpg";
        if (head === "€50") return "nintendo 50.jpg";
      }
      return "nitendo us.jpg";
    case "playstation":
      return region === "fr" ? "playstation france.png" : "playstation-network-15-etats-unis.png";
    case "xbox":
      return region === "fr" ? "xbox france.png" : "XBOX-USA-Cover-600x600.png";
    case "epicgames":
      return region === "fr" ? "epic games france.png" : "epic games usa.jpg";
    case "roblox":
      return "cq5dam.web.1280.1280.jpeg";
    case "googleplay":
      return "googlepay.jpg";
    case "freefire":
      return "https://upload.wikimedia.org/wikipedia/commons/8/8b/Logo_Garena.png";
    case "pubg":
      return "https://upload.wikimedia.org/wikipedia/commons/4/43/PUBG_Mobile_simple_logo_black.png";
    default:
      return "";
  }
}

function L(platform, region, amount, pairId, title) {
  CardifyListings.push({
    platform: platform,
    region: region,
    amount: amount,
    fcfa: fcfaForAmount(platform, region, amount),
    pairId: pairId,
    title: title,
    image: resolveListingImage(platform, region, amount)
  });
}

/* —— France (EUR) —— */

function psFr() {
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("playstation", "fr", "€" + v, "psn-" + v, "PlayStation Gift Card €" + v);
  });
}
function xboxFr() {
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("xbox", "fr", "€" + v, "xbox-" + v, "Xbox Gift Card (France) €" + v);
  });
}
function appleFr() {
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("apple", "fr", "€" + v, "apple-" + v, "Apple Gift Card (France) €" + v);
  });
}
function epicFr() {
  [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("epicgames", "fr", "€" + v, "epic-" + v, "Epic Games Gift Card (France) €" + v);
  });
}
function robloxFr() {
  [10, 15, 20, 25, 30, 40, 50, 100].forEach(function (v) {
    L("roblox", "fr", "€" + v, "rbx-" + v, "Roblox €" + v);
  });
}
function nintendoFr() {
  [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("nintendo", "fr", "€" + v, "nin-" + v, "Nintendo eShop Gift Card (France) €" + v);
  });
}
function googleplayFr() {
  [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("googleplay", "fr", "€" + v, "gplay-" + v, "Google Play Gift Card (France) €" + v);
  });
}

psFr();
xboxFr();
appleFr();
epicFr();
robloxFr();
nintendoFr();
googleplayFr();
freefireFr();
pubgFr();

/* —— United States (USD) —— */

function psUs() {
  [10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100].forEach(function (v) {
    L("playstation", "us", "$" + v, "psn-" + v, "PlayStation Gift Card (USA) $" + v);
  });
}
function xboxUs() {
  [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("xbox", "us", "$" + v, "xbox-" + v, "Xbox Gift Card (USA) $" + v);
  });
}
function appleUs() {
  [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("apple", "us", "$" + v, "apple-" + v, "Apple Gift Card (USA) $" + v);
  });
}
function epicUs() {
  [10, 20, 30, 40, 50, 60, 70, 75, 80, 90, 100].forEach(function (v) {
    L("epicgames", "us", "$" + v, "epic-" + v, "Epic Games Gift Card (USA) $" + v);
  });
}
function robloxUs() {
  [10, 25, 30, 50, 100].forEach(function (v) {
    L("roblox", "us", "$" + v, "rbx-" + v, "Roblox $" + v);
  });
}
function nintendoUs() {
  [10, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("nintendo", "us", "$" + v, "nin-" + v, "Nintendo eShop Gift Card (USA) $" + v);
  });
}
function googleplayUs() {
  [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100].forEach(function (v) {
    L("googleplay", "us", "$" + v, "gplay-" + v, "Google Play Gift Card (USA) $" + v);
  });
}
function freefireFr() {
  [1, 2, 5, 10, 20].forEach(function (v) {
    L("freefire", "fr", "€" + v, "ff-" + v, "Free Fire (France) €" + v);
  });
}
function freefireUs() {
  [1, 2, 5, 10, 20].forEach(function (v) {
    L("freefire", "us", "$" + v, "ff-" + v, "Free Fire (USA) $" + v);
  });
}
function pubgFr() {
  L("pubg", "fr", "€0.99", "pubg-0.99", "PUBG (France) €0.99");
  [5, 9, 24, 48, 99].forEach(function (v) {
    L("pubg", "fr", "€" + v, "pubg-" + v, "PUBG (France) €" + v);
  });
}
function pubgUs() {
  L("pubg", "us", "$0.99", "pubg-0.99", "PUBG (USA) $0.99");
  [5, 9, 24, 48, 99].forEach(function (v) {
    L("pubg", "us", "$" + v, "pubg-" + v, "PUBG (USA) $" + v);
  });
}
psUs();
xboxUs();
appleUs();
epicUs();
robloxUs();
nintendoUs();
googleplayUs();
freefireUs();
pubgUs();

function findCounterpart(pairId, targetRegion, currentPlatform) {
  if (!pairId) return null;
  return (
    CardifyListings.find(function (x) {
      return x.pairId === pairId && x.region === targetRegion && x.platform === currentPlatform;
    }) || null
  );
}

function platformLabel(platform) {
  var map = {
    playstation: "PlayStation",
    apple: "Apple",
    xbox: "Xbox",
    nintendo: "Nintendo eShop",
    roblox: "Roblox",
    epicgames: "Epic Games",
    googleplay: "Google Play",
    freefire: "Free Fire",
    pubg: "PUBG"
  };
  return map[platform] || platform;
}

/** Roblox gift card → approximate Robux (USD tiers; same face value used for € cards). */
function robloxRobuxLine(platform, amountStr, lang) {
  if (platform !== "roblox") return "";
  var s = String(amountStr || "");
  if (s.indexOf("$") < 0 && s.indexOf("€") < 0) return "";
  var f = parseFaceValueFromAmount(amountStr);
  if (!Number.isFinite(f)) return "";
  var table = {
    5: "~400 Robux",
    10: "~800 Robux",
    15: "~1200 Robux",
    20: "~2000 Robux",
    25: "~2000 Robux",
    30: "~2700 Robux",
    40: "~3600 Robux",
    50: "~4500 Robux",
    75: "~7000 Robux",
    100: "~10,000 Robux"
  };
  var line = table[f];
  if (!line) return "";
  if (lang === "fr") {
    line = line.replace(/~/g, "≈ ");
    if (s.indexOf("€") >= 0) line += " (carte en euros)";
  } else if (s.indexOf("€") >= 0) {
    line += " (euro-denominated card)";
  }
  return line;
}

window.CardifyListings = CardifyListings;
window.CardifyFindCounterpart = findCounterpart;
window.CardifyPlatformLabel = platformLabel;
window.CardifyResolveListingImage = resolveListingImage;
window.CardifyFcfaFromFace = fcfaFromFaceTable;
window.CardifyFcfaForAmount = fcfaForListingExport;
window.CardifyParseFaceValue = parseFaceValueFromAmount;
window.CardifyRobloxRobuxLine = robloxRobuxLine;
