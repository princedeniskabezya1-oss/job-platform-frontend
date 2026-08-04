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
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.users)) return value.users;
  if (Array.isArray(value?.classes)) return value.classes;
  if (Array.isArray(value?.assignments)) return value.assignments;
  if (Array.isArray(value?.submissions)) return value.submissions;
  if (Array.isArray(value?.schedules)) return value.schedules;
  if (Array.isArray(value?.posts)) return value.posts;
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
      renderSchedule();
      renderCalendar();
      break;

    case "progress":
      renderProgress();
      renderAttendance();
      break;

    case "resources":
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

async function apiSend(path,method,body){
  const res = await fetch(API + path,{
    method,
    headers:authHeaders({
      "Content-Type":"application/json"
    }),
    body:JSON.stringify(body || {})
  });

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
  return (
    state.me?.schoolId?._id ||
    state.me?.schoolId ||
    state.me?.linkedSchoolId?._id ||
    state.me?.linkedSchoolId ||
    state.me?.companyId?._id ||
    state.me?.companyId ||
    ""
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
  unread
] = await Promise.all([
      apiGet(`/api/classes?schoolId=${encodeURIComponent(schoolId)}`, []),
      apiGet(`/api/assignments?schoolId=${encodeURIComponent(schoolId)}`, []),
      apiGet(`/api/submissions?schoolId=${encodeURIComponent(schoolId)}&studentId=${encodeURIComponent(studentId)}`, []),
      apiGet(`/api/schedules?schoolId=${encodeURIComponent(schoolId)}`, []),
apiGet("/api/posts", []),
apiGet(`/api/school-updates?schoolId=${encodeURIComponent(schoolId)}`, []),
apiGet("/api/notifications/unread-count", { count:0 })
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
      asArray(schoolUpdates);

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

function renderStudentCertificates(){
  showAlert(
    "info",
    "The Certificates workspace will be added in the next production module."
  );
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

function renderSchedule(){
  const container = $("scheduleList");
  if (!container) return;

  const classIds = getStudentClasses().map(cls => String(cls._id));

  const schedules = state.schedules
    .filter(item => {
      const classId = String(item.classId?._id || item.classId || "");

      return !classId || classIds.includes(classId);
    })
    .sort((a,b) => new Date(a.date || 0) - new Date(b.date || 0));

  if (!schedules.length){
    container.innerHTML = `<div class="empty">No schedules yet.</div>`;
    return;
  }

  container.innerHTML = schedules.map(item => `
    <article
  class="schedule-card"
  data-schedule-id="${escapeHtml(
    normalizeId(item._id)
  )}"
>
      <div class="item-head">
        <div>
          <h3 class="item-title">${escapeHtml(item.title || item.classId?.title || "Class Schedule")}</h3>
          <div class="item-sub">${formatDate(item.date)} • ${escapeHtml(item.time || item.startTime || "No time")}</div>
        </div>

        <span class="chip primary">Schedule</span>
      </div>

      <p class="item-desc">${escapeHtml(item.notes || "Class schedule details.")}</p>

      <div class="meta-row">
        ${item.meetingLink ? `<a class="chip success" href="${item.meetingLink}" target="_blank">Join Meeting</a>` : ""}
        ${item.teacherId?.name ? `<span class="chip">${escapeHtml(item.teacherId.name)}</span>` : ""}
      </div>
    </article>
  `).join("");
}

function renderCalendar(){
  const container = $("calendarGrid");
  if (!container) return;

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const schedules = state.schedules || [];

  container.innerHTML = days.map(day => {
    const items = schedules.slice(0,2);

    return `
      <div class="calendar-day">
        <strong>${day}</strong>
        ${
          items.length
            ? items.map(item => `<span>${escapeHtml(item.title || item.classId?.title || "Class")}</span>`).join("")
            : `<span>No class</span>`
        }
      </div>
    `;
  }).join("");
}
function renderProgress(){
  const container = $("progressList");
  if (!container) return;

  const submissions = getStudentSubmissions();

  const reviewed = submissions.filter(sub =>
    sub.grade ||
    sub.feedback ||
    ["reviewed","returned"].includes(String(sub.status || "").toLowerCase())
  );

  container.innerHTML = `
    <article class="progress-card">
      <div class="item-head">
        <div>
          <h3 class="item-title">Assignment Completion</h3>
          <div class="item-sub">Based on submitted assignments</div>
        </div>
        <span class="chip primary">${state.metrics.completion}%</span>
      </div>

      <p class="item-desc">
        You have submitted ${getStudentSubmissions().length} out of ${getStudentAssignments().length} assignments.
      </p>
    </article>

    <article class="progress-card">
      <div class="item-head">
        <div>
          <h3 class="item-title">Teacher Feedback</h3>
          <div class="item-sub">Reviewed work and grades</div>
        </div>
        <span class="chip success">${reviewed.length} Reviewed</span>
      </div>

      <p class="item-desc">
        Your teacher feedback and grades will appear here after review.
      </p>
    </article>

    <article class="progress-card">
      <div class="item-head">
        <div>
          <h3 class="item-title">Overall Learning Score</h3>
          <div class="item-sub">Completion, engagement, attendance, and productivity</div>
        </div>
        <span class="chip warning">${state.metrics.overall}%</span>
      </div>

      <p class="item-desc">
        This score is calculated from real class activity and will become more accurate as you use the portal.
      </p>
    </article>
  `;
}

function renderAttendance(){
  const container = $("attendanceList");
  if (!container) return;

  const schedules = state.schedules || [];

  if (!schedules.length){
    container.innerHTML = `<div class="empty">Attendance tracking will appear after class schedules are active.</div>`;
    return;
  }

  container.innerHTML = schedules.slice(0,8).map(item => `
    <div class="attendance-item">
      <div class="attendance-left">
        <div class="attendance-icon">
          <svg viewBox="0 0 24 24">
            <path d="M8 7V3"></path>
            <path d="M16 7V3"></path>
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <path d="M3 11h18"></path>
          </svg>
        </div>

        <div>
          <div class="attendance-title">${escapeHtml(item.title || item.classId?.title || "Class")}</div>
          <div class="attendance-sub">${formatDate(item.date)} • ${escapeHtml(item.time || item.startTime || "No time")}</div>
        </div>
      </div>

      <span class="chip primary">Scheduled</span>
    </div>
  `).join("");
}

function renderResources(){
  // Static resources are already rendered in HTML for now.
  // Later we can connect this to /api/resources or class materials.
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

const MAX_ASSIGNMENT_UPLOAD_FILES =
  10;

const MAX_ASSIGNMENT_FILE_SIZE =
  50 * 1024 * 1024;

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
        fileUrl
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
