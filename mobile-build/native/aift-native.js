(function () {
  "use strict";

  if (window.__AIFT_NATIVE_BRIDGE_LOADED__) {
    return;
  }

  window.__AIFT_NATIVE_BRIDGE_LOADED__ = true;

  function normalizePageName() {
    const path = String(window.location.pathname || "").split("?")[0].split("#")[0];
    const page = path.substring(path.lastIndexOf("/") + 1).toLowerCase();
    return page || "index.html";
  }

  function isRootPage() {
    return new Set([
      "index.html",
      "home.html",
      "login.html"
    ]).has(normalizePageName());
  }

  function closeVisibleUiLayer() {
    const selectors = [
      '[role="dialog"][aria-hidden="false"]',
      '.modal.show',
      '.modal.active',
      '.modal.open',
      '.overlay.active',
      '.drawer.open',
      '.sidebar.open',
      '.sidebar.active'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;

      const closeButton = element.querySelector(
        '[data-close], .close, .close-btn, .modal-close, .drawer-close, button[aria-label="Close"]'
      );

      if (closeButton && typeof closeButton.click === "function") {
        closeButton.click();
        return true;
      }
    }

    return false;
  }

  function getAppPlugin() {
    return window.Capacitor &&
      window.Capacitor.Plugins &&
      window.Capacitor.Plugins.App
        ? window.Capacitor.Plugins.App
        : null;
  }

  async function minimizeApp(App) {
    try {
      if (App && typeof App.minimizeApp === "function") {
        await App.minimizeApp();
      }
    } catch (error) {
      console.warn("[AIFT Native] Unable to minimize app:", error);
    }
  }

  async function handleBackButton(App, event) {
    if (closeVisibleUiLayer()) {
      return;
    }

    if (isRootPage()) {
      await minimizeApp(App);
      return;
    }

    if (event && event.canGoBack) {
      window.history.back();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.replace("home.html");
  }

  function initializeNativeBridge() {
    const App = getAppPlugin();

    if (!App || typeof App.addListener !== "function") {
      return;
    }

    App.addListener("backButton", function (event) {
      handleBackButton(App, event || {}).catch(function (error) {
        console.error("[AIFT Native] Back button handler failed:", error);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNativeBridge, { once: true });
  } else {
    initializeNativeBridge();
  }
})();
