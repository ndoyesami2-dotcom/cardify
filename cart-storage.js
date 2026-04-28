(function (global) {
  const CART_KEY = "cardifyCartV1";

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function setCart(lines) {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
  }

  function addToCart(item) {
    const idFn = global.crypto && global.crypto.randomUUID ? () => global.crypto.randomUUID() : () => String(Date.now()) + Math.random().toString(16).slice(2);
    const line = {
      id: item.id || idFn(),
      selected: item.selected !== false,
      title: item.title,
      fcfa: item.fcfa,
      platform: item.platform,
      region: item.region,
      amount: item.amount,
      pairId: item.pairId ?? null
    };
    const cart = getCart();
    cart.push(line);
    setCart(cart);
    return cart.length;
  }

  function cartSelectedTotal() {
    return getCart()
      .filter((l) => l.selected)
      .reduce((s, l) => {
        const n = typeof l.fcfa === "number" ? l.fcfa : Number(String(l.fcfa).replace(/\s/g, ""));
        return s + (Number.isFinite(n) ? n : 0);
      }, 0);
  }

  function cartItemCount() {
    return getCart().length;
  }

  global.CardifyCart = {
    getCart,
    setCart,
    addToCart,
    cartSelectedTotal,
    cartItemCount
  };
})(typeof window !== "undefined" ? window : globalThis);
