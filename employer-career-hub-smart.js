(() => {
  "use strict";

  const PAGE = String(location.pathname.split("/").pop() || "").toLowerCase();
  const ROLE = String(localStorage.getItem("role") || "").toLowerCase();
  if(PAGE !== "employer.html" || !["employer","company"].includes(ROLE)) return;

  const API = window.API_BASE || "https://backend-1-9b6f.onrender.com";
  const state = {
    mode:"",
    partners:[],
    schoolPartnerships:[],
    opportunities:[],
    companyPartnerships:[],
    workspace:null,
    workspaceId:"",
    busy:false,
    oldBodyOverflow:""
  };

  function token(){
    for(const key of ["employerToken","token"].filter(Boolean)){
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      if(value) return value;
    }
    return "";
  }

  function me(){
    return String(
      localStorage.getItem("userId") ||
      localStorage.getItem("_id") ||
      sessionStorage.getItem("userId") ||
      ""
    );
  }

  function esc(value){
    return String(value ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function id(value){
    if(value && typeof value === "object") return String(value._id || value.id || "");
    return String(value || "");
  }

  function name(value,fallback="AIFT organization"){
    return value?.companyName || value?.schoolName || value?.name || fallback;
  }

  function title(value){
    return String(value || "")
      .replaceAll("_"," ")
      .replace(/\b\w/g,letter=>letter.toUpperCase());
  }

  function value(field){ return String(document.getElementById(field)?.value || "").trim(); }
  function checked(field){ return document.getElementById(field)?.checked === true; }
  function checkedValues(name){
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value);
  }
  function comma(field){
    return value(field).split(",").map(item=>item.trim()).filter(Boolean);
  }

  async function api(path,options={}){
    const response = await fetch(API + path,{
      ...options,
      cache:"no-store",
      headers:{
        Authorization:`Bearer ${token()}`,
        ...(options.body?{"Content-Type":"application/json"}:{}),
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(()=>({}));
    if(!response.ok){
      const error = new Error(data.message || `Request failed (${response.status})`);
      error.status=response.status;
      error.data=data;
      throw error;
    }
    return data;
  }

  function ensureUI(){
    if(document.getElementById("empSmartCareerOverlay")) return;

    const style=document.createElement("style");
    style.id="empSmartCareerStyle";
    style.textContent=`
      .esc-overlay{position:fixed;inset:0;z-index:999995;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.52);backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px);font-family:Inter,Arial,sans-serif}.esc-overlay[hidden]{display:none!important}
      .esc-modal{width:min(900px,100%);height:min(900px,calc(100dvh - 32px));max-height:calc(100dvh - 32px);min-height:0;display:flex;flex-direction:column;overflow:hidden;border:1px solid #dce3eb;border-radius:18px;background:#fff;box-shadow:0 28px 90px rgba(15,23,42,.3)}
      .esc-head{flex:0 0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:18px;padding:18px 20px 14px;border-bottom:1px solid #e8edf3;background:linear-gradient(180deg,#fff,#fbfcfe)}.esc-kicker{color:#0a66c2;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}.esc-head h2{margin:5px 0 4px;color:#101828;font-size:20px}.esc-head p{max-width:650px;margin:0;color:#667085;font-size:10.5px;line-height:1.5}.esc-close{width:36px;height:36px;flex:0 0 36px;border:1px solid #dce3eb;border-radius:9px;background:#fff;color:#667085;font-size:21px;cursor:pointer}
      .esc-progress{flex:0 0 auto;display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid #e8edf3;background:#f8fafc}.esc-progress div{padding:8px 12px;border-right:1px solid #e8edf3;color:#667085;font-size:9px}.esc-progress div:last-child{border-right:0}.esc-progress strong{display:block;margin-bottom:2px;color:#344054;font-size:9.5px}
      .esc-body{flex:1 1 auto;min-height:0;overflow:auto;padding:18px 20px 28px;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}.esc-section{margin-bottom:20px}.esc-section:last-child{margin-bottom:0}.esc-section-head{margin-bottom:10px}.esc-section-head strong{display:block;color:#101828;font-size:12.5px}.esc-section-head span{display:block;margin-top:3px;color:#667085;font-size:9.5px;line-height:1.45}
      .esc-choice-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.esc-choice{position:relative}.esc-choice input{position:absolute;opacity:0;pointer-events:none}.esc-choice span{height:100%;min-height:54px;display:flex;flex-direction:column;justify-content:center;padding:9px 10px;border:1px solid #dbe3ec;border-radius:10px;background:#fff;color:#344054;font-size:10px;font-weight:800;cursor:pointer}.esc-choice small{display:block;margin-top:3px;color:#98a2b3;font-size:8.5px;font-weight:600;line-height:1.35}.esc-choice input:checked+span{border-color:#80b6e9;background:#eef6ff;color:#0a66c2;box-shadow:0 0 0 2px rgba(10,102,194,.05)}
      .esc-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.esc-field{min-width:0;display:flex;flex-direction:column;gap:5px}.esc-field.full{grid-column:1/-1}.esc-field label{color:#344054;font-size:9.5px;font-weight:800}.esc-field input,.esc-field select,.esc-field textarea{width:100%;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#101828;font:500 11px/1.4 Inter,Arial,sans-serif;outline:none}.esc-field input,.esc-field select{height:40px;padding:0 10px}.esc-field textarea{min-height:82px;padding:9px 10px;resize:vertical}.esc-field input:focus,.esc-field select:focus,.esc-field textarea:focus{border-color:#80b6e9;box-shadow:0 0 0 3px rgba(10,102,194,.08)}.esc-field small{color:#98a2b3;font-size:8.5px;line-height:1.4}
      .esc-inline-checks{display:flex;gap:7px;flex-wrap:wrap}.esc-chip{position:relative}.esc-chip input{position:absolute;opacity:0}.esc-chip span{display:inline-flex;align-items:center;min-height:34px;padding:0 10px;border:1px solid #dbe3ec;border-radius:999px;background:#fff;color:#475467;font-size:9px;font-weight:750;cursor:pointer}.esc-chip input:checked+span{border-color:#8dbce9;background:#eef6ff;color:#0a66c2}
      .esc-note{padding:10px 11px;border:1px solid #d6e8f8;border-radius:9px;background:#f5faff;color:#34506f;font-size:9.5px;line-height:1.5}.esc-note strong{color:#0a66c2}.esc-error{margin:0 20px 10px;padding:10px 11px;border:1px solid #efcaca;border-radius:9px;background:#fff5f5;color:#b42318;font-size:9.5px}.esc-error[hidden]{display:none!important}
      .esc-foot{flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 20px calc(11px + env(safe-area-inset-bottom));border-top:1px solid #e8edf3;background:#fff;box-shadow:0 -4px 18px rgba(15,23,42,.04)}.esc-foot-copy{color:#667085;font-size:8.5px;line-height:1.4}.esc-actions{display:flex;gap:8px}.esc-btn{min-height:38px;padding:0 13px;border:1px solid #d7dee8;border-radius:9px;background:#fff;color:#344054;font-size:9.5px;font-weight:850;cursor:pointer}.esc-btn.primary{border-color:#0a66c2;background:#0a66c2;color:#fff}.esc-btn.success{border-color:#15803d;background:#15803d;color:#fff}.esc-btn.danger{border-color:#efcaca;background:#fff5f5;color:#b42318}.esc-btn:disabled{opacity:.55;cursor:wait}
      .esc-success{flex:1;display:grid;place-items:center;overflow:auto;padding:30px}.esc-success-inner{max-width:590px;text-align:center}.esc-success-icon{width:54px;height:54px;margin:0 auto 13px;display:grid;place-items:center;border-radius:50%;background:#e8f7ee;color:#16713c;font-size:24px;font-weight:900}.esc-success h3{margin:0 0 6px;color:#101828;font-size:18px}.esc-success p{margin:0;color:#667085;font-size:10.5px;line-height:1.55}.esc-success-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:18px}.esc-success-steps div{padding:10px;border:1px solid #e4e9f0;border-radius:9px;background:#fafbfc;color:#667085;font-size:9px;line-height:1.4}.esc-success-steps strong{display:block;margin-bottom:3px;color:#344054}
      .esc-partner-extension{margin:0 0 12px;padding:14px;border:1px solid #dfe6ee;border-radius:13px;background:#fff}.esc-partner-extension-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}.esc-partner-extension-head strong{color:#101828;font-size:12px}.esc-partner-extension-head span{color:#667085;font-size:9px}.esc-company-partner-card{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:11px 0;border-top:1px solid #edf1f5}.esc-company-partner-card:first-of-type{border-top:0}.esc-company-partner-card h4{margin:0;color:#101828;font-size:11px}.esc-company-partner-card p{margin:4px 0 0;color:#667085;font-size:9px;line-height:1.45}.esc-status{display:inline-flex;margin-top:6px;padding:4px 7px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:8px;font-weight:800}.esc-status.review,.esc-status.pending{background:#fff4dc;color:#9a6500}.esc-status.active,.esc-status.approved{background:#e8f7ee;color:#16713c}
      .esc-work-item{padding:10px 0;border-top:1px solid #edf1f5}.esc-work-item:first-child{border-top:0}.esc-work-item strong{display:block;color:#101828;font-size:10.5px}.esc-work-item p{margin:3px 0;color:#667085;font-size:9px;line-height:1.45}.esc-work-meta{color:#98a2b3;font-size:8px}.esc-mini-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
      @media(max-width:760px){.esc-overlay{align-items:flex-end;padding:0}.esc-modal{height:94dvh;max-height:94dvh;border-radius:18px 18px 0 0}.esc-head{padding:15px 16px 12px}.esc-body{padding:15px 16px 25px}.esc-progress{grid-template-columns:1fr}.esc-progress div{border-right:0;border-bottom:1px solid #e8edf3;padding:6px 16px}.esc-progress div:last-child{border-bottom:0}.esc-choice-grid,.esc-grid,.esc-success-steps{grid-template-columns:1fr}.esc-field.full{grid-column:auto}.esc-foot{align-items:stretch;flex-direction:column;padding:10px 16px calc(10px + env(safe-area-inset-bottom))}.esc-actions{display:grid;grid-template-columns:1fr 1fr}.esc-btn{width:100%}.esc-company-partner-card{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);

    const overlay=document.createElement("div");
    overlay.id="empSmartCareerOverlay";
    overlay.className="esc-overlay";
    overlay.hidden=true;
    overlay.innerHTML='<section class="esc-modal" role="dialog" aria-modal="true" aria-labelledby="empSmartCareerTitle"><div id="empSmartCareerMount"></div></section>';
    overlay.addEventListener("click",event=>{
      if(event.target === overlay || event.target.closest("[data-esc-close]")) close();
    });
    document.body.appendChild(overlay);
  }

  function lock(){
    state.oldBodyOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
  }
  function close(){
    const overlay=document.getElementById("empSmartCareerOverlay");
    if(overlay) overlay.hidden=true;
    document.body.style.overflow=state.oldBodyOverflow;
    state.mode="";
    state.busy=false;
  }
  function show(html){
    ensureUI();
    const overlay=document.getElementById("empSmartCareerOverlay");
    document.getElementById("empSmartCareerMount").innerHTML=html;
    overlay.hidden=false;
    lock();
    requestAnimationFrame(()=>overlay.querySelector(".esc-body")?.scrollTo({top:0}));
  }
  function error(message){
    const node=document.getElementById("empSmartCareerError");
    if(!node) return;
    node.textContent=message || "Please check the form.";
    node.hidden=false;
    node.scrollIntoView({block:"nearest"});
  }
  function clearError(){ const node=document.getElementById("empSmartCareerError"); if(node) node.hidden=true; }
  function buttonBusy(button,busy,label="Submitting…"){
    if(!button) return;
    if(!button.dataset.originalText) button.dataset.originalText=button.textContent;
    button.disabled=busy;
    button.textContent=busy ? label : button.dataset.originalText;
  }

  function head(kicker,titleText,copy){
    return `<header class="esc-head"><div><div class="esc-kicker">${esc(kicker)}</div><h2 id="empSmartCareerTitle">${esc(titleText)}</h2><p>${esc(copy)}</p></div><button type="button" class="esc-close" data-esc-close aria-label="Close">×</button></header>`;
  }
  function progress(a,b,c){
    return `<div class="esc-progress"><div><strong>1. ${esc(a)}</strong>Choose the purpose clearly.</div><div><strong>2. ${esc(b)}</strong>Only relevant information is requested.</div><div><strong>3. ${esc(c)}</strong>AIFT keeps the process controlled.</div></div>`;
  }
  function footer(label="Submit to AIFT"){
    return `<div id="empSmartCareerError" class="esc-error" hidden></div><footer class="esc-foot"><div class="esc-foot-copy">You can manage the record after submission. Publication and verified partnerships remain controlled by AIFT.</div><div class="esc-actions"><button type="button" class="esc-btn" data-esc-close>Cancel</button><button id="empSmartCareerSubmit" type="submit" class="esc-btn primary">${esc(label)}</button></div></footer>`;
  }
  function option(value,label,selected=false){ return `<option value="${esc(value)}" ${selected?"selected":""}>${esc(label)}</option>`; }
  function choice(name,value,label,help="",checkedValue=false){
    return `<label class="esc-choice"><input type="${name.includes("Audience")?"checkbox":"radio"}" name="${esc(name)}" value="${esc(value)}" ${checkedValue?"checked":""}><span>${esc(label)}${help?`<small>${esc(help)}</small>`:""}</span></label>`;
  }
  function chip(name,value,label,checkedValue=false){
    return `<label class="esc-chip"><input type="checkbox" name="${esc(name)}" value="${esc(value)}" ${checkedValue?"checked":""}><span>${esc(label)}</span></label>`;
  }

  const OFFERINGS={
    job:{label:"Job",help:"Permanent, part-time, contract or temporary work",defaultAudience:["talent","job_seekers","graduates"]},
    internship:{label:"Internship",help:"Structured student or graduate work experience",defaultAudience:["students","graduates"]},
    student_project:{label:"Student project",help:"Real company project for students",defaultAudience:["students"]},
    freelance_project:{label:"Freelance / contract project",help:"Deliverable-based work for independent talent",defaultAudience:["talent","job_seekers"]},
    graduate_program:{label:"Graduate program",help:"Entry-level cohort or graduate opportunity",defaultAudience:["graduates","talent"]},
    apprenticeship:{label:"Apprenticeship / placement",help:"Learn while working in a structured placement",defaultAudience:["students","graduates"]},
    volunteer_project:{label:"Volunteer / community project",help:"Experience-building unpaid project work",defaultAudience:["students","talent","job_seekers"]}
  };

  function educationRelevant(offering,audiences){
    return ["internship","student_project","graduate_program","apprenticeship"].includes(offering) || audiences.some(item=>["students","graduates"].includes(item));
  }

  function opportunitySpecific(offering,audiences){
    const education=educationRelevant(offering,audiences);
    const jobLike=["job","graduate_program","apprenticeship"].includes(offering);
    const internship=offering === "internship";
    const project=["student_project","freelance_project","volunteer_project"].includes(offering);

    return `
      <section class="esc-section">
        <div class="esc-section-head"><strong>${project?"Project details":internship?"Internship details":"Role details"}</strong><span>These fields change based on what you selected.</span></div>
        <div class="esc-grid">
          ${jobLike?`<div class="esc-field"><label>Employment arrangement</label><select id="escEmploymentType">${option("full_time","Full-time",offering!=="apprenticeship")}${option("part_time","Part-time")}${option("contract","Contract")}${option("temporary","Temporary",offering==="apprenticeship")}</select></div><div class="esc-field"><label>Experience level</label><select id="escExperienceLevel">${option("entry_level","Entry level",offering!=="job")}${option("no_experience","No experience required")}${option("junior","Junior")}${option("mid_level","Mid-level",offering==="job")}${option("senior","Senior")}</select></div>`:""}
          ${education?`<div class="esc-field full"><label>Relevant programs / courses</label><input id="escPrograms" placeholder="Example: Computer Science, IT, Marketing"><small>Only shown because this opportunity targets students or graduates.</small></div><div class="esc-field full"><label>Year level / graduate stage</label><input id="escYearLevels" placeholder="Example: 3rd year, 4th year, Fresh graduate"></div>`:""}
          ${project?`<div class="esc-field full"><label>Expected project outcome / deliverable</label><textarea id="escProjectOutcome" placeholder="Example: Build a prototype, research customer behavior, design a campaign, analyze a dataset"></textarea></div>`:""}
          <div class="esc-field full"><label>Skills</label><input id="escSkills" placeholder="Example: JavaScript, Excel, Communication, Research"></div>
          <div class="esc-field"><label>${project?"Participants / slots":"Open positions"}</label><input id="escSlots" type="number" min="1" placeholder="1"></div>
          <div class="esc-field"><label>Duration</label><input id="escDuration" placeholder="Example: 3 months, 6 weeks, project-based"></div>
          <div class="esc-field"><label>Start date</label><input id="escStartDate" type="date"></div>
          <div class="esc-field"><label>End date</label><input id="escEndDate" type="date"></div>
          <div class="esc-field"><label>Application deadline</label><input id="escDeadline" type="date"></div>
          <div class="esc-field"><label>Work setup</label><select id="escWorkSetup">${option("unspecified","Not important",true)}${option("onsite","On-site")}${option("remote","Remote")}${option("hybrid","Hybrid")}${option("flexible","Flexible")}</select></div>
          <div class="esc-field full"><label>Location</label><input id="escLocation" placeholder="City, office, campus or remote"></div>
        </div>
      </section>
      <section class="esc-section">
        <div class="esc-section-head"><strong>Compensation</strong><span>Choose the description that makes sense for this opportunity.</span></div>
        <div class="esc-grid">
          <div class="esc-field"><label>Compensation type</label><select id="escCompType">${option("not_specified","Not specified",true)}${option("salary","Salary")}${option("paid","Paid")}${option("allowance","Allowance")}${option("stipend","Stipend")}${option("negotiable","Negotiable")}${option("unpaid","Unpaid")}</select></div>
          <div class="esc-field"><label>Amount (optional)</label><input id="escCompAmount" type="number" min="0" placeholder="PHP"></div>
        </div>
      </section>
      <section class="esc-section">
        <div class="esc-section-head"><strong>Application</strong><span>AIFT uses the same trusted Career Application pipeline for jobs, internships, placements and projects.</span></div>
        <div class="esc-grid">
          <div class="esc-field full"><label>Requirements</label><textarea id="escRequirements" placeholder="One requirement per line or separate with commas"></textarea></div>
          <div class="esc-field full"><label>Responsibilities / what they will do</label><textarea id="escResponsibilities" placeholder="Describe the important work or responsibilities"></textarea></div>
          <div class="esc-field full"><label>Application instructions (optional)</label><textarea id="escApplicationInstructions" placeholder="Any special instruction applicants should know"></textarea></div>
        </div>
        <div class="esc-inline-checks" style="margin-top:10px">
          ${education?chip("escApplicationOptions","school_recommendations","Allow School recommendations",true):""}
          ${chip("escApplicationOptions","direct","Allow direct applications",true)}
        </div>
      </section>`;
  }

  function renderOpportunity(offering="job",audiences=null){
    const config=OFFERINGS[offering] || OFFERINGS.job;
    const selectedAudiences=audiences || config.defaultAudience;
    show(`
      <form id="empSmartOpportunityForm" style="display:flex;flex-direction:column;min-height:0;height:100%">
        ${head("Employer Career Hub","Create an opportunity","Start with what you are actually offering. AIFT will show only the fields and application options that make sense.")}
        ${progress("Choose offering","Describe the opportunity","AIFT publication review")}
        <div class="esc-body">
          <section class="esc-section"><div class="esc-section-head"><strong>What are you offering?</strong><span>This determines the application structure.</span></div><div class="esc-choice-grid">${Object.entries(OFFERINGS).map(([key,item])=>choice("escOffering",key,item.label,item.help,key===offering)).join("")}</div></section>
          <section class="esc-section"><div class="esc-section-head"><strong>Who should be able to apply?</strong><span>Select the people this opportunity is designed for.</span></div><div class="esc-inline-checks">${chip("escOpportunityAudience","students","Students",selectedAudiences.includes("students"))}${chip("escOpportunityAudience","graduates","Graduates",selectedAudiences.includes("graduates"))}${chip("escOpportunityAudience","talent","Talent",selectedAudiences.includes("talent"))}${chip("escOpportunityAudience","job_seekers","Job seekers",selectedAudiences.includes("job_seekers"))}${chip("escOpportunityAudience","experienced_professionals","Experienced professionals",selectedAudiences.includes("experienced_professionals"))}</div></section>
          <section class="esc-section"><div class="esc-section-head"><strong>Basic information</strong><span>Keep this clear enough for applicants to understand quickly.</span></div><div class="esc-grid"><div class="esc-field full"><label>Title</label><input id="escOpportunityTitle" required maxlength="220" placeholder="Example: Junior Software Developer"></div><div class="esc-field full"><label>Short description</label><textarea id="escOpportunityDescription" required maxlength="12000" placeholder="What is the opportunity and what will the person actually do?"></textarea></div><div class="esc-field full"><label>Role / field category</label><input id="escRoleCategory" placeholder="Example: Software, Marketing, Finance, Operations"></div></div></section>
          <div id="escOpportunitySpecific">${opportunitySpecific(offering,selectedAudiences)}</div>
          <div class="esc-note"><strong>Publication protection:</strong> the opportunity remains private until AIFT approves it. After approval, relevant Student/Talent applicants use the Career Application flow.</div>
        </div>
        ${footer("Submit opportunity")}
      </form>`);

    document.querySelectorAll('input[name="escOffering"]').forEach(input=>input.addEventListener("change",()=>{
      const next=input.value;
      const nextAud=OFFERINGS[next]?.defaultAudience || [];
      renderOpportunity(next,nextAud);
    }));
    document.querySelectorAll('input[name="escOpportunityAudience"]').forEach(input=>input.addEventListener("change",()=>{
      const offering=document.querySelector('input[name="escOffering"]:checked')?.value || offering;
      const audiences=checkedValues("escOpportunityAudience");
      document.getElementById("escOpportunitySpecific").innerHTML=opportunitySpecific(offering,audiences);
    }));
    document.getElementById("empSmartOpportunityForm")?.addEventListener("submit",submitOpportunity);
  }

  function linesOrComma(field){
    return value(field).split(/[\n,]/).map(item=>item.trim()).filter(Boolean);
  }

  async function submitOpportunity(event){
    event.preventDefault();
    clearError();
    const button=document.getElementById("empSmartCareerSubmit");
    buttonBusy(button,true);
    try{
      const offering=document.querySelector('input[name="escOffering"]:checked')?.value || "job";
      const audiences=checkedValues("escOpportunityAudience");
      const options=new Set(checkedValues("escApplicationOptions"));
      const payload={
        offeringType:offering,
        targetAudiences:audiences,
        title:value("escOpportunityTitle"),
        description:value("escOpportunityDescription"),
        roleCategory:value("escRoleCategory"),
        employmentType:value("escEmploymentType"),
        experienceLevel:value("escExperienceLevel"),
        programs:comma("escPrograms"),
        yearLevels:comma("escYearLevels"),
        skills:comma("escSkills"),
        projectOutcome:value("escProjectOutcome"),
        slots:value("escSlots"),
        durationText:value("escDuration"),
        startDate:value("escStartDate"),
        endDate:value("escEndDate"),
        deadline:value("escDeadline"),
        workSetup:value("escWorkSetup"),
        location:value("escLocation"),
        compensationType:value("escCompType"),
        compensationAmount:value("escCompAmount"),
        currency:"PHP",
        requirements:linesOrComma("escRequirements"),
        responsibilities:linesOrComma("escResponsibilities"),
        applicationInstructions:value("escApplicationInstructions"),
        allowDirectApplications:options.has("direct"),
        allowSchoolRecommendations:options.has("school_recommendations")
      };
      const data=await api("/api/opportunities/employer-create",{method:"POST",body:JSON.stringify(payload)});
      success("Opportunity submitted",`“${payload.title}” is now in AIFT Review. Once approved, the correct Career Application flow will open for the audiences you selected.`,["AIFT checks the listing","Approved listing becomes live","Relevant applicants can apply"]);
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"employer-smart-opportunity",reviewCase:data.reviewCase}}));
    }catch(err){error(err.message);buttonBusy(button,false);}
  }

  async function loadDirectory(type){
    const data=await api(`/api/opportunities/career-hub-directory?type=${encodeURIComponent(type)}`);
    const items=Array.isArray(data?.items) ? data.items : Array.isArray(data?.users) ? data.users : Array.isArray(data) ? data : [];
    return type === "company" ? items.filter(item=>id(item)!==me()) : items;
  }

  const PARTNERSHIP_PURPOSES={
    internship_partnership:"Internships",
    job_placement:"Jobs / placement",
    recruitment:"Recruitment",
    training:"Training",
    collaboration:"General collaboration",
    career_event:"Career events",
    scholarship:"Scholarship support",
    research:"Research",
    mentorship:"Mentorship",
    industry_linkage:"Industry linkage"
  };

  async function openPartnership(kind="school"){
    state.mode="partnership";
    show(`${head("Employer Career Hub","Create a partnership","Choose whether you want to collaborate with a School or another Company. Both routes remain AIFT-verified before negotiation.")}<div class="esc-body"><div class="esc-note">Loading organizations…</div></div>`);
    try{
      state.partners=await loadDirectory(kind);
      renderPartnership(kind);
    }catch(err){error(err.message);}
  }

  function capabilityChips(kind){
    const labels=kind === "company"
      ? [["jobs","Joint jobs"],["recruitment","Talent / recruitment"],["training","Training"],["careerEvents","Events"],["internships","Internship collaboration"],["mentorship","Mentorship"],["research","Research"],["scholarships","Sponsored opportunities"]]
      : [["internships","Internships"],["jobs","Jobs"],["recruitment","Recruitment"],["training","Training"],["careerEvents","Career events"],["scholarships","Scholarships"],["mentorship","Mentorship"],["research","Research"]];
    return labels.map(([key,label])=>chip("escPartnerCapabilities",key,label,["internships","jobs","recruitment"].includes(key))).join("");
  }

  function renderPartnership(kind){
    const isCompany=kind === "company";
    show(`
      <form id="empSmartPartnershipForm" style="display:flex;flex-direction:column;min-height:0;height:100%">
        ${head("Employer Career Hub",isCompany?"Partner with another Company":"Partner with a School",isCompany?"Build a verified business collaboration for talent, projects, recruitment, training, events or research.":"Build a verified education-industry relationship before launching Campus programs.")}
        ${progress("Choose organization","Define collaboration","AIFT verifies & opens workspace")}
        <div class="esc-body">
          <section class="esc-section"><div class="esc-section-head"><strong>Partner with</strong><span>You can switch without leaving this form.</span></div><div class="esc-choice-grid">${choice("escPartnerKind","school","School","Campus, internships, graduate hiring and education programs",!isCompany)}${choice("escPartnerKind","company","Company","Joint opportunities, talent, projects and industry collaboration",isCompany)}</div></section>
          <section class="esc-section"><div class="esc-grid"><div class="esc-field full"><label>${isCompany?"Company":"School"}</label><select id="escPartnerId" required><option value="">Choose ${isCompany?"a company":"a school"}</option>${state.partners.map(item=>option(id(item),name(item))).join("")}</select></div><div class="esc-field"><label>Main partnership purpose</label><select id="escPartnerPurpose">${Object.entries(PARTNERSHIP_PURPOSES).map(([key,label])=>option(key,label,key===(isCompany?"collaboration":"internship_partnership"))).join("")}</select></div><div class="esc-field"><label>Proposed start</label><input id="escPartnerStart" type="date"></div><div class="esc-field full"><label>What should this partnership achieve?</label><textarea id="escPartnerObjective" required placeholder="Example: Create internship and hiring pathways, run joint projects, training or events"></textarea></div></div></section>
          <section class="esc-section"><div class="esc-section-head"><strong>Areas you want to explore</strong><span>These are proposals. Both organizations can refine them in the private workspace after AIFT verification.</span></div><div class="esc-inline-checks">${capabilityChips(kind)}</div></section>
          ${!isCompany?`<section class="esc-section"><div class="esc-grid"><div class="esc-field full"><label>Relevant programs / courses</label><input id="escPartnerPrograms" placeholder="Example: IT, Business, Engineering"></div></div></section>`:`<section class="esc-section"><div class="esc-grid"><div class="esc-field full"><label>Relevant skills / business areas</label><input id="escPartnerSkills" placeholder="Example: Technology, Sales, Data, Recruitment"></div></div></section>`}
          <div class="esc-note"><strong>Protected process:</strong> AIFT verifies the introduction first. Then both organizations can privately negotiate, propose work, request a meeting, agree on scope and only then approve/activate the partnership.</div>
        </div>
        ${footer("Submit partnership")}
      </form>`);

    document.querySelectorAll('input[name="escPartnerKind"]').forEach(input=>input.addEventListener("change",()=>openPartnership(input.value)));
    document.getElementById("empSmartPartnershipForm")?.addEventListener("submit",event=>submitPartnership(event,kind));
  }

  async function submitPartnership(event,kind){
    event.preventDefault();
    clearError();
    const button=document.getElementById("empSmartCareerSubmit");
    buttonBusy(button,true);
    try{
      const selectedId=value("escPartnerId");
      const selected=state.partners.find(item=>id(item)===selectedId);
      const capabilities=new Set(checkedValues("escPartnerCapabilities"));
      const payload={
        type:value("escPartnerPurpose"),
        title:`Partnership with ${name(selected,kind === "company" ? "Company" : "School")}`,
        objective:value("escPartnerObjective"),
        description:value("escPartnerObjective"),
        proposedStartDate:value("escPartnerStart"),
        targetPrograms:comma("escPartnerPrograms"),
        targetSkills:comma("escPartnerSkills"),
        capabilities:{
          internships:capabilities.has("internships"),
          jobs:capabilities.has("jobs"),
          recruitment:capabilities.has("recruitment"),
          training:capabilities.has("training"),
          careerEvents:capabilities.has("careerEvents"),
          scholarships:capabilities.has("scholarships"),
          mentorship:capabilities.has("mentorship"),
          research:capabilities.has("research")
        }
      };

      let path="/api/school-company-partnerships";
      if(kind === "company"){
        path="/api/opportunities/company-partnerships";
        payload.partnerCompanyId=selectedId;
      }else{
        payload.schoolId=selectedId;
      }

      const data=await api(path,{method:"POST",body:JSON.stringify(payload)});
      success("Partnership sent to AIFT",`${payload.title} has entered AIFT verification. The recipient cannot approve it until verification is complete.`,["AIFT verifies the introduction","Private negotiation & meeting workspace","Recipient approves, then activate"]);
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"employer-smart-partnership",partnershipId:id(data.partnership)}}));
      if(kind === "company") setTimeout(()=>loadCompanyPartnerships(true),300);
    }catch(err){error(err.message);buttonBusy(button,false);}
  }

  const CAMPUS_PURPOSES={
    recruit_students:{label:"Recruit students",help:"Create a school-specific hiring campaign",opportunityTypes:["job","internship","placement","project"]},
    offer_internships:{label:"Offer internships",help:"Bring approved internships to a partner School",opportunityTypes:["internship","placement"]},
    graduate_recruitment:{label:"Recruit graduates",help:"Entry-level and graduate opportunities",opportunityTypes:["job","placement"]},
    offer_jobs:{label:"Offer jobs",help:"Share approved jobs with a partner School",opportunityTypes:["job"]},
    student_project:{label:"Student project",help:"Give students a real company problem or deliverable",opportunityTypes:["project"]},
    project_challenge:{label:"Project challenge",help:"Run a challenge for teams or classes",opportunityTypes:["project"]},
    career_fair:{label:"Career fair",help:"Join or organize a School career event",opportunityTypes:[]},
    training_workshop:{label:"Training / workshop",help:"Deliver practical industry learning",opportunityTypes:[]},
    company_talk:{label:"Company talk",help:"Career talk, industry briefing or employer session",opportunityTypes:[]},
    assessment_day:{label:"Assessment day",help:"Run assessments for an applicant pipeline",opportunityTypes:["job","internship","placement"]},
    interview_day:{label:"Interview day",help:"Schedule a focused campus interview activity",opportunityTypes:["job","internship","placement"]},
    talent_pipeline:{label:"Build talent pipeline",help:"Build a future candidate pool with a School",opportunityTypes:["job","internship","placement","project"]}
  };

  async function loadCampusData(){
    const [partnershipData,opportunityData]=await Promise.all([
      api("/api/school-company-partnerships"),
      api("/api/opportunities")
    ]);
    const partnerships=Array.isArray(partnershipData?.partnerships) ? partnershipData.partnerships : Array.isArray(partnershipData?.items) ? partnershipData.items : [];
    state.schoolPartnerships=partnerships.filter(item=>
      (item.relationshipKind || "school_company") === "school_company" && ["approved","active"].includes(item.status)
    );
    const opportunities=Array.isArray(opportunityData?.opportunities) ? opportunityData.opportunities : Array.isArray(opportunityData?.items) ? opportunityData.items : Array.isArray(opportunityData) ? opportunityData : [];
    state.opportunities=opportunities.filter(item=>["active","approved","open"].includes(item.status));
  }

  async function openCampus(purpose="offer_internships"){
    show(`${head("Employer Career Hub","Create a Campus program","Choose what you want to do with a verified School partner. The form will only ask for information relevant to that purpose.")}<div class="esc-body"><div class="esc-note">Loading your verified School partnerships and live opportunities…</div></div>`);
    try{
      await loadCampusData();
      renderCampus(purpose);
    }catch(err){error(err.message);}
  }

  function renderCampus(purpose){
    const config=CAMPUS_PURPOSES[purpose] || CAMPUS_PURPOSES.offer_internships;
    const relevant=state.opportunities.filter(item=>!config.opportunityTypes.length || config.opportunityTypes.includes(item.type));
    const needsHiring=["recruit_students","offer_internships","graduate_recruitment","offer_jobs","assessment_day","interview_day","talent_pipeline"].includes(purpose);
    const project=["student_project","project_challenge"].includes(purpose);
    const eventLike=["career_fair","training_workshop","company_talk"].includes(purpose);

    show(`
      <form id="empSmartCampusForm" style="display:flex;flex-direction:column;min-height:0;height:100%">
        ${head("Employer Career Hub","Create a Campus program","Campus is for structured activity with a verified School partner—not another generic job form.")}
        ${progress("Choose Campus purpose","Choose School & details","Launch through partnership")}
        <div class="esc-body">
          <section class="esc-section"><div class="esc-section-head"><strong>What do you want to do on Campus?</strong><span>Choose one purpose. You can link existing AIFT opportunities where relevant.</span></div><div class="esc-choice-grid">${Object.entries(CAMPUS_PURPOSES).map(([key,item])=>choice("escCampusPurpose",key,item.label,item.help,key===purpose)).join("")}</div></section>
          <section class="esc-section"><div class="esc-grid"><div class="esc-field full"><label>School partnership</label><select id="escCampusPartnership" required><option value="">Choose an approved School partnership</option>${state.schoolPartnerships.map(item=>option(id(item),name(item.schoolId,item.schoolName || "School"))).join("")}</select><small>${state.schoolPartnerships.length?"Only approved/active School relationships are shown.":"No approved School partnership is available yet. Create a School partnership first."}</small></div></div></section>
          ${config.opportunityTypes.length?`<section class="esc-section"><div class="esc-section-head"><strong>Connect existing opportunities</strong><span>Optional. Link jobs, internships or projects already approved by AIFT so applications remain connected to the real opportunity.</span></div><div class="esc-inline-checks">${relevant.length?relevant.map(item=>chip("escCampusOpportunities",id(item),`${item.title} · ${title(item.type)}`)).join(""):'<span style="color:#98a2b3;font-size:9px">No matching live opportunities yet. You can still create the Campus program, then create/link opportunities later.</span>'}</div></section>`:""}
          <section class="esc-section"><div class="esc-section-head"><strong>Program details</strong><span>Keep the submission simple and specific.</span></div><div class="esc-grid"><div class="esc-field full"><label>Title</label><input id="escCampusTitle" required placeholder="Example: 2026 IT Internship Intake"></div><div class="esc-field full"><label>${eventLike?"What will happen?":project?"Project brief / objective":"What do you want to achieve?"}</label><textarea id="escCampusDescription" required placeholder="Describe the activity in plain language"></textarea></div><div class="esc-field full"><label>Programs / courses</label><input id="escCampusPrograms" placeholder="Example: IT, Business, Engineering"><small>This is a Campus activity, so academic targeting is relevant here.</small></div><div class="esc-field full"><label>Skills (optional)</label><input id="escCampusSkills" placeholder="Example: JavaScript, Communication, Data Analysis"></div>${needsHiring?`<div class="esc-field"><label>Target hires / placements</label><input id="escCampusTargetHires" type="number" min="0" placeholder="10"></div>`:""}${project?`<div class="esc-field"><label>Target project participants</label><input id="escCampusProjectParticipants" type="number" min="0" placeholder="20"></div>`:""}<div class="esc-field"><label>Expected participants</label><input id="escCampusExpected" type="number" min="0" placeholder="50"></div></div></section>
          <section class="esc-section"><div class="esc-section-head"><strong>Schedule & format</strong></div><div class="esc-grid"><div class="esc-field"><label>Start</label><input id="escCampusStart" type="datetime-local"></div><div class="esc-field"><label>End</label><input id="escCampusEnd" type="datetime-local"></div>${needsHiring||project?`<div class="esc-field"><label>Application / participation deadline</label><input id="escCampusDeadline" type="datetime-local"></div>`:""}<div class="esc-field"><label>Format</label><select id="escCampusMode">${option("onsite","On campus / in person",true)}${option("online","Online")}${option("hybrid","Hybrid")}</select></div><div class="esc-field full"><label>Venue / location</label><input id="escCampusVenue" placeholder="Campus venue, office, online or to be agreed"></div></div></section>
          <div class="esc-note"><strong>How this works:</strong> the Campus program sits inside the selected verified School partnership. Jobs/internships/projects can remain separate AIFT opportunities so applications and applicant pipelines stay accurate.</div>
        </div>
        ${footer("Create Campus program")}
      </form>`);

    document.querySelectorAll('input[name="escCampusPurpose"]').forEach(input=>input.addEventListener("change",()=>renderCampus(input.value)));
    document.getElementById("empSmartCampusForm")?.addEventListener("submit",event=>submitCampus(event,purpose));
  }

  async function submitCampus(event,purpose){
    event.preventDefault();
    clearError();
    const button=document.getElementById("empSmartCareerSubmit");
    buttonBusy(button,true);
    try{
      const partnershipId=value("escCampusPartnership");
      const partnership=state.schoolPartnerships.find(item=>id(item)===partnershipId);
      if(!partnership) throw new Error("Choose an approved School partnership.");
      const schoolId=id(partnership.schoolId);
      if(!schoolId) throw new Error("The selected partnership does not contain a valid School.");

      const payload={
        purpose,
        partnershipId,
        schoolId,
        opportunityIds:checkedValues("escCampusOpportunities"),
        title:value("escCampusTitle"),
        description:value("escCampusDescription"),
        objective:value("escCampusDescription"),
        targetPrograms:comma("escCampusPrograms"),
        targetSkills:comma("escCampusSkills"),
        expectedStudents:value("escCampusExpected"),
        targetHires:value("escCampusTargetHires"),
        targetProjectParticipants:value("escCampusProjectParticipants"),
        startDate:value("escCampusStart"),
        endDate:value("escCampusEnd"),
        applicationDeadline:value("escCampusDeadline"),
        mode:value("escCampusMode"),
        venue:value("escCampusVenue"),
        requireSchoolApproval:true
      };

      await api("/api/opportunities/employer-campus-programs",{method:"POST",body:JSON.stringify(payload)});
      success("Campus program created",`“${payload.title}” is now connected to ${name(partnership.schoolId,partnership.schoolName || "your School partner")}.`,["Program stays tied to the partnership","Linked opportunities keep their applications","Employer and School can manage the activity"]);
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"employer-campus-program",partnershipId}}));
      if(typeof window.loadEmployerCareerHub === "function") window.loadEmployerCareerHub({force:true}).catch(()=>{});
    }catch(err){error(err.message);buttonBusy(button,false);}
  }

  function success(titleText,copy,steps){
    show(`${head("Employer Career Hub",titleText,"Submission complete")}<div class="esc-success"><div class="esc-success-inner"><div class="esc-success-icon">✓</div><h3>${esc(titleText)}</h3><p>${esc(copy)}</p><div class="esc-success-steps">${steps.map((step,index)=>`<div><strong>${index+1}</strong>${esc(step)}</div>`).join("")}</div><div style="margin-top:18px"><button type="button" class="esc-btn primary" data-esc-close>Done</button></div></div></div>`);
  }

  function otherCompany(partnership){
    const mine=me();
    if(id(partnership.companyId) === mine) return partnership.partnerCompanyId;
    return partnership.companyId;
  }

  async function loadCompanyPartnerships(render=true){
    try{
      const data=await api("/api/opportunities/company-partnerships");
      state.companyPartnerships=Array.isArray(data?.partnerships) ? data.partnerships : Array.isArray(data?.items) ? data.items : [];
      if(render) renderCompanyPartnershipExtension();
    }catch{
      state.companyPartnerships=[];
    }
  }

  function renderCompanyPartnershipExtension(){
    const host=document.getElementById("employerCareerPartnershipList");
    if(!host) return;
    document.querySelector("[data-new-company-partnership].esc-mobile-company-action")?.remove();
    document.querySelector(".employer-career-section-head.esc-mobile-partnership-actions")?.classList.remove("esc-mobile-partnership-actions");
    host.querySelector("[data-company-partnership-extension]")?.remove();
    if(!state.companyPartnerships.length) return;

    const wrapper=document.createElement("section");
    wrapper.className="esc-partner-extension";
    wrapper.dataset.companyPartnershipExtension="1";
    wrapper.innerHTML=`<div class="esc-partner-extension-head"><div><strong>Company Partnerships</strong><span>Verified collaboration with other employers and companies.</span></div><button type="button" class="esc-btn" data-new-company-partnership>New company partnership</button></div>${state.companyPartnerships.map(item=>{
      const partner=otherCompany(item);
      return `<article class="esc-company-partner-card"><div><h4>${esc(item.title || name(partner,"Company partnership"))}</h4><p>${esc(name(partner,"Partner company"))} · ${esc(title(item.type))}</p><span class="esc-status ${esc(item.status)}">${esc(title(item.status))}</span></div><div class="esc-mini-actions">${["review","approved","active","paused"].includes(item.status)?`<button type="button" class="esc-btn primary" data-open-company-workspace="${esc(item._id)}">Open workspace</button>`:`<button type="button" class="esc-btn" disabled>${item.status === "pending"?"AIFT review pending":esc(title(item.status))}</button>`}</div></article>`;
    }).join("")}`;
    host.prepend(wrapper);
    const companyButton=wrapper.querySelector("[data-new-company-partnership]");
    if(window.matchMedia("(max-width: 760px)").matches && companyButton){
      const sectionHead=host.closest('[data-career-panel="partnerships"]')?.querySelector(".employer-career-section-head");
      if(sectionHead){
        sectionHead.classList.add("esc-mobile-partnership-actions");
        companyButton.classList.add("esc-mobile-company-action");
        sectionHead.append(companyButton);
      }
    }
    companyButton?.addEventListener("click",()=>openPartnership("company"));
    wrapper.querySelectorAll("[data-open-company-workspace]").forEach(button=>button.addEventListener("click",()=>openCompanyWorkspace(button.dataset.openCompanyWorkspace)));
  }

  async function openCompanyWorkspace(partnershipId){
    state.workspaceId=String(partnershipId);
    show(`${head("Private Partnership Workspace","Loading company partnership","AIFT is loading the verified negotiation workspace.")}<div class="esc-body"><div class="esc-note">Loading agreement, work plans and meetings…</div></div>`);
    try{
      const data=await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(partnershipId)}`);
      state.workspace=data.workspace;
      renderCompanyWorkspace(data.workspace);
    }catch(err){
      show(`${head("Company Partnership",err.status===409?"Waiting for AIFT verification":"Workspace unavailable",err.message)}<div class="esc-success"><div class="esc-success-inner"><div class="esc-success-icon">${err.status===409?"…":"!"}</div><h3>${esc(err.message)}</h3><p>The private workspace becomes available after AIFT verifies the introduction.</p><div style="margin-top:18px"><button class="esc-btn" data-esc-close>Close</button></div></div></div>`);
    }
  }

  function canCompanyApprove(workspace){
    const partnership=workspace.partnership || {};
    if(partnership.status !== "review") return false;
    const requester=id(partnership.requestedByOrganizationId || partnership.companyId);
    return me() !== requester;
  }

  function workspaceCapabilities(capabilities={}){
    return [["internships","Internships"],["jobs","Jobs"],["recruitment","Recruitment"],["training","Training"],["careerEvents","Events"],["scholarships","Sponsored opportunities"],["mentorship","Mentorship"],["research","Research"]]
      .map(([key,label])=>chip("escWorkspaceCapabilities",key,label,capabilities[key]===true)).join("");
  }

  function renderCompanyWorkspace(workspace){
    state.workspace=workspace;
    const partnership=workspace.partnership || {};
    const editable=workspace.canEditAgreement === true;
    const requester=id(partnership.requestedByOrganizationId || partnership.companyId);
    const partner=me() === id(partnership.companyId) ? partnership.partnerCompanyId : partnership.companyId;
    const canApprove=canCompanyApprove(workspace);

    show(`
      ${head("Private Company Partnership",partnership.title || "Company partnership",`${name(partner,"Partner company")} · ${title(partnership.status)}`)}
      ${progress("AIFT verified","Negotiate & meet","Approve & activate")}
      <div class="esc-body">
        <section class="esc-section"><div class="esc-note"><strong>Private stage:</strong> this agreement is visible to the two companies and AIFT. It is not a public partnership until approved and activated.</div></section>
        <section class="esc-section"><div class="esc-section-head"><strong>Agreement scope</strong><span>Both companies can refine the scope while the relationship is in review/approved stage.</span></div><form id="escCompanyAgreementForm"><div class="esc-grid"><div class="esc-field full"><label>Agreement summary</label><textarea id="escWorkspaceSummary" ${editable?"":"disabled"}>${esc(workspace.agreementSummary || partnership.objective || "")}</textarea></div><div class="esc-field full"><label>Areas to work on</label><div class="esc-inline-checks">${workspaceCapabilities(workspace.capabilities || partnership.capabilities)}</div></div><div class="esc-field full"><label>Planned activities</label><input id="escWorkspaceActivities" ${editable?"":"disabled"} value="${esc((workspace.activities || []).join(", "))}" placeholder="Joint hiring, project delivery, events, training"></div></div>${editable?`<div class="esc-mini-actions"><button type="submit" class="esc-btn primary">Save scope</button></div>`:""}</form></section>
        <section class="esc-section"><div class="esc-section-head"><strong>Specific plans</strong><span>Add concrete items and let the other company agree or decline.</span></div>${editable?`<form id="escCompanyWorkForm" class="esc-grid"><div class="esc-field"><label>Plan type</label><select id="escWorkspaceWorkType">${option("job","Job / hiring")}${option("recruitment","Recruitment")}${option("industry_project","Industry project",true)}${option("training","Training")}${option("career_event","Event")}${option("mentorship","Mentorship")}${option("research","Research")}${option("internship","Internship collaboration")}${option("other","Other")}</select></div><div class="esc-field"><label>Plan title</label><input id="escWorkspaceWorkTitle" required placeholder="Example: Joint data project"></div><div class="esc-field full"><label>Details</label><textarea id="escWorkspaceWorkDetails" placeholder="What should both companies agree to do?"></textarea></div><div class="esc-field full"><button class="esc-btn" type="submit">Add proposal</button></div></form>`:""}<div style="margin-top:10px">${(workspace.workItems || []).length?(workspace.workItems || []).map(item=>`<div class="esc-work-item"><strong>${esc(item.title)}</strong><p>${esc(item.description || "")}</p><div class="esc-work-meta">${esc(title(item.type))} · ${esc(title(item.status))}</div>${item.status==="proposed"&&id(item.proposedBy)!==me()?`<div class="esc-mini-actions"><button class="esc-btn success" data-company-work-response="agreed" data-item-id="${esc(item._id)}">Agree</button><button class="esc-btn danger" data-company-work-response="declined" data-item-id="${esc(item._id)}">Decline</button></div>`:""}</div>`).join(""):'<div class="esc-note">No specific plans yet.</div>'}</div></section>
        <section class="esc-section"><div class="esc-section-head"><strong>Private agreement meeting</strong><span>Either company can request an AIFT meeting before final approval.</span></div>${editable?`<form id="escCompanyMeetingForm" class="esc-grid"><div class="esc-field"><label>Preferred date & time</label><input id="escWorkspaceMeetingAt" type="datetime-local" required></div><div class="esc-field"><label>Duration</label><select id="escWorkspaceMeetingDuration">${option("30","30 minutes",true)}${option("45","45 minutes")}${option("60","60 minutes")}${option("90","90 minutes")}</select></div><div class="esc-field full"><label>Purpose</label><textarea id="escWorkspaceMeetingPurpose" placeholder="What should both companies discuss?"></textarea></div><div class="esc-field full"><button class="esc-btn" type="submit">Request meeting</button></div></form>`:""}<div style="margin-top:10px">${(workspace.meetingRequests || []).length?(workspace.meetingRequests || []).map(item=>`<div class="esc-work-item"><strong>${esc(new Date(item.preferredAt).toLocaleString())}</strong><p>${esc(item.purpose || "Partnership agreement meeting")}</p><div class="esc-work-meta">${esc(title(item.status))} · ${esc(item.durationMinutes || 30)} minutes</div>${item.status==="requested"&&id(item.requestedBy)!==me()?`<div class="esc-mini-actions"><button class="esc-btn success" data-company-meeting-response="accepted" data-request-id="${esc(item._id)}">Accept</button><button class="esc-btn danger" data-company-meeting-response="declined" data-request-id="${esc(item._id)}">Decline</button></div>`:""}${item.meetingId?.joinUrl?`<div class="esc-mini-actions"><button class="esc-btn primary" data-company-meeting-url="${esc(item.meetingId.joinUrl)}">Open meeting</button></div>`:""}</div>`).join(""):'<div class="esc-note">No meeting requests yet.</div>'}</div></section>
        <section class="esc-section"><div class="esc-section-head"><strong>Partnership decision</strong><span>${me()===requester?"You sent this proposal. The receiving company controls approval after AIFT verification.":"You are the receiving company for this proposal."}</span></div><div class="esc-mini-actions">${canApprove?`<button class="esc-btn success" data-company-partnership-status="approved">Approve partnership</button><button class="esc-btn danger" data-company-partnership-status="rejected">Reject</button>`:""}${partnership.status==="approved"?`<button class="esc-btn success" data-company-partnership-status="active">Activate partnership</button>`:""}</div></section>
      </div>
      <div id="empSmartCareerError" class="esc-error" hidden></div><footer class="esc-foot"><div class="esc-foot-copy">AIFT verification remains part of the permanent partnership history.</div><div class="esc-actions"><button class="esc-btn" data-esc-close>Close</button></div></footer>`);

    wireCompanyWorkspace();
  }

  async function reloadCompanyWorkspace(){
    const data=await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}`);
    renderCompanyWorkspace(data.workspace);
  }

  function wireCompanyWorkspace(){
    document.getElementById("escCompanyAgreementForm")?.addEventListener("submit",async event=>{
      event.preventDefault();
      try{
        const selected=new Set(checkedValues("escWorkspaceCapabilities"));
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/agreement`,{method:"PATCH",body:JSON.stringify({agreementSummary:value("escWorkspaceSummary"),activities:comma("escWorkspaceActivities"),capabilities:{internships:selected.has("internships"),jobs:selected.has("jobs"),recruitment:selected.has("recruitment"),training:selected.has("training"),careerEvents:selected.has("careerEvents"),scholarships:selected.has("scholarships"),mentorship:selected.has("mentorship"),research:selected.has("research")}})});
        await reloadCompanyWorkspace();
      }catch(err){error(err.message);}
    });

    document.getElementById("escCompanyWorkForm")?.addEventListener("submit",async event=>{
      event.preventDefault();
      try{
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/work-items`,{method:"POST",body:JSON.stringify({type:value("escWorkspaceWorkType"),title:value("escWorkspaceWorkTitle"),description:value("escWorkspaceWorkDetails")})});
        await reloadCompanyWorkspace();
      }catch(err){error(err.message);}
    });

    document.getElementById("escCompanyMeetingForm")?.addEventListener("submit",async event=>{
      event.preventDefault();
      try{
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/meetings`,{method:"POST",body:JSON.stringify({preferredAt:value("escWorkspaceMeetingAt"),durationMinutes:Number(value("escWorkspaceMeetingDuration") || 30),purpose:value("escWorkspaceMeetingPurpose")})});
        await reloadCompanyWorkspace();
      }catch(err){error(err.message);}
    });

    document.querySelectorAll("[data-company-work-response]").forEach(button=>button.addEventListener("click",async()=>{
      try{
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/work-items/${encodeURIComponent(button.dataset.itemId)}/respond`,{method:"PATCH",body:JSON.stringify({status:button.dataset.companyWorkResponse})});
        await reloadCompanyWorkspace();
      }catch(err){error(err.message);}
    }));

    document.querySelectorAll("[data-company-meeting-response]").forEach(button=>button.addEventListener("click",async()=>{
      try{
        await api(`/api/opportunities/partnership-workspace/${encodeURIComponent(state.workspaceId)}/meetings/${encodeURIComponent(button.dataset.requestId)}/respond`,{method:"PATCH",body:JSON.stringify({status:button.dataset.companyMeetingResponse})});
        await reloadCompanyWorkspace();
      }catch(err){error(err.message);}
    }));

    document.querySelectorAll("[data-company-meeting-url]").forEach(button=>button.addEventListener("click",()=>{ if(button.dataset.companyMeetingUrl) location.href=button.dataset.companyMeetingUrl; }));

    document.querySelectorAll("[data-company-partnership-status]").forEach(button=>button.addEventListener("click",async()=>{
      try{
        await api(`/api/opportunities/company-partnerships/${encodeURIComponent(state.workspaceId)}/status`,{method:"PATCH",body:JSON.stringify({status:button.dataset.companyPartnershipStatus,note:"Company partnership decision recorded from the private AIFT workspace."})});
        await reloadCompanyWorkspace();
        await loadCompanyPartnerships(true);
        window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"company-partnership-workspace"}}));
      }catch(err){error(err.message);}
    }));
  }

  function installOverrides(){
    window.openEmployerCareerOpportunityBuilder=()=>renderOpportunity("job");
    window.openEmployerCareerPartnershipComposer=(partnershipId=null)=>{
      if(partnershipId && window.AIFTCareerHubCreate?.openPartnershipWorkspace) return window.AIFTCareerHubCreate.openPartnershipWorkspace(partnershipId);
      return openPartnership("school");
    };
    window.openEmployerCareerCampusComposer=()=>openCampus("offer_internships");
    window.openEmployerCompanyPartnershipComposer=()=>openPartnership("company");
    window.openEmployerCompanyPartnershipWorkspace=openCompanyWorkspace;

    if(typeof window.renderEmployerCareerPartnerships === "function" && !window.renderEmployerCareerPartnerships.__aiftSmartWrapped){
      const original=window.renderEmployerCareerPartnerships;
      const wrapped=function(...args){
        const result=original.apply(this,args);
        Promise.resolve(loadCompanyPartnerships(true)).catch(()=>{});
        return result;
      };
      wrapped.__aiftSmartWrapped=true;
      window.renderEmployerCareerPartnerships=wrapped;
    }
  }

  function init(){
    ensureUI();
    installOverrides();
    setTimeout(()=>loadCompanyPartnerships(true),1000);
    window.addEventListener("aift:activity-updated",()=>loadCompanyPartnerships(true),{passive:true});
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
