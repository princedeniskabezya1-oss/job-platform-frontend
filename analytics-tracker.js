"use strict";

(function initializeAiftAnalytics(global) {
  const DEFAULT_API_BASE =
    "https://backend-1-9b6f.onrender.com";

  const SESSION_STORAGE_KEY =
    "aiftAnalyticsSession";

  const EVENT_QUEUE = [];
  let flushTimer = null;

  function getApiBase() {
    return String(
      global.API_BASE ||
      DEFAULT_API_BASE
    ).replace(/\/+$/, "");
  }

  function getAuthToken() {
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
  }

  function createSessionId() {
    if (
      global.crypto &&
      typeof global.crypto.randomUUID === "function"
    ) {
      return global.crypto.randomUUID();
    }

    return [
      "session",
      Date.now(),
      Math.random().toString(36).slice(2),
      Math.random().toString(36).slice(2)
    ].join("-");
  }

  function getSessionId() {
    try {
      let sessionId =
        sessionStorage.getItem(
          SESSION_STORAGE_KEY
        );

      if (!sessionId) {
        sessionId = createSessionId();

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

  function normalizeSource(value) {
    const source = String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_");

    const allowed = new Set([
      "direct",
      "feed",
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
      "unknown"
    ]);

    return allowed.has(source)
      ? source
      : "unknown";
  }

  function getPageSource() {
    const params = new URLSearchParams(
      global.location.search
    );

    const explicitSource = params.get("source");

    if (explicitSource) {
      return normalizeSource(explicitSource);
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

    if (referrer.includes("messages")) {
      return "messages";
    }

    return "external";
  }

  function sanitizeMetadata(metadata) {
    if (
      !metadata ||
      typeof metadata !== "object" ||
      Array.isArray(metadata)
    ) {
      return {};
    }

    const allowedKeys = new Set([
      "tab",
      "section",
      "position",
      "resultIndex",
      "searchTerm",
      "contentType",
      "status",
      "deviceType",
      "viewerRole",
      "durationMs"
    ]);

    const clean = {};

    Object.entries(metadata).forEach(
      ([key, value]) => {
        if (!allowedKeys.has(key)) {
          return;
        }

        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          clean[key] =
            typeof value === "string"
              ? value.slice(0, 300)
              : value;
        }
      }
    );

    return clean;
  }

  async function sendEvent(event) {
    const token = getAuthToken();

    const response = await fetch(
      `${getApiBase()}/api/analytics/events`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
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

        body: JSON.stringify(event),

        keepalive: true
      }
    );

    if (!response.ok) {
      const payload = await response
        .json()
        .catch(() => ({}));

      throw new Error(
        payload.message ||
        `Analytics request failed with ${response.status}.`
      );
    }

    return response
      .json()
      .catch(() => ({
        success: true
      }));
  }

  async function track({
    schoolId,
    eventType,
    entityType = "school",
    entityId = null,
    source = null,
    metadata = {}
  }) {
    if (!schoolId || !eventType) {
      return {
        success: false,
        skipped: true,
        reason:
          "schoolId and eventType are required."
      };
    }

    const event = {
      schoolId: String(schoolId),
      eventType: String(eventType),
      entityType: String(entityType),
      entityId:
        entityId
          ? String(entityId)
          : null,

      source: normalizeSource(
        source || getPageSource()
      ),

      sessionId: getSessionId(),
      metadata: sanitizeMetadata(metadata)
    };

    try {
      return await sendEvent(event);
    } catch (error) {
      /*
        Analytics failures must not interrupt the page.
      */
      console.warn(
        "Analytics event was not recorded:",
        error.message
      );

      return {
        success: false,
        queued: false,
        message: error.message
      };
    }
  }

  function hasSessionEvent(key) {
    try {
      return (
        sessionStorage.getItem(
          `aiftAnalytics:${key}`
        ) === "1"
      );
    } catch (error) {
      return false;
    }
  }

  function markSessionEvent(key) {
    try {
      sessionStorage.setItem(
        `aiftAnalytics:${key}`,
        "1"
      );
    } catch (error) {
      /*
        Storage may be unavailable in private browsing.
      */
    }
  }

  async function trackOncePerSession(
    uniqueKey,
    event
  ) {
    if (!uniqueKey) {
      return track(event);
    }

    if (hasSessionEvent(uniqueKey)) {
      return {
        success: true,
        skipped: true,
        duplicate: true
      };
    }

    /*
      Mark before sending to prevent duplicate concurrent calls.
    */
    markSessionEvent(uniqueKey);

    const result = await track(event);

    /*
      Do not remove the session marker on a transient failure.
      Repeated automatic retries could inflate traffic.
    */
    return result;
  }

  global.AiftAnalytics = Object.freeze({
    track,
    trackOncePerSession,
    getSessionId,
    getPageSource
  });
})(window);
