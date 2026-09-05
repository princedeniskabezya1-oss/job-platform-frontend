(function(){
  let lastScroll = 0;
  let ticking = false;

  const FALLBACK_AVATAR =
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  function getToken(){
    return (
      localStorage.getItem("schoolToken") ||
      localStorage.getItem("teacherToken") ||
      localStorage.getItem("studentToken") ||
      localStorage.getItem("adminToken") ||
      localStorage.getItem("employerToken") ||
      localStorage.getItem("talentToken") ||
      localStorage.getItem("agentToken") ||
      localStorage.getItem("token")
    );
  }

  function setMobileAvatar(){
    const img =
      document.getElementById("topAvatar") ||
      document.getElementById("profileAvatar");

    const src =
      img?.src ||
      localStorage.getItem("profileImage") ||
      FALLBACK_AVATAR;

    document.documentElement.style.setProperty(
      "--mobile-avatar",
      `url("${src}")`
    );
  }

  function canonicalNavigationMarkup(){
    return `
      <a href="home.html" aria-label="Home">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path></svg>
        <span>Home</span>
      </a>
      <a href="network.html" aria-label="Network">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><path d="M20 8v6"></path><path d="M23 11h-6"></path></svg>
        <span>Network</span>
      </a>
      <button type="button" class="mobile-create" onclick="openMobileComposer(event)" aria-label="Create post">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>
        <span>Post</span>
      </button>
      <a href="jobs.html" aria-label="Jobs">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
        <span>Jobs</span>
      </a>
      <a href="messages.html" aria-label="Messages">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <span>Messages</span>
      </a>`;
  }

  function installCanonicalNavigation(){
    const candidates=Array.from(document.querySelectorAll(".mobile-nav,.jobs-bottom-bar,.shared-mobile-nav"));
    if(!candidates.length)return;
    const nav=candidates[0];
    candidates.slice(1).forEach(item=>item.remove());
    nav.className="mobile-nav";
    nav.setAttribute("aria-label","Primary mobile navigation");
    nav.innerHTML=canonicalNavigationMarkup();
  }

  function installCanonicalStyles(){
    if(document.getElementById("aift-canonical-mobile-nav-style"))return;
    const style=document.createElement("style");
    style.id="aift-canonical-mobile-nav-style";
    style.textContent=`
      @media(min-width:761px){.mobile-nav{display:none!important}}
      @media(max-width:760px){
        body{padding-bottom:calc(54px + env(safe-area-inset-bottom,0px))!important}
        .mobile-nav{position:fixed!important;left:0!important;right:0!important;bottom:0!important;width:100%!important;height:calc(50px + env(safe-area-inset-bottom,0px))!important;min-height:50px!important;padding:0 0 env(safe-area-inset-bottom,0px)!important;margin:0!important;z-index:4000!important;display:grid!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;overflow:visible!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;background:linear-gradient(to bottom,rgba(255,255,255,.98),rgba(255,255,255,.88) 72%,rgba(255,255,255,.45))!important;-webkit-backdrop-filter:blur(14px)!important;backdrop-filter:blur(14px)!important;border:0!important;border-top:1px solid rgba(216,216,216,.65)!important;border-radius:0!important;box-shadow:none!important;transform:none!important}
        .mobile-nav a,.mobile-nav button{position:relative!important;width:100%!important;height:50px!important;min-width:0!important;margin:0!important;padding:1px 0!important;border:0!important;border-radius:0!important;background:transparent!important;color:#777!important;text-decoration:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:0!important;font:500 9px/1 Arial,sans-serif!important;box-shadow:none!important;transform:none!important}
        .mobile-nav a.active,.mobile-nav button.active{color:#111!important;background:transparent!important}
        .mobile-nav svg{display:block!important;width:19px!important;height:19px!important;margin:0!important;padding:0!important;stroke:currentColor!important;fill:none!important;stroke-width:2.4!important}
        .mobile-nav .mobile-create svg{width:21px!important;height:21px!important;padding:1px!important;border-radius:7px!important;background:#8a8a8a!important;stroke:#fff!important}
        .mobile-nav .mobile-create span{display:none!important}
        .mobile-nav .mobile-create::after{content:"Post"!important;color:#777!important;font:500 9px/1 Arial,sans-serif!important}
        .mobile-nav.is-pulled-down{transform:none!important;opacity:1!important;pointer-events:auto!important}
      }
    `;
    document.head.appendChild(style);
  }

  function updateActiveMobileNav(){
    const file = location.pathname.split("/").pop() || "home.html";

    document.querySelectorAll(".mobile-nav a,.mobile-nav button").forEach(item => {
      item.classList.remove("active");

      const href = item.getAttribute("href") || "";
      if(href && href.includes(file)){
        item.classList.add("active");
      }
    });
  }

  function handleScroll(){
    if(window.innerWidth > 760) return;

    const topbar = document.querySelector(".topbar");
    const nav = document.querySelector(".mobile-nav");
    if(!topbar || !nav) return;

    const current = Math.max(window.scrollY || 0, 0);
    const down = current > lastScroll + 4;
    const up = current < lastScroll - 4;

    topbar.classList.toggle("is-glass", current > 20);

    if(down && current > 650){
      topbar.classList.add("is-hidden");
      nav.classList.add("is-pulled-down");
    }

    if(up || current < 120){
      topbar.classList.remove("is-hidden");
      nav.classList.remove("is-pulled-down");
    }

    lastScroll = current;
  }

  function onScroll(){
    if(ticking) return;

    ticking = true;
    requestAnimationFrame(() => {
      handleScroll();
      ticking = false;
    });
  }

  window.openMobileComposer = window.openMobileComposer || function(event){
    event?.preventDefault?.();

    if(!getToken()){
      if(typeof window.showGuestGate === "function"){
        window.showGuestGate("create a post", false);
        return;
      }

      location.href = "login.html";
      return;
    }

    if(location.pathname.includes("home.html")){
      const triggers = [
        ".create-trigger",
        "#openComposerBtn",
        "[data-open-composer]",
        ".aift-composer-trigger"
      ];

      for(const selector of triggers){
        const btn = document.querySelector(selector);
        if(btn){
          btn.click();
          return;
        }
      }
    }

    location.href = "home.html?compose=1";
  };

  document.addEventListener("DOMContentLoaded", () => {
    installCanonicalNavigation();
    installCanonicalStyles();
    setMobileAvatar();
    updateActiveMobileNav();
    handleScroll();

    window.addEventListener("scroll", onScroll, { passive:true });

    setTimeout(setMobileAvatar, 700);
    setTimeout(setMobileAvatar, 1600);
  });
})();

(function loadAiftGlobalCalls(){if(window.__aiftGlobalCalls||/\/messages\.html$/i.test(location.pathname))return;const script=document.createElement("script");script.src="aift-global-calls.js?v=20260904-nav-badges-1";document.head.appendChild(script);}());
