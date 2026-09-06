(function(){
  "use strict";

  if(window.__aiftNavBadgesLoaded)return;
  window.__aiftNavBadgesLoaded=true;

  const API="https://backend-1-9b6f.onrender.com";
  const COUNT_KEYS={network:"connections",jobs:"jobs",messages:"messages",notifications:"notifications"};
  let refreshTimer=null;

  function token(){
    const role=String(localStorage.getItem("role")||"").toLowerCase();
    const keys=[role?`${role}Token`:"","studentToken","teacherToken","schoolToken","employerToken","familyToken","agentToken","talentToken","adminToken","token"];
    for(const key of keys){
      if(!key)continue;
      const value=localStorage.getItem(key)||sessionStorage.getItem(key);
      if(value)return value;
    }
    return"";
  }

  function categoryFor(element){
    const href=String(element.getAttribute("href")||"").toLowerCase();
    const action=String(element.getAttribute("onclick")||"").toLowerCase();
    if(/(?:^|\/)network\.html(?:[?#]|$)/.test(href)||action.includes("gonetwork"))return"network";
    if(/(?:^|\/)jobs\.html(?:[?#]|$)/.test(href)||action.includes("gojobs"))return"jobs";
    if(/(?:^|\/)messages\.html(?:[?#]|$)/.test(href)||action.includes("gomessages"))return"messages";
    if(/(?:^|\/)notifications\.html(?:[?#]|$)/.test(href)||action.includes("gonotifications"))return"notifications";
    return"";
  }

  function badgeFor(element,category){
    let badge=element.querySelector(".aift-nav-count-badge");
    if(!badge&&category==="notifications")badge=element.querySelector(".nav-badge,#notificationBadge");
    if(!badge){
      badge=document.createElement("span");
      badge.classList.add("hidden");
      element.appendChild(badge);
    }
    badge.classList.add("aift-nav-count-badge");
    badge.dataset.navBadge=category;
    badge.setAttribute("aria-hidden","true");
    return badge;
  }

  function decorate(){
    document.querySelectorAll("nav a,nav button,.top-nav a,.top-nav button,.jobs-nav a,.jobs-nav button").forEach(element=>{
      const category=categoryFor(element);
      if(!category)return;
      element.dataset.navCountTarget=category;
      badgeFor(element,category);
    });
  }

  function paint(counts={}){
    decorate();
    document.querySelectorAll("[data-nav-count-target]").forEach(element=>{
      const category=element.dataset.navCountTarget;
      const count=Math.max(0,Number(counts[COUNT_KEYS[category]]||0));
      const badge=badgeFor(element,category);
      badge.textContent=count>99?"99+":String(count);
      badge.dataset.navBadgeReady="true";
      badge.classList.toggle("hidden",count===0);
      badge.setAttribute("aria-label",count?`${count} new ${category}`:"");
    });
  }

  async function request(path,options={}){
    const authToken=token();
    if(!authToken)throw new Error("No active session");
    const response=await fetch(API+path,{...options,cache:"no-store",headers:{Authorization:`Bearer ${authToken}`,...(options.headers||{})}});
    if(!response.ok)throw new Error(`Navigation count request failed (${response.status})`);
    return response.json();
  }

  async function markCurrentSectionViewed(){
    const page=(location.pathname.split("/").pop()||"").toLowerCase();
    const category=page==="jobs.html"?"jobs":page==="network.html"?"network":"";
    if(!category)return;
    await request(`/api/notifications/navigation-view/${category}`,{method:"PATCH"});
  }

  async function refresh(){
    if(!token()){paint({});return;}
    try{paint(await request("/api/notifications/navigation-counts"));}
    catch(error){console.warn("AIFT navigation badges unavailable:",error.message);}
  }

  function scheduleRefresh(delay=120){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(refresh,delay);
  }

  function connectRealtime(attempt=0){
    if(window.__aiftGlobalSocket)return;
    if(window.__aiftGlobalCalls&&attempt<12){setTimeout(()=>connectRealtime(attempt+1),250);return;}
    if(typeof window.io!=="function"||!token())return;
    const socket=window.io(API,{auth:{token:token()},transports:["websocket","polling"]});
    socket.on("connect",()=>{try{const payload=JSON.parse(atob(token().split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));const userId=payload.id||payload._id||payload.userId;if(userId)socket.emit("join",{userId,token:token()});}catch{}});
    ["newNotification","notificationUpdated","notificationsRead","navigationCountsUpdated","newMessage","conversationRead"].forEach(eventName=>socket.on(eventName,()=>scheduleRefresh(40)));
  }

  async function initialize(){
    decorate();
    try{await markCurrentSectionViewed();}catch(error){console.warn("AIFT navigation view update unavailable:",error.message);}
    await refresh();
    window.setInterval(()=>{if(document.visibilityState==="visible")refresh();},20000);
    window.addEventListener("focus",()=>scheduleRefresh(40));
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")scheduleRefresh(40);});
    ["newNotification","notificationUpdated","notificationsRead","navigationCountsUpdated","newMessage","conversationRead"].forEach(name=>window.addEventListener(name,()=>scheduleRefresh()));
    connectRealtime();
  }

  const style=document.createElement("style");
  style.textContent=`
    [data-nav-count-target]{position:relative!important}
    .aift-nav-count-badge{position:absolute;z-index:8;top:2px;right:auto!important;left:calc(50% + 5px);min-width:18px;height:18px;padding:0 5px;border:2px solid #fff;border-radius:999px;background:#e11d2e;color:#fff;font:800 10px/14px Arial,sans-serif;letter-spacing:0;text-align:center;box-sizing:border-box;display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 1px 2px rgba(0,0,0,.18)}
    .aift-nav-count-badge.hidden{display:none!important}
    .aift-nav-count-badge:not([data-nav-badge-ready="true"]){display:none!important}
    .jobs-nav .aift-nav-count-badge{top:5px;left:31px}
    @media(max-width:760px){.aift-nav-count-badge{top:1px;left:calc(50% + 3px);min-width:17px;height:17px;padding:0 4px;font-size:9px}.jobs-nav .aift-nav-count-badge{top:1px;left:calc(50% + 3px)}}
  `;
  document.head.appendChild(style);

  window.AIFTNavBadges={refresh,scheduleRefresh};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initialize,{once:true});
  else initialize();
})();
