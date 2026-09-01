(()=>{
  "use strict";

  const PAGE=String(location.pathname.split("/").pop()||"").toLowerCase();
  if(PAGE!=="student.html") return;

  const API=window.API_BASE||"https://backend-1-9b6f.onrender.com";
  const TOKEN_KEYS=["studentToken","talentToken","token"];
  let cached=null;
  let loading=null;

  if(document.body) document.body.dataset.aiftArea="career-hub";

  const token=()=>TOKEN_KEYS.map(key=>localStorage.getItem(key)||sessionStorage.getItem(key)).find(Boolean)||"";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");

  async function getJson(path){
    const response=await fetch(API+path,{cache:"no-store",headers:{Authorization:`Bearer ${token()}`}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message||`Request failed (${response.status})`);
    return data;
  }

  async function load(force=false){
    if(cached&&!force)return cached;
    if(loading&&!force)return loading;
    loading=(async()=>{
      const [meResult,identityResult]=await Promise.allSettled([getJson("/api/users/me"),getJson("/api/student-identity/me")]);
      if(meResult.status!=="fulfilled") throw meResult.reason;
      const meData=meResult.value||{};
      const user=meData.user||meData.data||meData||{};
      const identityData=identityResult.status==="fulfilled"?identityResult.value:{};
      const identity=identityData?.verified===true?identityData.identity:null;
      cached={user,identity,verified:Boolean(identity),identityMessage:identityData?.message||""};
      return cached;
    })();
    try{return await loading;}finally{loading=null;}
  }

  const passportId=value=>value?.identity?.aiftStudentId||"Pending school verification";
  const schoolName=value=>value?.identity?.schoolId?.schoolName||value?.identity?.schoolId?.name||value?.user?.linkedSchoolId?.schoolName||value?.user?.linkedSchoolId?.name||"Not verified by a school";

  function ensureStyle(){
    if(document.getElementById("aiftPassportStyles"))return;
    const style=document.createElement("style");
    style.id="aiftPassportStyles";
    style.textContent=`
      .aift-passport-card{overflow:hidden;border:1px solid #d9e2ef;border-radius:16px;background:linear-gradient(145deg,#0f172a,#172554 54%,#1d4ed8);color:#fff;box-shadow:0 12px 28px rgba(15,23,42,.12)}.aift-passport-head{padding:15px 16px 12px;display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.13)}.aift-passport-head span{display:block;color:#93c5fd;font-size:7px;font-weight:850;letter-spacing:.11em}.aift-passport-head strong{display:block;margin-top:4px;font-size:14px}.aift-passport-chip{height:24px;padding:0 8px;display:flex;align-items:center;border:1px solid rgba(255,255,255,.2);border-radius:999px;background:rgba(255,255,255,.08);font-size:7px;font-weight:850}.aift-passport-body{padding:14px 16px;display:grid;gap:10px}.aift-passport-id,.aift-passport-stat{padding:9px 10px;border-radius:10px;background:rgba(255,255,255,.08)}.aift-passport-id small,.aift-passport-stat span{display:block;color:#bfdbfe;font-size:7px}.aift-passport-id strong{display:block;margin-top:3px;font-size:12px}.aift-passport-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.aift-passport-stat strong{display:block;margin-top:3px;font-size:9px}.aift-passport-actions{padding:0 16px 15px;display:grid;grid-template-columns:1fr auto;gap:7px}.aift-passport-actions button{min-height:34px;border-radius:9px;font-size:8px;font-weight:850}.aift-passport-view{border:1px solid #fff;background:#fff;color:#1d4ed8}.aift-passport-copy{padding:0 11px;border:1px solid rgba(255,255,255,.28);background:transparent;color:#fff}.aift-passport-copy:disabled{opacity:.5}.aift-passport-modal{position:fixed;inset:0;z-index:999998;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.56);backdrop-filter:blur(5px)}.aift-passport-modal[hidden]{display:none!important}.aift-passport-sheet{width:min(720px,100%);max-height:88dvh;overflow:auto;border-radius:20px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.3);color:#111827}.aift-passport-sheet-head{padding:18px 20px;display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #e5e7eb}.aift-passport-sheet-head strong{font-size:18px}.aift-passport-close{width:34px;height:34px;border:0;border-radius:50%;background:#f3f4f6;font-size:20px}.aift-passport-sheet-body{padding:20px;display:grid;gap:14px}.aift-passport-identity{padding:18px;border-radius:16px;background:linear-gradient(145deg,#0f172a,#1d4ed8);color:#fff}.aift-passport-identity h2{margin:4px 0 2px;font-size:24px}.aift-passport-identity p{margin:0;color:#dbeafe;font-size:12px}.aift-passport-table{border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}.aift-passport-row{min-height:46px;padding:10px 13px;display:grid;grid-template-columns:170px 1fr;gap:12px;align-items:center;border-bottom:1px solid #eef2f7}.aift-passport-row:last-child{border-bottom:0}.aift-passport-row span{color:#64748b;font-size:11px}.aift-passport-row strong{font-size:12px}.aift-passport-note{padding:12px 14px;border-radius:12px;background:#f8fafc;color:#475569;font-size:11px;line-height:1.55}.aift-passport-help{display:flex;gap:8px}.aift-passport-help button{min-height:36px;padding:0 12px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#344054;font-size:9px;font-weight:800}@media(max-width:640px){.aift-passport-grid{grid-template-columns:1fr}.aift-passport-row{grid-template-columns:1fr;gap:3px}.aift-passport-modal{align-items:end;padding:0}.aift-passport-sheet{width:100%;max-height:92dvh;border-radius:18px 18px 0 0}}
    `;
    document.head.appendChild(style);
  }

  function buildModal(value){
    ensureStyle();
    document.getElementById("aiftPassportModal")?.remove();
    const user=value.user||{};
    const skills=Array.isArray(user.skills)?user.skills:[];
    const modal=document.createElement("div");
    modal.id="aiftPassportModal";modal.className="aift-passport-modal";modal.hidden=true;
    modal.innerHTML=`<div class="aift-passport-sheet" role="dialog" aria-modal="true"><div class="aift-passport-sheet-head"><strong>AIFT Opportunity Passport</strong><button class="aift-passport-close" type="button">×</button></div><div class="aift-passport-sheet-body"><div class="aift-passport-identity"><span>AIFT OPPORTUNITY PASSPORT</span><h2>${esc(user.name||"AIFT Student")}</h2><p>${esc(passportId(value))}</p></div><div class="aift-passport-table"><div class="aift-passport-row"><span>AIFT Student ID</span><strong>${esc(passportId(value))}</strong></div><div class="aift-passport-row"><span>Verification</span><strong>${value.verified?"School-verified AIFT identity":"Pending school verification"}</strong></div><div class="aift-passport-row"><span>School</span><strong>${esc(schoolName(value))}</strong></div><div class="aift-passport-row"><span>Course / program</span><strong>${esc(user.course||user.program||"Not added")}</strong></div><div class="aift-passport-row"><span>Year level</span><strong>${esc(user.yearLevel||"Not added")}</strong></div><div class="aift-passport-row"><span>Skills</span><strong>${skills.length?esc(skills.join(", ")):"No skills added yet"}</strong></div></div><div class="aift-passport-note">${value.verified?"This Passport can be attached to supported Career Applications. AIFT captures a trusted snapshot at submission time so Employers can verify your School relationship.":esc(value.identityMessage||"Your AIFT Student ID becomes available after a School-controlled verification relationship is confirmed.")}</div><div class="aift-passport-help"><button type="button" data-passport-portfolio>Open Portfolio</button></div></div></div>`;
    document.body.appendChild(modal);
    modal.querySelector(".aift-passport-close").onclick=()=>modal.hidden=true;
    modal.addEventListener("click",event=>{if(event.target===modal)modal.hidden=true;});
    modal.querySelector("[data-passport-portfolio]")?.addEventListener("click",()=>{modal.hidden=true;window.openStudentStudioPage?.("portfolio");});
    return modal;
  }

  function renderCard(value){
    const side=document.querySelector("#section-portfolio .student-portfolio-side-column")||document.querySelector(".student-portfolio-side-column");
    if(!side)return false;
    ensureStyle();
    let card=document.getElementById("aiftOpportunityPassportCard");
    if(!card){card=document.createElement("article");card.id="aiftOpportunityPassportCard";card.className="aift-passport-card";side.prepend(card);}
    const user=value.user||{};
    card.innerHTML=`<div class="aift-passport-head"><div><span>OPPORTUNITY PASSPORT</span><strong>AIFT career identity</strong></div><div class="aift-passport-chip">${value.verified?"Verified Student ID":"Verification pending"}</div></div><div class="aift-passport-body"><div class="aift-passport-id"><small>AIFT Student ID</small><strong>${esc(passportId(value))}</strong></div><div class="aift-passport-grid"><div class="aift-passport-stat"><span>Student</span><strong>${esc(user.name||"AIFT Student")}</strong></div><div class="aift-passport-stat"><span>Program</span><strong>${esc(user.course||user.program||"Not added")}</strong></div><div class="aift-passport-stat"><span>School</span><strong>${esc(schoolName(value))}</strong></div><div class="aift-passport-stat"><span>Status</span><strong>${value.verified?"School verified":"Pending verification"}</strong></div></div></div><div class="aift-passport-actions"><button class="aift-passport-view" type="button">View Passport</button><button class="aift-passport-copy" type="button" ${value.verified?"":"disabled"}>Copy ID</button></div>`;
    card.querySelector(".aift-passport-view").onclick=()=>{buildModal(value).hidden=false;};
    const copy=card.querySelector(".aift-passport-copy");
    if(value.verified)copy.onclick=async()=>{try{await navigator.clipboard.writeText(passportId(value));copy.textContent="Copied";setTimeout(()=>copy.textContent="Copy ID",1200);}catch{}};
    return true;
  }

  async function open(){const value=await load();const modal=buildModal(value);modal.hidden=false;return value;}

  function addScript(src,attribute){
    if(document.querySelector(`script[${attribute}]`))return Promise.resolve();
    return new Promise(resolve=>{const script=document.createElement("script");script.src=src;script.defer=true;script.setAttribute(attribute,"1");script.addEventListener("load",resolve,{once:true});script.addEventListener("error",resolve,{once:true});document.head.appendChild(script);});
  }

  async function loadCareerHub(){
    await addScript("student-career-hub-v2.js","data-aift-student-career-v2");
    await addScript("student-career-hub-markets-v2.js","data-aift-student-career-markets-v2");
  }

  window.AIFTStudentPassport={load,get:()=>cached,open,refresh:()=>load(true),studentId:()=>cached?passportId(cached):"",verified:()=>cached?.verified===true};

  async function init(){
    if(!token())return;
    loadCareerHub().catch(()=>{});
    let value;try{value=await load();}catch{return;}
    if(renderCard(value))return;
    const observer=new MutationObserver(()=>{if(renderCard(value))observer.disconnect();});
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),20000);
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
