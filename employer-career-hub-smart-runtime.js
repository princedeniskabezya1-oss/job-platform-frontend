(() => {
  "use strict";

  const page=String(location.pathname.split("/").pop() || "").toLowerCase();
  if(page !== "employer.html") return;

  const API=window.API_BASE || "https://backend-1-9b6f.onrender.com";

  function employerToken(){
    return localStorage.getItem("employerToken") ||
      sessionStorage.getItem("employerToken") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
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

  if(!document.getElementById("empSmartCareerRuntimeStyle")){
    const style=document.createElement("style");
    style.id="empSmartCareerRuntimeStyle";
    style.textContent=`
      #empSmartCareerOverlay .esc-modal{
        width:min(1080px,calc(100vw - 32px));
        height:min(940px,calc(100dvh - 24px));
        max-height:calc(100dvh - 24px);
      }
      #empSmartCareerOverlay .esc-head{padding:21px 24px 17px}
      #empSmartCareerOverlay .esc-head p{max-width:760px}
      #empSmartCareerOverlay .esc-body{padding:22px 24px 34px}
      #empSmartCareerOverlay .esc-foot{padding-left:24px;padding-right:24px}
      #empSmartCareerOverlay .esc-modal>#empSmartCareerMount{flex:1 1 auto;min-height:0;height:100%;display:flex;flex-direction:column;overflow:hidden}
      #empSmartCareerOverlay #empSmartCareerMount>form{flex:1 1 auto;min-height:0;height:100%}
      #empSmartCareerOverlay #empSmartCareerMount>.esc-success{flex:1 1 auto;min-height:0}

      .emp-career-passport-review{margin:14px 0;padding:14px 15px;border:1px solid #bcd6f2;border-radius:13px;background:linear-gradient(135deg,#f7fbff,#eef6ff);color:#344054}
      .emp-career-passport-review-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.emp-career-passport-review-head strong{font-size:11px;color:#174a82}.emp-career-passport-verified{padding:4px 7px;border-radius:999px;background:#e8f7ee;color:#16713c;font-size:7px;font-weight:850}.emp-career-passport-review-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}.emp-career-passport-review-grid div{padding:9px;border:1px solid #dce8f5;border-radius:9px;background:#fff}.emp-career-passport-review-grid span{display:block;color:#98a2b3;font-size:7px}.emp-career-passport-review-grid b{display:block;margin-top:3px;color:#344054;font-size:9px;line-height:1.35}.emp-career-application-kind{margin:8px 0 0;display:inline-flex;padding:5px 8px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:8px;font-weight:800}
      @media(max-width:760px){
        #empSmartCareerOverlay .esc-modal{width:100%;height:94dvh;max-height:94dvh}
        #empSmartCareerOverlay .esc-head{padding:15px 16px 12px}
        #empSmartCareerOverlay .esc-body{padding:15px 16px 25px}
        #empSmartCareerOverlay .esc-foot{padding-left:16px;padding-right:16px}
        .emp-career-passport-review-grid{grid-template-columns:1fr 1fr}
      }
    `;
    document.head.appendChild(style);
  }

  function normalizedText(node){
    return String(node?.textContent || "").replace(/\s+/g," ").trim();
  }

  function replaceExactText(root,from,to){
    if(!root) return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    let current;
    while((current=walker.nextNode())) nodes.push(current);

    nodes.forEach(node=>{
      if(String(node.nodeValue || "").trim().toLowerCase() === from.toLowerCase()){
        const leading=String(node.nodeValue || "").match(/^\s*/)?.[0] || "";
        const trailing=String(node.nodeValue || "").match(/\s*$/)?.[0] || "";
        node.nodeValue=`${leading}${to}${trailing}`;
      }
    });
  }

  function clarifyCareerHubCopy(root=document){
    replaceExactText(root,"New School Proposal","Create Proposal");
    replaceExactText(root,"New school proposal","Create Proposal");

    root.querySelectorAll?.(".esc-section-head strong").forEach(title=>{
      if(normalizedText(title).toLowerCase() !== "connect existing opportunities") return;

      title.textContent="Attach an existing job, internship or project (optional)";

      const help=title.parentElement?.querySelector("span");
      if(help){
        help.textContent="Use this only when you already created the job, internship or project in Programs. Linking it lets Campus participants apply to that same opportunity, so you do not create the same listing twice. You can leave this empty.";
      }
    });
  }

  async function loadEmployerApplicationPassport(applicationId){
    const manager=document.getElementById("employerCareerApplicationManager");
    if(!manager || manager.hidden || !applicationId) return;

    const existing=manager.querySelector("[data-employer-career-passport]");
    if(existing?.dataset.applicationId === String(applicationId)) return;
    existing?.remove();

    try{
      const response=await fetch(`${API}/api/internship-applications/${encodeURIComponent(applicationId)}`,{
        cache:"no-store",
        headers:{Authorization:`Bearer ${employerToken()}`}
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok) return;

      const application=data.application || data.item || data;
      const passport=application?.passportSnapshot || {};
      const profile=String(application?.applicationProfile || application?.opportunityId?.type || "career application").replaceAll("_"," ");

      const block=document.createElement("section");
      block.dataset.employerCareerPassport="1";
      block.dataset.applicationId=String(applicationId);

      if(passport.included === true && passport.verified === true){
        block.className="emp-career-passport-review";
        block.innerHTML=`<div class="emp-career-passport-review-head"><strong>AIFT Opportunity Passport</strong><span class="emp-career-passport-verified">School verified</span></div><span class="emp-career-application-kind">${esc(profile)}</span><div class="emp-career-passport-review-grid"><div><span>AIFT Student ID</span><b>${esc(passport.aiftStudentId || "—")}</b></div><div><span>Verified School</span><b>${esc(passport.schoolName || "—")}</b></div><div><span>Program</span><b>${esc(passport.program || "—")}</b></div><div><span>Year level</span><b>${esc(passport.yearLevel || "—")}</b></div></div>`;
      }else{
        block.className="emp-career-passport-review";
        block.innerHTML=`<div class="emp-career-passport-review-head"><strong>AIFT Career Application</strong><span class="emp-career-application-kind">${esc(profile)}</span></div><div style="margin-top:7px;color:#667085;font-size:8.5px">The applicant did not include a verified AIFT Passport with this submission.</div>`;
      }

      const head=manager.querySelector(".employer-career-application-manager-head");
      if(head?.parentNode) head.insertAdjacentElement("afterend",block);
      else manager.prepend(block);
    }catch(error){
      console.warn("Career application Passport preview skipped:",error?.message || error);
    }
  }

  function refreshVisibleApplicationPassport(){
    const manager=document.getElementById("employerCareerApplicationManager");
    if(!manager || manager.hidden) return;
    const applicationId=String(document.getElementById("employerCareerApplicationId")?.value || "").trim();
    if(applicationId) loadEmployerApplicationPassport(applicationId);
  }

  let copyTimer=null;
  function scheduleCopyRefresh(){
    clearTimeout(copyTimer);
    copyTimer=setTimeout(()=>{
      clarifyCareerHubCopy(document);
      refreshVisibleApplicationPassport();
    },0);
  }

  const observer=new MutationObserver(mutations=>{
    if(!mutations.some(item=>item.addedNodes?.length || item.type === "characterData" || item.type === "attributes")) return;
    scheduleCopyRefresh();
  });

  if(document.documentElement){
    observer.observe(document.documentElement,{
      childList:true,
      subtree:true,
      characterData:true,
      attributes:true,
      attributeFilter:["hidden","value"]
    });
  }

  clarifyCareerHubCopy(document);

  let refreshTimer=null;

  function refreshEmployerCareerHub(){
    clearTimeout(refreshTimer);
    refreshTimer=setTimeout(async()=>{
      if(typeof window.loadEmployerCareerHub !== "function") return;

      try{
        await window.loadEmployerCareerHub({force:true});

        const current=String(
          window.state?.careerHub?.currentView ||
          window.state?.careerHub?.activeView ||
          ""
        ).toLowerCase();

        if(current === "programs" && typeof window.renderEmployerCareerPrograms === "function") window.renderEmployerCareerPrograms();
        if(current === "campus" && typeof window.renderEmployerCareerCampus === "function") window.renderEmployerCareerCampus();
        if(current === "partnerships" && typeof window.renderEmployerCareerPartnerships === "function") window.renderEmployerCareerPartnerships();

        scheduleCopyRefresh();
      }catch(error){
        console.warn("Employer Career Hub refresh skipped:",error?.message || error);
      }
    },250);
  }

  window.addEventListener("aift:activity-updated",event=>{
    const source=String(event?.detail?.source || "");
    if(
      source.startsWith("employer-smart-") ||
      source === "employer-campus-program" ||
      source === "company-partnership-workspace" ||
      source === "student-career-application"
    ){
      refreshEmployerCareerHub();
    }
  });
})();
