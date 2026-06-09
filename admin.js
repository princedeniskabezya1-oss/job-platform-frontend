/* =====================================
   AIFT ADMIN CONTROL CENTER
===================================== */

const API_BASE =
  "https://backend-1-9b6f.onrender.com";

const adminState = {

  token: "",
  role: "",
  me: null,

  currentSection: "overview",

  users: [],
  jobs: [],
  applications: [],
  schools: [],
  reports: [],
  posts: [],
  meetings: [],

  loading: false,

userFilters:{
  search:"",
  role:"all",
  status:"all"
},

verificationFilters:{
  search:"",
  role:"all",
  status:"pending"
},

jobFilters:{
  search:"",
  status:"all",
  type:"all"
},

applicationFilters:{
  search:"",
  status:"all",
  type:"all"
},

schoolFilters:{
  search:"",
  status:"all",
  verified:"all"
},

contentFilters:{
  search:"",
  status:"all",
  type:"all"
},

meetingFilters:{
  search:"",
  type:"all",
  status:"all"
},

reportFilters:{
  search:"",
  status:"open",
  type:"all"
},
  drawerData: null,
  confirmAction: null

};
function getAdminToken(){

  return (
    localStorage.getItem("adminToken") ||
    localStorage.getItem("token") ||
    ""
  );

}

function getUserRole(){

  return String(
    localStorage.getItem("role") || ""
  ).toLowerCase();

}
function adminToast(message){

  const toast =
    document.getElementById("adminToast");

  if(!toast) return;

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(window.adminToastTimer);

  window.adminToastTimer =
    setTimeout(()=>{

      toast.classList.remove("show");

    },3000);

}
function showAdminLoader(){

  document
    .getElementById("adminLoader")
    ?.classList
    .remove("hidden");

}

function hideAdminLoader(){

  document
    .getElementById("adminLoader")
    ?.classList
    .add("hidden");

}
async function adminRequest(
  endpoint,
  options = {}
){

  const response =
    await fetch(
      API_BASE + endpoint,
      {
        ...options,

        headers:{
          Authorization:
            "Bearer " +
            adminState.token,

          ...(options.headers || {})
        }
      }
    );

  const data =
    await response.json()
      .catch(()=>({}));

  if(!response.ok){

    throw new Error(
      data.message ||
      "Request failed"
    );

  }

  return data;

}
function closeAdminConfirm(){

  document
    .getElementById("adminConfirmModal")
    ?.classList
    .add("hidden");

}
function openAdminConfirm(
  title,
  text,
  callback
){

  document
    .getElementById("adminConfirmTitle")
    .textContent = title;

  document
    .getElementById("adminConfirmText")
    .textContent = text;

  document
    .getElementById("adminConfirmModal")
    ?.classList
    .remove("hidden");

  adminState.confirmAction =
    callback;

}
document.addEventListener(
  "click",
  event=>{

    if(
      event.target.id ===
      "adminConfirmBtn"
    ){

      adminState.confirmAction?.();

      closeAdminConfirm();

    }

  }
);
function openAdminDrawer(
  title,
  subtitle,
  html
){

  document
    .getElementById("adminDrawerTitle")
    .textContent = title;

  document
    .getElementById("adminDrawerSubtitle")
    .textContent = subtitle;

  document
    .getElementById("adminDrawerBody")
    .innerHTML = html;

  document
    .getElementById("adminDrawer")
    ?.classList
    .remove("hidden");

}
function closeAdminDrawer(){

  document
    .getElementById("adminDrawer")
    ?.classList
    .add("hidden");

}
function toggleAdminSidebar(
  show = true
){

  const sidebar =
    document.getElementById(
      "adminSidebar"
    );

  if(!sidebar) return;

  sidebar.classList[
    show
      ? "add"
      : "remove"
  ]("show");

}
function switchAdminSection(
  section,
  button = null
){

  adminState.currentSection =
    section;

  document
    .querySelectorAll(
      ".admin-section"
    )
    .forEach(el=>{

      el.classList.add("hidden");

    });

  document
    .getElementById(
      section + "Section"
    )
    ?.classList
    .remove("hidden");
if(section === "overview"){
  loadOverview();
}

if(section === "users"){
  loadAdminUsers();
}
  if(section === "verification"){
  loadVerificationCenter();
}
  if(section === "jobs"){
  loadAdminJobs();
}
  if(section === "applications"){
  loadAdminApplications();
}
  if(section === "schools"){
  loadAdminSchools();
}
  if(section === "content"){
  loadContentModeration();
}

  document
    .querySelectorAll(
      ".admin-nav button"
    )
    .forEach(btn=>{

      btn.classList.remove(
        "active"
      );

    });

  button?.classList.add(
    "active"
  );

}
async function initAdmin(){

  try{

    showAdminLoader();

    adminState.token =
      getAdminToken();

    adminState.role =
      getUserRole();

    if(
      !adminState.token
    ){

      location.href =
        "login.html";

      return;

    }

    const me =
      await adminRequest(
        "/api/users/me"
      );

    adminState.me =
      me.user || me;

    if(
      String(
        adminState.me.role
      ).toLowerCase()
      !==
      "admin"
    ){

      adminToast(
        "Admin access only"
      );

      setTimeout(()=>{

        location.href =
          "home.html";

      },1500);

      return;

    }

    document
      .getElementById(
        "adminMiniName"
      )
      .textContent =
      adminState.me.name ||
      "Admin";

    await loadOverview();

hideAdminLoader();

  }catch(error){

    console.error(error);

    adminToast(
      error.message
    );

    hideAdminLoader();

  }

}
document.addEventListener(
  "DOMContentLoaded",
  initAdmin
);
/* =====================================
   OVERVIEW DASHBOARD
===================================== */

async function loadOverview(){

  const content =
    document.getElementById("overviewSection");

  if(!content) return;

  setOverviewLoading();

  const [
    users,
    jobs,
    applications,
    posts,
    meetings
  ] = await Promise.allSettled([
    fetchAdminUsers(),
    fetchAdminJobs(),
    fetchAdminApplications(),
    fetchAdminPosts(),
    fetchAdminMeetings()
  ]);

  adminState.users =
    users.status === "fulfilled"
      ? users.value
      : [];

  adminState.jobs =
    jobs.status === "fulfilled"
      ? jobs.value
      : [];

  adminState.applications =
    applications.status === "fulfilled"
      ? applications.value
      : [];

  adminState.posts =
    posts.status === "fulfilled"
      ? posts.value
      : [];

  adminState.meetings =
    meetings.status === "fulfilled"
      ? meetings.value
      : [];

  renderOverviewStats();
  renderPlatformActivity();
  renderAdminNotifications();
  renderVerificationQueue();
  renderSystemHealth();

}
async function fetchAdminUsers(){

  try{

    const data =
      await adminRequest("/api/users");

    return Array.isArray(data)
      ? data
      : data.users || [];

  }catch(error){

    console.warn("Users load failed:", error.message);
    return [];

  }

}

async function fetchAdminJobs(){

  try{

    const data =
      await adminRequest("/api/jobs/admin/all");

    return Array.isArray(data)
      ? data
      : data.jobs || [];

  }catch(error){

    console.warn("Jobs admin endpoint failed, trying public jobs:", error.message);

    try{

      const fallback =
        await adminRequest("/api/jobs");

      return Array.isArray(fallback)
        ? fallback
        : fallback.jobs || [];

    }catch{
      return [];
    }

  }

}

async function fetchAdminApplications(){

  try{

    const data =
      await adminRequest("/api/applications");

    return Array.isArray(data)
      ? data
      : data.applications || [];

  }catch(error){

    console.warn("Applications load failed:", error.message);
    return [];

  }

}

async function fetchAdminPosts(){

  try{

    const data =
      await adminRequest("/api/posts");

    return Array.isArray(data)
      ? data
      : data.posts || [];

  }catch(error){

    console.warn("Posts load failed:", error.message);
    return [];

  }

}

async function fetchAdminMeetings(){

  try{

    const data =
      await adminRequest("/api/meetings");

    return Array.isArray(data)
      ? data
      : data.meetings || [];

  }catch(error){

    console.warn("Meetings load failed:", error.message);
    return [];

  }

}
function setOverviewLoading(){

  document.getElementById("totalUsersValue").textContent = "...";
  document.getElementById("totalJobsValue").textContent = "...";
  document.getElementById("totalApplicationsValue").textContent = "...";
  document.getElementById("pendingReviewsValue").textContent = "...";

  const activity =
    document.getElementById("platformActivityFeed");

  if(activity){
    activity.innerHTML = `
      <div class="admin-skeleton">
        <span></span>
        <span></span>
        <span></span>
      </div>
    `;
  }

}
function renderOverviewStats(){

  const users =
    adminState.users || [];

  const jobs =
    adminState.jobs || [];

  const applications =
    adminState.applications || [];

  const pendingJobs =
    jobs.filter(job =>
      ["pending","review","draft"].includes(
        String(job.status || "").toLowerCase()
      )
    );

  const unverifiedUsers =
    users.filter(user =>
      user.aiftVerified !== true &&
      user.isVerified !== true
    );

  const pendingReviews =
    pendingJobs.length + unverifiedUsers.length;

  document.getElementById("totalUsersValue").textContent =
    users.length;

  document.getElementById("totalJobsValue").textContent =
    jobs.length;

  document.getElementById("totalApplicationsValue").textContent =
    applications.length;

  document.getElementById("pendingReviewsValue").textContent =
    pendingReviews;

  document.getElementById("totalUsersTrend").textContent =
    "All platform roles included";

  document.getElementById("totalJobsTrend").textContent =
    `${pendingJobs.length} pending review`;

  document.getElementById("totalApplicationsTrend").textContent =
    "Jobs and internships";

  document.getElementById("pendingReviewsTrend").textContent =
    pendingReviews > 0
      ? "Needs admin attention"
      : "All clear";

}
function renderPlatformActivity(){

  const box =
    document.getElementById("platformActivityFeed");

  if(!box) return;

  const users =
    [...(adminState.users || [])]
      .slice(-4)
      .reverse();

  const jobs =
    [...(adminState.jobs || [])]
      .slice(-4)
      .reverse();

  const apps =
    [...(adminState.applications || [])]
      .slice(-4)
      .reverse();

  const activities = [];

  users.forEach(user=>{
    activities.push({
      title:"New user joined",
      text:`${user.name || user.companyName || user.schoolName || "User"} joined as ${user.role || "member"}.`
    });
  });

  jobs.forEach(job=>{
    activities.push({
      title:"Job activity",
      text:`${job.title || "Job"} from ${job.company || job.companyName || "company"} is ${job.status || "active"}.`
    });
  });

  apps.forEach(app=>{
    activities.push({
      title:"Application received",
      text:`${app.name || app.applicantName || "Applicant"} applied for ${app.jobId?.title || app.jobTitle || "a job"}.`
    });
  });

  if(!activities.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No activity yet</strong>
        Platform activity will appear here.
      </div>
    `;
    return;
  }

  box.innerHTML =
    activities
      .slice(0,8)
      .map(item=>`
        <div class="admin-feed-item">
          <div class="admin-feed-icon">•</div>
          <div>
            <strong>${esc(item.title)}</strong>
            <p>${esc(item.text)}</p>
          </div>
        </div>
      `)
      .join("");

}
function renderAdminNotifications(){

  const box =
    document.getElementById("adminNotifications");

  if(!box) return;

  const users =
    adminState.users || [];

  const jobs =
    adminState.jobs || [];

  const unverified =
    users.filter(user =>
      user.aiftVerified !== true &&
      user.isVerified !== true &&
      ["employer","school","agent","teacher"].includes(
        String(user.role || "").toLowerCase()
      )
    );

  const pendingJobs =
    jobs.filter(job =>
      ["pending","review","draft"].includes(
        String(job.status || "").toLowerCase()
      )
    );

  box.innerHTML = `
    <div class="admin-feed-list">

      <div class="admin-feed-item">
        <div class="admin-feed-icon">!</div>
        <div>
          <strong>${unverified.length} verification items</strong>
          <p>Companies, schools, recruiters, and teachers waiting for admin review.</p>
        </div>
      </div>

      <div class="admin-feed-item">
        <div class="admin-feed-icon">!</div>
        <div>
          <strong>${pendingJobs.length} job reviews</strong>
          <p>Jobs that may need approval, suspension, or moderation.</p>
        </div>
      </div>

    </div>
  `;

}
function renderVerificationQueue(){

  const box =
    document.getElementById("verificationQueue");

  if(!box) return;

  const queue =
    (adminState.users || [])
      .filter(user =>
        user.aiftVerified !== true &&
        user.isVerified !== true &&
        ["employer","school","agent","teacher"].includes(
          String(user.role || "").toLowerCase()
        )
      )
      .slice(0,6);

  if(!queue.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No pending verification</strong>
        All important accounts are currently clear.
      </div>
    `;
    return;
  }

  box.innerHTML =
    queue.map(user=>`
      <div class="admin-feed-item">
        <div class="admin-feed-icon">✓</div>
        <div>
          <strong>${esc(user.companyName || user.schoolName || user.name || "User")}</strong>
          <p>${esc(user.role || "member")} • ${esc(user.email || "")}</p>
        </div>
      </div>
    `).join("");

}
function renderSystemHealth(){

  const apiHealth =
    document.getElementById("apiHealth");

  const databaseHealth =
    document.getElementById("databaseHealth");

  const socketHealth =
    document.getElementById("socketHealth");

  if(apiHealth){
    apiHealth.textContent = "Online";
  }

  if(databaseHealth){
    databaseHealth.textContent =
      adminState.users.length || adminState.jobs.length
        ? "Connected"
        : "Checking";
  }

  if(socketHealth){
    socketHealth.textContent = "Ready";
  }

}
/* =====================================
   USER MANAGEMENT
===================================== */

async function loadAdminUsers(){

  const section =
    document.getElementById("usersSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="adminUserSearch"
             placeholder="Search name, email, company, school..."
             value="${esc(adminState.userFilters.search)}"
             oninput="adminState.userFilters.search=this.value; renderAdminUsers()">

      <select id="adminRoleFilter"
              onchange="adminState.userFilters.role=this.value; renderAdminUsers()">
        <option value="all">All Roles</option>
        <option value="admin">Admin</option>
        <option value="employer">Employer</option>
        <option value="agent">Recruiter</option>
        <option value="talent">Job Seeker</option>
        <option value="school">School</option>
        <option value="teacher">Teacher</option>
        <option value="student">Student</option>
      </select>

      <select id="adminStatusFilter"
              onchange="adminState.userFilters.status=this.value; renderAdminUsers()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="pending">Pending</option>
        <option value="verified">Verified</option>
        <option value="unverified">Unverified</option>
      </select>

      <button class="admin-btn"
              onclick="refreshAdminUsers()">
        Refresh
      </button>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Platform Users</h2>
        <button onclick="openAdminCreateUserModal()">Create User</button>
      </div>

      <div id="adminUsersTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshAdminUsers();

}
async function refreshAdminUsers(){

  try{

    adminState.users =
      await fetchAdminUsers();

    renderAdminUsers();

  }catch(error){

    console.error(error);

    document.getElementById("adminUsersTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load users</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderAdminUsers(){

  const box =
    document.getElementById("adminUsersTable");

  if(!box) return;

  let users =
    [...(adminState.users || [])];

  const search =
    String(adminState.userFilters.search || "")
      .toLowerCase();

  const role =
    adminState.userFilters.role;

  const status =
    adminState.userFilters.status;

  if(search){
    users = users.filter(user =>
      [
        user.name,
        user.email,
        user.companyName,
        user.schoolName,
        user.headline,
        user.profession,
        user.location
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(role !== "all"){
    users = users.filter(user =>
      String(user.role || "").toLowerCase() === role
    );
  }

  if(status !== "all"){

    if(status === "verified"){
      users = users.filter(user =>
        user.aiftVerified === true ||
        user.isVerified === true
      );
    }else if(status === "unverified"){
      users = users.filter(user =>
        user.aiftVerified !== true &&
        user.isVerified !== true
      );
    }else{
      users = users.filter(user =>
        String(user.status || "active").toLowerCase() === status
      );
    }

  }

  if(!users.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No users found</strong>
        Try changing the filters or search keyword.
      </div>
    `;
    return;
  }

  box.innerHTML = `
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
          ${
            users.map(user=>adminUserRow(user)).join("")
          }
        </tbody>
      </table>
    </div>
  `;

}
function adminUserRow(user){

  const id =
    getId(user);

  const name =
    user.companyName ||
    user.schoolName ||
    user.name ||
    "AIFT User";

  const email =
    user.email || "";

  const avatar =
    user.profileImage ||
    user.logo ||
    user.avatar ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const role =
    String(user.role || "member").toLowerCase();

  const status =
    String(user.status || "active").toLowerCase();

  const verified =
    user.aiftVerified === true ||
    user.isVerified === true;

  return `
    <tr>
      <td>
        <div class="admin-user-cell">
          <img src="${esc(avatar)}" alt="">
          <div>
            <strong>${esc(name)}</strong>
            <span>${esc(email)}</span>
          </div>
        </div>
      </td>

      <td>
        <span class="admin-badge role-${esc(role)}">
          ${esc(readableAdminRole(role))}
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

      <td>
        ${esc(formatAdminDate(user.createdAt))}
      </td>

      <td>
        <div class="admin-actions">
          <button onclick="openAdminUserDrawer('${esc(id)}')">View</button>

          <button onclick="toggleAdminUserVerified('${esc(id)}')">
            ${verified ? "Unverify" : "Verify"}
          </button>

          <button onclick="toggleAdminUserStatus('${esc(id)}')">
            ${status === "suspended" ? "Activate" : "Suspend"}
          </button>

          <button class="danger" onclick="confirmDeleteAdminUser('${esc(id)}')">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `;

}
function readableAdminRole(role = ""){

  const r =
    String(role).toLowerCase();

  const map = {
    admin:"Admin",
    employer:"Employer",
    agent:"Recruiter",
    talent:"Job Seeker",
    school:"School",
    teacher:"Teacher",
    student:"Student"
  };

  return map[r] || "Member";

}

function formatAdminDate(value){

  if(!value) return "-";

  const date =
    new Date(value);

  if(Number.isNaN(date.getTime())){
    return "-";
  }

  return date.toLocaleDateString([],{
    year:"numeric",
    month:"short",
    day:"numeric"
  });

}
function openAdminUserDrawer(userId){

  const user =
    (adminState.users || [])
      .find(item =>
        String(getId(item)) === String(userId)
      );

  if(!user){
    adminToast("User not found");
    return;
  }

  const name =
    user.companyName ||
    user.schoolName ||
    user.name ||
    "AIFT User";

  const avatar =
    user.profileImage ||
    user.logo ||
    user.avatar ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const verified =
    user.aiftVerified === true ||
    user.isVerified === true;

  openAdminDrawer(
    name,
    user.email || "User account details",
    `
      <div class="admin-entity-header">
        <img src="${esc(avatar)}" alt="">
        <div>
          <h3>${esc(name)}</h3>
          <p>${esc(user.email || "")}</p>
        </div>
      </div>

      <div class="admin-detail-grid">

        <div class="admin-detail-card">
          <span>Role</span>
          <strong>${esc(readableAdminRole(user.role))}</strong>
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
          <strong>${esc(formatAdminDate(user.createdAt))}</strong>
        </div>

      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Admin Actions</h2>

        <div class="admin-actions">
          <button onclick="toggleAdminUserVerified('${esc(userId)}')">
            ${verified ? "Unverify" : "Verify"}
          </button>

          <button onclick="toggleAdminUserStatus('${esc(userId)}')">
            ${String(user.status || "active").toLowerCase() === "suspended"
              ? "Activate"
              : "Suspend"}
          </button>

          <button onclick="openAdminRoleChange('${esc(userId)}')">
            Change Role
          </button>

          <button class="danger" onclick="confirmDeleteAdminUser('${esc(userId)}')">
            Delete User
          </button>
        </div>
      </div>
    `
  );

}
async function toggleAdminUserVerified(userId){

  const user =
    adminState.users.find(item =>
      String(getId(item)) === String(userId)
    );

  if(!user) return;

  const next =
    !(user.aiftVerified === true || user.isVerified === true);

  try{

    await adminJSON(
      `/api/users/${encodeURIComponent(userId)}`,
      "PATCH",
      {
        aiftVerified:next,
        isVerified:next
      }
    );

    user.aiftVerified = next;
    user.isVerified = next;

    adminToast(
      next
        ? "User verified"
        : "User unverified"
    );

    renderAdminUsers();

    closeAdminDrawer();

  }catch(error){

    adminToast(error.message || "Unable to update verification");

  }

}
async function toggleAdminUserStatus(userId){

  const user =
    adminState.users.find(item =>
      String(getId(item)) === String(userId)
    );

  if(!user) return;

  const current =
    String(user.status || "active").toLowerCase();

  const next =
    current === "suspended"
      ? "active"
      : "suspended";

  try{

    await adminJSON(
      `/api/users/${encodeURIComponent(userId)}`,
      "PATCH",
      {
        status:next
      }
    );

    user.status = next;

    adminToast(
      next === "suspended"
        ? "User suspended"
        : "User activated"
    );

    renderAdminUsers();

    closeAdminDrawer();

  }catch(error){

    adminToast(error.message || "Unable to update user status");

  }

}
function confirmDeleteAdminUser(userId){

  openAdminConfirm(
    "Delete user",
    "This will permanently delete this user account. This action cannot be undone.",
    async ()=>{

      try{

        await adminRequest(
          `/api/users/${encodeURIComponent(userId)}`,
          {
            method:"DELETE"
          }
        );

        adminState.users =
          adminState.users.filter(user =>
            String(getId(user)) !== String(userId)
          );

        adminToast("User deleted");

        closeAdminDrawer();

        renderAdminUsers();

      }catch(error){

        adminToast(error.message || "Unable to delete user");

      }

    }
  );

}
function openAdminRoleChange(userId){

  const user =
    adminState.users.find(item =>
      String(getId(item)) === String(userId)
    );

  if(!user) return;

  const role =
    prompt(
      "Enter new role: admin, employer, agent, talent, school, teacher, student",
      user.role || ""
    );

  if(!role) return;

  changeAdminUserRole(userId,role);

}

async function changeAdminUserRole(userId,role){

  try{

    await adminJSON(
      `/api/users/${encodeURIComponent(userId)}`,
      "PATCH",
      {
        role
      }
    );

    const user =
      adminState.users.find(item =>
        String(getId(item)) === String(userId)
      );

    if(user){
      user.role = role;
    }

    adminToast("User role updated");

    renderAdminUsers();

    closeAdminDrawer();

  }catch(error){

    adminToast(error.message || "Unable to change role");

  }

}
function openAdminCreateUserModal(){

  adminToast("Create user modal will be added in a later admin upgrade.");

}

/* =====================================
   VERIFICATION CENTER
===================================== */

async function loadVerificationCenter(){

  const section =
    document.getElementById("verificationSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="verificationSearch"
             placeholder="Search company, school, recruiter, teacher..."
             value="${esc(adminState.verificationFilters.search)}"
             oninput="adminState.verificationFilters.search=this.value; renderVerificationCenter()">

      <select onchange="adminState.verificationFilters.role=this.value; renderVerificationCenter()">
        <option value="all">All Important Roles</option>
        <option value="employer">Employers</option>
        <option value="school">Schools</option>
        <option value="agent">Recruiters</option>
        <option value="teacher">Teachers</option>
      </select>

      <select onchange="adminState.verificationFilters.status=this.value; renderVerificationCenter()">
        <option value="pending">Pending Verification</option>
        <option value="verified">Verified</option>
        <option value="all">All</option>
      </select>

      <button class="admin-btn"
              onclick="refreshVerificationCenter()">
        Refresh
      </button>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Verification Requests</h2>
        <button onclick="renderVerificationCenter()">Reload View</button>
      </div>

      <div id="verificationTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshVerificationCenter();

}
async function refreshVerificationCenter(){

  try{

    adminState.users =
      await fetchAdminUsers();

    renderVerificationCenter();

  }catch(error){

    document.getElementById("verificationTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load verification queue</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderVerificationCenter(){

  const box =
    document.getElementById("verificationTable");

  if(!box) return;

  const importantRoles =
    ["employer","school","agent","teacher"];

  let users =
    [...(adminState.users || [])]
      .filter(user =>
        importantRoles.includes(
          String(user.role || "").toLowerCase()
        )
      );

  const search =
    String(adminState.verificationFilters.search || "")
      .toLowerCase();

  const role =
    adminState.verificationFilters.role;

  const status =
    adminState.verificationFilters.status;

  if(search){
    users = users.filter(user =>
      [
        user.name,
        user.email,
        user.companyName,
        user.schoolName,
        user.headline,
        user.location
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(role !== "all"){
    users = users.filter(user =>
      String(user.role || "").toLowerCase() === role
    );
  }

  if(status === "pending"){
    users = users.filter(user =>
      user.aiftVerified !== true &&
      user.isVerified !== true
    );
  }

  if(status === "verified"){
    users = users.filter(user =>
      user.aiftVerified === true ||
      user.isVerified === true
    );
  }

  if(!users.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No verification records found</strong>
        Try changing the filter.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Account</th>
            <th>Role</th>
            <th>Verification</th>
            <th>Location</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${
            users.map(user=>verificationRow(user)).join("")
          }
        </tbody>
      </table>
    </div>
  `;

}
function verificationRow(user){

  const id =
    getId(user);

  const name =
    user.companyName ||
    user.schoolName ||
    user.name ||
    "AIFT User";

  const avatar =
    user.profileImage ||
    user.logo ||
    user.avatar ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const role =
    String(user.role || "member").toLowerCase();

  const verified =
    user.aiftVerified === true ||
    user.isVerified === true;

  return `
    <tr>

      <td>
        <div class="admin-user-cell">
          <img src="${esc(avatar)}" alt="">
          <div>
            <strong>${esc(name)}</strong>
            <span>${esc(user.email || "")}</span>
          </div>
        </div>
      </td>

      <td>
        <span class="admin-badge role-${esc(role)}">
          ${esc(readableAdminRole(role))}
        </span>
      </td>

      <td>
        <span class="admin-badge ${verified ? "green" : "orange"}">
          ${verified ? "Verified" : "Pending"}
        </span>
      </td>

      <td>${esc(user.location || "-")}</td>

      <td>${esc(formatAdminDate(user.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button onclick="openVerificationReview('${esc(id)}')">
            Review
          </button>

          <button class="${verified ? "danger" : "success"}"
                  onclick="toggleVerificationStatus('${esc(id)}')">
            ${verified ? "Remove" : "Approve"}
          </button>
        </div>
      </td>

    </tr>
  `;

}
function openVerificationReview(userId){

  const user =
    (adminState.users || [])
      .find(item =>
        String(getId(item)) === String(userId)
      );

  if(!user){
    adminToast("User not found");
    return;
  }

  const name =
    user.companyName ||
    user.schoolName ||
    user.name ||
    "AIFT User";

  const avatar =
    user.profileImage ||
    user.logo ||
    user.avatar ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const verified =
    user.aiftVerified === true ||
    user.isVerified === true;

  const modal =
    document.getElementById("verificationModal");

  const content =
    document.getElementById("verificationContent");

  if(!modal || !content) return;

  content.innerHTML = `
    <div style="padding:20px;">

      <div class="admin-entity-header">
        <img src="${esc(avatar)}" alt="">
        <div>
          <h3>${esc(name)}</h3>
          <p>${esc(user.email || "")}</p>
        </div>
      </div>

      <div class="admin-detail-grid">

        <div class="admin-detail-card">
          <span>Role</span>
          <strong>${esc(readableAdminRole(user.role))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Verification Status</span>
          <strong>${verified ? "Verified" : "Pending"}</strong>
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
          <span>Bio</span>
          <strong>${esc(user.bio || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Joined</span>
          <strong>${esc(formatAdminDate(user.createdAt))}</strong>
        </div>

      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Verification Actions</h2>

        <div class="admin-actions">
          <button class="${verified ? "danger" : "success"}"
                  onclick="toggleVerificationStatus('${esc(userId)}')">
            ${verified ? "Remove Verification" : "Approve Verification"}
          </button>

          <button onclick="openAdminUserDrawer('${esc(userId)}')">
            Open User Drawer
          </button>
        </div>
      </div>

    </div>
  `;

  modal.classList.remove("hidden");

}
function closeVerificationModal(){

  document
    .getElementById("verificationModal")
    ?.classList
    .add("hidden");

}
async function toggleVerificationStatus(userId){

  const user =
    adminState.users.find(item =>
      String(getId(item)) === String(userId)
    );

  if(!user) return;

  const currentlyVerified =
    user.aiftVerified === true ||
    user.isVerified === true;

  const next =
    !currentlyVerified;

  try{

    await adminJSON(
      `/api/users/${encodeURIComponent(userId)}`,
      "PATCH",
      {
        aiftVerified:next,
        isVerified:next
      }
    );

    user.aiftVerified = next;
    user.isVerified = next;

    adminToast(
      next
        ? "Account verified"
        : "Verification removed"
    );

    renderVerificationCenter();
    renderOverviewStats();
    renderVerificationQueue();
    closeVerificationModal();

  }catch(error){

    adminToast(
      error.message ||
      "Unable to update verification"
    );

  }

}
/* =====================================
   JOBS MANAGEMENT
===================================== */

async function loadAdminJobs(){

  const section =
    document.getElementById("jobsSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="adminJobSearch"
             placeholder="Search title, company, location..."
             value="${esc(adminState.jobFilters.search)}"
             oninput="adminState.jobFilters.search=this.value; renderAdminJobs()">

      <select onchange="adminState.jobFilters.status=this.value; renderAdminJobs()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="pending">Pending</option>
        <option value="review">Review</option>
        <option value="suspended">Suspended</option>
        <option value="rejected">Rejected</option>
        <option value="closed">Closed</option>
      </select>

      <select onchange="adminState.jobFilters.type=this.value; renderAdminJobs()">
        <option value="all">All Types</option>
        <option value="full-time">Full-time</option>
        <option value="part-time">Part-time</option>
        <option value="internship">Internship</option>
        <option value="contract">Contract</option>
        <option value="remote">Remote</option>
      </select>

      <button class="admin-btn"
              onclick="refreshAdminJobs()">
        Refresh
      </button>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Jobs Management</h2>
        <button onclick="renderAdminJobs()">Reload View</button>
      </div>

      <div id="adminJobsTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshAdminJobs();

}
async function refreshAdminJobs(){

  try{

    adminState.jobs =
      await fetchAdminJobs();

    renderAdminJobs();

  }catch(error){

    document.getElementById("adminJobsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load jobs</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderAdminJobs(){

  const box =
    document.getElementById("adminJobsTable");

  if(!box) return;

  let jobs =
    [...(adminState.jobs || [])];

  const search =
    String(adminState.jobFilters.search || "")
      .toLowerCase();

  const status =
    adminState.jobFilters.status;

  const type =
    adminState.jobFilters.type;

  if(search){
    jobs = jobs.filter(job =>
      [
        job.title,
        job.company,
        job.companyName,
        job.location,
        job.type,
        job.workSetup,
        job.description
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(status !== "all"){
    jobs = jobs.filter(job =>
      String(job.status || "active").toLowerCase() === status
    );
  }

  if(type !== "all"){
    jobs = jobs.filter(job =>
      [
        job.type,
        job.jobType,
        job.workSetup
      ]
        .join(" ")
        .toLowerCase()
        .includes(type)
    );
  }

  if(!jobs.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No jobs found</strong>
        Try changing the filters.
      </div>
    `;
    return;
  }

  box.innerHTML = `
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
          ${jobs.map(job=>adminJobRow(job)).join("")}
        </tbody>
      </table>
    </div>
  `;

}
function adminJobRow(job){

  const id =
    getId(job);

  const status =
    String(job.status || "active").toLowerCase();

  const company =
    job.company ||
    job.companyName ||
    job.employerId?.companyName ||
    job.employerId?.name ||
    job.employer?.companyName ||
    "Company";

  const type =
    job.type ||
    job.jobType ||
    job.workSetup ||
    "Job";

  return `
    <tr>

      <td>
        <strong>${esc(job.title || "Untitled Job")}</strong>
        <div style="color:#667085;font-size:12px;margin-top:3px;">
          ${esc(job.location || "Location not set")}
        </div>
      </td>

      <td>${esc(company)}</td>

      <td>
        <span class="admin-badge blue">
          ${esc(type)}
        </span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">
          ${esc(status)}
        </span>
      </td>

      <td>${esc(formatAdminDate(job.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button onclick="openJobReview('${esc(id)}')">Review</button>

          <button class="success" onclick="updateAdminJobStatus('${esc(id)}','active')">
            Approve
          </button>

          <button onclick="updateAdminJobStatus('${esc(id)}','suspended')">
            Suspend
          </button>

          <button class="danger" onclick="confirmDeleteAdminJob('${esc(id)}')">
            Delete
          </button>
        </div>
      </td>

    </tr>
  `;

}
function openJobReview(jobId){

  const job =
    (adminState.jobs || [])
      .find(item =>
        String(getId(item)) === String(jobId)
      );

  if(!job){
    adminToast("Job not found");
    return;
  }

  const company =
    job.company ||
    job.companyName ||
    job.employerId?.companyName ||
    job.employerId?.name ||
    job.employer?.companyName ||
    "Company";

  const status =
    String(job.status || "active").toLowerCase();

  const modal =
    document.getElementById("jobReviewModal");

  const content =
    document.getElementById("jobReviewContent");

  if(!modal || !content) return;

  content.innerHTML = `
    <div style="padding:20px;">

      <div class="admin-entity-header">
        <img src="${esc(job.employerId?.logo || job.logo || "images/aift-logo.png")}" alt="">
        <div>
          <h3>${esc(job.title || "Untitled Job")}</h3>
          <p>${esc(company)} • ${esc(job.location || "Location not set")}</p>
        </div>
      </div>

      <div class="admin-detail-grid">

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(status)}</strong>
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
          <span>Salary</span>
          <strong>${esc(job.salary || job.salaryRange || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Posted</span>
          <strong>${esc(formatAdminDate(job.createdAt))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Applications</span>
          <strong>${esc(job.applicationsCount || job.applicantsCount || 0)}</strong>
        </div>

      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Description</h2>
        <p style="padding:0;color:#344054;white-space:pre-wrap;">
          ${esc(job.description || "No description available.")}
        </p>
      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Admin Actions</h2>

        <div class="admin-actions">
          <button class="success" onclick="updateAdminJobStatus('${esc(jobId)}','active')">
            Approve
          </button>

          <button onclick="updateAdminJobStatus('${esc(jobId)}','suspended')">
            Suspend
          </button>

          <button class="danger" onclick="updateAdminJobStatus('${esc(jobId)}','rejected')">
            Reject
          </button>

          <button class="danger" onclick="confirmDeleteAdminJob('${esc(jobId)}')">
            Delete Job
          </button>
        </div>
      </div>

    </div>
  `;

  modal.classList.remove("hidden");

}
function closeJobReviewModal(){

  document
    .getElementById("jobReviewModal")
    ?.classList
    .add("hidden");

}
async function updateAdminJobStatus(jobId,status){

  try{

    await adminJSON(
      `/api/jobs/${encodeURIComponent(jobId)}/status`,
      "PATCH",
      { status }
    );

    const job =
      adminState.jobs.find(item =>
        String(getId(item)) === String(jobId)
      );

    if(job){
      job.status = status;
    }

    adminToast("Job status updated");

    renderAdminJobs();
    renderOverviewStats();

    closeJobReviewModal();

  }catch(error){

    adminToast(error.message || "Unable to update job");

  }

}
function confirmDeleteAdminJob(jobId){

  openAdminConfirm(
    "Delete job",
    "This will permanently delete this job post. This action cannot be undone.",
    async ()=>{

      try{

        await adminRequest(
          `/api/jobs/${encodeURIComponent(jobId)}`,
          {
            method:"DELETE"
          }
        );

        adminState.jobs =
          adminState.jobs.filter(job =>
            String(getId(job)) !== String(jobId)
          );

        adminToast("Job deleted");

        renderAdminJobs();
        renderOverviewStats();
        closeJobReviewModal();

      }catch(error){

        adminToast(error.message || "Unable to delete job");

      }

    }
  );

}
/* =====================================
   APPLICATIONS MANAGEMENT
===================================== */

async function loadAdminApplications(){

  const section =
    document.getElementById("applicationsSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="adminApplicationSearch"
             placeholder="Search applicant, email, job, company..."
             value="${esc(adminState.applicationFilters.search)}"
             oninput="adminState.applicationFilters.search=this.value; renderAdminApplications()">

      <select onchange="adminState.applicationFilters.status=this.value; renderAdminApplications()">
        <option value="all">All Status</option>
        <option value="new">New</option>
        <option value="shortlisted">Shortlisted</option>
        <option value="interview">Interview</option>
        <option value="offer">Offer</option>
        <option value="hired">Hired</option>
        <option value="rejected">Rejected</option>
      </select>

      <select onchange="adminState.applicationFilters.type=this.value; renderAdminApplications()">
        <option value="all">All Types</option>
        <option value="job">Job</option>
        <option value="internship">Internship</option>
      </select>

      <button class="admin-btn"
              onclick="refreshAdminApplications()">
        Refresh
      </button>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Applications Management</h2>
        <button onclick="renderAdminApplications()">Reload View</button>
      </div>

      <div id="adminApplicationsTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshAdminApplications();

}
async function refreshAdminApplications(){

  try{

    adminState.applications =
      await fetchAdminApplications();

    renderAdminApplications();

  }catch(error){

    document.getElementById("adminApplicationsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load applications</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderAdminApplications(){

  const box =
    document.getElementById("adminApplicationsTable");

  if(!box) return;

  let applications =
    [...(adminState.applications || [])];

  const search =
    String(adminState.applicationFilters.search || "")
      .toLowerCase();

  const status =
    adminState.applicationFilters.status;

  const type =
    adminState.applicationFilters.type;

  if(search){
    applications = applications.filter(app =>
      [
        app.name,
        app.email,
        app.phone,
        app.status,
        app.applicationType,
        app.jobId?.title,
        app.jobId?.company,
        app.jobTitle,
        app.companyName,
        app.studentInfo?.name,
        app.studentInfo?.email
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(status !== "all"){
    applications = applications.filter(app =>
      String(app.status || "new").toLowerCase() === status
    );
  }

  if(type !== "all"){
    applications = applications.filter(app =>
      String(app.applicationType || "job").toLowerCase() === type
    );
  }

  if(!applications.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No applications found</strong>
        Try changing the filters.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Job</th>
            <th>Type</th>
            <th>Status</th>
            <th>Submitted</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${applications.map(app=>adminApplicationRow(app)).join("")}
        </tbody>
      </table>
    </div>
  `;

}
function adminApplicationRow(app){

  const id =
    getId(app);

  const applicantName =
    app.name ||
    app.applicantName ||
    app.studentInfo?.name ||
    app.userId?.name ||
    "Applicant";

  const applicantEmail =
    app.email ||
    app.studentInfo?.email ||
    app.userId?.email ||
    "";

  const avatar =
    app.userId?.profileImage ||
    app.applicant?.profileImage ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const jobTitle =
    app.jobId?.title ||
    app.jobTitle ||
    "Job";

  const company =
    app.jobId?.company ||
    app.companyName ||
    app.jobId?.companyName ||
    "";

  const status =
    String(app.status || "new").toLowerCase();

  const type =
    String(app.applicationType || "job").toLowerCase();

  return `
    <tr>

      <td>
        <div class="admin-user-cell">
          <img src="${esc(avatar)}" alt="">
          <div>
            <strong>${esc(applicantName)}</strong>
            <span>${esc(applicantEmail)}</span>
          </div>
        </div>
      </td>

      <td>
        <strong>${esc(jobTitle)}</strong>
        <div style="color:#667085;font-size:12px;margin-top:3px;">
          ${esc(company)}
        </div>
      </td>

      <td>
        <span class="admin-badge blue">
          ${esc(type)}
        </span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">
          ${esc(status)}
        </span>
      </td>

      <td>${esc(formatAdminDate(app.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button onclick="openApplicationReview('${esc(id)}')">
            Review
          </button>

          <button class="success"
                  onclick="updateApplicationStatus('${esc(id)}','shortlisted')">
            Shortlist
          </button>

          <button onclick="updateApplicationStatus('${esc(id)}','interview')">
            Interview
          </button>

          <button class="danger"
                  onclick="updateApplicationStatus('${esc(id)}','rejected')">
            Reject
          </button>
        </div>
      </td>

    </tr>
  `;

}
function openApplicationReview(applicationId){

  const app =
    (adminState.applications || [])
      .find(item =>
        String(getId(item)) === String(applicationId)
      );

  if(!app){
    adminToast("Application not found");
    return;
  }

  const applicantName =
    app.name ||
    app.applicantName ||
    app.studentInfo?.name ||
    app.userId?.name ||
    "Applicant";

  const applicantEmail =
    app.email ||
    app.studentInfo?.email ||
    app.userId?.email ||
    "";

  const avatar =
    app.userId?.profileImage ||
    app.applicant?.profileImage ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const jobTitle =
    app.jobId?.title ||
    app.jobTitle ||
    "Job";

  const company =
    app.jobId?.company ||
    app.companyName ||
    app.jobId?.companyName ||
    "";

  const status =
    String(app.status || "new").toLowerCase();

  openAdminDrawer(
    applicantName,
    `${applicantEmail} • ${jobTitle}`,
    `
      <div class="admin-entity-header">
        <img src="${esc(avatar)}" alt="">
        <div>
          <h3>${esc(applicantName)}</h3>
          <p>${esc(applicantEmail)}</p>
        </div>
      </div>

      <div class="admin-detail-grid">

        <div class="admin-detail-card">
          <span>Job</span>
          <strong>${esc(jobTitle)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Company</span>
          <strong>${esc(company || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(status)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Type</span>
          <strong>${esc(app.applicationType || "job")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Submitted</span>
          <strong>${esc(formatAdminDate(app.createdAt))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>CV Source</span>
          <strong>${esc(app.cvSource || "-")}</strong>
        </div>

      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Applicant Message</h2>
        <p style="padding:0;color:#344054;white-space:pre-wrap;">
          ${esc(app.coverLetter || app.message || "No message provided.")}
        </p>
      </div>

      ${
        app.cvUrl || app.resumeUrl
          ? `
            <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
              <h2>CV / Resume</h2>
              <a href="${esc(app.cvUrl || app.resumeUrl)}"
                 target="_blank"
                 class="admin-btn"
                 style="display:inline-flex;align-items:center;text-decoration:none;">
                Open CV
              </a>
            </div>
          `
          : ""
      }

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Application Actions</h2>

        <div class="admin-actions">
          <button class="success"
                  onclick="updateApplicationStatus('${esc(applicationId)}','shortlisted')">
            Shortlist
          </button>

          <button onclick="updateApplicationStatus('${esc(applicationId)}','interview')">
            Move to Interview
          </button>

          <button onclick="updateApplicationStatus('${esc(applicationId)}','offer')">
            Offer
          </button>

          <button onclick="updateApplicationStatus('${esc(applicationId)}','hired')">
            Hired
          </button>

          <button class="danger"
                  onclick="updateApplicationStatus('${esc(applicationId)}','rejected')">
            Reject
          </button>

          <button class="danger"
                  onclick="confirmDeleteApplication('${esc(applicationId)}')">
            Delete
          </button>
        </div>
      </div>
    `
  );

}
async function updateApplicationStatus(applicationId,status){

  try{

    await adminJSON(
      `/api/applications/${encodeURIComponent(applicationId)}`,
      "PATCH",
      { status }
    );

    const app =
      adminState.applications.find(item =>
        String(getId(item)) === String(applicationId)
      );

    if(app){
      app.status = status;
    }

    adminToast("Application status updated");

    renderAdminApplications();
    renderOverviewStats();

    closeAdminDrawer();

  }catch(error){

    adminToast(error.message || "Unable to update application");

  }

}
function confirmDeleteApplication(applicationId){

  openAdminConfirm(
    "Delete application",
    "This will permanently delete this application record. This action cannot be undone.",
    async ()=>{

      try{

        await adminRequest(
          `/api/applications/${encodeURIComponent(applicationId)}`,
          {
            method:"DELETE"
          }
        );

        adminState.applications =
          adminState.applications.filter(app =>
            String(getId(app)) !== String(applicationId)
          );

        adminToast("Application deleted");

        renderAdminApplications();

        closeAdminDrawer();

      }catch(error){

        adminToast(error.message || "Unable to delete application");

      }

    }
  );

}
/* =====================================
   SCHOOLS & LMS MANAGEMENT
===================================== */

async function loadAdminSchools(){

  const section =
    document.getElementById("schoolsSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="adminSchoolSearch"
             placeholder="Search school name, email, location..."
             value="${esc(adminState.schoolFilters.search)}"
             oninput="adminState.schoolFilters.search=this.value; renderAdminSchools()">

      <select onchange="adminState.schoolFilters.status=this.value; renderAdminSchools()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="pending">Pending</option>
      </select>

      <select onchange="adminState.schoolFilters.verified=this.value; renderAdminSchools()">
        <option value="all">All Verification</option>
        <option value="verified">Verified</option>
        <option value="unverified">Unverified</option>
      </select>

      <button class="admin-btn"
              onclick="refreshAdminSchools()">
        Refresh
      </button>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Schools & LMS</h2>
        <button onclick="renderAdminSchools()">Reload View</button>
      </div>

      <div id="adminSchoolsTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshAdminSchools();

}
async function fetchAdminSchools(){

  try{

    const data =
      await adminRequest("/api/users?role=school");

    const users =
      Array.isArray(data)
        ? data
        : data.users || [];

    return users.filter(user =>
      String(user.role || "").toLowerCase() === "school"
    );

  }catch(error){

    console.warn("School role endpoint failed, loading users fallback:", error.message);

    const users =
      await fetchAdminUsers();

    return users.filter(user =>
      String(user.role || "").toLowerCase() === "school"
    );

  }

}
async function refreshAdminSchools(){

  try{

    adminState.schools =
      await fetchAdminSchools();

    renderAdminSchools();

  }catch(error){

    document.getElementById("adminSchoolsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load schools</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderAdminSchools(){

  const box =
    document.getElementById("adminSchoolsTable");

  if(!box) return;

  let schools =
    [...(adminState.schools || [])];

  const search =
    String(adminState.schoolFilters.search || "")
      .toLowerCase();

  const status =
    adminState.schoolFilters.status;

  const verifiedFilter =
    adminState.schoolFilters.verified;

  if(search){
    schools = schools.filter(school =>
      [
        school.schoolName,
        school.companyName,
        school.name,
        school.email,
        school.location,
        school.bio,
        school.headline
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(status !== "all"){
    schools = schools.filter(school =>
      String(school.status || "active").toLowerCase() === status
    );
  }

  if(verifiedFilter === "verified"){
    schools = schools.filter(school =>
      school.aiftVerified === true ||
      school.isVerified === true
    );
  }

  if(verifiedFilter === "unverified"){
    schools = schools.filter(school =>
      school.aiftVerified !== true &&
      school.isVerified !== true
    );
  }

  if(!schools.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No schools found</strong>
        Try changing the filters.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>School</th>
            <th>Status</th>
            <th>Verified</th>
            <th>Location</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${schools.map(school=>adminSchoolRow(school)).join("")}
        </tbody>
      </table>
    </div>
  `;

}
function adminSchoolRow(school){

  const id =
    getId(school);

  const name =
    school.schoolName ||
    school.companyName ||
    school.name ||
    "School";

  const avatar =
    school.logo ||
    school.profileImage ||
    school.avatar ||
    "images/aift-logo.png";

  const status =
    String(school.status || "active").toLowerCase();

  const verified =
    school.aiftVerified === true ||
    school.isVerified === true;

  return `
    <tr>

      <td>
        <div class="admin-user-cell">
          <img src="${esc(avatar)}" alt="">
          <div>
            <strong>${esc(name)}</strong>
            <span>${esc(school.email || "")}</span>
          </div>
        </div>
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

      <td>${esc(school.location || "-")}</td>

      <td>${esc(formatAdminDate(school.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button onclick="openSchoolReview('${esc(id)}')">
            Review
          </button>

          <button class="${verified ? "danger" : "success"}"
                  onclick="toggleSchoolVerified('${esc(id)}')">
            ${verified ? "Unverify" : "Verify"}
          </button>

          <button onclick="toggleSchoolStatus('${esc(id)}')">
            ${status === "suspended" ? "Activate" : "Suspend"}
          </button>
        </div>
      </td>

    </tr>
  `;

}
function openSchoolReview(schoolId){

  const school =
    (adminState.schools || [])
      .find(item =>
        String(getId(item)) === String(schoolId)
      );

  if(!school){
    adminToast("School not found");
    return;
  }

  const name =
    school.schoolName ||
    school.companyName ||
    school.name ||
    "School";

  const avatar =
    school.logo ||
    school.profileImage ||
    school.avatar ||
    "images/aift-logo.png";

  const verified =
    school.aiftVerified === true ||
    school.isVerified === true;

  const modal =
    document.getElementById("schoolReviewModal");

  const content =
    document.getElementById("schoolReviewContent");

  if(!modal || !content) return;

  content.innerHTML = `
    <div style="padding:20px;">

      <div class="admin-entity-header">
        <img src="${esc(avatar)}" alt="">
        <div>
          <h3>${esc(name)}</h3>
          <p>${esc(school.email || "")}</p>
        </div>
      </div>

      <div class="admin-detail-grid">

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(school.status || "active")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Verified</span>
          <strong>${verified ? "Yes" : "No"}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Location</span>
          <strong>${esc(school.location || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Students</span>
          <strong>${esc(school.studentsCount || school.studentCount || 0)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Teachers</span>
          <strong>${esc(school.teachersCount || school.teacherCount || 0)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Classes</span>
          <strong>${esc(school.classesCount || school.classCount || 0)}</strong>
        </div>

      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>School Description</h2>
        <p style="padding:0;color:#344054;white-space:pre-wrap;">
          ${esc(school.bio || school.description || "No description available.")}
        </p>
      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Admin Actions</h2>

        <div class="admin-actions">

          <button class="${verified ? "danger" : "success"}"
                  onclick="toggleSchoolVerified('${esc(schoolId)}')">
            ${verified ? "Remove Verification" : "Verify School"}
          </button>

          <button onclick="toggleSchoolStatus('${esc(schoolId)}')">
            ${String(school.status || "active").toLowerCase() === "suspended"
              ? "Activate School"
              : "Suspend School"}
          </button>

          <button onclick="openAdminUserDrawer('${esc(schoolId)}')">
            Open User Account
          </button>

        </div>
      </div>

    </div>
  `;

  modal.classList.remove("hidden");

}
function closeSchoolReviewModal(){

  document
    .getElementById("schoolReviewModal")
    ?.classList
    .add("hidden");

}
async function toggleSchoolVerified(schoolId){

  const school =
    adminState.schools.find(item =>
      String(getId(item)) === String(schoolId)
    );

  if(!school) return;

  const next =
    !(school.aiftVerified === true || school.isVerified === true);

  try{

    await adminJSON(
      `/api/users/${encodeURIComponent(schoolId)}`,
      "PATCH",
      {
        aiftVerified:next,
        isVerified:next
      }
    );

    school.aiftVerified = next;
    school.isVerified = next;

    adminToast(
      next
        ? "School verified"
        : "School unverified"
    );

    renderAdminSchools();
    closeSchoolReviewModal();

  }catch(error){

    adminToast(error.message || "Unable to update school verification");

  }

}
async function toggleSchoolStatus(schoolId){

  const school =
    adminState.schools.find(item =>
      String(getId(item)) === String(schoolId)
    );

  if(!school) return;

  const current =
    String(school.status || "active").toLowerCase();

  const next =
    current === "suspended"
      ? "active"
      : "suspended";

  try{

    await adminJSON(
      `/api/users/${encodeURIComponent(schoolId)}`,
      "PATCH",
      {
        status:next
      }
    );

    school.status = next;

    adminToast(
      next === "suspended"
        ? "School suspended"
        : "School activated"
    );

    renderAdminSchools();
    closeSchoolReviewModal();

  }catch(error){

    adminToast(error.message || "Unable to update school status");

  }

}
/* =====================================
   CONTENT MODERATION
===================================== */

async function loadContentModeration(){

  const section =
    document.getElementById("contentSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="adminContentSearch"
             placeholder="Search post text, author, role..."
             value="${esc(adminState.contentFilters.search)}"
             oninput="adminState.contentFilters.search=this.value; renderContentModeration()">

      <select onchange="adminState.contentFilters.status=this.value; renderContentModeration()">
        <option value="all">All Content</option>
        <option value="active">Active</option>
        <option value="hidden">Hidden</option>
        <option value="reported">Reported</option>
        <option value="flagged">Flagged</option>
      </select>

      <select onchange="adminState.contentFilters.type=this.value; renderContentModeration()">
        <option value="all">All Types</option>
        <option value="text">Text</option>
        <option value="image">Image</option>
        <option value="video">Video</option>
        <option value="repost">Repost</option>
      </select>

      <button class="admin-btn"
              onclick="refreshContentModeration()">
        Refresh
      </button>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Content Moderation</h2>
        <button onclick="renderContentModeration()">Reload View</button>
      </div>

      <div id="adminContentTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshContentModeration();

}
async function refreshContentModeration(){

  try{

    adminState.posts =
      await fetchAdminPosts();

    renderContentModeration();

  }catch(error){

    document.getElementById("adminContentTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load content</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderContentModeration(){

  const box =
    document.getElementById("adminContentTable");

  if(!box) return;

  let posts =
    [...(adminState.posts || [])];

  const search =
    String(adminState.contentFilters.search || "")
      .toLowerCase();

  const status =
    adminState.contentFilters.status;

  const type =
    adminState.contentFilters.type;

  if(search){
    posts = posts.filter(post =>
      [
        post.text,
        post.caption,
        post.author?.name,
        post.author?.companyName,
        post.author?.schoolName,
        post.author?.email,
        post.author?.role
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(status !== "all"){
    posts = posts.filter(post=>{
      const hidden =
        post.hidden === true ||
        post.isHidden === true ||
        post.status === "hidden";

      const reported =
        Number(post.reportsCount || post.reportCount || 0) > 0 ||
        post.reported === true;

      const flagged =
        post.flagged === true ||
        post.isFlagged === true;

      if(status === "hidden") return hidden;
      if(status === "reported") return reported;
      if(status === "flagged") return flagged;
      if(status === "active") return !hidden;

      return true;
    });
  }

  if(type !== "all"){
    posts = posts.filter(post=>{
      const mediaType =
        String(
          post.mediaType ||
          post.mediaTypes?.[0] ||
          ""
        ).toLowerCase();

      if(type === "text"){
        return !mediaType && !post.repostOf;
      }

      if(type === "repost"){
        return !!post.repostOf;
      }

      return mediaType.includes(type);
    });
  }

  if(!posts.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No content found</strong>
        Try changing the filters.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Post</th>
            <th>Author</th>
            <th>Engagement</th>
            <th>Status</th>
            <th>Posted</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${posts.map(post=>contentModerationRow(post)).join("")}
        </tbody>
      </table>
    </div>
  `;

}
function contentModerationRow(post){

  const id =
    getId(post);

  const author =
    post.author || post.user || {};

  const authorName =
    author.companyName ||
    author.schoolName ||
    author.name ||
    "Unknown author";

  const status =
    post.hidden === true ||
    post.isHidden === true ||
    post.status === "hidden"
      ? "hidden"
      : post.flagged === true || post.isFlagged === true
        ? "flagged"
        : Number(post.reportsCount || post.reportCount || 0) > 0
          ? "reported"
          : "active";

  const text =
    post.text ||
    post.caption ||
    "Media post";

  const likes =
    Array.isArray(post.likes)
      ? post.likes.length
      : Number(post.likesCount || 0);

  const comments =
    Array.isArray(post.comments)
      ? post.comments.length
      : Number(post.commentsCount || 0);

  return `
    <tr>

      <td>
        <strong>${esc(text.slice(0,80))}${text.length > 80 ? "..." : ""}</strong>
        <div style="color:#667085;font-size:12px;margin-top:3px;">
          ${esc(post.mediaType || post.mediaTypes?.[0] || "text")}
        </div>
      </td>

      <td>
        <span>${esc(authorName)}</span>
        <div style="color:#667085;font-size:12px;margin-top:3px;">
          ${esc(author.role || "")}
        </div>
      </td>

      <td>
        ${likes} likes · ${comments} comments
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">
          ${esc(status)}
        </span>
      </td>

      <td>${esc(formatAdminDate(post.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button onclick="openContentReview('${esc(id)}')">
            Review
          </button>

          <button onclick="togglePostHidden('${esc(id)}')">
            ${status === "hidden" ? "Restore" : "Hide"}
          </button>

          <button class="danger" onclick="confirmDeletePost('${esc(id)}')">
            Delete
          </button>
        </div>
      </td>

    </tr>
  `;

}
function openContentReview(postId){

  const post =
    (adminState.posts || [])
      .find(item =>
        String(getId(item)) === String(postId)
      );

  if(!post){
    adminToast("Post not found");
    return;
  }

  const author =
    post.author || post.user || {};

  const authorName =
    author.companyName ||
    author.schoolName ||
    author.name ||
    "Unknown author";

  const authorAvatar =
    author.profileImage ||
    author.logo ||
    author.avatar ||
    "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  const text =
    post.text ||
    post.caption ||
    "Media post";

  const mediaUrl =
    post.mediaUrl ||
    post.mediaUrls?.[0] ||
    post.media?.[0]?.url ||
    "";

  const status =
    post.hidden === true ||
    post.isHidden === true ||
    post.status === "hidden"
      ? "hidden"
      : post.flagged === true || post.isFlagged === true
        ? "flagged"
        : Number(post.reportsCount || post.reportCount || 0) > 0
          ? "reported"
          : "active";

  openAdminDrawer(
    "Post Review",
    `Author: ${authorName}`,
    `
      <div class="admin-entity-header">
        <img src="${esc(authorAvatar)}" alt="">
        <div>
          <h3>${esc(authorName)}</h3>
          <p>${esc(author.email || author.role || "")}</p>
        </div>
      </div>

      <div class="admin-detail-grid">

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(status)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Media Type</span>
          <strong>${esc(post.mediaType || post.mediaTypes?.[0] || "text")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Likes</span>
          <strong>${esc(Array.isArray(post.likes) ? post.likes.length : post.likesCount || 0)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Comments</span>
          <strong>${esc(Array.isArray(post.comments) ? post.comments.length : post.commentsCount || 0)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Reports</span>
          <strong>${esc(post.reportsCount || post.reportCount || 0)}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Posted</span>
          <strong>${esc(formatAdminDate(post.createdAt))}</strong>
        </div>

      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Post Content</h2>
        <p style="padding:0;color:#344054;white-space:pre-wrap;">
          ${esc(text)}
        </p>
      </div>

      ${
        mediaUrl
          ? `
            <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
              <h2>Media</h2>
              <a href="${esc(mediaUrl)}"
                 target="_blank"
                 class="admin-btn"
                 style="display:inline-flex;align-items:center;text-decoration:none;">
                Open Media
              </a>
            </div>
          `
          : ""
      }

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Moderation Actions</h2>

        <div class="admin-actions">
          <button onclick="togglePostHidden('${esc(postId)}')">
            ${status === "hidden" ? "Restore Post" : "Hide Post"}
          </button>

          <button class="danger" onclick="confirmDeletePost('${esc(postId)}')">
            Delete Post
          </button>
        </div>
      </div>
    `
  );

}
async function togglePostHidden(postId){

  const post =
    adminState.posts.find(item =>
      String(getId(item)) === String(postId)
    );

  if(!post) return;

  const currentlyHidden =
    post.hidden === true ||
    post.isHidden === true ||
    post.status === "hidden";

  const next =
    !currentlyHidden;

  try{

    await adminJSON(
      `/api/posts/${encodeURIComponent(postId)}`,
      "PATCH",
      {
        hidden:next,
        isHidden:next,
        status:next ? "hidden" : "active"
      }
    );

    post.hidden = next;
    post.isHidden = next;
    post.status = next ? "hidden" : "active";

    adminToast(
      next
        ? "Post hidden"
        : "Post restored"
    );

    renderContentModeration();
    closeAdminDrawer();

  }catch(error){

    adminToast(error.message || "Unable to update post");

  }

}
function confirmDeletePost(postId){

  openAdminConfirm(
    "Delete post",
    "This will permanently delete this post and its comments. This action cannot be undone.",
    async ()=>{

      try{

        await adminRequest(
          `/api/posts/${encodeURIComponent(postId)}`,
          {
            method:"DELETE"
          }
        );

        adminState.posts =
          adminState.posts.filter(post =>
            String(getId(post)) !== String(postId)
          );

        adminToast("Post deleted");

        renderContentModeration();
        closeAdminDrawer();

      }catch(error){

        adminToast(error.message || "Unable to delete post");

      }

    }
  );

}
/* =====================================
   MEETINGS & CALLS
===================================== */

async function loadAdminMeetings(){

  const section =
    document.getElementById("meetingsSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="adminMeetingSearch"
             placeholder="Search meeting code, user, call type..."
             value="${esc(adminState.meetingFilters.search)}"
             oninput="adminState.meetingFilters.search=this.value; renderAdminMeetings()">

      <select onchange="adminState.meetingFilters.type=this.value; renderAdminMeetings()">
        <option value="all">All Types</option>
        <option value="meeting">Meetings</option>
        <option value="audio">Audio Calls</option>
        <option value="video">Video Calls</option>
      </select>

      <select onchange="adminState.meetingFilters.status=this.value; renderAdminMeetings()">
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="ended">Ended</option>
        <option value="missed">Missed</option>
        <option value="declined">Declined</option>
        <option value="failed">Failed</option>
      </select>

      <button class="admin-btn"
              onclick="refreshAdminMeetings()">
        Refresh
      </button>

    </div>

    <div class="admin-stats-grid">

      <article class="admin-stat-card">
        <span>Total Meetings</span>
        <strong id="adminMeetingsTotal">0</strong>
        <small>Created meeting rooms</small>
      </article>

      <article class="admin-stat-card">
        <span>Total Calls</span>
        <strong id="adminCallsTotal">0</strong>
        <small>Audio and video calls</small>
      </article>

      <article class="admin-stat-card">
        <span>Failed / Missed</span>
        <strong id="adminFailedCallsTotal">0</strong>
        <small>Needs monitoring</small>
      </article>

      <article class="admin-stat-card">
        <span>Active Sessions</span>
        <strong id="adminActiveSessionsTotal">0</strong>
        <small>Currently active</small>
      </article>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Meetings & Call Logs</h2>
        <button onclick="renderAdminMeetings()">Reload View</button>
      </div>

      <div id="adminMeetingsTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshAdminMeetings();

}
async function fetchAdminCallLogs(){

  try{

    const data =
      await adminRequest("/api/call-logs");

    return Array.isArray(data)
      ? data
      : data.callLogs || data.logs || [];

  }catch(error){

    console.warn("Call logs load failed:", error.message);
    return [];

  }

}
async function refreshAdminMeetings(){

  try{

    const [meetingsResult, callsResult] =
      await Promise.allSettled([
        fetchAdminMeetings(),
        fetchAdminCallLogs()
      ]);

    adminState.meetings =
      meetingsResult.status === "fulfilled"
        ? meetingsResult.value
        : [];

    adminState.callLogs =
      callsResult.status === "fulfilled"
        ? callsResult.value
        : [];

    renderAdminMeetings();

  }catch(error){

    document.getElementById("adminMeetingsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load meetings or calls</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderAdminMeetings(){

  const box =
    document.getElementById("adminMeetingsTable");

  if(!box) return;

  const meetings =
    (adminState.meetings || [])
      .map(item=>({
        ...item,
        adminRecordType:"meeting"
      }));

  const calls =
    (adminState.callLogs || [])
      .map(item=>({
        ...item,
        adminRecordType:item.callType || "call"
      }));

  let records =
    [...meetings,...calls];

  const search =
    String(adminState.meetingFilters.search || "")
      .toLowerCase();

  const type =
    adminState.meetingFilters.type;

  const status =
    adminState.meetingFilters.status;

  if(search){
    records = records.filter(item =>
      [
        item.title,
        item.meetingCode,
        item.callType,
        item.status,
        item.caller?.name,
        item.receiver?.name,
        item.host?.name,
        item.conversationId
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(type !== "all"){
    records = records.filter(item =>
      String(item.adminRecordType || "")
        .toLowerCase()
        .includes(type)
    );
  }

  if(status !== "all"){
    records = records.filter(item =>
      String(item.status || "ended").toLowerCase() === status
    );
  }

  renderAdminMeetingStats(records);

  if(!records.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No meeting or call records found</strong>
        Try changing the filters.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Record</th>
            <th>Type</th>
            <th>Status</th>
            <th>Participants</th>
            <th>Started</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${records.map(item=>adminMeetingRow(item)).join("")}
        </tbody>
      </table>
    </div>
  `;

}
function renderAdminMeetingStats(records = []){

  const meetings =
    records.filter(item =>
      item.adminRecordType === "meeting"
    );

  const calls =
    records.filter(item =>
      item.adminRecordType !== "meeting"
    );

  const failed =
    records.filter(item =>
      ["failed","missed","declined","no_answer"].includes(
        String(item.status || "").toLowerCase()
      )
    );

  const active =
    records.filter(item =>
      ["active","ringing","connected"].includes(
        String(item.status || "").toLowerCase()
      )
    );

  const set = (id,value)=>{
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  };

  set("adminMeetingsTotal",meetings.length);
  set("adminCallsTotal",calls.length);
  set("adminFailedCallsTotal",failed.length);
  set("adminActiveSessionsTotal",active.length);

}
function adminMeetingRow(item){

  const id =
    getId(item);

  const type =
    item.adminRecordType || item.callType || "meeting";

  const status =
    String(item.status || "ended").toLowerCase();

  const title =
    item.title ||
    item.meetingCode ||
    `${item.callType || "Call"} log`;

  const participants =
    [
      item.caller?.name,
      item.receiver?.name,
      item.host?.name,
      item.user?.name
    ]
      .filter(Boolean)
      .join(" → ") ||
    item.participants?.length + " participants" ||
    "-";

  return `
    <tr>

      <td>
        <strong>${esc(title)}</strong>
        <div style="color:#667085;font-size:12px;margin-top:3px;">
          ${esc(item.meetingCode || item.callId || id || "-")}
        </div>
      </td>

      <td>
        <span class="admin-badge blue">
          ${esc(type)}
        </span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">
          ${esc(status)}
        </span>
      </td>

      <td>${esc(participants)}</td>

      <td>${esc(formatAdminDate(item.createdAt || item.startedAt))}</td>

      <td>
        <div class="admin-actions">
          <button onclick="openMeetingRecordReview('${esc(type)}','${esc(id)}')">
            Review
          </button>
        </div>
      </td>

    </tr>
  `;

}
function openMeetingRecordReview(type,id){

  const allRecords = [
    ...(adminState.meetings || []).map(item=>({
      ...item,
      adminRecordType:"meeting"
    })),
    ...(adminState.callLogs || []).map(item=>({
      ...item,
      adminRecordType:item.callType || "call"
    }))
  ];

  const item =
    allRecords.find(record =>
      String(getId(record)) === String(id)
    );

  if(!item){
    adminToast("Record not found");
    return;
  }

  openAdminDrawer(
    "Communication Record",
    item.title || item.callType || "Meeting / call details",
    `
      <div class="admin-detail-grid">

        <div class="admin-detail-card">
          <span>Type</span>
          <strong>${esc(item.adminRecordType || item.callType || "meeting")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Status</span>
          <strong>${esc(item.status || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Meeting Code</span>
          <strong>${esc(item.meetingCode || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Call ID</span>
          <strong>${esc(item.callId || getId(item) || "-")}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Started</span>
          <strong>${esc(formatAdminDate(item.startedAt || item.createdAt))}</strong>
        </div>

        <div class="admin-detail-card">
          <span>Ended</span>
          <strong>${esc(formatAdminDate(item.endedAt))}</strong>
        </div>

      </div>

      <div class="admin-panel" style="box-shadow:none;margin-top:16px;">
        <h2>Participants</h2>
        <p style="padding:0;color:#344054;">
          ${esc([
            item.caller?.name,
            item.receiver?.name,
            item.host?.name,
            item.user?.name
          ].filter(Boolean).join(" → ") || "No participant data available.")}
        </p>
      </div>
    `
  );

}
async function fetchAdminReports(){

  try{

    const data =
      await adminRequest("/api/reports");

    return Array.isArray(data)
      ? data
      : data.reports || [];

  }catch(error){

    console.warn("Reports endpoint unavailable:", error.message);
    return [];

  }

}
async function loadReportsCenter(){

  const section =
    document.getElementById("reportsSection");

  if(!section) return;

  section.innerHTML = `
    <div class="admin-filter-bar">

      <input id="adminReportSearch"
             placeholder="Search report, user, reason..."
             value="${esc(adminState.reportFilters.search)}"
             oninput="adminState.reportFilters.search=this.value; renderReportsCenter()">

      <select onchange="adminState.reportFilters.status=this.value; renderReportsCenter()">
        <option value="open">Open Reports</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
        <option value="all">All Reports</option>
      </select>

      <select onchange="adminState.reportFilters.type=this.value; renderReportsCenter()">
        <option value="all">All Types</option>
        <option value="post">Post</option>
        <option value="user">User</option>
        <option value="message">Message</option>
        <option value="job">Job</option>
        <option value="support">Support</option>
      </select>

      <button class="admin-btn"
              onclick="refreshReportsCenter()">
        Refresh
      </button>

    </div>

    <div class="admin-panel">

      <div class="admin-panel-head">
        <h2>Reports & Support</h2>
        <button onclick="renderReportsCenter()">Reload View</button>
      </div>

      <div id="adminReportsTable">
        <div class="admin-skeleton">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

    </div>
  `;

  await refreshReportsCenter();

}
async function refreshReportsCenter(){

  try{

    adminState.reports =
      await fetchAdminReports();

    renderReportsCenter();

  }catch(error){

    document.getElementById("adminReportsTable").innerHTML = `
      <div class="admin-empty">
        <strong>Unable to load reports</strong>
        ${esc(error.message || "Please try again")}
      </div>
    `;

  }

}
function renderReportsCenter(){

  const box =
    document.getElementById("adminReportsTable");

  if(!box) return;

  let reports =
    [...(adminState.reports || [])];

  const search =
    String(adminState.reportFilters.search || "")
      .toLowerCase();

  const status =
    adminState.reportFilters.status;

  const type =
    adminState.reportFilters.type;

  if(search){
    reports = reports.filter(report =>
      [
        report.reason,
        report.description,
        report.type,
        report.status,
        report.reporter?.name,
        report.reportedUser?.name,
        report.targetType
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }

  if(status !== "all"){
    reports = reports.filter(report =>
      String(report.status || "open").toLowerCase() === status
    );
  }

  if(type !== "all"){
    reports = reports.filter(report =>
      [
        report.type,
        report.targetType
      ]
        .join(" ")
        .toLowerCase()
        .includes(type)
    );
  }

  if(!reports.length){
    box.innerHTML = `
      <div class="admin-empty">
        <strong>No reports found</strong>
        Reports and support requests will appear here.
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Report</th>
            <th>Type</th>
            <th>Status</th>
            <th>Reporter</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          ${reports.map(report=>adminReportRow(report)).join("")}
        </tbody>
      </table>
    </div>
  `;

}
function adminReportRow(report){

  const id =
    getId(report);

  const status =
    String(report.status || "open").toLowerCase();

  const type =
    report.type ||
    report.targetType ||
    "report";

  const reporter =
    report.reporter?.name ||
    report.reportedBy?.name ||
    report.email ||
    "Reporter";

  return `
    <tr>

      <td>
        <strong>${esc(report.reason || "Report")}</strong>
        <div style="color:#667085;font-size:12px;margin-top:3px;">
          ${esc((report.description || "").slice(0,90))}
        </div>
      </td>

      <td>
        <span class="admin-badge blue">
          ${esc(type)}
        </span>
      </td>

      <td>
        <span class="admin-badge status-${esc(status)}">
          ${esc(status)}
        </span>
      </td>

      <td>${esc(reporter)}</td>

      <td>${esc(formatAdminDate(report.createdAt))}</td>

      <td>
        <div class="admin-actions">
          <button onclick="openReportReview('${esc(id)}')">
            Review
          </button>

          <button class="success"
                  onclick="updateReportStatus('${esc(id)}','resolved')">
            Resolve
          </button>

          <button onclick="updateReportStatus('${esc(id)}','dismissed')">
            Dismiss
          </button>
        </div>
      </td>

    </tr>
  `;

}




