(() => {
  "use strict";

  const PAGE=String(location.pathname.split("/").pop()||"").toLowerCase();
  const ROLE=String(localStorage.getItem("role")||"").toLowerCase();
  if(PAGE!=="student.html" || !["student","talent"].includes(ROLE)) return;

  const API=window.API_BASE || "https://backend-1-9b6f.onrender.com";
  const state={category:"",items:[],scholarshipApplications:[],eventRegistrations:[],user:null,selected:null};

  function token(){
    for(const key of ["studentToken","talentToken","token"]){
      const value=localStorage.getItem(key)||sessionStorage.getItem(key);
      if(value) return value;
    }
    return "";
  }
  function esc(value){return String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
  function id(value){if(value&&typeof value==="object") return String(value._id||value.id||"");return String(value||"");}
  function title(value){return String(value||"").replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());}
  function arr(value,keys=[]){if(Array.isArray(value))return value;for(const key of keys)if(Array.isArray(value?.[key]))return value[key];if(Array.isArray(value?.items))return value.items;return [];}
  function fmt(value,withTime=false){if(!value)return "Not specified";const date=new Date(value);if(Number.isNaN(date.getTime()))return "Not specified";return withTime?date.toLocaleString([], {year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):date.toLocaleDateString([], {year:"numeric",month:"short",day:"numeric"});}
  async function api(path,options={}){
    const response=await fetch(API+path,{...options,cache:"no-store",headers:{Authorization:`Bearer ${token()}`,...(options.body?{"Content-Type":"application/json"}:{}),...(options.headers||{})}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok){const error=new Error(data.message||`Request failed (${response.status})`);error.status=response.status;error.data=data;throw error;}
    return data;
  }
  async function uploadDocument(file,label){
    const form=new FormData();
    form.append("file",file);
    form.append("name",label||file.name);
    const response=await fetch(`${API}/api/opportunities/career-application-upload`,{method:"POST",cache:"no-store",headers:{Authorization:`Bearer ${token()}`},body:form});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.message||`Document upload failed (${response.status})`);
    return data.document||data.item;
  }

  function ensureStyles(){
    if(document.getElementById("studentCareerMarketsStyles"))return;
    const style=document.createElement("style");
    style.id="studentCareerMarketsStyles";
    style.textContent=`
      .scm-card{padding:15px 0;display:grid;grid-template-columns:48px minmax(0,1fr) auto;gap:13px;align-items:start;border-bottom:1px solid #edf1f5}.scm-card:last-child{border-bottom:0}.scm-icon{width:48px;height:48px;display:grid;place-items:center;border:1px solid #e0e6ee;border-radius:12px;background:#f7f9fc;color:#1a73e8;font-size:16px}.scm-icon.scholarship{background:#f6f4ff;color:#6d28d9}.scm-icon.event{background:#fff7e8;color:#b76b00}.scm-icon.partner{background:#edf9f1;color:#16713c}.scm-main h4{margin:0;color:#172033;font-size:13px}.scm-org{display:block;margin-top:4px;color:#667085;font-size:9px}.scm-main p{margin:7px 0 0;color:#475467;font-size:9px;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.scm-meta{display:flex;gap:6px;flex-wrap:wrap;margin-top:9px}.scm-meta span{padding:5px 7px;border-radius:999px;background:#f2f4f7;color:#475467;font-size:7.5px;font-weight:750}.scm-meta .verified{background:#e8f7ee;color:#16713c}.scm-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.scm-docs{display:grid;gap:9px}.scm-doc{padding:11px;border:1px solid #dfe5ec;border-radius:10px;background:#fafbfc}.scm-doc label{display:block;margin-bottom:6px;color:#344054;font-size:9px;font-weight:800}.scm-doc input{font-size:9px;max-width:100%}.scm-upload-state{display:block;margin-top:5px;color:#667085;font-size:8px}.scm-requirements{display:grid;gap:6px;margin-top:8px}.scm-requirements div{padding:8px 9px;border-radius:8px;background:#f7f9fc;color:#475467;font-size:8.5px;line-height:1.45}.scm-funding{padding:13px;border:1px solid #ded7ff;border-radius:11px;background:#f8f7ff}.scm-funding strong{display:block;color:#5b21b6;font-size:11px}.scm-funding span{display:block;margin-top:4px;color:#667085;font-size:8.5px}.scm-event-status{padding:10px 11px;border:1px solid #dbe7f5;border-radius:10px;background:#f7fbff;color:#475467;font-size:9px;line-height:1.5}.scm-partner-capabilities{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.scm-partner-capabilities span{padding:5px 7px;border-radius:999px;background:#edf9f1;color:#16713c;font-size:7.5px;font-weight:750}
      @media(max-width:760px){.scm-card{grid-template-columns:42px minmax(0,1fr)}.scm-icon{width:42px;height:42px}.scm-actions{grid-column:1/-1;justify-content:stretch}.scm-actions .scv2-btn{flex:1}}
    `;
    document.head.appendChild(style);
  }

  function panel(){
    const main=document.querySelector("#section-career .student-career-main");
    if(!main)return null;
    let node=document.getElementById("studentCareerMarketsPanel");
    if(!node){node=document.createElement("section");node.id="studentCareerMarketsPanel";node.className="scv2-panel";node.hidden=true;main.prepend(node);}
    return node;
  }
  function hideOthers(hide=true){
    const main=document.querySelector("#section-career .student-career-main");
    if(!main)return;
    [...main.children].forEach(child=>{
      if(child.id==="studentCareerMarketsPanel")return;
      if(child.id==="studentCareerV2Panel"||child.id==="studentCareerFocusPanel")child.hidden=true;
      else if(child.classList?.contains("student-career-card"))child.hidden=hide;
    });
  }
  function header(titleText,copy){return `<header class="scv2-head"><div><span class="scv2-eyebrow">AIFT CAREER HUB</span><h3>${esc(titleText)}</h3><p>${esc(copy)}</p></div><div class="scv2-head-actions"><button class="scv2-btn" type="button" data-scm-back>Back to Career Hub</button></div></header>`;}
  function showLoading(titleText){const node=panel();if(!node)return;hideOthers(true);node.hidden=false;node.innerHTML=`${header(titleText,"Loading live AIFT records…")}<div class="scv2-empty"><strong>Loading…</strong>Please wait while AIFT checks availability and your existing activity.</div>`;node.scrollIntoView({behavior:"smooth",block:"start"});}
  function closeMarket(){const node=panel();if(node)node.hidden=true;hideOthers(false);state.category="";}

  function scholarshipApplication(scholarshipId){return state.scholarshipApplications.find(item=>id(item.scholarshipId)===String(scholarshipId)||id(item.scholarshipId?._id)===String(scholarshipId));}
  function eventRegistration(eventId){return state.eventRegistrations.find(item=>id(item.eventId)===String(eventId)||id(item.eventId?._id)===String(eventId));}
  function scholarshipOrg(item){const school=item.schoolId||{};return item.sponsor?.name||school.schoolName||school.name||"AIFT Scholarship Provider";}
  function eventOrg(item){const owner=item.companyId||item.schoolId||{};return owner.companyName||owner.schoolName||owner.name||"AIFT Organizer";}
  function fundingText(item){const funding=item.funding||{};if(funding.amount)return `${String(funding.currency||"PHP").toUpperCase()} ${Number(funding.amount).toLocaleString()}`;if(funding.percentage)return `${funding.percentage}% support`;return title(funding.type||"Funding support");}

  async function loadUser(){if(state.user)return state.user;const data=await api("/api/users/me");state.user=data.user||data.data||data||{};return state.user;}

  async function openScholarships(){
    state.category="scholarships";showLoading("Scholarships");
    try{
      const [listData,appsData]=await Promise.all([api("/api/scholarships"),api("/api/scholarship-applications").catch(()=>({applications:[]}))]);
      state.items=arr(listData,["scholarships"]).filter(item=>["published","open"].includes(String(item.status||"").toLowerCase()));
      state.scholarshipApplications=arr(appsData,["applications"]);
      renderScholarships();
    }catch(error){renderError("Scholarships",error.message);}
  }

  function renderScholarships(items=state.items){
    const node=panel();if(!node)return;
    node.innerHTML=`${header("Scholarships","Funding opportunities keep their own Scholarship Application because essays, academic details and supporting documents are different from a job application.")}<div class="scv2-tools"><input id="scmSearch" class="scv2-search" type="search" placeholder="Search scholarships…"><div class="scv2-count">${items.length} scholarship${items.length===1?"":"s"}</div></div><div class="scv2-list">${items.length?items.map(item=>{const app=scholarshipApplication(id(item));return `<article class="scm-card"><span class="scm-icon scholarship"><i class="fa-solid fa-graduation-cap"></i></span><div class="scm-main"><h4>${esc(item.title||"Scholarship")}</h4><span class="scm-org">${esc(scholarshipOrg(item))}</span><p>${esc(item.summary||item.description||"Education funding available through AIFT.")}</p><div class="scm-meta"><span>${esc(title(item.type||"scholarship"))}</span><span>${esc(fundingText(item))}</span>${item.deadline?`<span>Deadline ${esc(fmt(item.deadline))}</span>`:""}${item.requiredDocuments?.length?`<span>${item.requiredDocuments.length} document${item.requiredDocuments.length===1?"":"s"} required</span>`:""}</div></div><div class="scm-actions"><button class="scv2-btn" type="button" data-scm-scholarship-view="${esc(id(item))}">View details</button>${app?`<button class="scv2-btn soft" type="button" data-scm-scholarship-app="${esc(id(app))}">${esc(title(app.status||"submitted"))}</button>`:item.allowInternalApplications!==false?`<button class="scv2-btn primary" type="button" data-scm-scholarship-apply="${esc(id(item))}">Apply</button>`:`<button class="scv2-btn" type="button" data-scm-scholarship-view="${esc(id(item))}">Application instructions</button>`}</div></article>`;}).join(""):'<div class="scv2-empty"><strong>No open scholarships right now.</strong>New AIFT-approved scholarships will appear here.</div>'}</div>`;
    node.hidden=false;
  }

  async function getScholarship(scholarshipId){const cached=state.items.find(item=>id(item)===String(scholarshipId));if(cached)return cached;const data=await api(`/api/scholarships/${encodeURIComponent(scholarshipId)}`);return data.scholarship||data.item||data;}

  function scholarshipDetails(item){
    const requirements=Array.isArray(item.requirements)?item.requirements:[];
    const documents=Array.isArray(item.requiredDocuments)?item.requiredDocuments:[];
    return `${modalHead("AIFT SCHOLARSHIP",item.title||"Scholarship",scholarshipOrg(item))}<div class="scv2-modal-body"><div class="scv2-detail-grid"><main><section class="scv2-section"><h4>About this scholarship</h4><p>${esc(item.description||item.summary||"No additional description.")}</p></section>${requirements.length?`<section class="scv2-section"><h4>Eligibility & requirements</h4><div class="scm-requirements">${requirements.map(value=>`<div>${esc(value)}</div>`).join("")}</div></section>`:""}${documents.length?`<section class="scv2-section"><h4>Documents you will need</h4><div class="scm-requirements">${documents.map(value=>`<div><i class="fa-regular fa-file"></i> ${esc(value)}</div>`).join("")}</div></section>`:""}${item.applicationInstructions?`<section class="scv2-section"><h4>Application instructions</h4><p>${esc(item.applicationInstructions)}</p></section>`:""}</main><aside><div class="scm-funding"><strong>${esc(fundingText(item))}</strong><span>${esc(title(item.funding?.type||"Scholarship funding"))}</span></div><div class="scv2-side" style="margin-top:10px"><div class="scv2-side-row"><span>Deadline</span><strong>${esc(fmt(item.deadline))}</strong></div><div class="scv2-side-row"><span>Awards</span><strong>${esc(item.numberOfAwards||"Not specified")}</strong></div><div class="scv2-side-row"><span>Academic year</span><strong>${esc(item.academicYear||"Not specified")}</strong></div></div></aside></div></div><footer class="scv2-modal-foot"><button class="scv2-btn" type="button" data-scm-close>Close</button><div class="scv2-modal-foot-right">${scholarshipApplication(id(item))?`<button class="scv2-btn soft" data-scm-scholarship-app="${esc(id(scholarshipApplication(id(item))))}">View application</button>`:item.allowInternalApplications!==false?`<button class="scv2-btn primary" data-scm-scholarship-apply="${esc(id(item))}">Apply through AIFT</button>`:item.externalApplicationUrl?`<a class="scv2-btn primary" href="${esc(item.externalApplicationUrl)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;text-decoration:none">Open provider application</a>`:""}</div></footer>`;
  }

  async function openScholarshipDetails(scholarshipId){try{const item=await getScholarship(scholarshipId);state.selected=item;showModal(scholarshipDetails(item));}catch(error){showMessageModal("Scholarship unavailable",error.message);}}

  async function openScholarshipApply(scholarshipId){
    try{
      const [item,user]=await Promise.all([getScholarship(scholarshipId),loadUser()]);state.selected=item;
      const docs=Array.isArray(item.requiredDocuments)?item.requiredDocuments:[];
      const financial=item.eligibility?.financialNeedRequired===true;
      showModal(`<form id="scmScholarshipForm" style="min-height:0;display:flex;flex:1 1 auto;flex-direction:column;overflow:hidden">${modalHead("AIFT SCHOLARSHIP APPLICATION",`Apply for ${item.title||"scholarship"}`,"Your submission goes through AIFT Review before School processing.")}<div class="scv2-modal-body"><div id="scmFormMessage" class="scv2-message" hidden></div><section class="scv2-section"><h4>Your statement</h4><div class="scv2-form-grid"><div class="scv2-field full"><label>Why should you receive this scholarship?</label><textarea id="scmPersonalStatement" required placeholder="Explain your goals, situation and how this support would help."></textarea></div>${financial?`<div class="scv2-field full"><label>Financial need statement</label><textarea id="scmFinancialNeed" required placeholder="Explain the financial circumstances relevant to this scholarship."></textarea></div>`:""}<div class="scv2-field full"><label>Achievements (one per line)</label><textarea id="scmAchievements" placeholder="Academic award\nLeadership role\nCommunity contribution"></textarea></div><div class="scv2-field"><label>Program</label><input id="scmProgram" value="${esc(user.course||user.program||"")}"></div><div class="scv2-field"><label>Year level</label><input id="scmYearLevel" value="${esc(user.yearLevel||"")}"></div><div class="scv2-field"><label>GPA (optional)</label><input id="scmGpa" type="number" min="0" step="0.01"></div><div class="scv2-field"><label>Grade average % (optional)</label><input id="scmGradeAverage" type="number" min="0" max="100" step="0.01"></div></div></section>${docs.length?`<section class="scv2-section"><h4>Required documents</h4><p style="margin-bottom:9px">Choose the actual files from your device. AIFT uploads them securely before the application is submitted.</p><div class="scm-docs">${docs.map((label,index)=>`<div class="scm-doc"><label>${esc(label)}</label><input type="file" data-scm-doc-index="${index}" data-scm-doc-label="${esc(label)}" required accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"><span class="scm-upload-state">Not uploaded yet</span></div>`).join("")}</div></section>`:""}</div><footer class="scv2-modal-foot"><button class="scv2-btn" type="button" data-scm-close>Cancel</button><div class="scv2-modal-foot-right"><button id="scmScholarshipSubmit" class="scv2-btn primary" type="submit">Submit to AIFT</button></div></footer></form>`);
      document.getElementById("scmScholarshipForm")?.addEventListener("submit",submitScholarship);
    }catch(error){showMessageModal("Application unavailable",error.message);}
  }

  function val(field){return String(document.getElementById(field)?.value||"").trim();}
  function lines(field){return val(field).split(/\r?\n/).map(value=>value.trim()).filter(Boolean);}
  async function submitScholarship(event){
    event.preventDefault();const item=state.selected;if(!item)return;
    const button=document.getElementById("scmScholarshipSubmit");const message=document.getElementById("scmFormMessage");
    if(button){button.disabled=true;button.textContent="Preparing application…";}if(message)message.hidden=true;
    try{
      const documents=[];const inputs=[...document.querySelectorAll("[data-scm-doc-index]")];
      for(let index=0;index<inputs.length;index+=1){const input=inputs[index];const file=input.files?.[0];if(!file)throw new Error(`Choose the required file: ${input.dataset.scmDocLabel}.`);const status=input.parentElement.querySelector(".scm-upload-state");if(status)status.textContent=`Uploading ${index+1} of ${inputs.length}…`;const uploaded=await uploadDocument(file,input.dataset.scmDocLabel);documents.push(uploaded);if(status)status.textContent="Uploaded securely";}
      if(button)button.textContent="Submitting to AIFT Review…";
      const data=await api("/api/scholarship-applications",{method:"POST",body:JSON.stringify({scholarshipId:id(item),status:"submitted",personalStatement:val("scmPersonalStatement"),financialNeedStatement:val("scmFinancialNeed"),achievements:lines("scmAchievements"),documents,academicSnapshot:{program:val("scmProgram"),yearLevel:val("scmYearLevel"),gpa:val("scmGpa")||null,gradeAverage:val("scmGradeAverage")||null}})});
      state.scholarshipApplications.unshift(data.application||data.item);
      if(message){message.classList.add("success");message.textContent=data.message||"Scholarship application submitted.";message.hidden=false;}
      if(button)button.textContent="Submitted";
      window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"student-scholarship-application",reviewCase:data.reviewCase}}));
      setTimeout(()=>{closeModal();renderScholarships();},900);
    }catch(error){if(message){message.classList.remove("success");message.textContent=error.message;message.hidden=false;}if(button){button.disabled=false;button.textContent="Submit to AIFT";}}
  }

  async function openScholarshipApplication(applicationId){
    try{const data=await api(`/api/scholarship-applications/${encodeURIComponent(applicationId)}`);const app=data.application||data.item||data;const scholarship=app.scholarshipId||{};showModal(`${modalHead("MY SCHOLARSHIP APPLICATION",scholarship.title||"Scholarship",`Status: ${title(app.status||"submitted")}`)}<div class="scv2-modal-body"><div class="scv2-detail-grid"><main><section class="scv2-section"><h4>Personal statement</h4><p>${esc(app.personalStatement||"No statement saved.")}</p></section>${app.documents?.length?`<section class="scv2-section"><h4>Documents</h4><div class="scm-requirements">${app.documents.map(doc=>`<div><a href="${esc(doc.url)}" target="_blank" rel="noopener">${esc(doc.name||"Document")}</a></div>`).join("")}</div></section>`:""}</main><aside class="scv2-side"><div class="scv2-side-row"><span>Status</span><strong>${esc(title(app.status||"submitted"))}</strong></div><div class="scv2-side-row"><span>Submitted</span><strong>${esc(fmt(app.submittedAt||app.createdAt,true))}</strong></div></aside></div></div><footer class="scv2-modal-foot"><button class="scv2-btn" data-scm-close>Close</button><div class="scv2-modal-foot-right">${["draft","submitted","review","shortlisted","approved"].includes(String(app.status||""))?`<button class="scv2-btn danger" data-scm-scholarship-withdraw="${esc(id(app))}">Withdraw</button>`:""}</div></footer>`);}catch(error){showMessageModal("Application unavailable",error.message);}
  }

  async function openEvents(){
    state.category="events";showLoading("Career Events");
    try{const [listData,regsData]=await Promise.all([api("/api/career-events"),api("/api/career-event-registrations").catch(()=>({registrations:[]}))]);state.items=arr(listData,["events"]).filter(item=>!["draft","cancelled","archived","completed"].includes(String(item.status||"").toLowerCase()));state.eventRegistrations=arr(regsData,["registrations"]);renderEvents();}catch(error){renderError("Career Events",error.message);}
  }

  function eventLocation(item){if(item.format==="online")return item.onlinePlatform||"Online";return item.location?.venue||item.location?.address||item.venue||title(item.format||"Event");}
  function renderEvents(items=state.items){
    const node=panel();if(!node)return;
    node.innerHTML=`${header("Career Events","Career fairs, workshops, company talks, recruitment events and other approved AIFT events. Registration stays separate from job applications.")}<div class="scv2-tools"><input id="scmSearch" class="scv2-search" type="search" placeholder="Search events…"><div class="scv2-count">${items.length} event${items.length===1?"":"s"}</div></div><div class="scv2-list">${items.length?items.map(item=>{const reg=eventRegistration(id(item));return `<article class="scm-card"><span class="scm-icon event"><i class="fa-solid fa-calendar-days"></i></span><div class="scm-main"><h4>${esc(item.title||"Career event")}</h4><span class="scm-org">${esc(eventOrg(item))}</span><p>${esc(item.summary||item.description||"AIFT Career Hub event.")}</p><div class="scm-meta"><span>${esc(title(item.eventType||"event"))}</span><span>${esc(fmt(item.startAt,true))}</span><span>${esc(eventLocation(item))}</span>${item.capacity?`<span>${Number(item.registeredCount||0)}/${Number(item.capacity)} seats</span>`:""}</div></div><div class="scm-actions"><button class="scv2-btn" data-scm-event-view="${esc(id(item))}">View</button>${reg?`<button class="scv2-btn soft" data-scm-event-registration="${esc(id(reg))}">${esc(title(reg.status||"registered"))}</button>`:item.registrationRequired?`<button class="scv2-btn primary" data-scm-event-register="${esc(id(item))}">Register</button>`:`<button class="scv2-btn" data-scm-event-view="${esc(id(item))}">View event</button>`}</div></article>`;}).join(""):'<div class="scv2-empty"><strong>No upcoming events right now.</strong>Approved Career Hub events will appear here.</div>'}</div>`;node.hidden=false;
  }

  async function getEvent(eventId){const cached=state.items.find(item=>id(item)===String(eventId));if(cached)return cached;const data=await api(`/api/career-events/${encodeURIComponent(eventId)}`);return data.event||data.item||data;}
  async function openEventDetails(eventId){try{const item=await getEvent(eventId);state.selected=item;const reg=eventRegistration(id(item));showModal(`${modalHead("AIFT CAREER EVENT",item.title||"Career event",eventOrg(item))}<div class="scv2-modal-body"><div class="scv2-detail-grid"><main><section class="scv2-section"><h4>About this event</h4><p>${esc(item.description||item.summary||"No additional description.")}</p></section>${item.agenda?.length?`<section class="scv2-section"><h4>Agenda</h4><div class="scm-requirements">${item.agenda.map(row=>`<div>${esc(row.title||row)}</div>`).join("")}</div></section>`:""}</main><aside class="scv2-side"><div class="scv2-side-row"><span>Starts</span><strong>${esc(fmt(item.startAt,true))}</strong></div><div class="scv2-side-row"><span>Ends</span><strong>${esc(fmt(item.endAt,true))}</strong></div><div class="scv2-side-row"><span>Format</span><strong>${esc(title(item.format||"event"))}</strong></div><div class="scv2-side-row"><span>Location</span><strong>${esc(eventLocation(item))}</strong></div><div class="scv2-side-row"><span>Registration deadline</span><strong>${esc(fmt(item.registrationDeadline,true))}</strong></div></aside></div></div><footer class="scv2-modal-foot"><button class="scv2-btn" data-scm-close>Close</button><div class="scv2-modal-foot-right">${reg?`<button class="scv2-btn soft" data-scm-event-registration="${esc(id(reg))}">View registration</button>`:item.registrationRequired?`<button class="scv2-btn primary" data-scm-event-register="${esc(id(item))}">Register</button>`:""}</div></footer>`);}catch(error){showMessageModal("Event unavailable",error.message);}}

  async function openEventRegister(eventId){try{const item=await getEvent(eventId);state.selected=item;showModal(`<form id="scmEventForm" style="min-height:0;display:flex;flex:1 1 auto;flex-direction:column;overflow:hidden">${modalHead("AIFT EVENT REGISTRATION",`Register for ${item.title||"event"}`,`${fmt(item.startAt,true)} · ${eventLocation(item)}`)}<div class="scv2-modal-body"><div id="scmFormMessage" class="scv2-message" hidden></div><div class="scm-event-status">AIFT decides whether your registration is confirmed or waitlisted based on available capacity. You do not need to complete a job application for an event.</div><section class="scv2-section" style="margin-top:16px"><div class="scv2-form-grid"><div class="scv2-field full"><label>Message to organizer (optional)</label><textarea id="scmEventMessage" placeholder="Anything the organizer should know?"></textarea></div><div class="scv2-field"><label>Accessibility needs (optional)</label><input id="scmAccessibility"></div><div class="scv2-field"><label>Dietary requirements (optional)</label><input id="scmDietary"></div><div class="scv2-field"><label>Emergency contact name (optional)</label><input id="scmEmergencyName"></div><div class="scv2-field"><label>Emergency contact phone (optional)</label><input id="scmEmergencyPhone"></div></div></section></div><footer class="scv2-modal-foot"><button class="scv2-btn" type="button" data-scm-close>Cancel</button><div class="scv2-modal-foot-right"><button id="scmEventSubmit" class="scv2-btn primary" type="submit">Register</button></div></footer></form>`);document.getElementById("scmEventForm")?.addEventListener("submit",submitEventRegistration);}catch(error){showMessageModal("Registration unavailable",error.message);}}

  async function submitEventRegistration(event){event.preventDefault();const item=state.selected;if(!item)return;const button=document.getElementById("scmEventSubmit"),message=document.getElementById("scmFormMessage");if(button){button.disabled=true;button.textContent="Registering…";}try{const data=await api("/api/career-event-registrations",{method:"POST",body:JSON.stringify({eventId:id(item),message:val("scmEventMessage"),accessibilityNeeds:val("scmAccessibility"),dietaryRequirements:val("scmDietary"),emergencyContactName:val("scmEmergencyName"),emergencyContactPhone:val("scmEmergencyPhone")})});const registration=data.registration||data.item;state.eventRegistrations=state.eventRegistrations.filter(row=>id(row.eventId)!==id(item));state.eventRegistrations.unshift(registration);if(message){message.classList.add("success");message.textContent=data.message||`Registration ${registration?.status||"saved"}.`;message.hidden=false;}if(button)button.textContent="Registered";setTimeout(()=>{closeModal();renderEvents();},800);}catch(error){if(message){message.classList.remove("success");message.textContent=error.message;message.hidden=false;}if(button){button.disabled=false;button.textContent="Register";}}}

  async function openEventRegistration(registrationId){try{const data=await api(`/api/career-event-registrations/${encodeURIComponent(registrationId)}`);const reg=data.registration||data.item||data;const item=reg.eventId||{};showModal(`${modalHead("MY EVENT REGISTRATION",item.title||"Career event",title(reg.status||"registered"))}<div class="scv2-modal-body"><div class="scm-event-status"><strong>Status: ${esc(title(reg.status||"registered"))}</strong>${reg.waitlistPosition?`<br>Waitlist position: ${Number(reg.waitlistPosition)}`:""}</div><div class="scv2-side" style="margin-top:12px"><div class="scv2-side-row"><span>Event</span><strong>${esc(item.title||"Career event")}</strong></div><div class="scv2-side-row"><span>Starts</span><strong>${esc(fmt(item.startAt,true))}</strong></div><div class="scv2-side-row"><span>Format</span><strong>${esc(title(item.format||"event"))}</strong></div></div></div><footer class="scv2-modal-foot"><button class="scv2-btn" data-scm-close>Close</button></footer>`);}catch(error){showMessageModal("Registration unavailable",error.message);}}

  async function openPartnerships(){
    state.category="partnerships";showLoading("Verified Partnerships");
    try{const user=await loadUser();const schoolId=id(user.linkedSchoolId||user.schoolId||user.createdBySchool);if(!schoolId){state.items=[];renderPartnerships("Your Student account is not connected to a verified School yet, so School partnership pathways cannot be personalized.");return;}const data=await api(`/api/opportunities/verified-partnerships?schoolId=${encodeURIComponent(schoolId)}`);state.items=arr(data,["partnerships"]);renderPartnerships("");}catch(error){renderError("Verified Partnerships",error.message);}
  }

  function capabilities(item){const caps=item.capabilities||{};const labels={internships:"Internships",jobs:"Jobs",recruitment:"Recruitment",training:"Training",careerEvents:"Career Events",scholarships:"Scholarships",mentorship:"Mentorship",research:"Research"};return Object.entries(labels).filter(([key])=>caps[key]===true).map(([,label])=>label);}
  function renderPartnerships(note=""){
    const node=panel();if(!node)return;node.innerHTML=`${header("Verified Partnerships","Only active, AIFT-verified School–Company relationships are shown. These partnerships create trusted pathways for internships, jobs, scholarships, events, training and projects.")}${note?`<div style="margin:12px 20px" class="scm-event-status">${esc(note)}</div>`:""}<div class="scv2-list">${state.items.length?state.items.map(item=>{const company=item.companyId||{};const caps=capabilities(item);return `<article class="scm-card"><span class="scm-icon partner"><i class="fa-solid fa-handshake"></i></span><div class="scm-main"><h4>${esc(company.companyName||company.name||item.companyName||"AIFT Company Partner")}</h4><span class="scm-org">AIFT Verified Education Partner</span><p>${esc(item.title||item.objective||"Active School–Company partnership.")}</p><div class="scm-meta"><span class="verified">✓ Active verified partnership</span>${item.activatedAt?`<span>Active since ${esc(fmt(item.activatedAt))}</span>`:""}</div>${caps.length?`<div class="scm-partner-capabilities">${caps.map(value=>`<span>${esc(value)}</span>`).join("")}</div>`:""}</div><div class="scm-actions">${caps.some(value=>["Internships","Jobs","Recruitment"].includes(value))?`<button class="scv2-btn primary" data-scm-explore-opportunities>Explore opportunities</button>`:""}${caps.includes("Scholarships")?`<button class="scv2-btn" data-scm-open-category="scholarships">Scholarships</button>`:""}${caps.includes("Career Events")?`<button class="scv2-btn" data-scm-open-category="events">Events</button>`:""}</div></article>`;}).join(""):'<div class="scv2-empty"><strong>No active verified partnerships yet.</strong>When your School activates a verified industry partnership, its student pathways will appear here.</div>'}</div>`;node.hidden=false;
  }

  function renderError(titleText,message){const node=panel();if(node)node.innerHTML=`${header(titleText,message)}<div class="scv2-empty"><strong>Could not load this marketplace.</strong>Please try again.</div>`;}

  function ensureModal(){let modal=document.getElementById("studentCareerMarketsModal");if(modal)return modal;modal=document.createElement("div");modal.id="studentCareerMarketsModal";modal.className="scv2-modal";modal.hidden=true;modal.innerHTML='<section class="scv2-dialog"><div id="studentCareerMarketsMount" style="min-height:0;display:flex;flex:1 1 auto;flex-direction:column;overflow:hidden"></div></section>';modal.addEventListener("click",event=>{if(event.target===modal||event.target.closest("[data-scm-close]"))closeModal();});document.body.appendChild(modal);return modal;}
  function modalHead(kicker,heading,copy){return `<header class="scv2-modal-head"><div><span>${esc(kicker)}</span><h3>${esc(heading)}</h3><p>${esc(copy)}</p></div><button class="scv2-close" type="button" data-scm-close>×</button></header>`;}
  function showModal(html){const modal=ensureModal();document.getElementById("studentCareerMarketsMount").innerHTML=html;modal.hidden=false;document.body.style.overflow="hidden";}
  function closeModal(){const modal=document.getElementById("studentCareerMarketsModal");if(modal)modal.hidden=true;document.body.style.overflow="";state.selected=null;}
  function showMessageModal(heading,copy){showModal(`${modalHead("AIFT CAREER HUB",heading,copy)}<div class="scv2-modal-body"></div><footer class="scv2-modal-foot"><button class="scv2-btn" data-scm-close>Close</button></footer>`);}

  async function withdrawScholarship(applicationId){if(!confirm("Withdraw this scholarship application?"))return;try{await api(`/api/scholarship-applications/${encodeURIComponent(applicationId)}`,{method:"PATCH",body:JSON.stringify({status:"withdrawn",statusNote:"Withdrawn by Student from Career Hub."})});await openScholarships();closeModal();window.dispatchEvent(new CustomEvent("aift:activity-updated",{detail:{changed:true,source:"student-scholarship-application"}}));}catch(error){alert(error.message);}}

  function filterCurrent(query){const value=String(query||"").trim().toLowerCase();const filtered=!value?state.items:state.items.filter(item=>JSON.stringify(item).toLowerCase().includes(value));if(state.category==="scholarships")renderScholarships(filtered);else if(state.category==="events")renderEvents(filtered);const search=document.getElementById("scmSearch");if(search){search.value=query;search.focus();}}

  async function updateCounts(){
    try{
      const [scholarships,events,user]=await Promise.all([api("/api/scholarships").catch(()=>({items:[]})),api("/api/career-events").catch(()=>({items:[]})),loadUser().catch(()=>null)]);
      const s=arr(scholarships,["scholarships"]).filter(item=>["published","open"].includes(String(item.status||"").toLowerCase())).length;
      const e=arr(events,["events"]).filter(item=>!["draft","cancelled","archived","completed"].includes(String(item.status||"").toLowerCase())).length;
      const sNode=document.getElementById("studentCareerScholarshipCount");if(sNode)sNode.textContent=String(s);
      const eNode=document.getElementById("studentCareerEventCount");if(eNode)eNode.textContent=String(e);
      if(user){const schoolId=id(user.linkedSchoolId||user.schoolId||user.createdBySchool);if(schoolId){const partnerships=await api(`/api/opportunities/verified-partnerships?schoolId=${encodeURIComponent(schoolId)}`).catch(()=>({items:[]}));const pNode=document.getElementById("studentCareerPartnershipCount");if(pNode)pNode.textContent=String(arr(partnerships,["partnerships"]).length);}}
    }catch{}
  }

  function bind(){
    document.addEventListener("click",event=>{
      const categoryButton=event.target.closest("#section-career [data-career-action]");const action=String(categoryButton?.dataset?.careerAction||"");
      if(["scholarships","events","partnerships"].includes(action)){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();if(action==="scholarships")openScholarships();else if(action==="events")openEvents();else openPartnerships();return;}
      if(event.target.closest("[data-scm-back]")){event.preventDefault();closeMarket();return;}
      const scholarshipView=event.target.closest("[data-scm-scholarship-view]");if(scholarshipView){event.preventDefault();openScholarshipDetails(scholarshipView.dataset.scmScholarshipView);return;}
      const scholarshipApply=event.target.closest("[data-scm-scholarship-apply]");if(scholarshipApply){event.preventDefault();openScholarshipApply(scholarshipApply.dataset.scmScholarshipApply);return;}
      const scholarshipApp=event.target.closest("[data-scm-scholarship-app]");if(scholarshipApp){event.preventDefault();openScholarshipApplication(scholarshipApp.dataset.scmScholarshipApp);return;}
      const scholarshipWithdraw=event.target.closest("[data-scm-scholarship-withdraw]");if(scholarshipWithdraw){event.preventDefault();withdrawScholarship(scholarshipWithdraw.dataset.scmScholarshipWithdraw);return;}
      const eventView=event.target.closest("[data-scm-event-view]");if(eventView){event.preventDefault();openEventDetails(eventView.dataset.scmEventView);return;}
      const eventRegister=event.target.closest("[data-scm-event-register]");if(eventRegister){event.preventDefault();openEventRegister(eventRegister.dataset.scmEventRegister);return;}
      const eventReg=event.target.closest("[data-scm-event-registration]");if(eventReg){event.preventDefault();openEventRegistration(eventReg.dataset.scmEventRegistration);return;}
      const openCat=event.target.closest("[data-scm-open-category]");if(openCat){event.preventDefault();closeModal();if(openCat.dataset.scmOpenCategory==="scholarships")openScholarships();else if(openCat.dataset.scmOpenCategory==="events")openEvents();return;}
      if(event.target.closest("[data-scm-explore-opportunities]")){event.preventDefault();closeMarket();window.AIFTStudentCareerHub?.openMarketplace?.("internships");return;}
    },true);
    document.addEventListener("input",event=>{if(event.target?.id==="scmSearch")filterCurrent(event.target.value);});
  }

  function init(){ensureStyles();bind();updateCounts();const observer=new MutationObserver(()=>updateCounts());const career=document.getElementById("section-career");if(career)observer.observe(career,{childList:true,subtree:true});window.addEventListener("aift:activity-updated",event=>{const source=String(event?.detail?.source||"");if(source.includes("scholarship")||source.includes("event")||source.includes("partnership"))updateCounts();});window.AIFTStudentCareerMarkets={openScholarships,openEvents,openPartnerships,updateCounts};}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
