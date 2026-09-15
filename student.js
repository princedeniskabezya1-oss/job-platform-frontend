Warning: truncated output (original token count: 250183)
Total output lines: 57556

const API = "https://backend-1-9b6f.onrender.com";

const token =
  localStorage.getItem("studentToken") ||
  localStorage.getItem("talentToken") ||
  localStorage.getItem("schoolToken") ||
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token");

const role = String(localStorage.getItem("role") || "").toLowerCase();

if (!token) {
  window.location.href = "login.html";
}

if (
  role &&
  ![
    "student",
    "talent",
    "school",
    "admin"
  ].includes(role)
){
  window.location.href = "home.html";
}

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80";

const CLASS_FALLBACK =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";

const urlParams = new URLSearchParams(window.location.search);
const selectedStudentId = urlParams.get("studentId");
const selectedFamilyLinkRequestId = urlParams.get("familyLinkRequest");

async function aiftStudentApi(path,options={}){const response=await fetch(API+path,{...options,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...(options.headers||{})}});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||('Request failed ('+response.status+')'));return data;}
function ensureFamilyApprovalPanel(){let panel=document.getElementById('aiftFamilyApprovalPanel');if(panel)return panel;panel=document.createElement('div');panel.id='aiftFamilyApprovalPanel';panel.style.cssText='position:fixed;inset:0;z-index:100000;background:rgba(15,23,42,.45);display:none;align-items:center;justify-content:center;padding:20px';panel.innerHTML='<section style="width:min(620px,100%);max-height:86vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 24px 70px rgba(15,23,42,.24)"><header style="padding:22px 24px 16px;border-bottom:1px solid #e5e7eb;display:flex;justify-content:space-between;gap:16px"><div><h2 style="margin:0;font-size:20px">Family connection requests</h2><p style="margin:6px 0 0;color:#64748b;font-size:13px">Only accept people you personally recognize and authorize.</p></div><button type="button" data-family-approval-close style="border:0;background:transparent;font-size:26px;cursor:pointer">×</button></header><div id="aiftFamilyApprovalList" style="padding:18px 24px">Loading…</div></section>';document.body.appendChild(panel);panel.addEventListener('click',async event=>{if(event.target===panel||event.target.closest('[data-family-approval-close]')){panel.style.display='none';return;}const button=event.target.closest('[data-family-link-decision]');if(!button)return;button.disabled=true;try{await aiftStudentApi('/api/family-student-links/'+button.dataset.requestId+'/respond',{method:'PATCH',body:JSON.stringify({decision:button.dataset.familyLinkDecision})});await loadStudentFamilyApprovals(true);}catch(error){showAlert?.('error',error.message,{title:'Family connection'});}finally{button.disabled=false;}});return panel;}
async function loadStudentFamilyApprovals(showWhenEmpty=false){if(role!=='student')return;try{const data=await aiftStudentApi('/api/family-student-links/student/pending');const requests=Array.isArray(data.requests)?data.requests:[];if(!requests.length&&!showWhenEmpty&&!selectedFamilyLinkRequestId)return;const panel=ensureFamilyApprovalPanel(),list=panel.querySelector('#aiftFamilyApprovalList');list.innerHTML=requests.length?requests.map(request=>{const family=request.familyId||{},child=request.familyChildId||{},relationship=String(request.relationshipType||'family member').replaceAll('_',' ');return '<article style="padding:16px 0;border-bottom:1px solid #eef2f7"><strong style="display:block;font-size:15px">'+escapeHtml(family.name||'AIFT Family member')+'</strong><div style="margin-top:5px;color:#475569;font-size:13px">Requests to connect as your <b>'+escapeHtml(relationship)+'</b>'+(child.firstName?' through the Family profile for '+escapeHtml(child.firstName+' '+(child.lastName||'')):'')+'. Accepting authorizes this Family account connection; it does not certify a legal or biological relationship.</div><div style="display:flex;gap:8px;margin-top:14px"><button type="button" data-family-link-decision="decline" data-request-id="'+request._id+'" style="padding:9px 14px;border:1px solid #cbd5e1;background:#fff;border-radius:9px;cursor:pointer">Decline</button><button type="button" data-family-link-decision="accept" data-request-id="'+request._id+'" style="padding:9px 14px;border:0;background:#6d28d9;color:#fff;border-radius:9px;cursor:pointer">Accept connection</button></div></article>';}).join(''):'<div style="padding:22px 0;color:#64748b;text-align:center">No pending Family connection requests.</div>';panel.style.display='flex';}catch(error){console.warn('Could not load Family approvals',error);}}

const state = {
  loggedUser:null,
  me:null,

  classes:[],
  classesLoaded:false,
  classesLoadFailed:false,
  assignments:[],
  submissions:[],
  schedules:[],
  posts:[],
  schoolUpdates:[],
  teachers:[],

  studentResources:[],

  certificates:[],
    portfolio:{
    visibility:"private",
    headline:"",
    about:"",
    skills:[],
    languages:[],
    projects:[],
    experience:[],
    featuredCertificateIds:[],
    resumeUrl:"",
    publicSlug:"",
    views:0
  },

  /*
    Student-specific progress returned by:

    GET /api/classes/:id/student-progress

    Map key:
    String class ID

    Map value:
    Complete progress endpoint response
  */

  classProgressById:
    new Map(),

  classProgressLoading:
    false,

  classProgressLoaded:
    false,

  unread:0,

  metrics:{
    completion:0,
    attendance:0,
    engagement:0,
    productivity:0,
    overall:0
  }
};

function $(id){
  return document.getElementById(id);
}

function authHeaders(extra = {}){
  return {
    Authorization:"Bearer " + token,
    ...extra
  };
}

function escapeHtml(value){
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

async function safeJson(res){
  try{
    return await res.json();
  }catch{
    return null;
  }
}

function asArray(value){

  if (Array.isArray(value)){
    return value;
  }

  if (Array.isArray(value?.data)){
    return value.data;
  }

  if (Array.isArray(value?.items)){
    return value.items;
  }

  if (Array.isArray(value?.users)){
    return value.users;
  }

  if (Array.isArray(value?.classes)){
    return value.classes;
  }

  if (Array.isArray(value?.assignments)){
    return value.assignments;
  }

  if (Array.isArray(value?.submissions)){
    return value.submissions;
  }

  if (Array.isArray(value?.schedules)){
    return value.schedules;
  }

  if (Array.isArray(value?.posts)){
    return value.posts;
  }

  if (Array.isArray(value?.resources)){
    return value.resources;
  }

  if (Array.isArray(value?.certificates)){
    return value.certificates;
  }

  return [];
}

function normalizeId(value){
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value._id) return String(value._id);
  return String(value);
}

function sameId(a,b){
  return normalizeId(a) === normalizeId(b);
}

function setText(id,value){
  const el = $(id);
  if (el) el.innerText = value;
}

function formatDate(value){
  if (!value) return "No date";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())){
    return "No date";
  }

  return d.toLocaleDateString([],{
    month:"short",
    day:"numeric",
    year:"numeric"
  });
}

function formatDateTime(value){
  if (!value) return "No date";

  const d = new Date(value);

  if (Number.isNaN(d.getTime())){
    return "No date";
  }

  return d.toLocaleString([],{
    month:"short",
    day:"numeric",
    hour:"2-digit",
    minute:"2-digit"
  });
}

/* =========================================================
   AIFT NOTIFICATION CONTROLLER
========================================================= */

const AIFT_NOTIFICATION_DEFAULT_DURATION =
  4200;

const AIFT_NOTIFICATION_MAX_VISIBLE =
  4;

const AIFT_NOTIFICATION_TYPES =
  Object.freeze({
    success:{
      title:"Completed",
      icon:"fa-solid fa-circle-check"
    },

    error:{
      title:"Something went wrong",
      icon:"fa-solid fa-circle-exclamation"
    },

    warning:{
      title:"Attention needed",
      icon:"fa-solid fa-triangle-exclamation"
    },

    info:{
      title:"AIFT update",
      icon:"fa-solid fa-circle-info"
    }
  });

let aiftNotificationSequence = 0;

function getAIFTNotificationRegion(){
  let region =
    document.getElementById(
      "aiftNotificationRegion"
    );

  if (region){
    return region;
  }

  region =
    document.createElement("div");

  region.id =
    "aiftNotificationRegion";

  region.className =
    "aift-notification-region";

  region.setAttribute(
    "role",
    "region"
  );

  region.setAttribute(
    "aria-label",
    "AIFT notifications"
  );

  region.setAttribute(
    "aria-live",
    "polite"
  );

  region.setAttribute(
    "aria-relevant",
    "additions removals"
  );

  document.body.appendChild(region);

  return region;
}

function normalizeAIFTNotificationType(type){
  const normalized =
    String(type || "info")
      .trim()
      .toLowerCase();

  return Object.prototype.hasOwnProperty.call(
    AIFT_NOTIFICATION_TYPES,
    normalized
  )
    ? normalized
    : "info";
}

function removeAIFTNotification(
  notification,
  immediate = false
){
  if (!notification){
    return;
  }

  window.clearTimeout(
    Number(
      notification.dataset
        .notificationTimer
    )
  );

  if (immediate){
    notification.remove();
    return;
  }

  if (
    notification.classList.contains(
      "is-leaving"
    )
  ){
    return;
  }

  notification.classList.remove(
    "is-visible"
  );

  notification.classList.add(
    "is-leaving"
  );

  window.setTimeout(
    () => {
      notification.remove();
    },
    290
  );
}

function enforceAIFTNotificationLimit(
  region
){
  const notifications =
    Array.from(
      region.querySelectorAll(
        ".aift-notification"
      )
    );

  while (
    notifications.length >=
    AIFT_NOTIFICATION_MAX_VISIBLE
  ){
    const oldest =
      notifications.shift();

    removeAIFTNotification(
      oldest,
      true
    );
  }
}

function showAlert(
  type,
  message,
  options = {}
){
  const normalizedType =
    normalizeAIFTNotificationType(
      type
    );

  const configuration =
    AIFT_NOTIFICATION_TYPES[
      normalizedType
    ];

  const safeMessage =
    String(
      message ||
      "An update is available."
    ).trim();

  const title =
    String(
      options.title ||
      configuration.title
    ).trim();

  const duration =
    Math.max(
      1500,
      Number(options.duration) ||
      AIFT_NOTIFICATION_DEFAULT_DURATION
    );

  const region =
    getAIFTNotificationRegion();

  enforceAIFTNotificationLimit(
    region
  );

  const notification =
    document.createElement("article");

  const notificationId =
    `aift-notification-${
      ++aiftNotificationSequence
    }`;

  notification.id =
    notificationId;

  notification.className =
    `aift-notification ${normalizedType}`;

  notification.setAttribute(
    "role",
    normalizedType === "error"
      ? "alert"
      : "status"
  );

  notification.setAttribute(
    "aria-atomic",
    "true"
  );

  notification.style.setProperty(
    "--aift-notification-duration",
    `${duration}ms`
  );

  notification.innerHTML = `
    <div
      class="aift-notification-icon"
      aria-hidden="true"
    >
      <i
        class="${configuration.icon}"
      ></i>
    </div>

    <div class="aift-notification-copy">

      <span class="aift-notification-brand">
        AIFT
      </span>

      <strong>
        ${escapeHtml(title)}
      </strong>

      <p>
        ${escapeHtml(safeMessage)}
      </p>

    </div>

    <button
      class="aift-notification-close"
      type="button"
      aria-label="Dismiss notification"
    >
      <i
        class="fa-solid fa-xmark"
        aria-hidden="true"
      ></i>
    </button>

    <div
      class="aift-notification-progress"
      aria-hidden="true"
    ></div>
  `;

  region.appendChild(
    notification
  );

  window.requestAnimationFrame(
    () => {
      window.requestAnimationFrame(
        () => {
          notification.classList.add(
            "is-visible"
          );
        }
      );
    }
  );

  let remaining =
    duration;

  let startedAt =
    Date.now();

  const beginTimer = () => {
    startedAt =
      Date.now();

    const timer =
      window.setTimeout(
        () => {
          removeAIFTNotification(
            notification
          );
        },
        remaining
      );

    notification.dataset
      .notificationTimer =
      String(timer);
  };

  const pauseTimer = () => {
    const timer =
      Number(
        notification.dataset
          .notificationTimer
      );

    window.clearTimeout(timer);

    remaining =
      Math.max(
        0,
        remaining -
        (
          Date.now() -
          startedAt
        )
      );

    notification.classList.add(
      "is-paused"
    );
  };

  const resumeTimer = () => {
    if (remaining <= 0){
      removeAIFTNotification(
        notification
      );

      return;
    }

    notification.classList.remove(
      "is-paused"
    );

    beginTimer();
  };

  notification
    .querySelector(
      ".aift-notification-close"
    )
    ?.addEventListener(
      "click",
      () => {
        removeAIFTNotification(
          notification
        );
      }
    );

  notification.addEventListener(
    "mouseenter",
    pauseTimer
  );

  notification.addEventListener(
    "mouseleave",
    resumeTimer
  );

  notification.addEventListener(
    "focusin",
    pauseTimer
  );

  notification.addEventListener(
    "focusout",
    resumeTimer
  );

  beginTimer();

  return {
    id:notificationId,

    close(){
      removeAIFTNotification(
        notification
      );
    },

    element:notification
  };
}


function notifyAIFTSuccess(
  message,
  options = {}
){
  return showAlert(
    "success",
    message,
    {
      title:
        options.title ||
        "Completed",

      duration:
        options.duration ||
        3800
    }
  );
}

function notifyAIFTError(
  message,
  options = {}
){
  return showAlert(
    "error",
    message,
    {
      title:
        options.title ||
        "Something went wrong",

      duration:
        options.duration ||
        5600
    }
  );
}

function notifyAIFTWarning(
  message,
  options = {}
){
  return showAlert(
    "warning",
    message,
    {
      title:
        options.title ||
        "Attention needed",

      duration:
        options.duration ||
        4800
    }
  );
}

function notifyAIFTInfo(
  message,
  options = {}
){
  return showAlert(
    "info",
    message,
    {
      title:
        options.title ||
        "AIFT update",

      duration:
        options.duration ||
        4200
    }
  );
}

function openModal(id){
  const modal =
    $(id);

  if (!modal){
    return;
  }

  modal.classList.add(
    "show"
  );

  modal.setAttribute(
    "aria-hidden",
    "false"
  );

  document.body.classList.add(
    "student-studio-menu-open"
  );
}


function closeModal(id){
  const modal =
    $(id);

  if (!modal){
    return;
  }

  modal.classList.remove(
    "show"
  );

  modal.setAttribute(
    "aria-hidden",
    "true"
  );

  if (
    !document.querySelector(
      ".modal.show"
    )
  ){
    document.body.classList.remove(
      "student-studio-menu-open"
    );
  }
}

/* =========================================================
   STUDENT STUDIO NAVIGATION CONTROLLER
========================================================= */

const STUDENT_STUDIO_PAGES = Object.freeze({

  overview:{
    title:"Dashboard",
    description:"Your learning workspace"
  },

  updates:{
    title:"School Updates",
    description:"Announcements, notices, deadlines, and information from your school"
  },

  continue:{
    title:"Continue Learning",
    description:"Resume lessons, track class progress, and continue where you stopped"
  },

  classes:{
    title:"My Classes",
    description:"Continue lessons, review modules, and join live classes"
  },

  assignments:{
    title:"Assignment Center",
    description:"Manage pending, submitted, graded, and late coursework"
  },

  schedule:{
    title:"Calendar",
    description:"Review classes, deadlines, meetings, and learning events"
  },

  progress:{
    title:"Learning Analytics",
    description:"Track attendance, completion, grades, and engagement"
  },

  resources:{
    title:"Resources",
    description:"Access class files, recordings, links, and study materials"
  },

  certificates:{
    title:"Certificates",
    description:"View completed programs and earned achievements"
  },

  portfolio:{
    title:"Student Portfolio",
    description:"Showcase projects, certificates, skills, experience, and career-ready achievements"
  },

  career:{
    title:"Career Hub",
    description:"Build your career profile and prepare for opportunities"
  },

  ai:{
    title:"AI Learning",
    description:"Get guided explanations, summaries, practice, and study help"
  },

  messages:{
    title:"Messages",
    description:"Communicate with teachers, classmates, and your school"
  },

  settings:{
    title:"Settings",
    description:"Manage your Student Studio preferences"
  },

  help:{
    title:"Help Center",
    description:"Find answers, troubleshooting guides, and support"
  }

});

let activeStudentStudioPage = "overview";

function normalizeStudentStudioPage(page){
  const requested = String(page || "")
    .trim()
    .toLowerCase();

const aliases = {
  dashboard:"overview",
  home:"overview",
  calendar:"schedule",
  analytics:"progress",
  portfolio:"portfolio"
};

  const normalized = aliases[requested] || requested;

  return STUDENT_STUDIO_PAGES[normalized]
    ? normalized
    : "overview";
}

function setStudentStudioRouteContent(page){
  const normalizedPage =
    normalizeStudentStudioPage(page);

  const config =
    STUDENT_STUDIO_PAGES[
      normalizedPage
    ] ||
    STUDENT_STUDIO_PAGES.overview;

  /*
    The global workspace router belongs only
    on the main Dashboard page.
  */

  const router =
    document.getElementById(
      "studentStudioRouter"
    );

  const showRouter =
    normalizedPage === "overview";

  if (router){
    router.hidden =
      !showRouter;

    router.setAttribute(
      "aria-hidden",
      String(!showRouter)
    );

    router.style.display =
      showRouter
        ? ""
        : "none";
  }

  setText(
    "studioCurrentPage",
    config.title
  );

  setText(
    "studioCurrentDescription",
    config.description
  );

  setText(
    "dashboardCurrentSection",
    config.title
  );
}

function setStudentStudioActiveSection(page){
  document
    .querySelectorAll(".section")
    .forEach(section => {
      const isActive =
        section.id === `section-${page}`;

      section.classList.toggle(
        "active",
        isActive
      );

      section.hidden = !isActive;

      section.setAttribute(
        "aria-hidden",
        String(!isActive)
      );
    });
}

function setStudentStudioActiveNavigation(page){
  document
    .querySelectorAll(
      [
        ".tab-btn",
        ".dashboard-nav-btn",
        ".student-nav-btn",
        ".student-navigation button",
        ".student-dashboard-nav button"
      ].join(",")
    )
    .forEach(button => {
      const buttonPage = normalizeStudentStudioPage(
        button.dataset.page ||
        button.dataset.tab ||
        button.getAttribute("data-section") ||
        ""
      );

      const inlineHandler =
        button.getAttribute("onclick") || "";

      const handlerMatch =
        inlineHandler.match(
          /openTab\(['"]([^'"]+)['"]\)/
        );

      const resolvedPage = handlerMatch
        ? normalizeStudentStudioPage(handlerMatch[1])
        : buttonPage;

      const isActive =
        resolvedPage === page;

      button.classList.toggle(
        "active",
        isActive
      );

      button.setAttribute(
        "aria-current",
        isActive ? "page" : "false"
      );
    });
}

function setStudentStudioActiveMobileNavigation(page){
  const mobilePageMap = {
    overview:"overview",
    classes:"classes",
    assignments:"assignments",
    schedule:"schedule",
    progress:"progress"
  };

  document
    .querySelectorAll(".mobile-nav button")
    .forEach(button => {
      const inlineHandler =
        button.getAttribute("onclick") || "";

      const handlerMatch =
        inlineHandler.match(
          /openTab\(['"]([^'"]+)['"]\)/
        );

      const buttonPage = handlerMatch
        ? normalizeStudentStudioPage(handlerMatch[1])
        : normalizeStudentStudioPage(
            button.dataset.page ||
            button.dataset.tab ||
            ""
          );

      const isActive =
        mobilePageMap[page] === buttonPage;

      button.classList.toggle(
        "active",
        isActive
      );

      button.setAttribute(
        "aria-current",
        isActive ? "page" : "false"
      );
    });
}


function renderActiveStudentStudioPage(page){

  switch(page){

    case "overview":

      renderStudioHome();

      break;


    case "updates":

      renderAnnouncements();

      updateStudentSchoolUpdatesBadge();

      break;


    case "continue":

      renderContinueLearningWorkspace();

      break;


    case "classes":

      renderClasses();

      break;


    case "assignments":

      renderAssignments();

      hydrateSubmissionSelect();

      break;


    case "schedule":

      bindStudentCalendarControls();

      renderStudentCalendarWorkspace();

      break;


    case "progress":

      openStudentAnalyticsWorkspace();

      break;


    case "resources":

      bindStudentResourceControls();

      hydrateStudentResourceClassFilter();

      restoreStudentResourceClassSelection();

      setStudentResourceView(
        studentResourceView
      );

      renderResources();

      break;


    case "certificates":

      renderStudentCertificates();

      break;


    case "portfolio":

      renderStudentPortfolio();

      break;


    case "career":

      renderStudentCareerHub();

      break;


    case "ai":

      renderStudentAILearning();

      break;


    case "messages":

      openStudentMessages();

      break;


    case "settings":

      renderStudentSettings();

      break;


    case "help":

      renderStudentHelpCenter();

      break;


    default:

      renderStudioHome();

      break;

  }

}

function openStudentStudioPage(
  requestedPage,
  options = {}
){
  const page =
    normalizeStudentStudioPage(
      requestedPage
    );

  if(
    page === "career" &&
    activeStudentStudioPage === "career" &&
    document.body.dataset.studentSection === "career" &&
    document.getElementById("studentCareerWorkspace")?.children?.length
  ){
    setStudentStudioActiveNavigation(page);
    setStudentStudioActiveMobileNavigation(page);
    return;
  }

  activeStudentStudioPage = page;

  document.body.dataset.studentSection =
    page;

  setStudentStudioRouteContent(page);

  setStudentStudioActiveSection(page);

  setStudentStudioActiveNavigation(page);

  setStudentStudioActiveMobileNavigation(page);

  renderActiveStudentStudioPage(page);

  if(options.updateHistory !== false){
    const url =
      new URL(window.location.href);

    if(page === "overview"){
      url.searchParams.delete("section");
    }else{
      url.searchParams.set(
        "section",
        page
      );
    }

    window.history.replaceState(
      {
        studentStudioPage:page
      },
      "",
      url
    );
  }

  if(options.scroll !== false){
    const workspace =
      document.querySelector(
        ".center-col"
      ) ||
      document.querySelector(
        ".student-main-content"
      ) ||
      document.querySelector(
        ".student-dashboard-workspace"
      );

    const top =
      workspace
        ? workspace.getBoundingClientRect().top +
          window.scrollY -
          82
        : 0;

    window.scrollTo({
      top:Math.max(0,top),
      behavior:
        options.instant
          ? "auto"
          : "smooth"
    });
  }

  document.dispatchEvent(
    new CustomEvent(
      "studentstudio:pagechange",
      {
        detail:{
          page
        }
      }
    )
  );
}

/*
  Compatibility alias.

  Existing HTML buttons currently call openTab(...).
  Keeping this function prevents those buttons from breaking
  while the Student Studio HTML is migrated.
*/

function openTab(page){
  openStudentStudioPage(page);
}

/* =========================================================
   STUDENT STUDIO SHELL CONTROLLER
========================================================= */

const STUDENT_STUDIO_STORAGE_KEYS = Object.freeze({
  sidebarCollapsed:
    "aiftStudentStudioSidebarCollapsed",

  activePage:
    "aiftStudentStudioActivePage"
});

let studentStudioInitialized = false;

function isStudentStudioMobile(){
  return window.matchMedia(
    "(max-width:980px)"
  ).matches;
}

function setStudentSidebarCollapsed(
  collapsed,
  options = {}
){
  const shouldCollapse =
    Boolean(collapsed) &&
    !isStudentStudioMobile();

  document.body.classList.toggle(
    "student-sidebar-collapsed",
    shouldCollapse
  );

  const toggle =
    $("studentSidebarToggle");

  if (toggle){
    toggle.setAttribute(
      "aria-expanded",
      String(!shouldCollapse)
    );

    toggle.setAttribute(
      "aria-label",
      shouldCollapse
        ? "Expand Student Studio navigation"
        : "Collapse Student Studio navigation"
    );
  }

  if (options.persist !== false){
    localStorage.setItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed,

      String(shouldCollapse)
    );
  }
}

function setStudentSidebarMobileOpen(open){
  const shouldOpen =
    Boolean(open) &&
    isStudentStudioMobile();

  document.body.classList.toggle(
    "student-sidebar-mobile-open",
    shouldOpen
  );

  const toggle =
    $("studentSidebarToggle");

  const overlay =
    $("studentSidebarOverlay");

  if (toggle){
    toggle.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );
  }

  if (overlay){
    overlay.setAttribute(
      "aria-hidden",
      String(!shouldOpen)
    );
  }
}

function toggleStudentStudioSidebar(){
  if (isStudentStudioMobile()){
    setStudentSidebarMobileOpen(
      !document.body.classList.contains(
        "student-sidebar-mobile-open"
      )
    );

    return;
  }

  setStudentSidebarCollapsed(
    !document.body.classList.contains(
      "student-sidebar-collapsed"
    )
  );
}

function closeStudentStudioMenus(){
  const quickMenu =
    $("studentQuickActionsMenu");

  const profileMenu =
    $("studentProfileMenu");

  if (quickMenu){
    quickMenu.hidden = true;
  }

  if (profileMenu){
    profileMenu.hidden = true;
  }

  $("studentQuickActionsButton")
    ?.setAttribute(
      "aria-expanded",
      "false"
    );

  $("studentProfileMenuButton")
    ?.setAttribute(
      "aria-expanded",
      "false"
    );
}

function toggleStudentStudioMenu(
  menuId,
  buttonId
){
  const menu = $(menuId);
  const button = $(buttonId);

  if (!menu || !button){
    return;
  }

  const shouldOpen =
    menu.hidden;

  closeStudentStudioMenus();

  menu.hidden = !shouldOpen;

  button.setAttribute(
    "aria-expanded",
    String(shouldOpen)
  );
}

function activateStudentStudioPage(
  requestedPage,
  options = {}
){
  const page =
    normalizeStudentStudioPage(
      requestedPage
    );

  activeStudentStudioPage = page;

  document.body.dataset.studentSection =
    page;

  document
    .querySelectorAll(
      "#studentWorkspaceSections > .section"
    )
    .forEach(section => {
      const active =
        section.id ===
        `section-${page}`;

      section.classList.toggle(
        "active",
        active
      );

      section.hidden = !active;

      section.setAttribute(
        "aria-hidden",
        String(!active)
      );
    });

  document
    .querySelectorAll(
      "#studentSidebarNavigation [data-page]," +
      ".student-sidebar-footer [data-page]," +
      ".mobile-nav [data-page]"
    )
    .forEach(button => {
      const buttonPage =
        normalizeStudentStudioPage(
          button.dataset.page
        );

      const active =
        buttonPage === page;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-current",
        active
          ? "page"
          : "false"
      );
    });

  setStudentStudioRouteContent(page);

  renderActiveStudentStudioPage(page);

  localStorage.setItem(
    STUDENT_STUDIO_STORAGE_KEYS.activePage,
    page
  );

  if (options.history !== false){
    const url =
      new URL(window.location.href);

    if (page === "overview"){
      url.searchParams.delete("section");
    }else{
      url.searchParams.set(
        "section",
        page
      );
    }

    window.history.replaceState(
      {
        studentStudioPage:page
      },
      "",
      url
    );
  }

  if (
    options.scroll !== false &&
    $("studentStudioWorkspace")
  ){
    $("studentStudioWorkspace")
      .scrollIntoView({
        behavior:
          options.instant
            ? "auto"
            : "smooth",

        block:"start"
      });
  }

  setStudentSidebarMobileOpen(false);

  closeStudentStudioMenus();
}

function bindStudentStudioNavigation(){
  document
    .querySelectorAll(
      "#studentSidebarNavigation [data-page]," +
      ".student-sidebar-footer [data-page]," +
      ".mobile-nav [data-page]"
    )
    .forEach(button => {
      if (
        button.dataset
          .studentStudioBound === "true"
      ){
        return;
      }

      button.dataset.studentStudioBound =
        "true";

      button.addEventListener(
        "click",
        () => {
          activateStudentStudioPage(
            button.dataset.page
          );
        }
      );
    });
}

function bindStudentStudioTopbar(){
  $("studentSidebarToggle")
    ?.addEventListener(
      "click",
      toggleStudentStudioSidebar
    );

  $("studentSidebarOverlay")
    ?.addEventListener(
      "click",
      () => {
        setStudentSidebarMobileOpen(false);
      }
    );

  $("studentQuickActionsButton")
    ?.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        toggleStudentStudioMenu(
          "studentQuickActionsMenu",
          "studentQuickActionsButton"
        );
      }
    );

  $("studentProfileMenuButton")
    ?.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        toggleStudentStudioMenu(
          "studentProfileMenu",
          "studentProfileMenuButton"
        );
      }
    );

  $("studentMessagesButton")
    ?.addEventListener(
      "click",
      () => {
        activateStudentStudioPage(
          "messages"
        );
      }
    );

  $("studentWorkspaceSearchButton")
    ?.addEventListener(
      "click",
      () => {
        $("globalSearch")?.focus();
      }
    );

$("studentSidebarHelpButton")
  ?.addEventListener(
    "click",
    () => {

      activateStudentStudioPage(
        "help"
      );

      closeStudentStudioMenus();

    }
  );

  document.addEventListener(
    "click",
    event => {
      if (
        !event.target.closest(
          "#studentQuickActionsMenu"
        ) &&
        !event.target.closest(
          "#studentQuickActionsButton"
        ) &&
        !event.target.closest(
          "#studentProfileMenu"
        ) &&
        !event.target.closest(
          "#studentProfileMenuButton"
        )
      ){
        closeStudentStudioMenus();
      }
    }
  );
}

/* =========================================================
   STUDENT CLASSES CONTROLS
========================================================= */

let studentClassControlsInitialized =
  false;

let studentClassSearchTimer =
  null;


function resetStudentClassFilters(){
  const searchInput =
    $("classSearchInput");

  const statusFilter =
    $("classStatusFilter");

  const sortFilter =
    $("classSortFilter");

  if (searchInput){
    searchInput.value = "";
  }

  if (statusFilter){
    statusFilter.value = "all";
  }

  if (sortFilter){
    sortFilter.value = "recent";
  }

  window.clearTimeout(
    studentClassSearchTimer
  );

  renderClasses();
}


function bindStudentClassControls(){
  if (studentClassControlsInitialized){
    return;
  }

  const searchInput =
    $("classSearchInput");

  const statusFilter =
    $("classStatusFilter");

  const sortFilter =
    $("classSortFilter");

  const clearButton =
    $("clearClassSearchButton");

  const resetButton =
    $("resetClassFiltersButton");

  const gridButton =
    $("classGridViewButton");

  const listButton =
    $("classListViewButton");

  /*
    The classes section may not exist on older
    student-page builds.
  */

  if (
    !searchInput &&
    !statusFilter &&
    !sortFilter
  ){
    return;
  }

  studentClassControlsInitialized =
    true;


  searchInput?.addEventListener(
    "input",
    () => {
      window.clearTimeout(
        studentClassSearchTimer
      );

      const hasValue =
        Boolean(
          searchInput.value.trim()
        );

      if (clearButton){
        clearButton.hidden =
          !hasValue;
      }

      studentClassSearchTimer =
        window.setTimeout(
          () => {
            renderClasses();
          },
          140
        );
    }
  );


  searchInput?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape"){
        event.preventDefault();

        searchInput.value = "";

        if (clearButton){
          clearButton.hidden = true;
        }

        renderClasses();

        return;
      }

      if (event.key === "Enter"){
        event.preventDefault();

        window.clearTimeout(
          studentClassSearchTimer
        );

        renderClasses();
      }
    }
  );


  statusFilter?.addEventListener(
    "change",
    () => {
      renderClasses();
    }
  );


  sortFilter?.addEventListener(
    "change",
    () => {
      renderClasses();
    }
  );


  clearButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      searchInput.value = "";

      clearButton.hidden = true;

      searchInput.focus();

      renderClasses();
    }
  );


  resetButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      resetStudentClassFilters();
    }
  );


  gridButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      setStudentClassView(
        "grid"
      );
    }
  );


  listButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      setStudentClassView(
        "list"
      );
    }
  );
}

/* =========================================================
   ASSIGNMENT CENTER CONTROL BINDING
========================================================= */

function bindStudentAssignmentControls(){
  if (
    studentAssignmentControlsInitialized
  ){
    return;
  }

  const searchInput =
    $("assignmentSearch");

  const statusFilter =
    $("assignmentStatus");

  const classFilter =
    $("assignmentSubject");

  const sortFilter =
    $("assignmentSort");

  const clearSearchButton =
    $("clearAssignmentSearchButton");

  const resetButton =
    $("resetAssignmentFiltersButton");

  const cardViewButton =
    $("assignmentCardViewButton");

  const listViewButton =
    $("assignmentListViewButton");

  const refreshButton =
    $("assignmentRefreshButton");

  const submitWorkButton =
    $("assignmentSubmitWorkButton");

  /*
    The function may run before the new Assignment Center
    HTML has been added. In that case, allow a later retry.
  */

  if (
    !searchInput &&
    !statusFilter &&
    !classFilter &&
    !sortFilter
  ){
    return;
  }

  studentAssignmentControlsInitialized =
    true;


  searchInput?.addEventListener(
    "input",
    () => {
      window.clearTimeout(
        studentAssignmentSearchTimer
      );

      const hasValue =
        Boolean(
          searchInput.value.trim()
        );

      if (clearSearchButton){
        clearSearchButton.hidden =
          !hasValue;
      }

      studentAssignmentSearchTimer =
        window.setTimeout(
          () => {
            renderAssignments();
          },
          160
        );
    }
  );


  searchInput?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape"){
        event.preventDefault();

        searchInput.value = "";

        if (clearSearchButton){
          clearSearchButton.hidden =
            true;
        }

        renderAssignments();

        return;
      }

      if (event.key === "Enter"){
        event.preventDefault();

        window.clearTimeout(
          studentAssignmentSearchTimer
        );

        renderAssignments();
      }
    }
  );


  statusFilter?.addEventListener(
    "change",
    () => {
      activeStudentAssignmentTab =
        statusFilter.value || "all";

      renderAssignments();
    }
  );


  classFilter?.addEventListener(
    "change",
    () => {
      renderAssignments();
    }
  );


  sortFilter?.addEventListener(
    "change",
    () => {
      renderAssignments();
    }
  );


  clearSearchButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      if (searchInput){
        searchInput.value = "";
        searchInput.focus();
      }

      clearSearchButton.hidden =
        true;

      renderAssignments();
    }
  );


  resetButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      resetStudentAssignmentFilters();
    }
  );


  cardViewButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      setStudentAssignmentView(
        "card"
      );
    }
  );


  listViewButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      setStudentAssignmentView(
        "list"
      );
    }
  );


  refreshButton?.addEventListener(
    "click",
    async event => {
      event.preventDefault();

      setDashboardButtonLoading(
        refreshButton,
        true,
        "Refreshing..."
      );

      try{
        await loadAll();

        renderAssignments();

        showAlert(
          "success",
          "Your assignments have been refreshed.",
          {
            title:"Coursework updated"
          }
        );
      }catch(error){
        console.error(
          "Assignment refresh failed:",
          error
        );

        showAlert(
          "error",
          error?.message ||
          "AIFT could not refresh your assignments.",
          {
            title:"Refresh failed"
          }
        );
      }finally{
        setDashboardButtonLoading(
          refreshButton,
          false
        );
      }
    }
  );


  submitWorkButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();

      openDashboardAssignmentSubmission(
        ""
      );
    }
  );
}

function bindStudentStudioQuickActions(){
  $("studentQuickActionsMenu")
    ?.querySelectorAll(
      "[data-studio-action]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const action =
            button.dataset.studioAction;

          closeStudentStudioMenus();

          switch(action){

            case "submit":
              openModal(
                "submissionModal"
              );
              break;

            case "calendar":
              activateStudentStudioPage(
                "schedule"
              );
              break;

            case "ai":
              activateStudentStudioPage(
                "ai"
              );
              break;
          }
        }
      );
    });
}

function bindStudentProfileActions(){

  const menu =
    $("studentProfileMenu");


  if (!menu){
    return;
  }


  menu
    .querySelectorAll(
      "[data-profile-action]"
    )
    .forEach(button => {

      /*
        Prevent duplicate listeners if the
        Student Studio initializer runs again.
      */

      if (
        button.dataset
          .studentProfileActionBound ===
        "true"
      ){
        return;
      }


      button.dataset
        .studentProfileActionBound =
        "true";


      button.addEventListener(
        "click",
        () => {

          const action =
            String(
              button.dataset
                .profileAction ||
              ""
            )
              .trim()
              .toLowerCase();


          closeStudentStudioMenus();


          switch(action){

            /* =========================================
               PROFILE
            ========================================= */

            case "profile":

              window.location.href =
                selectedStudentId
                  ? `public-profile.html?id=${
                      encodeURIComponent(
                        selectedStudentId
                      )
                    }`
                  : "profile.html";

              break;


            /* =========================================
               SETTINGS
            ========================================= */

            case "settings":

              activateStudentStudioPage(
                "settings"
              );

              break;


            /* =========================================
               HELP CENTER
            ========================================= */

            case "help":

              activateStudentStudioPage(
                "help"
              );

              break;


            /* =========================================
               LOGOUT
            ========================================= */

            case "logout":

              [
                "studentToken",
                "talentToken",
                "schoolToken",
                "adminToken",
                "token",
                "role",
                "userId"
              ].forEach(key => {

                localStorage.removeItem(
                  key
                );

              });


              sessionStorage.removeItem(
                "token"
              );


              window.location.href =
                "login.html";

              break;

          }

        }
      );

    });

}

function restoreStudentStudioState(){
  const storedCollapsed =
    localStorage.getItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed
    ) === "true";

  setStudentSidebarCollapsed(
    storedCollapsed,
    {
      persist:false
    }
  );

  const urlPage =
    new URLSearchParams(
      window.location.search
    ).get("section");

  const storedPage =
    localStorage.getItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .activePage
    );

  return normalizeStudentStudioPage(
    urlPage ||
    storedPage ||
    "overview"
  );
}

function handleStudentStudioResize(){
  if (!isStudentStudioMobile()){
    setStudentSidebarMobileOpen(false);
  }

  const storedCollapsed =
    localStorage.getItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed
    ) === "true";

  setStudentSidebarCollapsed(
    storedCollapsed,
    {
      persist:false
    }
  );
}

function initializeStudentStudioShell(){
  if (studentStudioInitialized){
    bindStudentStudioNavigation();
    return;
  }

  studentStudioInitialized = true;

  bindStudentStudioNavigation();

bindStudentStudioTopbar();

bindStudentClassControls();

bindStudentAssignmentControls();

bindStudentAnalyticsControls();

bindStudentResourceControls();

bindStudentResourceUploadControls();

bindStudentStudioQuickActions();

bindStudentProfileActions();

  const initialPage =
    restoreStudentStudioState();

  activateStudentStudioPage(
    initialPage,
    {
      history:false,
      scroll:false,
      instant:true
    }
  );

  window.addEventListener(
    "resize",
    handleStudentStudioResize
  );

  window.addEventListener(
    "popstate",
    event => {
      activateStudentStudioPage(
        event.state?.studentStudioPage ||
        new URLSearchParams(
          window.location.search
        ).get("section") ||
        "overview",

        {
          history:false,
          scroll:false,
          instant:true
        }
      );
    }
  );
}

async function apiGet(path,fallback = null){
  try{
    const res = await fetch(API + path,{
      headers:authHeaders(),
      cache:"no-store",
      signal:AbortSignal.timeout(20000)
    });

    if (res.status === 401){
      localStorage.removeItem("studentToken");
      localStorage.removeItem("talentToken");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return fallback;
    }

    if (!res.ok){
      console.warn("GET failed:", path, res.status);
      return fallback;
    }

    return await safeJson(res);

  }catch(err){
    console.warn("GET network failed:", path, err);
    return fallback;
  }
}

async function apiSend(
  path,
  method,
  body
){

  const requestOptions = {
    method,
    headers:
      authHeaders({
        "Content-Type":
          "application/json"
      })
  };


  if (
    body !== undefined &&
    method !== "GET" &&
    method !== "HEAD"
  ){

    requestOptions.body =
      JSON.stringify(
        body
      );

  }


  const res =
    await fetch(
      API + path,
      requestOptions
    );

  const data = await safeJson(res);

  if (!res.ok){
    throw new Error(
      data?.message ||
      data?.error ||
      "Request failed."
    );
  }

  return data;
}
function getStudentId(){
  return selectedStudentId || state.me?._id || localStorage.getItem("userId") || "";
}



function getSchoolId(){

  /* =========================================================
     CURRENT PROFILE
  ========================================================= */

  const profileSchoolId =
    normalizeId(

      state.me?.schoolId?._id ||
      state.me?.schoolId ||

      state.me?.linkedSchoolId?._id ||
      state.me?.linkedSchoolId ||

      state.me?.createdBySchool?._id ||
      state.me?.createdBySchool ||

      state.me?.companyId?._id ||
      state.me?.companyId

    );


  if(profileSchoolId){

    return profileSchoolId;

  }


  /* =========================================================
     AUTHENTICATED ACCOUNT

     AIFT school-created student accounts may use
     createdBySchool as their authoritative school link.
  ========================================================= */

  const authenticatedSchoolId =
    normalizeId(

      state.loggedUser?.schoolId?._id ||
      state.loggedUser?.schoolId ||

      state.loggedUser?.linkedSchoolId?._id ||
      state.loggedUser?.linkedSchoolId ||

      state.loggedUser?.createdBySchool?._id ||
      state.loggedUser?.createdBySchool ||

      state.loggedUser?.companyId?._id ||
      state.loggedUser?.companyId

    );


  if(authenticatedSchoolId){

    return authenticatedSchoolId;

  }


  /* =========================================================
     LOADED CLASS FALLBACK
  ========================================================= */

  const classWithSchool =
    asArray(
      state.classes
    )
      .find(
        classItem => {

          return Boolean(
            normalizeId(
              classItem?.schoolId?._id ||
              classItem?.schoolId
            )
          );

        }
      );


  const classSchoolId =
    normalizeId(

      classWithSchool?.schoolId?._id ||
      classWithSchool?.schoolId

    );


  if(classSchoolId){

    return classSchoolId;

  }


  /* =========================================================
     LOADED ASSIGNMENT FALLBACK
  ========================================================= */

  const assignmentWithSchool =
    asArray(
      state.assignments
    )
      .find(
        assignment => {

          return Boolean(
            normalizeId(
              assignment?.schoolId?._id ||
              assignment?.schoolId
            )
          );

        }
      );


  const assignmentSchoolId =
    normalizeId(

      assignmentWithSchool?.schoolId?._id ||
      assignmentWithSchool?.schoolId

    );


  if(assignmentSchoolId){

    return assignmentSchoolId;

  }


  return "";

}

/* =========================================================
   STUDENT CLASS PROGRESS CONTROLLER
========================================================= */

function createEmptyStudentClassProgress(
  classId = ""
){
  return {
    classId:
      normalizeId(classId),

    studentId:
      getStudentId(),

    progress:{
      overall:0,

      lessons:{
        total:0,
        completed:0,
        percentage:0
      },

      assignments:{
        total:0,
        completed:0,
        percentage:0
      },

      quizzes:{
        total:0,
        completed:0,
        percentage:0
      },

      attendance:{
        total:0,
        present:0,
        late:0,
        absent:0,
        excused:0,
        percentage:0
      }
    },

    latestActivity:null,

    generatedAt:null,

    available:false
  };
}


function getStudentClassProgressRecord(
  classItemOrId
){
  const classId =
    normalizeId(
      typeof classItemOrId ===
        "object"
        ? (
            classItemOrId?._id ||
            classItemOrId?.id
          )
        : classItemOrId
    );

  if (!classId){
    return createEmptyStudentClassProgress();
  }

  return (
    state.classProgressById.get(
      classId
    ) ||
    createEmptyStudentClassProgress(
      classId
    )
  );
}


function calculateSavedClassProgress(progress){
  const weights={lessons:45,assignments:30,quizzes:15,attendance:10};
  let points=0,totalWeight=0;
  for(const [key,weight] of Object.entries(weights)){
    const part=progress[key];
    if(!part)continue;
    if(Number(part.total)>0){
      points+=Math.max(0,Math.min(100,Number(part.percentage)||0))*weight;
      totalWeight+=weight;
    }
  }
  return totalWeight?Math.round(points/totalWeight):0;
}

function savedAssessmentProgress(items,submissions,field,studentId,normalize){
  if(!Array.isArray(items)||(!Array.isArray(submissions)&&items.length))return null;
  const ids=new Set(items.map(item=>normalize(item._id||item.id)).filter(Boolean));
  const submitted=new Set((submissions||[])
    .filter(item=>normalize(item.studentId)===normalize(studentId))
    .map(item=>normalize(item[field])));
  const completed=[...ids].filter(value=>submitted.has(value)).length;
  return {total:ids.size,completed,percentage:ids.size?Math.round(completed/ids.size*100):0};
}

async function loadStudentClassProgress({
  force = false
} = {}){
  if (
    state.classProgressLoading
  ){
    return;
  }

  const classes =
    getStudentClasses();

  if (!classes.length){
    state.classProgressById.clear();

    state.classProgressLoaded =
      true;

    return;
  }

  state.classProgressLoading =
    true;

  try{
    const requestedStudentId =
      normalizeId(
        selectedStudentId ||
        state.me?._id ||
        state.loggedUser?._id
      );

    const results =
      await Promise.allSettled(
        classes.map(
          async classItem => {
            const classId =
              normalizeId(
                classItem?._id ||
                classItem?.id
              );

            if (!classId){
              return null;
            }

            const query =
              selectedStudentId &&
              requestedStudentId
                ? (
                    `?studentId=${
                      encodeURIComponent(
                        requestedStudentId
                      )
                    }`
                  )
                : "";

            /*
              The class player is the source of truth for saved
              Lesson completion. Load it with the broader summary
              so both screens always show the same Lesson totals.
            */

            const [
              summaryResponse,
              learningResponse
            ] = await Promise.all([
              apiGet(
                `/api/classes/${
                  encodeURIComponent(
                    classId
                  )
                }/student-progress${query}`,
                null
              ),

              selectedStudentId
                ? Promise.resolve(null)
                : apiGet(
                    `/api/classes/${
                      encodeURIComponent(
                        classId
                      )
                    }/learning`,
                    null
                  )
            ]);

            const previous=state.classProgressById.get(classId);
            const data =
              summaryResponse?.progress
                ? {
                    ...summaryResponse
                  }
                : previous ? {...previous,progress:{...previous.progress}} : createEmptyStudentClassProgress(classId);

            const learningLessons =
              asArray(
                learningResponse?.lessons
              );

            const learningProgress =
              asArray(
                learningResponse
                  ?.lessonProgress
              );

            if (
              learningResponse && Array.isArray(learningResponse.lessons) &&
              Array.isArray(learningResponse.lessonProgress)
            ){
              const latestByLessonId =
                new Map();

              learningProgress.forEach(
                item => {
                  const lessonId =
                    normalizeId(
                      item?.lessonId?._id ||
                      item?.lessonId
                    );

                  if (
                    lessonId &&
                    !latestByLessonId.has(
                      lessonId
                    )
                  ){
                    latestByLessonId.set(
                      lessonId,
                      item
                    );
                  }
                }
              );

              const completed =
                learningLessons.filter(
                  lesson => {
                    const record =
                      latestByLessonId.get(
                        normalizeId(
                          lesson?._id ||
                          lesson?.id
                        )
                      );

                    return (
                      record?.status ===
                        "completed" ||
                      Number(
                        record
                          ?.progressPercent ||
                        0
                      ) >= 100 ||
                      record?.completed ===
                        true
                    );
                  }
                ).length;

              const percentage =
                Math.round(
                  (
                    completed /
                    (learningLessons.length || 1)
                  ) *
                  100
                );

              data.progress = {
                ...createEmptyStudentClassProgress(
                  classId
                ).progress,
                ...data.progress,

                lessons:{
                  total:
                    learningLessons.length,
                  completed,
                  percentage
                }
              };

              if (
                !summaryResponse?.progress && !previous?.available
              ){
                // Attendance and assessment totals are still unknown.
                data.progress.overall = 0;
              }
            }

            if(!selectedStudentId && learningResponse?.permissions?.canTrackProgress){
              const [savedAssignments,savedQuizzes]=await Promise.all([
                apiGet(`/api/submissions?classId=${encodeURIComponent(classId)}`,null),
                apiGet(`/api/quizzes/submissions/list?classId=${encodeURIComponent(classId)}`,null)
              ]);
              data.progress={...data.progress};
              for(const [key,records,field] of [['assignments',savedAssignments,'assignmentId'],['quizzes',savedQuizzes,'quizId']]){
                const part=savedAssessmentProgress(learningResponse[key],records,field,requestedStudentId,normalizeId);
                if(part)data.progress[key]=part;
                else if(previous?.progress?.[key])data.progress[key]=previous.progress[key];
              }
              // Only compute an overall value once all category totals are known.
              {
                // Missing attendance is unknown; calculate from confirmed learning categories.
                if(!summaryResponse?.progress && !previous?.available)delete data.progress.attendance;
                const overall=calculateSavedClassProgress(data.progress);
                if(overall!==null)data.progress.overall=overall;
              }
            }
            if(!summaryResponse?.progress && !learningResponse && previous)return {classId,data:previous};
            if(!selectedStudentId && !learningResponse && previous?.available){
              data.progress={...data.progress,lessons:previous.progress.lessons,assignments:previous.progress.assignments,quizzes:previous.progress.quizzes};
              const overall=calculateSavedClassProgress(data.progress);
              if(overall!==null)data.progress.overall=overall;
            }

            return {
              classId,

              data:{
                ...data,
                available:Boolean(
                  summaryResponse?.progress ||
                  learningResponse
                )
              }
            };
          }
        )
      );

    results.forEach(
      (result,index) => {
        const classItem =
          classes[index];

        const classId =
          normalizeId(
            classItem?._id ||
            classItem?.id
          );

        if (!classId){
          return;
        }

        if (
          result.status ===
            "fulfilled" &&
          result.value?.data
        ){
          state.classProgressById.set(
            classId,
            result.value.data
          );

          return;
        }

        console.warn(
          "Student class progress failed:",
          classId,
          result.status === "rejected"
            ? result.reason
            : "No progress response"
        );

        if(!state.classProgressById.has(classId))state.classProgressById.set(classId,createEmptyStudentClassProgress(classId));
      }
    );

    state.classProgressLoaded =
      true;
  }finally{
    state.classProgressLoading =
      false;
  }
}

let studentReturnRefresh=null;
function refreshReturnedStudentClasses(){
  if(!state.classesLoaded||studentReturnRefresh)return studentReturnRefresh;
  studentReturnRefresh=(async()=>{
    await loadStudentClassProgress();
    calculateMetrics();renderStats();renderClasses();renderContinueLearningWorkspace();
  })().catch(error=>console.warn("Class refresh failed:",error)).finally(()=>{studentReturnRefresh=null});
  return studentReturnRefresh;
}
window.addEventListener("pageshow",event=>{if(event.persisted)refreshReturnedStudentClasses()});
window.addEventListener("focus",()=>refreshReturnedStudentClasses());
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refreshReturnedStudentClasses()});

function getStudentClasses(){
  const studentId = getStudentId();
  const schoolId = getSchoolId();

  return state.classes.filter(cls => {
    const students = cls.studentIds || [];

    const listedInClass = students.some(student =>
      sameId(student?._id || student, studentId)
    );

    const sameSchool =
      sameId(cls.schoolId?._id || cls.schoolId, schoolId);

    return listedInClass || sameSchool;
  });
}

function getStudentAssignments(){
  const classIds = getStudentClasses().map(cls => String(cls._id));

  return state.assignments.filter(item => {
    const classId = normalizeId(item.classId?._id || item.classId);

    return (
      !classId ||
      classIds.includes(classId) ||
      sameId(item.schoolId?._id || item.schoolId, getSchoolId())
    );
  });
}

function getStudentSubmissions(){
  const studentId = getStudentId();

  return state.submissions.filter(item =>
    sameId(item.studentId?._id || item.studentId, studentId)
  );
}

function getSubmissionForAssignment(assignmentId){
  return getStudentSubmissions().find(sub =>
    sameId(sub.assignmentId?._id || sub.assignmentId, assignmentId)
  );
}

function getTeacherMap(){
  const map = new Map();

  getStudentClasses().forEach(cls => {
    const teacher = cls.teacherId;

    if (teacher && typeof teacher === "object"){
      map.set(String(teacher._id), teacher);
    }
  });

  return Array.from(map.values());
}

async function loadAll(){

  try{

    /* =========================================================
       AUTHENTICATED STUDENT
    ========================================================= */

    const meRes =
      await apiGet(
        "/api/users/me",
        null
      );


    state.loggedUser =
      meRes?.user ||
      meRes;


    if(!state.loggedUser){

      showAlert(
        "error",
        "Unable to load student profile."
      );


      return;

    }


    /* =========================================================
       PROFILE BEING DISPLAYED
    ========================================================= */

    if(selectedStudentId){

      const publicRes =
        await apiGet(
          `/api/users/${encodeURIComponent(
            selectedStudentId
          )}/public`,
          null
        );


      state.me =
        publicRes?.user ||
        publicRes ||
        state.loggedUser;


    }else{

      state.me =
        state.loggedUser;

    }


    const studentId =
      getStudentId();


    const schoolId =
      getSchoolId();


    /* =========================================================
       PORTFOLIO
    ========================================================= */

    await loadStudentPortfolioFromServer();


    /* =========================================================
       NON-SCHOOL-SCOPED REQUESTS

       These are safe even when the student does not currently
       have a resolved school relationship.
    ========================================================= */

    const [

      posts,
      studentResources,
      certificates,
      unread

    ] =
      await Promise.all([

        apiGet(
          "/api/posts",
          []
        ),

        apiGet(
          "/api/student-resources",
          {
            resources:[]
          }
        ),

        apiGet(
          "/api/certificates/my",
          {
            certificates:[]
          }
        ),

        apiGet(
          "/api/notifications/unread-count",
          {
            count:0
          }
        )

      ]);


    /* =========================================================
       SCHOOL-SCOPED DATA
    ========================================================= */

    let classes =
      [];


    let assignments =
      [];


    let submissions =
      [];


    let schedules =
      [];


    let schoolUpdates =
      [];


    if(schoolId){

      [

        classes,
        assignments,
        submissions,
        schedules,
        schoolUpdates

      ] =
        await Promise.all([

          apiGet(
            `/api/classes?schoolId=${
              encodeURIComponent(
                schoolId
              )
            }`,
            null
          ),

          apiGet(
            `/api/assignments?schoolId=${
              encodeURIComponent(
                schoolId
              )
            }`,
            []
          ),

          studentId
            ? apiGet(
                `/api/submissions?schoolId=${
                  encodeURIComponent(
                    schoolId
                  )
                }&studentId=${
                  encodeURIComponent(
                    studentId
                  )
                }`,
                []
              )
            : Promise.resolve(
                []
              ),

          apiGet(
            `/api/schedules?schoolId=${
              encodeURIComponent(
                schoolId
              )
            }`,
            []
          ),

          apiGet(
            `/api/school-updates?schoolId=${
              encodeURIComponent(
                schoolId
              )
            }`,
            []
          )

        ]);


    }else{

      /*
        IMPORTANT:

        Never send:
          ?schoolId=

        A student without a resolved school relationship
        may still use account-level Student Studio features.
      */

      console.warn(
        "Student school relationship is not currently available. School-scoped data was not requested."
      );

    }


    /* =========================================================
       NORMALIZE STATE
    ========================================================= */

    state.classesLoadFailed=classes===null;
    if(classes !== null){
      state.classes=asArray(classes);
      state.classesLoaded=true;
    }


    const returningClassId=urlParams.get("returnClassId");
    if(returningClassId&&!state.classes.some(item=>normalizeId(item._id||item.id)===returningClassId)){
      state.classesLoaded=false;
      const learning=await apiGet(`/api/classes/${encodeURIComponent(returningClassId)}/learning`,null);
      if(learning?.permissions?.canTrackProgress&&learning.class){
        state.classes.push(learning.class);
        state.classesLoaded=true;
        state.classesLoadFailed=false;
      }else{
        state.classesLoadFailed=true;
      }
    }

    state.assignments =
      asArray(
        assignments
      );


    state.submissions =
      asArray(
        submissions
      );


    state.schedules =
      asArray(
        schedules
      );


    state.posts =
      asArray(
        posts
      );


    state.schoolUpdates =
      asArray(
        schoolUpdates
      );


    state.studentResources =
      asArray(
        studentResources
      );


    state.certificates =
      asArray(
        certificates
      );


    state.unread =
      Number(
        unread?.count ||
        unread?.unread ||
        0
      );


    state.teachers =
      getTeacherMap();


    /* =========================================================
       STUDENT PROGRESS
    ========================================================= */

    // Keep confirmed progress during refresh.

    state.classProgressLoaded =
      false;


    if(
      state.classes.length
    ){

      await loadStudentClassProgress({
        force:true
      });

    }else{

      state.classProgressLoaded =
        true;

    }


    calculateMetrics();


    /* =========================================================
       RENDER
    ========================================================= */

    renderProfile();

    renderStats();

    renderBadges();

    hydrateSubmissionSelect();


    if(
      activeStudentStudioPage ===
      "certificates"
    ){

      renderStudentCertificates();

    }


    renderStudioHome();


    renderActiveStudentStudioPage(
      activeStudentStudioPage ||
      "overview"
    );


    bindStudentStudioNavigation();

    bindStudentClassControls();

    bindStudentAssignmentControls();


    closeStudentSearchResults({
      clear:false
    });


  }catch(error){

    console.error(
      "STUDENT PORTAL LOAD ERROR:",
      error
    );


    showAlert(
      "error",
      "Student portal failed to load."
    );

  }

}

/* =========================================================
   CONTINUE LEARNING WORKSPACE
========================================================= */

function getContinueLearningProgress(item){
  return getStudentClassProgress(
    item
  );
}

function getContinueLearningClasses(){
  return getStudentClasses()
    .filter(item => {
      return (
        getStudentClassStatus(item) ===
          "active" &&
        getStudentClassProgress(item) <
          100
      );
    })
    .sort((first,second) => {
      return (
        getStudentClassUpdatedTime(second) -
        getStudentClassUpdatedTime(first)
      );
    });
}

function getContinueLearningPendingAssignments(){
  return getStudentAssignments()
    .filter(assignment => {
      return !getSubmissionForAssignment(
        assignment._id
      );
    })
    .sort((first,second) => {
      const firstDue =
        new Date(
          first.dueDate ||
          first.deadline ||
          8640000000000000
        ).getTime();

      const secondDue =
        new Date(
          second.dueDate ||
          second.deadline ||
          8640000000000000
        ).getTime();

      return firstDue - secondDue;
    });
}

function getContinueLearningClassCover(item){
  return (
    item?.coverImage ||
    item?.bannerImage ||
    item?.thumbnail ||
    item?.image ||
    FALLBACK_COVER
  );
}

function renderContinueLearningWorkspace(){
  const container=$("continueLearningClassGrid");
  if(!state.classesLoaded){
    if(state.classesLoadFailed && container){
      container.setAttribute("aria-busy","false");
      container.innerHTML='<div class="studio-widget-empty">Classes could not be loaded. <button type="button" data-dashboard-action="refresh">Try again</button></div>';
    }
    return;
  }
  if(container)container.setAttribute("aria-busy","false");
  setText("continueLearningBadge",getContinueLearningClasses().length);
  const classes =
    getContinueLearningClasses();

  setText(
    "continueActiveClassCount",
    classes.length
  );

  renderContinueLearningClasses(
    classes
  );
}



function renderContinueLearningClasses(
  classes
){
  const container =
    $("continueLearningClassGrid");

  if (!container){
    return;
  }

  if (!classes.length){
    container.innerHTML = `
      <div class="studio-widget-empty">

        <div class="studio-widget-empty-icon">

          <i
            class="fa-solid fa-graduation-cap"
            aria-hidden="true"
          ></i>

        </div>

        <strong>
          You are all caught up
        </strong>

        <p>
          You do not have any unfinished classes to continue.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML =
    classes
      .map(item => {
        const classId =
          item._id ||
          item.id;

        const progress =
          getContinueLearningProgress(
            item
          );

        return `
          <article class="continue-class-card">

            <div
              class="continue-class-cover"
              style="background-image:url('${escapeHtml(
                getContinueLearningClassCover(
                  item
                )
              )}')"
            ></div>

            <div class="continue-class-content">

              <span>
                ${escapeHtml(
                  item.subject ||
                  "Learning program"
                )}
              </span>

              <h4>
                ${escapeHtml(
                  item.title ||
                  "Untitled class"
                )}
              </h4>

              <div class="studio-progress-track">

                <div
                  class="studio-progress-value"
                  style="width:${progress}%"
                ></div>

              </div>

              <div class="studio-progress-meta">

                <span>
                  ${progress}% complete
                </span>

                <span>
                  ${100 - progress}% remaining
                </span>

              </div>

              <button
                class="primary-btn"
                type="button"
                data-resume-class="${escapeHtml(
                  classId
                )}"
              >
                <i
                  class="fa-solid fa-play"
                  aria-hidden="true"
                ></i>

                Continue
              </button>

            </div>

          </article>
        `;
      })
      .join("");
}



function getUpcomingStudentAssignments(limit = 5){
  const now = Date.now();

  return getStudentAssignments()
    .filter(item => {
      const submission =
        getSubmissionForAssignment(item._id);

      const dueValue =
        item.dueDate ||
        item.deadline;

      const dueTime =
        dueValue
          ? new Date(dueValue).getTime()
          : Number.POSITIVE_INFINITY;

      return (
        !submission &&
        (
          !Number.isFinite(dueTime) ||
          dueTime >= now
        )
      );
    })
    .sort((a,b) => {
      const first =
        new Date(
          a.dueDate ||
          a.deadline ||
          8640000000000000
        ).getTime();

      const second =
        new Date(
          b.dueDate ||
          b.deadline ||
          8640000000000000
        ).getTime();

      return first - second;
    })
    .slice(0,limit);
}

function getUpcomingStudentSchedules(limit = 5){
  const now = Date.now();

  return [...state.schedules]
    .filter(item => {
      const value =
        item.date ||
        item.startAt ||
        item.startDate;

      if(!value){
        return true;
      }

      const time =
        new Date(value).getTime();

      return (
        !Number.isFinite(time) ||
        time >= now -
          86400000
      );
    })
    .sort((a,b) => {
      const first =
        new Date(
          a.date ||
          a.startAt ||
          a.startDate ||
          0
        ).getTime();

      const second =
        new Date(
          b.date ||
          b.startAt ||
          b.startDate ||
          0
        ).getTime();

      return first - second;
    })
    .slice(0,limit);
}

function getRecentStudentUpdates(limit = 6){
  return [...state.schoolUpdates]
    .sort((a,b) => {
      const pinnedDifference =
        Number(Boolean(b.pinned)) -
        Number(Boolean(a.pinned));

      if(pinnedDifference){
        return pinnedDifference;
      }

      return (
        new Date(
          b.createdAt || 0
        ).getTime() -
        new Date(
          a.createdAt || 0
        ).getTime()
      );
    })
    .slice(0,limit);
}

function getPreferredStudentClass(){
  const classes =
    getContinueLearningClasses();

  if(!classes.length){
    return null;
  }

  return (
    classes[0]
  );
}

function renderStudioHome(){
  renderStudioContinueLearning();

  renderStudioTodaySchedule();

  renderStudioAssignmentTimeline();

  renderStudioWeeklyProgress();

  renderStudioPerformance();

  renderStudioRecentActivity();

  renderStudioAITutor();

  renderStudioAchievements();
}

function renderStudioContinueLearning(){
  const container =
    $("studioContinueLearningCard");

  if(!container){
    return;
  }

  const selectedClass =
    getPreferredStudentClass();

  if(!selectedClass){
    container.innerHTML = `
      <div class="studio-widget-empty">
        <div class="studio-widget-empty-icon">
          <i class="fas fa-graduation-cap"></i>
        </div>

        <strong>
          No class available
        </strong>

        <p>
          Your enrolled classes will appear here once your school
          assigns them to your account.
        </p>
      </div>
    `;

    return;
  }

  const teacher =
    selectedClass.teacherId?.name ||
    selectedClass.teacherName ||
    "Instructor";

  const progress =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          selectedClass.progress ||
          selectedClass.completion ||
          state.metrics.completion ||
          0
        )
      )
    );

  const cover =
    selectedClass.coverImage ||
    selectedClass.bannerImage ||
    CLASS_FALLBACK;

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          CONTINUE LEARNING
        </span>

        <h3>
          ${escapeHtml(
            selectedClass.title ||
            "Current class"
          )}
        </h3>
      </div>

      <span class="chip primary">
        ${progress}% complete
      </span>
    </div>

    <div class="studio-continue-layout">
      <div
        class="studio-continue-cover"
        style="background-image:url('${escapeHtml(cover)}')"
        role="img"
        aria-label="${escapeHtml(
          selectedClass.title ||
          "Class cover"
        )}">
      </div>

      <div class="studio-continue-content">
        <p class="studio-continue-subject">
          ${escapeHtml(
            selectedClass.subject ||
            "Learning program"
          )}
        </p>

        <div class="studio-continue-teacher">
          <i class="fas fa-user-circle"></i>

          <span>
            ${escapeHtml(teacher)}
          </span>
        </div>

        <div class="studio-progress-track">
          <div
            class="studio-progress-value"
            style="width:${progress}%">
          </div>
        </div>

        <div class="studio-progress-meta">
          <span>
            ${progress}% completed
          </span>

          <span>
            ${
              selectedClass.schedule
                ? escapeHtml(
                    selectedClass.schedule
                  )
                : "Self-paced"
            }
          </span>
        </div>

        <div class="studio-widget-actions">
          <button
            class="primary-btn"
            type="button"
            data-studio-open-class="${escapeHtml(
              selectedClass._id
            )}">
            <i class="fas fa-play"></i>
            Continue
          </button>

          ${
            selectedClass.meetingLink
              ? `
                <a
                  class="ghost-btn"
                  href="${escapeHtml(
                    selectedClass.meetingLink
                  )}"
                  target="_blank"
                  rel="noopener noreferrer">
                  <i class="fas fa-video"></i>
                  Join class
                </a>
              `
              : ""
          }
        </div>
      </div>
    </div>
  `;

  container
    .querySelector(
      "[data-studio-open-class]"
    )
    ?.addEventListener(
      "click",
      () => {
        openStudentClass(
          selectedClass._id
        );
      }
    );
}

function renderStudioTodaySchedule(){
  const container =
    $("studioTodayScheduleCard");

  if(!container){
    return;
  }

  const schedules =
    getUpcomingStudentSchedules(4);

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          TODAY
        </span>

        <h3>
          Upcoming Schedule
        </h3>
      </div>

      <button
        class="studio-widget-link"
        type="button"
        data-open-studio-page="schedule">
        View calendar
      </button>
    </div>

    <div class="studio-schedule-list">
      ${
        schedules.length
          ? schedules.map(item => `
              <article class="studio-schedule-item">
                <div class="studio-schedule-time">
                  <strong>
                    ${escapeHtml(
                      item.time ||
                      item.startTime ||
                      "--:--"
                    )}
                  </strong>

                  <span>
                    ${formatDate(
                      item.date ||
                      item.startAt ||
                      item.startDate
                    )}
                  </span>
                </div>

                <div class="studio-schedule-copy">
                  <strong>
                    ${escapeHtml(
                      item.title ||
                      item.classId?.title ||
                      "Scheduled class"
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      item.teacherId?.name ||
                      item.notes ||
                      "Class activity"
                    )}
                  </span>
                </div>

                ${
                  item.meetingLink
                    ? `
                      <a
                        class="studio-icon-action"
                        href="${escapeHtml(
                          item.meetingLink
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Join scheduled class">
                        <i class="fas fa-arrow-up-right-from-square"></i>
                      </a>
                    `
                    : ""
                }
              </article>
            `).join("")
          : `
            <div class="studio-widget-empty compact">
              <strong>
                Nothing scheduled
              </strong>

              <p>
                Your upcoming classes and meetings will appear here.
              </p>
            </div>
          `
      }
    </div>
  `;
}

function renderStudioAssignmentTimeline(){
  const container =
    $("studioAssignmentTimeline");

  if(!container){
    return;
  }

  const assignments =
    getUpcomingStudentAssignments(5);

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          COURSEWORK
        </span>

        <h3>
          Assignment Timeline
        </h3>
      </div>

      <button
        class="studio-widget-link"
        type="button"
        data-open-studio-page="assignments">
        View all
      </button>
    </div>

    <div class="studio-assignment-timeline">
      ${
        assignments.length
          ? assignments.map(item => `
              <article class="studio-timeline-item">
                <span class="studio-timeline-dot"></span>

                <div class="studio-timeline-copy">
                  <strong>
                    ${escapeHtml(
                      item.title ||
                      "Assignment"
                    )}
                  </strong>

                  <span>
                    Due ${formatDate(
                      item.dueDate ||
                      item.deadline
                    )}
                  </span>
                </div>

                <button
                  class="studio-timeline-action"
                  type="button"
                  data-submit-assignment="${escapeHtml(
                    item._id
                  )}">
                  Submit
                </button>
              </article>
            `).join("")
          : `
            <div class="studio-widget-empty compact">
              <strong>
                You're all caught up
              </strong>

              <p>
                There are no pending assignments.
              </p>
            </div>
          `
      }
    </div>
  `;

  container
    .querySelectorAll(
      "[data-submit-assignment]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          openSubmissionModal(
            button.dataset.submitAssignment
          );
        }
      );
    });
}

function renderStudioWeeklyProgress(){
  const container =
    $("studioWeeklyProgress");

  if(!container){
    return;
  }

  const completion =
    state.metrics.completion;

  const attendance =
    state.metrics.attendance;

  const engagement =
    state.metrics.engagement;

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          THIS WEEK
        </span>

        <h3>
          Weekly Progress
        </h3>
      </div>
    </div>

    <div class="studio-progress-list">
      ${renderStudioProgressRow(
        "Assignment completion",
        completion
      )}

      ${renderStudioProgressRow(
        "Attendance",
        attendance
      )}

      ${renderStudioProgressRow(
        "Engagement",
        engagement
      )}
    </div>
  `;
}

function renderStudioProgressRow(
  label,
  value
){
  const safeValue =
    Math.max(
      0,
      Math.min(
        100,
        Number(value) || 0
      )
    );

  return `
    <div class="studio-progress-row">
      <div class="studio-progress-row-head">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong>
          ${safeValue}%
        </strong>
      </div>

      <div class="studio-progress-track">
        <div
          class="studio-progress-value"
          style="width:${safeValue}%">
        </div>
      </div>
    </div>
  `;
}

function renderStudioPerformance(){
  const container =
    $("studioPerformanceChart");

  if(!container){
    return;
  }

  const score =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          state.metrics.overall
        ) || 0
      )
    );

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          PERFORMANCE
        </span>

        <h3>
          Learning Score
        </h3>
      </div>
    </div>

    <div class="studio-score-layout">
      <div
        class="studio-score-ring"
        style="--studio-score:${score}">
        <div>
          <strong>
            ${score}%
          </strong>

          <span>
            Overall
          </span>
        </div>
      </div>

      <div class="studio-score-details">
        <div>
          <span>
            Productivity
          </span>

          <strong>
            ${state.metrics.productivity}%
          </strong>
        </div>

        <div>
          <span>
            Completion
          </span>

          <strong>
            ${state.metrics.completion}%
          </strong>
        </div>

        <div>
          <span>
            Attendance
          </span>

          <strong>
            ${state.metrics.attendance}%
          </strong>
        </div>
      </div>
    </div>
  `;
}

function renderStudioRecentActivity(){
  const container =
    $("studioRecentActivity");

  if(!container){
    return;
  }

  const updates =
    getRecentStudentUpdates(5);

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          LIVE FEED
        </span>

        <h3>
          Recent Activity
        </h3>
      </div>
    </div>

    <div class="studio-activity-list">
      ${
        updates.length
          ? updates.map(update => `
              <article class="studio-activity-item">
                <div class="studio-activity-icon">
                  <i class="${
                    update.type === "urgent"
                      ? "fas fa-triangle-exclamation"
                      : "fas fa-bullhorn"
                  }"></i>
                </div>

                <div class="studio-activity-copy">
                  <strong>
                    ${escapeHtml(
                      update.title ||
                      "School update"
                    )}
                  </strong>

                  <span>
                    ${escapeHtml(
                      update.message ||
                      "A new update was posted."
                    )}
                  </span>

                  <small>
                    ${formatDateTime(
                      update.createdAt
                    )}
                  </small>
                </div>
              </article>
            `).join("")
          : `
            <div class="studio-widget-empty compact">
              <strong>
                No recent activity
              </strong>

              <p>
                School and class updates will appear here.
              </p>
            </div>
          `
      }
    </div>
  `;
}

function renderStudioAITutor(){
  const container =
    $("studioAITutor");

  if(!container){
    return;
  }

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          AI LEARNING
        </span>

        <h3>
          Study Assistant
        </h3>
      </div>
    </div>

    <p class="studio-ai-description">
      Get support with explanations, summaries, quizzes,
      grammar, and study planning.
    </p>

    <div class="studio-ai-actions">
      <button
        type="button"
        data-ai-action="explain">
        <i class="fas fa-lightbulb"></i>
        Explain a topic
      </button>

      <button
        type="button"
        data-ai-action="quiz">
        <i class="fas fa-list-check"></i>
        Practice quiz
      </button>

      <button
        type="button"
        data-ai-action="summary">
        <i class="fas fa-file-lines"></i>
        Summarize lesson
      </button>

      <button
        type="button"
        data-ai-action="grammar">
        <i class="fas fa-spell-check"></i>
        Check grammar
      </button>
    </div>
  `;

  container
    .querySelectorAll(
      "[data-ai-action]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          openStudentStudioPage(
            "ai"
          );
        }
      );
    });
}

function renderStudioAchievements(){
  const container =
    $("studioAchievements");

  if(!container){
    return;
  }

  const submitted =
    getStudentSubmissions().length;

  const classes =
    getStudentClasses().length;

  const milestones = [
    {
      icon:"fas fa-clipboard-check",
      label:"Work submitted",
      value:submitted
    },
    {
      icon:"fas fa-graduation-cap",
      label:"Active classes",
      value:classes
    },
    {
      icon:"fas fa-chart-line",
      label:"Completion",
      value:`${state.metrics.completion}%`
    }
  ];

  container.innerHTML = `
    <div class="studio-widget-heading">
      <div>
        <span class="studio-widget-eyebrow">
          ACHIEVEMENTS
        </span>

        <h3>
          Learning Milestones
        </h3>
      </div>
    </div>

    <div class="studio-achievement-list">
      ${milestones.map(item => `
        <div class="studio-achievement-item">
          <div class="studio-achievement-icon">
            <i class="${item.icon}"></i>
          </div>

          <div>
            <strong>
              ${escapeHtml(item.value)}
            </strong>

            <span>
              ${escapeHtml(item.label)}
            </span>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

/* =========================================================
   STUDENT DASHBOARD ACTION CONTROLLER
========================================================= */

let studentDashboardActionsBound = false;

function navigateStudentStudio(page, options = {}){
  const targetPage =
    String(page || "overview")
      .trim()
      .toLowerCase();

  if (
    typeof activateStudentStudioPage ===
    "function"
  ){
    activateStudentStudioPage(
      targetPage,
      options
    );

    return;
  }

  if (
    typeof openStudentStudioPage ===
    "function"
  ){
    openStudentStudioPage(
      targetPage,
      {
        updateHistory:
          options.history !== false,

        scroll:
          options.scroll !== false,

        instant:
          options.instant === true
      }
    );

    return;
  }

  const url =
    new URL(window.location.href);

  if (targetPage === "overview"){
    url.searchParams.delete("section");
  }else{
    url.searchParams.set(
      "section",
      targetPage
    );
  }

  window.location.href =
    url.toString();
}

function setDashboardButtonLoading(
  button,
  loading,
  loadingLabel = "Loading..."
){
  if (!button){
    return;
  }

  if (loading){
    if (
      !button.dataset.originalHtml
    ){
      button.dataset.originalHtml =
        button.innerHTML;
    }

    button.disabled = true;

    button.classList.add(
      "is-loading"
    );

    button.innerHTML = `
      <i
        class="fa-solid fa-spinner fa-spin"
        aria-hidden="true"
      ></i>

      <span>
        ${escapeHtml(loadingLabel)}
      </span>
    `;

    return;
  }

  button.disabled = false;

  button.classList.remove(
    "is-loading"
  );

  if (button.dataset.originalHtml){
    button.innerHTML =
      button.dataset.originalHtml;

    delete button.dataset.originalHtml;
  }
}

function openDashboardAssignmentSubmission(
  assignmentId = ""
){
  const safeAssignmentId =
    String(assignmentId || "").trim();

  if (
    typeof openSubmissionModal ===
    "function"
  ){
    openSubmissionModal(
      safeAssignmentId
    );

    return;
  }

  const assignmentSelect =
    $("submissionAssignmentId");

  if (
    assignmentSelect &&
    safeAssignmentId
  ){
    assignmentSelect.value =
      safeAssignmentId;
  }

  openModal(
    "submissionModal"
  );
}

async function refreshStudentDashboard(
  triggerButton = null
){
  const button =
    triggerButton ||
    $("refreshWorkspace") ||
    $("refreshWorkspaceButton");

  setDashboardButtonLoading(
    button,
    true,
    "Refreshing..."
  );

  try{
    await loadAll();

    if (
      typeof renderStudioHome ===
      "function"
    ){
      renderStudioHome();
    }

    if (
  activeStudentStudioPage === "continue" &&
  typeof renderContinueLearningWorkspace ===
    "function"
){
  renderContinueLearningWorkspace();
}

    if (
      typeof renderStats ===
      "function"
    ){
      renderStats();
    }

    if (
      typeof showAlert ===
      "function"
    ){
      showAlert(
        "success",
        "Student dashboard refreshed."
      );
    }
  }catch(error){
    console.error(
      "refreshStudentDashboard failed:",
      error
    );

    if (
      typeof showAlert ===
      "function"
    ){
      showAlert(
        "error",
        error?.message ||
        "Unable to refresh the dashboard."
      );
    }
  }finally{
    setDashboardButtonLoading(
      button,
      false
    );
  }
}

function resumeStudentLearning(
  requestedClassId = ""
){

  const requestedId =
    normalizeId(
      requestedClassId
    );

  const classes =
    typeof getStudentClasses ===
    "function"
      ? getStudentClasses()
      : (
          Array.isArray(state.classes)
            ? state.classes
            : []
        );

  const selectedClass =
    (
      requestedId
        ? classes.find(
            item =>
              normalizeId(
                item?._id ||
                item?.id
              ) ===
              requestedId
          )
        : null
    ) ||
    (
      typeof getPreferredStudentClass ===
      "function"
        ? getPreferredStudentClass()
        : null
    ) ||
    classes[0] ||
    null;

  const selectedClassId =
    requestedId ||
    normalizeId(
      selectedClass?._id ||
      selectedClass?.id
    );

  if(!selectedClassId){

    navigateStudentStudio?.(
      "classes"
    );

    showAlert?.(
      "info",
      "No class is available yet."
    );

    return;
  }

  const classProgress =
    state.classProgressById instanceof Map
      ? state.classProgressById.get(
          String(
            selectedClassId
          )
        )
      : null;

  const lessonId =
    classProgress
      ?.latestActivity
      ?.type ===
      "lesson"
        ? normalizeId(
            classProgress
              .latestActivity
              .id
          )
        : "";

  openStudentClass(
    selectedClassId,
    lessonId
  );
}

function handleStudentAIAction(action){
  const selectedAction =
    String(action || "")
      .trim()
      .toLowerCase();

  navigateStudentStudio(
    "ai"
  );

  window.setTimeout(
    () => {
      const workspace =
        $("studentAIWorkspace");

      if (!workspace){
        return;
      }

      workspace.dataset.requestedAction =
        selectedAction;

      workspace.dispatchEvent(
        new CustomEvent(
          "student-ai-action",
          {
            bubbles:true,
            detail:{
              action:selectedAction
            }
          }
        )
      );
    },
    80
  );
}

/* =========================================================
   STUDENT CLASS CARD MENUS
========================================================= */

function closeStudentClassMenus(
  excludedMenu = null
){
  document
    .querySelectorAll(
      "[data-class-menu-panel]"
    )
    .forEach(menu => {
      if (menu === excludedMenu){
        return;
      }

      menu.hidden = true;
    });

  document
    .querySelectorAll(
      "[data-class-menu]"
    )
    .forEach(button => {
      const controlledMenuId =
        button.getAttribute(
          "aria-controls"
        );

      if (
        excludedMenu &&
        controlledMenuId ===
          excludedMenu.id
      ){
        return;
      }

      button.setAttribute(
        "aria-expanded",
        "false"
      );
    });
}

function bindStudentStudioDelegatedActions(){
  if (studentDashboardActionsBound){
    return;
  }

  studentDashboardActionsBound = true;

  document.addEventListener(
    "click",
    async event => {
      const target =
        event.target;

      if (!(target instanceof Element)){
        return;
      }
            if (
        openStudentAssignmentMenuId &&
        !target.closest(
          ".student-assignment-menu-wrap"
        )
      ){
        closeStudentAssignmentMenus({
          render:true
        });

        return;
      }

            if (
        !target.closest(
          ".student-class-menu-wrap"
        )
      ){
        closeStudentClassMenus();
      }

      /*
        Dashboard refresh
      */

const refreshButton =
  target.closest(
    "#refreshWorkspace," +
    "#refreshWorkspaceButton," +
    "#continueLearningRefreshButton, [data-dashboard-action=refresh]"
  );

      if (refreshButton){
        event.preventDefault();

        await refreshStudentDashboard(
          refreshButton
        );

        return;
      }

      /*
        Resume learning
      */

      const resumeButton =
        target.closest(
          "#resumeLearningButton, [data-resume-class]"
        );

      if (resumeButton){
        event.preventDefault();
        if(resumeButton.dataset.resumeClass){openStudentClass(resumeButton.dataset.resumeClass,"",true);return;}

        resumeStudentLearning();

        return;
      }

      /*
        Dashboard and widget navigation
      */


      /*
====================================================
CLASS SEARCH
====================================================
*/

const classSearch =
    target.closest(
        "#clearClassSearchButton"
    );

if(classSearch){

    event.preventDefault();

    const input =
        $("classSearchInput");

    input.value="";

    renderClasses();

    return;

}

      const resetFilters =
target.closest(
"#resetClassFiltersButton"
);

if(resetFilters){

event.preventDefault();

$("classSearchInput").value="";

$("classStatusFilter").value="all";

$("classSortFilter").value="recent";

renderClasses();

return;

}


      /* =====================================================
   MY CLASSES ACTIONS
===================================================== */

const refreshClassesButton =
  target.closest(
    "#refreshClassesButton"
  );

if (refreshClassesButton){
  event.preventDefault();

  setDashboardButtonLoading(
    refreshClassesButton,
    true,
    "Refreshing..."
  );

  try{
    await loadAll();

    renderClasses();

    showAlert(
      "success",
      "Your classes have been refreshed.",
      {
        title:"Classes updated"
      }
    );
  }catch(error){
    console.error(
      "Class refresh failed:",
      error
    );

    showAlert(
      "error",
      error?.message ||
      "We could not refresh your classes."
    );
  }finally{
    setDashboardButtonLoading(
      refreshClassesButton,
      false
    );
  }

  return;
}


const preferredClassButton =
  target.closest(
    "#continuePreferredClassButton"
  );

if (preferredClassButton){
  event.preventDefault();

  navigateStudentStudio(
    "continue"
  );

  return;
}


const clearClassSearchButton =
  target.closest(
    "#clearClassSearchButton"
  );

if (clearClassSearchButton){
  event.preventDefault();

  const searchInput =
    $("classSearchInput");

  if (searchInput){
    searchInput.value = "";
    searchInput.focus();
  }

  renderClasses();

  return;
}


const resetClassFiltersButton =
  target.closest(
    "#resetClassFiltersButton," +
    "#emptyClassesResetButton"
  );

if (resetClassFiltersButton){
  event.preventDefault();

  const searchInput =
    $("classSearchInput");

  const statusFilter =
    $("classStatusFilter");

  const sortFilter =
    $("classSortFilter");

  if (searchInput){
    searchInput.value = "";
  }

  if (statusFilter){
    statusFilter.value = "all";
  }

  if (sortFilter){
    sortFilter.value = "recent";
  }

  renderClasses();

  return;
}


const gridViewButton =
  target.closest(
    "#classGridViewButton"
  );

if (gridViewButton){
  event.preventDefault();

  setStudentClassView("grid");

  return;
}


const listViewButton =
  target.closest(
    "#classListViewButton"
  );

if (listViewButton){
  event.preventDefault();

  setStudentClassView("list");

  return;
}


const openClassButton =
  target.closest(
    "[data-open-class]"
  );

if (openClassButton){
  event.preventDefault();

  openStudentClass(
    openClassButton.dataset
      .openClass
  );

  return;
}


const continueClassButton =
  target.closest(
    "[data-continue-class]"
  );

if (continueClassButton){
  event.preventDefault();

  resumeStudentLearning(
    continueClassButton.dataset
      .continueClass
  );

  return;
}


      /* =====================================================
   CLASS CARD MENU
===================================================== */

const classMenuButton =
  target.closest(
    "[data-class-menu]"
  );

if (classMenuButton){
  event.preventDefault();
  event.stopPropagation();

  const classId =
    classMenuButton.dataset
      .classMenu;

  const menu =
    document.querySelector(
      `[data-class-menu-panel="${CSS.escape(
        classId
      )}"]`
    );

  const shouldOpen =
    Boolean(menu?.hidden);

  closeStudentClassMenus();

  if (menu){
    menu.hidden =
      !shouldOpen;

    classMenuButton.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );

    if (shouldOpen){
      menu
        .querySelector(
          'button, a[href]'
        )
        ?.focus({
          preventScroll:true
        });
    }
  }

  return;
}


const classMenuAction =
  target.closest(
    "[data-class-action]"
  );

if (classMenuAction){
  event.preventDefault();

  const action =
    classMenuAction.dataset
      .classAction;

  const classId =
    classMenuAction.dataset
      .classId;

  closeStudentClassMenus();

  switch(action){

    case "open":
      openStudentClass(
        classId
      );
      break;

    case "continue":
      resumeStudentLearning(
        classId
      );
      break;

    case "assignments":
      sessionStorage.setItem(
        "aiftSelectedClassId",
        classId
      );

      navigateStudentStudio(
        "assignments"
      );
      break;

    case "resources":
      sessionStorage.setItem(
        "aiftSelectedClassId",
        classId
      );

      navigateStudentStudio(
        "resources"
      );
      break;
  }

  return;
}



      /* =====================================================
   ASSIGNMENT CENTER DYNAMIC ACTIONS
===================================================== */

const assignmentTabButton =
  target.closest(
    "[data-assignment-tab]"
  );

if (assignmentTabButton){
  event.preventDefault();

  setStudentAssignmentStatus(
    assignmentTabButton.dataset
      .assignmentTab
  );

  return;
}


const assignmentSummaryCard =
  target.closest(
    "[data-assignment-summary-filter]"
  );

if (assignmentSummaryCard){
  event.preventDefault();

  setStudentAssignmentStatus(
    assignmentSummaryCard.dataset
      .assignmentSummaryFilter
  );

  return;
}


const emptyAssignmentsResetButton =
  target.closest(
    "#emptyAssignmentsResetButton"
  );

if (emptyAssignmentsResetButton){
  event.preventDefault();

  resetStudentAssignmentFilters();

  return;
}


const reviewSubmissionButton =
  target.closest(
    "[data-review-submission]"
  );

if (reviewSubmissionButton){
  event.preventDefault();

  openDashboardAssignmentSubmission(
    reviewSubmissionButton.dataset
      .reviewSubmission
  );

  return;
}


const viewAssignmentButton =
  target.closest(
    "[data-view-assignment]"
  );

if (viewAssignmentButton){
  event.preventDefault();

  const assignmentId =
    normalizeId(
      viewAssignmentButton.dataset
        .viewAssignment
    );

  const assignment =
    getStudentAssignments()
      .find(item =>
        sameId(
          item?._id ||
          item?.id,
          assignmentId
        )
      );

  if (!assignment){
    showAlert(
      "error",
      "This assignment is no longer available.",
      {
        title:"Assignment unavailable"
      }
    );

    return;
  }

  openDashboardAssignmentSubmission(
    assignmentId
  );

  return;
}

            const assignmentMenuButton =
        target.closest(
          "[data-assignment-menu]"
        );

      if (assignmentMenuButton){
        event.preventDefault();
        event.stopPropagation();

        toggleStudentAssignmentMenu(
          assignmentMenuButton.dataset
            .assignmentMenu
        );

        return;
      }


      const assignmentMenuAction =
        target.closest(
          "[data-assignment-menu-action]"
        );

      if (assignmentMenuAction){
        event.preventDefault();
        event.stopPropagation();

        const action =
          assignmentMenuAction.dataset
            .assignmentMenuAction;

        const assignmentId =
          normalizeId(
            assignmentMenuAction.dataset
              .assignmentId
          );

        const assignment =
          getAssignmentById(
            assignmentId
          );

        closeStudentAssignmentMenus({
          render:false
        });

        if (!assignment){
          showAlert(
            "error",
            "This assignment is no longer available.",
            {
              title:"Assignment unavailable"
            }
          );

          renderAssignments();

          return;
        }

        if (action === "open"){
          openSubmissionModal(
            assignmentId
          );

          renderAssignments();

          return;
        }

        if (action === "submit"){
          openSubmissionModal(
            assignmentId
          );

          renderAssignments();

          return;
        }

        if (action === "review"){
          openSubmissionModal(
            assignmentId
          );

          renderAssignments();

          return;
        }

        if (action === "copy"){
          await copyStudentAssignmentLink(
            assignmentId
          );

          renderAssignments();

          return;
        }

        renderAssignments();

        return;
      }

      const pageButton =
        target.closest(
          "[data-open-studio-page]"
        );

      if (pageButton){
        event.preventDefault();

        navigateStudentStudio(
          pageButton.dataset
            .openStudioPage
        );

        return;
      }


      const classButton =
        target.closest(
          "[data-studio-open-class]"
        );

      if (classButton){
        event.preventDefault();

        const classId =
          classButton.dataset
            .studioOpenClass;

        if (!classId){
          return;
        }

if (
  typeof openStudentClass ===
  "function"
){
  openStudentClass(classId);
}else{
  const url =
    new URL(
      "class-view.html",
      window.location.href
    );

  url.searchParams.set(
    "classId",
    classId
  );

  url.searchParams.set(
    "from",
    "student"
  );

  window.location.href =
    url.href;
}

return;
      }

      /*
        Submit a specific assignment
      */

      const assignmentButton =
        target.closest(
          "[data-submit-assignment]"
        );

      if (assignmentButton){
        event.preventDefault();

        openDashboardAssignmentSubmission(
          assignmentButton.dataset
            .submitAssignment
        );

        return;
      }

      /*
        AI dashboard actions
      */

      const aiButton =
        target.closest(
          "[data-ai-action]"
        );

      if (aiButton){
        event.preventDefault();

        handleStudentAIAction(
          aiButton.dataset.aiAction
        );

        return;
      }

      /*
        Router search button
      */

      const searchButton =
        target.closest(
          "#studentWorkspaceSearchButton"
        );

      if (searchButton){
        event.preventDefault();

        const searchInput =
          $("globalSearch");

        searchInput?.focus();

        searchInput?.scrollIntoView({
          behavior:"smooth",
          block:"center"
        });

        return;
      }

      /*
        Router back button
      */

      const backButton =
        target.closest(
          "#studentWorkspaceBackButton"
        );

      if (backButton){
        event.preventDefault();

        navigateStudentStudio(
          "overview"
        );

        return;
      }

      /*
        Submit work from top bar or router
      */

      const submitWorkButton =
        target.closest(
          "#studentSubmitWorkButton," +
          "#studentWorkspaceSubmitButton"
        );

      if (submitWorkButton){
        event.preventDefault();

        openDashboardAssignmentSubmission();

        return;
      }

      /*
        Sidebar and mobile navigation
      */

      const navigationButton =
        target.closest(
          "#studentSidebarNavigation [data-page]," +
          ".student-sidebar-footer [data-page]," +
          ".mobile-nav [data-page]"
        );

      if (navigationButton){
        event.preventDefault();

        navigateStudentStudio(
          navigationButton.dataset.page
        );
      }
    }
  );


    document.addEventListener(
    "keydown",
    event => {
      if (event.key !== "Escape"){
        return;
      }

      const openMenu =
        document.querySelector(
          "[data-class-menu-panel]:not([hidden])"
        );

      if (!openMenu){
        return;
      }

      const classId =
        openMenu.dataset
          .classMenuPanel;

      closeStudentClassMenus();

      document
        .querySelector(
          `[data-class-menu="${CSS.escape(
            classId
          )}"]`
        )
        ?.focus();
    }
  );

    document.addEventListener(
    "keydown",
    event => {
      const summaryCard =
        event.target instanceof Element
          ? event.target.closest(
              "[data-assignment-summary-filter]"
            )
          : null;

      if (!summaryCard){
        return;
      }

      if (
        event.key !== "Enter" &&
        event.key !== " "
      ){
        return;
      }

      event.preventDefault();

      setStudentAssignmentStatus(
        summaryCard.dataset
          .assignmentSummaryFilter
      );
    }
  );

    document.addEventListener(
    "keydown",
    event => {
      if (
        event.key !== "Escape" ||
        !openStudentAssignmentMenuId
      ){
        return;
      }

      event.preventDefault();

      closeStudentAssignmentMenus({
        render:true
      });
    }
  );
}

function openStudentClass(
  classId,
  lessonId = "",
  resume = false
){

  const normalizedClassId =
    normalizeId(classId);

  if(!normalizedClassId){
    showAlert?.(
      "error",
      "Unable to open class."
    );
    return;
  }

  const url =
    new URL(
      "class-view.html",
      window.location.href
    );

  url.searchParams.set(
    "classId",
    normalizedClassId
  );

  url.searchParams.set(
    "from",
    "student"
  );

  const normalizedLessonId =
    normalizeId(lessonId);

  if(normalizedLessonId){
    url.searchParams.set(
      "lessonId",
      normalizedLessonId
    );
  }

  url.searchParams.set("returnToStudent",activeStudentStudioPage === "continue" ? "continue" : "classes");
  if(resume)url.searchParams.set("resume","1");
  window.location.href =
    url.href;
}

/* =========================================================
   STUDENT CERTIFICATE WORKSPACE STATE
========================================================= */

const STUDENT_CERTIFICATE_VIEW_STORAGE_KEY =
  "aiftStudentCertificateView";


let studentCertificateView =
  localStorage.getItem(
    STUDENT_CERTIFICATE_VIEW_STORAGE_KEY
  ) === "list"
    ? "list"
    : "grid";


let studentCertificateControlsBound =
  false;
let studentCertificatePreviewCertificate =
  null;

/* =========================================================
   CERTIFICATE NORMALIZATION
========================================================= */

function normalizeStudentCertificateStatus(
  certificate
){

  const explicitStatus =
    String(
      certificate?.status ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    [
      "verified",
      "pending",
      "expired",
      "revoked"
    ].includes(
      explicitStatus
    )
  ){
    return explicitStatus;
  }


  if (
    certificate?.revoked === true ||
    certificate?.isRevoked === true
  ){
    return "revoked";
  }


  const expiryDate =
    certificate?.expiresAt ||
    certificate?.expiryDate ||
    null;


  if (
    expiryDate &&
    new Date(
      expiryDate
    ).getTime() <
      Date.now()
  ){
    return "expired";
  }


  if (
    certificate?.verified === true ||
    certificate?.isVerified === true ||
    certificate?.verificationCode ||
    certificate?.certificateNumber
  ){
    return "verified";
  }


  return "pending";

}


function normalizeStudentCertificate(
  certificate
){

  const classRecord =
    certificate?.classId &&
    typeof certificate.classId ===
      "object"
      ? certificate.classId
      : null;


  const schoolRecord =
    certificate?.schoolId &&
    typeof certificate.schoolId ===
      "object"
      ? certificate.schoolId
      : null;


  const programRecord =
    certificate?.programId &&
    typeof certificate.programId ===
      "object"
      ? certificate.programId
      : null;


  const issuedAt =
    certificate?.issuedAt ||
    certificate?.issueDate ||
    certificate?.completedAt ||
    certificate?.createdAt ||
    null;


  const status =
    normalizeStudentCertificateStatus(
      certificate
    );


  return {
    id:
      String(
        certificate?._id ||
        certificate?.id ||
        certificate?.certificateId ||
        ""
      ).trim(),

    title:
      String(
        certificate?.title ||
        certificate?.certificateTitle ||
        certificate?.courseName ||
        certificate?.programName ||
        classRecord?.title ||
        programRecord?.title ||
        "Certificate of Completion"
      ).trim(),

    description:
      String(
        certificate?.description ||
        certificate?.summary ||
        ""
      ).trim(),

    status,

    classId:
      normalizeId(
        classRecord?._id ||
        certificate?.classId
      ),

    className:
      String(
        classRecord?.title ||
        classRecord?.name ||
        certificate?.className ||
        certificate?.courseName ||
        "General program"
      ).trim(),

    programId:
      normalizeId(
        programRecord?._id ||
        certificate?.programId
      ),

    programName:
      String(
        programRecord?.title ||
        programRecord?.name ||
        certificate?.programName ||
        certificate?.courseName ||
        classRecord?.title ||
        "Learning program"
      ).trim(),

    schoolName:
      String(
        schoolRecord?.name ||
        certificate?.schoolName ||
        state.me?.schoolId?.name ||
        state.me?.linkedSchoolId?.name ||
        "AIFT Learning"
      ).trim(),

    studentName:
      String(
        certificate?.studentName ||
        certificate?.recipientName ||
        state.me?.name ||
        state.me?.fullName ||
        "Student"
      ).trim(),

    certificateNumber:
      String(
        certificate?.certificateNumber ||
        certificate?.verificationCode ||
        certificate?.credentialId ||
        ""
      ).trim(),

    verificationCode:
      String(
        certificate?.verificationCode ||
        certificate?.certificateNumber ||
        certificate?.credentialId ||
        ""
      ).trim(),

    issuedAt,

    completedAt:
      certificate?.completedAt ||
      certificate?.completionDate ||
      issuedAt,

    expiresAt:
      certificate?.expiresAt ||
      certificate?.expiryDate ||
      null,

    grade:
      String(
        certificate?.grade ||
        certificate?.finalGrade ||
        certificate?.score ||
        ""
      ).trim(),

    hours:
      Number(
        certificate?.hours ||
        certificate?.completedHours ||
        certificate?.creditHours ||
        0
      ),

    pdfUrl:
      String(
        certificate?.pdfUrl ||
        certificate?.certificateUrl ||
        certificate?.fileUrl ||
        certificate?.downloadUrl ||
        ""
      ).trim(),

    previewUrl:
      String(
        certificate?.previewUrl ||
        certificate?.imageUrl ||
        certificate?.thumbnailUrl ||
        certificate?.pdfUrl ||
        certificate?.certificateUrl ||
        ""
      ).trim(),

    skills:
      asArray(
        certificate?.skills
      )
        .map(skill =>
          typeof skill ===
            "string"
            ? skill
            : (
                skill?.name ||
                skill?.title ||
                ""
              )
        )
        .filter(Boolean),

    raw:
      certificate
  };

}


function getStudentCertificates(){

  return asArray(
    state.certificates
  )
    .map(
      normalizeStudentCertificate
    )
    .filter(certificate =>
      Boolean(
        certificate.id
      )
    );

}

/* =========================================================
   STUDENT CERTIFICATE PREVIEW CONTROLLER
========================================================= */

function getStudentCertificateStatusDescription(
  status
){

  switch(
    String(
      status ||
      ""
    ).toLowerCase()
  ){

    case "verified":

      return "This certificate is active and has been verified by the issuing institution.";

    case "expired":

      return "This certificate has passed its expiry date.";

    case "revoked":

      return "This certificate has been revoked by the issuing institution.";

    default:

      return "This certificate is awaiting final issue or verification.";

  }

}


function closeStudentCertificatePreview(){

  closeModal(
    "studentCertificatePreviewModal"
  );


  studentCertificatePreviewCertificate =
    null;

}

function openStudentCertificatePreview(
  certificateId
){

  const certificate =
    getStudentCertificates()
      .find(item =>
        sameId(
          item.id,
          certificateId
        )
      );


  if (!certificate){

    notifyAIFTWarning(
      "This certificate is no longer available.",
      {
        title:
          "Certificate unavailable"
      }
    );

    return;

  }


  studentCertificatePreviewCertificate =
    certificate;


  const status =
    String(
      certificate.status ||
      "pending"
    ).toLowerCase();


  const statusLabel =
    getStudentCertificateStatusLabel(
      status
    );


  const statusIcon =
    getStudentCertificateStatusIcon(
      status
    );


  const issuedDate =
    formatDate(
      certificate.issuedAt
    );


  const completedDate =
    formatDate(
      certificate.completedAt
    );


  const expiryDate =
    certificate.expiresAt
      ? formatDate(
          certificate.expiresAt
        )
      : "";


  /*
    Preview heading
  */

  setText(
    "studentCertificatePreviewTitle",
    certificate.title
  );


  setText(
    "studentCertificatePreviewDescription",
    `${
      certificate.programName
    } • ${
      certificate.schoolName
    }`
  );


  /*
    Certificate document
  */

  setText(
    "studentCertificateDocumentSchool",
    certificate.schoolName
  );


  setText(
    "studentCertificateDocumentTitle",
    certificate.title
  );


  setText(
    "studentCertificateDocumentStudent",
    certificate.studentName
  );


  setText(
    "studentCertificateDocumentProgram",
    certificate.programName
  );


  setText(
    "studentCertificateDocumentDescription",
    certificate.description ||
    "This credential recognizes successful completion of the learning requirements."
  );


  setText(
    "studentCertificateDocumentIssuedDate",
    issuedDate
  );


  setText(
    "studentCertificateDocumentNumber",
    certificate.certificateNumber ||
    "Not available"
  );


  setText(
    "studentCertificateDocumentStatus",
    statusLabel
  );


  const issuer =
    certificate.raw?.issuedBy &&
    typeof certificate.raw.issuedBy ===
      "object"
      ? (
          certificate.raw.issuedBy.name ||
          certificate.raw.issuedBy.fullName ||
          certificate.schoolName
        )
      : certificate.schoolName;


  setText(
    "studentCertificateDocumentIssuer",
    issuer ||
    "Authorized issuer"
  );


  /*
    Verification card
  */

  const verificationCard =
    $("studentCertificatePreviewVerification");

  const statusIconElement =
    $("studentCertificatePreviewStatusIcon");


  if (verificationCard){

    verificationCard.classList.remove(
      "verified",
      "pending",
      "expired",
      "revoked"
    );

    verificationCard.classList.add(
      status
    );

  }


  if (statusIconElement){

    statusIconElement.className =
      statusIcon;

  }


  setText(
    "studentCertificatePreviewStatus",
    statusLabel
  );


  setText(
    "studentCertificatePreviewStatusDescription",
    getStudentCertificateStatusDescription(
      status
    )
  );


  /*
    Sidebar details
  */

  setText(
    "studentCertificatePreviewStudent",
    certificate.studentName
  );


  setText(
    "studentCertificatePreviewProgram",
    certificate.programName
  );


  setText(
    "studentCertificatePreviewClass",
    certificate.className
  );


  setText(
    "studentCertificatePreviewSchool",
    certificate.schoolName
  );


  setText(
    "studentCertificatePreviewIssued",
    issuedDate
  );


  setText(
    "studentCertificatePreviewCompleted",
    completedDate
  );


  setText(
    "studentCertificatePreviewNumber",
    certificate.certificateNumber ||
    "Not available"
  );


  setText(
    "studentCertificatePreviewCode",
    certificate.verificationCode ||
    "Not available"
  );


  /*
    Optional expiry
  */

  const expiryRow =
    $("studentCertificatePreviewExpiryRow");


  if (expiryRow){

    expiryRow.hidden =
      !certificate.expiresAt;

  }


  if (certificate.expiresAt){

    setText(
      "studentCertificatePreviewExpiry",
      expiryDate
    );

  }


  /*
    Optional grade
  */

  const gradeRow =
    $("studentCertificatePreviewGradeRow");


  if (gradeRow){

    gradeRow.hidden =
      !certificate.grade;

  }


  if (certificate.grade){

    setText(
      "studentCertificatePreviewGrade",
      certificate.grade
    );

  }


  /*
    Optional completed hours
  */

  const hoursRow =
    $("studentCertificatePreviewHoursRow");


  if (hoursRow){

    hoursRow.hidden =
      !certificate.hours;

  }


  if (certificate.hours){

    setText(
      "studentCertificatePreviewHours",
      `${
        certificate.hours
      } ${
        certificate.hours === 1
          ? "hour"
          : "hours"
      }`
    );

  }


  /*
    Skills
  */

  const skillsPanel =
    $("studentCertificatePreviewSkillsPanel");

  const skillsWrap =
    $("studentCertificatePreviewSkills");


  if (skillsWrap){

    skillsWrap.innerHTML =
      certificate.skills
        .map(skill => `
          <span>
            ${
              escapeHtml(
                skill
              )
            }
          </span>
        `)
        .join("");

  }


  if (skillsPanel){

    skillsPanel.hidden =
      !certificate.skills.length;

  }


  /*
    File actions
  */

  const downloadButton =
    $("studentCertificatePreviewDownloadButton");

  const openFileButton =
    $("studentCertificatePreviewOpenFileButton");


  if (downloadButton){

    downloadButton.disabled =
      !certificate.pdfUrl;

  }


  if (openFileButton){

    openFileButton.hidden =
      !certificate.pdfUrl;

  }


  /*
    Verification actions
  */

  const verifyButton =
    $("studentCertificatePreviewVerifyButton");

  const copyCodeButton =
    $("studentCertificatePreviewCopyCodeButton");


  if (verifyButton){

    verifyButton.disabled =
      !certificate.verificationCode;

  }


  if (copyCodeButton){

    copyCodeButton.disabled =
      !certificate.verificationCode;

  }


  openModal(
    "studentCertificatePreviewModal"
  );

}

/* =========================================================
   CERTIFICATE DISPLAY HELPERS
========================================================= */

function getStudentCertificateStatusLabel(
  status
){

  switch(
    String(
      status ||
      ""
    ).toLowerCase()
  ){

    case "verified":
      return "Verified";

    case "expired":
      return "Expired";

    case "revoked":
      return "Revoked";

    default:
      return "Pending";

  }

}


function getStudentCertificateStatusIcon(
  status
){

  switch(
    String(
      status ||
      ""
    ).toLowerCase()
  ){

    case "verified":
      return "fa-solid fa-circle-check";

    case "expired":
      return "fa-solid fa-calendar-xmark";

    case "revoked":
      return "fa-solid fa-circle-xmark";

    default:
      return "fa-solid fa-clock";

  }

}


function getStudentCertificateIssueTime(
  certificate
){

  const date =
    new Date(
      certificate?.issuedAt ||
      certificate?.completedAt ||
      0
    );


  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime();

}
/* =========================================================
   HYDRATE CERTIFICATE CLASS FILTER
========================================================= */

function hydrateStudentCertificateClassFilter(){

  const select =
    $("studentCertificateClassFilter");


  if (!select){
    return;
  }


  const previousValue =
    String(
      select.value ||
      ""
    );


  const classes =
    new Map();


  getStudentCertificates()
    .forEach(certificate => {

      if (
        !certificate.classId ||
        !certificate.className
      ){
        return;
      }


      classes.set(
        certificate.classId,
        certificate.className
      );

    });


  select.innerHTML = `
    <option value="">
      All classes
    </option>

    ${
      Array.from(
        classes.entries()
      )
        .sort((a,b) =>
          a[1].localeCompare(
            b[1]
          )
        )
        .map(
          ([classId,className]) => `
            <option
              value="${
                escapeHtml(
                  classId
                )
              }"
            >
              ${
                escapeHtml(
                  className
                )
              }
            </option>
          `
        )
        .join("")
    }
  `;


  if (
    Array.from(
      select.options
    )
      .some(option =>
        option.value ===
        previousValue
      )
  ){

    select.value =
      previousValue;

  }

}

function renderStudentCertificates(){

  const loadingState =
    $("studentCertificatesLoadingState");

  const errorState =
    $("studentCertificatesErrorState");

  const emptyState =
    $("studentCertificatesEmptyState");

  const grid =
    $("studentCertificateGrid");


  if (!grid){
    return;
  }


  bindStudentCertificateControls();

  hydrateStudentCertificateClassFilter();


  const certificates =
    getStudentCertificates();


  if (loadingState){
    loadingState.hidden =
      true;
  }


  if (errorState){
    errorState.hidden =
      true;
  }


  const searchValue =
    String(
      $("studentCertificateSearchInput")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const statusFilter =
    String(
      $("studentCertificateStatusFilter")
        ?.value ||
      "all"
    )
      .trim()
      .toLowerCase();


  const classFilter =
    String(
      $("studentCertificateClassFilter")
        ?.value ||
      ""
    ).trim();


  const sortValue =
    String(
      $("studentCertificateSortFilter")
        ?.value ||
      "newest"
    )
      .trim()
      .toLowerCase();


  let filteredCertificates =
    certificates.filter(
      certificate => {

        const searchableText =
          [
            certificate.title,
            certificate.description,
            certificate.className,
            certificate.programName,
            certificate.schoolName,
            certificate.certificateNumber,
            certificate.verificationCode,
            certificate.grade,
            ...certificate.skills
          ]
            .join(" ")
            .toLowerCase();


        const matchesSearch =
          !searchValue ||
          searchableText.includes(
            searchValue
          );


        const matchesStatus =
          statusFilter === "all" ||
          certificate.status ===
            statusFilter;


        const matchesClass =
          !classFilter ||
          sameId(
            certificate.classId,
            classFilter
          );


        return (
          matchesSearch &&
          matchesStatus &&
          matchesClass
        );

      }
    );


  filteredCertificates.sort(
    (a,b) => {

      if (
        sortValue ===
        "oldest"
      ){

        return (
          getStudentCertificateIssueTime(a) -
          getStudentCertificateIssueTime(b)
        );

      }


      if (
        sortValue ===
        "title-asc"
      ){

        return a.title.localeCompare(
          b.title
        );

      }


      if (
        sortValue ===
        "title-desc"
      ){

        return b.title.localeCompare(
          a.title
        );

      }


      return (
        getStudentCertificateIssueTime(b) -
        getStudentCertificateIssueTime(a)
      );

    }
  );


  const verifiedCount =
    certificates.filter(
      certificate =>
        certificate.status ===
        "verified"
    ).length;


  const pendingCount =
    certificates.filter(
      certificate =>
        certificate.status ===
        "pending"
    ).length;


  const programIds =
    new Set(
      certificates
        .map(certificate =>
          certificate.programId ||
          certificate.classId ||
          certificate.programName
        )
        .filter(Boolean)
    );


  setText(
    "studentCertificateTotalCount",
    certificates.length
  );


  setText(
    "studentCertificateVerifiedCount",
    verifiedCount
  );


  setText(
    "studentCertificatePendingCount",
    pendingCount
  );


  setText(
    "studentCertificateProgramCount",
    programIds.size
  );


  setText(
    "certificateBadge",
    certificates.length
  );


  const hasFilters =
    Boolean(
      searchValue ||
      statusFilter !== "all" ||
      classFilter
    );


  const filterStatus =
    $("studentCertificateFilterStatus");

  const filterStatusText =
    $("studentCertificateFilterStatusText");


  if (filterStatus){

    filterStatus.hidden =
      !hasFilters;

  }


  if (filterStatusText){

    filterStatusText.textContent =
      `${
        filteredCertificates.length
      } ${
        filteredCertificates.length === 1
          ? "certificate"
          : "certificates"
      } match the current filters`;

  }


  grid.classList.toggle(
    "list-view",
    studentCertificateView ===
      "list"
  );


  if (
    !filteredCertificates.length
  ){

    grid.hidden =
      true;

    grid.innerHTML =
      "";


    if (emptyState){

      emptyState.hidden =
        false;

    }


    setText(
      "studentCertificatesEmptyTitle",
      hasFilters
        ? "No matching certificates"
        : "No certificates yet"
    );


    setText(
      "studentCertificatesEmptyDescription",
      hasFilters
        ? "Try changing your search or certificate filters."
        : "Certificates earned through completed classes and programs will appear here."
    );


    return;

  }


  if (emptyState){
    emptyState.hidden =
      true;
  }


  grid.hidden =
    false;


  grid.innerHTML =
    filteredCertificates
      .map(certificate => {

        const issueDate =
          formatDate(
            certificate.issuedAt
          );


        const statusLabel =
          getStudentCertificateStatusLabel(
            certificate.status
          );


        const statusIcon =
          getStudentCertificateStatusIcon(
            certificate.status
          );


        return `
          <article
            class="
              student-certificate-card
              status-${
                escapeHtml(
                  certificate.status
                )
              }
            "
            data-certificate-id="${
              escapeHtml(
                certificate.id
              )
            }"
          >

            <div class="student-certificate-card-banner">

              <span class="student-certificate-card-seal">

                <i
                  class="fa-solid fa-award"
                  aria-hidden="true"
                ></i>

              </span>


              <span
                class="
                  student-certificate-status
                  ${
                    escapeHtml(
                      certificate.status
                    )
                  }
                "
              >

                <i
                  class="${
                    escapeHtml(
                      statusIcon
                    )
                  }"
                  aria-hidden="true"
                ></i>

                ${
                  escapeHtml(
                    statusLabel
                  )
                }

              </span>

            </div>


            <div class="student-certificate-card-body">

              <span class="student-certificate-card-eyebrow">
                ${
                  escapeHtml(
                    certificate.programName
                  )
                }
              </span>


              <h3 class="student-certificate-card-title">
                ${
                  escapeHtml(
                    certificate.title
                  )
                }
              </h3>


              <p class="student-certificate-card-school">

                <i
                  class="fa-solid fa-building-columns"
                  aria-hidden="true"
                ></i>

                ${
                  escapeHtml(
                    certificate.schoolName
                  )
                }

              </p>


              <div class="student-certificate-card-meta">

                <span>

                  <i
                    class="fa-regular fa-calendar"
                    aria-hidden="true"
                  ></i>

                  Issued ${
                    escapeHtml(
                      issueDate
                    )
                  }

                </span>


                <span>

                  <i
                    class="fa-solid fa-book-open"
                    aria-hidden="true"
                  ></i>

                  ${
                    escapeHtml(
                      certificate.className
                    )
                  }

                </span>


                ${
                  certificate.certificateNumber
                    ? `
                      <span>

                        <i
                          class="fa-solid fa-fingerprint"
                          aria-hidden="true"
                        ></i>

                        ${
                          escapeHtml(
                            certificate.certificateNumber
                          )
                        }

                      </span>
                    `
                    : ""
                }

              </div>


              <div class="student-certificate-card-actions">

                <button
                  class="primary-btn"
                  type="button"
                  data-preview-student-certificate="${
                    escapeHtml(
                      certificate.id
                    )
                  }"
                >
                  <i
                    class="fa-regular fa-eye"
                    aria-hidden="true"
                  ></i>

                  View
                </button>


                <button
                  class="ghost-btn"
                  type="button"
                  data-download-student-certificate="${
                    escapeHtml(
                      certificate.id
                    )
                  }"
                  ${
                    certificate.pdfUrl
                      ? ""
                      : "disabled"
                  }
                >
                  <i
                    class="fa-solid fa-download"
                    aria-hidden="true"
                  ></i>

                  Download
                </button>

              </div>

            </div>

          </article>
        `;

      })
      .join("");

}

function setStudentCertificateView(
  view
){

  studentCertificateView =
    view === "list"
      ? "list"
      : "grid";


  localStorage.setItem(
    STUDENT_CERTIFICATE_VIEW_STORAGE_KEY,
    studentCertificateView
  );


  const gridButton =
    $("studentCertificateGridViewButton");

  const listButton =
    $("studentCertificateListViewButton");


  gridButton?.classList.toggle(
    "active",
    studentCertificateView ===
      "grid"
  );


  listButton?.classList.toggle(
    "active",
    studentCertificateView ===
      "list"
  );


  gridButton?.setAttribute(
    "aria-pressed",
    String(
      studentCertificateView ===
        "grid"
    )
  );


  listButton?.setAttribute(
    "aria-pressed",
    String(
      studentCertificateView ===
        "list"
    )
  );


  renderStudentCertificates();

}

function resetStudentCertificateFilters(){

  const searchInput =
    $("studentCertificateSearchInput");

  const statusFilter =
    $("studentCertificateStatusFilter");

  const classFilter =
    $("studentCertificateClassFilter");

  const sortFilter =
    $("studentCertificateSortFilter");

  const clearButton =
    $("clearStudentCertificateSearchButton");


  if (searchInput){
    searchInput.value =
      "";
  }


  if (statusFilter){
    statusFilter.value =
      "all";
  }


  if (classFilter){
    classFilter.value =
      "";
  }


  if (sortFilter){
    sortFilter.value =
      "newest";
  }


  if (clearButton){
    clearButton.hidden =
      true;
  }


  renderStudentCertificates();

}

function bindStudentCertificateControls(){

  if (
    studentCertificateControlsBound
  ){
    return;
  }


  const section =
    $("section-certificates");

  const searchInput =
    $("studentCertificateSearchInput");

  const clearButton =
    $("clearStudentCertificateSearchButton");

  const statusFilter =
    $("studentCertificateStatusFilter");

  const classFilter =
    $("studentCertificateClassFilter");

  const sortFilter =
    $("studentCertificateSortFilter");


  if (
    !section ||
    !searchInput
  ){
    return;
  }


  let searchTimer =
    null;


  searchInput.addEventListener(
    "input",
    () => {

      window.clearTimeout(
        searchTimer
      );


      if (clearButton){

        clearButton.hidden =
          !searchInput.value.trim();

      }


      searchTimer =
        window.setTimeout(
          renderStudentCertificates,
          150
        );

    }
  );


  clearButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      searchInput.value =
        "";

      clearButton.hidden =
        true;

      searchInput.focus();

      renderStudentCertificates();

    }
  );


  [
    statusFilter,
    classFilter,
    sortFilter
  ].forEach(control => {

    control?.addEventListener(
      "change",
      renderStudentCertificates
    );

  });


  $("studentCertificateGridViewButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        setStudentCertificateView(
          "grid"
        );

      }
    );


  $("studentCertificateListViewButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        setStudentCertificateView(
          "list"
        );

      }
    );


  $("resetStudentCertificateFiltersButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        resetStudentCertificateFilters();

      }
    );


  section.addEventListener(
    "click",
    event => {

      const downloadButton =
        event.target.closest(
          "[data-download-student-certificate]"
        );


      if (downloadButton){

        event.preventDefault();


        const certificate =
          getStudentCertificates()
            .find(item =>
              sameId(
                item.id,
                downloadButton.dataset
                  .downloadStudentCertificate
              )
            );


        if (!certificate?.pdfUrl){
          return;
        }


        window.open(
          certificate.pdfUrl,
          "_blank",
          "noopener,noreferrer"
        );

        return;

      }


      const previewButton =
        event.target.closest(
          "[data-preview-student-certificate]"
        );


      if (previewButton){

        event.preventDefault();


        openStudentCertificatePreview(
          previewButton.dataset
            .previewStudentCertificate
        );


        return;

      }

    }
  );

    $("refreshStudentCertificatesButton")
    ?.addEventListener(
      "click",
      async event => {

        event.preventDefault();

        const button =
          $("refreshStudentCertificatesButton");

        const loadingState =
          $("studentCertificatesLoadingState");

        const errorState =
          $("studentCertificatesErrorState");

        const emptyState =
          $("studentCertificatesEmptyState");

        const grid =
          $("studentCertificateGrid");


        setDashboardButtonLoading(
          button,
          true,
          "Refreshing..."
        );


        if (loadingState){
          loadingState.hidden =
            false;
        }

        if (errorState){
          errorState.hidden =
            true;
        }

        if (emptyState){
          emptyState.hidden =
            true;
        }

        if (grid){
          grid.hidden =
            true;
        }


        try{

          const response =
            await apiGet(
              "/api/certificates/my",
              null
            );


          if (!response){

            throw new Error(
              "The certificate server returned no response."
            );

          }


          state.certificates =
            asArray(
              response
            );


          renderStudentCertificates();


          notifyAIFTSuccess(
            "Your certificates are up to date.",
            {
              title:
                "Certificates refreshed"
            }
          );

        }catch(error){

          console.error(
            "Student certificate refresh failed:",
            error
          );


          if (loadingState){
            loadingState.hidden =
              true;
          }

          if (emptyState){
            emptyState.hidden =
              true;
          }

          if (grid){
            grid.hidden =
              true;
          }

          if (errorState){
            errorState.hidden =
              false;
          }


          setText(
            "studentCertificatesErrorMessage",
            error?.message ||
            "AIFT could not retrieve your certificates."
          );


          notifyAIFTError(
            error?.message ||
            "AIFT could not refresh your certificates.",
            {
              title:
                "Certificate refresh failed"
            }
          );

        }finally{

          setDashboardButtonLoading(
            button,
            false
          );

        }

      }
    );
    $("retryStudentCertificatesButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        $("refreshStudentCertificatesButton")
          ?.click();

      }
    );

    $("closeStudentCertificatePreviewButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        closeStudentCertificatePreview();

      }
    );


  $("studentCertificatePreviewModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("studentCertificatePreviewModal")
        ){

          closeStudentCertificatePreview();

        }

      }
    );

    const openStudentCertificateFile =
    () => {

      const certificate =
        studentCertificatePreviewCertificate;


      if (!certificate?.pdfUrl){

        notifyAIFTWarning(
          "This certificate does not have a downloadable file yet.",
          {
            title:
              "File unavailable"
          }
        );

        return;

      }


      window.open(
        certificate.pdfUrl,
        "_blank",
        "noopener,noreferrer"
      );

    };


  $("studentCertificatePreviewDownloadButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openStudentCertificateFile();

      }
    );


  $("studentCertificatePreviewOpenFileButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openStudentCertificateFile();

      }
    );
    $("studentCertificatePreviewCopyCodeButton")
    ?.addEventListener(
      "click",
      async event => {

        event.preventDefault();


        const certificate =
          studentCertificatePreviewCertificate;


        if (
          !certificate?.verificationCode
        ){
          return;
        }


        try{

          await navigator.clipboard.writeText(
            certificate.verificationCode
          );


          notifyAIFTSuccess(
            "The verification code was copied.",
            {
              title:
                "Code copied"
            }
          );

        }catch(error){

          console.error(
            "Certificate verification code copy failed:",
            error
          );


          notifyAIFTError(
            "AIFT could not copy the verification code.",
            {
              title:
                "Copy failed"
            }
          );

        }

      }
    );
    $("studentCertificatePreviewVerifyButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();


        const certificate =
          studentCertificatePreviewCertificate;


        if (
          !certificate?.verificationCode
        ){
          return;
        }


        window.open(
          `${
            API
          }/api/certificates/verify/${
            encodeURIComponent(
              certificate.verificationCode
            )
          }`,
          "_blank",
          "noopener,noreferrer"
        );

      }
    );
    $("studentCertificatePreviewShareButton")
    ?.addEventListener(
      "click",
      async event => {

        event.preventDefault();


        const certificate =
          studentCertificatePreviewCertificate;


        if (!certificate){
          return;
        }


        const verificationUrl =
          certificate.verificationCode
            ? `${
                API
              }/api/certificates/verify/${
                encodeURIComponent(
                  certificate.verificationCode
                )
              }`
            : certificate.pdfUrl;


        if (!verificationUrl){

          notifyAIFTWarning(
            "This certificate does not have a shareable link yet.",
            {
              title:
                "Sharing unavailable"
            }
          );

          return;

        }


        const shareData = {
          title:
            certificate.title,

          text:
            `${
              certificate.studentName
            } earned ${
              certificate.title
            } from ${
              certificate.schoolName
            }.`,

          url:
            verificationUrl
        };


        try{

          if (
            typeof navigator.share ===
            "function"
          ){

            await navigator.share(
              shareData
            );

            return;

          }


          await navigator.clipboard.writeText(
            verificationUrl
          );


          notifyAIFTSuccess(
            "The certificate verification link was copied.",
            {
              title:
                "Share link copied"
            }
          );

        }catch(error){

          if (
            error?.name ===
            "AbortError"
          ){
            return;
          }


          console.error(
            "Certificate sharing failed:",
            error
          );


          notifyAIFTError(
            "AIFT could not share this certificate.",
            {
              title:
                "Sharing failed"
            }
          );

        }

      }
    );

    document.addEventListener(
    "keydown",
    event => {

      const modal =
        $("studentCertificatePreviewModal");


      if (
        event.key !== "Escape" ||
        !modal?.classList.contains(
          "show"
        )
      ){
        return;
      }


      event.preventDefault();

      closeStudentCertificatePreview();

    }
  );
  
  studentCertificateControlsBound =
    true;

}

/* =========================================================
   STUDENT PORTFOLIO
========================================================= */

const STUDENT_PORTFOLIO_STORAGE_KEY =
  "aiftStudentPortfolio";


let studentPortfolioControlsBound =
  false;
let studentPortfolioEditorSkills =
  [];

let studentPortfolioEditorLanguages =
  [];

let studentPortfolioEditorOpened =
  false;
let studentProjectEditorOpen =
  false;

let studentProjectEditingId =
  null;
let studentPortfolioExperienceEditingId =
  null;

let studentProjectCoverData =
  "";

let studentProjectFileData =
  "";
let studentPortfolioResumeData =
  "";

let studentPortfolioResumeName =
  "";

let studentPortfolioResumeType =
  "";

function renderStudentPortfolioEditorTags(
  type
){

  const normalizedType =
    type === "languages"
      ? "languages"
      : "skills";


  const values =
    normalizedType === "languages"
      ? studentPortfolioEditorLanguages
      : studentPortfolioEditorSkills;


  const list =
    normalizedType === "languages"
      ? $("studentPortfolioLanguageEditorList")
      : $("studentPortfolioSkillEditorList");


  if (!list){
    return;
  }


  if (!values.length){

    list.innerHTML = `
      <div class="student-portfolio-editor-tag-empty">

        <i
          class="${
            normalizedType === "languages"
              ? "fa-solid fa-language"
              : "fa-solid fa-wand-magic-sparkles"
          }"
          aria-hidden="true"
        ></i>

        <span>
          ${
            normalizedType === "languages"
              ? "No languages have been added yet."
              : "No skills have been added yet."
          }
        </span>

      </div>
    `;

    return;

  }


  list.innerHTML =
    values
      .map(
        (value,index) => `
          <span class="student-portfolio-editor-tag">

            ${
              escapeHtml(
                value
              )
            }

            <button
              type="button"
              data-remove-portfolio-tag="${
                normalizedType
              }"
              data-portfolio-tag-index="${
                index
              }"
              aria-label="Remove ${
                escapeHtml(
                  value
                )
              }"
            >
              <i
                class="fa-solid fa-xmark"
                aria-hidden="true"
              ></i>
            </button>

          </span>
        `
      )
      .join("");

}
function addStudentPortfolioEditorTag(
  type,
  rawValue
){

  const normalizedType =
    type === "languages"
      ? "languages"
      : "skills";


  const value =
    String(
      rawValue ||
      ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );


  if (!value){
    return false;
  }


  const collection =
    normalizedType === "languages"
      ? studentPortfolioEditorLanguages
      : studentPortfolioEditorSkills;


  const maximum =
    normalizedType === "languages"
      ? 10
      : 20;


  if (
    collection.length >=
    maximum
  ){

    notifyAIFTWarning(
      normalizedType === "languages"
        ? "You can add up to 10 languages."
        : "You can add up to 20 skills.",
      {
        title:
          "Maximum reached"
      }
    );

    return false;

  }


  const alreadyExists =
    collection.some(
      item =>
        item.toLowerCase() ===
        value.toLowerCase()
    );


  if (alreadyExists){

    notifyAIFTInfo(
      `${
        value
      } is already included.`,
      {
        title:
          normalizedType === "languages"
            ? "Language already added"
            : "Skill already added"
      }
    );

    return false;

  }


  collection.push(
    value
  );


  renderStudentPortfolioEditorTags(
    normalizedType
  );


  return true;

}


function removeStudentPortfolioEditorTag(
  type,
  index
){

  const normalizedType =
    type === "languages"
      ? "languages"
      : "skills";


  const collection =
    normalizedType === "languages"
      ? studentPortfolioEditorLanguages
      : studentPortfolioEditorSkills;


  const normalizedIndex =
    Number(
      index
    );


  if (
    !Number.isInteger(
      normalizedIndex
    ) ||
    normalizedIndex < 0 ||
    normalizedIndex >=
      collection.length
  ){
    return;
  }


  collection.splice(
    normalizedIndex,
    1
  );


  renderStudentPortfolioEditorTags(
    normalizedType
  );

}

function updateStudentPortfolioAboutCharacterCount(){

  const input =
    $("studentPortfolioAboutInput");

  const counter =
    $("studentPortfolioAboutCharacterCount");


  if (
    !input ||
    !counter
  ){
    return;
  }


  counter.textContent =
    `${
      input.value.length
    } / 2000`;

}

function openStudentPortfolioProfileEditor(){

  const portfolio =
    getStudentPortfolio();


  studentPortfolioEditorSkills =
    [
      ...portfolio.skills
    ];


  studentPortfolioEditorLanguages =
    [
      ...portfolio.languages
    ];


  const storedPortfolio =
    getStudentPortfolioStoredData();


  const headlineInput =
    $("studentPortfolioHeadlineInput");

  const aboutInput =
    $("studentPortfolioAboutInput");

  const careerInterestInput =
    $("studentPortfolioCareerInterestInput");

  const opportunitySelect =
    $("studentPortfolioOpportunityTypeSelect");


  if (headlineInput){

    headlineInput.value =
      portfolio.headline ||
      "";

  }


  if (aboutInput){

    aboutInput.value =
      portfolio.about ||
      "";

  }


  if (careerInterestInput){

    careerInterestInput.value =
      String(
        state.portfolio?.careerInterest ||
        storedPortfolio.careerInterest ||
        ""
      );

  }


  if (opportunitySelect){

    opportunitySelect.value =
      String(
        state.portfolio?.opportunityType ||
        storedPortfolio.opportunityType ||
        ""
      );

  }


  renderStudentPortfolioEditorTags(
    "skills"
  );


  renderStudentPortfolioEditorTags(
    "languages"
  );


  updateStudentPortfolioAboutCharacterCount();


  setText(
    "studentPortfolioProfileFormStatus",
    "Changes are saved only after selecting Save profile."
  );


  studentPortfolioEditorOpened =
    true;


  openModal(
    "studentPortfolioProfileModal"
  );


  window.setTimeout(
    () => {

      headlineInput?.focus();

    },
    80
  );

}

function closeStudentPortfolioProfileEditor(){

  closeModal(
    "studentPortfolioProfileModal"
  );


  studentPortfolioEditorOpened =
    false;


  studentPortfolioEditorSkills =
    [];

  studentPortfolioEditorLanguages =
    [];

}

async function saveStudentPortfolioProfile(){

  const headline =
    String(
      $("studentPortfolioHeadlineInput")
        ?.value ||
      ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );


  const about =
    String(
      $("studentPortfolioAboutInput")
        ?.value ||
      ""
    ).trim();


  const careerInterest =
    String(
      $("studentPortfolioCareerInterestInput")
        ?.value ||
      ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );


  const opportunityType =
    String(
      $("studentPortfolioOpportunityTypeSelect")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    headline.length >
    160
  ){

    notifyAIFTWarning(
      "The professional headline cannot exceed 160 characters.",
      {
        title:
          "Headline is too long"
      }
    );

    $("studentPortfolioHeadlineInput")
      ?.focus();

    return false;

  }


  if (
    about.length >
    2000
  ){

    notifyAIFTWarning(
      "The About Me section cannot exceed 2,000 characters.",
      {
        title:
          "Introduction is too long"
      }
    );

    $("studentPortfolioAboutInput")
      ?.focus();

    return false;

  }


  const currentPortfolio =
    getStudentPortfolio();


  state.portfolio = {
    ...currentPortfolio,

    headline,

    about,

    careerInterest,

    opportunityType,

    skills:[
      ...studentPortfolioEditorSkills
    ],

    languages:[
      ...studentPortfolioEditorLanguages
    ]
  };


  /*
    Keep an immediate local backup before syncing.
  */

  saveStudentPortfolioStoredData(
    state.portfolio
  );


  const saveButton =
    $("saveStudentPortfolioProfileButton");


  setDashboardButtonLoading(
    saveButton,
    true,
    "Saving..."
  );


  try{

    await saveStudentPortfolioCoreToServer(
      state.portfolio
    );


    renderStudentPortfolio();


    closeStudentPortfolioProfileEditor();


    notifyAIFTSuccess(
      "Your portfolio introduction was saved to AIFT.",
      {
        title:
          "Portfolio saved"
      }
    );


    return true;

  }catch(error){

    console.error(
      "Student portfolio server save failed:",
      error
    );


    /*
      The local backup remains intact so the student's
      work is not lost.
    */

    renderStudentPortfolio();


    notifyAIFTError(
      error?.message ||
      "Your portfolio could not be synced with AIFT.",
      {
        title:
          "Portfolio sync failed"
      }
    );


    return false;

  }finally{

    setDashboardButtonLoading(
      saveButton,
      false
    );

  }

}
const STUDENT_PROJECT_STORAGE_KEY =
  "aiftStudentPortfolioProjects";

/* =========================================================
   STUDENT PORTFOLIO API
========================================================= */

function normalizeStudentPortfolioApiRecord(
  rawPortfolio
){

  const portfolio =
    rawPortfolio?.portfolio ||
    rawPortfolio ||
    {};


  const resume =
    portfolio.resume &&
    typeof portfolio.resume ===
      "object"
      ? portfolio.resume
      : {};


  return {
    _id:
      String(
        portfolio._id ||
        ""
      ),

    studentId:
      portfolio.studentId ||
      null,

    schoolId:
      portfolio.schoolId ||
      null,

    visibility:
      [
        "private",
        "school",
        "public"
      ].includes(
        String(
          portfolio.visibility ||
          ""
        ).toLowerCase()
      )
        ? String(
            portfolio.visibility
          ).toLowerCase()
        : "private",

    headline:
      String(
        portfolio.headline ||
        ""
      ).trim(),

    about:
      String(
        portfolio.about ||
        ""
      ).trim(),

    careerInterest:
      String(
        portfolio.careerInterest ||
        ""
      ).trim(),

    opportunityType:
      String(
        portfolio.opportunityType ||
        ""
      )
        .trim()
        .toLowerCase(),

    skills:
      asArray(
        portfolio.skills
      )
        .map(value =>
          String(
            value ||
            ""
          ).trim()
        )
        .filter(Boolean),

    languages:
      asArray(
        portfolio.languages
      )
        .map(value =>
          String(
            value ||
            ""
          ).trim()
        )
        .filter(Boolean),

    projects:
      asArray(
        portfolio.projects
      ),

    experience:
      asArray(
        portfolio.experience
      ),

    featuredCertificateIds:
      asArray(
        portfolio.featuredCertificateIds
      )
        .map(item =>
          String(
            item?._id ||
            item ||
            ""
          )
        )
        .filter(Boolean),

    resumeUrl:
      String(
        resume.url ||
        portfolio.resumeUrl ||
        ""
      ).trim(),

    resumeFileName:
      String(
        resume.fileName ||
        portfolio.resumeFileName ||
        ""
      ).trim(),

    resumeMimeType:
      String(
        resume.mimeType ||
        portfolio.resumeMimeType ||
        ""
      ).trim(),

    publicSlug:
      String(
        portfolio.publicSlug ||
        ""
      ).trim(),

    views:
      Number(
        portfolio.viewsCount ??
        portfolio.views ??
        0
      ) || 0,

    createdAt:
      portfolio.createdAt ||
      null,

    updatedAt:
      portfolio.updatedAt ||
      null
  };

}
function buildStudentPortfolioCorePayload(
  portfolio
){

  const source =
    portfolio &&
    typeof portfolio ===
      "object"
      ? portfolio
      : getStudentPortfolio();


  return {
    visibility:
      [
        "private",
        "school",
        "public"
      ].includes(
        source.visibility
      )
        ? source.visibility
        : "private",

    headline:
      String(
        source.headline ||
        ""
      )
        .trim()
        .slice(
          0,
          160
        ),

    about:
      String(
        source.about ||
        ""
      )
        .trim()
        .slice(
          0,
          2000
        ),

    careerInterest:
      String(
        source.careerInterest ||
        ""
      )
        .trim()
        .slice(
          0,
          160
        ),

    opportunityType:
      String(
        source.opportunityType ||
        ""
      )
        .trim()
        .toLowerCase(),

    skills:
      asArray(
        source.skills
      )
        .map(value =>
          String(
            value ||
            ""
          ).trim()
        )
        .filter(Boolean)
        .slice(
          0,
          20
        ),

    languages:
      asArray(
        source.languages
      )
        .map(value =>
          String(
            value ||
            ""
          ).trim()
        )
        .filter(Boolean)
        .slice(
          0,
          10
        )
  };

}
async function saveStudentPortfolioCoreToServer(
  portfolio
){

  const payload =
    buildStudentPortfolioCorePayload(
      portfolio
    );


  const response =
    await apiSend(
      "/api/student-portfolio/me",
      "PATCH",
      payload
    );


  const savedPortfolio =
    normalizeStudentPortfolioApiRecord(
      response
    );


  /*
    Preserve frontend-only values that are not yet
    handled by the core PATCH endpoint.
  */

  state.portfolio = {
    ...getStudentPortfolio(),
    ...savedPortfolio,

    projects:
      savedPortfolio.projects?.length
        ? savedPortfolio.projects
        : getStudentPortfolio().projects,

    experience:
      savedPortfolio.experience?.length
        ? savedPortfolio.experience
        : getStudentPortfolio().experience,

    resumeUrl:
      savedPortfolio.resumeUrl ||
      getStudentPortfolio().resumeUrl,

    resumeFileName:
      savedPortfolio.resumeFileName ||
      state.portfolio?.resumeFileName ||
      "",

    resumeMimeType:
      savedPortfolio.resumeMimeType ||
      state.portfolio?.resumeMimeType ||
      ""
  };


  saveStudentPortfolioStoredData(
    state.portfolio
  );


  return state.portfolio;

}
function hasStudentPortfolioLocalCoreData(
  portfolio
){

  if (
    !portfolio ||
    typeof portfolio !==
      "object"
  ){
    return false;
  }


  return Boolean(
    String(
      portfolio.headline ||
      ""
    ).trim() ||

    String(
      portfolio.about ||
      ""
    ).trim() ||

    String(
      portfolio.careerInterest ||
      ""
    ).trim() ||

    asArray(
      portfolio.skills
    ).length ||

    asArray(
      portfolio.languages
    ).length ||

    (
      portfolio.visibility &&
      portfolio.visibility !==
        "private"
    )
  );

}


function isStudentPortfolioServerCoreEmpty(
  portfolio
){

  if (
    !portfolio ||
    typeof portfolio !==
      "object"
  ){
    return true;
  }


  return !(
    String(
      portfolio.headline ||
      ""
    ).trim() ||

    String(
      portfolio.about ||
      ""
    ).trim() ||

    String(
      portfolio.careerInterest ||
      ""
    ).trim() ||

    asArray(
      portfolio.skills
    ).length ||

    asArray(
      portfolio.languages
    ).length ||

    (
      portfolio.visibility &&
      portfolio.visibility !==
        "private"
    )
  );

}
async function loadStudentPortfolioFromServer(){

  const localPortfolio =
    getStudentPortfolioStoredData();


  const response =
    await apiGet(
      "/api/student-portfolio/me",
      null
    );


  if (!response){

    /*
      Backend unavailable:
      keep using the local Portfolio.
    */

    if (
      hasStudentPortfolioLocalCoreData(
        localPortfolio
      )
    ){

      state.portfolio = {
        ...state.portfolio,
        ...localPortfolio
      };

    }


    return state.portfolio;

  }


  let serverPortfolio =
    normalizeStudentPortfolioApiRecord(
      response
    );


  /*
    One-time migration.

    If MongoDB has a newly created empty portfolio
    but this browser already contains portfolio data,
    move that existing information into MongoDB.
  */

  if (
    isStudentPortfolioServerCoreEmpty(
      serverPortfolio
    ) &&
    hasStudentPortfolioLocalCoreData(
      localPortfolio
    )
  ){

    try{

      const migratedResponse =
        await apiSend(
          "/api/student-portfolio/me",
          "PATCH",
          buildStudentPortfolioCorePayload(
            localPortfolio
          )
        );


      serverPortfolio =
        normalizeStudentPortfolioApiRecord(
          migratedResponse
        );


      console.info(
        "Student portfolio local data migrated to MongoDB."
      );

    }catch(error){

      console.error(
        "Student portfolio migration failed:",
        error
      );

    }

  }


  /*
    Backend becomes authoritative for core fields.

    Keep frontend-only data that has not been
    migrated to dedicated backend endpoints yet.
  */

  state.portfolio = {
    ...localPortfolio,
    ...serverPortfolio,

    projects:
      serverPortfolio.projects?.length
        ? serverPortfolio.projects
        : asArray(
            localPortfolio.projects
          ),

    experience:
      serverPortfolio.experience?.length
        ? serverPortfolio.experience
        : asArray(
            localPortfolio.experience
          ),

    resumeUrl:
      serverPortfolio.resumeUrl ||
      localPortfolio.resumeUrl ||
      "",

    resumeFileName:
      serverPortfolio.resumeFileName ||
      localPortfolio.resumeFileName ||
      "",

    resumeMimeType:
      serverPortfolio.resumeMimeType ||
      localPortfolio.resumeMimeType ||
      ""
  };


  saveStudentPortfolioStoredData(
    state.portfolio
  );


  return state.portfolio;

}

function getStudentPortfolioStoredData(){

  try{

    const storedValue =
      localStorage.getItem(
        STUDENT_PORTFOLIO_STORAGE_KEY
      );


    if (!storedValue){
      return {};
    }


    const parsed =
      JSON.parse(
        storedValue
      );


    return (
      parsed &&
      typeof parsed === "object"
    )
      ? parsed
      : {};

  }catch(error){

    console.error(
      "Student portfolio storage could not be read:",
      error
    );


    return {};

  }

}


function saveStudentPortfolioStoredData(
  portfolio
){

  try{

    localStorage.setItem(
      STUDENT_PORTFOLIO_STORAGE_KEY,
      JSON.stringify(
        portfolio
      )
    );

  }catch(error){

    console.error(
      "Student portfolio storage could not be saved:",
      error
    );

  }

}

function getStudentPortfolioProjects(){

  const serverProjects =
    asArray(
      state.portfolio?.projects
    );


  if (
    serverProjects.length
  ){

    return serverProjects.map(
      normalizeStudentPortfolioProject
    );

  }


  /*
    Legacy/local fallback.
  */

  try{

    const stored =
      localStorage.getItem(
        STUDENT_PROJECT_STORAGE_KEY
      );


    if (!stored){
      return [];
    }


    const parsed =
      JSON.parse(
        stored
      );


    return Array.isArray(
      parsed
    )
      ? parsed.map(
          normalizeStudentPortfolioProject
        )
      : [];

  }catch(error){

    console.error(
      "Project storage error:",
      error
    );


    return [];

  }

}

function getStudentPortfolioResume(){

  return {

    url:
      state.portfolio?.resumeUrl ||
      "",

    fileName:
      state.portfolio?.resumeFileName ||
      "",

    mimeType:
      state.portfolio?.resumeMimeType ||
      ""

  };

}


function saveStudentPortfolioResume(){

  state.portfolio.resumeUrl =
    studentPortfolioResumeData;

  state.portfolio.resumeFileName =
    studentPortfolioResumeName;

  state.portfolio.resumeMimeType =
    studentPortfolioResumeType;

  saveStudentPortfolioStoredData(
    state.portfolio
  );

}

async function uploadStudentResume(
  file
){

  if (!file){
    return;
  }


  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];


  const allowedExtensions = [
    "pdf",
    "doc",
    "docx"
  ];


  const extension =
    String(
      file.name ||
      ""
    )
      .split(".")
      .pop()
      .toLowerCase();


  const validType =
    allowedMimeTypes.includes(
      file.type
    ) ||
    allowedExtensions.includes(
      extension
    );


  if (!validType){

    notifyAIFTWarning(
      "Please select a PDF, DOC, or DOCX resume.",
      {
        title:
          "Unsupported resume"
      }
    );

    return;
  }


  const maximumBytes =
    10 * 1024 * 1024;


  if (
    file.size >
    maximumBytes
  ){

    notifyAIFTWarning(
      "Your resume must be smaller than 10 MB.",
      {
        title:
          "Resume is too large"
      }
    );

    return;
  }


  /*
    Revoke the previous temporary URL when replacing
    a resume so the browser does not retain it.
  */

  if (
    studentPortfolioResumeData &&
    studentPortfolioResumeData.startsWith(
      "blob:"
    )
  ){

    try{

      URL.revokeObjectURL(
        studentPortfolioResumeData
      );

    }catch(error){

      console.warn(
        "Previous resume URL could not be revoked:",
        error
      );

    }

  }


  studentPortfolioResumeData =
    URL.createObjectURL(
      file
    );


  studentPortfolioResumeName =
    file.name;


  studentPortfolioResumeType =
    file.type ||
    `application/${
      extension
    }`;


  state.portfolio = {
    ...getStudentPortfolio(),

    resumeUrl:
      studentPortfolioResumeData,

    resumeFileName:
      studentPortfolioResumeName,

    resumeMimeType:
      studentPortfolioResumeType
  };


  /*
    Do NOT save the blob URL permanently.
    Blob URLs only survive for this browser session.

    When we connect the backend uploader, resumeUrl
    will become the permanent Cloudinary/S3 URL.
  */


  renderStudentPortfolio();


  notifyAIFTSuccess(
    `${
      file.name
    } was added to your portfolio.`,
    {
      title:
        "Resume uploaded"
    }
  );

}

function openStudentResume(){

  const resume =
    getStudentPortfolioResume();

  if(
    !resume.url
  ){

    notifyAIFTInfo(

      "Upload a resume first."

    );

    return;

  }

  window.open(
    resume.url,
    "_blank",
    "noopener"
  );

}

function removeStudentResume(){

  state.portfolio.resumeUrl =
    "";

  state.portfolio.resumeFileName =
    "";

  state.portfolio.resumeMimeType =
    "";

  saveStudentPortfolioStoredData(
    state.portfolio
  );

  renderStudentPortfolio();

  notifyAIFTSuccess(

    "Resume removed."

  );

}

function saveStudentPortfolioProjects(
  projects
){

  localStorage.setItem(

    STUDENT_PROJECT_STORAGE_KEY,

    JSON.stringify(projects)

  );

}

function openStudentProjectEditor(
  projectId=null
){

  studentProjectEditingId =
    projectId;

  studentProjectEditorOpen =
    true;

  studentProjectCoverData =
    "";

  studentProjectFileData =
    "";

  const projects =
    getStudentPortfolioProjects();

  const project =
    projects.find(
      item=>sameId(
        item.id,
        projectId
      )
    );

  $("studentProjectForm")
    ?.reset();

  $("studentProjectCoverPreview")
    .hidden=true;

  $("deleteStudentProjectButton")
    .hidden=!project;

  if(project){

    $("studentProjectModalTitle")
      .textContent=
      "Edit Project";

    $("studentProjectId")
      .value=
      project.id;

    $("studentProjectTitleInput")
      .value=
      project.title||"";

    $("studentProjectCategoryInput")
      .value=
      project.category||"Academic Project";

    $("studentProjectDescriptionInput")
      .value=
      project.description||"";

    $("studentProjectDateInput")
      .value=
      project.completedAt||"";

    $("studentProjectFeaturedInput")
      .checked=
      project.featured!==false;

    $("studentProjectFileInput")
      .value=
      project.fileUrl||"";

    studentProjectCoverData=
      project.imageUrl||"";

    studentProjectFileData=
      project.fileUrl||"";

    if(studentProjectCoverData){

      const img=
        $("studentProjectCoverPreview");

      img.hidden=false;

      img.src=
        studentProjectCoverData;

    }

  }else{

    $("studentProjectModalTitle")
      .textContent=
      "Add Project";

  }

  openModal(
    "studentPortfolioProjectModal"
  );

}

function closeStudentProjectEditor(){

  closeModal(
    "studentPortfolioProjectModal"
  );

  studentProjectEditorOpen=
    false;

  studentProjectEditingId=
    null;

}

function previewStudentProjectCover(
  file
){

  if(!file){
    return;
  }

  const reader=
    new FileReader();

  reader.onload=e=>{

    studentProjectCoverData=
      e.target.result;

    const img=
      $("studentProjectCoverPreview");

    img.src=
      studentProjectCoverData;

    img.hidden=false;

  };

  reader.readAsDataURL(file);

}

function uploadStudentProjectFile(
  file
){

  if(!file){
    return;
  }

  studentProjectFileData=
    file.name;

  $("studentProjectFileInput")
    .value=
    file.name;

}

async function saveStudentProject(){

  const title =
    String(
      $("studentProjectTitleInput")
        ?.value ||
      ""
    ).trim();


  if (!title){

    notifyAIFTWarning(
      "Please enter a project title.",
      {
        title:
          "Project title required"
      }
    );


    $("studentProjectTitleInput")
      ?.focus();


    return false;

  }


  const saveButton =
    $("saveStudentProjectButton");


  const imageUrl =
    String(
      studentProjectCoverData ||
      ""
    ).trim();


  /*
    Do not send large base64 image payloads into the
    JSON API. We will connect project cover uploads
    to /api/uploads separately.
  */

  const safeImageUrl =
    imageUrl.startsWith(
      "data:"
    )
      ? ""
      : imageUrl;


  const payload = {

    title,

    category:
      String(
        $("studentProjectCategoryInput")
          ?.value ||
        "Project"
      ).trim(),

    description:
      String(
        $("studentProjectDescriptionInput")
          ?.value ||
        ""
      ).trim(),

    completedAt:
      $("studentProjectDateInput")
        ?.value ||
      null,

    featured:
      $("studentProjectFeaturedInput")
        ?.checked !==
      false,

    imageUrl:
      safeImageUrl,

    fileUrl:
      String(
        $("studentProjectFileInput")
          ?.value ||
        ""
      ).trim(),

    sourceType:
      "manual"
  };


  setDashboardButtonLoading(
    saveButton,
    true,
    studentProjectEditingId
      ? "Updating..."
      : "Saving..."
  );


  try{

    const isExistingServerProject =
      studentProjectEditingId &&
      /^[a-f\d]{24}$/i.test(
        String(
          studentProjectEditingId
        )
      );


    const response =
      isExistingServerProject
        ? await apiSend(
            `/api/student-portfolio/me/projects/${
              encodeURIComponent(
                studentProjectEditingId
              )
            }`,
            "PATCH",
            payload
          )
        : await apiSend(
            "/api/student-portfolio/me/projects",
            "POST",
            payload
          );


    const serverPortfolio =
      normalizeStudentPortfolioApiRecord(
        response?.portfolio ||
        {}
      );


    state.portfolio = {
      ...getStudentPortfolio(),
      ...serverPortfolio,

      projects:
        asArray(
          serverPortfolio.projects
        )
    };


    /*
      Keep a local safety copy.
    */

    saveStudentPortfolioProjects(
      state.portfolio.projects
    );


    saveStudentPortfolioStoredData(
      state.portfolio
    );


    renderStudentPortfolio();


    closeStudentProjectEditor();


    notifyAIFTSuccess(
      isExistingServerProject
        ? "Your project was updated."
        : "Your project was added to your portfolio.",
      {
        title:
          isExistingServerProject
            ? "Project updated"
            : "Project added"
      }
    );


    return true;

  }catch(error){

    console.error(
      "Student portfolio project save failed:",
      error
    );


    notifyAIFTError(
      error?.message ||
      "AIFT could not save this project.",
      {
        title:
          "Project save failed"
      }
    );


    return false;

  }finally{

    setDashboardButtonLoading(
      saveButton,
      false
    );

  }

}

async function deleteStudentProject(){

  const projectId =
    String(
      studentProjectEditingId ||
      ""
    ).trim();


  if (!projectId){
    return false;
  }


  /*
    Older local projects may still have UUID IDs.
    We only call MongoDB DELETE for real ObjectIds.
  */

  const isServerProject =
    /^[a-f\d]{24}$/i.test(
      projectId
    );


  const deleteButton =
    $("deleteStudentProjectButton");


  setDashboardButtonLoading(
    deleteButton,
    true,
    "Removing..."
  );


  try{

    if (isServerProject){

      const response =
        await apiSend(
          `/api/student-portfolio/me/projects/${
            encodeURIComponent(
              projectId
            )
          }`,
          "DELETE"
        );


      const serverPortfolio =
        normalizeStudentPortfolioApiRecord(
          response?.portfolio ||
          {}
        );


      state.portfolio = {
        ...getStudentPortfolio(),
        ...serverPortfolio,

        projects:
          asArray(
            serverPortfolio.projects
          )
      };

    }else{

      /*
        Legacy local-only project.
      */

      state.portfolio = {
        ...getStudentPortfolio(),

        projects:
          getStudentPortfolioProjects()
            .filter(project =>
              !sameId(
                project.id,
                projectId
              )
            )
      };

    }


    saveStudentPortfolioProjects(
      state.portfolio.projects
    );


    saveStudentPortfolioStoredData(
      state.portfolio
    );


    renderStudentPortfolio();


    closeStudentProjectEditor();


    notifyAIFTSuccess(
      "The project was removed from your portfolio.",
      {
        title:
          "Project removed"
      }
    );


    return true;

  }catch(error){

    console.error(
      "Student portfolio project deletion failed:",
      error
    );


    notifyAIFTError(
      error?.message ||
      "AIFT could not remove this project.",
      {
        title:
          "Project removal failed"
      }
    );


    return false;

  }finally{

    setDashboardButtonLoading(
      deleteButton,
      false
    );

  }

}

function normalizeStudentPortfolioSkill(
  skill
){

  if (
    typeof skill ===
    "string"
  ){

    return skill.trim();

  }


  return String(
    skill?.name ||
    skill?.title ||
    skill?.label ||
    ""
  ).trim();

}


function normalizeStudentPortfolioProject(
  project
){

  const rawId =
    project?._id ||
    project?.id ||
    project?.projectId ||
    "";


  return {
    id:
      String(
        rawId ||
        `local-project-${
          Math.random()
            .toString(36)
            .slice(2)
        }`
      ),

    title:
      String(
        project?.title ||
        project?.name ||
        "Untitled project"
      ).trim(),

    description:
      String(
        project?.description ||
        project?.summary ||
        ""
      ).trim(),

    category:
      String(
        project?.category ||
        project?.type ||
        "Project"
      ).trim(),

    imageUrl:
      String(
        project?.imageUrl ||
        project?.thumbnailUrl ||
        project?.coverUrl ||
        ""
      ).trim(),

    fileUrl:
      String(
        project?.fileUrl ||
        project?.url ||
        project?.projectUrl ||
        ""
      ).trim(),

    createdAt:
      project?.createdAt ||
      project?.completedAt ||
      null,

    featured:
      project?.featured !==
        false,

    raw:
      project
  };

}

function openStudentPortfolioExperienceEditor(
  experienceId = null
){

  const portfolio =
    getStudentPortfolio();


  const experience =
    portfolio.experience.find(
      item =>
        sameId(
          item.id,
          experienceId
        )
    );


  studentPortfolioExperienceEditingId =
    experience?.id ||
    null;


  const form =
    $("studentPortfolioExperienceForm");


  form?.reset();


  $("studentPortfolioExperienceModalTitle")
    .textContent =
      experience
        ? "Edit experience"
        : "Add experience";


  $("deleteStudentPortfolioExperienceButton")
    .hidden =
      !experience;


  $("studentPortfolioExperienceId")
    .value =
      experience?.id ||
      "";


  $("studentPortfolioExperienceTitleInput")
    .value =
      experience?.title ||
      "";


  $("studentPortfolioExperienceOrganizationInput")
    .value =
      experience?.organization ||
      "";


  $("studentPortfolioExperienceTypeInput")
    .value =
      experience?.type ||
      "internship";


  $("studentPortfolioExperienceStartInput")
    .value =
      experience?.startDate
        ? String(
            experience.startDate
          ).slice(
            0,
            10
          )
        : "";


  $("studentPortfolioExperienceEndInput")
    .value =
      experience?.endDate
        ? String(
            experience.endDate
          ).slice(
            0,
            10
          )
        : "";


  $("studentPortfolioExperienceCurrentInput")
    .checked =
      experience?.current ===
      true;


  $("studentPortfolioExperienceDescriptionInput")
    .value =
      experience?.description ||
      "";


  const endInput =
    $("studentPortfolioExperienceEndInput");


  if (endInput){

    endInput.disabled =
      experience?.current ===
      true;

  }


  openModal(
    "studentPortfolioExperienceModal"
  );


  window.setTimeout(
    () => {

      $("studentPortfolioExperienceTitleInput")
        ?.focus();

    },
    80
  );

}


function closeStudentPortfolioExperienceEditor(){

  closeModal(
    "studentPortfolioExperienceModal"
  );


  studentPortfolioExperienceEditingId =
    null;

}

function saveStudentPortfolioExperience(){

  const title =
    String(
      $("studentPortfolioExperienceTitleInput")
        ?.value ||
      ""
    ).trim();


  if (!title){

    notifyAIFTWarning(
      "Enter a role or activity before saving.",
      {
        title:
          "Experience title required"
      }
    );


    $("studentPortfolioExperienceTitleInput")
      ?.focus();


    return false;

  }


  const currentPortfolio =
    getStudentPortfolio();


  const experiences =
    [
      ...currentPortfolio.experience
    ];


  const current =
    $("studentPortfolioExperienceCurrentInput")
      ?.checked ===
      true;


  const experience = {

    id:
      studentPortfolioExperienceEditingId ||
      (
        crypto.randomUUID
          ? crypto.randomUUID()
          : `experience-${
              Date.now()
            }`
      ),

    title,

    organization:
      String(
        $("studentPortfolioExperienceOrganizationInput")
          ?.value ||
        ""
      ).trim(),

    type:
      String(
        $("studentPortfolioExperienceTypeInput")
          ?.value ||
        "other"
      )
        .trim()
        .toLowerCase(),

    description:
      String(
        $("studentPortfolioExperienceDescriptionInput")
          ?.value ||
        ""
      ).trim(),

    startDate:
      $("studentPortfolioExperienceStartInput")
        ?.value ||
      null,

    endDate:
      current
        ? null
        : (
            $("studentPortfolioExperienceEndInput")
              ?.value ||
            null
          ),

    current
  };


  const existingIndex =
    experiences.findIndex(
      item =>
        sameId(
          item.id,
          experience.id
        )
    );


  if (
    existingIndex >
    -1
  ){

    experiences[
      existingIndex
    ] =
      experience;

  }else{

    experiences.unshift(
      experience
    );

  }


  state.portfolio = {
    ...currentPortfolio,
    experience:
      experiences
  };


  saveStudentPortfolioStoredData(
    state.portfolio
  );


  renderStudentPortfolio();


  closeStudentPortfolioExperienceEditor();


  notifyAIFTSuccess(
    "Your experience was added to your portfolio.",
    {
      title:
        "Experience saved"
    }
  );


  return true;

}


function normalizeStudentPortfolioExperience(
  experience
){

  return {
    id:
      String(
        experience?._id ||
        experience?.id ||
        `local-experience-${
          Math.random()
            .toString(36)
            .slice(2)
        }`
      ),

    title:
      String(
        experience?.title ||
        experience?.position ||
        experience?.role ||
        "Experience"
      ).trim(),

    organization:
      String(
        experience?.organization ||
        experience?.company ||
        experience?.school ||
        ""
      ).trim(),

    description:
      String(
        experience?.description ||
        experience?.summary ||
        ""
      ).trim(),

    type:
      String(
        experience?.type ||
        experience?.category ||
        "experience"
      )
        .trim()
        .toLowerCase(),

    startDate:
      experience?.startDate ||
      null,

    endDate:
      experience?.endDate ||
      null,

    current:
      experience?.current ===
        true,

    raw:
      experience
  };

}

function getStudentPortfolio(){

  const storedPortfolio =
    getStudentPortfolioStoredData();


  const statePortfolio =
    state.portfolio &&
    typeof state.portfolio ===
      "object"
      ? state.portfolio
      : {};


  const user =
    state.me ||
    state.loggedUser ||
    {};


  const rawSkills =
    asArray(
      statePortfolio.skills?.length
        ? statePortfolio.skills
        : (
            storedPortfolio.skills?.length
              ? storedPortfolio.skills
              : (
                  user.skills ||
                  user.skillSet ||
                  []
                )
          )
    );


  const rawProjects =
    asArray(
      statePortfolio.projects?.length
        ? statePortfolio.projects
        : storedPortfolio.projects
    );


  const rawExperience =
    asArray(
      statePortfolio.experience?.length
        ? statePortfolio.experience
        : storedPortfolio.experience
    );


  return {
    visibility:
      String(
        statePortfolio.visibility ||
        storedPortfolio.visibility ||
        "private"
      )
        .trim()
        .toLowerCase(),

    headline:
      String(
        statePortfolio.headline ||
        storedPortfolio.headline ||
        user.headline ||
        user.professionalHeadline ||
        user.course ||
        user.program ||
        ""
      ).trim(),

    about:
      String(
        statePortfolio.about ||
        storedPortfolio.about ||
        user.bio ||
        user.about ||
        user.summary ||
        ""
      ).trim(),

    skills:
      rawSkills
        .map(
          normalizeStudentPortfolioSkill
        )
        .filter(Boolean)
        .slice(
          0,
          20
        ),

    languages:
      asArray(
        statePortfolio.languages?.length
          ? statePortfolio.languages
          : storedPortfolio.languages
      )
        .map(
          normalizeStudentPortfolioSkill
        )
        .filter(Boolean),

    projects:
      rawProjects
        .map(
          normalizeStudentPortfolioProject
        )
        .filter(project =>
          project.featured !==
          false
        ),

    experience:
      rawExperience
        .map(
          normalizeStudentPortfolioExperience
        ),

    featuredCertificateIds:
      asArray(
        statePortfolio
          .featuredCertificateIds
          ?.length
          ? statePortfolio
              .featuredCertificateIds
          : storedPortfolio
              .featuredCertificateIds
      )
        .map(id =>
          String(
            id
          )
        ),

    resumeUrl:
      String(
        statePortfolio.resumeUrl ||
        storedPortfolio.resumeUrl ||
        user.cvUrl ||
        user.resumeUrl ||
        ""
      ).trim(),

    publicSlug:
      String(
        statePortfolio.publicSlug ||
        storedPortfolio.publicSlug ||
        user.username ||
        user.slug ||
        user._id ||
        ""
      ).trim(),

    views:
      Number(
        statePortfolio.views ||
        storedPortfolio.views ||
        0
      ),

    user
  };

}

function getStudentPortfolioPublicUrl(){

  const portfolio =
    getStudentPortfolio();


  const studentId =
    normalizeId(
      portfolio?.user?._id ||
      state.me?._id ||
      state.loggedUser?._id ||
      getStudentId()
    );


  if (!studentId){
    return "";
  }


  const url =
    new URL(
      "student-public-profile.html",
      window.location.href
    );


  url.searchParams.set(
    "id",
    studentId
  );


  url.searchParams.set(
    "view",
    "portfolio"
  );


  return url.href;

}

async function copyStudentPortfolioPublicLink(){

  const portfolio =
    getStudentPortfolio();


  if (
    portfolio.visibility !==
    "public"
  ){

    notifyAIFTWarning(
      "Set your portfolio visibility to Public before sharing it.",
      {
        title:
          "Portfolio is private"
      }
    );

    return false;

  }


  const url =
    getStudentPortfolioPublicUrl();


  if (!url){

    notifyAIFTError(
      "AIFT could not create your portfolio link.",
      {
        title:
          "Link unavailable"
      }
    );

    return false;

  }


  try{

    await navigator.clipboard.writeText(
      url
    );


    notifyAIFTSuccess(
      "Portfolio link copied to your clipboard.",
      {
        title:
          "Link copied"
      }
    );


    return true;

  }catch(error){

    console.error(
      "Portfolio clipboard copy failed:",
      error
    );


    /*
      Fallback for browsers where Clipboard API
      is unavailable.
    */

    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      url;


    textarea.setAttribute(
      "readonly",
      ""
    );


    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";


    document.body.appendChild(
      textarea
    );


    textarea.select();


    const copied =
      document.execCommand(
        "copy"
      );


    textarea.remove();


    if (copied){

      notifyAIFTSuccess(
        "Portfolio link copied to your clipboard.",
        {
          title:
            "Link copied"
        }
      );


      return true;

    }


    notifyAIFTError(
      "AIFT could not copy the portfolio link.",
      {
        title:
          "Copy failed"
      }
    );


    return false;

  }

}

function previewStudentPortfolio(){

  const url =
    getStudentPortfolioPublicUrl();


  if (!url){

    notifyAIFTError(
      "AIFT could not create the portfolio preview.",
      {
        title:
          "Preview unavailable"
      }
    );

    return;
  }


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );

}

async function shareStudentPortfolio(){

  const portfolio =
    getStudentPortfolio();


  if (
    portfolio.visibility !==
    "public"
  ){

    notifyAIFTWarning(
      "Set your portfolio visibility to Public before sharing it.",
      {
        title:
          "Portfolio is private"
      }
    );

    return;
  }


  const url =
    getStudentPortfolioPublicUrl();


  if (!url){

    notifyAIFTError(
      "AIFT could not create your portfolio link.",
      {
        title:
          "Share unavailable"
      }
    );

    return;
  }


  const studentName =
    getStudentPortfolioStudentName(
      portfolio
    );


  const shareData = {
    title:
      `${
        studentName
      } | AIFT Portfolio`,

    text:
      `View ${
        studentName
      }'s student portfolio on AIFT.`,

    url
  };


  try{

    if (
      navigator.share
    ){

      await navigator.share(
        shareData
      );


      return;

    }


    /*
      Desktop fallback:
      copy the URL instead.
    */

    await copyStudentPortfolioPublicLink();

  }catch(error){

    /*
      AbortError means the user simply closed
      the operating-system share sheet.
    */

    if (
      error?.name ===
      "AbortError"
    ){
      return;
    }


    console.error(
      "Portfolio share failed:",
      error
    );


    notifyAIFTError(
      "AIFT could not share your portfolio.",
      {
        title:
          "Share failed"
      }
    );

  }

}

function getStudentPortfolioStudentName(
  portfolio
){

  const user =
    portfolio?.user ||
    {};


  return String(
    user.name ||
    user.fullName ||
    [
      user.firstName,
      user.lastName
    ]
      .filter(Boolean)
      .join(" ") ||
    "Student"
  ).trim();

}


function getStudentPortfolioSchoolName(
  portfolio
){

  const user =
    portfolio?.user ||
    {};


  const school =
    user.schoolId &&
    typeof user.schoolId ===
      "object"
      ? user.schoolId
      : (
          user.linkedSchoolId &&
          typeof user.linkedSchoolId ===
            "object"
            ? user.linkedSchoolId
            : null
        );


  return String(
    school?.name ||
    user.schoolName ||
    user.linkedSchoolName ||
    "AIFT Student"
  ).trim();

}


function getStudentPortfolioProfileImage(
  portfolio
){

  const user =
    portfolio?.user ||
    {};


  return String(
    user.profileImage ||
    user.avatar ||
    user.photoURL ||
    user.image ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png"
  ).trim();

}

function calculateStudentPortfolioCompletion(
  portfolio,
  certificates
){

  const checks = [
    Boolean(
      portfolio.headline
    ),

    Boolean(
      portfolio.about
    ),

    portfolio.skills.length >=
      3,

    portfolio.projects.length >=
      1,

    portfolio.experience.length >=
      1,

    certificates.length >=
      1,

    Boolean(
      portfolio.resumeUrl
    ),

    portfolio.visibility !==
      "private"
  ];


  const completed =
    checks.filter(Boolean).length;


  const percentage =
    Math.round(
      (
        completed /
        checks.length
      ) *
      100
    );


  return {
    percentage,
    completed,
    total:
      checks.length
  };

}


function getStudentPortfolioStrengthLabel(
  percentage
){

  if (
    percentage >=
    90
  ){
    return "Excellent";
  }


  if (
    percentage >=
    70
  ){
    return "Strong";
  }


  if (
    percentage >=
    45
  ){
    return "Developing";
  }


  if (
    percentage >=
    20
  ){
    return "Getting started";
  }


  return "Incomplete";

}

function renderStudentPortfolioProjects(
  projects
){

  const grid =
    $("studentPortfolioProjectGrid");

  const emptyState =
    $("studentPortfolioProjectEmpty");


  if (
    !grid ||
    !emptyState
  ){
    return;
  }


  if (!projects.length){

    grid.hidden =
      true;

    grid.innerHTML =
      "";

    emptyState.hidden =
      false;

    return;

  }


  emptyState.hidden =
    true;

  grid.hidden =
    false;


  grid.innerHTML =
    projects
      .map(project => {

        const createdDate =
          project.createdAt
            ? formatDate(
                project.createdAt
              )
            : "No date";


        const cover = project.imageUrl
          ? `
              <img
                src="${
                  escapeHtml(
                    project.imageUrl
                  )
                }"
                alt=""
                loading="lazy"
              >
            `
          : `
              <i
                class="fa-solid fa-diagram-project"
                aria-hidden="true"
              ></i>
            `;


        return `
          <article
            class="student-portfolio-project-card"
            data-portfolio-project-id="${
              escapeHtml(
                project.id
              )
 …150183 tokens truncated…ion saveStudentRecentlyOpenedResources(
  resources
){

  localStorage.setItem(
    STUDENT_RESOURCE_RECENT_STORAGE_KEY,
    JSON.stringify(
      resources.slice(
        0,
        8
      )
    )
  );

}

/* =========================================================
   COLLECT STUDENT RESOURCES
========================================================= */

function buildStudentResources(){

  const resources =
    [];

  const resourceKeys =
    new Set();


  const addResource = ({
    id,
    title,
    description,
    url,
    originalName,
    mimeType,
    type,
    classId,
    className,
    source,
    createdAt,
    thumbnail,

    isPersonal = false,
    category = "",
    tags = [],
    saved = false,
    publicId = ""
  } = {}) => {

    const cleanUrl =
      String(
        url ||
        ""
      ).trim();

    if (!cleanUrl){
      return;
    }


    const cleanTitle =
      String(
        title ||
        originalName ||
        "Learning resource"
      ).trim();


    const resourceType =
      getStudentResourceType({
        type,
        mimeType,
        url:
          cleanUrl,
        originalName
      });


    const uniqueKey =
      [
        cleanUrl,
        cleanTitle,
        normalizeId(classId)
      ].join("|");


    if (
      resourceKeys.has(
        uniqueKey
      )
    ){
      return;
    }


    resourceKeys.add(
      uniqueKey
    );


    resources.push({
      id:
        String(
          id ||
          `resource-${
            resources.length + 1
          }`
        ),

      title:
        cleanTitle,

      description:
        String(
          description ||
          ""
        ).trim(),

      url:
        cleanUrl,

      originalName:
        String(
          originalName ||
          cleanTitle
        ).trim(),

      mimeType:
        String(
          mimeType ||
          ""
        ).trim(),

      type:
        resourceType,

      classId:
        normalizeId(
          classId
        ),

      className:
        String(
          className ||
          "General"
        ).trim(),

      source:
        String(
          source ||
          "Learning resource"
        ).trim(),

      createdAt:
        createdAt ||
        null,

      thumbnail:
        String(
          thumbnail ||
          ""
        ).trim(),

      isPersonal:
        Boolean(
          isPersonal
        ),

      category:
        String(
          category ||
          ""
        )
          .trim()
          .toLowerCase(),

      tags:
        Array.isArray(
          tags
        )
          ? tags
          : [],

      saved:
        Boolean(
          saved
        ),

      publicId:
        String(
          publicId ||
          ""
        ).trim()
    });

  };
  /* =======================================================
     PERSONAL STUDENT RESOURCES
  ======================================================= */

  asArray(
    state.studentResources
  )
    .forEach(resource => {

      addResource({
        id:
          resource?._id ||
          resource?.id,

        title:
          resource?.title ||
          resource?.originalName ||
          "Personal learning resource",

        description:
          resource?.description ||
          "",

        url:
          resource?.secureUrl ||
          resource?.url,

        originalName:
          resource?.originalName,

        mimeType:
          resource?.mimeType,

        type:
          resource?.attachmentType ||
          "note",

        classId:
          resource?.classId?._id ||
          resource?.classId,

        className:
          resource?.classId?.title ||
          resource?.classId?.name ||
          resource?.classId?.subject ||
          "My notes",

        source:
          "My notes",

        createdAt:
          resource?.uploadedAt ||
          resource?.createdAt,

        thumbnail:
          resource?.attachmentType ===
            "image"
            ? (
                resource?.secureUrl ||
                resource?.url
              )
            : "",

        isPersonal:
          true,

        category:
          resource?.category ||
          "note",

        tags:
          asArray(
            resource?.tags
          ),

        saved:
          Boolean(
            resource?.saved
          ),

        publicId:
          resource?.publicId ||
          ""
      });

    });

  /* =======================================================
     CLASS RESOURCES
  ======================================================= */

  getStudentClasses()
    .forEach(classItem => {

      const classId =
        normalizeId(
          classItem?._id ||
          classItem?.id
        );

      const className =
        String(
          classItem?.title ||
          classItem?.name ||
          classItem?.subject ||
          "Class"
        ).trim();


      const classCollections =
        [
          classItem?.resources,
          classItem?.materials,
          classItem?.files,
          classItem?.attachments
        ];


      classCollections
        .forEach(collection => {

          asArray(
            collection
          )
            .forEach(
              (
                item,
                index
              ) => {

                if (
                  typeof item ===
                  "string"
                ){

                  addResource({
                    id:
                      `class-${classId}-${index}`,

                    title:
                      "Class resource",

                    url:
                      item,

                    classId,
                    className,

                    source:
                      "Class material",

                    createdAt:
                      classItem?.updatedAt ||
                      classItem?.createdAt
                  });

                  return;
                }


                addResource({
                  id:
                    item?._id ||
                    item?.id ||
                    `class-${classId}-${index}`,

                  title:
                    item?.title ||
                    item?.name ||
                    item?.originalName,

                  description:
                    item?.description ||
                    item?.caption,

                  url:
                    item?.secureUrl ||
                    item?.url ||
                    item?.fileUrl ||
                    item?.link,

                  originalName:
                    item?.originalName ||
                    item?.fileName ||
                    item?.name,

                  mimeType:
                    item?.mimeType ||
                    item?.mimetype,

                  type:
                    item?.type ||
                    item?.mediaType,

                  classId,
                  className,

                  source:
                    "Class material",

                  createdAt:
                    item?.uploadedAt ||
                    item?.createdAt ||
                    classItem?.updatedAt,

                  thumbnail:
                    item?.thumbnail ||
                    item?.image
                });

              }
            );

        });


      const modules =
        asArray(
          classItem?.modules
        );


      modules.forEach(
        (
          module,
          moduleIndex
        ) => {

          const lessons =
            asArray(
              module?.lessons
            );


          lessons.forEach(
            (
              lesson,
              lessonIndex
            ) => {

              const lessonTitle =
                String(
                  lesson?.title ||
                  lesson?.name ||
                  `Lesson ${
                    lessonIndex + 1
                  }`
                ).trim();


              const lessonCollections =
                [
                  lesson?.resources,
                  lesson?.materials,
                  lesson?.files,
                  lesson?.attachments
                ];


              lessonCollections
                .forEach(collection => {

                  asArray(
                    collection
                  )
                    .forEach(
                      (
                        item,
                        resourceIndex
                      ) => {

                        if (
                          typeof item ===
                          "string"
                        ){

                          addResource({
                            id:
                              `lesson-${classId}-${moduleIndex}-${lessonIndex}-${resourceIndex}`,

                            title:
                              lessonTitle,

                            description:
                              module?.title ||
                              "Lesson material",

                            url:
                              item,

                            classId,
                            className,

                            source:
                              "Lesson material",

                            createdAt:
                              lesson?.updatedAt ||
                              lesson?.createdAt
                          });

                          return;
                        }


                        addResource({
                          id:
                            item?._id ||
                            item?.id ||
                            `lesson-${classId}-${moduleIndex}-${lessonIndex}-${resourceIndex}`,

                          title:
                            item?.title ||
                            item?.name ||
                            item?.originalName ||
                            lessonTitle,

                          description:
                            item?.description ||
                            lesson?.description ||
                            module?.title,

                          url:
                            item?.secureUrl ||
                            item?.url ||
                            item?.fileUrl ||
                            item?.link,

                          originalName:
                            item?.originalName ||
                            item?.fileName ||
                            item?.name,

                          mimeType:
                            item?.mimeType ||
                            item?.mimetype,

                          type:
                            item?.type ||
                            item?.mediaType,

                          classId,
                          className,

                          source:
                            "Lesson material",

                          createdAt:
                            item?.uploadedAt ||
                            item?.createdAt ||
                            lesson?.updatedAt,

                          thumbnail:
                            item?.thumbnail ||
                            item?.image
                        });

                      }
                    );

                });


              addResource({
                id:
                  `lesson-video-${classId}-${moduleIndex}-${lessonIndex}`,

                title:
                  lessonTitle,

                description:
                  lesson?.description ||
                  module?.title,

                url:
                  lesson?.videoUrl ||
                  lesson?.recordingUrl,

                type:
                  lesson?.recordingUrl
                    ? "recording"
                    : "video",

                classId,
                className,

                source:
                  lesson?.recordingUrl
                    ? "Class recording"
                    : "Lesson video",

                createdAt:
                  lesson?.updatedAt ||
                  lesson?.createdAt,

                thumbnail:
                  lesson?.coverImage ||
                  lesson?.thumbnail
              });

            }
          );

        }
      );

    });


  /* =======================================================
     ASSIGNMENT RESOURCES
  ======================================================= */

  getStudentAssignments()
    .forEach(assignment => {

      const assignmentId =
        normalizeId(
          assignment?._id ||
          assignment?.id
        );

      const classId =
        normalizeId(
          assignment?.classId?._id ||
          assignment?.classId
        );

      const classItem =
        getStudentClasses()
          .find(item =>
            sameId(
              item?._id,
              classId
            )
          );

      const className =
        String(
          assignment?.classId?.title ||
          assignment?.classId?.name ||
          classItem?.title ||
          classItem?.name ||
          classItem?.subject ||
          "General"
        ).trim();


      const assignmentResources =
        typeof getAssignmentWorkspaceResources ===
        "function"
          ? getAssignmentWorkspaceResources(
              assignment
            )
          : [];


      assignmentResources
        .forEach(
          (
            resource,
            index
          ) => {

            addResource({
              id:
                `assignment-${assignmentId}-${index}`,

              title:
                resource?.title ||
                assignment?.title ||
                "Assignment material",

              description:
                assignment?.description ||
                assignment?.instructions,

              url:
                resource?.url,

              type:
                resource?.type ||
                "assignment",

              classId,
              className,

              source:
                `Assignment: ${
                  assignment?.title ||
                  "Coursework"
                }`,

              createdAt:
                assignment?.updatedAt ||
                assignment?.createdAt
            });

          }
        );


      asArray(
        assignment?.attachments
      )
        .forEach(
          (
            attachment,
            index
          ) => {

            addResource({
              id:
                attachment?._id ||
                `assignment-file-${assignmentId}-${index}`,

              title:
                attachment?.title ||
                attachment?.originalName ||
                assignment?.title,

              description:
                assignment?.description ||
                assignment?.instructions,

              url:
                attachment?.secureUrl ||
                attachment?.url ||
                attachment?.fileUrl,

              originalName:
                attachment?.originalName ||
                attachment?.fileName,

              mimeType:
                attachment?.mimeType ||
                attachment?.mimetype,

              type:
                attachment?.attachmentType ||
                attachment?.mediaType ||
                "assignment",

              classId,
              className,

              source:
                `Assignment: ${
                  assignment?.title ||
                  "Coursework"
                }`,

              createdAt:
                attachment?.uploadedAt ||
                assignment?.updatedAt,

              thumbnail:
                attachment?.thumbnail
            });

          }
        );

    });


  /* =======================================================
     SCHOOL UPDATE RESOURCE LINKS
  ======================================================= */

  asArray(
    state.schoolUpdates
  )
    .forEach(update => {

      addResource({
        id:
          update?._id ||
          update?.id,

        title:
          update?.title ||
          "School resource",

        description:
          update?.description ||
          update?.text,

        url:
          update?.resourceUrl,

        type:
          "link",

        classId:
          update?.classId?._id ||
          update?.classId,

        className:
          update?.classId?.title ||
          "School",

        source:
          "School update",

        createdAt:
          update?.createdAt ||
          update?.updatedAt
      });

    });


  /* =======================================================
     CLASS SCHEDULE AND MEETING RECORDINGS
  ======================================================= */

  asArray(
    state.schedules
  )
    .forEach(schedule => {

      const classId =
        normalizeId(
          schedule?.classId?._id ||
          schedule?.classId
        );

      const className =
        String(
          schedule?.classId?.title ||
          schedule?.classTitle ||
          schedule?.title ||
          "Class"
        ).trim();


      addResource({
        id:
          `recording-${
            normalizeId(
              schedule?._id ||
              schedule?.id
            )
          }`,

        title:
          schedule?.recordingTitle ||
          `${className} recording`,

        description:
          schedule?.description,

        url:
          schedule?.recordingUrl ||
          schedule?.recordingLink,

        type:
          "recording",

        classId,
        className,

        source:
          "Class recording",

        createdAt:
          schedule?.updatedAt ||
          schedule?.createdAt ||
          schedule?.startDate
      });


      addResource({
        id:
          `meeting-${
            normalizeId(
              schedule?._id ||
              schedule?.id
            )
          }`,

        title:
          schedule?.title ||
          `${className} meeting`,

        description:
          schedule?.description,

        url:
          schedule?.meetingLink ||
          schedule?.meetingUrl,

        type:
          "link",

        classId,
        className,

        source:
          "Class meeting",

        createdAt:
          schedule?.updatedAt ||
          schedule?.createdAt ||
          schedule?.startDate
      });

    });


  return resources;

}

/* =========================================================
   RECENTLY OPENED STUDENT RESOURCES
========================================================= */

function renderStudentRecentlyOpenedResources(){

  const container =
    $("studentRecentlyOpenedResources");

  if (!container){
    return;
  }


  const recentResources =
    getStudentRecentlyOpenedResources()
      .slice(
        0,
        5
      );


  if (!recentResources.length){

    container.innerHTML = `
      <div class="student-resource-empty compact">

        <i
          class="fa-regular fa-clock"
          aria-hidden="true"
        ></i>

        <span>
          Opened resources will appear here.
        </span>

      </div>
    `;

    return;
  }


  container.innerHTML =
    recentResources
      .map(resource => `
        <button
          class="student-resource-recent-item"
          type="button"
          data-open-recent-resource="${
            escapeHtml(
              resource.id
            )
          }"
        >

          <span class="student-resource-recent-item-icon">

            <i
              class="${
                escapeHtml(
                  getStudentResourceIcon(
                    resource.type
                  )
                )
              }"
              aria-hidden="true"
            ></i>

          </span>

          <div>

            <strong>
              ${
                escapeHtml(
                  resource.title ||
                  "Learning resource"
                )
              }
            </strong>

            <span>
              ${
                escapeHtml(
                  resource.className ||
                  resource.source ||
                  "Resource"
                )
              }
            </span>

          </div>

        </button>
      `)
      .join("");

}
/* =========================================================
   RESOURCE CLASS FILTER
========================================================= */

function hydrateStudentResourceClassFilter(){

  const select =
    $("resourceClassFilter");

  if (!select){
    return;
  }


  const previousValue =
    String(
      select.value ||
      ""
    );


  const classes =
    getStudentClasses()
      .map(classItem => ({
        id:
          normalizeId(
            classItem?._id ||
            classItem?.id
          ),

        title:
          String(
            classItem?.title ||
            classItem?.name ||
            classItem?.subject ||
            "Class"
          ).trim()
      }))
      .filter(classItem =>
        classItem.id
      )
      .sort(
        (
          first,
          second
        ) =>
          first.title.localeCompare(
            second.title
          )
      );


  select.innerHTML = `
    <option value="">
      All classes
    </option>

    ${
      classes
        .map(classItem => `
          <option
            value="${
              escapeHtml(
                classItem.id
              )
            }"
          >
            ${
              escapeHtml(
                classItem.title
              )
            }
          </option>
        `)
        .join("")
    }
  `;


  if (
    previousValue &&
    classes.some(classItem =>
      sameId(
        classItem.id,
        previousValue
      )
    )
  ){
    select.value =
      previousValue;
  }

}
/* =========================================================
   RESTORE SELECTED CLASS RESOURCE FILTER
========================================================= */

function restoreStudentResourceClassSelection(){

  const selectedClassId =
    String(
      sessionStorage.getItem(
        "aiftSelectedClassId"
      ) ||
      ""
    ).trim();


  if (!selectedClassId){
    return;
  }


  const classFilter =
    $("resourceClassFilter");


  if (classFilter){

    const optionExists =
      Array.from(
        classFilter.options
      )
        .some(option =>
          sameId(
            option.value,
            selectedClassId
          )
        );


    if (optionExists){

      classFilter.value =
        selectedClassId;

    }

  }


  sessionStorage.removeItem(
    "aiftSelectedClassId"
  );

}

/* =========================================================
   OPEN STUDENT RESOURCE
========================================================= */

function openStudentResource(
  resourceId
){

  const resource =
    buildStudentResources()
      .find(item =>
        String(item.id) ===
        String(resourceId)
      );


  if (!resource){

    notifyAIFTWarning(
      "This resource is no longer available.",
      {
        title:
          "Resource unavailable"
      }
    );

    return;
  }


  const recentResources =
    getStudentRecentlyOpenedResources()
      .filter(item =>
        String(item.id) !==
        String(resource.id)
      );


  recentResources.unshift({
    id:
      resource.id,

    title:
      resource.title,

    type:
      resource.type,

    className:
      resource.className,

    source:
      resource.source,

    url:
      resource.url,

    openedAt:
      new Date()
        .toISOString()
  });


  saveStudentRecentlyOpenedResources(
    recentResources
  );


  renderStudentRecentlyOpenedResources();


  const openedWindow =
    window.open(
      resource.url,
      "_blank",
      "noopener,noreferrer"
    );


  if (!openedWindow){

    notifyAIFTWarning(
      "Your browser blocked the resource window. Allow pop-ups for AIFT and try again.",
      {
        title:
          "Resource blocked"
      }
    );

    return;
  }


  notifyAIFTSuccess(
    `${resource.title} was opened.`,
    {
      title:
        "Resource opened",

      duration:
        2500
    }
  );

}

/* =========================================================
   SAVE STUDENT RESOURCE
========================================================= */

function toggleStudentResourceSaved(
  resourceId
){

  const cleanResourceId =
    String(
      resourceId ||
      ""
    ).trim();


  if (!cleanResourceId){
    return;
  }


  const savedIds =
    getStudentSavedResourceIds();


  let saved =
    false;


  if (
    savedIds.has(
      cleanResourceId
    )
  ){

    savedIds.delete(
      cleanResourceId
    );

  }else{

    savedIds.add(
      cleanResourceId
    );

    saved =
      true;

  }


  saveStudentResourceIds(
    savedIds
  );


  renderResources();


  notifyAIFTSuccess(
    saved
      ? "The resource was added to your saved resources."
      : "The resource was removed from your saved resources.",
    {
      title:
        saved
          ? "Resource saved"
          : "Resource removed",

      duration:
        2500
    }
  );

}


const STUDENT_RESOURCE_PREVIEW_MIN_ZOOM =
  0.25;

const STUDENT_RESOURCE_PREVIEW_MAX_ZOOM =
  4;

const STUDENT_RESOURCE_PREVIEW_ZOOM_STEP =
  0.25;


function studentResourcePreviewSupportsZoom(){

  const type =
    String(
      studentResourcePreviewResource?.type ||
      ""
    )
      .trim()
      .toLowerCase();


  return type ===
    "image";

}


function updateStudentResourcePreviewZoomControls(){

  const zoomOutButton =
    $("studentResourcePreviewZoomOutButton");

  const zoomInButton =
    $("studentResourcePreviewZoomInButton");

  const zoomValueButton =
    $("studentResourcePreviewZoomValueButton");

  const fitButton =
    $("studentResourcePreviewFitButton");


  const supported =
    studentResourcePreviewSupportsZoom();


  if (zoomOutButton){

    zoomOutButton.hidden =
      !supported;

    zoomOutButton.disabled =
      !supported ||
      studentResourcePreviewZoom <=
        STUDENT_RESOURCE_PREVIEW_MIN_ZOOM;

  }


  if (zoomInButton){

    zoomInButton.hidden =
      !supported;

    zoomInButton.disabled =
      !supported ||
      studentResourcePreviewZoom >=
        STUDENT_RESOURCE_PREVIEW_MAX_ZOOM;

  }


  if (zoomValueButton){

    zoomValueButton.hidden =
      !supported;

    zoomValueButton.textContent =
      `${
        Math.round(
          studentResourcePreviewZoom *
          100
        )
      }%`;

  }


  if (fitButton){

    fitButton.hidden =
      !supported;

    fitButton.classList.toggle(
      "active",
      supported &&
      studentResourcePreviewFitMode
    );

    fitButton.setAttribute(
      "aria-pressed",
      String(
        supported &&
        studentResourcePreviewFitMode
      )
    );

  }

}


function applyStudentResourcePreviewZoom(){

  const image =
    $("studentResourcePreviewImage");

  const imagePanel =
    $("studentResourceImagePreview");


  if (
    !image ||
    !imagePanel
  ){
    return;
  }


  if (
    studentResourcePreviewFitMode
  ){

    image.style.width =
      "";

    image.style.height =
      "";

    image.style.maxWidth =
      "100%";

    image.style.maxHeight =
      "100%";

    image.style.transform =
      "";

    imagePanel.classList.remove(
      "zoomed"
    );

  }else{

    image.style.maxWidth =
      "none";

    image.style.maxHeight =
      "none";

    image.style.width =
      `${
        studentResourcePreviewZoom *
        100
      }%`;

    image.style.height =
      "auto";

    image.style.transform =
      "";

    imagePanel.classList.add(
      "zoomed"
    );

  }


  updateStudentResourcePreviewZoomControls();

}


function setStudentResourcePreviewZoom(
  zoom,
  {
    fit = false
  } = {}
){

  const safeZoom =
    Math.max(
      STUDENT_RESOURCE_PREVIEW_MIN_ZOOM,
      Math.min(
        STUDENT_RESOURCE_PREVIEW_MAX_ZOOM,
        Number(zoom) ||
        1
      )
    );


  studentResourcePreviewZoom =
    safeZoom;

  studentResourcePreviewFitMode =
    Boolean(
      fit
    );


  applyStudentResourcePreviewZoom();

}


function resetStudentResourcePreviewZoom(){

  setStudentResourcePreviewZoom(
    1,
    {
      fit:false
    }
  );

}


function fitStudentResourcePreview(){

  setStudentResourcePreviewZoom(
    1,
    {
      fit:true
    }
  );

}
async function toggleStudentResourcePreviewFullscreen(){

  const shell =
    document.querySelector(
      ".student-resource-preview-shell"
    );


  if (!shell){
    return;
  }


  try{

    if (
      document.fullscreenElement
    ){

      await document.exitFullscreen();

      return;

    }


    await shell.requestFullscreen();

  }catch(error){

    console.error(
      "Student resource fullscreen failed:",
      error
    );


    notifyAIFTWarning(
      "Your browser could not open the resource in fullscreen mode.",
      {
        title:
          "Fullscreen unavailable"
      }
    );

  }

}


function updateStudentResourceFullscreenButton(){

  const button =
    $("studentResourcePreviewFullscreenButton");


  if (!button){
    return;
  }


  const fullscreen =
    Boolean(
      document.fullscreenElement
    );


  button.setAttribute(
    "aria-label",
    fullscreen
      ? "Exit fullscreen preview"
      : "Open fullscreen preview"
  );


  button.setAttribute(
    "title",
    fullscreen
      ? "Exit fullscreen"
      : "Fullscreen"
  );


  button.innerHTML = `
    <i
      class="${
        fullscreen
          ? "fa-solid fa-down-left-and-up-right-to-center"
          : "fa-solid fa-up-right-and-down-left-from-center"
      }"
      aria-hidden="true"
    ></i>
  `;

}
/* =========================================================
   STUDENT RESOURCE PREVIEW CONTROLLER
========================================================= */

function clearStudentResourcePreviewMedia(){

  const image =
    $("studentResourcePreviewImage");

  const frame =
    $("studentResourcePreviewFrame");

  const video =
    $("studentResourcePreviewVideo");

  const audio =
    $("studentResourcePreviewAudio");


  if (image){
    image.removeAttribute(
      "src"
    );
  }


  if (frame){
    frame.src =
      "about:blank";
  }


  if (video){

    try{
      video.pause();
    }catch(error){
      console.warn(
        "Resource preview video could not be paused:",
        error
      );
    }

    video.removeAttribute(
      "src"
    );

    video.load();

  }


  if (audio){

    try{
      audio.pause();
    }catch(error){
      console.warn(
        "Resource preview audio could not be paused:",
        error
      );
    }

    audio.removeAttribute(
      "src"
    );

    audio.load();

  }

}

function closeStudentResourcePreview(){

  clearStudentResourcePreviewMedia();


  closeModal(
    "studentResourcePreviewModal"
  );


  studentResourcePreviewResource =
    null;


  hideStudentResourcePreviewPanels();

  showStudentResourcePreviewLoading(
    false
  );

}

function hideStudentResourcePreviewPanels(){

  [
    "studentResourceImagePreview",
    "studentResourceDocumentPreview",
    "studentResourceVideoPreview",
    "studentResourceAudioPreview",
    "studentResourceLinkPreview",
    "studentResourceUnsupportedPreview",
    "studentResourcePreviewError"
  ].forEach(id=>{

    const element=$(id);

    if(element){
      element.hidden=true;
    }

  });

}



function showStudentResourcePreviewLoading(show=true){

  const loading=$(
    "studentResourcePreviewLoading"
  );

  if(loading){

    loading.hidden=!show;

  }

}

function getVisibleStudentResources(){

  return buildStudentResources()
    .filter(resource=>{

      return !resource.hidden;

    });

}
function navigateStudentResourcePreview(
  direction
){

  if(
    !studentResourcePreviewResource
  ){
    return;
  }

  const resources=
    getVisibleStudentResources();

  const currentIndex=
    resources.findIndex(resource=>
      sameId(
        resource.id,
        studentResourcePreviewResource.id
      )
    );

  if(currentIndex===-1){
    return;
  }

  let nextIndex=
    currentIndex+
    direction;

  if(nextIndex<0){

    nextIndex=
      resources.length-1;

  }

  if(
    nextIndex>=
    resources.length
  ){

    nextIndex=0;

  }

  openStudentResourcePreview(
    resources[nextIndex].id
  );

}

function openStudentResourcePreview(
  resourceId
){

  const resource=
    buildStudentResources()
      .find(r=>
        sameId(
          r.id,
          resourceId
        )
      );

  if(!resource){

    notifyAIFTWarning(
      "This resource no longer exists."
    );

    return;

  }

  studentResourcePreviewResource =
    resource;

  studentResourcePreviewZoom =
    1;

  studentResourcePreviewFitMode =
    true;

  updateStudentResourcePreviewZoomControls();


  const recentResources =
    getStudentRecentlyOpenedResources()
      .filter(item =>
        String(item.id) !==
        String(resource.id)
      );


  recentResources.unshift({
    id:
      resource.id,

    title:
      resource.title,

    type:
      resource.type,

    className:
      resource.className,

    source:
      resource.source,

    url:
      resource.url,

    openedAt:
      new Date()
        .toISOString()
  });


  saveStudentRecentlyOpenedResources(
    recentResources
  );


  renderStudentRecentlyOpenedResources();


  showStudentResourcePreviewLoading(
    true
  );

  hideStudentResourcePreviewPanels();

  const previewTypeIcon =
    $("studentResourcePreviewTypeIcon");

  const previewTypeLabel =
    $("studentResourcePreviewTypeLabel");


  if (previewTypeIcon){

    previewTypeIcon.innerHTML = `
      <i
        class="${
          escapeHtml(
            getStudentResourceIcon(
              resource.type
            )
          )
        }"
        aria-hidden="true"
      ></i>
    `;

  }


  if (previewTypeLabel){

    previewTypeLabel.textContent =
      getStudentResourceTypeLabel(
        resource.type
      );

  }


  $("studentResourcePreviewTitle").textContent =
    resource.title;

  $("studentResourcePreviewDescription").textContent=
    resource.description||
    "No description available.";

  $("studentResourcePreviewDetailType").textContent=
    getStudentResourceTypeLabel(
      resource.type
    );

  $("studentResourcePreviewDetailClass").textContent=
    resource.className||
    "General";

  $("studentResourcePreviewDetailSource").textContent=
    resource.source||
    "Learning Resource";

  $("studentResourcePreviewDetailDate").textContent =
    formatDate(
      resource.createdAt
    );

  $("studentResourcePreviewDetailFileName").textContent=
    resource.originalName||
    resource.title;

  const tagsPanel=
    $("studentResourcePreviewTagsPanel");

  const tagsWrap=
    $("studentResourcePreviewTags");

  tagsWrap.innerHTML="";

  if(
    Array.isArray(resource.tags) &&
    resource.tags.length
  ){

    tagsPanel.hidden=false;

    resource.tags.forEach(tag=>{

      const span=
        document.createElement("span");

      span.textContent=tag;

      tagsWrap.appendChild(span);

    });

  }else{

    tagsPanel.hidden=true;

  }

  const personalActions =
    $("studentResourcePreviewPersonalActions");

  if (personalActions){

    personalActions.hidden =
      !resource.isPersonal;

  }


  const previewSaveButton =
    $("studentResourcePreviewSaveButton");

  const savedIds =
    getStudentSavedResourceIds();

  const isSaved =
    savedIds.has(
      String(resource.id)
    );


  if (previewSaveButton){

    previewSaveButton.setAttribute(
      "aria-pressed",
      String(
        isSaved
      )
    );


    previewSaveButton.innerHTML = `
      <i
        class="${
          isSaved
            ? "fa-solid"
            : "fa-regular"
        } fa-bookmark"
        aria-hidden="true"
      ></i>

      ${
        isSaved
          ? "Saved"
          : "Save"
      }
    `;

  }

  openModal(
    "studentResourcePreviewModal"
  );

const visibleResources =
  getVisibleStudentResources();

const previousButton =
  $("studentResourcePreviewPreviousButton");

const nextButton =
  $("studentResourcePreviewNextButton");

const disableNavigation =
  visibleResources.length <= 1;

previousButton.disabled =
  disableNavigation;

nextButton.disabled =
  disableNavigation;
  
  renderStudentResourcePreview(
    resource
  );

}
function renderStudentResourcePreview(
  resource
){

  clearStudentResourcePreviewMedia();

  hideStudentResourcePreviewPanels();

  showStudentResourcePreviewLoading(
    false
  );

  updateStudentResourcePreviewZoomControls();
  const url =
    String(
      resource?.url ||
      ""
    ).trim();


  if (!url){

    const errorPanel =
      $("studentResourcePreviewError");

    const errorMessage =
      $("studentResourcePreviewErrorMessage");


    if (errorPanel){
      errorPanel.hidden =
        false;
    }


    if (errorMessage){

      errorMessage.textContent =
        "This resource does not contain a usable file URL.";

    }

    return;

  }


  switch(
    String(
      resource.type ||
      ""
    ).toLowerCase()
  ){

    case "image": {

      const panel =
        $("studentResourceImagePreview");

      const image =
        $("studentResourcePreviewImage");


      if (panel){
        panel.hidden =
          false;
      }


      if (image){

const finishImageLoad = () => {

  showStudentResourcePreviewLoading(
    false
  );

  requestAnimationFrame(() => {

    fitStudentResourcePreview();

  });

};

image.onload = finishImageLoad;

image.onerror = () => {

  panel.hidden = true;

  showStudentResourcePreviewLoading(
    false
  );

  const errorPanel =
    $("studentResourcePreviewError");

  const errorMessage =
    $("studentResourcePreviewErrorMessage");

  if (errorPanel){
    errorPanel.hidden = false;
  }

  if (errorMessage){
    errorMessage.textContent =
      "The image could not be loaded.";
  }

};

image.src = url;

image.alt =
  resource.title ||
  "Learning resource image";

/* Cached images */
if (
  image.complete &&
  image.naturalWidth > 0
){
  finishImageLoad();
}

      }

      return;

    }


    case "video":

    case "recording": {

      const panel =
        $("studentResourceVideoPreview");

      const video =
        $("studentResourcePreviewVideo");


      if (panel){
        panel.hidden =
          false;
      }


      if (video){
        video.src =
          url;
      }

      return;

    }


    case "audio": {

      const panel =
        $("studentResourceAudioPreview");

      const audio =
        $("studentResourcePreviewAudio");

      const title =
        $("studentResourcePreviewAudioTitle");


      if (panel){
        panel.hidden =
          false;
      }


      if (audio){
        audio.src =
          url;
      }


      if (title){

        title.textContent =
          resource.title ||
          "Audio resource";

      }

      return;

    }


    case "pdf":

    case "text": {

      const panel =
        $("studentResourceDocumentPreview");

      const frame =
        $("studentResourcePreviewFrame");


      if (panel){
        panel.hidden =
          false;
      }


      if (frame){
        frame.src =
          url;
      }

      return;

    }


    case "document":

    case "presentation":

    case "spreadsheet": {

      const panel =
        $("studentResourceDocumentPreview");

      const frame =
        $("studentResourcePreviewFrame");


      if (panel){
        panel.hidden =
          false;
      }


      if (frame){

        frame.src =
          `https://view.officeapps.live.com/op/embed.aspx?src=${
            encodeURIComponent(
              url
            )
          }`;

      }

      return;

    }


    case "link": {

      const panel =
        $("studentResourceLinkPreview");


      if (panel){
        panel.hidden =
          false;
      }

      return;

    }


    default: {

      const panel =
        $("studentResourceUnsupportedPreview");


      if (panel){
        panel.hidden =
          false;
      }

    }

  }

}


/* =========================================================
   STUDENT RESOURCE CONFIRMATION CONTROLLER
========================================================= */

let studentResourceConfirmationResolver =
  null;


function closeStudentResourceConfirmation(
  approved = false
){

  const modal =
    $("studentResourceConfirmModal");


  modal?.classList.remove(
    "show"
  );


  modal?.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.classList.remove(
    "student-studio-menu-open"
  );


  if (
    typeof studentResourceConfirmationResolver ===
    "function"
  ){

    const resolve =
      studentResourceConfirmationResolver;


    studentResourceConfirmationResolver =
      null;


    resolve(
      Boolean(
        approved
      )
    );

  }

}


function confirmStudentResourceDeletion(
  resource
){

  const modal =
    $("studentResourceConfirmModal");

  const message =
    $("studentResourceConfirmMessage");


  if (!modal){

    return Promise.resolve(
      false
    );

  }


  if (
    studentResourceConfirmationResolver
  ){

    closeStudentResourceConfirmation(
      false
    );

  }


  if (message){

    message.textContent =
      `"${String(
        resource?.title ||
        "This resource"
      )}" will be permanently deleted. This action cannot be undone.`;

  }


  modal.classList.add(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "student-studio-menu-open"
  );


  window.setTimeout(
    () => {

      $("cancelStudentResourceConfirmButton")
        ?.focus();

    },
    50
  );


  return new Promise(
    resolve => {

      studentResourceConfirmationResolver =
        resolve;

    }
  );

}

/* =========================================================
   DELETE PERSONAL STUDENT RESOURCE
========================================================= */

async function deleteStudentResource(
  resourceId
){

  const cleanResourceId =
    String(
      resourceId ||
      ""
    ).trim();


  if (!cleanResourceId){
    return;
  }


  const resource =
    buildStudentResources()
      .find(item =>
        String(item.id) ===
        cleanResourceId
      );


  if (
    !resource ||
    !resource.isPersonal
  ){

    notifyAIFTWarning(
      "Only your personal resources can be deleted.",
      {
        title:
          "Resource cannot be deleted"
      }
    );

    return;
  }


  const confirmed =
    await confirmStudentResourceDeletion(
      resource
    );


  if (!confirmed){
    return;
  }


  try{

    await apiSend(
      `/api/student-resources/${
        encodeURIComponent(
          cleanResourceId
        )
      }`,
      "DELETE",
      {}
    );


    state.studentResources =
      asArray(
        state.studentResources
      )
        .filter(item =>
          !sameId(
            item?._id ||
            item?.id,
            cleanResourceId
          )
        );


    const savedIds =
      getStudentSavedResourceIds();

    savedIds.delete(
      cleanResourceId
    );

    saveStudentResourceIds(
      savedIds
    );


    const recentResources =
      getStudentRecentlyOpenedResources()
        .filter(item =>
          String(item.id) !==
          cleanResourceId
        );

    saveStudentRecentlyOpenedResources(
      recentResources
    );


    renderResources();

    renderStudentRecentlyOpenedResources();


    notifyAIFTSuccess(
      "The personal resource was deleted.",
      {
        title:
          "Resource deleted"
      }
    );

  }catch(error){

    console.error(
      "Student resource deletion failed:",
      error
    );


    notifyAIFTError(
      error?.message ||
      "AIFT could not delete this resource.",
      {
        title:
          "Delete failed"
      }
    );

  }

}

/* =========================================================
   RESOURCE VIEW
========================================================= */

function setStudentResourceView(
  view
){

  studentResourceView =
    view === "list"
      ? "list"
      : "grid";


  localStorage.setItem(
    STUDENT_RESOURCE_VIEW_STORAGE_KEY,
    studentResourceView
  );


  const gridButton =
    $("resourceGridViewButton");

  const listButton =
    $("resourceListViewButton");


  gridButton?.classList.toggle(
    "active",
    studentResourceView ===
      "grid"
  );


  listButton?.classList.toggle(
    "active",
    studentResourceView ===
      "list"
  );


  gridButton?.setAttribute(
    "aria-pressed",
    String(
      studentResourceView ===
        "grid"
    )
  );


  listButton?.setAttribute(
    "aria-pressed",
    String(
      studentResourceView ===
        "list"
    )
  );


  renderResources();

}

/* =========================================================
   RESET RESOURCE FILTERS
========================================================= */

function resetStudentResourceFilters(){

  const searchInput =
    $("resourceSearch");

  const classFilter =
    $("resourceClassFilter");

  const typeFilter =
    $("resourceTypeFilter");

  const sortFilter =
    $("resourceSortFilter");

  const clearButton =
    $("clearResourceSearchButton");


  if (searchInput){
    searchInput.value = "";
  }


  if (classFilter){
    classFilter.value = "";
  }


  if (typeFilter){
    typeFilter.value = "all";
  }


  if (sortFilter){
    sortFilter.value = "recent";
  }


  if (clearButton){
    clearButton.hidden = true;
  }


  studentResourceActiveCategory =
    "all";


  document
    .querySelectorAll(
      "[data-resource-category]"
    )
    .forEach(button => {
      button.classList.remove(
        "active"
      );
    });


  renderResources();

}


/* =========================================================
   STUDENT RESOURCE UPLOAD CONTROLLER
========================================================= */

const MAX_STUDENT_RESOURCE_FILE_SIZE =
  20 * 1024 * 1024;


const ALLOWED_STUDENT_RESOURCE_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",

    "application/pdf",

    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "text/plain",
    "text/csv"
  ]);


let studentResourceSelectedFile =
  null;

let studentResourceUploadInProgress =
  false;

let studentResourceUploadControlsBound =
  false;
let studentResourceEditingId =
  "";
let studentResourcePreviewResource =
  null;

let studentResourcePreviewZoom =
  1;

let studentResourcePreviewFitMode =
  true;

function formatStudentResourceFileSize(
  bytes
){

  const size =
    Math.max(
      0,
      Number(bytes) ||
      0
    );


  if (size < 1024){
    return `${size} B`;
  }


  if (
    size <
    1024 * 1024
  ){
    return `${
      (
        size /
        1024
      ).toFixed(1)
    } KB`;
  }


  return `${
    (
      size /
      (
        1024 *
        1024
      )
    ).toFixed(1)
  } MB`;

}
function setStudentResourceUploadMessage(
  message = "",
  type = "error"
){

  const messageElement =
    $("studentResourceUploadMessage");


  if (!messageElement){
    return;
  }


  const cleanMessage =
    String(
      message ||
      ""
    ).trim();


  messageElement.hidden =
    !cleanMessage;


  messageElement.textContent =
    cleanMessage;


  messageElement.classList.toggle(
    "success",
    type === "success"
  );

}

function setStudentResourceUploadProgress({
  visible = false,
  percentage = 0,
  label = "Uploading resource..."
} = {}){

  const container =
    $("studentResourceUploadProgress");

  const progressBar =
    $("studentResourceUploadProgressBar");

  const progressValue =
    $("studentResourceUploadProgressValue");

  const progressLabel =
    $("studentResourceUploadProgressLabel");


  const safePercentage =
    Math.max(
      0,
      Math.min(
        100,
        Math.round(
          Number(percentage) ||
          0
        )
      )
    );


  if (container){
    container.hidden =
      !visible;
  }


  if (progressBar){
    progressBar.style.width =
      `${safePercentage}%`;
  }


  if (progressValue){
    progressValue.textContent =
      `${safePercentage}%`;
  }


  if (progressLabel){
    progressLabel.textContent =
      String(
        label ||
        "Uploading resource..."
      );
  }

}

function clearStudentResourceSelectedFile(){

  studentResourceSelectedFile =
    null;


  const fileInput =
    $("studentResourceFileInput");

  const selectedFilePanel =
    $("studentResourceSelectedFile");

  const submitButton =
    $("submitStudentResourceUploadButton");


  if (fileInput){
    fileInput.value = "";
  }


  if (selectedFilePanel){
    selectedFilePanel.hidden =
      true;
  }


  if (submitButton){
    submitButton.disabled =
      true;
  }


  setStudentResourceUploadMessage("");

  setStudentResourceUploadProgress({
    visible:false,
    percentage:0
  });

}



function validateStudentResourceFile(
  file
){

  if (!file){

    return {
      valid:false,
      message:
        "Please select a learning resource file."
    };

  }


  const mimeType =
    String(
      file.type ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    !ALLOWED_STUDENT_RESOURCE_MIME_TYPES.has(
      mimeType
    )
  ){

    return {
      valid:false,
      message:
        "The selected file must be an image, PDF, Word, PowerPoint, Excel, TXT, or CSV file."
    };

  }


  if (
    Number(file.size) >
    MAX_STUDENT_RESOURCE_FILE_SIZE
  ){

    return {
      valid:false,
      message:
        "The selected file is larger than the 20 MB upload limit."
    };

  }


  if (
    Number(file.size) <= 0
  ){

    return {
      valid:false,
      message:
        "The selected file appears to be empty."
    };

  }


  return {
    valid:true,
    message:""
  };

}

/* =========================================================
   RESOURCE FILE TYPE HELPERS
========================================================= */

function getStudentResourceType({
  mimeType = "",
  originalName = ""
} = {}){

  const type =
    String(mimeType)
      .toLowerCase();

  const name =
    String(originalName)
      .toLowerCase();


  if (type.startsWith("image/")){
    return "image";
  }

  if (type.startsWith("video/")){
    return "video";
  }

  if (type.startsWith("audio/")){
    return "audio";
  }

  if (
    type === "application/pdf" ||
    name.endsWith(".pdf")
  ){
    return "pdf";
  }

  if (
    type.includes("word") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx")
  ){
    return "document";
  }

  if (
    type.includes("presentation") ||
    name.endsWith(".ppt") ||
    name.endsWith(".pptx")
  ){
    return "presentation";
  }

  if (
    type.includes("excel") ||
    type.includes("spreadsheet") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsx")
  ){
    return "spreadsheet";
  }

  if (
    type.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".csv")
  ){
    return "text";
  }

  return "file";
}



function getStudentResourceTypeLabel(
  type
){

  switch(type){

    case "image":
      return "Image";

    case "video":
      return "Video";

    case "audio":
      return "Audio";

    case "pdf":
      return "PDF";

    case "document":
      return "Document";

    case "presentation":
      return "Presentation";

    case "spreadsheet":
      return "Spreadsheet";

    case "text":
      return "Text";

    default:
      return "File";

  }

}



function getStudentResourceIcon(
  type
){

  switch(type){

    case "image":
      return "fa-solid fa-image";

    case "video":
      return "fa-solid fa-video";

    case "audio":
      return "fa-solid fa-music";

    case "pdf":
      return "fa-solid fa-file-pdf";

    case "document":
      return "fa-solid fa-file-word";

    case "presentation":
      return "fa-solid fa-file-powerpoint";

    case "spreadsheet":
      return "fa-solid fa-file-excel";

    case "text":
      return "fa-solid fa-file-lines";

    default:
      return "fa-solid fa-file";

  }

}
function selectStudentResourceFile(
  file
){

  const validation =
    validateStudentResourceFile(
      file
    );


  if (!validation.valid){

    clearStudentResourceSelectedFile();

    setStudentResourceUploadMessage(
      validation.message
    );

    notifyAIFTWarning(
      validation.message,
      {
        title:
          "File not accepted"
      }
    );

    return;
  }


  studentResourceSelectedFile =
    file;


  const selectedFilePanel =
    $("studentResourceSelectedFile");

  const selectedFileName =
    $("studentResourceSelectedFileName");

  const selectedFileDetails =
    $("studentResourceSelectedFileDetails");

  const selectedFileIcon =
    $("studentResourceSelectedFileIcon");

  const titleInput =
    $("studentResourceTitleInput");

  const submitButton =
    $("submitStudentResourceUploadButton");


  const resourceType =
    getStudentResourceType({
      mimeType:
        file.type,

      originalName:
        file.name
    });


  if (selectedFilePanel){
    selectedFilePanel.hidden =
      false;
  }


  if (selectedFileName){
    selectedFileName.textContent =
      file.name ||
      "Selected resource";
  }


  if (selectedFileDetails){

    selectedFileDetails.textContent =
      [
        getStudentResourceTypeLabel(
          resourceType
        ),

        formatStudentResourceFileSize(
          file.size
        )
      ].join(" • ");

  }


  if (selectedFileIcon){

    selectedFileIcon.className =
      getStudentResourceIcon(
        resourceType
      );

  }


  if (
    titleInput &&
    !titleInput.value.trim()
  ){

    titleInput.value =
      String(
        file.name ||
        "Learning resource"
      )
        .replace(
          /\.[^.]+$/,
          ""
        )
        .replace(
          /[_-]+/g,
          " "
        )
        .trim();

  }


  if (submitButton){
    submitButton.disabled =
      false;
  }


  setStudentResourceUploadMessage("");

}

function hydrateStudentResourceUploadClassSelect(){

  const select =
    $("studentResourceClassInput");


  if (!select){
    return;
  }


  const previousValue =
    String(
      select.value ||
      ""
    );


  const classes =
    getStudentClasses()
      .map(classItem => ({
        id:
          normalizeId(
            classItem?._id ||
            classItem?.id
          ),

        title:
          String(
            classItem?.title ||
            classItem?.name ||
            classItem?.subject ||
            "Class"
          ).trim()
      }))
      .filter(classItem =>
        classItem.id
      )
      .sort(
        (
          first,
          second
        ) =>
          first.title.localeCompare(
            second.title
          )
      );


  select.innerHTML = `
    <option value="">
      General notes
    </option>

    ${
      classes
        .map(classItem => `
          <option
            value="${
              escapeHtml(
                classItem.id
              )
            }"
          >
            ${
              escapeHtml(
                classItem.title
              )
            }
          </option>
        `)
        .join("")
    }
  `;


  if (
    previousValue &&
    classes.some(classItem =>
      sameId(
        classItem.id,
        previousValue
      )
    )
  ){

    select.value =
      previousValue;

  }

}
function resetStudentResourceUploadForm(){
    studentResourceEditingId =
    "";

  const form =
    $("studentResourceUploadForm");

  form?.reset();


  clearStudentResourceSelectedFile();


  const categoryInput =
    $("studentResourceCategoryInput");

  if (categoryInput){
    categoryInput.value =
      "note";
  }


  setStudentResourceUploadMessage("");

  setStudentResourceUploadProgress({
    visible:false,
    percentage:0
  });

}

/* =========================================================
   EDIT PERSONAL STUDENT RESOURCE
========================================================= */

function openStudentResourceEditModal(
  resourceId
){

  const cleanResourceId =
    String(
      resourceId ||
      ""
    ).trim();


  const resource =
    buildStudentResources()
      .find(item =>
        String(item.id) ===
        cleanResourceId
      );


  if (
    !resource ||
    !resource.isPersonal
  ){

    notifyAIFTWarning(
      "Only your personal resources can be edited.",
      {
        title:
          "Resource cannot be edited"
      }
    );

    return;

  }


  studentResourceEditingId =
    cleanResourceId;


  hydrateStudentResourceUploadClassSelect();


  const modal =
    $("studentResourceUploadModal");

  const dropZone =
    $("studentResourceDropZone");

  const selectedFile =
    $("studentResourceSelectedFile");

  const progress =
    $("studentResourceUploadProgress");

  const titleInput =
    $("studentResourceTitleInput");

  const descriptionInput =
    $("studentResourceDescriptionInput");

  const classInput =
    $("studentResourceClassInput");

  const categoryInput =
    $("studentResourceCategoryInput");

  const tagsInput =
    $("studentResourceTagsInput");

  const modalTitle =
    $("studentResourceUploadTitle");

  const modalDescription =
    $("studentResourceUploadDescription");

  const submitButton =
    $("submitStudentResourceUploadButton");


  if (dropZone){
    dropZone.hidden =
      true;
  }


  if (selectedFile){
    selectedFile.hidden =
      true;
  }


  if (progress){
    progress.hidden =
      true;
  }


  if (modalTitle){
    modalTitle.textContent =
      "Edit resource";
  }


  if (modalDescription){

    modalDescription.textContent =
      "Update the title, class, category, description, or tags for this personal resource.";

  }


  if (titleInput){
    titleInput.value =
      resource.title ||
      "";
  }


  if (descriptionInput){

    descriptionInput.value =
      resource.description ||
      "";

  }


  if (classInput){

    classInput.value =
      resource.classId ||
      "";

  }


  if (categoryInput){

    categoryInput.value =
      resource.category ||
      "note";

  }


  if (tagsInput){

    tagsInput.value =
      asArray(
        resource.tags
      ).join(", ");

  }


  if (submitButton){

    submitButton.disabled =
      false;

    submitButton.innerHTML = `
      <i
        class="fa-solid fa-floppy-disk"
        aria-hidden="true"
      ></i>

      Save changes
    `;

  }


  openModal(
    "studentResourceUploadModal"
  );


  window.setTimeout(
    () => {

      titleInput?.focus();

    },
    60
  );

}

async function updateStudentResourceRecord(){

  const resourceId =
    String(
      studentResourceEditingId ||
      ""
    ).trim();


  if (!resourceId){
    return;
  }


  const titleInput =
    $("studentResourceTitleInput");


  const title =
    String(
      titleInput?.value ||
      ""
    ).trim();


  if (!title){

    setStudentResourceUploadMessage(
      "Please enter a title for this resource."
    );

    titleInput?.focus();

    return;

  }


  const submitButton =
    $("submitStudentResourceUploadButton");


  setDashboardButtonLoading(
    submitButton,
    true,
    "Saving..."
  );


  try{

    const response =
      await apiSend(
        `/api/student-resources/${
          encodeURIComponent(
            resourceId
          )
        }`,
        "PATCH",
        {
          title,

          description:
            String(
              $("studentResourceDescriptionInput")
                ?.value ||
              ""
            ).trim(),

          classId:
            String(
              $("studentResourceClassInput")
                ?.value ||
              ""
            ).trim() ||
            null,

          category:
            String(
              $("studentResourceCategoryInput")
                ?.value ||
              "note"
            )
              .trim()
              .toLowerCase(),

          tags:
            String(
              $("studentResourceTagsInput")
                ?.value ||
              ""
            )
              .split(",")
              .map(tag =>
                tag
                  .trim()
                  .toLowerCase()
              )
              .filter(Boolean)
              .slice(
                0,
                20
              )
        }
      );


    const updatedResource =
      response?.resource ||
      response?.data ||
      null;


    if (!updatedResource){

      throw new Error(
        "The updated resource could not be confirmed."
      );

    }


    const existingIndex =
      state.studentResources
        .findIndex(item =>
          sameId(
            item?._id ||
            item?.id,
            resourceId
          )
        );


    if (existingIndex >= 0){

      state.studentResources[
        existingIndex
      ] =
        updatedResource;

    }else{

      state.studentResources.unshift(
        updatedResource
      );

    }


    renderResources();


    notifyAIFTSuccess(
      "Your personal resource was updated.",
      {
        title:
          "Changes saved"
      }
    );


    closeModal(
      "studentResourceUploadModal"
    );


    resetStudentResourceUploadForm();

  }catch(error){

    console.error(
      "Student resource update failed:",
      error
    );


    setStudentResourceUploadMessage(
      error?.message ||
      "AIFT could not update this resource."
    );


    notifyAIFTError(
      error?.message ||
      "AIFT could not update this resource.",
      {
        title:
          "Update failed"
      }
    );

  }finally{

    setDashboardButtonLoading(
      submitButton,
      false
    );

  }

}

function openStudentResourceUploadModal(){

    studentResourceEditingId =
    "";

  hydrateStudentResourceUploadClassSelect();

  resetStudentResourceUploadForm();
    const dropZone =
    $("studentResourceDropZone");

  const modalTitle =
    $("studentResourceUploadTitle");

  const modalDescription =
    $("studentResourceUploadDescription");

  const submitButton =
    $("submitStudentResourceUploadButton");


  if (dropZone){
    dropZone.hidden =
      false;
  }


  if (modalTitle){
    modalTitle.textContent =
      "Upload notes";
  }


  if (modalDescription){

    modalDescription.textContent =
      "Add your own study notes, references, images, spreadsheets, presentations, and documents.";

  }


  if (submitButton){

    submitButton.innerHTML = `
      <i
        class="fa-solid fa-cloud-arrow-up"
        aria-hidden="true"
      ></i>

      Upload resource
    `;

  }


  const resourceClassFilter =
    $("resourceClassFilter");

  const uploadClassInput =
    $("studentResourceClassInput");


  if (
    resourceClassFilter?.value &&
    uploadClassInput
  ){

    const optionExists =
      Array.from(
        uploadClassInput.options
      )
        .some(option =>
          sameId(
            option.value,
            resourceClassFilter.value
          )
        );


    if (optionExists){

      uploadClassInput.value =
        resourceClassFilter.value;

    }

  }


  openModal(
    "studentResourceUploadModal"
  );


  window.setTimeout(
    () => {

      $("studentResourceDropZone")
        ?.focus();

    },
    80
  );

}

function closeStudentResourceUploadModal(){

  if (studentResourceUploadInProgress){

    notifyAIFTWarning(
      "Please wait until the current upload is complete.",
      {
        title:
          "Upload in progress"
      }
    );

    return;
  }


  closeModal(
    "studentResourceUploadModal"
  );


  resetStudentResourceUploadForm();

}
/* =========================================================
   UPLOAD STUDENT RESOURCE FILE
========================================================= */

function uploadStudentResourceFile(
  file,
  onProgress
){

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const request =
        new XMLHttpRequest();

      const formData =
        new FormData();


      formData.append(
        "resource",
        file
      );


      request.open(
        "POST",
        API +
          "/api/uploads/student-resource",
        true
      );


      request.setRequestHeader(
        "Authorization",
        "Bearer " + token
      );


      request.upload.addEventListener(
        "progress",
        event => {

          if (
            !event.lengthComputable
          ){
            return;
          }


          const percentage =
            Math.round(
              (
                event.loaded /
                event.total
              ) *
              75
            );


          if (
            typeof onProgress ===
            "function"
          ){

            onProgress(
              Math.max(
                1,
                Math.min(
                  75,
                  percentage
                )
              )
            );

          }

        }
      );


      request.addEventListener(
        "load",
        () => {

          let response =
            null;


          try{

            response =
              JSON.parse(
                request.responseText ||
                "{}"
              );

          }catch(error){

            reject(
              new Error(
                "The upload server returned an invalid response."
              )
            );

            return;

          }


          if (
            request.status < 200 ||
            request.status >= 300
          ){

            reject(
              new Error(
                response?.message ||
                "The selected resource could not be uploaded."
              )
            );

            return;

          }


          resolve(
            response
          );

        }
      );


      request.addEventListener(
        "error",
        () => {

          reject(
            new Error(
              "A network error stopped the resource upload."
            )
          );

        }
      );


      request.addEventListener(
        "abort",
        () => {

          reject(
            new Error(
              "The resource upload was cancelled."
            )
          );

        }
      );


      request.send(
        formData
      );

    }
  );

}
/* =========================================================
   SAVE STUDENT RESOURCE RECORD
========================================================= */

async function saveStudentResourceRecord(
  uploadedFile
){

  const title =
    String(
      $("studentResourceTitleInput")
        ?.value ||
      uploadedFile?.originalName ||
      "Learning resource"
    ).trim();


  const description =
    String(
      $("studentResourceDescriptionInput")
        ?.value ||
      ""
    ).trim();


  const classId =
    String(
      $("studentResourceClassInput")
        ?.value ||
      ""
    ).trim();


  const category =
    String(
      $("studentResourceCategoryInput")
        ?.value ||
      "note"
    )
      .trim()
      .toLowerCase();


  const tags =
    String(
      $("studentResourceTagsInput")
        ?.value ||
      ""
    )
      .split(",")
      .map(tag =>
        tag
          .trim()
          .toLowerCase()
      )
      .filter(Boolean)
      .slice(
        0,
        20
      );


  return apiSend(
    "/api/student-resources",
    "POST",
    {
      title,

      description,

      classId:
        classId ||
        null,

      category,

      tags,

      url:
        uploadedFile?.secureUrl ||
        uploadedFile?.url,

      secureUrl:
        uploadedFile?.secureUrl ||
        uploadedFile?.url,

      publicId:
        uploadedFile?.publicId ||
        "",

      originalName:
        uploadedFile?.originalName ||
        studentResourceSelectedFile?.name ||
        title,

      mimeType:
        uploadedFile?.mimeType ||
        studentResourceSelectedFile?.type ||
        "application/octet-stream",

      attachmentType:
        uploadedFile?.attachmentType ||
        getStudentResourceType({
          mimeType:
            uploadedFile?.mimeType ||
            studentResourceSelectedFile?.type,

          originalName:
            uploadedFile?.originalName ||
            studentResourceSelectedFile?.name
        }),

      resourceType:
        uploadedFile?.resourceType ||
        "raw",

      size:
        Number(
          uploadedFile?.bytes ||
          studentResourceSelectedFile?.size ||
          0
        ),

      format:
        uploadedFile?.format ||
        "",

      width:
        uploadedFile?.width ??
        null,

      height:
        uploadedFile?.height ??
        null
    }
  );

}
/* =========================================================
   SUBMIT STUDENT RESOURCE UPLOAD
========================================================= */

async function submitStudentResourceUpload(){

    if (studentResourceEditingId){

    await updateStudentResourceRecord();

    return;

  }

  if (
    studentResourceUploadInProgress
  ){
    return;
  }


  const file =
    studentResourceSelectedFile;


  const validation =
    validateStudentResourceFile(
      file
    );


  if (!validation.valid){

    setStudentResourceUploadMessage(
      validation.message
    );

    return;

  }


  const titleInput =
    $("studentResourceTitleInput");


  const title =
    String(
      titleInput?.value ||
      ""
    ).trim();


  if (!title){

    setStudentResourceUploadMessage(
      "Please enter a title for this resource."
    );


    titleInput?.focus();

    return;

  }


  const submitButton =
    $("submitStudentResourceUploadButton");

  const cancelButton =
    $("cancelStudentResourceUploadButton");

  const closeButton =
    $("closeStudentResourceUploadModalButton");

  const removeButton =
    $("removeStudentResourceFileButton");


  studentResourceUploadInProgress =
    true;


  setStudentResourceUploadMessage("");


  setStudentResourceUploadProgress({
    visible:
      true,

    percentage:
      1,

    label:
      "Uploading file..."
  });


  setDashboardButtonLoading(
    submitButton,
    true,
    "Uploading..."
  );


  cancelButton?.setAttribute(
    "disabled",
    ""
  );

  closeButton?.setAttribute(
    "disabled",
    ""
  );

  removeButton?.setAttribute(
    "disabled",
    ""
  );


  try{

    /*
      Stage 1:
      Upload the original file to Cloudinary.
    */

    const uploadedFile =
      await uploadStudentResourceFile(
        file,
        percentage => {

          setStudentResourceUploadProgress({
            visible:
              true,

            percentage,

            label:
              "Uploading file..."
          });

        }
      );


    if (
      !uploadedFile?.url &&
      !uploadedFile?.secureUrl
    ){

      throw new Error(
        "The upload completed without a usable file URL."
      );

    }


    /*
      Stage 2:
      Save the file information in MongoDB.
    */

    setStudentResourceUploadProgress({
      visible:
        true,

      percentage:
        82,

      label:
        "Saving resource..."
    });


    const savedResponse =
      await saveStudentResourceRecord(
        uploadedFile
      );


    const savedResource =
      savedResponse?.resource ||
      savedResponse?.data ||
      null;


    if (!savedResource){

      throw new Error(
        "The resource was uploaded, but its database record could not be confirmed."
      );

    }


    /*
      Update local state immediately without waiting for a
      complete Student Studio reload.
    */

    state.studentResources =
      asArray(
        state.studentResources
      )
        .filter(resource =>
          !sameId(
            resource?._id ||
            resource?.id,

            savedResource?._id ||
            savedResource?.id
          )
        );


    state.studentResources.unshift(
      savedResource
    );


    setStudentResourceUploadProgress({
      visible:
        true,

      percentage:
        100,

      label:
        "Resource saved"
    });


    hydrateStudentResourceClassFilter();

    renderResources();


    setStudentResourceUploadMessage(
      "Your learning resource was uploaded successfully.",
      "success"
    );


    notifyAIFTSuccess(
      "Your personal learning resource is now available in Resources.",
      {
        title:
          "Resource uploaded"
      }
    );


    window.setTimeout(
      () => {

        closeModal(
          "studentResourceUploadModal"
        );

        resetStudentResourceUploadForm();

      },
      650
    );

  }catch(error){

    console.error(
      "Student resource submission failed:",
      error
    );


    setStudentResourceUploadMessage(
      error?.message ||
      "AIFT could not upload this learning resource."
    );


    notifyAIFTError(
      error?.message ||
      "AIFT could not upload this learning resource.",
      {
        title:
          "Upload failed"
      }
    );

  }finally{

    studentResourceUploadInProgress =
      false;


    setDashboardButtonLoading(
      submitButton,
      false
    );


    cancelButton?.removeAttribute(
      "disabled"
    );

    closeButton?.removeAttribute(
      "disabled"
    );

    removeButton?.removeAttribute(
      "disabled"
    );


    if (submitButton){

      submitButton.disabled =
        !studentResourceSelectedFile;

    }

  }

}



function bindStudentResourceUploadControls(){

  if (
    studentResourceUploadControlsBound
  ){
    return;
  }


  const modal =
    $("studentResourceUploadModal");

  const form =
    $("studentResourceUploadForm");

  const dropZone =
    $("studentResourceDropZone");

  const fileInput =
    $("studentResourceFileInput");

  const browseButton =
    $("studentResourceBrowseButton");

  const removeButton =
    $("removeStudentResourceFileButton");

  const closeButton =
    $("closeStudentResourceUploadModalButton");

  const cancelButton =
    $("cancelStudentResourceUploadButton");

  const submitButton =
    $("submitStudentResourceUploadButton");


  if (
    !modal ||
    !form ||
    !dropZone ||
    !fileInput
  ){
    return;
  }


  browseButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      event.stopPropagation();

      fileInput.click();

    }
  );


  dropZone.addEventListener(
    "click",
    event => {

      if (
        event.target.closest(
          "#studentResourceBrowseButton"
        )
      ){
        return;
      }

      fileInput.click();

    }
  );


  dropZone.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Enter" ||
        event.key === " "
      ){

        event.preventDefault();

        fileInput.click();

      }

    }
  );


  fileInput.addEventListener(
    "change",
    () => {

      selectStudentResourceFile(
        fileInput.files?.[0] ||
        null
      );

    }
  );


  [
    "dragenter",
    "dragover"
  ].forEach(eventName => {

    dropZone.addEventListener(
      eventName,
      event => {

        event.preventDefault();

        event.stopPropagation();

        dropZone.classList.add(
          "dragover"
        );

      }
    );

  });


  [
    "dragleave",
    "drop"
  ].forEach(eventName => {

    dropZone.addEventListener(
      eventName,
      event => {

        event.preventDefault();

        event.stopPropagation();

        dropZone.classList.remove(
          "dragover"
        );

      }
    );

  });


  dropZone.addEventListener(
    "drop",
    event => {

      const file =
        event.dataTransfer
          ?.files?.[0] ||
        null;


      if (file){

        selectStudentResourceFile(
          file
        );

      }

    }
  );


  removeButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      clearStudentResourceSelectedFile();

      dropZone.focus();

    }
  );


  closeButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeStudentResourceUploadModal();

    }
  );


  cancelButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeStudentResourceUploadModal();

    }
  );


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      submitStudentResourceUpload();

    }
  );


  submitButton?.addEventListener(
    "click",
    event => {

      /*
        The button belongs to the form through its form
        attribute. This guard prevents accidental duplicate
        submission in older browsers.
      */

      if (
        studentResourceUploadInProgress
      ){

        event.preventDefault();

      }

    }
  );


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ){

        closeStudentResourceUploadModal();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape" ||
        !modal.classList.contains(
          "show"
        )
      ){
        return;
      }


      event.preventDefault();

      closeStudentResourceUploadModal();

    }
  );


  studentResourceUploadControlsBound =
    true;

}

/* =========================================================
   BIND RESOURCE CENTER CONTROLS
========================================================= */

function bindStudentResourceControls(){

  if (studentResourceControlsBound){
    return;
  }
  const confirmModal =
    $("studentResourceConfirmModal");

  const cancelConfirmButton =
    $("cancelStudentResourceConfirmButton");

  const approveConfirmButton =
    $("approveStudentResourceConfirmButton");

  const section =
    $("section-resources");

  const searchInput =
    $("resourceSearch");

  const clearSearchButton =
    $("clearResourceSearchButton");

  const classFilter =
    $("resourceClassFilter");

  const typeFilter =
    $("resourceTypeFilter");

  const sortFilter =
    $("resourceSortFilter");

  const gridButton =
    $("resourceGridViewButton");

  const listButton =
    $("resourceListViewButton");

  const resetButton =
    $("resetResourceFiltersButton");

  const refreshButton =
    $("resourceRefreshButton");

  const retryButton =
    $("retryStudentResourcesButton");

  const uploadButton =
    $("resourceUploadButton");

  const sidebarUploadButton =
    $("resourceSidebarUploadButton");


  if (
    !section ||
    !searchInput
  ){
    return;
  }


  let searchTimer =
    null;


  searchInput.addEventListener(
    "input",
    () => {

      window.clearTimeout(
        searchTimer
      );


      clearSearchButton.hidden =
        !searchInput.value.trim();


      searchTimer =
        window.setTimeout(
          () => {
            renderResources();
          },
          150
        );

    }
  );


  searchInput.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ){

        event.preventDefault();

        searchInput.value = "";

        clearSearchButton.hidden =
          true;

        renderResources();

      }


      if (
        event.key ===
        "Enter"
      ){

        event.preventDefault();

        window.clearTimeout(
          searchTimer
        );

        renderResources();

      }

    }
  );


  clearSearchButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      searchInput.value = "";

      clearSearchButton.hidden =
        true;

      searchInput.focus();

      renderResources();

    }
  );


  classFilter?.addEventListener(
    "change",
    () => {

      studentResourceActiveCategory =
        "all";


      document
        .querySelectorAll(
          "[data-resource-category]"
        )
        .forEach(button => {
          button.classList.remove(
            "active"
          );
        });


      renderResources();

    }
  );


  typeFilter?.addEventListener(
    "change",
    () => {

      document
        .querySelectorAll(
          "[data-resource-category]"
        )
        .forEach(button => {
          button.classList.remove(
            "active"
          );
        });

      renderResources();

    }
  );


  sortFilter?.addEventListener(
    "change",
    renderResources
  );


  gridButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      setStudentResourceView(
        "grid"
      );

    }
  );


  listButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      setStudentResourceView(
        "list"
      );

    }
  );


  resetButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      resetStudentResourceFilters();

    }
  );


  refreshButton?.addEventListener(
    "click",
    async event => {

      event.preventDefault();


      setDashboardButtonLoading(
        refreshButton,
        true,
        "Refreshing..."
      );


      try{

        await loadAll();

        hydrateStudentResourceClassFilter();

        renderResources();


        notifyAIFTSuccess(
          "Your learning resources are up to date.",
          {
            title:
              "Resources refreshed"
          }
        );

      }catch(error){

        console.error(
          "Student resource refresh failed:",
          error
        );


        notifyAIFTError(
          error?.message ||
          "AIFT could not refresh your learning resources.",
          {
            title:
              "Refresh failed"
          }
        );

      }finally{

        setDashboardButtonLoading(
          refreshButton,
          false
        );

      }

    }
  );


  retryButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      refreshButton?.click();

    }
  );


  const openUploadWorkspace =
    event => {

      event?.preventDefault();

      bindStudentResourceUploadControls();

      openStudentResourceUploadModal();

    };


  uploadButton?.addEventListener(
    "click",
    openUploadWorkspace
  );


  sidebarUploadButton?.addEventListener(
    "click",
    openUploadWorkspace
  );


  section.addEventListener(
    "click",
    event => {

      const openButton =
        event.target.closest(
          "[data-open-student-resource]"
        );


      if (openButton){

        event.preventDefault();

        openStudentResourcePreview(
          openButton.dataset
            .openStudentResource
        );

        return;

      }


      const recentButton =
        event.target.closest(
          "[data-open-recent-resource]"
        );


      if (recentButton){

        event.preventDefault();

        openStudentResourcePreview(
          recentButton.dataset
            .openRecentResource
        );

        return;

      }


      const saveButton =
        event.target.closest(
          "[data-save-student-resource]"
        );


      if (saveButton){

        event.preventDefault();

        toggleStudentResourceSaved(
          saveButton.dataset
            .saveStudentResource
        );

        return;

      }

            const editButton =
        event.target.closest(
          "[data-edit-student-resource]"
        );


      if (editButton){

        event.preventDefault();

        bindStudentResourceUploadControls();

        openStudentResourceEditModal(
          editButton.dataset
            .editStudentResource
        );

        return;

      }


      const deleteButton =
        event.target.closest(
          "[data-delete-student-resource]"
        );


      if (deleteButton){

        event.preventDefault();

        deleteStudentResource(
          deleteButton.dataset
            .deleteStudentResource
        );

        return;

      }


      const categoryButton =
        event.target.closest(
          "[data-resource-category]"
        );


      if (!categoryButton){
        return;
      }


      event.preventDefault();


      const category =
        String(
          categoryButton.dataset
            .resourceCategory ||
          ""
        )
          .trim()
          .toLowerCase();


      const categoryAlreadyActive =
        studentResourceActiveCategory ===
        category;


      studentResourceActiveCategory =
        categoryAlreadyActive
          ? "all"
          : category;


      document
        .querySelectorAll(
          "[data-resource-category]"
        )
        .forEach(button => {

          const buttonCategory =
            String(
              button.dataset
                .resourceCategory ||
              ""
            )
              .trim()
              .toLowerCase();


          button.classList.toggle(
            "active",
            studentResourceActiveCategory ===
              buttonCategory
          );

        });


      /*
        Category filtering is handled entirely by
        renderResources(). Keep the normal type selector
        independent so students may combine filters.
      */

      renderResources();

    }
  );

    cancelConfirmButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeStudentResourceConfirmation(
        false
      );

    }
  );


  approveConfirmButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      closeStudentResourceConfirmation(
        true
      );

    }
  );


  confirmModal?.addEventListener(
    "click",
    event => {

      if (
        event.target ===
        confirmModal
      ){

        closeStudentResourceConfirmation(
          false
        );

      }

    }
  );
  const openPreviewResourceExternally =
    () => {

      const resource =
        studentResourcePreviewResource;


      if (!resource?.url){
        return;
      }


      window.open(
        resource.url,
        "_blank",
        "noopener,noreferrer"
      );

    };


  const downloadPreviewResource =
    () => {

      const resource =
        studentResourcePreviewResource;


      if (!resource?.url){
        return;
      }


      const downloadLink =
        document.createElement(
          "a"
        );


      downloadLink.href =
        resource.url;

      downloadLink.download =
        resource.originalName ||
        resource.title ||
        "learning-resource";

      downloadLink.target =
        "_blank";

      downloadLink.rel =
        "noopener noreferrer";


      document.body.appendChild(
        downloadLink
      );

      downloadLink.click();

      downloadLink.remove();

    };


  $("closeStudentResourcePreviewButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        closeStudentResourcePreview();

      }
    );


  $("studentResourcePreviewModal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target ===
          $("studentResourcePreviewModal")
        ){

          closeStudentResourcePreview();

        }

      }
    );


  $("studentResourcePreviewExternalButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openPreviewResourceExternally();

      }
    );


  $("studentResourcePreviewOpenLinkButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openPreviewResourceExternally();

      }
    );


  $("studentResourceUnsupportedExternalButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        openPreviewResourceExternally();

      }
    );


  $("studentResourcePreviewDownloadButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        downloadPreviewResource();

      }
    );


  $("studentResourceUnsupportedDownloadButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        downloadPreviewResource();

      }
    );


  $("studentResourcePreviewSaveButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();


        const resource =
          studentResourcePreviewResource;


        if (!resource){
          return;
        }


        toggleStudentResourceSaved(
          resource.id
        );


        const refreshedResource =
          buildStudentResources()
            .find(item =>
              sameId(
                item.id,
                resource.id
              )
            );


        if (!refreshedResource){
          return;
        }


        studentResourcePreviewResource =
          refreshedResource;


        const savedIds =
          getStudentSavedResourceIds();

        const isSaved =
          savedIds.has(
            String(
              refreshedResource.id
            )
          );

        const button =
          $("studentResourcePreviewSaveButton");


        if (button){

          button.setAttribute(
            "aria-pressed",
            String(
              isSaved
            )
          );


          button.innerHTML = `
            <i
              class="${
                isSaved
                  ? "fa-solid"
                  : "fa-regular"
              } fa-bookmark"
              aria-hidden="true"
            ></i>

            ${
              isSaved
                ? "Saved"
                : "Save"
            }
          `;

        }

      }
    );


  $("studentResourcePreviewEditButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();


        const resource =
          studentResourcePreviewResource;


        if (
          !resource ||
          !resource.isPersonal
        ){
          return;
        }


        const resourceId =
          resource.id;


        closeStudentResourcePreview();


        openStudentResourceEditModal(
          resourceId
        );

      }
    );


  $("studentResourcePreviewDeleteButton")
    ?.addEventListener(
      "click",
      async event => {

        event.preventDefault();


        const resource =
          studentResourcePreviewResource;


        if (
          !resource ||
          !resource.isPersonal
        ){
          return;
        }


        const resourceId =
          resource.id;


        closeStudentResourcePreview();


        await deleteStudentResource(
          resourceId
        );

      }
    );


  $("retryStudentResourcePreviewButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();


        if (
          studentResourcePreviewResource
        ){

          renderStudentResourcePreview(
            studentResourcePreviewResource
          );

        }

      }
    );

    document.addEventListener(
    "keydown",
    event => {

      const previewModal =
        $("studentResourcePreviewModal");


      if (
        event.key !== "Escape" ||
        !previewModal?.classList.contains(
          "show"
        )
      ){
        return;
      }


      event.preventDefault();

      closeStudentResourcePreview();

    }
  );

  $("studentResourcePreviewPreviousButton")
?.addEventListener(
  "click",
  ()=>{

    navigateStudentResourcePreview(
      -1
    );

  }
);

$("studentResourcePreviewNextButton")
?.addEventListener(
  "click",
  ()=>{

    navigateStudentResourcePreview(
      1
    );

  }
);

    $("studentResourcePreviewZoomOutButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        if (
          !studentResourcePreviewSupportsZoom()
        ){
          return;
        }


        setStudentResourcePreviewZoom(
          studentResourcePreviewZoom -
          STUDENT_RESOURCE_PREVIEW_ZOOM_STEP
        );

      }
    );


  $("studentResourcePreviewZoomInButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        if (
          !studentResourcePreviewSupportsZoom()
        ){
          return;
        }


        setStudentResourcePreviewZoom(
          studentResourcePreviewZoom +
          STUDENT_RESOURCE_PREVIEW_ZOOM_STEP
        );

      }
    );


  $("studentResourcePreviewZoomValueButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        if (
          !studentResourcePreviewSupportsZoom()
        ){
          return;
        }


        resetStudentResourcePreviewZoom();

      }
    );


  $("studentResourcePreviewFitButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        if (
          !studentResourcePreviewSupportsZoom()
        ){
          return;
        }


        fitStudentResourcePreview();

      }
    );


  $("studentResourcePreviewFullscreenButton")
    ?.addEventListener(
      "click",
      event => {

        event.preventDefault();

        toggleStudentResourcePreviewFullscreen();

      }
    );


  document.addEventListener(
    "fullscreenchange",
    updateStudentResourceFullscreenButton
  );


document.addEventListener(
  "keydown",
  event => {

    const modal =
      $("studentResourcePreviewModal");

    if (
      !modal ||
      !modal.classList.contains("show")
    ){
      return;
    }

    if (
      !studentResourcePreviewSupportsZoom()
    ){
      return;
    }

    if (
      event.target instanceof HTMLElement &&
      (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.isContentEditable
      )
    ){
      return;
    }

    if (
      event.ctrlKey ||
      event.metaKey
    ){

      if (
        event.key === "+" ||
        event.key === "="
      ){

        event.preventDefault();

        setStudentResourcePreviewZoom(
          studentResourcePreviewZoom +
          STUDENT_RESOURCE_PREVIEW_ZOOM_STEP
        );

        return;

      }

      if (
        event.key === "-"
      ){

        event.preventDefault();

        setStudentResourcePreviewZoom(
          studentResourcePreviewZoom -
          STUDENT_RESOURCE_PREVIEW_ZOOM_STEP
        );

        return;

      }

      if (
        event.key === "0"
      ){

        event.preventDefault();

        fitStudentResourcePreview();

      }

    }

  }
);

  studentResourceControlsBound =
    true;

}

function renderResources(){

  const grid =
    $("studentResourceGrid");

  if (!grid){
    return;
  }


  const allResources =
    buildStudentResources();

  const savedIds =
    getStudentSavedResourceIds();


  const searchValue =
    String(
      $("resourceSearch")
        ?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const classFilter =
    String(
      $("resourceClassFilter")
        ?.value ||
      ""
    ).trim();


  const typeFilter =
    String(
      $("resourceTypeFilter")
        ?.value ||
      "all"
    )
      .trim()
      .toLowerCase();


  const sortFilter =
    String(
      $("resourceSortFilter")
        ?.value ||
      "recent"
    )
      .trim()
      .toLowerCase();


  const sevenDaysAgo =
    Date.now() -
    (
      7 *
      24 *
      60 *
      60 *
      1000
    );


  let resources =
    allResources.filter(resource => {

      const matchesSearch =
        !searchValue ||
        [
          resource.title,
          resource.description,
          resource.className,
          resource.source,
          resource.type,
          resource.originalName
        ]
          .join(" ")
          .toLowerCase()
          .includes(
            searchValue
          );


      const matchesClass =
        !classFilter ||
        sameId(
          resource.classId,
          classFilter
        );


      const matchesType =
        typeFilter === "all" ||
        resource.type === typeFilter;


      let matchesCategory =
        true;


      if (
        studentResourceActiveCategory ===
        "saved"
      ){

        matchesCategory =
          savedIds.has(
            String(
              resource.id
            )
          );

      }else if (
        studentResourceActiveCategory ===
        "recent"
      ){

        matchesCategory =
          Boolean(
            resource.createdAt &&
            new Date(
              resource.createdAt
            ).getTime() >=
              sevenDaysAgo
          );

      }else if (
        studentResourceActiveCategory ===
        "document"
      ){

        matchesCategory =
          [
            "document",
            "pdf",
            "presentation",
            "spreadsheet",
            "text"
          ].includes(
            resource.type
          );

      }else if (
        studentResourceActiveCategory ===
        "video"
      ){

        matchesCategory =
          [
            "video",
            "recording"
          ].includes(
            resource.type
          );

      }else if (
        studentResourceActiveCategory ===
        "link"
      ){

        matchesCategory =
          resource.type ===
          "link";

      }


      return (
        matchesSearch &&
        matchesClass &&
        matchesType &&
        matchesCategory
      );

    });


  resources.sort(
    (
      first,
      second
    ) => {

      if (
        sortFilter === "oldest"
      ){
        return (
          new Date(
            first.createdAt ||
            0
          ) -
          new Date(
            second.createdAt ||
            0
          )
        );
      }


      if (
        sortFilter === "name"
      ){
        return first.title.localeCompare(
          second.title
        );
      }


      if (
        sortFilter === "class"
      ){
        return first.className.localeCompare(
          second.className
        );
      }


      if (
        sortFilter === "type"
      ){
        return first.type.localeCompare(
          second.type
        );
      }


      return (
        new Date(
          second.createdAt ||
          0
        ) -
        new Date(
          first.createdAt ||
          0
        )
      );

    }
  );


  grid.classList.toggle(
    "list",
    studentResourceView ===
      "list"
  );


  setText(
    "studentResourceTotalCount",
    allResources.length
  );


  const resourceClassIds =
    new Set(
      allResources
        .map(resource =>
          resource.classId
        )
        .filter(Boolean)
    );


  setText(
    "studentResourceClassCount",
    resourceClassIds.size
  );


  const recentCount =
    allResources.filter(resource =>
      resource.createdAt &&
      new Date(
        resource.createdAt
      ).getTime() >=
        sevenDaysAgo
    ).length;


  setText(
    "studentResourceRecentCount",
    recentCount
  );


  setText(
    "studentResourceSavedCount",
    savedIds.size
  );


  setText(
    "studentRecentResourceBadge",
    recentCount
  );


  setText(
    "studentDocumentResourceBadge",
    allResources.filter(resource =>
      [
        "document",
        "pdf"
      ].includes(
        resource.type
      )
    ).length
  );


  setText(
    "studentVideoResourceBadge",
    allResources.filter(resource =>
      [
        "video",
        "recording"
      ].includes(
        resource.type
      )
    ).length
  );


  setText(
    "studentLinkResourceBadge",
    allResources.filter(resource =>
      resource.type ===
        "link"
    ).length
  );


  setText(
    "studentSavedResourceBadge",
    savedIds.size
  );


  setText(
    "studentResourceResultCount",
    `${
      resources.length
    } ${
      resources.length === 1
        ? "resource"
        : "resources"
    }`
  );


  const hasFilters =
    Boolean(
      searchValue ||
      classFilter ||
      typeFilter !== "all" ||
      studentResourceActiveCategory !==
        "all"
    );


  const resetButton =
    $("resetResourceFiltersButton");

  if (resetButton){
    resetButton.hidden =
      !hasFilters;
  }


  if (!resources.length){

    grid.innerHTML = `
      <div class="student-resource-empty">

        <i
          class="fa-regular fa-folder-open"
          aria-hidden="true"
        ></i>

        <strong>
          No resources found
        </strong>

        <p>
          ${
            studentResourceActiveCategory ===
              "saved"
              ? "You have not saved any resources yet."
              : studentResourceActiveCategory ===
                  "recent"
                ? "No resources were added during the last seven days."
                : hasFilters
                  ? "Try changing your search or resource filters."
                  : "Resources added by your teachers and school will appear here."
          }
        </p>

      </div>
    `;

    renderStudentRecentlyOpenedResources();

    return;
  }


  grid.innerHTML =
    resources
      .map(resource => {

        const saved =
          savedIds.has(
            resource.id
          );


        const previewMarkup =
          resource.type ===
            "image" &&
          resource.url
            ? `
              <img
                src="${
                  escapeHtml(
                    resource.url
                  )
                }"
                alt=""
                loading="lazy"
              >
            `
            : `
              <span class="student-resource-card-icon">

                <i
                  class="${
                    escapeHtml(
                      getStudentResourceIcon(
                        resource.type
                      )
                    )
                  }"
                  aria-hidden="true"
                ></i>

              </span>
            `;


        return `
          <article
            class="student-resource-card"
            data-resource-id="${
              escapeHtml(
                resource.id
              )
            }"
          >

            <div class="student-resource-card-preview">

              ${previewMarkup}

            </div>


            <div class="student-resource-card-body">

              <span class="student-resource-card-type">
                ${
                  escapeHtml(
                    getStudentResourceTypeLabel(
                      resource.type
                    )
                  )
                }
              </span>

              <h3 title="${
                escapeHtml(
                  resource.title
                )
              }">
                ${
                  escapeHtml(
                    resource.title
                  )
                }
              </h3>

              <p>
                ${
                  escapeHtml(
                    resource.description ||
                    resource.source
                  )
                }
              </p>

              <div class="student-resource-card-meta">

                <span>
                  ${
                    escapeHtml(
                      resource.className
                    )
                  }
                </span>

                ${
                  resource.createdAt
                    ? `
                      <span>
                        •
                        ${
                          escapeHtml(
                            formatDate(
                              resource.createdAt
                            )
                          )
                        }
                      </span>
                    `
                    : ""
                }

              </div>

            </div>


            <div class="student-resource-card-actions">

              <div class="student-resource-card-actions-left">

                <button
                  class="student-resource-card-button"
                  type="button"
                  data-open-student-resource="${
                    escapeHtml(
                      resource.id
                    )
                  }"
                >
                  <i
                    class="fa-solid fa-arrow-up-right-from-square"
                    aria-hidden="true"
                  ></i>

                  Open
                </button>

              </div>


              <div class="student-resource-card-actions-right">

                ${
                  resource.isPersonal
                    ? `
                      <button
                        class="student-resource-card-icon-button"
                        type="button"
                        data-edit-student-resource="${
                          escapeHtml(
                            resource.id
                          )
                        }"
                        aria-label="Edit resource"
                        title="Edit resource"
                      >
                        <i
                          class="fa-solid fa-pen"
                          aria-hidden="true"
                        ></i>
                      </button>

                      <button
                        class="
                          student-resource-card-icon-button
                          danger
                        "
                        type="button"
                        data-delete-student-resource="${
                          escapeHtml(
                            resource.id
                          )
                        }"
                        aria-label="Delete resource"
                        title="Delete resource"
                      >
                        <i
                          class="fa-regular fa-trash-can"
                          aria-hidden="true"
                        ></i>
                      </button>
                    `
                    : ""
                }

                <button
                  class="
                    student-resource-bookmark
                    ${
                      saved
                        ? "active"
                        : ""
                    }
                  "
                  type="button"
                  data-save-student-resource="${
                    escapeHtml(
                      resource.id
                    )
                  }"
                  aria-label="${
                    saved
                      ? "Remove from saved resources"
                      : "Save resource"
                  }"
                  aria-pressed="${
                    saved
                      ? "true"
                      : "false"
                  }"
                >
                  <i
                    class="${
                      saved
                        ? "fa-solid"
                        : "fa-regular"
                    } fa-bookmark"
                    aria-hidden="true"
                  ></i>
                </button>

              </div>

            </div>

          </article>
        `;

      })
      .join("");


  renderStudentRecentlyOpenedResources();

}

function renderTeachers(){
  const container = $("teacherList");
  if (!container) return;

  const teachers = state.teachers || [];

  if (!teachers.length){
    container.innerHTML = `<div class="empty">No teachers assigned yet.</div>`;
    return;
  }

  container.innerHTML = teachers.map(t => `
    <div class="side-user">
      <img src="${t.profileImage || t.avatar || FALLBACK_AVATAR}" alt="">

      <div>
        <strong>${escapeHtml(t.name || "Teacher")}</strong>
        <span>${escapeHtml(t.subject || t.department || "Instructor")}</span>
      </div>
    </div>
  `).join("");
}

function renderDeadlines(){
  const container = $("deadlineList");
  if (!container) return;

  const items = getStudentAssignments()
    .filter(item => item.dueDate || item.deadline)
    .sort((a,b) => new Date(a.dueDate || a.deadline) - new Date(b.dueDate || b.deadline))
    .slice(0,5);

  if (!items.length){
    container.innerHTML = `<div class="empty">No upcoming deadlines.</div>`;
    return;
  }

  container.innerHTML = items.map(item => {
    const submitted = getSubmissionForAssignment(item._id);

    return `
      <article class="resource-card">
        <div class="item-head">
          <div>
            <h3 class="item-title">${escapeHtml(item.title || "Assignment")}</h3>
            <div class="item-sub">Due ${formatDate(item.dueDate || item.deadline)}</div>
          </div>

          <span class="chip ${submitted ? "success" : "warning"}">
            ${submitted ? "Submitted" : "Pending"}
          </span>
        </div>
      </article>
    `;
  }).join("");
}

/* =========================================================
   ASSIGNMENT SUBMISSION WORKSPACE CONTROLLER
========================================================= */

let assignmentWorkspaceControlsBound =
  false;

let assignmentWorkspaceSubmitting =
  false;
let assignmentWorkspaceUploading =
  false;

let assignmentWorkspaceUploadedFiles =
  [];

let assignmentWorkspacePendingFiles =
  [];

/* =========================================================
   ASSIGNMENT FILE UPLOAD CONTROLLER
========================================================= */

function resetAssignmentUploader(){

  assignmentWorkspacePendingFiles = [];

  assignmentWorkspaceUploadedFiles = [];

  assignmentWorkspaceUploading = false;

  updateAssignmentUploadCounter();

  renderAssignmentAttachments();

  hideAssignmentUploadProgress();

}


function updateAssignmentUploadCounter(){

  const counter =
    $("assignmentWorkspaceUploadCount");

  if(!counter){
    return;
  }

  const total =
    assignmentWorkspaceUploadedFiles.length +
    assignmentWorkspacePendingFiles.length;

  counter.textContent =
    `${total} / ${MAX_ASSIGNMENT_UPLOAD_FILES} files`;

}


function hideAssignmentUploadProgress(){

  $("assignmentWorkspaceUploadProgress")
    ?.setAttribute(
      "hidden",
      ""
    );

  const bar =
    $("assignmentWorkspaceUploadProgressBar");

  if(bar){
    bar.style.width = "0%";
  }

  const percent =
    $("assignmentWorkspaceUploadProgressPercent");

  if(percent){
    percent.textContent = "0%";
  }

}

/* =========================================================
   RENDER ASSIGNMENT ATTACHMENTS
========================================================= */

function renderAssignmentAttachments(){

  const container =
    $("assignmentWorkspaceAttachmentList");

  if(!container){
    return;
  }

  const pending =
    assignmentWorkspacePendingFiles;

  const uploaded =
    assignmentWorkspaceUploadedFiles;

  const files = [
    ...pending.map(file => ({
      pending:true,
      uploaded:false,
      file
    })),

    ...uploaded.map(file => ({
      pending:false,
      uploaded:true,
      file
    }))
  ];

  if(!files.length){

    container.innerHTML = `
      <div class="assignment-workspace-empty compact">

        <i class="fa-solid fa-paperclip"></i>

        <span>
          No files have been attached yet.
        </span>

      </div>
    `;

    updateAssignmentUploadCounter();

    return;
  }

  container.innerHTML = "";

  files.forEach(item => {

    const file =
      item.file;

    const card =
      document.createElement("div");

    card.className =
      "assignment-workspace-attachment-item";

    let icon =
      "fa-file";

    let type =
      "file";

    const mime =
      String(
        file.mimeType ||
        file.type ||
        ""
      ).toLowerCase();

    if(
      mime.startsWith("image/")
    ){
      icon="fa-image";
      type="image";
    }

    else if(
      mime.startsWith("video/")
    ){
      icon="fa-video";
      type="video";
    }

    else if(
      mime.startsWith("audio/")
    ){
      icon="fa-music";
      type="audio";
    }

    else if(
      mime.includes("pdf")
    ){
      icon="fa-file-pdf";
      type="pdf";
    }

    else if(
      mime.includes("word")
    ){
      icon="fa-file-word";
      type="document";
    }

    else if(
      mime.includes("presentation")
    ){
      icon="fa-file-powerpoint";
      type="presentation";
    }

    else if(
      mime.includes("spreadsheet") ||
      mime.includes("excel")
    ){
      icon="fa-file-excel";
      type="spreadsheet";
    }

    const size =
      Number(
        file.size ||
        0
      );

    const readableSize =
      formatBytes(size);

    card.innerHTML = `

      <div
        class="
          assignment-workspace-attachment-icon
          ${type}
        "
      >

        <i
          class="fa-solid ${icon}"
        ></i>

      </div>

      <div
        class="
          assignment-workspace-attachment-copy
        "
      >

        <strong>

          ${
            escapeHtml(
              file.originalName ||
              file.name ||
              "Attachment"
            )
          }

        </strong>

        <span>

          ${readableSize}

        </span>

      </div>

      <div
        class="
          assignment-workspace-attachment-actions
        "
      >

        ${
          item.pending
          ?`
          <button
            class="
              assignment-workspace-attachment-action
            "
            disabled
          >

            <i
              class="
                fa-solid
                fa-spinner
                fa-spin
              "
            ></i>

          </button>
          `
          :`
          <button
            class="
              assignment-workspace-attachment-action
            "
            onclick="
              window.open(
                '${file.url}',
                '_blank'
              )
            "
          >

            <i
              class="
                fa-solid
                fa-arrow-up-right-from-square
              "
            ></i>

          </button>
          `
        }

        <button
          class="
            assignment-workspace-attachment-action
            remove
          "

          data-index="${
            files.indexOf(item)
          }"

        >

          <i
            class="
              fa-solid
              fa-trash
            "
          ></i>

        </button>

      </div>

    `;

    container.appendChild(
      card
    );

  });

  container
    .querySelectorAll(
      ".remove"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.index
            );

          const pendingCount =
            assignmentWorkspacePendingFiles.length;

          if(
            index <
            pendingCount
          ){

            assignmentWorkspacePendingFiles.splice(
              index,
              1
            );

          }else{

            assignmentWorkspaceUploadedFiles.splice(
              index -
              pendingCount,
              1
            );

          }

          updateAssignmentUploadCounter();

          renderAssignmentAttachments();

        }
      );

    });

  updateAssignmentUploadCounter();

}

function formatBytes(bytes){

  if(!bytes){
    return "0 B";
  }

  const units=[
    "B",
    "KB",
    "MB",
    "GB"
  ];

  const power=
    Math.floor(
      Math.log(bytes)/
      Math.log(1024)
    );

  return `${

    (
      bytes/
      Math.pow(
        1024,
        power
      )
    ).toFixed(
      power===0
      ?0
      :1
    )

  } ${

    units[power]

  }`;

}




function validateAssignmentFiles(
  files
){

  const accepted = [];

  const errors = [];

  const currentCount =
    assignmentWorkspaceUploadedFiles.length +
    assignmentWorkspacePendingFiles.length;

  for(const file of files){

    if(
      currentCount +
      accepted.length >=
      MAX_ASSIGNMENT_UPLOAD_FILES
    ){
      errors.push(
        "Maximum upload limit reached."
      );

      break;
    }

    if(
      file.size >
      MAX_ASSIGNMENT_FILE_SIZE
    ){
      errors.push(
        `${file.name} exceeds 50 MB.`
      );

      continue;
    }

    if(
      !ASSIGNMENT_ALLOWED_MIME_TYPES.has(
        file.type
      )
    ){
      errors.push(
        `${file.name} is not supported.`
      );

      continue;
    }

    const duplicate =
      [
        ...assignmentWorkspacePendingFiles,
        ...assignmentWorkspaceUploadedFiles
      ].some(existing => {

        return (
          existing.name === file.name &&
          existing.size === file.size
        );

      });

    if(duplicate){
      errors.push(
        `${file.name} already added.`
      );

      continue;
    }

    accepted.push(file);

  }

  return {
    accepted,
    errors
  };

}
function addAssignmentFiles(
  files
){

  const {
    accepted,
    errors
  } =
    validateAssignmentFiles(files);

  if(errors.length){

    showAlert(
      "warning",
      errors.join("\n"),
      {
        title:"Upload warning"
      }
    );

  }

  if(!accepted.length){
    return;
  }

  assignmentWorkspacePendingFiles.push(
    ...accepted
  );

  updateAssignmentUploadCounter();

  renderAssignmentAttachments();

  uploadAssignmentQueue();

}

const MAX_ASSIGNMENT_UPLOAD_FILES =
  10;

const MAX_ASSIGNMENT_FILE_SIZE =
  50 * 1024 * 1024;

/* =========================================================
   UPLOAD ASSIGNMENT FILES
========================================================= */

async function uploadAssignmentQueue(){

  if(
    assignmentWorkspaceUploading ||
    !assignmentWorkspacePendingFiles.length
  ){
    return;
  }

  assignmentWorkspaceUploading = true;

  const progressWrap =
    $("assignmentWorkspaceUploadProgress");

  const progressBar =
    $("assignmentWorkspaceUploadProgressBar");

  const progressText =
    $("assignmentWorkspaceUploadProgressText");

  if(progressWrap){
    progressWrap.removeAttribute("hidden");
  }

  try{

    while(assignmentWorkspacePendingFiles.length){

      const file =
        assignmentWorkspacePendingFiles.shift();

      if(progressText){
        progressText.textContent =
          `Uploading ${file.name}...`;
      }

      if(progressBar){
        progressBar.style.width = "15%";
      }

      const form =
        new FormData();

      form.append(
        "attachments",
        file
      );

      const response =
        await fetch(
          API + "/api/uploads/assignment-attachments",
          {
            method:"POST",

            headers:{
              Authorization:
                "Bearer " + token
            },

            body:form
          }
        );

      const data =
        await safeJson(response);

      if(!response.ok){

        throw new Error(
          data?.message ||
          "Upload failed."
        );

      }

      if(progressBar){
        progressBar.style.width = "100%";
      }

      assignmentWorkspaceUploadedFiles.push({
        url:
          data.url,

        secureUrl:
          data.secureUrl,

        publicId:
          data.publicId,

        originalName:
          data.originalName,

        bytes:
          data.bytes,

        resourceType:
          data.resourceType,

        mediaType:
          data.mediaType
      });

      renderAssignmentAttachments();

      updateAssignmentUploadCounter();

    }

  }catch(error){

    console.error(error);

    showAlert(
      "error",
      error.message ||
      "Unable to upload attachment."
    );

  }finally{

    assignmentWorkspaceUploading =
      false;

    hideAssignmentUploadProgress();

  }

}

const ASSIGNMENT_ALLOWED_MIME_TYPES =
  new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",

    "video/mp4",
    "video/webm",
    "video/quicktime",

    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/ogg",
    "audio/mp4",
    "audio/aac",

    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",

    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    "text/plain",
    "text/csv"
  ]);

let assignmentWorkspaceDraftTimer =
  null;

let assignmentWorkspaceHasUnsavedChanges =
  false;

let assignmentWorkspaceAllowClose =
  false;

const ASSIGNMENT_WORKSPACE_DRAFT_PREFIX =
  "aiftStudentAssignmentDraft";



/* =========================================================
   ASSIGNMENT DRAFT STORAGE
========================================================= */

function getAssignmentWorkspaceStudentId(){
  return normalizeId(
    selectedStudentId ||
    state.me?._id ||
    state.loggedUser?._id ||
    "student"
  );
}


function getAssignmentWorkspaceDraftKey(
  assignmentId
){
  const safeStudentId =
    getAssignmentWorkspaceStudentId();

  const safeAssignmentId =
    normalizeId(
      assignmentId
    );

  if (!safeAssignmentId){
    return "";
  }

  return [
    ASSIGNMENT_WORKSPACE_DRAFT_PREFIX,
    safeStudentId,
    safeAssignmentId
  ].join(":");
}


function readAssignmentWorkspaceDraft(
  assignmentId
){
  const key =
    getAssignmentWorkspaceDraftKey(
      assignmentId
    );

  if (!key){
    return null;
  }

  try{
    const stored =
      localStorage.getItem(
        key
      );

    if (!stored){
      return null;
    }

    const draft =
      JSON.parse(stored);

    if (
      !draft ||
      typeof draft !== "object"
    ){
      return null;
    }

    return {
      assignmentId:
        normalizeId(
          draft.assignmentId
        ),

      text:
        String(
          draft.text || ""
        ),

      fileUrl:
        String(
          draft.fileUrl || ""
        ),

      savedAt:
        String(
          draft.savedAt || ""
        )
    };

  }catch(error){
    console.warn(
      "Assignment draft could not be read:",
      error
    );

    return null;
  }
}


function writeAssignmentWorkspaceDraft(
  assignmentId
){
  const key =
    getAssignmentWorkspaceDraftKey(
      assignmentId
    );

  if (!key){
    return false;
  }

  const text =
    String(
      $("submissionText")
        ?.value || ""
    );

  const fileUrl =
    String(
      $("submissionFile")
        ?.value || ""
    );

  const draft = {
    assignmentId:
      normalizeId(
        assignmentId
      ),

    text,
    fileUrl,

    savedAt:
      new Date()
        .toISOString()
  };

  try{
    /*
      Remove empty drafts instead of filling localStorage
      with unused records.
    */

    if (
      !text.trim() &&
      !fileUrl.trim()
    ){
      localStorage.removeItem(
        key
      );

      assignmentWorkspaceHasUnsavedChanges =
        false;

      return true;
    }

    localStorage.setItem(
      key,
      JSON.stringify(
        draft
      )
    );

    assignmentWorkspaceHasUnsavedChanges =
      false;

    return true;

  }catch(error){
    console.error(
      "Assignment draft could not be saved:",
      error
    );

    return false;
  }
}


function removeAssignmentWorkspaceDraft(
  assignmentId
){
  const key =
    getAssignmentWorkspaceDraftKey(
      assignmentId
    );

  if (!key){
    return;
  }

  try{
    localStorage.removeItem(
      key
    );
  }catch(error){
    console.warn(
      "Assignment draft could not be removed:",
      error
    );
  }
}


function scheduleAssignmentWorkspaceDraftSave(){
  window.clearTimeout(
    assignmentWorkspaceDraftTimer
  );

  assignmentWorkspaceHasUnsavedChanges =
    true;

  setAssignmentWorkspaceSaveStatus(
    "saving",
    "Saving draft..."
  );

  assignmentWorkspaceDraftTimer =
    window.setTimeout(
      () => {
        const assignmentId =
          normalizeId(
            $("submissionAssignmentId")
              ?.value
          );

        if (!assignmentId){
          setAssignmentWorkspaceSaveStatus(
            "error",
            "Select an assignment"
          );

          return;
        }

        const saved =
          writeAssignmentWorkspaceDraft(
            assignmentId
          );

        setAssignmentWorkspaceSaveStatus(
          saved
            ? "ready"
            : "error",

          saved
            ? "Draft saved"
            : "Draft not saved"
        );
      },
      650
    );
}


function flushAssignmentWorkspaceDraft(){
  window.clearTimeout(
    assignmentWorkspaceDraftTimer
  );

  const assignmentId =
    normalizeId(
      $("submissionAssignmentId")
        ?.value
    );

  if (
    !assignmentId ||
    !assignmentWorkspaceHasUnsavedChanges
  ){
    return true;
  }

  const saved =
    writeAssignmentWorkspaceDraft(
      assignmentId
    );

  setAssignmentWorkspaceSaveStatus(
    saved
      ? "ready"
      : "error",

    saved
      ? "Draft saved"
      : "Draft not saved"
  );

  return saved;
}

/* =========================================================
   ASSIGNMENT SELECT
========================================================= */

function hydrateSubmissionSelect(
  preferredAssignmentId = ""
){
  const select =
    $("submissionAssignmentId");

  if (!select){
    return;
  }

  const assignments =
    getStudentAssignments();

  const currentValue =
    normalizeId(
      preferredAssignmentId ||
      select.value
    );

  select.innerHTML = `
    <option value="">
      Select assignment
    </option>

    ${
      assignments
        .map(assignment => {
          const assignmentId =
            normalizeId(
              assignment?._id ||
              assignment?.id
            );

          const classInfo =
            getStudentAssignmentClass(
              assignment
            );

          const status =
            getStudentAssignmentStatus(
              assignment
            );

          return `
            <option
              value="${escapeHtml(
                assignmentId
              )}"
            >
              ${escapeHtml(
                assignment?.title ||
                "Untitled assignment"
              )}
              ${
                classInfo.title
                  ? ` — ${escapeHtml(
                      classInfo.title
                    )}`
                  : ""
              }
              (${escapeHtml(
                getAssignmentStatusLabel(
                  status
                )
              )})
            </option>
          `;
        })
        .join("")
    }
  `;

  const assignmentExists =
    assignments.some(assignment =>
      sameId(
        assignment?._id ||
        assignment?.id,
        currentValue
      )
    );

  select.value =
    assignmentExists
      ? currentValue
      : "";
}


/* =========================================================
   WORKSPACE ELEMENT HELPERS
========================================================= */

function setAssignmentWorkspaceSaveStatus(
  status = "ready",
  text = "Ready"
){
  const element =
    $("assignmentWorkspaceSaveStatus");

  if (!element){
    return;
  }

  element.classList.remove(
    "saving",
    "error"
  );

  if (
    status === "saving" ||
    status === "error"
  ){
    element.classList.add(
      status
    );
  }

  const icon =
    status === "saving"
      ? "fa-solid fa-spinner fa-spin"
      : status === "error"
        ? "fa-solid fa-circle-exclamation"
        : "fa-regular fa-circle-check";

  element.innerHTML = `
    <i
      class="${icon}"
      aria-hidden="true"
    ></i>

    <span>
      ${escapeHtml(text)}
    </span>
  `;
}


function updateAssignmentWorkspaceCharacterCount(){
  const textarea =
    $("submissionText");

  const counter =
    $("assignmentWorkspaceCharacterCount");

  if (
    !textarea ||
    !counter
  ){
    return;
  }

  const count =
    textarea.value.length;

  counter.textContent =
    `${count.toLocaleString()} ${
      count === 1
        ? "character"
        : "characters"
    }`;
}


function isValidSubmissionUrl(
  value
){
  const url =
    String(value || "")
      .trim();

  if (!url){
    return false;
  }

  try{
    const parsed =
      new URL(url);

    return [
      "http:",
      "https:"
    ].includes(
      parsed.protocol
    );
  }catch{
    return false;
  }
}


/* =========================================================
   FILE LINK PREVIEW
========================================================= */

function renderAssignmentWorkspaceFilePreview(){
  const input =
    $("submissionFile");

  const preview =
    $("assignmentWorkspaceFilePreview");

  if (
    !input ||
    !preview
  ){
    return;
  }

  const fileUrl =
    input.value.trim();

  if (!fileUrl){
    preview.hidden = true;
    preview.innerHTML = "";

    return;
  }

  if (
    !isValidSubmissionUrl(
      fileUrl
    )
  ){
    preview.hidden = false;

    preview.innerHTML = `
      <div class="assignment-workspace-resource-item">

        <span class="assignment-workspace-resource-icon">

          <i
            class="fa-solid fa-triangle-exclamation"
            aria-hidden="true"
          ></i>

        </span>

        <span class="assignment-workspace-resource-copy">

          <strong>
            Invalid file link
          </strong>

          <span>
            Enter a complete link beginning with
            http:// or https://
          </span>

        </span>

      </div>
    `;

    return;
  }

  let host =
    "External file";

  try{
    host =
      new URL(fileUrl)
        .hostname
        .replace(/^www\./,"");
  }catch{
    host =
      "External file";
  }

  preview.hidden = false;

  preview.innerHTML = `
    <div class="assignment-workspace-resource-item">

      <span class="assignment-workspace-resource-icon">

        <i
          class="fa-solid fa-link"
          aria-hidden="true"
        ></i>

      </span>

      <span class="assignment-workspace-resource-copy">

        <strong>
          Submission file
        </strong>

        <span>
          ${escapeHtml(host)}
        </span>

      </span>

      <a
        href="${escapeHtml(fileUrl)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Preview
      </a>

    </div>
  `;
}


/* =========================================================
   EMPTY WORKSPACE
========================================================= */

function renderEmptyAssignmentWorkspace(){
  setText(
    "assignmentWorkspaceTitle",
    "Submit Assignment"
  );

  setText(
    "assignmentWorkspaceDescription",
    "Choose an assignment to begin preparing your submission."
  );

  const statusBadge =
    $("assignmentWorkspaceStatusBadge");

  if (statusBadge){
    statusBadge.className =
      "assignment-workspace-status pending";

    statusBadge.textContent =
      "Pending";
  }

  const summary =
    $("assignmentWorkspaceAssignmentSummary");

  if (summary){
    summary.innerHTML = `
      <div class="assignment-workspace-placeholder-icon">

        <i
          class="fa-solid fa-clipboard-list"
          aria-hidden="true"
        ></i>

      </div>

      <div>

        <strong>
          Choose an assignment
        </strong>

        <p>
          The class, teacher, deadline, and status
          will appear here.
        </p>

      </div>
    `;
  }

  const instructions =
    $("assignmentWorkspaceInstructions");

  if (instructions){
    instructions.innerHTML = `
      <p>
        Select an assignment to review its instructions.
      </p>
    `;
  }

  const resources =
    $("assignmentWorkspaceResources");

  if (resources){
    resources.innerHTML = `
      <div class="assignment-workspace-empty compact">

        <i
          class="fa-solid fa-paperclip"
          aria-hidden="true"
        ></i>

        <span>
          No assignment resources selected.
        </span>

      </div>
    `;
  }

  const existingPanel =
    $("assignmentWorkspaceExistingSubmission");

  if (existingPanel){
    existingPanel.hidden = true;
  }

  renderAssignmentWorkspaceHistory(
    null,
    null
  );

  renderAssignmentWorkspaceFeedback(
    null
  );

  setAssignmentWorkspaceSubmitState(
    null,
    null
  );
}


/* =========================================================
   ASSIGNMENT SUMMARY
========================================================= */

function renderAssignmentWorkspaceSummary(
  assignment,
  submission
){
  const classInfo =
    getStudentAssignmentClass(
      assignment
    );

  const teacher =
    getStudentAssignmentTeacher(
      assignment
    );

  const status =
    getStudentAssignmentStatus(
      assignment
    );

  const due =
    getAssignmentDuePresentation(
      assignment,
      status
    );

  setText(
    "assignmentWorkspaceTitle",
    assignment?.title ||
    "Untitled assignment"
  );

  setText(
    "assignmentWorkspaceDescription",
    [
      classInfo.title,
      teacher.name,
      due.relative
    ]
      .filter(Boolean)
      .join(" • ")
  );

  const statusBadge =
    $("assignmentWorkspaceStatusBadge");

  if (statusBadge){
    statusBadge.className =
      `assignment-workspace-status ${status}`;

    statusBadge.textContent =
      getAssignmentStatusLabel(
        status
      );
  }

  const summary =
    $("assignmentWorkspaceAssignmentSummary");

  if (summary){
    summary.innerHTML = `
      <div class="assignment-workspace-placeholder-icon">

        <i
          class="fa-solid fa-clipboard-check"
          aria-hidden="true"
        ></i>

      </div>

      <div>

        <strong>
          ${escapeHtml(
            assignment?.title ||
            "Untitled assignment"
          )}
        </strong>

        <p>
          ${escapeHtml(
            classInfo.title
          )}
          •
          ${escapeHtml(
            teacher.name
          )}
          •
          ${escapeHtml(
            due.formatted
          )}
        </p>

      </div>
    `;
  }

  renderAssignmentWorkspaceInstructions(
    assignment
  );

  renderAssignmentWorkspaceResources(
    assignment
  );

  renderAssignmentWorkspaceExistingSubmission(
    assignment,
    submission
  );

  renderAssignmentWorkspaceHistory(
    assignment,
    submission
  );

  renderAssignmentWorkspaceFeedback(
    submission
  );

  setAssignmentWorkspaceSubmitState(
    assignment,
    submission
  );
}


/* =========================================================
   INSTRUCTIONS
========================================================= */

function renderAssignmentWorkspaceInstructions(
  assignment
){
  const container =
    $("assignmentWorkspaceInstructions");

  if (!container){
    return;
  }

  const instructions =
    String(
      assignment?.instructions ||
      assignment?.description ||
      ""
    ).trim();

  if (!instructions){
    container.innerHTML = `
      <div class="assignment-workspace-empty compact">

        <i
          class="fa-solid fa-align-left"
          aria-hidden="true"
        ></i>

        <span>
          No detailed instructions were provided.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML = `
    <p>
      ${escapeHtml(instructions)
        .replace(/\n/g,"<br>")}
    </p>
  `;
}


/* =========================================================
   TEACHER RESOURCES
========================================================= */

function getAssignmentWorkspaceResources(
  assignment
){
  const resources = [];

  const addResource = (
    title,
    url,
    type = "link"
  ) => {
    const cleanUrl =
      String(url || "")
        .trim();

    if (!cleanUrl){
      return;
    }

    resources.push({
      title:
        String(
          title ||
          "Assignment attachment"
        ).trim(),

      url:cleanUrl,
      type
    });
  };

  addResource(
    "Assignment attachment",
    assignment?.attachmentUrl,
    "attachment"
  );

  addResource(
    "Assignment file",
    assignment?.fileUrl,
    "file"
  );

  if (
    Array.isArray(
      assignment?.attachments
    )
  ){
    assignment.attachments
      .forEach(
        (
          resource,
          index
        ) => {
          if (
            typeof resource ===
              "string"
          ){
            addResource(
              `Attachment ${index + 1}`,
              resource,
              "attachment"
            );

            return;
          }

          addResource(
            resource?.title ||
            resource?.name ||
            `Attachment ${index + 1}`,

            resource?.url ||
            resource?.fileUrl,

            resource?.type ||
            "attachment"
          );
        }
      );
  }

  return resources;
}


function renderAssignmentWorkspaceResources(
  assignment
){
  const container =
    $("assignmentWorkspaceResources");

  if (!container){
    return;
  }

  const resources =
    getAssignmentWorkspaceResources(
      assignment
    );

  if (!resources.length){
    container.innerHTML = `
      <div class="assignment-workspace-empty compact">

        <i
          class="fa-solid fa-paperclip"
          aria-hidden="true"
        ></i>

        <span>
          This assignment has no attachments.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    resources
      .map(resource => `
        <div class="assignment-workspace-resource-item">

          <span class="assignment-workspace-resource-icon">

            <i
              class="fa-solid fa-paperclip"
              aria-hidden="true"
            ></i>

          </span>

          <span class="assignment-workspace-resource-copy">

            <strong>
              ${escapeHtml(
                resource.title
              )}
            </strong>

            <span>
              ${escapeHtml(
                resource.type
              )}
            </span>

          </span>

          <a
            href="${escapeHtml(
              resource.url
            )}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open
          </a>

        </div>
      `)
      .join("");
}


/* =========================================================
   EXISTING SUBMISSION
========================================================= */

function renderAssignmentWorkspaceExistingSubmission(
  assignment,
  submission
){
  const panel =
    $("assignmentWorkspaceExistingSubmission");

  const container =
    $("assignmentWorkspaceSubmissionDetails");

  if (
    !panel ||
    !container
  ){
    return;
  }

  if (!submission){
    panel.hidden = true;
    container.innerHTML = "";

    return;
  }

  panel.hidden = false;

  const status =
    String(
      submission?.status ||
      "submitted"
    )
      .trim()
      .toLowerCase();

  const attemptNumber =
    Math.max(
      1,
      Number(
        submission?.attemptNumber ||
        1
      )
    );

  const revisionNumber =
    Math.max(
      1,
      Number(
        submission?.revisionNumber ||
        1
      )
    );

  const submittedDate =
    submission?.submittedAt ||
    submission?.createdAt;

  const lastEditedDate =
    submission?.lastEditedAt ||
    submission?.updatedAt ||
    submittedDate;

  const returnedDate =
    submission?.returnedAt ||
    null;

  const returnedReason =
    String(
      submission?.returnedReason ||
      (
        status === "returned"
          ? submission?.feedback
          : ""
      ) ||
      ""
    ).trim();

  const locked =
    submission?.locked === true ||
    [
      "graded",
      "reviewed",
      "locked"
    ].includes(status) ||
    (
      submission?.grade !==
        undefined &&
      submission?.grade !==
        null &&
      submission?.grade !== ""
    );

  const statusLabel =
    getAssignmentStatusLabel(
      status
    );

  container.innerHTML = `

    <div class="assignment-workspace-submission-overview">

      <div class="assignment-workspace-submission-stat">

        <span>
          Attempt
        </span>

        <strong>
          ${attemptNumber}
        </strong>

      </div>

      <div class="assignment-workspace-submission-stat">

        <span>
          Revision
        </span>

        <strong>
          ${revisionNumber}
        </strong>

      </div>

      <div class="assignment-workspace-submission-stat">

        <span>
          Current status
        </span>

        <strong class="status-${escapeHtml(status)}">
          ${escapeHtml(statusLabel)}
        </strong>

      </div>

    </div>


    <div class="assignment-workspace-submission-row">

      <span>
        Submitted
      </span>

      <strong>
        ${escapeHtml(
          formatDateTime(
            submittedDate
          )
        )}
      </strong>

    </div>


    <div class="assignment-workspace-submission-row">

      <span>
        Last edited
      </span>

      <strong>
        ${escapeHtml(
          formatDateTime(
            lastEditedDate
          )
        )}
      </strong>

    </div>


    ${
      submission?.fileUrl
        ? `
          <div class="assignment-workspace-submission-row">

            <span>
              Submitted file
            </span>

            <strong>

              <a
                href="${escapeHtml(
                  submission.fileUrl
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i
                  class="fa-solid fa-arrow-up-right-from-square"
                  aria-hidden="true"
                ></i>

                Open submitted file
              </a>

            </strong>

          </div>
        `
        : ""
    }


    ${
      status === "returned"
        ? `
          <div class="assignment-workspace-return-panel">

            <div class="assignment-workspace-return-icon">

              <i
                class="fa-solid fa-rotate-left"
                aria-hidden="true"
              ></i>

            </div>

            <div>

              <strong>
                Returned for revision
              </strong>

              ${
                returnedDate
                  ? `
                    <span>
                      ${escapeHtml(
                        formatDateTime(
                          returnedDate
                        )
                      )}
                    </span>
                  `
                  : ""
              }

              <p>
                ${
                  returnedReason
                    ? escapeHtml(
                        returnedReason
                      ).replace(
                        /\n/g,
                        "<br>"
                      )
                    : "Your teacher requested changes before this work can be accepted."
                }
              </p>

            </div>

          </div>
        `
        : ""
    }


    ${
      submission?.grade !==
        undefined &&
      submission?.grade !==
        null &&
      submission?.grade !== ""
        ? `
          <div class="assignment-workspace-submission-row">

            <span>
              Grade
            </span>

            <strong class="assignment-workspace-submission-grade">
              ${escapeHtml(
                submission.grade
              )}
            </strong>

          </div>
        `
        : ""
    }


    ${
      locked
        ? `
          <div class="assignment-workspace-lock-notice">

            <i
              class="fa-solid fa-lock"
              aria-hidden="true"
            ></i>

            <div>

              <strong>
                Submission locked
              </strong>

              <span>
                This work has been reviewed and can no longer
                be edited unless your teacher returns it.
              </span>

            </div>

          </div>
        `
        : ""
    }

  `;
}

/* =========================================================
   HISTORY
========================================================= */


function getAssignmentHistoryPresentation(
  item
){
  const action =
    String(
      item?.action ||
      item?.status ||
      "updated"
    )
      .trim()
      .toLowerCase();

  const attempt =
    Math.max(
      1,
      Number(
        item?.attempt ||
        item?.attemptNumber ||
        1
      )
    );

  const revision =
    Math.max(
      1,
      Number(
        item?.revision ||
        item?.revisionNumber ||
        1
      )
    );

  const presentations = {
    published:{
      title:"Assignment published",
      className:"published"
    },

    submitted:{
      title:"Work submitted",
      className:"submitted"
    },

    updated:{
      title:"Submission updated",
      className:"updated"
    },

    resubmitted:{
      title:"Work resubmitted",
      className:"resubmitted"
    },

    returned:{
      title:"Returned for revision",
      className:"returned"
    },

    reviewed:{
      title:"Submission reviewed",
      className:"reviewed"
    },

    graded:{
      title:"Submission graded",
      className:"graded"
    },

    locked:{
      title:"Submission locked",
      className:"locked"
    }
  };

  const presentation =
    presentations[action] ||
    presentations.updated;

  const subtitle =
    action === "published"
      ? "Assignment activity"
      : `Attempt ${attempt} • Revision ${revision}`;

  return {
    ...presentation,
    subtitle
  };
}

function renderAssignmentWorkspaceHistory(
  assignment,
  submission
){
  const container =
    $("assignmentWorkspaceHistory");

  if (!container){
    return;
  }

  if (!assignment){
    container.innerHTML = `
      <div class="assignment-workspace-empty">

        <i
          class="fa-regular fa-clock"
          aria-hidden="true"
        ></i>

        <div>

          <strong>
            No assignment selected
          </strong>

          <p>
            Select an assignment to view its activity.
          </p>

        </div>

      </div>
    `;

    return;
  }

  const history =
    Array.isArray(
      submission?.submissionHistory
    )
      ? submission.submissionHistory
      : [];

  const normalizedHistory =
    history
      .map((item,index) => ({
        id:
          normalizeId(
            item?._id
          ) ||
          `history-${index}`,

        revision:
          Math.max(
            1,
            Number(
              item?.revisionNumber ||
              item?.revision ||
              index + 1
            )
          ),

        attempt:
          Math.max(
            1,
            Number(
              item?.attemptNumber ||
              item?.attempt ||
              1
            )
          ),

        action:
          String(
            item?.action ||
            item?.status ||
            "updated"
          )
            .trim()
            .toLowerCase(),

        status:
          String(
            item?.status ||
            "submitted"
          )
            .trim()
            .toLowerCase(),

        text:
          String(
            item?.text || ""
          ),

        fileUrl:
          String(
            item?.fileUrl || ""
          ),

        grade:
          item?.grade,

        feedback:
          String(
            item?.feedback || ""
          ),

        date:
          item?.createdAt ||
          item?.editedAt ||
          item?.submittedAt ||
          null
      }))
      .sort(
        (first,second) =>
          new Date(
            second.date || 0
          ).getTime() -
          new Date(
            first.date || 0
          ).getTime()
      );

  /*
    Backward compatibility for submissions created before
    submissionHistory existed.
  */

  if (
    !normalizedHistory.length &&
    submission
  ){
    normalizedHistory.push({
      id:"legacy-submission",
      revision:
        Number(
          submission?.revisionNumber ||
          1
        ),
      attempt:
        Number(
          submission?.attemptNumber ||
          1
        ),
      action:
        String(
          submission?.status ||
          "submitted"
        ).toLowerCase(),
      status:
        String(
          submission?.status ||
          "submitted"
        ).toLowerCase(),
      text:
        String(
          submission?.text || ""
        ),
      fileUrl:
        String(
          submission?.fileUrl || ""
        ),
      grade:
        submission?.grade,
      feedback:
        String(
          submission?.feedback || ""
        ),
      date:
        submission?.submittedAt ||
        submission?.createdAt
    });
  }

  const assignmentPublishedItem = {
    id:"assignment-published",
    revision:0,
    attempt:0,
    action:"published",
    status:"published",
    text:"",
    fileUrl:"",
    grade:null,
    feedback:"",
    date:
      assignment?.createdAt ||
      assignment?.publishedAt ||
      null
  };

  const timelineItems = [
    ...normalizedHistory,
    assignmentPublishedItem
  ]
    .filter(item =>
      item.date
    )
    .sort(
      (first,second) =>
        new Date(
          second.date
        ).getTime() -
        new Date(
          first.date
        ).getTime()
    );

  if (!timelineItems.length){
    container.innerHTML = `
      <div class="assignment-workspace-empty">

        <i
          class="fa-regular fa-clock"
          aria-hidden="true"
        ></i>

        <div>

          <strong>
            No submission history
          </strong>

          <p>
            Activity will appear after work has been
            submitted or reviewed.
          </p>

        </div>

      </div>
    `;

    return;
  }

  container.innerHTML =
    timelineItems
      .map(item => {
        const presentation =
          getAssignmentHistoryPresentation(
            item
          );

        return `
          <article
            class="
              assignment-workspace-history-item
              ${escapeHtml(
                presentation.className
              )}
            "
          >

            <div class="assignment-workspace-history-head">

              <div>

                <strong>
                  ${escapeHtml(
                    presentation.title
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    presentation.subtitle
                  )}
                </span>

              </div>

              <time
                datetime="${escapeHtml(
                  item.date
                    ? new Date(
                        item.date
                      ).toISOString()
                    : ""
                )}"
              >
                ${escapeHtml(
                  formatDateTime(
                    item.date
                  )
                )}
              </time>

            </div>

            ${
              item.text
                ? `
                  <p class="assignment-workspace-history-preview">
                    ${escapeHtml(
                      item.text
                    )}
                  </p>
                `
                : ""
            }

            ${
              item.fileUrl
                ? `
                  <a
                    class="assignment-workspace-history-file"
                    href="${escapeHtml(
                      item.fileUrl
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i
                      class="fa-solid fa-paperclip"
                      aria-hidden="true"
                    ></i>

                    Open attached file
                  </a>
                `
                : ""
            }

            ${
              item.grade !==
                undefined &&
              item.grade !==
                null &&
              item.grade !== ""
                ? `
                  <div class="assignment-workspace-history-grade">
                    Grade:
                    <strong>
                      ${escapeHtml(
                        item.grade
                      )}
                    </strong>
                  </div>
                `
                : ""
            }

            ${
              item.feedback
                ? `
                  <div class="assignment-workspace-history-feedback">
                    ${escapeHtml(
                      item.feedback
                    )}
                  </div>
                `
                : ""
            }

          </article>
        `;
      })
      .join("");
}

/* =========================================================
   GRADE AND FEEDBACK
========================================================= */

function renderAssignmentWorkspaceFeedback(
  submission
){
  const container =
    $("assignmentWorkspaceFeedback");

  if (!container){
    return;
  }

  const hasGrade =
    submission?.grade !==
      undefined &&
    submission?.grade !==
      null &&
    submission?.grade !== "";

  const feedback =
    String(
      submission?.feedback || ""
    ).trim();

  if (
    !hasGrade &&
    !feedback
  ){
    container.innerHTML = `
      <div class="assignment-workspace-empty">

        <i
          class="fa-regular fa-comment-dots"
          aria-hidden="true"
        ></i>

        <div>

          <strong>
            No feedback yet
          </strong>

          <p>
            Your teacher’s grade and comments will
            appear after review.
          </p>

        </div>

      </div>
    `;

    return;
  }

  container.innerHTML = `
    ${
      hasGrade
        ? `
          <div class="assignment-workspace-grade-card">

            <div class="assignment-workspace-grade-copy">

              <span>
                Assignment grade
              </span>

              <strong>
                Teacher evaluation
              </strong>

            </div>

            <span class="assignment-workspace-grade-value">
              ${escapeHtml(
                submission.grade
              )}
            </span>

          </div>
        `
        : ""
    }

    ${
      feedback
        ? `
          <div class="assignment-workspace-feedback-message">

            <strong>
              Teacher feedback
            </strong>

            <p>
              ${escapeHtml(feedback)
                .replace(/\n/g,"<br>")}
            </p>

          </div>
        `
        : ""
    }
  `;
}


/* =========================================================
   SUBMIT BUTTON STATE
========================================================= */

function setAssignmentWorkspaceSubmitState(
  assignment,
  submission
){
  const button =
    $("assignmentWorkspaceSubmitButton");

  if (!button){
    return;
  }

  const status =
    String(
      submission?.status || ""
    )
      .trim()
      .toLowerCase();

  const graded =
    submission &&
    (
      submission?.grade !==
        undefined &&
      submission?.grade !==
        null &&
      submission?.grade !== ""
    );

  const locked =
    Boolean(
      submission &&
      (
        graded ||
        [
          "graded",
          "reviewed"
        ].includes(status)
      )
    );

  button.disabled =
    !assignment ||
    locked ||
    assignmentWorkspaceSubmitting;

  let label =
    "Submit work";

  let icon =
    "fa-solid fa-paper-plane";

  if (
    submission &&
    status === "returned"
  ){
    label =
      "Resubmit work";

    icon =
      "fa-solid fa-rotate";
  }else if (submission){
    label =
      locked
        ? "Submission reviewed"
        : "Update submission";

    icon =
      locked
        ? "fa-solid fa-lock"
        : "fa-solid fa-pen-to-square";
  }

  button.innerHTML = `
    <i
      class="${icon}"
      aria-hidden="true"
    ></i>

    <span>
      ${escapeHtml(label)}
    </span>
  `;
}

/* =========================================================
   LOAD SUBMISSION OR LOCAL DRAFT
========================================================= */

function loadAssignmentWorkspaceEditorValues(
  assignmentId
){
  const normalizedAssignmentId =
    normalizeId(
      assignmentId
    );

  const submission =
    normalizedAssignmentId
      ? getSubmissionForAssignment(
          normalizedAssignmentId
        )
      : null;

  const draft =
    normalizedAssignmentId
      ? readAssignmentWorkspaceDraft(
          normalizedAssignmentId
        )
      : null;

  const textInput =
    $("submissionText");

  const fileInput =
    $("submissionFile");

  /*
    Prefer a local draft when it exists. A draft represents
    the student's latest unsent changes.

    Otherwise, load the existing server submission.
  */

  const text =
    draft
      ? draft.text
      : String(
          submission?.text || ""
        );

  const fileUrl =
    draft
      ? draft.fileUrl
      : String(
          submission?.fileUrl || ""
        );

  if (textInput){
    textInput.value =
      text;
  }

  if (fileInput){
    fileInput.value =
      fileUrl;
  }

  /*
    Restore files already saved with the server submission.

    Pending File objects cannot survive a reload, so the
    pending queue must always start empty when the workspace
    is opened.
  */

  assignmentWorkspacePendingFiles =
    [];

  assignmentWorkspaceUploadedFiles =
    Array.isArray(
      submission?.attachments
    )
      ? submission.attachments
          .filter(attachment =>
            Boolean(
              attachment?.url ||
              attachment?.secureUrl
            )
          )
          .map(attachment => ({
            _id:
              normalizeId(
                attachment?._id
              ),

            url:
              String(
                attachment?.url ||
                attachment?.secureUrl ||
                ""
              ),

            secureUrl:
              String(
                attachment?.secureUrl ||
                attachment?.url ||
                ""
              ),

            publicId:
              String(
                attachment?.publicId ||
                ""
              ),

            originalName:
              String(
                attachment?.originalName ||
                attachment?.name ||
                "Attachment"
              ),

            mimeType:
              String(
                attachment?.mimeType ||
                "application/octet-stream"
              ),

            attachmentType:
              String(
                attachment?.attachmentType ||
                "file"
              ),

            resourceType:
              String(
                attachment?.resourceType ||
                "raw"
              ),

            size:
              Math.max(
                0,
                Number(
                  attachment?.size ||
                  attachment?.bytes ||
                  0
                ) || 0
              ),

            format:
              attachment?.format ||
              "",

            width:
              attachment?.width ??
              null,

            height:
              attachment?.height ??
              null,

            duration:
              attachment?.duration ??
              null,

            uploadedBy:
              attachment?.uploadedBy ||
              null,

            uploadedAt:
              attachment?.uploadedAt ||
              null
          }))
      : [];

  assignmentWorkspaceUploading =
    false;

  hideAssignmentUploadProgress();

  updateAssignmentUploadCounter();

  renderAssignmentAttachments();

  assignmentWorkspaceHasUnsavedChanges =
    false;

  updateAssignmentWorkspaceCharacterCount();

  renderAssignmentWorkspaceFilePreview();

  if (draft){
    const savedDate =
      draft.savedAt
        ? formatDateTime(
            draft.savedAt
          )
        : "";

    setAssignmentWorkspaceSaveStatus(
      "ready",
      savedDate
        ? `Draft restored • ${savedDate}`
        : "Draft restored"
    );

    return {
      source:"draft",
      submission,
      draft
    };
  }

  setAssignmentWorkspaceSaveStatus(
    "ready",
    submission
      ? "Submission loaded"
      : "Ready"
  );

  return {
    source:
      submission
        ? "submission"
        : "empty",

    submission,
    draft:null
  };
}

/* =========================================================
   WORKSPACE RENDER
========================================================= */

function renderAssignmentSubmissionWorkspace(
  assignmentId = ""
){
  const normalizedAssignmentId =
    normalizeId(
      assignmentId ||
      $("submissionAssignmentId")
        ?.value
    );

  const assignment =
    getStudentAssignments()
      .find(item =>
        sameId(
          item?._id ||
          item?.id,
          normalizedAssignmentId
        )
      );

  if (!assignment){
    renderEmptyAssignmentWorkspace();

    updateAssignmentWorkspaceCharacterCount();

    renderAssignmentWorkspaceFilePreview();

    return;
  }

  const submission =
    getSubmissionForAssignment(
      normalizedAssignmentId
    );

  renderAssignmentWorkspaceSummary(
    assignment,
    submission
  );

  updateAssignmentWorkspaceCharacterCount();

  renderAssignmentWorkspaceFilePreview();
}


/* =========================================================
   OPEN WORKSPACE
========================================================= */

function openSubmissionModal(
  assignmentId = ""
){
  hydrateSubmissionSelect(
    assignmentId
  );

  const select =
    $("submissionAssignmentId");

  if (
    select &&
    assignmentId
  ){
    select.value =
      normalizeId(
        assignmentId
      );
  }

  const selectedAssignmentId =
    normalizeId(
      assignmentId ||
      select?.value
    );

  const textInput =
    $("submissionText");

  bindAssignmentWorkspaceControls();

  loadAssignmentWorkspaceEditorValues(
    selectedAssignmentId
  );

  renderAssignmentSubmissionWorkspace(
    selectedAssignmentId
  );

  openModal(
    "submissionModal"
  );

  const modal =
    $("submissionModal");

  modal?.setAttribute(
    "aria-hidden",
    "false"
  );

  window.setTimeout(
    () => {
      if (selectedAssignmentId){
        textInput?.focus();
      }else{
        select?.focus();
      }
    },
    50
  );
}


/* =========================================================
   CONTROL BINDING
========================================================= */

function bindAssignmentWorkspaceControls(){
  if (
    assignmentWorkspaceControlsBound
  ){
    return;
  }

  const select =
    $("submissionAssignmentId");

  const textInput =
    $("submissionText");

  const fileInput =
    $("submissionFile");

  const clearButton =
    $("clearAssignmentResponseButton");

  const browseButton =
    $("assignmentWorkspaceBrowseButton");

  const uploadInput =
    $("assignmentWorkspaceFileInput");

  /*
    Open the device file picker when the student clicks
    the Choose Files button.
  */

  browseButton?.addEventListener(
    "click",
    event => {
      event.preventDefault();
      event.stopPropagation();

      if (
        assignmentWorkspaceUploading
      ){
        return;
      }

      uploadInput?.click();
    }
  );


  /*
    Add every selected file to the assignment upload queue.

    Resetting the input afterward allows the student to
    select the same file again if it was previously removed.
  */

  uploadInput?.addEventListener(
    "change",
    event => {
      const selectedFiles =
        Array.from(
          event.target.files ||
          []
        );

      if (
        selectedFiles.length
      ){
        addAssignmentFiles(
          selectedFiles
        );
      }

      event.target.value = "";
    }
  );


  /* =====================================================
     DRAG AND DROP
  ===================================================== */

  const dropzone =
    $("assignmentWorkspaceDropzone");

  const preventAssignmentDropDefaults =
    event => {
      event.preventDefault();
      event.stopPropagation();
    };


  [
    "dragenter",
    "dragover"
  ].forEach(
    eventName => {
      dropzone?.addEventListener(
        eventName,
        event => {
          preventAssignmentDropDefaults(
            event
          );

          if (
            assignmentWorkspaceUploading
          ){
            return;
          }

          dropzone.classList.add(
            "drag-active"
          );

          if (
            event.dataTransfer
          ){
            event.dataTransfer.dropEffect =
              "copy";
          }
        }
      );
    }
  );


  [
    "dragleave",
    "dragend"
  ].forEach(
    eventName => {
      dropzone?.addEventListener(
        eventName,
        event => {
          preventAssignmentDropDefaults(
            event
          );

          dropzone.classList.remove(
            "drag-active"
          );
        }
      );
    }
  );


  dropzone?.addEventListener(
    "drop",
    event => {
      preventAssignmentDropDefaults(
        event
      );

      dropzone.classList.remove(
        "drag-active"
      );

      if (
        assignmentWorkspaceUploading
      ){
        return;
      }

      const droppedFiles =
        Array.from(
          event.dataTransfer?.files ||
          []
        );

      if (
        droppedFiles.length
      ){
        addAssignmentFiles(
          droppedFiles
        );
      }
    }
  );


  /*
    Clicking anywhere on the dropzone opens the file picker,
    except when the actual Choose Files button was clicked.
    The button already has its own listener.
  */

  dropzone?.addEventListener(
    "click",
    event => {
      if (
        event.target.closest(
          "#assignmentWorkspaceBrowseButton"
        )
      ){
        return;
      }

      if (
        assignmentWorkspaceUploading
      ){
        return;
      }

      uploadInput?.click();
    }
  );


  /* =====================================================
     KEYBOARD ACCESSIBILITY
  ===================================================== */

  dropzone?.addEventListener(
    "keydown",
    event => {
      if (
        event.key !== "Enter" &&
        event.key !== " "
      ){
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (
        assignmentWorkspaceUploading
      ){
        return;
      }

      uploadInput?.click();
    }
  );


  select?.addEventListener(
    "change",
    () => {
      /*
        Save the previous assignment before switching.
      */

      flushAssignmentWorkspaceDraft();

      const assignmentId =
        normalizeId(
          select.value
        );

      loadAssignmentWorkspaceEditorValues(
        assignmentId
      );

      renderAssignmentSubmissionWorkspace(
        assignmentId
      );
    }
  );

  textInput?.addEventListener(
    "input",
    () => {
      updateAssignmentWorkspaceCharacterCount();

      scheduleAssignmentWorkspaceDraftSave();
    }
  );

  fileInput?.addEventListener(
    "input",
    () => {
      renderAssignmentWorkspaceFilePreview();

      scheduleAssignmentWorkspaceDraftSave();
    }
  );

  clearButton?.addEventListener(
    "click",
    () => {
      if (!textInput){
        return;
      }

      textInput.value = "";

      updateAssignmentWorkspaceCharacterCount();

      textInput.focus();

      scheduleAssignmentWorkspaceDraftSave();
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      const modal =
        $("submissionModal");

      if(
  event.key==="ArrowLeft"
){

  event.preventDefault();

  navigateStudentResourcePreview(
    -1
  );

  return;

}

if(
  event.key==="ArrowRight"
){

  event.preventDefault();

  navigateStudentResourcePreview(
    1
  );

  return;

}

      if (
        event.key !== "Escape" ||
        !modal?.classList.contains(
          "show"
        )
      ){
        return;
      }

      flushAssignmentWorkspaceDraft();

      closeModal(
        "submissionModal"
      );
    }
  );

    document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState !==
          "hidden"
      ){
        return;
      }

      const modal =
        $("submissionModal");

      if (
        modal?.classList.contains(
          "show"
        )
      ){
        flushAssignmentWorkspaceDraft();
      }
    }
  );


  window.addEventListener(
    "beforeunload",
    event => {
      const modal =
        $("submissionModal");

      if (
        !modal?.classList.contains(
          "show"
        ) ||
        !assignmentWorkspaceHasUnsavedChanges
      ){
        return;
      }

      flushAssignmentWorkspaceDraft();

      /*
        The browser controls the warning text.
      */

      event.preventDefault();

      event.returnValue = "";
    }
  );

  assignmentWorkspaceControlsBound =
    true;
}


/* =========================================================
   SUBMIT ASSIGNMENT
========================================================= */

async function submitAssignmentWork(){
  if (
    assignmentWorkspaceSubmitting
  ){
    return;
  }

  const assignmentId =
    normalizeId(
      $("submissionAssignmentId")
        ?.value
    );

  const text =
    String(
      $("submissionText")
        ?.value || ""
    ).trim();

  const fileUrl =
    String(
      $("submissionFile")
        ?.value || ""
    ).trim();

  if (!assignmentId){
    showAlert(
      "error",
      "Please select an assignment.",
      {
        title:"Assignment required"
      }
    );

    $("submissionAssignmentId")
      ?.focus();

    return;
  }

  if (
    !text &&
    !fileUrl
  ){
    showAlert(
      "error",
      "Write an answer or add a file URL before submitting.",
      {
        title:"Submission is empty"
      }
    );

    $("submissionText")
      ?.focus();

    return;
  }

  if (
    fileUrl &&
    !isValidSubmissionUrl(
      fileUrl
    )
  ){
    showAlert(
      "error",
      "Enter a valid file URL beginning with http:// or https://.",
      {
        title:"Invalid file link"
      }
    );

    $("submissionFile")
      ?.focus();

    return;
  }

  const assignment =
    getStudentAssignments()
      .find(item =>
        sameId(
          item?._id ||
          item?.id,
          assignmentId
        )
      );

  if (!assignment){
    showAlert(
      "error",
      "This assignment is no longer available.",
      {
        title:"Assignment unavailable"
      }
    );

    return;
  }

  const existingSubmission =
    getSubmissionForAssignment(
      assignmentId
    );

  const existingStatus =
    String(
      existingSubmission?.status ||
      ""
    )
      .trim()
      .toLowerCase();

  const submissionLocked =
    Boolean(
      existingSubmission &&
      (
        existingSubmission?.grade !==
          undefined &&
        existingSubmission?.grade !==
          null &&
        existingSubmission?.grade !== ""
      ||
        [
          "graded",
          "reviewed"
        ].includes(
          existingStatus
        )
      )
    );

  if (submissionLocked){
    showAlert(
      "warning",
      "This submission has already been reviewed and cannot be changed.",
      {
        title:"Submission locked"
      }
    );

    return;
  }

  const button =
    $("assignmentWorkspaceSubmitButton");

  assignmentWorkspaceSubmitting =
    true;

    removeAssignmentWorkspaceDraft(
      assignmentId
    );

    assignmentWorkspaceHasUnsavedChanges =
      false;

    setAssignmentWorkspaceSaveStatus(
      "ready",
      existingSubmission
        ? "Submission updated"
        : "Work submitted"
    );
  

  if (button){
    button.disabled = true;

    button.innerHTML = `
      <i
        class="fa-solid fa-spinner fa-spin"
        aria-hidden="true"
      ></i>

      <span>
        ${
          existingSubmission
            ? "Updating..."
            : "Submitting..."
        }
      </span>
    `;
  }

  try{
    await apiSend(
      "/api/submissions",
      "POST",
{
    assignmentId,

    text,

    attachments:
      assignmentWorkspaceUploadedFiles
}
    );

    setAssignmentWorkspaceSaveStatus(
      "ready",
      existingSubmission
        ? "Submission updated"
        : "Work submitted"
    );

    showAlert(
      "success",
      existingSubmission
        ? "Your assignment submission was updated."
        : "Your assignment was submitted successfully.",
      {
        title:
          existingSubmission
            ? "Submission updated"
            : "Work submitted"
      }
    );

    await loadAll();

    closeModal(
      "submissionModal"
    );

  }catch(error){
    console.error(
      "Assignment submission failed:",
      error
    );

    setAssignmentWorkspaceSaveStatus(
      "error",
      "Submission failed"
    );

    showAlert(
      "error",
      error?.message ||
      "AIFT could not submit your assignment.",
      {
        title:"Submission failed"
      }
    );

  }finally{
    assignmentWorkspaceSubmitting =
      false;

    const currentSubmission =
      getSubmissionForAssignment(
        assignmentId
      );

    setAssignmentWorkspaceSubmitState(
      assignment,
      currentSubmission
    );
  }
}

function setProgress(textId,barId,value){
  const safe = Math.max(0,Math.min(100,Number(value) || 0));

  setText(textId,safe + "%");

  const bar = $(barId);

  if (bar){
    bar.style.width = safe + "%";
  }
}

function goNotifications(){
  window.location.href = "notifications.html";
}

/* =========================================================
   STUDENT STUDIO GLOBAL SEARCH
========================================================= */

const STUDENT_SEARCH_LIMITS = Object.freeze({
  total:24,
  perGroup:6
});

let studentSearchActiveIndex = -1;
let studentSearchResults = [];
let studentSearchDebounceTimer = null;

function normalizeStudentSearchValue(value){
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g," ");
}

function getStudentSearchText(...values){
  return normalizeStudentSearchValue(
    values
      .flat(Infinity)
      .filter(
        value =>
          value !== undefined &&
          value !== null &&
          value !== ""
      )
      .join(" ")
  );
}

function createStudentSearchItem({
  id,
  group,
  type,
  title,
  subtitle,
  keywords,
  icon,
  page,
  action,
  payload
}){
  return {
    id:String(id || ""),
    group:String(group || "Other"),
    type:String(type || ""),
    title:String(title || "Untitled"),
    subtitle:String(subtitle || ""),
    keywords:getStudentSearchText(
      title,
      subtitle,
      keywords
    ),
    icon:String(icon || "fa-solid fa-magnifying-glass"),
    page:page
      ? normalizeStudentStudioPage(page)
      : "overview",
    action:String(action || "page"),
    payload:payload || {}
  };
}

function buildStudentStudioSearchIndex(){
  const items = [];

  const sections = [
    {
      id:"overview",
      title:"Dashboard",
      subtitle:"Learning overview, progress, and recent activity",
      keywords:"home overview learning workspace",
      icon:"fa-solid fa-table-cells-large",
      page:"overview"
    },
    {
      id:"classes",
      title:"My Classes",
      subtitle:"Open classes, lessons, teachers, and modules",
      keywords:"courses lessons modules learning",
      icon:"fa-solid fa-book-open",
      page:"classes"
    },
    {
      id:"assignments",
      title:"Assignment Center",
      subtitle:"Review, submit, and track coursework",
      keywords:"tasks homework submission due graded",
      icon:"fa-solid fa-clipboard-check",
      page:"assignments"
    },
    {
      id:"schedule",
      title:"Calendar",
      subtitle:"Classes, meetings, schedules, and deadlines",
      keywords:"schedule calendar meeting event deadline",
      icon:"fa-regular fa-calendar",
      page:"schedule"
    },
    {
      id:"progress",
      title:"Learning Analytics",
      subtitle:"Completion, attendance, grades, and engagement",
      keywords:"analytics progress attendance performance grade",
      icon:"fa-solid fa-chart-line",
      page:"progress"
    },
    {
      id:"resources",
      title:"Resources",
      subtitle:"Learning files, links, recordings, and materials",
      keywords:"library files documents videos resources",
      icon:"fa-regular fa-folder-open",
      page:"resources"
    },
    {
      id:"certificates",
      title:"Certificates",
      subtitle:"Review earned learning achievements",
      keywords:"certificate achievement award completion",
      icon:"fa-solid fa-certificate",
      page:"certificates"
    },
    {
      id:"portfolio",
      title:"Student Portfolio",
      subtitle:"Projects, completed work, and achievements",
      keywords:"portfolio projects showcase work",
      icon:"fa-solid fa-briefcase",
      page:"portfolio"
    },
    {
      id:"ai",
      title:"AI Learning",
      subtitle:"Explanations, summaries, quizzes, and study support",
      keywords:"ai tutor explain summary quiz grammar",
      icon:"fa-solid fa-wand-magic-sparkles",
      page:"ai"
    },
    {
      id:"career",
      title:"Career Hub",
      subtitle:"Career preparation and professional development",
      keywords:"career jobs interview resume cv",
      icon:"fa-solid fa-briefcase",
      page:"career"
    },
    {
      id:"messages",
      title:"Messages",
      subtitle:"Communicate with teachers and classmates",
      keywords:"messages chat communication teacher student",
      icon:"fa-regular fa-comment-dots",
      page:"messages"
    },
    {
      id:"settings",
      title:"Student Studio Settings",
      subtitle:"Preferences, privacy, notifications, and accessibility",
      keywords:"settings preferences account privacy notifications",
      icon:"fa-solid fa-sliders",
      page:"settings"
    }
  ];

  sections.forEach(section => {
    items.push(
      createStudentSearchItem({
        ...section,
        group:"Studio",
        type:"Workspace",
        action:"page"
      })
    );
  });

  getStudentClasses().forEach(cls => {
    const teacher =
      cls.teacherId?.name ||
      cls.teacherName ||
      "Teacher not assigned";

    items.push(
      createStudentSearchItem({
        id:`class-${normalizeId(cls._id)}`,
        group:"Classes",
        type:"Class",
        title:cls.title || "Untitled class",
        subtitle:[
          cls.subject,
          teacher,
          cls.schedule
        ]
          .filter(Boolean)
          .join(" · "),
        keywords:[
          cls.description,
          cls.classCode,
          cls.level,
          cls.language,
          cls.teacherId?.email
        ],
        icon:"fa-solid fa-graduation-cap",
        page:"classes",
        action:"class",
        payload:{
          classId:normalizeId(cls._id)
        }
      })
    );
  });

  getStudentAssignments().forEach(assignment => {
    const classTitle =
      assignment.classId?.title ||
      assignment.classTitle ||
      "";

    const submission =
      getSubmissionForAssignment(
        assignment._id
      );

    const status =
      submission
        ? submission.status ||
          "submitted"
        : "pending";

    items.push(
      createStudentSearchItem({
        id:`assignment-${normalizeId(assignment._id)}`,
        group:"Assignments",
        type:"Assignment",
        title:assignment.title || "Untitled assignment",
        subtitle:[
          classTitle,
          `Due ${formatDate(
            assignment.dueDate ||
            assignment.deadline
          )}`,
          status
        ]
          .filter(Boolean)
          .join(" · "),
        keywords:[
          assignment.description,
          assignment.instructions,
          assignment.subject,
          assignment.teacherId?.name,
          status
        ],
        icon:
          submission
            ? "fa-solid fa-circle-check"
            : "fa-regular fa-clipboard",
        page:"assignments",
        action:"assignment",
        payload:{
          assignmentId:
            normalizeId(assignment._id)
        }
      })
    );
  });

  state.schedules.forEach(schedule => {
    const classTitle =
      schedule.classId?.title ||
      schedule.className ||
      schedule.title ||
      "Scheduled activity";

    items.push(
      createStudentSearchItem({
        id:`schedule-${normalizeId(schedule._id)}`,
        group:"Schedule",
        type:"Schedule",
        title:classTitle,
        subtitle:[
          formatDateTime(
            schedule.startAt ||
            schedule.startDate ||
            schedule.date
          ),
          schedule.teacherId?.name ||
          schedule.teacherName,
          schedule.location
        ]
          .filter(Boolean)
          .join(" · "),
        keywords:[
          schedule.notes,
          schedule.description,
          schedule.meetingLink,
          schedule.scheduleType,
          schedule.sessionType
        ],
        icon:"fa-regular fa-calendar-days",
        page:"schedule",
        action:"schedule",
        payload:{
          scheduleId:
            normalizeId(schedule._id)
        }
      })
    );
  });

  state.teachers.forEach(teacher => {
    items.push(
      createStudentSearchItem({
        id:`teacher-${normalizeId(teacher._id)}`,
        group:"Teachers",
        type:"Teacher",
        title:teacher.name || "Teacher",
        subtitle:[
          teacher.subject,
          teacher.profession,
          teacher.email
        ]
          .filter(Boolean)
          .join(" · "),
        keywords:[
          teacher.department,
          teacher.bio,
          teacher.course
        ],
        icon:"fa-solid fa-chalkboard-user",
        page:"classes",
        action:"teacher",
        payload:{
          teacherId:
            normalizeId(teacher._id)
        }
      })
    );
  });

  state.schoolUpdates.forEach(update => {
    items.push(
      createStudentSearchItem({
        id:`update-${normalizeId(update._id)}`,
        group:"Updates",
        type:"Announcement",
        title:
          update.title ||
          "School update",
        subtitle:[
          formatDateTime(update.createdAt),
          update.pinned
            ? "Pinned"
            : ""
        ]
          .filter(Boolean)
          .join(" · "),
        keywords:[
          update.message,
          update.description,
          update.content,
          update.type
        ],
        icon:
          update.type === "urgent"
            ? "fa-solid fa-triangle-exclamation"
            : "fa-solid fa-bullhorn",
        page:"overview",
        action:"update",
        payload:{
          updateId:
            normalizeId(update._id)
        }
      })
    );
  });

  return items;
}

function scoreStudentSearchItem(item,query){
  const normalizedQuery =
    normalizeStudentSearchValue(query);

  if (!normalizedQuery){
    return 0;
  }

  const terms =
    normalizedQuery
      .split(" ")
      .filter(Boolean);

  const title =
    normalizeStudentSearchValue(
      item.title
    );

  const subtitle =
    normalizeStudentSearchValue(
      item.subtitle
    );

  const keywords =
    normalizeStudentSearchValue(
      item.keywords
    );

  let score = 0;

  if (title === normalizedQuery){
    score += 120;
  }

  if (title.startsWith(normalizedQuery)){
    score += 75;
  }

  if (title.includes(normalizedQuery)){
    score += 55;
  }

  if (subtitle.includes(normalizedQuery)){
    score += 28;
  }

  if (keywords.includes(normalizedQuery)){
    score += 22;
  }

  terms.forEach(term => {
    if (title.startsWith(term)){
      score += 20;
    }else if (title.includes(term)){
      score += 14;
    }

    if (subtitle.includes(term)){
      score += 8;
    }

    if (keywords.includes(term)){
      score += 6;
    }
  });

  return score;
}

function searchStudentStudio(query){
  const normalizedQuery =
    normalizeStudentSearchValue(query);

  if (!normalizedQuery){
    return [];
  }

  return buildStudentStudioSearchIndex()
    .map(item => ({
      ...item,
      score:scoreStudentSearchItem(
        item,
        normalizedQuery
      )
    }))
    .filter(item => item.score > 0)
    .sort((first,second) => {
      if (second.score !== first.score){
        return second.score - first.score;
      }

      return first.title.localeCompare(
        second.title
      );
    })
    .slice(
      0,
      STUDENT_SEARCH_LIMITS.total
    );
}

function renderStudentSearchEmpty({
  title = "Search Student Studio",
  message = "Find classes, assignments, schedules, teachers, and resources."
} = {}){
  const container =
    $("studentGlobalSearchResults");

  if (!container){
    return;
  }

  container.innerHTML = `
    <div class="builder-global-search-empty">

      <strong>
        ${escapeHtml(title)}
      </strong>

      <span>
        ${escapeHtml(message)}
      </span>

    </div>
  `;
}

function groupStudentSearchResults(results){
  return results.reduce(
    (groups,item) => {
      if (!groups.has(item.group)){
        groups.set(item.group,[]);
      }

      if (
        groups.get(item.group).length <
        STUDENT_SEARCH_LIMITS.perGroup
      ){
        groups
          .get(item.group)
          .push(item);
      }

      return groups;
    },
    new Map()
  );
}

function renderStudentSearchResults(results){
  const container =
    $("studentGlobalSearchResults");

  if (!container){
    return;
  }

  studentSearchResults = results;
  studentSearchActiveIndex = -1;

  if (!results.length){
    renderStudentSearchEmpty({
      title:"No results found",
      message:
        "Try a class title, assignment, teacher, schedule, or workspace."
    });

    return;
  }

  const groups =
    groupStudentSearchResults(results);

  container.innerHTML =
    Array.from(groups.entries())
      .map(([group,items]) => `
        <section class="student-search-result-group">

          <div class="builder-global-search-group">
            ${escapeHtml(group)}
          </div>

          ${items.map(item => {
            const resultIndex =
              results.findIndex(
                result =>
                  result.id === item.id
              );

            return `
              <button
                class="builder-global-search-result"
                type="button"
                role="option"
                aria-selected="false"
                data-student-search-index="${resultIndex}"
              >

                <span class="builder-global-search-result-icon">

                  <i
                    class="${escapeHtml(item.icon)}"
                    aria-hidden="true"
                  ></i>

                </span>

                <span class="builder-global-search-result-copy">

                  <strong>
                    ${escapeHtml(item.title)}
                  </strong>

                  <small>
                    ${escapeHtml(
                      item.subtitle ||
                      item.type
                    )}
                  </small>

                </span>

                <span class="builder-global-search-result-type">
                  ${escapeHtml(item.type)}
                </span>

              </button>
            `;
          }).join("")}

        </section>
      `)
      .join("");

  container
    .querySelectorAll(
      "[data-student-search-index]"
    )
    .forEach(button => {
      button.addEventListener(
        "mouseenter",
        () => {
          setStudentSearchActiveResult(
            Number(
              button.dataset
                .studentSearchIndex
            )
          );
        }
      );

      button.addEventListener(
        "click",
        () => {
          activateStudentSearchResult(
            Number(
              button.dataset
                .studentSearchIndex
            )
          );
        }
      );
    });
}

function openStudentSearchResults(){
  const input =
    $("globalSearch");

  const results =
    $("studentGlobalSearchResults");

  if (!input || !results){
    return;
  }

  const query =
    input.value.trim();

  /*
    Never display the panel for an empty search.
  */

  if (!query){
    results.hidden = true;
    results.innerHTML = "";

    input.setAttribute(
      "aria-expanded",
      "false"
    );

    return;
  }

  results.hidden = false;

  input.setAttribute(
    "aria-expanded",
    "true"
  );
}

function closeStudentSearchResults({
  clear = false
} = {}){
  const input =
    $("globalSearch");

  const results =
    $("studentGlobalSearchResults");

  if (!input || !results){
    return;
  }

  results.hidden = true;

  input.setAttribute(
    "aria-expanded",
    "false"
  );

  input.removeAttribute(
    "aria-activedescendant"
  );

  studentSearchActiveIndex = -1;

  if (clear){
    input.value = "";

    const clearButton =
      $("studentGlobalSearchClear");

    if (clearButton){
      clearButton.hidden = true;
    }

    renderStudentSearchEmpty();
  }
}

function setStudentSearchActiveResult(index){
  if (!studentSearchResults.length){
    studentSearchActiveIndex = -1;
    return;
  }

  const boundedIndex =
    Math.max(
      0,
      Math.min(
        studentSearchResults.length - 1,
        Number(index) || 0
      )
    );

  studentSearchActiveIndex =
    boundedIndex;

  const buttons =
    Array.from(
      document.querySelectorAll(
        "[data-student-search-index]"
      )
    );

  buttons.forEach(button => {
    const active =
      Number(
        button.dataset
          .studentSearchIndex
      ) === boundedIndex;

    button.classList.toggle(
      "active",
      active
    );

    button.setAttribute(
      "aria-selected",
      String(active)
    );

    if (active){
      button.scrollIntoView({
        block:"nearest"
      });
    }
  });
}

function moveStudentSearchSelection(direction){
  if (!studentSearchResults.length){
    return;
  }

  const nextIndex =
    studentSearchActiveIndex < 0
      ? direction > 0
        ? 0
        : studentSearchResults.length - 1
      : (
          studentSearchActiveIndex +
          direction +
          studentSearchResults.length
        ) %
        studentSearchResults.length;

  setStudentSearchActiveResult(
    nextIndex
  );
}

function highlightStudentWorkspaceItem({
  selector,
  duration = 2200
}){
  const element =
    document.querySelector(selector);

  if (!element){
    return;
  }

  element.scrollIntoView({
    behavior:"smooth",
    block:"center"
  });

  element.classList.add(
    "student-search-target"
  );

  window.setTimeout(
    () => {
      element.classList.remove(
        "student-search-target"
      );
    },
    duration
  );
}

function activateStudentSearchResult(index){
  const item =
    studentSearchResults[index];

  if (!item){
    return;
  }

  closeStudentSearchResults();

  switch(item.action){

    case "class":
      activateStudentStudioPage(
        "classes"
      );

      window.setTimeout(
        () => {
          const classId =
            item.payload.classId;

          const target =
            document.querySelector(
              `[data-class-id="${CSS.escape(classId)}"]`
            );

          if (target){
            highlightStudentWorkspaceItem({
              selector:
                `[data-class-id="${CSS.escape(classId)}"]`
            });
          }else{
            openStudentClass(classId);
          }
        },
        120
      );
      break;

    case "assignment":
      activateStudentStudioPage(
        "assignments"
      );

      window.setTimeout(
        () => {
          const assignmentId =
            item.payload.assignmentId;

          const target =
            document.querySelector(
              `[data-assignment-id="${CSS.escape(assignmentId)}"]`
            );

          if (target){
            highlightStudentWorkspaceItem({
              selector:
                `[data-assignment-id="${CSS.escape(assignmentId)}"]`
            });
          }
        },
        120
      );
      break;

    case "schedule":
      activateStudentStudioPage(
        "schedule"
      );

      window.setTimeout(
        () => {
          const scheduleId =
            item.payload.scheduleId;

          const target =
            document.querySelector(
              `[data-schedule-id="${CSS.escape(scheduleId)}"]`
            );

          if (target){
            highlightStudentWorkspaceItem({
              selector:
                `[data-schedule-id="${CSS.escape(scheduleId)}"]`
            });
          }
        },
        120
      );
      break;

    case "teacher":
      activateStudentStudioPage(
        "classes"
      );
      break;

    case "update":
      activateStudentStudioPage(
        "overview"
      );

      window.setTimeout(
        () => {
          const updateId =
            item.payload.updateId;

          const target =
            document.querySelector(
              `[data-update-id="${CSS.escape(updateId)}"]`
            );

          if (target){
            highlightStudentWorkspaceItem({
              selector:
                `[data-update-id="${CSS.escape(updateId)}"]`
            });
          }
        },
        120
      );
      break;

    case "page":
    default:
      activateStudentStudioPage(
        item.page
      );
      break;
  }
}

function executeStudentSearch(){
  const input =
    $("globalSearch");

  if (!input){
    return;
  }

  const query =
    input.value.trim();



if (!query){
  studentSearchResults = [];
  studentSearchActiveIndex = -1;

  closeStudentSearchResults();

  return;
}

openStudentSearchResults();

  const results =
    searchStudentStudio(query);

  renderStudentSearchResults(results);
}

function handleStudentSearchKeyboard(event){
  switch(event.key){

    case "ArrowDown":
      event.preventDefault();

      openStudentSearchResults();

      moveStudentSearchSelection(1);
      break;

    case "ArrowUp":
      event.preventDefault();

      openStudentSearchResults();

      moveStudentSearchSelection(-1);
      break;

    case "Enter":
      if (
        studentSearchActiveIndex >= 0
      ){
        event.preventDefault();

        activateStudentSearchResult(
          studentSearchActiveIndex
        );

        return;
      }

      if (
        studentSearchResults.length
      ){
        event.preventDefault();

        activateStudentSearchResult(0);
      }
      break;

    case "Escape":
      event.preventDefault();

      closeStudentSearchResults();
      break;
  }
}


function initSearch(){
  const input =
    $("globalSearch");

  const resultContainer =
    $("studentGlobalSearchResults");

  if (!input || !resultContainer){
    return;
  }

  if (
    input.dataset.studentSearchInitialized ===
    "true"
  ){
    return;
  }

  input.dataset.studentSearchInitialized =
    "true";

  /*
    The search panel must always begin closed.
  */

  input.value = "";

  studentSearchResults = [];
  studentSearchActiveIndex = -1;

  resultContainer.hidden = true;
  resultContainer.innerHTML = "";

  input.setAttribute(
    "aria-expanded",
    "false"
  );

  input.addEventListener(
    "focus",
    () => {
      const query =
        input.value.trim();

      if (!query){
        closeStudentSearchResults();
        return;
      }

      executeStudentSearch();
    }
  );

  input.addEventListener(
    "input",
    () => {
      window.clearTimeout(
        studentSearchDebounceTimer
      );

      const query =
        input.value.trim();

      if (!query){
        studentSearchResults = [];
        studentSearchActiveIndex = -1;

        resultContainer.innerHTML = "";

        closeStudentSearchResults();

        return;
      }

      studentSearchDebounceTimer =
        window.setTimeout(
          executeStudentSearch,
          120
        );
    }
  );

  input.addEventListener(
    "keydown",
    event => {
      const query =
        input.value.trim();

      if (!query){
        if (
          event.key === "ArrowDown" ||
          event.key === "ArrowUp" ||
          event.key === "Enter" ||
          event.key === "Escape"
        ){
          closeStudentSearchResults();
        }

        return;
      }

      handleStudentSearchKeyboard(
        event
      );
    }
  );

  document.addEventListener(
    "click",
    event => {
      if (
        !event.target.closest(
          "#studentGlobalSearch"
        )
      ){
        closeStudentSearchResults();
      }
    }
  );

  window.addEventListener(
    "pageshow",
    () => {
      if (!input.value.trim()){
        resultContainer.innerHTML = "";
        closeStudentSearchResults();
      }
    }
  );
}

function initSocket(){
  if (typeof io === "undefined") return;

  try{
    const socket = io(API,{
      transports:["websocket","polling"],
      auth:{ token }
    });

    socket.on("connect",() => {
      socket.emit("join",{
        userId:getStudentId(),
        role:"student"
      });
    });

    [
      "assignment:new",
      "submission:reviewed",
      "schedule:new",
      "post:new",
      "notification:new"
    ].forEach(event => {
      socket.on(event,loadAll);
    });

  }catch(err){
    console.warn("Socket unavailable:",err);
  }
}

document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click",e => {
    if (e.target === modal){
      modal.classList.remove("show");
    }
  });
});

document.addEventListener("keydown",e => {
  if (e.key === "Escape"){
    document.querySelectorAll(".modal").forEach(modal => {
      modal.classList.remove("show");
    });
  }
});

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    /*
      =========================================================
      STUDENT STUDIO SHELL
      =========================================================

      Initialize the shared Student Studio shell first.

      This binds:
      - mobile hamburger
      - mobile sidebar overlay
      - sidebar navigation
      - profile/topbar actions
      - responsive sidebar behavior
      - Student Studio route controls
    */

    initializeStudentStudioShell();


    /*
      =========================================================
      GLOBAL SEARCH
      =========================================================
    */

    initSearch();


    /*
      =========================================================
      DELEGATED WORKSPACE ACTIONS
      =========================================================
    */

    bindStudentStudioDelegatedActions();


    /*
      =========================================================
      LOAD STUDENT DATA
      =========================================================
    */

    await loadAll();


    /*
      =========================================================
      RESTORE REQUESTED PAGE
      =========================================================
    */

    const requestedPage =
      new URLSearchParams(
        window.location.search
      ).get("section");


    openStudentStudioPage(
      requestedPage || "overview",
      {
        updateHistory:false,
        scroll:false,
        instant:true
      }
    );


    /*
      =========================================================
      REALTIME CONNECTION
      =========================================================
    */

    initSocket();

    if(role === "student"){
      await loadStudentFamilyApprovals(false);
    }

  }
);
