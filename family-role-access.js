(() => {
  "use strict";

  const API = window.API_BASE || "https://backend-1-9b6f.onrender.com";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const page = String(location.pathname.split("/").pop() || "").toLowerCase();
  if(page !== "family.html") return;

  const localRole = String(localStorage.getItem("role") || "").trim().toLowerCase();
  const state = {
    role: localRole,
    profile:null,
    reviews:[],
    rooms:[],
    interested:[],
    refreshing:false,
    observer:null
  };

  function token(){
    const map={student:"studentToken",talent:"talentToken",school:"schoolToken",employer:"employerToken",admin:"adminToken"};
    for(const key of [map[state.role],"token","studentToken","talentToken","schoolToken","employerToken","adminToken"].filter(Boolean)){
      const value=localStorage.getItem(key)||sessionStorage.getItem(key);
      if(value) return value;
    }
    return "";
  }

  function esc(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function title(value){
    return String(value || "member")
      .replaceAll("_"," ")
      .replaceAll("-"," ")
      .replace(/\b\w/g,c=>c.toUpperCase());
  }

  const originalFetch = window.fetch.bind(window);

  async function api(path){
    const response=await originalFetch(`${API}${path}`,{
      headers:{Authorization:`Bearer ${token()}`}
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
    return data;
  }

  function capabilities(){
    const role=state.role;
    return {
      familyProfile:role === "family",
      manageChildren:role === "family",
      applyScholarshipHere:role === "family",
      viewFamilyScholarshipApplications:role === "family",
      discoverScholarships:true,
      saveDiscovery:true,
      manageVentures:true,
      investorMode:true
    };
  }

  /*
    Family My Requests historically loads scholarship applications for every role.
    In this workspace those records are Family-owned applications only. Other roles
    keep the backend security boundary and receive an empty Family-workspace list.
    No detail or write endpoint is intercepted.
  */
  window.fetch = function(input,init={}){
    try{
      const url=new URL(typeof input === "string" ? input : input?.url,location.href);
      const method=String(init?.method || (typeof input !== "string" ? input?.method : "GET") || "GET").toUpperCase();
      if(url.pathname === "/api/scholarship-applications" && method === "GET" && state.role !== "family"){
        return Promise.resolve(new Response(JSON.stringify({
          success:true,
          applications:[],
          items:[],
          workspaceAccess:{canManageHere:false,role:state.role}
        }),{
          status:200,
          headers:{"Content-Type":"application/json"}
        }));
      }
    }catch{}
    return originalFetch(input,init);
  };

  function ensureStyle(){
    if($("#familyRoleAccessStyle")) return;
    const style=document.createElement("style");
    style.id="familyRoleAccessStyle";
    style.textContent=`
      .family-role-hidden{display:none!important}
      .family-role-guide{margin:14px 0;display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:14px}
      .family-access-card,.family-process-card{border:1px solid #e3e9f1;border-radius:16px;background:#fff;box-shadow:0 3px 14px rgba(15,23,42,.035);overflow:hidden}
      .family-access-card{padding:17px 18px;background:linear-gradient(135deg,#f7fbff 0%,#fff 55%,#f8f6ff 100%)}
      .family-access-kicker{display:flex;align-items:center;gap:7px;color:#0a66c2;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
      .family-access-card h2{margin:6px 0 5px;color:#172033;font-size:17px;line-height:1.3}
      .family-access-card p{margin:0;color:#667085;font-size:10px;line-height:1.6}
      .family-access-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
      .family-access-chip{padding:5px 8px;border:1px solid #dce5ef;border-radius:999px;background:#fff;color:#475467;font-size:8px;font-weight:750}
      .family-access-chip.good{border-color:#bee2d2;background:#effaf5;color:#137a50}
      .family-access-actions{display:flex;gap:7px;flex-wrap:wrap;margin-top:13px}
      .family-process-card{padding:15px 16px}
      .family-process-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:12px}
      .family-process-head h3{margin:0;color:#172033;font-size:13px}.family-process-head p{margin:4px 0 0;color:#667085;font-size:8px;line-height:1.5}
      .family-process-steps{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}
      .family-process-step{min-width:0;padding:10px 9px;border:1px solid #e4e9f0;border-radius:11px;background:#fbfcfe}
      .family-process-step b{width:22px;height:22px;display:grid;place-items:center;border-radius:7px;background:#eaf3ff;color:#0a66c2;font-size:8px}
      .family-process-step strong{display:block;margin-top:7px;color:#344054;font-size:8px}.family-process-step span{display:block;margin-top:3px;color:#98a2b3;font-size:7px;line-height:1.35}
      .family-live-strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}
      .family-live-item{padding:10px;border:1px solid #e4e9f0;border-radius:10px;background:#fff}.family-live-item span{display:block;color:#98a2b3;font-size:7px}.family-live-item strong{display:block;margin-top:3px;color:#172033;font-size:14px}.family-live-item small{display:block;margin-top:2px;color:#667085;font-size:7px;line-height:1.35}
      .family-role-note{margin:0 0 14px;padding:12px 13px;border:1px solid #dbe5f0;border-radius:12px;background:#f7fbff;color:#475467;font-size:9px;line-height:1.55}
      .family-role-note strong{color:#172033}
      @media(max-width:980px){.family-role-guide{grid-template-columns:1fr}.family-process-steps{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:680px){.family-process-steps,.family-live-strip{grid-template-columns:1fr 1fr}.family-role-guide{margin-top:10px}}
    `;
    document.head.appendChild(style);
  }

  function setHidden(element,hidden){
    if(!element) return;
    element.classList.toggle("family-role-hidden",Boolean(hidden));
    if(hidden) element.setAttribute("aria-hidden","true");
    else element.removeAttribute("aria-hidden");
  }

  function dynamicNodes(root=document){
    const cap=capabilities();
    root.querySelectorAll?.('[data-apply-scholarship]').forEach(el=>setHidden(el,!cap.applyScholarshipHere));
    root.querySelectorAll?.('[data-edit-scholarship-application],[data-delete-scholarship-application],[data-withdraw-scholarship-application],[data-view-scholarship-application]').forEach(el=>setHidden(el,!cap.viewFamilyScholarshipApplications));
    root.querySelectorAll?.('[data-add-child],[data-edit-child],[data-link-child],[data-unlink-child],[data-archive-child]').forEach(el=>setHidden(el,!cap.manageChildren));
  }

  function roleCopy(){
    const role=state.role;
    if(role === "family") return {
      title:"Family workspace",
      text:"Manage linked children, scholarship applications, project funding and optional Investor Mode from one place."
    };
    if(role === "employer") return {
      title:"Employer access in Family & Investor",
      text:"Discover and save education opportunities, manage Ventures and use Investor Mode when enabled. Family-only child and scholarship application controls are intentionally hidden."
    };
    if(role === "school") return {
      title:"School access in Family & Investor",
      text:"Use this area for discovery, Ventures and Investor Mode. Scholarship publishing and applicant review stay in the School workspace, so Family application controls are hidden here."
    };
    if(role === "student" || role === "talent") return {
      title:`${title(role)} access in Family & Investor`,
      text:"Use this area for discovery, Ventures and Investor Mode. Your own scholarship actions belong in your Career Hub experience, so Family-child application controls are not duplicated here."
    };
    return {
      title:`${title(role)} access in Family & Investor`,
      text:"This workspace only shows actions that fit your current AIFT role. Sensitive approvals remain controlled by AIFT."
    };
  }

  function applyRoleUi(){
    const cap=capabilities();
    document.body.dataset.familyAccountRole=state.role || "member";

    const roleLabel=$(".family-account-role");
    if(roleLabel) roleLabel.textContent=state.role === "family" ? "Family Account" : `${title(state.role)} · Family & Investor`;

    setHidden($("[data-page='children']"),!cap.manageChildren);
    setHidden($("#familyPage-children"),!cap.manageChildren);
    setHidden($("#familyAddChild"),!cap.manageChildren);
    dynamicNodes(document);

    const scholarshipPage=$("#familyPage-scholarships");
    scholarshipPage?.querySelectorAll('[data-page-link="requests"]').forEach(el=>setHidden(el,!cap.viewFamilyScholarshipApplications));

    const kindSelect=$("#familyRequestKind");
    const scholarshipOption=kindSelect?.querySelector('option[value="scholarship"]');
    if(scholarshipOption){
      scholarshipOption.disabled=!cap.viewFamilyScholarshipApplications;
      setHidden(scholarshipOption,!cap.viewFamilyScholarshipApplications);
    }
    if(kindSelect && !cap.viewFamilyScholarshipApplications && kindSelect.value === "scholarship") kindSelect.value="";

    $$("button").forEach(button=>{
      const label=String(button.textContent||"").trim().toLowerCase();
      if(label === "apply for scholarship") setHidden(button,!cap.applyScholarshipHere);
    });

    ensureScholarshipRoleNote();
    ensureOverviewGuide();
  }

  function ensureScholarshipRoleNote(){
    const page=$("#familyPage-scholarships");
    if(!page) return;
    let note=$("#familyScholarshipRoleNote");
    if(state.role === "family"){
      note?.remove();
      return;
    }
    if(!note){
      note=document.createElement("div");
      note.id="familyScholarshipRoleNote";
      note.className="family-role-note";
      page.querySelector(".family-page-head")?.insertAdjacentElement("afterend",note);
    }
    note.innerHTML=`<strong>Scholarship discovery only in this workspace.</strong> You can browse and save scholarships here, but application controls are not shown for your ${esc(title(state.role))} role. Use the role-specific Career Hub or dashboard for actions assigned to that role.`;
  }

  function ensureOverviewGuide(){
    const overview=$("#familyPage-overview .family-overview-main");
    const hero=overview?.querySelector(".family-hero");
    if(!overview || !hero) return;
    let guide=$("#familyRoleGuide");
    if(!guide){
      guide=document.createElement("section");
      guide.id="familyRoleGuide";
      guide.className="family-role-guide";
      hero.insertAdjacentElement("afterend",guide);
    }
    renderGuide();
  }

  function currentNextStep(){
    const info=state.reviews.filter(item=>item.status === "information_requested").length;
    if(info) return `${info} AIFT review${info===1?" needs":"s need"} more information`;
    const activeRooms=state.rooms.filter(room=>room.status === "negotiation");
    if(activeRooms.length){
      const stages=[...new Set(activeRooms.map(room=>title(room.workflowStage||room.status)))];
      return `Deal Room: ${stages.slice(0,2).join(", ")}`;
    }
    const open=state.reviews.filter(item=>!["approved","rejected","completed","cancelled","expired"].includes(item.status));
    if(open.length) return `${open.length} request${open.length===1?" is":"s are"} with AIFT review`;
    if(state.interested.length) return "Investment interests are being tracked";
    return "Discover an opportunity or create a request";
  }

  function renderGuide(){
    const guide=$("#familyRoleGuide");
    if(!guide) return;
    const copy=roleCopy();
    const cap=capabilities();
    const openReviews=state.reviews.filter(item=>!["approved","rejected","completed","cancelled","expired"].includes(item.status)).length;
    const activeRooms=state.rooms.filter(room=>room.status === "negotiation").length;
    const info=state.reviews.filter(item=>item.status === "information_requested").length;
    const interested=state.interested.length;

    guide.innerHTML=`
      <article class="family-access-card">
        <div class="family-access-kicker">AIFT ROLE ACCESS · ${esc(title(state.role))}</div>
        <h2>${esc(copy.title)}</h2>
        <p>${esc(copy.text)}</p>
        <div class="family-access-chips">
          <span class="family-access-chip good">Scholarship discovery</span>
          ${cap.applyScholarshipHere?'<span class="family-access-chip good">Family scholarship applications</span>':''}
          ${cap.manageChildren?'<span class="family-access-chip good">Linked children</span>':''}
          <span class="family-access-chip good">Venture requests</span>
          <span class="family-access-chip good">Investor Mode</span>
        </div>
        <div class="family-access-actions">
          <button class="family-small-button primary" type="button" data-family-open-activity>Open AIFT Activity</button>
          ${activeRooms?'<button class="family-small-button" type="button" data-family-open-rooms>View Deal Rooms</button>':''}
        </div>
      </article>
      <article class="family-process-card">
        <div class="family-process-head"><div><h3>How AIFT moves a request</h3><p>Only the stages that apply to a request are used.</p></div></div>
        <div class="family-process-steps">
          <div class="family-process-step"><b>1</b><strong>Submit</strong><span>Create an eligible request or interest.</span></div>
          <div class="family-process-step"><b>2</b><strong>AIFT Review</strong><span>AIFT checks sensitive actions before release.</span></div>
          <div class="family-process-step"><b>3</b><strong>Other Party</strong><span>The receiving party responds when required.</span></div>
          <div class="family-process-step"><b>4</b><strong>Deal Room</strong><span>Matched investments enter the controlled workspace.</span></div>
          <div class="family-process-step"><b>5</b><strong>Final Result</strong><span>AIFT controls evidence, meetings and outcome.</span></div>
        </div>
        <div class="family-live-strip">
          <div class="family-live-item"><span>Open reviews</span><strong>${openReviews}</strong><small>${info?`${info} need information`:"AIFT-controlled requests"}</small></div>
          <div class="family-live-item"><span>Deal Rooms</span><strong>${activeRooms}</strong><small>Matched investment workspaces</small></div>
          <div class="family-live-item"><span>Investor interests</span><strong>${interested}</strong><small>Submitted from Investor Mode</small></div>
          <div class="family-live-item"><span>Next step</span><strong style="font-size:9px;line-height:1.35">${esc(currentNextStep())}</strong><small>Updates automatically</small></div>
        </div>
      </article>`;
  }

  async function loadProfile(){
    try{
      const data=await api("/api/family/profile");
      state.profile=data;
      state.role=String(data?.user?.role || state.role || "member").toLowerCase();
      applyRoleUi();
    }catch(error){
      console.warn("Family role access profile could not load",error);
      applyRoleUi();
    }
  }

  async function refreshLive(){
    if(state.refreshing || !token()) return;
    state.refreshing=true;
    try{
      const investorEnabled=state.profile?.familyProfile?.investorEnabled === true;
      const [reviews,rooms,interested]=await Promise.all([
        api("/api/review-cases/mine").catch(()=>({cases:[]})),
        api("/api/deal-rooms/mine").catch(()=>({rooms:[]})),
        investorEnabled ? api("/api/ventures/investor/interested").catch(()=>({ventures:[]})) : Promise.resolve({ventures:[]})
      ]);
      state.reviews=Array.isArray(reviews?.cases)?reviews.cases:[];
      state.rooms=Array.isArray(rooms?.rooms)?rooms.rooms:[];
      state.interested=Array.isArray(interested?.ventures)?interested.ventures:[];
      renderGuide();
    }finally{
      state.refreshing=false;
    }
  }

  function openActivity(tab="reviews"){
    const button=$("#aiftMyReviewButton");
    if(button){
      button.click();
      setTimeout(()=>{
        $(`[data-aift-activity-tab="${tab}"]`)?.click();
      },40);
    }
  }

  function bind(){
    document.addEventListener("click",event=>{
      if(event.target.closest("[data-family-open-activity]")){
        openActivity("reviews");
        return;
      }
      if(event.target.closest("[data-family-open-rooms]")){
        openActivity("rooms");
        return;
      }

      const forbiddenApply=event.target.closest("[data-apply-scholarship]");
      if(forbiddenApply && !capabilities().applyScholarshipHere){
        event.preventDefault();
        event.stopImmediatePropagation();
      }

      const forbiddenChild=event.target.closest("[data-add-child],[data-edit-child],[data-link-child],[data-unlink-child],[data-archive-child]");
      if(forbiddenChild && !capabilities().manageChildren){
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },true);

    window.addEventListener("aift:activity-updated",()=>refreshLive());
    window.addEventListener("focus",()=>refreshLive(),{passive:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshLive();});
  }

  function observe(){
    state.observer=new MutationObserver(mutations=>{
      for(const mutation of mutations){
        for(const node of mutation.addedNodes){
          if(node.nodeType === 1) dynamicNodes(node);
        }
      }
    });
    state.observer.observe(document.body,{childList:true,subtree:true});
  }

  async function init(){
    ensureStyle();
    bind();
    applyRoleUi();
    observe();
    await loadProfile();
    await refreshLive();
    window.setInterval(()=>{if(!document.hidden)refreshLive();},15000);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
