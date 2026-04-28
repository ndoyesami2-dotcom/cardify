import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const cfg = window.__CARDIFY_FIREBASE_CONFIG__;
if (!cfg) {
  const g = document.getElementById("shopActivityGrid");
  if (g) g.innerHTML = "";
} else {
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const db = getFirestore(app);

  const L = {
    en: { openDetails: "Open", close: "Close", clicks: "Clicks", fileLink: "Download", attFiles: "Attachments" },
    fr: { openDetails: "Ouvrir", close: "Fermer", clicks: "Clics", fileLink: "Télécharger", attFiles: "Pièces jointes" }
  };

  function lang() {
    return localStorage.getItem("cardifyLanguage") === "fr" ? "fr" : "en";
  }

  function t(key) {
    return L[lang()][key] || L.en[key] || key;
  }

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  const grid = document.getElementById("shopActivityGrid");
  /* Section title: translated via home.js — idsToTranslate: shopActivityHeading */

  function isImageMain(d) {
    return d.mainMime && String(d.mainMime).startsWith("image/");
  }

  function buildMedia(d) {
    if (d.imageUrl && isImageMain(d)) {
      return `<div class="shop-activity-media"><img class="shop-activity-img" src="${esc(d.imageUrl)}" alt="" loading="lazy" /></div>`;
    }
    const name = d.mainFileName != null ? esc(d.mainFileName) : t("fileLink");
    return `<div class="shop-activity-filebox">
  <span class="shop-activity-file-ico" aria-hidden="true">📄</span>
  <a class="shop-activity-file-link" href="${esc(d.imageUrl)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">${name}</a>
</div>`;
  }

  function openActivityDetail(id) {
    if (!id) return;
    updateDoc(doc(db, "activityFeed", id), { clickCount: increment(1) }).catch((e) => {
      console.warn("activity click", e);
    });
    window.location.href = `./activity-post.html?id=${encodeURIComponent(id)}`;
  }

  function render(snap) {
    if (!grid) return;
    if (snap.empty) {
      grid.innerHTML = "";
      return;
    }
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, data: d.data() }));
    grid.innerHTML = items
      .map(({ id, data: d }) => {
        const title = d.title != null ? esc(d.title) : "";
        const cnt = d.clickCount != null ? d.clickCount : 0;
        return `<article class="shop-activity-card" data-activity-id="${esc(id)}" role="button" tabindex="0" aria-label="${esc(
          t("openDetails")
        )}: ${title}">
  ${buildMedia(d)}
  <h3 class="shop-activity-card-title">${title}</h3>
  <p class="shop-activity-clicks" aria-label="${esc(t("clicks"))}">${esc(t("clicks"))}: ${esc(String(cnt))}</p>
</article>`;
      })
      .join("");

    grid.querySelectorAll(".shop-activity-card").forEach((el) => {
      const id = el.getAttribute("data-activity-id");
      if (!id) return;
      const open = (e) => {
        if (e && e.type === "keydown" && (e.key === " " || e.key === "Enter")) e.preventDefault();
        openActivityDetail(id);
      };
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      });
    });
  }

  const q = query(collection(db, "activityFeed"), orderBy("createdAt", "desc"), limit(40));
  onSnapshot(
    q,
    render,
    (e) => {
      console.warn("shop activity feed", e);
      if (grid) {
        const code = (e && e.code) || "unknown";
        const hint =
          String(code) === "failed-precondition"
            ? "Firestore needs an index for this query. Open the devtools console for a link to create it."
            : "Check that Firestore rules for activityFeed are deployed and you are online.";
        grid.innerHTML = `<p class="shop-activity-feed-err" style="text-align:center;padding:12px;color:var(--muted);font-size:0.9rem">${esc(
          hint
        )}</p>`;
      }
    }
  );
}
