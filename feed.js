const AIFTFeed = (() => {
  const API = "https://backend-1-9b6f.onrender.com";
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const state = {
    rootId: "",
    posts: [],
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
    hasMore: true
  };

  function getToken() {
    return (
      localStorage.getItem("talentToken") ||
      localStorage.getItem("employerToken") ||
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

  function isMine(userId) {
    return String(userId || "") === String(state.meId || localStorage.getItem("userId"));
  }

  function userName(user = {}) {
    return user.companyName || user.name || "AIFT User";
  }

  function userSub(user = {}) {
    return user.headline || user.role || "AIFT Member";
  }

  function isVerified(user = {}) {
    return Boolean(
      user.isVerified ||
      user.verified ||
      user.adminVerified ||
      user.badges?.verified
    );
  }

  function isFollowing(author = {}) {
    const myId = String(state.meId || localStorage.getItem("userId") || "");
    if (!author || !author._id || String(author._id) === myId) return true;

    if (typeof author.isFollowing === "boolean") return author.isFollowing;

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

  function root() {
    return document.getElementById(state.rootId);
  }
function moveSheetsToBody() {
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
  function svg(name) {
    const icons = {
      heart: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z"></path>
        </svg>`,
      comment: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"></path>
        </svg>`,
      repost: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17 1l4 4-4 4"></path>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
          <path d="M7 23l-4-4 4-4"></path>
          <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
        </svg>`,
      share: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22 2 11 13"></path>
          <path d="m22 2-7 20-4-9-9-4 20-7Z"></path>
        </svg>`,
      save: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 21 12 16 5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"></path>
        </svg>`,
      more: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="5" cy="12" r="1.8"></circle>
          <circle cx="12" cy="12" r="1.8"></circle>
          <circle cx="19" cy="12" r="1.8"></circle>
        </svg>`,
      close: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>`,
      check: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M20 6 9 17l-5-5"></path>
        </svg>`,
      copy: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>`,
      flag: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 22V4"></path>
          <path d="M4 4h13l-1 5 1 5H4"></path>
        </svg>`,
      info: `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 16v-4"></path>
          <path d="M12 8h.01"></path>
        </svg>`
    };

    return icons[name] || "";
  }

  function mount(rootId, options = {}) {
    state.rootId = rootId;
    state.limit = Number(options.limit || 20);
    state.skip = 0;
    state.hasMore = true;
    state.posts = [];
    state.meId = localStorage.getItem("userId");

    if (!root()) return;

    if (!getToken()) {
      root().innerHTML = `<div class="aift-feed-empty">Please log in to view the feed.</div>`;
      return;
    }

renderShell();
moveSheetsToBody();
connectSocket();
loadFeed({ reset: true });
  }

  function renderShell() {
    root().innerHTML = `
      <div class="aift-feed-shell">
        <section class="aift-composer">
          <div class="aift-composer-row">
            <textarea id="aiftPostText" placeholder="Share something with the AIFT community..."></textarea>
          </div>

          <div class="aift-composer-actions">
            <label class="aift-upload-btn">
              <input id="aiftPostMedia" type="file" accept="image/*,video/*" />
              Add media
            </label>
            <button class="aift-primary-btn" onclick="AIFTFeed.createPost()">Post</button>
          </div>
        </section>

        <section id="aiftFeedList" class="aift-feed-list"></section>

        <button id="aiftLoadMore" class="aift-load-more" onclick="AIFTFeed.loadMore()">Load more</button>
      </div>

      <div id="aiftSheetBackdrop" class="aift-sheet-backdrop" onclick="AIFTFeed.closeSheets()"></div>

      <section id="aiftCommentsSheet" class="aift-bottom-sheet" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <header class="aift-sheet-head">
          <strong>Comments</strong>
          <button class="aift-icon-btn" onclick="AIFTFeed.closeSheets()">${svg("close")}</button>
        </header>
        <div id="aiftCommentsBody" class="aift-sheet-body"></div>
        <footer class="aift-comment-footer">
          <div id="aiftReplyBanner" class="aift-reply-banner">
            <span id="aiftReplyText"></span>
            <button onclick="AIFTFeed.cancelReply()">Cancel</button>
          </div>
          <div class="aift-comment-input-row">
            <input id="aiftCommentInput" placeholder="Join the conversation..." />
            <button onclick="AIFTFeed.submitComment()">Post</button>
          </div>
        </footer>
      </section>

      <section id="aiftLikesSheet" class="aift-bottom-sheet" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <header class="aift-sheet-head">
          <strong>Liked by</strong>
          <button class="aift-icon-btn" onclick="AIFTFeed.closeSheets()">${svg("close")}</button>
        </header>
        <div id="aiftLikesBody" class="aift-sheet-body"></div>
      </section>

      <section id="aiftShareSheet" class="aift-bottom-sheet compact" aria-hidden="true">
        <div class="aift-sheet-handle"></div>
        <header class="aift-sheet-head">
          <strong>Share</strong>
          <button class="aift-icon-btn" onclick="AIFTFeed.closeSheets()">${svg("close")}</button>
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
          <button class="aift-icon-btn" onclick="AIFTFeed.closeSheets()">${svg("close")}</button>
        </header>
        <div class="aift-sheet-body">
          <textarea id="aiftRepostText" class="aift-repost-textarea" placeholder="Add your thoughts..."></textarea>
          <button class="aift-primary-btn wide" onclick="AIFTFeed.submitRepost()">Repost</button>
        </div>
      </section>
    `;
  }

  async function loadFeed({ reset = false } = {}) {
    if (state.loading) return;

    const list = document.getElementById("aiftFeedList");
    const loadMore = document.getElementById("aiftLoadMore");

    state.loading = true;

    if (reset) {
      state.skip = 0;
      state.hasMore = true;
      list.innerHTML = `<div class="aift-feed-empty">Loading feed...</div>`;
    }

    try {
      const posts = await api(`${API}/api/posts?skip=${state.skip}&limit=${state.limit}`, {
        headers: headers()
      });

      const incoming = Array.isArray(posts) ? posts : [];

      if (reset) {
        state.posts = incoming;
      } else {
        state.posts = [...state.posts, ...incoming];
      }

      state.skip += incoming.length;
      state.hasMore = incoming.length === state.limit;

      if (!state.posts.length) {
        list.innerHTML = `<div class="aift-feed-empty">No posts yet.</div>`;
      } else {
        list.innerHTML = state.posts.map(renderPost).join("");
        observePosts();
      }

      if (loadMore) {
        loadMore.style.display = state.hasMore ? "block" : "none";
      }
    } catch (err) {
      console.error(err);
      list.innerHTML = `<div class="aift-feed-empty">${esc(err.message)}</div>`;
    } finally {
      state.loading = false;
    }
  }

  function loadMore() {
    if (state.hasMore) loadFeed();
  }

  function renderPost(post) {
    const author = post.author || {};
    const liked = (post.likes || []).some(u => String(u?._id || u) === String(state.meId));
    const commentsCount = countComments(post);
    const followed = isFollowing(author);
    const verified = isVerified(author);

    return `
      <article class="aift-post-card" id="aift-post-${safeId(post._id)}" data-post-id="${esc(post._id)}">
        <header class="aift-post-header">
          <div class="aift-author" onclick="AIFTFeed.visitProfile('${esc(author._id)}')">
            <img class="aift-avatar" src="${esc(author.profileImage || DEFAULT_AVATAR)}" alt="" />
            <div class="aift-author-text">
              <div class="aift-author-name">
                <strong>${esc(userName(author))}</strong>
                ${verified ? `<span class="aift-verified" title="Verified by AIFT admin">${svg("check")}</span>` : ""}
              </div>
              <span>${esc(userSub(author))}</span>
            </div>
          </div>

          <div class="aift-header-actions">
            ${
              !followed
                ? `<button class="aift-follow-btn" onclick="AIFTFeed.toggleFollow('${esc(author._id)}')">Follow</button>`
                : ""
            }
            <button class="aift-icon-btn" onclick="AIFTFeed.openPostMenu('${esc(post._id)}')">${svg("more")}</button>
          </div>
        </header>

        ${post.text ? `<div class="aift-post-text">${esc(post.text)}</div>` : ""}

        ${
          post.mediaUrl
            ? `
              <div class="aift-media-wrap" ondblclick="AIFTFeed.doubleLike('${esc(post._id)}')" ontouchend="AIFTFeed.handleTapLike(event, '${esc(post._id)}')">
                ${
                  post.mediaType === "video"
                    ? `<video class="aift-post-media" src="${esc(post.mediaUrl)}" controls playsinline preload="metadata"></video>`
                    : `<img class="aift-post-media" src="${esc(post.mediaUrl)}" alt="Post media" loading="lazy" />`
                }
                <div class="aift-heart-overlay" id="aift-heart-${safeId(post._id)}">${svg("heart")}</div>
              </div>
            `
            : ""
        }

        <section class="aift-post-actions">
          <div class="aift-left-actions">
            <button class="aift-action-btn ${liked ? "is-liked" : ""}" onclick="AIFTFeed.likePost('${esc(post._id)}')" aria-label="Like">
              ${svg("heart")}
            </button>
            <button class="aift-action-btn" onclick="AIFTFeed.openComments('${esc(post._id)}')" aria-label="Comment">
              ${svg("comment")}
            </button>
            <button class="aift-action-btn" onclick="AIFTFeed.openRepost('${esc(post._id)}')" aria-label="Repost">
              ${svg("repost")}
            </button>
            <button class="aift-action-btn" onclick="AIFTFeed.openShare('${esc(post._id)}')" aria-label="Share">
              ${svg("share")}
            </button>
          </div>

          <button class="aift-action-btn" onclick="AIFTFeed.savePost('${esc(post._id)}')" aria-label="Save">
            ${svg("save")}
          </button>
        </section>

        <section class="aift-post-stats">
          <button onclick="AIFTFeed.openLikes('${esc(post._id)}')">
            <strong id="aift-likes-count-${safeId(post._id)}">${(post.likes || []).length}</strong> likes
          </button>
          <button onclick="AIFTFeed.openComments('${esc(post._id)}')">
            View <strong id="aift-comments-count-${safeId(post._id)}">${commentsCount}</strong> comments
          </button>
          ${
            post.sharesCount
              ? `<span><strong id="aift-shares-count-${safeId(post._id)}">${post.sharesCount}</strong> shares</span>`
              : `<span id="aift-shares-count-${safeId(post._id)}" style="display:none;">0</span>`
          }
        </section>
      </article>
    `;
  }

  function countComments(post) {
    return (post.comments || []).reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);
  }

  async function createPost() {
    const textEl = document.getElementById("aiftPostText");
    const mediaEl = document.getElementById("aiftPostMedia");

    const text = textEl.value.trim();
    const media = mediaEl.files[0];

    if (!text && !media) {
      alert("Please write something or add media first.");
      return;
    }

    const form = new FormData();
    form.append("text", text || " ");
    if (media) form.append("media", media);

    try {
      const post = await api(`${API}/api/posts`, {
        method: "POST",
        headers: { Authorization: "Bearer " + getToken() },
        body: form
      });

      textEl.value = "";
      mediaEl.value = "";

      upsertPost(post, { prepend: true });
    } catch (err) {
      alert(err.message);
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
      if (!silent) alert(err.message);
    }
  }

  function optimisticPostLike(postId, liked) {
    const post = getPost(postId);
    if (!post) return;

    const me = state.meId || localStorage.getItem("userId");
    post.likes = post.likes || [];

    const has = post.likes.some(u => String(u?._id || u) === String(me));

    if (liked && !has) post.likes.push(me);
    if (!liked && has) post.likes = post.likes.filter(u => String(u?._id || u) !== String(me));

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

  let lastTap = 0;

  function handleTapLike(event, postId) {
    const now = Date.now();
    if (now - lastTap < 320) {
      event.preventDefault();
      doubleLike(postId);
    }
    lastTap = now;
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

    document.getElementById("aiftCommentsBody").innerHTML = renderComments(post);
    document.getElementById("aiftCommentInput").value = "";
    hideReplyBanner();

    openSheet("aiftCommentsSheet");
  }

  function renderComments(post) {
    const comments = post.comments || [];

    if (!comments.length) {
      return `<div class="aift-feed-empty">No comments yet. Start the conversation.</div>`;
    }

    return comments.map(comment => renderComment(post._id, comment)).join("");
  }

  function renderComment(postId, comment) {
    const user = comment.user || {};
    const liked = (comment.likes || []).some(u => String(u?._id || u) === String(state.meId));
    const replies = comment.replies || [];

    return `
      <div class="aift-comment" id="aift-comment-${safeId(comment._id)}">
        <img class="aift-avatar small" src="${esc(user.profileImage || DEFAULT_AVATAR)}" alt="" />

        <div class="aift-comment-main">
          <div class="aift-comment-bubble">
            <strong>${esc(userName(user))}</strong>
            <p>${esc(comment.text)}</p>
          </div>

          <div class="aift-comment-actions">
            <button class="${liked ? "active" : ""}" onclick="AIFTFeed.likeComment('${esc(postId)}','${esc(comment._id)}')">Like</button>
            <button onclick="AIFTFeed.replyTo('${esc(postId)}','${esc(comment._id)}','${esc(userName(user))}')">Reply</button>
            <span>${(comment.likes || []).length} likes</span>
          </div>

          ${
            replies.length
              ? `<div class="aift-replies">${replies.map(reply => renderReply(postId, comment._id, reply, user)).join("")}</div>`
              : ""
          }
        </div>
      </div>
    `;
  }

  function renderReply(postId, commentId, reply, parentUser = {}) {
    const user = reply.user || {};
    const liked = (reply.likes || []).some(u => String(u?._id || u) === String(state.meId));

    return `
      <div class="aift-reply" id="aift-reply-${safeId(reply._id)}">
        <span class="aift-reply-line"></span>
        <img class="aift-avatar tiny" src="${esc(user.profileImage || DEFAULT_AVATAR)}" alt="" />

        <div class="aift-comment-main">
          <div class="aift-comment-bubble reply">
            <strong>${esc(userName(user))}</strong>
            <p><span class="aift-reply-to">@${esc(userName(parentUser))}</span> ${esc(reply.text)}</p>
          </div>

          <div class="aift-comment-actions">
            <button class="${liked ? "active" : ""}" onclick="AIFTFeed.likeReply('${esc(postId)}','${esc(commentId)}','${esc(reply._id)}')">Like</button>
            <span>${(reply.likes || []).length} likes</span>
          </div>
        </div>
      </div>
    `;
  }

  async function submitComment() {
    const input = document.getElementById("aiftCommentInput");
    const text = input.value.trim();
    const postId = state.activePostId;

    if (!text || !postId) return;

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
      openComments(postId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function likeComment(postId, commentId) {
    try {
      await api(`${API}/api/posts/${postId}/comments/${commentId}/like`, {
        method: "PATCH",
        headers: headers()
      });

      await refreshOnePost(postId);
      openComments(postId);
    } catch (err) {
      alert(err.message);
    }
  }

  async function likeReply(postId, commentId, replyId) {
    try {
      await api(`${API}/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
        method: "PATCH",
        headers: headers()
      });

      await refreshOnePost(postId);
      openComments(postId);
    } catch (err) {
      alert(err.message);
    }
  }

  function replyTo(postId, commentId, name) {
    state.activePostId = postId;
    state.replyTarget = { commentId, name };

    const banner = document.getElementById("aiftReplyBanner");
    const text = document.getElementById("aiftReplyText");
    const input = document.getElementById("aiftCommentInput");

    if (banner && text) {
      text.textContent = `Replying to ${name}`;
      banner.classList.add("show");
    }

    input?.focus();
  }

  function cancelReply() {
    state.replyTarget = null;
    hideReplyBanner();
  }

  function hideReplyBanner() {
    document.getElementById("aiftReplyBanner")?.classList.remove("show");
  }

  async function openLikes(postId) {
    const body = document.getElementById("aiftLikesBody");
    body.innerHTML = `<div class="aift-feed-empty">Loading likes...</div>`;
    openSheet("aiftLikesSheet");

    try {
      const people = await api(`${API}/api/posts/${postId}/likes`, {
        headers: headers()
      });

      body.innerHTML = people.length
        ? people.map(renderPersonRow).join("")
        : `<div class="aift-feed-empty">No likes yet.</div>`;
    } catch (err) {
      body.innerHTML = `<div class="aift-feed-empty">${esc(err.message)}</div>`;
    }
  }

  function renderPersonRow(user) {
    return `
      <div class="aift-person-row" onclick="AIFTFeed.visitProfile('${esc(user._id)}')">
        <img src="${esc(user.profileImage || DEFAULT_AVATAR)}" alt="" />
        <div>
          <strong>${esc(userName(user))}</strong>
          <span>${esc(userSub(user))}</span>
        </div>
      </div>
    `;
  }

  function openShare(postId) {
    state.activePostId = postId;
    const link = getPostLink(postId);

    document.getElementById("aiftShareBody").innerHTML = `
      <button class="aift-sheet-option" onclick="AIFTFeed.copyPostLink('${esc(postId)}')">
        ${svg("copy")}
        <span>Copy link</span>
      </button>

      <button class="aift-sheet-option" onclick="AIFTFeed.openRepost('${esc(postId)}')">
        ${svg("repost")}
        <span>Repost to AIFT</span>
      </button>

      <button class="aift-sheet-option" onclick="AIFTFeed.nativeShare('${esc(postId)}')">
        ${svg("share")}
        <span>Send / Native share</span>
      </button>

      <div class="aift-copy-link">${esc(link)}</div>
    `;

    openSheet("aiftShareSheet");
  }

  async function copyPostLink(postId) {
    await trackShare(postId);

    const link = getPostLink(postId);

    try {
      await navigator.clipboard.writeText(link);
      alert("Post link copied.");
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

      const count = document.getElementById(`aift-shares-count-${safeId(postId)}`);
      if (count) {
        count.textContent = String(data.sharesCount || 0);
        count.style.display = "inline";
      }
    } catch (err) {
      console.warn("Share tracking failed:", err.message);
    }
  }

  function getPostLink(postId) {
    return `${location.origin}${location.pathname}?post=${encodeURIComponent(postId)}`;
  }

  function openRepost(postId) {
    state.repostPostId = postId;
    const textarea = document.getElementById("aiftRepostText");
    if (textarea) textarea.value = "";
    openSheet("aiftRepostSheet");
  }

  async function submitRepost() {
    const text = document.getElementById("aiftRepostText").value.trim();

    try {
      const post = await api(`${API}/api/posts/${state.repostPostId}/repost`, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text })
      });

      closeSheets();
      upsertPost(post, { prepend: true });
    } catch (err) {
      alert(err.message);
    }
  }

  function openPostMenu(postId) {
    state.activeMenuPostId = postId;
    const post = getPost(postId);
    const author = post?.author || {};

    document.getElementById("aiftMenuBody").innerHTML = `
      <button class="aift-sheet-option" onclick="AIFTFeed.savePost('${esc(postId)}')">
        ${svg("save")}
        <span>Save post</span>
      </button>

      <button class="aift-sheet-option" onclick="AIFTFeed.notInterested('${esc(postId)}')">
        ${svg("close")}
        <span>Not interested</span>
      </button>

      <button class="aift-sheet-option" onclick="AIFTFeed.visitProfile('${esc(author._id)}')">
        ${svg("info")}
        <span>About this account</span>
      </button>

      <button class="aift-sheet-option danger" onclick="AIFTFeed.reportPost('${esc(postId)}')">
        ${svg("flag")}
        <span>Report</span>
      </button>
    `;

    openSheet("aiftMenuSheet");
  }

  function savePost(postId) {
    const saved = JSON.parse(localStorage.getItem("aiftSavedPosts") || "[]");
    if (!saved.includes(postId)) saved.push(postId);
    localStorage.setItem("aiftSavedPosts", JSON.stringify(saved));
    alert("Post saved.");
  }

  function notInterested(postId) {
    const hidden = JSON.parse(localStorage.getItem("aiftHiddenPosts") || "[]");
    if (!hidden.includes(postId)) hidden.push(postId);
    localStorage.setItem("aiftHiddenPosts", JSON.stringify(hidden));

    state.posts = state.posts.filter(p => String(p._id) !== String(postId));
    document.getElementById(`aift-post-${safeId(postId)}`)?.remove();
    closeSheets();
  }

  function reportPost(postId) {
    alert("Report saved locally. Backend report endpoint is needed for production moderation.");
    console.warn("Missing backend endpoint recommended: POST /api/posts/:id/report", { postId });
  }

  async function toggleFollow(userId) {
    if (!userId || isMine(userId)) return;

    try {
      const data = await api(`${API}/api/posts/users/${userId}/follow`, {
        method: "PATCH",
        headers: headers()
      });

      const following = JSON.parse(localStorage.getItem("followingIds") || "[]");
      const next = data.following
        ? Array.from(new Set([...following, userId]))
        : following.filter(id => String(id) !== String(userId));

      localStorage.setItem("followingIds", JSON.stringify(next));

      state.posts.forEach(post => {
        if (String(post.author?._id) === String(userId)) {
          post.author.isFollowing = data.following;
        }
      });

      renderFeedOnly();
    } catch (err) {
      alert(err.message);
    }
  }

  function visitProfile(userId) {
    if (!userId) return;
    window.location.href = `public-profile.html?id=${encodeURIComponent(userId)}`;
  }

async function refreshOnePost(postId) {
  try {
    const post = await api(`${API}/api/posts/${postId}`, {
      headers: headers()
    });

    upsertPost(post);
  } catch (err) {
    console.warn("Single post refresh failed:", err.message);
    await loadFeed({ reset: true });
  }
}

  function getPost(postId) {
    return state.posts.find(p => String(p._id) === String(postId));
  }

  function upsertPost(post, { prepend = false } = {}) {
    if (!post?._id) return;

    const index = state.posts.findIndex(p => String(p._id) === String(post._id));

    if (index >= 0) {
      state.posts[index] = post;
    } else if (prepend) {
      state.posts.unshift(post);
    } else {
      state.posts.push(post);
    }

    renderFeedOnly();
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

function openSheet(id) {
  moveSheetsToBody();
  closeSheets(false);

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

function closeSheets(clear = true) {
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
    try {
      await api(`${API}/api/posts/${postId}/view`, {
        method: "PATCH",
        headers: headers()
      });
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

      state.socket.on("post_like", payload => {
        const post = getPost(payload.postId);
        if (!post) return;
        if (Array.isArray(payload.likes)) post.likes = payload.likes;
        updatePostActions(payload.postId);
      });

      state.socket.on("new_comment", payload => {
        refreshSocketPost(payload.postId);
      });

      state.socket.on("new_reply", payload => {
        refreshSocketPost(payload.postId);
      });

      state.socket.on("comment_like", payload => {
        refreshSocketPost(payload.postId);
      });

      state.socket.on("post_shared", payload => {
        const post = getPost(payload.postId);
        if (post) post.sharesCount = payload.sharesCount;

        const count = document.getElementById(`aift-shares-count-${safeId(payload.postId)}`);
        if (count) {
          count.textContent = String(payload.sharesCount || 0);
          count.style.display = "inline";
        }
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

    if (state.activePostId && String(state.activePostId) === String(postId)) {
      const post = getPost(postId);
      if (post) document.getElementById("aiftCommentsBody").innerHTML = renderComments(post);
    }
  }

  return {
    mount,
    loadMore,
    createPost,
    likePost,
    doubleLike,
    handleTapLike,
    openComments,
    submitComment,
    likeComment,
    likeReply,
    replyTo,
    cancelReply,
    openLikes,
    openShare,
    copyPostLink,
    nativeShare,
    openRepost,
    submitRepost,
    openPostMenu,
    savePost,
    notInterested,
    reportPost,
    toggleFollow,
    visitProfile,
    closeSheets
  };
})();

