(() => {
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  if(page !== "employer.html") return;

  let mobileDashboardReady = false;
  const markMobileDashboardReady = () => {
    if(mobileDashboardReady) return;
    mobileDashboardReady = true;
    document.body.classList.remove("mobile-menu-open");
    document.documentElement.classList.add("aift-employer-mobile-ready");
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.add("aift-employer-mobile-interactive");
      });
    });
  };

  let stylesheet = document.querySelector('link[data-employer-mobile-dashboard]');
  if(!stylesheet){
    stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "employer-dashboard-mobile.css?v=20260907-mobile-dashboard-9";
    stylesheet.dataset.employerMobileDashboard = "true";
    stylesheet.addEventListener("load",markMobileDashboardReady,{once:true});
    stylesheet.addEventListener("error",markMobileDashboardReady,{once:true});
    document.head.appendChild(stylesheet);
  }else if(stylesheet.sheet){
    markMobileDashboardReady();
  }else{
    stylesheet.addEventListener("load",markMobileDashboardReady,{once:true});
    stylesheet.addEventListener("error",markMobileDashboardReady,{once:true});
  }

  const syncDashboardChrome = () => {
    if(window.innerWidth <= 760 && window.top !== window){
      window.top.postMessage({type:"aift:dashboard-chrome",hidden:true},location.origin);
    }
  };
  syncDashboardChrome();

  document.addEventListener("DOMContentLoaded", () => {
    syncDashboardChrome();
    const menuButton = document.getElementById("mobileMenuBtn");
    const menuScroller = document.querySelector(".employer-sidebar-main");
    menuButton?.addEventListener("click", () => {
      if(!document.body.classList.contains("mobile-menu-open")){
        menuScroller?.scrollTo({top:0,behavior:"auto"});
      }
    }, {capture:true});
  }, {once:true});
})();

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
    viewedPosts: new Set(),
globalVideoMuted: true,
videoObserver: null,
reelObserver: null,
reelActivePostId: null,
reelScrollY: 0,
reelPanelPostId: null,
reelSkip: 0,
reelHasMore: true,
reelLoading: false,
reelPlaybackActive: false,
feedSeed: sessionStorage.getItem("aiftFeedSeed") || "",
feedHiddenAt: 0,
feedRefreshReady: false,
pullStartY: null,
pullDistance: 0,
pullRefreshing: false,
guestMode: false
  };

  if (!state.feedSeed) {
    state.feedSeed = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
    sessionStorage.setItem("aiftFeedSeed", state.feedSeed);
  }

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
  const token = getToken();

  return {
    ...(token ? { Authorization: "Bearer " + token } : {}),
    ...extra
  };
}

function isGuestMode(){
  return state.guestMode || !getToken();
}

function requireMember(action = "use this feature"){
  if(!isGuestMode()) return true;

  if(typeof window.requireLogin === "function"){
    window.requireLogin(action);
  }else{
    alert("Please sign in to " + action + ".");
  }

  return false;
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
  function formatCount(value = 0){
  const n = Number(value || 0);

  if(n >= 1000000000){
    return (n / 1000000000).toFixed(n >= 10000000000 ? 0 : 1).replace(".0","") + "B";
  }

  if(n >= 1000000){
    return (n / 1000000).toFixed(n >= 10000000 ? 0 : 1).replace(".0","") + "M";
  }

  if(n >= 1000){
    return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0","") + "K";
  }

  return String(n);
}
  function getHiddenComments(){
  return JSON.parse(localStorage.getItem("aiftHiddenComments") || "[]");
}

function saveHiddenComment(commentId){
  const hidden = getHiddenComments();

  if(!hidden.includes(String(commentId))){
    hidden.push(String(commentId));
  }

  localStorage.setItem("aiftHiddenComments", JSON.stringify(hidden));
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

  function isFollowRequested(author = {}) {
    const myId = String(state.meId || localStorage.getItem("userId") || "");
    if (!author || !author._id || String(author._id) === myId) return false;

    if (typeof author.followRequested === "boolean") return author.followRequested;

    return (state.me?.followRequestsSent || []).some(
      id => String(id?._id || id) === String(author._id)
    );
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
      eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>`,
      volume: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18 6a8.5 8.5 0 0 1 0 12"></path></svg>`,
      volumeOff: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"></path><path d="m16 9 5 5"></path><path d="m21 9-5 5"></path></svg>`,
      more: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.8"></circle><circle cx="12" cy="12" r="1.8"></circle><circle cx="19" cy="12" r="1.8"></circle></svg>`,
      close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`,
      check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>`,
      copy: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
      flag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 22V4"></path><path d="M4 4h13l-1 5 1 5H4"></path></svg>`,
      info: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>`,
      userMinus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8" cy="7" r="4"></circle><path d="M23 11h-6"></path></svg>`,
      send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"></path><path d="M22 2 15 22 11 13 2 9 22 2Z"></path></svg>`,
      search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.35-4.35"></path></svg>`,
      trash: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18"></path><path d="M8 6V4h8v2"></path><path d="M19 6l-1 14H6L5 6"></path></svg>`,
      plus: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>`,
      edit: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"></path></svg>`
    };

    return icons[name] || "";
  }

  async function mount(rootId, options = {}) {
    if("scrollRestoration" in history){
  history.scrollRestoration = "manual";
}
    state.rootId = rootId;
    state.mode = options.mode || "home";
    if(state.mode === "home"){
      state.feedSeed = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
      sessionStorage.setItem("aiftFeedSeed", state.feedSeed);
    }
    state.authorId = options.authorId || null;
state.groupId = options.groupId || null;
state.guestMode = options.guestMode === true || !getToken();
state.showComposer = state.guestMode ? false : options.showComposer !== false;
state.infiniteScroll = options.infiniteScroll !== false;
state.realtime = state.guestMode ? false : options.realtime !== false;
    state.limit = Number(options.limit || 20);
state.sort = options.sort || "recent";
    state.skip = 0;
    state.hasMore = true;
    state.posts = [];
    state.meId = localStorage.getItem("userId");
    state.isMobile = window.innerWidth <= 768;

    if (!root()) return;

    syncFeedHost(true, false);

if (!getToken() && !state.guestMode) {
  root().innerHTML = `<div class="aift-feed-empty">Please log in to view the feed.</div>`;
  return;
}

if(state.guestMode){
  state.me = {
    _id: "guest",
    name: "Guest",
    role: "guest",
    profileImage: DEFAULT_AVATAR,
    following: []
  };
  state.meId = "guest";
}else{
  await loadMe();
}

renderShell();
moveOverlaysToBody();

    const singlePostId = new URLSearchParams(location.search).get("post");
    if (singlePostId) {
      await loadSinglePost(singlePostId);
    } else {
if(!state.guestMode){
  connectSocket();
}

await loadFeed({ reset: true });
    }

    setupFeedRefresh();

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

          <div id="aiftComposerProgress" class="aift-composer-progress" hidden>
            <div class="aift-composer-progress-track">
              <div id="aiftComposerProgressBar" class="aift-composer-progress-bar"></div>
            </div>
            <span id="aiftComposerProgressText">Preparing upload...</span>
          </div>

          <div id="aiftComposerPreview" class="aift-composer-preview"></div>
        </section>

        ${renderFamilyFeedCard()}
        <section id="aiftFeedList" class="aift-feed-list"></section>
<div id="aiftInfiniteSentinel" class="aift-infinite-sentinel"></div>
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
function syncFeedHost(active = true, reelsOpen = false){
  const shouldActivate = Boolean(active);
  const shouldHideNavigation = shouldActivate && Boolean(reelsOpen);

  document.documentElement.classList.toggle("aift-feed-scrollbarless", shouldActivate);
  document.body?.classList.toggle("aift-feed-scrollbarless", shouldActivate);

  if(window.top !== window){
    window.top.postMessage({
      type:"aift:dashboard-chrome",
      hidden:shouldHideNavigation
    }, location.origin);

    try{
      const hostDocument = window.top.document;
      let style = hostDocument.getElementById("aiftFeedHostStyle");

      if(!style){
        style = hostDocument.createElement("style");
        style.id = "aiftFeedHostStyle";
        style.textContent = `
          html.aift-feed-host,
          body.aift-feed-host{
            scrollbar-width:none!important;
            -ms-overflow-style:none!important;
          }
          html.aift-feed-host::-webkit-scrollbar,
          body.aift-feed-host::-webkit-scrollbar{
            width:0!important;
            height:0!important;
            display:none!important;
          }
          body.aift-feed-reels-open .aift-mobile-nav,
          body.aift-feed-reels-open .mobile-nav,
          body.aift-feed-reels-open .mobile-bottom-nav,
          body.aift-feed-reels-open .bottom-nav,
          body.aift-feed-reels-open [class*="mobile-nav"],
          body.aift-feed-reels-open [class*="bottom-nav"]{
            display:none!important;
            visibility:hidden!important;
            opacity:0!important;
            pointer-events:none!important;
          }
          body.aift-feed-reels-open{
            padding-bottom:0!important;
          }
        `;
        hostDocument.head.appendChild(style);
      }

      hostDocument.documentElement.classList.toggle("aift-feed-host", shouldActivate);
      hostDocument.body?.classList.toggle("aift-feed-host", shouldActivate);
      hostDocument.body?.classList.toggle("aift-feed-reels-open", shouldHideNavigation);
    }catch(error){
      console.warn("Feed host chrome sync unavailable:", error?.message || error);
    }
  }
}

window.addEventListener("pagehide", () => syncFeedHost(false, false));

function renderFamilyFeedCard(){
  const role = String(state.me?.role || localStorage.getItem("role") || "").toLowerCase();
  const eligibleRoles = new Set(["employer", "talent", "agent", "family"]);

  if(
    state.mode !== "home" ||
    state.guestMode ||
    !eligibleRoles.has(role) ||
    state.me?.familyProfile?.onboardingCompleted === true ||
    sessionStorage.getItem("aiftFamilyFeedCardDismissed") === "1"
  ){
    return "";
  }

  return `
    <aside id="aiftFamilyFeedCard" class="aift-family-feed-card" aria-label="AIFT Family">
      <button class="aift-family-feed-close" type="button" aria-label="Hide AIFT Family" onclick="AIFTFeed.dismissFamilyCard(event)">×</button>
      <div class="aift-family-feed-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <circle cx="12" cy="11" r="4"></circle>
          <circle cx="22" cy="13" r="3.5"></circle>
          <path d="M4.5 25c.7-5 3.2-7.4 7.5-7.4s6.8 2.4 7.5 7.4"></path>
          <path d="M18 19c1.2-1.2 2.7-1.8 4.5-1.8 3.2 0 5.1 1.9 5.7 5.8"></path>
        </svg>
        <i></i>
      </div>
      <div class="aift-family-feed-copy">
        <span class="aift-family-feed-kicker">FOR YOU · AIFT FAMILY</span>
        <strong>Support their next opportunity</strong>
        <p>Connect students, education support and family opportunities.</p>
        <button type="button" onclick="AIFTFeed.openFamily(event)">Explore</button>
      </div>
    </aside>
  `;
}

function openFamily(event){
  event?.stopPropagation();
  location.href = "family.html";
}

function dismissFamilyCard(event){
  event?.stopPropagation();
  sessionStorage.setItem("aiftFamilyFeedCardDismissed", "1");
  document.getElementById("aiftFamilyFeedCard")?.remove();
}

function stopFeedPlaybackForReels(){
  if(state.videoObserver){
    state.videoObserver.disconnect();
  }

  document.querySelectorAll("video, audio").forEach(media => {
    if(media.closest("#aiftReelViewer")) return;
    try{ media.pause(); }catch{}
    media.muted = true;
  });
}

async function refreshPersonalizedFeed(){
  if(state.mode !== "home" || state.loading || state.pullRefreshing) return;

  state.pullRefreshing = true;
  state.feedSeed = String(Date.now()) + "-" + Math.random().toString(36).slice(2);
  sessionStorage.setItem("aiftFeedSeed", state.feedSeed);

  try{
    await loadFeed({ reset: true });
  }finally{
    state.pullRefreshing = false;
    state.pullDistance = 0;
  }
}
function setupFeedRefresh(){
  if(state.feedRefreshReady) return;
  state.feedRefreshReady = true;

  document.addEventListener("visibilitychange", () => {
    if(document.hidden){
      state.feedHiddenAt = Date.now();
      document.querySelectorAll(".aift-feed-video").forEach(video => video.pause());
      return;
    }

    if(state.feedHiddenAt && Date.now() - state.feedHiddenAt > 1000){
      refreshPersonalizedFeed();
    }
  });

  window.addEventListener("pageshow", event => {
    if(event.persisted) refreshPersonalizedFeed();
  });

  document.addEventListener("touchstart", event => {
    if(
      state.mode !== "home" ||
      document.body.classList.contains("aift-reel-open") ||
      document.body.classList.contains("aift-sheet-open") ||
      event.target.closest("input, textarea, button, select, video")
    ) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    state.pullStartY = scrollTop <= 2 ? event.touches[0]?.clientY ?? null : null;
    state.pullDistance = 0;
  }, { passive: true });

  document.addEventListener("touchmove", event => {
    if(state.pullStartY === null || state.pullRefreshing) return;
    const distance = (event.touches[0]?.clientY ?? state.pullStartY) - state.pullStartY;
    state.pullDistance = Math.max(0, Math.min(distance * 0.48, 96));
    if(state.pullDistance >= 8 && event.cancelable) event.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", () => {
    if(state.pullStartY === null) return;
    const shouldRefresh = state.pullDistance >= 64;
    state.pullStartY = null;
    state.pullDistance = 0;
    if(shouldRefresh) refreshPersonalizedFeed();
  }, { passive: true });
}
function updateSoundBadges(){
  document.querySelectorAll(".aift-video-sound").forEach(btn => {
    const muted = state.globalVideoMuted;
    btn.innerHTML = muted ? svg("volumeOff") : svg("volume");
    btn.classList.toggle("is-on", !muted);
    btn.setAttribute("aria-label", muted ? "Unmute video" : "Mute video");
    btn.setAttribute("title", muted ? "Unmute video" : "Mute video");
  });

  document.querySelectorAll(".aift-reel-sound").forEach(btn => {
    btn.textContent = state.globalVideoMuted ? "Muted" : "Sound on";
    btn.classList.toggle("is-on", !state.globalVideoMuted);
  });
}

function setAllVideoMuted(muted, sourceBtn = null){
  state.globalVideoMuted = muted;

  document.querySelectorAll(".aift-feed-video, .aift-reel-video").forEach(video => {
    video.muted = muted;
  });

  updateSoundBadges();

  document.querySelectorAll(".aift-reel-sound-pop").forEach(pop => {
    pop.textContent = muted ? "Muted" : "Sound on";
    pop.classList.remove("show", "is-paused");
  });

  const activeSlide =
    sourceBtn?.closest?.(".aift-reel-slide") ||
    document.querySelector(`.aift-reel-slide[data-post-id="${CSS.escape(String(state.reelActivePostId || ""))}"]`);

  const pop = activeSlide?.querySelector(".aift-reel-sound-pop");

  if(pop){
    pop.textContent = muted ? "Muted" : "Sound on";
    pop.classList.remove("show", "is-paused");
    void pop.offsetWidth;
    pop.classList.add("show");
  }
}

function observeFeedVideos(){
  const videos = document.querySelectorAll(".aift-feed-video");

  if(state.videoObserver){
    state.videoObserver.disconnect();
    state.videoObserver = null;
  }

  if(!("IntersectionObserver" in window)){
    videos.forEach(video => {
      try{ video.pause(); }catch{}
      video.muted = true;
    });
    updateSoundBadges();
    return;
  }

  state.videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;

      if(state.reelPlaybackActive || document.body.classList.contains("aift-reel-open")){
        try{ video.pause(); }catch{}
        video.muted = true;
        return;
      }

      if(entry.isIntersecting && entry.intersectionRatio >= 0.6){
        document.querySelectorAll(".aift-feed-video").forEach(v => {
          if(v !== video) v.pause();
        });

        video.muted = state.globalVideoMuted;
        video.play().catch(() => {});
      }else{
        video.pause();
      }
    });
  }, {
    threshold:[0, .25, .6, .85]
  });

  videos.forEach(video => state.videoObserver.observe(video));
  updateSoundBadges();
}

function getVideoPosts(){
  return state.posts.filter(post =>
    getMediaItems(post).some(item => item.type === "video")
  );
}
  function lockReelPageScroll(){
  state.reelScrollY = window.scrollY || document.documentElement.scrollTop || 0;

  document.documentElement.classList.add("aift-reel-lock");
  document.body.classList.add("aift-reel-open");

  document.body.style.position = "fixed";
  document.body.style.top = `-${state.reelScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockReelPageScroll(){
  const topValue = document.body.style.top || "0";
  const savedY = Math.abs(parseInt(topValue, 10)) || state.reelScrollY || 0;

  document.documentElement.classList.remove("aift-reel-lock");
  document.body.classList.remove("aift-reel-open");

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, savedY);
}

async function loadReelBatch({ reset = false } = {}){
  if(state.guestMode || state.reelLoading || (!reset && !state.reelHasMore)) return false;

  state.reelLoading = true;

  if(reset){
    state.reelSkip = 0;
    state.reelHasMore = true;
  }

  try{
    const data = await api(
      `${API}/api/posts/feed?reels=1&skip=${state.reelSkip}&limit=20&seed=${encodeURIComponent(state.feedSeed)}`,
      { headers: headers() }
    );
    const incoming = Array.isArray(data?.posts) ? data.posts : [];
    state.posts = mergePosts([...state.posts, ...incoming]);
    state.reelSkip += incoming.length;
    state.reelHasMore = typeof data?.hasMore === "boolean" ? data.hasMore : incoming.length === 20;
    return incoming.length > 0;
  }catch(err){
    console.warn("Reel recommendations failed:", err.message);
    return false;
  }finally{
    state.reelLoading = false;
  }
}

async function openReelMode(postId, refreshRecommendations = true, resumeTime = null){
  state.reelPlaybackActive = true;
  syncFeedHost(true, true);
  stopFeedPlaybackForReels();

  if(refreshRecommendations && !state.guestMode){
    await loadReelBatch({ reset: true });
  }

  // Recommendation loading is asynchronous, so stop background media once more
  // before the Reel viewer is mounted. This prevents queued feed autoplay from
  // continuing underneath the Reel on mobile or desktop.
  stopFeedPlaybackForReels();

  const videos = getVideoPosts();

  if(!videos.length){
    state.reelPlaybackActive = false;
    syncFeedHost(true, false);
    return;
  }

  document.querySelectorAll(".aift-feed-video").forEach(v => {
    try{ v.pause(); }catch{}
    v.muted = true;
  });

  let modal = document.getElementById("aiftReelViewer");

  if(!modal){
    modal = document.createElement("div");
    modal.id = "aiftReelViewer";
    modal.className = "aift-reel-viewer";
    document.body.appendChild(modal);
  }
modal.style.opacity = "0";
modal.style.visibility = "visible";
  modal.innerHTML = `
    <button class="aift-reel-close" onclick="AIFTFeed.closeReelMode()">×</button>

    <div class="aift-reel-track">
      ${videos.map(post => {
        const author = post.author || {};
        const video = getMediaItems(post).find(item => item.type === "video");
        const liked = (post.likes || []).some(u => String(u?._id || u) === String(state.meId));
        const commentsCount = countComments(post);
        const verified = isVerified(author);

        return `
          <section
            class="aift-reel-slide"
            data-post-id="${esc(post._id)}"
            onclick="AIFTFeed.handleReelScreenTap(event, '${esc(post._id)}')"
          >
            <video
              class="aift-reel-video"
              src="${esc(videoDeliveryUrl(video.url))}"
              poster="${esc(videoPosterUrl(video.url))}"
              data-original-src="${esc(video.url)}"
              ${state.globalVideoMuted ? "muted" : ""}
              playsinline
              loop
              preload="metadata"
            ></video>

            <div class="aift-reel-gradient"></div>

<div
  class="aift-reel-sound-pop"
  onclick="event.stopPropagation(); AIFTFeed.toggleReelSound(event)"
>
  ${state.globalVideoMuted ? "Muted" : "Sound on"}
</div>

<div class="aift-reel-play-indicator"></div>

<div
  class="aift-heart-overlay aift-reel-heart-overlay"
  id="aift-reel-heart-${safeId(post._id)}"
>
  ${svg("heart")}
</div>


            <div class="aift-reel-info">
<div class="aift-reel-author">

  <button
    type="button"
    class="aift-reel-author-main"
    onclick="event.stopPropagation(); AIFTFeed.visitProfile('${esc(author._id)}')"
    aria-label="Open ${esc(userName(author))} profile"
  >
    <img src="${esc(userAvatar(author))}" alt="">
    <span class="aift-reel-author-name">
      <strong>${esc(userName(author))}</strong>
      ${verified ? `<span class="aift-reel-verified" title="Verified">${svg("check")}</span>` : ""}
    </span>
  </button>

  ${
    String(author._id) !== String(state.meId)
      ? `
      <button
        type="button"
        class="aift-reel-follow-btn ${isFollowing(author) ? "is-following" : isFollowRequested(author) ? "is-requested" : ""}"
        data-follow-user="${esc(author._id)}"
        onclick="event.stopPropagation(); AIFTFeed.toggleFollow('${esc(author._id)}')"
      >
        ${isFollowing(author) ? "Following" : isFollowRequested(author) ? "Requested" : "Follow"}
      </button>
      `
      : ""
  }

</div>

<div class="aift-reel-caption-row">
  ${
    post.text?.trim()
      ? `
      <p
        class="aift-reel-caption"
        onclick="event.stopPropagation(); AIFTFeed.openReelComments('${esc(post._id)}')"
      >
        ${
          post.text.split(/\s+/).length > 37
            ? esc(post.text.split(/\s+/).slice(0,37).join(" ")) + "..."
            : esc(post.text)
        }
      </p>
      `
      : `<p></p>`
  }


              </div>
            </div>

            <div class="aift-reel-actions">
              <button
                class="${liked ? "is-liked" : ""}"
                id="aift-reel-like-${safeId(post._id)}"
                onclick="event.stopPropagation(); AIFTFeed.handleReelLike('${esc(post._id)}')"
              >
                ${svg("heart")}
                <span id="aift-reel-like-count-${safeId(post._id)}">${formatCount((post.likes || []).length)}</span>
              </button>

              <button onclick="event.stopPropagation(); AIFTFeed.openReelComments('${esc(post._id)}')">
                ${svg("comment")}
                <span id="aift-reel-comment-count-${safeId(post._id)}">${formatCount(commentsCount)}</span>
              </button>

              <button onclick="event.stopPropagation(); AIFTFeed.openReelShare('${esc(post._id)}')">
                ${svg("share")}
                <span>${formatCount(post.sharesCount || 0)}</span>
              </button>

              <div
                class="aift-reel-view-count"
                aria-label="${formatCount(post.viewsCount || 0)} views"
                title="Views"
              >
                ${svg("eye")}
                <span id="aift-reel-view-count-${safeId(post._id)}">${formatCount(post.viewsCount || 0)}</span>
              </div>

              <button
                id="aift-reel-save-${safeId(post._id)}"
                onclick="event.stopPropagation(); AIFTFeed.handleReelSave('${esc(post._id)}')"
              >
                ${svg("save")}
              </button>
              <button
  onclick="event.stopPropagation(); AIFTFeed.openReelMoreOptions('${esc(post._id)}')"
>
  ${svg("more")}
</button>
            </div>
          </section>
        `;
      }).join("")}
    </div>

    <div id="aiftReelPanelBackdrop" class="aift-reel-panel-backdrop" onclick="AIFTFeed.closeReelPanel()"></div>
    <section id="aiftReelPanel" class="aift-reel-panel"></section>
  `;

if(!document.body.classList.contains("aift-reel-open")){
  lockReelPageScroll();
}

modal.classList.add("show");

const targetId =
  postId ||
  sessionStorage.getItem("aiftLastReelPost");

const track = modal.querySelector(".aift-reel-track");
const target = modal.querySelector(`[data-post-id="${CSS.escape(String(targetId))}"]`);
const targetVideo = target?.querySelector(".aift-reel-video");
const requestedResumeTime =
  Number.isFinite(Number(resumeTime)) && Number(resumeTime) > 0
    ? Number(resumeTime)
    : null;

if(track && target){
  track.style.scrollBehavior = "auto";
  track.scrollTop = target.offsetTop;
  state.reelActivePostId = targetId;
}

if(targetVideo && requestedResumeTime !== null){
  const restoreTime = () => {
    const duration = Number.isFinite(targetVideo.duration) ? targetVideo.duration : 0;
    const safeTime = duration > 0
      ? Math.min(requestedResumeTime, Math.max(0, duration - 0.05))
      : requestedResumeTime;

    try{
      targetVideo.currentTime = safeTime;
    }catch{}
  };

  if(targetVideo.readyState >= 1){
    restoreTime();
  }else{
    targetVideo.addEventListener("loadedmetadata", restoreTime, { once:true });
  }
}

requestAnimationFrame(() => {
  if(track && target){
    track.scrollTop = target.offsetTop;
  }

  observeReelVideos();
  updateSoundBadges();

  modal.style.opacity = "1";
});
}

let reelUiTimer;
function showReelUi(){
  const viewer = document.getElementById("aiftReelViewer");
  clearTimeout(reelUiTimer);
  viewer?.classList.remove("aift-reel-ui-hidden");
  viewer?.querySelectorAll(".aift-reel-sound-pop").forEach(control => control.classList.add("show"));
  reelUiTimer = setTimeout(() => {
    const video = viewer?.querySelector(`.aift-reel-slide[data-post-id="${CSS.escape(String(state.reelActivePostId))}"] video`);
    if(video && !video.paused && !viewer.querySelector(".aift-reel-panel.show") && !viewer.contains(document.activeElement)){
      viewer.classList.add("aift-reel-ui-hidden");
    }
  }, 2200);
}

function handleReelScreenTap(event, postId){
  const clickedAction = event.target.closest(
    ".aift-reel-actions, .aift-reel-close, .aift-reel-author, .aift-reel-more, .aift-reel-sound-pop, .aift-reel-panel, .aift-reel-caption"
  );

  if(clickedAction) return;

  if(document.getElementById("aiftReelViewer")?.classList.contains("aift-reel-ui-hidden")){
    showReelUi();
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const slide = event.currentTarget;
  const video = slide.querySelector(".aift-reel-video");
  const playIcon = slide.querySelector(".aift-reel-play-indicator");
  const soundPop = slide.querySelector(".aift-reel-sound-pop");

  if(state.reelTapTimer){
    clearTimeout(state.reelTapTimer);
    state.reelTapTimer = null;

showReelHeart(postId);
handleReelLike(postId);
    return;
  }

  state.reelTapTimer = setTimeout(() => {
    state.reelTapTimer = null;

    if(!video) return;

    if(video.paused){
      video.play().catch(() => {});
      playIcon?.classList.remove("show");
      soundPop?.classList.remove("show", "is-paused");
      showReelUi();
    }else{
      video.pause();
      playIcon?.classList.add("show");
      soundPop?.classList.add("show", "is-paused");
    }
  }, 280);
}
  
function toggleReelSound(event){
  event?.stopPropagation();
  setAllVideoMuted(!state.globalVideoMuted, event?.currentTarget);
}
function toggleFeedVideoSound(event){
  event?.preventDefault();
  event?.stopPropagation();

  const video = event.currentTarget
    ?.closest(".aift-video-wrap")
    ?.querySelector(".aift-feed-video");

  if(!video) return;

  setAllVideoMuted(!video.muted, event.currentTarget);
}
function handleFeedVideoTap(event, postId){
  event?.preventDefault();
  event?.stopPropagation();

  if(event.target.closest(".aift-video-sound")){
    return;
  }

  const feedVideo =
    event.currentTarget?.querySelector?.(".aift-feed-video") ||
    event.target.closest(".aift-video-wrap")?.querySelector(".aift-feed-video");

  if(state.feedVideoTapTimer){
    clearTimeout(state.feedVideoTapTimer);
    state.feedVideoTapTimer = null;

    doubleLike(postId);
    return;
  }

  state.feedVideoTapTimer = setTimeout(() => {
    state.feedVideoTapTimer = null;
    const resumeTime = Number(feedVideo?.currentTime || 0);
    saveReelPosition(postId);
    openReelMode(postId, true, resumeTime);
  }, 280);
}
function handlePostMediaTap(event, postId){
  event?.preventDefault();
  event?.stopPropagation();

  if(event.target.closest(".aift-video-sound")){
    return;
  }

  const videoWrap = event.target.closest(".aift-video-wrap");
  const isVideo = Boolean(videoWrap);
  const feedVideo = videoWrap?.querySelector(".aift-feed-video");

  if(state.postMediaTapTimer){
    clearTimeout(state.postMediaTapTimer);
    state.postMediaTapTimer = null;

    doubleLike(postId);
    return;
  }

  state.postMediaTapTimer = setTimeout(() => {
    state.postMediaTapTimer = null;

    if(isVideo){
      const resumeTime = Number(feedVideo?.currentTime || 0);
      saveReelPosition(postId);
      openReelMode(postId, true, resumeTime);
    }
  }, 280);
}
  
function closeReelMode(){
  clearTimeout(reelUiTimer);
  clearTimeout(state.reelTapTimer);
  state.reelTapTimer = null;
  document.getElementById("aiftReelViewer")?.classList.remove("aift-reel-ui-hidden");
  const viewer = document.getElementById("aiftReelViewer");

  const savedY =
    state.reelScrollY ||
    Math.abs(parseInt(document.body.style.top || "0", 10)) ||
    0;

  document.getElementById("aiftReelPanelBackdrop")?.classList.remove("show");
  document.getElementById("aiftReelPanel")?.classList.remove("show");

  state.reelPanelPostId = null;
  setReelKeyboard(false);

  document.querySelectorAll(".aift-reel-video").forEach(v => {
    v.pause();
    v.currentTime = 0;
  });

  if(state.reelObserver){
    state.reelObserver.disconnect();
    state.reelObserver = null;
  }

  /*
    DO NOT hide or fade reels yet.
    Keep it covering the screen while feed scroll is restored.
  */
  if(viewer){
    viewer.style.opacity = "1";
    viewer.style.visibility = "visible";
    viewer.style.display = "block";
  }

  const oldHtmlScroll = document.documentElement.style.scrollBehavior;
  const oldBodyScroll = document.body.style.scrollBehavior;

  document.documentElement.style.scrollBehavior = "auto";
  document.body.style.scrollBehavior = "auto";

  document.documentElement.classList.remove("aift-reel-lock");
  document.body.classList.remove("aift-reel-open");

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo(0, savedY);
  document.documentElement.scrollTop = savedY;
  document.body.scrollTop = savedY;

  requestAnimationFrame(() => {
    window.scrollTo(0, savedY);
    document.documentElement.scrollTop = savedY;
    document.body.scrollTop = savedY;

    requestAnimationFrame(() => {
      window.scrollTo(0, savedY);

      document.documentElement.style.scrollBehavior = oldHtmlScroll;
      document.body.style.scrollBehavior = oldBodyScroll;

      if(viewer){
        viewer.classList.remove("show");
        viewer.style.opacity = "0";
        viewer.style.visibility = "hidden";
        viewer.style.display = "none";
      }

      state.reelPlaybackActive = false;
      syncFeedHost(true, false);
      observeFeedVideos();
    });
  });
}

function observeReelVideos(){
  const track = document.querySelector(".aift-reel-track");
  const videos = document.querySelectorAll(".aift-reel-video");

  if(state.reelObserver){
    state.reelObserver.disconnect();
  }

  state.reelObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const slide = entry.target.closest(".aift-reel-slide");
      const video = entry.target;
      const postId = slide?.dataset.postId;

      if(entry.isIntersecting && entry.intersectionRatio >= 0.75){
        stopFeedPlaybackForReels();

        document.querySelectorAll(".aift-reel-video").forEach(v => {
          if(v !== video){
            v.pause();
            v.currentTime = 0;
          }
        });

state.reelActivePostId = postId;

if(postId){
  trackView(postId);
}

const slides = Array.from(document.querySelectorAll(".aift-reel-slide"));
const activeIndex = slides.indexOf(slide);
if(activeIndex >= slides.length - 3 && state.reelHasMore && !state.reelLoading){
  loadReelBatch().then(added => {
    if(added && document.getElementById("aiftReelViewer")?.classList.contains("show")){
      openReelMode(postId, false);
    }
  });
}

document.querySelectorAll(".aift-reel-sound-pop").forEach(pop => {
  pop.classList.remove("show", "is-paused");
  pop.textContent = state.globalVideoMuted ? "Muted" : "Sound on";
});

document.querySelectorAll(".aift-reel-play-indicator").forEach(icon => {
  icon.classList.remove("show");
});

video.muted = state.globalVideoMuted;
video.play().then(showReelUi).catch(() => {
  slide.querySelector(".aift-reel-play-indicator")?.classList.add("show");
  showReelUi();
});
      }else{
        video.pause();
      }
    });
  }, {
    root: track,
    threshold:[0, .5, .75, 1]
  });

  videos.forEach(video => state.reelObserver.observe(video));
}
 async function handleReelLike(postId){
  saveReelPosition(postId);
  showReelHeart(postId);
  await likePost(postId, true);

  const post = getPost(postId);
  if(!post) return;

  const liked = (post.likes || []).some(u => String(u?._id || u) === String(state.meId));

  const btn = document.getElementById(`aift-reel-like-${safeId(postId)}`);
  const count = document.getElementById(`aift-reel-like-count-${safeId(postId)}`);

  btn?.classList.toggle("is-liked", liked);
  if(count) count.textContent = formatCount((post.likes || []).length);
}

async function handleReelSave(postId){
  saveReelPosition(postId);

  if(!requireMember("save reels")) return;

  await savePost(postId);

  const btn = document.getElementById(`aift-reel-save-${safeId(postId)}`);
btn?.classList.toggle("is-saved");

toast("Saved.");
}

function openReelComments(postId){
  saveReelPosition(postId);

  if(!requireMember("comment on reels")) return;

  const post = getPost(postId);
  if(!post) return;

  state.reelPanelPostId = postId;
  state.activePostId = postId;
  state.isMobile = true;
  state.replyTarget = null;

  const panel = document.getElementById("aiftReelPanel");
  const backdrop = document.getElementById("aiftReelPanelBackdrop");
  if(!panel || !backdrop) return;

  panel.innerHTML = `
    <div class="aift-reel-panel-handle"></div>

    <header class="aift-reel-panel-head">
      <strong>Comments</strong>
      <button onclick="AIFTFeed.closeReelPanel()">${svg("close")}</button>
    </header>

    <div class="aift-reel-comments-list">
      ${renderComments(post, 20)}
    </div>

    <footer class="aift-reel-comment-footer">
      <div id="aiftReelReplyBanner" class="aift-reply-banner">
        <span id="aiftReelReplyText"></span>
        <button onclick="AIFTFeed.cancelReply()">Cancel</button>
      </div>

      <div class="aift-reel-comment-row">
        <img src="${esc(userAvatar(state.me || {}))}" alt="">
<input
  id="aiftReelCommentInput"
  placeholder="Add a comment..."
  onfocus="AIFTFeed.setReelKeyboard(true)"
  onblur="AIFTFeed.setReelKeyboard(false)"
  onkeydown="AIFTFeed.handleReelCommentKey(event)"
>
        <button onclick="AIFTFeed.submitReelComment()">Post</button>
      </div>
    </footer>
  `;

  backdrop.classList.add("show");
  panel.classList.add("show");

  setTimeout(() => {
    document.getElementById("aiftReelCommentInput")?.focus();
  }, 160);
}
function handleReelCommentKey(event){
  if(event.key === "Enter" && !event.shiftKey){
    event.preventDefault();
    submitReelComment();
  }
}

async function submitReelComment(){
  const input = document.getElementById("aiftReelCommentInput");
  const postId = state.reelPanelPostId;
  const text = input?.value.trim();

  if(!text || !postId) return;
  if(!requireMember("comment on reels")) return;

  input.disabled = true;

  try{
    if(state.replyTarget?.commentId){
      await api(`${API}/api/posts/${postId}/comments/${state.replyTarget.commentId}/reply`, {
        method:"POST",
        headers:headers({ "Content-Type":"application/json" }),
        body:JSON.stringify({ text })
      });
    }else{
      await api(`${API}/api/posts/${postId}/comment`, {
        method:"POST",
        headers:headers({ "Content-Type":"application/json" }),
        body:JSON.stringify({ text })
      });
    }

    input.value = "";
    state.replyTarget = null;
    document.getElementById("aiftReelReplyBanner")?.classList.remove("show");

if(input){
  input.placeholder = "Add a comment...";
}

    await refreshOnePost(postId);

    const post = getPost(postId);
    const list = document.querySelector(".aift-reel-comments-list");

    if(post && list){
      list.innerHTML = renderComments(post, 50);
    }

    const count = document.getElementById(`aift-reel-comment-count-${safeId(postId)}`);
    if(count && post){
      count.textContent = formatCount(countComments(post));
    }

    updateCommentCount(postId);

  }catch(err){
    toast(err.message, "error");
  }finally{
    input.disabled = false;
    input.focus();
  }
}

async function openReelShare(postId){
  saveReelPosition(postId);

  if(!requireMember("share reels")) return;

  state.activePostId = postId;
  state.reelPanelPostId = postId;
  state.selectedShareUsers = new Set();

  if(!state.followingUsers.length){
    try{
      state.followingUsers = await api(`${API}/api/users/me/following`, {
        headers:headers()
      });
    }catch{
      state.followingUsers = [];
    }
  }

  const panel = document.getElementById("aiftReelPanel");
  const backdrop = document.getElementById("aiftReelPanelBackdrop");
  if(!panel || !backdrop) return;

  panel.innerHTML = `
    <div class="aift-reel-panel-handle"></div>

    <header class="aift-reel-panel-head">
      <strong>Share</strong>
      <button onclick="AIFTFeed.closeReelPanel()">${svg("close")}</button>
    </header>

    <div id="aiftReelShareBody" class="aift-sheet-body"></div>
  `;

  backdrop.classList.add("show");
  panel.classList.add("show");

  renderShareUI(postId);
}

function openReelMoreOptions(postId){
  saveReelPosition(postId);

  const post = getPost(postId);
  if(!post) return;

  const panel = document.getElementById("aiftReelPanel");
  const backdrop = document.getElementById("aiftReelPanelBackdrop");
  if(!panel || !backdrop) return;

  const author = post.author || {};
  const canManage = !state.guestMode && (isMine(author._id) || isAdmin());

  panel.innerHTML = `
    <div class="aift-reel-panel-handle"></div>

    <header class="aift-reel-panel-head">
      <strong>Options</strong>
      <button onclick="AIFTFeed.closeReelPanel()">${svg("close")}</button>
    </header>

    <div class="aift-reel-options">
      <button onclick="AIFTFeed.copyPostLink('${esc(postId)}')">
        ${svg("copy")}
        <span>Copy link</span>
      </button>

      <button onclick="AIFTFeed.savePost('${esc(postId)}')">
        ${svg("save")}
        <span>Save reel</span>
      </button>

      <button onclick="AIFTFeed.notInterested('${esc(postId)}')">
        ${svg("close")}
        <span>Not interested</span>
      </button>

      <button onclick="AIFTFeed.reportPost('${esc(postId)}')">
        ${svg("flag")}
        <span>Report</span>
      </button>

      ${
        canManage
          ? `<button class="danger" onclick="AIFTFeed.deletePost('${esc(postId)}')">
              ${svg("trash")}
              <span>Delete reel</span>
            </button>`
          : ""
      }
    </div>
  `;

  backdrop.classList.add("show");
  panel.classList.add("show");
}

function closeReelPanel(){
  saveReelPosition();

  document.getElementById("aiftReelPanelBackdrop")?.classList.remove("show");
  document.getElementById("aiftReelPanel")?.classList.remove("show");

  state.reelPanelPostId = null;
  setReelKeyboard(false);
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

const list = document.getElementById("aiftFeedList");

if (list) {
  list.insertAdjacentHTML("afterbegin", `
    <div class="aift-single-post-bar">
      <button onclick="history.back()">← Back</button>
      <strong>Post</strong>
    </div>
  `);
}

if (!state.guestMode) {
  connectSocket();
}
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
      if (list) {
  list.style.visibility = sessionStorage.getItem("aiftFeedLastPost") ? "hidden" : "visible";
  list.innerHTML = `<div class="aift-feed-loading"><span class="aift-spinner"></span></div>`;
}
    }
     try {

let feedUrl = state.guestMode
  ? `${API}/api/posts/public?skip=${state.skip}&limit=${state.limit}&sort=${encodeURIComponent(state.sort || "recent")}`
  : `${API}/api/posts/feed?skip=${state.skip}&limit=${state.limit}&seed=${encodeURIComponent(state.feedSeed)}`;

if(state.mode === "profile" && state.authorId){
  feedUrl = state.guestMode
    ? `${API}/api/posts/company/${encodeURIComponent(state.authorId)}/public?skip=${state.skip}&limit=${state.limit}`
    : `${API}/api/posts?skip=${state.skip}&limit=${state.limit}&author=${encodeURIComponent(state.authorId)}`;
}

if(state.mode === "group" && state.groupId){
  feedUrl = `${API}/api/groups/${state.groupId}/posts`;
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
      state.hasMore =
        typeof posts?.hasMore === "boolean"
          ? posts.hasMore
          : incoming.length === state.limit;

      renderFeedOnly();

      const sentinel = document.getElementById("aiftInfiniteSentinel");

if(loadMore){
  loadMore.style.display = "none";
}

if(sentinel){
  sentinel.style.display = state.hasMore ? "flex" : "none";
}
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
  let infiniteObserver = null;

function observeInfiniteScroll(){
  if(!state.infiniteScroll) return;

  const sentinel = document.getElementById("aiftInfiniteSentinel");
  if(!sentinel) return;

  if(infiniteObserver){
    infiniteObserver.disconnect();
    infiniteObserver = null;
  }

  if(!("IntersectionObserver" in window)){
    sentinel.innerHTML = state.hasMore
      ? '<button type="button" class="aift-load-more-fallback">Load more</button>'
      : "";
    sentinel.style.display = state.hasMore ? "flex" : "none";

    const button = sentinel.querySelector(".aift-load-more-fallback");
    if(button){
      button.onclick = () => {
        if(!state.loading && state.hasMore) loadFeed();
      };
    }
    return;
  }

  sentinel.innerHTML = "";

  infiniteObserver = new IntersectionObserver(entries => {
    const entry = entries[0];

    if(entry.isIntersecting && state.hasMore && !state.loading){
      loadFeed();
    }
  }, {
    root:null,
    rootMargin:"900px 0px",
    threshold:0
  });

  infiniteObserver.observe(sentinel);
}

  function mergePosts(posts) {
    const map = new Map();
    posts.forEach(post => {
      if (post?._id) map.set(String(post._id), post);
    });
    return Array.from(map.values());
  }
  function saveReelPosition(postId = ""){
  const activeId = postId || state.reelActivePostId || state.reelPanelPostId || "";
  if(activeId){
    sessionStorage.setItem("aiftLastReelPost", String(activeId));
  }
}

function restoreReelPosition(){
  const savedId = sessionStorage.getItem("aiftLastReelPost");
  if(!savedId) return;

  const track = document.querySelector(".aift-reel-track");
  const slide = document.querySelector(`.aift-reel-slide[data-post-id="${CSS.escape(savedId)}"]`);

  if(track && slide){
    track.scrollTo({
      top: slide.offsetTop,
      behavior: "instant"
    });
    state.reelActivePostId = savedId;
  }

  sessionStorage.removeItem("aiftLastReelPost");
}
  function saveFeedScroll(postId = ""){
  const card = postId
    ? document.getElementById(`aift-post-${safeId(postId)}`)
    : null;

  if(card){
    sessionStorage.setItem(
      "aiftFeedPostOffset",
      String(card.getBoundingClientRect().top)
    );
  }

  if(postId){
    sessionStorage.setItem("aiftFeedLastPost", String(postId));
  }
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
observeInfiniteScroll();
observeFeedVideos();
    restoreFeedScroll();
  }
function restoreFeedScroll(){
  const postId = sessionStorage.getItem("aiftFeedLastPost");
  const offset = Number(sessionStorage.getItem("aiftFeedPostOffset") || 0);

  if(!postId) return;

  const card = document.getElementById(`aift-post-${safeId(postId)}`);

  if(card){
    const currentTop = card.getBoundingClientRect().top;
    window.scrollBy(0, currentTop - offset);
  }

  const list = document.getElementById("aiftFeedList");
  if(list) list.style.visibility = "visible";

  sessionStorage.removeItem("aiftFeedLastPost");
  sessionStorage.removeItem("aiftFeedPostOffset");
}
  function getMediaItems(post = {}) {
    if (Array.isArray(post.media) && post.media.length) {
      return post.media.filter(item => String(item?.url || "").trim());
    }

    if (String(post.mediaUrl || "").trim()) {
      return [{
        url: post.mediaUrl,
        type: post.mediaType || "image"
      }];
    }

    return [];
  }

  function videoDeliveryUrl(url) {
    const value = String(url || "");
    if (!value.includes("res.cloudinary.com") || !value.includes("/video/upload/")) return value;
    return value.replace("/video/upload/", "/video/upload/f_mp4,vc_h264,fl_progressive,q_auto/");
  }

  function videoPosterUrl(url) {
    const value = String(url || "");
    if (!value.includes("res.cloudinary.com") || !value.includes("/video/upload/")) return "";
    return value
      .replace("/video/upload/", "/video/upload/f_jpg,so_0,q_auto/")
      .replace(/\.[a-z0-9]+(?=\?|$)/i, ".jpg");
  }

  function retryVideoSource(video) {
    if (!video || video.dataset.fallbackUsed === "true") return;
    const original = video.dataset.originalSrc;
    if (!original || video.currentSrc === original || video.src === original) return;
    video.dataset.fallbackUsed = "true";
    video.src = original;
    video.load();
    video.play().catch(() => {});
  }

  function renderMediaCarousel(post) {
    const items = getMediaItems(post);
    if (!items.length) return "";

    return `
      <div class="aift-carousel" onclick="AIFTFeed.handlePostMediaTap(event, '${esc(post._id)}')">
        <div class="aift-carousel-track" onscroll="AIFTFeed.updateCarouselDots(this)">
          ${items.map(item => `
            <div class="aift-carousel-slide">
              ${
                item.type === "video"
? `<div class="aift-video-wrap">
<video
  class="aift-post-media aift-feed-video"
  src="${esc(videoDeliveryUrl(item.url))}"
  poster="${esc(videoPosterUrl(item.url))}"
  data-original-src="${esc(item.url)}"
  muted
  playsinline
  loop
  preload="auto"
  data-post-id="${esc(post._id)}"
  onerror="AIFTFeed.retryVideoSource(this)"
  
  ondblclick="event.preventDefault(); event.stopPropagation();"
></video>

<button
  class="aift-video-sound"
  type="button"
  onpointerdown="event.preventDefault(); event.stopPropagation();"
  onclick="event.preventDefault(); event.stopPropagation(); AIFTFeed.toggleFeedVideoSound(event)"
 aria-label="Unmute video" title="Unmute video">
  ${svg("volumeOff")}
</button>
   </div>`
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
  const verified = isVerified(author);
  const followed = isFollowing(author);
  const requested = isFollowRequested(author);
  const textData = shortText(original.text || "");

  return `
    <div class="aift-repost-clean-box"
         onclick="AIFTFeed.openOriginalPost('${esc(original._id)}')">

      <header class="aift-repost-clean-head">

        <div class="aift-author"
             onclick="event.stopPropagation(); AIFTFeed.visitProfile('${esc(author._id)}')">

          <img class="aift-avatar" src="${esc(userAvatar(author))}" alt="">

          <div class="aift-author-text">
            <div class="aift-author-name">
              <strong>${esc(userName(author))}</strong>
              ${verified ? `<span class="aift-verified">${svg("check")}</span>` : ""}
            </div>

            <span>
              ${esc(userSub(author))}
              ${original.createdAt ? ` · ${formatTime(original.createdAt)}` : ""}
            </span>
          </div>

        </div>

        ${
          !state.guestMode && !followed
            ? `
              <button
                class="aift-follow-btn aift-repost-clean-follow ${requested ? "is-requested" : ""}"
                data-follow-user="${esc(author._id)}"
                onclick="event.stopPropagation(); AIFTFeed.toggleFollow('${esc(author._id)}')"
              >
                <span>${requested ? "Requested" : "Follow"}</span>
              </button>
            `
            : ""
        }

      </header>

      ${
        original.text?.trim()
          ? `
            <div class="aift-repost-clean-text">
              ${
                textData.needsMore
                  ? `${textData.short} <button class="aift-inline-more" onclick="event.stopPropagation(); AIFTFeed.openOriginalPost('${esc(original._id)}')">see more</button>`
                  : textData.full
              }
            </div>
          `
          : ""
      }

      <div class="aift-repost-clean-media">
        ${renderMediaCarousel(original)}
      </div>

    </div>
  `;
}

function openOriginalPost(postId) {
  saveFeedScroll(postId);
location.href = `home.html?post=${encodeURIComponent(postId)}`;
}
  function setReelKeyboard(open){
  document.body.classList.toggle("aift-reel-keyboard", Boolean(open));
}

  function updateCarouselDots(track) {
    const carousel = track.closest(".aift-carousel, .aift-composer-preview");
    const dots = carousel?.querySelectorAll(".aift-carousel-dots span");
    if (!dots?.length) return;

    const index = Math.round(track.scrollLeft / Math.max(track.clientWidth, 1));
    dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
  }

function shortText(text = ""){
  const clean = String(text || "").trim();
  const max = window.innerWidth <= 720 ? 92 : 180;

  if(clean.length <= max){
    return {
      short: esc(clean),
      full: esc(clean),
      needsMore: false
    };
  }

  return {
    short: esc(clean.slice(0, max).trim()) + "...",
    full: esc(clean),
    needsMore: true
  };
}

  function renderPost(post) {
    const author = post.author || {};
    const liked = (post.likes || []).some(u => String(u?._id || u) === String(state.meId));
    const commentsCount = countComments(post);
    const followed = isFollowing(author);
    const requested = isFollowRequested(author);
    const verified = isVerified(author);
    const canManage = !state.guestMode && (isMine(author._id) || isAdmin());
    const textData = shortText(post.text || "");

    return `
      <article class="aift-post-card ${post.repostOf ? "is-repost-post" : ""}" id="aift-post-${safeId(post._id)}" data-post-id="${esc(post._id)}">
      ${
  post.repostOf
    ? `<div class="aift-repost-banner">
        ${svg("repost")}
        <strong>${esc(userName(author))}</strong>
        <span>reposted this</span>
      </div>`
    : ""
}
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
  !state.guestMode && !followed
    ? `<button
        class="aift-follow-btn ${requested ? "is-requested" : ""}"
        id="aift-follow-${safeId(author._id)}"
        data-follow-user="${esc(author._id)}"
        onclick="event.stopPropagation(); AIFTFeed.toggleFollow('${esc(author._id)}')"
      >
        <span>${requested ? "Requested" : "Follow"}</span>
      </button>`
    : ""
}
            <button class="aift-icon-btn" onclick="AIFTFeed.openPostMenu('${esc(post._id)}')">${svg("more")}</button>
          </div>
        </header>

${
  post.text?.trim()
    ? `<div
        id="aift-text-${safeId(post._id)}"
        class="aift-post-text ${textData.needsMore ? "is-shortened" : ""}"
        data-full="${textData.full}"
data-short="${textData.short}"
      >
        ${textData.needsMore
          ? `${textData.short} <button class="aift-inline-more" onclick="event.stopPropagation(); AIFTFeed.expandPostText('${esc(post._id)}')">more</button>`
          : textData.full
        }
      </div>`
    : ""
}

        ${post.repostOf ? renderOriginalPostCard(post.repostOf) : renderMediaCarousel(post)}

        <section class="aift-post-actions instagram-style">
          <div class="aift-left-actions">
            <button class="aift-action-btn ${liked ? "is-liked" : ""}" onclick="AIFTFeed.likePost('${esc(post._id)}')" aria-label="Like">
              ${svg("heart")}
              <strong id="aift-likes-count-${safeId(post._id)}">${formatCount((post.likes || []).length)}</strong>
            </button>

            <button class="aift-action-btn" onclick="AIFTFeed.openComments('${esc(post._id)}')" aria-label="Comment">
              ${svg("comment")}
              <strong id="aift-comments-count-${safeId(post._id)}">${formatCount(commentsCount)}</strong>
            </button>

            <button class="aift-action-btn" onclick="AIFTFeed.openRepost('${esc(post._id)}')" aria-label="Repost">
              ${svg("repost")}
              <strong>${formatCount(post.repostsCount || post.repostCount || 0)}</strong>
            </button>

            <button class="aift-action-btn" onclick="AIFTFeed.openShare('${esc(post._id)}')" aria-label="Share">
              ${svg("share")}
              <strong id="aift-shares-count-${safeId(post._id)}">${formatCount(post.sharesCount || 0)}</strong>
            </button>
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

        <section class="aift-post-stats compact-hidden">
          ${
            !post.repostOf
              ? `<span id="aift-views-wrap-${safeId(post._id)}">
                  <strong id="aift-views-count-${safeId(post._id)}">${post.viewsCount || 0}</strong>
                </span>`
              : ""
          }
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
${files.map((file, index) => {
  const url = URL.createObjectURL(file);

  return `
    <div class="aift-carousel-slide aift-preview-item">
      <button class="aift-preview-remove" onclick="AIFTFeed.removeComposerMedia(${index})" type="button">
        ×
      </button>

      ${
        getPostMediaType(file) === "video"
          ? renderVideoPreview(url)
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

  function removeComposerMedia(index){
  const mediaEl = document.getElementById("aiftPostMedia");
  if(!mediaEl) return;

  const dt = new DataTransfer();
  const files = Array.from(mediaEl.files || []);

  files.forEach((file, i) => {
    if(i !== index){
      dt.items.add(file);
    }
  });

  mediaEl.files = dt.files;
  previewComposerMedia();
}
  

function renderVideoPreview(url){
  return `<div class="aift-clean-preview"><video src="${esc(url)}" playsinline preload="metadata" onended="this.parentElement.classList.remove('is-playing');this.nextElementSibling.textContent='▶';this.nextElementSibling.setAttribute('aria-label','Play video preview')"></video><button type="button" class="aift-preview-play" aria-label="Play video preview" onclick="AIFTFeed.togglePreviewVideo(this)">▶</button></div>`;
}

function togglePreviewVideo(button){
  const video = button.previousElementSibling;
  if(video.paused){
    video.play().then(() => { button.textContent = "Ⅱ"; button.setAttribute("aria-label", "Pause video preview"); button.parentElement.classList.add("is-playing"); }).catch(() => toast("This format cannot be previewed in this browser. Try MP4 (H.264).", "error"));
  }else{
    video.pause();
    button.textContent = "▶";
    button.setAttribute("aria-label", "Play video preview");
    button.parentElement.classList.remove("is-playing");
  }
}

function setComposerUploadProgress(percent, label = "") {
  const wrap = document.getElementById("aiftComposerProgress");
  const bar = document.getElementById("aiftComposerProgressBar");
  const text = document.getElementById("aiftComposerProgressText");

  if (!wrap) return;

  const value = Math.max(0, Math.min(100, Number(percent) || 0));
  wrap.hidden = false;

  if (bar) bar.style.width = value + "%";
  if (text) text.textContent = label || `Uploading ${Math.round(value)}%`;
}

function resetComposerUploadProgress() {
  const wrap = document.getElementById("aiftComposerProgress");
  const bar = document.getElementById("aiftComposerProgressBar");
  const text = document.getElementById("aiftComposerProgressText");

  if (bar) bar.style.width = "0%";
  if (text) text.textContent = "Preparing upload...";
  if (wrap) wrap.hidden = true;
}

async function getPostMediaUploadSignature(type) {
  return api(
    `${API}/api/posts/media-upload-signature?type=${encodeURIComponent(type)}`,
    { headers: headers() }
  );
}

function getR2VideoContentType(file) {
  const mime = String(file?.type || "").toLowerCase().split(";")[0].trim();
  if (mime.startsWith("video/")) return mime;

  const name = String(file?.name || "").toLowerCase();
  const extension = name.includes(".") ? name.split(".").pop() : "";
  const byExtension = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    m4v: "video/x-m4v",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mkv: "video/x-matroska",
    "3gp": "video/3gpp",
    "3g2": "video/3gpp2",
    mpeg: "video/mpeg",
    mpg: "video/mpeg",
    mts: "video/mp2t",
    m2ts: "video/mp2t",
    ts: "video/mp2t"
  };

  return byExtension[extension] || "";
}

async function getR2VideoUploadUrl(file) {
  const contentType = getR2VideoContentType(file);

  if (!contentType) {
    throw new Error("This video format could not be identified for upload.");
  }

  return api(`${API}/api/posts/media-upload-r2-url`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      filename: file?.name || "video",
      contentType,
      size: Number(file?.size || 0)
    })
  });
}

function uploadVideoDirectToR2(file, uploadData, onProgress) {
  return new Promise((resolve, reject) => {
    const uploadUrl = String(uploadData?.uploadUrl || "").trim();
    const publicUrl = String(uploadData?.publicUrl || "").trim();
    const contentType = String(uploadData?.contentType || file?.type || "").trim();

    if (!uploadUrl || !publicUrl || !contentType) {
      reject(new Error("R2 did not return a complete video upload authorization."));
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.timeout = 60 * 60 * 1000;
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(file.size, file.size);
        resolve({
          url: publicUrl,
          type: "video"
        });
        return;
      }

      let message = `Video upload failed (${xhr.status}).`;
      const responseText = String(xhr.responseText || "").trim();

      if (responseText && responseText.length < 500) {
        message += ` ${responseText}`;
      }

      const error = new Error(message);
      error.status = xhr.status;
      reject(error);
    };

    xhr.onerror = () => {
      const error = new Error(
        "The R2 video upload connection failed. Please check your connection and try again."
      );
      error.status = 0;
      reject(error);
    };

    xhr.ontimeout = () => {
      const error = new Error("The R2 video upload took too long to finish.");
      error.status = 408;
      reject(error);
    };

    xhr.send(file);
  });
}

async function postR2Multipart(endpoint, payload) {
  return api(`${API}/api/posts/media-upload-r2-multipart/${endpoint}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload || {})
  });
}

function uploadR2PartRequest(blob, uploadUrl, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.timeout = 20 * 60 * 1000;
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.onprogress = event => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = String(
          xhr.getResponseHeader("ETag") ||
          xhr.getResponseHeader("etag") ||
          ""
        ).trim();

        if (!etag) {
          const error = new Error("R2 uploaded a video part without returning its ETag.");
          error.status = 502;
          reject(error);
          return;
        }

        onProgress?.(blob.size, blob.size);
        resolve(etag);
        return;
      }

      const error = new Error(`Video part upload failed (${xhr.status}).`);
      error.status = xhr.status;
      reject(error);
    };

    xhr.onerror = () => {
      const error = new Error("The video part upload connection failed.");
      error.status = 0;
      reject(error);
    };

    xhr.ontimeout = () => {
      const error = new Error("A video part took too long to upload.");
      error.status = 408;
      reject(error);
    };

    xhr.send(blob);
  });
}

async function uploadLargeVideoDirectToR2(file, onProgress) {
  const contentType = getR2VideoContentType(file);

  if (!contentType) {
    throw new Error("This video format could not be identified for upload.");
  }

  const session = await postR2Multipart("start", {
    filename: file?.name || "video",
    contentType,
    size: Number(file?.size || 0)
  });

  const uploadId = String(session?.uploadId || "").trim();
  const key = String(session?.key || "").trim();
  const publicUrl = String(session?.publicUrl || "").trim();
  const partSize = Math.max(
    5 * 1024 * 1024,
    Number(session?.partSize || 25 * 1024 * 1024)
  );

  if (!uploadId || !key || !publicUrl) {
    throw new Error("R2 did not return a complete multipart upload session.");
  }

  const partCount = Math.ceil(file.size / partSize);
  const loadedByPart = new Array(partCount).fill(0);
  const completedParts = new Array(partCount);
  let nextPartIndex = 0;

  const report = () => {
    const loaded = loadedByPart.reduce((sum, value) => sum + value, 0);
    onProgress?.(Math.min(file.size, loaded), file.size);
  };

  const uploadPart = async index => {
    const partNumber = index + 1;
    const start = index * partSize;
    const end = Math.min(file.size, start + partSize);
    const blob = file.slice(start, end);

    let attempt = 0;
    let lastError = null;

    while (attempt < 3) {
      attempt += 1;

      try {
        const signed = await postR2Multipart("part-url", {
          key,
          uploadId,
          partNumber
        });

        const etag = await uploadR2PartRequest(
          blob,
          String(signed?.uploadUrl || ""),
          loaded => {
            loadedByPart[index] = Math.max(0, Math.min(blob.size, loaded));
            report();
          }
        );

        loadedByPart[index] = blob.size;
        completedParts[index] = { partNumber, etag };
        report();
        return;
      } catch (error) {
        lastError = error;
        loadedByPart[index] = 0;
        report();

        const status = Number(error?.status || 0);
        const retryable =
          status === 0 ||
          status === 408 ||
          status === 429 ||
          status >= 500;

        if (!retryable || attempt >= 3) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, 700 * attempt));
      }
    }

    throw lastError || new Error("Video part upload failed.");
  };

  try {
    async function worker() {
      while (nextPartIndex < partCount) {
        const index = nextPartIndex++;
        await uploadPart(index);
      }
    }

    const workerCount = Math.min(2, partCount);
    await Promise.all(
      Array.from({ length: workerCount }, () => worker())
    );

    const complete = await postR2Multipart("complete", {
      key,
      uploadId,
      parts: completedParts
    });

    const finalUrl = String(complete?.url || publicUrl).trim();
    if (!finalUrl) {
      throw new Error("R2 completed the video but did not return its media URL.");
    }

    onProgress?.(file.size, file.size);

    return {
      url: finalUrl,
      type: "video"
    };
  } catch (error) {
    postR2Multipart("abort", { key, uploadId }).catch(() => {});
    throw error;
  }
}

function cloudinaryUploadForm(filePart, fileName, signatureData) {
  const form = new FormData();
  form.append("file", filePart, fileName);
  form.append("api_key", signatureData.apiKey);
  form.append("timestamp", String(signatureData.timestamp));
  form.append("folder", signatureData.folder);
  form.append("signature", signatureData.signature);
  return form;
}

function cloudinaryUploadEndpoint(signatureData, resourceType) {
  return `https://api.cloudinary.com/v1_1/${encodeURIComponent(signatureData.cloudName)}/${resourceType}/upload`;
}

function getPostMediaType(file) {
  const mime = String(file?.type || "").toLowerCase();
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("image/")) return "image";

  const name = String(file?.name || "").toLowerCase();
  const extension = name.includes(".") ? name.split(".").pop() : "";

  const videoExtensions = new Set([
    "mp4","mov","m4v","webm","avi","mkv","3gp","3g2","mpeg","mpg","mts","m2ts","ts"
  ]);
  const imageExtensions = new Set([
    "jpg","jpeg","png","gif","webp","heic","heif","bmp","tif","tiff","avif"
  ]);

  if (videoExtensions.has(extension)) return "video";
  if (imageExtensions.has(extension)) return "image";
  return null;
}

function uploadCloudinaryRequest({
  endpoint,
  form,
  timeout,
  headers: requestHeaders = {},
  onProgress
}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.timeout = timeout;

    Object.entries(requestHeaders).forEach(([name, value]) => {
      xhr.setRequestHeader(name, value);
    });

    xhr.upload.onprogress = event => {
      if(event.lengthComputable){
        onProgress?.(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      let data = {};

      try {
        data = JSON.parse(xhr.responseText || "{}");
      } catch {}

      if(xhr.status >= 200 && xhr.status < 300){
        resolve(data);
        return;
      }

      const cloudinaryError =
        data?.error?.message ||
        xhr.getResponseHeader("X-Cld-Error") ||
        xhr.getResponseHeader("x-cld-error");

      const error = new Error(
        cloudinaryError ||
        `Media upload failed (${xhr.status}).`
      );
      error.status = xhr.status;
      error.cloudinary = Boolean(cloudinaryError);
      reject(error);
    };

    xhr.onerror = () => {
      const error = new Error("The media upload connection failed. Retrying may help on mobile networks.");
      error.status = 0;
      reject(error);
    };

    xhr.ontimeout = () => {
      const error = new Error("The media upload took too long to finish.");
      error.status = 408;
      reject(error);
    };

    xhr.send(form);
  });
}

async function uploadLargeFileDirectToCloudinary(
  file,
  signatureData,
  resourceType,
  onProgress
) {
  const endpoint = cloudinaryUploadEndpoint(signatureData, resourceType);
  const chunkSize = 20 * 1024 * 1024;
  const uploadId =
    globalThis.crypto?.randomUUID?.() ||
    `aift-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let start = 0;
  let finalResponse = null;

  while(start < file.size){
    const endExclusive = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, endExclusive);
    const form = cloudinaryUploadForm(chunk, file.name, signatureData);

    const response = await uploadCloudinaryRequest({
      endpoint,
      form,
      timeout: 10 * 60 * 1000,
      headers: {
        "X-Unique-Upload-Id": uploadId,
        "Content-Range": `bytes ${start}-${endExclusive - 1}/${file.size}`
      },
      onProgress: loaded => {
        onProgress?.(Math.min(file.size, start + loaded), file.size);
      }
    });

    finalResponse = response;
    start = endExclusive;
    onProgress?.(start, file.size);
  }

  if(!String(finalResponse?.secure_url || "").trim()){
    throw new Error("Cloudinary finished receiving the video but did not return a media URL.");
  }

  return {
    url: finalResponse.secure_url,
    type: resourceType
  };
}

async function uploadFileDirectToCloudinary(file, signatureData, onProgress) {
  const resourceType = getPostMediaType(file);

  if (!resourceType) {
    throw new Error(`${file?.name || "This file"} is not recognized as a supported image or video.`);
  }

  /*
    Cloudinary requires chunked Upload API calls above 100 MB.
    Keep a little headroom so large phone videos never hit the
    single-request ceiling.
  */
  if(file.size > 95 * 1024 * 1024){
    return uploadLargeFileDirectToCloudinary(
      file,
      signatureData,
      resourceType,
      onProgress
    );
  }

  const endpoint = cloudinaryUploadEndpoint(signatureData, resourceType);
  const form = cloudinaryUploadForm(file, file.name, signatureData);

  const data = await uploadCloudinaryRequest({
    endpoint,
    form,
    timeout: 30 * 60 * 1000,
    onProgress
  });

  if(!String(data.secure_url || "").trim()){
    throw new Error("Media upload completed without a delivery URL.");
  }

  return {
    url: data.secure_url,
    type: resourceType
  };
}

async function uploadPostMediaDirect(files, onProgress) {
  if (!files.length) return [];

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0) || 1;
  const loadedByIndex = new Array(files.length).fill(0);
  const results = new Array(files.length);
  let nextIndex = 0;

  const report = () => {
    const loaded = loadedByIndex.reduce((sum, value) => sum + value, 0);
    onProgress?.(Math.min(100, Math.round((loaded / totalBytes) * 100)));
  };

  async function worker() {
    while (nextIndex < files.length) {
      const index = nextIndex++;
      const file = files[index];
      const type = getPostMediaType(file);

      if (!type) {
        throw new Error(`${file?.name || "This file"} is not recognized as a supported image or video.`);
      }

      let attempt = 0;
      let lastError = null;

      while(attempt < 2){
        attempt += 1;

        try{
          if (type === "video") {
            const videoProgress = loaded => {
              // Keep the aggregate below 100 until R2 has either confirmed
              // the single PUT or completed the multipart upload.
              loadedByIndex[index] = Math.min(
                Math.max(0, file.size - 1),
                Math.max(0, loaded)
              );
              report();
            };

            if (file.size > 90 * 1024 * 1024) {
              results[index] = await uploadLargeVideoDirectToR2(
                file,
                videoProgress
              );
            } else {
              const uploadData = await getR2VideoUploadUrl(file);

              results[index] = await uploadVideoDirectToR2(
                file,
                uploadData,
                videoProgress
              );
            }
          } else {
            const signature = await getPostMediaUploadSignature(type);

            results[index] = await uploadFileDirectToCloudinary(
              file,
              signature,
              loaded => {
                // Sending the final byte is not the same as Cloudinary
                // finishing the upload. Keep the visible total below 100
                // until a secure delivery URL has actually been returned.
                loadedByIndex[index] = Math.min(
                  Math.max(0, file.size - 1),
                  Math.max(0, loaded)
                );
                report();
              }
            );
          }

          loadedByIndex[index] = file.size;
          report();
          lastError = null;
          break;
        }catch(error){
          lastError = error;
          const status = Number(error?.status || 0);
          const retryable =
            status === 0 ||
            status === 408 ||
            status === 429 ||
            status >= 500;

          if(!retryable || attempt >= 2){
            throw error;
          }

          loadedByIndex[index] = 0;
          report();
          await new Promise(resolve => setTimeout(resolve, 700));
        }
      }

      if(lastError){
        throw lastError;
      }
    }
  }

  const workerCount = Math.min(2, files.length);
  await Promise.all(
    Array.from({ length: workerCount }, () => worker())
  );

  return results;
}

async function publishUploadedPost({ text = "", media = [] } = {}) {
  const payload = JSON.stringify({
    text: String(text || "").trim(),
    media: Array.isArray(media) ? media : []
  });

  async function request(endpoint) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: headers({ "Content-Type": "application/json" }),
      body: payload
    });

    let data = {};
    try {
      data = await res.json();
    } catch {}

    if (!res.ok) {
      const error = new Error(
        data?.message || data?.msg || `Post publish failed (${res.status}).`
      );
      error.status = res.status;
      throw error;
    }

    return data;
  }

  try {
    return await request(`${API}/api/posts/direct`);
  } catch (error) {
    // Compatibility fallback is only safe when the dedicated route does not exist.
    // Never retry a 5xx/network failure because the server may already have created
    // the post and a blind retry could create a duplicate.
    if (![404, 405].includes(Number(error?.status))) throw error;
    return request(`${API}/api/posts`);
  }
}

async function createPost() {
  if(!requireMember("create posts")) return;

  const textEl = document.getElementById("aiftPostText");
  const mediaEl = document.getElementById("aiftPostMedia");
  const preview = document.getElementById("aiftComposerPreview");
  const postBtn = document.querySelector(".aift-composer .aift-primary-btn");

  const text = textEl?.value.trim() || "";
  const files = Array.from(mediaEl?.files || []);

  if(files.length > 10){
    toast("Choose up to 10 images or videos per post.", "error");
    return;
  }

  const unsupported = files.find(file => !getPostMediaType(file));

  if(unsupported){
    toast(`${unsupported.name} is not recognized as an image or video.`, "error");
    return;
  }

  if (!text && !files.length) {
    toast("Please write something or add media first.");
    return;
  }

  if (postBtn?.disabled) return;

  if (postBtn) {
    postBtn.disabled = true;
    postBtn.textContent = files.length ? "Uploading 0%" : "Posting...";
  }

  const endpoint =
    state.mode === "group" && state.groupId
      ? `${API}/api/groups/${state.groupId}/posts`
      : `${API}/api/posts`;

  try {
    let response;

    if (state.mode === "group" && state.groupId) {
      const form = new FormData();
      form.append("text", text);
      form.append("groupId", state.groupId);
      files.forEach(file => form.append("media", file));

      response = await uploadPostWithProgress(
        endpoint,
        form,
        progress => {
          setComposerUploadProgress(progress, `Uploading ${progress}%`);
          if (postBtn) postBtn.textContent = progress >= 100 ? "Processing..." : `Uploading ${progress}%`;
        }
      );
    } else if (files.length) {
      const uploadedMedia = await uploadPostMediaDirect(
        files,
        progress => {
          setComposerUploadProgress(progress, `Uploading ${progress}%`);
          if (postBtn) postBtn.textContent = progress >= 100 ? "Publishing..." : `Uploading ${progress}%`;
        }
      );

      setComposerUploadProgress(100, "Publishing post...");
      if (postBtn) postBtn.textContent = "Publishing...";

      response = await publishUploadedPost({
        text,
        media: uploadedMedia
      });
    } else {
      response = await api(endpoint, {
        method: "POST",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text })
      });
    }

    const post = response.post || response;

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

    setTimeout(resetComposerUploadProgress, 450);
  }
}

function uploadPostWithProgress(endpoint, form, onProgress){
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint);
    xhr.setRequestHeader("Authorization", "Bearer " + getToken());
    xhr.timeout = 30 * 60 * 1000;

    xhr.upload.onprogress = event => {
      if(event.lengthComputable){
        onProgress?.(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      let data = {};
      try{
        data = JSON.parse(xhr.responseText || "{}");
      }catch{
        data = {};
      }

      if(xhr.status >= 200 && xhr.status < 300){
        resolve(data);
        return;
      }

      reject(new Error(data.message || data.error || `Upload failed (${xhr.status}).`));
    };

    xhr.onerror = () => reject(new Error("The upload connection failed. Please check your connection and try again."));
    xhr.ontimeout = () => reject(new Error("The upload took too long to finish. Please try again on a stable connection."));
    xhr.send(form);
  });
}

    async function likePost(postId, silent = false) {
  if(!requireMember("like posts")) return;
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
function expandPostText(postId){
  const text = document.getElementById(`aift-text-${safeId(postId)}`);
  if(!text) return;

  text.innerHTML = `
    ${text.dataset.full || text.innerHTML}
    <button class="aift-inline-more" onclick="event.stopPropagation(); AIFTFeed.collapsePostText('${postId}')">view less</button>
  `;

  text.classList.remove("is-shortened");
}
  function collapsePostText(postId){
  const text = document.getElementById(`aift-text-${safeId(postId)}`);
  if(!text) return;

  const short = text.dataset.short || "";
  text.innerHTML = `
    ${short} <button class="aift-inline-more" onclick="event.stopPropagation(); AIFTFeed.expandPostText('${postId}')">more</button>
  `;

  text.classList.add("is-shortened");
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
    if (count) count.textContent = formatCount((post.likes || []).length);
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
  function showReelHeart(postId){
  const heart = document.getElementById(`aift-reel-heart-${safeId(postId)}`);
  if(!heart) return;

  heart.classList.remove("show");
  void heart.offsetWidth;
  heart.classList.add("show");

  setTimeout(() => heart.classList.remove("show"), 900);
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
  if(!requireMember("comment on posts")) return;
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
    const hiddenComments = getHiddenComments();

const comments = (post.comments || []).filter(comment =>
  !hiddenComments.includes(String(comment._id))
);
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

<button
  class="aift-comment-more"
  onclick="AIFTFeed.openCommentMenu('${esc(postId)}','${esc(comment._id)}')"
  title="Comment options"
>
  ${svg("more")}
</button>
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
    ? `<button class="aift-comment-more" onclick="AIFTFeed.openReplyMenu('${esc(postId)}','${esc(commentId)}','${esc(reply._id)}')" title="Reply options">${svg("more")}</button>`
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
function openCommentMenu(postId, commentId){
  const reelPanel = document.getElementById("aiftReelPanel");

  if(reelPanel?.classList.contains("show") && state.reelPanelPostId === postId){
    openReelCommentMenu(postId, commentId);
    return;
  }

  const post = getPost(postId);
  const comment = post?.comments?.find(c => String(c._id) === String(commentId));
  if(!post || !comment) return;

  const user = comment.user || {};
  const commentOwnerId = String(user._id || user.id || "");
  const myId = String(state.meId || localStorage.getItem("userId") || "");
  const isMyComment = commentOwnerId && myId && commentOwnerId === myId;

  const name = userName(user);
  const alreadyFollowing = isFollowing(user);

  const menu = document.getElementById("aiftMenuBody");
  if(!menu) return;

  menu.innerHTML = `
    ${
      !isMyComment && user._id
        ? `<button class="aift-sheet-option" onclick="AIFTFeed.sendCommentOwner('${esc(user._id)}')">
            ${svg("send")}<span>Send message</span>
          </button>

          <button class="aift-sheet-option" onclick="AIFTFeed.toggleFollow('${esc(user._id)}')">
            ${alreadyFollowing ? svg("close") : svg("plus")}
            <span>${alreadyFollowing ? "Unfollow" : "Follow"} ${esc(name)}</span>
          </button>

          <button class="aift-sheet-option danger" onclick="AIFTFeed.reportComment('${esc(postId)}','${esc(commentId)}')">
            ${svg("flag")}<span>Report comment</span>
          </button>

          <button class="aift-sheet-option" onclick="AIFTFeed.hideComment('${esc(commentId)}')">
            ${svg("close")}<span>I don’t want to see this</span>
          </button>`
        : ""
    }

    ${
      isMyComment
        ? `<button class="aift-sheet-option" onclick="AIFTFeed.editComment('${esc(postId)}','${esc(commentId)}')">
            ${svg("edit")}<span>Edit comment</span>
          </button>

          <button class="aift-sheet-option danger" onclick="AIFTFeed.deleteComment('${esc(postId)}','${esc(commentId)}')">
            ${svg("trash")}<span>Delete comment</span>
          </button>`
        : ""
    }
  `;

  openOverlay("aiftMenuSheet");
}
  function openReelCommentMenu(postId, commentId){
  const post = getPost(postId);
  const comment = post?.comments?.find(c => String(c._id) === String(commentId));
  if(!post || !comment) return;

  const user = comment.user || {};
  const isMyComment = String(user._id || user.id || "") === String(state.meId || localStorage.getItem("userId") || "");
  const alreadyFollowing = isFollowing(user);

  const panel = document.getElementById("aiftReelPanel");
  if(!panel) return;

  panel.innerHTML = `
    <div class="aift-reel-panel-handle"></div>

    <header class="aift-reel-panel-head">
      <strong>Comment options</strong>
      <button onclick="AIFTFeed.openReelComments('${esc(postId)}')">${svg("close")}</button>
    </header>

    <div class="aift-reel-options">
      ${
        !isMyComment && user._id
          ? `
          <button onclick="AIFTFeed.sendCommentOwner('${esc(user._id)}')">
            ${svg("send")}<span>Send message</span>
          </button>

          <button onclick="AIFTFeed.toggleFollow('${esc(user._id)}')">
            ${alreadyFollowing ? svg("close") : svg("plus")}
            <span>${alreadyFollowing ? "Unfollow" : "Follow"}</span>
          </button>

          <button onclick="AIFTFeed.hideComment('${esc(commentId)}'); AIFTFeed.openReelComments('${esc(postId)}')">
            ${svg("close")}<span>I don’t want to see this</span>
          </button>

          <button class="danger" onclick="AIFTFeed.reportComment('${esc(postId)}','${esc(commentId)}')">
            ${svg("flag")}<span>Report comment</span>
          </button>
          `
          : ""
      }

      ${
        isMyComment
          ? `
          <button onclick="AIFTFeed.editComment('${esc(postId)}','${esc(commentId)}')">
            ${svg("edit")}<span>Edit comment</span>
          </button>

          <button class="danger" onclick="AIFTFeed.deleteComment('${esc(postId)}','${esc(commentId)}')">
            ${svg("trash")}<span>Delete comment</span>
          </button>
          `
          : ""
      }
    </div>
  `;
}

async function editComment(postId, commentId){
  const post = getPost(postId);
  const comment = post?.comments?.find(c => String(c._id) === String(commentId));
  if(!comment) return;

  const next = prompt("Edit your comment:", comment.text || "");
  if(next === null) return;

  const text = next.trim();
  if(!text) return;

  try{
    await api(`${API}/api/posts/${postId}/comments/${commentId}`, {
      method:"PATCH",
      headers:headers({ "Content-Type":"application/json" }),
      body:JSON.stringify({ text })
    });

    closeOverlays();
    await refreshOnePost(postId);
    rerenderActiveComments(postId);
    toast("Comment updated.");
  }catch(err){
    toast(err.message || "Edit comment endpoint is not ready yet.", "error");
  }
}

async function reportComment(postId, commentId){
  try{
    await api(`${API}/api/posts/${postId}/report`, {
      method:"POST",
      headers:headers({ "Content-Type":"application/json" }),
      body:JSON.stringify({
        type:"comment",
        commentId,
        reason:"Reported from comment menu"
      })
    });

    closeOverlays();
    toast("Comment reported. Our admin team will review it.");
  }catch(err){
    toast(err.message, "error");
  }
}
function sendCommentOwner(userId){
  if(!userId) return;

  closeOverlays();

  window.location.href =
    `messages.html?user=${encodeURIComponent(userId)}`;
}
  
function hideComment(commentId){
  if(!commentId) return;

  saveHiddenComment(commentId);

  document
    .querySelectorAll(`#aift-comment-${safeId(commentId)}, #aift-reply-${safeId(commentId)}`)
    .forEach(el => {
      el.style.transition = "opacity .18s ease, transform .18s ease";
      el.style.opacity = "0";
      el.style.transform = "translateX(12px)";

      setTimeout(() => {
        el.remove();
      }, 180);
    });

  closeOverlays();
  toast("Comment hidden.");
}

async function copyCommentLink(postId){
  const link = getPostLink(postId);

  try{
    await navigator.clipboard.writeText(link);
    closeOverlays();
    toast("Comment link copied.");
  }catch{
    alert(link);
  }
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

function openReplyMenu(postId, commentId, replyId){
  openConfirmModal({
    title: "Reply options",
    message: "You can manage your own reply here.",
    confirmText: "Delete reply",
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

  const reelPanel = document.getElementById("aiftReelPanel");
  const reelList = document.querySelector(".aift-reel-comments-list");

  if(reelPanel?.classList.contains("show") && reelList && state.reelPanelPostId === postId){
    reelList.innerHTML = renderComments(post, 50);
    return;
  }

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

  const reelInput = document.getElementById("aiftReelCommentInput");
  const reelBanner = document.getElementById("aiftReelReplyBanner");
  const reelText = document.getElementById("aiftReelReplyText");

  if(reelInput && reelBanner && reelText){
    reelText.textContent = `Replying to ${name}`;
    reelBanner.classList.add("show");
    reelInput.placeholder = `Reply to ${name}...`;
    reelInput.focus();
    return;
  }

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

  document.getElementById("aiftReelReplyBanner")?.classList.remove("show");

  const reelInput = document.getElementById("aiftReelCommentInput");
  if(reelInput){
    reelInput.placeholder = "Add a comment...";
    reelInput.focus();
  }
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
  if(!requireMember("share posts")) return;
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
  const reelPanel = document.getElementById("aiftReelPanel");
  const reelBody = document.getElementById("aiftReelShareBody");

  const isReelShare = reelPanel?.classList.contains("show") && reelBody;

  const body = isReelShare
    ? reelBody
    : document.getElementById("aiftShareBody");

  if(!body) return;

  const link = getPostLink(postId);

  const users = state.followingUsers.filter(user => {
    const term = `${userName(user)} ${userSub(user)}`.toLowerCase();
    return term.includes(keyword.toLowerCase());
  });

  const selectedCount = state.selectedShareUsers.size;

  body.innerHTML = `
    <div class="aift-share-search">
      ${svg("search")}
      <input placeholder="Search people you follow" value="${esc(keyword)}" oninput="AIFTFeed.filterShareUsers('${esc(postId)}', this.value)" />
    </div>

    <div class="aift-share-grid">
      ${
        users.length
          ? users.map(user => renderShareUser(postId, user)).join("")
          : `<div class="aift-feed-empty flat">No users found.</div>`
      }
    </div>

    <div class="aift-share-actions">
      <button onclick="AIFTFeed.copyPostLink('${esc(postId)}')">${svg("copy")} Copy link</button>
      <button onclick="AIFTFeed.openRepost('${esc(postId)}')">${svg("repost")} Repost</button>
      <button onclick="AIFTFeed.nativeShare('${esc(postId)}')">${svg("share")} More</button>
    </div>

    <button
      id="aiftSendSelectedBtn"
      class="aift-primary-btn wide"
      ${selectedCount ? "" : "disabled"}
      onclick="AIFTFeed.sendSelectedPost('${esc(postId)}')"
    >
      ${selectedCount ? `Share with ${selectedCount}` : "Share"}
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

  const selectedNames = userIds
    .map(id => {
      const user = state.followingUsers.find(u => String(u._id) === String(id));
      return user ? userName(user) : "";
    })
    .filter(Boolean);

  const btn = document.getElementById("aiftSendSelectedBtn");

  if(btn){
    btn.disabled = true;
    btn.textContent = "Sharing...";
  }

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
    closeReelPanel();

    const namesText =
      selectedNames.length === 1
        ? selectedNames[0]
        : selectedNames.length === 2
          ? `${selectedNames[0]} and ${selectedNames[1]}`
          : `${selectedNames[0]} and ${selectedNames.length - 1} others`;

    toast(`Shared with ${namesText}.`);
  } catch (err) {
    toast(err.message, "error");

    if(btn){
      btn.disabled = false;
      btn.textContent = "Share";
    }
  }
}

  async function copyPostLink(postId) {
  if(!requireMember("share posts")) return;
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
  if(!requireMember("share posts")) return;
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

    if (count) count.textContent = formatCount(sharesCount || 0);
    if (wrap) wrap.classList.toggle("aift-hidden", !sharesCount);
  }

  function updateViewCount(postId, viewsCount) {
    const value = Math.max(Number(viewsCount || 0), 0);
    const feedCount = document.getElementById(`aift-views-count-${safeId(postId)}`);
    const reelCount = document.getElementById(`aift-reel-view-count-${safeId(postId)}`);

    if(feedCount) feedCount.textContent = formatCount(value);
    if(reelCount) reelCount.textContent = formatCount(value);

    const reelWrap = reelCount?.closest(".aift-reel-view-count");
    if(reelWrap){
      reelWrap.setAttribute("aria-label", `${formatCount(value)} views`);
    }
  }

  function updateCommentCount(postId) {
    const post = getPost(postId);
    const count = document.getElementById(`aift-comments-count-${safeId(postId)}`);
    if (post && count) count.textContent = formatCount(countComments(post));
  }

  function getPostLink(postId) {
    return `${location.origin}${location.pathname}?post=${encodeURIComponent(postId)}`;
  }

 function openRepost(postId) {
  if(!requireMember("repost")) return;
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
    const owner = isMine(author._id);
    const admin = isAdmin();
    const followed = isFollowing(author);
    const requested = isFollowRequested(author);

    document.getElementById("aiftMenuBody").innerHTML = owner
      ? `
        <button class="aift-sheet-option" onclick="AIFTFeed.openPostEditor('${esc(postId)}')">${svg("edit")}<span>Edit post</span></button>
        <button class="aift-sheet-option" onclick="AIFTFeed.copyPostLink('${esc(postId)}')">${svg("copy")}<span>Copy post link</span></button>
        <button class="aift-sheet-option" onclick="AIFTFeed.savePost('${esc(postId)}')">${svg("save")}<span>Save post</span></button>
        <button class="aift-sheet-option danger" onclick="AIFTFeed.deletePost('${esc(postId)}')">${svg("trash")}<span>Delete post</span></button>
      `
      : admin
        ? `
          <button class="aift-sheet-option" onclick="AIFTFeed.openPostEditor('${esc(postId)}')">${svg("edit")}<span>Edit post</span></button>
          <button class="aift-sheet-option" onclick="AIFTFeed.copyPostLink('${esc(postId)}')">${svg("copy")}<span>Copy post link</span></button>
          <button class="aift-sheet-option" onclick="AIFTFeed.visitProfile('${esc(author._id)}')">${svg("info")}<span>About this account</span></button>
          <button class="aift-sheet-option danger" onclick="AIFTFeed.deletePost('${esc(postId)}')">${svg("trash")}<span>Delete post</span></button>
        `
        : `
          ${followed
            ? `<button class="aift-sheet-option" onclick="AIFTFeed.unfollowFromPost('${esc(postId)}','${esc(author._id)}')">${svg("userMinus")}<span>Unfollow</span></button>`
            : requested
              ? `<button class="aift-sheet-option" onclick="AIFTFeed.unfollowFromPost('${esc(postId)}','${esc(author._id)}')">${svg("close")}<span>Cancel follow request</span></button>`
              : ""
          }
          <button class="aift-sheet-option" onclick="AIFTFeed.savePost('${esc(postId)}')">${svg("save")}<span>Save post</span></button>
          <button class="aift-sheet-option" onclick="AIFTFeed.notInterested('${esc(postId)}')">${svg("close")}<span>Not interested</span></button>
          <button class="aift-sheet-option" onclick="AIFTFeed.visitProfile('${esc(author._id)}')">${svg("info")}<span>About this account</span></button>
          <button class="aift-sheet-option danger" onclick="AIFTFeed.reportPost('${esc(postId)}')">${svg("flag")}<span>Report</span></button>
        `;

    openOverlay("aiftMenuSheet");
  }

  function openPostEditor(postId) {
    const post = getPost(postId);
    if (!post) return;

    const body = document.getElementById("aiftMenuBody");
    if (!body) return;

    body.innerHTML = `
      <div class="aift-owner-edit">
        <strong>Edit post</strong>
        <textarea id="aiftEditPostText" class="aift-repost-textarea" placeholder="Write your post...">${esc(post.text || "")}</textarea>
        <div class="aift-owner-edit-actions">
          <button class="aift-sheet-option" type="button" onclick="AIFTFeed.openPostMenu('${esc(postId)}')">${svg("close")}<span>Cancel</span></button>
          <button class="aift-primary-btn" type="button" onclick="AIFTFeed.submitPostEdit('${esc(postId)}')">Save changes</button>
        </div>
      </div>
    `;

    requestAnimationFrame(() => {
      const input = document.getElementById("aiftEditPostText");
      input?.focus();
      if(input) input.setSelectionRange(input.value.length, input.value.length);
    });
  }

  async function submitPostEdit(postId) {
    const input = document.getElementById("aiftEditPostText");
    const text = input?.value.trim() || "";

    if(!text){
      toast("Post text cannot be empty.", "error");
      return;
    }

    const saveBtn = document.querySelector("#aiftMenuBody .aift-primary-btn");
    if(saveBtn){
      saveBtn.disabled = true;
      saveBtn.textContent = "Saving...";
    }

    try{
      const updated = await api(`${API}/api/posts/${postId}`, {
        method: "PATCH",
        headers: headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text })
      });

      const post = updated.post || updated;
      upsertPost(post);
      closeOverlays();
      toast("Post updated.");
    }catch(err){
      toast(err.message, "error");
      if(saveBtn){
        saveBtn.disabled = false;
        saveBtn.textContent = "Save changes";
      }
    }
  }

async function savePost(postId) {
  if(!requireMember("save posts")) return;
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
  if(!requireMember("follow people")) return;
  if (!userId || isMine(userId)) return;

  const selector = `[data-follow-user="${CSS.escape(String(userId))}"]`;
  const buttons = Array.from(document.querySelectorAll(selector));

  buttons.forEach(btn => {
    btn.disabled = true;
    btn.classList.add("is-loading");
  });

  try {
    const data = await api(`${API}/api/users/${userId}/follow`, {
      method: "PATCH",
      headers: headers()
    });

    const isNowFollowing = data.following === true;
    const isRequested = data.requested === true || data.status === "requested";

    const following = JSON.parse(localStorage.getItem("followingIds") || "[]");
    const nextFollowing = isNowFollowing
      ? Array.from(new Set([...following, userId]))
      : following.filter(id => String(id) !== String(userId));

    localStorage.setItem("followingIds", JSON.stringify(nextFollowing));

    if(state.me){
      const requests = (state.me.followRequestsSent || []).map(id => String(id?._id || id));
      state.me.followRequestsSent = isRequested
        ? Array.from(new Set([...requests, String(userId)]))
        : requests.filter(id => String(id) !== String(userId));

      const meFollowing = (state.me.following || []).map(id => String(id?._id || id));
      state.me.following = isNowFollowing
        ? Array.from(new Set([...meFollowing, String(userId)]))
        : meFollowing.filter(id => String(id) !== String(userId));
    }

    state.posts.forEach(post => {
      if (String(post.author?._id) === String(userId)) {
        post.author.isFollowing = isNowFollowing;
        post.author.followRequested = isRequested;
      }
    });

    document.querySelectorAll(`.aift-reel-follow-btn[data-follow-user="${CSS.escape(String(userId))}"]`).forEach(btn => {
      btn.disabled = false;
      btn.classList.remove("is-loading", "is-requested", "is-following");
      btn.classList.toggle("is-requested", isRequested);
      btn.classList.toggle("is-following", isNowFollowing);
      btn.textContent = isNowFollowing ? "Following" : isRequested ? "Requested" : "Follow";
    });

    if(data.status === "requested"){
      buttons.forEach(btn => {
        if(!btn.classList.contains("aift-reel-follow-btn")){
          btn.classList.remove("is-loading");
          btn.classList.add("is-follow-animated");
          btn.innerHTML = '<span class="aift-follow-check" aria-hidden="true">✓</span><span>Requested</span>';
        }
      });
      await new Promise(resolve => setTimeout(resolve, 520));
    }

    renderFeedOnly();

    if(data.status === "requested"){
      toast("Follow request sent.");
    }else if(data.status === "request_cancelled"){
      toast("Follow request cancelled.");
    }else if(data.status === "unfollowed"){
      toast("You unfollowed this profile.");
    }

    return data;
  } catch (err) {
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove("is-loading");
    });
    toast(err.message, "error");
    return null;
  }
}

async function unfollowFromPost(postId, userId){
  const data = await toggleFollow(userId);
  if(!data) return;
  closeOverlays();
}

async function visitProfile(userId) {
  saveFeedScroll(state.activePostId || "");
  if(!requireMember("view full profiles")) return;
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

let aiftLockedScrollY = 0;

function lockFeedScroll(){
  if(!isMobileNow()) return;
  if(document.body.classList.contains("aift-sheet-open")) return;

  aiftLockedScrollY =
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop ||
    0;

  document.documentElement.style.scrollBehavior = "auto";
  document.body.style.scrollBehavior = "auto";

  document.documentElement.classList.add("aift-sheet-open");
  document.body.classList.add("aift-sheet-open");

  document.body.style.position = "fixed";
  document.body.style.top = `-${aiftLockedScrollY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
}

function unlockFeedScroll(){
  if(!document.body.classList.contains("aift-sheet-open")) return;

  const topValue = document.body.style.top || "0";
  const savedY = Math.abs(parseInt(topValue, 10)) || aiftLockedScrollY || 0;

  document.documentElement.classList.remove("aift-sheet-open");
  document.body.classList.remove("aift-sheet-open");

  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";

  window.scrollTo({
    top: savedY,
    left: 0,
    behavior: "instant"
  });

  requestAnimationFrame(() => {
    window.scrollTo(0, savedY);
  });
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

  lockFeedScroll();
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

  unlockFeedScroll();

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
        if(state.me && payload.targetId){
          const requests = (state.me.followRequestsSent || []).map(id => String(id?._id || id));
          state.me.followRequestsSent = payload.requested
            ? Array.from(new Set([...requests, String(payload.targetId)]))
            : requests.filter(id => String(id) !== String(payload.targetId));

          const following = (state.me.following || []).map(id => String(id?._id || id));
          state.me.following = payload.following
            ? Array.from(new Set([...following, String(payload.targetId)]))
            : following.filter(id => String(id) !== String(payload.targetId));
        }

        state.posts.forEach(post => {
          if (String(post.author?._id) === String(payload.targetId)) {
            post.author.isFollowing = payload.following === true;
            post.author.followRequested = payload.requested === true;
          }
        });

        document.querySelectorAll(`.aift-reel-follow-btn[data-follow-user="${CSS.escape(String(payload.targetId || ""))}"]`).forEach(btn => {
          btn.classList.toggle("is-following", payload.following === true);
          btn.classList.toggle("is-requested", payload.requested === true);
          btn.textContent = payload.following ? "Following" : payload.requested ? "Requested" : "Follow";
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
    uploadBuild: "20260919-r2-multipart-3",
    mount,
    loadMore,
    createPost,
    uploadPostMediaDirect,
    publishUploadedPost,
    getPostMediaType,
    previewComposerMedia,
    renderVideoPreview,
    togglePreviewVideo,
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
    toggleReelSound,
handleReelLike,
handleReelSave,
openReelShare,
openReelComments,
    saveReelPosition,
restoreReelPosition,

openReplyMenu,
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
    openPostEditor,
    submitPostEdit,
    removeComposerMedia,
    savePost,
    openReelMode,
    openReelComments,
submitReelComment,
handleReelCommentKey,
    

openReelMoreOptions,
closeReelPanel,
handleReelLike,
handleReelSave,
    showReelHeart,
setReelKeyboard,
openReelCommentMenu,


    notInterested,
    reportPost,
    openCommentMenu,
editComment,
reportComment,
hideComment,
copyCommentLink,
    sendCommentOwner,
    deletePost,
    toggleFollow,
    unfollowFromPost,
    openReelMode,
closeReelMode,
handleReelScreenTap,
setAllVideoMuted,
    handleFeedVideoTap,
    retryVideoSource,
toggleFeedVideoSound,
    handlePostMediaTap,
    
    expandPostText,
    collapsePostText,
    visitProfile,
    saveFeedScroll,
restoreFeedScroll,
    closeOverlays,
    openFamily,
    dismissFamilyCard,
    refreshPersonalizedFeed
  };
})();
document.addEventListener("click", (e) => {
  const text = e.target.closest(".aift-post-text.is-collapsed");
  if(!text) return;

  text.classList.remove("is-collapsed");
});

window.AIFTFeed = AIFTFeed;

(function loadAiftGlobalCalls(){if(window.__aiftGlobalCalls||/\/messages\.html$/i.test(location.pathname))return;const script=document.createElement("script");script.src="aift-global-calls.js";document.head.appendChild(script);}());
