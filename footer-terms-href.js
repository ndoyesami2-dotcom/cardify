/* Sync footer “Terms” links to ./terms.html?lang= from cardifyLanguage. */
(function () {
  function pickLang() {
    try {
      var raw = (localStorage.getItem("cardifyLanguage") || "en")
        .toString()
        .toLowerCase()
        .split(/[-_]/)[0];
      if (raw === "fr" || raw === "fra" || raw === "french") return "fr";
    } catch (e) {
      /* ignore */
    }
    return "en";
  }
  function sync() {
    var base = "./terms.html?lang=" + encodeURIComponent(pickLang());
    ["siteFooterTermsLink", "siteFooterTosLink"].forEach(function (id) {
      var a = document.getElementById(id);
      if (a) a.setAttribute("href", base);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", sync);
  } else {
    sync();
  }
})();
