const AIFTFeed = (() => {
  const API = "https://backend-1-9b6f.onrender.com";
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const state = {
    rootId: "",
    posts: [],
    me: null,
    meId: localStorage.getItem("userId"),
    replyTarget: null,
    activePostId: null,
    activeMenuPostId: null,
    repostPostId: null,
    socket: null,
    observer: null,
    loading: false,
    skip: 0,
    limit: 20,
    hasMore: true,
    followingUsers: [],
    selectedShareUsers: new Set(),
    openReplies: {},
    visibleComments: {},
    isMobile: window.innerWidth <= 768,
    lastTapAt: 0,
    viewedPosts: new Set()
  };

  function getToken() {
    return (
      localStorage.getItem("talentToken") ||
      localStorage.getItem("employerToken") ||
      localStorage.getItem("schoolToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("agentToken") ||
      localStorage.getItem("token")
    );
  }

  function headers(extra = {}) {
    return {
      Authorization: "Bearer " + getToken(),
      ...extra
    };
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function safeId(value) {
    return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
  }

  function root() {
    return document.getElementById(state.rootId);
  }

  function isMobileNow() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  function isMine(userId) {
    return String(userId || "") === String(state.meId || localStorage.getItem("userId"));
  }

  function userName(user = {}) {
    return user.companyName || user.schoolName || user.name || "AIFT User";
  }

  function userSub(user = {}) {
    return user.headline || user.profession || user.role || "AIFT Member";
  }

function userAvatar(user = {}) {
  return (
    user.profileImage ||
    user.avatar ||
    user.photoURL ||
    user.profilePicture ||
    DEFAULT_AVATAR
  );
}

  function isVerified(user = {}) {
    return Boolean(
      user.isVerified ||
      user.verified ||
      user.adminVerified ||
      user.badges?.verified
    );
  }

  function isAdmin() {
    return state.me?.role === "admin" || localStorage.getItem("role") === "admin";
  }

  function formatTime(dateValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric"
    });
  }

  function isFollowing(author = {}) {
    const myId = String(state.meId || localStorage.getItem("userId") || "");
    if (!author || !author._id || String(author._id) === myId) return true;

    if (typeof author.isFollowing === "boolean") return author.isFollowing;

    if (state.me?.following?.length) {
      return state.me.following.some(id => String(id?._id || id) === String(author._id));
    }

    const following = JSON.parse(localStorage.getItem("followingIds") || "[]");
    return following.some(id => String(id) === String(author._id));
  }

  async function api(url, options = {}) {
    const res = await fetch(url, options);
    let data = null;

    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      throw new Error(data?.message || data?.msg || `Request failed ${res.status}`);
    }

    return data;
  }

  function svg(name) {
    const icons = {
      heart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"></path></svg>`,
      comment: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"></path></svg>`,
      repost: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 1l4 4-4 4"></path><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><path d="M7 23l-4-4 4-4"></path><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`,
      share: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4 20-7Z"></path></svg>`,
      save: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"></path></svg>`,
      more: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="19" cy="12" r="1.8"></circle></svg>`,
      close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`,
      check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>`,
      copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
      flag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 22V4"></path><path d="M4 4h13l-1 5 1 5H4"></path></svg>`,
      info: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`,
      send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"></path><path d="M22 2 15 22 11 13 2 9 22 2Z"></path></svg>`,
      search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>`,
      trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>`,
      edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>`
    };

    return icons[name] || "";
  }

  async function mount(rootId, options = {}) {
    state.rootId = rootId;
    state.mode = options.mode || "home";
    state.authorId = options.authorId || null;
state.groupId = options.groupId || null;
    state.showComposer = options.showComposer !== false;
    state.infiniteScroll = options.infiniteScroll !== false;
    state.realtime = options.realtime !== false;
    state.limit = Number(options.limit || 20);
    state.skip = 0;
    state.hasMore = true;
    state.posts = [];
    state.meId = localStorage.getItem("userId");
    state.isMobile = window.innerWidth <= 768;

    if (!root()) return;

    if (!getToken()) {
      root().innerHTML = `<div class="aift-feed-empty">Please log in to view the feed.</div>`;
      return;
    }

await loadMe();

renderShell();
moveOverlaysToBody();

    const singlePostId = new URLSearchParams(location.search).get("post");
    if (singlePostId) {
      await loadSinglePost(singlePostId);
    } else {
      connectSocket();
      await loadFeed({ reset: true });
    }

    window.addEventListener("resize", debounce(() => {
      state.isMobile = window.innerWidth <= 768;
    }, 200));
  }

  async function loadMe() {
    try {
      const data = await api(`${API}/api/users/me`, {
        headers: headers()
      });

      state.me = data.user || data;
      state.meId = state.me?._id || localStorage.getItem("userId");
      if (state.meId) localStorage.setItem("userId", state.meId);
    } catch (err) {
      console.warn("Failed to load current user:", err.message);
    }
  }

  function renderShell() {
    root().innerHTML = `
      <div class="aift-feed-shell">
        ${state.showComposer ? `<section class="aift-composer">` : `<section class="aift-composer" style="display:none">`}
          <div class="aift-composer-row">
            <img class="aift-composer-avatar" src="${esc(userAvatar(state.me || {}))}" alt="" />
            <textarea id="aiftPostText" placeholder="Share something with the AIFT community..."></textarea>
          </div>

          <div class="aift-composer-actions">
            <label class="aift-upload-btn">
              <input id="aiftPostMedia" type="file" accept="image/*,video/*" multiple onchange="AIFTFeed.previewComposerMedia()" />
              Add media
            </label>
            <button class="aift-primary-btn" onclick="AIFTFeed.createPost()">Post</button>
          </div>

          <div id="aiftComposerPreview" class="aift-composer-preview"></div>
        </section>

        <section id="aiftFeedList" class="aift-feed-list"></section>
        <button id="aiftLoadMore" class="aift-load-more" onclick="AIFTFeed.loadMore()">Load more</button>
      </div>

      <div id="aiftSheetBackdrop" class="aift-sheet-backdrop" onclick="AIFTFeed.closeOverlays()"></div>

      <section id="aiftCommentsSheet" class="aift-bottom-sheet comments-sheet" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <header class="aift-sheet-head">
          <strong>Comments</strong>
          <button class="aift-icon-btn" onclick="AIFTFeed.closeOverlays()">${svg("close")}</button>
        </header>
        <div id="aiftCommentsBody" class="aift-sheet-body aift-comments-body"></div>
        <footer class="aift-comment-footer">
          <div id="aiftReplyBanner" class="aift-reply-banner">
            <span id="aiftReplyText"></span>
            <button onclick="AIFTFeed.cancelReply()">Cancel</button>
          </div>
          <div class="aift-comment-input-row">
            <img class="aift-input-avatar" src="${esc(userAvatar(state.me || {}))}" alt="" />
            <input id="aiftCommentInput" placeholder="Write a comment..." onkeydown="AIFTFeed.handleCommentKey(event)" />
            <button onclick="AIFTFeed.submitComment()">Post</button>
          </div>
        </footer>
      </section>

      <section id="aiftLikesSheet" class="aift-bottom-sheet compact" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <header class="aift-sheet-head">
          <strong>Liked by</strong>
          <button class="aift-icon-btn" onclick="AIFTFeed.closeOverlays()">${svg("close")}</button>
        </header>
        <div id="aiftLikesBody" class="aift-sheet-body"></div>
      </section>

      <section id="aiftShareSheet" class="aift-bottom-sheet share-sheet" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <header class="aift-sheet-head">
          <strong>Share</strong>
          <button class="aift-icon-btn" onclick="AIFTFeed.closeOverlays()">${svg("close")}</button>
        </header>
        <div id="aiftShareBody" class="aift-sheet-body"></div>
      </section>

      <section id="aiftMenuSheet" class="aift-bottom-sheet compact" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <div id="aiftMenuBody" class="aift-menu-body"></div>
      </section>

      <section id="aiftRepostSheet" class="aift-bottom-sheet compact" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <header class="aift-sheet-head">
          <strong>Repost</strong>
          <button class="aift-icon-btn" onclick="AIFTFeed.closeOverlays()">${svg("close")}</button>
        </header>
        <div class="aift-sheet-body">
          <textarea id="aiftRepostText" class="aift-repost-textarea" placeholder="Add your thoughts..."></textarea>
          <button class="aift-primary-btn wide" onclick="AIFTFeed.submitRepost()">Repost</button>
        </div>
      </section>
    `;
  }

  function moveOverlaysToBody() {
    [
      "aiftSheetBackdrop",
      "aiftCommentsSheet",
      "aiftLikesSheet",
      "aiftShareSheet",
      "aiftMenuSheet",
      "aiftRepostSheet"
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el && el.parentElement !== document.body) {
        document.body.appendChild(el);
      }
    });
  }

  async function loadSinglePost(postId) {
    const list = document.getElementById("aiftFeedList");
    const loadMore = document.getElementById("aiftLoadMore");

    if (loadMore) loadMore.style.display = "none";
    if (list) list.innerHTML = `<div class="aift-feed-empty">Loading post...</div>`;

    try {
      const post = await api(`${API}/api/posts/${postId}`, {
        headers: headers()
      });

      state.posts = [post];
      renderFeedOnly();
      connectSocket();
    } catch (err) {
      if (list) list.innerHTML = `<div class="aift-feed-empty">${esc(err.message)}</div>`;
    }
  }

  async function loadFeed({ reset = false } = {}) {
    if (state.loading) return;

    const list = document.getElementById("aiftFeedList");
    const loadMore = document.getElementById("aiftLoadMore");

    state.loading = true;

    if (reset) {
      state.skip = 0;
      state.hasMore = true;
      if (list) list.innerHTML = `<div class="aift-feed-empty">Loading feed...</div>`;
    }

let feedUrl =
`${API}/api/posts?skip=${state.skip}&limit=${state.limit}`;

if (
  state.mode === "group" &&
  state.groupId
) {
  feedUrl =
    `${API}/api/groups/${state.groupId}/posts`;
}

      if (state.mode === "profile" && state.authorId) {
        feedUrl += `&author=${encodeURIComponent(state.authorId)}`;
      }

      const posts = await api(feedUrl, {
        headers: headers()
      });

      const incoming =
  Array.isArray(posts)
    ? posts
    : Array.isArray(posts.posts)
      ? posts.posts
      : [];

      state.posts = reset ? incoming : mergePosts([...state.posts, ...incoming]);
      state.skip += incoming.length;
      state.hasMore = incoming.length === state.limit;

      renderFeedOnly();

      if (loadMore) loadMore.style.display = state.hasMore ? "block" : "none";
    } catch (err) {
      console.error(err);
      if (list) list.innerHTML = `<div class="aift-feed-empty">${esc(err.message)}</div>`;
    } finally {
      state.loading = false;
    }
  }

  function loadMore() {
    if (state.hasMore) loadFeed();
  }

  function mergePosts(posts) {
    const map = new Map();
    posts.forEach(post => {
      if (post?._id) map.set(String(post._id), post);
    });
    return Array.from(map.values());
  }

  function renderFeedOnly() {
    const list = document.getElementById("aiftFeedList");
    if (!list) return;

    const hidden = JSON.parse(localStorage.getItem("aiftHiddenPosts") || "[]");
    const visiblePosts = state.posts.filter(p => !hidden.includes(String(p._id)));

    list.innerHTML = visiblePosts.length
      ? visiblePosts.map(renderPost).join("")
      : `<div class="aift-feed-empty">No posts yet.</div>`;

    observePosts();
  }

  function getMediaItems(post = {}) {
    if (Array.isArray(post.media) && post.media.length) {
      return post.media;
    }

    if (post.mediaUrl) {
      return [{
        url: post.mediaUrl,
        type: post.mediaType || "image"
      }];
    }

    return [];
  }

  function renderMediaCarousel(post) {
    const items = getMediaItems(post);
    if (!items.length) return "";

    return `
      <div class="aift-carousel" ondblclick="AIFTFeed.doubleLike('${esc(post._id)}')" ontouchend="AIFTFeed.handleTapLike(event, '${esc(post._id)}')">
        <div class="aift-carousel-track" onscroll="AIFTFeed.updateCarouselDots(this)">
          ${items.map(item => `
            <div class="aift-carousel-slide">
              ${
                item.type === "video"
                  ? `<video class="aift-post-media" src="${esc(item.url)}" controls playsinline preload="metadata"></video>`
                  : `<img class="aift-post-media" src="${esc(item.url)}" alt="Post media" loading="lazy" />`
              }
            </div>
          `).join("")}
        </div>

        ${
          items.length > 1
            ? `<div class="aift-carousel-dots">
                ${items.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("")}
              </div>`
            : ""
        }

        <div class="aift-heart-overlay" id="aift-heart-${safeId(post._id)}">${svg("heart")}</div>
      </div>
    `;
  }

  function renderOriginalPostCard(original) {
    if (!original) return "";

    const author = original.author || {};
    const commentsCount = countComments(original);

    return `
      <div class="aift-repost-card" onclick="AIFTFeed.openOriginalPost('${esc(original._id)}')">
        <div class="aift-repost-author">
          <img src="${esc(userAvatar(author))}" alt="" />
          <div>
            <strong>${esc(userName(author))}</strong>
            <span>${esc(userSub(author))}${original.createdAt ? ` · ${formatTime(original.createdAt)}` : ""}</span>
          </div>
        </div>

        ${original.text?.trim() ? `<div class="aift-repost-text">${esc(original.text)}</div>` : ""}

        ${renderMediaCarousel(original)}

<div class="aift-repost-stats">
  <span>${(original.likes || []).length} likes</span>
  <span>${original.sharesCount || 0} shares</span>
  <span>${commentsCount} comments</span>
</div>
      </div>
    `;
  }

  function openOriginalPost(postId) {
    location.href = `feed.html?post=${encodeURIComponent(postId)}`;
  }

  function updateCarouselDots(track) {
    const carousel = track.closest(".aift-carousel, .aift-composer-preview");
    const dots = carousel?.querySelectorAll(".aift-carousel-dots span");
    if (!dots?.length) return;

    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

  function renderPost(post) {
    const author = post.author || {};
    const liked = (post.likes || []).some(u => String(u?._id || u) === String(state.meId));
    const commentsCount = countComments(post);
    const followed = isFollowing(author);
    const verified = isVerified(author);
    const canManage = isMine(author._id) || isAdmin();

    return `
      <article class="aift-post-card" id="aift-post-${safeId(post._id)}" data-post-id="${esc(post._id)}">
        <header class="aift-post-header">
          <div class="aift-author" onclick="AIFTFeed.visitProfile('${esc(author._id)}')">
            <img class="aift-avatar" src="${esc(userAvatar(author))}" alt="" />
            <div class="aift-author-text">
              <div class="aift-author-name">
                <strong>${esc(userName(author))}</strong>
                ${verified ? `<span class="aift-verified" title="Verified by AIFT admin">${svg("check")}</span>` : ""}
              </div>
              <span>${esc(userSub(author))}${post.createdAt ? ` · ${formatTime(post.createdAt)}` : ""}</span>
            </div>
          </div>

          <div class="aift-header-actions">
${
  !followed
    ? `<button
        class="aift-follow-btn"
        id="aift-follow-${safeId(author._id)}"
        onclick="event.stopPropagation(); AIFTFeed.toggleFollow('${esc(author._id)}')"
      >
        <span class="aift-follow-plus">+</span>
        <span>Follow</span>
      </button>`
    : ""
}
            <button class="aift-icon-btn" onclick="AIFTFeed.openPostMenu('${esc(post._id)}')">${svg("more")}</button>
          </div>
        </header>

        ${post.text?.trim() ? `<div class="aift-post-text">${esc(post.text)}</div>` : ""}

        ${post.repostOf ? renderOriginalPostCard(post.repostOf) : renderMediaCarousel(post)}

        <section class="aift-post-actions">
          <div class="aift-left-actions">
            <button class="aift-action-btn ${liked ? "is-liked" : ""}" onclick="AIFTFeed.likePost('${esc(post._id)}')" aria-label="Like">${svg("heart")}</button>
            <button class="aift-action-btn" onclick="AIFTFeed.openComments('${esc(post._id)}')" aria-label="Comment">${svg("comment")}</button>
            <button class="aift-action-btn" onclick="AIFTFeed.openRepost('${esc(post._id)}')" aria-label="Repost">${svg("repost")}</button>
            <button class="aift-action-btn" onclick="AIFTFeed.openShare('${esc(post._id)}')" aria-label="Share">${svg("share")}</button>
          </div>

          <button
  class="aift-action-btn aift-save-btn"
  id="aift-save-post-${safeId(post._id)}"
  onclick="AIFTFeed.savePost('${esc(post._id)}')"
  aria-label="Save"
  title="Save post"
>
  ${svg("save")}
</button>
        </section>

        <section class="aift-post-stats">
          <button onclick="AIFTFeed.openLikes('${esc(post._id)}')">
            <strong id="aift-likes-count-${safeId(post._id)}">${(post.likes || []).length}</strong> likes
          </button>
         <button onclick="AIFTFeed.openComments('${esc(post._id)}')">
  <strong id="aift-comments-count-${safeId(post._id)}">${commentsCount}</strong> comments
</button>
         ${
  !post.repostOf
    ? `<span id="aift-views-wrap-${safeId(post._id)}">
        <strong id="aift-views-count-${safeId(post._id)}">${post.viewsCount || 0}</strong> views
      </span>`
    : ""
}
          <span class="${post.sharesCount ? "" : "aift-hidden"}" id="aift-shares-wrap-${safeId(post._id)}">
            <strong id="aift-shares-count-${safeId(post._id)}">${post.sharesCount || 0}</strong> shares
          </span>
        </section>

        <section id="aift-comments-inline-${safeId(post._id)}" class="aift-comments-inline-container"></section>
      </article>
    `;
  }

  function countComments(post) {
    return (post.comments || []).reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
  }

  function previewComposerMedia() {
    const mediaEl = document.getElementById("aiftPostMedia");
    const preview = document.getElementById("aiftComposerPreview");
    if (!mediaEl || !preview) return;

    const files = Array.from(mediaEl.files || []);

    preview.innerHTML = files.length
      ? `
        <div class="aift-carousel-preview">
          <div class="aift-carousel-track" onscroll="AIFTFeed.updateCarouselDots(this)">
            ${files.map(file => {
              const url = URL.createObjectURL(file);

              return `
                <div class="aift-carousel-slide">
                  ${
                    file.type.startsWith("video/")
                      ? `<video src="${url}" controls playsinline></video>`
                      : `<img src="${url}" alt="">`
                  }
                </div>
              `;
            }).join("")}
          </div>

          ${
            files.length > 1
              ? `<div class="aift-carousel-dots">
                  ${files.map((_, i) => `<span class="${i === 0 ? "active" : ""}"></span>`).join("")}
                </div>`
              : ""
          }
        </div>
      `
      : "";
  }

async function createPost() {
  const textEl = document.getElementById("aiftPostText");
  const mediaEl = document.getElementById("aiftPostMedia");
  const preview = document.getElementById("aiftComposerPreview");
  const postBtn = document.querySelector(".aift-composer .aift-primary-btn");

  const text = textEl?.value.trim() || "";
  const files = Array.from(mediaEl?.files || []);

  if (!text && !files.length) {
    toast("Please write something or add media first.");
    return;
  }

  if (postBtn?.disabled) return;

  if (postBtn) {
    postBtn.disabled = true;
    postBtn.textContent = "Posting...";
  }

const form = new FormData();

form.append("text", text);

if (
  state.mode === "group" &&
  state.groupId
) {
  form.append(
    "groupId",
    state.groupId
  );
}

  files.forEach(file => {
    form.append("media", file);
  });

  try {
    const endpoint =
  state.mode === "group"
    ? `${API}/api/groups/${state.groupId}/posts`
    : `${API}/api/posts`;

const post = await api(
  endpoint, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getToken()
      },
      body: form
    });

    if (textEl) textEl.value = "";

    if (mediaEl) {
      mediaEl.value = "";

      const freshInput = mediaEl.cloneNode(true);
      mediaEl.parentNode.replaceChild(freshInput, mediaEl);
    }

    if (preview) preview.innerHTML = "";

    upsertPost(post, { prepend: true });
    toast("Post created.");
  } catch (err) {
    toast(err.message, "error");
  } finally {
    const freshBtn = document.querySelector(".aift-composer .aift-primary-btn");

    if (freshBtn) {
      freshBtn.disabled = false;
      freshBtn.textContent = "Post";
    }
  }
}
    async function likePost(postId, silent = false) {
    const post = getPost(postId);
    const beforeLiked = post?.likes?.some(u => String(u?._id || u) === String(state.meId));

    optimisticPostLike(postId, !beforeLiked);

    try {
      const data = await api(`${API}/api/posts/${postId}/like`, {
        method: "PATCH",
        headers: headers()
      });

      applyPostLike(postId, data);
    } catch (err) {
      optimisticPostLike(postId, beforeLiked);
      if (!silent) toast(err.message, "error");
    }
  }

  function optimisticPostLike(postId, liked) {
    const post = getPost(postId);
    if (!post) return;

    const me = state.me || { _id: state.meId };
    post.likes = post.likes || [];

    const has = post.likes.some(u => String(u?._id || u) === String(state.meId));

    if (liked && !has) post.likes.push(me);
    if (!liked && has) {
      post.likes = post.likes.filter(u => String(u?._id || u) !== String(state.meId));
    }

    updatePostActions(postId);
  }

  function applyPostLike(postId, data) {
    const post = getPost(postId);
    if (!post) return;

    if (Array.isArray(data.likes)) post.likes = data.likes;
    updatePostActions(postId);
  }

  function updatePostActions(postId) {
    const post = getPost(postId);
    if (!post) return;

    const card = document.getElementById(`aift-post-${safeId(postId)}`);
    if (!card) return;

    const liked = (post.likes || []).some(u => String(u?._id || u) === String(state.meId));
    const likeBtn = card.querySelector(".aift-action-btn");
    const count = document.getElementById(`aift-likes-count-${safeId(postId)}`);

    if (likeBtn) likeBtn.classList.toggle("is-liked", liked);
    if (count) count.textContent = String((post.likes || []).length);
  }

  function handleTapLike(event, postId) {
    const now = Date.now();

    if (now - state.lastTapAt < 320) {
      event.preventDefault();
      doubleLike(postId);
    }

    state.lastTapAt = now;
  }

  async function doubleLike(postId) {
    showHeart(postId);
    await likePost(postId, true);
  }

  function showHeart(postId) {
    const heart = document.getElementById(`aift-heart-${safeId(postId)}`);
    if (!heart) return;

    heart.classList.remove("show");
    void heart.offsetWidth;
    heart.classList.add("show");
    setTimeout(() => heart.classList.remove("show"), 900);
  }

  function openComments(postId) {
    const post = getPost(postId);
    if (!post) return;

    state.activePostId = postId;
    state.replyTarget = null;
    state.isMobile = isMobileNow();

    if (!state.isMobile) {
      renderInlineComments(postId);
      return;
    }

    const body = document.getElementById("aiftCommentsBody");
    const input = document.getElementById("aiftCommentInput");

    if (!body) return;

    body.innerHTML = `
      <div class="aift-comments-topbar">
        <button class="aift-comments-filter">Most relevant</button>
      </div>
      <div class="aift-comments-preview">
        ${renderComments(post, 3)}
      </div>
    `;

    if (input) input.value = "";

    hideReplyBanner();
    openOverlay("aiftCommentsSheet");

    setTimeout(() => {
      const sheet = document.getElementById("aiftCommentsSheet");
      if (sheet) {
        sheet.classList.add("open");
        sheet.style.display = "flex";
        sheet.style.visibility = "visible";
        sheet.style.pointerEvents = "auto";
      }
    }, 30);
  }

  function renderInlineComments(postId) {
    const post = getPost(postId);
    if (!post) return;

    const container = document.getElementById(`aift-comments-inline-${safeId(postId)}`);
    if (!container) return;

    const isOpen = container.dataset.open === "true";

    if (isOpen) {
      container.innerHTML = "";
      container.dataset.open = "false";
      return;
    }

    container.dataset.open = "true";
    container.innerHTML = `
      <div class="aift-inline-comments">
        <div class="aift-comments-topbar">
          <button class="aift-comments-filter">Most relevant</button>
        </div>

        <div class="aift-inline-comments-list">
          ${renderComments(post, 3)}
        </div>

        ${renderInlineCommentInput(postId)}
      </div>
    `;
  }

  function renderInlineCommentInput(postId) {
    return `
      <div class="aift-inline-input">
        <img class="aift-input-avatar" src="${esc(userAvatar(state.me || {}))}" alt="" />
        <input
          type="text"
          placeholder="Write a comment..."
          onkeydown="AIFTFeed.handleInlineCommentKey(event, '${esc(postId)}', this)"
        />
        <button onclick="AIFTFeed.submitInlineComment('${esc(postId)}', this.previousElementSibling)">Post</button>
      </div>
    `;
  }

  function renderComments(post, limit = 3) {
    const comments = post.comments || [];
    const visibleLimit = state.visibleComments[post._id] || limit;
    const visibleComments = comments.slice(-visibleLimit);

    if (!comments.length) {
      return `<div class="aift-feed-empty flat">No comments yet. Be the first to comment.</div>`;
    }

    return `
      ${visibleComments.map(comment => renderComment(post._id, comment)).join("")}

      ${
        comments.length > visibleComments.length
          ? `<button class="aift-view-more-comments" onclick="AIFTFeed.showMoreComments('${esc(post._id)}')">
              View more comments
            </button>`
          : ""
      }
    `;
  }

  function showAllComments(postId) {
    const post = getPost(postId);
    if (!post) return;

    if (state.isMobile) {
      document.getElementById("aiftCommentsBody").innerHTML = `
        <div class="aift-comments-topbar">
          <button class="aift-comments-filter">Most relevant</button>
        </div>
        ${renderComments(post)}
      `;
      return;
    }

    const container = document.getElementById(`aift-comments-inline-${safeId(postId)}`);
    if (!container) return;

    container.innerHTML = `
      <div class="aift-inline-comments">
        <div class="aift-comments-topbar">
          <button class="aift-comments-filter">Most relevant</button>
        </div>
        <div class="aift-inline-comments-list">${renderComments(post)}</div>
        ${renderInlineCommentInput(postId)}
      </div>
    `;
    container.dataset.open = "true";
  }

  function renderComment(postId, comment) {
    const user = comment.user || {};
    const liked = (comment.likes || []).some(u => String(u?._id || u) === String(state.meId));
    const replies = comment.replies || [];
    const repliesOpen = Boolean(state.openReplies[comment._id]);
    const canDelete = isMine(user._id) || isMine(getPost(postId)?.author?._id) || isAdmin();

    return `
      <div class="aift-fb-comment" id="aift-comment-${safeId(comment._id)}">
        <img class="aift-fb-avatar" src="${esc(userAvatar(user))}" alt="" />

        <div class="aift-fb-comment-content">
          <div class="aift-fb-line">
            <div class="aift-fb-bubble">
              <div class="aift-fb-name-row">
                <span class="aift-fb-name">${esc(userName(user))}</span>
                ${isVerified(user) ? `<span class="aift-mini-verified">${svg("check")}</span>` : ""}
              </div>
              <div class="aift-fb-sub">${esc(userSub(user))}</div>
              <div class="aift-fb-text">${esc(comment.text)}</div>
            </div>

            ${
              canDelete
                ? `<button class="aift-comment-more" onclick="AIFTFeed.deleteComment('${esc(postId)}','${esc(comment._id)}')" title="Delete comment">${svg("trash")}</button>`
                : `<button class="aift-comment-more" title="More">${svg("more")}</button>`
            }
          </div>

          <div class="aift-fb-actions">
            <button class="aift-heart-mini ${liked ? "active" : ""}" onclick="AIFTFeed.likeComment('${esc(postId)}','${esc(comment._id)}')">
              ${svg("heart")}
              <span>${(comment.likes || []).length || ""}</span>
            </button>

            <button onclick="AIFTFeed.replyTo('${esc(postId)}','${esc(comment._id)}','${esc(userName(user))}')">Reply</button>
            <span>${formatTime(comment.createdAt)}</span>
          </div>

          ${
            replies.length && !repliesOpen
              ? `<button class="aift-view-replies" onclick="AIFTFeed.toggleReplies('${esc(comment._id)}')">
                  View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}
                </button>`
              : ""
          }

          ${
            replies.length && repliesOpen
              ? `<div class="aift-fb-replies">
                  ${replies.map(reply => renderReply(postId, comment._id, reply, user)).join("")}
                  <button class="aift-view-replies less" onclick="AIFTFeed.toggleReplies('${esc(comment._id)}')">Hide replies</button>
                </div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  function renderReply(postId, commentId, reply, parentUser = {}) {
    const user = reply.user || {};
    const liked = (reply.likes || []).some(u => String(u?._id || u) === String(state.meId));
    const canDelete = isMine(user._id) || isMine(getPost(postId)?.author?._id) || isAdmin();

    return `
      <div class="aift-fb-comment aift-fb-reply" id="aift-reply-${safeId(reply._id)}">
        <span class="aift-reply-connector"></span>
        <img class="aift-fb-avatar small" src="${esc(userAvatar(user))}" alt="" />

        <div class="aift-fb-comment-content">
          <div class="aift-fb-line">
            <div class="aift-fb-bubble reply">
              <div class="aift-fb-name-row">
                <span class="aift-fb-name">${esc(userName(user))}</span>
                ${isVerified(user) ? `<span class="aift-mini-verified">${svg("check")}</span>` : ""}
              </div>
              <div class="aift-fb-text"><span class="aift-reply-to">@${esc(userName(parentUser))}</span> ${esc(reply.text)}</div>
            </div>

            ${
              canDelete
                ? `<button class="aift-comment-more" onclick="AIFTFeed.deleteReply('${esc(postId)}','${esc(commentId)}','${esc(reply._id)}')" title="Delete reply">${svg("trash")}</button>`
                : ""
            }
          </div>

          <div class="aift-fb-actions">
            <button class="aift-heart-mini ${liked ? "active" : ""}" onclick="AIFTFeed.likeReply('${esc(postId)}','${esc(commentId)}','${esc(reply._id)}')">
              ${svg("heart")}
              <span>${(reply.likes || []).length || ""}</span>
            </button>

            <span>${formatTime(reply.createdAt)}</span>
          </div>
        </div>
      </div>
    `;
  }

  function handleCommentKey(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitComment();
    }
  }

  function handleInlineCommentKey(event, postId, inputEl) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitInlineComment(postId, inputEl);
    }
  }

  function handleInlineReplyKey(event, postId, commentId, inputEl) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitInlineReply(postId, commentId, inputEl);
    }
  }

  async function submitInlineReply(postId, commentId, inputEl) {
    const text = inputEl?.value.trim();
    if (!text) return;

    inputEl.disabled = true;

    try {
      await api(`${API}/api/posts/${postId}/comments/${commentId}/reply`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text })
      });

      state.openReplies[commentId] = true;
      state.replyTarget = null;

      await refreshOnePost(postId);
      rerenderActiveComments(postId);
      updateCommentCount(postId);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      inputEl.disabled = false;
    }
  }

  async function submitComment() {
    const input = document.getElementById("aiftCommentInput");
    const text = input?.value.trim();
    const postId = state.activePostId;

    if (!text || !postId) return;

    input.disabled = true;

    try {
      if (state.replyTarget?.commentId) {
        await api(`${API}/api/posts/${postId}/comments/${state.replyTarget.commentId}/reply`, {
          method: "POST",
          headers: headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ text })
        });
      } else {
        await api(`${API}/api/posts/${postId}/comment`, {
          method: "POST",
          headers: headers({ "Content-Type": "application/json" }),
          body: JSON.stringify({ text })
        });
      }

      input.value = "";
      state.replyTarget = null;
      hideReplyBanner();

      await refreshOnePost(postId);
      const post = getPost(postId);

      if (post) {
        document.getElementById("aiftCommentsBody").innerHTML = `
          <div class="aift-comments-topbar">
            <button class="aift-comments-filter">Most relevant</button>
          </div>
          <div class="aift-comments-preview">${renderComments(post, 3)}</div>
        `;
        updateCommentCount(postId);
      }
    } catch (err) {
      toast(err.message, "error");
    } finally {
      input.disabled = false;
      input.focus();
    }
  }

  async function submitInlineComment(postId, inputEl) {
    const text = inputEl?.value.trim();
    if (!text) return;

    inputEl.disabled = true;

    try {
      await api(`${API}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text })
      });

      inputEl.value = "";
      await refreshOnePost(postId);
      showAllComments(postId);
      updateCommentCount(postId);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      inputEl.disabled = false;
      inputEl.focus();
    }
  }

  async function likeComment(postId, commentId) {
    try {
      await api(`${API}/api/posts/${postId}/comments/${commentId}/like`, {
        method: "PATCH",
        headers: headers()
      });

      await refreshOnePost(postId);
      rerenderActiveComments(postId);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function likeReply(postId, commentId, replyId) {
    try {
      await api(`${API}/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
        method: "PATCH",
        headers: headers()
      });

      await refreshOnePost(postId);
      rerenderActiveComments(postId);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function deleteComment(postId, commentId) {
    openConfirmModal({
      title: "Delete comment?",
      message: "This comment will be removed from the post. This action cannot be undone.",
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        await api(`${API}/api/posts/${postId}/comments/${commentId}`, {
          method: "DELETE",
          headers: headers()
        });

        await refreshOnePost(postId);
        rerenderActiveComments(postId);
        updateCommentCount(postId);
        toast("Comment deleted.");
      }
    });
  }

  async function deleteReply(postId, commentId, replyId) {
    openConfirmModal({
      title: "Delete reply?",
      message: "This reply will be removed from the comment thread.",
      confirmText: "Delete",
      danger: true,
      onConfirm: async () => {
        await api(`${API}/api/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
          method: "DELETE",
          headers: headers()
        });

        await refreshOnePost(postId);
        rerenderActiveComments(postId);
        updateCommentCount(postId);
        toast("Reply deleted.");
      }
    });
  }
    function rerenderActiveComments(postId) {
    const post = getPost(postId);
    if (!post) return;

    if (state.isMobile && state.activePostId === postId) {
      const body = document.getElementById("aiftCommentsBody");
      if (body) {
        body.innerHTML = `
          <div class="aift-comments-topbar">
            <button class="aift-comments-filter">Most relevant</button>
          </div>
          <div class="aift-comments-preview">${renderComments(post, 3)}</div>
        `;
      }
      return;
    }

    const container = document.getElementById(`aift-comments-inline-${safeId(postId)}`);
    if (container?.dataset.open === "true") {
      showAllComments(postId);
    }
  }

  function replyTo(postId, commentId, name) {
    state.activePostId = postId;
    state.replyTarget = { commentId, name };

    if (!state.isMobile) {
      document.querySelectorAll(".aift-inline-reply-box").forEach(box => box.remove());

      const commentEl = document.getElementById(`aift-comment-${safeId(commentId)}`);
      if (!commentEl) return;

      const replyBox = document.createElement("div");
      replyBox.className = "aift-inline-reply-box";
      replyBox.innerHTML = `
        <div class="aift-reply-banner show">
          <span>Replying to ${esc(name)}</span>
          <button onclick="AIFTFeed.cancelReply()">Cancel</button>
        </div>

        <div class="aift-inline-input">
          <img class="aift-input-avatar" src="${esc(userAvatar(state.me || {}))}" alt="" />
          <input
            type="text"
            placeholder="Write a reply..."
            onkeydown="AIFTFeed.handleInlineReplyKey(event, '${esc(postId)}', '${esc(commentId)}', this)"
          />
          <button onclick="AIFTFeed.submitInlineReply('${esc(postId)}', '${esc(commentId)}', this.previousElementSibling)">Post</button>
        </div>
      `;

      commentEl.querySelector(".aift-fb-comment-content")?.appendChild(replyBox);
      replyBox.querySelector("input")?.focus();
      return;
    }

    const banner = document.getElementById("aiftReplyBanner");
    const text = document.getElementById("aiftReplyText");
    const input = document.getElementById("aiftCommentInput");

    if (banner && text) {
      text.textContent = `Replying to ${name}`;
      banner.classList.add("show");
    }

    input?.focus();
  }

  function hideReplyBanner() {
    document.getElementById("aiftReplyBanner")?.classList.remove("show");
  }

  function cancelReply() {
    state.replyTarget = null;
    document.querySelectorAll(".aift-inline-reply-box").forEach(box => box.remove());
    hideReplyBanner();
  }

  function toggleReplies(commentId) {
    state.openReplies[commentId] = !state.openReplies[commentId];
    rerenderActiveComments(state.activePostId);
  }

  function showMoreComments(postId) {
    state.visibleComments[postId] = (state.visibleComments[postId] || 3) + 5;
    rerenderActiveComments(postId);
  }

  async function openLikes(postId) {
    const body = document.getElementById("aiftLikesBody");
    body.innerHTML = `<div class="aift-feed-empty flat">Loading likes...</div>`;
    openOverlay("aiftLikesSheet");

    try {
      const people = await api(`${API}/api/posts/${postId}/likes`, {
        headers: headers()
      });

      body.innerHTML = people.length
        ? people.map(renderPersonRow).join("")
        : `<div class="aift-feed-empty flat">No likes yet.</div>`;
    } catch (err) {
      body.innerHTML = `<div class="aift-feed-empty flat">${esc(err.message)}</div>`;
    }
  }

  function renderPersonRow(user) {
    return `
      <div class="aift-person-row" onclick="AIFTFeed.visitProfile('${esc(user._id)}')">
        <img src="${esc(userAvatar(user))}" alt="" />
        <div>
          <strong>${esc(userName(user))}</strong>
          <span>${esc(userSub(user))}</span>
        </div>
      </div>
    `;
  }

  async function openShare(postId) {
    state.activePostId = postId;
    state.selectedShareUsers = new Set();

    if (!state.followingUsers.length) {
      try {
        state.followingUsers = await api(`${API}/api/users/me/following`, {
          headers: headers()
        });
      } catch {
        state.followingUsers = [];
      }
    }

    renderShareUI(postId);
    openOverlay("aiftShareSheet");
  }

  function renderShareUI(postId, keyword = "") {
    const body = document.getElementById("aiftShareBody");
    const link = getPostLink(postId);
    const users = state.followingUsers.filter(user => {
      const term = `${userName(user)} ${userSub(user)}`.toLowerCase();
      return term.includes(keyword.toLowerCase());
    });

    body.innerHTML = `
      <div class="aift-share-search">
        ${svg("search")}
        <input placeholder="Search people you follow" value="${esc(keyword)}" oninput="AIFTFeed.filterShareUsers('${esc(postId)}', this.value)" />
      </div>

      <div class="aift-share-grid">
        ${
          users.length
            ? users.map(user => renderShareUser(postId, user)).join("")
            : `<div class="aift-feed-empty flat">You are not following anyone yet.</div>`
        }
      </div>

      <div class="aift-share-actions">
        <button onclick="AIFTFeed.copyPostLink('${esc(postId)}')">${svg("copy")} Copy link</button>
        <button onclick="AIFTFeed.openRepost('${esc(postId)}')">${svg("repost")} Repost</button>
        <button onclick="AIFTFeed.nativeShare('${esc(postId)}')">${svg("share")} More</button>
      </div>

      <button id="aiftSendSelectedBtn" class="aift-primary-btn wide" disabled onclick="AIFTFeed.sendSelectedPost('${esc(postId)}')">
        Send
      </button>

      <div class="aift-copy-link">${esc(link)}</div>
    `;
  }

  function renderShareUser(postId, user) {
    const selected = state.selectedShareUsers.has(String(user._id));

    return `
      <button class="aift-share-user ${selected ? "selected" : ""}" onclick="AIFTFeed.toggleShareUser('${esc(postId)}','${esc(user._id)}')">
        <span class="aift-share-avatar-wrap">
          <img src="${esc(userAvatar(user))}" alt="" />
          ${selected ? `<span class="aift-share-check">${svg("check")}</span>` : ""}
        </span>
        <span>${esc(userName(user))}</span>
      </button>
    `;
  }

  function filterShareUsers(postId, keyword) {
    renderShareUI(postId, keyword);
  }

  function toggleShareUser(postId, userId) {
    if (state.selectedShareUsers.has(String(userId))) {
      state.selectedShareUsers.delete(String(userId));
    } else {
      state.selectedShareUsers.add(String(userId));
    }

    renderShareUI(postId);
    const btn = document.getElementById("aiftSendSelectedBtn");
    if (btn) btn.disabled = state.selectedShareUsers.size === 0;
  }

  async function sendSelectedPost(postId) {
    const userIds = Array.from(state.selectedShareUsers);
    if (!userIds.length) return;

    try {
      const data = await api(`${API}/api/posts/${postId}/send`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ userIds })
      });

      const post = getPost(postId);
      if (post) post.sharesCount = data.sharesCount;

      updateShareCount(postId, data.sharesCount);
      closeOverlays();
      toast(`Sent to ${data.sentTo} user${data.sentTo > 1 ? "s" : ""}.`);
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function copyPostLink(postId) {
    await trackShare(postId);
    const link = getPostLink(postId);

    try {
      await navigator.clipboard.writeText(link);
      toast("Post link copied.");
    } catch {
      alert(link);
    }
  }

  async function nativeShare(postId) {
    await trackShare(postId);

    const post = getPost(postId);
    const link = getPostLink(postId);

    if (navigator.share) {
      await navigator.share({
        title: "AIFT Post",
        text: post?.text || "Check this AIFT post",
        url: link
      });
    } else {
      await copyPostLink(postId);
    }
  }

  async function trackShare(postId) {
    try {
      const data = await api(`${API}/api/posts/${postId}/share`, {
        method: "POST",
        headers: headers()
      });

      const post = getPost(postId);
      if (post) post.sharesCount = data.sharesCount;

      updateShareCount(postId, data.sharesCount);
    } catch (err) {
      console.warn("Share tracking failed:", err.message);
    }
  }

  function updateShareCount(postId, sharesCount) {
    const count = document.getElementById(`aift-shares-count-${safeId(postId)}`);
    const wrap = document.getElementById(`aift-shares-wrap-${safeId(postId)}`);

    if (count) count.textContent = String(sharesCount || 0);
    if (wrap) wrap.classList.toggle("aift-hidden", !sharesCount);
  }

  function updateViewCount(postId, viewsCount) {
    const count = document.getElementById(`aift-views-count-${safeId(postId)}`);
    if (count) count.textContent = String(viewsCount || 0);
  }

  function updateCommentCount(postId) {
    const post = getPost(postId);
    const count = document.getElementById(`aift-comments-count-${safeId(postId)}`);
    if (post && count) count.textContent = String(countComments(post));
  }

  function getPostLink(postId) {
    return `${location.origin}${location.pathname}?post=${encodeURIComponent(postId)}`;
  }

  function openRepost(postId) {
    state.repostPostId = postId;
    const textarea = document.getElementById("aiftRepostText");
    if (textarea) textarea.value = "";
    openOverlay("aiftRepostSheet");
  }

  async function submitRepost() {
    const text = document.getElementById("aiftRepostText").value.trim();

    try {
      const post = await api(`${API}/api/posts/${state.repostPostId}/repost`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text })
      });

      closeOverlays();
      upsertPost(post, { prepend: true });
      toast("Reposted.");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  function openPostMenu(postId) {
    state.activeMenuPostId = postId;
    const post = getPost(postId);
    const author = post?.author || {};
    const canManage = isMine(author._id) || isAdmin();

    document.getElementById("aiftMenuBody").innerHTML = `
      <button class="aift-sheet-option" onclick="AIFTFeed.savePost('${esc(postId)}')">${svg("save")}<span>Save post</span></button>
      <button class="aift-sheet-option" onclick="AIFTFeed.notInterested('${esc(postId)}')">${svg("close")}<span>Not interested</span></button>
      <button class="aift-sheet-option" onclick="AIFTFeed.visitProfile('${esc(author._id)}')">${svg("info")}<span>About this account</span></button>
      ${
        canManage
          ? `<button class="aift-sheet-option danger" onclick="AIFTFeed.deletePost('${esc(postId)}')">${svg("trash")}<span>Delete post</span></button>`
          : `<button class="aift-sheet-option danger" onclick="AIFTFeed.reportPost('${esc(postId)}')">${svg("flag")}<span>Report</span></button>`
      }
    `;

    openOverlay("aiftMenuSheet");
  }

async function savePost(postId) {
  const btn = document.getElementById(`aift-save-post-${safeId(postId)}`);

  try {
    if (btn) {
      btn.disabled = true;
    }

    const data = await api(`${API}/api/saved`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        itemType: "post",
        itemId: postId
      })
    });

    if (btn) {
      btn.classList.add("is-saved");
      btn.title = "Saved";
    }

    closeOverlays();
    toast(data.alreadySaved ? "Post already saved." : "Post saved.");
  } catch (err) {
    const saved = JSON.parse(localStorage.getItem("aiftSavedPosts") || "[]");

    if (!saved.includes(postId)) {
      saved.push(postId);
    }

    localStorage.setItem("aiftSavedPosts", JSON.stringify(saved));

    if (btn) {
      btn.classList.add("is-saved");
      btn.title = "Saved locally";
    }

    toast("Post saved locally.");
  } finally {
    if (btn) {
      btn.disabled = false;
    }
  }
}

  function notInterested(postId) {
    const hidden = JSON.parse(localStorage.getItem("aiftHiddenPosts") || "[]");
    if (!hidden.includes(postId)) hidden.push(postId);
    localStorage.setItem("aiftHiddenPosts", JSON.stringify(hidden));

    state.posts = state.posts.filter(p => String(p._id) !== String(postId));
    document.getElementById(`aift-post-${safeId(postId)}`)?.remove();
    closeOverlays();
  }

  async function reportPost(postId) {
    try {
      await api(`${API}/api/posts/${postId}/report`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reason: "Reported from feed menu" })
      });

      closeOverlays();
      toast("Thanks. This post has been reported.");
    } catch (err) {
      toast(err.message, "error");
    }
  }

  async function deletePost(postId) {
    if (!confirm("Delete this post?")) return;

    try {
      await api(`${API}/api/posts/${postId}`, {
        method: "DELETE",
        headers: headers()
      });

      state.posts = state.posts.filter(post => String(post._id) !== String(postId));
      document.getElementById(`aift-post-${safeId(postId)}`)?.remove();
      closeOverlays();
      toast("Post deleted.");
    } catch (err) {
      toast(err.message, "error");
    }
  }

async function toggleFollow(userId) {
  if (!userId || isMine(userId)) return;

  const btn = document.getElementById(`aift-follow-${safeId(userId)}`);

  if (btn) {
    btn.disabled = true;
    btn.classList.add("is-loading");
    btn.innerHTML = `<span class="aift-follow-loader"></span><span>Following</span>`;
  }

  try {
    const data = await api(`${API}/api/users/${userId}/follow`, {
      method: "PATCH",
      headers: headers()
    });

    const isNowFollowing =
      data.following === true ||
      data.isFollowing === true ||
      data.status === "followed";

    const following = JSON.parse(localStorage.getItem("followingIds") || "[]");

    const next = isNowFollowing
      ? Array.from(new Set([...following, userId]))
      : following.filter(id => String(id) !== String(userId));

    localStorage.setItem("followingIds", JSON.stringify(next));

    state.posts.forEach(post => {
      if (String(post.author?._id) === String(userId)) {
        post.author.isFollowing = isNowFollowing;
      }
    });

    if (btn && isNowFollowing) {
      btn.classList.remove("is-loading");
      btn.classList.add("is-followed");
      btn.innerHTML = `<span class="aift-follow-check">${svg("check")}</span><span>Following</span>`;

      setTimeout(() => {
        renderFeedOnly();
      }, 900);
    } else {
      renderFeedOnly();
    }

    toast(isNowFollowing ? "You are now following this profile." : "You unfollowed this profile.");
  } catch (err) {
    if (btn) {
      btn.disabled = false;
      btn.classList.remove("is-loading");
      btn.innerHTML = `<span class="aift-follow-plus">+</span><span>Follow</span>`;
    }

    toast(err.message, "error");
  }
}

async function visitProfile(userId) {
  if (!userId) return;

  try {
    const data = await api(`${API}/api/users/${userId}/public`, {
      headers: headers()
    });

    const user = data.user || data;
    const r = String(user.role || "").toLowerCase();

    if (r === "employer") {
      window.location.href = `employer-public-profile.html?id=${encodeURIComponent(userId)}`;
      return;
    }

    if (r === "school") {
      window.location.href = `school.html?id=${encodeURIComponent(userId)}`;
      return;
    }

    window.location.href = `agent-public-profile.html?id=${encodeURIComponent(userId)}`;
  } catch (err) {
    window.location.href = `agent-public-profile.html?id=${encodeURIComponent(userId)}`;
  }
}

  async function refreshOnePost(postId) {
    try {
      const post = await api(`${API}/api/posts/${postId}`, {
        headers: headers()
      });

      upsertPost(post, { rerender: false });
    } catch (err) {
      console.warn("Single post refresh failed:", err.message);
      await loadFeed({ reset: true });
    }
  }

  function getPost(postId) {
    return state.posts.find(p => String(p._id) === String(postId));
  }

  function upsertPost(post, { prepend = false, rerender = true } = {}) {
    if (!post?._id) return;

    const index = state.posts.findIndex(p => String(p._id) === String(post._id));

    if (index >= 0) {
      state.posts[index] = post;
    } else if (prepend) {
      state.posts.unshift(post);
    } else {
      state.posts.push(post);
    }

    if (rerender) renderFeedOnly();
  }

  function openOverlay(id) {
    moveOverlaysToBody();
    closeOverlays(false);

    const backdrop = document.getElementById("aiftSheetBackdrop");
    const sheet = document.getElementById(id);

    if (backdrop) {
      backdrop.classList.add("open");
      backdrop.style.display = "block";
    }

    if (sheet) {
      sheet.classList.add("open");
      sheet.setAttribute("aria-hidden", "false");
      sheet.style.display = "flex";
    }

    document.body.classList.add("aift-sheet-open");
  }

  function closeOverlays(clear = true) {
    const backdrop = document.getElementById("aiftSheetBackdrop");

    if (backdrop) {
      backdrop.classList.remove("open");
      backdrop.style.display = "";
    }

    document.querySelectorAll(".aift-bottom-sheet").forEach(sheet => {
      sheet.classList.remove("open");
      sheet.setAttribute("aria-hidden", "true");
      sheet.style.display = "";
    });

    document.body.classList.remove("aift-sheet-open");

    if (clear) {
      state.replyTarget = null;
      hideReplyBanner();
    }
  }

  function observePosts() {
    if (!("IntersectionObserver" in window)) return;

    if (state.observer) state.observer.disconnect();

    state.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const postId = entry.target.dataset.postId;
          if (postId) trackView(postId);
          state.observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.55 });

    document.querySelectorAll(".aift-post-card[data-post-id]").forEach(card => {
      state.observer.observe(card);
    });
  }

  async function trackView(postId) {
    if (state.viewedPosts.has(String(postId))) return;

    state.viewedPosts.add(String(postId));

    try {
      const data = await api(`${API}/api/posts/${postId}/view`, {
        method: "PATCH",
        headers: headers()
      });

      const post = getPost(postId);
      if (post && typeof data.viewsCount !== "undefined") {
        post.viewsCount = data.viewsCount;
      }

      updateViewCount(postId, data.viewsCount);
    } catch (err) {
      console.warn("View tracking failed:", err.message);
    }
  }

  function connectSocket() {
    if (state.socket || typeof io === "undefined") return;

    try {
      state.socket = io(API, {
        transports: ["websocket", "polling"],
        auth: { token: getToken() }
      });

      state.socket.on("post_created", post => upsertPost(post, { prepend: true }));
      state.socket.on("post_updated", post => upsertPost(post));

      state.socket.on("post_deleted", payload => {
        state.posts = state.posts.filter(post => String(post._id) !== String(payload.postId));
        document.getElementById(`aift-post-${safeId(payload.postId)}`)?.remove();
      });

      state.socket.on("post_like", payload => {
        const post = getPost(payload.postId);
        if (!post) return;
        if (Array.isArray(payload.likes)) post.likes = payload.likes;
        updatePostActions(payload.postId);
      });

      ["new_comment", "new_reply", "comment_like", "reply_like", "comment_deleted", "reply_deleted"].forEach(eventName => {
        state.socket.on(eventName, payload => {
          refreshSocketPost(payload.postId);
        });
      });

      state.socket.on("post_shared", payload => {
        const post = getPost(payload.postId);
        if (post) post.sharesCount = payload.sharesCount;
        updateShareCount(payload.postId, payload.sharesCount);
      });

      state.socket.on("post_viewed", payload => {
        const post = getPost(payload.postId);
        if (post) post.viewsCount = payload.viewsCount;
        updateViewCount(payload.postId, payload.viewsCount);
      });

      state.socket.on("user_follow_updated", payload => {
        state.posts.forEach(post => {
          if (String(post.author?._id) === String(payload.targetId)) {
            post.author.isFollowing = payload.following;
          }
        });
        renderFeedOnly();
      });
    } catch (err) {
      console.warn("Socket connection failed:", err.message);
    }
  }

  async function refreshSocketPost(postId) {
    await refreshOnePost(postId);
    rerenderActiveComments(postId);
    updateCommentCount(postId);
  }

  function debounce(fn, delay = 250) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

  function openConfirmModal({ title, message, confirmText = "Confirm", danger = false, onConfirm }) {
    let modal = document.getElementById("aiftConfirmModal");

    if (!modal) {
      modal = document.createElement("div");
      modal.id = "aiftConfirmModal";
      modal.className = "aift-confirm-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="aift-confirm-card" role="dialog" aria-modal="true">
        <div class="aift-confirm-icon ${danger ? "danger" : ""}">
          ${svg("trash")}
        </div>

        <div class="aift-confirm-content">
          <h3>${esc(title)}</h3>
          <p>${esc(message)}</p>
        </div>

        <div class="aift-confirm-actions">
          <button class="aift-confirm-cancel" type="button">Cancel</button>
          <button class="aift-confirm-ok ${danger ? "danger" : ""}" type="button">${esc(confirmText)}</button>
        </div>
      </div>
    `;

    modal.classList.add("show");

    modal.querySelector(".aift-confirm-cancel").onclick = () => {
      modal.classList.remove("show");
    };

    modal.onclick = e => {
      if (e.target === modal) modal.classList.remove("show");
    };

    modal.querySelector(".aift-confirm-ok").onclick = async () => {
      const btn = modal.querySelector(".aift-confirm-ok");
      btn.disabled = true;
      btn.textContent = "Deleting...";

      try {
        await onConfirm();
        modal.classList.remove("show");
      } catch (err) {
        toast(err.message, "error");
        btn.disabled = false;
        btn.textContent = confirmText;
      }
    };
  }

  function toast(message, type = "success") {
    let el = document.getElementById("aiftFeedToast");

    if (!el) {
      el = document.createElement("div");
      el.id = "aiftFeedToast";
      el.className = "aift-feed-toast";
      document.body.appendChild(el);
    }

    el.textContent = message;
    el.className = `aift-feed-toast show ${type}`;

    setTimeout(() => {
      el.className = "aift-feed-toast";
    }, 2600);
  }

  return {
    mount,
    loadMore,
    createPost,
    previewComposerMedia,
    updateCarouselDots,
    likePost,
    doubleLike,
    handleTapLike,
    openOriginalPost,
    openComments,
    showAllComments,
    showMoreComments,
    toggleReplies,
    submitComment,
    submitInlineComment,
    handleCommentKey,
    handleInlineCommentKey,
    handleInlineReplyKey,
    submitInlineReply,
    likeComment,
    likeReply,
    deleteComment,
    deleteReply,
    replyTo,
    cancelReply,
    openLikes,
    openShare,
    filterShareUsers,
    toggleShareUser,
    sendSelectedPost,
    copyPostLink,
    nativeShare,
    openRepost,
    submitRepost,
    openPostMenu,
    savePost,
    notInterested,
    reportPost,
    deletePost,
    toggleFollow,
    visitProfile,
    closeOverlays
  };
})();

window.AIFTFeed = AIFTFeed;
