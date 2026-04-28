import { initializeApp, getApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const cfg = window.__CARDIFY_FIREBASE_CONFIG__;
const root = document.getElementById("activityPostRoot");
const header = document.getElementById("activityPostHeader");
const params = new URLSearchParams(window.location.search);
const postId = params.get("id") || "";
const likeStoreKey = `cardifyLikedActivity:${postId}`;

const HEART_OFF =
  '<svg class="activity-heart-ico" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.85" stroke-linejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>';
const HEART_ON =
  '<svg class="activity-heart-ico" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function likedLocally() {
  try {
    return localStorage.getItem(likeStoreKey) === "1";
  } catch {
    return false;
  }
}

function setLikedLocally(on) {
  try {
    if (on) localStorage.setItem(likeStoreKey, "1");
    else localStorage.removeItem(likeStoreKey);
  } catch {
    /* ignore */
  }
}

function postUrl() {
  return new URL(`./activity-post.html?id=${encodeURIComponent(postId)}`, window.location.href).href;
}

async function copyLink() {
  const url = postUrl();
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    window.prompt("Copy this link:", url);
    return false;
  }
}

let commentsUnsub = null;

function renderPost(db, data) {
  const title = data.title || "Activity post";
  const desc = data.description || "";
  const likes = Math.max(0, Number(data.likeCount) || 0);
  const liked = likedLocally();
  document.title = `${title} — Cardify`;
  if (header) header.textContent = title;
  if (!root) return;
  if (commentsUnsub) {
    try {
      commentsUnsub();
    } catch {
      /* */
    }
    commentsUnsub = null;
  }
  root.innerHTML = `<article class="activity-post-layout">
  <section class="activity-post-image-card" aria-label="${esc(title)}">
    <img class="activity-post-image" src="${esc(data.imageUrl || "")}" alt="" />
  </section>
  <div class="activity-post-column">
    <section class="activity-post-content-card">
      <p class="activity-post-kicker">Cardify activity</p>
      <h2 class="activity-post-title">${esc(title)}</h2>
      <p class="activity-post-description">${esc(desc)}</p>
      <div class="activity-post-row" aria-label="Post actions">
        <button type="button" class="activity-heart-btn ${liked ? "is-liked" : ""}" id="activityLikeBtn" title="${esc(liked ? "Unlike" : "Like")}" aria-pressed="${liked ? "true" : "false"}">
          <span class="activity-heart-ico-wrap">${liked ? HEART_ON : HEART_OFF}</span>
          <span class="activity-like-count" id="activityLikeCount">${String(likes)}</span>
        </button>
        <button type="button" class="activity-action-btn activity-copy-link-btn" id="activityCopyLinkBtn">Copy link</button>
      </div>
      <p class="activity-post-share-note" id="activityPostShareNote"></p>
    </section>
    <section class="activity-post-comments" aria-label="Comments">
      <h3 class="activity-comments-title">Comments</h3>
      <form class="activity-comment-form" id="activityCommentForm" novalidate>
        <label class="visually-hidden" for="activityCommentName">Name</label>
        <input type="text" id="activityCommentName" class="activity-comment-input" maxlength="80" placeholder="Name (e.g. Anonymous)" autocomplete="nickname" />
        <label class="visually-hidden" for="activityCommentText">Comment</label>
        <textarea id="activityCommentText" class="activity-comment-textarea" maxlength="2000" rows="3" required placeholder="Write a comment…"></textarea>
        <button type="submit" class="primary-btn activity-comment-submit" id="activityCommentSubmit">Post comment</button>
      </form>
      <ul class="activity-comment-list" id="activityCommentList" aria-live="polite"></ul>
    </section>
  </div>
</article>`;

  const likeBtn = document.getElementById("activityLikeBtn");
  const likeCountEl = document.getElementById("activityLikeCount");
  const noteEl = document.getElementById("activityPostShareNote");
  if (likeBtn && likeCountEl) {
    likeBtn.addEventListener("click", async () => {
      const wasLiked = likedLocally();
      const next = !wasLiked;
      const curDisplay = Math.max(0, Number(likeCountEl.textContent) || 0);
      likeBtn.disabled = true;
      try {
        await updateDoc(doc(db, "activityFeed", postId), { likeCount: increment(next ? 1 : -1) });
        setLikedLocally(next);
        const newCount = wasLiked ? curDisplay - 1 : curDisplay + 1;
        likeCountEl.textContent = String(Math.max(0, newCount));
        likeBtn.classList.toggle("is-liked", next);
        const wrap = likeBtn.querySelector(".activity-heart-ico-wrap");
        if (wrap) wrap.innerHTML = next ? HEART_ON : HEART_OFF;
        likeBtn.setAttribute("aria-pressed", next ? "true" : "false");
        if (noteEl) noteEl.textContent = "";
      } catch (err) {
        console.warn("activity like", err);
        if (noteEl) {
          const code = (err && err.code) || "";
          noteEl.textContent =
            code === "permission-denied"
              ? "Could not update like. Deploy the latest firestore rules (activityFeed) and try again."
              : "Could not update like. Please try again.";
        }
      }
      likeBtn.disabled = false;
    });
  }

  document.getElementById("activityCopyLinkBtn")?.addEventListener("click", async () => {
    const ok = await copyLink();
    if (noteEl) noteEl.textContent = ok ? "Link copied." : "";
  });

  const comList = document.getElementById("activityCommentList");
  const comForm = document.getElementById("activityCommentForm");
  const comSub = document.getElementById("activityCommentSubmit");

  const comQ = query(
    collection(db, "activityFeed", postId, "comments"),
    orderBy("createdAt", "desc"),
    limit(50)
  );
  commentsUnsub = onSnapshot(
    comQ,
    (snap) => {
      if (!comList) return;
      if (snap.empty) {
        comList.innerHTML = `<li class="activity-comment-empty">No comments yet. Be the first to comment.</li>`;
        return;
      }
      const out = [];
      snap.forEach((c) => {
        const cdata = c.data();
        const name = cdata.authorName && String(cdata.authorName).trim() ? esc(cdata.authorName) : "Guest";
        const t = cdata.text != null ? esc(cdata.text) : "";
        const when = cdata.createdAt?.toDate ? cdata.createdAt.toDate().toLocaleString() : "—";
        out.push(
          `<li class="activity-comment-item"><p class="activity-comment-meta"><strong>${name}</strong> · <span class="activity-comment-when">${esc(
            when
          )}</span></p><p class="activity-comment-text">${t}</p></li>`
        );
      });
      comList.innerHTML = out.join("");
    },
    (e) => {
      if (comList) {
        comList.innerHTML = `<li class="activity-comment-err">Could not load comments. <span class="activity-comment-err-code">${esc(
          String((e && e.code) || e || "err")
        )}</span> Deploy firestore rules and ensure an index if asked in the console.</li>`;
      }
      console.warn("activity comments", e);
    }
  );

  comForm?.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const nameRaw = (document.getElementById("activityCommentName")?.value || "").trim() || "Anonymous";
    const text = (document.getElementById("activityCommentText")?.value || "").trim();
    if (text.length < 1) return;
    if (comSub) comSub.disabled = true;
    if (noteEl) noteEl.textContent = "";
    try {
      await addDoc(collection(db, "activityFeed", postId, "comments"), {
        text: text.slice(0, 2000),
        authorName: nameRaw.slice(0, 80),
        createdAt: serverTimestamp()
      });
      document.getElementById("activityCommentText").value = "";
    } catch (e) {
      console.warn("comment add", e);
      if (noteEl) {
        noteEl.textContent =
          (e && e.code) === "permission-denied"
            ? "Could not post comment. Deploy the latest firestore rules (activityFeed comments)."
            : "Could not post comment. Try again.";
      }
    }
    if (comSub) comSub.disabled = false;
  });
}

if (!cfg || !root || !postId) {
  if (root) root.innerHTML = `<p class="admin-orders-hint">Post not found.</p>`;
} else {
  const app = getApps().length ? getApp() : initializeApp(cfg);
  const db = getFirestore(app);
  getDoc(doc(db, "activityFeed", postId))
    .then((snap) => {
      if (!snap.exists()) {
        root.innerHTML = `<p class="admin-orders-hint">Post not found.</p>`;
        return;
      }
      renderPost(db, snap.data());
    })
    .catch((e) => {
      console.warn("activity post", e);
      root.innerHTML = `<p class="admin-orders-hint">Could not load this post.</p>`;
    });
}
