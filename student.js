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

const state = {
  loggedUser:null,
  me:null,

  classes:[],
  assignments:[],
  submissions:[],
  schedules:[],
  posts:[],
  schoolUpdates:[],
  teachers:[],

  studentResources:[],

  certificates:[],

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
  analytics:"progress"
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
        window.location.href =
          "support.html";
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
  $("studentProfileMenu")
    ?.querySelectorAll(
      "[data-profile-action]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const action =
            button.dataset.profileAction;

          closeStudentStudioMenus();

          switch(action){

            case "profile":
              window.location.href =
                selectedStudentId
                  ? `public-profile.html?id=${encodeURIComponent(
                      selectedStudentId
                    )}`
                  : "profile.html";
              break;

            case "settings":
              activateStudentStudioPage(
                "settings"
              );
              break;

            case "help":
              window.location.href =
                "support.html";
              break;

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
      headers:authHeaders()
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

  /*
    First use the profile currently being displayed.
  */

  const profileSchoolId =
    normalizeId(
      state.me?.schoolId?._id ||
      state.me?.schoolId ||
      state.me?.linkedSchoolId?._id ||
      state.me?.linkedSchoolId ||
      state.me?.companyId?._id ||
      state.me?.companyId
    );

  if (profileSchoolId){
    return profileSchoolId;
  }


  /*
    The public student profile may not expose schoolId.
    Fall back to the authenticated account loaded from
    GET /api/users/me.
  */

  const authenticatedSchoolId =
    normalizeId(
      state.loggedUser?.schoolId?._id ||
      state.loggedUser?.schoolId ||
      state.loggedUser?.linkedSchoolId?._id ||
      state.loggedUser?.linkedSchoolId ||
      state.loggedUser?.companyId?._id ||
      state.loggedUser?.companyId
    );

  if (authenticatedSchoolId){
    return authenticatedSchoolId;
  }


  /*
    Classes already loaded for the student provide another
    reliable source of the school relationship.
  */

  const classWithSchool =
    asArray(
      state.classes
    ).find(classItem =>
      normalizeId(
        classItem?.schoolId?._id ||
        classItem?.schoolId
      )
    );

  const classSchoolId =
    normalizeId(
      classWithSchool?.schoolId?._id ||
      classWithSchool?.schoolId
    );

  if (classSchoolId){
    return classSchoolId;
  }


  /*
    Assignment records can also identify the school when
    the user and class objects do not contain it.
  */

  const assignmentWithSchool =
    asArray(
      state.assignments
    ).find(assignment =>
      normalizeId(
        assignment?.schoolId?._id ||
        assignment?.schoolId
      )
    );

  return normalizeId(
    assignmentWithSchool?.schoolId?._id ||
    assignmentWithSchool?.schoolId
  );
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


async function loadStudentClassProgress({
  force = false
} = {}){
  if (
    state.classProgressLoading &&
    !force
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

            const response =
              await apiGet(
                `/api/classes/${
                  encodeURIComponent(
                    classId
                  )
                }/student-progress${query}`,
                null
              );

            if (
              !response ||
              !response.progress
            ){
              return {
                classId,
                data:
                  createEmptyStudentClassProgress(
                    classId
                  )
              };
            }

            return {
              classId,

              data:{
                ...response,
                available:true
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

        state.classProgressById.set(
          classId,
          createEmptyStudentClassProgress(
            classId
          )
        );
      }
    );

    state.classProgressLoaded =
      true;
  }finally{
    state.classProgressLoading =
      false;
  }
}

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
    const meRes = await apiGet("/api/users/me", null);
    state.loggedUser = meRes?.user || meRes;

    if (!state.loggedUser){
      showAlert("error","Unable to load student profile.");
      return;
    }

    if (selectedStudentId) {
      const publicRes = await apiGet(`/api/users/${selectedStudentId}/public`, null);
      state.me = publicRes?.user || publicRes || state.loggedUser;
    } else {
      state.me = state.loggedUser;
    }

    const schoolId = getSchoolId();
    const studentId = getStudentId();

const [
  classes,
  assignments,
  submissions,
  schedules,
  posts,
  schoolUpdates,
  studentResources,
  certificates,
  unread
] = await Promise.all([
      apiGet(
        `/api/classes?schoolId=${
          encodeURIComponent(
            schoolId
          )
        }`,
        []
      ),

      apiGet(
        `/api/assignments?schoolId=${
          encodeURIComponent(
            schoolId
          )
        }`,
        []
      ),

      apiGet(
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
        "/api/posts",
        []
      ),

      apiGet(
        `/api/school-updates?schoolId=${
          encodeURIComponent(
            schoolId
          )
        }`,
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

    state.classes =
      asArray(classes);

    state.assignments =
      asArray(assignments);

    state.submissions =
      asArray(submissions);

    state.schedules =
      asArray(schedules);

    state.posts =
      asArray(posts);

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

    /*
      Clear stale progress before loading the current
      student's class-specific results.
    */

    state.classProgressById.clear();

    state.classProgressLoaded =
      false;

    await loadStudentClassProgress({
      force:true
    });

    calculateMetrics();

renderProfile();

renderStats();

renderBadges();

hydrateSubmissionSelect();

if (
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

  }catch(err){
    console.error(err);
    showAlert("error","Student portal failed to load.");
  }
}

/* =========================================================
   CONTINUE LEARNING WORKSPACE
========================================================= */

function getContinueLearningProgress(item){
  return Math.max(
    0,
    Math.min(
      100,
      Number(
        item?.progress ??
        item?.completion ??
        item?.completionPercentage ??
        state.metrics?.completion ??
        0
      ) || 0
    )
  );
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
  const classes =
    getStudentClasses();

  const preferredClass =
    getPreferredStudentClass();

  const assignments =
    getContinueLearningPendingAssignments();

  const completion =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          state.metrics?.completion
        ) || 0
      )
    );

  const streak =
    Number(
      state.me?.learningStreak ||
      state.me?.streak ||
      0
    );

  setText(
    "continueActiveClassCount",
    classes.length
  );

  setText(
    "continueOverallCompletion",
    `${completion}%`
  );

  setText(
    "continuePendingAssignments",
    assignments.length
  );

  setText(
    "continueLearningStreak",
    `${streak} ${
      streak === 1
        ? "day"
        : "days"
    }`
  );

  renderContinueLearningHero(
    preferredClass
  );

  renderContinueLearningNextSteps(
    preferredClass,
    assignments
  );

  renderContinueLearningClasses(
    classes
  );

  renderContinueLearningAssignments(
    assignments
  );

  renderContinueLearningRecent(
    classes
  );
}

function renderContinueLearningHero(
  selectedClass
){
  const container =
    $("continueLearningHero");

  if (!container){
    return;
  }

  if (!selectedClass){
    container.innerHTML = `
      <div class="studio-widget-empty">

        <div class="studio-widget-empty-icon">

          <i
            class="fa-solid fa-book-open"
            aria-hidden="true"
          ></i>

        </div>

        <strong>
          No class available to continue
        </strong>

        <p>
          Your school has not assigned an active class
          to this account yet.
        </p>

        <button
          class="primary-btn"
          type="button"
          data-open-studio-page="classes"
        >
          Browse classes
        </button>

      </div>
    `;

    return;
  }

  const classId =
    selectedClass._id ||
    selectedClass.id;

  const progress =
    getContinueLearningProgress(
      selectedClass
    );

  const teacher =
    selectedClass.teacherId?.name ||
    selectedClass.teacherName ||
    "Instructor";

  const cover =
    getContinueLearningClassCover(
      selectedClass
    );

  container.innerHTML = `
    <div
      class="continue-hero-cover"
      style="background-image:url('${escapeHtml(
        cover
      )}')"
    >

      <span class="continue-hero-badge">
        Continue where you stopped
      </span>

    </div>

    <div class="continue-hero-content">

      <span class="continue-panel-eyebrow">
        Recommended next
      </span>

      <h3>
        ${escapeHtml(
          selectedClass.title ||
          "Current class"
        )}
      </h3>

      <p class="continue-hero-subject">
        ${escapeHtml(
          selectedClass.subject ||
          "Learning program"
        )}
      </p>

      <div class="continue-hero-teacher">

        <i
          class="fa-solid fa-chalkboard-user"
          aria-hidden="true"
        ></i>

        <span>
          ${escapeHtml(teacher)}
        </span>

      </div>

      <div class="studio-progress-track">

        <div
          class="studio-progress-value"
          style="width:${progress}%"
        ></div>

      </div>

      <div class="studio-progress-meta">

        <span>
          ${progress}% completed
        </span>

        <span>
          ${
            progress >= 100
              ? "Completed"
              : `${100 - progress}% remaining`
          }
        </span>

      </div>

      <div class="studio-widget-actions">

        <button
          class="primary-btn"
          type="button"
          data-studio-open-class="${escapeHtml(
            classId
          )}"
        >
          <i
            class="fa-solid fa-play"
            aria-hidden="true"
          ></i>

          Continue class
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
                rel="noopener noreferrer"
              >
                <i
                  class="fa-solid fa-video"
                  aria-hidden="true"
                ></i>

                Join live class
              </a>
            `
            : ""
        }

      </div>

    </div>
  `;
}

function renderContinueLearningNextSteps(
  selectedClass,
  assignments
){
  const container =
    $("continueLearningNextSteps");

  if (!container){
    return;
  }

  const nextAssignment =
    assignments[0];

  container.innerHTML = `
    <div class="studio-widget-heading">

      <div>

        <span class="studio-widget-eyebrow">
          NEXT STEPS
        </span>

        <h3>
          Keep your learning moving
        </h3>

      </div>

    </div>

    <div class="continue-next-list">

      <button
        type="button"
        class="continue-next-item"
        ${
          selectedClass
            ? `data-studio-open-class="${escapeHtml(
                selectedClass._id ||
                selectedClass.id
              )}"`
            : `data-open-studio-page="classes"`
        }
      >

        <span class="continue-next-icon blue">

          <i
            class="fa-solid fa-play"
            aria-hidden="true"
          ></i>

        </span>

        <span>

          <strong>
            Resume your current class
          </strong>

          <small>
            Continue from your latest learning progress
          </small>

        </span>

        <i
          class="fa-solid fa-chevron-right"
          aria-hidden="true"
        ></i>

      </button>


      <button
        type="button"
        class="continue-next-item"
        ${
          nextAssignment
            ? `data-submit-assignment="${escapeHtml(
                nextAssignment._id
              )}"`
            : `data-open-studio-page="assignments"`
        }
      >

        <span class="continue-next-icon orange">

          <i
            class="fa-solid fa-list-check"
            aria-hidden="true"
          ></i>

        </span>

        <span>

          <strong>
            ${
              nextAssignment
                ? escapeHtml(
                    nextAssignment.title ||
                    "Complete next assignment"
                  )
                : "Review assignments"
            }
          </strong>

          <small>
            ${
              nextAssignment
                ? `Due ${formatDate(
                    nextAssignment.dueDate ||
                    nextAssignment.deadline
                  )}`
                : "You have no pending coursework"
            }
          </small>

        </span>

        <i
          class="fa-solid fa-chevron-right"
          aria-hidden="true"
        ></i>

      </button>


      <button
        type="button"
        class="continue-next-item"
        data-open-studio-page="ai"
      >

        <span class="continue-next-icon purple">

          <i
            class="fa-solid fa-wand-magic-sparkles"
            aria-hidden="true"
          ></i>

        </span>

        <span>

          <strong>
            Ask the AI learning assistant
          </strong>

          <small>
            Get explanations, summaries, and practice
          </small>

        </span>

        <i
          class="fa-solid fa-chevron-right"
          aria-hidden="true"
        ></i>

      </button>

    </div>
  `;
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
          No active classes
        </strong>

        <p>
          Classes assigned by your school will appear here.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML =
    classes
      .slice(0,6)
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
                  ${
                    item.teacherId?.name
                      ? escapeHtml(
                          item.teacherId.name
                        )
                      : "Instructor"
                  }
                </span>

              </div>

              <button
                class="primary-btn"
                type="button"
                data-studio-open-class="${escapeHtml(
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

function renderContinueLearningAssignments(
  assignments
){
  const container =
    $("continueLearningAssignments");

  if (!container){
    return;
  }

  container.innerHTML = `
    <div class="studio-widget-heading">

      <div>

        <span class="studio-widget-eyebrow">
          COURSEWORK
        </span>

        <h3>
          Continue pending work
        </h3>

      </div>

      <button
        class="studio-widget-link"
        type="button"
        data-open-studio-page="assignments"
      >
        View all
      </button>

    </div>

    <div class="studio-assignment-timeline">

      ${
        assignments.length
          ? assignments
              .slice(0,4)
              .map(item => `
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
                    )}"
                  >
                    Continue
                  </button>

                </article>
              `)
              .join("")
          : `
            <div class="studio-widget-empty compact">

              <strong>
                Coursework completed
              </strong>

              <p>
                You have no pending assignments.
              </p>

            </div>
          `
      }

    </div>
  `;
}

function renderContinueLearningRecent(
  classes
){
  const container =
    $("continueLearningRecent");

  if (!container){
    return;
  }

  const recentClasses =
    [...classes]
      .sort((first,second) => {
        return (
          new Date(
            second.lastAccessedAt ||
            second.updatedAt ||
            0
          ).getTime() -
          new Date(
            first.lastAccessedAt ||
            first.updatedAt ||
            0
          ).getTime()
        );
      })
      .slice(0,4);

  container.innerHTML = `
    <div class="studio-widget-heading">

      <div>

        <span class="studio-widget-eyebrow">
          RECENTLY OPENED
        </span>

        <h3>
          Recent learning
        </h3>

      </div>

    </div>

    <div class="continue-recent-list">

      ${
        recentClasses.length
          ? recentClasses
              .map(item => `
                <button
                  class="continue-recent-item"
                  type="button"
                  data-studio-open-class="${escapeHtml(
                    item._id ||
                    item.id
                  )}"
                >

                  <span
                    class="continue-recent-thumbnail"
                    style="background-image:url('${escapeHtml(
                      getContinueLearningClassCover(
                        item
                      )
                    )}')"
                  ></span>

                  <span>

                    <strong>
                      ${escapeHtml(
                        item.title ||
                        "Class"
                      )}
                    </strong>

                    <small>
                      ${getContinueLearningProgress(
                        item
                      )}% complete
                    </small>

                  </span>

                  <i
                    class="fa-solid fa-play"
                    aria-hidden="true"
                  ></i>

                </button>
              `)
              .join("")
          : `
            <div class="studio-widget-empty compact">

              <strong>
                Nothing opened recently
              </strong>

              <p>
                Your recently accessed classes will appear here.
              </p>

            </div>
          `
      }

    </div>
  `;
}


/* =========================================================
   STUDENT STUDIO HOME RENDERER
========================================================= */

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
    getStudentClasses();

  if(!classes.length){
    return null;
  }

  return (
    classes.find(item =>
      Boolean(
        item.meetingLink ||
        item.published
      )
    ) ||
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

function resumeStudentLearning(){
  const selectedClass =
    typeof getPreferredStudentClass ===
    "function"
      ? getPreferredStudentClass()
      : (
          typeof getStudentClasses ===
          "function"
            ? getStudentClasses()[0]
            : null
        );

  if (!selectedClass){
    navigateStudentStudio(
      "classes"
    );

    if (
      typeof showAlert ===
      "function"
    ){
      showAlert(
        "info",
        "No class is currently available to resume."
      );
    }

    return;
  }

  const classId =
    selectedClass._id ||
    selectedClass.id;

  if (!classId){
    navigateStudentStudio(
      "classes"
    );

    return;
  }

  if (
    typeof openStudentClass ===
    "function"
  ){
    openStudentClass(classId);

    return;
  }

  window.location.href =
    `student-class.html?classId=${encodeURIComponent(
      classId
    )}`;
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
    "#continueLearningRefreshButton"
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
          "#resumeLearningButton"
        );

      if (resumeButton){
        event.preventDefault();

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

  resumeStudentLearning();

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
          window.location.href =
            `student-class.html?classId=${encodeURIComponent(
              classId
            )}`;
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

function openStudentClass(classId){
  if(!classId){
    return;
  }

  window.location.href =
    `student-class.html?classId=${encodeURIComponent(
      classId
    )}`;
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


        notifyAIFTInfo(
          "The certificate preview will be connected in the next step.",
          {
            title:
              "Certificate selected"
          }
        );

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

  studentCertificateControlsBound =
    true;

}

function renderStudentCareerHub(){
  window.location.href =
    "career-hub.html";
}

function renderStudentAILearning(){
  showAlert(
    "info",
    "The AI Learning workspace will be added in its dedicated module."
  );
}

function openStudentMessages(){
  window.location.href =
    "messages.html";
}

function renderStudentSettings(){
  showAlert(
    "info",
    "The Student Settings workspace will be added in its dedicated module."
  );
}

function calculateMetrics(){
  const assignments = getStudentAssignments();
  const submissions = getStudentSubmissions();

  const totalAssignments = assignments.length;
  const submittedCount = assignments.filter(item =>
    getSubmissionForAssignment(item._id)
  ).length;

  const reviewedCount = submissions.filter(sub =>
    ["reviewed","returned"].includes(String(sub.status || "").toLowerCase()) ||
    sub.grade ||
    sub.feedback
  ).length;

  const completion = totalAssignments
    ? Math.round((submittedCount / totalAssignments) * 100)
    : 0;

  const engagement = Math.min(
    100,
    Math.round(
      completion * 0.55 +
      getStudentClasses().length * 8 +
      submissions.length * 7
    )
  );

  const attendance = Math.min(
    100,
    state.schedules.length ? 75 : 0
  );

  const productivity = Math.min(
    100,
    Math.round(
      completion * 0.65 +
      reviewedCount * 8
    )
  );

  const overall = Math.round(
    completion * 0.45 +
    engagement * 0.25 +
    attendance * 0.15 +
    productivity * 0.15
  );

  state.metrics = {
    completion,
    attendance,
    engagement,
    productivity,
    overall
  };
}
function renderProfile(){
  const me = state.me || {};

  const name =
    String(
      me.name ||
      me.fullName ||
      me.displayName ||
      "Student"
    ).trim();

  const email =
    String(
      me.email ||
      "Student account"
    ).trim();

  const course =
    String(
      me.course ||
      me.program ||
      me.profession ||
      me.department ||
      "Learning workspace"
    ).trim();

  const schoolName =
    String(
      me.schoolId?.name ||
      me.linkedSchoolId?.name ||
      me.companyId?.name ||
      me.schoolName ||
      "AIFT Learning"
    ).trim();

  const avatar =
    me.profileImage ||
    me.avatar ||
    me.photoUrl ||
    FALLBACK_AVATAR;

  const cover =
    me.coverImage ||
    me.bannerImage ||
    FALLBACK_COVER;

  const avatarTargets = [
    "studentAvatar",
    "topAvatar",
    "leftStudentAvatar",
    "profileMenuAvatar"
  ];

  avatarTargets.forEach(id => {
    const image = $(id);

    if (!image){
      return;
    }

    image.src = avatar;
    image.alt = `${name} profile`;

    image.onerror = () => {
      image.onerror = null;
      image.src = FALLBACK_AVATAR;
    };
  });

  if ($("studentCover")){
    $("studentCover").style.backgroundImage =
      `url("${cover}")`;
  }

  [
    "studentName",
    "leftStudentName",
    "topStudentName",
    "profileMenuName",
    "studentNameHero"
  ].forEach(id => {
    setText(id,name);
  });

  [
    "studentSub",
    "leftStudentCourse"
  ].forEach(id => {
    setText(id,course);
  });

  setText(
    "studentHeroSubtitle",
    `${course} · Continue your learning journey`
  );

  setText(
    "topStudentRole",
    me.role
      ? String(me.role)
          .replace(/_/g," ")
          .replace(/\b\w/g,char => char.toUpperCase())
      : "Learner"
  );

  setText(
    "profileMenuEmail",
    email
  );

  setText(
    "studentSidebarSchool",
    schoolName
  );

  setText(
    "studentSidebarStatus",
    me.status === "archived"
      ? "Archived"
      : me.isSuspended
        ? "Restricted"
        : "Active"
  );

  const status = $("studentSidebarStatus");

  if (status){
    status.classList.toggle(
      "danger",
      Boolean(
        me.status === "archived" ||
        me.isSuspended
      )
    );
  }

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const heroHeading =
    document.querySelector(
      ".student-dashboard-greeting h1"
    );

  if (heroHeading){
    heroHeading.innerHTML = `
      ${escapeHtml(greeting)},
      <span id="studentNameHero">
        ${escapeHtml(name)}
      </span>
    `;
  }
}

function renderStats(){
  const classes =
    getStudentClasses();

  const assignments =
    getStudentAssignments();

  const submissions =
    getStudentSubmissions();

  const submittedAssignmentIds =
    new Set(
      submissions.map(item =>
        normalizeId(
          item.assignmentId?._id ||
          item.assignmentId
        )
      )
    );

  const pendingAssignments =
    assignments.filter(item =>
      !submittedAssignmentIds.has(
        normalizeId(item._id)
      )
    );

  const upcomingAssignments =
    pendingAssignments.filter(item => {
      const due =
        item.dueDate ||
        item.deadline;

      if (!due){
        return false;
      }

      const dueTime =
        new Date(due).getTime();

      if (!Number.isFinite(dueTime)){
        return false;
      }

      const difference =
        dueTime - Date.now();

      return (
        difference >= 0 &&
        difference <=
          7 * 24 * 60 * 60 * 1000
      );
    });

  const gradedSubmissions =
    submissions.filter(item =>
      item.grade !== undefined &&
      item.grade !== null &&
      String(item.grade).trim() !== ""
    );

  const numericGrades =
    gradedSubmissions
      .map(item => Number(item.grade))
      .filter(Number.isFinite);

  const averageGrade =
    numericGrades.length
      ? Math.round(
          numericGrades.reduce(
            (sum,value) => sum + value,
            0
          ) / numericGrades.length
        )
      : null;

  const completion =
    Math.max(
      0,
      Math.min(
        100,
        Number(state.metrics.completion) || 0
      )
    );

  const attendance =
    Math.max(
      0,
      Math.min(
        100,
        Number(state.metrics.attendance) || 0
      )
    );

  const overall =
    Math.max(
      0,
      Math.min(
        100,
        Number(state.metrics.overall) || 0
      )
    );

  const engagement =
    Math.max(
      0,
      Math.min(
        100,
        Number(state.metrics.engagement) || 0
      )
    );

  const productivity =
    Math.max(
      0,
      Math.min(
        100,
        Number(state.metrics.productivity) || 0
      )
    );

  setText("statClasses",classes.length);
  setText("statAssignments",assignments.length);
  setText("statSubmissions",submissions.length);
  setText("statCompletion",`${completion}%`);

  setText("productivityScore",`${productivity}%`);
  setText("attendanceScore",`${attendance}%`);
  setText("overallProgress",`${overall}%`);

  setText(
    "studentAttendancePercent",
    `${attendance}%`
  );

  setText(
    "studentAttendanceTrend",
    attendance >= 80
      ? "On track"
      : attendance > 0
        ? "Needs attention"
        : "No attendance data"
  );

  setText(
    "studentOverallProgress",
    `${overall}%`
  );

  setText(
    "studentAssignmentsDue",
    upcomingAssignments.length
  );

  setText(
    "studentQuizAverage",
    averageGrade === null
      ? "--"
      : `${averageGrade}%`
  );

  setText(
    "studentActiveClasses",
    classes.length
  );

  setText(
    "studentCertificates",
    Number(
      state.me?.certificateCount ||
      state.me?.certificates?.length ||
      0
    )
  );

  setText(
    "studentStudyHours",
    `${Number(
      state.me?.weeklyStudyHours ||
      state.me?.studyHours ||
      0
    )}h`
  );

  const streak =
    Number(
      state.me?.learningStreak ||
      state.me?.streak ||
      0
    );

  setText(
    "studentLearningStreak",
    streak
  );

  setText(
    "workspaceLearningStreak",
    `${streak} ${streak === 1 ? "day" : "days"}`
  );

  setText(
    "workspaceCompletionStatus",
    `${completion}%`
  );

  setText(
    "workspaceUpcomingCount",
    upcomingAssignments.length
  );

  setText(
    "overallLearningProgressText",
    `${completion}%`
  );

  setText(
    "studentProgressCompleted",
    `${submissions.length} completed`
  );

  setText(
    "studentProgressRemaining",
    `${pendingAssignments.length} remaining`
  );

  setText(
    "classesBadge",
    classes.length
  );

  setText(
    "assignmentBadge",
    pendingAssignments.length
  );

  setText(
    "scheduleBadge",
    state.schedules.length
  );

  const sidebarProgress =
    $("overallLearningProgressBar");

  if (sidebarProgress){
    sidebarProgress.style.width =
      `${completion}%`;
  }

  setProgress(
    "completionText",
    "completionBar",
    completion
  );

  setProgress(
    "attendanceText",
    "attendanceBar",
    attendance
  );

  setProgress(
    "engagementText",
    "engagementBar",
    engagement
  );
}

function renderBadges(){
  const badge = $("notificationBadge");

  if (!badge) return;

  if (state.unread > 0){
    badge.innerText = state.unread > 99 ? "99+" : state.unread;
    badge.style.display = "grid";
  } else {
    badge.style.display = "none";
  }
}

function renderAnnouncements(){
  const container = $("announcementList");
  if (!container) return;

  const updates = state.schoolUpdates
    .sort((a,b) => {
      const pinnedDiff = Number(b.pinned || false) - Number(a.pinned || false);
      if (pinnedDiff) return pinnedDiff;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    })
    .slice(0,10);

  if (!updates.length){
    container.innerHTML = `<div class="empty">No school updates yet.</div>`;
    return;
  }

  container.innerHTML = updates.map(update => `
    <article class="announcement-card">
      <div class="item-head">
        <div>
          <h3 class="item-title">${escapeHtml(update.title || "School Update")}</h3>
          <div class="item-sub">
            ${formatDateTime(update.createdAt)}
            ${update.classId?.title ? " • " + escapeHtml(update.classId.title) : ""}
          </div>
        </div>

        <span class="chip ${update.type === "urgent" ? "warning" : "primary"}">
          ${escapeHtml(update.type || "announcement")}
        </span>
      </div>

      <p class="item-desc">${escapeHtml(update.message || "")}</p>

${
  update.mediaUrl && update.mediaType === "image"
    ? `
      <div class="announcement-media">
        <img src="${update.mediaUrl}" alt="School update media">
      </div>
    `
    : ""
}

${
  update.mediaUrl && update.mediaType === "video"
    ? `
      <div class="announcement-media">
        <video src="${update.mediaUrl}" controls></video>
      </div>
    `
    : ""
}

      <div class="meta-row">
        ${update.pinned ? `<span class="chip warning">Pinned</span>` : ""}
        ${update.dueDate ? `<span class="chip success">Due ${formatDate(update.dueDate)}</span>` : ""}
        ${update.resourceUrl ? `<a class="chip primary" href="${update.resourceUrl}" target="_blank">Resource</a>` : ""}
      </div>
    </article>
  `).join("");
}

/* =========================================================
   STUDENT CLASSES WORKSPACE
========================================================= */

const STUDENT_CLASS_VIEW_STORAGE_KEY =
  "aiftStudentClassView";

let studentClassView =
  localStorage.getItem(
    STUDENT_CLASS_VIEW_STORAGE_KEY
  ) === "list"
    ? "list"
    : "grid";


function getStudentClassProgress(
  classItem
){
  const progressRecord =
    getStudentClassProgressRecord(
      classItem
    );

  const backendProgress =
    Number(
      progressRecord
        ?.progress
        ?.overall
    );

  if (
    Number.isFinite(
      backendProgress
    )
  ){
    return Math.max(
      0,
      Math.min(
        100,
        Math.round(
          backendProgress
        )
      )
    );
  }

  /*
    Compatibility fallback for old class records while
    the progress endpoint is unavailable.
  */

  return Math.max(
    0,
    Math.min(
      100,
      Number(
        classItem?.progress ??
        classItem?.completion ??
        classItem
          ?.completionPercentage ??
        0
      ) || 0
    )
  );
}


function getStudentClassStatus(classItem){
  if (
    classItem?.archived === true ||
    classItem?.status === "archived"
  ){
    return "archived";
  }

  if (
    classItem?.completed === true ||
    classItem?.status === "completed" ||
    getStudentClassProgress(classItem) >= 100
  ){
    return "completed";
  }

  const startsAt =
    classItem?.startDate ||
    classItem?.startsAt;

  if (
    startsAt &&
    new Date(startsAt).getTime() >
      Date.now()
  ){
    return "upcoming";
  }

  return "active";
}


function getStudentClassUpdatedTime(classItem){
  const value =
    classItem?.lastAccessedAt ||
    classItem?.updatedAt ||
    classItem?.createdAt ||
    0;

  const timestamp =
    new Date(value).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}


function getStudentClassScheduleTime(classItem){
  const value =
    classItem?.nextSessionAt ||
    classItem?.nextClassAt ||
    classItem?.startDate ||
    classItem?.startsAt;

  const timestamp =
    new Date(value || 0).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.MAX_SAFE_INTEGER;
}


function getStudentClassAssignmentCount(
  classItem
){
  const progressRecord =
    getStudentClassProgressRecord(
      classItem
    );

  const backendTotal =
    Number(
      progressRecord
        ?.progress
        ?.assignments
        ?.total
    );

  if (
    progressRecord?.available &&
    Number.isFinite(backendTotal)
  ){
    return Math.max(
      0,
      backendTotal
    );
  }

  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );

  const linkedAssignments =
    getStudentAssignments()
      .filter(assignment => {
        return sameId(
          assignment?.classId?._id ||
          assignment?.classId,
          classId
        );
      });

  return Number(
    classItem?.assignmentCount ??
    (
      Array.isArray(
        classItem?.assignments
      )
        ? classItem
            .assignments
            .length
        : linkedAssignments.length
    )
  ) || 0;
}

function getStudentClassLessonCount(
  classItem
){
  const progressRecord =
    getStudentClassProgressRecord(
      classItem
    );

  const backendTotal =
    Number(
      progressRecord
        ?.progress
        ?.lessons
        ?.total
    );

  if (
    progressRecord?.available &&
    Number.isFinite(backendTotal)
  ){
    return Math.max(
      0,
      backendTotal
    );
  }

  if (
    Array.isArray(
      classItem?.lessons
    )
  ){
    return classItem.lessons.length;
  }

  if (
    Array.isArray(
      classItem?.modules
    )
  ){
    return classItem.modules.reduce(
      (total,module) => {
        if (
          Array.isArray(
            module?.lessons
          )
        ){
          return (
            total +
            module.lessons.length
          );
        }

        return total;
      },
      0
    );
  }

  return Number(
    classItem?.lessonCount ||
    classItem?.lessonsCount ||
    0
  ) || 0;
}

function getStudentClassStudentCount(classItem){
  if (
    Array.isArray(classItem?.studentIds)
  ){
    return classItem.studentIds.length;
  }

  if (
    Array.isArray(classItem?.students)
  ){
    return classItem.students.length;
  }

  return Number(
    classItem?.studentCount ||
    classItem?.studentsCount ||
    0
  ) || 0;
}


function getStudentClassCover(classItem){
  return (
    classItem?.coverImage ||
    classItem?.bannerImage ||
    classItem?.thumbnail ||
    classItem?.image ||
    CLASS_FALLBACK
  );
}


function getStudentClassTeacher(classItem){
  return {
    name:
      classItem?.teacherId?.name ||
      classItem?.teacherName ||
      "Instructor",

    image:
      classItem?.teacherId
        ?.profilePicture ||
      classItem?.teacherId
        ?.profileImage ||
      classItem?.teacherImage ||
      FALLBACK_AVATAR
  };
}


function updateStudentClassSummary(classes){
  const total =
    classes.length;

  const active =
    classes.filter(
      item =>
        getStudentClassStatus(item) ===
        "active"
    ).length;

  const now =
    Date.now();

  const upcoming =
    state.schedules.filter(schedule => {
      const scheduleClassId =
        normalizeId(
          schedule?.classId?._id ||
          schedule?.classId
        );

      const belongsToStudent =
        classes.some(classItem =>
          sameId(
            classItem?._id ||
            classItem?.id,
            scheduleClassId
          )
        );

      const scheduleDate =
        new Date(
          schedule?.startTime ||
          schedule?.date ||
          schedule?.startsAt ||
          0
        ).getTime();

      return (
        belongsToStudent &&
        Number.isFinite(scheduleDate) &&
        scheduleDate >= now
      );
    }).length;

  const averageProgress =
    total
      ? Math.round(
          classes.reduce(
            (sum,item) =>
              sum +
              getStudentClassProgress(
                item
              ),
            0
          ) / total
        )
      : 0;

  setText(
    "studentTotalClassesCount",
    total
  );

  setText(
    "studentActiveClassesCount",
    active
  );

  setText(
    "studentUpcomingClassCount",
    upcoming
  );

  setText(
    "studentClassesAverageProgress",
    `${averageProgress}%`
  );
}


function getFilteredStudentClasses(
  classes
){
  const keyword =
    String(
      $("classSearchInput")
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  const status =
    $("classStatusFilter")
      ?.value || "all";

  const sort =
    $("classSortFilter")
      ?.value || "recent";

  let filtered =
    [...classes];

  if (keyword){
    filtered =
      filtered.filter(classItem => {
        const teacher =
          getStudentClassTeacher(
            classItem
          );

        const searchableText = [
          classItem?.title,
          classItem?.subject,
          classItem?.description,
          classItem?.classCode,
          classItem?.schedule,
          teacher.name
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(
          keyword
        );
      });
  }

  if (status !== "all"){
    filtered =
      filtered.filter(
        classItem =>
          getStudentClassStatus(
            classItem
          ) === status
      );
  }

  switch(sort){

    case "title-asc":
      filtered.sort(
        (first,second) =>
          String(
            first?.title || ""
          ).localeCompare(
            String(
              second?.title || ""
            )
          )
      );
      break;

    case "title-desc":
      filtered.sort(
        (first,second) =>
          String(
            second?.title || ""
          ).localeCompare(
            String(
              first?.title || ""
            )
          )
      );
      break;

    case "progress-desc":
      filtered.sort(
        (first,second) =>
          getStudentClassProgress(
            second
          ) -
          getStudentClassProgress(
            first
          )
      );
      break;

    case "progress-asc":
      filtered.sort(
        (first,second) =>
          getStudentClassProgress(
            first
          ) -
          getStudentClassProgress(
            second
          )
      );
      break;

    case "schedule":
      filtered.sort(
        (first,second) =>
          getStudentClassScheduleTime(
            first
          ) -
          getStudentClassScheduleTime(
            second
          )
      );
      break;

    case "recent":
    default:
      filtered.sort(
        (first,second) =>
          getStudentClassUpdatedTime(
            second
          ) -
          getStudentClassUpdatedTime(
            first
          )
      );
      break;
  }

  return {
    filtered,
    keyword,
    status,
    sort
  };
}


function renderClasses(){
  const container =
    $("classesList");

  if (!container){
    return;
  }

  const classes =
    getStudentClasses();

  updateStudentClassSummary(
    classes
  );

  container.setAttribute(
    "aria-busy",
    "false"
  );

  container.classList.toggle(
    "is-list-view",
    studentClassView === "list"
  );

  container.classList.toggle(
    "is-grid-view",
    studentClassView === "grid"
  );

  updateStudentClassViewButtons();

  if (!classes.length){
    updateStudentClassResultBar({
      count:0,
      keyword:"",
      status:"all",
      sort:"recent"
    });

    container.innerHTML =
      createEmptyClassesWorkspace();

    return;
  }

  const {
    filtered,
    keyword,
    status,
    sort
  } =
    getFilteredStudentClasses(
      classes
    );

  updateStudentClassResultBar({
    count:filtered.length,
    keyword,
    status,
    sort
  });

  if (!filtered.length){
    container.innerHTML =
      createNoMatchingClassesWorkspace();

    return;
  }

  container.innerHTML =
    filtered
      .map(
        createStudentClassCard
      )
      .join("");
}


function updateStudentClassResultBar({
  count,
  keyword,
  status,
  sort
}){
  const countElement =
    $("studentClassesResultCount");

  const descriptionElement =
    $(
      "studentClassesResultDescription"
    );

  const resetButton =
    $("resetClassFiltersButton");

  if (countElement){
    countElement.textContent =
      `${count} ${
        count === 1
          ? "class"
          : "classes"
      }`;
  }

  if (descriptionElement){
    if (keyword){
      descriptionElement.textContent =
        `Results for “${keyword}”`;
    }else if (status !== "all"){
      descriptionElement.textContent =
        `Showing ${status} classes`;
    }else{
      descriptionElement.textContent =
        "Showing all enrolled classes";
    }
  }

  if (resetButton){
    resetButton.hidden =
      !keyword &&
      status === "all" &&
      sort === "recent";
  }

  const clearButton =
    $("clearClassSearchButton");

  if (clearButton){
    clearButton.hidden =
      !keyword;
  }
}


function updateStudentClassViewButtons(){
  const gridButton =
    $("classGridViewButton");

  const listButton =
    $("classListViewButton");

  const gridActive =
    studentClassView === "grid";

  gridButton?.classList.toggle(
    "active",
    gridActive
  );

  listButton?.classList.toggle(
    "active",
    !gridActive
  );

  gridButton?.setAttribute(
    "aria-pressed",
    String(gridActive)
  );

  listButton?.setAttribute(
    "aria-pressed",
    String(!gridActive)
  );
}


function setStudentClassView(view){
  studentClassView =
    view === "list"
      ? "list"
      : "grid";

  localStorage.setItem(
    STUDENT_CLASS_VIEW_STORAGE_KEY,
    studentClassView
  );

  renderClasses();
}


function createStudentClassCard(
  classItem
){
  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );

  const teacher =
    getStudentClassTeacher(
      classItem
    );

  const cover =
    getStudentClassCover(
      classItem
    );

  const progressRecord =
    getStudentClassProgressRecord(
      classItem
    );

  const progress =
    getStudentClassProgress(
      classItem
    );

  const status =
    getStudentClassStatus(
      classItem
    );

  const lessons =
    getStudentClassLessonCount(
      classItem
    );

  const completedLessons =
    Number(
      progressRecord
        ?.progress
        ?.lessons
        ?.completed ||
      0
    );

  const assignments =
    getStudentClassAssignmentCount(
      classItem
    );

  const completedAssignments =
    Number(
      progressRecord
        ?.progress
        ?.assignments
        ?.completed ||
      0
    );

  const quizzes =
    Number(
      progressRecord
        ?.progress
        ?.quizzes
        ?.total ||
      0
    );

  const completedQuizzes =
    Number(
      progressRecord
        ?.progress
        ?.quizzes
        ?.completed ||
      0
    );

  const attendancePercentage =
    Number(
      progressRecord
        ?.progress
        ?.attendance
        ?.percentage ||
      0
    );

  const students =
    getStudentClassStudentCount(
      classItem
    );

  const meetingLink =
    String(
      classItem?.meetingLink || ""
    ).trim();

  const classCode =
    String(
      classItem?.classCode || ""
    ).trim();

  const schedule =
    String(
      classItem?.schedule ||
      classItem?.scheduleText ||
      "Self-paced"
    ).trim();

  return `
    <article
      class="student-class-card"
      data-class-id="${escapeHtml(
        classId
      )}"
      data-class-status="${escapeHtml(
        status
      )}"
    >

      <div
        class="student-class-cover"
        style="background-image:url('${escapeHtml(
          cover
        )}')"
        role="img"
        aria-label="${escapeHtml(
          classItem?.title ||
          "Class cover"
        )}"
      >

        <div
          class="student-class-cover-gradient"
        ></div>

        <div class="student-class-top">

          <span
            class="student-class-subject"
          >
            ${escapeHtml(
              classItem?.subject ||
              "Learning program"
            )}
          </span>

          <div class="student-class-menu-wrap">

            <button
              class="student-class-menu"
              type="button"
              data-class-menu="${escapeHtml(
                classId
              )}"
              aria-label="Open class actions"
              aria-expanded="false"
              aria-controls="studentClassMenu-${escapeHtml(
                classId
              )}"
            >
              <i
                class="fa-solid fa-ellipsis"
                aria-hidden="true"
              ></i>
            </button>

            <div
              id="studentClassMenu-${escapeHtml(
                classId
              )}"
              class="student-class-dropdown"
              role="menu"
              data-class-menu-panel="${escapeHtml(
                classId
              )}"
              hidden
            >

              <button
                type="button"
                role="menuitem"
                data-class-action="open"
                data-class-id="${escapeHtml(
                  classId
                )}"
              >
                <i
                  class="fa-solid fa-door-open"
                  aria-hidden="true"
                ></i>

                <span>
                  Open class
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                data-class-action="continue"
                data-class-id="${escapeHtml(
                  classId
                )}"
              >
                <i
                  class="fa-solid fa-play"
                  aria-hidden="true"
                ></i>

                <span>
                  Continue learning
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                data-class-action="assignments"
                data-class-id="${escapeHtml(
                  classId
                )}"
              >
                <i
                  class="fa-solid fa-list-check"
                  aria-hidden="true"
                ></i>

                <span>
                  View assignments
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                data-class-action="resources"
                data-class-id="${escapeHtml(
                  classId
                )}"
              >
                <i
                  class="fa-solid fa-folder-open"
                  aria-hidden="true"
                ></i>

                <span>
                  Class resources
                </span>
              </button>

              ${
                meetingLink
                  ? `
                    <a
                      role="menuitem"
                      href="${escapeHtml(
                        meetingLink
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i
                        class="fa-solid fa-video"
                        aria-hidden="true"
                      ></i>

                      <span>
                        Join live class
                      </span>
                    </a>
                  `
                  : ""
              }

            </div>

          </div>

        </div>

        <div class="student-class-bottom">

          <div
            class="student-class-progress-circle"
            style="--class-progress:${progress}"
          >

            <svg
              viewBox="0 0 36 36"
              aria-hidden="true"
            >

              <path
                class="circle-bg"
                d="M18 2
                   a16 16 0 0 1 0 32
                   a16 16 0 0 1 0-32"
              ></path>

              <path
                class="circle-fill"
                stroke-dasharray="${progress},100"
                d="M18 2
                   a16 16 0 0 1 0 32
                   a16 16 0 0 1 0-32"
              ></path>

            </svg>

            <span>
              ${progress}%
            </span>

          </div>

        </div>

      </div>


      <div class="student-class-content">

        <div class="student-class-title-row">

          <div>

            <span
              class="student-class-status ${escapeHtml(
                status
              )}"
            >
              ${escapeHtml(status)}
            </span>

            <h3>
              ${escapeHtml(
                classItem?.title ||
                "Untitled class"
              )}
            </h3>

          </div>

          ${
            classCode
              ? `
                <span
                  class="student-class-code"
                  title="Class code"
                >
                  ${escapeHtml(
                    classCode
                  )}
                </span>
              `
              : ""
          }

        </div>

        <p class="student-class-description">
          ${escapeHtml(
            classItem?.description ||
            "No class description has been added."
          )}
        </p>


        <div class="student-class-teacher">

          <img
            src="${escapeHtml(
              teacher.image
            )}"
            alt="${escapeHtml(
              teacher.name
            )}"
            loading="lazy"
            onerror="this.src='${escapeHtml(
              FALLBACK_AVATAR
            )}'"
          >

          <div>

            <strong>
              ${escapeHtml(
                teacher.name
              )}
            </strong>

            <span>
              Instructor
            </span>

          </div>

        </div>


        <div class="student-class-schedule">

          <i
            class="fa-regular fa-calendar"
            aria-hidden="true"
          ></i>

          <span>
            ${escapeHtml(schedule)}
          </span>

        </div>

        <div
          class="student-class-progress-breakdown"
          aria-label="Class progress details"
        >

          <div class="student-class-progress-metric">

            <span class="student-class-progress-metric-icon blue">

              <i
                class="fa-solid fa-book-open"
                aria-hidden="true"
              ></i>

            </span>

            <div class="student-class-progress-metric-copy">

              <span>
                Lessons
              </span>

              <strong>
                ${completedLessons} / ${lessons}
              </strong>

            </div>

            <span class="student-class-progress-metric-percent">

              ${
                lessons
                  ? Math.round(
                      (
                        completedLessons /
                        lessons
                      ) * 100
                    )
                  : 0
              }%

            </span>

          </div>


          <div class="student-class-progress-metric">

            <span class="student-class-progress-metric-icon orange">

              <i
                class="fa-solid fa-file-circle-check"
                aria-hidden="true"
              ></i>

            </span>

            <div class="student-class-progress-metric-copy">

              <span>
                Assignments
              </span>

              <strong>
                ${completedAssignments} / ${assignments}
              </strong>

            </div>

            <span class="student-class-progress-metric-percent">

              ${
                assignments
                  ? Math.round(
                      (
                        completedAssignments /
                        assignments
                      ) * 100
                    )
                  : 0
              }%

            </span>

          </div>


          <div class="student-class-progress-metric">

            <span class="student-class-progress-metric-icon purple">

              <i
                class="fa-solid fa-circle-question"
                aria-hidden="true"
              ></i>

            </span>

            <div class="student-class-progress-metric-copy">

              <span>
                Quizzes
              </span>

              <strong>
                ${completedQuizzes} / ${quizzes}
              </strong>

            </div>

            <span class="student-class-progress-metric-percent">

              ${
                quizzes
                  ? Math.round(
                      (
                        completedQuizzes /
                        quizzes
                      ) * 100
                    )
                  : 0
              }%

            </span>

          </div>


          <div class="student-class-progress-metric">

            <span class="student-class-progress-metric-icon green">

              <i
                class="fa-solid fa-user-check"
                aria-hidden="true"
              ></i>

            </span>

            <div class="student-class-progress-metric-copy">

              <span>
                Attendance
              </span>

              <strong>
                ${attendancePercentage}%
              </strong>

            </div>

            <span
              class="
                student-class-progress-metric-status
                ${
                  attendancePercentage >= 85
                    ? "good"
                    : attendancePercentage >= 70
                      ? "warning"
                      : "risk"
                }
              "
            >

              ${
                attendancePercentage >= 85
                  ? "Good"
                  : attendancePercentage >= 70
                    ? "Needs attention"
                    : "At risk"
              }

            </span>

          </div>

        </div>


        <div class="student-class-progress">

          <div class="student-class-progress-info">

            <span>
              Learning progress
            </span>

            <strong>
              ${progress}%
            </strong>

          </div>

          <div class="progress-track">

            <div
              class="progress-fill"
              style="width:${progress}%"
            ></div>

          </div>

        </div>


        <div class="student-class-actions">

          <button
            class="ghost-btn"
            type="button"
            data-open-class="${escapeHtml(
              classId
            )}"
          >
            <i
              class="fa-solid fa-door-open"
              aria-hidden="true"
            ></i>

            Open class
          </button>

          ${
            meetingLink
              ? `
                <a
                  class="primary-btn"
                  href="${escapeHtml(
                    meetingLink
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i
                    class="fa-solid fa-video"
                    aria-hidden="true"
                  ></i>

                  Join live
                </a>
              `
              : `
                <button
                  class="primary-btn"
                  type="button"
                  data-continue-class="${escapeHtml(
                    classId
                  )}"
                >
                  <i
                    class="fa-solid fa-play"
                    aria-hidden="true"
                  ></i>

                  Continue
                </button>
              `
          }

        </div>

      </div>

    </article>
  `;
}


function createEmptyClassesWorkspace(){
  return `
    <div class="studio-widget-empty">

      <div class="studio-widget-empty-icon">
        <i
          class="fa-solid fa-graduation-cap"
          aria-hidden="true"
        ></i>
      </div>

      <strong>
        No classes assigned
      </strong>

      <p>
        Your classes will appear here after your
        school enrolls you in a learning program.
      </p>

      <button
        class="primary-btn"
        type="button"
        data-open-studio-page="continue"
      >
        <i
          class="fa-solid fa-play"
          aria-hidden="true"
        ></i>

        Continue Learning
      </button>

    </div>
  `;
}


function createNoMatchingClassesWorkspace(){
  return `
    <div class="studio-widget-empty">

      <div class="studio-widget-empty-icon">
        <i
          class="fa-solid fa-magnifying-glass"
          aria-hidden="true"
        ></i>
      </div>

      <strong>
        No matching classes
      </strong>

      <p>
        Try changing the search text, status,
        or sorting options.
      </p>

      <button
        class="primary-btn"
        type="button"
        id="emptyClassesResetButton"
      >
        Reset filters
      </button>

    </div>
  `;
}


/* =========================================================
   CLASS SKELETONS
========================================================= */

function createStudentClassSkeletons(){

    return Array.from({

        length:6

    })

    .map(()=>`

<article class="student-class-card skeleton-card">

<div class="student-class-cover skeleton-box"></div>

<div class="student-class-content">

<div class="skeleton-title skeleton-box"></div>

<div class="skeleton-text skeleton-box"></div>

<div class="skeleton-text short skeleton-box"></div>

<div class="student-class-teacher">

<div class="skeleton-avatar skeleton-box"></div>

<div>

<div class="skeleton-line skeleton-box"></div>

<div class="skeleton-line short skeleton-box"></div>

</div>

</div>

<div class="student-class-progress">

<div class="skeleton-line skeleton-box"></div>

</div>

<div class="student-class-actions">

<div class="skeleton-button skeleton-box"></div>

<div class="skeleton-button skeleton-box"></div>

</div>

</div>

</article>

`).join("");

}

function resumeStudentLearning(
  requestedClassId = ""
){
  const classes =
    typeof getStudentClasses ===
      "function"
      ? getStudentClasses()
      : [];

  const normalizedRequestedId =
    normalizeId(
      requestedClassId
    );

  const selectedClass =
    (
      normalizedRequestedId
        ? classes.find(classItem =>
            sameId(
              classItem?._id ||
              classItem?.id,
              normalizedRequestedId
            )
          )
        : null
    ) ||
    (
      typeof getPreferredStudentClass ===
        "function"
        ? getPreferredStudentClass()
        : classes[0]
    );

  if (!selectedClass){
    navigateStudentStudio(
      "classes"
    );

    showAlert(
      "info",
      "No class is currently available to continue.",
      {
        title:"No class available"
      }
    );

    return;
  }

  const classId =
    normalizeId(
      selectedClass?._id ||
      selectedClass?.id
    );

  if (!classId){
    showAlert(
      "error",
      "This class does not have a valid class ID."
    );

    return;
  }

  openStudentClass(classId);
}

/* =========================================================
   STUDENT ASSIGNMENT CENTER
========================================================= */

const STUDENT_ASSIGNMENT_VIEW_STORAGE_KEY =
  "aiftStudentAssignmentView";

let studentAssignmentView =
  localStorage.getItem(
    STUDENT_ASSIGNMENT_VIEW_STORAGE_KEY
  ) === "list"
    ? "list"
    : "card";

let activeStudentAssignmentTab =
  "all";

let openStudentAssignmentMenuId =
  "";

let studentAssignmentControlsInitialized =
  false;

let studentAssignmentSearchTimer =
  null;



/* =========================================================
   ASSIGNMENT CENTER CONTROLS
========================================================= */

function resetStudentAssignmentFilters(){
  const searchInput =
    $("assignmentSearch");

  const statusFilter =
    $("assignmentStatus");

  const classFilter =
    $("assignmentSubject");

  const sortFilter =
    $("assignmentSort");

  if (searchInput){
    searchInput.value = "";
  }

  if (statusFilter){
    statusFilter.value = "all";
  }

  if (classFilter){
    classFilter.value = "all";
  }

  if (sortFilter){
    sortFilter.value = "due-asc";
  }

  activeStudentAssignmentTab =
    "all";

  window.clearTimeout(
    studentAssignmentSearchTimer
  );

  renderAssignments();
}


function setStudentAssignmentView(
  view
){
  studentAssignmentView =
    view === "list"
      ? "list"
      : "card";

  localStorage.setItem(
    STUDENT_ASSIGNMENT_VIEW_STORAGE_KEY,
    studentAssignmentView
  );

  renderAssignments();
}


function setStudentAssignmentStatus(
  status
){
  const normalizedStatus =
    [
      "all",
      "pending",
      "due-soon",
      "submitted",
      "graded",
      "returned",
      "late"
    ].includes(status)
      ? status
      : "all";

  activeStudentAssignmentTab =
    normalizedStatus;

  const statusFilter =
    $("assignmentStatus");

  if (statusFilter){
    statusFilter.value =
      normalizedStatus;
  }

  renderAssignments();
}

function getAssignmentSubmission(
  assignment
){
  return getSubmissionForAssignment(
    assignment?._id ||
    assignment?.id
  );
}


function getAssignmentDueTime(
  assignment
){
  const dueValue =
    assignment?.dueDate ||
    assignment?.deadline;

  if (!dueValue){
    return Number.POSITIVE_INFINITY;
  }

  const timestamp =
    new Date(dueValue).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : Number.POSITIVE_INFINITY;
}


function isAssignmentGraded(
  submission
){
  if (!submission){
    return false;
  }

  const status =
    String(
      submission?.status || ""
    )
      .trim()
      .toLowerCase();

  return Boolean(
    submission?.grade !== undefined &&
    submission?.grade !== null &&
    submission?.grade !== ""
  ) ||
  Boolean(
    submission?.feedback
  ) ||
  [
    "graded",
    "reviewed"
  ].includes(status);
}


function isAssignmentReturned(
  submission
){
  return String(
    submission?.status || ""
  )
    .trim()
    .toLowerCase() === "returned";
}


function isAssignmentDueSoon(
  assignment,
  submission = null
){
  if (submission){
    return false;
  }

  const dueTime =
    getAssignmentDueTime(
      assignment
    );

  if (
    !Number.isFinite(dueTime)
  ){
    return false;
  }

  const now =
    Date.now();

  const sevenDays =
    7 * 24 * 60 * 60 * 1000;

  return (
    dueTime >= now &&
    dueTime <= now + sevenDays
  );
}


function isAssignmentLate(
  assignment,
  submission = null
){
  if (submission){
    return false;
  }

  const dueTime =
    getAssignmentDueTime(
      assignment
    );

  return (
    Number.isFinite(dueTime) &&
    dueTime < Date.now()
  );
}


function getStudentAssignmentStatus(
  assignment
){
  const submission =
    getAssignmentSubmission(
      assignment
    );

  if (
    isAssignmentGraded(
      submission
    )
  ){
    return "graded";
  }

  if (
    isAssignmentReturned(
      submission
    )
  ){
    return "returned";
  }

  if (submission){
    return "submitted";
  }

  if (
    isAssignmentLate(
      assignment,
      submission
    )
  ){
    return "late";
  }

  if (
    isAssignmentDueSoon(
      assignment,
      submission
    )
  ){
    return "due-soon";
  }

  return "pending";
}


function getStudentAssignmentClass(
  assignment
){
  const classId =
    normalizeId(
      assignment?.classId?._id ||
      assignment?.classId
    );

  const linkedClass =
    getStudentClasses()
      .find(classItem =>
        sameId(
          classItem?._id ||
          classItem?.id,
          classId
        )
      );

  return {
    id:classId,

    title:
      assignment?.classId?.title ||
      linkedClass?.title ||
      assignment?.classTitle ||
      "General coursework",

    subject:
      assignment?.classId?.subject ||
      linkedClass?.subject ||
      assignment?.subject ||
      "Coursework",

    code:
      assignment?.classId?.classCode ||
      linkedClass?.classCode ||
      ""
  };
}


function getStudentAssignmentTeacher(
  assignment
){
  return {
    name:
      assignment?.teacherId?.name ||
      assignment?.teacherName ||
      "Instructor",

    image:
      assignment?.teacherId
        ?.profileImage ||
      assignment?.teacherId
        ?.profilePicture ||
      assignment?.teacherImage ||
      FALLBACK_AVATAR
  };
}


function getAssignmentStatusLabel(
  status
){
  const labels = {
    pending:"Pending",
    "due-soon":"Due soon",
    submitted:"Submitted",
    graded:"Graded",
    returned:"Returned",
    late:"Overdue"
  };

  return (
    labels[status] ||
    "Pending"
  );
}


function getAssignmentStatusIcon(
  status
){
  const icons = {
    pending:
      "fa-regular fa-clock",

    "due-soon":
      "fa-solid fa-hourglass-half",

    submitted:
      "fa-solid fa-paper-plane",

    graded:
      "fa-solid fa-circle-check",

    returned:
      "fa-solid fa-rotate-left",

    late:
      "fa-solid fa-triangle-exclamation"
  };

  return (
    icons[status] ||
    icons.pending
  );
}


function getAssignmentDuePresentation(
  assignment,
  status
){
  const dueValue =
    assignment?.dueDate ||
    assignment?.deadline;

  if (!dueValue){
    return {
      formatted:"No deadline",
      relative:"Open deadline",
      badgeClass:""
    };
  }

  const dueTime =
    new Date(dueValue)
      .getTime();

  if (
    !Number.isFinite(dueTime)
  ){
    return {
      formatted:"No deadline",
      relative:"Open deadline",
      badgeClass:""
    };
  }

  const difference =
    dueTime - Date.now();

  const absoluteDifference =
    Math.abs(difference);

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;

  let relative =
    "Due soon";

  if (difference < 0){
    if (
      absoluteDifference < hour
    ){
      relative =
        "Overdue recently";
    }else if (
      absoluteDifference < day
    ){
      relative =
        `Overdue by ${
          Math.max(
            1,
            Math.floor(
              absoluteDifference /
              hour
            )
          )
        }h`;
    }else{
      const days =
        Math.max(
          1,
          Math.floor(
            absoluteDifference /
            day
          )
        );

      relative =
        `Overdue by ${days} ${
          days === 1
            ? "day"
            : "days"
        }`;
    }
  }else if (
    difference < hour
  ){
    const minutes =
      Math.max(
        1,
        Math.ceil(
          difference /
          minute
        )
      );

    relative =
      `Due in ${minutes} min`;
  }else if (
    difference < day
  ){
    const hours =
      Math.max(
        1,
        Math.ceil(
          difference /
          hour
        )
      );

    relative =
      `Due in ${hours} ${
        hours === 1
          ? "hour"
          : "hours"
      }`;
  }else{
    const days =
      Math.max(
        1,
        Math.ceil(
          difference /
          day
        )
      );

    relative =
      `Due in ${days} ${
        days === 1
          ? "day"
          : "days"
      }`;
  }

  return {
    formatted:
      formatDateTime(
        dueValue
      ),

    relative,

    badgeClass:
      status === "late"
        ? "overdue"
        : status === "due-soon"
          ? "urgent"
          : ""
  };
}


function getStudentAssignmentGrade(
  submission
){
  if (
    !submission ||
    submission.grade ===
      undefined ||
    submission.grade ===
      null ||
    submission.grade === ""
  ){
    return "";
  }

  const grade =
    String(
      submission.grade
    ).trim();

  return grade.includes("%")
    ? grade
    : `${grade}`;
}


function getStudentAssignmentCounts(
  assignments
){
  const counts = {
    all:assignments.length,
    pending:0,
    dueSoon:0,
    submitted:0,
    graded:0,
    returned:0,
    late:0
  };

  assignments.forEach(
    assignment => {
      const status =
        getStudentAssignmentStatus(
          assignment
        );

      if (status === "pending"){
        counts.pending += 1;
      }

      if (status === "due-soon"){
        counts.pending += 1;
        counts.dueSoon += 1;
      }

      if (status === "submitted"){
        counts.submitted += 1;
      }

      if (status === "graded"){
        counts.graded += 1;
      }

      if (status === "returned"){
        counts.returned += 1;
      }

      if (status === "late"){
        counts.pending += 1;
        counts.late += 1;
      }
    }
  );

  return counts;
}


function updateStudentAssignmentSummary(
  assignments
){
  const counts =
    getStudentAssignmentCounts(
      assignments
    );

  setText(
    "assignmentPendingCount",
    counts.pending
  );

  setText(
    "assignmentDueSoonCount",
    counts.dueSoon
  );

  setText(
    "assignmentSubmittedCount",
    counts.submitted
  );

  setText(
    "assignmentGradedCount",
    counts.graded
  );

  setText(
    "assignmentLateCount",
    counts.late
  );

  setText(
    "assignmentAllTabCount",
    counts.all
  );

  setText(
    "assignmentPendingTabCount",
    counts.pending
  );

  setText(
    "assignmentSubmittedTabCount",
    counts.submitted
  );

  setText(
    "assignmentGradedTabCount",
    counts.graded
  );

  setText(
    "assignmentLateTabCount",
    counts.late
  );

  return counts;
}


function hydrateAssignmentClassFilter(
  assignments
){
  const select =
    $("assignmentSubject");

  if (!select){
    return;
  }

  const currentValue =
    select.value || "all";

  const classMap =
    new Map();

  assignments.forEach(
    assignment => {
      const classInfo =
        getStudentAssignmentClass(
          assignment
        );

      if (!classInfo.id){
        return;
      }

      if (
        !classMap.has(
          classInfo.id
        )
      ){
        classMap.set(
          classInfo.id,
          classInfo.title
        );
      }
    }
  );

  select.innerHTML = `
    <option value="all">
      All classes
    </option>

    ${
      Array.from(
        classMap.entries()
      )
        .sort(
          (
            first,
            second
          ) =>
            String(
              first[1]
            ).localeCompare(
              String(
                second[1]
              )
            )
        )
        .map(
          ([
            classId,
            classTitle
          ]) => `
            <option
              value="${escapeHtml(
                classId
              )}"
            >
              ${escapeHtml(
                classTitle
              )}
            </option>
          `
        )
        .join("")
    }
  `;

  if (
    classMap.has(currentValue)
  ){
    select.value =
      currentValue;
  }else{
    select.value =
      "all";
  }
}


function getFilteredStudentAssignments(
  assignments
){
  const keyword =
    String(
      $("assignmentSearch")
        ?.value || ""
    )
      .trim()
      .toLowerCase();

  const selectedStatus =
    $("assignmentStatus")
      ?.value ||
    activeStudentAssignmentTab ||
    "all";

  const selectedClass =
    $("assignmentSubject")
      ?.value || "all";

  const sort =
    $("assignmentSort")
      ?.value || "due-asc";

  let filtered =
    [...assignments];

  if (keyword){
    filtered =
      filtered.filter(
        assignment => {
          const classInfo =
            getStudentAssignmentClass(
              assignment
            );

          const teacher =
            getStudentAssignmentTeacher(
              assignment
            );

          const searchableText = [
            assignment?.title,
            assignment?.description,
            assignment?.instructions,
            classInfo.title,
            classInfo.subject,
            classInfo.code,
            teacher.name
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          return searchableText
            .includes(keyword);
        }
      );
  }

  if (
    selectedClass !== "all"
  ){
    filtered =
      filtered.filter(
        assignment =>
          sameId(
            assignment
              ?.classId?._id ||
            assignment
              ?.classId,
            selectedClass
          )
      );
  }

  if (
    selectedStatus !== "all"
  ){
    filtered =
      filtered.filter(
        assignment => {
          const status =
            getStudentAssignmentStatus(
              assignment
            );

          if (
            selectedStatus ===
              "pending"
          ){
            return [
              "pending",
              "due-soon",
              "late"
            ].includes(status);
          }

          return (
            status ===
            selectedStatus
          );
        }
      );
  }

  switch(sort){

    case "due-desc":
      filtered.sort(
        (
          first,
          second
        ) =>
          getAssignmentDueTime(
            second
          ) -
          getAssignmentDueTime(
            first
          )
      );
      break;

    case "created-desc":
      filtered.sort(
        (
          first,
          second
        ) =>
          new Date(
            second?.createdAt || 0
          ).getTime() -
          new Date(
            first?.createdAt || 0
          ).getTime()
      );
      break;

    case "title-asc":
      filtered.sort(
        (
          first,
          second
        ) =>
          String(
            first?.title || ""
          ).localeCompare(
            String(
              second?.title || ""
            )
          )
      );
      break;

    case "status":
      filtered.sort(
        (
          first,
          second
        ) =>
          getStudentAssignmentStatus(
            first
          ).localeCompare(
            getStudentAssignmentStatus(
              second
            )
          )
      );
      break;

    case "due-asc":
    default:
      filtered.sort(
        (
          first,
          second
        ) =>
          getAssignmentDueTime(
            first
          ) -
          getAssignmentDueTime(
            second
          )
      );
      break;
  }

  return {
    filtered,
    keyword,
    selectedStatus,
    selectedClass,
    sort
  };
}


function updateStudentAssignmentResultsBar({
  count,
  keyword,
  selectedStatus,
  selectedClass,
  sort
}){
  const countElement =
    $("studentAssignmentResultCount");

  const descriptionElement =
    $("studentAssignmentResultDescription");

  const resetButton =
    $("resetAssignmentFiltersButton");

  const clearButton =
    $("clearAssignmentSearchButton");

  if (countElement){
    countElement.textContent =
      `${count} ${
        count === 1
          ? "assignment"
          : "assignments"
      }`;
  }

  if (descriptionElement){
    if (keyword){
      descriptionElement.textContent =
        `Results for “${keyword}”`;
    }else if (
      selectedStatus !== "all"
    ){
      descriptionElement.textContent =
        `Showing ${
          getAssignmentStatusLabel(
            selectedStatus
          )
        } coursework`;
    }else if (
      selectedClass !== "all"
    ){
      descriptionElement.textContent =
        "Showing assignments for the selected class";
    }else{
      descriptionElement.textContent =
        "Showing all coursework";
    }
  }

  if (resetButton){
    resetButton.hidden =
      !keyword &&
      selectedStatus === "all" &&
      selectedClass === "all" &&
      sort === "due-asc";
  }

  if (clearButton){
    clearButton.hidden =
      !keyword;
  }
}


function updateStudentAssignmentViewButtons(){
  const cardButton =
    $("assignmentCardViewButton");

  const listButton =
    $("assignmentListViewButton");

  const cardActive =
    studentAssignmentView ===
      "card";

  cardButton?.classList.toggle(
    "active",
    cardActive
  );

  listButton?.classList.toggle(
    "active",
    !cardActive
  );

  cardButton?.setAttribute(
    "aria-pressed",
    String(cardActive)
  );

  listButton?.setAttribute(
    "aria-pressed",
    String(!cardActive)
  );
}


function updateStudentAssignmentTabs(
  selectedStatus
){
  document
    .querySelectorAll(
      "[data-assignment-tab]"
    )
    .forEach(button => {
      const active =
        button.dataset
          .assignmentTab ===
        selectedStatus;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-pressed",
        String(active)
      );
    });

  document
    .querySelectorAll(
      "[data-assignment-summary-filter]"
    )
    .forEach(card => {
      const cardStatus =
        card.dataset
          .assignmentSummaryFilter;

      const active =
        cardStatus ===
        selectedStatus;

      card.classList.toggle(
        "active",
        active
      );
    });
}

/* =========================================================
   ASSIGNMENT CARD ACTION MENU
========================================================= */

function closeStudentAssignmentMenus({
  render = true
} = {}){
  if (!openStudentAssignmentMenuId){
    return;
  }

  openStudentAssignmentMenuId =
    "";

  if (render){
    renderAssignments();
  }
}


function toggleStudentAssignmentMenu(
  assignmentId
){
  const normalizedAssignmentId =
    normalizeId(
      assignmentId
    );

  openStudentAssignmentMenuId =
    openStudentAssignmentMenuId ===
      normalizedAssignmentId
      ? ""
      : normalizedAssignmentId;

  renderAssignments();

  if (
    openStudentAssignmentMenuId
  ){
    window.setTimeout(
      () => {
        document
          .querySelector(
            `[data-assignment-menu-wrap="${
              CSS.escape(
                openStudentAssignmentMenuId
              )
            }"] .student-assignment-menu-panel.show`
          )
          ?.querySelector(
            "button, a"
          )
          ?.focus();
      },
      0
    );
  }
}


function getAssignmentById(
  assignmentId
){
  const normalizedAssignmentId =
    normalizeId(
      assignmentId
    );

  return (
    getStudentAssignments()
      .find(assignment =>
        sameId(
          assignment?._id ||
          assignment?.id,
          normalizedAssignmentId
        )
      ) ||
    null
  );
}


async function copyStudentAssignmentLink(
  assignmentId
){
  const normalizedAssignmentId =
    normalizeId(
      assignmentId
    );

  if (!normalizedAssignmentId){
    return;
  }

  const url =
    new URL(
      window.location.href
    );

  url.searchParams.set(
    "page",
    "assignments"
  );

  url.searchParams.set(
    "assignmentId",
    normalizedAssignmentId
  );

  try{
    await navigator.clipboard.writeText(
      url.toString()
    );

    showAlert(
      "success",
      "Assignment link copied.",
      {
        title:"Link copied"
      }
    );
  }catch(error){
    console.error(
      "Assignment link copy failed:",
      error
    );

    showAlert(
      "error",
      "AIFT could not copy the assignment link.",
      {
        title:"Copy failed"
      }
    );
  }
}

function createStudentAssignmentCard(
  assignment
){
  const assignmentId =
    normalizeId(
      assignment?._id ||
      assignment?.id
    );

  const submission =
    getAssignmentSubmission(
      assignment
    );

  const status =
    getStudentAssignmentStatus(
      assignment
    );

  const classInfo =
    getStudentAssignmentClass(
      assignment
    );

  const teacher =
    getStudentAssignmentTeacher(
      assignment
    );

  const due =
    getAssignmentDuePresentation(
      assignment,
      status
    );

  const grade =
    getStudentAssignmentGrade(
      submission
    );

  const description =
    assignment?.instructions ||
    assignment?.description ||
    "No assignment instructions have been added.";

  const feedback =
    String(
      submission?.feedback || ""
    ).trim();

  const attachment =
    assignment?.attachmentUrl ||
    assignment?.fileUrl ||
    "";

  const submittedAt =
    submission?.submittedAt ||
    submission?.createdAt;

  const canSubmit =
    ![
      "submitted",
      "graded"
    ].includes(status);

  return `
    <article
      class="student-assignment-card ${escapeHtml(
        status
      )}"
      data-assignment-id="${escapeHtml(
        assignmentId
      )}"
      data-assignment-status="${escapeHtml(
        status
      )}"
    >

      <header class="student-assignment-card-head">

        <div class="student-assignment-card-title">

          <span class="student-assignment-class-label">

            ${escapeHtml(
              classInfo.subject
            )}

            ${
              classInfo.code
                ? ` • ${escapeHtml(
                    classInfo.code
                  )}`
                : ""
            }

          </span>

          <h3>
            ${escapeHtml(
              assignment?.title ||
              "Untitled assignment"
            )}
          </h3>

        </div>

        <div
          class="student-assignment-menu-wrap"
          data-assignment-menu-wrap="${escapeHtml(
            assignmentId
          )}"
        >

          <button
            class="student-assignment-menu"
            type="button"
            data-assignment-menu="${escapeHtml(
              assignmentId
            )}"
            aria-label="Open assignment actions"
            aria-haspopup="menu"
            aria-expanded="${
              openStudentAssignmentMenuId ===
                assignmentId
                ? "true"
                : "false"
            }"
          >
            <i
              class="fa-solid fa-ellipsis"
              aria-hidden="true"
            ></i>
          </button>


          <div
            class="student-assignment-menu-panel ${
              openStudentAssignmentMenuId ===
                assignmentId
                ? "show"
                : ""
            }"
            role="menu"
            aria-label="Assignment actions"
          >

            <button
              type="button"
              role="menuitem"
              data-assignment-menu-action="open"
              data-assignment-id="${escapeHtml(
                assignmentId
              )}"
            >
              <i
                class="fa-solid fa-arrow-up-right-from-square"
                aria-hidden="true"
              ></i>

              <span>
                Open assignment
              </span>
            </button>


            ${
              canSubmit
                ? `
                  <button
                    type="button"
                    role="menuitem"
                    data-assignment-menu-action="submit"
                    data-assignment-id="${escapeHtml(
                      assignmentId
                    )}"
                  >
                    <i
                      class="fa-solid fa-cloud-arrow-up"
                      aria-hidden="true"
                    ></i>

                    <span>
                      ${
                        status === "returned"
                          ? "Resubmit work"
                          : submission
                            ? "Update submission"
                            : "Submit work"
                      }
                    </span>
                  </button>
                `
                : `
                  <button
                    type="button"
                    role="menuitem"
                    data-assignment-menu-action="review"
                    data-assignment-id="${escapeHtml(
                      assignmentId
                    )}"
                  >
                    <i
                      class="fa-solid fa-file-circle-check"
                      aria-hidden="true"
                    ></i>

                    <span>
                      Review submission
                    </span>
                  </button>
                `
            }


            ${
              attachment
                ? `
                  <a
                    role="menuitem"
                    href="${escapeHtml(
                      attachment
                    )}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <i
                      class="fa-solid fa-paperclip"
                      aria-hidden="true"
                    ></i>

                    <span>
                      Open attachment
                    </span>
                  </a>
                `
                : ""
            }


            <button
              type="button"
              role="menuitem"
              data-assignment-menu-action="copy"
              data-assignment-id="${escapeHtml(
                assignmentId
              )}"
            >
              <i
                class="fa-solid fa-link"
                aria-hidden="true"
              ></i>

              <span>
                Copy assignment link
              </span>
            </button>

          </div>

        </div>

      </header>


      <div class="student-assignment-card-body">

        <p class="student-assignment-description">
          ${escapeHtml(description)}
        </p>


        <div class="student-assignment-status-row">

          <span
            class="student-assignment-status ${escapeHtml(
              status
            )}"
          >
            <i
              class="${escapeHtml(
                getAssignmentStatusIcon(
                  status
                )
              )}"
              aria-hidden="true"
            ></i>

            ${escapeHtml(
              getAssignmentStatusLabel(
                status
              )
            )}
          </span>

          ${
            grade
              ? `
                <strong class="student-assignment-grade">
                  Grade: ${escapeHtml(
                    grade
                  )}
                </strong>
              `
              : ""
          }

        </div>


        <div class="student-assignment-meta">

          <div class="student-assignment-meta-item">

            <i
              class="fa-solid fa-graduation-cap"
              aria-hidden="true"
            ></i>

            <span>
              ${escapeHtml(
                classInfo.title
              )}
            </span>

          </div>

          <div class="student-assignment-meta-item">

            <i
              class="fa-solid fa-user"
              aria-hidden="true"
            ></i>

            <span>
              ${escapeHtml(
                teacher.name
              )}
            </span>

          </div>

          ${
            submittedAt
              ? `
                <div class="student-assignment-meta-item">

                  <i
                    class="fa-solid fa-paper-plane"
                    aria-hidden="true"
                  ></i>

                  <span>
                    Submitted ${
                      formatDateTime(
                        submittedAt
                      )
                    }
                  </span>

                </div>
              `
              : ""
          }

        </div>


        <div class="student-assignment-due">

          <div class="student-assignment-due-copy">

            <span>
              Deadline
            </span>

            <strong>
              ${escapeHtml(
                due.formatted
              )}
            </strong>

          </div>

          <span
            class="student-assignment-due-badge ${escapeHtml(
              due.badgeClass
            )}"
          >
            ${escapeHtml(
              due.relative
            )}
          </span>

        </div>


        ${
          feedback
            ? `
              <div class="student-assignment-feedback">

                <strong>
                  Teacher feedback
                </strong>

                <p>
                  ${escapeHtml(
                    feedback
                  )}
                </p>

              </div>
            `
            : ""
        }

      </div>


      <footer class="student-assignment-card-actions">

        ${
          attachment
            ? `
              <a
                class="ghost-btn"
                href="${escapeHtml(
                  attachment
                )}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i
                  class="fa-solid fa-paperclip"
                  aria-hidden="true"
                ></i>

                Attachment
              </a>
            `
            : `
              <button
                class="ghost-btn"
                type="button"
                data-view-assignment="${escapeHtml(
                  assignmentId
                )}"
              >
                <i
                  class="fa-solid fa-eye"
                  aria-hidden="true"
                ></i>

                View details
              </button>
            `
        }

        ${
          canSubmit
            ? `
              <button
                class="primary-btn"
                type="button"
                data-submit-assignment="${escapeHtml(
                  assignmentId
                )}"
              >
                <i
                  class="fa-solid fa-cloud-arrow-up"
                  aria-hidden="true"
                ></i>

                ${
                  status === "returned"
                    ? "Resubmit"
                    : "Submit work"
                }
              </button>
            `
            : `
              <button
                class="primary-btn"
                type="button"
                data-review-submission="${escapeHtml(
                  assignmentId
                )}"
              >
                <i
                  class="fa-solid fa-file-circle-check"
                  aria-hidden="true"
                ></i>

                Review work
              </button>
            `
        }

      </footer>

    </article>
  `;
}


function createEmptyAssignmentWorkspace(){
  return `
    <div class="studio-widget-empty">

      <div class="studio-widget-empty-icon">

        <i
          class="fa-solid fa-clipboard-check"
          aria-hidden="true"
        ></i>

      </div>

      <strong>
        No assignments yet
      </strong>

      <p>
        Coursework assigned by your teachers will appear
        here automatically.
      </p>

      <button
        class="primary-btn"
        type="button"
        data-open-studio-page="classes"
      >
        View my classes
      </button>

    </div>
  `;
}


function createNoMatchingAssignmentsWorkspace(){
  return `
    <div class="studio-widget-empty">

      <div class="studio-widget-empty-icon">

        <i
          class="fa-solid fa-magnifying-glass"
          aria-hidden="true"
        ></i>

      </div>

      <strong>
        No matching assignments
      </strong>

      <p>
        Try changing your search, status, class,
        or sorting options.
      </p>

      <button
        id="emptyAssignmentsResetButton"
        class="primary-btn"
        type="button"
      >
        Reset filters
      </button>

    </div>
  `;
}


function renderAssignments(){
  const container =
    $("assignmentsList");

  if (!container){
    return;
  }

  const assignments =
    getStudentAssignments();

  hydrateAssignmentClassFilter(
    assignments
  );

  updateStudentAssignmentSummary(
    assignments
  );

  container.setAttribute(
    "aria-busy",
    "false"
  );

  container.classList.toggle(
    "is-card-view",
    studentAssignmentView ===
      "card"
  );

  container.classList.toggle(
    "is-list-view",
    studentAssignmentView ===
      "list"
  );

  updateStudentAssignmentViewButtons();

  if (!assignments.length){
    updateStudentAssignmentResultsBar({
      count:0,
      keyword:"",
      selectedStatus:"all",
      selectedClass:"all",
      sort:"due-asc"
    });

    updateStudentAssignmentTabs(
      "all"
    );

    container.innerHTML =
      createEmptyAssignmentWorkspace();

    return;
  }

  const {
    filtered,
    keyword,
    selectedStatus,
    selectedClass,
    sort
  } =
    getFilteredStudentAssignments(
      assignments
    );

  updateStudentAssignmentTabs(
    selectedStatus
  );

  updateStudentAssignmentResultsBar({
    count:filtered.length,
    keyword,
    selectedStatus,
    selectedClass,
    sort
  });

  if (!filtered.length){
    container.innerHTML =
      createNoMatchingAssignmentsWorkspace();

    return;
  }

  container.innerHTML =
    filtered
      .map(
        createStudentAssignmentCard
      )
      .join("");
}


/* =========================================================
   STUDENT CALENDAR CONTROLLER
========================================================= */

let studentCalendarCurrentDate =
  new Date();

let studentCalendarSelectedDate =
  startOfCalendarDay(
    new Date()
  );

let studentCalendarView =
  "month";

let studentCalendarSearchQuery =
  "";

let studentCalendarTypeFilter =
  "all";

let studentCalendarTeacherFilter =
  "";
let studentCalendarControlsBound =
  false;

let studentCalendarRefreshInProgress =
  false;


/* =========================================================
   CALENDAR DATE HELPERS
========================================================= */

function startOfCalendarDay(
  value
){
  const date =
    value instanceof Date
      ? new Date(value)
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return null;
  }

  date.setHours(
    0,
    0,
    0,
    0
  );

  return date;
}


function endOfCalendarDay(
  value
){
  const date =
    startOfCalendarDay(
      value
    );

  if (!date){
    return null;
  }

  date.setHours(
    23,
    59,
    59,
    999
  );

  return date;
}


function isSameCalendarDay(
  first,
  second
){
  const firstDate =
    startOfCalendarDay(
      first
    );

  const secondDate =
    startOfCalendarDay(
      second
    );

  if (
    !firstDate ||
    !secondDate
  ){
    return false;
  }

  return (
    firstDate.getTime() ===
    secondDate.getTime()
  );
}


function getCalendarDateKey(
  value
){
  const date =
    startOfCalendarDay(
      value
    );

  if (!date){
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


function formatCalendarTime(
  value
){
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return "";
  }

  return date.toLocaleTimeString(
    [],
    {
      hour:
        "numeric",

      minute:
        "2-digit"
    }
  );
}


function getSafeStudentCalendarUrl(
  value
){

  const rawUrl =
    String(
      value ||
      ""
    ).trim();


  if (!rawUrl){
    return "";
  }


  try{

    const resolvedUrl =
      new URL(
        rawUrl,
        window.location.origin
      );


    if (
      ![
        "http:",
        "https:"
      ].includes(
        resolvedUrl.protocol
      )
    ){
      return "";
    }


    return resolvedUrl.href;

  }catch{

    return "";

  }

}


function formatCalendarDayHeading(
  value
){
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return "";
  }

  const today =
    startOfCalendarDay(
      new Date()
    );

  const target =
    startOfCalendarDay(
      date
    );

  const tomorrow =
    new Date(today);

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  if (
    target.getTime() ===
    today.getTime()
  ){
    return "Today";
  }

  if (
    target.getTime() ===
    tomorrow.getTime()
  ){
    return "Tomorrow";
  }

  return date.toLocaleDateString(
    [],
    {
      weekday:
        "long",

      month:
        "short",

      day:
        "numeric"
    }
  );
}


/* =========================================================
   SCHEDULE DATE NORMALIZATION
========================================================= */

function resolveScheduleDate(
  schedule
){

  const rawDate =
    schedule?.startDate ||
    schedule?.startAt ||
    schedule?.date ||
    schedule?.scheduledAt ||
    schedule?.startsAt ||
    null;

  if (!rawDate){
    return null;
  }


  let date =
    rawDate instanceof Date
      ? new Date(
          rawDate.getTime()
        )
      : new Date(
          rawDate
        );


  /*
    A plain YYYY-MM-DD value can be interpreted as UTC by
    some browsers. Rebuild it as a local date to prevent the
    event from appearing one day early or late.
  */

  const plainDateMatch =
    String(rawDate)
      .trim()
      .match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );


  if (plainDateMatch){

    date =
      new Date(
        Number(
          plainDateMatch[1]
        ),

        Number(
          plainDateMatch[2]
        ) - 1,

        Number(
          plainDateMatch[3]
        ),

        0,
        0,
        0,
        0
      );

  }


  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return null;
  }


  const rawTime =
    String(
      schedule?.startTime ||
      schedule?.time ||
      ""
    )
      .trim()
      .split("-")[0]
      .trim();


  if (rawTime){

    const timeMatch =
      rawTime.match(
        /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i
      );


    if (timeMatch){

      let hours =
        Number(
          timeMatch[1]
        );

      const minutes =
        Number(
          timeMatch[2] ||
          0
        );

      const meridiem =
        String(
          timeMatch[3] ||
          ""
        )
          .trim()
          .toUpperCase();


      if (
        meridiem === "PM" &&
        hours < 12
      ){
        hours += 12;
      }


      if (
        meridiem === "AM" &&
        hours === 12
      ){
        hours = 0;
      }


      if (
        hours >= 0 &&
        hours <= 23 &&
        minutes >= 0 &&
        minutes <= 59
      ){

        date.setHours(
          hours,
          minutes,
          0,
          0
        );

      }

    }

  }


  return date;

}

/* =========================================================
   UNIFIED CALENDAR EVENTS
========================================================= */

function buildStudentCalendarEvents(){

  const studentClasses =
    getStudentClasses();

  const classIds =
    new Set(
      studentClasses.map(
        classItem =>
          normalizeId(
            classItem?._id ||
            classItem?.id
          )
      )
    );


  const scheduleEvents =
    asArray(
      state.schedules
    )
      .filter(schedule => {
        const classId =
          normalizeId(
            schedule?.classId?._id ||
            schedule?.classId
          );

        return (
          !classId ||
          classIds.has(classId)
        );
      })
      .map(schedule => {
        const start =
          resolveScheduleDate(
            schedule
          );

        if (!start){
          return null;
        }

        const classTitle =
          String(
            schedule?.classId?.title ||
            schedule?.classTitle ||
            schedule?.title ||
            "Class"
          ).trim();

const meetingLink =
  getSafeStudentCalendarUrl(
    schedule?.meetingLink ||
    schedule?.meetingUrl ||
    schedule?.link ||
    ""
  );

        const eventType =
          meetingLink
            ? "meeting"
            : "class";

        return {
          id:
            `schedule-${
              normalizeId(
                schedule?._id
              ) ||
              getCalendarDateKey(start)
            }`,

          sourceId:
            normalizeId(
              schedule?._id
            ),

          source:
            "schedule",

          type:
            eventType,

          title:
            classTitle,

          description:
            String(
              schedule?.notes ||
              schedule?.description ||
              "Class schedule"
            ).trim(),

          start,

end:
  (() => {

    const rawEnd =
      schedule?.endDate ||
      schedule?.endAt ||
      null;


    if (!rawEnd){
      return null;
    }


    const endDate =
      new Date(
        rawEnd
      );


    return Number.isNaN(
      endDate.getTime()
    )
      ? null
      : endDate;

  })(),

          classId:
            normalizeId(
              schedule?.classId?._id ||
              schedule?.classId
            ),

          teacherId:
            normalizeId(
              schedule?.teacherId?._id ||
              schedule?.teacherId
            ),

          teacherName:
            String(
              schedule?.teacherId?.name ||
              schedule?.teacherName ||
              ""
            ).trim(),

          meetingLink,

          location:
            String(
              schedule?.location ||
              schedule?.room ||
              ""
            ).trim(),

          original:
            schedule
        };
      })
      .filter(Boolean);


  const assignmentEvents =
    getStudentAssignments()
      .map(assignment => {
        const dueDate =
          assignment?.dueDate
            ? new Date(
                assignment.dueDate
              )
            : null;

        if (
          !dueDate ||
          Number.isNaN(
            dueDate.getTime()
          )
        ){
          return null;
        }

        return {
          id:
            `assignment-${
              normalizeId(
                assignment?._id
              )
            }`,

          sourceId:
            normalizeId(
              assignment?._id
            ),

          source:
            "assignment",

          type:
            "assignment",

          title:
            String(
              assignment?.title ||
              "Assignment deadline"
            ).trim(),

          description:
            String(
              assignment?.instructions ||
              assignment?.description ||
              "Assignment due"
            ).trim(),

          start:
            dueDate,

          end:
            null,

          classId:
            normalizeId(
              assignment?.classId?._id ||
              assignment?.classId
            ),

          teacherId:
            normalizeId(
              assignment?.teacherId?._id ||
              assignment?.teacherId
            ),

          teacherName:
            String(
              assignment?.teacherId?.name ||
              ""
            ).trim(),

          meetingLink:
            "",

          location:
            "",

          original:
            assignment
        };
      })
      .filter(Boolean);


  return [
    ...scheduleEvents,
    ...assignmentEvents
  ].sort(
    (
      first,
      second
    ) =>
      first.start.getTime() -
      second.start.getTime()
  );
}


/* =========================================================
   CALENDAR FILTERING
========================================================= */

function getFilteredStudentCalendarEvents(){

  const searchValue =
    String(
      studentCalendarSearchQuery ||
      ""
    )
      .trim()
      .toLowerCase();

  return buildStudentCalendarEvents()
    .filter(event => {

      if (
        studentCalendarTypeFilter !==
          "all" &&
        event.type !==
          studentCalendarTypeFilter
      ){
        return false;
      }

      if (
        studentCalendarTeacherFilter &&
        event.teacherId !==
          studentCalendarTeacherFilter
      ){
        return false;
      }

      if (!searchValue){
        return true;
      }

      const searchableText =
        [
          event.title,
          event.description,
          event.teacherName,
          event.location
        ]
          .join(" ")
          .toLowerCase();

      return searchableText.includes(
        searchValue
      );
    });
}


/* =========================================================
   EVENT STATUS
========================================================= */

function getStudentCalendarEventStatus(
  event
){
  const now =
    new Date();

  const eventTime =
    event?.start instanceof Date
      ? event.start
      : new Date(
          event?.start
        );

  if (
    Number.isNaN(
      eventTime.getTime()
    )
  ){
    return {
      label:
        "",

      className:
        ""
    };
  }

  const difference =
    eventTime.getTime() -
    now.getTime();

  const minutes =
    Math.round(
      difference /
      60000
    );

  if (
    event.type ===
      "assignment" &&
    difference < 0
  ){
    return {
      label:
        "Past due",

      className:
        "danger"
    };
  }

  if (
    event.type ===
      "meeting" &&
    minutes >= -60 &&
    minutes <= 15
  ){
    return {
      label:
        minutes <= 0
          ? "Live now"
          : `Starts in ${minutes} min`,

      className:
        "success"
    };
  }

  if (
    isSameCalendarDay(
      eventTime,
      now
    )
  ){
    return {
      label:
        "Today",

      className:
        "primary"
    };
  }

  return {
    label:
      "",

    className:
      ""
  };
}

/* =========================================================
   RENDER COMPLETE STUDENT CALENDAR
========================================================= */

function renderStudentCalendarWorkspace(){

  hydrateStudentCalendarTeacherFilter();

  updateStudentCalendarSummary();

  updateStudentCalendarViewButtons();

  renderSchedule();

  renderCalendar();

}
/* =========================================================
   CALENDAR VIEW BUTTON STATE
========================================================= */

function updateStudentCalendarViewButtons(){

  document
    .querySelectorAll(
      "[data-calendar-view]"
    )
    .forEach(button => {

      const view =
        String(
          button.dataset.calendarView ||
          ""
        )
          .trim()
          .toLowerCase();

      const active =
        view ===
        studentCalendarView;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-pressed",
        String(active)
      );

    });

}
/* =========================================================
   CALENDAR PERIOD NAVIGATION
========================================================= */

function moveStudentCalendarPeriod(
  direction
){

  const amount =
    Number(direction) < 0
      ? -1
      : 1;

  const nextDate =
    new Date(
      studentCalendarCurrentDate
    );

  if (
    studentCalendarView ===
    "week"
  ){

    nextDate.setDate(
      nextDate.getDate() +
      (
        amount * 7
      )
    );

  }else if (
    studentCalendarView ===
    "agenda"
  ){

    nextDate.setDate(
      nextDate.getDate() +
      (
        amount * 7
      )
    );

  }else{

    nextDate.setMonth(
      nextDate.getMonth() +
      amount
    );

  }

  studentCalendarCurrentDate =
    nextDate;

  renderStudentCalendarWorkspace();

}


function resetStudentCalendarToToday(){

  const today =
    startOfCalendarDay(
      new Date()
    );

  studentCalendarCurrentDate =
    new Date(
      today
    );

  studentCalendarSelectedDate =
    new Date(
      today
    );

  renderStudentCalendarWorkspace();

  renderStudentSelectedDayAgenda();
}
/* =========================================================
   OPEN CALENDAR ASSIGNMENT
========================================================= */

function openStudentCalendarAssignment(
  assignmentId
){

  const normalizedAssignmentId =
    normalizeId(
      assignmentId
    );

  if (!normalizedAssignmentId){

    notifyAIFTWarning(
      "This assignment could not be identified.",
      {
        title:
          "Assignment unavailable"
      }
    );

    return;
  }

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

    notifyAIFTWarning(
      "This assignment is no longer available in your Assignment Center.",
      {
        title:
          "Assignment unavailable"
      }
    );

    return;
  }

  openSubmissionModal(
    normalizedAssignmentId
  );

}
/* =========================================================
   CALENDAR EVENT ACTIONS
========================================================= */

function handleStudentCalendarEventClick(
  event
){

  /*
    Assignment action inside the agenda.
  */

  const assignmentButton =
    event.target.closest(
      ".student-calendar-open-assignment"
    );

  if (assignmentButton){

    event.preventDefault();

    event.stopPropagation();

    openStudentCalendarAssignment(
      assignmentButton.dataset
        .assignmentId
    );

    return;
  }


  /*
    Existing calendar event.
  */

  const calendarEventButton =
    event.target.closest(
      "[data-calendar-event-id]"
    );

  if (calendarEventButton){

    event.preventDefault();

    event.stopPropagation();

    const eventId =
      String(
        calendarEventButton.dataset
          .calendarEventId ||
        ""
      ).trim();

    const calendarEvent =
      buildStudentCalendarEvents()
        .find(item =>
          item.id ===
          eventId
        );

    if (!calendarEvent){

      notifyAIFTWarning(
        "This calendar event is no longer available.",
        {
          title:
            "Event unavailable"
        }
      );

      return;
    }

    if (
      calendarEvent.type ===
      "assignment"
    ){

      openStudentCalendarAssignment(
        calendarEvent.sourceId
      );

      return;
    }

    if (
      calendarEvent.meetingLink
    ){

      window.open(
        calendarEvent.meetingLink,
        "_blank",
        "noopener,noreferrer"
      );

      return;
    }

    /*
      For a normal class event, select its date and display
      all activities for that day in the agenda panel.
    */

    studentCalendarSelectedDate =
      startOfCalendarDay(
        calendarEvent.start
      );

    studentCalendarCurrentDate =
      new Date(
        studentCalendarSelectedDate
      );

    renderCalendar();

    renderStudentSelectedDayAgenda();

    return;
  }


  /*
    Empty calendar day.
  */

  const dayCell =
    event.target.closest(
      ".student-calendar-day-cell[data-calendar-date]"
    );

  if (!dayCell){
    return;
  }

  event.preventDefault();

  const dateKey =
    String(
      dayCell.dataset.calendarDate ||
      ""
    ).trim();

  if (!dateKey){
    return;
  }

  const selectedDate =
    startOfCalendarDay(
      `${dateKey}T00:00:00`
    );

  if (!selectedDate){
    return;
  }

  studentCalendarSelectedDate =
    selectedDate;

  studentCalendarCurrentDate =
    new Date(
      selectedDate
    );

  renderCalendar();

  renderStudentSelectedDayAgenda();
}
/* =========================================================
   REFRESH STUDENT CALENDAR DATA
========================================================= */

async function refreshStudentCalendar(){

  if (
    studentCalendarRefreshInProgress
  ){
    return;
  }

  const refreshButton =
    $("refreshStudentCalendarButton");

  const retryButton =
    $("retryStudentCalendarButton");

  const loading =
    $("studentCalendarLoading");

  const errorState =
    $("studentCalendarError");

  const calendarGrid =
    $("calendarGrid");

  const scheduleList =
    $("scheduleList");


  studentCalendarRefreshInProgress =
    true;


  refreshButton?.setAttribute(
    "disabled",
    ""
  );

  retryButton?.setAttribute(
    "disabled",
    ""
  );

  refreshButton
    ?.querySelector("i")
    ?.classList.add(
      "fa-spin"
    );


  if (loading){

    loading.hidden =
      false;

  }

  if (errorState){

    errorState.hidden =
      true;

  }

  if (calendarGrid){

    calendarGrid.hidden =
      true;

  }

  if (scheduleList){

    scheduleList.innerHTML = `
      <div class="student-calendar-agenda-loading">

        <span></span>
        <span></span>
        <span></span>

      </div>
    `;

  }


  try{

    const schoolId =
      normalizeId(
        state.me?.schoolId ||
        state.me?.linkedSchoolId ||
        state.loggedUser?.schoolId ||
        state.loggedUser?.linkedSchoolId ||
        state.me?._id ||
        state.loggedUser?._id
      );

    if (!schoolId){

      throw new Error(
        "Your school account could not be identified."
      );

    }


    const [
      assignments,
      schedules
    ] =
      await Promise.all([

        apiGet(
          `/api/assignments?schoolId=${
            encodeURIComponent(
              schoolId
            )
          }`,
          []
        ),

        apiGet(
          `/api/schedules?schoolId=${
            encodeURIComponent(
              schoolId
            )
          }`,
          []
        )

      ]);


    state.assignments =
      asArray(
        assignments
      );

    state.schedules =
      asArray(
        schedules
      );


    renderStudentCalendarWorkspace();


    notifyAIFTSuccess(
      "Your calendar is up to date.",
      {
        title:
          "Calendar refreshed"
      }
    );

  }catch(error){

    console.error(
      "Student calendar refresh error:",
      error
    );


    if (calendarGrid){

      calendarGrid.innerHTML =
        "";

    }

    if (errorState){

      errorState.hidden =
        false;

    }

    notifyAIFTError(
      error?.message ||
      "AIFT could not refresh your calendar."
    );

  }finally{

    studentCalendarRefreshInProgress =
      false;


    if (loading){

      loading.hidden =
        true;

    }

    if (calendarGrid){

      calendarGrid.hidden =
        false;

    }


    refreshButton?.removeAttribute(
      "disabled"
    );

    retryButton?.removeAttribute(
      "disabled"
    );

    refreshButton
      ?.querySelector("i")
      ?.classList.remove(
        "fa-spin"
      );

  }

}
/* =========================================================
   BIND STUDENT CALENDAR CONTROLS
========================================================= */

function bindStudentCalendarControls(){

  if (
    studentCalendarControlsBound
  ){
    return;
  }


  const todayButton =
    $("todayScheduleButton");

  const previousButton =
    $("previousScheduleButton");

  const nextButton =
    $("nextScheduleButton");

  const searchInput =
    $("scheduleSearch");

  const typeFilter =
    $("scheduleTypeFilter");

  const teacherFilter =
    $("scheduleTeacherFilter");

  const refreshButton =
    $("refreshStudentCalendarButton");

  const retryButton =
    $("retryStudentCalendarButton");

  const scheduleSection =
    $("section-schedule");


  todayButton?.addEventListener(
    "click",
    () => {

      resetStudentCalendarToToday();

    }
  );


  previousButton?.addEventListener(
    "click",
    () => {

      moveStudentCalendarPeriod(
        -1
      );

    }
  );


  nextButton?.addEventListener(
    "click",
    () => {

      moveStudentCalendarPeriod(
        1
      );

    }
  );


  document
    .querySelectorAll(
      "[data-calendar-view]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const requestedView =
            String(
              button.dataset
                .calendarView ||
              "month"
            )
              .trim()
              .toLowerCase();

          if (
            ![
              "month",
              "week",
              "agenda"
            ].includes(
              requestedView
            )
          ){
            return;
          }

          studentCalendarView =
            requestedView;

          renderStudentCalendarWorkspace();

        }
      );

    });


  searchInput?.addEventListener(
    "input",
    event => {

      studentCalendarSearchQuery =
        String(
          event.target.value ||
          ""
        );

      renderStudentCalendarWorkspace();

    }
  );


  typeFilter?.addEventListener(
    "change",
    event => {

      studentCalendarTypeFilter =
        String(
          event.target.value ||
          "all"
        );

      renderStudentCalendarWorkspace();

    }
  );


  teacherFilter?.addEventListener(
    "change",
    event => {

      studentCalendarTeacherFilter =
        String(
          event.target.value ||
          ""
        );

      renderStudentCalendarWorkspace();

    }
  );


  refreshButton?.addEventListener(
    "click",
    refreshStudentCalendar
  );


  retryButton?.addEventListener(
    "click",
    refreshStudentCalendar
  );


  scheduleSection?.addEventListener(
    "click",
    handleStudentCalendarEventClick
  );


  /*
    Keyboard navigation is active only while the student
    is viewing the Schedule section.
  */

  document.addEventListener(
    "keydown",
    event => {

      if (
        activeStudentStudioPage !==
        "schedule"
      ){
        return;
      }

      const target =
        event.target;

      const isTyping =
        target instanceof
          HTMLInputElement ||
        target instanceof
          HTMLTextAreaElement ||
        target instanceof
          HTMLSelectElement ||
        target?.isContentEditable;

      if (isTyping){
        return;
      }


      if (
        event.key ===
        "ArrowLeft"
      ){

        event.preventDefault();

        moveStudentCalendarPeriod(
          -1
        );

        return;
      }


      if (
        event.key ===
        "ArrowRight"
      ){

        event.preventDefault();

        moveStudentCalendarPeriod(
          1
        );

        return;
      }


      if (
        event.key.toLowerCase() ===
        "t"
      ){

        event.preventDefault();

        resetStudentCalendarToToday();

      }

    }
  );


  studentCalendarControlsBound =
    true;

}

/* =========================================================
   CALENDAR SUMMARY
========================================================= */

function updateStudentCalendarSummary(){

  const events =
    buildStudentCalendarEvents();

  const now =
    new Date();

  const todayStart =
    startOfCalendarDay(
      now
    );

  const nextWeek =
    new Date(
      todayStart
    );

  /*
    The range comparison below uses:

    event.start < nextWeek

    Adding eight days includes today plus the complete
    next seven calendar days.
  */

  nextWeek.setDate(
    nextWeek.getDate() + 8
  );

  const todayEvents =
    events.filter(
      event =>
        isSameCalendarDay(
          event.start,
          now
        )
    );

  const upcomingEvents =
    events.filter(
      event =>
        event.start >=
          todayStart &&
        event.start <
          nextWeek
    );

  const deadlines =
    upcomingEvents.filter(
      event =>
        event.type ===
        "assignment"
    );

  const liveClasses =
    upcomingEvents.filter(
      event =>
        event.type ===
          "meeting"
    );

  setText(
    "studentScheduleTodayCount",
    todayEvents.length
  );

  setText(
    "studentScheduleUpcomingCount",
    upcomingEvents.length
  );

  setText(
    "studentScheduleDeadlineCount",
    deadlines.length
  );

  setText(
    "studentScheduleLiveCount",
    liveClasses.length
  );
}


/* =========================================================
   TEACHER FILTER OPTIONS
========================================================= */

function hydrateStudentCalendarTeacherFilter(){

  const select =
    $("scheduleTeacherFilter");

  if (!select){
    return;
  }

  const currentValue =
    String(
      select.value ||
      studentCalendarTeacherFilter ||
      ""
    );

  const teacherMap =
    new Map();

  buildStudentCalendarEvents()
    .forEach(event => {
      if (
        event.teacherId &&
        event.teacherName
      ){
        teacherMap.set(
          event.teacherId,
          event.teacherName
        );
      }
    });

  select.innerHTML = `
    <option value="">
      All teachers
    </option>

    ${
      Array.from(
        teacherMap.entries()
      )
        .sort(
          (
            first,
            second
          ) =>
            first[1].localeCompare(
              second[1]
            )
        )
        .map(
          (
            [
              teacherId,
              teacherName
            ]
          ) => `
            <option
              value="${
                escapeHtml(
                  teacherId
                )
              }"
            >
              ${
                escapeHtml(
                  teacherName
                )
              }
            </option>
          `
        )
        .join("")
    }
  `;

  select.value =
    currentValue;
}

/* =========================================================
   SELECTED CALENDAR DAY AGENDA
========================================================= */

function renderStudentSelectedDayAgenda(){

  const container =
    $("scheduleList");

  if (!container){
    return;
  }

  const selectedDate =
    startOfCalendarDay(
      studentCalendarSelectedDate ||
      studentCalendarCurrentDate ||
      new Date()
    );

  if (!selectedDate){
    return;
  }

  const events =
    getFilteredStudentCalendarEvents()
      .filter(event =>
        isSameCalendarDay(
          event.start,
          selectedDate
        )
      )
      .sort(
        (
          first,
          second
        ) =>
          first.start.getTime() -
          second.start.getTime()
      );

  const agendaHeading =
    document.querySelector(
      ".student-calendar-agenda-header h3"
    );

  if (agendaHeading){
    agendaHeading.textContent =
      formatCalendarDayHeading(
        selectedDate
      );
  }

  if (!events.length){

    container.innerHTML = `
      <div class="student-calendar-state selected-day-empty">

        <span class="student-calendar-state-icon">

          <i
            class="fa-regular fa-calendar"
            aria-hidden="true"
          ></i>

        </span>

        <strong>
          No events on this day
        </strong>

        <p>
          ${
            escapeHtml(
              selectedDate.toLocaleDateString(
                [],
                {
                  weekday:"long",
                  month:"long",
                  day:"numeric",
                  year:"numeric"
                }
              )
            )
          }
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML =
    events
      .map(event => {

        const status =
          getStudentCalendarEventStatus(
            event
          );

        return `
          <article
            class="student-calendar-agenda-item"
            data-calendar-event-id="${
              escapeHtml(
                event.id
              )
            }"
          >

            <span
              class="
                student-calendar-agenda-marker
                ${escapeHtml(event.type)}
              "
              aria-hidden="true"
            ></span>

            <div class="student-calendar-agenda-copy">

              <strong>
                ${
                  escapeHtml(
                    event.title
                  )
                }
              </strong>

              <span>
                ${
                  escapeHtml(
                    formatCalendarTime(
                      event.start
                    ) ||
                    "All day"
                  )
                }

                ${
                  event.teacherName
                    ? ` • ${
                        escapeHtml(
                          event.teacherName
                        )
                      }`
                    : ""
                }
              </span>

              ${
                event.description
                  ? `
                    <small>
                      ${
                        escapeHtml(
                          event.description
                        )
                      }
                    </small>
                  `
                  : ""
              }

              <div class="student-calendar-agenda-actions">

                ${
                  status.label
                    ? `
                      <span
                        class="
                          chip
                          ${escapeHtml(
                            status.className
                          )}
                        "
                      >
                        ${
                          escapeHtml(
                            status.label
                          )
                        }
                      </span>
                    `
                    : ""
                }

                ${
                  event.type ===
                  "assignment"
                    ? `
                      <button
                        class="
                          student-calendar-agenda-action
                          student-calendar-open-assignment
                        "
                        type="button"
                        data-assignment-id="${
                          escapeHtml(
                            event.sourceId
                          )
                        }"
                      >
                        <i
                          class="fa-solid fa-arrow-up-right-from-square"
                          aria-hidden="true"
                        ></i>

                        Open assignment
                      </button>
                    `
                    : ""
                }

                ${
                  event.meetingLink
                    ? `
                      <a
                        class="student-calendar-agenda-action"
                        href="${
                          escapeHtml(
                            event.meetingLink
                          )
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i
                          class="fa-solid fa-video"
                          aria-hidden="true"
                        ></i>

                        Join meeting
                      </a>
                    `
                    : ""
                }

              </div>

            </div>

          </article>
        `;
      })
      .join("");
}


function renderSchedule(){

  const container =
    $("scheduleList");

  if (!container){
    return;
  }

  hydrateStudentCalendarTeacherFilter();

  updateStudentCalendarSummary();

  const now =
    new Date();

  const events =
    getFilteredStudentCalendarEvents()
      .filter(
        event =>
          event.start >=
          startOfCalendarDay(
            now
          )
      )
      .slice(
        0,
        20
      );

  if (!events.length){
    container.innerHTML = `
      <div class="student-calendar-state">

        <span class="student-calendar-state-icon">

          <i
            class="fa-regular fa-calendar-check"
            aria-hidden="true"
          ></i>

        </span>

        <strong>
          Nothing upcoming
        </strong>

        <p>
          There are no classes, meetings, or deadlines
          matching your current filters.
        </p>

      </div>
    `;

    return;
  }

  const groupedEvents =
    new Map();

  events.forEach(event => {
    const dateKey =
      getCalendarDateKey(
        event.start
      );

    if (
      !groupedEvents.has(
        dateKey
      )
    ){
      groupedEvents.set(
        dateKey,
        []
      );
    }

    groupedEvents
      .get(dateKey)
      .push(event);
  });


  container.innerHTML =
    Array.from(
      groupedEvents.entries()
    )
      .map(
        (
          [
            dateKey,
            dateEvents
          ]
        ) => {

          const groupDate =
            dateEvents[0]
              ?.start;

          return `
            <section
              class="student-calendar-agenda-group"
              data-calendar-date="${
                escapeHtml(
                  dateKey
                )
              }"
            >

              <div class="student-calendar-agenda-date">

                ${
                  escapeHtml(
                    formatCalendarDayHeading(
                      groupDate
                    )
                  )
                }

              </div>


              ${
                dateEvents
                  .map(event => {

                    const status =
                      getStudentCalendarEventStatus(
                        event
                      );

                    return `
                      <article
                        class="student-calendar-agenda-item"
                        data-calendar-event-id="${
                          escapeHtml(
                            event.id
                          )
                        }"
                      >

                        <span
                          class="
                            student-calendar-agenda-marker
                            ${event.type}
                          "
                          aria-hidden="true"
                        ></span>


                        <div class="student-calendar-agenda-copy">

                          <strong>

                            ${
                              escapeHtml(
                                event.title
                              )
                            }

                          </strong>


                          <span>

                            ${
                              escapeHtml(
                                formatCalendarTime(
                                  event.start
                                ) ||
                                "All day"
                              )
                            }

                            ${
                              event.teacherName
                                ? ` • ${
                                    escapeHtml(
                                      event.teacherName
                                    )
                                  }`
                                : ""
                            }

                          </span>


                          ${
                            event.location
                              ? `
                                <small>
                                  ${
                                    escapeHtml(
                                      event.location
                                    )
                                  }
                                </small>
                              `
                              : ""
                          }


                          <div class="student-calendar-agenda-actions">

                            ${
                              status.label
                                ? `
                                  <span
                                    class="
                                      chip
                                      ${status.className}
                                    "
                                  >
                                    ${
                                      escapeHtml(
                                        status.label
                                      )
                                    }
                                  </span>
                                `
                                : ""
                            }

                            ${
                              event.meetingLink
                                ? `
                                  <a
                                    class="student-calendar-agenda-action"
                                    href="${
                                      escapeHtml(
                                        event.meetingLink
                                      )
                                    }"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <i
                                      class="fa-solid fa-video"
                                      aria-hidden="true"
                                    ></i>

                                    Join
                                  </a>
                                `
                                : ""
                            }

                            ${
                              event.type ===
                                "assignment"
                                ? `
                                  <button
                                    class="
                                      student-calendar-agenda-action
                                      student-calendar-open-assignment
                                    "
                                    type="button"
                                    data-assignment-id="${
                                      escapeHtml(
                                        event.sourceId
                                      )
                                    }"
                                  >
                                    <i
                                      class="fa-solid fa-arrow-up-right-from-square"
                                      aria-hidden="true"
                                    ></i>

                                    Open
                                  </button>
                                `
                                : ""
                            }

                          </div>

                        </div>

                      </article>
                    `;
                  })
                  .join("")
              }

            </section>
          `;
        }
      )
      .join("");
}

function renderCalendar(){

  const container =
    $("calendarGrid");

  if (!container){
    return;
  }

  updateStudentCalendarSummary();

  const events =
    getFilteredStudentCalendarEvents();

  const referenceDate =
    new Date(
      studentCalendarCurrentDate
    );

  const title =
    $("studentCalendarPeriodTitle");

  const subtitle =
    $("studentCalendarPeriodSubtitle");


  if (
    studentCalendarView ===
    "agenda"
  ){
if (title){

  title.textContent =
    studentCalendarCurrentDate
      .toLocaleDateString(
        [],
        {
          month:
            "long",

          year:
            "numeric"
        }
      );

}


if (subtitle){

  subtitle.textContent =
    "Thirty-day agenda starting from the selected date";

}

const agendaStart =
  startOfCalendarDay(
    studentCalendarCurrentDate
  );


const agendaEnd =
  new Date(
    agendaStart
  );

agendaEnd.setDate(
  agendaEnd.getDate() + 30
);


const futureEvents =
  events
    .filter(
      event =>
        event.start >=
          agendaStart &&
        event.start <
          agendaEnd
    )
    .slice(
      0,
      40
    );

    if (!futureEvents.length){
      container.innerHTML = `
        <div class="student-calendar-state">

          <span class="student-calendar-state-icon">

            <i
              class="fa-regular fa-calendar"
              aria-hidden="true"
            ></i>

          </span>

          <strong>
            No upcoming events
          </strong>

          <p>
            Your agenda is currently clear.
          </p>

        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div
        class="student-calendar-agenda-list"
        style="max-height:none;padding:14px;"
      >

        ${
          futureEvents
            .map(event => `
              <article class="student-calendar-agenda-item">

                <span
                  class="
                    student-calendar-agenda-marker
                    ${event.type}
                  "
                ></span>

                <div class="student-calendar-agenda-copy">

                  <strong>
                    ${
                      escapeHtml(
                        event.title
                      )
                    }
                  </strong>

                  <span>
                    ${
                      escapeHtml(
                        formatDateTime(
                          event.start
                        )
                      )
                    }
                  </span>

                  <small>
                    ${
                      escapeHtml(
                        event.description ||
                        "Calendar event"
                      )
                    }
                  </small>

                </div>

              </article>
            `)
            .join("")
        }

      </div>
    `;

    return;
  }


  const monthStart =
    new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      1
    );

  const monthEnd =
    new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() + 1,
      0
    );

if (
  studentCalendarView ===
  "week"
){

  const weekStart =
    startOfCalendarDay(
      referenceDate
    );

  const weekdayIndex =
    (
      weekStart.getDay() +
      6
    ) % 7;

  weekStart.setDate(
    weekStart.getDate() -
    weekdayIndex
  );


  const weekEnd =
    new Date(
      weekStart
    );

  weekEnd.setDate(
    weekEnd.getDate() + 6
  );


  if (title){

    const sameMonth =
      weekStart.getMonth() ===
        weekEnd.getMonth() &&
      weekStart.getFullYear() ===
        weekEnd.getFullYear();


    title.textContent =
      sameMonth
        ? `${
            weekStart.toLocaleDateString(
              [],
              {
                month:
                  "long",

                day:
                  "numeric"
              }
            )
          } – ${
            weekEnd.toLocaleDateString(
              [],
              {
                day:
                  "numeric",

                year:
                  "numeric"
              }
            )
          }`
        : `${
            weekStart.toLocaleDateString(
              [],
              {
                month:
                  "short",

                day:
                  "numeric"
              }
            )
          } – ${
            weekEnd.toLocaleDateString(
              [],
              {
                month:
                  "short",

                day:
                  "numeric",

                year:
                  "numeric"
              }
            )
          }`;

  }


  if (subtitle){

    subtitle.textContent =
      "Your seven-day learning schedule";

  }

}else{

  if (title){

    title.textContent =
      referenceDate.toLocaleDateString(
        [],
        {
          month:
            "long",

          year:
            "numeric"
        }
      );

  }


  if (subtitle){

    subtitle.textContent =
      "Classes, meetings, and deadlines";

  }

}


  let gridStart;

  let cellCount;


  if (
    studentCalendarView ===
    "week"
  ){
    gridStart =
      startOfCalendarDay(
        referenceDate
      );

    const weekday =
      (
        gridStart.getDay() +
        6
      ) % 7;

    gridStart.setDate(
      gridStart.getDate() -
      weekday
    );

    cellCount =
      7;
  }else{
    gridStart =
      new Date(
        monthStart
      );

    const startWeekday =
      (
        gridStart.getDay() +
        6
      ) % 7;

    gridStart.setDate(
      gridStart.getDate() -
      startWeekday
    );

    cellCount =
      42;
  }


  const weekdays =
    [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun"
    ];


  const cells =
    [];


  for (
    let index = 0;
    index < cellCount;
    index += 1
  ){
    const date =
      new Date(
        gridStart
      );

    date.setDate(
      gridStart.getDate() +
      index
    );

    const dayEvents =
      events.filter(
        event =>
          isSameCalendarDay(
            event.start,
            date
          )
      );

    const visibleEvents =
      dayEvents.slice(
        0,
        studentCalendarView ===
          "week"
          ? 8
          : 3
      );

    const hiddenCount =
      Math.max(
        0,
        dayEvents.length -
        visibleEvents.length
      );

    const isOtherMonth =
      studentCalendarView ===
        "month" &&
      date.getMonth() !==
        referenceDate.getMonth();

    cells.push(`
      <div
        class="
          student-calendar-day-cell
          ${
            isOtherMonth
              ? "other-month"
              : ""
          }
          ${
            isSameCalendarDay(
              date,
              new Date()
            )
              ? "today"
              : ""
          }
          ${
            isSameCalendarDay(
              date,
              studentCalendarSelectedDate
            )
              ? "selected"
              : ""
          }
        "
        role="button"
        tabindex="0"
        data-calendar-date="${
          escapeHtml(
            getCalendarDateKey(
              date
            )
          )
        }"
        aria-label="${
          escapeHtml(
            date.toLocaleDateString(
              [],
              {
                weekday:
                  "long",

                month:
                  "long",

                day:
                  "numeric",

                year:
                  "numeric"
              }
            )
          )
        }"
      >

        <span class="student-calendar-day-number">

          ${date.getDate()}

        </span>


        <div class="student-calendar-day-events">

          ${
            visibleEvents
              .map(event => `
                <button
                  class="
                    student-calendar-event
                    ${event.type}
                  "
                  type="button"
                  data-calendar-event-id="${
                    escapeHtml(
                      event.id
                    )
                  }"
                  title="${
                    escapeHtml(
                      event.title
                    )
                  }"
                >

                  <span>

                    ${
                      formatCalendarTime(
                        event.start
                      )
                        ? `${
                            escapeHtml(
                              formatCalendarTime(
                                event.start
                              )
                            )
                          } `
                        : ""
                    }

                    ${
                      escapeHtml(
                        event.title
                      )
                    }

                  </span>

                </button>
              `)
              .join("")
          }

          ${
            hiddenCount > 0
              ? `
                <span class="student-calendar-more-events">

                  +${hiddenCount} more

                </span>
              `
              : ""
          }

        </div>

      </div>
    `);
  }


  container.innerHTML = `
    <div class="student-calendar-weekdays">

      ${
        weekdays
          .map(day => `
            <div class="student-calendar-weekday">
              ${day}
            </div>
          `)
          .join("")
      }

    </div>

    <div class="student-calendar-month-grid">

      ${cells.join("")}

    </div>
  `;
}


function renderStudentAgendaForDate(
  dateKey,
  events
){

  const container =
    $("scheduleList");

  if(!container){
    return;
  }

  if(!events.length){

    container.innerHTML=`
      <div class="student-calendar-state">

        <strong>
          ${escapeHtml(dateKey)}
        </strong>

        <p>
          No events scheduled.
        </p>

      </div>
    `;

    return;
  }

  container.innerHTML=
    events.map(event=>`

      <article
        class="student-calendar-agenda-item"
        data-calendar-event-id="${escapeHtml(event.id)}"
      >

        <span
          class="
            student-calendar-agenda-marker
            ${event.type}
          "
        ></span>

        <div class="student-calendar-agenda-copy">

          <strong>
            ${escapeHtml(event.title)}
          </strong>

          <span>
            ${escapeHtml(
              formatDateTime(
                event.start
              )
            )}
          </span>

          <small>
            ${escapeHtml(
              event.description ||
              ""
            )}
          </small>

        </div>

      </article>

    `).join("");

}

/* =========================================================
   STUDENT ANALYTICS CONTROLLER
========================================================= */

let studentAnalyticsControlsBound =
  false;

let studentAnalyticsRefreshing =
  false;

/* =========================================================
   STUDENT ANALYTICS HELPERS
========================================================= */

function clampStudentAnalyticsPercentage(
  value
){
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        Number(value) || 0
      )
    )
  );
}


function getStudentAnalyticsClassRecords(){

  return getStudentClasses()
    .map(classItem => {

      const classId =
        normalizeId(
          classItem?._id ||
          classItem?.id
        );

      const progressRecord =
        getStudentClassProgressRecord(
          classId
        );

      const progress =
        progressRecord?.progress ||
        {};

      return {
        classId,

        classItem,

        record:
          progressRecord,

        overall:
          clampStudentAnalyticsPercentage(
            progress?.overall
          ),

        lessons:
          {
            total:
              Number(
                progress?.lessons?.total
              ) || 0,

            completed:
              Number(
                progress?.lessons?.completed
              ) || 0,

            percentage:
              clampStudentAnalyticsPercentage(
                progress?.lessons?.percentage
              )
          },

        assignments:
          {
            total:
              Number(
                progress?.assignments?.total
              ) || 0,

            completed:
              Number(
                progress?.assignments?.completed
              ) || 0,

            percentage:
              clampStudentAnalyticsPercentage(
                progress?.assignments?.percentage
              )
          },

        quizzes:
          {
            total:
              Number(
                progress?.quizzes?.total
              ) || 0,

            completed:
              Number(
                progress?.quizzes?.completed
              ) || 0,

            percentage:
              clampStudentAnalyticsPercentage(
                progress?.quizzes?.percentage
              )
          },

        attendance:
          {
            total:
              Number(
                progress?.attendance?.total
              ) || 0,

            present:
              Number(
                progress?.attendance?.present
              ) || 0,

            late:
              Number(
                progress?.attendance?.late
              ) || 0,

            absent:
              Number(
                progress?.attendance?.absent
              ) || 0,

            excused:
              Number(
                progress?.attendance?.excused
              ) || 0,

            percentage:
              clampStudentAnalyticsPercentage(
                progress?.attendance?.percentage
              )
          },

        latestActivity:
          progressRecord?.latestActivity ||
          null,

        available:
          Boolean(
            progressRecord?.available
          )
      };
    });
}


function getStudentNumericGrade(
  submission
){

  const possibleValues =
    [
      submission?.grade,
      submission?.score,
      submission?.percentage,
      submission?.pointsEarned
    ];

  for (
    const value of possibleValues
  ){

    if (
      value === null ||
      value === undefined ||
      value === ""
    ){
      continue;
    }

    const match =
      String(value)
        .replace(
          /,/g,
          ""
        )
        .match(
          /-?\d+(?:\.\d+)?/
        );

    if (!match){
      continue;
    }

    let numericValue =
      Number(
        match[0]
      );

    if (
      !Number.isFinite(
        numericValue
      )
    ){
      continue;
    }

    const maximumPoints =
      Number(
        submission?.maxGrade ||
        submission?.maximumPoints ||
        submission?.pointsPossible ||
        submission?.assignmentId?.points ||
        submission?.assignmentId?.maxPoints ||
        0
      );

    /*
      Convert point-based grades into a percentage
      when a maximum score exists.
    */

    if (
      maximumPoints > 0 &&
      numericValue <= maximumPoints
    ){
      numericValue =
        (
          numericValue /
          maximumPoints
        ) * 100;
    }

    return clampStudentAnalyticsPercentage(
      numericValue
    );
  }

  return null;
}


function getStudentAnalyticsGradeSummary(){

  const gradedSubmissions =
    getStudentSubmissions()
      .map(submission => ({
        submission,

        numericGrade:
          getStudentNumericGrade(
            submission
          )
      }))
      .filter(item =>
        item.numericGrade !== null
      );

  if (!gradedSubmissions.length){
    return {
      average:
        null,

      count:
        0,

      items:
        []
    };
  }

  const total =
    gradedSubmissions.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.numericGrade,
      0
    );

  return {
    average:
      Math.round(
        total /
        gradedSubmissions.length
      ),

    count:
      gradedSubmissions.length,

    items:
      gradedSubmissions
  };
}


function getStudentAnalyticsTotals(
  classRecords
){

  return classRecords.reduce(
    (
      totals,
      item
    ) => {

      totals.lessonsTotal +=
        item.lessons.total;

      totals.lessonsCompleted +=
        item.lessons.completed;

      totals.assignmentsTotal +=
        item.assignments.total;

      totals.assignmentsCompleted +=
        item.assignments.completed;

      totals.quizzesTotal +=
        item.quizzes.total;

      totals.quizzesCompleted +=
        item.quizzes.completed;

      totals.attendanceTotal +=
        item.attendance.total;

      totals.attendancePresent +=
        item.attendance.present;

      totals.attendanceLate +=
        item.attendance.late;

      totals.attendanceAbsent +=
        item.attendance.absent;

      totals.attendanceExcused +=
        item.attendance.excused;

      totals.overallTotal +=
        item.overall;

      totals.overallRecords +=
        item.available
          ? 1
          : 0;

      return totals;
    },
    {
      lessonsTotal:
        0,

      lessonsCompleted:
        0,

      assignmentsTotal:
        0,

      assignmentsCompleted:
        0,

      quizzesTotal:
        0,

      quizzesCompleted:
        0,

      attendanceTotal:
        0,

      attendancePresent:
        0,

      attendanceLate:
        0,

      attendanceAbsent:
        0,

      attendanceExcused:
        0,

      overallTotal:
        0,

      overallRecords:
        0
    }
  );
}


function getStudentAnalyticsStatus(
  percentage
){

  const score =
    clampStudentAnalyticsPercentage(
      percentage
    );

  if (score >= 85){
    return {
      label:
        "Excellent",

      className:
        "good",

      message:
        "You are performing strongly across your current coursework."
    };
  }

  if (score >= 70){
    return {
      label:
        "On track",

      className:
        "good",

      message:
        "Your learning progress is healthy. Keep your current momentum."
    };
  }

  if (score >= 50){
    return {
      label:
        "Needs attention",

      className:
        "warning",

      message:
        "Some areas need additional focus to keep your progress on track."
    };
  }

  return {
    label:
      "At risk",

    className:
      "danger",

    message:
      "Your current activity shows areas that need immediate attention."
  };
}

/* =========================================================
   STUDENT ANALYTICS LOADING STATE
========================================================= */

function setStudentAnalyticsLoading(
  loading
){

  const progressContainer =
    $("progressList");

  const classContainer =
    $("studentClassProgressList");

  const attendanceContainer =
    $("attendanceList");

  const refreshButton =
    $("progressRefreshButton");

  const exportButton =
    $("progressExportButton");


  refreshButton?.toggleAttribute(
    "disabled",
    Boolean(loading)
  );

  exportButton?.toggleAttribute(
    "disabled",
    Boolean(loading)
  );


  if (!loading){
    return;
  }


  if (progressContainer){

    progressContainer.innerHTML = `
      <div class="student-analytics-loading-grid">

        <span></span>
        <span></span>
        <span></span>
        <span></span>

      </div>
    `;

  }


  if (classContainer){

    classContainer.innerHTML = `
      <div class="student-analytics-loading-grid">

        <span></span>
        <span></span>

      </div>
    `;

  }


  if (attendanceContainer){

    attendanceContainer.innerHTML = `
      <div class="student-analytics-loading-grid">

        <span></span>
        <span></span>

      </div>
    `;

  }

}

/* =========================================================
   LOAD STUDENT ANALYTICS DATA
========================================================= */

async function loadStudentAnalyticsData(){

  const schoolId =
    getSchoolId();

  const studentId =
    getStudentId();


  if (!schoolId){

    throw new Error(
      "Your school account could not be identified."
    );

  }


  if (!studentId){

    throw new Error(
      "Your student account could not be identified."
    );

  }


  const [
    classesResponse,
    assignmentsResponse,
    submissionsResponse
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
        null
      ),

      apiGet(
        `/api/submissions?schoolId=${
          encodeURIComponent(
            schoolId
          )
        }&studentId=${
          encodeURIComponent(
            studentId
          )
        }`,
        null
      )

    ]);


  /*
    apiGet() returns the supplied fallback when a request
    fails. Using null lets us detect a real API failure.
  */

  if (
    classesResponse === null ||
    assignmentsResponse === null ||
    submissionsResponse === null
  ){

    throw new Error(
      "One or more analytics requests could not be completed."
    );

  }


  state.classes =
    asArray(
      classesResponse
    );

  state.assignments =
    asArray(
      assignmentsResponse
    );

  state.submissions =
    asArray(
      submissionsResponse
    );


  state.classProgressById.clear();

  state.classProgressLoaded =
    false;


  await loadStudentClassProgress({
    force:
      true
  });


  calculateMetrics();

}

/* =========================================================
   OPEN STUDENT ANALYTICS WORKSPACE
========================================================= */

async function openStudentAnalyticsWorkspace(){

  bindStudentAnalyticsControls();


  /*
    If class progress was already loaded, render immediately
    without making another backend request.
  */

  if (
    state.classProgressLoaded &&
    !state.classProgressLoading
  ){

    renderProgress();

    renderAttendance();

    return;
  }


  /*
    If another request is already running, keep the skeleton
    visible and wait for that request to finish.
  */

  if (state.classProgressLoading){

    setStudentAnalyticsLoading(
      true
    );


    const waitStartedAt =
      Date.now();


    while (
      state.classProgressLoading &&
      Date.now() - waitStartedAt < 15000
    ){

      await new Promise(
        resolve =>
          window.setTimeout(
            resolve,
            120
          )
      );

    }


    if (state.classProgressLoaded){

      renderProgress();

      renderAttendance();

      return;
    }

  }


  setStudentAnalyticsLoading(
    true
  );


  try{

    await loadStudentClassProgress({
      force:
        true
    });


    calculateMetrics();

    renderProgress();

    renderAttendance();

  }catch(error){

    console.error(
      "Student Analytics workspace load failed:",
      error
    );


    renderStudentAnalyticsError(
      error?.message ||
      "AIFT could not load your learning analytics."
    );

  }finally{

    /*
      The renderer replaces the skeleton markup after a
      successful request. On failure, the error renderer
      replaces it instead.
    */

    $("progressRefreshButton")
      ?.removeAttribute(
        "disabled"
      );

    $("progressExportButton")
      ?.removeAttribute(
        "disabled"
      );

  }

}

/* =========================================================
   REFRESH STUDENT ANALYTICS
========================================================= */

async function refreshStudentAnalytics(){

  if (studentAnalyticsRefreshing){
    return;
  }


  const refreshButton =
    $("progressRefreshButton");

  const refreshIcon =
    refreshButton?.querySelector(
      "i"
    );


  studentAnalyticsRefreshing =
    true;

  setStudentAnalyticsLoading(
    true
  );


  setDashboardButtonLoading(
    refreshButton,
    true,
    "Refreshing..."
  );


  refreshIcon?.classList.add(
    "fa-spin"
  );


  try{

    await loadStudentAnalyticsData();

    renderProgress();

    renderAttendance();


    notifyAIFTSuccess(
      "Your learning analytics are up to date.",
      {
        title:
          "Analytics refreshed"
      }
    );

  }catch(error){

    console.error(
      "Student analytics refresh failed:",
      error
    );


    renderStudentAnalyticsError(
      error?.message ||
      "AIFT could not refresh your learning analytics."
    );


    notifyAIFTError(
      error?.message ||
      "AIFT could not refresh your learning analytics.",
      {
        title:
          "Refresh failed"
      }
    );

  }finally{

    studentAnalyticsRefreshing =
      false;


    setDashboardButtonLoading(
      refreshButton,
      false
    );


    refreshIcon?.classList.remove(
      "fa-spin"
    );


    refreshButton?.removeAttribute(
      "disabled"
    );

    $("progressExportButton")
      ?.removeAttribute(
        "disabled"
      );

  }

}

/* =========================================================
   STUDENT ANALYTICS ERROR STATE
========================================================= */

function renderStudentAnalyticsError(
  message
){

  const safeMessage =
    String(
      message ||
      "The analytics dashboard could not be loaded."
    ).trim();


  const errorMarkup = `
    <div class="student-analytics-error-state">

      <span class="student-analytics-error-icon">

        <i
          class="fa-solid fa-triangle-exclamation"
          aria-hidden="true"
        ></i>

      </span>

      <strong>
        Analytics could not be loaded
      </strong>

      <p>
        ${
          escapeHtml(
            safeMessage
          )
        }
      </p>

      <button
        class="ghost-btn"
        type="button"
        data-retry-student-analytics
      >
        <i
          class="fa-solid fa-rotate"
          aria-hidden="true"
        ></i>

        Try again
      </button>

    </div>
  `;


  const progressContainer =
    $("progressList");

  const classContainer =
    $("studentClassProgressList");

  const attendanceContainer =
    $("attendanceList");


  if (progressContainer){

    progressContainer.innerHTML =
      errorMarkup;

  }


  if (classContainer){

    classContainer.innerHTML =
      errorMarkup;

  }


  if (attendanceContainer){

    attendanceContainer.innerHTML =
      errorMarkup;

  }

}

/* =========================================================
   EXPORT STUDENT ANALYTICS
========================================================= */

function exportStudentAnalytics(){

  const classRecords =
    getStudentAnalyticsClassRecords();

  if (!classRecords.length){

    notifyAIFTWarning(
      "There is no class analytics data available to export.",
      {
        title:
          "Nothing to export"
      }
    );

    return;
  }


  const submissions =
    getStudentSubmissions();

  const gradeSummary =
    getStudentAnalyticsGradeSummary();


  const rows =
    [
      [
        "Class",
        "Teacher",
        "Overall Progress",
        "Lessons Completed",
        "Lessons Total",
        "Assignment Completed",
        "Assignment Total",
        "Quiz Completed",
        "Quiz Total",
        "Attendance Rate",
        "Present",
        "Late",
        "Absent",
        "Excused"
      ]
    ];


  classRecords.forEach(item => {

    const classTitle =
      String(
        item.classItem?.title ||
        item.classItem?.name ||
        item.classItem?.subject ||
        "Class"
      ).trim();

    const teacherName =
      String(
        item.classItem?.teacherId?.name ||
        item.classItem?.teacherName ||
        ""
      ).trim();

    rows.push([
      classTitle,
      teacherName,
      `${item.overall}%`,
      item.lessons.completed,
      item.lessons.total,
      item.assignments.completed,
      item.assignments.total,
      item.quizzes.completed,
      item.quizzes.total,
      `${item.attendance.percentage}%`,
      item.attendance.present,
      item.attendance.late,
      item.attendance.absent,
      item.attendance.excused
    ]);

  });


  rows.push([]);

  rows.push([
    "Analytics summary"
  ]);

  rows.push([
    "Student",
    String(
      state.me?.name ||
      state.loggedUser?.name ||
      "Student"
    )
  ]);

  rows.push([
    "Exported",
    new Date().toLocaleString()
  ]);

  rows.push([
    "Average grade",
    gradeSummary.average === null
      ? "No graded work"
      : `${gradeSummary.average}%`
  ]);

  rows.push([
    "Total submissions",
    submissions.length
  ]);


  const escapeCsvValue =
    value => {

      const text =
        String(
          value ?? ""
        );

      return `"${text.replace(
        /"/g,
        '""'
      )}"`;

    };


  const csvContent =
    rows
      .map(row =>
        row
          .map(
            escapeCsvValue
          )
          .join(",")
      )
      .join("\n");


  const blob =
    new Blob(
      [
        "\uFEFF",
        csvContent
      ],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );


  const downloadUrl =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  const studentName =
    String(
      state.me?.name ||
      state.loggedUser?.name ||
      "student"
    )
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        "-"
      )
      .replace(
        /^-+|-+$/g,
        ""
      ) ||
    "student";

  const exportDate =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  link.href =
    downloadUrl;

  link.download =
    `${studentName}-learning-analytics-${exportDate}.csv`;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    downloadUrl
  );


  notifyAIFTSuccess(
    "Your learning analytics report has been downloaded.",
    {
      title:
        "Export completed"
    }
  );

}

/* =========================================================
   BIND STUDENT ANALYTICS CONTROLS
========================================================= */

function bindStudentAnalyticsControls(){

  if (studentAnalyticsControlsBound){
    return;
  }

  const refreshButton =
    $("progressRefreshButton");

  const exportButton =
    $("progressExportButton");


  /*
    The Analytics HTML may not exist in older builds.
    Do not mark the controls as bound until the buttons exist.
  */

  if (
    !refreshButton &&
    !exportButton
  ){
    return;
  }


  refreshButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      refreshStudentAnalytics();

    }
  );


  exportButton?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      exportStudentAnalytics();

    }
  );


  $("section-progress")
    ?.addEventListener(
      "click",
      event => {

        const retryButton =
          event.target.closest(
            "[data-retry-student-analytics]"
          );

        if (!retryButton){
          return;
        }

        event.preventDefault();

        refreshStudentAnalytics();

      }
    );


  studentAnalyticsControlsBound =
    true;

}


function renderProgress(){

  const progressContainer =
    $("progressList");

  const classContainer =
    $("studentClassProgressList");

  const feedbackContainer =
    $("studentRecentFeedbackList");

  const warningContainer =
    $("studentAnalyticsWarnings");

  if (
    !progressContainer ||
    !classContainer
  ){
    return;
  }


  const classRecords =
    getStudentAnalyticsClassRecords();

  const totals =
    getStudentAnalyticsTotals(
      classRecords
    );

  const assignments =
    getStudentAssignments();

  const submissions =
    getStudentSubmissions();

  const gradeSummary =
    getStudentAnalyticsGradeSummary();


  /* =======================================================
     ASSIGNMENT COMPLETION
  ======================================================= */

  const submittedAssignmentIds =
    new Set(
      submissions.map(submission =>
        normalizeId(
          submission?.assignmentId?._id ||
          submission?.assignmentId
        )
      )
    );

  const submittedAssignmentCount =
    assignments.filter(assignment =>
      submittedAssignmentIds.has(
        normalizeId(
          assignment?._id ||
          assignment?.id
        )
      )
    ).length;

  const assignmentCompletion =
    assignments.length
      ? clampStudentAnalyticsPercentage(
          (
            submittedAssignmentCount /
            assignments.length
          ) * 100
        )
      : (
          totals.assignmentsTotal
            ? clampStudentAnalyticsPercentage(
                (
                  totals.assignmentsCompleted /
                  totals.assignmentsTotal
                ) * 100
              )
            : 0
        );


  /* =======================================================
     LESSON AND QUIZ COMPLETION
  ======================================================= */

  const lessonCompletion =
    totals.lessonsTotal
      ? clampStudentAnalyticsPercentage(
          (
            totals.lessonsCompleted /
            totals.lessonsTotal
          ) * 100
        )
      : 0;

  const quizCompletion =
    totals.quizzesTotal
      ? clampStudentAnalyticsPercentage(
          (
            totals.quizzesCompleted /
            totals.quizzesTotal
          ) * 100
        )
      : 0;


  /* =======================================================
     ATTENDANCE
  ======================================================= */

  const attendanceSuccessful =
    totals.attendancePresent +
    totals.attendanceLate +
    totals.attendanceExcused;

  const attendanceRate =
    totals.attendanceTotal
      ? clampStudentAnalyticsPercentage(
          (
            attendanceSuccessful /
            totals.attendanceTotal
          ) * 100
        )
      : 0;


  /* =======================================================
     OVERALL LEARNING SCORE
  ======================================================= */

  const metricValues =
    [
      assignmentCompletion,
      lessonCompletion,
      quizCompletion,
      attendanceRate,
      gradeSummary.average
    ]
      .filter(value =>
        value !== null &&
        value !== undefined &&
        Number.isFinite(
          Number(value)
        )
      );

  const overallScore =
    metricValues.length
      ? clampStudentAnalyticsPercentage(
          metricValues.reduce(
            (
              sum,
              value
            ) =>
              sum +
              Number(value),
            0
          ) /
          metricValues.length
        )
      : (
          totals.overallRecords
            ? clampStudentAnalyticsPercentage(
                totals.overallTotal /
                totals.overallRecords
              )
            : 0
        );

  const learningStatus =
    getStudentAnalyticsStatus(
      overallScore
    );


  /* =======================================================
     SUMMARY VALUES
  ======================================================= */

  setText(
    "overallProgress",
    `${overallScore}%`
  );

  setText(
    "studentCompletionRate",
    `${assignmentCompletion}%`
  );

  setText(
    "studentAttendanceRate",
    `${attendanceRate}%`
  );

  setText(
    "studentAverageGrade",
    gradeSummary.average === null
      ? "—"
      : `${gradeSummary.average}%`
  );

  setText(
    "overallProgressStatus",
    learningStatus.label
  );

  setText(
    "studentCompletionStatus",
    `${submittedAssignmentCount} of ${assignments.length} assignments submitted`
  );

  setText(
    "studentAttendanceStatus",
    totals.attendanceTotal
      ? `${attendanceSuccessful} of ${totals.attendanceTotal} recorded sessions`
      : "No attendance records yet"
  );

  setText(
    "studentAverageGradeStatus",
    gradeSummary.count
      ? `${gradeSummary.count} graded ${
          gradeSummary.count === 1
            ? "submission"
            : "submissions"
        }`
      : "No graded work yet"
  );


  /* =======================================================
     LEARNING HEALTH
  ======================================================= */

  setText(
    "studentLearningHealthScore",
    overallScore
  );

  setText(
    "studentLearningHealthMessage",
    learningStatus.message
  );

  const healthBar =
    $("studentLearningHealthBar");

  if (healthBar){
    healthBar.style.width =
      `${overallScore}%`;
  }

  const healthBadge =
    $("studentLearningHealthBadge");

  if (healthBadge){

    healthBadge.textContent =
      learningStatus.label;

    healthBadge.className =
      `student-learning-health-badge ${
        learningStatus.className
      }`;
  }


  /* =======================================================
     PERFORMANCE CARDS
  ======================================================= */

  const metrics =
    [
      {
        title:
          "Assignment completion",

        description:
          `${submittedAssignmentCount} submitted out of ${assignments.length}`,

        value:
          assignmentCompletion,

        className:
          assignmentCompletion >= 70
            ? "success"
            : assignmentCompletion >= 50
              ? "warning"
              : "danger"
      },

      {
        title:
          "Lesson progress",

        description:
          `${totals.lessonsCompleted} completed out of ${totals.lessonsTotal}`,

        value:
          lessonCompletion,

        className:
          lessonCompletion >= 70
            ? "success"
            : lessonCompletion >= 50
              ? "warning"
              : "danger"
      },

      {
        title:
          "Quiz completion",

        description:
          `${totals.quizzesCompleted} completed out of ${totals.quizzesTotal}`,

        value:
          quizCompletion,

        className:
          quizCompletion >= 70
            ? "success"
            : quizCompletion >= 50
              ? "warning"
              : "danger"
      },

      {
        title:
          "Attendance",

        description:
          totals.attendanceTotal
            ? `${attendanceSuccessful} successful records out of ${totals.attendanceTotal}`
            : "No attendance records available",

        value:
          attendanceRate,

        className:
          attendanceRate >= 80
            ? "success"
            : attendanceRate >= 60
              ? "warning"
              : "danger"
      }
    ];

  progressContainer.innerHTML =
    metrics
      .map(metric => `
        <article class="student-analytics-metric-card">

          <div class="student-analytics-metric-head">

            <div class="student-analytics-metric-copy">

              <strong>
                ${
                  escapeHtml(
                    metric.title
                  )
                }
              </strong>

              <span>
                ${
                  escapeHtml(
                    metric.description
                  )
                }
              </span>

            </div>

            <span class="student-analytics-metric-value">
              ${metric.value}%
            </span>

          </div>

          <div
            class="
              student-analytics-progress-track
              ${metric.className}
            "
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${metric.value}"
          >
            <span
              style="width:${metric.value}%;"
            ></span>
          </div>

        </article>
      `)
      .join("");


  /* =======================================================
     CLASS-BY-CLASS PROGRESS
  ======================================================= */

  if (!classRecords.length){

    classContainer.innerHTML = `
      <div class="student-analytics-empty">

        <i
          class="fa-solid fa-graduation-cap"
          aria-hidden="true"
        ></i>

        <span>
          Your class progress will appear after you enroll
          in a class.
        </span>

      </div>
    `;

  }else{

    classContainer.innerHTML =
      classRecords
        .map(item => {

          const classTitle =
            String(
              item.classItem?.title ||
              item.classItem?.name ||
              item.classItem?.subject ||
              "Class"
            ).trim();

          const teacherName =
            String(
              item.classItem?.teacherId?.name ||
              item.classItem?.teacherName ||
              "Teacher not assigned"
            ).trim();

          return `
            <article class="student-class-progress-item">

              <div class="student-class-progress-head">

                <div class="student-class-progress-copy">

                  <strong>
                    ${
                      escapeHtml(
                        classTitle
                      )
                    }
                  </strong>

                  <span>
                    ${
                      escapeHtml(
                        teacherName
                      )
                    }
                  </span>

                </div>

                <span class="student-class-progress-score">
                  ${item.overall}%
                </span>

              </div>

              <div
                class="student-analytics-progress-track"
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${item.overall}"
              >
                <span
                  style="width:${item.overall}%;"
                ></span>
              </div>

              <div class="student-class-progress-breakdown">

                <div class="student-class-progress-stat">

                  <span>
                    Lessons
                  </span>

                  <strong>
                    ${item.lessons.completed}/${item.lessons.total}
                  </strong>

                </div>

                <div class="student-class-progress-stat">

                  <span>
                    Assignments
                  </span>

                  <strong>
                    ${item.assignments.completed}/${item.assignments.total}
                  </strong>

                </div>

                <div class="student-class-progress-stat">

                  <span>
                    Quizzes
                  </span>

                  <strong>
                    ${item.quizzes.completed}/${item.quizzes.total}
                  </strong>

                </div>

                <div class="student-class-progress-stat">

                  <span>
                    Attendance
                  </span>

                  <strong>
                    ${item.attendance.percentage}%
                  </strong>

                </div>

              </div>

            </article>
          `;
        })
        .join("");
  }


  /* =======================================================
     RECENT TEACHER FEEDBACK
  ======================================================= */

  if (feedbackContainer){

    const feedbackItems =
      submissions
        .filter(submission =>
          String(
            submission?.feedback ||
            ""
          ).trim()
        )
        .sort(
          (
            first,
            second
          ) =>
            new Date(
              second.reviewedAt ||
              second.updatedAt ||
              second.createdAt ||
              0
            ) -
            new Date(
              first.reviewedAt ||
              first.updatedAt ||
              first.createdAt ||
              0
            )
        )
        .slice(
          0,
          5
        );

    if (!feedbackItems.length){

      feedbackContainer.innerHTML = `
        <div class="student-analytics-empty compact">

          <i
            class="fa-regular fa-message"
            aria-hidden="true"
          ></i>

          <span>
            No teacher feedback yet.
          </span>

        </div>
      `;

    }else{

      feedbackContainer.innerHTML =
        feedbackItems
          .map(submission => {

            const assignmentTitle =
              String(
                submission?.assignmentId?.title ||
                "Assignment review"
              ).trim();

            return `
              <article class="student-analytics-feedback-item">

                <strong>
                  ${
                    escapeHtml(
                      assignmentTitle
                    )
                  }
                </strong>

                <p>
                  ${
                    escapeHtml(
                      submission.feedback
                    )
                  }
                </p>

                <span>
                  ${
                    escapeHtml(
                      formatDate(
                        submission.reviewedAt ||
                        submission.updatedAt ||
                        submission.createdAt
                      )
                    )
                  }
                </span>

              </article>
            `;
          })
          .join("");
    }
  }


  /* =======================================================
     LEARNING WARNINGS
  ======================================================= */

  if (warningContainer){

    const warnings =
      [];

    if (
      assignments.length &&
      assignmentCompletion < 60
    ){
      warnings.push({
        icon:
          "fa-solid fa-list-check",

        title:
          "Assignments need attention",

        message:
          `${assignments.length - submittedAssignmentCount} assignments remain unsubmitted.`
      });
    }

    if (
      totals.attendanceTotal &&
      attendanceRate < 75
    ){
      warnings.push({
        icon:
          "fa-solid fa-calendar-xmark",

        title:
          "Attendance is below target",

        message:
          `${totals.attendanceAbsent} absence records have been recorded.`
      });
    }

    if (
      totals.lessonsTotal &&
      lessonCompletion < 50
    ){
      warnings.push({
        icon:
          "fa-solid fa-book-open",

        title:
          "Lesson progress is low",

        message:
          `${totals.lessonsTotal - totals.lessonsCompleted} lessons are still incomplete.`
      });
    }

    if (!warnings.length){

      warningContainer.innerHTML = `
        <div class="student-analytics-empty compact">

          <i
            class="fa-solid fa-circle-check"
            aria-hidden="true"
          ></i>

          <span>
            No urgent learning risks detected.
          </span>

        </div>
      `;

    }else{

      warningContainer.innerHTML =
        warnings
          .map(warning => `
            <article class="student-analytics-warning-item">

              <span class="student-analytics-warning-icon">

                <i
                  class="${
                    escapeHtml(
                      warning.icon
                    )
                  }"
                  aria-hidden="true"
                ></i>

              </span>

              <div>

                <strong>
                  ${
                    escapeHtml(
                      warning.title
                    )
                  }
                </strong>

                <p>
                  ${
                    escapeHtml(
                      warning.message
                    )
                  }
                </p>

              </div>

            </article>
          `)
          .join("");
    }
  }
}

function renderAttendance(){

  const container =
    $("attendanceList");

  if (!container){
    return;
  }

  const classRecords =
    getStudentAnalyticsClassRecords();

  const attendanceRecords =
    classRecords
      .filter(item =>
        item.attendance.total > 0
      )
      .sort(
        (
          first,
          second
        ) =>
          second.attendance.percentage -
          first.attendance.percentage
      );

  if (!attendanceRecords.length){

    container.innerHTML = `
      <div class="student-analytics-empty">

        <i
          class="fa-regular fa-calendar-check"
          aria-hidden="true"
        ></i>

        <span>
          No attendance records are available yet.
          Attendance will appear after your teachers begin
          marking class sessions.
        </span>

      </div>
    `;

    return;
  }

  container.innerHTML =
    attendanceRecords
      .map(item => {

        const classTitle =
          String(
            item.classItem?.title ||
            item.classItem?.name ||
            item.classItem?.subject ||
            "Class"
          ).trim();

        const teacherName =
          String(
            item.classItem?.teacherId?.name ||
            item.classItem?.teacherName ||
            "Teacher not assigned"
          ).trim();

        const attendance =
          item.attendance;

        const successful =
          attendance.present +
          attendance.late +
          attendance.excused;

        const status =
          attendance.percentage >= 85
            ? {
                label:
                  "Excellent",

                className:
                  "success"
              }
            : attendance.percentage >= 75
              ? {
                  label:
                    "On track",

                  className:
                    "primary"
                }
              : attendance.percentage >= 60
                ? {
                    label:
                      "Needs attention",

                    className:
                      "warning"
                  }
                : {
                    label:
                      "At risk",

                    className:
                      "danger"
                  };

        return `
          <article class="student-attendance-card">

            <div class="student-attendance-card-head">

              <div class="student-attendance-class">

                <span class="student-attendance-class-icon">

                  <i
                    class="fa-solid fa-calendar-check"
                    aria-hidden="true"
                  ></i>

                </span>

                <div>

                  <strong>
                    ${
                      escapeHtml(
                        classTitle
                      )
                    }
                  </strong>

                  <span>
                    ${
                      escapeHtml(
                        teacherName
                      )
                    }
                  </span>

                </div>

              </div>

              <span
                class="
                  chip
                  ${status.className}
                "
              >
                ${
                  escapeHtml(
                    status.label
                  )
                }
              </span>

            </div>


            <div class="student-attendance-main">

              <div class="student-attendance-percentage">

                <strong>
                  ${attendance.percentage}%
                </strong>

                <span>
                  Attendance rate
                </span>

              </div>

              <div class="student-attendance-progress">

                <div
                  class="student-analytics-progress-track ${
                    status.className === "primary"
                      ? ""
                      : status.className
                  }"
                  role="progressbar"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow="${attendance.percentage}"
                >
                  <span
                    style="width:${attendance.percentage}%;"
                  ></span>
                </div>

                <small>
                  ${successful} successful records out of
                  ${attendance.total} sessions
                </small>

              </div>

            </div>


            <div class="student-attendance-breakdown">

              <div class="student-attendance-stat present">

                <span>
                  Present
                </span>

                <strong>
                  ${attendance.present}
                </strong>

              </div>

              <div class="student-attendance-stat late">

                <span>
                  Late
                </span>

                <strong>
                  ${attendance.late}
                </strong>

              </div>

              <div class="student-attendance-stat absent">

                <span>
                  Absent
                </span>

                <strong>
                  ${attendance.absent}
                </strong>

              </div>

              <div class="student-attendance-stat excused">

                <span>
                  Excused
                </span>

                <strong>
                  ${attendance.excused}
                </strong>

              </div>

            </div>

          </article>
        `;
      })
      .join("");
}


/* =========================================================
   STUDENT RESOURCE CENTER STATE
========================================================= */

const STUDENT_RESOURCE_VIEW_STORAGE_KEY =
  "aiftStudentResourceView";

const STUDENT_RESOURCE_SAVED_STORAGE_KEY =
  "aiftStudentSavedResources";

const STUDENT_RESOURCE_RECENT_STORAGE_KEY =
  "aiftStudentRecentlyOpenedResources";


let studentResourceView =
  localStorage.getItem(
    STUDENT_RESOURCE_VIEW_STORAGE_KEY
  ) === "list"
    ? "list"
    : "grid";


let studentResourceActiveCategory =
  "all";


let studentResourceControlsBound =
  false;


function getStudentSavedResourceIds(){

  try{

    const parsed =
      JSON.parse(
        localStorage.getItem(
          STUDENT_RESOURCE_SAVED_STORAGE_KEY
        ) ||
        "[]"
      );

    return new Set(
      Array.isArray(parsed)
        ? parsed.map(value =>
            String(value)
          )
        : []
    );

  }catch(error){

    console.warn(
      "Saved resource storage could not be read:",
      error
    );

    return new Set();

  }

}


function saveStudentResourceIds(
  resourceIds
){

  localStorage.setItem(
    STUDENT_RESOURCE_SAVED_STORAGE_KEY,
    JSON.stringify(
      Array.from(
        resourceIds
      )
    )
  );

}


function getStudentRecentlyOpenedResources(){

  try{

    const parsed =
      JSON.parse(
        localStorage.getItem(
          STUDENT_RESOURCE_RECENT_STORAGE_KEY
        ) ||
        "[]"
      );

    return Array.isArray(parsed)
      ? parsed
      : [];

  }catch(error){

    console.warn(
      "Recent resource storage could not be read:",
      error
    );

    return [];

  }

}


function saveStudentRecentlyOpenedResources(
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
    initSearch();

    bindStudentStudioDelegatedActions();

    await loadAll();

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

    initSocket();
  }
);
