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
    setMobileAvatar();
    updateActiveMobileNav();
    handleScroll();

    window.addEventListener("scroll", onScroll, { passive:true });

    setTimeout(setMobileAvatar, 700);
    setTimeout(setMobileAvatar, 1600);
  });
})();

(function loadAiftGlobalCalls(){if(window.__aiftGlobalCalls||/\/messages\.html$/i.test(location.pathname))return;const script=document.createElement("script");script.src="aift-global-calls.js";document.head.appendChild(script);}());
