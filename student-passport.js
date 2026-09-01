(()=>{
  "use strict";

  const API="https://backend-1-9b6f.onrender.com";
  const tokenKeys=["studentToken","talentToken","token"];
  let cachedPassport=null;
  let loadingPromise=null;

  /* student.html is a first-class Career Hub surface. This flag is read by
     the shared AIFT Activity script so Student review cases and status
     updates appear here without creating another polling implementation. */
  if(String(location.pathname.split("/").pop()||"").toLowerCase()==="student.html" && document.body){
    document.body.dataset.aiftArea="career-hub";
  }

  const token=()=>tokenKeys.map(key=>localStorage.getItem(key)||sessionStorage.getItem(key)).find(Boolean)||"";
  const esc=value=>String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
  const authHeaders=()=>({Authorization:`Bearer ${token()}`});

  async function jsonFetch(url){
    const response=await fetch(url,{headers:authHeaders(),cache:"no-store"});
    const data=await response.json().catch(()=>({}));
    return {ok:response.ok,status:response.status,data};
  }

  async function loadPassport(force=false){
    if(cachedPassport && !force) return cachedPassport;
    if(loadingPromise && !force) return loadingPromise;

    loadingPromise=(async()=>{
      const [meResult,identityResult]=await Promise.all([
        jsonFetch(`${API}/api/users/me`),
        jsonFetch(`${API}/api/student-identity/me`)
      ]);

      if(!meResult.ok) throw new Error(meResult.data?.message||"Unable to load student profile");

      const user=meResult.data?.user||meResult.data?.data||meResult.data||{};
      const verified=identityResult.ok&&identityResult.data?.verified===true&&identityResult.data?.identity;
      const identity=verified?identityResult.data.identity:null;

      cachedPassport={
        user,
        identity,
        verified:Boolean(verified),
        identityMessage:identityResult.data?.message||""
      };

      return cachedPassport;
    })();

    try{
      return await loadingPromise;
    }finally{
      loadingPromise=null;
    }
  }

  const studentId=passport=>passport?.identity?.aiftStudentId||"Pending school verification";
  const schoolName=passport=>
    passport?.identity?.schoolId?.schoolName||
    passport?.identity?.schoolId?.name||
    passport?.user?.linkedSchoolId?.schoolName||
    passport?.user?.linkedSchoolId?.name||
    "Not verified by a school";

  function ensureStyles(){
    if(document.getElementById("aiftPassportStyles")) return;
    const style=document.createElement("style");
    style.id="aiftPassportStyles";
    style.textContent=`
      .aift-passport-card{overflow:hidden;border:1px solid #d9e2ef;border-radius:16px;background:linear-gradient(145deg,#0f172a,#172554 54%,#1d4ed8);color:#fff;box-shadow:0 12px 28px rgba(15,23,42,.12)}
      .aift-passport-head{padding:15px 16px 12px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(255,255,255,.13)}.aift-passport-head span{display:block;color:#93c5fd;font-size:7px;font-weight:800;letter-spacing:.11em}.aift-passport-head strong{display:block;margin-top:4px;font-size:14px;line-height:1.25}.aift-passport-chip{min-height:24px;padding:0 8px;display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.18);border-radius:999px;background:rgba(255,255,255,.08);font-size:7px;font-weight:800}
      .aift-passport-body{padding:14px 16px;display:grid;gap:12px}.aift-passport-id{padding:10px 11px;border:1px solid rgba(255,255,255,.14);border-radius:11px;background:rgba(255,255,255,.07)}.aift-passport-id small{display:block;color:#bfdbfe;font-size:7px}.aift-passport-id strong{display:block;margin-top:3px;font-size:12px;letter-spacing:.04em}.aift-passport-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.aift-passport-stat{padding:9px;border-radius:10px;background:rgba(255,255,255,.07)}.aift-passport-stat span{display:block;color:#bfdbfe;font-size:7px}.aift-passport-stat strong{display:block;margin-top:3px;font-size:9px;line-height:1.35}.aift-passport-skills{display:flex;flex-wrap:wrap;gap:5px}.aift-passport-skills span{padding:5px 7px;border-radius:999px;background:rgba(255,255,255,.1);font-size:7px}.aift-passport-actions{padding:0 16px 15px;display:grid;grid-template-columns:1fr auto;gap:7px}.aift-passport-actions button{min-height:34px;border-radius:9px;font-size:8px;font-weight:800}.aift-passport-view{border:1px solid #fff;background:#fff;color:#1d4ed8}.aift-passport-copy{padding:0 11px;border:1px solid rgba(255,255,255,.28);background:transparent;color:#fff}.aift-passport-copy:disabled{opacity:.55;cursor:not-allowed}
      .aift-passport-modal{position:fixed;inset:0;z-index:999998;background:rgba(15,23,42,.55);display:grid;place-items:center;padding:18px}.aift-passport-modal[hidden]{display:none!important}.aift-passport-sheet{width:min(680px,100%);max-height:88vh;overflow:auto;border-radius:20px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.3);color:#111827}.aift-passport-sheet-head{padding:18px 20px;display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #e5e7eb}.aift-passport-sheet-head strong{font-size:18px}.aift-passport-close{width:34px;height:34px;border:0;border-radius:50%;background:#f3f4f6;font-size:20px}.aift-passport-sheet-body{padding:20px;display:grid;gap:14px}.aift-passport-identity{padding:18px;border-radius:16px;background:linear-gradient(145deg,#0f172a,#1d4ed8);color:#fff}.aift-passport-identity h2{margin:4px 0 2px;font-size:24px}.aift-passport-identity p{margin:0;color:#dbeafe;font-size:12px}.aift-passport-table{display:grid;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden}.aift-passport-row{min-height:46px;padding:10px 13px;display:grid;grid-template-columns:170px 1fr;align-items:center;gap:12px;border-bottom:1px solid #eef2f7}.aift-passport-row:last-child{border-bottom:0}.aift-passport-row span{color:#64748b;font-size:11px}.aift-passport-row strong{font-size:12px}.aift-passport-note{padding:12px 14px;border-radius:12px;background:#f8fafc;color:#475569;font-size:11px;line-height:1.5}.aift-passport-help{display:flex;gap:8px;flex-wrap:wrap}.aift-passport-help button{min-height:36px;padding:0 12px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#344054;font-size:9px;font-weight:800}
      @media(max-width:640px){.aift-passport-grid{grid-template-columns:1fr}.aift-passport-row{grid-template-columns:1fr;gap:3px}.aift-passport-modal{align-items:end;padding:0}.aift-passport-sheet{width:100%;max-height:92dvh;border-radius:18px 18px 0 0}}
    `;
    document.head.appendChild(style);
  }

  function createModal(passport){
    const user=passport.user||{};
    let modal=document.getElementById("aiftPassportModal");
    if(modal) modal.remove();

    modal=document.createElement("div");
    modal.id="aiftPassportModal";
    modal.className="aift-passport-modal";
    modal.hidden=true;

    const skills=Array.isArray(user.skills)?user.skills:[];

    modal.innerHTML=`<div class="aift-passport-sheet" role="dialog" aria-modal="true" aria-labelledby="aiftPassportTitle"><div class="aift-passport-sheet-head"><strong id="aiftPassportTitle">AIFT Opportunity Passport</strong><button class="aift-passport-close" type="button">×</button></div><div class="aift-passport-sheet-body"><div class="aift-passport-identity"><span>AIFT OPPORTUNITY PASSPORT</span><h2>${esc(user.name||"AIFT Student")}</h2><p>${esc(studentId(passport))}</p></div><div class="aift-passport-table"><div class="aift-passport-row"><span>AIFT Student ID</span><strong>${esc(studentId(passport))}</strong></div><div class="aift-passport-row"><span>Verification</span><strong>${passport.verified?"School-verified AIFT identity":"Pending school verification"}</strong></div><div class="aift-passport-row"><span>School</span><strong>${esc(schoolName(passport))}</strong></div><div class="aift-passport-row"><span>Course / program</span><strong>${esc(user.course||user.program||"Not added")}</strong></div><div class="aift-passport-row"><span>Year level</span><strong>${esc(user.yearLevel||"Not added")}</strong></div><div class="aift-passport-row"><span>Profile completeness</span><strong>${Number.isFinite(Number(user.completeness))?`${Math.max(0,Math.min(100,Number(user.completeness)))}%`:"Not available"}</strong></div><div class="aift-passport-row"><span>Skills on profile</span><strong>${skills.length?esc(skills.join(", ")):"No skills added yet"}</strong></div></div>${passport.verified?'<div class="aift-passport-note">Your verified Passport can be attached to supported AIFT Career Applications. A trusted snapshot is captured when you submit, so Employers can verify the School relationship used at application time.</div>':`<div class="aift-passport-note">${esc(passport.identityMessage||"Your AIFT Student ID will appear after your account has a school-controlled verification relationship.")}</div>`}<div class="aift-passport-help"><button type="button" data-passport-open-portfolio>Open Portfolio</button>${passport.verified?"":'<button type="button" data-passport-open-profile>Review student profile</button>'}</div></div></div>`;

    document.body.appendChild(modal);
    modal.querySelector(".aift-passport-close").onclick=()=>modal.hidden=true;
    modal.addEventListener("click",event=>{if(event.target===modal) modal.hidden=true;});
    modal.querySelector("[data-passport-open-portfolio]")?.addEventListener("click",()=>{
      modal.hidden=true;
      if(typeof window.openStudentStudioPage==="function") window.openStudentStudioPage("portfolio");
    });
    modal.querySelector("[data-passport-open-profile]")?.addEventListener("click",()=>{
      modal.hidden=true;
      if(typeof window.openStudentStudioPage==="function") window.openStudentStudioPage("portfolio");
    });

    return modal;
  }

  function renderCard(passport){
    ensureStyles();
    const user=passport.user||{};
    const side=document.querySelector("#section-portfolio .student-portfolio-side-column")||document.querySelector(".student-portfolio-side-column");
    if(!side) return false;

    let card=document.getElementById("aiftOpportunityPassportCard");
    if(!card){
      card=document.createElement("article");
      card.id="aiftOpportunityPassportCard";
      card.className="aift-passport-card";
      side.prepend(card);
    }

    const skills=(Array.isArray(user.skills)?user.skills:[]).slice(0,4);
    card.innerHTML=`<div class="aift-passport-head"><div><span>OPPORTUNITY PASSPORT</span><strong>AIFT career identity</strong></div><div class="aift-passport-chip">${passport.verified?"Verified Student ID":"Verification pending"}</div></div><div class="aift-passport-body"><div class="aift-passport-id"><small>AIFT Student ID</small><strong>${esc(studentId(passport))}</strong></div><div class="aift-passport-grid"><div class="aift-passport-stat"><span>Student</span><strong>${esc(user.name||"AIFT Student")}</strong></div><div class="aift-passport-stat"><span>Program</span><strong>${esc(user.course||user.program||"Not added")}</strong></div><div class="aift-passport-stat"><span>School</span><strong>${esc(schoolName(passport))}</strong></div><div class="aift-passport-stat"><span>Status</span><strong>${passport.verified?"School verified":"Pending verification"}</strong></div></div>${skills.length?`<div class="aift-passport-skills">${skills.map(skill=>`<span>${esc(skill)}</span>`).join("")}</div>`:""}</div><div class="aift-passport-actions"><button class="aift-passport-view" type="button">View Passport</button><button class="aift-passport-copy" type="button" ${passport.verified?"":"disabled"}>Copy ID</button></div>`;

    const modal=createModal(passport);
    card.querySelector(".aift-passport-view").onclick=()=>modal.hidden=false;
    const copy=card.querySelector(".aift-passport-copy");
    if(passport.verified){
      copy.onclick=async()=>{
        try{
          await navigator.clipboard.writeText(studentId(passport));
          copy.textContent="Copied";
          setTimeout(()=>copy.textContent="Copy ID",1200);
        }catch{}
      };
    }

    return true;
  }

  async function openPassport(){
    ensureStyles();
    const passport=await loadPassport();
    const modal=createModal(passport);
    modal.hidden=false;
    return passport;
  }

  function appendScript(src,datasetKey){
    if(document.querySelector(`script[${datasetKey}]`)) return null;
    const script=document.createElement("script");
    script.src=src;
    script.defer=true;
    script.setAttribute(datasetKey,"1");
    document.head.appendChild(script);
    return script;
  }

  function loadCareerHubUpgrade(){
    const existing=document.querySelector('script[data-aift-student-career-v2]');
    const loadMarkets=()=>appendScript("student-career-hub-markets.js","data-aift-student-career-markets");

    if(existing){
      if(window.AIFTStudentCareerHub) loadMarkets();
      else existing.addEventListener("load",loadMarkets,{once:true});
      return;
    }

    const script=appendScript("student-career-hub-v2.js","data-aift-student-career-v2");
    script?.addEventListener("load",loadMarkets,{once:true});
  }

  window.AIFTStudentPassport={
    load:loadPassport,
    get:()=>cachedPassport,
    open:openPassport,
    refresh:()=>loadPassport(true),
    studentId:()=>cachedPassport?studentId(cachedPassport):"",
    verified:()=>cachedPassport?.verified===true
  };

  async function init(){
    if(!token()) return;
    loadCareerHubUpgrade();

    let passport;
    try{
      passport=await loadPassport();
    }catch{
      return;
    }

    const attempt=()=>renderCard(passport);
    if(attempt()) return;

    const observer=new MutationObserver(()=>{
      if(attempt()) observer.disconnect();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),20000);
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
