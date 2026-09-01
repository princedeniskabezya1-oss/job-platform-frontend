(() => {
  "use strict";

  const PAGE=String(location.pathname.split("/").pop()||"").toLowerCase();
  const ROLE=String(localStorage.getItem("role")||"").toLowerCase();
  if(PAGE!=="student.html" || !["student","talent"].includes(ROLE)) return;

  const API=window.API_BASE || "https://backend-1-9b6f.onrender.com";
  const state={
    activeCategory:"",
    opportunities:[],
    applications:[],
    passport:null,
    user:null,
    portfolio:null,
    loading:false,
    selectedOpportunity:null
  };

  function token(){
    for(const key of ["studentToken","talentToken","token"]){
      const value=localStorage.getItem(key)||sessionStorage.getItem(key);
      if(value) return value;
    }
    return "";
  }
  function esc(value){
    return String(value??"")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }
  function id(value){
    if(value && typeof value==="object") return String(value._id||value.id||"");
    return String(value||"");
  }
  function title(value){
    return String(value||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
  }
  function array(value,keys=[]){
    if(Array.isArray(value)) return value;
    for(const key of keys) if(Array.isArray(value?.[key])) return value[key];
    if(Array.isArray(value?.items)) return value.items;
    return [];
  }
  async function api(path,options={}){
    const response=await fetch(API+path,{
      ...options,
      cache:"no-store",
      headers:{
        Authorization:`Bearer ${token()}`,
        ...(options.body?{"Content-Type":"application/json"}:{}),
        ...(options.headers||{})
      }
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok){
      const error=new Error(data.message||`Request failed (${response.status})`);
      error.status=response.status;
      error.data=data;
      throw error;
    }
    return data;
  }

  function ensureStyles(){
    if(document.getElementById("studentCareerV2Styles")) return;
    const style=document.createElement("style");
    style.id="studentCareerV2Styles";
    style.textContent=`
      #section-career .scv2-panel{margin:0 0 18px;border:1px solid #dfe5ec;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(15,23,42,.055);overflow:hidden}
      #section-career .scv2-panel[hidden]{display:none!important}.scv2-head{padding:18px 20px;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;border-bottom:1px solid #e9edf2;background:linear-gradient(180deg,#fff,#fafcff)}.scv2-eyebrow{display:block;color:#1a73e8;font-size:8px;font-weight:850;letter-spacing:.09em}.scv2-head h3{margin:5px 0 4px;color:#172033;font-size:19px}.scv2-head p{max-width:720px;margin:0;color:#667085;font-size:10px;line-height:1.55}.scv2-head-actions{display:flex;gap:7px;flex:0 0 auto}.scv2-btn{min-height:37px;padding:0 12px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#344054;font-size:9px;font-weight:800;cursor:pointer}.scv2-btn.primary{border-color:#1a73e8;background:#1a73e8;color:#fff}.scv2-btn.soft{border-color:#bfd7f5;background:#eef6ff;color:#1765cc}.scv2-btn.danger{border-color:#efcaca;background:#fff5f5;color:#b42318}.scv2-btn:disabled{opacity:.55;cursor:not-allowed}.scv2-tools{padding:12px 20px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;border-bottom:1px solid #edf1f5}.scv2-search{height:38px;padding:0 12px;border:1px solid #d7dee8;border-radius:9px;outline:none;font-size:10px}.scv2-search:focus{border-color:#1a73e8;box-shadow:0 0 0 3px rgba(26,115,232,.09)}.scv2-count{min-height:38px;padding:0 11px;display:flex;align-items:center;border:1px solid #e2e7ed;border-radius:9px;background:#fafbfc;color:#667085;font-size:9px;font-weight:750}.scv2-list{padding:6px 20px 20px}.scv2-card{padding:15px 0;display:grid;grid-template-columns:48px minmax(0,1fr) auto;align-items:start;gap:13px;border-bottom:1px solid #edf1f5}.scv2-card:last-child{border-bottom:0}.scv2-logo{width:48px;height:48px;display:grid;place-items:center;border:1px solid #e0e6ee;border-radius:12px;background:#f6f9fd;color:#1a73e8;font-size:16px}.scv2-copy{min-width:0}.scv2-copy h4{margin:0;color:#172033;font-size:13px}.scv2-org{display:block;margin-top:4px;color:#667085;font-size:9px}.scv2-desc{margin:7px 0 0;color:#475467;font-size:9px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.scv2-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.scv2-meta span,.scv2-status{padding:5px 7px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:7.5px;font-weight:750}.scv2-meta span.blue{background:#eef6ff;color:#1765cc}.scv2-status.pending,.scv2-status.review{background:#fff4dc;color:#946200}.scv2-status.shortlisted,.scv2-status.interview,.scv2-status.approved,.scv2-status.active,.scv2-status.completed{background:#e8f7ee;color:#16713c}.scv2-status.rejected,.scv2-status.withdrawn{background:#fdeceb;color:#b42318}.scv2-actions{display:flex;gap:7px;align-items:center;justify-content:flex-end;flex-wrap:wrap}.scv2-empty{padding:35px 16px;text-align:center;color:#667085;font-size:10px}.scv2-empty strong{display:block;margin-bottom:5px;color:#172033;font-size:12px}
      .scv2-modal{position:fixed;inset:0;z-index:999997;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.54);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}.scv2-modal[hidden]{display:none!important}.scv2-dialog{width:min(940px,100%);max-height:calc(100dvh - 32px);min-height:0;display:flex;flex-direction:column;overflow:hidden;border:1px solid #dce3eb;border-radius:18px;background:#fff;box-shadow:0 30px 90px rgba(15,23,42,.3)}.scv2-modal-head{padding:19px 21px 15px;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid #e8edf3}.scv2-modal-head span{display:block;color:#1a73e8;font-size:8px;font-weight:850;letter-spacing:.08em}.scv2-modal-head h3{margin:5px 0 4px;color:#172033;font-size:20px}.scv2-modal-head p{margin:0;color:#667085;font-size:10px;line-height:1.5}.scv2-close{width:36px;height:36px;flex:0 0 36px;border:1px solid #dce3eb;border-radius:9px;background:#fff;color:#667085;font-size:20px}.scv2-modal-body{flex:1 1 auto;min-height:0;overflow:auto;padding:20px 21px 28px}.scv2-detail-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(260px,.65fr);gap:18px}.scv2-section{margin-bottom:18px}.scv2-section:last-child{margin-bottom:0}.scv2-section h4{margin:0 0 7px;color:#172033;font-size:12px}.scv2-section p{margin:0;color:#475467;font-size:10px;line-height:1.65;white-space:pre-line}.scv2-side{padding:14px;border:1px solid #e4e9f0;border-radius:13px;background:#fafbfc}.scv2-side-row{padding:9px 0;border-bottom:1px solid #e8edf3}.scv2-side-row:last-child{border-bottom:0}.scv2-side-row span{display:block;color:#98a2b3;font-size:7.5px}.scv2-side-row strong{display:block;margin-top:3px;color:#344054;font-size:9.5px}.scv2-modal-foot{padding:11px 21px;display:flex;justify-content:space-between;gap:10px;border-top:1px solid #e8edf3;background:#fff}.scv2-modal-foot-right{display:flex;gap:8px}
      .scv2-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.scv2-field{display:flex;flex-direction:column;gap:5px}.scv2-field.full{grid-column:1/-1}.scv2-field label{color:#344054;font-size:9px;font-weight:800}.scv2-field input,.scv2-field textarea,.scv2-field select{width:100%;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#172033;font:500 10px/1.45 Inter,Arial,sans-serif;outline:none}.scv2-field input,.scv2-field select{height:40px;padding:0 10px}.scv2-field textarea{min-height:94px;padding:10px;resize:vertical}.scv2-field small{color:#98a2b3;font-size:8px;line-height:1.45}.scv2-check{padding:12px 13px;display:flex;align-items:flex-start;gap:10px;border:1px solid #dfe6ee;border-radius:11px;background:#fafcff}.scv2-check input{margin-top:2px}.scv2-check strong{display:block;color:#344054;font-size:9.5px}.scv2-check span{display:block;margin-top:3px;color:#667085;font-size:8.5px;line-height:1.45}.scv2-passport{padding:14px;border:1px solid #bed8f4;border-radius:12px;background:linear-gradient(135deg,#f5f9ff,#eef6ff)}.scv2-passport-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.scv2-passport strong{color:#16437f;font-size:10px}.scv2-passport-badge{padding:4px 7px;border-radius:999px;background:#e8f7ee;color:#16713c;font-size:7px;font-weight:850}.scv2-passport-badge.pending{background:#fff4dc;color:#946200}.scv2-passport p{margin:5px 0 0;color:#53657a;font-size:8.5px;line-height:1.5}.scv2-apps{margin:14px 0 0;padding:14px;border:1px solid #dfe5ec;border-radius:14px;background:#fff}.scv2-apps-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}.scv2-apps-head strong{color:#172033;font-size:12px}.scv2-app-row{padding:10px 0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;border-top:1px solid #edf1f5}.scv2-app-row:first-of-type{border-top:0}.scv2-app-row h5{margin:0;color:#172033;font-size:10px}.scv2-app-row p{margin:3px 0 0;color:#667085;font-size:8px}.scv2-quick-passport{margin-top:10px;padding:10px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #d9e6f6;border-radius:10px;background:#f7fbff}.scv2-quick-passport div{min-width:0}.scv2-quick-passport span{display:block;color:#1a73e8;font-size:7px;font-weight:850}.scv2-quick-passport strong{display:block;margin-top:2px;color:#344054;font-size:9px}.scv2-message{margin-bottom:12px;padding:10px 11px;border-radius:9px;background:#fff5f5;color:#b42318;font-size:9px}.scv2-message.success{background:#edf9f1;color:#16713c}
      @media(max-width:760px){.scv2-head{padding:15px 16px;display:grid}.scv2-head-actions{width:100%}.scv2-head-actions .scv2-btn{flex:1}.scv2-tools{padding:10px 16px;grid-template-columns:1fr}.scv2-list{padding:5px 16px 18px}.scv2-card{grid-template-columns:42px minmax(0,1fr);gap:10px}.scv2-logo{width:42px;height:42px}.scv2-actions{grid-column:1/-1;justify-content:stretch}.scv2-actions .scv2-btn{flex:1}.scv2-modal{align-items:flex-end;padding:0}.scv2-dialog{width:100%;max-height:94dvh;border-radius:18px 18px 0 0}.scv2-detail-grid,.scv2-form-grid{grid-template-columns:1fr}.scv2-field.full{grid-column:auto}.scv2-modal-head,.scv2-modal-body,.scv2-modal-foot{padding-left:16px;padding-right:16px}.scv2-modal-foot{align-items:stretch;flex-direction:column}.scv2-modal-foot-right{display:grid;grid-template-columns:1fr 1fr}.scv2-app-row{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function offering(opportunity){
    return String(opportunity?.metadata?.offeringType || opportunity?.type || "opportunity").toLowerCase();
  }
  function applicationProfile(opportunity){
    const raw=String(opportunity?.metadata?.applicationKind || "").toLowerCase();
    if(raw.includes("graduate_program")) return "graduate_program";
    if(raw.includes("internship")) return "internship";
    if(raw.includes("project")) return "project";
    if(raw.includes("placement")) return "placement";
    if(raw.includes("job")) return "job";
    if(opportunity?.type === "internship") return "internship";
    if(opportunity?.type === "project") return "project";
    if(opportunity?.type === "placement") return offering(opportunity)==="graduate_program" ? "graduate_program" : "placement";
    return "job";
  }
  function offeringLabel(opportunity){
    const labels={
      job:"Job",internship:"Internship",student_project:"Student Project",freelance_project:"Freelance Project",
      graduate_program:"Graduate Program",apprenticeship:"Apprenticeship / Placement",volunteer_project:"Volunteer Project",
      project:"Project",placement:"Placement"
    };
    return labels[offering(opportunity)] || title(offering(opportunity));
  }
  function organization(opportunity){
    const owner=opportunity?.employerId || opportunity?.companyId || {};
    return owner.companyName || owner.name || opportunity?.companyName || "AIFT Employer";
  }
  function applicationFor(opportunityId){
    return state.applications.find(item=>id(item?.opportunityId)===String(opportunityId) || id(item?.opportunityId?._id)===String(opportunityId)) || null;
  }
  function formatDate(value){
    if(!value) return "Not specified";
    const date=new Date(value);
    return Number.isNaN(date.getTime()) ? "Not specified" : date.toLocaleDateString([], {year:"numeric",month:"short",day:"numeric"});
  }
  function compensation(opportunity){
    const c=opportunity?.compensation || {};
    if(!c.type || c.type === "not_specified") return "Not specified";
    if(c.amount) return `${String(c.currency||"PHP").toUpperCase()} ${Number(c.amount).toLocaleString()} ${c.period && c.period!=="unspecified" ? `/ ${String(c.period).replaceAll("_"," ")}` : ""}`.trim();
    return title(c.type);
  }

  async function loadApplications(){
    try{
      const data=await api("/api/internship-applications");
      state.applications=array(data,["applications"]);
    }catch{
      state.applications=[];
    }
  }

  async function loadProfileAssets(force=false){
    if(state.user && state.portfolio && state.passport && !force) return;
    const passportPromise=window.AIFTStudentPassport?.load
      ? window.AIFTStudentPassport.load(force).catch(()=>null)
      : api("/api/student-identity/me").catch(error=>({verified:false,message:error.message,identity:null}));
    const [userResult,portfolioResult,passportResult]=await Promise.allSettled([
      api("/api/users/me"),
      api("/api/student-portfolio/me"),
      passportPromise
    ]);
    if(userResult.status === "fulfilled") state.user=userResult.value?.user || userResult.value?.data || userResult.value || {};
    if(portfolioResult.status === "fulfilled") state.portfolio=portfolioResult.value?.portfolio || portfolioResult.value?.data || portfolioResult.value || {};
    if(passportResult.status === "fulfilled"){
      const value=passportResult.value || {};
      state.passport=value.user ? value : {
        user:state.user || {},
        identity:value.identity || null,
        verified:value.verified === true,
        identityMessage:value.message || ""
      };
    }
  }

  function panelHost(){
    return document.querySelector("#section-career .student-career-main");
  }
  function ensurePanel(){
    const host=panelHost();
    if(!host) return null;
    let panel=document.getElementById("studentCareerV2Panel");
    if(!panel){
      panel=document.createElement("section");
      panel.id="studentCareerV2Panel";
      panel.className="scv2-panel";
      panel.hidden=true;
      host.prepend(panel);
    }
    return panel;
  }
  function hideOriginalCareerCards(hide){
    const host=panelHost();
    if(!host) return;
    [...host.children].forEach(child=>{
      if(child.id === "studentCareerV2Panel") return;
      if(child.id === "studentCareerFocusPanel") child.hidden=true;
      else if(child.classList?.contains("student-career-card")) child.hidden=hide;
    });
  }

  const CATEGORY_CONFIG={
    internships:{title:"Internships",copy:"Apply to verified internships through one AIFT Career Application and optionally include your AIFT Passport.",types:["internship"]},
    jobs:{title:"Jobs",copy:"Explore Employer Career Hub jobs and graduate-ready roles with a clearer application path.",types:["job"]},
    projects:{title:"Projects",copy:"Join student, freelance and volunteer projects where your skills and work samples matter more than a generic résumé form.",types:["project"]},
    "graduate-programs":{title:"Graduate Programs & Placements",copy:"Explore graduate programs, apprenticeships and placement pathways published by AIFT Employers.",types:["placement"]}
  };

  async function fetchCategory(category){
    const config=CATEGORY_CONFIG[category];
    if(!config) return [];
    const groups=await Promise.all(config.types.map(async type=>{
      const data=await api(`/api/opportunities?type=${encodeURIComponent(type)}`);
      return array(data,["opportunities"]);
    }));
    let items=groups.flat().filter(item=>["approved","open","active"].includes(String(item.status||"").toLowerCase()));
    if(category === "graduate-programs") items=items.filter(item=>["graduate_program","apprenticeship","placement"].includes(offering(item)));
    if(category === "projects") items=items.filter(item=>["student_project","freelance_project","volunteer_project","project"].includes(offering(item)));
    return items.sort((a,b)=>new Date(b.publishedAt||b.updatedAt||b.createdAt||0)-new Date(a.publishedAt||a.updatedAt||a.createdAt||0));
  }

  function renderMarketplace(items=state.opportunities){
    const panel=ensurePanel();
    const config=CATEGORY_CONFIG[state.activeCategory];
    if(!panel || !config) return;
    panel.innerHTML=`
      <header class="scv2-head">
        <div><span class="scv2-eyebrow">AIFT CAREER MARKETPLACE</span><h3>${esc(config.title)}</h3><p>${esc(config.copy)}</p></div>
        <div class="scv2-head-actions"><button type="button" class="scv2-btn" data-scv2-applications>My Applications</button><button type="button" class="scv2-btn" data-scv2-close-market>Back to Career Hub</button></div>
      </header>
      <div class="scv2-tools"><input id="scv2Search" class="scv2-search" type="search" placeholder="Search ${esc(config.title.toLowerCase())}..."><div class="scv2-count">${items.length} ${items.length===1?"opportunity":"opportunities"}</div></div>
      <div class="scv2-list">${items.length?items.map(renderOpportunityCard).join(""):'<div class="scv2-empty"><strong>No live opportunities right now.</strong>New AIFT-approved opportunities will appear here automatically.</div>'}</div>`;
    panel.hidden=false;
    panel.scrollIntoView({behavior:"smooth",block:"start"});
  }

  function renderOpportunityCard(opportunity){
    const opportunityId=id(opportunity);
    const application=applicationFor(opportunityId);
    const applied=Boolean(application);
    const direct=opportunity.allowStudentApplications !== false;
    const status=String(application?.status||"").toLowerCase();
    return `<article class="scv2-card" data-scv2-opportunity-id="${esc(opportunityId)}">
      <div class="scv2-logo"><i class="fa-solid ${applicationProfile(opportunity)==="project"?"fa-diagram-project":applicationProfile(opportunity)==="internship"?"fa-briefcase":"fa-building"}"></i></div>
      <div class="scv2-copy"><h4>${esc(opportunity.title||"Career opportunity")}</h4><span class="scv2-org">${esc(organization(opportunity))}${opportunity.location?` · ${esc(opportunity.location)}`:""}</span><p class="scv2-desc">${esc(opportunity.summary||opportunity.description||"Open the opportunity for full details.")}</p><div class="scv2-meta"><span class="blue">${esc(offeringLabel(opportunity))}</span>${opportunity.workSetup&&opportunity.workSetup!=="unspecified"?`<span>${esc(title(opportunity.workSetup))}</span>`:""}${opportunity.deadline?`<span>Apply by ${esc(formatDate(opportunity.deadline))}</span>`:""}${opportunity.programs?.length?`<span>${esc(opportunity.programs.slice(0,2).join(" · "))}</span>`:""}</div></div>
      <div class="scv2-actions"><button type="button" class="scv2-btn" data-scv2-view="${esc(opportunityId)}">View details</button>${applied?`<button type="button" class="scv2-btn soft" data-scv2-open-application="${esc(id(application))}"><span class="scv2-status ${esc(status)}">${esc(title(status))}</span></button>`:direct?`<button type="button" class="scv2-btn primary" data-scv2-apply="${esc(opportunityId)}">Apply</button>`:`<button type="button" class="scv2-btn" disabled>School recommendation only</button>`}</div>
    </article>`;
  }

  async function openMarketplace(category){
    const config=CATEGORY_CONFIG[category];
    if(!config) return;
    ensureStyles();
    state.activeCategory=category;
    hideOriginalCareerCards(true);
    const panel=ensurePanel();
    panel.hidden=false;
    panel.innerHTML=`<div class="scv2-empty"><strong>Loading ${esc(config.title)}…</strong>AIFT is checking live approved opportunities.</div>`;
    try{
      const [items]=await Promise.all([fetchCategory(category),loadApplications()]);
      state.opportunities=items;
      renderMarketplace(items);
    }catch(error){
      panel.innerHTML=`<header class="scv2-head"><div><span class="scv2-eyebrow">AIFT CAREER MARKETPLACE</span><h3>${esc(config.title)}</h3><p>${esc(error.message)}</p></div><div class="scv2-head-actions"><button class="scv2-btn" data-scv2-close-market>Back</button></div></header><div class="scv2-empty"><strong>Could not load this marketplace.</strong>Please try again.</div>`;
    }
  }

  function closeMarketplace(){
    const panel=ensurePanel();
    if(panel) panel.hidden=true;
    hideOriginalCareerCards(false);
    state.activeCategory="";
  }

  function ensureModal(){
    let modal=document.getElementById("studentCareerV2Modal");
    if(modal) return modal;
    modal=document.createElement("div");
    modal.id="studentCareerV2Modal";
    modal.className="scv2-modal";
    modal.hidden=true;
    modal.innerHTML='<section class="scv2-dialog" role="dialog" aria-modal="true"><div id="studentCareerV2ModalMount" style="min-height:0;display:flex;flex:1 1 auto;flex-direction:column;overflow:hidden"></div></section>';
    modal.addEventListener("click",event=>{if(event.target===modal || event.target.closest("[data-scv2-close-modal]")) closeModal();});
    document.body.appendChild(modal);
    return modal;
  }
  function showModal(html){
    const modal=ensureModal();
    document.getElementById("studentCareerV2ModalMount").innerHTML=html;
    modal.hidden=false;
    document.body.style.overflow="hidden";
  }
  function closeModal(){
    const modal=document.getElementById("studentCareerV2Modal");
    if(modal) modal.hidden=true;
    document.body.style.overflow="";
    state.selectedOpportunity=null;
  }
  function modalHead(kicker,heading,copy){
    return `<header class="scv2-modal-head"><div><span>${esc(kicker)}</span><h3>${esc(heading)}</h3><p>${esc(copy)}</p></div><button class="scv2-close" type="button" data-scv2-close-modal>×</button></header>`;
  }

  async function getOpportunity(opportunityId){
    const cached=state.opportunities.find(item=>id(item)===String(opportunityId));
    if(cached) return cached;
    const data=await api(`/api/opportunities/${encodeURIComponent(opportunityId)}`);
    return data?.opportunity || data?.item || data;
  }

  async function openDetails(opportunityId){
    try{
      const opportunity=await getOpportunity(opportunityId);
      state.selectedOpportunity=opportunity;
      const application=applicationFor(id(opportunity));
      showModal(`${modalHead("AIFT CAREER OPPORTUNITY",opportunity.title||"Opportunity",`${organization(opportunity)} · ${offeringLabel(opportunity)}`)}<div class="scv2-modal-body"><div class="scv2-detail-grid"><main><section class="scv2-section"><h4>About this opportunity</h4><p>${esc(opportunity.description||opportunity.summary||"No description added.")}</p></section>${opportunity.responsibilities?.length?`<section class="scv2-section"><h4>What you will do</h4><p>${esc(opportunity.responsibilities.map(item=>`• ${item}`).join("\n"))}</p></section>`:""}${opportunity.requirements?.length?`<section class="scv2-section"><h4>What they are looking for</h4><p>${esc(opportunity.requirements.map(item=>`• ${item}`).join("\n"))}</p></section>`:""}</main><aside class="scv2-side"><div class="scv2-side-row"><span>Opportunity type</span><strong>${esc(offeringLabel(opportunity))}</strong></div><div class="scv2-side-row"><span>Work setup</span><strong>${esc(title(opportunity.workSetup||"Not specified"))}</strong></div><div class="scv2-side-row"><span>Location</span><strong>${esc(opportunity.location||"Not specified")}</strong></div><div class="scv2-side-row"><span>Compensation</span><strong>${esc(compensation(opportunity))}</strong></div><div class="scv2-side-row"><span>Deadline</span><strong>${esc(formatDate(opportunity.deadline))}</strong></div>${opportunity.programs?.length?`<div class="scv2-side-row"><span>Relevant programs</span><strong>${esc(opportunity.programs.join(", "))}</strong></div>`:""}${opportunity.skills?.length?`<div class="scv2-side-row"><span>Skills</span><strong>${esc(opportunity.skills.join(", "))}</strong></div>`:""}</aside></div></div><footer class="scv2-modal-foot"><button class="scv2-btn" type="button" data-scv2-close-modal>Close</button><div class="scv2-modal-foot-right">${application?`<button class="scv2-btn soft" type="button" data-scv2-open-application="${esc(id(application))}">View my application</button>`:opportunity.allowStudentApplications===false?`<button class="scv2-btn" disabled>School recommendation only</button>`:`<button class="scv2-btn primary" type="button" data-scv2-apply="${esc(id(opportunity))}">Apply now</button>`}</div></footer>`);
    }catch(error){
      showModal(`${modalHead("AIFT CAREER OPPORTUNITY","Unable to load opportunity",error.message)}<div class="scv2-modal-body"></div>`);
    }
  }

  function passportSchool(passport){
    return passport?.identity?.schoolId?.schoolName || passport?.identity?.schoolId?.name || passport?.identity?.school?.schoolName || passport?.identity?.school?.name || "Verified School";
  }
  function passportId(passport){ return passport?.identity?.aiftStudentId || ""; }
  function profileResume(){ return String(state.portfolio?.resumeUrl || state.user?.cvUrl || "").trim(); }
  function profilePortfolioUrl(){
    if(String(state.portfolio?.visibility||"").toLowerCase()!=="public") return "";
    const userId=id(state.user);
    return userId ? `${location.origin}/student-public-profile.html?id=${encodeURIComponent(userId)}` : "";
  }

  function applicationFields(profile){
    if(profile === "internship") return `<div class="scv2-field full"><label>Why are you interested in this internship?</label><textarea id="scv2Motivation" required placeholder="What do you want to learn and contribute?"></textarea></div><div class="scv2-field"><label>Availability</label><input id="scv2Availability" placeholder="Example: 20 hours/week"></div><div class="scv2-field"><label>Preferred start date</label><input id="scv2StartDate" type="date"></div>`;
    if(profile === "project") return `<div class="scv2-field full"><label>Your proposal / approach</label><textarea id="scv2ProjectProposal" required placeholder="How would you contribute to this project or deliverable?"></textarea></div><div class="scv2-field"><label>Availability</label><input id="scv2Availability" placeholder="Example: Evenings and weekends"></div><div class="scv2-field"><label>Work sample URL</label><input id="scv2WorkSample" type="url" placeholder="Portfolio, GitHub, design or project link"></div>`;
    if(profile === "graduate_program") return `<div class="scv2-field full"><label>Why this graduate program?</label><textarea id="scv2Motivation" required placeholder="Tell the Employer what you want to build or learn."></textarea></div><div class="scv2-field"><label>Expected / actual graduation</label><input id="scv2Graduation" placeholder="Example: 2026"></div><div class="scv2-field"><label>Availability</label><input id="scv2Availability" placeholder="Example: Available June 2026"></div>`;
    if(profile === "placement") return `<div class="scv2-field full"><label>Why are you interested in this placement?</label><textarea id="scv2Motivation" required></textarea></div><div class="scv2-field"><label>Availability</label><input id="scv2Availability"></div><div class="scv2-field"><label>Preferred start date</label><input id="scv2StartDate" type="date"></div>`;
    return `<div class="scv2-field full"><label>Cover letter / introduction</label><textarea id="scv2CoverLetter" required placeholder="Briefly explain why you fit this role."></textarea></div><div class="scv2-field full"><label>Availability</label><input id="scv2Availability" placeholder="Example: Available immediately"></div>`;
  }

  async function openApply(opportunityId){
    try{
      const [opportunity]=await Promise.all([getOpportunity(opportunityId),loadProfileAssets()]);
      state.selectedOpportunity=opportunity;
      const profile=applicationProfile(opportunity);
      const resume=profileResume();
      const portfolio=profilePortfolioUrl();
      const passport=state.passport || {};
      const passportVerified=passport.verified === true && Boolean(passportId(passport));
      showModal(`<form id="studentCareerV2ApplicationForm" style="min-height:0;display:flex;flex:1 1 auto;flex-direction:column;overflow:hidden">${modalHead("AIFT CAREER APPLICATION",`Apply for ${opportunity.title||"opportunity"}`,`${offeringLabel(opportunity)} · ${organization(opportunity)}`)}<div class="scv2-modal-body"><div id="scv2FormMessage" class="scv2-message" hidden></div><section class="scv2-section"><h4>Your AIFT application profile</h4><div class="scv2-passport"><div class="scv2-passport-top"><strong>AIFT Opportunity Passport</strong><span class="scv2-passport-badge ${passportVerified?"":"pending"}">${passportVerified?"School verified":"Not verified yet"}</span></div><p>${passportVerified?`${passportId(passport)} · ${passportSchool(passport)}. You can include this trusted identity snapshot with the application.`:"Your Passport becomes verified after a School-controlled AIFT relationship is confirmed. You can still submit without it."}</p></div></section><section class="scv2-section"><div class="scv2-form-grid">${applicationFields(profile)}<div class="scv2-field full"><label>Resume</label><input id="scv2ResumeUrl" type="url" value="${esc(resume)}" placeholder="Resume URL"><small>${resume?"Loaded from your AIFT Portfolio. You can replace it for this application.":"Add a résumé in Portfolio or paste a secure résumé link."}</small></div><div class="scv2-field full"><label>Portfolio / profile</label><input id="scv2PortfolioUrl" type="url" value="${esc(portfolio)}" placeholder="Portfolio or public profile URL"><small>${portfolio?"Your public AIFT profile is ready to include.":"Optional. Make your AIFT Portfolio public if you want Employers to open it from the application."}</small></div><div class="scv2-field full"><label>Additional note (optional)</label><textarea id="scv2Message" placeholder="Anything else the Employer should know?"></textarea></div></div></section><section class="scv2-section"><label class="scv2-check"><input id="scv2IncludePassport" type="checkbox" ${passportVerified?"checked":"disabled"}><span><strong>Include my AIFT Passport</strong><span>${passportVerified?"Employer and AIFT will receive a trusted snapshot of your verified Student ID, School, program and year level.":"Complete School verification to enable the Passport for future applications."}</span></span></label></section></div><footer class="scv2-modal-foot"><button class="scv2-btn" type="button" data-scv2-passport>${passportVerified?"View Passport":"Set up Passport"}</button><div class="scv2-modal-foot-right"><button class="scv2-btn" type="button" data-scv2-close-modal>Cancel</button><button id="scv2SubmitApplication" class="scv2-btn primary" type="submit">Submit application</button></div></footer></form>`);
      document.getElementById("studentCareerV2ApplicationForm")?.addEventListener("submit",submitApplication);
    }catch(error){
      showModal(`${modalHead("AIFT CAREER APPLICATION","Application unavailable",error.message)}<div class="scv2-modal-body"></div>`);
    }
  }

  function field(idValue){ return String(document.getElementById(idValue)?.value||"").trim(); }
  async function submitApplication(event){
    event.preventDefault();
    const opportunity=state.selectedOpportunity;
    if(!opportunity) return;
    const button=document.getElementById("scv2SubmitApplication");
    const message=document.getElementById("scv2FormMessage");
    if(button){button.disabled=true;button.textContent="Submitting…";}
    if(message) message.hidden=true;
    try{
      const data=await api(`/api/opportunities/${encodeURIComponent(id(opportunity))}/apply`,{
        method:"POST",
        body:JSON.stringify({
          includePassport:document.getElementById("scv2IncludePassport")?.checked === true,
          coverLetter:field("scv2CoverLetter"),
          motivation:field("scv2Motivation"),
          availability:field("scv2Availability"),
          projectProposal:field("scv2ProjectProposal"),
          workSampleUrl:field("scv2WorkSample"),
          expectedGraduation:field("scv2Graduation"),
          preferredStartDate:field("scv2StartDate"),
          resumeUrl:field("scv2ResumeUrl"),
          portfolioUrl:field("scv2PortfolioUrl"),
          message:field("scv2Message")
        })
      });
      await loadApplications();
      if(message){message.classList.add("success");message.textContent=data.message||"Application submitted.";message.hidden=false;}
      if(button){button.textContent="Submitted";}
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"student-career-application",applicationId:id(data.application),reviewCase:data.reviewCase}}));
      setTimeout(()=>{closeModal();if(state.activeCategory) renderMarketplace(state.opportunities);renderApplicationsPanel();},900);
    }catch(error){
      if(message){message.classList.remove("success");message.textContent=error.message;message.hidden=false;}
      if(button){button.disabled=false;button.textContent="Submit application";}
    }
  }

  function statusCopy(status){
    const map={pending:"Submitted to AIFT Review",review:"Being reviewed",shortlisted:"Shortlisted",interview:"Interview stage",approved:"Approved",active:"Active placement",completed:"Completed",rejected:"Not selected",withdrawn:"Withdrawn"};
    return map[status] || title(status);
  }

  async function openApplication(applicationId){
    try{
      const data=await api(`/api/internship-applications/${encodeURIComponent(applicationId)}`);
      const application=data.application || data.item || data;
      const opportunity=application.opportunityId || {};
      const status=String(application.status||"pending").toLowerCase();
      const passport=application.passportSnapshot || {};
      showModal(`${modalHead("MY CAREER APPLICATION",opportunity.title||"Application",statusCopy(status))}<div class="scv2-modal-body"><div class="scv2-detail-grid"><main><section class="scv2-section"><h4>Application message</h4><p>${esc(application.coverLetter||application.answers?.motivation||application.answers?.projectProposal||application.message||"No additional message.")}</p></section>${application.answers?.availability?`<section class="scv2-section"><h4>Availability</h4><p>${esc(application.answers.availability)}</p></section>`:""}${passport.included?`<section class="scv2-section"><h4>AIFT Passport included</h4><div class="scv2-passport"><div class="scv2-passport-top"><strong>${esc(passport.aiftStudentId||"AIFT Student")}</strong><span class="scv2-passport-badge">Verified snapshot</span></div><p>${esc(passport.schoolName||"Verified School")}${passport.program?` · ${esc(passport.program)}`:""}${passport.yearLevel?` · ${esc(passport.yearLevel)}`:""}</p></div></section>`:""}</main><aside class="scv2-side"><div class="scv2-side-row"><span>Status</span><strong>${esc(statusCopy(status))}</strong></div><div class="scv2-side-row"><span>Application type</span><strong>${esc(title(application.applicationProfile||opportunity.type||"Career application"))}</strong></div><div class="scv2-side-row"><span>Submitted</span><strong>${esc(formatDate(application.createdAt))}</strong></div><div class="scv2-side-row"><span>AIFT Passport</span><strong>${passport.included&&passport.verified?"Included · verified":"Not included"}</strong></div></aside></div></div><footer class="scv2-modal-foot"><button class="scv2-btn" type="button" data-scv2-close-modal>Close</button><div class="scv2-modal-foot-right">${["pending","review","shortlisted","interview","approved"].includes(status)?`<button class="scv2-btn danger" type="button" data-scv2-withdraw="${esc(id(application))}">Withdraw application</button>`:""}</div></footer>`);
    }catch(error){
      showModal(`${modalHead("MY CAREER APPLICATION","Unable to load application",error.message)}<div class="scv2-modal-body"></div>`);
    }
  }

  async function withdrawApplication(applicationId){
    if(!confirm("Withdraw this application? The record will remain in your Career Hub history.")) return;
    try{
      await api(`/api/internship-applications/${encodeURIComponent(applicationId)}`,{method:"PATCH",body:JSON.stringify({status:"withdrawn"})});
      await loadApplications();
      closeModal();
      if(state.activeCategory) renderMarketplace(state.opportunities);
      renderApplicationsPanel();
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"student-career-application"}}));
    }catch(error){ alert(error.message); }
  }

  function renderApplicationsPanel(){
    const section=document.getElementById("studentCareerApplicationsSection");
    if(!section) return;
    let panel=document.getElementById("studentCareerV2Applications");
    if(!panel){
      panel=document.createElement("section");
      panel.id="studentCareerV2Applications";
      panel.className="scv2-apps";
      section.prepend(panel);
    }
    const applications=state.applications.slice().sort((a,b)=>new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0));
    panel.innerHTML=`<div class="scv2-apps-head"><div><span class="scv2-eyebrow">NEW CAREER HUB PIPELINE</span><strong>Jobs, internships, projects & placements</strong></div><span class="scv2-count">${applications.length} application${applications.length===1?"":"s"}</span></div>${applications.length?applications.slice(0,8).map(application=>{const opportunity=application.opportunityId||{};const status=String(application.status||"pending").toLowerCase();return `<div class="scv2-app-row"><div><h5>${esc(opportunity.title||"Career application")}</h5><p>${esc(title(application.applicationProfile||opportunity.type||"opportunity"))} · ${esc(statusCopy(status))}${application.passportSnapshot?.included?" · AIFT Passport included":""}</p></div><button type="button" class="scv2-btn" data-scv2-open-application="${esc(id(application))}">View</button></div>`;}).join(""):'<div class="scv2-empty"><strong>No new Career Hub applications yet.</strong>Applications to Employer Career Hub opportunities will appear here.</div>'}`;
  }

  function injectCategoryCards(){
    const grid=document.querySelector("#section-career .student-career-category-grid");
    if(!grid || grid.querySelector("[data-career-action='projects']")) return;
    const card=(action,icon,label,copy)=>`<button type="button" class="student-career-category-card jobs" data-career-action="${action}"><span class="student-career-category-icon"><i class="fa-solid ${icon}" aria-hidden="true"></i></span><span class="student-career-category-copy"><strong>${label}</strong><small>${copy}</small></span><span class="student-career-category-meta"><b>Explore</b><i class="fa-solid fa-arrow-right" aria-hidden="true"></i></span></button>`;
    grid.insertAdjacentHTML("beforeend",card("projects","fa-diagram-project","Projects","Student, freelance and volunteer work"));
    grid.insertAdjacentHTML("beforeend",card("graduate-programs","fa-user-graduate","Graduate Programs","Graduate, apprenticeship and placement paths"));
  }

  async function injectPassportQuick(){
    const readiness=document.querySelector("#section-career .student-career-readiness-card");
    if(!readiness || document.getElementById("studentCareerPassportQuick")) return;
    await loadProfileAssets().catch(()=>{});
    const passport=state.passport||{};
    const verified=passport.verified===true&&Boolean(passportId(passport));
    const block=document.createElement("div");
    block.id="studentCareerPassportQuick";
    block.className="scv2-quick-passport";
    block.innerHTML=`<div><span>AIFT OPPORTUNITY PASSPORT</span><strong>${verified?`${esc(passportId(passport))} · Ready for applications`:"Set up your verified career identity"}</strong></div><button type="button" class="scv2-btn soft" data-scv2-passport>${verified?"View":"Set up"}</button>`;
    readiness.appendChild(block);
  }

  async function openPassport(){
    if(window.AIFTStudentPassport?.open){
      await window.AIFTStudentPassport.open();
      return;
    }
    if(typeof window.openStudentStudioPage === "function") window.openStudentStudioPage("portfolio");
  }

  function bind(){
    document.addEventListener("click",async event=>{
      const categoryButton=event.target.closest("#section-career [data-career-action]");
      const category=String(categoryButton?.dataset?.careerAction||"");
      if(CATEGORY_CONFIG[category]){
        event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
        openMarketplace(category);
        return;
      }
      const closeMarket=event.target.closest("[data-scv2-close-market]");
      if(closeMarket){event.preventDefault();closeMarketplace();return;}
      const view=event.target.closest("[data-scv2-view]");
      if(view){event.preventDefault();openDetails(view.dataset.scv2View);return;}
      const apply=event.target.closest("[data-scv2-apply]");
      if(apply){event.preventDefault();openApply(apply.dataset.scv2Apply);return;}
      const openApp=event.target.closest("[data-scv2-open-application]");
      if(openApp){event.preventDefault();openApplication(openApp.dataset.scv2OpenApplication);return;}
      const withdraw=event.target.closest("[data-scv2-withdraw]");
      if(withdraw){event.preventDefault();withdrawApplication(withdraw.dataset.scv2Withdraw);return;}
      const passport=event.target.closest("[data-scv2-passport]");
      if(passport){event.preventDefault();openPassport();return;}
      const apps=event.target.closest("[data-scv2-applications]");
      if(apps){event.preventDefault();closeMarketplace();document.getElementById("studentCareerApplicationsSection")?.scrollIntoView({behavior:"smooth",block:"start"});return;}
    },true);

    document.addEventListener("input",event=>{
      if(event.target?.id!=="scv2Search") return;
      const query=String(event.target.value||"").trim().toLowerCase();
      const filtered=!query?state.opportunities:state.opportunities.filter(item=>`${item.title||""} ${organization(item)} ${item.summary||item.description||""} ${offeringLabel(item)} ${item.location||""} ${(item.skills||[]).join(" ")} ${(item.programs||[]).join(" ")}`.toLowerCase().includes(query));
      renderMarketplace(filtered);
      const search=document.getElementById("scv2Search");if(search){search.value=event.target.value;search.focus();}
    });
  }

  async function refresh(){
    await Promise.all([loadApplications(),loadProfileAssets(true).catch(()=>{})]);
    renderApplicationsPanel();
    injectCategoryCards();
    injectPassportQuick();
    if(state.activeCategory){
      state.opportunities=await fetchCategory(state.activeCategory).catch(()=>state.opportunities);
      renderMarketplace(state.opportunities);
    }
  }

  async function init(){
    ensureStyles();
    bind();
    const install=()=>{injectCategoryCards();injectPassportQuick();renderApplicationsPanel();};
    await loadApplications();
    install();
    const observer=new MutationObserver(()=>install());
    const career=document.getElementById("section-career")||document.body;
    observer.observe(career,{childList:true,subtree:true});
    window.addEventListener("aift:activity-updated",event=>{
      const source=String(event?.detail?.source||"");
      if(source==="student-career-application" || source==="review-status") refresh().catch(()=>{});
    });
    window.AIFTStudentCareerHub={refresh,openMarketplace,openApplication,openPassport};
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
