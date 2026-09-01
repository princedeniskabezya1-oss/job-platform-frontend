(() => {
  "use strict";

  const API="https://backend-1-9b6f.onrender.com";
  const PAGE=String(location.pathname.split("/").pop()||"").toLowerCase();
  const ROLE=String(localStorage.getItem("role")||"").trim().toLowerCase();
  const SUPPORTED=new Set(["school.html","employer.html"]);

  if(!SUPPORTED.has(PAGE)) return;

  const state={kind:"",partnerItems:[],busy:false};
  const legacy={
    schoolOpportunity:window.openCareerOpportunityComposer,
    schoolScholarship:window.openCareerScholarshipComposer,
    schoolPartnership:window.openCareerPartnershipComposer,
    schoolEvent:window.openCareerEventComposer,
    employerOpportunity:window.openEmployerCareerOpportunityBuilder,
    employerPartnership:window.openEmployerCareerPartnershipComposer,
    employerEvent:window.openEmployerCareerEventComposer
  };

  function token(){
    const map={school:"schoolToken",employer:"employerToken",admin:"adminToken"};
    for(const key of [map[ROLE],"token","schoolToken","employerToken","adminToken"].filter(Boolean)){
      const value=localStorage.getItem(key)||sessionStorage.getItem(key);
      if(value) return value;
    }
    return "";
  }
  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function value(id){return String(document.getElementById(id)?.value||"").trim();}
  function checked(id){return document.getElementById(id)?.checked===true;}
  function checkedValues(name){return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value);}
  function comma(id){return value(id).split(",").map(v=>v.trim()).filter(Boolean);}
  function pageRole(){return ROLE==="company"?"employer":ROLE;}

  async function api(path,options={}){
    const response=await fetch(API+path,{
      ...options,
      headers:{
        Authorization:`Bearer ${token()}`,
        ...(options.body?{"Content-Type":"application/json"}:{}),
        ...(options.headers||{})
      }
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message||`Request failed (${response.status})`);
    return data;
  }

  function ensureStyle(){
    if(document.getElementById("aiftCareerCreateStyle")) return;
    const style=document.createElement("style");
    style.id="aiftCareerCreateStyle";
    style.textContent=`
      .aift-career-create-overlay{position:fixed;inset:0;z-index:999990;background:rgba(15,23,42,.46);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Inter,Arial,sans-serif}
      .aift-career-create-overlay[hidden]{display:none!important}
      .aift-career-create-modal{width:min(760px,100%);max-height:min(860px,calc(100vh - 32px));display:flex;flex-direction:column;overflow:hidden;background:#fff;border:1px solid #dfe6ee;border-radius:18px;box-shadow:0 30px 90px rgba(15,23,42,.28)}
      .aift-career-create-head{display:flex;justify-content:space-between;gap:18px;padding:20px 22px 16px;border-bottom:1px solid #e8edf3;background:linear-gradient(180deg,#fff,#fbfcfe)}
      .aift-career-create-kicker{font-size:10px;font-weight:850;letter-spacing:.08em;text-transform:uppercase;color:#0a66c2}
      .aift-career-create-head h2{margin:5px 0 4px;font-size:20px;line-height:1.2;color:#101828}
      .aift-career-create-head p{margin:0;color:#667085;font-size:11px;line-height:1.55}
      .aift-career-create-close{width:36px;height:36px;flex:0 0 36px;border:1px solid #e4e7ec;border-radius:9px;background:#fff;color:#667085;font-size:22px;line-height:1;cursor:pointer}
      .aift-career-trust-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-bottom:1px solid #e8edf3;background:#f8fafc}
      .aift-career-trust-step{padding:10px 13px;border-right:1px solid #e8edf3;color:#667085;font-size:9.5px;line-height:1.35}
      .aift-career-trust-step:last-child{border-right:0}.aift-career-trust-step strong{display:block;margin-bottom:2px;color:#344054;font-size:10px}
      .aift-career-create-body{overflow:auto;padding:20px 22px 10px}
      .aift-career-section{margin-bottom:20px}.aift-career-section-title{margin-bottom:11px}.aift-career-section-title strong{display:block;color:#101828;font-size:13px}.aift-career-section-title span{display:block;margin-top:3px;color:#667085;font-size:10px;line-height:1.5}
      .aift-career-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.aift-career-grid.one{grid-template-columns:1fr}.aift-career-field{display:flex;flex-direction:column;gap:5px;min-width:0}.aift-career-field.full{grid-column:1/-1}
      .aift-career-field label{font-size:10px;font-weight:800;color:#344054}.aift-career-field label b{color:#d92d20}
      .aift-career-field input,.aift-career-field select,.aift-career-field textarea{width:100%;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#101828;font:500 12px/1.4 Inter,Arial,sans-serif;outline:none}
      .aift-career-field input,.aift-career-field select{height:40px;padding:0 11px}.aift-career-field textarea{min-height:86px;padding:10px 11px;resize:vertical}
      .aift-career-field input:focus,.aift-career-field select:focus,.aift-career-field textarea:focus{border-color:#80b6e9;box-shadow:0 0 0 3px rgba(10,102,194,.08)}
      .aift-career-field small{color:#98a2b3;font-size:9px;line-height:1.4}
      .aift-career-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.aift-career-choice{position:relative}.aift-career-choice input{position:absolute;opacity:0;pointer-events:none}.aift-career-choice span{min-height:40px;padding:8px 10px;display:flex;align-items:center;justify-content:center;text-align:center;border:1px solid #dbe3ec;border-radius:9px;background:#fff;color:#475467;font-size:10px;font-weight:750;cursor:pointer}.aift-career-choice input:checked+span{border-color:#84b8ea;background:#eef6ff;color:#0a66c2;box-shadow:0 0 0 2px rgba(10,102,194,.05)}
      .aift-career-note{padding:11px 12px;border:1px solid #d7e8f8;border-radius:10px;background:#f4f9ff;color:#34506f;font-size:10px;line-height:1.55}.aift-career-note strong{color:#0a66c2}
      .aift-career-error{margin:0 22px 12px;padding:10px 12px;border:1px solid #f1c6c6;border-radius:9px;background:#fff5f5;color:#b42318;font-size:10px}.aift-career-error[hidden]{display:none!important}
      .aift-career-create-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;border-top:1px solid #e8edf3;background:#fff}.aift-career-foot-copy{color:#667085;font-size:9px;line-height:1.45}.aift-career-foot-actions{display:flex;gap:8px}.aift-career-btn{min-height:38px;padding:0 14px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#344054;font-size:10px;font-weight:850;cursor:pointer}.aift-career-btn.primary{border-color:#0a66c2;background:#0a66c2;color:#fff}.aift-career-btn:disabled{opacity:.55;cursor:not-allowed}
      .aift-career-success{padding:34px 28px 30px;text-align:center}.aift-career-success-icon{width:54px;height:54px;margin:0 auto 14px;display:grid;place-items:center;border-radius:50%;background:#e8f7ee;color:#16713c;font-size:24px;font-weight:900}.aift-career-success h3{margin:0 0 7px;color:#101828;font-size:19px}.aift-career-success p{max-width:500px;margin:0 auto;color:#667085;font-size:11px;line-height:1.6}.aift-career-success-steps{margin:20px auto;max-width:560px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:left}.aift-career-success-steps div{padding:11px;border:1px solid #e4e9f0;border-radius:10px;background:#fbfcfe;color:#667085;font-size:9px;line-height:1.45}.aift-career-success-steps strong{display:block;margin-bottom:3px;color:#344054;font-size:10px}
      @media(max-width:650px){.aift-career-create-overlay{padding:0;align-items:flex-end}.aift-career-create-modal{max-height:94vh;border-radius:18px 18px 0 0}.aift-career-grid{grid-template-columns:1fr}.aift-career-field.full{grid-column:auto}.aift-career-choice-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.aift-career-trust-strip,.aift-career-success-steps{grid-template-columns:1fr}.aift-career-trust-step{border-right:0;border-bottom:1px solid #e8edf3}.aift-career-create-foot{align-items:flex-end;flex-direction:column}.aift-career-foot-actions{width:100%}.aift-career-btn{flex:1}}
    `;
    document.head.appendChild(style);
  }

  function ensureModal(){
    ensureStyle();
    if(document.getElementById("aiftCareerCreateOverlay")) return;
    const overlay=document.createElement("div");
    overlay.id="aiftCareerCreateOverlay";
    overlay.className="aift-career-create-overlay";
    overlay.hidden=true;
    overlay.innerHTML=`<section class="aift-career-create-modal" role="dialog" aria-modal="true" aria-labelledby="aiftCareerCreateTitle"><div id="aiftCareerCreateMount"></div></section>`;
    document.body.appendChild(overlay);
    overlay.addEventListener("click",event=>{if(event.target===overlay) close();});
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&!overlay.hidden) close();});
  }

  const labels={
    opportunity:{title:"Create an opportunity",sub:"Add only the details students need. AIFT reviews it before it becomes visible."},
    scholarship:{title:"Create a scholarship",sub:"Keep eligibility clear and simple. AIFT reviews the scholarship before students can apply."},
    partnership:{title:"Request a partnership",sub:"Choose the organization and purpose. AIFT verifies the request before the other party can act."},
    event:{title:"Create a career event",sub:"Set the audience, time and format without typing system codes. AIFT reviews it before publication."}
  };

  function shell(kind,body){
    const copy=labels[kind];
    return `
      <header class="aift-career-create-head"><div><div class="aift-career-create-kicker">AIFT Career Hub</div><h2 id="aiftCareerCreateTitle">${esc(copy.title)}</h2><p>${esc(copy.sub)}</p></div><button type="button" class="aift-career-create-close" data-aift-career-close aria-label="Close">×</button></header>
      <div class="aift-career-trust-strip"><div class="aift-career-trust-step"><strong>1. You submit</strong>Fill in the important details only.</div><div class="aift-career-trust-step"><strong>2. AIFT reviews</strong>Nothing public is approved by the creator.</div><div class="aift-career-trust-step"><strong>3. Goes live</strong>Approved listings become available in Career Hub.</div></div>
      <form id="aiftCareerCreateForm"><div class="aift-career-create-body">${body}</div><div id="aiftCareerCreateError" class="aift-career-error" hidden></div><footer class="aift-career-create-foot"><div class="aift-career-foot-copy">You can follow the review status from <strong>AIFT Activity</strong>.</div><div class="aift-career-foot-actions"><button type="button" class="aift-career-btn" data-aift-career-close>Cancel</button><button id="aiftCareerSubmit" type="submit" class="aift-career-btn primary">Submit to AIFT</button></div></footer></form>`;
  }

  function option(value,label){return `<option value="${esc(value)}">${esc(label)}</option>`;}
  function choiceInput(name,value,label,checkedValue=""){return `<label class="aift-career-choice"><input type="checkbox" name="${esc(name)}" value="${esc(value)}" ${checkedValue===value?"checked":""}><span>${esc(label)}</span></label>`;}

  function opportunityForm(defaultType="internship"){
    return shell("opportunity",`
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Opportunity</strong><span>What are you offering?</span></div><div class="aift-career-grid">
        <div class="aift-career-field full"><label>Title <b>*</b></label><input id="aiftCareerTitle" maxlength="220" required placeholder="Example: Marketing Internship"></div>
        <div class="aift-career-field"><label>Type</label><select id="aiftCareerType">${option("internship","Internship")}${option("job","Job opportunity")}${option("project","Student project")}${option("placement","Work placement")}${option("collaboration","Collaboration")}${option("career_talk","Career talk")}</select></div>
        <div class="aift-career-field"><label>Work setup</label><select id="aiftCareerWorkSetup">${option("unspecified","Not important")}${option("onsite","On-site")}${option("remote","Remote")}${option("hybrid","Hybrid")}${option("flexible","Flexible")}</select></div>
        <div class="aift-career-field full"><label>Short description</label><textarea id="aiftCareerSummary" maxlength="1000" placeholder="Describe the opportunity in a few clear sentences."></textarea></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Practical details</strong><span>Optional details can be added later.</span></div><div class="aift-career-grid">
        <div class="aift-career-field"><label>Location</label><input id="aiftCareerLocation" maxlength="500" placeholder="Makati, Remote, Campus..."></div>
        <div class="aift-career-field"><label>Application deadline</label><input id="aiftCareerDeadline" type="date"></div>
        <div class="aift-career-field"><label>Available slots</label><input id="aiftCareerSlots" type="number" min="1" placeholder="Example: 10"></div>
        <div class="aift-career-field"><label>Compensation</label><select id="aiftCareerCompensation">${option("not_specified","Not specified")}${option("paid","Paid")}${option("allowance","Allowance")}${option("stipend","Stipend")}${option("salary","Salary")}${option("unpaid","Unpaid")}${option("negotiable","Negotiable")}</select></div>
        <div class="aift-career-field full"><label>Programs / courses</label><input id="aiftCareerPrograms" placeholder="Optional: IT, Business, Engineering"><small>Separate multiple programs with commas.</small></div>
        <div class="aift-career-field full"><label>Skills</label><input id="aiftCareerSkills" placeholder="Optional: Communication, Excel, JavaScript"></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-note"><strong>AIFT publication check:</strong> submitting this does not make it public immediately. AIFT reviews the listing first.</div></section>`).replace(`value="${esc(defaultType)}"`,`value="${esc(defaultType)}" selected`);
  }

  function scholarshipForm(){
    return shell("scholarship",`
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Scholarship</strong><span>Use straightforward requirements students can understand.</span></div><div class="aift-career-grid">
        <div class="aift-career-field full"><label>Scholarship name <b>*</b></label><input id="aiftCareerTitle" maxlength="300" required placeholder="Example: Future Leaders Scholarship"></div>
        <div class="aift-career-field"><label>Scholarship type</label><select id="aiftCareerType">${option("academic","Academic")}${option("merit","Merit")}${option("need_based","Need-based")}${option("leadership","Leadership")}${option("research","Research")}${option("community","Community service")}${option("athletic","Athletic")}${option("company_sponsored","Company-sponsored")}${option("government","Government")}${option("international","International")}${option("other","Other")}</select></div>
        <div class="aift-career-field"><label>Funding</label><select id="aiftCareerFundingType">${option("full","Full scholarship")}${option("partial","Partial scholarship")}${option("fixed_amount","Fixed amount")}${option("tuition_only","Tuition only")}${option("allowance","Allowance")}${option("mixed","Mixed support")}</select></div>
        <div class="aift-career-field full"><label>Short description</label><textarea id="aiftCareerSummary" maxlength="1500" placeholder="What does this scholarship support?"></textarea></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Eligibility & award</strong><span>Leave a field blank when it does not apply.</span></div><div class="aift-career-grid">
        <div class="aift-career-field"><label>Funding amount</label><input id="aiftCareerFundingAmount" type="number" min="0" placeholder="PHP"></div>
        <div class="aift-career-field"><label>Number of awards</label><input id="aiftCareerAwards" type="number" min="1" placeholder="Example: 5"></div>
        <div class="aift-career-field"><label>Application deadline</label><input id="aiftCareerDeadline" type="date"></div>
        <div class="aift-career-field"><label>Academic year</label><input id="aiftCareerAcademicYear" maxlength="100" placeholder="2026–2027"></div>
        <div class="aift-career-field full"><label>Programs / courses</label><input id="aiftCareerPrograms" placeholder="Optional: All programs, Nursing, IT..."></div>
        <div class="aift-career-field full"><label>Required documents</label><input id="aiftCareerDocuments" placeholder="Example: Grades, proof of enrollment"><small>Separate documents with commas.</small></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-note"><strong>Simple rule:</strong> AIFT reviews the scholarship before it is opened to students. Application review happens separately after students apply.</div></section>`);
  }

  function eventForm(){
    const audiences=[
      ["students","Students"],["graduates","Graduates"],["alumni","Alumni"],["job_seekers","Job seekers"],["teachers","Teachers"],["employers","Employers"],["public","Public"]
    ];
    return shell("event",`
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Event</strong><span>Choose options instead of typing system values.</span></div><div class="aift-career-grid">
        <div class="aift-career-field full"><label>Event title <b>*</b></label><input id="aiftCareerTitle" maxlength="300" required placeholder="Example: Technology Career Fair"></div>
        <div class="aift-career-field"><label>Event type</label><select id="aiftCareerEventType">${option("career_fair","Career fair")}${option("job_fair","Job fair")}${option("internship_fair","Internship fair")}${option("recruitment","Recruitment event")}${option("webinar","Webinar")}${option("workshop","Workshop")}${option("networking","Networking")}${option("company_talk","Company talk")}${option("seminar","Seminar")}${option("mock_interview","Mock interviews")}${option("portfolio_review","Portfolio review")}${option("mentorship","Mentorship")}${option("hackathon","Hackathon")}${option("other","Other")}</select></div>
        <div class="aift-career-field"><label>Format</label><select id="aiftCareerFormat">${option("physical","In person")}${option("online","Online")}${option("hybrid","Hybrid")}</select></div>
        <div class="aift-career-field"><label>Starts <b>*</b></label><input id="aiftCareerStart" type="datetime-local" required></div>
        <div class="aift-career-field"><label>Ends <b>*</b></label><input id="aiftCareerEnd" type="datetime-local" required></div>
        <div class="aift-career-field full"><label>Description</label><textarea id="aiftCareerSummary" maxlength="1000" placeholder="What will happen at the event?"></textarea></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Who is it for?</strong><span>Select one or more. “Student” wording is handled correctly because the system sends the exact supported value.</span></div><div class="aift-career-choice-grid">${audiences.map(([v,l],i)=>choiceInput("aiftEventAudience",v,l,i===0?v:"")).join("")}</div></section>
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Attendance</strong><span>Only add what is useful.</span></div><div class="aift-career-grid">
        <div class="aift-career-field"><label>Venue / platform</label><input id="aiftCareerVenue" placeholder="Campus Hall or Zoom"></div>
        <div class="aift-career-field"><label>Capacity</label><input id="aiftCareerCapacity" type="number" min="1" placeholder="Optional"></div>
        <div class="aift-career-field full"><label>Programs / courses</label><input id="aiftCareerPrograms" placeholder="Optional: All programs, IT, Business..."></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-note"><strong>AIFT review:</strong> the event stays private until the publication review is approved.</div></section>`);
  }

  function partnershipForm(){
    return shell("partnership",`
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Partner organization</strong><span>Choose a verified AIFT School or Employer account.</span></div><div class="aift-career-grid one">
        <div class="aift-career-field"><label>${pageRole()==="school"?"Company":"School"} <b>*</b></label><select id="aiftCareerPartner" required><option value="">Loading...</option></select><small id="aiftCareerPartnerHelp">Only eligible AIFT accounts are shown.</small></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>Partnership purpose</strong><span>Keep the proposal focused. More details can be agreed after verification.</span></div><div class="aift-career-grid">
        <div class="aift-career-field full"><label>Partnership title</label><input id="aiftCareerTitle" maxlength="300" placeholder="Example: 2026 Internship Partnership"></div>
        <div class="aift-career-field"><label>Type</label><select id="aiftCareerPartnershipType">${option("internship_partnership","Internship partnership")}${option("job_placement","Job placement")}${option("recruitment","Recruitment")}${option("training","Training")}${option("career_event","Career events")}${option("scholarship","Scholarship support")}${option("mentorship","Mentorship")}${option("research","Research")}${option("collaboration","General collaboration")}${option("industry_linkage","Industry linkage")}</select></div>
        <div class="aift-career-field"><label>Proposed start</label><input id="aiftCareerStartDate" type="date"></div>
        <div class="aift-career-field full"><label>Objective</label><textarea id="aiftCareerObjective" maxlength="3000" placeholder="What do you want this partnership to achieve?"></textarea></div>
        <div class="aift-career-field full"><label>Target programs</label><input id="aiftCareerPrograms" placeholder="Optional: IT, Hospitality, Business..."></div>
      </div></section>
      <section class="aift-career-section"><div class="aift-career-section-title"><strong>What can this partnership support?</strong><span>Select the relevant areas.</span></div><div class="aift-career-choice-grid">
        ${choiceInput("aiftPartnershipCapability","internships","Internships","internships")}${choiceInput("aiftPartnershipCapability","jobs","Jobs")}${choiceInput("aiftPartnershipCapability","recruitment","Recruitment")}${choiceInput("aiftPartnershipCapability","training","Training")}${choiceInput("aiftPartnershipCapability","careerEvents","Career events")}${choiceInput("aiftPartnershipCapability","scholarships","Scholarships")}${choiceInput("aiftPartnershipCapability","mentorship","Mentorship")}${choiceInput("aiftPartnershipCapability","research","Research")}
      </div></section>
      <section class="aift-career-section"><div class="aift-career-note"><strong>Verified relationship flow:</strong> AIFT reviews the proposal first → the other organization accepts or rejects → an approved partnership can become active and be shown as a verified partner.</div></section>`);
  }

  function bind(){
    const mount=document.getElementById("aiftCareerCreateMount");
    mount?.querySelectorAll("[data-aift-career-close]").forEach(button=>button.addEventListener("click",close));
    document.getElementById("aiftCareerCreateForm")?.addEventListener("submit",submit);
  }

  async function loadPartners(){
    const select=document.getElementById("aiftCareerPartner");
    if(!select) return;
    try{
      const type=pageRole()==="school"?"company":"school";
      const data=await api(`/api/opportunities/career-hub-directory?type=${encodeURIComponent(type)}`);
      state.partnerItems=Array.isArray(data?.items)?data.items:[];
      select.innerHTML='<option value="">Choose an organization</option>'+state.partnerItems.map(item=>{
        const name=item.companyName||item.schoolName||item.name||"AIFT organization";
        return `<option value="${esc(item._id)}">${esc(name)}</option>`;
      }).join("");
      if(!state.partnerItems.length) document.getElementById("aiftCareerPartnerHelp").textContent="No eligible organization is available yet.";
    }catch(error){
      select.innerHTML='<option value="">Could not load organizations</option>';
      showError(error.message);
    }
  }

  function open(kind,options={}){
    ensureModal();
    state.kind=kind;
    const mount=document.getElementById("aiftCareerCreateMount");
    if(kind==="opportunity") mount.innerHTML=opportunityForm(options.type||"internship");
    else if(kind==="scholarship") mount.innerHTML=scholarshipForm();
    else if(kind==="partnership") mount.innerHTML=partnershipForm();
    else mount.innerHTML=eventForm();
    document.getElementById("aiftCareerCreateOverlay").hidden=false;
    document.body.style.overflow="hidden";
    bind();
    if(kind==="partnership") loadPartners();
    setTimeout(()=>document.getElementById("aiftCareerTitle")?.focus(),50);
  }

  function close(){
    const overlay=document.getElementById("aiftCareerCreateOverlay");
    if(overlay) overlay.hidden=true;
    document.body.style.overflow="";
    state.busy=false;
  }
  function showError(message){
    const node=document.getElementById("aiftCareerCreateError");
    if(!node) return;
    node.hidden=false;
    node.textContent=String(message||"Please check the form and try again.");
  }
  function clearError(){const node=document.getElementById("aiftCareerCreateError");if(node){node.hidden=true;node.textContent="";}}

  function opportunityPayload(){
    return {
      kind:"opportunity",title:value("aiftCareerTitle"),type:value("aiftCareerType"),summary:value("aiftCareerSummary"),location:value("aiftCareerLocation"),workSetup:value("aiftCareerWorkSetup"),deadline:value("aiftCareerDeadline")||null,slots:value("aiftCareerSlots")||null,compensationType:value("aiftCareerCompensation"),programs:comma("aiftCareerPrograms"),skills:comma("aiftCareerSkills"),visibility:"public",allowStudentApplications:true,allowSchoolRecommendations:true
    };
  }
  function scholarshipPayload(){
    return {
      kind:"scholarship",title:value("aiftCareerTitle"),type:value("aiftCareerType"),summary:value("aiftCareerSummary"),fundingType:value("aiftCareerFundingType"),fundingAmount:value("aiftCareerFundingAmount")||null,numberOfAwards:value("aiftCareerAwards")||null,deadline:value("aiftCareerDeadline")||null,academicYear:value("aiftCareerAcademicYear"),programs:comma("aiftCareerPrograms"),requiredDocuments:comma("aiftCareerDocuments"),visibility:"public",allowInternalApplications:true
    };
  }
  function eventPayload(){
    const start=value("aiftCareerStart"),end=value("aiftCareerEnd"),format=value("aiftCareerFormat"),venue=value("aiftCareerVenue");
    return {
      kind:"event",title:value("aiftCareerTitle"),eventType:value("aiftCareerEventType"),format,startAt:start?new Date(start).toISOString():null,endAt:end?new Date(end).toISOString():null,summary:value("aiftCareerSummary"),audience:checkedValues("aiftEventAudience"),venueName:format==="physical"||format==="hybrid"?venue:"",onlinePlatform:format==="online"||format==="hybrid"?venue:"",capacity:value("aiftCareerCapacity")||null,programs:comma("aiftCareerPrograms"),visibility:"public",registrationRequired:true
    };
  }
  function partnershipPayload(){
    const capabilities={internships:false,jobs:false,recruitment:false,training:false,careerEvents:false,scholarships:false,mentorship:false,research:false};
    checkedValues("aiftPartnershipCapability").forEach(key=>{if(Object.prototype.hasOwnProperty.call(capabilities,key)) capabilities[key]=true;});
    const partnerId=value("aiftCareerPartner");
    const type=value("aiftCareerPartnershipType")||"internship_partnership";
    return {
      ...(pageRole()==="school"?{companyId:partnerId}:{schoolId:partnerId}),
      title:value("aiftCareerTitle")||`${type.replaceAll("_"," ")} proposal`,
      type,
      objective:value("aiftCareerObjective"),
      description:value("aiftCareerObjective"),
      targetPrograms:comma("aiftCareerPrograms"),
      proposedStartDate:value("aiftCareerStartDate")||null,
      capabilities
    };
  }

  function validate(kind,payload){
    if(!payload.title) return kind==="partnership"?"Add a partnership title.":"Add a title.";
    if(kind==="event"){
      if(!payload.startAt||!payload.endAt) return "Choose the event start and end time.";
      if(new Date(payload.endAt)<=new Date(payload.startAt)) return "Event end time must be after the start time.";
      if(!payload.audience.length) return "Choose at least one audience.";
    }
    if(kind==="partnership" && !(payload.schoolId||payload.companyId)) return `Choose a ${pageRole()==="school"?"company":"school"}.`;
    return "";
  }

  async function submit(event){
    event.preventDefault();
    if(state.busy) return;
    clearError();
    const kind=state.kind;
    const payload=kind==="opportunity"?opportunityPayload():kind==="scholarship"?scholarshipPayload():kind==="partnership"?partnershipPayload():eventPayload();
    const problem=validate(kind,payload);
    if(problem){showError(problem);return;}
    state.busy=true;
    const button=document.getElementById("aiftCareerSubmit");
    if(button){button.disabled=true;button.textContent="Submitting...";}
    try{
      const data=kind==="partnership"
        ? await api("/api/school-company-partnerships",{method:"POST",body:JSON.stringify(payload)})
        : await api("/api/opportunities/career-hub-create",{method:"POST",body:JSON.stringify(payload)});
      success(kind,data);
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"career-hub-create",kind}}));
    }catch(error){
      showError(error.message);
      if(button){button.disabled=false;button.textContent="Submit to AIFT";}
      state.busy=false;
    }
  }

  function success(kind,data){
    const mount=document.getElementById("aiftCareerCreateMount");
    const partnership=kind==="partnership";
    const middle=partnership?"AIFT verifies the proposal before the other organization can respond.":"AIFT checks the listing for clarity, trust and Career Hub suitability.";
    const final=partnership?"After the receiving organization approves and the partnership becomes active, it is treated as a verified AIFT partnership.":"After AIFT approval, the listing becomes available to the intended Career Hub audience.";
    mount.innerHTML=`<header class="aift-career-create-head"><div><div class="aift-career-create-kicker">Submitted successfully</div><h2>${partnership?"Partnership sent to AIFT":"Sent to AIFT Review"}</h2><p>${esc(data?.message||"Your request is now in the AIFT review process.")}</p></div><button type="button" class="aift-career-create-close" data-aift-career-close>×</button></header><div class="aift-career-success"><div class="aift-career-success-icon">✓</div><h3>Nothing else is required right now</h3><p>You can continue using AIFT. Status changes will appear in AIFT Activity.</p><div class="aift-career-success-steps"><div><strong>Submitted</strong>Your information is saved.</div><div><strong>AIFT Review</strong>${esc(middle)}</div><div><strong>Next</strong>${esc(final)}</div></div><button type="button" class="aift-career-btn primary" id="aiftCareerDone">Done</button></div>`;
    mount.querySelectorAll("[data-aift-career-close]").forEach(button=>button.addEventListener("click",()=>{close();location.reload();}));
    document.getElementById("aiftCareerDone")?.addEventListener("click",()=>{close();location.reload();});
  }

  function installOverrides(){
    if(PAGE==="school.html"){
      window.openCareerOpportunityComposer=function(type="internship"){open("opportunity",{type});};
      window.openCareerScholarshipComposer=function(id=null){if(id&&typeof legacy.schoolScholarship==="function") return legacy.schoolScholarship(id);open("scholarship");};
      window.openCareerPartnershipComposer=function(id=null){if(id&&typeof legacy.schoolPartnership==="function") return legacy.schoolPartnership(id);open("partnership");};
      window.openCareerEventComposer=function(id=null){if(id&&typeof legacy.schoolEvent==="function") return legacy.schoolEvent(id);open("event");};
    }
    if(PAGE==="employer.html"){
      window.openEmployerCareerOpportunityBuilder=function(){open("opportunity",{type:"internship"});};
      window.openEmployerCareerPartnershipComposer=function(){open("partnership");};
      window.openEmployerCareerEventComposer=function(){open("event");};
    }
  }

  function init(){ensureModal();installOverrides();}
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();
})();
