(function(){
  if(/Android/i.test(navigator.userAgent || "")){
    document.documentElement.classList.add("aift-android");
  }
  let lastScroll = 0;
  let ticking = false;
  let sectionLastScroll = 0;
  let sectionScrollTicking = false;
  let sectionChromeHidden = false;
  let composerChromeHidden = false;
  const nestedScrollPositions=new WeakMap();
  const initialFile=location.pathname.split("/").pop()||"home.html";
  const sectionDocument=document.documentElement.classList.contains("aift-section-document");
  const sectionTitles={"home.html":"AIFT | Home","network.html":"AIFT | Network","jobs.html":"AIFT | Jobs","notifications.html":"Notifications | AIFT"};
  const primaryNavPages=new Set(["home.html","network.html","jobs.html"]);

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
      <button type="button" class="mobile-create aift-mobile-nav__start-post" onclick="openMobileComposer(event)" aria-label="Create post">
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
    const candidates=Array.from(document.querySelectorAll(".aift-mobile-nav,.mobile-nav,.jobs-bottom-bar,.shared-mobile-nav,.learning-mobile-nav,.learning-bottom-nav,.learning-app-nav"));
    const file=location.pathname.split("/").pop()||"home.html";
    if(!primaryNavPages.has(file)&&file!=="mobile-shell.html"){
      document.querySelector(".aift-mobile-nav")?.remove();
      return;
    }
    const nav=document.querySelector(".aift-mobile-nav")||candidates[0]||document.body.appendChild(document.createElement("nav"));
    candidates.filter(item=>item!==nav).forEach(item=>item.remove());
    document.querySelectorAll(".learning-mobile-nav-spacer,.learning-bottom-nav-spacer,.learning-nav-spacer").forEach(item=>item.remove());
    nav.className="aift-mobile-nav";
    nav.setAttribute("aria-label","Primary mobile navigation");
    nav.innerHTML=canonicalNavigationMarkup();
  }

  function setDashboardNavigationHidden(hidden){
    const shouldHide=Boolean(hidden) || composerChromeHidden;
    document.body.classList.toggle("aift-employer-dashboard-active",shouldHide);
    document.querySelector(".aift-mobile-nav")?.classList.toggle("aift-mobile-nav--dashboard-hidden",shouldHide);
    document.body.style.setProperty("padding-bottom",shouldHide?"0px":"");
    if(parent!==window)parent.postMessage({type:"aift:dashboard-chrome",hidden:shouldHide},location.origin);
  }

  function setLearningNavigation(active){
    const shouldHide=Boolean(active);
    const nav=document.querySelector(".aift-mobile-nav");
    document.body.classList.toggle("aift-learning-page-active",shouldHide);
    nav?.classList.toggle("aift-mobile-nav--dashboard-hidden",shouldHide);
    document.body.style.setProperty("padding-bottom",shouldHide?"0px":"");
    if(parent!==window)parent.postMessage({type:"aift:learning-chrome",active:shouldHide},location.origin);
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

  function isShellSection(url){
    const file=url.pathname.split("/").pop()||"home.html";
    return new Set(["home.html","network.html","jobs.html","notifications.html"]).has(file);
  }

  function frameNeedsCleanChrome(frame){
    try{
      const file=frame.contentWindow.location.pathname.split("/").pop()||"";
      const chromeFreePages=new Set([
        "index.html",
        "login.html",
        "register.html",
        "account-access.html",
        "privacy-policy.html",
        "notifications.html",
        "careers.html",
        "contact.html",
        "public-profile.html",
        "agent-public-profile.html",
        "student-public-profile.html",
        "school-public-profile.html",
        "employer-public-profile.html"
      ]);
      const dashboards=new Set([
        "student.html",
        "teacher.html",
        "school.html",
        "employer.html",
        "talent.html",
        "agent.html",
        "admin.html",
        "learning-dashboard.html",
        "class-builder.html",
        "class-view.html"
      ]);
      return chromeFreePages.has(file)||dashboards.has(file);
    }catch(error){
      return false;
    }
  }

  function syncFrameNavigation(frame){
    if(!frame?.isConnected)return;
    setDashboardNavigationHidden(frameNeedsCleanChrome(frame));
  }

  function shellSectionUrl(){
    const params=new URLSearchParams(location.search);
    const requested=params.get("section");
    const section=new Set(["home","network","jobs","notifications"]).has(requested)?requested:"home";
    const target=new URL(`${section}.html`,location.href);
    if(section==="home"){
      target.searchParams.set("v","20260919-r2-multipart-3");
      if(params.get("compose")==="1")target.searchParams.set("compose","1");
    }
    return target;
  }

  function historyUrlForSection(file,url){
    if(initialFile!=="mobile-shell.html")return url.href;
    const shellUrl=new URL("mobile-shell.html",location.href);
    shellUrl.searchParams.set("section",file.replace(".html",""));
    if(file==="home.html"&&url.searchParams.get("compose")==="1")shellUrl.searchParams.set("compose","1");
    return shellUrl.href;
  }

  function sectionBounds({revealNavigation=false}={}){
    const nav=document.querySelector(".aift-mobile-nav");
    if(revealNavigation)nav?.classList.remove("aift-mobile-nav--hidden");
    return {top:0,bottom:0};
  }

  function sizeSectionElement(element,bounds){
    element.style.top=`${bounds.top}px`;
    element.style.bottom=`${bounds.bottom}px`;
    element.style.height="100%";
  }

  function closeSection(){
    composerChromeHidden=false;
    setDashboardNavigationHidden(false);
    document.querySelectorAll(".aift-section-view").forEach(frame=>{
      clearTimeout(frame.__aiftReadyTimer);
      frame.remove();
    });
    document.querySelector(".aift-section-wait")?.remove();
    document.body.classList.remove("aift-section-host");
    document.documentElement.classList.remove("aift-section-host");
    document.title=sectionTitles[initialFile]||document.title;
  }

  function activateSectionFrame(frame){
    if(!frame?.isConnected||!frame.classList.contains("is-pending"))return;
    clearTimeout(frame.__aiftReadyTimer);
    document.querySelectorAll(".aift-section-view").forEach(item=>{
      if(item!==frame){
        clearTimeout(item.__aiftReadyTimer);
        item.remove();
      }
    });
    frame.classList.remove("is-pending");
    frame.classList.add("is-current");
    const wait=document.querySelector(".aift-section-wait");
    if(wait)wait.hidden=true;
  }

  function showSection(url,{push=true}={}){
    if(innerWidth>760||!isShellSection(url)){
      location.assign(url.href);
      return;
    }
    const file=url.pathname.split("/").pop()||"home.html";
    if(primaryNavPages.has(file)) composerChromeHidden=false;
    setDashboardNavigationHidden(!primaryNavPages.has(file));
    document.title=sectionTitles[file]||document.title;
    document.querySelectorAll(".aift-mobile-nav a,.aift-mobile-nav button").forEach(item=>{
      const href=item.getAttribute("href");
      item.classList.toggle("active",Boolean(href&&new URL(href,location.href).pathname.endsWith(file)));
    });
    if(file===initialFile){
      closeSection();
      if(push)history.pushState({aiftSection:file},"",historyUrlForSection(file,url));
      return;
    }
    const bounds=sectionBounds({revealNavigation:true});
    document.querySelectorAll(".aift-section-view.is-pending").forEach(item=>{
      clearTimeout(item.__aiftReadyTimer);
      item.remove();
    });
    const frame=document.createElement("iframe");
    frame.className="aift-section-view is-pending";
    frame.title=`AIFT ${file.replace(".html","")}`;
    frame.setAttribute("scrolling","yes");
    document.body.appendChild(frame);
    let wait=document.querySelector(".aift-section-wait");
    if(!wait){
      wait=document.createElement("div");
      wait.className="aift-section-wait";
      wait.innerHTML='<span role="status" aria-label="Loading"></span>';
      document.body.appendChild(wait);
    }
    [frame,wait].forEach(element=>sizeSectionElement(element,bounds));
    document.body.classList.add("aift-section-host");
    document.documentElement.classList.add("aift-section-host");
    wait.hidden=false;
    const target=new URL(url.href);
    target.searchParams.set("aiftSection","1");
    if(file==="home.html")target.searchParams.set("v","20260919-r2-multipart-3");
    frame.addEventListener("load",()=>requestAnimationFrame(()=>{
      activateSectionFrame(frame);
      syncFrameNavigation(frame);
    }));
    frame.src=target.href;
    clearTimeout(frame.__aiftReadyTimer);
    frame.__aiftReadyTimer=setTimeout(()=>activateSectionFrame(frame),12000);
    if(push)history.pushState({aiftSection:file},"",historyUrlForSection(file,url));
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
      requestAnimationFrame(()=>isShellSection(url)?showSection(url):location.assign(url.href));
    });

    addEventListener("message",event=>{
      if(event.origin!==location.origin)return;
      if(event.data?.type==="aift:composer-chrome"){
        composerChromeHidden=Boolean(event.data.hidden);
        setDashboardNavigationHidden(composerChromeHidden);
        const bounds=sectionBounds();
        document.querySelectorAll(".aift-section-view,.aift-section-wait").forEach(element=>sizeSectionElement(element,bounds));
        return;
      }
      if(event.data?.type==="aift:dashboard-chrome"){
        setDashboardNavigationHidden(event.data.hidden);
        const bounds=sectionBounds();
        document.querySelectorAll(".aift-section-view,.aift-section-wait").forEach(element=>sizeSectionElement(element,bounds));
        return;
      }
      if(event.data?.type==="aift:section-scroll"){
        const frame=Array.from(document.querySelectorAll(".aift-section-view.is-current")).find(item=>item.contentWindow===event.source);
        if(!frame)return;
        if(frameNeedsCleanChrome(frame)){
          setDashboardNavigationHidden(true);
          return;
        }
        const nav=document.querySelector(".aift-mobile-nav");
        nav?.classList.toggle("aift-mobile-nav--hidden",composerChromeHidden);
        const bounds=sectionBounds();
        document.querySelectorAll(".aift-section-view,.aift-section-wait").forEach(element=>sizeSectionElement(element,bounds));
        return;
      }
      if(event.data?.type==="aift:learning-chrome"){
        const frame=Array.from(document.querySelectorAll(".aift-section-view.is-current")).find(item=>item.contentWindow===event.source);
        if(!frame)return;
        setLearningNavigation(Boolean(event.data.active));
        return;
      }
      if(event.data?.type!=="aift:section-ready")return;
      const frame=Array.from(document.querySelectorAll(".aift-section-view.is-pending")).find(item=>item.contentWindow===event.source);
      activateSectionFrame(frame);
    });

    addEventListener("popstate",()=>{
      const url=initialFile==="mobile-shell.html"?shellSectionUrl():new URL(location.href);
      if(isShellSection(url))showSection(url,{push:false});
    });

    addEventListener("resize",()=>{
      const frames=Array.from(document.querySelectorAll(".aift-section-view"));
      const wait=document.querySelector(".aift-section-wait");
      if(!frames.length&&!wait)return;
      const bounds=sectionBounds();
      [...frames,wait].filter(Boolean).forEach(element=>sizeSectionElement(element,bounds));
    },{passive:true});

  }

  function handleSectionDocumentScroll(){
    const root=document.scrollingElement||document.documentElement;
    const raw=Number(root.scrollTop||window.scrollY||0);
    const max=Math.max(0,Number(root.scrollHeight||0)-Number(root.clientHeight||innerHeight||0));
    if(raw<0||raw>max+1)return;
    const current=Math.max(raw,0);
    const goingDown=current>sectionLastScroll+3;
    const goingUp=current<sectionLastScroll-3;
    let nextHidden=sectionChromeHidden;

    if(goingDown&&current>12)nextHidden=true;
    if(goingUp||current<=8)nextHidden=false;

    if(initialFile==="home.html"||initialFile==="network.html"){
      const topbar=document.querySelector(".topbar");
      topbar?.classList.toggle("is-glass",current>20);
      topbar?.classList.toggle("is-hidden",nextHidden);
    }

    if(nextHidden!==sectionChromeHidden||current<=8){
      sectionChromeHidden=nextHidden;
      window.parent.postMessage({type:"aift:section-scroll",hidden:false},location.origin);
    }
    sectionLastScroll=current;
  }

  function installSectionDocumentScroll(){
    if(!sectionDocument||innerWidth>760)return;
    sectionLastScroll=Math.max(Number((document.scrollingElement||document.documentElement).scrollTop||0),0);
    addEventListener("scroll",()=>{
      if(sectionScrollTicking)return;
      sectionScrollTicking=true;
      requestAnimationFrame(()=>{
        handleSectionDocumentScroll();
        sectionScrollTicking=false;
      });
    },{passive:true});
    handleSectionDocumentScroll();
  }

  function handleScroll(){
    if(window.innerWidth > 760) return;

    const topbar = document.querySelector(".topbar");
    const nav = document.querySelector(".aift-mobile-nav");
    if(!topbar || !nav) return;

    const root=document.scrollingElement||document.documentElement;
    const raw=Number(window.scrollY||root.scrollTop||0);
    const max=Math.max(0,Number(root.scrollHeight||0)-Number(root.clientHeight||innerHeight||0));
    if(raw<0||raw>max+1)return;
    const current = Math.max(raw, 0);
    const down = current > lastScroll + 4;
    const up = current < lastScroll - 4;

    topbar.classList.toggle("is-glass", current > 20);

    if(down && current > 8) topbar.classList.add("is-hidden");
    if(up || current <= 8) topbar.classList.remove("is-hidden");

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
    const raw=Number(target.scrollTop||0),max=Math.max(0,Number(target.scrollHeight||0)-Number(target.clientHeight||0));
    if(raw<0||raw>max+1)return;
    const current=Math.max(raw,0),previous=nestedScrollPositions.get(target)??current;
    nestedScrollPositions.set(target,current);
    const nav=document.querySelector(".aift-mobile-nav");
    if(!nav)return;
    if(!primaryNavPages.has(initialFile)&&initialFile!=="mobile-shell.html")return;
    if(!composerChromeHidden)nav.classList.remove("aift-mobile-nav--hidden");
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
      closeSection();
      history.pushState({aiftSection:"home.html"},"",new URL("home.html",location.href).href);
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

    if(initialFile==="mobile-shell.html"){
      composerChromeHidden = true;
      setDashboardNavigationHidden(true);

      const homeFrame = Array.from(document.querySelectorAll(".aift-section-view.is-current"))
        .find(frame => {
          try{
            return (frame.contentWindow.location.pathname.split("/").pop() || "") === "home.html";
          }catch{
            return false;
          }
        });

      try{
        if(typeof homeFrame?.contentWindow?.openMobileComposer === "function"){
          homeFrame.contentWindow.openMobileComposer();
          return;
        }
      }catch{}

      showSection(new URL("home.html?compose=1",location.href));
      return;
    }

    location.href = "home.html?compose=1";
  };

  document.addEventListener("DOMContentLoaded", () => {
    if(sectionDocument){
      setMobileAvatar();
      installSectionDocumentScroll();
      return;
    }
    installCanonicalNavigation();
    if(document.querySelector(".aift-mobile-nav"))document.body.classList.add("aift-mobile-nav-page");
    matchDeviceBottomSurface();
    setMobileAvatar();
    updateActiveMobileNav();
    prepareFastNavigation();
    if(initialFile==="mobile-shell.html")showSection(shellSectionUrl(),{push:false});
    handleScroll();

    window.addEventListener("scroll", onScroll, { passive:true });
    document.addEventListener("scroll",onNestedScroll,{passive:true,capture:true});

    setTimeout(setMobileAvatar, 700);
    setTimeout(setMobileAvatar, 1600);
  });
})();

(function loadAiftGlobalCalls(){if(document.documentElement.classList.contains("aift-section-document")||window.__aiftGlobalCalls||/\/messages\.html$/i.test(location.pathname))return;const script=document.createElement("script");script.src="aift-global-calls.js?v=20260904-nav-badges-1";document.head.appendChild(script);}());
