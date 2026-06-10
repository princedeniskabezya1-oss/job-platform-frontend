/* =====================================================
   AIFT ADMIN CONTROL CENTER
   PRODUCTION ADMIN.JS
   PART 1 / 20 — COMPLETE CORE
===================================================== */

const API_BASE = "https://backend-1-9b6f.onrender.com";
const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const adminState = {
  token: "",
  role: "",
  me: null,
  currentSection: "overview",
  loading: false,
  selectedItems: new Set(),
  confirmAction: null,

  users: [],
  jobs: [],
  applications: [],
  schools: [],
  teachers: [],
  students: [],
  classes: [],
  assignments: [],
  attendance: [],
  posts: [],
  reports: [],
  meetings: [],
  callLogs: [],
  payments: [],
  auditLogs: [],

  filters: {
    users: { search: "", role: "all", status: "all" },
    verification: { search: "", role: "all", status: "pending" },
    jobs: { search: "", status: "all", type: "all" },
    applications: { search: "", status: "all", type: "all" },
    schools: { search: "", status: "all", verified: "all" },
    content: { search: "", status: "all", type: "all" },
    meetings: { search: "", status: "all", type: "all" },
    reports: { search: "", status: "open", type: "all" },
    payments: { search: "", status: "all" }
  },

  settings: {
    maintenanceMode: false,
    allowRegistration: true,
    allowMeetings: true,
    allowMessaging: true
  }
};

const ADMIN_SECTIONS = {
  overview: {
    title: "Overview",
    subtitle: "Monitor users, jobs, schools, reports, and platform activity.",
    loader: "loadOverview"
  },
  users: {
    title: "Users",
    subtitle: "Search, verify, suspend, activate, and manage platform users.",
    loader: "loadAdminUsers"
  },
  verification: {
    title: "Verification Center",
    subtitle: "Review employers, schools, recruiters, and teachers.",
    loader: "loadVerificationCenter"
  },
  jobs: {
    title: "Jobs",
    subtitle: "Approve, suspend, reject, delete, and review job posts.",
    loader: "loadAdminJobs"
  },
  applications: {
    title: "Applications",
    subtitle: "Review job and internship applications.",
    loader: "loadAdminApplications"
  },
  schools: {
    title: "Schools & LMS",
    subtitle: "Manage schools, teachers, students, classes, assignments, and attendance.",
    loader: "loadAdminSchools"
  },
  content: {
    title: "Moderation",
    subtitle: "Review posts, comments, reports, and unsafe content.",
    loader: "loadContentModeration"
  },
  meetings: {
    title: "Meetings & Calls",
    subtitle: "Monitor meetings, call logs, missed calls, and failed sessions.",
    loader: "loadAdminMeetings"
  },
  reports: {
    title: "Reports & Support",
    subtitle: "Review, resolve, dismiss, or delete reports.",
    loader: "loadReportsCenter"
  },
  payments: {
    title: "Payments",
    subtitle: "Monitor payments, subscriptions, and revenue records.",
    loader: "loadPaymentsCenter"
  },
  settings: {
    title: "Settings",
    subtitle: "Control maintenance mode, registration, meetings, and messaging.",
    loader: "loadPlatformSettings"
  },
  audit: {
    title: "Audit Logs",
    subtitle: "Track admin actions and system activity.",
    loader: "loadAuditLogs"
  }
};

function getAdminToken(){
  return localStorage.getItem("adminToken") || localStorage.getItem("token") || "";
}

function getUserRole(){
  return String(localStorage.getItem("role") || "").toLowerCase();
}

function getId(item){
  return item?._id || item?.id || item?.userId || item?.jobId || item?.applicationId || "";
}

function esc(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(value){
  return String(value || "").toLowerCase().trim();
}

function formatDate(value){
  if(!value) return "-";
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function formatDateTime(value){
  if(!value) return "-";
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function readableRole(role){
  const map = {
    admin: "Admin",
    employer: "Employer",
    agent: "Recruiter",
    talent: "Job Seeker",
    school: "School",
    teacher: "Teacher",
    student: "Student"
  };

  return map[normalize(role)] || "Member";
}

function isVerified(item){
  return item?.aiftVerified === true || item?.isVerified === true || item?.verified === true;
}

function getDisplayName(item){
  return (
    item?.companyName ||
    item?.schoolName ||
    item?.name ||
    item?.fullName ||
    item?.title ||
    item?.email ||
    "AIFT Record"
  );
}

function getAvatar(item){
  return item?.profileImage || item?.avatar || item?.logo || item?.photo || DEFAULT_AVATAR;
}

function showAdminLoader(){
  document.getElementById("adminLoader")?.classList.remove("hidden");
}

function hideAdminLoader(){
  document.getElementById("adminLoader")?.classList.add("hidden");
}

function adminToast(message = "Done"){
  const toast = document.getElementById("adminToast");
  if(!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function addAuditLog(action, target = "", details = {}){
  adminState.auditLogs.unshift({
    id: Date.now() + "-" + Math.random().toString(16).slice(2),
    action,
    target,
    details,
    admin: adminState.me?.email || "admin",
    createdAt: new Date().toISOString()
  });

  localStorage.setItem("aiftAdminAuditLogs", JSON.stringify(adminState.auditLogs.slice(0, 300)));
}

function loadLocalAuditLogs(){
  try{
    adminState.auditLogs = JSON.parse(localStorage.getItem("aiftAdminAuditLogs") || "[]");
  }catch{
    adminState.auditLogs = [];
  }
}

function adminHeaders(extra = {}){
  return {
    ...(extra || {}),
    ...(adminState.token ? { Authorization: "Bearer " + adminState.token } : {})
  };
}

async function adminRequest(endpoint, options = {}){
  const response = await fetch(API_BASE + endpoint, {
    ...options,
    headers: adminHeaders(options.headers || {})
  });

  const data = await response.json().catch(() => ({}));

  if(response.status === 401 || response.status === 403){
    adminLogout(true);
    throw new Error("Admin session expired. Please login again.");
  }

  if(!response.ok){
    throw new Error(data?.message || data?.error || "Request failed.");
  }

  return data;
}

async function adminJSON(endpoint, method = "POST", payload = {}){
  return adminRequest(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

async function adminPatchManyPossible(endpoints, payload){
  let lastError = null;

  for(const endpoint of endpoints){
    try{
      return await adminJSON(endpoint, "PATCH", payload);
    }catch(error){
      lastError = error;
    }
  }

  throw lastError || new Error("No working endpoint found.");
}

function adminLogout(silent = false){
  ["adminToken", "token", "role", "userId"].forEach(key => localStorage.removeItem(key));

  if(!silent) adminToast("Logged out");

  setTimeout(() => {
    window.location.href = "login.html";
  }, silent ? 0 : 500);
}

function openAdminConfirm(title, text, callback){
  document.getElementById("adminConfirmTitle").textContent = title || "Confirm action";
  document.getElementById("adminConfirmText").textContent = text || "Are you sure?";
  document.getElementById("adminConfirmModal")?.classList.remove("hidden");
  document.getElementById("adminBackdrop")?.classList.remove("hidden");
  adminState.confirmAction = callback;
}

function closeAdminConfirm(){
  document.getElementById("adminConfirmModal")?.classList.add("hidden");
  document.getElementById("adminBackdrop")?.classList.add("hidden");
  adminState.confirmAction = null;
}

function openAdminFormModal(title, subtitle, html){
  document.getElementById("adminFormTitle").textContent = title || "Admin Action";
  document.getElementById("adminFormSubtitle").textContent = subtitle || "";
  document.getElementById("adminFormBody").innerHTML = html || "";
  document.getElementById("adminFormModal")?.classList.remove("hidden");
  document.getElementById("adminBackdrop")?.classList.remove("hidden");
}

function closeAdminFormModal(){
  document.getElementById("adminFormModal")?.classList.add("hidden");
  document.getElementById("adminBackdrop")?.classList.add("hidden");
}

function openAdminReviewModal(title, subtitle, html, actionsHtml = ""){
  document.getElementById("adminReviewTitle").textContent = title || "Review Details";
  document.getElementById("adminReviewSubtitle").textContent = subtitle || "";
  document.getElementById("adminReviewBody").innerHTML = html || "";
  document.getElementById("adminReviewActions").innerHTML = actionsHtml || "";
  document.getElementById("adminReviewModal")?.classList.remove("hidden");
  document.getElementById("adminBackdrop")?.classList.remove("hidden");
}

function closeAdminReviewModal(){
  document.getElementById("adminReviewModal")?.classList.add("hidden");
  document.getElementById("adminBackdrop")?.classList.add("hidden");
}

function closeAdminBulkModal(){
  document.getElementById("adminBulkModal")?.classList.add("hidden");
  document.getElementById("adminBackdrop")?.classList.add("hidden");
}

function openAdminDrawer(title, subtitle, html, footer = ""){
  document.getElementById("adminDrawerTitle").textContent = title || "Details";
  document.getElementById("adminDrawerSubtitle").textContent = subtitle || "";
  document.getElementById("adminDrawerBody").innerHTML = html || "";
  document.getElementById("adminDrawerFooter").innerHTML = footer || "";
  document.getElementById("adminDrawer")?.classList.remove("hidden");
  document.getElementById("adminBackdrop")?.classList.remove("hidden");
}

function closeAdminDrawer(){
  document.getElementById("adminDrawer")?.classList.add("hidden");
  document.getElementById("adminBackdrop")?.classList.add("hidden");
  adminState.drawerData = null;
}

function closeAllAdminOverlays(){
  closeAdminConfirm();
  closeAdminFormModal();
  closeAdminReviewModal();
  closeAdminBulkModal();
  closeAdminDrawer();
  closeAdminSidebar();
}

function toggleAdminSidebar(force){
  const sidebar = document.getElementById("adminSidebar");
  const backdrop = document.getElementById("adminBackdrop");
  if(!sidebar) return;

  const shouldOpen =
    typeof force === "boolean"
      ? force
      : !sidebar.classList.contains("show");

  sidebar.classList.toggle("show", shouldOpen);

  if(backdrop){
    backdrop.classList.toggle("hidden", !shouldOpen);
  }
}

function closeAdminSidebar(){
  toggleAdminSidebar(false);
}

function setAdminSectionTitle(section){
  const item = ADMIN_SECTIONS[section] || ADMIN_SECTIONS.overview;

  const title = document.getElementById("adminPageTitle");
  const subtitle = document.getElementById("adminPageSubtitle");
  const badge = document.getElementById("adminSectionBadge");

  if(title) title.textContent = item.title || "Overview";
  if(subtitle) subtitle.textContent = item.subtitle || "Monitor and manage AIFT.";
  if(badge) badge.textContent = "Control Center";
}

function setActiveAdminNav(section, button = null){
  document.querySelectorAll(".admin-nav button").forEach(btn => {
    btn.classList.toggle("active", button ? btn === button : btn.dataset.section === section);
  });
}

function switchAdminSection(section, button = null){
  const config = ADMIN_SECTIONS[section];

  if(!config){
    adminToast("This admin section is not available.");
    return;
  }

  adminState.currentSection = section;

  document.querySelectorAll(".admin-section").forEach(el => el.classList.add("hidden"));
  document.getElementById(section + "Section")?.classList.remove("hidden");

  setAdminSectionTitle(section);
  setActiveAdminNav(section, button);
  toggleAdminSidebar(false);

  const globalSearch = document.getElementById("adminGlobalSearch");
  if(globalSearch) globalSearch.value = "";

  const loader = window[config.loader];

  if(typeof loader === "function"){
    loader();
  }else{
    adminToast(config.title + " is not connected yet.");
  }
}

async function initAdmin(){
  try{
    showAdminLoader();

    adminState.token = getAdminToken();
    adminState.role = getUserRole();
    loadLocalAuditLogs();

    try{
      const savedSettings = JSON.parse(localStorage.getItem("aiftAdminSettings") || "{}");
      adminState.settings = { ...adminState.settings, ...savedSettings };
    }catch{}

    if(!adminState.token || adminState.role !== "admin"){
      adminLogout(true);
      return;
    }

    const meData = await adminRequest("/api/users/me");
    adminState.me = meData.user || meData;

    if(normalize(adminState.me?.role) !== "admin"){
      adminToast("Admin access only.");
      setTimeout(() => window.location.href = "home.html", 800);
      return;
    }

    localStorage.setItem("adminToken", adminState.token);
    localStorage.setItem("token", adminState.token);
    localStorage.setItem("role", "admin");
    localStorage.setItem("userId", getId(adminState.me));

    document.getElementById("adminMiniName").textContent = adminState.me.name || "AIFT Admin";
    document.getElementById("adminMiniRole").textContent = "Admin";
    document.getElementById("adminMiniAvatar").src = getAvatar(adminState.me);

    setAdminSectionTitle("overview");
    setActiveAdminNav("overview");

    addAuditLog("Admin login", adminState.me.email || "admin");
    await runHealthCheck();
    await loadOverview();

  }catch(error){
    console.error("Admin init failed:", error);
    adminToast(error.message || "Unable to load admin panel.");
  }finally{
    hideAdminLoader();
  }
}

document.addEventListener("click", event => {
  if(event.target?.id === "adminConfirmBtn"){
    const action = adminState.confirmAction;
    closeAdminConfirm();
    if(typeof action === "function") action();
  }
});

document.addEventListener("keydown", event => {
  if(event.key === "Escape"){
    closeAllAdminOverlays();
  }
});

/* =====================================================
   PART 2 / 20 — FETCHERS, HEALTH CHECK, REFRESH, SEARCH
===================================================== */

function extractArray(data, keys = []){
  if(Array.isArray(data)) return data;

  for(const key of keys){
    if(Array.isArray(data?.[key])) return data[key];
  }

  if(Array.isArray(data?.data)) return data.data;
  if(Array.isArray(data?.items)) return data.items;
  if(Array.isArray(data?.results)) return data.results;

  return [];
}

async function tryAdminEndpoints(endpoints, keys = []){
  let lastError = null;

  for(const endpoint of endpoints){
    try{
      const data = await adminRequest(endpoint);
      return extractArray(data, keys);
    }catch(error){
      lastError = error;
      console.warn("Endpoint failed:", endpoint, error.message);
    }
  }

  console.warn("All endpoints failed:", endpoints, lastError?.message);
  return [];
}

async function fetchAdminUsers(){
  return tryAdminEndpoints(
    [
      "/api/users",
      "/api/admin/users"
    ],
    ["users"]
  );
}

async function fetchAdminJobs(){
  return tryAdminEndpoints(
    [
      "/api/jobs/admin/all",
      "/api/admin/jobs",
      "/api/jobs"
    ],
    ["jobs"]
  );
}

async function fetchAdminApplications(){
  return tryAdminEndpoints(
    [
      "/api/applications",
      "/api/admin/applications"
    ],
    ["applications"]
  );
}

async function fetchAdminPosts(){
  return tryAdminEndpoints(
    [
      "/api/posts",
      "/api/admin/posts"
    ],
    ["posts"]
  );
}

async function fetchAdminReports(){
  return tryAdminEndpoints(
    [
      "/api/admin/reports",
      "/api/reports",
      "/api/support/reports"
    ],
    ["reports"]
  );
}

async function fetchAdminMeetings(){
  return tryAdminEndpoints(
    [
      "/api/meetings",
      "/api/admin/meetings",
      "/api/meeting-logs",
      "/api/admin/meeting-logs"
    ],
    ["meetings", "logs"]
  );
}

async function fetchAdminCallLogs(){
  return tryAdminEndpoints(
    [
      "/api/call-logs",
      "/api/admin/call-logs",
      "/api/calls",
      "/api/admin/calls"
    ],
    ["callLogs", "calls", "logs"]
  );
}

async function fetchAdminPayments(){
  return tryAdminEndpoints(
    [
      "/api/payments",
      "/api/admin/payments",
      "/api/subscriptions",
      "/api/admin/subscriptions"
    ],
    ["payments", "subscriptions"]
  );
}

async function fetchAdminClasses(){
  return tryAdminEndpoints(
    [
      "/api/classes",
      "/api/admin/classes"
    ],
    ["classes"]
  );
}

async function fetchAdminAssignments(){
  return tryAdminEndpoints(
    [
      "/api/assignments",
      "/api/admin/assignments"
    ],
    ["assignments"]
  );
}

async function fetchAdminAttendance(){
  return tryAdminEndpoints(
    [
      "/api/attendance",
      "/api/admin/attendance"
    ],
    ["attendance", "records"]
  );
}

function splitSchoolUsers(){
  adminState.schools = adminState.users.filter(user => normalize(user.role) === "school");
  adminState.teachers = adminState.users.filter(user => normalize(user.role) === "teacher");
  adminState.students = adminState.users.filter(user => normalize(user.role) === "student");
}

async function refreshCoreData(){
  const [
    users,
    jobs,
    applications,
    posts,
    reports,
    meetings,
    callLogs,
    payments,
    classes,
    assignments,
    attendance
  ] = await Promise.allSettled([
    fetchAdminUsers(),
    fetchAdminJobs(),
    fetchAdminApplications(),
    fetchAdminPosts(),
    fetchAdminReports(),
    fetchAdminMeetings(),
    fetchAdminCallLogs(),
    fetchAdminPayments(),
    fetchAdminClasses(),
    fetchAdminAssignments(),
    fetchAdminAttendance()
  ]);

  adminState.users = users.status === "fulfilled" ? users.value : [];
  adminState.jobs = jobs.status === "fulfilled" ? jobs.value : [];
  adminState.applications = applications.status === "fulfilled" ? applications.value : [];
  adminState.posts = posts.status === "fulfilled" ? posts.value : [];
  adminState.reports = reports.status === "fulfilled" ? reports.value : [];
  adminState.meetings = meetings.status === "fulfilled" ? meetings.value : [];
  adminState.callLogs = callLogs.status === "fulfilled" ? callLogs.value : [];
  adminState.payments = payments.status === "fulfilled" ? payments.value : [];
  adminState.classes = classes.status === "fulfilled" ? classes.value : [];
  adminState.assignments = assignments.status === "fulfilled" ? assignments.value : [];
  adminState.attendance = attendance.status === "fulfilled" ? attendance.value : [];

  splitSchoolUsers();

  addAuditLog("Refreshed admin data", "platform", {
    users: adminState.users.length,
    jobs: adminState.jobs.length,
    applications: adminState.applications.length
  });
}

async function refreshAdminData(){
  try{
    showAdminLoader();
    await refreshCoreData();

    const section = adminState.currentSection || "overview";
    const loaderName = ADMIN_SECTIONS[section]?.loader;
    const loader = window[loaderName];

    if(typeof loader === "function"){
      await loader();
    }

    adminToast("Admin data refreshed.");
  }catch(error){
    console.error(error);
    adminToast(error.message || "Unable to refresh admin data.");
  }finally{
    hideAdminLoader();
  }
}

async function runHealthCheck(){
  const apiEl = document.getElementById("sidebarApiStatus");
  const dbEl = document.getElementById("sidebarDbStatus");
  const socketEl = document.getElementById("sidebarSocketStatus");

  if(apiEl) apiEl.textContent = "Checking";
  if(dbEl) dbEl.textContent = "Checking";
  if(socketEl) socketEl.textContent = "Ready";

  try{
    await adminRequest("/api/users/me");

    if(apiEl) apiEl.textContent = "Online";
    if(dbEl) dbEl.textContent = "Connected";
    if(socketEl) socketEl.textContent = "Ready";

    const apiHealth = document.getElementById("apiHealth");
    const databaseHealth = document.getElementById("databaseHealth");
    const socketHealth = document.getElementById("socketHealth");

    if(apiHealth) apiHealth.textContent = "Online";
    if(databaseHealth) databaseHealth.textContent = "Connected";
    if(socketHealth) socketHealth.textContent = "Ready";

    return true;
  }catch(error){
    if(apiEl) apiEl.textContent = "Offline";
    if(dbEl) dbEl.textContent = "Unknown";
    if(socketEl) socketEl.textContent = "Offline";

    const apiHealth = document.getElementById("apiHealth");
    const databaseHealth = document.getElementById("databaseHealth");
    const socketHealth = document.getElementById("socketHealth");

    if(apiHealth) apiHealth.textContent = "Offline";
    if(databaseHealth) databaseHealth.textContent = "Unknown";
    if(socketHealth) socketHealth.textContent = "Offline";

    return false;
  }
}

function matchAdminSearch(item, query){
  if(!query) return false;

  const text = [
    item?.name,
    item?.email,
    item?.companyName,
    item?.schoolName,
    item?.title,
    item?.headline,
    item?.profession,
    item?.location,
    item?.role,
    item?.status,
    item?.description,
    item?.text
  ].join(" ").toLowerCase();

  return text.includes(query);
}

function handleAdminGlobalSearch(value){
  const query = normalize(value);

  if(!query){
    const section = adminState.currentSection || "overview";
    const loader = window[ADMIN_SECTIONS[section]?.loader];

    if(typeof loader === "function"){
      loader();
    }

    return;
  }

  const results = [];

  adminState.users.forEach(item => {
    if(matchAdminSearch(item, query)){
      results.push({
        type: "User",
        title: getDisplayName(item),
        subtitle: `${readableRole(item.role)} • ${item.email || ""}`,
        action: `openAdminUserDrawer('${esc(getId(item))}')`
      });
    }
  });

  adminState.jobs.forEach(item => {
    if(matchAdminSearch(item, query)){
      results.push({
        type: "Job",
        title: item.title || "Job post",
        subtitle: `${item.companyName || item.company || "Company"} • ${item.status || "active"}`,
        action: `openAdminJobReview('${esc(getId(item))}')`
      });
    }
  });

  adminState.applications.forEach(item => {
    if(matchAdminSearch(item, query)){
      results.push({
        type: "Application",
        title: item.name || item.applicantName || item.userId?.name || "Application",
        subtitle: `${item.status || "new"} • ${item.jobTitle || item.jobId?.title || "Job"}`,
        action: `openApplicationReview('${esc(getId(item))}')`
      });
    }
  });

  adminState.posts.forEach(item => {
    if(matchAdminSearch(item, query)){
      results.push({
        type: "Post",
        title: item.author?.name || item.authorName || "Post",
        subtitle: String(item.text || "Content").slice(0, 80),
        action: `openPostReview('${esc(getId(item))}')`
      });
    }
  });

  renderGlobalSearchResults(results.slice(0, 25), query);
}

function renderGlobalSearchResults(results, query){
  const section = document.getElementById(adminState.currentSection + "Section") ||
                  document.getElementById("overviewSection");

  if(!section) return;

  section.classList.remove("hidden");

  if(!results.length){
    section.innerHTML = `
      <div class="admin-panel">
        <div class="admin-empty">
          <strong>No results for "${esc(query)}"</strong>
          <span>Try searching by user name, email, company, job title, school, or post content.</span>
        </div>
      </div>
    `;
    return;
  }

  section.innerHTML = `
    <div class="admin-panel">
      <div class="admin-panel-head">
        <h2>Search Results</h2>
        <button type="button" onclick="handleAdminGlobalSearch('')">Clear</button>
      </div>

      <div class="admin-feed-list">
        ${results.map(item => `
          <div class="admin-feed-item">
            <div class="admin-feed-icon">${esc(item.type[0])}</div>
            <div>
              <strong>${esc(item.title)}</strong>
              <p>${esc(item.type)} • ${esc(item.subtitle)}</p>
            </div>
            <div class="admin-actions">
              <button type="button" onclick="${item.action}">Open</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function exportAdminReport(){
  const report = {
    exportedAt: new Date().toISOString(),
    admin: adminState.me?.email || "",
    counts: {
      users: adminState.users.length,
      jobs: adminState.jobs.length,
      applications: adminState.applications.length,
      schools: adminState.schools.length,
      teachers: adminState.teachers.length,
      students: adminState.students.length,
      posts: adminState.posts.length,
      reports: adminState.reports.length,
      meetings: adminState.meetings.length,
      callLogs: adminState.callLogs.length,
      payments: adminState.payments.length
    },
    auditLogs: adminState.auditLogs.slice(0, 100)
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-admin-report-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported admin report", "platform");
  adminToast("Admin report exported.");
}

function openAdminQuickCreate(){
  openAdminFormModal(
    "Quick Create",
    "Choose what you want to create or manage.",
    `
      <div class="admin-quick-grid two">
        <button type="button" onclick="switchAdminSection('users');closeAdminFormModal();">Manage Users</button>
        <button type="button" onclick="switchAdminSection('jobs');closeAdminFormModal();">Manage Jobs</button>
        <button type="button" onclick="switchAdminSection('schools');closeAdminFormModal();">Manage Schools</button>
        <button type="button" onclick="switchAdminSection('reports');closeAdminFormModal();">Review Reports</button>
      </div>

      <div class="admin-empty" style="margin-top:14px;">
        <strong>Admin-created records need backend routes.</strong>
        <span>For safe production control, create records from their official dashboard unless an admin creation route is added.</span>
      </div>
    `
  );
}
/* =====================================================
   PART 3 / 20 — OVERVIEW DASHBOARD
===================================================== */

async function loadOverview(){
  const section = document.getElementById("overviewSection");
  if(!section) return;

  try{
    setOverviewLoading();
    await refreshCoreData();

    renderOverviewStats();
    renderPlatformActivity();
    renderAdminNotifications();
    renderVerificationQueue();
    renderSystemHealthPanel();
    renderAuditSummaryPanel();

    addAuditLog("Viewed overview dashboard", "overview");
  }catch(error){
    console.error(error);
    section.innerHTML = `
      <div class="admin-panel">
        <div class="admin-empty">
          <strong>Unable to load overview</strong>
          <span>${esc(error.message || "Please refresh and try again.")}</span>
        </div>
      </div>
    `;
  }
}

function setOverviewLoading(){
  const ids = [
    "totalUsersValue",
    "totalJobsValue",
    "totalApplicationsValue",
    "pendingReviewsValue"
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if(el) el.textContent = "...";
  });

  ["platformActivityFeed","adminNotifications","verificationQueue"].forEach(id => {
    const box = document.getElementById(id);
    if(box){
      box.innerHTML = `
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
    }
  });
}

function countPendingReviews(){
  const pendingUsers = adminState.users.filter(user => {
    const role = normalize(user.role);
    return ["employer","school","agent","teacher"].includes(role) && !isVerified(user);
  });

  const pendingJobs = adminState.jobs.filter(job => {
    const status = normalize(job.status || "active");
    return ["pending","review","draft"].includes(status);
  });

  const openReports = adminState.reports.filter(report => {
    const status = normalize(report.status || "open");
    return ["open","pending","new"].includes(status);
  });

  return pendingUsers.length + pendingJobs.length + openReports.length;
}

function renderOverviewStats(){
  const users = adminState.users.length;
  const jobs = adminState.jobs.length;
  const applications = adminState.applications.length;
  const pendingReviews = countPendingReviews();

  const totalUsersValue = document.getElementById("totalUsersValue");
  const totalJobsValue = document.getElementById("totalJobsValue");
  const totalApplicationsValue = document.getElementById("totalApplicationsValue");
  const pendingReviewsValue = document.getElementById("pendingReviewsValue");

  if(totalUsersValue) totalUsersValue.textContent = users;
  if(totalJobsValue) totalJobsValue.textContent = jobs;
  if(totalApplicationsValue) totalApplicationsValue.textContent = applications;
  if(pendingReviewsValue) pendingReviewsValue.textContent = pendingReviews;

  const totalUsersTrend = document.getElementById("totalUsersTrend");
  const totalJobsTrend = document.getElementById("totalJobsTrend");
  const totalApplicationsTrend = document.getElementById("totalApplicationsTrend");
  const pendingReviewsTrend = document.getElementById("pendingReviewsTrend");

  if(totalUsersTrend){
    totalUsersTrend.textContent =
      `${adminState.schools.length} schools • ${adminState.teachers.length} teachers • ${adminState.students.length} students`;
  }

  if(totalJobsTrend){
    const pendingJobs = adminState.jobs.filter(job =>
      ["pending","review","draft"].includes(normalize(job.status || "active"))
    ).length;

    totalJobsTrend.textContent = `${pendingJobs} pending review`;
  }

  if(totalApplicationsTrend){
    const activeApplications = adminState.applications.filter(app =>
      !["rejected","withdrawn","archived"].includes(normalize(app.status))
    ).length;

    totalApplicationsTrend.textContent = `${activeApplications} active applications`;
  }

  if(pendingReviewsTrend){
    pendingReviewsTrend.textContent =
      pendingReviews > 0 ? "Needs admin attention" : "All clear";
  }

  renderOptionalOverviewCards();
}

function renderOptionalOverviewCards(){
  const optionalCards = [
    {
      id: "activeMeetingsCard",
      label: "Active Meetings",
      value: adminState.meetings.length,
      note: `${adminState.callLogs.length} call logs`
    },
    {
      id: "schoolsCard",
      label: "Schools",
      value: adminState.schools.length,
      note: "Registered school accounts"
    },
    {
      id: "teachersCard",
      label: "Teachers",
      value: adminState.teachers.length,
      note: "Teacher accounts"
    },
    {
      id: "studentsCard",
      label: "Students",
      value: adminState.students.length,
      note: "Student accounts"
    }
  ];

  optionalCards.forEach(card => {
    const box = document.getElementById(card.id);
    if(!box) return;

    box.className = "admin-stat-card";
    box.innerHTML = `
      <span>${esc(card.label)}</span>
      <strong>${esc(card.value)}</strong>
      <small>${esc(card.note)}</small>
    `;
  });

  const coreCards = [
    {
      id: "totalUsersCard",
      label: "Total Users",
      value: adminState.users.length,
      note: "All platform roles"
    },
    {
      id: "totalJobsCard",
      label: "Total Jobs",
      value: adminState.jobs.length,
      note: "All jobs and internships"
    },
    {
      id: "totalApplicationsCard",
      label: "Applications",
      value: adminState.applications.length,
      note: "Jobs and internships"
    },
    {
      id: "pendingReviewsCard",
      label: "Pending Reviews",
      value: countPendingReviews(),
      note: "Users, jobs, and reports"
    }
  ];

  coreCards.forEach(card => {
    const box = document.getElementById(card.id);
    if(!box) return;

    box.className = "admin-stat-card";
    box.innerHTML = `
      <span>${esc(card.label)}</span>
      <strong>${esc(card.value)}</strong>
      <small>${esc(card.note)}</small>
    `;
  });
}

function renderPlatformActivity(){
  const box = document.getElementById("platformActivityFeed");
  if(!box) return;

  const activities = [];

  [...adminState.users]
    .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0,5)
    .forEach(user => {
      activities.push({
        icon: "U",
        title: "User activity",
        text: `${getDisplayName(user)} joined as ${readableRole(user.role)}.`,
        date: user.createdAt
      });
    });

  [...adminState.jobs]
    .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0,5)
    .forEach(job => {
      activities.push({
        icon: "J",
        title: "Job activity",
        text: `${job.title || "Job"} from ${job.companyName || job.company || "company"} is ${job.status || "active"}.`,
        date: job.createdAt
      });
    });

  [...adminState.applications]
    .sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0,5)
    .forEach(app => {
      activities.push({
        icon: "A",
        title: "Application activity",
        text: `${app.name || app.applicantName || app.userId?.name || "Applicant"} applied for ${app.jobTitle || app.jobId?.title || "a job"}.`,
        date: app.createdAt
      });
    });

  activities.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));

  if(!activities.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No activity yet</strong>
        <span>New users, jobs, and applications will appear here.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-panel-head">
      <h2>Platform Activity</h2>
      <button type="button" onclick="loadOverview()">Refresh</button>
    </div>

    <div class="admin-feed-list">
      ${activities.slice(0,10).map(item => `
        <div class="admin-feed-item">
          <div class="admin-feed-icon">${esc(item.icon)}</div>
          <div>
            <strong>${esc(item.title)}</strong>
            <p>${esc(item.text)}</p>
            <small>${esc(formatDateTime(item.date))}</small>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderAdminNotifications(){
  const box = document.getElementById("adminNotifications");
  if(!box) return;

  const pendingVerification = adminState.users.filter(user => {
    const role = normalize(user.role);
    return ["employer","school","agent","teacher"].includes(role) && !isVerified(user);
  }).length;

  const pendingJobs = adminState.jobs.filter(job =>
    ["pending","review","draft"].includes(normalize(job.status || "active"))
  ).length;

  const openReports = adminState.reports.filter(report =>
    ["open","pending","new"].includes(normalize(report.status || "open"))
  ).length;

  box.innerHTML = `
    <div class="admin-panel-head">
      <h2>Admin Notifications</h2>
    </div>

    <div class="admin-feed-list">
      <div class="admin-feed-item">
        <div class="admin-feed-icon">V</div>
        <div>
          <strong>${pendingVerification} verification requests</strong>
          <p>Employers, schools, recruiters, and teachers needing review.</p>
        </div>
      </div>

      <div class="admin-feed-item">
        <div class="admin-feed-icon">J</div>
        <div>
          <strong>${pendingJobs} job reviews</strong>
          <p>Jobs waiting for approval, rejection, or moderation.</p>
        </div>
      </div>

      <div class="admin-feed-item">
        <div class="admin-feed-icon">R</div>
        <div>
          <strong>${openReports} open reports</strong>
          <p>Support and content reports needing admin action.</p>
        </div>
      </div>
    </div>
  `;
}

function renderVerificationQueue(){
  const box = document.getElementById("verificationQueue");
  if(!box) return;

  const queue = adminState.users
    .filter(user => {
      const role = normalize(user.role);
      return ["employer","school","agent","teacher"].includes(role) && !isVerified(user);
    })
    .slice(0,8);

  if(!queue.length){
    box.innerHTML = `
      <div class="admin-panel-head">
        <h2>Verification Queue</h2>
      </div>

      <div class="admin-empty">
        <strong>No pending verification</strong>
        <span>All important accounts are clear.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-panel-head">
      <h2>Verification Queue</h2>
      <button type="button" onclick="switchAdminSection('verification')">View All</button>
    </div>

    <div class="admin-feed-list">
      ${queue.map(user => `
        <div class="admin-feed-item">
          <div class="admin-feed-icon">✓</div>
          <div>
            <strong>${esc(getDisplayName(user))}</strong>
            <p>${esc(readableRole(user.role))} • ${esc(user.email || "")}</p>
          </div>
          <div class="admin-actions">
            <button type="button" onclick="openVerificationReview('${esc(getId(user))}')">Review</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSystemHealthPanel(){
  const box = document.getElementById("systemHealthPanel");
  if(!box) return;

  box.innerHTML = `
    <div class="admin-panel-head">
      <h2>System Health</h2>
      <button type="button" onclick="runHealthCheck()">Check</button>
    </div>

    <div class="system-health-grid">
      <div>
        <span>API</span>
        <strong id="apiHealth">Online</strong>
      </div>
      <div>
        <span>Database</span>
        <strong id="databaseHealth">Connected</strong>
      </div>
      <div>
        <span>Socket</span>
        <strong id="socketHealth">Ready</strong>
      </div>
    </div>
  `;

  runHealthCheck();
}

function renderAuditSummaryPanel(){
  const box = document.getElementById("auditSummaryPanel");
  if(!box) return;

  const logs = adminState.auditLogs.slice(0,5);

  box.innerHTML = `
    <div class="admin-panel-head">
      <h2>Audit Summary</h2>
      <button type="button" onclick="switchAdminSection('audit')">Open Logs</button>
    </div>

    ${
      logs.length
        ? `<div class="admin-feed-list">
            ${logs.map(log => `
              <div class="admin-feed-item">
                <div class="admin-feed-icon">L</div>
                <div>
                  <strong>${esc(log.action)}</strong>
                  <p>${esc(log.target || "platform")} • ${esc(formatDateTime(log.createdAt))}</p>
                </div>
              </div>
            `).join("")}
          </div>`
        : `<div class="admin-empty">
            <strong>No audit logs yet</strong>
            <span>Admin actions will appear here.</span>
          </div>`
    }
  `;
}
/* =====================================================
   PART 4 / 20 — USER MANAGEMENT
===================================================== */

async function loadAdminUsers(){
  const section = document.getElementById("usersSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        id="adminUserSearch"
        type="search"
        placeholder="Search name, email, company, school, headline..."
        value="${esc(adminState.filters.users.search)}"
        oninput="adminState.filters.users.search=this.value;renderAdminUsers()"
      >

      <select onchange="adminState.filters.users.role=this.value;renderAdminUsers()">
        <option value="all">All Roles</option>
        <option value="admin">Admin</option>
        <option value="employer">Employer</option>
        <option value="agent">Recruiter</option>
        <option value="talent">Job Seeker</option>
        <option value="school">School</option>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
      </select>

      <select onchange="adminState.filters.users.status=this.value;renderAdminUsers()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="unverified">Unverified</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshAdminUsers()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="openAdminBulkUserTools()">Bulk Tools</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Platform Users</h2>
          <p>Manage all users across AIFT.</p>
        </div>
        <button type="button" onclick="openAdminQuickCreate()">Create</button>
      </div>

      <div id="adminUsersTable">
        <div class="admin-skeleton">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  await refreshAdminUsers();
}

async function refreshAdminUsers(){
  try{
    adminState.users = await fetchAdminUsers();
    splitSchoolUsers();
    renderAdminUsers();
  }catch(error){
    console.error(error);
    document.getElementById("adminUsersTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load users</strong>
        <span>${esc(error.message || "Please try again.")}</span>
      </div>
    `;
  }
}

function getFilteredUsers(){
  let users = [...adminState.users];

  const search = normalize(adminState.filters.users.search);
  const role = adminState.filters.users.role;
  const status = adminState.filters.users.status;

  if(search){
    users = users.filter(user => {
      const text = [
        user.name,
        user.email,
        user.companyName,
        user.schoolName,
        user.headline,
        user.profession,
        user.location,
        user.role,
        user.status
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(role !== "all"){
    users = users.filter(user => normalize(user.role) === role);
  }

  if(status !== "all"){
    if(status === "verified"){
      users = users.filter(user => isVerified(user));
    }else if(status === "unverified"){
      users = users.filter(user => !isVerified(user));
    }else{
      users = users.filter(user => normalize(user.status || "active") === status);
    }
  }

  return users;
}

function renderAdminUsers(){
  const box = document.getElementById("adminUsersTable");
  if(!box) return;

  const users = getFilteredUsers();

  if(!users.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No users found</strong>
        <span>Try changing the filters or search keyword.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${users.length}</strong>
      <span>users found</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${users.map(user => adminUserRow(user)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function adminUserRow(user){
  const id = getId(user);
  const role = normalize(user.role || "member");
  const status = normalize(user.status || "active");
  const verified = isVerified(user);

  return `
    <tr>
      <td>
        <div class="admin-user-cell">
          <img src="${esc(getAvatar(user))}" alt="">
          <div>
            <strong>${esc(getDisplayName(user))}</strong>
            <span>${esc(user.email || "")}</span>
          </div>
        </div>
      </td>

      <td>
        <span class="admin-badge role-${esc(role)}">
          ${esc(readableRole(role))}
        </span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">
          ${esc(status)}
        </span>
      </td>

      <td>
        <span class="admin-badge ${verified ? "green" : "orange"}">
          ${verified ? "Verified" : "Unverified"}
        </span>
      </td>

      <td>${esc(formatDate(user.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button type="button" onclick="openAdminUserDrawer('${esc(id)}')">View</button>
          <button type="button" onclick="toggleAdminUserVerified('${esc(id)}')">
            ${verified ? "Unverify" : "Verify"}
          </button>
          <button type="button" onclick="toggleAdminUserStatus('${esc(id)}')">
            ${status === "suspended" ? "Activate" : "Suspend"}
          </button>
          <button type="button" onclick="openAdminResetPassword('${esc(id)}')">Reset</button>
        </div>
      </td>
    </tr>
  `;
}

function openAdminUserDrawer(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));

  if(!user){
    adminToast("User not found.");
    return;
  }

  const verified = isVerified(user);
  const status = normalize(user.status || "active");

  openAdminDrawer(
    getDisplayName(user),
    `${readableRole(user.role)} • ${user.email || "No email"}`,
    `
      <div class="admin-entity-header">
        <img src="${esc(getAvatar(user))}" alt="">
        <div>
          <h3>${esc(getDisplayName(user))}</h3>
          <p>${esc(user.email || "")}</p>
          <div class="admin-actions">
            <span class="admin-badge role-${esc(normalize(user.role))}">${esc(readableRole(user.role))}</span>
            <span class="admin-badge ${verified ? "green" : "orange"}">${verified ? "Verified" : "Unverified"}</span>
            <span class="admin-badge status-${esc(status)}">${esc(status)}</span>
          </div>
        </div>
      </div>

      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Role</span>
          <strong>${esc(readableRole(user.role))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(user.status || "active")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Verified</span>
          <strong>${verified ? "Yes" : "No"}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Location</span>
          <strong>${esc(user.location || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Headline</span>
          <strong>${esc(user.headline || user.profession || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Joined</span>
          <strong>${esc(formatDate(user.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Bio</span>
          <strong>${esc(user.bio || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Skills / Languages</span>
          <strong>${esc([
            ...(Array.isArray(user.skills) ? user.skills : []),
            ...(Array.isArray(user.languages) ? user.languages : [])
          ].join(", ") || "-")}</strong>
        </div>
      </div>
    `,
    `
      <button type="button" onclick="toggleAdminUserVerified('${esc(userId)}')">
        ${verified ? "Unverify" : "Verify"}
      </button>

      <button type="button" onclick="toggleAdminUserStatus('${esc(userId)}')">
        ${status === "suspended" ? "Activate" : "Suspend"}
      </button>

      <button type="button" onclick="openAdminRoleChange('${esc(userId)}')">
        Change Role
      </button>

      <button type="button" onclick="openAdminResetPassword('${esc(userId)}')">
        Reset Password
      </button>

      <button type="button" class="danger" onclick="confirmDeleteAdminUser('${esc(userId)}')">
        Delete
      </button>
    `
  );
}

async function toggleAdminUserVerified(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(!user) return adminToast("User not found.");

  const next = !isVerified(user);

  try{
    await adminPatchManyPossible(
      [
        `/api/users/${encodeURIComponent(userId)}`,
        `/api/admin/users/${encodeURIComponent(userId)}`,
        `/api/users/${encodeURIComponent(userId)}/verify`
      ],
      {
        aiftVerified: next,
        isVerified: next,
        verified: next
      }
    );

    user.aiftVerified = next;
    user.isVerified = next;
    user.verified = next;

    addAuditLog(next ? "Verified user" : "Unverified user", user.email || userId);
    adminToast(next ? "User verified." : "User unverified.");

    renderAdminUsers();
    closeAdminDrawer();
  }catch(error){
    adminToast(error.message || "Unable to update verification.");
  }
}

async function toggleAdminUserStatus(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(!user) return adminToast("User not found.");

  const current = normalize(user.status || "active");
  const next = current === "suspended" ? "active" : "suspended";

  try{
    await adminPatchManyPossible(
      [
        `/api/users/${encodeURIComponent(userId)}`,
        `/api/admin/users/${encodeURIComponent(userId)}/status`,
        `/api/admin/users/${encodeURIComponent(userId)}`
      ],
      { status: next }
    );

    user.status = next;

    addAuditLog(next === "suspended" ? "Suspended user" : "Activated user", user.email || userId);
    adminToast(next === "suspended" ? "User suspended." : "User activated.");

    renderAdminUsers();
    closeAdminDrawer();
  }catch(error){
    adminToast(error.message || "Unable to update user status.");
  }
}

function openAdminRoleChange(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(!user) return adminToast("User not found.");

  openAdminFormModal(
    "Change User Role",
    `Update role for ${getDisplayName(user)}.`,
    `
      <form onsubmit="submitAdminRoleChange(event,'${esc(userId)}')">
        <div class="admin-form-grid">
          <label>
            <span>Role</span>
            <select id="adminRoleChangeValue" required>
              <option value="admin" ${normalize(user.role)==="admin" ? "selected" : ""}>Admin</option>
              <option value="employer" ${normalize(user.role)==="employer" ? "selected" : ""}>Employer</option>
              <option value="agent" ${normalize(user.role)==="agent" ? "selected" : ""}>Recruiter</option>
              <option value="talent" ${normalize(user.role)==="talent" ? "selected" : ""}>Job Seeker</option>
              <option value="school" ${normalize(user.role)==="school" ? "selected" : ""}>School</option>
              <option value="teacher" ${normalize(user.role)==="teacher" ? "selected" : ""}>Teacher</option>
              <option value="student" ${normalize(user.role)==="student" ? "selected" : ""}>Student</option>
            </select>
          </label>
        </div>

        <div class="admin-modal-actions">
          <button type="button" class="admin-btn ghost" onclick="closeAdminFormModal()">Cancel</button>
          <button type="submit" class="admin-btn">Save Role</button>
        </div>
      </form>
    `
  );
}

async function submitAdminRoleChange(event, userId){
  event.preventDefault();

  const role = document.getElementById("adminRoleChangeValue")?.value;
  if(!role) return adminToast("Please select a role.");

  try{
    await adminPatchManyPossible(
      [
        `/api/users/${encodeURIComponent(userId)}`,
        `/api/admin/users/${encodeURIComponent(userId)}/role`,
        `/api/admin/users/${encodeURIComponent(userId)}`
      ],
      { role }
    );

    const user = adminState.users.find(item => String(getId(item)) === String(userId));
    if(user) user.role = role;

    splitSchoolUsers();
    addAuditLog("Changed user role", user?.email || userId, { role });
    adminToast("User role updated.");

    closeAdminFormModal();
    closeAdminDrawer();
    renderAdminUsers();
  }catch(error){
    adminToast(error.message || "Unable to change role.");
  }
}

function openAdminResetPassword(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(!user) return adminToast("User not found.");

  openAdminFormModal(
    "Reset User Password",
    `Set a new password for ${getDisplayName(user)}.`,
    `
      <form onsubmit="submitAdminPasswordReset(event,'${esc(userId)}')">
        <div class="admin-form-grid">
          <label>
            <span>New Password</span>
            <input id="adminNewPassword" type="password" minlength="6" required placeholder="Minimum 6 characters">
          </label>

          <label>
            <span>Confirm Password</span>
            <input id="adminConfirmPassword" type="password" minlength="6" required placeholder="Repeat password">
          </label>
        </div>

        <div class="admin-modal-actions">
          <button type="button" class="admin-btn ghost" onclick="closeAdminFormModal()">Cancel</button>
          <button type="submit" class="admin-btn danger">Reset Password</button>
        </div>
      </form>
    `
  );
}

async function submitAdminPasswordReset(event, userId){
  event.preventDefault();

  const password = document.getElementById("adminNewPassword")?.value || "";
  const confirm = document.getElementById("adminConfirmPassword")?.value || "";

  if(password.length < 6) return adminToast("Password must be at least 6 characters.");
  if(password !== confirm) return adminToast("Passwords do not match.");

  const user = adminState.users.find(item => String(getId(item)) === String(userId));

  try{
    await adminJSON("/api/auth/reset-admin-password", "POST", {
      email: user?.email,
      userId,
      password
    });

    addAuditLog("Reset user password", user?.email || userId);
    adminToast("Password reset successfully.");

    closeAdminFormModal();
  }catch(error){
    adminToast(error.message || "Unable to reset password. Backend may need a general admin reset route.");
  }
}

function confirmDeleteAdminUser(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));

  openAdminConfirm(
    "Delete user",
    `Delete ${getDisplayName(user)}? This action cannot be undone.`,
    async () => {
      try{
        await adminRequest(`/api/users/${encodeURIComponent(userId)}`, {
          method: "DELETE"
        });

        adminState.users = adminState.users.filter(item => String(getId(item)) !== String(userId));
        splitSchoolUsers();

        addAuditLog("Deleted user", user?.email || userId);
        adminToast("User deleted.");

        closeAdminDrawer();
        renderAdminUsers();
      }catch(error){
        adminToast(error.message || "Unable to delete user. Backend route may be missing.");
      }
    }
  );
}

function openAdminBulkUserTools(){
  openAdminFormModal(
    "Bulk User Tools",
    "Use filters first, then apply safe bulk actions.",
    `
      <div class="admin-empty">
        <strong>Bulk actions are protected.</strong>
        <span>For safety, select records manually in a later upgrade before enabling true bulk verification, suspension, or deletion.</span>
      </div>

      <div class="admin-modal-actions">
        <button type="button" class="admin-btn" onclick="exportUsersCsv()">Export Current Users</button>
        <button type="button" class="admin-btn ghost" onclick="closeAdminFormModal()">Close</button>
      </div>
    `
  );
}

function exportUsersCsv(){
  const rows = getFilteredUsers();
  const header = ["Name","Email","Role","Status","Verified","Joined"];

  const csv = [
    header.join(","),
    ...rows.map(user => [
      `"${String(getDisplayName(user)).replaceAll('"','""')}"`,
      `"${String(user.email || "").replaceAll('"','""')}"`,
      `"${String(readableRole(user.role)).replaceAll('"','""')}"`,
      `"${String(user.status || "active").replaceAll('"','""')}"`,
      `"${isVerified(user) ? "Yes" : "No"}"`,
      `"${formatDate(user.createdAt)}"`
    ].join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-users-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported users CSV", "users");
  adminToast("Users exported.");
}
/* =====================================================
   PART 5 / 20 — VERIFICATION CENTER
===================================================== */

async function loadVerificationCenter(){
  const section = document.getElementById("verificationSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search company, school, recruiter, teacher..."
        value="${esc(adminState.filters.verification.search)}"
        oninput="adminState.filters.verification.search=this.value;renderVerificationCenter()"
      >

      <select onchange="adminState.filters.verification.role=this.value;renderVerificationCenter()">
        <option value="all">All Important Roles</option>
        <option value="employer">Employers</option>
        <option value="school">Schools</option>
        <option value="agent">Recruiters</option>
        <option value="teacher">Teachers</option>
      </select>

      <select onchange="adminState.filters.verification.status=this.value;renderVerificationCenter()">
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="all">All</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshVerificationCenter()">Refresh</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Verification Requests</h2>
          <p>Approve trusted employers, schools, recruiters, and teachers.</p>
        </div>
        <button type="button" onclick="renderVerificationCenter()">Reload View</button>
      </div>

      <div id="verificationTable">
        <div class="admin-skeleton">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  await refreshVerificationCenter();
}

async function refreshVerificationCenter(){
  try{
    adminState.users = await fetchAdminUsers();
    splitSchoolUsers();
    renderVerificationCenter();
  }catch(error){
    document.getElementById("verificationTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load verification queue</strong>
        <span>${esc(error.message || "Please try again.")}</span>
      </div>
    `;
  }
}

function getVerificationUsers(){
  const importantRoles = ["employer", "school", "agent", "teacher"];

  let users = adminState.users.filter(user =>
    importantRoles.includes(normalize(user.role))
  );

  const search = normalize(adminState.filters.verification.search);
  const role = adminState.filters.verification.role;
  const status = adminState.filters.verification.status;

  if(search){
    users = users.filter(user => {
      const text = [
        user.name,
        user.email,
        user.companyName,
        user.schoolName,
        user.headline,
        user.profession,
        user.location,
        user.role
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(role !== "all"){
    users = users.filter(user => normalize(user.role) === role);
  }

  if(status === "pending"){
    users = users.filter(user => !isVerified(user));
  }

  if(status === "verified"){
    users = users.filter(user => isVerified(user));
  }

  return users;
}

function renderVerificationCenter(){
  const box = document.getElementById("verificationTable");
  if(!box) return;

  const users = getVerificationUsers();

  if(!users.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No verification records found</strong>
        <span>Try changing the filter or search keyword.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${users.length}</strong>
      <span>verification records</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Role</th>
            <th>Verification</th>
            <th>Status</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${users.map(user => verificationRow(user)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function verificationRow(user){
  const id = getId(user);
  const verified = isVerified(user);
  const role = normalize(user.role);
  const status = normalize(user.status || "active");

  return `
    <tr>
      <td>
        <div class="admin-user-cell">
          <img src="${esc(getAvatar(user))}" alt="">
          <div>
            <strong>${esc(getDisplayName(user))}</strong>
            <span>${esc(user.email || "")}</span>
          </div>
        </div>
      </td>

      <td>
        <span class="admin-badge role-${esc(role)}">
          ${esc(readableRole(role))}
        </span>
      </td>

      <td>
        <span class="admin-badge ${verified ? "green" : "orange"}">
          ${verified ? "Verified" : "Pending"}
        </span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">
          ${esc(status)}
        </span>
      </td>

      <td>${esc(formatDate(user.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button type="button" onclick="openVerificationReview('${esc(id)}')">Review</button>
          <button
            type="button"
            class="${verified ? "danger" : "success"}"
            onclick="toggleVerificationStatus('${esc(id)}')"
          >
            ${verified ? "Remove" : "Approve"}
          </button>
        </div>
      </td>
    </tr>
  `;
}

function openVerificationReview(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));

  if(!user){
    adminToast("User not found.");
    return;
  }

  const verified = isVerified(user);
  const role = normalize(user.role);

  openAdminReviewModal(
    "Verification Review",
    `${readableRole(role)} • ${user.email || "No email"}`,
    `
      <div class="admin-entity-header">
        <img src="${esc(getAvatar(user))}" alt="">
        <div>
          <h3>${esc(getDisplayName(user))}</h3>
          <p>${esc(user.email || "")}</p>

          <div class="admin-actions">
            <span class="admin-badge role-${esc(role)}">${esc(readableRole(role))}</span>
            <span class="admin-badge ${verified ? "green" : "orange"}">${verified ? "Verified" : "Pending"}</span>
            <span class="admin-badge status-${esc(normalize(user.status || "active"))}">${esc(user.status || "active")}</span>
          </div>
        </div>
      </div>

      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Name</span>
          <strong>${esc(user.name || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Company</span>
          <strong>${esc(user.companyName || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>School</span>
          <strong>${esc(user.schoolName || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Role</span>
          <strong>${esc(readableRole(user.role))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Location</span>
          <strong>${esc(user.location || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Joined</span>
          <strong>${esc(formatDate(user.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Headline</span>
          <strong>${esc(user.headline || user.profession || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Bio</span>
          <strong>${esc(user.bio || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Verification Note</span>
          <strong>${verified ? "This account is currently verified." : "This account is waiting for admin verification."}</strong>
        </div>
      </div>
    `,
    `
      <button
        type="button"
        class="admin-btn ${verified ? "danger" : ""}"
        onclick="toggleVerificationStatus('${esc(userId)}')"
      >
        ${verified ? "Remove Verification" : "Approve Verification"}
      </button>

      <button
        type="button"
        class="admin-btn ghost"
        onclick="closeAdminReviewModal();openAdminUserDrawer('${esc(userId)}')"
      >
        Open Full User
      </button>
    `
  );
}

async function toggleVerificationStatus(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));

  if(!user){
    adminToast("User not found.");
    return;
  }

  const next = !isVerified(user);

  try{
    await adminPatchManyPossible(
      [
        `/api/users/${encodeURIComponent(userId)}`,
        `/api/admin/users/${encodeURIComponent(userId)}`,
        `/api/users/${encodeURIComponent(userId)}/verify`,
        `/api/admin/verification/${encodeURIComponent(userId)}`
      ],
      {
        aiftVerified: next,
        isVerified: next,
        verified: next
      }
    );

    user.aiftVerified = next;
    user.isVerified = next;
    user.verified = next;

    addAuditLog(
      next ? "Approved verification" : "Removed verification",
      user.email || userId,
      { role: user.role }
    );

    adminToast(next ? "Account verified." : "Verification removed.");

    renderVerificationCenter();
    renderVerificationQueue();
    renderAdminNotifications();
    renderOverviewStats();
    closeAdminReviewModal();
  }catch(error){
    adminToast(error.message || "Unable to update verification.");
  }
}
/* =====================================================
   PART 6 / 20 — JOBS MANAGEMENT
===================================================== */

async function loadAdminJobs(){
  const section = document.getElementById("jobsSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search job title, company, location, skills..."
        value="${esc(adminState.filters.jobs.search)}"
        oninput="adminState.filters.jobs.search=this.value;renderAdminJobs()"
      >

      <select onchange="adminState.filters.jobs.status=this.value;renderAdminJobs()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="review">Review</option>
        <option value="suspended">Suspended</option>
        <option value="rejected">Rejected</option>
        <option value="closed">Closed</option>
      </select>

      <select onchange="adminState.filters.jobs.type=this.value;renderAdminJobs()">
        <option value="all">All Types</option>
        <option value="full-time">Full-time</option>
        <option value="part-time">Part-time</option>
        <option value="internship">Internship</option>
        <option value="contract">Contract</option>
        <option value="remote">Remote</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshAdminJobs()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="exportJobsCsv()">Export</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Jobs Management</h2>
          <p>Review, approve, suspend, reject, or delete platform jobs.</p>
        </div>
        <button type="button" onclick="renderAdminJobs()">Reload View</button>
      </div>

      <div id="adminJobsTable">
        <div class="admin-skeleton">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  await refreshAdminJobs();
}

async function refreshAdminJobs(){
  try{
    adminState.jobs = await fetchAdminJobs();
    renderAdminJobs();
  }catch(error){
    document.getElementById("adminJobsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load jobs</strong>
        <span>${esc(error.message || "Please try again.")}</span>
      </div>
    `;
  }
}

function getFilteredJobs(){
  let jobs = [...adminState.jobs];

  const search = normalize(adminState.filters.jobs.search);
  const status = adminState.filters.jobs.status;
  const type = adminState.filters.jobs.type;

  if(search){
    jobs = jobs.filter(job => {
      const text = [
        job.title,
        job.company,
        job.companyName,
        job.location,
        job.type,
        job.jobType,
        job.workSetup,
        job.description,
        Array.isArray(job.skills) ? job.skills.join(" ") : ""
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(status !== "all"){
    jobs = jobs.filter(job =>
      normalize(job.status || "active") === status
    );
  }

  if(type !== "all"){
    jobs = jobs.filter(job => {
      const text = [
        job.type,
        job.jobType,
        job.workSetup
      ].join(" ").toLowerCase();

      return text.includes(type);
    });
  }

  return jobs;
}

function renderAdminJobs(){
  const box = document.getElementById("adminJobsTable");
  if(!box) return;

  const jobs = getFilteredJobs();

  if(!jobs.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No jobs found</strong>
        <span>Try changing the search or filters.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${jobs.length}</strong>
      <span>jobs found</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Company</th>
            <th>Type</th>
            <th>Status</th>
            <th>Posted</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${jobs.map(job => adminJobRow(job)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function adminJobRow(job){
  const id = getId(job);
  const status = normalize(job.status || "active");
  const type = job.type || job.jobType || job.workSetup || "-";

  return `
    <tr>
      <td>
        <div>
          <strong>${esc(job.title || "Untitled Job")}</strong>
          <span>${esc(job.location || "No location")}</span>
        </div>
      </td>

      <td>${esc(job.companyName || job.company || job.employerId?.companyName || "-")}</td>

      <td>
        <span class="admin-badge blue">${esc(type)}</span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">${esc(status)}</span>
      </td>

      <td>${esc(formatDate(job.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button type="button" onclick="openAdminJobReview('${esc(id)}')">Review</button>
          <button type="button" class="success" onclick="updateAdminJobStatus('${esc(id)}','active')">Approve</button>
          <button type="button" onclick="updateAdminJobStatus('${esc(id)}','suspended')">Suspend</button>
          <button type="button" class="danger" onclick="confirmDeleteAdminJob('${esc(id)}')">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function openAdminJobReview(jobId){
  const job = adminState.jobs.find(item => String(getId(item)) === String(jobId));

  if(!job){
    adminToast("Job not found.");
    return;
  }

  const status = normalize(job.status || "active");
  const company = job.companyName || job.company || job.employerId?.companyName || "-";

  openAdminReviewModal(
    "Job Review",
    `${job.title || "Untitled Job"} • ${company}`,
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card wide">
          <span>Job Title</span>
          <strong>${esc(job.title || "Untitled Job")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Company</span>
          <strong>${esc(company)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(job.status || "active")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Type</span>
          <strong>${esc(job.type || job.jobType || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Work Setup</span>
          <strong>${esc(job.workSetup || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Location</span>
          <strong>${esc(job.location || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Salary</span>
          <strong>${esc(job.salary || job.salaryRange || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Posted</span>
          <strong>${esc(formatDate(job.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Skills</span>
          <strong>${esc(Array.isArray(job.skills) ? job.skills.join(", ") : "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Description</span>
          <strong>${esc(job.description || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Requirements</span>
          <strong>${esc(job.requirements || "-")}</strong>
        </div>
      </div>
    `,
    `
      <button type="button" class="admin-btn success" onclick="updateAdminJobStatus('${esc(jobId)}','active')">Approve</button>
      <button type="button" class="admin-btn" onclick="updateAdminJobStatus('${esc(jobId)}','suspended')">Suspend</button>
      <button type="button" class="admin-btn danger" onclick="updateAdminJobStatus('${esc(jobId)}','rejected')">Reject</button>
      <button type="button" class="admin-btn danger" onclick="confirmDeleteAdminJob('${esc(jobId)}')">Delete</button>
    `
  );
}

async function updateAdminJobStatus(jobId, status){
  const job = adminState.jobs.find(item => String(getId(item)) === String(jobId));

  if(!job){
    adminToast("Job not found.");
    return;
  }

  try{
    await adminPatchManyPossible(
      [
        `/api/jobs/${encodeURIComponent(jobId)}`,
        `/api/admin/jobs/${encodeURIComponent(jobId)}`,
        `/api/jobs/${encodeURIComponent(jobId)}/status`
      ],
      { status }
    );

    job.status = status;

    addAuditLog("Updated job status", job.title || jobId, { status });
    adminToast(`Job marked as ${status}.`);

    closeAdminReviewModal();
    renderAdminJobs();
    renderOverviewStats();
    renderAdminNotifications();
  }catch(error){
    adminToast(error.message || "Unable to update job status.");
  }
}

function confirmDeleteAdminJob(jobId){
  const job = adminState.jobs.find(item => String(getId(item)) === String(jobId));

  openAdminConfirm(
    "Delete job",
    `Delete "${job?.title || "this job"}"? This cannot be undone.`,
    async () => {
      try{
        await adminRequest(`/api/jobs/${encodeURIComponent(jobId)}`, {
          method: "DELETE"
        });

        adminState.jobs = adminState.jobs.filter(item => String(getId(item)) !== String(jobId));

        addAuditLog("Deleted job", job?.title || jobId);
        adminToast("Job deleted.");

        closeAdminReviewModal();
        renderAdminJobs();
        renderOverviewStats();
      }catch(error){
        adminToast(error.message || "Unable to delete job. Backend route may be missing.");
      }
    }
  );
}

function exportJobsCsv(){
  const rows = getFilteredJobs();
  const header = ["Title","Company","Type","Status","Location","Posted"];

  const csv = [
    header.join(","),
    ...rows.map(job => [
      `"${String(job.title || "").replaceAll('"','""')}"`,
      `"${String(job.companyName || job.company || "").replaceAll('"','""')}"`,
      `"${String(job.type || job.jobType || "").replaceAll('"','""')}"`,
      `"${String(job.status || "active").replaceAll('"','""')}"`,
      `"${String(job.location || "").replaceAll('"','""')}"`,
      `"${formatDate(job.createdAt)}"`
    ].join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-jobs-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported jobs CSV", "jobs");
  adminToast("Jobs exported.");
}
/* =====================================================
   PART 7 / 20 — APPLICATIONS MANAGEMENT + CV VIEWER
===================================================== */

async function loadAdminApplications(){
  const section = document.getElementById("applicationsSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search applicant, job title, email..."
        value="${esc(adminState.filters.applications.search)}"
        oninput="adminState.filters.applications.search=this.value;renderAdminApplications()"
      >

      <select onchange="adminState.filters.applications.status=this.value;renderAdminApplications()">
        <option value="all">All Status</option>
        <option value="new">New</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="interview">Interview</option>
        <option value="offer">Offer</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
      </select>

      <select onchange="adminState.filters.applications.type=this.value;renderAdminApplications()">
        <option value="all">All Types</option>
        <option value="job">Job</option>
        <option value="internship">Internship</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshAdminApplications()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="exportApplicationsCsv()">Export</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Applications Management</h2>
          <p>Review applicants, update status, and open CVs when available.</p>
        </div>
        <button type="button" onclick="renderAdminApplications()">Reload View</button>
      </div>

      <div id="adminApplicationsTable">
        <div class="admin-skeleton">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  await refreshAdminApplications();
}

async function refreshAdminApplications(){
  try{
    adminState.applications = await fetchAdminApplications();
    renderAdminApplications();
  }catch(error){
    document.getElementById("adminApplicationsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load applications</strong>
        <span>${esc(error.message || "Please try again.")}</span>
      </div>
    `;
  }
}

function getApplicationApplicantName(app){
  return (
    app?.name ||
    app?.applicantName ||
    app?.userId?.name ||
    app?.talentId?.name ||
    app?.studentInfo?.name ||
    "Applicant"
  );
}

function getApplicationEmail(app){
  return (
    app?.email ||
    app?.applicantEmail ||
    app?.userId?.email ||
    app?.talentId?.email ||
    app?.studentInfo?.email ||
    ""
  );
}

function getApplicationJobTitle(app){
  return (
    app?.jobTitle ||
    app?.jobId?.title ||
    app?.job?.title ||
    "Job"
  );
}

function getApplicationType(app){
  return (
    app?.applicationType ||
    app?.type ||
    app?.jobId?.type ||
    "job"
  );
}

function getApplicationCv(app){
  return (
    app?.cvUrl ||
    app?.cv ||
    app?.resume ||
    app?.resumeUrl ||
    app?.studentInfo?.cvUrl ||
    app?.userId?.cvUrl ||
    app?.talentId?.cvUrl ||
    ""
  );
}

function getFilteredApplications(){
  let applications = [...adminState.applications];

  const search = normalize(adminState.filters.applications.search);
  const status = adminState.filters.applications.status;
  const type = adminState.filters.applications.type;

  if(search){
    applications = applications.filter(app => {
      const text = [
        getApplicationApplicantName(app),
        getApplicationEmail(app),
        getApplicationJobTitle(app),
        getApplicationType(app),
        app.status,
        app.message,
        app.coverLetter
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(status !== "all"){
    applications = applications.filter(app =>
      normalize(app.status || "new") === status
    );
  }

  if(type !== "all"){
    applications = applications.filter(app =>
      normalize(getApplicationType(app)) === type
    );
  }

  return applications;
}

function renderAdminApplications(){
  const box = document.getElementById("adminApplicationsTable");
  if(!box) return;

  const applications = getFilteredApplications();

  if(!applications.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No applications found</strong>
        <span>Try changing the search or filters.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${applications.length}</strong>
      <span>applications found</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Job</th>
            <th>Type</th>
            <th>Status</th>
            <th>CV</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${applications.map(app => adminApplicationRow(app)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function adminApplicationRow(app){
  const id = getId(app);
  const status = normalize(app.status || "new");
  const cv = getApplicationCv(app);

  return `
    <tr>
      <td>
        <div class="admin-user-cell">
          <img src="${esc(getAvatar(app.userId || app.talentId || app))}" alt="">
          <div>
            <strong>${esc(getApplicationApplicantName(app))}</strong>
            <span>${esc(getApplicationEmail(app))}</span>
          </div>
        </div>
      </td>

      <td>
        <strong>${esc(getApplicationJobTitle(app))}</strong>
      </td>

      <td>
        <span class="admin-badge blue">${esc(getApplicationType(app))}</span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">${esc(status)}</span>
      </td>

      <td>
        ${
          cv
            ? `<button type="button" class="admin-mini-link" onclick="openCvViewer('${esc(cv)}')">View CV</button>`
            : `<span class="admin-muted">No CV</span>`
        }
      </td>

      <td>${esc(formatDate(app.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button type="button" onclick="openApplicationReview('${esc(id)}')">Review</button>
          <button type="button" onclick="updateApplicationStatus('${esc(id)}','shortlisted')">Shortlist</button>
          <button type="button" onclick="updateApplicationStatus('${esc(id)}','interview')">Interview</button>
          <button type="button" class="danger" onclick="updateApplicationStatus('${esc(id)}','rejected')">Reject</button>
        </div>
      </td>
    </tr>
  `;
}

function openApplicationReview(applicationId){
  const app = adminState.applications.find(item => String(getId(item)) === String(applicationId));

  if(!app){
    adminToast("Application not found.");
    return;
  }

  const cv = getApplicationCv(app);
  const status = normalize(app.status || "new");

  openAdminReviewModal(
    "Application Review",
    `${getApplicationApplicantName(app)} • ${getApplicationJobTitle(app)}`,
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Applicant</span>
          <strong>${esc(getApplicationApplicantName(app))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Email</span>
          <strong>${esc(getApplicationEmail(app) || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Job</span>
          <strong>${esc(getApplicationJobTitle(app))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Application Type</span>
          <strong>${esc(getApplicationType(app))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(app.status || "new")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Date Applied</span>
          <strong>${esc(formatDateTime(app.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Cover Letter / Message</span>
          <strong>${esc(app.coverLetter || app.message || app.note || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Student Info</span>
          <strong>${esc(app.studentInfo ? JSON.stringify(app.studentInfo, null, 2) : "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>CV</span>
          <strong>
            ${
              cv
                ? `<button type="button" class="admin-btn ghost" onclick="openCvViewer('${esc(cv)}')">Open CV</button>`
                : `No CV attached`
            }
          </strong>
        </div>
      </div>
    `,
    `
      <button type="button" class="admin-btn" onclick="updateApplicationStatus('${esc(applicationId)}','shortlisted')">Shortlist</button>
      <button type="button" class="admin-btn" onclick="updateApplicationStatus('${esc(applicationId)}','interview')">Interview</button>
      <button type="button" class="admin-btn success" onclick="updateApplicationStatus('${esc(applicationId)}','hired')">Hire</button>
      <button type="button" class="admin-btn danger" onclick="updateApplicationStatus('${esc(applicationId)}','rejected')">Reject</button>
    `
  );
}

async function updateApplicationStatus(applicationId, status){
  const app = adminState.applications.find(item => String(getId(item)) === String(applicationId));

  if(!app){
    adminToast("Application not found.");
    return;
  }

  try{
    await adminPatchManyPossible(
      [
        `/api/applications/${encodeURIComponent(applicationId)}`,
        `/api/admin/applications/${encodeURIComponent(applicationId)}`,
        `/api/applications/${encodeURIComponent(applicationId)}/status`
      ],
      { status }
    );

    app.status = status;

    addAuditLog("Updated application status", getApplicationApplicantName(app), { status });
    adminToast(`Application marked as ${status}.`);

    closeAdminReviewModal();
    renderAdminApplications();
    renderOverviewStats();
  }catch(error){
    adminToast(error.message || "Unable to update application status.");
  }
}

function openCvViewer(url){
  if(!url){
    adminToast("No CV available.");
    return;
  }

  const safeUrl = esc(url);

  openAdminReviewModal(
    "CV Viewer",
    "Review applicant CV without downloading.",
    `
      <div class="admin-cv-viewer">
        ${
          String(url).toLowerCase().includes(".pdf")
            ? `<iframe src="${safeUrl}" title="Applicant CV"></iframe>`
            : `<div class="admin-empty">
                <strong>CV Preview</strong>
                <span>This file type may not preview inside the browser.</span>
                <a class="admin-btn" href="${safeUrl}" target="_blank" rel="noopener">Open CV</a>
              </div>`
        }
      </div>
    `,
    `
      <a class="admin-btn" href="${safeUrl}" target="_blank" rel="noopener">Open in New Tab</a>
    `
  );
}

function exportApplicationsCsv(){
  const rows = getFilteredApplications();
  const header = ["Applicant","Email","Job","Type","Status","Date"];

  const csv = [
    header.join(","),
    ...rows.map(app => [
      `"${String(getApplicationApplicantName(app)).replaceAll('"','""')}"`,
      `"${String(getApplicationEmail(app)).replaceAll('"','""')}"`,
      `"${String(getApplicationJobTitle(app)).replaceAll('"','""')}"`,
      `"${String(getApplicationType(app)).replaceAll('"','""')}"`,
      `"${String(app.status || "new").replaceAll('"','""')}"`,
      `"${formatDate(app.createdAt)}"`
    ].join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-applications-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported applications CSV", "applications");
  adminToast("Applications exported.");
}
/* =====================================================
   PART 8 / 20 — SCHOOLS & LMS MANAGEMENT
===================================================== */

async function loadAdminSchools(){
  const section = document.getElementById("schoolsSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search school, teacher, student, class..."
        value="${esc(adminState.filters.schools.search)}"
        oninput="adminState.filters.schools.search=this.value;renderAdminSchools()"
      >

      <select onchange="adminState.filters.schools.status=this.value;renderAdminSchools()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="pending">Pending</option>
      </select>

      <select onchange="adminState.filters.schools.verified=this.value;renderAdminSchools()">
        <option value="all">All Verification</option>
        <option value="verified">Verified</option>
        <option value="unverified">Unverified</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshAdminSchools()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="exportSchoolsReport()">Export</button>
    </div>

    <div class="admin-lms-grid">

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Schools</h2>
            <p>School accounts and verification state.</p>
          </div>
          <span class="admin-badge blue" id="schoolsCountBadge">0</span>
        </div>
        <div id="adminSchoolsTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Teachers</h2>
            <p>Teacher accounts connected to schools.</p>
          </div>
          <span class="admin-badge blue" id="teachersCountBadge">0</span>
        </div>
        <div id="adminTeachersTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Students</h2>
            <p>Student accounts and school learners.</p>
          </div>
          <span class="admin-badge blue" id="studentsCountBadge">0</span>
        </div>
        <div id="adminStudentsTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Classes</h2>
            <p>Class records from LMS.</p>
          </div>
          <span class="admin-badge blue" id="classesCountBadge">0</span>
        </div>
        <div id="adminClassesTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Assignments</h2>
            <p>Assignment records from LMS.</p>
          </div>
          <span class="admin-badge blue" id="assignmentsCountBadge">0</span>
        </div>
        <div id="adminAssignmentsTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Attendance</h2>
            <p>Attendance summaries and records.</p>
          </div>
          <span class="admin-badge blue" id="attendanceCountBadge">0</span>
        </div>
        <div id="adminAttendanceTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>

    </div>
  `;

  await refreshAdminSchools();
}

async function refreshAdminSchools(){
  try{
    const [users, classes, assignments, attendance] = await Promise.allSettled([
      fetchAdminUsers(),
      fetchAdminClasses(),
      fetchAdminAssignments(),
      fetchAdminAttendance()
    ]);

    adminState.users = users.status === "fulfilled" ? users.value : adminState.users;
    splitSchoolUsers();

    adminState.classes = classes.status === "fulfilled" ? classes.value : [];
    adminState.assignments = assignments.status === "fulfilled" ? assignments.value : [];
    adminState.attendance = attendance.status === "fulfilled" ? attendance.value : [];

    renderAdminSchools();
  }catch(error){
    adminToast(error.message || "Unable to refresh LMS data.");
  }
}

function getFilteredSchoolUsers(role){
  let list = adminState.users.filter(user => normalize(user.role) === role);

  const search = normalize(adminState.filters.schools.search);
  const status = adminState.filters.schools.status;
  const verified = adminState.filters.schools.verified;

  if(search){
    list = list.filter(user => {
      const text = [
        user.name,
        user.email,
        user.companyName,
        user.schoolName,
        user.headline,
        user.profession,
        user.location
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(status !== "all"){
    list = list.filter(user => normalize(user.status || "active") === status);
  }

  if(verified === "verified"){
    list = list.filter(user => isVerified(user));
  }

  if(verified === "unverified"){
    list = list.filter(user => !isVerified(user));
  }

  return list;
}

function renderAdminSchools(){
  const schools = getFilteredSchoolUsers("school");
  const teachers = getFilteredSchoolUsers("teacher");
  const students = getFilteredSchoolUsers("student");

  document.getElementById("schoolsCountBadge").textContent = schools.length;
  document.getElementById("teachersCountBadge").textContent = teachers.length;
  document.getElementById("studentsCountBadge").textContent = students.length;
  document.getElementById("classesCountBadge").textContent = adminState.classes.length;
  document.getElementById("assignmentsCountBadge").textContent = adminState.assignments.length;
  document.getElementById("attendanceCountBadge").textContent = adminState.attendance.length;

  renderSchoolUserMiniTable("adminSchoolsTable", schools, "school");
  renderSchoolUserMiniTable("adminTeachersTable", teachers, "teacher");
  renderSchoolUserMiniTable("adminStudentsTable", students, "student");
  renderClassesMiniTable();
  renderAssignmentsMiniTable();
  renderAttendanceMiniTable();
}

function renderSchoolUserMiniTable(containerId, rows, role){
  const box = document.getElementById(containerId);
  if(!box) return;

  if(!rows.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No ${esc(role)} records found</strong>
        <span>Try refreshing or changing filters.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap compact">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${rows.slice(0, 10).map(user => `
            <tr>
              <td>
                <div class="admin-user-cell">
                  <img src="${esc(getAvatar(user))}" alt="">
                  <div>
                    <strong>${esc(getDisplayName(user))}</strong>
                    <span>${esc(user.email || "")}</span>
                  </div>
                </div>
              </td>

              <td>
                <span class="admin-badge status-${esc(normalize(user.status || "active"))}">
                  ${esc(user.status || "active")}
                </span>
              </td>

              <td>
                <span class="admin-badge ${isVerified(user) ? "green" : "orange"}">
                  ${isVerified(user) ? "Yes" : "No"}
                </span>
              </td>

              <td>
                <div class="admin-actions">
                  <button type="button" onclick="openAdminUserDrawer('${esc(getId(user))}')">Open</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderClassesMiniTable(){
  const box = document.getElementById("adminClassesTable");
  if(!box) return;

  let classes = [...adminState.classes];
  const search = normalize(adminState.filters.schools.search);

  if(search){
    classes = classes.filter(item => {
      const text = [
        item.title,
        item.subject,
        item.description,
        item.schoolId?.schoolName,
        item.teacherId?.name,
        item.classCode
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(!classes.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No classes found</strong>
        <span>Classes will appear here when schools create them.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap compact">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Class</th>
            <th>Teacher</th>
            <th>Students</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${classes.slice(0, 12).map(item => `
            <tr>
              <td>
                <strong>${esc(item.title || item.name || "Class")}</strong>
                <span>${esc(item.subject || item.classCode || "")}</span>
              </td>

              <td>${esc(item.teacherId?.name || item.teacherName || "-")}</td>

              <td>${esc(Array.isArray(item.studentIds) ? item.studentIds.length : item.studentsCount || 0)}</td>

              <td>
                <div class="admin-actions">
                  <button type="button" onclick="openClassReview('${esc(getId(item))}')">Open</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAssignmentsMiniTable(){
  const box = document.getElementById("adminAssignmentsTable");
  if(!box) return;

  let assignments = [...adminState.assignments];
  const search = normalize(adminState.filters.schools.search);

  if(search){
    assignments = assignments.filter(item => {
      const text = [
        item.title,
        item.description,
        item.classId?.title,
        item.teacherId?.name,
        item.status
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(!assignments.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No assignments found</strong>
        <span>Assignments will appear here when teachers create them.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap compact">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Class</th>
            <th>Due</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${assignments.slice(0, 12).map(item => `
            <tr>
              <td>
                <strong>${esc(item.title || "Assignment")}</strong>
                <span>${esc(item.status || "")}</span>
              </td>

              <td>${esc(item.classId?.title || item.classTitle || "-")}</td>

              <td>${esc(formatDate(item.dueDate))}</td>

              <td>
                <div class="admin-actions">
                  <button type="button" onclick="openAssignmentReview('${esc(getId(item))}')">Open</button>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderAttendanceMiniTable(){
  const box = document.getElementById("adminAttendanceTable");
  if(!box) return;

  const records = [...adminState.attendance];

  if(!records.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No attendance records found</strong>
        <span>Attendance will appear after teachers mark students.</span>
      </div>
    `;
    return;
  }

  const summary = records.reduce((acc, item) => {
    const status = normalize(item.status || "unknown");
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  box.innerHTML = `
    <div class="system-health-grid">
      <div>
        <span>Present</span>
        <strong>${summary.present || 0}</strong>
      </div>
      <div>
        <span>Late</span>
        <strong>${summary.late || 0}</strong>
      </div>
      <div>
        <span>Absent</span>
        <strong>${summary.absent || 0}</strong>
      </div>
    </div>

    <div class="admin-table-wrap compact" style="margin-top:12px;">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Class</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          ${records.slice(0, 10).map(item => `
            <tr>
              <td>${esc(item.studentId?.name || item.studentName || "-")}</td>
              <td>${esc(item.classId?.title || item.classTitle || "-")}</td>
              <td>
                <span class="admin-badge status-${esc(normalize(item.status || "unknown"))}">
                  ${esc(item.status || "unknown")}
                </span>
              </td>
              <td>${esc(formatDate(item.date || item.createdAt))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function openClassReview(classId){
  const item = adminState.classes.find(row => String(getId(row)) === String(classId));

  if(!item){
    adminToast("Class not found.");
    return;
  }

  openAdminReviewModal(
    "Class Review",
    item.title || "Class",
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card wide">
          <span>Class Title</span>
          <strong>${esc(item.title || item.name || "Class")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Subject</span>
          <strong>${esc(item.subject || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Code</span>
          <strong>${esc(item.classCode || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Teacher</span>
          <strong>${esc(item.teacherId?.name || item.teacherName || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Students</span>
          <strong>${esc(Array.isArray(item.studentIds) ? item.studentIds.length : item.studentsCount || 0)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Created</span>
          <strong>${esc(formatDate(item.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Description</span>
          <strong>${esc(item.description || "-")}</strong>
        </div>
      </div>
    `,
    `
      <button type="button" class="admin-btn danger" onclick="confirmDeleteClass('${esc(classId)}')">Delete Class</button>
    `
  );
}

function openAssignmentReview(assignmentId){
  const item = adminState.assignments.find(row => String(getId(row)) === String(assignmentId));

  if(!item){
    adminToast("Assignment not found.");
    return;
  }

  openAdminReviewModal(
    "Assignment Review",
    item.title || "Assignment",
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card wide">
          <span>Title</span>
          <strong>${esc(item.title || "Assignment")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Class</span>
          <strong>${esc(item.classId?.title || item.classTitle || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Teacher</span>
          <strong>${esc(item.teacherId?.name || item.teacherName || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Due Date</span>
          <strong>${esc(formatDate(item.dueDate))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(item.status || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Description</span>
          <strong>${esc(item.description || item.instructions || "-")}</strong>
        </div>
      </div>
    `,
    `
      <button type="button" class="admin-btn danger" onclick="confirmDeleteAssignment('${esc(assignmentId)}')">Delete Assignment</button>
    `
  );
}

function confirmDeleteClass(classId){
  const item = adminState.classes.find(row => String(getId(row)) === String(classId));

  openAdminConfirm(
    "Delete class",
    `Delete "${item?.title || "this class"}"?`,
    async () => {
      try{
        await adminRequest(`/api/classes/${encodeURIComponent(classId)}`, {
          method: "DELETE"
        });

        adminState.classes = adminState.classes.filter(row => String(getId(row)) !== String(classId));

        addAuditLog("Deleted class", item?.title || classId);
        adminToast("Class deleted.");

        closeAdminReviewModal();
        renderAdminSchools();
      }catch(error){
        adminToast(error.message || "Unable to delete class.");
      }
    }
  );
}

function confirmDeleteAssignment(assignmentId){
  const item = adminState.assignments.find(row => String(getId(row)) === String(assignmentId));

  openAdminConfirm(
    "Delete assignment",
    `Delete "${item?.title || "this assignment"}"?`,
    async () => {
      try{
        await adminRequest(`/api/assignments/${encodeURIComponent(assignmentId)}`, {
          method: "DELETE"
        });

        adminState.assignments = adminState.assignments.filter(row => String(getId(row)) !== String(assignmentId));

        addAuditLog("Deleted assignment", item?.title || assignmentId);
        adminToast("Assignment deleted.");

        closeAdminReviewModal();
        renderAdminSchools();
      }catch(error){
        adminToast(error.message || "Unable to delete assignment.");
      }
    }
  );
}

function exportSchoolsReport(){
  const report = {
    exportedAt: new Date().toISOString(),
    schools: adminState.schools.length,
    teachers: adminState.teachers.length,
    students: adminState.students.length,
    classes: adminState.classes.length,
    assignments: adminState.assignments.length,
    attendance: adminState.attendance.length
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-lms-report-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported schools/LMS report", "schools");
  adminToast("Schools/LMS report exported.");
}
/* =====================================================
   PART 9 / 20 — CONTENT MODERATION
===================================================== */

async function loadContentModeration(){
  const section = document.getElementById("contentSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search posts, author, comments, reports..."
        value="${esc(adminState.filters.content.search)}"
        oninput="adminState.filters.content.search=this.value;renderContentModeration()"
      >

      <select onchange="adminState.filters.content.status=this.value;renderContentModeration()">
        <option value="all">All Status</option>
        <option value="visible">Visible</option>
        <option value="hidden">Hidden</option>
        <option value="reported">Reported</option>
      </select>

      <select onchange="adminState.filters.content.type=this.value;renderContentModeration()">
        <option value="all">All Content</option>
        <option value="post">Posts</option>
        <option value="comment">Comments</option>
        <option value="report">Reports</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshContentModeration()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="exportContentReport()">Export</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Content Moderation</h2>
          <p>Review posts, comments, reported content, and unsafe platform activity.</p>
        </div>
        <button type="button" onclick="renderContentModeration()">Reload View</button>
      </div>

      <div id="adminContentModerationTable">
        <div class="admin-skeleton">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  await refreshContentModeration();
}

async function refreshContentModeration(){
  try{
    const [posts, reports] = await Promise.allSettled([
      fetchAdminPosts(),
      fetchAdminReports()
    ]);

    adminState.posts = posts.status === "fulfilled" ? posts.value : [];
    adminState.reports = reports.status === "fulfilled" ? reports.value : [];

    renderContentModeration();
  }catch(error){
    document.getElementById("adminContentModerationTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load moderation records</strong>
        <span>${esc(error.message || "Please try again.")}</span>
      </div>
    `;
  }
}

function getPostAuthor(post){
  return (
    post?.author?.name ||
    post?.authorName ||
    post?.userId?.name ||
    post?.owner?.name ||
    "Unknown author"
  );
}

function getPostAuthorEmail(post){
  return (
    post?.author?.email ||
    post?.userId?.email ||
    post?.owner?.email ||
    ""
  );
}

function getContentStatus(item){
  if(item?.hidden === true || item?.isHidden === true) return "hidden";
  if(item?.reported === true || item?.reportsCount > 0) return "reported";
  return normalize(item?.status || "visible");
}

function getModerationItems(){
  const items = [];

  adminState.posts.forEach(post => {
    items.push({
      kind: "post",
      id: getId(post),
      title: getPostAuthor(post),
      subtitle: getPostAuthorEmail(post),
      text: post.text || post.content || post.caption || "",
      status: getContentStatus(post),
      date: post.createdAt,
      raw: post
    });

    if(Array.isArray(post.comments)){
      post.comments.forEach(comment => {
        items.push({
          kind: "comment",
          id: getId(comment) || `${getId(post)}:${comment._id || comment.id}`,
          postId: getId(post),
          title: comment.author?.name || comment.user?.name || comment.name || "Comment",
          subtitle: `On post by ${getPostAuthor(post)}`,
          text: comment.text || comment.content || "",
          status: comment.hidden || comment.isHidden ? "hidden" : "visible",
          date: comment.createdAt,
          raw: comment
        });
      });
    }
  });

  adminState.reports.forEach(report => {
    items.push({
      kind: "report",
      id: getId(report),
      title: report.reason || report.type || "Report",
      subtitle: report.reportedBy?.name || report.user?.name || report.email || "",
      text: report.description || report.message || report.text || "",
      status: normalize(report.status || "open"),
      date: report.createdAt,
      raw: report
    });
  });

  const search = normalize(adminState.filters.content.search);
  const status = adminState.filters.content.status;
  const type = adminState.filters.content.type;

  let filtered = items;

  if(search){
    filtered = filtered.filter(item => {
      const text = [
        item.kind,
        item.title,
        item.subtitle,
        item.text,
        item.status
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(type !== "all"){
    filtered = filtered.filter(item => item.kind === type);
  }

  if(status !== "all"){
    filtered = filtered.filter(item => {
      if(status === "reported"){
        return item.status === "reported" || item.kind === "report";
      }
      return item.status === status;
    });
  }

  filtered.sort((a,b) => new Date(b.date || 0) - new Date(a.date || 0));

  return filtered;
}

function renderContentModeration(){
  const box = document.getElementById("adminContentModerationTable");
  if(!box) return;

  const items = getModerationItems();

  if(!items.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No content records found</strong>
        <span>Try changing the moderation filters.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${items.length}</strong>
      <span>moderation records found</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Content</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${items.map(item => moderationRow(item)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function moderationRow(item){
  return `
    <tr>
      <td>
        <div>
          <strong>${esc(item.title || "Content")}</strong>
          <span>${esc(String(item.text || item.subtitle || "").slice(0, 100))}</span>
        </div>
      </td>

      <td>
        <span class="admin-badge blue">${esc(item.kind)}</span>
      </td>

      <td>
        <span class="admin-badge status-${esc(normalize(item.status))}">
          ${esc(item.status || "visible")}
        </span>
      </td>

      <td>${esc(formatDate(item.date))}</td>

      <td>
        <div class="admin-actions">
          <button type="button" onclick="openModerationReview('${esc(item.kind)}','${esc(item.id)}','${esc(item.postId || "")}')">Review</button>

          ${
            item.kind === "post"
              ? `<button type="button" onclick="togglePostHidden('${esc(item.id)}')">
                  ${item.status === "hidden" ? "Restore" : "Hide"}
                </button>`
              : ""
          }

          ${
            item.kind === "report"
              ? `<button type="button" class="success" onclick="updateReportStatus('${esc(item.id)}','resolved')">Resolve</button>`
              : ""
          }

          ${
            item.kind === "post"
              ? `<button type="button" class="danger" onclick="confirmDeletePost('${esc(item.id)}')">Delete</button>`
              : ""
          }
        </div>
      </td>
    </tr>
  `;
}

function findModerationItem(kind, id, postId = ""){
  if(kind === "post"){
    return adminState.posts.find(post => String(getId(post)) === String(id));
  }

  if(kind === "comment"){
    const post = adminState.posts.find(item => String(getId(item)) === String(postId));
    return post?.comments?.find(comment =>
      String(getId(comment) || comment._id || comment.id) === String(id.split(":").pop())
    );
  }

  if(kind === "report"){
    return adminState.reports.find(report => String(getId(report)) === String(id));
  }

  return null;
}

function openModerationReview(kind, id, postId = ""){
  const item = findModerationItem(kind, id, postId);

  if(!item){
    adminToast("Record not found.");
    return;
  }

  const title =
    kind === "post"
      ? getPostAuthor(item)
      : kind === "report"
        ? item.reason || item.type || "Report"
        : item.author?.name || item.user?.name || "Comment";

  const bodyText =
    item.text ||
    item.content ||
    item.caption ||
    item.description ||
    item.message ||
    "-";

  openAdminReviewModal(
    "Moderation Review",
    `${kind} • ${formatDateTime(item.createdAt)}`,
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Type</span>
          <strong>${esc(kind)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(getContentStatus(item))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Author / Reporter</span>
          <strong>${esc(title)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Date</span>
          <strong>${esc(formatDateTime(item.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Content</span>
          <strong>${esc(bodyText)}</strong>
        </div>

        ${
          Array.isArray(item.mediaUrls) || item.mediaUrl
            ? `<div class="admin-detail-card wide">
                <span>Media</span>
                <strong>${esc(Array.isArray(item.mediaUrls) ? item.mediaUrls.join(", ") : item.mediaUrl)}</strong>
              </div>`
            : ""
        }
      </div>
    `,
    `
      ${
        kind === "post"
          ? `<button type="button" class="admin-btn" onclick="togglePostHidden('${esc(id)}')">
              ${getContentStatus(item) === "hidden" ? "Restore Post" : "Hide Post"}
            </button>
            <button type="button" class="admin-btn danger" onclick="confirmDeletePost('${esc(id)}')">Delete Post</button>`
          : ""
      }

      ${
        kind === "report"
          ? `<button type="button" class="admin-btn success" onclick="updateReportStatus('${esc(id)}','resolved')">Resolve</button>
             <button type="button" class="admin-btn ghost" onclick="updateReportStatus('${esc(id)}','dismissed')">Dismiss</button>
             <button type="button" class="admin-btn danger" onclick="confirmDeleteReport('${esc(id)}')">Delete Report</button>`
          : ""
      }
    `
  );
}

async function togglePostHidden(postId){
  const post = adminState.posts.find(item => String(getId(item)) === String(postId));

  if(!post){
    adminToast("Post not found.");
    return;
  }

  const next = !(post.hidden === true || post.isHidden === true);

  try{
    await adminPatchManyPossible(
      [
        `/api/posts/${encodeURIComponent(postId)}`,
        `/api/admin/posts/${encodeURIComponent(postId)}`,
        `/api/posts/${encodeURIComponent(postId)}/moderation`
      ],
      {
        hidden: next,
        isHidden: next,
        status: next ? "hidden" : "visible"
      }
    );

    post.hidden = next;
    post.isHidden = next;
    post.status = next ? "hidden" : "visible";

    addAuditLog(next ? "Hid post" : "Restored post", postId);
    adminToast(next ? "Post hidden." : "Post restored.");

    closeAdminReviewModal();
    renderContentModeration();
  }catch(error){
    adminToast(error.message || "Unable to update post.");
  }
}

function confirmDeletePost(postId){
  const post = adminState.posts.find(item => String(getId(item)) === String(postId));

  openAdminConfirm(
    "Delete post",
    "Delete this post permanently?",
    async () => {
      try{
        await adminRequest(`/api/posts/${encodeURIComponent(postId)}`, {
          method: "DELETE"
        });

        adminState.posts = adminState.posts.filter(item => String(getId(item)) !== String(postId));

        addAuditLog("Deleted post", postId);
        adminToast("Post deleted.");

        closeAdminReviewModal();
        renderContentModeration();
      }catch(error){
        adminToast(error.message || "Unable to delete post.");
      }
    }
  );
}

async function updateReportStatus(reportId, status){
  const report = adminState.reports.find(item => String(getId(item)) === String(reportId));

  if(!report){
    adminToast("Report not found.");
    return;
  }

  try{
    await adminPatchManyPossible(
      [
        `/api/admin/reports/${encodeURIComponent(reportId)}`,
        `/api/reports/${encodeURIComponent(reportId)}`,
        `/api/support/reports/${encodeURIComponent(reportId)}`
      ],
      { status }
    );

    report.status = status;

    addAuditLog("Updated report status", reportId, { status });
    adminToast(`Report marked as ${status}.`);

    closeAdminReviewModal();
    renderContentModeration();
  }catch(error){
    adminToast(error.message || "Unable to update report. Backend route may be missing.");
  }
}

function confirmDeleteReport(reportId){
  openAdminConfirm(
    "Delete report",
    "Delete this report permanently?",
    async () => {
      try{
        await adminRequest(`/api/admin/reports/${encodeURIComponent(reportId)}`, {
          method: "DELETE"
        });

        adminState.reports = adminState.reports.filter(item => String(getId(item)) !== String(reportId));

        addAuditLog("Deleted report", reportId);
        adminToast("Report deleted.");

        closeAdminReviewModal();
        renderContentModeration();
      }catch(error){
        adminToast(error.message || "Unable to delete report. Backend route may be missing.");
      }
    }
  );
}

function exportContentReport(){
  const report = {
    exportedAt: new Date().toISOString(),
    posts: adminState.posts.length,
    reports: adminState.reports.length,
    hiddenPosts: adminState.posts.filter(post => post.hidden || post.isHidden).length,
    openReports: adminState.reports.filter(report =>
      ["open","pending","new"].includes(normalize(report.status || "open"))
    ).length
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-content-moderation-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported moderation report", "content");
  adminToast("Moderation report exported.");
}
/* =====================================================
   PART 10 / 20 — MEETINGS & CALLS LOGS
===================================================== */

async function loadAdminMeetings(){
  const section = document.getElementById("meetingsSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search meeting title, room, caller, participant..."
        value="${esc(adminState.filters.meetings.search)}"
        oninput="adminState.filters.meetings.search=this.value;renderAdminMeetings()"
      >

      <select onchange="adminState.filters.meetings.type=this.value;renderAdminMeetings()">
        <option value="all">All Types</option>
        <option value="meeting">Meetings</option>
        <option value="call">Calls</option>
      </select>

      <select onchange="adminState.filters.meetings.status=this.value;renderAdminMeetings()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="ended">Ended</option>
        <option value="missed">Missed</option>
        <option value="failed">Failed</option>
        <option value="scheduled">Scheduled</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshAdminMeetings()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="exportMeetingsReport()">Export</button>
    </div>

    <div class="admin-dashboard-grid">
      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Meeting Logs</h2>
            <p>Track AIFT meeting rooms and session activity.</p>
          </div>
          <span class="admin-badge blue" id="meetingsCountBadge">0</span>
        </div>

        <div id="adminMeetingsTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Call Logs</h2>
            <p>Failed, missed, active, and completed calls.</p>
          </div>
          <span class="admin-badge blue" id="callsCountBadge">0</span>
        </div>

        <div id="adminCallsTable">
          <div class="admin-skeleton"><span></span><span></span><span></span></div>
        </div>
      </article>
    </div>
  `;

  await refreshAdminMeetings();
}

async function refreshAdminMeetings(){
  try{
    const [meetings, calls] = await Promise.allSettled([
      fetchAdminMeetings(),
      fetchAdminCallLogs()
    ]);

    adminState.meetings = meetings.status === "fulfilled" ? meetings.value : [];
    adminState.callLogs = calls.status === "fulfilled" ? calls.value : [];

    renderAdminMeetings();
  }catch(error){
    adminToast(error.message || "Unable to refresh meeting logs.");
  }
}

function getFilteredMeetingLogs(){
  const search = normalize(adminState.filters.meetings.search);
  const status = adminState.filters.meetings.status;
  const type = adminState.filters.meetings.type;

  let meetings = adminState.meetings.map(item => ({
    ...item,
    __kind: "meeting"
  }));

  let calls = adminState.callLogs.map(item => ({
    ...item,
    __kind: "call"
  }));

  let rows = [...meetings, ...calls];

  if(type !== "all"){
    rows = rows.filter(item => item.__kind === type);
  }

  if(status !== "all"){
    rows = rows.filter(item => normalize(item.status || item.callStatus || "active") === status);
  }

  if(search){
    rows = rows.filter(item => {
      const text = [
        item.title,
        item.roomId,
        item.meetingId,
        item.callerId?.name,
        item.receiverId?.name,
        item.host?.name,
        item.createdBy?.name,
        item.status,
        item.callStatus
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  rows.sort((a,b) => new Date(b.createdAt || b.startedAt || 0) - new Date(a.createdAt || a.startedAt || 0));

  return rows;
}

function renderAdminMeetings(){
  const meetingsBox = document.getElementById("adminMeetingsTable");
  const callsBox = document.getElementById("adminCallsTable");

  const allRows = getFilteredMeetingLogs();
  const meetings = allRows.filter(row => row.__kind === "meeting");
  const calls = allRows.filter(row => row.__kind === "call");

  const meetingsBadge = document.getElementById("meetingsCountBadge");
  const callsBadge = document.getElementById("callsCountBadge");

  if(meetingsBadge) meetingsBadge.textContent = meetings.length;
  if(callsBadge) callsBadge.textContent = calls.length;

  if(meetingsBox){
    renderMeetingTable(meetingsBox, meetings, "meeting");
  }

  if(callsBox){
    renderMeetingTable(callsBox, calls, "call");
  }
}

function renderMeetingTable(box, rows, kind){
  if(!rows.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No ${esc(kind)} logs found</strong>
        <span>Logs will appear here when calls or meetings are recorded.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap compact">
      <table class="admin-table">
        <thead>
          <tr>
            <th>${kind === "meeting" ? "Meeting" : "Call"}</th>
            <th>Status</th>
            <th>Started</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          ${rows.slice(0, 30).map(item => `
            <tr>
              <td>
                <strong>${esc(item.title || item.roomId || item.meetingId || item.callId || "Session")}</strong>
                <span>${esc(getMeetingParticipants(item))}</span>
              </td>

              <td>
                <span class="admin-badge status-${esc(normalize(item.status || item.callStatus || "active"))}">
                  ${esc(item.status || item.callStatus || "active")}
                </span>
              </td>

              <td>${esc(formatDateTime(item.startedAt || item.createdAt))}</td>

              <td>
                <div class="admin-actions">
                  <button type="button" onclick="openMeetingReview('${esc(kind)}','${esc(getId(item))}')">Review</button>
                  ${
                    normalize(item.status || item.callStatus) === "active"
                      ? `<button type="button" class="danger" onclick="forceEndSession('${esc(kind)}','${esc(getId(item))}')">End</button>`
                      : ""
                  }
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function getMeetingParticipants(item){
  const names = [
    item.host?.name,
    item.createdBy?.name,
    item.callerId?.name,
    item.receiverId?.name,
    item.from?.name,
    item.to?.name
  ].filter(Boolean);

  if(Array.isArray(item.participants)){
    item.participants.forEach(p => {
      if(p?.name) names.push(p.name);
      if(typeof p === "string") names.push(p);
    });
  }

  return names.length ? [...new Set(names)].join(" • ") : "No participant data";
}

function openMeetingReview(kind, id){
  const source = kind === "meeting" ? adminState.meetings : adminState.callLogs;
  const item = source.find(row => String(getId(row)) === String(id));

  if(!item){
    adminToast("Session not found.");
    return;
  }

  openAdminReviewModal(
    kind === "meeting" ? "Meeting Review" : "Call Review",
    item.title || item.roomId || item.callId || "Session",
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Type</span>
          <strong>${esc(kind)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(item.status || item.callStatus || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Room / Call ID</span>
          <strong>${esc(item.roomId || item.meetingId || item.callId || id)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Started</span>
          <strong>${esc(formatDateTime(item.startedAt || item.createdAt))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Ended</span>
          <strong>${esc(formatDateTime(item.endedAt))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Duration</span>
          <strong>${esc(item.duration || item.durationSeconds || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Participants</span>
          <strong>${esc(getMeetingParticipants(item))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Raw Notes / Reason</span>
          <strong>${esc(item.reason || item.error || item.note || item.description || "-")}</strong>
        </div>
      </div>
    `,
    `
      ${
        normalize(item.status || item.callStatus) === "active"
          ? `<button type="button" class="admin-btn danger" onclick="forceEndSession('${esc(kind)}','${esc(id)}')">Force End</button>`
          : ""
      }
      <button type="button" class="admin-btn ghost" onclick="closeAdminReviewModal()">Close</button>
    `
  );
}

async function forceEndSession(kind, id){
  openAdminConfirm(
    "Force end session",
    "This will attempt to end this active meeting or call.",
    async () => {
      try{
        const endpoint =
          kind === "meeting"
            ? `/api/meetings/${encodeURIComponent(id)}`
            : `/api/call-logs/${encodeURIComponent(id)}`;

        await adminPatchManyPossible(
          [
            endpoint,
            `/api/admin/${kind}s/${encodeURIComponent(id)}`,
            `/api/admin/${kind}-logs/${encodeURIComponent(id)}`
          ],
          {
            status: "ended",
            callStatus: "ended",
            endedAt: new Date().toISOString()
          }
        );

        const list = kind === "meeting" ? adminState.meetings : adminState.callLogs;
        const item = list.find(row => String(getId(row)) === String(id));

        if(item){
          item.status = "ended";
          item.callStatus = "ended";
          item.endedAt = new Date().toISOString();
        }

        addAuditLog("Force ended session", id, { kind });
        adminToast("Session ended.");

        closeAdminReviewModal();
        renderAdminMeetings();
      }catch(error){
        adminToast(error.message || "Unable to end session. Backend route may be missing.");
      }
    }
  );
}

function exportMeetingsReport(){
  const report = {
    exportedAt: new Date().toISOString(),
    meetings: adminState.meetings.length,
    calls: adminState.callLogs.length,
    active: getFilteredMeetingLogs().filter(item =>
      normalize(item.status || item.callStatus) === "active"
    ).length,
    missed: getFilteredMeetingLogs().filter(item =>
      normalize(item.status || item.callStatus) === "missed"
    ).length,
    failed: getFilteredMeetingLogs().filter(item =>
      normalize(item.status || item.callStatus) === "failed"
    ).length
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-meetings-calls-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported meetings/calls report", "meetings");
  adminToast("Meetings report exported.");
}
/* =====================================================
   PART 11 / 20 — REPORTS & SUPPORT CENTER
===================================================== */

async function loadReportsCenter(){
  const section = document.getElementById("reportsSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search reports, users, reasons, descriptions..."
        value="${esc(adminState.filters.reports.search)}"
        oninput="adminState.filters.reports.search=this.value;renderReportsCenter()"
      >

      <select onchange="adminState.filters.reports.status=this.value;renderReportsCenter()">
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
        <option value="all">All Status</option>
      </select>

      <select onchange="adminState.filters.reports.type=this.value;renderReportsCenter()">
        <option value="all">All Types</option>
        <option value="user">User</option>
        <option value="post">Post</option>
        <option value="job">Job</option>
        <option value="message">Message</option>
        <option value="support">Support</option>
        <option value="bug">Bug</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshReportsCenter()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="exportReportsCenter()">Export</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Reports & Support</h2>
          <p>Review reports, support requests, abuse flags, and platform issues.</p>
        </div>
        <button type="button" onclick="renderReportsCenter()">Reload View</button>
      </div>

      <div id="adminReportsTable">
        <div class="admin-skeleton">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  await refreshReportsCenter();
}

async function refreshReportsCenter(){
  try{
    adminState.reports = await fetchAdminReports();
    renderReportsCenter();
  }catch(error){
    document.getElementById("adminReportsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load reports</strong>
        <span>${esc(error.message || "Please try again.")}</span>
      </div>
    `;
  }
}

function getReportTitle(report){
  return report?.reason || report?.subject || report?.title || report?.type || "Report";
}

function getReportReporter(report){
  return (
    report?.reportedBy?.name ||
    report?.reporter?.name ||
    report?.user?.name ||
    report?.name ||
    report?.email ||
    "Reporter"
  );
}

function getReportReporterEmail(report){
  return (
    report?.reportedBy?.email ||
    report?.reporter?.email ||
    report?.user?.email ||
    report?.email ||
    ""
  );
}

function getReportDescription(report){
  return report?.description || report?.message || report?.text || report?.details || "-";
}

function getFilteredReports(){
  let reports = [...adminState.reports];

  const search = normalize(adminState.filters.reports.search);
  const status = adminState.filters.reports.status;
  const type = adminState.filters.reports.type;

  if(search){
    reports = reports.filter(report => {
      const text = [
        getReportTitle(report),
        getReportReporter(report),
        getReportReporterEmail(report),
        getReportDescription(report),
        report.status,
        report.type,
        report.targetType
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(status !== "all"){
    reports = reports.filter(report => normalize(report.status || "open") === status);
  }

  if(type !== "all"){
    reports = reports.filter(report => {
      const text = [
        report.type,
        report.targetType,
        report.category
      ].join(" ").toLowerCase();

      return text.includes(type);
    });
  }

  reports.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return reports;
}

function renderReportsCenter(){
  const box = document.getElementById("adminReportsTable");
  if(!box) return;

  const reports = getFilteredReports();

  if(!reports.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No reports found</strong>
        <span>Try changing the report filters.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${reports.length}</strong>
      <span>reports found</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Report</th>
            <th>Reporter</th>
            <th>Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${reports.map(report => reportRow(report)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function reportRow(report){
  const id = getId(report);
  const status = normalize(report.status || "open");

  return `
    <tr>
      <td>
        <div>
          <strong>${esc(getReportTitle(report))}</strong>
          <span>${esc(getReportDescription(report).slice(0, 100))}</span>
        </div>
      </td>

      <td>
        <strong>${esc(getReportReporter(report))}</strong>
        <span>${esc(getReportReporterEmail(report))}</span>
      </td>

      <td>
        <span class="admin-badge blue">${esc(report.type || report.targetType || "report")}</span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">${esc(status)}</span>
      </td>

      <td>${esc(formatDate(report.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button type="button" onclick="openReportReview('${esc(id)}')">Review</button>
          <button type="button" class="success" onclick="updateReportStatus('${esc(id)}','resolved')">Resolve</button>
          <button type="button" onclick="updateReportStatus('${esc(id)}','dismissed')">Dismiss</button>
          <button type="button" class="danger" onclick="confirmDeleteReport('${esc(id)}')">Delete</button>
        </div>
      </td>
    </tr>
  `;
}

function openReportReview(reportId){
  const report = adminState.reports.find(item => String(getId(item)) === String(reportId));

  if(!report){
    adminToast("Report not found.");
    return;
  }

  openAdminReviewModal(
    "Report Review",
    `${getReportTitle(report)} • ${getReportReporter(report)}`,
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Subject</span>
          <strong>${esc(getReportTitle(report))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(report.status || "open")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Type</span>
          <strong>${esc(report.type || report.targetType || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Reporter</span>
          <strong>${esc(getReportReporter(report))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Email</span>
          <strong>${esc(getReportReporterEmail(report) || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Date</span>
          <strong>${esc(formatDateTime(report.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Description</span>
          <strong>${esc(getReportDescription(report))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Target</span>
          <strong>${esc(report.targetId || report.postId || report.userId || report.jobId || "-")}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Admin Notes</span>
          <strong>${esc(report.adminNotes || report.resolutionNote || "-")}</strong>
        </div>
      </div>
    `,
    `
      <button type="button" class="admin-btn success" onclick="updateReportStatus('${esc(reportId)}','resolved')">Resolve</button>
      <button type="button" class="admin-btn ghost" onclick="updateReportStatus('${esc(reportId)}','dismissed')">Dismiss</button>
      <button type="button" class="admin-btn danger" onclick="confirmDeleteReport('${esc(reportId)}')">Delete</button>
    `
  );
}

function exportReportsCenter(){
  const rows = getFilteredReports();
  const header = ["Title","Reporter","Email","Type","Status","Date"];

  const csv = [
    header.join(","),
    ...rows.map(report => [
      `"${String(getReportTitle(report)).replaceAll('"','""')}"`,
      `"${String(getReportReporter(report)).replaceAll('"','""')}"`,
      `"${String(getReportReporterEmail(report)).replaceAll('"','""')}"`,
      `"${String(report.type || report.targetType || "report").replaceAll('"','""')}"`,
      `"${String(report.status || "open").replaceAll('"','""')}"`,
      `"${formatDate(report.createdAt)}"`
    ].join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-reports-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported reports CSV", "reports");
  adminToast("Reports exported.");
}
/* =====================================================
   PART 12 / 20 — PAYMENTS CENTER
===================================================== */

async function loadPaymentsCenter(){
  const section = document.getElementById("paymentsSection");
  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        type="search"
        placeholder="Search payer, email, plan, reference..."
        value="${esc(adminState.filters.payments.search)}"
        oninput="adminState.filters.payments.search=this.value;renderPaymentsCenter()"
      >

      <select onchange="adminState.filters.payments.status=this.value;renderPaymentsCenter()">
        <option value="all">All Status</option>
        <option value="paid">Paid</option>
        <option value="pending">Pending</option>
        <option value="failed">Failed</option>
        <option value="refunded">Refunded</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <button type="button" class="admin-btn" onclick="refreshPaymentsCenter()">Refresh</button>
      <button type="button" class="admin-btn ghost" onclick="exportPaymentsCsv()">Export</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Payments</h2>
          <p>Monitor payment records, subscriptions, and revenue data.</p>
        </div>
        <button type="button" onclick="renderPaymentsCenter()">Reload View</button>
      </div>

      <div id="adminPaymentsTable">
        <div class="admin-skeleton">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  await refreshPaymentsCenter();
}

async function refreshPaymentsCenter(){
  try{
    adminState.payments = await fetchAdminPayments();
    renderPaymentsCenter();
  }catch(error){
    document.getElementById("adminPaymentsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load payments</strong>
        <span>${esc(error.message || "Backend payment route may be missing.")}</span>
      </div>
    `;
  }
}

function getPaymentPayer(payment){
  return (
    payment?.userId?.name ||
    payment?.payer?.name ||
    payment?.name ||
    payment?.customerName ||
    "Payer"
  );
}

function getPaymentEmail(payment){
  return (
    payment?.userId?.email ||
    payment?.payer?.email ||
    payment?.email ||
    payment?.customerEmail ||
    ""
  );
}

function getPaymentAmount(payment){
  const amount = payment?.amount || payment?.total || payment?.price || payment?.subscriptionAmount || 0;
  const currency = payment?.currency || "PHP";

  return `${currency} ${amount}`;
}

function getFilteredPayments(){
  let payments = [...adminState.payments];

  const search = normalize(adminState.filters.payments.search);
  const status = adminState.filters.payments.status;

  if(search){
    payments = payments.filter(payment => {
      const text = [
        getPaymentPayer(payment),
        getPaymentEmail(payment),
        payment.plan,
        payment.reference,
        payment.referenceId,
        payment.status,
        payment.currency
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(status !== "all"){
    payments = payments.filter(payment => normalize(payment.status || "pending") === status);
  }

  payments.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return payments;
}

function renderPaymentsCenter(){
  const box = document.getElementById("adminPaymentsTable");
  if(!box) return;

  const payments = getFilteredPayments();

  if(!payments.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No payments found</strong>
        <span>Payment records will appear here once your backend payment route is connected.</span>
      </div>
    `;
    return;
  }

  const total = payments.reduce((sum, payment) => {
    const amount = Number(payment.amount || payment.total || payment.price || 0);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${payments.length}</strong>
      <span>payments found • Estimated total: ${esc(total)}</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Payer</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Reference</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${payments.map(payment => paymentRow(payment)).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function paymentRow(payment){
  const id = getId(payment);
  const status = normalize(payment.status || "pending");

  return `
    <tr>
      <td>
        <strong>${esc(getPaymentPayer(payment))}</strong>
        <span>${esc(getPaymentEmail(payment))}</span>
      </td>

      <td>${esc(payment.plan || payment.subscriptionPlan || "-")}</td>

      <td>
        <span class="admin-badge green">${esc(getPaymentAmount(payment))}</span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">${esc(status)}</span>
      </td>

      <td>${esc(payment.reference || payment.referenceId || payment.transactionId || "-")}</td>

      <td>${esc(formatDate(payment.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button type="button" onclick="openPaymentReview('${esc(id)}')">Review</button>
          <button type="button" onclick="updatePaymentStatus('${esc(id)}','paid')">Mark Paid</button>
          <button type="button" class="danger" onclick="updatePaymentStatus('${esc(id)}','refunded')">Refunded</button>
        </div>
      </td>
    </tr>
  `;
}

function openPaymentReview(paymentId){
  const payment = adminState.payments.find(item => String(getId(item)) === String(paymentId));

  if(!payment){
    adminToast("Payment not found.");
    return;
  }

  openAdminReviewModal(
    "Payment Review",
    `${getPaymentPayer(payment)} • ${getPaymentAmount(payment)}`,
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Payer</span>
          <strong>${esc(getPaymentPayer(payment))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Email</span>
          <strong>${esc(getPaymentEmail(payment) || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Plan</span>
          <strong>${esc(payment.plan || payment.subscriptionPlan || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Amount</span>
          <strong>${esc(getPaymentAmount(payment))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(payment.status || "pending")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Reference</span>
          <strong>${esc(payment.reference || payment.referenceId || payment.transactionId || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Date</span>
          <strong>${esc(formatDateTime(payment.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Notes</span>
          <strong>${esc(payment.note || payment.description || "-")}</strong>
        </div>
      </div>
    `,
    `
      <button type="button" class="admin-btn success" onclick="updatePaymentStatus('${esc(paymentId)}','paid')">Mark Paid</button>
      <button type="button" class="admin-btn" onclick="updatePaymentStatus('${esc(paymentId)}','pending')">Mark Pending</button>
      <button type="button" class="admin-btn danger" onclick="updatePaymentStatus('${esc(paymentId)}','refunded')">Mark Refunded</button>
    `
  );
}

async function updatePaymentStatus(paymentId, status){
  const payment = adminState.payments.find(item => String(getId(item)) === String(paymentId));

  if(!payment){
    adminToast("Payment not found.");
    return;
  }

  try{
    await adminPatchManyPossible(
      [
        `/api/payments/${encodeURIComponent(paymentId)}`,
        `/api/admin/payments/${encodeURIComponent(paymentId)}`,
        `/api/subscriptions/${encodeURIComponent(paymentId)}`
      ],
      { status }
    );

    payment.status = status;

    addAuditLog("Updated payment status", paymentId, { status });
    adminToast(`Payment marked as ${status}.`);

    closeAdminReviewModal();
    renderPaymentsCenter();
  }catch(error){
    adminToast(error.message || "Unable to update payment. Backend route may be missing.");
  }
}

function exportPaymentsCsv(){
  const rows = getFilteredPayments();
  const header = ["Payer","Email","Plan","Amount","Status","Reference","Date"];

  const csv = [
    header.join(","),
    ...rows.map(payment => [
      `"${String(getPaymentPayer(payment)).replaceAll('"','""')}"`,
      `"${String(getPaymentEmail(payment)).replaceAll('"','""')}"`,
      `"${String(payment.plan || payment.subscriptionPlan || "").replaceAll('"','""')}"`,
      `"${String(getPaymentAmount(payment)).replaceAll('"','""')}"`,
      `"${String(payment.status || "pending").replaceAll('"','""')}"`,
      `"${String(payment.reference || payment.referenceId || payment.transactionId || "").replaceAll('"','""')}"`,
      `"${formatDate(payment.createdAt)}"`
    ].join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-payments-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  addAuditLog("Exported payments CSV", "payments");
  adminToast("Payments exported.");
}
/* =====================================================
   PART 13 / 20 — PLATFORM SETTINGS
===================================================== */

async function loadPlatformSettings(){
  const section = document.getElementById("settingsSection");
  if(!section) return;

  await refreshPlatformSettings(false);

  section.innerHTML = `
    <div class="admin-dashboard-grid">
      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Platform Controls</h2>
            <p>Control high-level platform availability and feature access.</p>
          </div>
          <button type="button" onclick="refreshPlatformSettings(true)">Refresh</button>
        </div>

        <div class="admin-settings-list">

          ${settingToggleRow(
            "maintenanceMode",
            "Maintenance Mode",
            "Temporarily restrict normal platform access while upgrades or fixes are happening.",
            adminState.settings.maintenanceMode
          )}

          ${settingToggleRow(
            "allowRegistration",
            "Allow Registration",
            "Allow new users, companies, schools, students, teachers, and job seekers to register.",
            adminState.settings.allowRegistration
          )}

          ${settingToggleRow(
            "allowMeetings",
            "Allow Meetings",
            "Allow users to start or join AIFT meetings and video sessions.",
            adminState.settings.allowMeetings
          )}

          ${settingToggleRow(
            "allowMessaging",
            "Allow Messaging",
            "Allow users to send and receive direct messages.",
            adminState.settings.allowMessaging
          )}

        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel-head">
          <div>
            <h2>Admin Security</h2>
            <p>Tools for admin session and account protection.</p>
          </div>
        </div>

        <div class="admin-settings-list">
          <div class="admin-setting-row">
            <div>
              <strong>Current Admin</strong>
              <span>${esc(adminState.me?.email || "admin")}</span>
            </div>
            <button type="button" onclick="runHealthCheck()">Run Health Check</button>
          </div>

          <div class="admin-setting-row">
            <div>
              <strong>Export Admin Report</strong>
              <span>Download system counts, settings, and latest local audit logs.</span>
            </div>
            <button type="button" onclick="exportAdminReport()">Export</button>
          </div>

          <div class="admin-setting-row danger-zone">
            <div>
              <strong>Logout</strong>
              <span>End this admin session safely.</span>
            </div>
            <button type="button" class="danger" onclick="adminLogout()">Logout</button>
          </div>
        </div>
      </article>
    </div>

    <article class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Backend Routes Needed for Full Production Settings</h2>
          <p>If these routes do not exist yet, this page saves settings safely in localStorage only.</p>
        </div>
      </div>

      <div class="admin-code-note">
        <pre>GET   /api/admin/platform-settings
PATCH /api/admin/platform-settings</pre>
      </div>
    </article>
  `;
}

function settingToggleRow(key, title, description, checked){
  return `
    <div class="admin-setting-row">
      <div>
        <strong>${esc(title)}</strong>
        <span>${esc(description)}</span>
      </div>

      <label class="admin-switch">
        <input
          type="checkbox"
          ${checked ? "checked" : ""}
          onchange="togglePlatformSetting('${esc(key)}', this.checked)"
        >
        <span></span>
      </label>
    </div>
  `;
}

async function refreshPlatformSettings(showToast = true){
  try{
    const data = await adminRequest("/api/admin/platform-settings");

    const settings = data.settings || data;

    adminState.settings = {
      ...adminState.settings,
      ...settings
    };

    localStorage.setItem("aiftAdminSettings", JSON.stringify(adminState.settings));

    if(showToast) adminToast("Platform settings loaded.");
  }catch(error){
    try{
      const saved = JSON.parse(localStorage.getItem("aiftAdminSettings") || "{}");
      adminState.settings = {
        ...adminState.settings,
        ...saved
      };
    }catch{}

    if(showToast){
      adminToast("Using local settings fallback. Backend settings route may be missing.");
    }
  }
}

async function togglePlatformSetting(key, value){
  const previous = adminState.settings[key];

  adminState.settings[key] = value;
  localStorage.setItem("aiftAdminSettings", JSON.stringify(adminState.settings));

  try{
    await adminJSON("/api/admin/platform-settings", "PATCH", {
      [key]: value
    });

    addAuditLog("Updated platform setting", key, { value });
    adminToast("Platform setting updated.");
  }catch(error){
    addAuditLog("Updated local platform setting", key, {
      value,
      fallback: true
    });

    adminToast("Saved locally. Backend settings route may be missing.");
  }

  if(adminState.currentSection === "settings"){
    loadPlatformSettings();
  }

  return previous;
}
/* =====================================================
   PART 14 / 20 — AUDIT LOGS CENTER
===================================================== */

async function loadAuditLogs(){
  const section = document.getElementById("auditSection");
  if(!section) return;

  loadLocalAuditLogs();

  section.innerHTML = `
    <div class="admin-filter-bar">
      <input
        id="auditSearchInput"
        type="search"
        placeholder="Search audit action, admin, target..."
        oninput="renderAuditLogs()"
      >

      <select id="auditRangeFilter" onchange="renderAuditLogs()">
        <option value="all">All Time</option>
        <option value="today">Today</option>
        <option value="7">Last 7 Days</option>
        <option value="30">Last 30 Days</option>
      </select>

      <button type="button" class="admin-btn" onclick="exportAuditLogs()">Export</button>
      <button type="button" class="admin-btn danger" onclick="confirmClearAuditLogs()">Clear Local Logs</button>
    </div>

    <div class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Audit Logs</h2>
          <p>Track admin actions performed from this control center.</p>
        </div>
        <button type="button" onclick="loadAuditLogs()">Reload</button>
      </div>

      <div id="adminAuditLogsTable"></div>
    </div>
  `;

  renderAuditLogs();
}

function getFilteredAuditLogs(){
  let logs = [...adminState.auditLogs];

  const search = normalize(document.getElementById("auditSearchInput")?.value || "");
  const range = document.getElementById("auditRangeFilter")?.value || "all";

  if(search){
    logs = logs.filter(log => {
      const text = [
        log.action,
        log.target,
        log.admin,
        JSON.stringify(log.details || {})
      ].join(" ").toLowerCase();

      return text.includes(search);
    });
  }

  if(range !== "all"){
    const now = new Date();
    let start = null;

    if(range === "today"){
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }else{
      start = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000);
    }

    logs = logs.filter(log => new Date(log.createdAt) >= start);
  }

  logs.sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  return logs;
}

function renderAuditLogs(){
  const box = document.getElementById("adminAuditLogsTable");
  if(!box) return;

  const logs = getFilteredAuditLogs();

  if(!logs.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No audit logs found</strong>
        <span>Admin actions will appear here after you use the control center.</span>
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-summary">
      <strong>${logs.length}</strong>
      <span>audit logs found</span>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Target</th>
            <th>Admin</th>
            <th>Date</th>
            <th>Details</th>
          </tr>
        </thead>

        <tbody>
          ${logs.map(log => `
            <tr>
              <td><strong>${esc(log.action || "-")}</strong></td>
              <td>${esc(log.target || "-")}</td>
              <td>${esc(log.admin || "-")}</td>
              <td>${esc(formatDateTime(log.createdAt))}</td>
              <td>
                <button type="button" onclick="openAuditLogReview('${esc(log.id)}')">
                  View
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function openAuditLogReview(logId){
  const log = adminState.auditLogs.find(item => String(item.id) === String(logId));

  if(!log){
    adminToast("Audit log not found.");
    return;
  }

  openAdminReviewModal(
    "Audit Log",
    log.action || "Admin action",
    `
      <div class="admin-detail-grid">
        <div class="admin-detail-card">
          <span>Action</span>
          <strong>${esc(log.action || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Target</span>
          <strong>${esc(log.target || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Admin</span>
          <strong>${esc(log.admin || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Date</span>
          <strong>${esc(formatDateTime(log.createdAt))}</strong>
        </div>

        <div class="admin-detail-card wide">
          <span>Details</span>
          <strong>${esc(JSON.stringify(log.details || {}, null, 2))}</strong>
        </div>
      </div>
    `,
    `
      <button type="button" class="admin-btn ghost" onclick="closeAdminReviewModal()">Close</button>
    `
  );
}

function exportAuditLogs(){
  const logs = getFilteredAuditLogs();

  const blob = new Blob([JSON.stringify(logs, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `aift-audit-logs-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  adminToast("Audit logs exported.");
}

function confirmClearAuditLogs(){
  openAdminConfirm(
    "Clear local audit logs",
    "This clears audit logs saved in this browser only. Server-side audit logs need a backend route.",
    () => {
      adminState.auditLogs = [];
      localStorage.removeItem("aiftAdminAuditLogs");
      adminToast("Local audit logs cleared.");
      renderAuditLogs();
    }
  );
}
/* =====================================================
   PART 15 / 20 — REUSABLE COMPONENTS + TABLE HELPERS
===================================================== */

function adminEmpty(title = "No records found", text = "Nothing to show yet."){
  return `
    <div class="admin-empty">
      <strong>${esc(title)}</strong>
      <span>${esc(text)}</span>
    </div>
  `;
}

function adminSkeleton(lines = 3){
  return `
    <div class="admin-skeleton">
      ${Array.from({ length: lines }).map(() => `<span></span>`).join("")}
    </div>
  `;
}

function adminBadge(text = "-", type = ""){
  return `
    <span class="admin-badge ${esc(type)}">
      ${esc(text)}
    </span>
  `;
}

function adminStatusBadge(status = "active"){
  const safeStatus = normalize(status || "active");

  return `
    <span class="admin-badge status-${esc(safeStatus)}">
      ${esc(safeStatus)}
    </span>
  `;
}

function adminRoleBadge(role = "member"){
  const safeRole = normalize(role || "member");

  return `
    <span class="admin-badge role-${esc(safeRole)}">
      ${esc(readableRole(safeRole))}
    </span>
  `;
}

function adminUserCell(item = {}){
  return `
    <div class="admin-user-cell">
      <img src="${esc(getAvatar(item))}" alt="">
      <div>
        <strong>${esc(getDisplayName(item))}</strong>
        <span>${esc(item.email || item.userId?.email || item.author?.email || "")}</span>
      </div>
    </div>
  `;
}

function adminDetailCard(label, value, wide = false){
  return `
    <div class="admin-detail-card ${wide ? "wide" : ""}">
      <span>${esc(label)}</span>
      <strong>${esc(value || "-")}</strong>
    </div>
  `;
}

function adminDetailCardHtml(label, html, wide = false){
  return `
    <div class="admin-detail-card ${wide ? "wide" : ""}">
      <span>${esc(label)}</span>
      <strong>${html || "-"}</strong>
    </div>
  `;
}

function adminTable(headers = [], rowsHtml = "", emptyTitle = "No records found"){
  if(!rowsHtml){
    return adminEmpty(emptyTitle, "Try refreshing or changing your filters.");
  }

  return `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            ${headers.map(header => `<th>${esc(header)}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

function adminTableSummary(count, label){
  return `
    <div class="admin-table-summary">
      <strong>${esc(count)}</strong>
      <span>${esc(label)}</span>
    </div>
  `;
}

function adminPanel(title, subtitle, bodyHtml, actionHtml = ""){
  return `
    <article class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>${esc(title)}</h2>
          <p>${esc(subtitle || "")}</p>
        </div>
        ${actionHtml || ""}
      </div>
      ${bodyHtml || ""}
    </article>
  `;
}

function adminActionButtons(buttons = []){
  return `
    <div class="admin-actions">
      ${buttons.map(button => `
        <button
          type="button"
          class="${esc(button.className || "")}"
          onclick="${button.onclick || ""}"
        >
          ${esc(button.label || "Action")}
        </button>
      `).join("")}
    </div>
  `;
}

function adminSafeLink(url, label = "Open"){
  if(!url) return `<span class="admin-muted">Not available</span>`;

  return `
    <a
      class="admin-mini-link"
      href="${esc(url)}"
      target="_blank"
      rel="noopener"
    >
      ${esc(label)}
    </a>
  `;
}

function downloadJson(filename, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function downloadCsv(filename, rows){
  const blob = new Blob([rows], {
    type: "text/csv"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

function csvEscape(value){
  return `"${String(value ?? "").replaceAll('"','""')}"`;
}

function copyToClipboard(value){
  navigator.clipboard
    .writeText(String(value || ""))
    .then(() => adminToast("Copied."))
    .catch(() => adminToast("Unable to copy."));
}

function adminTruncate(value, max = 100){
  const text = String(value || "");
  if(text.length <= max) return text;
  return text.slice(0, max) + "...";
}

function adminPercent(part, total){
  const p = Number(part || 0);
  const t = Number(total || 0);

  if(!t) return "0%";

  return Math.round((p / t) * 100) + "%";
}

function adminCountBy(list, key){
  return list.reduce((acc, item) => {
    const value = normalize(
      typeof key === "function"
        ? key(item)
        : item?.[key]
    ) || "unknown";

    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function adminSortNewest(list){
  return [...list].sort((a,b) =>
    new Date(b.createdAt || b.updatedAt || 0) -
    new Date(a.createdAt || a.updatedAt || 0)
  );
}

function adminFindById(list, id){
  return list.find(item => String(getId(item)) === String(id));
}

function setButtonLoading(button, loadingText = "Saving..."){
  if(!button) return;

  button.dataset.originalText = button.textContent;
  button.textContent = loadingText;
  button.disabled = true;
}

function clearButtonLoading(button){
  if(!button) return;

  button.textContent = button.dataset.originalText || "Save";
  button.disabled = false;
}

function adminFormValue(id){
  return document.getElementById(id)?.value?.trim() || "";
}

function adminChecked(id){
  return document.getElementById(id)?.checked === true;
}

function adminSetHtml(id, html){
  const box = document.getElementById(id);
  if(box) box.innerHTML = html;
}

function adminSetText(id, text){
  const box = document.getElementById(id);
  if(box) box.textContent = text;
}
/* =====================================================
   PART 16 / 20 — BACKEND SAFE HELPERS + FALLBACK NOTICES
===================================================== */

const ADMIN_BACKEND_ROUTES_NEEDED = {
  platformSettings: [
    "GET /api/admin/platform-settings",
    "PATCH /api/admin/platform-settings"
  ],
  reports: [
    "GET /api/admin/reports",
    "PATCH /api/admin/reports/:id",
    "DELETE /api/admin/reports/:id"
  ],
  meetings: [
    "GET /api/admin/meeting-logs",
    "PATCH /api/admin/meeting-logs/:id"
  ],
  calls: [
    "GET /api/admin/call-logs",
    "PATCH /api/admin/call-logs/:id"
  ],
  payments: [
    "GET /api/admin/payments",
    "PATCH /api/admin/payments/:id"
  ],
  auditLogs: [
    "GET /api/admin/audit-logs",
    "POST /api/admin/audit-logs"
  ],
  userAdmin: [
    "PATCH /api/admin/users/:id",
    "PATCH /api/admin/users/:id/status",
    "PATCH /api/admin/users/:id/role",
    "POST /api/admin/users/:id/reset-password"
  ]
};

function openBackendRoutesNeeded(category = "all"){
  const routes =
    category === "all"
      ? ADMIN_BACKEND_ROUTES_NEEDED
      : { [category]: ADMIN_BACKEND_ROUTES_NEEDED[category] || [] };

  const html = Object.entries(routes).map(([key, values]) => `
    <div class="admin-detail-card wide">
      <span>${esc(key)}</span>
      <strong>${esc(values.join("\n"))}</strong>
    </div>
  `).join("");

  openAdminReviewModal(
    "Backend Routes Needed",
    "Add these routes for complete production admin control.",
    `<div class="admin-detail-grid">${html}</div>`,
    `<button type="button" class="admin-btn ghost" onclick="closeAdminReviewModal()">Close</button>`
  );
}

function showMissingRouteNotice(feature, routes = []){
  openAdminReviewModal(
    "Backend Route Missing",
    feature,
    `
      <div class="admin-empty">
        <strong>This feature is ready in the admin frontend.</strong>
        <span>The backend route is missing or not responding. Add the route below to enable this action fully.</span>
      </div>

      <div class="admin-code-note">
        <pre>${esc(routes.join("\n"))}</pre>
      </div>
    `,
    `<button type="button" class="admin-btn ghost" onclick="closeAdminReviewModal()">Close</button>`
  );
}

async function adminDeleteManyPossible(endpoints = []){
  let lastError = null;

  for(const endpoint of endpoints){
    try{
      return await adminRequest(endpoint, { method: "DELETE" });
    }catch(error){
      lastError = error;
    }
  }

  throw lastError || new Error("No delete endpoint worked.");
}

async function adminPostManyPossible(endpoints = [], payload = {}){
  let lastError = null;

  for(const endpoint of endpoints){
    try{
      return await adminJSON(endpoint, "POST", payload);
    }catch(error){
      lastError = error;
    }
  }

  throw lastError || new Error("No post endpoint worked.");
}

function adminFallbackRecordNotice(title, body){
  return `
    <div class="admin-empty">
      <strong>${esc(title)}</strong>
      <span>${esc(body)}</span>
    </div>
  `;
}

function markLocalOnlyChange(collectionName, id, changes){
  const list = adminState[collectionName];

  if(!Array.isArray(list)) return false;

  const item = list.find(row => String(getId(row)) === String(id));

  if(!item) return false;

  Object.assign(item, changes, {
    _adminLocalOnly: true,
    _adminLocalUpdatedAt: new Date().toISOString()
  });

  return true;
}

function openLocalOnlyWarning(){
  openAdminReviewModal(
    "Local Fallback Warning",
    "Some data may only be changed on this browser.",
    `
      <div class="admin-empty">
        <strong>Backend route not available.</strong>
        <span>
          The admin UI can show the action, but for real production control,
          the backend must save the change in MongoDB.
        </span>
      </div>

      <div class="admin-code-note">
        <pre>${esc(JSON.stringify(ADMIN_BACKEND_ROUTES_NEEDED, null, 2))}</pre>
      </div>
    `,
    `<button type="button" class="admin-btn ghost" onclick="closeAdminReviewModal()">Close</button>`
  );
}

function renderRouteStatusPanel(){
  return `
    <article class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Backend Production Checklist</h2>
          <p>Frontend is ready. Missing backend routes will show safe fallback notices.</p>
        </div>
        <button type="button" onclick="openBackendRoutesNeeded('all')">View Routes</button>
      </div>

      <div class="admin-feed-list">
        <div class="admin-feed-item">
          <div class="admin-feed-icon">A</div>
          <div>
            <strong>Admin user management</strong>
            <p>Needs PATCH routes for role, status, verification, and password reset.</p>
          </div>
        </div>

        <div class="admin-feed-item">
          <div class="admin-feed-icon">S</div>
          <div>
            <strong>Settings</strong>
            <p>Needs platform settings collection and protected admin routes.</p>
          </div>
        </div>

        <div class="admin-feed-item">
          <div class="admin-feed-icon">L</div>
          <div>
            <strong>Logs</strong>
            <p>Needs server-side audit logs, meeting logs, and call logs.</p>
          </div>
        </div>
      </div>
    </article>
  `;
}
/* =====================================================
   PART 17 / 20 — ANALYTICS HELPERS + PLATFORM INSIGHTS
===================================================== */

function getRoleStats(){
  return adminCountBy(adminState.users, user => normalize(user.role || "member"));
}

function getJobStats(){
  return adminCountBy(adminState.jobs, job => normalize(job.status || "active"));
}

function getApplicationStats(){
  return adminCountBy(adminState.applications, app => normalize(app.status || "new"));
}

function getReportStats(){
  return adminCountBy(adminState.reports, report => normalize(report.status || "open"));
}

function getAttendanceStats(){
  return adminCountBy(adminState.attendance, record => normalize(record.status || "unknown"));
}

function calculatePlatformInsights(){
  const roleStats = getRoleStats();
  const jobStats = getJobStats();
  const appStats = getApplicationStats();
  const reportStats = getReportStats();
  const attendanceStats = getAttendanceStats();

  const totalUsers = adminState.users.length;
  const verifiedUsers = adminState.users.filter(user => isVerified(user)).length;
  const activeJobs = adminState.jobs.filter(job => normalize(job.status || "active") === "active").length;
  const hiredApplications = adminState.applications.filter(app => normalize(app.status) === "hired").length;
  const openReports = adminState.reports.filter(report =>
    ["open","pending","new"].includes(normalize(report.status || "open"))
  ).length;

  return {
    totalUsers,
    verifiedUsers,
    verificationRate: adminPercent(verifiedUsers, totalUsers),
    activeJobs,
    jobApprovalRate: adminPercent(activeJobs, adminState.jobs.length),
    hiredApplications,
    hiringRate: adminPercent(hiredApplications, adminState.applications.length),
    openReports,
    roleStats,
    jobStats,
    appStats,
    reportStats,
    attendanceStats
  };
}

function renderPlatformInsightsPanel(containerId = "platformInsightsPanel"){
  const box = document.getElementById(containerId);
  if(!box) return;

  const insights = calculatePlatformInsights();

  box.innerHTML = `
    <article class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Platform Insights</h2>
          <p>Quick platform health and performance indicators.</p>
        </div>
        <button type="button" onclick="refreshAdminData()">Refresh</button>
      </div>

      <div class="admin-insights-grid">
        <div class="admin-insight-card">
          <span>Verification Rate</span>
          <strong>${esc(insights.verificationRate)}</strong>
          <small>${esc(insights.verifiedUsers)} verified of ${esc(insights.totalUsers)}</small>
        </div>

        <div class="admin-insight-card">
          <span>Active Job Rate</span>
          <strong>${esc(insights.jobApprovalRate)}</strong>
          <small>${esc(insights.activeJobs)} active jobs</small>
        </div>

        <div class="admin-insight-card">
          <span>Hiring Rate</span>
          <strong>${esc(insights.hiringRate)}</strong>
          <small>${esc(insights.hiredApplications)} hired applications</small>
        </div>

        <div class="admin-insight-card">
          <span>Open Reports</span>
          <strong>${esc(insights.openReports)}</strong>
          <small>Need support/moderation review</small>
        </div>
      </div>
    </article>
  `;
}

function openPlatformInsightsReview(){
  const insights = calculatePlatformInsights();

  openAdminReviewModal(
    "Platform Insights",
    "Detailed admin analytics summary.",
    `
      <div class="admin-detail-grid">
        ${adminDetailCard("Total Users", insights.totalUsers)}
        ${adminDetailCard("Verified Users", insights.verifiedUsers)}
        ${adminDetailCard("Verification Rate", insights.verificationRate)}
        ${adminDetailCard("Active Jobs", insights.activeJobs)}
        ${adminDetailCard("Job Approval Rate", insights.jobApprovalRate)}
        ${adminDetailCard("Hired Applications", insights.hiredApplications)}
        ${adminDetailCard("Hiring Rate", insights.hiringRate)}
        ${adminDetailCard("Open Reports", insights.openReports)}
        ${adminDetailCard("Role Stats", JSON.stringify(insights.roleStats, null, 2), true)}
        ${adminDetailCard("Job Stats", JSON.stringify(insights.jobStats, null, 2), true)}
        ${adminDetailCard("Application Stats", JSON.stringify(insights.appStats, null, 2), true)}
        ${adminDetailCard("Attendance Stats", JSON.stringify(insights.attendanceStats, null, 2), true)}
      </div>
    `,
    `<button type="button" class="admin-btn ghost" onclick="closeAdminReviewModal()">Close</button>`
  );
}

function renderMiniStatsGrid(targetId, cards = []){
  const box = document.getElementById(targetId);
  if(!box) return;

  box.innerHTML = `
    <div class="admin-stats-grid">
      ${cards.map(card => `
        <article class="admin-stat-card">
          <span>${esc(card.label)}</span>
          <strong>${esc(card.value)}</strong>
          <small>${esc(card.note || "")}</small>
        </article>
      `).join("")}
    </div>
  `;
}

function getGrowthLabel(list, dateField = "createdAt"){
  const now = new Date();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recent = list.filter(item => {
    const date = new Date(item?.[dateField] || 0);
    return date >= sevenDaysAgo && date <= now;
  }).length;

  return `${recent} new in last 7 days`;
}

function renderAdminDashboardChartsFallback(targetId){
  const box = document.getElementById(targetId);
  if(!box) return;

  const roles = getRoleStats();
  const jobs = getJobStats();
  const apps = getApplicationStats();

  box.innerHTML = `
    <article class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <h2>Analytics Summary</h2>
          <p>Text-based analytics until chart styling is added in CSS.</p>
        </div>
        <button type="button" onclick="openPlatformInsightsReview()">Details</button>
      </div>

      <div class="admin-detail-grid">
        ${adminDetailCard("Users by Role", JSON.stringify(roles, null, 2), true)}
        ${adminDetailCard("Jobs by Status", JSON.stringify(jobs, null, 2), true)}
        ${adminDetailCard("Applications by Status", JSON.stringify(apps, null, 2), true)}
      </div>
    </article>
  `;
}
/* =====================================================
   PART 18 / 20 — ROUTE ALIASES + HTML COMPATIBILITY
===================================================== */

function closeVerificationModal(){
  closeAdminReviewModal();
}

function closeAdminModal(){
  closeAllAdminOverlays();
}

function openUserDrawer(userId){
  openAdminUserDrawer(userId);
}

function openJobReview(jobId){
  openAdminJobReview(jobId);
}

function openPostReview(postId){
  openModerationReview("post", postId, "");
}

function openReportDrawer(reportId){
  openReportReview(reportId);
}

function openPaymentDrawer(paymentId){
  openPaymentReview(paymentId);
}

function openMeetingDrawer(kind, id){
  openMeetingReview(kind, id);
}

function approveJob(jobId){
  return updateAdminJobStatus(jobId, "active");
}

function suspendJob(jobId){
  return updateAdminJobStatus(jobId, "suspended");
}

function rejectJob(jobId){
  return updateAdminJobStatus(jobId, "rejected");
}

function deleteJob(jobId){
  return confirmDeleteAdminJob(jobId);
}

function approveVerification(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(user && isVerified(user)) return adminToast("Account is already verified.");
  return toggleVerificationStatus(userId);
}

function removeVerification(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(user && !isVerified(user)) return adminToast("Account is already unverified.");
  return toggleVerificationStatus(userId);
}

function suspendUser(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(user && normalize(user.status) === "suspended") return adminToast("User is already suspended.");
  return toggleAdminUserStatus(userId);
}

function activateUser(userId){
  const user = adminState.users.find(item => String(getId(item)) === String(userId));
  if(user && normalize(user.status || "active") === "active") return adminToast("User is already active.");
  return toggleAdminUserStatus(userId);
}

function resetUserPassword(userId){
  return openAdminResetPassword(userId);
}

function changeUserRole(userId){
  return openAdminRoleChange(userId);
}

function deleteUser(userId){
  return confirmDeleteAdminUser(userId);
}

function resolveReport(reportId){
  return updateReportStatus(reportId, "resolved");
}

function dismissReport(reportId){
  return updateReportStatus(reportId, "dismissed");
}

function deleteReport(reportId){
  return confirmDeleteReport(reportId);
}

function hidePost(postId){
  const post = adminState.posts.find(item => String(getId(item)) === String(postId));
  if(post && getContentStatus(post) === "hidden") return adminToast("Post is already hidden.");
  return togglePostHidden(postId);
}

function restorePost(postId){
  const post = adminState.posts.find(item => String(getId(item)) === String(postId));
  if(post && getContentStatus(post) !== "hidden") return adminToast("Post is already visible.");
  return togglePostHidden(postId);
}

function deletePost(postId){
  return confirmDeletePost(postId);
}

function markApplicationShortlisted(applicationId){
  return updateApplicationStatus(applicationId, "shortlisted");
}

function markApplicationInterview(applicationId){
  return updateApplicationStatus(applicationId, "interview");
}

function markApplicationHired(applicationId){
  return updateApplicationStatus(applicationId, "hired");
}

function rejectApplication(applicationId){
  return updateApplicationStatus(applicationId, "rejected");
}

function markPaymentPaid(paymentId){
  return updatePaymentStatus(paymentId, "paid");
}

function markPaymentPending(paymentId){
  return updatePaymentStatus(paymentId, "pending");
}

function markPaymentRefunded(paymentId){
  return updatePaymentStatus(paymentId, "refunded");
}

function refreshCurrentAdminSection(){
  const section = adminState.currentSection || "overview";
  const config = ADMIN_SECTIONS[section];
  const loader = window[config?.loader];

  if(typeof loader === "function"){
    return loader();
  }

  return loadOverview();
}

function clearAdminGlobalSearch(){
  const input = document.getElementById("adminGlobalSearch");
  if(input) input.value = "";
  refreshCurrentAdminSection();
}

function adminGoHome(){
  window.location.href = "home.html";
}

function adminOpenPublicProfile(userId){
  if(!userId){
    adminToast("User ID not available.");
    return;
  }

  window.open(`public-profile.html?id=${encodeURIComponent(userId)}`, "_blank", "noopener");
}

function adminOpenEmployerProfile(userId){
  if(!userId){
    adminToast("Employer ID not available.");
    return;
  }

  window.open(`employer-public-profile.html?id=${encodeURIComponent(userId)}`, "_blank", "noopener");
}

function adminOpenAgentProfile(userId){
  if(!userId){
    adminToast("Profile ID not available.");
    return;
  }

  window.open(`agent-public-profile.html?id=${encodeURIComponent(userId)}`, "_blank", "noopener");
}

function adminOpenJobPage(jobId){
  if(!jobId){
    adminToast("Job ID not available.");
    return;
  }

  window.open(`job.html?id=${encodeURIComponent(jobId)}`, "_blank", "noopener");
}

function adminOpenClassPage(classId){
  if(!classId){
    adminToast("Class ID not available.");
    return;
  }

  window.open(`class-builder.html?id=${encodeURIComponent(classId)}`, "_blank", "noopener");
}

function adminOpenMessages(){
  window.open("messages.html", "_blank", "noopener");
}

function adminOpenNotifications(){
  window.open("notifications.html", "_blank", "noopener");
}
/* =====================================================
   PART 19 / 20 — STARTUP FINALIZERS + EVENT SAFETY
===================================================== */

function verifyAdminHtmlRequirements(){
  const requiredIds = [
    "adminToast",
    "adminLoader",
    "adminConfirmModal",
    "adminFormModal",
    "adminReviewModal",
    "adminBulkModal",
    "adminDrawer",
    "adminSidebar",
    "adminPageTitle",
    "adminPageSubtitle",
    "adminGlobalSearch",
    "overviewSection",
    "usersSection",
    "verificationSection",
    "jobsSection",
    "applicationsSection",
    "schoolsSection",
    "contentSection",
    "meetingsSection",
    "reportsSection",
    "paymentsSection",
    "settingsSection",
    "auditSection"
  ];

  const missing = requiredIds.filter(id => !document.getElementById(id));

  if(missing.length){
    console.warn("Admin HTML missing IDs:", missing);
    adminToast("Some admin HTML containers are missing. Check admin.html.");
  }

  return missing.length === 0;
}

function bindAdminNavigation(){
  document.querySelectorAll(".admin-nav button[data-section]").forEach(button => {
    button.addEventListener("click", () => {
      const section = button.dataset.section;
      switchAdminSection(section, button);
    });
  });
}

function bindAdminKeyboardShortcuts(){
  document.addEventListener("keydown", event => {
    const tag = normalize(event.target?.tagName);

    if(tag === "input" || tag === "textarea" || tag === "select"){
      return;
    }

    if(event.key === "/"){
      event.preventDefault();
      document.getElementById("adminGlobalSearch")?.focus();
    }

    if(event.key === "Escape"){
      closeAllAdminOverlays();
      toggleAdminSidebar(false);
    }

    if(event.key.toLowerCase() === "r"){
      refreshCurrentAdminSection();
    }

    if(event.key.toLowerCase() === "h"){
      runHealthCheck();
    }
  });
}

function bindAdminConfirmButton(){
  document.addEventListener("click", event => {
    if(event.target?.id === "adminConfirmBtn"){
      const action = adminState.confirmAction;
      closeAdminConfirm();

      if(typeof action === "function"){
        action();
      }
    }
  });
}

function bindAdminOutsideClicks(){
  document.addEventListener("click", event => {
    if(event.target?.id === "adminBackdrop"){
      closeAllAdminOverlays();
    }

    if(event.target?.classList?.contains("admin-modal")){
      closeAllAdminOverlays();
    }
  });
}

function bindAdminGlobalSearchSubmit(){
  const input = document.getElementById("adminGlobalSearch");

  if(!input) return;

  input.addEventListener("keydown", event => {
    if(event.key === "Escape"){
      input.value = "";
      clearAdminGlobalSearch();
    }
  });
}

function bindAdminNetworkWatchers(){
  window.addEventListener("online", () => {
    adminToast("Back online.");
    runHealthCheck();
  });

  window.addEventListener("offline", () => {
    adminToast("You are offline.");
    adminSetText("sidebarApiStatus", "Offline");
  });
}

function bindAdminResizeWatcher(){
  window.addEventListener("resize", () => {
    if(window.innerWidth > 900){
      toggleAdminSidebar(false);
    }
  });
}

function restoreAdminLastSection(){
  const hash = String(window.location.hash || "").replace("#", "");
  const saved = localStorage.getItem("aiftAdminLastSection");
  const section = ADMIN_SECTIONS[hash] ? hash : ADMIN_SECTIONS[saved] ? saved : "overview";

  switchAdminSection(section);
}

function saveAdminLastSection(section){
  if(ADMIN_SECTIONS[section]){
    localStorage.setItem("aiftAdminLastSection", section);
  }
}

function updateAdminLocationHash(section){
  if(!ADMIN_SECTIONS[section]) return;

  if(window.location.hash !== "#" + section){
    history.replaceState(null, "", "#" + section);
  }
}

function enhanceSwitchAdminSection(){
  const originalSwitch = switchAdminSection;

  window.switchAdminSection = function(section, button = null){
    originalSwitch(section, button);
    saveAdminLastSection(section);
    updateAdminLocationHash(section);
  };
}

function listenToAdminHashChanges(){
  window.addEventListener("hashchange", () => {
    const section = String(window.location.hash || "").replace("#", "");

    if(ADMIN_SECTIONS[section]){
      switchAdminSection(section);
    }
  });
}

function prepareAdminRuntime(){
  verifyAdminHtmlRequirements();
  bindAdminNavigation();
  bindAdminKeyboardShortcuts();
  bindAdminConfirmButton();
  bindAdminOutsideClicks();
  bindAdminGlobalSearchSubmit();
  bindAdminNetworkWatchers();
  bindAdminResizeWatcher();
  enhanceSwitchAdminSection();
  listenToAdminHashChanges();
}

function adminBrowserSupportCheck(){
  const unsupported = [];

  if(!window.fetch) unsupported.push("fetch");
  if(!window.localStorage) unsupported.push("localStorage");
  if(!window.Promise) unsupported.push("Promise");

  if(unsupported.length){
    alert("Your browser is missing required features: " + unsupported.join(", "));
    return false;
  }

  return true;
}

function adminSecurityNotice(){
  if(location.protocol !== "https:" && location.hostname !== "localhost" && location.hostname !== "127.0.0.1"){
    console.warn("Admin page should run on HTTPS in production.");
  }
}

function adminInitFailureScreen(error){
  const content = document.getElementById("adminContent");

  if(content){
    content.innerHTML = `
      <section class="admin-section">
        <article class="admin-panel">
          <div class="admin-empty">
            <strong>Admin failed to initialize</strong>
            <span>${esc(error.message || "Please login again or refresh the page.")}</span>
          </div>

          <div class="admin-actions" style="margin-top:14px;">
            <button type="button" onclick="window.location.reload()">Refresh</button>
            <button type="button" class="danger" onclick="adminLogout(true)">Login Again</button>
          </div>
        </article>
      </section>
    `;
  }
}

function syncAdminSidebarStatus(){
  adminSetText("sidebarApiStatus", "Online");
  adminSetText("sidebarDbStatus", "Connected");
  adminSetText("sidebarSocketStatus", "Ready");
}

function finalizeAdminStartup(){
  syncAdminSidebarStatus();

  if(window.location.hash){
    const section = String(window.location.hash).replace("#", "");
    if(ADMIN_SECTIONS[section]){
      switchAdminSection(section);
      return;
    }
  }

  switchAdminSection("overview");
}
/* =====================================================
   PART 20 / 20 — FINAL INITIALIZATION + COMPLETION
===================================================== */

async function initAdmin(){
  if(!adminBrowserSupportCheck()) return;

  adminSecurityNotice();

  try{
    showAdminLoader();
    prepareAdminRuntime();

    adminState.token = getAdminToken();
    adminState.role = getUserRole();

    loadLocalAuditLogs();

    try{
      const savedSettings = JSON.parse(localStorage.getItem("aiftAdminSettings") || "{}");
      adminState.settings = {
        ...adminState.settings,
        ...savedSettings
      };
    }catch{}

    if(!adminState.token || adminState.role !== "admin"){
      adminLogout(true);
      return;
    }

    const meData = await adminRequest("/api/users/me");
    adminState.me = meData.user || meData;

    if(normalize(adminState.me?.role) !== "admin"){
      adminToast("Admin access only.");
      setTimeout(() => {
        window.location.href = "home.html";
      }, 800);
      return;
    }

    localStorage.setItem("adminToken", adminState.token);
    localStorage.setItem("token", adminState.token);
    localStorage.setItem("role", "admin");
    localStorage.setItem("userId", getId(adminState.me));

    adminSetText("adminMiniName", adminState.me.name || "AIFT Admin");
    adminSetText("adminMiniRole", "Admin");

    const miniAvatar = document.getElementById("adminMiniAvatar");
    if(miniAvatar){
      miniAvatar.src = getAvatar(adminState.me);
    }

    await runHealthCheck();

    addAuditLog("Admin session started", adminState.me.email || "admin");

    adminState.initialized = true;

    finalizeAdminStartup();

  }catch(error){
    console.error("Admin initialization error:", error);
    adminToast(error.message || "Unable to initialize admin.");
    adminInitFailureScreen(error);
  }finally{
    hideAdminLoader();
  }
}

function reinstallAdminInitListener(){
  document.removeEventListener("DOMContentLoaded", initAdmin);
  document.addEventListener("DOMContentLoaded", initAdmin);
}

reinstallAdminInitListener();

/* =====================================================
   FINAL SAFETY: EXPOSE IMPORTANT FUNCTIONS
===================================================== */

window.initAdmin = initAdmin;
window.switchAdminSection = window.switchAdminSection || switchAdminSection;
window.refreshAdminData = refreshAdminData;
window.adminLogout = adminLogout;
window.toggleAdminSidebar = toggleAdminSidebar;

window.closeAdminConfirm = closeAdminConfirm;
window.closeAdminFormModal = closeAdminFormModal;
window.closeAdminReviewModal = closeAdminReviewModal;
window.closeAdminBulkModal = closeAdminBulkModal;
window.closeAdminDrawer = closeAdminDrawer;
window.closeAllAdminOverlays = closeAllAdminOverlays;

window.loadOverview = loadOverview;
window.loadAdminUsers = loadAdminUsers;
window.loadVerificationCenter = loadVerificationCenter;
window.loadAdminJobs = loadAdminJobs;
window.loadAdminApplications = loadAdminApplications;
window.loadAdminSchools = loadAdminSchools;
window.loadContentModeration = loadContentModeration;
window.loadAdminMeetings = loadAdminMeetings;
window.loadReportsCenter = loadReportsCenter;
window.loadPaymentsCenter = loadPaymentsCenter;
window.loadPlatformSettings = loadPlatformSettings;
window.loadAuditLogs = loadAuditLogs;

window.handleAdminGlobalSearch = handleAdminGlobalSearch;
window.openAdminQuickCreate = openAdminQuickCreate;
window.runHealthCheck = runHealthCheck;
window.exportAdminReport = exportAdminReport;

window.openAdminUserDrawer = openAdminUserDrawer;
window.toggleAdminUserVerified = toggleAdminUserVerified;
window.toggleAdminUserStatus = toggleAdminUserStatus;
window.openAdminRoleChange = openAdminRoleChange;
window.submitAdminRoleChange = submitAdminRoleChange;
window.openAdminResetPassword = openAdminResetPassword;
window.submitAdminPasswordReset = submitAdminPasswordReset;
window.confirmDeleteAdminUser = confirmDeleteAdminUser;
window.exportUsersCsv = exportUsersCsv;

window.openVerificationReview = openVerificationReview;
window.toggleVerificationStatus = toggleVerificationStatus;

window.openAdminJobReview = openAdminJobReview;
window.updateAdminJobStatus = updateAdminJobStatus;
window.confirmDeleteAdminJob = confirmDeleteAdminJob;
window.exportJobsCsv = exportJobsCsv;

window.openApplicationReview = openApplicationReview;
window.updateApplicationStatus = updateApplicationStatus;
window.openCvViewer = openCvViewer;
window.exportApplicationsCsv = exportApplicationsCsv;

window.openClassReview = openClassReview;
window.openAssignmentReview = openAssignmentReview;
window.confirmDeleteClass = confirmDeleteClass;
window.confirmDeleteAssignment = confirmDeleteAssignment;
window.exportSchoolsReport = exportSchoolsReport;

window.openModerationReview = openModerationReview;
window.togglePostHidden = togglePostHidden;
window.confirmDeletePost = confirmDeletePost;
window.updateReportStatus = updateReportStatus;
window.confirmDeleteReport = confirmDeleteReport;
window.exportContentReport = exportContentReport;

window.openMeetingReview = openMeetingReview;
window.forceEndSession = forceEndSession;
window.exportMeetingsReport = exportMeetingsReport;

window.openReportReview = openReportReview;
window.exportReportsCenter = exportReportsCenter;

window.openPaymentReview = openPaymentReview;
window.updatePaymentStatus = updatePaymentStatus;
window.exportPaymentsCsv = exportPaymentsCsv;

window.togglePlatformSetting = togglePlatformSetting;
window.refreshPlatformSettings = refreshPlatformSettings;

window.openAuditLogReview = openAuditLogReview;
window.exportAuditLogs = exportAuditLogs;
window.confirmClearAuditLogs = confirmClearAuditLogs;

window.openBackendRoutesNeeded = openBackendRoutesNeeded;
window.openLocalOnlyWarning = openLocalOnlyWarning;

console.log("AIFT Admin Control Center loaded successfully.");
function toggleNotificationCenter(){
  document.getElementById("adminNotificationCenter")?.classList.toggle("hidden");
}
window.toggleNotificationCenter = toggleNotificationCenter;
