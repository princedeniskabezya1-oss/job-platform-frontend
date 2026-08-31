(() => {
  "use strict";

  const API = "https://backend-1-9b6f.onrender.com";
  const page = String(location.pathname.split("/").pop() || "").toLowerCase();
  const role = String(localStorage.getItem("role") || "").trim().toLowerCase();

  function getToken(){
    return localStorage.getItem("token") ||
      localStorage.getItem("studentToken") ||
      localStorage.getItem("talentToken") ||
      localStorage.getItem("schoolToken") ||
      localStorage.getItem("employerToken") ||
      localStorage.getItem("adminToken") ||
      "";
  }

  function esc(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  async function api(path, options={}){
    const token = getToken();
    const headers = {
      ...(token ? { Authorization:`Bearer ${token}` } : {}),
      ...(options.body ? { "Content-Type":"application/json" } : {}),
      ...(options.headers || {})
    };
    const response = await fetch(`${API}${path}`,{...options,headers});
    const data = await response.json().catch(() => ({}));
    if(!response.ok){
      const error = new Error(data?.message || `Request failed (${response.status})`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  function ensureStyles(){
    if(document.getElementById("aiftStudentIdentityStyles")) return;
    const style=document.createElement("style");
    style.id="aiftStudentIdentityStyles";
    style.textContent=`
      .aift-id-card{background:linear-gradient(145deg,#111827,#312e81 65%,#5b21b6);color:#fff;border-radius:18px;padding:18px;box-shadow:0 14px 34px rgba(15,23,42,.15);margin:14px 0;position:relative;overflow:hidden}
      .aift-id-card:after{content:"";position:absolute;width:150px;height:150px;border-radius:50%;right:-55px;top:-70px;background:rgba(255,255,255,.08)}
      .aift-id-eyebrow{font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;opacity:.72}
      .aift-id-title{font-size:18px;font-weight:800;margin:6px 0 3px}.aift-id-copy{font-size:12px;opacity:.8;line-height:1.5}
      .aift-id-number{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;font-weight:800;letter-spacing:.04em;margin-top:14px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.12);display:flex;justify-content:space-between;align-items:center;gap:10px}
      .aift-id-number button,.aift-id-card button{border:0;border-radius:9px;padding:8px 11px;font-weight:700;cursor:pointer}.aift-id-number button{background:#fff;color:#312e81}
      .aift-id-meta{margin-top:11px;font-size:12px;line-height:1.55;opacity:.86}.aift-id-verified{display:inline-flex;align-items:center;gap:6px;margin-top:10px;font-size:12px;font-weight:800;color:#dcfce7}
      .aift-id-launcher{position:fixed;right:22px;bottom:22px;z-index:99970;border:0;border-radius:999px;background:#5b21b6;color:#fff;box-shadow:0 10px 30px rgba(15,23,42,.22);padding:12px 17px;font-weight:800;cursor:pointer}
      .aift-id-modal{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.46);display:none;align-items:center;justify-content:center;padding:20px}.aift-id-modal.open{display:flex}
      .aift-id-dialog{width:min(720px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 28px 80px rgba(15,23,42,.28);color:#0f172a}
      .aift-id-head{padding:20px 22px 15px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:16px}.aift-id-head h2{margin:0;font-size:20px}.aift-id-head p{margin:5px 0 0;color:#64748b;font-size:13px;line-height:1.5}.aift-id-close{border:0;background:transparent;font-size:26px;cursor:pointer;color:#475569}
      .aift-id-body{padding:20px 22px}.aift-id-search{display:flex;gap:9px;margin-bottom:16px}.aift-id-search input{flex:1;min-width:0;border:1px solid #cbd5e1;border-radius:10px;padding:11px 12px;font:inherit}.aift-id-search button{border:0;border-radius:10px;background:#5b21b6;color:#fff;padding:10px 15px;font-weight:800;cursor:pointer}
      .aift-id-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 0;border-bottom:1px solid #eef2f7}.aift-id-row:last-child{border-bottom:0}.aift-id-row strong{display:block;font-size:14px}.aift-id-row span{display:block;color:#64748b;font-size:12px;margin-top:3px}.aift-id-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-weight:800;color:#5b21b6!important}.aift-id-row button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:7px 9px;cursor:pointer;font-weight:700}
      .aift-id-empty{padding:28px 8px;text-align:center;color:#64748b;font-size:13px;line-height:1.5}.aift-id-badge{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-left:7px!important;padding:3px 7px!important;border-radius:999px!important;background:#ede9fe!important;color:#5b21b6!important;font-size:10px!important;font-weight:800!important;line-height:1.2!important;vertical-align:middle!important}
      @media(max-width:760px){.aift-id-launcher{right:14px;bottom:72px}.aift-id-search{flex-direction:column}.aift-id-dialog{border-radius:14px}.aift-id-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function copyText(text){
    if(navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
    const area=document.createElement("textarea");area.value=text;document.body.appendChild(area);area.select();document.execCommand("copy");area.remove();return Promise.resolve();
  }

  function schoolName(school){ return school?.schoolName || school?.name || "Verified AIFT School"; }

  function ensureModal(){
    let modal=document.getElementById("aiftStudentIdentityModal");
    if(modal) return modal;
    modal=document.createElement("div");
    modal.className="aift-id-modal";
    modal.id="aiftStudentIdentityModal";
    modal.setAttribute("aria-hidden","true");
    modal.innerHTML=`<section class="aift-id-dialog" role="dialog" aria-modal="true"><header class="aift-id-head"><div><h2 id="aiftIdentityModalTitle">AIFT Student Identity</h2><p id="aiftIdentityModalSubtitle">Verified school-issued student identity.</p></div><button class="aift-id-close" type="button" data-aift-id-close aria-label="Close">×</button></header><div class="aift-id-body" id="aiftIdentityModalBody"></div></section>`;
    modal.addEventListener("click",e=>{if(e.target===modal||e.target.closest("[data-aift-id-close]")){modal.classList.remove("open");modal.setAttribute("aria-hidden","true");}});
    modal.addEventListener("click",e=>{const b=e.target.closest("[data-copy-aift-id]");if(b){copyText(b.dataset.copyAiftId);b.textContent="Copied";setTimeout(()=>b.textContent="Copy",1200);}});
    document.body.appendChild(modal);
    return modal;
  }

  function openModal(title,subtitle,html){
    const modal=ensureModal();
    modal.querySelector("#aiftIdentityModalTitle").textContent=title;
    modal.querySelector("#aiftIdentityModalSubtitle").textContent=subtitle;
    modal.querySelector("#aiftIdentityModalBody").innerHTML=html;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden","false");
  }

  function findPortfolioSidebar(){
    return document.querySelector("#studentPortfolioSide,.student-portfolio-side,.student-portfolio-sidebar,[data-student-portfolio-sidebar],#studentPortfolioWorkspace aside,.student-portfolio-layout aside");
  }

  function renderStudentPassport(data){
    const identity=data?.identity;
    const sidebar=findPortfolioSidebar();
    if(!sidebar || document.getElementById("aiftOpportunityPassportIdentityCard")) return;
    const verified=Boolean(data?.verified && identity?.aiftStudentId);
    const card=document.createElement("section");
    card.className="aift-id-card";
    card.id="aiftOpportunityPassportIdentityCard";
    card.innerHTML=verified ? `
      <div class="aift-id-eyebrow">AIFT Opportunity Passport</div>
      <div class="aift-id-title">Verified Student Identity</div>
      <div class="aift-id-copy">Your permanent AIFT Student ID is issued only after school verification.</div>
      <div class="aift-id-number"><span data-aift-student-id>${esc(identity.aiftStudentId)}</span><button type="button" data-copy-aift-id="${esc(identity.aiftStudentId)}">Copy</button></div>
      <div class="aift-id-verified">✓ School verified</div>
      <div class="aift-id-meta">${esc(schoolName(identity.schoolId))}${identity.verifiedAt ? ` · Verified ${esc(new Date(identity.verifiedAt).toLocaleDateString())}` : ""}</div>
      <button type="button" data-view-aift-passport style="margin-top:12px;background:#fff;color:#312e81">View Passport</button>` : `
      <div class="aift-id-eyebrow">AIFT Opportunity Passport</div>
      <div class="aift-id-title">Student ID pending verification</div>
      <div class="aift-id-copy">AIFT Student IDs are issued only to students created by or verified through an AIFT school.</div>`;
    card.addEventListener("click",e=>{
      const copy=e.target.closest("[data-copy-aift-id]");
      if(copy){copyText(copy.dataset.copyAiftId);copy.textContent="Copied";setTimeout(()=>copy.textContent="Copy",1200);return;}
      if(e.target.closest("[data-view-aift-passport]") && verified){
        openModal("AIFT Opportunity Passport","Verified student identity for trusted AIFT education and career activity.",`<div class="aift-id-card" style="margin:0"><div class="aift-id-eyebrow">AIFT Student</div><div class="aift-id-title">${esc(identity.aiftStudentId)}</div><div class="aift-id-verified">✓ Verified Student</div><div class="aift-id-meta">Verified by ${esc(schoolName(identity.schoolId))}${identity.verifiedAt ? `<br>Verification date: ${esc(new Date(identity.verifiedAt).toLocaleDateString())}` : ""}</div></div>`);
      }
    });
    sidebar.prepend(card);
  }

  async function initStudent(){
    if(!getToken()) return;
    try{
      const data=await api("/api/student-identity/me");
      window.AIFTStudentIdentity=data;
      document.dispatchEvent(new CustomEvent("aift:student-identity",{detail:data}));
      renderStudentPassport(data);
      setTimeout(()=>renderStudentPassport(data),1200);
      const observer=new MutationObserver(()=>renderStudentPassport(data));
      observer.observe(document.body,{subtree:true,childList:true});
      setTimeout(()=>observer.disconnect(),20000);
    }catch(error){
      if(error.status===403){
        const data={verified:false,identity:null};
        window.AIFTStudentIdentity=data;
        renderStudentPassport(data);
        setTimeout(()=>renderStudentPassport(data),1200);
      }else console.warn("AIFT Student Identity could not load",error);
    }
  }

  function annotateStudentNodes(identities){
    const map=new Map((identities||[]).map(item=>[String(item?.student?._id||""),item]));
    document.querySelectorAll("[data-student-id],[data-candidate-student-id]").forEach(node=>{
      const id=String(node.dataset.studentId||node.dataset.candidateStudentId||"");
      const identity=map.get(id);
      if(!identity || node.querySelector(".aift-id-badge")) return;
      const badge=document.createElement("span");
      badge.className="aift-id-badge";
      badge.title=`Verified AIFT Student ID: ${identity.aiftStudentId}`;
      badge.textContent=`✓ ${identity.aiftStudentId}`;
      const target=node.querySelector("h1,h2,h3,h4,strong,.name,.student-name,.candidate-name") || node;
      target.appendChild(badge);
    });
  }

  async function loadSchoolIdentities(){
    const data=await api("/api/student-identity/school/students");
    return Array.isArray(data?.identities) ? data.identities : [];
  }

  function schoolRows(identities,query=""){
    const q=String(query).trim().toLowerCase();
    const rows=identities.filter(item=>{
      const text=[item.aiftStudentId,item.student?.name,item.student?.course,item.student?.yearLevel].filter(Boolean).join(" ").toLowerCase();
      return !q || text.includes(q);
    });
    if(!rows.length) return `<div class="aift-id-empty">No verified AIFT Student IDs matched your search.</div>`;
    return rows.map(item=>`<div class="aift-id-row"><div><strong>${esc(item.student?.name||"Student")}</strong><span>${esc([item.student?.course,item.student?.yearLevel].filter(Boolean).join(" · ")||"Verified student")}</span><span class="aift-id-code">${esc(item.aiftStudentId)}</span></div><button type="button" data-copy-aift-id="${esc(item.aiftStudentId)}">Copy</button></div>`).join("");
  }

  async function openSchoolDirectory(){
    openModal("AIFT Student IDs","Permanent IDs for students verified under this AIFT school.",`<div class="aift-id-empty">Loading verified students…</div>`);
    const body=document.getElementById("aiftIdentityModalBody");
    try{
      const identities=await loadSchoolIdentities();
      window.AIFTSchoolStudentIdentities=identities;
      body.innerHTML=`<div class="aift-id-search"><input id="aiftSchoolIdentitySearch" type="search" placeholder="Search student name, ID, course or year"><button type="button" id="aiftSchoolIdentityRefresh">Refresh</button></div><div id="aiftSchoolIdentityRows">${schoolRows(identities)}</div>`;
      body.querySelector("#aiftSchoolIdentitySearch")?.addEventListener("input",e=>{body.querySelector("#aiftSchoolIdentityRows").innerHTML=schoolRows(identities,e.target.value);});
      body.querySelector("#aiftSchoolIdentityRefresh")?.addEventListener("click",()=>openSchoolDirectory());
      annotateStudentNodes(identities);
    }catch(error){body.innerHTML=`<div class="aift-id-empty">${esc(error.message)}</div>`;}
  }

  function employerLookupForm(){
    return `<form class="aift-id-search" id="aiftEmployerIdentityLookup"><input id="aiftEmployerStudentId" type="text" maxlength="19" autocomplete="off" placeholder="AIFT-STU-XXXXXXXXXX" required><button type="submit">Verify</button></form><div id="aiftEmployerIdentityResult"><div class="aift-id-empty">Enter the AIFT Student ID shown on the candidate's Opportunity Passport.</div></div>`;
  }

  async function openEmployerVerifier(){
    openModal("Verify AIFT Student","Confirm that an internship or hiring candidate has an active school-verified AIFT Student ID.",employerLookupForm());
    const form=document.getElementById("aiftEmployerIdentityLookup");
    const result=document.getElementById("aiftEmployerIdentityResult");
    form?.addEventListener("submit",async e=>{
      e.preventDefault();
      const value=String(document.getElementById("aiftEmployerStudentId")?.value||"").trim().toUpperCase();
      result.innerHTML=`<div class="aift-id-empty">Verifying…</div>`;
      try{
        const data=await api(`/api/student-identity/lookup/${encodeURIComponent(value)}`);
        const item=data.identity;
        result.innerHTML=`<div class="aift-id-card" style="margin:0"><div class="aift-id-eyebrow">Verified AIFT Student</div><div class="aift-id-title">${esc(item.student?.name||"Student")}</div><div class="aift-id-number"><span>${esc(item.aiftStudentId)}</span><button type="button" data-copy-aift-id="${esc(item.aiftStudentId)}">Copy</button></div><div class="aift-id-verified">✓ Active school verification</div><div class="aift-id-meta">${esc([item.student?.course,item.student?.yearLevel].filter(Boolean).join(" · ")||"Student")}${item.school ? `<br>${esc(schoolName(item.school))}` : ""}</div></div>`;
      }catch(error){result.innerHTML=`<div class="aift-id-empty">${esc(error.message)}</div>`;}
    });
  }

  async function annotateVisibleCandidates(){
    const ids=[...new Set(Array.from(document.querySelectorAll("[data-student-id],[data-candidate-student-id]")).map(node=>String(node.dataset.studentId||node.dataset.candidateStudentId||"")).filter(id=>/^[a-f\d]{24}$/i.test(id)))].slice(0,100);
    if(!ids.length) return;
    try{
      const data=await api("/api/student-identity/batch",{method:"POST",body:JSON.stringify({studentIds:ids})});
      annotateStudentNodes(data.identities||[]);
    }catch(error){console.warn("Could not annotate verified student candidates",error);}
  }

  function addLauncher(label,handler){
    if(document.getElementById("aiftStudentIdentityLauncher")) return;
    const button=document.createElement("button");
    button.id="aiftStudentIdentityLauncher";
    button.className="aift-id-launcher";
    button.type="button";
    button.textContent=label;
    button.addEventListener("click",handler);
    document.body.appendChild(button);
  }

  async function initSchool(){
    addLauncher("Student IDs",openSchoolDirectory);
    try{const identities=await loadSchoolIdentities();annotateStudentNodes(identities);const observer=new MutationObserver(()=>annotateStudentNodes(identities));observer.observe(document.body,{subtree:true,childList:true});setTimeout(()=>observer.disconnect(),30000);}catch(error){console.warn("AIFT School Student IDs could not load",error);}
  }

  function initEmployer(){
    addLauncher("Verify Student ID",openEmployerVerifier);
    annotateVisibleCandidates();
    let timer=null;
    const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(annotateVisibleCandidates,350);});
    observer.observe(document.body,{subtree:true,childList:true});
    setTimeout(()=>observer.disconnect(),30000);
  }

  function init(){
    if(!getToken()) return;
    ensureStyles();
    if(role==="student" || page==="student.html") initStudent();
    else if(role==="school" || page==="school.html") initSchool();
    else if(role==="employer" || page==="employer.html") initEmployer();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
