(() => {
  "use strict";

  const API = "https://backend-1-9b6f.onrender.com";
  const CLOSED = new Set(["approved","rejected","completed","cancelled","expired"]);
  const state = { cases:[], open:false, loading:false };

  function token(){ return localStorage.getItem("token") || localStorage.getItem("adminToken") || ""; }
  function role(){ return String(localStorage.getItem("role") || "").toLowerCase(); }
  function esc(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function title(value){ return String(value || "").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase()); }
  function fmt(value){ if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleString([], {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}); }
  function latestNote(item){ const history=Array.isArray(item?.history)?item.history:[];return item?.decisionNotes || history[history.length-1]?.note || ""; }

  async function api(path){
    const response=await fetch(API+path,{headers:{Authorization:`Bearer ${token()}`}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }

  function ensureStyle(){
    if(document.getElementById("aiftRequesterReviewStyle"))return;
    const style=document.createElement("style");style.id="aiftRequesterReviewStyle";style.textContent=`
      .aift-my-review-button{position:fixed;right:20px;bottom:20px;z-index:7800;min-height:42px;padding:0 14px;display:flex;align-items:center;gap:8px;border:1px solid #dbe3ee;border-radius:999px;background:#fff;color:#172033;box-shadow:0 10px 30px rgba(15,23,42,.14);font:700 12px/1 Inter,Arial,sans-serif;cursor:pointer}.aift-my-review-button:hover{border-color:#0a66c2}.aift-my-review-button .count{min-width:20px;height:20px;padding:0 6px;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#fff3cd;color:#8a5a00;font-size:10px}.aift-my-review-button .count.zero{background:#eef2f7;color:#64748b}
      .aift-my-review-panel{position:fixed;right:20px;bottom:72px;z-index:7900;width:min(420px,calc(100vw - 24px));max-height:min(680px,calc(100vh - 96px));display:flex;flex-direction:column;border:1px solid #dbe3ee;border-radius:16px;background:#fff;box-shadow:0 24px 64px rgba(15,23,42,.22);overflow:hidden;font-family:Inter,Arial,sans-serif}.aift-my-review-panel[hidden]{display:none!important}.aift-my-review-head{padding:15px 16px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid #e8edf3;background:#fbfcfe}.aift-my-review-head strong{display:block;color:#111827;font-size:14px}.aift-my-review-head span{display:block;margin-top:3px;color:#667085;font-size:11px}.aift-my-review-close{width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:#667085;font-size:20px;cursor:pointer}.aift-my-review-list{padding:10px;overflow:auto}.aift-my-review-empty{padding:26px 18px;text-align:center;color:#667085;font-size:12px;line-height:1.6}.aift-my-review-card{padding:13px;margin-bottom:9px;border:1px solid #e4e9f0;border-radius:12px;background:#fff}.aift-my-review-card:last-child{margin-bottom:0}.aift-my-review-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.aift-my-review-case{color:#0a66c2;font-size:10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800}.aift-my-review-title{margin-top:4px;color:#111827;font-size:12px;font-weight:800;line-height:1.4}.aift-my-review-type{margin-top:3px;color:#667085;font-size:10px}.aift-my-review-status{flex:0 0 auto;padding:5px 8px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:9px;font-weight:800;white-space:nowrap}.aift-my-review-status.submitted,.aift-my-review-status.under_review{background:#e8f0fe;color:#1a56a8}.aift-my-review-status.information_requested{background:#fff4d6;color:#8a5a00}.aift-my-review-status.approved,.aift-my-review-status.completed{background:#e8f7ee;color:#16713c}.aift-my-review-status.rejected,.aift-my-review-status.cancelled{background:#fdeceb;color:#b42318}.aift-my-review-note{margin-top:10px;padding:9px 10px;border-radius:9px;background:#f7f9fc;color:#475467;font-size:10px;line-height:1.5}.aift-my-review-time{margin-top:8px;color:#98a2b3;font-size:9px}.aift-my-review-banner{margin:0 10px 10px;padding:10px 12px;border-radius:10px;background:#fffbeb;color:#8a5a00;font-size:10px;line-height:1.5}.aift-my-review-refresh{margin:0 10px 10px;padding:9px;border:1px solid #dbe3ee;border-radius:9px;background:#fff;color:#344054;font-size:10px;font-weight:700;cursor:pointer}
      @media(max-width:760px){.aift-my-review-button{right:12px;bottom:76px}.aift-my-review-panel{right:12px;bottom:126px;width:calc(100vw - 24px);max-height:65vh}}
    `;document.head.appendChild(style);
  }

  function ensureUI(){
    if(document.getElementById("aiftMyReviewButton"))return;
    const button=document.createElement("button");button.id="aiftMyReviewButton";button.type="button";button.className="aift-my-review-button";button.innerHTML='<span>My AIFT Reviews</span><span id="aiftMyReviewCount" class="count zero">0</span>';
    const panel=document.createElement("aside");panel.id="aiftMyReviewPanel";panel.className="aift-my-review-panel";panel.hidden=true;panel.setAttribute("aria-label","My AIFT Review Center");panel.innerHTML='<div class="aift-my-review-head"><div><strong>My AIFT Reviews</strong><span>Track requests that require AIFT approval before the next party can proceed.</span></div><button type="button" class="aift-my-review-close" aria-label="Close">×</button></div><div id="aiftMyReviewList" class="aift-my-review-list"><div class="aift-my-review-empty">Loading review status…</div></div><div id="aiftMyReviewBanner" class="aift-my-review-banner" hidden></div><button id="aiftMyReviewRefresh" type="button" class="aift-my-review-refresh">Refresh status</button>';
    document.body.append(button,panel);
    button.addEventListener("click",()=>{state.open=!state.open;panel.hidden=!state.open;if(state.open)load();});panel.querySelector(".aift-my-review-close")?.addEventListener("click",()=>{state.open=false;panel.hidden=true;});panel.querySelector("#aiftMyReviewRefresh")?.addEventListener("click",load);
  }

  function render(){
    const list=document.getElementById("aiftMyReviewList"),count=document.getElementById("aiftMyReviewCount"),banner=document.getElementById("aiftMyReviewBanner");if(!list||!count)return;
    const open=state.cases.filter(item=>!CLOSED.has(item.status)).length;count.textContent=String(open);count.classList.toggle("zero",open===0);
    const needs=state.cases.filter(item=>item.status==="information_requested").length;if(banner){banner.hidden=needs===0;banner.textContent=needs?`${needs} request${needs===1?" needs":"s need"} more information. Open the case details below and follow the latest AIFT note.`:"";}
    if(!state.cases.length){list.innerHTML='<div class="aift-my-review-empty">You do not have any AIFT review cases yet. Requests that require approval will appear here automatically.</div>';return;}
    list.innerHTML=state.cases.map(item=>`<article class="aift-my-review-card"><div class="aift-my-review-top"><div><div class="aift-my-review-case">${esc(item.caseNumber||"AIFT REVIEW")}</div><div class="aift-my-review-title">${esc(item.title||"Review request")}</div><div class="aift-my-review-type">${esc(title(item.type))}</div></div><span class="aift-my-review-status ${esc(item.status)}">${esc(title(item.status))}</span></div>${latestNote(item)?`<div class="aift-my-review-note">${esc(latestNote(item))}</div>`:""}<div class="aift-my-review-time">Submitted ${esc(fmt(item.createdAt))}${item.reviewedAt?` · Reviewed ${esc(fmt(item.reviewedAt))}`:""}</div></article>`).join("");
  }

  async function load(){
    if(state.loading)return;state.loading=true;const list=document.getElementById("aiftMyReviewList");if(list&&state.open)list.innerHTML='<div class="aift-my-review-empty">Loading latest review status…</div>';
    try{const data=await api("/api/review-cases/mine");state.cases=Array.isArray(data?.cases)?data.cases:[];render();}catch(error){if(list&&state.open)list.innerHTML=`<div class="aift-my-review-empty">${esc(error.message)}</div>`;}finally{state.loading=false;}
  }

  function init(){
    if(!token() || role()==="admin")return;ensureStyle();ensureUI();setTimeout(load,800);window.addEventListener("focus",()=>load(),{passive:true});
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
