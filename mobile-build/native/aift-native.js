(function () {
  "use strict";

  if (window.__AIFT_NATIVE_BRIDGE_LOADED__) return;
  window.__AIFT_NATIVE_BRIDGE_LOADED__ = true;

  const Capacitor = window.Capacitor || null;
  const Plugins = Capacitor && Capacitor.Plugins ? Capacitor.Plugins : {};
  const App = Plugins.App || null;
  const Keyboard = Plugins.Keyboard || null;
  const Network = Plugins.Network || null;
  const Share = Plugins.Share || null;
  const StatusBar = Plugins.StatusBar || null;

  function isNative() {
    return !!(Capacitor && typeof Capacitor.isNativePlatform === "function" && Capacitor.isNativePlatform());
  }

  if (!isNative()) return;

  document.documentElement.classList.add("aift-native-app");

  function normalizePageName() {
    const path = String(window.location.pathname || "").split("?")[0].split("#")[0];
    const page = path.substring(path.lastIndexOf("/") + 1).toLowerCase();
    return page || "index.html";
  }

  function isRootPage() {
    return new Set(["index.html", "home.html", "login.html"]).has(normalizePageName());
  }

  function closeVisibleUiLayer() {
    const selectors = [
      '[role="dialog"][aria-hidden="false"]',
      '.modal.show', '.modal.active', '.modal.open',
      '.overlay.active', '.drawer.open',
      '.sidebar.open', '.sidebar.active',
      '.sheet.open', '.sheet.active',
      '.menu.open', '.menu.active'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (!element) continue;
      const closeButton = element.querySelector('[data-close], .close, .close-btn, .modal-close, .drawer-close, button[aria-label="Close"]');
      if (closeButton && typeof closeButton.click === "function") {
        closeButton.click();
        return true;
      }
    }
    return false;
  }

  async function minimizeApp() {
    try {
      if (App && typeof App.minimizeApp === "function") await App.minimizeApp();
    } catch (error) {
      console.warn("[AIFT Native] Unable to minimize app:", error);
    }
  }

  async function handleBackButton(event) {
    if (closeVisibleUiLayer()) return;
    if (isRootPage()) return minimizeApp();
    if ((event && event.canGoBack) || window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.replace("home.html");
  }

  async function configureStatusBar() {
    if (!StatusBar) return;
    try {
      if (typeof StatusBar.setOverlaysWebView === "function") await StatusBar.setOverlaysWebView({ overlay: false });
      if (typeof StatusBar.setBackgroundColor === "function") await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
      if (typeof StatusBar.setStyle === "function") await StatusBar.setStyle({ style: "LIGHT" });
    } catch (error) {
      console.warn("[AIFT Native] Status bar configuration failed:", error);
    }
  }

  function installSafeAreaStyles() {
    const style = document.createElement("style");
    style.id = "aift-native-safe-area";
    style.textContent = `
      html.aift-native-app { background:#fff; }
      html.aift-native-app body {
        min-height:100dvh;
        padding-bottom:env(safe-area-inset-bottom, 0px);
      }
      html.aift-native-app .aift-native-safe-top { padding-top:env(safe-area-inset-top, 0px)!important; }
      html.aift-native-app .aift-native-safe-bottom { padding-bottom:env(safe-area-inset-bottom, 0px)!important; }
    `;
    document.head.appendChild(style);
  }

  async function configureKeyboard() {
    if (!Keyboard) return;
    try {
      if (typeof Keyboard.setResizeMode === "function") await Keyboard.setResizeMode({ mode: "native" });
      if (typeof Keyboard.setScroll === "function") await Keyboard.setScroll({ isDisabled: false });
    } catch (error) {
      console.warn("[AIFT Native] Keyboard configuration failed:", error);
    }
  }

  async function initializeNetwork() {
    if (!Network) return;
    try {
      const status = typeof Network.getStatus === "function" ? await Network.getStatus() : null;
      if (status) {
        document.documentElement.dataset.aiftConnection = status.connected ? "online" : "offline";
        window.dispatchEvent(new CustomEvent("aift:native-network", { detail: status }));
      }
      if (typeof Network.addListener === "function") {
        Network.addListener("networkStatusChange", function (nextStatus) {
          document.documentElement.dataset.aiftConnection = nextStatus.connected ? "online" : "offline";
          window.dispatchEvent(new CustomEvent("aift:native-network", { detail: nextStatus }));
        });
      }
    } catch (error) {
      console.warn("[AIFT Native] Network initialization failed:", error);
    }
  }

  function initializeLifecycle() {
    if (!App || typeof App.addListener !== "function") return;
    App.addListener("appStateChange", function (state) {
      window.dispatchEvent(new CustomEvent("aift:native-app-state", { detail: state }));
    });
    App.addListener("appUrlOpen", function (event) {
      window.dispatchEvent(new CustomEvent("aift:native-deep-link", { detail: event || {} }));
    });
  }

  function initializeBackButton() {
    if (!App || typeof App.addListener !== "function") return;
    App.addListener("backButton", function (event) {
      handleBackButton(event || {}).catch(function (error) {
        console.error("[AIFT Native] Back button handler failed:", error);
      });
    });
  }

  window.AIFTNative = Object.freeze({
    isNative: true,
    async share(options) {
      if (!Share || typeof Share.share !== "function") {
        if (navigator.share) return navigator.share(options || {});
        throw new Error("Native sharing is unavailable on this device.");
      }
      return Share.share(options || {});
    },
    async networkStatus() {
      if (Network && typeof Network.getStatus === "function") return Network.getStatus();
      return { connected: navigator.onLine, connectionType: "unknown" };
    },
    minimize: minimizeApp
  });

  async function initializeNativeBridge() {
    installSafeAreaStyles();
    initializeBackButton();
    initializeLifecycle();
    await Promise.allSettled([
      configureStatusBar(),
      configureKeyboard(),
      initializeNetwork()
    ]);
    window.dispatchEvent(new CustomEvent("aift:native-ready", { detail: { platform: "android" } }));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeNativeBridge, { once: true });
  } else {
    initializeNativeBridge();
  }
})();
