"use strict";

(function initializeAiftAnalytics(global) {
  /* =======================================================
     CONFIGURATION
  ======================================================= */

  const DEFAULT_API_BASE =
    "https://backend-1-9b6f.onrender.com";

  const SESSION_STORAGE_KEY =
    "aiftAnalyticsSession";

  const SESSION_EVENT_PREFIX =
    "aiftAnalytics:event:";

  const REQUEST_TIMEOUT_MS =
    8000;

  const MAX_METADATA_STRING_LENGTH =
    300;

  const MAX_TRACKED_SESSION_KEYS =
    500;

  const impressionObservers =
    new Set();

  const activeRequests =
    new Map();

  /* =======================================================
     SUPPORTED VALUES
  ======================================================= */

  const ALLOWED_SOURCES = new Set([
    "direct",
    "feed",
    "home",
    "network",
    "jobs",
    "search",
    "profile",
    "share",
    "messages",
    "career_hub",
    "dashboard",
    "notification",
    "email",
    "external",
    "classroom",
    "student_portal",
    "teacher_portal",
    "unknown"
  ]);

  /*
    Only browser-safe events should be sent through this
    frontend tracker.

    Follow, like, comment, attendance, submission, grading,
    and similar authoritative events are recorded by their
    real backend routes.
  */
  const ALLOWED_BROWSER_EVENTS = new Set([
    "profile_impression",
    "profile_view",
    "profile_unique_view",
    "profile_contact_click",
    "profile_website_click",
    "profile_message_click",
    "profile_share",

    "post_impression",
    "post_view",
    "post_unique_view",

    "student_view",
    "student_unique_view",

    "teacher_view",
    "teacher_unique_view",

    "class_view",
    "class_unique_view",

    "career_view",

    "search_impression",
    "search_click",

    "dashboard_view"
  ]);

  const ALLOWED_ENTITY_TYPES = new Set([
    "school",
    "post",
    "school_update",
    "student",
    "teacher",
    "class",
    "schedule",
    "attendance",
    "assignment",
    "submission",
    "opportunity",
    "application",
    "partnership",
    "search_result"
  ]);

  const ALLOWED_METADATA_KEYS = new Set([
    "tab",
    "section",
    "position",
    "resultIndex",
    "searchTerm",
    "contentType",
    "status",
    "deviceType",
    "viewerRole",
    "durationMs",
    "visibilityRatio",
    "pageName",
    "action",
    "placement",
    "queryLength",
    "resultCount",
    "firstLifetimeView",
    "hasCaption"
  ]);

  /* =======================================================
     API AND AUTHENTICATION
  ======================================================= */

  function getApiBase() {
    return String(
      global.API_BASE ||
      DEFAULT_API_BASE
    ).replace(/\/+$/, "");
  }

  function getAuthToken() {
    try {
      return (
        localStorage.getItem("schoolToken") ||
        localStorage.getItem("teacherToken") ||
        localStorage.getItem("studentToken") ||
        localStorage.getItem("employerToken") ||
        localStorage.getItem("talentToken") ||
        localStorage.getItem("agentToken") ||
        localStorage.getItem("adminToken") ||
        localStorage.getItem("token") ||
        ""
      );
    } catch (error) {
      return "";
    }
  }

  /* =======================================================
     SESSION
  ======================================================= */

  function createSessionId() {
    if (
      global.crypto &&
      typeof global.crypto.randomUUID ===
        "function"
    ) {
      return global.crypto.randomUUID();
    }

    return [
      "session",
      Date.now(),
      Math.random()
        .toString(36)
        .slice(2),
      Math.random()
        .toString(36)
        .slice(2)
    ].join("-");
  }

  function getSessionId() {
    try {
      let sessionId =
        sessionStorage.getItem(
          SESSION_STORAGE_KEY
        );

      if (!sessionId) {
        sessionId =
          createSessionId();

        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          sessionId
        );
      }

      return sessionId;
    } catch (error) {
      return createSessionId();
    }
  }

  /* =======================================================
     NORMALIZATION
  ======================================================= */

  function normalizeSource(value) {
    const source = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .slice(0, 80);

    return ALLOWED_SOURCES.has(source)
      ? source
      : "unknown";
  }

  function normalizeEventType(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .slice(0, 100);
  }

  function normalizeEntityType(value) {
    const entityType = String(
      value || "school"
    )
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_")
      .slice(0, 100);

    return ALLOWED_ENTITY_TYPES.has(
      entityType
    )
      ? entityType
      : "school";
  }

  function normalizeId(value) {
    const id = String(value || "")
      .trim();

    return /^[a-fA-F0-9]{24}$/.test(id)
      ? id
      : null;
  }

  function detectDeviceType() {
    const userAgent = String(
      global.navigator?.userAgent || ""
    ).toLowerCase();

    if (
      /bot|crawler|spider|slurp/.test(
        userAgent
      )
    ) {
      return "bot";
    }

    if (
      /ipad|tablet|kindle|silk|playbook/.test(
        userAgent
      )
    ) {
      return "tablet";
    }

    if (
      /mobile|iphone|ipod|android.*mobile|windows phone/.test(
        userAgent
      )
    ) {
      return "mobile";
    }

    return userAgent
      ? "desktop"
      : "unknown";
  }

  /* =======================================================
     SOURCE DETECTION
  ======================================================= */

  function getPageSource() {
    try {
      const params =
        new URLSearchParams(
          global.location.search
        );

      const explicitSource =
        params.get("source");

      if (explicitSource) {
        return normalizeSource(
          explicitSource
        );
      }
    } catch (error) {
      /*
        Continue using referrer detection.
      */
    }

    const referrer = String(
      document.referrer || ""
    ).toLowerCase();

    if (!referrer) {
      return "direct";
    }

    if (referrer.includes("network")) {
      return "network";
    }

    if (referrer.includes("jobs")) {
      return "jobs";
    }

    if (
      referrer.includes("home") ||
      referrer.includes("feed")
    ) {
      return "feed";
    }

    if (
      referrer.includes("messages") ||
      referrer.includes("conversation")
    ) {
      return "messages";
    }

    if (
      referrer.includes("notification")
    ) {
      return "notification";
    }

    if (
      referrer.includes("career")
    ) {
      return "career_hub";
    }

    if (
      referrer.includes("dashboard") ||
      referrer.includes("school.html")
    ) {
      return "dashboard";
    }

    return "external";
  }

  /* =======================================================
     METADATA
  ======================================================= */

  function sanitizeMetadata(metadata) {
    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return {};
    }

    const clean = {};

    Object.entries(metadata).forEach(
      ([key, value]) => {
        if (
          !ALLOWED_METADATA_KEYS.has(key)
        ) {
          return;
        }

        if (typeof value === "string") {
          clean[key] = value
            .trim()
            .slice(
              0,
              MAX_METADATA_STRING_LENGTH
            );

          return;
        }

        if (
          typeof value === "number" &&
          Number.isFinite(value)
        ) {
          clean[key] = value;
          return;
        }

        if (typeof value === "boolean") {
          clean[key] = value;
        }
      }
    );

    if (!clean.deviceType) {
      clean.deviceType =
        detectDeviceType();
    }

    return clean;
  }

  /* =======================================================
     SESSION DEDUPLICATION
  ======================================================= */

  function sessionEventStorageKey(key) {
    return (
      SESSION_EVENT_PREFIX +
      String(key || "")
        .trim()
        .slice(0, 300)
    );
  }

  function hasSessionEvent(key) {
    if (!key) {
      return false;
    }

    try {
      return (
        sessionStorage.getItem(
          sessionEventStorageKey(key)
        ) === "1"
      );
    } catch (error) {
      return false;
    }
  }

  function cleanupSessionEventKeys() {
    try {
      const matchingKeys = [];

      for (
        let index = 0;
        index < sessionStorage.length;
        index += 1
      ) {
        const key =
          sessionStorage.key(index);

        if (
          key &&
          key.startsWith(
            SESSION_EVENT_PREFIX
          )
        ) {
          matchingKeys.push(key);
        }
      }

      if (
        matchingKeys.length <=
        MAX_TRACKED_SESSION_KEYS
      ) {
        return;
      }

      matchingKeys
        .slice(
          0,
          matchingKeys.length -
            MAX_TRACKED_SESSION_KEYS
        )
        .forEach(key => {
          sessionStorage.removeItem(key);
        });
    } catch (error) {
      /*
        Storage cleanup is optional.
      */
    }
  }

  function markSessionEvent(key) {
    if (!key) {
      return;
    }

    try {
      cleanupSessionEventKeys();

      sessionStorage.setItem(
        sessionEventStorageKey(key),
        "1"
      );
    } catch (error) {
      /*
        Storage may be unavailable.
      */
    }
  }

  /* =======================================================
     NETWORK
  ======================================================= */

  async function sendEvent(event) {
    const token =
      getAuthToken();

    const controller =
      typeof AbortController ===
      "function"
        ? new AbortController()
        : null;

    const timeoutId =
      controller
        ? global.setTimeout(
            () => {
              controller.abort();
            },
            REQUEST_TIMEOUT_MS
          )
        : null;

    try {
      const response =
        await fetch(
          `${getApiBase()}/api/analytics/events`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "X-Analytics-Session":
                getSessionId(),

              "X-Analytics-Source":
                event.source,

              ...(token
                ? {
                    Authorization:
                      `Bearer ${token}`
                  }
                : {})
            },

            body:
              JSON.stringify(event),

            keepalive:
              true,

            ...(controller
              ? {
                  signal:
                    controller.signal
                }
              : {})
          }
        );

      const payload =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload.message ||
          `Analytics request failed with status ${response.status}.`
        );
      }

      return {
        success: true,
        ...payload
      };
    } finally {
      if (timeoutId) {
        global.clearTimeout(
          timeoutId
        );
      }
    }
  }

  /* =======================================================
     CORE TRACKING
  ======================================================= */

  async function track({
    schoolId,
    eventType,
    entityType = "school",
    entityId = null,
    source = null,
    metadata = {}
  }) {
    const cleanSchoolId =
      normalizeId(schoolId);

    const cleanEventType =
      normalizeEventType(eventType);

    const cleanEntityType =
      normalizeEntityType(entityType);

    const cleanEntityId =
      entityId
        ? normalizeId(entityId)
        : null;

    if (!cleanSchoolId) {
      return {
        success: false,
        skipped: true,
        reason:
          "A valid schoolId is required."
      };
    }

    if (
      !ALLOWED_BROWSER_EVENTS.has(
        cleanEventType
      )
    ) {
      return {
        success: false,
        skipped: true,
        reason:
          "This event is not allowed from the browser."
      };
    }

    if (entityId && !cleanEntityId) {
      return {
        success: false,
        skipped: true,
        reason:
          "A valid entityId is required."
      };
    }

    const event = {
      schoolId:
        cleanSchoolId,

      eventType:
        cleanEventType,

      entityType:
        cleanEntityType,

      entityId:
        cleanEntityId,

      source:
        normalizeSource(
          source ||
          getPageSource()
        ),

      sessionId:
        getSessionId(),

      metadata:
        sanitizeMetadata(metadata)
    };

    /*
      Prevent identical requests started at the same moment
      from being sent more than once.
    */
    const requestKey = [
      event.schoolId,
      event.eventType,
      event.entityType,
      event.entityId || "",
      JSON.stringify(event.metadata)
    ].join(":");

    if (activeRequests.has(requestKey)) {
      return activeRequests.get(
        requestKey
      );
    }

    const requestPromise = sendEvent(event)
      .catch(error => {
        /*
          Analytics must never interrupt the page.
        */
        console.warn(
          "Analytics event was not recorded:",
          error.name === "AbortError"
            ? "Request timed out."
            : error.message
        );

        return {
          success: false,
          queued: false,
          message:
            error.name === "AbortError"
              ? "Analytics request timed out."
              : error.message
        };
      })
      .finally(() => {
        activeRequests.delete(
          requestKey
        );
      });

    activeRequests.set(
      requestKey,
      requestPromise
    );

    return requestPromise;
  }

  async function trackOncePerSession(
    uniqueKey,
    event
  ) {
    const cleanKey =
      String(uniqueKey || "")
        .trim()
        .slice(0, 300);

    if (!cleanKey) {
      return track(event);
    }

    if (hasSessionEvent(cleanKey)) {
      return {
        success: true,
        skipped: true,
        duplicate: true
      };
    }

    /*
      Mark before sending to prevent simultaneous duplicate
      calls from separate page functions.
    */
    markSessionEvent(cleanKey);

    return track(event);
  }

  /* =======================================================
     SCHOOL PROFILE HELPERS
  ======================================================= */

  async function trackSchoolProfileView({
    schoolId,
    source = null,
    metadata = {}
  }) {
    const cleanSchoolId =
      normalizeId(schoolId);

    if (!cleanSchoolId) {
      return {
        success: false,
        skipped: true,
        reason:
          "A valid schoolId is required."
      };
    }

    const commonEvent = {
      schoolId:
        cleanSchoolId,

      entityType:
        "school",

      entityId:
        cleanSchoolId,

      source:
        source ||
        getPageSource(),

      metadata: {
        pageName:
          "school_public_profile",

        ...metadata
      }
    };

    const results =
      await Promise.allSettled([
        trackOncePerSession(
          `profile-impression:${cleanSchoolId}`,
          {
            ...commonEvent,
            eventType:
              "profile_impression"
          }
        ),

        track({
          ...commonEvent,
          eventType:
            "profile_view"
        }),

        trackOncePerSession(
          `profile-unique-view:${cleanSchoolId}`,
          {
            ...commonEvent,
            eventType:
              "profile_unique_view"
          }
        )
      ]);

    return {
      success:
        results.some(
          result =>
            result.status ===
              "fulfilled" &&
            result.value?.success
        ),

      results
    };
  }

  /* =======================================================
     POST IMPRESSION OBSERVER
  ======================================================= */

  function observePostImpressions({
    schoolId,
    selector =
      "[data-post-id][data-school-id]",
    minimumVisibleRatio = 0.5,
    minimumVisibleMs = 1000,
    source = "feed"
  } = {}) {
    if (
      typeof IntersectionObserver !==
      "function"
    ) {
      return {
        disconnect() {},
        observe() {},
        unsupported: true
      };
    }

    const timers =
      new WeakMap();

    const observer =
      new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            const element =
              entry.target;

            if (
              entry.isIntersecting &&
              entry.intersectionRatio >=
                minimumVisibleRatio
            ) {
              if (timers.has(element)) {
                return;
              }

              const timer =
                global.setTimeout(
                  () => {
                    timers.delete(
                      element
                    );

                    const postId =
                      element.dataset.postId;

                    const ownerSchoolId =
                      element.dataset.schoolId ||
                      schoolId;

                    if (
                      !normalizeId(postId) ||
                      !normalizeId(
                        ownerSchoolId
                      )
                    ) {
                      return;
                    }

                    trackOncePerSession(
                      `post-impression:${ownerSchoolId}:${postId}`,
                      {
                        schoolId:
                          ownerSchoolId,

                        eventType:
                          "post_impression",

                        entityType:
                          "post",

                        entityId:
                          postId,

                        source,

                        metadata: {
                          placement:
                            "feed",

                          visibilityRatio:
                            Number(
                              entry.intersectionRatio.toFixed(
                                2
                              )
                            )
                        }
                      }
                    );

                    observer.unobserve(
                      element
                    );
                  },
                  Math.max(
                    250,
                    Number(
                      minimumVisibleMs
                    ) || 1000
                  )
                );

              timers.set(
                element,
                timer
              );

              return;
            }

            const timer =
              timers.get(element);

            if (timer) {
              global.clearTimeout(
                timer
              );

              timers.delete(
                element
              );
            }
          });
        },
        {
          threshold: [
            0,
            Math.max(
              0.1,
              Math.min(
                1,
                Number(
                  minimumVisibleRatio
                ) || 0.5
              )
            ),
            1
          ]
        }
      );

    function observe(
      root = document
    ) {
      root
        .querySelectorAll(selector)
        .forEach(element => {
          observer.observe(element);
        });
    }

    function disconnect() {
      observer.disconnect();
      impressionObservers.delete(
        observer
      );
    }

    impressionObservers.add(
      observer
    );

    observe();

    return {
      observer,
      observe,
      disconnect,
      unsupported: false
    };
  }

  function disconnectAllObservers() {
    impressionObservers.forEach(
      observer => {
        observer.disconnect();
      }
    );

    impressionObservers.clear();
  }

  /* =======================================================
     PAGE DURATION
  ======================================================= */

  function createPageDurationTracker({
    schoolId,
    eventType = "dashboard_view",
    entityType = "school",
    entityId = null,
    source = null,
    metadata = {}
  }) {
    const startedAt =
      Date.now();

    let stopped =
      false;

    async function stop() {
      if (stopped) {
        return {
          success: true,
          skipped: true
        };
      }

      stopped =
        true;

      return track({
        schoolId,
        eventType,
        entityType,
        entityId,
        source,

        metadata: {
          ...metadata,
          durationMs:
            Math.max(
              0,
              Date.now() -
                startedAt
            )
        }
      });
    }

    return {
      startedAt,
      stop
    };
  }

  /* =======================================================
     PUBLIC API
  ======================================================= */

  global.AiftAnalytics =
    Object.freeze({
      track,
      trackOncePerSession,

      trackSchoolProfileView,
      observePostImpressions,
      disconnectAllObservers,
      createPageDurationTracker,

      getSessionId,
      getPageSource,
      getApiBase,
      detectDeviceType
    });
})(window);
