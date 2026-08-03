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

function showAlert(type,message){
  const box = $("pageAlert");

  if (!box){
    alert(message);
    return;
  }

  box.className = "alert " + type;
  box.innerText = message;
  box.style.display = "block";

  setTimeout(() => {
    box.style.display = "none";
  }, 3500);
}

function openModal(id){
  $(id)?.classList.add("show");
}

function closeModal(id){
  $(id)?.classList.remove("show");
}

/* =========================================================
   STUDENT STUDIO NAVIGATION CONTROLLER
========================================================= */

const STUDENT_STUDIO_PAGES = Object.freeze({
  overview:{
    title:"Dashboard",
    description:"Your learning workspace"
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
    continue:"overview",
    calendar:"schedule",
    analytics:"progress"
  };

  const normalized = aliases[requested] || requested;

  return STUDENT_STUDIO_PAGES[normalized]
    ? normalized
    : "overview";
}

function setStudentStudioRouteContent(page){
  const config =
    STUDENT_STUDIO_PAGES[page] ||
    STUDENT_STUDIO_PAGES.overview;

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

  $("refreshWorkspaceButton")
    ?.addEventListener(
      "click",
      async () => {
        const button =
          $("refreshWorkspaceButton");

        if (button){
          button.disabled = true;
          button.classList.add(
            "is-loading"
          );
        }

        try{
          await loadAll();

          showAlert(
            "success",
            "Student Studio refreshed."
          );
        }finally{
          if (button){
            button.disabled = false;
            button.classList.remove(
              "is-loading"
            );
          }
        }
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

    state.classes = asArray(classes);
    state.assignments = asArray(assignments);
    state.submissions = asArray(submissions);
    state.schedules = asArray(schedules);
state.posts = asArray(posts);
state.schoolUpdates = asArray(schoolUpdates);
state.unread = Number(unread?.count || unread?.unread || 0);

    state.teachers = getTeacherMap();

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

  }catch(err){
    console.error(err);
    showAlert("error","Student portal failed to load.");
  }
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

function bindStudentStudioDelegatedActions(){
  document.addEventListener(
    "click",
    event => {
      const pageButton =
        event.target.closest(
          "[data-open-studio-page]"
        );

      if(pageButton){
        openStudentStudioPage(
          pageButton.dataset.openStudioPage
        );

        return;
      }

      const navigationButton =
        event.target.closest(
          ".student-nav-btn[data-page]"
        );

      if(navigationButton){
        openStudentStudioPage(
          navigationButton.dataset.page
        );
      }
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

function renderClasses(){
  const container = $("classesList");
  if (!container) return;

  const classes = getStudentClasses();

  if (!classes.length){
    container.innerHTML = `<div class="empty">No classes assigned yet.</div>`;
    return;
  }

  container.innerHTML = classes.map(cls => {
    const teacher =
      cls.teacherId?.name ||
      cls.teacherName ||
      "Teacher not assigned";

    return `
      <article class="class-card">
        <div
          class="class-cover"
          style="background-image:url('${cls.coverImage || CLASS_FALLBACK}')"
        ></div>

        <div class="item-head">
          <div>
            <h3 class="item-title">${escapeHtml(cls.title || "Class")}</h3>
            <div class="item-sub">${escapeHtml(cls.subject || "No subject")}</div>
          </div>

          <span class="chip primary">Class</span>
        </div>

        <p class="item-desc">${escapeHtml(cls.description || "No class description added.")}</p>

        <div class="meta-row">
          <span class="chip">${escapeHtml(teacher)}</span>
          ${cls.schedule ? `<span class="chip">${escapeHtml(cls.schedule)}</span>` : ""}
          ${cls.classCode ? `<span class="chip success">${escapeHtml(cls.classCode)}</span>` : ""}
        </div>

        <div class="card-actions">
          ${
            cls.meetingLink
              ? `<a class="primary-btn" href="${cls.meetingLink}" target="_blank">Join Class</a>`
              : ""
          }
        </div>
      </article>
    `;
  }).join("");
}

function renderAssignments(){
  const container = $("assignmentsList");
  if (!container) return;

  const assignments = getStudentAssignments()
    .sort((a,b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));

  if (!assignments.length){
    container.innerHTML = `<div class="empty">No assignments yet.</div>`;
    return;
  }

  container.innerHTML = assignments.map(item => {
    const submission = getSubmissionForAssignment(item._id);

    return `
      <article class="assignment-card">
        <div class="item-head">
          <div>
            <h3 class="item-title">${escapeHtml(item.title || "Assignment")}</h3>
            <div class="item-sub">Due ${formatDate(item.dueDate || item.deadline)}</div>
          </div>

          <span class="chip ${submission ? "success" : "warning"}">
            ${submission ? "Submitted" : "Pending"}
          </span>
        </div>

        <p class="item-desc">${escapeHtml(item.instructions || item.description || "No instructions added.")}</p>

        <div class="meta-row">
          ${item.attachmentUrl ? `<a class="chip primary" href="${item.attachmentUrl}" target="_blank">Attachment</a>` : ""}
          ${
            submission?.grade
              ? `<span class="chip success">Grade: ${escapeHtml(submission.grade)}</span>`
              : ""
          }
          ${
            submission?.feedback
              ? `<span class="chip">Feedback added</span>`
              : ""
          }
        </div>

        <div class="card-actions">
          <button class="primary-btn" onclick="openSubmissionModal('${item._id}')">
            ${submission ? "Update Submission" : "Submit Work"}
          </button>
        </div>
      </article>
    `;
  }).join("");
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
    <article class="schedule-card">
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

function hydrateSubmissionSelect(){
  const select = $("submissionAssignmentId");
  if (!select) return;

  const assignments = getStudentAssignments();

  select.innerHTML =
    `<option value="">Select assignment</option>` +
    assignments.map(item => `
      <option value="${item._id}">
        ${escapeHtml(item.title || "Assignment")}
      </option>
    `).join("");
}

function openSubmissionModal(assignmentId = ""){
  if ($("submissionAssignmentId")) {
    $("submissionAssignmentId").value = assignmentId;
  }

  const oldSubmission = assignmentId
    ? getSubmissionForAssignment(assignmentId)
    : null;

  if ($("submissionText")) {
    $("submissionText").value = oldSubmission?.text || "";
  }

  if ($("submissionFile")) {
    $("submissionFile").value = oldSubmission?.fileUrl || "";
  }

  openModal("submissionModal");
}

async function submitAssignmentWork(){
  const assignmentId = $("submissionAssignmentId")?.value;
  const text = $("submissionText")?.value.trim();
  const fileUrl = $("submissionFile")?.value.trim();

  if (!assignmentId){
    return showAlert("error","Please select an assignment.");
  }

  if (!text && !fileUrl){
    return showAlert("error","Write your answer or add a file URL.");
  }

  try{
    await apiSend("/api/submissions","POST",{
      assignmentId,
      text,
      fileUrl
    });

    closeModal("submissionModal");

    showAlert("success","Assignment submitted.");

    await loadAll();

  }catch(err){
    showAlert("error",err.message || "Submission failed.");
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

function initSearch(){
  const input = $("globalSearch");

  if (!input) return;

  input.addEventListener("input",() => {
    const q = input.value.trim().toLowerCase();

    document
      .querySelectorAll(
        ".class-card,.assignment-card,.schedule-card,.announcement-card,.grade-card,.progress-card,.resource-card,.attendance-item"
      )
      .forEach(card => {
        card.style.display =
          !q ||
          card.innerText.toLowerCase().includes(q)
            ? ""
            : "none";
      });
  });
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
