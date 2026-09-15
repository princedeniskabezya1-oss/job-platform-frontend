Warning: truncated output (original token count: 374963)
... 451274 bytes omitted ...

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
   SAFE API RESPONSE PARSER
   Production JSON + Text + HTML Protection

   IMPORTANT:
   Backend proxies/frameworks can sometimes return HTML for:
   - missing routes
   - deployment errors
   - reverse-proxy errors
   - platform-generated 404/500 pages

   Raw HTML must NEVER be displayed inside Teacher Studio.
========================================================= */

async function safeJson(
  response
){

  if(
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
    )
      .trim()
      .toLowerCase();


  /* =====================================================
     JSON RESPONSE
  ===================================================== */

  if(
    contentType.includes(
      "application/json"
    )
  ){

    try{

      return await response.json();

    }catch(
      error
    ){

      console.warn(
        "AIFT received an invalid JSON response:",
        error
      );


      return {
        message:
          response.ok
            ? "The server returned an invalid response."
            : `The server could not complete the request.`
      };

    }

  }


  /* =====================================================
     TEXT RESPONSE
  ===================================================== */

  let text =
    "";


  try{

    text =
      String(
        await response.text()
      )
        .trim();

  }catch(
    error
  ){

    console.warn(
      "AIFT could not read the server response:",
      error
    );


    return null;

  }


  if(
    !text
  ){

    return null;

  }


  /* =====================================================
     JSON STORED AS TEXT
  ===================================================== */

  try{

    return JSON.parse(
      text
    );

  }catch{

    /*
      Continue with text normalization.
    */

  }


  /* =====================================================
     HTML RESPONSE PROTECTION

     Never expose:
       <!DOCTYPE html>
       <html>
       <head>
       <body>
       framework error documents

     to teachers.
  ===================================================== */

  const looksLikeHtml =
    /<!doctype\s+html/i.test(
      text
    ) ||
    /<html[\s>]/i.test(
      text
    ) ||
    /<head[\s>]/i.test(
      text
    ) ||
    /<body[\s>]/i.test(
      text
    );


  if(
    looksLikeHtml
  ){

    /* ===================================================
       EXPRESS MISSING POST ROUTE
    =================================================== */

    const cannotPostMatch =
      text.match(
        /Cannot\s+POST\s+([^<\s]+)/i
      );


    if(
      cannotPostMatch
    ){

      return {

        message:
          "This Kabezya feature is not available on the current server version.",

        code:
          "API_ROUTE_NOT_AVAILABLE",

        route:
          safeString(
            cannotPostMatch[1]
          )

      };

    }


    /* ===================================================
       EXPRESS MISSING GET ROUTE
    =================================================== */

    const cannotGetMatch =
      text.match(
        /Cannot\s+GET\s+([^<\s]+)/i
      );


    if(
      cannotGetMatch
    ){

      return {

        message:
          "This AIFT feature is not available on the current server version.",

        code:
          "API_ROUTE_NOT_AVAILABLE",

        route:
          safeString(
            cannotGetMatch[1]
          )

      };

    }


    /* ===================================================
       GENERIC HTML SERVER FAILURE
    =================================================== */

    return {

      message:
        response.ok
          ? "The server returned an unexpected response."
          : "AIFT could not complete this request because the server returned an unexpected response.",

      code:
        "UNEXPECTED_HTML_RESPONSE"

    };

  }


  /* =====================================================
     SAFE PLAIN TEXT

     Keep ordinary API text messages, but prevent huge server
     pages or dumps from entering notifications.
  ===================================================== */

  const maximumLength =
    1000;


  const normalizedText =
    text.length >
      maximumLength
      ? `${text.slice(
          0,
          maximumLength
        )}…`
      : text;


  return {

    message:
      normalizedText

  };

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
   LEGACY API SEND COMPATIBILITY

   Older Teacher Studio modules still use:

     apiSend(path, method)
     apiSend(path, method, body)
     apiSend(path, method, body, options)

   Keep one compatibility layer instead of rewriting older
   production modules individually.

   All requests still flow through apiRequest(), therefore:
     - Bearer authentication remains centralized
     - timeout handling remains centralized
     - FormData support remains centralized
     - 401 handling remains centralized
     - AIFTApiError remains authoritative
========================================================= */

async function apiSend(
  path,
  method = "POST",
  body = undefined,
  options = {}
){

  const normalizedMethod =
    safeString(
      method,
      "POST"
    )
      .toUpperCase();


  const requestOptions = {
    ...asObject(
      options
    ),

    method:
      normalizedMethod
  };


  if (
    body !==
    undefined &&
    normalizedMethod !==
      "GET" &&
    normalizedMethod !==
      "HEAD"
  ){

    requestOptions.body =
      body;

  }


  return apiRequest(
    path,
    requestOptions
  );

}


/*
  Runtime audit checks required functions through window[].

  Explicit export avoids depending on browser behavior for
  global function declarations.
*/

window.apiSend =
  apiSend;


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
   AIFT TEACHER STUDIO
   PRODUCTION MODAL CONTROLLER

   GUARANTEES
   ---------------------------------------------------------
   - one modal at a time
   - modal is mounted directly under document.body
   - hidden dialogs are removed from layout
   - body scroll is locked only while a modal is open
   - Escape closes the active modal
   - background clicks close non-busy dialogs
   - focus moves into the dialog
   - focus returns to the opener
========================================================= */

let teacherActiveModalId =
  "";

let teacherModalTriggerElement =
  null;

let teacherModalEscapeBound =
  false;


/* =========================================================
   GET OPEN MODALS
========================================================= */

function getOpenTeacherModals(){

  return Array.from(
    document.querySelectorAll(
      ".modal.show"
    )
  );

}


/* =========================================================
   UPDATE BODY MODAL STATE
========================================================= */

function syncTeacherModalBodyState(){

  const hasOpenModal =
    getOpenTeacherModals()
      .length >
    0;


  document.body
    .classList
    .toggle(
      "teacher-studio-modal-open",
      hasOpenModal
    );

}


/* =========================================================
   FORCE CLOSE MODAL

   Internal helper.

   This does not check lifecycle-busy state because it is
   also used to clean up stale/duplicate dialogs before
   opening a new one.
========================================================= */

function forceCloseTeacherModal(
  modal
){

  if(!modal){

    return false;

  }


  modal.classList.remove(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  modal.hidden =
    true;


  return true;

}


/* =========================================================
   CLOSE OTHER OPEN MODALS
========================================================= */

function closeOtherTeacherModals(
  exceptId = ""
){

  getOpenTeacherModals()
    .forEach(
      modal => {

        if(
          exceptId &&
          modal.id ===
          exceptId
        ){

          return;

        }


        forceCloseTeacherModal(
          modal
        );

      }
    );


  syncTeacherModalBodyState();

}


/* =========================================================
   FOCUS FIRST MODAL CONTROL
========================================================= */

function focusTeacherModal(
  modal
){

  if(!modal){

    return;

  }


  const focusTarget =
    modal.querySelector(
      [
        "[autofocus]",
        "input:not([disabled])",
        "textarea:not([disabled])",
        "select:not([disabled])",
        "button:not([disabled])",
        "[href]",
        '[tabindex]:not([tabindex="-1"])'
      ].join(",")
    );


  window.requestAnimationFrame(
    () => {

      focusTarget?.focus?.({
        preventScroll:
          true
      });

    }
  );

}


/* =========================================================
   GLOBAL ESCAPE HANDLER
========================================================= */

function bindTeacherModalEscapeHandler(){

  if(
    teacherModalEscapeBound
  ){

    return;

  }


  teacherModalEscapeBound =
    true;


  document.addEventListener(
    "keydown",
    event => {

      if(
        event.key !==
        "Escape"
      ){

        return;

      }


      const openModals =
        getOpenTeacherModals();


      const activeModal =
        openModals[
          openModals.length -
          1
        ];


      if(!activeModal){

        return;

      }


      /*
        Do not allow a destructive account request to be
        visually dismissed while its backend operation is
        still running.
      */

      if(
        typeof teacherAccountLifecycleBusy !==
          "undefined" &&
        teacherAccountLifecycleBusy
      ){

        return;

      }


      event.preventDefault();


      closeModal(
        activeModal.id
      );

    }
  );

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


  if(!modal){

    return false;

  }


  /*
    All dynamically generated AIFT dialogs must belong
    directly to body.

    This prevents parent transforms, grids, overflow rules,
    Settings containers, or mobile workspaces from changing
    the dialog's positioning context.
  */

  if(
    modal.parentElement !==
    document.body
  ){

    document.body
      .appendChild(
        modal
      );

  }


  /*
    Production rule:
    only one Teacher Studio modal can be active at once.
  */

  closeOtherTeacherModals(
    id
  );


  teacherModalTriggerElement =
    document.activeElement instanceof
      HTMLElement
      ? document.activeElement
      : null;


  teacherActiveModalId =
    id;


  modal.hidden =
    false;


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  modal.classList.add(
    "show"
  );


  document.body
    .classList
    .add(
      "teacher-studio-modal-open"
    );


  /*
    Add backdrop click behavior only once per modal.
  */

  if(
    modal.dataset
      .teacherBackdropBound !==
    "true"
  ){

    modal.dataset
      .teacherBackdropBound =
      "true";


    modal.addEventListener(
      "mousedown",
      event => {

        if(
          event.target !==
          modal
        ){

          return;

        }


        if(
          typeof teacherAccountLifecycleBusy !==
            "undefined" &&
          teacherAccountLifecycleBusy
        ){

          return;

        }


        closeModal(
          modal.id
        );

      }
    );

  }


  bindTeacherModalEscapeHandler();


  focusTeacherModal(
    modal
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


  if(!modal){

    return false;

  }


  forceCloseTeacherModal(
    modal
  );


  if(
    teacherActiveModalId ===
    id
  ){

    teacherActiveModalId =
      "";

  }


  syncTeacherModalBodyState();


  /*
    Return keyboard focus to the control that opened the
    dialog when there is no replacement modal active.
  */

  if(
    !getOpenTeacherModals()
      .length &&
    teacherModalTriggerElement
      ?.isConnected
  ){

    const trigger =
      teacherModalTriggerElement;


    teacherModalTriggerElement =
      null;


    window.requestAnimationFrame(
      () => {

        trigger.focus?.({
          preventScroll:
            true
        });

      }
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
   LOAD ATTENDANCE FOR ONE CLASS / SESSION

   AUTHORIZATION
   ---------------------------------------------------------

   Backend remains authoritative.

   Teacher can only query Attendance for a class actually
   assigned to the authenticated Teacher.

   SESSION MODE
   ---------------------------------------------------------

   When scheduleId is supplied:

     GET /api/attendance
       ?classId=<class>
       &scheduleId=<schedule>

   Date may also be supplied for presentation/reporting, but
   scheduleId is the authoritative session identity.

   MANUAL MODE
   ---------------------------------------------------------

   Without scheduleId:

     classId + date

========================================================= */

async function loadTeacherAttendanceForClass(
  classId,
  date = "",
  scheduleId = ""
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  const normalizedScheduleId =
    normalizeId(
      scheduleId
    );


  if (
    !normalizedClassId
  ){

    return [];

  }


  /* =====================================================
     VERIFY CLASS EXISTS IN TEACHER STATE

     This is frontend protection only.
     Backend authorization remains authoritative.
  ===================================================== */

  const classItem =
    getTeacherClassById(
      normalizedClassId
    );


  if (
    !classItem
  ){

    throw new AIFTApiError(
      "The selected class is not available to this Teacher.",
      {
        code:
          "ATTENDANCE_CLASS_UNAVAILABLE"
      }
    );

  }


  const normalizedDate =
    normalizeTeacherAttendanceDate(
      date
    );


  const query = {

    classId:
      normalizedClassId

  };


  /* =====================================================
     SCHEDULE IDENTITY
  ===================================================== */

  if (
    normalizedScheduleId
  ){

    const schedule =
      getTeacherScheduleById(
        normalizedScheduleId
      );


    if (
      !schedule
    ){

      throw new AIFTApiError(
        "The selected teaching session is no longer available.",
        {
          code:
            "ATTENDANCE_SCHEDULE_UNAVAILABLE"
        }
      );

    }


    if (
      !sameId(
        getTeacherScheduleClassId(
          schedule
        ),
        normalizedClassId
      )
    ){

      throw new AIFTApiError(
        "The selected Schedule does not belong to this class.",
        {
          code:
            "ATTENDANCE_SCHEDULE_CLASS_MISMATCH"
        }
      );

    }


    query.scheduleId =
      normalizedScheduleId;

  }


  /* =====================================================
     DATE FILTER

     In scheduled mode this is secondary.

     In manual mode this is the attendance identity date.
  ===================================================== */

  if (
    normalizedDate
  ){

    query.date =
      normalizedDate;

  }


  const response =
    await apiGet(
      "/api/attendance",
      {
        query
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

/* =========================================================
   LOAD SCHOOL UPDATES
   Teacher Studio read-only school communication
========================================================= */

async function loadTeacherSchoolUpdates(){

  const schoolId =
    getSchoolId();


  if(!schoolId){

    state.schoolUpdates = [];

    return state.schoolUpdates;

  }


  try{

    const response =
      await apiGet(
        `/api/school-updates?schoolId=${
          encodeURIComponent(
            schoolId
          )
        }`
      );


    /*
      Support both the direct-array response used by the
      current endpoint and common API envelope formats.
    */

    const updates =
      Array.isArray(response)
        ? response
        : Array.isArray(
            response?.schoolUpdates
          )
          ? response.schoolUpdates
          : Array.isArray(
              response?.updates
            )
            ? response.updates
            : asArray(response);


    state.schoolUpdates =
      [...updates]
        .sort(
          (first,second) => {

            const pinnedDifference =
              Number(
                Boolean(second?.pinned)
              ) -
              Number(
                Boolean(first?.pinned)
              );


            if(pinnedDifference){
              return pinnedDifference;
            }


            return (
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

          }
        );


    updateTeacherSchoolUpdatesBadge();


    return state.schoolUpdates;

  }catch(error){

    console.warn(
      "Teacher school updates could not be loaded:",
      error
    );


    state.schoolUpdates = [];

    updateTeacherSchoolUpdatesBadge();


    return state.schoolUpdates;

  }

}

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
        "School updates",

      run:
        loadTeacherSchoolUpdates
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

  if (
    !assignment
  ){

    return null;

  }


  return (
    assignment.dueDate ||
    assignment.deadline ||
    null
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
  data-teacher-action="open-selected-class-builder"
  data-class-id="${escapeAttribute(classId)}"
  title="Class Builder"
  aria-label="Open Class Builder"
>
  <i
    class="fa-solid fa-layer-group"
    aria-hidden="true"
  ></i>
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
    getTea…162152 tokens truncated…  </option>

              <option value="messages">
                Messages
              </option>

              <option value="kabezya">
                Kabezya AI
              </option>

              <option value="technical">
                Technical problem
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
              placeholder="Short description of the issue"
              required
            />

          </label>

        </div>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            What happened?
          </span>

          <textarea
            id="teacherSupportMessage"
            rows="7"
            maxlength="5000"
            placeholder="Describe what you expected, what actually happened, and any exact error message you saw."
            required
          ></textarea>

        </label>


        <label
          class="teacher-form-field teacher-form-field-full"
        >

          <span>
            Technical details
            <small>
              Optional
            </small>
          </span>

          <textarea
            id="teacherSupportTechnicalDetails"
            rows="4"
            maxlength="4000"
            placeholder="Paste console errors, HTTP status codes or failed API paths here. Do not paste passwords or access tokens."
          ></textarea>

        </label>


        <div
          class="teacher-support-request-warning"
        >

          <i
            class="fa-solid fa-shield-halved"
            aria-hidden="true"
          ></i>

          <span>
            Do not include passwords, authentication tokens or
            unnecessary student personal information.
          </span>

        </div>


        <div
          class="teacher-support-request-actions"
        >

          <button
            type="button"
            class="teacher-secondary-button"
            data-teacher-action="close-support-request"
          >
            Cancel
          </button>


          <button
            type="submit"
            class="teacher-primary-button"
          >
            <i
              class="fa-regular fa-copy"
              aria-hidden="true"
            ></i>

            Copy support request
          </button>

        </div>

      </form>

    </section>
  `;


  const form =
    $(
      "teacherSupportRequestForm"
    );


  if (
    form
  ){

    form.onsubmit =
      event => {

        event.preventDefault();

        copyTeacherSupportRequest();

      };

  }


  return true;

}


/* =========================================================
   CLOSE SUPPORT REQUEST
========================================================= */

function closeTeacherSupportRequest(){

  const container =
    $(
      "teacherSupportRequest"
    );


  teacherSupportWorkspaceState
    .requestOpen =
    false;


  if (
    container
  ){

    container.hidden =
      true;

    container.innerHTML =
      "";

  }


  return true;

}


/* =========================================================
   SUPPORT REQUEST DATA
========================================================= */

function buildTeacherSupportRequest(){

  const name =
    safeString(
      $(
        "teacherSupportName"
      )?.value
    );

  const email =
    safeString(
      $(
        "teacherSupportEmail"
      )?.value
    );

  const topic =
    safeString(
      $(
        "teacherSupportTopic"
      )?.value
    );

  const subject =
    safeString(
      $(
        "teacherSupportSubject"
      )?.value
    );

  const message =
    safeString(
      $(
        "teacherSupportMessage"
      )?.value
    );

  const technicalDetails =
    safeString(
      $(
        "teacherSupportTechnicalDetails"
      )?.value
    );


  if (
    !name ||
    !email ||
    !topic ||
    !subject ||
    !message
  ){

    throw new AIFTApiError(
      "Please complete all required support fields.",
      {
        code:
          "SUPPORT_FIELDS_REQUIRED"
      }
    );

  }


  return {

    name,

    email,

    topic,

    subject,

    message,

    technicalDetails

  };

}


/* =========================================================
   SUPPORT REQUEST AS TEXT
========================================================= */

function formatTeacherSupportRequest(
  request
){

  const teacherId =
    getAuthenticatedUserId();

  const schoolId =
    getSchoolId();


  return [
    "AIFT Teacher Studio Support Request",
    "",
    `Name: ${request.name}`,
    `Email: ${request.email}`,
    `Topic: ${request.topic}`,
    `Subject: ${request.subject}`,
    "",
    "Issue:",
    request.message,
    "",
    request.technicalDetails
      ? [
          "Technical details:",
          request.technicalDetails,
          ""
        ].join("\n")
      : "",
    "Context:",
    `Role: Teacher`,
    teacherId
      ? `User ID: ${teacherId}`
      : "",
    schoolId
      ? `School ID: ${schoolId}`
      : "",
    `Page: ${window.location.href}`,
    `Browser: ${navigator.userAgent}`,
    `Generated: ${new Date().toISOString()}`
  ]
    .filter(
      value =>
        value !==
        ""
    )
    .join(
      "\n"
    );

}


/* =========================================================
   CLIPBOARD FALLBACK
========================================================= */

async function copyTextToTeacherClipboard(
  text
){

  if (
    navigator.clipboard &&
    typeof navigator.clipboard
      .writeText ===
      "function" &&
    window.isSecureContext
  ){

    await navigator.clipboard
      .writeText(
        text
      );


    return true;

  }


  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    text;

  textarea.setAttribute(
    "readonly",
    ""
  );

  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";

  textarea.style.pointerEvents =
    "none";


  document.body.appendChild(
    textarea
  );


  textarea.select();


  let success =
    false;


  try{

    success =
      document.execCommand(
        "copy"
      );

  }finally{

    textarea.remove();

  }


  return success;

}


/* =========================================================
   COPY SUPPORT REQUEST

   IMPORTANT:
   This does not pretend the request was submitted.

   It prepares a clean support bundle while we verify the real
   support backend contract.
========================================================= */

async function copyTeacherSupportRequest(){

  let request;


  try{

    request =
      buildTeacherSupportRequest();

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Please complete the support request."
      ),
      {
        title:
          "Support request incomplete"
      }
    );


    return false;

  }


  const text =
    formatTeacherSupportRequest(
      request
    );


  try{

    const copied =
      await copyTextToTeacherClipboard(
        text
      );


    if (
      !copied
    ){

      throw new Error(
        "Clipboard access was unavailable."
      );

    }


    notifyAIFTSuccess(
      "The support request was copied. It has not been submitted to a server.",
      {
        title:
          "Support request copied"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "The support request could not be copied."
      ),
      {
        title:
          "Copy failed"
      }
    );


    return false;

  }

}


/* =========================================================
   SUPPORT -> KABEZYA
========================================================= */

function prepareTeacherSupportKabezya(){

  if (
    !state.kabezya ||
    typeof state.kabezya !==
      "object"
  ){

    state.kabezya =
      {};

  }


  Object.assign(
    state.kabezya,
    {
      mode:
        TEACHER_KABEZYA_MODES
          .ASSISTANT,

      classId:
        "",

      studentId:
        "",

      assignmentId:
        "",

      submissionId:
        "",

      quizId:
        ""
    }
  );


  syncTeacherKabezyaState();


  teacherKabezyaWorkspaceState.prompt =
    "Help me troubleshoot a Teacher Studio problem. Ask me for the exact error, what I expected to happen, and what happened instead.";


  return true;

}


/* =========================================================
   SUPPORT WORKSPACE
========================================================= */

function renderTeacherSupportWorkspace(){

  renderTeacherSupportHeader();

  renderTeacherHelpTopics();

  renderTeacherHelpTopicDetail();

  renderTeacherContactSupport();


  if (
    !teacherSupportWorkspaceState
      .requestOpen
  ){

    closeTeacherSupportRequest();

  }

}


/* =========================================================
   SUPPORT COMPATIBILITY

   The old code sometimes called renderTeacherHelpCenter().
========================================================= */

function renderTeacherHelpCenter(){

  renderTeacherSupportWorkspace();

}


/* =========================================================
   INITIALIZE SUPPORT
========================================================= */

function initializeTeacherSupportWorkspace(){

  if (
    teacherSupportWorkspaceState
      .initialized
  ){

    renderTeacherSupportWorkspace();

    return;

  }


  teacherSupportWorkspaceState
    .initialized =
    true;


  renderTeacherSupportWorkspace();

}


/* =========================================================
   PART 16 COMPLETE

   EXISTING SETTINGS HOSTS:
   ---------------------------------------------------------
   #teacherSettingsHeader
   #teacherSettingsProfile
   #teacherSettingsPreferences

   EXISTING SUPPORT HOSTS:
   ---------------------------------------------------------
   #teacherSupportHeader
   #teacherHelpTopics
   #teacherHelpTopicDetail
   #teacherContactSupport
   #teacherSupportRequest


   SETTINGS:
   ---------------------------------------------------------
   Device-local only until a verified user-preferences
   backend contract is established.

   Stored:
     notifications
     emailNotifications preference
     gradingReminders
     attendanceReminders
     compactMode

   NOT STORED:
     tokens
     student records
     grades
     attendance data
     messages
     assignments


   SUPPORT:
   ---------------------------------------------------------
   No guessed /api/support/requests call.

   Current workflow:
     Help topics
       ↓
     Troubleshoot with Kabezya
       OR
     Prepare support request
       ↓
     Copy support information

   Once the REAL support backend is verified, only the final
   support-send mutation needs to be added.


   CENTRAL ACTION CONTROLLER WILL HANDLE:
   ---------------------------------------------------------
   save-teacher-settings
     -> saveTeacherSettings()

   reset-teacher-settings
     -> resetTeacherSettings()

   open-help-topic
     -> openTeacherHelpTopic(topicId)

   close-help-topic
     -> closeTeacherHelpTopic()

   support-talk-kabezya
     -> prepareTeacherSupportKabezya()
        + navigate to AI

   open-support-request
     -> renderTeacherSupportRequestForm()

   close-support-request
     -> closeTeacherSupportRequest()


   NO NEW DOCUMENT-WIDE CLICK CONTROLLER IS CREATED HERE.
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 17

   MESSAGES INTEGRATION
   ---------------------------------------------------------
   1. Messages workspace state
   2. Conversation normalization
   3. Conversation user helpers
   4. Unread calculations
   5. Search
   6. Recent conversation cards
   7. Open full messages workspace
   8. Start student conversation
   9. Messages refresh
   10. Unread badges
   11. Initialization

   ARCHITECTURE
   ---------------------------------------------------------
   Teacher Studio does NOT create a second messaging system.

   The full AIFT messaging experience remains:

     messages.html

   Teacher Studio provides:
     - recent conversations
     - unread counts
     - message search
     - direct thread shortcuts
     - student messaging shortcuts

   VERIFIED BACKEND:
   ---------------------------------------------------------
   GET  /api/messages
   GET  /api/messages/:userId
   POST /api/messages

   Full thread functionality stays in messages.html.
========================================================= */


/* =========================================================
   MESSAGES WORKSPACE STATE
========================================================= */

const teacherMessagesWorkspaceState = {

  conversations:
    [],

  search:
    "",

  loading:
    false,

  refreshing:
    false,

  loaded:
    false,

  initialized:
    false

};


/* =========================================================
   CONVERSATION ID
========================================================= */

function getTeacherConversationId(
  conversation
){

  return normalizeId(

    conversation?.conversationId ||
    conversation?._id ||
    conversation?.id

  );

}


/* =========================================================
   CONVERSATION OTHER USER
========================================================= */

function getTeacherConversationUser(
  conversation
){

  const user =
    conversation?.user;


  if (
    user &&
    typeof user ===
      "object"
  ){

    return user;

  }


  return null;

}


/* =========================================================
   CONVERSATION USER ID
========================================================= */

function getTeacherConversationUserId(
  conversation
){

  const user =
    getTeacherConversationUser(
      conversation
    );


  return normalizeId(
    user?._id ||
    user?.id
  );

}


/* =========================================================
   CONVERSATION USER NAME
========================================================= */

function getTeacherConversationUserName(
  conversation
){

  const user =
    getTeacherConversationUser(
      conversation
    );


  if (
    !user
  ){

    return "Conversation";

  }


  return safeString(

    user?.name ||
    user?.displayName ||
    user?.companyName ||
    user?.schoolName,

    "AIFT user"

  );

}


/* =========================================================
   CONVERSATION USER ROLE
========================================================= */

function getTeacherConversationUserRole(
  conversation
){

  const user =
    getTeacherConversationUser(
      conversation
    );


  const role =
    safeString(
      user?.role
    )
      .toLowerCase();


  switch(
    role
  ){

    case "student":

      return "Student";


    case "teacher":

      return "Teacher";


    case "school":

      return "School";


    case "employer":

      return "Employer";


    case "admin":

      return "Administrator";


    default:

      return role
        ? (
            role
              .charAt(
                0
              )
              .toUpperCase() +
            role.slice(
              1
            )
          )
        : "AIFT user";

  }

}


/* =========================================================
   CONVERSATION AVATAR
========================================================= */

function getTeacherConversationAvatar(
  conversation
){

  const user =
    getTeacherConversationUser(
      conversation
    );


  return getSafeImageUrl(

    user?.profileImage ||
    user?.avatar ||
    user?.logo,

    FALLBACK_AVATAR

  );

}


/* =========================================================
   CONVERSATION LAST MESSAGE
========================================================= */

function getTeacherConversationLastMessage(
  conversation
){

  return safeString(

    conversation?.lastMessage,

    "No messages yet"

  );

}


/* =========================================================
   CONVERSATION LAST DATE
========================================================= */

function getTeacherConversationLastDate(
  conversation
){

  return toValidDate(

    conversation?.lastMessageDate ||
    conversation?.updatedAt ||
    conversation?.createdAt

  );

}


/* =========================================================
   CONVERSATION UNREAD
========================================================= */

function getTeacherConversationUnreadCount(
  conversation
){

  return Math.max(
    0,
    safeInteger(

      conversation?.unreadCount ??
      conversation?.unread,

      0

    )
  );

}


/* =========================================================
   TOTAL UNREAD
========================================================= */

function getTeacherTotalUnreadMessages(){

  return teacherMessagesWorkspaceState
    .conversations
    .reduce(
      (
        total,
        conversation
      ) =>
        total +
        getTeacherConversationUnreadCount(
          conversation
        ),
      0
    );

}


/* =========================================================
   NORMALIZE CONVERSATION
========================================================= */

function normalizeTeacherConversation(
  conversation
){

  if (
    !conversation ||
    typeof conversation !==
      "object"
  ){

    return null;

  }


  const user =
    getTeacherConversationUser(
      conversation
    );


  if (
    !user
  ){

    return null;

  }


  const userId =
    normalizeId(
      user?._id ||
      user?.id
    );


  if (
    !userId
  ){

    return null;

  }


  return {

    ...conversation,

    conversationId:
      getTeacherConversationId(
        conversation
      ),

    user,

    unreadCount:
      getTeacherConversationUnreadCount(
        conversation
      )

  };

}


/* =========================================================
   LOAD CONVERSATIONS

   Verified backend:
     GET /api/messages

   Backend already scopes results to authenticated user.
========================================================= */

async function loadTeacherMessageConversations(){

  if (
    teacherMessagesWorkspaceState
      .loading
  ){

    return teacherMessagesWorkspaceState
      .conversations;

  }


  teacherMessagesWorkspaceState
    .loading =
    true;


  try{

    const response =
      await apiGet(
        "/api/messages"
      );


    teacherMessagesWorkspaceState
      .conversations =
      asArray(
        response?.conversations ||
        response?.data ||
        response
      )
        .map(
          normalizeTeacherConversation
        )
        .filter(
          Boolean
        )
        .sort(
          (
            first,
            second
          ) =>
            (
              getTeacherConversationLastDate(
                second
              )?.getTime() ||
              0
            ) -
            (
              getTeacherConversationLastDate(
                first
              )?.getTime() ||
              0
            )
        );


    teacherMessagesWorkspaceState
      .loaded =
      true;


    updateTeacherMessageUnreadBadges();


    return teacherMessagesWorkspaceState
      .conversations;

  }catch(
    error
  ){

    console.error(
      "Teacher messages load failed:",
      error
    );


    throw error;

  }finally{

    teacherMessagesWorkspaceState
      .loading =
      false;

  }

}


/* =========================================================
   FILTERED CONVERSATIONS
========================================================= */

function getFilteredTeacherConversations(){

  const search =
    safeString(
      teacherMessagesWorkspaceState
        .search
    )
      .toLowerCase();


  let conversations =
    [
      ...teacherMessagesWorkspaceState
        .conversations
    ];


  /*
    Respect archived status supplied by messaging backend.
  */

  conversations =
    conversations.filter(
      conversation =>
        conversation?.archived !==
        true
    );


  if (
    search
  ){

    conversations =
      conversations.filter(
        conversation => {

          const haystack =
            [

              getTeacherConversationUserName(
                conversation
              ),

              getTeacherConversationUserRole(
                conversation
              ),

              getTeacherConversationLastMessage(
                conversation
              ),

              safeString(
                getTeacherConversationUser(
                  conversation
                )?.headline
              ),

              safeString(
                getTeacherConversationUser(
                  conversation
                )?.profession
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


  conversations.sort(
    (
      first,
      second
    ) => {

      /*
        Pinned conversations first.
      */

      if (
        Boolean(
          first?.pinned
        ) !==
        Boolean(
          second?.pinned
        )
      ){

        return first?.pinned
          ? -1
          : 1;

      }


      /*
        Then unread conversations.
      */

      const firstUnread =
        getTeacherConversationUnreadCount(
          first
        );

      const secondUnread =
        getTeacherConversationUnreadCount(
          second
        );


      if (
        Boolean(
          firstUnread
        ) !==
        Boolean(
          secondUnread
        )
      ){

        return firstUnread
          ? -1
          : 1;

      }


      /*
        Then newest.
      */

      return (
        (
          getTeacherConversationLastDate(
            second
          )?.getTime() ||
          0
        ) -
        (
          getTeacherConversationLastDate(
            first
          )?.getTime() ||
          0
        )
      );

    }
  );


  return conversations;

}


/* =========================================================
   UNREAD BADGES

   Existing HTML contains:
     #teacherUnreadSidebarCount

   Other badge IDs are updated only when present.
========================================================= */

function updateTeacherMessageUnreadBadges(){

  const count =
    getTeacherTotalUnreadMessages();


  const badgeIds = [

    "teacherUnreadSidebarCount",

    "teacherUnreadMessageCount",

    "teacherUnreadTopbarCount"

  ];


  badgeIds.forEach(
    id => {

      const badge =
        $(
          id
        );


      if (
        !badge
      ){

        return;

      }


      badge.hidden =
        count <=
        0;


      badge.textContent =
        count >
        99
          ? "99+"
          : String(
              count
            );


      badge.setAttribute(
        "aria-label",
        `${count} unread ${
          count ===
          1
            ? "message"
            : "messages"
        }`
      );

    }
  );

}


/* =========================================================
   MESSAGES WORKSPACE HEADER
========================================================= */

function createTeacherMessagesWorkspaceHeader(){

  const total =
    teacherMessagesWorkspaceState
      .conversations
      .length;

  const unread =
    getTeacherTotalUnreadMessages();


  return `
    <div
      class="teacher-messages-workspace-head"
    >

      <div>

        <span
          class="teacher-page-eyebrow"
        >
          INBOX
        </span>

        <h2>
          Recent conversations
        </h2>

        <p>
          ${
            unread
              ? `${unread} unread ${
                  unread ===
                  1
                    ? "message"
                    : "messages"
                } across ${total} ${
                  total ===
                  1
                    ? "conversation"
                    : "conversations"
                }.`
              : `${total} ${
                  total ===
                  1
                    ? "conversation"
                    : "conversations"
                }.`
          }
        </p>

      </div>


      <div
        class="teacher-messages-workspace-actions"
      >

        <button
          type="button"
          class="teacher-secondary-button"
          data-teacher-action="refresh-messages"
          ${
            teacherMessagesWorkspaceState
              .refreshing
              ? "disabled"
              : ""
          }
        >
          <i
            class="fa-solid ${
              teacherMessagesWorkspaceState
                .refreshing
                ? "fa-spinner fa-spin"
                : "fa-rotate"
            }"
            aria-hidden="true"
          ></i>

          Refresh
        </button>


        <button
          type="button"
          class="teacher-primary-button"
          data-teacher-action="open-full-messages"
        >
          <i
            class="fa-regular fa-comments"
            aria-hidden="true"
          ></i>

          Open Messages
        </button>

      </div>

    </div>
  `;

}


/* =========================================================
   MESSAGES SEARCH
========================================================= */

function createTeacherMessagesSearch(){

  return `
    <div
      class="teacher-messages-search"
    >

      <i
        class="fa-solid fa-magnifying-glass"
        aria-hidden="true"
      ></i>

      <input
        id="teacherMessagesSearch"
        type="search"
        autocomplete="off"
        placeholder="Search conversations..."
        value="${escapeAttribute(
          teacherMessagesWorkspaceState
            .search
        )}"
      />

      ${
        teacherMessagesWorkspaceState
          .search
          ? `
              <button
                type="button"
                class="teacher-icon-button"
                data-teacher-action="clear-message-search"
                aria-label="Clear conversation search"
              >
                <i
                  class="fa-solid fa-xmark"
                  aria-hidden="true"
                ></i>
              </button>
            `
          : ""
      }

    </div>
  `;

}


/* =========================================================
   CONVERSATION CARD
========================================================= */

function createTeacherConversationCard(
  conversation
){

  const userId =
    getTeacherConversationUserId(
      conversation
    );

  const name =
    getTeacherConversationUserName(
      conversation
    );

  const role =
    getTeacherConversationUserRole(
      conversation
    );

  const avatar =
    getTeacherConversationAvatar(
      conversation
    );

  const lastMessage =
    getTeacherConversationLastMessage(
      conversation
    );

  const lastDate =
    getTeacherConversationLastDate(
      conversation
    );

  const unread =
    getTeacherConversationUnreadCount(
      conversation
    );


  return `
    <button
      type="button"
      class="
        teacher-message-conversation
        ${
          unread
            ? "has-unread"
            : ""
        }
      "
      data-teacher-action="open-message-thread"
      data-user-id="${escapeAttribute(userId)}"
    >

      <span
        class="teacher-message-conversation-avatar"
      >

        <img
          src="${escapeAttribute(avatar)}"
          alt=""
          loading="lazy"
          referrerpolicy="no-referrer"
        />


        ${
          unread
            ? `
                <span
                  class="teacher-message-unread-dot"
                  aria-hidden="true"
                ></span>
              `
            : ""
        }

      </span>


      <span
        class="teacher-message-conversation-content"
      >

        <span
          class="teacher-message-conversation-top"
        >

          <strong>
            ${escapeHtml(name)}
          </strong>


          ${
            lastDate
              ? `
                  <time
                    datetime="${escapeAttribute(
                      lastDate.toISOString()
                    )}"
                  >
                    ${escapeHtml(
                      formatTeacherRelativeTime(
                        lastDate
                      )
                    )}
                  </time>
                `
              : ""
          }

        </span>


        <span
          class="teacher-message-conversation-role"
        >
          ${escapeHtml(role)}
        </span>


        <span
          class="teacher-message-conversation-bottom"
        >

          <span
            class="teacher-message-last-message"
          >
            ${escapeHtml(lastMessage)}
          </span>


          ${
            unread
              ? `
                  <strong
                    class="teacher-message-unread-count"
                  >
                    ${
                      unread >
                      99
                        ? "99+"
                        : unread
                    }
                  </strong>
                `
              : ""
          }

        </span>

      </span>


      <i
        class="fa-solid fa-chevron-right"
        aria-hidden="true"
      ></i>

    </button>
  `;

}


/* =========================================================
   MESSAGES EMPTY STATE
========================================================= */

function createTeacherMessagesEmptyState(){

  const search =
    safeString(
      teacherMessagesWorkspaceState
        .search
    );


  return `
    <div
      class="teacher-workspace-empty"
    >

      <div
        class="teacher-workspace-empty-icon"
      >
        <i
          class="${
            search
              ? "fa-solid fa-magnifying-glass"
              : "fa-regular fa-comments"
          }"
          aria-hidden="true"
        ></i>
      </div>


      <h3>
        ${
          search
            ? "No conversations found"
            : "No conversations yet"
        }
      </h3>


      <p>
        ${
          search
            ? "Try another name, role or message keyword."
            : "When you message students or school staff, your recent conversations will appear here."
        }
      </p>


      ${
        !search
          ? `
              <button
                type="button"
                class="teacher-primary-button"
                data-teacher-action="open-full-messages"
              >
                <i
                  class="fa-regular fa-comments"
                  aria-hidden="true"
                ></i>

                Open Messages
              </button>
            `
          : ""
      }

    </div>
  `;

}


/* =========================================================
   MESSAGES LOADING
========================================================= */

function createTeacherMessagesLoading(){

  return `
    <div
      class="teacher-workspace-loading"
      role="status"
      aria-live="polite"
    >

      <i
        class="fa-solid fa-spinner fa-spin"
        aria-hidden="true"
      ></i>

      <span>
        Loading conversations...
      </span>

    </div>
  `;

}


/* =========================================================
   RENDER MESSAGES WORKSPACE
========================================================= */

async function renderTeacherMessagesWorkspace(){

  const container =
    $(
      "teacherMessagesWorkspace"
    );


  if (
    !container
  ){

    return false;

  }


  if (
    !teacherMessagesWorkspaceState
      .loaded &&
    !teacherMessagesWorkspaceState
      .loading
  ){

    container.innerHTML =
      createTeacherMessagesLoading();


    try{

      await loadTeacherMessageConversations();

    }catch(
      error
    ){

      container.innerHTML = `
        <div
          class="teacher-workspace-empty"
        >

          <div
            class="teacher-workspace-empty-icon"
          >
            <i
              class="fa-solid fa-triangle-exclamation"
              aria-hidden="true"
            ></i>
          </div>

          <h3>
            Messages could not be loaded
          </h3>

          <p>
            ${escapeHtml(
              getErrorMessage(
                error,
                "AIFT could not load your conversations."
              )
            )}
          </p>

          <button
            type="button"
            class="teacher-primary-button"
            data-teacher-action="refresh-messages"
          >
            Try again
          </button>

        </div>
      `;


      return false;

    }

  }


  const conversations =
    getFilteredTeacherConversations();


  container.innerHTML = `
    ${createTeacherMessagesWorkspaceHeader()}

    ${createTeacherMessagesSearch()}


    <div
      class="teacher-message-conversation-list"
    >

      ${
        conversations.length
          ? conversations
              .map(
                createTeacherConversationCard
              )
              .join(
                ""
              )
          : createTeacherMessagesEmptyState()
      }

    </div>


    <div
      class="teacher-messages-footer-note"
    >
      <i
        class="fa-solid fa-circle-info"
        aria-hidden="true"
      ></i>

      <span>
        Attachments, replies, reactions and full conversation
        controls open in the main AIFT Messages workspace.
      </span>
    </div>
  `;


  const searchInput =
    $(
      "teacherMessagesSearch"
    );


  if (
    searchInput
  ){

    searchInput.oninput =
      event => {

        teacherMessagesWorkspaceState
          .search =
          safeString(
            event.target.value
          );


        /*
          Re-render without making another API request.
        */

        renderTeacherMessagesWorkspace();

      };

  }


  container
    .querySelectorAll(
      ".teacher-message-conversation-avatar img"
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


  return true;

}


/* =========================================================
   COMPATIBILITY RENDERER
========================================================= */

function renderTeacherMessages(){

  return renderTeacherMessagesWorkspace();

}


/* =========================================================
   CLEAR MESSAGE SEARCH
========================================================= */

function clearTeacherMessageSearch(){

  teacherMessagesWorkspaceState
    .search =
    "";


  renderTeacherMessagesWorkspace();


  window.requestAnimationFrame(
    () => {

      $(
        "teacherMessagesSearch"
      )?.focus();

    }
  );


  return true;

}


/* =========================================================
   OPEN FULL MESSAGES

   Reuse the existing production messaging page.
========================================================= */

function openTeacherFullMessages(){

  window.location.href =
    "messages.html";


  return true;

}


/* =========================================================
   OPEN DIRECT MESSAGE THREAD

   Existing project routing already uses:
     messages.html?user=<userId>
========================================================= */

function openTeacherMessageThread(
  userId
){

  const normalizedUserId =
    normalizeId(
      userId
    );


  if (
    !normalizedUserId
  ){

    notifyAIFTError(
      "The conversation participant could not be identified.",
      {
        title:
          "Conversation unavailable"
      }
    );


    return false;

  }


  window.location.href =
    `messages.html?user=${encodeURIComponent(
      normalizedUserId
    )}`;


  return true;

}


/* =========================================================
   MESSAGE STUDENT

   Used by:
   - Student detail
   - Student cards
   - Grading context
   - future centralized action controller

   Only allows students currently available inside the
   teacher's assigned-class dataset.
========================================================= */

function messageTeacherStudent(
  studentId
){

  const record =
    getTeacherStudentById(
      studentId
    );


  if (
    !record
  ){

    notifyAIFTError(
      "This student is not available in your assigned classes.",
      {
        title:
          "Student unavailable"
      }
    );


    return false;

  }


  return openTeacherMessageThread(
    record.id
  );

}


/* =========================================================
   MESSAGE USER

   General helper for already-authorized user IDs returned
   from the messaging backend itself.
========================================================= */

function messageTeacherUser(
  userId
){

  return openTeacherMessageThread(
    userId
  );

}


/* =========================================================
   REFRESH MESSAGES
========================================================= */

async function refreshTeacherMessagesWorkspace(){

  if (
    teacherMessagesWorkspaceState
      .refreshing
  ){

    return false;

  }


  teacherMessagesWorkspaceState
    .refreshing =
    true;


  try{

    /*
      Force a real reload.
    */

    teacherMessagesWorkspaceState
      .loaded =
      false;


    await loadTeacherMessageConversations();


    await renderTeacherMessagesWorkspace();


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Messages could not be refreshed."
      ),
      {
        title:
          "Refresh failed"
      }
    );


    return false;

  }finally{

    teacherMessagesWorkspaceState
      .refreshing =
      false;


    if (
      $(
        "teacherMessagesWorkspace"
      )
    ){

      renderTeacherMessagesWorkspace();

    }

  }

}


/* =========================================================
   APPLY MESSAGE EVENT TO STATE

   Part 19 Socket.IO can call this instead of rebuilding the
   whole messaging system.

   Because socket event payload formats may vary, unknown
   event shapes cause a safe refresh instead of guessing.
========================================================= */

function handleTeacherRealtimeMessage(
  payload
){

  if (
    !payload ||
    typeof payload !==
      "object"
  ){

    return false;

  }


  /*
    If the backend event contains a conversation summary we
    can reconcile immediately.
  */

  const candidate =
    payload.conversation ||
    payload.conversationSummary;


  if (
    candidate
  ){

    const normalized =
      normalizeTeacherConversation(
        candidate
      );


    if (
      normalized
    ){

      const id =
        getTeacherConversationId(
          normalized
        );


      const userId =
        getTeacherConversationUserId(
          normalized
        );


      const index =
        teacherMessagesWorkspaceState
          .conversations
          .findIndex(
            conversation =>
              (
                id &&
                sameId(
                  getTeacherConversationId(
                    conversation
                  ),
                  id
                )
              ) ||
              (
                userId &&
                sameId(
                  getTeacherConversationUserId(
                    conversation
                  ),
                  userId
                )
              )
          );


      if (
        index >=
        0
      ){

        teacherMessagesWorkspaceState
          .conversations[
            index
          ] =
          normalized;

      }else{

        teacherMessagesWorkspaceState
          .conversations
          .unshift(
            normalized
          );

      }


      teacherMessagesWorkspaceState
        .conversations
        .sort(
          (
            first,
            second
          ) =>
            (
              getTeacherConversationLastDate(
                second
              )?.getTime() ||
              0
            ) -
            (
              getTeacherConversationLastDate(
                first
              )?.getTime() ||
              0
            )
        );


      updateTeacherMessageUnreadBadges();


      if (
        isTeacherStudioPageActive(
          "messages"
        )
      ){

        renderTeacherMessagesWorkspace();

      }


      return true;

    }

  }


  /*
    Unknown message socket shape.

    Mark the cache stale; Part 19 can trigger a debounced
    refresh rather than corrupting the conversation state.
  */

  teacherMessagesWorkspaceState
    .loaded =
    false;


  return false;

}


/* =========================================================
   INITIALIZE MESSAGES
========================================================= */

function initializeTeacherMessagesWorkspace(){

  if (
    teacherMessagesWorkspaceState
      .initialized
  ){

    if (
      isTeacherStudioPageActive(
        "messages"
      )
    ){

      renderTeacherMessagesWorkspace();

    }


    return;

  }


  teacherMessagesWorkspaceState
    .initialized =
    true;


  /*
    We intentionally do not load the full thread history here.

    Only conversation summaries are needed for:
      - sidebar unread badge
      - recent messages workspace
  */

  loadTeacherMessageConversations()
    .catch(
      error => {

        console.warn(
          "Teacher message summaries were unavailable during initialization:",
          error
        );

      }
    );

}


/* =========================================================
   PART 17 COMPLETE

   CURRENT HTML:
   ---------------------------------------------------------
   #teacherPageMessages
   #teacherMessagesWorkspace
   #teacherUnreadSidebarCount


   VERIFIED BACKEND:
   ---------------------------------------------------------
   GET /api/messages

   returns conversation summaries including:
     conversationId
     user
     lastMessage
     lastMessageDate
     unreadCount
     pinned
     muted
     archived


   GET /api/messages/:userId

   loads/creates a direct conversation thread.


   POST /api/messages

   sends messages and supports the full messaging backend.


   TEACHER STUDIO DOES:
   ---------------------------------------------------------
   - display recent conversation summaries
   - search conversations
   - display unread totals
   - open direct threads
   - message a student from teacher context


   TEACHER STUDIO DOES NOT DUPLICATE:
   ---------------------------------------------------------
   - attachment upload
   - replies
   - reactions
   - GIF/sticker handling
   - message deletion
   - thread pagination
   - conversation settings
   - typing indicators

   Those belong to messages.html and the existing messaging
   backend.


   CENTRAL ACTION CONTROLLER WILL HANDLE:
   ---------------------------------------------------------
   open-full-messages
     -> openTeacherFullMessages()

   open-message-thread
     -> openTeacherMessageThread(userId)

   refresh-messages
     -> refreshTeacherMessagesWorkspace()

   clear-message-search
     -> clearTeacherMessageSearch()

   message-student
     -> messageTeacherStudent(studentId)


   SOCKET.IO PART 19 WILL HANDLE:
   ---------------------------------------------------------
   incoming message event
       ↓
   handleTeacherRealtimeMessage()

   or, when socket payload format is not sufficient:
       ↓
   debounced loadTeacherMessageConversations()
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 18

   CENTRAL ROUTER + ACTION CONTROLLER
   ---------------------------------------------------------
   1. Canonical Teacher Studio pages
   2. Route aliases
   3. Active page state
   4. Page normalization
   5. Page visibility
   6. Navigation active state
   7. Browser history
   8. Renderer map
   9. Page lifecycle
   10. Cross-workspace preparation
   11. ONE central action dispatcher
   12. Navigation dispatcher
   13. Keyboard / history support
   14. Compatibility aliases

   IMPORTANT
   ---------------------------------------------------------
   This is the authoritative navigation/action layer.

   DO NOT keep old duplicate controllers such as:
     bindTeacherMessageControls()
     bindTeacherSupportControls()
     bindTeacherKabezyaControls()
     multiple document click listeners for Studio actions
     old renderActiveStudentStudioPage()
     old activateStudentStudioPage()

   They are replaced here.

   Canonical page:
     support

   Backward-compatible alias:
     help -> support
========================================================= */



/* =========================================================
   TEACHER STUDIO
   SCHOOL UPDATES
========================================================= */


/* =========================================================
   UPDATE SIDEBAR BADGE
========================================================= */

function updateTeacherSchoolUpdatesBadge(){

  const badge =
    document.getElementById(
      "teacherSchoolUpdatesBadge"
    );


  if(!badge){
    return;
  }


  const count =
    Array.isArray(state.schoolUpdates)
      ? state.schoolUpdates.length
      : 0;


  badge.textContent =
    count > 99
      ? "99+"
      : String(count);


  badge.hidden =
    count === 0;

}


/* =========================================================
   SCHOOL UPDATE MEDIA
========================================================= */

function renderTeacherSchoolUpdateMedia(
  update
){

  const mediaUrl =
    normalizeHttpUrl(
      update?.mediaUrl
    );


  if(!mediaUrl){
    return "";
  }


  const mediaType =
    String(
      update?.mediaType ||
      ""
    )
      .trim()
      .toLowerCase();


  if(mediaType === "image"){

    return `
      <div class="teacher-update-media">

        <img
          src="${escapeAttribute(mediaUrl)}"
          alt="School update media"
          loading="lazy"
        >

      </div>
    `;

  }


  if(mediaType === "video"){

    return `
      <div class="teacher-update-media">

        <video
          src="${escapeAttribute(mediaUrl)}"
          controls
          preload="metadata"
        ></video>

      </div>
    `;

  }


  return "";

}


/* =========================================================
   RENDER SCHOOL UPDATES
========================================================= */

function renderTeacherSchoolUpdates(){

  const container =
    document.getElementById(
      "teacherSchoolUpdatesList"
    );


  if(!container){
    return false;
  }


  const updates =
    [...asArray(state.schoolUpdates)]
      .sort(
        (first,second) => {

          const pinnedDifference =
            Number(
              Boolean(
                second?.pinned
              )
            ) -
            Number(
              Boolean(
                first?.pinned
              )
            );


          if(pinnedDifference){
            return pinnedDifference;
          }


          const secondDate =
            toValidDate(
              second?.createdAt ||
              second?.updatedAt
            );


          const firstDate =
            toValidDate(
              first?.createdAt ||
              first?.updatedAt
            );


          return (
            (
              secondDate
                ? secondDate.getTime()
                : 0
            ) -
            (
              firstDate
                ? firstDate.getTime()
                : 0
            )
          );

        }
      );


  updateTeacherSchoolUpdatesBadge();


  /* =======================================================
     EMPTY STATE
  ======================================================= */

  if(!updates.length){

    container.innerHTML = `
      <div class="teacher-updates-empty">

        <span
          class="teacher-updates-empty-icon"
        >
          <i
            class="fa-regular fa-bell"
            aria-hidden="true"
          ></i>
        </span>


        <strong>
          No school updates yet
        </strong>


        <p>
          Announcements, notices, deadlines,
          and important information from your
          school will appear here.
        </p>

      </div>
    `;


    return true;

  }


  /* =======================================================
     UPDATE FEED
  ======================================================= */

  container.innerHTML =
    updates
      .map(update => {

        const title =
          safeString(
            update?.title,
            "School Update"
          );


        const message =
          safeString(
            update?.message ||
            update?.text,
            ""
          );


        const type =
          safeString(
            update?.type,
            "announcement"
          );


        const audience =
          safeString(
            update?.audience,
            ""
          );


        const classTitle =
          safeString(
            update?.classId?.title ||
            update?.classId?.name,
            ""
          );


        const resourceUrl =
          normalizeHttpUrl(
            update?.resourceUrl
          );


        const updateDate =
          update?.createdAt ||
          update?.updatedAt;


        return `
          <article
            class="teacher-update-item"
          >


            <!-- ===========================================
                 HEADER
            ============================================ -->

            <div
              class="teacher-update-head"
            >

              <div
                class="teacher-update-heading"
              >


                <span
                  class="teacher-update-icon"
                >
                  <i
                    class="fa-solid fa-bullhorn"
                    aria-hidden="true"
                  ></i>
                </span>


                <div
                  class="teacher-update-heading-copy"
                >


                  <div
                    class="teacher-update-title-row"
                  >

                    <h2>
                      ${escapeHtml(title)}
                    </h2>


                    ${
                      update?.pinned
                        ? `
                            <span
                              class="teacher-update-pinned"
                            >
                              <i
                                class="fa-solid fa-thumbtack"
                                aria-hidden="true"
                              ></i>

                              Pinned
                            </span>
                          `
                        : ""
                    }

                  </div>


                  <div
                    class="teacher-update-meta"
                  >

                    <span>
                      ${escapeHtml(
                        formatDateTime(
                          updateDate
                        )
                      )}
                    </span>


                    ${
                      classTitle
                        ? `
                            <span>
                              ${escapeHtml(
                                classTitle
                              )}
                            </span>
                          `
                        : ""
                    }

                  </div>

                </div>

              </div>


              <span
                class="teacher-update-type ${
                  type.toLowerCase() ===
                  "urgent"
                    ? "urgent"
                    : ""
                }"
              >
                ${escapeHtml(type)}
              </span>

            </div>


            <!-- ===========================================
                 MESSAGE
            ============================================ -->

            ${
              message
                ? `
                    <div
                      class="teacher-update-message"
                    >
                      ${escapeHtml(message)}
                    </div>
                  `
                : ""
            }


            <!-- ===========================================
                 MEDIA
            ============================================ -->

            ${renderTeacherSchoolUpdateMedia(
              update
            )}


            <!-- ===========================================
                 FOOTER
            ============================================ -->

            <div
              class="teacher-update-footer"
            >


              <div
                class="teacher-update-tags"
              >


                ${
                  audience
                    ? `
                        <span
                          class="teacher-update-tag"
                        >
                          <i
                            class="fa-solid fa-users"
                            aria-hidden="true"
                          ></i>

                          ${escapeHtml(
                            audience
                          )}
                        </span>
                      `
                    : ""
                }


                ${
                  update?.dueDate
                    ? `
                        <span
                          class="teacher-update-tag due"
                        >
                          <i
                            class="fa-regular fa-calendar"
                            aria-hidden="true"
                          ></i>

                          Due ${escapeHtml(
                            formatDate(
                              update.dueDate
                            )
                          )}
                        </span>
                      `
                    : ""
                }

              </div>


              ${
                resourceUrl
                  ? `
                      <a
                        class="teacher-update-resource"
                        href="${
                          escapeAttribute(
                            resourceUrl
                          )
                        }"
                        target="_blank"
                        rel="noopener noreferrer"
                      >

                        <i
                          class="fa-solid fa-arrow-up-right-from-square"
                          aria-hidden="true"
                        ></i>

                        <span>
                          Open resource
                        </span>

                      </a>
                    `
                  : ""
              }

            </div>

          </article>
        `;

      })
      .join("");


  return true;

}

/* =========================================================
   CANONICAL TEACHER STUDIO PAGES
========================================================= */

const TEACHER_STUDIO_PAGES =
  Object.freeze({

    overview:{
      title:
        "Overview"
    },


    updates:{
      title:
        "School Updates"
    },


    classes:{
      title:
        "My Classes"
    },

    students:{
      title:
        "Students"
    },

    assignments:{
      title:
        "Assignments"
    },

    submissions:{
      title:
        "Student Work"
    },

    grading:{
      title:
        "Grading Center"
    },

attendance:{
  title:
    "Attendance"
},

schedule:{
  title:
    "Schedule"
},

resources:{
  title:
    "Resources"
},

    analytics:{
      title:
        "Class Analytics"
    },

    ai:{
      title:
        "Kabezya AI"
    },

    messages:{
      title:
        "Messages"
    },

    settings:{
      title:
        "Settings"
    },

    support:{
      title:
        "Help & Support"
    }

  });


/* =========================================================
   ROUTE ALIASES
========================================================= */

const TEACHER_STUDIO_PAGE_ALIASES =
  Object.freeze({

    dashboard:
      "overview",

    home:
      "overview",

    class:
      "classes",

    classroom:
      "classes",

    roster:
      "students",

    student:
      "students",

    coursework:
      "assignments",

    assignment:
      "assignments",

    submission:
      "submissions",

    submissions:
      "submissions",

    work:
      "submissions",

    grades:
      "grading",

grades:
  "grading",

grade:
  "grading",

/*
  Legacy assessment URLs now fall back to Classes.

  Quiz and Question Bank authoring belongs in the
  class-specific Class Builder.
*/

assessment:
  "classes",

assessments:
  "classes",

quiz:
  "classes",

quizzes:
  "classes",

questionbank:
  "classes",

"question-bank":
  "classes",

questions:
  "classes",

calendar:
  "schedule",

progress:
  "analytics",

    performance:
      "analytics",

    insights:
      "analytics",

    kabezya:
      "ai",

    assistant:
      "ai",

    chat:
      "messages",

    inbox:
      "messages",

    help:
      "support",

    support:
      "support"

  });


/* =========================================================
   ACTIVE PAGE
========================================================= */

let activeTeacherStudioPage =
  "overview";


/* =========================================================
   ROUTER STATE
========================================================= */

const teacherStudioRouterState = {

  navigationBound:
    false,

  actionsBound:
    false,

  historyBound:
    false,

  rendering:
    false

};


/* =========================================================
   NORMALIZE TEACHER PAGE
========================================================= */

function normalizeTeacherStudioPage(
  page
){

  const requested =
    safeString(
      page,
      "overview"
    )
      .toLowerCase();


  const normalized =
    TEACHER_STUDIO_PAGE_ALIASES[
      requested
    ] ||
    requested;


  return TEACHER_STUDIO_PAGES[
    normalized
  ]
    ? normalized
    : "overview";

}


/* =========================================================
   ACTIVE PAGE CHECK

   Part 17 Messages uses this helper.
========================================================= */

function isTeacherStudioPageActive(
  page
){

  return (
    activeTeacherStudioPage ===
    normalizeTeacherStudioPage(
      page
    )
  );

}


/* =========================================================
   READ PAGE FROM URL

   Supported:
     teacher.html?section=grading
     teacher.html#grading

   section query takes priority over hash.
========================================================= */

function getTeacherStudioPageFromUrl(){

  try{

    const url =
      new URL(
        window.location.href
      );


    const queryPage =
      safeString(
        url.searchParams
          .get(
            "section"
          )
      );


    if (
      queryPage
    ){

      return normalizeTeacherStudioPage(
        queryPage
      );

    }


    const hashPage =
      safeString(
        window.location.hash
          .replace(
            /^#/,
            ""
          )
      );


    if (
      hashPage
    ){

      return normalizeTeacherStudioPage(
        decodeURIComponent(
          hashPage
        )
      );

    }

  }catch(
    error
  ){

    console.warn(
      "Teacher Studio route could not be read:",
      error
    );

  }


  return "overview";

}


/* =========================================================
   PAGE SECTION NAME

   Handles final HTML canonical names plus temporary aliases.
========================================================= */

function getTeacherSectionPageName(
  section
){

  if (
    !section
  ){

    return "";

  }


  return normalizeTeacherStudioPage(

    section.dataset
      ?.teacherPage ||

    section.dataset
      ?.studioPage ||

    ""

  );

}


/* =========================================================
   SET ACTIVE PAGE SECTION
========================================================= */

function setTeacherStudioActiveSection(
  page
){

  const normalized =
    normalizeTeacherStudioPage(
      page
    );


  document
    .querySelectorAll(
      "[data-teacher-page], [data-studio-page]"
    )
    .forEach(
      section => {

        const sectionPage =
          getTeacherSectionPageName(
            section
          );


        const active =
          sectionPage ===
          normalized;


        section.hidden =
          !active;


        section.classList
          .toggle(
            "active",
            active
          );


        section.setAttribute(
          "aria-hidden",
          active
            ? "false"
            : "true"
        );

      }
    );

}


/* =========================================================
   NAV ITEM PAGE NAME
========================================================= */

function getTeacherNavigationPageName(
  element
){

  if (
    !element
  ){

    return "";

  }


  return normalizeTeacherStudioPage(

    element.dataset
      ?.teacherNav ||

    element.dataset
      ?.teacherPageTarget ||

    element.dataset
      ?.studentStudioPage ||

    ""

  );

}


/* =========================================================
   UPDATE NAVIGATION STATE
========================================================= */

function setTeacherStudioActiveNavigation(
  page
){

  const normalized =
    normalizeTeacherStudioPage(
      page
    );


  document
    .querySelectorAll(
      [
        "[data-teacher-nav]",
        "[data-teacher-page-target]",
        "[data-student-studio-page]"
      ].join(",")
    )
    .forEach(
      element => {

        const elementPage =
          getTeacherNavigationPageName(
            element
          );


        const active =
          elementPage ===
          normalized;


        element.classList
          .toggle(
            "active",
            active
          );


        if (
          active
        ){

          element.setAttribute(
            "aria-current",
            "page"
          );

        }else{

          element.removeAttribute(
            "aria-current"
          );

        }

      }
    );

}


/* =========================================================
   BODY PAGE STATE
========================================================= */

function setTeacherStudioBodyPage(
  page
){

  const normalized =
    normalizeTeacherStudioPage(
      page
    );


  document.body
    .dataset.teacherSection =
    normalized;


  /*
    Temporary compatibility for CSS copied from the earlier
    Student Studio architecture.

    Final HTML/CSS cleanup can remove this when no styles rely
    on it anymore.
  */

  document.body
    .dataset.studentSection =
    normalized;

}


/* =========================================================
   CLOSE MOBILE / FLOATING MENUS

   Uses existing shell classes when present.
========================================================= */

function closeTeacherStudioMenus(){

  document.body
    .classList
    .remove(
      "teacher-mobile-menu-open",
      "sidebar-open",
      "mobile-menu-open"
    );


  const sidebar =
    $(
      "teacherSidebar"
    );


  if (
    sidebar
  ){

    sidebar.classList
      .remove(
        "mobile-open"
      );

  }


  const overlay =
    $(
      "teacherMobileOverlay"
    );


  if (
    overlay
  ){

    overlay.classList
      .remove(
        "active"
      );

    overlay.hidden =
      true;

  }

}


/* =========================================================
   PAGE RENDER MAP

   Each page has ONE authoritative renderer.
========================================================= */

function getTeacherStudioRenderer(
  page
){

  const normalized =
    normalizeTeacherStudioPage(
      page
    );


  const renderers = {

    overview:
      typeof renderStudioHome ===
        "function"
        ? renderStudioHome
        : null,


    updates:
      typeof renderTeacherSchoolUpdates ===
        "function"
        ? renderTeacherSchoolUpdates
        : null,


    classes:
      typeof renderTeacherClassesWorkspace ===
        "function"
        ? renderTeacherClassesWorkspace
        : null,


    students:
      typeof renderTeacherStudentsWorkspace ===
        "function"
        ? renderTeacherStudentsWorkspace
        : null,


    assignments:
      typeof renderTeacherAssignmentsWorkspace ===
        "function"
        ? renderTeacherAssignmentsWorkspace
        : null,


    submissions:
      typeof renderTeacherSubmissionsWorkspace ===
        "function"
        ? renderTeacherSubmissionsWorkspace
        : (
            typeof renderTeacherSubmissions ===
              "function"
              ? renderTeacherSubmissions
              : null
          ),


    grading:
      typeof renderTeacherGradingWorkspace ===
        "function"
        ? renderTeacherGradingWorkspace
        : null,


attendance:
  typeof renderTeacherAttendanceWorkspace ===
    "function"
    ? renderTeacherAttendanceWorkspace
    : null,


schedule:
  typeof renderTeacherScheduleWorkspace ===
    "function"
    ? renderTeacherScheduleWorkspace
    : null,


resources:
  typeof renderTeacherResourcesWorkspace ===
    "function"
    ? renderTeacherResourcesWorkspace
    : null,


    analytics:
      typeof renderTeacherAnalyticsWorkspace ===
        "function"
        ? renderTeacherAnalyticsWorkspace
        : null,


    ai:
      typeof renderKabezyaTeacherAssistant ===
        "function"
        ? renderKabezyaTeacherAssistant
        : null,


    messages:
      typeof renderTeacherMessagesWorkspace ===
        "function"
        ? renderTeacherMessagesWorkspace
        : null,


    settings:
      typeof renderTeacherSettingsWorkspace ===
        "function"
        ? renderTeacherSettingsWorkspace
        : null,


    support:
      typeof renderTeacherSupportWorkspace ===
        "function"
        ? renderTeacherSupportWorkspace
        : null

  };


  return (
    renderers[
      normalized
    ] ||
    null
  );

}


/* =========================================================
   RENDER ACTIVE PAGE
========================================================= */

async function renderActiveTeacherStudioPage(
  page =
    activeTeacherStudioPage
){

  const normalized =
    normalizeTeacherStudioPage(
      page
    );


  const renderer =
    getTeacherStudioRenderer(
      normalized
    );


  if (
    typeof renderer !==
    "function"
  ){

    console.warn(
      `Teacher Studio renderer missing for "${normalized}".`
    );


    return false;

  }


  teacherStudioRouterState
    .rendering =
    true;


  try{

    const result =
      renderer();


    if (
      result &&
      typeof result.then ===
        "function"
    ){

      await result;

    }


    return true;

  }catch(
    error
  ){

    console.error(
      `Teacher Studio render failed for "${normalized}":`,
      error
    );


    notifyAIFTError(
      getErrorMessage(
        error,
        "This Teacher Studio section could not be displayed."
      ),
      {
        title:
          "Section error"
      }
    );


    return false;

  }finally{

    teacherStudioRouterState
      .rendering =
      false;

  }

}


/* =========================================================
   UPDATE BROWSER ROUTE
========================================================= */

function updateTeacherStudioHistory(
  page,
  {
    replace =
      false
  } = {}
){

  const normalized =
    normalizeTeacherStudioPage(
      page
    );


  try{

    const url =
      new URL(
        window.location.href
      );


    if (
      normalized ===
      "overview"
    ){

      url.searchParams
        .delete(
          "section"
        );

      url.hash =
        "";

    }else{

      url.searchParams
        .set(
          "section",
          normalized
        );

      /*
        Keep URL clean.

        section query is authoritative once set.
      */

      url.hash =
        "";

    }


    const historyState = {

      teacherStudioPage:
        normalized

    };


    if (
      replace
    ){

      window.history
        .replaceState(
          historyState,
          "",
          url
        );

    }else{

      window.history
        .pushState(
          historyState,
          "",
          url
        );

    }

  }catch(
    error
  ){

    console.warn(
      "Teacher Studio history could not be updated:",
      error
    );

  }

}


/* =========================================================
   SCROLL WORKSPACE TO TOP
========================================================= */

function scrollTeacherStudioToTop(
  behavior =
    "auto"
){

  const workspace =

    $(
      "teacherStudioWorkspace"
    ) ||

    document.querySelector(
      ".teacher-main-content"
    ) ||

    document.querySelector(
      ".center-col"
    ) ||

    document.querySelector(
      "main"
    );


  if (
    workspace &&
    typeof workspace.scrollTo ===
      "function" &&
    workspace.scrollHeight >
      workspace.clientHeight
  ){

    workspace.scrollTo({
      top:
        0,

      behavior
    });


    return;

  }


  window.scrollTo({
    top:
      0,

    behavior
  });

}


/* =========================================================
   ACTIVATE TEACHER STUDIO PAGE
========================================================= */

async function activateTeacherStudioPage(
  requestedPage,
  options = {}
){

  const page =
    normalizeTeacherStudioPage(
      requestedPage
    );


  activeTeacherStudioPage =
    page;


  setTeacherStudioBodyPage(
    page
  );


  setTeacherStudioActiveSection(
    page
  );


  setTeacherStudioActiveNavigation(
    page
  );


  closeTeacherStudioMenus();


  if (
    options.updateHistory !==
    false
  ){

    updateTeacherStudioHistory(
      page,
      {
        replace:
          options.replaceHistory ===
          true
      }
    );

  }


  await renderActiveTeacherStudioPage(
    page
  );


  if (
    options.scroll !==
    false
  ){

    scrollTeacherStudioToTop(
      options.smoothScroll ===
        true
        ? "smooth"
        : "auto"
    );

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


  return page;

}


/* =========================================================
   CURRENT PAGE
========================================================= */

function getActiveTeacherStudioPage(){

  return activeTeacherStudioPage;

}


/* =========================================================
   DATA ATTRIBUTE ID HELPER
========================================================= */

function getTeacherActionDataId(
  element,
  names
){

  if (
    !element
  ){

    return "";

  }


  for (
    const name of names
  ){

    const value =
      normalizeId(
        element.dataset?.[
          name
        ]
      );


    if (
      value
    ){

      return value;

    }

  }


  return "";

}


/* =========================================================
   EXECUTE OPTIONAL FUNCTION

   Avoid hard crashing if one future editor is not yet
   included during staged replacement.
========================================================= */

async function callTeacherActionFunction(
  functionName,
  ...args
){

  const fn =
    window[
      functionName
    ];


  if (
    typeof fn !==
    "function"
  ){

    console.warn(
      `Teacher Studio action "${functionName}" is not available.`
    );


    notifyAIFTWarning(
      "This Teacher Studio action is not available in the current build.",
      {
        title:
          "Action unavailable"
      }
    );


    return false;

  }


  const result =
    fn(
      ...args
    );


  if (
    result &&
    typeof result.then ===
      "function"
  ){

    return await result;

  }


  return result;

}


/* =========================================================
   OPEN CLASS
   Production Class Learning Experience

   Teacher Studio class actions must open the shared
   class-view.html learning experience.

   Class Builder remains a separate management action.
========================================================= */

function openTeacherClass(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){

    notifyAIFTWarning(
      "Select a class before opening the learning experience.",
      {
        title:
          "Class required"
      }
    );


    return false;

  }


  /*
    Keep the selected class synchronized with Teacher Studio.
  */

  state.selectedClassId =
    normalizedClassId;


  /*
    Build the shared production learning-view URL.

    "from=teacher" allows class-view.html to return the
    teacher to Teacher Studio instead of Student Studio.
  */

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
    "teacher"
  );


  /*
    Navigate in the current tab.

    Do not use window.open() because this is normal
    application navigation, not a preview window.
  */

  window.location.href =
    url.href;


  return true;

}


/* =========================================================
   OPEN CLASS FROM TEACHER ACTION CONTROLLER
========================================================= */

function openTeacherClassFromAction(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){

    notifyAIFTWarning(
      "Select a class before opening it.",
      {
        title:
          "Class required"
      }
    );


    return false;

  }


  return openTeacherClass(
    normalizedClassId
  );

}



/* =========================================================
   OPEN ASSIGNMENT SUBMISSIONS
========================================================= */

async function openTeacherAssignmentSubmissions(
  assignmentId
){

  const normalized =
    normalizeId(
      assignmentId
    );


  if (
    !normalized
  ){

    return false;

  }


  state.selectedAssignmentId =
    normalized;


  if (
    typeof teacherSubmissionWorkspaceState ===
      "object"
  ){

    teacherSubmissionWorkspaceState
      .assignmentId =
      normalized;

  }


  await activateTeacherStudioPage(
    "submissions"
  );


  return true;

}


/* =========================================================
   OPEN ASSIGNMENT GRADING
========================================================= */

async function openTeacherAssignmentGrading(
  assignmentId
){

  const normalized =
    normalizeId(
      assignmentId
    );


  if (
    !normalized
  ){

    return false;

  }


  state.selectedAssignmentId =
    normalized;


  if (
    typeof teacherGradingWorkspaceState ===
      "object"
  ){

    teacherGradingWorkspaceState
      .assignmentId =
      normalized;

    teacherGradingWorkspaceState
      .selectedSubmissionId =
      "";
  }


  await activateTeacherStudioPage(
    "grading"
  );


  return true;

}


/* =========================================================
   REVIEW SUBMISSION
========================================================= */

async function openTeacherSubmissionReview(
  submissionId
){

  const normalized =
    normalizeId(
      submissionId
    );


  if (
    !normalized
  ){

    return false;

  }


  if (
    typeof teacherGradingWorkspaceState ===
      "object"
  ){

    teacherGradingWorkspaceState
      .selectedSubmissionId =
      normalized;

  }


  state.selectedSubmissionId =
    normalized;


  await activateTeacherStudioPage(
    "grading"
  );


  if (
    typeof renderTeacherSubmissionViewer ===
    "function"
  ){

    renderTeacherSubmissionViewer(
      normalized
    );

  }


  return true;

}


/* =========================================================
   ANALYTICS -> STUDENT
========================================================= */

async function openTeacherAnalyticsStudent(
  studentId
){

  const normalized =
    normalizeId(
      studentId
    );


  if (
    !normalized
  ){

    return false;

  }


  teacherStudentWorkspaceState
    .selectedStudentId =
    normalized;


  await activateTeacherStudioPage(
    "students"
  );


  renderTeacherSelectedStudent(
    normalized
  );


  return true;

}


/* =========================================================
   ANALYTICS -> ASSIGNMENT
========================================================= */

async function openTeacherAnalyticsAssignment(
  assignmentId
){

  return openTeacherAssignmentGrading(
    assignmentId
  );

}


/* =========================================================
   ANALYTICS -> KABEZYA
========================================================= */

async function openTeacherAnalyticsKabezya(){

  const classId =
    normalizeId(
      teacherAnalyticsWorkspaceState
        ?.classId
    );


  prepareTeacherKabezyaClassAnalysis(
    classId
  );


  await activateTeacherStudioPage(
    "ai"
  );


  return true;

}


/* =========================================================
   CLASS -> STUDENTS
========================================================= */

async function openTeacherClassStudents(
  classId
){

  if (
    !prepareTeacherStudentsClass(
      classId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "students"
  );


  return true;

}


/* =========================================================
   CLASS -> ASSIGNMENTS
========================================================= */

async function openTeacherClassAssignments(
  classId
){

  const normalized =
    normalizeId(
      classId
    );


  if (
    !getTeacherClassById(
      normalized
    )
  ){

    return false;

  }


  state.selectedClassId =
    normalized;


  if (
    typeof teacherAssignmentWorkspaceState ===
      "object"
  ){

    teacherAssignmentWorkspaceState
      .classId =
      normalized;

  }


  await activateTeacherStudioPage(
    "assignments"
  );


  return true;

}


/* =========================================================
   CLASS / SCHEDULE -> ATTENDANCE

   Supports:

     openTeacherClassAttendance(classId)
       manual/class attendance

     openTeacherScheduleAttendance(scheduleId)
       exact scheduled session attendance

   The Schedule path binds:
     classId
     scheduleId
     date

   before opening Attendance.
========================================================= */


/* =========================================================
   CLASS -> MANUAL ATTENDANCE
========================================================= */

async function openTeacherClassAttendance(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  const classItem =
    getTeacherClassById(
      normalizedClassId
    );


  if (
    !classItem
  ){

    notifyAIFTWarning(
      "Select one of your assigned classes before opening Attendance.",
      {
        title:
          "Class required"
      }
    );


    return false;

  }


  teacherAttendanceWorkspaceState
    .classId =
    normalizedClassId;


  /*
    Class navigation means manual/date-based Attendance,
    therefore clear a previously selected scheduled session.
  */

  teacherAttendanceWorkspaceState
    .scheduleId =
    "";


  teacherAttendanceWorkspaceState
    .selectedStudentId =
    "";


  teacherAttendanceWorkspaceState
    .search =
    "";


  await activateTeacherStudioPage(
    "attendance"
  );


  return true;

}


/* =========================================================
   SCHEDULE -> EXACT SESSION ATTENDANCE
========================================================= */

async function openTeacherScheduleAttendance(
  scheduleId
){

  const normalizedScheduleId =
    normalizeId(
      scheduleId
    );


  if (
    !normalizedScheduleId
  ){

    notifyAIFTError(
      "The selected Schedule could not be identified.",
      {
        title:
          "Attendance unavailable"
      }
    );


    return false;

  }


  const schedule =
    getTeacherScheduleById(
      normalizedScheduleId
    );


  if (
    !schedule
  ){

    notifyAIFTError(
      "The selected teaching session is no longer available.",
      {
        title:
          "Schedule unavailable"
      }
    );


    return false;

  }


  const status =
    getTeacherScheduleStatus(
      schedule
    );


  if (
    ![
      "started",
      "completed"
    ].includes(
      status
    )
  ){

    notifyAIFTWarning(
      status ===
        "scheduled" ||
      status ===
        "rescheduled"
        ? "Start this teaching session before taking Attendance."
        : "Attendance cannot be opened for this session in its current state.",
      {
        title:
          "Attendance not available"
      }
    );


    return false;

  }


  const classId =
    normalizeId(
      getTeacherScheduleClassId(
        schedule
      )
    );


  if (
    !classId ||
    !getTeacherClassById(
      classId
    )
  ){

    notifyAIFTError(
      "The class linked to this Schedule is not available to this Teacher.",
      {
        title:
          "Class unavailable"
      }
    );


    return false;

  }


  const scheduleDate =
    normalizeTeacherAttendanceDate(
      getTeacherScheduleDateString(
        schedule
      )
    );


  if (
    !scheduleDate
  ){

    notifyAIFTError(
      "This Schedule does not contain a valid Attendance date.",
      {
        title:
          "Schedule date unavailable"
      }
    );


    return false;

  }


  /* =====================================================
     BIND EXACT SESSION
  ===================================================== */

  teacherAttendanceWorkspaceState
    .classId =
    classId;


  teacherAttendanceWorkspaceState
    .scheduleId =
    normalizedScheduleId;


  teacherAttendanceWorkspaceState
    .date =
    scheduleDate;


  teacherAttendanceWorkspaceState
    .selectedStudentId =
    "";


  teacherAttendanceWorkspaceState
    .search =
    "";


  teacherAttendanceWorkspaceState
    .loading =
    true;


  /* =====================================================
     OPEN ATTENDANCE PAGE
  ===================================================== */

  await activateTeacherStudioPage(
    "attendance"
  );


  try{

    const records =
      await loadTeacherAttendanceForClass(
        classId,
        scheduleDate,
        normalizedScheduleId
      );


    /*
      Remove only Attendance belonging to this exact Schedule
      before merging authoritative server records.
    */

    state.attendance =
      state.attendance
        .filter(
          record => {

            const recordScheduleId =
              normalizeId(
                record
                  ?.scheduleId
                  ?._id ||
                record
                  ?.scheduleId
              );


            return !sameId(
              recordScheduleId,
              normalizedScheduleId
            );

          }
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


    teacherAttendanceWorkspaceState
      .loading =
      false;


    renderTeacherAttendanceWorkspace();


    return true;

  }catch(
    error
  ){

    teacherAttendanceWorkspaceState
      .loading =
      false;


    console.error(
      "openTeacherScheduleAttendance error:",
      error
    );


    renderTeacherAttendanceWorkspace();


    notifyAIFTError(
      getErrorMessage(
        error,
        "Attendance for this teaching session could not be loaded."
      ),
      {
        title:
          "Attendance unavailable"
      }
    );


    return false;

  }

}


/* =========================================================
   EXPORT ATTENDANCE NAVIGATION
========================================================= */

window.openTeacherClassAttendance =
  openTeacherClassAttendance;


window.openTeacherScheduleAttendance =
  openTeacherScheduleAttendance;

/* =========================================================
   CLASS BUILDER ACCESS CONTROL
========================================================= */


/* =========================================================
   CLASS BUILDER ROLE
========================================================= */

function getTeacherClassBuilderRole(){

  return normalizeRole(
    getAuthenticatedRole()
  );

}


/* =========================================================
   CLASS SCHOOL ID
========================================================= */

function getTeacherClassBuilderSchoolId(
  classItem
){

  return normalizeId(

    classItem?.schoolId?._id ||

    classItem?.schoolId ||

    classItem?.school?._id ||

    classItem?.school ||

    ""

  );

}


/* =========================================================
   CLASS ASSIGNED TEACHER ID
========================================================= */

function getTeacherClassBuilderTeacherId(
  classItem
){

  return normalizeId(

    classItem?.teacherId?._id ||

    classItem?.teacherId ||

    classItem?.teacher?._id ||

    classItem?.teacher ||

    ""

  );

}


/* =========================================================
   CAN CURRENT USER OPEN THIS CLASS BUILDER

   SECURITY MODEL
   ---------------------------------------------------------

   ADMIN:
     Can open classes available to the authenticated admin.

   SCHOOL:
     Can only open classes belonging to that School.

   TEACHER:
     Must be explicitly assigned as class.teacherId.

   Frontend checks are UX + defense in depth only.

   /api/classes/:classId/builder MUST independently enforce
   these rules on the backend.
========================================================= */

function canOpenTeacherClassBuilder(
  classItem
){

  if (
    !classItem
  ){

    return false;

  }


  const role =
    getTeacherClassBuilderRole();


  const authenticatedUserId =
    normalizeId(
      getAuthenticatedUserId()
    );


  const teacherId =
    normalizeId(
      getTeacherId()
    );


  const currentSchoolId =
    normalizeId(
      getSchoolId()
    );


  const classTeacherId =
    getTeacherClassBuilderTeacherId(
      classItem
    );


  const classSchoolId =
    getTeacherClassBuilderSchoolId(
      classItem
    );


  /* =====================================================
     ADMIN
  ===================================================== */

  if (
    role ===
    "admin"
  ){

    return true;

  }


  /* =====================================================
     SCHOOL
  ===================================================== */

  if (
    role ===
    "school"
  ){

    return Boolean(
      currentSchoolId &&
      classSchoolId &&
      sameId(
        currentSchoolId,
        classSchoolId
      )
    );

  }


  /* =====================================================
     TEACHER
  ===================================================== */

  if (
    role ===
    "teacher"
  ){

    const effectiveTeacherId =
      teacherId ||
      authenticatedUserId;


    if (
      !effectiveTeacherId ||
      !classTeacherId
    ){

      return false;

    }


    /*
      Teacher must be the assigned instructor.
    */

    if (
      !sameId(
        effectiveTeacherId,
        classTeacherId
      )
    ){

      return false;

    }


    /*
      If both School IDs are available, they must also match.

      This protects against malformed or stale class data.
    */

    if (
      currentSchoolId &&
      classSchoolId &&
      !sameId(
        currentSchoolId,
        classSchoolId
      )
    ){

      return false;

    }


    return true;

  }


  return false;

}


/* =========================================================
   GET CLASSES AVAILABLE TO CLASS BUILDER
========================================================= */

function getTeacherClassBuilderClasses(){

  return asArray(
    state.classes
  )
    .filter(
      classItem =>
        canOpenTeacherClassBuilder(
          classItem
        )
    );

}


/* =========================================================
   FIND AN AUTHORIZED CLASS
========================================================= */

function getAuthorizedTeacherClassBuilderClass(
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
    getTeacherClassBuilderClasses()
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
   BUILD CLASS BUILDER URL
========================================================= */

function getTeacherClassBuilderUrl(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){

    return "";

  }


  return `class-builder.html?classId=${
    encodeURIComponent(
      normalizedClassId
    )
  }`;

}


/* =========================================================
   OPEN CLASS BUILDER FOR ONE CLASS
========================================================= */

function openTeacherClassBuilderForClass(
  classId
){

  const normalizedClassId =
    normalizeId(
      classId
    );


  if (
    !normalizedClassId
  ){

    notifyAIFTWarning(
      "Select a class before opening Class Builder.",
      {
        title:
          "Class required"
      }
    );


    return false;

  }


  /*
    IMPORTANT:

    Do NOT accept an arbitrary classId merely because it exists
    in the URL or came from a clicked element.

    Resolve it again through the authorized Builder collection.
  */

  const classItem =
    getAuthorizedTeacherClassBuilderClass(
      normalizedClassId
    );


  if (
    !classItem
  ){

    notifyAIFTError(
      "You do not have permission to open Class Builder for this class.",
      {
        title:
          "Class Builder access denied"
      }
    );


    return false;

  }


  const url =
    getTeacherClassBuilderUrl(
      normalizedClassId
    );


  if (
    !url
  ){

    return false;

  }


  window.location.href =
    url;


  return true;

}


/* =========================================================
   OPEN CLASS BUILDER FROM SIDEBAR / DASHBOARD
========================================================= */

async function openTeacherClassBuilder(){

  const classes =
    getTeacherClassBuilderClasses();


  /* =====================================================
     NO AUTHORIZED CLASSES
  ===================================================== */

  if (
    !classes.length
  ){

    notifyAIFTInfo(
      getTeacherClassBuilderRole() ===
        "teacher"
        ? "You are not currently assigned to a class that you can open in Class Builder."
        : "There are no classes available for Class Builder.",
      {
        title:
          "No Class Builder access"
      }
    );


    return false;

  }


  /* =====================================================
     EXACTLY ONE CLASS
  ===================================================== */

  if (
    classes.length ===
    1
  ){

    return openTeacherClassBuilderForClass(

      classes[0]?._id ||

      classes[0]?.id

    );

  }


  /* =====================================================
     MULTIPLE CLASSES

     Send the teacher to My Classes where each class card
     individually applies the same authorization check.
  ===================================================== */

  notifyAIFTInfo(
    "Choose the class you want to open in Class Builder.",
    {
      title:
        "Select an authorized class"
    }
  );


  await activateTeacherStudioPage(
    "classes"
  );


  return true;

}

/* =========================================================
   CLASS -> SCHEDULE
========================================================= */

async function openTeacherClassSchedule(
  classId
){

  const normalized =
    normalizeId(
      classId
    );


  if (
    !getTeacherClassById(
      normalized
    )
  ){

    return false;

  }


  if (
    typeof teacherScheduleWorkspaceState ===
      "object"
  ){

    teacherScheduleWorkspaceState
      .classId =
      normalized;

  }


  await activateTeacherStudioPage(
    "schedule"
  );


  return true;

}


/* =========================================================
   CLASS -> ANALYTICS
========================================================= */

async function openTeacherClassAnalytics(
  classId
){

  if (
    !prepareTeacherAnalyticsClass(
      classId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "analytics"
  );


  return true;

}


/* =========================================================
   STUDENT -> WORK
========================================================= */

async function openTeacherStudentWork(
  studentId
){

  if (
    !prepareTeacherStudentWork(
      studentId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "submissions"
  );


  return true;

}


/* =========================================================
   STUDENT -> GRADING
========================================================= */

async function openTeacherStudentGrading(
  studentId
){

  if (
    !prepareTeacherStudentGrading(
      studentId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "grading"
  );


  return true;

}


/* =========================================================
   STUDENT -> ATTENDANCE
========================================================= */

async function openTeacherStudentAttendance(
  studentId
){

  if (
    !prepareTeacherStudentAttendance(
      studentId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "attendance"
  );


  return true;

}


/* =========================================================
   STUDENT -> KABEZYA
========================================================= */

async function openTeacherStudentKabezya(
  studentId
){

  if (
    !prepareTeacherKabezyaStudentAnalysis(
      studentId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "ai"
  );


  return true;

}


/* =========================================================
   SUBMISSION -> KABEZYA
========================================================= */

async function openTeacherSubmissionKabezya(
  submissionId
){

  if (
    !prepareTeacherKabezyaSubmissionReview(
      submissionId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "ai"
  );


  return true;

}


/* =========================================================
   SUPPORT -> KABEZYA
========================================================= */

async function openTeacherSupportKabezya(){

  prepareTeacherSupportKabezya();


  await activateTeacherStudioPage(
    "ai"
  );


  renderTeacherKabezyaComposer();


  window.requestAnimationFrame(
    () => {

      const input =
        $(
          "teacherKabezyaPrompt"
        );


      if (
        input
      ){

        input.value =
          teacherKabezyaWorkspaceState
            .prompt;

        input.focus();

      }

    }
  );


  return true;

}


/* =========================================================
   QUESTION ACTION IDs
========================================================= */

function getQuestionIdFromAction(
  element
){

  return getTeacherActionDataId(
    element,
    [
      "questionId"
    ]
  );

}


/* =========================================================
   QUIZ ACTION IDS
========================================================= */

function getQuizIdFromAction(
  element
){

  return getTeacherActionDataId(
    element,
    [
      "quizId"
    ]
  );

}


/* =========================================================
   STUDENT ACTION ID
========================================================= */

function getStudentIdFromAction(
  element
){

  return getTeacherActionDataId(
    element,
    [
      "studentId",
      "userId"
    ]
  );

}


/* =========================================================
   CLASS ACTION ID
========================================================= */

function getClassIdFromAction(
  element
){

  return getTeacherActionDataId(
    element,
    [
      "classId"
    ]
  );

}


/* =========================================================
   ASSIGNMENT ACTION ID
========================================================= */

function getAssignmentIdFromAction(
  element
){

  return getTeacherActionDataId(
    element,
    [
      "assignmentId"
    ]
  );

}


/* =========================================================
   SUBMISSION ACTION ID
========================================================= */

function getSubmissionIdFromAction(
  element
){

  return getTeacherActionDataId(
    element,
    [
      "submissionId"
    ]
  );

}


/* =========================================================
   CENTRAL ACTION DISPATCHER

   ONE document-level action listener handles every
   data-teacher-action control created across Parts 3–17.
========================================================= */

async function dispatchTeacherStudioAction(
  action,
  element,
  event
){

  const normalizedAction =
    safeString(
      action
    )
      .toLowerCase();


  switch(
    normalizedAction
  ){

    /* =====================================================
       GENERIC NAVIGATION
    ===================================================== */

    case "navigate":{

      const page =
        normalizeTeacherStudioPage(
          element.dataset
            .page
        );


      await activateTeacherStudioPage(
        page
      );


      return true;

    }


    /* =====================================================
       CLASSES
    ===================================================== */

    case "open-class":

      return openTeacherClassFromAction(
        getClassIdFromAction(
          element
        )
      );


    case "class-students":

      return openTeacherClassStudents(
        getClassIdFromAction(
          element
        )
      );


case "class-assignments":

  return openTeacherClassAssignments(
    getClassIdFromAction(
      element
    )
  );


case "class-grading":{

  const classId =
    getClassIdFromAction(
      element
    );


  if (
    !prepareTeacherGradingClass(
      classId
    )
  ){

    return false;

  }


  await activateTeacherStudioPage(
    "grading"
  );


  return true;

}


case "class-attendance":

  return openTeacherClassAttendance(
    getClassIdFromAction(
      element
    )
  );


case "class-schedule":

  return openTeacherClassSchedule(
    getClassIdFromAction(
      element
    )
  );


case "class-analytics":

  return openTeacherClassAnalytics(
    getClassIdFromAction(
      element
    )
  );


/* =====================================================
   CLEAR CLASS FILTERS

   Current Classes empty-state renderer uses:

     clear-class-filters

   Older aliases are intentionally retained because some
   existing markup may still emit them.
===================================================== */

case "clear-class-filters":
case "clear-class-filter":
case "clear-filters":

  clearTeacherClassFilters();

  return true;


/* =====================================================
   REFRESH CLASSES
===================================================== */

case "refresh-classes":

  return callTeacherActionFunction(
    "refreshTeacherClassesWorkspace"
  );


/* =====================================================
   STUDENTS
===================================================== */

    case "open-student":

      return openTeacherSelectedStudent(
        getStudentIdFromAction(
          element
        )
      );


    case "close-student-detail":

      return closeTeacherSelectedStudent();


    case "student-work":

      return openTeacherStudentWork(
        getStudentIdFromAction(
          element
        )
      );


    case "student-grading":

      return openTeacherStudentGrading(
        getStudentIdFromAction(
          element
        )
      );


    case "student-attendance":

      return openTeacherStudentAttendance(
        getStudentIdFromAction(
          element
        )
      );


    case "student-kabezya":

      return openTeacherStudentKabezya(
        getStudentIdFromAction(
          element
        )
      );


    case "message-student":

      return messageTeacherStudent(
        getStudentIdFromAction(
          element
        )
      );


    case "student-class":{

      const classId =
        getClassIdFromAction(
          element
        );


      state.selectedClassId =
        classId;


      await activateTeacherStudioPage(
        "classes"
      );


      return openTeacherClassFromAction(
        classId
      );

    }

   case "clear-student-filters":

  teacherStudentWorkspaceState
    .search =
    "";

  teacherStudentWorkspaceState
    .classId =
    "";

  teacherStudentWorkspaceState
    .progress =
    "";


  if (
    $("teacherStudentSearch")
  ){

    $("teacherStudentSearch").value =
      "";

  }


  if (
    $("teacherStudentClassFilter")
  ){

    $("teacherStudentClassFilter").value =
      "";

  }


  if (
    $("teacherStudentProgressFilter")
  ){

    $("teacherStudentProgressFilter").value =
      "";

  }


  renderTeacherStudentsWorkspace();


  return true;


    case "refresh-students":

      return callTeacherActionFunction(
        "refreshTeacherStudentsWorkspace"
      );


/* =====================================================
   ASSIGNMENTS
===================================================== */

case "open-assignment":{

  const assignmentId =
    getAssignmentIdFromAction(
      element
    );


  if (
    !assignmentId
  ){

    return false;

  }


  state.selectedAssignmentId =
    assignmentId;


  if (
    typeof teacherAssignmentWorkspaceState ===
      "object"
  ){

    teacherAssignmentWorkspaceState
      .selectedAssignmentId =
      assignmentId;

  }


  await activateTeacherStudioPage(
    "assignments"
  );


  if (
    typeof openTeacherAssignmentEditor ===
      "function"
  ){

    openTeacherAssignmentEditor(
      assignmentId
    );

  }


  return true;

}


case "create-assignment":

  return callTeacherActionFunction(
    "openTeacherAssignmentEditor"
  );


    case "edit-assignment":

      return callTeacherActionFunction(
        "openTeacherAssignmentEditor",
        getAssignmentIdFromAction(
          element
        )
      );


    case "assignment-submissions":

      return openTeacherAssignmentSubmissions(
        getAssignmentIdFromAction(
          element
        )
      );


    case "assignment-grading":

      return openTeacherAssignmentGrading(
        getAssignmentIdFromAction(
          element
        )
      );


    case "delete-assignment":

      return callTeacherActionFunction(
        "deleteTeacherAssignment",
        getAssignmentIdFromAction(
          element
        )
      );


    case "save-assignment":

      return callTeacherActionFunction(
        "saveTeacherAssignment"
      );


    case "close-assignment-editor":

      return callTeacherActionFunction(
        "closeTeacherAssignmentEditor"
      );


    case "refresh-assignments":

      return callTeacherActionFunction(
        "refreshTeacherAssignmentsWorkspace"
      );


/* =====================================================
   SUBMISSIONS / GRADING
===================================================== */


/* -----------------------------------------------------
   OPEN SUBMISSION FROM STUDENT WORK
----------------------------------------------------- */

case "review-submission":{

  const submissionId =
    getSubmissionIdFromAction(
      element
    );


  if (
    !submissionId
  ){

    return false;

  }


  /*
    prepareTeacherGradingSubmission() also synchronizes
    classId + assignmentId + selectedSubmissionId.
  */

  if (
    typeof prepareTeacherGradingSubmission ===
      "function"
  ){

    if (
      !prepareTeacherGradingSubmission(
        submissionId
      )
    ){

      return false;

    }

  }else{

    teacherGradingWorkspaceState
      .selectedSubmissionId =
      submissionId;

  }


  state.selectedSubmissionId =
    submissionId;


  await activateTeacherStudioPage(
    "grading"
  );


  renderTeacherGradingWorkspace();


  return true;

}


/* -----------------------------------------------------
   SELECT ITEM INSIDE GRADING QUEUE
----------------------------------------------------- */

case "select-grading-submission":{

  const submissionId =
    getSubmissionIdFromAction(
      element
    );


  if (
    !submissionId
  ){

    return false;

  }


  return selectTeacherGradingSubmission(
    submissionId
  );

}


/* -----------------------------------------------------
   SAVE TEACHER ASSESSMENT
----------------------------------------------------- */

case "save-submission-review":

  return saveTeacherSubmissionReview();


/* -----------------------------------------------------
   CLOSE VIEWER / CLEAR SELECTION
----------------------------------------------------- */

case "close-submission-viewer":

  teacherGradingWorkspaceState
    .selectedSubmissionId =
    "";


  state.selectedSubmissionId =
    "";


  renderTeacherGradingSubmissionList();

  renderTeacherSubmissionViewer();


  return true;


/* -----------------------------------------------------
   KABEZYA — CANONICAL ACTION
----------------------------------------------------- */

case "submission-kabezya":

  return openTeacherSubmissionKabezya(
    getSubmissionIdFromAction(
      element
    ) ||
    normalizeId(
      teacherGradingWorkspaceState
        .selectedSubmissionId
    )
  );


/* -----------------------------------------------------
   KABEZYA — BACKWARD COMPATIBILITY

   Existing Grading viewer currently emits:
   kabezya-review-submission

   Keep this alias so the current renderer works while
   preserving submission-kabezya as the canonical action.
----------------------------------------------------- */

case "kabezya-review-submission":

  return openTeacherSubmissionKabezya(
    getSubmissionIdFromAction(
      element
    ) ||
    normalizeId(
      teacherGradingWorkspaceState
        .selectedSubmissionId
    )
  );


/* -----------------------------------------------------
   REFRESH GRADING
----------------------------------------------------- */
case "grading-show-all":

  teacherGradingWorkspaceState
    .status =
    "all";


  teacherGradingWorkspaceState
    .selectedSubmissionId =
    "";


  ensureTeacherGradingSelection();


  renderTeacherGradingWorkspace();


  return true;

        
case "refresh-grading":

  return refreshTeacherGradingWorkspace();


/* -----------------------------------------------------
   REFRESH STUDENT WORK
----------------------------------------------------- */

case "refresh-submissions":

  return refreshTeacherSubmissionsWorkspace();


/* =====================================================
   ATTENDANCE
   PRODUCTION ACTION ROUTING

   Supports both:
     legacy Attendance controls
     current session-aware Attendance controls
===================================================== */


/* =====================================================
   ONE STUDENT STATUS

   Generated by:
     createTeacherAttendanceStatusButton()
===================================================== */

case "set-attendance-status":{

  const studentId =
    getTeacherActionDataId(
      element,
      [
        "studentId"
      ]
    );


  const status =
    safeString(
      element.dataset
        .attendanceStatus
    )
      .toLowerCase();


  return updateTeacherAttendanceStatus(
    studentId,
    status
  );

}


/* =====================================================
   BULK ATTENDANCE

   Generated by current Attendance bulk renderer.
===================================================== */

case "bulk-attendance":{

  const status =
    safeString(
      element.dataset
        .attendanceStatus
    )
      .toLowerCase();


  return saveTeacherBulkAttendance(
    status
  );

}


/* =====================================================
   LEGACY BULK STATUS ALIASES
===================================================== */

case "attendance-present":

  return saveTeacherBulkAttendance(
    "present"
  );


case "attendance-late":

  return saveTeacherBulkAttendance(
    "late"
  );


case "attendance-absent":

  return saveTeacherBulkAttendance(
    "absent"
  );


case "attendance-excused":

  return saveTeacherBulkAttendance(
    "excused"
  );


/* =====================================================
   TODAY
===================================================== */

case "attendance-today":

  return setTeacherAttendanceToToday();


/* =====================================================
   STUDENT HISTORY
===================================================== */

case "attendance-student-history":{

  const studentId =
    getTeacherActionDataId(
      element,
      [
        "studentId"
      ]
    );


  teacherAttendanceWorkspaceState
    .selectedStudentId =
    studentId;


  renderTeacherAttendanceStudentHistory(
    studentId
  );


  return true;

}


/* =====================================================
   CLOSE STUDENT HISTORY
===================================================== */

case "close-attendance-history":

  teacherAttendanceWorkspaceState
    .selectedStudentId =
    "";


  renderTeacherAttendanceStudentHistory(
    ""
  );


  return true;


/* =====================================================
   SAVE ATTENDANCE

   Legacy compatibility.

   The modern Attendance renderer persists immediately when
   statuses are selected, so this remains only for old markup.
===================================================== */

case "save-attendance":

  if (
    typeof window
      .saveTeacherAttendance ===
    "function"
  ){

    return window
      .saveTeacherAttendance();

  }


  return true;


/* =====================================================
   REFRESH ATTENDANCE
===================================================== */

case "refresh-attendance":

  return refreshTeacherAttendanceWorkspace();


/* =====================================================
   SCHEDULE
===================================================== */


   case "schedule-prev-month":

  return callTeacherActionFunction(
    "changeTeacherScheduleMonth",
    -1
  );


case "schedule-next-month":

  return callTeacherActionFunction(
    "changeTeacherScheduleMonth",
    1
  );

   case "open-schedule":{

  const scheduleId =
    getTeacherActionDataId(
      element,
      [
        "scheduleId"
      ]
    );


  const classId =
    getClassIdFromAction(
      element
    );


  if (
    typeof teacherScheduleWorkspaceState ===
      "object"
  ){

    if (
      scheduleId
    ){

      teacherScheduleWorkspaceState
        .selectedScheduleId =
        scheduleId;

    }


    if (
      classId
    ){

      teacherScheduleWorkspaceState
        .classId =
        classId;

    }

  }


  await activateTeacherStudioPage(
    "schedule"
  );


  if (
    scheduleId &&
    typeof openTeacherScheduleEditor ===
      "function"
  ){

    openTeacherScheduleEditor(
      scheduleId
    );

  }


  return true;

}

/* =====================================================
   SCHEDULE
===================================================== */

case "create-schedule":

  return callTeacherActionFunction(
    "openTeacherScheduleEditor"
  );


case "edit-schedule":

  return callTeacherActionFunction(
    "openTeacherScheduleEditor",
    getTeacherActionDataId(
      element,
      [
        "scheduleId"
      ]
    )
  );


case "delete-schedule":

  return callTeacherActionFunction(
    "deleteTeacherSchedule",
    getTeacherActionDataId(
      element,
      [
        "scheduleId"
      ]
    )
  );


case "save-schedule":

  return callTeacherActionFunction(
    "saveTeacherSchedule"
  );


case "close-schedule-editor":

  return callTeacherActionFunction(
    "closeTeacherScheduleEditor"
  );


case "refresh-schedule":

  return callTeacherActionFunction(
    "refreshTeacherScheduleWorkspace"
  );


/* =====================================================
   START SESSION

   Calls:
     POST /api/schedules/:id/start

   Attendance records are initialized by the backend.
===================================================== */

case "start-schedule":
case "start-schedule-session":

  return callTeacherActionFunction(
    "startTeacherScheduleSession",
    getTeacherActionDataId(
      element,
      [
        "scheduleId"
      ]
    )
  );


/* =====================================================
   OPEN MEETING

   Only works after sessionStatus = started.
===================================================== */

case "join-schedule":
case "open-schedule-meeting":

  return callTeacherActionFunction(
    "openTeacherScheduleMeeting",
    getTeacherActionDataId(
      element,
      [
        "scheduleId"
      ]
    )
  );


/* =====================================================
   COMPLETE SESSION

   Calls:
     POST /api/schedules/:id/complete

   Backend finalizes student Attendance.
===================================================== */

case "complete-schedule":
case "complete-schedule-session":

  return callTeacherActionFunction(
    "completeTeacherScheduleSession",
    getTeacherActionDataId(
      element,
      [
        "scheduleId"
      ]
    )
  );


/* =====================================================
   CLASS BUILDER
===================================================== */

case "open-class-builder":

  return openTeacherClassBuilder();


case "open-selected-class-builder":

  return openTeacherClassBuilderForClass(
    getClassIdFromAction(
      element
    )
  );


/* =====================================================
   RESOURCES
===================================================== */

case "refresh-resources":

  return refreshTeacherResources();


    /* =====================================================
       RESOURCES
    ===================================================== */

    case "refresh-resources":

      return refreshTeacherResources();


    /* =====================================================
       ANALYTICS
    ===================================================== */

    case "refresh-analytics":

      return refreshTeacherAnalyticsWorkspace();


    case "analytics-open-student":

      return openTeacherAnalyticsStudent(
        getStudentIdFromAction(
          element
        )
      );


    case "analytics-open-assignment":

      return openTeacherAnalyticsAssignment(
        getAssignmentIdFromAction(
          element
        )
      );


    case "analytics-ask-kabezya":

      return openTeacherAnalyticsKabezya();


/* =====================================================
   KABEZYA
===================================================== */

case "dashboard-lesson-assistant":

  startNewTeacherKabezyaConversation();


  setTeacherKabezyaMode(
    "lesson-plan"
  );


  await activateTeacherStudioPage(
    "ai"
  );


  return true;


/* =====================================================
   CHANGE MODE
===================================================== */

case "kabezya-mode":

  return setTeacherKabezyaMode(
    safeString(
      element.dataset
        .kabezyaMode
    )
  );


/* =====================================================
   QUICK PROMPT
===================================================== */

case "kabezya-quick-prompt":

  return runTeacherKabezyaQuickPrompt(
    safeString(
      element.dataset
        .kabezyaPrompt
    )
  );


/* =====================================================
   CLEAR CONTEXT
===================================================== */

case "kabezya-clear-context":

  return clearTeacherKabezyaContext();


/* =====================================================
   NEW CONVERSATION
===================================================== */

case "kabezya-new-conversation":

  return startNewTeacherKabezyaConversation();


/* =====================================================
   OPEN RECENT CONVERSATION
===================================================== */

case "kabezya-open-conversation":

  return openTeacherKabezyaConversation(
    normalizeId(
      element.dataset
        .kabezyaConversationId
    )
  );


/* =====================================================
   COPY MESSAGE
===================================================== */

case "kabezya-copy-message":

  return copyTeacherKabezyaMessage(
    normalizeId(
      element.dataset
        .kabezyaMessageId
    )
  );


/* =====================================================
   EDIT TEACHER MESSAGE
===================================================== */

case "kabezya-edit-message":

  return beginTeacherKabezyaMessageEdit(
    normalizeId(
      element.dataset
        .kabezyaMessageId
    )
  );


/* =====================================================
   CANCEL MESSAGE EDIT
===================================================== */

case "kabezya-cancel-message-edit":

  return cancelTeacherKabezyaMessageEdit();


/* =====================================================
   SAVE MESSAGE EDIT
===================================================== */

case "kabezya-save-message-edit":

  return saveTeacherKabezyaMessageEdit(
    normalizeId(
      element.dataset
        .kabezyaMessageId
    )
  );


/* =====================================================
   USE GENERATED FEEDBACK
===================================================== */

case "kabezya-use-feedback":

  return useTeacherKabezyaFeedbackSuggestion();


    /* =====================================================
       MESSAGES
    ===================================================== */

    case "open-full-messages":

      return openTeacherFullMessages();


    case "open-message-thread":

      return openTeacherMessageThread(
        getStudentIdFromAction(
          element
        )
      );


    case "refresh-messages":

      return refreshTeacherMessagesWorkspace();


    case "clear-message-search":

      return clearTeacherMessageSearch();


/* =====================================================
   SETTINGS
===================================================== */


/* =====================================================
   SETTINGS NAVIGATION
===================================================== */

case "settings-page":

  return setTeacherSettingsPage(
    safeString(
      element.dataset
        .settingsPage
    )
  );


/* =====================================================
   SAVE SETTINGS
===================================================== */

case "save-teacher-settings":

  return saveTeacherSettings();


/* =====================================================
   RESET SETTINGS
===================================================== */

case "reset-teacher-settings":

  return resetTeacherSettings();


    /* =====================================================
       SUPPORT
    ===================================================== */

    case "open-help-topic":

      return openTeacherHelpTopic(
        safeString(
          element.dataset
            .helpTopic
        )
      );


    case "close-help-topic":

      return closeTeacherHelpTopic();


    case "support-talk-kabezya":

      return openTeacherSupportKabezya();


    case "open-support-request":

      return renderTeacherSupportRequestForm();


    case "close-support-request":

      return closeTeacherSupportRequest();


    /* =====================================================
       UNKNOWN
    ===================================================== */

    default:

      console.warn(
        `Unhandled Teacher Studio action: "${normalizedAction}".`,
        element
      );


      return false;

  }

}


/* =========================================================
   CENTRAL ACTION CLICK HANDLER
========================================================= */

async function handleTeacherStudioActionClick(
  event
){

  const element =
    event.target
      .closest(
        "[data-teacher-action]"
      );


  if (
    !element
  ){

    return;

  }


  /*
    Allow modified clicks on actual links to behave normally.
  */

  if (
    element.tagName ===
      "A" &&
    (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey
    )
  ){

    return;

  }


  const action =
    safeString(
      element.dataset
        .teacherAction
    );


  if (
    !action
  ){

    return;

  }


  event.preventDefault();


  /*
    Prevent repeated mutation clicks while an async action is
    already running on this exact control.
  */

  if (
    element.dataset
      .teacherActionBusy ===
    "true"
  ){

    return;

  }


  element.dataset
    .teacherActionBusy =
    "true";


  try{

    await dispatchTeacherStudioAction(
      action,
      element,
      event
    );

  }catch(
    error
  ){

    console.error(
      `Teacher Studio action "${action}" failed:`,
      error
    );


    notifyAIFTError(
      getErrorMessage(
        error,
        "The requested Teacher Studio action could not be completed."
      ),
      {
        title:
          "Action failed"
      }
    );

  }finally{

    delete element.dataset
      .teacherActionBusy;

  }

}


/* =========================================================
   BIND CENTRAL ACTION CONTROLLER
========================================================= */

function bindTeacherStudioActionController(){

  if (
    teacherStudioRouterState
      .actionsBound
  ){

    return;

  }


  teacherStudioRouterState
    .actionsBound =
    true;


  document.addEventListener(
    "click",
    handleTeacherStudioActionClick
  );

}


/* =========================================================
   NAVIGATION CLICK
========================================================= */

async function handleTeacherStudioNavigationClick(
  event
){

  /*
    data-teacher-action controls belong to the action
    dispatcher, not navigation dispatcher.
  */

  if (
    event.target.closest(
      "[data-teacher-action]"
    )
  ){

    return;

  }


  const element =
    event.target
      .closest(
        [
          "[data-teacher-nav]",
          "[data-teacher-page-target]",
          "[data-student-studio-page]"
        ].join(",")
      );


  if (
    !element
  ){

    return;

  }


  const page =
    getTeacherNavigationPageName(
      element
    );


  if (
    !page
  ){

    return;

  }


  event.preventDefault();


  await activateTeacherStudioPage(
    page,
    {
      smoothScroll:
        true
    }
  );

}


/* =========================================================
   BIND NAVIGATION
========================================================= */

function bindTeacherStudioNavigation(){

  if (
    teacherStudioRouterState
      .navigationBound
  ){

    return;

  }


  teacherStudioRouterState
    .navigationBound =
    true;


  document.addEventListener(
    "click",
    handleTeacherStudioNavigationClick
  );

}


/* =========================================================
   HISTORY / BACK BUTTON
========================================================= */

function bindTeacherStudioHistory(){

  if (
    teacherStudioRouterState
      .historyBound
  ){

    return;

  }


  teacherStudioRouterState
    .historyBound =
    true;


  window.addEventListener(
    "popstate",
    () => {

      const page =
        getTeacherStudioPageFromUrl();


      activateTeacherStudioPage(
        page,
        {
          updateHistory:
            false,

          scroll:
            false
        }
      );

    }
  );

}


/* =========================================================
   ESCAPE KEY

   Close secondary detail/editor layers before doing anything
   to page routing.
========================================================= */

function bindTeacherStudioEscapeKey(){

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ){

        return;

      }


      /* ---------------------------------------------------
         QUESTION EDITOR
      --------------------------------------------------- */

      const questionEditor =
        $(
          "teacherQuestionEditor"
        );


      if (
        questionEditor &&
        !questionEditor.hidden
      ){

        closeTeacherQuestionEditor();

        return;

      }


      /* ---------------------------------------------------
         SUPPORT REQUEST
      --------------------------------------------------- */

      const supportRequest =
        $(
          "teacherSupportRequest"
        );


      if (
        supportRequest &&
        !supportRequest.hidden
      ){

        closeTeacherSupportRequest();

        return;

      }


      /* ---------------------------------------------------
         STUDENT DETAIL
      --------------------------------------------------- */

      const studentDetail =
        $(
          "teacherSelectedStudent"
        );


      if (
        studentDetail &&
        !studentDetail.hidden
      ){

        closeTeacherSelectedStudent();

        return;

      }


      /* ---------------------------------------------------
         QUIZ RESULTS
      --------------------------------------------------- */

      const quizResults =
        $(
          "teacherSelectedQuiz"
        );


      if (
        quizResults &&
        !quizResults.hidden
      ){

        closeTeacherQuizResults();

        return;

      }


      /* ---------------------------------------------------
         MOBILE MENU
      --------------------------------------------------- */

      closeTeacherStudioMenus();

    }
  );

}


/* =========================================================
   ROUTER INITIALIZATION
========================================================= */

function initializeTeacherStudioRouter(){

  bindTeacherStudioNavigation();

  bindTeacherStudioActionController();

  bindTeacherStudioHistory();

  bindTeacherStudioEscapeKey();

}


/* =========================================================
   INITIAL ROUTE

   Called from final Part 20 startup after authentication and
   initial data loading are complete.
========================================================= */

async function initializeTeacherStudioRoute(){

  const page =
    getTeacherStudioPageFromUrl();


  return activateTeacherStudioPage(
    page,
    {
      updateHistory:
        true,

      replaceHistory:
        true,

      scroll:
        false
    }
  );

}


/* =========================================================
   COMPATIBILITY ALIASES

   IMPORTANT:
   These aliases point INTO the new Teacher Studio router.

   They do not recreate the old router architecture.
========================================================= */

function activateStudentStudioPage(
  page,
  options = {}
){

  return activateTeacherStudioPage(
    page,
    options
  );

}


function openStudentStudioPage(
  page,
  options = {}
){

  return activateTeacherStudioPage(
    page,
    options
  );

}


function openTeacherStudioPage(
  page,
  options = {}
){

  return activateTeacherStudioPage(
    page,
    options
  );

}


function openTab(
  page
){

  return activateTeacherStudioPage(
    page
  );

}


function renderActiveStudentStudioPage(
  page
){

  return renderActiveTeacherStudioPage(
    page
  );

}


/* =========================================================
   LEGACY HELP COMPATIBILITY

   Old code used:
     help

   Current HTML uses:
     support

   support is canonical.
========================================================= */

function openTeacherHelpCenter(){

  return activateTeacherStudioPage(
    "support"
  );

}


/* =========================================================
   LEGACY MESSAGE COMPATIBILITY
========================================================= */

function openStudentMessages(){

  return activateTeacherStudioPage(
    "messages"
  );

}


/* =========================================================
   PART 18 COMPLETE

   AUTHORITATIVE PAGE NAMES:
   ---------------------------------------------------------
   overview
   classes
   students
   assignments
   submissions
   grading
   attendance
   quizzes
   schedule
   questionbank
   resources
   analytics
   ai
   messages
   settings
   support


   ALIASES:
   ---------------------------------------------------------
   help       -> support
   kabezya    -> ai
   calendar   -> schedule
   grades     -> grading
   assessment -> quizzes
   roster     -> students


   ONE PAGE ROUTER:
   ---------------------------------------------------------
   activateTeacherStudioPage()


   ONE RENDER ENTRY:
   ---------------------------------------------------------
   renderActiveTeacherStudioPage()


   ONE ACTION CONTROLLER:
   ---------------------------------------------------------
   dispatchTeacherStudioAction()


   ONE DOCUMENT ACTION LISTENER:
   ---------------------------------------------------------
   handleTeacherStudioActionClick()


   ONE NAVIGATION LISTENER:
   ---------------------------------------------------------
   handleTeacherStudioNavigationClick()


   DO NOT KEEP OLD DUPLICATE:
   ---------------------------------------------------------
   bindTeacherMessageControls()
   bindTeacherSupportControls()
   bindTeacherKabezyaControls()

   old activateStudentStudioPage implementation
   old renderActiveStudentStudioPage implementation
   old openStudentStudioPage implementation
   old document-wide action handlers


   PART 17 REQUIREMENT NOW SATISFIED:
   ---------------------------------------------------------
   isTeacherStudioPageActive("messages")


   HISTORY:
   ---------------------------------------------------------
   canonical URL:
     teacher.html?section=<page>

   Browser back/forward:
     supported via popstate


   PART 19 WILL ADD:
   ---------------------------------------------------------
   Socket.IO connection
   room registration
   realtime cache invalidation
   debounced refreshes
   submissions
   attendance
   schedules
   quizzes/messages where supported


   PART 20 WILL ADD:
   ---------------------------------------------------------
   final authentication startup
   initial loader orchestration
   workspace initialization
   initial route activation
   production runtime audit
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 19

   SOCKET.IO / REALTIME INTEGRATION
   ---------------------------------------------------------
   1. Socket state
   2. Backend socket URL
   3. Socket.IO client loader
   4. Authenticated room join
   5. Debounced refresh system
   6. Submission reconciliation
   7. Message refresh
   8. Schedule refresh
   9. Socket event registration
   10. Connection lifecycle
   11. Online/offline recovery
   12. Initialization

   IMPORTANT
   ---------------------------------------------------------
   Frontend:
     Vercel

   Backend + Socket.IO:
     Render

   Therefore DO NOT load:

     /socket.io/socket.io.js

   from the Vercel origin.

   Socket.IO client is loaded from:

     ${API}/socket.io/socket.io.js

   VERIFIED REALTIME EVENTS:
   ---------------------------------------------------------
   newMessage

   submission:new
   submission:updated
   submission:resubmitted
   submission:reviewed
   submission:graded
   submission:returned

   schedule:new was also established by the Schedule backend.

   Unknown event contracts are NOT invented.
========================================================= */


/* =========================================================
   SOCKET WORKSPACE STATE
========================================================= */

const teacherRealtimeState = {

  socket:
    null,

  clientPromise:
    null,

  connected:
    false,

  joined:
    false,

  initialized:
    false,

  reconnecting:
    false,

  refreshTimers:
    new Map(),

  lastEventAt:
    null

};


/* =========================================================
   SOCKET SERVER URL

   Part 1 already establishes:
     const API = "https://backend-1-9b6f.onrender.com";

   Keep Socket.IO tied to the same backend authority.
========================================================= */

function getTeacherSocketServerUrl(){

  const value =
    safeString(
      typeof API !==
        "undefined"
        ? API
        : ""
    )
      .replace(
        /\/+$/,
        ""
      );


  return value;

}


/* =========================================================
   SOCKET CLIENT SCRIPT URL
========================================================= */

function getTeacherSocketClientScriptUrl(){

  const base =
    getTeacherSocketServerUrl();


  if (
    !base
  ){

    return "";

  }


  return `${base}/socket.io/socket.io.js`;

}


/* =========================================================
   LOAD SOCKET.IO CLIENT

   Dynamic loading avoids the Vercel-origin 404.

   If another page/shared bundle already loaded Socket.IO,
   window.io is reused.
========================================================= */

function loadTeacherSocketIoClient(){

  if (
    typeof window.io ===
    "function"
  ){

    return Promise.resolve(
      window.io
    );

  }


  if (
    teacherRealtimeState
      .clientPromise
  ){

    return teacherRealtimeState
      .clientPromise;

  }


  teacherRealtimeState
    .clientPromise =
    new Promise(
      (
        resolve,
        reject
      ) => {

        const src =
          getTeacherSocketClientScriptUrl();


        if (
          !src
        ){

          reject(
            new Error(
              "Socket.IO backend URL is unavailable."
            )
          );


          return;

        }


        const existing =
          Array.from(
            document.scripts
          )
            .find(
              script =>
                script.src ===
                src
            );


        if (
          existing
        ){

          if (
            typeof window.io ===
            "function"
          ){

            resolve(
              window.io
            );


            return;

          }


          existing.addEventListener(
            "load",
            () => {

              if (
                typeof window.io ===
                "function"
              ){

                resolve(
                  window.io
                );

              }else{

                reject(
                  new Error(
                    "Socket.IO client loaded but window.io is unavailable."
                  )
                );

              }

            },
            {
              once:
                true
            }
          );


          existing.addEventListener(
            "error",
            () => {

              reject(
                new Error(
                  "Socket.IO client could not be loaded."
                )
              );

            },
            {
              once:
                true
            }
          );


          return;

        }


        const script =
          document.createElement(
            "script"
          );


        script.src =
          src;

        script.async =
          true;

        script.crossOrigin =
          "anonymous";


        script.onload =
          () => {

            if (
              typeof window.io ===
              "function"
            ){

              resolve(
                window.io
              );

            }else{

              reject(
                new Error(
                  "Socket.IO client loaded but did not initialize."
                )
              );

            }

          };


        script.onerror =
          () => {

            reject(
              new Error(
                `Socket.IO client failed to load from ${src}`
              )
            );

          };


        document.head
          .appendChild(
            script
          );

      }
    );


  return teacherRealtimeState
    .clientPromise;

}


/* =========================================================
   AUTHENTICATED USER FOR SOCKET
========================================================= */

function getTeacherSocketUserId(){

  return normalizeId(

    state.me?._id ||
    state.me?.id ||

    state.loggedUser?._id ||
    state.loggedUser?.id ||

    localStorage.getItem(
      "userId"
    )

  );

}


/* =========================================================
   SOCKET ROLE
========================================================= */

function getTeacherSocketRole(){

  return safeString(

    state.me?.role ||
    state.loggedUser?.role ||
    localStorage.getItem(
      "role"
    ),

    "teacher"

  )
    .toLowerCase();

}


/* =========================================================
   SOCKET TOKEN

   Part 1 already owns authoritative `token`.

   Do not create another token database.
========================================================= */

function getTeacherSocketToken(){

  if (
    typeof token !==
      "undefined" &&
    token
  ){

    return safeString(
      token
    );

  }


  return safeString(

    localStorage.getItem(
      "teacherToken"
    ) ||

    localStorage.getItem(
      "schoolToken"
    ) ||

    localStorage.getItem(
      "adminToken"
    ) ||

    localStorage.getItem(
      "token"
    )

  );

}


/* =========================================================
   JOIN AUTHENTICATED SOCKET ROOM
========================================================= */

function joinTeacherRealtimeRoom(){

  const socket =
    teacherRealtimeState
      .socket;


  if (
    !socket ||
    !socket.connected
  ){

    return false;

  }


  const userId =
    getTeacherSocketUserId();

  const role =
    getTeacherSocketRole();

  const authToken =
    getTeacherSocketToken();


  if (
    !userId ||
    !authToken
  ){

    console.warn(
      "Teacher realtime room could not be joined because authentication is incomplete."
    );


    return false;

  }


  socket.emit(
    "join",
    {
      userId,

      role,

      token:
        authToken
    }
  );


  return true;

}


/* =========================================================
   DEBOUNCED REALTIME REFRESH

   Socket events can arrive in bursts.

   Example:
     10 students submit at almost the same time.

   We do NOT perform 10 complete API reloads immediately.
========================================================= */

function scheduleTeacherRealtimeRefresh(
  key,
  callback,
  delay =
    350
){

  const normalizedKey =
    safeString(
      key
    );


  if (
    !normalizedKey ||
    typeof callback !==
      "function"
  ){

    return false;

  }


  const existing =
    teacherRealtimeState
      .refreshTimers
      .get(
        normalizedKey
      );


  if (
    existing
  ){

    window.clearTimeout(
      existing
    );

  }


  const timer =
    window.setTimeout(
      async () => {

        teacherRealtimeState
          .refreshTimers
          .delete(
            normalizedKey
          );


        try{

          await callback();

        }catch(
          error
        ){

          console.warn(
            `Realtime refresh "${normalizedKey}" failed:`,
            error
          );

        }

      },
      delay
    );


  teacherRealtimeState
    .refreshTimers
    .set(
      normalizedKey,
      timer
    );


  return true;

}


/* =========================================================
   CLEAR REALTIME TIMERS
========================================================= */

function clearTeacherRealtimeRefreshTimers(){

  teacherRealtimeState
    .refreshTimers
    .forEach(
      timer => {

        window.clearTimeout(
          timer
        );

      }
    );


  teacherRealtimeState
    .refreshTimers
    .clear();

}


/* =========================================================
   SUBMISSION PAYLOAD ID
========================================================= */

function getRealtimeSubmissionId(
  submission
){

  return normalizeId(
    submission?._id ||
    submission?.id
  );

}


/* =========================================================
   CHECK SUBMISSION BELONGS TO TEACHER SCOPE

   Socket payload is not treated as authorization.

   Only accept direct reconciliation when it matches one of
   the teacher's already-authorized classes.

   Otherwise a normal authenticated loader decides whether the
   teacher may see it.
========================================================= */

function isRealtimeSubmissionInTeacherScope(
  submission
){

  if (
    !submission
  ){

    return false;

  }


  const classId =
    normalizeId(
      submission
        ?.classId
        ?._id ||
      submission
        ?.classId ||
      submission
        ?.assignmentId
        ?.classId
  );


  if (
    !classId
  ){

    return false;

  }


  return Boolean(
    getTeacherClassById(
      classId
    )
  );

}


/* =========================================================
   RECONCILE SUBMISSION INTO LOCAL STATE
========================================================= */

function reconcileTeacherRealtimeSubmission(
  submission
){

  const submissionId =
    getRealtimeSubmissionId(
      submission
    );


  if (
    !submissionId ||
    !isRealtimeSubmissionInTeacherScope(
      submission
    )
  ){

    return false;

  }


  const index =
    state.submissions
      .findIndex(
        item =>
          sameId(
            getRealtimeSubmissionId(
              item
            ),
            submissionId
          )
      );


  if (
    index >=
    0
  ){

    state.submissions[
      index
    ] =
      submission;

  }else{

    state.submissions.unshift(
      submission
    );

  }


  finalizeTeacherLoadedData();


  return true;

}


/* =========================================================
   REFRESH SUBMISSION-DEPENDENT UI
========================================================= */

function refreshTeacherSubmissionDependentUi(){

  const page =
    getActiveTeacherStudioPage();


  switch(
    page
  ){

    case "overview":

      if (
        typeof renderStudioHome ===
        "function"
      ){

        renderStudioHome();

      }

      break;


    case "assignments":

      if (
        typeof renderTeacherAssignmentsWorkspace ===
        "function"
      ){

        renderTeacherAssignmentsWorkspace();

      }

      break;


    case "submissions":

      if (
        typeof renderTeacherSubmissionsWorkspace ===
        "function"
      ){

        renderTeacherSubmissionsWorkspace();

      }

      break;


    case "grading":

      if (
        typeof renderTeacherGradingWorkspace ===
        "function"
      ){

        renderTeacherGradingWorkspace();

      }

      break;


    case "students":

      if (
        typeof renderTeacherStudentsWorkspace ===
        "function"
      ){

        renderTeacherStudentsWorkspace();

      }


      refreshTeacherSelectedStudentFromCurrentState();

      break;


    case "analytics":

      refreshTeacherAnalyticsFromCurrentState();

      break;

  }

}


/* =========================================================
   HANDLE SUBMISSION SOCKET EVENT
========================================================= */

function handleTeacherRealtimeSubmission(
  eventName,
  payload
){

  teacherRealtimeState
    .lastEventAt =
    new Date();


  const reconciled =
    reconcileTeacherRealtimeSubmission(
      payload
    );


  if (
    reconciled
  ){

    refreshTeacherSubmissionDependentUi();


    return true;

  }


  /*
    If the payload cannot be safely matched locally, use the
    authenticated API loader rather than trusting socket data.
  */

  scheduleTeacherRealtimeRefresh(
    "submissions",
    async () => {

      await loadTeacherSubmissions();

      finalizeTeacherLoadedData();

      refreshTeacherSubmissionDependentUi();

    }
  );


  return false;

}


/* =========================================================
   HANDLE NEW MESSAGE

   Backend event:
     newMessage

   The full message payload is not forced into the conversation
   summary schema.

   We simply invalidate/refresh the verified inbox endpoint.
========================================================= */

function handleTeacherRealtimeNewMessage(
  payload
){

  teacherRealtimeState
    .lastEventAt =
    new Date();


  const currentUserId =
    getTeacherSocketUserId();

  const senderId =
    normalizeId(
      payload
        ?.sender
        ?._id ||
      payload
        ?.sender
  );


  const receiverId =
    normalizeId(
      payload
        ?.receiver
        ?._id ||
      payload
        ?.receiver
  );


  /*
    Ignore payloads that clearly do not involve this user.
  */

  if (
    currentUserId &&
    senderId &&
    receiverId &&
    !sameId(
      currentUserId,
      senderId
    ) &&
    !sameId(
      currentUserId,
      receiverId
    )
  ){

    return false;

  }


  teacherMessagesWorkspaceState
    .loaded =
    false;


  scheduleTeacherRealtimeRefresh(
    "messages",
    async () => {

      await loadTeacherMessageConversations();


      updateTeacherMessageUnreadBadges();


      if (
        isTeacherStudioPageActive(
          "messages"
        )
      ){

        await renderTeacherMessagesWorkspace();

      }

    },
    250
  );


  return true;

}


/* =========================================================
   HANDLE SCHEDULE SOCKET EVENT

   Existing Schedule backend established `schedule:new`.

   We use authenticated reload instead of trusting an
   incomplete schedule payload shape.
========================================================= */

function handleTeacherRealtimeSchedule(){

  teacherRealtimeState
    .lastEventAt =
    new Date();


  scheduleTeacherRealtimeRefresh(
    "schedules",
    async () => {

      await loadTeacherSchedules();

      finalizeTeacherLoadedData();


      if (
        isTeacherStudioPageActive(
          "schedule"
        )
      ){

        renderTeacherScheduleWorkspace();

      }


      if (
        isTeacherStudioPageActive(
          "overview"
        ) &&
        typeof renderTeacherOverviewSchedule ===
          "function"
      ){

        renderTeacherOverviewSchedule();

      }


      if (
        isTeacherStudioPageActive(
          "analytics"
        )
      ){

        refreshTeacherAnalyticsFromCurrentState();

      }

    },
    350
  );

}


/* =========================================================
   SOCKET CONNECTION STATUS

   No visual redesign.

   If an existing status element is later added, this updates
   it safely.
========================================================= */

function renderTeacherRealtimeStatus(){

  const indicator =
    $(
      "teacherRealtimeStatus"
    );


  if (
    !indicator
  ){

    return;

  }


  const connected =
    teacherRealtimeState
      .connected &&
    teacherRealtimeState
      .joined;


  indicator.dataset
    .status =
    connected
      ? "connected"
      : "offline";


  indicator.textContent =
    connected
      ? "Live"
      : "Offline";


  indicator.title =
    connected
      ? "Teacher Studio realtime updates are connected."
      : "Teacher Studio will continue using normal API requests.";

}


/* =========================================================
   SOCKET EVENT BINDINGS
========================================================= */

function bindTeacherSocketEvents(
  socket
){

  if (
    !socket
  ){

    return;

  }


  /*
    Defensive cleanup prevents duplicated handlers if Socket.IO
    reconnects or initialization is called again.
  */

  [
    "connect",
    "disconnect",
    "connect_error",
    "socketReady",
    "socketAuthError",
    "newMessage",

    "submission:new",
    "submission:updated",
    "submission:resubmitted",
    "submission:reviewed",
    "submission:graded",
    "submission:returned",

    "schedule:new"
  ]
    .forEach(
      eventName => {

        socket.off(
          eventName
        );

      }
    );


  /* -------------------------------------------------------
     CONNECT
  ------------------------------------------------------- */

  socket.on(
    "connect",
    () => {

      teacherRealtimeState
        .connected =
        true;

      teacherRealtimeState
        .joined =
        false;

      teacherRealtimeState
        .reconnecting =
        false;


      joinTeacherRealtimeRoom();


      renderTeacherRealtimeStatus();

    }
  );


  /* -------------------------------------------------------
     AUTHENTICATED ROOM READY
  ------------------------------------------------------- */

  socket.on(
    "socketReady",
    payload => {

      const authenticatedUserId =
        normalizeId(
          payload?.userId
        );


      if (
        authenticatedUserId &&
        sameId(
          authenticatedUserId,
          getTeacherSocketUserId()
        )
      ){

        teacherRealtimeState
          .joined =
          true;

      }


      renderTeacherRealtimeStatus();

    }
  );


  /* -------------------------------------------------------
     SOCKET AUTH FAILURE
  ------------------------------------------------------- */

  socket.on(
    "socketAuthError",
    payload => {

      teacherRealtimeState
        .joined =
        false;


      renderTeacherRealtimeStatus();


      console.warn(
        "Teacher realtime authentication rejected:",
        payload?.message ||
        "Unknown Socket.IO authentication error"
      );

    }
  );


  /* -------------------------------------------------------
     DISCONNECT
  ------------------------------------------------------- */

  socket.on(
    "disconnect",
    reason => {

      teacherRealtimeState
        .connected =
        false;

      teacherRealtimeState
        .joined =
        false;


      renderTeacherRealtimeStatus();


      console.info(
        "Teacher realtime disconnected:",
        reason
      );

    }
  );


  /* -------------------------------------------------------
     CONNECTION ERROR
  ------------------------------------------------------- */

  socket.on(
    "connect_error",
    error => {

      teacherRealtimeState
        .connected =
        false;

      teacherRealtimeState
        .joined =
        false;


      renderTeacherRealtimeStatus();


      console.warn(
        "Teacher realtime connection error:",
        error?.message ||
        error
      );

    }
  );


  /* -------------------------------------------------------
     MESSAGES
  ------------------------------------------------------- */

  socket.on(
    "newMessage",
    payload => {

      handleTeacherRealtimeNewMessage(
        payload
      );

    }
  );


  /* -------------------------------------------------------
     SUBMISSIONS
  ------------------------------------------------------- */

  [
    "submission:new",
    "submission:updated",
    "submission:resubmitted",
    "submission:reviewed",
    "submission:graded",
    "submission:returned"
  ]
    .forEach(
      eventName => {

        socket.on(
          eventName,
          payload => {

            handleTeacherRealtimeSubmission(
              eventName,
              payload
            );

          }
        );

      }
    );


  /* -------------------------------------------------------
     SCHEDULE
  ------------------------------------------------------- */

  socket.on(
    "schedule:new",
    payload => {

      handleTeacherRealtimeSchedule(
        payload
      );

    }
  );

}


/* =========================================================
   CREATE TEACHER SOCKET
========================================================= */

async function connectTeacherRealtime(){

  if (
    teacherRealtimeState
      .socket
  ){

    if (
      !teacherRealtimeState
        .socket
        .connected
    ){

      teacherRealtimeState
        .socket
        .connect();

    }


    return teacherRealtimeState
      .socket;

  }


  const socketServer =
    getTeacherSocketServerUrl();

  const authToken =
    getTeacherSocketToken();


  if (
    !socketServer ||
    !authToken
  ){

    console.warn(
      "Teacher realtime initialization skipped: backend or token unavailable."
    );


    return null;

  }


  const ioClient =
    await loadTeacherSocketIoClient();


  const socket =
    ioClient(
      socketServer,
      {

        /*
          Authentication is supplied in the handshake AND in
          the join event for compatibility with the hardened
          server block above.
        */

        auth:{
          token:
            authToken
        },


        transports:[
          "websocket",
          "polling"
        ],


        reconnection:
          true,


        reconnectionAttempts:
          Infinity,


        reconnectionDelay:
          1000,


        reconnectionDelayMax:
          8000,


        timeout:
          12000

      }
    );


  teacherRealtimeState
    .socket =
    socket;


  bindTeacherSocketEvents(
    socket
  );


  /*
    Socket.IO may already be connected before listeners were
    registered if transport setup was extremely fast.
  */

  if (
    socket.connected
  ){

    teacherRealtimeState
      .connected =
      true;


    joinTeacherRealtimeRoom();

  }


  return socket;

}


/* =========================================================
   DISCONNECT TEACHER REALTIME
========================================================= */

function disconnectTeacherRealtime(){

  clearTeacherRealtimeRefreshTimers();


  const socket =
    teacherRealtimeState
      .socket;


  if (
    socket
  ){

    socket.removeAllListeners();

    socket.disconnect();

  }


  teacherRealtimeState
    .socket =
    null;

  teacherRealtimeState
    .connected =
    false;

  teacherRealtimeState
    .joined =
    false;


  renderTeacherRealtimeStatus();

}


/* =========================================================
   BROWSER ONLINE

   When network connectivity returns, reconnect Socket.IO and
   refresh critical counters.
========================================================= */

function handleTeacherBrowserOnline(){

  if (
    teacherRealtimeState
      .socket
  ){

    if (
      !teacherRealtimeState
        .socket
        .connected
    ){

      teacherRealtimeState
        .socket
        .connect();

    }

  }else{

    connectTeacherRealtime()
      .catch(
        error => {

          console.warn(
            "Teacher realtime reconnect failed:",
            error
          );

        }
      );

  }


  /*
    Realtime events may have been missed while offline.

    Refresh lightweight, high-value datasets after recovery.
  */

  scheduleTeacherRealtimeRefresh(
    "online-recovery",
    async () => {

      const results =
        await Promise.allSettled([

          loadTeacherSubmissions(),

          loadTeacherSchedules(),

          loadTeacherMessageConversations()

        ]);


      results.forEach(
        result => {

          if (
            result.status ===
            "rejected"
          ){

            console.warn(
              "Teacher online recovery dataset failed:",
              result.reason
            );

          }

        }
      );


      finalizeTeacherLoadedData();

      updateTeacherMessageUnreadBadges();


      await renderActiveTeacherStudioPage();

    },
    700
  );

}


/* =========================================================
   BROWSER OFFLINE
========================================================= */

function handleTeacherBrowserOffline(){

  teacherRealtimeState
    .connected =
    false;

  teacherRealtimeState
    .joined =
    false;


  renderTeacherRealtimeStatus();

}


/* =========================================================
   INITIALIZE REALTIME
========================================================= */

function initializeTeacherRealtime(){

  if (
    teacherRealtimeState
      .initialized
  ){

    return;

  }


  teacherRealtimeState
    .initialized =
    true;


  window.addEventListener(
    "online",
    handleTeacherBrowserOnline
  );


  window.addEventListener(
    "offline",
    handleTeacherBrowserOffline
  );


  /*
    Do not make Socket.IO failure fatal to Teacher Studio.

    REST API remains the primary source of truth.
  */

  connectTeacherRealtime()
    .catch(
      error => {

        console.warn(
          "Teacher Studio realtime unavailable:",
          error
        );


        /*
          Teacher Studio continues normally through REST.
        */

        teacherRealtimeState
          .connected =
          false;

        teacherRealtimeState
          .joined =
          false;


        renderTeacherRealtimeStatus();

      }
    );

}


/* =========================================================
   PART 19 COMPLETE

   ARCHITECTURE:
   ---------------------------------------------------------
   REST API:
     authoritative persistent data

   Socket.IO:
     realtime notification / cache invalidation layer


   SOCKET HOST:
   ---------------------------------------------------------
   API
     =
   https://backend-1-9b6f.onrender.com

   Dynamic client:
     API + /socket.io/socket.io.js


   AUTHENTICATED JOIN:
   ---------------------------------------------------------
   frontend sends:

     {
       userId,
       role,
       token
     }

   backend verifies token

   backend derives authenticated userId from JWT

   browser-supplied userId is NOT authoritative


   VERIFIED MESSAGE EVENT:
   ---------------------------------------------------------
   newMessage

   action:
     invalidate message summary cache
     reload GET /api/messages
     update unread badge


   VERIFIED SUBMISSION EVENTS:
   ---------------------------------------------------------
   submission:new
   submission:updated
   submission:resubmitted
   submission:reviewed
   submission:graded
   submission:returned

   action:
     safely reconcile when class is already authorized

   otherwise:
     authenticated GET /api/submissions refresh


   VERIFIED SCHEDULE EVENT:
   ---------------------------------------------------------
   schedule:new

   action:
     authenticated schedule refresh


   SOCKET FAILURE:
   ---------------------------------------------------------
   does NOT break Teacher Studio

   Teacher Studio continues using normal API requests.


   ONLINE RECOVERY:
   ---------------------------------------------------------
   refresh:
     submissions
     schedules
     messages

   then:
     finalizeTeacherLoadedData()
     render active page


   DO NOT:
   ---------------------------------------------------------
   - trust socket payload as authorization
   - trust browser userId for room ownership
   - load /socket.io/socket.io.js from Vercel
   - create another global socket
   - reload entire Teacher Studio for every socket event
========================================================= */
/* =========================================================
   AIFT TEACHER STUDIO
   PRODUCTION REPLACEMENT
   PART 20

   FINAL STARTUP / BOOT ARCHITECTURE
   ---------------------------------------------------------
   1. Startup state
   2. Authentication validation
   3. Core identity loader
   4. Critical initial datasets
   5. Optional datasets
   6. Data finalization
   7. Workspace initialization
   8. Router initialization
   9. Realtime startup
   10. Runtime audit
   11. Error boundary
   12. ONE DOMContentLoaded startup

   IMPORTANT
   ---------------------------------------------------------
   This is the ONLY authoritative startup architecture.

   DO NOT keep old duplicate startup blocks such as:

     document.addEventListener("DOMContentLoaded", init)
     initTeacherStudio()
     initializeStudio()
     loadAll()
     bindTeacherOverviewControls()
     bindTeacherMessageControls()
     bindTeacherKabezyaControls()
     bindTeacherSupportControls()

   unless one of those names is explicitly retained below as
   a compatibility alias.

   Startup sequence:
   ---------------------------------------------------------
   AUTH
     ↓
   CURRENT USER
     ↓
   CRITICAL TEACHER DATA
     ↓
   OPTIONAL TEACHER DATA
     ↓
   FINALIZE STATE
     ↓
   INITIALIZE WORKSPACES
     ↓
   INITIALIZE ROUTER
     ↓
   ACTIVATE URL ROUTE
     ↓
   INITIALIZE MESSAGES
     ↓
   INITIALIZE REALTIME
========================================================= */


/* =========================================================
   STARTUP STATE
========================================================= */

const teacherStudioStartupState = {

  started:
    false,

  ready:
    false,

  loading:
    false,

  failed:
    false,

  error:
    null,

  initializedAt:
    null

};


/* =========================================================
   AUTHENTICATED ROLE
========================================================= */

function getTeacherStudioAuthenticatedRole(){

  return safeString(

    state.me?.role ||
    state.loggedUser?.role ||
    localStorage.getItem(
      "role"
    )

  )
    .toLowerCase();

}


/* =========================================================
   ROLE ACCESS
========================================================= */

function canAccessTeacherStudio(
  role
){

  return [
    "teacher",
    "school",
    "admin"
  ]
    .includes(
      safeString(
        role
      )
        .toLowerCase()
    );

}


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectTeacherStudioToLogin(){

  const returnUrl =
    `${window.location.pathname}${window.location.search}${window.location.hash}`;


  window.location.href =
    `login.html?redirect=${encodeURIComponent(
      returnUrl
    )}`;

}


/* =========================================================
   REDIRECT INVALID ROLE
========================================================= */

function redirectTeacherStudioInvalidRole(){

  window.location.href =
    "home.html";

}


/* =========================================================
   AUTH TOKEN CHECK
========================================================= */

function validateTeacherStudioToken(){

  const authToken =
    getTeacherSocketToken();


  if (
    !authToken
  ){

    redirectTeacherStudioToLogin();


    return false;

  }


  return true;

}


/* =========================================================
   LOAD CURRENT AUTHENTICATED USER

   Use the existing production current-user loader if Part 2
   defines one.

   Otherwise fall back only to the verified API helper.
========================================================= */

async function loadTeacherStudioCurrentUser(){

  if (
    typeof loadCurrentUser ===
      "function"
  ){

    const result =
      await loadCurrentUser();


    if (
      result
    ){

      state.me =
        result;

      state.loggedUser =
        result;

    }


    return (
      state.me ||
      state.loggedUser
    );

  }


  if (
    typeof loadTeacherProfile ===
      "function"
  ){

    const result =
      await loadTeacherProfile();


    if (
      result
    ){

      state.me =
        result;

      state.loggedUser =
        result;

    }


    return (
      state.me ||
      state.loggedUser
    );

  }


  /*
    Final safe API fallback.

    This path must match the authenticated "me" route already
    used by the wider AIFT application.

    If Part 2 has an authoritative current-user loader, this
    branch will never execute.
  */

  const candidates = [

    "/api/auth/me",
    "/api/users/me"

  ];


  let lastError =
    null;


  for (
    const path of candidates
  ){

    try{

      const result =
        await apiGet(
          path
        );


      const user =
        result?.user ||
        result?.data ||
        result;


      if (
        user &&
        typeof user ===
          "object"
      ){

        state.me =
          user;

        state.loggedUser =
          user;


        return user;

      }

    }catch(
      error
    ){

      lastError =
        error;


      /*
        404 means this particular compatibility route does not
        exist. Try the next known account path.

        Authentication errors should not be hidden.
      */

      if (
        Number(
          error?.status
        ) ===
        401
      ){

        throw error;

      }

    }

  }


  throw (
    lastError ||
    new Error(
      "Authenticated user could not be loaded."
    )
  );

}


/* =========================================================
   VALIDATE AUTHENTICATED USER
========================================================= */

function validateTeacherStudioUser(){

  const user =
    state.me ||
    state.loggedUser;


  if (
    !user
  ){

    throw new Error(
      "Authenticated Teacher Studio user is unavailable."
    );

  }


  const userId =
    normalizeId(
      user?._id ||
      user?.id
    );


  if (
    !userId
  ){

    throw new Error(
      "Authenticated user ID is unavailable."
    );

  }


  const role =
    getTeacherStudioAuthenticatedRole();


  if (
    !canAccessTeacherStudio(
      role
    )
  ){

    redirectTeacherStudioInvalidRole();


    return false;

  }


  /*
    Keep local session metadata synchronized for compatibility
    with the rest of AIFT.
  */

  localStorage.setItem(
    "userId",
    userId
  );


  if (
    role
  ){

    localStorage.setItem(
      "role",
      role
    );

  }


  return true;

}


/* =========================================================
   CRITICAL DATA LOADER

   Teacher Studio cannot function properly without classes.

   Assignments/submissions are also core because multiple
   workspaces derive student progress and grading state from
   them.
========================================================= */

async function loadTeacherStudioCriticalData(){

  const results =
    await Promise.allSettled([

      loadTeacherClasses(),

      loadTeacherAssignments(),

      loadTeacherSubmissions()

    ]);


  const labels = [

    "Classes",

    "Assignments",

    "Submissions"

  ];


  let classFailure =
    null;


  results.forEach(
    (
      result,
      index
    ) => {

      if (
        result.status ===
        "fulfilled"
      ){

        return;

      }


      console.error(
        `Critical Teacher Studio data failed: ${labels[index]}`,
        result.reason
      );


      if (
        index ===
        0
      ){

        classFailure =
          result.reason;

      }

    }
  );


  /*
    Classes are foundational.

    If they fail, teacher-scoped data cannot be established
    safely.
  */

  if (
    classFailure
  ){

    throw new Error(
      getErrorMessage(
        classFailure,
        "Teacher classes could not be loaded."
      )
    );

  }


  return results;

}


/* =========================================================
   OPTIONAL INITIAL DATA

   Failure of one optional dataset should not take the entire
   Teacher Studio offline.
========================================================= */

async function loadTeacherStudioOptionalData(){

  const loaders = [

    {
      label:
        "Attendance",

      run:
        () =>
          loadTeacherAttendance()
    },


    {
      label:
        "Schedule",

      run:
        () =>
          loadTeacherSchedules()
    },


    {
      label:
        "Quizzes",

      run:
        () =>
          loadTeacherQuizzes()
    },


    {
      label:
        "Quiz submissions",

      run:
        () =>
          loadTeacherQuizSubmissions()
    },


    {
      label:
        "Question Bank",

      run:
        () =>
          typeof loadTeacherQuestionBank ===
            "function"
            ? loadTeacherQuestionBank()
            : Promise.resolve()
    },


    {
      label:
        "Class modules",

      run:
        () =>
          typeof loadTeacherClassModules ===
            "function"
            ? loadTeacherClassModules()
            : Promise.resolve()
    },


    {
      label:
        "Class lessons",

      run:
        () =>
          typeof loadTeacherClassLessons ===
            "function"
            ? loadTeacherClassLessons()
            : Promise.resolve()
    }

  ];


  const results =
    await Promise.allSettled(
      loaders.map(
        loader =>
          loader.run()
      )
    );


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
          loaders[
            index
          ].label,
          result.reason
        );

      }

    }
  );


  return results;

}


/* =========================================================
   FINALIZE INITIAL DATA
========================================================= */

function finalizeTeacherStudioStartupData(){

  finalizeTeacherLoadedData();


  /*
    Ensure arrays exist even if optional calls failed.
  */

  state.classes =
    asArray(
      state.classes
    );

  state.assignments =
    asArray(
      state.assignments
    );

  state.submissions =
    asArray(
      state.submissions
    );

  state.attendance =
    asArray(
      state.attendance
    );

  state.schedules =
    asArray(
      state.schedules
    );

  state.quizzes =
    asArray(
      state.quizzes
    );

  state.quizSubmissions =
    asArray(
      state.quizSubmissions
    );


  return true;

}


/* =========================================================
   GLOBAL SHELL RENDER

   Uses existing shell helpers only when present.

   No duplicate shell implementation is created.
========================================================= */

function renderTeacherStudioShell(){

  const optionalRenderers = [

    "renderTeacherSidebar",

    "renderTeacherProfile",

    "renderTeacherTopbar",

    "renderTeacherIdentity",

    "renderTeacherOverviewSidebar",

    "renderTeacherNotificationCount"

  ];


  optionalRenderers
    .forEach(
      functionName => {

        const fn =
          window[
            functionName
          ];


        if (
          typeof fn ===
          "function"
        ){

          try{

            fn();

          }catch(
            error
          ){

            console.warn(
              `${functionName} failed during shell render:`,
              error
            );

          }

        }

      }
    );

}


/* =========================================================
   INITIALIZE WORKSPACES

   These do not all fetch data again.

   Most simply hydrate local workspace state and render when
   needed.
========================================================= */


function initializeTeacherStudioWorkspaces(){

  const initializers = [

    {
      name:
        "Classes",

      fn:
        initializeTeacherClassesWorkspace
    },


    {
      name:
        "Students",

      fn:
        initializeTeacherStudentsWorkspace
    },


    {
      name:
        "Assignments",

      fn:
        initializeTeacherAssignmentsWorkspace
    },


    {
      name:
        "Student Work",

      fn:
        initializeTeacherSubmissionsWorkspace
    },


    {
      name:
        "Grading",

      fn:
        initializeTeacherGradingWorkspace
    },


    {
      name:
        "Attendance",

      fn:
        initializeTeacherAttendanceWorkspace
    },


    {
      name:
        "Quizzes",

      fn:
        initializeTeacherQuizzesWorkspace
    },


    {
      name:
        "Schedule",

      fn:
        initializeTeacherScheduleWorkspace
    },


    {
      name:
        "Resources",

      fn:
        initializeTeacherResourcesWorkspace
    },


    {
      name:
        "Analytics",

      fn:
        initializeTeacherAnalyticsWorkspace
    },


    {
      name:
        "Kabezya",

      fn:
        initializeTeacherKabezyaWorkspace
    },


    {
      name:
        "Settings",

      fn:
        initializeTeacherSettingsWorkspace
    },


    {
      name:
        "Support",

      fn:
        initializeTeacherSupportWorkspace
    }

  ];


  initializers.forEach(
    item => {

      try{

        item.fn();

      }catch(
        error
      ){

        console.error(
          `${item.name} workspace initialization failed:`,
          error
        );


        throw error;

      }

    }
  );

}


/* =========================================================
   INITIALIZE MESSAGES

   Kept separate because Part 17 may make a network request.
========================================================= */

function initializeTeacherStudioMessages(){

  if (
    typeof initializeTeacherMessagesWorkspace !==
      "function"
  ){

    return;

  }


  try{

    initializeTeacherMessagesWorkspace();

  }catch(
    error
  ){

    console.warn(
      "Teacher Messages initialization failed:",
      error
    );

  }

}


/* =========================================================
   HIDE STARTUP LOADER
========================================================= */

function hideTeacherStudioStartupLoader(){

  const loaders = [

    $(
      "teacherStudioLoader"
    ),

    $(
      "teacherPageLoader"
    ),

    document.querySelector(
      ".teacher-studio-loader"
    )

  ]
    .filter(
      Boolean
    );


  loaders.forEach(
    element => {

      element.hidden =
        true;

      element.classList
        .add(
          "hidden"
        );

    }
  );


  document.body
    .classList
    .remove(
      "teacher-loading",
      "studio-loading"
    );

}


/* =========================================================
   SHOW STARTUP LOADER
========================================================= */

function showTeacherStudioStartupLoader(){

  document.body
    .classList
    .add(
      "teacher-loading"
    );


  const loader =

    $(
      "teacherStudioLoader"
    ) ||

    $(
      "teacherPageLoader"
    ) ||

    document.querySelector(
      ".teacher-studio-loader"
    );


  if (
    loader
  ){

    loader.hidden =
      false;

    loader.classList
      .remove(
        "hidden"
      );

  }

}


/* =========================================================
   STARTUP ERROR SCREEN
========================================================= */

function renderTeacherStudioFatalError(
  error
){

  const message =
    getErrorMessage(
      error,
      "Teacher Studio could not be initialized."
    );


  const main =

    $(
      "teacherStudioWorkspace"
    ) ||

    document.querySelector(
      ".teacher-main-content"
    ) ||

    document.querySelector(
      "main"
    );


  if (
    !main
  ){

    notifyAIFTError(
      message,
      {
        title:
          "Teacher Studio unavailable"
      }
    );


    return;

  }


  main.innerHTML = `
    <section
      class="teacher-workspace-empty teacher-startup-error"
    >

      <div
        class="teacher-workspace-empty-icon"
      >
        <i
          class="fa-solid fa-triangle-exclamation"
          aria-hidden="true"
        ></i>
      </div>


      <h2>
        Teacher Studio could not load
      </h2>


      <p>
        ${escapeHtml(message)}
      </p>


      <div
        class="teacher-startup-error-actions"
      >

        <button
          type="button"
          class="teacher-primary-button"
          onclick="window.location.reload()"
        >
          <i
            class="fa-solid fa-rotate"
            aria-hidden="true"
          ></i>

          Reload
        </button>


        <a
          href="login.html"
          class="teacher-secondary-button"
        >
          Sign in again
        </a>

      </div>

    </section>
  `;

}


/* =========================================================
   REQUIRED FUNCTION AUDIT
========================================================= */

function getTeacherStudioRequiredFunctions(){

  return [

    "$",

    "apiGet",

    "apiSend",

    "normalizeId",

    "sameId",

    "asArray",

    "escapeHtml",

    "safeString",

    "loadTeacherClasses",

    "loadTeacherAssignments",

    "loadTeacherSubmissions",

    "getTeacherClasses",

    "getTeacherAssignments",

    "getTeacherSubmissions",

    "finalizeTeacherLoadedData",

    "renderStudioHome",

    "renderTeacherClassesWorkspace",

    "renderTeacherStudentsWorkspace",

    "renderTeacherAssignmentsWorkspace",

    "renderTeacherGradingWorkspace",

    "renderTeacherAttendanceWorkspace",

    "renderTeacherQuizzesWorkspace",

    "renderTeacherScheduleWorkspace",

    "renderTeacherResourcesWorkspace",

    "renderTeacherAnalyticsWorkspace",

    "renderKabezyaTeacherAssistant",

    "renderTeacherMessagesWorkspace",

    "renderTeacherSettingsWorkspace",

    "renderTeacherSupportWorkspace",

    "activateTeacherStudioPage",

    "renderActiveTeacherStudioPage",

    "initializeTeacherStudioRouter"

  ];

}


/* =========================================================
   REQUIRED DOM PAGE AUDIT
========================================================= */

function getTeacherStudioRequiredPageIds(){

  return {

    overview:
      "teacherPageOverview",

    updates:
      "teacherPageUpdates",

    classes:
      "teacherPageClasses",

    students:
      "teacherPageStudents",

    assignments:
      "teacherPageAssignments",

    submissions:
      "teacherPageSubmissions",

grading:
  "teacherPageGrading",

attendance:
  "teacherPageAttendance",

schedule:
  "teacherPageSchedule",

resources:
  "teacherPageResources",

    analytics:
      "teacherPageAnalytics",

    ai:
      "teacherPageAI",

    messages:
      "teacherPageMessages",

    settings:
      "teacherPageSettings",

    support:
      "teacherPageSupport"

  };

}


/* =========================================================
   RUNTIME AUDIT

   This is diagnostic.

   It does NOT make Teacher Studio dependent on every optional
   detail host.
========================================================= */

function auditTeacherStudioRuntime(){

  const report = {

    missingFunctions:
      [],

    missingPages:
      [],

    duplicatePageNames:
      [],

    unresolvedActions:
      [],

    ok:
      true

  };


  /* -------------------------------------------------------
     FUNCTIONS
  ------------------------------------------------------- */

  getTeacherStudioRequiredFunctions()
    .forEach(
      functionName => {

        if (
          typeof window[
            functionName
          ] !==
          "function"
        ){

          report
            .missingFunctions
            .push(
              functionName
            );

        }

      }
    );


  /* -------------------------------------------------------
     PAGES
  ------------------------------------------------------- */

  const requiredPages =
    getTeacherStudioRequiredPageIds();


  Object.entries(
    requiredPages
  )
    .forEach(
      ([
        page,
        id
      ]) => {

        if (
          !$(
            id
          )
        ){

          report
            .missingPages
            .push({
              page,
              id
            });

        }

      }
    );


  /* -------------------------------------------------------
     DUPLICATE DATA PAGE VALUES
  ------------------------------------------------------- */

  const pageCounts =
    new Map();


  document
    .querySelectorAll(
      "[data-teacher-page]"
    )
    .forEach(
      section => {

        const page =
          normalizeTeacherStudioPage(
            section.dataset
              .teacherPage
          );


        pageCounts.set(
          page,
          (
            pageCounts.get(
              page
            ) ||
            0
          ) +
          1
        );

      }
    );


  pageCounts.forEach(
    (
      count,
      page
    ) => {

      if (
        count >
        1
      ){

        report
          .duplicatePageNames
          .push({
            page,
            count
          });

      }

    }
  );


/* -------------------------------------------------------
   DATA ACTIONS WITHOUT CENTRAL HANDLER

   IMPORTANT
   -------------------------------------------------------

   This list mirrors the current authoritative central action
   controller.

   When a new data-teacher-action is introduced, it must be:

     1. handled by the controller
     2. listed here

   Otherwise the runtime audit intentionally reports it.
------------------------------------------------------- */

const supportedActions =
  new Set([

    /* =====================================================
       GLOBAL
    ===================================================== */

    "navigate",


    /* =====================================================
       CLASSES
    ===================================================== */

    "open-class",

    "class-students",

    "class-assignments",

    "class-grading",

    "class-attendance",

    "class-schedule",

    "class-analytics",

    "clear-class-filters",

    "clear-class-filter",

    "clear-filters",

    "refresh-classes",

    "open-class-builder",

    "open-selected-class-builder",


    /* =====================================================
       STUDENTS
    ===================================================== */

    "open-student",

    "close-student-detail",

    "student-work",

    "student-grading",

    "student-attendance",

    "student-kabezya",

    "message-student",

    "student-class",

    "clear-student-filters",

    "refresh-students",


    /* =====================================================
       ASSIGNMENTS
    ===================================================== */

    "open-assignment",

    "create-assignment",

    "edit-assignment",

    "assignment-submissions",

    "assignment-grading",

    "delete-assignment",

    "save-assignment",

    "close-assignment-editor",

    "refresh-assignments",


    /* =====================================================
       STUDENT WORK / GRADING
    ===================================================== */

    "review-submission",

    "select-grading-submission",

    "save-submission-review",

    "close-submission-viewer",

    "submission-kabezya",

    "kabezya-review-submission",

    "grading-show-all",

    "refresh-grading",

    "refresh-submissions",


    /* =====================================================
       ATTENDANCE
    ===================================================== */

    "save-attendance",

    "set-attendance-status",

    "bulk-attendance",

    "attendance-present",

    "attendance-late",

    "attendance-absent",

    "attendance-excused",

    "attendance-student-history",

    "close-attendance-history",

    "attendance-today",

    "refresh-attendance",


    /* =====================================================
       SCHEDULE
    ===================================================== */

    "schedule-prev-month",

    "schedule-next-month",

    "open-schedule",

    "create-schedule",

    "edit-schedule",

    "delete-schedule",

    "save-schedule",

    "close-schedule-editor",

    "refresh-schedule",

    "start-schedule",

    "start-schedule-session",

    "join-schedule",

    "open-schedule-meeting",

    "complete-schedule",

    "complete-schedule-session",

    "schedule-attendance",

    "take-schedule-attendance",


    /* =====================================================
       RESOURCES
    ===================================================== */

    "refresh-resources",


    /* =====================================================
       ANALYTICS
    ===================================================== */

    "refresh-analytics",

    "analytics-open-student",

    "analytics-open-assignment",

    "analytics-ask-kabezya",


    /* =====================================================
       KABEZYA
    ===================================================== */

"dashboard-lesson-assistant",

"kabezya-mode",
"kabezya-quick-prompt",
"kabezya-clear-context",

"kabezya-new-conversation",
"kabezya-open-conversation",

"kabezya-copy-message",

"kabezya-edit-message",
"kabezya-save-message-edit",
"kabezya-cancel-message-edit",

"kabezya-use-feedback",


    /* =====================================================
       MESSAGES
    ===================================================== */

    "open-full-messages",

    "open-message-thread",

    "refresh-messages",

    "clear-message-search",


/* =====================================================
   SETTINGS
===================================================== */

"settings-page",
"save-teacher-settings",
"reset-teacher-settings",


    /* =====================================================
       SUPPORT
    ===================================================== */

    "open-help-topic",

    "close-help-topic",

    "support-talk-kabezya",

    "open-support-request",

    "close-support-request"

  ]);


/* =========================================================
   AUDIT DATA-TEACHER-ACTION REFERENCES

   Every element using:

     data-teacher-action="..."

   must either:

     1. have a real central action-controller handler
     2. be listed in supportedActions

   Unknown actions are surfaced by the runtime audit.
========================================================= */

document
  .querySelectorAll(
    "[data-teacher-action]"
  )
  .forEach(
    element => {

      const action =
        safeString(
          element.dataset
            .teacherAction
        );


      if (
        action &&
        !supportedActions.has(
          action
        )
      ){

        report
          .unresolvedActions
          .push(
            action
          );

      }

    }
  );


  report.unresolvedActions =
    [
      ...new Set(
        report.unresolvedActions
      )
    ];


  report.ok =
    !report.missingFunctions.length &&
    !report.missingPages.length &&
    !report.duplicatePageNames.length &&
    !report.unresolvedActions.length;


  if (
    report.ok
  ){

    console.info(
      "AIFT Teacher Studio runtime audit: OK"
    );

  }else{

    console.group(
      "AIFT Teacher Studio runtime audit"
    );

    console.log(
      report
    );

    console.groupEnd();

  }


  window.AIFTTeacherStudioAudit =
    report;


  return report;

}


/* =========================================================
   PAGE VISIBILITY RECONCILIATION

   Ensures old inline active classes do not cause multiple
   pages to appear before router activation.
========================================================= */

function resetTeacherStudioPageVisibility(){

  document
    .querySelectorAll(
      "[data-teacher-page], [data-studio-page]"
    )
    .forEach(
      section => {

        section.hidden =
          true;

        section.classList
          .remove(
            "active"
          );

        section.setAttribute(
          "aria-hidden",
          "true"
        );

      }
    );

}


/* =========================================================
   PRE-BOOT CLEANUP
========================================================= */

function prepareTeacherStudioBoot(){

  resetTeacherStudioPageVisibility();


  /*
    Remove stale body states from previous architecture.
  */

  document.body
    .classList
    .remove(
      "focus-students",
      "focus-teachers",
      "focus-classes",
      "focus-portal"
    );


  document.body
    .dataset.teacherSection =
    "";


  return true;

}


/* =========================================================
   FINAL TEACHER STUDIO STARTUP
========================================================= */

async function startTeacherStudio(){

  if (
    teacherStudioStartupState
      .started
  ){

    return teacherStudioStartupState
      .ready;

  }


  teacherStudioStartupState
    .started =
    true;

  teacherStudioStartupState
    .loading =
    true;

  teacherStudioStartupState
    .failed =
    false;

  teacherStudioStartupState
    .error =
    null;


  showTeacherStudioStartupLoader();


  try{

    /* =====================================================
       STEP 1
       LOCAL TOKEN
    ===================================================== */

    if (
      !validateTeacherStudioToken()
    ){

      return false;

    }


    /* =====================================================
       STEP 2
       PREPARE DOM
    ===================================================== */

    prepareTeacherStudioBoot();


    /* =====================================================
       STEP 3
       LOAD AUTHENTICATED USER
    ===================================================== */

    await loadTeacherStudioCurrentUser();


    if (
      !validateTeacherStudioUser()
    ){

      return false;

    }


    /* =====================================================
       STEP 4
       CRITICAL DATA
    ===================================================== */

    await loadTeacherStudioCriticalData();


    /* =====================================================
       STEP 5
       OPTIONAL DATA
    ===================================================== */

    await loadTeacherStudioOptionalData();


    /* =====================================================
       STEP 6
       FINALIZE AUTHORIZED STATE
    ===================================================== */

    finalizeTeacherStudioStartupData();


    /* =====================================================
       STEP 7
       SHELL
    ===================================================== */

    renderTeacherStudioShell();


    /* =====================================================
       STEP 8
       DEVICE / WORKSPACE SETTINGS
    ===================================================== */

    initializeTeacherStudioWorkspaces();


    /* =====================================================
       STEP 9
       CENTRAL ROUTER + ACTION CONTROLLER
    ===================================================== */

    initializeTeacherStudioRouter();


    /* =====================================================
       STEP 10
       INITIAL URL ROUTE
    ===================================================== */

    await initializeTeacherStudioRoute();


    /* =====================================================
       STEP 11
       MESSAGE SUMMARY SYSTEM
    ===================================================== */

    initializeTeacherStudioMessages();


    /* =====================================================
       STEP 12
       SOCKET.IO
    ===================================================== */

    initializeTeacherRealtime();


    /* =====================================================
       STEP 13
       FINAL AUDIT
    ===================================================== */

    const audit =
      auditTeacherStudioRuntime();


    if (
      !audit.ok
    ){

      console.warn(
        "Teacher Studio loaded with runtime audit warnings.",
        audit
      );

    }


    /* =====================================================
       READY
    ===================================================== */

    teacherStudioStartupState
      .ready =
      true;


    teacherStudioStartupState
      .initializedAt =
      new Date();


    document.body
      .classList
      .add(
        "teacher-studio-ready"
      );


    document.dispatchEvent(
      new CustomEvent(
        "teacherstudio:ready",
        {
          detail:{
            userId:
              getTeacherSocketUserId(),

            role:
              getTeacherStudioAuthenticatedRole(),

            page:
              getActiveTeacherStudioPage()
          }
        }
      )
    );


    return true;

  }catch(
    error
  ){

    teacherStudioStartupState
      .failed =
      true;

    teacherStudioStartupState
      .error =
      error;


    console.error(
      "Teacher Studio initialization failed:",
      error
    );


    /*
      Authentication failures should lead back to login.
    */

    if (
      Number(
        error?.status
      ) ===
      401
    ){

      redirectTeacherStudioToLogin();


      return false;

    }


    renderTeacherStudioFatalError(
      error
    );


    return false;

  }finally{

    teacherStudioStartupState
      .loading =
      false;


    hideTeacherStudioStartupLoader();

  }

}


/* =========================================================
   COMPATIBILITY STARTUP ALIASES

   Old code may still invoke one of these names from HTML.

   They all point into ONE startup architecture.
========================================================= */

async function initTeacherStudio(){

  return startTeacherStudio();

}


async function initializeTeacherStudio(){

  return startTeacherStudio();

}


async function initPage(){

  return startTeacherStudio();

}


/* =========================================================
   OLD loadAll COMPATIBILITY

   Some legacy code may still invoke loadAll().

   It no longer owns startup.

   It only reloads data into the existing authenticated
   Teacher Studio state.
========================================================= */

async function loadAll(){

  await loadTeacherStudioCriticalData();

  await loadTeacherStudioOptionalData();

  finalizeTeacherStudioStartupData();


  if (
    teacherStudioStartupState
      .ready
  ){

    await renderActiveTeacherStudioPage();

  }


  return state;

}


/* =========================================================
   SAFE FULL REFRESH
========================================================= */

async function refreshTeacherStudio(){

  try{

    await loadAll();


    updateTeacherMessageUnreadBadges();


    notifyAIFTSuccess(
      "Teacher Studio is up to date.",
      {
        title:
          "Refreshed"
      }
    );


    return true;

  }catch(
    error
  ){

    notifyAIFTError(
      getErrorMessage(
        error,
        "Teacher Studio could not be refreshed."
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
   PAGE UNLOAD CLEANUP
========================================================= */

function cleanupTeacherStudio(){

  try{

    disconnectTeacherRealtime();

  }catch(
    error
  ){

    console.warn(
      "Teacher realtime cleanup failed:",
      error
    );

  }


  clearTeacherRealtimeRefreshTimers();

}


/* =========================================================
   ONE DOM READY BOOT

   THIS SHOULD BE THE ONLY DOMContentLoaded STARTUP AT THE
   BOTTOM OF THE FINAL teacher.js FILE.
========================================================= */

if (
  document.readyState ===
  "loading"
){

  document.addEventListener(
    "DOMContentLoaded",
    () => {

      startTeacherStudio();

    },
    {
      once:
        true
    }
  );

}else{

  startTeacherStudio();

}


/* =========================================================
   UNLOAD CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",
  cleanupTeacherStudio
);


/* =========================================================
   DEBUG / PRODUCTION INSPECTION HANDLE

   Read-only convenience reference for console diagnostics.

   Do not put secrets here.
========================================================= */

window.AIFTTeacherStudio = {

  get ready(){

    return teacherStudioStartupState
      .ready;

  },


  get page(){

    return getActiveTeacherStudioPage();

  },


  get state(){

    return {

      userId:
        getTeacherSocketUserId(),

      role:
        getTeacherStudioAuthenticatedRole(),

      classes:
        getTeacherClasses()
          .length,

      students:
        getTeacherStudentRecords()
          .length,

      assignments:
        getTeacherAssignments()
          .length,

      submissions:
        getTeacherSubmissions()
          .length,

      realtime:
        {
          connected:
            teacherRealtimeState
              .connected,

          joined:
            teacherRealtimeState
              .joined
        }

    };

  },


  navigate(
    page
  ){

    return activateTeacherStudioPage(
      page
    );

  },


  refresh(){

    return refreshTeacherStudio();

  },


  audit(){

    return auditTeacherStudioRuntime();

  }

};


/* =========================================================
   PART 20 COMPLETE

   FINAL STARTUP:
   ---------------------------------------------------------
   startTeacherStudio()


   ONLY DOM READY STARTUP:
   ---------------------------------------------------------
   startTeacherStudio()


   BOOT ORDER:
   ---------------------------------------------------------
   token

       ↓

   authenticated user

       ↓

   role validation

       ↓

   classes
   assignments
   submissions

       ↓

   attendance
   schedules
   quizzes
   quiz submissions
   question bank
   modules
   lessons

       ↓

   finalizeTeacherLoadedData()

       ↓

   shell

       ↓

   settings
   support
   analytics
   Kabezya

       ↓

   central router

       ↓

   initial URL page

       ↓

   messages

       ↓

   Socket.IO

       ↓

   runtime audit

       ↓

   teacherstudio:ready


   COMPATIBILITY:
   ---------------------------------------------------------
   initTeacherStudio()
     -> startTeacherStudio()

   initializeTeacherStudio()
     -> startTeacherStudio()

   initPage()
     -> startTeacherStudio()

   loadAll()
     -> data reload only

   activateStudentStudioPage()
     -> activateTeacherStudioPage()

   openStudentStudioPage()
     -> activateTeacherStudioPage()

   openTab()
     -> activateTeacherStudioPage()


   DO NOT KEEP OLD DUPLICATES:
   ---------------------------------------------------------
   old DOMContentLoaded startup

   old initTeacherStudio implementation

   old loadAll implementation

   old bind-everything startup

   old Student Studio page router

   old Teacher Studio page router

   old Kabezya document listener

   old Messages document listener

   old Support document listener

   old duplicate Socket.IO setup
========================================================= */
