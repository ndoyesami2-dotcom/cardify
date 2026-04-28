(function (g) {
  "use strict";

  var W = "cardifyWishlistV1";
  var H = "cardifyPurchaseHistoryV1";

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      var p = raw ? JSON.parse(raw) : null;
      return Array.isArray(p) ? p : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function wishlistKey(item) {
    return [item.platform, item.region, item.amount, item.pairId != null ? item.pairId : ""].join("|");
  }

  function getWishlist() {
    return readJson(W, []);
  }

  function addWishlistItem(item) {
    var list = getWishlist();
    var k = wishlistKey(item);
    if (list.some(function (x) { return wishlistKey(x) === k; })) return false;
    list.unshift({
      title: item.title || "",
      fcfa: item.fcfa,
      platform: item.platform,
      region: item.region,
      amount: item.amount,
      pairId: item.pairId != null ? item.pairId : null,
      image: item.image || "",
      id: g.crypto && g.crypto.randomUUID ? g.crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2),
      addedAt: new Date().toISOString()
    });
    try {
      localStorage.setItem(W, JSON.stringify(list.slice(0, 200)));
    } catch (e) { /* ignore */ }
    return true;
  }

  function removeWishlistById(id) {
    var list = getWishlist().filter(function (x) { return x.id !== id; });
    try {
      localStorage.setItem(W, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  function getPurchaseHistory() {
    return readJson(H, []);
  }

  function recordPurchase(entry) {
    var list = getPurchaseHistory();
    var items = entry && Array.isArray(entry.items) ? entry.items : [];
    list.unshift({
      id: g.crypto && g.crypto.randomUUID ? g.crypto.randomUUID() : String(Date.now()),
      at: new Date().toISOString(),
      method: (entry && entry.method) || "",
      ref: (entry && entry.ref) || "",
      amountFcfa: entry && entry.amountFcfa != null ? Math.max(0, Math.round(Number(entry.amountFcfa))) : 0,
      items: items
    });
    try {
      localStorage.setItem(H, JSON.stringify(list.slice(0, 100)));
    } catch (e) { /* ignore */ }
  }

  g.CardifyUserData = {
    getWishlist: getWishlist,
    addWishlistItem: addWishlistItem,
    removeWishlistById: removeWishlistById,
    wishlistKey: wishlistKey,
    getPurchaseHistory: getPurchaseHistory,
    recordPurchase: recordPurchase
  };
})(typeof window !== "undefined" ? window : globalThis);
