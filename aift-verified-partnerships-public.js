(() => {
  "use strict";

  const PAGE=String(location.pathname.split("/").pop()||"").toLowerCase();
  const IS_SCHOOL=PAGE==="school-public-profile.html";
  const IS_EMPLOYER=PAGE==="employer-public-profile.html";
  if(!IS_SCHOOL&&!IS_EMPLOYER)return;

  const API=window.API_BASE||"https://backend-1-9b6f.onrender.com";
  const FALLBACK="https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
  const state={items:[],loading:false,loaded:false};

  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  const id=value=>value&&typeof value==="object"?String(value._id||value.id||""):String(value||"");
  const fmt=value=>{if(!value)return"";const date=new Date(value);return Number.isNaN(date.getTime())?"":date.toLocaleDateString([],{year:"numeric",month:"short"});};
  const caps=item=>Object.entries({internships:"Internships",jobs:"Jobs",recruitment:"Recruitment",training:"Training",careerEvents:"Career Events",scholarships:"Scholarships",mentorship:"Mentorship",research:"Research"}).filter(([key])=>item?.capabilities?.[key]===true).map(([,label])=>label);

  function profileId(){
    const query=new URLSearchParams(location.search);
    return String(query.get("id")||query.get(IS_SCHOOL?"schoolId":"companyId")||query.get(IS_SCHOOL?"userId":"employerId")||"").trim();
  }

  function ensureStyle(){
    if(document.getElementById("aiftVerifiedPartnershipPublicStyle"))return;
    const style=document.createElement("style");
    style.id="aiftVerifiedPartnershipPublicStyle";
    style.textContent=`
      .aift-vp-section{margin-bottom:12px}.aift-vp-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}.aift-vp-heading h2{margin:0!important;font-size:20px!important}.aift-vp-heading p{margin:4px 0 0!important;color:#667085!important;font-size:12px!important;line-height:1.5!important}.aift-vp-count{min-width:32px;height:28px;padding:0 9px;display:grid;place-items:center;border-radius:999px;background:#eef6ff;color:#0a66c2;font-size:11px;font-weight:800}.aift-vp-list{display:grid;gap:10px}.aift-vp-card{padding:15px;display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:start;gap:13px;border:1px solid #e2e8f0;border-radius:13px;background:#fff}.aift-vp-logo{width:52px;height:52px;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc;object-fit:cover}.aift-vp-copy{min-width:0}.aift-vp-copy h3{margin:0;color:#172033;font-size:14px;line-height:1.3}.aift-vp-verified{display:flex;align-items:center;gap:5px;margin-top:4px;color:#137c41;font-size:9px;font-weight:800}.aift-vp-description{margin:7px 0 0!important;color:#667085!important;font-size:10px!important;line-height:1.5!important}.aift-vp-caps{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}.aift-vp-caps span{padding:5px 7px;border-radius:999px;background:#eef6ff;color:#1765cc;font-size:8px;font-weight:750}.aift-vp-date{margin-top:8px;color:#98a2b3;font-size:8px}.aift-vp-action{min-height:34px;padding:0 11px;border:1px solid #c9d4e1;border-radius:9px;background:#fff;color:#344054;font-size:9px;font-weight:800}.aift-vp-empty{padding:22px;border:1px dashed #d7dee8;border-radius:12px;background:#fafbfc;color:#667085;text-align:center;font-size:11px;line-height:1.5}.aift-vp-empty strong{display:block;margin-bottom:4px;color:#344054;font-size:12px}@media(max-width:640px){.aift-vp-section{margin:0 0 8px!important;border-radius:0!important;border-left:0!important;border-right:0!important;box-shadow:none!important}.aift-vp-card{grid-template-columns:46px minmax(0,1fr);padding:13px}.aift-vp-logo{width:46px;height:46px}.aift-vp-action{grid-column:1/-1;width:100%}}
    `;
    document.head.appendChild(style);
  }

  async function load(){
    const value=profileId();
    if(!value||state.loading)return state.items;
    state.loading=true;
    try{
      const key=IS_SCHOOL?"schoolId":"companyId";
      const response=await fetch(`${API}/api/opportunities/verified-partnerships?${key}=${encodeURIComponent(value)}`,{cache:"no-store",headers:{Accept:"application/json"}});
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data.message||"Unable to load verified partnerships.");
      state.items=Array.isArray(data.partnerships)?data.partnerships:Array.isArray(data.items)?data.items:[];
      state.loaded=true;
      return state.items;
    }catch(error){
      console.warn("AIFT verified partnerships:",error);
      state.items=[];
      state.loaded=true;
      return [];
    }finally{state.loading=false;}
  }

  function card(item){
    const partner=IS_SCHOOL?(item.companyId||{}):(item.schoolId||{});
    const partnerId=id(partner)||id(IS_SCHOOL?item.companyId:item.schoolId);
    const name=IS_SCHOOL?(partner.companyName||partner.name||item.companyName||"AIFT Company Partner"):(partner.schoolName||partner.name||item.schoolName||"AIFT Education Partner");
    const logo=partner.logo||partner.schoolLogo||partner.profileImage||partner.profilePicture||partner.avatar||FALLBACK;
    const abilities=caps(item);
    const description=item.title||item.description||item.objective||"Active AIFT-verified partnership";
    const active=fmt(item.activatedAt||item.startDate);
    const target=IS_SCHOOL?`employer-public-profile.html?id=${encodeURIComponent(partnerId)}`:`school-public-profile.html?id=${encodeURIComponent(partnerId)}`;
    return `<article class="aift-vp-card"><img class="aift-vp-logo" src="${esc(logo)}" alt=""><div class="aift-vp-copy"><h3>${esc(name)}</h3><div class="aift-vp-verified">✓ ${IS_SCHOOL?"AIFT Verified Partnership":"AIFT Verified Education Partner"}</div><p class="aift-vp-description">${esc(description)}</p>${abilities.length?`<div class="aift-vp-caps">${abilities.map(label=>`<span>${esc(label)}</span>`).join("")}</div>`:""}${active?`<div class="aift-vp-date">Active since ${esc(active)}</div>`:""}</div>${partnerId?`<button type="button" class="aift-vp-action" data-aift-vp-href="${esc(target)}">View ${IS_SCHOOL?"company":"school"}</button>`:""}</article>`;
  }

  function renderSchool(){
    const mount=document.getElementById("partnersList");
    if(!mount)return false;
    mount.innerHTML=state.items.length?state.items.map(card).join(""):`<div class="aift-vp-empty"><strong>No active verified partnerships yet.</strong>Only partnerships that completed AIFT verification and activation appear publicly.</div>`;
    for(const name of ["partnerCount","sidePartnerCount"]){const node=document.getElementById(name);if(node)node.textContent=String(state.items.length);}
    return true;
  }

  function employerHost(){
    const about=document.getElementById("tab-about");
    if(!about)return null;
    let section=document.getElementById("aiftVerifiedEmployerPartners");
    if(!section){section=document.createElement("article");section.id="aiftVerifiedEmployerPartners";section.className="content-card card aift-vp-section";about.appendChild(section);}
    return section;
  }

  function renderEmployer(){
    const mount=employerHost();if(!mount)return false;
    mount.innerHTML=`<div class="aift-vp-heading"><div><h2>Verified Education Partners</h2><p>Active School partnerships verified through AIFT.</p></div><span class="aift-vp-count">${state.items.length}</span></div><div class="aift-vp-list">${state.items.length?state.items.map(card).join(""):`<div class="aift-vp-empty"><strong>No active verified education partners yet.</strong>Approved partnerships appear here after activation.</div>`}</div>`;
    return true;
  }

  function render(){ensureStyle();return IS_SCHOOL?renderSchool():renderEmployer();}
  async function refresh(){await load();render();}

  document.addEventListener("click",event=>{const button=event.target.closest("[data-aift-vp-href]");if(!button)return;location.href=button.dataset.aiftVpHref;});

  if(IS_SCHOOL&&typeof window.renderPartners==="function"){
    window.renderPartners=function renderVerifiedPublicPartners(){renderSchool();};
  }

  async function init(){
    ensureStyle();
    if(IS_SCHOOL&&typeof window.renderPartners==="function")window.renderPartners=function renderVerifiedPublicPartners(){renderSchool();};
    await load();
    render();
    setTimeout(render,500);
    setTimeout(render,2000);
  }

  window.AIFTPublicVerifiedPartnerships={refresh};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
