(function(){
  let lastScroll = 0;
  let ticking = false;
  const nestedScrollPositions=new WeakMap();
  const initialFile=location.pathname.split("/").pop()||"home.html";
  const embeddedShell=new URLSearchParams(location.search).get("aiftShell")==="1";

  if(embeddedShell)document.documentElement.classList.add("aift-shell-embedded");

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
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.3 2.4 10.2a1.1 1.1 0 0 0-.4.85v9.15c0 .99.81 1.8 1.8 1.8h5.1v-7.1h6.2V22h5.1c.99 0 1.8-.81 1.8-1.8v-9.15c0-.33-.15-.64-.4-.85L12 2.3Z"></path></svg>
        <span>Home</span>
      </a>
      <a href="jobs.html" aria-label="Jobs">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M8.4 4.1c0-1.16.94-2.1 2.1-2.1h3c1.16 0 2.1.94 2.1 2.1V6h3.6A2.8 2.8 0 0 1 22 8.8v2.55a25.5 25.5 0 0 1-8.7 1.61v-.86a1.3 1.3 0 0 0-2.6 0v.86A25.5 25.5 0 0 1 2 11.35V8.8A2.8 2.8 0 0 1 4.8 6h3.6V4.1Zm2.1 0V6h3V4.1h-3ZM2 13.57V19.2A2.8 2.8 0 0 0 4.8 22h14.4a2.8 2.8 0 0 0 2.8-2.8v-5.63a28 28 0 0 1-8.7 1.49v.84a1.3 1.3 0 0 1-2.6 0v-.84A28 28 0 0 1 2 13.57Z" clip-rule="evenodd"></path></svg>
        <span>Jobs</span>
      </a>
      <a href="network.html" aria-label="Network">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.2 11.1a4.55 4.55 0 1 0 0-9.1 4.55 4.55 0 0 0 0 9.1ZM1 20.25C1 15.94 4.21 13 8.2 13s7.2 2.94 7.2 7.25c0 .97-.78 1.75-1.75 1.75H2.75C1.78 22 1 21.22 1 20.25ZM17.4 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-.79 2.06c.51-.12 1.04-.18 1.59-.18 3.2 0 5.8 2.34 5.8 5.77 0 .78-.63 1.42-1.42 1.42h-5.1c.02-.2.02-.4.02-.61 0-2.5-.93-4.68-2.49-6.28.51-.07 1.04-.12 1.6-.12Z"></path></svg>
        <span>Network</span>
      </a>
      <a href="messages.html" aria-label="Messages">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C5.92 2 1 6.25 1 11.5c0 2.96 1.58 5.61 4.05 7.35L4.1 22l3.76-1.64c1.29.42 2.68.64 4.14.64 6.08 0 11-4.25 11-9.5S18.08 2 12 2Zm-5 8.15h10a1.1 1.1 0 1 1 0 2.2H7a1.1 1.1 0 1 1 0-2.2Zm0-3.6h7a1.1 1.1 0 1 1 0 2.2H7a1.1 1.1 0 1 1 0-2.2Zm0 7.2h6a1.1 1.1 0 1 1 0 2.2H7a1.1 1.1 0 1 1 0-2.2Z"></path></svg>
        <span>Messages</span>
      </a>
      <button type="button" class="aift-mobile-nav__start-post" onclick="openMobileComposer(event)" aria-label="Start a post">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path fill-rule="evenodd" d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5Zm7 4.25c.69 0 1.25.56 1.25 1.25v3.25h3.25a1.25 1.25 0 1 1 0 2.5h-3.25v3.25a1.25 1.25 0 1 1-2.5 0v-3.25H7.5a1.25 1.25 0 1 1 0-2.5h3.25V7.5c0-.69.56-1.25 1.25-1.25Z" clip-rule="evenodd"></path></svg>
        <span>Start a post</span>
      </button>`;
  }

  function installCanonicalNavigation(){
    const candidates=Array.from(document.querySelectorAll(".aift-mobile-nav,.mobile-nav,.jobs-bottom-bar,.shared-mobile-nav"));
    const file=location.pathname.split("/").pop()||"home.html";
    if(!candidates.length&&!new Set(["home.html","network.html","jobs.html","notifications.html"]).has(file))return;
    const nav=candidates[0]||document.body.appendChild(document.createElement("nav"));
    candidates.slice(1).forEach(item=>item.remove());
    nav.className="aift-mobile-nav";
    nav.setAttribute("aria-label","Primary mobile navigation");
    nav.innerHTML=canonicalNavigationMarkup();
  }

  function matchDeviceBottomSurface(){
    let theme=document.querySelector('meta[name="theme-color"]');
    if(!theme){theme=document.createElement("meta");theme.name="theme-color";document.head.appendChild(theme);}
    theme.content="#ffffff";
    let scheme=document.querySelector('meta[name="color-scheme"]');
    if(!scheme){scheme=document.createElement("meta");scheme.name="color-scheme";document.head.appendChild(scheme);}
    scheme.content="light";
  }

  function updateActiveMobileNav(){
    const file = location.pathname.split("/").pop() || "home.html";

    document.querySelectorAll(".aift-mobile-nav a,.aift-mobile-nav button").forEach(item => {
      item.classList.remove("active");

      const href = item.getAttribute("href") || "";
      if(href && href.includes(file)){
        item.classList.add("active");
      }
    });
  }

  function shellTarget(url){
    const file=url.pathname.split("/").pop()||"home.html";
    return new Set(["home.html","network.html","jobs.html","messages.html"]).has(file);
  }

  function shellFrameBounds(){
    const topbar=document.querySelector(".topbar");
    const nav=document.querySelector(".aift-mobile-nav");
    topbar?.classList.remove("is-hidden");
    nav?.classList.remove("aift-mobile-nav--hidden");
    return {
      top:Math.max(0,Math.round(topbar?.getBoundingClientRect().bottom||0)),
      bottom:Math.max(0,Math.round(innerHeight-(nav?.getBoundingClientRect().top||innerHeight)))
    };
  }

  function closeShellSection(){
    document.querySelector(".aift-section-frame")?.remove();
    document.querySelector(".aift-section-loading")?.remove();
    document.body.classList.remove("aift-shell-host");
  }

  function openShellSection(url,{push=true}={}){
    if(innerWidth>760||!shellTarget(url)){
      location.assign(url.href);
      return;
    }

    const file=url.pathname.split("/").pop()||"home.html";
    document.querySelectorAll(".aift-mobile-nav a,.aift-mobile-nav button").forEach(item=>{
      const href=item.getAttribute("href");
      item.classList.toggle("active",Boolean(href&&new URL(href,location.href).pathname.endsWith(file)));
    });

    if(file===initialFile){
      closeShellSection();
      if(push)history.pushState({aiftShell:file},"",url.href);
      return;
    }

    const bounds=shellFrameBounds();
    let frame=document.querySelector(".aift-section-frame");
    let loading=document.querySelector(".aift-section-loading");
    if(!frame){
      frame=document.createElement("iframe");
      frame.className="aift-section-frame";
      frame.title="AIFT section";
      frame.setAttribute("allow","camera; microphone; autoplay; display-capture");
      document.body.appendChild(frame);
    }
    if(!loading){
      loading=document.createElement("div");
      loading.className="aift-section-loading";
      loading.innerHTML='<div class="aift-content-skeleton" role="status" aria-label="Loading section"><span></span><span></span><span></span></div>';
      document.body.appendChild(loading);
    }
    [frame,loading].forEach(element=>{
      element.style.top=`${bounds.top}px`;
      element.style.bottom=`${bounds.bottom}px`;
    });
    document.body.classList.add("aift-shell-host");
    frame.classList.remove("is-ready");
    loading.hidden=false;
    const embeddedUrl=new URL(url.href);
    embeddedUrl.searchParams.set("aiftShell","1");
    frame.onload=()=>{
      frame.classList.add("is-ready");
      loading.hidden=true;
    };
    frame.src=embeddedUrl.href;
    if(push)history.pushState({aiftShell:file},"",url.href);
  }

  function prepareFastNavigation(){
    const nav=document.querySelector(".aift-mobile-nav");
    if(!nav)return;

    nav.querySelectorAll("a[href]").forEach(anchor=>{
      const url=new URL(anchor.href,location.href);
      if(url.origin!==location.origin)return;
      const preload=document.createElement("link");
      preload.rel="prefetch";
      preload.href=url.href;
      document.head.appendChild(preload);
    });

    nav.addEventListener("click",event=>{
      const anchor=event.target.closest("a[href]");
      if(!anchor||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      const url=new URL(anchor.href,location.href);
      if(url.origin!==location.origin||url.href===location.href)return;
      event.preventDefault();
      nav.querySelectorAll("a,button").forEach(item=>item.classList.toggle("active",item===anchor));
      nav.classList.remove("aift-mobile-nav--hidden");
      requestAnimationFrame(()=>openShellSection(url));
    });

    addEventListener("popstate",()=>{
      const url=new URL(location.href);
      if(shellTarget(url))openShellSection(url,{push:false});
    });

    addEventListener("resize",()=>{
      const frame=document.querySelector(".aift-section-frame");
      const loading=document.querySelector(".aift-section-loading");
      if(!frame&&!loading)return;
      const bounds=shellFrameBounds();
      [frame,loading].filter(Boolean).forEach(element=>{
        element.style.top=`${bounds.top}px`;
        element.style.bottom=`${bounds.bottom}px`;
      });
    },{passive:true});
  }

  function handleScroll(){
    if(window.innerWidth > 760) return;

    const topbar = document.querySelector(".topbar");
    const nav = document.querySelector(".aift-mobile-nav");
    if(!topbar || !nav) return;

    const current = Math.max(window.scrollY || 0, 0);
    const down = current > lastScroll + 4;
    const up = current < lastScroll - 4;

    topbar.classList.toggle("is-glass", current > 20);

    if(down && current > 8){
      topbar.classList.add("is-hidden");
      nav.classList.add("aift-mobile-nav--hidden");
    }

    if(up || current <= 8){
      topbar.classList.remove("is-hidden");
      nav.classList.remove("aift-mobile-nav--hidden");
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

  function onNestedScroll(event){
    if(window.innerWidth>760||event.target===document)return;
    const target=event.target;
    if(!(target instanceof Element))return;
    const current=Math.max(Number(target.scrollTop||0),0),previous=nestedScrollPositions.get(target)??current;
    nestedScrollPositions.set(target,current);
    const nav=document.querySelector(".aift-mobile-nav");
    if(!nav)return;
    if(current>previous+2&&current>8)nav.classList.add("aift-mobile-nav--hidden");
    if(current<previous-2||current<=8)nav.classList.remove("aift-mobile-nav--hidden");
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

    if(initialFile==="home.html"){
      closeShellSection();
      history.pushState({aiftShell:"home.html"},"",new URL("home.html",location.href).href);
      updateActiveMobileNav();
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

    openShellSection(new URL("home.html?compose=1",location.href));
  };

  document.addEventListener("DOMContentLoaded", () => {
    if(embeddedShell){
      document.body.classList.add("aift-shell-embedded-body");
      return;
    }
    installCanonicalNavigation();
    document.body.classList.add("aift-mobile-nav-page");
    matchDeviceBottomSurface();
    setMobileAvatar();
    updateActiveMobileNav();
    prepareFastNavigation();
    handleScroll();

    window.addEventListener("scroll", onScroll, { passive:true });
    document.addEventListener("scroll",onNestedScroll,{passive:true,capture:true});

    setTimeout(setMobileAvatar, 700);
    setTimeout(setMobileAvatar, 1600);
  });
})();

(function loadAiftGlobalCalls(){if(window.__aiftGlobalCalls||/\/messages\.html$/i.test(location.pathname))return;const script=document.createElement("script");script.src="aift-global-calls.js?v=20260904-nav-badges-1";document.head.appendChild(script);}());
