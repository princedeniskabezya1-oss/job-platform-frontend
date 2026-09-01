(() => {
  "use strict";

  const API = window.API_BASE || "https://backend-1-9b6f.onrender.com";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const page = String(location.pathname.split("/").pop() || "").toLowerCase();
  if(page !== "family.html") return;

  const STUDENT_ACCESS_EXCLUDED_ROLES = new Set(["student","employer","school"]);
  const localRole = String(localStorage.getItem("role") || "").trim().toLowerCase();
  const state = {
    role:localRole,
    profile:null,
    reviews:[],
    rooms:[],
    interested:[],
    students:[],
    links:[],
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

  function studentName(student){
    return [student?.firstName,student?.lastName].filter(Boolean).join(" ") || student?.linkedStudentId?.name || "Student";
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

  function canManageStudents(){
    return Boolean(state.role && !STUDENT_ACCESS_EXCLUDED_ROLES.has(state.role));
  }

  function capabilities(){
    const role=state.role;
    return {
      familyProfile:true,
      manageStudents:canManageStudents(),
      applyScholarshipHere:role === "family",
      viewFamilyScholarshipApplications:role === "family",
      discoverScholarships:true,
      saveDiscovery:true,
      manageVentures:true,
      investorMode:true
    };
  }

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
      .family-access-card,.family-process-card,.family-student-panel{border:1px solid #e3e9f1;border-radius:16px;background:#fff;box-shadow:0 3px 14px rgba(15,23,42,.035);overflow:hidden}
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
      .family-role-note{margin:0 0 14px;padding:12px 13px;border:1px solid #dbe5f0;border-radius:12px;background:#f7fbff;color:#475467;font-size:9px;line-height:1.55}.family-role-note strong{color:#172033}
      .family-student-hero{padding:20px;border:1px solid #d9e7f7;border-radius:18px;background:linear-gradient(135deg,#f5faff,#fff 62%,#f7f4ff);display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:14px}.family-student-hero h1{margin:0;color:#172033;font-size:22px}.family-student-hero p{max-width:720px;margin:6px 0 0;color:#667085;font-size:11px;line-height:1.65}
      .family-student-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:14px}.family-student-summary>div{padding:14px;border:1px solid #e3e9f1;border-radius:14px;background:#fff}.family-student-summary span{display:block;color:#98a2b3;font-size:8px;text-transform:uppercase;letter-spacing:.05em;font-weight:800}.family-student-summary strong{display:block;margin-top:5px;color:#172033;font-size:19px}.family-student-summary small{display:block;margin-top:3px;color:#667085;font-size:8px;line-height:1.4}
      .family-student-panel{padding:0}.family-student-panel-head{padding:14px 16px;border-bottom:1px solid #edf1f5;display:flex;align-items:center;justify-content:space-between;gap:12px}.family-student-panel-head h2{margin:0;color:#172033;font-size:14px}.family-student-panel-head p{margin:3px 0 0;color:#667085;font-size:8px}.family-student-list{display:grid;gap:0}.family-student-row{padding:14px 16px;border-bottom:1px solid #edf1f5;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center}.family-student-row:last-child{border-bottom:0}.family-student-main{display:flex;align-items:center;gap:11px;min-width:0}.family-student-avatar{width:42px;height:42px;border-radius:13px;background:#eaf3ff;color:#0a66c2;display:grid;place-items:center;font-size:12px;font-weight:900;overflow:hidden;flex:0 0 auto}.family-student-avatar img{width:100%;height:100%;object-fit:cover}.family-student-copy{min-width:0}.family-student-copy strong{display:block;color:#172033;font-size:11px}.family-student-copy span{display:block;margin-top:3px;color:#667085;font-size:8px;line-height:1.45}.family-student-state{display:inline-flex;margin-top:6px;padding:4px 7px;border-radius:999px;background:#fff4dc;color:#936000;font-size:7px;font-weight:800}.family-student-state.linked{background:#eaf8f0;color:#157348}.family-student-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.family-student-empty{padding:28px 18px;text-align:center;color:#667085;font-size:10px;line-height:1.6}.family-student-empty strong{display:block;margin-bottom:4px;color:#172033;font-size:13px}.family-apply-guide{margin-bottom:13px;padding:12px 14px;border:1px solid #cfe0f5;border-radius:12px;background:#f6faff;color:#475467;font-size:9px;line-height:1.55}.family-apply-guide strong{color:#172033}
      @media(max-width:980px){.family-role-guide{grid-template-columns:1fr}.family-process-steps{grid-template-columns:repeat(3,1fr)}}
      @media(max-width:680px){.family-process-steps,.family-live-strip,.family-student-summary{grid-template-columns:1fr 1fr}.family-role-guide{margin-top:10px}.family-student-hero{display:block}.family-student-hero .family-actions{margin-top:12px}.family-student-row{grid-template-columns:1fr}.family-student-actions{justify-content:flex-start}}
    `;
    document.head.appendChild(style);
  }

  function setHidden(element,hidden){
    if(!element) return;
    element.classList.toggle("family-role-hidden",Boolean(hidden));
    if(hidden) element.setAttribute("aria-hidden","true");
    else element.removeAttribute("aria-hidden");
  }

  function linkedStudents(){
    return state.students.filter(student => student.linkStatus === "linked" && student.linkedStudentId);
  }

  function pendingStudents(){
    return state.students.filter(student => student.linkStatus === "pending");
  }

  function dynamicNodes(root=document){
    const cap=capabilities();
    root.querySelectorAll?.('[data-apply-scholarship]').forEach(el=>{
      setHidden(el,!cap.applyScholarshipHere);
      if(cap.applyScholarshipHere){
        el.textContent=linkedStudents().length ? "Apply for Student" : "Add Student to Apply";
        el.dataset.familyScholarshipStudentAction="1";
      }
    });
    root.querySelectorAll?.('[data-edit-scholarship-application],[data-delete-scholarship-application],[data-withdraw-scholarship-application],[data-view-scholarship-application]').forEach(el=>setHidden(el,!cap.viewFamilyScholarshipApplications));
    root.querySelectorAll?.('[data-add-child],[data-edit-child],[data-link-child],[data-unlink-child],[data-archive-child]').forEach(el=>setHidden(el,!cap.manageStudents));
  }

  function roleCopy(){
    const role=state.role;
    if(role === "family") return {title:"Family workspace",text:"Add or connect students, apply for scholarships on their behalf, manage project funding and optionally use Investor Mode."};
    if(role === "employer") return {title:"Employer access in Family & Investor",text:"You can use Family & Investor discovery and Venture tools, but the Students area is not available to Employer accounts."};
    if(role === "school") return {title:"School access in Family & Investor",text:"The Students area is not available here because School accounts manage students from the School and LMS workspace."};
    if(role === "student") return {title:"Student access in Family & Investor",text:"Students manage their own education and scholarship activity. The Family Students area is therefore hidden from Student accounts."};
    if(canManageStudents()) return {title:`${title(role)} Family workspace`,text:"Your role can also represent a family relationship. You can add students you support and connect them to verified AIFT Student IDs with the Student's approval."};
    return {title:`${title(role)} access in Family & Investor`,text:"This workspace only shows actions that fit your current AIFT role."};
  }

  function ensureStudentWorkspace(){
    const cap=capabilities();
    const nav=$(".family-nav");
    const workspace=$(".family-workspace");
    if(!nav || !workspace) return;

    let navButton=$("#familyStudentsNav");
    if(cap.manageStudents && !navButton){
      navButton=document.createElement("button");
      navButton.id="familyStudentsNav";
      navButton.type="button";
      navButton.className="family-nav-button";
      navButton.dataset.page="students";
      navButton.innerHTML='♙ <span>Students</span><span class="family-nav-count" id="familyStudentNavCount">0</span>';
      const oldChildren=nav.querySelector('[data-page="children"]');
      if(oldChildren){oldChildren.insertAdjacentElement("beforebegin",navButton);setHidden(oldChildren,true);}
      else nav.insertBefore(navButton,$("#familyInvestorNavLabel") || null);
    }
    setHidden(navButton,!cap.manageStudents);

    let section=$("#familyPage-students");
    if(cap.manageStudents && !section){
      section=document.createElement("section");
      section.id="familyPage-students";
      section.className="family-page";
      section.setAttribute("aria-label","Family Students");
      workspace.appendChild(section);
    }
    setHidden(section,!cap.manageStudents);
    renderStudentWorkspace();
  }

  function renderStudentWorkspace(){
    const section=$("#familyPage-students");
    if(!section || !capabilities().manageStudents) return;
    const linked=linkedStudents();
    const pending=pendingStudents();
    setTextSafe("#familyStudentNavCount",state.students.length);

    section.innerHTML=`
      <div class="family-student-hero">
        <div><div class="family-access-kicker">FAMILY · STUDENT ACCESS</div><h1>Students</h1><p>Add a student you support, then connect that profile to the student's verified AIFT Student ID. The Student must approve the connection before Family access becomes active.</p></div>
        <div class="family-actions"><button class="family-button primary" type="button" data-add-child>Add Student</button></div>
      </div>
      <div class="family-student-summary">
        <div><span>Students</span><strong>${state.students.length}</strong><small>Students managed from this Family workspace</small></div>
        <div><span>Connected</span><strong>${linked.length}</strong><small>Verified AIFT Student connections</small></div>
        <div><span>Pending</span><strong>${pending.length}</strong><small>Waiting for Student approval</small></div>
      </div>
      <div class="family-apply-guide"><strong>Connection process:</strong> Add Student → enter the Student's AIFT ID → choose your relationship → Student accepts or declines → the connection status updates automatically.</div>
      <section class="family-student-panel">
        <div class="family-student-panel-head"><div><h2>Your Students</h2><p>Only approved AIFT Student connections are shown as linked.</p></div>${state.role==="family"?'<button class="family-small-button" type="button" data-page-link="scholarships">Find Scholarships</button>':''}</div>
        <div class="family-student-list">
          ${state.students.length ? state.students.map(student=>{
            const linkedStudent=student.linkedStudentId || {};
            const isLinked=student.linkStatus === "linked" && linkedStudent;
            const isPending=student.linkStatus === "pending";
            const name=studentName(student);
            const image=student.profileImage || linkedStudent.profileImage || "";
            const level=student.grade || student.educationLevel || linkedStudent.course || "Student profile";
            const connection=isLinked?`Connected to ${linkedStudent.name || "verified AIFT Student"}`:isPending?"Connection request sent — waiting for Student approval":"Not connected to an AIFT Student account yet";
            return `<article class="family-student-row"><div class="family-student-main"><div class="family-student-avatar">${image?`<img src="${esc(image)}" alt="${esc(name)}">`:esc(name.split(/\s+/).map(x=>x[0]).join("").slice(0,2).toUpperCase())}</div><div class="family-student-copy"><strong>${esc(name)}</strong><span>${esc(level)}</span><span>${esc(connection)}</span><span class="family-student-state ${isLinked?"linked":""}">${isLinked?"AIFT Student Linked":isPending?"Approval Pending":"Connection Required"}</span></div></div><div class="family-student-actions"><button class="family-small-button" type="button" data-edit-child="${esc(student._id)}">Edit</button>${isLinked?(state.role==="family"?`<button class="family-small-button primary" type="button" data-page-link="scholarships">Apply for Scholarship</button>`:"")+`<button class="family-small-button" type="button" data-unlink-child="${esc(student._id)}">Unlink</button>`:isPending?'<button class="family-small-button" type="button" disabled>Waiting for Student</button>':`<button class="family-small-button primary" type="button" data-link-child="${esc(student._id)}">Connect AIFT Student</button>`}</div></article>`;
          }).join("") : `<div class="family-student-empty"><strong>No students added yet</strong>Add the student you support, then connect the profile using the Student's AIFT ID.<div style="margin-top:12px"><button class="family-button primary" type="button" data-add-child>Add Your First Student</button></div></div>`}
        </div>
      </section>`;
    dynamicNodes(section);
  }

  function setTextSafe(selector,value){const el=$(selector);if(el) el.textContent=String(value ?? "");}

  function ensureScholarshipFamilyGuide(){
    const page=$("#familyPage-scholarships");
    if(!page) return;
    let guide=$("#familyScholarshipStudentGuide");
    if(state.role !== "family"){guide?.remove();return;}
    if(!guide){guide=document.createElement("div");guide.id="familyScholarshipStudentGuide";guide.className="family-apply-guide";page.querySelector(".family-page-head")?.insertAdjacentElement("afterend",guide);}
    const linked=linkedStudents().length;
    guide.innerHTML=linked?`<strong>${linked} linked Student${linked===1?"":"s"} ready.</strong> Choose a scholarship and click <strong>Apply for Student</strong>.`:`<strong>Add and connect a Student before applying.</strong> <button class="family-small-button primary" type="button" data-page-link="students" style="margin-left:8px">Add / Connect Student</button>`;
  }

  function applyRoleUi(){
    const cap=capabilities();
    document.body.dataset.familyAccountRole=state.role || "member";
    const roleLabel=$(".family-account-role");
    if(roleLabel) roleLabel.textContent=state.role === "family" ? "Family Account" : `${title(state.role)} · Family & Investor`;

    const oldChildren=$("[data-page='children']");
    setHidden(oldChildren,true);
    setHidden($("#familyPage-children"),!cap.manageStudents);
    setHidden($("#familyAddChild"),!cap.manageStudents);
    ensureStudentWorkspace();
    dynamicNodes(document);

    const overviewChildrenTitle=$("#familyPage-overview .family-card-head h2");
    if(overviewChildrenTitle && overviewChildrenTitle.textContent.trim()==="My Children") overviewChildrenTitle.textContent="Students";
    const overviewManage=$("#familyOverviewChildren")?.closest(".family-card")?.querySelector('[data-page-link="children"]');
    if(overviewManage && cap.manageStudents){overviewManage.dataset.pageLink="students";overviewManage.textContent="Manage Students";}
    else if(overviewManage) setHidden(overviewManage,true);

    const scholarshipPage=$("#familyPage-scholarships");
    scholarshipPage?.querySelectorAll('[data-page-link="requests"]').forEach(el=>setHidden(el,!cap.viewFamilyScholarshipApplications));
    const kindSelect=$("#familyRequestKind");
    const scholarshipOption=kindSelect?.querySelector('option[value="scholarship"]');
    if(scholarshipOption){scholarshipOption.disabled=!cap.viewFamilyScholarshipApplications;setHidden(scholarshipOption,!cap.viewFamilyScholarshipApplications);}
    if(kindSelect && !cap.viewFamilyScholarshipApplications && kindSelect.value === "scholarship") kindSelect.value="";

    $$("button").forEach(button=>{
      const label=String(button.textContent||"").trim().toLowerCase();
      if(label === "apply for scholarship" && state.role !== "family") setHidden(button,true);
      if(label === "add child" && cap.manageStudents) button.textContent="Add Student";
    });
    ensureScholarshipRoleNote();
    ensureScholarshipFamilyGuide();
    ensureOverviewGuide();
  }

  function ensureScholarshipRoleNote(){
    const page=$("#familyPage-scholarships");
    if(!page) return;
    let note=$("#familyScholarshipRoleNote");
    if(state.role === "family"){note?.remove();return;}
    if(!note){note=document.createElement("div");note.id="familyScholarshipRoleNote";note.className="family-role-note";page.querySelector(".family-page-head")?.insertAdjacentElement("afterend",note);}
    note.innerHTML=`<strong>Scholarship discovery only in this workspace.</strong> Application controls are not shown for your ${esc(title(state.role))} role. Student management and scholarship application permissions are separate so each AIFT role keeps the correct workflow.`;
  }

  function ensureOverviewGuide(){
    const overview=$("#familyPage-overview .family-overview-main");
    const hero=overview?.querySelector(".family-hero");
    if(!overview || !hero) return;
    let guide=$("#familyRoleGuide");
    if(!guide){guide=document.createElement("section");guide.id="familyRoleGuide";guide.className="family-role-guide";hero.insertAdjacentElement("afterend",guide);}
    renderGuide();
  }

  function currentNextStep(){
    if(canManageStudents() && !state.students.length) return "Add a Student if you support one";
    if(canManageStudents() && state.students.length && !linkedStudents().length) return "Connect the Student using their AIFT ID";
    const info=state.reviews.filter(item=>item.status === "information_requested").length;
    if(info) return `${info} AIFT review${info===1?" needs":"s need"} more information`;
    const activeRooms=state.rooms.filter(room=>room.status === "negotiation");
    if(activeRooms.length) return `Deal Room: ${[...new Set(activeRooms.map(room=>title(room.workflowStage||room.status)))].slice(0,2).join(", ")}`;
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
    guide.innerHTML=`<article class="family-access-card"><div class="family-access-kicker">AIFT ROLE ACCESS · ${esc(title(state.role))}</div><h2>${esc(copy.title)}</h2><p>${esc(copy.text)}</p><div class="family-access-chips"><span class="family-access-chip good">Scholarship discovery</span>${cap.applyScholarshipHere?'<span class="family-access-chip good">Apply for Student</span>':''}${cap.manageStudents?`<span class="family-access-chip good">${linkedStudents().length} linked Student${linkedStudents().length===1?"":"s"}</span>`:''}<span class="family-access-chip good">Venture requests</span><span class="family-access-chip good">Investor Mode</span></div><div class="family-access-actions">${cap.manageStudents?'<button class="family-small-button" type="button" data-page-link="students">Manage Students</button>':''}<button class="family-small-button primary" type="button" data-family-open-activity>Open AIFT Activity</button>${activeRooms?'<button class="family-small-button" type="button" data-family-open-rooms>View Deal Rooms</button>':''}</div></article><article class="family-process-card"><div class="family-process-head"><div><h3>How AIFT moves a request</h3><p>Only the stages that apply to a request are used.</p></div></div><div class="family-process-steps"><div class="family-process-step"><b>1</b><strong>Student / Request</strong><span>${cap.manageStudents?"Manage supported Students or create an eligible request.":"Create an eligible request or interest."}</span></div><div class="family-process-step"><b>2</b><strong>AIFT Review</strong><span>AIFT checks sensitive actions before release.</span></div><div class="family-process-step"><b>3</b><strong>Other Party</strong><span>The receiving party responds when required.</span></div><div class="family-process-step"><b>4</b><strong>Deal Room</strong><span>Matched investments enter the controlled workspace.</span></div><div class="family-process-step"><b>5</b><strong>Final Result</strong><span>AIFT controls evidence, meetings and outcome.</span></div></div><div class="family-live-strip"><div class="family-live-item"><span>Open reviews</span><strong>${openReviews}</strong><small>${info?`${info} need information`:"AIFT-controlled requests"}</small></div><div class="family-live-item"><span>Deal Rooms</span><strong>${activeRooms}</strong><small>Matched investment workspaces</small></div><div class="family-live-item"><span>${cap.manageStudents?"Linked Students":"Investor interests"}</span><strong>${cap.manageStudents?linkedStudents().length:interested}</strong><small>${cap.manageStudents?"Approved Student connections":"Submitted from Investor Mode"}</small></div><div class="family-live-item"><span>Next step</span><strong style="font-size:9px;line-height:1.35">${esc(currentNextStep())}</strong><small>Updates automatically</small></div></div></article>`;
  }

  async function loadProfile(){
    try{const data=await api("/api/family/profile");state.profile=data;state.role=String(data?.user?.role || state.role || "member").toLowerCase();applyRoleUi();}
    catch(error){console.warn("Family role access profile could not load",error);applyRoleUi();}
  }

  async function loadStudents(){
    if(!canManageStudents()){state.students=[];state.links=[];return;}
    const [children,links]=await Promise.all([api("/api/family/children").catch(()=>({children:[]})),api("/api/family-student-links/family").catch(()=>({requests:[]}))]);
    state.students=Array.isArray(children?.children)?children.children:[];
    state.links=Array.isArray(links?.requests)?links.requests:[];
    renderStudentWorkspace();ensureScholarshipFamilyGuide();dynamicNodes(document);
  }

  async function refreshLive(){
    if(state.refreshing || !token()) return;
    state.refreshing=true;
    try{
      const investorEnabled=state.profile?.familyProfile?.investorEnabled === true;
      const [reviews,rooms,interested]=await Promise.all([api("/api/review-cases/mine").catch(()=>({cases:[]})),api("/api/deal-rooms/mine").catch(()=>({rooms:[]})),investorEnabled?api("/api/ventures/investor/interested").catch(()=>({ventures:[]})):Promise.resolve({ventures:[]})]);
      state.reviews=Array.isArray(reviews?.cases)?reviews.cases:[];state.rooms=Array.isArray(rooms?.rooms)?rooms.rooms:[];state.interested=Array.isArray(interested?.ventures)?interested.ventures:[];
      await loadStudents();renderGuide();
    }finally{state.refreshing=false;}
  }

  function openActivity(tab="reviews"){const button=$("#aiftMyReviewButton");if(button){button.click();setTimeout(()=>{$(`[data-aift-activity-tab="${tab}"]`)?.click();},40);}}
  function openStudents(){const button=$("#familyStudentsNav");if(button){button.click();return;}$("[data-page='children']")?.click();}

  function bind(){
    document.addEventListener("click",event=>{
      if(event.target.closest("[data-family-open-activity]")){openActivity("reviews");return;}
      if(event.target.closest("[data-family-open-rooms]")){openActivity("rooms");return;}
      const studentNav=event.target.closest('[data-page="students"],[data-page-link="students"]');
      if(studentNav && canManageStudents()) setTimeout(()=>renderStudentWorkspace(),0);
      const scholarshipAction=event.target.closest("[data-family-scholarship-student-action]");
      if(scholarshipAction && state.role === "family" && !linkedStudents().length){event.preventDefault();event.stopImmediatePropagation();openStudents();return;}
      const forbiddenApply=event.target.closest("[data-apply-scholarship]");
      if(forbiddenApply && !capabilities().applyScholarshipHere){event.preventDefault();event.stopImmediatePropagation();return;}
      const forbiddenStudent=event.target.closest("[data-add-child],[data-edit-child],[data-link-child],[data-unlink-child],[data-archive-child]");
      if(forbiddenStudent && !capabilities().manageStudents){event.preventDefault();event.stopImmediatePropagation();}
    },true);
    window.addEventListener("aift:activity-updated",()=>refreshLive());
    window.addEventListener("focus",()=>refreshLive(),{passive:true});
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)refreshLive();});
  }

  function observe(){state.observer=new MutationObserver(mutations=>{for(const mutation of mutations){for(const node of mutation.addedNodes){if(node.nodeType===1)dynamicNodes(node);}}});state.observer.observe(document.body,{childList:true,subtree:true});}

  async function init(){ensureStyle();bind();applyRoleUi();observe();await loadProfile();await loadStudents();await refreshLive();window.setInterval(()=>{if(!document.hidden)refreshLive();},15000);}
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
