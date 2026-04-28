/* global firebase — compat bundles; CardifyCart — cart-storage.js */
(function () {
  "use strict";

  var cfg = window.__CARDIFY_FIREBASE_CONFIG__;
  if (typeof firebase !== "undefined" && cfg) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      if (firebase.auth && firebase.auth.Auth) {
        firebase.auth()
          .setPersistence(firebase.auth.Auth.Persistence.SESSION)
          .catch(function (e2) {
            console.warn("auth persistence", e2);
          });
      }
    } catch (e) {
      console.warn("Firebase init:", e);
    }
  }

  function firestore() {
    if (typeof firebase === "undefined" || !firebase.apps.length) return null;
    return firebase.firestore();
  }

  function logPayment(doc) {
    var db = firestore();
    if (!db) return Promise.resolve(null);
    return db.collection("payments").add({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...doc
    });
  }

  function logOrder(doc) {
    var db = firestore();
    if (!db) return Promise.resolve(null);
    return db.collection("orders").add({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      ...doc
    });
  }

  var ORDER_SNAPSHOT_KEY = "cardifyCheckoutOrder";
  var CARDIFY_PHONE_STORAGE_KEY = "cardifySenegalPhone";
  var CARDIFY_FULLNAME_STORAGE_KEY = "cardifyFullName";

  function orderItemsFromLines(lines) {
    return lines.map(function (l) {
      return {
        title: l.title || "",
        fcfa: l.fcfa,
        quantity: 1,
        platform: l.platform || null,
        region: l.region || null,
        amount: l.amount || null,
        pairId: l.pairId != null ? l.pairId : null
      };
    });
  }

  /** Senegal mobile national: 9 digits starting with 7 or 3; accepts +221… or leading 0. */
  function normalizeSenegalMobile(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.indexOf("221") === 0 && d.length >= 12) {
      d = d.slice(3);
    }
    if (d.length === 10 && d.charAt(0) === "0") {
      d = d.slice(1);
    }
    if (d.length === 9 && /^[37]\d{8}$/.test(d)) {
      return d;
    }
    return null;
  }

  function setStripeOrderSnapshot(lines, totalFcfa) {
    try {
      sessionStorage.setItem(
        ORDER_SNAPSHOT_KEY,
        JSON.stringify({
          amountFcfa: Math.max(0, Math.round(Number(totalFcfa))),
          items: orderItemsFromLines(lines)
        })
      );
    } catch (e) {
      /* ignore */
    }
  }

  function getProfilePhone() {
    try {
      return normalizeSenegalMobile(localStorage.getItem(CARDIFY_PHONE_STORAGE_KEY) || "");
    } catch (e) {
      return null;
    }
  }

  function getProfileFullName() {
    try {
      var s = (localStorage.getItem(CARDIFY_FULLNAME_STORAGE_KEY) || "").trim();
      if (s.length > 200) return s.slice(0, 200);
      return s || null;
    } catch (e2) {
      return null;
    }
  }

  function getAuthUserId() {
    try {
      if (typeof firebase === "undefined" || !firebase.apps || !firebase.apps.length) return null;
      var u = firebase.auth().currentUser;
      return u && u.uid ? u.uid : null;
    } catch (e) {
      return null;
    }
  }

  function orderDocBase(phone, items, amountFcfa, method, status) {
    var doc = {
      phone: phone,
      items: items,
      amountFcfa: amountFcfa,
      method: method,
      status: status,
      fulfillmentStatus: "pending"
    };
    var fn = getProfileFullName();
    if (fn) doc.fullName = fn;
    var uid = getAuthUserId();
    if (uid) doc.userId = uid;
    return doc;
  }

  var lang = localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
  var T = {
    en: {
      docTitle: "Checkout — Cardify",
      back: "← Back to shop",
      title: "Payment",
      choose: "Choose a payment method",
      card: "Card (Stripe)",
      cardHint: "Stripe — Visa, Mastercard, and major cards",
      wave: "Wave",
      waveHint: "Pay with your Wave wallet",
      om: "Orange Money",
      omHint: "Currently inactive",
      empty: "No items selected. Go back to your cart and select products to pay.",
      stripeMissing: "Stripe is not configured on the server (.env STRIPE_SECRET_KEY).",
      stripeFail: "Could not start card payment. Check the server console.",
      omPending: "Orange Money flow would start here. Your selection was saved.",
      firebaseWarn: "Could not write to Firebase (check Firestore rules for collection payments).",
      profilePhoneMissing:
        "Your Senegal mobile is missing. Create an account (or sign in again) on the home page and enter your mobile there — then return to checkout.",
      ordersFirebaseWarn: "Could not save the order (check Firestore rules for collection orders)."
    },
    fr: {
      docTitle: "Paiement — Cardify",
      back: "← Retour à la boutique",
      title: "Paiement",
      choose: "Choisissez un moyen de paiement",
      card: "Carte (Stripe)",
      cardHint: "Stripe — Visa, Mastercard et cartes principales",
      wave: "Wave",
      waveHint: "Payer avec votre compte Wave",
      om: "Orange Money",
      omHint: "Actuellement inactive",
      empty:
        "Aucun article sélectionné. Retournez au panier et cochez les produits à payer.",
      stripeMissing: "Stripe n’est pas configuré sur le serveur (.env STRIPE_SECRET_KEY).",
      stripeFail: "Impossible de démarrer le paiement par carte. Vérifiez la console du serveur.",
      omPending: "Le flux Orange Money démarrerait ici. Votre sélection a été enregistrée.",
      firebaseWarn: "Écriture Firebase impossible (règles Firestore pour la collection payments).",
      profilePhoneMissing:
        "Numéro mobile Sénégal manquant. Créez un compte (ou reconnectez-vous) sur la page d'accueil avec votre mobile, puis revenez au paiement.",
      ordersFirebaseWarn: "Impossible d'enregistrer la commande (règles Firestore pour la collection orders)."
    }
  };
  var t = T[lang] || T.en;

  function formatFcfa(value) {
    var n = typeof value === "number" ? value : Number(String(value).replace(/\s/g, ""));
    if (!isFinite(n)) return "— FCFA";
    return n.toLocaleString() + " FCFA";
  }

  function cartPayload(selected, total) {
    return {
      method: null,
      amountFcfa: total,
      currency: "XOF",
      items: selected.map(function (l) {
        return {
          title: l.title || "",
          fcfa: l.fcfa,
          platform: l.platform,
          region: l.region,
          amount: l.amount,
          pairId: l.pairId
        };
      })
    };
  }

  document.documentElement.lang = lang;
  document.title = t.docTitle;
  var back = document.getElementById("checkoutBack");
  if (back) back.textContent = t.back;
  var ct = document.getElementById("checkoutTitle");
  if (ct) ct.textContent = t.title;
  var ch = document.getElementById("checkoutChoose");
  if (ch) ch.textContent = t.choose;
  var plc = document.getElementById("payLabelCard");
  if (plc) plc.textContent = t.card;
  var phc = document.getElementById("payHintCard");
  if (phc) phc.textContent = t.cardHint;
  var plw = document.getElementById("payLabelWave");
  if (plw) plw.textContent = t.wave;
  var phw = document.getElementById("payHintWave");
  if (phw) phw.textContent = t.waveHint;
  var plo = document.getElementById("payLabelOm");
  if (plo) plo.textContent = t.om;
  var pho = document.getElementById("payHintOm");
  if (pho) pho.textContent = t.omHint;

  var getCart = window.CardifyCart.getCart;
  var cartSelectedTotal = window.CardifyCart.cartSelectedTotal;
  var summary = document.getElementById("checkoutSummary");
  var lineList = document.getElementById("checkoutLines");
  var selected = getCart().filter(function (l) {
    return l.selected;
  });
  var total = cartSelectedTotal();

  if (selected.length === 0) {
    if (summary) summary.textContent = t.empty;
    if (lineList) {
      lineList.innerHTML = "";
      lineList.hidden = true;
    }
  } else {
    if (summary) {
      summary.textContent =
        selected.length +
        (lang === "fr" ? " article(s) · Total " : " item(s) · Total ") +
        formatFcfa(total);
    }
    if (lineList) {
      lineList.hidden = false;
      lineList.innerHTML = "";
      selected.forEach(function (l) {
        var li = document.createElement("li");
        var titleSpan = document.createElement("span");
        titleSpan.className = "checkout-line-title";
        titleSpan.textContent = l.title || "";
        var priceSpan = document.createElement("span");
        priceSpan.className = "checkout-line-fcfa";
        priceSpan.textContent = formatFcfa(l.fcfa);
        li.appendChild(titleSpan);
        li.appendChild(priceSpan);
        lineList.appendChild(li);
      });
    }
  }

  var WAVE_PAY_BASE = "https://pay.wave.com/m/M_sn_hh02t3SdSf-p/c/sn/?amount=";

  document.querySelectorAll(".pay-card").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      var method = btn.dataset.method;
      if (selected.length === 0 || total <= 0) {
        alert(t.empty);
        return;
      }
      var basePayload = cartPayload(selected, total);

      if (method === "wave") {
        var phoneW = getProfilePhone();
        if (!phoneW) {
          alert(t.profilePhoneMissing);
          return;
        }
        var ordW = orderItemsFromLines(selected);
        var amtW = Math.max(0, Math.round(Number(total)));
        Promise.all([
          logPayment({
            ...basePayload,
            method: "wave",
            status: "redirecting",
            customerPhone: phoneW,
            waveAmountParam: amtW
          }).catch(function () {
            console.warn(t.firebaseWarn);
          }),
          logOrder(orderDocBase(phoneW, ordW, amtW, "wave", "redirecting")).catch(function () {
            console.warn(t.ordersFirebaseWarn);
          })
        ]).then(function () {
          window.location.href = WAVE_PAY_BASE + String(amtW);
        });
        return;
      }

      if (method === "orange") {
        var phoneO = getProfilePhone();
        if (!phoneO) {
          alert(t.profilePhoneMissing);
          return;
        }
        var ordO = orderItemsFromLines(selected);
        var amtO = Math.max(0, Math.round(Number(total)));
        var payOm = logPayment({
          ...basePayload,
          method: "orange_money",
          status: "intent_recorded",
          customerPhone: phoneO
        }).catch(function () {
          console.warn(t.firebaseWarn);
        });
        var ordOm = logOrder(orderDocBase(phoneO, ordO, amtO, "orange_money", "intent_recorded")).catch(function () {
          console.warn(t.ordersFirebaseWarn);
        });
        Promise.all([payOm, ordOm]).then(function () {
          alert(t.omPending);
        });
        return;
      }

      if (method === "card") {
        var phoneC = getProfilePhone();
        if (!phoneC) {
          alert(t.profilePhoneMissing);
          return;
        }
        setStripeOrderSnapshot(selected, total);
        var body = JSON.stringify({
          amountFcfa: Math.max(0, Math.round(Number(total))),
          items: basePayload.items,
          phone: phoneC,
          successPath: "/checkout-success.html",
          cancelPath: "/checkout.html"
        });
        fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: body
        })
          .then(function (r) {
            return r.text().then(function (txt) {
              var j = {};
              try {
                j = txt ? JSON.parse(txt) : {};
              } catch (e) {
                j = { error: txt || "Invalid response from server" };
              }
              return { ok: r.ok, status: r.status, json: j };
            });
          })
          .then(function (_ref) {
            var json = _ref.json;
            if (!_ref.ok) {
              var err = (json && json.error) || "HTTP " + _ref.status;
              if (String(err).indexOf("not configured") !== -1) {
                alert(t.stripeMissing);
              } else {
                alert(t.stripeFail + "\n\n" + err);
              }
              return;
            }
            if (json && json.url) {
              if (json.id) {
                logPayment({
                  ...basePayload,
                  method: "stripe_checkout",
                  status: "session_created",
                  stripeSessionId: json.id,
                  customerPhone: phoneC
                }).catch(function () {});
              }
              window.location.href = json.url;
            } else {
              alert(t.stripeFail + "\n\n" + (json && json.error ? json.error : "No checkout URL returned."));
            }
          })
          .catch(function (err) {
            alert(t.stripeFail + "\n\n" + (err && err.message ? err.message : "Network error — is the server running?"));
          });
      }
    });
  });
})();
