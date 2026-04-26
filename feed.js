const AIFTFeed = (() => {
  const API = "https://backend-1-9b6f.onrender.com";
  const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const state = {
    rootId: "",
    posts: [],
    me: null,
    replyTarget: {},
    repostPostId: null
  };

  function token() {
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
      Authorization: "Bearer " + token(),
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

  function getRoot() {
    return document.getElementById(state.rootId);
  }

  async function mount(rootId) {
    state.rootId = rootId;

    if (!token()) {
      getRoot().innerHTML = `<div class="empty">Please log in to view the feed.</div>`;
      return;
    }

    renderShell();
    await loadFeed();
  }

  function renderShell() {
    getRoot().innerHTML = `
      <section class="feed-card composer">
        <textarea id="postText" placeholder="Share something with the AIFT community..."></textarea>

        <div class="composer-actions">
          <input id="postMedia" type="file" accept="image/*,video/*" />
          <button class="btn primary" onclick="AIFTFeed.createPost()">Post</button>
        </div>
      </section>

      <section id="feedList"></section>

      <div class="modal" id="likesModal">
        <div class="modal-box">
          <div class="modal-head">
            <b>Liked by</b>
            <button class="btn" onclick="AIFTFeed.closeModal('likesModal')">Close</button>
          </div>
          <div class="modal-body" id="likesModalBody"></div>
        </div>
      </div>

      <div class="modal" id="repostModal">
        <div class="modal-box">
          <div class="modal-head">
            <b>Repost</b>
            <button class="btn" onclick="AIFTFeed.closeModal('repostModal')">Close</button>
          </div>
          <div class="modal-body">
            <textarea class="repost-textarea" id="repostText" placeholder="Add your thoughts..."></textarea>
            <div style="margin-top:12px;text-align:right;">
              <button class="btn primary" onclick="AIFTFeed.submitRepost()">Repost</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  async function loadFeed() {
    const list = document.getElementById("feedList");
    list.innerHTML = `<div class="empty">Loading feed...</div>`;

    try {
      const posts = await api(`${API}/api/posts`, {
        headers: headers()
      });

      state.posts = Array.isArray(posts) ? posts : [];

      if (!state.posts.length) {
        list.innerHTML = `<div class="empty">No posts yet.</div>`;
        return;
      }

      list.innerHTML = state.posts.map(renderPost).join("");
    } catch (err) {
      console.error(err);
      list.innerHTML = `<div class="empty">${esc(err.message)}</div>`;
    }
  }

  function renderPost(post) {
    const author = post.author || {};
    const liked = (post.likes || []).some(u => String(u?._id || u) === localStorage.getItem("userId"));
    const commentsCount = (post.comments || []).reduce((sum, c) => sum + 1 + (c.replies?.length || 0), 0);

    return `
      <article class="feed-card" id="post-${post._id}">
        <header class="post-head">
          <img class="avatar" src="${esc(author.profileImage || DEFAULT_AVATAR)}" />
          <div class="post-user">
            <b>${esc(author.companyName || author.name || "AIFT User")}</b>
            <span>${esc(author.headline || author.role || "AIFT Member")}</span>
          </div>
        </header>

        <div class="post-text">${esc(post.text || "")}</div>

        ${
          post.mediaUrl
            ? `
              <div class="media-wrap" ondblclick="AIFTFeed.doubleLike('${post._id}')">
                ${
                  post.mediaType === "video"
                    ? `<video class="post-media" src="${esc(post.mediaUrl)}" controls></video>`
                    : `<img class="post-media" src="${esc(post.mediaUrl)}" />`
                }
                <div class="big-heart" id="heart-${post._id}">♥</div>
              </div>
            `
            : ""
        }

        <div class="post-tools">
          <button class="icon-btn ${liked ? "liked" : ""}" onclick="AIFTFeed.likePost('${post._id}')">♥</button>
          <button class="icon-btn" onclick="AIFTFeed.openComments('${post._id}')">💬</button>
          <button class="icon-btn" onclick="AIFTFeed.openRepost('${post._id}')">↻</button>
          <button class="icon-btn" onclick="AIFTFeed.sharePost('${post._id}')">↗</button>
        </div>

        <div class="post-meta">
          <div class="likes-link" onclick="AIFTFeed.showLikes('${post._id}')">
            ${(post.likes || []).length} likes
          </div>
          <div class="comments-link" onclick="AIFTFeed.openComments('${post._id}')">
            View ${commentsCount} comments
          </div>
        </div>

        <section class="comments-panel" id="comments-${post._id}">
          <div class="replying-banner" id="reply-banner-${post._id}">
            <span id="reply-text-${post._id}"></span>
            <button class="btn" onclick="AIFTFeed.cancelReply('${post._id}')">Cancel</button>
          </div>

          <div class="comment-form">
            <input id="comment-input-${post._id}" placeholder="Add a comment..." />
            <button class="btn primary" onclick="AIFTFeed.submitComment('${post._id}')">Post</button>
          </div>

          <div class="comment-list">
            ${(post.comments || []).map(comment => renderComment(post._id, comment)).join("") || `<div class="empty">No comments yet.</div>`}
          </div>
        </section>
      </article>
    `;
  }

  function renderComment(postId, comment) {
    const user = comment.user || {};
    const liked = (comment.likes || []).some(u => String(u?._id || u) === localStorage.getItem("userId"));

    return `
      <div class="comment-row" id="comment-${comment._id}">
        <img class="avatar" src="${esc(user.profileImage || DEFAULT_AVATAR)}" />

        <div class="comment-main">
          <div class="comment-bubble">
            <b>${esc(user.name || user.companyName || "User")}</b>
            <p>${esc(comment.text || "")}</p>
          </div>

          <div class="comment-actions">
            <button onclick="AIFTFeed.likeComment('${postId}', '${comment._id}')">
              ${liked ? "Liked" : "Like"}
            </button>
            <button onclick="AIFTFeed.replyTo('${postId}', '${comment._id}', '${esc(user.name || "User")}')">
              Reply
            </button>
            <span>${(comment.likes || []).length} likes</span>
          </div>

          ${(comment.replies || []).map(reply => renderReply(postId, comment._id, reply)).join("")}
        </div>
      </div>
    `;
  }

  function renderReply(postId, commentId, reply) {
    const user = reply.user || {};
    const liked = (reply.likes || []).some(u => String(u?._id || u) === localStorage.getItem("userId"));

    return `
      <div class="reply-row">
        <img class="avatar" src="${esc(user.profileImage || DEFAULT_AVATAR)}" />

        <div class="comment-main">
          <div class="comment-bubble">
            <b>${esc(user.name || user.companyName || "User")}</b>
            <p>${esc(reply.text || "")}</p>
          </div>

          <div class="comment-actions">
            <button onclick="AIFTFeed.likeReply('${postId}', '${commentId}', '${reply._id}')">
              ${liked ? "Liked" : "Like"}
            </button>
            <span>${(reply.likes || []).length} likes</span>
          </div>
        </div>
      </div>
    `;
  }

  async function createPost() {
    const text = document.getElementById("postText").value.trim();
    const media = document.getElementById("postMedia").files[0];

    if (!text) {
      alert("Please write something first.");
      return;
    }

    const form = new FormData();
    form.append("text", text);
    if (media) form.append("media", media);

    await api(`${API}/api/posts`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token()
      },
      body: form
    });

    document.getElementById("postText").value = "";
    document.getElementById("postMedia").value = "";

    await loadFeed();
  }

  async function likePost(postId) {
    await api(`${API}/api/posts/${postId}/like`, {
      method: "PATCH",
      headers: headers()
    });

    await loadFeed();
  }

  async function doubleLike(postId) {
    const heart = document.getElementById(`heart-${postId}`);

    if (heart) {
      heart.classList.add("show");
      setTimeout(() => heart.classList.remove("show"), 850);
    }

    await likePost(postId);
  }

  function openComments(postId) {
    const panel = document.getElementById(`comments-${postId}`);
    if (panel) panel.classList.toggle("open");
  }

  async function showLikes(postId) {
    const body = document.getElementById("likesModalBody");
    body.innerHTML = `<div class="empty">Loading likes...</div>`;
    openModal("likesModal");

    try {
      const people = await api(`${API}/api/posts/${postId}/likes`, {
        headers: headers()
      });

      body.innerHTML = people.length
        ? people.map(user => `
          <div class="person-row">
            <img src="${esc(user.profileImage || DEFAULT_AVATAR)}" />
            <div>
              <b>${esc(user.companyName || user.name || "User")}</b>
              <div style="font-size:12px;color:#6b7280;">${esc(user.headline || user.role || "")}</div>
            </div>
          </div>
        `).join("")
        : `<div class="empty">No likes yet.</div>`;
    } catch (err) {
      body.innerHTML = `<div class="empty">${esc(err.message)}</div>`;
    }
  }

  function replyTo(postId, commentId, name) {
    state.replyTarget[postId] = commentId;

    const banner = document.getElementById(`reply-banner-${postId}`);
    const text = document.getElementById(`reply-text-${postId}`);
    const input = document.getElementById(`comment-input-${postId}`);

    banner.classList.add("show");
    text.innerText = `Replying to ${name}`;
    input.focus();
  }

  function cancelReply(postId) {
    state.replyTarget[postId] = null;

    const banner = document.getElementById(`reply-banner-${postId}`);
    if (banner) banner.classList.remove("show");
  }

  async function submitComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const text = input.value.trim();

    if (!text) return;

    const replyCommentId = state.replyTarget[postId];

    if (replyCommentId) {
      await api(`${API}/api/posts/${postId}/comments/${replyCommentId}/reply`, {
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
    state.replyTarget[postId] = null;

    await loadFeed();

    setTimeout(() => {
      document.getElementById(`comments-${postId}`)?.classList.add("open");
    }, 50);
  }

  async function likeComment(postId, commentId) {
    await api(`${API}/api/posts/${postId}/comments/${commentId}/like`, {
      method: "PATCH",
      headers: headers()
    });

    await loadFeed();

    setTimeout(() => {
      document.getElementById(`comments-${postId}`)?.classList.add("open");
    }, 50);
  }

  async function likeReply(postId, commentId, replyId) {
    await api(`${API}/api/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
      method: "PATCH",
      headers: headers()
    });

    await loadFeed();

    setTimeout(() => {
      document.getElementById(`comments-${postId}`)?.classList.add("open");
    }, 50);
  }

  function openRepost(postId) {
    state.repostPostId = postId;
    document.getElementById("repostText").value = "";
    openModal("repostModal");
  }

  async function submitRepost() {
    const text = document.getElementById("repostText").value.trim();

    await api(`${API}/api/posts/${state.repostPostId}/repost`, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: JSON.stringify({ text })
    });

    closeModal("repostModal");
    await loadFeed();
  }

  async function sharePost(postId) {
    await api(`${API}/api/posts/${postId}/share`, {
      method: "POST",
      headers: headers()
    });

    const link = `${location.origin}/feed.html?post=${postId}`;

    try {
      await navigator.clipboard.writeText(link);
      alert("Post link copied.");
    } catch {
      alert(link);
    }

    await loadFeed();
  }

  function openModal(id) {
    document.getElementById(id)?.classList.add("open");
  }

  function closeModal(id) {
    document.getElementById(id)?.classList.remove("open");
  }

  return {
    mount,
    createPost,
    likePost,
    doubleLike,
    openComments,
    showLikes,
    submitComment,
    likeComment,
    likeReply,
    replyTo,
    cancelReply,
    openRepost,
    submitRepost,
    sharePost,
    closeModal
  };
})();
