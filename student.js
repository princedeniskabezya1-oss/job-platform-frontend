"use strict";

/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 1

   CORE FOUNDATION
   ---------------------------------------------------------
   1. Configuration
   2. Authentication/session
   3. Shared application state
   4. Core utilities
   5. Identity helpers
   6. Teacher-scoping helpers
   7. API client
   8. Error model
   9. Notification system
   10. Modal utilities
   11. Loading-state utilities
========================================================= */


/* =========================================================
   APPLICATION CONFIGURATION
========================================================= */

const AIFT_TEACHER_CONFIG =
  Object.freeze({

    apiBase:
      "https://backend-1-9b6f.onrender.com",

    socketBase:
      "https://backend-1-9b6f.onrender.com",

    loginPage:
      "login.html",

    unauthorizedPage:
      "home.html",

    requestTimeout:
      30000,

    optionalRequestTimeout:
      20000,

    allowedRoles:
      Object.freeze([
        "teacher",
        "school",
        "admin"
      ]),

    storageKeys:
      Object.freeze({

        teacherToken:
          "teacherToken",

        schoolToken:
          "schoolToken",

        adminToken:
          "adminToken",

        genericToken:
          "token",

        role:
          "role",

        userId:
          "userId",

        activePage:
          "aiftTeacherStudioActivePage",

        sidebarCollapsed:
          "aiftTeacherStudioSidebarCollapsed",

        compactMode:
          "aiftTeacherStudioCompactMode"

      }),

    events:
      Object.freeze({

        ready:
          "teacherstudio:ready",

        pageChange:
          "teacherstudio:pagechange",

        dataRefresh:
          "teacherstudio:datarefresh",

        sessionExpired:
          "teacherstudio:sessionexpired",

        socketConnected:
          "teacherstudio:socketconnected",

        socketDisconnected:
          "teacherstudio:socketdisconnected"

      })

  });


/* =========================================================
   API COMPATIBILITY CONSTANT

   Keep API because a large amount of the existing Teacher
   Studio workspace code was written against this identifier.
========================================================= */

const API =
  AIFT_TEACHER_CONFIG.apiBase;


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
   AUTHENTICATION TOKEN RESOLUTION
========================================================= */

function getStoredAuthenticationToken(){

  const keys = [

    AIFT_TEACHER_CONFIG
      .storageKeys
      .teacherToken,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .schoolToken,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .adminToken,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .genericToken

  ];


  for (
    const key of keys
  ){

    const value =
      String(
        localStorage.getItem(
          key
        ) ||
        sessionStorage.getItem(
          key
        ) ||
        ""
      ).trim();


    if (
      value
    ){

      return value;

    }

  }


  return "";

}


/* =========================================================
   STORED ROLE RESOLUTION
========================================================= */

function getStoredRole(){

  return normalizeRole(
    localStorage.getItem(
      AIFT_TEACHER_CONFIG
        .storageKeys
        .role
    ) ||
    sessionStorage.getItem(
      AIFT_TEACHER_CONFIG
        .storageKeys
        .role
    ) ||
    ""
  );

}


/* =========================================================
   SESSION VALUES

   token remains a const for compatibility with older
   workspace functions that reference it directly.
========================================================= */

const token =
  getStoredAuthenticationToken();

const role =
  getStoredRole();


/* =========================================================
   URL STATE
========================================================= */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const selectedTeacherId =
  String(
    urlParams.get(
      "teacherId"
    ) ||
    ""
  ).trim();


/* =========================================================
   SHARED TEACHER STUDIO STATE

   This is the single authoritative application state.

   Workspace-specific state objects will be added in later
   parts, but all backend-loaded Teacher Studio data belongs
   here.
========================================================= */

const state = {

  /* -------------------------------------------------------
     SESSION / IDENTITY
  ------------------------------------------------------- */

  loggedUser:
    null,

  me:
    null,

  session:{
    authenticated:
      false,

    role:
      "",

    userId:
      "",

    teacherId:
      "",

    schoolId:
      "",

    initializedAt:
      null
  },


  /* -------------------------------------------------------
     CORE TEACHER DATA
  ------------------------------------------------------- */

  classes:
    [],

  students:
    [],

  assignments:
    [],

  submissions:
    [],

  schedules:
    [],

  attendance:
    [],

  quizzes:
    [],

  quizSubmissions:
    [],

  questionBank:
    [],

  resources:
    [],


  /* -------------------------------------------------------
     SECONDARY DATA
  ------------------------------------------------------- */

  posts:
    [],

  schoolUpdates:
    [],

  teachers:
    [],

  notifications:
    [],


  /* -------------------------------------------------------
     GRADING STATE
  ------------------------------------------------------- */

  grading:{

    pending:
      [],

    reviewed:
      [],

    returned:
      [],

    total:
      0

  },


  /* -------------------------------------------------------
     DASHBOARD METRICS
  ------------------------------------------------------- */

  metrics:{

    classes:
      0,

    students:
      0,

    assignments:
      0,

    submissions:
      0,

    pendingGrading:
      0,

    attendance:
      0,

    engagement:
      0,

    performance:
      0

  },


  /* -------------------------------------------------------
     PER-CLASS DATA CACHE

     Map key:
       class ID

     Map value:
       {
         students: [],
         assignments: [],
         submissions: [],
         schedules: [],
         attendance: [],
         quizzes: [],
         modules: [],
         lessons: [],
         analytics: {}
       }
  ------------------------------------------------------- */

  classDataById:
    new Map(),


  /* -------------------------------------------------------
     KABEZYA TEACHER AI STATE

     Kabezya remains advisory.
     No automatic grade publishing is performed here.
  ------------------------------------------------------- */

  kabezya:{

    ready:
      false,

    loading:
      false,

    classId:
      "",

    studentId:
      "",

    assignmentId:
      "",

    submissionId:
      "",

    analysis:
      null,

    history:
      [],

    error:
      null

  },


  /* -------------------------------------------------------
     NOTIFICATIONS
  ------------------------------------------------------- */

  unread:
    0,


  /* -------------------------------------------------------
     APPLICATION LIFECYCLE
  ------------------------------------------------------- */

  boot:{

    started:
      false,

    completed:
      false,

    failed:
      false,

    criticalDataLoaded:
      false,

    optionalDataLoaded:
      false,

    controllersBound:
      false,

    loading:
      false,

    error:
      null

  },


  /* -------------------------------------------------------
     SOCKET STATE

     Socket.IO is optional.
     REST must remain usable without realtime connectivity.
  ------------------------------------------------------- */

  socket:{

    instance:
      null,

    connected:
      false,

    connecting:
      false,

    lastConnectedAt:
      null,

    lastDisconnectedAt:
      null,

    error:
      null

  }

};


/* =========================================================
   DOM HELPER
========================================================= */

function $(
  id
){

  return document.getElementById(
    id
  );

}


/* =========================================================
   QUERY SELECTOR HELPERS
========================================================= */

function $one(
  selector,
  root = document
){

  if (
    !selector ||
    !root
  ){

    return null;

  }


  return root.querySelector(
    selector
  );

}


function $all(
  selector,
  root = document
){

  if (
    !selector ||
    !root
  ){

    return [];

  }


  return Array.from(
    root.querySelectorAll(
      selector
    )
  );

}


/* =========================================================
   ROLE NORMALIZATION
========================================================= */

function normalizeRole(
  value
){

  const normalized =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();


  const aliases = {

    instructor:
      "teacher",

    faculty:
      "teacher",

    learner:
      "student",

    administrator:
      "admin"

  };


  return (
    aliases[
      normalized
    ] ||
    normalized
  );

}


/* =========================================================
   ID NORMALIZATION
========================================================= */

function normalizeId(
  value
){

  if (
    value === null ||
    value === undefined
  ){

    return "";

  }


  if (
    typeof value ===
    "string"
  ){

    return value.trim();

  }


  if (
    typeof value ===
    "number"
  ){

    return String(
      value
    );

  }


  if (
    typeof value ===
      "object" &&
    value._id !==
      undefined
  ){

    return normalizeId(
      value._id
    );

  }


  if (
    typeof value ===
      "object" &&
    value.id !==
      undefined
  ){

    return normalizeId(
      value.id
    );

  }


  return String(
    value
  ).trim();

}


/* =========================================================
   ID COMPARISON
========================================================= */

function sameId(
  first,
  second
){

  const firstId =
    normalizeId(
      first
    );

  const secondId =
    normalizeId(
      second
    );


  return Boolean(
    firstId &&
    secondId &&
    firstId ===
      secondId
  );

}


/* =========================================================
   ARRAY NORMALIZATION

   Existing AIFT endpoints do not all use exactly the same
   envelope shape. This function intentionally understands
   the response shapes currently used around the platform.
========================================================= */

function asArray(
  value
){

  if (
    Array.isArray(
      value
    )
  ){

    return value;

  }


  if (
    !value ||
    typeof value !==
      "object"
  ){

    return [];

  }


  const candidates = [

    value.data,
    value.items,
    value.users,
    value.students,
    value.teachers,
    value.classes,
    value.assignments,
    value.submissions,
    value.schedules,
    value.attendance,
    value.quizzes,
    value.quizSubmissions,
    value.questions,
    value.questionBank,
    value.posts,
    value.resources,
    value.notifications,
    value.results

  ];


  for (
    const candidate of candidates
  ){

    if (
      Array.isArray(
        candidate
      )
    ){

      return candidate;

    }

  }


  return [];

}


/* =========================================================
   SAFE OBJECT
========================================================= */

function asObject(
  value
){

  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ){

    return value;

  }


  return {};

}


/* =========================================================
   HTML ESCAPING
========================================================= */

function escapeHtml(
  value
){

  return String(
    value ??
    ""
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
   ATTRIBUTE ESCAPING
========================================================= */

function escapeAttribute(
  value
){

  return escapeHtml(
    value
  );

}


/* =========================================================
   SAFE TEXT SETTER
========================================================= */

function setText(
  id,
  value
){

  const element =
    $(
      id
    );


  if (
    !element
  ){

    return false;

  }


  element.textContent =
    value ===
      null ||
    value ===
      undefined
      ? ""
      : String(
          value
        );


  return true;

}


/* =========================================================
   SAFE HTML SETTER

   Only use this when the caller has constructed sanitized
   markup. User-provided fields must pass through escapeHtml.
========================================================= */

function setHtml(
  id,
  html
){

  const element =
    $(
      id
    );


  if (
    !element
  ){

    return false;

  }


  element.innerHTML =
    String(
      html ||
      ""
    );


  return true;

}


/* =========================================================
   SAFE STRING
========================================================= */

function safeString(
  value,
  fallback = ""
){

  if (
    value ===
      null ||
    value ===
      undefined
  ){

    return fallback;

  }


  const normalized =
    String(
      value
    ).trim();


  return (
    normalized ||
    fallback
  );

}


/* =========================================================
   SAFE NUMBER
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
   INTEGER NORMALIZATION
========================================================= */

function safeInteger(
  value,
  fallback = 0
){

  const number =
    Number.parseInt(
      value,
      10
    );


  return Number.isFinite(
    number
  )
    ? number
    : fallback;

}


/* =========================================================
   PERCENTAGE NORMALIZATION
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
   BOOLEAN NORMALIZATION
========================================================= */

function normalizeBoolean(
  value,
  fallback = false
){

  if (
    typeof value ===
    "boolean"
  ){

    return value;

  }


  if (
    typeof value ===
    "number"
  ){

    return value !==
      0;

  }


  const normalized =
    String(
      value ??
      ""
    )
      .trim()
      .toLowerCase();


  if (
    [
      "true",
      "1",
      "yes",
      "on"
    ].includes(
      normalized
    )
  ){

    return true;

  }


  if (
    [
      "false",
      "0",
      "no",
      "off"
    ].includes(
      normalized
    )
  ){

    return false;

  }


  return fallback;

}


/* =========================================================
   VALID DATE
========================================================= */

function toValidDate(
  value
){

  if (
    !value
  ){

    return null;

  }


  const date =
    value instanceof Date
      ? new Date(
          value.getTime()
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


  return date;

}


/* =========================================================
   DATE FORMATTER
========================================================= */

function formatDate(
  value,
  fallback = "No date"
){

  const date =
    toValidDate(
      value
    );


  if (
    !date
  ){

    return fallback;

  }


  return date.toLocaleDateString(
    [],
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric"
    }
  );

}


/* =========================================================
   DATE + TIME FORMATTER
========================================================= */

function formatDateTime(
  value,
  fallback = "No date"
){

  const date =
    toValidDate(
      value
    );


  if (
    !date
  ){

    return fallback;

  }


  return date.toLocaleString(
    [],
    {
      month:
        "short",

      day:
        "numeric",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit"
    }
  );

}


/* =========================================================
   TIME FORMATTER
========================================================= */

function formatTime(
  value,
  fallback = ""
){

  if (
    !value
  ){

    return fallback;

  }


  if (
    typeof value ===
      "string" &&
    !value.includes(
      "T"
    ) &&
    /^\d{1,2}:\d{2}/.test(
      value
    )
  ){

    return value;

  }


  const date =
    toValidDate(
      value
    );


  if (
    !date
  ){

    return String(
      value
    );

  }


  return date.toLocaleTimeString(
    [],
    {
      hour:
        "2-digit",

      minute:
        "2-digit"
    }
  );

}


/* =========================================================
   RELATIVE DATE LABEL
========================================================= */

function formatRelativeDate(
  value
){

  const date =
    toValidDate(
      value
    );


  if (
    !date
  ){

    return "";

  }


  const now =
    Date.now();

  const difference =
    now -
    date.getTime();

  const absoluteDifference =
    Math.abs(
      difference
    );

  const minute =
    60 * 1000;

  const hour =
    60 * minute;

  const day =
    24 * hour;


  if (
    absoluteDifference <
    minute
  ){

    return difference >=
      0
      ? "Just now"
      : "Soon";

  }


  if (
    absoluteDifference <
    hour
  ){

    const minutes =
      Math.max(
        1,
        Math.round(
          absoluteDifference /
          minute
        )
      );


    return difference >=
      0
      ? `${minutes}m ago`
      : `In ${minutes}m`;

  }


  if (
    absoluteDifference <
    day
  ){

    const hours =
      Math.max(
        1,
        Math.round(
          absoluteDifference /
          hour
        )
      );


    return difference >=
      0
      ? `${hours}h ago`
      : `In ${hours}h`;

  }


  const days =
    Math.max(
      1,
      Math.round(
        absoluteDifference /
        day
      )
    );


  if (
    days <
    7
  ){

    return difference >=
      0
      ? `${days}d ago`
      : `In ${days}d`;

  }


  return formatDate(
    date
  );

}


/* =========================================================
   SAFE URL

   Allows HTTP(S) URLs only.
========================================================= */

function normalizeHttpUrl(
  value
){

  const raw =
    String(
      value ||
      ""
    ).trim();


  if (
    !raw
  ){

    return "";

  }


  try{

    const url =
      new URL(
        raw,
        window.location.origin
      );


    if (
      ![
        "http:",
        "https:"
      ].includes(
        url.protocol
      )
    ){

      return "";

    }


    return url.href;

  }catch{

    return "";

  }

}


/* =========================================================
   SAFE IMAGE SOURCE
========================================================= */

function getSafeImageUrl(
  value,
  fallback = FALLBACK_AVATAR
){

  return (
    normalizeHttpUrl(
      value
    ) ||
    fallback
  );

}


/* =========================================================
   UNIQUE BY ID
========================================================= */

function uniqueById(
  items
){

  const map =
    new Map();


  asArray(
    items
  ).forEach(
    item => {

      const id =
        normalizeId(
          item?._id ||
          item?.id ||
          item
        );


      if (
        !id ||
        map.has(
          id
        )
      ){

        return;

      }


      map.set(
        id,
        item
      );

    }
  );


  return Array.from(
    map.values()
  );

}


/* =========================================================
   SORT NEWEST FIRST
========================================================= */

function sortNewestFirst(
  items,
  fields = [
    "updatedAt",
    "createdAt"
  ]
){

  return [
    ...asArray(
      items
    )
  ].sort(
    (
      first,
      second
    ) => {

      const getTimestamp =
        item => {

          for (
            const field of fields
          ){

            const date =
              toValidDate(
                item?.[
                  field
                ]
              );


            if (
              date
            ){

              return date.getTime();

            }

          }


          return 0;

        };


      return (
        getTimestamp(
          second
        ) -
        getTimestamp(
          first
        )
      );

    }
  );

}


/* =========================================================
   TEACHER ID

   IMPORTANT:
   selectedTeacherId is accepted for school/admin inspection.
   A normal teacher session will later be validated against
   the authenticated identity during boot.
========================================================= */

function getTeacherId(){

  return normalizeId(

    state.session
      .teacherId ||

    selectedTeacherId ||

    state.me?._id ||
    state.me?.id ||

    state.loggedUser?._id ||
    state.loggedUser?.id ||

    localStorage.getItem(
      AIFT_TEACHER_CONFIG
        .storageKeys
        .userId
    )

  );

}


/* =========================================================
   SCHOOL ID
========================================================= */

function getSchoolId(){

  const sessionSchoolId =
    normalizeId(
      state.session
        .schoolId
    );


  if (
    sessionSchoolId
  ){

    return sessionSchoolId;

  }


  const profileSchoolId =
    normalizeId(

      state.me
        ?.schoolId
        ?._id ||

      state.me
        ?.schoolId ||

      state.me
        ?.linkedSchoolId
        ?._id ||

      state.me
        ?.linkedSchoolId

    );


  if (
    profileSchoolId
  ){

    return profileSchoolId;

  }


  const authenticatedSchoolId =
    normalizeId(

      state.loggedUser
        ?.schoolId
        ?._id ||

      state.loggedUser
        ?.schoolId ||

      state.loggedUser
        ?.linkedSchoolId
        ?._id ||

      state.loggedUser
        ?.linkedSchoolId

    );


  if (
    authenticatedSchoolId
  ){

    return authenticatedSchoolId;

  }


  const classWithSchool =
    asArray(
      state.classes
    ).find(
      classItem =>
        normalizeId(
          classItem
            ?.schoolId
            ?._id ||
          classItem
            ?.schoolId
        )
    );


  return normalizeId(
    classWithSchool
      ?.schoolId
      ?._id ||
    classWithSchool
      ?.schoolId
  );

}


/* =========================================================
   AUTHENTICATED USER ID
========================================================= */

function getAuthenticatedUserId(){

  return normalizeId(

    state.loggedUser
      ?._id ||

    state.loggedUser
      ?.id ||

    state.session
      .userId ||

    localStorage.getItem(
      AIFT_TEACHER_CONFIG
        .storageKeys
        .userId
    )

  );

}


/* =========================================================
   AUTHENTICATED ROLE
========================================================= */

function getAuthenticatedRole(){

  return normalizeRole(

    state.loggedUser
      ?.role ||

    state.me
      ?.role ||

    state.session
      .role ||

    role

  );

}


/* =========================================================
   ROLE CHECKS
========================================================= */

function isTeacherSession(){

  return (
    getAuthenticatedRole() ===
    "teacher"
  );

}


function isSchoolSession(){

  return (
    getAuthenticatedRole() ===
    "school"
  );

}


function isAdminSession(){

  return (
    getAuthenticatedRole() ===
    "admin"
  );

}


/* =========================================================
   GET ASSIGNED TEACHER CLASSES

   SECURITY MODEL:
   Frontend filtering is UX only.

   Backend permissions remain authoritative.

   For a teacher session, only classes whose teacherId
   matches that authenticated teacher are returned.

   School/admin sessions may inspect broader class data,
   but Teacher Studio's teacher-scoped workspaces still use
   the selected teacher when one is explicitly selected.
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

          classItem
            ?.teacherId
            ?._id ||

          classItem
            ?.teacherId

        );


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
   ASSIGNMENT STATUS
========================================================= */

function normalizeAssignmentStatus(
  value
){

  const status =
    String(
      value ||
      ""
    )
      .trim()
      .toLowerCase();


  const validStatuses =
    new Set([
      "draft",
      "published",
      "active",
      "closed",
      "archived"
    ]);


  if (
    validStatuses.has(
      status
    )
  ){

    return status;

  }


  return (
    status ||
    "active"
  );

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


  return (
    status ||
    "submitted"
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

  const teacherId =
    getTeacherId();


  return asArray(
    state.assignments
  ).filter(
    assignment => {

      const classId =
        normalizeId(
          assignment
            ?.classId
            ?._id ||
          assignment
            ?.classId
        );

      const assignmentTeacherId =
        normalizeId(
          assignment
            ?.teacherId
            ?._id ||
          assignment
            ?.teacherId
        );


      /*
        Modern assignment:
        belongs to one of this teacher's assigned classes.

        Legacy assignment without a class:
        preserve only if explicitly owned by this teacher.
      */

      if (
        classId
      ){

        return classIds.has(
          classId
        );

      }


      return (
        assignmentTeacherId &&
        sameId(
          assignmentTeacherId,
          teacherId
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

  const teacherId =
    getTeacherId();


  return asArray(
    state.submissions
  ).filter(
    submission => {

      const classId =
        normalizeId(
          submission
            ?.classId
            ?._id ||
          submission
            ?.classId
        );

      const submissionTeacherId =
        normalizeId(
          submission
            ?.teacherId
            ?._id ||
          submission
            ?.teacherId
        );


      if (
        classId
      ){

        return classIds.has(
          classId
        );

      }


      return (
        submissionTeacherId &&
        sameId(
          submissionTeacherId,
          teacherId
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

  const teacherId =
    getTeacherId();


  return asArray(
    state.schedules
  ).filter(
    schedule => {

      const classId =
        normalizeId(
          schedule
            ?.classId
            ?._id ||
          schedule
            ?.classId
        );

      const scheduleTeacherId =
        normalizeId(
          schedule
            ?.teacherId
            ?._id ||
          schedule
            ?.teacherId
        );


      if (
        classId
      ){

        return classIds.has(
          classId
        );

      }


      return (
        scheduleTeacherId &&
        sameId(
          scheduleTeacherId,
          teacherId
        )
      );

    }
  );

}


/* =========================================================
   GET TEACHER ATTENDANCE
========================================================= */

function getTeacherAttendance(){

  const classIds =
    new Set(
      getTeacherClassIds()
    );


  return asArray(
    state.attendance
  ).filter(
    attendanceItem => {

      const classId =
        normalizeId(
          attendanceItem
            ?.classId
            ?._id ||
          attendanceItem
            ?.classId
        );


      return (
        classId &&
        classIds.has(
          classId
        )
      );

    }
  );

}


/* =========================================================
   GET TEACHER QUIZZES
========================================================= */

function getTeacherQuizzes(){

  const classIds =
    new Set(
      getTeacherClassIds()
    );


  return asArray(
    state.quizzes
  ).filter(
    quiz => {

      const classId =
        normalizeId(
          quiz
            ?.classId
            ?._id ||
          quiz
            ?.classId
        );


      return (
        classId &&
        classIds.has(
          classId
        )
      );

    }
  );

}


/* =========================================================
   UNIQUE STUDENTS FROM ASSIGNED CLASSES
========================================================= */

function getTeacherStudents(){

  const studentMap =
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
          safeString(
            classItem?.title ||
            classItem?.subject,
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
              !studentMap.has(
                studentId
              )
            ){

              studentMap.set(
                studentId,
                {

                  id:
                    studentId,

                  student:
                    typeof student ===
                      "object"
                      ? student
                      : {
                          _id:
                            studentId
                        },

                  classes:
                    []

                }
              );

            }


            const record =
              studentMap.get(
                studentId
              );


            if (
              !record.classes.some(
                existingClass =>
                  sameId(
                    existingClass.id,
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
    studentMap.values()
  );

}


/* =========================================================
   PENDING TEACHER SUBMISSIONS
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
   REVIEWED TEACHER SUBMISSIONS
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
   RETURNED TEACHER SUBMISSIONS
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
   AUTHENTICATION HEADERS
========================================================= */

function authHeaders(
  extra = {}
){

  const headers = {
    ...extra
  };


  if (
    token
  ){

    headers.Authorization =
      `Bearer ${token}`;

  }


  return headers;

}


/* =========================================================
   SAFE JSON RESPONSE PARSER
========================================================= */

async function safeJson(
  response
){

  if (
    !response
  ){

    return null;

  }


  const contentType =
    String(
      response.headers
        ?.get(
          "content-type"
        ) ||
      ""
    ).toLowerCase();


  try{

    if (
      contentType.includes(
        "application/json"
      )
    ){

      return await response.json();

    }


    const text =
      await response.text();


    if (
      !text
    ){

      return null;

    }


    try{

      return JSON.parse(
        text
      );

    }catch{

      return {
        message:
          text
      };

    }

  }catch{

    return null;

  }

}


/* =========================================================
   APPLICATION ERROR CLASS
========================================================= */

class AIFTApiError extends Error{

  constructor(
    message,
    options = {}
  ){

    super(
      message ||
      "Request failed."
    );


    this.name =
      "AIFTApiError";

    this.status =
      safeInteger(
        options.status,
        0
      );

    this.code =
      safeString(
        options.code
      );

    this.path =
      safeString(
        options.path
      );

    this.method =
      safeString(
        options.method,
        "GET"
      );

    this.data =
      options.data ??
      null;

    this.cause =
      options.cause ??
      null;

    this.isTimeout =
      Boolean(
        options.isTimeout
      );

    this.isNetworkError =
      Boolean(
        options.isNetworkError
      );

    this.isAuthenticationError =
      this.status ===
      401;

    this.isAuthorizationError =
      this.status ===
      403;

  }

}


/* =========================================================
   CLEAR LOCAL AUTHENTICATION
========================================================= */

function clearTeacherAuthentication(){

  const keys = [

    AIFT_TEACHER_CONFIG
      .storageKeys
      .teacherToken,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .schoolToken,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .adminToken,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .genericToken,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .role,

    AIFT_TEACHER_CONFIG
      .storageKeys
      .userId

  ];


  keys.forEach(
    key => {

      localStorage.removeItem(
        key
      );

      sessionStorage.removeItem(
        key
      );

    }
  );


  state.session.authenticated =
    false;

  state.session.userId =
    "";

  state.session.teacherId =
    "";

  state.session.schoolId =
    "";

  state.session.role =
    "";

}


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToTeacherLogin(){

  const currentLocation =
    `${window.location.pathname}${window.location.search}${window.location.hash}`;


  try{

    sessionStorage.setItem(
      "aiftTeacherStudioReturnUrl",
      currentLocation
    );

  }catch{

    /*
      Storage failure must not prevent authentication redirect.
    */

  }


  window.location.replace(
    AIFT_TEACHER_CONFIG
      .loginPage
  );

}


/* =========================================================
   HANDLE AUTHENTICATION FAILURE
========================================================= */

function handleAuthenticationFailure(
  error = null
){

  clearTeacherAuthentication();


  document.dispatchEvent(
    new CustomEvent(
      AIFT_TEACHER_CONFIG
        .events
        .sessionExpired,
      {
        detail:{
          error
        }
      }
    )
  );


  redirectToTeacherLogin();

}


/* =========================================================
   REQUEST URL BUILDER
========================================================= */

function buildApiUrl(
  path,
  query = null
){

  const rawPath =
    String(
      path ||
      ""
    ).trim();


  if (
    !rawPath
  ){

    throw new AIFTApiError(
      "API path is required.",
      {
        code:
          "INVALID_API_PATH"
      }
    );

  }


  const url =
    /^https?:\/\//i.test(
      rawPath
    )
      ? new URL(
          rawPath
        )
      : new URL(
          rawPath.startsWith(
            "/"
          )
            ? rawPath
            : `/${rawPath}`,
          API
        );


  if (
    query &&
    typeof query ===
      "object"
  ){

    Object.entries(
      query
    ).forEach(
      ([
        key,
        value
      ]) => {

        if (
          value ===
            undefined ||
          value ===
            null ||
          value ===
            ""
        ){

          return;

        }


        if (
          Array.isArray(
            value
          )
        ){

          value.forEach(
            item => {

              if (
                item ===
                  undefined ||
                item ===
                  null ||
                item ===
                  ""
              ){

                return;

              }


              url.searchParams.append(
                key,
                String(
                  item
                )
              );

            }
          );


          return;

        }


        url.searchParams.set(
          key,
          String(
            value
          )
        );

      }
    );

  }


  return url.toString();

}


/* =========================================================
   API REQUEST

   Production behavior:
   - Bearer authentication
   - timeout / AbortController
   - JSON body support
   - FormData support
   - 401 session cleanup
   - useful typed errors
   - credentials intentionally omitted because auth is JWT
========================================================= */

async function apiRequest(
  path,
  options = {}
){

  const method =
    String(
      options.method ||
      "GET"
    )
      .trim()
      .toUpperCase();


  const timeout =
    Math.max(
      1000,
      safeInteger(
        options.timeout,
        AIFT_TEACHER_CONFIG
          .requestTimeout
      )
    );


  const controller =
    new AbortController();


  const timeoutId =
    window.setTimeout(
      () => {

        controller.abort();

      },
      timeout
    );


  let externalAbortHandler =
    null;


  if (
    options.signal
  ){

    if (
      options.signal.aborted
    ){

      controller.abort();

    }else{

      externalAbortHandler =
        () => {

          controller.abort();

        };


      options.signal.addEventListener(
        "abort",
        externalAbortHandler,
        {
          once:
            true
        }
      );

    }

  }


  const requestHeaders = {
    ...asObject(
      options.headers
    )
  };


  if (
    token
  ){

    requestHeaders.Authorization =
      `Bearer ${token}`;

  }


  const requestOptions = {

    method,

    headers:
      requestHeaders,

    signal:
      controller.signal,

    cache:
      options.cache ||
      "no-store",

    credentials:
      "omit"

  };


  if (
    options.body !==
      undefined &&
    method !==
      "GET" &&
    method !==
      "HEAD"
  ){

    if (
      options.body instanceof
      FormData
    ){

      requestOptions.body =
        options.body;

    }else if (
      typeof options.body ===
      "string"
    ){

      requestOptions.body =
        options.body;


      if (
        !Object.keys(
          requestHeaders
        ).some(
          key =>
            key.toLowerCase() ===
            "content-type"
        )
      ){

        requestHeaders[
          "Content-Type"
        ] =
          "application/json";

      }

    }else{

      requestHeaders[
        "Content-Type"
      ] =
        requestHeaders[
          "Content-Type"
        ] ||
        "application/json";


      requestOptions.body =
        JSON.stringify(
          options.body
        );

    }

  }


  const url =
    buildApiUrl(
      path,
      options.query
    );


  try{

    const response =
      await fetch(
        url,
        requestOptions
      );


    const data =
      await safeJson(
        response
      );


    if (
      response.status ===
      401
    ){

      const authenticationError =
        new AIFTApiError(
          data?.message ||
          "Your session has expired.",
          {
            status:
              401,

            data,

            path:
              url,

            method
          }
        );


      if (
        options.handleAuthentication !==
        false
      ){

        handleAuthenticationFailure(
          authenticationError
        );

      }


      throw authenticationError;

    }


    if (
      !response.ok
    ){

      throw new AIFTApiError(
        data?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`,
        {
          status:
            response.status,

          code:
            data?.code,

          data,

          path:
            url,

          method
        }
      );

    }


    return data;

  }catch(
    error
  ){

    if (
      error instanceof
      AIFTApiError
    ){

      throw error;

    }


    if (
      error?.name ===
      "AbortError"
    ){

      throw new AIFTApiError(
        "The request took too long to complete.",
        {
          code:
            "REQUEST_TIMEOUT",

          path:
            url,

          method,

          cause:
            error,

          isTimeout:
            true
        }
      );

    }


    throw new AIFTApiError(
      "Unable to reach the AIFT server. Check your connection and try again.",
      {
        code:
          "NETWORK_ERROR",

        path:
          url,

        method,

        cause:
          error,

        isNetworkError:
          true
      }
    );

  }finally{

    window.clearTimeout(
      timeoutId
    );


    if (
      options.signal &&
      externalAbortHandler
    ){

      options.signal.removeEventListener(
        "abort",
        externalAbortHandler
      );

    }

  }

}


/* =========================================================
   API GET
========================================================= */

async function apiGet(
  path,
  options = {}
){

  return apiRequest(
    path,
    {
      ...options,

      method:
        "GET"
    }
  );

}


/* =========================================================
   API POST
========================================================= */

async function apiPost(
  path,
  body,
  options = {}
){

  return apiRequest(
    path,
    {
      ...options,

      method:
        "POST",

      body
    }
  );

}


/* =========================================================
   API PATCH
========================================================= */

async function apiPatch(
  path,
  body,
  options = {}
){

  return apiRequest(
    path,
    {
      ...options,

      method:
        "PATCH",

      body
    }
  );

}


/* =========================================================
   API PUT
========================================================= */

async function apiPut(
  path,
  body,
  options = {}
){

  return apiRequest(
    path,
    {
      ...options,

      method:
        "PUT",

      body
    }
  );

}


/* =========================================================
   API DELETE
========================================================= */

async function apiDelete(
  path,
  options = {}
){

  return apiRequest(
    path,
    {
      ...options,

      method:
        "DELETE"
    }
  );

}


/* =========================================================
   LEGACY API REQUEST COMPATIBILITY

   Some existing workspace implementations use api().
   The new architecture keeps one real implementation instead
   of duplicating request logic.
========================================================= */

async function api(
  path,
  options = {}
){

  return apiRequest(
    path,
    options
  );

}


/* =========================================================
   AIFT NOTIFICATION SYSTEM
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
   NOTIFICATION REGION
========================================================= */

function getAIFTNotificationRegion(){

  let region =
    $(
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


  return Object.prototype
    .hasOwnProperty
    .call(
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


  const timer =
    safeInteger(
      notification.dataset
        .notificationTimer,
      0
    );


  if (
    timer
  ){

    window.clearTimeout(
      timer
    );

  }


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
   NOTIFICATION VISIBILITY LIMIT
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
   SHOW NOTIFICATION
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
    safeString(
      message,
      "An update is available."
    );

  const title =
    safeString(
      options.title,
      configuration.title
    );

  const duration =
    Math.max(
      1500,
      safeInteger(
        options.duration,
        AIFT_NOTIFICATION_DEFAULT_DURATION
      )
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
    `aift-notification-${++aiftNotificationSequence}`;


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
        class="${escapeAttribute(configuration.icon)}"
        aria-hidden="true"
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


  const startTimer =
    () => {

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


  const pauseTimer =
    () => {

      const timer =
        safeInteger(
          notification.dataset
            .notificationTimer,
          0
        );


      if (
        timer
      ){

        window.clearTimeout(
          timer
        );

      }


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


  const resumeTimer =
    () => {

      if (
        remaining <=
        0
      ){

        removeAIFTNotification(
          notification
        );

        return;

      }


      notification.classList.remove(
        "is-paused"
      );


      startTimer();

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


  startTimer();


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
   NOTIFICATION CONVENIENCE HELPERS
========================================================= */

function notifyAIFTSuccess(
  message,
  options = {}
){

  return showAlert(
    "success",
    message,
    {
      ...options,

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
      ...options,

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
      ...options,

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
      ...options,

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
   ERROR MESSAGE NORMALIZER
========================================================= */

function getErrorMessage(
  error,
  fallback =
    "Something went wrong."
){

  if (
    error instanceof
    AIFTApiError
  ){

    return (
      safeString(
        error.message
      ) ||
      fallback
    );

  }


  if (
    typeof error ===
    "string"
  ){

    return (
      error.trim() ||
      fallback
    );

  }


  return (
    safeString(
      error?.message
    ) ||
    safeString(
      error?.error
    ) ||
    fallback
  );

}


/* =========================================================
   NON-FATAL REQUEST ERROR REPORTING
========================================================= */

function reportOptionalRequestError(
  label,
  error
){

  const name =
    safeString(
      label,
      "Optional Teacher Studio request"
    );


  console.warn(
    `${name} failed:`,
    error
  );


  return error;

}


/* =========================================================
   CRITICAL ERROR REPORTING
========================================================= */

function reportCriticalTeacherStudioError(
  error,
  options = {}
){

  const message =
    getErrorMessage(
      error,
      "Teacher Studio could not be initialized."
    );


  console.error(
    "Teacher Studio critical error:",
    error
  );


  state.boot.failed =
    true;

  state.boot.error =
    error;


  if (
    options.notify !==
    false
  ){

    showAlert(
      "error",
      message,
      {
        title:
          options.title ||
          "Teacher Studio unavailable",

        duration:
          options.duration ||
          8000
      }
    );

  }


  return error;

}


/* =========================================================
   MODAL OPEN
========================================================= */

function openModal(
  id
){

  const modal =
    $(
      id
    );


  if (
    !modal
  ){

    return false;

  }


  modal.classList.add(
    "show"
  );

  modal.hidden =
    false;

  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.classList.add(
    "teacher-studio-modal-open"
  );


  return true;

}


/* =========================================================
   MODAL CLOSE
========================================================= */

function closeModal(
  id
){

  const modal =
    $(
      id
    );


  if (
    !modal
  ){

    return false;

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
      ".modal.show, [role='dialog'].show"
    )
  ){

    document.body.classList.remove(
      "teacher-studio-modal-open"
    );

  }


  return true;

}


/* =========================================================
   LOADING STATE

   Startup code in a later part will always use this through
   try/finally so the interface can never remain permanently
   faded because of an optional request failure.
========================================================= */

function setTeacherStudioLoading(
  loading
){

  const isLoading =
    Boolean(
      loading
    );


  state.boot.loading =
    isLoading;


  if (
    !document.body
  ){

    return;

  }


  document.body.classList.toggle(
    "teacher-studio-loading",
    isLoading
  );


  document.body.setAttribute(
    "aria-busy",
    String(
      isLoading
    )
  );

}


/* =========================================================
   READY STATE
========================================================= */

function setTeacherStudioReady(){

  state.boot.completed =
    true;

  state.boot.failed =
    false;

  state.boot.loading =
    false;

  state.boot.error =
    null;


  if (
    document.body
  ){

    document.body.classList.remove(
      "teacher-studio-loading",
      "teacher-studio-error"
    );

    document.body.classList.add(
      "teacher-studio-ready"
    );

    document.body.setAttribute(
      "aria-busy",
      "false"
    );

  }


  document.dispatchEvent(
    new CustomEvent(
      AIFT_TEACHER_CONFIG
        .events
        .ready,
      {
        detail:{
          teacherId:
            getTeacherId(),

          schoolId:
            getSchoolId()
        }
      }
    )
  );

}


/* =========================================================
   ERROR STATE
========================================================= */

function setTeacherStudioError(
  error
){

  state.boot.completed =
    false;

  state.boot.failed =
    true;

  state.boot.loading =
    false;

  state.boot.error =
    error ||
    null;


  if (
    document.body
  ){

    document.body.classList.remove(
      "teacher-studio-loading",
      "teacher-studio-ready"
    );

    document.body.classList.add(
      "teacher-studio-error"
    );

    document.body.setAttribute(
      "aria-busy",
      "false"
    );

  }

}


/* =========================================================
   BASIC SESSION VALIDATION

   This performs only client-side preflight validation.

   Real authorization remains server-side and will be
   confirmed by /api/auth/me during the centralized boot.
========================================================= */

function validateStoredTeacherSession(){

  if (
    !token
  ){

    return {
      valid:
        false,

      reason:
        "NO_TOKEN",

      message:
        "Authentication is required."
    };

  }


  if (
    role &&
    !AIFT_TEACHER_CONFIG
      .allowedRoles
      .includes(
        role
      )
  ){

    return {
      valid:
        false,

      reason:
        "INVALID_ROLE",

      message:
        "This account cannot access Teacher Studio."
    };

  }


  return {
    valid:
      true,

    reason:
      "",

    message:
      ""
  };

}


/* =========================================================
   INITIAL AUTHENTICATION PREFLIGHT

   Do not perform any backend requests here.

   The real authenticated-user request belongs to the
   centralized boot loader in Part 2.
========================================================= */

function runTeacherStudioAuthenticationPreflight(){

  const result =
    validateStoredTeacherSession();


  if (
    result.valid
  ){

    return true;

  }


  if (
    result.reason ===
    "NO_TOKEN"
  ){

    redirectToTeacherLogin();

    return false;

  }


  if (
    result.reason ===
    "INVALID_ROLE"
  ){

    window.location.replace(
      AIFT_TEACHER_CONFIG
        .unauthorizedPage
    );

    return false;

  }


  return false;

}


/* =========================================================
   FOUNDATION COMPLETE

   IMPORTANT:
   There is intentionally NO DOMContentLoaded startup here.

   There is intentionally NO loadAll() here yet.

   Part 2 will add the real centralized data-loading layer
   before startup is wired.

   This prevents the browser from attempting initialization
   before every required production dependency exists.
========================================================= */

/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 2

   AUTHENTICATED DATA + CENTRALIZED LOADERS
   ---------------------------------------------------------
   1. Authenticated user loading
   2. Session normalization
   3. Teacher identity validation
   4. Assigned-class loading
   5. Core teacher data loaders
   6. Class-scoped attendance loading
   7. Class-scoped quiz loading
   8. Quiz submission loading
   9. Question Bank loader architecture
   10. Metrics calculation
   11. Per-class cache construction
   12. Critical/optional boot data orchestration
========================================================= */


/* =========================================================
   AUTHENTICATED USER RESPONSE NORMALIZER

   /api/auth/me may return the user directly or inside a
   wrapper depending on backend evolution.

   We normalize both without inventing missing fields.
========================================================= */

function normalizeAuthenticatedUserResponse(
  response
){

  if (
    !response ||
    typeof response !==
      "object"
  ){

    return null;

  }


  if (
    response.user &&
    typeof response.user ===
      "object"
  ){

    return response.user;

  }


  if (
    response.data &&
    typeof response.data ===
      "object" &&
    !Array.isArray(
      response.data
    )
  ){

    return response.data;

  }


  return response;

}


/* =========================================================
   AUTHENTICATED USER ROLE VALIDATION
========================================================= */

function validateAuthenticatedTeacherStudioRole(
  user
){

  const authenticatedRole =
    normalizeRole(
      user?.role
    );


  if (
    !authenticatedRole
  ){

    throw new AIFTApiError(
      "Your account role could not be verified.",
      {
        status:
          403,

        code:
          "MISSING_ACCOUNT_ROLE"
      }
    );

  }


  if (
    !AIFT_TEACHER_CONFIG
      .allowedRoles
      .includes(
        authenticatedRole
      )
  ){

    throw new AIFTApiError(
      "This account cannot access Teacher Studio.",
      {
        status:
          403,

        code:
          "TEACHER_STUDIO_ROLE_DENIED"
      }
    );

  }


  return authenticatedRole;

}


/* =========================================================
   APPLY AUTHENTICATED USER TO SESSION
========================================================= */

function hydrateAuthenticatedSession(
  user
){

  if (
    !user ||
    typeof user !==
      "object"
  ){

    throw new AIFTApiError(
      "Authenticated account information is unavailable.",
      {
        code:
          "INVALID_AUTHENTICATED_USER"
      }
    );

  }


  const authenticatedRole =
    validateAuthenticatedTeacherStudioRole(
      user
    );

  const authenticatedUserId =
    normalizeId(
      user._id ||
      user.id
    );


  if (
    !authenticatedUserId
  ){

    throw new AIFTApiError(
      "Authenticated user ID is unavailable.",
      {
        code:
          "MISSING_AUTHENTICATED_USER_ID"
      }
    );

  }


  state.loggedUser =
    user;

  state.session.authenticated =
    true;

  state.session.userId =
    authenticatedUserId;

  state.session.role =
    authenticatedRole;

  state.session.initializedAt =
    new Date();


  /*
    For a normal teacher session, the Teacher Studio identity
    MUST be the authenticated teacher.

    A teacher is not allowed to change ?teacherId= and inspect
    another teacher.

    School/admin accounts may intentionally select a teacher
    later for management/inspection.
  */

  if (
    authenticatedRole ===
    "teacher"
  ){

    state.session.teacherId =
      authenticatedUserId;

  }else if (
    selectedTeacherId
  ){

    state.session.teacherId =
      normalizeId(
        selectedTeacherId
      );

  }


  const directSchoolId =
    normalizeId(

      user.schoolId?._id ||
      user.schoolId ||

      user.linkedSchoolId?._id ||
      user.linkedSchoolId

    );


  if (
    directSchoolId
  ){

    state.session.schoolId =
      directSchoolId;

  }else if (
    authenticatedRole ===
    "school"
  ){

    /*
      The school account itself is the owning school.
    */

    state.session.schoolId =
      authenticatedUserId;

  }


  return user;

}


/* =========================================================
   LOAD AUTHENTICATED USER

   CRITICAL REQUEST
========================================================= */

async function loadAuthenticatedTeacherStudioUser(){

  const response =
    await apiGet(
      "/api/auth/me",
      {
        timeout:
          AIFT_TEACHER_CONFIG
            .requestTimeout
      }
    );


  const user =
    normalizeAuthenticatedUserResponse(
      response
    );


  if (
    !user
  ){

    throw new AIFTApiError(
      "AIFT could not load your authenticated account.",
      {
        code:
          "AUTH_USER_UNAVAILABLE"
      }
    );

  }


  hydrateAuthenticatedSession(
    user
  );


  return user;

}


/* =========================================================
   VALIDATE SELECTED TEACHER ACCESS

   A normal teacher MUST never inspect another teacher through
   a changed URL parameter.

   School/admin accounts may use teacherId to inspect a teacher
   once backend endpoints permit it.
========================================================= */

function validateSelectedTeacherIdentity(){

  const authenticatedRole =
    getAuthenticatedRole();

  const authenticatedUserId =
    getAuthenticatedUserId();


  if (
    authenticatedRole ===
      "teacher" &&
    selectedTeacherId &&
    !sameId(
      selectedTeacherId,
      authenticatedUserId
    )
  ){

    throw new AIFTApiError(
      "You are not allowed to open another teacher's studio.",
      {
        status:
          403,

        code:
          "TEACHER_IDENTITY_MISMATCH"
      }
    );

  }


  if (
    authenticatedRole ===
      "teacher"
  ){

    state.session.teacherId =
      authenticatedUserId;

  }


  return true;

}


/* =========================================================
   NORMALIZE CLASS COLLECTION
========================================================= */

function normalizeTeacherClassCollection(
  response
){

  return uniqueById(
    asArray(
      response
    )
  );

}


/* =========================================================
   LOAD ASSIGNED CLASSES

   CRITICAL REQUEST

   IMPORTANT:
   Even though the current GET /api/classes teacher branch is
   broader than ideal, the route supports teacherId filtering.

   Teacher Studio ALWAYS requests the target teacherId.

   Backend security will still be tightened separately.
========================================================= */

async function loadTeacherClasses(){

  const teacherId =
    getTeacherId();


  if (
    !teacherId
  ){

    throw new AIFTApiError(
      "Teacher identity is required before classes can load.",
      {
        code:
          "MISSING_TEACHER_ID"
      }
    );

  }


  const response =
    await apiGet(
      "/api/classes",
      {
        query:{
          teacherId
        }
      }
    );


  const classes =
    normalizeTeacherClassCollection(
      response
    )
      .filter(
        classItem => {

          const classTeacherId =
            normalizeId(
              classItem
                ?.teacherId
                ?._id ||
              classItem
                ?.teacherId
            );


          return (
            classTeacherId &&
            sameId(
              classTeacherId,
              teacherId
            )
          );

        }
      );


  state.classes =
    classes;


  /*
    If /api/auth/me does not expose schoolId yet, derive the
    school only from an actually assigned class.

    We do NOT invent a school ID.
  */

  if (
    !state.session.schoolId
  ){

    const assignedClassWithSchool =
      classes.find(
        classItem =>
          normalizeId(
            classItem
              ?.schoolId
              ?._id ||
            classItem
              ?.schoolId
          )
      );


    const derivedSchoolId =
      normalizeId(
        assignedClassWithSchool
          ?.schoolId
          ?._id ||
        assignedClassWithSchool
          ?.schoolId
      );


    if (
      derivedSchoolId
    ){

      state.session.schoolId =
        derivedSchoolId;

    }

  }


  return classes;

}


/* =========================================================
   LOAD ASSIGNMENTS

   The frontend explicitly requests teacherId.

   Returned data is then filtered again using assigned classes.

   Backend remains the authority and will be tightened so a
   crafted teacherId cannot expose another teacher's data.
========================================================= */

async function loadTeacherAssignments(){

  const teacherId =
    getTeacherId();


  if (
    !teacherId
  ){

    state.assignments =
      [];

    return [];

  }


  const response =
    await apiGet(
      "/api/assignments",
      {
        query:{
          teacherId
        }
      }
    );


  state.assignments =
    uniqueById(
      asArray(
        response
      )
    );


  return getTeacherAssignments();

}


/* =========================================================
   LOAD SUBMISSIONS

   The current backend rejects a teacher attempting to request
   another teacher's teacherId.

   We still filter client-side for correct UX.
========================================================= */

async function loadTeacherSubmissions(){

  const teacherId =
    getTeacherId();


  if (
    !teacherId
  ){

    state.submissions =
      [];

    return [];

  }


  const response =
    await apiGet(
      "/api/submissions",
      {
        query:{
          teacherId
        }
      }
    );


  state.submissions =
    uniqueById(
      asArray(
        response
      )
    );


  return getTeacherSubmissions();

}


/* =========================================================
   LOAD SCHEDULES

   Backend teacher schedule access is already based on assigned
   class IDs.

   No school-wide teacher fallback is introduced here.
========================================================= */

async function loadTeacherSchedules(){

  const response =
    await apiGet(
      "/api/schedules"
    );


  state.schedules =
    uniqueById(
      asArray(
        response
      )
    );


  return getTeacherSchedules();

}


/* =========================================================
   LOAD ATTENDANCE FOR ONE CLASS

   Attendance is deliberately loaded class-by-class.

   This matches the backend's strongest authorization path:
   /api/attendance?classId=<authorized class>
========================================================= */

async function loadTeacherAttendanceForClass(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){

    return [];

  }


  const response =
    await apiGet(
      "/api/attendance",
      {
        query:{
          classId:
            normalizedClassId
        }
      }
    );


  return asArray(
    response
  );

}


/* =========================================================
   LOAD ALL TEACHER ATTENDANCE

   One broken class request does not destroy the whole Studio.

   Authentication errors remain fatal because apiRequest()
   already handles them.
========================================================= */

async function loadTeacherAttendance(){

  const classIds =
    getTeacherClassIds();


  if (
    !classIds.length
  ){

    state.attendance =
      [];

    return [];

  }


  const results =
    await Promise.allSettled(
      classIds.map(
        classId =>
          loadTeacherAttendanceForClass(
            classId
          )
      )
    );


  const attendance =
    [];


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        "fulfilled"
      ){

        attendance.push(
          ...asArray(
            result.value
          )
        );


        return;

      }


      reportOptionalRequestError(
        `Attendance for class ${classIds[index]}`,
        result.reason
      );

    }
  );


  state.attendance =
    uniqueById(
      attendance
    );


  return getTeacherAttendance();

}


/* =========================================================
   LOAD QUIZZES FOR ONE CLASS

   IMPORTANT SECURITY DECISION:
   Current GET /api/quizzes without classId may load school-wide
   quizzes for non-admin accounts.

   Teacher Studio therefore uses ONLY class-scoped requests.
========================================================= */

async function loadTeacherQuizzesForClass(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){

    return [];

  }


  const response =
    await apiGet(
      "/api/quizzes",
      {
        query:{
          classId:
            normalizedClassId
        }
      }
    );


  return asArray(
    response
  );

}


/* =========================================================
   LOAD TEACHER QUIZZES
========================================================= */

async function loadTeacherQuizzes(){

  const classIds =
    getTeacherClassIds();


  if (
    !classIds.length
  ){

    state.quizzes =
      [];

    return [];

  }


  const results =
    await Promise.allSettled(
      classIds.map(
        classId =>
          loadTeacherQuizzesForClass(
            classId
          )
      )
    );


  const quizzes =
    [];


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        "fulfilled"
      ){

        quizzes.push(
          ...asArray(
            result.value
          )
        );


        return;

      }


      reportOptionalRequestError(
        `Quizzes for class ${classIds[index]}`,
        result.reason
      );

    }
  );


  state.quizzes =
    uniqueById(
      quizzes
    );


  return getTeacherQuizzes();

}


/* =========================================================
   LOAD QUIZ SUBMISSIONS FOR ONE CLASS

   Backend route:
     GET /api/quizzes/submissions/list?classId=

   Class authorization is performed server-side.
========================================================= */

async function loadTeacherQuizSubmissionsForClass(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){

    return [];

  }


  const response =
    await apiGet(
      "/api/quizzes/submissions/list",
      {
        query:{
          classId:
            normalizedClassId
        }
      }
    );


  return asArray(
    response
  );

}


/* =========================================================
   LOAD TEACHER QUIZ SUBMISSIONS
========================================================= */

async function loadTeacherQuizSubmissions(){

  const classIds =
    getTeacherClassIds();


  if (
    !classIds.length
  ){

    state.quizSubmissions =
      [];

    return [];

  }


  const results =
    await Promise.allSettled(
      classIds.map(
        classId =>
          loadTeacherQuizSubmissionsForClass(
            classId
          )
      )
    );


  const submissions =
    [];


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        "fulfilled"
      ){

        submissions.push(
          ...asArray(
            result.value
          )
        );


        return;

      }


      reportOptionalRequestError(
        `Quiz submissions for class ${classIds[index]}`,
        result.reason
      );

    }
  );


  state.quizSubmissions =
    uniqueById(
      submissions
    );


  return state.quizSubmissions;

}


/* =========================================================
   LOAD QUESTION BANK

   IMPORTANT SECURITY STATUS

   The current questionBank backend you supplied is not yet
   authenticated.

   This loader exists so the Question Bank workspace has one
   canonical integration point, but centralized boot WILL NOT
   call it until that backend route is hardened.

   We do not fake Question Bank success.
========================================================= */

async function loadTeacherQuestionBank(){

  const schoolId =
    getSchoolId();


  if (
    !schoolId
  ){

    state.questionBank =
      [];

    return [];

  }


  const response =
    await apiGet(
      "/api/question-bank",
      {
        query:{
          schoolId,
          archived:
            false
        },

        timeout:
          AIFT_TEACHER_CONFIG
            .optionalRequestTimeout
      }
    );


  state.questionBank =
    uniqueById(
      asArray(
        response
      )
    );


  return state.questionBank;

}


/* =========================================================
   QUESTION BANK BOOT ENABLE FLAG

   Keep false until routes/questionBank.js has real auth +
   school/teacher authorization.

   This is NOT a fake guard around a missing function.

   It is an explicit product capability state corresponding
   to a known insecure backend route.
========================================================= */

const TEACHER_QUESTION_BANK_BOOT_ENABLED =
  false;


/* =========================================================
   LOAD OPTIONAL QUESTION BANK AFTER BACKEND HARDENING
========================================================= */

async function loadTeacherQuestionBankWhenAvailable(){

  if (
    !TEACHER_QUESTION_BANK_BOOT_ENABLED
  ){

    state.questionBank =
      [];

    return {
      enabled:
        false,

      questions:
        []
    };

  }


  const questions =
    await loadTeacherQuestionBank();


  return {
    enabled:
      true,

    questions
  };

}


/* =========================================================
   LOAD RESOURCES

   The exact dedicated resource backend contract has not been
   established from the supplied routes.

   Do NOT call a guessed endpoint.

   Existing class/module/lesson resource implementations will
   populate state.resources through their real APIs in later
   workspace parts.
========================================================= */

async function loadTeacherResources(){

  return state.resources;

}


/* =========================================================
   LOAD UNREAD NOTIFICATIONS

   No notification endpoint was included in the backend files
   supplied for this repair.

   This function therefore DOES NOT issue a guessed request.

   The notification UI remains operational. Once the actual
   notification route is inspected, its implementation plugs
   into this function without affecting startup architecture.
========================================================= */

async function loadTeacherUnreadNotifications(){

  state.unread =
    Math.max(
      0,
      safeInteger(
        state.unread,
        0
      )
    );


  return state.unread;

}


/* =========================================================
   NORMALIZE STUDENT COLLECTION

   Primary student information currently comes from populated
   class.studentIds.

   This avoids inventing a separate students endpoint.
========================================================= */

function rebuildTeacherStudents(){

  state.students =
    getTeacherStudents();


  return state.students;

}


/* =========================================================
   BUILD GRADING STATE
========================================================= */

function rebuildTeacherGradingState(){

  const pending =
    getPendingTeacherSubmissions();

  const reviewed =
    getReviewedTeacherSubmissions();

  const returned =
    getReturnedTeacherSubmissions();


  state.grading.pending =
    pending;

  state.grading.reviewed =
    reviewed;

  state.grading.returned =
    returned;

  state.grading.total =
    getTeacherSubmissions()
      .length;


  return state.grading;

}


/* =========================================================
   ATTENDANCE RATE
========================================================= */

function calculateTeacherAttendanceRate(){

  const attendance =
    getTeacherAttendance();


  if (
    !attendance.length
  ){

    return 0;

  }


  const attended =
    attendance.filter(
      record => {

        const status =
          String(
            record?.status ||
            ""
          )
            .trim()
            .toLowerCase();


        return [
          "present",
          "late"
        ].includes(
          status
        );

      }
    ).length;


  return clampPercentage(
    (
      attended /
      attendance.length
    ) *
    100
  );

}


/* =========================================================
   SUBMISSION ENGAGEMENT RATE

   This is a Teacher Studio operational metric.

   It measures unique students represented in submissions
   against the teacher's unique assigned students.

   It is NOT presented as an academic grade.
========================================================= */

function calculateTeacherEngagementRate(){

  const students =
    getTeacherStudents();

  const submissions =
    getTeacherSubmissions();


  if (
    !students.length
  ){

    return 0;

  }


  const submittingStudentIds =
    new Set();


  submissions.forEach(
    submission => {

      const studentId =
        normalizeId(
          submission
            ?.studentId
            ?._id ||
          submission
            ?.studentId
        );


      if (
        studentId
      ){

        submittingStudentIds.add(
          studentId
        );

      }

    }
  );


  return clampPercentage(
    (
      submittingStudentIds.size /
      students.length
    ) *
    100
  );

}


/* =========================================================
   PERFORMANCE METRIC

   Uses reviewed numeric grades only.

   It does not allow Kabezya to publish or modify grades.
========================================================= */

function calculateTeacherPerformanceRate(){

  const reviewedSubmissions =
    getReviewedTeacherSubmissions()
      .filter(
        submission =>
          Number.isFinite(
            Number(
              submission?.grade
            )
          )
      );


  if (
    !reviewedSubmissions.length
  ){

    return 0;

  }


  const total =
    reviewedSubmissions.reduce(
      (
        sum,
        submission
      ) =>
        sum +
        safeNumber(
          submission?.grade,
          0
        ),
      0
    );


  return clampPercentage(
    total /
    reviewedSubmissions.length
  );

}


/* =========================================================
   CALCULATE TEACHER METRICS
========================================================= */

function calculateTeacherMetrics(){

  const classes =
    getTeacherClasses();

  const students =
    getTeacherStudents();

  const assignments =
    getTeacherAssignments();

  const submissions =
    getTeacherSubmissions();

  const pendingGrading =
    getPendingTeacherSubmissions();


  state.metrics.classes =
    classes.length;

  state.metrics.students =
    students.length;

  state.metrics.assignments =
    assignments.length;

  state.metrics.submissions =
    submissions.length;

  state.metrics.pendingGrading =
    pendingGrading.length;

  state.metrics.attendance =
    calculateTeacherAttendanceRate();

  state.metrics.engagement =
    calculateTeacherEngagementRate();

  state.metrics.performance =
    calculateTeacherPerformanceRate();


  return state.metrics;

}


/* =========================================================
   CREATE EMPTY CLASS CACHE RECORD
========================================================= */

function createTeacherClassCacheRecord(
  classItem
){

  return {

    classId:
      normalizeId(
        classItem?._id ||
        classItem?.id
      ),

    classItem,

    students:
      [],

    assignments:
      [],

    submissions:
      [],

    schedules:
      [],

    attendance:
      [],

    quizzes:
      [],

    quizSubmissions:
      [],

    modules:
      [],

    lessons:
      [],

    analytics:
      {}

  };

}


/* =========================================================
   REBUILD PER-CLASS DATA CACHE
========================================================= */

function rebuildTeacherClassDataCache(){

  state.classDataById.clear();


  getTeacherClasses()
    .forEach(
      classItem => {

        const classId =
          normalizeId(
            classItem?._id ||
            classItem?.id
          );


        if (
          !classId
        ){

          return;

        }


        const record =
          createTeacherClassCacheRecord(
            classItem
          );


        record.students =
          asArray(
            classItem?.studentIds
          );


        record.assignments =
          getTeacherAssignments()
            .filter(
              assignment =>
                sameId(
                  assignment
                    ?.classId
                    ?._id ||
                  assignment
                    ?.classId,
                  classId
                )
            );


        record.submissions =
          getTeacherSubmissions()
            .filter(
              submission =>
                sameId(
                  submission
                    ?.classId
                    ?._id ||
                  submission
                    ?.classId,
                  classId
                )
            );


        record.schedules =
          getTeacherSchedules()
            .filter(
              schedule =>
                sameId(
                  schedule
                    ?.classId
                    ?._id ||
                  schedule
                    ?.classId,
                  classId
                )
            );


        record.attendance =
          getTeacherAttendance()
            .filter(
              attendanceRecord =>
                sameId(
                  attendanceRecord
                    ?.classId
                    ?._id ||
                  attendanceRecord
                    ?.classId,
                  classId
                )
            );


        record.quizzes =
          getTeacherQuizzes()
            .filter(
              quiz =>
                sameId(
                  quiz
                    ?.classId
                    ?._id ||
                  quiz
                    ?.classId,
                  classId
                )
            );


        record.quizSubmissions =
          asArray(
            state.quizSubmissions
          )
            .filter(
              submission =>
                sameId(
                  submission
                    ?.classId
                    ?._id ||
                  submission
                    ?.classId,
                  classId
                )
            );


        state.classDataById.set(
          classId,
          record
        );

      }
    );


  return state.classDataById;

}


/* =========================================================
   GET CLASS CACHE
========================================================= */

function getTeacherClassData(
  classId
){

  return (
    state.classDataById.get(
      normalizeId(
        classId
      )
    ) ||
    null
  );

}


/* =========================================================
   FINALIZE LOADED TEACHER DATA
========================================================= */

function finalizeTeacherLoadedData(){

  rebuildTeacherStudents();

  rebuildTeacherGradingState();

  calculateTeacherMetrics();

  rebuildTeacherClassDataCache();


  return state;

}


/* =========================================================
   CRITICAL DATA LOAD

   Critical means:
   - authenticated account
   - authorization
   - teacher identity
   - assigned classes

   If these fail, Teacher Studio cannot safely continue.
========================================================= */

async function loadTeacherCriticalData(){

  const authenticatedUser =
    await loadAuthenticatedTeacherStudioUser();


  validateSelectedTeacherIdentity();


  await loadTeacherClasses();


  state.boot.criticalDataLoaded =
    true;


  return {
    authenticatedUser,

    classes:
      getTeacherClasses(),

    teacherId:
      getTeacherId(),

    schoolId:
      getSchoolId()
  };

}


/* =========================================================
   PRIMARY WORKSPACE DATA

   Assignments/submissions/schedules directly drive the
   Teacher Studio's primary workspaces.

   They are loaded together after assigned classes exist.
========================================================= */

async function loadTeacherPrimaryWorkspaceData(){

  const results =
    await Promise.allSettled([

      loadTeacherAssignments(),

      loadTeacherSubmissions(),

      loadTeacherSchedules()

    ]);


  const labels = [
    "Assignments",
    "Submissions",
    "Schedules"
  ];


  const failures =
    [];


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        "rejected"
      ){

        failures.push({
          label:
            labels[index],

          error:
            result.reason
        });

      }

    }
  );


  /*
    Authentication failures have already been handled by the
    API client.

    A single workspace endpoint failure does not leave the
    entire page permanently disabled. The failed workspace can
    present a recoverable state later.
  */

  failures.forEach(
    failure => {

      reportOptionalRequestError(
        failure.label,
        failure.error
      );

    }
  );


  return {
    assignments:
      getTeacherAssignments(),

    submissions:
      getTeacherSubmissions(),

    schedules:
      getTeacherSchedules(),

    failures
  };

}


/* =========================================================
   SECONDARY / OPTIONAL DATA LOAD

   These datasets enrich Teacher Studio but must not make the
   complete dashboard unusable if one request fails.
========================================================= */

async function loadTeacherOptionalData(){

  const tasks = [

    {
      name:
        "Attendance",

      run:
        loadTeacherAttendance
    },

    {
      name:
        "Quizzes",

      run:
        loadTeacherQuizzes
    },

    {
      name:
        "Quiz submissions",

      run:
        loadTeacherQuizSubmissions
    },

    {
      name:
        "Unread notifications",

      run:
        loadTeacherUnreadNotifications
    },

    {
      name:
        "Resources",

      run:
        loadTeacherResources
    },

    {
      name:
        "Question Bank",

      run:
        loadTeacherQuestionBankWhenAvailable
    }

  ];


  const results =
    await Promise.allSettled(
      tasks.map(
        task =>
          task.run()
      )
    );


  const failures =
    [];


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        "rejected"
      ){

        const failure = {
          name:
            tasks[index].name,

          error:
            result.reason
        };


        failures.push(
          failure
        );


        reportOptionalRequestError(
          failure.name,
          failure.error
        );

      }

    }
  );


  state.boot.optionalDataLoaded =
    true;


  return {
    results,
    failures
  };

}


/* =========================================================
   CENTRALIZED DATA BOOT

   This replaces the missing old loadAll() architecture.

   IMPORTANT:
   It intentionally does not render workspaces yet.

   Rendering/router/controller initialization will be added
   after those functions have been rebuilt in later parts.

   That prevents startup from referencing functions that have
   not yet been defined.
========================================================= */

async function loadTeacherStudioData(){

  if (
    state.boot.started
  ){

    return state;

  }


  state.boot.started =
    true;

  state.boot.failed =
    false;

  state.boot.error =
    null;


  try{

    await loadTeacherCriticalData();


    await loadTeacherPrimaryWorkspaceData();


    await loadTeacherOptionalData();


    finalizeTeacherLoadedData();


    document.dispatchEvent(
      new CustomEvent(
        AIFT_TEACHER_CONFIG
          .events
          .dataRefresh,
        {
          detail:{

            teacherId:
              getTeacherId(),

            schoolId:
              getSchoolId(),

            metrics:{
              ...state.metrics
            }

          }
        }
      )
    );


    return state;

  }catch(
    error
  ){

    state.boot.failed =
      true;

    state.boot.error =
      error;


    throw error;

  }

}


/* =========================================================
   RELOAD TEACHER STUDIO DATA

   Used later by manual refresh, focus refresh and Socket.IO.

   Unlike the initial boot, this may be called repeatedly.
========================================================= */

async function refreshTeacherStudioData(
  options = {}
){

  const includeAttendance =
    options.includeAttendance !==
    false;

  const includeQuizzes =
    options.includeQuizzes !==
    false;

  const includeSchedules =
    options.includeSchedules !==
    false;

  const includeAssignments =
    options.includeAssignments !==
    false;

  const includeSubmissions =
    options.includeSubmissions !==
    false;


  const tasks =
    [];


  if (
    includeAssignments
  ){

    tasks.push({
      name:
        "Assignments",

      run:
        loadTeacherAssignments
    });

  }


  if (
    includeSubmissions
  ){

    tasks.push({
      name:
        "Submissions",

      run:
        loadTeacherSubmissions
    });

  }


  if (
    includeSchedules
  ){

    tasks.push({
      name:
        "Schedules",

      run:
        loadTeacherSchedules
    });

  }


  if (
    includeAttendance
  ){

    tasks.push({
      name:
        "Attendance",

      run:
        loadTeacherAttendance
    });

  }


  if (
    includeQuizzes
  ){

    tasks.push({
      name:
        "Quizzes",

      run:
        loadTeacherQuizzes
    });

    tasks.push({
      name:
        "Quiz submissions",

      run:
        loadTeacherQuizSubmissions
    });

  }


  const results =
    await Promise.allSettled(
      tasks.map(
        task =>
          task.run()
      )
    );


  const failures =
    [];


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        "rejected"
      ){

        failures.push({
          name:
            tasks[index].name,

          error:
            result.reason
        });


        reportOptionalRequestError(
          tasks[index].name,
          result.reason
        );

      }

    }
  );


  finalizeTeacherLoadedData();


  document.dispatchEvent(
    new CustomEvent(
      AIFT_TEACHER_CONFIG
        .events
        .dataRefresh,
      {
        detail:{

          teacherId:
            getTeacherId(),

          metrics:{
            ...state.metrics
          },

          failures
        }
      }
    )
  );


  return {
    state,
    failures
  };

}


/* =========================================================
   COMPATIBILITY loadAll()

   The old file's startup and several existing concepts expect
   a function named loadAll().

   This is NOT an empty compatibility stub.

   It is now the real centralized production data loader.
========================================================= */

async function loadAll(){

  return loadTeacherStudioData();

}


/* =========================================================
   FOUNDATION DATA LAYER COMPLETE

   DO NOT add DOMContentLoaded here.

   DO NOT initialize the router here.

   We now have a real loadAll() implementation, but startup
   will only be attached after:
   - shell hydration
   - overview
   - all workspace renderers
   - router/navigation
   - controller binding
   - Socket.IO integration

   exist in the new file.
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 3

   SHELL HYDRATION + OVERVIEW
   ---------------------------------------------------------
   1. User display helpers
   2. Shell/profile hydration
   3. Badge rendering
   4. Dashboard greeting
   5. Dashboard statistics
   6. Dashboard class cards
   7. Upcoming schedule
   8. Recent assignments
   9. Student activity
   10. Authoritative renderStudioHome()
========================================================= */


/* =========================================================
   USER DISPLAY NAME
========================================================= */

function getTeacherDisplayName(
  user = null
){

  const source =
    user ||
    state.me ||
    state.loggedUser ||
    {};


  return safeString(

    source.name ||
    source.fullName ||
    source.displayName ||
    source.teacherName,

    "Teacher"

  );

}


/* =========================================================
   FIRST NAME
========================================================= */

function getTeacherFirstName(
  user = null
){

  const name =
    getTeacherDisplayName(
      user
    );


  return (
    name
      .split(
        /\s+/
      )
      .filter(
        Boolean
      )[0] ||
    "Teacher"
  );

}


/* =========================================================
   USER EMAIL
========================================================= */

function getTeacherEmail(
  user = null
){

  const source =
    user ||
    state.me ||
    state.loggedUser ||
    {};


  return safeString(
    source.email
  );

}


/* =========================================================
   USER PROFILE IMAGE
========================================================= */

function getTeacherProfileImage(
  user = null
){

  const source =
    user ||
    state.me ||
    state.loggedUser ||
    {};


  return getSafeImageUrl(

    source.profileImage ||
    source.avatar ||
    source.photoURL ||
    source.image,

    FALLBACK_AVATAR

  );

}


/* =========================================================
   TEACHER SUBJECT
========================================================= */

function getTeacherSubject(
  user = null
){

  const source =
    user ||
    state.me ||
    state.loggedUser ||
    {};


  return safeString(

    source.subject ||
    source.department ||
    source.specialization

  );

}


/* =========================================================
   ROLE DISPLAY LABEL
========================================================= */

function getTeacherRoleLabel(
  user = null
){

  const source =
    user ||
    state.me ||
    state.loggedUser ||
    {};

  const currentRole =
    normalizeRole(
      source.role ||
      getAuthenticatedRole()
    );


  switch(
    currentRole
  ){

    case "admin":

      return "Administrator";

    case "school":

      return "School account";

    case "teacher":

      return (
        getTeacherSubject(
          source
        ) ||
        "Teacher account"
      );

    default:

      return "Teacher Studio";

  }

}


/* =========================================================
   SCHOOL DISPLAY NAME
========================================================= */

function getTeacherSchoolName(){

  const teacher =
    state.me ||
    state.loggedUser ||
    {};


  const directSchool =
    teacher.schoolId &&
    typeof teacher.schoolId ===
      "object"
      ? teacher.schoolId
      : null;


  return safeString(

    directSchool?.schoolName ||
    directSchool?.name ||
    teacher.schoolName ||
    teacher.school?.schoolName ||
    teacher.school?.name,

    ""

  );

}


/* =========================================================
   SAFE IMAGE ASSIGNMENT

   Prevents the current local /images/default-avatar.png
   problem from persisting after shell hydration.

   Final teacher.html cleanup will remove those local src
   attributes completely.
========================================================= */

function setTeacherImage(
  id,
  source,
  alt = ""
){

  const image =
    $(
      id
    );


  if (
    !image
  ){

    return false;

  }


  const safeSource =
    getSafeImageUrl(
      source,
      FALLBACK_AVATAR
    );


  image.src =
    safeSource;

  image.alt =
    safeString(
      alt,
      "Teacher profile"
    );


  /*
    If a remote user image fails, immediately replace it with
    the production fallback.

    Use property assignment so repeated shell hydration does
    not stack listeners.
  */

  image.onerror =
    () => {

      image.onerror =
        null;

      image.src =
        FALLBACK_AVATAR;

    };


  return true;

}


/* =========================================================
   HYDRATE TEACHER PROFILE

   At present state.me and state.loggedUser use the same
   authenticated account for a teacher session.

   School/admin selected-teacher profile loading can later
   populate state.me without changing the shell architecture.
========================================================= */

function hydrateTeacherProfileFromSession(){

  const authenticatedUser =
    state.loggedUser;


  if (
    !authenticatedUser
  ){

    throw new AIFTApiError(
      "Teacher profile cannot be hydrated before authentication.",
      {
        code:
          "PROFILE_BEFORE_AUTH"
      }
    );

  }


  if (
    isTeacherSession()
  ){

    state.me =
      authenticatedUser;

  }else if (
    !state.me
  ){

    /*
      School/admin still receive their own shell identity until
      an explicitly selected teacher profile is loaded.
    */

    state.me =
      authenticatedUser;

  }


  return state.me;

}


/* =========================================================
   HYDRATE TEACHER TOPBAR
========================================================= */

function hydrateTeacherTopbar(){

  const user =
    state.me ||
    state.loggedUser;


  if (
    !user
  ){

    return;

  }


  const name =
    getTeacherDisplayName(
      user
    );

  const email =
    getTeacherEmail(
      user
    );

  const roleLabel =
    getTeacherRoleLabel(
      user
    );

  const avatar =
    getTeacherProfileImage(
      user
    );


  setText(
    "teacherTopbarName",
    name
  );


  setText(
    "teacherTopbarRole",
    roleLabel
  );


  setText(
    "teacherProfileDropdownName",
    name
  );


  setText(
    "teacherProfileDropdownEmail",
    email ||
    "AIFT Teacher Studio"
  );


  setTeacherImage(
    "teacherTopbarAvatar",
    avatar,
    `${name} profile`
  );


  setTeacherImage(
    "teacherProfileDropdownAvatar",
    avatar,
    `${name} profile`
  );

}


/* =========================================================
   PAGE ALERT
========================================================= */

function setTeacherPageAlert(
  message = "",
  type = "info"
){

  const container =
    $(
      "teacherPageAlert"
    );


  if (
    !container
  ){

    return;

  }


  const text =
    safeString(
      message
    );


  if (
    !text
  ){

    container.textContent =
      "";

    container.hidden =
      true;

    container.removeAttribute(
      "data-alert-type"
    );

    return;

  }


  container.textContent =
    text;

  container.hidden =
    false;

  container.dataset.alertType =
    normalizeAIFTNotificationType(
      type
    );

}


/* =========================================================
   CLEAR PAGE ALERT
========================================================= */

function clearTeacherPageAlert(){

  setTeacherPageAlert(
    ""
  );

}


/* =========================================================
   HYDRATE TEACHER SHELL

   This updates data only.

   It does NOT alter:
   - sidebar markup
   - topbar markup
   - card layout
   - CSS classes
   - spacing
   - font sizes
========================================================= */

function hydrateTeacherShell(){

  hydrateTeacherProfileFromSession();

  hydrateTeacherTopbar();

  renderTeacherUnreadCount();

  renderTeacherGradingBadge();

  clearTeacherPageAlert();

}


/* =========================================================
   BADGE HELPER
========================================================= */

function renderTeacherCountBadge(
  id,
  count,
  {
    hideWhenZero = true,
    maximum = 99
  } = {}
){

  const badge =
    $(
      id
    );


  if (
    !badge
  ){

    return;

  }


  const normalizedCount =
    Math.max(
      0,
      safeInteger(
        count,
        0
      )
    );


  const shouldHide =
    hideWhenZero &&
    normalizedCount ===
      0;


  badge.hidden =
    shouldHide;


  if (
    shouldHide
  ){

    badge.textContent =
      "";

    badge.removeAttribute(
      "aria-label"
    );

    return;

  }


  const displayValue =
    normalizedCount >
    maximum
      ? `${maximum}+`
      : String(
          normalizedCount
        );


  badge.textContent =
    displayValue;

  badge.setAttribute(
    "aria-label",
    `${normalizedCount} unread`
  );

}


/* =========================================================
   UNREAD MESSAGE / NOTIFICATION BADGES

   teacher.html already contains:
   - teacherUnreadSidebarCount
   - teacherUnreadTopbarCount
   - teacherNotificationCount
========================================================= */

function renderTeacherUnreadCount(){

  const unread =
    Math.max(
      0,
      safeInteger(
        state.unread,
        0
      )
    );


  renderTeacherCountBadge(
    "teacherUnreadSidebarCount",
    unread
  );


  renderTeacherCountBadge(
    "teacherUnreadTopbarCount",
    unread
  );


  renderTeacherCountBadge(
    "teacherNotificationCount",
    unread
  );

}


/* =========================================================
   GRADING BADGE
========================================================= */

function renderTeacherGradingBadge(){

  renderTeacherCountBadge(
    "teacherGradingBadge",
    state.grading.pending.length
  );

}


/* =========================================================
   DASHBOARD GREETING
========================================================= */

function renderTeacherOverviewHeader(){

  const firstName =
    getTeacherFirstName();

  const schoolName =
    getTeacherSchoolName();


  const greeting =
    schoolName
      ? `Welcome back, ${firstName}. Here is what is happening with your students at ${schoolName}.`
      : `Welcome back, ${firstName}. Here is what is happening with your students.`;


  setText(
    "teacherDashboardGreeting",
    greeting
  );

}


/* =========================================================
   DASHBOARD STATS
========================================================= */

function renderTeacherDashboardStats(){

  calculateTeacherMetrics();


  setText(
    "teacherStatClasses",
    state.metrics.classes
  );


  setText(
    "teacherStatStudents",
    state.metrics.students
  );


  setText(
    "teacherStatPending",
    state.metrics.pendingGrading
  );


  setText(
    "teacherStatAttendance",
    state.metrics.attendance >
      0
      ? `${state.metrics.attendance}%`
      : "—"
  );


  renderTeacherGradingBadge();

}


/* =========================================================
   OVERVIEW METRICS COMPATIBILITY
========================================================= */

function renderTeacherOverviewMetrics(){

  renderTeacherDashboardStats();

}


/* =========================================================
   CLASS TITLE
========================================================= */

function getTeacherClassTitle(
  classItem
){

  return safeString(

    classItem?.title ||
    classItem?.name ||
    classItem?.subject,

    "Untitled class"

  );

}


/* =========================================================
   CLASS SUBJECT
========================================================= */

function getTeacherClassSubject(
  classItem
){

  return safeString(

    classItem?.subject ||
    classItem?.category ||
    classItem?.course,

    "Class"

  );

}


/* =========================================================
   CLASS CODE
========================================================= */

function getTeacherClassCode(
  classItem
){

  return safeString(

    classItem?.classCode ||
    classItem?.code ||
    classItem?.joinCode

  );

}


/* =========================================================
   CLASS STATUS
========================================================= */

function getTeacherClassStatus(
  classItem
){

  const status =
    safeString(
      classItem?.status,
      "active"
    )
      .toLowerCase();


  if (
    [
      "published",
      "open",
      "ongoing"
    ].includes(
      status
    )
  ){

    return "active";

  }


  if (
    [
      "completed",
      "closed",
      "finished"
    ].includes(
      status
    )
  ){

    return "completed";

  }


  return status;

}


/* =========================================================
   CLASS STUDENT COUNT
========================================================= */

function getTeacherClassStudentCount(
  classItem
){

  return asArray(
    classItem?.studentIds
  ).length;

}


/* =========================================================
   CLASS COVER
========================================================= */

function getTeacherClassCover(
  classItem
){

  return getSafeImageUrl(

    classItem?.coverImage ||
    classItem?.coverUrl ||
    classItem?.bannerImage ||
    classItem?.banner ||
    classItem?.image,

    CLASS_FALLBACK

  );

}


/* =========================================================
   MOST RECENT CLASS ACTIVITY
========================================================= */

function getTeacherClassLastActivity(
  classItem
){

  const classId =
    normalizeId(
      classItem?._id ||
      classItem?.id
    );

  const classData =
    getTeacherClassData(
      classId
    );


  const candidates = [

    classItem?.updatedAt,

    ...asArray(
      classData?.assignments
    ).map(
      item =>
        item.updatedAt ||
        item.createdAt
    ),

    ...asArray(
      classData?.submissions
    ).map(
      item =>
        item.submittedAt ||
        item.updatedAt ||
        item.createdAt
    ),

    ...asArray(
      classData?.schedules
    ).map(
      item =>
        item.updatedAt ||
        item.createdAt ||
        item.date
    )

  ]
    .map(
      toValidDate
    )
    .filter(
      Boolean
    )
    .sort(
      (
        first,
        second
      ) =>
        second.getTime() -
        first.getTime()
    );


  return candidates[0] ||
    null;

}


/* =========================================================
   OVERVIEW CLASS CARD
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
    getTeacherClassSubject(
      classItem
    );

  const code =
    getTeacherClassCode(
      classItem
    );

  const students =
    getTeacherClassStudentCount(
      classItem
    );

  const cover =
    getTeacherClassCover(
      classItem
    );

  const activityDate =
    getTeacherClassLastActivity(
      classItem
    );

  const activityLabel =
    activityDate
      ? formatRelativeDate(
          activityDate
        )
      : "No recent activity";


  return `
    <article
      class="teacher-dashboard-class-item"
      data-teacher-class-id="${escapeAttribute(classId)}"
    >

      <button
        type="button"
        class="teacher-dashboard-class-main"
        data-teacher-action="open-class"
        data-class-id="${escapeAttribute(classId)}"
        aria-label="Open ${escapeAttribute(title)}"
      >

        <span
          class="teacher-dashboard-class-cover"
        >
          <img
            src="${escapeAttribute(cover)}"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </span>

        <span
          class="teacher-dashboard-class-copy"
        >

          <strong>
            ${escapeHtml(title)}
          </strong>

          <span>
            ${escapeHtml(subject)}
            ${
              code
                ? ` · ${escapeHtml(code)}`
                : ""
            }
          </span>

          <small>
            ${students}
            ${
              students === 1
                ? "student"
                : "students"
            }
            · ${escapeHtml(activityLabel)}
          </small>

        </span>

        <span
          class="teacher-dashboard-class-arrow"
          aria-hidden="true"
        >
          <i
            class="fa-solid fa-chevron-right"
          ></i>
        </span>

      </button>

    </article>
  `;

}


/* =========================================================
   OVERVIEW CLASSES
========================================================= */

function renderTeacherOverviewClasses(){

  const container =
    $(
      "teacherDashboardClasses"
    );


  if (
    !container
  ){

    return;

  }


  const classes =
    getTeacherClasses()
      .filter(
        classItem =>
          ![
            "archived",
            "completed",
            "closed"
          ].includes(
            getTeacherClassStatus(
              classItem
            )
          )
      )
      .slice(
        0,
        5
      );


  if (
    !classes.length
  ){

    container.innerHTML = `
      <div
        class="teacher-inline-empty"
      >
        No active classes assigned yet.
      </div>
    `;


    return;

  }


  container.innerHTML =
    classes
      .map(
        createTeacherOverviewClassCard
      )
      .join(
        ""
      );


  container
    .querySelectorAll(
      "img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            image.onerror =
              null;

            image.src =
              CLASS_FALLBACK;

          };

      }
    );

}


/* =========================================================
   SCHEDULE DATE RESOLUTION
========================================================= */

function getTeacherScheduleDate(
  schedule
){

  const directDate =
    schedule?.startDateTime ||
    schedule?.startAt ||
    schedule?.dateTime;


  if (
    directDate
  ){

    return toValidDate(
      directDate
    );

  }


  const datePart =
    safeString(
      schedule?.date
    );

  const timePart =
    safeString(
      schedule?.startTime ||
      schedule?.time
    );


  if (
    datePart &&
    timePart
  ){

    const combined =
      toValidDate(
        `${datePart}T${timePart}`
      );


    if (
      combined
    ){

      return combined;

    }

  }


  return toValidDate(
    datePart
  );

}


/* =========================================================
   SCHEDULE TITLE
========================================================= */

function getTeacherScheduleTitle(
  schedule
){

  const classTitle =
    safeString(

      schedule
        ?.classId
        ?.title ||

      schedule
        ?.classId
        ?.subject

    );


  return safeString(

    schedule?.title ||
    classTitle,

    "Scheduled class"

  );

}


/* =========================================================
   SCHEDULE TIME LABEL
========================================================= */

function getTeacherScheduleTimeLabel(
  schedule
){

  const start =
    safeString(
      schedule?.startTime ||
      schedule?.time
    );

  const end =
    safeString(
      schedule?.endTime
    );


  if (
    start &&
    end
  ){

    return `${start} – ${end}`;

  }


  if (
    start
  ){

    return start;

  }


  const date =
    getTeacherScheduleDate(
      schedule
    );


  return date
    ? formatTime(
        date
      )
    : "";

}


/* =========================================================
   OVERVIEW SCHEDULE ITEM
========================================================= */

function createTeacherOverviewScheduleItem(
  schedule
){

  const scheduleId =
    normalizeId(
      schedule?._id ||
      schedule?.id
    );

  const classId =
    normalizeId(
      schedule
        ?.classId
        ?._id ||
      schedule
        ?.classId
    );

  const title =
    getTeacherScheduleTitle(
      schedule
    );

  const scheduleDate =
    getTeacherScheduleDate(
      schedule
    );

  const time =
    getTeacherScheduleTimeLabel(
      schedule
    );

  const meetingLink =
    normalizeHttpUrl(
      schedule?.meetingLink
    );


  return `
    <div
      class="teacher-dashboard-schedule-item"
      data-schedule-id="${escapeAttribute(scheduleId)}"
    >

      <div
        class="teacher-dashboard-schedule-date"
      >
        <strong>
          ${
            scheduleDate
              ? escapeHtml(
                  scheduleDate.toLocaleDateString(
                    [],
                    {
                      day:
                        "2-digit"
                    }
                  )
                )
              : "—"
          }
        </strong>

        <span>
          ${
            scheduleDate
              ? escapeHtml(
                  scheduleDate.toLocaleDateString(
                    [],
                    {
                      month:
                        "short"
                    }
                  )
                )
              : ""
          }
        </span>
      </div>

      <div
        class="teacher-dashboard-schedule-copy"
      >

        <strong>
          ${escapeHtml(title)}
        </strong>

        <span>
          ${escapeHtml(time || "Time not set")}
        </span>

      </div>

      ${
        meetingLink
          ? `
            <a
              class="teacher-icon-button"
              href="${escapeAttribute(meetingLink)}"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join ${escapeAttribute(title)}"
              title="Join class"
            >
              <i
                class="fa-solid fa-video"
              ></i>
            </a>
          `
          : `
            <button
              type="button"
              class="teacher-icon-button"
              data-teacher-action="open-schedule"
              data-schedule-id="${escapeAttribute(scheduleId)}"
              data-class-id="${escapeAttribute(classId)}"
              aria-label="View schedule"
              title="View schedule"
            >
              <i
                class="fa-regular fa-calendar"
              ></i>
            </button>
          `
      }

    </div>
  `;

}


/* =========================================================
   OVERVIEW SCHEDULE
========================================================= */

function renderTeacherOverviewSchedule(){

  const container =
    $(
      "teacherDashboardSchedule"
    );


  if (
    !container
  ){

    return;

  }


  const now =
    Date.now();


  const upcoming =
    getTeacherSchedules()
      .map(
        schedule => ({
          schedule,
          date:
            getTeacherScheduleDate(
              schedule
            )
        })
      )
      .filter(
        item =>
          item.date &&
          item.date.getTime() >=
            (
              now -
              60 * 60 * 1000
            )
      )
      .sort(
        (
          first,
          second
        ) =>
          first.date.getTime() -
          second.date.getTime()
      )
      .slice(
        0,
        5
      )
      .map(
        item =>
          item.schedule
      );


  if (
    !upcoming.length
  ){

    container.innerHTML = `
      <div
        class="teacher-inline-empty"
      >
        No upcoming classes.
      </div>
    `;


    return;

  }


  container.innerHTML =
    upcoming
      .map(
        createTeacherOverviewScheduleItem
      )
      .join(
        ""
      );

}


/* =========================================================
   ASSIGNMENT TITLE
========================================================= */

function getTeacherAssignmentTitle(
  assignment
){

  return safeString(
    assignment?.title,
    "Untitled assignment"
  );

}


/* =========================================================
   ASSIGNMENT CLASS TITLE
========================================================= */

function getTeacherAssignmentClassTitle(
  assignment
){

  const populatedClass =
    assignment?.classId;


  if (
    populatedClass &&
    typeof populatedClass ===
      "object"
  ){

    return safeString(

      populatedClass.title ||
      populatedClass.subject,

      "Class"

    );

  }


  const classId =
    normalizeId(
      populatedClass
    );


  const classRecord =
    getTeacherClassData(
      classId
    );


  return getTeacherClassTitle(
    classRecord?.classItem ||
    {}
  );

}


/* =========================================================
   ASSIGNMENT DUE DATE
========================================================= */

function getTeacherAssignmentDueDate(
  assignment
){

  return toValidDate(
    assignment?.dueDate
  );

}


/* =========================================================
   RECENT ASSIGNMENT ROW
========================================================= */

function createTeacherOverviewAssignmentRow(
  assignment
){

  const assignmentId =
    normalizeId(
      assignment?._id ||
      assignment?.id
    );

  const title =
    getTeacherAssignmentTitle(
      assignment
    );

  const classTitle =
    getTeacherAssignmentClassTitle(
      assignment
    );

  const dueDate =
    getTeacherAssignmentDueDate(
      assignment
    );

  const status =
    normalizeAssignmentStatus(
      assignment?.status
    );


  const relatedSubmissions =
    getTeacherSubmissions()
      .filter(
        submission =>
          sameId(
            submission
              ?.assignmentId
              ?._id ||
            submission
              ?.assignmentId,
            assignmentId
          )
      );


  const pending =
    relatedSubmissions
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


  return `
    <button
      type="button"
      class="teacher-dashboard-assignment-item"
      data-teacher-action="open-assignment"
      data-assignment-id="${escapeAttribute(assignmentId)}"
    >

      <span
        class="teacher-dashboard-assignment-icon"
        aria-hidden="true"
      >
        <i
          class="fa-regular fa-file-lines"
        ></i>
      </span>

      <span
        class="teacher-dashboard-assignment-copy"
      >

        <strong>
          ${escapeHtml(title)}
        </strong>

        <span>
          ${escapeHtml(classTitle)}
          ${
            dueDate
              ? ` · Due ${escapeHtml(formatDate(dueDate))}`
              : ""
          }
        </span>

      </span>

      <span
        class="teacher-dashboard-assignment-meta"
      >

        ${
          pending
            ? `
              <span
                class="teacher-status-badge warning"
              >
                ${pending}
                ${
                  pending === 1
                    ? "to review"
                    : "to review"
                }
              </span>
            `
            : `
              <span
                class="teacher-status-badge"
              >
                ${escapeHtml(status)}
              </span>
            `
        }

        <i
          class="fa-solid fa-chevron-right"
          aria-hidden="true"
        ></i>

      </span>

    </button>
  `;

}


/* =========================================================
   OVERVIEW ASSIGNMENTS
========================================================= */

function renderTeacherOverviewAssignments(){

  const container =
    $(
      "teacherDashboardAssignments"
    );


  if (
    !container
  ){

    return;

  }


  const assignments =
    sortNewestFirst(
      getTeacherAssignments(),
      [
        "updatedAt",
        "createdAt",
        "dueDate"
      ]
    )
      .slice(
        0,
        6
      );


  if (
    !assignments.length
  ){

    container.innerHTML = `
      <div
        class="teacher-inline-empty"
      >
        No assignments yet.
      </div>
    `;


    return;

  }


  container.innerHTML =
    assignments
      .map(
        createTeacherOverviewAssignmentRow
      )
      .join(
        ""
      );

}


/* =========================================================
   STUDENT DISPLAY NAME
========================================================= */

function getTeacherStudentName(
  value
){

  const student =
    value?.student ||
    value ||
    {};


  return safeString(

    student.name ||
    student.fullName ||
    student.displayName,

    "Student"

  );

}


/* =========================================================
   STUDENT IMAGE
========================================================= */

function getTeacherStudentImage(
  value
){

  const student =
    value?.student ||
    value ||
    {};


  return getSafeImageUrl(

    student.profileImage ||
    student.avatar ||
    student.photoURL,

    FALLBACK_AVATAR

  );

}


/* =========================================================
   RECENT SUBMISSION ACTIVITY ITEM
========================================================= */

function createTeacherStudentActivityItem(
  submission
){

  const student =
    submission?.studentId &&
    typeof submission.studentId ===
      "object"
      ? submission.studentId
      : {};

  const studentId =
    normalizeId(
      student?._id ||
      submission?.studentId
    );

  const studentName =
    getTeacherStudentName(
      student
    );

  const image =
    getTeacherStudentImage(
      student
    );

  const assignmentTitle =
    safeString(

      submission
        ?.assignmentId
        ?.title,

      "an assignment"

    );

  const submittedAt =
    submission?.submittedAt ||
    submission?.createdAt;

  const status =
    normalizeSubmissionStatus(
      submission?.status
    );


  let activityText =
    `submitted ${assignmentTitle}`;


  if (
    [
      "reviewed",
      "graded"
    ].includes(
      status
    )
  ){

    activityText =
      `${assignmentTitle} was reviewed`;

  }else if (
    status ===
    "returned"
  ){

    activityText =
      `${assignmentTitle} was returned`;

  }


  return `
    <button
      type="button"
      class="teacher-dashboard-activity-item"
      data-teacher-action="open-student"
      data-student-id="${escapeAttribute(studentId)}"
    >

      <img
        class="teacher-dashboard-activity-avatar"
        src="${escapeAttribute(image)}"
        alt=""
        loading="lazy"
        referrerpolicy="no-referrer"
      />

      <span
        class="teacher-dashboard-activity-copy"
      >

        <strong>
          ${escapeHtml(studentName)}
        </strong>

        <span>
          ${escapeHtml(activityText)}
        </span>

      </span>

      <small>
        ${escapeHtml(formatRelativeDate(submittedAt))}
      </small>

    </button>
  `;

}


/* =========================================================
   OVERVIEW STUDENT ACTIVITY
========================================================= */

function renderTeacherOverviewActivity(){

  const container =
    $(
      "teacherDashboardStudentActivity"
    );


  if (
    !container
  ){

    return;

  }


  const recentSubmissions =
    sortNewestFirst(
      getTeacherSubmissions(),
      [
        "submittedAt",
        "reviewedAt",
        "updatedAt",
        "createdAt"
      ]
    )
      .slice(
        0,
        6
      );


  if (
    !recentSubmissions.length
  ){

    container.innerHTML = `
      <div
        class="teacher-inline-empty"
      >
        No recent student activity.
      </div>
    `;


    return;

  }


  container.innerHTML =
    recentSubmissions
      .map(
        createTeacherStudentActivityItem
      )
      .join(
        ""
      );


  container
    .querySelectorAll(
      "img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            image.onerror =
              null;

            image.src =
              FALLBACK_AVATAR;

          };

      }
    );

}


/* =========================================================
   KABEZYA OVERVIEW STATE

   Kabezya is advisory.

   No fake AI result is rendered here.
   No grade is published from AI.
========================================================= */

function renderTeacherOverviewKabezya(){

  const aiButtons =
    $all(
      "[data-teacher-ai-action]"
    );


  aiButtons.forEach(
    button => {

      button.disabled =
        Boolean(
          state.kabezya.loading
        );

      button.setAttribute(
        "aria-busy",
        String(
          Boolean(
            state.kabezya.loading
          )
        )
      );

    }
  );

}


/* =========================================================
   AUTHORITATIVE OVERVIEW RENDERER

   This replaces the old temporary implementation containing
   repeated:
       typeof renderX === "function"

   Every dependency below is real and defined.
========================================================= */

function renderStudioHome(){

  renderTeacherOverviewHeader();

  renderTeacherOverviewMetrics();

  renderTeacherOverviewClasses();

  renderTeacherOverviewSchedule();

  renderTeacherOverviewAssignments();

  renderTeacherOverviewActivity();

  renderTeacherOverviewKabezya();

  renderTeacherUnreadCount();

  renderTeacherGradingBadge();

}


/* =========================================================
   OVERVIEW INITIALIZATION STATE
========================================================= */

let teacherOverviewInitialized =
  false;


/* =========================================================
   INITIALIZE OVERVIEW

   No fake bindTeacherOverviewControls() is used.

   Overview buttons use the single delegated Teacher Studio
   action/navigation controller that will be established in
   the authoritative router part.

   Therefore Overview requires no second independent click
   binding system.
========================================================= */

function initializeTeacherOverview(){

  if (
    teacherOverviewInitialized
  ){

    renderStudioHome();

    return;

  }


  teacherOverviewInitialized =
    true;


  renderStudioHome();

}


/* =========================================================
   RENDER CURRENT USER SHELL + OVERVIEW
========================================================= */

function renderTeacherShellAndOverview(){

  hydrateTeacherShell();

  renderStudioHome();

}


/* =========================================================
   REFRESH OVERVIEW DATA

   Used later by manual refresh and Socket.IO updates.

   This is a real data refresh, not merely a visual rerender.
========================================================= */

async function refreshTeacherOverview(){

  try{

    await refreshTeacherStudioData({
      includeAssignments:
        true,

      includeSubmissions:
        true,

      includeSchedules:
        true,

      includeAttendance:
        true,

      includeQuizzes:
        false
    });


    hydrateTeacherShell();

    renderStudioHome();


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "The dashboard could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }

}


/* =========================================================
   PART 3 COMPLETE

   IMPORTANT:
   - Current teacher.html design is preserved.
   - Existing CSS classes are reused.
   - Existing DOM IDs are reused.
   - No HTML replacement has occurred.
   - No navigation controller is duplicated.
   - No DOMContentLoaded startup is attached yet.

   The authoritative router will provide one delegated action
   controller for:
     create-assignment
     create-quiz
     take-attendance
     schedule-class
     question-bank
     open-class
     open-assignment
     open-student
     Kabezya actions

   Workspace implementations will plug into that controller
   as they are added.
========================================================= */

/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 4

   MY CLASSES WORKSPACE
   ---------------------------------------------------------
   1. Workspace state
   2. Class helpers
   3. Filtering
   4. Subject filter hydration
   5. Count / empty state
   6. Production class card
   7. Classes grid
   8. Local filter controls
   9. Refresh classes
   10. Classes workspace renderer

   DESIGN CONTRACT
   ---------------------------------------------------------
   This part uses the CURRENT teacher.html classes:

   .teacher-classes-grid
   .teacher-class-card
   .teacher-class-card-cover
   .teacher-class-status
   .teacher-class-card-body
   .teacher-class-card-subject
   .teacher-class-card-title
   .teacher-class-card-description
   .teacher-class-card-details
   .teacher-class-detail
   .teacher-class-card-actions
   .teacher-class-open-button
   .teacher-class-manage-button
   .teacher-class-tools
   .teacher-class-tool

   No CSS replacement is performed here.
========================================================= */


/* =========================================================
   CLASS WORKSPACE STATE

   Keep this workspace state separate from application data.

   This prevents search/filter UI from mutating state.classes.
========================================================= */

const teacherClassWorkspaceState = {

  search:
    "",

  subject:
    "",

  status:
    "",

  selectedClassId:
    "",

  refreshing:
    false,

  initialized:
    false

};


/* =========================================================
   CLASS STATUS LABEL

   getTeacherClassStatus() already exists from Part 3.
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

    case "archived":

      return "Archived";

    case "completed":

      return "Completed";

    default:

      if (
        !status
      ){

        return "Active";

      }


      return (
        status
          .charAt(
            0
          )
          .toUpperCase() +
        status
          .slice(
            1
          )
      );

  }

}


/* =========================================================
   CLASS DESCRIPTION
========================================================= */

function getTeacherClassDescription(
  classItem
){

  return safeString(

    classItem?.description ||
    classItem?.summary ||
    classItem?.about,

    ""

  );

}


/* =========================================================
   CLASS CREATED / UPDATED TIMESTAMP
========================================================= */

function getTeacherClassCreatedTime(
  classItem
){

  const date =
    toValidDate(

      classItem?.updatedAt ||
      classItem?.createdAt ||
      classItem?.startDate

    );


  return date
    ? date.getTime()
    : 0;

}


/* =========================================================
   GET CLASS BY ID
========================================================= */

function getTeacherClassById(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
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
            normalizedClassId
          )
      ) ||
    null
  );

}


/* =========================================================
   CLASS ASSIGNMENTS
========================================================= */

function getTeacherClassAssignments(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  return getTeacherAssignments()
    .filter(
      assignment =>
        sameId(
          assignment
            ?.classId
            ?._id ||
          assignment
            ?.classId,
          normalizedClassId
        )
    );

}


/* =========================================================
   CLASS SUBMISSIONS
========================================================= */

function getTeacherClassSubmissions(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  return getTeacherSubmissions()
    .filter(
      submission =>
        sameId(
          submission
            ?.classId
            ?._id ||
          submission
            ?.classId,
          normalizedClassId
        )
    );

}


/* =========================================================
   CLASS PENDING GRADING
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


  return getTeacherClassSubmissions(
    classId
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
   CLASS REVIEW RATE
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
    submissions
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


  return clampPercentage(
    (
      reviewed /
      submissions.length
    ) *
    100
  );

}


/* =========================================================
   CLASS SCHEDULES
========================================================= */

function getTeacherClassSchedules(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  return getTeacherSchedules()
    .filter(
      schedule =>
        sameId(
          schedule
            ?.classId
            ?._id ||
          schedule
            ?.classId,
          normalizedClassId
        )
    );

}


/* =========================================================
   NEXT CLASS SCHEDULE
========================================================= */

function getTeacherClassNextSchedule(
  classId
){

  const now =
    Date.now();


  return (
    getTeacherClassSchedules(
      classId
    )
      .map(
        schedule => ({
          schedule,

          date:
            getTeacherScheduleDate(
              schedule
            )
        })
      )
      .filter(
        item =>
          item.date &&
          item.date.getTime() >=
            now
      )
      .sort(
        (
          first,
          second
        ) =>
          first.date.getTime() -
          second.date.getTime()
      )[0]
      ?.schedule ||
    null
  );

}


/* =========================================================
   CLASS QUIZZES
========================================================= */

function getTeacherClassQuizRecords(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  return getTeacherQuizzes()
    .filter(
      quiz =>
        sameId(
          quiz
            ?.classId
            ?._id ||
          quiz
            ?.classId,
          normalizedClassId
        )
    );

}


/* =========================================================
   NORMALIZE SUBJECT
========================================================= */

function normalizeTeacherClassSubject(
  classItem
){

  return safeString(

    classItem?.subject ||
    classItem?.course ||
    classItem?.category,

    "General"

  );

}


/* =========================================================
   GET AVAILABLE CLASS SUBJECTS
========================================================= */

function getTeacherClassSubjects(){

  const subjects =
    new Map();


  getTeacherClasses()
    .forEach(
      classItem => {

        const subject =
          normalizeTeacherClassSubject(
            classItem
          );


        if (
          !subject
        ){

          return;

        }


        const key =
          subject
            .trim()
            .toLowerCase();


        if (
          !subjects.has(
            key
          )
        ){

          subjects.set(
            key,
            subject
          );

        }

      }
    );


  return Array.from(
    subjects.values()
  )
    .sort(
      (
        first,
        second
      ) =>
        first.localeCompare(
          second
        )
    );

}


/* =========================================================
   FILTER TEACHER CLASSES
========================================================= */

function getFilteredTeacherClasses(){

  const search =
    safeString(
      teacherClassWorkspaceState
        .search
    )
      .toLowerCase();

  const subject =
    safeString(
      teacherClassWorkspaceState
        .subject
    )
      .toLowerCase();

  const status =
    safeString(
      teacherClassWorkspaceState
        .status
    )
      .toLowerCase();


  let classes = [
    ...getTeacherClasses()
  ];


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

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

              normalizeTeacherClassSubject(
                classItem
              ),

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


  /* -------------------------------------------------------
     SUBJECT
  ------------------------------------------------------- */

  if (
    subject
  ){

    classes =
      classes.filter(
        classItem =>
          normalizeTeacherClassSubject(
            classItem
          )
            .toLowerCase() ===
          subject
      );

  }


  /* -------------------------------------------------------
     STATUS
  ------------------------------------------------------- */

  if (
    status
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


  /* -------------------------------------------------------
     MOST RECENT FIRST

     Current teacher.html does not contain a separate sort
     control, so we preserve the UI and use one predictable
     production ordering.
  ------------------------------------------------------- */

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


  return classes;

}


/* =========================================================
   HYDRATE SUBJECT FILTER

   Uses the EXISTING teacherClassSubjectFilter <select>.
========================================================= */

function renderTeacherClassSubjectFilter(){

  const select =
    $(
      "teacherClassSubjectFilter"
    );


  if (
    !select
  ){

    return;

  }


  const currentValue =
    teacherClassWorkspaceState
      .subject;

  const subjects =
    getTeacherClassSubjects();


  select.innerHTML = `
    <option value="">
      All subjects
    </option>

    ${
      subjects
        .map(
          subject => `
            <option
              value="${escapeAttribute(subject)}"
            >
              ${escapeHtml(subject)}
            </option>
          `
        )
        .join(
          ""
        )
    }
  `;


  select.value =
    currentValue;


  /*
    If an old filter no longer exists because data changed,
    return gracefully to All subjects.
  */

  if (
    select.value !==
    currentValue
  ){

    teacherClassWorkspaceState
      .subject =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   HYDRATE STATUS FILTER

   teacher.html already contains this select.

   We keep its existing visual markup and only sync value.
========================================================= */

function renderTeacherClassStatusFilter(){

  const select =
    $(
      "teacherClassStatusFilter"
    );


  if (
    !select
  ){

    return;

  }


  select.value =
    teacherClassWorkspaceState
      .status;


  if (
    select.value !==
    teacherClassWorkspaceState
      .status
  ){

    teacherClassWorkspaceState
      .status =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   CLASS COUNT
========================================================= */

function renderTeacherClassesCount(){

  const allClasses =
    getTeacherClasses();

  const filteredClasses =
    getFilteredTeacherClasses();


  const hasFilters =
    Boolean(
      teacherClassWorkspaceState.search ||
      teacherClassWorkspaceState.subject ||
      teacherClassWorkspaceState.status
    );


  if (
    hasFilters
  ){

    setText(
      "teacherClassesCount",
      `${filteredClasses.length} of ${allClasses.length} ${
        allClasses.length === 1
          ? "class"
          : "classes"
      }`
    );


    return;

  }


  setText(
    "teacherClassesCount",
    `${allClasses.length} ${
      allClasses.length === 1
        ? "class"
        : "classes"
    }`
  );

}


/* =========================================================
   CLASS EMPTY STATE
========================================================= */

function renderTeacherClassesEmptyState(
  filteredClasses
){

  const empty =
    $(
      "teacherClassesEmpty"
    );


  if (
    !empty
  ){

    return;

  }


  const hasClasses =
    getTeacherClasses()
      .length >
    0;

  const hasResults =
    asArray(
      filteredClasses
    ).length >
    0;

  const hasFilters =
    Boolean(
      teacherClassWorkspaceState.search ||
      teacherClassWorkspaceState.subject ||
      teacherClassWorkspaceState.status
    );


  empty.hidden =
    hasResults;


  if (
    hasResults
  ){

    return;

  }


  const heading =
    empty.querySelector(
      "h2"
    );

  const description =
    empty.querySelector(
      "p"
    );

  const icon =
    empty.querySelector(
      ".teacher-empty-icon i"
    );

  const clearButton =
    empty.querySelector(
      '[data-teacher-action="clear-class-filters"], [data-teacher-action="clear-filters"], [data-teacher-action="clear-class-filter"]'
    ) ||
    empty.querySelector(
      "button"
    );


  if (
    !hasClasses
  ){

    if (
      heading
    ){

      heading.textContent =
        "No classes assigned yet";

    }


    if (
      description
    ){

      description.textContent =
        "Classes assigned to your teacher account will appear here.";

    }


    if (
      icon
    ){

      icon.className =
        "fa-solid fa-chalkboard-user";

    }


    if (
      clearButton
    ){

      clearButton.hidden =
        true;

    }


    return;

  }


  if (
    hasFilters
  ){

    if (
      heading
    ){

      heading.textContent =
        "No classes found";

    }


    if (
      description
    ){

      description.textContent =
        "No classes match the current search or filters.";

    }


    if (
      icon
    ){

      icon.className =
        "fa-solid fa-magnifying-glass";

    }


    if (
      clearButton
    ){

      clearButton.hidden =
        false;

    }

  }

}


/* =========================================================
   CLASS CODE DISPLAY
========================================================= */

function createTeacherClassCodeMarkup(
  classItem
){

  const classCode =
    getTeacherClassCode(
      classItem
    );


  if (
    !classCode
  ){

    return "";

  }


  return `
    <span
      class="teacher-class-code-inline"
      title="Class code"
    >
      ${escapeHtml(classCode)}
    </span>
  `;

}


/* =========================================================
   CLASS DETAIL VALUE
========================================================= */

function createTeacherClassDetail(
  value,
  label
){

  return `
    <div
      class="teacher-class-detail"
    >
      <strong>
        ${escapeHtml(value)}
      </strong>

      <span>
        ${escapeHtml(label)}
      </span>
    </div>
  `;

}


/* =========================================================
   CREATE PRODUCTION CLASS CARD

   IMPORTANT:
   The classes below match the CURRENT teacher.html CSS,
   not the older duplicate workspace markup.
========================================================= */

function createTeacherClassCard(
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
    normalizeTeacherClassSubject(
      classItem
    );

  const description =
    getTeacherClassDescription(
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

  const studentCount =
    getTeacherClassStudentCount(
      classItem
    );

  const assignmentCount =
    getTeacherClassAssignments(
      classId
    ).length;

  const pendingCount =
    getTeacherClassPendingCount(
      classItem
    );

  const quizCount =
    getTeacherClassQuizRecords(
      classId
    ).length;

  const reviewRate =
    getTeacherClassReviewRate(
      classId
    );

  const nextSchedule =
    getTeacherClassNextSchedule(
      classId
    );

  const nextScheduleDate =
    nextSchedule
      ? getTeacherScheduleDate(
          nextSchedule
        )
      : null;

  const nextScheduleTime =
    nextSchedule
      ? getTeacherScheduleTimeLabel(
          nextSchedule
        )
      : "";

  const safeCover =
    getSafeImageUrl(
      cover,
      CLASS_FALLBACK
    );


  return `
    <article
      class="teacher-class-card"
      data-class-id="${escapeAttribute(classId)}"
    >

      <!-- ===============================================
           COVER
      ================================================ -->

      <div
        class="teacher-class-card-cover"
      >

        <img
          src="${escapeAttribute(safeCover)}"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
        />

        <span
          class="teacher-class-status ${escapeAttribute(status)}"
        >
          ${escapeHtml(statusLabel)}
        </span>

      </div>


      <!-- ===============================================
           BODY
      ================================================ -->

      <div
        class="teacher-class-card-body"
      >

        <span
          class="teacher-class-card-subject"
        >
          ${escapeHtml(subject)}
        </span>


        <h3
          class="teacher-class-card-title"
          title="${escapeAttribute(title)}"
        >
          ${escapeHtml(title)}
        </h3>


        ${
          description
            ? `
              <p
                class="teacher-class-card-description"
              >
                ${escapeHtml(description)}
              </p>
            `
            : `
              <p
                class="teacher-class-card-description"
              >
                Manage students, lessons, assignments and class activity.
              </p>
            `
        }


        ${
          getTeacherClassCode(
            classItem
          )
            ? `
              <div
                class="teacher-class-code"
              >
                <span>
                  Class code
                </span>

                <strong>
                  ${escapeHtml(
                    getTeacherClassCode(
                      classItem
                    )
                  )}
                </strong>
              </div>
            `
            : ""
        }


        <!-- =============================================
             CLASS DETAILS
        ============================================== -->

        <div
          class="teacher-class-card-details"
        >

          ${createTeacherClassDetail(
            String(
              studentCount
            ),
            studentCount === 1
              ? "Student"
              : "Students"
          )}

          ${createTeacherClassDetail(
            String(
              assignmentCount
            ),
            assignmentCount === 1
              ? "Assignment"
              : "Assignments"
          )}

          ${createTeacherClassDetail(
            String(
              pendingCount
            ),
            "To grade"
          )}

        </div>


        <!-- =============================================
             REVIEW PROGRESS
        ============================================== -->

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
            role="progressbar"
            aria-label="Review progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${reviewRate}"
          >
            <span
              style="width:${reviewRate}%"
            ></span>
          </div>

        </div>


        <!-- =============================================
             NEXT SESSION
        ============================================== -->

        ${
          nextScheduleDate
            ? `
              <div
                class="teacher-class-next-session"
              >
                <i
                  class="fa-regular fa-calendar"
                  aria-hidden="true"
                ></i>

                <span>
                  Next:
                  ${escapeHtml(
                    formatDate(
                      nextScheduleDate
                    )
                  )}
                  ${
                    nextScheduleTime
                      ? ` · ${escapeHtml(nextScheduleTime)}`
                      : ""
                  }
                </span>
              </div>
            `
            : ""
        }


        <!-- =============================================
             PRIMARY ACTIONS
        ============================================== -->

        <div
          class="teacher-class-card-actions"
        >

          <button
            type="button"
            class="teacher-class-open-button"
            data-teacher-action="open-class"
            data-class-id="${escapeAttribute(classId)}"
          >
            <span>
              Open Class
            </span>

            <i
              class="fa-solid fa-arrow-right"
              aria-hidden="true"
            ></i>
          </button>


          <button
            type="button"
            class="teacher-class-manage-button"
            data-teacher-action="class-students"
            data-class-id="${escapeAttribute(classId)}"
          >
            <i
              class="fa-solid fa-users"
              aria-hidden="true"
            ></i>

            <span>
              Students
            </span>
          </button>

        </div>


        <!-- =============================================
             SECONDARY CLASS TOOLS
        ============================================== -->

        <div
          class="teacher-class-tools"
        >

          <button
            type="button"
            class="teacher-class-tool"
            data-teacher-action="class-assignments"
            data-class-id="${escapeAttribute(classId)}"
            title="Assignments"
          >
            <i
              class="fa-regular fa-file-lines"
              aria-hidden="true"
            ></i>

            <span>
              ${assignmentCount}
            </span>
          </button>


          <button
            type="button"
            class="teacher-class-tool"
            data-teacher-action="class-grading"
            data-class-id="${escapeAttribute(classId)}"
            title="Grading"
          >
            <i
              class="fa-solid fa-pen-to-square"
              aria-hidden="true"
            ></i>

            <span>
              ${pendingCount}
            </span>
          </button>


          <button
            type="button"
            class="teacher-class-tool"
            data-teacher-action="class-quizzes"
            data-class-id="${escapeAttribute(classId)}"
            title="Quizzes"
          >
            <i
              class="fa-solid fa-list-check"
              aria-hidden="true"
            ></i>

            <span>
              ${quizCount}
            </span>
          </button>


          <button
            type="button"
            class="teacher-class-tool"
            data-teacher-action="class-schedule"
            data-class-id="${escapeAttribute(classId)}"
            title="Schedule"
          >
            <i
              class="fa-regular fa-calendar"
              aria-hidden="true"
            ></i>
          </button>

        </div>

      </div>

    </article>
  `;

}


/* =========================================================
   FIX CLASS COVER FALLBACKS
========================================================= */

function bindTeacherClassImageFallbacks(){

  const grid =
    $(
      "teacherClassesGrid"
    );


  if (
    !grid
  ){

    return;

  }


  grid
    .querySelectorAll(
      ".teacher-class-card-cover img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            image.onerror =
              null;

            image.src =
              CLASS_FALLBACK;

          };

      }
    );

}


/* =========================================================
   RENDER CLASSES GRID
========================================================= */

function renderTeacherClassesGrid(){

  const grid =
    $(
      "teacherClassesGrid"
    );


  if (
    !grid
  ){

    return;

  }


  const classes =
    getFilteredTeacherClasses();


  renderTeacherClassesCount();

  renderTeacherClassesEmptyState(
    classes
  );


  if (
    !classes.length
  ){

    grid.innerHTML =
      "";

    grid.hidden =
      true;

    return;

  }


  grid.hidden =
    false;


  grid.innerHTML =
    classes
      .map(
        createTeacherClassCard
      )
      .join(
        ""
      );


  bindTeacherClassImageFallbacks();

}


/* =========================================================
   RENDER CLASS FILTER STATE
========================================================= */

function renderTeacherClassesFilters(){

  const searchInput =
    $(
      "teacherClassSearch"
    );


  if (
    searchInput &&
    searchInput.value !==
      teacherClassWorkspaceState
        .search
  ){

    searchInput.value =
      teacherClassWorkspaceState
        .search;

  }


  renderTeacherClassSubjectFilter();

  renderTeacherClassStatusFilter();

}


/* =========================================================
   RENDER COMPLETE CLASSES WORKSPACE

   No new page shell is generated.

   We hydrate the containers already present in teacher.html.
========================================================= */

function renderTeacherClassesWorkspace(){

  renderTeacherClassesFilters();

  renderTeacherClassesGrid();

}


/* =========================================================
   CLASS SEARCH CONTROL
========================================================= */

function handleTeacherClassSearchInput(
  event
){

  teacherClassWorkspaceState
    .search =
    safeString(
      event?.target?.value
    );


  renderTeacherClassesGrid();

}


/* =========================================================
   CLASS SUBJECT FILTER CONTROL
========================================================= */

function handleTeacherClassSubjectChange(
  event
){

  teacherClassWorkspaceState
    .subject =
    safeString(
      event?.target?.value
    );


  renderTeacherClassesGrid();

}


/* =========================================================
   CLASS STATUS FILTER CONTROL
========================================================= */

function handleTeacherClassStatusChange(
  event
){

  teacherClassWorkspaceState
    .status =
    safeString(
      event?.target?.value
    );


  renderTeacherClassesGrid();

}


/* =========================================================
   CLEAR CLASS FILTERS
========================================================= */

function clearTeacherClassFilters(){

  teacherClassWorkspaceState
    .search =
    "";

  teacherClassWorkspaceState
    .subject =
    "";

  teacherClassWorkspaceState
    .status =
    "";


  renderTeacherClassesFilters();

  renderTeacherClassesGrid();

}


/* =========================================================
   REFRESH ASSIGNED CLASSES

   This refreshes actual backend data rather than merely
   rerendering the existing state.
========================================================= */

async function refreshTeacherClassesWorkspace(){

  if (
    teacherClassWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherClassWorkspaceState
    .refreshing =
    true;


  const refreshButtons =
    $all(
      '[data-teacher-action="refresh-classes"]'
    );


  refreshButtons.forEach(
    button => {

      button.disabled =
        true;

      button.setAttribute(
        "aria-busy",
        "true"
      );

    }
  );


  try{

    await loadTeacherClasses();


    /*
      Once class membership changes, dependent data must also
      be refreshed so counts do not refer to classes that are
      no longer assigned to this teacher.
    */

    await Promise.allSettled([

      loadTeacherAssignments(),

      loadTeacherSubmissions(),

      loadTeacherSchedules(),

      loadTeacherAttendance(),

      loadTeacherQuizzes(),

      loadTeacherQuizSubmissions()

    ]);


    finalizeTeacherLoadedData();


    renderTeacherClassesWorkspace();

    renderTeacherDashboardStats();

    renderTeacherGradingBadge();


    notifyAIFTSuccess(
      "Your assigned classes are up to date.",
      {
        title:
          "Classes refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Your classes could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherClassWorkspaceState
      .refreshing =
      false;


    refreshButtons.forEach(
      button => {

        button.disabled =
          false;

        button.setAttribute(
          "aria-busy",
          "false"
        );

      }
    );

  }

}


/* =========================================================
   INITIALIZE CLASSES WORKSPACE

   IMPORTANT:
   These are local FILTER bindings only.

   Class card actions are NOT bound here.

   All actions such as:
     open-class
     class-students
     class-assignments
     class-grading
     class-quizzes
     class-schedule
     refresh-classes
     create-class

   will be handled by the ONE authoritative delegated action
   controller later.

   This avoids recreating the duplicate-controller problem.
========================================================= */

function initializeTeacherClassesWorkspace(){

  if (
    teacherClassWorkspaceState
      .initialized
  ){

    renderTeacherClassesWorkspace();

    return;

  }


  teacherClassWorkspaceState
    .initialized =
    true;


  const searchInput =
    $(
      "teacherClassSearch"
    );

  const subjectFilter =
    $(
      "teacherClassSubjectFilter"
    );

  const statusFilter =
    $(
      "teacherClassStatusFilter"
    );


  /*
    Property handlers are intentional here.

    They guarantee one active handler for these static
    teacher.html controls even if the workspace is restored.
  */

  if (
    searchInput
  ){

    searchInput.oninput =
      handleTeacherClassSearchInput;

  }


  if (
    subjectFilter
  ){

    subjectFilter.onchange =
      handleTeacherClassSubjectChange;

  }


  if (
    statusFilter
  ){

    statusFilter.onchange =
      handleTeacherClassStatusChange;

  }


  renderTeacherClassesWorkspace();

}


/* =========================================================
   CLASS WORKSPACE DATA REFRESH EVENT

   If data changes while the Classes page is already visible,
   this renderer can safely be called again.

   No second listener is attached to the filter controls.
========================================================= */

function refreshTeacherClassesFromCurrentState(){

  renderTeacherClassSubjectFilter();

  renderTeacherClassesGrid();

}


/* =========================================================
   PART 4 COMPLETE

   CURRENT teacher.html DESIGN PRESERVED.

   This part intentionally DOES NOT:
   - rebuild teacherPageClasses
   - replace the filter bar
   - add a different toolbar
   - add a sort dropdown that teacher.html does not contain
   - create duplicate navigation listeners
   - guess the URL for opening class-builder.html
   - bind class action buttons independently

   The authoritative action controller later will decide the
   exact destinations/actions after all workspaces exist.
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 5

   STUDENTS WORKSPACE
   ---------------------------------------------------------
   1. Workspace state
   2. Student-record normalization
   3. Student/class helpers
   4. Submission / attendance metrics
   5. Progress classification
   6. Filtering
   7. Existing filter hydration
   8. Existing student-card design
   9. Empty/count states
   10. Refresh behavior
   11. Students workspace initialization

   DESIGN CONTRACT
   ---------------------------------------------------------
   Uses current teacher.html:

   #teacherStudentSearch
   #teacherStudentClassFilter
   #teacherStudentProgressFilter
   #teacherStudentsCount
   #teacherStudentsGrid
   #teacherStudentsEmpty

   Uses current CSS:

   .teacher-students-grid
   .teacher-student-card
   .teacher-student-card-top
   .teacher-student-avatar
   .teacher-student-info
   .teacher-student-name
   .teacher-student-email
   .teacher-student-status
   .teacher-student-class
   .teacher-student-progress
   .teacher-student-progress-header
   .teacher-student-progress-track
   .teacher-student-progress-fill
   .teacher-student-activity
   .teacher-student-activity-item
========================================================= */


/* =========================================================
   STUDENT WORKSPACE STATE
========================================================= */

const teacherStudentWorkspaceState = {

  search:
    "",

  classId:
    "",

  progress:
    "",

  selectedStudentId:
    "",

  refreshing:
    false,

  initialized:
    false

};


/* =========================================================
   NORMALIZE TEACHER STUDENT RECORD

   Part 2 deliberately stores student records as:

   {
     id,
     student:{...},
     classes:[...]
   }

   because one student may belong to multiple assigned
   classes.

   This helper gives the rest of the workspace one canonical
   interface while preserving that richer structure.
========================================================= */

function normalizeTeacherStudentRecord(
  value
){

  if (
    !value
  ){

    return null;

  }


  if (
    value.student &&
    typeof value.student ===
      "object"
  ){

    const studentId =
      normalizeId(

        value.id ||

        value.student._id ||
        value.student.id

      );


    if (
      !studentId
    ){

      return null;

    }


    return {

      id:
        studentId,

      student:
        value.student,

      classes:
        asArray(
          value.classes
        )

    };

  }


  const studentId =
    normalizeId(
      value._id ||
      value.id
    );


  if (
    !studentId
  ){

    return null;

  }


  return {

    id:
      studentId,

    student:
      value,

    classes:
      []

  };

}


/* =========================================================
   GET ALL STUDENT RECORDS
========================================================= */

function getTeacherStudentRecords(){

  return asArray(
    state.students
  )
    .map(
      normalizeTeacherStudentRecord
    )
    .filter(
      Boolean
    );

}


/* =========================================================
   STUDENT BY ID
========================================================= */

function getTeacherStudentById(
  studentId
){

  const normalizedStudentId =
    normalizeId(
      studentId
    );


  if (
    !normalizedStudentId
  ){

    return null;

  }


  return (
    getTeacherStudentRecords()
      .find(
        record =>
          sameId(
            record.id,
            normalizedStudentId
          )
      ) ||
    null
  );

}


/* =========================================================
   RAW STUDENT OBJECT
========================================================= */

function getTeacherStudentObject(
  value
){

  const record =
    normalizeTeacherStudentRecord(
      value
    );


  return (
    record?.student ||
    {}
  );

}


/* =========================================================
   STUDENT NAME
========================================================= */

function getTeacherStudentDisplayName(
  value
){

  const student =
    getTeacherStudentObject(
      value
    );


  return safeString(

    student.name ||
    student.fullName ||
    student.displayName,

    "Student"

  );

}


/* =========================================================
   STUDENT EMAIL
========================================================= */

function getTeacherStudentEmail(
  value
){

  const student =
    getTeacherStudentObject(
      value
    );


  return safeString(
    student.email
  );

}


/* =========================================================
   STUDENT COURSE / PROGRAM
========================================================= */

function getTeacherStudentCourse(
  value
){

  const student =
    getTeacherStudentObject(
      value
    );


  return safeString(

    student.course ||
    student.program ||
    student.department ||
    student.gradeLevel,

    ""

  );

}


/* =========================================================
   STUDENT AVATAR
========================================================= */

function getTeacherStudentAvatar(
  value
){

  const student =
    getTeacherStudentObject(
      value
    );


  return getSafeImageUrl(

    student.profileImage ||
    student.avatar ||
    student.photoURL ||
    student.image,

    FALLBACK_AVATAR

  );

}


/* =========================================================
   STUDENT INITIALS
========================================================= */

function getTeacherStudentInitials(
  value
){

  const name =
    getTeacherStudentDisplayName(
      value
    );


  const parts =
    name
      .split(
        /\s+/
      )
      .filter(
        Boolean
      )
      .slice(
        0,
        2
      );


  return (
    parts
      .map(
        part =>
          part.charAt(
            0
          )
            .toUpperCase()
      )
      .join(
        ""
      ) ||
    "S"
  );

}


/* =========================================================
   STUDENT CLASSES
========================================================= */

function getTeacherStudentClasses(
  value
){

  const record =
    normalizeTeacherStudentRecord(
      value
    );


  if (
    !record
  ){

    return [];

  }


  /*
    Prefer the normalized class membership built from
    assigned classes.
  */

  if (
    record.classes.length
  ){

    return record.classes;

  }


  /*
    Defensive recovery:
    derive membership from currently assigned classes if a
    record was supplied in flat form.
  */

  return getTeacherClasses()
    .filter(
      classItem =>
        asArray(
          classItem?.studentIds
        )
          .some(
            student =>
              sameId(
                student?._id ||
                student?.id ||
                student,
                record.id
              )
          )
    )
    .map(
      classItem => ({

        id:
          normalizeId(
            classItem?._id ||
            classItem?.id
          ),

        title:
          getTeacherClassTitle(
            classItem
          )

      })
    );

}


/* =========================================================
   STUDENT CLASS TITLES
========================================================= */

function getTeacherStudentClassTitles(
  value
){

  return getTeacherStudentClasses(
    value
  )
    .map(
      classItem =>
        safeString(

          classItem.title ||
          classItem.subject ||
          classItem.name,

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

  const normalizedStudentId =
    normalizeId(
      studentId
    );


  if (
    !normalizedStudentId
  ){

    return [];

  }


  return getTeacherSubmissions()
    .filter(
      submission =>
        sameId(
          submission
            ?.studentId
            ?._id ||
          submission
            ?.studentId,
          normalizedStudentId
        )
    );

}


/* =========================================================
   STUDENT ATTENDANCE
========================================================= */

function getTeacherStudentAttendance(
  studentId
){

  const normalizedStudentId =
    normalizeId(
      studentId
    );


  if (
    !normalizedStudentId
  ){

    return [];

  }


  return getTeacherAttendance()
    .filter(
      record =>
        sameId(
          record
            ?.studentId
            ?._id ||
          record
            ?.studentId,
          normalizedStudentId
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
    )
      .filter(
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
    !records.length
  ){

    return 0;

  }


  const attended =
    records
      .filter(
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
   REVIEWED STUDENT SUBMISSIONS
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
   PENDING STUDENT SUBMISSIONS
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

   A student is considered assigned work from every teacher
   class in which that student is enrolled.
========================================================= */

function getTeacherStudentAssignments(
  studentId
){

  const studentRecord =
    getTeacherStudentById(
      studentId
    );


  if (
    !studentRecord
  ){

    return [];

  }


  const classIds =
    new Set(
      getTeacherStudentClasses(
        studentRecord
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
            assignment
              ?.classId
              ?._id ||
            assignment
              ?.classId
          );


        return (
          classId &&
          classIds.has(
            classId
          )
        );

      }
    );

}


/* =========================================================
   MISSING / OVERDUE ASSIGNMENTS

   We only mark an assignment missing when:
   - it belongs to one of the student's classes
   - no submission exists
   - it has a valid due date
   - that due date has passed

   An assignment with no deadline is NOT assumed missing.
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
              submission
                ?.assignmentId
                ?._id ||
              submission
                ?.assignmentId
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
        !assignmentId ||
        submittedAssignmentIds.has(
          assignmentId
        )
      ){

        return false;

      }


      const dueDate =
        toValidDate(
          assignment?.dueDate
        );


      if (
        !dueDate
      ){

        return false;

      }


      return (
        dueDate.getTime() <
        Date.now()
      );

    }
  );

}


/* =========================================================
   STUDENT REVIEW COMPLETION RATE
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
   STUDENT NUMERIC GRADE AVERAGE
========================================================= */

function getTeacherStudentGradeAverage(
  studentId
){

  const graded =
    getTeacherStudentReviewedSubmissions(
      studentId
    )
      .filter(
        submission =>
          Number.isFinite(
            Number(
              submission?.grade
            )
          )
      );


  if (
    !graded.length
  ){

    return null;

  }


  const total =
    graded.reduce(
      (
        sum,
        submission
      ) =>
        sum +
        safeNumber(
          submission?.grade,
          0
        ),
      0
    );


  return clampPercentage(
    total /
    graded.length
  );

}


/* =========================================================
   STUDENT PROGRESS SCORE

   This is a dashboard indication, NOT a published grade.

   Priority:
   1. Reviewed grade average when available.
   2. Submission completion when assignments exist.
   3. Attendance when attendance data exists.
   4. Otherwise no measurable score.

   Kabezya is not used to invent this number.
========================================================= */

function getTeacherStudentProgressScore(
  studentId
){

  const gradeAverage =
    getTeacherStudentGradeAverage(
      studentId
    );


  if (
    gradeAverage !==
    null
  ){

    return gradeAverage;

  }


  const assignments =
    getTeacherStudentAssignments(
      studentId
    );

  const submissions =
    getTeacherStudentSubmissions(
      studentId
    );


  if (
    assignments.length
  ){

    const submittedAssignmentIds =
      new Set(
        submissions
          .map(
            submission =>
              normalizeId(
                submission
                  ?.assignmentId
                  ?._id ||
                submission
                  ?.assignmentId
              )
          )
          .filter(
            Boolean
          )
      );


    return clampPercentage(
      (
        submittedAssignmentIds.size /
        assignments.length
      ) *
      100
    );

  }


  const attendanceRecords =
    getTeacherStudentAttendance(
      studentId
    );


  if (
    attendanceRecords.length
  ){

    return getTeacherStudentAttendanceRate(
      studentId
    );

  }


  return null;

}


/* =========================================================
   PROGRESS CATEGORY

   These categories correspond to teacher.html options:

   excellent
   good
   needs-attention
========================================================= */

function getTeacherStudentProgressCategory(
  studentId
){

  const missing =
    getTeacherStudentMissingAssignments(
      studentId
    ).length;

  const attendanceRecords =
    getTeacherStudentAttendance(
      studentId
    );

  const attendanceRate =
    getTeacherStudentAttendanceRate(
      studentId
    );

  const score =
    getTeacherStudentProgressScore(
      studentId
    );


  /*
    Strong warning signals take priority.
  */

  if (
    missing >=
      2 ||
    (
      attendanceRecords.length &&
      attendanceRate <
        60
    ) ||
    (
      score !==
        null &&
      score <
        60
    )
  ){

    return "needs-attention";

  }


  if (
    score !==
      null &&
    score >=
      85 &&
    (
      !attendanceRecords.length ||
      attendanceRate >=
        80
    ) &&
    missing ===
      0
  ){

    return "excellent";

  }


  return "good";

}


/* =========================================================
   STUDENT STATUS LABEL
========================================================= */

function getTeacherStudentProgressLabel(
  studentId
){

  switch(
    getTeacherStudentProgressCategory(
      studentId
    )
  ){

    case "excellent":

      return "Excellent";

    case "needs-attention":

      return "Needs attention";

    default:

      return "Good";

  }

}


/* =========================================================
   STUDENT CARD STATUS CLASS

   Existing CSS defines active/inactive.

   We retain those classes instead of inventing new badge CSS.
========================================================= */

function getTeacherStudentStatusClass(
  studentId
){

  return (
    getTeacherStudentProgressCategory(
      studentId
    ) ===
    "needs-attention"
      ? "inactive"
      : "active"
  );

}


/* =========================================================
   PROGRESS BAR CLASS

   Existing CSS:
     good
     warning
     danger
========================================================= */

function getTeacherStudentProgressBarClass(
  score
){

  if (
    score ===
    null
  ){

    return "";

  }


  if (
    score >=
    80
  ){

    return "good";

  }


  if (
    score >=
    60
  ){

    return "warning";

  }


  return "danger";

}


/* =========================================================
   STUDENT LATEST ACTIVITY
========================================================= */

function getTeacherStudentLatestActivity(
  studentId
){

  return (
    sortNewestFirst(
      getTeacherStudentSubmissions(
        studentId
      ),
      [
        "submittedAt",
        "reviewedAt",
        "updatedAt",
        "createdAt"
      ]
    )[0] ||
    null
  );

}


/* =========================================================
   FILTER STUDENTS
========================================================= */

function getFilteredTeacherStudents(){

  const search =
    safeString(
      teacherStudentWorkspaceState
        .search
    )
      .toLowerCase();

  const classId =
    normalizeId(
      teacherStudentWorkspaceState
        .classId
    );

  const progress =
    safeString(
      teacherStudentWorkspaceState
        .progress
    )
      .toLowerCase();


  let students = [
    ...getTeacherStudentRecords()
  ];


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  if (
    search
  ){

    students =
      students.filter(
        record => {

          const haystack =
            [

              getTeacherStudentDisplayName(
                record
              ),

              getTeacherStudentEmail(
                record
              ),

              getTeacherStudentCourse(
                record
              ),

              ...getTeacherStudentClassTitles(
                record
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


  /* -------------------------------------------------------
     CLASS
  ------------------------------------------------------- */

  if (
    classId
  ){

    students =
      students.filter(
        record =>
          getTeacherStudentClasses(
            record
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


  /* -------------------------------------------------------
     PROGRESS
  ------------------------------------------------------- */

  if (
    progress
  ){

    students =
      students.filter(
        record =>
          getTeacherStudentProgressCategory(
            record.id
          ) ===
          progress
      );

  }


  /* -------------------------------------------------------
     CURRENT HTML DOES NOT HAVE A SORT CONTROL.

     Stable alphabetical ordering keeps the current design
     unchanged.
  ------------------------------------------------------- */

  students.sort(
    (
      first,
      second
    ) =>
      getTeacherStudentDisplayName(
        first
      )
        .localeCompare(
          getTeacherStudentDisplayName(
            second
          )
        )
  );


  return students;

}


/* =========================================================
   HYDRATE STUDENT CLASS FILTER
========================================================= */

function renderTeacherStudentClassFilter(){

  const select =
    $(
      "teacherStudentClassFilter"
    );


  if (
    !select
  ){

    return;

  }


  const selectedValue =
    teacherStudentWorkspaceState
      .classId;


  select.innerHTML = `
    <option value="">
      All classes
    </option>

    ${
      getTeacherClasses()
        .map(
          classItem => {

            const classId =
              normalizeId(
                classItem?._id ||
                classItem?.id
              );


            return `
              <option
                value="${escapeAttribute(classId)}"
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
  `;


  select.value =
    selectedValue;


  if (
    select.value !==
    selectedValue
  ){

    teacherStudentWorkspaceState
      .classId =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   HYDRATE PROGRESS FILTER

   Options already exist in teacher.html.
   Only its selected value is synchronized.
========================================================= */

function renderTeacherStudentProgressFilter(){

  const select =
    $(
      "teacherStudentProgressFilter"
    );


  if (
    !select
  ){

    return;

  }


  select.value =
    teacherStudentWorkspaceState
      .progress;


  if (
    select.value !==
    teacherStudentWorkspaceState
      .progress
  ){

    teacherStudentWorkspaceState
      .progress =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   STUDENT COUNT
========================================================= */

function renderTeacherStudentsCount(){

  const allStudents =
    getTeacherStudentRecords();

  const filteredStudents =
    getFilteredTeacherStudents();

  const hasFilters =
    Boolean(

      teacherStudentWorkspaceState
        .search ||

      teacherStudentWorkspaceState
        .classId ||

      teacherStudentWorkspaceState
        .progress

    );


  if (
    hasFilters
  ){

    setText(
      "teacherStudentsCount",
      `${filteredStudents.length} of ${allStudents.length} ${
        allStudents.length === 1
          ? "student"
          : "students"
      }`
    );


    return;

  }


  setText(
    "teacherStudentsCount",
    `${allStudents.length} ${
      allStudents.length === 1
        ? "student"
        : "students"
    }`
  );

}


/* =========================================================
   STUDENT EMPTY STATE
========================================================= */

function renderTeacherStudentsEmptyState(
  students
){

  const empty =
    $(
      "teacherStudentsEmpty"
    );


  if (
    !empty
  ){

    return;

  }


  const hasStudents =
    getTeacherStudentRecords()
      .length >
    0;

  const hasResults =
    asArray(
      students
    ).length >
    0;

  const hasFilters =
    Boolean(

      teacherStudentWorkspaceState
        .search ||

      teacherStudentWorkspaceState
        .classId ||

      teacherStudentWorkspaceState
        .progress

    );


  empty.hidden =
    hasResults;


  if (
    hasResults
  ){

    return;

  }


  const heading =
    empty.querySelector(
      "h2"
    );

  const description =
    empty.querySelector(
      "p"
    );

  const clearButton =
    empty.querySelector(
      '[data-teacher-action="clear-student-filters"]'
    );


  if (
    !hasStudents
  ){

    if (
      heading
    ){

      heading.textContent =
        "No students assigned yet";

    }


    if (
      description
    ){

      description.textContent =
        "Students enrolled in your assigned classes will appear here.";

    }


    if (
      clearButton
    ){

      clearButton.hidden =
        true;

    }


    return;

  }


  if (
    hasFilters
  ){

    if (
      heading
    ){

      heading.textContent =
        "No students found";

    }


    if (
      description
    ){

      description.textContent =
        "No students match the selected filters.";

    }


    if (
      clearButton
    ){

      clearButton.hidden =
        false;

    }

  }

}


/* =========================================================
   STUDENT PRIMARY CLASS LABEL
========================================================= */

function getTeacherStudentPrimaryClassLabel(
  record
){

  const titles =
    getTeacherStudentClassTitles(
      record
    );


  if (
    !titles.length
  ){

    return "No assigned class";

  }


  if (
    titles.length ===
    1
  ){

    return titles[0];

  }


  return `${titles[0]} +${titles.length - 1}`;

}


/* =========================================================
   STUDENT CARD
========================================================= */

function createTeacherStudentCard(
  record
){

  const studentId =
    record.id;

  const name =
    getTeacherStudentDisplayName(
      record
    );

  const email =
    getTeacherStudentEmail(
      record
    );

  const avatar =
    getTeacherStudentAvatar(
      record
    );

  const initials =
    getTeacherStudentInitials(
      record
    );

  const classLabel =
    getTeacherStudentPrimaryClassLabel(
      record
    );

  const progressScore =
    getTeacherStudentProgressScore(
      studentId
    );

  const progressCategory =
    getTeacherStudentProgressCategory(
      studentId
    );

  const progressLabel =
    getTeacherStudentProgressLabel(
      studentId
    );

  const progressClass =
    getTeacherStudentProgressBarClass(
      progressScore
    );

  const statusClass =
    getTeacherStudentStatusClass(
      studentId
    );

  const submissions =
    getTeacherStudentSubmissions(
      studentId
    ).length;

  const pending =
    getTeacherStudentPendingSubmissions(
      studentId
    ).length;

  const missing =
    getTeacherStudentMissingAssignments(
      studentId
    ).length;

  const attendanceRecords =
    getTeacherStudentAttendance(
      studentId
    );

  const attendanceRate =
    getTeacherStudentAttendanceRate(
      studentId
    );

  const latestActivity =
    getTeacherStudentLatestActivity(
      studentId
    );


  return `
    <article
      class="teacher-student-card"
      data-student-id="${escapeAttribute(studentId)}"
    >

      <!-- ===============================================
           STUDENT HEADER
      ================================================ -->

      <div
        class="teacher-student-card-top"
      >

        <div
          class="teacher-student-avatar"
          aria-hidden="true"
        >
          <span>
            ${escapeHtml(initials)}
          </span>

          <img
            src="${escapeAttribute(avatar)}"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
          />
        </div>


        <div
          class="teacher-student-info"
        >

          <h3
            class="teacher-student-name"
            title="${escapeAttribute(name)}"
          >
            ${escapeHtml(name)}
          </h3>

          <p
            class="teacher-student-email"
            title="${escapeAttribute(email)}"
          >
            ${escapeHtml(
              email ||
              "No email available"
            )}
          </p>

        </div>


        <span
          class="teacher-student-status ${escapeAttribute(statusClass)}"
          title="${escapeAttribute(progressLabel)}"
        >
          ${escapeHtml(progressLabel)}
        </span>

      </div>


      <!-- ===============================================
           CLASS
      ================================================ -->

      <div
        class="teacher-student-class"
        title="${escapeAttribute(
          getTeacherStudentClassTitles(
            record
          ).join(", ")
        )}"
      >
        <i
          class="fa-solid fa-chalkboard-user"
          aria-hidden="true"
        ></i>

        <span>
          ${escapeHtml(classLabel)}
        </span>
      </div>


      <!-- ===============================================
           PROGRESS
      ================================================ -->

      <div
        class="teacher-student-progress"
      >

        <div
          class="teacher-student-progress-header"
        >
          <span>
            Learning progress
          </span>

          <strong>
            ${
              progressScore ===
              null
                ? "—"
                : `${progressScore}%`
            }
          </strong>
        </div>


        <div
          class="teacher-student-progress-track"
          ${
            progressScore !==
            null
              ? `
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${progressScore}"
              `
              : ""
          }
        >
          <div
            class="teacher-student-progress-fill ${escapeAttribute(progressClass)}"
            style="width:${
              progressScore ===
              null
                ? 0
                : progressScore
            }%"
          ></div>
        </div>

      </div>


      <!-- ===============================================
           ACTIVITY METRICS
      ================================================ -->

      <div
        class="teacher-student-activity"
      >

        <div
          class="teacher-student-activity-item"
        >
          <strong>
            ${submissions}
          </strong>

          <span>
            Submitted
          </span>
        </div>


        <div
          class="teacher-student-activity-item"
        >
          <strong>
            ${pending}
          </strong>

          <span>
            To review
          </span>
        </div>


        <div
          class="teacher-student-activity-item"
        >
          <strong>
            ${
              attendanceRecords.length
                ? `${attendanceRate}%`
                : "—"
            }
          </strong>

          <span>
            Attendance
          </span>
        </div>

      </div>


      <!-- ===============================================
           SECONDARY CONTEXT
      ================================================ -->

      <div
        class="teacher-student-card-context"
      >

        ${
          missing
            ? `
              <span
                class="teacher-student-context-warning"
              >
                <i
                  class="fa-solid fa-triangle-exclamation"
                  aria-hidden="true"
                ></i>

                ${missing}
                ${
                  missing === 1
                    ? "overdue assignment"
                    : "overdue assignments"
                }
              </span>
            `
            : `
              <span>
                ${
                  latestActivity
                    ? `Last activity ${escapeHtml(
                        formatRelativeDate(
                          latestActivity.submittedAt ||
                          latestActivity.updatedAt ||
                          latestActivity.createdAt
                        )
                      )}`
                    : "No recent submission activity"
                }
              </span>
            `
        }

      </div>


      <!-- ===============================================
           ACTIONS

           The authoritative Studio action controller will
           bind these in one location later.
      ================================================ -->

      <div
        class="teacher-student-card-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-action="student-work"
          data-student-id="${escapeAttribute(studentId)}"
        >
          <i
            class="fa-regular fa-file-lines"
            aria-hidden="true"
          ></i>

          <span>
            Student Work
          </span>
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-action="open-student"
          data-student-id="${escapeAttribute(studentId)}"
        >
          <span>
            View Student
          </span>

          <i
            class="fa-solid fa-arrow-right"
            aria-hidden="true"
          ></i>
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   STUDENT IMAGE FALLBACKS
========================================================= */

function bindTeacherStudentImageFallbacks(){

  const grid =
    $(
      "teacherStudentsGrid"
    );


  if (
    !grid
  ){

    return;

  }


  grid
    .querySelectorAll(
      ".teacher-student-avatar img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            /*
              Hide the failed image rather than loading another
              broken asset. The initials beneath remain visible.
            */

            image.onerror =
              null;

            image.hidden =
              true;

          };

      }
    );

}


/* =========================================================
   RENDER STUDENT GRID
========================================================= */

function renderTeacherStudentsGrid(){

  const grid =
    $(
      "teacherStudentsGrid"
    );


  if (
    !grid
  ){

    return;

  }


  const students =
    getFilteredTeacherStudents();


  renderTeacherStudentsCount();

  renderTeacherStudentsEmptyState(
    students
  );


  if (
    !students.length
  ){

    grid.innerHTML =
      "";

    grid.hidden =
      true;

    return;

  }


  grid.hidden =
    false;


  grid.innerHTML =
    students
      .map(
        createTeacherStudentCard
      )
      .join(
        ""
      );


  bindTeacherStudentImageFallbacks();

}


/* =========================================================
   RENDER STUDENT FILTER STATE
========================================================= */

function renderTeacherStudentFilters(){

  const search =
    $(
      "teacherStudentSearch"
    );


  if (
    search &&
    search.value !==
      teacherStudentWorkspaceState
        .search
  ){

    search.value =
      teacherStudentWorkspaceState
        .search;

  }


  renderTeacherStudentClassFilter();

  renderTeacherStudentProgressFilter();

}


/* =========================================================
   COMPLETE STUDENTS WORKSPACE
========================================================= */

function renderTeacherStudentsWorkspace(){

  renderTeacherStudentFilters();

  renderTeacherStudentsGrid();

}


/* =========================================================
   COMPATIBILITY RENDERER

   The router will use one authoritative renderer name.
========================================================= */

function renderTeacherStudents(){

  renderTeacherStudentsWorkspace();

}


/* =========================================================
   STUDENT SEARCH
========================================================= */

function handleTeacherStudentSearchInput(
  event
){

  teacherStudentWorkspaceState
    .search =
    safeString(
      event?.target?.value
    );


  renderTeacherStudentsGrid();

}


/* =========================================================
   STUDENT CLASS FILTER
========================================================= */

function handleTeacherStudentClassChange(
  event
){

  teacherStudentWorkspaceState
    .classId =
    normalizeId(
      event?.target?.value
    );


  renderTeacherStudentsGrid();

}


/* =========================================================
   STUDENT PROGRESS FILTER
========================================================= */

function handleTeacherStudentProgressChange(
  event
){

  teacherStudentWorkspaceState
    .progress =
    safeString(
      event?.target?.value
    );


  renderTeacherStudentsGrid();

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
    "";

  teacherStudentWorkspaceState
    .progress =
    "";


  renderTeacherStudentFilters();

  renderTeacherStudentsGrid();

}


/* =========================================================
   REFRESH STUDENTS

   Students come from populated studentIds in assigned
   classes, so the authoritative refresh begins by reloading
   assigned classes.

   Submission and attendance data are also refreshed because
   the Student cards display those live metrics.
========================================================= */

async function refreshTeacherStudentsWorkspace(){

  if (
    teacherStudentWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherStudentWorkspaceState
    .refreshing =
    true;


  const buttons =
    $all(
      '[data-teacher-action="refresh-students"]'
    );


  buttons.forEach(
    button => {

      button.disabled =
        true;

      button.setAttribute(
        "aria-busy",
        "true"
      );

    }
  );


  try{

    await loadTeacherClasses();


    const results =
      await Promise.allSettled([

        loadTeacherAssignments(),

        loadTeacherSubmissions(),

        loadTeacherAttendance()

      ]);


    results.forEach(
      (
        result,
        index
      ) => {

        if (
          result.status !==
          "rejected"
        ){

          return;

        }


        const names = [
          "Assignments",
          "Submissions",
          "Attendance"
        ];


        reportOptionalRequestError(
          names[index],
          result.reason
        );

      }
    );


    finalizeTeacherLoadedData();


    renderTeacherStudentsWorkspace();

    renderTeacherDashboardStats();

    renderTeacherOverviewActivity();


    notifyAIFTSuccess(
      "Student information is up to date.",
      {
        title:
          "Students refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Students could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherStudentWorkspaceState
      .refreshing =
      false;


    buttons.forEach(
      button => {

        button.disabled =
          false;

        button.setAttribute(
          "aria-busy",
          "false"
        );

      }
    );

  }

}


/* =========================================================
   INITIALIZE STUDENTS WORKSPACE

   Only the three STATIC FILTER CONTROLS are bound here.

   Buttons generated inside student cards are intentionally
   NOT bound here. The authoritative delegated Studio action
   controller will handle them later.
========================================================= */

function initializeTeacherStudentsWorkspace(){

  if (
    teacherStudentWorkspaceState
      .initialized
  ){

    renderTeacherStudentsWorkspace();

    return;

  }


  teacherStudentWorkspaceState
    .initialized =
    true;


  const search =
    $(
      "teacherStudentSearch"
    );

  const classFilter =
    $(
      "teacherStudentClassFilter"
    );

  const progressFilter =
    $(
      "teacherStudentProgressFilter"
    );


  if (
    search
  ){

    search.oninput =
      handleTeacherStudentSearchInput;

  }


  if (
    classFilter
  ){

    classFilter.onchange =
      handleTeacherStudentClassChange;

  }


  if (
    progressFilter
  ){

    progressFilter.onchange =
      handleTeacherStudentProgressChange;

  }


  renderTeacherStudentsWorkspace();

}


/* =========================================================
   REFRESH STUDENT UI FROM EXISTING STATE
========================================================= */

function refreshTeacherStudentsFromCurrentState(){

  renderTeacherStudentClassFilter();

  renderTeacherStudentsGrid();

}


/* =========================================================
   PART 5 COMPLETE

   IMPORTANT:
   - Current Students HTML remains untouched.
   - Current compact three-column card design remains.
   - No separate Students page is generated.
   - No duplicate document-level navigation listeners exist.
   - No guessed student-profile route is introduced.
   - No fake student progress is generated from Kabezya.
   - Student progress is derived only from real loaded data.

   Later authoritative actions will handle:

     refresh-students
     clear-student-filters
     open-student
     student-work
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 6

   ASSIGNMENTS + SUBMISSIONS FOUNDATION
   ---------------------------------------------------------
   ASSIGNMENTS
   1. Assignment workspace state
   2. Class/status helpers
   3. Submission/completion metrics
   4. Filtering
   5. Existing filter hydration
   6. Existing assignment-card design
   7. Refresh behavior

   SUBMISSIONS
   8. Submission workspace state
   9. Student/assignment/class helpers
   10. Late/review status
   11. Filtering
   12. Existing submission-card design
   13. Refresh behavior
   14. Workspace initialization

   IMPORTANT
   ---------------------------------------------------------
   This part DOES NOT implement grading writes yet.

   Review/grade/return operations belong to the dedicated
   Grading + Kabezya section so one authoritative review flow
   controls those mutations.
========================================================= */


/* =========================================================
   ASSIGNMENT WORKSPACE STATE
========================================================= */

const teacherAssignmentWorkspaceState = {

  search:
    "",

  classId:
    "",

  status:
    "",

  selectedAssignmentId:
    "",

  editingAssignmentId:
    "",

  refreshing:
    false,

  saving:
    false,

  initialized:
    false

};


/* =========================================================
   SUBMISSION WORKSPACE STATE
========================================================= */

const teacherSubmissionWorkspaceState = {

  search:
    "",

  classId:
    "",

  status:
    "",

  selectedSubmissionId:
    "",

  refreshing:
    false,

  initialized:
    false

};


/* =========================================================
   ASSIGNMENT CLASS

   Returns a real assigned-class record whenever possible.
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

    const classId =
      normalizeId(
        classValue._id ||
        classValue.id
      );


    return (
      getTeacherClassById(
        classId
      ) ||
      classValue
    );

  }


  return (
    getTeacherClassById(
      classValue
    ) ||
    null
  );

}


/* =========================================================
   ASSIGNMENT DISPLAY STATUS

   normalizeAssignmentStatus() was defined in Part 1.

   Existing assignment CSS supports:
   draft
   published
   closed

   "active" therefore displays as published without changing
   the underlying database record.
========================================================= */

function getTeacherAssignmentDisplayStatus(
  assignment
){

  const status =
    normalizeAssignmentStatus(
      assignment?.status
    );


  if (
    status ===
    "active"
  ){

    return "published";

  }


  if (
    status ===
    "archived"
  ){

    return "closed";

  }


  return status;

}


/* =========================================================
   ASSIGNMENT STATUS LABEL
========================================================= */

function getTeacherAssignmentStatusLabel(
  assignment
){

  switch(
    getTeacherAssignmentDisplayStatus(
      assignment
    )
  ){

    case "draft":

      return "Draft";

    case "published":

      return "Published";

    case "closed":

      return "Closed";

    default:

      return "Published";

  }

}


/* =========================================================
   ASSIGNMENT SUBMISSIONS
========================================================= */

function getTeacherAssignmentSubmissions(
  assignmentId
){

  const normalizedAssignmentId =
    normalizeId(
      assignmentId
    );


  if (
    !normalizedAssignmentId
  ){

    return [];

  }


  return getTeacherSubmissions()
    .filter(
      submission =>
        sameId(
          submission
            ?.assignmentId
            ?._id ||
          submission
            ?.assignmentId,
          normalizedAssignmentId
        )
    );

}


/* =========================================================
   ASSIGNMENT PENDING REVIEW
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
   EXPECTED ASSIGNMENT STUDENTS
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


  const submittedStudents =
    new Set();


  getTeacherAssignmentSubmissions(
    assignmentId
  )
    .forEach(
      submission => {

        const studentId =
          normalizeId(
            submission
              ?.studentId
              ?._id ||
            submission
              ?.studentId
          );


        if (
          studentId
        ){

          submittedStudents.add(
            studentId
          );

        }

      }
    );


  return clampPercentage(
    (
      submittedStudents.size /
      expected
    ) *
    100
  );

}


/* =========================================================
   ASSIGNMENT OVERDUE
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


  const validDate =
    toValidDate(
      dueDate
    );


  if (
    !validDate
  ){

    return false;

  }


  const status =
    getTeacherAssignmentDisplayStatus(
      assignment
    );


  if (
    [
      "draft",
      "closed"
    ].includes(
      status
    )
  ){

    return false;

  }


  return (
    validDate.getTime() <
    Date.now()
  );

}


/* =========================================================
   ASSIGNMENT DESCRIPTION
========================================================= */

function getTeacherAssignmentDescription(
  assignment
){

  return safeString(

    assignment?.description ||
    assignment?.instructions,

    ""

  );

}


/* =========================================================
   FILTER ASSIGNMENTS
========================================================= */

function getFilteredTeacherAssignments(){

  const search =
    safeString(
      teacherAssignmentWorkspaceState
        .search
    )
      .toLowerCase();

  const classId =
    normalizeId(
      teacherAssignmentWorkspaceState
        .classId
    );

  const status =
    safeString(
      teacherAssignmentWorkspaceState
        .status
    )
      .toLowerCase();


  let assignments = [
    ...getTeacherAssignments()
  ];


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

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

              getTeacherAssignmentDescription(
                assignment
              ),

              getTeacherClassTitle(
                classItem ||
                {}
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


  /* -------------------------------------------------------
     CLASS
  ------------------------------------------------------- */

  if (
    classId
  ){

    assignments =
      assignments.filter(
        assignment =>
          sameId(
            assignment
              ?.classId
              ?._id ||
            assignment
              ?.classId,
            classId
          )
      );

  }


  /* -------------------------------------------------------
     STATUS
  ------------------------------------------------------- */

  if (
    status
  ){

    assignments =
      assignments.filter(
        assignment =>
          getTeacherAssignmentDisplayStatus(
            assignment
          ) ===
          status
      );

  }


  /* -------------------------------------------------------
     ORDER

     Current teacher.html has no assignment sort dropdown.
     Upcoming deadlines first, then newest assignments.
  ------------------------------------------------------- */

  assignments.sort(
    (
      first,
      second
    ) => {

      const firstDue =
        toValidDate(
          getTeacherAssignmentDueDate(
            first
          )
        );

      const secondDue =
        toValidDate(
          getTeacherAssignmentDueDate(
            second
          )
        );


      if (
        firstDue &&
        secondDue
      ){

        return (
          firstDue.getTime() -
          secondDue.getTime()
        );

      }


      if (
        firstDue
      ){

        return -1;

      }


      if (
        secondDue
      ){

        return 1;

      }


      return (
        (
          toValidDate(
            second?.updatedAt ||
            second?.createdAt
          )?.getTime() ||
          0
        ) -
        (
          toValidDate(
            first?.updatedAt ||
            first?.createdAt
          )?.getTime() ||
          0
        )
      );

    }
  );


  return assignments;

}


/* =========================================================
   ASSIGNMENT CLASS FILTER
========================================================= */

function renderTeacherAssignmentClassFilter(){

  const select =
    $(
      "teacherAssignmentClassFilter"
    );


  if (
    !select
  ){

    return;

  }


  const selectedValue =
    teacherAssignmentWorkspaceState
      .classId;


  select.innerHTML = `
    <option value="">
      All classes
    </option>

    ${
      getTeacherClasses()
        .map(
          classItem => {

            const classId =
              normalizeId(
                classItem?._id ||
                classItem?.id
              );


            return `
              <option
                value="${escapeAttribute(classId)}"
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
  `;


  select.value =
    selectedValue;


  if (
    select.value !==
    selectedValue
  ){

    teacherAssignmentWorkspaceState
      .classId =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   ASSIGNMENT STATUS FILTER
========================================================= */

function renderTeacherAssignmentStatusFilter(){

  const select =
    $(
      "teacherAssignmentStatusFilter"
    );


  if (
    !select
  ){

    return;

  }


  select.value =
    teacherAssignmentWorkspaceState
      .status;


  if (
    select.value !==
    teacherAssignmentWorkspaceState
      .status
  ){

    teacherAssignmentWorkspaceState
      .status =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   ASSIGNMENT FILTER STATE
========================================================= */

function renderTeacherAssignmentFilters(){

  const search =
    $(
      "teacherAssignmentSearch"
    );


  if (
    search &&
    search.value !==
      teacherAssignmentWorkspaceState
        .search
  ){

    search.value =
      teacherAssignmentWorkspaceState
        .search;

  }


  renderTeacherAssignmentClassFilter();

  renderTeacherAssignmentStatusFilter();

}


/* =========================================================
   ASSIGNMENTS COUNT
========================================================= */

function renderTeacherAssignmentsCount(){

  const allAssignments =
    getTeacherAssignments();

  const filteredAssignments =
    getFilteredTeacherAssignments();

  const hasFilters =
    Boolean(

      teacherAssignmentWorkspaceState
        .search ||

      teacherAssignmentWorkspaceState
        .classId ||

      teacherAssignmentWorkspaceState
        .status

    );


  setText(

    "teacherAssignmentsCount",

    hasFilters
      ? `${filteredAssignments.length} of ${allAssignments.length} ${
          allAssignments.length ===
          1
            ? "assignment"
            : "assignments"
        }`
      : `${allAssignments.length} ${
          allAssignments.length ===
          1
            ? "assignment"
            : "assignments"
        }`

  );

}


/* =========================================================
   ASSIGNMENTS EMPTY STATE
========================================================= */

function renderTeacherAssignmentsEmptyState(
  assignments
){

  const empty =
    $(
      "teacherAssignmentsEmpty"
    );


  if (
    !empty
  ){

    return;

  }


  const hasAssignments =
    getTeacherAssignments()
      .length >
    0;

  const hasResults =
    assignments.length >
    0;

  const hasFilters =
    Boolean(

      teacherAssignmentWorkspaceState
        .search ||

      teacherAssignmentWorkspaceState
        .classId ||

      teacherAssignmentWorkspaceState
        .status

    );


  empty.hidden =
    hasResults;


  if (
    hasResults
  ){

    return;

  }


  const heading =
    empty.querySelector(
      "h2"
    );

  const description =
    empty.querySelector(
      "p"
    );


  if (
    !hasAssignments
  ){

    if (
      heading
    ){

      heading.textContent =
        "No assignments yet";

    }


    if (
      description
    ){

      description.textContent =
        "Create your first assignment for one of your assigned classes.";

    }


    return;

  }


  if (
    hasFilters
  ){

    if (
      heading
    ){

      heading.textContent =
        "No assignments found";

    }


    if (
      description
    ){

      description.textContent =
        "No assignments match the current search or filters.";

    }

  }

}


/* =========================================================
   ASSIGNMENT CARD
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

  const title =
    getTeacherAssignmentTitle(
      assignment
    );

  const description =
    getTeacherAssignmentDescription(
      assignment
    );

  const classTitle =
    getTeacherClassTitle(
      classItem ||
      {}
    );

  const status =
    getTeacherAssignmentDisplayStatus(
      assignment
    );

  const statusLabel =
    getTeacherAssignmentStatusLabel(
      assignment
    );

  const dueDate =
    toValidDate(
      getTeacherAssignmentDueDate(
        assignment
      )
    );

  const overdue =
    isTeacherAssignmentOverdue(
      assignment
    );

  const expected =
    getTeacherAssignmentExpectedStudents(
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

  const completion =
    getTeacherAssignmentCompletionRate(
      assignment
    );


  return `
    <article
      class="teacher-assignment-card"
      data-assignment-id="${escapeAttribute(assignmentId)}"
    >

      <div
        class="teacher-assignment-card-top"
      >

        <span
          class="teacher-assignment-type"
        >
          <i
            class="fa-regular fa-file-lines"
            aria-hidden="true"
          ></i>

          Assignment
        </span>


        <span
          class="teacher-assignment-status ${escapeAttribute(status)}"
        >
          ${escapeHtml(statusLabel)}
        </span>

      </div>


      <h3
        class="teacher-assignment-title"
        title="${escapeAttribute(title)}"
      >
        ${escapeHtml(title)}
      </h3>


      ${
        description
          ? `
            <p
              class="teacher-assignment-description"
            >
              ${escapeHtml(description)}
            </p>
          `
          : ""
      }


      <div
        class="teacher-assignment-class"
      >
        <i
          class="fa-solid fa-chalkboard-user"
          aria-hidden="true"
        ></i>

        <span>
          ${escapeHtml(classTitle)}
        </span>
      </div>


      <div
        class="teacher-assignment-details"
      >

        <div
          class="teacher-assignment-detail"
        >
          <strong>
            ${expected}
          </strong>

          <span>
            Students
          </span>
        </div>


        <div
          class="teacher-assignment-detail"
        >
          <strong>
            ${submissions}
          </strong>

          <span>
            Submitted
          </span>
        </div>


        <div
          class="teacher-assignment-detail"
        >
          <strong>
            ${pending}
          </strong>

          <span>
            To review
          </span>
        </div>

      </div>


      <div
        class="teacher-assignment-due ${
          overdue
            ? "overdue"
            : ""
        }"
      >
        <i
          class="fa-regular fa-calendar"
          aria-hidden="true"
        ></i>

        <span>
          ${
            dueDate
              ? `${
                  overdue
                    ? "Overdue"
                    : "Due"
                } ${escapeHtml(
                  formatDate(
                    dueDate
                  )
                )}`
              : "No deadline"
          }
        </span>
      </div>


      <div
        class="teacher-assignment-submissions"
      >

        <div
          class="teacher-assignment-submissions-header"
        >
          <span>
            Submission progress
          </span>

          <strong>
            ${completion}%
          </strong>
        </div>


        <div
          class="teacher-assignment-progress"
          role="progressbar"
          aria-label="Submission progress"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${completion}"
        >
          <div
            class="teacher-assignment-progress-fill"
            style="width:${completion}%"
          ></div>
        </div>

      </div>


      <div
        class="teacher-assignment-actions"
      >

        <button
          type="button"
          class="teacher-assignment-action"
          data-teacher-action="edit-assignment"
          data-assignment-id="${escapeAttribute(assignmentId)}"
        >
          <i
            class="fa-regular fa-pen-to-square"
            aria-hidden="true"
          ></i>

          Edit
        </button>


        <button
          type="button"
          class="teacher-assignment-action primary"
          data-teacher-action="assignment-submissions"
          data-assignment-id="${escapeAttribute(assignmentId)}"
        >
          <i
            class="fa-solid fa-file-circle-check"
            aria-hidden="true"
          ></i>

          Review Work
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   RENDER ASSIGNMENTS GRID
========================================================= */

function renderTeacherAssignmentsGrid(){

  const grid =
    $(
      "teacherAssignmentsGrid"
    );


  if (
    !grid
  ){

    return;

  }


  const assignments =
    getFilteredTeacherAssignments();


  renderTeacherAssignmentsCount();

  renderTeacherAssignmentsEmptyState(
    assignments
  );


  if (
    !assignments.length
  ){

    grid.innerHTML =
      "";

    grid.hidden =
      true;

    return;

  }


  grid.hidden =
    false;


  grid.innerHTML =
    assignments
      .map(
        createTeacherAssignmentCard
      )
      .join(
        ""
      );

}


/* =========================================================
   RENDER ASSIGNMENTS WORKSPACE
========================================================= */

function renderTeacherAssignmentsWorkspace(){

  renderTeacherAssignmentFilters();

  renderTeacherAssignmentsGrid();

}


/* =========================================================
   ASSIGNMENT SEARCH
========================================================= */

function handleTeacherAssignmentSearchInput(
  event
){

  teacherAssignmentWorkspaceState
    .search =
    safeString(
      event?.target?.value
    );


  renderTeacherAssignmentsGrid();

}


/* =========================================================
   ASSIGNMENT CLASS FILTER
========================================================= */

function handleTeacherAssignmentClassChange(
  event
){

  teacherAssignmentWorkspaceState
    .classId =
    normalizeId(
      event?.target?.value
    );


  renderTeacherAssignmentsGrid();

}


/* =========================================================
   ASSIGNMENT STATUS FILTER
========================================================= */

function handleTeacherAssignmentStatusChange(
  event
){

  teacherAssignmentWorkspaceState
    .status =
    safeString(
      event?.target?.value
    );


  renderTeacherAssignmentsGrid();

}


/* =========================================================
   REFRESH ASSIGNMENTS
========================================================= */

async function refreshTeacherAssignmentsWorkspace(){

  if (
    teacherAssignmentWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherAssignmentWorkspaceState
    .refreshing =
    true;


  const buttons =
    $all(
      '[data-teacher-action="refresh-assignments"]'
    );


  buttons.forEach(
    button => {

      button.disabled =
        true;

      button.setAttribute(
        "aria-busy",
        "true"
      );

    }
  );


  try{

    const results =
      await Promise.allSettled([

        loadTeacherAssignments(),

        loadTeacherSubmissions()

      ]);


    results.forEach(
      (
        result,
        index
      ) => {

        if (
          result.status ===
          "rejected"
        ){

          reportOptionalRequestError(
            [
              "Assignments",
              "Submissions"
            ][index],
            result.reason
          );

        }

      }
    );


    finalizeTeacherLoadedData();


    renderTeacherAssignmentsWorkspace();

    renderTeacherOverviewAssignments();

    renderTeacherDashboardStats();


    notifyAIFTSuccess(
      "Assignments are up to date.",
      {
        title:
          "Assignments refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Assignments could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherAssignmentWorkspaceState
      .refreshing =
      false;


    buttons.forEach(
      button => {

        button.disabled =
          false;

        button.setAttribute(
          "aria-busy",
          "false"
        );

      }
    );

  }

}


/* =========================================================
   INITIALIZE ASSIGNMENTS WORKSPACE
========================================================= */

function initializeTeacherAssignmentsWorkspace(){

  if (
    teacherAssignmentWorkspaceState
      .initialized
  ){

    renderTeacherAssignmentsWorkspace();

    return;

  }


  teacherAssignmentWorkspaceState
    .initialized =
    true;


  const search =
    $(
      "teacherAssignmentSearch"
    );

  const classFilter =
    $(
      "teacherAssignmentClassFilter"
    );

  const statusFilter =
    $(
      "teacherAssignmentStatusFilter"
    );


  if (
    search
  ){

    search.oninput =
      handleTeacherAssignmentSearchInput;

  }


  if (
    classFilter
  ){

    classFilter.onchange =
      handleTeacherAssignmentClassChange;

  }


  if (
    statusFilter
  ){

    statusFilter.onchange =
      handleTeacherAssignmentStatusChange;

  }


  renderTeacherAssignmentsWorkspace();

}


/* =========================================================
   SUBMISSION ID
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
   SUBMISSION STUDENT
========================================================= */

function getTeacherSubmissionStudent(
  submission
){

  const value =
    submission?.studentId;


  if (
    value &&
    typeof value ===
      "object"
  ){

    return value;

  }


  const studentRecord =
    getTeacherStudentById(
      value
    );


  return (
    studentRecord?.student ||
    null
  );

}


/* =========================================================
   SUBMISSION ASSIGNMENT
========================================================= */

function getTeacherSubmissionAssignment(
  submission
){

  const value =
    submission?.assignmentId;


  if (
    value &&
    typeof value ===
      "object" &&
    (
      value.title ||
      value.dueDate
    )
  ){

    const assignmentId =
      normalizeId(
        value._id ||
        value.id
      );


    return (
      getTeacherAssignments()
        .find(
          assignment =>
            sameId(
              assignment?._id ||
              assignment?.id,
              assignmentId
            )
        ) ||
      value
    );

  }


  return (
    getTeacherAssignments()
      .find(
        assignment =>
          sameId(
            assignment?._id ||
            assignment?.id,
            value
          )
      ) ||
    null
  );

}


/* =========================================================
   SUBMISSION CLASS
========================================================= */

function getTeacherSubmissionClass(
  submission
){

  const classValue =
    submission?.classId;


  if (
    classValue &&
    typeof classValue ===
      "object"
  ){

    return (
      getTeacherClassById(
        classValue._id ||
        classValue.id
      ) ||
      classValue
    );

  }


  return (
    getTeacherClassById(
      classValue
    ) ||
    null
  );

}


/* =========================================================
   SUBMISSION DATE
========================================================= */

function getTeacherSubmissionDate(
  submission
){

  return toValidDate(

    submission?.submittedAt ||
    submission?.createdAt

  );

}


/* =========================================================
   SUBMISSION LATE STATUS

   Calculated from actual assignment due date and submission
   timestamp.

   No database status is modified.
========================================================= */

function isTeacherSubmissionLate(
  submission
){

  const assignment =
    getTeacherSubmissionAssignment(
      submission
    );


  if (
    !assignment
  ){

    return false;

  }


  const dueDate =
    toValidDate(
      getTeacherAssignmentDueDate(
        assignment
      )
    );

  const submittedAt =
    getTeacherSubmissionDate(
      submission
    );


  if (
    !dueDate ||
    !submittedAt
  ){

    return false;

  }


  return (
    submittedAt.getTime() >
    dueDate.getTime()
  );

}


/* =========================================================
   SUBMISSION DISPLAY STATUS

   HTML supports:
   submitted
   reviewed
   needs-review
   late

   "needs-review" is a UI classification for pending review;
   it does not mutate submission.status.
========================================================= */

function getTeacherSubmissionDisplayStatus(
  submission
){

  const status =
    normalizeSubmissionStatus(
      submission?.status
    );


  if (
    isTeacherSubmissionLate(
      submission
    ) &&
    ![
      "reviewed",
      "graded",
      "returned"
    ].includes(
      status
    )
  ){

    return "late";

  }


  if (
    [
      "reviewed",
      "graded",
      "returned"
    ].includes(
      status
    )
  ){

    return "reviewed";

  }


  if (
    status ===
    "pending"
  ){

    return "needs-review";

  }


  return "submitted";

}


/* =========================================================
   SUBMISSION DISPLAY LABEL
========================================================= */

function getTeacherSubmissionStatusLabel(
  submission
){

  switch(
    getTeacherSubmissionDisplayStatus(
      submission
    )
  ){

    case "reviewed":

      return "Reviewed";

    case "needs-review":

      return "Needs review";

    case "late":

      return "Late";

    default:

      return "Submitted";

  }

}


/* =========================================================
   FILTER SUBMISSIONS
========================================================= */

function getFilteredTeacherSubmissions(){

  const search =
    safeString(
      teacherSubmissionWorkspaceState
        .search
    )
      .toLowerCase();

  const classId =
    normalizeId(
      teacherSubmissionWorkspaceState
        .classId
    );

  const status =
    safeString(
      teacherSubmissionWorkspaceState
        .status
    )
      .toLowerCase();


  let submissions = [
    ...getTeacherSubmissions()
  ];


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

              student?.name,
              student?.fullName,
              student?.email,

              assignment?.title,

              getTeacherClassTitle(
                classItem ||
                {}
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
    classId
  ){

    submissions =
      submissions.filter(
        submission =>
          sameId(
            submission
              ?.classId
              ?._id ||
            submission
              ?.classId,
            classId
          )
      );

  }


  if (
    status
  ){

    submissions =
      submissions.filter(
        submission => {

          const displayStatus =
            getTeacherSubmissionDisplayStatus(
              submission
            );

          const rawStatus =
            normalizeSubmissionStatus(
              submission?.status
            );


          /*
            "Submitted" means the actual submitted state.
            "Needs review" includes any unresolved submission.
            This intentionally allows a submitted record to
            appear under Needs review when appropriate.
          */

          if (
            status ===
            "needs-review"
          ){

            return [
              "submitted",
              "pending"
            ].includes(
              rawStatus
            );

          }


          if (
            status ===
            "submitted"
          ){

            return rawStatus ===
              "submitted";

          }


          return displayStatus ===
            status;

        }
      );

  }


  submissions.sort(
    (
      first,
      second
    ) =>
      (
        getTeacherSubmissionDate(
          second
        )?.getTime() ||
        0
      ) -
      (
        getTeacherSubmissionDate(
          first
        )?.getTime() ||
        0
      )
  );


  return submissions;

}


/* =========================================================
   SUBMISSION CLASS FILTER
========================================================= */

function renderTeacherSubmissionClassFilter(){

  const select =
    $(
      "teacherSubmissionClassFilter"
    );


  if (
    !select
  ){

    return;

  }


  const selectedValue =
    teacherSubmissionWorkspaceState
      .classId;


  select.innerHTML = `
    <option value="">
      All classes
    </option>

    ${
      getTeacherClasses()
        .map(
          classItem => {

            const classId =
              normalizeId(
                classItem?._id ||
                classItem?.id
              );


            return `
              <option
                value="${escapeAttribute(classId)}"
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
  `;


  select.value =
    selectedValue;


  if (
    select.value !==
    selectedValue
  ){

    teacherSubmissionWorkspaceState
      .classId =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   SUBMISSION STATUS FILTER
========================================================= */

function renderTeacherSubmissionStatusFilter(){

  const select =
    $(
      "teacherSubmissionStatusFilter"
    );


  if (
    !select
  ){

    return;

  }


  select.value =
    teacherSubmissionWorkspaceState
      .status;


  if (
    select.value !==
    teacherSubmissionWorkspaceState
      .status
  ){

    teacherSubmissionWorkspaceState
      .status =
      "";

    select.value =
      "";

  }

}


/* =========================================================
   SUBMISSION FILTER STATE
========================================================= */

function renderTeacherSubmissionFilters(){

  const search =
    $(
      "teacherSubmissionSearch"
    );


  if (
    search &&
    search.value !==
      teacherSubmissionWorkspaceState
        .search
  ){

    search.value =
      teacherSubmissionWorkspaceState
        .search;

  }


  renderTeacherSubmissionClassFilter();

  renderTeacherSubmissionStatusFilter();

}


/* =========================================================
   SUBMISSIONS COUNT
========================================================= */

function renderTeacherSubmissionsCount(){

  const allSubmissions =
    getTeacherSubmissions();

  const filteredSubmissions =
    getFilteredTeacherSubmissions();

  const hasFilters =
    Boolean(

      teacherSubmissionWorkspaceState
        .search ||

      teacherSubmissionWorkspaceState
        .classId ||

      teacherSubmissionWorkspaceState
        .status

    );


  setText(

    "teacherSubmissionsCount",

    hasFilters
      ? `${filteredSubmissions.length} of ${allSubmissions.length} ${
          allSubmissions.length === 1
            ? "submission"
            : "submissions"
        }`
      : `${allSubmissions.length} ${
          allSubmissions.length === 1
            ? "submission"
            : "submissions"
        }`

  );

}


/* =========================================================
   SUBMISSION EMPTY STATE
========================================================= */

function renderTeacherSubmissionsEmptyState(
  submissions
){

  const empty =
    $(
      "teacherSubmissionsEmpty"
    );


  if (
    !empty
  ){

    return;

  }


  const hasSubmissions =
    getTeacherSubmissions()
      .length >
    0;

  const hasResults =
    submissions.length >
    0;


  empty.hidden =
    hasResults;


  if (
    hasResults
  ){

    return;

  }


  const heading =
    empty.querySelector(
      "h2"
    );

  const description =
    empty.querySelector(
      "p"
    );


  if (
    !hasSubmissions
  ){

    if (
      heading
    ){

      heading.textContent =
        "No submissions yet";

    }


    if (
      description
    ){

      description.textContent =
        "Student submissions will appear here when work is submitted.";

    }


    return;

  }


  if (
    heading
  ){

    heading.textContent =
      "No submissions found";

  }


  if (
    description
  ){

    description.textContent =
      "No student work matches the current search or filters.";

  }

}


/* =========================================================
   SUBMISSION STUDENT NAME
========================================================= */

function getTeacherSubmissionStudentName(
  submission
){

  const student =
    getTeacherSubmissionStudent(
      submission
    );


  return safeString(

    student?.name ||
    student?.fullName ||
    student?.displayName,

    "Student"

  );

}


/* =========================================================
   SUBMISSION STUDENT AVATAR
========================================================= */

function getTeacherSubmissionStudentAvatar(
  submission
){

  const student =
    getTeacherSubmissionStudent(
      submission
    );


  return getSafeImageUrl(

    student?.profileImage ||
    student?.avatar ||
    student?.photoURL,

    FALLBACK_AVATAR

  );

}


/* =========================================================
   SUBMISSION INITIALS
========================================================= */

function getTeacherSubmissionStudentInitials(
  submission
){

  const name =
    getTeacherSubmissionStudentName(
      submission
    );


  return (
    name
      .split(
        /\s+/
      )
      .filter(
        Boolean
      )
      .slice(
        0,
        2
      )
      .map(
        part =>
          part.charAt(
            0
          ).toUpperCase()
      )
      .join(
        ""
      ) ||
    "S"
  );

}


/* =========================================================
   SUBMISSION CARD
========================================================= */

function createTeacherSubmissionCard(
  submission
){

  const submissionId =
    getTeacherSubmissionId(
      submission
    );

  const studentName =
    getTeacherSubmissionStudentName(
      submission
    );

  const studentAvatar =
    getTeacherSubmissionStudentAvatar(
      submission
    );

  const initials =
    getTeacherSubmissionStudentInitials(
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

  const assignmentTitle =
    safeString(
      assignment?.title,
      "Assignment"
    );

  const classTitle =
    getTeacherClassTitle(
      classItem ||
      {}
    );

  const submissionDate =
    getTeacherSubmissionDate(
      submission
    );

  const status =
    getTeacherSubmissionDisplayStatus(
      submission
    );

  const statusLabel =
    getTeacherSubmissionStatusLabel(
      submission
    );

  const grade =
    Number.isFinite(
      Number(
        submission?.grade
      )
    )
      ? Number(
          submission.grade
        )
      : null;


  return `
    <article
      class="teacher-submission-card"
      data-submission-id="${escapeAttribute(submissionId)}"
    >

      <div
        class="teacher-submission-avatar"
        aria-hidden="true"
      >
        <span>
          ${escapeHtml(initials)}
        </span>

        <img
          src="${escapeAttribute(studentAvatar)}"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
        />
      </div>


      <div
        class="teacher-submission-main"
      >

        <h3
          class="teacher-submission-title"
          title="${escapeAttribute(assignmentTitle)}"
        >
          ${escapeHtml(assignmentTitle)}
        </h3>


        <p
          class="teacher-submission-student"
        >
          ${escapeHtml(studentName)}
        </p>


        <p
          class="teacher-submission-class"
        >
          ${escapeHtml(classTitle)}
        </p>


        <div
          class="teacher-submission-meta"
        >

          <span
            class="teacher-submission-meta-item"
          >
            <i
              class="fa-regular fa-clock"
              aria-hidden="true"
            ></i>

            ${
              submissionDate
                ? escapeHtml(
                    formatDateTime(
                      submissionDate
                    )
                  )
                : "No submission time"
            }
          </span>


          ${
            grade !==
            null
              ? `
                <span
                  class="teacher-submission-meta-item"
                >
                  <i
                    class="fa-solid fa-graduation-cap"
                    aria-hidden="true"
                  ></i>

                  Grade:
                  ${escapeHtml(grade)}
                </span>
              `
              : ""
          }


          <span
            class="teacher-submission-status ${escapeAttribute(status)}"
          >
            ${escapeHtml(statusLabel)}
          </span>

        </div>

      </div>


      <div
        class="teacher-submission-actions"
      >

        <button
          type="button"
          class="teacher-submission-action ai"
          data-teacher-action="kabezya-review-submission"
          data-submission-id="${escapeAttribute(submissionId)}"
          title="Inspect with Kabezya AI"
        >
          <i
            class="fa-solid fa-wand-magic-sparkles"
            aria-hidden="true"
          ></i>

          AI Review
        </button>


        <button
          type="button"
          class="teacher-submission-action primary"
          data-teacher-action="review-submission"
          data-submission-id="${escapeAttribute(submissionId)}"
        >
          <i
            class="fa-solid fa-pen-to-square"
            aria-hidden="true"
          ></i>

          ${
            status ===
            "reviewed"
              ? "View"
              : "Review"
          }
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   SUBMISSION IMAGE FALLBACKS
========================================================= */

function bindTeacherSubmissionImageFallbacks(){

  const list =
    $(
      "teacherSubmissionsList"
    );


  if (
    !list
  ){

    return;

  }


  list
    .querySelectorAll(
      ".teacher-submission-avatar img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            image.onerror =
              null;

            image.hidden =
              true;

          };

      }
    );

}


/* =========================================================
   RENDER SUBMISSIONS LIST
========================================================= */

function renderTeacherSubmissionsList(){

  const list =
    $(
      "teacherSubmissionsList"
    );


  if (
    !list
  ){

    return;

  }


  const submissions =
    getFilteredTeacherSubmissions();


  renderTeacherSubmissionsCount();

  renderTeacherSubmissionsEmptyState(
    submissions
  );


  if (
    !submissions.length
  ){

    list.innerHTML =
      "";

    list.hidden =
      true;

    return;

  }


  list.hidden =
    false;


  list.innerHTML =
    submissions
      .map(
        createTeacherSubmissionCard
      )
      .join(
        ""
      );


  bindTeacherSubmissionImageFallbacks();

}


/* =========================================================
   RENDER SUBMISSIONS WORKSPACE
========================================================= */

function renderTeacherSubmissionsWorkspace(){

  renderTeacherSubmissionFilters();

  renderTeacherSubmissionsList();

}


/* =========================================================
   SUBMISSION SEARCH
========================================================= */

function handleTeacherSubmissionSearchInput(
  event
){

  teacherSubmissionWorkspaceState
    .search =
    safeString(
      event?.target?.value
    );


  renderTeacherSubmissionsList();

}


/* =========================================================
   SUBMISSION CLASS FILTER
========================================================= */

function handleTeacherSubmissionClassChange(
  event
){

  teacherSubmissionWorkspaceState
    .classId =
    normalizeId(
      event?.target?.value
    );


  renderTeacherSubmissionsList();

}


/* =========================================================
   SUBMISSION STATUS FILTER
========================================================= */

function handleTeacherSubmissionStatusChange(
  event
){

  teacherSubmissionWorkspaceState
    .status =
    safeString(
      event?.target?.value
    );


  renderTeacherSubmissionsList();

}


/* =========================================================
   APPLY ASSIGNMENT FILTER TO SUBMISSIONS

   Used later when a teacher clicks Review Work on one
   assignment.

   This does not navigate yet. The central router will perform
   navigation and then call this helper.
========================================================= */

function filterTeacherSubmissionsByAssignment(
  assignmentId
){

  const normalizedAssignmentId =
    normalizeId(
      assignmentId
    );


  if (
    !normalizedAssignmentId
  ){

    return;

  }


  const assignment =
    getTeacherAssignments()
      .find(
        item =>
          sameId(
            item?._id ||
            item?.id,
            normalizedAssignmentId
          )
      );


  if (
    assignment
  ){

    teacherSubmissionWorkspaceState
      .classId =
      normalizeId(
        assignment
          ?.classId
          ?._id ||
        assignment
          ?.classId
      );

  }


  /*
    The assignment itself is retained separately because
    teacher.html currently provides no assignment dropdown in
    the Submission toolbar.
  */

  teacherAssignmentWorkspaceState
    .selectedAssignmentId =
    normalizedAssignmentId;

}


/* =========================================================
   REFRESH SUBMISSIONS
========================================================= */

async function refreshTeacherSubmissionsWorkspace(){

  if (
    teacherSubmissionWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherSubmissionWorkspaceState
    .refreshing =
    true;


  const buttons =
    $all(
      '[data-teacher-action="refresh-submissions"]'
    );


  buttons.forEach(
    button => {

      button.disabled =
        true;

      button.setAttribute(
        "aria-busy",
        "true"
      );

    }
  );


  try{

    await loadTeacherSubmissions();


    finalizeTeacherLoadedData();


    renderTeacherSubmissionsWorkspace();

    renderTeacherAssignmentsGrid();

    renderTeacherOverviewAssignments();

    renderTeacherOverviewActivity();

    renderTeacherDashboardStats();

    renderTeacherGradingBadge();


    notifyAIFTSuccess(
      "Student work is up to date.",
      {
        title:
          "Submissions refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Student submissions could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherSubmissionWorkspaceState
      .refreshing =
      false;


    buttons.forEach(
      button => {

        button.disabled =
          false;

        button.setAttribute(
          "aria-busy",
          "false"
        );

      }
    );

  }

}


/* =========================================================
   INITIALIZE SUBMISSIONS WORKSPACE
========================================================= */

function initializeTeacherSubmissionsWorkspace(){

  if (
    teacherSubmissionWorkspaceState
      .initialized
  ){

    renderTeacherSubmissionsWorkspace();

    return;

  }


  teacherSubmissionWorkspaceState
    .initialized =
    true;


  const search =
    $(
      "teacherSubmissionSearch"
    );

  const classFilter =
    $(
      "teacherSubmissionClassFilter"
    );

  const statusFilter =
    $(
      "teacherSubmissionStatusFilter"
    );


  if (
    search
  ){

    search.oninput =
      handleTeacherSubmissionSearchInput;

  }


  if (
    classFilter
  ){

    classFilter.onchange =
      handleTeacherSubmissionClassChange;

  }


  if (
    statusFilter
  ){

    statusFilter.onchange =
      handleTeacherSubmissionStatusChange;

  }


  renderTeacherSubmissionsWorkspace();

}


/* =========================================================
   REFRESH BOTH WORKSPACES FROM CURRENT STATE
========================================================= */

function refreshTeacherAssignmentAndSubmissionViews(){

  renderTeacherAssignmentsWorkspace();

  renderTeacherSubmissionsWorkspace();

}


/* =========================================================
   PART 6 COMPLETE

   CURRENT teacher.html DESIGN REMAINS AUTHORITATIVE.

   No duplicate pages were generated.
   No grade write was implemented twice.
   No Kabezya result was invented.
   No assignment editor modal was guessed.
   No direct navigation was hardcoded.

   CENTRAL ACTION CONTROLLER WILL LATER HANDLE:

   refresh-assignments
   create-assignment
   edit-assignment
   assignment-submissions

   refresh-submissions
   review-submission
   kabezya-review-submission

   This lets Assignments, Submissions, Grading and AI share
   one authoritative action lifecycle.
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 7

   GRADING CENTER + REAL REVIEW LIFECYCLE
   ---------------------------------------------------------
   1. Grading workspace state
   2. Submission lookup
   3. Grading filters
   4. Grading header
   5. Grading toolbar
   6. Grading summary
   7. Submission queue
   8. Attachment handling
   9. Selected-submission viewer
   10. Review validation
   11. PATCH /api/submissions/:id/review
   12. State reconciliation after grade save
   13. Grading refresh
   14. Grading initialization

   IMPORTANT
   ---------------------------------------------------------
   Kabezya remains ADVISORY.

   No AI endpoint is guessed in this part.

   The existing AI controls will later connect to the actual
   verified Kabezya backend route.

   Only the teacher-controlled review endpoint writes grades.
========================================================= */


/* =========================================================
   GRADING WORKSPACE STATE
========================================================= */

const teacherGradingWorkspaceState = {

  classId:
    "",

  assignmentId:
    "",

  status:
    "submitted",

  search:
    "",

  selectedSubmissionId:
    "",

  saving:
    false,

  refreshing:
    false,

  initialized:
    false,

  kabezyaLoading:
    false,

  kabezyaSuggestion:
    null

};


/* =========================================================
   GET SUBMISSION BY ID
========================================================= */

function getTeacherSubmissionById(
  submissionId
){

  const normalizedSubmissionId =
    normalizeId(
      submissionId
    );


  if (
    !normalizedSubmissionId
  ){

    return null;

  }


  return (
    getTeacherSubmissions()
      .find(
        submission =>
          sameId(
            getTeacherSubmissionId(
              submission
            ),
            normalizedSubmissionId
          )
      ) ||
    null
  );

}


/* =========================================================
   SUBMISSION STUDENT ID
========================================================= */

function getTeacherSubmissionStudentId(
  submission
){

  return normalizeId(
    submission
      ?.studentId
      ?._id ||
    submission
      ?.studentId
  );

}


/* =========================================================
   SUBMISSION ASSIGNMENT ID
========================================================= */

function getTeacherSubmissionAssignmentId(
  submission
){

  return normalizeId(
    submission
      ?.assignmentId
      ?._id ||
    submission
      ?.assignmentId
  );

}


/* =========================================================
   SUBMISSION CLASS ID
========================================================= */

function getTeacherSubmissionClassId(
  submission
){

  return normalizeId(
    submission
      ?.classId
      ?._id ||
    submission
      ?.classId
  );

}


/* =========================================================
   GRADING NORMALIZED STATUS

   This is intentionally separate from the Submission page's
   visual status classification.

   Grading cares about actual review lifecycle:
     submitted
     reviewed
     returned
========================================================= */

function getTeacherGradingSubmissionStatus(
  submission
){

  const status =
    normalizeSubmissionStatus(
      submission?.status
    );


  if (
    [
      "reviewed",
      "graded"
    ].includes(
      status
    )
  ){

    return "reviewed";

  }


  if (
    status ===
    "returned"
  ){

    return "returned";

  }


  return "submitted";

}


/* =========================================================
   GRADING STATUS LABEL
========================================================= */

function getTeacherGradingStatusLabel(
  submission
){

  switch(
    getTeacherGradingSubmissionStatus(
      submission
    )
  ){

    case "reviewed":

      return "Reviewed";

    case "returned":

      return "Returned";

    default:

      return "Needs review";

  }

}


/* =========================================================
   GRADING ASSIGNMENTS FOR CURRENT CLASS
========================================================= */

function getTeacherGradingAssignments(){

  const classId =
    normalizeId(
      teacherGradingWorkspaceState
        .classId
    );


  let assignments = [
    ...getTeacherAssignments()
  ];


  if (
    classId
  ){

    assignments =
      assignments.filter(
        assignment =>
          sameId(
            assignment
              ?.classId
              ?._id ||
            assignment
              ?.classId,
            classId
          )
      );

  }


  return assignments.sort(
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

}


/* =========================================================
   FILTER GRADING SUBMISSIONS
========================================================= */

function getTeacherFilteredGradingSubmissions(){

  const classId =
    normalizeId(
      teacherGradingWorkspaceState
        .classId
    );

  const assignmentId =
    normalizeId(
      teacherGradingWorkspaceState
        .assignmentId
    );

  const status =
    safeString(
      teacherGradingWorkspaceState
        .status
    );

  const search =
    safeString(
      teacherGradingWorkspaceState
        .search
    )
      .toLowerCase();


  let submissions = [
    ...getTeacherSubmissions()
  ];


  /* -------------------------------------------------------
     CLASS FILTER
  ------------------------------------------------------- */

  if (
    classId
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


  /* -------------------------------------------------------
     ASSIGNMENT FILTER
  ------------------------------------------------------- */

  if (
    assignmentId
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


  /* -------------------------------------------------------
     REVIEW STATUS
  ------------------------------------------------------- */

  if (
    status &&
    status !==
    "all"
  ){

    submissions =
      submissions.filter(
        submission =>
          getTeacherGradingSubmissionStatus(
            submission
          ) ===
          status
      );

  }


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

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

              student?.name,
              student?.fullName,
              student?.displayName,
              student?.email,

              assignment?.title,

              getTeacherClassTitle(
                classItem ||
                {}
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


  /* -------------------------------------------------------
     QUEUE ORDER

     Needs-review work should feel chronological:
     oldest submitted work first.

     Reviewed/returned views show newest first.
  ------------------------------------------------------- */

  submissions.sort(
    (
      first,
      second
    ) => {

      const firstTime =
        getTeacherSubmissionDate(
          first
        )?.getTime() ||
        0;

      const secondTime =
        getTeacherSubmissionDate(
          second
        )?.getTime() ||
        0;


      if (
        status ===
        "submitted"
      ){

        return (
          firstTime -
          secondTime
        );

      }


      return (
        secondTime -
        firstTime
      );

    }
  );


  return submissions;

}


/* =========================================================
   GRADING SUMMARY
========================================================= */

function getTeacherGradingSummary(){

  const submissions =
    getTeacherSubmissions();


  return {

    total:
      submissions.length,

    submitted:
      submissions.filter(
        submission =>
          getTeacherGradingSubmissionStatus(
            submission
          ) ===
          "submitted"
      ).length,

    reviewed:
      submissions.filter(
        submission =>
          getTeacherGradingSubmissionStatus(
            submission
          ) ===
          "reviewed"
      ).length,

    returned:
      submissions.filter(
        submission =>
          getTeacherGradingSubmissionStatus(
            submission
          ) ===
          "returned"
      ).length

  };

}


/* =========================================================
   GRADING HEADER

   teacher.html intentionally leaves this area dynamic.
========================================================= */

function renderTeacherGradingHeader(){

  const container =
    $(
      "teacherGradingHeader"
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
          Grading Center
        </h1>

        <p>
          Review student work, provide feedback and manage grades across your assigned classes.
        </p>

      </div>


      <div
        class="teacher-workspace-heading-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-action="refresh-grading"
          ${
            teacherGradingWorkspaceState
              .refreshing
              ? "disabled"
              : ""
          }
        >
          <i
            class="fa-solid ${
              teacherGradingWorkspaceState
                .refreshing
                ? "fa-spinner fa-spin"
                : "fa-rotate"
            }"
            aria-hidden="true"
          ></i>

          <span>
            ${
              teacherGradingWorkspaceState
                .refreshing
                ? "Refreshing..."
                : "Refresh"
            }
          </span>
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   GRADING TOOLBAR
========================================================= */

function renderTeacherGradingToolbar(){

  const container =
    $(
      "teacherGradingToolbar"
    );


  if (
    !container
  ){

    return;

  }


  const assignments =
    getTeacherGradingAssignments();


  container.innerHTML = `

    <select
      id="teacherGradingClassFilter"
      class="teacher-workspace-select"
      aria-label="Filter grading by class"
    >

      <option value="">
        All classes
      </option>

      ${
        getTeacherClasses()
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeAttribute(classId)}"
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
      aria-label="Filter grading by assignment"
    >

      <option value="">
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
                  value="${escapeAttribute(assignmentId)}"
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
      aria-label="Filter grading by review status"
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
        aria-hidden="true"
      ></i>

      <input
        id="teacherGradingSearch"
        type="search"
        placeholder="Search student or assignment..."
        autocomplete="off"
        value="${escapeAttribute(
          teacherGradingWorkspaceState
            .search
        )}"
      />

    </div>
  `;


  bindTeacherGradingFilterControls();

}


/* =========================================================
   GRADING SUMMARY CARDS
========================================================= */

function renderTeacherGradingSummary(){

  const container =
    $(
      "teacherGradingSummary"
    );


  if (
    !container
  ){

    return;

  }


  const summary =
    getTeacherGradingSummary();


  container.innerHTML = `

    <article
      class="teacher-grading-summary-card"
    >
      <i
        class="fa-solid fa-file-lines"
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
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
        aria-hidden="true"
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
   GRADING QUEUE ITEM
========================================================= */

function createTeacherGradingQueueItem(
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

  const selected =
    sameId(
      teacherGradingWorkspaceState
        .selectedSubmissionId,
      submissionId
    );

  const studentName =
    safeString(

      student?.name ||
      student?.fullName ||
      student?.displayName,

      "Student"

    );

  const studentAvatar =
    getSafeImageUrl(

      student?.profileImage ||
      student?.avatar ||
      student?.photoURL,

      FALLBACK_AVATAR

    );

  const submittedAt =
    getTeacherSubmissionDate(
      submission
    );

  const status =
    getTeacherGradingSubmissionStatus(
      submission
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
      data-teacher-action="select-grading-submission"
      data-submission-id="${escapeAttribute(submissionId)}"
    >

      <img
        src="${escapeAttribute(studentAvatar)}"
        alt=""
        loading="lazy"
        referrerpolicy="no-referrer"
      />


      <span
        class="teacher-submission-list-copy"
      >

        <span
          class="teacher-submission-list-top"
        >

          <strong>
            ${escapeHtml(studentName)}
          </strong>

          <small>
            ${escapeHtml(
              formatRelativeDate(
                submittedAt
              )
            )}
          </small>

        </span>


        <span
          class="teacher-submission-assignment"
        >
          ${escapeHtml(
            getTeacherAssignmentTitle(
              assignment ||
              {}
            )
          )}
        </span>


        <span
          class="teacher-submission-class"
        >
          ${escapeHtml(
            getTeacherClassTitle(
              classItem ||
              {}
            )
          )}
        </span>


        <span
          class="teacher-submission-status is-${escapeAttribute(status)}"
        >
          ${escapeHtml(
            getTeacherGradingStatusLabel(
              submission
            )
          )}
        </span>

      </span>

    </button>
  `;

}


/* =========================================================
   RENDER GRADING QUEUE
========================================================= */

function renderTeacherGradingSubmissionList(){

  const container =
    $(
      "teacherSubmissionList"
    );


  if (
    !container
  ){

    return;

  }


  const submissions =
    getTeacherFilteredGradingSubmissions();


  /*
    If selected work disappeared because a filter changed,
    clear the selection rather than leaving stale details.
  */

  if (
    teacherGradingWorkspaceState
      .selectedSubmissionId &&
    !submissions.some(
      submission =>
        sameId(
          getTeacherSubmissionId(
            submission
          ),
          teacherGradingWorkspaceState
            .selectedSubmissionId
        )
    )
  ){

    teacherGradingWorkspaceState
      .selectedSubmissionId =
      "";

  }


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
            aria-hidden="true"
          ></i>
        </div>

        <h3>
          No submissions found
        </h3>

        <p>
          Student submissions matching your current filters will appear here.
        </p>
      </div>
    `;


    renderTeacherSubmissionViewer();

    return;

  }


  container.innerHTML =
    submissions
      .map(
        createTeacherGradingQueueItem
      )
      .join(
        ""
      );


  container
    .querySelectorAll(
      "img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            image.onerror =
              null;

            image.src =
              FALLBACK_AVATAR;

          };

      }
    );

}


/* =========================================================
   EMPTY SUBMISSION VIEWER
========================================================= */

function renderTeacherEmptySubmissionViewer(){

  const container =
    $(
      "teacherSubmissionViewer"
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
          aria-hidden="true"
        ></i>
      </div>

      <h3>
        Select a submission
      </h3>

      <p>
        Choose student work from the queue to inspect the response,
        review attachments, add a grade and provide feedback.
      </p>

    </div>
  `;

}


/* =========================================================
   SUBMISSION ATTACHMENT URL
========================================================= */

function getTeacherSubmissionFileUrl(
  submission
){

  return normalizeHttpUrl(

    submission?.fileUrl ||
    submission?.attachmentUrl ||
    submission?.documentUrl

  );

}


/* =========================================================
   FILE NAME
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
        url
      )
        .pathname;


    return decodeURIComponent(
      pathname
        .split(
          "/"
        )
        .filter(
          Boolean
        )
        .pop() ||
      "Student attachment"
    );

  }catch{

    return "Student attachment";

  }

}


/* =========================================================
   SUBMISSION FILE TYPE
========================================================= */

function getTeacherSubmissionFileType(
  url
){

  const cleanUrl =
    safeString(
      url
    )
      .split(
        "?"
      )[0]
      .toLowerCase();


  if (
    /\.(png|jpg|jpeg|gif|webp|bmp)$/.test(
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
   ATTACHMENT PREVIEW

   Only validated HTTP(S) URLs reach this function.
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
          aria-hidden="true"
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

  const fileName =
    getTeacherSubmissionFileName(
      fileUrl
    );

  const safeUrl =
    escapeAttribute(
      fileUrl
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
          alt="${escapeAttribute(fileName)}"
          loading="lazy"
          referrerpolicy="no-referrer"
        />

        <a
          href="${safeUrl}"
          target="_blank"
          rel="noopener noreferrer"
          class="teacher-secondary-button"
        >
          <i
            class="fa-solid fa-up-right-from-square"
            aria-hidden="true"
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
          title="${escapeAttribute(fileName)}"
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
            aria-hidden="true"
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
        aria-hidden="true"
      ></i>

      <span>
        <strong>
          ${escapeHtml(fileName)}
        </strong>

        <small>
          Open student attachment
        </small>
      </span>

      <i
        class="fa-solid fa-arrow-up-right-from-square"
        aria-hidden="true"
      ></i>

    </a>
  `;

}


/* =========================================================
   KABEZYA GRADING AREA

   No unverified endpoint is called.

   Part 7 only preserves the current UI position and action
   hook. Part dedicated to Kabezya will connect the verified
   backend contract.
========================================================= */

function renderTeacherKabezyaGradingPlaceholder(){

  return `
    <div
      class="teacher-kabezya-grading-empty"
    >
      <i
        class="fa-solid fa-wand-magic-sparkles"
        aria-hidden="true"
      ></i>

      <div>
        <strong>
          Kabezya grading assistant
        </strong>

        <p>
          Kabezya can assist with inspecting student work.
          AI suggestions remain advisory and never publish a grade automatically.
        </p>
      </div>
    </div>
  `;

}


/* =========================================================
   MAX ASSIGNMENT SCORE

   Only applies a max when the assignment actually provides
   one. No default maximum is invented.
========================================================= */

function getTeacherAssignmentMaximumScore(
  assignment
){

  const candidates = [

    assignment?.points,
    assignment?.maxPoints,
    assignment?.totalPoints,
    assignment?.maximumScore

  ];


  for (
    const value of candidates
  ){

    const numeric =
      Number(
        value
      );


    if (
      Number.isFinite(
        numeric
      ) &&
      numeric >
      0
    ){

      return numeric;

    }

  }


  return null;

}


/* =========================================================
   SELECTED SUBMISSION VIEWER
========================================================= */

function renderTeacherSubmissionViewer(){

  const container =
    $(
      "teacherSubmissionViewer"
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
    getTeacherGradingSubmissionStatus(
      submission
    );

  const grade =
    Number.isFinite(
      Number(
        submission?.grade
      )
    )
      ? Number(
          submission.grade
        )
      : "";

  const feedback =
    safeString(
      submission?.feedback
    );

  const studentName =
    safeString(

      student?.name ||
      student?.fullName ||
      student?.displayName,

      "Student"

    );

  const studentAvatar =
    getSafeImageUrl(

      student?.profileImage ||
      student?.avatar ||
      student?.photoURL,

      FALLBACK_AVATAR

    );

  const submittedAt =
    getTeacherSubmissionDate(
      submission
    );

  const maximumScore =
    getTeacherAssignmentMaximumScore(
      assignment
    );


  container.innerHTML = `
    <section
      class="teacher-submission-viewer-panel"
    >

      <!-- ===============================================
           STUDENT HEADER
      ================================================ -->

      <header
        class="teacher-submission-viewer-header"
      >

        <div
          class="teacher-submission-student"
        >

          <img
            src="${escapeAttribute(studentAvatar)}"
            alt=""
            loading="lazy"
            referrerpolicy="no-referrer"
          />

          <div>

            <span>
              Student submission
            </span>

            <h2>
              ${escapeHtml(studentName)}
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
          class="teacher-submission-status is-${escapeAttribute(status)}"
        >
          ${escapeHtml(
            getTeacherGradingStatusLabel(
              submission
            )
          )}
        </span>

      </header>


      <!-- ===============================================
           CONTEXT
      ================================================ -->

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
                assignment ||
                {}
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
                classItem ||
                {}
              )
            )}
          </strong>
        </article>


        <article>
          <span>
            Submitted
          </span>

          <strong>
            ${
              submittedAt
                ? escapeHtml(
                    formatDateTime(
                      submittedAt
                    )
                  )
                : "No date"
            }
          </strong>
        </article>

      </div>


      <!-- ===============================================
           ASSIGNMENT INSTRUCTIONS
      ================================================ -->

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
                  aria-hidden="true"
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


      <!-- ===============================================
           STUDENT RESPONSE
      ================================================ -->

      <section
        class="teacher-submission-section"
      >

        <div
          class="teacher-submission-section-title"
        >
          <i
            class="fa-solid fa-align-left"
            aria-hidden="true"
          ></i>

          <h3>
            Student response
          </h3>
        </div>


        ${
          safeString(
            submission?.text
          )
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


      <!-- ===============================================
           ATTACHMENT
      ================================================ -->

      <section
        class="teacher-submission-section"
      >

        <div
          class="teacher-submission-section-title"
        >
          <i
            class="fa-solid fa-paperclip"
            aria-hidden="true"
          ></i>

          <h3>
            Attachment
          </h3>
        </div>

        ${renderTeacherSubmissionAttachment(
          submission
        )}

      </section>


      <!-- ===============================================
           KABEZYA
      ================================================ -->

      <section
        class="teacher-submission-section teacher-kabezya-grading-card"
      >

        <div
          class="teacher-submission-section-title"
        >

          <i
            class="fa-solid fa-wand-magic-sparkles"
            aria-hidden="true"
          ></i>

          <h3>
            Inspect with Kabezya
          </h3>


          <button
            type="button"
            class="teacher-primary-button"
            data-teacher-action="kabezya-review-submission"
            data-submission-id="${escapeAttribute(
              getTeacherSubmissionId(
                submission
              )
            )}"
          >
            <i
              class="fa-solid fa-wand-magic-sparkles"
              aria-hidden="true"
            ></i>

            Inspect work
          </button>

        </div>


        <div
          id="teacherKabezyaGradingResult"
        >
          ${renderTeacherKabezyaGradingPlaceholder()}
        </div>

      </section>


      <!-- ===============================================
           TEACHER ASSESSMENT
      ================================================ -->

      <section
        class="teacher-submission-section teacher-grading-form-section"
      >

        <div
          class="teacher-submission-section-title"
        >
          <i
            class="fa-solid fa-marker"
            aria-hidden="true"
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
              ${
                maximumScore !==
                null
                  ? ` · Max ${escapeHtml(maximumScore)}`
                  : ""
              }
            </span>

            <input
              id="teacherSubmissionGrade"
              type="number"
              min="0"
              ${
                maximumScore !==
                null
                  ? `max="${escapeAttribute(maximumScore)}"`
                  : ""
              }
              step="0.01"
              placeholder="Enter grade"
              value="${escapeAttribute(grade)}"
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
            >${escapeHtml(feedback)}</textarea>

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
            data-teacher-action="save-submission-review"
            data-submission-id="${escapeAttribute(
              getTeacherSubmissionId(
                submission
              )
            )}"
            ${
              teacherGradingWorkspaceState
                .saving
                ? "disabled"
                : ""
            }
          >
            <i
              class="fa-solid ${
                teacherGradingWorkspaceState
                  .saving
                  ? "fa-spinner fa-spin"
                  : "fa-floppy-disk"
              }"
              aria-hidden="true"
            ></i>

            ${
              teacherGradingWorkspaceState
                .saving
                ? "Saving..."
                : "Save assessment"
            }
          </button>

        </div>

      </section>

    </section>
  `;


  const avatar =
    container.querySelector(
      ".teacher-submission-student img"
    );


  if (
    avatar
  ){

    avatar.onerror =
      () => {

        avatar.onerror =
          null;

        avatar.src =
          FALLBACK_AVATAR;

      };

  }

}


/* =========================================================
   SELECT GRADING SUBMISSION
========================================================= */

function selectTeacherGradingSubmission(
  submissionId
){

  const submission =
    getTeacherSubmissionById(
      submissionId
    );


  if (
    !submission
  ){

    notifyAIFTError(
      "The selected submission is no longer available.",
      {
        title:
          "Submission unavailable"
      }
    );


    return false;

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


  renderTeacherGradingSubmissionList();

  renderTeacherSubmissionViewer();


  return true;

}


/* =========================================================
   REVIEW PAYLOAD VALIDATION
========================================================= */

function buildTeacherSubmissionReviewPayload(
  submission
){

  const gradeInput =
    $(
      "teacherSubmissionGrade"
    );

  const feedbackInput =
    $(
      "teacherSubmissionFeedback"
    );

  const statusInput =
    $(
      "teacherSubmissionReviewStatus"
    );


  const rawGrade =
    safeString(
      gradeInput?.value
    );


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

      throw new AIFTApiError(
        "Please enter a valid non-negative grade.",
        {
          code:
            "INVALID_GRADE"
        }
      );

    }


    const assignment =
      getTeacherSubmissionAssignment(
        submission
      );

    const maximumScore =
      getTeacherAssignmentMaximumScore(
        assignment
      );


    if (
      maximumScore !==
        null &&
      grade >
        maximumScore
    ){

      throw new AIFTApiError(
        `The grade cannot be higher than ${maximumScore}.`,
        {
          code:
            "GRADE_EXCEEDS_MAXIMUM"
        }
      );

    }

  }


  const feedback =
    safeString(
      feedbackInput?.value
    );


  const status =
    safeString(
      statusInput?.value,
      "reviewed"
    )
      .toLowerCase();


  if (
    ![
      "reviewed",
      "returned"
    ].includes(
      status
    )
  ){

    throw new AIFTApiError(
      "Please select a valid review status.",
      {
        code:
          "INVALID_REVIEW_STATUS"
      }
    );

  }


  return {
    grade,
    feedback,
    status
  };

}


/* =========================================================
   REPLACE SUBMISSION IN STATE
========================================================= */

function replaceTeacherSubmissionInState(
  updatedSubmission
){

  const updatedId =
    getTeacherSubmissionId(
      updatedSubmission
    );


  if (
    !updatedId
  ){

    return false;

  }


  const index =
    state.submissions
      .findIndex(
        submission =>
          sameId(
            getTeacherSubmissionId(
              submission
            ),
            updatedId
          )
      );


  if (
    index <
    0
  ){

    state.submissions.unshift(
      updatedSubmission
    );

  }else{

    state.submissions[
      index
    ] =
      updatedSubmission;

  }


  return true;

}


/* =========================================================
   SAVE REAL SUBMISSION REVIEW

   BACKEND CONTRACT SUPPLIED FOR THIS PROJECT:

   PATCH
   /api/submissions/:id/review

   Body:
   {
     grade,
     feedback,
     status
   }

   Valid final statuses:
     reviewed
     returned

   Server-side canGrade() remains authoritative.
========================================================= */

async function saveTeacherSubmissionReview(){

  if (
    teacherGradingWorkspaceState
      .saving
  ){

    return false;

  }


  const submission =
    getTeacherSubmissionById(
      teacherGradingWorkspaceState
        .selectedSubmissionId
    );


  if (
    !submission
  ){

    notifyAIFTError(
      "Please select a submission first.",
      {
        title:
          "Nothing selected"
      }
    );


    return false;

  }


  let payload;


  try{

    payload =
      buildTeacherSubmissionReviewPayload(
        submission
      );

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Please review the assessment fields."
      ),
      {
        title:
          "Assessment incomplete"
      }
    );


    return false;

  }


  teacherGradingWorkspaceState
    .saving =
    true;


  renderTeacherSubmissionViewer();


  try{

    const submissionId =
      getTeacherSubmissionId(
        submission
      );


    const response =
      await apiPatch(
        `/api/submissions/${encodeURIComponent(submissionId)}/review`,
        payload
      );


    const updatedSubmission =
      response?.submission ||
      response?.data ||
      response;


    /*
      Preferred path:
      backend returns the updated submission.
    */

    if (
      updatedSubmission &&
      getTeacherSubmissionId(
        updatedSubmission
      )
    ){

      replaceTeacherSubmissionInState(
        updatedSubmission
      );

    }else{

      /*
        Safe fallback:
        reload from authoritative backend.
      */

      await loadTeacherSubmissions();

    }


    finalizeTeacherLoadedData();


    /*
      Keep selection on the same submission after save.
    */

    teacherGradingWorkspaceState
      .selectedSubmissionId =
      submissionId;


    renderTeacherGradingSummary();

    renderTeacherGradingSubmissionList();

    renderTeacherSubmissionViewer();

    renderTeacherSubmissionsWorkspace();

    renderTeacherAssignmentsGrid();

    renderTeacherDashboardStats();

    renderTeacherGradingBadge();

    renderTeacherOverviewAssignments();

    renderTeacherOverviewActivity();


    notifyAIFTSuccess(

      payload.status ===
        "returned"
        ? "The submission was returned to the student."
        : "The student assessment was saved.",

      {
        title:
          payload.status ===
            "returned"
            ? "Work returned"
            : "Assessment saved"
      }

    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "AIFT could not save this assessment."
      ),
      {
        title:
          "Assessment not saved"
      }
    );


    return false;

  }finally{

    teacherGradingWorkspaceState
      .saving =
      false;


    renderTeacherSubmissionViewer();

  }

}


/* =========================================================
   GRADING FILTER CONTROL BINDINGS

   Toolbar markup is dynamic, so bindings are applied after
   each toolbar render.

   Property handlers ensure one listener per element.
========================================================= */

function bindTeacherGradingFilterControls(){

  const classFilter =
    $(
      "teacherGradingClassFilter"
    );

  const assignmentFilter =
    $(
      "teacherGradingAssignmentFilter"
    );

  const statusFilter =
    $(
      "teacherGradingStatusFilter"
    );

  const search =
    $(
      "teacherGradingSearch"
    );


  if (
    classFilter
  ){

    classFilter.onchange =
      event => {

        teacherGradingWorkspaceState
          .classId =
          normalizeId(
            event.target.value
          );


        /*
          Assignment options depend on class.
        */

        teacherGradingWorkspaceState
          .assignmentId =
          "";


        teacherGradingWorkspaceState
          .selectedSubmissionId =
          "";


        renderTeacherGradingToolbar();

        renderTeacherGradingSubmissionList();

        renderTeacherSubmissionViewer();

      };

  }


  if (
    assignmentFilter
  ){

    assignmentFilter.onchange =
      event => {

        teacherGradingWorkspaceState
          .assignmentId =
          normalizeId(
            event.target.value
          );


        teacherGradingWorkspaceState
          .selectedSubmissionId =
          "";


        renderTeacherGradingSubmissionList();

        renderTeacherSubmissionViewer();

      };

  }


  if (
    statusFilter
  ){

    statusFilter.onchange =
      event => {

        teacherGradingWorkspaceState
          .status =
          safeString(
            event.target.value,
            "all"
          );


        teacherGradingWorkspaceState
          .selectedSubmissionId =
          "";


        renderTeacherGradingSubmissionList();

        renderTeacherSubmissionViewer();

      };

  }


  if (
    search
  ){

    search.oninput =
      event => {

        teacherGradingWorkspaceState
          .search =
          safeString(
            event.target.value
          );


        renderTeacherGradingSubmissionList();

      };

  }

}


/* =========================================================
   OPEN GRADING FOR A SUBMISSION

   Used by the central action controller when the teacher
   clicks Review from the Submissions page.
========================================================= */

function prepareTeacherGradingSubmission(
  submissionId
){

  const submission =
    getTeacherSubmissionById(
      submissionId
    );


  if (
    !submission
  ){

    return false;

  }


  teacherGradingWorkspaceState
    .classId =
    getTeacherSubmissionClassId(
      submission
    );

  teacherGradingWorkspaceState
    .assignmentId =
    getTeacherSubmissionAssignmentId(
      submission
    );

  teacherGradingWorkspaceState
    .status =
    "all";

  teacherGradingWorkspaceState
    .selectedSubmissionId =
    getTeacherSubmissionId(
      submission
    );


  return true;

}


/* =========================================================
   OPEN GRADING FOR AN ASSIGNMENT
========================================================= */

function prepareTeacherGradingAssignment(
  assignmentId
){

  const assignment =
    getTeacherAssignments()
      .find(
        item =>
          sameId(
            item?._id ||
            item?.id,
            assignmentId
          )
      );


  if (
    !assignment
  ){

    return false;

  }


  teacherGradingWorkspaceState
    .classId =
    normalizeId(
      assignment
        ?.classId
        ?._id ||
      assignment
        ?.classId
    );

  teacherGradingWorkspaceState
    .assignmentId =
    normalizeId(
      assignment?._id ||
      assignment?.id
    );

  teacherGradingWorkspaceState
    .status =
    "submitted";

  teacherGradingWorkspaceState
    .selectedSubmissionId =
    "";


  return true;

}


/* =========================================================
   OPEN GRADING FOR CLASS
========================================================= */

function prepareTeacherGradingClass(
  classId
){

  if (
    !getTeacherClassById(
      classId
    )
  ){

    return false;

  }


  teacherGradingWorkspaceState
    .classId =
    normalizeId(
      classId
    );

  teacherGradingWorkspaceState
    .assignmentId =
    "";

  teacherGradingWorkspaceState
    .status =
    "submitted";

  teacherGradingWorkspaceState
    .selectedSubmissionId =
    "";


  return true;

}


/* =========================================================
   REFRESH GRADING
========================================================= */

async function refreshTeacherGradingWorkspace(){

  if (
    teacherGradingWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherGradingWorkspaceState
    .refreshing =
    true;


  renderTeacherGradingHeader();


  try{

    const results =
      await Promise.allSettled([

        loadTeacherAssignments(),

        loadTeacherSubmissions()

      ]);


    results.forEach(
      (
        result,
        index
      ) => {

        if (
          result.status ===
          "rejected"
        ){

          reportOptionalRequestError(
            [
              "Assignments",
              "Submissions"
            ][index],
            result.reason
          );

        }

      }
    );


    finalizeTeacherLoadedData();


    /*
      If selected submission no longer exists, clear it.
    */

    if (
      teacherGradingWorkspaceState
        .selectedSubmissionId &&
      !getTeacherSubmissionById(
        teacherGradingWorkspaceState
          .selectedSubmissionId
      )
    ){

      teacherGradingWorkspaceState
        .selectedSubmissionId =
        "";

    }


    renderTeacherGradingWorkspace();

    renderTeacherDashboardStats();

    renderTeacherGradingBadge();


    notifyAIFTSuccess(
      "The grading queue is up to date.",
      {
        title:
          "Grading refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "The grading queue could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherGradingWorkspaceState
      .refreshing =
      false;


    renderTeacherGradingHeader();

  }

}


/* =========================================================
   RENDER COMPLETE GRADING WORKSPACE
========================================================= */

function renderTeacherGradingWorkspace(){

  renderTeacherGradingHeader();

  renderTeacherGradingToolbar();

  renderTeacherGradingSummary();

  renderTeacherGradingSubmissionList();

  renderTeacherSubmissionViewer();

}


/* =========================================================
   INITIALIZE GRADING WORKSPACE
========================================================= */

function initializeTeacherGradingWorkspace(){

  if (
    teacherGradingWorkspaceState
      .initialized
  ){

    renderTeacherGradingWorkspace();

    return;

  }


  teacherGradingWorkspaceState
    .initialized =
    true;


  /*
    Default to work that needs teacher attention.
  */

  if (
    !teacherGradingWorkspaceState
      .status
  ){

    teacherGradingWorkspaceState
      .status =
      "submitted";

  }


  renderTeacherGradingWorkspace();

}


/* =========================================================
   UPDATE GRADING UI FROM CURRENT STATE
========================================================= */

function refreshTeacherGradingFromCurrentState(){

  renderTeacherGradingSummary();

  renderTeacherGradingSubmissionList();

  renderTeacherSubmissionViewer();

  renderTeacherGradingBadge();

}


/* =========================================================
   PART 7 COMPLETE

   REAL MUTATION PATH:
   PATCH /api/submissions/:id/review

   No separate grading API helper exists.

   No client-side authorization is treated as security.

   No AI suggestion is automatically saved.

   No Kabezya endpoint has been invented.

   The authoritative Studio action controller will later map:

     select-grading-submission
       -> selectTeacherGradingSubmission()

     save-submission-review
       -> saveTeacherSubmissionReview()

     refresh-grading
       -> refreshTeacherGradingWorkspace()

     review-submission
       -> prepareTeacherGradingSubmission()
          + navigate to grading

     assignment-submissions
       -> prepareTeacherGradingAssignment()
          + navigate to grading

     class-grading
       -> prepareTeacherGradingClass()
          + navigate to grading

     kabezya-review-submission
       -> verified Kabezya review lifecycle
          in the dedicated AI part
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 8

   ATTENDANCE WORKSPACE
   ---------------------------------------------------------
   1. Attendance workspace state
   2. Date/status normalization
   3. Selected-class roster
   4. Record lookup
   5. Attendance summary
   6. Dynamic header
   7. Dynamic toolbar
   8. Existing bulk-action design
   9. Existing roster design
   10. Student history
   11. Real POST /api/attendance upsert
   12. Single-status updates
   13. Bulk attendance
   14. Refresh lifecycle
   15. Attendance initialization

   SECURITY MODEL
   ---------------------------------------------------------
   Frontend checks improve UX only.

   routes/attendance.js remains authoritative.

   The server:
   - authenticates the user
   - loads the real class
   - confirms assigned-teacher permission
   - confirms student enrollment
   - derives schoolId from the class
   - derives teacherId from the class
========================================================= */


/* =========================================================
   ATTENDANCE WORKSPACE STATE
========================================================= */

const teacherAttendanceWorkspaceState = {

  classId:
    "",

  date:
    getTeacherLocalDateInputValue(),

  search:
    "",

  selectedStudentId:
    "",

  savingStudentIds:
    new Set(),

  bulkSaving:
    false,

  loading:
    false,

  initialized:
    false

};


/* =========================================================
   LOCAL DATE FOR <input type="date">

   Do not use new Date().toISOString().slice(0,10) here.

   ISO date is UTC and can show the wrong calendar date near
   midnight in the teacher's local timezone.
========================================================= */

function getTeacherLocalDateInputValue(
  value = new Date()
){

  const date =
    value instanceof Date
      ? value
      : toValidDate(
          value
        );


  if (
    !date
  ){

    return "";

  }


  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
      1
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


/* =========================================================
   VALID DATE INPUT VALUE
========================================================= */

function normalizeTeacherAttendanceDate(
  value
){

  const normalized =
    safeString(
      value
    );


  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      normalized
    )
  ){

    return "";

  }


  const [
    year,
    month,
    day
  ] =
    normalized
      .split(
        "-"
      )
      .map(
        Number
      );


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  if (
    Number.isNaN(
      date.getTime()
    ) ||
    date.getFullYear() !==
      year ||
    date.getMonth() !==
      month - 1 ||
    date.getDate() !==
      day
  ){

    return "";

  }


  return normalized;

}


/* =========================================================
   DATE FOR ATTENDANCE API

   Backend normalizes attendance dates to the start of day.

   Use one stable ISO representation for the selected calendar
   day rather than allowing browser-specific date parsing.
========================================================= */

function getTeacherAttendanceApiDate(
  value
){

  const normalized =
    normalizeTeacherAttendanceDate(
      value
    );


  if (
    !normalized
  ){

    return "";

  }


  return `${normalized}T00:00:00.000Z`;

}


/* =========================================================
   NORMALIZE ATTENDANCE STATUS
========================================================= */

function normalizeTeacherAttendanceStatus(
  value
){

  const status =
    safeString(
      value
    )
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


  return "";

}


/* =========================================================
   ATTENDANCE STATUS LABEL
========================================================= */

function getTeacherAttendanceStatusLabel(
  value
){

  switch(
    normalizeTeacherAttendanceStatus(
      value
    )
  ){

    case "present":

      return "Present";

    case "late":

      return "Late";

    case "absent":

      return "Absent";

    case "excused":

      return "Excused";

    default:

      return "Not marked";

  }

}


/* =========================================================
   ATTENDANCE STATUS ICON
========================================================= */

function getTeacherAttendanceStatusIcon(
  value
){

  switch(
    normalizeTeacherAttendanceStatus(
      value
    )
  ){

    case "present":

      return "fa-solid fa-check";

    case "late":

      return "fa-regular fa-clock";

    case "absent":

      return "fa-solid fa-xmark";

    case "excused":

      return "fa-solid fa-circle-info";

    default:

      return "fa-regular fa-circle";

  }

}


/* =========================================================
   SELECTED ATTENDANCE CLASS
========================================================= */

function getTeacherAttendanceSelectedClass(){

  const classId =
    normalizeId(
      teacherAttendanceWorkspaceState
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
   STUDENTS IN ONE TEACHER CLASS

   Class.studentIds is populated by the current classes route.
========================================================= */

function getTeacherAttendanceClassStudents(
  classId
){

  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    return [];

  }


  const students =
    [];


  asArray(
    classItem.studentIds
  )
    .forEach(
      value => {

        const studentId =
          normalizeId(
            value?._id ||
            value?.id ||
            value
          );


        if (
          !studentId
        ){

          return;

        }


        let student =
          value;


        if (
          typeof value !==
          "object"
        ){

          const normalizedRecord =
            getTeacherStudentById(
              studentId
            );


          student =
            normalizedRecord
              ?.student ||
            {
              _id:
                studentId
            };

        }


        students.push({
          ...student,

          _id:
            studentId
        });

      }
    );


  return uniqueById(
    students
  );

}


/* =========================================================
   FILTERED ATTENDANCE ROSTER
========================================================= */

function getTeacherAttendanceRoster(){

  const classId =
    normalizeId(
      teacherAttendanceWorkspaceState
        .classId
    );


  if (
    !classId
  ){

    return [];

  }


  const search =
    safeString(
      teacherAttendanceWorkspaceState
        .search
    )
      .toLowerCase();


  let students =
    getTeacherAttendanceClassStudents(
      classId
    );


  if (
    search
  ){

    students =
      students.filter(
        student => {

          const haystack =
            [

              student?.name,
              student?.fullName,
              student?.displayName,
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
      safeString(
        first?.name ||
        first?.fullName ||
        first?.displayName,
        "Student"
      )
        .localeCompare(
          safeString(
            second?.name ||
            second?.fullName ||
            second?.displayName,
            "Student"
          )
        )
  );


  return students;

}


/* =========================================================
   ATTENDANCE RECORD DATE KEY
========================================================= */

function getTeacherAttendanceRecordDateKey(
  record
){

  const date =
    toValidDate(
      record?.date
    );


  if (
    !date
  ){

    return "";

  }


  /*
    Attendance backend dates are normalized to day boundaries.

    Build the key from UTC components because POST uses the
    corresponding UTC-midnight representation.
  */

  const year =
    date.getUTCFullYear();

  const month =
    String(
      date.getUTCMonth() +
      1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getUTCDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


/* =========================================================
   GET ATTENDANCE RECORD
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
    normalizeTeacherAttendanceDate(
      date
    );


  if (
    !normalizedClassId ||
    !normalizedStudentId ||
    !normalizedDate
  ){

    return null;

  }


  return (
    getTeacherAttendance()
      .find(
        record => {

          const recordClassId =
            normalizeId(
              record
                ?.classId
                ?._id ||
              record
                ?.classId
            );

          const recordStudentId =
            normalizeId(
              record
                ?.studentId
                ?._id ||
              record
                ?.studentId
            );


          return (
            sameId(
              recordClassId,
              normalizedClassId
            ) &&
            sameId(
              recordStudentId,
              normalizedStudentId
            ) &&
            getTeacherAttendanceRecordDateKey(
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
   RECORDS FOR STUDENT
========================================================= */

function getTeacherAttendanceStudentRecords(
  studentId
){

  const normalizedStudentId =
    normalizeId(
      studentId
    );


  if (
    !normalizedStudentId
  ){

    return [];

  }


  return getTeacherAttendance()
    .filter(
      record =>
        sameId(
          record
            ?.studentId
            ?._id ||
          record
            ?.studentId,
          normalizedStudentId
        )
    )
    .sort(
      (
        first,
        second
      ) =>
        (
          toValidDate(
            second?.date
          )?.getTime() ||
          0
        ) -
        (
          toValidDate(
            first?.date
          )?.getTime() ||
          0
        )
    );

}


/* =========================================================
   ATTENDANCE SUMMARY FOR SELECTED DATE
========================================================= */

function getTeacherAttendanceSummary(){

  const classId =
    normalizeId(
      teacherAttendanceWorkspaceState
        .classId
    );

  const date =
    normalizeTeacherAttendanceDate(
      teacherAttendanceWorkspaceState
        .date
    );


  if (
    !classId ||
    !date
  ){

    return {

      total:
        0,

      recorded:
        0,

      present:
        0,

      late:
        0,

      absent:
        0,

      excused:
        0,

      attendanceRate:
        0

    };

  }


  const students =
    getTeacherAttendanceClassStudents(
      classId
    );


  const summary = {

    total:
      students.length,

    recorded:
      0,

    present:
      0,

    late:
      0,

    absent:
      0,

    excused:
      0,

    attendanceRate:
      0

  };


  students.forEach(
    student => {

      const studentId =
        normalizeId(
          student?._id ||
          student?.id
        );


      const record =
        getTeacherAttendanceRecord(
          classId,
          studentId,
          date
        );


      if (
        !record
      ){

        return;

      }


      const status =
        normalizeTeacherAttendanceStatus(
          record.status
        );


      if (
        !status
      ){

        return;

      }


      summary.recorded +=
        1;


      if (
        Object.prototype
          .hasOwnProperty
          .call(
            summary,
            status
          )
      ){

        summary[
          status
        ] +=
          1;

      }

    }
  );


  const attended =
    summary.present +
    summary.late;


  summary.attendanceRate =
    summary.recorded
      ? clampPercentage(
          (
            attended /
            summary.recorded
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
    $(
      "teacherAttendanceHeader"
    );


  if (
    !container
  ){

    return;

  }


  const selectedClass =
    getTeacherAttendanceSelectedClass();


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
          ${
            selectedClass
              ? `Record and review attendance for ${escapeHtml(
                  getTeacherClassTitle(
                    selectedClass
                  )
                )}.`
              : "Select one of your assigned classes to record and review student attendance."
          }
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
    $(
      "teacherAttendanceToolbar"
    );


  if (
    !container
  ){

    return;

  }


  container.innerHTML = `

    <select
      id="teacherAttendanceClassFilter"
      class="teacher-workspace-select"
      aria-label="Select attendance class"
    >

      <option value="">
        Select class
      </option>

      ${
        getTeacherClasses()
          .map(
            classItem => {

              const classId =
                normalizeId(
                  classItem?._id ||
                  classItem?.id
                );


              return `
                <option
                  value="${escapeAttribute(classId)}"
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

      <span>
        Date
      </span>

      <input
        id="teacherAttendanceDate"
        type="date"
        value="${escapeAttribute(
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
        aria-hidden="true"
      ></i>

      <input
        id="teacherAttendanceSearch"
        type="search"
        placeholder="Search student..."
        autocomplete="off"
        value="${escapeAttribute(
          teacherAttendanceWorkspaceState
            .search
        )}"
      />

    </div>


    <button
      type="button"
      class="teacher-secondary-button"
      data-teacher-action="attendance-today"
    >
      Today
    </button>


    <button
      type="button"
      class="teacher-secondary-button"
      data-teacher-action="refresh-attendance"
      ${
        teacherAttendanceWorkspaceState
          .loading
          ? "disabled"
          : ""
      }
    >
      <i
        class="fa-solid ${
          teacherAttendanceWorkspaceState
            .loading
            ? "fa-spinner fa-spin"
            : "fa-rotate"
        }"
        aria-hidden="true"
      ></i>

      <span>
        ${
          teacherAttendanceWorkspaceState
            .loading
            ? "Refreshing..."
            : "Refresh"
        }
      </span>
    </button>
  `;


  bindTeacherAttendanceToolbarControls();

}


/* =========================================================
   ATTENDANCE SUMMARY
========================================================= */

function renderTeacherAttendanceSummary(){

  const container =
    $(
      "teacherAttendanceSummary"
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
        aria-hidden="true"
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
        class="fa-solid fa-check"
        aria-hidden="true"
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
        class="fa-regular fa-clock"
        aria-hidden="true"
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
        class="fa-solid fa-xmark"
        aria-hidden="true"
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
        aria-hidden="true"
      ></i>

      <span>
        <strong>
          ${
            summary.recorded
              ? `${summary.attendanceRate}%`
              : "—"
          }
        </strong>

        <small>
          Attendance
        </small>
      </span>
    </article>
  `;

}


/* =========================================================
   BULK ACTIONS
========================================================= */

function renderTeacherAttendanceBulkActions(){

  const container =
    $(
      "teacherAttendanceBulkActions"
    );


  if (
    !container
  ){

    return;

  }


  const hasClass =
    Boolean(
      getTeacherAttendanceSelectedClass()
    );

  const disabled =
    !hasClass ||
    teacherAttendanceWorkspaceState
      .bulkSaving;


  container.innerHTML = `

    <div
      class="teacher-attendance-bulk-copy"
    >

      <strong>
        Quick attendance
      </strong>

      <span>
        Apply one status to the full visible roster.
      </span>

    </div>


    <div
      class="teacher-attendance-bulk-buttons"
    >

      <button
        type="button"
        class="teacher-attendance-bulk-button is-present"
        data-teacher-action="bulk-attendance"
        data-attendance-status="present"
        ${
          disabled
            ? "disabled"
            : ""
        }
      >
        <i
          class="fa-solid fa-check"
          aria-hidden="true"
        ></i>

        All present
      </button>


      <button
        type="button"
        class="teacher-attendance-bulk-button is-late"
        data-teacher-action="bulk-attendance"
        data-attendance-status="late"
        ${
          disabled
            ? "disabled"
            : ""
        }
      >
        <i
          class="fa-regular fa-clock"
          aria-hidden="true"
        ></i>

        All late
      </button>


      <button
        type="button"
        class="teacher-attendance-bulk-button is-absent"
        data-teacher-action="bulk-attendance"
        data-attendance-status="absent"
        ${
          disabled
            ? "disabled"
            : ""
        }
      >
        <i
          class="fa-solid fa-xmark"
          aria-hidden="true"
        ></i>

        All absent
      </button>

    </div>
  `;

}


/* =========================================================
   STUDENT NAME
========================================================= */

function getTeacherAttendanceStudentName(
  student
){

  return safeString(

    student?.name ||
    student?.fullName ||
    student?.displayName,

    "Student"

  );

}


/* =========================================================
   STUDENT AVATAR
========================================================= */

function getTeacherAttendanceStudentAvatar(
  student
){

  return getSafeImageUrl(

    student?.profileImage ||
    student?.avatar ||
    student?.photoURL,

    FALLBACK_AVATAR

  );

}


/* =========================================================
   STATUS BUTTON
========================================================= */

function createTeacherAttendanceStatusButton(
  {
    studentId,
    status,
    activeStatus,
    saving
  }
){

  const active =
    status ===
    activeStatus;


  return `
    <button
      type="button"
      class="
        teacher-attendance-status-button
        is-${escapeAttribute(status)}
        ${
          active
            ? "active"
            : ""
        }
      "
      data-teacher-action="set-attendance-status"
      data-student-id="${escapeAttribute(studentId)}"
      data-attendance-status="${escapeAttribute(status)}"
      aria-pressed="${active ? "true" : "false"}"
      ${
        saving
          ? "disabled"
          : ""
      }
    >
      <i
        class="${escapeAttribute(
          getTeacherAttendanceStatusIcon(
            status
          )
        )}"
        aria-hidden="true"
      ></i>

      ${escapeHtml(
        getTeacherAttendanceStatusLabel(
          status
        )
      )}
    </button>
  `;

}


/* =========================================================
   ATTENDANCE STUDENT ROW
========================================================= */

function createTeacherAttendanceStudentRow(
  student
){

  const classId =
    normalizeId(
      teacherAttendanceWorkspaceState
        .classId
    );

  const studentId =
    normalizeId(
      student?._id ||
      student?.id
    );

  const date =
    teacherAttendanceWorkspaceState
      .date;

  const record =
    getTeacherAttendanceRecord(
      classId,
      studentId,
      date
    );

  const currentStatus =
    normalizeTeacherAttendanceStatus(
      record?.status
    );

  const name =
    getTeacherAttendanceStudentName(
      student
    );

  const email =
    safeString(
      student?.email,
      "Student"
    );

  const avatar =
    getTeacherAttendanceStudentAvatar(
      student
    );

  const saving =
    teacherAttendanceWorkspaceState
      .savingStudentIds
      .has(
        studentId
      );


  return `
    <div
      class="teacher-attendance-student-row"
      data-student-id="${escapeAttribute(studentId)}"
    >

      <!-- ===============================================
           STUDENT
      ================================================ -->

      <button
        type="button"
        class="teacher-attendance-student-main"
        data-teacher-action="attendance-student-history"
        data-student-id="${escapeAttribute(studentId)}"
      >

        <img
          src="${escapeAttribute(avatar)}"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
        />

        <span>

          <strong>
            ${escapeHtml(name)}
          </strong>

          <small>
            ${escapeHtml(email)}
          </small>

        </span>

      </button>


      <!-- ===============================================
           STATUS
      ================================================ -->

      <div
        class="teacher-attendance-status-options"
      >

        ${createTeacherAttendanceStatusButton({
          studentId,
          status:
            "present",
          activeStatus:
            currentStatus,
          saving
        })}

        ${createTeacherAttendanceStatusButton({
          studentId,
          status:
            "late",
          activeStatus:
            currentStatus,
          saving
        })}

        ${createTeacherAttendanceStatusButton({
          studentId,
          status:
            "absent",
          activeStatus:
            currentStatus,
          saving
        })}

        ${createTeacherAttendanceStatusButton({
          studentId,
          status:
            "excused",
          activeStatus:
            currentStatus,
          saving
        })}

      </div>


      <!-- ===============================================
           CURRENT RECORD
      ================================================ -->

      <div
        class="teacher-attendance-record-meta"
      >

        <span>
          ${
            currentStatus
              ? escapeHtml(
                  getTeacherAttendanceStatusLabel(
                    currentStatus
                  )
                )
              : "Not marked"
          }
        </span>

        <small>
          ${
            record?.updatedAt ||
            record?.createdAt
              ? escapeHtml(
                  formatRelativeDate(
                    record.updatedAt ||
                    record.createdAt
                  )
                )
              : "No record"
          }
        </small>

      </div>

    </div>
  `;

}


/* =========================================================
   ATTENDANCE ROSTER
========================================================= */

function renderTeacherAttendanceRoster(){

  const container =
    $(
      "teacherAttendanceRoster"
    );


  if (
    !container
  ){

    return;

  }


  const classItem =
    getTeacherAttendanceSelectedClass();


  if (
    !classItem
  ){

    container.innerHTML = `
      <div
        class="teacher-loading-state"
      >
        <i
          class="fa-solid fa-chalkboard-user"
          aria-hidden="true"
        ></i>

        <span>
          Select a class to load attendance.
        </span>
      </div>
    `;


    renderTeacherAttendanceStudentHistory(
      ""
    );


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
            class="fa-solid fa-users"
            aria-hidden="true"
          ></i>
        </div>

        <h3>
          No students found
        </h3>

        <p>
          ${
            teacherAttendanceWorkspaceState
              .search
              ? "No student matches the current search."
              : "This class does not currently have students in its roster."
          }
        </p>

      </div>
    `;


    return;

  }


  container.innerHTML = `

    <div
      class="teacher-attendance-roster-head"
      aria-hidden="true"
    >
      <span>
        Student
      </span>

      <span>
        Attendance status
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


  container
    .querySelectorAll(
      ".teacher-attendance-student-main img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            image.onerror =
              null;

            image.src =
              FALLBACK_AVATAR;

          };

      }
    );

}


/* =========================================================
   STUDENT ATTENDANCE HISTORY SUMMARY
========================================================= */

function getTeacherAttendanceStudentHistorySummary(
  studentId
){

  const records =
    getTeacherAttendanceStudentRecords(
      studentId
    );


  const summary = {

    total:
      records.length,

    present:
      0,

    late:
      0,

    absent:
      0,

    excused:
      0,

    rate:
      0

  };


  records.forEach(
    record => {

      const status =
        normalizeTeacherAttendanceStatus(
          record?.status
        );


      if (
        status &&
        Object.prototype
          .hasOwnProperty
          .call(
            summary,
            status
          )
      ){

        summary[
          status
        ] +=
          1;

      }

    }
  );


  const considered =
    summary.present +
    summary.late +
    summary.absent +
    summary.excused;


  summary.rate =
    considered
      ? clampPercentage(
          (
            (
              summary.present +
              summary.late
            ) /
            considered
          ) *
          100
        )
      : 0;


  return summary;

}


/* =========================================================
   STUDENT HISTORY
========================================================= */

function renderTeacherAttendanceStudentHistory(
  studentId =
    teacherAttendanceWorkspaceState
      .selectedStudentId
){

  const container =
    $(
      "teacherAttendanceStudentHistory"
    );


  if (
    !container
  ){

    return;

  }


  const normalizedStudentId =
    normalizeId(
      studentId
    );


  if (
    !normalizedStudentId
  ){

    teacherAttendanceWorkspaceState
      .selectedStudentId =
      "";

    container.hidden =
      true;

    container.innerHTML =
      "";

    return;

  }


  const studentRecord =
    getTeacherStudentById(
      normalizedStudentId
    );

  const student =
    studentRecord
      ?.student ||
    getTeacherAttendanceClassStudents(
      teacherAttendanceWorkspaceState
        .classId
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

    container.hidden =
      true;

    container.innerHTML =
      "";

    return;

  }


  teacherAttendanceWorkspaceState
    .selectedStudentId =
    normalizedStudentId;


  const records =
    getTeacherAttendanceStudentRecords(
      normalizedStudentId
    );

  const summary =
    getTeacherAttendanceStudentHistorySummary(
      normalizedStudentId
    );

  const name =
    getTeacherAttendanceStudentName(
      student
    );

  const avatar =
    getTeacherAttendanceStudentAvatar(
      student
    );


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
          data-teacher-action="close-attendance-history"
          aria-label="Close attendance history"
        >
          <i
            class="fa-solid fa-xmark"
            aria-hidden="true"
          ></i>
        </button>


        <img
          src="${escapeAttribute(avatar)}"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
        />


        <div>

          <span>
            Student attendance
          </span>

          <strong>
            ${escapeHtml(name)}
          </strong>

          <small>
            ${
              summary.total
                ? `${summary.rate}% attendance`
                : "No attendance history yet"
            }
          </small>

        </div>

      </header>


      <div
        class="teacher-attendance-history-summary"
      >

        <div>
          <strong>
            ${summary.present}
          </strong>

          <span>
            Present
          </span>
        </div>


        <div>
          <strong>
            ${summary.late}
          </strong>

          <span>
            Late
          </span>
        </div>


        <div>
          <strong>
            ${summary.absent}
          </strong>

          <span>
            Absent
          </span>
        </div>

      </div>


      <div
        class="teacher-attendance-history-list"
      >

        ${
          records.length
            ? records
                .slice(
                  0,
                  30
                )
                .map(
                  record => {

                    const status =
                      normalizeTeacherAttendanceStatus(
                        record.status
                      );


                    return `
                      <article
                        class="teacher-attendance-history-item"
                      >

                        <div>
                          <strong>
                            ${escapeHtml(
                              formatDate(
                                record.date
                              )
                            )}
                          </strong>

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
                        </div>


                        <span
                          class="teacher-attendance-history-status is-${escapeAttribute(status)}"
                        >
                          ${escapeHtml(
                            getTeacherAttendanceStatusLabel(
                              status
                            )
                          )}
                        </span>

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
                  No attendance records are available for this student yet.
                </div>
              `
        }

      </div>

    </section>
  `;


  const image =
    container.querySelector(
      ".teacher-attendance-history-header > img"
    );


  if (
    image
  ){

    image.onerror =
      () => {

        image.onerror =
          null;

        image.src =
          FALLBACK_AVATAR;

      };

  }

}


/* =========================================================
   BUILD ATTENDANCE WRITE PAYLOAD

   IMPORTANT SECURITY IMPROVEMENT:

   We do NOT send:
     schoolId
     teacherId
     markedBy

   The current backend derives those authoritatively.

   Browser supplies only the actual attendance information.
========================================================= */

function buildTeacherAttendancePayload(
  studentId,
  status
){

  const classId =
    normalizeId(
      teacherAttendanceWorkspaceState
        .classId
    );

  const normalizedStudentId =
    normalizeId(
      studentId
    );

  const normalizedStatus =
    normalizeTeacherAttendanceStatus(
      status
    );

  const date =
    getTeacherAttendanceApiDate(
      teacherAttendanceWorkspaceState
        .date
    );


  if (
    !classId
  ){

    throw new AIFTApiError(
      "Please select a class first.",
      {
        code:
          "ATTENDANCE_CLASS_REQUIRED"
      }
    );

  }


  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    throw new AIFTApiError(
      "The selected class is not available to this teacher.",
      {
        code:
          "ATTENDANCE_CLASS_UNAVAILABLE"
      }
    );

  }


  if (
    !normalizedStudentId
  ){

    throw new AIFTApiError(
      "The selected student could not be identified.",
      {
        code:
          "ATTENDANCE_STUDENT_REQUIRED"
      }
    );

  }


  const enrolled =
    getTeacherAttendanceClassStudents(
      classId
    )
      .some(
        student =>
          sameId(
            student?._id ||
            student?.id,
            normalizedStudentId
          )
      );


  if (
    !enrolled
  ){

    throw new AIFTApiError(
      "The selected student is not enrolled in this class.",
      {
        code:
          "ATTENDANCE_STUDENT_NOT_ENROLLED"
      }
    );

  }


  if (
    !date
  ){

    throw new AIFTApiError(
      "Please select a valid attendance date.",
      {
        code:
          "ATTENDANCE_DATE_REQUIRED"
      }
    );

  }


  if (
    !normalizedStatus
  ){

    throw new AIFTApiError(
      "Please select a valid attendance status.",
      {
        code:
          "ATTENDANCE_STATUS_INVALID"
      }
    );

  }


  return {

    classId,

    studentId:
      normalizedStudentId,

    date,

    status:
      normalizedStatus,

    source:
      "manual"

  };

}


/* =========================================================
   REPLACE ATTENDANCE RECORD IN STATE

   Match primarily by returned _id.

   Fall back to the unique attendance identity:
     classId + studentId + date
========================================================= */

function replaceTeacherAttendanceRecordInState(
  savedRecord
){

  if (
    !savedRecord ||
    typeof savedRecord !==
      "object"
  ){

    return false;

  }


  const recordId =
    normalizeId(
      savedRecord._id ||
      savedRecord.id
    );

  const classId =
    normalizeId(
      savedRecord
        ?.classId
        ?._id ||
      savedRecord
        ?.classId
    );

  const studentId =
    normalizeId(
      savedRecord
        ?.studentId
        ?._id ||
      savedRecord
        ?.studentId
    );

  const dateKey =
    getTeacherAttendanceRecordDateKey(
      savedRecord
    );


  let index =
    -1;


  if (
    recordId
  ){

    index =
      state.attendance
        .findIndex(
          record =>
            sameId(
              record?._id ||
              record?.id,
              recordId
            )
        );

  }


  if (
    index <
    0 &&
    classId &&
    studentId &&
    dateKey
  ){

    index =
      state.attendance
        .findIndex(
          record =>
            sameId(
              record
                ?.classId
                ?._id ||
              record
                ?.classId,
              classId
            ) &&
            sameId(
              record
                ?.studentId
                ?._id ||
              record
                ?.studentId,
              studentId
            ) &&
            getTeacherAttendanceRecordDateKey(
              record
            ) ===
            dateKey
        );

  }


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


  return true;

}


/* =========================================================
   SAVE ONE ATTENDANCE RECORD

   CURRENT BACKEND POST IS ALREADY AN UPSERT.

   This is important.

   The backend uses findOneAndUpdate() keyed by:
     schoolId
     classId
     studentId
     date

   Therefore Teacher Studio does NOT need to decide between
   POST and PATCH simply to change the daily status.

   One POST path removes a race condition and lets the server
   retain authority over the attendance identity.
========================================================= */

async function saveTeacherAttendanceRecord(
  studentId,
  status
){

  const payload =
    buildTeacherAttendancePayload(
      studentId,
      status
    );


  const response =
    await apiPost(
      "/api/attendance",
      payload
    );


  const savedRecord =
    response?.attendance ||
    response?.data ||
    response;


  if (
    savedRecord &&
    typeof savedRecord ===
      "object"
  ){

    replaceTeacherAttendanceRecordInState(
      savedRecord
    );

  }else{

    /*
      If backend response format changes, reload authoritative
      attendance rather than fabricating a local record.
    */

    await loadTeacherAttendance();

  }


  finalizeTeacherLoadedData();


  return savedRecord;

}


/* =========================================================
   UPDATE ONE STUDENT STATUS
========================================================= */

async function updateTeacherAttendanceStatus(
  studentId,
  status
){

  const normalizedStudentId =
    normalizeId(
      studentId
    );

  const normalizedStatus =
    normalizeTeacherAttendanceStatus(
      status
    );


  if (
    !normalizedStudentId ||
    !normalizedStatus
  ){

    return false;

  }


  if (
    teacherAttendanceWorkspaceState
      .savingStudentIds
      .has(
        normalizedStudentId
      )
  ){

    return false;

  }


  teacherAttendanceWorkspaceState
    .savingStudentIds
    .add(
      normalizedStudentId
    );


  renderTeacherAttendanceRoster();


  try{

    await saveTeacherAttendanceRecord(
      normalizedStudentId,
      normalizedStatus
    );


    renderTeacherAttendanceSummary();

    renderTeacherAttendanceRoster();

    renderTeacherDashboardStats();


    if (
      sameId(
        teacherAttendanceWorkspaceState
          .selectedStudentId,
        normalizedStudentId
      )
    ){

      renderTeacherAttendanceStudentHistory(
        normalizedStudentId
      );

    }


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "AIFT could not save attendance."
      ),
      {
        title:
          "Attendance not saved"
      }
    );


    return false;

  }finally{

    teacherAttendanceWorkspaceState
      .savingStudentIds
      .delete(
        normalizedStudentId
      );


    renderTeacherAttendanceRoster();

  }

}


/* =========================================================
   BULK ATTENDANCE

   Bulk updates only the CURRENTLY VISIBLE roster.

   That means the search box can intentionally limit who is
   affected.

   Each record still goes through the authenticated backend.
========================================================= */

async function saveTeacherBulkAttendance(
  status
){

  if (
    teacherAttendanceWorkspaceState
      .bulkSaving
  ){

    return false;

  }


  const normalizedStatus =
    normalizeTeacherAttendanceStatus(
      status
    );


  if (
    !normalizedStatus
  ){

    return false;

  }


  const students =
    getTeacherAttendanceRoster();


  if (
    !students.length
  ){

    notifyAIFTInfo(
      "There are no visible students to update.",
      {
        title:
          "No attendance changes"
      }
    );


    return false;

  }


  teacherAttendanceWorkspaceState
    .bulkSaving =
    true;


  renderTeacherAttendanceBulkActions();


  try{

    /*
      Sequentially process reasonable chunks instead of
      launching an uncontrolled request burst for large
      rosters.
    */

    const batchSize =
      8;

    const failures =
      [];


    for (
      let index = 0;
      index < students.length;
      index += batchSize
    ){

      const batch =
        students.slice(
          index,
          index +
          batchSize
        );


      const results =
        await Promise.allSettled(
          batch.map(
            student =>
              saveTeacherAttendanceRecord(
                student?._id ||
                student?.id,
                normalizedStatus
              )
          )
        );


      results.forEach(
        (
          result,
          resultIndex
        ) => {

          if (
            result.status ===
            "rejected"
          ){

            failures.push({
              student:
                batch[
                  resultIndex
                ],

              error:
                result.reason
            });

          }

        }
      );

    }


    /*
      One authoritative reload ensures our complete attendance
      state is synchronized after a bulk operation.
    */

    await loadTeacherAttendance();

    finalizeTeacherLoadedData();


    renderTeacherAttendanceWorkspace();

    renderTeacherDashboardStats();


    if (
      failures.length
    ){

      notifyAIFTWarning(
        `${failures.length} attendance ${
          failures.length === 1
            ? "record"
            : "records"
        } could not be saved.`,
        {
          title:
            "Attendance partially saved"
        }
      );


      failures.forEach(
        failure => {

          reportOptionalRequestError(
            `Attendance for ${
              getTeacherAttendanceStudentName(
                failure.student
              )
            }`,
            failure.error
          );

        }
      );


      return false;

    }


    notifyAIFTSuccess(
      `All visible students were marked ${getTeacherAttendanceStatusLabel(
        normalizedStatus
      ).toLowerCase()}.`,
      {
        title:
          "Attendance saved"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "AIFT could not save attendance."
      ),
      {
        title:
          "Attendance not saved"
      }
    );


    return false;

  }finally{

    teacherAttendanceWorkspaceState
      .bulkSaving =
      false;


    renderTeacherAttendanceBulkActions();

  }

}


/* =========================================================
   LOAD ATTENDANCE FOR SELECTED CLASS

   This uses the strongest backend authorization path:
     GET /api/attendance?classId=<assigned-class>
========================================================= */

async function loadTeacherSelectedClassAttendance(){

  const classId =
    normalizeId(
      teacherAttendanceWorkspaceState
        .classId
    );


  if (
    !classId
  ){

    return [];

  }


  const records =
    await loadTeacherAttendanceForClass(
      classId
    );


  /*
    Replace only this class's attendance records while
    preserving records already loaded for other classes.
  */

  state.attendance =
    state.attendance
      .filter(
        record =>
          !sameId(
            record
              ?.classId
              ?._id ||
            record
              ?.classId,
            classId
          )
      );


  state.attendance.push(
    ...asArray(
      records
    )
  );


  state.attendance =
    uniqueById(
      state.attendance
    );


  finalizeTeacherLoadedData();


  return records;

}


/* =========================================================
   ATTENDANCE TOOLBAR CONTROLS

   Toolbar is dynamic, so handlers are applied immediately
   after every render.

   These are local form controls only.

   Global action buttons still use the authoritative Studio
   action controller later.
========================================================= */

function bindTeacherAttendanceToolbarControls(){

  const classFilter =
    $(
      "teacherAttendanceClassFilter"
    );

  const dateInput =
    $(
      "teacherAttendanceDate"
    );

  const searchInput =
    $(
      "teacherAttendanceSearch"
    );


  if (
    classFilter
  ){

    classFilter.onchange =
      async event => {

        const classId =
          normalizeId(
            event.target.value
          );


        teacherAttendanceWorkspaceState
          .classId =
          classId;

        teacherAttendanceWorkspaceState
          .selectedStudentId =
          "";


        renderTeacherAttendanceHeader();

        renderTeacherAttendanceSummary();

        renderTeacherAttendanceBulkActions();

        renderTeacherAttendanceRoster();

        renderTeacherAttendanceStudentHistory(
          ""
        );


        if (
          !classId
        ){

          return;

        }


        try{

          await loadTeacherSelectedClassAttendance();


          renderTeacherAttendanceSummary();

          renderTeacherAttendanceRoster();

        }catch(
          error
        ){

          notifyAIFTError(
            getErrorMessage(
              error,
              "Attendance for this class could not be loaded."
            ),
            {
              title:
                "Attendance unavailable"
            }
          );

        }

      };

  }


  if (
    dateInput
  ){

    dateInput.onchange =
      event => {

        const date =
          normalizeTeacherAttendanceDate(
            event.target.value
          );


        if (
          !date
        ){

          notifyAIFTError(
            "Please select a valid attendance date.",
            {
              title:
                "Invalid date"
            }
          );


          event.target.value =
            teacherAttendanceWorkspaceState
              .date;


          return;

        }


        teacherAttendanceWorkspaceState
          .date =
          date;


        renderTeacherAttendanceSummary();

        renderTeacherAttendanceRoster();

      };

  }


  if (
    searchInput
  ){

    searchInput.oninput =
      event => {

        teacherAttendanceWorkspaceState
          .search =
          safeString(
            event.target.value
          );


        renderTeacherAttendanceRoster();

      };

  }

}


/* =========================================================
   ATTENDANCE TODAY
========================================================= */

function setTeacherAttendanceToToday(){

  teacherAttendanceWorkspaceState
    .date =
    getTeacherLocalDateInputValue();


  renderTeacherAttendanceToolbar();

  renderTeacherAttendanceSummary();

  renderTeacherAttendanceRoster();

}


/* =========================================================
   PREPARE ATTENDANCE CLASS

   Used when Attendance is opened from a specific class card.
========================================================= */

function prepareTeacherAttendanceClass(
  classId
){

  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    return false;

  }


  teacherAttendanceWorkspaceState
    .classId =
    normalizeId(
      classId
    );

  teacherAttendanceWorkspaceState
    .date =
    getTeacherLocalDateInputValue();

  teacherAttendanceWorkspaceState
    .search =
    "";

  teacherAttendanceWorkspaceState
    .selectedStudentId =
    "";


  return true;

}


/* =========================================================
   REFRESH ATTENDANCE
========================================================= */

async function refreshTeacherAttendanceWorkspace(){

  if (
    teacherAttendanceWorkspaceState
      .loading
  ){

    return false;

  }


  teacherAttendanceWorkspaceState
    .loading =
    true;


  renderTeacherAttendanceToolbar();


  try{

    if (
      teacherAttendanceWorkspaceState
        .classId
    ){

      await loadTeacherSelectedClassAttendance();

    }else{

      await loadTeacherAttendance();

      finalizeTeacherLoadedData();

    }


    renderTeacherAttendanceWorkspace();

    renderTeacherDashboardStats();


    notifyAIFTSuccess(
      "Attendance records are up to date.",
      {
        title:
          "Attendance refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Attendance could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherAttendanceWorkspaceState
      .loading =
      false;


    renderTeacherAttendanceToolbar();

  }

}


/* =========================================================
   COMPLETE ATTENDANCE WORKSPACE
========================================================= */

function renderTeacherAttendanceWorkspace(){

  renderTeacherAttendanceHeader();

  renderTeacherAttendanceToolbar();

  renderTeacherAttendanceSummary();

  renderTeacherAttendanceBulkActions();

  renderTeacherAttendanceRoster();


  if (
    teacherAttendanceWorkspaceState
      .selectedStudentId
  ){

    renderTeacherAttendanceStudentHistory();

  }else{

    renderTeacherAttendanceStudentHistory(
      ""
    );

  }

}


/* =========================================================
   INITIALIZE ATTENDANCE WORKSPACE
========================================================= */

function initializeTeacherAttendanceWorkspace(){

  if (
    teacherAttendanceWorkspaceState
      .initialized
  ){

    renderTeacherAttendanceWorkspace();

    return;

  }


  teacherAttendanceWorkspaceState
    .initialized =
    true;


  /*
    If the teacher only has one class, automatically selecting
    it is useful and unambiguous.

    With multiple classes, preserve the explicit selection
    requirement to prevent marking the wrong roster.
  */

  const classes =
    getTeacherClasses();


  if (
    classes.length ===
      1 &&
    !teacherAttendanceWorkspaceState
      .classId
  ){

    teacherAttendanceWorkspaceState
      .classId =
      normalizeId(
        classes[0]?._id ||
        classes[0]?.id
      );

  }


  renderTeacherAttendanceWorkspace();

}


/* =========================================================
   REFRESH ATTENDANCE UI FROM CURRENT STATE
========================================================= */

function refreshTeacherAttendanceFromCurrentState(){

  renderTeacherAttendanceSummary();

  renderTeacherAttendanceBulkActions();

  renderTeacherAttendanceRoster();


  if (
    teacherAttendanceWorkspaceState
      .selectedStudentId
  ){

    renderTeacherAttendanceStudentHistory();

  }

}


/* =========================================================
   PART 8 COMPLETE

   CURRENT DESIGN PRESERVED.

   AUTHORITATIVE BACKEND WRITE:
     POST /api/attendance

   CURRENT BACKEND POST IS AN UPSERT, SO A TEACHER CAN CHANGE
   A STUDENT'S STATUS WITHOUT THE FRONTEND HAVING TO CHOOSE
   BETWEEN CREATE AND PATCH.

   THE BROWSER DOES NOT SEND:
     schoolId
     teacherId
     markedBy

   because the backend now derives those values from the
   authenticated user and real class.

   THE CENTRAL ACTION CONTROLLER WILL LATER HANDLE:

     set-attendance-status
       -> updateTeacherAttendanceStatus()

     bulk-attendance
       -> saveTeacherBulkAttendance()

     attendance-student-history
       -> renderTeacherAttendanceStudentHistory()

     close-attendance-history
       -> clear selectedStudentId

     attendance-today
       -> setTeacherAttendanceToToday()

     refresh-attendance
       -> refreshTeacherAttendanceWorkspace()

     class attendance shortcut
       -> prepareTeacherAttendanceClass()
          + navigate to attendance
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 9

   SCHEDULE WORKSPACE
   ---------------------------------------------------------
   1. Workspace state
   2. Schedule identity helpers
   3. Date/time normalization
   4. Status calculation
   5. Filtering
   6. Existing class filter
   7. Existing list design
   8. Existing calendar design
   9. Month navigation
   10. View switching
   11. Refresh
   12. Class shortcut preparation
   13. Schedule state reconciliation
   14. Workspace initialization

   DESIGN CONTRACT
   ---------------------------------------------------------
   Uses current teacher.html:

   #teacherScheduleClassFilter
   #teacherScheduleList
   #teacherScheduleCalendar
   #teacherScheduleEmpty
   #teacherCalendarMonth
   #teacherCalendarGrid

   Uses existing:
   [data-teacher-schedule-view="list"]
   [data-teacher-schedule-view="calendar"]

   No new Schedule page is generated.
========================================================= */


/* =========================================================
   SCHEDULE WORKSPACE STATE
========================================================= */

const teacherScheduleWorkspaceState = {

  classId:
    "",

  view:
    "list",

  calendarDate:
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    ),

  selectedScheduleId:
    "",

  refreshing:
    false,

  initialized:
    false

};


/* =========================================================
   SCHEDULE ID
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
    schedule
      ?.classId
      ?._id ||
    schedule
      ?.classId
  );

}


/* =========================================================
   SCHEDULE CLASS RECORD
========================================================= */

function getTeacherScheduleClass(
  schedule
){

  const value =
    schedule?.classId;


  if (
    value &&
    typeof value ===
      "object"
  ){

    return (
      getTeacherClassById(
        value._id ||
        value.id
      ) ||
      value
    );

  }


  return (
    getTeacherClassById(
      value
    ) ||
    null
  );

}


/* =========================================================
   SCHEDULE BY ID
========================================================= */

function getTeacherScheduleById(
  scheduleId
){

  const normalizedScheduleId =
    normalizeId(
      scheduleId
    );


  if (
    !normalizedScheduleId
  ){

    return null;

  }


  return (
    getTeacherSchedules()
      .find(
        schedule =>
          sameId(
            getTeacherScheduleId(
              schedule
            ),
            normalizedScheduleId
          )
      ) ||
    null
  );

}


/* =========================================================
   SCHEDULE DATE STRING

   Return YYYY-MM-DD.

   Preserve a native backend date string when possible rather
   than needlessly round-tripping it through UTC.
========================================================= */

function getTeacherScheduleDateString(
  schedule
){

  const value =

    schedule?.date ||

    schedule?.startDate ||

    schedule?.scheduledAt ||

    schedule?.startDateTime ||

    null;


  if (
    !value
  ){

    return "";

  }


  if (
    typeof value ===
      "string"
  ){

    const dateMatch =
      value.match(
        /^(\d{4}-\d{2}-\d{2})/
      );


    if (
      dateMatch
    ){

      return dateMatch[1];

    }

  }


  const date =
    toValidDate(
      value
    );


  if (
    !date
  ){

    return "";

  }


  return getTeacherLocalDateInputValue(
    date
  );

}


/* =========================================================
   START TIME

   Supports the actual schedule fields used across the
   existing frontend/backend evolution.
========================================================= */

function getTeacherScheduleStartTime(
  schedule
){

  return safeString(

    schedule?.startTime ||

    schedule?.time

  );

}


/* =========================================================
   END TIME
========================================================= */

function getTeacherScheduleEndTime(
  schedule
){

  return safeString(
    schedule?.endTime
  );

}


/* =========================================================
   LOCAL DATE + TIME

   Schedule dates represent teaching calendar dates, so this
   uses local browser time instead of forcing UTC.
========================================================= */

function getTeacherScheduleLocalDateTime(
  schedule,
  {
    useEndTime = false
  } = {}
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
    useEndTime
      ? (
          getTeacherScheduleEndTime(
            schedule
          ) ||
          getTeacherScheduleStartTime(
            schedule
          ) ||
          "00:00"
        )
      : (
          getTeacherScheduleStartTime(
            schedule
          ) ||
          "00:00"
        );


  const parsed =
    new Date(
      `${date}T${time}`
    );


  return Number.isNaN(
    parsed.getTime()
  )
    ? null
    : parsed;

}


/* =========================================================
   SCHEDULE STATUS
========================================================= */

function getTeacherScheduleStatus(
  schedule
){

  const explicitStatus =
    safeString(
      schedule?.status
    )
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
    [
      "completed",
      "closed"
    ].includes(
      explicitStatus
    )
  ){

    return "completed";

  }


  const dateString =
    getTeacherScheduleDateString(
      schedule
    );


  if (
    !dateString
  ){

    return "upcoming";

  }


  const today =
    getTeacherLocalDateInputValue();


  if (
    dateString ===
    today
  ){

    const end =
      getTeacherScheduleLocalDateTime(
        schedule,
        {
          useEndTime:
            true
        }
      );


    if (
      end &&
      getTeacherScheduleEndTime(
        schedule
      ) &&
      end.getTime() <
        Date.now()
    ){

      return "completed";

    }


    return "today";

  }


  const start =
    getTeacherScheduleLocalDateTime(
      schedule
    );


  if (
    start &&
    start.getTime() <
      Date.now()
  ){

    return "completed";

  }


  return "upcoming";

}


/* =========================================================
   SCHEDULE STATUS LABEL
========================================================= */

function getTeacherScheduleStatusLabel(
  schedule
){

  switch(
    getTeacherScheduleStatus(
      schedule
    )
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

function formatTeacherScheduleClockTime(
  value
){

  const time =
    safeString(
      value
    );


  if (
    !time
  ){

    return "";

  }


  const match =
    time.match(
      /^(\d{1,2}):(\d{2})/
    );


  if (
    !match
  ){

    return time;

  }


  const hour =
    Number(
      match[1]
    );

  const minute =
    Number(
      match[2]
    );


  if (
    !Number.isFinite(
      hour
    ) ||
    !Number.isFinite(
      minute
    )
  ){

    return time;

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
      hour:
        "numeric",

      minute:
        "2-digit"
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

    return formatTeacherScheduleClockTime(
      start
    );

  }


  return `${formatTeacherScheduleClockTime(
    start
  )} – ${formatTeacherScheduleClockTime(
    end
  )}`;

}


/* =========================================================
   SCHEDULE MEETING LINK
========================================================= */

function getTeacherScheduleMeetingLink(
  schedule
){

  return normalizeHttpUrl(
    schedule?.meetingLink
  );

}


/* =========================================================
   SCHEDULE NOTES
========================================================= */

function getTeacherScheduleNotes(
  schedule
){

  return safeString(
    schedule?.notes
  );

}


/* =========================================================
   FILTERED SCHEDULES
========================================================= */

function getFilteredTeacherScheduleRecords(){

  const classId =
    normalizeId(
      teacherScheduleWorkspaceState
        .classId
    );


  let schedules = [
    ...getTeacherSchedules()
  ];


  if (
    classId
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


  schedules.sort(
    (
      first,
      second
    ) => {

      const firstDate =
        getTeacherScheduleLocalDateTime(
          first
        );

      const secondDate =
        getTeacherScheduleLocalDateTime(
          second
        );


      return (
        (
          firstDate?.getTime() ||
          0
        ) -
        (
          secondDate?.getTime() ||
          0
        )
      );

    }
  );


  return schedules;

}


/* =========================================================
   LIST SCHEDULES

   Upcoming and today are shown first.

   Recent completed sessions remain visible below them instead
   of silently disappearing.
========================================================= */

function getTeacherScheduleListRecords(){

  const schedules =
    getFilteredTeacherScheduleRecords();


  const active =
    schedules.filter(
      schedule =>
        [
          "today",
          "upcoming"
        ].includes(
          getTeacherScheduleStatus(
            schedule
          )
        )
    );


  const completed =
    schedules
      .filter(
        schedule =>
          [
            "completed",
            "cancelled"
          ].includes(
            getTeacherScheduleStatus(
              schedule
            )
          )
      )
      .sort(
        (
          first,
          second
        ) =>
          (
            getTeacherScheduleLocalDateTime(
              second
            )?.getTime() ||
            0
          ) -
          (
            getTeacherScheduleLocalDateTime(
              first
            )?.getTime() ||
            0
          )
      )
      .slice(
        0,
        10
      );


  return [
    ...active,
    ...completed
  ];

}


/* =========================================================
   SCHEDULE CLASS FILTER
========================================================= */

function renderTeacherScheduleClassFilter(){

  const select =
    $(
      "teacherScheduleClassFilter"
    );


  if (
    !select
  ){

    return;

  }


  const selectedValue =
    teacherScheduleWorkspaceState
      .classId;


  select.innerHTML = `
    <option value="">
      All classes
    </option>

    ${
      getTeacherClasses()
        .map(
          classItem => {

            const classId =
              normalizeId(
                classItem?._id ||
                classItem?.id
              );


            return `
              <option
                value="${escapeAttribute(classId)}"
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
  `;


  select.value =
    selectedValue;


  if (
    select.value !==
    selectedValue
  ){

    teacherScheduleWorkspaceState
      .classId =
      "";

    select.value =
      "";

  }


  select.onchange =
    event => {

      teacherScheduleWorkspaceState
        .classId =
        normalizeId(
          event.target.value
        );


      renderTeacherScheduleWorkspace();

    };

}


/* =========================================================
   SCHEDULE VIEW BUTTONS
========================================================= */

function renderTeacherScheduleViewButtons(){

  $all(
    "[data-teacher-schedule-view]"
  )
    .forEach(
      button => {

        const view =
          safeString(
            button.dataset
              .teacherScheduleView
          );


        const active =
          view ===
          teacherScheduleWorkspaceState
            .view;


        button.classList.toggle(
          "active",
          active
        );


        button.setAttribute(
          "aria-pressed",
          String(
            active
          )
        );

      }
    );

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

  const title =
    getTeacherScheduleTitle(
      schedule
    );

  const classTitle =
    getTeacherClassTitle(
      classItem ||
      {}
    );

  const dateString =
    getTeacherScheduleDateString(
      schedule
    );

  const date =
    dateString
      ? new Date(
          `${dateString}T12:00:00`
        )
      : null;

  const status =
    getTeacherScheduleStatus(
      schedule
    );

  const notes =
    getTeacherScheduleNotes(
      schedule
    );

  const meetingLink =
    getTeacherScheduleMeetingLink(
      schedule
    );


  return `
    <article
      class="teacher-schedule-card"
      data-schedule-id="${escapeAttribute(scheduleId)}"
    >

      <!-- ===============================================
           DATE
      ================================================ -->

      <div
        class="teacher-schedule-date"
      >

        <strong>
          ${
            date
              ? escapeHtml(
                  String(
                    date.getDate()
                  ).padStart(
                    2,
                    "0"
                  )
                )
              : "—"
          }
        </strong>

        <span>
          ${
            date
              ? escapeHtml(
                  date.toLocaleDateString(
                    [],
                    {
                      month:
                        "short"
                    }
                  )
                )
              : ""
          }
        </span>

      </div>


      <!-- ===============================================
           CONTENT
      ================================================ -->

      <div
        class="teacher-schedule-content"
      >

        <div
          class="teacher-schedule-title-row"
        >

          <h3>
            ${escapeHtml(title)}
          </h3>

          <span
            class="teacher-schedule-status ${escapeAttribute(status)}"
          >
            ${escapeHtml(
              getTeacherScheduleStatusLabel(
                schedule
              )
            )}
          </span>

        </div>


        <div
          class="teacher-schedule-class"
        >
          <i
            class="fa-solid fa-chalkboard-user"
            aria-hidden="true"
          ></i>

          <span>
            ${escapeHtml(classTitle)}
          </span>
        </div>


        <div
          class="teacher-schedule-meta"
        >

          <span>
            <i
              class="fa-regular fa-clock"
              aria-hidden="true"
            ></i>

            ${escapeHtml(
              getTeacherScheduleTimeRange(
                schedule
              )
            )}
          </span>


          ${
            date
              ? `
                <span>
                  <i
                    class="fa-regular fa-calendar"
                    aria-hidden="true"
                  ></i>

                  ${escapeHtml(
                    formatDate(
                      date
                    )
                  )}
                </span>
              `
              : ""
          }

        </div>


        ${
          notes
            ? `
              <p
                class="teacher-schedule-notes"
              >
                ${escapeHtml(notes)}
              </p>
            `
            : ""
        }

      </div>


      <!-- ===============================================
           ACTIONS
      ================================================ -->

      <div
        class="teacher-schedule-actions"
      >

        ${
          meetingLink &&
          ![
            "completed",
            "cancelled"
          ].includes(
            status
          )
            ? `
              <a
                href="${escapeAttribute(meetingLink)}"
                target="_blank"
                rel="noopener noreferrer"
                class="teacher-schedule-action primary"
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


        <button
          type="button"
          class="teacher-schedule-action"
          data-teacher-action="edit-schedule"
          data-schedule-id="${escapeAttribute(scheduleId)}"
        >
          <i
            class="fa-regular fa-pen-to-square"
            aria-hidden="true"
          ></i>

          Edit
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   SCHEDULE EMPTY STATE
========================================================= */

function renderTeacherScheduleEmptyState(
  schedules
){

  const empty =
    $(
      "teacherScheduleEmpty"
    );


  if (
    !empty
  ){

    return;

  }


  const hasResults =
    schedules.length >
    0;


  empty.hidden =
    hasResults;


  if (
    hasResults
  ){

    return;

  }


  const heading =
    empty.querySelector(
      "h2"
    );

  const description =
    empty.querySelector(
      "p"
    );


  if (
    heading
  ){

    heading.textContent =
      teacherScheduleWorkspaceState
        .classId
        ? "No schedule for this class"
        : "No scheduled classes";

  }


  if (
    description
  ){

    description.textContent =
      teacherScheduleWorkspaceState
        .classId
        ? "This class does not have any scheduled teaching sessions yet."
        : "You don't have any scheduled teaching sessions yet.";

  }

}


/* =========================================================
   SCHEDULE LIST
========================================================= */

function renderTeacherScheduleList(){

  const container =
    $(
      "teacherScheduleList"
    );


  if (
    !container
  ){

    return;

  }


  const schedules =
    getTeacherScheduleListRecords();


  renderTeacherScheduleEmptyState(
    schedules
  );


  if (
    !schedules.length
  ){

    container.innerHTML =
      "";

    container.hidden =
      true;

    return;

  }


  container.hidden =
    false;


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
   CALENDAR MONTH LABEL
========================================================= */

function renderTeacherCalendarMonthLabel(){

  const label =
    $(
      "teacherCalendarMonth"
    );


  if (
    !label
  ){

    return;

  }


  label.textContent =
    teacherScheduleWorkspaceState
      .calendarDate
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


/* =========================================================
   CALENDAR SCHEDULE MAP
========================================================= */

function getTeacherCalendarScheduleMap(){

  const map =
    new Map();


  getFilteredTeacherScheduleRecords()
    .forEach(
      schedule => {

        const date =
          getTeacherScheduleDateString(
            schedule
          );


        if (
          !date
        ){

          return;

        }


        if (
          !map.has(
            date
          )
        ){

          map.set(
            date,
            []
          );

        }


        map.get(
          date
        ).push(
          schedule
        );

      }
    );


  return map;

}


/* =========================================================
   CALENDAR DATE KEY
========================================================= */

function getTeacherCalendarDateKey(
  date
){

  return getTeacherLocalDateInputValue(
    date
  );

}


/* =========================================================
   CREATE CALENDAR DAY
========================================================= */

function createTeacherCalendarDay(
  date,
  activeMonth,
  schedules
){

  const dateKey =
    getTeacherCalendarDateKey(
      date
    );

  const today =
    getTeacherLocalDateInputValue();

  const muted =
    date.getMonth() !==
    activeMonth;

  const isToday =
    dateKey ===
    today;


  const visibleEvents =
    schedules.slice(
      0,
      3
    );

  const additional =
    Math.max(
      0,
      schedules.length -
      visibleEvents.length
    );


  return `
    <button
      type="button"
      class="
        teacher-calendar-day
        ${
          muted
            ? "muted"
            : ""
        }
        ${
          isToday
            ? "today"
            : ""
        }
      "
      data-teacher-action="schedule-calendar-date"
      data-schedule-date="${escapeAttribute(dateKey)}"
    >

      <span
        class="teacher-calendar-day-number"
      >
        ${date.getDate()}
      </span>


      <span
        class="teacher-calendar-events"
      >

        ${
          visibleEvents
            .map(
              schedule => `
                <span
                  class="teacher-calendar-event"
                  title="${escapeAttribute(
                    `${getTeacherScheduleTitle(
                      schedule
                    )} · ${getTeacherScheduleTimeRange(
                      schedule
                    )}`
                  )}"
                >
                  ${escapeHtml(
                    getTeacherScheduleTitle(
                      schedule
                    )
                  )}
                </span>
              `
            )
            .join(
              ""
            )
        }


        ${
          additional
            ? `
              <span
                class="teacher-calendar-event"
              >
                +${additional} more
              </span>
            `
            : ""
        }

      </span>

    </button>
  `;

}


/* =========================================================
   CALENDAR
========================================================= */

function renderTeacherScheduleCalendar(){

  const grid =
    $(
      "teacherCalendarGrid"
    );


  if (
    !grid
  ){

    return;

  }


  renderTeacherCalendarMonthLabel();


  const reference =
    teacherScheduleWorkspaceState
      .calendarDate;

  const year =
    reference.getFullYear();

  const month =
    reference.getMonth();


  const firstOfMonth =
    new Date(
      year,
      month,
      1
    );

  const start =
    new Date(
      year,
      month,
      1 -
      firstOfMonth.getDay()
    );


  const scheduleMap =
    getTeacherCalendarScheduleMap();


  const days =
    [];


  for (
    let index = 0;
    index < 42;
    index += 1
  ){

    const date =
      new Date(
        start
      );


    date.setDate(
      start.getDate() +
      index
    );


    const key =
      getTeacherCalendarDateKey(
        date
      );


    days.push(
      createTeacherCalendarDay(
        date,
        month,
        scheduleMap.get(
          key
        ) ||
        []
      )
    );

  }


  grid.innerHTML =
    days.join(
      ""
    );

}


/* =========================================================
   SWITCH LIST / CALENDAR
========================================================= */

function setTeacherScheduleView(
  view
){

  if (
    ![
      "list",
      "calendar"
    ].includes(
      view
    )
  ){

    return false;

  }


  teacherScheduleWorkspaceState
    .view =
    view;


  renderTeacherScheduleWorkspace();


  return true;

}


/* =========================================================
   MONTH NAVIGATION
========================================================= */

function moveTeacherScheduleCalendarMonth(
  offset
){

  const amount =
    safeInteger(
      offset,
      0
    );


  const current =
    teacherScheduleWorkspaceState
      .calendarDate;


  teacherScheduleWorkspaceState
    .calendarDate =
    new Date(
      current.getFullYear(),
      current.getMonth() +
      amount,
      1
    );


  renderTeacherScheduleCalendar();

}


/* =========================================================
   PREPARE SCHEDULE CLASS

   Used when the teacher enters Schedule from a class card.
========================================================= */

function prepareTeacherScheduleClass(
  classId
){

  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    return false;

  }


  teacherScheduleWorkspaceState
    .classId =
    normalizeId(
      classId
    );

  teacherScheduleWorkspaceState
    .view =
    "list";


  return true;

}


/* =========================================================
   OPEN CALENDAR DATE

   We keep the existing List/Calendar model.

   Clicking a calendar date with schedules switches to List
   and limits the list visually by marking that day's events
   first rather than creating a new third schedule mode.
========================================================= */

function openTeacherScheduleCalendarDate(
  date
){

  const normalizedDate =
    normalizeTeacherAttendanceDate(
      date
    );


  if (
    !normalizedDate
  ){

    return false;

  }


  const matching =
    getFilteredTeacherScheduleRecords()
      .filter(
        schedule =>
          getTeacherScheduleDateString(
            schedule
          ) ===
          normalizedDate
      );


  if (
    !matching.length
  ){

    return false;

  }


  const first =
    matching[0];


  teacherScheduleWorkspaceState
    .selectedScheduleId =
    getTeacherScheduleId(
      first
    );


  /*
    Stay in calendar.

    The central action controller can open the schedule editor
    directly for the selected event later.
  */


  return true;

}


/* =========================================================
   REPLACE SCHEDULE IN STATE

   Used later by create/edit operations.
========================================================= */

function replaceTeacherScheduleInState(
  savedSchedule
){

  const scheduleId =
    getTeacherScheduleId(
      savedSchedule
    );


  if (
    !scheduleId
  ){

    return false;

  }


  const index =
    state.schedules
      .findIndex(
        schedule =>
          sameId(
            getTeacherScheduleId(
              schedule
            ),
            scheduleId
          )
      );


  if (
    index >=
    0
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


  finalizeTeacherLoadedData();


  return true;

}


/* =========================================================
   REMOVE SCHEDULE FROM STATE
========================================================= */

function removeTeacherScheduleFromState(
  scheduleId
){

  const normalizedScheduleId =
    normalizeId(
      scheduleId
    );


  if (
    !normalizedScheduleId
  ){

    return false;

  }


  const before =
    state.schedules.length;


  state.schedules =
    state.schedules
      .filter(
        schedule =>
          !sameId(
            getTeacherScheduleId(
              schedule
            ),
            normalizedScheduleId
          )
      );


  finalizeTeacherLoadedData();


  return (
    state.schedules.length <
    before
  );

}


/* =========================================================
   REFRESH SCHEDULE
========================================================= */

async function refreshTeacherScheduleWorkspace(){

  if (
    teacherScheduleWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherScheduleWorkspaceState
    .refreshing =
    true;


  const refreshButtons =
    $all(
      '[data-teacher-action="refresh-schedule"]'
    );


  refreshButtons.forEach(
    button => {

      button.disabled =
        true;

      button.setAttribute(
        "aria-busy",
        "true"
      );


      const icon =
        button.querySelector(
          "i"
        );


      if (
        icon
      ){

        icon.classList.add(
          "fa-spin"
        );

      }

    }
  );


  try{

    await loadTeacherSchedules();


    finalizeTeacherLoadedData();


    renderTeacherScheduleWorkspace();

    renderTeacherOverviewSchedule();


    notifyAIFTSuccess(
      "Your teaching schedule is up to date.",
      {
        title:
          "Schedule refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Your schedule could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherScheduleWorkspaceState
      .refreshing =
      false;


    refreshButtons.forEach(
      button => {

        button.disabled =
          false;

        button.setAttribute(
          "aria-busy",
          "false"
        );


        const icon =
          button.querySelector(
            "i"
          );


        if (
          icon
        ){

          icon.classList.remove(
            "fa-spin"
          );

        }

      }
    );

  }

}


/* =========================================================
   RENDER COMPLETE SCHEDULE WORKSPACE
========================================================= */

function renderTeacherScheduleWorkspace(){

  renderTeacherScheduleClassFilter();

  renderTeacherScheduleViewButtons();


  const list =
    $(
      "teacherScheduleList"
    );

  const calendar =
    $(
      "teacherScheduleCalendar"
    );

  const empty =
    $(
      "teacherScheduleEmpty"
    );


  if (
    teacherScheduleWorkspaceState
      .view ===
    "calendar"
  ){

    if (
      list
    ){

      list.hidden =
        true;

    }


    if (
      empty
    ){

      empty.hidden =
        true;

    }


    if (
      calendar
    ){

      calendar.hidden =
        false;

    }


    renderTeacherScheduleCalendar();


    return;

  }


  if (
    calendar
  ){

    calendar.hidden =
      true;

  }


  renderTeacherScheduleList();

}


/* =========================================================
   INITIALIZE SCHEDULE WORKSPACE
========================================================= */

function initializeTeacherScheduleWorkspace(){

  if (
    teacherScheduleWorkspaceState
      .initialized
  ){

    renderTeacherScheduleWorkspace();

    return;

  }


  teacherScheduleWorkspaceState
    .initialized =
    true;


  /*
    Current teacher.html already owns the view buttons.

    Property handlers avoid introducing another document-wide
    listener before the authoritative controller is installed.
  */

  $all(
    "[data-teacher-schedule-view]"
  )
    .forEach(
      button => {

        button.onclick =
          event => {

            event.preventDefault();


            setTeacherScheduleView(
              safeString(
                button.dataset
                  .teacherScheduleView
              )
            );

          };

      }
    );


  renderTeacherScheduleWorkspace();

}


/* =========================================================
   SCHEDULE VIEW REFRESH FROM CURRENT STATE
========================================================= */

function refreshTeacherScheduleFromCurrentState(){

  renderTeacherScheduleWorkspace();

}


/* =========================================================
   PART 9 COMPLETE

   CURRENT SCHEDULE DESIGN PRESERVED.

   THIS PART DOES NOT CREATE:
   - a second schedule page
   - a replacement calendar
   - a second router
   - guessed modal markup
   - guessed backend ownership fields

   CENTRAL ACTION CONTROLLER WILL HANDLE:

     refresh-schedule
       -> refreshTeacherScheduleWorkspace()

     create-schedule
       -> open the existing schedule editor flow

     edit-schedule
       -> selected schedule editor

     schedule-prev-month
       -> moveTeacherScheduleCalendarMonth(-1)

     schedule-next-month
       -> moveTeacherScheduleCalendarMonth(1)

     schedule-calendar-date
       -> openTeacherScheduleCalendarDate()

     class-schedule
       -> prepareTeacherScheduleClass()
          + navigate to Schedule

   Schedule CRUD will use the existing backend contract:
     POST   /api/schedules
     PATCH  /api/schedules/:id
     DELETE /api/schedules/:id

   once the editor is reconciled with the final centralized
   action/controller architecture.
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 10

   QUIZZES WORKSPACE
   ---------------------------------------------------------
   1. Quiz workspace state
   2. Quiz identity helpers
   3. Quiz questions / points
   4. Quiz submission metrics
   5. Status normalization
   6. Search / class / status / sort filtering
   7. Quiz summary
   8. Quiz toolbar
   9. Existing quiz-card design
   10. Quiz grid
   11. Quiz results/details
   12. Quiz state reconciliation
   13. Refresh lifecycle
   14. Class shortcut preparation
   15. Workspace initialization

   IMPORTANT HTML AUDIT RESULT
   ---------------------------------------------------------
   Current teacher.html has:
     - Quizzes sidebar navigation
     - complete quiz CSS

   But it does NOT currently contain:
     data-teacher-page="quizzes"

   The final teacher.html repair will add the missing host
   section using the SAME existing design.

   No alternative quiz design is introduced here.
========================================================= */


/* =========================================================
   QUIZ WORKSPACE STATE
========================================================= */

const teacherQuizWorkspaceState = {

  search:
    "",

  classId:
    "",

  status:
    "",

  sort:
    "recent",

  selectedQuizId:
    "",

  editingQuizId:
    "",

  refreshing:
    false,

  saving:
    false,

  initialized:
    false

};


/* =========================================================
   QUIZ ID
========================================================= */

function getTeacherQuizId(
  quiz
){

  return normalizeId(
    quiz?._id ||
    quiz?.id
  );

}


/* =========================================================
   QUIZ BY ID
========================================================= */

function getTeacherQuizById(
  quizId
){

  const normalizedQuizId =
    normalizeId(
      quizId
    );


  if (
    !normalizedQuizId
  ){

    return null;

  }


  return (
    getTeacherQuizzes()
      .find(
        quiz =>
          sameId(
            getTeacherQuizId(
              quiz
            ),
            normalizedQuizId
          )
      ) ||
    null
  );

}


/* =========================================================
   QUIZ CLASS ID
========================================================= */

function getTeacherQuizClassId(
  quiz
){

  return normalizeId(
    quiz
      ?.classId
      ?._id ||
    quiz
      ?.classId
  );

}


/* =========================================================
   QUIZ CLASS
========================================================= */

function getTeacherQuizClass(
  quiz
){

  const value =
    quiz?.classId;


  if (
    value &&
    typeof value ===
      "object"
  ){

    return (
      getTeacherClassById(
        value._id ||
        value.id
      ) ||
      value
    );

  }


  return (
    getTeacherClassById(
      value
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

  return safeString(
    quiz?.title,
    "Untitled quiz"
  );

}


/* =========================================================
   QUIZ INSTRUCTIONS
========================================================= */

function getTeacherQuizInstructions(
  quiz
){

  return safeString(

    quiz?.instructions ||
    quiz?.description,

    ""

  );

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
   QUESTION COUNT
========================================================= */

function getTeacherQuizQuestionCount(
  quiz
){

  return getTeacherQuizQuestions(
    quiz
  ).length;

}


/* =========================================================
   QUESTION POINTS
========================================================= */

function getTeacherQuizQuestionPoints(
  question
){

  return Math.max(
    0,
    safeNumber(
      question?.points,
      1
    )
  );

}


/* =========================================================
   QUIZ TOTAL POINTS
========================================================= */

function getTeacherQuizTotalPoints(
  quiz
){

  return getTeacherQuizQuestions(
    quiz
  )
    .reduce(
      (
        total,
        question
      ) =>
        total +
        getTeacherQuizQuestionPoints(
          question
        ),
      0
    );

}


/* =========================================================
   QUIZ PASSING SCORE
========================================================= */

function getTeacherQuizPassingScore(
  quiz
){

  return clampPercentage(
    safeNumber(
      quiz?.passingScore,
      70
    )
  );

}


/* =========================================================
   QUIZ TIME LIMIT
========================================================= */

function getTeacherQuizTimeLimit(
  quiz
){

  return Math.max(
    0,
    safeInteger(
      quiz?.timeLimitMinutes,
      0
    )
  );

}


/* =========================================================
   QUIZ ATTEMPTS ALLOWED
========================================================= */

function getTeacherQuizAttemptsAllowed(
  quiz
){

  return Math.max(
    1,
    safeInteger(
      quiz?.attemptsAllowed,
      1
    )
  );

}


/* =========================================================
   QUIZ STATUS

   Backend values:
     draft
     published
     archived

   Current quiz CSS/UI uses:
     draft
     published
     closed

   Therefore archived is displayed as closed without changing
   the backend record itself.
========================================================= */

function getTeacherQuizStatus(
  quiz
){

  const status =
    safeString(
      quiz?.status,
      "draft"
    )
      .toLowerCase();


  if (
    status ===
    "archived"
  ){

    return "closed";

  }


  if (
    [
      "draft",
      "published",
      "closed"
    ].includes(
      status
    )
  ){

    return status;

  }


  return "draft";

}


/* =========================================================
   QUIZ BACKEND STATUS

   Convert visual "closed" back to backend "archived" only
   when creating/updating a quiz.
========================================================= */

function getTeacherQuizBackendStatus(
  value
){

  const status =
    safeString(
      value,
      "draft"
    )
      .toLowerCase();


  if (
    status ===
    "closed"
  ){

    return "archived";

  }


  if (
    [
      "draft",
      "published",
      "archived"
    ].includes(
      status
    )
  ){

    return status;

  }


  return "draft";

}


/* =========================================================
   QUIZ STATUS LABEL
========================================================= */

function getTeacherQuizStatusLabel(
  quiz
){

  switch(
    getTeacherQuizStatus(
      quiz
    )
  ){

    case "published":

      return "Published";

    case "closed":

      return "Closed";

    default:

      return "Draft";

  }

}


/* =========================================================
   QUIZ SUBMISSION QUIZ ID
========================================================= */

function getTeacherQuizSubmissionQuizId(
  submission
){

  return normalizeId(
    submission
      ?.quizId
      ?._id ||
    submission
      ?.quizId
  );

}


/* =========================================================
   SUBMISSIONS FOR QUIZ
========================================================= */

function getTeacherQuizSubmissions(
  quizId
){

  const normalizedQuizId =
    normalizeId(
      quizId
    );


  if (
    !normalizedQuizId
  ){

    return [];

  }


  return asArray(
    state.quizSubmissions
  )
    .filter(
      submission =>
        sameId(
          getTeacherQuizSubmissionQuizId(
            submission
          ),
          normalizedQuizId
        )
    );

}


/* =========================================================
   UNIQUE QUIZ PARTICIPANTS
========================================================= */

function getTeacherQuizParticipantIds(
  quizId
){

  const ids =
    new Set();


  getTeacherQuizSubmissions(
    quizId
  )
    .forEach(
      submission => {

        const studentId =
          normalizeId(
            submission
              ?.studentId
              ?._id ||
            submission
              ?.studentId
          );


        if (
          studentId
        ){

          ids.add(
            studentId
          );

        }

      }
    );


  return ids;

}


/* =========================================================
   EXPECTED QUIZ STUDENTS
========================================================= */

function getTeacherQuizExpectedStudents(
  quiz
){

  const classItem =
    getTeacherQuizClass(
      quiz
    );


  return classItem
    ? getTeacherClassStudentCount(
        classItem
      )
    : 0;

}


/* =========================================================
   QUIZ COMPLETION RATE
========================================================= */

function getTeacherQuizCompletionRate(
  quiz
){

  const quizId =
    getTeacherQuizId(
      quiz
    );

  const expected =
    getTeacherQuizExpectedStudents(
      quiz
    );


  if (
    !expected
  ){

    return 0;

  }


  const completed =
    getTeacherQuizParticipantIds(
      quizId
    ).size;


  return clampPercentage(
    (
      completed /
      expected
    ) *
    100
  );

}


/* =========================================================
   QUIZ SUBMISSION PERCENTAGE

   Support the response shapes used by the existing quiz
   implementation while keeping one normalized calculation.
========================================================= */

function getTeacherQuizSubmissionPercentage(
  submission,
  quiz
){

  const directCandidates = [

    submission?.percentage,
    submission?.percentageScore,
    submission?.scorePercent

  ];


  for (
    const value of directCandidates
  ){

    const number =
      Number(
        value
      );


    if (
      Number.isFinite(
        number
      )
    ){

      return clampPercentage(
        number
      );

    }

  }


  const rawScore =
    Number(
      submission?.score
    );

  const totalPoints =
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
    totalPoints >
    0
  ){

    return clampPercentage(
      (
        rawScore /
        totalPoints
      ) *
      100
    );

  }


  return null;

}


/* =========================================================
   QUIZ AVERAGE SCORE
========================================================= */

function getTeacherQuizAverageScore(
  quiz
){

  const scores =
    getTeacherQuizSubmissions(
      getTeacherQuizId(
        quiz
      )
    )
      .map(
        submission =>
          getTeacherQuizSubmissionPercentage(
            submission,
            quiz
          )
      )
      .filter(
        score =>
          score !==
            null
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
   QUIZ PASS RATE
========================================================= */

function getTeacherQuizPassRate(
  quiz
){

  const passingScore =
    getTeacherQuizPassingScore(
      quiz
    );

  const scores =
    getTeacherQuizSubmissions(
      getTeacherQuizId(
        quiz
      )
    )
      .map(
        submission =>
          getTeacherQuizSubmissionPercentage(
            submission,
            quiz
          )
      )
      .filter(
        score =>
          score !==
            null
      );


  if (
    !scores.length
  ){

    return 0;

  }


  const passing =
    scores.filter(
      score =>
        score >=
        passingScore
    )
      .length;


  return clampPercentage(
    (
      passing /
      scores.length
    ) *
    100
  );

}


/* =========================================================
   QUIZ LAST UPDATED
========================================================= */

function getTeacherQuizUpdatedTime(
  quiz
){

  return (
    toValidDate(
      quiz?.updatedAt ||
      quiz?.createdAt
    )?.getTime() ||
    0
  );

}


/* =========================================================
   FILTER QUIZZES
========================================================= */

function getFilteredTeacherQuizzes(){

  const search =
    safeString(
      teacherQuizWorkspaceState
        .search
    )
      .toLowerCase();

  const classId =
    normalizeId(
      teacherQuizWorkspaceState
        .classId
    );

  const status =
    safeString(
      teacherQuizWorkspaceState
        .status
    )
      .toLowerCase();


  let quizzes = [
    ...getTeacherQuizzes()
  ];


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

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

              getTeacherQuizInstructions(
                quiz
              ),

              getTeacherClassTitle(
                classItem ||
                {}
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


  /* -------------------------------------------------------
     CLASS
  ------------------------------------------------------- */

  if (
    classId
  ){

    quizzes =
      quizzes.filter(
        quiz =>
          sameId(
            getTeacherQuizClassId(
              quiz
            ),
            classId
          )
      );

  }


  /* -------------------------------------------------------
     STATUS
  ------------------------------------------------------- */

  if (
    status
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


  /* -------------------------------------------------------
     SORT
  ------------------------------------------------------- */

  switch(
    teacherQuizWorkspaceState
      .sort
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


    default:

      quizzes.sort(
        (
          first,
          second
        ) =>
          getTeacherQuizUpdatedTime(
            second
          ) -
          getTeacherQuizUpdatedTime(
            first
          )
      );

      break;

  }


  return quizzes;

}


/* =========================================================
   QUIZ SUMMARY
========================================================= */

function getTeacherQuizSummary(){

  const quizzes =
    getTeacherQuizzes();


  return {

    total:
      quizzes.length,

    published:
      quizzes.filter(
        quiz =>
          getTeacherQuizStatus(
            quiz
          ) ===
          "published"
      ).length,

    draft:
      quizzes.filter(
        quiz =>
          getTeacherQuizStatus(
            quiz
          ) ===
          "draft"
      ).length,

    attempts:
      asArray(
        state.quizSubmissions
      ).length

  };

}


/* =========================================================
   RENDER QUIZ HEADER

   These IDs will be placed into the missing quiz host during
   final teacher.html cleanup.
========================================================= */

function renderTeacherQuizzesHeader(){

  const container =
    $(
      "teacherQuizzesHeader"
    );


  if (
    !container
  ){

    return;

  }


  container.innerHTML = `
    <div
      class="teacher-page-header-copy"
    >

      <span
        class="teacher-page-eyebrow"
      >
        ASSESSMENTS
      </span>

      <h1>
        Quizzes
      </h1>

      <p>
        Create assessments, publish quizzes and review student results for your assigned classes.
      </p>

    </div>


    <div
      class="teacher-page-header-actions"
    >

      <button
        type="button"
        class="teacher-secondary-button"
        data-teacher-action="refresh-quizzes"
        ${
          teacherQuizWorkspaceState
            .refreshing
            ? "disabled"
            : ""
        }
      >
        <i
          class="fa-solid ${
            teacherQuizWorkspaceState
              .refreshing
              ? "fa-spinner fa-spin"
              : "fa-rotate"
          }"
          aria-hidden="true"
        ></i>

        <span>
          ${
            teacherQuizWorkspaceState
              .refreshing
              ? "Refreshing..."
              : "Refresh"
          }
        </span>
      </button>


      <button
        type="button"
        class="teacher-primary-button"
        data-teacher-action="create-quiz"
      >
        <i
          class="fa-solid fa-plus"
          aria-hidden="true"
        ></i>

        <span>
          Create Quiz
        </span>
      </button>

    </div>
  `;

}


/* =========================================================
   RENDER QUIZ SUMMARY
========================================================= */

function renderTeacherQuizzesSummary(){

  const container =
    $(
      "teacherQuizzesSummary"
    );


  if (
    !container
  ){

    return;

  }


  const summary =
    getTeacherQuizSummary();


  container.innerHTML = `

    <article
      class="teacher-quiz-summary-card"
    >
      <i
        class="fa-solid fa-list-check"
        aria-hidden="true"
      ></i>

      <div>
        <strong>
          ${summary.total}
        </strong>

        <small>
          Total quizzes
        </small>
      </div>
    </article>


    <article
      class="teacher-quiz-summary-card is-published"
    >
      <i
        class="fa-solid fa-circle-check"
        aria-hidden="true"
      ></i>

      <div>
        <strong>
          ${summary.published}
        </strong>

        <small>
          Published
        </small>
      </div>
    </article>


    <article
      class="teacher-quiz-summary-card is-draft"
    >
      <i
        class="fa-regular fa-pen-to-square"
        aria-hidden="true"
      ></i>

      <div>
        <strong>
          ${summary.draft}
        </strong>

        <small>
          Draft
        </small>
      </div>
    </article>


    <article
      class="teacher-quiz-summary-card is-attempts"
    >
      <i
        class="fa-solid fa-user-check"
        aria-hidden="true"
      ></i>

      <div>
        <strong>
          ${summary.attempts}
        </strong>

        <small>
          Attempts
        </small>
      </div>
    </article>
  `;

}


/* =========================================================
   QUIZ CLASS FILTER
========================================================= */

function renderTeacherQuizClassOptions(){

  return getTeacherClasses()
    .map(
      classItem => {

        const classId =
          normalizeId(
            classItem?._id ||
            classItem?.id
          );


        return `
          <option
            value="${escapeAttribute(classId)}"
            ${
              sameId(
                teacherQuizWorkspaceState
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
    );

}


/* =========================================================
   QUIZ TOOLBAR
========================================================= */

function renderTeacherQuizzesToolbar(){

  const container =
    $(
      "teacherQuizzesToolbar"
    );


  if (
    !container
  ){

    return;

  }


  container.innerHTML = `

    <div
      class="teacher-quiz-search"
    >
      <i
        class="fa-solid fa-magnifying-glass"
        aria-hidden="true"
      ></i>

      <input
        id="teacherQuizSearch"
        type="search"
        placeholder="Search quizzes..."
        autocomplete="off"
        value="${escapeAttribute(
          teacherQuizWorkspaceState
            .search
        )}"
      />
    </div>


    <select
      id="teacherQuizClassFilter"
      class="teacher-workspace-select"
      aria-label="Filter quizzes by class"
    >

      <option value="">
        All classes
      </option>

      ${renderTeacherQuizClassOptions()}

    </select>


    <select
      id="teacherQuizStatusFilter"
      class="teacher-workspace-select"
      aria-label="Filter quizzes by status"
    >

      <option
        value=""
        ${
          !teacherQuizWorkspaceState
            .status
            ? "selected"
            : ""
        }
      >
        All statuses
      </option>

      <option
        value="draft"
        ${
          teacherQuizWorkspaceState
            .status ===
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
          teacherQuizWorkspaceState
            .status ===
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
          teacherQuizWorkspaceState
            .status ===
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
      aria-label="Sort quizzes"
    >

      <option
        value="recent"
        ${
          teacherQuizWorkspaceState
            .sort ===
          "recent"
            ? "selected"
            : ""
        }
      >
        Recently updated
      </option>

      <option
        value="name"
        ${
          teacherQuizWorkspaceState
            .sort ===
          "name"
            ? "selected"
            : ""
        }
      >
        Quiz name
      </option>

      <option
        value="questions"
        ${
          teacherQuizWorkspaceState
            .sort ===
          "questions"
            ? "selected"
            : ""
        }
      >
        Most questions
      </option>

      <option
        value="completion"
        ${
          teacherQuizWorkspaceState
            .sort ===
          "completion"
            ? "selected"
            : ""
        }
      >
        Completion rate
      </option>

      <option
        value="score"
        ${
          teacherQuizWorkspaceState
            .sort ===
          "score"
            ? "selected"
            : ""
        }
      >
        Average score
      </option>

    </select>
  `;


  bindTeacherQuizFilterControls();

}


/* =========================================================
   QUIZ FILTER CONTROLS

   These elements are dynamically rendered inside one quiz
   toolbar, so property handlers provide one authoritative
   listener per control.
========================================================= */

function bindTeacherQuizFilterControls(){

  const search =
    $(
      "teacherQuizSearch"
    );

  const classFilter =
    $(
      "teacherQuizClassFilter"
    );

  const statusFilter =
    $(
      "teacherQuizStatusFilter"
    );

  const sort =
    $(
      "teacherQuizSort"
    );


  if (
    search
  ){

    search.oninput =
      event => {

        teacherQuizWorkspaceState
          .search =
          safeString(
            event.target.value
          );


        renderTeacherQuizzesGrid();

      };

  }


  if (
    classFilter
  ){

    classFilter.onchange =
      event => {

        teacherQuizWorkspaceState
          .classId =
          normalizeId(
            event.target.value
          );


        teacherQuizWorkspaceState
          .selectedQuizId =
          "";


        renderTeacherQuizzesGrid();

        renderTeacherSelectedQuiz();

      };

  }


  if (
    statusFilter
  ){

    statusFilter.onchange =
      event => {

        teacherQuizWorkspaceState
          .status =
          safeString(
            event.target.value
          );


        teacherQuizWorkspaceState
          .selectedQuizId =
          "";


        renderTeacherQuizzesGrid();

        renderTeacherSelectedQuiz();

      };

  }


  if (
    sort
  ){

    sort.onchange =
      event => {

        teacherQuizWorkspaceState
          .sort =
          safeString(
            event.target.value,
            "recent"
          );


        renderTeacherQuizzesGrid();

      };

  }

}


/* =========================================================
   CREATE QUIZ CARD

   Uses the EXISTING teacher.html quiz CSS classes.
========================================================= */

function createTeacherQuizCard(
  quiz
){

  const quizId =
    getTeacherQuizId(
      quiz
    );

  const classItem =
    getTeacherQuizClass(
      quiz
    );

  const title =
    getTeacherQuizTitle(
      quiz
    );

  const instructions =
    getTeacherQuizInstructions(
      quiz
    );

  const status =
    getTeacherQuizStatus(
      quiz
    );

  const questionCount =
    getTeacherQuizQuestionCount(
      quiz
    );

  const totalPoints =
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

  const timeLimit =
    getTeacherQuizTimeLimit(
      quiz
    );


  return `
    <article
      class="teacher-quiz-card"
      data-quiz-id="${escapeAttribute(quizId)}"
    >

      <!-- ===============================================
           TOP
      ================================================ -->

      <div
        class="teacher-quiz-card-top"
      >

        <span
          class="teacher-quiz-card-type"
        >
          <i
            class="fa-solid fa-list-check"
            aria-hidden="true"
          ></i>

          Quiz
        </span>


        <span
          class="teacher-quiz-card-status is-${escapeAttribute(status)}"
        >
          ${escapeHtml(
            getTeacherQuizStatusLabel(
              quiz
            )
          )}
        </span>

      </div>


      <!-- ===============================================
           COPY
      ================================================ -->

      <h3
        title="${escapeAttribute(title)}"
      >
        ${escapeHtml(title)}
      </h3>


      <p
        class="teacher-quiz-card-class"
      >
        <i
          class="fa-solid fa-chalkboard-user"
          aria-hidden="true"
        ></i>

        ${escapeHtml(
          getTeacherClassTitle(
            classItem ||
            {}
          )
        )}
      </p>


      ${
        instructions
          ? `
            <p
              class="teacher-quiz-card-description"
            >
              ${escapeHtml(instructions)}
            </p>
          `
          : ""
      }


      <!-- ===============================================
           DETAILS
      ================================================ -->

      <div
        class="teacher-quiz-card-details"
      >

        <div>
          <strong>
            ${questionCount}
          </strong>

          <span>
            ${
              questionCount ===
              1
                ? "Question"
                : "Questions"
            }
          </span>
        </div>


        <div>
          <strong>
            ${totalPoints}
          </strong>

          <span>
            Points
          </span>
        </div>


        <div>
          <strong>
            ${
              timeLimit
                ? `${timeLimit}m`
                : "—"
            }
          </strong>

          <span>
            Time limit
          </span>
        </div>

      </div>


      <!-- ===============================================
           RESULTS
      ================================================ -->

      <div
        class="teacher-quiz-card-performance"
      >

        <div>

          <span>
            Attempts
          </span>

          <strong>
            ${submissions}
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


        <div>

          <span>
            Avg. score
          </span>

          <strong>
            ${
              submissions
                ? `${averageScore}%`
                : "—"
            }
          </strong>

        </div>

      </div>


      <!-- ===============================================
           ACTIONS
      ================================================ -->

      <div
        class="teacher-quiz-card-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-action="edit-quiz"
          data-quiz-id="${escapeAttribute(quizId)}"
        >
          <i
            class="fa-solid fa-pen"
            aria-hidden="true"
          ></i>

          Edit
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-action="quiz-results"
          data-quiz-id="${escapeAttribute(quizId)}"
        >
          Results

          <i
            class="fa-solid fa-arrow-right"
            aria-hidden="true"
          ></i>
        </button>

      </div>

    </article>
  `;

}


/* =========================================================
   QUIZ EMPTY STATE
========================================================= */

function renderTeacherQuizEmptyState(
  quizzes
){

  const empty =
    $(
      "teacherQuizzesEmpty"
    );


  if (
    !empty
  ){

    return;

  }


  const hasResults =
    quizzes.length >
    0;


  empty.hidden =
    hasResults;


  if (
    hasResults
  ){

    return;

  }


  const heading =
    empty.querySelector(
      "h2"
    );

  const description =
    empty.querySelector(
      "p"
    );


  if (
    heading
  ){

    heading.textContent =
      getTeacherQuizzes()
        .length
        ? "No quizzes found"
        : "No quizzes yet";

  }


  if (
    description
  ){

    description.textContent =
      getTeacherQuizzes()
        .length
        ? "No quizzes match the current search or filters."
        : "Create a quiz for one of your assigned classes.";

  }

}


/* =========================================================
   QUIZ GRID
========================================================= */

function renderTeacherQuizzesGrid(){

  const container =
    $(
      "teacherQuizzesGrid"
    );


  if (
    !container
  ){

    return;

  }


  const quizzes =
    getFilteredTeacherQuizzes();


  renderTeacherQuizEmptyState(
    quizzes
  );


  if (
    !quizzes.length
  ){

    container.innerHTML =
      "";

    container.hidden =
      true;

    return;

  }


  container.hidden =
    false;


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
   QUIZ RESULT STUDENT
========================================================= */

function getTeacherQuizSubmissionStudent(
  submission
){

  const value =
    submission?.studentId;


  if (
    value &&
    typeof value ===
      "object"
  ){

    return value;

  }


  return (
    getTeacherStudentById(
      value
    )
      ?.student ||
    null
  );

}


/* =========================================================
   QUIZ RESULT STUDENT NAME
========================================================= */

function getTeacherQuizSubmissionStudentName(
  submission
){

  const student =
    getTeacherQuizSubmissionStudent(
      submission
    );


  return safeString(

    student?.name ||
    student?.fullName ||
    student?.displayName,

    "Student"

  );

}


/* =========================================================
   QUIZ RESULT STUDENT AVATAR
========================================================= */

function getTeacherQuizSubmissionStudentAvatar(
  submission
){

  const student =
    getTeacherQuizSubmissionStudent(
      submission
    );


  return getSafeImageUrl(

    student?.profileImage ||
    student?.avatar ||
    student?.photoURL,

    FALLBACK_AVATAR

  );

}


/* =========================================================
   QUIZ RESULT DATE
========================================================= */

function getTeacherQuizSubmissionDate(
  submission
){

  return toValidDate(

    submission?.submittedAt ||
    submission?.completedAt ||
    submission?.createdAt

  );

}


/* =========================================================
   RENDER ONE QUIZ ATTEMPT
========================================================= */

function createTeacherQuizAttemptRow(
  submission,
  quiz
){

  const studentName =
    getTeacherQuizSubmissionStudentName(
      submission
    );

  const avatar =
    getTeacherQuizSubmissionStudentAvatar(
      submission
    );

  const percentage =
    getTeacherQuizSubmissionPercentage(
      submission,
      quiz
    );

  const submittedAt =
    getTeacherQuizSubmissionDate(
      submission
    );

  const passing =
    percentage !==
      null &&
    percentage >=
      getTeacherQuizPassingScore(
        quiz
      );


  return `
    <article
      class="teacher-quiz-attempt-row"
    >

      <div
        class="teacher-quiz-attempt-student"
      >

        <img
          src="${escapeAttribute(avatar)}"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
        />

        <span>

          <strong>
            ${escapeHtml(studentName)}
          </strong>

          <small>
            ${
              submittedAt
                ? escapeHtml(
                    formatRelativeDate(
                      submittedAt
                    )
                  )
                : "Submission date unavailable"
            }
          </small>

        </span>

      </div>


      <strong
        class="teacher-quiz-attempt-score"
      >
        ${
          percentage ===
          null
            ? "—"
            : `${percentage}%`
        }
      </strong>


      <span
        class="teacher-quiz-attempt-status"
      >
        ${
          percentage ===
          null
            ? "Recorded"
            : (
                passing
                  ? "Passed"
                  : "Below passing"
              )
        }
      </span>

    </article>
  `;

}


/* =========================================================
   SELECTED QUIZ RESULTS
========================================================= */

function renderTeacherSelectedQuiz(
  quizId =
    teacherQuizWorkspaceState
      .selectedQuizId
){

  const container =
    $(
      "teacherSelectedQuiz"
    );


  if (
    !container
  ){

    return;

  }


  const normalizedQuizId =
    normalizeId(
      quizId
    );

  const quiz =
    getTeacherQuizById(
      normalizedQuizId
    );


  if (
    !quiz
  ){

    teacherQuizWorkspaceState
      .selectedQuizId =
      "";

    container.hidden =
      true;

    container.innerHTML =
      "";

    return;

  }


  teacherQuizWorkspaceState
    .selectedQuizId =
    normalizedQuizId;


  const submissions =
    getTeacherQuizSubmissions(
      normalizedQuizId
    )
      .sort(
        (
          first,
          second
        ) =>
          (
            getTeacherQuizSubmissionDate(
              second
            )?.getTime() ||
            0
          ) -
          (
            getTeacherQuizSubmissionDate(
              first
            )?.getTime() ||
            0
          )
      );

  const classItem =
    getTeacherQuizClass(
      quiz
    );

  const averageScore =
    getTeacherQuizAverageScore(
      quiz
    );

  const passRate =
    getTeacherQuizPassRate(
      quiz
    );

  const completion =
    getTeacherQuizCompletionRate(
      quiz
    );


  container.hidden =
    false;


  container.innerHTML = `
    <section
      class="teacher-selected-quiz-panel"
    >

      <header
        class="teacher-selected-quiz-header"
      >

        <div>

          <span
            class="teacher-page-eyebrow"
          >
            QUIZ RESULTS
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
                classItem ||
                {}
              )
            )}
          </p>

        </div>


        <button
          type="button"
          class="teacher-icon-button"
          data-teacher-action="close-quiz-results"
          aria-label="Close quiz results"
        >
          <i
            class="fa-solid fa-xmark"
            aria-hidden="true"
          ></i>
        </button>

      </header>


      <div
        class="teacher-quiz-attempts-summary"
      >

        <article>
          <strong>
            ${submissions.length}
          </strong>

          <span>
            Attempts
          </span>
        </article>


        <article>
          <strong>
            ${completion}%
          </strong>

          <span>
            Completion
          </span>
        </article>


        <article>
          <strong>
            ${
              submissions.length
                ? `${averageScore}%`
                : "—"
            }
          </strong>

          <span>
            Average score
          </span>
        </article>


        <article>
          <strong>
            ${
              submissions.length
                ? `${passRate}%`
                : "—"
            }
          </strong>

          <span>
            Pass rate
          </span>
        </article>

      </div>


      <div
        class="teacher-quiz-attempts-list"
      >

        ${
          submissions.length
            ? submissions
                .map(
                  submission =>
                    createTeacherQuizAttemptRow(
                      submission,
                      quiz
                    )
                )
                .join(
                  ""
                )
            : `
                <div
                  class="teacher-inline-empty"
                >
                  No quiz attempts have been recorded yet.
                </div>
              `
        }

      </div>

    </section>
  `;


  container
    .querySelectorAll(
      ".teacher-quiz-attempt-student img"
    )
    .forEach(
      image => {

        image.onerror =
          () => {

            image.onerror =
              null;

            image.src =
              FALLBACK_AVATAR;

          };

      }
    );

}


/* =========================================================
   OPEN QUIZ RESULTS
========================================================= */

function openTeacherQuizResults(
  quizId
){

  const quiz =
    getTeacherQuizById(
      quizId
    );


  if (
    !quiz
  ){

    notifyAIFTError(
      "The selected quiz is no longer available.",
      {
        title:
          "Quiz unavailable"
      }
    );


    return false;

  }


  teacherQuizWorkspaceState
    .selectedQuizId =
    getTeacherQuizId(
      quiz
    );


  renderTeacherSelectedQuiz();


  return true;

}


/* =========================================================
   CLOSE QUIZ RESULTS
========================================================= */

function closeTeacherQuizResults(){

  teacherQuizWorkspaceState
    .selectedQuizId =
    "";


  renderTeacherSelectedQuiz();

}


/* =========================================================
   REPLACE QUIZ IN STATE

   Used by create/edit lifecycle later.
========================================================= */

function replaceTeacherQuizInState(
  savedQuiz
){

  const quizId =
    getTeacherQuizId(
      savedQuiz
    );


  if (
    !quizId
  ){

    return false;

  }


  const index =
    state.quizzes
      .findIndex(
        quiz =>
          sameId(
            getTeacherQuizId(
              quiz
            ),
            quizId
          )
      );


  if (
    index >=
    0
  ){

    state.quizzes[
      index
    ] =
      savedQuiz;

  }else{

    state.quizzes.unshift(
      savedQuiz
    );

  }


  finalizeTeacherLoadedData();


  return true;

}


/* =========================================================
   REMOVE QUIZ FROM STATE
========================================================= */

function removeTeacherQuizFromState(
  quizId
){

  const normalizedQuizId =
    normalizeId(
      quizId
    );


  if (
    !normalizedQuizId
  ){

    return false;

  }


  state.quizzes =
    state.quizzes
      .filter(
        quiz =>
          !sameId(
            getTeacherQuizId(
              quiz
            ),
            normalizedQuizId
          )
      );


  /*
    Deleting a quiz also deletes its QuizSubmission records on
    the backend, so remove those from local state too.
  */

  state.quizSubmissions =
    state.quizSubmissions
      .filter(
        submission =>
          !sameId(
            getTeacherQuizSubmissionQuizId(
              submission
            ),
            normalizedQuizId
          )
      );


  if (
    sameId(
      teacherQuizWorkspaceState
        .selectedQuizId,
      normalizedQuizId
    )
  ){

    teacherQuizWorkspaceState
      .selectedQuizId =
      "";

  }


  finalizeTeacherLoadedData();


  return true;

}


/* =========================================================
   PREPARE QUIZZES FOR CLASS

   Used from a class card shortcut.
========================================================= */

function prepareTeacherQuizzesClass(
  classId
){

  const classItem =
    getTeacherClassById(
      classId
    );


  if (
    !classItem
  ){

    return false;

  }


  teacherQuizWorkspaceState
    .classId =
    normalizeId(
      classId
    );

  teacherQuizWorkspaceState
    .selectedQuizId =
    "";


  return true;

}


/* =========================================================
   REFRESH QUIZZES

   Uses the class-scoped loaders from Part 2.
========================================================= */

async function refreshTeacherQuizzesWorkspace(){

  if (
    teacherQuizWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherQuizWorkspaceState
    .refreshing =
    true;


  renderTeacherQuizzesHeader();


  try{

    const results =
      await Promise.allSettled([

        loadTeacherQuizzes(),

        loadTeacherQuizSubmissions()

      ]);


    const failures =
      [];


    results.forEach(
      (
        result,
        index
      ) => {

        if (
          result.status !==
          "rejected"
        ){

          return;

        }


        const name =
          [
            "Quizzes",
            "Quiz submissions"
          ][
            index
          ];


        failures.push({
          name,
          error:
            result.reason
        });


        reportOptionalRequestError(
          name,
          result.reason
        );

      }
    );


    finalizeTeacherLoadedData();


    renderTeacherQuizzesWorkspace();


    if (
      failures.length
    ){

      notifyAIFTWarning(
        "Some quiz information could not be refreshed.",
        {
          title:
            "Quiz refresh incomplete"
        }
      );


      return false;

    }


    notifyAIFTSuccess(
      "Quizzes and student results are up to date.",
      {
        title:
          "Quizzes refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Quizzes could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherQuizWorkspaceState
      .refreshing =
      false;


    renderTeacherQuizzesHeader();

  }

}


/* =========================================================
   RENDER COMPLETE QUIZZES WORKSPACE

   If the host is absent in the CURRENT teacher.html this
   function exits safely.

   It does NOT redirect to Overview.

   That is intentional: the missing HTML host is a structural
   bug that will be fixed explicitly instead of hidden.
========================================================= */

function renderTeacherQuizzesWorkspace(){

  const host =
    $(
      "teacherPageQuizzes"
    );


  if (
    !host
  ){

    return false;

  }


  renderTeacherQuizzesHeader();

  renderTeacherQuizzesSummary();

  renderTeacherQuizzesToolbar();

  renderTeacherQuizzesGrid();

  renderTeacherSelectedQuiz();


  return true;

}


/* =========================================================
   COMPATIBILITY QUIZ RENDERER
========================================================= */

function renderTeacherQuizzes(){

  return renderTeacherQuizzesWorkspace();

}


/* =========================================================
   INITIALIZE QUIZZES
========================================================= */

function initializeTeacherQuizzesWorkspace(){

  if (
    teacherQuizWorkspaceState
      .initialized
  ){

    renderTeacherQuizzesWorkspace();

    return;

  }


  teacherQuizWorkspaceState
    .initialized =
    true;


  renderTeacherQuizzesWorkspace();

}


/* =========================================================
   REFRESH QUIZ UI FROM CURRENT STATE
========================================================= */

function refreshTeacherQuizzesFromCurrentState(){

  renderTeacherQuizzesSummary();

  renderTeacherQuizzesGrid();

  renderTeacherSelectedQuiz();

}


/* =========================================================
   PART 10 COMPLETE

   BACKEND READS
   ---------------------------------------------------------
   Quiz loading remains CLASS-SCOPED through Part 2:

     GET /api/quizzes?classId=<assigned-class>

     GET /api/quizzes/submissions/list?classId=<assigned-class>

   That is deliberate because classId causes the backend to
   authorize against the real class.

   VERIFIED CRUD CONTRACT
   ---------------------------------------------------------
     POST   /api/quizzes
     PATCH  /api/quizzes/:id
     DELETE /api/quizzes/:id

   CREATE REQUIRES:
     schoolId
     classId
     title

   Backend then derives/validates the class and teacher access.

   QUIZ STATUS BACKEND VALUES:
     draft
     published
     archived

   CURRENT UI DISPLAY VALUES:
     draft
     published
     closed

   "closed" maps to backend "archived".

   CENTRAL ACTION CONTROLLER WILL LATER HANDLE:

     refresh-quizzes
       -> refreshTeacherQuizzesWorkspace()

     create-quiz
       -> quiz editor

     edit-quiz
       -> quiz editor for quizId

     quiz-results
       -> openTeacherQuizResults()

     close-quiz-results
       -> closeTeacherQuizResults()

     class-quizzes
       -> prepareTeacherQuizzesClass()
          + navigate to Quizzes

   QUESTION BANK
   ---------------------------------------------------------
   The separate current teacher.html Question Bank page is
   NOT merged into this workspace.

   Question Bank remains disabled from production boot until
   its unauthenticated backend route is hardened.
========================================================= */
