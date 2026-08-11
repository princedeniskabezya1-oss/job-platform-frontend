const API = "https://backend-1-9b6f.onrender.com";

/* =========================================================
   AIFT TEACHER STUDIO
   AUTHENTICATION
========================================================= */

const token =
  localStorage.getItem("teacherToken") ||
  localStorage.getItem("schoolToken") ||
  localStorage.getItem("adminToken") ||
  localStorage.getItem("token");

const role =
  String(
    localStorage.getItem("role") || ""
  )
    .trim()
    .toLowerCase();

if (!token){
  window.location.href =
    "login.html";
}

if (
  role &&
  ![
    "teacher",
    "school",
    "admin"
  ].includes(role)
){
  window.location.href =
    "home.html";
}


/* =========================================================
   FALLBACK ASSETS
========================================================= */

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&q=80";

const CLASS_FALLBACK =
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80";


/* =========================================================
   URL STATE
========================================================= */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const selectedTeacherId =
  urlParams.get("teacherId");


/* =========================================================
   TEACHER STUDIO STATE
========================================================= */

const state = {

  loggedUser:null,
  me:null,

  /*
    Core teacher workspace data.
  */

  classes:[],
  students:[],
  assignments:[],
  submissions:[],
  schedules:[],
  attendance:[],
  quizzes:[],
  quizSubmissions:[],

  posts:[],
  schoolUpdates:[],
  teachers:[],

  resources:[],

  /*
    Teacher-specific workload information.
  */

  grading:{
    pending:[],
    reviewed:[],
    returned:[],
    total:0
  },

  /*
    Teacher dashboard metrics.
  */

  metrics:{
    classes:0,
    students:0,
    assignments:0,
    submissions:0,
    pendingGrading:0,
    attendance:0,
    engagement:0,
    performance:0
  },

  /*
    Per-class data cache.

    Map key:
      String class ID

    Map value:
      {
        students:[],
        assignments:[],
        submissions:[],
        schedules:[],
        attendance:[],
        analytics:{}
      }
  */

  classDataById:
    new Map(),

  /*
    Kabezya Teacher Assistant state.

    The AI service itself will be connected
    later without disturbing the teacher
    workspace architecture.
  */

  kabezya:{
    ready:false,
    loading:false,
    classId:"",
    studentId:"",
    assignmentId:"",
    submissionId:"",
    analysis:null,
    history:[]
  },

  unread:0
};


/* =========================================================
   DOM HELPER
========================================================= */

function $(id){
  return document.getElementById(id);
}


/* =========================================================
   AUTHENTICATED REQUEST HEADERS
========================================================= */

function authHeaders(extra = {}){
  return {
    Authorization:
      "Bearer " + token,

    ...extra
  };
}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(value){

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* =========================================================
   SAFE JSON
========================================================= */

async function safeJson(res){

  try{

    return await res.json();

  }catch{

    return null;

  }

}


/* =========================================================
   ARRAY NORMALIZER
========================================================= */

function asArray(value){

  if (
    Array.isArray(
      value
    )
  ){
    return value;
  }


  if (
    Array.isArray(
      value?.data
    )
  ){
    return value.data;
  }


  if (
    Array.isArray(
      value?.items
    )
  ){
    return value.items;
  }


  if (
    Array.isArray(
      value?.users
    )
  ){
    return value.users;
  }


  if (
    Array.isArray(
      value?.students
    )
  ){
    return value.students;
  }


  if (
    Array.isArray(
      value?.teachers
    )
  ){
    return value.teachers;
  }


  if (
    Array.isArray(
      value?.classes
    )
  ){
    return value.classes;
  }


  if (
    Array.isArray(
      value?.assignments
    )
  ){
    return value.assignments;
  }


  if (
    Array.isArray(
      value?.submissions
    )
  ){
    return value.submissions;
  }


  if (
    Array.isArray(
      value?.schedules
    )
  ){
    return value.schedules;
  }


  if (
    Array.isArray(
      value?.attendance
    )
  ){
    return value.attendance;
  }


  if (
    Array.isArray(
      value?.quizzes
    )
  ){
    return value.quizzes;
  }


  if (
    Array.isArray(
      value?.posts
    )
  ){
    return value.posts;
  }


  if (
    Array.isArray(
      value?.resources
    )
  ){
    return value.resources;
  }


  return [];

}


/* =========================================================
   ID NORMALIZATION
========================================================= */

function normalizeId(value){

  if (!value){
    return "";
  }


  if (
    typeof value ===
    "string"
  ){
    return value;
  }


  if (
    value._id
  ){
    return String(
      value._id
    );
  }


  if (
    value.id
  ){
    return String(
      value.id
    );
  }


  return String(
    value
  );

}


/* =========================================================
   ID COMPARISON
========================================================= */

function sameId(
  a,
  b
){

  return (
    normalizeId(a) ===
    normalizeId(b)
  );

}


/* =========================================================
   SAFE TEXT SETTER
========================================================= */

function setText(
  id,
  value
){

  const el =
    $(id);

  if (el){

    el.innerText =
      value;

  }

}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(value){

  if (!value){
    return "No date";
  }


  const d =
    new Date(
      value
    );


  if (
    Number.isNaN(
      d.getTime()
    )
  ){
    return "No date";
  }


  return d.toLocaleDateString(
    [],
    {
      month:"short",
      day:"numeric",
      year:"numeric"
    }
  );

}


/* =========================================================
   DATE + TIME FORMATTER
========================================================= */

function formatDateTime(value){

  if (!value){
    return "No date";
  }


  const d =
    new Date(
      value
    );


  if (
    Number.isNaN(
      d.getTime()
    )
  ){
    return "No date";
  }


  return d.toLocaleString(
    [],
    {
      month:"short",
      day:"numeric",
      hour:"2-digit",
      minute:"2-digit"
    }
  );

}


/* =========================================================
   TIME FORMATTER
========================================================= */

function formatTime(value){

  if (!value){
    return "";
  }


  /*
    Already-formatted values such as:
      08:00
      8:00 AM
  */

  if (
    typeof value ===
    "string" &&
    !value.includes(
      "T"
    )
  ){

    return value;

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return String(
      value
    );
  }


  return date.toLocaleTimeString(
    [],
    {
      hour:"2-digit",
      minute:"2-digit"
    }
  );

}


/* =========================================================
   NUMBER NORMALIZER
========================================================= */

function safeNumber(
  value,
  fallback = 0
){

  const number =
    Number(
      value
    );


  return Number.isFinite(
    number
  )
    ? number
    : fallback;

}


/* =========================================================
   PERCENTAGE NORMALIZER
========================================================= */

function clampPercentage(
  value
){

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        safeNumber(
          value,
          0
        )
      )
    )
  );

}


/* =========================================================
   TEACHER ID
========================================================= */

function getTeacherId(){

  return (
    selectedTeacherId ||
    normalizeId(
      state.me?._id ||
      state.me?.id
    ) ||
    normalizeId(
      state.loggedUser?._id ||
      state.loggedUser?.id
    ) ||
    localStorage.getItem(
      "userId"
    ) ||
    ""
  );

}


/* =========================================================
   SCHOOL ID
========================================================= */

function getSchoolId(){

  /*
    First use the teacher profile currently loaded.
  */

  const profileSchoolId =
    normalizeId(
      state.me?.schoolId?._id ||
      state.me?.schoolId ||
      state.me?.linkedSchoolId?._id ||
      state.me?.linkedSchoolId
    );


  if (
    profileSchoolId
  ){
    return profileSchoolId;
  }


  /*
    Then inspect the authenticated account.
  */

  const authenticatedSchoolId =
    normalizeId(
      state.loggedUser?.schoolId?._id ||
      state.loggedUser?.schoolId ||
      state.loggedUser?.linkedSchoolId?._id ||
      state.loggedUser?.linkedSchoolId
    );


  if (
    authenticatedSchoolId
  ){
    return authenticatedSchoolId;
  }


  /*
    Assigned classes are another reliable
    source of the teacher's school.
  */

  const classWithSchool =
    asArray(
      state.classes
    ).find(
      classItem =>
        normalizeId(
          classItem?.schoolId?._id ||
          classItem?.schoolId
        )
    );


  return normalizeId(
    classWithSchool?.schoolId?._id ||
    classWithSchool?.schoolId
  );

}


/* =========================================================
   GET ASSIGNED TEACHER CLASSES
========================================================= */

function getTeacherClasses(){

  const teacherId =
    getTeacherId();


  if (
    !teacherId
  ){
    return [];
  }


  return asArray(
    state.classes
  ).filter(
    classItem => {

      const classTeacherId =
        normalizeId(
          classItem?.teacherId?._id ||
          classItem?.teacherId
        );


      /*
        Teacher Studio is intentionally class-assignment
        scoped.

        Merely belonging to the same school does not make
        another teacher's class visible here.
      */

      return (
        classTeacherId &&
        sameId(
          classTeacherId,
          teacherId
        )
      );

    }
  );

}


/* =========================================================
   GET TEACHER CLASS IDS
========================================================= */

function getTeacherClassIds(){

  return getTeacherClasses()
    .map(
      classItem =>
        normalizeId(
          classItem?._id ||
          classItem?.id
        )
    )
    .filter(
      Boolean
    );

}


/* =========================================================
   GET TEACHER ASSIGNMENTS
========================================================= */

function getTeacherAssignments(){

  const classIds =
    new Set(
      getTeacherClassIds()
    );


  return asArray(
    state.assignments
  ).filter(
    assignment => {

      const classId =
        normalizeId(
          assignment?.classId?._id ||
          assignment?.classId
        );


      const teacherId =
        normalizeId(
          assignment?.teacherId?._id ||
          assignment?.teacherId
        );


      return (
        (
          classId &&
          classIds.has(
            classId
          )
        ) ||
        (
          teacherId &&
          sameId(
            teacherId,
            getTeacherId()
          )
        )
      );

    }
  );

}


/* =========================================================
   GET TEACHER SUBMISSIONS
========================================================= */

function getTeacherSubmissions(){

  const classIds =
    new Set(
      getTeacherClassIds()
    );


  return asArray(
    state.submissions
  ).filter(
    submission => {

      const classId =
        normalizeId(
          submission?.classId?._id ||
          submission?.classId
        );


      const teacherId =
        normalizeId(
          submission?.teacherId?._id ||
          submission?.teacherId
        );


      return (
        (
          classId &&
          classIds.has(
            classId
          )
        ) ||
        (
          teacherId &&
          sameId(
            teacherId,
            getTeacherId()
          )
        )
      );

    }
  );

}


/* =========================================================
   GET TEACHER SCHEDULES
========================================================= */

function getTeacherSchedules(){

  const classIds =
    new Set(
      getTeacherClassIds()
    );


  return asArray(
    state.schedules
  ).filter(
    schedule => {

      const classId =
        normalizeId(
          schedule?.classId?._id ||
          schedule?.classId
        );


      const teacherId =
        normalizeId(
          schedule?.teacherId?._id ||
          schedule?.teacherId
        );


      return (
        (
          classId &&
          classIds.has(
            classId
          )
        ) ||
        (
          teacherId &&
          sameId(
            teacherId,
            getTeacherId()
          )
        )
      );

    }
  );

}


/* =========================================================
   UNIQUE STUDENTS FROM ASSIGNED CLASSES
========================================================= */

function getTeacherStudents(){

  const students =
    new Map();


  getTeacherClasses()
    .forEach(
      classItem => {

        const classId =
          normalizeId(
            classItem?._id ||
            classItem?.id
          );


        const classTitle =
          String(
            classItem?.title ||
            classItem?.subject ||
            "Class"
          );


        asArray(
          classItem?.studentIds
        ).forEach(
          student => {

            const studentId =
              normalizeId(
                student?._id ||
                student?.id ||
                student
              );


            if (
              !studentId
            ){
              return;
            }


            if (
              !students.has(
                studentId
              )
            ){

              students.set(
                studentId,
                {
                  id:studentId,

                  student:
                    typeof student ===
                    "object"
                      ? student
                      : {
                          _id:
                            studentId
                        },

                  classes:[]
                }
              );

            }


            const record =
              students.get(
                studentId
              );


            if (
              !record.classes.some(
                item =>
                  sameId(
                    item.id,
                    classId
                  )
              )
            ){

              record.classes.push({
                id:
                  classId,

                title:
                  classTitle
              });

            }

          }
        );

      }
    );


  return Array.from(
    students.values()
  );

}


/* =========================================================
   ASSIGNMENT STATUS
========================================================= */

function normalizeAssignmentStatus(
  value
){

  const status =
    String(
      value || ""
    )
      .trim()
      .toLowerCase();


  if (
    [
      "draft",
      "published",
      "active",
      "closed",
      "archived"
    ].includes(
      status
    )
  ){
    return status;
  }


  return status ||
    "active";

}


/* =========================================================
   SUBMISSION STATUS
========================================================= */

function normalizeSubmissionStatus(
  value
){

  const status =
    String(
      value ||
      "submitted"
    )
      .trim()
      .toLowerCase();


  return status ||
    "submitted";

}


/* =========================================================
   PENDING GRADING
========================================================= */

function getPendingTeacherSubmissions(){

  return getTeacherSubmissions()
    .filter(
      submission => {

        const status =
          normalizeSubmissionStatus(
            submission?.status
          );


        return [
          "submitted",
          "pending"
        ].includes(
          status
        );

      }
    );

}


/* =========================================================
   REVIEWED SUBMISSIONS
========================================================= */

function getReviewedTeacherSubmissions(){

  return getTeacherSubmissions()
    .filter(
      submission => {

        const status =
          normalizeSubmissionStatus(
            submission?.status
          );


        return [
          "reviewed",
          "graded"
        ].includes(
          status
        );

      }
    );

}


/* =========================================================
   RETURNED SUBMISSIONS
========================================================= */

function getReturnedTeacherSubmissions(){

  return getTeacherSubmissions()
    .filter(
      submission =>
        normalizeSubmissionStatus(
          submission?.status
        ) ===
        "returned"
    );

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
      title:
        "Completed",

      icon:
        "fa-solid fa-circle-check"
    },

    error:{
      title:
        "Something went wrong",

      icon:
        "fa-solid fa-circle-exclamation"
    },

    warning:{
      title:
        "Attention needed",

      icon:
        "fa-solid fa-triangle-exclamation"
    },

    info:{
      title:
        "AIFT update",

      icon:
        "fa-solid fa-circle-info"
    }

  });


let aiftNotificationSequence =
  0;


/* =========================================================
   GET NOTIFICATION REGION
========================================================= */

function getAIFTNotificationRegion(){

  let region =
    document.getElementById(
      "aiftNotificationRegion"
    );


  if (
    region
  ){
    return region;
  }


  region =
    document.createElement(
      "div"
    );


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


  document.body.appendChild(
    region
  );


  return region;

}


/* =========================================================
   NORMALIZE NOTIFICATION TYPE
========================================================= */

function normalizeAIFTNotificationType(
  type
){

  const normalized =
    String(
      type ||
      "info"
    )
      .trim()
      .toLowerCase();


  return Object.prototype.hasOwnProperty.call(
    AIFT_NOTIFICATION_TYPES,
    normalized
  )
    ? normalized
    : "info";

}


/* =========================================================
   REMOVE NOTIFICATION
========================================================= */

function removeAIFTNotification(
  notification,
  immediate = false
){

  if (
    !notification
  ){
    return;
  }


  window.clearTimeout(
    Number(
      notification.dataset
        .notificationTimer
    )
  );


  if (
    immediate
  ){

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


/* =========================================================
   NOTIFICATION LIMIT
========================================================= */

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


/* =========================================================
   SHOW AIFT NOTIFICATION
========================================================= */

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
      Number(
        options.duration
      ) ||
      AIFT_NOTIFICATION_DEFAULT_DURATION
    );


  const region =
    getAIFTNotificationRegion();


  enforceAIFTNotificationLimit(
    region
  );


  const notification =
    document.createElement(
      "article"
    );


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
    normalizedType ===
      "error"
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

    <div
      class="aift-notification-copy"
    >
      <span
        class="aift-notification-brand"
      >
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
      String(
        timer
      );

  };


  const pauseTimer = () => {

    const timer =
      Number(
        notification.dataset
          .notificationTimer
      );


    window.clearTimeout(
      timer
    );


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

    if (
      remaining <= 0
    ){

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

    id:
      notificationId,

    close(){

      removeAIFTNotification(
        notification
      );

    },

    element:
      notification

  };

}


/* =========================================================
   SUCCESS NOTIFICATION
========================================================= */

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


/* =========================================================
   ERROR NOTIFICATION
========================================================= */

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


/* =========================================================
   WARNING NOTIFICATION
========================================================= */

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


/* =========================================================
   INFO NOTIFICATION
========================================================= */

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


/* =========================================================
   MODAL OPEN
========================================================= */

function openModal(id){

  const modal =
    $(id);


  if (
    !modal
  ){
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


/* =========================================================
   MODAL CLOSE
========================================================= */

function closeModal(id){

  const modal =
    $(id);


  if (
    !modal
  ){
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
   TEACHER STUDIO NAVIGATION CONTROLLER
========================================================= */

/*
  IMPORTANT:

  We intentionally keep the constant/function naming style
  close to student.js so the two files remain easy to compare.

  The actual workspace content is teacher-specific.
*/

const STUDENT_STUDIO_PAGES =
  Object.freeze({

    overview:{
      title:
        "Dashboard",

      description:
        "Your teaching workspace"
    },


    classes:{
      title:
        "My Classes",

      description:
        "Manage your assigned classes, lessons, students, and class activity"
    },


    students:{
      title:
        "Students",

      description:
        "Review students enrolled in your assigned classes"
    },


    assignments:{
      title:
        "Assignment Center",

      description:
        "Create coursework, review submissions, and manage assignment activity"
    },


    quizzes:{
      title:
        "Quizzes",

      description:
        "Manage quizzes, assessments, question banks, and results"
    },


    attendance:{
      title:
        "Attendance",

      description:
        "Track and manage attendance across your assigned classes"
    },


    grading:{
      title:
        "Grading Center",

      description:
        "Review submissions, provide feedback, and manage grades"
    },


    schedule:{
      title:
        "Calendar",

      description:
        "Review classes, deadlines, meetings, and teaching events"
    },


    analytics:{
      title:
        "Class Analytics",

      description:
        "Track attendance, submissions, student performance, and engagement"
    },


    resources:{
      title:
        "Resources",

      description:
        "Manage class files, recordings, links, and teaching materials"
    },


    ai:{
      title:
        "Kabezya AI",

      description:
        "Inspect student work, draft feedback, summarize performance, and automate repetitive teaching tasks"
    },


    messages:{
      title:
        "Messages",

      description:
        "Communicate with students, colleagues, and your school"
    },


    settings:{
      title:
        "Settings",

      description:
        "Manage your Teacher Studio preferences"
    },


    help:{
      title:
        "Help Center",

      description:
        "Find teaching guides, troubleshooting information, and support"
    }

  });


let activeStudentStudioPage =
  "overview";


/* =========================================================
   NORMALIZE STUDIO PAGE
========================================================= */

function normalizeStudentStudioPage(
  page
){

  const requested =
    String(
      page || ""
    )
      .trim()
      .toLowerCase();


  const aliases = {

    dashboard:
      "overview",

    home:
      "overview",

    class:
      "classes",

    roster:
      "students",

    student:
      "students",

    coursework:
      "assignments",

    assignment:
      "assignments",

    quiz:
      "quizzes",

    assessment:
      "quizzes",

    assessments:
      "quizzes",

    submissions:
      "grading",

    grades:
      "grading",

    calendar:
      "schedule",

    progress:
      "analytics",

    insights:
      "analytics",

    performance:
      "analytics",

    kabezya:
      "ai",

    assistant:
      "ai",

    support:
      "help"

  };


  const normalized =
    aliases[
      requested
    ] ||
    requested;


  return STUDENT_STUDIO_PAGES[
    normalized
  ]
    ? normalized
    : "overview";

}


/* =========================================================
   SET ROUTE CONTENT
========================================================= */

function setStudentStudioRouteContent(
  page
){

  const normalizedPage =
    normalizeStudentStudioPage(
      page
    );


  const config =
    STUDENT_STUDIO_PAGES[
      normalizedPage
    ] ||
    STUDENT_STUDIO_PAGES
      .overview;


  /*
    The dashboard router belongs only to the
    main Teacher Studio dashboard.
  */

  const router =
    document.getElementById(
      "studentStudioRouter"
    );


  const showRouter =
    normalizedPage ===
    "overview";


  if (
    router
  ){

    router.hidden =
      !showRouter;


    router.setAttribute(
      "aria-hidden",
      String(
        !showRouter
      )
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


/* =========================================================
   SET ACTIVE WORKSPACE SECTION
========================================================= */

function setStudentStudioActiveSection(
  page
){

  document
    .querySelectorAll(
      ".section"
    )
    .forEach(
      section => {

        const isActive =
          section.id ===
          `section-${page}`;


        section.classList.toggle(
          "active",
          isActive
        );


        section.hidden =
          !isActive;


        section.setAttribute(
          "aria-hidden",
          String(
            !isActive
          )
        );

      }
    );

}


/* =========================================================
   SET ACTIVE SIDEBAR NAVIGATION
========================================================= */

function setStudentStudioActiveNavigation(
  page
){

  document
    .querySelectorAll(
      [
        ".tab-btn",
        ".dashboard-nav-btn",
        ".student-nav-btn",
        ".student-navigation button",
        ".student-dashboard-nav button",
        "#studentSidebarNavigation [data-page]",
        ".student-sidebar-footer [data-page]"
      ].join(",")
    )
    .forEach(
      button => {

        const buttonPage =
          normalizeStudentStudioPage(
            button.dataset.page ||
            button.dataset.tab ||
            button.getAttribute(
              "data-section"
            ) ||
            ""
          );


        const inlineHandler =
          button.getAttribute(
            "onclick"
          ) ||
          "";


        const handlerMatch =
          inlineHandler.match(
            /openTab\(['"]([^'"]+)['"]\)/
          );


        const resolvedPage =
          handlerMatch
            ? normalizeStudentStudioPage(
                handlerMatch[1]
              )
            : buttonPage;


        const isActive =
          resolvedPage ===
          page;


        button.classList.toggle(
          "active",
          isActive
        );


        button.setAttribute(
          "aria-current",
          isActive
            ? "page"
            : "false"
        );

      }
    );

}


/* =========================================================
   SET ACTIVE MOBILE NAVIGATION
========================================================= */

function setStudentStudioActiveMobileNavigation(
  page
){

  const mobilePageMap = {

    overview:
      "overview",

    classes:
      "classes",

    students:
      "students",

    assignments:
      "assignments",

    schedule:
      "schedule"

  };


  document
    .querySelectorAll(
      ".mobile-nav button"
    )
    .forEach(
      button => {

        const inlineHandler =
          button.getAttribute(
            "onclick"
          ) ||
          "";


        const handlerMatch =
          inlineHandler.match(
            /openTab\(['"]([^'"]+)['"]\)/
          );


        const buttonPage =
          handlerMatch
            ? normalizeStudentStudioPage(
                handlerMatch[1]
              )
            : normalizeStudentStudioPage(
                button.dataset.page ||
                button.dataset.tab ||
                ""
              );


        const expectedPage =
          mobilePageMap[
            page
          ] ||
          page;


        const isActive =
          expectedPage ===
          buttonPage;


        button.classList.toggle(
          "active",
          isActive
        );


        button.setAttribute(
          "aria-current",
          isActive
            ? "page"
            : "false"
        );

      }
    );

}


/* =========================================================
   RENDER ACTIVE TEACHER STUDIO PAGE
========================================================= */

function renderActiveStudentStudioPage(
  page
){

  switch(
    page
  ){

    /* =====================================================
       OVERVIEW
    ===================================================== */

    case "overview":

      renderStudioHome();

      break;


    /* =====================================================
       CLASSES
    ===================================================== */

    case "classes":

      renderClasses();

      break;


    /* =====================================================
       STUDENTS
    ===================================================== */

    case "students":

      renderTeacherStudents();

      break;


    /* =====================================================
       ASSIGNMENTS
    ===================================================== */

    case "assignments":

      renderAssignments();

      break;


    /* =====================================================
       QUIZZES
    ===================================================== */

    case "quizzes":

      renderTeacherQuizzes();

      break;


    /* =====================================================
       ATTENDANCE
    ===================================================== */

    case "attendance":

      renderTeacherAttendance();

      break;


    /* =====================================================
       GRADING
    ===================================================== */

    case "grading":

      renderTeacherGradingCenter();

      break;


    /* =====================================================
       SCHEDULE
    ===================================================== */

    case "schedule":

      bindStudentCalendarControls();

      renderStudentCalendarWorkspace();

      break;


    /* =====================================================
       ANALYTICS
    ===================================================== */

    case "analytics":

      renderTeacherAnalytics();

      break;


    /* =====================================================
       RESOURCES
    ===================================================== */

    case "resources":

      renderTeacherResources();

      break;


    /* =====================================================
       KABEZYA AI
    ===================================================== */

    case "ai":

      renderKabezyaTeacherAssistant();

      break;


    /* =====================================================
       MESSAGES
    ===================================================== */

    case "messages":

      openStudentMessages();

      break;


    /* =====================================================
       SETTINGS
    ===================================================== */

    case "settings":

      renderTeacherSettings();

      break;


    /* =====================================================
       HELP
    ===================================================== */

    case "help":

      renderTeacherHelpCenter();

      break;


    /* =====================================================
       FALLBACK
    ===================================================== */

    default:

      renderStudioHome();

      break;

  }

}


/* =========================================================
   OPEN TEACHER STUDIO PAGE
========================================================= */

function openStudentStudioPage(
  requestedPage,
  options = {}
){

  const page =
    normalizeStudentStudioPage(
      requestedPage
    );


  activeStudentStudioPage =
    page;


  /*
    Keep the same data attribute naming convention
    as student.html for CSS compatibility.
  */

  document.body.dataset
    .studentSection =
    page;


  setStudentStudioRouteContent(
    page
  );


  setStudentStudioActiveSection(
    page
  );


  setStudentStudioActiveNavigation(
    page
  );


  setStudentStudioActiveMobileNavigation(
    page
  );


  renderActiveStudentStudioPage(
    page
  );


  if (
    options.updateHistory !==
    false
  ){

    const url =
      new URL(
        window.location.href
      );


    if (
      page ===
      "overview"
    ){

      url.searchParams.delete(
        "section"
      );

    }else{

      url.searchParams.set(
        "section",
        page
      );

    }


    window.history.replaceState(
      {
        studentStudioPage:
          page
      },
      "",
      url
    );

  }


  if (
    options.scroll !==
    false
  ){

    const workspace =
      document.querySelector(
        ".center-col"
      ) ||
      document.querySelector(
        ".student-main-content"
      ) ||
      document.querySelector(
        ".student-dashboard-workspace"
      ) ||
      document.getElementById(
        "studentStudioWorkspace"
      );


    const top =
      workspace
        ? (
            workspace
              .getBoundingClientRect()
              .top +
            window.scrollY -
            82
          )
        : 0;


    window.scrollTo({
      top:
        Math.max(
          0,
          top
        ),

      behavior:
        options.instant
          ? "auto"
          : "smooth"
    });

  }


  document.dispatchEvent(
    new CustomEvent(
      "teacherstudio:pagechange",
      {
        detail:{
          page
        }
      }
    )
  );

}


/* =========================================================
   COMPATIBILITY ALIAS
========================================================= */

/*
  Keep openTab() exactly as the Student Studio
  architecture expects.

  This lets copied HTML buttons continue to work
  without rewriting inline handlers.
*/

function openTab(
  page
){

  openStudentStudioPage(
    page
  );

}


/* =========================================================
   TEACHER STUDIO SHELL CONTROLLER
========================================================= */

/*
  We deliberately retain the STUDENT_STUDIO naming
  internally so comparison against student.js remains easy.
*/

const STUDENT_STUDIO_STORAGE_KEYS =
  Object.freeze({

    sidebarCollapsed:
      "aiftTeacherStudioSidebarCollapsed",

    activePage:
      "aiftTeacherStudioActivePage"

  });


let studentStudioInitialized =
  false;


/* =========================================================
   MOBILE DETECTION
========================================================= */

function isStudentStudioMobile(){

  return window.matchMedia(
    "(max-width:980px)"
  ).matches;

}


/* =========================================================
   SIDEBAR COLLAPSED STATE
========================================================= */

function setStudentSidebarCollapsed(
  collapsed,
  options = {}
){

  const shouldCollapse =
    Boolean(
      collapsed
    ) &&
    !isStudentStudioMobile();


  document.body.classList.toggle(
    "student-sidebar-collapsed",
    shouldCollapse
  );


  const toggle =
    $(
      "studentSidebarToggle"
    );


  if (
    toggle
  ){

    toggle.setAttribute(
      "aria-expanded",
      String(
        !shouldCollapse
      )
    );


    toggle.setAttribute(
      "aria-label",
      shouldCollapse
        ? "Expand Teacher Studio navigation"
        : "Collapse Teacher Studio navigation"
    );

  }


  if (
    options.persist !==
    false
  ){

    localStorage.setItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed,

      String(
        shouldCollapse
      )
    );

  }

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function setStudentSidebarMobileOpen(
  open
){

  const shouldOpen =
    Boolean(
      open
    ) &&
    isStudentStudioMobile();


  document.body.classList.toggle(
    "student-sidebar-mobile-open",
    shouldOpen
  );


  const toggle =
    $(
      "studentSidebarToggle"
    );


  const overlay =
    $(
      "studentSidebarOverlay"
    );


  if (
    toggle
  ){

    toggle.setAttribute(
      "aria-expanded",
      String(
        shouldOpen
      )
    );

  }


  if (
    overlay
  ){

    overlay.setAttribute(
      "aria-hidden",
      String(
        !shouldOpen
      )
    );

  }

}


/* =========================================================
   TOGGLE STUDIO SIDEBAR
========================================================= */

function toggleStudentStudioSidebar(){

  if (
    isStudentStudioMobile()
  ){

    setStudentSidebarMobileOpen(
      !document.body
        .classList
        .contains(
          "student-sidebar-mobile-open"
        )
    );


    return;

  }


  setStudentSidebarCollapsed(
    !document.body
      .classList
      .contains(
        "student-sidebar-collapsed"
      )
  );

}


/* =========================================================
   CLOSE TOPBAR MENUS
========================================================= */

function closeStudentStudioMenus(){

  const quickMenu =
    $(
      "studentQuickActionsMenu"
    );


  const profileMenu =
    $(
      "studentProfileMenu"
    );


  if (
    quickMenu
  ){

    quickMenu.hidden =
      true;

  }


  if (
    profileMenu
  ){

    profileMenu.hidden =
      true;

  }


  $(
    "studentQuickActionsButton"
  )
    ?.setAttribute(
      "aria-expanded",
      "false"
    );


  $(
    "studentProfileMenuButton"
  )
    ?.setAttribute(
      "aria-expanded",
      "false"
    );

}


/* =========================================================
   TOGGLE TOPBAR MENU
========================================================= */

function toggleStudentStudioMenu(
  menuId,
  buttonId
){

  const menu =
    $(
      menuId
    );


  const button =
    $(
      buttonId
    );


  if (
    !menu ||
    !button
  ){
    return;
  }


  const shouldOpen =
    menu.hidden;


  closeStudentStudioMenus();


  menu.hidden =
    !shouldOpen;


  button.setAttribute(
    "aria-expanded",
    String(
      shouldOpen
    )
  );

}


/* =========================================================
   ACTIVATE TEACHER STUDIO PAGE
========================================================= */

function activateStudentStudioPage(
  requestedPage,
  options = {}
){

  const page =
    normalizeStudentStudioPage(
      requestedPage
    );


  activeStudentStudioPage =
    page;


  document.body.dataset
    .studentSection =
    page;


  /*
    Primary modern workspace container.
  */

  const workspaceSections =
    document.querySelectorAll(
      "#studentWorkspaceSections > .section"
    );


  if (
    workspaceSections.length
  ){

    workspaceSections.forEach(
      section => {

        const active =
          section.id ===
          `section-${page}`;


        section.classList.toggle(
          "active",
          active
        );


        section.hidden =
          !active;


        section.setAttribute(
          "aria-hidden",
          String(
            !active
          )
        );

      }
    );

  }else{

    /*
      Compatibility with the older Student Studio
      section architecture.
    */

    setStudentStudioActiveSection(
      page
    );

  }


  document
    .querySelectorAll(
      "#studentSidebarNavigation [data-page]," +
      ".student-sidebar-footer [data-page]," +
      ".mobile-nav [data-page]"
    )
    .forEach(
      button => {

        const buttonPage =
          normalizeStudentStudioPage(
            button.dataset.page
          );


        const active =
          buttonPage ===
          page;


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

      }
    );


  setStudentStudioRouteContent(
    page
  );


  renderActiveStudentStudioPage(
    page
  );


  localStorage.setItem(
    STUDENT_STUDIO_STORAGE_KEYS
      .activePage,

    page
  );


  if (
    options.history !==
    false
  ){

    const url =
      new URL(
        window.location.href
      );


    if (
      page ===
      "overview"
    ){

      url.searchParams.delete(
        "section"
      );

    }else{

      url.searchParams.set(
        "section",
        page
      );

    }


    window.history.replaceState(
      {
        studentStudioPage:
          page
      },
      "",
      url
    );

  }


  if (
    options.scroll !==
      false &&
    $(
      "studentStudioWorkspace"
    )
  ){

    $(
      "studentStudioWorkspace"
    )
      .scrollIntoView({
        behavior:
          options.instant
            ? "auto"
            : "smooth",

        block:
          "start"
      });

  }


  setStudentSidebarMobileOpen(
    false
  );


  closeStudentStudioMenus();

}


/* =========================================================
   BIND SIDEBAR NAVIGATION
========================================================= */

function bindStudentStudioNavigation(){

  document
    .querySelectorAll(
      "#studentSidebarNavigation [data-page]," +
      ".student-sidebar-footer [data-page]," +
      ".mobile-nav [data-page]"
    )
    .forEach(
      button => {

        if (
          button.dataset
            .studentStudioBound ===
          "true"
        ){
          return;
        }


        button.dataset
          .studentStudioBound =
          "true";


        button.addEventListener(
          "click",
          () => {

            activateStudentStudioPage(
              button.dataset.page
            );

          }
        );

      }
    );

}


/* =========================================================
   BIND TOPBAR
========================================================= */

function bindStudentStudioTopbar(){

  $(
    "studentSidebarToggle"
  )
    ?.addEventListener(
      "click",
      toggleStudentStudioSidebar
    );


  $(
    "studentSidebarOverlay"
  )
    ?.addEventListener(
      "click",
      () => {

        setStudentSidebarMobileOpen(
          false
        );

      }
    );


  $(
    "studentQuickActionsButton"
  )
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


  $(
    "studentProfileMenuButton"
  )
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


  $(
    "studentMessagesButton"
  )
    ?.addEventListener(
      "click",
      () => {

        activateStudentStudioPage(
          "messages"
        );

      }
    );


  $(
    "studentWorkspaceSearchButton"
  )
    ?.addEventListener(
      "click",
      () => {

        $(
          "globalSearch"
        )
          ?.focus();

      }
    );


  $(
    "studentSidebarHelpButton"
  )
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
   QUICK ACTIONS
========================================================= */

function bindStudentStudioQuickActions(){

  $(
    "studentQuickActionsMenu"
  )
    ?.querySelectorAll(
      "[data-studio-action]"
    )
    .forEach(
      button => {

        if (
          button.dataset
            .teacherQuickActionBound ===
          "true"
        ){
          return;
        }


        button.dataset
          .teacherQuickActionBound =
          "true";


        button.addEventListener(
          "click",
          () => {

            const action =
              String(
                button.dataset
                  .studioAction ||
                ""
              )
                .trim()
                .toLowerCase();


            closeStudentStudioMenus();


            switch(
              action
            ){

              /*
                In Teacher Studio the old Student
                "Submit work" quick action becomes
                assignment management.
              */

              case "submit":

                activateStudentStudioPage(
                  "assignments"
                );

                break;


              case "assignment":

                activateStudentStudioPage(
                  "assignments"
                );

                break;


              case "students":

                activateStudentStudioPage(
                  "students"
                );

                break;


              case "grading":

                activateStudentStudioPage(
                  "grading"
                );

                break;


              case "calendar":

                activateStudentStudioPage(
                  "schedule"
                );

                break;


              case "attendance":

                activateStudentStudioPage(
                  "attendance"
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

      }
    );

}


/* =========================================================
   PROFILE MENU ACTIONS
========================================================= */

function bindStudentProfileActions(){

  const menu =
    $(
      "studentProfileMenu"
    );


  if (
    !menu
  ){
    return;
  }


  menu
    .querySelectorAll(
      "[data-profile-action]"
    )
    .forEach(
      button => {

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


            switch(
              action
            ){

              /* =========================================
                 PROFILE
              ========================================= */

              case "profile":

                /*
                  Keep this conservative for now.

                  We will connect the teacher public
                  profile page once we work on the
                  Profile section.
                */

                window.location.href =
                  selectedTeacherId
                    ? `public-profile.html?id=${
                        encodeURIComponent(
                          selectedTeacherId
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
                  "teacherToken",
                  "schoolToken",
                  "adminToken",
                  "token",
                  "role",
                  "userId"
                ]
                  .forEach(
                    key => {

                      localStorage.removeItem(
                        key
                      );

                    }
                  );


                sessionStorage.removeItem(
                  "token"
                );


                window.location.href =
                  "login.html";

                break;

            }

          }
        );

      }
    );

}


/* =========================================================
   RESTORE TEACHER STUDIO STATE
========================================================= */

function restoreStudentStudioState(){

  const storedCollapsed =
    localStorage.getItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed
    ) ===
    "true";


  setStudentSidebarCollapsed(
    storedCollapsed,
    {
      persist:
        false
    }
  );


  const urlPage =
    new URLSearchParams(
      window.location.search
    ).get(
      "section"
    );


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


/* =========================================================
   HANDLE STUDIO RESIZE
========================================================= */

function handleStudentStudioResize(){

  if (
    !isStudentStudioMobile()
  ){

    setStudentSidebarMobileOpen(
      false
    );

  }


  const storedCollapsed =
    localStorage.getItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed
    ) ===
    "true";


  setStudentSidebarCollapsed(
    storedCollapsed,
    {
      persist:
        false
    }
  );

}


/* =========================================================
   INITIALIZE TEACHER STUDIO SHELL
========================================================= */

function initializeStudentStudioShell(){

  if (
    studentStudioInitialized
  ){

    bindStudentStudioNavigation();

    return;

  }


  studentStudioInitialized =
    true;


  bindStudentStudioNavigation();


  bindStudentStudioTopbar();


  bindStudentClassControls();


  bindTeacherStudentControls();


  bindStudentAssignmentControls();


  bindTeacherQuizControls();


  bindTeacherAttendanceControls();


  bindTeacherGradingControls();


  bindStudentCalendarControls();


  bindTeacherAnalyticsControls();


  bindTeacherResourceControls();


  bindStudentStudioQuickActions();


  bindStudentProfileActions();


  const initialPage =
    restoreStudentStudioState();


  activateStudentStudioPage(
    initialPage,
    {
      history:
        false,

      scroll:
        false,

      instant:
        true
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
        event.state
          ?.studentStudioPage ||
        new URLSearchParams(
          window.location.search
        ).get(
          "section"
        ) ||
        "overview",

        {
          history:
            false,

          scroll:
            false,

          instant:
            true
        }
      );

    }
  );

}


/* =========================================================
   API GET
========================================================= */

async function apiGet(
  path,
  fallback = null
){

  try{

    const res =
      await fetch(
        API + path,
        {
          headers:
            authHeaders()
        }
      );


    if (
      res.status ===
      401
    ){

      [
        "teacherToken",
        "schoolToken",
        "adminToken",
        "token",
        "role",
        "userId"
      ]
        .forEach(
          key => {

            localStorage.removeItem(
              key
            );

          }
        );


      sessionStorage.removeItem(
        "token"
      );


      window.location.href =
        "login.html";


      return fallback;

    }


    if (
      !res.ok
    ){

      console.warn(
        "GET failed:",
        path,
        res.status
      );


      return fallback;

    }


    return await safeJson(
      res
    );

  }catch(
    err
  ){

    console.warn(
      "GET network failed:",
      path,
      err
    );


    return fallback;

  }

}


/* =========================================================
   API SEND
========================================================= */

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
    body !==
      undefined &&
    method !==
      "GET" &&
    method !==
      "HEAD"
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


  const data =
    await safeJson(
      res
    );


  if (
    res.status ===
    401
  ){

    [
      "teacherToken",
      "schoolToken",
      "adminToken",
      "token",
      "role",
      "userId"
    ]
      .forEach(
        key => {

          localStorage.removeItem(
            key
          );

        }
      );


    sessionStorage.removeItem(
      "token"
    );


    window.location.href =
      "login.html";


    throw new Error(
      "Your session has expired."
    );

  }


  if (
    !res.ok
  ){

    throw new Error(
      data?.message ||
      data?.error ||
      "Request failed."
    );

  }


  return data;

}

/* =========================================================
   TEACHER STUDIO NAVIGATION CONTROLLER
========================================================= */

/*
  IMPORTANT:

  We intentionally keep the constant/function naming style
  close to student.js so the two files remain easy to compare.

  The actual workspace content is teacher-specific.
*/

const STUDENT_STUDIO_PAGES =
  Object.freeze({

    overview:{
      title:
        "Dashboard",

      description:
        "Your teaching workspace"
    },


    classes:{
      title:
        "My Classes",

      description:
        "Manage your assigned classes, lessons, students, and class activity"
    },


    students:{
      title:
        "Students",

      description:
        "Review students enrolled in your assigned classes"
    },


    assignments:{
      title:
        "Assignment Center",

      description:
        "Create coursework, review submissions, and manage assignment activity"
    },


    quizzes:{
      title:
        "Quizzes",

      description:
        "Manage quizzes, assessments, question banks, and results"
    },


    attendance:{
      title:
        "Attendance",

      description:
        "Track and manage attendance across your assigned classes"
    },


    grading:{
      title:
        "Grading Center",

      description:
        "Review submissions, provide feedback, and manage grades"
    },


    schedule:{
      title:
        "Calendar",

      description:
        "Review classes, deadlines, meetings, and teaching events"
    },


    analytics:{
      title:
        "Class Analytics",

      description:
        "Track attendance, submissions, student performance, and engagement"
    },


    resources:{
      title:
        "Resources",

      description:
        "Manage class files, recordings, links, and teaching materials"
    },


    ai:{
      title:
        "Kabezya AI",

      description:
        "Inspect student work, draft feedback, summarize performance, and automate repetitive teaching tasks"
    },


    messages:{
      title:
        "Messages",

      description:
        "Communicate with students, colleagues, and your school"
    },


    settings:{
      title:
        "Settings",

      description:
        "Manage your Teacher Studio preferences"
    },


    help:{
      title:
        "Help Center",

      description:
        "Find teaching guides, troubleshooting information, and support"
    }

  });


let activeStudentStudioPage =
  "overview";


/* =========================================================
   NORMALIZE STUDIO PAGE
========================================================= */

function normalizeStudentStudioPage(
  page
){

  const requested =
    String(
      page || ""
    )
      .trim()
      .toLowerCase();


  const aliases = {

    dashboard:
      "overview",

    home:
      "overview",

    class:
      "classes",

    roster:
      "students",

    student:
      "students",

    coursework:
      "assignments",

    assignment:
      "assignments",

    quiz:
      "quizzes",

    assessment:
      "quizzes",

    assessments:
      "quizzes",

    submissions:
      "grading",

    grades:
      "grading",

    calendar:
      "schedule",

    progress:
      "analytics",

    insights:
      "analytics",

    performance:
      "analytics",

    kabezya:
      "ai",

    assistant:
      "ai",

    support:
      "help"

  };


  const normalized =
    aliases[
      requested
    ] ||
    requested;


  return STUDENT_STUDIO_PAGES[
    normalized
  ]
    ? normalized
    : "overview";

}


/* =========================================================
   SET ROUTE CONTENT
========================================================= */

function setStudentStudioRouteContent(
  page
){

  const normalizedPage =
    normalizeStudentStudioPage(
      page
    );


  const config =
    STUDENT_STUDIO_PAGES[
      normalizedPage
    ] ||
    STUDENT_STUDIO_PAGES
      .overview;


  /*
    The dashboard router belongs only to the
    main Teacher Studio dashboard.
  */

  const router =
    document.getElementById(
      "studentStudioRouter"
    );


  const showRouter =
    normalizedPage ===
    "overview";


  if (
    router
  ){

    router.hidden =
      !showRouter;


    router.setAttribute(
      "aria-hidden",
      String(
        !showRouter
      )
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


/* =========================================================
   SET ACTIVE WORKSPACE SECTION
========================================================= */

function setStudentStudioActiveSection(
  page
){

  document
    .querySelectorAll(
      ".section"
    )
    .forEach(
      section => {

        const isActive =
          section.id ===
          `section-${page}`;


        section.classList.toggle(
          "active",
          isActive
        );


        section.hidden =
          !isActive;


        section.setAttribute(
          "aria-hidden",
          String(
            !isActive
          )
        );

      }
    );

}


/* =========================================================
   SET ACTIVE SIDEBAR NAVIGATION
========================================================= */

function setStudentStudioActiveNavigation(
  page
){

  document
    .querySelectorAll(
      [
        ".tab-btn",
        ".dashboard-nav-btn",
        ".student-nav-btn",
        ".student-navigation button",
        ".student-dashboard-nav button",
        "#studentSidebarNavigation [data-page]",
        ".student-sidebar-footer [data-page]"
      ].join(",")
    )
    .forEach(
      button => {

        const buttonPage =
          normalizeStudentStudioPage(
            button.dataset.page ||
            button.dataset.tab ||
            button.getAttribute(
              "data-section"
            ) ||
            ""
          );


        const inlineHandler =
          button.getAttribute(
            "onclick"
          ) ||
          "";


        const handlerMatch =
          inlineHandler.match(
            /openTab\(['"]([^'"]+)['"]\)/
          );


        const resolvedPage =
          handlerMatch
            ? normalizeStudentStudioPage(
                handlerMatch[1]
              )
            : buttonPage;


        const isActive =
          resolvedPage ===
          page;


        button.classList.toggle(
          "active",
          isActive
        );


        button.setAttribute(
          "aria-current",
          isActive
            ? "page"
            : "false"
        );

      }
    );

}


/* =========================================================
   SET ACTIVE MOBILE NAVIGATION
========================================================= */

function setStudentStudioActiveMobileNavigation(
  page
){

  const mobilePageMap = {

    overview:
      "overview",

    classes:
      "classes",

    students:
      "students",

    assignments:
      "assignments",

    schedule:
      "schedule"

  };


  document
    .querySelectorAll(
      ".mobile-nav button"
    )
    .forEach(
      button => {

        const inlineHandler =
          button.getAttribute(
            "onclick"
          ) ||
          "";


        const handlerMatch =
          inlineHandler.match(
            /openTab\(['"]([^'"]+)['"]\)/
          );


        const buttonPage =
          handlerMatch
            ? normalizeStudentStudioPage(
                handlerMatch[1]
              )
            : normalizeStudentStudioPage(
                button.dataset.page ||
                button.dataset.tab ||
                ""
              );


        const expectedPage =
          mobilePageMap[
            page
          ] ||
          page;


        const isActive =
          expectedPage ===
          buttonPage;


        button.classList.toggle(
          "active",
          isActive
        );


        button.setAttribute(
          "aria-current",
          isActive
            ? "page"
            : "false"
        );

      }
    );

}


/* =========================================================
   RENDER ACTIVE TEACHER STUDIO PAGE
========================================================= */

function renderActiveStudentStudioPage(
  page
){

  switch(
    page
  ){

    /* =====================================================
       OVERVIEW
    ===================================================== */

    case "overview":

      renderStudioHome();

      break;


    /* =====================================================
       CLASSES
    ===================================================== */

    case "classes":

      renderClasses();

      break;


    /* =====================================================
       STUDENTS
    ===================================================== */

    case "students":

      renderTeacherStudents();

      break;


    /* =====================================================
       ASSIGNMENTS
    ===================================================== */

    case "assignments":

      renderAssignments();

      break;


    /* =====================================================
       QUIZZES
    ===================================================== */

    case "quizzes":

      renderTeacherQuizzes();

      break;


    /* =====================================================
       ATTENDANCE
    ===================================================== */

    case "attendance":

      renderTeacherAttendance();

      break;


    /* =====================================================
       GRADING
    ===================================================== */

    case "grading":

      renderTeacherGradingCenter();

      break;


    /* =====================================================
       SCHEDULE
    ===================================================== */

    case "schedule":

      bindStudentCalendarControls();

      renderStudentCalendarWorkspace();

      break;


    /* =====================================================
       ANALYTICS
    ===================================================== */

    case "analytics":

      renderTeacherAnalytics();

      break;


    /* =====================================================
       RESOURCES
    ===================================================== */

    case "resources":

      renderTeacherResources();

      break;


    /* =====================================================
       KABEZYA AI
    ===================================================== */

    case "ai":

      renderKabezyaTeacherAssistant();

      break;


    /* =====================================================
       MESSAGES
    ===================================================== */

    case "messages":

      openStudentMessages();

      break;


    /* =====================================================
       SETTINGS
    ===================================================== */

    case "settings":

      renderTeacherSettings();

      break;


    /* =====================================================
       HELP
    ===================================================== */

    case "help":

      renderTeacherHelpCenter();

      break;


    /* =====================================================
       FALLBACK
    ===================================================== */

    default:

      renderStudioHome();

      break;

  }

}


/* =========================================================
   OPEN TEACHER STUDIO PAGE
========================================================= */

function openStudentStudioPage(
  requestedPage,
  options = {}
){

  const page =
    normalizeStudentStudioPage(
      requestedPage
    );


  activeStudentStudioPage =
    page;


  /*
    Keep the same data attribute naming convention
    as student.html for CSS compatibility.
  */

  document.body.dataset
    .studentSection =
    page;


  setStudentStudioRouteContent(
    page
  );


  setStudentStudioActiveSection(
    page
  );


  setStudentStudioActiveNavigation(
    page
  );


  setStudentStudioActiveMobileNavigation(
    page
  );


  renderActiveStudentStudioPage(
    page
  );


  if (
    options.updateHistory !==
    false
  ){

    const url =
      new URL(
        window.location.href
      );


    if (
      page ===
      "overview"
    ){

      url.searchParams.delete(
        "section"
      );

    }else{

      url.searchParams.set(
        "section",
        page
      );

    }


    window.history.replaceState(
      {
        studentStudioPage:
          page
      },
      "",
      url
    );

  }


  if (
    options.scroll !==
    false
  ){

    const workspace =
      document.querySelector(
        ".center-col"
      ) ||
      document.querySelector(
        ".student-main-content"
      ) ||
      document.querySelector(
        ".student-dashboard-workspace"
      ) ||
      document.getElementById(
        "studentStudioWorkspace"
      );


    const top =
      workspace
        ? (
            workspace
              .getBoundingClientRect()
              .top +
            window.scrollY -
            82
          )
        : 0;


    window.scrollTo({
      top:
        Math.max(
          0,
          top
        ),

      behavior:
        options.instant
          ? "auto"
          : "smooth"
    });

  }


  document.dispatchEvent(
    new CustomEvent(
      "teacherstudio:pagechange",
      {
        detail:{
          page
        }
      }
    )
  );

}


/* =========================================================
   COMPATIBILITY ALIAS
========================================================= */

/*
  Keep openTab() exactly as the Student Studio
  architecture expects.

  This lets copied HTML buttons continue to work
  without rewriting inline handlers.
*/

function openTab(
  page
){

  openStudentStudioPage(
    page
  );

}


/* =========================================================
   TEACHER STUDIO SHELL CONTROLLER
========================================================= */

/*
  We deliberately retain the STUDENT_STUDIO naming
  internally so comparison against student.js remains easy.
*/

const STUDENT_STUDIO_STORAGE_KEYS =
  Object.freeze({

    sidebarCollapsed:
      "aiftTeacherStudioSidebarCollapsed",

    activePage:
      "aiftTeacherStudioActivePage"

  });


let studentStudioInitialized =
  false;


/* =========================================================
   MOBILE DETECTION
========================================================= */

function isStudentStudioMobile(){

  return window.matchMedia(
    "(max-width:980px)"
  ).matches;

}


/* =========================================================
   SIDEBAR COLLAPSED STATE
========================================================= */

function setStudentSidebarCollapsed(
  collapsed,
  options = {}
){

  const shouldCollapse =
    Boolean(
      collapsed
    ) &&
    !isStudentStudioMobile();


  document.body.classList.toggle(
    "student-sidebar-collapsed",
    shouldCollapse
  );


  const toggle =
    $(
      "studentSidebarToggle"
    );


  if (
    toggle
  ){

    toggle.setAttribute(
      "aria-expanded",
      String(
        !shouldCollapse
      )
    );


    toggle.setAttribute(
      "aria-label",
      shouldCollapse
        ? "Expand Teacher Studio navigation"
        : "Collapse Teacher Studio navigation"
    );

  }


  if (
    options.persist !==
    false
  ){

    localStorage.setItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed,

      String(
        shouldCollapse
      )
    );

  }

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function setStudentSidebarMobileOpen(
  open
){

  const shouldOpen =
    Boolean(
      open
    ) &&
    isStudentStudioMobile();


  document.body.classList.toggle(
    "student-sidebar-mobile-open",
    shouldOpen
  );


  const toggle =
    $(
      "studentSidebarToggle"
    );


  const overlay =
    $(
      "studentSidebarOverlay"
    );


  if (
    toggle
  ){

    toggle.setAttribute(
      "aria-expanded",
      String(
        shouldOpen
      )
    );

  }


  if (
    overlay
  ){

    overlay.setAttribute(
      "aria-hidden",
      String(
        !shouldOpen
      )
    );

  }

}


/* =========================================================
   TOGGLE STUDIO SIDEBAR
========================================================= */

function toggleStudentStudioSidebar(){

  if (
    isStudentStudioMobile()
  ){

    setStudentSidebarMobileOpen(
      !document.body
        .classList
        .contains(
          "student-sidebar-mobile-open"
        )
    );


    return;

  }


  setStudentSidebarCollapsed(
    !document.body
      .classList
      .contains(
        "student-sidebar-collapsed"
      )
  );

}


/* =========================================================
   CLOSE TOPBAR MENUS
========================================================= */

function closeStudentStudioMenus(){

  const quickMenu =
    $(
      "studentQuickActionsMenu"
    );


  const profileMenu =
    $(
      "studentProfileMenu"
    );


  if (
    quickMenu
  ){

    quickMenu.hidden =
      true;

  }


  if (
    profileMenu
  ){

    profileMenu.hidden =
      true;

  }


  $(
    "studentQuickActionsButton"
  )
    ?.setAttribute(
      "aria-expanded",
      "false"
    );


  $(
    "studentProfileMenuButton"
  )
    ?.setAttribute(
      "aria-expanded",
      "false"
    );

}


/* =========================================================
   TOGGLE TOPBAR MENU
========================================================= */

function toggleStudentStudioMenu(
  menuId,
  buttonId
){

  const menu =
    $(
      menuId
    );


  const button =
    $(
      buttonId
    );


  if (
    !menu ||
    !button
  ){
    return;
  }


  const shouldOpen =
    menu.hidden;


  closeStudentStudioMenus();


  menu.hidden =
    !shouldOpen;


  button.setAttribute(
    "aria-expanded",
    String(
      shouldOpen
    )
  );

}


/* =========================================================
   ACTIVATE TEACHER STUDIO PAGE
========================================================= */

function activateStudentStudioPage(
  requestedPage,
  options = {}
){

  const page =
    normalizeStudentStudioPage(
      requestedPage
    );


  activeStudentStudioPage =
    page;


  document.body.dataset
    .studentSection =
    page;


  /*
    Primary modern workspace container.
  */

  const workspaceSections =
    document.querySelectorAll(
      "#studentWorkspaceSections > .section"
    );


  if (
    workspaceSections.length
  ){

    workspaceSections.forEach(
      section => {

        const active =
          section.id ===
          `section-${page}`;


        section.classList.toggle(
          "active",
          active
        );


        section.hidden =
          !active;


        section.setAttribute(
          "aria-hidden",
          String(
            !active
          )
        );

      }
    );

  }else{

    /*
      Compatibility with the older Student Studio
      section architecture.
    */

    setStudentStudioActiveSection(
      page
    );

  }


  document
    .querySelectorAll(
      "#studentSidebarNavigation [data-page]," +
      ".student-sidebar-footer [data-page]," +
      ".mobile-nav [data-page]"
    )
    .forEach(
      button => {

        const buttonPage =
          normalizeStudentStudioPage(
            button.dataset.page
          );


        const active =
          buttonPage ===
          page;


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

      }
    );


  setStudentStudioRouteContent(
    page
  );


  renderActiveStudentStudioPage(
    page
  );


  localStorage.setItem(
    STUDENT_STUDIO_STORAGE_KEYS
      .activePage,

    page
  );


  if (
    options.history !==
    false
  ){

    const url =
      new URL(
        window.location.href
      );


    if (
      page ===
      "overview"
    ){

      url.searchParams.delete(
        "section"
      );

    }else{

      url.searchParams.set(
        "section",
        page
      );

    }


    window.history.replaceState(
      {
        studentStudioPage:
          page
      },
      "",
      url
    );

  }


  if (
    options.scroll !==
      false &&
    $(
      "studentStudioWorkspace"
    )
  ){

    $(
      "studentStudioWorkspace"
    )
      .scrollIntoView({
        behavior:
          options.instant
            ? "auto"
            : "smooth",

        block:
          "start"
      });

  }


  setStudentSidebarMobileOpen(
    false
  );


  closeStudentStudioMenus();

}


/* =========================================================
   BIND SIDEBAR NAVIGATION
========================================================= */

function bindStudentStudioNavigation(){

  document
    .querySelectorAll(
      "#studentSidebarNavigation [data-page]," +
      ".student-sidebar-footer [data-page]," +
      ".mobile-nav [data-page]"
    )
    .forEach(
      button => {

        if (
          button.dataset
            .studentStudioBound ===
          "true"
        ){
          return;
        }


        button.dataset
          .studentStudioBound =
          "true";


        button.addEventListener(
          "click",
          () => {

            activateStudentStudioPage(
              button.dataset.page
            );

          }
        );

      }
    );

}


/* =========================================================
   BIND TOPBAR
========================================================= */

function bindStudentStudioTopbar(){

  $(
    "studentSidebarToggle"
  )
    ?.addEventListener(
      "click",
      toggleStudentStudioSidebar
    );


  $(
    "studentSidebarOverlay"
  )
    ?.addEventListener(
      "click",
      () => {

        setStudentSidebarMobileOpen(
          false
        );

      }
    );


  $(
    "studentQuickActionsButton"
  )
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


  $(
    "studentProfileMenuButton"
  )
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


  $(
    "studentMessagesButton"
  )
    ?.addEventListener(
      "click",
      () => {

        activateStudentStudioPage(
          "messages"
        );

      }
    );


  $(
    "studentWorkspaceSearchButton"
  )
    ?.addEventListener(
      "click",
      () => {

        $(
          "globalSearch"
        )
          ?.focus();

      }
    );


  $(
    "studentSidebarHelpButton"
  )
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
   QUICK ACTIONS
========================================================= */

function bindStudentStudioQuickActions(){

  $(
    "studentQuickActionsMenu"
  )
    ?.querySelectorAll(
      "[data-studio-action]"
    )
    .forEach(
      button => {

        if (
          button.dataset
            .teacherQuickActionBound ===
          "true"
        ){
          return;
        }


        button.dataset
          .teacherQuickActionBound =
          "true";


        button.addEventListener(
          "click",
          () => {

            const action =
              String(
                button.dataset
                  .studioAction ||
                ""
              )
                .trim()
                .toLowerCase();


            closeStudentStudioMenus();


            switch(
              action
            ){

              /*
                In Teacher Studio the old Student
                "Submit work" quick action becomes
                assignment management.
              */

              case "submit":

                activateStudentStudioPage(
                  "assignments"
                );

                break;


              case "assignment":

                activateStudentStudioPage(
                  "assignments"
                );

                break;


              case "students":

                activateStudentStudioPage(
                  "students"
                );

                break;


              case "grading":

                activateStudentStudioPage(
                  "grading"
                );

                break;


              case "calendar":

                activateStudentStudioPage(
                  "schedule"
                );

                break;


              case "attendance":

                activateStudentStudioPage(
                  "attendance"
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

      }
    );

}


/* =========================================================
   PROFILE MENU ACTIONS
========================================================= */

function bindStudentProfileActions(){

  const menu =
    $(
      "studentProfileMenu"
    );


  if (
    !menu
  ){
    return;
  }


  menu
    .querySelectorAll(
      "[data-profile-action]"
    )
    .forEach(
      button => {

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


            switch(
              action
            ){

              /* =========================================
                 PROFILE
              ========================================= */

              case "profile":

                /*
                  Keep this conservative for now.

                  We will connect the teacher public
                  profile page once we work on the
                  Profile section.
                */

                window.location.href =
                  selectedTeacherId
                    ? `public-profile.html?id=${
                        encodeURIComponent(
                          selectedTeacherId
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
                  "teacherToken",
                  "schoolToken",
                  "adminToken",
                  "token",
                  "role",
                  "userId"
                ]
                  .forEach(
                    key => {

                      localStorage.removeItem(
                        key
                      );

                    }
                  );


                sessionStorage.removeItem(
                  "token"
                );


                window.location.href =
                  "login.html";

                break;

            }

          }
        );

      }
    );

}


/* =========================================================
   RESTORE TEACHER STUDIO STATE
========================================================= */

function restoreStudentStudioState(){

  const storedCollapsed =
    localStorage.getItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed
    ) ===
    "true";


  setStudentSidebarCollapsed(
    storedCollapsed,
    {
      persist:
        false
    }
  );


  const urlPage =
    new URLSearchParams(
      window.location.search
    ).get(
      "section"
    );


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


/* =========================================================
   HANDLE STUDIO RESIZE
========================================================= */

function handleStudentStudioResize(){

  if (
    !isStudentStudioMobile()
  ){

    setStudentSidebarMobileOpen(
      false
    );

  }


  const storedCollapsed =
    localStorage.getItem(
      STUDENT_STUDIO_STORAGE_KEYS
        .sidebarCollapsed
    ) ===
    "true";


  setStudentSidebarCollapsed(
    storedCollapsed,
    {
      persist:
        false
    }
  );

}


/* =========================================================
   INITIALIZE TEACHER STUDIO SHELL
========================================================= */

function initializeStudentStudioShell(){

  if (
    studentStudioInitialized
  ){

    bindStudentStudioNavigation();

    return;

  }


  studentStudioInitialized =
    true;


  bindStudentStudioNavigation();


  bindStudentStudioTopbar();


  bindStudentClassControls();


  bindTeacherStudentControls();


  bindStudentAssignmentControls();


  bindTeacherQuizControls();


  bindTeacherAttendanceControls();


  bindTeacherGradingControls();


  bindStudentCalendarControls();


  bindTeacherAnalyticsControls();


  bindTeacherResourceControls();


  bindStudentStudioQuickActions();


  bindStudentProfileActions();


  const initialPage =
    restoreStudentStudioState();


  activateStudentStudioPage(
    initialPage,
    {
      history:
        false,

      scroll:
        false,

      instant:
        true
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
        event.state
          ?.studentStudioPage ||
        new URLSearchParams(
          window.location.search
        ).get(
          "section"
        ) ||
        "overview",

        {
          history:
            false,

          scroll:
            false,

          instant:
            true
        }
      );

    }
  );

}


/* =========================================================
   API GET
========================================================= */

async function apiGet(
  path,
  fallback = null
){

  try{

    const res =
      await fetch(
        API + path,
        {
          headers:
            authHeaders()
        }
      );


    if (
      res.status ===
      401
    ){

      [
        "teacherToken",
        "schoolToken",
        "adminToken",
        "token",
        "role",
        "userId"
      ]
        .forEach(
          key => {

            localStorage.removeItem(
              key
            );

          }
        );


      sessionStorage.removeItem(
        "token"
      );


      window.location.href =
        "login.html";


      return fallback;

    }


    if (
      !res.ok
    ){

      console.warn(
        "GET failed:",
        path,
        res.status
      );


      return fallback;

    }


    return await safeJson(
      res
    );

  }catch(
    err
  ){

    console.warn(
      "GET network failed:",
      path,
      err
    );


    return fallback;

  }

}


/* =========================================================
   API SEND
========================================================= */

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
    body !==
      undefined &&
    method !==
      "GET" &&
    method !==
      "HEAD"
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


  const data =
    await safeJson(
      res
    );


  if (
    res.status ===
    401
  ){

    [
      "teacherToken",
      "schoolToken",
      "adminToken",
      "token",
      "role",
      "userId"
    ]
      .forEach(
        key => {

          localStorage.removeItem(
            key
          );

        }
      );


    sessionStorage.removeItem(
      "token"
    );


    window.location.href =
      "login.html";


    throw new Error(
      "Your session has expired."
    );

  }


  if (
    !res.ok
  ){

    throw new Error(
      data?.message ||
      data?.error ||
      "Request failed."
    );

  }


  return data;

}

/* =========================================================
   TEACHER STUDIO
   PART 4
   OVERVIEW / DASHBOARD CONTROLLER
========================================================= */


/* =========================================================
   DATE HELPERS
========================================================= */

function startOfTeacherDay(
  value = new Date()
){

  const date =
    value instanceof Date
      ? new Date(
          value
        )
      : new Date(
          value
        );


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


function endOfTeacherDay(
  value = new Date()
){

  const date =
    startOfTeacherDay(
      value
    );


  if (
    !date
  ){
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


function isTeacherDateToday(
  value
){

  if (
    !value
  ){
    return false;
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return false;
  }


  const today =
    new Date();


  return (
    date.getFullYear() ===
      today.getFullYear() &&
    date.getMonth() ===
      today.getMonth() &&
    date.getDate() ===
      today.getDate()
  );

}


function formatTeacherTime(
  value
){

  if (
    !value
  ){
    return "";
  }


  /*
    Some schedules may store only a time string.
  */

  if (
    typeof value ===
      "string" &&
    /^\d{1,2}:\d{2}/.test(
      value
    )
  ){

    const parts =
      value
        .split(
          ":"
        );


    let hour =
      Number(
        parts[0]
      );


    const minute =
      String(
        parts[1] ||
        "00"
      )
        .slice(
          0,
          2
        )
        .padStart(
          2,
          "0"
        );


    if (
      Number.isNaN(
        hour
      )
    ){
      return value;
    }


    const suffix =
      hour >= 12
        ? "PM"
        : "AM";


    hour =
      hour % 12 ||
      12;


    return `${hour}:${minute} ${suffix}`;

  }


  const date =
    new Date(
      value
    );


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


function formatTeacherDate(
  value,
  options = {}
){

  if (
    !value
  ){
    return "";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return "";
  }


  return date.toLocaleDateString(
    [],
    {
      month:
        options.month ||
        "short",

      day:
        options.day ||
        "numeric",

      year:
        options.year ||
        undefined
    }
  );

}


function formatTeacherRelativeTime(
  value
){

  if (
    !value
  ){
    return "";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return "";
  }


  const difference =
    Date.now() -
    date.getTime();


  const absoluteDifference =
    Math.abs(
      difference
    );


  const minute =
    60 *
    1000;


  const hour =
    60 *
    minute;


  const day =
    24 *
    hour;


  if (
    absoluteDifference <
    minute
  ){

    return "Just now";

  }


  if (
    absoluteDifference <
    hour
  ){

    const minutes =
      Math.max(
        1,
        Math.floor(
          absoluteDifference /
          minute
        )
      );


    return difference >= 0
      ? `${minutes}m ago`
      : `in ${minutes}m`;

  }


  if (
    absoluteDifference <
    day
  ){

    const hours =
      Math.max(
        1,
        Math.floor(
          absoluteDifference /
          hour
        )
      );


    return difference >= 0
      ? `${hours}h ago`
      : `in ${hours}h`;

  }


  const days =
    Math.max(
      1,
      Math.floor(
        absoluteDifference /
        day
      )
    );


  if (
    days <= 7
  ){

    return difference >= 0
      ? `${days}d ago`
      : `in ${days}d`;

  }


  return formatTeacherDate(
    date,
    {
      year:
        "numeric"
    }
  );

}


/* =========================================================
   GENERAL TEACHER DISPLAY HELPERS
========================================================= */

function getTeacherDisplayName(
  user
){

  if (
    !user
  ){
    return "Unknown";
  }


  if (
    typeof user ===
    "string"
  ){
    return user;
  }


  return String(
    user.name ||
    user.fullName ||
    user.displayName ||
    user.email ||
    "Unknown"
  ).trim();

}


function getTeacherStudentAvatar(
  student
){

  if (
    !student ||
    typeof student !==
      "object"
  ){

    return FALLBACK_AVATAR;

  }


  return (
    student.profileImage ||
    student.avatar ||
    student.profilePicture ||
    FALLBACK_AVATAR
  );

}


function getTeacherClassTitle(
  classItem
){

  return String(
    classItem?.title ||
    classItem?.name ||
    classItem?.subject ||
    classItem?.className ||
    "Untitled class"
  ).trim();

}


function getTeacherAssignmentTitle(
  assignment
){

  return String(
    assignment?.title ||
    assignment?.name ||
    assignment?.assignmentTitle ||
    "Untitled assignment"
  ).trim();

}


function getTeacherScheduleTitle(
  schedule
){

  return String(
    schedule?.title ||
    schedule?.name ||
    schedule?.subject ||
    schedule?.classId?.title ||
    schedule?.classId?.subject ||
    "Class session"
  ).trim();

}


/* =========================================================
   ASSIGNMENT LOOKUP
========================================================= */

function getTeacherAssignmentById(
  assignmentId
){

  const normalizedId =
    normalizeId(
      assignmentId
    );


  if (
    !normalizedId
  ){
    return null;
  }


  return (
    getTeacherAssignments()
      .find(
        assignment =>
          sameId(
            assignment?._id ||
            assignment?.id,
            normalizedId
          )
      ) ||
    null
  );

}


/* =========================================================
   CLASS LOOKUP
========================================================= */

function getTeacherClassById(
  classId
){

  const normalizedId =
    normalizeId(
      classId
    );


  if (
    !normalizedId
  ){
    return null;
  }


  return (
    getTeacherClasses()
      .find(
        classItem =>
          sameId(
            classItem?._id ||
            classItem?.id,
            normalizedId
          )
      ) ||
    null
  );

}


/* =========================================================
   STUDENT LOOKUP
========================================================= */

function getTeacherStudentById(
  studentId
){

  const normalizedId =
    normalizeId(
      studentId
    );


  if (
    !normalizedId
  ){
    return null;
  }


  return (
    asArray(
      state.students
    )
      .find(
        student =>
          sameId(
            student?._id ||
            student?.id,
            normalizedId
          )
      ) ||
    null
  );

}


/* =========================================================
   SUBMISSION LOOKUPS
========================================================= */

function getTeacherSubmissionStudent(
  submission
){

  const student =
    submission?.studentId;


  if (
    student &&
    typeof student ===
    "object"
  ){

    return student;

  }


  return (
    getTeacherStudentById(
      student
    ) ||
    null
  );

}


function getTeacherSubmissionAssignment(
  submission
){

  const assignment =
    submission?.assignmentId;


  if (
    assignment &&
    typeof assignment ===
    "object"
  ){

    return assignment;

  }


  return (
    getTeacherAssignmentById(
      assignment
    ) ||
    null
  );

}


function getTeacherSubmissionClass(
  submission
){

  const classItem =
    submission?.classId;


  if (
    classItem &&
    typeof classItem ===
    "object"
  ){

    return classItem;

  }


  return (
    getTeacherClassById(
      classItem
    ) ||
    null
  );

}


/* =========================================================
   TODAY'S SCHEDULE
========================================================= */

function getTeacherScheduleDate(
  schedule
){

  return (
    schedule?.startDate ||
    schedule?.start ||
    schedule?.date ||
    schedule?.scheduledAt ||
    schedule?.sessionDate ||
    schedule?.createdAt ||
    null
  );

}


function getTeacherScheduleStartTime(
  schedule
){

  return (
    schedule?.startTime ||
    schedule?.time ||
    schedule?.start ||
    schedule?.scheduledAt ||
    ""
  );

}


function getTeacherTodaySchedules(){

  return getTeacherSchedules()
    .filter(
      schedule =>
        isTeacherDateToday(
          getTeacherScheduleDate(
            schedule
          )
        )
    )
    .sort(
      (
        first,
        second
      ) => {

        const firstDate =
          new Date(
            first?.start ||
            first?.scheduledAt ||
            first?.date ||
            0
          )
            .getTime();


        const secondDate =
          new Date(
            second?.start ||
            second?.scheduledAt ||
            second?.date ||
            0
          )
            .getTime();


        if (
          Number.isNaN(
            firstDate
          ) ||
          Number.isNaN(
            secondDate
          )
        ){

          return String(
            getTeacherScheduleStartTime(
              first
            )
          )
            .localeCompare(
              String(
                getTeacherScheduleStartTime(
                  second
                )
              )
            );

        }


        return (
          firstDate -
          secondDate
        );

      }
    );

}


/* =========================================================
   UPCOMING ASSIGNMENTS
========================================================= */

function getTeacherUpcomingAssignments(
  limit = 5
){

  const now =
    Date.now();


  return getTeacherAssignments()
    .filter(
      assignment => {

        const dueDate =
          new Date(
            assignment?.dueDate ||
            assignment?.deadline ||
            assignment?.endDate ||
            ""
          );


        if (
          Number.isNaN(
            dueDate.getTime()
          )
        ){
          return false;
        }


        return (
          dueDate.getTime() >=
          now
        );

      }
    )
    .sort(
      (
        first,
        second
      ) => {

        const firstDate =
          new Date(
            first?.dueDate ||
            first?.deadline ||
            first?.endDate
          )
            .getTime();


        const secondDate =
          new Date(
            second?.dueDate ||
            second?.deadline ||
            second?.endDate
          )
            .getTime();


        return (
          firstDate -
          secondDate
        );

      }
    )
    .slice(
      0,
      Math.max(
        0,
        Number(
          limit
        ) ||
        5
      )
    );

}


/* =========================================================
   RECENT SUBMISSIONS
========================================================= */

function getTeacherRecentSubmissions(
  limit = 6
){

  return [
    ...getTeacherSubmissions()
  ]
    .sort(
      (
        first,
        second
      ) => {

        const firstTime =
          new Date(
            first?.submittedAt ||
            first?.createdAt ||
            0
          )
            .getTime();


        const secondTime =
          new Date(
            second?.submittedAt ||
            second?.createdAt ||
            0
          )
            .getTime();


        return (
          secondTime -
          firstTime
        );

      }
    )
    .slice(
      0,
      Math.max(
        0,
        Number(
          limit
        ) ||
        6
      )
    );

}


/* =========================================================
   CLASS STUDENT COUNT
========================================================= */

function getTeacherClassStudentCount(
  classItem
){

  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );


  if (
    !classId
  ){
    return 0;
  }


  const cached =
    getTeacherClassData(
      classId
    );


  if (
    cached.students.length
  ){

    return cached.students.length;

  }


  return asArray(
    classItem?.studentIds
  ).length;

}


/* =========================================================
   CLASS PENDING GRADING COUNT
========================================================= */

function getTeacherClassPendingCount(
  classItem
){

  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );


  if (
    !classId
  ){
    return 0;
  }


  return getPendingTeacherSubmissions()
    .filter(
      submission =>
        sameId(
          submission?.classId?._id ||
          submission?.classId,
          classId
        )
    )
    .length;

}


/* =========================================================
   CLASS ATTENDANCE RATE
========================================================= */

function getTeacherClassAttendanceRate(
  classItem
){

  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );


  const records =
    asArray(
      state.attendance
    )
      .filter(
        record =>
          sameId(
            record?.classId?._id ||
            record?.classId,
            classId
          )
      );


  if (
    !records.length
  ){
    return 0;
  }


  const attended =
    records.filter(
      record =>
        [
          "present",
          "late"
        ].includes(
          String(
            record?.status ||
            ""
          )
            .toLowerCase()
        )
    )
      .length;


  return clampPercentage(
    (
      attended /
      records.length
    ) *
    100
  );

}


/* =========================================================
   TEACHER OVERVIEW SUMMARY
========================================================= */

function getTeacherOverviewSummary(){

  const classes =
    getTeacherClasses();


  const students =
    asArray(
      state.students
    );


  const assignments =
    getTeacherAssignments();


  const submissions =
    getTeacherSubmissions();


  const pending =
    getPendingTeacherSubmissions();


  const todaySchedules =
    getTeacherTodaySchedules();


  return {

    classes:
      classes.length,

    students:
      students.length,

    assignments:
      assignments.length,

    submissions:
      submissions.length,

    pendingGrading:
      pending.length,

    todayClasses:
      todaySchedules.length,

    attendance:
      calculateTeacherAttendanceRate(),

    reviewRate:
      calculateTeacherReviewRate()

  };

}


/* =========================================================
   OVERVIEW ELEMENT HELPER
========================================================= */

function getTeacherOverviewElement(
  ...ids
){

  for (
    const id of ids
  ){

    const element =
      $(
        id
      );


    if (
      element
    ){

      return element;

    }

  }


  return null;

}


/* =========================================================
   OVERVIEW STAT CARDS
========================================================= */

function renderTeacherOverviewStats(){

  const summary =
    getTeacherOverviewSummary();


  const values = {

    classes:
      summary.classes,

    students:
      summary.students,

    pending:
      summary.pendingGrading,

    today:
      summary.todayClasses

  };


  const mappings = [

    {
      value:
        values.classes,

      ids:[
        "teacherOverviewClasses",
        "overviewClassCount",
        "dashboardClassCount",
        "statClasses"
      ]
    },

    {
      value:
        values.students,

      ids:[
        "teacherOverviewStudents",
        "overviewStudentCount",
        "dashboardStudentCount",
        "statStudents"
      ]
    },

    {
      value:
        values.pending,

      ids:[
        "teacherOverviewPending",
        "overviewPendingCount",
        "dashboardPendingCount",
        "statPendingGrading"
      ]
    },

    {
      value:
        values.today,

      ids:[
        "teacherOverviewToday",
        "overviewTodayCount",
        "dashboardTodayCount"
      ]
    }

  ];


  mappings.forEach(
    mapping => {

      mapping.ids.forEach(
        id => {

          const element =
            $(
              id
            );


          if (
            element
          ){

            element.textContent =
              String(
                mapping.value
              );

          }

        }
      );

    }
  );

}


/* =========================================================
   RENDER ASSIGNED CLASS CARD
========================================================= */

function createTeacherOverviewClassCard(
  classItem
){

  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );


  const title =
    getTeacherClassTitle(
      classItem
    );


  const subject =
    String(
      classItem?.subject ||
      classItem?.course ||
      classItem?.category ||
      ""
    ).trim();


  const students =
    getTeacherClassStudentCount(
      classItem
    );


  const pending =
    getTeacherClassPendingCount(
      classItem
    );


  const attendance =
    getTeacherClassAttendanceRate(
      classItem
    );


  return `
    <article
      class="teacher-overview-class-card"
      data-teacher-class-id="${escapeHtml(
        classId
      )}"
    >

      <div
        class="teacher-overview-class-card-head"
      >

        <div
          class="teacher-overview-class-icon"
          aria-hidden="true"
        >
          <i
            class="fa-solid fa-chalkboard-user"
          ></i>
        </div>

        <div
          class="teacher-overview-class-title-wrap"
        >

          <h4>
            ${escapeHtml(
              title
            )}
          </h4>

          ${
            subject
              ? `
                <p>
                  ${escapeHtml(
                    subject
                  )}
                </p>
              `
              : ""
          }

        </div>

        <button
          type="button"
          class="teacher-overview-card-menu"
          data-teacher-class-menu="${escapeHtml(
            classId
          )}"
          aria-label="Class options"
        >
          <i
            class="fa-solid fa-ellipsis"
          ></i>
        </button>

      </div>

      <div
        class="teacher-overview-class-metrics"
      >

        <div>
          <strong>
            ${students}
          </strong>

          <span>
            Students
          </span>
        </div>

        <div>
          <strong>
            ${pending}
          </strong>

          <span>
            To grade
          </span>
        </div>

        <div>
          <strong>
            ${attendance}%
          </strong>

          <span>
            Attendance
          </span>
        </div>

      </div>

      <div
        class="teacher-overview-class-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-class-action="students"
          data-class-id="${escapeHtml(
            classId
          )}"
        >
          <i
            class="fa-solid fa-users"
          ></i>

          <span>
            Students
          </span>
        </button>

        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-class-action="open"
          data-class-id="${escapeHtml(
            classId
          )}"
        >
          <span>
            Open class
          </span>

          <i
            class="fa-solid fa-arrow-right"
          ></i>
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   RENDER ASSIGNED CLASSES
========================================================= */

function renderTeacherOverviewClasses(){

  const container =
    getTeacherOverviewElement(
      "teacherOverviewClassesList",
      "teacherAssignedClasses",
      "overviewClassesList",
      "dashboardClassesList"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  if (
    !classes.length
  ){

    container.innerHTML = `
      <div
        class="teacher-overview-empty"
      >

        <div
          class="teacher-overview-empty-icon"
        >
          <i
            class="fa-solid fa-chalkboard"
          ></i>
        </div>

        <h4>
          No assigned classes yet
        </h4>

        <p>
          Classes assigned to you by your school
          will appear here.
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML =
    classes
      .slice(
        0,
        6
      )
      .map(
        createTeacherOverviewClassCard
      )
      .join(
        ""
      );

}


/* =========================================================
   RENDER TODAY'S SCHEDULE
========================================================= */

function renderTeacherTodaySchedule(){

  const container =
    getTeacherOverviewElement(
      "teacherTodaySchedule",
      "todayScheduleList",
      "teacherOverviewSchedule",
      "dashboardScheduleList"
    );


  if (
    !container
  ){
    return;
  }


  const schedules =
    getTeacherTodaySchedules();


  if (
    !schedules.length
  ){

    container.innerHTML = `
      <div
        class="teacher-overview-empty teacher-overview-empty-compact"
      >

        <div
          class="teacher-overview-empty-icon"
        >
          <i
            class="fa-regular fa-calendar-check"
          ></i>
        </div>

        <h4>
          No classes scheduled today
        </h4>

        <p>
          Your upcoming teaching sessions
          will appear here.
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML =
    schedules
      .slice(
        0,
        5
      )
      .map(
        schedule => {

          const classId =
            normalizeId(
              schedule?.classId?._id ||
              schedule?.classId
            );


          const title =
            getTeacherScheduleTitle(
              schedule
            );


          const start =
            formatTeacherTime(
              getTeacherScheduleStartTime(
                schedule
              )
            );


          const end =
            formatTeacherTime(
              schedule?.endTime ||
              schedule?.end
            );


          const meetingLink =
            String(
              schedule?.meetingLink ||
              schedule?.meetingUrl ||
              schedule?.link ||
              ""
            ).trim();


          return `
            <article
              class="teacher-today-schedule-item"
              data-schedule-id="${escapeHtml(
                normalizeId(
                  schedule?._id ||
                  schedule?.id
                )
              )}"
            >

              <div
                class="teacher-schedule-time"
              >
                <strong>
                  ${escapeHtml(
                    start ||
                    "Scheduled"
                  )}
                </strong>

                ${
                  end
                    ? `
                      <span>
                        ${escapeHtml(
                          end
                        )}
                      </span>
                    `
                    : ""
                }
              </div>

              <div
                class="teacher-schedule-content"
              >

                <h4>
                  ${escapeHtml(
                    title
                  )}
                </h4>

                <p>
                  ${
                    escapeHtml(
                      schedule?.location ||
                      schedule?.room ||
                      (
                        meetingLink
                          ? "Online session"
                          : "Class session"
                      )
                    )
                  }
                </p>

              </div>

              <div
                class="teacher-schedule-actions"
              >

                ${
                  meetingLink
                    ? `
                      <button
                        type="button"
                        class="teacher-primary-icon-button"
                        data-teacher-schedule-action="join"
                        data-meeting-link="${escapeHtml(
                          meetingLink
                        )}"
                        aria-label="Join session"
                      >
                        <i
                          class="fa-solid fa-video"
                        ></i>
                      </button>
                    `
                    : `
                      <button
                        type="button"
                        class="teacher-primary-icon-button"
                        data-teacher-class-action="open"
                        data-class-id="${escapeHtml(
                          classId
                        )}"
                        aria-label="Open class"
                      >
                        <i
                          class="fa-solid fa-arrow-right"
                        ></i>
                      </button>
                    `
                }

              </div>

            </article>
          `;

        }
      )
      .join(
        ""
      );

}


/* =========================================================
   RENDER PENDING GRADING
========================================================= */

function renderTeacherPendingGrading(){

  const container =
    getTeacherOverviewElement(
      "teacherPendingGrading",
      "pendingGradingList",
      "teacherOverviewGrading",
      "dashboardPendingGrading"
    );


  if (
    !container
  ){
    return;
  }


  const submissions =
    getPendingTeacherSubmissions()
      .slice(
        0,
        6
      );


  if (
    !submissions.length
  ){

    container.innerHTML = `
      <div
        class="teacher-overview-empty teacher-overview-empty-compact"
      >

        <div
          class="teacher-overview-empty-icon"
        >
          <i
            class="fa-solid fa-circle-check"
          ></i>
        </div>

        <h4>
          You're all caught up
        </h4>

        <p>
          There are no student submissions
          waiting for review.
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML =
    submissions
      .map(
        submission => {

          const student =
            getTeacherSubmissionStudent(
              submission
            );


          const assignment =
            getTeacherSubmissionAssignment(
              submission
            );


          const studentName =
            getTeacherDisplayName(
              student
            );


          const assignmentTitle =
            getTeacherAssignmentTitle(
              assignment
            );


          const submissionId =
            normalizeId(
              submission?._id ||
              submission?.id
            );


          const submittedAt =
            formatTeacherRelativeTime(
              submission?.submittedAt ||
              submission?.createdAt
            );


          return `
            <article
              class="teacher-grading-item"
              data-submission-id="${escapeHtml(
                submissionId
              )}"
            >

              <img
                class="teacher-grading-avatar"
                src="${escapeHtml(
                  getTeacherStudentAvatar(
                    student
                  )
                )}"
                alt="${escapeHtml(
                  studentName
                )}"
              />

              <div
                class="teacher-grading-content"
              >

                <div
                  class="teacher-grading-title"
                >
                  ${escapeHtml(
                    studentName
                  )}
                </div>

                <div
                  class="teacher-grading-subtitle"
                >
                  ${escapeHtml(
                    assignmentTitle
                  )}
                </div>

                ${
                  submittedAt
                    ? `
                      <div
                        class="teacher-grading-time"
                      >
                        Submitted
                        ${escapeHtml(
                          submittedAt
                        )}
                      </div>
                    `
                    : ""
                }

              </div>

              <button
                type="button"
                class="teacher-review-button"
                data-teacher-submission-action="review"
                data-submission-id="${escapeHtml(
                  submissionId
                )}"
              >
                Review
              </button>

            </article>
          `;

        }
      )
      .join(
        ""
      );

}


/* =========================================================
   RENDER RECENT SUBMISSIONS
========================================================= */

function renderTeacherRecentSubmissions(){

  const container =
    getTeacherOverviewElement(
      "teacherRecentSubmissions",
      "recentSubmissionList",
      "teacherOverviewSubmissions",
      "dashboardRecentSubmissions"
    );


  if (
    !container
  ){
    return;
  }


  const submissions =
    getTeacherRecentSubmissions(
      6
    );


  if (
    !submissions.length
  ){

    container.innerHTML = `
      <div
        class="teacher-overview-empty teacher-overview-empty-compact"
      >

        <div
          class="teacher-overview-empty-icon"
        >
          <i
            class="fa-regular fa-file-lines"
          ></i>
        </div>

        <h4>
          No submissions yet
        </h4>

        <p>
          Recent student work will appear here.
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML =
    submissions
      .map(
        submission => {

          const student =
            getTeacherSubmissionStudent(
              submission
            );


          const assignment =
            getTeacherSubmissionAssignment(
              submission
            );


          const classItem =
            getTeacherSubmissionClass(
              submission
            );


          const status =
            normalizeSubmissionStatus(
              submission?.status
            );


          const statusLabel =
            status === "reviewed"
              ? "Reviewed"
              : status === "returned"
                ? "Returned"
                : "Submitted";


          const statusClass =
            status === "reviewed"
              ? "is-reviewed"
              : status === "returned"
                ? "is-returned"
                : "is-submitted";


          return `
            <article
              class="teacher-recent-submission"
            >

              <img
                src="${escapeHtml(
                  getTeacherStudentAvatar(
                    student
                  )
                )}"
                alt="${escapeHtml(
                  getTeacherDisplayName(
                    student
                  )
                )}"
              />

              <div
                class="teacher-recent-submission-main"
              >

                <div
                  class="teacher-recent-submission-top"
                >

                  <strong>
                    ${escapeHtml(
                      getTeacherDisplayName(
                        student
                      )
                    )}
                  </strong>

                  <span
                    class="teacher-submission-status ${statusClass}"
                  >
                    ${statusLabel}
                  </span>

                </div>

                <p>
                  ${escapeHtml(
                    getTeacherAssignmentTitle(
                      assignment
                    )
                  )}
                </p>

                <div
                  class="teacher-recent-submission-meta"
                >

                  <span>
                    ${escapeHtml(
                      getTeacherClassTitle(
                        classItem
                      )
                    )}
                  </span>

                  <span
                    aria-hidden="true"
                  >
                    •
                  </span>

                  <span>
                    ${escapeHtml(
                      formatTeacherRelativeTime(
                        submission?.submittedAt ||
                        submission?.createdAt
                      )
                    )}
                  </span>

                </div>

              </div>

            </article>
          `;

        }
      )
      .join(
        ""
      );

}


/* =========================================================
   KABEZYA AI
   ATTENTION SIGNAL CONTROLLER
========================================================= */

/*
  Kabezya does NOT grade students here.

  This controller only identifies work that may deserve
  teacher attention.

  Final grading and academic decisions remain with the
  teacher.
*/

function buildKabezyaTeacherSignals(){

  const signals =
    [];


  const now =
    Date.now();


  const day =
    24 *
    60 *
    60 *
    1000;


  /* =======================================================
     SIGNAL 1
     OLD UNREVIEWED SUBMISSIONS
  ======================================================= */

  getPendingTeacherSubmissions()
    .forEach(
      submission => {

        const submittedAt =
          new Date(
            submission?.submittedAt ||
            submission?.createdAt ||
            0
          )
            .getTime();


        if (
          !submittedAt ||
          Number.isNaN(
            submittedAt
          )
        ){
          return;
        }


        const age =
          now -
          submittedAt;


        if (
          age <
          2 *
          day
        ){
          return;
        }


        const student =
          getTeacherSubmissionStudent(
            submission
          );


        const assignment =
          getTeacherSubmissionAssignment(
            submission
          );


        signals.push({

          type:
            "grading",

          priority:
            age >=
            5 *
            day
              ? "high"
              : "medium",

          title:
            "Submission waiting for review",

          message:
            `${
              getTeacherDisplayName(
                student
              )
            } submitted "${
              getTeacherAssignmentTitle(
                assignment
              )
            }" ${
              formatTeacherRelativeTime(
                submission?.submittedAt ||
                submission?.createdAt
              )
            }.`,

          studentId:
            normalizeId(
              student?._id ||
              student?.id
            ),

          submissionId:
            normalizeId(
              submission?._id ||
              submission?.id
            ),

          action:
            "review"

        });

      }
    );


  /* =======================================================
     SIGNAL 2
     LOW ATTENDANCE
  ======================================================= */

  asArray(
    state.students
  )
    .forEach(
      student => {

        const studentId =
          normalizeId(
            student?._id ||
            student?.id
          );


        if (
          !studentId
        ){
          return;
        }


        const attendanceRecords =
          asArray(
            state.attendance
          )
            .filter(
              record =>
                sameId(
                  record?.studentId?._id ||
                  record?.studentId,
                  studentId
                )
            );


        if (
          attendanceRecords.length <
          3
        ){
          return;
        }


        const attended =
          attendanceRecords.filter(
            record =>
              [
                "present",
                "late"
              ].includes(
                String(
                  record?.status ||
                  ""
                )
                  .toLowerCase()
              )
          )
            .length;


        const rate =
          clampPercentage(
            (
              attended /
              attendanceRecords.length
            ) *
            100
          );


        if (
          rate >=
          75
        ){
          return;
        }


        signals.push({

          type:
            "attendance",

          priority:
            rate <
            60
              ? "high"
              : "medium",

          title:
            "Attendance may need attention",

          message:
            `${
              getTeacherDisplayName(
                student
              )
            } currently has ${rate}% attendance across recorded sessions.`,

          studentId:
            studentId,

          attendanceRate:
            rate,

          action:
            "student"

        });

      }
    );


  /* =======================================================
     SIGNAL 3
     OVERDUE ASSIGNMENTS WITH NO SUBMISSION
  ======================================================= */

  getTeacherAssignments()
    .forEach(
      assignment => {

        const dueDate =
          new Date(
            assignment?.dueDate ||
            assignment?.deadline ||
            ""
          )
            .getTime();


        if (
          !dueDate ||
          Number.isNaN(
            dueDate
          ) ||
          dueDate >=
          now
        ){
          return;
        }


        const classId =
          normalizeId(
            assignment?.classId?._id ||
            assignment?.classId
          );


        const classData =
          getTeacherClassData(
            classId
          );


        const assignmentId =
          normalizeId(
            assignment?._id ||
            assignment?.id
          );


        classData.students
          .forEach(
            student => {

              const studentId =
                normalizeId(
                  student?._id ||
                  student?.id
                );


              const submitted =
                getTeacherSubmissions()
                  .some(
                    submission =>
                      sameId(
                        submission?.assignmentId?._id ||
                        submission?.assignmentId,
                        assignmentId
                      ) &&
                      sameId(
                        submission?.studentId?._id ||
                        submission?.studentId,
                        studentId
                      )
                  );


              if (
                submitted
              ){
                return;
              }


              signals.push({

                type:
                  "missing-work",

                priority:
                  now -
                  dueDate >
                  3 *
                  day
                    ? "high"
                    : "medium",

                title:
                  "Missing assignment",

                message:
                  `${
                    getTeacherDisplayName(
                      student
                    )
                  } has no recorded submission for "${
                    getTeacherAssignmentTitle(
                      assignment
                    )
                  }".`,

                studentId:
                  studentId,

                assignmentId:
                  assignmentId,

                action:
                  "student"

              });

            }
          );

      }
    );


  /* =======================================================
     SORT SIGNALS
  ======================================================= */

  const priorityOrder = {

    high:
      0,

    medium:
      1,

    low:
      2

  };


  signals.sort(
    (
      first,
      second
    ) => {

      return (
        (
          priorityOrder[
            first.priority
          ] ??
          99
        ) -
        (
          priorityOrder[
            second.priority
          ] ??
          99
        )
      );

    }
  );


  state.aiInsights =
    signals;


  return signals;

}


/* =========================================================
   KABEZYA SIGNAL ICON
========================================================= */

function getKabezyaSignalIcon(
  signal
){

  switch(
    signal?.type
  ){

    case "attendance":

      return "fa-user-clock";


    case "missing-work":

      return "fa-file-circle-exclamation";


    case "grading":

      return "fa-pen-to-square";


    default:

      return "fa-wand-magic-sparkles";

  }

}


/* =========================================================
   RENDER KABEZYA NEEDS ATTENTION
========================================================= */

function renderKabezyaTeacherAttention(){

  const container =
    getTeacherOverviewElement(
      "kabezyaTeacherAttention",
      "teacherAiAttention",
      "teacherOverviewAI",
      "dashboardAiInsights"
    );


  if (
    !container
  ){
    return;
  }


  const signals =
    buildKabezyaTeacherSignals()
      .slice(
        0,
        5
      );


  if (
    !signals.length
  ){

    container.innerHTML = `
      <div
        class="teacher-ai-clear-state"
      >

        <div
          class="teacher-ai-clear-icon"
        >
          <i
            class="fa-solid fa-wand-magic-sparkles"
          ></i>
        </div>

        <div>

          <strong>
            Nothing urgent detected
          </strong>

          <p>
            Kabezya will surface student work
            and class activity that may need
            your attention.
          </p>

        </div>

      </div>
    `;


    return;

  }


  container.innerHTML =
    signals
      .map(
        signal => {

          return `
            <article
              class="
                teacher-ai-attention-item
                is-${escapeHtml(
                  signal.priority
                )}
              "
            >

              <div
                class="teacher-ai-attention-icon"
              >
                <i
                  class="fa-solid ${escapeHtml(
                    getKabezyaSignalIcon(
                      signal
                    )
                  )}"
                ></i>
              </div>

              <div
                class="teacher-ai-attention-content"
              >

                <div
                  class="teacher-ai-attention-heading"
                >

                  <strong>
                    ${escapeHtml(
                      signal.title
                    )}
                  </strong>

                  <span
                    class="
                      teacher-ai-priority
                      is-${escapeHtml(
                        signal.priority
                      )}
                    "
                  >
                    ${escapeHtml(
                      signal.priority
                    )}
                  </span>

                </div>

                <p>
                  ${escapeHtml(
                    signal.message
                  )}
                </p>

              </div>

              <button
                type="button"
                class="teacher-ai-attention-action"
                data-kabezya-action="${escapeHtml(
                  signal.action ||
                  ""
                )}"
                data-student-id="${escapeHtml(
                  signal.studentId ||
                  ""
                )}"
                data-submission-id="${escapeHtml(
                  signal.submissionId ||
                  ""
                )}"
                data-assignment-id="${escapeHtml(
                  signal.assignmentId ||
                  ""
                )}"
                aria-label="Open"
              >
                <i
                  class="fa-solid fa-chevron-right"
                ></i>
              </button>

            </article>
          `;

        }
      )
      .join(
        ""
      );

}


/* =========================================================
   OVERVIEW QUICK ACTIONS
========================================================= */

function renderTeacherQuickActions(){

  const container =
    getTeacherOverviewElement(
      "teacherQuickActions",
      "overviewQuickActions",
      "dashboardQuickActions"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `

    <button
      type="button"
      class="teacher-quick-action"
      data-teacher-quick-action="assignment"
    >

      <span
        class="teacher-quick-action-icon"
      >
        <i
          class="fa-solid fa-file-circle-plus"
        ></i>
      </span>

      <span>
        <strong>
          Create assignment
        </strong>

        <small>
          Add coursework to a class
        </small>
      </span>

    </button>


    <button
      type="button"
      class="teacher-quick-action"
      data-teacher-quick-action="attendance"
    >

      <span
        class="teacher-quick-action-icon"
      >
        <i
          class="fa-solid fa-user-check"
        ></i>
      </span>

      <span>
        <strong>
          Take attendance
        </strong>

        <small>
          Record today's class attendance
        </small>
      </span>

    </button>


    <button
      type="button"
      class="teacher-quick-action"
      data-teacher-quick-action="grading"
    >

      <span
        class="teacher-quick-action-icon"
      >
        <i
          class="fa-solid fa-pen-to-square"
        ></i>
      </span>

      <span>
        <strong>
          Grade work
        </strong>

        <small>
          Review pending submissions
        </small>
      </span>

    </button>


    <button
      type="button"
      class="teacher-quick-action"
      data-teacher-quick-action="ai"
    >

      <span
        class="teacher-quick-action-icon"
      >
        <i
          class="fa-solid fa-wand-magic-sparkles"
        ></i>
      </span>

      <span>
        <strong>
          Ask Kabezya
        </strong>

        <small>
          Get teaching assistance
        </small>
      </span>

    </button>

  `;

}


/* =========================================================
   RENDER UPCOMING ASSIGNMENTS
========================================================= */

function renderTeacherUpcomingAssignments(){

  const container =
    getTeacherOverviewElement(
      "teacherUpcomingAssignments",
      "overviewUpcomingAssignments",
      "dashboardUpcomingAssignments"
    );


  if (
    !container
  ){
    return;
  }


  const assignments =
    getTeacherUpcomingAssignments(
      5
    );


  if (
    !assignments.length
  ){

    container.innerHTML = `
      <div
        class="teacher-overview-empty teacher-overview-empty-compact"
      >

        <div
          class="teacher-overview-empty-icon"
        >
          <i
            class="fa-regular fa-calendar"
          ></i>
        </div>

        <h4>
          No upcoming deadlines
        </h4>

        <p>
          Assignment deadlines will appear here.
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML =
    assignments
      .map(
        assignment => {

          const assignmentId =
            normalizeId(
              assignment?._id ||
              assignment?.id
            );


          const classItem =
            getTeacherClassById(
              assignment?.classId?._id ||
              assignment?.classId
            );


          const dueDate =
            assignment?.dueDate ||
            assignment?.deadline ||
            assignment?.endDate;


          return `
            <article
              class="teacher-upcoming-assignment"
              data-assignment-id="${escapeHtml(
                assignmentId
              )}"
            >

              <div
                class="teacher-upcoming-assignment-date"
              >

                <span>
                  ${escapeHtml(
                    new Date(
                      dueDate
                    )
                      .toLocaleDateString(
                        [],
                        {
                          month:
                            "short"
                        }
                      )
                  )}
                </span>

                <strong>
                  ${escapeHtml(
                    new Date(
                      dueDate
                    )
                      .toLocaleDateString(
                        [],
                        {
                          day:
                            "numeric"
                        }
                      )
                  )}
                </strong>

              </div>

              <div
                class="teacher-upcoming-assignment-content"
              >

                <strong>
                  ${escapeHtml(
                    getTeacherAssignmentTitle(
                      assignment
                    )
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </span>

              </div>

              <button
                type="button"
                class="teacher-icon-button"
                data-teacher-assignment-action="open"
                data-assignment-id="${escapeHtml(
                  assignmentId
                )}"
                aria-label="Open assignment"
              >
                <i
                  class="fa-solid fa-chevron-right"
                ></i>
              </button>

            </article>
          `;

        }
      )
      .join(
        ""
      );

}


/* =========================================================
   MAIN OVERVIEW RENDERER
========================================================= */

function renderStudioHome(){

  /*
    Keep metrics synchronized before rendering.
  */

  calculateTeacherMetrics();


  renderTeacherProfile();


  renderTeacherDashboardStats();


  renderTeacherOverviewStats();


  renderTeacherOverviewClasses();


  renderTeacherTodaySchedule();


  renderTeacherPendingGrading();


  renderTeacherRecentSubmissions();


  renderTeacherUpcomingAssignments();


  renderTeacherQuickActions();


  renderKabezyaTeacherAttention();


  renderTeacherUnreadCount();

}


/* =========================================================
   OPEN TEACHER CLASS
========================================================= */

function openTeacherClass(
  classId
){

  const normalizedId =
    normalizeId(
      classId
    );


  if (
    !normalizedId
  ){

    showAlert(
      "error",
      "The selected class could not be identified."
    );


    return;

  }


  const classItem =
    getTeacherClassById(
      normalizedId
    );


  if (
    !classItem
  ){

    showAlert(
      "error",
      "You do not have access to this class."
    );


    return;

  }


  /*
    Teacher Studio will eventually open the dedicated
    teacher class workspace.

    For now we keep the class context inside teacher.html.
  */

  state.selectedClassId =
    normalizedId;


  if (
    typeof activateStudentStudioPage ===
    "function"
  ){

    activateStudentStudioPage(
      "classes"
    );

  }


  if (
    typeof renderTeacherClassesWorkspace ===
    "function"
  ){

    renderTeacherClassesWorkspace(
      normalizedId
    );

  }

}


/* =========================================================
   OPEN TEACHER STUDENT
========================================================= */

function openTeacherStudent(
  studentId
){

  const normalizedId =
    normalizeId(
      studentId
    );


  if (
    !normalizedId
  ){
    return;
  }


  state.selectedStudentId =
    normalizedId;


  if (
    typeof activateStudentStudioPage ===
    "function"
  ){

    activateStudentStudioPage(
      "students"
    );

  }


  if (
    typeof renderTeacherStudentsWorkspace ===
    "function"
  ){

    renderTeacherStudentsWorkspace(
      normalizedId
    );

  }

}


/* =========================================================
   OPEN SUBMISSION REVIEW
========================================================= */

function openTeacherSubmissionReview(
  submissionId
){

  const normalizedId =
    normalizeId(
      submissionId
    );


  if (
    !normalizedId
  ){

    showAlert(
      "error",
      "The submission could not be identified."
    );


    return;

  }


  state.selectedSubmissionId =
    normalizedId;


  if (
    typeof activateStudentStudioPage ===
    "function"
  ){

    activateStudentStudioPage(
      "grading"
    );

  }


  if (
    typeof renderTeacherGradingWorkspace ===
    "function"
  ){

    renderTeacherGradingWorkspace(
      normalizedId
    );

  }

}


/* =========================================================
   TEACHER OVERVIEW EVENT CONTROLLER
========================================================= */

let teacherOverviewControlsBound =
  false;


function bindTeacherOverviewControls(){

  if (
    teacherOverviewControlsBound
  ){
    return;
  }


  teacherOverviewControlsBound =
    true;


  document.addEventListener(
    "click",
    event => {

      /* ===================================================
         CLASS ACTION
      =================================================== */

      const classAction =
        event.target.closest(
          "[data-teacher-class-action]"
        );


      if (
        classAction
      ){

        event.preventDefault();


        const action =
          String(
            classAction.dataset
              .teacherClassAction ||
            ""
          )
            .trim()
            .toLowerCase();


        const classId =
          classAction.dataset
            .classId ||
          "";


        if (
          action ===
          "open"
        ){

          openTeacherClass(
            classId
          );


          return;

        }


        if (
          action ===
          "students"
        ){

          state.selectedClassId =
            normalizeId(
              classId
            );


          if (
            typeof activateStudentStudioPage ===
            "function"
          ){

            activateStudentStudioPage(
              "students"
            );

          }


          return;

        }

      }


      /* ===================================================
         SUBMISSION ACTION
      =================================================== */

      const submissionAction =
        event.target.closest(
          "[data-teacher-submission-action]"
        );


      if (
        submissionAction
      ){

        event.preventDefault();


        const action =
          submissionAction.dataset
            .teacherSubmissionAction;


        const submissionId =
          submissionAction.dataset
            .submissionId;


        if (
          action ===
          "review"
        ){

          openTeacherSubmissionReview(
            submissionId
          );

        }


        return;

      }


      /* ===================================================
         SCHEDULE ACTION
      =================================================== */

      const scheduleAction =
        event.target.closest(
          "[data-teacher-schedule-action]"
        );


      if (
        scheduleAction
      ){

        event.preventDefault();


        const action =
          scheduleAction.dataset
            .teacherScheduleAction;


        if (
          action ===
          "join"
        ){

          const meetingLink =
            String(
              scheduleAction.dataset
                .meetingLink ||
              ""
            ).trim();


          if (
            meetingLink
          ){

            window.open(
              meetingLink,
              "_blank",
              "noopener,noreferrer"
            );

          }

        }


        return;

      }


      /* ===================================================
         QUICK ACTION
      =================================================== */

      const quickAction =
        event.target.closest(
          "[data-teacher-quick-action]"
        );


      if (
        quickAction
      ){

        event.preventDefault();


        const action =
          String(
            quickAction.dataset
              .teacherQuickAction ||
            ""
          )
            .trim()
            .toLowerCase();


        switch(
          action
        ){

          case "assignment":

            if (
              typeof activateStudentStudioPage ===
              "function"
            ){

              activateStudentStudioPage(
                "assignments"
              );

            }

            break;


          case "attendance":

            if (
              typeof activateStudentStudioPage ===
              "function"
            ){

              activateStudentStudioPage(
                "attendance"
              );

            }

            break;


          case "grading":

            if (
              typeof activateStudentStudioPage ===
              "function"
            ){

              activateStudentStudioPage(
                "grading"
              );

            }

            break;


          case "ai":

            if (
              typeof activateStudentStudioPage ===
              "function"
            ){

              activateStudentStudioPage(
                "ai"
              );

            }

            break;

        }


        return;

      }


      /* ===================================================
         KABEZYA ACTION
      =================================================== */

      const aiAction =
        event.target.closest(
          "[data-kabezya-action]"
        );


      if (
        aiAction
      ){

        event.preventDefault();


        const action =
          String(
            aiAction.dataset
              .kabezyaAction ||
            ""
          )
            .trim()
            .toLowerCase();


        if (
          action ===
          "review"
        ){

          openTeacherSubmissionReview(
            aiAction.dataset
              .submissionId
          );


          return;

        }


        if (
          action ===
          "student"
        ){

          openTeacherStudent(
            aiAction.dataset
              .studentId
          );


          return;

        }

      }


      /* ===================================================
         ASSIGNMENT ACTION
      =================================================== */

      const assignmentAction =
        event.target.closest(
          "[data-teacher-assignment-action]"
        );


      if (
        assignmentAction
      ){

        event.preventDefault();


        state.selectedAssignmentId =
          normalizeId(
            assignmentAction.dataset
              .assignmentId
          );


        if (
          typeof activateStudentStudioPage ===
          "function"
        ){

          activateStudentStudioPage(
            "assignments"
          );

        }

      }

    }
  );

}


/* =========================================================
   INITIALIZE OVERVIEW CONTROLLER
========================================================= */

function initializeTeacherOverview(){

  bindTeacherOverviewControls();


  /*
    loadAll() performs the first full render.

    This initializer can also safely be called again whenever
    teacher.html restores the Overview workspace.
  */

  if (
    state.me
  ){

    renderStudioHome();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 5
   CLASSES WORKSPACE
========================================================= */


/* =========================================================
   CLASS WORKSPACE STATE
========================================================= */

const teacherClassWorkspaceState = {

  search:
    "",

  status:
    "all",

  sort:
    "recent",

  selectedClassId:
    null

};


/* =========================================================
   GET CLASS STATUS
========================================================= */

function getTeacherClassStatus(
  classItem
){

  const rawStatus =
    String(
      classItem?.status ||
      classItem?.classStatus ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    rawStatus
  ){

    if (
      [
        "active",
        "published",
        "open",
        "ongoing"
      ].includes(
        rawStatus
      )
    ){

      return "active";

    }


    if (
      [
        "draft",
        "pending"
      ].includes(
        rawStatus
      )
    ){

      return "draft";

    }


    if (
      [
        "completed",
        "closed",
        "finished",
        "archived"
      ].includes(
        rawStatus
      )
    ){

      return "completed";

    }


    return rawStatus;

  }


  /*
    Existing classes without a status field are treated as
    active for display purposes only.

    This does not modify the database.
  */

  return "active";

}


/* =========================================================
   CLASS STATUS LABEL
========================================================= */

function getTeacherClassStatusLabel(
  classItem
){

  const status =
    getTeacherClassStatus(
      classItem
    );


  switch(
    status
  ){

    case "active":

      return "Active";


    case "draft":

      return "Draft";


    case "completed":

      return "Completed";


    default:

      return status
        ? (
            status.charAt(
              0
            ).toUpperCase() +
            status.slice(
              1
            )
          )
        : "Active";

  }

}


/* =========================================================
   CLASS CODE
========================================================= */

function getTeacherClassCode(
  classItem
){

  return String(
    classItem?.classCode ||
    classItem?.code ||
    classItem?.joinCode ||
    ""
  ).trim();

}


/* =========================================================
   CLASS DESCRIPTION
========================================================= */

function getTeacherClassDescription(
  classItem
){

  return String(
    classItem?.description ||
    classItem?.summary ||
    classItem?.about ||
    ""
  ).trim();

}


/* =========================================================
   CLASS COVER
========================================================= */

function getTeacherClassCover(
  classItem
){

  return String(
    classItem?.coverImage ||
    classItem?.coverUrl ||
    classItem?.bannerImage ||
    classItem?.banner ||
    classItem?.image ||
    ""
  ).trim();

}


/* =========================================================
   CLASS CREATED DATE
========================================================= */

function getTeacherClassCreatedTime(
  classItem
){

  const value =
    classItem?.createdAt ||
    classItem?.updatedAt ||
    classItem?.startDate ||
    0;


  const time =
    new Date(
      value
    )
      .getTime();


  return Number.isNaN(
    time
  )
    ? 0
    : time;

}


/* =========================================================
   FILTER TEACHER CLASSES
========================================================= */

function getFilteredTeacherClasses(){

  const search =
    String(
      teacherClassWorkspaceState.search ||
      ""
    )
      .trim()
      .toLowerCase();


  const status =
    String(
      teacherClassWorkspaceState.status ||
      "all"
    )
      .trim()
      .toLowerCase();


  let classes =
    [
      ...getTeacherClasses()
    ];


  if (
    search
  ){

    classes =
      classes.filter(
        classItem => {

          const haystack =
            [
              getTeacherClassTitle(
                classItem
              ),

              classItem?.subject,

              getTeacherClassCode(
                classItem
              ),

              getTeacherClassDescription(
                classItem
              )
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  if (
    status !==
    "all"
  ){

    classes =
      classes.filter(
        classItem =>
          getTeacherClassStatus(
            classItem
          ) ===
          status
      );

  }


  switch(
    teacherClassWorkspaceState.sort
  ){

    case "name":

      classes.sort(
        (
          first,
          second
        ) =>
          getTeacherClassTitle(
            first
          )
            .localeCompare(
              getTeacherClassTitle(
                second
              )
            )
      );

      break;


    case "students":

      classes.sort(
        (
          first,
          second
        ) =>
          getTeacherClassStudentCount(
            second
          ) -
          getTeacherClassStudentCount(
            first
          )
      );

      break;


    case "pending":

      classes.sort(
        (
          first,
          second
        ) =>
          getTeacherClassPendingCount(
            second
          ) -
          getTeacherClassPendingCount(
            first
          )
      );

      break;


    case "recent":
    default:

      classes.sort(
        (
          first,
          second
        ) =>
          getTeacherClassCreatedTime(
            second
          ) -
          getTeacherClassCreatedTime(
            first
          )
      );

      break;

  }


  return classes;

}


/* =========================================================
   GET CLASS ASSIGNMENTS
========================================================= */

function getTeacherClassAssignments(
  classId
){

  return getTeacherAssignments()
    .filter(
      assignment =>
        sameId(
          assignment?.classId?._id ||
          assignment?.classId,
          classId
        )
    );

}


/* =========================================================
   GET CLASS SUBMISSIONS
========================================================= */

function getTeacherClassSubmissions(
  classId
){

  return getTeacherSubmissions()
    .filter(
      submission =>
        sameId(
          submission?.classId?._id ||
          submission?.classId,
          classId
        )
    );

}


/* =========================================================
   GET CLASS SCHEDULES
========================================================= */

function getTeacherClassSchedules(
  classId
){

  return getTeacherSchedules()
    .filter(
      schedule =>
        sameId(
          schedule?.classId?._id ||
          schedule?.classId,
          classId
        )
    );

}


/* =========================================================
   GET CLASS STUDENTS
========================================================= */

function getTeacherClassStudents(
  classId
){

  const classData =
    getTeacherClassData(
      classId
    );


  return asArray(
    classData.students
  );

}


/* =========================================================
   GET CLASS QUIZZES
========================================================= */

function getTeacherClassQuizRecords(
  classId
){

  return asArray(
    state.quizzes
  )
    .filter(
      quiz =>
        sameId(
          quiz?.classId?._id ||
          quiz?.classId,
          classId
        )
    );

}


/* =========================================================
   CLASS COMPLETION / REVIEW RATE
========================================================= */

function getTeacherClassReviewRate(
  classId
){

  const submissions =
    getTeacherClassSubmissions(
      classId
    );


  if (
    !submissions.length
  ){
    return 0;
  }


  const reviewed =
    submissions.filter(
      submission =>
        [
          "reviewed",
          "graded",
          "returned"
        ].includes(
          normalizeSubmissionStatus(
            submission?.status
          )
        )
    )
      .length;


  return clampPercentage(
    (
      reviewed /
      submissions.length
    ) *
    100
  );

}


/* =========================================================
   CLASS NEXT SCHEDULE
========================================================= */

function getTeacherClassNextSchedule(
  classId
){

  const now =
    Date.now();


  return getTeacherClassSchedules(
    classId
  )
    .filter(
      schedule => {

        const dateValue =
          schedule?.start ||
          schedule?.scheduledAt ||
          schedule?.date;


        if (
          !dateValue
        ){
          return false;
        }


        const time =
          new Date(
            dateValue
          )
            .getTime();


        return (
          !Number.isNaN(
            time
          ) &&
          time >= now
        );

      }
    )
    .sort(
      (
        first,
        second
      ) => {

        const firstTime =
          new Date(
            first?.start ||
            first?.scheduledAt ||
            first?.date
          )
            .getTime();


        const secondTime =
          new Date(
            second?.start ||
            second?.scheduledAt ||
            second?.date
          )
            .getTime();


        return (
          firstTime -
          secondTime
        );

      }
    )[0] ||
    null;

}


/* =========================================================
   CREATE CLASS CARD
========================================================= */

function createTeacherClassWorkspaceCard(
  classItem
){

  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );


  const title =
    getTeacherClassTitle(
      classItem
    );


  const subject =
    String(
      classItem?.subject ||
      classItem?.course ||
      ""
    ).trim();


  const description =
    getTeacherClassDescription(
      classItem
    );


  const classCode =
    getTeacherClassCode(
      classItem
    );


  const cover =
    getTeacherClassCover(
      classItem
    );


  const status =
    getTeacherClassStatus(
      classItem
    );


  const statusLabel =
    getTeacherClassStatusLabel(
      classItem
    );


  const students =
    getTeacherClassStudentCount(
      classItem
    );


  const assignments =
    getTeacherClassAssignments(
      classId
    ).length;


  const pending =
    getTeacherClassPendingCount(
      classItem
    );


  const reviewRate =
    getTeacherClassReviewRate(
      classId
    );


  const nextSchedule =
    getTeacherClassNextSchedule(
      classId
    );


  const nextScheduleLabel =
    nextSchedule
      ? formatTeacherDate(
          nextSchedule?.start ||
          nextSchedule?.scheduledAt ||
          nextSchedule?.date
        )
      : "";


  return `
    <article
      class="teacher-class-workspace-card"
      data-class-id="${escapeHtml(
        classId
      )}"
    >

      <div
        class="teacher-class-card-cover ${
          cover
            ? "has-cover"
            : ""
        }"
        ${
          cover
            ? `
              style="
                background-image:url('${escapeHtml(
                  cover
                )}');
              "
            `
            : ""
        }
      >

        ${
          !cover
            ? `
              <div
                class="teacher-class-card-cover-placeholder"
              >
                <i
                  class="fa-solid fa-chalkboard-user"
                ></i>
              </div>
            `
            : ""
        }

        <span
          class="
            teacher-class-status
            is-${escapeHtml(
              status
            )}
          "
        >
          ${escapeHtml(
            statusLabel
          )}
        </span>

      </div>


      <div
        class="teacher-class-card-body"
      >

        <div
          class="teacher-class-card-heading"
        >

          <div>

            <h3>
              ${escapeHtml(
                title
              )}
            </h3>

            ${
              subject
                ? `
                  <p>
                    ${escapeHtml(
                      subject
                    )}
                  </p>
                `
                : ""
            }

          </div>

          <button
            type="button"
            class="teacher-class-card-more"
            data-teacher-class-menu="${escapeHtml(
              classId
            )}"
            aria-label="Class options"
          >
            <i
              class="fa-solid fa-ellipsis"
            ></i>
          </button>

        </div>


        ${
          description
            ? `
              <p
                class="teacher-class-card-description"
              >
                ${escapeHtml(
                  description
                )}
              </p>
            `
            : ""
        }


        ${
          classCode
            ? `
              <div
                class="teacher-class-code"
              >

                <span>
                  Class code
                </span>

                <strong>
                  ${escapeHtml(
                    classCode
                  )}
                </strong>

              </div>
            `
            : ""
        }


        <div
          class="teacher-class-card-stats"
        >

          <div>
            <strong>
              ${students}
            </strong>

            <span>
              Students
            </span>
          </div>

          <div>
            <strong>
              ${assignments}
            </strong>

            <span>
              Assignments
            </span>
          </div>

          <div>
            <strong>
              ${pending}
            </strong>

            <span>
              To grade
            </span>
          </div>

        </div>


        <div
          class="teacher-class-progress"
        >

          <div
            class="teacher-class-progress-head"
          >

            <span>
              Review progress
            </span>

            <strong>
              ${reviewRate}%
            </strong>

          </div>

          <div
            class="teacher-class-progress-track"
          >
            <span
              style="
                width:${reviewRate}%;
              "
            ></span>
          </div>

        </div>


        ${
          nextSchedule
            ? `
              <div
                class="teacher-class-next-session"
              >

                <i
                  class="fa-regular fa-calendar"
                ></i>

                <span>
                  Next:
                  ${escapeHtml(
                    nextScheduleLabel
                  )}

                  ${
                    getTeacherScheduleStartTime(
                      nextSchedule
                    )
                      ? `
                        at
                        ${escapeHtml(
                          formatTeacherTime(
                            getTeacherScheduleStartTime(
                              nextSchedule
                            )
                          )
                        )}
                      `
                      : ""
                  }
                </span>

              </div>
            `
            : ""
        }


        <div
          class="teacher-class-card-actions"
        >

          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-class-workspace-action="students"
            data-class-id="${escapeHtml(
              classId
            )}"
          >
            <i
              class="fa-solid fa-users"
            ></i>

            <span>
              Students
            </span>
          </button>


          <button
            type="button"
            class="teacher-primary-button"
            data-teacher-class-workspace-action="open"
            data-class-id="${escapeHtml(
              classId
            )}"
          >
            <span>
              Open class
            </span>

            <i
              class="fa-solid fa-arrow-right"
            ></i>
          </button>

        </div>

      </div>

    </article>
  `;

}


/* =========================================================
   CLASS WORKSPACE HEADER
========================================================= */

function renderTeacherClassesHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherClassesHeader",
      "classesWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          My Classes
        </h1>

        <p>
          Manage the classes assigned to you,
          review student activity and access
          your teaching tools.
        </p>

      </div>

    </div>
  `;

}


/* =========================================================
   CLASS WORKSPACE TOOLBAR
========================================================= */

function renderTeacherClassesToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherClassesToolbar",
      "classesWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-class-toolbar-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
        aria-hidden="true"
      ></i>

      <input
        id="teacherClassSearch"
        type="search"
        placeholder="Search your classes..."
        autocomplete="off"
        value="${escapeHtml(
          teacherClassWorkspaceState.search
        )}"
        aria-label="Search classes"
      />

    </div>


    <select
      id="teacherClassStatusFilter"
      class="teacher-workspace-select"
      aria-label="Filter classes"
    >
      <option
        value="all"
        ${
          teacherClassWorkspaceState.status ===
          "all"
            ? "selected"
            : ""
        }
      >
        All classes
      </option>

      <option
        value="active"
        ${
          teacherClassWorkspaceState.status ===
          "active"
            ? "selected"
            : ""
        }
      >
        Active
      </option>

      <option
        value="draft"
        ${
          teacherClassWorkspaceState.status ===
          "draft"
            ? "selected"
            : ""
        }
      >
        Draft
      </option>

      <option
        value="completed"
        ${
          teacherClassWorkspaceState.status ===
          "completed"
            ? "selected"
            : ""
        }
      >
        Completed
      </option>
    </select>


    <select
      id="teacherClassSort"
      class="teacher-workspace-select"
      aria-label="Sort classes"
    >
      <option
        value="recent"
        ${
          teacherClassWorkspaceState.sort ===
          "recent"
            ? "selected"
            : ""
        }
      >
        Most recent
      </option>

      <option
        value="name"
        ${
          teacherClassWorkspaceState.sort ===
          "name"
            ? "selected"
            : ""
        }
      >
        Class name
      </option>

      <option
        value="students"
        ${
          teacherClassWorkspaceState.sort ===
          "students"
            ? "selected"
            : ""
        }
      >
        Most students
      </option>

      <option
        value="pending"
        ${
          teacherClassWorkspaceState.sort ===
          "pending"
            ? "selected"
            : ""
        }
      >
        Most grading
      </option>
    </select>
  `;

}


/* =========================================================
   CLASS WORKSPACE SUMMARY
========================================================= */

function renderTeacherClassesSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherClassesSummary",
      "classesWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  const active =
    classes.filter(
      classItem =>
        getTeacherClassStatus(
          classItem
        ) ===
        "active"
    ).length;


  const students =
    asArray(
      state.students
    ).length;


  const pending =
    getPendingTeacherSubmissions()
      .length;


  container.innerHTML = `
    <div
      class="teacher-class-summary-card"
    >

      <div
        class="teacher-class-summary-icon"
      >
        <i
          class="fa-solid fa-chalkboard"
        ></i>
      </div>

      <div>
        <strong>
          ${classes.length}
        </strong>

        <span>
          Assigned classes
        </span>
      </div>

    </div>


    <div
      class="teacher-class-summary-card"
    >

      <div
        class="teacher-class-summary-icon"
      >
        <i
          class="fa-solid fa-circle-play"
        ></i>
      </div>

      <div>
        <strong>
          ${active}
        </strong>

        <span>
          Active classes
        </span>
      </div>

    </div>


    <div
      class="teacher-class-summary-card"
    >

      <div
        class="teacher-class-summary-icon"
      >
        <i
          class="fa-solid fa-user-graduate"
        ></i>
      </div>

      <div>
        <strong>
          ${students}
        </strong>

        <span>
          Students
        </span>
      </div>

    </div>


    <div
      class="teacher-class-summary-card"
    >

      <div
        class="teacher-class-summary-icon"
      >
        <i
          class="fa-solid fa-file-pen"
        ></i>
      </div>

      <div>
        <strong>
          ${pending}
        </strong>

        <span>
          Waiting for review
        </span>
      </div>

    </div>
  `;

}


/* =========================================================
   CLASS GRID
========================================================= */

function renderTeacherClassesGrid(){

  const container =
    getTeacherOverviewElement(
      "teacherClassesGrid",
      "classesWorkspaceGrid",
      "teacherClassList"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getFilteredTeacherClasses();


  if (
    !classes.length
  ){

    const hasFilters =
      Boolean(
        teacherClassWorkspaceState.search
      ) ||
      teacherClassWorkspaceState.status !==
        "all";


    container.innerHTML = `
      <div
        class="teacher-workspace-empty teacher-classes-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-solid ${
              hasFilters
                ? "fa-magnifying-glass"
                : "fa-chalkboard-user"
            }"
          ></i>
        </div>

        <h3>
          ${
            hasFilters
              ? "No matching classes"
              : "No classes assigned yet"
          }
        </h3>

        <p>
          ${
            hasFilters
              ? `
                Try changing your search or
                class filter.
              `
              : `
                When your school assigns a class
                to your teacher account, it will
                appear here automatically.
              `
          }
        </p>

        ${
          hasFilters
            ? `
              <button
                type="button"
                class="teacher-secondary-button"
                data-teacher-class-workspace-action="clear-filters"
              >
                Clear filters
              </button>
            `
            : ""
        }

      </div>
    `;


    return;

  }


  container.innerHTML =
    classes
      .map(
        createTeacherClassWorkspaceCard
      )
      .join(
        ""
      );

}


/* =========================================================
   RENDER FULL CLASSES WORKSPACE
========================================================= */

function renderTeacherClassesWorkspace(
  selectedClassId = null
){

  if (
    selectedClassId
  ){

    teacherClassWorkspaceState
      .selectedClassId =
        normalizeId(
          selectedClassId
        );


    state.selectedClassId =
      teacherClassWorkspaceState
        .selectedClassId;

  }


  renderTeacherClassesHeader();


  renderTeacherClassesToolbar();


  renderTeacherClassesSummary();


  renderTeacherClassesGrid();


  if (
    teacherClassWorkspaceState
      .selectedClassId
  ){

    renderTeacherSelectedClass(
      teacherClassWorkspaceState
        .selectedClassId
    );

  }

}


/* =========================================================
   SELECTED CLASS OVERVIEW
========================================================= */

function renderTeacherSelectedClass(
  classId
){

  const container =
    getTeacherOverviewElement(
      "teacherSelectedClass",
      "selectedClassWorkspace",
      "teacherClassDetail"
    );


  if (
    !container
  ){
    return;
  }


  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    container.innerHTML =
      "";


    container.hidden =
      true;


    return;

  }


  container.hidden =
    false;


  const classData =
    getTeacherClassData(
      classId
    );


  const students =
    asArray(
      classData.students
    );


  const assignments =
    asArray(
      classData.assignments
    );


  const submissions =
    asArray(
      classData.submissions
    );


  const schedules =
    asArray(
      classData.schedules
    );


  const quizzes =
    asArray(
      classData.quizzes
    );


  const pending =
    submissions.filter(
      submission =>
        normalizeSubmissionStatus(
          submission?.status
        ) ===
        "submitted"
    ).length;


  const nextSchedule =
    getTeacherClassNextSchedule(
      classId
    );


  container.innerHTML = `
    <section
      class="teacher-selected-class-panel"
    >

      <div
        class="teacher-selected-class-header"
      >

        <button
          type="button"
          class="teacher-selected-class-back"
          data-teacher-class-workspace-action="close-class"
          aria-label="Back to classes"
        >
          <i
            class="fa-solid fa-arrow-left"
          ></i>
        </button>


        <div
          class="teacher-selected-class-title"
        >

          <span>
            Class workspace
          </span>

          <h2>
            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </h2>

          <p>
            ${escapeHtml(
              classItem?.subject ||
              getTeacherClassCode(
                classItem
              ) ||
              "Teaching workspace"
            )}
          </p>

        </div>


        <span
          class="
            teacher-class-status
            is-${escapeHtml(
              getTeacherClassStatus(
                classItem
              )
            )}
          "
        >
          ${escapeHtml(
            getTeacherClassStatusLabel(
              classItem
            )
          )}
        </span>

      </div>


      <div
        class="teacher-selected-class-stats"
      >

        <div>
          <strong>
            ${students.length}
          </strong>

          <span>
            Students
          </span>
        </div>

        <div>
          <strong>
            ${assignments.length}
          </strong>

          <span>
            Assignments
          </span>
        </div>

        <div>
          <strong>
            ${pending}
          </strong>

          <span>
            To grade
          </span>
        </div>

        <div>
          <strong>
            ${quizzes.length}
          </strong>

          <span>
            Quizzes
          </span>
        </div>

      </div>


      <div
        class="teacher-selected-class-actions"
      >

        <button
          type="button"
          class="teacher-class-tool"
          data-teacher-selected-class-action="students"
          data-class-id="${escapeHtml(
            classId
          )}"
        >

          <i
            class="fa-solid fa-users"
          ></i>

          <span>
            <strong>
              Students
            </strong>

            <small>
              View class roster
            </small>
          </span>

        </button>


        <button
          type="button"
          class="teacher-class-tool"
          data-teacher-selected-class-action="assignments"
          data-class-id="${escapeHtml(
            classId
          )}"
        >

          <i
            class="fa-solid fa-file-circle-check"
          ></i>

          <span>
            <strong>
              Assignments
            </strong>

            <small>
              Create and manage work
            </small>
          </span>

        </button>


        <button
          type="button"
          class="teacher-class-tool"
          data-teacher-selected-class-action="grading"
          data-class-id="${escapeHtml(
            classId
          )}"
        >

          <i
            class="fa-solid fa-pen-to-square"
          ></i>

          <span>
            <strong>
              Grading
            </strong>

            <small>
              Review submissions
            </small>
          </span>

        </button>


        <button
          type="button"
          class="teacher-class-tool"
          data-teacher-selected-class-action="attendance"
          data-class-id="${escapeHtml(
            classId
          )}"
        >

          <i
            class="fa-solid fa-user-check"
          ></i>

          <span>
            <strong>
              Attendance
            </strong>

            <small>
              Record attendance
            </small>
          </span>

        </button>


        <button
          type="button"
          class="teacher-class-tool"
          data-teacher-selected-class-action="quizzes"
          data-class-id="${escapeHtml(
            classId
          )}"
        >

          <i
            class="fa-solid fa-list-check"
          ></i>

          <span>
            <strong>
              Quizzes
            </strong>

            <small>
              Manage assessments
            </small>
          </span>

        </button>


        <button
          type="button"
          class="teacher-class-tool"
          data-teacher-selected-class-action="resources"
          data-class-id="${escapeHtml(
            classId
          )}"
        >

          <i
            class="fa-solid fa-folder-open"
          ></i>

          <span>
            <strong>
              Resources
            </strong>

            <small>
              Learning materials
            </small>
          </span>

        </button>

      </div>


      ${
        nextSchedule
          ? `
            <div
              class="teacher-selected-next-session"
            >

              <div
                class="teacher-selected-next-session-icon"
              >
                <i
                  class="fa-solid fa-video"
                ></i>
              </div>

              <div>

                <span>
                  Next session
                </span>

                <strong>
                  ${escapeHtml(
                    formatTeacherDate(
                      nextSchedule?.start ||
                      nextSchedule?.scheduledAt ||
                      nextSchedule?.date,
                      {
                        year:
                          "numeric"
                      }
                    )
                  )}

                  ${
                    getTeacherScheduleStartTime(
                      nextSchedule
                    )
                      ? `
                        ·
                        ${escapeHtml(
                          formatTeacherTime(
                            getTeacherScheduleStartTime(
                              nextSchedule
                            )
                          )
                        )}
                      `
                      : ""
                  }
                </strong>

              </div>

              ${
                nextSchedule?.meetingLink ||
                nextSchedule?.meetingUrl
                  ? `
                    <button
                      type="button"
                      class="teacher-primary-button"
                      data-teacher-schedule-action="join"
                      data-meeting-link="${escapeHtml(
                        nextSchedule?.meetingLink ||
                        nextSchedule?.meetingUrl
                      )}"
                    >
                      <i
                        class="fa-solid fa-video"
                      ></i>

                      Join
                    </button>
                  `
                  : ""
              }

            </div>
          `
          : ""
      }


      <div
        class="teacher-selected-class-columns"
      >

        <section
          class="teacher-selected-class-section"
        >

          <div
            class="teacher-selected-section-head"
          >

            <div>
              <h3>
                Students
              </h3>

              <p>
                Recently active class members
              </p>
            </div>

            <button
              type="button"
              class="teacher-text-button"
              data-teacher-selected-class-action="students"
              data-class-id="${escapeHtml(
                classId
              )}"
            >
              View all
            </button>

          </div>

          <div
            class="teacher-selected-student-list"
          >

            ${
              students.length
                ? students
                    .slice(
                      0,
                      5
                    )
                    .map(
                      student => {

                        const studentId =
                          normalizeId(
                            student?._id ||
                            student?.id
                          );


                        return `
                          <button
                            type="button"
                            class="teacher-selected-student"
                            data-teacher-student-id="${escapeHtml(
                              studentId
                            )}"
                          >

                            <img
                              src="${escapeHtml(
                                getTeacherStudentAvatar(
                                  student
                                )
                              )}"
                              alt="${escapeHtml(
                                getTeacherDisplayName(
                                  student
                                )
                              )}"
                            />

                            <span>

                              <strong>
                                ${escapeHtml(
                                  getTeacherDisplayName(
                                    student
                                  )
                                )}
                              </strong>

                              <small>
                                ${escapeHtml(
                                  student?.email ||
                                  student?.course ||
                                  "Student"
                                )}
                              </small>

                            </span>

                            <i
                              class="fa-solid fa-chevron-right"
                            ></i>

                          </button>
                        `;

                      }
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      No students are currently
                      listed in this class.
                    </div>
                  `
            }

          </div>

        </section>


        <section
          class="teacher-selected-class-section"
        >

          <div
            class="teacher-selected-section-head"
          >

            <div>
              <h3>
                Recent assignments
              </h3>

              <p>
                Coursework for this class
              </p>
            </div>

            <button
              type="button"
              class="teacher-text-button"
              data-teacher-selected-class-action="assignments"
              data-class-id="${escapeHtml(
                classId
              )}"
            >
              View all
            </button>

          </div>

          <div
            class="teacher-selected-assignment-list"
          >

            ${
              assignments.length
                ? [
                    ...assignments
                  ]
                    .sort(
                      (
                        first,
                        second
                      ) =>
                        new Date(
                          second?.createdAt ||
                          0
                        ).getTime() -
                        new Date(
                          first?.createdAt ||
                          0
                        ).getTime()
                    )
                    .slice(
                      0,
                      5
                    )
                    .map(
                      assignment => {

                        const assignmentId =
                          normalizeId(
                            assignment?._id ||
                            assignment?.id
                          );


                        return `
                          <button
                            type="button"
                            class="teacher-selected-assignment"
                            data-teacher-assignment-action="open"
                            data-assignment-id="${escapeHtml(
                              assignmentId
                            )}"
                          >

                            <span
                              class="teacher-selected-assignment-icon"
                            >
                              <i
                                class="fa-regular fa-file-lines"
                              ></i>
                            </span>

                            <span
                              class="teacher-selected-assignment-main"
                            >

                              <strong>
                                ${escapeHtml(
                                  getTeacherAssignmentTitle(
                                    assignment
                                  )
                                )}
                              </strong>

                              <small>
                                ${
                                  assignment?.dueDate
                                    ? `
                                      Due
                                      ${escapeHtml(
                                        formatTeacherDate(
                                          assignment.dueDate
                                        )
                                      )}
                                    `
                                    : "No due date"
                                }
                              </small>

                            </span>

                            <i
                              class="fa-solid fa-chevron-right"
                            ></i>

                          </button>
                        `;

                      }
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      No assignments have been
                      created for this class yet.
                    </div>
                  `
            }

          </div>

        </section>

      </div>

    </section>
  `;

}


/* =========================================================
   CLEAR CLASS FILTERS
========================================================= */

function clearTeacherClassFilters(){

  teacherClassWorkspaceState.search =
    "";


  teacherClassWorkspaceState.status =
    "all";


  teacherClassWorkspaceState.sort =
    "recent";


  renderTeacherClassesToolbar();


  renderTeacherClassesGrid();

}


/* =========================================================
   CLOSE SELECTED CLASS
========================================================= */

function closeTeacherSelectedClass(){

  teacherClassWorkspaceState
    .selectedClassId =
      null;


  state.selectedClassId =
    null;


  const container =
    getTeacherOverviewElement(
      "teacherSelectedClass",
      "selectedClassWorkspace",
      "teacherClassDetail"
    );


  if (
    container
  ){

    container.innerHTML =
      "";


    container.hidden =
      true;

  }

}


/* =========================================================
   CLASS WORKSPACE SEARCH BINDING
========================================================= */

let teacherClassWorkspaceBound =
  false;


function bindTeacherClassWorkspace(){

  if (
    teacherClassWorkspaceBound
  ){
    return;
  }


  teacherClassWorkspaceBound =
    true;


  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id ===
        "teacherClassSearch"
      ){

        teacherClassWorkspaceState
          .search =
            event.target.value ||
            "";


        renderTeacherClassesGrid();

      }

    }
  );


  document.addEventListener(
    "change",
    event => {

      /* ===================================================
         STATUS FILTER
      =================================================== */

      if (
        event.target?.id ===
        "teacherClassStatusFilter"
      ){

        teacherClassWorkspaceState
          .status =
            event.target.value ||
            "all";


        renderTeacherClassesGrid();


        return;

      }


      /* ===================================================
         SORT
      =================================================== */

      if (
        event.target?.id ===
        "teacherClassSort"
      ){

        teacherClassWorkspaceState
          .sort =
            event.target.value ||
            "recent";


        renderTeacherClassesGrid();

      }

    }
  );


  document.addEventListener(
    "click",
    event => {

      /* ===================================================
         CLASS WORKSPACE ACTIONS
      =================================================== */

      const actionButton =
        event.target.closest(
          "[data-teacher-class-workspace-action]"
        );


      if (
        actionButton
      ){

        event.preventDefault();


        const action =
          String(
            actionButton.dataset
              .teacherClassWorkspaceAction ||
            ""
          )
            .trim()
            .toLowerCase();


        const classId =
          normalizeId(
            actionButton.dataset
              .classId
          );


        switch(
          action
        ){

          case "open":

            teacherClassWorkspaceState
              .selectedClassId =
                classId;


            state.selectedClassId =
              classId;


            renderTeacherSelectedClass(
              classId
            );


            /*
              Scroll the opened class workspace into view.
            */

            window.requestAnimationFrame(
              () => {

                const detail =
                  getTeacherOverviewElement(
                    "teacherSelectedClass",
                    "selectedClassWorkspace",
                    "teacherClassDetail"
                  );


                if (
                  detail
                ){

                  detail.scrollIntoView({
                    behavior:
                      "smooth",

                    block:
                      "start"
                  });

                }

              }
            );


            break;


          case "students":

            state.selectedClassId =
              classId;


            teacherClassWorkspaceState
              .selectedClassId =
                classId;


            if (
              typeof activateStudentStudioPage ===
              "function"
            ){

              activateStudentStudioPage(
                "students"
              );

            }


            if (
              typeof renderTeacherStudentsWorkspace ===
              "function"
            ){

              renderTeacherStudentsWorkspace();

            }


            break;


          case "close-class":

            closeTeacherSelectedClass();


            break;


          case "clear-filters":

            clearTeacherClassFilters();


            break;

        }


        return;

      }


      /* ===================================================
         SELECTED CLASS TOOL
      =================================================== */

      const classTool =
        event.target.closest(
          "[data-teacher-selected-class-action]"
        );


      if (
        classTool
      ){

        event.preventDefault();


        const action =
          String(
            classTool.dataset
              .teacherSelectedClassAction ||
            ""
          )
            .trim()
            .toLowerCase();


        const classId =
          normalizeId(
            classTool.dataset
              .classId
          );


        if (
          classId
        ){

          state.selectedClassId =
            classId;


          teacherClassWorkspaceState
            .selectedClassId =
              classId;

        }


        const pageMap = {

          students:
            "students",

          assignments:
            "assignments",

          grading:
            "grading",

          attendance:
            "attendance",

          quizzes:
            "quizzes",

          resources:
            "resources"

        };


        const targetPage =
          pageMap[
            action
          ];


        if (
          targetPage &&
          typeof activateStudentStudioPage ===
            "function"
        ){

          activateStudentStudioPage(
            targetPage
          );

        }


        return;

      }


      /* ===================================================
         STUDENT FROM CLASS
      =================================================== */

      const studentButton =
        event.target.closest(
          "[data-teacher-student-id]"
        );


      if (
        studentButton
      ){

        event.preventDefault();


        openTeacherStudent(
          studentButton.dataset
            .teacherStudentId
        );


        return;

      }

    }
  );

}


/* =========================================================
   INITIALIZE CLASS WORKSPACE
========================================================= */

function initializeTeacherClassesWorkspace(){

  bindTeacherClassWorkspace();


  if (
    state.me
  ){

    renderTeacherClassesWorkspace(
      state.selectedClassId ||
      teacherClassWorkspaceState
        .selectedClassId
    );

  }

}
/* =========================================================
   TEACHER STUDIO
   PART 6
   STUDENTS WORKSPACE
========================================================= */


/* =========================================================
   STUDENT WORKSPACE STATE
========================================================= */

const teacherStudentWorkspaceState = {

  search:
    "",

  classId:
    "all",

  status:
    "all",

  sort:
    "name",

  selectedStudentId:
    null

};


/* =========================================================
   STUDENT CLASSES
========================================================= */

function getTeacherStudentClasses(
  student
){

  return asArray(
    student?.classes
  );

}


/* =========================================================
   STUDENT CLASS TITLES
========================================================= */

function getTeacherStudentClassTitles(
  student
){

  return getTeacherStudentClasses(
    student
  )
    .map(
      classItem =>
        String(
          classItem?.title ||
          classItem?.subject ||
          "Class"
        )
    )
    .filter(
      Boolean
    );

}


/* =========================================================
   STUDENT SUBMISSIONS
========================================================= */

function getTeacherStudentSubmissions(
  studentId
){

  const normalizedId =
    normalizeId(
      studentId
    );


  return getTeacherSubmissions()
    .filter(
      submission =>
        sameId(
          submission?.studentId?._id ||
          submission?.studentId,
          normalizedId
        )
    );

}


/* =========================================================
   STUDENT ATTENDANCE
========================================================= */

function getTeacherStudentAttendance(
  studentId
){

  const normalizedId =
    normalizeId(
      studentId
    );


  return asArray(
    state.attendance
  )
    .filter(
      record =>
        sameId(
          record?.studentId?._id ||
          record?.studentId,
          normalizedId
        )
    );

}


/* =========================================================
   STUDENT ATTENDANCE RATE
========================================================= */

function getTeacherStudentAttendanceRate(
  studentId
){

  const records =
    getTeacherStudentAttendance(
      studentId
    );


  if (
    !records.length
  ){
    return 0;
  }


  const validRecords =
    records.filter(
      record =>
        [
          "present",
          "late",
          "absent",
          "excused"
        ].includes(
          String(
            record?.status ||
            ""
          )
            .trim()
            .toLowerCase()
        )
    );


  if (
    !validRecords.length
  ){
    return 0;
  }


  const attended =
    validRecords.filter(
      record =>
        [
          "present",
          "late"
        ].includes(
          String(
            record?.status ||
            ""
          )
            .trim()
            .toLowerCase()
        )
    ).length;


  return clampPercentage(
    (
      attended /
      validRecords.length
    ) *
    100
  );

}


/* =========================================================
   STUDENT GRADED SUBMISSIONS
========================================================= */

function getTeacherStudentReviewedSubmissions(
  studentId
){

  return getTeacherStudentSubmissions(
    studentId
  )
    .filter(
      submission =>
        [
          "reviewed",
          "graded",
          "returned"
        ].includes(
          normalizeSubmissionStatus(
            submission?.status
          )
        )
    );

}


/* =========================================================
   STUDENT PENDING REVIEW
========================================================= */

function getTeacherStudentPendingSubmissions(
  studentId
){

  return getTeacherStudentSubmissions(
    studentId
  )
    .filter(
      submission =>
        [
          "submitted",
          "pending"
        ].includes(
          normalizeSubmissionStatus(
            submission?.status
          )
        )
    );

}


/* =========================================================
   STUDENT ASSIGNMENTS
========================================================= */

function getTeacherStudentAssignments(
  studentId
){

  const student =
    getTeacherStudentById(
      studentId
    );


  if (
    !student
  ){
    return [];
  }


  const studentClassIds =
    new Set(
      getTeacherStudentClasses(
        student
      )
        .map(
          classItem =>
            normalizeId(
              classItem?._id ||
              classItem?.id
            )
        )
        .filter(
          Boolean
        )
    );


  return getTeacherAssignments()
    .filter(
      assignment => {

        const classId =
          normalizeId(
            assignment?.classId?._id ||
            assignment?.classId
          );


        return (
          classId &&
          studentClassIds.has(
            classId
          )
        );

      }
    );

}


/* =========================================================
   STUDENT MISSING ASSIGNMENTS
========================================================= */

function getTeacherStudentMissingAssignments(
  studentId
){

  const assignments =
    getTeacherStudentAssignments(
      studentId
    );


  const submissions =
    getTeacherStudentSubmissions(
      studentId
    );


  const submittedAssignmentIds =
    new Set(
      submissions
        .map(
          submission =>
            normalizeId(
              submission?.assignmentId?._id ||
              submission?.assignmentId
            )
        )
        .filter(
          Boolean
        )
    );


  return assignments.filter(
    assignment => {

      const assignmentId =
        normalizeId(
          assignment?._id ||
          assignment?.id
        );


      if (
        submittedAssignmentIds.has(
          assignmentId
        )
      ){
        return false;
      }


      const dueDateValue =
        assignment?.dueDate ||
        assignment?.deadline ||
        null;


      /*
        If there is no deadline, do not call it missing yet.
      */

      if (
        !dueDateValue
      ){
        return false;
      }


      const dueTime =
        new Date(
          dueDateValue
        )
          .getTime();


      if (
        Number.isNaN(
          dueTime
        )
      ){
        return false;
      }


      return (
        dueTime <
        Date.now()
      );

    }
  );

}


/* =========================================================
   STUDENT REVIEW COMPLETION
========================================================= */

function getTeacherStudentReviewRate(
  studentId
){

  const submissions =
    getTeacherStudentSubmissions(
      studentId
    );


  if (
    !submissions.length
  ){
    return 0;
  }


  const reviewed =
    getTeacherStudentReviewedSubmissions(
      studentId
    )
      .length;


  return clampPercentage(
    (
      reviewed /
      submissions.length
    ) *
    100
  );

}


/* =========================================================
   STUDENT STATUS
========================================================= */

function getTeacherStudentStatus(
  student
){

  const studentId =
    normalizeId(
      student?._id ||
      student?.id
    );


  const missing =
    getTeacherStudentMissingAssignments(
      studentId
    ).length;


  const attendance =
    getTeacherStudentAttendanceRate(
      studentId
    );


  const pending =
    getTeacherStudentPendingSubmissions(
      studentId
    ).length;


  if (
    attendance > 0 &&
    attendance < 60
  ){

    return "attention";

  }


  if (
    missing >= 2
  ){

    return "attention";

  }


  if (
    pending > 0
  ){

    return "pending";

  }


  return "good";

}


/* =========================================================
   STUDENT STATUS LABEL
========================================================= */

function getTeacherStudentStatusLabel(
  student
){

  const status =
    getTeacherStudentStatus(
      student
    );


  switch(
    status
  ){

    case "attention":

      return "Needs attention";


    case "pending":

      return "Work submitted";


    default:

      return "On track";

  }

}


/* =========================================================
   STUDENT LATEST ACTIVITY
========================================================= */

function getTeacherStudentLatestActivity(
  studentId
){

  const submissions =
    getTeacherStudentSubmissions(
      studentId
    );


  if (
    !submissions.length
  ){
    return null;
  }


  return [
    ...submissions
  ]
    .sort(
      (
        first,
        second
      ) =>
        new Date(
          second?.submittedAt ||
          second?.updatedAt ||
          second?.createdAt ||
          0
        )
          .getTime() -
        new Date(
          first?.submittedAt ||
          first?.updatedAt ||
          first?.createdAt ||
          0
        )
          .getTime()
    )[0] ||
    null;

}


/* =========================================================
   FILTER STUDENTS
========================================================= */

function getFilteredTeacherStudents(){

  const search =
    String(
      teacherStudentWorkspaceState.search ||
      ""
    )
      .trim()
      .toLowerCase();


  const classId =
    String(
      teacherStudentWorkspaceState.classId ||
      "all"
    );


  const status =
    String(
      teacherStudentWorkspaceState.status ||
      "all"
    );


  let students =
    [
      ...asArray(
        state.students
      )
    ];


  /* =======================================================
     SEARCH
  ======================================================= */

  if (
    search
  ){

    students =
      students.filter(
        student => {

          const haystack =
            [
              getTeacherDisplayName(
                student
              ),

              student?.email,

              student?.course,

              student?.program,

              ...getTeacherStudentClassTitles(
                student
              )
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  /* =======================================================
     CLASS FILTER
  ======================================================= */

  if (
    classId !==
    "all"
  ){

    students =
      students.filter(
        student =>
          getTeacherStudentClasses(
            student
          )
            .some(
              classItem =>
                sameId(
                  classItem?._id ||
                  classItem?.id,
                  classId
                )
            )
      );

  }


  /* =======================================================
     STATUS FILTER
  ======================================================= */

  if (
    status !==
    "all"
  ){

    students =
      students.filter(
        student =>
          getTeacherStudentStatus(
            student
          ) ===
          status
      );

  }


  /* =======================================================
     SORT
  ======================================================= */

  switch(
    teacherStudentWorkspaceState.sort
  ){

    case "attendance":

      students.sort(
        (
          first,
          second
        ) =>
          getTeacherStudentAttendanceRate(
            second?._id ||
            second?.id
          ) -
          getTeacherStudentAttendanceRate(
            first?._id ||
            first?.id
          )
      );

      break;


    case "missing":

      students.sort(
        (
          first,
          second
        ) =>
          getTeacherStudentMissingAssignments(
            second?._id ||
            second?.id
          ).length -
          getTeacherStudentMissingAssignments(
            first?._id ||
            first?.id
          ).length
      );

      break;


    case "recent":

      students.sort(
        (
          first,
          second
        ) => {

          const firstActivity =
            getTeacherStudentLatestActivity(
              first?._id ||
              first?.id
            );


          const secondActivity =
            getTeacherStudentLatestActivity(
              second?._id ||
              second?.id
            );


          return (
            new Date(
              secondActivity?.submittedAt ||
              secondActivity?.updatedAt ||
              secondActivity?.createdAt ||
              0
            )
              .getTime() -
            new Date(
              firstActivity?.submittedAt ||
              firstActivity?.updatedAt ||
              firstActivity?.createdAt ||
              0
            )
              .getTime()
          );

        }
      );

      break;


    case "name":
    default:

      students.sort(
        (
          first,
          second
        ) =>
          getTeacherDisplayName(
            first
          )
            .localeCompare(
              getTeacherDisplayName(
                second
              )
            )
      );

      break;

  }


  return students;

}


/* =========================================================
   STUDENT WORKSPACE HEADER
========================================================= */

function renderTeacherStudentsHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherStudentsHeader",
      "studentsWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Students
        </h1>

        <p>
          Review students enrolled in your
          assigned classes, monitor activity
          and identify work that needs attention.
        </p>

      </div>

    </div>
  `;

}


/* =========================================================
   STUDENT SUMMARY
========================================================= */

function renderTeacherStudentsSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherStudentsSummary",
      "studentsWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const students =
    asArray(
      state.students
    );


  const attention =
    students.filter(
      student =>
        getTeacherStudentStatus(
          student
        ) ===
        "attention"
    ).length;


  const submitted =
    students.filter(
      student =>
        getTeacherStudentStatus(
          student
        ) ===
        "pending"
    ).length;


  const averageAttendance =
    students.length
      ? Math.round(
          students.reduce(
            (
              total,
              student
            ) =>
              total +
              getTeacherStudentAttendanceRate(
                student?._id ||
                student?.id
              ),
            0
          ) /
          students.length
        )
      : 0;


  container.innerHTML = `

    <div
      class="teacher-student-summary-card"
    >
      <div>
        <i
          class="fa-solid fa-user-graduate"
        ></i>
      </div>

      <span>
        <strong>
          ${students.length}
        </strong>

        <small>
          Students
        </small>
      </span>
    </div>


    <div
      class="teacher-student-summary-card"
    >
      <div>
        <i
          class="fa-solid fa-triangle-exclamation"
        ></i>
      </div>

      <span>
        <strong>
          ${attention}
        </strong>

        <small>
          Need attention
        </small>
      </span>
    </div>


    <div
      class="teacher-student-summary-card"
    >
      <div>
        <i
          class="fa-solid fa-file-circle-check"
        ></i>
      </div>

      <span>
        <strong>
          ${submitted}
        </strong>

        <small>
          Work submitted
        </small>
      </span>
    </div>


    <div
      class="teacher-student-summary-card"
    >
      <div>
        <i
          class="fa-solid fa-calendar-check"
        ></i>
      </div>

      <span>
        <strong>
          ${averageAttendance}%
        </strong>

        <small>
          Avg. attendance
        </small>
      </span>
    </div>

  `;

}


/* =========================================================
   STUDENT TOOLBAR
========================================================= */

function renderTeacherStudentsToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherStudentsToolbar",
      "studentsWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  container.innerHTML = `

    <div
      class="teacher-student-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
      ></i>

      <input
        id="teacherStudentSearch"
        type="search"
        placeholder="Search students..."
        autocomplete="off"
        value="${escapeHtml(
          teacherStudentWorkspaceState.search
        )}"
      />

    </div>


    <select
      id="teacherStudentClassFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All classes
      </option>

      ${
        classes
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    classId
                  )}"
                  ${
                    sameId(
                      teacherStudentWorkspaceState.classId,
                      classId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <select
      id="teacherStudentStatusFilter"
      class="teacher-workspace-select"
    >

      <option
        value="all"
        ${
          teacherStudentWorkspaceState.status ===
          "all"
            ? "selected"
            : ""
        }
      >
        All students
      </option>

      <option
        value="good"
        ${
          teacherStudentWorkspaceState.status ===
          "good"
            ? "selected"
            : ""
        }
      >
        On track
      </option>

      <option
        value="pending"
        ${
          teacherStudentWorkspaceState.status ===
          "pending"
            ? "selected"
            : ""
        }
      >
        Work submitted
      </option>

      <option
        value="attention"
        ${
          teacherStudentWorkspaceState.status ===
          "attention"
            ? "selected"
            : ""
        }
      >
        Needs attention
      </option>

    </select>


    <select
      id="teacherStudentSort"
      class="teacher-workspace-select"
    >

      <option
        value="name"
        ${
          teacherStudentWorkspaceState.sort ===
          "name"
            ? "selected"
            : ""
        }
      >
        Name
      </option>

      <option
        value="recent"
        ${
          teacherStudentWorkspaceState.sort ===
          "recent"
            ? "selected"
            : ""
        }
      >
        Recent activity
      </option>

      <option
        value="attendance"
        ${
          teacherStudentWorkspaceState.sort ===
          "attendance"
            ? "selected"
            : ""
        }
      >
        Attendance
      </option>

      <option
        value="missing"
        ${
          teacherStudentWorkspaceState.sort ===
          "missing"
            ? "selected"
            : ""
        }
      >
        Missing work
      </option>

    </select>

  `;

}


/* =========================================================
   STUDENT ROW
========================================================= */

function createTeacherStudentRow(
  student
){

  const studentId =
    normalizeId(
      student?._id ||
      student?.id
    );


  const attendance =
    getTeacherStudentAttendanceRate(
      studentId
    );


  const submissions =
    getTeacherStudentSubmissions(
      studentId
    );


  const pending =
    getTeacherStudentPendingSubmissions(
      studentId
    ).length;


  const missing =
    getTeacherStudentMissingAssignments(
      studentId
    ).length;


  const status =
    getTeacherStudentStatus(
      student
    );


  const statusLabel =
    getTeacherStudentStatusLabel(
      student
    );


  const classes =
    getTeacherStudentClassTitles(
      student
    );


  const latest =
    getTeacherStudentLatestActivity(
      studentId
    );


  return `
    <article
      class="teacher-student-row"
      data-student-id="${escapeHtml(
        studentId
      )}"
    >

      <button
        type="button"
        class="teacher-student-main"
        data-teacher-student-action="open"
        data-student-id="${escapeHtml(
          studentId
        )}"
      >

        <img
          src="${escapeHtml(
            getTeacherStudentAvatar(
              student
            )
          )}"
          alt="${escapeHtml(
            getTeacherDisplayName(
              student
            )
          )}"
        />

        <span
          class="teacher-student-identity"
        >

          <strong>
            ${escapeHtml(
              getTeacherDisplayName(
                student
              )
            )}
          </strong>

          <small>
            ${escapeHtml(
              student?.email ||
              student?.course ||
              student?.program ||
              "Student"
            )}
          </small>

        </span>

      </button>


      <div
        class="teacher-student-class"
      >

        ${
          classes.length
            ? classes
                .slice(
                  0,
                  2
                )
                .map(
                  title => `
                    <span>
                      ${escapeHtml(
                        title
                      )}
                    </span>
                  `
                )
                .join(
                  ""
                )
            : `
                <span>
                  No class
                </span>
              `
        }

        ${
          classes.length > 2
            ? `
              <small>
                +${classes.length - 2}
              </small>
            `
            : ""
        }

      </div>


      <div
        class="teacher-student-metric"
      >
        <strong>
          ${attendance}%
        </strong>

        <span>
          Attendance
        </span>
      </div>


      <div
        class="teacher-student-metric"
      >
        <strong>
          ${submissions.length}
        </strong>

        <span>
          Submissions
        </span>
      </div>


      <div
        class="teacher-student-metric"
      >
        <strong>
          ${missing}
        </strong>

        <span>
          Missing
        </span>
      </div>


      <div
        class="teacher-student-status-column"
      >

        <span
          class="
            teacher-student-status
            is-${escapeHtml(
              status
            )}
          "
        >
          ${escapeHtml(
            statusLabel
          )}
        </span>

        ${
          latest
            ? `
              <small>
                ${escapeHtml(
                  formatTeacherRelativeTime(
                    latest?.submittedAt ||
                    latest?.createdAt
                  )
                )}
              </small>
            `
            : ""
        }

      </div>


      <div
        class="teacher-student-row-actions"
      >

        ${
          pending
            ? `
              <button
                type="button"
                class="teacher-student-grade-button"
                data-teacher-student-action="grading"
                data-student-id="${escapeHtml(
                  studentId
                )}"
              >
                ${pending}
                to grade
              </button>
            `
            : ""
        }

        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-student-action="open"
          data-student-id="${escapeHtml(
            studentId
          )}"
          aria-label="View student"
        >
          <i
            class="fa-solid fa-chevron-right"
          ></i>
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   STUDENTS LIST
========================================================= */

function renderTeacherStudentsList(){

  const container =
    getTeacherOverviewElement(
      "teacherStudentsList",
      "studentsWorkspaceList",
      "teacherStudentList"
    );


  if (
    !container
  ){
    return;
  }


  const students =
    getFilteredTeacherStudents();


  if (
    !students.length
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-solid fa-user-graduate"
          ></i>
        </div>

        <h3>
          No students found
        </h3>

        <p>
          ${
            state.students.length
              ? `
                Try changing the current search
                or filter.
              `
              : `
                Students from your assigned classes
                will appear here.
              `
          }
        </p>

        ${
          state.students.length
            ? `
              <button
                type="button"
                class="teacher-secondary-button"
                data-teacher-student-action="clear-filters"
              >
                Clear filters
              </button>
            `
            : ""
        }

      </div>
    `;


    return;

  }


  container.innerHTML = `
    <div
      class="teacher-student-table-head"
    >

      <span>
        Student
      </span>

      <span>
        Class
      </span>

      <span>
        Attendance
      </span>

      <span>
        Submitted
      </span>

      <span>
        Missing
      </span>

      <span>
        Status
      </span>

      <span></span>

    </div>

    <div
      class="teacher-student-table-body"
    >
      ${
        students
          .map(
            createTeacherStudentRow
          )
          .join(
            ""
          )
      }
    </div>
  `;

}


/* =========================================================
   SELECTED STUDENT OVERVIEW
========================================================= */

function renderTeacherSelectedStudent(
  studentId
){

  const container =
    getTeacherOverviewElement(
      "teacherSelectedStudent",
      "selectedStudentWorkspace",
      "teacherStudentDetail"
    );


  if (
    !container
  ){
    return;
  }


  const student =
    getTeacherStudentById(
      studentId
    );


  if (
    !student
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";


    return;
  }


  container.hidden =
    false;


  teacherStudentWorkspaceState
    .selectedStudentId =
      normalizeId(
        studentId
      );


  state.selectedStudentId =
    normalizeId(
      studentId
    );


  const submissions =
    getTeacherStudentSubmissions(
      studentId
    );


  const pending =
    getTeacherStudentPendingSubmissions(
      studentId
    );


  const reviewed =
    getTeacherStudentReviewedSubmissions(
      studentId
    );


  const missing =
    getTeacherStudentMissingAssignments(
      studentId
    );


  const attendanceRecords =
    getTeacherStudentAttendance(
      studentId
    );


  const attendanceRate =
    getTeacherStudentAttendanceRate(
      studentId
    );


  const reviewRate =
    getTeacherStudentReviewRate(
      studentId
    );


  const classes =
    getTeacherStudentClasses(
      student
    );


  container.innerHTML = `
    <section
      class="teacher-selected-student-panel"
    >

      <header
        class="teacher-selected-student-header"
      >

        <button
          type="button"
          class="teacher-selected-student-back"
          data-teacher-student-action="close"
          aria-label="Back to students"
        >
          <i
            class="fa-solid fa-arrow-left"
          ></i>
        </button>


        <img
          src="${escapeHtml(
            getTeacherStudentAvatar(
              student
            )
          )}"
          alt="${escapeHtml(
            getTeacherDisplayName(
              student
            )
          )}"
        />


        <div
          class="teacher-selected-student-heading"
        >

          <span>
            Student overview
          </span>

          <h2>
            ${escapeHtml(
              getTeacherDisplayName(
                student
              )
            )}
          </h2>

          <p>
            ${escapeHtml(
              student?.email ||
              student?.course ||
              student?.program ||
              "Student"
            )}
          </p>

        </div>


        <button
          type="button"
          class="teacher-primary-button"
          data-kabezya-student-inspect="${escapeHtml(
            studentId
          )}"
        >
          <i
            class="fa-solid fa-wand-magic-sparkles"
          ></i>

          Ask Kabezya
        </button>

      </header>


      <div
        class="teacher-selected-student-metrics"
      >

        <article>

          <span>
            Attendance
          </span>

          <strong>
            ${attendanceRate}%
          </strong>

        </article>


        <article>

          <span>
            Submissions
          </span>

          <strong>
            ${submissions.length}
          </strong>

        </article>


        <article>

          <span>
            Waiting review
          </span>

          <strong>
            ${pending.length}
          </strong>

        </article>


        <article>

          <span>
            Missing work
          </span>

          <strong>
            ${missing.length}
          </strong>

        </article>


        <article>

          <span>
            Review complete
          </span>

          <strong>
            ${reviewRate}%
          </strong>

        </article>

      </div>


      <div
        class="teacher-selected-student-grid"
      >

        <section
          class="teacher-selected-student-section"
        >

          <div
            class="teacher-selected-section-head"
          >
            <div>
              <h3>
                Classes
              </h3>

              <p>
                Classes you currently teach this student.
              </p>
            </div>
          </div>


          <div
            class="teacher-selected-student-classes"
          >

            ${
              classes.length
                ? classes
                    .map(
                      classItem => `
                        <button
                          type="button"
                          class="teacher-selected-student-class"
                          data-teacher-student-class-id="${escapeHtml(
                            normalizeId(
                              classItem?._id ||
                              classItem?.id
                            )
                          )}"
                        >

                          <span
                            class="teacher-selected-student-class-icon"
                          >
                            <i
                              class="fa-solid fa-chalkboard"
                            ></i>
                          </span>

                          <span>

                            <strong>
                              ${escapeHtml(
                                classItem?.title ||
                                classItem?.subject ||
                                "Class"
                              )}
                            </strong>

                            <small>
                              Open class
                            </small>

                          </span>

                          <i
                            class="fa-solid fa-chevron-right"
                          ></i>

                        </button>
                      `
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      No assigned class found.
                    </div>
                  `
            }

          </div>

        </section>


        <section
          class="teacher-selected-student-section"
        >

          <div
            class="teacher-selected-section-head"
          >

            <div>

              <h3>
                Recent submissions
              </h3>

              <p>
                Latest work received from this student.
              </p>

            </div>

            ${
              pending.length
                ? `
                  <button
                    type="button"
                    class="teacher-text-button"
                    data-teacher-student-action="grading"
                    data-student-id="${escapeHtml(
                      studentId
                    )}"
                  >
                    Grade work
                  </button>
                `
                : ""
            }

          </div>


          <div
            class="teacher-selected-submission-list"
          >

            ${
              submissions.length
                ? [
                    ...submissions
                  ]
                    .sort(
                      (
                        first,
                        second
                      ) =>
                        new Date(
                          second?.submittedAt ||
                          second?.createdAt ||
                          0
                        ).getTime() -
                        new Date(
                          first?.submittedAt ||
                          first?.createdAt ||
                          0
                        ).getTime()
                    )
                    .slice(
                      0,
                      6
                    )
                    .map(
                      submission => {

                        const assignment =
                          getTeacherSubmissionAssignment(
                            submission
                          );


                        const status =
                          normalizeSubmissionStatus(
                            submission?.status
                          );


                        return `
                          <button
                            type="button"
                            class="teacher-selected-submission-row"
                            data-teacher-submission-action="review"
                            data-submission-id="${escapeHtml(
                              normalizeId(
                                submission?._id ||
                                submission?.id
                              )
                            )}"
                          >

                            <span
                              class="teacher-selected-submission-icon"
                            >
                              <i
                                class="fa-regular fa-file-lines"
                              ></i>
                            </span>

                            <span
                              class="teacher-selected-submission-main"
                            >

                              <strong>
                                ${escapeHtml(
                                  getTeacherAssignmentTitle(
                                    assignment
                                  )
                                )}
                              </strong>

                              <small>
                                ${escapeHtml(
                                  formatTeacherRelativeTime(
                                    submission?.submittedAt ||
                                    submission?.createdAt
                                  )
                                )}
                              </small>

                            </span>

                            <span
                              class="
                                teacher-submission-status
                                is-${escapeHtml(
                                  status
                                )}
                              "
                            >
                              ${escapeHtml(
                                status
                              )}
                            </span>

                          </button>
                        `;

                      }
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      This student has no recorded
                      submissions yet.
                    </div>
                  `
            }

          </div>

        </section>


        <section
          class="teacher-selected-student-section"
        >

          <div
            class="teacher-selected-section-head"
          >

            <div>

              <h3>
                Missing work
              </h3>

              <p>
                Past-due assignments without a recorded submission.
              </p>

            </div>

          </div>


          <div
            class="teacher-selected-missing-list"
          >

            ${
              missing.length
                ? missing
                    .slice(
                      0,
                      6
                    )
                    .map(
                      assignment => `
                        <button
                          type="button"
                          class="teacher-selected-missing-row"
                          data-teacher-assignment-action="open"
                          data-assignment-id="${escapeHtml(
                            normalizeId(
                              assignment?._id ||
                              assignment?.id
                            )
                          )}"
                        >

                          <span
                            class="teacher-selected-missing-icon"
                          >
                            <i
                              class="fa-solid fa-file-circle-exclamation"
                            ></i>
                          </span>

                          <span>

                            <strong>
                              ${escapeHtml(
                                getTeacherAssignmentTitle(
                                  assignment
                                )
                              )}
                            </strong>

                            <small>
                              Due
                              ${escapeHtml(
                                formatTeacherDate(
                                  assignment?.dueDate ||
                                  assignment?.deadline
                                )
                              )}
                            </small>

                          </span>

                          <i
                            class="fa-solid fa-chevron-right"
                          ></i>

                        </button>
                      `
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-positive-empty"
                    >

                      <i
                        class="fa-solid fa-circle-check"
                      ></i>

                      <span>
                        No missing assignments detected.
                      </span>

                    </div>
                  `
            }

          </div>

        </section>


        <section
          class="teacher-selected-student-section"
        >

          <div
            class="teacher-selected-section-head"
          >

            <div>

              <h3>
                Attendance
              </h3>

              <p>
                Recent attendance records.
              </p>

            </div>

            <button
              type="button"
              class="teacher-text-button"
              data-teacher-student-action="attendance"
              data-student-id="${escapeHtml(
                studentId
              )}"
            >
              View attendance
            </button>

          </div>


          <div
            class="teacher-selected-attendance-list"
          >

            ${
              attendanceRecords.length
                ? [
                    ...attendanceRecords
                  ]
                    .sort(
                      (
                        first,
                        second
                      ) =>
                        new Date(
                          second?.date ||
                          second?.createdAt ||
                          0
                        ).getTime() -
                        new Date(
                          first?.date ||
                          first?.createdAt ||
                          0
                        ).getTime()
                    )
                    .slice(
                      0,
                      6
                    )
                    .map(
                      record => {

                        const status =
                          String(
                            record?.status ||
                            "unknown"
                          )
                            .toLowerCase();


                        return `
                          <div
                            class="teacher-selected-attendance-row"
                          >

                            <span
                              class="
                                teacher-attendance-dot
                                is-${escapeHtml(
                                  status
                                )}
                              "
                            ></span>

                            <span>

                              <strong>
                                ${escapeHtml(
                                  formatTeacherDate(
                                    record?.date ||
                                    record?.createdAt
                                  )
                                )}
                              </strong>

                              <small>
                                ${escapeHtml(
                                  record?.classId?.title ||
                                  record?.classId?.subject ||
                                  "Class"
                                )}
                              </small>

                            </span>

                            <span
                              class="
                                teacher-attendance-status
                                is-${escapeHtml(
                                  status
                                )}
                              "
                            >
                              ${escapeHtml(
                                status
                              )}
                            </span>

                          </div>
                        `;

                      }
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      No attendance records are available yet.
                    </div>
                  `
            }

          </div>

        </section>

      </div>

    </section>
  `;

}


/* =========================================================
   RENDER STUDENTS WORKSPACE
========================================================= */

function renderTeacherStudentsWorkspace(
  selectedStudentId = null
){

  if (
    selectedStudentId
  ){

    teacherStudentWorkspaceState
      .selectedStudentId =
        normalizeId(
          selectedStudentId
        );


    state.selectedStudentId =
      teacherStudentWorkspaceState
        .selectedStudentId;

  }


  /*
    When opening Students from a selected class,
    preserve that class as the active filter.
  */

  if (
    state.selectedClassId &&
    teacherStudentWorkspaceState.classId ===
      "all"
  ){

    teacherStudentWorkspaceState
      .classId =
        normalizeId(
          state.selectedClassId
        ) ||
        "all";

  }


  renderTeacherStudentsHeader();


  renderTeacherStudentsSummary();


  renderTeacherStudentsToolbar();


  renderTeacherStudentsList();


  if (
    teacherStudentWorkspaceState
      .selectedStudentId
  ){

    renderTeacherSelectedStudent(
      teacherStudentWorkspaceState
        .selectedStudentId
    );

  }

}


/* =========================================================
   COMPATIBILITY RENDERER
========================================================= */

function renderTeacherStudents(){

  renderTeacherStudentsWorkspace(
    state.selectedStudentId ||
    teacherStudentWorkspaceState
      .selectedStudentId
  );

}


/* =========================================================
   CLEAR STUDENT FILTERS
========================================================= */

function clearTeacherStudentFilters(){

  teacherStudentWorkspaceState
    .search =
      "";


  teacherStudentWorkspaceState
    .classId =
      "all";


  teacherStudentWorkspaceState
    .status =
      "all";


  teacherStudentWorkspaceState
    .sort =
      "name";


  renderTeacherStudentsToolbar();


  renderTeacherStudentsList();

}


/* =========================================================
   CLOSE STUDENT DETAIL
========================================================= */

function closeTeacherSelectedStudent(){

  teacherStudentWorkspaceState
    .selectedStudentId =
      null;


  state.selectedStudentId =
    null;


  const container =
    getTeacherOverviewElement(
      "teacherSelectedStudent",
      "selectedStudentWorkspace",
      "teacherStudentDetail"
    );


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   STUDENT CONTROLS
========================================================= */

let teacherStudentControlsBound =
  false;


function bindTeacherStudentControls(){

  if (
    teacherStudentControlsBound
  ){
    return;
  }


  teacherStudentControlsBound =
    true;


  /* =======================================================
     SEARCH
  ======================================================= */

  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id !==
        "teacherStudentSearch"
      ){
        return;
      }


      teacherStudentWorkspaceState
        .search =
          event.target.value ||
          "";


      renderTeacherStudentsList();

    }
  );


  /* =======================================================
     FILTERS
  ======================================================= */

  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherStudentClassFilter"
      ){

        teacherStudentWorkspaceState
          .classId =
            event.target.value ||
            "all";


        renderTeacherStudentsList();


        return;

      }


      if (
        event.target?.id ===
        "teacherStudentStatusFilter"
      ){

        teacherStudentWorkspaceState
          .status =
            event.target.value ||
            "all";


        renderTeacherStudentsList();


        return;

      }


      if (
        event.target?.id ===
        "teacherStudentSort"
      ){

        teacherStudentWorkspaceState
          .sort =
            event.target.value ||
            "name";


        renderTeacherStudentsList();

      }

    }
  );


  /* =======================================================
     CLICKS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const actionButton =
        event.target.closest(
          "[data-teacher-student-action]"
        );


      if (
        actionButton
      ){

        event.preventDefault();


        const action =
          String(
            actionButton.dataset
              .teacherStudentAction ||
            ""
          )
            .trim()
            .toLowerCase();


        const studentId =
          normalizeId(
            actionButton.dataset
              .studentId
          );


        switch(
          action
        ){

          case "open":

            teacherStudentWorkspaceState
              .selectedStudentId =
                studentId;


            state.selectedStudentId =
              studentId;


            renderTeacherSelectedStudent(
              studentId
            );


            window.requestAnimationFrame(
              () => {

                const panel =
                  getTeacherOverviewElement(
                    "teacherSelectedStudent",
                    "selectedStudentWorkspace",
                    "teacherStudentDetail"
                  );


                panel?.scrollIntoView({
                  behavior:
                    "smooth",

                  block:
                    "start"
                });

              }
            );


            break;


          case "grading":

            state.selectedStudentId =
              studentId;


            activateStudentStudioPage(
              "grading"
            );


            break;


          case "attendance":

            state.selectedStudentId =
              studentId;


            activateStudentStudioPage(
              "attendance"
            );


            break;


          case "close":

            closeTeacherSelectedStudent();


            break;


          case "clear-filters":

            clearTeacherStudentFilters();


            break;

        }


        return;

      }


      /* ===================================================
         CLASS INSIDE STUDENT PROFILE
      =================================================== */

      const classButton =
        event.target.closest(
          "[data-teacher-student-class-id]"
        );


      if (
        classButton
      ){

        event.preventDefault();


        const classId =
          normalizeId(
            classButton.dataset
              .teacherStudentClassId
          );


        state.selectedClassId =
          classId;


        teacherClassWorkspaceState
          .selectedClassId =
            classId;


        activateStudentStudioPage(
          "classes"
        );


        window.requestAnimationFrame(
          () => {

            renderTeacherSelectedClass(
              classId
            );

          }
        );


        return;

      }


      /* ===================================================
         KABEZYA STUDENT INSPECTION
      =================================================== */

      const kabezyaButton =
        event.target.closest(
          "[data-kabezya-student-inspect]"
        );


      if (
        kabezyaButton
      ){

        event.preventDefault();


        const studentId =
          normalizeId(
            kabezyaButton.dataset
              .kabezyaStudentInspect
          );


        state.selectedStudentId =
          studentId;


        state.kabezya.studentId =
          studentId;


        activateStudentStudioPage(
          "ai"
        );


        return;

      }

    }
  );

}


/* =========================================================
   INITIALIZE STUDENT WORKSPACE
========================================================= */

function initializeTeacherStudentsWorkspace(){

  bindTeacherStudentControls();


  if (
    state.me
  ){

    renderTeacherStudentsWorkspace(
      state.selectedStudentId ||
      teacherStudentWorkspaceState
        .selectedStudentId
    );

  }

}
/* =========================================================
   TEACHER STUDIO
   PART 7
   ASSIGNMENTS WORKSPACE
========================================================= */


/* =========================================================
   ASSIGNMENT WORKSPACE STATE
========================================================= */

const teacherAssignmentWorkspaceState = {

  search:
    "",

  classId:
    "all",

  status:
    "all",

  sort:
    "due",

  selectedAssignmentId:
    null,

  editingAssignmentId:
    null,

  saving:
    false

};


/* =========================================================
   ASSIGNMENT CLASS
========================================================= */

function getTeacherAssignmentClass(
  assignment
){

  const classValue =
    assignment?.classId;


  if (
    classValue &&
    typeof classValue ===
      "object"
  ){

    return classValue;

  }


  return (
    getTeacherClassById(
      classValue
    ) ||
    null
  );

}


/* =========================================================
   ASSIGNMENT STATUS LABEL
========================================================= */

function getTeacherAssignmentStatusLabel(
  assignment
){

  const status =
    normalizeAssignmentStatus(
      assignment?.status
    );


  switch(
    status
  ){

    case "draft":
      return "Draft";

    case "published":
    case "active":
      return "Published";

    case "closed":
      return "Closed";

    case "archived":
      return "Archived";

    default:

      return (
        status.charAt(
          0
        ).toUpperCase() +
        status.slice(
          1
        )
      );

  }

}


/* =========================================================
   ASSIGNMENT DUE DATE
========================================================= */

function getTeacherAssignmentDueDate(
  assignment
){

  return (
    assignment?.dueDate ||
    assignment?.deadline ||
    assignment?.endDate ||
    null
  );

}


/* =========================================================
   ASSIGNMENT SUBMISSIONS
========================================================= */

function getTeacherAssignmentSubmissions(
  assignmentId
){

  const normalizedId =
    normalizeId(
      assignmentId
    );


  return getTeacherSubmissions()
    .filter(
      submission =>
        sameId(
          submission?.assignmentId?._id ||
          submission?.assignmentId,
          normalizedId
        )
    );

}


/* =========================================================
   ASSIGNMENT PENDING GRADING
========================================================= */

function getTeacherAssignmentPendingCount(
  assignmentId
){

  return getTeacherAssignmentSubmissions(
    assignmentId
  )
    .filter(
      submission =>
        [
          "submitted",
          "pending"
        ].includes(
          normalizeSubmissionStatus(
            submission?.status
          )
        )
    )
    .length;

}


/* =========================================================
   ASSIGNMENT REVIEWED COUNT
========================================================= */

function getTeacherAssignmentReviewedCount(
  assignmentId
){

  return getTeacherAssignmentSubmissions(
    assignmentId
  )
    .filter(
      submission =>
        [
          "reviewed",
          "graded",
          "returned"
        ].includes(
          normalizeSubmissionStatus(
            submission?.status
          )
        )
    )
    .length;

}


/* =========================================================
   ASSIGNMENT EXPECTED STUDENTS
========================================================= */

function getTeacherAssignmentExpectedStudents(
  assignment
){

  const classItem =
    getTeacherAssignmentClass(
      assignment
    );


  if (
    !classItem
  ){
    return 0;
  }


  return getTeacherClassStudentCount(
    classItem
  );

}


/* =========================================================
   ASSIGNMENT COMPLETION RATE
========================================================= */

function getTeacherAssignmentCompletionRate(
  assignment
){

  const assignmentId =
    normalizeId(
      assignment?._id ||
      assignment?.id
    );


  const expected =
    getTeacherAssignmentExpectedStudents(
      assignment
    );


  if (
    !expected
  ){
    return 0;
  }


  const submitted =
    getTeacherAssignmentSubmissions(
      assignmentId
    ).length;


  return clampPercentage(
    (
      submitted /
      expected
    ) *
    100
  );

}


/* =========================================================
   ASSIGNMENT IS OVERDUE
========================================================= */

function isTeacherAssignmentOverdue(
  assignment
){

  const dueDate =
    getTeacherAssignmentDueDate(
      assignment
    );


  if (
    !dueDate
  ){
    return false;
  }


  const time =
    new Date(
      dueDate
    )
      .getTime();


  if (
    Number.isNaN(
      time
    )
  ){
    return false;
  }


  return (
    time <
    Date.now()
  );

}


/* =========================================================
   FILTER ASSIGNMENTS
========================================================= */

function getFilteredTeacherAssignments(){

  const search =
    String(
      teacherAssignmentWorkspaceState.search ||
      ""
    )
      .trim()
      .toLowerCase();


  const classId =
    String(
      teacherAssignmentWorkspaceState.classId ||
      "all"
    );


  const status =
    String(
      teacherAssignmentWorkspaceState.status ||
      "all"
    );


  let assignments =
    [
      ...getTeacherAssignments()
    ];


  if (
    search
  ){

    assignments =
      assignments.filter(
        assignment => {

          const classItem =
            getTeacherAssignmentClass(
              assignment
            );


          const haystack =
            [
              getTeacherAssignmentTitle(
                assignment
              ),

              assignment?.instructions,

              assignment?.description,

              getTeacherClassTitle(
                classItem
              )
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  if (
    classId !==
    "all"
  ){

    assignments =
      assignments.filter(
        assignment =>
          sameId(
            assignment?.classId?._id ||
            assignment?.classId,
            classId
          )
      );

  }


  if (
    status !==
    "all"
  ){

    assignments =
      assignments.filter(
        assignment =>
          normalizeAssignmentStatus(
            assignment?.status
          ) ===
          status
      );

  }


  switch(
    teacherAssignmentWorkspaceState.sort
  ){

    case "name":

      assignments.sort(
        (
          first,
          second
        ) =>
          getTeacherAssignmentTitle(
            first
          )
            .localeCompare(
              getTeacherAssignmentTitle(
                second
              )
            )
      );

      break;


    case "submissions":

      assignments.sort(
        (
          first,
          second
        ) =>
          getTeacherAssignmentSubmissions(
            second?._id ||
            second?.id
          ).length -
          getTeacherAssignmentSubmissions(
            first?._id ||
            first?.id
          ).length
      );

      break;


    case "pending":

      assignments.sort(
        (
          first,
          second
        ) =>
          getTeacherAssignmentPendingCount(
            second?._id ||
            second?.id
          ) -
          getTeacherAssignmentPendingCount(
            first?._id ||
            first?.id
          )
      );

      break;


    case "recent":

      assignments.sort(
        (
          first,
          second
        ) =>
          new Date(
            second?.createdAt ||
            second?.updatedAt ||
            0
          ).getTime() -
          new Date(
            first?.createdAt ||
            first?.updatedAt ||
            0
          ).getTime()
      );

      break;


    case "due":
    default:

      assignments.sort(
        (
          first,
          second
        ) => {

          const firstDue =
            new Date(
              getTeacherAssignmentDueDate(
                first
              ) ||
              8640000000000000
            )
              .getTime();


          const secondDue =
            new Date(
              getTeacherAssignmentDueDate(
                second
              ) ||
              8640000000000000
            )
              .getTime();


          return (
            firstDue -
            secondDue
          );

        }
      );

      break;

  }


  return assignments;

}


/* =========================================================
   ASSIGNMENT WORKSPACE HEADER
========================================================= */

function renderTeacherAssignmentsHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherAssignmentsHeader",
      "assignmentsWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Assignments
        </h1>

        <p>
          Create coursework, manage deadlines,
          review submissions and monitor grading
          activity across your classes.
        </p>

      </div>


      <button
        type="button"
        class="teacher-primary-button"
        data-teacher-assignment-action="create"
      >
        <i
          class="fa-solid fa-plus"
        ></i>

        Create assignment
      </button>

    </div>
  `;

}


/* =========================================================
   ASSIGNMENT SUMMARY
========================================================= */

function renderTeacherAssignmentsSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherAssignmentsSummary",
      "assignmentsWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const assignments =
    getTeacherAssignments();


  const published =
    assignments.filter(
      assignment =>
        [
          "published",
          "active"
        ].includes(
          normalizeAssignmentStatus(
            assignment?.status
          )
        )
    ).length;


  const drafts =
    assignments.filter(
      assignment =>
        normalizeAssignmentStatus(
          assignment?.status
        ) ===
        "draft"
    ).length;


  const pending =
    getPendingTeacherSubmissions()
      .length;


  container.innerHTML = `

    <div
      class="teacher-assignment-summary-card"
    >
      <i
        class="fa-solid fa-file-lines"
      ></i>

      <span>
        <strong>
          ${assignments.length}
        </strong>

        <small>
          Total assignments
        </small>
      </span>
    </div>


    <div
      class="teacher-assignment-summary-card"
    >
      <i
        class="fa-solid fa-circle-check"
      ></i>

      <span>
        <strong>
          ${published}
        </strong>

        <small>
          Published
        </small>
      </span>
    </div>


    <div
      class="teacher-assignment-summary-card"
    >
      <i
        class="fa-regular fa-file"
      ></i>

      <span>
        <strong>
          ${drafts}
        </strong>

        <small>
          Drafts
        </small>
      </span>
    </div>


    <div
      class="teacher-assignment-summary-card"
    >
      <i
        class="fa-solid fa-pen-to-square"
      ></i>

      <span>
        <strong>
          ${pending}
        </strong>

        <small>
          Waiting review
        </small>
      </span>
    </div>

  `;

}


/* =========================================================
   ASSIGNMENT TOOLBAR
========================================================= */

function renderTeacherAssignmentsToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherAssignmentsToolbar",
      "assignmentsWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  container.innerHTML = `

    <div
      class="teacher-assignment-search"
    >
      <i
        class="fa-solid fa-magnifying-glass"
      ></i>

      <input
        id="teacherAssignmentSearch"
        type="search"
        placeholder="Search assignments..."
        value="${escapeHtml(
          teacherAssignmentWorkspaceState.search
        )}"
      />
    </div>


    <select
      id="teacherAssignmentClassFilter"
      class="teacher-workspace-select"
    >
      <option value="all">
        All classes
      </option>

      ${
        classes.map(
          classItem => {

            const classId =
              normalizeId(
                classItem?._id ||
                classItem?.id
              );


            return `
              <option
                value="${escapeHtml(
                  classId
                )}"
                ${
                  sameId(
                    teacherAssignmentWorkspaceState.classId,
                    classId
                  )
                    ? "selected"
                    : ""
                }
              >
                ${escapeHtml(
                  getTeacherClassTitle(
                    classItem
                  )
                )}
              </option>
            `;

          }
        ).join("")
      }
    </select>


    <select
      id="teacherAssignmentStatusFilter"
      class="teacher-workspace-select"
    >
      <option
        value="all"
        ${
          teacherAssignmentWorkspaceState.status ===
          "all"
            ? "selected"
            : ""
        }
      >
        All statuses
      </option>

      <option
        value="draft"
        ${
          teacherAssignmentWorkspaceState.status ===
          "draft"
            ? "selected"
            : ""
        }
      >
        Draft
      </option>

      <option
        value="published"
        ${
          teacherAssignmentWorkspaceState.status ===
          "published"
            ? "selected"
            : ""
        }
      >
        Published
      </option>

      <option
        value="closed"
        ${
          teacherAssignmentWorkspaceState.status ===
          "closed"
            ? "selected"
            : ""
        }
      >
        Closed
      </option>
    </select>


    <select
      id="teacherAssignmentSort"
      class="teacher-workspace-select"
    >
      <option value="due">
        Due date
      </option>

      <option value="recent">
        Recently created
      </option>

      <option value="name">
        Assignment name
      </option>

      <option value="submissions">
        Most submissions
      </option>

      <option value="pending">
        Most grading
      </option>
    </select>

  `;

}


/* =========================================================
   CREATE ASSIGNMENT CARD
========================================================= */

function createTeacherAssignmentCard(
  assignment
){

  const assignmentId =
    normalizeId(
      assignment?._id ||
      assignment?.id
    );


  const classItem =
    getTeacherAssignmentClass(
      assignment
    );


  const status =
    normalizeAssignmentStatus(
      assignment?.status
    );


  const dueDate =
    getTeacherAssignmentDueDate(
      assignment
    );


  const submissions =
    getTeacherAssignmentSubmissions(
      assignmentId
    ).length;


  const pending =
    getTeacherAssignmentPendingCount(
      assignmentId
    );


  const reviewed =
    getTeacherAssignmentReviewedCount(
      assignmentId
    );


  const expected =
    getTeacherAssignmentExpectedStudents(
      assignment
    );


  const completion =
    getTeacherAssignmentCompletionRate(
      assignment
    );


  return `
    <article
      class="teacher-assignment-card"
      data-assignment-id="${escapeHtml(
        assignmentId
      )}"
    >

      <div
        class="teacher-assignment-card-head"
      >

        <span
          class="
            teacher-assignment-status
            is-${escapeHtml(
              status
            )}
          "
        >
          ${escapeHtml(
            getTeacherAssignmentStatusLabel(
              assignment
            )
          )}
        </span>

        ${
          isTeacherAssignmentOverdue(
            assignment
          )
            ? `
              <span
                class="teacher-assignment-overdue"
              >
                Overdue
              </span>
            `
            : ""
        }

        <button
          type="button"
          class="teacher-assignment-more"
          data-teacher-assignment-menu="${escapeHtml(
            assignmentId
          )}"
          aria-label="Assignment options"
        >
          <i
            class="fa-solid fa-ellipsis"
          ></i>
        </button>

      </div>


      <div
        class="teacher-assignment-card-main"
      >

        <div
          class="teacher-assignment-icon"
        >
          <i
            class="fa-regular fa-file-lines"
          ></i>
        </div>

        <div>

          <h3>
            ${escapeHtml(
              getTeacherAssignmentTitle(
                assignment
              )
            )}
          </h3>

          <p>
            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </p>

        </div>

      </div>


      <div
        class="teacher-assignment-card-meta"
      >

        <div>
          <span>
            Due
          </span>

          <strong>
            ${
              dueDate
                ? escapeHtml(
                    formatTeacherDate(
                      dueDate,
                      {
                        year:
                          "numeric"
                      }
                    )
                  )
                : "No due date"
            }
          </strong>
        </div>

        <div>
          <span>
            Submitted
          </span>

          <strong>
            ${submissions}/${expected}
          </strong>
        </div>

      </div>


      <div
        class="teacher-assignment-progress"
      >

        <div>
          <span>
            Completion
          </span>

          <strong>
            ${completion}%
          </strong>
        </div>

        <div
          class="teacher-assignment-progress-track"
        >
          <span
            style="
              width:${completion}%;
            "
          ></span>
        </div>

      </div>


      <div
        class="teacher-assignment-review-stats"
      >

        <span>
          <strong>
            ${pending}
          </strong>
          waiting review
        </span>

        <span>
          <strong>
            ${reviewed}
          </strong>
          reviewed
        </span>

      </div>


      <div
        class="teacher-assignment-card-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-assignment-action="edit"
          data-assignment-id="${escapeHtml(
            assignmentId
          )}"
        >
          <i
            class="fa-solid fa-pen"
          ></i>

          Edit
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-assignment-action="open"
          data-assignment-id="${escapeHtml(
            assignmentId
          )}"
        >
          Open

          <i
            class="fa-solid fa-arrow-right"
          ></i>
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   ASSIGNMENT GRID
========================================================= */

function renderTeacherAssignmentsGrid(){

  const container =
    getTeacherOverviewElement(
      "teacherAssignmentsGrid",
      "assignmentsWorkspaceGrid",
      "teacherAssignmentList"
    );


  if (
    !container
  ){
    return;
  }


  const assignments =
    getFilteredTeacherAssignments();


  if (
    !assignments.length
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-regular fa-file-lines"
          ></i>
        </div>

        <h3>
          No assignments found
        </h3>

        <p>
          ${
            getTeacherAssignments().length
              ? `
                Try changing your current search
                or filters.
              `
              : `
                Create your first assignment for
                one of your assigned classes.
              `
          }
        </p>

        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-assignment-action="create"
        >
          <i
            class="fa-solid fa-plus"
          ></i>

          Create assignment
        </button>

      </div>
    `;


    return;

  }


  container.innerHTML =
    assignments
      .map(
        createTeacherAssignmentCard
      )
      .join(
        ""
      );

}


/* =========================================================
   SELECTED ASSIGNMENT
========================================================= */

function renderTeacherSelectedAssignment(
  assignmentId
){

  const container =
    getTeacherOverviewElement(
      "teacherSelectedAssignment",
      "selectedAssignmentWorkspace",
      "teacherAssignmentDetail"
    );


  if (
    !container
  ){
    return;
  }


  const assignment =
    getTeacherAssignmentById(
      assignmentId
    );


  if (
    !assignment
  ){

    container.hidden =
      true;

    container.innerHTML =
      "";

    return;
  }


  container.hidden =
    false;


  teacherAssignmentWorkspaceState
    .selectedAssignmentId =
      normalizeId(
        assignmentId
      );


  state.selectedAssignmentId =
    teacherAssignmentWorkspaceState
      .selectedAssignmentId;


  const classItem =
    getTeacherAssignmentClass(
      assignment
    );


  const submissions =
    getTeacherAssignmentSubmissions(
      assignmentId
    );


  const pending =
    submissions.filter(
      submission =>
        [
          "submitted",
          "pending"
        ].includes(
          normalizeSubmissionStatus(
            submission?.status
          )
        )
    );


  const reviewed =
    submissions.filter(
      submission =>
        [
          "reviewed",
          "graded",
          "returned"
        ].includes(
          normalizeSubmissionStatus(
            submission?.status
          )
        )
    );


  const expected =
    getTeacherAssignmentExpectedStudents(
      assignment
    );


  const completion =
    getTeacherAssignmentCompletionRate(
      assignment
    );


  container.innerHTML = `
    <section
      class="teacher-selected-assignment-panel"
    >

      <header
        class="teacher-selected-assignment-header"
      >

        <button
          type="button"
          class="teacher-selected-assignment-back"
          data-teacher-assignment-action="close"
          aria-label="Back to assignments"
        >
          <i
            class="fa-solid fa-arrow-left"
          ></i>
        </button>


        <div
          class="teacher-selected-assignment-heading"
        >

          <span>
            Assignment
          </span>

          <h2>
            ${escapeHtml(
              getTeacherAssignmentTitle(
                assignment
              )
            )}
          </h2>

          <p>
            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </p>

        </div>


        <div
          class="teacher-selected-assignment-header-actions"
        >

          <button
            type="button"
            class="teacher-secondary-button"
            data-kabezya-assignment-inspect="${escapeHtml(
              assignmentId
            )}"
          >
            <i
              class="fa-solid fa-wand-magic-sparkles"
            ></i>

            Kabezya
          </button>


          <button
            type="button"
            class="teacher-primary-button"
            data-teacher-assignment-action="edit"
            data-assignment-id="${escapeHtml(
              assignmentId
            )}"
          >
            <i
              class="fa-solid fa-pen"
            ></i>

            Edit
          </button>

        </div>

      </header>


      <div
        class="teacher-selected-assignment-metrics"
      >

        <article>
          <span>
            Expected
          </span>

          <strong>
            ${expected}
          </strong>
        </article>


        <article>
          <span>
            Submitted
          </span>

          <strong>
            ${submissions.length}
          </strong>
        </article>


        <article>
          <span>
            Waiting review
          </span>

          <strong>
            ${pending.length}
          </strong>
        </article>


        <article>
          <span>
            Reviewed
          </span>

          <strong>
            ${reviewed.length}
          </strong>
        </article>


        <article>
          <span>
            Completion
          </span>

          <strong>
            ${completion}%
          </strong>
        </article>

      </div>


      <div
        class="teacher-selected-assignment-grid"
      >

        <section
          class="teacher-selected-assignment-section"
        >

          <div
            class="teacher-selected-section-head"
          >
            <div>
              <h3>
                Instructions
              </h3>

              <p>
                Assignment information shared with students.
              </p>
            </div>
          </div>


          <div
            class="teacher-assignment-instructions"
          >
            ${
              escapeHtml(
                assignment?.instructions ||
                assignment?.description ||
                "No instructions were added."
              )
                .replace(
                  /\n/g,
                  "<br>"
                )
            }
          </div>


          ${
            assignment?.attachmentUrl
              ? `
                <a
                  class="teacher-assignment-attachment"
                  href="${escapeHtml(
                    assignment.attachmentUrl
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i
                    class="fa-solid fa-paperclip"
                  ></i>

                  Open attachment
                </a>
              `
              : ""
          }

        </section>


        <section
          class="teacher-selected-assignment-section"
        >

          <div
            class="teacher-selected-section-head"
          >
            <div>
              <h3>
                Submission activity
              </h3>

              <p>
                Student work received for this assignment.
              </p>
            </div>
          </div>


          <div
            class="teacher-assignment-submission-list"
          >

            ${
              submissions.length
                ? [
                    ...submissions
                  ]
                    .sort(
                      (
                        first,
                        second
                      ) =>
                        new Date(
                          second?.submittedAt ||
                          second?.createdAt ||
                          0
                        ).getTime() -
                        new Date(
                          first?.submittedAt ||
                          first?.createdAt ||
                          0
                        ).getTime()
                    )
                    .map(
                      submission => {

                        const student =
                          getTeacherSubmissionStudent(
                            submission
                          );


                        const status =
                          normalizeSubmissionStatus(
                            submission?.status
                          );


                        return `
                          <button
                            type="button"
                            class="teacher-assignment-submission-row"
                            data-teacher-submission-action="review"
                            data-submission-id="${escapeHtml(
                              normalizeId(
                                submission?._id ||
                                submission?.id
                              )
                            )}"
                          >

                            <img
                              src="${escapeHtml(
                                getTeacherStudentAvatar(
                                  student
                                )
                              )}"
                              alt="${escapeHtml(
                                getTeacherDisplayName(
                                  student
                                )
                              )}"
                            />

                            <span
                              class="teacher-assignment-submission-main"
                            >

                              <strong>
                                ${escapeHtml(
                                  getTeacherDisplayName(
                                    student
                                  )
                                )}
                              </strong>

                              <small>
                                ${escapeHtml(
                                  formatTeacherRelativeTime(
                                    submission?.submittedAt ||
                                    submission?.createdAt
                                  )
                                )}
                              </small>

                            </span>


                            <span
                              class="
                                teacher-submission-status
                                is-${escapeHtml(
                                  status
                                )}
                              "
                            >
                              ${escapeHtml(
                                status
                              )}
                            </span>


                            <i
                              class="fa-solid fa-chevron-right"
                            ></i>

                          </button>
                        `;

                      }
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      No student submissions have
                      been received yet.
                    </div>
                  `
            }

          </div>

        </section>

      </div>

    </section>
  `;

}


/* =========================================================
   ASSIGNMENT EDITOR
========================================================= */

function renderTeacherAssignmentEditor(
  assignment = null
){

  const container =
    getTeacherOverviewElement(
      "teacherAssignmentEditor",
      "assignmentEditorWorkspace"
    );


  if (
    !container
  ){
    return;
  }


  const editing =
    Boolean(
      assignment
    );


  const classes =
    getTeacherClasses();


  const selectedClassId =
    normalizeId(
      assignment?.classId?._id ||
      assignment?.classId ||
      state.selectedClassId ||
      teacherAssignmentWorkspaceState
        .classId !== "all"
        ? teacherAssignmentWorkspaceState
            .classId
        : ""
    );


  const status =
    normalizeAssignmentStatus(
      assignment?.status ||
      "draft"
    );


  const dueDate =
    getTeacherAssignmentDueDate(
      assignment
    );


  const dueInputValue =
    dueDate
      ? new Date(
          dueDate
        )
          .toISOString()
          .slice(
            0,
            16
          )
      : "";


  container.hidden =
    false;


  container.innerHTML = `
    <section
      class="teacher-assignment-editor-panel"
    >

      <header
        class="teacher-assignment-editor-header"
      >

        <div>

          <span>
            ${
              editing
                ? "Edit assignment"
                : "New assignment"
            }
          </span>

          <h2>
            ${
              editing
                ? escapeHtml(
                    getTeacherAssignmentTitle(
                      assignment
                    )
                  )
                : "Create assignment"
            }
          </h2>

        </div>


        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-assignment-action="close-editor"
          aria-label="Close editor"
        >
          <i
            class="fa-solid fa-xmark"
          ></i>
        </button>

      </header>


      <form
        id="teacherAssignmentForm"
        class="teacher-assignment-form"
      >

        <input
          type="hidden"
          id="teacherAssignmentId"
          value="${escapeHtml(
            normalizeId(
              assignment?._id ||
              assignment?.id
            )
          )}"
        />


        <label
          class="teacher-form-field"
        >
          <span>
            Class
          </span>

          <select
            id="teacherAssignmentClassId"
            required
          >

            <option value="">
              Select class
            </option>

            ${
              classes
                .map(
                  classItem => {

                    const classId =
                      normalizeId(
                        classItem?._id ||
                        classItem?.id
                      );


                    return `
                      <option
                        value="${escapeHtml(
                          classId
                        )}"
                        ${
                          sameId(
                            classId,
                            selectedClassId
                          )
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          getTeacherClassTitle(
                            classItem
                          )
                        )}
                      </option>
                    `;

                  }
                )
                .join(
                  ""
                )
            }

          </select>
        </label>


        <label
          class="teacher-form-field"
        >
          <span>
            Assignment title
          </span>

          <input
            id="teacherAssignmentTitle"
            type="text"
            maxlength="160"
            required
            placeholder="Enter assignment title"
            value="${escapeHtml(
              assignment?.title ||
              ""
            )}"
          />
        </label>


        <label
          class="teacher-form-field"
        >
          <span>
            Instructions
          </span>

          <textarea
            id="teacherAssignmentInstructions"
            rows="8"
            placeholder="Explain what students need to complete..."
          >${escapeHtml(
            assignment?.instructions ||
            assignment?.description ||
            ""
          )}</textarea>
        </label>


        <div
          class="teacher-form-grid"
        >

          <label
            class="teacher-form-field"
          >
            <span>
              Due date
            </span>

            <input
              id="teacherAssignmentDueDate"
              type="datetime-local"
              value="${escapeHtml(
                dueInputValue
              )}"
            />
          </label>


          <label
            class="teacher-form-field"
          >
            <span>
              Status
            </span>

            <select
              id="teacherAssignmentStatus"
            >
              <option
                value="draft"
                ${
                  status ===
                  "draft"
                    ? "selected"
                    : ""
                }
              >
                Draft
              </option>

              <option
                value="published"
                ${
                  [
                    "published",
                    "active"
                  ].includes(
                    status
                  )
                    ? "selected"
                    : ""
                }
              >
                Published
              </option>

              <option
                value="closed"
                ${
                  status ===
                  "closed"
                    ? "selected"
                    : ""
                }
              >
                Closed
              </option>
            </select>
          </label>

        </div>


        <label
          class="teacher-form-field"
        >
          <span>
            Attachment URL
          </span>

          <input
            id="teacherAssignmentAttachmentUrl"
            type="url"
            placeholder="https://..."
            value="${escapeHtml(
              assignment?.attachmentUrl ||
              ""
            )}"
          />
        </label>


        <div
          class="teacher-assignment-editor-actions"
        >

          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-assignment-action="close-editor"
          >
            Cancel
          </button>


          <button
            type="submit"
            class="teacher-primary-button"
            id="teacherAssignmentSaveButton"
          >
            <i
              class="fa-solid fa-floppy-disk"
            ></i>

            ${
              editing
                ? "Save changes"
                : "Create assignment"
            }
          </button>

        </div>

      </form>

    </section>
  `;


  teacherAssignmentWorkspaceState
    .editingAssignmentId =
      normalizeId(
        assignment?._id ||
        assignment?.id
      ) ||
      null;


  bindTeacherAssignmentForm();

}


/* =========================================================
   CLOSE ASSIGNMENT EDITOR
========================================================= */

function closeTeacherAssignmentEditor(){

  teacherAssignmentWorkspaceState
    .editingAssignmentId =
      null;


  const container =
    getTeacherOverviewElement(
      "teacherAssignmentEditor",
      "assignmentEditorWorkspace"
    );


  if (
    container
  ){

    container.hidden =
      true;

    container.innerHTML =
      "";

  }

}


/* =========================================================
   ASSIGNMENT FORM PAYLOAD
========================================================= */

function getTeacherAssignmentFormPayload(){

  const classId =
    String(
      $(
        "teacherAssignmentClassId"
      )?.value ||
      ""
    ).trim();


  const title =
    String(
      $(
        "teacherAssignmentTitle"
      )?.value ||
      ""
    ).trim();


  const instructions =
    String(
      $(
        "teacherAssignmentInstructions"
      )?.value ||
      ""
    ).trim();


  const dueDate =
    String(
      $(
        "teacherAssignmentDueDate"
      )?.value ||
      ""
    ).trim();


  const status =
    String(
      $(
        "teacherAssignmentStatus"
      )?.value ||
      "draft"
    ).trim();


  const attachmentUrl =
    String(
      $(
        "teacherAssignmentAttachmentUrl"
      )?.value ||
      ""
    ).trim();


  return {

    classId,

    teacherId:
      getTeacherId(),

    schoolId:
      getSchoolId(),

    title,

    instructions,

    description:
      instructions,

    dueDate:
      dueDate
        ? new Date(
            dueDate
          ).toISOString()
        : null,

    attachmentUrl:
      attachmentUrl ||
      null,

    status

  };

}


/* =========================================================
   SAVE ASSIGNMENT
========================================================= */

async function saveTeacherAssignment(){

  if (
    teacherAssignmentWorkspaceState.saving
  ){
    return;
  }


  const payload =
    getTeacherAssignmentFormPayload();


  if (
    !payload.classId
  ){

    showAlert(
      "error",
      "Please select a class."
    );


    return;
  }


  if (
    !payload.title
  ){

    showAlert(
      "error",
      "Assignment title is required."
    );


    return;
  }


  /*
    Confirm the selected class belongs to this teacher.
  */

  if (
    !getTeacherClassById(
      payload.classId
    )
  ){

    showAlert(
      "error",
      "You do not have access to the selected class."
    );


    return;
  }


  const saveButton =
    $(
      "teacherAssignmentSaveButton"
    );


  teacherAssignmentWorkspaceState
    .saving =
      true;


  if (
    saveButton
  ){

    saveButton.disabled =
      true;

    saveButton.innerHTML = `
      <i
        class="fa-solid fa-spinner fa-spin"
      ></i>

      Saving...
    `;

  }


  try{

    const assignmentId =
      teacherAssignmentWorkspaceState
        .editingAssignmentId;


    let savedAssignment =
      null;


    if (
      assignmentId
    ){

      savedAssignment =
        await apiSend(
          `/api/assignments/${
            encodeURIComponent(
              assignmentId
            )
          }`,
          "PATCH",
          payload
        );

    }else{

      savedAssignment =
        await apiSend(
          "/api/assignments",
          "POST",
          payload
        );

    }


    const normalizedAssignment =
      savedAssignment?.assignment ||
      savedAssignment?.data ||
      savedAssignment;


    if (
      normalizedAssignment?._id
    ){

      const existingIndex =
        state.assignments
          .findIndex(
            assignment =>
              sameId(
                assignment?._id ||
                assignment?.id,
                normalizedAssignment._id
              )
          );


      if (
        existingIndex >=
        0
      ){

        state.assignments[
          existingIndex
        ] =
          normalizedAssignment;

      }else{

        state.assignments.unshift(
          normalizedAssignment
        );

      }

    }else{

      /*
        If the endpoint returns only a success message,
        refresh assignments from the backend.
      */

      await loadTeacherAssignments();

    }


    hydrateTeacherClassDataCache();

    calculateTeacherMetrics();


    closeTeacherAssignmentEditor();


    renderTeacherAssignmentsWorkspace();


    renderTeacherDashboardStats();


    showAlert(
      "success",
      assignmentId
        ? "Assignment updated successfully."
        : "Assignment created successfully.",
      {
        title:
          assignmentId
            ? "Assignment updated"
            : "Assignment created"
      }
    );

  }catch(
    error
  ){

    console.error(
      "saveTeacherAssignment failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save the assignment."
    );

  }finally{

    teacherAssignmentWorkspaceState
      .saving =
        false;


    if (
      saveButton
    ){

      saveButton.disabled =
        false;

      saveButton.innerHTML = `
        <i
          class="fa-solid fa-floppy-disk"
        ></i>

        Save assignment
      `;

    }

  }

}


/* =========================================================
   BIND ASSIGNMENT FORM
========================================================= */

function bindTeacherAssignmentForm(){

  const form =
    $(
      "teacherAssignmentForm"
    );


  if (
    !form ||
    form.dataset.bound ===
      "true"
  ){
    return;
  }


  form.dataset.bound =
    "true";


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      saveTeacherAssignment();

    }
  );

}


/* =========================================================
   CLOSE SELECTED ASSIGNMENT
========================================================= */

function closeTeacherSelectedAssignment(){

  teacherAssignmentWorkspaceState
    .selectedAssignmentId =
      null;


  state.selectedAssignmentId =
    null;


  const container =
    getTeacherOverviewElement(
      "teacherSelectedAssignment",
      "selectedAssignmentWorkspace",
      "teacherAssignmentDetail"
    );


  if (
    container
  ){

    container.hidden =
      true;

    container.innerHTML =
      "";

  }

}


/* =========================================================
   RENDER ASSIGNMENT WORKSPACE
========================================================= */

function renderTeacherAssignmentsWorkspace(){

  if (
    state.selectedClassId &&
    teacherAssignmentWorkspaceState.classId ===
      "all"
  ){

    teacherAssignmentWorkspaceState.classId =
      normalizeId(
        state.selectedClassId
      ) ||
      "all";

  }


  renderTeacherAssignmentsHeader();

  renderTeacherAssignmentsSummary();

  renderTeacherAssignmentsToolbar();

  renderTeacherAssignmentsGrid();


  if (
    teacherAssignmentWorkspaceState
      .selectedAssignmentId
  ){

    renderTeacherSelectedAssignment(
      teacherAssignmentWorkspaceState
        .selectedAssignmentId
    );

  }

}


/* =========================================================
   COMPATIBILITY ASSIGNMENT RENDERER
========================================================= */

function renderAssignments(){

  renderTeacherAssignmentsWorkspace();

}


/* =========================================================
   ASSIGNMENT CONTROLS
========================================================= */

let teacherAssignmentControlsBound =
  false;


function bindStudentAssignmentControls(){

  if (
    teacherAssignmentControlsBound
  ){
    return;
  }


  teacherAssignmentControlsBound =
    true;


  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id ===
        "teacherAssignmentSearch"
      ){

        teacherAssignmentWorkspaceState
          .search =
            event.target.value ||
            "";


        renderTeacherAssignmentsGrid();

      }

    }
  );


  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherAssignmentClassFilter"
      ){

        teacherAssignmentWorkspaceState
          .classId =
            event.target.value ||
            "all";


        renderTeacherAssignmentsGrid();


        return;

      }


      if (
        event.target?.id ===
        "teacherAssignmentStatusFilter"
      ){

        teacherAssignmentWorkspaceState
          .status =
            event.target.value ||
            "all";


        renderTeacherAssignmentsGrid();


        return;

      }


      if (
        event.target?.id ===
        "teacherAssignmentSort"
      ){

        teacherAssignmentWorkspaceState
          .sort =
            event.target.value ||
            "due";


        renderTeacherAssignmentsGrid();

      }

    }
  );


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-assignment-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherAssignmentAction ||
          ""
        )
          .trim()
          .toLowerCase();


      const assignmentId =
        normalizeId(
          button.dataset
            .assignmentId
        );


      switch(
        action
      ){

        case "create":

          renderTeacherAssignmentEditor(
            null
          );

          break;


        case "edit":

          renderTeacherAssignmentEditor(
            getTeacherAssignmentById(
              assignmentId
            )
          );

          break;


        case "open":

          teacherAssignmentWorkspaceState
            .selectedAssignmentId =
              assignmentId;


          state.selectedAssignmentId =
            assignmentId;


          renderTeacherSelectedAssignment(
            assignmentId
          );


          window.requestAnimationFrame(
            () => {

              const detail =
                getTeacherOverviewElement(
                  "teacherSelectedAssignment",
                  "selectedAssignmentWorkspace",
                  "teacherAssignmentDetail"
                );


              detail?.scrollIntoView({
                behavior:
                  "smooth",

                block:
                  "start"
              });

            }
          );


          break;


        case "close":

          closeTeacherSelectedAssignment();

          break;


        case "close-editor":

          closeTeacherAssignmentEditor();

          break;

      }

    }
  );


  /* =======================================================
     KABEZYA ASSIGNMENT INSPECTION
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-kabezya-assignment-inspect]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const assignmentId =
        normalizeId(
          button.dataset
            .kabezyaAssignmentInspect
        );


      state.kabezya.assignmentId =
        assignmentId;


      state.selectedAssignmentId =
        assignmentId;


      activateStudentStudioPage(
        "ai"
      );

    }
  );

}


/* =========================================================
   INITIALIZE ASSIGNMENTS
========================================================= */

function initializeTeacherAssignmentsWorkspace(){

  bindStudentAssignmentControls();


  if (
    state.me
  ){

    renderTeacherAssignmentsWorkspace();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 8
   QUIZZES + QUESTION BANK
========================================================= */


/* =========================================================
   QUIZ WORKSPACE STATE
========================================================= */

const teacherQuizWorkspaceState = {

  search:
    "",

  classId:
    "all",

  status:
    "all",

  sort:
    "recent",

  view:
    "quizzes",

  selectedQuizId:
    null,

  editingQuizId:
    null,

  saving:
    false,

  questionBank:
    [],

  questionBankLoaded:
    false,

  questionBankLoading:
    false,

  selectedQuestionIds:
    []

};


/* =========================================================
   QUIZ LOOKUP
========================================================= */

function getTeacherQuizById(
  quizId
){

  const normalizedId =
    normalizeId(
      quizId
    );


  if (
    !normalizedId
  ){
    return null;
  }


  return (
    asArray(
      state.quizzes
    )
      .find(
        quiz =>
          sameId(
            quiz?._id ||
            quiz?.id,
            normalizedId
          )
      ) ||
    null
  );

}


/* =========================================================
   QUIZ CLASS
========================================================= */

function getTeacherQuizClass(
  quiz
){

  const classValue =
    quiz?.classId;


  if (
    classValue &&
    typeof classValue ===
      "object"
  ){

    return classValue;

  }


  return (
    getTeacherClassById(
      classValue
    ) ||
    null
  );

}


/* =========================================================
   QUIZ TITLE
========================================================= */

function getTeacherQuizTitle(
  quiz
){

  return String(
    quiz?.title ||
    quiz?.name ||
    "Untitled quiz"
  ).trim();

}


/* =========================================================
   QUIZ STATUS
========================================================= */

function getTeacherQuizStatus(
  quiz
){

  const status =
    String(
      quiz?.status ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    [
      "published",
      "active",
      "open"
    ].includes(
      status
    )
  ){

    return "published";

  }


  if (
    [
      "draft",
      "pending"
    ].includes(
      status
    )
  ){

    return "draft";

  }


  if (
    [
      "closed",
      "completed"
    ].includes(
      status
    )
  ){

    return "closed";

  }


  return status ||
    "draft";

}


/* =========================================================
   QUIZ STATUS LABEL
========================================================= */

function getTeacherQuizStatusLabel(
  quiz
){

  const status =
    getTeacherQuizStatus(
      quiz
    );


  switch(
    status
  ){

    case "published":
      return "Published";

    case "draft":
      return "Draft";

    case "closed":
      return "Closed";

    default:

      return (
        status.charAt(
          0
        ).toUpperCase() +
        status.slice(
          1
        )
      );

  }

}


/* =========================================================
   QUIZ QUESTIONS
========================================================= */

function getTeacherQuizQuestions(
  quiz
){

  return asArray(
    quiz?.questions
  );

}


/* =========================================================
   QUIZ QUESTION COUNT
========================================================= */

function getTeacherQuizQuestionCount(
  quiz
){

  return getTeacherQuizQuestions(
    quiz
  ).length;

}


/* =========================================================
   QUIZ TOTAL POINTS
========================================================= */

function getTeacherQuizTotalPoints(
  quiz
){

  const questions =
    getTeacherQuizQuestions(
      quiz
    );


  if (
    questions.length
  ){

    return questions.reduce(
      (
        total,
        question
      ) =>
        total +
        safeNumber(
          question?.points,
          1
        ),
      0
    );

  }


  return safeNumber(
    quiz?.totalPoints ||
    quiz?.points,
    0
  );

}


/* =========================================================
   QUIZ SUBMISSIONS
========================================================= */

function getTeacherQuizSubmissions(
  quizId
){

  const normalizedId =
    normalizeId(
      quizId
    );


  return asArray(
    state.quizSubmissions
  )
    .filter(
      submission =>
        sameId(
          submission?.quizId?._id ||
          submission?.quizId,
          normalizedId
        )
    );

}


/* =========================================================
   QUIZ COMPLETION RATE
========================================================= */

function getTeacherQuizCompletionRate(
  quiz
){

  const classItem =
    getTeacherQuizClass(
      quiz
    );


  const expected =
    classItem
      ? getTeacherClassStudentCount(
          classItem
        )
      : 0;


  if (
    !expected
  ){
    return 0;
  }


  const submissions =
    getTeacherQuizSubmissions(
      quiz?._id ||
      quiz?.id
    ).length;


  return clampPercentage(
    (
      submissions /
      expected
    ) *
    100
  );

}


/* =========================================================
   QUIZ AVERAGE SCORE
========================================================= */

function getTeacherQuizAverageScore(
  quiz
){

  const submissions =
    getTeacherQuizSubmissions(
      quiz?._id ||
      quiz?.id
    );


  if (
    !submissions.length
  ){
    return 0;
  }


  const scores =
    submissions
      .map(
        submission => {

          const score =
            safeNumber(
              submission?.percentage ??
              submission?.percentageScore ??
              submission?.scorePercent,
              NaN
            );


          if (
            Number.isFinite(
              score
            )
          ){
            return score;
          }


          const rawScore =
            safeNumber(
              submission?.score,
              NaN
            );


          const total =
            safeNumber(
              submission?.totalPoints ||
              getTeacherQuizTotalPoints(
                quiz
              ),
              0
            );


          if (
            Number.isFinite(
              rawScore
            ) &&
            total > 0
          ){

            return (
              rawScore /
              total
            ) *
            100;

          }


          return null;

        }
      )
      .filter(
        value =>
          Number.isFinite(
            value
          )
      );


  if (
    !scores.length
  ){
    return 0;
  }


  return clampPercentage(
    scores.reduce(
      (
        total,
        value
      ) =>
        total +
        value,
      0
    ) /
    scores.length
  );

}


/* =========================================================
   FILTER QUIZZES
========================================================= */

function getFilteredTeacherQuizzes(){

  const search =
    String(
      teacherQuizWorkspaceState.search ||
      ""
    )
      .trim()
      .toLowerCase();


  const classId =
    String(
      teacherQuizWorkspaceState.classId ||
      "all"
    );


  const status =
    String(
      teacherQuizWorkspaceState.status ||
      "all"
    );


  let quizzes =
    [
      ...asArray(
        state.quizzes
      )
    ];


  if (
    search
  ){

    quizzes =
      quizzes.filter(
        quiz => {

          const classItem =
            getTeacherQuizClass(
              quiz
            );


          const haystack =
            [
              getTeacherQuizTitle(
                quiz
              ),

              quiz?.description,

              quiz?.instructions,

              getTeacherClassTitle(
                classItem
              )
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  if (
    classId !==
    "all"
  ){

    quizzes =
      quizzes.filter(
        quiz =>
          sameId(
            quiz?.classId?._id ||
            quiz?.classId,
            classId
          )
      );

  }


  if (
    status !==
    "all"
  ){

    quizzes =
      quizzes.filter(
        quiz =>
          getTeacherQuizStatus(
            quiz
          ) ===
          status
      );

  }


  switch(
    teacherQuizWorkspaceState.sort
  ){

    case "name":

      quizzes.sort(
        (
          first,
          second
        ) =>
          getTeacherQuizTitle(
            first
          )
            .localeCompare(
              getTeacherQuizTitle(
                second
              )
            )
      );

      break;


    case "questions":

      quizzes.sort(
        (
          first,
          second
        ) =>
          getTeacherQuizQuestionCount(
            second
          ) -
          getTeacherQuizQuestionCount(
            first
          )
      );

      break;


    case "completion":

      quizzes.sort(
        (
          first,
          second
        ) =>
          getTeacherQuizCompletionRate(
            second
          ) -
          getTeacherQuizCompletionRate(
            first
          )
      );

      break;


    case "score":

      quizzes.sort(
        (
          first,
          second
        ) =>
          getTeacherQuizAverageScore(
            second
          ) -
          getTeacherQuizAverageScore(
            first
          )
      );

      break;


    case "recent":
    default:

      quizzes.sort(
        (
          first,
          second
        ) =>
          new Date(
            second?.updatedAt ||
            second?.createdAt ||
            0
          ).getTime() -
          new Date(
            first?.updatedAt ||
            first?.createdAt ||
            0
          ).getTime()
      );

      break;

  }


  return quizzes;

}


/* =========================================================
   LOAD QUESTION BANK
========================================================= */

async function loadTeacherQuestionBank(
  force = false
){

  if (
    teacherQuizWorkspaceState
      .questionBankLoading
  ){
    return;
  }


  if (
    teacherQuizWorkspaceState
      .questionBankLoaded &&
    !force
  ){
    return;
  }


  const schoolId =
    getSchoolId();


  if (
    !schoolId
  ){

    teacherQuizWorkspaceState
      .questionBank =
        [];


    return;

  }


  teacherQuizWorkspaceState
    .questionBankLoading =
      true;


  try{

    const response =
      await apiGet(
        `/api/question-bank?schoolId=${
          encodeURIComponent(
            schoolId
          )
        }&archived=false`,
        []
      );


    teacherQuizWorkspaceState
      .questionBank =
        asArray(
          response
        );


    teacherQuizWorkspaceState
      .questionBankLoaded =
        true;

  }catch(
    error
  ){

    console.warn(
      "Question bank failed to load:",
      error
    );


    teacherQuizWorkspaceState
      .questionBank =
        [];

  }finally{

    teacherQuizWorkspaceState
      .questionBankLoading =
        false;

  }

}


/* =========================================================
   QUESTION BANK ITEM BY ID
========================================================= */

function getTeacherQuestionBankItem(
  questionId
){

  return (
    teacherQuizWorkspaceState
      .questionBank
      .find(
        question =>
          sameId(
            question?._id ||
            question?.id,
            questionId
          )
      ) ||
    null
  );

}


/* =========================================================
   QUIZ HEADER
========================================================= */

function renderTeacherQuizzesHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherQuizzesHeader",
      "quizzesWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Quizzes
        </h1>

        <p>
          Create assessments, manage your
          question bank and review student
          quiz performance.
        </p>

      </div>


      <div
        class="teacher-workspace-heading-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-quiz-action="question-bank"
        >
          <i
            class="fa-solid fa-database"
          ></i>

          Question bank
        </button>


        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-quiz-action="kabezya-generate"
        >
          <i
            class="fa-solid fa-wand-magic-sparkles"
          ></i>

          Generate with Kabezya
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-quiz-action="create"
        >
          <i
            class="fa-solid fa-plus"
          ></i>

          Create quiz
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   QUIZ SUMMARY
========================================================= */

function renderTeacherQuizzesSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherQuizzesSummary",
      "quizzesWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const quizzes =
    asArray(
      state.quizzes
    );


  const published =
    quizzes.filter(
      quiz =>
        getTeacherQuizStatus(
          quiz
        ) ===
        "published"
    ).length;


  const submissions =
    asArray(
      state.quizSubmissions
    ).length;


  const quizzesWithResults =
    quizzes.filter(
      quiz =>
        getTeacherQuizSubmissions(
          quiz?._id ||
          quiz?.id
        ).length
    );


  const averageScore =
    quizzesWithResults.length
      ? Math.round(
          quizzesWithResults.reduce(
            (
              total,
              quiz
            ) =>
              total +
              getTeacherQuizAverageScore(
                quiz
              ),
            0
          ) /
          quizzesWithResults.length
        )
      : 0;


  container.innerHTML = `

    <div
      class="teacher-quiz-summary-card"
    >
      <i
        class="fa-solid fa-list-check"
      ></i>

      <span>
        <strong>
          ${quizzes.length}
        </strong>

        <small>
          Quizzes
        </small>
      </span>
    </div>


    <div
      class="teacher-quiz-summary-card"
    >
      <i
        class="fa-solid fa-circle-play"
      ></i>

      <span>
        <strong>
          ${published}
        </strong>

        <small>
          Published
        </small>
      </span>
    </div>


    <div
      class="teacher-quiz-summary-card"
    >
      <i
        class="fa-solid fa-file-circle-check"
      ></i>

      <span>
        <strong>
          ${submissions}
        </strong>

        <small>
          Attempts
        </small>
      </span>
    </div>


    <div
      class="teacher-quiz-summary-card"
    >
      <i
        class="fa-solid fa-chart-line"
      ></i>

      <span>
        <strong>
          ${averageScore}%
        </strong>

        <small>
          Average score
        </small>
      </span>
    </div>

  `;

}


/* =========================================================
   QUIZ WORKSPACE TABS
========================================================= */

function renderTeacherQuizWorkspaceTabs(){

  const container =
    getTeacherOverviewElement(
      "teacherQuizTabs",
      "quizzesWorkspaceTabs"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `

    <button
      type="button"
      class="${
        teacherQuizWorkspaceState.view ===
        "quizzes"
          ? "active"
          : ""
      }"
      data-teacher-quiz-tab="quizzes"
    >
      Quizzes
    </button>


    <button
      type="button"
      class="${
        teacherQuizWorkspaceState.view ===
        "question-bank"
          ? "active"
          : ""
      }"
      data-teacher-quiz-tab="question-bank"
    >
      Question bank
    </button>

  `;

}


/* =========================================================
   QUIZ TOOLBAR
========================================================= */

function renderTeacherQuizzesToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherQuizzesToolbar",
      "quizzesWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  container.innerHTML = `

    <div
      class="teacher-quiz-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
      ></i>

      <input
        id="teacherQuizSearch"
        type="search"
        placeholder="Search quizzes..."
        value="${escapeHtml(
          teacherQuizWorkspaceState.search
        )}"
      />

    </div>


    <select
      id="teacherQuizClassFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All classes
      </option>

      ${
        classes
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    classId
                  )}"
                  ${
                    sameId(
                      teacherQuizWorkspaceState.classId,
                      classId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <select
      id="teacherQuizStatusFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All statuses
      </option>

      <option
        value="draft"
        ${
          teacherQuizWorkspaceState.status ===
          "draft"
            ? "selected"
            : ""
        }
      >
        Draft
      </option>

      <option
        value="published"
        ${
          teacherQuizWorkspaceState.status ===
          "published"
            ? "selected"
            : ""
        }
      >
        Published
      </option>

      <option
        value="closed"
        ${
          teacherQuizWorkspaceState.status ===
          "closed"
            ? "selected"
            : ""
        }
      >
        Closed
      </option>

    </select>


    <select
      id="teacherQuizSort"
      class="teacher-workspace-select"
    >

      <option value="recent">
        Recently updated
      </option>

      <option value="name">
        Quiz name
      </option>

      <option value="questions">
        Most questions
      </option>

      <option value="completion">
        Completion rate
      </option>

      <option value="score">
        Average score
      </option>

    </select>

  `;

}


/* =========================================================
   CREATE QUIZ CARD
========================================================= */

function createTeacherQuizCard(
  quiz
){

  const quizId =
    normalizeId(
      quiz?._id ||
      quiz?.id
    );


  const classItem =
    getTeacherQuizClass(
      quiz
    );


  const status =
    getTeacherQuizStatus(
      quiz
    );


  const questions =
    getTeacherQuizQuestionCount(
      quiz
    );


  const points =
    getTeacherQuizTotalPoints(
      quiz
    );


  const submissions =
    getTeacherQuizSubmissions(
      quizId
    ).length;


  const completion =
    getTeacherQuizCompletionRate(
      quiz
    );


  const averageScore =
    getTeacherQuizAverageScore(
      quiz
    );


  return `
    <article
      class="teacher-quiz-card"
      data-quiz-id="${escapeHtml(
        quizId
      )}"
    >

      <div
        class="teacher-quiz-card-head"
      >

        <span
          class="
            teacher-quiz-status
            is-${escapeHtml(
              status
            )}
          "
        >
          ${escapeHtml(
            getTeacherQuizStatusLabel(
              quiz
            )
          )}
        </span>


        <button
          type="button"
          class="teacher-quiz-more"
          data-teacher-quiz-menu="${escapeHtml(
            quizId
          )}"
          aria-label="Quiz options"
        >
          <i
            class="fa-solid fa-ellipsis"
          ></i>
        </button>

      </div>


      <div
        class="teacher-quiz-card-main"
      >

        <div
          class="teacher-quiz-card-icon"
        >
          <i
            class="fa-solid fa-list-check"
          ></i>
        </div>

        <div>

          <h3>
            ${escapeHtml(
              getTeacherQuizTitle(
                quiz
              )
            )}
          </h3>

          <p>
            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </p>

        </div>

      </div>


      <div
        class="teacher-quiz-card-info"
      >

        <span>
          <strong>
            ${questions}
          </strong>

          questions
        </span>

        <span>
          <strong>
            ${points}
          </strong>

          points
        </span>

        <span>
          <strong>
            ${submissions}
          </strong>

          attempts
        </span>

      </div>


      <div
        class="teacher-quiz-result-grid"
      >

        <div>
          <span>
            Completion
          </span>

          <strong>
            ${completion}%
          </strong>
        </div>


        <div>
          <span>
            Avg. score
          </span>

          <strong>
            ${averageScore}%
          </strong>
        </div>

      </div>


      <div
        class="teacher-quiz-card-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-quiz-action="edit"
          data-quiz-id="${escapeHtml(
            quizId
          )}"
        >
          <i
            class="fa-solid fa-pen"
          ></i>

          Edit
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-quiz-action="open"
          data-quiz-id="${escapeHtml(
            quizId
          )}"
        >
          Results

          <i
            class="fa-solid fa-arrow-right"
          ></i>
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   QUIZ GRID
========================================================= */

function renderTeacherQuizzesGrid(){

  const container =
    getTeacherOverviewElement(
      "teacherQuizzesGrid",
      "quizzesWorkspaceGrid",
      "teacherQuizList"
    );


  if (
    !container
  ){
    return;
  }


  const quizzes =
    getFilteredTeacherQuizzes();


  if (
    !quizzes.length
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-solid fa-list-check"
          ></i>
        </div>

        <h3>
          No quizzes found
        </h3>

        <p>
          ${
            state.quizzes.length
              ? `
                Try changing your search
                or filters.
              `
              : `
                Create a quiz manually or ask
                Kabezya to help prepare one.
              `
          }
        </p>

        <div
          class="teacher-empty-actions"
        >

          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-quiz-action="kabezya-generate"
          >
            <i
              class="fa-solid fa-wand-magic-sparkles"
            ></i>

            Ask Kabezya
          </button>


          <button
            type="button"
            class="teacher-primary-button"
            data-teacher-quiz-action="create"
          >
            <i
              class="fa-solid fa-plus"
            ></i>

            Create quiz
          </button>

        </div>

      </div>
    `;


    return;

  }


  container.innerHTML =
    quizzes
      .map(
        createTeacherQuizCard
      )
      .join(
        ""
      );

}


/* =========================================================
   SELECTED QUIZ
========================================================= */

function renderTeacherSelectedQuiz(
  quizId
){

  const container =
    getTeacherOverviewElement(
      "teacherSelectedQuiz",
      "selectedQuizWorkspace",
      "teacherQuizDetail"
    );


  if (
    !container
  ){
    return;
  }


  const quiz =
    getTeacherQuizById(
      quizId
    );


  if (
    !quiz
  ){

    container.hidden =
      true;

    container.innerHTML =
      "";

    return;
  }


  container.hidden =
    false;


  teacherQuizWorkspaceState
    .selectedQuizId =
      normalizeId(
        quizId
      );


  state.selectedQuizId =
    teacherQuizWorkspaceState
      .selectedQuizId;


  const submissions =
    getTeacherQuizSubmissions(
      quizId
    );


  const classItem =
    getTeacherQuizClass(
      quiz
    );


  const questions =
    getTeacherQuizQuestions(
      quiz
    );


  container.innerHTML = `
    <section
      class="teacher-selected-quiz-panel"
    >

      <header
        class="teacher-selected-quiz-header"
      >

        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-quiz-action="close"
          aria-label="Back to quizzes"
        >
          <i
            class="fa-solid fa-arrow-left"
          ></i>
        </button>


        <div
          class="teacher-selected-quiz-heading"
        >

          <span>
            Quiz results
          </span>

          <h2>
            ${escapeHtml(
              getTeacherQuizTitle(
                quiz
              )
            )}
          </h2>

          <p>
            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </p>

        </div>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-quiz-action="edit"
          data-quiz-id="${escapeHtml(
            quizId
          )}"
        >
          <i
            class="fa-solid fa-pen"
          ></i>

          Edit quiz
        </button>

      </header>


      <div
        class="teacher-selected-quiz-metrics"
      >

        <article>
          <span>
            Questions
          </span>

          <strong>
            ${questions.length}
          </strong>
        </article>


        <article>
          <span>
            Attempts
          </span>

          <strong>
            ${submissions.length}
          </strong>
        </article>


        <article>
          <span>
            Completion
          </span>

          <strong>
            ${getTeacherQuizCompletionRate(
              quiz
            )}%
          </strong>
        </article>


        <article>
          <span>
            Average score
          </span>

          <strong>
            ${getTeacherQuizAverageScore(
              quiz
            )}%
          </strong>
        </article>

      </div>


      <div
        class="teacher-selected-quiz-grid"
      >

        <section
          class="teacher-selected-quiz-section"
        >

          <div
            class="teacher-selected-section-head"
          >
            <div>
              <h3>
                Questions
              </h3>

              <p>
                Questions included in this quiz.
              </p>
            </div>
          </div>


          <div
            class="teacher-selected-quiz-question-list"
          >

            ${
              questions.length
                ? questions
                    .map(
                      (
                        question,
                        index
                      ) => `
                        <article
                          class="teacher-selected-quiz-question"
                        >

                          <span
                            class="teacher-selected-question-number"
                          >
                            ${index + 1}
                          </span>

                          <div>

                            <strong>
                              ${escapeHtml(
                                question?.question ||
                                question?.title ||
                                "Question"
                              )}
                            </strong>

                            <small>
                              ${escapeHtml(
                                question?.type ||
                                "question"
                              )}

                              ·

                              ${
                                safeNumber(
                                  question?.points,
                                  1
                                )
                              }

                              point${
                                safeNumber(
                                  question?.points,
                                  1
                                ) === 1
                                  ? ""
                                  : "s"
                              }
                            </small>

                          </div>

                        </article>
                      `
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      No quiz questions are available.
                    </div>
                  `
            }

          </div>

        </section>


        <section
          class="teacher-selected-quiz-section"
        >

          <div
            class="teacher-selected-section-head"
          >
            <div>
              <h3>
                Student attempts
              </h3>

              <p>
                Scores submitted by students.
              </p>
            </div>
          </div>


          <div
            class="teacher-quiz-attempt-list"
          >

            ${
              submissions.length
                ? submissions
                    .map(
                      submission => {

                        const student =
                          submission?.studentId &&
                          typeof submission.studentId ===
                            "object"
                            ? submission.studentId
                            : getTeacherStudentById(
                                submission?.studentId
                              );


                        const percentage =
                          safeNumber(
                            submission?.percentage ??
                            submission?.percentageScore ??
                            submission?.scorePercent,
                            0
                          );


                        return `
                          <article
                            class="teacher-quiz-attempt-row"
                          >

                            <img
                              src="${escapeHtml(
                                getTeacherStudentAvatar(
                                  student
                                )
                              )}"
                              alt="${escapeHtml(
                                getTeacherDisplayName(
                                  student
                                )
                              )}"
                            />

                            <span
                              class="teacher-quiz-attempt-student"
                            >

                              <strong>
                                ${escapeHtml(
                                  getTeacherDisplayName(
                                    student
                                  )
                                )}
                              </strong>

                              <small>
                                ${escapeHtml(
                                  formatTeacherRelativeTime(
                                    submission?.submittedAt ||
                                    submission?.createdAt
                                  )
                                )}
                              </small>

                            </span>

                            <strong
                              class="teacher-quiz-attempt-score"
                            >
                              ${Math.round(
                                percentage
                              )}%
                            </strong>

                          </article>
                        `;

                      }
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                    >
                      No quiz attempts have been
                      recorded yet.
                    </div>
                  `
            }

          </div>

        </section>

      </div>

    </section>
  `;

}


/* =========================================================
   QUIZ EDITOR
========================================================= */

function renderTeacherQuizEditor(
  quiz = null
){

  const container =
    getTeacherOverviewElement(
      "teacherQuizEditor",
      "quizEditorWorkspace"
    );


  if (
    !container
  ){
    return;
  }


  const editing =
    Boolean(
      quiz
    );


  const classes =
    getTeacherClasses();


  const quizClassId =
    normalizeId(
      quiz?.classId?._id ||
      quiz?.classId ||
      (
        teacherQuizWorkspaceState.classId !==
        "all"
          ? teacherQuizWorkspaceState.classId
          : state.selectedClassId
      )
    );


  const questions =
    getTeacherQuizQuestions(
      quiz
    );


  teacherQuizWorkspaceState
    .selectedQuestionIds =
      questions
        .map(
          question =>
            normalizeId(
              question?.questionBankId ||
              question?._id
            )
        )
        .filter(
          Boolean
        );


  teacherQuizWorkspaceState
    .editingQuizId =
      normalizeId(
        quiz?._id ||
        quiz?.id
      ) ||
      null;


  container.hidden =
    false;


  container.innerHTML = `
    <section
      class="teacher-quiz-editor-panel"
    >

      <header
        class="teacher-quiz-editor-header"
      >

        <div>
          <span>
            ${
              editing
                ? "Edit quiz"
                : "New quiz"
            }
          </span>

          <h2>
            ${
              editing
                ? escapeHtml(
                    getTeacherQuizTitle(
                      quiz
                    )
                  )
                : "Create quiz"
            }
          </h2>
        </div>


        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-quiz-action="close-editor"
        >
          <i
            class="fa-solid fa-xmark"
          ></i>
        </button>

      </header>


      <form
        id="teacherQuizForm"
        class="teacher-quiz-form"
      >

        <input
          type="hidden"
          id="teacherQuizId"
          value="${escapeHtml(
            normalizeId(
              quiz?._id ||
              quiz?.id
            )
          )}"
        />


        <label
          class="teacher-form-field"
        >
          <span>
            Class
          </span>

          <select
            id="teacherQuizClassId"
            required
          >

            <option value="">
              Select class
            </option>

            ${
              classes
                .map(
                  classItem => {

                    const classId =
                      normalizeId(
                        classItem?._id ||
                        classItem?.id
                      );


                    return `
                      <option
                        value="${escapeHtml(
                          classId
                        )}"
                        ${
                          sameId(
                            classId,
                            quizClassId
                          )
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          getTeacherClassTitle(
                            classItem
                          )
                        )}
                      </option>
                    `;

                  }
                )
                .join(
                  ""
                )
            }

          </select>
        </label>


        <label
          class="teacher-form-field"
        >
          <span>
            Quiz title
          </span>

          <input
            id="teacherQuizTitle"
            type="text"
            required
            maxlength="180"
            value="${escapeHtml(
              quiz?.title ||
              ""
            )}"
            placeholder="Enter quiz title"
          />
        </label>


        <label
          class="teacher-form-field"
        >
          <span>
            Description
          </span>

          <textarea
            id="teacherQuizDescription"
            rows="4"
            placeholder="Explain what this quiz covers..."
          >${escapeHtml(
            quiz?.description ||
            quiz?.instructions ||
            ""
          )}</textarea>
        </label>


        <div
          class="teacher-form-grid"
        >

          <label
            class="teacher-form-field"
          >
            <span>
              Time limit
            </span>

            <input
              id="teacherQuizTimeLimit"
              type="number"
              min="0"
              step="1"
              value="${escapeHtml(
                quiz?.timeLimit ||
                quiz?.durationMinutes ||
                ""
              )}"
              placeholder="Minutes"
            />
          </label>


          <label
            class="teacher-form-field"
          >
            <span>
              Status
            </span>

            <select
              id="teacherQuizStatus"
            >
              <option
                value="draft"
                ${
                  getTeacherQuizStatus(
                    quiz
                  ) ===
                  "draft"
                    ? "selected"
                    : ""
                }
              >
                Draft
              </option>

              <option
                value="published"
                ${
                  getTeacherQuizStatus(
                    quiz
                  ) ===
                  "published"
                    ? "selected"
                    : ""
                }
              >
                Published
              </option>

              <option
                value="closed"
                ${
                  getTeacherQuizStatus(
                    quiz
                  ) ===
                  "closed"
                    ? "selected"
                    : ""
                }
              >
                Closed
              </option>
            </select>
          </label>

        </div>


        <div
          class="teacher-quiz-editor-question-section"
        >

          <div
            class="teacher-selected-section-head"
          >

            <div>
              <h3>
                Questions
              </h3>

              <p>
                Add questions manually or select
                from the Question Bank.
              </p>
            </div>


            <div
              class="teacher-question-actions"
            >

              <button
                type="button"
                class="teacher-secondary-button"
                data-teacher-quiz-action="question-bank-picker"
              >
                <i
                  class="fa-solid fa-database"
                ></i>

                Question bank
              </button>


              <button
                type="button"
                class="teacher-secondary-button"
                data-teacher-quiz-action="add-question"
              >
                <i
                  class="fa-solid fa-plus"
                ></i>

                Add question
              </button>

            </div>

          </div>


          <div
            id="teacherQuizEditorQuestions"
            class="teacher-quiz-editor-question-list"
          >
            ${
              questions.length
                ? questions
                    .map(
                      (
                        question,
                        index
                      ) =>
                        createTeacherQuizEditorQuestion(
                          question,
                          index
                        )
                    )
                    .join(
                      ""
                    )
                : `
                    <div
                      class="teacher-inline-empty"
                      id="teacherQuizEmptyQuestions"
                    >
                      No questions yet.
                    </div>
                  `
            }
          </div>

        </div>


        <div
          class="teacher-quiz-editor-actions"
        >

          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-quiz-action="close-editor"
          >
            Cancel
          </button>


          <button
            type="submit"
            class="teacher-primary-button"
            id="teacherQuizSaveButton"
          >
            <i
              class="fa-solid fa-floppy-disk"
            ></i>

            ${
              editing
                ? "Save changes"
                : "Create quiz"
            }
          </button>

        </div>

      </form>

    </section>
  `;


  bindTeacherQuizForm();

}


/* =========================================================
   QUIZ EDITOR QUESTION
========================================================= */

function createTeacherQuizEditorQuestion(
  question = {},
  index = 0
){

  const type =
    String(
      question?.type ||
      "multiple_choice"
    )
      .trim()
      .toLowerCase();


  const options =
    asArray(
      question?.options
    );


  return `
    <article
      class="teacher-quiz-editor-question"
      data-quiz-question-index="${index}"
    >

      <div
        class="teacher-quiz-editor-question-head"
      >

        <span>
          Question ${index + 1}
        </span>

        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-quiz-action="remove-question"
          data-question-index="${index}"
          aria-label="Remove question"
        >
          <i
            class="fa-solid fa-trash"
          ></i>
        </button>

      </div>


      <label
        class="teacher-form-field"
      >
        <span>
          Question
        </span>

        <textarea
          class="teacher-quiz-question-text"
          rows="3"
          placeholder="Enter question..."
        >${escapeHtml(
          question?.question ||
          question?.title ||
          ""
        )}</textarea>
      </label>


      <div
        class="teacher-form-grid"
      >

        <label
          class="teacher-form-field"
        >
          <span>
            Type
          </span>

          <select
            class="teacher-quiz-question-type"
          >

            <option
              value="multiple_choice"
              ${
                type ===
                "multiple_choice"
                  ? "selected"
                  : ""
              }
            >
              Multiple choice
            </option>

            <option
              value="true_false"
              ${
                type ===
                "true_false"
                  ? "selected"
                  : ""
              }
            >
              True / False
            </option>

            <option
              value="short_answer"
              ${
                type ===
                "short_answer"
                  ? "selected"
                  : ""
              }
            >
              Short answer
            </option>

            <option
              value="essay"
              ${
                type ===
                "essay"
                  ? "selected"
                  : ""
              }
            >
              Essay
            </option>

          </select>
        </label>


        <label
          class="teacher-form-field"
        >
          <span>
            Points
          </span>

          <input
            class="teacher-quiz-question-points"
            type="number"
            min="0"
            step="1"
            value="${escapeHtml(
              question?.points ??
              1
            )}"
          />
        </label>

      </div>


      <label
        class="teacher-form-field"
      >
        <span>
          Options
        </span>

        <textarea
          class="teacher-quiz-question-options"
          rows="4"
          placeholder="One option per line"
        >${escapeHtml(
          options.join(
            "\n"
          )
        )}</textarea>
      </label>


      <label
        class="teacher-form-field"
      >
        <span>
          Correct answer
        </span>

        <input
          class="teacher-quiz-question-answer"
          type="text"
          value="${escapeHtml(
            question?.correctAnswer ||
            question?.answer ||
            ""
          )}"
          placeholder="Correct answer"
        />
      </label>


      <label
        class="teacher-form-field"
      >
        <span>
          Explanation
        </span>

        <textarea
          class="teacher-quiz-question-explanation"
          rows="3"
          placeholder="Optional explanation"
        >${escapeHtml(
          question?.explanation ||
          ""
        )}</textarea>
      </label>

    </article>
  `;

}


/* =========================================================
   ADD EMPTY QUIZ QUESTION
========================================================= */

function addTeacherQuizEditorQuestion(
  question = {}
){

  const container =
    $(
      "teacherQuizEditorQuestions"
    );


  if (
    !container
  ){
    return;
  }


  $(
    "teacherQuizEmptyQuestions"
  )
    ?.remove();


  const index =
    container.querySelectorAll(
      ".teacher-quiz-editor-question"
    ).length;


  container.insertAdjacentHTML(
    "beforeend",
    createTeacherQuizEditorQuestion(
      question,
      index
    )
  );

}


/* =========================================================
   NORMALIZE QUIZ QUESTION NUMBERS
========================================================= */

function normalizeTeacherQuizEditorQuestionNumbers(){

  const questions =
    Array.from(
      document.querySelectorAll(
        "#teacherQuizEditorQuestions .teacher-quiz-editor-question"
      )
    );


  questions.forEach(
    (
      element,
      index
    ) => {

      element.dataset
        .quizQuestionIndex =
          String(
            index
          );


      const title =
        element.querySelector(
          ".teacher-quiz-editor-question-head > span"
        );


      if (
        title
      ){

        title.textContent =
          `Question ${index + 1}`;

      }


      const removeButton =
        element.querySelector(
          "[data-teacher-quiz-action='remove-question']"
        );


      if (
        removeButton
      ){

        removeButton.dataset
          .questionIndex =
            String(
              index
            );

      }

    }
  );

}


/* =========================================================
   READ QUIZ EDITOR QUESTIONS
========================================================= */

function getTeacherQuizEditorQuestions(){

  return Array.from(
    document.querySelectorAll(
      "#teacherQuizEditorQuestions .teacher-quiz-editor-question"
    )
  )
    .map(
      questionElement => {

        const question =
          String(
            questionElement
              .querySelector(
                ".teacher-quiz-question-text"
              )
              ?.value ||
            ""
          )
            .trim();


        const type =
          String(
            questionElement
              .querySelector(
                ".teacher-quiz-question-type"
              )
              ?.value ||
            "multiple_choice"
          )
            .trim();


        const points =
          Math.max(
            0,
            safeNumber(
              questionElement
                .querySelector(
                  ".teacher-quiz-question-points"
                )
                ?.value,
              1
            )
          );


        const options =
          String(
            questionElement
              .querySelector(
                ".teacher-quiz-question-options"
              )
              ?.value ||
            ""
          )
            .split(
              "\n"
            )
            .map(
              item =>
                item.trim()
            )
            .filter(
              Boolean
            );


        const correctAnswer =
          String(
            questionElement
              .querySelector(
                ".teacher-quiz-question-answer"
              )
              ?.value ||
            ""
          )
            .trim();


        const explanation =
          String(
            questionElement
              .querySelector(
                ".teacher-quiz-question-explanation"
              )
              ?.value ||
            ""
          )
            .trim();


        return {
          question,
          type,
          points,
          options,
          correctAnswer,
          explanation
        };

      }
    )
    .filter(
      question =>
        Boolean(
          question.question
        )
    );

}


/* =========================================================
   QUIZ PAYLOAD
========================================================= */

function getTeacherQuizFormPayload(){

  const classId =
    String(
      $(
        "teacherQuizClassId"
      )?.value ||
      ""
    )
      .trim();


  const title =
    String(
      $(
        "teacherQuizTitle"
      )?.value ||
      ""
    )
      .trim();


  const description =
    String(
      $(
        "teacherQuizDescription"
      )?.value ||
      ""
    )
      .trim();


  const status =
    String(
      $(
        "teacherQuizStatus"
      )?.value ||
      "draft"
    )
      .trim();


  const durationMinutes =
    Math.max(
      0,
      safeNumber(
        $(
          "teacherQuizTimeLimit"
        )?.value,
        0
      )
    );


  return {

    schoolId:
      getSchoolId(),

    classId,

    teacherId:
      getTeacherId(),

    title,

    description,

    instructions:
      description,

    status,

    durationMinutes,

    timeLimit:
      durationMinutes,

    questions:
      getTeacherQuizEditorQuestions()

  };

}


/* =========================================================
   SAVE QUIZ
========================================================= */

async function saveTeacherQuiz(){

  if (
    teacherQuizWorkspaceState.saving
  ){
    return;
  }


  const payload =
    getTeacherQuizFormPayload();


  if (
    !payload.classId
  ){

    showAlert(
      "error",
      "Please select a class."
    );


    return;

  }


  if (
    !getTeacherClassById(
      payload.classId
    )
  ){

    showAlert(
      "error",
      "You do not have access to the selected class."
    );


    return;

  }


  if (
    !payload.title
  ){

    showAlert(
      "error",
      "Quiz title is required."
    );


    return;

  }


  const saveButton =
    $(
      "teacherQuizSaveButton"
    );


  teacherQuizWorkspaceState
    .saving =
      true;


  if (
    saveButton
  ){

    saveButton.disabled =
      true;


    saveButton.innerHTML = `
      <i
        class="fa-solid fa-spinner fa-spin"
      ></i>

      Saving...
    `;

  }


  try{

    const quizId =
      teacherQuizWorkspaceState
        .editingQuizId;


    const response =
      quizId
        ? await apiSend(
            `/api/quizzes/${
              encodeURIComponent(
                quizId
              )
            }`,
            "PATCH",
            payload
          )
        : await apiSend(
            "/api/quizzes",
            "POST",
            payload
          );


    const savedQuiz =
      response?.quiz ||
      response?.data ||
      response;


    if (
      savedQuiz?._id
    ){

      const existingIndex =
        state.quizzes
          .findIndex(
            quiz =>
              sameId(
                quiz?._id ||
                quiz?.id,
                savedQuiz._id
              )
          );


      if (
        existingIndex >=
        0
      ){

        state.quizzes[
          existingIndex
        ] =
          savedQuiz;

      }else{

        state.quizzes.unshift(
          savedQuiz
        );

      }

    }else{

      await loadTeacherQuizzes();

    }


    hydrateTeacherClassDataCache();


    closeTeacherQuizEditor();


    renderTeacherQuizzesWorkspace();


    showAlert(
      "success",
      quizId
        ? "Quiz updated successfully."
        : "Quiz created successfully.",
      {
        title:
          quizId
            ? "Quiz updated"
            : "Quiz created"
      }
    );

  }catch(
    error
  ){

    console.error(
      "saveTeacherQuiz failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save the quiz."
    );

  }finally{

    teacherQuizWorkspaceState
      .saving =
        false;


    if (
      saveButton
    ){

      saveButton.disabled =
        false;


      saveButton.innerHTML = `
        <i
          class="fa-solid fa-floppy-disk"
        ></i>

        Save quiz
      `;

    }

  }

}


/* =========================================================
   BIND QUIZ FORM
========================================================= */

function bindTeacherQuizForm(){

  const form =
    $(
      "teacherQuizForm"
    );


  if (
    !form ||
    form.dataset.bound ===
      "true"
  ){
    return;
  }


  form.dataset.bound =
    "true";


  form.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      saveTeacherQuiz();

    }
  );

}


/* =========================================================
   CLOSE QUIZ EDITOR
========================================================= */

function closeTeacherQuizEditor(){

  teacherQuizWorkspaceState
    .editingQuizId =
      null;


  const container =
    getTeacherOverviewElement(
      "teacherQuizEditor",
      "quizEditorWorkspace"
    );


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   CLOSE SELECTED QUIZ
========================================================= */

function closeTeacherSelectedQuiz(){

  teacherQuizWorkspaceState
    .selectedQuizId =
      null;


  state.selectedQuizId =
    null;


  const container =
    getTeacherOverviewElement(
      "teacherSelectedQuiz",
      "selectedQuizWorkspace",
      "teacherQuizDetail"
    );


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   QUESTION BANK VIEW
========================================================= */

function renderTeacherQuestionBank(){

  const container =
    getTeacherOverviewElement(
      "teacherQuestionBank",
      "questionBankWorkspace"
    );


  if (
    !container
  ){
    return;
  }


  const questions =
    teacherQuizWorkspaceState
      .questionBank;


  container.hidden =
    false;


  container.innerHTML = `
    <section
      class="teacher-question-bank-panel"
    >

      <div
        class="teacher-selected-section-head"
      >

        <div>

          <h2>
            Question Bank
          </h2>

          <p>
            Reuse questions created by your school
            and teaching team.
          </p>

        </div>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-question-bank-action="create"
        >
          <i
            class="fa-solid fa-plus"
          ></i>

          New question
        </button>

      </div>


      <div
        class="teacher-question-bank-list"
      >

        ${
          questions.length
            ? questions
                .map(
                  question => {

                    const questionId =
                      normalizeId(
                        question?._id ||
                        question?.id
                      );


                    return `
                      <article
                        class="teacher-question-bank-item"
                        data-question-id="${escapeHtml(
                          questionId
                        )}"
                      >

                        <div
                          class="teacher-question-bank-copy"
                        >

                          <strong>
                            ${escapeHtml(
                              question?.title ||
                              question?.question ||
                              "Question"
                            )}
                          </strong>

                          <p>
                            ${escapeHtml(
                              question?.question ||
                              ""
                            )}
                          </p>

                          <div
                            class="teacher-question-bank-meta"
                          >

                            <span>
                              ${escapeHtml(
                                question?.type ||
                                "multiple_choice"
                              )}
                            </span>

                            <span>
                              ${escapeHtml(
                                question?.difficulty ||
                                "medium"
                              )}
                            </span>

                            <span>
                              ${
                                safeNumber(
                                  question?.points,
                                  1
                                )
                              }
                              point${
                                safeNumber(
                                  question?.points,
                                  1
                                ) === 1
                                  ? ""
                                  : "s"
                              }
                            </span>

                          </div>

                        </div>


                        <button
                          type="button"
                          class="teacher-secondary-button"
                          data-teacher-question-bank-action="use"
                          data-question-id="${escapeHtml(
                            questionId
                          )}"
                        >
                          Use
                        </button>

                      </article>
                    `;

                  }
                )
                .join(
                  ""
                )
            : `
                <div
                  class="teacher-workspace-empty"
                >

                  <div
                    class="teacher-workspace-empty-icon"
                  >
                    <i
                      class="fa-solid fa-database"
                    ></i>
                  </div>

                  <h3>
                    Question Bank is empty
                  </h3>

                  <p>
                    Questions you create here can be
                    reused in future quizzes.
                  </p>

                </div>
              `
        }

      </div>

    </section>
  `;

}


/* =========================================================
   QUESTION BANK PICKER
========================================================= */

async function openTeacherQuestionBankPicker(){

  await loadTeacherQuestionBank();


  const questions =
    teacherQuizWorkspaceState
      .questionBank;


  if (
    !questions.length
  ){

    showAlert(
      "info",
      "The Question Bank does not contain any questions yet."
    );


    return;

  }


  const container =
    getTeacherOverviewElement(
      "teacherQuestionBankPicker",
      "questionBankPickerWorkspace"
    );


  if (
    !container
  ){

    /*
      If teacher.html does not yet contain the picker panel,
      switch to the full Question Bank workspace.
    */

    teacherQuizWorkspaceState.view =
      "question-bank";


    renderTeacherQuizWorkspaceTabs();


    renderTeacherQuestionBank();


    return;

  }


  container.hidden =
    false;


  container.innerHTML = `
    <div
      class="teacher-question-picker-panel"
    >

      <header>

        <div>
          <span>
            Question Bank
          </span>

          <h3>
            Select a question
          </h3>
        </div>


        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-quiz-action="close-question-picker"
        >
          <i
            class="fa-solid fa-xmark"
          ></i>
        </button>

      </header>


      <div
        class="teacher-question-picker-list"
      >

        ${
          questions
            .map(
              question => {

                const questionId =
                  normalizeId(
                    question?._id ||
                    question?.id
                  );


                return `
                  <button
                    type="button"
                    class="teacher-question-picker-item"
                    data-teacher-question-picker-id="${escapeHtml(
                      questionId
                    )}"
                  >

                    <span>

                      <strong>
                        ${escapeHtml(
                          question?.title ||
                          question?.question ||
                          "Question"
                        )}
                      </strong>

                      <small>
                        ${escapeHtml(
                          question?.type ||
                          "multiple_choice"
                        )}
                        ·
                        ${
                          safeNumber(
                            question?.points,
                            1
                          )
                        }
                        point${
                          safeNumber(
                            question?.points,
                            1
                          ) === 1
                            ? ""
                            : "s"
                        }
                      </small>

                    </span>

                    <i
                      class="fa-solid fa-plus"
                    ></i>

                  </button>
                `;

              }
            )
            .join(
              ""
            )
        }

      </div>

    </div>
  `;

}


/* =========================================================
   CLOSE QUESTION PICKER
========================================================= */

function closeTeacherQuestionBankPicker(){

  const container =
    getTeacherOverviewElement(
      "teacherQuestionBankPicker",
      "questionBankPickerWorkspace"
    );


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   CREATE QUESTION BANK QUESTION
========================================================= */

async function createTeacherQuestionBankQuestion(){

  const schoolId =
    getSchoolId();


  const teacherId =
    getTeacherId();


  if (
    !schoolId ||
    !teacherId
  ){

    showAlert(
      "error",
      "Your teacher account or school could not be identified."
    );


    return;

  }


  /*
    The full Question Bank editor will be upgraded later.

    For now use a simple production-safe prompt flow so
    the backend feature is functional immediately.
  */

  const questionText =
    window.prompt(
      "Enter the question:"
    );


  if (
    !questionText ||
    !questionText.trim()
  ){
    return;
  }


  const title =
    questionText
      .trim()
      .slice(
        0,
        80
      );


  try{

    const response =
      await apiSend(
        "/api/question-bank",
        "POST",
        {
          schoolId,

          createdBy:
            teacherId,

          title,

          question:
            questionText.trim(),

          type:
            "multiple_choice",

          options:
            [],

          explanation:
            "",

          points:
            1,

          difficulty:
            "medium",

          bloom:
            "remember",

          category:
            "General",

          tags:
            []
        }
      );


    if (
      response
    ){

      teacherQuizWorkspaceState
        .questionBank
        .unshift(
          response
        );

    }


    teacherQuizWorkspaceState
      .questionBankLoaded =
        true;


    renderTeacherQuestionBank();


    showAlert(
      "success",
      "Question added to the Question Bank."
    );

  }catch(
    error
  ){

    showAlert(
      "error",
      error?.message ||
      "AIFT could not create the question."
    );

  }

}


/* =========================================================
   RENDER QUIZZES WORKSPACE
========================================================= */

async function renderTeacherQuizzesWorkspace(){

  renderTeacherQuizzesHeader();


  renderTeacherQuizzesSummary();


  renderTeacherQuizWorkspaceTabs();


  if (
    teacherQuizWorkspaceState.view ===
    "question-bank"
  ){

    const quizGrid =
      getTeacherOverviewElement(
        "teacherQuizzesGrid",
        "quizzesWorkspaceGrid",
        "teacherQuizList"
      );


    const toolbar =
      getTeacherOverviewElement(
        "teacherQuizzesToolbar",
        "quizzesWorkspaceToolbar"
      );


    if (
      quizGrid
    ){

      quizGrid.hidden =
        true;

    }


    if (
      toolbar
    ){

      toolbar.hidden =
        true;

    }


    await loadTeacherQuestionBank();


    renderTeacherQuestionBank();


    return;

  }


  const questionBank =
    getTeacherOverviewElement(
      "teacherQuestionBank",
      "questionBankWorkspace"
    );


  if (
    questionBank
  ){

    questionBank.hidden =
      true;

  }


  const grid =
    getTeacherOverviewElement(
      "teacherQuizzesGrid",
      "quizzesWorkspaceGrid",
      "teacherQuizList"
    );


  const toolbar =
    getTeacherOverviewElement(
      "teacherQuizzesToolbar",
      "quizzesWorkspaceToolbar"
    );


  if (
    grid
  ){

    grid.hidden =
      false;

  }


  if (
    toolbar
  ){

    toolbar.hidden =
      false;

  }


  renderTeacherQuizzesToolbar();


  renderTeacherQuizzesGrid();


  if (
    teacherQuizWorkspaceState
      .selectedQuizId
  ){

    renderTeacherSelectedQuiz(
      teacherQuizWorkspaceState
        .selectedQuizId
    );

  }

}


/* =========================================================
   COMPATIBILITY QUIZ RENDERER
========================================================= */

function renderTeacherQuizzes(){

  renderTeacherQuizzesWorkspace();

}


/* =========================================================
   QUIZ CONTROLS
========================================================= */

let teacherQuizControlsBound =
  false;


function bindTeacherQuizControls(){

  if (
    teacherQuizControlsBound
  ){
    return;
  }


  teacherQuizControlsBound =
    true;


  /* =======================================================
     SEARCH
  ======================================================= */

  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id ===
        "teacherQuizSearch"
      ){

        teacherQuizWorkspaceState
          .search =
            event.target.value ||
            "";


        renderTeacherQuizzesGrid();

      }

    }
  );


  /* =======================================================
     FILTERS
  ======================================================= */

  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherQuizClassFilter"
      ){

        teacherQuizWorkspaceState
          .classId =
            event.target.value ||
            "all";


        renderTeacherQuizzesGrid();


        return;

      }


      if (
        event.target?.id ===
        "teacherQuizStatusFilter"
      ){

        teacherQuizWorkspaceState
          .status =
            event.target.value ||
            "all";


        renderTeacherQuizzesGrid();


        return;

      }


      if (
        event.target?.id ===
        "teacherQuizSort"
      ){

        teacherQuizWorkspaceState
          .sort =
            event.target.value ||
            "recent";


        renderTeacherQuizzesGrid();

      }

    }
  );


  /* =======================================================
     MAIN QUIZ ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-teacher-quiz-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherQuizAction ||
          ""
        )
          .trim()
          .toLowerCase();


      const quizId =
        normalizeId(
          button.dataset
            .quizId
        );


      switch(
        action
      ){

        case "create":

          renderTeacherQuizEditor(
            null
          );

          break;


        case "edit":

          renderTeacherQuizEditor(
            getTeacherQuizById(
              quizId
            )
          );

          break;


        case "open":

          teacherQuizWorkspaceState
            .selectedQuizId =
              quizId;


          state.selectedQuizId =
            quizId;


          renderTeacherSelectedQuiz(
            quizId
          );


          break;


        case "close":

          closeTeacherSelectedQuiz();


          break;


        case "close-editor":

          closeTeacherQuizEditor();


          break;


        case "add-question":

          addTeacherQuizEditorQuestion();


          break;


        case "remove-question":{

          const index =
            Number(
              button.dataset
                .questionIndex
            );


          const questions =
            Array.from(
              document.querySelectorAll(
                "#teacherQuizEditorQuestions .teacher-quiz-editor-question"
              )
            );


          questions[
            index
          ]?.remove();


          normalizeTeacherQuizEditorQuestionNumbers();


          break;
        }


        case "question-bank":

          teacherQuizWorkspaceState.view =
            "question-bank";


          await renderTeacherQuizzesWorkspace();


          break;


        case "question-bank-picker":

          await openTeacherQuestionBankPicker();


          break;


        case "close-question-picker":

          closeTeacherQuestionBankPicker();


          break;


        case "kabezya-generate":

          state.kabezya.classId =
            teacherQuizWorkspaceState.classId !==
            "all"
              ? teacherQuizWorkspaceState.classId
              : state.selectedClassId ||
                "";


          state.kabezya.mode =
            "generate-quiz";


          activateStudentStudioPage(
            "ai"
          );


          break;

      }

    }
  );


  /* =======================================================
     QUIZ TABS
  ======================================================= */

  document.addEventListener(
    "click",
    async event => {

      const tab =
        event.target.closest(
          "[data-teacher-quiz-tab]"
        );


      if (
        !tab
      ){
        return;
      }


      event.preventDefault();


      teacherQuizWorkspaceState.view =
        String(
          tab.dataset
            .teacherQuizTab ||
          "quizzes"
        );


      await renderTeacherQuizzesWorkspace();

    }
  );


  /* =======================================================
     QUESTION PICKER
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-question-picker-id]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const question =
        getTeacherQuestionBankItem(
          button.dataset
            .teacherQuestionPickerId
        );


      if (
        !question
      ){
        return;
      }


      addTeacherQuizEditorQuestion({
        question:
          question.question,

        title:
          question.title,

        type:
          question.type,

        options:
          question.options,

        correctAnswer:
          question.correctAnswer ||
          question.answer,

        explanation:
          question.explanation,

        points:
          question.points
      });


      closeTeacherQuestionBankPicker();


      showAlert(
        "success",
        "Question added to the quiz."
      );

    }
  );


  /* =======================================================
     QUESTION BANK ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    async event => {

      const button =
        event.target.closest(
          "[data-teacher-question-bank-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherQuestionBankAction ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        action ===
        "create"
      ){

        await createTeacherQuestionBankQuestion();


        return;

      }


      if (
        action ===
        "use"
      ){

        const question =
          getTeacherQuestionBankItem(
            button.dataset
              .questionId
          );


        if (
          !question
        ){
          return;
        }


        /*
          If no quiz editor is open yet, open a fresh quiz
          editor first.
        */

        if (
          !$(
            "teacherQuizForm"
          )
        ){

          renderTeacherQuizEditor(
            null
          );

        }


        window.requestAnimationFrame(
          () => {

            addTeacherQuizEditorQuestion({
              question:
                question.question,

              type:
                question.type,

              options:
                question.options,

              correctAnswer:
                question.correctAnswer ||
                question.answer,

              explanation:
                question.explanation,

              points:
                question.points
            });

          }
        );

      }

    }
  );

}


/* =========================================================
   INITIALIZE QUIZZES
========================================================= */

function initializeTeacherQuizzesWorkspace(){

  bindTeacherQuizControls();


  if (
    state.me
  ){

    renderTeacherQuizzesWorkspace();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 9
   ATTENDANCE WORKSPACE
========================================================= */


/* =========================================================
   ATTENDANCE WORKSPACE STATE
========================================================= */

const teacherAttendanceWorkspaceState = {

  classId:
    "all",

  date:
    new Date()
      .toISOString()
      .slice(
        0,
        10
      ),

  status:
    "all",

  search:
    "",

  selectedStudentId:
    null,

  saving:
    false,

  loading:
    false

};


/* =========================================================
   NORMALIZE ATTENDANCE STATUS
========================================================= */

function normalizeTeacherAttendanceStatus(
  value
){

  const status =
    String(
      value ||
      "present"
    )
      .trim()
      .toLowerCase();


  if (
    [
      "present",
      "late",
      "absent",
      "excused"
    ].includes(
      status
    )
  ){

    return status;

  }


  return "present";

}


/* =========================================================
   ATTENDANCE STATUS LABEL
========================================================= */

function getTeacherAttendanceStatusLabel(
  value
){

  const status =
    normalizeTeacherAttendanceStatus(
      value
    );


  switch(
    status
  ){

    case "late":
      return "Late";

    case "absent":
      return "Absent";

    case "excused":
      return "Excused";

    case "present":
    default:
      return "Present";

  }

}


/* =========================================================
   ATTENDANCE RECORD CLASS
========================================================= */

function getTeacherAttendanceRecordClassId(
  record
){

  return normalizeId(
    record?.classId?._id ||
    record?.classId
  );

}


/* =========================================================
   ATTENDANCE RECORD STUDENT
========================================================= */

function getTeacherAttendanceRecordStudentId(
  record
){

  return normalizeId(
    record?.studentId?._id ||
    record?.studentId
  );

}


/* =========================================================
   ATTENDANCE RECORD DATE
========================================================= */

function getTeacherAttendanceRecordDate(
  record
){

  const value =
    record?.date ||
    record?.attendanceDate ||
    record?.sessionDate ||
    record?.createdAt ||
    null;


  if (
    !value
  ){
    return "";
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ){

    return String(
      value
    )
      .slice(
        0,
        10
      );

  }


  return date
    .toISOString()
    .slice(
      0,
      10
    );

}


/* =========================================================
   ATTENDANCE RECORD MATCH
========================================================= */

function getTeacherAttendanceRecord(
  classId,
  studentId,
  date
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  const normalizedStudentId =
    normalizeId(
      studentId
    );


  const normalizedDate =
    String(
      date ||
      ""
    )
      .slice(
        0,
        10
      );


  return (
    asArray(
      state.attendance
    )
      .find(
        record => {

          return (
            sameId(
              getTeacherAttendanceRecordClassId(
                record
              ),
              normalizedClassId
            ) &&
            sameId(
              getTeacherAttendanceRecordStudentId(
                record
              ),
              normalizedStudentId
            ) &&
            getTeacherAttendanceRecordDate(
              record
            ) ===
            normalizedDate
          );

        }
      ) ||
    null
  );

}


/* =========================================================
   ATTENDANCE RECORDS FOR CLASS + DATE
========================================================= */

function getTeacherAttendanceForClassDate(
  classId,
  date
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  const normalizedDate =
    String(
      date ||
      ""
    )
      .slice(
        0,
        10
      );


  return asArray(
    state.attendance
  )
    .filter(
      record => {

        return (
          sameId(
            getTeacherAttendanceRecordClassId(
              record
            ),
            normalizedClassId
          ) &&
          getTeacherAttendanceRecordDate(
            record
          ) ===
          normalizedDate
        );

      }
    );

}


/* =========================================================
   ATTENDANCE STUDENT HISTORY
========================================================= */

function getTeacherStudentAttendanceHistory(
  studentId
){

  const normalizedStudentId =
    normalizeId(
      studentId
    );


  return asArray(
    state.attendance
  )
    .filter(
      record =>
        sameId(
          getTeacherAttendanceRecordStudentId(
            record
          ),
          normalizedStudentId
        )
    )
    .sort(
      (
        first,
        second
      ) =>
        new Date(
          second?.date ||
          second?.createdAt ||
          0
        )
          .getTime() -
        new Date(
          first?.date ||
          first?.createdAt ||
          0
        )
          .getTime()
    );

}


/* =========================================================
   ATTENDANCE CLASS FILTER
========================================================= */

function getTeacherAttendanceClasses(){

  return getTeacherClasses();

}


/* =========================================================
   ATTENDANCE SELECTED CLASS
========================================================= */

function getTeacherAttendanceSelectedClass(){

  if (
    teacherAttendanceWorkspaceState
      .classId ===
    "all"
  ){

    return null;

  }


  return getTeacherClassById(
    teacherAttendanceWorkspaceState
      .classId
  );

}


/* =========================================================
   ATTENDANCE ROSTER
========================================================= */

function getTeacherAttendanceRoster(){

  const classId =
    teacherAttendanceWorkspaceState
      .classId;


  if (
    !classId ||
    classId ===
    "all"
  ){

    return [];

  }


  let students =
    [
      ...getTeacherClassStudents(
        classId
      )
    ];


  const search =
    String(
      teacherAttendanceWorkspaceState
        .search ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    search
  ){

    students =
      students.filter(
        student => {

          const haystack =
            [
              getTeacherDisplayName(
                student
              ),

              student?.email,

              student?.course,

              student?.program
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  students.sort(
    (
      first,
      second
    ) =>
      getTeacherDisplayName(
        first
      )
        .localeCompare(
          getTeacherDisplayName(
            second
          )
        )
  );


  return students;

}


/* =========================================================
   ATTENDANCE SUMMARY
========================================================= */

function getTeacherAttendanceSummary(){

  const classId =
    teacherAttendanceWorkspaceState
      .classId;


  const date =
    teacherAttendanceWorkspaceState
      .date;


  if (
    !classId ||
    classId ===
    "all"
  ){

    return {
      total:0,
      present:0,
      late:0,
      absent:0,
      excused:0,
      recorded:0,
      attendanceRate:0
    };

  }


  const roster =
    getTeacherClassStudents(
      classId
    );


  const records =
    getTeacherAttendanceForClassDate(
      classId,
      date
    );


  const summary = {

    total:
      roster.length,

    present:0,
    late:0,
    absent:0,
    excused:0,

    recorded:
      records.length,

    attendanceRate:0

  };


  records.forEach(
    record => {

      const status =
        normalizeTeacherAttendanceStatus(
          record?.status
        );


      if (
        Object.prototype
          .hasOwnProperty.call(
            summary,
            status
          )
      ){

        summary[
          status
        ] += 1;

      }

    }
  );


  const attended =
    summary.present +
    summary.late;


  summary.attendanceRate =
    summary.total
      ? clampPercentage(
          (
            attended /
            summary.total
          ) *
          100
        )
      : 0;


  return summary;

}


/* =========================================================
   ATTENDANCE HEADER
========================================================= */

function renderTeacherAttendanceHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherAttendanceHeader",
      "attendanceWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Attendance
        </h1>

        <p>
          Record student attendance,
          review daily class attendance
          and monitor attendance history.
        </p>

      </div>

    </div>
  `;

}


/* =========================================================
   ATTENDANCE TOOLBAR
========================================================= */

function renderTeacherAttendanceToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherAttendanceToolbar",
      "attendanceWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherAttendanceClasses();


  container.innerHTML = `

    <select
      id="teacherAttendanceClassFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        Select class
      </option>

      ${
        classes
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    classId
                  )}"
                  ${
                    sameId(
                      teacherAttendanceWorkspaceState
                        .classId,
                      classId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <label
      class="teacher-attendance-date-control"
    >

      <i
        class="fa-regular fa-calendar"
      ></i>

      <input
        id="teacherAttendanceDate"
        type="date"
        value="${escapeHtml(
          teacherAttendanceWorkspaceState
            .date
        )}"
      />

    </label>


    <div
      class="teacher-attendance-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
      ></i>

      <input
        id="teacherAttendanceSearch"
        type="search"
        placeholder="Search student..."
        value="${escapeHtml(
          teacherAttendanceWorkspaceState
            .search
        )}"
      />

    </div>


    <button
      type="button"
      class="teacher-secondary-button"
      data-teacher-attendance-action="today"
    >
      Today
    </button>


    <button
      type="button"
      class="teacher-secondary-button"
      data-teacher-attendance-action="refresh"
    >
      <i
        class="fa-solid fa-rotate"
      ></i>

      Refresh
    </button>

  `;

}


/* =========================================================
   ATTENDANCE SUMMARY CARDS
========================================================= */

function renderTeacherAttendanceSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherAttendanceSummary",
      "attendanceWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const summary =
    getTeacherAttendanceSummary();


  container.innerHTML = `

    <article
      class="teacher-attendance-summary-card"
    >
      <i
        class="fa-solid fa-users"
      ></i>

      <span>
        <strong>
          ${summary.total}
        </strong>

        <small>
          Students
        </small>
      </span>
    </article>


    <article
      class="teacher-attendance-summary-card is-present"
    >
      <i
        class="fa-solid fa-circle-check"
      ></i>

      <span>
        <strong>
          ${summary.present}
        </strong>

        <small>
          Present
        </small>
      </span>
    </article>


    <article
      class="teacher-attendance-summary-card is-late"
    >
      <i
        class="fa-solid fa-clock"
      ></i>

      <span>
        <strong>
          ${summary.late}
        </strong>

        <small>
          Late
        </small>
      </span>
    </article>


    <article
      class="teacher-attendance-summary-card is-absent"
    >
      <i
        class="fa-solid fa-circle-xmark"
      ></i>

      <span>
        <strong>
          ${summary.absent}
        </strong>

        <small>
          Absent
        </small>
      </span>
    </article>


    <article
      class="teacher-attendance-summary-card"
    >
      <i
        class="fa-solid fa-chart-line"
      ></i>

      <span>
        <strong>
          ${summary.attendanceRate}%
        </strong>

        <small>
          Attendance rate
        </small>
      </span>
    </article>

  `;

}


/* =========================================================
   ATTENDANCE BULK ACTIONS
========================================================= */

function renderTeacherAttendanceBulkActions(){

  const container =
    getTeacherOverviewElement(
      "teacherAttendanceBulkActions",
      "attendanceBulkActions"
    );


  if (
    !container
  ){
    return;
  }


  const classSelected =
    teacherAttendanceWorkspaceState
      .classId !==
      "all";


  container.innerHTML = `

    <div
      class="teacher-attendance-bulk-copy"
    >

      <strong>
        Quick attendance
      </strong>

      <span>
        Apply a status to the full visible roster.
      </span>

    </div>


    <div
      class="teacher-attendance-bulk-buttons"
    >

      <button
        type="button"
        class="teacher-attendance-bulk-button is-present"
        data-teacher-attendance-bulk="present"
        ${
          !classSelected
            ? "disabled"
            : ""
        }
      >
        <i
          class="fa-solid fa-check"
        ></i>

        All present
      </button>


      <button
        type="button"
        class="teacher-attendance-bulk-button is-late"
        data-teacher-attendance-bulk="late"
        ${
          !classSelected
            ? "disabled"
            : ""
        }
      >
        <i
          class="fa-solid fa-clock"
        ></i>

        All late
      </button>


      <button
        type="button"
        class="teacher-attendance-bulk-button is-absent"
        data-teacher-attendance-bulk="absent"
        ${
          !classSelected
            ? "disabled"
            : ""
        }
      >
        <i
          class="fa-solid fa-xmark"
        ></i>

        All absent
      </button>

    </div>

  `;

}


/* =========================================================
   ATTENDANCE STUDENT ROW
========================================================= */

function createTeacherAttendanceStudentRow(
  student
){

  const studentId =
    normalizeId(
      student?._id ||
      student?.id
    );


  const record =
    getTeacherAttendanceRecord(
      teacherAttendanceWorkspaceState
        .classId,
      studentId,
      teacherAttendanceWorkspaceState
        .date
    );


  const currentStatus =
    record
      ? normalizeTeacherAttendanceStatus(
          record.status
        )
      : "";


  return `
    <article
      class="teacher-attendance-student-row"
      data-attendance-student-id="${escapeHtml(
        studentId
      )}"
    >

      <button
        type="button"
        class="teacher-attendance-student-main"
        data-teacher-attendance-action="student"
        data-student-id="${escapeHtml(
          studentId
        )}"
      >

        <img
          src="${escapeHtml(
            getTeacherStudentAvatar(
              student
            )
          )}"
          alt="${escapeHtml(
            getTeacherDisplayName(
              student
            )
          )}"
        />

        <span>

          <strong>
            ${escapeHtml(
              getTeacherDisplayName(
                student
              )
            )}
          </strong>

          <small>
            ${escapeHtml(
              student?.email ||
              student?.course ||
              student?.program ||
              "Student"
            )}
          </small>

        </span>

      </button>


      <div
        class="teacher-attendance-status-options"
      >

        ${
          [
            "present",
            "late",
            "absent",
            "excused"
          ]
            .map(
              status => `
                <button
                  type="button"
                  class="
                    teacher-attendance-status-button
                    is-${status}
                    ${
                      currentStatus ===
                      status
                        ? "active"
                        : ""
                    }
                  "
                  data-teacher-attendance-status="${status}"
                  data-student-id="${escapeHtml(
                    studentId
                  )}"
                >
                  ${getTeacherAttendanceStatusLabel(
                    status
                  )}
                </button>
              `
            )
            .join(
              ""
            )
        }

      </div>


      <div
        class="teacher-attendance-record-meta"
      >

        ${
          record
            ? `
              <span>
                Saved
              </span>

              <small>
                ${escapeHtml(
                  formatTeacherRelativeTime(
                    record?.updatedAt ||
                    record?.createdAt
                  )
                )}
              </small>
            `
            : `
              <span>
                Not marked
              </span>
            `
        }

      </div>

    </article>
  `;

}


/* =========================================================
   ATTENDANCE ROSTER RENDERER
========================================================= */

function renderTeacherAttendanceRoster(){

  const container =
    getTeacherOverviewElement(
      "teacherAttendanceRoster",
      "attendanceWorkspaceRoster",
      "teacherAttendanceList"
    );


  if (
    !container
  ){
    return;
  }


  if (
    teacherAttendanceWorkspaceState
      .classId ===
      "all"
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-solid fa-chalkboard"
          ></i>
        </div>

        <h3>
          Select a class
        </h3>

        <p>
          Choose one of your assigned classes
          to record attendance.
        </p>

      </div>
    `;


    return;

  }


  const students =
    getTeacherAttendanceRoster();


  if (
    !students.length
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-solid fa-user-graduate"
          ></i>
        </div>

        <h3>
          No students found
        </h3>

        <p>
          ${
            teacherAttendanceWorkspaceState
              .search
              ? `
                No student matches your current search.
              `
              : `
                This class does not currently have
                students in its roster.
              `
          }
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML = `
    <div
      class="teacher-attendance-roster-head"
    >

      <span>
        Student
      </span>

      <span>
        Attendance
      </span>

      <span>
        Record
      </span>

    </div>


    <div
      class="teacher-attendance-roster-body"
    >

      ${
        students
          .map(
            createTeacherAttendanceStudentRow
          )
          .join(
            ""
          )
      }

    </div>
  `;

}


/* =========================================================
   ATTENDANCE STUDENT HISTORY PANEL
========================================================= */

function renderTeacherAttendanceStudentHistory(
  studentId
){

  const container =
    getTeacherOverviewElement(
      "teacherAttendanceStudentHistory",
      "attendanceStudentHistory"
    );


  if (
    !container
  ){
    return;
  }


  const student =
    getTeacherStudentById(
      studentId
    );


  if (
    !student
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";


    return;

  }


  teacherAttendanceWorkspaceState
    .selectedStudentId =
      normalizeId(
        studentId
      );


  const history =
    getTeacherStudentAttendanceHistory(
      studentId
    );


  const attendanceRate =
    getTeacherStudentAttendanceRate(
      studentId
    );


  const present =
    history.filter(
      record =>
        normalizeTeacherAttendanceStatus(
          record?.status
        ) ===
        "present"
    ).length;


  const late =
    history.filter(
      record =>
        normalizeTeacherAttendanceStatus(
          record?.status
        ) ===
        "late"
    ).length;


  const absent =
    history.filter(
      record =>
        normalizeTeacherAttendanceStatus(
          record?.status
        ) ===
        "absent"
    ).length;


  const excused =
    history.filter(
      record =>
        normalizeTeacherAttendanceStatus(
          record?.status
        ) ===
        "excused"
    ).length;


  container.hidden =
    false;


  container.innerHTML = `
    <section
      class="teacher-attendance-history-panel"
    >

      <header
        class="teacher-attendance-history-header"
      >

        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-attendance-action="close-history"
          aria-label="Close attendance history"
        >
          <i
            class="fa-solid fa-arrow-left"
          ></i>
        </button>


        <img
          src="${escapeHtml(
            getTeacherStudentAvatar(
              student
            )
          )}"
          alt="${escapeHtml(
            getTeacherDisplayName(
              student
            )
          )}"
        />


        <div>

          <span>
            Attendance history
          </span>

          <h2>
            ${escapeHtml(
              getTeacherDisplayName(
                student
              )
            )}
          </h2>

          <p>
            ${escapeHtml(
              student?.email ||
              student?.course ||
              "Student"
            )}
          </p>

        </div>


        <button
          type="button"
          class="teacher-secondary-button"
          data-kabezya-student-inspect="${escapeHtml(
            normalizeId(
              studentId
            )
          )}"
        >
          <i
            class="fa-solid fa-wand-magic-sparkles"
          ></i>

          Ask Kabezya
        </button>

      </header>


      <div
        class="teacher-attendance-history-summary"
      >

        <article>
          <span>
            Attendance
          </span>

          <strong>
            ${attendanceRate}%
          </strong>
        </article>


        <article>
          <span>
            Present
          </span>

          <strong>
            ${present}
          </strong>
        </article>


        <article>
          <span>
            Late
          </span>

          <strong>
            ${late}
          </strong>
        </article>


        <article>
          <span>
            Absent
          </span>

          <strong>
            ${absent}
          </strong>
        </article>


        <article>
          <span>
            Excused
          </span>

          <strong>
            ${excused}
          </strong>
        </article>

      </div>


      <div
        class="teacher-attendance-history-list"
      >

        ${
          history.length
            ? history
                .slice(
                  0,
                  30
                )
                .map(
                  record => {

                    const classItem =
                      record?.classId &&
                      typeof record.classId ===
                        "object"
                        ? record.classId
                        : getTeacherClassById(
                            record?.classId
                          );


                    const status =
                      normalizeTeacherAttendanceStatus(
                        record?.status
                      );


                    return `
                      <article
                        class="teacher-attendance-history-row"
                      >

                        <span
                          class="
                            teacher-attendance-history-dot
                            is-${escapeHtml(
                              status
                            )}
                          "
                        ></span>


                        <div
                          class="teacher-attendance-history-copy"
                        >

                          <strong>
                            ${escapeHtml(
                              formatTeacherDate(
                                record?.date ||
                                record?.createdAt,
                                {
                                  year:
                                    "numeric"
                                }
                              )
                            )}
                          </strong>

                          <small>
                            ${escapeHtml(
                              getTeacherClassTitle(
                                classItem
                              )
                            )}
                          </small>

                        </div>


                        <span
                          class="
                            teacher-attendance-status
                            is-${escapeHtml(
                              status
                            )}
                          "
                        >
                          ${escapeHtml(
                            getTeacherAttendanceStatusLabel(
                              status
                            )
                          )}
                        </span>


                        ${
                          record?.notes
                            ? `
                              <span
                                class="teacher-attendance-note"
                              >
                                ${escapeHtml(
                                  record.notes
                                )}
                              </span>
                            `
                            : ""
                        }

                      </article>
                    `;

                  }
                )
                .join(
                  ""
                )
            : `
                <div
                  class="teacher-inline-empty"
                >
                  No attendance records are available
                  for this student yet.
                </div>
              `
        }

      </div>

    </section>
  `;

}


/* =========================================================
   SAVE ATTENDANCE RECORD
========================================================= */

async function saveTeacherAttendanceRecord(
  studentId,
  status
){

  const classId =
    normalizeId(
      teacherAttendanceWorkspaceState
        .classId
    );


  const date =
    String(
      teacherAttendanceWorkspaceState
        .date ||
      ""
    )
      .slice(
        0,
        10
      );


  const normalizedStudentId =
    normalizeId(
      studentId
    );


  const normalizedStatus =
    normalizeTeacherAttendanceStatus(
      status
    );


  if (
    !classId ||
    classId ===
    "all"
  ){

    showAlert(
      "error",
      "Please select a class first."
    );


    return null;
  }


  if (
    !date
  ){

    showAlert(
      "error",
      "Please select an attendance date."
    );


    return null;
  }


  if (
    !normalizedStudentId
  ){

    showAlert(
      "error",
      "The selected student could not be identified."
    );


    return null;
  }


  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    showAlert(
      "error",
      "You do not have access to the selected class."
    );


    return null;
  }


  const student =
    getTeacherClassStudents(
      classId
    )
      .find(
        item =>
          sameId(
            item?._id ||
            item?.id,
            normalizedStudentId
          )
      );


  if (
    !student
  ){

    showAlert(
      "error",
      "The selected student is not part of this class."
    );


    return null;
  }


  const existingRecord =
    getTeacherAttendanceRecord(
      classId,
      normalizedStudentId,
      date
    );


  const payload = {

    schoolId:
      getSchoolId(),

    classId,

    teacherId:
      getTeacherId(),

    studentId:
      normalizedStudentId,

    date:
      new Date(
        `${date}T00:00:00`
      )
        .toISOString(),

    status:
      normalizedStatus,

    markedBy:
      getTeacherId(),

    source:
      "manual"

  };


  let response =
    null;


  if (
    existingRecord?._id
  ){

    response =
      await apiSend(
        `/api/attendance/${
          encodeURIComponent(
            existingRecord._id
          )
        }`,
        "PATCH",
        payload
      );

  }else{

    response =
      await apiSend(
        "/api/attendance",
        "POST",
        payload
      );

  }


  const savedRecord =
    response?.attendance ||
    response?.data ||
    response;


  if (
    savedRecord?._id
  ){

    const index =
      state.attendance
        .findIndex(
          record =>
            sameId(
              record?._id,
              savedRecord._id
            )
        );


    if (
      index >=
      0
    ){

      state.attendance[
        index
      ] =
        savedRecord;

    }else{

      state.attendance.unshift(
        savedRecord
      );

    }

  }else{

    await loadTeacherAttendance();

  }


  hydrateTeacherClassDataCache();


  calculateTeacherMetrics();


  return savedRecord;

}


/* =========================================================
   UPDATE ONE ATTENDANCE STATUS
========================================================= */

async function updateTeacherAttendanceStatus(
  studentId,
  status,
  button = null
){

  if (
    teacherAttendanceWorkspaceState.saving
  ){
    return;
  }


  teacherAttendanceWorkspaceState
    .saving =
      true;


  const originalHtml =
    button?.innerHTML;


  if (
    button
  ){

    button.disabled =
      true;


    button.innerHTML = `
      <i
        class="fa-solid fa-spinner fa-spin"
      ></i>
    `;

  }


  try{

    await saveTeacherAttendanceRecord(
      studentId,
      status
    );


    renderTeacherAttendanceSummary();


    renderTeacherAttendanceRoster();


    renderTeacherDashboardStats();

  }catch(
    error
  ){

    console.error(
      "Attendance update failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save attendance."
    );

  }finally{

    teacherAttendanceWorkspaceState
      .saving =
        false;


    if (
      button
    ){

      button.disabled =
        false;


      if (
        originalHtml
      ){

        button.innerHTML =
          originalHtml;

      }

    }

  }

}


/* =========================================================
   BULK ATTENDANCE
========================================================= */

async function saveTeacherBulkAttendance(
  status
){

  if (
    teacherAttendanceWorkspaceState.saving
  ){
    return;
  }


  const students =
    getTeacherAttendanceRoster();


  if (
    !students.length
  ){

    showAlert(
      "info",
      "There are no visible students to update."
    );


    return;
  }


  teacherAttendanceWorkspaceState
    .saving =
      true;


  try{

    const results =
      await Promise.allSettled(
        students.map(
          student =>
            saveTeacherAttendanceRecord(
              student?._id ||
              student?.id,
              status
            )
        )
      );


    const failed =
      results.filter(
        result =>
          result.status ===
          "rejected"
      );


    await loadTeacherAttendance();


    hydrateTeacherClassDataCache();


    calculateTeacherMetrics();


    renderTeacherAttendanceWorkspace();


    if (
      failed.length
    ){

      showAlert(
        "warning",
        `${
          failed.length
        } attendance record${
          failed.length === 1
            ? ""
            : "s"
        } could not be saved.`,
        {
          title:
            "Attendance partially saved"
        }
      );


      return;

    }


    showAlert(
      "success",
      `All visible students were marked ${getTeacherAttendanceStatusLabel(
        status
      ).toLowerCase()}.`,
      {
        title:
          "Attendance saved"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Bulk attendance failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save attendance."
    );

  }finally{

    teacherAttendanceWorkspaceState
      .saving =
        false;

  }

}


/* =========================================================
   REFRESH ATTENDANCE
========================================================= */

async function refreshTeacherAttendance(){

  if (
    teacherAttendanceWorkspaceState.loading
  ){
    return;
  }


  teacherAttendanceWorkspaceState
    .loading =
      true;


  try{

    await loadTeacherAttendance();


    hydrateTeacherClassDataCache();


    calculateTeacherMetrics();


    renderTeacherAttendanceWorkspace();


    showAlert(
      "success",
      "Attendance records are up to date.",
      {
        title:
          "Attendance refreshed"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Attendance refresh failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not refresh attendance."
    );

  }finally{

    teacherAttendanceWorkspaceState
      .loading =
        false;

  }

}


/* =========================================================
   CLOSE ATTENDANCE HISTORY
========================================================= */

function closeTeacherAttendanceHistory(){

  teacherAttendanceWorkspaceState
    .selectedStudentId =
      null;


  const container =
    getTeacherOverviewElement(
      "teacherAttendanceStudentHistory",
      "attendanceStudentHistory"
    );


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   MAIN ATTENDANCE WORKSPACE
========================================================= */

function renderTeacherAttendanceWorkspace(){

  /*
    If another Teacher Studio section already selected
    a class, reuse it as the attendance context.
  */

  if (
    state.selectedClassId &&
    teacherAttendanceWorkspaceState
      .classId ===
      "all"
  ){

    teacherAttendanceWorkspaceState
      .classId =
        normalizeId(
          state.selectedClassId
        ) ||
        "all";

  }


  renderTeacherAttendanceHeader();


  renderTeacherAttendanceToolbar();


  renderTeacherAttendanceSummary();


  renderTeacherAttendanceBulkActions();


  renderTeacherAttendanceRoster();


  if (
    teacherAttendanceWorkspaceState
      .selectedStudentId
  ){

    renderTeacherAttendanceStudentHistory(
      teacherAttendanceWorkspaceState
        .selectedStudentId
    );

  }

}


/* =========================================================
   COMPATIBILITY ATTENDANCE RENDERER
========================================================= */

function renderTeacherAttendance(){

  renderTeacherAttendanceWorkspace();

}


/* =========================================================
   ATTENDANCE CONTROLS
========================================================= */

let teacherAttendanceControlsBound =
  false;


function bindTeacherAttendanceControls(){

  if (
    teacherAttendanceControlsBound
  ){
    return;
  }


  teacherAttendanceControlsBound =
    true;


  /* =======================================================
     SEARCH
  ======================================================= */

  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id !==
        "teacherAttendanceSearch"
      ){
        return;
      }


      teacherAttendanceWorkspaceState
        .search =
          event.target.value ||
          "";


      renderTeacherAttendanceRoster();

    }
  );


  /* =======================================================
     CLASS + DATE
  ======================================================= */

  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherAttendanceClassFilter"
      ){

        teacherAttendanceWorkspaceState
          .classId =
            event.target.value ||
            "all";


        state.selectedClassId =
          teacherAttendanceWorkspaceState
            .classId ===
            "all"
            ? null
            : teacherAttendanceWorkspaceState
                .classId;


        closeTeacherAttendanceHistory();


        renderTeacherAttendanceSummary();


        renderTeacherAttendanceBulkActions();


        renderTeacherAttendanceRoster();


        return;

      }


      if (
        event.target?.id ===
        "teacherAttendanceDate"
      ){

        teacherAttendanceWorkspaceState
          .date =
            event.target.value ||
            new Date()
              .toISOString()
              .slice(
                0,
                10
              );


        renderTeacherAttendanceSummary();


        renderTeacherAttendanceRoster();

      }

    }
  );


  /* =======================================================
     INDIVIDUAL STATUS BUTTONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-attendance-status]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      updateTeacherAttendanceStatus(
        button.dataset
          .studentId,
        button.dataset
          .teacherAttendanceStatus,
        button
      );

    }
  );


  /* =======================================================
     BULK STATUS BUTTONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-attendance-bulk]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      saveTeacherBulkAttendance(
        button.dataset
          .teacherAttendanceBulk
      );

    }
  );


  /* =======================================================
     OTHER ATTENDANCE ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-attendance-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherAttendanceAction ||
          ""
        )
          .trim()
          .toLowerCase();


      switch(
        action
      ){

        case "today":

          teacherAttendanceWorkspaceState
            .date =
              new Date()
                .toISOString()
                .slice(
                  0,
                  10
                );


          renderTeacherAttendanceToolbar();


          renderTeacherAttendanceSummary();


          renderTeacherAttendanceRoster();


          break;


        case "refresh":

          refreshTeacherAttendance();


          break;


        case "student":

          teacherAttendanceWorkspaceState
            .selectedStudentId =
              normalizeId(
                button.dataset
                  .studentId
              );


          renderTeacherAttendanceStudentHistory(
            teacherAttendanceWorkspaceState
              .selectedStudentId
          );


          break;


        case "close-history":

          closeTeacherAttendanceHistory();


          break;

      }

    }
  );

}


/* =========================================================
   INITIALIZE ATTENDANCE WORKSPACE
========================================================= */

function initializeTeacherAttendanceWorkspace(){

  bindTeacherAttendanceControls();


  if (
    state.me
  ){

    renderTeacherAttendanceWorkspace();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 10
   SUBMISSIONS + GRADING CENTER
========================================================= */


/* =========================================================
   GRADING WORKSPACE STATE
========================================================= */

const teacherGradingWorkspaceState = {

  classId:
    "all",

  assignmentId:
    "all",

  status:
    "all",

  search:
    "",

  selectedSubmissionId:
    null,

  saving:
    false,

  loading:
    false,

  kabezyaLoading:
    false,

  kabezyaSuggestion:
    null

};


/* =========================================================
   NORMALIZE SUBMISSION STATUS
========================================================= */

function normalizeTeacherSubmissionStatus(
  value
){

  const status =
    String(
      value ||
      "submitted"
    )
      .trim()
      .toLowerCase();


  if (
    [
      "submitted",
      "reviewed",
      "returned"
    ].includes(
      status
    )
  ){

    return status;

  }


  return "submitted";

}


/* =========================================================
   SUBMISSION STATUS LABEL
========================================================= */

function getTeacherSubmissionStatusLabel(
  value
){

  const status =
    normalizeTeacherSubmissionStatus(
      value
    );


  switch(
    status
  ){

    case "reviewed":
      return "Reviewed";

    case "returned":
      return "Returned";

    case "submitted":
    default:
      return "Submitted";

  }

}


/* =========================================================
   GET SUBMISSION ID
========================================================= */

function getTeacherSubmissionId(
  submission
){

  return normalizeId(
    submission?._id ||
    submission?.id
  );

}


/* =========================================================
   GET SUBMISSION CLASS ID
========================================================= */

function getTeacherSubmissionClassId(
  submission
){

  return normalizeId(
    submission?.classId?._id ||
    submission?.classId
  );

}


/* =========================================================
   GET SUBMISSION ASSIGNMENT ID
========================================================= */

function getTeacherSubmissionAssignmentId(
  submission
){

  return normalizeId(
    submission?.assignmentId?._id ||
    submission?.assignmentId
  );

}


/* =========================================================
   GET SUBMISSION STUDENT ID
========================================================= */

function getTeacherSubmissionStudentId(
  submission
){

  return normalizeId(
    submission?.studentId?._id ||
    submission?.studentId
  );

}


/* =========================================================
   FIND SUBMISSION
========================================================= */

function getTeacherSubmissionById(
  submissionId
){

  return (
    asArray(
      state.submissions
    )
      .find(
        submission =>
          sameId(
            getTeacherSubmissionId(
              submission
            ),
            submissionId
          )
      ) ||
    null
  );

}


/* =========================================================
   GET SUBMISSION STUDENT
========================================================= */

function getTeacherSubmissionStudent(
  submission
){

  if (
    submission?.studentId &&
    typeof submission.studentId ===
      "object"
  ){

    return submission.studentId;

  }


  return getTeacherStudentById(
    getTeacherSubmissionStudentId(
      submission
    )
  );

}


/* =========================================================
   GET SUBMISSION ASSIGNMENT
========================================================= */

function getTeacherSubmissionAssignment(
  submission
){

  if (
    submission?.assignmentId &&
    typeof submission.assignmentId ===
      "object"
  ){

    return submission.assignmentId;

  }


  const assignmentId =
    getTeacherSubmissionAssignmentId(
      submission
    );


  return (
    asArray(
      state.assignments
    )
      .find(
        assignment =>
          sameId(
            assignment?._id ||
            assignment?.id,
            assignmentId
          )
      ) ||
    null
  );

}


/* =========================================================
   GET SUBMISSION CLASS
========================================================= */

function getTeacherSubmissionClass(
  submission
){

  if (
    submission?.classId &&
    typeof submission.classId ===
      "object"
  ){

    return submission.classId;

  }


  return getTeacherClassById(
    getTeacherSubmissionClassId(
      submission
    )
  );

}


/* =========================================================
   ASSIGNMENT TITLE
========================================================= */

function getTeacherAssignmentTitle(
  assignment
){

  return (
    assignment?.title ||
    assignment?.name ||
    "Untitled assignment"
  );

}


/* =========================================================
   SUBMISSION DATE
========================================================= */

function getTeacherSubmissionDate(
  submission
){

  return (
    submission?.submittedAt ||
    submission?.createdAt ||
    null
  );

}


/* =========================================================
   FILTER TEACHER SUBMISSIONS
========================================================= */

function getTeacherFilteredSubmissions(){

  let submissions =
    [
      ...asArray(
        state.submissions
      )
    ];


  const classId =
    teacherGradingWorkspaceState
      .classId;


  const assignmentId =
    teacherGradingWorkspaceState
      .assignmentId;


  const status =
    teacherGradingWorkspaceState
      .status;


  const search =
    String(
      teacherGradingWorkspaceState
        .search ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    classId &&
    classId !==
    "all"
  ){

    submissions =
      submissions.filter(
        submission =>
          sameId(
            getTeacherSubmissionClassId(
              submission
            ),
            classId
          )
      );

  }


  if (
    assignmentId &&
    assignmentId !==
    "all"
  ){

    submissions =
      submissions.filter(
        submission =>
          sameId(
            getTeacherSubmissionAssignmentId(
              submission
            ),
            assignmentId
          )
      );

  }


  if (
    status &&
    status !==
    "all"
  ){

    submissions =
      submissions.filter(
        submission =>
          normalizeTeacherSubmissionStatus(
            submission?.status
          ) ===
          status
      );

  }


  if (
    search
  ){

    submissions =
      submissions.filter(
        submission => {

          const student =
            getTeacherSubmissionStudent(
              submission
            );


          const assignment =
            getTeacherSubmissionAssignment(
              submission
            );


          const classItem =
            getTeacherSubmissionClass(
              submission
            );


          const haystack =
            [
              getTeacherDisplayName(
                student
              ),

              student?.email,

              getTeacherAssignmentTitle(
                assignment
              ),

              getTeacherClassTitle(
                classItem
              ),

              submission?.text,

              submission?.feedback
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  submissions.sort(
    (
      first,
      second
    ) =>
      new Date(
        getTeacherSubmissionDate(
          second
        ) ||
        0
      )
        .getTime() -
      new Date(
        getTeacherSubmissionDate(
          first
        ) ||
        0
      )
        .getTime()
  );


  return submissions;

}


/* =========================================================
   SUBMISSION SUMMARY
========================================================= */

function getTeacherSubmissionSummary(){

  const submissions =
    getTeacherFilteredSubmissions();


  return {

    total:
      submissions.length,

    submitted:
      submissions.filter(
        submission =>
          normalizeTeacherSubmissionStatus(
            submission?.status
          ) ===
          "submitted"
      ).length,

    reviewed:
      submissions.filter(
        submission =>
          normalizeTeacherSubmissionStatus(
            submission?.status
          ) ===
          "reviewed"
      ).length,

    returned:
      submissions.filter(
        submission =>
          normalizeTeacherSubmissionStatus(
            submission?.status
          ) ===
          "returned"
      ).length

  };

}


/* =========================================================
   GRADING HEADER
========================================================= */

function renderTeacherGradingHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherGradingHeader",
      "gradingWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Submissions & grading
        </h1>

        <p>
          Review student work,
          provide feedback and manage
          assignment grades from one workspace.
        </p>

      </div>


      <div
        class="teacher-workspace-heading-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-grading-action="refresh"
        >
          <i
            class="fa-solid fa-rotate"
          ></i>

          Refresh
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   GRADING FILTER ASSIGNMENTS
========================================================= */

function getTeacherGradingAssignments(){

  let assignments =
    [
      ...asArray(
        state.assignments
      )
    ];


  const classId =
    teacherGradingWorkspaceState
      .classId;


  if (
    classId &&
    classId !==
    "all"
  ){

    assignments =
      assignments.filter(
        assignment =>
          sameId(
            assignment?.classId?._id ||
            assignment?.classId,
            classId
          )
      );

  }


  return assignments;

}


/* =========================================================
   GRADING TOOLBAR
========================================================= */

function renderTeacherGradingToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherGradingToolbar",
      "gradingWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  const assignments =
    getTeacherGradingAssignments();


  container.innerHTML = `

    <select
      id="teacherGradingClassFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All classes
      </option>

      ${
        classes
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    classId
                  )}"
                  ${
                    sameId(
                      teacherGradingWorkspaceState
                        .classId,
                      classId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <select
      id="teacherGradingAssignmentFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All assignments
      </option>

      ${
        assignments
          .map(
            assignment => {

              const assignmentId =
                normalizeId(
                  assignment?._id ||
                  assignment?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    assignmentId
                  )}"
                  ${
                    sameId(
                      teacherGradingWorkspaceState
                        .assignmentId,
                      assignmentId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherAssignmentTitle(
                      assignment
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <select
      id="teacherGradingStatusFilter"
      class="teacher-workspace-select"
    >

      <option
        value="all"
        ${
          teacherGradingWorkspaceState
            .status ===
            "all"
            ? "selected"
            : ""
        }
      >
        All statuses
      </option>

      <option
        value="submitted"
        ${
          teacherGradingWorkspaceState
            .status ===
            "submitted"
            ? "selected"
            : ""
        }
      >
        Needs review
      </option>

      <option
        value="reviewed"
        ${
          teacherGradingWorkspaceState
            .status ===
            "reviewed"
            ? "selected"
            : ""
        }
      >
        Reviewed
      </option>

      <option
        value="returned"
        ${
          teacherGradingWorkspaceState
            .status ===
            "returned"
            ? "selected"
            : ""
        }
      >
        Returned
      </option>

    </select>


    <div
      class="teacher-grading-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
      ></i>

      <input
        id="teacherGradingSearch"
        type="search"
        placeholder="Search student or assignment..."
        value="${escapeHtml(
          teacherGradingWorkspaceState
            .search
        )}"
      />

    </div>

  `;

}


/* =========================================================
   GRADING SUMMARY
========================================================= */

function renderTeacherGradingSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherGradingSummary",
      "gradingWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const summary =
    getTeacherSubmissionSummary();


  container.innerHTML = `

    <article
      class="teacher-grading-summary-card"
    >
      <i
        class="fa-solid fa-file-lines"
      ></i>

      <span>
        <strong>
          ${summary.total}
        </strong>

        <small>
          Submissions
        </small>
      </span>
    </article>


    <article
      class="teacher-grading-summary-card is-pending"
    >
      <i
        class="fa-solid fa-hourglass-half"
      ></i>

      <span>
        <strong>
          ${summary.submitted}
        </strong>

        <small>
          Needs review
        </small>
      </span>
    </article>


    <article
      class="teacher-grading-summary-card is-reviewed"
    >
      <i
        class="fa-solid fa-circle-check"
      ></i>

      <span>
        <strong>
          ${summary.reviewed}
        </strong>

        <small>
          Reviewed
        </small>
      </span>
    </article>


    <article
      class="teacher-grading-summary-card is-returned"
    >
      <i
        class="fa-solid fa-rotate-left"
      ></i>

      <span>
        <strong>
          ${summary.returned}
        </strong>

        <small>
          Returned
        </small>
      </span>
    </article>

  `;

}


/* =========================================================
   CREATE SUBMISSION LIST ITEM
========================================================= */

function createTeacherSubmissionListItem(
  submission
){

  const submissionId =
    getTeacherSubmissionId(
      submission
    );


  const student =
    getTeacherSubmissionStudent(
      submission
    );


  const assignment =
    getTeacherSubmissionAssignment(
      submission
    );


  const classItem =
    getTeacherSubmissionClass(
      submission
    );


  const status =
    normalizeTeacherSubmissionStatus(
      submission?.status
    );


  const selected =
    sameId(
      teacherGradingWorkspaceState
        .selectedSubmissionId,
      submissionId
    );


  return `
    <button
      type="button"
      class="
        teacher-submission-list-item
        ${
          selected
            ? "active"
            : ""
        }
      "
      data-teacher-submission-id="${escapeHtml(
        submissionId
      )}"
    >

      <img
        src="${escapeHtml(
          getTeacherStudentAvatar(
            student
          )
        )}"
        alt="${escapeHtml(
          getTeacherDisplayName(
            student
          )
        )}"
      />


      <span
        class="teacher-submission-list-copy"
      >

        <span
          class="teacher-submission-list-top"
        >

          <strong>
            ${escapeHtml(
              getTeacherDisplayName(
                student
              )
            )}
          </strong>

          <small>
            ${escapeHtml(
              formatTeacherRelativeTime(
                getTeacherSubmissionDate(
                  submission
                )
              )
            )}
          </small>

        </span>


        <span
          class="teacher-submission-assignment"
        >
          ${escapeHtml(
            getTeacherAssignmentTitle(
              assignment
            )
          )}
        </span>


        <span
          class="teacher-submission-class"
        >
          ${escapeHtml(
            getTeacherClassTitle(
              classItem
            )
          )}
        </span>


        <span
          class="
            teacher-submission-status
            is-${escapeHtml(
              status
            )}
          "
        >
          ${escapeHtml(
            getTeacherSubmissionStatusLabel(
              status
            )
          )}
        </span>

      </span>

    </button>
  `;

}


/* =========================================================
   RENDER SUBMISSION LIST
========================================================= */

function renderTeacherSubmissionList(){

  const container =
    getTeacherOverviewElement(
      "teacherSubmissionList",
      "gradingSubmissionList"
    );


  if (
    !container
  ){
    return;
  }


  const submissions =
    getTeacherFilteredSubmissions();


  if (
    !submissions.length
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-solid fa-inbox"
          ></i>
        </div>

        <h3>
          No submissions found
        </h3>

        <p>
          Student submissions matching
          your current filters will appear here.
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML =
    submissions
      .map(
        createTeacherSubmissionListItem
      )
      .join(
        ""
      );

}


/* =========================================================
   EMPTY GRADING VIEWER
========================================================= */

function renderTeacherEmptySubmissionViewer(){

  const container =
    getTeacherOverviewElement(
      "teacherSubmissionViewer",
      "gradingSubmissionViewer"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-empty teacher-submission-empty"
    >

      <div
        class="teacher-workspace-empty-icon"
      >
        <i
          class="fa-solid fa-file-circle-check"
        ></i>
      </div>

      <h3>
        Select a submission
      </h3>

      <p>
        Choose a student submission from the list
        to inspect the work, grade it and provide feedback.
      </p>

    </div>
  `;

}


/* =========================================================
   SUBMISSION FILE URL
========================================================= */

function getTeacherSubmissionFileUrl(
  submission
){

  return (
    submission?.fileUrl ||
    submission?.attachmentUrl ||
    submission?.documentUrl ||
    ""
  );

}


/* =========================================================
   FILE NAME FROM URL
========================================================= */

function getTeacherSubmissionFileName(
  url
){

  if (
    !url
  ){
    return "Student attachment";
  }


  try{

    const pathname =
      new URL(
        url,
        window.location.origin
      )
        .pathname;


    const fileName =
      pathname
        .split(
          "/"
        )
        .filter(
          Boolean
        )
        .pop();


    return decodeURIComponent(
      fileName ||
      "Student attachment"
    );

  }catch(
    error
  ){

    return (
      String(
        url
      )
        .split(
          "/"
        )
        .pop() ||
      "Student attachment"
    );

  }

}


/* =========================================================
   SUBMISSION FILE TYPE
========================================================= */

function getTeacherSubmissionFileType(
  url
){

  const cleanUrl =
    String(
      url ||
      ""
    )
      .split(
        "?"
      )[0]
      .toLowerCase();


  if (
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(
      cleanUrl
    )
  ){

    return "image";

  }


  if (
    /\.pdf$/.test(
      cleanUrl
    )
  ){

    return "pdf";

  }


  if (
    /\.(mp4|webm|ogg|mov)$/.test(
      cleanUrl
    )
  ){

    return "video";

  }


  return "file";

}


/* =========================================================
   SUBMISSION ATTACHMENT PREVIEW
========================================================= */

function renderTeacherSubmissionAttachment(
  submission
){

  const fileUrl =
    getTeacherSubmissionFileUrl(
      submission
    );


  if (
    !fileUrl
  ){

    return `
      <div
        class="teacher-submission-no-attachment"
      >
        <i
          class="fa-regular fa-file"
        ></i>

        <span>
          No attachment was submitted.
        </span>
      </div>
    `;

  }


  const type =
    getTeacherSubmissionFileType(
      fileUrl
    );


  const safeUrl =
    escapeHtml(
      fileUrl
    );


  const fileName =
    escapeHtml(
      getTeacherSubmissionFileName(
        fileUrl
      )
    );


  if (
    type ===
    "image"
  ){

    return `
      <div
        class="teacher-submission-image-preview"
      >

        <img
          src="${safeUrl}"
          alt="${fileName}"
        />

        <a
          href="${safeUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="teacher-secondary-button"
        >
          <i
            class="fa-solid fa-up-right-from-square"
          ></i>

          Open image
        </a>

      </div>
    `;

  }


  if (
    type ===
    "pdf"
  ){

    return `
      <div
        class="teacher-submission-pdf-preview"
      >

        <iframe
          src="${safeUrl}"
          title="${fileName}"
          loading="lazy"
        ></iframe>

        <a
          href="${safeUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="teacher-secondary-button"
        >
          <i
            class="fa-solid fa-up-right-from-square"
          ></i>

          Open PDF
        </a>

      </div>
    `;

  }


  if (
    type ===
    "video"
  ){

    return `
      <div
        class="teacher-submission-video-preview"
      >

        <video
          controls
          preload="metadata"
        >
          <source
            src="${safeUrl}"
          />
        </video>

        <a
          href="${safeUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="teacher-secondary-button"
        >
          Open video
        </a>

      </div>
    `;

  }


  return `
    <a
      href="${safeUrl}"
      target="_blank"
      rel="noopener noreferrer"
      class="teacher-submission-file-card"
    >

      <i
        class="fa-solid fa-file-arrow-down"
      ></i>

      <span>

        <strong>
          ${fileName}
        </strong>

        <small>
          Open student attachment
        </small>

      </span>

      <i
        class="fa-solid fa-arrow-up-right-from-square"
      ></i>

    </a>
  `;

}


/* =========================================================
   KABEZYA GRADING SUGGESTION
========================================================= */

function renderTeacherKabezyaGradingSuggestion(){

  const suggestion =
    teacherGradingWorkspaceState
      .kabezyaSuggestion;


  if (
    teacherGradingWorkspaceState
      .kabezyaLoading
  ){

    return `
      <div
        class="teacher-kabezya-grading-result is-loading"
      >

        <div
          class="teacher-kabezya-grading-icon"
        >
          <i
            class="fa-solid fa-spinner fa-spin"
          ></i>
        </div>

        <div>

          <strong>
            Kabezya is inspecting the work
          </strong>

          <p>
            Reviewing the submission,
            assignment instructions and available
            student context.
          </p>

        </div>

      </div>
    `;

  }


  if (
    !suggestion
  ){

    return `
      <div
        class="teacher-kabezya-grading-empty"
      >

        <i
          class="fa-solid fa-wand-magic-sparkles"
        ></i>

        <div>

          <strong>
            Kabezya grading assistant
          </strong>

          <p>
            Ask Kabezya to inspect this submission
            and prepare a suggested score and feedback.
            You remain responsible for the final grade.
          </p>

        </div>

      </div>
    `;

  }


  return `
    <div
      class="teacher-kabezya-grading-result"
    >

      <div
        class="teacher-kabezya-grading-result-head"
      >

        <div>

          <span>
            Kabezya suggestion
          </span>

          <strong>
            AI-assisted review
          </strong>

        </div>


        ${
          suggestion.score !==
          undefined &&
          suggestion.score !==
          null
            ? `
              <span
                class="teacher-kabezya-score"
              >
                ${escapeHtml(
                  suggestion.score
                )}
              </span>
            `
            : ""
        }

      </div>


      ${
        suggestion.summary
          ? `
            <div
              class="teacher-kabezya-grading-section"
            >

              <strong>
                Assessment
              </strong>

              <p>
                ${escapeHtml(
                  suggestion.summary
                )}
              </p>

            </div>
          `
          : ""
      }


      ${
        Array.isArray(
          suggestion.strengths
        ) &&
        suggestion.strengths.length
          ? `
            <div
              class="teacher-kabezya-grading-section"
            >

              <strong>
                Strengths
              </strong>

              <ul>
                ${
                  suggestion.strengths
                    .map(
                      item => `
                        <li>
                          ${escapeHtml(
                            item
                          )}
                        </li>
                      `
                    )
                    .join(
                      ""
                    )
                }
              </ul>

            </div>
          `
          : ""
      }


      ${
        Array.isArray(
          suggestion.improvements
        ) &&
        suggestion.improvements.length
          ? `
            <div
              class="teacher-kabezya-grading-section"
            >

              <strong>
                Areas to improve
              </strong>

              <ul>
                ${
                  suggestion.improvements
                    .map(
                      item => `
                        <li>
                          ${escapeHtml(
                            item
                          )}
                        </li>
                      `
                    )
                    .join(
                      ""
                    )
                }
              </ul>

            </div>
          `
          : ""
      }


      ${
        suggestion.feedback
          ? `
            <div
              class="teacher-kabezya-grading-section"
            >

              <strong>
                Suggested feedback
              </strong>

              <p>
                ${escapeHtml(
                  suggestion.feedback
                )}
              </p>

            </div>
          `
          : ""
      }


      <div
        class="teacher-kabezya-grading-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-grading-action="apply-kabezya"
        >
          <i
            class="fa-solid fa-check"
          ></i>

          Use suggestion
        </button>


        <button
          type="button"
          class="teacher-text-button"
          data-teacher-grading-action="clear-kabezya"
        >
          Dismiss
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   RENDER SELECTED SUBMISSION
========================================================= */

function renderTeacherSubmissionViewer(){

  const container =
    getTeacherOverviewElement(
      "teacherSubmissionViewer",
      "gradingSubmissionViewer"
    );


  if (
    !container
  ){
    return;
  }


  const submission =
    getTeacherSubmissionById(
      teacherGradingWorkspaceState
        .selectedSubmissionId
    );


  if (
    !submission
  ){

    renderTeacherEmptySubmissionViewer();

    return;

  }


  const student =
    getTeacherSubmissionStudent(
      submission
    );


  const assignment =
    getTeacherSubmissionAssignment(
      submission
    );


  const classItem =
    getTeacherSubmissionClass(
      submission
    );


  const status =
    normalizeTeacherSubmissionStatus(
      submission?.status
    );


  const grade =
    submission?.grade ??
    "";


  const feedback =
    submission?.feedback ||
    "";


  container.innerHTML = `
    <section
      class="teacher-submission-viewer-panel"
    >

      <header
        class="teacher-submission-viewer-header"
      >

        <div
          class="teacher-submission-student"
        >

          <img
            src="${escapeHtml(
              getTeacherStudentAvatar(
                student
              )
            )}"
            alt="${escapeHtml(
              getTeacherDisplayName(
                student
              )
            )}"
          />


          <div>

            <span>
              Student submission
            </span>

            <h2>
              ${escapeHtml(
                getTeacherDisplayName(
                  student
                )
              )}
            </h2>

            <p>
              ${escapeHtml(
                student?.email ||
                "Student"
              )}
            </p>

          </div>

        </div>


        <span
          class="
            teacher-submission-status
            is-${escapeHtml(
              status
            )}
          "
        >
          ${escapeHtml(
            getTeacherSubmissionStatusLabel(
              status
            )
          )}
        </span>

      </header>


      <div
        class="teacher-submission-context"
      >

        <article>

          <span>
            Assignment
          </span>

          <strong>
            ${escapeHtml(
              getTeacherAssignmentTitle(
                assignment
              )
            )}
          </strong>

        </article>


        <article>

          <span>
            Class
          </span>

          <strong>
            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </strong>

        </article>


        <article>

          <span>
            Submitted
          </span>

          <strong>
            ${escapeHtml(
              formatTeacherDate(
                getTeacherSubmissionDate(
                  submission
                ),
                {
                  year:
                    "numeric"
                }
              )
            )}
          </strong>

        </article>

      </div>


      ${
        assignment?.instructions ||
        assignment?.description
          ? `
            <section
              class="teacher-submission-section"
            >

              <div
                class="teacher-submission-section-title"
              >
                <i
                  class="fa-solid fa-list-check"
                ></i>

                <h3>
                  Assignment instructions
                </h3>
              </div>

              <div
                class="teacher-submission-instructions"
              >
                ${escapeHtml(
                  assignment?.instructions ||
                  assignment?.description
                )}
              </div>

            </section>
          `
          : ""
      }


      <section
        class="teacher-submission-section"
      >

        <div
          class="teacher-submission-section-title"
        >
          <i
            class="fa-solid fa-align-left"
          ></i>

          <h3>
            Student response
          </h3>
        </div>


        ${
          submission?.text
            ? `
              <div
                class="teacher-submission-text"
              >
                ${escapeHtml(
                  submission.text
                )}
              </div>
            `
            : `
              <div
                class="teacher-inline-empty"
              >
                The student did not submit a written response.
              </div>
            `
        }

      </section>


      <section
        class="teacher-submission-section"
      >

        <div
          class="teacher-submission-section-title"
        >
          <i
            class="fa-solid fa-paperclip"
          ></i>

          <h3>
            Attachment
          </h3>
        </div>


        ${renderTeacherSubmissionAttachment(
          submission
        )}

      </section>


      <section
        class="teacher-submission-section teacher-kabezya-grading-card"
      >

        <div
          class="teacher-submission-section-title"
        >

          <i
            class="fa-solid fa-wand-magic-sparkles"
          ></i>

          <h3>
            Inspect with Kabezya
          </h3>


          <button
            type="button"
            class="teacher-primary-button"
            data-teacher-grading-action="inspect-kabezya"
            ${
              teacherGradingWorkspaceState
                .kabezyaLoading
                ? "disabled"
                : ""
            }
          >
            ${
              teacherGradingWorkspaceState
                .kabezyaLoading
                ? `
                  <i
                    class="fa-solid fa-spinner fa-spin"
                  ></i>

                  Inspecting...
                `
                : `
                  <i
                    class="fa-solid fa-wand-magic-sparkles"
                  ></i>

                  Inspect work
                `
            }
          </button>

        </div>


        <div
          id="teacherKabezyaGradingResult"
        >
          ${renderTeacherKabezyaGradingSuggestion()}
        </div>

      </section>


      <section
        class="teacher-submission-section teacher-grading-form-section"
      >

        <div
          class="teacher-submission-section-title"
        >
          <i
            class="fa-solid fa-marker"
          ></i>

          <h3>
            Teacher assessment
          </h3>
        </div>


        <div
          class="teacher-grading-form"
        >

          <label
            class="teacher-form-field"
          >

            <span>
              Grade
            </span>

            <input
              id="teacherSubmissionGrade"
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter grade"
              value="${escapeHtml(
                grade
              )}"
            />

          </label>


          <label
            class="teacher-form-field teacher-form-field-full"
          >

            <span>
              Feedback
            </span>

            <textarea
              id="teacherSubmissionFeedback"
              rows="7"
              placeholder="Write clear and constructive feedback for the student..."
            >${escapeHtml(
              feedback
            )}</textarea>

          </label>


          <label
            class="teacher-form-field"
          >

            <span>
              Final status
            </span>

            <select
              id="teacherSubmissionReviewStatus"
            >

              <option
                value="reviewed"
                ${
                  status ===
                  "reviewed"
                    ? "selected"
                    : ""
                }
              >
                Reviewed
              </option>

              <option
                value="returned"
                ${
                  status ===
                  "returned"
                    ? "selected"
                    : ""
                }
              >
                Return to student
              </option>

            </select>

          </label>

        </div>


        <div
          class="teacher-grading-form-actions"
        >

          <button
            type="button"
            class="teacher-primary-button"
            data-teacher-grading-action="save-review"
            ${
              teacherGradingWorkspaceState
                .saving
                ? "disabled"
                : ""
            }
          >
            <i
              class="fa-solid fa-floppy-disk"
            ></i>

            Save assessment
          </button>

        </div>

      </section>

    </section>
  `;

}


/* =========================================================
   SELECT SUBMISSION
========================================================= */

function selectTeacherSubmission(
  submissionId
){

  const submission =
    getTeacherSubmissionById(
      submissionId
    );


  if (
    !submission
  ){
    return;
  }


  teacherGradingWorkspaceState
    .selectedSubmissionId =
      getTeacherSubmissionId(
        submission
      );


  teacherGradingWorkspaceState
    .kabezyaSuggestion =
      null;


  teacherGradingWorkspaceState
    .kabezyaLoading =
      false;


  renderTeacherSubmissionList();


  renderTeacherSubmissionViewer();

}


/* =========================================================
   SAVE SUBMISSION REVIEW
========================================================= */

async function saveTeacherSubmissionReview(){

  if (
    teacherGradingWorkspaceState
      .saving
  ){
    return;
  }


  const submission =
    getTeacherSubmissionById(
      teacherGradingWorkspaceState
        .selectedSubmissionId
    );


  if (
    !submission
  ){

    showAlert(
      "error",
      "Please select a submission first."
    );


    return;
  }


  const gradeInput =
    document.getElementById(
      "teacherSubmissionGrade"
    );


  const feedbackInput =
    document.getElementById(
      "teacherSubmissionFeedback"
    );


  const statusInput =
    document.getElementById(
      "teacherSubmissionReviewStatus"
    );


  const rawGrade =
    String(
      gradeInput?.value ??
      ""
    )
      .trim();


  let grade =
    null;


  if (
    rawGrade !==
    ""
  ){

    grade =
      Number(
        rawGrade
      );


    if (
      !Number.isFinite(
        grade
      ) ||
      grade <
      0
    ){

      showAlert(
        "error",
        "Please enter a valid grade."
      );


      gradeInput?.focus();


      return;
    }

  }


  const feedback =
    String(
      feedbackInput?.value ||
      ""
    )
      .trim();


  const status =
    normalizeTeacherSubmissionStatus(
      statusInput?.value ||
      "reviewed"
    );


  if (
    ![
      "reviewed",
      "returned"
    ].includes(
      status
    )
  ){

    showAlert(
      "error",
      "Please select a valid review status."
    );


    return;
  }


  teacherGradingWorkspaceState
    .saving =
      true;


  renderTeacherSubmissionViewer();


  try{

    const response =
      await apiSend(
        `/api/submissions/${
          encodeURIComponent(
            getTeacherSubmissionId(
              submission
            )
          )
        }/review`,
        "PATCH",
        {
          grade,
          feedback,
          status
        }
      );


    const updatedSubmission =
      response?.submission ||
      response?.data ||
      response;


    if (
      updatedSubmission?._id
    ){

      const index =
        state.submissions
          .findIndex(
            item =>
              sameId(
                getTeacherSubmissionId(
                  item
                ),
                updatedSubmission._id
              )
          );


      if (
        index >=
        0
      ){

        state.submissions[
          index
        ] =
          updatedSubmission;

      }

    }else{

      await loadTeacherSubmissions();

    }


    calculateTeacherMetrics();


    showAlert(
      "success",
      status ===
      "returned"
        ? "The submission was returned to the student."
        : "The student assessment was saved.",
      {
        title:
          status ===
          "returned"
            ? "Work returned"
            : "Assessment saved"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Save submission review failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save this assessment."
    );

  }finally{

    teacherGradingWorkspaceState
      .saving =
        false;


    renderTeacherGradingSummary();


    renderTeacherSubmissionList();


    renderTeacherSubmissionViewer();


    renderTeacherDashboardStats();

  }

}


/* =========================================================
   BUILD KABEZYA SUBMISSION CONTEXT
========================================================= */

function buildTeacherKabezyaSubmissionContext(
  submission
){

  const student =
    getTeacherSubmissionStudent(
      submission
    );


  const assignment =
    getTeacherSubmissionAssignment(
      submission
    );


  const classItem =
    getTeacherSubmissionClass(
      submission
    );


  const studentId =
    getTeacherSubmissionStudentId(
      submission
    );


  return {

    submissionId:
      getTeacherSubmissionId(
        submission
      ),

    studentId,

    studentName:
      getTeacherDisplayName(
        student
      ),

    classId:
      getTeacherSubmissionClassId(
        submission
      ),

    classTitle:
      getTeacherClassTitle(
        classItem
      ),

    assignmentId:
      getTeacherSubmissionAssignmentId(
        submission
      ),

    assignmentTitle:
      getTeacherAssignmentTitle(
        assignment
      ),

    assignmentInstructions:
      assignment?.instructions ||
      assignment?.description ||
      "",

    studentResponse:
      submission?.text ||
      "",

    attachmentUrl:
      getTeacherSubmissionFileUrl(
        submission
      ),

    submittedAt:
      getTeacherSubmissionDate(
        submission
      ),

    attendanceRate:
      getTeacherStudentAttendanceRate(
        studentId
      ),

    previousGrade:
      submission?.grade ??
      null,

    previousFeedback:
      submission?.feedback ||
      ""

  };

}


/* =========================================================
   NORMALIZE KABEZYA GRADING RESULT
========================================================= */

function normalizeTeacherKabezyaGradingResult(
  result
){

  const source =
    result?.suggestion ||
    result?.analysis ||
    result?.data ||
    result ||
    {};


  let score =
    source?.score ??
    source?.suggestedGrade ??
    source?.grade ??
    null;


  if (
    score !==
    null &&
    score !==
    undefined &&
    score !==
    ""
  ){

    const numericScore =
      Number(
        score
      );


    score =
      Number.isFinite(
        numericScore
      )
        ? numericScore
        : null;

  }else{

    score =
      null;

  }


  const strengths =
    Array.isArray(
      source?.strengths
    )
      ? source.strengths
      : [];


  const improvements =
    Array.isArray(
      source?.improvements
    )
      ? source.improvements
      : (
          Array.isArray(
            source?.areasForImprovement
          )
            ? source.areasForImprovement
            : []
        );


  return {

    score,

    summary:
      source?.summary ||
      source?.assessment ||
      source?.analysisText ||
      "",

    feedback:
      source?.feedback ||
      source?.suggestedFeedback ||
      "",

    strengths,

    improvements

  };

}


/* =========================================================
   REQUEST KABEZYA INSPECTION
========================================================= */

async function inspectTeacherSubmissionWithKabezya(){

  if (
    teacherGradingWorkspaceState
      .kabezyaLoading
  ){
    return;
  }


  const submission =
    getTeacherSubmissionById(
      teacherGradingWorkspaceState
        .selectedSubmissionId
    );


  if (
    !submission
  ){

    showAlert(
      "error",
      "Please select a submission first."
    );


    return;
  }


  teacherGradingWorkspaceState
    .kabezyaLoading =
      true;


  teacherGradingWorkspaceState
    .kabezyaSuggestion =
      null;


  renderTeacherSubmissionViewer();


  try{

    const context =
      buildTeacherKabezyaSubmissionContext(
        submission
      );


    /*
      This calls the Kabezya teacher-assistance endpoint.

      The endpoint should only return a suggestion.
      It must NOT directly update the student's grade.

      The teacher reviews the suggestion and decides
      whether to apply it.
    */

    const response =
      await apiSend(
        "/api/kabezya/teacher/inspect-submission",
        "POST",
        {
          context
        }
      );


    teacherGradingWorkspaceState
      .kabezyaSuggestion =
        normalizeTeacherKabezyaGradingResult(
          response
        );

  }catch(
    error
  ){

    console.error(
      "Kabezya submission inspection failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "Kabezya could not inspect this submission."
    );

  }finally{

    teacherGradingWorkspaceState
      .kabezyaLoading =
        false;


    renderTeacherSubmissionViewer();

  }

}


/* =========================================================
   APPLY KABEZYA SUGGESTION
========================================================= */

function applyTeacherKabezyaGradingSuggestion(){

  const suggestion =
    teacherGradingWorkspaceState
      .kabezyaSuggestion;


  if (
    !suggestion
  ){
    return;
  }


  const gradeInput =
    document.getElementById(
      "teacherSubmissionGrade"
    );


  const feedbackInput =
    document.getElementById(
      "teacherSubmissionFeedback"
    );


  if (
    gradeInput &&
    suggestion.score !==
    null &&
    suggestion.score !==
    undefined
  ){

    gradeInput.value =
      suggestion.score;

  }


  if (
    feedbackInput &&
    suggestion.feedback
  ){

    feedbackInput.value =
      suggestion.feedback;

  }


  showAlert(
    "info",
    "Kabezya's suggestion was copied into the assessment fields. Review and edit it before saving.",
    {
      title:
        "Suggestion applied"
    }
  );

}


/* =========================================================
   CLEAR KABEZYA SUGGESTION
========================================================= */

function clearTeacherKabezyaGradingSuggestion(){

  teacherGradingWorkspaceState
    .kabezyaSuggestion =
      null;


  renderTeacherSubmissionViewer();

}


/* =========================================================
   REFRESH SUBMISSIONS
========================================================= */

async function refreshTeacherSubmissions(){

  if (
    teacherGradingWorkspaceState
      .loading
  ){
    return;
  }


  teacherGradingWorkspaceState
    .loading =
      true;


  try{

    await loadTeacherSubmissions();


    calculateTeacherMetrics();


    renderTeacherGradingWorkspace();


    showAlert(
      "success",
      "Student submissions are up to date.",
      {
        title:
          "Submissions refreshed"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Submission refresh failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not refresh submissions."
    );

  }finally{

    teacherGradingWorkspaceState
      .loading =
        false;

  }

}


/* =========================================================
   MAIN GRADING WORKSPACE
========================================================= */

function renderTeacherGradingWorkspace(){

  if (
    state.selectedClassId &&
    teacherGradingWorkspaceState
      .classId ===
      "all"
  ){

    teacherGradingWorkspaceState
      .classId =
        normalizeId(
          state.selectedClassId
        ) ||
        "all";

  }


  renderTeacherGradingHeader();


  renderTeacherGradingToolbar();


  renderTeacherGradingSummary();


  renderTeacherSubmissionList();


  if (
    teacherGradingWorkspaceState
      .selectedSubmissionId
  ){

    renderTeacherSubmissionViewer();

  }else{

    renderTeacherEmptySubmissionViewer();

  }

}


/* =========================================================
   COMPATIBILITY GRADING RENDERER
========================================================= */

function renderTeacherSubmissions(){

  renderTeacherGradingWorkspace();

}


/* =========================================================
   GRADING CONTROLS
========================================================= */

let teacherGradingControlsBound =
  false;


function bindTeacherGradingControls(){

  if (
    teacherGradingControlsBound
  ){
    return;
  }


  teacherGradingControlsBound =
    true;


  /* =======================================================
     SEARCH
  ======================================================= */

  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id !==
        "teacherGradingSearch"
      ){
        return;
      }


      teacherGradingWorkspaceState
        .search =
          event.target.value ||
          "";


      renderTeacherGradingSummary();


      renderTeacherSubmissionList();

    }
  );


  /* =======================================================
     FILTERS
  ======================================================= */

  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherGradingClassFilter"
      ){

        teacherGradingWorkspaceState
          .classId =
            event.target.value ||
            "all";


        teacherGradingWorkspaceState
          .assignmentId =
            "all";


        teacherGradingWorkspaceState
          .selectedSubmissionId =
            null;


        teacherGradingWorkspaceState
          .kabezyaSuggestion =
            null;


        renderTeacherGradingToolbar();


        renderTeacherGradingSummary();


        renderTeacherSubmissionList();


        renderTeacherEmptySubmissionViewer();


        return;

      }


      if (
        event.target?.id ===
        "teacherGradingAssignmentFilter"
      ){

        teacherGradingWorkspaceState
          .assignmentId =
            event.target.value ||
            "all";


        teacherGradingWorkspaceState
          .selectedSubmissionId =
            null;


        teacherGradingWorkspaceState
          .kabezyaSuggestion =
            null;


        renderTeacherGradingSummary();


        renderTeacherSubmissionList();


        renderTeacherEmptySubmissionViewer();


        return;

      }


      if (
        event.target?.id ===
        "teacherGradingStatusFilter"
      ){

        teacherGradingWorkspaceState
          .status =
            event.target.value ||
            "all";


        teacherGradingWorkspaceState
          .selectedSubmissionId =
            null;


        teacherGradingWorkspaceState
          .kabezyaSuggestion =
            null;


        renderTeacherGradingSummary();


        renderTeacherSubmissionList();


        renderTeacherEmptySubmissionViewer();

      }

    }
  );


  /* =======================================================
     SELECT SUBMISSION
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-submission-id]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      selectTeacherSubmission(
        button.dataset
          .teacherSubmissionId
      );

    }
  );


  /* =======================================================
     GRADING ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-grading-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherGradingAction ||
          ""
        )
          .trim()
          .toLowerCase();


      switch(
        action
      ){

        case "refresh":

          refreshTeacherSubmissions();

          break;


        case "save-review":

          saveTeacherSubmissionReview();

          break;


        case "inspect-kabezya":

          inspectTeacherSubmissionWithKabezya();

          break;


        case "apply-kabezya":

          applyTeacherKabezyaGradingSuggestion();

          break;


        case "clear-kabezya":

          clearTeacherKabezyaGradingSuggestion();

          break;

      }

    }
  );

}


/* =========================================================
   INITIALIZE GRADING WORKSPACE
========================================================= */

function initializeTeacherGradingWorkspace(){

  bindTeacherGradingControls();


  if (
    state.me
  ){

    renderTeacherGradingWorkspace();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 11
   SCHEDULE + LIVE CLASS WORKSPACE
========================================================= */


/* =========================================================
   SCHEDULE WORKSPACE STATE
========================================================= */

const teacherScheduleWorkspaceState = {

  classId: "all",

  view: "upcoming",

  selectedDate: "",

  selectedScheduleId: null,

  search: "",

  loading: false,

  saving: false,

  editorOpen: false

};


/* =========================================================
   NORMALIZE SCHEDULE ID
========================================================= */

function getTeacherScheduleId(
  schedule
){

  return normalizeId(
    schedule?._id ||
    schedule?.id
  );

}


/* =========================================================
   SCHEDULE CLASS ID
========================================================= */

function getTeacherScheduleClassId(
  schedule
){

  return normalizeId(
    schedule?.classId?._id ||
    schedule?.classId
  );

}


/* =========================================================
   SCHEDULE TEACHER ID
========================================================= */

function getTeacherScheduleTeacherId(
  schedule
){

  return normalizeId(
    schedule?.teacherId?._id ||
    schedule?.teacherId
  );

}


/* =========================================================
   SCHEDULE CLASS
========================================================= */

function getTeacherScheduleClass(
  schedule
){

  if (
    schedule?.classId &&
    typeof schedule.classId === "object"
  ){

    return schedule.classId;

  }


  return getTeacherClassById(
    getTeacherScheduleClassId(
      schedule
    )
  );

}


/* =========================================================
   FIND SCHEDULE
========================================================= */

function getTeacherScheduleById(
  scheduleId
){

  return (
    asArray(
      state.schedules
    )
      .find(
        schedule =>
          sameId(
            getTeacherScheduleId(
              schedule
            ),
            scheduleId
          )
      ) ||
    null
  );

}


/* =========================================================
   SCHEDULE DATE STRING
========================================================= */

function getTeacherScheduleDateString(
  schedule
){

  const value =
    schedule?.date ||
    schedule?.startDate ||
    schedule?.scheduledAt ||
    null;


  if (
    !value
  ){
    return "";
  }


  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      value.slice(
        0,
        10
      )
    )
  ){

    return value.slice(
      0,
      10
    );

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ){

    return "";

  }


  return date
    .toISOString()
    .slice(
      0,
      10
    );

}


/* =========================================================
   SCHEDULE START TIME
========================================================= */

function getTeacherScheduleStartTime(
  schedule
){

  return (
    schedule?.startTime ||
    schedule?.time ||
    ""
  );

}


/* =========================================================
   SCHEDULE END TIME
========================================================= */

function getTeacherScheduleEndTime(
  schedule
){

  return (
    schedule?.endTime ||
    ""
  );

}


/* =========================================================
   SCHEDULE TITLE
========================================================= */

function getTeacherScheduleTitle(
  schedule
){

  const classItem =
    getTeacherScheduleClass(
      schedule
    );


  return (
    schedule?.title ||
    getTeacherClassTitle(
      classItem
    ) ||
    "Class schedule"
  );

}


/* =========================================================
   SCHEDULE DATETIME
========================================================= */

function getTeacherScheduleDateTime(
  schedule
){

  const date =
    getTeacherScheduleDateString(
      schedule
    );


  if (
    !date
  ){
    return null;
  }


  const time =
    getTeacherScheduleStartTime(
      schedule
    ) ||
    "00:00";


  const parsed =
    new Date(
      `${date}T${time}`
    );


  if (
    Number.isNaN(
      parsed.getTime()
    )
  ){

    const fallback =
      new Date(
        date
      );


    return Number.isNaN(
      fallback.getTime()
    )
      ? null
      : fallback;

  }


  return parsed;

}


/* =========================================================
   SCHEDULE HAS ENDED
========================================================= */

function hasTeacherScheduleEnded(
  schedule
){

  const date =
    getTeacherScheduleDateString(
      schedule
    );


  if (
    !date
  ){
    return false;
  }


  const endTime =
    getTeacherScheduleEndTime(
      schedule
    );


  if (
    endTime
  ){

    const end =
      new Date(
        `${date}T${endTime}`
      );


    if (
      !Number.isNaN(
        end.getTime()
      )
    ){

      return end.getTime() <
        Date.now();

    }

  }


  const start =
    getTeacherScheduleDateTime(
      schedule
    );


  if (
    !start
  ){
    return false;
  }


  /*
    If no explicit end time exists,
    treat the schedule as past after
    three hours.
  */

  return (
    start.getTime() +
    (
      3 *
      60 *
      60 *
      1000
    )
  ) <
  Date.now();

}


/* =========================================================
   SCHEDULE IS TODAY
========================================================= */

function isTeacherScheduleToday(
  schedule
){

  const date =
    getTeacherScheduleDateString(
      schedule
    );


  if (
    !date
  ){
    return false;
  }


  const today =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );


  return date === today;

}


/* =========================================================
   SCHEDULE IS UPCOMING
========================================================= */

function isTeacherScheduleUpcoming(
  schedule
){

  const start =
    getTeacherScheduleDateTime(
      schedule
    );


  if (
    !start
  ){
    return false;
  }


  if (
    hasTeacherScheduleEnded(
      schedule
    )
  ){
    return false;
  }


  return true;

}


/* =========================================================
   SCHEDULE STATUS
========================================================= */

function getTeacherScheduleStatus(
  schedule
){

  const explicitStatus =
    String(
      schedule?.status ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    [
      "cancelled",
      "canceled"
    ].includes(
      explicitStatus
    )
  ){

    return "cancelled";

  }


  if (
    explicitStatus ===
    "completed"
  ){

    return "completed";

  }


  if (
    hasTeacherScheduleEnded(
      schedule
    )
  ){

    return "completed";

  }


  if (
    isTeacherScheduleToday(
      schedule
    )
  ){

    return "today";

  }


  return "upcoming";

}


/* =========================================================
   SCHEDULE STATUS LABEL
========================================================= */

function getTeacherScheduleStatusLabel(
  schedule
){

  const status =
    getTeacherScheduleStatus(
      schedule
    );


  switch(
    status
  ){

    case "today":
      return "Today";

    case "completed":
      return "Completed";

    case "cancelled":
      return "Cancelled";

    default:
      return "Upcoming";

  }

}


/* =========================================================
   FORMAT SCHEDULE TIME
========================================================= */

function formatTeacherScheduleTime(
  time
){

  if (
    !time
  ){
    return "Time not set";
  }


  const parts =
    String(
      time
    )
      .split(
        ":"
      );


  const hour =
    Number(
      parts[0]
    );


  const minute =
    Number(
      parts[1] ||
      0
    );


  if (
    !Number.isFinite(
      hour
    )
  ){

    return String(
      time
    );

  }


  const date =
    new Date();


  date.setHours(
    hour,
    minute,
    0,
    0
  );


  return date.toLocaleTimeString(
    [],
    {
      hour: "numeric",
      minute: "2-digit"
    }
  );

}


/* =========================================================
   SCHEDULE TIME RANGE
========================================================= */

function getTeacherScheduleTimeRange(
  schedule
){

  const start =
    getTeacherScheduleStartTime(
      schedule
    );


  const end =
    getTeacherScheduleEndTime(
      schedule
    );


  if (
    !start
  ){

    return "Time not set";

  }


  if (
    !end
  ){

    return formatTeacherScheduleTime(
      start
    );

  }


  return `${
    formatTeacherScheduleTime(
      start
    )
  } – ${
    formatTeacherScheduleTime(
      end
    )
  }`;

}


/* =========================================================
   FILTER SCHEDULES
========================================================= */

function getTeacherFilteredSchedules(){

  let schedules =
    [
      ...asArray(
        state.schedules
      )
    ];


  const classId =
    teacherScheduleWorkspaceState
      .classId;


  const view =
    teacherScheduleWorkspaceState
      .view;


  const selectedDate =
    teacherScheduleWorkspaceState
      .selectedDate;


  const search =
    String(
      teacherScheduleWorkspaceState
        .search ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    classId &&
    classId !== "all"
  ){

    schedules =
      schedules.filter(
        schedule =>
          sameId(
            getTeacherScheduleClassId(
              schedule
            ),
            classId
          )
      );

  }


  if (
    selectedDate
  ){

    schedules =
      schedules.filter(
        schedule =>
          getTeacherScheduleDateString(
            schedule
          ) === selectedDate
      );

  }


  if (
    view === "today"
  ){

    schedules =
      schedules.filter(
        isTeacherScheduleToday
      );

  }


  if (
    view === "upcoming"
  ){

    schedules =
      schedules.filter(
        schedule => {

          const status =
            getTeacherScheduleStatus(
              schedule
            );


          return (
            status === "today" ||
            status === "upcoming"
          );

        }
      );

  }


  if (
    view === "past"
  ){

    schedules =
      schedules.filter(
        schedule =>
          getTeacherScheduleStatus(
            schedule
          ) === "completed"
      );

  }


  if (
    search
  ){

    schedules =
      schedules.filter(
        schedule => {

          const classItem =
            getTeacherScheduleClass(
              schedule
            );


          const haystack =
            [
              getTeacherScheduleTitle(
                schedule
              ),

              getTeacherClassTitle(
                classItem
              ),

              schedule?.notes,

              schedule?.meetingLink
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  schedules.sort(
    (
      first,
      second
    ) => {

      const firstDate =
        getTeacherScheduleDateTime(
          first
        );


      const secondDate =
        getTeacherScheduleDateTime(
          second
        );


      const firstTime =
        firstDate?.getTime() ||
        0;


      const secondTime =
        secondDate?.getTime() ||
        0;


      if (
        view === "past"
      ){

        return secondTime -
          firstTime;

      }


      return firstTime -
        secondTime;

    }
  );


  return schedules;

}


/* =========================================================
   SCHEDULE SUMMARY
========================================================= */

function getTeacherScheduleSummary(){

  const schedules =
    asArray(
      state.schedules
    );


  return {

    total:
      schedules.length,

    today:
      schedules.filter(
        schedule =>
          getTeacherScheduleStatus(
            schedule
          ) === "today"
      ).length,

    upcoming:
      schedules.filter(
        schedule => {

          const status =
            getTeacherScheduleStatus(
              schedule
            );


          return (
            status === "today" ||
            status === "upcoming"
          );

        }
      ).length,

    completed:
      schedules.filter(
        schedule =>
          getTeacherScheduleStatus(
            schedule
          ) === "completed"
      ).length

  };

}


/* =========================================================
   SCHEDULE HEADER
========================================================= */

function renderTeacherScheduleHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherScheduleHeader",
      "scheduleWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Schedule & live classes
        </h1>

        <p>
          Manage your teaching schedule,
          upcoming sessions and class meeting links.
        </p>

      </div>


      <div
        class="teacher-workspace-heading-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-schedule-action="refresh"
        >
          <i
            class="fa-solid fa-rotate"
          ></i>

          Refresh
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-schedule-action="create"
        >
          <i
            class="fa-solid fa-plus"
          ></i>

          Add schedule
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   SCHEDULE SUMMARY RENDERER
========================================================= */

function renderTeacherScheduleSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherScheduleSummary",
      "scheduleWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const summary =
    getTeacherScheduleSummary();


  container.innerHTML = `

    <article
      class="teacher-schedule-summary-card"
    >

      <i
        class="fa-regular fa-calendar"
      ></i>

      <span>

        <strong>
          ${summary.total}
        </strong>

        <small>
          Total sessions
        </small>

      </span>

    </article>


    <article
      class="teacher-schedule-summary-card is-today"
    >

      <i
        class="fa-solid fa-video"
      ></i>

      <span>

        <strong>
          ${summary.today}
        </strong>

        <small>
          Today
        </small>

      </span>

    </article>


    <article
      class="teacher-schedule-summary-card is-upcoming"
    >

      <i
        class="fa-solid fa-clock"
      ></i>

      <span>

        <strong>
          ${summary.upcoming}
        </strong>

        <small>
          Upcoming
        </small>

      </span>

    </article>


    <article
      class="teacher-schedule-summary-card"
    >

      <i
        class="fa-solid fa-circle-check"
      ></i>

      <span>

        <strong>
          ${summary.completed}
        </strong>

        <small>
          Completed
        </small>

      </span>

    </article>

  `;

}


/* =========================================================
   SCHEDULE TOOLBAR
========================================================= */

function renderTeacherScheduleToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherScheduleToolbar",
      "scheduleWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  container.innerHTML = `

    <div
      class="teacher-schedule-view-tabs"
    >

      ${
        [
          [
            "upcoming",
            "Upcoming"
          ],
          [
            "today",
            "Today"
          ],
          [
            "all",
            "All"
          ],
          [
            "past",
            "Past"
          ]
        ]
          .map(
            item => `
              <button
                type="button"
                class="
                  teacher-schedule-view-tab
                  ${
                    teacherScheduleWorkspaceState
                      .view === item[0]
                      ? "active"
                      : ""
                  }
                "
                data-teacher-schedule-view="${item[0]}"
              >
                ${item[1]}
              </button>
            `
          )
          .join(
            ""
          )
      }

    </div>


    <select
      id="teacherScheduleClassFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All classes
      </option>

      ${
        classes
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    classId
                  )}"
                  ${
                    sameId(
                      teacherScheduleWorkspaceState
                        .classId,
                      classId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <label
      class="teacher-schedule-date-filter"
    >

      <i
        class="fa-regular fa-calendar"
      ></i>

      <input
        id="teacherScheduleDateFilter"
        type="date"
        value="${escapeHtml(
          teacherScheduleWorkspaceState
            .selectedDate
        )}"
      />

    </label>


    <div
      class="teacher-schedule-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
      ></i>

      <input
        id="teacherScheduleSearch"
        type="search"
        placeholder="Search schedule..."
        value="${escapeHtml(
          teacherScheduleWorkspaceState
            .search
        )}"
      />

    </div>


    ${
      teacherScheduleWorkspaceState
        .selectedDate
        ? `
          <button
            type="button"
            class="teacher-text-button"
            data-teacher-schedule-action="clear-date"
          >
            Clear date
          </button>
        `
        : ""
    }

  `;

}


/* =========================================================
   CREATE SCHEDULE CARD
========================================================= */

function createTeacherScheduleCard(
  schedule
){

  const scheduleId =
    getTeacherScheduleId(
      schedule
    );


  const classItem =
    getTeacherScheduleClass(
      schedule
    );


  const status =
    getTeacherScheduleStatus(
      schedule
    );


  const meetingLink =
    String(
      schedule?.meetingLink ||
      ""
    )
      .trim();


  const studentCount =
    getTeacherClassStudents(
      getTeacherScheduleClassId(
        schedule
      )
    ).length;


  return `
    <article
      class="
        teacher-schedule-card
        is-${escapeHtml(
          status
        )}
      "
    >

      <div
        class="teacher-schedule-date-box"
      >

        <span>
          ${escapeHtml(
            formatTeacherDate(
              schedule?.date,
              {
                month: "short"
              }
            )
          )}
        </span>

        <strong>
          ${escapeHtml(
            formatTeacherDate(
              schedule?.date,
              {
                day: "numeric"
              }
            )
          )}
        </strong>

      </div>


      <div
        class="teacher-schedule-card-main"
      >

        <div
          class="teacher-schedule-card-title-row"
        >

          <div>

            <span
              class="
                teacher-schedule-status
                is-${escapeHtml(
                  status
                )}
              "
            >
              ${escapeHtml(
                getTeacherScheduleStatusLabel(
                  schedule
                )
              )}
            </span>

            <h3>
              ${escapeHtml(
                getTeacherScheduleTitle(
                  schedule
                )
              )}
            </h3>

          </div>


          <button
            type="button"
            class="teacher-icon-button"
            data-teacher-schedule-action="edit"
            data-schedule-id="${escapeHtml(
              scheduleId
            )}"
            aria-label="Edit schedule"
          >
            <i
              class="fa-solid fa-pen"
            ></i>
          </button>

        </div>


        <div
          class="teacher-schedule-card-meta"
        >

          <span>
            <i
              class="fa-regular fa-clock"
            ></i>

            ${escapeHtml(
              getTeacherScheduleTimeRange(
                schedule
              )
            )}
          </span>


          <span>
            <i
              class="fa-solid fa-chalkboard"
            ></i>

            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </span>


          <span>
            <i
              class="fa-solid fa-user-graduate"
            ></i>

            ${studentCount}
            student${
              studentCount === 1
                ? ""
                : "s"
            }
          </span>

        </div>


        ${
          schedule?.notes
            ? `
              <p
                class="teacher-schedule-card-notes"
              >
                ${escapeHtml(
                  schedule.notes
                )}
              </p>
            `
            : ""
        }


        <div
          class="teacher-schedule-card-actions"
        >

          ${
            meetingLink &&
            status !== "completed" &&
            status !== "cancelled"
              ? `
                <button
                  type="button"
                  class="teacher-primary-button"
                  data-teacher-schedule-action="join"
                  data-schedule-id="${escapeHtml(
                    scheduleId
                  )}"
                >
                  <i
                    class="fa-solid fa-video"
                  ></i>

                  ${
                    status === "today"
                      ? "Start / join class"
                      : "Open meeting"
                  }
                </button>
              `
              : ""
          }


          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-schedule-action="class"
            data-class-id="${escapeHtml(
              getTeacherScheduleClassId(
                schedule
              )
            )}"
          >
            <i
              class="fa-solid fa-arrow-up-right-from-square"
            ></i>

            Open class
          </button>


          ${
            meetingLink
              ? `
                <button
                  type="button"
                  class="teacher-secondary-button"
                  data-teacher-schedule-action="copy-link"
                  data-schedule-id="${escapeHtml(
                    scheduleId
                  )}"
                >
                  <i
                    class="fa-regular fa-copy"
                  ></i>

                  Copy link
                </button>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;

}


/* =========================================================
   RENDER SCHEDULE LIST
========================================================= */

function renderTeacherScheduleList(){

  const container =
    getTeacherOverviewElement(
      "teacherScheduleList",
      "scheduleWorkspaceList"
    );


  if (
    !container
  ){
    return;
  }


  const schedules =
    getTeacherFilteredSchedules();


  if (
    !schedules.length
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-regular fa-calendar-xmark"
          ></i>
        </div>

        <h3>
          No scheduled classes
        </h3>

        <p>
          There are no teaching sessions
          matching your current filters.
        </p>

        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-schedule-action="create"
        >
          <i
            class="fa-solid fa-plus"
          ></i>

          Add schedule
        </button>

      </div>
    `;


    return;

  }


  container.innerHTML =
    schedules
      .map(
        createTeacherScheduleCard
      )
      .join(
        ""
      );

}


/* =========================================================
   SCHEDULE EDITOR CONTAINER
========================================================= */

function getTeacherScheduleEditorContainer(){

  return getTeacherOverviewElement(
    "teacherScheduleEditor",
    "scheduleWorkspaceEditor"
  );

}


/* =========================================================
   CLOSE SCHEDULE EDITOR
========================================================= */

function closeTeacherScheduleEditor(){

  teacherScheduleWorkspaceState
    .editorOpen =
      false;


  teacherScheduleWorkspaceState
    .selectedScheduleId =
      null;


  const container =
    getTeacherScheduleEditorContainer();


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   OPEN SCHEDULE EDITOR
========================================================= */

function openTeacherScheduleEditor(
  scheduleId = null
){

  const container =
    getTeacherScheduleEditorContainer();


  if (
    !container
  ){

    showAlert(
      "error",
      "The schedule editor container is missing from teacher.html."
    );


    return;
  }


  const schedule =
    scheduleId
      ? getTeacherScheduleById(
          scheduleId
        )
      : null;


  teacherScheduleWorkspaceState
    .editorOpen =
      true;


  teacherScheduleWorkspaceState
    .selectedScheduleId =
      schedule
        ? getTeacherScheduleId(
            schedule
          )
        : null;


  const classes =
    getTeacherClasses();


  const currentClassId =
    schedule
      ? getTeacherScheduleClassId(
          schedule
        )
      : (
          teacherScheduleWorkspaceState
            .classId !== "all"
            ? teacherScheduleWorkspaceState
                .classId
            : (
                state.selectedClassId ||
                ""
              )
        );


  container.hidden =
    false;


  container.innerHTML = `
    <div
      class="teacher-editor-overlay"
      data-teacher-schedule-action="close-editor"
    ></div>


    <section
      class="teacher-schedule-editor-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacherScheduleEditorTitle"
    >

      <header
        class="teacher-schedule-editor-header"
      >

        <div>

          <span>
            ${
              schedule
                ? "Edit session"
                : "New session"
            }
          </span>

          <h2
            id="teacherScheduleEditorTitle"
          >
            ${
              schedule
                ? "Update class schedule"
                : "Schedule a class"
            }
          </h2>

        </div>


        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-schedule-action="close-editor"
          aria-label="Close schedule editor"
        >
          <i
            class="fa-solid fa-xmark"
          ></i>
        </button>

      </header>


      <form
        id="teacherScheduleForm"
        class="teacher-schedule-editor-form"
      >

        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            Class
          </span>

          <select
            id="teacherScheduleEditorClass"
            required
          >

            <option value="">
              Select class
            </option>

            ${
              classes
                .map(
                  classItem => {

                    const classId =
                      normalizeId(
                        classItem?._id ||
                        classItem?.id
                      );


                    return `
                      <option
                        value="${escapeHtml(
                          classId
                        )}"
                        ${
                          sameId(
                            currentClassId,
                            classId
                          )
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          getTeacherClassTitle(
                            classItem
                          )
                        )}
                      </option>
                    `;

                  }
                )
                .join(
                  ""
                )
            }

          </select>

        </label>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            Session title
          </span>

          <input
            id="teacherScheduleEditorTitleInput"
            type="text"
            maxlength="150"
            placeholder="Example: Week 4 live class"
            value="${escapeHtml(
              schedule?.title ||
              ""
            )}"
          />

        </label>


        <div
          class="teacher-form-grid"
        >

          <label
            class="teacher-form-field"
          >

            <span>
              Date
            </span>

            <input
              id="teacherScheduleEditorDate"
              type="date"
              required
              value="${escapeHtml(
                schedule
                  ? getTeacherScheduleDateString(
                      schedule
                    )
                  : new Date()
                      .toISOString()
                      .slice(
                        0,
                        10
                      )
              )}"
            />

          </label>


          <label
            class="teacher-form-field"
          >

            <span>
              Start time
            </span>

            <input
              id="teacherScheduleEditorStartTime"
              type="time"
              required
              value="${escapeHtml(
                getTeacherScheduleStartTime(
                  schedule
                )
              )}"
            />

          </label>


          <label
            class="teacher-form-field"
          >

            <span>
              End time
            </span>

            <input
              id="teacherScheduleEditorEndTime"
              type="time"
              value="${escapeHtml(
                getTeacherScheduleEndTime(
                  schedule
                )
              )}"
            />

          </label>

        </div>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            Meeting link
          </span>

          <div
            class="teacher-input-with-icon"
          >

            <i
              class="fa-solid fa-link"
            ></i>

            <input
              id="teacherScheduleEditorMeetingLink"
              type="url"
              placeholder="https://..."
              value="${escapeHtml(
                schedule?.meetingLink ||
                ""
              )}"
            />

          </div>

          <small>
            Add the online classroom or video meeting URL.
          </small>

        </label>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            Notes
          </span>

          <textarea
            id="teacherScheduleEditorNotes"
            rows="5"
            maxlength="2000"
            placeholder="Optional information for this session..."
          >${escapeHtml(
            schedule?.notes ||
            ""
          )}</textarea>

        </label>


        <div
          class="teacher-schedule-editor-actions"
        >

          ${
            schedule
              ? `
                <button
                  type="button"
                  class="teacher-danger-button"
                  data-teacher-schedule-action="delete"
                  data-schedule-id="${escapeHtml(
                    getTeacherScheduleId(
                      schedule
                    )
                  )}"
                >
                  <i
                    class="fa-regular fa-trash-can"
                  ></i>

                  Delete
                </button>
              `
              : `
                <span></span>
              `
          }


          <div>

            <button
              type="button"
              class="teacher-secondary-button"
              data-teacher-schedule-action="close-editor"
            >
              Cancel
            </button>


            <button
              type="submit"
              class="teacher-primary-button"
              ${
                teacherScheduleWorkspaceState
                  .saving
                  ? "disabled"
                  : ""
              }
            >
              <i
                class="fa-solid fa-floppy-disk"
              ></i>

              ${
                schedule
                  ? "Save changes"
                  : "Create schedule"
              }
            </button>

          </div>

        </div>

      </form>

    </section>
  `;

}


/* =========================================================
   SAVE SCHEDULE
========================================================= */

async function saveTeacherSchedule(){

  if (
    teacherScheduleWorkspaceState
      .saving
  ){
    return;
  }


  const classId =
    normalizeId(
      document
        .getElementById(
          "teacherScheduleEditorClass"
        )
        ?.value
    );


  const title =
    String(
      document
        .getElementById(
          "teacherScheduleEditorTitleInput"
        )
        ?.value ||
      ""
    )
      .trim();


  const date =
    String(
      document
        .getElementById(
          "teacherScheduleEditorDate"
        )
        ?.value ||
      ""
    )
      .trim();


  const startTime =
    String(
      document
        .getElementById(
          "teacherScheduleEditorStartTime"
        )
        ?.value ||
      ""
    )
      .trim();


  const endTime =
    String(
      document
        .getElementById(
          "teacherScheduleEditorEndTime"
        )
        ?.value ||
      ""
    )
      .trim();


  const meetingLink =
    String(
      document
        .getElementById(
          "teacherScheduleEditorMeetingLink"
        )
        ?.value ||
      ""
    )
      .trim();


  const notes =
    String(
      document
        .getElementById(
          "teacherScheduleEditorNotes"
        )
        ?.value ||
      ""
    )
      .trim();


  if (
    !classId
  ){

    showAlert(
      "error",
      "Please select a class."
    );


    return;
  }


  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    showAlert(
      "error",
      "You do not have access to this class."
    );


    return;
  }


  if (
    !date
  ){

    showAlert(
      "error",
      "Please select the class date."
    );


    return;
  }


  if (
    !startTime
  ){

    showAlert(
      "error",
      "Please select a start time."
    );


    return;
  }


  if (
    endTime &&
    endTime <= startTime
  ){

    showAlert(
      "error",
      "The end time must be later than the start time."
    );


    return;
  }


  if (
    meetingLink
  ){

    try{

      const url =
        new URL(
          meetingLink
        );


      if (
        ![
          "http:",
          "https:"
        ].includes(
          url.protocol
        )
      ){

        throw new Error(
          "Unsupported protocol"
        );

      }

    }catch(
      error
    ){

      showAlert(
        "error",
        "Please enter a valid meeting URL."
      );


      return;

    }

  }


  teacherScheduleWorkspaceState
    .saving =
      true;


  const selectedScheduleId =
    teacherScheduleWorkspaceState
      .selectedScheduleId;


  try{

    const payload = {

      schoolId:
        getSchoolId(),

      classId,

      teacherId:
        getTeacherId(),

      title:
        title ||
        getTeacherClassTitle(
          classItem
        ),

      date,

      time:
        startTime,

      startTime,

      endTime:
        endTime ||
        null,

      meetingLink:
        meetingLink ||
        null,

      notes:
        notes ||
        null

    };


    let response;


    if (
      selectedScheduleId
    ){

      response =
        await apiSend(
          `/api/schedules/${
            encodeURIComponent(
              selectedScheduleId
            )
          }`,
          "PATCH",
          payload
        );

    }else{

      response =
        await apiSend(
          "/api/schedules",
          "POST",
          payload
        );

    }


    const savedSchedule =
      response?.schedule ||
      response?.data ||
      response;


    if (
      savedSchedule?._id
    ){

      const index =
        state.schedules
          .findIndex(
            schedule =>
              sameId(
                getTeacherScheduleId(
                  schedule
                ),
                savedSchedule._id
              )
          );


      if (
        index >= 0
      ){

        state.schedules[
          index
        ] =
          savedSchedule;

      }else{

        state.schedules.push(
          savedSchedule
        );

      }

    }else{

      await loadTeacherSchedules();

    }


    closeTeacherScheduleEditor();


    calculateTeacherMetrics();


    renderTeacherScheduleWorkspace();


    renderTeacherDashboardStats();


    showAlert(
      "success",
      selectedScheduleId
        ? "The class schedule was updated."
        : "The class session was scheduled.",
      {
        title:
          selectedScheduleId
            ? "Schedule updated"
            : "Class scheduled"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Save teacher schedule failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save this schedule."
    );

  }finally{

    teacherScheduleWorkspaceState
      .saving =
        false;

  }

}


/* =========================================================
   DELETE SCHEDULE
========================================================= */

async function deleteTeacherSchedule(
  scheduleId
){

  const schedule =
    getTeacherScheduleById(
      scheduleId
    );


  if (
    !schedule
  ){
    return;
  }


  const confirmed =
    window.confirm(
      `Delete "${
        getTeacherScheduleTitle(
          schedule
        )
      }"? This schedule will be removed.`
    );


  if (
    !confirmed
  ){
    return;
  }


  if (
    teacherScheduleWorkspaceState
      .saving
  ){
    return;
  }


  teacherScheduleWorkspaceState
    .saving =
      true;


  try{

    await apiSend(
      `/api/schedules/${
        encodeURIComponent(
          getTeacherScheduleId(
            schedule
          )
        )
      }`,
      "DELETE"
    );


    state.schedules =
      asArray(
        state.schedules
      )
        .filter(
          item =>
            !sameId(
              getTeacherScheduleId(
                item
              ),
              getTeacherScheduleId(
                schedule
              )
            )
        );


    closeTeacherScheduleEditor();


    calculateTeacherMetrics();


    renderTeacherScheduleWorkspace();


    renderTeacherDashboardStats();


    showAlert(
      "success",
      "The class schedule was deleted.",
      {
        title:
          "Schedule deleted"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Delete teacher schedule failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not delete this schedule."
    );

  }finally{

    teacherScheduleWorkspaceState
      .saving =
        false;

  }

}


/* =========================================================
   JOIN SCHEDULE
========================================================= */

function joinTeacherScheduledClass(
  scheduleId
){

  const schedule =
    getTeacherScheduleById(
      scheduleId
    );


  if (
    !schedule
  ){

    showAlert(
      "error",
      "This schedule could not be found."
    );


    return;
  }


  const meetingLink =
    String(
      schedule?.meetingLink ||
      ""
    )
      .trim();


  if (
    !meetingLink
  ){

    showAlert(
      "info",
      "No meeting link has been added to this session yet."
    );


    return;
  }


  try{

    const url =
      new URL(
        meetingLink
      );


    if (
      ![
        "http:",
        "https:"
      ].includes(
        url.protocol
      )
    ){

      throw new Error(
        "Unsupported meeting URL"
      );

    }


    window.open(
      url.href,
      "_blank",
      "noopener,noreferrer"
    );

  }catch(
    error
  ){

    showAlert(
      "error",
      "The meeting link for this session is invalid."
    );

  }

}


/* =========================================================
   COPY SCHEDULE LINK
========================================================= */

async function copyTeacherScheduleLink(
  scheduleId
){

  const schedule =
    getTeacherScheduleById(
      scheduleId
    );


  const meetingLink =
    String(
      schedule?.meetingLink ||
      ""
    )
      .trim();


  if (
    !meetingLink
  ){

    showAlert(
      "info",
      "This session does not have a meeting link."
    );


    return;
  }


  try{

    await navigator
      .clipboard
      .writeText(
        meetingLink
      );


    showAlert(
      "success",
      "Meeting link copied.",
      {
        title:
          "Link copied"
      }
    );

  }catch(
    error
  ){

    /*
      Clipboard API may be unavailable
      on non-secure development origins.
    */

    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      meetingLink;


    textarea.style.position =
      "fixed";


    textarea.style.opacity =
      "0";


    document.body.appendChild(
      textarea
    );


    textarea.select();


    try{

      document.execCommand(
        "copy"
      );


      showAlert(
        "success",
        "Meeting link copied.",
        {
          title:
            "Link copied"
        }
      );

    }catch(
      fallbackError
    ){

      showAlert(
        "error",
        "The meeting link could not be copied automatically."
      );

    }finally{

      textarea.remove();

    }

  }

}


/* =========================================================
   OPEN SCHEDULE CLASS
========================================================= */

function openTeacherScheduleClass(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){
    return;
  }


  const classItem =
    getTeacherClassById(
      normalizedClassId
    );


  if (
    !classItem
  ){

    showAlert(
      "error",
      "You do not have access to this class."
    );


    return;
  }


  state.selectedClassId =
    normalizedClassId;


  /*
    Keep this inside teacher.html.
    We switch the teacher workspace to
    the class-management area instead
    of sending the teacher to a separate
    class-builder page.
  */

  const classNavigation =
    document.querySelector(
      '[data-teacher-section="classes"], [data-section="classes"]'
    );


  if (
    classNavigation
  ){

    classNavigation.click();

  }


  if (
    typeof selectTeacherClass ===
    "function"
  ){

    selectTeacherClass(
      normalizedClassId
    );

  }

}


/* =========================================================
   REFRESH SCHEDULES
========================================================= */

async function refreshTeacherSchedules(){

  if (
    teacherScheduleWorkspaceState
      .loading
  ){
    return;
  }


  teacherScheduleWorkspaceState
    .loading =
      true;


  try{

    await loadTeacherSchedules();


    calculateTeacherMetrics();


    renderTeacherScheduleWorkspace();


    renderTeacherDashboardStats();


    showAlert(
      "success",
      "Your teaching schedule is up to date.",
      {
        title:
          "Schedule refreshed"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Schedule refresh failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not refresh the schedule."
    );

  }finally{

    teacherScheduleWorkspaceState
      .loading =
        false;

  }

}


/* =========================================================
   MAIN SCHEDULE WORKSPACE
========================================================= */

function renderTeacherScheduleWorkspace(){

  if (
    state.selectedClassId &&
    teacherScheduleWorkspaceState
      .classId === "all"
  ){

    teacherScheduleWorkspaceState
      .classId =
        normalizeId(
          state.selectedClassId
        ) ||
        "all";

  }


  renderTeacherScheduleHeader();


  renderTeacherScheduleSummary();


  renderTeacherScheduleToolbar();


  renderTeacherScheduleList();


  if (
    teacherScheduleWorkspaceState
      .editorOpen
  ){

    openTeacherScheduleEditor(
      teacherScheduleWorkspaceState
        .selectedScheduleId
    );

  }

}


/* =========================================================
   COMPATIBILITY SCHEDULE RENDERER
========================================================= */

function renderTeacherSchedules(){

  renderTeacherScheduleWorkspace();

}


/* =========================================================
   SCHEDULE CONTROL BINDING
========================================================= */

let teacherScheduleControlsBound =
  false;


function bindTeacherScheduleControls(){

  if (
    teacherScheduleControlsBound
  ){
    return;
  }


  teacherScheduleControlsBound =
    true;


  /* =======================================================
     SEARCH
  ======================================================= */

  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id !==
        "teacherScheduleSearch"
      ){
        return;
      }


      teacherScheduleWorkspaceState
        .search =
          event.target.value ||
          "";


      renderTeacherScheduleList();

    }
  );


  /* =======================================================
     FILTER CHANGES
  ======================================================= */

  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherScheduleClassFilter"
      ){

        teacherScheduleWorkspaceState
          .classId =
            event.target.value ||
            "all";


        renderTeacherScheduleList();


        return;

      }


      if (
        event.target?.id ===
        "teacherScheduleDateFilter"
      ){

        teacherScheduleWorkspaceState
          .selectedDate =
            event.target.value ||
            "";


        renderTeacherScheduleList();

      }

    }
  );


  /* =======================================================
     VIEW TABS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-schedule-view]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      teacherScheduleWorkspaceState
        .view =
          button.dataset
            .teacherScheduleView ||
          "upcoming";


      renderTeacherScheduleToolbar();


      renderTeacherScheduleList();

    }
  );


  /* =======================================================
     ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-schedule-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherScheduleAction ||
          ""
        )
          .trim()
          .toLowerCase();


      switch(
        action
      ){

        case "create":

          openTeacherScheduleEditor();

          break;


        case "edit":

          openTeacherScheduleEditor(
            button.dataset
              .scheduleId
          );

          break;


        case "close-editor":

          closeTeacherScheduleEditor();

          break;


        case "refresh":

          refreshTeacherSchedules();

          break;


        case "join":

          joinTeacherScheduledClass(
            button.dataset
              .scheduleId
          );

          break;


        case "copy-link":

          copyTeacherScheduleLink(
            button.dataset
              .scheduleId
          );

          break;


        case "class":

          openTeacherScheduleClass(
            button.dataset
              .classId
          );

          break;


        case "clear-date":

          teacherScheduleWorkspaceState
            .selectedDate =
              "";


          renderTeacherScheduleToolbar();


          renderTeacherScheduleList();


          break;


        case "delete":

          deleteTeacherSchedule(
            button.dataset
              .scheduleId
          );

          break;

      }

    }
  );


  /* =======================================================
     SCHEDULE FORM
  ======================================================= */

  document.addEventListener(
    "submit",
    event => {

      if (
        event.target?.id !==
        "teacherScheduleForm"
      ){
        return;
      }


      event.preventDefault();


      saveTeacherSchedule();

    }
  );


  /* =======================================================
     ESCAPE CLOSES EDITOR
  ======================================================= */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Escape" ||
        !teacherScheduleWorkspaceState
          .editorOpen
      ){
        return;
      }


      closeTeacherScheduleEditor();

    }
  );

}


/* =========================================================
   INITIALIZE SCHEDULE WORKSPACE
========================================================= */

function initializeTeacherScheduleWorkspace(){

  bindTeacherScheduleControls();


  if (
    state.me
  ){

    renderTeacherScheduleWorkspace();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 12
   CLASS ANALYTICS WORKSPACE
========================================================= */


/* =========================================================
   ANALYTICS WORKSPACE STATE
========================================================= */

const teacherAnalyticsWorkspaceState = {

  classId:
    "all",

  range:
    "30",

  metric:
    "overview",

  selectedStudentId:
    null

};


/* =========================================================
   ANALYTICS DATE RANGE
========================================================= */

function getTeacherAnalyticsRangeDays(){

  const value =
    Number(
      teacherAnalyticsWorkspaceState
        .range
    );


  if (
    [
      7,
      30,
      90,
      180,
      365
    ].includes(
      value
    )
  ){

    return value;

  }


  return 30;

}


/* =========================================================
   ANALYTICS RANGE START
========================================================= */

function getTeacherAnalyticsRangeStart(){

  const days =
    getTeacherAnalyticsRangeDays();


  const start =
    new Date();


  start.setHours(
    0,
    0,
    0,
    0
  );


  start.setDate(
    start.getDate() -
    (
      days -
      1
    )
  );


  return start;

}


/* =========================================================
   DATE IS INSIDE ANALYTICS RANGE
========================================================= */

function isTeacherAnalyticsDateInRange(
  value
){

  if (
    !value
  ){
    return false;
  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ){
    return false;
  }


  return (
    date.getTime() >=
    getTeacherAnalyticsRangeStart()
      .getTime()
  );

}


/* =========================================================
   ANALYTICS CLASSES
========================================================= */

function getTeacherAnalyticsClasses(){

  const classId =
    teacherAnalyticsWorkspaceState
      .classId;


  if (
    classId &&
    classId !==
    "all"
  ){

    const classItem =
      getTeacherClassById(
        classId
      );


    return classItem
      ? [
          classItem
        ]
      : [];

  }


  return getTeacherClasses();

}


/* =========================================================
   ANALYTICS CLASS IDS
========================================================= */

function getTeacherAnalyticsClassIds(){

  return new Set(
    getTeacherAnalyticsClasses()
      .map(
        classItem =>
          normalizeId(
            classItem?._id ||
            classItem?.id
          )
      )
      .filter(
        Boolean
      )
  );

}


/* =========================================================
   ANALYTICS STUDENTS
========================================================= */

function getTeacherAnalyticsStudents(){

  const classIds =
    getTeacherAnalyticsClassIds();


  if (
    !classIds.size
  ){
    return [];
  }


  return asArray(
    state.students
  )
    .filter(
      student =>
        getTeacherStudentClasses(
          student
        )
          .some(
            classItem =>
              classIds.has(
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                )
              )
          )
    );

}


/* =========================================================
   ANALYTICS ASSIGNMENTS
========================================================= */

function getTeacherAnalyticsAssignments(){

  const classIds =
    getTeacherAnalyticsClassIds();


  return getTeacherAssignments()
    .filter(
      assignment => {

        const classId =
          normalizeId(
            assignment?.classId?._id ||
            assignment?.classId
          );


        if (
          !classIds.has(
            classId
          )
        ){
          return false;
        }


        const date =
          assignment?.createdAt ||
          assignment?.updatedAt ||
          assignment?.dueDate;


        return (
          !date ||
          isTeacherAnalyticsDateInRange(
            date
          )
        );

      }
    );

}


/* =========================================================
   ANALYTICS SUBMISSIONS
========================================================= */

function getTeacherAnalyticsSubmissions(){

  const classIds =
    getTeacherAnalyticsClassIds();


  return getTeacherSubmissions()
    .filter(
      submission => {

        const classId =
          getTeacherSubmissionClassId(
            submission
          );


        if (
          !classIds.has(
            classId
          )
        ){
          return false;
        }


        const date =
          submission?.submittedAt ||
          submission?.createdAt;


        return (
          !date ||
          isTeacherAnalyticsDateInRange(
            date
          )
        );

      }
    );

}


/* =========================================================
   ANALYTICS ATTENDANCE
========================================================= */

function getTeacherAnalyticsAttendance(){

  const classIds =
    getTeacherAnalyticsClassIds();


  return asArray(
    state.attendance
  )
    .filter(
      record => {

        const classId =
          getTeacherAttendanceRecordClassId(
            record
          );


        if (
          !classIds.has(
            classId
          )
        ){
          return false;
        }


        return isTeacherAnalyticsDateInRange(
          record?.date ||
          record?.createdAt
        );

      }
    );

}


/* =========================================================
   ANALYTICS QUIZZES
========================================================= */

function getTeacherAnalyticsQuizzes(){

  const classIds =
    getTeacherAnalyticsClassIds();


  return asArray(
    state.quizzes
  )
    .filter(
      quiz => {

        const classId =
          normalizeId(
            quiz?.classId?._id ||
            quiz?.classId
          );


        return classIds.has(
          classId
        );

      }
    );

}


/* =========================================================
   ANALYTICS QUIZ SUBMISSIONS
========================================================= */

function getTeacherAnalyticsQuizSubmissions(){

  const quizIds =
    new Set(
      getTeacherAnalyticsQuizzes()
        .map(
          quiz =>
            normalizeId(
              quiz?._id ||
              quiz?.id
            )
        )
        .filter(
          Boolean
        )
    );


  return asArray(
    state.quizSubmissions
  )
    .filter(
      submission => {

        const quizId =
          normalizeId(
            submission?.quizId?._id ||
            submission?.quizId
          );


        if (
          !quizIds.has(
            quizId
          )
        ){
          return false;
        }


        const date =
          submission?.submittedAt ||
          submission?.createdAt;


        return (
          !date ||
          isTeacherAnalyticsDateInRange(
            date
          )
        );

      }
    );

}


/* =========================================================
   ANALYTICS ATTENDANCE RATE
========================================================= */

function calculateTeacherAnalyticsAttendanceRate(){

  const records =
    getTeacherAnalyticsAttendance();


  if (
    !records.length
  ){
    return 0;
  }


  const valid =
    records.filter(
      record =>
        [
          "present",
          "late",
          "absent",
          "excused"
        ].includes(
          normalizeTeacherAttendanceStatus(
            record?.status
          )
        )
    );


  if (
    !valid.length
  ){
    return 0;
  }


  const attended =
    valid.filter(
      record =>
        [
          "present",
          "late"
        ].includes(
          normalizeTeacherAttendanceStatus(
            record?.status
          )
        )
    ).length;


  return clampPercentage(
    (
      attended /
      valid.length
    ) *
    100
  );

}


/* =========================================================
   ANALYTICS SUBMISSION RATE
========================================================= */

function calculateTeacherAnalyticsSubmissionRate(){

  const students =
    getTeacherAnalyticsStudents();


  const assignments =
    getTeacherAnalyticsAssignments();


  if (
    !students.length ||
    !assignments.length
  ){
    return 0;
  }


  let expected =
    0;


  assignments.forEach(
    assignment => {

      const classId =
        normalizeId(
          assignment?.classId?._id ||
          assignment?.classId
        );


      const classStudents =
        students.filter(
          student =>
            getTeacherStudentClasses(
              student
            )
              .some(
                classItem =>
                  sameId(
                    classItem?._id ||
                    classItem?.id,
                    classId
                  )
              )
        );


      expected +=
        classStudents.length;

    }
  );


  if (
    !expected
  ){
    return 0;
  }


  return clampPercentage(
    (
      getTeacherAnalyticsSubmissions()
        .length /
      expected
    ) *
    100
  );

}


/* =========================================================
   ANALYTICS REVIEW RATE
========================================================= */

function calculateTeacherAnalyticsReviewRate(){

  const submissions =
    getTeacherAnalyticsSubmissions();


  if (
    !submissions.length
  ){
    return 0;
  }


  const reviewed =
    submissions.filter(
      submission =>
        [
          "reviewed",
          "returned",
          "graded"
        ].includes(
          String(
            submission?.status ||
            ""
          )
            .trim()
            .toLowerCase()
        )
    ).length;


  return clampPercentage(
    (
      reviewed /
      submissions.length
    ) *
    100
  );

}


/* =========================================================
   ANALYTICS QUIZ AVERAGE
========================================================= */

function calculateTeacherAnalyticsQuizAverage(){

  const submissions =
    getTeacherAnalyticsQuizSubmissions();


  if (
    !submissions.length
  ){
    return 0;
  }


  const scores =
    submissions
      .map(
        submission => {

          const direct =
            Number(
              submission?.percentage ??
              submission?.percentageScore ??
              submission?.scorePercent
            );


          if (
            Number.isFinite(
              direct
            )
          ){
            return direct;
          }


          const score =
            Number(
              submission?.score
            );


          const total =
            Number(
              submission?.totalPoints
            );


          if (
            Number.isFinite(
              score
            ) &&
            Number.isFinite(
              total
            ) &&
            total > 0
          ){

            return (
              score /
              total
            ) *
            100;

          }


          return null;

        }
      )
      .filter(
        value =>
          Number.isFinite(
            value
          )
      );


  if (
    !scores.length
  ){
    return 0;
  }


  return clampPercentage(
    scores.reduce(
      (
        total,
        score
      ) =>
        total +
        score,
      0
    ) /
    scores.length
  );

}


/* =========================================================
   ANALYTICS GRADED SCORE AVERAGE
========================================================= */

function calculateTeacherAnalyticsGradeAverage(){

  const grades =
    getTeacherAnalyticsSubmissions()
      .map(
        submission =>
          Number(
            submission?.grade
          )
      )
      .filter(
        grade =>
          Number.isFinite(
            grade
          )
      );


  if (
    !grades.length
  ){
    return 0;
  }


  return Math.round(
    grades.reduce(
      (
        total,
        grade
      ) =>
        total +
        grade,
      0
    ) /
    grades.length
  );

}


/* =========================================================
   ANALYTICS SUMMARY
========================================================= */

function getTeacherAnalyticsSummary(){

  return {

    classes:
      getTeacherAnalyticsClasses()
        .length,

    students:
      getTeacherAnalyticsStudents()
        .length,

    assignments:
      getTeacherAnalyticsAssignments()
        .length,

    submissions:
      getTeacherAnalyticsSubmissions()
        .length,

    attendanceRate:
      calculateTeacherAnalyticsAttendanceRate(),

    submissionRate:
      calculateTeacherAnalyticsSubmissionRate(),

    reviewRate:
      calculateTeacherAnalyticsReviewRate(),

    quizAverage:
      calculateTeacherAnalyticsQuizAverage(),

    gradeAverage:
      calculateTeacherAnalyticsGradeAverage()

  };

}


/* =========================================================
   DAILY ANALYTICS DATA
========================================================= */

function buildTeacherAnalyticsDailyData(){

  const days =
    getTeacherAnalyticsRangeDays();


  const submissions =
    getTeacherAnalyticsSubmissions();


  const attendance =
    getTeacherAnalyticsAttendance();


  const points =
    [];


  for (
    let offset =
      days - 1;
    offset >= 0;
    offset -= 1
  ){

    const date =
      new Date();


    date.setHours(
      0,
      0,
      0,
      0
    );


    date.setDate(
      date.getDate() -
      offset
    );


    const key =
      date
        .toISOString()
        .slice(
          0,
          10
        );


    const daySubmissions =
      submissions.filter(
        submission => {

          const value =
            submission?.submittedAt ||
            submission?.createdAt;


          if (
            !value
          ){
            return false;
          }


          const parsed =
            new Date(
              value
            );


          if (
            Number.isNaN(
              parsed.getTime()
            )
          ){
            return false;
          }


          return (
            parsed
              .toISOString()
              .slice(
                0,
                10
              ) ===
            key
          );

        }
      );


    const dayAttendance =
      attendance.filter(
        record =>
          getTeacherAttendanceRecordDate(
            record
          ) ===
          key
      );


    const attended =
      dayAttendance.filter(
        record =>
          [
            "present",
            "late"
          ].includes(
            normalizeTeacherAttendanceStatus(
              record?.status
            )
          )
      ).length;


    const attendanceRate =
      dayAttendance.length
        ? clampPercentage(
            (
              attended /
              dayAttendance.length
            ) *
            100
          )
        : null;


    points.push({

      date:
        key,

      label:
        date.toLocaleDateString(
          [],
          {
            month:
              "short",

            day:
              "numeric"
          }
        ),

      submissions:
        daySubmissions.length,

      attendanceRate

    });

  }


  return points;

}


/* =========================================================
   STUDENT PERFORMANCE DATA
========================================================= */

function buildTeacherStudentPerformanceData(){

  return getTeacherAnalyticsStudents()
    .map(
      student => {

        const studentId =
          normalizeId(
            student?._id ||
            student?.id
          );


        const submissions =
          getTeacherStudentSubmissions(
            studentId
          )
            .filter(
              submission =>
                isTeacherAnalyticsDateInRange(
                  submission?.submittedAt ||
                  submission?.createdAt
                )
            );


        const missing =
          getTeacherStudentMissingAssignments(
            studentId
          );


        const attendance =
          getTeacherStudentAttendanceRate(
            studentId
          );


        const grades =
          submissions
            .map(
              submission =>
                Number(
                  submission?.grade
                )
            )
            .filter(
              value =>
                Number.isFinite(
                  value
                )
            );


        const averageGrade =
          grades.length
            ? Math.round(
                grades.reduce(
                  (
                    total,
                    value
                  ) =>
                    total +
                    value,
                  0
                ) /
                grades.length
              )
            : null;


        const pending =
          getTeacherStudentPendingSubmissions(
            studentId
          ).length;


        return {

          student,

          studentId,

          attendance,

          submissions:
            submissions.length,

          missing:
            missing.length,

          pending,

          averageGrade

        };

      }
    )
    .sort(
      (
        first,
        second
      ) => {

        /*
          Students requiring attention first.
        */

        const firstRisk =
          (
            first.missing *
            20
          ) +
          (
            first.attendance
              ? (
                  100 -
                  first.attendance
                )
              : 0
          );


        const secondRisk =
          (
            second.missing *
            20
          ) +
          (
            second.attendance
              ? (
                  100 -
                  second.attendance
                )
              : 0
          );


        return (
          secondRisk -
          firstRisk
        );

      }
    );

}


/* =========================================================
   ANALYTICS HEADER
========================================================= */

function renderTeacherAnalyticsHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsHeader",
      "analyticsWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Class analytics
        </h1>

        <p>
          Monitor student engagement,
          attendance, submissions and
          academic activity across your
          assigned classes.
        </p>

      </div>


      <button
        type="button"
        class="teacher-secondary-button"
        data-teacher-analytics-action="refresh"
      >
        <i
          class="fa-solid fa-rotate"
        ></i>

        Refresh
      </button>

    </div>
  `;

}


/* =========================================================
   ANALYTICS TOOLBAR
========================================================= */

function renderTeacherAnalyticsToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsToolbar",
      "analyticsWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  container.innerHTML = `

    <select
      id="teacherAnalyticsClassFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All classes
      </option>

      ${
        classes
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    classId
                  )}"
                  ${
                    sameId(
                      teacherAnalyticsWorkspaceState
                        .classId,
                      classId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <select
      id="teacherAnalyticsRange"
      class="teacher-workspace-select"
    >

      <option
        value="7"
        ${
          teacherAnalyticsWorkspaceState.range ===
          "7"
            ? "selected"
            : ""
        }
      >
        Last 7 days
      </option>

      <option
        value="30"
        ${
          teacherAnalyticsWorkspaceState.range ===
          "30"
            ? "selected"
            : ""
        }
      >
        Last 30 days
      </option>

      <option
        value="90"
        ${
          teacherAnalyticsWorkspaceState.range ===
          "90"
            ? "selected"
            : ""
        }
      >
        Last 90 days
      </option>

      <option
        value="180"
        ${
          teacherAnalyticsWorkspaceState.range ===
          "180"
            ? "selected"
            : ""
        }
      >
        Last 6 months
      </option>

      <option
        value="365"
        ${
          teacherAnalyticsWorkspaceState.range ===
          "365"
            ? "selected"
            : ""
        }
      >
        Last year
      </option>

    </select>


    <div
      class="teacher-analytics-tabs"
    >

      <button
        type="button"
        class="${
          teacherAnalyticsWorkspaceState.metric ===
          "overview"
            ? "active"
            : ""
        }"
        data-teacher-analytics-metric="overview"
      >
        Overview
      </button>


      <button
        type="button"
        class="${
          teacherAnalyticsWorkspaceState.metric ===
          "students"
            ? "active"
            : ""
        }"
        data-teacher-analytics-metric="students"
      >
        Students
      </button>


      <button
        type="button"
        class="${
          teacherAnalyticsWorkspaceState.metric ===
          "attendance"
            ? "active"
            : ""
        }"
        data-teacher-analytics-metric="attendance"
      >
        Attendance
      </button>


      <button
        type="button"
        class="${
          teacherAnalyticsWorkspaceState.metric ===
          "assignments"
            ? "active"
            : ""
        }"
        data-teacher-analytics-metric="assignments"
      >
        Assignments
      </button>

    </div>

  `;

}


/* =========================================================
   ANALYTICS SUMMARY CARDS
========================================================= */

function renderTeacherAnalyticsSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsSummary",
      "analyticsWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const summary =
    getTeacherAnalyticsSummary();


  container.innerHTML = `

    <article
      class="teacher-analytics-summary-card"
    >

      <div
        class="teacher-analytics-summary-icon"
      >
        <i
          class="fa-solid fa-user-graduate"
        ></i>
      </div>

      <div>

        <span>
          Students
        </span>

        <strong>
          ${summary.students}
        </strong>

        <small>
          Across
          ${summary.classes}
          class${
            summary.classes === 1
              ? ""
              : "es"
          }
        </small>

      </div>

    </article>


    <article
      class="teacher-analytics-summary-card"
    >

      <div
        class="teacher-analytics-summary-icon"
      >
        <i
          class="fa-solid fa-user-check"
        ></i>
      </div>

      <div>

        <span>
          Attendance
        </span>

        <strong>
          ${summary.attendanceRate}%
        </strong>

        <small>
          Recorded attendance
        </small>

      </div>

    </article>


    <article
      class="teacher-analytics-summary-card"
    >

      <div
        class="teacher-analytics-summary-icon"
      >
        <i
          class="fa-solid fa-file-circle-check"
        ></i>
      </div>

      <div>

        <span>
          Submission rate
        </span>

        <strong>
          ${summary.submissionRate}%
        </strong>

        <small>
          Assignment completion
        </small>

      </div>

    </article>


    <article
      class="teacher-analytics-summary-card"
    >

      <div
        class="teacher-analytics-summary-icon"
      >
        <i
          class="fa-solid fa-pen-to-square"
        ></i>
      </div>

      <div>

        <span>
          Review progress
        </span>

        <strong>
          ${summary.reviewRate}%
        </strong>

        <small>
          Submission reviews
        </small>

      </div>

    </article>


    <article
      class="teacher-analytics-summary-card"
    >

      <div
        class="teacher-analytics-summary-icon"
      >
        <i
          class="fa-solid fa-list-check"
        ></i>
      </div>

      <div>

        <span>
          Quiz average
        </span>

        <strong>
          ${summary.quizAverage}%
        </strong>

        <small>
          Recorded quiz results
        </small>

      </div>

    </article>

  `;

}


/* =========================================================
   SIMPLE ANALYTICS BAR CHART
========================================================= */

function renderTeacherAnalyticsActivityChart(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsActivityChart",
      "analyticsActivityChart"
    );


  if (
    !container
  ){
    return;
  }


  const data =
    buildTeacherAnalyticsDailyData();


  const maximumSubmissions =
    Math.max(
      1,
      ...data.map(
        item =>
          item.submissions
      )
    );


  /*
    With long ranges we show periodic labels
    instead of crowding the horizontal axis.
  */

  const labelStep =
    data.length <= 14
      ? 1
      : data.length <= 31
        ? 3
        : Math.ceil(
            data.length /
            12
          );


  container.innerHTML = `
    <section
      class="teacher-analytics-chart-card"
    >

      <div
        class="teacher-selected-section-head"
      >

        <div>

          <h3>
            Submission activity
          </h3>

          <p>
            Student submissions over the selected period.
          </p>

        </div>

      </div>


      <div
        class="teacher-analytics-bar-chart"
      >

        ${
          data
            .map(
              (
                item,
                index
              ) => {

                const height =
                  Math.max(
                    item.submissions
                      ? 8
                      : 2,
                    Math.round(
                      (
                        item.submissions /
                        maximumSubmissions
                      ) *
                      100
                    )
                  );


                return `
                  <div
                    class="teacher-analytics-bar-column"
                    title="${escapeHtml(
                      `${item.label}: ${item.submissions} submission${
                        item.submissions === 1
                          ? ""
                          : "s"
                      }`
                    )}"
                  >

                    <div
                      class="teacher-analytics-bar-value"
                    >
                      ${
                        item.submissions
                          ? item.submissions
                          : ""
                      }
                    </div>

                    <div
                      class="teacher-analytics-bar-track"
                    >
                      <span
                        style="
                          height:${height}%;
                        "
                      ></span>
                    </div>

                    <small>
                      ${
                        index %
                        labelStep ===
                        0
                          ? escapeHtml(
                              item.label
                            )
                          : ""
                      }
                    </small>

                  </div>
                `;

              }
            )
            .join(
              ""
            )
        }

      </div>

    </section>
  `;

}


/* =========================================================
   ATTENDANCE TREND
========================================================= */

function renderTeacherAnalyticsAttendanceTrend(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsAttendanceChart",
      "analyticsAttendanceChart"
    );


  if (
    !container
  ){
    return;
  }


  const data =
    buildTeacherAnalyticsDailyData()
      .filter(
        item =>
          item.attendanceRate !==
          null
      );


  if (
    !data.length
  ){

    container.innerHTML = `
      <section
        class="teacher-analytics-chart-card"
      >

        <div
          class="teacher-selected-section-head"
        >

          <div>

            <h3>
              Attendance trend
            </h3>

            <p>
              Daily attendance across the selected period.
            </p>

          </div>

        </div>


        <div
          class="teacher-inline-empty"
        >
          Attendance data is not available
          for this period yet.
        </div>

      </section>
    `;


    return;

  }


  container.innerHTML = `
    <section
      class="teacher-analytics-chart-card"
    >

      <div
        class="teacher-selected-section-head"
      >

        <div>

          <h3>
            Attendance trend
          </h3>

          <p>
            Daily attendance across the selected period.
          </p>

        </div>

      </div>


      <div
        class="teacher-attendance-trend-list"
      >

        ${
          data
            .slice(
              -14
            )
            .map(
              item => `
                <div
                  class="teacher-attendance-trend-row"
                >

                  <span>
                    ${escapeHtml(
                      item.label
                    )}
                  </span>

                  <div
                    class="teacher-attendance-trend-track"
                  >
                    <span
                      style="
                        width:${
                          item.attendanceRate
                        }%;
                      "
                    ></span>
                  </div>

                  <strong>
                    ${item.attendanceRate}%
                  </strong>

                </div>
              `
            )
            .join(
              ""
            )
        }

      </div>

    </section>
  `;

}


/* =========================================================
   STUDENT PERFORMANCE TABLE
========================================================= */

function renderTeacherAnalyticsStudentPerformance(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsStudents",
      "analyticsStudentPerformance"
    );


  if (
    !container
  ){
    return;
  }


  const students =
    buildTeacherStudentPerformanceData();


  if (
    !students.length
  ){

    container.innerHTML = `
      <section
        class="teacher-analytics-table-card"
      >

        <div
          class="teacher-inline-empty"
        >
          No student activity is available
          for this period.
        </div>

      </section>
    `;


    return;

  }


  container.innerHTML = `
    <section
      class="teacher-analytics-table-card"
    >

      <div
        class="teacher-selected-section-head"
      >

        <div>

          <h3>
            Student performance
          </h3>

          <p>
            Students who may require attention appear first.
          </p>

        </div>

      </div>


      <div
        class="teacher-analytics-student-table"
      >

        <div
          class="teacher-analytics-student-head"
        >

          <span>
            Student
          </span>

          <span>
            Attendance
          </span>

          <span>
            Submitted
          </span>

          <span>
            Missing
          </span>

          <span>
            Avg. grade
          </span>

          <span>
            Pending
          </span>

          <span></span>

        </div>


        ${
          students
            .slice(
              0,
              30
            )
            .map(
              item => {

                const attention =
                  (
                    item.attendance >
                      0 &&
                    item.attendance <
                      75
                  ) ||
                  item.missing >
                    0;


                return `
                  <div
                    class="
                      teacher-analytics-student-row
                      ${
                        attention
                          ? "needs-attention"
                          : ""
                      }
                    "
                  >

                    <div
                      class="teacher-analytics-student-identity"
                    >

                      <img
                        src="${escapeHtml(
                          getTeacherStudentAvatar(
                            item.student
                          )
                        )}"
                        alt="${escapeHtml(
                          getTeacherDisplayName(
                            item.student
                          )
                        )}"
                      />

                      <span>

                        <strong>
                          ${escapeHtml(
                            getTeacherDisplayName(
                              item.student
                            )
                          )}
                        </strong>

                        <small>
                          ${escapeHtml(
                            item.student?.email ||
                            item.student?.course ||
                            "Student"
                          )}
                        </small>

                      </span>

                    </div>


                    <strong
                      class="${
                        item.attendance <
                        75
                          ? "metric-warning"
                          : ""
                      }"
                    >
                      ${item.attendance}%
                    </strong>


                    <strong>
                      ${item.submissions}
                    </strong>


                    <strong
                      class="${
                        item.missing
                          ? "metric-warning"
                          : ""
                      }"
                    >
                      ${item.missing}
                    </strong>


                    <strong>
                      ${
                        item.averageGrade !==
                        null
                          ? item.averageGrade
                          : "—"
                      }
                    </strong>


                    <strong>
                      ${item.pending}
                    </strong>


                    <button
                      type="button"
                      class="teacher-icon-button"
                      data-teacher-analytics-student="${escapeHtml(
                        item.studentId
                      )}"
                      aria-label="Open student"
                    >
                      <i
                        class="fa-solid fa-chevron-right"
                      ></i>
                    </button>

                  </div>
                `;

              }
            )
            .join(
              ""
            )
        }

      </div>

    </section>
  `;

}


/* =========================================================
   ASSIGNMENT PERFORMANCE TABLE
========================================================= */

function renderTeacherAnalyticsAssignmentPerformance(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsAssignments",
      "analyticsAssignmentPerformance"
    );


  if (
    !container
  ){
    return;
  }


  const assignments =
    getTeacherAnalyticsAssignments();


  if (
    !assignments.length
  ){

    container.innerHTML = `
      <section
        class="teacher-analytics-table-card"
      >
        <div
          class="teacher-inline-empty"
        >
          No assignments are available
          for this period.
        </div>
      </section>
    `;


    return;

  }


  container.innerHTML = `
    <section
      class="teacher-analytics-table-card"
    >

      <div
        class="teacher-selected-section-head"
      >
        <div>

          <h3>
            Assignment performance
          </h3>

          <p>
            Completion and review activity by assignment.
          </p>

        </div>
      </div>


      <div
        class="teacher-analytics-assignment-list"
      >

        ${
          assignments
            .map(
              assignment => {

                const assignmentId =
                  normalizeId(
                    assignment?._id ||
                    assignment?.id
                  );


                const submissions =
                  getTeacherAssignmentSubmissions(
                    assignmentId
                  );


                const pending =
                  getTeacherAssignmentPendingCount(
                    assignmentId
                  );


                const completion =
                  getTeacherAssignmentCompletionRate(
                    assignment
                  );


                const classItem =
                  getTeacherAssignmentClass(
                    assignment
                  );


                return `
                  <button
                    type="button"
                    class="teacher-analytics-assignment-row"
                    data-teacher-analytics-assignment="${escapeHtml(
                      assignmentId
                    )}"
                  >

                    <div
                      class="teacher-analytics-assignment-copy"
                    >

                      <strong>
                        ${escapeHtml(
                          getTeacherAssignmentTitle(
                            assignment
                          )
                        )}
                      </strong>

                      <small>
                        ${escapeHtml(
                          getTeacherClassTitle(
                            classItem
                          )
                        )}
                      </small>

                    </div>


                    <div>
                      <span>
                        Submitted
                      </span>

                      <strong>
                        ${submissions.length}
                      </strong>
                    </div>


                    <div>
                      <span>
                        To review
                      </span>

                      <strong>
                        ${pending}
                      </strong>
                    </div>


                    <div>
                      <span>
                        Completion
                      </span>

                      <strong>
                        ${completion}%
                      </strong>
                    </div>


                    <i
                      class="fa-solid fa-chevron-right"
                    ></i>

                  </button>
                `;

              }
            )
            .join(
              ""
            )
        }

      </div>

    </section>
  `;

}


/* =========================================================
   KABEZYA ANALYTICS INSIGHTS
========================================================= */

function renderTeacherAnalyticsKabezyaInsights(){

  const container =
    getTeacherOverviewElement(
      "teacherAnalyticsKabezya",
      "analyticsKabezyaInsights"
    );


  if (
    !container
  ){
    return;
  }


  const performance =
    buildTeacherStudentPerformanceData();


  const needsAttention =
    performance.filter(
      item =>
        (
          item.attendance >
            0 &&
          item.attendance <
            75
        ) ||
        item.missing >
          0
    );


  const pending =
    getTeacherAnalyticsSubmissions()
      .filter(
        submission =>
          normalizeTeacherSubmissionStatus(
            submission?.status
          ) ===
          "submitted"
      ).length;


  container.innerHTML = `
    <section
      class="teacher-analytics-kabezya-card"
    >

      <div
        class="teacher-analytics-kabezya-head"
      >

        <div
          class="teacher-analytics-kabezya-icon"
        >
          <i
            class="fa-solid fa-wand-magic-sparkles"
          ></i>
        </div>

        <div>

          <span>
            Kabezya AI
          </span>

          <h3>
            Teaching insights
          </h3>

        </div>

      </div>


      <div
        class="teacher-analytics-kabezya-stats"
      >

        <article>

          <strong>
            ${needsAttention.length}
          </strong>

          <span>
            Students may need attention
          </span>

        </article>


        <article>

          <strong>
            ${pending}
          </strong>

          <span>
            Submissions waiting for review
          </span>

        </article>

      </div>


      <p>
        Kabezya can inspect patterns in the
        selected class and help you identify
        missing work, attendance concerns
        and common assignment difficulties.
      </p>


      <button
        type="button"
        class="teacher-primary-button"
        data-teacher-analytics-action="ask-kabezya"
      >
        <i
          class="fa-solid fa-wand-magic-sparkles"
        ></i>

        Analyze with Kabezya
      </button>

    </section>
  `;

}


/* =========================================================
   ANALYTICS CONTENT
========================================================= */

function renderTeacherAnalyticsContent(){

  const metric =
    teacherAnalyticsWorkspaceState
      .metric;


  const overview =
    getTeacherOverviewElement(
      "teacherAnalyticsOverview",
      "analyticsOverviewContent"
    );


  const students =
    getTeacherOverviewElement(
      "teacherAnalyticsStudentSection",
      "analyticsStudentsContent"
    );


  const attendance =
    getTeacherOverviewElement(
      "teacherAnalyticsAttendanceSection",
      "analyticsAttendanceContent"
    );


  const assignments =
    getTeacherOverviewElement(
      "teacherAnalyticsAssignmentSection",
      "analyticsAssignmentsContent"
    );


  if (
    overview
  ){

    overview.hidden =
      metric !==
      "overview";

  }


  if (
    students
  ){

    students.hidden =
      metric !==
      "students";

  }


  if (
    attendance
  ){

    attendance.hidden =
      metric !==
      "attendance";

  }


  if (
    assignments
  ){

    assignments.hidden =
      metric !==
      "assignments";

  }


  switch(
    metric
  ){

    case "students":

      renderTeacherAnalyticsStudentPerformance();

      break;


    case "attendance":

      renderTeacherAnalyticsAttendanceTrend();

      break;


    case "assignments":

      renderTeacherAnalyticsAssignmentPerformance();

      break;


    case "overview":
    default:

      renderTeacherAnalyticsActivityChart();

      renderTeacherAnalyticsAttendanceTrend();

      renderTeacherAnalyticsStudentPerformance();

      renderTeacherAnalyticsAssignmentPerformance();

      renderTeacherAnalyticsKabezyaInsights();

      break;

  }

}


/* =========================================================
   MAIN ANALYTICS WORKSPACE
========================================================= */

function renderTeacherAnalyticsWorkspace(){

  if (
    state.selectedClassId &&
    teacherAnalyticsWorkspaceState
      .classId ===
      "all"
  ){

    teacherAnalyticsWorkspaceState
      .classId =
        normalizeId(
          state.selectedClassId
        ) ||
        "all";

  }


  renderTeacherAnalyticsHeader();


  renderTeacherAnalyticsToolbar();


  renderTeacherAnalyticsSummary();


  renderTeacherAnalyticsContent();

}


/* =========================================================
   COMPATIBILITY ANALYTICS RENDERER
========================================================= */

function renderTeacherAnalytics(){

  renderTeacherAnalyticsWorkspace();

}


/* =========================================================
   REFRESH ANALYTICS
========================================================= */

async function refreshTeacherAnalytics(){

  try{

    await Promise.allSettled([

      loadTeacherAssignments(),

      loadTeacherSubmissions(),

      loadTeacherAttendance(),

      loadTeacherQuizzes(),

      loadTeacherQuizSubmissions()

    ]);


    hydrateTeacherStudents();


    hydrateTeacherClassDataCache();


    calculateTeacherMetrics();


    renderTeacherAnalyticsWorkspace();


    showAlert(
      "success",
      "Class analytics are up to date.",
      {
        title:
          "Analytics refreshed"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Analytics refresh failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not refresh class analytics."
    );

  }

}


/* =========================================================
   ANALYTICS CONTROLS
========================================================= */

let teacherAnalyticsControlsBound =
  false;


function bindTeacherAnalyticsControls(){

  if (
    teacherAnalyticsControlsBound
  ){
    return;
  }


  teacherAnalyticsControlsBound =
    true;


  /* =======================================================
     FILTERS
  ======================================================= */

  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherAnalyticsClassFilter"
      ){

        teacherAnalyticsWorkspaceState
          .classId =
            event.target.value ||
            "all";


        renderTeacherAnalyticsWorkspace();


        return;

      }


      if (
        event.target?.id ===
        "teacherAnalyticsRange"
      ){

        teacherAnalyticsWorkspaceState
          .range =
            event.target.value ||
            "30";


        renderTeacherAnalyticsWorkspace();

      }

    }
  );


  /* =======================================================
     METRIC TABS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-analytics-metric]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      teacherAnalyticsWorkspaceState
        .metric =
          button.dataset
            .teacherAnalyticsMetric ||
          "overview";


      renderTeacherAnalyticsToolbar();


      renderTeacherAnalyticsContent();

    }
  );


  /* =======================================================
     ANALYTICS ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-analytics-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherAnalyticsAction ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        action ===
        "refresh"
      ){

        refreshTeacherAnalytics();


        return;

      }


      if (
        action ===
        "ask-kabezya"
      ){

        state.kabezya.classId =
          teacherAnalyticsWorkspaceState
            .classId ===
            "all"
            ? ""
            : teacherAnalyticsWorkspaceState
                .classId;


        state.kabezya.mode =
          "class-analysis";


        activateStudentStudioPage(
          "ai"
        );

      }

    }
  );


  /* =======================================================
     STUDENT ANALYTICS ACTION
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-analytics-student]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const studentId =
        normalizeId(
          button.dataset
            .teacherAnalyticsStudent
        );


      if (
        !studentId
      ){
        return;
      }


      openTeacherStudent(
        studentId
      );

    }
  );


  /* =======================================================
     ASSIGNMENT ANALYTICS ACTION
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-analytics-assignment]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const assignmentId =
        normalizeId(
          button.dataset
            .teacherAnalyticsAssignment
        );


      if (
        !assignmentId
      ){
        return;
      }


      state.selectedAssignmentId =
        assignmentId;


      teacherAssignmentWorkspaceState
        .selectedAssignmentId =
          assignmentId;


      activateStudentStudioPage(
        "assignments"
      );


      window.requestAnimationFrame(
        () => {

          renderTeacherSelectedAssignment(
            assignmentId
          );

        }
      );

    }
  );

}


/* =========================================================
   INITIALIZE ANALYTICS WORKSPACE
========================================================= */

function initializeTeacherAnalyticsWorkspace(){

  bindTeacherAnalyticsControls();


  if (
    state.me
  ){

    renderTeacherAnalyticsWorkspace();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 13
   RESOURCES WORKSPACE
========================================================= */


/* =========================================================
   RESOURCE WORKSPACE STATE
========================================================= */

const teacherResourceWorkspaceState = {

  classId:
    "all",

  type:
    "all",

  search:
    "",

  sort:
    "recent",

  selectedResourceId:
    null,

  editorOpen:
    false,

  saving:
    false,

  loading:
    false

};


/* =========================================================
   RESOURCE LOOKUP
========================================================= */

function getTeacherResourceById(
  resourceId
){

  const normalizedId =
    normalizeId(
      resourceId
    );


  if (
    !normalizedId
  ){
    return null;
  }


  return (
    asArray(
      state.resources
    )
      .find(
        resource =>
          sameId(
            resource?._id ||
            resource?.id,
            normalizedId
          )
      ) ||
    null
  );

}


/* =========================================================
   RESOURCE CLASS ID
========================================================= */

function getTeacherResourceClassId(
  resource
){

  return normalizeId(
    resource?.classId?._id ||
    resource?.classId
  );

}


/* =========================================================
   RESOURCE CLASS
========================================================= */

function getTeacherResourceClass(
  resource
){

  if (
    resource?.classId &&
    typeof resource.classId ===
      "object"
  ){

    return resource.classId;

  }


  return getTeacherClassById(
    getTeacherResourceClassId(
      resource
    )
  );

}


/* =========================================================
   RESOURCE TITLE
========================================================= */

function getTeacherResourceTitle(
  resource
){

  return String(
    resource?.title ||
    resource?.name ||
    resource?.fileName ||
    "Untitled resource"
  ).trim();

}


/* =========================================================
   RESOURCE DESCRIPTION
========================================================= */

function getTeacherResourceDescription(
  resource
){

  return String(
    resource?.description ||
    resource?.summary ||
    resource?.notes ||
    ""
  ).trim();

}


/* =========================================================
   RESOURCE URL
========================================================= */

function getTeacherResourceUrl(
  resource
){

  return String(
    resource?.url ||
    resource?.fileUrl ||
    resource?.resourceUrl ||
    resource?.link ||
    ""
  ).trim();

}


/* =========================================================
   RESOURCE TYPE
========================================================= */

function getTeacherResourceType(
  resource
){

  const explicitType =
    String(
      resource?.type ||
      resource?.resourceType ||
      resource?.mediaType ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    [
      "file",
      "document",
      "pdf"
    ].includes(
      explicitType
    )
  ){

    return "document";

  }


  if (
    [
      "video",
      "recording"
    ].includes(
      explicitType
    )
  ){

    return "video";

  }


  if (
    [
      "link",
      "url"
    ].includes(
      explicitType
    )
  ){

    return "link";

  }


  if (
    [
      "image",
      "photo"
    ].includes(
      explicitType
    )
  ){

    return "image";

  }


  const url =
    getTeacherResourceUrl(
      resource
    )
      .toLowerCase()
      .split(
        "?"
      )[0];


  if (
    /\.pdf$/.test(
      url
    )
  ){
    return "document";
  }


  if (
    /\.(doc|docx|ppt|pptx|xls|xlsx|txt|csv)$/.test(
      url
    )
  ){
    return "document";
  }


  if (
    /\.(mp4|webm|mov|m4v|avi)$/.test(
      url
    )
  ){
    return "video";
  }


  if (
    /\.(png|jpg|jpeg|gif|webp|svg)$/.test(
      url
    )
  ){
    return "image";
  }


  if (
    /^https?:\/\//.test(
      url
    )
  ){
    return "link";
  }


  return "file";

}


/* =========================================================
   RESOURCE TYPE LABEL
========================================================= */

function getTeacherResourceTypeLabel(
  resource
){

  const type =
    getTeacherResourceType(
      resource
    );


  switch(
    type
  ){

    case "document":
      return "Document";

    case "video":
      return "Video";

    case "image":
      return "Image";

    case "link":
      return "Link";

    default:
      return "File";

  }

}


/* =========================================================
   RESOURCE ICON
========================================================= */

function getTeacherResourceIcon(
  resource
){

  const type =
    getTeacherResourceType(
      resource
    );


  switch(
    type
  ){

    case "document":
      return "fa-file-lines";

    case "video":
      return "fa-circle-play";

    case "image":
      return "fa-image";

    case "link":
      return "fa-link";

    default:
      return "fa-paperclip";

  }

}


/* =========================================================
   RESOURCE DATE
========================================================= */

function getTeacherResourceDate(
  resource
){

  return (
    resource?.updatedAt ||
    resource?.createdAt ||
    null
  );

}


/* =========================================================
   FILTER RESOURCES
========================================================= */

function getFilteredTeacherResources(){

  let resources =
    [
      ...asArray(
        state.resources
      )
    ];


  const classId =
    String(
      teacherResourceWorkspaceState
        .classId ||
      "all"
    );


  const type =
    String(
      teacherResourceWorkspaceState
        .type ||
      "all"
    );


  const search =
    String(
      teacherResourceWorkspaceState
        .search ||
      ""
    )
      .trim()
      .toLowerCase();


  if (
    classId !==
    "all"
  ){

    resources =
      resources.filter(
        resource =>
          sameId(
            getTeacherResourceClassId(
              resource
            ),
            classId
          )
      );

  }


  if (
    type !==
    "all"
  ){

    resources =
      resources.filter(
        resource =>
          getTeacherResourceType(
            resource
          ) ===
          type
      );

  }


  if (
    search
  ){

    resources =
      resources.filter(
        resource => {

          const classItem =
            getTeacherResourceClass(
              resource
            );


          const haystack =
            [
              getTeacherResourceTitle(
                resource
              ),

              getTeacherResourceDescription(
                resource
              ),

              getTeacherResourceTypeLabel(
                resource
              ),

              getTeacherClassTitle(
                classItem
              )
            ]
              .filter(
                Boolean
              )
              .join(
                " "
              )
              .toLowerCase();


          return haystack.includes(
            search
          );

        }
      );

  }


  switch(
    teacherResourceWorkspaceState
      .sort
  ){

    case "name":

      resources.sort(
        (
          first,
          second
        ) =>
          getTeacherResourceTitle(
            first
          )
            .localeCompare(
              getTeacherResourceTitle(
                second
              )
            )
      );

      break;


    case "class":

      resources.sort(
        (
          first,
          second
        ) =>
          getTeacherClassTitle(
            getTeacherResourceClass(
              first
            )
          )
            .localeCompare(
              getTeacherClassTitle(
                getTeacherResourceClass(
                  second
                )
              )
            )
      );

      break;


    case "type":

      resources.sort(
        (
          first,
          second
        ) =>
          getTeacherResourceTypeLabel(
            first
          )
            .localeCompare(
              getTeacherResourceTypeLabel(
                second
              )
            )
      );

      break;


    case "recent":
    default:

      resources.sort(
        (
          first,
          second
        ) =>
          new Date(
            getTeacherResourceDate(
              second
            ) ||
            0
          )
            .getTime() -
          new Date(
            getTeacherResourceDate(
              first
            ) ||
            0
          )
            .getTime()
      );

      break;

  }


  return resources;

}


/* =========================================================
   RESOURCE SUMMARY
========================================================= */

function getTeacherResourceSummary(){

  const resources =
    asArray(
      state.resources
    );


  return {

    total:
      resources.length,

    documents:
      resources.filter(
        resource =>
          getTeacherResourceType(
            resource
          ) ===
          "document"
      ).length,

    videos:
      resources.filter(
        resource =>
          getTeacherResourceType(
            resource
          ) ===
          "video"
      ).length,

    links:
      resources.filter(
        resource =>
          getTeacherResourceType(
            resource
          ) ===
          "link"
      ).length,

    images:
      resources.filter(
        resource =>
          getTeacherResourceType(
            resource
          ) ===
          "image"
      ).length

  };

}


/* =========================================================
   RESOURCES HEADER
========================================================= */

function renderTeacherResourcesHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherResourcesHeader",
      "resourcesWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Resources
        </h1>

        <p>
          Manage class files, recordings,
          useful links and teaching materials
          for your assigned classes.
        </p>

      </div>


      <div
        class="teacher-workspace-heading-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-resource-action="refresh"
        >
          <i
            class="fa-solid fa-rotate"
          ></i>

          Refresh
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-resource-action="create"
        >
          <i
            class="fa-solid fa-plus"
          ></i>

          Add resource
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   RESOURCES SUMMARY
========================================================= */

function renderTeacherResourcesSummary(){

  const container =
    getTeacherOverviewElement(
      "teacherResourcesSummary",
      "resourcesWorkspaceSummary"
    );


  if (
    !container
  ){
    return;
  }


  const summary =
    getTeacherResourceSummary();


  container.innerHTML = `

    <article
      class="teacher-resource-summary-card"
    >

      <i
        class="fa-solid fa-folder-open"
      ></i>

      <span>

        <strong>
          ${summary.total}
        </strong>

        <small>
          Resources
        </small>

      </span>

    </article>


    <article
      class="teacher-resource-summary-card"
    >

      <i
        class="fa-solid fa-file-lines"
      ></i>

      <span>

        <strong>
          ${summary.documents}
        </strong>

        <small>
          Documents
        </small>

      </span>

    </article>


    <article
      class="teacher-resource-summary-card"
    >

      <i
        class="fa-solid fa-circle-play"
      ></i>

      <span>

        <strong>
          ${summary.videos}
        </strong>

        <small>
          Videos
        </small>

      </span>

    </article>


    <article
      class="teacher-resource-summary-card"
    >

      <i
        class="fa-solid fa-link"
      ></i>

      <span>

        <strong>
          ${summary.links}
        </strong>

        <small>
          Links
        </small>

      </span>

    </article>

  `;

}


/* =========================================================
   RESOURCES TOOLBAR
========================================================= */

function renderTeacherResourcesToolbar(){

  const container =
    getTeacherOverviewElement(
      "teacherResourcesToolbar",
      "resourcesWorkspaceToolbar"
    );


  if (
    !container
  ){
    return;
  }


  const classes =
    getTeacherClasses();


  container.innerHTML = `

    <div
      class="teacher-resource-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
      ></i>

      <input
        id="teacherResourceSearch"
        type="search"
        placeholder="Search resources..."
        value="${escapeHtml(
          teacherResourceWorkspaceState
            .search
        )}"
      />

    </div>


    <select
      id="teacherResourceClassFilter"
      class="teacher-workspace-select"
    >

      <option value="all">
        All classes
      </option>

      ${
        classes
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeHtml(
                    classId
                  )}"
                  ${
                    sameId(
                      teacherResourceWorkspaceState
                        .classId,
                      classId
                    )
                      ? "selected"
                      : ""
                  }
                >
                  ${escapeHtml(
                    getTeacherClassTitle(
                      classItem
                    )
                  )}
                </option>
              `;

            }
          )
          .join(
            ""
          )
      }

    </select>


    <select
      id="teacherResourceTypeFilter"
      class="teacher-workspace-select"
    >

      <option
        value="all"
        ${
          teacherResourceWorkspaceState.type ===
          "all"
            ? "selected"
            : ""
        }
      >
        All types
      </option>

      <option
        value="document"
        ${
          teacherResourceWorkspaceState.type ===
          "document"
            ? "selected"
            : ""
        }
      >
        Documents
      </option>

      <option
        value="video"
        ${
          teacherResourceWorkspaceState.type ===
          "video"
            ? "selected"
            : ""
        }
      >
        Videos
      </option>

      <option
        value="image"
        ${
          teacherResourceWorkspaceState.type ===
          "image"
            ? "selected"
            : ""
        }
      >
        Images
      </option>

      <option
        value="link"
        ${
          teacherResourceWorkspaceState.type ===
          "link"
            ? "selected"
            : ""
        }
      >
        Links
      </option>

    </select>


    <select
      id="teacherResourceSort"
      class="teacher-workspace-select"
    >

      <option
        value="recent"
        ${
          teacherResourceWorkspaceState.sort ===
          "recent"
            ? "selected"
            : ""
        }
      >
        Recently added
      </option>

      <option
        value="name"
        ${
          teacherResourceWorkspaceState.sort ===
          "name"
            ? "selected"
            : ""
        }
      >
        Resource name
      </option>

      <option
        value="class"
        ${
          teacherResourceWorkspaceState.sort ===
          "class"
            ? "selected"
            : ""
        }
      >
        Class
      </option>

      <option
        value="type"
        ${
          teacherResourceWorkspaceState.sort ===
          "type"
            ? "selected"
            : ""
        }
      >
        Type
      </option>

    </select>

  `;

}


/* =========================================================
   RESOURCE CARD
========================================================= */

function createTeacherResourceCard(
  resource
){

  const resourceId =
    normalizeId(
      resource?._id ||
      resource?.id
    );


  const classItem =
    getTeacherResourceClass(
      resource
    );


  const type =
    getTeacherResourceType(
      resource
    );


  const url =
    getTeacherResourceUrl(
      resource
    );


  return `
    <article
      class="teacher-resource-card"
      data-resource-id="${escapeHtml(
        resourceId
      )}"
    >

      <div
        class="
          teacher-resource-card-icon
          is-${escapeHtml(
            type
          )}
        "
      >

        <i
          class="fa-solid ${getTeacherResourceIcon(
            resource
          )}"
        ></i>

      </div>


      <div
        class="teacher-resource-card-main"
      >

        <div
          class="teacher-resource-card-top"
        >

          <span
            class="
              teacher-resource-type
              is-${escapeHtml(
                type
              )}
            "
          >
            ${escapeHtml(
              getTeacherResourceTypeLabel(
                resource
              )
            )}
          </span>


          <button
            type="button"
            class="teacher-icon-button"
            data-teacher-resource-action="edit"
            data-resource-id="${escapeHtml(
              resourceId
            )}"
            aria-label="Edit resource"
          >
            <i
              class="fa-solid fa-pen"
            ></i>
          </button>

        </div>


        <h3>
          ${escapeHtml(
            getTeacherResourceTitle(
              resource
            )
          )}
        </h3>


        ${
          getTeacherResourceDescription(
            resource
          )
            ? `
              <p>
                ${escapeHtml(
                  getTeacherResourceDescription(
                    resource
                  )
                )}
              </p>
            `
            : ""
        }


        <div
          class="teacher-resource-card-meta"
        >

          <span>
            <i
              class="fa-solid fa-chalkboard"
            ></i>

            ${escapeHtml(
              getTeacherClassTitle(
                classItem
              )
            )}
          </span>


          <span>
            <i
              class="fa-regular fa-clock"
            ></i>

            ${escapeHtml(
              formatTeacherRelativeTime(
                getTeacherResourceDate(
                  resource
                )
              )
            )}
          </span>

        </div>


        <div
          class="teacher-resource-card-actions"
        >

          ${
            url
              ? `
                <button
                  type="button"
                  class="teacher-primary-button"
                  data-teacher-resource-action="open"
                  data-resource-id="${escapeHtml(
                    resourceId
                  )}"
                >
                  <i
                    class="fa-solid fa-arrow-up-right-from-square"
                  ></i>

                  Open
                </button>
              `
              : ""
          }


          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-resource-action="class"
            data-class-id="${escapeHtml(
              getTeacherResourceClassId(
                resource
              )
            )}"
          >
            Open class
          </button>

        </div>

      </div>

    </article>
  `;

}


/* =========================================================
   RESOURCE GRID
========================================================= */

function renderTeacherResourcesGrid(){

  const container =
    getTeacherOverviewElement(
      "teacherResourcesGrid",
      "resourcesWorkspaceGrid",
      "teacherResourceList"
    );


  if (
    !container
  ){
    return;
  }


  const resources =
    getFilteredTeacherResources();


  if (
    !resources.length
  ){

    container.innerHTML = `
      <div
        class="teacher-workspace-empty"
      >

        <div
          class="teacher-workspace-empty-icon"
        >
          <i
            class="fa-solid fa-folder-open"
          ></i>
        </div>

        <h3>
          No resources found
        </h3>

        <p>
          ${
            state.resources.length
              ? `
                Try changing your current
                search or filters.
              `
              : `
                Add teaching materials,
                links, recordings or documents
                for your assigned classes.
              `
          }
        </p>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-resource-action="create"
        >
          <i
            class="fa-solid fa-plus"
          ></i>

          Add resource
        </button>

      </div>
    `;


    return;

  }


  container.innerHTML =
    resources
      .map(
        createTeacherResourceCard
      )
      .join(
        ""
      );

}


/* =========================================================
   RESOURCE EDITOR CONTAINER
========================================================= */

function getTeacherResourceEditorContainer(){

  return getTeacherOverviewElement(
    "teacherResourceEditor",
    "resourceEditorWorkspace"
  );

}


/* =========================================================
   CLOSE RESOURCE EDITOR
========================================================= */

function closeTeacherResourceEditor(){

  teacherResourceWorkspaceState
    .editorOpen =
      false;


  teacherResourceWorkspaceState
    .selectedResourceId =
      null;


  const container =
    getTeacherResourceEditorContainer();


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   OPEN RESOURCE EDITOR
========================================================= */

function openTeacherResourceEditor(
  resourceId = null
){

  const container =
    getTeacherResourceEditorContainer();


  if (
    !container
  ){

    showAlert(
      "error",
      "The resource editor container is missing from teacher.html."
    );


    return;
  }


  const resource =
    resourceId
      ? getTeacherResourceById(
          resourceId
        )
      : null;


  teacherResourceWorkspaceState
    .editorOpen =
      true;


  teacherResourceWorkspaceState
    .selectedResourceId =
      resource
        ? normalizeId(
            resource?._id ||
            resource?.id
          )
        : null;


  const classes =
    getTeacherClasses();


  const currentClassId =
    resource
      ? getTeacherResourceClassId(
          resource
        )
      : (
          teacherResourceWorkspaceState
            .classId !==
          "all"
            ? teacherResourceWorkspaceState
                .classId
            : (
                state.selectedClassId ||
                ""
              )
        );


  const currentType =
    resource
      ? getTeacherResourceType(
          resource
        )
      : "link";


  container.hidden =
    false;


  container.innerHTML = `
    <div
      class="teacher-editor-overlay"
      data-teacher-resource-action="close-editor"
    ></div>


    <section
      class="teacher-resource-editor-panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="teacherResourceEditorTitle"
    >

      <header
        class="teacher-resource-editor-header"
      >

        <div>

          <span>
            ${
              resource
                ? "Edit resource"
                : "New resource"
            }
          </span>

          <h2
            id="teacherResourceEditorTitle"
          >
            ${
              resource
                ? escapeHtml(
                    getTeacherResourceTitle(
                      resource
                    )
                  )
                : "Add teaching resource"
            }
          </h2>

        </div>


        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-resource-action="close-editor"
          aria-label="Close resource editor"
        >
          <i
            class="fa-solid fa-xmark"
          ></i>
        </button>

      </header>


      <form
        id="teacherResourceForm"
        class="teacher-resource-editor-form"
      >

        <label
          class="teacher-form-field"
        >

          <span>
            Class
          </span>

          <select
            id="teacherResourceEditorClass"
            required
          >

            <option value="">
              Select class
            </option>

            ${
              classes
                .map(
                  classItem => {

                    const classId =
                      normalizeId(
                        classItem?._id ||
                        classItem?.id
                      );


                    return `
                      <option
                        value="${escapeHtml(
                          classId
                        )}"
                        ${
                          sameId(
                            classId,
                            currentClassId
                          )
                            ? "selected"
                            : ""
                        }
                      >
                        ${escapeHtml(
                          getTeacherClassTitle(
                            classItem
                          )
                        )}
                      </option>
                    `;

                  }
                )
                .join(
                  ""
                )
            }

          </select>

        </label>


        <label
          class="teacher-form-field"
        >

          <span>
            Resource type
          </span>

          <select
            id="teacherResourceEditorType"
          >

            <option
              value="document"
              ${
                currentType ===
                "document"
                  ? "selected"
                  : ""
              }
            >
              Document
            </option>

            <option
              value="video"
              ${
                currentType ===
                "video"
                  ? "selected"
                  : ""
              }
            >
              Video / recording
            </option>

            <option
              value="image"
              ${
                currentType ===
                "image"
                  ? "selected"
                  : ""
              }
            >
              Image
            </option>

            <option
              value="link"
              ${
                currentType ===
                "link"
                  ? "selected"
                  : ""
              }
            >
              Link
            </option>

          </select>

        </label>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            Resource title
          </span>

          <input
            id="teacherResourceEditorTitleInput"
            type="text"
            required
            maxlength="180"
            placeholder="Enter a resource title"
            value="${escapeHtml(
              resource?.title ||
              resource?.name ||
              ""
            )}"
          />

        </label>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            URL
          </span>

          <input
            id="teacherResourceEditorUrl"
            type="url"
            required
            placeholder="https://..."
            value="${escapeHtml(
              getTeacherResourceUrl(
                resource
              )
            )}"
          />

          <small>
            Use the uploaded file URL,
            recording URL or external resource link.
          </small>

        </label>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            Description
          </span>

          <textarea
            id="teacherResourceEditorDescription"
            rows="6"
            maxlength="3000"
            placeholder="Add context or instructions for this resource..."
          >${escapeHtml(
            getTeacherResourceDescription(
              resource
            )
          )}</textarea>

        </label>


        <div
          class="teacher-resource-editor-actions"
        >

          ${
            resource
              ? `
                <button
                  type="button"
                  class="teacher-danger-button"
                  data-teacher-resource-action="delete"
                  data-resource-id="${escapeHtml(
                    normalizeId(
                      resource?._id ||
                      resource?.id
                    )
                  )}"
                >
                  <i
                    class="fa-regular fa-trash-can"
                  ></i>

                  Delete
                </button>
              `
              : `
                <span></span>
              `
          }


          <div>

            <button
              type="button"
              class="teacher-secondary-button"
              data-teacher-resource-action="close-editor"
            >
              Cancel
            </button>


            <button
              type="submit"
              class="teacher-primary-button"
              ${
                teacherResourceWorkspaceState
                  .saving
                  ? "disabled"
                  : ""
              }
            >
              <i
                class="fa-solid fa-floppy-disk"
              ></i>

              ${
                resource
                  ? "Save changes"
                  : "Add resource"
              }
            </button>

          </div>

        </div>

      </form>

    </section>
  `;

}


/* =========================================================
   RESOURCE PAYLOAD
========================================================= */

function getTeacherResourceFormPayload(){

  const classId =
    normalizeId(
      $(
        "teacherResourceEditorClass"
      )?.value
    );


  const type =
    String(
      $(
        "teacherResourceEditorType"
      )?.value ||
      "link"
    )
      .trim();


  const title =
    String(
      $(
        "teacherResourceEditorTitleInput"
      )?.value ||
      ""
    )
      .trim();


  const url =
    String(
      $(
        "teacherResourceEditorUrl"
      )?.value ||
      ""
    )
      .trim();


  const description =
    String(
      $(
        "teacherResourceEditorDescription"
      )?.value ||
      ""
    )
      .trim();


  return {

    schoolId:
      getSchoolId(),

    classId,

    teacherId:
      getTeacherId(),

    title,

    description,

    type,

    resourceType:
      type,

    url,

    fileUrl:
      url

  };

}


/* =========================================================
   SAVE RESOURCE
========================================================= */

async function saveTeacherResource(){

  if (
    teacherResourceWorkspaceState
      .saving
  ){
    return;
  }


  const payload =
    getTeacherResourceFormPayload();


  if (
    !payload.classId
  ){

    showAlert(
      "error",
      "Please select a class."
    );


    return;

  }


  if (
    !getTeacherClassById(
      payload.classId
    )
  ){

    showAlert(
      "error",
      "You do not have access to this class."
    );


    return;

  }


  if (
    !payload.title
  ){

    showAlert(
      "error",
      "Resource title is required."
    );


    return;

  }


  if (
    !payload.url
  ){

    showAlert(
      "error",
      "Resource URL is required."
    );


    return;

  }


  try{

    const parsed =
      new URL(
        payload.url
      );


    if (
      ![
        "http:",
        "https:"
      ].includes(
        parsed.protocol
      )
    ){

      throw new Error(
        "Unsupported URL"
      );

    }

  }catch{

    showAlert(
      "error",
      "Please enter a valid resource URL."
    );


    return;

  }


  teacherResourceWorkspaceState
    .saving =
      true;


  try{

    const resourceId =
      teacherResourceWorkspaceState
        .selectedResourceId;


    let response;


    if (
      resourceId
    ){

      response =
        await apiSend(
          `/api/student-resources/${
            encodeURIComponent(
              resourceId
            )
          }`,
          "PATCH",
          payload
        );

    }else{

      response =
        await apiSend(
          "/api/student-resources",
          "POST",
          payload
        );

    }


    const savedResource =
      response?.resource ||
      response?.data ||
      response;


    if (
      savedResource?._id
    ){

      const existingIndex =
        state.resources
          .findIndex(
            resource =>
              sameId(
                resource?._id ||
                resource?.id,
                savedResource._id
              )
          );


      if (
        existingIndex >=
        0
      ){

        state.resources[
          existingIndex
        ] =
          savedResource;

      }else{

        state.resources.unshift(
          savedResource
        );

      }

    }else{

      await loadTeacherResourcesData();

    }


    closeTeacherResourceEditor();


    renderTeacherResourcesWorkspace();


    showAlert(
      "success",
      resourceId
        ? "Resource updated successfully."
        : "Resource added successfully.",
      {
        title:
          resourceId
            ? "Resource updated"
            : "Resource added"
      }
    );

  }catch(
    error
  ){

    console.error(
      "saveTeacherResource failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save this resource."
    );

  }finally{

    teacherResourceWorkspaceState
      .saving =
        false;

  }

}


/* =========================================================
   DELETE RESOURCE
========================================================= */

async function deleteTeacherResource(
  resourceId
){

  const resource =
    getTeacherResourceById(
      resourceId
    );


  if (
    !resource
  ){
    return;
  }


  const confirmed =
    window.confirm(
      `Delete "${
        getTeacherResourceTitle(
          resource
        )
      }"?`
    );


  if (
    !confirmed
  ){
    return;
  }


  if (
    teacherResourceWorkspaceState
      .saving
  ){
    return;
  }


  teacherResourceWorkspaceState
    .saving =
      true;


  try{

    await apiSend(
      `/api/student-resources/${
        encodeURIComponent(
          resourceId
        )
      }`,
      "DELETE"
    );


    state.resources =
      asArray(
        state.resources
      )
        .filter(
          item =>
            !sameId(
              item?._id ||
              item?.id,
              resourceId
            )
        );


    closeTeacherResourceEditor();


    renderTeacherResourcesWorkspace();


    showAlert(
      "success",
      "Resource deleted successfully.",
      {
        title:
          "Resource deleted"
      }
    );

  }catch(
    error
  ){

    console.error(
      "deleteTeacherResource failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not delete this resource."
    );

  }finally{

    teacherResourceWorkspaceState
      .saving =
        false;

  }

}


/* =========================================================
   OPEN RESOURCE
========================================================= */

function openTeacherResource(
  resourceId
){

  const resource =
    getTeacherResourceById(
      resourceId
    );


  if (
    !resource
  ){

    showAlert(
      "error",
      "This resource could not be found."
    );


    return;

  }


  const url =
    getTeacherResourceUrl(
      resource
    );


  if (
    !url
  ){

    showAlert(
      "info",
      "This resource does not have a URL yet."
    );


    return;

  }


  try{

    const parsed =
      new URL(
        url
      );


    if (
      ![
        "http:",
        "https:"
      ].includes(
        parsed.protocol
      )
    ){

      throw new Error(
        "Unsupported resource URL"
      );

    }


    window.open(
      parsed.href,
      "_blank",
      "noopener,noreferrer"
    );

  }catch{

    showAlert(
      "error",
      "The resource URL is invalid."
    );

  }

}


/* =========================================================
   REFRESH RESOURCES
========================================================= */

async function refreshTeacherResources(){

  if (
    teacherResourceWorkspaceState
      .loading
  ){
    return;
  }


  teacherResourceWorkspaceState
    .loading =
      true;


  try{

    await loadTeacherResourcesData();


    renderTeacherResourcesWorkspace();


    showAlert(
      "success",
      "Teaching resources are up to date.",
      {
        title:
          "Resources refreshed"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Teacher resources refresh failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not refresh resources."
    );

  }finally{

    teacherResourceWorkspaceState
      .loading =
        false;

  }

}


/* =========================================================
   MAIN RESOURCES WORKSPACE
========================================================= */

function renderTeacherResourcesWorkspace(){

  if (
    state.selectedClassId &&
    teacherResourceWorkspaceState
      .classId ===
      "all"
  ){

    teacherResourceWorkspaceState
      .classId =
        normalizeId(
          state.selectedClassId
        ) ||
        "all";

  }


  renderTeacherResourcesHeader();


  renderTeacherResourcesSummary();


  renderTeacherResourcesToolbar();


  renderTeacherResourcesGrid();


  if (
    teacherResourceWorkspaceState
      .editorOpen
  ){

    openTeacherResourceEditor(
      teacherResourceWorkspaceState
        .selectedResourceId
    );

  }

}


/* =========================================================
   COMPATIBILITY RESOURCE RENDERER
========================================================= */

function renderTeacherResources(){

  renderTeacherResourcesWorkspace();

}


/* =========================================================
   RESOURCE CONTROLS
========================================================= */

let teacherResourceControlsBound =
  false;


function bindTeacherResourceControls(){

  if (
    teacherResourceControlsBound
  ){
    return;
  }


  teacherResourceControlsBound =
    true;


  /* =======================================================
     SEARCH
  ======================================================= */

  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id !==
        "teacherResourceSearch"
      ){
        return;
      }


      teacherResourceWorkspaceState
        .search =
          event.target.value ||
          "";


      renderTeacherResourcesGrid();

    }
  );


  /* =======================================================
     FILTERS
  ======================================================= */

  document.addEventListener(
    "change",
    event => {

      if (
        event.target?.id ===
        "teacherResourceClassFilter"
      ){

        teacherResourceWorkspaceState
          .classId =
            event.target.value ||
            "all";


        renderTeacherResourcesGrid();


        return;

      }


      if (
        event.target?.id ===
        "teacherResourceTypeFilter"
      ){

        teacherResourceWorkspaceState
          .type =
            event.target.value ||
            "all";


        renderTeacherResourcesGrid();


        return;

      }


      if (
        event.target?.id ===
        "teacherResourceSort"
      ){

        teacherResourceWorkspaceState
          .sort =
            event.target.value ||
            "recent";


        renderTeacherResourcesGrid();

      }

    }
  );


  /* =======================================================
     ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-resource-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherResourceAction ||
          ""
        )
          .trim()
          .toLowerCase();


      const resourceId =
        normalizeId(
          button.dataset
            .resourceId
        );


      switch(
        action
      ){

        case "create":

          openTeacherResourceEditor();

          break;


        case "edit":

          openTeacherResourceEditor(
            resourceId
          );

          break;


        case "close-editor":

          closeTeacherResourceEditor();

          break;


        case "open":

          openTeacherResource(
            resourceId
          );

          break;


        case "delete":

          deleteTeacherResource(
            resourceId
          );

          break;


        case "refresh":

          refreshTeacherResources();

          break;


        case "class":{

          const classId =
            normalizeId(
              button.dataset
                .classId
            );


          if (
            !classId
          ){
            return;
          }


          state.selectedClassId =
            classId;


          teacherClassWorkspaceState
            .selectedClassId =
              classId;


          activateStudentStudioPage(
            "classes"
          );


          window.requestAnimationFrame(
            () => {

              renderTeacherSelectedClass(
                classId
              );

            }
          );


          break;
        }

      }

    }
  );


  /* =======================================================
     FORM SUBMISSION
  ======================================================= */

  document.addEventListener(
    "submit",
    event => {

      if (
        event.target?.id !==
        "teacherResourceForm"
      ){
        return;
      }


      event.preventDefault();


      saveTeacherResource();

    }
  );

}


/* =========================================================
   INITIALIZE RESOURCE WORKSPACE
========================================================= */

function initializeTeacherResourcesWorkspace(){

  bindTeacherResourceControls();


  if (
    state.me
  ){

    renderTeacherResourcesWorkspace();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 14
   KABEZYA AI TEACHER ASSISTANT
========================================================= */


/* =========================================================
   KABEZYA WORKSPACE STATE
========================================================= */

const teacherKabezyaWorkspaceState = {

  mode:
    "assistant",

  classId:
    "",

  studentId:
    "",

  assignmentId:
    "",

  submissionId:
    "",

  quizId:
    "",

  prompt:
    "",

  loading:
    false,

  response:
    null,

  conversation:
    [],

  lastContext:
    null

};


/* =========================================================
   SYNC KABEZYA STATE FROM GLOBAL STATE
========================================================= */

function syncTeacherKabezyaState(){

  if (
    state.kabezya
  ){

    teacherKabezyaWorkspaceState.mode =
      state.kabezya.mode ||
      teacherKabezyaWorkspaceState.mode ||
      "assistant";


    teacherKabezyaWorkspaceState.classId =
      normalizeId(
        state.kabezya.classId
      ) ||
      teacherKabezyaWorkspaceState.classId ||
      "";


    teacherKabezyaWorkspaceState.studentId =
      normalizeId(
        state.kabezya.studentId
      ) ||
      teacherKabezyaWorkspaceState.studentId ||
      "";


    teacherKabezyaWorkspaceState.assignmentId =
      normalizeId(
        state.kabezya.assignmentId
      ) ||
      teacherKabezyaWorkspaceState.assignmentId ||
      "";


    teacherKabezyaWorkspaceState.submissionId =
      normalizeId(
        state.kabezya.submissionId
      ) ||
      teacherKabezyaWorkspaceState.submissionId ||
      "";


    teacherKabezyaWorkspaceState.quizId =
      normalizeId(
        state.kabezya.quizId
      ) ||
      teacherKabezyaWorkspaceState.quizId ||
      "";

  }

}


/* =========================================================
   KABEZYA MODE LABEL
========================================================= */

function getTeacherKabezyaModeLabel(
  mode
){

  switch(
    mode
  ){

    case "class-analysis":

      return "Class analysis";


    case "student-analysis":

      return "Student analysis";


    case "submission-review":

      return "Submission review";


    case "generate-quiz":

      return "Quiz generator";


    case "generate-assignment":

      return "Assignment generator";


    case "feedback":

      return "Feedback assistant";


    case "lesson-plan":

      return "Lesson planning";


    case "assistant":
    default:

      return "Teacher assistant";

  }

}


/* =========================================================
   KABEZYA MODE DESCRIPTION
========================================================= */

function getTeacherKabezyaModeDescription(
  mode
){

  switch(
    mode
  ){

    case "class-analysis":

      return "Inspect class activity, attendance, submissions and learning patterns.";


    case "student-analysis":

      return "Review one student's attendance, submissions, missing work and academic activity.";


    case "submission-review":

      return "Inspect student work and prepare grading and feedback suggestions.";


    case "generate-quiz":

      return "Create quiz ideas and questions based on your selected class and teaching goal.";


    case "generate-assignment":

      return "Draft an assignment with instructions, expected outcomes and suggested assessment criteria.";


    case "feedback":

      return "Draft constructive student feedback that you can review and edit.";


    case "lesson-plan":

      return "Prepare a structured lesson outline based on your class context.";


    case "assistant":
    default:

      return "Ask Kabezya for help with teaching tasks using your Teacher Studio context.";

  }

}


/* =========================================================
   KABEZYA SELECTED CLASS
========================================================= */

function getTeacherKabezyaClass(){

  const classId =
    normalizeId(
      teacherKabezyaWorkspaceState
        .classId
    );


  if (
    !classId
  ){
    return null;
  }


  return getTeacherClassById(
    classId
  );

}


/* =========================================================
   KABEZYA SELECTED STUDENT
========================================================= */

function getTeacherKabezyaStudent(){

  const studentId =
    normalizeId(
      teacherKabezyaWorkspaceState
        .studentId
    );


  if (
    !studentId
  ){
    return null;
  }


  return getTeacherStudentById(
    studentId
  );

}


/* =========================================================
   KABEZYA SELECTED ASSIGNMENT
========================================================= */

function getTeacherKabezyaAssignment(){

  const assignmentId =
    normalizeId(
      teacherKabezyaWorkspaceState
        .assignmentId
    );


  if (
    !assignmentId
  ){
    return null;
  }


  return getTeacherAssignmentById(
    assignmentId
  );

}


/* =========================================================
   KABEZYA SELECTED SUBMISSION
========================================================= */

function getTeacherKabezyaSubmission(){

  const submissionId =
    normalizeId(
      teacherKabezyaWorkspaceState
        .submissionId
    );


  if (
    !submissionId
  ){
    return null;
  }


  return getTeacherSubmissionById(
    submissionId
  );

}


/* =========================================================
   KABEZYA SELECTED QUIZ
========================================================= */

function getTeacherKabezyaQuiz(){

  const quizId =
    normalizeId(
      teacherKabezyaWorkspaceState
        .quizId
    );


  if (
    !quizId
  ){
    return null;
  }


  return getTeacherQuizById(
    quizId
  );

}


/* =========================================================
   BUILD CLASS CONTEXT
========================================================= */

function buildTeacherKabezyaClassContext(
  classItem
){

  if (
    !classItem
  ){
    return null;
  }


  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );


  const classData =
    getTeacherClassData(
      classId
    );


  const students =
    asArray(
      classData.students
    );


  const assignments =
    asArray(
      classData.assignments
    );


  const submissions =
    asArray(
      classData.submissions
    );


  const attendance =
    asArray(
      classData.attendance
    );


  const quizzes =
    asArray(
      classData.quizzes
    );


  return {

    classId,

    title:
      getTeacherClassTitle(
        classItem
      ),

    subject:
      classItem?.subject ||
      "",

    description:
      getTeacherClassDescription(
        classItem
      ),

    classCode:
      getTeacherClassCode(
        classItem
      ),

    students:
      students.map(
        student => ({
          id:
            normalizeId(
              student?._id ||
              student?.id
            ),

          name:
            getTeacherDisplayName(
              student
            ),

          email:
            student?.email ||
            ""
        })
      ),

    studentCount:
      students.length,

    assignmentCount:
      assignments.length,

    submissionCount:
      submissions.length,

    attendanceRecords:
      attendance.length,

    quizCount:
      quizzes.length,

    attendanceRate:
      getTeacherClassAttendanceRate(
        classItem
      ),

    pendingGrading:
      getTeacherClassPendingCount(
        classItem
      ),

    reviewRate:
      getTeacherClassReviewRate(
        classId
      )

  };

}


/* =========================================================
   BUILD STUDENT CONTEXT
========================================================= */

function buildTeacherKabezyaStudentContext(
  student
){

  if (
    !student
  ){
    return null;
  }


  const studentId =
    normalizeId(
      student?._id ||
      student?.id
    );


  const submissions =
    getTeacherStudentSubmissions(
      studentId
    );


  const missing =
    getTeacherStudentMissingAssignments(
      studentId
    );


  const attendance =
    getTeacherStudentAttendance(
      studentId
    );


  const pending =
    getTeacherStudentPendingSubmissions(
      studentId
    );


  const reviewed =
    getTeacherStudentReviewedSubmissions(
      studentId
    );


  return {

    studentId,

    name:
      getTeacherDisplayName(
        student
      ),

    email:
      student?.email ||
      "",

    course:
      student?.course ||
      student?.program ||
      "",

    classes:
      getTeacherStudentClasses(
        student
      ).map(
        classItem => ({
          id:
            normalizeId(
              classItem?._id ||
              classItem?.id
            ),

          title:
            classItem?.title ||
            classItem?.subject ||
            "Class"
        })
      ),

    attendanceRate:
      getTeacherStudentAttendanceRate(
        studentId
      ),

    attendanceRecords:
      attendance.length,

    submissions:
      submissions.length,

    pendingReview:
      pending.length,

    reviewed:
      reviewed.length,

    missingAssignments:
      missing.map(
        assignment => ({
          id:
            normalizeId(
              assignment?._id ||
              assignment?.id
            ),

          title:
            getTeacherAssignmentTitle(
              assignment
            ),

          dueDate:
            assignment?.dueDate ||
            assignment?.deadline ||
            null
        })
      )

  };

}


/* =========================================================
   BUILD ASSIGNMENT CONTEXT
========================================================= */

function buildTeacherKabezyaAssignmentContext(
  assignment
){

  if (
    !assignment
  ){
    return null;
  }


  const assignmentId =
    normalizeId(
      assignment?._id ||
      assignment?.id
    );


  const classItem =
    getTeacherAssignmentClass(
      assignment
    );


  return {

    assignmentId,

    title:
      getTeacherAssignmentTitle(
        assignment
      ),

    classId:
      normalizeId(
        assignment?.classId?._id ||
        assignment?.classId
      ),

    classTitle:
      getTeacherClassTitle(
        classItem
      ),

    instructions:
      assignment?.instructions ||
      assignment?.description ||
      "",

    dueDate:
      getTeacherAssignmentDueDate(
        assignment
      ),

    status:
      normalizeAssignmentStatus(
        assignment?.status
      ),

    expectedStudents:
      getTeacherAssignmentExpectedStudents(
        assignment
      ),

    submissions:
      getTeacherAssignmentSubmissions(
        assignmentId
      ).length,

    pendingReview:
      getTeacherAssignmentPendingCount(
        assignmentId
      ),

    completionRate:
      getTeacherAssignmentCompletionRate(
        assignment
      )

  };

}


/* =========================================================
   BUILD SUBMISSION CONTEXT
========================================================= */

function buildTeacherKabezyaSubmissionWorkspaceContext(
  submission
){

  if (
    !submission
  ){
    return null;
  }


  return buildTeacherKabezyaSubmissionContext(
    submission
  );

}


/* =========================================================
   BUILD QUIZ CONTEXT
========================================================= */

function buildTeacherKabezyaQuizContext(
  quiz
){

  if (
    !quiz
  ){
    return null;
  }


  const classItem =
    getTeacherQuizClass(
      quiz
    );


  return {

    quizId:
      normalizeId(
        quiz?._id ||
        quiz?.id
      ),

    title:
      getTeacherQuizTitle(
        quiz
      ),

    classId:
      normalizeId(
        quiz?.classId?._id ||
        quiz?.classId
      ),

    classTitle:
      getTeacherClassTitle(
        classItem
      ),

    status:
      getTeacherQuizStatus(
        quiz
      ),

    questions:
      getTeacherQuizQuestions(
        quiz
      ),

    questionCount:
      getTeacherQuizQuestionCount(
        quiz
      ),

    totalPoints:
      getTeacherQuizTotalPoints(
        quiz
      ),

    attempts:
      getTeacherQuizSubmissions(
        quiz?._id ||
        quiz?.id
      ).length,

    completionRate:
      getTeacherQuizCompletionRate(
        quiz
      ),

    averageScore:
      getTeacherQuizAverageScore(
        quiz
      )

  };

}


/* =========================================================
   BUILD KABEZYA COMPLETE CONTEXT
========================================================= */

function buildTeacherKabezyaContext(){

  syncTeacherKabezyaState();


  const classItem =
    getTeacherKabezyaClass();


  const student =
    getTeacherKabezyaStudent();


  const assignment =
    getTeacherKabezyaAssignment();


  const submission =
    getTeacherKabezyaSubmission();


  const quiz =
    getTeacherKabezyaQuiz();


  const context = {

    teacher:{
      id:
        getTeacherId(),

      name:
        getTeacherDisplayName(
          state.me
        ),

      schoolId:
        getSchoolId()
    },

    mode:
      teacherKabezyaWorkspaceState.mode,

    class:
      buildTeacherKabezyaClassContext(
        classItem
      ),

    student:
      buildTeacherKabezyaStudentContext(
        student
      ),

    assignment:
      buildTeacherKabezyaAssignmentContext(
        assignment
      ),

    submission:
      buildTeacherKabezyaSubmissionWorkspaceContext(
        submission
      ),

    quiz:
      buildTeacherKabezyaQuizContext(
        quiz
      )

  };


  teacherKabezyaWorkspaceState
    .lastContext =
      context;


  return context;

}


/* =========================================================
   KABEZYA QUICK PROMPTS
========================================================= */

function getTeacherKabezyaQuickPrompts(){

  const mode =
    teacherKabezyaWorkspaceState.mode;


  if (
    mode ===
    "class-analysis"
  ){

    return [
      "Which students may need my attention?",
      "Summarize attendance concerns in this class.",
      "What assignment patterns should I review?",
      "Give me a teaching action plan for this class."
    ];

  }


  if (
    mode ===
    "student-analysis"
  ){

    return [
      "Summarize this student's current progress.",
      "What learning risks should I review?",
      "Draft a supportive message for this student.",
      "What should I check before our next class?"
    ];

  }


  if (
    mode ===
    "generate-quiz"
  ){

    return [
      "Create a 10-question quiz for this class.",
      "Create a short assessment with mixed question types.",
      "Generate higher-order thinking questions.",
      "Create a review quiz with answer explanations."
    ];

  }


  if (
    mode ===
    "generate-assignment"
  ){

    return [
      "Create a practical assignment for this class.",
      "Create an individual written assignment.",
      "Create a collaborative class project.",
      "Draft instructions and a simple rubric."
    ];

  }


  if (
    mode ===
    "submission-review"
  ){

    return [
      "Inspect this student submission.",
      "Draft constructive feedback.",
      "Identify strengths and areas to improve.",
      "Suggest questions I can ask the student."
    ];

  }


  return [
    "Help me prepare today's class.",
    "Which students may need attention?",
    "Create an assignment idea.",
    "Create a quiz idea.",
    "Summarize my pending teaching tasks.",
    "Help me draft student feedback."
  ];

}


/* =========================================================
   KABEZYA HEADER
========================================================= */

function renderKabezyaTeacherHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherKabezyaHeader",
      "kabezyaWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Kabezya AI
        </span>

        <h1>
          Teacher Assistant
        </h1>

        <p>
          Inspect class activity, prepare teaching materials,
          draft feedback and reduce repetitive teaching work.
        </p>

      </div>


      <div
        class="teacher-kabezya-mode-badge"
      >
        <i
          class="fa-solid fa-wand-magic-sparkles"
        ></i>

        <span>
          ${escapeHtml(
            getTeacherKabezyaModeLabel(
              teacherKabezyaWorkspaceState.mode
            )
          )}
        </span>
      </div>

    </div>
  `;

}


/* =========================================================
   KABEZYA CONTEXT BAR
========================================================= */

function renderTeacherKabezyaContextBar(){

  const container =
    getTeacherOverviewElement(
      "teacherKabezyaContext",
      "kabezyaWorkspaceContext"
    );


  if (
    !container
  ){
    return;
  }


  const classItem =
    getTeacherKabezyaClass();


  const student =
    getTeacherKabezyaStudent();


  const assignment =
    getTeacherKabezyaAssignment();


  const submission =
    getTeacherKabezyaSubmission();


  const quiz =
    getTeacherKabezyaQuiz();


  container.innerHTML = `
    <div
      class="teacher-kabezya-context-card"
    >

      <div
        class="teacher-kabezya-context-head"
      >

        <div>

          <span>
            Current context
          </span>

          <strong>
            ${escapeHtml(
              getTeacherKabezyaModeLabel(
                teacherKabezyaWorkspaceState.mode
              )
            )}
          </strong>

        </div>


        <button
          type="button"
          class="teacher-text-button"
          data-teacher-kabezya-action="clear-context"
        >
          Clear
        </button>

      </div>


      <p>
        ${escapeHtml(
          getTeacherKabezyaModeDescription(
            teacherKabezyaWorkspaceState.mode
          )
        )}
      </p>


      <div
        class="teacher-kabezya-context-chips"
      >

        ${
          classItem
            ? `
              <span>
                <i
                  class="fa-solid fa-chalkboard"
                ></i>

                ${escapeHtml(
                  getTeacherClassTitle(
                    classItem
                  )
                )}
              </span>
            `
            : ""
        }


        ${
          student
            ? `
              <span>
                <i
                  class="fa-solid fa-user-graduate"
                ></i>

                ${escapeHtml(
                  getTeacherDisplayName(
                    student
                  )
                )}
              </span>
            `
            : ""
        }


        ${
          assignment
            ? `
              <span>
                <i
                  class="fa-regular fa-file-lines"
                ></i>

                ${escapeHtml(
                  getTeacherAssignmentTitle(
                    assignment
                  )
                )}
              </span>
            `
            : ""
        }


        ${
          submission
            ? `
              <span>
                <i
                  class="fa-solid fa-file-circle-check"
                ></i>

                Submission
              </span>
            `
            : ""
        }


        ${
          quiz
            ? `
              <span>
                <i
                  class="fa-solid fa-list-check"
                ></i>

                ${escapeHtml(
                  getTeacherQuizTitle(
                    quiz
                  )
                )}
              </span>
            `
            : ""
        }


        ${
          !classItem &&
          !student &&
          !assignment &&
          !submission &&
          !quiz
            ? `
              <span>
                <i
                  class="fa-solid fa-circle-info"
                ></i>

                General Teacher Studio
              </span>
            `
            : ""
        }

      </div>

    </div>
  `;

}


/* =========================================================
   KABEZYA TOOL SELECTOR
========================================================= */

function renderTeacherKabezyaTools(){

  const container =
    getTeacherOverviewElement(
      "teacherKabezyaTools",
      "kabezyaWorkspaceTools"
    );


  if (
    !container
  ){
    return;
  }


  const tools = [

    {
      mode:
        "assistant",

      icon:
        "fa-comments",

      title:
        "Teacher assistant",

      description:
        "General teaching help and planning."
    },

    {
      mode:
        "class-analysis",

      icon:
        "fa-chart-line",

      title:
        "Analyze class",

      description:
        "Review performance and engagement."
    },

    {
      mode:
        "student-analysis",

      icon:
        "fa-user-graduate",

      title:
        "Inspect student",

      description:
        "Review a student's learning activity."
    },

    {
      mode:
        "generate-assignment",

      icon:
        "fa-file-circle-plus",

      title:
        "Create assignment",

      description:
        "Draft coursework and instructions."
    },

    {
      mode:
        "generate-quiz",

      icon:
        "fa-list-check",

      title:
        "Create quiz",

      description:
        "Generate assessment questions."
    },

    {
      mode:
        "lesson-plan",

      icon:
        "fa-chalkboard",

      title:
        "Lesson planner",

      description:
        "Prepare a teaching plan."
    }

  ];


  container.innerHTML = `
    <div
      class="teacher-kabezya-tools-grid"
    >

      ${
        tools
          .map(
            tool => `
              <button
                type="button"
                class="
                  teacher-kabezya-tool
                  ${
                    teacherKabezyaWorkspaceState.mode ===
                    tool.mode
                      ? "active"
                      : ""
                  }
                "
                data-teacher-kabezya-mode="${escapeHtml(
                  tool.mode
                )}"
              >

                <span
                  class="teacher-kabezya-tool-icon"
                >
                  <i
                    class="fa-solid ${escapeHtml(
                      tool.icon
                    )}"
                  ></i>
                </span>

                <span>

                  <strong>
                    ${escapeHtml(
                      tool.title
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      tool.description
                    )}
                  </small>

                </span>

              </button>
            `
          )
          .join(
            ""
          )
      }

    </div>
  `;

}


/* =========================================================
   KABEZYA QUICK PROMPTS
========================================================= */

function renderTeacherKabezyaQuickPrompts(){

  const container =
    getTeacherOverviewElement(
      "teacherKabezyaQuickPrompts",
      "kabezyaQuickPrompts"
    );


  if (
    !container
  ){
    return;
  }


  const prompts =
    getTeacherKabezyaQuickPrompts();


  container.innerHTML = `
    <div
      class="teacher-kabezya-quick-prompts"
    >

      <span
        class="teacher-kabezya-quick-label"
      >
        Try asking
      </span>


      <div
        class="teacher-kabezya-quick-list"
      >

        ${
          prompts
            .map(
              prompt => `
                <button
                  type="button"
                  data-teacher-kabezya-prompt="${escapeHtml(
                    prompt
                  )}"
                >
                  ${escapeHtml(
                    prompt
                  )}
                </button>
              `
            )
            .join(
              ""
            )
        }

      </div>

    </div>
  `;

}


/* =========================================================
   KABEZYA CONVERSATION
========================================================= */

function renderTeacherKabezyaConversation(){

  const container =
    getTeacherOverviewElement(
      "teacherKabezyaConversation",
      "kabezyaConversation"
    );


  if (
    !container
  ){
    return;
  }


  const messages =
    teacherKabezyaWorkspaceState
      .conversation;


  if (
    !messages.length
  ){

    container.innerHTML = `
      <div
        class="teacher-kabezya-empty"
      >

        <div
          class="teacher-kabezya-empty-icon"
        >
          <i
            class="fa-solid fa-wand-magic-sparkles"
          ></i>
        </div>

        <h3>
          How can Kabezya help?
        </h3>

        <p>
          Choose a teaching tool above or ask a question
          about your classes, students, assignments,
          quizzes or teaching workflow.
        </p>

        <div
          class="teacher-kabezya-safety-note"
        >
          <i
            class="fa-solid fa-shield-halved"
          ></i>

          <span>
            Kabezya provides suggestions only.
            Grades, attendance and academic decisions
            remain under teacher control.
          </span>
        </div>

      </div>
    `;


    return;

  }


  container.innerHTML =
    messages
      .map(
        message => {

          const role =
            message.role ===
            "assistant"
              ? "assistant"
              : "user";


          return `
            <article
              class="
                teacher-kabezya-message
                is-${role}
              "
            >

              <div
                class="teacher-kabezya-message-avatar"
              >

                ${
                  role ===
                  "assistant"
                    ? `
                      <i
                        class="fa-solid fa-wand-magic-sparkles"
                      ></i>
                    `
                    : `
                      <i
                        class="fa-solid fa-user"
                      ></i>
                    `
                }

              </div>


              <div
                class="teacher-kabezya-message-content"
              >

                <div
                  class="teacher-kabezya-message-head"
                >

                  <strong>
                    ${
                      role ===
                      "assistant"
                        ? "Kabezya"
                        : "You"
                    }
                  </strong>


                  ${
                    message.createdAt
                      ? `
                        <span>
                          ${escapeHtml(
                            formatTeacherRelativeTime(
                              message.createdAt
                            )
                          )}
                        </span>
                      `
                      : ""
                  }

                </div>


                <div
                  class="teacher-kabezya-message-body"
                >
                  ${renderTeacherKabezyaMessageBody(
                    message
                  )}
                </div>

              </div>

            </article>
          `;

        }
      )
      .join(
        ""
      );


  window.requestAnimationFrame(
    () => {

      container.scrollTop =
        container.scrollHeight;

    }
  );

}


/* =========================================================
   RENDER KABEZYA MESSAGE BODY
========================================================= */

function renderTeacherKabezyaMessageBody(
  message
){

  const content =
    message?.content;


  if (
    typeof content ===
    "string"
  ){

    return escapeHtml(
      content
    )
      .replace(
        /\n/g,
        "<br>"
      );

  }


  if (
    !content ||
    typeof content !==
    "object"
  ){

    return "";

  }


  const sections = [];


  if (
    content.title
  ){

    sections.push(`
      <h4>
        ${escapeHtml(
          content.title
        )}
      </h4>
    `);

  }


  if (
    content.summary
  ){

    sections.push(`
      <p>
        ${escapeHtml(
          content.summary
        )}
      </p>
    `);

  }


  if (
    Array.isArray(
      content.points
    ) &&
    content.points.length
  ){

    sections.push(`
      <ul>
        ${
          content.points
            .map(
              item => `
                <li>
                  ${escapeHtml(
                    item
                  )}
                </li>
              `
            )
            .join(
              ""
            )
        }
      </ul>
    `);

  }


  if (
    Array.isArray(
      content.recommendations
    ) &&
    content.recommendations.length
  ){

    sections.push(`
      <div
        class="teacher-kabezya-response-section"
      >

        <strong>
          Recommendations
        </strong>

        <ul>
          ${
            content.recommendations
              .map(
                item => `
                  <li>
                    ${escapeHtml(
                      item
                    )}
                  </li>
                `
              )
              .join(
                ""
              )
          }
        </ul>

      </div>
    `);

  }


  if (
    content.feedback
  ){

    sections.push(`
      <div
        class="teacher-kabezya-response-section"
      >

        <strong>
          Suggested feedback
        </strong>

        <p>
          ${escapeHtml(
            content.feedback
          )}
        </p>

      </div>
    `);

  }


  if (
    content.score !==
    undefined &&
    content.score !==
    null
  ){

    sections.push(`
      <div
        class="teacher-kabezya-score-suggestion"
      >

        <span>
          Suggested score
        </span>

        <strong>
          ${escapeHtml(
            content.score
          )}
        </strong>

      </div>
    `);

  }


  if (
    Array.isArray(
      content.questions
    ) &&
    content.questions.length
  ){

    sections.push(`
      <div
        class="teacher-kabezya-generated-questions"
      >

        <strong>
          Generated questions
        </strong>

        ${
          content.questions
            .map(
              (
                question,
                index
              ) => `
                <article>

                  <span>
                    ${index + 1}
                  </span>

                  <div>

                    <strong>
                      ${escapeHtml(
                        question?.question ||
                        question?.title ||
                        "Question"
                      )}
                    </strong>

                    ${
                      question?.type
                        ? `
                          <small>
                            ${escapeHtml(
                              question.type
                            )}
                          </small>
                        `
                        : ""
                    }

                  </div>

                </article>
              `
            )
            .join(
              ""
            )
        }

      </div>
    `);

  }


  if (
    !sections.length
  ){

    try{

      return escapeHtml(
        JSON.stringify(
          content,
          null,
          2
        )
      )
        .replace(
          /\n/g,
          "<br>"
        )
        .replace(
          / /g,
          "&nbsp;"
        );

    }catch{

      return "";

    }

  }


  return sections.join(
    ""
  );

}


/* =========================================================
   KABEZYA COMPOSER
========================================================= */

function renderTeacherKabezyaComposer(){

  const container =
    getTeacherOverviewElement(
      "teacherKabezyaComposer",
      "kabezyaComposer"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <form
      id="teacherKabezyaForm"
      class="teacher-kabezya-composer-form"
    >

      <textarea
        id="teacherKabezyaPrompt"
        rows="3"
        maxlength="6000"
        placeholder="Ask Kabezya about your teaching work..."
        ${
          teacherKabezyaWorkspaceState.loading
            ? "disabled"
            : ""
        }
      >${escapeHtml(
        teacherKabezyaWorkspaceState.prompt
      )}</textarea>


      <div
        class="teacher-kabezya-composer-bottom"
      >

        <div
          class="teacher-kabezya-composer-info"
        >
          <i
            class="fa-solid fa-circle-info"
          ></i>

          <span>
            Review AI suggestions before using them
            in academic decisions.
          </span>
        </div>


        <button
          type="submit"
          class="teacher-primary-button"
          ${
            teacherKabezyaWorkspaceState.loading
              ? "disabled"
              : ""
          }
        >

          ${
            teacherKabezyaWorkspaceState.loading
              ? `
                <i
                  class="fa-solid fa-spinner fa-spin"
                ></i>

                Thinking...
              `
              : `
                <i
                  class="fa-solid fa-paper-plane"
                ></i>

                Ask Kabezya
              `
          }

        </button>

      </div>

    </form>
  `;

}


/* =========================================================
   NORMALIZE KABEZYA RESPONSE
========================================================= */

function normalizeTeacherKabezyaResponse(
  response
){

  const source =
    response?.result ||
    response?.response ||
    response?.data ||
    response ||
    {};


  if (
    typeof source ===
    "string"
  ){

    return source;

  }


  if (
    source.message &&
    typeof source.message ===
    "string"
  ){

    return {
      title:
        source.title ||
        "",

      summary:
        source.message,

      points:
        asArray(
          source.points
        ),

      recommendations:
        asArray(
          source.recommendations
        ),

      feedback:
        source.feedback ||
        "",

      score:
        source.score ??
        source.suggestedScore ??
        null,

      questions:
        asArray(
          source.questions
        )
    };

  }


  return {

    title:
      source.title ||
      source.heading ||
      "",

    summary:
      source.summary ||
      source.analysis ||
      source.text ||
      source.answer ||
      "",

    points:
      asArray(
        source.points ||
        source.insights
      ),

    recommendations:
      asArray(
        source.recommendations ||
        source.actions
      ),

    feedback:
      source.feedback ||
      source.suggestedFeedback ||
      "",

    score:
      source.score ??
      source.suggestedScore ??
      source.suggestedGrade ??
      null,

    questions:
      asArray(
        source.questions
      )

  };

}


/* =========================================================
   KABEZYA ENDPOINT BY MODE
========================================================= */

function getTeacherKabezyaEndpoint(){

  switch(
    teacherKabezyaWorkspaceState.mode
  ){

    case "class-analysis":

      return "/api/kabezya/teacher/analyze-class";


    case "student-analysis":

      return "/api/kabezya/teacher/analyze-student";


    case "submission-review":

      return "/api/kabezya/teacher/inspect-submission";


    case "generate-quiz":

      return "/api/kabezya/teacher/generate-quiz";


    case "generate-assignment":

      return "/api/kabezya/teacher/generate-assignment";


    case "lesson-plan":

      return "/api/kabezya/teacher/generate-lesson-plan";


    case "assistant":
    default:

      return "/api/kabezya/teacher/assistant";

  }

}


/* =========================================================
   SEND KABEZYA REQUEST
========================================================= */

async function askTeacherKabezya(
  prompt = null
){

  if (
    teacherKabezyaWorkspaceState.loading
  ){
    return;
  }


  const input =
    String(
      prompt ??
      $(
        "teacherKabezyaPrompt"
      )?.value ??
      teacherKabezyaWorkspaceState.prompt ??
      ""
    )
      .trim();


  if (
    !input
  ){

    showAlert(
      "info",
      "Enter a question or teaching task for Kabezya."
    );


    return;

  }


  teacherKabezyaWorkspaceState.prompt =
    input;


  teacherKabezyaWorkspaceState
    .conversation
    .push({

      role:
        "user",

      content:
        input,

      createdAt:
        new Date()

    });


  teacherKabezyaWorkspaceState.loading =
    true;


  renderTeacherKabezyaConversation();


  renderTeacherKabezyaComposer();


  try{

    const context =
      buildTeacherKabezyaContext();


    const response =
      await apiSend(
        getTeacherKabezyaEndpoint(),
        "POST",
        {
          prompt:
            input,

          mode:
            teacherKabezyaWorkspaceState.mode,

          context
        }
      );


    const normalized =
      normalizeTeacherKabezyaResponse(
        response
      );


    teacherKabezyaWorkspaceState.response =
      normalized;


    teacherKabezyaWorkspaceState
      .conversation
      .push({

        role:
          "assistant",

        content:
          normalized,

        createdAt:
          new Date()

      });


    teacherKabezyaWorkspaceState.prompt =
      "";

  }catch(
    error
  ){

    console.error(
      "Kabezya teacher request failed:",
      error
    );


    teacherKabezyaWorkspaceState
      .conversation
      .push({

        role:
          "assistant",

        content:
          `I could not complete that request. ${
            error?.message ||
            "The Kabezya teacher service is unavailable."
          }`,

        createdAt:
          new Date()

      });


    showAlert(
      "error",
      error?.message ||
      "Kabezya could not complete this request."
    );

  }finally{

    teacherKabezyaWorkspaceState.loading =
      false;


    renderTeacherKabezyaConversation();


    renderTeacherKabezyaComposer();

  }

}


/* =========================================================
   CHANGE KABEZYA MODE
========================================================= */

function setTeacherKabezyaMode(
  mode
){

  const allowed = [

    "assistant",
    "class-analysis",
    "student-analysis",
    "submission-review",
    "generate-quiz",
    "generate-assignment",
    "feedback",
    "lesson-plan"

  ];


  const normalized =
    allowed.includes(
      mode
    )
      ? mode
      : "assistant";


  teacherKabezyaWorkspaceState.mode =
    normalized;


  if (
    !state.kabezya
  ){

    state.kabezya =
      {};

  }


  state.kabezya.mode =
    normalized;


  renderKabezyaTeacherHeader();


  renderTeacherKabezyaContextBar();


  renderTeacherKabezyaTools();


  renderTeacherKabezyaQuickPrompts();

}


/* =========================================================
   CLEAR KABEZYA CONTEXT
========================================================= */

function clearTeacherKabezyaContext(){

  teacherKabezyaWorkspaceState.classId =
    "";


  teacherKabezyaWorkspaceState.studentId =
    "";


  teacherKabezyaWorkspaceState.assignmentId =
    "";


  teacherKabezyaWorkspaceState.submissionId =
    "";


  teacherKabezyaWorkspaceState.quizId =
    "";


  teacherKabezyaWorkspaceState.mode =
    "assistant";


  if (
    !state.kabezya
  ){

    state.kabezya =
      {};

  }


  Object.assign(
    state.kabezya,
    {
      classId:"",
      studentId:"",
      assignmentId:"",
      submissionId:"",
      quizId:"",
      mode:"assistant"
    }
  );


  renderKabezyaTeacherAssistant();

}


/* =========================================================
   KABEZYA CREATE QUIZ FROM RESPONSE
========================================================= */

function useTeacherKabezyaQuizSuggestion(){

  const response =
    teacherKabezyaWorkspaceState
      .response;


  if (
    !response ||
    !Array.isArray(
      response.questions
    ) ||
    !response.questions.length
  ){

    showAlert(
      "info",
      "Kabezya has not generated quiz questions yet."
    );


    return;

  }


  activateStudentStudioPage(
    "quizzes"
  );


  window.requestAnimationFrame(
    () => {

      renderTeacherQuizEditor(
        null
      );


      window.requestAnimationFrame(
        () => {

          response.questions
            .forEach(
              question => {

                addTeacherQuizEditorQuestion({
                  question:
                    question?.question ||
                    question?.title ||
                    "",

                  type:
                    question?.type ||
                    "multiple_choice",

                  options:
                    asArray(
                      question?.options
                    ),

                  correctAnswer:
                    question?.correctAnswer ||
                    question?.answer ||
                    "",

                  explanation:
                    question?.explanation ||
                    "",

                  points:
                    safeNumber(
                      question?.points,
                      1
                    )
                });

              }
            );

        }
      );

    }
  );

}


/* =========================================================
   KABEZYA APPLY FEEDBACK
========================================================= */

function useTeacherKabezyaFeedbackSuggestion(){

  const response =
    teacherKabezyaWorkspaceState
      .response;


  if (
    !response?.feedback
  ){

    showAlert(
      "info",
      "Kabezya has not prepared feedback yet."
    );


    return;

  }


  if (
    teacherKabezyaWorkspaceState
      .submissionId
  ){

    const submissionId =
      teacherKabezyaWorkspaceState
        .submissionId;


    teacherGradingWorkspaceState
      .selectedSubmissionId =
        submissionId;


    activateStudentStudioPage(
      "grading"
    );


    window.requestAnimationFrame(
      () => {

        renderTeacherSubmissionViewer();


        window.requestAnimationFrame(
          () => {

            const feedback =
              $(
                "teacherSubmissionFeedback"
              );


            if (
              feedback
            ){

              feedback.value =
                response.feedback;

            }


            const grade =
              $(
                "teacherSubmissionGrade"
              );


            if (
              grade &&
              response.score !==
              null &&
              response.score !==
              undefined
            ){

              grade.value =
                response.score;

            }

          }
        );

      }
    );

  }

}


/* =========================================================
   KABEZYA RESPONSE ACTIONS
========================================================= */

function renderTeacherKabezyaResponseActions(){

  const container =
    getTeacherOverviewElement(
      "teacherKabezyaResponseActions",
      "kabezyaResponseActions"
    );


  if (
    !container
  ){
    return;
  }


  const response =
    teacherKabezyaWorkspaceState
      .response;


  if (
    !response
  ){

    container.innerHTML =
      "";


    return;

  }


  const actions = [];


  if (
    Array.isArray(
      response.questions
    ) &&
    response.questions.length
  ){

    actions.push(`
      <button
        type="button"
        class="teacher-primary-button"
        data-teacher-kabezya-action="use-quiz"
      >
        <i
          class="fa-solid fa-list-check"
        ></i>

        Use in quiz editor
      </button>
    `);

  }


  if (
    response.feedback
  ){

    actions.push(`
      <button
        type="button"
        class="teacher-secondary-button"
        data-teacher-kabezya-action="use-feedback"
      >
        <i
          class="fa-solid fa-pen"
        ></i>

        Use feedback
      </button>
    `);

  }


  actions.push(`
    <button
      type="button"
      class="teacher-secondary-button"
      data-teacher-kabezya-action="clear-conversation"
    >
      <i
        class="fa-solid fa-rotate"
      ></i>

      New conversation
    </button>
  `);


  container.innerHTML = `
    <div
      class="teacher-kabezya-response-actions"
    >
      ${actions.join("")}
    </div>
  `;

}


/* =========================================================
   CLEAR KABEZYA CONVERSATION
========================================================= */

function clearTeacherKabezyaConversation(){

  teacherKabezyaWorkspaceState
    .conversation =
      [];


  teacherKabezyaWorkspaceState.response =
    null;


  teacherKabezyaWorkspaceState.prompt =
    "";


  renderTeacherKabezyaConversation();


  renderTeacherKabezyaComposer();


  renderTeacherKabezyaResponseActions();

}


/* =========================================================
   MAIN KABEZYA RENDERER
========================================================= */

function renderKabezyaTeacherAssistant(){

  syncTeacherKabezyaState();


  renderKabezyaTeacherHeader();


  renderTeacherKabezyaContextBar();


  renderTeacherKabezyaTools();


  renderTeacherKabezyaQuickPrompts();


  renderTeacherKabezyaConversation();


  renderTeacherKabezyaComposer();


  renderTeacherKabezyaResponseActions();

}


/* =========================================================
   KABEZYA CONTROLS
========================================================= */

let teacherKabezyaControlsBound =
  false;


function bindTeacherKabezyaControls(){

  if (
    teacherKabezyaControlsBound
  ){
    return;
  }


  teacherKabezyaControlsBound =
    true;


  /* =======================================================
     MODE SELECTOR
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-kabezya-mode]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      setTeacherKabezyaMode(
        button.dataset
          .teacherKabezyaMode
      );

    }
  );


  /* =======================================================
     QUICK PROMPTS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-kabezya-prompt]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const prompt =
        String(
          button.dataset
            .teacherKabezyaPrompt ||
          ""
        )
          .trim();


      if (
        !prompt
      ){
        return;
      }


      const input =
        $(
          "teacherKabezyaPrompt"
        );


      if (
        input
      ){

        input.value =
          prompt;

      }


      teacherKabezyaWorkspaceState.prompt =
        prompt;


      askTeacherKabezya(
        prompt
      );

    }
  );


  /* =======================================================
     FORM SUBMISSION
  ======================================================= */

  document.addEventListener(
    "submit",
    event => {

      if (
        event.target?.id !==
        "teacherKabezyaForm"
      ){
        return;
      }


      event.preventDefault();


      askTeacherKabezya();

    }
  );


  /* =======================================================
     PROMPT INPUT STATE
  ======================================================= */

  document.addEventListener(
    "input",
    event => {

      if (
        event.target?.id !==
        "teacherKabezyaPrompt"
      ){
        return;
      }


      teacherKabezyaWorkspaceState.prompt =
        event.target.value ||
        "";

    }
  );


  /* =======================================================
     GENERAL ACTIONS
  ======================================================= */

  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-kabezya-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherKabezyaAction ||
          ""
        )
          .trim()
          .toLowerCase();


      switch(
        action
      ){

        case "clear-context":

          clearTeacherKabezyaContext();

          break;


        case "clear-conversation":

          clearTeacherKabezyaConversation();

          break;


        case "use-quiz":

          useTeacherKabezyaQuizSuggestion();

          break;


        case "use-feedback":

          useTeacherKabezyaFeedbackSuggestion();

          break;

      }

    }
  );

}


/* =========================================================
   INITIALIZE KABEZYA WORKSPACE
========================================================= */

function initializeTeacherKabezyaWorkspace(){

  bindTeacherKabezyaControls();


  if (
    state.me
  ){

    renderKabezyaTeacherAssistant();

  }

}

/* =========================================================
   TEACHER STUDIO
   PART 15
   SETTINGS + SUPPORT + MESSAGES + FINAL INITIALIZATION
========================================================= */


/* =========================================================
   TEACHER SETTINGS STATE
========================================================= */

const teacherSettingsWorkspaceState = {

  notifications:
    true,

  emailNotifications:
    true,

  gradingReminders:
    true,

  attendanceReminders:
    true,

  compactMode:
    false,

  saving:
    false

};


/* =========================================================
   APPLY TEACHER SETTINGS FROM USER
========================================================= */

function hydrateTeacherSettingsFromUser(){

  const user =
    state.me ||
    state.loggedUser ||
    {};


  teacherSettingsWorkspaceState
    .notifications =
      user?.preferences?.notifications !==
      false;


  teacherSettingsWorkspaceState
    .emailNotifications =
      user?.preferences?.emailNotifications !==
      false;


  teacherSettingsWorkspaceState
    .gradingReminders =
      user?.preferences?.gradingReminders !==
      false;


  teacherSettingsWorkspaceState
    .attendanceReminders =
      user?.preferences?.attendanceReminders !==
      false;


  teacherSettingsWorkspaceState
    .compactMode =
      user?.preferences?.compactMode ===
      true;

}


/* =========================================================
   SETTINGS HEADER
========================================================= */

function renderTeacherSettingsHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherSettingsHeader",
      "settingsWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Teacher Studio
        </span>

        <h1>
          Settings
        </h1>

        <p>
          Manage your Teacher Studio preferences,
          notifications and workspace behavior.
        </p>

      </div>

    </div>
  `;

}


/* =========================================================
   SETTINGS PROFILE CARD
========================================================= */

function renderTeacherSettingsProfile(){

  const container =
    getTeacherOverviewElement(
      "teacherSettingsProfile",
      "settingsProfileCard"
    );


  if (
    !container
  ){
    return;
  }


  const teacher =
    state.me ||
    {};


  container.innerHTML = `
    <section
      class="teacher-settings-card"
    >

      <div
        class="teacher-settings-card-head"
      >

        <div>

          <h3>
            Teacher profile
          </h3>

          <p>
            Account information connected to your
            Teacher Studio.
          </p>

        </div>

      </div>


      <div
        class="teacher-settings-profile"
      >

        <img
          src="${escapeHtml(
            teacher?.profileImage ||
            teacher?.avatar ||
            FALLBACK_AVATAR
          )}"
          alt="${escapeHtml(
            getTeacherDisplayName(
              teacher
            )
          )}"
        />


        <div>

          <strong>
            ${escapeHtml(
              getTeacherDisplayName(
                teacher
              )
            )}
          </strong>

          <span>
            ${escapeHtml(
              teacher?.email ||
              ""
            )}
          </span>

          <small>
            ${escapeHtml(
              teacher?.subject ||
              teacher?.department ||
              "Teacher"
            )}
          </small>

        </div>

      </div>

    </section>
  `;

}


/* =========================================================
   SETTINGS PREFERENCES
========================================================= */

function renderTeacherSettingsPreferences(){

  const container =
    getTeacherOverviewElement(
      "teacherSettingsPreferences",
      "settingsPreferences"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <section
      class="teacher-settings-card"
    >

      <div
        class="teacher-settings-card-head"
      >

        <div>

          <h3>
            Preferences
          </h3>

          <p>
            Choose how Teacher Studio should notify
            and assist you.
          </p>

        </div>

      </div>


      <div
        class="teacher-settings-list"
      >

        <label
          class="teacher-setting-row"
        >

          <span>

            <strong>
              Notifications
            </strong>

            <small>
              Show Teacher Studio notifications.
            </small>

          </span>

          <input
            id="teacherSettingNotifications"
            type="checkbox"
            ${
              teacherSettingsWorkspaceState.notifications
                ? "checked"
                : ""
            }
          />

        </label>


        <label
          class="teacher-setting-row"
        >

          <span>

            <strong>
              Email notifications
            </strong>

            <small>
              Receive important teaching updates by email.
            </small>

          </span>

          <input
            id="teacherSettingEmailNotifications"
            type="checkbox"
            ${
              teacherSettingsWorkspaceState.emailNotifications
                ? "checked"
                : ""
            }
          />

        </label>


        <label
          class="teacher-setting-row"
        >

          <span>

            <strong>
              Grading reminders
            </strong>

            <small>
              Remind me when submissions are waiting
              for review.
            </small>

          </span>

          <input
            id="teacherSettingGradingReminders"
            type="checkbox"
            ${
              teacherSettingsWorkspaceState.gradingReminders
                ? "checked"
                : ""
            }
          />

        </label>


        <label
          class="teacher-setting-row"
        >

          <span>

            <strong>
              Attendance reminders
            </strong>

            <small>
              Remind me to record attendance
              for scheduled classes.
            </small>

          </span>

          <input
            id="teacherSettingAttendanceReminders"
            type="checkbox"
            ${
              teacherSettingsWorkspaceState.attendanceReminders
                ? "checked"
                : ""
            }
          />

        </label>


        <label
          class="teacher-setting-row"
        >

          <span>

            <strong>
              Compact workspace
            </strong>

            <small>
              Reduce spacing in lists and workspace cards.
            </small>

          </span>

          <input
            id="teacherSettingCompactMode"
            type="checkbox"
            ${
              teacherSettingsWorkspaceState.compactMode
                ? "checked"
                : ""
            }
          />

        </label>

      </div>


      <div
        class="teacher-settings-actions"
      >

        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-settings-action="save"
          ${
            teacherSettingsWorkspaceState.saving
              ? "disabled"
              : ""
          }
        >
          <i
            class="fa-solid fa-floppy-disk"
          ></i>

          Save preferences
        </button>

      </div>

    </section>
  `;

}


/* =========================================================
   APPLY COMPACT MODE
========================================================= */

function applyTeacherCompactMode(){

  document.body.classList.toggle(
    "teacher-compact-mode",
    teacherSettingsWorkspaceState
      .compactMode
  );

}


/* =========================================================
   SAVE TEACHER SETTINGS
========================================================= */

async function saveTeacherSettings(){

  if (
    teacherSettingsWorkspaceState.saving
  ){
    return;
  }


  teacherSettingsWorkspaceState.notifications =
    Boolean(
      $(
        "teacherSettingNotifications"
      )?.checked
    );


  teacherSettingsWorkspaceState.emailNotifications =
    Boolean(
      $(
        "teacherSettingEmailNotifications"
      )?.checked
    );


  teacherSettingsWorkspaceState.gradingReminders =
    Boolean(
      $(
        "teacherSettingGradingReminders"
      )?.checked
    );


  teacherSettingsWorkspaceState.attendanceReminders =
    Boolean(
      $(
        "teacherSettingAttendanceReminders"
      )?.checked
    );


  teacherSettingsWorkspaceState.compactMode =
    Boolean(
      $(
        "teacherSettingCompactMode"
      )?.checked
    );


  teacherSettingsWorkspaceState.saving =
    true;


  renderTeacherSettingsPreferences();


  try{

    /*
      Keep this route compatible with a normal
      user-profile preferences endpoint.

      If your current User route uses another path,
      we will align this when we inspect teacher.html
      and the final backend routes.
    */

    const response =
      await apiSend(
        "/api/users/me/preferences",
        "PATCH",
        {
          notifications:
            teacherSettingsWorkspaceState
              .notifications,

          emailNotifications:
            teacherSettingsWorkspaceState
              .emailNotifications,

          gradingReminders:
            teacherSettingsWorkspaceState
              .gradingReminders,

          attendanceReminders:
            teacherSettingsWorkspaceState
              .attendanceReminders,

          compactMode:
            teacherSettingsWorkspaceState
              .compactMode
        }
      );


    if (
      state.me
    ){

      state.me.preferences = {

        ...(state.me.preferences || {}),

        notifications:
          teacherSettingsWorkspaceState
            .notifications,

        emailNotifications:
          teacherSettingsWorkspaceState
            .emailNotifications,

        gradingReminders:
          teacherSettingsWorkspaceState
            .gradingReminders,

        attendanceReminders:
          teacherSettingsWorkspaceState
            .attendanceReminders,

        compactMode:
          teacherSettingsWorkspaceState
            .compactMode

      };

    }


    applyTeacherCompactMode();


    showAlert(
      "success",
      "Teacher Studio preferences were saved.",
      {
        title:
          "Settings saved"
      }
    );


    return response;

  }catch(
    error
  ){

    console.error(
      "Teacher settings save failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not save your settings."
    );

  }finally{

    teacherSettingsWorkspaceState.saving =
      false;


    renderTeacherSettingsPreferences();

  }

}


/* =========================================================
   SETTINGS WORKSPACE
========================================================= */

function renderTeacherSettingsWorkspace(){

  hydrateTeacherSettingsFromUser();


  renderTeacherSettingsHeader();


  renderTeacherSettingsProfile();


  renderTeacherSettingsPreferences();


  applyTeacherCompactMode();

}


/* =========================================================
   SETTINGS CONTROLS
========================================================= */

let teacherSettingsControlsBound =
  false;


function bindTeacherSettingsControls(){

  if (
    teacherSettingsControlsBound
  ){
    return;
  }


  teacherSettingsControlsBound =
    true;


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-settings-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherSettingsAction ||
          ""
        )
          .trim()
          .toLowerCase();


      if (
        action ===
        "save"
      ){

        saveTeacherSettings();

      }

    }
  );

}


/* =========================================================
   HELP & SUPPORT STATE
========================================================= */

const teacherSupportWorkspaceState = {

  activeTopic:
    null,

  conversationOpen:
    false

};


/* =========================================================
   HELP TOPICS
========================================================= */

const TEACHER_HELP_TOPICS = [

  {
    id:
      "classes",

    icon:
      "fa-chalkboard-user",

    title:
      "Classes",

    summary:
      "Learn how your assigned classes work.",

    content:
      `
        <h3>Classes</h3>

        <p>
          The Classes workspace contains only the classes
          assigned to your teacher account.
        </p>

        <p>
          Open a class to view students, assignments,
          grading, attendance, quizzes and resources.
        </p>

        <p>
          Teachers cannot create or delete school-owned
          classes from this workspace unless the school
          explicitly grants that permission.
        </p>
      `
  },


  {
    id:
      "students",

    icon:
      "fa-user-graduate",

    title:
      "Students",

    summary:
      "Review students from your assigned classes.",

    content:
      `
        <h3>Students</h3>

        <p>
          The Students workspace combines students from
          the classes assigned to you.
        </p>

        <p>
          You can review attendance, submissions,
          missing work and class participation information.
        </p>

        <p>
          Use the class filter when you want to focus
          on one class only.
        </p>
      `
  },


  {
    id:
      "assignments",

    icon:
      "fa-file-circle-check",

    title:
      "Assignments",

    summary:
      "Create and manage student coursework.",

    content:
      `
        <h3>Assignments</h3>

        <p>
          Create assignments for classes you teach,
          add instructions, due dates and attachments,
          then publish them to students.
        </p>

        <p>
          The submission counters show how many students
          have submitted and how many submissions still
          need teacher review.
        </p>

        <p>
          Draft assignments remain unpublished until you
          change their status.
        </p>
      `
  },


  {
    id:
      "grading",

    icon:
      "fa-pen-to-square",

    title:
      "Grading",

    summary:
      "Review submissions and return feedback.",

    content:
      `
        <h3>Submissions & grading</h3>

        <p>
          Select a submission from the grading list
          to inspect the student's written answer
          and available attachment.
        </p>

        <p>
          Enter the final grade and teacher feedback,
          then choose Reviewed or Returned.
        </p>

        <p>
          Kabezya may prepare suggestions, but the teacher
          remains responsible for the final grade.
        </p>
      `
  },


  {
    id:
      "attendance",

    icon:
      "fa-user-check",

    title:
      "Attendance",

    summary:
      "Record and review class attendance.",

    content:
      `
        <h3>Attendance</h3>

        <p>
          Select a class and date to load that class roster.
        </p>

        <p>
          Mark each student Present, Late, Absent or Excused.
          Bulk controls can apply the same status to the
          visible roster.
        </p>

        <p>
          Open a student to review their attendance history.
        </p>
      `
  },


  {
    id:
      "quizzes",

    icon:
      "fa-list-check",

    title:
      "Quizzes",

    summary:
      "Create quizzes and reuse Question Bank items.",

    content:
      `
        <h3>Quizzes</h3>

        <p>
          Build quizzes for your assigned classes,
          add questions manually or reuse questions
          stored in the Question Bank.
        </p>

        <p>
          Published quizzes can later show student attempts,
          completion and average scores when quiz submission
          data is available.
        </p>

        <p>
          Kabezya can also draft quiz questions for teacher review.
        </p>
      `
  },


  {
    id:
      "schedule",

    icon:
      "fa-calendar-days",

    title:
      "Schedule",

    summary:
      "Manage teaching sessions and meeting links.",

    content:
      `
        <h3>Schedule</h3>

        <p>
          The Schedule workspace shows your upcoming,
          current and completed teaching sessions.
        </p>

        <p>
          Add a meeting URL to make the Start / Join Class
          button available.
        </p>

        <p>
          Sessions stay connected to the class selected
          when the schedule is created.
        </p>
      `
  },


  {
    id:
      "resources",

    icon:
      "fa-folder-open",

    title:
      "Resources",

    summary:
      "Manage useful class files and links.",

    content:
      `
        <h3>Resources</h3>

        <p>
          Resources are teaching materials connected
          to your assigned classes.
        </p>

        <p>
          Add documents, videos, images or external links,
          then use filters to find materials quickly.
        </p>

        <p>
          Students should only see resources allowed by
          your school's resource backend permissions.
        </p>
      `
  },


  {
    id:
      "kabezya",

    icon:
      "fa-wand-magic-sparkles",

    title:
      "Kabezya AI",

    summary:
      "Use AI assistance without giving away teacher control.",

    content:
      `
        <h3>Kabezya AI Teacher Assistant</h3>

        <p>
          Kabezya can help inspect class patterns,
          prepare assignments, generate quiz ideas,
          draft feedback and summarize student concerns.
        </p>

        <p>
          AI output is advisory. Kabezya must not independently
          publish grades, change attendance or make academic
          disciplinary decisions.
        </p>

        <p>
          Review generated material before using it with students.
        </p>
      `
  }

];


/* =========================================================
   HELP HEADER
========================================================= */

function renderTeacherSupportHeader(){

  const container =
    getTeacherOverviewElement(
      "teacherSupportHeader",
      "supportWorkspaceHeader"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-heading"
    >

      <div>

        <span
          class="teacher-workspace-eyebrow"
        >
          Help & Support
        </span>

        <h1>
          How can we help?
        </h1>

        <p>
          Browse Teacher Studio guides or talk
          with Kabezya before sending a request
          to AIFT support.
        </p>

      </div>

    </div>
  `;

}


/* =========================================================
   HELP TOPIC GRID
========================================================= */

function renderTeacherHelpTopics(){

  const container =
    getTeacherOverviewElement(
      "teacherHelpTopics",
      "supportHelpTopics"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-help-topic-grid"
    >

      ${
        TEACHER_HELP_TOPICS
          .map(
            topic => `
              <button
                type="button"
                class="
                  teacher-help-topic-card
                  ${
                    teacherSupportWorkspaceState
                      .activeTopic ===
                    topic.id
                      ? "active"
                      : ""
                  }
                "
                data-teacher-help-topic="${escapeHtml(
                  topic.id
                )}"
              >

                <span
                  class="teacher-help-topic-icon"
                >
                  <i
                    class="fa-solid ${escapeHtml(
                      topic.icon
                    )}"
                  ></i>
                </span>


                <span>

                  <strong>
                    ${escapeHtml(
                      topic.title
                    )}
                  </strong>

                  <small>
                    ${escapeHtml(
                      topic.summary
                    )}
                  </small>

                </span>


                <i
                  class="fa-solid fa-chevron-right"
                ></i>

              </button>
            `
          )
          .join(
            ""
          )
      }

    </div>
  `;

}


/* =========================================================
   HELP TOPIC DETAIL
========================================================= */

function renderTeacherHelpTopicDetail(){

  const container =
    getTeacherOverviewElement(
      "teacherHelpTopicDetail",
      "supportHelpTopicDetail"
    );


  if (
    !container
  ){
    return;
  }


  const topic =
    TEACHER_HELP_TOPICS
      .find(
        item =>
          item.id ===
          teacherSupportWorkspaceState
            .activeTopic
      );


  if (
    !topic
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";


    return;
  }


  container.hidden =
    false;


  container.innerHTML = `
    <section
      class="teacher-help-topic-detail"
    >

      <header>

        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-support-action="close-topic"
        >
          <i
            class="fa-solid fa-arrow-left"
          ></i>
        </button>


        <div>

          <span>
            Help topic
          </span>

          <h2>
            ${escapeHtml(
              topic.title
            )}
          </h2>

        </div>

      </header>


      <div
        class="teacher-help-topic-content"
      >
        ${topic.content}
      </div>

    </section>
  `;

}


/* =========================================================
   CONTACT SUPPORT CARD
========================================================= */

function renderTeacherContactSupport(){

  const container =
    getTeacherOverviewElement(
      "teacherContactSupport",
      "supportContactCard"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <section
      class="teacher-contact-support-card"
    >

      <div
        class="teacher-contact-support-icon"
      >
        <i
          class="fa-solid fa-headset"
        ></i>
      </div>


      <div>

        <span>
          Need more help?
        </span>

        <h3>
          Talk with Kabezya first
        </h3>

        <p>
          Explain what is happening and Kabezya
          can help identify the issue before you
          submit a support request.
        </p>

      </div>


      <button
        type="button"
        class="teacher-primary-button"
        data-teacher-support-action="talk-kabezya"
      >
        <i
          class="fa-solid fa-wand-magic-sparkles"
        ></i>

        Speak with Kabezya
      </button>


      <button
        type="button"
        class="teacher-secondary-button"
        data-teacher-support-action="support-request"
      >
        <i
          class="fa-regular fa-envelope"
        ></i>

        Contact support
      </button>

    </section>
  `;

}


/* =========================================================
   SUPPORT REQUEST FORM
========================================================= */

function renderTeacherSupportRequestForm(){

  const container =
    getTeacherOverviewElement(
      "teacherSupportRequest",
      "supportRequestWorkspace"
    );


  if (
    !container
  ){
    return;
  }


  const teacher =
    state.me ||
    {};


  container.hidden =
    false;


  container.innerHTML = `
    <section
      class="teacher-support-request-panel"
    >

      <header>

        <div>

          <span>
            AIFT Support
          </span>

          <h2>
            Contact support
          </h2>

          <p>
            Leave your information and describe the
            issue you need help with.
          </p>

        </div>


        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-support-action="close-request"
        >
          <i
            class="fa-solid fa-xmark"
          ></i>
        </button>

      </header>


      <form
        id="teacherSupportRequestForm"
        class="teacher-support-request-form"
      >

        <div
          class="teacher-form-grid"
        >

          <label
            class="teacher-form-field"
          >

            <span>
              Name
            </span>

            <input
              id="teacherSupportName"
              type="text"
              required
              value="${escapeHtml(
                getTeacherDisplayName(
                  teacher
                )
              )}"
            />

          </label>


          <label
            class="teacher-form-field"
          >

            <span>
              Email
            </span>

            <input
              id="teacherSupportEmail"
              type="email"
              required
              value="${escapeHtml(
                teacher?.email ||
                ""
              )}"
            />

          </label>

        </div>


        <label
          class="teacher-form-field"
        >

          <span>
            Topic
          </span>

          <select
            id="teacherSupportTopic"
            required
          >

            <option value="">
              Select topic
            </option>

            <option value="classes">
              Classes
            </option>

            <option value="students">
              Students
            </option>

            <option value="assignments">
              Assignments
            </option>

            <option value="grading">
              Grading
            </option>

            <option value="attendance">
              Attendance
            </option>

            <option value="quizzes">
              Quizzes
            </option>

            <option value="schedule">
              Schedule
            </option>

            <option value="resources">
              Resources
            </option>

            <option value="kabezya">
              Kabezya AI
            </option>

            <option value="technical">
              Technical issue
            </option>

            <option value="other">
              Other
            </option>

          </select>

        </label>


        <label
          class="teacher-form-field"
        >

          <span>
            Subject
          </span>

          <input
            id="teacherSupportSubject"
            type="text"
            maxlength="180"
            required
            placeholder="Short description of the issue"
          />

        </label>


        <label
          class="teacher-form-field"
        >

          <span>
            Describe the issue
          </span>

          <textarea
            id="teacherSupportMessage"
            rows="8"
            maxlength="6000"
            required
            placeholder="Explain what happened, what you expected and what you have already tried..."
          ></textarea>

        </label>


        <div
          class="teacher-support-request-actions"
        >

          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-support-action="close-request"
          >
            Cancel
          </button>


          <button
            type="submit"
            class="teacher-primary-button"
          >
            <i
              class="fa-solid fa-paper-plane"
            ></i>

            Send to support
          </button>

        </div>

      </form>

    </section>
  `;

}


/* =========================================================
   CLOSE SUPPORT REQUEST
========================================================= */

function closeTeacherSupportRequest(){

  const container =
    getTeacherOverviewElement(
      "teacherSupportRequest",
      "supportRequestWorkspace"
    );


  if (
    container
  ){

    container.hidden =
      true;


    container.innerHTML =
      "";

  }

}


/* =========================================================
   SUBMIT SUPPORT REQUEST
========================================================= */

async function submitTeacherSupportRequest(){

  const name =
    String(
      $(
        "teacherSupportName"
      )?.value ||
      ""
    )
      .trim();


  const email =
    String(
      $(
        "teacherSupportEmail"
      )?.value ||
      ""
    )
      .trim();


  const topic =
    String(
      $(
        "teacherSupportTopic"
      )?.value ||
      ""
    )
      .trim();


  const subject =
    String(
      $(
        "teacherSupportSubject"
      )?.value ||
      ""
    )
      .trim();


  const message =
    String(
      $(
        "teacherSupportMessage"
      )?.value ||
      ""
    )
      .trim();


  if (
    !name ||
    !email ||
    !topic ||
    !subject ||
    !message
  ){

    showAlert(
      "error",
      "Please complete all required support fields."
    );


    return;

  }


  try{

    /*
      This route should match the support backend
      used by your existing student Help & Support area.

      If your current support endpoint has another name,
      we will swap only this route later.
    */

    await apiSend(
      "/api/support/requests",
      "POST",
      {
        name,
        email,
        topic,
        subject,
        message,

        role:
          "teacher",

        userId:
          getTeacherId(),

        schoolId:
          getSchoolId(),

        source:
          "teacher-studio"
      }
    );


    closeTeacherSupportRequest();


    showAlert(
      "success",
      "Your support request was sent successfully.",
      {
        title:
          "Request sent"
      }
    );

  }catch(
    error
  ){

    console.error(
      "Teacher support request failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "AIFT could not send your support request."
    );

  }

}


/* =========================================================
   HELP & SUPPORT WORKSPACE
========================================================= */

function renderTeacherSupportWorkspace(){

  renderTeacherSupportHeader();


  renderTeacherHelpTopics();


  renderTeacherHelpTopicDetail();


  renderTeacherContactSupport();

}


/* =========================================================
   SUPPORT CONTROLS
========================================================= */

let teacherSupportControlsBound =
  false;


function bindTeacherSupportControls(){

  if (
    teacherSupportControlsBound
  ){
    return;
  }


  teacherSupportControlsBound =
    true;


  document.addEventListener(
    "click",
    event => {

      const topic =
        event.target.closest(
          "[data-teacher-help-topic]"
        );


      if (
        topic
      ){

        event.preventDefault();


        teacherSupportWorkspaceState
          .activeTopic =
            topic.dataset
              .teacherHelpTopic ||
            null;


        renderTeacherHelpTopics();


        renderTeacherHelpTopicDetail();


        return;

      }


      const button =
        event.target.closest(
          "[data-teacher-support-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherSupportAction ||
          ""
        )
          .trim()
          .toLowerCase();


      switch(
        action
      ){

        case "close-topic":

          teacherSupportWorkspaceState
            .activeTopic =
              null;


          renderTeacherHelpTopics();


          renderTeacherHelpTopicDetail();


          break;


        case "talk-kabezya":

          state.kabezya = {

            ...(state.kabezya || {}),

            mode:
              "assistant"

          };


          activateStudentStudioPage(
            "ai"
          );


          break;


        case "support-request":

          renderTeacherSupportRequestForm();


          break;


        case "close-request":

          closeTeacherSupportRequest();


          break;

      }

    }
  );


  document.addEventListener(
    "submit",
    event => {

      if (
        event.target?.id !==
        "teacherSupportRequestForm"
      ){
        return;
      }


      event.preventDefault();


      submitTeacherSupportRequest();

    }
  );

}


/* =========================================================
   MESSAGES COMPATIBILITY
========================================================= */

function renderTeacherMessages(){

  /*
    Teacher Studio can reuse the platform's
    main messaging system.

    If teacher.html contains a dedicated embedded
    message workspace, later we can connect it here.
  */

  const container =
    getTeacherOverviewElement(
      "teacherMessagesWorkspace",
      "messagesWorkspace"
    );


  if (
    !container
  ){
    return;
  }


  container.innerHTML = `
    <div
      class="teacher-workspace-empty"
    >

      <div
        class="teacher-workspace-empty-icon"
      >
        <i
          class="fa-regular fa-comments"
        ></i>
      </div>

      <h3>
        Messages
      </h3>

      <p>
        Open your AIFT messaging workspace to
        communicate with students and school staff.
      </p>

      <button
        type="button"
        class="teacher-primary-button"
        data-teacher-message-action="open"
      >
        <i
          class="fa-regular fa-comments"
        ></i>

        Open messages
      </button>

    </div>
  `;

}


/* =========================================================
   MESSAGE ACTIONS
========================================================= */

let teacherMessageControlsBound =
  false;


function bindTeacherMessageControls(){

  if (
    teacherMessageControlsBound
  ){
    return;
  }


  teacherMessageControlsBound =
    true;


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-teacher-message-action]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const action =
        String(
          button.dataset
            .teacherMessageAction ||
          ""
        );


      if (
        action ===
        "open"
      ){

        /*
          Keep this compatible with an existing
          messages.html page if your project already
          uses it.
        */

        window.location.href =
          "messages.html";

      }

    }
  );

}


/* =========================================================
   STUDIO PAGE RENDER MAP
========================================================= */

const TEACHER_STUDIO_RENDERERS = {

  overview:
    renderStudioHome,

  classes:
    renderTeacherClassesWorkspace,

  students:
    renderTeacherStudentsWorkspace,

  assignments:
    renderTeacherAssignmentsWorkspace,

  grading:
    renderTeacherGradingWorkspace,

  attendance:
    renderTeacherAttendanceWorkspace,

  quizzes:
    renderTeacherQuizzesWorkspace,

  schedule:
    renderTeacherScheduleWorkspace,

  resources:
    renderTeacherResourcesWorkspace,

  analytics:
    renderTeacherAnalyticsWorkspace,

  ai:
    renderKabezyaTeacherAssistant,

  messages:
    renderTeacherMessages,

  settings:
    renderTeacherSettingsWorkspace,

  support:
    renderTeacherSupportWorkspace

};


/* =========================================================
   RENDER ACTIVE TEACHER PAGE
========================================================= */

function renderActiveStudentStudioPage(
  page = "overview"
){

  const normalizedPage =
    TEACHER_STUDIO_RENDERERS[
      page
    ]
      ? page
      : "overview";


  activeStudentStudioPage =
    normalizedPage;


  const renderer =
    TEACHER_STUDIO_RENDERERS[
      normalizedPage
    ];


  if (
    typeof renderer ===
    "function"
  ){

    renderer();

  }

}


/* =========================================================
   ACTIVATE TEACHER STUDIO PAGE
========================================================= */

function activateStudentStudioPage(
  page = "overview"
){

  const normalizedPage =
    TEACHER_STUDIO_RENDERERS[
      page
    ]
      ? page
      : "overview";


  activeStudentStudioPage =
    normalizedPage;


  document.querySelectorAll(
    "[data-studio-page], [data-teacher-page]"
  )
    .forEach(
      section => {

        const pageName =
          section.dataset
            .studioPage ||
          section.dataset
            .teacherPage ||
          "";


        const active =
          pageName ===
          normalizedPage;


        section.hidden =
          !active;


        section.classList.toggle(
          "active",
          active
        );

      }
    );


  document.querySelectorAll(
    "[data-student-studio-page], [data-teacher-nav]"
  )
    .forEach(
      button => {

        const pageName =
          button.dataset
            .studentStudioPage ||
          button.dataset
            .teacherNav ||
          "";


        const active =
          pageName ===
          normalizedPage;


        button.classList.toggle(
          "active",
          active
        );


        if (
          active
        ){

          button.setAttribute(
            "aria-current",
            "page"
          );

        }else{

          button.removeAttribute(
            "aria-current"
          );

        }

      }
    );


  renderActiveStudentStudioPage(
    normalizedPage
  );


  try{

    window.history.replaceState(
      null,
      "",
      `${
        window.location.pathname
      }${
        window.location.search
      }#${
        encodeURIComponent(
          normalizedPage
        )
      }`
    );

  }catch(
    error
  ){

    /*
      History support is optional.
    */

  }


  closeStudentStudioMenus();

}


/* =========================================================
   NAVIGATION BINDING
========================================================= */

let teacherNavigationBound =
  false;


function bindStudentStudioNavigation(){

  if (
    teacherNavigationBound
  ){
    return;
  }


  teacherNavigationBound =
    true;


  document.addEventListener(
    "click",
    event => {

      const button =
        event.target.closest(
          "[data-student-studio-page], [data-teacher-nav]"
        );


      if (
        !button
      ){
        return;
      }


      event.preventDefault();


      const page =
        button.dataset
          .studentStudioPage ||
        button.dataset
          .teacherNav ||
        "overview";


      activateStudentStudioPage(
        page
      );

    }
  );

}


/* =========================================================
   CLOSE STUDIO MENUS
========================================================= */

function closeStudentStudioMenus(){

  document
    .querySelectorAll(
      ".student-studio-menu.open, .teacher-studio-menu.open, [data-studio-menu].open"
    )
    .forEach(
      menu => {

        menu.classList.remove(
          "open"
        );

      }
    );


  document.body.classList.remove(
    "teacher-mobile-nav-open"
  );


  document.body.classList.remove(
    "student-mobile-nav-open"
  );

}


/* =========================================================
   INITIAL PAGE FROM HASH
========================================================= */

function getTeacherInitialStudioPage(){

  const hash =
    decodeURIComponent(
      String(
        window.location.hash ||
        ""
      )
        .replace(
          /^#/,
          ""
        )
        .trim()
    );


  if (
    hash &&
    TEACHER_STUDIO_RENDERERS[
      hash
    ]
  ){

    return hash;

  }


  return "overview";

}


/* =========================================================
   INITIALIZE ALL WORKSPACE CONTROLLERS
========================================================= */

function initializeTeacherWorkspaceControllers(){

  initializeTeacherOverview();


  initializeTeacherClassesWorkspace();


  initializeTeacherStudentsWorkspace();


  initializeTeacherAssignmentsWorkspace();


  initializeTeacherGradingWorkspace();


  initializeTeacherAttendanceWorkspace();


  initializeTeacherQuizzesWorkspace();


  initializeTeacherScheduleWorkspace();


  initializeTeacherResourcesWorkspace();


  initializeTeacherAnalyticsWorkspace();


  initializeTeacherKabezyaWorkspace();


  bindTeacherSettingsControls();


  bindTeacherSupportControls();


  bindTeacherMessageControls();


  bindStudentStudioNavigation();

}


/* =========================================================
   FINAL TEACHER STUDIO STARTUP
========================================================= */

let teacherStudioInitialized =
  false;


async function initializeTeacherStudio(){

  if (
    teacherStudioInitialized
  ){
    return;
  }


  teacherStudioInitialized =
    true;


  try{

    initializeTeacherWorkspaceControllers();


    const initialPage =
      getTeacherInitialStudioPage();


    activeStudentStudioPage =
      initialPage;


    await loadAll();


    activateStudentStudioPage(
      initialPage
    );


    /*
      Run these again after data load because some
      workspace renderers depend on authenticated
      teacher data.
    */

    hydrateTeacherSettingsFromUser();


    applyTeacherCompactMode();


    renderTeacherUnreadCount();


    document.body.classList.add(
      "teacher-studio-ready"
    );


    document.body.classList.remove(
      "teacher-studio-loading"
    );

  }catch(
    error
  ){

    teacherStudioInitialized =
      false;


    document.body.classList.remove(
      "teacher-studio-loading"
    );


    document.body.classList.add(
      "teacher-studio-error"
    );


    console.error(
      "Teacher Studio initialization failed:",
      error
    );


    showAlert(
      "error",
      error?.message ||
      "Teacher Studio could not be initialized.",
      {
        title:
          "Teacher Studio unavailable"
      }
    );

  }

}


/* =========================================================
   HASH NAVIGATION
========================================================= */

window.addEventListener(
  "hashchange",
  () => {

    const page =
      getTeacherInitialStudioPage();


    if (
      page !==
      activeStudentStudioPage
    ){

      activateStudentStudioPage(
        page
      );

    }

  }
);


/* =========================================================
   WINDOW FOCUS REFRESH
========================================================= */

let teacherLastFocusRefresh =
  0;


window.addEventListener(
  "focus",
  () => {

    if (
      !teacherStudioInitialized
    ){
      return;
    }


    const now =
      Date.now();


    /*
      Avoid excessive reloads when users quickly switch
      browser windows or tabs.
    */

    if (
      now -
      teacherLastFocusRefresh <
      60000
    ){
      return;
    }


    teacherLastFocusRefresh =
      now;


    Promise.allSettled([

      loadTeacherUnreadNotifications(),

      loadTeacherSubmissions(),

      loadTeacherSchedules()

    ])
      .then(
        () => {

          calculateTeacherMetrics();


          renderTeacherUnreadCount();


          renderTeacherDashboardStats();


          if (
            activeStudentStudioPage ===
            "overview"
          ){

            renderStudioHome();

          }

        }
      );

  }
);


/* =========================================================
   DOM READY STARTUP
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    document.body.classList.add(
      "teacher-studio-loading"
    );


    initializeTeacherStudio();

  }
);


/* =========================================================
   GLOBAL COMPATIBILITY EXPORTS
========================================================= */

/*
  These exports make it easier for existing inline HTML
  handlers from student.html or older AIFT pages to call
  Teacher Studio without duplicating logic.
*/

window.loadAll =
  loadAll;


window.refreshStudentDashboard =
  refreshStudentDashboard;


window.activateStudentStudioPage =
  activateStudentStudioPage;


window.renderActiveStudentStudioPage =
  renderActiveStudentStudioPage;


window.renderStudioHome =
  renderStudioHome;


window.renderTeacherClassesWorkspace =
  renderTeacherClassesWorkspace;


window.renderTeacherStudentsWorkspace =
  renderTeacherStudentsWorkspace;


window.renderTeacherAssignmentsWorkspace =
  renderTeacherAssignmentsWorkspace;


window.renderTeacherGradingWorkspace =
  renderTeacherGradingWorkspace;


window.renderTeacherAttendanceWorkspace =
  renderTeacherAttendanceWorkspace;


window.renderTeacherQuizzesWorkspace =
  renderTeacherQuizzesWorkspace;


window.renderTeacherScheduleWorkspace =
  renderTeacherScheduleWorkspace;


window.renderTeacherResourcesWorkspace =
  renderTeacherResourcesWorkspace;


window.renderTeacherAnalyticsWorkspace =
  renderTeacherAnalyticsWorkspace;


window.renderKabezyaTeacherAssistant =
  renderKabezyaTeacherAssistant;


/* =========================================================
   END OF TEACHER.JS
========================================================= */
