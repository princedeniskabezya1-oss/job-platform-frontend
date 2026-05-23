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

function openTab(tab){
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });

  document.querySelectorAll(".section").forEach(section => {
    section.classList.toggle(
      "active",
      section.id === `section-${tab}`
    );
  });

  document.querySelectorAll(".mobile-nav button").forEach(btn => {
    btn.classList.remove("active");
  });

  const mobileMap = {
    overview:0,
    classes:1,
    assignments:2,
    schedule:3,
    progress:4
  };

  const index = mobileMap[tab];

  if (typeof index === "number"){
    const btn = document.querySelectorAll(".mobile-nav button")[index];

    if (btn){
      btn.classList.add("active");
    }
  }

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
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
    renderAnnouncements();
    renderClasses();
    renderAssignments();
    renderSchedule();
    renderCalendar();
    renderProgress();
    renderAttendance();
    renderResources();
    renderTeachers();
    renderDeadlines();
    hydrateSubmissionSelect();
    renderBadges();

  }catch(err){
    console.error(err);
    showAlert("error","Student portal failed to load.");
  }
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

  const avatar =
    me.profileImage ||
    me.avatar ||
    FALLBACK_AVATAR;

  const cover =
    me.coverImage ||
    me.bannerImage ||
    FALLBACK_COVER;

  if ($("studentAvatar")) $("studentAvatar").src = avatar;
  if ($("topAvatar")) $("topAvatar").src = avatar;
  if ($("leftStudentAvatar")) $("leftStudentAvatar").src = avatar;

  if ($("studentCover")){
    $("studentCover").style.backgroundImage = `url("${cover}")`;
  }

  setText("studentName", me.name || "Student");
  setText("leftStudentName", me.name || "Student");

  const course =
    me.course ||
    me.program ||
    me.profession ||
    "Student Workspace";

  setText("studentSub", course);
  setText("leftStudentCourse", course);
}

function renderStats(){
  const classes = getStudentClasses();
  const assignments = getStudentAssignments();
  const submissions = getStudentSubmissions();

  setText("statClasses", classes.length);
  setText("statAssignments", assignments.length);
  setText("statSubmissions", submissions.length);
  setText("statCompletion", state.metrics.completion + "%");

  setText("productivityScore", state.metrics.productivity + "%");
  setText("attendanceScore", state.metrics.attendance + "%");
  setText("overallProgress", state.metrics.overall + "%");

  setProgress("completionText","completionBar",state.metrics.completion);
  setProgress("attendanceText","attendanceBar",state.metrics.attendance);
  setProgress("engagementText","engagementBar",state.metrics.engagement);
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
          ? `<div class="class-cover" style="background-image:url('${update.mediaUrl}')"></div>`
          : ""
      }

      ${
        update.mediaUrl && update.mediaType === "video"
          ? `<video src="${update.mediaUrl}" controls style="width:100%;border-radius:16px;border:1px solid var(--border);margin-bottom:12px;"></video>`
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

document.addEventListener("DOMContentLoaded",async () => {
  initSearch();
  await loadAll();
  initSocket();
});
